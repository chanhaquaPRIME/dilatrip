#!/usr/bin/env node
/**
 * server.mjs — tiny zero-dependency backend for the prototype.
 *
 * - Serves the prototype as static files at  http://localhost:5174
 * - Persists crowd-sourced persona tags in Upstash Redis when
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set (survives host
 *   restarts on free tiers), otherwise in a local  prototype/tags.json  file.
 *
 * API:
 *   GET  /api/tags            -> { placeId: {solo,couple,friends,family}, ... }
 *   POST /api/tags  {placeId, persona, delta:+1|-1}  -> updated counts for that place
 *
 * Run:  node server.mjs   (or: npm run serve)   then open http://localhost:5174
 */

import { createServer } from "node:http";
import { readFile, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../prototype");
// DATA_DIR lets a host mount a persistent disk for tags.json (falls back to prototype/ locally).
const DATA_DIR = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : ROOT;
const TAGS_FILE = resolve(DATA_DIR, "tags.json");
// Cloud hosts inject the port to listen on via $PORT.
const PORT = process.env.PORT || 5174;
const VALID = ["solo", "couple", "friends", "family"];

// ---- storage ----------------------------------------------------------------
// With Upstash creds -> votes live in Redis and survive host restarts (free
// tiers wipe the local disk). Without them -> a local JSON file (offline dev).
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = Boolean(REDIS_URL && REDIS_TOKEN);
const HKEY = "dilatrip:tags"; // Redis hash, field `${placeId}|${persona}` -> count

try { mkdirSync(DATA_DIR, { recursive: true }); } catch (e) { /* dir already exists */ }
let tags = {}; // in-memory view: { placeId: {solo,couple,friends,family} }

const emptyCounts = () => ({ solo: 0, couple: 0, friends: 0, family: 0 });

async function redis(cmd) {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
  const j = await res.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

// Refresh `tags` from the store (Redis if configured, else the local file).
async function loadTags() {
  if (useRedis) {
    const flat = await redis(["HGETALL", HKEY]); // [field, val, field, val, ...]
    const out = {};
    for (let i = 0; i < flat.length; i += 2) {
      const sep = flat[i].lastIndexOf("|");
      const pid = flat[i].slice(0, sep), per = flat[i].slice(sep + 1);
      (out[pid] ||= emptyCounts())[per] = parseInt(flat[i + 1], 10) || 0;
    }
    tags = out;
  } else {
    try { tags = JSON.parse(readFileSync(TAGS_FILE, "utf8")); } catch (e) { tags = {}; }
  }
}

// Apply one vote atomically; return that place's fresh counts.
async function applyVote(placeId, persona, delta) {
  const step = delta > 0 ? 1 : -1;
  const c = tags[placeId] || emptyCounts();
  if (useRedis) {
    const field = `${placeId}|${persona}`;
    let n = await redis(["HINCRBY", HKEY, field, step]);
    if (n < 0) { await redis(["HSET", HKEY, field, 0]); n = 0; } // clamp: never negative
    c[persona] = n;
  } else {
    c[persona] = Math.max(0, (c[persona] || 0) + step);
    try { writeFileSync(TAGS_FILE, JSON.stringify({ ...tags, [placeId]: c }, null, 2)); } catch (e) { console.error(e); }
  }
  tags[placeId] = c;
  return c;
}

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp",
};

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const server = createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/api/tags" && req.method === "GET") {
    try { await loadTags(); } catch (e) { console.error("loadTags:", e.message); }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(tags));
    return;
  }

  if (url.pathname === "/api/tags" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 1e4) req.destroy(); });
    req.on("end", async () => {
      try {
        const { placeId, persona, delta } = JSON.parse(body || "{}");
        if (!placeId || !VALID.includes(persona)) { res.writeHead(400); res.end("bad request"); return; }
        const c = await applyVote(placeId, persona, delta);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(c));
      } catch (e) { console.error("vote:", e.message); res.writeHead(500); res.end("error"); }
    });
    return;
  }

  // ---- static files (prototype/) ----
  let p = decodeURIComponent(url.pathname);
  if (p === "/") p = "/index.html";
  const filePath = resolve(ROOT, "." + p);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end("forbidden"); return; }
  readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[extname(filePath).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
});

await loadTags().catch((e) => console.error("Initial loadTags failed:", e.message));
server.listen(PORT, "0.0.0.0", () => console.log(`Đilatrip server chạy tại cổng ${PORT}  (lưu thẻ: ${useRedis ? "Upstash Redis" : TAGS_FILE})`));
