-- Đồng bộ liên kết phap_tri ↔ bài thuốc từ cột id_bai_thuoc (một bài) sang bảng bai_thuoc_phap_tri (nhiều bài).
-- Chạy một lần sau khi deploy API hỗ trợ id_bai_thuoc_list / chip nhiều bài.

INSERT INTO bai_thuoc_phap_tri (id_bai_thuoc, id_phap_tri, doan_chung_trang, thu_tu)
SELECT p.id_bai_thuoc, p.id, NULL, 0
FROM phap_tri p
WHERE p.id_bai_thuoc IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM bai_thuoc_phap_tri l
    WHERE l.id_phap_tri = p.id AND l.id_bai_thuoc = p.id_bai_thuoc
  );
