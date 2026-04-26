<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import type { Patient } from '@/stores/patient'

// Interfaces
interface Appointment {
  id: number
  patientId: number
  appointmentDate: string
  appointmentTime: string
  status: string
  type: string
  notes: string | null
}

const router = useRouter()
const viewMode = ref<'patient' | 'calendar'>('patient')
const calendarView = ref<'month' | 'week' | 'day'>('month')
const currentDate = ref(new Date())

const isLoading = ref(true)
const error = ref<string | null>(null)

// Data
const appointments = ref<Appointment[]>([])
const patientsMap = ref<Record<number, Patient>>({})

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    // Fetch all patients to build lookup map
    const ptsResponse: any = await api.get('/patients?limit=1000')
    // Fix mapping issue: API might return Array directly or object with .data
    const pts: Patient[] = Array.isArray(ptsResponse) ? ptsResponse : (ptsResponse.data || [])
    patientsMap.value = pts.reduce((acc, p) => {
      acc[p.id] = p
      return acc
    }, {} as Record<number, Patient>)

    // Fetch all appointments
    const apts = await api.get<any>('/appointments?limit=1000')
    appointments.value = Array.isArray(apts) ? apts : (apts.data || [])
    
    // Sort appointments by time
    appointments.value.sort((a, b) => {
      const timeA = parseInt(a.appointmentTime.replace(':', ''))
      const timeB = parseInt(b.appointmentTime.replace(':', ''))
      return timeA - timeB
    })
  } catch (err: any) {
    console.error(err)
    error.value = 'Lỗi khi tải dữ liệu lịch hẹn: ' + err.message
  } finally {
    isLoading.value = false
  }
}

// ========================
// CALENDAR LOGIC
// ========================

// Group all appointments by Date string (YYYY-MM-DD)
const groupedAppointments = computed(() => {
  const groups: Record<string, Appointment[]> = {}
  appointments.value.forEach(app => {
    if (!groups[app.appointmentDate]) {
      groups[app.appointmentDate] = []
    }
    groups[app.appointmentDate].push(app)
  })
  return groups
})

function formatYMD(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getStartOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
  d.setDate(diff)
  d.setHours(0,0,0,0)
  return d
}

// --- Month View ---
const monthGrid = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  
  const daysInMonth = lastDayOfMonth.getDate()
  const startDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1 // 0 is Monday
  
  const days = []
  
  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i)
    days.push({ date: d, isCurrentMonth: false, ymd: formatYMD(d) })
  }
  
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    days.push({ date: d, isCurrentMonth: true, ymd: formatYMD(d) })
  }
  
  // Next month padding
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    days.push({ date: d, isCurrentMonth: false, ymd: formatYMD(d) })
  }
  
  return days
})

// --- Week View ---
const weekDays = computed(() => {
  const start = getStartOfWeek(currentDate.value)
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push({ date: d, ymd: formatYMD(d) })
  }
  return days
})

// --- Day View ---
const dayYmd = computed(() => formatYMD(currentDate.value))
const dayApps = computed(() => groupedAppointments.value[dayYmd.value] || [])


// --- Calendar Navigation ---
const calendarTitle = computed(() => {
  const y = currentDate.value.getFullYear()
  const m = currentDate.value.getMonth() + 1
  if (calendarView.value === 'month') return `Tháng ${m}, ${y}`
  if (calendarView.value === 'week') {
    const start = weekDays.value[0].date
    const end = weekDays.value[6].date
    if (start.getMonth() === end.getMonth()) {
      return `Tuần ${start.getDate()} - ${end.getDate()} Tháng ${m}, ${y}`
    }
    return `${start.getDate()}/${start.getMonth()+1} - ${end.getDate()}/${end.getMonth()+1}, ${y}`
  }
  return `Ngày ${currentDate.value.getDate()} Tháng ${m}, ${y}`
})

function prev() {
  const d = new Date(currentDate.value)
  if (calendarView.value === 'month') d.setMonth(d.getMonth() - 1)
  else if (calendarView.value === 'week') d.setDate(d.getDate() - 7)
  else d.setDate(d.getDate() - 1)
  currentDate.value = d
}

function next() {
  const d = new Date(currentDate.value)
  if (calendarView.value === 'month') d.setMonth(d.getMonth() + 1)
  else if (calendarView.value === 'week') d.setDate(d.getDate() + 7)
  else d.setDate(d.getDate() + 1)
  currentDate.value = d
}

function goToday() {
  currentDate.value = new Date()
}

// ========================
// PATIENT VIEW LOGIC
// ========================
const patientGroups = computed(() => {
  const groups: Record<number, { patient: Patient | null, appointments: Appointment[] }> = {}
  appointments.value.forEach(app => {
    if (!groups[app.patientId]) {
      groups[app.patientId] = {
        patient: patientsMap.value[app.patientId] || null,
        appointments: []
      }
    }
    groups[app.patientId].appointments.push(app)
  })
  
  // Sort by latest appointment
  return Object.values(groups).sort((a, b) => {
    const lastA = a.appointments[a.appointments.length - 1]
    const lastB = b.appointments[b.appointments.length - 1]
    const dtA = new Date(`${lastA.appointmentDate}T${lastA.appointmentTime}`).getTime()
    const dtB = new Date(`${lastB.appointmentDate}T${lastB.appointmentTime}`).getTime()
    return dtB - dtA
  })
})

function getStatusLabel(status: string) {
  switch (status) {
    case 'PENDING': return 'Đang chờ'
    case 'CONFIRMED': return 'Đã xác nhận'
    case 'COMPLETED': return 'Hoàn thành'
    case 'CANCELLED': return 'Đã hủy'
    default: return status
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case 'PENDING': return 'badge-warning'
    case 'CONFIRMED': return 'badge-info'
    case 'COMPLETED': return 'badge-success'
    case 'CANCELLED': return 'badge-danger'
    default: return 'badge-default'
  }
}

function goToPatient(id: number) {
  router.push({ name: 'patient-detail', params: { id } })
}

function isTodayStr(ymd: string) {
  return ymd === formatYMD(new Date())
}
</script>

<template>
  <div class="appointments-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Quản lý Lịch Khám</h1>
        <p class="page-subtitle">Theo dõi và quản lý lịch hẹn của bệnh nhân</p>
      </div>
      <div class="view-toggle">
        <button 
          class="toggle-btn" 
          :class="{ active: viewMode === 'patient' }"
          @click="viewMode = 'patient'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          Xem theo bệnh nhân
        </button>
        <button 
          class="toggle-btn" 
          :class="{ active: viewMode === 'calendar' }"
          @click="viewMode = 'calendar'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          Xem theo lịch
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải lịch hẹn...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary mt-4" @click="fetchData">Thử lại</button>
    </div>

    <div v-else class="content-body">
      <!-- CALENDAR VIEW -->
      <div v-if="viewMode === 'calendar'" class="calendar-wrapper">
        <!-- Calendar Toolbar -->
        <div class="cal-toolbar">
          <div class="cal-nav">
            <button class="btn-icon" @click="prev">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button class="btn-today" @click="goToday">Hôm nay</button>
            <button class="btn-icon" @click="next">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
            <h2 class="cal-title">{{ calendarTitle }}</h2>
          </div>
          <div class="cal-view-selector">
            <button :class="{active: calendarView === 'month'}" @click="calendarView = 'month'">Tháng</button>
            <button :class="{active: calendarView === 'week'}" @click="calendarView = 'week'">Tuần</button>
            <button :class="{active: calendarView === 'day'}" @click="calendarView = 'day'">Ngày</button>
          </div>
        </div>

        <!-- Month View -->
        <div v-if="calendarView === 'month'" class="cal-month-grid">
          <div class="cal-header-row">
            <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
          </div>
          <div class="cal-days-grid">
            <div 
              v-for="(day, i) in monthGrid" 
              :key="i" 
              class="cal-cell"
              :class="{ 
                'not-current-month': !day.isCurrentMonth, 
                'is-today': isTodayStr(day.ymd)
              }"
              @click="currentDate = day.date; calendarView = 'day'"
            >
              <div class="cell-date">{{ day.date.getDate() }}</div>
              <div class="cell-events" v-if="groupedAppointments[day.ymd]">
                <div 
                  v-for="app in groupedAppointments[day.ymd].slice(0, 3)" 
                  :key="app.id" 
                  class="cell-event-dot"
                  :class="getStatusClass(app.status)"
                  :title="`${app.appointmentTime} - ${patientsMap[app.patientId]?.fullName}`"
                >
                  {{ app.appointmentTime }} - {{ patientsMap[app.patientId]?.fullName?.split(' ').pop() }}
                </div>
                <div v-if="groupedAppointments[day.ymd].length > 3" class="cell-more">
                  +{{ groupedAppointments[day.ymd].length - 3 }} nữa
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Week View -->
        <div v-if="calendarView === 'week'" class="cal-week-grid">
          <div class="week-header">
            <div v-for="day in weekDays" :key="day.ymd" class="week-col-header" :class="{'is-today': isTodayStr(day.ymd)}">
              <span class="day-name">{{ ['CN','T2','T3','T4','T5','T6','T7'][day.date.getDay()] }}</span>
              <span class="day-num">{{ day.date.getDate() }}</span>
            </div>
          </div>
          <div class="week-body">
            <div v-for="day in weekDays" :key="'col-'+day.ymd" class="week-col">
              <div v-if="!groupedAppointments[day.ymd]" class="no-apps"></div>
              <div 
                v-for="app in groupedAppointments[day.ymd]" 
                :key="app.id" 
                class="week-event-card"
                :class="getStatusClass(app.status)"
                @click="goToPatient(app.patientId)"
              >
                <div class="evt-time">{{ app.appointmentTime }}</div>
                <div class="evt-name">{{ patientsMap[app.patientId]?.fullName }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Day View -->
        <div v-if="calendarView === 'day'" class="cal-day-view">
          <div v-if="dayApps.length === 0" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <h3>Trống lịch</h3>
            <p>Không có lịch hẹn nào trong ngày này.</p>
          </div>
          <div v-else class="day-timeline">
            <div v-for="app in dayApps" :key="app.id" class="day-evt-card" @click="goToPatient(app.patientId)">
              <div class="evt-time-col">
                <span class="time-main">{{ app.appointmentTime }}</span>
              </div>
              <div class="evt-detail-col">
                <div class="evt-header">
                  <h4 class="evt-patient">{{ patientsMap[app.patientId]?.fullName || 'Khách vãng lai' }}</h4>
                  <span class="badge" :class="getStatusClass(app.status)">{{ getStatusLabel(app.status) }}</span>
                </div>
                <div class="evt-meta">
                  <span v-if="patientsMap[app.patientId]?.phone">📞 {{ patientsMap[app.patientId].phone }}</span>
                  <span v-if="app.type === 'WEEKLY'">🔁 Định kỳ</span>
                </div>
                <div v-if="app.notes" class="evt-notes">{{ app.notes }}</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- PATIENT VIEW -->
      <div v-else class="patient-view">
        <div v-if="patientGroups.length === 0" class="empty-state">
          <h3>Chưa có dữ liệu</h3>
          <p>Không tìm thấy bệnh nhân nào có lịch hẹn.</p>
        </div>

        <div v-else class="patient-grid">
          <div v-for="group in patientGroups" :key="group.appointments[0].patientId" class="patient-group-card">
            <div class="pg-header" @click="goToPatient(group.appointments[0].patientId)">
              <div class="pg-avatar">
                {{ (group.patient?.fullName || '?').charAt(0).toUpperCase() }}
              </div>
              <div class="pg-info">
                <h3 class="pg-name">{{ group.patient?.fullName || 'Bệnh nhân ẩn danh' }}</h3>
                <span class="pg-phone">{{ group.patient?.phone || 'Chưa cập nhật SĐT' }}</span>
              </div>
              <button class="btn-secondary btn-sm" @click.stop="goToPatient(group.appointments[0].patientId)">
                Hồ sơ
              </button>
            </div>
            
            <div class="pg-body">
              <h4 class="pg-subtitle">Lịch hẹn ({{ group.appointments.length }})</h4>
              <ul class="pg-appt-list">
                <li v-for="app in group.appointments" :key="app.id" class="pg-appt-item">
                  <div class="pg-appt-time">
                    <strong>{{ app.appointmentTime }}</strong>
                    <span>{{ new Date(app.appointmentDate).toLocaleDateString('vi-VN') }}</span>
                  </div>
                  <div class="pg-appt-status">
                    <span class="badge" :class="getStatusClass(app.status)">{{ getStatusLabel(app.status) }}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.appointments-page {
  animation: fadeIn 0.4s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 2px solid var(--brown-100);
}
.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--brown-800);
  margin-bottom: var(--space-1);
}
.page-subtitle {
  color: var(--gray-500);
  font-size: var(--font-size-md);
}

/* Toggle */
.view-toggle {
  display: flex;
  background: var(--white);
  padding: 4px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--brown-200);
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  transition: all var(--transition-base);
}
.toggle-btn:hover {
  color: var(--brown-600);
}
.toggle-btn.active {
  background: var(--brown-600);
  color: var(--white);
  box-shadow: 0 2px 4px rgba(161, 98, 7, 0.2);
}

/* Shared */
.empty-state { text-align: center; padding: var(--space-12) 0; color: var(--gray-500); }
.empty-icon { margin-bottom: var(--space-4); color: var(--brown-300); }

/* --- CALENDAR WRAPPER --- */
.calendar-wrapper {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

/* Toolbar */
.cal-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--gray-200);
  background: var(--brown-50);
}
.cal-nav {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.btn-icon {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--brown-300);
  background: var(--white);
  color: var(--brown-700);
  cursor: pointer;
  transition: all 0.2s;
}
.btn-icon:hover { background: var(--brown-100); }
.btn-today {
  padding: 0 var(--space-4);
  height: 32px;
  border-radius: var(--radius-md);
  border: 1px solid var(--brown-300);
  background: var(--white);
  font-weight: 600;
  color: var(--brown-700);
  cursor: pointer;
}
.btn-today:hover { background: var(--brown-100); }
.cal-title {
  margin: 0 0 0 var(--space-4);
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--brown-900);
}

.cal-view-selector {
  display: flex;
  background: var(--white);
  border-radius: var(--radius-md);
  border: 1px solid var(--brown-200);
  overflow: hidden;
}
.cal-view-selector button {
  padding: 6px 16px;
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  border-right: 1px solid var(--brown-100);
}
.cal-view-selector button:last-child { border-right: none; }
.cal-view-selector button.active {
  background: var(--brown-600);
  color: var(--white);
}

/* --- MONTH GRID --- */
.cal-month-grid {
  display: flex; flex-direction: column;
}
.cal-header-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
}
.cal-header-row div {
  padding: var(--space-3);
  text-align: right;
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--gray-500);
}
.cal-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.cal-cell {
  min-height: 120px;
  border-right: 1px solid var(--gray-100);
  border-bottom: 1px solid var(--gray-100);
  padding: var(--space-2);
  cursor: pointer;
  transition: background 0.2s;
}
.cal-cell:nth-child(7n) { border-right: none; }
.cal-cell:hover { background: var(--brown-50); }
.cal-cell.not-current-month { background: #fafafa; opacity: 0.6; }
.cal-cell.is-today .cell-date {
  background: var(--brown-600);
  color: var(--white);
  border-radius: 50%;
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
}
.cell-date {
  text-align: right;
  font-weight: 500;
  font-size: var(--font-size-sm);
  color: var(--gray-700);
  margin-bottom: var(--space-2);
  float: right;
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
}
.cell-events {
  clear: both;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cell-event-dot {
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}
.cell-more {
  font-size: 11px;
  color: var(--gray-500);
  text-align: center;
  font-weight: 600;
  margin-top: 2px;
}

/* --- WEEK GRID --- */
.cal-week-grid {
  display: flex; flex-direction: column;
}
.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--gray-200);
}
.week-col-header {
  padding: var(--space-3);
  text-align: center;
  border-right: 1px solid var(--gray-100);
  display: flex; flex-direction: column; gap: 4px;
}
.week-col-header:last-child { border-right: none; }
.week-col-header .day-name { font-size: var(--font-size-sm); color: var(--gray-500); font-weight: 600; }
.week-col-header .day-num { font-size: var(--font-size-xl); font-weight: 400; color: var(--gray-800); }
.week-col-header.is-today .day-num {
  font-weight: 700; color: var(--brown-600);
}

.week-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  min-height: 400px;
}
.week-col {
  border-right: 1px solid var(--gray-100);
  padding: var(--space-2);
  display: flex; flex-direction: column; gap: var(--space-2);
}
.week-col:last-child { border-right: none; }
.week-event-card {
  padding: var(--space-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.2s;
}
.week-event-card:hover { transform: translateY(-2px); border-color: var(--brown-300); }
.evt-time { font-size: 11px; font-weight: 700; margin-bottom: 2px; }
.evt-name { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* --- DAY VIEW --- */
.cal-day-view {
  padding: var(--space-6);
  background: var(--gray-50);
}
.day-timeline {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.day-evt-card {
  display: flex;
  background: var(--white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s;
}
.day-evt-card:hover {
  transform: translateX(4px);
  border-color: var(--brown-300);
}
.evt-time-col {
  padding: var(--space-4);
  background: var(--brown-50);
  border-right: 1px solid var(--brown-100);
  display: flex; align-items: center; justify-content: center;
  min-width: 100px;
}
.time-main { font-size: var(--font-size-lg); font-weight: 800; color: var(--brown-700); }
.evt-detail-col {
  padding: var(--space-4);
  flex: 1;
}
.evt-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);
}
.evt-patient { font-size: var(--font-size-md); font-weight: 700; color: var(--gray-800); }
.evt-meta {
  display: flex; gap: var(--space-4); font-size: var(--font-size-sm); color: var(--gray-500); margin-bottom: var(--space-2);
}
.evt-notes {
  background: var(--gray-50); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-size: var(--font-size-sm); color: var(--gray-600);
}

/* Event Status Colors (used in Calendar dot/cards) */
.cell-event-dot.badge-warning, .week-event-card.badge-warning { background: #fef3c7; color: #b45309; }
.cell-event-dot.badge-info, .week-event-card.badge-info { background: #e0f2fe; color: #0369a1; }
.cell-event-dot.badge-success, .week-event-card.badge-success { background: #d1fae5; color: #059669; }
.cell-event-dot.badge-danger, .week-event-card.badge-danger { background: #fee2e2; color: #b91c1c; }
.cell-event-dot.badge-default, .week-event-card.badge-default { background: #f3f4f6; color: #4b5563; }

/* Patient View */
.patient-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: var(--space-5); }
.patient-group-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); transition: transform var(--transition-fast); }
.patient-group-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--brown-300); }
.pg-header { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4); background: var(--brown-50); border-bottom: 1px solid var(--brown-100); cursor: pointer; }
.pg-avatar { width: 40px; height: 40px; background: var(--brown-600); color: var(--white); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: var(--font-size-lg); border-radius: var(--radius-md); }
.pg-info { flex: 1; }
.pg-name { font-weight: 700; color: var(--brown-900); font-size: var(--font-size-md); }
.pg-phone { font-size: var(--font-size-sm); color: var(--gray-500); }
.btn-sm { padding: 4px 12px; font-size: var(--font-size-xs); }
.pg-body { padding: var(--space-4); }
.pg-subtitle { font-size: var(--font-size-sm); font-weight: 700; color: var(--gray-700); margin-bottom: var(--space-3); text-transform: uppercase; letter-spacing: 0.5px; }
.pg-appt-list { display: flex; flex-direction: column; gap: var(--space-2); list-style: none; padding: 0; margin: 0; }
.pg-appt-item { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) var(--space-3); background: var(--gray-50); border-radius: var(--radius-md); border: 1px solid var(--gray-100); }
.pg-appt-time { display: flex; align-items: center; gap: var(--space-3); }
.pg-appt-time strong { color: var(--brown-700); }
.pg-appt-time span { font-size: var(--font-size-sm); color: var(--gray-500); }

/* Badges */
.badge { display: inline-block; padding: 4px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-warning { background: #fef3c7; color: #b45309; }
.badge-info { background: #e0f2fe; color: #0369a1; }
.badge-success { background: #d1fae5; color: #059669; }
.badge-danger { background: #fee2e2; color: #b91c1c; }
.badge-default { background: #f3f4f6; color: #4b5563; }
</style>
