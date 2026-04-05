-- Pháp trị: id riêng; id_benh_dong_y nullable UNIQUE (nhiều dòng không gắn bệnh được phép).
-- Mỗi bệnh tối đa một dòng có id_benh_dong_y trỏ tới bệnh đó (ứng dụng tự tạo khi thêm bệnh).

DROP TABLE IF EXISTS phap_tri_nhom_duoc_ly_nho CASCADE;
DROP TABLE IF EXISTS phap_tri_bai_thuoc CASCADE;
DROP TABLE IF EXISTS phap_tri CASCADE;

CREATE TABLE phap_tri (
  id SERIAL PRIMARY KEY,
  id_benh_dong_y INTEGER UNIQUE REFERENCES benh_dong_y(id) ON DELETE SET NULL,
  ten_phap_tri VARCHAR(255) NOT NULL,
  nguyen_tac VARCHAR(512),
  y_nghia_co_che TEXT,
  bat_phap VARCHAR(255),
  bat_cuong VARCHAR(255),
  luc_dam VARCHAR(255),
  tang_phu VARCHAR(255),
  trieu_chung_ghi TEXT
);

CREATE INDEX idx_phap_tri_benh ON phap_tri(id_benh_dong_y);

CREATE TABLE phap_tri_bai_thuoc (
  id_phap_tri INTEGER NOT NULL REFERENCES phap_tri(id) ON DELETE CASCADE,
  id_bai_thuoc INTEGER NOT NULL REFERENCES bai_thuoc(id) ON DELETE CASCADE,
  PRIMARY KEY (id_phap_tri, id_bai_thuoc)
);

CREATE TABLE phap_tri_nhom_duoc_ly_nho (
  id_phap_tri INTEGER NOT NULL REFERENCES phap_tri(id) ON DELETE CASCADE,
  id_nhom_duoc_ly_nho INTEGER NOT NULL REFERENCES nhom_duoc_ly_nho(id) ON DELETE CASCADE,
  PRIMARY KEY (id_phap_tri, id_nhom_duoc_ly_nho)
);
