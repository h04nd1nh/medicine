import type { ApiResult } from '../types/api'
import type { AppointmentListResponse } from '../types/appointment'
import { requestJson } from './apiClient'

export async function getAppointments(page = 1, limit = 50): Promise<ApiResult<AppointmentListResponse>> {
  const result = await requestJson<AppointmentListResponse>(
    `/appointments?page=${page}&limit=${limit}`,
    {},
    { useAuth: true, fallbackErrorMessage: 'Khong tai duoc lich hen' },
  )
  if (!result.ok) return { success: false, error: result.error }

  return {
    success: true,
    data: {
      data: Array.isArray(result.data.data) ? result.data.data : [],
      total: Number(result.data.total || 0),
    },
  }
}

export async function updateAppointmentStatus(id: number, newStatus: string): Promise<ApiResult<null>> {
  const result = await requestJson<unknown>(
    `/appointments/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    },
    { useAuth: true, fallbackErrorMessage: 'Cap nhat trang thai that bai' },
  )
  if (!result.ok) return { success: false, error: result.error }
  return { success: true, data: null }
}
