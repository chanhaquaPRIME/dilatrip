#!/usr/bin/env node
/**
 * fetch-reviews.mjs  (SerpApi google_maps_reviews)
 *
 * For each place in the curation CSV (needs a data_id from fill-places.mjs),
 * pulls multiple pages of reviews and computes statistics that power the
 * "ranked by statistical analysis, not just comments" feature:
 *   - avg rating + rating distribution over analyzed reviews
 *   - sentiment split (rating-based: >=4 pos, =3 neutral, <=2 neg)
 *   - aspect mentions (% of reviews mentioning view/price/service/...) using
 *     scripts/review-aspects.json
 *
 * Outputs:
 *   ../review-stats.json        (keyed by place_id; consumed by the app/ranking)
 *   ../curation-with-reviews.csv (adds a short review_highlights column)
 *
 * Usage:
 *   SERPAPI_KEY=xxxx node fetch-reviews.mjs
 *   node fetch-reviews.mjs --in ../curation-filled.csv --pages 3
 *   node fetch-reviews.mjs --pages 5 --delay 400
 *
 * Requires Node >= 18. Reads scripts/.env if present.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (!(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}
loadEnv();

function getArg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next && !next.startsWith("--") ? next : true;
}
const IN_PATH = resolve(__dirname, getArg("in", "../curation-filled.csv"));
const STATS_OUT = resolve(__dirname, getArg("stats", "../review-stats.json"));
const CSV_OUT = resolve(__dirname, getArg("out", "../curation-with-reviews.csv"));
const MAX_PAGES = Number(getArg("pages", "3")); // ~8 reviews/page
const DELAY_MS = Number(getArg("delay", "300"));

const API_KEY = process.env.SERPAPI_KEY;
if (!API_KEY) { console.error("ERROR: set SERPAPI_KEY (env var or scripts/.env)."); process.exit(1); }

const ASPECTS = JSON.parse(readFileSync(resolve(__dirname, "review-aspects.json"), "utf8"));
delete ASPECTS._comment;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchReviewPage(dataId, token) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_maps_reviews");
  url.searchParams.set("data_id", dataId);
  url.searchParams.set("hl", "vi");
  url.searchParams.set("sort_by", "newestFirst");
  url.searchParams.set("api_key", API_KEY);
  if (token) url.searchParams.set("next_page_token", token);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  if (data.error) throw new Error(`SerpApi: ${data.error}`);
  return {
    reviews: data.reviews || [],
    next: data.serpapi_pagination?.next_page_token || null,
  };
}

function reviewText(r) {
  return (r.snippet || r.extracted_snippet?.original || "").toString();
}

function analyze(reviews) {
  const n = reviews.length;
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0, pos = 0, neu = 0, neg = 0;
  const aspectCounts = Object.fromEntries(Object.keys(ASPECTS).map((k) => [k, 0]));

  for (const r of reviews) {
    const rating = Number(r.rating) || 0;
    if (rating >= 1 && rating <= 5) { dist[Math.round(rating)]++; sum += rating; }
    if (rating >= 4) pos++; else if (rating === 3) neu++; else if (rating > 0) neg++;

    const text = reviewText(r).toLowerCase();
    for (const [aspect, kws] of Object.entries(ASPECTS)) {
      if (kws.some((kw) => text.includes(kw.toLowerCase()))) aspectCounts[aspect]++;
    }
  }

  const pct = (x) => (n ? Math.round((x / n) * 100) : 0);
  const aspects = {};
  for (const [k, c] of Object.entries(aspectCounts)) aspects[k] = { count: c, pct: pct(c) };

  // Highlights = top 3 aspects by mention %.
  const highlights = Object.entries(aspects)
    .filter(([, v]) => v.pct >= 15)
    .sort((a, b) => b[1].pct - a[1].pct)
    .slice(0, 3)
    .map(([k, v]) => `${k} ${v.pct}%`);

  return {
    n_analyzed: n,
    avg_rating: n ? Number((sum / n).toFixed(2)) : null,
    rating_dist: dist,
    sentiment: { positive: pct(pos), neutral: pct(neu), negative: pct(neg) },
    aspects,
    highlights,
  };
}

async function main() {
  if (!existsSync(IN_PATH)) {
    console.error(`ERROR: input CSV not found: ${IN_PATH}. Run fill-places.mjs first.`);
    process.exit(1);
  }
  const records = parse(readFileSync(IN_PATH, "utf8"), { columns: true, skip_empty_lines: true, bom: true });
  const header = Object.keys(records[0] || {});
  if (!header.includes("review_highlights")) header.push("review_highlights");

  const stats = {};
  let ok = 0, miss = 0, fail = 0;

  for (const row of records) {
    for (const col of header) if (!(col in row)) row[col] = "";
    const name = (row.name_vi || "").trim();
    const dataId = (row.data_id || "").trim();
    if (!name) continue;
    if (!dataId) { console.warn(`! no data_id (run fill-places first): ${name}`); miss++; continue; }

    try {
      const reviews = [];
      let token = null;
      for (let page = 0; page < MAX_PAGES; page++) {
        const { reviews: batch, next } = await fetchReviewPage(dataId, token);
        reviews.push(...batch);
        token = next;
        await sleep(DELAY_MS);
        if (!token) break;
      }
      const a = analyze(reviews);
      stats[row.place_id || dataId] = { name_vi: name, ...a };
      row.review_highlights = a.highlights.join("; ");
      console.log(`+ ${name}: ${a.n_analyzed} reviews, avg ${a.avg_rating}★, ${a.highlights.join(", ") || "no strong aspects"}`);
      ok++;
    } catch (err) {
      console.error(`x error for "${name}": ${err.message}`);
      fail++;
    }
  }

  writeFileSync(STATS_OUT, JSON.stringify(stats, null, 2), "utf8");
  writeFileSync(CSV_OUT, "﻿" + stringify(records, { header: true, columns: header }), "utf8");
  console.log(`\nDone. ok=${ok} missing_data_id=${miss} failed=${fail}`);
  console.log(`Wrote: ${STATS_OUT}`);
  console.log(`Wrote: ${CSV_OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
