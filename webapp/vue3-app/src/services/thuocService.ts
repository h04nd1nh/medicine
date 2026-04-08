import type { ApiResult } from '../types/api'
import type { BaiThuoc, ChuTri, CongDung, KiengKy, KinhMach, NhomDuocLyLon, NhomDuocLyNho, PhapTri, ViThuoc } from '../types/thuoc'
import { requestJson } from './apiClient'

async function getList<T>(path: string, errorMessage: string): Promise<ApiResult<T[]>> {
  const result = await requestJson<T[]>(path, {}, { fallbackErrorMessage: errorMessage })
  if (!result.ok) return { success: false, error: result.error }
  return { success: true, data: Array.isArray(result.data) ? result.data : [] }
}

async function createItem<T>(path: string, payload: unknown, errorMessage: string): Promise<ApiResult<T>> {
  const result = await requestJson<T>(
    path,
    { method: 'POST', body: JSON.stringify(payload) },
    { useAuth: true, fallbackErrorMessage: errorMessage },
  )
  if (!result.ok) return { success: false, error: result.error }
  return { success: true, data: result.data }
}

async function updateItem<T>(path: string, payload: unknown, errorMessage: string): Promise<ApiResult<T>> {
  const result = await requestJson<T>(
    path,
    { method: 'PUT', body: JSON.stringify(payload) },
    { useAuth: true, fallbackErrorMessage: errorMessage },
  )
  if (!result.ok) return { success: false, error: result.error }
  return { success: true, data: result.data }
}

async function deleteItem(path: string, errorMessage: string): Promise<ApiResult<null>> {
  const result = await requestJson<unknown>(
    path,
    { method: 'DELETE' },
    { useAuth: true, fallbackErrorMessage: errorMessage },
  )
  if (!result.ok) return { success: false, error: result.error }
  return { success: true, data: null }
}

export const thuocService = {
  getPhapTri: () => getList<PhapTri>('/phap-tri', 'Khong tai duoc danh sach phap tri'),
  createPhapTri: (payload: Partial<PhapTri>) => createItem('/phap-tri', payload, 'Tao phap tri that bai'),
  updatePhapTri: (id: number, payload: Partial<PhapTri>) => updateItem(`/phap-tri/${id}`, payload, 'Cap nhat phap tri that bai'),
  deletePhapTri: (id: number) => deleteItem(`/phap-tri/${id}`, 'Xoa phap tri that bai'),

  getViThuoc: () => getList<ViThuoc>('/vi-thuoc', 'Khong tai duoc danh sach vi thuoc'),
  createViThuoc: (payload: Record<string, unknown>) =>
    createItem('/vi-thuoc', payload, 'Tao vi thuoc that bai'),
  updateViThuoc: (id: number, payload: Record<string, unknown>) =>
    updateItem(`/vi-thuoc/${id}`, payload, 'Cap nhat vi thuoc that bai'),
  deleteViThuoc: (id: number) => deleteItem(`/vi-thuoc/${id}`, 'Xoa vi thuoc that bai'),

  getBaiThuoc: () => getList<BaiThuoc>('/bai-thuoc', 'Khong tai duoc danh sach bai thuoc'),
  createBaiThuoc: (payload: Partial<BaiThuoc>) => createItem('/bai-thuoc', payload, 'Tao bai thuoc that bai'),
  updateBaiThuoc: (id: number, payload: Partial<BaiThuoc>) => updateItem(`/bai-thuoc/${id}`, payload, 'Cap nhat bai thuoc that bai'),
  deleteBaiThuoc: (id: number) => deleteItem(`/bai-thuoc/${id}`, 'Xoa bai thuoc that bai'),

  getCongDung: () => getList<CongDung>('/cong-dung', 'Khong tai duoc danh sach cong dung'),
  createCongDung: (payload: Partial<CongDung>) => createItem('/cong-dung', payload, 'Tao cong dung that bai'),
  updateCongDung: (id: number, payload: Partial<CongDung>) => updateItem(`/cong-dung/${id}`, payload, 'Cap nhat cong dung that bai'),
  deleteCongDung: (id: number) => deleteItem(`/cong-dung/${id}`, 'Xoa cong dung that bai'),

  getChuTri: () => getList<ChuTri>('/chu-tri', 'Khong tai duoc danh sach chu tri'),
  createChuTri: (payload: Partial<ChuTri>) => createItem('/chu-tri', payload, 'Tao chu tri that bai'),
  updateChuTri: (id: number, payload: Partial<ChuTri>) => updateItem(`/chu-tri/${id}`, payload, 'Cap nhat chu tri that bai'),
  deleteChuTri: (id: number) => deleteItem(`/chu-tri/${id}`, 'Xoa chu tri that bai'),

  getKiengKy: () => getList<KiengKy>('/kieng-ky', 'Khong tai duoc danh sach kieng ky'),
  createKiengKy: (payload: Partial<KiengKy>) => createItem('/kieng-ky', payload, 'Tao kieng ky that bai'),
  updateKiengKy: (id: number, payload: Partial<KiengKy>) => updateItem(`/kieng-ky/${id}`, payload, 'Cap nhat kieng ky that bai'),
  deleteKiengKy: (id: number) => deleteItem(`/kieng-ky/${id}`, 'Xoa kieng ky that bai'),

  getNhomDuocLy: () => getList<NhomDuocLyLon>('/nhom-duoc-ly', 'Khong tai duoc danh sach nhom duoc ly'),
  getKinhMach: () => getList<KinhMach>('/kinh-mach', 'Khong tai duoc danh sach kinh mach'),
  createNhomLon: (ten: string) => createItem('/nhom-duoc-ly/lon', { ten_nhom_lon: ten }, 'Tao nhom lon that bai'),
  updateNhomLon: (id: number, ten: string) => updateItem(`/nhom-duoc-ly/lon/${id}`, { ten_nhom_lon: ten }, 'Cap nhat nhom lon that bai'),
  deleteNhomLon: (id: number) => deleteItem(`/nhom-duoc-ly/lon/${id}`, 'Xoa nhom lon that bai'),
  createNhomNho: (payload: Partial<NhomDuocLyNho>) => createItem('/nhom-duoc-ly/nho', payload, 'Tao nhom nho that bai'),
  updateNhomNho: (id: number, payload: Partial<NhomDuocLyNho>) => updateItem(`/nhom-duoc-ly/nho/${id}`, payload, 'Cap nhat nhom nho that bai'),
  deleteNhomNho: (id: number) => deleteItem(`/nhom-duoc-ly/nho/${id}`, 'Xoa nhom nho that bai'),
}
