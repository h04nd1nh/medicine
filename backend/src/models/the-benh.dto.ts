// ─── TheBenh DTOs ─────────────────────────────────────────

export class CreateTheBenhDto {
  id_benh: number;
  parent_id?: number | null;
  ten_the_benh: string;
  mo_ta?: string;
  thu_tu?: number;
  // Danh sách phương huyệt đi kèm (có thể tạo cùng lúc)
  phuong_huyet?: CreateTheBenhPhuongHuyetItemDto[];
}

export class UpdateTheBenhDto {
  parent_id?: number | null;
  ten_the_benh?: string;
  mo_ta?: string;
  thu_tu?: number;
  // Nếu có trường này -> xóa cũ thêm mới (sync)
  phuong_huyet?: CreateTheBenhPhuongHuyetItemDto[];
}

// ─── TheBenhPhuongHuyet DTOs ──────────────────────────────

export class CreateTheBenhPhuongHuyetItemDto {
  id_huyet?: number | null;
  phuong_phap?: string;  // Bổ / Tả / Cứu bổ
  vai_tro?: string;
  ghi_chu?: string;
  thu_tu?: number;
}

export class CreateTheBenhPhuongHuyetDto extends CreateTheBenhPhuongHuyetItemDto {
  id_the_benh: number;
}

export class UpdateTheBenhPhuongHuyetDto {
  phuong_phap?: string;
  vai_tro?: string;
  ghi_chu?: string;
  thu_tu?: number;
}
