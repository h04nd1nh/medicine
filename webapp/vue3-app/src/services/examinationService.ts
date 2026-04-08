import type { ApiResult } from '../types/api'
import type { LegacyExam } from '../types/medical'
import { requestJson } from './apiClient'
import { mapLegacyExamToNest, mapNestExamToLegacy } from './medicalMappers'

type UnknownRow = Record<string, unknown>

export async function getRecords(): Promise<ApiResult<LegacyExam[]>> {
  const result = await requestJson<UnknownRow[]>('/examinations', {}, { fallbackErrorMessage: 'Khong tai duoc danh sach phieu kham' })
  if (!result.ok) return { success: false, error: result.error }
  const rows = Array.isArray(result.data) ? result.data : []
  return { success: true, data: rows.map((row) => mapNestExamToLegacy(row)) }
}

export async function getRecord(id: number): Promise<ApiResult<LegacyExam | null>> {
  const result = await requestJson<UnknownRow>(`/examinations/${id}`, {}, { fallbackErrorMessage: 'Khong tai duoc phieu kham' })
  if (!result.ok) return { success: false, error: result.error }
  return { success: true, data: mapNestExamToLegacy(result.data) }
}

export async function saveRecord(payload: LegacyExam, isEditing: boolean): Promise<ApiResult<{ phieukhamId: number }>> {
  const id = payload.phieukhamId
  const path = isEditing ? `/examinations/${id}` : '/examinations'
  const method = isEditing ? 'PUT' : 'POST'

  const result = await requestJson<{ id?: number }>(
    path,
    { method, body: JSON.stringify(mapLegacyExamToNest(payload)) },
    { fallbackErrorMessage: 'Luu phieu kham that bai' },
  )
  if (!result.ok) return { success: false, error: result.error }
  return { success: true, data: { phieukhamId: result.data.id ?? id } }
}

export async function deleteRecord(phieukhamId: number): Promise<ApiResult<null>> {
  const result = await requestJson<unknown>(
    `/examinations/${phieukhamId}`,
    { method: 'DELETE' },
    { fallbackErrorMessage: 'Xoa phieu kham that bai' },
  )
  if (!result.ok) return { success: false, error: result.error }
  return { success: true, data: null }
}
