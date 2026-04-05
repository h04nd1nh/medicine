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
  /** Một chiều FK → benh_dong_y (tiểu kết) */
  id_benh_dong_y?: number | null;
  /** Danh sách id kinh mạch (tạng phủ) */
  id_kinh_mach_list?: number[];
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
  id_benh_dong_y?: number | null;
  id_kinh_mach_list?: number[];
}
