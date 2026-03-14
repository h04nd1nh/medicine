<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const { login, isAuthenticated } = useAuth()
const router = useRouter()

// Redirect nếu đã đăng nhập
if (isAuthenticated.value) {
  await navigateTo('/')
}

const form = reactive({
  username: '',
  password: ''
})

const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await login(form.username, form.password)
  }
  catch (err: any) {
    const status = err?.response?.status
    if (status === 401) {
      errorMessage.value = 'Tên đăng nhập hoặc mật khẩu không đúng.'
    }
    else {
      errorMessage.value = 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'
    }
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- Card -->
    <div class="login-card">
      <!-- Header -->
      <div class="login-header">
        <div class="login-logo">
          <UIcon name="i-lucide-heart-pulse" class="login-logo-icon" />
        </div>
        <h1 class="login-title">Cổng Bác Sĩ</h1>
        <p class="login-subtitle">Đăng nhập để truy cập hệ thống quản lý y tế</p>
      </div>

      <!-- Form -->
      <form class="login-form" @submit.prevent="handleLogin">
        <!-- Username -->
        <div class="form-group">
          <label class="form-label" for="username">Tên đăng nhập</label>
          <div class="input-wrapper">
            <UIcon name="i-lucide-user" class="input-icon" />
            <input
              id="username"
              v-model="form.username"
              class="form-input"
              type="text"
              placeholder="Nhập tên đăng nhập"
              autocomplete="username"
              required
            >
          </div>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label class="form-label" for="password">Mật khẩu</label>
          <div class="input-wrapper">
            <UIcon name="i-lucide-lock" class="input-icon" />
            <input
              id="password"
              v-model="form.password"
              class="form-input"
              type="password"
              placeholder="Nhập mật khẩu"
              autocomplete="current-password"
              required
            >
          </div>
        </div>

        <!-- Error message -->
        <transition name="fade">
          <div v-if="errorMessage" class="error-message">
            <UIcon name="i-lucide-alert-circle" class="error-icon" />
            <span>{{ errorMessage }}</span>
          </div>
        </transition>

        <!-- Submit -->
        <button
          type="submit"
          class="login-btn"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="btn-loading">
            <UIcon name="i-lucide-loader-2" class="animate-spin" />
            Đang đăng nhập...
          </span>
          <span v-else>Đăng nhập</span>
        </button>
      </form>

      <!-- Footer -->
      <p class="login-footer">
        Chỉ dành cho nhân viên y tế được cấp quyền
      </p>
    </div>
  </div>
</template>

<style scoped>
/* ─── Page ─── */
.login-page {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* ─── Card ─── */
.login-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 24px;
  padding: 40px 36px;
  box-shadow:
    0 4px 24px rgba(21, 101, 192, 0.12),
    0 1px 4px rgba(0, 0, 0, 0.06);
}

/* ─── Header ─── */
.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, #1565c0, #1e88e5);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 8px 20px rgba(21, 101, 192, 0.35);
}

.login-logo-icon {
  width: 32px;
  height: 32px;
  color: #ffffff;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a2332;
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}

.login-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

/* ─── Form ─── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: #94a3b8;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.9rem;
  color: #1a2332;
  background: #f8fafc;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  outline: none;
}

.form-input:focus {
  border-color: #1e88e5;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.12);
}

.form-input::placeholder {
  color: #9ca3af;
}

/* ─── Error ─── */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #dc2626;
  font-size: 0.85rem;
}

.error-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* ─── Button ─── */
.login-btn {
  padding: 13px;
  background: linear-gradient(135deg, #1565c0, #1e88e5);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 14px rgba(21, 101, 192, 0.35);
  margin-top: 4px;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(21, 101, 192, 0.45);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* ─── Footer ─── */
.login-footer {
  text-align: center;
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 20px 0 0;
}

/* ─── Transitions ─── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
