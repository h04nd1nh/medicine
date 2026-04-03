-- =============================================================================
-- Gộp bản ghi trùng: cong_dung, chu_tri, kieng_ky (theo tên đã chuẩn hóa),
-- cập nhật lại khóa ngoại trên vi_thuoc_cong_dung / vi_thuoc_chu_tri / vi_thuoc_kieng_ky.
--
-- Chuẩn hóa giống app: lower(trim(regexp_replace(ten, '\s+', ' ', 'g')))
-- Giữ bản ghi có id NHỎ NHẤT trong mỗi nhóm trùng.
--
-- Lưu ý:
-- - Bài thuốc (bai_thuoc) không tham chiếu trực tiếp tới các bảng danh mục này;
--   thành phần bài thuốc trỏ tới vi_thuoc — sau migration, vị thuốc vẫn trỏ đúng
--   các mục danh mục đã gộp.
-- - CHẠY TRÁNH GIAO DỊCH ĐANG GHI / backup DB trước.
-- - Chạy trong PostgreSQL (Aiven/local).
-- =============================================================================

BEGIN;

-- ─── CÔNG DỤNG ───────────────────────────────────────────────────────────────
CREATE TEMP TABLE _cd_merge ON COMMIT DROP AS
SELECT
  cd.id AS old_id,
  MIN(cd.id) OVER (
    PARTITION BY lower(trim(regexp_replace(cd.ten_cong_dung, '\s+', ' ', 'g')))
  ) AS keeper_id
FROM cong_dung cd;

-- Ghi chú liên kết: gộp khi cùng vị thuốc đã có cả keeper và dòng trùng (old_id)
UPDATE vi_thuoc_cong_dung k
SET ghi_chu = CASE
  WHEN k.ghi_chu IS NULL OR trim(k.ghi_chu) = '' THEN l.ghi_chu
  WHEN l.ghi_chu IS NULL OR trim(l.ghi_chu) = '' THEN k.ghi_chu
  WHEN trim(k.ghi_chu) = trim(l.ghi_chu) THEN k.ghi_chu
  ELSE trim(k.ghi_chu) || E'\n' || trim(l.ghi_chu)
END
FROM vi_thuoc_cong_dung l
JOIN _cd_merge mm ON l.id_cong_dung = mm.old_id AND mm.old_id <> mm.keeper_id
WHERE k.id_vi_thuoc = l.id_vi_thuoc
  AND k.id_cong_dung = mm.keeper_id
  AND l.id_cong_dung = mm.old_id;

-- Xóa liên kết tới bản trùng khi đã tồn tại liên kết tới keeper (cùng vị thuốc)
DELETE FROM vi_thuoc_cong_dung l
USING _cd_merge mm
WHERE l.id_cong_dung = mm.old_id
  AND mm.old_id <> mm.keeper_id
  AND EXISTS (
    SELECT 1
    FROM vi_thuoc_cong_dung k
    WHERE k.id_vi_thuoc = l.id_vi_thuoc
      AND k.id_cong_dung = mm.keeper_id
  );

-- Đổi id_cong_dung còn lại trỏ tới old_id → keeper_id
UPDATE vi_thuoc_cong_dung v
SET id_cong_dung = mm.keeper_id
FROM _cd_merge mm
WHERE v.id_cong_dung = mm.old_id
  AND mm.old_id <> mm.keeper_id;

DELETE FROM cong_dung cd
USING _cd_merge mm
WHERE cd.id = mm.old_id AND mm.old_id <> mm.keeper_id;

-- ─── CHỦ TRỊ ─────────────────────────────────────────────────────────────────
CREATE TEMP TABLE _ct_merge ON COMMIT DROP AS
SELECT
  ct.id AS old_id,
  MIN(ct.id) OVER (
    PARTITION BY lower(trim(regexp_replace(ct.ten_chu_tri, '\s+', ' ', 'g')))
  ) AS keeper_id
FROM chu_tri ct;

UPDATE vi_thuoc_chu_tri k
SET ghi_chu = CASE
  WHEN k.ghi_chu IS NULL OR trim(k.ghi_chu) = '' THEN l.ghi_chu
  WHEN l.ghi_chu IS NULL OR trim(l.ghi_chu) = '' THEN k.ghi_chu
  WHEN trim(k.ghi_chu) = trim(l.ghi_chu) THEN k.ghi_chu
  ELSE trim(k.ghi_chu) || E'\n' || trim(l.ghi_chu)
END
FROM vi_thuoc_chu_tri l
JOIN _ct_merge mm ON l.id_chu_tri = mm.old_id AND mm.old_id <> mm.keeper_id
WHERE k.id_vi_thuoc = l.id_vi_thuoc
  AND k.id_chu_tri = mm.keeper_id
  AND l.id_chu_tri = mm.old_id;

DELETE FROM vi_thuoc_chu_tri l
USING _ct_merge mm
WHERE l.id_chu_tri = mm.old_id
  AND mm.old_id <> mm.keeper_id
  AND EXISTS (
    SELECT 1
    FROM vi_thuoc_chu_tri k
    WHERE k.id_vi_thuoc = l.id_vi_thuoc
      AND k.id_chu_tri = mm.keeper_id
  );

UPDATE vi_thuoc_chu_tri v
SET id_chu_tri = mm.keeper_id
FROM _ct_merge mm
WHERE v.id_chu_tri = mm.old_id
  AND mm.old_id <> mm.keeper_id;

DELETE FROM chu_tri ct
USING _ct_merge mm
WHERE ct.id = mm.old_id AND mm.old_id <> mm.keeper_id;

-- ─── KIÊNG KỴ ────────────────────────────────────────────────────────────────
CREATE TEMP TABLE _kk_merge ON COMMIT DROP AS
SELECT
  kk.id AS old_id,
  MIN(kk.id) OVER (
    PARTITION BY lower(trim(regexp_replace(kk.ten_kieng_ky, '\s+', ' ', 'g')))
  ) AS keeper_id
FROM kieng_ky kk;

UPDATE vi_thuoc_kieng_ky k
SET ghi_chu = CASE
  WHEN k.ghi_chu IS NULL OR trim(k.ghi_chu) = '' THEN l.ghi_chu
  WHEN l.ghi_chu IS NULL OR trim(l.ghi_chu) = '' THEN k.ghi_chu
  WHEN trim(k.ghi_chu) = trim(l.ghi_chu) THEN k.ghi_chu
  ELSE trim(k.ghi_chu) || E'\n' || trim(l.ghi_chu)
END
FROM vi_thuoc_kieng_ky l
JOIN _kk_merge mm ON l.id_kieng_ky = mm.old_id AND mm.old_id <> mm.keeper_id
WHERE k.id_vi_thuoc = l.id_vi_thuoc
  AND k.id_kieng_ky = mm.keeper_id
  AND l.id_kieng_ky = mm.old_id;

DELETE FROM vi_thuoc_kieng_ky l
USING _kk_merge mm
WHERE l.id_kieng_ky = mm.old_id
  AND mm.old_id <> mm.keeper_id
  AND EXISTS (
    SELECT 1
    FROM vi_thuoc_kieng_ky k
    WHERE k.id_vi_thuoc = l.id_vi_thuoc
      AND k.id_kieng_ky = mm.keeper_id
  );

UPDATE vi_thuoc_kieng_ky v
SET id_kieng_ky = mm.keeper_id
FROM _kk_merge mm
WHERE v.id_kieng_ky = mm.old_id
  AND mm.old_id <> mm.keeper_id;

DELETE FROM kieng_ky kk
USING _kk_merge mm
WHERE kk.id = mm.old_id AND mm.old_id <> mm.keeper_id;

COMMIT;

-- Sau khi chạy: kiểm tra nhanh (không trùng theo tên chuẩn hóa)
-- SELECT lower(trim(regexp_replace(ten_cong_dung, '\s+', ' ', 'g'))) k, count(*) FROM cong_dung GROUP BY 1 HAVING count(*) > 1;
-- SELECT lower(trim(regexp_replace(ten_chu_tri, '\s+', ' ', 'g'))) k, count(*) FROM chu_tri GROUP BY 1 HAVING count(*) > 1;
-- SELECT lower(trim(regexp_replace(ten_kieng_ky, '\s+', ' ', 'g'))) k, count(*) FROM kieng_ky GROUP BY 1 HAVING count(*) > 1;
