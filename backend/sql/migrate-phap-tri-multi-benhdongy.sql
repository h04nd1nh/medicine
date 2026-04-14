-- Nhiều phap_tri có thể gắn cùng một benh_dong_y (chips Pháp trị ở Danh mục bệnh Đông y).
-- PostgreSQL: gỡ mọi UNIQUE chỉ gồm cột id_benh_dong_y (tên constraint có thể khác theo bản tạo bảng).
ALTER TABLE phap_tri DROP CONSTRAINT IF EXISTS phap_tri_id_benh_dong_y_key;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'phap_tri'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) = 'UNIQUE (id_benh_dong_y)'
  LOOP
    EXECUTE format('ALTER TABLE phap_tri DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END$$;
