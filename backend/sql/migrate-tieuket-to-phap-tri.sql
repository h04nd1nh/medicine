-- Đồng bộ tieuket (benh_dong_y) → phap_tri.chung_trang + liên kết id_benh_dong_y.
-- Chạy trên DB đã có bảng phap_tri và benh_dong_y (PostgreSQL).
--
-- Bước 1: Bản ghi phap_tri đã có id_benh_dong_y → ghi đè chung_trang bằng tieuket hiện tại.
-- Bước 2: Bệnh có tieuket khác rỗng nhưng chưa có dòng phap_tri trỏ tới → INSERT một dòng pháp trị.
--
-- Lưu ý: Không xóa cột tieuket trên benh_dong_y (ứng dụng vẫn có thể dùng làm tên mô hình).
-- Nếu sau này muốn dọn tieuket trên bảng bệnh, làm migration riêng và kiểm tra UI/API.

BEGIN;

-- 1) Cập nhật chứng trạng từ tiểu kết bệnh (đã liên kết trước đó)
UPDATE phap_tri p
SET chung_trang = TRIM(b.tieuket)
FROM benh_dong_y b
WHERE p.id_benh_dong_y = b.id
  AND b.tieuket IS NOT NULL
  AND TRIM(b.tieuket) <> '';

-- 2) Tạo phap_tri mới cho bệnh có tieuket nhưng chưa có pháp trị gắn id_benh_dong_y
INSERT INTO phap_tri (id_benh_dong_y, chung_trang)
SELECT b.id, TRIM(b.tieuket)
FROM benh_dong_y b
WHERE b.tieuket IS NOT NULL
  AND TRIM(b.tieuket) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM phap_tri p WHERE p.id_benh_dong_y = b.id
  );

COMMIT;

-- --- Tuỳ chọn (thường KHÔNG nên): xóa nội dung tieuket sau khi đã copy sang phap_tri ---
-- BEGIN;
-- UPDATE benh_dong_y b
-- SET tieuket = NULL
-- WHERE EXISTS (SELECT 1 FROM phap_tri p WHERE p.id_benh_dong_y = b.id AND TRIM(COALESCE(p.chung_trang, '')) <> '');
-- COMMIT;
