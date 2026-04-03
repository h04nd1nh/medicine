-- Chuẩn hóa bảng vi_thuoc theo mẫu Excel (PostgreSQL).
-- Chạy thủ công trên DB production/staging sau khi backup nếu cần.
-- Các cột thừa bị xóa — dữ liệu trong đó sẽ mất.

-- Thêm cột mới (nếu chưa có)
ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS nhom_lon character varying(255);

-- Mở rộng độ dài text cho quy_kinh nếu cột cũ là varchar ngắn
ALTER TABLE vi_thuoc ALTER COLUMN quy_kinh TYPE text USING quy_kinh::text;

-- Xóa cột thừa
ALTER TABLE vi_thuoc DROP COLUMN IF EXISTS ten_khoa_hoc;
ALTER TABLE vi_thuoc DROP COLUMN IF EXISTS bo_phan_dung;
ALTER TABLE vi_thuoc DROP COLUMN IF EXISTS tinh_vi;
ALTER TABLE vi_thuoc DROP COLUMN IF EXISTS luu_y;
ALTER TABLE vi_thuoc DROP COLUMN IF EXISTS tu_khi;
ALTER TABLE vi_thuoc DROP COLUMN IF EXISTS vi_toan;
ALTER TABLE vi_thuoc DROP COLUMN IF EXISTS vi_khu;
ALTER TABLE vi_thuoc DROP COLUMN IF EXISTS vi_cam;
ALTER TABLE vi_thuoc DROP COLUMN IF EXISTS vi_tan;
ALTER TABLE vi_thuoc DROP COLUMN IF EXISTS vi_ham;
ALTER TABLE vi_thuoc DROP COLUMN IF EXISTS huong_tgpt;
ALTER TABLE vi_thuoc DROP COLUMN IF EXISTS tac_dung_chinh;
