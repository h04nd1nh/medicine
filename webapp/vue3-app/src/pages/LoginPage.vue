<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { loginWithPassword } from '../services/authService'

const authStore = useAuthStore()
const router = useRouter()
const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function onLogin() {
  errorMessage.value = ''
  isSubmitting.value = true
  const result = await loginWithPassword(username.value.trim(), password.value)
  isSubmitting.value = false

  if (!result.success || !result.data) {
    errorMessage.value = result.error?.message ?? 'Dang nhap that bai'
    return
  }

  authStore.setToken(result.data.token, result.data.user)
  router.push('/dashboard')
}
</script>

<template>
  <section class="page-card">
    <h2>Đăng nhập</h2>
    <p>Khung đăng nhập đã kết nối API thật cho giai đoạn migrate.</p>
    <form class="login-form" @submit.prevent="onLogin">
      <label>
        Tên đăng nhập
        <input v-model="username" type="text" autocomplete="username" required />
      </label>
      <label>
        Mật khẩu
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      <button class="primary-btn" type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập' }}
      </button>
    </form>
  </section>
</template>
