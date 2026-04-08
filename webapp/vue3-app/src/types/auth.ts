export interface LoginResponseDto {
  access_token: string
}

export interface AuthUser {
  id: number | string
  username: string
}

export interface JwtPayload {
  sub?: number | string
  username?: string
}
