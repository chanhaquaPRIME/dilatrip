#!/usr/bin/env node
/**
 * discover-maps.mjs — local browser automation (Playwright)
 *
 * Scrolls Google Maps search results to DISCOVER more places per category and
 * writes them to ../prototype/places-extra.js (merged into the app by data.js).
 * Targets totals: cafe 50, eat 50, stay 30 (it tops up beyond the curated set).
 *
 * It records name, coordinates, rating, reviews, price and the Maps link.
 * Real photos are added afterwards by scrape-maps.mjs (run it with --force).
 *
 * ⚠️ Automating Google Maps is against Google's ToS — local/personal use only.
 *
 * Run (after `npm install` in scripts):
 *   node discover-maps.mjs
 *   node discover-maps.mjs --headless
 *   node discover-maps.mjs --only cafe
 */

import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROTO = resolve(__dirname, "../prototype");
const EXTRA_JS = resolve(PROTO, "places-extra.js");

function getArg(name, fb) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fb;
  const n = process.argv[i + 1];
  return n && !n.startsWith("--") ? n : true;
}
const HEADLESS = !!getArg("headless", false);
const ONLY = getArg("only", "");
const CITY = getArg("city", "dalat");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Per-city config: search center, accepted-coordinate box, output file + global var, id suffix.
const CITIES = {
  dalat:    { label: "Đà Lạt",    center: "@11.9404,108.4583,12z", box: { minLat: 11.5, maxLat: 12.3,  minLng: 108.0, maxLng: 108.95 }, out: "places-extra.js",    varName: "PLACES_EXTRA",    idSuffix: "x"  },
  nhatrang: { label: "Nha Trang", center: "@12.2388,109.1967,13z", box: { minLat: 11.9, maxLat: 12.55, minLng: 108.9, maxLng: 109.45 }, out: "places-nhatrang.js", varName: "PLACES_NHATRANG", idSuffix: "nt" },
};
const CFG = CITIES[CITY];
if (!CFG) { console.error(`Unknown --city "${CITY}". Options: ${Object.keys(CITIES).join(", ")}`); process.exit(1); }
const EXTRA_OUT = resolve(PROTO, CFG.out);

const TARGETS = { visit: 50, cafe: 50, eat: 50, stay: 50, nightlife: 50, activity: 50, shopping: 50 };
const BOX = CFG.box; // anything outside the city box is rejected
const BASE_Q = {
  visit: "địa điểm tham quan du lịch",
  cafe: "quán cà phê",
  eat: "quán ăn nhà hàng",
  stay: "khách sạn homestay",
  nightlife: "quán bar pub beer club",
  activity: "khu du lịch trải nghiệm vui chơi",
  shopping: "cửa hàng đặc sản quà lưu niệm",
};
const QUERIES = Object.fromEntries(Object.entries(BASE_Q).map(([k, v]) => [k, `${v} ${CFG.label}`]));
const DEFAULTS = {
  visit: { hours: "07:00-17:00", visitMin: 60, price: 1, personas: ["couple", "family", "friends"], desc: "Điểm tham quan nổi bật" },
  cafe: { hours: "07:00-22:00", visitMin: 60, price: 1, personas: ["solo", "couple", "friends"], desc: "Quán cà phê được yêu thích" },
  eat: { hours: "10:00-21:00", visitMin: 75, price: 1, personas: ["solo", "couple", "friends", "family"], desc: "Quán ăn / nhà hàng" },
  stay: { hours: "24h", visitMin: 30, price: 2, personas: ["couple", "family", "solo"], desc: "Nơi lưu trú" },
  nightlife: { hours: "18:00-00:00", visitMin: 90, price: 1, personas: ["couple", "friends"], desc: "Địa điểm vui chơi về đêm" },
  activity: { hours: "07:30-17:00", visitMin: 120, price: 1, personas: ["friends", "family", "couple"], desc: "Hoạt động trải nghiệm" },
  shopping: { hours: "08:00-21:00", visitMin: 45, price: 1, personas: ["couple", "family", "friends", "solo"], desc: "Điểm mua sắm / đặc sản" },
};

function noDia(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"); }
function slug(s) { return noDia(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42); }
function norm(s) { return noDia(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function core(name) {
  let c = norm(name.split(/[-(|–]/)[0]);
  c = c.replace(/\bda lat\b/g, "").replace(/\bdalat\b/g, "").replace(/\s+/g, " ").trim();
  return c;
}
function isGeneric(name) {
  const t = norm(name)
    .replace(/\b(quan an|nha hang|restaurant|cafe|coffee|ca phe|tiem|the|quan|an|ngon|da lat|dalat|homestay|khach san)\b/g, "")
    .replace(/\s+/g, " ").trim();
  return t.length < 4;
}

function loadExisting() {
  const win = {};
  new Function("window", readFileSync(resolve(PROTO, "data.js"), "utf8"))(win);
  return win.PLACES;
}

async function handleConsent(page) {
  for (const sel of ['button[aria-label="Accept all"]', 'button[aria-label="Reject all"]', 'button[aria-label="Chấp nhận tất cả"]']) {
    const b = await page.$(sel); if (b) { await b.click().catch(() => {}); await sleep(1200); return; }
  }
  const t = page.locator('button:has-text("Accept all"), button:has-text("Chấp nhận")').first();
  if (await t.count().catch(() => 0)) { await t.click().catch(() => {}); await sleep(1200); }
}

async function discover(page, category, need) {
  // @lat,lng,zoom locks the search to the city so we don't get same-named places elsewhere
  await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(QUERIES[category])}/${CFG.center}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await handleConsent(page);
  await page.waitForSelector('a[href*="/maps/place/"]', { timeout: 20000 }).catch(() => {});
  await sleep(2500);

  // scroll the results feed until enough links are loaded (need extra to survive geo-filtering)
  let prev = 0;
  for (let i = 0; i < 45; i++) {
    const n = await page.$$eval('a[href*="/maps/place/"]', (a) => a.length).catch(() => 0);
    if (n >= need * 2 + 30) break;
    if (n === prev && i > 4) break;
    prev = n;
    await page.evaluate(() => {
      const f = document.querySelector('div[role="feed"]');
      if (f) f.scrollBy(0, 2200);
    }).catch(() => {});
    await sleep(1300);
  }

  return page.$$eval('a[href*="/maps/place/"]', (links) => {
    return links.map((a) => {
      const card = a.closest('div[role="feed"] > div') || a.parentElement;
      return {
        name: (a.getAttribute("aria-label") || "").trim(),
        href: a.href,
        text: card ? card.innerText : "",
        img: card ? (card.querySelector('img[src*="googleusercontent"]')?.src || "") : "",
      };
    });
  });
}

function parseResult(r, category) {
  const ll = r.href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const rm = r.text.match(/(\d)[.,](\d)(?!\d)/);
  const vm = r.text.match(/\(([\d.,]+)\)/);
  const hasDong = /₫/.test(r.text);
  const d = DEFAULTS[category];
  return {
    name: r.name,
    category,
    city: CITY,
    area: CFG.label,
    lat: ll ? parseFloat(ll[1]) : null,
    lng: ll ? parseFloat(ll[2]) : null,
    rating: rm ? parseFloat(rm[1] + "." + rm[2]) : 4.2,
    reviews: vm ? parseInt(vm[1].replace(/[.,]/g, ""), 10) : 0,
    price: hasDong ? d.price : d.price,
    hours: d.hours,
    visitMin: d.visitMin,
    personas: d.personas,
    highlights: [],
    desc: `${d.desc} tại ${CFG.label}.`,
    mapsUrl: r.href.split("?")[0],
  };
}

async function main() {
  // Only consider places already in THIS city (so Nha Trang isn't blocked by Đà Lạt names/counts).
  const existing = loadExisting().filter((p) => (p.city || "dalat") === CITY);
  const existingNames = new Set(existing.map((p) => norm(p.name)));
  const existingNorms = existing.map((p) => norm(p.name)).filter((s) => s.length >= 6);
  const seenCores = new Set(existing.map((p) => core(p.name)).filter((s) => s.length >= 5));
  const existingCount = {};
  for (const p of existing) existingCount[p.category] = (existingCount[p.category] || 0) + 1;
  console.log(`City: ${CFG.label} (${CITY}) — output ${CFG.out}`);

  let cats = Object.keys(TARGETS);
  if (ONLY) cats = cats.filter((c) => c === ONLY);

  const browser = await chromium.launch({ headless: HEADLESS, channel: "chrome", slowMo: 30 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "vi-VN" });
  const page = await context.newPage();

  const extras = [];
  const usedIds = new Set();

  for (const category of cats) {
    const need = Math.max(0, TARGETS[category] - (existingCount[category] || 0));
    if (need === 0) { console.log(`= ${category}: already at target`); continue; }
    console.log(`\n--- ${category}: need ${need} more (have ${existingCount[category] || 0}/${TARGETS[category]}) ---`);

    let results;
    try { results = await discover(page, category, need); }
    catch (e) { console.error(`x ${category}: ${e.message}`); continue; }

    let added = 0;
    for (const r of results) {
      if (added >= need) break;
      if (!r.name) continue;
      const key = norm(r.name);
      if (existingNames.has(key)) continue;                        // exact dupe
      if (isGeneric(r.name)) continue;                             // generic / SEO-ish name
      if (existingNorms.some((en) => key.includes(en))) continue;  // near-dupe of a curated place
      const ck = core(r.name);
      if (ck.length >= 5 && seenCores.has(ck)) continue;           // same core name as another place
      const p = parseResult(r, category);
      if (p.lat == null) continue;               // need coords for the map
      if (p.lat < BOX.minLat || p.lat > BOX.maxLat || p.lng < BOX.minLng || p.lng > BOX.maxLng) continue; // outside the city box
      existingNames.add(key);
      if (ck.length >= 5) seenCores.add(ck);
      let id = slug(p.name) + "-" + CFG.idSuffix;
      let n = 1; let uid = id + n;
      while (usedIds.has(uid)) { n++; uid = id + n; }
      usedIds.add(uid);
      p.id = uid;
      extras.push(p);
      added++;
      console.log(`+ ${p.name} (${p.rating}★, ${p.reviews})`);
    }
    console.log(`${category}: added ${added}`);
  }

  await browser.close();

  writeFileSync(EXTRA_OUT,
    `/* Auto-generated by scripts/discover-maps.mjs --city ${CITY} — places from Google Maps.\n` +
    `   Merged into PLACES by data.js. Run scrape-maps.mjs --city ${CITY} --force for real photos. */\n` +
    `window.${CFG.varName} = ` + JSON.stringify(extras, null, 2) + ";\n", "utf8");
  console.log(`\nDone. Wrote ${extras.length} places -> ${EXTRA_OUT}`);
  console.log(`Next: node scrape-maps.mjs --city ${CITY} --force   (downloads real photos for all, incl. these)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
