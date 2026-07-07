#!/usr/bin/env node
/**
 * seed-places.mjs  (SerpApi google_maps)
 *
 * Auto-discovers the TOP N places per category in Đà Lạt (default 50) and
 * writes them to ../curation-seed.csv — no manual name entry needed.
 * Pulls place_id, data_id, coords, rating, reviews, price, hours, phone,
 * photo for each. Then refine by hand and run fetch-reviews.mjs.
 *
 * Usage:
 *   SERPAPI_KEY=xxxx node seed-places.mjs
 *   node seed-places.mjs --top 50 --out ../curation-seed.csv
 *   node seed-places.mjs --top 30 --delay 400
 *
 * Cost: ~ceil(top/20) searches per category. 6 categories × top 50 ≈ 18 calls.
 * Requires Node >= 18. Reads scripts/.env if present.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "csv-stringify/sync";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const p = resolve(__dirname, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}
loadEnv();

function getArg(name, fb) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fb;
  const n = process.argv[i + 1];
  return n && !n.startsWith("--") ? n : true;
}
const TOP = Number(getArg("top", "50"));
const OUT = resolve(__dirname, getArg("out", "../curation-seed.csv"));
const LL = getArg("ll", "@11.9404,108.4583,13z");
const DELAY_MS = Number(getArg("delay", "300"));

const API_KEY = process.env.SERPAPI_KEY;
if (!API_KEY) { console.error("ERROR: set SERPAPI_KEY (env var or scripts/.env)."); process.exit(1); }

/* category -> Vietnamese search query for Đà Lạt */
const CATEGORY_QUERIES = {
  visit: "địa điểm tham quan du lịch Đà Lạt",
  cafe: "quán cà phê Đà Lạt",
  eat: "quán ăn ngon nhà hàng Đà Lạt",
  stay: "khách sạn homestay Đà Lạt",
  nightlife: "bar pub lounge Đà Lạt",
  activity: "khu vui chơi trải nghiệm Đà Lạt",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const COLUMNS = [
  "name_vi", "category", "area", "address", "lat", "lng", "rating", "review_count",
  "price_level", "hours", "phone", "est_visit_minutes", "persona_tags",
  "place_id", "data_id", "google_maps_url", "photo_source", "notes",
];

function priceLevel(price) {
  if (!price) return "";
  const d = String(price).match(/\$/g);
  return d ? Math.min(d.length, 3) : "";
}
function parseRange(s) {
  if (!s) return "";
  const low = s.toLowerCase();
  if (low.includes("24 hour") || low.includes("24h")) return "24h";
  const re = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[–\-to]+\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const m = s.match(re); if (!m) return "";
  const to24 = (h, mi, ap) => { h = +h; mi = mi ? +mi : 0; if (ap) { ap = ap.toLowerCase(); if (ap === "pm" && h !== 12) h += 12; if (ap === "am" && h === 12) h = 0; } return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`; };
  return `${to24(m[1], m[2], m[3])}-${to24(m[4], m[5], m[6])}`;
}
function formatHours(r) {
  if (r.operating_hours && typeof r.operating_hours === "object") {
    const t = new Map();
    for (const v of Object.values(r.operating_hours)) { const x = parseRange(String(v)); if (x) t.set(x, (t.get(x) || 0) + 1); }
    if (t.size) return [...t.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
  return r.hours ? parseRange(String(r.hours)) : "";
}

async function searchPage(query, start) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_maps");
  url.searchParams.set("type", "search");
  url.searchParams.set("q", query);
  url.searchParams.set("ll", LL);
  url.searchParams.set("hl", "vi");
  url.searchParams.set("start", String(start));
  url.searchParams.set("api_key", API_KEY);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  if (data.error) throw new Error(`SerpApi: ${data.error}`);
  return data.local_results || [];
}

function rowFrom(r, category) {
  return {
    name_vi: r.title || "",
    category,
    area: "",
    address: r.address || "",
    lat: r.gps_coordinates?.latitude ?? "",
    lng: r.gps_coordinates?.longitude ?? "",
    rating: r.rating ?? "",
    review_count: r.reviews ?? "",
    price_level: priceLevel(r.price),
    hours: formatHours(r),
    phone: r.phone || "",
    est_visit_minutes: "",
    persona_tags: "",
    place_id: r.place_id || "",
    data_id: r.data_id || "",
    google_maps_url: r.place_id ? `https://www.google.com/maps/place/?q=place_id:${r.place_id}` : "",
    photo_source: r.thumbnail || "",
    notes: "",
  };
}

async function main() {
  const rows = [];
  const seen = new Set();

  for (const [category, query] of Object.entries(CATEGORY_QUERIES)) {
    let got = 0;
    for (let start = 0; got < TOP; start += 20) {
      let results;
      try { results = await searchPage(query, start); }
      catch (e) { console.error(`x ${category} @${start}: ${e.message}`); break; }
      if (results.length === 0) break;
      for (const r of results) {
        if (got >= TOP) break;
        const key = r.place_id || r.title;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        rows.push(rowFrom(r, category));
        got++;
      }
      await sleep(DELAY_MS);
      if (results.length < 20) break; // last page
    }
    console.log(`+ ${category}: ${got} places`);
  }

  writeFileSync(OUT, "﻿" + stringify(rows, { header: true, columns: COLUMNS }), "utf8");
  console.log(`\nWrote ${rows.length} places -> ${OUT}`);
  console.log("Next: review/fill persona_tags + est_visit_minutes, then run fetch-reviews.mjs --in ../curation-seed.csv");
}

main().catch((e) => { console.error(e); process.exit(1); });
