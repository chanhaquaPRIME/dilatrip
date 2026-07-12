/* ============================================================
   Đà Lạt Trip Planner — prototype logic (vanilla JS, no build).
   ============================================================ */

const byId = (id) => document.getElementById(id);
const placeMap = Object.fromEntries(window.PLACES.map((p) => [p.id, p]));
const catMap = Object.fromEntries(window.CATEGORIES.map((c) => [c.id, c]));
const personaMap = Object.fromEntries(window.PERSONAS.map((p) => [p.id, p]));

const DALAT_CENTER = { lat: 11.9404, lng: 108.4583 };
const DAY_START = 8 * 60;          // 08:00
const CHECKIN_MIN = 14 * 60;       // hotel check-in 14:00
const SPEED_KMH = 22;              // assumed in-city speed for travel time
const DUR_OPTIONS = [15, 30, 45, 60, 75, 90, 120, 150, 180, 240, 360, 480];

/* Generic time blocks the user can drop into a day (not real places). */
const BUCKETS = [
  { type: "travel", label: "Di chuyển",      emoji: "🚗", dur: 30 },
  { type: "sleep",  label: "Ngủ / Khách sạn", emoji: "🛏️", dur: 480 },
  { type: "free",   label: "Tự do",          emoji: "🆓", dur: 90 },
];
const bucketMap = Object.fromEntries(BUCKETS.map((b) => [b.type, b]));

/* Photo pools + names to synthesize a gallery and sample comments. */
const U = (id) => `https://images.unsplash.com/photo-${id}?w=720&q=80&auto=format&fit=crop`;
const CATEGORY_PHOTOS = {
  visit: [U("1528127269322-539801943592"), U("1490750967868-88aa4486c946"), U("1519681393784-d120267933ba"), U("1506748686214-e9df14d4d9d0")],
  cafe: [U("1501339847302-ac426a4a7cbb"), U("1447933601403-0c6688de566e"), U("1554118811-1e0d58224f24"), U("1559496417-e7f25cb247f3")],
  eat: [U("1504674900247-0877df9cc836"), U("1552566626-52f8b828add9"), U("1533777857889-4be7c70b33f7"), U("1559339352-11d035aa65de")],
  eatery: [U("1504674900247-0877df9cc836"), U("1533777857889-4be7c70b33f7"), U("1559339352-11d035aa65de")],
  treat: [U("1488900128323-21503983a07e"), U("1551024506-0bccd828d307"), U("1541599468348-e96984315921")],
  restaurant: [U("1552566626-52f8b828add9"), U("1517248135467-4c7edcad34c4"), U("1414235077428-338989a2e8c0")],
  stay: [U("1566073771259-6a8506099945"), U("1520250497591-112f2f40a3f4"), U("1582719478250-c89cae4dc85b")],
  nightlife: [U("1470337458703-46ad1756a187"), U("1514525253161-7a46d19cd819"), U("1516450360452-9312f5e86fc7")],
  activity: [U("1432405972618-c60b0225b8f9"), U("1454496522488-7a8e488e8606"), U("1551632811-561732d1e306")],
  shopping: [U("1441986300917-64674bd600d8"), U("1481437156560-3205f6a55735"), U("1560472354-b33ff0c44a43")],
};
const NAMES = ["Minh Anh", "Hoàng Nam", "Thuỳ Linh", "Quốc Bảo", "Phương Vy", "Đức Huy", "Ngọc Hân", "Tuấn Kiệt"];

const state = {
  city: "dalat",
  persona: "couple",
  pace: "balanced",
  days: [{ items: [] }, { items: [] }, { items: [] }],
  activeDay: 0,
  tripsByCity: {}, // { cityId: { days, activeDay } } — schedule kept separately per city
  focusId: null,
  cat: "all",
  search: "",
  tab: "explore",
  theme: "dark",
};
function cityInfo() { return window.CITIES.find((c) => c.id === state.city) || window.CITIES[0]; }

/* ---------------- persistence ---------------- */
const STATE_KEY = "dalat_state";
function saveState() {
  try {
    state.tripsByCity[state.city] = { days: state.days, activeDay: state.activeDay };
    localStorage.setItem(STATE_KEY, JSON.stringify({
      city: state.city, tripsByCity: state.tripsByCity,
      persona: state.persona, pace: state.pace,
      start: byId("startDate").value || "", end: byId("endDate").value || "",
    }));
  } catch (e) {}
}
function cleanDays(days) {
  const out = (days || [])
    .filter((day) => day && Array.isArray(day.items))
    .map((day) => ({ items: day.items.filter((it) => it && (it.bucket ? bucketMap[it.bucket] : placeMap[it.id])) }));
  return out.length ? out : [{ items: [] }];
}
function loadState() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(STATE_KEY)); } catch (e) {}
  if (!d) return null;
  // Always open on the default city (Đà Lạt); per-city schedules below are still restored.
  // per-city schedules, with back-compat for the old flat {days, activeDay} format
  const trips = d.tripsByCity || (Array.isArray(d.days) ? { [state.city]: { days: d.days, activeDay: d.activeDay } } : {});
  state.tripsByCity = {};
  for (const [cid, t] of Object.entries(trips)) {
    if (!t) continue;
    const days = cleanDays(t.days);
    state.tripsByCity[cid] = { days, activeDay: Math.min(Number(t.activeDay) || 0, days.length - 1) };
  }
  const cur = state.tripsByCity[state.city];
  if (cur) { state.days = cur.days; state.activeDay = cur.activeDay; }
  if (personaMap[d.persona]) state.persona = d.persona;
  if (["relaxed", "balanced", "packed"].includes(d.pace)) state.pace = d.pace;
  return d;
}
function switchCity(id) {
  if (id === state.city || !window.CITIES.some((c) => c.id === id)) return;
  state.tripsByCity[state.city] = { days: state.days, activeDay: state.activeDay }; // stash current trip
  state.city = id;
  const t = state.tripsByCity[id];
  state.days = t ? t.days : [{ items: [] }, { items: [] }, { items: [] }];
  state.activeDay = t ? t.activeDay : 0;
  state.focusId = null; state.cat = "all"; state.search = "";
  const sb = byId("search"); if (sb) sb.value = "";
  saveState();
  const ci = cityInfo();
  if (map) map.setView([ci.center.lat, ci.center.lng], ci.zoom);
  render();
  showToast(`Đã chuyển sang ${ci.label}`);
}

/* ---------------- helpers ---------------- */
const pad = (n) => String(n).padStart(2, "0");
const toHHMM = (min) => `${pad(Math.floor(min / 60) % 24)}:${pad(Math.round(min) % 60)}`;
function parseHHMM(s) { const [h, m] = s.split(":").map(Number); return h * 60 + m; }
function priceStr(p) { return p === 0 ? "Miễn phí" : "₫".repeat(p); }
const telHref = (phone) => "tel:" + phone.replace(/\s/g, "");

function timeOptions(cur) {
  const set = new Set();
  for (let m = 0; m < 24 * 60; m += 15) set.add(m);
  set.add(cur); // keep the exact current (auto) time selectable
  return [...set].sort((a, b) => a - b)
    .map((m) => `<option value="${m}" ${m === cur ? "selected" : ""}>${toHHMM(m)}</option>`).join("");
}
function durHourOptions(cur) {
  const h = Math.floor(cur / 60);
  let s = "";
  for (let i = 0; i <= 8; i++) s += `<option value="${i}" ${i === h ? "selected" : ""}>${i}</option>`;
  return s;
}
function durMinOptions(cur) {
  const m = cur % 60;
  const opts = [0, 15, 30, 45];
  if (!opts.includes(m)) opts.push(m);
  return opts.sort((a, b) => a - b)
    .map((x) => `<option value="${x}" ${x === m ? "selected" : ""}>${String(x).padStart(2, "0")}</option>`).join("");
}

function hoursRange(place) {
  if (place.hours === "24h") return { open: 0, close: 24 * 60, always: true };
  const [o, c] = place.hours.split("-");
  return { open: parseHHMM(o), close: parseHHMM(c), always: false };
}

function haversineKm(a, b) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
/* Travel time: real driving time from OSRM when available (cached), else a
   tuned heuristic (straight-line × road-detour factor at a hilly avg speed). */
const travelCache = {};
function pairKey(a, b) { return `${a.lat.toFixed(4)},${a.lng.toFixed(4)}>${b.lat.toFixed(4)},${b.lng.toFixed(4)}`; }
function travelMinutes(a, b) {
  const k = pairKey(a, b);
  if (travelCache[k] != null) return travelCache[k];
  const km = haversineKm(a, b) * 1.4;                       // ~road distance
  return Math.max(5, Math.round((km / 24 * 60 + 3) / 5) * 5); // ~24 km/h + 3 min overhead
}
async function fetchTravel(a, b) {
  const k = pairKey(a, b);
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`);
    if (!res.ok) return false;
    const d = await res.json();
    if (d.routes && d.routes[0]) { travelCache[k] = Math.max(5, Math.round(d.routes[0].duration / 60 / 5) * 5); return true; }
  } catch (e) {}
  return false;
}
async function ensureTravelTimes() {
  const day = state.days[state.activeDay];
  const pairs = []; let prev = null;
  for (const it of day.items) {
    if (it.bucket) { prev = null; continue; }
    const place = placeMap[it.id];
    if (prev && travelCache[pairKey(prev, place)] == null) pairs.push([prev, place]);
    prev = place;
  }
  if (!pairs.length) return;
  const results = await Promise.all(pairs.map(([a, b]) => fetchTravel(a, b)));
  if (results.some(Boolean)) renderSchedule(); // re-render with the real durations
}

/* ---------------- crowd-sourced persona tags ----------------
   Users tag a place as good for solo/couple/friends/family. The user's own
   tags persist in localStorage; the count shown = a simulated community
   baseline + the user's vote. In production the baseline is a server aggregate. */
const TAGS_KEY = "dalat_user_tags";
let userTags = (() => { try { return JSON.parse(localStorage.getItem(TAGS_KEY) || "{}"); } catch (e) { return {}; } })();
function saveUserTags() { try { localStorage.setItem(TAGS_KEY, JSON.stringify(userTags)); } catch (e) {} }

// Backend (scripts/server.mjs). Same-origin when served over http; localhost fallback for file://.
const API = (location.protocol === "http:" || location.protocol === "https:") ? "" : "http://localhost:5174";
let serverCounts = {}; // { placeId: {solo,couple,friends,family} } — REAL aggregate from the server (starts at 0)
async function loadTagCounts() {
  try {
    const res = await fetch(API + "/api/tags");
    if (res.ok) serverCounts = await res.json();
  } catch (e) { console.warn("Tag server không kết nối được — chạy `npm run serve` để lưu thẻ.", e); }
}
function tagCounts(placeId) {
  const s = serverCounts[placeId] || {};
  return { solo: s.solo || 0, couple: s.couple || 0, friends: s.friends || 0, family: s.family || 0 };
}
function userHasTag(placeId, per) { return (userTags[placeId] || []).includes(per); }
async function toggleTag(placeId, per) {
  const set = new Set(userTags[placeId] || []);
  const adding = !set.has(per);
  if (adding) set.add(per); else set.delete(per);
  if (set.size) userTags[placeId] = [...set]; else delete userTags[placeId];
  saveUserTags();
  // optimistic local update so the UI feels instant
  const c = serverCounts[placeId] || { solo: 0, couple: 0, friends: 0, family: 0 };
  c[per] = Math.max(0, (c[per] || 0) + (adding ? 1 : -1));
  serverCounts[placeId] = c;
  try {
    const res = await fetch(API + "/api/tags", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, persona: per, delta: adding ? 1 : -1 }),
    });
    if (res.ok) serverCounts[placeId] = await res.json(); // authoritative count
  } catch (e) { /* keep optimistic value if server is down */ }
}

function score(place) {
  const c = tagCounts(place.id);
  const total = c.solo + c.couple + c.friends + c.family || 1;
  const fit = (c[state.persona] || 0) / total; // share of votes for the active persona
  return 0.45 * (place.rating / 5) + 0.3 * (Math.log10(place.reviews + 1) / Math.log10(50000)) + 0.25 * fit;
}

/* photos + synthesized comments for the detail view */
function detailData(p) {
  let photos, realPhotos = false, realComments = false;
  if (p.photos && p.photos.length) {
    photos = p.photos.slice(0, 5); // real Google Maps photos from the scraper
    realPhotos = true;
  } else {
    const pool = CATEGORY_PHOTOS[p.category] || [];
    photos = [p.img];
    for (const u of pool) { if (photos.length >= 4) break; if (!photos.includes(u)) photos.push(u); }
  }
  let comments;
  if (p.comments && p.comments.length) {
    // real latest reviews scraped from Google Maps
    realComments = true;
    comments = p.comments.slice(0, 10).map((c) => ({
      user: c.author || c.user || "Khách",
      rating: c.rating || 0,
      text: c.text || "",
      when: c.when || "",
    }));
  } else {
    const asp = p.highlights.map((h) => h.replace(/^\d+%\s*(khen|thích|nói)?\s*/i, "").trim());
    const persona = personaMap[state.persona].label.toLowerCase();
    const tpl = [
      `Trải nghiệm rất ổn, ${asp[0] || "đáng để ghé"}. Chắc chắn sẽ quay lại!`,
      `${asp[1] ? asp[1][0].toUpperCase() + asp[1].slice(1) : "Không gian dễ chịu"}, khá hợp đi ${persona}.`,
      `Mức giá ${priceStr(p.price).toLowerCase()}, phục vụ ổn. ${asp[0] ? "Đúng như nhận xét: " + asp[0] + "." : ""}`,
      `Cuối tuần hơi đông một chút nhưng nhìn chung đáng tiền, đáng trải nghiệm.`,
    ];
    comments = tpl.map((t, i) => ({
      user: NAMES[(p.name.length + i) % NAMES.length],
      rating: Math.max(3, Math.round(p.rating) - (i === 3 ? 1 : 0)),
      text: t, when: "",
    }));
  }
  return { photos, comments, realPhotos, realComments };
}

/* ---------------- schedule time engine ---------------- */
function computeDay(day) {
  const rows = [];
  let prev = null;
  for (const it of day.items) {
    const over = it.startSet != null; // user-set start time
    if (it.bucket) {
      const b = bucketMap[it.bucket];
      const start = over ? it.startSet : (prev ? prev.end : DAY_START);
      const end = start + it.dur;
      rows.push({ kind: "bucket", bucket: b, label: it.label || b.label, dur: it.dur, start, end, travel: 0, warn: false, over });
      prev = { end, place: null };
      continue;
    }
    const place = placeMap[it.id];
    const h = hoursRange(place);
    const travel = prev && prev.place ? travelMinutes(prev.place, place) : 0;
    let start;
    if (over) {
      start = it.startSet;
    } else if (!prev) {
      start = place.category === "stay" ? CHECKIN_MIN : Math.max(DAY_START, h.open);
    } else {
      start = prev.end + travel;
      if (!h.always && start < h.open) start = h.open;
    }
    const end = start + it.dur;
    const warn = !h.always && (start < h.open || end > h.close);
    rows.push({ kind: "place", place, dur: it.dur, start, end, travel, warn, over });
    prev = { end, place };
  }
  return rows;
}

/* ---------------- Explore ---------------- */
function renderPersonaTabs() {
  byId("personaTabs").innerHTML = window.PERSONAS.map((p) => `
    <button class="persona-tab ${p.id === state.persona ? "active" : ""}" data-persona="${p.id}">
      ${p.emoji}<span class="lbl">${p.label}</span>
    </button>`).join("");
}

function renderChips() {
  byId("catChips").innerHTML = window.CATEGORIES.map((c) => `
    <button class="chip ${c.id === state.cat ? "active" : ""}" data-cat="${c.id}">${c.emoji} ${c.label}</button>`).join("");
}

function filteredPlaces() {
  const q = state.search.trim().toLowerCase();
  return window.PLACES
    .filter((p) => (p.city || "dalat") === state.city)
    .filter((p) => state.cat === "all" || p.category === state.cat)
    .filter((p) => !q || (p.name + " " + p.desc + " " + p.area).toLowerCase().includes(q))
    .sort((a, b) => score(b) - score(a));
}

/* Transparent ranking: mirrors the factors used in score(). */
function whyRanked(p) {
  const bits = [];
  bits.push(p.rating >= 4.5 ? "điểm ★ rất cao" : p.rating >= 4.0 ? "điểm ★ cao" : `★ ${p.rating}`);
  if (p.reviews >= 5000) bits.push("rất nhiều đánh giá");
  else if (p.reviews >= 500) bits.push("nhiều đánh giá");
  const c = tagCounts(p.id);
  if (c[state.persona] > 0) bits.push(`được gắn thẻ hợp ${personaMap[state.persona].label.toLowerCase()}`);
  return bits.join(" · ");
}

function cardHTML(p) {
  const counts = tagCounts(p.id);
  const order = ["solo", "couple", "friends", "family"].sort((a, b) => counts[b] - counts[a]);
  const top = order.filter((per) => counts[per] > 0).slice(0, 3);
  const persona = personaMap[state.persona];
  const fit = counts[state.persona] > 0 && top.includes(state.persona);
  const tagsRow = top.length
    ? `<div class="persona-tags">${top.map((per) => `<span class="ptag${per === state.persona ? " me" : ""}" title="${personaMap[per].label}">${personaMap[per].emoji} ${counts[per]}</span>`).join("")}</div>`
    : "";
  const hls = p.highlights.map((h, i) => `<span class="hl ${i % 2 ? "alt" : ""}">${h}</span>`).join("");
  return `
  <article class="card" draggable="true" data-id="${p.id}">
    <div class="photo">
      <span class="emoji-fallback">${catMap[p.category].emoji}</span>
      <img src="${p.img}" alt="${p.name}" loading="lazy" />
      <span class="cat-badge">${catMap[p.category].emoji} ${catMap[p.category].label}</span>
      ${fit ? `<span class="fit-badge">Hợp ${persona.label.toLowerCase()}</span>` : ""}
      <button class="add-fab" data-add="${p.id}" title="Thêm vào ngày">+</button>
    </div>
    <div class="body">
      <h3 class="title">${p.name}</h3>
      <div class="meta">
        <span class="stars">★ ${p.rating}</span>
        <span>${p.reviews.toLocaleString("vi-VN")} đánh giá</span>
        <span class="price">${priceStr(p.price)}</span>
        <span>· ${p.area}</span>
      </div>
      <div class="why" title="Vì sao xếp hạng ở đây">✨ Gợi ý vì: ${whyRanked(p)}</div>
      ${tagsRow}
      <p class="desc">${p.desc}</p>
      <div class="hl-row">${hls}</div>
    </div>
  </article>`;
}

function renderExplore() {
  const list = filteredPlaces();
  if (list.length === 0) {
    byId("cardList").innerHTML = `<div class="empty-hint"><span class="big">🔎</span>
      Không tìm thấy địa điểm nào phù hợp.<br/>
      <button class="btn-ghost" id="clearFilters">Xoá bộ lọc</button></div>`;
  } else {
    byId("cardList").innerHTML = list.map(cardHTML).join("");
  }
  byId("exploreCount").textContent = `${list.length} địa điểm`;
  byId("cardList").querySelectorAll("img").forEach((img) => { img.onerror = () => { img.style.display = "none"; }; });
}

/* ---------------- Schedule ---------------- */
function renderBuckets() {
  byId("bucketBar").innerHTML =
    `<span class="bucket-label">Khối:</span>` +
    BUCKETS.map((b) => `<button class="bucket-chip" draggable="true" data-bucket="${b.type}">${b.emoji} ${b.label}</button>`).join("");
}

function dayDateLabel(i) {
  const start = byId("startDate").value;
  if (!start) return "";
  const d = new Date(start); d.setDate(d.getDate() + i);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function renderDayTabs() {
  const multi = state.days.length > 1;
  // compact date pickers, visible on mobile only (header inputs are hidden there)
  const fmt = (fp) => fp && fp.selectedDates[0]
    ? fp.selectedDates[0].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
    : "—";
  const dateChips = `<button class="day-tab date-chip" data-datechip="start" title="Ngày đi">📅 ${fmt(fpStart)}</button>` +
    `<button class="day-tab date-chip" data-datechip="end" title="Ngày về">→ ${fmt(fpEnd)}</button>`;
  const tabs = state.days.map((d, i) => {
    const dl = dayDateLabel(i);
    return `<button class="day-tab ${i === state.activeDay ? "active" : ""}" data-day="${i}">
      Ngày ${i + 1}${dl ? ` · ${dl}` : ""} <small>(${d.items.length})</small>${multi ? `<span class="day-del" data-del="${i}" title="Xoá ngày">×</span>` : ""}
    </button>`;
  }).join("");
  byId("dayTabs").innerHTML = dateChips + tabs + `<button class="day-tab day-add" id="addDay">+ Thêm ngày</button>`;
  saveState();
}

function placeItemHTML(r, idx) {
  const p = r.place;
  return `
  <div class="sched-item" draggable="true" data-id="${p.id}" data-idx="${idx}">
    <div class="sched-time">
      <select class="time-select${r.over ? " overridden" : ""}" data-time="${idx}" title="Giờ bắt đầu">${timeOptions(r.start)}</select>
      <span class="end-time" title="Giờ kết thúc">→ ${toHHMM(r.end)}</span>
      ${r.over ? `<button class="time-reset" data-reset="${idx}" title="Trở lại tự động">↺</button>` : ""}
    </div>
    <img class="sched-thumb" src="${p.img}" alt="" />
    <div class="sched-main">
      <div class="name">${p.name}</div>
      <div class="sub">
        <span>${catMap[p.category].emoji} ${catMap[p.category].label}</span>
        <span>★ ${p.rating}</span>
        <span>${p.hours === "24h" ? "Mở cả ngày" : "Mở " + p.hours}</span>
      </div>
      <div class="sched-dur" title="Thời lượng tham quan">⏱
        <select class="dur-h" data-idx="${idx}">${durHourOptions(r.dur)}</select> giờ
        <select class="dur-m" data-idx="${idx}">${durMinOptions(r.dur)}</select> phút
      </div>
      <div class="sched-actions">
        <a href="${p.mapsUrl}" target="_blank" rel="noopener">📍 Bản đồ</a>
        ${p.phone ? `<a href="${telHref(p.phone)}">📞 ${p.phone}</a>` : ""}
      </div>
      ${r.warn ? `<div class="warn">⚠️ Có thể đóng cửa lúc ${toHHMM(r.start)} — thử đổi thứ tự</div>` : ""}
    </div>
    <button class="sched-remove" data-remove="${idx}" title="Xoá">×</button>
  </div>`;
}

function bucketItemHTML(r, idx) {
  return `
  <div class="sched-item bucket" draggable="true" data-id="bucket" data-idx="${idx}">
    <div class="sched-time">
      <select class="time-select${r.over ? " overridden" : ""}" data-time="${idx}" title="Giờ bắt đầu">${timeOptions(r.start)}</select>
      <span class="end-time" title="Giờ kết thúc">→ ${toHHMM(r.end)}</span>
      ${r.over ? `<button class="time-reset" data-reset="${idx}" title="Trở lại tự động">↺</button>` : ""}
    </div>
    <div class="bucket-tile">${r.bucket.emoji}</div>
    <div class="sched-main">
      <div class="name">${r.label}</div>
      <div class="sched-dur" title="Thời lượng">⏱
        <select class="dur-h" data-idx="${idx}">${durHourOptions(r.dur)}</select> giờ
        <select class="dur-m" data-idx="${idx}">${durMinOptions(r.dur)}</select> phút
      </div>
    </div>
    <button class="sched-remove" data-remove="${idx}" title="Xoá">×</button>
  </div>`;
}

function renderSchedule() {
  const day = state.days[state.activeDay];
  const rows = computeDay(day);
  const list = byId("scheduleList");

  if (rows.length === 0) {
    list.innerHTML = `<div class="dropzone" id="dropzone">
      <div class="empty-hint"><span class="big">🗺️</span>
      Kéo địa điểm từ <b>Khám phá</b> vào đây,<br/>bấm <b>+</b> trên thẻ, hoặc thêm <b>Khối</b> ở trên.</div>
    </div>`;
  } else {
    let html = `<div class="dropzone" id="dropzone">`;
    rows.forEach((r, idx) => {
      if (idx > 0 && r.travel > 0) html += `<div class="travel-leg">🚗 ~${r.travel} phút di chuyển</div>`;
      html += r.kind === "bucket" ? bucketItemHTML(r, idx) : placeItemHTML(r, idx);
    });
    html += `</div>`;
    list.innerHTML = html;
    list.querySelectorAll(".sched-thumb").forEach((img) => { img.onerror = () => (img.style.display = "none"); });
  }

  renderDaySummary(rows);
  wireDropzone();
  wireScheduleItems();
  ensureTravelTimes(); // fetch accurate driving times in the background
  saveState();
}

function renderDaySummary(rows) {
  const el = byId("daySummary");
  if (rows.length === 0) { el.innerHTML = `<span>Chưa có hoạt động nào cho ngày này.</span>`; return; }
  const first = rows[0].start, last = rows[rows.length - 1].end;
  const travel = rows.reduce((s, r) => s + r.travel, 0);
  const places = rows.filter((r) => r.kind === "place");
  const cost = places.reduce((s, r) => s + r.place.price, 0);
  const costLabel = places.length === 0 || cost === 0 ? "—" : "₫".repeat(Math.min(3, Math.max(1, Math.round(cost / places.length))));
  el.innerHTML = `
    <span>🧭 <b>${places.length}</b> điểm</span>
    <span>🕗 <b>${toHHMM(first)}–${toHHMM(last)}</b></span>
    <span>🚗 <b>${travel}′</b> di chuyển</span>
    <span>💸 mức giá <b>${costLabel}</b></span>`;
}

/* The last place already placed in the active day's plan (for "how far to move" hints). */
function lastPlannedPlace(excludeId) {
  const day = state.days[state.activeDay];
  if (!day) return null;
  for (let i = day.items.length - 1; i >= 0; i--) {
    const it = day.items[i];
    if (it.bucket) continue;
    const pl = placeMap[it.id];
    if (pl && pl.id !== excludeId && pl.lat != null) return pl;
  }
  return null;
}

/* ---------------- Map (Leaflet) ---------------- */
let map, markerLayer;
function initMap() {
  const ci = cityInfo();
  map = L.map("map", { zoomControl: true }).setView([ci.center.lat, ci.center.lng], ci.zoom);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  setTimeout(() => map.invalidateSize(), 200);
}

function updateMap() {
  if (!map) return;
  markerLayer.clearLayers();
  byId("mapBack").hidden = !state.focusId;
  if (state.focusId && placeMap[state.focusId]) {
    const p = placeMap[state.focusId];
    const mk = L.marker([p.lat, p.lng]).addTo(markerLayer).bindPopup(`<b>${p.name}</b>`).openPopup();
    mk.on("click", () => openDetail(p.id)); // show the place card (zoom back out via "← Tất cả")

    const prev = lastPlannedPlace(p.id); // last place already in today's plan
    if (prev) {
      // show where you're coming from + the hop to this candidate place
      L.circleMarker([prev.lat, prev.lng], { radius: 9, color: "#fff", weight: 2, fillColor: "#22c55e", fillOpacity: 1 })
        .addTo(markerLayer).bindPopup(`<b>${prev.name}</b><br><span style="color:#16a34a">Điểm gần nhất trong lịch hôm nay</span>`);
      L.polyline([[prev.lat, prev.lng], [p.lat, p.lng]], { color: "#d62976", weight: 3, dashArray: "7 7", opacity: .85 }).addTo(markerLayer);
      const km = haversineKm(prev, p), mins = travelMinutes(prev, p);
      const mid = [(prev.lat + p.lat) / 2, (prev.lng + p.lng) / 2];
      L.marker(mid, { interactive: false, icon: L.divIcon({ className: "route-label", html: `🚗 ${km.toFixed(1)} km · ${mins}′`, iconSize: [0, 0] }) }).addTo(markerLayer);
      map.fitBounds([[prev.lat, prev.lng], [p.lat, p.lng]], { padding: [72, 72], maxZoom: 15 });
      byId("mapSub").textContent = `${p.name} · cách điểm trước ~${km.toFixed(1)} km`;
    } else {
      map.setView([p.lat, p.lng], 15);
      byId("mapSub").textContent = p.name;
    }
  } else {
    const list = filteredPlaces();
    if (list.length === 0) {
      const ci = cityInfo();
      map.setView([ci.center.lat, ci.center.lng], ci.zoom);
      byId("mapSub").textContent = ci.label;
    } else {
      const pts = [];
      list.forEach((p) => {
        const m = L.marker([p.lat, p.lng]).addTo(markerLayer)
          .bindPopup(`<b>${p.name}</b><br>★ ${p.rating} · ${catMap[p.category].label}`);
        // Click a place on the map → open its card (openDetail focuses the map and
        // restores this exact view when the card closes).
        m.on("click", () => openDetail(p.id));
        pts.push([p.lat, p.lng]);
      });
      map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
      byId("mapSub").textContent = `${list.length} địa điểm`;
    }
  }
  setTimeout(() => map.invalidateSize(), 80);
}

function render() {
  renderPersonaTabs();
  renderChips();
  renderBuckets();
  renderExplore();
  renderDayTabs();
  renderSchedule();
  updateMap();
  syncTabs();
}

/* ---------------- drag & drop ---------------- */
let dragKind = null, dragId = null, dragIdx = null, dragBucket = null;

function wireCards() {
  const cl = byId("cardList");
  cl.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".card"); if (!card) return;
    dragKind = "new"; dragId = card.dataset.id; dragIdx = null;
    card.classList.add("dragging"); e.dataTransfer.effectAllowed = "copy";
  });
  cl.addEventListener("dragend", (e) => {
    const card = e.target.closest(".card"); if (card) card.classList.remove("dragging");
    removePlaceholder();
  });
  cl.addEventListener("click", (e) => {
    if (e.target.closest("#clearFilters")) {
      state.search = ""; state.cat = "all"; byId("search").value = "";
      renderChips(); renderExplore(); updateMap();
      return;
    }
    const add = e.target.closest("[data-add]");
    if (add) { addToDay(add.dataset.add); return; }
    const card = e.target.closest(".card");
    if (card) openDetail(card.dataset.id);
  });
}

function wireScheduleItems() {
  byId("scheduleList").querySelectorAll(".sched-item").forEach((item) => {
    item.addEventListener("dragstart", (e) => {
      dragKind = "move"; dragId = item.dataset.id; dragIdx = Number(item.dataset.idx);
      item.classList.add("dragging"); e.dataTransfer.effectAllowed = "move";
    });
    item.addEventListener("dragend", () => { item.classList.remove("dragging"); removePlaceholder(); });
    item.addEventListener("click", (e) => {
      if (e.target.closest("[data-remove]") || e.target.closest("select") ||
          e.target.closest("[data-reset]") || e.target.closest("a")) return;
      if (item.dataset.id === "bucket") return;
      state.focusId = item.dataset.id; updateMap();
    });
  });
  byId("scheduleList").querySelectorAll(".time-select").forEach((sel) => {
    sel.addEventListener("mousedown", (e) => e.stopPropagation());
    sel.addEventListener("change", () => {
      state.days[state.activeDay].items[Number(sel.dataset.time)].startSet = Number(sel.value);
      renderSchedule();
    });
  });
  byId("scheduleList").querySelectorAll(".dur-h, .dur-m").forEach((sel) => {
    sel.addEventListener("mousedown", (e) => e.stopPropagation());
    sel.addEventListener("change", () => {
      const item = sel.closest(".sched-item");
      const idx = Number(item.dataset.idx);
      const h = Number(item.querySelector(".dur-h").value);
      const m = Number(item.querySelector(".dur-m").value);
      state.days[state.activeDay].items[idx].dur = Math.max(15, h * 60 + m);
      renderSchedule();
    });
  });
  byId("scheduleList").querySelectorAll("[data-reset]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      delete state.days[state.activeDay].items[Number(btn.dataset.reset)].startSet;
      renderSchedule();
    });
  });
  byId("scheduleList").querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dayIdx = state.activeDay;
      const idx = Number(btn.dataset.remove);
      const [removed] = state.days[dayIdx].items.splice(idx, 1);
      renderSchedule(); renderDayTabs(); updateMap();
      const name = removed.bucket ? (removed.label || bucketMap[removed.bucket].label) : placeMap[removed.id].name;
      showToast(`Đã xoá “${name}”`, "Hoàn tác", () => {
        if (!state.days[dayIdx]) return;
        const items = state.days[dayIdx].items;
        items.splice(Math.min(idx, items.length), 0, removed);
        state.activeDay = dayIdx;
        renderSchedule(); renderDayTabs(); updateMap();
      });
    });
  });
}

function getDragAfterElement(zone, y) {
  const items = [...zone.querySelectorAll(".sched-item:not(.dragging)")];
  for (const it of items) {
    const box = it.getBoundingClientRect();
    if (y < box.top + box.height / 2) return it;
  }
  return null;
}

let placeholderEl = null;
function getPlaceholder() {
  if (!placeholderEl) { placeholderEl = document.createElement("div"); placeholderEl.className = "drop-placeholder"; }
  return placeholderEl;
}
function removePlaceholder() { if (placeholderEl && placeholderEl.parentNode) placeholderEl.parentNode.removeChild(placeholderEl); }

function wireDropzone() {
  const zone = byId("dropzone"); if (!zone) return;
  zone.addEventListener("dragover", (e) => {
    e.preventDefault(); zone.classList.add("over");
    const after = getDragAfterElement(zone, e.clientY);
    const ph = getPlaceholder();
    if (after == null) zone.appendChild(ph);
    else zone.insertBefore(ph, after);
  });
  zone.addEventListener("dragleave", (e) => {
    if (!zone.contains(e.relatedTarget)) { zone.classList.remove("over"); removePlaceholder(); }
  });
  zone.addEventListener("drop", (e) => {
    e.preventDefault(); zone.classList.remove("over");
    performDrop(zone);
  });
}

/* Shared by native (mouse) and touch drag paths. */
function performDrop(zone) {
  const items = state.days[state.activeDay].items;
  // index = number of non-dragging items shown before the placeholder gap
  let idx = items.length;
  const ph = zone.querySelector(".drop-placeholder");
  if (ph) {
    idx = 0;
    for (const el of zone.children) {
      if (el === ph) break;
      if (el.classList.contains("sched-item") && !el.classList.contains("dragging")) idx++;
    }
  }
  removePlaceholder();
  if (dragKind === "new") {
    items.splice(idx, 0, { id: dragId, dur: defaultDur(placeMap[dragId]) });
    state.focusId = dragId;
  } else if (dragKind === "new-bucket") {
    items.splice(idx, 0, { bucket: dragBucket, dur: bucketMap[dragBucket].dur });
  } else if (dragKind === "move") {
    const [moved] = items.splice(dragIdx, 1);
    if (dragIdx < idx) idx--;
    items.splice(idx, 0, moved);
  }
  dragKind = dragId = dragIdx = dragBucket = null;
  renderSchedule(); renderDayTabs(); updateMap();
}

/* Pace stretches or compresses the default visit duration of newly added places. */
const PACE_FACTOR = { relaxed: 1.3, balanced: 1, packed: 0.75 };
function defaultDur(place) {
  return Math.max(15, Math.round((place.visitMin * PACE_FACTOR[state.pace]) / 15) * 15);
}

function flashNewItem(idx) {
  const el = byId("scheduleList").querySelector(`.sched-item[data-idx="${idx}"]`);
  if (!el) return;
  el.classList.add("flash");
  if (el.offsetParent) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

/* ---------------- touch drag (mobile) ----------------
   HTML5 DnD does not fire on touch. Long-press (250ms) a schedule item or a
   bucket chip to lift it, drag to reorder / insert, release to drop.
   Cards→schedule on mobile stays via the + button (panes are tabs there). */
let touchDrag = null, touchTimer = null, touchStart = null, touchEl = null;

function tdMoveGhost(x, y) {
  touchDrag.ghost.style.left = x + "px";
  touchDrag.ghost.style.top = (y - 12) + "px";
}

function tdBegin() {
  touchTimer = null;
  const el = touchEl;
  if (el.classList.contains("bucket-chip")) {
    dragKind = "new-bucket"; dragBucket = el.dataset.bucket; dragId = dragIdx = null;
  } else {
    dragKind = "move"; dragId = el.dataset.id; dragIdx = Number(el.dataset.idx); dragBucket = null;
  }
  const r = el.getBoundingClientRect();
  const ghost = el.cloneNode(true);
  ghost.classList.add("touch-ghost");
  ghost.style.width = r.width + "px";
  document.body.appendChild(ghost);
  el.classList.add("dragging");
  touchDrag = { el, ghost };
  tdMoveGhost(touchStart.x, touchStart.y);
  if (navigator.vibrate) navigator.vibrate(15);
}

function tdCancelTimer() { clearTimeout(touchTimer); touchTimer = null; }

function tdPointerDown(e) {
  if (e.pointerType === "mouse") return; // mouse uses native DnD
  const el = e.target.closest(".sched-item, .bucket-chip");
  if (!el || e.target.closest("select, a, button")) return;
  touchEl = el;
  touchStart = { x: e.clientX, y: e.clientY };
  touchTimer = setTimeout(tdBegin, 250);
}

function tdPointerMove(e) {
  if (touchTimer) { // pre-drag: movement means the user is scrolling
    if (Math.hypot(e.clientX - touchStart.x, e.clientY - touchStart.y) > 8) tdCancelTimer();
    return;
  }
  if (!touchDrag) return;
  tdMoveGhost(e.clientX, e.clientY);
  const zone = byId("dropzone");
  if (!zone) return;
  const zr = zone.getBoundingClientRect();
  const inside = e.clientX >= zr.left && e.clientX <= zr.right && e.clientY >= zr.top && e.clientY <= zr.bottom;
  zone.classList.toggle("over", inside);
  if (inside) {
    const after = getDragAfterElement(zone, e.clientY);
    const ph = getPlaceholder();
    if (after == null) zone.appendChild(ph); else zone.insertBefore(ph, after);
    const sl = byId("scheduleList");
    const sr = sl.getBoundingClientRect();
    if (e.clientY < sr.top + 48) sl.scrollTop -= 10;
    else if (e.clientY > sr.bottom - 48) sl.scrollTop += 10;
  } else {
    removePlaceholder();
  }
}

function tdPointerUp() {
  tdCancelTimer();
  if (!touchDrag) return;
  const { el, ghost } = touchDrag;
  touchDrag = null;
  ghost.remove();
  el.classList.remove("dragging");
  const zone = byId("dropzone");
  if (zone && zone.querySelector(".drop-placeholder")) {
    zone.classList.remove("over");
    performDrop(zone);
  } else {
    removePlaceholder();
    dragKind = dragId = dragIdx = dragBucket = null;
  }
}

function wireTouchDrag() {
  document.addEventListener("pointerdown", tdPointerDown);
  document.addEventListener("pointermove", tdPointerMove);
  document.addEventListener("pointerup", tdPointerUp);
  document.addEventListener("pointercancel", tdPointerUp);
  // block page scroll only while actually dragging
  document.addEventListener("touchmove", (e) => { if (touchDrag) e.preventDefault(); }, { passive: false });
}

function addToDay(id) {
  state.days[state.activeDay].items.push({ id, dur: defaultDur(placeMap[id]) });
  state.focusId = id;
  renderSchedule(); renderDayTabs(); updateMap();
  flashNewItem(state.days[state.activeDay].items.length - 1);
  if (window.innerWidth <= 1100 && state.tab !== "schedule") {
    showToast(`Đã thêm vào Ngày ${state.activeDay + 1}`, "Xem", () => { state.tab = "schedule"; syncTabs(); });
  }
}

function addBucket(type) {
  const b = bucketMap[type];
  state.days[state.activeDay].items.push({ bucket: type, dur: b.dur });
  renderSchedule(); renderDayTabs();
  flashNewItem(state.days[state.activeDay].items.length - 1);
}

/* ---------------- Detail modal ---------------- */
let detailPrevFocus = null; // map focus to restore when the modal closes
function openDetail(id) {
  detailPrevFocus = state.focusId;
  state.focusId = id;
  updateMap();
  const p = placeMap[id];
  const { photos, comments, realPhotos, realComments } = detailData(p);
  const tc = tagCounts(p.id);
  const fit = tc[state.persona] > 0;
  byId("detailBody").innerHTML = `
    <div class="gallery">
      <div class="gallery-main"><img id="galMain" src="${photos[0]}" alt="${p.name}" /></div>
      <div class="gallery-thumbs">
        ${photos.map((u, i) => `<img src="${u}" data-gal="${i}" class="${i === 0 ? "active" : ""}" alt="" />`).join("")}
      </div>
    </div>
    <div class="detail-info">
      <div class="detail-head">
        <h2>${p.name}</h2>
        ${fit ? `<span class="fit-badge">Hợp ${personaMap[state.persona].label.toLowerCase()}</span>` : ""}
      </div>
      <div class="meta">★ ${p.rating} · ${p.reviews.toLocaleString("vi-VN")} đánh giá · ${priceStr(p.price)} · ${catMap[p.category].label} · ${p.area}</div>
      ${(() => { const prev = lastPlannedPlace(p.id); return prev ? `<div class="move-hint">🚗 Cách <b>${prev.name}</b> (điểm gần nhất trong lịch hôm nay) khoảng <b>~${haversineKm(prev, p).toFixed(1)} km · ${travelMinutes(prev, p)}′</b> di chuyển</div>` : ""; })()}
      ${realPhotos || realComments ? `<div class="attrib">Ảnh và đánh giá: nguồn Google Maps</div>` : ""}
      <p class="desc">${p.desc}</p>
      <div class="detail-facts">
        <span>🕗 ${p.hours === "24h" ? "Mở cả ngày" : "Mở " + p.hours}</span>
        ${p.phone ? `<a href="${telHref(p.phone)}">📞 ${p.phone}</a>` : ""}
        <a href="${p.mapsUrl}" target="_blank" rel="noopener">📍 Google Maps</a>
      </div>
      <div class="hl-row">${p.highlights.map((h, i) => `<span class="hl ${i % 2 ? "alt" : ""}">${h}</span>`).join("")}</div>
      <button class="btn-primary add-from-detail" data-add-detail="${p.id}">+ Thêm vào Ngày ${state.activeDay + 1}</button>
      <div class="tag-vote">
        <div class="tag-vote-title">Địa điểm này hợp với nhóm nào? <span class="tag-vote-sub">(bấm để gắn thẻ)</span></div>
        <div class="tag-vote-chips">
          ${window.PERSONAS.map((per) => `<button class="tag-chip${userHasTag(p.id, per.id) ? " on" : ""}" data-tag="${per.id}">${per.emoji} ${per.label} <span class="tag-count">${tc[per.id]}</span></button>`).join("")}
        </div>
      </div>
      <h3 class="comments-title">${realComments ? "Bình luận nổi bật <span class='attrib'>· từ Google Maps</span>" : "Bình luận minh hoạ <span class='attrib'>· dữ liệu mẫu</span>"}</h3>
      <div class="comments">
        ${comments.map((c) => `
          <div class="comment">
            <div class="ava">${(c.user || "K")[0]}</div>
            <div>
              <div class="cname">${c.user}${c.rating ? ` <span class="cstar">${"★".repeat(c.rating)}</span>` : ""}${c.when ? ` <span class="cwhen">· ${c.when}</span>` : ""}</div>
              ${c.text ? `<div class="ctext">${c.text}</div>` : ""}
            </div>
          </div>`).join("")}
      </div>
    </div>`;

  byId("detailModal").hidden = false;
  lockScroll(true);
  const main = byId("galMain");
  main.onerror = () => (main.style.background = "var(--ig-gradient)");
  byId("detailBody").querySelectorAll("[data-gal]").forEach((t) => {
    t.onerror = () => (t.style.display = "none");
    t.addEventListener("click", () => {
      main.src = t.src;
      byId("detailBody").querySelectorAll("[data-gal]").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
    });
  });
  byId("detailBody").querySelector("[data-add-detail]").addEventListener("click", (e) => {
    addToDay(e.target.dataset.addDetail); closeDetail();
  });
  byId("detailBody").querySelectorAll(".tag-chip").forEach((chip) => {
    chip.addEventListener("click", async () => {
      await toggleTag(p.id, chip.dataset.tag);
      const c = tagCounts(p.id);
      byId("detailBody").querySelectorAll(".tag-chip").forEach((c2) => {
        c2.classList.toggle("on", userHasTag(p.id, c2.dataset.tag));
        c2.querySelector(".tag-count").textContent = c[c2.dataset.tag];
      });
      renderExplore(); // refresh tag counts on the cards behind
    });
  });
}
function closeDetail() {
  byId("detailModal").hidden = true;
  lockScroll(false);
  state.focusId = detailPrevFocus;
  detailPrevFocus = null;
  updateMap();
}
function lockScroll(on) { document.body.style.overflow = on ? "hidden" : ""; }

/* ---------------- Export modal + PDF ---------------- */
function openExport() {
  const persona = personaMap[state.persona];
  let html = `<h1>✈️ Lịch trình ${cityInfo().label}</h1>
    <div class="ex-sub">Nhóm: ${persona.emoji} ${persona.label} · Nhịp độ: ${byId("pace").selectedOptions[0].text}</div>`;
  let any = false;
  state.days.forEach((day, i) => {
    const rows = computeDay(day); if (!rows.length) return; any = true;
    html += `<h2>Ngày ${i + 1}${dayDateLabel(i) ? " · " + dayDateLabel(i) : ""}</h2>`;
    rows.forEach((r) => {
      if (r.kind === "bucket") {
        html += `<div class="ex-it"><div class="ex-t">${toHHMM(r.start)}–${toHHMM(r.end)}</div>
          <div><div class="ex-n">${r.bucket.emoji} ${r.label}</div><div class="ex-m">${r.dur} phút</div></div></div>`;
      } else {
        const p = r.place;
        const tel = p.phone ? `<a class="ex-link" data-url="${telHref(p.phone)}">📞 ${p.phone}</a>  ·  ` : "";
        html += `<div class="ex-it"><div class="ex-t">${toHHMM(r.start)}–${toHHMM(r.end)}</div>
          <div><div class="ex-n">${p.name}</div>
          <div class="ex-m">${catMap[p.category].label} · ★ ${p.rating} · ${priceStr(p.price)} · ${p.area}</div>
          <div class="ex-m">${tel}<a class="ex-link" data-url="${p.mapsUrl}">📍 Google Maps</a></div></div></div>`;
      }
    });
  });
  if (!any) html += `<p>Chưa có hoạt động nào. Hãy thêm địa điểm vào lịch trình trước.</p>`;
  byId("exportContent").innerHTML = html;
  byId("exportModal").hidden = false;
  lockScroll(true);
}
function closeExport() { byId("exportModal").hidden = true; lockScroll(false); }

async function generatePDF() {
  const node = byId("exportContent");
  const btn = byId("downloadPdf");
  btn.disabled = true; btn.textContent = "Đang tạo PDF…";
  try {
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const img = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const mmPerPx = pw / node.offsetWidth;
    const imgH = node.offsetHeight * mmPerPx;
    let heightLeft = imgH, position = 0;
    pdf.addImage(img, "PNG", 0, position, pw, imgH);
    heightLeft -= ph;
    while (heightLeft > 0) {
      position -= ph;
      pdf.addPage();
      pdf.addImage(img, "PNG", 0, position, pw, imgH);
      heightLeft -= ph;
    }
    // overlay real clickable links (Google Maps + phone) on top of the image
    const nodeRect = node.getBoundingClientRect();
    node.querySelectorAll("[data-url]").forEach((a) => {
      const r = a.getBoundingClientRect();
      const x = (r.left - nodeRect.left) * mmPerPx;
      const y = (r.top - nodeRect.top) * mmPerPx;
      const w = r.width * mmPerPx, h = r.height * mmPerPx;
      const page = Math.floor(y / ph);
      pdf.setPage(page + 1);
      pdf.link(x, y - page * ph, w, h, { url: a.dataset.url });
    });
    pdf.save("lich-trinh-da-lat.pdf");
  } catch (err) {
    alert("Không tạo được PDF (cần kết nối mạng để tải thư viện). " + err.message);
  } finally {
    btn.disabled = false; btn.textContent = "⬇ Tải PDF";
  }
}

function openDayMap() {
  const day = state.days[state.activeDay];
  const places = day.items.filter((it) => !it.bucket);
  if (places.length === 0) { alert("Ngày này chưa có địa điểm."); return; }
  const path = places.map((it) => `${placeMap[it.id].lat},${placeMap[it.id].lng}`).join("/");
  window.open(`https://www.google.com/maps/dir/${path}`, "_blank");
}

/* ---------------- toast ---------------- */
let toastTimer = null;
function hideToast() { byId("toastWrap").innerHTML = ""; clearTimeout(toastTimer); toastTimer = null; }
function showToast(msg, actionLabel, onAction) {
  const wrap = byId("toastWrap");
  wrap.innerHTML = "";
  const t = document.createElement("div");
  t.className = "toast";
  const span = document.createElement("span");
  span.textContent = msg;
  t.appendChild(span);
  if (actionLabel) {
    const b = document.createElement("button");
    b.className = "toast-act";
    b.textContent = actionLabel;
    b.addEventListener("click", () => { hideToast(); onAction(); });
    t.appendChild(b);
  }
  wrap.appendChild(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 4000);
}

/* ---------------- theme ---------------- */
function applyTheme(t) {
  state.theme = t === "dark" ? "dark" : "light";
  document.body.setAttribute("data-theme", state.theme);
  byId("themeToggle").textContent = state.theme === "dark" ? "☀️" : "🌙";
  try { localStorage.setItem("dalat_theme", state.theme); } catch (e) {}
}
function toggleTheme() { applyTheme(state.theme === "dark" ? "light" : "dark"); }

/* ---------------- interactive guided tour (spotlight) ---------------- */
const TOUR = [
  { title: "👋 Chào mừng đến Đilatrip!", text: "Lên lịch trình Đà Lạt trong vài phút. Cùng đi nhanh một vòng các khu vực nhé.", sel: null, tab: null },
  { title: "Chọn nhóm & ngày", text: "Chọn nhóm (một mình / cặp đôi / nhóm bạn / gia đình), ngày đi và nhịp độ ở đây. Gợi ý sẽ đổi theo nhóm.", sel: ".trip-controls", tab: null },
  { title: "Khám phá địa điểm", text: "Đây là các địa điểm tuyển chọn. Bấm vào thẻ để xem ảnh, bình luận và gắn thẻ nhóm phù hợp.", sel: "#explorePane", tab: "explore" },
  { title: "Lịch trình của bạn", text: "Kéo thẻ địa điểm vào đây (hoặc bấm + trên thẻ). Chỉnh giờ bắt đầu & thời lượng — giờ kết thúc và thời gian di chuyển tự tính.", sel: "#schedulePane", tab: "schedule" },
  { title: "Khối thời gian", text: "Kéo thêm các khối Di chuyển / Ngủ / Tự do để lấp khoảng trống trong ngày.", sel: "#bucketBar", tab: "schedule" },
  { title: "Bản đồ", text: "Xem các địa điểm trên bản đồ. Bấm 1 điểm để phóng to, “← Tất cả” để xem lại toàn bộ.", sel: "#mapPane", tab: "map" },
  { title: "Xuất lịch trình", text: "Khi xong, bấm đây để xem tổng quan và tải PDF kèm link bản đồ & số điện thoại. Chúc bạn có chuyến đi vui!", sel: "#exportBtn", tab: null },
];
let tourI = 0;
function positionTour() {
  const step = TOUR[tourI];
  const spot = byId("tourSpot"), tip = byId("tourTip");
  const el = step.sel ? document.querySelector(step.sel) : null;
  if (!el) { // centered, no spotlight
    spot.style.width = spot.style.height = "0px";
    spot.style.top = spot.style.left = "50%";
    tip.style.transform = "translate(-50%,-50%)"; tip.style.top = "50%"; tip.style.left = "50%";
    return;
  }
  const r = el.getBoundingClientRect(), pad = 6;
  spot.style.top = (r.top - pad) + "px"; spot.style.left = (r.left - pad) + "px";
  spot.style.width = (r.width + pad * 2) + "px"; spot.style.height = (r.height + pad * 2) + "px";
  tip.style.transform = "none";
  const tipW = Math.min(320, window.innerWidth - 24);
  const tipH = tip.offsetHeight || 170;
  const left = Math.min(Math.max(12, r.left), window.innerWidth - tipW - 12);
  let top = r.bottom + 12;
  if (top + tipH > window.innerHeight - 12) top = Math.max(12, r.top - tipH - 12);
  tip.style.left = left + "px"; tip.style.top = top + "px";
}
function showTour() {
  const step = TOUR[tourI];
  if (step.tab) { state.tab = step.tab; syncTabs(); }
  byId("tourTitle").textContent = step.title;
  byId("tourText").textContent = step.text;
  byId("tourDots").innerHTML = TOUR.map((_, i) => `<span class="ob-dot${i === tourI ? " on" : ""}"></span>`).join("");
  byId("tourNext").textContent = tourI === TOUR.length - 1 ? "Bắt đầu" : "Tiếp →";
  byId("tourSkip").style.visibility = tourI === TOUR.length - 1 ? "hidden" : "visible";
  requestAnimationFrame(positionTour);
}
function startTour() { tourI = 0; byId("tour").hidden = false; showTour(); window.addEventListener("resize", positionTour); }
function endTour() {
  byId("tour").hidden = true;
  window.removeEventListener("resize", positionTour);
  if (window.innerWidth <= 1100) { state.tab = "explore"; syncTabs(); }
  try { localStorage.setItem("dalat_onboarded", "1"); } catch (e) {}
}

/* ---------------- tabs (mobile) ---------------- */
function syncTabs() {
  document.querySelectorAll(".pane").forEach((p) => p.classList.toggle("active-pane", p.dataset.pane === state.tab));
  byId("mobileNav").querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.tab === state.tab));
  if (map && state.tab === "map") setTimeout(() => map.invalidateSize(), 60);
}

/* ---------------- dates ↔ days ---------------- */
let fpStart, fpEnd;
function syncDaysToDates() {
  const s = fpStart.selectedDates[0], e = fpEnd.selectedDates[0];
  if (!s || !e) return;
  const n = Math.min(30, Math.max(1, Math.round((e - s) / 86400000) + 1));
  while (state.days.length < n) state.days.push({ items: [] });
  // only trim empty trailing days — never silently delete planned days
  while (state.days.length > n && state.days[state.days.length - 1].items.length === 0) state.days.pop();
  if (state.activeDay >= state.days.length) state.activeDay = state.days.length - 1;
  renderDayTabs(); renderSchedule(); updateMap();
}

/* ---------------- init ---------------- */
async function init() {
  await loadTagCounts();
  const saved = loadState();
  const t = new Date(); const end = new Date(); end.setDate(t.getDate() + 2);
  const dateOpts = { dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y", disableMobile: true };
  fpStart = flatpickr(byId("startDate"), {
    ...dateOpts, defaultDate: (saved && saved.start) || t,
    onChange: (dates) => { if (dates[0]) fpEnd.set("minDate", dates[0]); syncDaysToDates(); },
  });
  fpEnd = flatpickr(byId("endDate"), {
    ...dateOpts, defaultDate: (saved && saved.end) || end,
    onChange: () => syncDaysToDates(),
  });
  if (fpStart.selectedDates[0]) fpEnd.set("minDate", fpStart.selectedDates[0]);
  byId("pace").value = state.pace;

  let savedTheme = "dark"; try { savedTheme = localStorage.getItem("dalat_theme") || "dark"; } catch (e) {}
  applyTheme(savedTheme);

  initMap();
  render();
  wireCards();
  wireTouchDrag();

  byId("personaTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-persona]"); if (!b) return;
    state.persona = b.dataset.persona; renderPersonaTabs(); renderExplore(); saveState();
  });
  byId("catChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]"); if (!b) return;
    state.cat = b.dataset.cat; state.focusId = null; renderChips(); renderExplore(); updateMap();
  });
  let searchTimer = null;
  byId("search").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = e.target.value; state.focusId = null; renderExplore(); updateMap();
    }, 200);
  });
  byId("pace").addEventListener("change", (e) => {
    state.pace = e.target.value; saveState();
    showToast(`Nhịp độ “${e.target.selectedOptions[0].text}” — áp dụng cho địa điểm thêm mới`);
  });

  // City switcher (custom dropdown)
  const citySwitch = byId("citySwitch"), cityBtn = byId("cityBtn"), cityMenu = byId("cityMenu");
  if (citySwitch && cityBtn && cityMenu) {
    const paintCity = () => {
      byId("cityBtnLabel").textContent = cityInfo().label;
      cityMenu.innerHTML = window.CITIES.map((c) => `
        <button class="city-opt${c.id === state.city ? " active" : ""}" role="option" data-city="${c.id}">
          <span class="co-pin" aria-hidden="true">📍</span><span>${c.label}</span><span class="co-check" aria-hidden="true">✓</span>
        </button>`).join("");
    };
    const openCity = (open) => {
      citySwitch.classList.toggle("open", open);
      cityMenu.hidden = !open;
      cityBtn.setAttribute("aria-expanded", open ? "true" : "false");
    };
    paintCity();
    cityBtn.addEventListener("click", (e) => { e.stopPropagation(); openCity(cityMenu.hidden); });
    cityMenu.addEventListener("click", (e) => {
      const opt = e.target.closest("[data-city]"); if (!opt) return;
      openCity(false);
      if (opt.dataset.city !== state.city) { switchCity(opt.dataset.city); paintCity(); }
    });
    document.addEventListener("click", (e) => { if (!citySwitch.contains(e.target)) openCity(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") openCity(false); });
  }

  byId("bucketBar").addEventListener("click", (e) => {
    const b = e.target.closest("[data-bucket]"); if (!b) return;
    addBucket(b.dataset.bucket);
  });
  byId("bucketBar").addEventListener("dragstart", (e) => {
    const b = e.target.closest("[data-bucket]"); if (!b) return;
    dragKind = "new-bucket"; dragBucket = b.dataset.bucket; dragId = dragIdx = null;
    b.classList.add("dragging"); e.dataTransfer.effectAllowed = "copy";
  });
  byId("bucketBar").addEventListener("dragend", (e) => {
    const b = e.target.closest("[data-bucket]"); if (b) b.classList.remove("dragging");
    removePlaceholder();
  });

  byId("dayTabs").addEventListener("click", (e) => {
    const dc = e.target.closest("[data-datechip]");
    if (dc) {
      const fp = dc.dataset.datechip === "start" ? fpStart : fpEnd;
      fp.set("positionElement", dc);
      fp.open();
      return;
    }
    const del = e.target.closest("[data-del]");
    if (del) {
      const i = Number(del.dataset.del);
      const [removedDay] = state.days.splice(i, 1);
      if (state.activeDay >= state.days.length) state.activeDay = state.days.length - 1;
      else if (state.activeDay > i) state.activeDay--;
      renderDayTabs(); renderSchedule(); updateMap();
      if (removedDay.items.length) {
        showToast(`Đã xoá Ngày ${i + 1} (${removedDay.items.length} mục)`, "Hoàn tác", () => {
          state.days.splice(Math.min(i, state.days.length), 0, removedDay);
          state.activeDay = Math.min(i, state.days.length - 1);
          renderDayTabs(); renderSchedule(); updateMap();
        });
      }
      return;
    }
    if (e.target.closest("#addDay")) { state.days.push({ items: [] }); renderDayTabs(); return; }
    const b = e.target.closest("[data-day]"); if (!b) return;
    state.activeDay = Number(b.dataset.day); renderDayTabs(); renderSchedule(); updateMap();
  });

  byId("exportBtn").addEventListener("click", openExport);
  byId("downloadPdf").addEventListener("click", generatePDF);
  byId("openDayMap").addEventListener("click", openDayMap);
  byId("mapBack").addEventListener("click", () => { state.focusId = null; updateMap(); });
  byId("themeToggle").addEventListener("click", toggleTheme);
  byId("helpBtn").addEventListener("click", startTour);
  byId("tourSkip").addEventListener("click", endTour);
  byId("tourNext").addEventListener("click", () => {
    if (tourI >= TOUR.length - 1) endTour();
    else { tourI++; showTour(); }
  });

  byId("detailModal").addEventListener("click", (e) => {
    if (e.target.id === "detailModal" || e.target.closest("[data-close-detail]")) closeDetail();
  });
  byId("exportModal").addEventListener("click", (e) => {
    if (e.target.id === "exportModal" || e.target.closest("[data-close-export]")) closeExport();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!byId("detailModal").hidden) closeDetail();
    else if (!byId("exportModal").hidden) closeExport();
    else if (!byId("tour").hidden) endTour();
  });

  byId("mobileNav").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]"); if (!b) return;
    state.tab = b.dataset.tab; syncTabs();
  });

  let onboarded = false; try { onboarded = localStorage.getItem("dalat_onboarded") === "1"; } catch (e) {}
  if (!onboarded) startTour();
}

document.addEventListener("DOMContentLoaded", init);
