-- Xóa toàn bộ dữ liệu pháp trị và reset sequence id.
-- CASCADE: cũng xóa bảng trỏ tới phap_tri (phap_tri_kinh_mach, bai_thuoc_phap_tri).
-- Không đụng bai_thuoc / benh_dong_y.
--
-- PostgreSQL. Sao lưu DB trước khi chạy.

BEGIN;

TRUNCATE TABLE phap_tri RESTART IDENTITY CASCADE;

COMMIT;

-- Ghi chú: RESTART IDENTITY đưa sequence về trạng thái ban đầu (thường lần INSERT tiếp theo có id = 1).
-- SERIAL/IDENTITY trong PostgreSQL không dùng id = 0 cho bản ghi đầu; nếu sequence tên lệch chuẩn, chạy thủ công:
-- SELECT setval(pg_get_serial_sequence('phap_tri', 'id'), 1, false);
