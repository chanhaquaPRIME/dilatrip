# Concept — Đà Lạt Trip Planner (MVP)

## 1. Vision
A Vietnamese-language web app that lets domestic travelers plan a Đà Lạt
trip by browsing curated, ranked places and **dragging** their chosen ones
into a beautifully-designed schedule. Fast, few clicks, respects opening
hours, and produces a shareable, good-looking itinerary.

**One-liner (VN):** Người Việt lên lịch trình du lịch Đà Lạt bằng cách
kéo-thả các địa điểm đã được tuyển chọn & xếp hạng vào một thời gian biểu
đẹp mắt — nhanh, ít thao tác, đúng giờ mở cửa.

## 2. Locked decisions
- **City:** Đà Lạt only (MVP).
- **Language:** Vietnamese-first.
- **Data:** SerpApi (Google Maps) for offline curation + curated DB. No live social scraping, no per-user API calls.
- **No AI:** user builds the schedule by drag-and-drop; no generated plans.
- **Schedule logic:** smart-assisted manual (helpers, not automation).
- **Aesthetic:** Instagram-style, image-first, responsive.

## 3. Personas
Each persona changes filters, ranking weights, and default pace.

| Persona | Surfaced categories | Pace default | Notes |
|---|---|---|---|
| Solo (một mình) | cafés, walkable spots, hostels | balanced | safety, flexible timing |
| Couple (cặp đôi) | romantic, sunset, dinner, nice stays | relaxed | slower, scenic |
| Friends (nhóm bạn) | nightlife, adventure, photo spots | packed | shareable, group activities |
| Family (gia đình) | kid-friendly, short legs, rest breaks | relaxed | no late nights, accessible |

## 4. User flow
1. **Trip setup** — dates, persona, pace.
2. **Explore + Plan** (main screen).
3. **Export / Share** — image/PDF + link, Google Maps links, offline-readable.

## 5. Main screen layout
**Desktop — three panes:**
- **Left — Explore:** ranked place cards, image-first, persona-filtered.
  Each card shows the ranking reason and key facts.
- **Middle — Schedule:** day-by-day timeline. Drag a card into a day.
- **Right — Map:** live map pinning the day's stops.

**Mobile — three tabs:** Explore / Plan / Map.
- Primary action is one-tap "+ Thêm vào ngày" (add to day).
- Long-press drag as secondary; hover actions get tap equivalents.

## 6. Ranking ("statistical, not just comments")
Transparent score, reason always shown on the card.

```
score = w1 * rating
      + w2 * log10(review_count + 1)
      + w3 * persona_fit         // 0..1 from persona_tags
      + w4 * price_fit           // match to budget/pace
      + w5 * recency/trending    // optional, from data we hold
```

- Weights `w1..w5` differ per persona (see table in §3).
- Card reason example: `4.7★ · 2.300 đánh giá · ₫₫ · hợp cặp đôi · mở 8:00–22:00`.

**Review-stats layer (this is the real "statistical analysis"):**
We pull many reviews per place via SerpApi (`google_maps_reviews`) during
offline curation and precompute, per place:
- avg rating + rating distribution over analyzed reviews
- sentiment split (positive / neutral / negative)
- aspect mentions: % of reviews mentioning view, giá, phục vụ, đông đúc, etc.
Stored in `review-stats.json` and surfaced as card highlights, e.g.
`85% khen view · 30% nói hơi đắt`. Aspect keywords are configurable in
`scripts/review-aspects.json`.

## 7. Smart-assisted drag-drop (no AI)
When a user drops a place into a day:
- Auto-suggest the next open time slot.
- Warn if the place is closed at that time (Google hours).
- Respect hotel check-in (~14:00) / check-out (~12:00).
- Show travel time & distance to the previous stop (Directions API).
- Flag big zig-zags (far from the day's other stops).

## 8. Data model (initial)
```
Place(
  id, place_id (google), name_vi, category, area,
  lat, lng, rating, review_count, price_level,
  hours, photos[], google_maps_url, persona_tags[],
  est_visit_minutes, notes, score
)
Trip(id, persona, start_date, end_date, pace)
ScheduleItem(id, trip_id, day, start_time, place_id, order)
```
Categories: `eat`, `cafe`, `visit`, `stay`, `nightlife`, `activity`.

## 9. Tech stack
- Next.js + Tailwind + shadcn/ui + dnd-kit.
- Google Maps JS SDK + Directions API.
- Postgres + PostGIS, light Next API routes.

## 10. MVP boundaries
**In:** Đà Lạt, three-pane drag-drop, ranking + persona filter,
smart-assist hours/travel, export/share, responsive.
**Out (later):** multi-city, live social scraping, booking, login,
AI itineraries.

## 11. Data pipeline (offline curation)
1. Fill `name_vi` (+ `address`) in `curation-template.csv`.
2. `scripts/fill-places.mjs` (SerpApi google_maps) → `curation-filled.csv`
   with place_id, data_id, coords, rating, review_count, price, hours, photo.
3. `scripts/fetch-reviews.mjs` (SerpApi google_maps_reviews) →
   `review-stats.json` + `curation-with-reviews.csv` (aspect/sentiment stats).
4. (later) a script to emit the app-ready `Place` JSON for import.

## 12. Open items
- SerpApi key + free-tier quota (curate in one batch; credits don't roll over).
- SerpApi is a scraper intermediary (gray-area ToS) — only used offline, never per user.
- Photo attribution / licensing (prefer own/licensed hero photos).
- Curate ~40–80 Đà Lạt places (see `curation-template.csv` + `curation-guide.md`).

## 13. Design system (hand-authored, Instagram style)
- Clean white surfaces (`#fff`) on a light app bg (`#fafafa`); soft 1px
  borders (`#dbdbdb`); generous whitespace; rounded corners (12–16px).
- Single accent = the Instagram gradient
  (`#feda75 → #fa7e1e → #d62976 → #962fbf → #4f5bd5`) used sparingly on the
  logo, primary button, active persona, and "fit" badges.
- Image-first cards (16:10 photo on top), bold titles, muted metadata.
- System sans font stack; star/rating in dark, price in green, highlights as soft pills.
- See the working implementation in `prototype/`.

## 14. Prototype
A runnable, zero-build prototype lives in `prototype/` (open `index.html`).
It demonstrates the full flow with sample data: persona ranking, review-stat
highlights, drag-and-drop scheduling, smart-assist timing, live map, export,
and responsive Explore/Plan/Map tabs. Ports cleanly to the Next.js stack.
