# Scripts

Curation pipeline for the Đà Lạt Trip Planner. Uses **SerpApi** (Google Maps
data) so we can pull many reviews — the official Places API caps reviews at 5.

## What each script does
- **seed-places.mjs** — auto-discovers the **top N places per category**
  (default 50) in Đà Lạt via SerpApi `google_maps` and writes
  `../curation-seed.csv`. No manual name entry needed.
- **fill-places.mjs** — fills place facts via SerpApi `google_maps`:
  `place_id, data_id, lat, lng, rating, review_count, price_level, hours,
  phone, google_maps_url, photo_source`. Use this when you curate names by hand.
- **fetch-reviews.mjs** — uses `data_id` to pull many reviews via SerpApi
  `google_maps_reviews` and computes stats (avg rating, distribution,
  sentiment, aspect mentions) → powers "ranked by analysis, not just comments".
- **review-aspects.json** — editable Vietnamese keyword buckets (view, giá,
  phục vụ, đông đúc, ...). Tune these to your taste.

You still curate by hand: `category, area, persona_tags, est_visit_minutes,
notes`.

## One-time setup
1. Get a SerpApi key at https://serpapi.com (free tier ~250 searches/month).
2. `cp .env.example .env` and paste the key into `.env`.
3. `npm install` (in this `scripts/` folder).

## Run order
```
# OPTION A — auto-seed top 50 per category (fastest start)
npm run seed                         # -> ../curation-seed.csv
node fetch-reviews.mjs --in ../curation-seed.csv

# OPTION B — curate names by hand, then enrich
#   fill name_vi (+address) in ../curation-template.csv, then:
npm run fill                         # -> ../curation-filled.csv
npm run reviews                      # -> ../review-stats.json + ../curation-with-reviews.csv
```

### Useful options
```
node fill-places.mjs --dry-run            # test lookups, write nothing
node fill-places.mjs --overwrite          # refresh existing values
node fetch-reviews.mjs --pages 5          # more reviews/place (more cost)
node fetch-reviews.mjs --in ../curation-filled.csv
```

## server.mjs — tiny backend for crowd persona tags
Zero-dependency Node server that serves the prototype and stores the
solo/couple/friends/family tags users add to each place.

```
cd scripts
npm run serve         # -> http://localhost:5174
```
Then open **http://localhost:5174** (not the file://) so tags persist.

- `GET /api/tags` → `{ placeId: {solo,couple,friends,family}, ... }`
- `POST /api/tags {placeId, persona, delta:+1|-1}` → updated counts
- Data is saved to `prototype/tags.json`. Counts start at **0** and only
  reflect real votes (the user's own tags are remembered in localStorage so
  they can toggle; the server holds the aggregate across everyone).

## scrape-maps.mjs — real photos + prices, NO API key
Drives a real Chromium (Playwright) on your machine to open Google Maps,
find each place from `../prototype/data.js`, and grab its **real photo +
price** (+ rating/reviews when visible). No API key needed.

> ⚠️ Automating Google Maps is against Google's ToS. Run it on your own
> machine, for your own prototype, gently. Google changes its HTML often, so
> the selectors in the script may need updating over time.

Uses your installed **Google Chrome** (`channel: "chrome"`) — no Chromium
download needed. Requires **Node.js 18+** (Playwright won't run on older Node).

### One-time setup
```
cd scripts
npm install
```

### Run
```
npm run scrape                  # visible browser, all 105 places, resumes
node scrape-maps.mjs --limit 5  # test on the first 5 first!
node scrape-maps.mjs --only cafe
node scrape-maps.mjs --headless
node scrape-maps.mjs --force    # re-scrape everything
```
It writes photos to `../prototype/images/<id>.jpg` and an overlay
`../prototype/place-media.js`. The app merges that overlay on top of the
placeholder data by `id`, so **reload the prototype** to see real photos/prices.
Runs are **resumable** (already-done places are skipped). On failure it saves
`images/_debug_<id>.png` so you can see what the page looked like.

Tip: start with `--limit 5` to confirm extraction works before the full run
(~10–15 min for all 105 with the polite delays).

## Cost notes
- We curate **offline, once** (~50–80 places), not per user.
- `fill` = ~1 search/place. `reviews` = ~`--pages` searches/place (default 3).
  So ~50 places ≈ 50 + 150 ≈ 200 searches — within or near the free tier.
- SerpApi credits are "use it or lose it" monthly; do curation in one go.

## Legal / data notes
- SerpApi is a scraping intermediary (gray-area re Google ToS) — fine for a
  one-time curation tool; we do NOT call it per user at runtime.
- We store `place_id`/`data_id` and self-author displayed text.
- `photo_source` is a Google thumbnail URL; show attribution on display and
  prefer your own/licensed photos for the hero images.
