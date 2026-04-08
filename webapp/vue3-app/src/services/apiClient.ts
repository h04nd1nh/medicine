import type { ApiError } from '../types/api'

export const TOKEN_KEY = 'kinhlac_token'
export const USER_KEY = 'kinhlac_user'

function getBaseUrl(): string {
  return 'http://103.56.163.42/api'
}

function buildHeaders(useAuth: boolean): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (!useAuth) return headers

  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return headers
  return { ...headers, Authorization: `Bearer ${token}` }
}

function mergeHeaders(baseHeaders: HeadersInit, customHeaders?: HeadersInit): HeadersInit {
  if (!customHeaders) return baseHeaders
  return {
    ...(baseHeaders as Record<string, string>),
    ...(customHeaders as Record<string, string>),
  }
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
    headers: mergeHeaders(buildHeaders(useAuth), init.headers),
  })

  if (!response.ok) {
    const error = await parseErrorResponse(response, fallbackErrorMessage)
    return { ok: false, error }
  }

  const text = await response.text()
  if (!text) return { ok: true, data: null as T }
  try {
    const data = JSON.parse(text) as T
    return { ok: true, data }
  } catch {
    return { ok: true, data: text as T }
  }
}
