-- Bảng pháp trị: thêm cột theo mẫu luận trị TCM (PostgreSQL).
-- Chạy một lần sau migrate-phap-tri-bai-thuoc-nhom-duoc-ly.sql (hoặc khi đã có bảng phap_tri).

ALTER TABLE phap_tri ADD COLUMN IF NOT EXISTS am_duong TEXT;
ALTER TABLE phap_tri ADD COLUMN IF NOT EXISTS ton_thuong TEXT;
ALTER TABLE phap_tri ADD COLUMN IF NOT EXISTS tac_nhan TEXT;
ALTER TABLE phap_tri ADD COLUMN IF NOT EXISTS ban_chat TEXT;
ALTER TABLE phap_tri ADD COLUMN IF NOT EXISTS vi_tri_tien_trinh TEXT;
ALTER TABLE phap_tri ADD COLUMN IF NOT EXISTS mach_chan TEXT;
ALTER TABLE phap_tri ADD COLUMN IF NOT EXISTS chat_luoi TEXT;
ALTER TABLE phap_tri ADD COLUMN IF NOT EXISTS nguyen_nhan TEXT;
