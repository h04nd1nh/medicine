import type { ApiError } from '../types/api'

export const TOKEN_KEY = 'kinhlac_token'
export const USER_KEY = 'kinhlac_user'

function getBaseUrl(): string {
  const host = window.location.hostname
  const isLocal = host === 'localhost' || host === '127.0.0.1'
  return isLocal ? 'http://localhost:3001' : `${window.location.origin}/api`
}

function buildHeaders(useAuth: boolean): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (!useAuth) return headers

  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return headers
  return { ...headers, Authorization: `Bearer ${token}` }
}

async function parseErrorResponse(response: Response, fallbackMessage: string): Promise<ApiError> {
  try {
    const text = await response.text()
    const message = text || fallbackMessage
    return { message, status: response.status }
  } catch {
    return { message: fallbackMessage, status: response.status }
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  options: { useAuth?: boolean; fallbackErrorMessage?: string } = {},
): Promise<{ ok: true; data: T } | { ok: false; error: ApiError }> {
  const { useAuth = false, fallbackErrorMessage = 'Yeu cau that bai' } = options
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: buildHeaders(useAuth),
  })

  if (!response.ok) {
    const error = await parseErrorResponse(response, fallbackErrorMessage)
    return { ok: false, error }
  }

  const data = (await response.json()) as T
  return { ok: true, data }
}
