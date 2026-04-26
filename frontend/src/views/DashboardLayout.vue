<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isSidebarCollapsed = ref(false)

const navItems = [
  { name: 'Trang chủ', routeName: 'home', icon: 'home' },
  { name: 'Bệnh nhân', routeName: 'patients', icon: 'patients' },
  { name: 'Lịch khám', routeName: 'appointments', icon: 'calendar' },
  { name: 'Bệnh tây y', routeName: 'western-medicine', icon: 'stethoscope' },
]

const currentRouteName = computed(() => route.name)

function navigate(routeName: string) {
  router.push({ name: routeName })
}

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="dashboard-layout" :class="{ collapsed: isSidebarCollapsed }">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo" @click="navigate('home')">
          <svg class="logo-svg" width="36" height="36" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="var(--brown-300)" stroke-width="2"/>
            <path d="M32 12C32 12 20 22 20 32C20 38.627 25.373 44 32 44C38.627 44 44 38.627 44 32C44 22 32 12 32 12Z" fill="var(--brown-600)"/>
            <circle cx="32" cy="32" r="4" fill="var(--white)"/>
          </svg>
          <Transition name="fade-text">
            <span v-show="!isSidebarCollapsed" class="logo-text">Y Học Cổ Truyền</span>
          </Transition>
        </div>
        <button class="sidebar-toggle" @click="toggleSidebar" aria-label="Toggle sidebar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path v-if="!isSidebarCollapsed" fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
            <path v-else fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in navItems"
          :key="item.routeName"
          class="nav-item"
          :class="{ active: currentRouteName === item.routeName || (item.routeName === 'patients' && currentRouteName === 'patient-detail') }"
          @click="navigate(item.routeName)"
        >
          <span class="nav-icon">
            <!-- Home icon -->
            <svg v-if="item.icon === 'home'" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
            </svg>
            <!-- Calendar icon -->
            <svg v-if="item.icon === 'calendar'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <!-- Stethoscope (Western Medicine) icon -->
            <svg v-if="item.icon === 'stethoscope'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13a9 9 0 0018 0v-5m-9 14a5 5 0 01-5-5V7a2 2 0 012-2h6a2 2 0 012 2v5a5 5 0 01-5 5zm0 0v-4" /></svg>
            <!-- Patients icon -->
            <svg v-if="item.icon === 'patients'" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
          </span>
          <Transition name="fade-text">
            <span v-show="!isSidebarCollapsed" class="nav-label">{{ item.name }}</span>
          </Transition>
          <span v-if="(currentRouteName === item.routeName || (item.routeName === 'patients' && currentRouteName === 'patient-detail')) && !isSidebarCollapsed" class="nav-active-dot"></span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            {{ (authStore.username || 'A').charAt(0).toUpperCase() }}
          </div>
          <Transition name="fade-text">
            <div v-show="!isSidebarCollapsed" class="user-details">
              <span class="user-name">{{ authStore.username || 'Admin' }}</span>
              <span class="user-role">Quản trị viên</span>
            </div>
          </Transition>
        </div>
        <button class="logout-btn" @click="handleLogout" title="Đăng xuất">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm7.707 8.707a1 1 0 01-1.414-1.414L10.586 9H6a1 1 0 110-2h4.586L9.293 5.707a1 1 0 011.414-1.414l3 3a1 1 0 010 1.414l-3 3z" clip-rule="evenodd"/>
          </svg>
          <Transition name="fade-text">
            <span v-show="!isSidebarCollapsed">Đăng xuất</span>
          </Transition>
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <header class="top-header">
        <div class="header-left">
          <button class="mobile-menu-btn" @click="toggleSidebar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 class="page-title">
            {{ currentRouteName === 'patient-detail' ? 'Chi tiết bệnh nhân' : (currentRouteName === 'new-examination' ? 'Khám mới' : currentRouteName === 'meridian-results' ? 'Kết quả đo kinh lạc' : currentRouteName === 'western-medicine' ? 'Bệnh tây y' : (navItems.find(i => i.routeName === currentRouteName)?.name || 'Trang chủ')) }}
          </h1>
        </div>
        <div class="header-right">
          <span class="header-greeting">Xin chào, <strong>{{ authStore.username || 'Admin' }}</strong></span>
        </div>
      </header>

      <div class="content-area">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-layout{display:flex;min-height:100vh;background:var(--gray-50)}

/* Sidebar */
.sidebar{width:var(--sidebar-width);background:var(--white);border-right:1px solid var(--gray-200);display:flex;flex-direction:column;transition:width var(--transition-base);position:fixed;top:0;left:0;bottom:0;z-index:100;overflow:hidden}
.collapsed .sidebar{width:var(--sidebar-collapsed-width)}

.sidebar-header{display:flex;align-items:center;justify-content:space-between;padding:var(--space-5) var(--space-4);border-bottom:1px solid var(--gray-100);min-height:var(--header-height)}
.sidebar-logo{display:flex;align-items:center;gap:var(--space-3);cursor:pointer;overflow:hidden}
.logo-svg{flex-shrink:0}
.logo-text{font-size:var(--font-size-sm);font-weight:700;color:var(--brown-800);white-space:nowrap}

.sidebar-toggle{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-sm);color:var(--gray-500);transition:all var(--transition-fast);flex-shrink:0}
.sidebar-toggle:hover{background:var(--gray-100);color:var(--brown-600)}

/* Nav items */
.sidebar-nav{flex:1;padding:var(--space-4) var(--space-3);display:flex;flex-direction:column;gap:var(--space-1);overflow-y:auto}
.nav-item{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-3);border-radius:var(--radius-md);color:var(--gray-600);font-size:var(--font-size-sm);font-weight:500;transition:all var(--transition-fast);position:relative;overflow:hidden;white-space:nowrap}
.nav-item:hover{background:var(--brown-50);color:var(--brown-700)}
.nav-item.active{background:linear-gradient(135deg,var(--brown-50) 0%,rgba(192,139,66,.12) 100%);color:var(--brown-700);font-weight:600}
.nav-item.active .nav-icon{color:var(--brown-600)}
.nav-icon{width:20px;height:20px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:color var(--transition-fast)}
.nav-label{white-space:nowrap}
.nav-active-dot{position:absolute;right:12px;width:6px;height:6px;border-radius:50%;background:var(--brown-500)}

/* Sidebar footer */
.sidebar-footer{padding:var(--space-4) var(--space-3);border-top:1px solid var(--gray-100);display:flex;flex-direction:column;gap:var(--space-3)}
.user-info{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2) var(--space-3);overflow:hidden}
.user-avatar{width:36px;height:36px;border-radius:var(--radius-full);background:linear-gradient(135deg,var(--brown-400),var(--brown-600));color:var(--white);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--font-size-sm);flex-shrink:0}
.user-details{display:flex;flex-direction:column;overflow:hidden;white-space:nowrap}
.user-name{font-size:var(--font-size-sm);font-weight:600;color:var(--black)}
.user-role{font-size:var(--font-size-xs);color:var(--gray-500)}

.logout-btn{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-md);color:var(--gray-500);font-size:var(--font-size-sm);transition:all var(--transition-fast);white-space:nowrap;overflow:hidden}
.logout-btn:hover{background:#fef2f2;color:var(--danger)}

/* Text transitions */
.fade-text-enter-active{transition:opacity var(--transition-base) .05s}
.fade-text-leave-active{transition:opacity 100ms}
.fade-text-enter-from,.fade-text-leave-to{opacity:0}

/* Main content */
.main-content{flex:1;margin-left:var(--sidebar-width);transition:margin-left var(--transition-base);display:flex;flex-direction:column;min-height:100vh}
.collapsed .main-content{margin-left:var(--sidebar-collapsed-width)}

.top-header{height:var(--header-height);padding:0 var(--space-8);display:flex;align-items:center;justify-content:space-between;background:var(--white);border-bottom:1px solid var(--gray-200);position:sticky;top:0;z-index:50}
.header-left{display:flex;align-items:center;gap:var(--space-4)}
.mobile-menu-btn{display:none;width:36px;height:36px;align-items:center;justify-content:center;border-radius:var(--radius-sm);color:var(--gray-600);transition:all var(--transition-fast)}
.mobile-menu-btn:hover{background:var(--gray-100)}
.page-title{font-size:var(--font-size-lg);font-weight:700;color:var(--black)}
.header-greeting{font-size:var(--font-size-sm);color:var(--gray-600)}
.header-greeting strong{color:var(--brown-700);font-weight:600}

.content-area{flex:1;padding:var(--space-8)}

/* Responsive */
@media(max-width:768px){
  .sidebar{transform:translateX(-100%);width:var(--sidebar-width) !important;box-shadow:var(--shadow-xl)}
  .collapsed .sidebar{transform:translateX(0)}
  .main-content,.collapsed .main-content{margin-left:0}
  .mobile-menu-btn{display:flex}
  .content-area{padding:var(--space-4)}
  .top-header{padding:0 var(--space-4)}
}
</style>
