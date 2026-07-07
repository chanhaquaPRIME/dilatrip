#!/usr/bin/env node
/**
 * server.mjs — tiny zero-dependency backend for the prototype.
 *
 * - Serves the prototype as static files at  http://localhost:5174
 * - Persists crowd-sourced persona tags in  prototype/tags.json
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

try { mkdirSync(DATA_DIR, { recursive: true }); } catch (e) { /* dir already exists */ }
let tags = {};
try { tags = JSON.parse(readFileSync(TAGS_FILE, "utf8")); } catch (e) { tags = {}; }
function saveTags() { try { writeFileSync(TAGS_FILE, JSON.stringify(tags, null, 2)); } catch (e) { console.error(e); } }

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

const server = createServer((req, res) => {
  cors(res);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/api/tags" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(tags));
    return;
  }

  if (url.pathname === "/api/tags" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 1e4) req.destroy(); });
    req.on("end", () => {
      try {
        const { placeId, persona, delta } = JSON.parse(body || "{}");
        if (!placeId || !VALID.includes(persona)) { res.writeHead(400); res.end("bad request"); return; }
        const c = tags[placeId] || { solo: 0, couple: 0, friends: 0, family: 0 };
        c[persona] = Math.max(0, (c[persona] || 0) + (delta > 0 ? 1 : -1));
        tags[placeId] = c;
        saveTags();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(c));
      } catch (e) { res.writeHead(500); res.end("error"); }
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

server.listen(PORT, "0.0.0.0", () => console.log(`Đilatrip server chạy tại cổng ${PORT}  (tags -> ${TAGS_FILE})`));
