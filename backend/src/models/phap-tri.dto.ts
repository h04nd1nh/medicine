export class CreatePhapTriDto {
  chung_trang?: string | null;
  nguyen_tac?: string | null;
  y_nghia_co_che?: string | null;
  bat_phap?: string | null;
  bat_cuong?: string | null;
  luc_dam?: string | null;
  trieu_chung_mo_ta?: string | null;
  id_bai_thuoc?: number | null;
  id_nhom_duoc_ly_nho?: number | null;
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
  id_nhom_duoc_ly_nho?: number | null;
  id_kinh_mach_list?: number[];
}
