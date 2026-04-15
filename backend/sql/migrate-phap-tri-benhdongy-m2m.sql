-- Chuyển quan hệ phap_tri <-> benh_dong_y sang many-to-many.
-- Giữ cột legacy phap_tri.id_benh_dong_y để tương thích ngược, nhưng dữ liệu chuẩn nằm ở bảng nối.

CREATE TABLE IF NOT EXISTS benh_dong_y_phap_tri (
  id_benh_dong_y INTEGER NOT NULL REFERENCES benh_dong_y(id) ON DELETE CASCADE,
  id_phap_tri INTEGER NOT NULL REFERENCES phap_tri(id) ON DELETE CASCADE,
  PRIMARY KEY (id_benh_dong_y, id_phap_tri)
);

CREATE INDEX IF NOT EXISTS idx_bdy_pt_phap_tri ON benh_dong_y_phap_tri (id_phap_tri);

-- Backfill dữ liệu cũ từ FK một-một sang bảng nối mới.
INSERT INTO benh_dong_y_phap_tri (id_benh_dong_y, id_phap_tri)
SELECT pt.id_benh_dong_y, pt.id
FROM phap_tri pt
WHERE pt.id_benh_dong_y IS NOT NULL
ON CONFLICT DO NOTHING;
