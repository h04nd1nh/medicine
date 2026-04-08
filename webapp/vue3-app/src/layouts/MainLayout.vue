<script setup lang="ts">
import { useUiStore } from '../stores/uiStore'

const uiStore = useUiStore()

const navItems = [
  { label: 'Trang chủ', to: '/dashboard' },
  { label: 'Bệnh nhân', to: '/patients' },
  { label: 'Quản lý Lịch Khám', to: '/appointments' },
  { label: 'Bệnh Tây Y', to: '/tayy' },
  { label: 'Bệnh Kinh Lạc', to: '/dongy' },
  { label: 'Quản lý Thuốc', to: '/thuoc' },
  { label: 'Quản lý Triệu chứng', to: '/trieuchung' },
  { label: 'Quản lý Pháp trị', to: '/phaptri' },
]
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <h2 class="brand">Kinh Lạc</h2>
      <nav class="app-nav">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-link">
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <div class="app-main">
      <header class="app-header">
        <div class="header-main">
          <h1>{{ uiStore.appTitle }}</h1>
          <a class="switch-link" href="../index.html?vue3=0">Ve giao dien Legacy</a>
        </div>
      </header>
      <main class="app-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
