<script setup lang="ts">
useSeoMeta({
  title: 'Trang chủ | Hệ thống Y tế',
  description: 'Dashboard dành cho bác sĩ'
})

const { fetchAll } = usePatients()
const patientCount = ref<number | null>(null)

onMounted(async () => {
  try {
    const patients = await fetchAll()
    patientCount.value = patients.length
  }
  catch {
    patientCount.value = null
  }
})
</script>

<template>
  <div class="dashboard">
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Tổng quan</h1>
        <p class="page-subtitle">Chào mừng bác sĩ đến với hệ thống quản lý y tế</p>
      </div>
      <div class="header-date">
        <UIcon name="i-lucide-calendar" class="date-icon" />
        <span>{{ new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
      </div>
    </div>

    <!-- Stats cards -->
    <div class="stats-grid">
      <div class="stat-card stat-card--blue">
        <div class="stat-icon-wrap">
          <UIcon name="i-lucide-users" class="stat-icon" />
        </div>
        <div class="stat-info">
          <span class="stat-label">Bệnh nhân</span>
          <span class="stat-value">{{ patientCount ?? '—' }}</span>
        </div>
      </div>
      <div class="stat-card stat-card--green">
        <div class="stat-icon-wrap">
          <UIcon name="i-lucide-calendar-check" class="stat-icon" />
        </div>
        <div class="stat-info">
          <span class="stat-label">Lịch hẹn hôm nay</span>
          <span class="stat-value">—</span>
        </div>
      </div>
      <div class="stat-card stat-card--purple">
        <div class="stat-icon-wrap">
          <UIcon name="i-lucide-activity" class="stat-icon" />
        </div>
        <div class="stat-info">
          <span class="stat-label">Ca khám</span>
          <span class="stat-value">—</span>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="quick-actions">
      <h2 class="section-title">Truy cập nhanh</h2>
      <div class="action-grid">
        <NuxtLink to="/patients" class="action-card">
          <UIcon name="i-lucide-users" class="action-icon" />
          <span class="action-label">Quản lý bệnh nhân</span>
          <UIcon name="i-lucide-arrow-right" class="action-arrow" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  width: 100%;
  padding: 32px 36px;
  box-sizing: border-box;
}

/* ─── Header ─── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a2332;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

.header-date {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #64748b;
  background: #ffffff;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.date-icon {
  width: 16px;
  height: 16px;
  color: #1e88e5;
}

/* ─── Stats ─── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 18px;
  margin-bottom: 32px;
}

.stat-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 22px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card--blue .stat-icon-wrap { background: #e3f2fd; }
.stat-card--green .stat-icon-wrap { background: #e8f5e9; }
.stat-card--purple .stat-icon-wrap { background: #f3e5f5; }

.stat-card--blue .stat-icon { color: #1e88e5; }
.stat-card--green .stat-icon { color: #43a047; }
.stat-card--purple .stat-icon { color: #8e24aa; }

.stat-icon {
  width: 24px;
  height: 24px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a2332;
  line-height: 1;
}

/* ─── Quick actions ─── */
.quick-actions {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a2332;
  margin: 0 0 18px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  text-decoration: none;
  color: #1a2332;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.15s ease;
}

.action-card:hover {
  border-color: #1e88e5;
  background: #f0f7ff;
  transform: translateX(2px);
}

.action-icon {
  width: 20px;
  height: 20px;
  color: #1e88e5;
  flex-shrink: 0;
}

.action-label {
  font-size: 0.875rem;
  font-weight: 500;
  flex: 1;
}

.action-arrow {
  width: 16px;
  height: 16px;
  color: #94a3b8;
}
</style>
