import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AuthUser } from '../types/auth'
import { TOKEN_KEY, USER_KEY } from '../services/apiClient'

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<AuthUser | null>(loadUser())

  const isAuthenticated = computed(() => Boolean(token.value))

  function setToken(nextToken: string | null, nextUser?: AuthUser | null) {
    token.value = nextToken
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken)
      if (nextUser) {
        user.value = nextUser
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
      }
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      user.value = null
    }
  }

  function logout() {
    setToken(null)
  }

  return {
    token,
    user,
    isAuthenticated,
    setToken,
    logout,
  }
})
