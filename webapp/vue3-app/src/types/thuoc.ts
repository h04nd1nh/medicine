export interface ViThuoc {
  id: number
  ten_vi_thuoc: string
  tinh?: string | null
  vi?: string | null
  quy_kinh?: string | null
  lieu_dung?: string | null
  tenGoiKhacList?: Array<{ ten_goi_khac?: string }>
  congDungLinks?: Array<{ id_cong_dung?: number; ghi_chu?: string; congDung?: { ten_cong_dung?: string } }>
  chuTriLinks?: Array<{ id_chu_tri?: number; ghi_chu?: string; chuTri?: { ten_chu_tri?: string } }>
  kiengKyLinks?: Array<{ id_kieng_ky?: number; ghi_chu?: string; kiengKy?: { ten_kieng_ky?: string } }>
  nhomLinks?: Array<{ nhomNho?: { ten_nhom_nho?: string } }>
}

export interface BaiThuoc {
  id: number
  ten_bai_thuoc: string
  nguon_goc?: string | null
  cach_dung?: string | null
  chung_trang?: string | null
  phap_tri_ids?: number[]
  chi_tiet?: BaiThuocChiTiet[]
}

export interface BaiThuocChiTiet {
  id_vi_thuoc?: number
  idViThuoc?: number
  lieu_luong?: string | null
  vai_tro?: string | null
  ghi_chu?: string | null
}

export interface CongDung {
  id: number
  ten_cong_dung: string
  ghi_chu?: string | null
}

export interface ChuTri {
  id: number
  ten_chu_tri: string
  ghi_chu?: string | null
}

export interface KiengKy {
  id: number
  ten_kieng_ky: string
  ghi_chu?: string | null
}

export interface NhomDuocLyNho {
  id: number
  ten_nhom_nho: string
  mo_ta?: string | null
  id_nhom_lon?: number
  id_vi_thuoc?: number[]
}

export interface NhomDuocLyLon {
  id: number
  ten_nhom_lon: string
  nhomNho?: NhomDuocLyNho[]
}

export interface PhapTri {
  id: number
  chung_trang?: string | null
  nguyen_tac?: string | null
  y_nghia_co_che?: string | null
}

export interface KinhMach {
  id: number
  ten_kinh_mach: string
  ten_viet_tat?: string | null
}
