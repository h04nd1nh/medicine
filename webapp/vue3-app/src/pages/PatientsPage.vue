<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { addPatient, deletePatient, getPatients, updatePatient } from '../services/patientService'
import type { LegacyPatient } from '../types/medical'

const isLoading = ref(false)
const errorMessage = ref('')
const patients = ref<LegacyPatient[]>([])
const searchText = ref('')
const deletingIds = ref<number[]>([])
const isCreating = ref(false)
const formName = ref('')
const formGender = ref('')
const formPhone = ref('')
const formAddress = ref('')
const editingId = ref<number | null>(null)
const editName = ref('')
const editGender = ref('')
const editPhone = ref('')
const editAddress = ref('')
const isUpdating = ref(false)
const currentPage = ref(1)
const pageSize = 10

const filteredPatients = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  if (!keyword) return patients.value
  return patients.value.filter((p) => {
    const name = (p.hoten || '').toLowerCase()
    const id = String(p.benhnhanId || '')
    const phone = (p.dienthoai || '').toLowerCase()
    return name.includes(keyword) || id.includes(keyword) || phone.includes(keyword)
  })
})

const totalPages = computed(() => {
  const total = Math.ceil(filteredPatients.value.length / pageSize)
  return total > 0 ? total : 1
})

const pagedPatients = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredPatients.value.slice(start, start + pageSize)
})

function isDeleting(id: number): boolean {
  return deletingIds.value.includes(id)
}

async function loadPatients() {
  isLoading.value = true
  const result = await getPatients()
  isLoading.value = false
  if (!result.success || !result.data) {
    errorMessage.value = result.error?.message ?? 'Khong tai duoc du lieu benh nhan'
    return
  }
  patients.value = result.data
  if (currentPage.value > totalPages.value) currentPage.value = 1
}

async function onDeletePatient(id: number) {
  const ok = window.confirm(`Xoa benh nhan #${id}?`)
  if (!ok) return

  deletingIds.value.push(id)
  const result = await deletePatient(id)
  deletingIds.value = deletingIds.value.filter((x) => x !== id)
  if (!result.success) {
    errorMessage.value = result.error?.message || 'Xoa benh nhan that bai'
    return
  }
  await loadPatients()
}

async function onCreatePatient() {
  errorMessage.value = ''
  const payload: LegacyPatient = {
    benhnhanId: 0,
    hoten: formName.value.trim(),
    gioitinh: formGender.value.trim(),
    ngaysinh: null,
    giosinh: null,
    diachi: formAddress.value.trim() || null,
    tinhthanhId: null,
    dienthoai: formPhone.value.trim() || null,
    benhsu: null,
    ghichu: null,
    cmnd: null,
  }
  if (!payload.hoten) {
    errorMessage.value = 'Vui long nhap ho ten benh nhan'
    return
  }

  isCreating.value = true
  const result = await addPatient(payload)
  isCreating.value = false
  if (!result.success) {
    errorMessage.value = result.error?.message || 'Tao benh nhan that bai'
    return
  }

  formName.value = ''
  formGender.value = ''
  formPhone.value = ''
  formAddress.value = ''
  currentPage.value = 1
  await loadPatients()
}

function startEdit(patient: LegacyPatient) {
  editingId.value = patient.benhnhanId
  editName.value = patient.hoten || ''
  editGender.value = patient.gioitinh || ''
  editPhone.value = patient.dienthoai || ''
  editAddress.value = patient.diachi || ''
}

function cancelEdit() {
  editingId.value = null
  editName.value = ''
  editGender.value = ''
  editPhone.value = ''
  editAddress.value = ''
}

async function onSaveEdit(patient: LegacyPatient) {
  if (!editName.value.trim()) {
    errorMessage.value = 'Vui long nhap ho ten benh nhan'
    return
  }

  const payload: LegacyPatient = {
    ...patient,
    hoten: editName.value.trim(),
    gioitinh: editGender.value.trim(),
    dienthoai: editPhone.value.trim() || null,
    diachi: editAddress.value.trim() || null,
  }

  isUpdating.value = true
  const result = await updatePatient(payload)
  isUpdating.value = false
  if (!result.success) {
    errorMessage.value = result.error?.message || 'Cap nhat benh nhan that bai'
    return
  }

  cancelEdit()
  await loadPatients()
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value -= 1
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

onMounted(loadPatients)
</script>

<template>
  <section class="page-card">
    <h2>Bệnh nhân</h2>
    <p v-if="isLoading">Dang tai danh sach benh nhan...</p>
    <p v-else-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    <template v-else>
      <div class="patient-create-card">
        <h3>Them benh nhan moi</h3>
        <div class="patient-create-grid">
          <input v-model="formName" type="text" placeholder="Ho ten" />
          <input v-model="formGender" type="text" placeholder="Gioi tinh" />
          <input v-model="formPhone" type="text" placeholder="Dien thoai" />
          <input v-model="formAddress" type="text" placeholder="Dia chi" />
        </div>
        <button class="primary-btn" type="button" :disabled="isCreating" @click="onCreatePatient">
          {{ isCreating ? 'Dang tao...' : 'Them benh nhan' }}
        </button>
      </div>

      <div class="toolbar-row">
        <p>Tong benh nhan: {{ filteredPatients.length }} / {{ patients.length }}</p>
        <input v-model="searchText" type="text" placeholder="Tim theo ten, ma BN, so dien thoai" />
      </div>
      <p v-if="filteredPatients.length === 0">Khong co du lieu phu hop.</p>
      <ul class="simple-list">
        <li v-for="patient in pagedPatients" :key="patient.benhnhanId" class="patient-row">
          <template v-if="editingId === patient.benhnhanId">
            <div class="patient-edit-grid">
              <input v-model="editName" type="text" placeholder="Ho ten" />
              <input v-model="editGender" type="text" placeholder="Gioi tinh" />
              <input v-model="editPhone" type="text" placeholder="Dien thoai" />
              <input v-model="editAddress" type="text" placeholder="Dia chi" />
            </div>
            <div class="row-actions">
              <button class="primary-btn" type="button" :disabled="isUpdating" @click="onSaveEdit(patient)">
                {{ isUpdating ? 'Dang luu...' : 'Luu' }}
              </button>
              <button class="ghost-btn" type="button" @click="cancelEdit">Huy</button>
            </div>
          </template>
          <template v-else>
            <div>
              <strong>{{ patient.hoten || 'Khong ten' }}</strong> (#{{ patient.benhnhanId }})
              <span v-if="patient.dienthoai"> - {{ patient.dienthoai }}</span>
            </div>
            <div class="row-actions">
              <button class="ghost-btn" type="button" @click="startEdit(patient)">Sua</button>
              <button
                class="danger-btn"
                type="button"
                :disabled="isDeleting(patient.benhnhanId)"
                @click="onDeletePatient(patient.benhnhanId)"
              >
                {{ isDeleting(patient.benhnhanId) ? 'Dang xoa...' : 'Xoa' }}
              </button>
            </div>
          </template>
        </li>
      </ul>
      <div class="pagination-row">
        <button class="ghost-btn" type="button" :disabled="currentPage <= 1" @click="prevPage">Truoc</button>
        <span>Trang {{ currentPage }} / {{ totalPages }}</span>
        <button class="ghost-btn" type="button" :disabled="currentPage >= totalPages" @click="nextPage">Sau</button>
      </div>
    </template>
  </section>
</template>
