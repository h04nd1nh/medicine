export interface ApiError {
  message: string
  status?: number
}

export interface ApiResult<T> {
  success: boolean
  data?: T
  error?: ApiError
}
