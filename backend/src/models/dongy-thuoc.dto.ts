// ViThuoc DTOs — khớp mẫu Excel
export class CreateViThuocDto {
  ten_vi_thuoc: string;
  ten_goi_khac?: string;
  nhom_lon?: string;
  nhom_duoc_ly?: string;
  tinh?: string;
  vi?: string;
  quy_kinh?: string;
  lieu_dung?: string;
  cong_dung?: string;
  chu_tri?: string;
  kieng_ky?: string;
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
