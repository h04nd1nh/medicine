<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePatientStore, type CreatePatientDto, type Patient } from '@/stores/patient'
import { api } from '@/services/api'

const router = useRouter()

const store = usePatientStore()

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editingPatient = ref<Patient | null>(null)
const deletingPatientId = ref<number | null>(null)
const searchInput = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Form data
const form = ref<CreatePatientDto>({
  fullName: '',
  gender: 'Nam',
  dateOfBirth: '',
  timeOfBirth: '',
  address: '',
  province: '',
  phone: '',
  medicalHistory: '',
  notes: '',
})

onMounted(() => {
  store.fetchPatients()
})

function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    store.setSearch(searchInput.value)
  }, 400)
}

function openCreateModal() {
  editingPatient.value = null
  form.value = { fullName: '', gender: 'Nam', dateOfBirth: '', timeOfBirth: '', address: '', province: '', phone: '', medicalHistory: '', notes: '' }
  showModal.value = true
}

function openEditModal(patient: Patient) {
  editingPatient.value = patient
  form.value = {
    fullName: patient.fullName || '',
    gender: patient.gender || 'Nam',
    dateOfBirth: patient.dateOfBirth || '',
    timeOfBirth: patient.timeOfBirth || '',
    address: patient.address || '',
    province: patient.province || '',
    phone: patient.phone || '',
    medicalHistory: patient.medicalHistory || '',
    notes: patient.notes || '',
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingPatient.value = null
}

async function handleSubmit() {
  if (!form.value.fullName.trim()) {
    store.error = 'Vui lòng nhập họ tên bệnh nhân'
    return
  }
  let success: boolean
  if (editingPatient.value) {
    success = await store.updatePatient(editingPatient.value.id, form.value)
  } else {
    success = await store.createPatient(form.value)
  }
  if (success) closeModal()
}

function confirmDelete(id: number) {
  deletingPatientId.value = id
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (deletingPatientId.value !== null) {
    await store.deletePatient(deletingPatientId.value)
  }
  showDeleteConfirm.value = false
  deletingPatientId.value = null
}

async function goToLatestExamination(patientId: number) {
  try {
    const exams = await api.get<any[]>(`/examinations/patient/${patientId}`)
    if (exams && exams.length > 0) {
      router.push({
        name: 'meridian-results',
        params: { patientId, examId: exams[0].id }
      })
    } else {
      alert('Bệnh nhân này chưa có ca khám nào.')
    }
  } catch (error) {
    console.error('Failed to fetch examinations:', error)
    alert('Không thể tải thông tin ca khám.')
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN')
  } catch {
    return dateStr
  }
}

function genderLabel(g: string | null) {
  if (!g) return '—'
  return g
}

const pageNumbers = computed(() => {
  const pages: number[] = []
  const tp = store.totalPages
  const cp = store.page
  const start = Math.max(1, cp - 2)
  const end = Math.min(tp, cp + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})
</script>

<template>
  <div class="patients-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-heading">Danh sách bệnh nhân</h2>
        <p class="page-description">Quản lý thông tin bệnh nhân của phòng khám</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
        <span>Thêm bệnh nhân</span>
      </button>
    </div>

    <!-- Error alert -->
    <Transition name="fade">
      <div v-if="store.error" class="alert alert--error" @click="store.clearError()">
        <span>{{ store.error }}</span>
        <button class="alert-close">✕</button>
      </div>
    </Transition>

    <!-- Search bar -->
    <div class="search-bar">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
      <input
        v-model="searchInput"
        type="text"
        class="search-input"
        placeholder="Tìm theo tên, SĐT hoặc địa chỉ..."
        @input="onSearchInput"
      />
      <span v-if="store.total > 0" class="search-count">{{ store.total }} bệnh nhân</span>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading && store.patients.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải dữ liệu...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="!store.isLoading && store.patients.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
      </div>
      <h3 class="empty-title">{{ searchInput ? 'Không tìm thấy kết quả' : 'Chưa có bệnh nhân' }}</h3>
      <p class="empty-text">{{ searchInput ? 'Thử tìm kiếm với từ khóa khác' : 'Bắt đầu thêm bệnh nhân mới để quản lý.' }}</p>
    </div>

    <!-- Table -->
    <div v-else class="table-wrapper">
      <div class="table-loading" v-if="store.isLoading">
        <div class="spinner spinner--sm"></div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Họ và tên</th>
            <th>Giới tính</th>
            <th>Ngày sinh</th>
            <th>SĐT</th>
            <th>Địa chỉ</th>
            <th class="th-actions">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in store.patients" :key="p.id" class="table-row">
            <td class="td-name">
              <div class="patient-avatar">{{ (p.fullName || '?').charAt(0).toUpperCase() }}</div>
              <span>{{ p.fullName || '—' }}</span>
            </td>
            <td>
              <span class="badge" :class="p.gender === 'Nam' ? 'badge--blue' : 'badge--pink'">{{ genderLabel(p.gender) }}</span>
            </td>
            <td>{{ formatDate(p.dateOfBirth) }}</td>
            <td>{{ p.phone || '—' }}</td>
            <td class="td-address">{{ p.address || '—' }}</td>
            <td class="td-actions">
              <button class="text-btn text-btn--detail" @click="router.push({ name: 'patient-detail', params: { id: p.id } })">Chi tiết</button>
              <button class="text-btn text-btn--meridian" @click="goToLatestExamination(p.id)">Kinh lạc</button>
              <button class="text-btn text-btn--edit" @click="openEditModal(p)">Sửa</button>
              <button class="text-btn text-btn--delete" @click="confirmDelete(p.id)">Xóa</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="store.totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="store.page <= 1" @click="store.setPage(store.page - 1)">‹</button>
        <button
          v-for="pn in pageNumbers"
          :key="pn"
          class="page-btn"
          :class="{ active: pn === store.page }"
          @click="store.setPage(pn)"
        >{{ pn }}</button>
        <button class="page-btn" :disabled="store.page >= store.totalPages" @click="store.setPage(store.page + 1)">›</button>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <Transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>{{ editingPatient ? 'Chỉnh sửa bệnh nhân' : 'Thêm bệnh nhân mới' }}</h3>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <form @submit.prevent="handleSubmit" class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Họ và tên <span class="required">*</span></label>
                <input v-model="form.fullName" type="text" class="form-input" placeholder="Nguyễn Văn A"/>
              </div>
              <div class="form-group form-group--sm">
                <label class="form-label">Giới tính</label>
                <select v-model="form.gender" class="form-input">
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Ngày sinh</label>
                <input v-model="form.dateOfBirth" type="date" class="form-input"/>
              </div>
              <div class="form-group">
                <label class="form-label">Giờ sinh</label>
                <input v-model="form.timeOfBirth" type="text" class="form-input" placeholder="VD: 10:30"/>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Số điện thoại</label>
                <input v-model="form.phone" type="text" class="form-input" placeholder="0901234567"/>
              </div>
              <div class="form-group">
                <label class="form-label">Tỉnh/Thành phố</label>
                <input v-model="form.province" type="text" class="form-input" placeholder="TP. Hồ Chí Minh"/>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Địa chỉ</label>
              <input v-model="form.address" type="text" class="form-input" placeholder="Số nhà, đường, phường/xã..."/>
            </div>
            <div class="form-group">
              <label class="form-label">Tiền sử bệnh</label>
              <textarea v-model="form.medicalHistory" class="form-input form-textarea" rows="3" placeholder="Ghi chú tiền sử bệnh..."></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Ghi chú</label>
              <textarea v-model="form.notes" class="form-input form-textarea" rows="2" placeholder="Ghi chú thêm..."></textarea>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-secondary" @click="closeModal">Hủy</button>
              <button type="submit" class="btn-primary" :disabled="store.isLoading">
                <span v-if="store.isLoading" class="btn-spinner"></span>
                <span v-else>{{ editingPatient ? 'Cập nhật' : 'Thêm mới' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Delete Confirmation -->
    <Transition name="fade">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal modal--sm" @click.stop>
          <div class="modal-header">
            <h3>Xác nhận xóa</h3>
            <button class="modal-close" @click="showDeleteConfirm = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">Bạn có chắc chắn muốn xóa bệnh nhân này? Hành động này không thể hoàn tác.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showDeleteConfirm = false">Hủy</button>
            <button class="btn-danger" @click="handleDelete" :disabled="store.isLoading">
              <span v-if="store.isLoading" class="btn-spinner"></span>
              <span v-else>Xóa</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.patients-page{max-width:1200px;animation:fadeIn .4s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

/* Header */
.page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:var(--space-6);gap:var(--space-4);flex-wrap:wrap}
.page-heading{font-size:var(--font-size-xl);font-weight:700;color:var(--black);margin-bottom:var(--space-1)}
.page-description{font-size:var(--font-size-sm);color:var(--gray-500)}

/* Alert */
.alert{display:flex;align-items:center;justify-content:space-between;padding:var(--space-3) var(--space-4);border-radius:var(--radius-md);font-size:var(--font-size-sm);margin-bottom:var(--space-5);cursor:pointer}
.alert--error{background:#fef2f2;border:1px solid #fecaca;color:var(--danger)}
.alert-close{color:inherit;opacity:.5;font-size:var(--font-size-xs)}

/* Search */
.search-bar{display:flex;align-items:center;gap:var(--space-3);padding:10px 16px;background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-md);margin-bottom:var(--space-6);transition:border-color var(--transition-fast)}
.search-bar:focus-within{border-color:var(--brown-400);box-shadow:0 0 0 3px rgba(192,139,66,.1)}
.search-icon{color:var(--gray-400);flex-shrink:0}
.search-input{flex:1;border:none;outline:none;font-size:var(--font-size-sm);color:var(--black);background:transparent}
.search-input::placeholder{color:var(--gray-400)}
.search-count{font-size:var(--font-size-xs);color:var(--gray-500);white-space:nowrap;padding:2px 10px;background:var(--gray-100);border-radius:var(--radius-full)}

/* Loading & Empty */
.loading-state{display:flex;flex-direction:column;align-items:center;gap:var(--space-4);padding:var(--space-16) 0;color:var(--gray-500)}
.spinner{width:32px;height:32px;border:3px solid var(--gray-200);border-top-color:var(--brown-500);border-radius:50%;animation:spin .7s linear infinite}
.spinner--sm{width:20px;height:20px;border-width:2px}
@keyframes spin{to{transform:rotate(360deg)}}
.empty-state{display:flex;flex-direction:column;align-items:center;padding:var(--space-16) var(--space-8);text-align:center}
.empty-icon{width:100px;height:100px;border-radius:50%;background:var(--brown-50);color:var(--brown-300);display:flex;align-items:center;justify-content:center;margin-bottom:var(--space-6)}
.empty-title{font-size:var(--font-size-lg);font-weight:700;color:var(--gray-700);margin-bottom:var(--space-2)}
.empty-text{font-size:var(--font-size-sm);color:var(--gray-500)}

/* Table */
.table-wrapper{background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-md);overflow:hidden;position:relative}
.table-loading{position:absolute;top:12px;right:12px;z-index:5}
.data-table{width:100%;border-collapse:collapse}
.data-table th{padding:12px 16px;text-align:left;font-size:var(--font-size-xs);font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.05em;background:var(--gray-50);border-bottom:1px solid var(--gray-200)}
.data-table td{padding:12px 16px;font-size:var(--font-size-sm);color:var(--gray-700);border-bottom:1px solid var(--gray-100);vertical-align:middle}
.table-row{transition:background var(--transition-fast)}
.table-row:hover{background:var(--brown-50)}
.table-row:last-child td{border-bottom:none}
.th-actions{text-align:right;width:200px}

.td-name{display:flex;align-items:center;gap:var(--space-3);font-weight:600;color:var(--black)}
.patient-avatar{width:32px;height:32px;border-radius:var(--radius-full);background:linear-gradient(135deg,var(--brown-300),var(--brown-500));color:var(--white);display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);font-weight:700;flex-shrink:0}
.td-address{max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.badge{display:inline-block;padding:2px 10px;border-radius:var(--radius-full);font-size:var(--font-size-xs);font-weight:600}
.badge--blue{background:#eff6ff;color:#2563eb}
.badge--pink{background:#fdf2f8;color:#db2777}

.td-actions{text-align:right;white-space:nowrap}
.text-btn{padding:4px 10px;border-radius:var(--radius-sm);font-size:var(--font-size-xs);font-weight:600;transition:all var(--transition-fast);display:inline-block}
.text-btn--detail{color:#2563eb}
.text-btn--detail:hover{background:#eff6ff}
.text-btn--meridian{color:var(--brown-700)}
.text-btn--meridian:hover{background:var(--brown-50)}
.text-btn--edit{color:var(--brown-600)}
.text-btn--edit:hover{background:var(--brown-50)}
.text-btn--delete{color:var(--gray-400)}
.text-btn--delete:hover{background:#fef2f2;color:var(--danger)}

/* Pagination */
.pagination{display:flex;align-items:center;justify-content:center;gap:var(--space-1);padding:var(--space-4);border-top:1px solid var(--gray-100)}
.page-btn{min-width:36px;height:36px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-size:var(--font-size-sm);color:var(--gray-600);transition:all var(--transition-fast);border:1px solid transparent}
.page-btn:hover:not(:disabled){background:var(--brown-50);color:var(--brown-700)}
.page-btn.active{background:var(--brown-600);color:var(--white);font-weight:600}
.page-btn:disabled{opacity:.3;cursor:not-allowed}

/* Buttons */
.btn-primary{display:inline-flex;align-items:center;gap:var(--space-2);padding:10px 20px;background:linear-gradient(135deg,var(--brown-600),var(--brown-700));color:var(--white);font-size:var(--font-size-sm);font-weight:600;border-radius:var(--radius-md);transition:all var(--transition-fast)}
.btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 16px rgba(139,94,47,.3)}
.btn-primary:disabled{opacity:.7;cursor:not-allowed}
.btn-secondary{padding:10px 20px;background:var(--white);color:var(--gray-700);font-size:var(--font-size-sm);font-weight:600;border-radius:var(--radius-md);border:1px solid var(--gray-300);transition:all var(--transition-fast)}
.btn-secondary:hover{background:var(--gray-50);border-color:var(--gray-400)}
.btn-danger{padding:10px 20px;background:var(--danger);color:var(--white);font-size:var(--font-size-sm);font-weight:600;border-radius:var(--radius-md);transition:all var(--transition-fast)}
.btn-danger:hover:not(:disabled){background:#a93226;box-shadow:0 4px 12px rgba(192,57,43,.3)}
.btn-danger:disabled{opacity:.7;cursor:not-allowed}
.btn-spinner{display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:var(--white);border-radius:50%;animation:spin .7s linear infinite}

/* Modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:var(--space-4)}
.modal{background:var(--white);border-radius:var(--radius-lg);width:100%;max-width:600px;max-height:90vh;overflow-y:auto;box-shadow:var(--shadow-xl);animation:modalIn .25s ease}
.modal--sm{max-width:420px}
@keyframes modalIn{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
.modal-header{display:flex;align-items:center;justify-content:space-between;padding:var(--space-5) var(--space-6);border-bottom:1px solid var(--gray-100)}
.modal-header h3{font-size:var(--font-size-lg);font-weight:700;color:var(--black)}
.modal-close{width:32px;height:32px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;color:var(--gray-400);font-size:var(--font-size-lg);transition:all var(--transition-fast)}
.modal-close:hover{background:var(--gray-100);color:var(--gray-700)}
.modal-body{padding:var(--space-6)}
.modal-footer{display:flex;justify-content:flex-end;gap:var(--space-3);padding:var(--space-4) var(--space-6);border-top:1px solid var(--gray-100)}
.confirm-text{font-size:var(--font-size-sm);color:var(--gray-600);line-height:1.6}

/* Form */
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-4)}
.form-group{display:flex;flex-direction:column;gap:var(--space-2);margin-bottom:var(--space-4)}
.form-row .form-group{margin-bottom:0}
.form-group--sm{max-width:140px}
.form-label{font-size:var(--font-size-sm);font-weight:600;color:var(--gray-700)}
.required{color:var(--danger)}
.form-input{padding:10px 14px;border:1.5px solid var(--gray-300);border-radius:var(--radius-md);font-size:var(--font-size-sm);color:var(--black);transition:border-color var(--transition-fast),box-shadow var(--transition-fast);outline:none;background:var(--white)}
.form-input:focus{border-color:var(--brown-400);box-shadow:0 0 0 3px rgba(192,139,66,.12)}
.form-input::placeholder{color:var(--gray-400)}
.form-textarea{resize:vertical;min-height:60px}

/* Transitions */
.fade-enter-active,.fade-leave-active{transition:opacity .2s ease}
.fade-enter-from,.fade-leave-to{opacity:0}

@media(max-width:768px){
  .data-table th:nth-child(3),.data-table td:nth-child(3),
  .data-table th:nth-child(5),.data-table td:nth-child(5){display:none}
  .form-row{grid-template-columns:1fr}
  .form-group--sm{max-width:none}
  .page-header{flex-direction:column}
}
</style>
