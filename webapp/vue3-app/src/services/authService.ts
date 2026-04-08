import type { ApiResult } from '../types/api'
import type { AuthUser, JwtPayload, LoginResponseDto } from '../types/auth'
import { requestJson } from './apiClient'

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const base64 = parts[1]
    const payloadString = atob(base64)
    return JSON.parse(payloadString) as JwtPayload
  } catch {
    return null
  }
}

export async function loginWithPassword(username: string, password: string): Promise<ApiResult<{ token: string; user: AuthUser }>> {
  const result = await requestJson<LoginResponseDto>(
    '/auth/admin/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
    { fallbackErrorMessage: 'Sai ten dang nhap hoac mat khau' },
  )

  if (!result.ok) {
    return { success: false, error: result.error }
  }

  const token = result.data.access_token
  const payload = decodeJwtPayload(token)
  const user: AuthUser = {
    id: payload?.sub ?? '',
    username: payload?.username ?? username,
  }

  return { success: true, data: { token, user } }
}
