<script setup lang="ts">
import type { Patient } from '~/composables/usePatients'

useSeoMeta({
  title: 'Bệnh nhân | Hệ thống Y tế',
  description: 'Quản lý danh sách bệnh nhân'
})

const { fetchAll, remove } = usePatients()

const patients = ref<Patient[]>([])
const isLoading = ref(true)
const search = ref('')
const showModal = ref(false)
const editingPatient = ref<Patient | undefined>(undefined)

const loadPatients = async () => {
  isLoading.value = true
  try {
    patients.value = await fetchAll()
  }
  catch {
    patients.value = []
  }
  finally {
    isLoading.value = false
  }
}

await loadPatients()

const filtered = computed(() => {
  return patients.value.filter((p) => {
    const matchSearch = p.fullName.toLowerCase().includes(search.value.toLowerCase())
      || (p.phone ?? '').includes(search.value)
    return matchSearch
  })
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

const handleEdit = (patient: Patient) => {
  editingPatient.value = patient
  showModal.value = true
}

const handleDelete = async (id: number, name: string) => {
  if (!confirm(`Xóa bệnh nhân "${name}"?`)) return
  try {
    await remove(id)
    await loadPatients()
  }
  catch {
    alert('Không thể xóa bệnh nhân. Vui lòng thử lại.')
  }
}
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
          <tr v-if="filtered.length === 0">
            <td colspan="7">
              <div class="empty-state">
                <UIcon name="i-lucide-search-x" class="empty-icon" />
                <span>Không tìm thấy bệnh nhân nào</span>
              </div>
            </td>
          </tr>
          <tr v-for="patient in filtered" :key="patient.id" class="patient-row">
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
                <NuxtLink :to="`/examine/${patient.id}`" class="action-btn action-btn--examine" title="Khám bệnh">
                  <UIcon name="i-lucide-stethoscope" />
                </NuxtLink>
                <NuxtLink :to="`/patients/${patient.id}`" class="action-btn" title="Xem chi tiết">
                  <UIcon name="i-lucide-eye" />
                </NuxtLink>
                <button class="action-btn" title="Sửa" @click="handleEdit(patient)">
                  <UIcon name="i-lucide-pencil" />
                </button>
                <button class="action-btn action-btn--danger" title="Xóa" @click="handleDelete(patient.id, patient.fullName)">
                  <UIcon name="i-lucide-trash-2" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="table-footer">
        <span class="table-count">Hiển thị {{ filtered.length }} / {{ patients.length }} bệnh nhân</span>
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
  background: linear-gradient(135deg, #1565c0, #1e88e5);
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
  border-color: #1e88e5;
  box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
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
  background: linear-gradient(135deg, #1565c0, #1e88e5);
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
.gender--male { color: #1e88e5; }
.gender--female { color: #e91e8c; }

/* Action */
.action-cell { display: flex; gap: 6px; }

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: all 0.18s;
}

a.action-btn { text-decoration: none; }

.action-btn:hover {
  border-color: #1e88e5;
  color: #1e88e5;
  background: #f0f7ff;
}

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
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
}

.table-count { font-size: 0.8rem; color: #94a3b8; }
</style>
