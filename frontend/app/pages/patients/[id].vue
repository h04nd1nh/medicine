<script setup lang="ts">
import type { Patient } from '~/composables/usePatients'
import type { Examination } from '~/composables/useExaminations'

const route = useRoute()
const router = useRouter()
const patientId = Number(route.params.id)

const { fetchOne, remove } = usePatients()
const { fetchByPatient, remove: removeExam } = useExaminations()

const patient = ref<Patient | null>(null)
const examinations = ref<Examination[]>([])
const isLoading = ref(true)
const isLoadingExams = ref(true)
const showEditModal = ref(false)

const loadPatient = async () => {
  isLoading.value = true
  try {
    patient.value = await fetchOne(patientId)
  }
  catch {
    patient.value = null
  }
  finally {
    isLoading.value = false
  }
}

const loadExaminations = async () => {
  isLoadingExams.value = true
  try {
    examinations.value = await fetchByPatient(patientId)
  }
  catch {
    examinations.value = []
  }
  finally {
    isLoadingExams.value = false
  }
}

await loadPatient()
loadExaminations()

useSeoMeta({
  title: computed(() => patient.value ? `${patient.value.fullName} | Hệ thống Y tế` : 'Bệnh nhân | Hệ thống Y tế'),
  description: 'Chi tiết hồ sơ bệnh nhân'
})

const getAge = (dob: string | null): string => {
  if (!dob) return '—'
  const diff = Date.now() - new Date(dob).getTime()
  return String(Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)))
}

const formatDate = (date: string | null): string => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('vi-VN')
}

const handleDelete = async () => {
  if (!patient.value) return
  if (!confirm(`Xóa bệnh nhân "${patient.value.fullName}"?`)) return
  try {
    await remove(patient.value.id)
    await router.push('/patients')
  }
  catch {
    alert('Không thể xóa bệnh nhân. Vui lòng thử lại.')
  }
}

const handleSaved = () => {
  showEditModal.value = false
  loadPatient()
}

const handleDeleteExam = async (exam: Examination) => {
  if (!confirm('Xóa ca khám này?')) return
  try {
    await removeExam(exam.id)
    await loadExaminations()
  }
  catch {
    alert('Không thể xóa ca khám. Vui lòng thử lại.')
  }
}

const expandedExamId = ref<number | null>(null)

const toggleExam = (id: number) => {
  expandedExamId.value = expandedExamId.value === id ? null : id
}

const CHANNEL_LABEL_MAP: Record<string, string> = {
  tieutruong: 'Tiểu trường',
  tam: 'Tâm',
  tamtieu: 'Tam tiêu',
  tambao: 'Tâm bào',
  daitrang: 'Đại tràng',
  phe: 'Phế',
  bangquang: 'Bàng quang',
  than: 'Thận',
  dam: 'Đảm',
  vi: 'Vị',
  can: 'Can',
  ty: 'Tỳ'
}

const flagLabel = (val: number): string => {
  if (val > 0) return 'Thịnh'
  if (val < 0) return 'Hư'
  return 'BT'
}

const flagClass = (val: number): string => {
  if (val > 0) return 'flag--high'
  if (val < 0) return 'flag--low'
  return 'flag--normal'
}

const statusClass = (val: string): string => {
  if (val.includes('hư') || val.includes('Hư')) return 'status--warn'
  if (val.includes('thịnh') || val.includes('Thịnh')) return 'status--warn'
  return 'status--ok'
}
</script>

<template>
  <div class="detail-page">
    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <UIcon name="i-lucide-loader-2" class="loading-icon animate-spin" />
      <span>Đang tải dữ liệu...</span>
    </div>

    <!-- Not found -->
    <div v-else-if="!patient" class="empty-state">
      <UIcon name="i-lucide-user-x" class="empty-icon" />
      <span>Không tìm thấy bệnh nhân</span>
      <NuxtLink to="/patients" class="back-link">Quay lại danh sách</NuxtLink>
    </div>

    <template v-else>
      <!-- Edit Modal -->
      <PatientFormModal
        :open="showEditModal"
        :patient="patient"
        @close="showEditModal = false"
        @saved="handleSaved"
      />

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <NuxtLink to="/patients" class="back-btn">
            <UIcon name="i-lucide-arrow-left" />
          </NuxtLink>
          <div class="header-info">
            <div class="patient-avatar">{{ patient.fullName.charAt(0) }}</div>
            <div>
              <h1 class="page-title">{{ patient.fullName }}</h1>
              <p class="page-subtitle">
                {{ patient.gender }} · {{ getAge(patient.dateOfBirth) }} tuổi
                <template v-if="patient.province"> · {{ patient.province }}</template>
              </p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <NuxtLink :to="`/examine/${patient.id}`" class="btn-examine">
            <UIcon name="i-lucide-stethoscope" class="btn-icon" />
            Khám bệnh
          </NuxtLink>
          <button class="btn-edit" @click="showEditModal = true">
            <UIcon name="i-lucide-pencil" class="btn-icon" />
            Chỉnh sửa
          </button>
          <button class="btn-delete" @click="handleDelete">
            <UIcon name="i-lucide-trash-2" class="btn-icon" />
            Xóa
          </button>
        </div>
      </div>

      <!-- Info grid -->
      <div class="info-grid">
        <!-- Thông tin cá nhân -->
        <div class="info-card">
          <div class="card-header">
            <UIcon name="i-lucide-user" class="card-header-icon" />
            <h2 class="card-title">Thông tin cá nhân</h2>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="info-label">Họ tên</span>
              <span class="info-value">{{ patient.fullName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Giới tính</span>
              <span class="info-value">
                <UIcon
                  :name="patient.gender === 'Nam' ? 'i-lucide-user' : 'i-lucide-user-round'"
                  class="gender-icon"
                  :class="patient.gender === 'Nam' ? 'gender--male' : 'gender--female'"
                />
                {{ patient.gender }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Ngày sinh</span>
              <span class="info-value">{{ formatDate(patient.dateOfBirth) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Giờ sinh</span>
              <span class="info-value">{{ patient.timeOfBirth || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tuổi</span>
              <span class="info-value">{{ getAge(patient.dateOfBirth) }}</span>
            </div>
          </div>
        </div>

        <!-- Liên hệ -->
        <div class="info-card">
          <div class="card-header">
            <UIcon name="i-lucide-phone" class="card-header-icon" />
            <h2 class="card-title">Liên hệ & Địa chỉ</h2>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="info-label">Số điện thoại</span>
              <span class="info-value">{{ patient.phone || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tỉnh/Thành phố</span>
              <span class="info-value">{{ patient.province || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Địa chỉ</span>
              <span class="info-value">{{ patient.address || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Bệnh sử -->
        <div class="info-card info-card--full">
          <div class="card-header">
            <UIcon name="i-lucide-clipboard-list" class="card-header-icon" />
            <h2 class="card-title">Bệnh sử</h2>
          </div>
          <div class="card-body">
            <p class="info-text">{{ patient.medicalHistory || 'Chưa có thông tin bệnh sử.' }}</p>
          </div>
        </div>

        <!-- Ghi chú -->
        <div class="info-card info-card--full">
          <div class="card-header">
            <UIcon name="i-lucide-notebook-pen" class="card-header-icon" />
            <h2 class="card-title">Ghi chú</h2>
          </div>
          <div class="card-body">
            <p class="info-text">{{ patient.notes || 'Chưa có ghi chú.' }}</p>
          </div>
        </div>
      </div>

      <!-- Lịch sử khám bệnh -->
      <div class="info-card info-card--full exam-history-card">
        <div class="card-header">
          <UIcon name="i-lucide-history" class="card-header-icon" />
          <h2 class="card-title">Lịch sử khám bệnh</h2>
          <span class="exam-count">{{ examinations.length }} ca khám</span>
        </div>
        <div class="card-body">
          <div v-if="isLoadingExams" class="exam-loading">
            <UIcon name="i-lucide-loader-2" class="loading-icon-sm animate-spin" />
            <span>Đang tải...</span>
          </div>
          <div v-else-if="examinations.length === 0" class="exam-empty">
            <UIcon name="i-lucide-file-x" class="exam-empty-icon" />
            <span>Chưa có lịch sử khám bệnh</span>
          </div>
          <div v-else class="exam-list">
            <div v-for="exam in examinations" :key="exam.id" class="exam-item" :class="{ 'exam-item--expanded': expandedExamId === exam.id }">
              <div class="exam-summary" @click="toggleExam(exam.id)">
                <div class="exam-summary-left">
                  <UIcon name="i-lucide-activity" class="exam-item-icon" />
                  <div>
                    <div class="exam-date">{{ new Date(exam.createdAt).toLocaleString('vi-VN') }}</div>
                    <div class="exam-tags">
                      <span class="exam-tag" :class="statusClass(exam.amDuong)">{{ exam.amDuong }}</span>
                      <span class="exam-tag" :class="statusClass(exam.khi)">{{ exam.khi }}</span>
                      <span class="exam-tag" :class="statusClass(exam.huyet)">{{ exam.huyet }}</span>
                    </div>
                  </div>
                </div>
                <div class="exam-summary-right">
                  <span v-if="exam.syndromes.length > 0" class="syndrome-badge">{{ exam.syndromes.length }} hội chứng</span>
                  <button class="action-btn action-btn--danger" title="Xóa" @click.stop="handleDeleteExam(exam)">
                    <UIcon name="i-lucide-trash-2" />
                  </button>
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="expand-icon"
                    :class="{ 'expand-icon--open': expandedExamId === exam.id }"
                  />
                </div>
              </div>

              <!-- Expanded detail -->
              <Transition name="slide">
                <div v-if="expandedExamId === exam.id" class="exam-detail">
                  <!-- Flags table -->
                  <table class="flags-table">
                    <thead>
                      <tr>
                        <th>Kinh</th>
                        <th>Trái</th>
                        <th>Phải</th>
                        <th>TB</th>
                        <th>C8</th>
                        <th>C10</th>
                        <th>C11</th>
                        <th>C12</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="flag in exam.flags" :key="flag.channelIndex">
                        <td class="cell-name">{{ CHANNEL_LABEL_MAP[flag.channelName] || flag.channelName }}</td>
                        <td>{{ flag.L }}</td>
                        <td>{{ flag.R }}</td>
                        <td>{{ flag.Avg.toFixed(1) }}</td>
                        <td><span class="flag-badge" :class="flagClass(flag.c8)">{{ flagLabel(flag.c8) }}</span></td>
                        <td><span class="flag-badge" :class="flagClass(flag.c10)">{{ flagLabel(flag.c10) }}</span></td>
                        <td><span class="flag-badge" :class="flagClass(flag.c11)">{{ flagLabel(flag.c11) }}</span></td>
                        <td><span class="flag-badge" :class="flagClass(flag.c12)">{{ flagLabel(flag.c12) }}</span></td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Syndromes -->
                  <div v-if="exam.syndromes.length > 0" class="exam-syndromes">
                    <div v-for="(syn, idx) in exam.syndromes" :key="idx" class="syndrome-item">
                      <strong v-if="syn.tieuket">{{ syn.tieuket }}</strong>
                      <span v-if="syn.trieuchung"> — {{ syn.trieuchung }}</span>
                    </div>
                  </div>

                  <div v-if="exam.notes" class="exam-notes">
                    <strong>Ghi chú:</strong> {{ exam.notes }}
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>

      <!-- Meta -->
      <div class="meta-bar">
        <span class="meta-item">
          <UIcon name="i-lucide-calendar-plus" class="meta-icon" />
          Ngày tạo: {{ new Date(patient.createdAt).toLocaleDateString('vi-VN') }}
        </span>
        <span class="meta-item">
          <UIcon name="i-lucide-calendar-check" class="meta-icon" />
          Cập nhật: {{ new Date(patient.updatedAt).toLocaleDateString('vi-VN') }}
        </span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  width: 100%;
  padding: 32px 36px;
  box-sizing: border-box;
}

/* ─── Loading / Empty ─── */
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px;
  color: #94a3b8;
  font-size: 0.9rem;
}

.empty-icon { width: 48px; height: 48px; opacity: 0.5; }

.back-link {
  color: #1e88e5;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
}

.back-link:hover { text-decoration: underline; }

/* ─── Header ─── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  color: #64748b;
  text-decoration: none;
  transition: all 0.18s;
  flex-shrink: 0;
}

.back-btn:hover {
  border-color: #1e88e5;
  color: #1e88e5;
  background: #f0f7ff;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.patient-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1565c0, #1e88e5);
  color: #fff;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a2332;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-edit {
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

.btn-edit:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(21, 101, 192, 0.4);
}

.btn-delete {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: transparent;
  color: #dc2626;
  border: 1.5px solid #fecaca;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}

.btn-delete:hover {
  background: #fef2f2;
  border-color: #dc2626;
}

.btn-icon { width: 16px; height: 16px; }

/* ─── Info Grid ─── */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  margin-bottom: 20px;
}

.info-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(226, 232, 240, 0.8);
  overflow: hidden;
}

.info-card--full {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.card-header-icon {
  width: 18px;
  height: 18px;
  color: #1e88e5;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a2332;
  margin: 0;
}

.card-body {
  padding: 16px 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid #f8fafc;
}

.info-row:last-child { border-bottom: none; }

.info-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #94a3b8;
  flex-shrink: 0;
  min-width: 120px;
}

.info-value {
  font-size: 0.875rem;
  color: #1a2332;
  text-align: right;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-text {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

/* Gender */
.gender-icon { width: 15px; height: 15px; }
.gender--male { color: #1e88e5; }
.gender--female { color: #e91e8c; }

/* ─── Meta ─── */
.meta-bar {
  display: flex;
  gap: 24px;
  padding: 14px 0;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #94a3b8;
}

.meta-icon {
  width: 14px;
  height: 14px;
}

/* ─── Examine button ─── */
.btn-examine {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #2e7d32, #43a047);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
  transition: transform 0.15s, box-shadow 0.2s;
}

.btn-examine:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(46, 125, 50, 0.4);
}

/* ─── Exam history ─── */
.exam-history-card {
  margin-bottom: 20px;
}

.exam-count {
  margin-left: auto;
  font-size: 0.78rem;
  color: #94a3b8;
  font-weight: 500;
}

.exam-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: #64748b;
  font-size: 0.85rem;
}

.loading-icon-sm { width: 18px; height: 18px; }

.exam-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px;
  color: #94a3b8;
  font-size: 0.85rem;
}

.exam-empty-icon { width: 20px; height: 20px; opacity: 0.5; }

.exam-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exam-item {
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.exam-item--expanded { border-color: #e2e8f0; }

.exam-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;
  gap: 12px;
}

.exam-summary:hover { background: #f8fcff; }

.exam-summary-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exam-item-icon {
  width: 20px;
  height: 20px;
  color: #1e88e5;
  flex-shrink: 0;
}

.exam-date {
  font-size: 0.85rem;
  font-weight: 500;
  color: #1a2332;
  margin-bottom: 4px;
}

.exam-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.exam-tag {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
}

.exam-tag.status--ok { background: #e8f5e9; color: #2e7d32; }
.exam-tag.status--warn { background: #fff3e0; color: #e65100; }

.exam-summary-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.syndrome-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  background: #e3f2fd;
  color: #1565c0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: all 0.18s;
}

.action-btn--danger:hover {
  border-color: #dc2626;
  color: #dc2626;
  background: #fef2f2;
}

.expand-icon {
  width: 18px;
  height: 18px;
  color: #94a3b8;
  transition: transform 0.2s;
}

.expand-icon--open { transform: rotate(180deg); }

/* ─── Exam detail ─── */
.exam-detail {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.flags-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.flags-table th {
  padding: 8px 10px;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.flags-table th:first-child { text-align: left; }

.flags-table td {
  padding: 6px 10px;
  text-align: center;
  color: #374151;
  border-bottom: 1px solid #f1f5f9;
}

.flags-table tr:last-child td { border-bottom: none; }
.cell-name { text-align: left !important; font-weight: 500; color: #1a2332; }

.flag-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.flag--normal { background: #f1f5f9; color: #64748b; }
.flag--high { background: #fff3e0; color: #e65100; }
.flag--low { background: #e3f2fd; color: #1565c0; }

.exam-syndromes {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.syndrome-item {
  font-size: 0.82rem;
  color: #374151;
  padding: 6px 10px;
  background: #fafbfc;
  border-radius: 8px;
  border-left: 3px solid #1e88e5;
}

.exam-notes {
  font-size: 0.82rem;
  color: #64748b;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 8px;
}

/* ─── Transitions ─── */
.slide-enter-active, .slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.slide-enter-from, .slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-enter-to, .slide-leave-from {
  opacity: 1;
  max-height: 1000px;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .btn-examine, .btn-edit, .btn-delete {
    flex: 1;
    justify-content: center;
  }
}
</style>
