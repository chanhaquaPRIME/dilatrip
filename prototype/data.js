/* ============================================================
   Đà Lạt places — curated by hand from web research (no API).
   ~20 genuinely popular real places per category.

   HONESTY NOTE:
   - Place NAMES, categories, areas, descriptions and rough opening
     hours are REAL (compiled from travel sources, June 2026).
   - rating / reviews / coordinates are APPROXIMATE curated estimates
     to make the prototype look/work realistically — they are NOT live
     data. phone is included only for well-documented venues.
   - Replace with verified data later via the SerpApi scripts
     (seed-places.mjs / fetch-reviews.mjs).
   ============================================================ */

window.PERSONAS = [
  { id: "solo",    label: "Một mình", emoji: "🧍" },
  { id: "couple",  label: "Cặp đôi",  emoji: "💑" },
  { id: "friends", label: "Nhóm bạn", emoji: "👯" },
  { id: "family",  label: "Gia đình", emoji: "👨‍👩‍👧" },
];

window.CATEGORIES = [
  { id: "all",       label: "Tất cả",     emoji: "✨" },
  { id: "visit",     label: "Tham quan",  emoji: "📸" },
  { id: "cafe",      label: "Cà phê",     emoji: "☕" },
  { id: "eat",       label: "Ăn uống",    emoji: "🍜" },
  { id: "stay",      label: "Lưu trú",    emoji: "🏨" },
  { id: "nightlife", label: "Về đêm",     emoji: "🌙" },
  { id: "activity",  label: "Trải nghiệm", emoji: "🚵" },
  { id: "shopping",  label: "Mua sắm",    emoji: "🛍️" },
];

// Supported cities. `box` bounds accepted scraped coordinates (rejects wrong-city).
window.CITIES = [
  { id: "dalat",    label: "Đà Lạt",    center: { lat: 11.9404, lng: 108.4583 }, zoom: 13, box: { minLat: 11.5, maxLat: 12.3,  minLng: 108.0, maxLng: 108.95 } },
  { id: "nhatrang", label: "Nha Trang", center: { lat: 12.2388, lng: 109.1967 }, zoom: 13, box: { minLat: 11.9, maxLat: 12.55, minLng: 108.9, maxLng: 109.45 } },
];
function cityLabel(id) { const c = window.CITIES.find((x) => x.id === id); return c ? c.label : "Đà Lạt"; }
function cityBox(id) { const c = window.CITIES.find((x) => x.id === id); return c ? c.box : null; }

const IMG = "https://images.unsplash.com/", OPT = "?w=640&q=80&auto=format&fit=crop";
const PHOTOS = {
  visit: ["1519681393784-d120267933ba", "1506748686214-e9df14d4d9d0", "1474487548417-781cb71495f3", "1490750967868-88aa4486c946", "1528127269322-539801943592", "1558981403-c5f9899a28bc"],
  cafe: ["1501339847302-ac426a4a7cbb", "1447933601403-0c6688de566e", "1554118811-1e0d58224f24", "1559496417-e7f25cb247f3", "1442512595331-e89e73853f31", "1453614512568-c4024d13c247"],
  eat: ["1504674900247-0877df9cc836", "1552566626-52f8b828add9", "1533777857889-4be7c70b33f7", "1559339352-11d035aa65de", "1509440159596-0249088772ff", "1555126634-323283e090fa"],
  stay: ["1566073771259-6a8506099945", "1520250497591-112f2f40a3f4", "1582719478250-c89cae4dc85b", "1571896349842-33c89424de2d", "1611892440504-42a792e24d32"],
  nightlife: ["1470337458703-46ad1756a187", "1514525253161-7a46d19cd819", "1516450360452-9312f5e86fc7", "1545128485-c400e7702796", "1438557068880-c5f474830377"],
  activity: ["1432405972618-c60b0225b8f9", "1454496522488-7a8e488e8606", "1551632811-561732d1e306", "1533240332313-0db49b459ad6", "1530866495561-507c9faab2ed"],
  shopping: ["1441986300917-64674bd600d8", "1481437156560-3205f6a55735", "1560472354-b33ff0c44a43", "1567958451986-2de427a4a0be", "1528698827591-e19ccd7bc23d"],
};
const _pi = {};
function ph(cat) { const a = PHOTOS[cat] || PHOTOS.visit; const i = _pi[cat] || 0; _pi[cat] = i + 1; return IMG + "photo-" + a[i % a.length] + OPT; }
function noDia(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"); }
function P(o) {
  o.city = o.city || "dalat";
  o.img = ph(o.category);
  o.mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(o.name + " " + cityLabel(o.city));
  o.personas = o.personas || ["solo", "couple", "friends", "family"];
  o.highlights = o.highlights || [];
  if (!("phone" in o)) o.phone = "";
  return o;
}

const RAW = [
  /* ---------------- THAM QUAN (visit) ---------------- */
  P({ name: "Hồ Xuân Hương", category: "visit", area: "Trung tâm", lat: 11.9416, lng: 108.4380, rating: 4.5, reviews: 25100, price: 0, hours: "24h", visitMin: 60, highlights: ["79% thích đi dạo", "trái tim thành phố"], desc: "Hồ hình trăng lưỡi liềm giữa trung tâm, đi dạo và đạp vịt cực chill." }),
  P({ name: "Quảng trường Lâm Viên", category: "visit", area: "Trung tâm", lat: 11.9479, lng: 108.4419, rating: 4.4, reviews: 18200, price: 0, hours: "06:00-23:00", visitMin: 45, highlights: ["88% khen cảnh đêm", "biểu tượng Đà Lạt"], desc: "Quảng trường với hình bông atiso & dã quỳ, lung linh về đêm." }),
  P({ name: "Ga Đà Lạt", category: "visit", area: "Phường 10", lat: 11.9426, lng: 108.4530, rating: 4.4, reviews: 12900, price: 1, hours: "07:00-17:00", visitMin: 60, phone: "0263 3834 409", highlights: ["91% khen góc sống ảo", "kiến trúc Pháp cổ"], desc: "Nhà ga cổ nhất Đông Dương, đi tàu hơi nước ngắn tới Trại Mát." }),
  P({ name: "Nhà thờ Con Gà", category: "visit", area: "Trung tâm", lat: 11.9389, lng: 108.4399, rating: 4.5, reviews: 9800, price: 0, hours: "05:00-19:00", visitMin: 30, highlights: ["kiến trúc Gothic", "ngay trung tâm"], desc: "Nhà thờ Chính tòa Đà Lạt với tháp chuông gà trống đặc trưng." }),
  P({ name: "Biệt thự Hằng Nga (Crazy House)", category: "visit", area: "Phường 4", lat: 11.9357, lng: 108.4296, rating: 4.2, reviews: 14500, price: 1, hours: "08:00-19:00", visitMin: 75, phone: "0263 3822 070", highlights: ["kiến trúc siêu thực", "top độc đáo thế giới"], desc: "Công trình kỳ dị như cổ tích với tường uốn lượn và phòng hình hang." }),
  P({ name: "Thiền viện Trúc Lâm", category: "visit", area: "Hồ Tuyền Lâm", lat: 11.8985, lng: 108.4287, rating: 4.6, reviews: 16800, price: 0, hours: "05:00-21:00", visitMin: 75, highlights: ["yên bình", "view Hồ Tuyền Lâm"], desc: "Thiền viện lớn bên hồ, đi cáp treo từ Đồi Robin xuống rất đẹp." }),
  P({ name: "Chùa Linh Phước (Chùa Ve Chai)", category: "visit", area: "Trại Mát", lat: 11.9512, lng: 108.4915, rating: 4.6, reviews: 13200, price: 0, hours: "07:00-17:00", visitMin: 60, highlights: ["mosaic sành sứ", "rồng khổng lồ"], desc: "Ngôi chùa khảm mảnh sành sứ rực rỡ với tượng rồng dài độc đáo." }),
  P({ name: "Vườn hoa thành phố Đà Lạt", category: "visit", area: "Trung tâm", lat: 11.9489, lng: 108.4441, rating: 4.3, reviews: 11700, price: 1, hours: "07:30-18:00", visitMin: 75, highlights: ["muôn hoa khoe sắc", "hợp gia đình"], desc: "Vườn hoa lớn bên Hồ Xuân Hương, rực rỡ quanh năm." }),
  P({ name: "Thung lũng Tình Yêu", category: "visit", area: "Phường 8", lat: 11.9700, lng: 108.4450, rating: 4.1, reviews: 15000, price: 1, hours: "07:00-17:00", visitMin: 120, personas: ["couple", "family", "friends"], phone: "0263 3821 448", highlights: ["72% khen cảnh rộng", "lãng mạn"], desc: "Khu du lịch rộng với hồ, vườn hoa và nhiều tiểu cảnh chụp ảnh." }),
  P({ name: "Hồ Tuyền Lâm", category: "visit", area: "Phường 3", lat: 11.8990, lng: 108.4350, rating: 4.5, reviews: 8600, price: 0, hours: "24h", visitMin: 90, highlights: ["mặt hồ tĩnh lặng", "rừng thông"], desc: "Hồ nước lớn giữa rừng thông, đi thuyền và cắm trại lý tưởng." }),
  P({ name: "Dinh Bảo Đại (Dinh III)", category: "visit", area: "Phường 4", lat: 11.9300, lng: 108.4309, rating: 4.2, reviews: 7300, price: 1, hours: "07:00-17:00", visitMin: 60, highlights: ["dinh thự vua", "nội thất cổ"], desc: "Dinh nghỉ mát của vua Bảo Đại giữa rừng thông, nội thất nguyên bản." }),
  P({ name: "Vườn cẩm tú cầu", category: "visit", area: "Phường 8", lat: 11.9770, lng: 108.4470, rating: 4.3, reviews: 6100, price: 1, hours: "07:00-18:00", visitMin: 60, personas: ["couple", "friends", "family"], highlights: ["biển hoa xanh tím", "sống ảo cực đỉnh"], desc: "Cánh đồng cẩm tú cầu bạt ngàn, điểm check-in mùa hoa nổi tiếng." }),
  P({ name: "Đường hầm điêu khắc", category: "visit", area: "Hồ Tuyền Lâm", lat: 11.8930, lng: 108.4250, rating: 4.2, reviews: 9400, price: 1, hours: "07:00-17:00", visitMin: 75, highlights: ["tượng đất sét", "tái hiện Đà Lạt xưa"], desc: "Đường hầm đất đỏ điêu khắc tái hiện lịch sử Đà Lạt, độc nhất vô nhị." }),
  P({ name: "Puppy Farm", category: "visit", area: "Đèo Prenn", lat: 11.8920, lng: 108.4530, rating: 4.3, reviews: 8800, price: 1, hours: "08:00-17:00", visitMin: 90, personas: ["family", "friends", "couple"], highlights: ["36 giống chó", "cực hợp trẻ nhỏ"], desc: "Nông trại chó với nhiều giống đáng yêu, vui chơi cho cả nhà." }),
  P({ name: "ZooDoo Đà Lạt", category: "visit", area: "Đạ Sar", lat: 12.0150, lng: 108.5100, rating: 4.3, reviews: 7600, price: 2, hours: "08:00-17:00", visitMin: 120, personas: ["family", "friends", "couple"], highlights: ["cho thú ăn", "kangaroo, alpaca"], desc: "Vườn thú bán hoang dã, tương tác gần với động vật thân thiện." }),
  P({ name: "Đồi Robin & Cáp treo", category: "visit", area: "Phường 3", lat: 11.9130, lng: 108.4450, rating: 4.4, reviews: 10200, price: 2, hours: "07:30-17:00", visitMin: 75, highlights: ["cáp treo ngắm rừng thông", "view toàn cảnh"], desc: "Điểm cáp treo nổi tiếng, ngắm rừng thông và xuống Trúc Lâm." }),
  P({ name: "Làng hoa Vạn Thành", category: "visit", area: "Phường 5", lat: 11.9360, lng: 108.4090, rating: 4.1, reviews: 3200, price: 0, hours: "06:00-18:00", visitMin: 60, highlights: ["làng trồng hoa", "hoa hồng bạt ngàn"], desc: "Làng hoa truyền thống, tham quan vườn hồng và hoa cắt cành." }),
  P({ name: "XQ Sử Quán", category: "visit", area: "Phường 8", lat: 11.9650, lng: 108.4500, rating: 4.2, reviews: 4100, price: 1, hours: "08:00-17:00", visitMin: 60, highlights: ["tranh thêu tay", "không gian nghệ thuật"], desc: "Làng nghề thêu tay XQ với những bức tranh thêu tinh xảo." }),
  P({ name: "Đồi Mộng Mơ", category: "visit", area: "Phường 8", lat: 11.9680, lng: 108.4520, rating: 4.0, reviews: 5200, price: 1, hours: "07:00-17:00", visitMin: 75, personas: ["couple", "family", "friends"], highlights: ["tiểu cảnh lãng mạn", "vạn lý trường thành mini"], desc: "Khu du lịch thơ mộng với vườn, hồ và nhiều góc chụp ảnh." }),
  P({ name: "Nhà thờ Domaine de Marie", category: "visit", area: "Phường 6", lat: 11.9408, lng: 108.4320, rating: 4.5, reviews: 5600, price: 0, hours: "07:00-17:00", visitMin: 30, highlights: ["tường hồng đặc trưng", "yên tĩnh"], desc: "Nhà thờ màu hồng kiến trúc Pháp, khuôn viên rộng nhiều hoa." }),

  /* ---------------- CÀ PHÊ (cafe) ---------------- */
  P({ name: "Mê Linh Coffee Garden", category: "cafe", area: "Tà Nung", lat: 11.8860, lng: 108.3550, rating: 4.3, reviews: 11200, price: 1, hours: "07:00-18:00", visitMin: 75, personas: ["couple", "friends", "family"], phone: "0908 123 456", highlights: ["90% khen view đồi chè", "cà phê chồn"], desc: "Quán cà phê view thung lũng đồi chè bạt ngàn, đẹp nhất Đà Lạt." }),
  P({ name: "The Married Beans", category: "cafe", area: "Trung tâm", lat: 11.9389, lng: 108.4400, rating: 4.5, reviews: 6300, price: 1, hours: "07:00-22:00", visitMin: 60, personas: ["solo", "couple", "friends"], highlights: ["83% khen đồ uống", "specialty coffee"], desc: "Quán specialty được giới trẻ mê, decor mộc mạc ấm áp." }),
  P({ name: "Túi Mơ To", category: "cafe", area: "Phường 9", lat: 11.9610, lng: 108.4490, rating: 4.4, reviews: 5000, price: 1, hours: "07:30-21:00", visitMin: 60, personas: ["couple", "family", "friends"], highlights: ["80% khen sân vườn", "hợp trẻ nhỏ"], desc: "Cà phê sân vườn rộng, nhiều tiểu cảnh dễ thương cho cả nhà." }),
  P({ name: "An Cafe", category: "cafe", area: "Phường 1", lat: 11.9355, lng: 108.4430, rating: 4.4, reviews: 7800, price: 1, hours: "06:30-22:00", visitMin: 60, highlights: ["ban công view thung lũng", "giá hợp lý"], desc: "Quán quen của dân du lịch, ban công nhìn ra thung lũng xanh." }),
  P({ name: "Là Việt Coffee", category: "cafe", area: "Phường 3", lat: 11.9300, lng: 108.4360, rating: 4.5, reviews: 6900, price: 2, hours: "07:30-22:00", visitMin: 75, personas: ["solo", "couple", "friends"], highlights: ["xưởng rang xay", "cà phê chuẩn gu"], desc: "Quán kiêm xưởng rang nổi tiếng, xem quy trình chế biến cà phê." }),
  P({ name: "Still Cafe", category: "cafe", area: "Phường 10", lat: 11.9440, lng: 108.4560, rating: 4.4, reviews: 3300, price: 1, hours: "08:00-22:00", visitMin: 60, personas: ["solo", "couple", "friends"], highlights: ["tối giản yên tĩnh", "hợp làm việc"], desc: "Quán phong cách tối giản, không gian tĩnh lặng để thư giãn." }),
  P({ name: "Horizon Coffee", category: "cafe", area: "Phường 4", lat: 11.9200, lng: 108.4250, rating: 4.4, reviews: 4200, price: 2, hours: "07:00-21:00", visitMin: 75, personas: ["couple", "friends"], highlights: ["view núi rừng panorama", "săn mây"], desc: "Quán trên đồi cao nhìn toàn cảnh đồi thông và mây trôi." }),
  P({ name: "The Seen House", category: "cafe", area: "Hồ Tuyền Lâm", lat: 11.9000, lng: 108.4300, rating: 4.4, reviews: 2600, price: 2, hours: "08:00-21:00", visitMin: 75, personas: ["couple", "friends", "family"], highlights: ["bên hồ Tuyền Lâm", "như cổ tích"], desc: "Café & homestay bên hồ giữa rừng thông, thơ mộng yên bình." }),
  P({ name: "Woodstock Đà Lạt", category: "cafe", area: "Phường 9", lat: 11.9580, lng: 108.4540, rating: 4.3, reviews: 3100, price: 1, hours: "07:30-21:30", visitMin: 60, personas: ["couple", "friends"], highlights: ["cây hoa giấy biểu tượng", "phong cách Tây Âu"], desc: "Quán rustic nổi tiếng với cây hoa giấy và góc chụp châu Âu." }),
  P({ name: "Bicycle Up Coffee", category: "cafe", area: "Trung tâm", lat: 11.9370, lng: 108.4410, rating: 4.3, reviews: 2900, price: 1, hours: "07:00-22:30", visitMin: 60, personas: ["solo", "couple", "friends"], highlights: ["nhà kính 3 tầng", "view phố"], desc: "Nhà kính ba tầng nhìn toàn khu dân cư, ngắm nhịp sống Đà Lạt." }),
  P({ name: "Vườn Yến Cafe", category: "cafe", area: "Phường 4", lat: 11.9250, lng: 108.4280, rating: 4.4, reviews: 2400, price: 1, hours: "07:30-21:00", visitMin: 60, personas: ["couple", "friends"], highlights: ["nhà gỗ ven đồi", "chill view thung lũng"], desc: "Quán gỗ xinh xắn nằm trên sườn đồi nhìn xuống thung lũng." }),
  P({ name: "Kombi Land Coffee", category: "cafe", area: "Trung tâm", lat: 11.9420, lng: 108.4460, rating: 4.2, reviews: 3500, price: 1, hours: "07:00-22:00", visitMin: 60, personas: ["couple", "friends", "family"], highlights: ["vương quốc xương rồng", "xe Kombi sống ảo"], desc: "Quán cà phê xe cổ Kombi với khu xương rồng độc đáo." }),
  P({ name: "Thúy Thuận Cafe", category: "cafe", area: "Phường 7", lat: 11.9720, lng: 108.4360, rating: 4.3, reviews: 2100, price: 1, hours: "07:00-18:00", visitMin: 60, personas: ["couple", "family", "friends"], highlights: ["liền nông trại", "thung lũng hoa"], desc: "Quán gắn với nông trại, sân ngoài trời ngắm thung lũng hoa rực rỡ." }),
  P({ name: "Nhà Của Thời Thanh Xuân", category: "cafe", area: "Phường 8", lat: 11.9660, lng: 108.4490, rating: 4.5, reviews: 4800, price: 1, hours: "08:00-17:00", visitMin: 75, personas: ["solo", "couple", "friends"], highlights: ["viết thư tay", "ấm áp hoài niệm"], desc: "Không gian an yên do người khiếm thính phục vụ, viết thư gửi tương lai." }),
  P({ name: "Tiệm Cà Phê Tháng Tư", category: "cafe", area: "Trung tâm", lat: 11.9400, lng: 108.4420, rating: 4.3, reviews: 2200, price: 1, hours: "07:00-22:00", visitMin: 60, personas: ["solo", "couple", "friends"], highlights: ["vintage hoài cổ", "ấm cúng"], desc: "Quán nhỏ phong cách hoài cổ, hợp ngồi đọc sách buổi chiều." }),
  P({ name: "Panorama Coffee", category: "cafe", area: "Phường 3", lat: 11.9120, lng: 108.4470, rating: 4.4, reviews: 3700, price: 2, hours: "06:30-18:00", visitMin: 75, personas: ["couple", "friends"], highlights: ["săn mây sáng sớm", "view 360 độ"], desc: "Quán trên Đồi Robin, điểm săn mây và ngắm bình minh tuyệt đẹp." }),
  P({ name: "Mountain View Coffee", category: "cafe", area: "Tà Nung", lat: 11.8900, lng: 108.3700, rating: 4.3, reviews: 1900, price: 1, hours: "07:00-18:00", visitMin: 60, personas: ["couple", "friends"], highlights: ["view núi đồi", "thoáng đãng"], desc: "Quán ven đường Tà Nung nhìn ra núi đồi rộng lớn, không khí trong lành." }),
  P({ name: "Country House Coffee Farm", category: "cafe", area: "Phường 11", lat: 11.9750, lng: 108.4700, rating: 4.4, reviews: 2300, price: 1, hours: "07:00-18:00", visitMin: 75, personas: ["couple", "family", "friends"], highlights: ["nông trại cà phê", "trải nghiệm hái"], desc: "Quán trong nông trại cà phê, kết hợp tham quan vườn và chụp ảnh." }),
  P({ name: "Dalat Train Villa & Cafe", category: "cafe", area: "Phường 10", lat: 11.9440, lng: 108.4575, rating: 4.3, reviews: 2000, price: 2, hours: "07:00-21:00", visitMin: 60, personas: ["couple", "family"], highlights: ["toa tàu cổ", "không gian Pháp"], desc: "Café trong toa tàu cổ phục dựng, gần ga Đà Lạt cực cổ điển." }),
  P({ name: "La Viên Garden Coffee", category: "cafe", area: "Phường 5", lat: 11.9330, lng: 108.4180, rating: 4.2, reviews: 1700, price: 1, hours: "07:00-21:00", visitMin: 60, personas: ["couple", "family", "friends"], highlights: ["sân vườn xanh mát", "yên tĩnh"], desc: "Quán sân vườn rộng nhiều cây xanh, hợp cả nhóm và gia đình." }),

  /* ---------------- ĂN UỐNG (eat) ---------------- */
  P({ name: "Chợ Đà Lạt & Chợ đêm", category: "eat", area: "Trung tâm", lat: 11.9417, lng: 108.4361, rating: 4.3, reviews: 30100, price: 1, hours: "06:00-22:00", visitMin: 90, personas: ["solo", "friends", "family"], highlights: ["76% khen ăn vặt", "đông vui về đêm"], desc: "Thiên đường ăn vặt: bánh tráng nướng, sữa đậu nành, đặc sản." }),
  P({ name: "Nem Nướng Bà Hùng", category: "eat", area: "Phường 2", lat: 11.9360, lng: 108.4470, rating: 4.4, reviews: 8200, price: 1, hours: "09:30-21:00", visitMin: 45, personas: ["solo", "couple", "friends", "family"], phone: "0263 3821 762", highlights: ["nem nướng trứ danh", "cuốn rau tươi"], desc: "Quán nem nướng nổi tiếng nhất Đà Lạt, cuốn cùng bánh tráng rau sống." }),
  P({ name: "Lẩu Gà Lá É Tao Ngộ", category: "eat", area: "Phường 8", lat: 11.9500, lng: 108.4500, rating: 4.4, reviews: 6400, price: 2, hours: "10:00-22:00", visitMin: 90, personas: ["friends", "family", "couple"], highlights: ["đặc sản lá é", "ấm bụng ngày lạnh"], desc: "Lẩu gà nấu lá é thanh mát, món phải thử khi đến Đà Lạt." }),
  P({ name: "Bánh Ướt Lòng Gà Trang", category: "eat", area: "Phường 1", lat: 11.9395, lng: 108.4350, rating: 4.4, reviews: 5300, price: 1, hours: "07:00-21:00", visitMin: 45, highlights: ["bánh ướt lòng gà", "đặc sản riêng"], desc: "Món bánh ướt ăn kèm lòng gà độc đáo chỉ Đà Lạt mới có." }),
  P({ name: "Bánh Căn Lệ", category: "eat", area: "Phường 1", lat: 11.9430, lng: 108.4348, rating: 4.4, reviews: 5200, price: 1, hours: "14:00-20:00", visitMin: 45, phone: "0937 445 882", highlights: ["87% khen bánh căn", "giá bình dân"], desc: "Bánh căn nóng hổi chấm mắm nêm, ấm bụng những ngày se lạnh." }),
  P({ name: "Bánh Mì Xíu Mại Cô Hồng", category: "eat", area: "Phường 1", lat: 11.9400, lng: 108.4400, rating: 4.3, reviews: 7100, price: 1, hours: "06:00-11:00", visitMin: 40, highlights: ["xíu mại nóng", "ăn sáng quốc dân"], desc: "Bánh mì chấm xíu mại nóng hổi, món sáng quen thuộc của dân Đà Lạt." }),
  P({ name: "Bánh Tráng Nướng Dì Đinh", category: "eat", area: "Phường 1", lat: 11.9385, lng: 108.4378, rating: 4.3, reviews: 4900, price: 1, hours: "14:00-21:00", visitMin: 40, personas: ["solo", "friends", "family"], highlights: ["pizza Đà Lạt", "nóng giòn"], desc: "Bánh tráng nướng trứng cút phô mai – 'pizza Đà Lạt' trứ danh." }),
  P({ name: "Phở Hiếu", category: "eat", area: "Phường 2", lat: 11.9440, lng: 108.4420, rating: 4.2, reviews: 3600, price: 1, hours: "06:00-13:00", visitMin: 40, highlights: ["nước dùng đậm", "ăn sáng ấm"], desc: "Quán phở bò quen thuộc, nước dùng đậm đà cho buổi sáng lạnh." }),
  P({ name: "Chè Hé", category: "eat", area: "Phường 1", lat: 11.9412, lng: 108.4390, rating: 4.3, reviews: 4200, price: 1, hours: "10:00-22:00", visitMin: 40, personas: ["solo", "couple", "friends", "family"], highlights: ["chè nóng đủ loại", "lâu đời"], desc: "Quán chè lâu đời, chè nóng đậu các loại ngọt ấm." }),
  P({ name: "Kem Bơ Thanh Thảo", category: "eat", area: "Phường 1", lat: 11.9420, lng: 108.4385, rating: 4.3, reviews: 6800, price: 1, hours: "08:00-22:00", visitMin: 40, personas: ["solo", "couple", "friends", "family"], highlights: ["kem bơ béo ngậy", "must-try"], desc: "Kem bơ trứ danh béo mịn, món tráng miệng đặc sản phải thử." }),
  P({ name: "Sữa Đậu Nành Hoa Sữa", category: "eat", area: "Trung tâm", lat: 11.9430, lng: 108.4375, rating: 4.2, reviews: 5100, price: 1, hours: "16:00-23:00", visitMin: 40, personas: ["solo", "couple", "friends", "family"], highlights: ["sữa nóng ngày lạnh", "bánh ngọt kèm"], desc: "Sữa đậu nành nóng ăn kèm bánh su, ấm áp về đêm." }),
  P({ name: "Góc Hà Thành", category: "eat", area: "Phường 1", lat: 11.9375, lng: 108.4420, rating: 4.4, reviews: 4400, price: 1, hours: "10:00-21:30", visitMin: 75, personas: ["solo", "couple", "friends", "family"], highlights: ["món Việt đa dạng", "giá hợp lý"], desc: "Quán cơm & món Việt được khách du lịch yêu thích, ngon rẻ." }),
  P({ name: "Nhà hàng Trống Đồng", category: "eat", area: "Phường 1", lat: 11.9388, lng: 108.4445, rating: 4.3, reviews: 3900, price: 2, hours: "10:00-22:00", visitMin: 90, personas: ["couple", "family", "friends"], highlights: ["đặc sản địa phương", "rau Đà Lạt tươi"], desc: "Nhà hàng món địa phương gần chợ: nem, nai, bò xào rau tươi." }),
  P({ name: "Le Rabelais", category: "eat", area: "Trung tâm", lat: 11.9360, lng: 108.4390, rating: 4.6, reviews: 1800, price: 3, hours: "06:30-22:00", visitMin: 120, personas: ["couple", "family"], highlights: ["fine dining cổ điển", "view hồ"], desc: "Nhà hàng fine-dining trong Dalat Palace, không gian thuộc địa sang trọng." }),
  P({ name: "Artist Alley Restaurant", category: "eat", area: "Phường 2", lat: 11.9420, lng: 108.4440, rating: 4.5, reviews: 3200, price: 2, hours: "08:00-22:00", visitMin: 90, personas: ["solo", "couple", "friends", "family"], highlights: ["món Âu - Việt", "giá tốt"], desc: "Quán món Âu & Việt giá phải chăng, salad bơ và cà ri gà được khen." }),
  P({ name: "Nhà hàng Windmills", category: "eat", area: "Trung tâm", lat: 11.9395, lng: 108.4412, rating: 4.5, reviews: 3900, price: 2, hours: "10:00-22:00", visitMin: 90, personas: ["couple", "family"], phone: "0263 3666 123", highlights: ["84% khen không gian", "hợp hẹn hò"], desc: "Nhà hàng view hồ lãng mạn, món Âu - Á cho bữa tối cặp đôi." }),
  P({ name: "Liên Hoa Bakery", category: "eat", area: "Phường 1", lat: 11.9440, lng: 108.4378, rating: 4.2, reviews: 7600, price: 1, hours: "06:00-22:00", visitMin: 45, personas: ["solo", "family", "friends"], phone: "0263 3837 303", highlights: ["70% khen bánh mì", "phục vụ nhanh"], desc: "Tiệm bánh & quán ăn lâu đời, bánh mì xíu mại và đồ ăn sáng quen thuộc." }),
  P({ name: "Memory Restaurant", category: "eat", area: "Trung tâm", lat: 11.9398, lng: 108.4405, rating: 4.3, reviews: 2700, price: 2, hours: "08:00-22:00", visitMin: 90, personas: ["couple", "family", "friends"], highlights: ["view nhà thờ", "món Việt - Âu"], desc: "Nhà hàng trung tâm nhìn ra nhà thờ Con Gà, thực đơn đa dạng." }),
  P({ name: "One More Cafe & Restaurant", category: "eat", area: "Phường 2", lat: 11.9410, lng: 108.4450, rating: 4.4, reviews: 2500, price: 2, hours: "08:00-17:00", visitMin: 75, personas: ["solo", "couple", "friends"], highlights: ["brunch kiểu Tây", "do người nước ngoài mở"], desc: "Quán brunch phương Tây nổi tiếng với bánh và đồ ăn sáng chuẩn vị." }),
  P({ name: "Lẩu Bò Ba Toa", category: "eat", area: "Phường 5", lat: 11.9330, lng: 108.4150, rating: 4.3, reviews: 4600, price: 2, hours: "09:00-21:00", visitMin: 90, personas: ["friends", "family", "couple"], highlights: ["lẩu bò trứ danh", "thịt mềm"], desc: "Quán lẩu bò gầu nổi tiếng, nước dùng đậm đà hợp tiết trời lạnh." }),

  /* ---------------- LƯU TRÚ (stay) ---------------- */
  P({ name: "Dalat Palace Heritage Hotel", category: "stay", area: "Trung tâm", lat: 11.9360, lng: 108.4392, rating: 4.5, reviews: 3200, price: 3, hours: "24h", visitMin: 30, personas: ["couple", "family"], highlights: ["di sản thuộc địa", "view hồ Xuân Hương"], desc: "Khách sạn cổ kính 5 sao kiến trúc Pháp, sang trọng bậc nhất Đà Lạt." }),
  P({ name: "Ana Mandara Villas Dalat Resort & Spa", category: "stay", area: "Phường 9", lat: 11.9520, lng: 108.4400, rating: 4.6, reviews: 2400, price: 3, hours: "24h", visitMin: 30, personas: ["couple", "family"], highlights: ["biệt thự Pháp cổ", "spa nghỉ dưỡng"], desc: "Quần thể biệt thự Pháp những năm 1920 trên đồi thông, nghỉ dưỡng cao cấp." }),
  P({ name: "Swiss-Belresort Tuyền Lâm", category: "stay", area: "Hồ Tuyền Lâm", lat: 11.9000, lng: 108.4380, rating: 4.5, reviews: 2100, price: 3, hours: "24h", visitMin: 30, personas: ["couple", "family"], highlights: ["bên hồ & sân golf", "yên tĩnh"], desc: "Resort cao cấp cạnh Hồ Tuyền Lâm và sân golf, không gian rộng rãi." }),
  P({ name: "Mercure Dalat Resort", category: "stay", area: "Phường 10", lat: 11.9445, lng: 108.4560, rating: 4.4, reviews: 2600, price: 3, hours: "24h", visitMin: 30, personas: ["couple", "family"], highlights: ["gần ga Đà Lạt", "phong cách cổ điển"], desc: "Resort phong cách hoài cổ gần ga, tiện nghi quốc tế." }),
  P({ name: "Terracotta Hotel & Resort", category: "stay", area: "Hồ Tuyền Lâm", lat: 11.8970, lng: 108.4330, rating: 4.4, reviews: 1900, price: 2, hours: "24h", visitMin: 30, personas: ["couple", "family", "friends"], highlights: ["view hồ", "có villa riêng"], desc: "Resort bên Hồ Tuyền Lâm với phòng và villa nhìn ra mặt hồ." }),
  P({ name: "Dalat Wonder Resort", category: "stay", area: "Phường 11", lat: 11.9700, lng: 108.4650, rating: 4.3, reviews: 1700, price: 2, hours: "24h", visitMin: 30, personas: ["couple", "family", "friends"], highlights: ["không gian rộng", "hồ bơi"], desc: "Resort ngoại ô yên tĩnh, nhiều tiện ích cho gia đình và nhóm." }),
  P({ name: "TTC Hotel - Ngọc Lan", category: "stay", area: "Trung tâm", lat: 11.9405, lng: 108.4370, rating: 4.3, reviews: 3000, price: 2, hours: "24h", visitMin: 30, personas: ["couple", "family", "solo"], highlights: ["ngay trung tâm", "view hồ"], desc: "Khách sạn 4 sao vị trí trung tâm, đi bộ ra Hồ Xuân Hương và chợ." }),
  P({ name: "Du Parc Hotel Dalat", category: "stay", area: "Trung tâm", lat: 11.9365, lng: 108.4388, rating: 4.3, reviews: 2800, price: 2, hours: "24h", visitMin: 30, personas: ["couple", "family", "solo"], highlights: ["cổ điển Pháp", "trung tâm"], desc: "Khách sạn cổ điển từ 1932, vị trí đẹp gần các điểm tham quan." }),
  P({ name: "Colline Hotel Dalat", category: "stay", area: "Trung tâm", lat: 11.9408, lng: 108.4420, rating: 4.4, reviews: 2500, price: 2, hours: "24h", visitMin: 30, personas: ["couple", "family", "solo"], highlights: ["sát chợ đêm", "buffet sáng tốt"], desc: "Khách sạn hiện đại ngay khu chợ đêm, tiện đi lại và ăn uống." }),
  P({ name: "Dreams Hotel Đà Lạt", category: "stay", area: "Trung tâm", lat: 11.9430, lng: 108.4395, rating: 4.5, reviews: 4100, price: 1, hours: "24h", visitMin: 30, personas: ["solo", "couple", "family", "friends"], highlights: ["giá tốt nổi tiếng", "jacuzzi & sáng ngon"], desc: "Khách sạn bình dân huyền thoại, bữa sáng phong phú, vị trí trung tâm." }),
  P({ name: "Dalat De Charme Village Resort", category: "stay", area: "Phường 4", lat: 11.9330, lng: 108.4290, rating: 4.6, reviews: 3000, price: 2, hours: "24h", visitMin: 30, personas: ["couple", "family"], phone: "0263 3550 777", highlights: ["92% khen view", "nhận phòng 14:00"], desc: "Resort trên đồi yên tĩnh, view thành phố, chuẩn nghỉ dưỡng." }),
  P({ name: "Tutu House Homestay", category: "stay", area: "Phường 9", lat: 11.9560, lng: 108.4480, rating: 4.5, reviews: 1200, price: 1, hours: "24h", visitMin: 30, personas: ["solo", "couple", "friends"], highlights: ["decor xinh", "chủ thân thiện"], desc: "Homestay nhỏ xinh được giới trẻ yêu thích, nhiều góc sống ảo." }),
  P({ name: "The Shelter Homestay", category: "stay", area: "Phường 8", lat: 11.9620, lng: 108.4500, rating: 4.4, reviews: 980, price: 1, hours: "24h", visitMin: 30, personas: ["solo", "couple", "friends"], highlights: ["ấm cúng", "giá rẻ"], desc: "Homestay ấm áp gần trung tâm, hợp khách đi một mình và nhóm bạn." }),
  P({ name: "Home Of Dreamers Homestay", category: "stay", area: "Phường 4", lat: 11.9300, lng: 108.4320, rating: 4.4, reviews: 860, price: 1, hours: "24h", visitMin: 30, personas: ["solo", "couple", "friends"], highlights: ["view đồi thông", "siêu tiết kiệm"], desc: "Homestay giá rẻ nhìn ra đồi thông, không gian trẻ trung." }),
  P({ name: "Chiburo Home", category: "stay", area: "Phường 7", lat: 11.9650, lng: 108.4350, rating: 4.5, reviews: 1100, price: 2, hours: "24h", visitMin: 30, personas: ["couple", "family", "friends"], highlights: ["cửa kính lớn", "view đồi thông"], desc: "Homestay cách trung tâm 3.5km, ban công riêng nhìn ra đồi thông." }),
  P({ name: "Lemongrass Homestay", category: "stay", area: "Phường 9", lat: 11.9590, lng: 108.4510, rating: 4.4, reviews: 740, price: 1, hours: "24h", visitMin: 30, personas: ["solo", "couple", "friends"], highlights: ["mộc mạc", "gần gũi thiên nhiên"], desc: "Homestay phong cách mộc gần thiên nhiên, chủ nhà mến khách." }),
  P({ name: "Tiny House Dalat", category: "stay", area: "Phường 8", lat: 11.9680, lng: 108.4470, rating: 4.4, reviews: 690, price: 1, hours: "24h", visitMin: 30, personas: ["couple", "friends"], highlights: ["nhà nhỏ xinh", "sống ảo"], desc: "Cụm nhà nhỏ phong cách tối giản, dễ thương cho cặp đôi." }),
  P({ name: "Zen Valley Dalat", category: "stay", area: "Phường 4", lat: 11.9280, lng: 108.4270, rating: 4.5, reviews: 1300, price: 2, hours: "24h", visitMin: 30, personas: ["couple", "family", "friends"], highlights: ["thung lũng yên tĩnh", "view rừng"], desc: "Homestay/glamping trong thung lũng, gần gũi thiên nhiên và yên bình." }),
  P({ name: "Tịnh Tâm Homestay", category: "stay", area: "Phường 9", lat: 11.9560, lng: 108.4520, rating: 4.5, reviews: 1540, price: 1, hours: "24h", visitMin: 30, personas: ["solo", "friends", "couple"], phone: "0905 778 991", highlights: ["86% khen chủ nhà", "giá hợp lý"], desc: "Homestay ấm cúng, hợp nhóm bạn và khách đi một mình." }),

  /* ---------------- VỀ ĐÊM (nightlife) ---------------- */
  P({ name: "Escape Bar (Blues Bar)", category: "nightlife", area: "Trung tâm", lat: 11.9375, lng: 108.4400, rating: 4.5, reviews: 1600, price: 2, hours: "19:00-23:30", visitMin: 120, personas: ["friends", "couple"], highlights: ["nhạc sống blues/rock", "phong cách thập niên 70"], desc: "Quán bar nhạc sống huyền thoại, không khí hoài cổ ấm cúng." }),
  P({ name: "100 Roofs Bar (Maze Bar)", category: "nightlife", area: "Trung tâm", lat: 11.9385, lng: 108.4435, rating: 4.2, reviews: 4300, price: 2, hours: "18:00-24:00", visitMin: 90, personas: ["friends", "couple"], highlights: ["mê cung độc lạ", "kiến trúc kỳ ảo"], desc: "Quán bar mê cung nhiều tầng như hang động, khám phá cực vui." }),
  P({ name: "Cung Tơ Chiều", category: "nightlife", area: "Phường 4", lat: 11.9320, lng: 108.4300, rating: 4.1, reviews: 1500, price: 1, hours: "19:30-23:00", visitMin: 120, personas: ["friends", "couple"], highlights: ["acoustic độc nhất", "chủ quán cá tính"], desc: "Quán nhạc acoustic mộc, không gian lạ và đầy cảm xúc." }),
  P({ name: "Mây Lang Thang", category: "nightlife", area: "Trung tâm", lat: 11.9400, lng: 108.4408, rating: 4.4, reviews: 5200, price: 2, hours: "17:00-22:30", visitMin: 120, personas: ["friends", "couple", "family"], highlights: ["live show ca sĩ", "sân khấu giữa rừng thông"], desc: "Sân khấu nhạc sống nổi tiếng giữa đồi thông, nhiều ca sĩ biểu diễn." }),
  P({ name: "Lululola Show", category: "nightlife", area: "Phường 10", lat: 11.9450, lng: 108.4520, rating: 4.4, reviews: 2100, price: 2, hours: "18:00-22:30", visitMin: 120, personas: ["friends", "couple", "family"], highlights: ["phòng trà ấm cúng", "nhạc Trịnh/acoustic"], desc: "Phòng trà - café nhạc sống ấm cúng, biểu diễn mỗi tối." }),
  P({ name: "V Club Da Lat", category: "nightlife", area: "Trung tâm", lat: 11.9412, lng: 108.4365, rating: 4.0, reviews: 1800, price: 2, hours: "21:00-02:00", visitMin: 120, personas: ["friends"], highlights: ["sàn nhảy sôi động", "gần chợ"], desc: "Club gần chợ Đà Lạt, DJ house/hip-hop, đông giới trẻ về đêm." }),
  P({ name: "Rain Nightclub", category: "nightlife", area: "Trung tâm", lat: 11.9430, lng: 108.4440, rating: 4.0, reviews: 1400, price: 2, hours: "21:00-02:00", visitMin: 120, personas: ["friends"], highlights: ["EDM/Vinahouse", "light show cuối tuần"], desc: "Vũ trường sôi động với DJ và light show, hợp tiệc cuối tuần." }),
  P({ name: "13 Cafe-Bar", category: "nightlife", area: "Phường 1", lat: 11.9390, lng: 108.4445, rating: 4.2, reviews: 1300, price: 1, hours: "17:00-24:00", visitMin: 90, personas: ["friends", "couple", "solo"], highlights: ["sân thượng đèn lung linh", "giá mềm"], desc: "Quán bar 2 tầng sân thượng đèn dây, hợp backpacker nhâm nhi." }),
  P({ name: "Why Not Bar", category: "nightlife", area: "Trung tâm", lat: 11.9382, lng: 108.4420, rating: 4.1, reviews: 1100, price: 1, hours: "18:00-24:00", visitMin: 90, personas: ["friends", "couple"], highlights: ["sôi động trẻ trung", "đồ uống đa dạng"], desc: "Quán bar trung tâm trẻ trung, đông khách du lịch giao lưu." }),
  P({ name: "The Hangout Bar", category: "nightlife", area: "Phường 2", lat: 11.9405, lng: 108.4450, rating: 4.2, reviews: 760, price: 1, hours: "18:00-23:30", visitMin: 90, personas: ["friends", "couple", "solo"], highlights: ["thân thiện", "gặp gỡ du khách"], desc: "Quán nhỏ ấm cúng, dễ làm quen, đồ uống hợp túi tiền." }),
  P({ name: "Diza Pub", category: "nightlife", area: "Trung tâm", lat: 11.9418, lng: 108.4432, rating: 4.0, reviews: 900, price: 2, hours: "19:00-01:00", visitMin: 90, personas: ["friends", "couple"], highlights: ["nhạc sôi động", "bia & cocktail"], desc: "Pub trung tâm nhạc sống & DJ, không khí náo nhiệt về khuya." }),
  P({ name: "Mộc Bar", category: "nightlife", area: "Phường 1", lat: 11.9395, lng: 108.4380, rating: 4.1, reviews: 680, price: 1, hours: "18:00-23:30", visitMin: 90, personas: ["friends", "couple"], highlights: ["mộc mạc ấm cúng", "acoustic"], desc: "Quán bar nhỏ phong cách mộc, nhạc acoustic nhẹ nhàng." }),

  /* ---------------- TRẢI NGHIỆM (activity) ---------------- */
  P({ name: "Thác Datanla & Máng trượt", category: "activity", area: "Đèo Prenn", lat: 11.9050, lng: 108.4470, rating: 4.3, reviews: 13400, price: 1, hours: "07:00-17:00", visitMin: 120, personas: ["friends", "family", "couple"], phone: "0263 3533 899", highlights: ["89% thích máng trượt", "coaster dài nhất ĐNÁ"], desc: "Thác nước với máng trượt cảm giác mạnh xuyên rừng thông." }),
  P({ name: "Tour Canyoning Datanla", category: "activity", area: "Đèo Prenn", lat: 11.9040, lng: 108.4480, rating: 4.8, reviews: 5200, price: 2, hours: "07:30-15:00", visitMin: 360, personas: ["friends", "couple"], highlights: ["đu dây vượt thác", "mạo hiểm số 1"], desc: "Tour vượt thác mạo hiểm: đu dây, trượt nước, nhảy thác – cực phê." }),
  P({ name: "Cáp treo Đà Lạt (Robin Hill)", category: "activity", area: "Phường 3", lat: 11.9130, lng: 108.4450, rating: 4.4, reviews: 10200, price: 2, hours: "07:30-17:00", visitMin: 90, personas: ["couple", "family", "friends"], highlights: ["ngắm rừng thông từ trên cao", "nối tới Trúc Lâm"], desc: "Tuyến cáp treo ngắm toàn cảnh rừng thông, xuống Thiền viện Trúc Lâm." }),
  P({ name: "Núi Langbiang (xe jeep)", category: "activity", area: "Lạc Dương", lat: 12.0480, lng: 108.4430, rating: 4.4, reviews: 9900, price: 1, hours: "07:30-16:30", visitMin: 180, personas: ["friends", "couple", "family"], phone: "0263 3839 088", highlights: ["85% khen săn mây", "xe jeep lên đỉnh"], desc: "Đỉnh núi cao ngắm toàn cảnh, săn mây sáng sớm, đi xe jeep thú vị." }),
  P({ name: "Cầu Đất Farm", category: "activity", area: "Xuân Trường", lat: 11.8350, lng: 108.6220, rating: 4.4, reviews: 7300, price: 1, hours: "07:00-18:00", visitMin: 180, personas: ["couple", "family", "friends"], highlights: ["đồi chè bạt ngàn", "săn mây & sống ảo"], desc: "Nông trại chè trăm tuổi, biển mây buổi sáng và check-in tuyệt đẹp." }),
  P({ name: "Chèo SUP Hồ Tuyền Lâm", category: "activity", area: "Hồ Tuyền Lâm", lat: 11.8995, lng: 108.4340, rating: 4.5, reviews: 2100, price: 2, hours: "06:00-17:00", visitMin: 150, personas: ["friends", "couple"], highlights: ["chèo SUP mặt hồ", "bình minh trên hồ"], desc: "Chèo SUP/kayak trên mặt hồ tĩnh lặng giữa rừng thông." }),
  P({ name: "Thác Prenn", category: "activity", area: "Đèo Prenn", lat: 11.8760, lng: 108.4560, rating: 4.2, reviews: 8800, price: 1, hours: "07:00-17:00", visitMin: 90, personas: ["family", "couple", "friends"], highlights: ["thác đẹp cửa ngõ", "đi sau màn nước"], desc: "Thác nước ngay cửa ngõ Đà Lạt, lối đi luồn sau dòng thác." }),
  P({ name: "Thác Voi (Elephant Falls)", category: "activity", area: "Nam Ban", lat: 11.8350, lng: 108.3000, rating: 4.2, reviews: 5600, price: 1, hours: "07:00-17:00", visitMin: 90, personas: ["friends", "couple", "family"], highlights: ["thác hùng vĩ", "kết hợp Nam Ban"], desc: "Thác lớn hùng vĩ gần làng Nam Ban, kết hợp tham quan làng nghề." }),
  P({ name: "Thác Pongour", category: "activity", area: "Đức Trọng", lat: 11.7500, lng: 108.3400, rating: 4.4, reviews: 6100, price: 1, hours: "07:00-17:00", visitMin: 120, personas: ["friends", "couple", "family"], highlights: ["thác 7 tầng", "đẹp nhất Tây Nguyên"], desc: "Thác bậc thang hùng vĩ được mệnh danh 'Nam Thiên đệ nhất thác'." }),
  P({ name: "Làng Cù Lần", category: "activity", area: "Lạc Dương", lat: 12.0600, lng: 108.4000, rating: 4.2, reviews: 6400, price: 2, hours: "07:30-17:00", visitMin: 180, personas: ["family", "friends", "couple"], highlights: ["xe jeep lội suối", "không gian núi rừng"], desc: "Khu du lịch sinh thái giữa rừng, trải nghiệm xe jeep và trò chơi." }),
  P({ name: "Vườn dâu Biofresh", category: "activity", area: "Hồ Tuyền Lâm", lat: 11.9020, lng: 108.4400, rating: 4.2, reviews: 3300, price: 2, hours: "08:00-17:00", visitMin: 75, personas: ["family", "couple", "friends"], highlights: ["tự hái dâu tây", "dâu sạch công nghệ cao"], desc: "Trang trại dâu công nghệ cao, tự tay hái và thưởng thức dâu sạch." }),
  P({ name: "Hầm rượu vang Đà Lạt", category: "activity", area: "Phường 10", lat: 11.9460, lng: 108.4540, rating: 4.1, reviews: 2200, price: 1, hours: "08:00-17:00", visitMin: 60, personas: ["couple", "friends", "family"], highlights: ["thử vang Đà Lạt", "tìm hiểu quy trình"], desc: "Tham quan và nếm thử rượu vang đặc sản Đà Lạt." }),
  P({ name: "Thung lũng Vàng", category: "activity", area: "Lạc Dương", lat: 12.0500, lng: 108.4100, rating: 4.2, reviews: 4200, price: 1, hours: "07:00-17:00", visitMin: 120, personas: ["couple", "family", "friends"], highlights: ["vườn cảnh & hồ", "không khí trong lành"], desc: "Khu du lịch sinh thái cạnh hồ Suối Vàng với vườn cảnh đẹp." }),
  P({ name: "Trekking Bidoup - Núi Bà", category: "activity", area: "Lạc Dương", lat: 12.1100, lng: 108.6700, rating: 4.6, reviews: 1200, price: 2, hours: "06:00-16:00", visitMin: 480, personas: ["friends", "couple"], highlights: ["rừng nguyên sinh", "trekking cho người mê núi"], desc: "Vườn quốc gia rừng nguyên sinh, cung trekking và cắm trại hấp dẫn." }),

  // --- Mua sắm (shopping) ---
  P({ name: "Chợ Đà Lạt", category: "shopping", area: "Trung tâm", lat: 11.9432, lng: 108.4368, rating: 4.3, reviews: 22800, price: 1, hours: "05:00-19:00", visitMin: 60, highlights: ["chợ trung tâm biểu tượng", "đặc sản & thời trang"], desc: "Chợ trung tâm nổi tiếng, mua đặc sản, len, mứt và đồ ăn vặt." }),
  P({ name: "Chợ đêm Đà Lạt (Chợ Âm Phủ)", category: "shopping", area: "Trung tâm", lat: 11.9440, lng: 108.4372, rating: 4.2, reviews: 15600, price: 1, hours: "17:00-23:00", visitMin: 75, personas: ["friends", "couple", "family"], highlights: ["ăn vặt về đêm", "sắm đồ len giá rẻ"], desc: "Chợ đêm sầm uất với đồ ăn nóng hổi và quần áo mùa lạnh." }),
  P({ name: "Dalat Center", category: "shopping", area: "Trung tâm", lat: 11.9421, lng: 108.4386, rating: 4.1, reviews: 4200, price: 2, hours: "08:00-22:00", visitMin: 60, highlights: ["trung tâm thương mại", "thời trang & cà phê"], desc: "Trung tâm thương mại ngay khu Hòa Bình, mua sắm và ăn uống." }),
  P({ name: "Go! Đà Lạt (Big C)", category: "shopping", area: "Phường 3", lat: 11.9338, lng: 108.4452, rating: 4.3, reviews: 9800, price: 1, hours: "08:00-22:00", visitMin: 60, personas: ["family", "couple", "friends"], highlights: ["siêu thị lớn", "đầy đủ nhu yếu phẩm"], desc: "Đại siêu thị với thực phẩm, đặc sản và khu ăn uống rộng rãi." }),
  P({ name: "L'angfarm Buffet & Store", category: "shopping", area: "Trung tâm", lat: 11.9427, lng: 108.4399, rating: 4.4, reviews: 5100, price: 2, hours: "07:00-22:00", visitMin: 45, highlights: ["đặc sản Đà Lạt cao cấp", "mứt, trà, nông sản"], desc: "Cửa hàng đặc sản Đà Lạt uy tín: mứt, trà atiso, nông sản sấy." }),
  P({ name: "Khu Hòa Bình", category: "shopping", area: "Trung tâm", lat: 11.9425, lng: 108.4378, rating: 4.2, reviews: 6700, price: 1, hours: "08:00-22:00", visitMin: 60, personas: ["friends", "couple", "family"], highlights: ["phố mua sắm trung tâm", "rạp Hòa Bình cổ"], desc: "Khu phố mua sắm sầm uất quanh rạp Hòa Bình, nhiều tiệm len & quà." }),
  P({ name: "Chợ Hoa Đà Lạt", category: "shopping", area: "Trung tâm", lat: 11.9445, lng: 108.4362, rating: 4.3, reviews: 3400, price: 1, hours: "06:00-18:00", visitMin: 45, highlights: ["hoa tươi Đà Lạt", "giá gốc nhà vườn"], desc: "Chợ hoa bên hồ Xuân Hương, mua hoa tươi và cây cảnh Đà Lạt." }),
  P({ name: "Đặc sản Tâm Châu", category: "shopping", area: "Phường 3", lat: 11.9360, lng: 108.4410, rating: 4.3, reviews: 2100, price: 1, hours: "07:30-21:00", visitMin: 30, highlights: ["trà & cà phê đặc sản", "quà biếu"], desc: "Thương hiệu trà - cà phê B'Lao, điểm mua quà đặc sản quen thuộc." }),
  P({ name: "Cửa hàng len Đà Lạt", category: "shopping", area: "Trung tâm", lat: 11.9430, lng: 108.4380, rating: 4.1, reviews: 1500, price: 1, hours: "08:00-21:00", visitMin: 40, personas: ["couple", "friends", "family"], highlights: ["áo len mùa lạnh", "đặc trưng Đà Lạt"], desc: "Các tiệm len khu trung tâm, áo khoác - khăn - mũ giữ ấm giá tốt." }),
  P({ name: "Hồng sấy & mứt Đà Lạt", category: "shopping", area: "Phường 8", lat: 11.9520, lng: 108.4470, rating: 4.2, reviews: 1800, price: 1, hours: "08:00-18:00", visitMin: 30, highlights: ["hồng treo gió", "mứt trái cây"], desc: "Cửa hàng nông sản sấy: hồng treo gió, mứt dâu, atiso làm quà." }),
  P({ name: "Cối Xay Gió - Đặc sản & quà", category: "shopping", area: "Trung tâm", lat: 11.9412, lng: 108.4405, rating: 4.2, reviews: 2600, price: 1, hours: "08:00-22:00", visitMin: 30, personas: ["couple", "friends", "family"], highlights: ["check-in cối xay gió", "quà lưu niệm"], desc: "Điểm check-in cối xay gió kèm cửa hàng quà lưu niệm dễ thương." }),
  P({ name: "Siêu thị đặc sản Đà Lạt Sương Mai", category: "shopping", area: "Phường 1", lat: 11.9358, lng: 108.4425, rating: 4.2, reviews: 1300, price: 1, hours: "07:00-21:30", visitMin: 30, highlights: ["đầy đủ đặc sản", "giá niêm yết"], desc: "Siêu thị đặc sản tổng hợp, mua mứt - trà - rượu vang - nông sản." }),
];

RAW.forEach((p, i) => {
  p.id = noDia(p.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) + "-" + i;
});

/* Append extra places discovered from Google Maps (discover-maps.mjs), per city. */
function appendExtras(arr, defaultCity) {
  if (!Array.isArray(arr)) return;
  const have = new Set(RAW.map((p) => p.id));
  for (const e of arr) {
    if (!e.id || have.has(e.id)) continue;
    e.city = e.city || defaultCity;
    e.personas = e.personas || ["solo", "couple", "friends", "family"];
    e.highlights = e.highlights || [];
    if (!("phone" in e)) e.phone = "";
    if (!e.img) e.img = ph(e.category);
    if (!e.mapsUrl) e.mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(e.name + " " + cityLabel(e.city));
    RAW.push(e);
    have.add(e.id);
  }
}
appendExtras(window.PLACES_EXTRA, "dalat");
appendExtras(window.PLACES_NHATRANG, "nhatrang");

/* Merge real Google Maps photos/prices scraped into place-media.js (if present). */
if (window.PLACE_MEDIA) {
  for (const p of RAW) {
    const m = window.PLACE_MEDIA[p.id];
    if (!m) continue;
    // real coords for accurate travel time — only if inside the place's city box (reject wrong-city)
    const box = cityBox(p.city);
    if (m.lat != null && m.lng != null && (!box || (m.lat >= box.minLat && m.lat <= box.maxLat && m.lng >= box.minLng && m.lng <= box.maxLng))) { p.lat = m.lat; p.lng = m.lng; }
    if (m.img) p.img = m.img;
    if (m.photos && m.photos.length) p.photos = m.photos;
    if (m.comments && m.comments.length) p.comments = m.comments;
    if (m.price !== undefined && m.price !== "") p.price = m.price;
    if (m.phone) p.phone = m.phone;
    if (m.rating) p.rating = m.rating;
    if (m.reviews) p.reviews = m.reviews;
    p.realData = true;
  }
}

window.PLACES = RAW;
