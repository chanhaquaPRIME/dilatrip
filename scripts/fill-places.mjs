#!/usr/bin/env node
/**
 * fill-places.mjs  (SerpApi version)
 *
 * Reads the curation CSV and fills place facts using SerpApi's google_maps
 * engine: place_id, data_id, lat, lng, rating, review_count, price_level,
 * hours, google_maps_url, photo_source. Only EMPTY cells are filled
 * (unless --overwrite). data_id is needed later by fetch-reviews.mjs.
 *
 * You still curate by hand: category, area, persona_tags,
 * est_visit_minutes, notes.
 *
 * Usage:
 *   SERPAPI_KEY=xxxx node fill-places.mjs
 *   node fill-places.mjs --in ../curation-template.csv --out ../curation-filled.csv
 *   node fill-places.mjs --overwrite   # re-fill cells that already have values
 *   node fill-places.mjs --dry-run     # look up + log, write nothing
 *   node fill-places.mjs --delay 400   # ms between calls (default 250)
 *
 * Requires Node >= 18 (built-in fetch). Reads scripts/.env if present.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------- tiny .env loader (no dependency) ----------
function loadEnv() {
  const envPath = resolve(__dirname, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    const val = m[2].replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv();

// ---------- args ----------
function getArg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next && !next.startsWith("--") ? next : true;
}
const IN_PATH = resolve(__dirname, getArg("in", "../curation-template.csv"));
const OUT_PATH = resolve(__dirname, getArg("out", "../curation-filled.csv"));
const OVERWRITE = !!getArg("overwrite", false);
const DRY_RUN = !!getArg("dry-run", false);
const CITY_SUFFIX = getArg("city", "Đà Lạt, Lâm Đồng");
const DALAT_LL = getArg("ll", "@11.9404,108.4583,13z"); // bias search to Đà Lạt
const DELAY_MS = Number(getArg("delay", "250"));

const API_KEY = process.env.SERPAPI_KEY;
if (!API_KEY) {
  console.error("ERROR: set SERPAPI_KEY (env var or scripts/.env).");
  process.exit(1);
}

// Columns the script fills (added to the CSV header if missing).
const MANAGED = [
  "place_id", "data_id", "lat", "lng", "rating", "review_count",
  "price_level", "hours", "phone", "google_maps_url", "photo_source",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isEmpty = (v) => v === undefined || v === null || String(v).trim() === "";

// "$$" -> 2, "$" -> 1, etc. Range strings -> blank (let curator decide).
function priceLevel(price) {
  if (!price) return "";
  const dollars = String(price).match(/\$/g);
  if (dollars) return Math.min(dollars.length, 3);
  return "";
}

// Parse "8 AM–10 PM" / "8:30 AM – 10 PM" -> "08:00-22:00". "Open 24 hours" -> "24h".
function parseRange(s) {
  if (!s) return "";
  const low = s.toLowerCase();
  if (low.includes("24 hour") || low.includes("24h")) return "24h";
  if (low.includes("closed")) return "";
  const re = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[–\-to]+\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const m = s.match(re);
  if (!m) return "";
  const to24 = (h, min, ap) => {
    h = parseInt(h, 10); min = min ? parseInt(min, 10) : 0;
    if (ap) { ap = ap.toLowerCase(); if (ap === "pm" && h !== 12) h += 12; if (ap === "am" && h === 12) h = 0; }
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  };
  return `${to24(m[1], m[2], m[3])}-${to24(m[4], m[5], m[6])}`;
}

// From SerpApi operating_hours object pick the most common daily range.
function formatHours(place) {
  if (place.operating_hours && typeof place.operating_hours === "object") {
    const tally = new Map();
    for (const v of Object.values(place.operating_hours)) {
      const r = parseRange(String(v));
      if (r) tally.set(r, (tally.get(r) || 0) + 1);
    }
    if (tally.size) return [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
  if (place.hours) return parseRange(String(place.hours)) || "";
  return "";
}

async function lookupPlace(query) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_maps");
  url.searchParams.set("type", "search");
  url.searchParams.set("q", query);
  url.searchParams.set("ll", DALAT_LL);
  url.searchParams.set("hl", "vi");
  url.searchParams.set("api_key", API_KEY);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  if (data.error) throw new Error(`SerpApi: ${data.error}`);
  // A specific query returns place_results; a broad one returns local_results.
  return data.place_results || (data.local_results && data.local_results[0]) || null;
}

function valuesFromPlace(p) {
  const out = {};
  out.place_id = p.place_id || "";
  out.data_id = p.data_id || "";
  out.lat = p.gps_coordinates?.latitude ?? "";
  out.lng = p.gps_coordinates?.longitude ?? "";
  out.rating = p.rating ?? "";
  out.review_count = p.reviews ?? "";
  out.price_level = priceLevel(p.price);
  out.hours = formatHours(p);
  out.phone = p.phone || "";
  out.google_maps_url = p.place_id
    ? `https://www.google.com/maps/place/?q=place_id:${p.place_id}`
    : "";
  out.photo_source = p.thumbnail || "";
  return out;
}

async function main() {
  if (!existsSync(IN_PATH)) {
    console.error(`ERROR: input CSV not found: ${IN_PATH}`);
    process.exit(1);
  }

  const records = parse(readFileSync(IN_PATH, "utf8"), {
    columns: true, skip_empty_lines: true, bom: true,
  });

  const header = Object.keys(records[0] || {});
  for (const col of MANAGED) if (!header.includes(col)) header.push(col);

  let filled = 0, skipped = 0, failed = 0;

  for (const row of records) {
    for (const col of header) if (!(col in row)) row[col] = "";

    const name = (row.name_vi || "").trim();
    if (!name) { skipped++; continue; }

    const needsWork = OVERWRITE || MANAGED.some((c) => isEmpty(row[c]));
    if (!needsWork) { console.log(`= skip (filled): ${name}`); skipped++; continue; }

    const address = (row.address || "").trim();
    const query = [name, address, CITY_SUFFIX].filter(Boolean).join(", ");

    try {
      const place = await lookupPlace(query);
      if (!place) { console.warn(`! not found: ${name}  (q: ${query})`); failed++; await sleep(DELAY_MS); continue; }
      const vals = valuesFromPlace(place);
      for (const [k, v] of Object.entries(vals)) {
        if ((OVERWRITE || isEmpty(row[k])) && v !== "") row[k] = v;
      }
      console.log(`+ ${name} -> ${vals.rating || "?"}★ / ${vals.review_count || "?"} reviews`);
      filled++;
    } catch (err) {
      console.error(`x error for "${name}": ${err.message}`);
      failed++;
    }
    await sleep(DELAY_MS);
  }

  console.log(`\nDone. filled=${filled} skipped=${skipped} failed=${failed}`);
  if (DRY_RUN) { console.log("(dry-run: no file written)"); return; }

  const csv = stringify(records, { header: true, columns: header });
  writeFileSync(OUT_PATH, "﻿" + csv, "utf8"); // BOM so Excel reads UTF-8
  console.log(`Wrote: ${OUT_PATH}`);
  console.log("Next: run  node fetch-reviews.mjs  to add review stats.");
}

main().catch((e) => { console.error(e); process.exit(1); });
