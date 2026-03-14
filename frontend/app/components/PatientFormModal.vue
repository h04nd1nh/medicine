<script setup lang="ts">
import type { CreatePatientDto, Patient } from '~/composables/usePatients'

const props = defineProps<{
  open: boolean
  patient?: Patient // nếu có → edit mode
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const { create, update } = usePatients()
const isEditMode = computed(() => !!props.patient)

const PROVINCES = [
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cần Thơ', 'Cao Bằng', 'Đà Nẵng',
  'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp',
  'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Nội', 'Hà Tĩnh',
  'Hải Dương', 'Hải Phòng', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên',
  'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng',
  'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An',
  'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên', 'Quảng Bình',
  'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng',
  'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hóa',
  'Thừa Thiên Huế', 'Tiền Giang', 'TP. Hồ Chí Minh', 'Trà Vinh',
  'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
]

const defaultForm = (): CreatePatientDto => ({
  fullName: '',
  gender: 'Nam',
  dateOfBirth: '',
  timeOfBirth: '',
  address: '',
  province: '',
  phone: '',
  medicalHistory: '',
  notes: ''
})

const form = reactive(defaultForm())
const isLoading = ref(false)
const errorMsg = ref('')

const fillForm = (p?: Patient) => {
  if (p) {
    form.fullName = p.fullName
    form.gender = p.gender
    form.dateOfBirth = p.dateOfBirth ?? ''
    form.timeOfBirth = p.timeOfBirth ?? ''
    form.address = p.address ?? ''
    form.province = p.province ?? ''
    form.phone = p.phone ?? ''
    form.medicalHistory = p.medicalHistory ?? ''
    form.notes = p.notes ?? ''
  }
  else {
    Object.assign(form, defaultForm())
  }
  errorMsg.value = ''
}

watch(() => props.open, (val) => {
  if (val) fillForm(props.patient)
})

const handleClose = () => emit('close')

const handleSubmit = async () => {
  if (!form.fullName.trim()) {
    errorMsg.value = 'Vui lòng nhập họ tên bệnh nhân.'
    return
  }
  errorMsg.value = ''
  isLoading.value = true
  try {
    if (isEditMode.value && props.patient) {
      await update(props.patient.id, { ...form })
    }
    else {
      await create({ ...form })
    }
    emit('saved')
    handleClose()
  }
  catch {
    errorMsg.value = 'Có lỗi xảy ra. Vui lòng thử lại.'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="handleClose">
        <div class="modal-panel" role="dialog" aria-modal="true">
          <!-- Header -->
          <div class="modal-header">
            <div class="modal-header-icon" :class="{ 'modal-header-icon--edit': isEditMode }">
              <UIcon :name="isEditMode ? 'i-lucide-user-pen' : 'i-lucide-user-plus'" />
            </div>
            <h2 class="modal-title">
              {{ isEditMode ? 'Chỉnh sửa hồ sơ bệnh nhân' : 'Hồ sơ bệnh nhân mới' }}
            </h2>
            <button class="modal-close" aria-label="Đóng" @click="handleClose">
              <UIcon name="i-lucide-x" />
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <!-- Họ tên -->
            <div class="form-row">
              <div class="form-group form-group--full">
                <label class="form-label form-label--required">Họ tên</label>
                <input
                  v-model="form.fullName"
                  class="form-input"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  autocomplete="off"
                >
              </div>
            </div>

            <!-- Giới tính + Ngày sinh + Giờ sinh -->
            <div class="form-row form-row--cols">
              <div class="form-group">
                <label class="form-label">Giới tính</label>
                <div class="gender-toggle">
                  <button
                    class="gender-btn"
                    :class="{ 'gender-btn--active': form.gender === 'Nam' }"
                    type="button"
                    @click="form.gender = 'Nam'"
                  >
                    <UIcon name="i-lucide-user" class="gender-icon" /> Nam
                  </button>
                  <button
                    class="gender-btn"
                    :class="{ 'gender-btn--active gender-btn--female': form.gender === 'Nữ' }"
                    type="button"
                    @click="form.gender = 'Nữ'"
                  >
                    <UIcon name="i-lucide-user-round" class="gender-icon" /> Nữ
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Ngày sinh</label>
                <input v-model="form.dateOfBirth" class="form-input" type="date">
              </div>
              <div class="form-group">
                <label class="form-label">Giờ sinh</label>
                <input v-model="form.timeOfBirth" class="form-input" type="time">
              </div>
            </div>

            <!-- Địa chỉ -->
            <div class="form-row">
              <div class="form-group form-group--full">
                <label class="form-label">Địa chỉ</label>
                <textarea v-model="form.address" class="form-textarea" rows="2" placeholder="Số nhà, đường, phường/xã, quận/huyện..." />
              </div>
            </div>

            <!-- Tỉnh + SĐT -->
            <div class="form-row form-row--cols">
              <div class="form-group form-group--wide">
                <label class="form-label">Thuộc tỉnh</label>
                <div class="select-wrap">
                  <select v-model="form.province" class="form-select">
                    <option value="">-- Chọn tỉnh/thành phố --</option>
                    <option v-for="p in PROVINCES" :key="p" :value="p">{{ p }}</option>
                  </select>
                  <UIcon name="i-lucide-chevron-down" class="select-arrow" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Điện thoại</label>
                <input v-model="form.phone" class="form-input" type="tel" placeholder="0900 000 000">
              </div>
            </div>

            <!-- Bệnh sử -->
            <div class="form-row">
              <div class="form-group form-group--full">
                <label class="form-label">Bệnh sử</label>
                <textarea v-model="form.medicalHistory" class="form-textarea" rows="3" placeholder="Các bệnh đã và đang mắc, thuốc đang dùng..." />
              </div>
            </div>

            <!-- Ghi chú -->
            <div class="form-row">
              <div class="form-group form-group--full">
                <label class="form-label">Ghi chú</label>
                <textarea v-model="form.notes" class="form-textarea" rows="2" placeholder="Thông tin bổ sung..." />
              </div>
            </div>

            <!-- Error -->
            <Transition name="fade">
              <div v-if="errorMsg" class="error-msg">
                <UIcon name="i-lucide-alert-circle" class="error-icon" />
                {{ errorMsg }}
              </div>
            </Transition>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button class="btn-cancel" type="button" @click="handleClose">Hủy</button>
            <button class="btn-save" type="button" :disabled="isLoading" @click="handleSubmit">
              <span v-if="isLoading" class="btn-loading">
                <UIcon name="i-lucide-loader-2" class="animate-spin" /> Đang lưu...
              </span>
              <span v-else class="btn-loading">
                <UIcon :name="isEditMode ? 'i-lucide-check' : 'i-lucide-save'" class="btn-icon-sm" />
                {{ isEditMode ? 'Cập nhật' : 'Lưu hồ sơ' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(3px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-panel {
  background: #ffffff;
  border-radius: 20px;
  width: 100%;
  max-width: 620px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1565c0, #1e88e5);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.modal-header-icon--edit {
  background: linear-gradient(135deg, #0277bd, #29b6f6);
}

.modal-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a2332;
  margin: 0;
  flex: 1;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: transparent;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.modal-close:hover { background: #f1f5f9; color: #1a2332; }

/* Body */
.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Form */
.form-row { display: flex; gap: 14px; }
.form-row--cols { flex-wrap: wrap; }
.form-group { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 140px; }
.form-group--full { flex: 1 1 100%; }
.form-group--wide { flex: 2; }

.form-label { font-size: 0.8rem; font-weight: 600; color: #374151; }
.form-label--required::after { content: ' *'; color: #dc2626; }

.form-input,
.form-select,
.form-textarea {
  padding: 9px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  color: #1a2332;
  background: #f8fafc;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #1e88e5;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
}

.form-input::placeholder,
.form-textarea::placeholder { color: #9ca3af; }
.form-textarea { resize: vertical; min-height: 64px; }
.form-select { appearance: none; cursor: pointer; }

.select-wrap { position: relative; }
.select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #94a3b8;
  pointer-events: none;
}

/* Gender */
.gender-toggle { display: flex; gap: 6px; }
.gender-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s;
}
.gender-btn:hover { border-color: #1e88e5; color: #1e88e5; }
.gender-btn--active { background: #1e88e5; border-color: #1e88e5; color: #ffffff; }
.gender-btn--female.gender-btn--active { background: #e91e8c; border-color: #e91e8c; }
.gender-icon { width: 15px; height: 15px; }

/* Error */
.error-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #dc2626;
  font-size: 0.85rem;
}
.error-icon { width: 16px; height: 16px; flex-shrink: 0; }

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.btn-cancel {
  padding: 9px 18px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: transparent;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.btn-cancel:hover { background: #f1f5f9; border-color: #cbd5e1; }

.btn-save {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 22px;
  background: linear-gradient(135deg, #1565c0, #1e88e5);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(21, 101, 192, 0.3);
  transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
}
.btn-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(21, 101, 192, 0.4); }
.btn-save:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-icon-sm { width: 15px; height: 15px; }
.btn-loading { display: flex; align-items: center; gap: 7px; }

/* Transitions */
.modal-enter-active, .modal-leave-active { transition: opacity 0.22s ease; }
.modal-enter-active .modal-panel, .modal-leave-active .modal-panel { transition: transform 0.22s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-panel, .modal-leave-to .modal-panel { transform: scale(0.95) translateY(12px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
