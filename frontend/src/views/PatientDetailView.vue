<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePatientStore, type Patient } from '@/stores/patient'
import { api } from '@/services/api'

const router = useRouter()
const route = useRoute()
const patientStore = usePatientStore()

const patient = ref<Patient | null>(null)
const examinations = ref<any[]>([])
const isLoading = ref(true)
const isLoadingExams = ref(true)
const error = ref<string | null>(null)
const activeTab = ref<'info' | 'history'>('info')

const patientId = computed(() => Number(route.params.id))

onMounted(async () => {
  await loadPatient()
  await loadExaminations()
})

async function loadPatient() {
  isLoading.value = true
  try {
    patient.value = await api.get<Patient>(`/patients/${patientId.value}`)
  } catch (err: any) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

async function loadExaminations() {
  isLoadingExams.value = true
  try {
    examinations.value = await api.get<any[]>(`/examinations/patient/${patientId.value}`)
  } catch (err: any) {
    console.error('Failed to load examinations:', err)
  } finally {
    isLoadingExams.value = false
  }
}

function goBack() {
  router.push({ name: 'patients' })
}

function goToNewExamination() {
  router.push({ name: 'new-examination', params: { id: patientId.value } })
}

function goToMeridianResults(examId: number) {
  router.push({ name: 'meridian-results', params: { patientId: patientId.value, examId } })
}

function goToLatestExamination() {
  if (examinations.value && examinations.value.length > 0) {
    goToMeridianResults(examinations.value[0].id)
  } else {
    alert('Bệnh nhân này chưa có ca khám nào.')
  }
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('vi-VN') } catch { return d }
}

function formatDateTime(d: string | null | undefined) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch { return d }
}

function getAge(dob: string | null) {
  if (!dob) return '—'
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--
  }
  return `${age} tuổi`
}
</script>

<template>
  <div class="detail-page">
    <!-- Back button -->
    <button class="back-btn" @click="goBack">
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/></svg>
      <span>Quay lại danh sách</span>
    </button>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải thông tin...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="goBack">Quay lại</button>
    </div>

    <template v-else-if="patient">
      <!-- Patient header card -->
      <div class="patient-header-card">
        <div class="patient-avatar-lg">
          {{ (patient.fullName || '?').charAt(0).toUpperCase() }}
        </div>
        <div class="patient-header-info">
          <h2 class="patient-name">{{ patient.fullName || 'Chưa có tên' }}</h2>
          <div class="patient-meta">
            <span class="meta-item">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
              {{ patient.gender || '—' }}
            </span>
            <span v-if="patient.dateOfBirth" class="meta-item">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
              {{ formatDate(patient.dateOfBirth) }} · {{ getAge(patient.dateOfBirth) }}
            </span>
            <span v-if="patient.phone" class="meta-item">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
              {{ patient.phone }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-meridian" @click="goToLatestExamination">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20M12 2l4 4-4 4M12 22l-4-4 4-4"/></svg>
            Kinh lạc
          </button>
          <button class="btn-primary" @click="goToNewExamination">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"/></svg>
            Thêm Khám mới
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
          Thông tin
        </button>
        <button class="tab" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
          Lịch sử khám
          <span v-if="examinations.length" class="tab-badge">{{ examinations.length }}</span>
        </button>
      </div>

      <!-- Tab: Thông tin -->
      <div v-if="activeTab === 'info'" class="tab-content">
        <div class="info-grid">
          <div class="info-card">
            <h4 class="info-card-title">Thông tin cá nhân</h4>
            <div class="info-rows">
              <div class="info-row"><span class="info-label">Họ và tên</span><span class="info-value">{{ patient.fullName || '—' }}</span></div>
              <div class="info-row"><span class="info-label">Giới tính</span><span class="info-value">{{ patient.gender || '—' }}</span></div>
              <div class="info-row"><span class="info-label">Ngày sinh</span><span class="info-value">{{ formatDate(patient.dateOfBirth) }}</span></div>
              <div class="info-row"><span class="info-label">Giờ sinh</span><span class="info-value">{{ patient.timeOfBirth || '—' }}</span></div>
              <div class="info-row"><span class="info-label">Tuổi</span><span class="info-value">{{ getAge(patient.dateOfBirth) }}</span></div>
            </div>
          </div>
          <div class="info-card">
            <h4 class="info-card-title">Liên hệ</h4>
            <div class="info-rows">
              <div class="info-row"><span class="info-label">Số điện thoại</span><span class="info-value">{{ patient.phone || '—' }}</span></div>
              <div class="info-row"><span class="info-label">Tỉnh/TP</span><span class="info-value">{{ patient.province || '—' }}</span></div>
              <div class="info-row"><span class="info-label">Địa chỉ</span><span class="info-value">{{ patient.address || '—' }}</span></div>
            </div>
          </div>
          <div class="info-card info-card--full">
            <h4 class="info-card-title">Y tế</h4>
            <div class="info-rows">
              <div class="info-row info-row--block"><span class="info-label">Tiền sử bệnh</span><p class="info-text">{{ patient.medicalHistory || 'Chưa có thông tin' }}</p></div>
              <div class="info-row info-row--block"><span class="info-label">Ghi chú</span><p class="info-text">{{ patient.notes || 'Không có ghi chú' }}</p></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Lịch sử khám -->
      <div v-if="activeTab === 'history'" class="tab-content">
        <div v-if="isLoadingExams" class="loading-state loading-state--sm">
          <div class="spinner"></div>
        </div>
        <div v-else-if="examinations.length === 0" class="empty-state-sm">
          <svg width="40" height="40" viewBox="0 0 20 20" fill="currentColor" class="empty-icon-sm"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
          <p>Chưa có lịch sử khám bệnh</p>
        </div>
        <div v-else class="exam-list">
          <div v-for="exam in examinations" :key="exam.id" class="exam-card" @click="goToMeridianResults(exam.id)">
            <div class="exam-header">
              <div class="exam-date-badge">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
                {{ formatDateTime(exam.createdAt) }}
              </div>
              <span class="exam-id">#{{ exam.id }}</span>
            </div>
            <div class="exam-body">
              <div class="exam-tags">
                <span class="exam-tag tag--am-duong">{{ exam.amDuong }}</span>
                <span class="exam-tag tag--khi">Khí: {{ exam.khi }}</span>
                <span class="exam-tag tag--huyet">Huyết: {{ exam.huyet }}</span>
              </div>
              <div v-if="exam.syndromes && exam.syndromes.length" class="exam-syndromes">
                <span class="syndromes-label">Thể bệnh:</span>
                <span v-for="(s, i) in exam.syndromes.slice(0, 3)" :key="i" class="syndrome-chip">
                  {{ s.name || s.ten || `Thể ${i + 1}` }}
                </span>
                <span v-if="exam.syndromes.length > 3" class="syndrome-more">+{{ exam.syndromes.length - 3 }}</span>
              </div>
              <p v-if="exam.notes" class="exam-notes">{{ exam.notes }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-page{max-width:900px;animation:fadeIn .4s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.back-btn{display:inline-flex;align-items:center;gap:var(--space-2);font-size:var(--font-size-sm);color:var(--gray-600);font-weight:500;margin-bottom:var(--space-6);padding:var(--space-2) var(--space-3);border-radius:var(--radius-sm);transition:all var(--transition-fast)}
.back-btn:hover{color:var(--brown-700);background:var(--brown-50)}

.loading-state{display:flex;flex-direction:column;align-items:center;gap:var(--space-4);padding:var(--space-16) 0;color:var(--gray-500)}
.loading-state--sm{padding:var(--space-10) 0}
.spinner{width:32px;height:32px;border:3px solid var(--gray-200);border-top-color:var(--brown-500);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

.error-state{text-align:center;padding:var(--space-10);color:var(--danger)}

/* Patient Header */
.patient-header-card{display:flex;align-items:center;gap:var(--space-6);padding:var(--space-6) var(--space-8);background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-lg);margin-bottom:var(--space-6)}
.patient-avatar-lg{width:64px;height:64px;border-radius:var(--radius-full);background:linear-gradient(135deg,var(--brown-400),var(--brown-700));color:var(--white);display:flex;align-items:center;justify-content:center;font-size:var(--font-size-2xl);font-weight:700;flex-shrink:0}
.patient-name{font-size:var(--font-size-xl);font-weight:700;color:var(--black);margin-bottom:var(--space-2)}
.patient-meta{display:flex;flex-wrap:wrap;gap:var(--space-4)}
.meta-item{display:inline-flex;align-items:center;gap:var(--space-1);font-size:var(--font-size-sm);color:var(--gray-600)}
.meta-item svg{color:var(--gray-400)}

/* Tabs */
.tabs{display:flex;gap:var(--space-1);margin-bottom:var(--space-6);border-bottom:2px solid var(--gray-200);padding-bottom:0}
.tab{display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-3) var(--space-4);font-size:var(--font-size-sm);font-weight:600;color:var(--gray-500);border-bottom:2px solid transparent;margin-bottom:-2px;transition:all var(--transition-fast)}
.tab:hover{color:var(--brown-600)}
.tab.active{color:var(--brown-700);border-bottom-color:var(--brown-600)}
.tab-badge{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:var(--radius-full);background:var(--brown-100);color:var(--brown-700);font-size:var(--font-size-xs);font-weight:700}

.tab-content{animation:fadeIn .3s ease}

/* Info Grid */
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-5)}
.info-card{background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-md);padding:var(--space-5) var(--space-6)}
.info-card--full{grid-column:1/-1}
.info-card-title{font-size:var(--font-size-sm);font-weight:700;color:var(--brown-700);text-transform:uppercase;letter-spacing:.04em;margin-bottom:var(--space-4);padding-bottom:var(--space-3);border-bottom:1px solid var(--gray-100)}
.info-rows{display:flex;flex-direction:column;gap:var(--space-3)}
.info-row{display:flex;justify-content:space-between;align-items:flex-start}
.info-row--block{flex-direction:column;gap:var(--space-2)}
.info-label{font-size:var(--font-size-sm);color:var(--gray-500);flex-shrink:0}
.info-value{font-size:var(--font-size-sm);font-weight:600;color:var(--black);text-align:right}
.info-text{font-size:var(--font-size-sm);color:var(--gray-700);line-height:1.6;white-space:pre-wrap}

/* Examinations */
.empty-state-sm{display:flex;flex-direction:column;align-items:center;gap:var(--space-3);padding:var(--space-10) 0;color:var(--gray-400)}
.empty-icon-sm{opacity:.4}
.exam-list{display:flex;flex-direction:column;gap:var(--space-4)}
.exam-card{background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-md);overflow:hidden;transition:all var(--transition-fast);cursor:pointer;}
.exam-card:hover{border-color:var(--brown-300);box-shadow:var(--shadow-sm)}
.exam-header{display:flex;align-items:center;justify-content:space-between;padding:var(--space-3) var(--space-5);background:var(--gray-50);border-bottom:1px solid var(--gray-100)}
.exam-date-badge{display:inline-flex;align-items:center;gap:var(--space-2);font-size:var(--font-size-sm);font-weight:600;color:var(--gray-700)}
.exam-id{font-size:var(--font-size-xs);color:var(--gray-400);font-weight:600}
.exam-body{padding:var(--space-4) var(--space-5)}
.exam-tags{display:flex;flex-wrap:wrap;gap:var(--space-2);margin-bottom:var(--space-3)}
.exam-tag{display:inline-block;padding:3px 10px;border-radius:var(--radius-full);font-size:var(--font-size-xs);font-weight:600}
.tag--am-duong{background:var(--brown-100);color:var(--brown-700)}
.tag--khi{background:#eff6ff;color:#2563eb}
.tag--huyet{background:#fdf2f8;color:#db2777}
.exam-syndromes{display:flex;align-items:center;flex-wrap:wrap;gap:var(--space-2);margin-bottom:var(--space-3)}
.syndromes-label{font-size:var(--font-size-xs);color:var(--gray-500);font-weight:600}
.syndrome-chip{display:inline-block;padding:2px 8px;border-radius:var(--radius-sm);background:var(--gray-100);color:var(--gray-700);font-size:var(--font-size-xs)}
.syndrome-more{font-size:var(--font-size-xs);color:var(--gray-400);font-weight:600}
.exam-notes{font-size:var(--font-size-sm);color:var(--gray-600);line-height:1.5;padding-top:var(--space-2);border-top:1px solid var(--gray-100);margin-top:var(--space-2)}

.btn-secondary{padding:10px 20px;background:var(--white);color:var(--gray-700);font-size:var(--font-size-sm);font-weight:600;border-radius:var(--radius-md);border:1px solid var(--gray-300);transition:all var(--transition-fast)}
.btn-secondary:hover{background:var(--gray-50)}

.btn-primary{display:inline-flex;align-items:center;gap:var(--space-2);padding:10px 20px;background:var(--brown-600);color:var(--white);font-size:var(--font-size-sm);font-weight:600;border-radius:var(--radius-md);border:none;transition:all var(--transition-fast);cursor:pointer;white-space:nowrap;}
.btn-primary:hover{background:var(--brown-700);transform:translateY(-1px);box-shadow:var(--shadow-sm);}
.btn-meridian{display:inline-flex;align-items:center;gap:var(--space-2);padding:10px 20px;background:var(--white);color:var(--brown-700);font-size:var(--font-size-sm);font-weight:600;border-radius:var(--radius-md);border:1px solid var(--brown-200);transition:all var(--transition-fast);cursor:pointer;white-space:nowrap;}
.btn-meridian:hover{background:var(--brown-50);border-color:var(--brown-300);transform:translateY(-1px);}
.header-actions{display:flex;gap:var(--space-3);margin-left:auto;}
.ml-auto{margin-left:auto;}

@media(max-width:768px){
  .patient-header-card{flex-direction:column;text-align:center;padding:var(--space-5)}
  .patient-meta{justify-content:center}
  .info-grid{grid-template-columns:1fr}
}
</style>
