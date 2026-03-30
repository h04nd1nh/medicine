// ViThuoc DTOs
export class CreateViThuocDto {
  ten_vi_thuoc: string;
  ten_khoa_hoc?: string;
  ten_goi_khac?: string;
  bo_phan_dung?: string;
  tinh_vi?: string;
  tinh?: string;
  vi?: string;
  quy_kinh?: string; // Supports multiple via comma
  cong_dung?: string;
  lieu_dung?: string;
  luu_y?: string;
}
export class UpdateViThuocDto extends CreateViThuocDto {}

// BaiThuoc DTOs
export class CreateBaiThuocDto {
  ten_bai_thuoc: string;
  nguon_goc?: string;
  cong_dung?: string;
  cach_dung?: string;
  ghi_chu?: string;
  bien_chung?: string;
  trieu_chung?: string;
  phap_tri?: string;
  chi_tiet?: {
    id_vi_thuoc: number;
    lieu_luong?: string;
    vai_tro?: string;
    ghi_chu?: string;
    tinh_vi?: string; // Legacy
    quy_kinh?: string; // Supports multiple via comma
  }[];
}
export class UpdateBaiThuocDto extends CreateBaiThuocDto {}
