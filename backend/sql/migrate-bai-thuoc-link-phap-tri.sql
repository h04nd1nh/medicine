-- Liên kết bai_thuoc ↔ phap_tri + tự tạo dòng phap_tri còn thiếu theo chứng trạng bài thuốc.
--
-- 0) Token tách từ bai_thuoc.chung_trang mà chưa có phap_tri tương ứng (trim / lower+gộp space / tiểu kết trước ngoặc)
--    → INSERT phap_tri(chung_trang) — giữ nguyên chữ trên bài thuốc (bản rút gọn khi trùng full_lc).
-- A) Link từ phap_tri.id_bai_thuoc.
-- B) Link từ tách chung_trang (3 mức khớp như trước).
--
-- PostgreSQL. Sao lưu DB trước. Chạy lại an toàn (ON CONFLICT trên bảng nối).

BEGIN;

CREATE TABLE IF NOT EXISTS bai_thuoc_phap_tri (
  id_bai_thuoc INTEGER NOT NULL REFERENCES bai_thuoc(id) ON DELETE CASCADE,
  id_phap_tri INTEGER NOT NULL REFERENCES phap_tri(id) ON DELETE CASCADE,
  doan_chung_trang TEXT,
  thu_tu SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (id_bai_thuoc, id_phap_tri)
);

CREATE INDEX IF NOT EXISTS idx_bai_thuoc_phap_tri_bt ON bai_thuoc_phap_tri(id_bai_thuoc);
CREATE INDEX IF NOT EXISTS idx_bai_thuoc_phap_tri_pt ON bai_thuoc_phap_tri(id_phap_tri);

-- ─── 0) Tạo phap_tri mới cho token có trên bài thuốc mà danh mục chưa có ─────
WITH pt_n AS (
  SELECT
    trim(both FROM COALESCE(chung_trang, '')) AS pt_t,
    lower(regexp_replace(trim(both FROM COALESCE(chung_trang, '')), '\s+', ' ', 'g')) AS full_lc,
    trim(both FROM regexp_replace(
      lower(regexp_replace(trim(both FROM COALESCE(chung_trang, '')), '\s+', ' ', 'g')),
      '[（(].*',
      ''
    )) AS base_lc
  FROM phap_tri
  WHERE trim(both FROM COALESCE(chung_trang, '')) <> ''
),
all_tok AS (
  SELECT DISTINCT trim(both FROM t.part) AS token_raw
  FROM bai_thuoc bt
  CROSS JOIN LATERAL regexp_split_to_table(
    COALESCE(bt.chung_trang, ''),
    '\s*[,，;；+＋]+\s*'
  ) AS t(part)
  WHERE trim(both FROM t.part) <> ''
),
tok_n AS (
  SELECT
    token_raw,
    lower(regexp_replace(trim(both FROM token_raw), '\s+', ' ', 'g')) AS full_lc,
    trim(both FROM regexp_replace(
      lower(regexp_replace(trim(both FROM token_raw), '\s+', ' ', 'g')),
      '[（(].*',
      ''
    )) AS base_lc
  FROM all_tok
),
missing AS (
  SELECT tok_n.*
  FROM tok_n
  WHERE NOT EXISTS (SELECT 1 FROM pt_n pn WHERE pn.pt_t = tok_n.token_raw)
    AND NOT EXISTS (SELECT 1 FROM pt_n pn WHERE pn.full_lc = tok_n.full_lc)
    AND NOT EXISTS (
      SELECT 1
      FROM pt_n pn
      WHERE char_length(tok_n.base_lc) >= 2
        AND tok_n.base_lc <> ''
        AND pn.base_lc = tok_n.base_lc
    )
),
to_insert AS (
  SELECT DISTINCT ON (full_lc)
    token_raw AS chung_trang_moi
  FROM missing
  ORDER BY full_lc, char_length(token_raw) ASC, token_raw ASC
)
INSERT INTO phap_tri (chung_trang)
SELECT chung_trang_moi
FROM to_insert;

-- ─── A) Link từ phap_tri.id_bai_thuoc ─────────────────────────────────────────
INSERT INTO bai_thuoc_phap_tri (id_bai_thuoc, id_phap_tri, doan_chung_trang, thu_tu)
SELECT
  p.id_bai_thuoc,
  p.id,
  NULLIF(trim(both FROM COALESCE(p.chung_trang, '')), ''),
  0
FROM phap_tri p
WHERE p.id_bai_thuoc IS NOT NULL
ON CONFLICT (id_bai_thuoc, id_phap_tri) DO UPDATE SET
  doan_chung_trang = COALESCE(EXCLUDED.doan_chung_trang, bai_thuoc_phap_tri.doan_chung_trang),
  thu_tu = LEAST(bai_thuoc_phap_tri.thu_tu, EXCLUDED.thu_tu);

-- ─── B) Link từ tách bai_thuoc.chung_trang (đã gồm phap_tri vừa tạo ở bước 0) ─
WITH tokens AS (
  SELECT
    bt.id AS id_bai_thuoc,
    trim(both FROM t.part) AS token_raw,
    (t.ord)::SMALLINT AS thu_tu
  FROM bai_thuoc bt
  CROSS JOIN LATERAL regexp_split_to_table(
    COALESCE(bt.chung_trang, ''),
    '\s*[,，;；+＋]+\s*'
  ) WITH ORDINALITY AS t(part, ord)
  WHERE trim(both FROM t.part) <> ''
),
tok_n AS (
  SELECT
    id_bai_thuoc,
    token_raw,
    thu_tu,
    lower(regexp_replace(trim(both FROM token_raw), '\s+', ' ', 'g')) AS full_lc,
    trim(both FROM regexp_replace(
      lower(regexp_replace(trim(both FROM token_raw), '\s+', ' ', 'g')),
      '[（(].*',
      ''
    )) AS base_lc
  FROM tokens
),
pt_n AS (
  SELECT
    id,
    trim(both FROM COALESCE(chung_trang, '')) AS pt_t,
    lower(regexp_replace(trim(both FROM COALESCE(chung_trang, '')), '\s+', ' ', 'g')) AS full_lc,
    trim(both FROM regexp_replace(
      lower(regexp_replace(trim(both FROM COALESCE(chung_trang, '')), '\s+', ' ', 'g')),
      '[（(].*',
      ''
    )) AS base_lc
  FROM phap_tri
  WHERE trim(both FROM COALESCE(chung_trang, '')) <> ''
),
cand AS (
  SELECT tn.id_bai_thuoc, pn.id AS id_phap_tri, tn.token_raw, tn.thu_tu, 1 AS pri
  FROM tok_n tn
  INNER JOIN pt_n pn ON pn.pt_t = tn.token_raw
  UNION ALL
  SELECT tn.id_bai_thuoc, pn.id, tn.token_raw, tn.thu_tu, 2
  FROM tok_n tn
  INNER JOIN pt_n pn ON pn.full_lc = tn.full_lc
  UNION ALL
  SELECT tn.id_bai_thuoc, pn.id, tn.token_raw, tn.thu_tu, 3
  FROM tok_n tn
  INNER JOIN pt_n pn
    ON tn.base_lc = pn.base_lc
    AND char_length(tn.base_lc) >= 2
    AND tn.base_lc <> ''
    AND pn.base_lc <> ''
),
best_per_token AS (
  SELECT DISTINCT ON (id_bai_thuoc, token_raw)
    id_bai_thuoc,
    id_phap_tri,
    token_raw,
    thu_tu
  FROM cand
  ORDER BY id_bai_thuoc, token_raw, pri ASC, id_phap_tri ASC
),
dedup_pair AS (
  SELECT DISTINCT ON (id_bai_thuoc, id_phap_tri)
    id_bai_thuoc,
    id_phap_tri,
    token_raw AS doan_chung_trang,
    thu_tu
  FROM best_per_token
  ORDER BY id_bai_thuoc, id_phap_tri, thu_tu ASC
)
INSERT INTO bai_thuoc_phap_tri (id_bai_thuoc, id_phap_tri, doan_chung_trang, thu_tu)
SELECT id_bai_thuoc, id_phap_tri, doan_chung_trang, thu_tu
FROM dedup_pair
ON CONFLICT (id_bai_thuoc, id_phap_tri) DO UPDATE SET
  doan_chung_trang = COALESCE(NULLIF(EXCLUDED.doan_chung_trang, ''), bai_thuoc_phap_tri.doan_chung_trang),
  thu_tu = LEAST(bai_thuoc_phap_tri.thu_tu, EXCLUDED.thu_tu);

COMMIT;
