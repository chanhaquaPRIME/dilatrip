# CLAUDE.md

## Project
- Vietnamese travel planner web app, MVP city Đà Lạt.
- Users drag-drop curated places into a schedule.
- Audience: Vietnamese domestic travelers, Vietnamese-first UI.

## Core rules
- No AI/LLM generates schedules; user builds manually.
- No live scraping of TikTok/Instagram/Facebook.
- Place data from Google Places API plus curated DB.
- Store only place_id; self-author displayed content.
- Always show attribution for Google photos/reviews.
- Ranking must show transparent reason on each card.

## Tech stack
- Frontend: Next.js, Tailwind, shadcn/ui, dnd-kit.
- Map: Google Maps JS SDK plus Directions API.
- Backend: Next API routes, Postgres with PostGIS.

## UX rules
- Drag-and-drop is the primary planning action.
- Minimize clicks; hover on desktop, tap on mobile.
- Fully responsive; mobile uses Explore/Plan/Map tabs.
- Desktop uses three panes: cards, schedule, map.
- Design aesthetic like Instagram: image-first, clean, warm.

## Workflow
- Plan and discuss before writing app code.
- Keep MVP scoped to one city only.
- Update memory and Concept.md when decisions change.
- Confirm with user before adding new features.
- Test responsiveness on mobile and desktop.

## Out of scope (for now)
- Multi-city, booking, login accounts, social scraping.
- AI-generated itineraries or narrative text.
