export const useAuth = () => {
  const config = useRuntimeConfig()
  const router = useRouter()
  const tokenCookie = useCookie('auth_token', {
    maxAge: 60 * 60 * 24, // 1 day
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })

  const isAuthenticated = computed(() => !!tokenCookie.value)
  const token = computed(() => tokenCookie.value)

  const login = async (username: string, password: string) => {
    const data = await $fetch<{ access_token: string }>('/auth/admin/login', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: { username, password }
    })

    tokenCookie.value = data.access_token
    await router.push('/')
  }

  const logout = async () => {
    tokenCookie.value = null
    await router.push('/login')
  }

  return {
    isAuthenticated,
    token,
    login,
    logout
  }
}
