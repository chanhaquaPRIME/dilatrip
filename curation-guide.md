# Curation Guide — Đà Lạt places

Fill `curation-template.csv`. Target **~40–80 places** for the MVP, spread
across categories. The 5 example rows are placeholders — verify their
numbers and edit freely.

## How many per category (rough target)
- `eat` (quán ăn): ~15–20
- `cafe` (cà phê / view): ~10–15
- `visit` (tham quan / chụp ảnh): ~15–20
- `stay` (lưu trú): ~5–10
- `nightlife` (về đêm): ~3–5
- `activity` (trải nghiệm: chèo, leo, tour): ~3–5

## Column meaning
| Column | Meaning | Example |
|---|---|---|
| `name_vi` | Tên tiếng Việt | Quảng trường Lâm Viên |
| `category` | eat / cafe / visit / stay / nightlife / activity | cafe |
| `area` | Khu vực / phường | Trung tâm |
| `address` | Địa chỉ đầy đủ (để trong dấu " nếu có dấu phẩy) | "1 Quang Trung, P.10" |
| `lat`,`lng` | Toạ độ (lấy từ Google Maps) | 11.9426, 108.4530 |
| `rating` | Điểm sao Google (0–5) | 4.4 |
| `review_count` | Số lượt đánh giá Google | 12000 |
| `price_level` | 0 free, 1 rẻ ₫, 2 vừa ₫₫, 3 cao ₫₫₫ | 1 |
| `hours` | Giờ mở cửa | 07:00-17:00 hoặc 24h |
| `est_visit_minutes` | Thời gian tham quan ước tính | 60 |
| `persona_tags` | Hợp nhóm nào, cách nhau bằng `;` | couple;friends |
| `google_maps_url` | Link Google Maps địa điểm | https://maps.google.com/... |
| `photo_source` | Nguồn ảnh hợp lệ (Google attribution / tự chụp) | self |
| `notes` | Ghi chú ngắn | đẹp về đêm |

## Rules
- `persona_tags` chỉ dùng: `solo`, `couple`, `friends`, `family`.
- Lấy `lat/lng`, `rating`, `review_count`, `hours` từ Google Maps cho chính xác.
- Ưu tiên nơi nhiều đánh giá + sao cao + thật sự nổi tiếng với người Việt.
- Phân bố địa lý: tránh dồn hết một khu, để lịch trình ít zig-zag.
- Ảnh: chỉ dùng nguồn hợp lệ (tự chụp hoặc Google Places kèm attribution).

## Tip
Bạn có thể điền tay, hoặc sau này mình viết script gọi Google Places API
để tự điền `lat/lng/rating/review_count/hours` từ tên + địa chỉ.
