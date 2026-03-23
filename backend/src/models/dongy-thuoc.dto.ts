// ViThuoc DTOs
export class CreateViThuocDto {
  ten_vi_thuoc: string;
  ten_khoa_hoc?: string;
  bo_phan_dung?: string;
  tinh_vi?: string;
  quy_kinh?: string;
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
  chi_tiet?: {
    id_vi_thuoc: number;
    lieu_luong?: string;
    vai_tro?: string;
    ghi_chu?: string;
    tinh_vi?: string;
    quy_kinh?: string;
  }[];
}
export class UpdateBaiThuocDto extends CreateBaiThuocDto {}
