# Prototype — Đà Lạt Trip Planner

A self-contained, **zero-build** prototype of the planner. No install, no
server — just open `index.html` in a browser.

## Run it
- Double-click `prototype/index.html`, **or**
- For best results (map iframe + images) be online and serve it:
  ```
  cd prototype
  npx serve .        # or: python -m http.server 8000
  ```

## What it demonstrates
- **Three-pane layout** (desktop): Khám phá (Explore) · Lịch trình (Schedule) · Bản đồ (Map).
- **Persona-aware ranking** — switch 🧍/💑/👯/👨‍👩‍👧; cards re-rank and show a
  "Hợp [persona]" badge. Score = rating + popularity + persona fit.
- **Review-stat highlights** on every card (e.g. "85% khen view") — mimics the
  output of `scripts/fetch-reviews.mjs`.
- **Place detail** — click a card to open more photos (gallery) + sample
  comments, with phone, hours, Maps link, and "+ Thêm vào ngày".
- **Schedule "buckets"** — drop generic time blocks (Di chuyển, Ăn uống, Nghỉ,
  Ngủ/Khách sạn, Cà phê, Tự do) into a day alongside real places.
- **Phone numbers** show on each scheduled place (tap to call) next to its Maps link.
- **Export** opens a summary modal with a **Tải PDF** (download) button — no print dialog.
- **Dark mode** toggle (🌙/☀️) in the header, remembered across visits.
- **Drag & drop** a card into a day (desktop) — or tap **+** (mobile-friendly).
- **Smart-assist timing** — auto-suggests start times, shows travel time
  between stops, warns if a place is likely closed, respects hotel check-in (14:00).
- **Editable visit duration** — change the per-stop duration (dropdown on each
  schedule item) and the whole day's timing recalculates.
- **Add / delete days** — "+ Thêm ngày" adds a day; the × on a day tab removes it.
- **Map (Leaflet + OpenStreetMap, no key needed):** searching/filtering shows
  **all** matching places as markers (auto-fit); clicking a place (card, schedule
  item, or marker) shows **only that one**. "Mở cả ngày trên Google Maps" opens
  a multi-stop route; each place also has its own Maps link.
- **Export** — print/save the itinerary as a clean shareable sheet.
- **Responsive** — under 1100px it collapses to Explore/Plan/Map tabs.

## Notes
- `data.js` now holds **~105 real, hand-curated Đà Lạt places** (≈20 per
  category) compiled from web research. Place names, categories, areas,
  descriptions and rough hours are real; **ratings, review counts and
  coordinates are approximate estimates** (no API), and phone is only on
  well-documented venues. Swap in verified data later via `../scripts`.
- Photos load from Unsplash when online; offline they fall back to a gradient
  + category emoji, so the UI still looks clean.
- Design is hand-authored (Instagram style): clean white surfaces, soft
  borders, the IG gradient as the single accent, image-first cards.

## Files
- `index.html` — layout shell
- `styles.css` — design system
- `app.js` — state, ranking, time engine, drag & drop, map, export
- `data.js` — sample Đà Lạt places + review highlights
