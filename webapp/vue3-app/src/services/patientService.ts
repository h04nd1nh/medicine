import type { ApiResult } from '../types/api'
import type { LegacyPatient } from '../types/medical'
import { requestJson } from './apiClient'
import { mapLegacyPatientToNest, mapNestPatientToLegacy } from './medicalMappers'

type UnknownRow = Record<string, unknown>

export async function getPatients(): Promise<ApiResult<LegacyPatient[]>> {
  const result = await requestJson<UnknownRow[]>('/patients', {}, { fallbackErrorMessage: 'Khong tai duoc danh sach benh nhan' })
  if (!result.ok) return { success: false, error: result.error }
  const rows = Array.isArray(result.data) ? result.data : []
  return { success: true, data: rows.map((row) => mapNestPatientToLegacy(row as never)) }
}

export async function addPatient(payload: LegacyPatient): Promise<ApiResult<{ id: number }>> {
  const result = await requestJson<{ id: number }>(
    '/patients',
    { method: 'POST', body: JSON.stringify(mapLegacyPatientToNest(payload)) },
    { fallbackErrorMessage: 'Tao benh nhan that bai' },
  )
  if (!result.ok) return { success: false, error: result.error }
  return { success: true, data: { id: result.data.id } }
}

export async function updatePatient(payload: LegacyPatient): Promise<ApiResult<{ id: number }>> {
  const result = await requestJson<{ id: number }>(
    `/patients/${payload.benhnhanId}`,
    { method: 'PUT', body: JSON.stringify(mapLegacyPatientToNest(payload)) },
    { fallbackErrorMessage: 'Cap nhat benh nhan that bai' },
  )
  if (!result.ok) return { success: false, error: result.error }
  return { success: true, data: { id: result.data.id } }
}

export async function deletePatient(benhnhanId: number): Promise<ApiResult<null>> {
  const result = await requestJson<unknown>(
    `/patients/${benhnhanId}`,
    { method: 'DELETE' },
    { fallbackErrorMessage: 'Xoa benh nhan that bai' },
  )
  if (!result.ok) return { success: false, error: result.error }
  return { success: true, data: null }
}
