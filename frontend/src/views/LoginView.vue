<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const username = ref('')
const password = ref('')
const showPassword = ref(false)

onMounted(() => {
  if (authStore.isAuthenticated) router.push({ name: 'dashboard' })
})

async function handleLogin() {
  if (!username.value.trim() || !password.value.trim()) {
    authStore.error = 'Vui lòng nhập đầy đủ thông tin'
    return
  }
  const success = await authStore.login(username.value.trim(), password.value)
  if (success) router.push({ name: 'dashboard' })
}
</script>

<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="bg-circle bg-circle--1"></div>
      <div class="bg-circle bg-circle--2"></div>
      <div class="bg-pattern"></div>
    </div>

    <div class="login-container">
      <div class="login-hero">
        <div class="hero-content">
          <div class="hero-icon">
            <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="rgba(255,255,255,.3)" stroke-width="2"/>
              <path d="M32 12C32 12 20 22 20 32C20 38.627 25.373 44 32 44C38.627 44 44 38.627 44 32C44 22 32 12 32 12Z" fill="rgba(255,255,255,.9)"/>
              <circle cx="32" cy="32" r="4" fill="rgba(139,94,47,.8)"/>
            </svg>
          </div>
          <h1 class="hero-title">Y Học<br/>Cổ Truyền</h1>
          <p class="hero-subtitle">Hệ thống quản lý phòng khám<br/>thông minh & hiện đại</p>
          <div class="hero-features">
            <div class="hero-feature"><span class="feature-dot"></span><span>Quản lý bệnh nhân</span></div>
            <div class="hero-feature"><span class="feature-dot"></span><span>Kê đơn thuốc</span></div>
            <div class="hero-feature"><span class="feature-dot"></span><span>Tra cứu bài thuốc</span></div>
          </div>
        </div>
      </div>

      <div class="login-form-wrapper">
        <div class="login-form-inner">
          <div class="form-header">
            <h2 class="form-title">Đăng nhập</h2>
            <p class="form-description">Nhập thông tin tài khoản để truy cập hệ thống</p>
          </div>

          <Transition name="fade">
            <div v-if="authStore.error" class="error-alert" @click="authStore.clearError()">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
              <span>{{ authStore.error }}</span>
            </div>
          </Transition>

          <form @submit.prevent="handleLogin" class="login-form">
            <div class="form-group">
              <label for="login-username" class="form-label">Tên đăng nhập</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
                <input id="login-username" v-model="username" type="text" class="form-input" placeholder="Nhập tên đăng nhập" autocomplete="username"/>
              </div>
            </div>

            <div class="form-group">
              <label for="login-password" class="form-label">Mật khẩu</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
                <input id="login-password" v-model="password" :type="showPassword ? 'text' : 'password'" class="form-input" placeholder="Nhập mật khẩu" autocomplete="current-password"/>
                <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                  <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
                  <svg v-else width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/></svg>
                </button>
              </div>
            </div>

            <button id="login-submit" type="submit" class="btn-login" :disabled="authStore.isLoading">
              <span v-if="authStore.isLoading" class="btn-spinner"></span>
              <span v-else>Đăng nhập</span>
            </button>
          </form>

          <p class="form-footer">© 2026 Y Học Cổ Truyền</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--gray-50);position:relative;overflow:hidden}
.login-bg{position:fixed;inset:0;pointer-events:none;z-index:0}
.bg-circle{position:absolute;border-radius:50%;opacity:.07}
.bg-circle--1{width:600px;height:600px;background:var(--brown-400);top:-200px;right:-100px;animation:float 20s ease-in-out infinite}
.bg-circle--2{width:400px;height:400px;background:var(--brown-600);bottom:-150px;left:-100px;animation:float 25s ease-in-out infinite reverse}
.bg-pattern{position:absolute;inset:0;background-image:radial-gradient(circle at 1px 1px,var(--brown-200) 1px,transparent 0);background-size:40px 40px;opacity:.3}
@keyframes float{0%,100%{transform:translate(0,0)}25%{transform:translate(20px,-30px)}50%{transform:translate(-10px,20px)}75%{transform:translate(15px,10px)}}
.login-container{position:relative;z-index:1;display:flex;width:100%;max-width:960px;min-height:560px;margin:var(--space-8);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-xl);background:var(--white)}
.login-hero{flex:0 0 400px;background:linear-gradient(145deg,var(--brown-700) 0%,var(--brown-900) 100%);display:flex;align-items:center;justify-content:center;padding:var(--space-12);position:relative;overflow:hidden}
.login-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 20% 80%,rgba(255,255,255,.06) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(255,255,255,.04) 0%,transparent 50%)}
.hero-content{position:relative;z-index:1;color:var(--white)}
.hero-icon{margin-bottom:var(--space-8);animation:pulse-glow 3s ease-in-out infinite}
@keyframes pulse-glow{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.85;transform:scale(1.05)}}
.hero-title{font-size:var(--font-size-4xl);font-weight:700;line-height:1.15;margin-bottom:var(--space-4);letter-spacing:-.02em}
.hero-subtitle{font-size:var(--font-size-base);line-height:1.7;color:rgba(255,255,255,.7);margin-bottom:var(--space-10)}
.hero-features{display:flex;flex-direction:column;gap:var(--space-3)}
.hero-feature{display:flex;align-items:center;gap:var(--space-3);font-size:var(--font-size-sm);color:rgba(255,255,255,.8)}
.feature-dot{width:8px;height:8px;border-radius:50%;background:var(--brown-300);flex-shrink:0}
.login-form-wrapper{flex:1;display:flex;align-items:center;justify-content:center;padding:var(--space-12)}
.login-form-inner{width:100%;max-width:360px}
.form-header{margin-bottom:var(--space-8)}
.form-title{font-size:var(--font-size-2xl);font-weight:700;color:var(--black);margin-bottom:var(--space-2)}
.form-description{font-size:var(--font-size-sm);color:var(--gray-600)}
.error-alert{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);background:#fef2f2;border:1px solid #fecaca;border-radius:var(--radius-md);color:var(--danger);font-size:var(--font-size-sm);margin-bottom:var(--space-6);cursor:pointer;transition:background var(--transition-fast)}
.error-alert:hover{background:#fee2e2}
.login-form{display:flex;flex-direction:column;gap:var(--space-5)}
.form-group{display:flex;flex-direction:column;gap:var(--space-2)}
.form-label{font-size:var(--font-size-sm);font-weight:600;color:var(--gray-700)}
.input-wrapper{position:relative;display:flex;align-items:center}
.input-icon{position:absolute;left:14px;color:var(--gray-400);transition:color var(--transition-fast);pointer-events:none;z-index:1}
.form-input{width:100%;padding:12px 14px 12px 44px;border:1.5px solid var(--gray-300);border-radius:var(--radius-md);font-size:var(--font-size-base);color:var(--black);background:var(--white);transition:border-color var(--transition-fast),box-shadow var(--transition-fast);outline:none}
.form-input::placeholder{color:var(--gray-400)}
.form-input:hover{border-color:var(--gray-400)}
.form-input:focus{border-color:var(--brown-400);box-shadow:0 0 0 3px rgba(192,139,66,.15)}
.input-wrapper:focus-within .input-icon{color:var(--brown-500)}
.password-toggle{position:absolute;right:12px;color:var(--gray-400);padding:var(--space-1);border-radius:var(--radius-sm);transition:color var(--transition-fast),background var(--transition-fast);display:flex;align-items:center;justify-content:center}
.password-toggle:hover{color:var(--brown-500);background:var(--brown-50)}
.btn-login{width:100%;padding:13px;margin-top:var(--space-2);background:linear-gradient(135deg,var(--brown-600) 0%,var(--brown-700) 100%);color:var(--white);font-size:var(--font-size-base);font-weight:600;border-radius:var(--radius-md);transition:all var(--transition-base);position:relative;overflow:hidden}
.btn-login:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(139,94,47,.35)}
.btn-login:active:not(:disabled){transform:translateY(0)}
.btn-login:disabled{opacity:.7;cursor:not-allowed}
.btn-spinner{display:inline-block;width:20px;height:20px;border:2.5px solid rgba(255,255,255,.3);border-top-color:var(--white);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.form-footer{margin-top:var(--space-8);text-align:center;font-size:var(--font-size-xs);color:var(--gray-400)}
.fade-enter-active,.fade-leave-active{transition:opacity var(--transition-base)}
.fade-enter-from,.fade-leave-to{opacity:0}
@media(max-width:768px){.login-container{flex-direction:column;max-width:440px;min-height:auto;margin:var(--space-4)}.login-hero{flex:none;padding:var(--space-8) var(--space-6)}.hero-title{font-size:var(--font-size-2xl)}.hero-features{display:none}.login-form-wrapper{padding:var(--space-8) var(--space-6)}}
@media(max-width:480px){.login-hero{display:none}.login-container{border-radius:var(--radius-lg);margin:var(--space-4)}}
</style>
