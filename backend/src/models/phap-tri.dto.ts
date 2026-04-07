export class CreatePhapTriDto {
  chung_trang?: string | null;
  nguyen_tac?: string | null;
  y_nghia_co_che?: string | null;
  bat_phap?: string | null;
  bat_cuong?: string | null;
  luc_dam?: string | null;
  trieu_chung_mo_ta?: string | null;
  id_bai_thuoc?: number | null;
  /** Nhiều bài thuốc tham chiếu (ưu tiên hơn id_bai_thuoc khi có trong body) */
  id_bai_thuoc_list?: number[];
  id_nhom_duoc_ly_nho?: number | null;
  /** Danh sách nhóm dược lý nhỏ. */
  id_nhom_duoc_ly_nho_list?: number[];
  /** Một chiều FK → benh_dong_y (tiểu kết) */
  id_benh_dong_y?: number | null;
  /** Danh sách id kinh mạch (tạng phủ) */
  id_kinh_mach_list?: number[];
  /** Danh sách id triệu chứng (bảng trieu_chung) — ưu tiên đồng bộ quan hệ + trieu_chung_mo_ta */
  id_trieu_chung_list?: number[];
}

export class UpdatePhapTriDto {
  chung_trang?: string | null;
  nguyen_tac?: string | null;
  y_nghia_co_che?: string | null;
  bat_phap?: string | null;
  bat_cuong?: string | null;
  luc_dam?: string | null;
  trieu_chung_mo_ta?: string | null;
  id_bai_thuoc?: number | null;
  id_bai_thuoc_list?: number[];
  id_nhom_duoc_ly_nho?: number | null;
  id_nhom_duoc_ly_nho_list?: number[];
  id_benh_dong_y?: number | null;
  id_kinh_mach_list?: number[];
  id_trieu_chung_list?: number[];
}
