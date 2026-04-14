-- Bệnh Tây y ↔ Pháp trị (nhiều-nhiều). PostgreSQL.
CREATE TABLE IF NOT EXISTS benh_tay_y_phap_tri (
  id_benh_tay_y INTEGER NOT NULL REFERENCES benh_tay_y(id) ON DELETE CASCADE,
  id_phap_tri INTEGER NOT NULL REFERENCES phap_tri(id) ON DELETE CASCADE,
  PRIMARY KEY (id_benh_tay_y, id_phap_tri)
);
CREATE INDEX IF NOT EXISTS idx_btypt_phap_tri ON benh_tay_y_phap_tri(id_phap_tri);
