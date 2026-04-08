<script setup lang="ts">
import { useUiStore } from '../stores/uiStore'

const uiStore = useUiStore()

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Bệnh nhân', to: '/patients' },
  { label: 'Lịch hẹn', to: '/appointments' },
  { label: 'Mô hình bệnh', to: '/models' },
  { label: 'Phân tích', to: '/analysis' },
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
        <h1>{{ uiStore.appTitle }}</h1>
      </header>
      <main class="app-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
