import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('access_token'))
  const username = ref<string | null>(localStorage.getItem('username'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(usernameInput: string, password: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng')
      }

      const data = await response.json()
      token.value = data.access_token
      username.value = usernameInput

      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('username', usernameInput)

      return true
    } catch (err: any) {
      error.value = err.message || 'Đã có lỗi xảy ra'
      return false
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    token.value = null
    username.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('username')
  }

  function clearError() {
    error.value = null
  }

  return {
    token,
    username,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    clearError,
  }
})
