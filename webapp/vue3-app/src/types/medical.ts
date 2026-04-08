export interface LegacyPatient {
  benhnhanId: number
  hoten: string
  gioitinh: string
  ngaysinh: string | null
  giosinh: string | null
  diachi: string | null
  tinhthanhId: number | null
  dienthoai: string | null
  benhsu: string | null
  ghichu: string | null
  cmnd: string | null
}

export interface LegacyExam {
  phieukhamId: number
  benhnhanId: number
  ngaykham: string | null
  giokham: string
  nhietdoMoitruong: number
  tieutruongTrai: number
  tieutruongPhai: number
  tamTrai: number
  tamPhai: number
  tamtieuTrai: number
  tamtieuPhai: number
  tambaoTrai: number
  tambaoPhai: number
  daitrangTrai: number
  daitrangPhai: number
  pheTrai: number
  phePhai: number
  bangquangTrai: number
  bangquangPhai: number
  thanTrai: number
  thanPhai: number
  damTrai: number
  damPhai: number
  viTrai: number
  viPhai: number
  canTrai: number
  canPhai: number
  tyTrai: number
  tyPhai: number
  _backendSyndromes?: unknown[]
  _backendAmDuong?: unknown
  _backendKhi?: unknown
  _backendHuyet?: unknown
  _backendFlags?: unknown[]
}
