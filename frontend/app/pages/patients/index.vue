<script setup lang="ts">
import type { Patient } from '~/composables/usePatients'

useSeoMeta({
  title: 'Bệnh nhân | Hệ thống Y tế',
  description: 'Quản lý danh sách bệnh nhân'
})

const { fetchPage } = usePatients()
const router = useRouter()

const PAGE_SIZE = 10
const patients = ref<Patient[]>([])
const total = ref(0)
const page = ref(1)
const totalPages = ref(1)
const isLoading = ref(true)
const search = ref('')
const showModal = ref(false)
const editingPatient = ref<Patient | undefined>(undefined)

const loadPatients = async () => {
  isLoading.value = true
  try {
    const res = await fetchPage(page.value, PAGE_SIZE, search.value || undefined)
    patients.value = res.data
    total.value = res.total
    totalPages.value = res.totalPages
  }
  catch {
    patients.value = []
    total.value = 0
    totalPages.value = 1
  }
  finally {
    isLoading.value = false
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1 }, 300)
})
watch([page, search], () => loadPatients())

await loadPatients()

const rangeStart = computed(() => total.value === 0 ? 0 : (page.value - 1) * PAGE_SIZE + 1)
const rangeEnd = computed(() => Math.min(page.value * PAGE_SIZE, total.value))

const goToPage = (p: number) => {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  loadPatients()
}

const pageNumbers = computed(() => {
  const n = totalPages.value
  const current = page.value
  const delta = 2
  const range: number[] = []
  for (let i = Math.max(1, current - delta); i <= Math.min(n, current + delta); i++) {
    range.push(i)
  }
  return range
})

const getAge = (dob: string | null): string => {
  if (!dob) return '—'
  const diff = Date.now() - new Date(dob).getTime()
  return String(Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)))
}

const genderIcon = (gender: string) =>
  gender === 'Nam' ? 'i-lucide-user' : 'i-lucide-user-round'

const handleSaved = () => {
  showModal.value = false
  editingPatient.value = undefined
  loadPatients()
}

const handleAdd = () => {
  editingPatient.value = undefined
  showModal.value = true
}

const goDetail = (id: number) => router.push(`/patients/${id}`)
const goExamine = (id: number) => router.push(`/examine/${id}`)
</script>

<template>
  <div class="patients-page">
    <!-- Modal -->
    <PatientFormModal
      :open="showModal"
      :patient="editingPatient"
      @close="showModal = false; editingPatient = undefined"
      @saved="handleSaved"
    />

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Bệnh nhân</h1>
        <p class="page-subtitle">Quản lý danh sách bệnh nhân</p>
      </div>
      <button class="btn-add" @click="handleAdd">
        <UIcon name="i-lucide-user-plus" class="btn-icon" />
        Thêm bệnh nhân
      </button>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-wrap">
        <UIcon name="i-lucide-search" class="search-icon" />
        <input
          v-model="search"
          class="search-input"
          type="text"
          placeholder="Tìm theo tên hoặc số điện thoại..."
        >
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <UIcon name="i-lucide-loader-2" class="loading-icon animate-spin" />
      <span>Đang tải dữ liệu...</span>
    </div>

    <!-- Table -->
    <div v-else class="table-card">
      <table class="patient-table">
        <thead>
          <tr>
            <th>Bệnh nhân</th>
            <th>Tuổi</th>
            <th>Giới tính</th>
            <th>Số điện thoại</th>
            <th>Tỉnh/Thành</th>
            <th>Ngày tạo</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-if="patients.length === 0">
            <td colspan="7">
              <div class="empty-state">
                <UIcon name="i-lucide-search-x" class="empty-icon" />
                <span>Không tìm thấy bệnh nhân nào</span>
              </div>
            </td>
          </tr>
          <tr
            v-for="patient in patients"
            :key="patient.id"
            class="patient-row"
            role="button"
            tabindex="0"
            @click="goDetail(patient.id)"
            @keydown.enter.prevent="goDetail(patient.id)"
          >
            <td>
              <div class="patient-name-cell">
                <div class="avatar">{{ patient.fullName.charAt(0) }}</div>
                <div>
                  <div class="patient-name">{{ patient.fullName }}</div>
                  <div v-if="patient.address" class="patient-address">{{ patient.address }}</div>
                </div>
              </div>
            </td>
            <td class="cell-muted">{{ getAge(patient.dateOfBirth) }}</td>
            <td>
              <div class="gender-cell">
                <UIcon
                  :name="genderIcon(patient.gender)"
                  class="gender-icon"
                  :class="patient.gender === 'Nam' ? 'gender--male' : 'gender--female'"
                />
                {{ patient.gender }}
              </div>
            </td>
            <td class="cell-muted">{{ patient.phone || '—' }}</td>
            <td class="cell-muted">{{ patient.province || '—' }}</td>
            <td class="cell-muted">
              {{ new Date(patient.createdAt).toLocaleDateString('vi-VN') }}
            </td>
            <td>
              <div class="action-cell">
                <button class="action-pill action-pill--primary" @click.stop="goExamine(patient.id)">
                  <UIcon name="i-lucide-stethoscope" class="pill-icon" />
                  Khám bệnh
                </button>
                <button class="action-pill" @click.stop="goDetail(patient.id)">
                  <UIcon name="i-lucide-history" class="pill-icon" />
                  Lịch sử
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="table-footer">
        <span class="table-count">
          Hiển thị {{ rangeStart }}-{{ rangeEnd }} / {{ total }} bệnh nhân
        </span>
        <div v-if="totalPages > 1" class="pagination">
          <button
            class="pagination-btn"
            :disabled="page <= 1"
            :aria-disabled="page <= 1"
            @click="goToPage(page - 1)"
          >
            <UIcon name="i-lucide-chevron-left" class="pagination-icon" />
          </button>
          <template v-for="n in pageNumbers" :key="n">
            <button
              class="pagination-btn pagination-num"
              :class="{ 'pagination-num--active': n === page }"
              @click="goToPage(n)"
            >
              {{ n }}
            </button>
          </template>
          <button
            class="pagination-btn"
            :disabled="page >= totalPages"
            :aria-disabled="page >= totalPages"
            @click="goToPage(page + 1)"
          >
            <UIcon name="i-lucide-chevron-right" class="pagination-icon" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.patients-page {
  width: 100%;
  padding: 32px 36px;
  box-sizing: border-box;
}

/* ─── Header ─── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
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

.btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: linear-gradient(135deg, var(--kl-primary, #5B3A1A), var(--kl-secondary, #8B1A1A));
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(21, 101, 192, 0.3);
  transition: transform 0.15s, box-shadow 0.2s;
}

.btn-add:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(21, 101, 192, 0.4);
}

.btn-icon { width: 16px; height: 16px; }

/* ─── Toolbar ─── */
.toolbar {
  margin-bottom: 20px;
}

.search-wrap {
  position: relative;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 40px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.875rem;
  background: #ffffff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--kl-secondary, #8B1A1A);
  box-shadow: 0 0 0 3px rgba(139, 26, 26, 0.1);
}

/* ─── Loading ─── */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px;
  color: #64748b;
  font-size: 0.9rem;
}

.loading-icon { width: 24px; height: 24px; }

/* ─── Table ─── */
.table-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(226, 232, 240, 0.8);
  overflow: hidden;
}

.patient-table {
  width: 100%;
  border-collapse: collapse;
}

.patient-table thead tr {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.patient-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 0.78rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.patient-table td {
  padding: 14px 16px;
  font-size: 0.875rem;
  color: #1a2332;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.patient-row { transition: background 0.15s; }
.patient-row:last-child td { border-bottom: none; }
.patient-row:hover { background: #f8fcff; }
.patient-row { cursor: pointer; }
.cell-muted { color: #64748b !important; }

/* Name cell */
.patient-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--kl-primary, #5B3A1A), var(--kl-secondary, #8B1A1A));
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.patient-name { font-weight: 500; }
.patient-address {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 2px;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Gender */
.gender-cell { display: flex; align-items: center; gap: 6px; }
.gender-icon { width: 15px; height: 15px; }
.gender--male { color: var(--kl-secondary, #8B1A1A); }
.gender--female { color: #e91e8c; }

/* Action */
.action-cell { display: flex; gap: 6px; }

.action-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--kl-border, #D4C5A0);
  background: var(--kl-bg-white, #FFFDF7);
  color: var(--kl-text-muted, #5B4A3A);
  cursor: pointer;
  transition: all 0.18s;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
}

.action-pill:hover {
  border-color: var(--kl-secondary, #8B1A1A);
  color: var(--kl-secondary, #8B1A1A);
  background: var(--kl-bg-light, #FBF8F1);
}

.action-pill--primary {
  background: linear-gradient(135deg, var(--kl-primary, #5B3A1A), var(--kl-secondary, #8B1A1A));
  border-color: transparent;
  color: #fff;
}

.action-pill--primary:hover {
  background: linear-gradient(135deg, var(--kl-secondary, #8B1A1A), #6B1515);
  color: #fff;
}

.pill-icon { width: 16px; height: 16px; }

.action-btn--examine:hover {
  border-color: #2e7d32;
  color: #2e7d32;
  background: #e8f5e9;
}

.action-btn--danger:hover {
  border-color: #dc2626;
  color: #dc2626;
  background: #fef2f2;
}

/* Empty */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px;
  color: #94a3b8;
  font-size: 0.875rem;
}

.empty-icon { width: 36px; height: 36px; opacity: 0.5; }

/* Footer */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
}

.table-count { font-size: 0.8rem; color: #94a3b8; }

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--kl-secondary, #8B1A1A);
  color: var(--kl-secondary, #8B1A1A);
  background: var(--kl-bg-light, #FBF8F1);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-num--active {
  border-color: var(--kl-secondary, #8B1A1A);
  background: var(--kl-secondary, #8B1A1A);
  color: #fff;
}

.pagination-num--active:hover {
  background: var(--kl-primary, #5B3A1A);
  border-color: var(--kl-primary, #5B3A1A);
  color: #fff;
}

.pagination-icon { width: 18px; height: 18px; }
</style>
