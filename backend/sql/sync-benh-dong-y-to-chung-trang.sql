-- Sync benh_dong_y.tieuket -> phap_tri.chung_trang (PostgreSQL)
--
-- Behavior aligned with backend source:
-- - phap_tri links to benh_dong_y via phap_tri.id_benh_dong_y (UNIQUE, nullable)
-- - chung_trang is the text field that mirrors tieuket
-- - existing linked rows are updated
-- - missing linked rows are created for diseases that have non-empty tieuket
--
-- Safe to re-run (idempotent for linked records).

BEGIN;

-- 1) Update all already-linked phap_tri rows from current tieuket.
--    Empty/blank tieuket becomes NULL in chung_trang.
UPDATE phap_tri p
SET chung_trang = NULLIF(BTRIM(b.tieuket), '')
FROM benh_dong_y b
WHERE p.id_benh_dong_y = b.id;

-- 2) Create missing phap_tri rows for benh_dong_y entries that:
--    - are not linked yet
--    - have non-empty tieuket
INSERT INTO phap_tri (id_benh_dong_y, chung_trang)
SELECT
  b.id,
  NULLIF(BTRIM(b.tieuket), '')
FROM benh_dong_y b
WHERE NULLIF(BTRIM(b.tieuket), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM phap_tri p
    WHERE p.id_benh_dong_y = b.id
  );

COMMIT;
