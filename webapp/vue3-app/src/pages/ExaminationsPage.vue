<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { deleteRecord, getRecords, saveRecord } from '../services/examinationService'
import type { LegacyExam } from '../types/medical'

const records = ref<LegacyExam[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const searchText = ref('')
const deletingIds = ref<number[]>([])
const createPatientId = ref('')
const isCreating = ref(false)
const editingId = ref<number | null>(null)
const editPatientId = ref('')
const editEnvTemp = ref('')
const isUpdating = ref(false)

const filteredRecords = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  if (!keyword) return records.value
  return records.value.filter((r) => {
    return (
      String(r.phieukhamId).includes(keyword) ||
      String(r.benhnhanId).includes(keyword) ||
      String(r.ngaykham || '').toLowerCase().includes(keyword)
    )
  })
})

onMounted(async () => {
  await loadRecords()
})

async function loadRecords() {
  isLoading.value = true
  const result = await getRecords()
  isLoading.value = false
  if (!result.success || !result.data) {
    errorMessage.value = result.error?.message || 'Khong tai duoc danh sach phieu kham'
    return
  }
  errorMessage.value = ''
  records.value = result.data
}

function isDeleting(id: number): boolean {
  return deletingIds.value.includes(id)
}

function createDefaultExam(patientId: number): LegacyExam {
  return {
    phieukhamId: 0,
    benhnhanId: patientId,
    ngaykham: null,
    giokham: '',
    nhietdoMoitruong: 0,
    tieutruongTrai: 0,
    tieutruongPhai: 0,
    tamTrai: 0,
    tamPhai: 0,
    tamtieuTrai: 0,
    tamtieuPhai: 0,
    tambaoTrai: 0,
    tambaoPhai: 0,
    daitrangTrai: 0,
    daitrangPhai: 0,
    pheTrai: 0,
    phePhai: 0,
    bangquangTrai: 0,
    bangquangPhai: 0,
    thanTrai: 0,
    thanPhai: 0,
    damTrai: 0,
    damPhai: 0,
    viTrai: 0,
    viPhai: 0,
    canTrai: 0,
    canPhai: 0,
    tyTrai: 0,
    tyPhai: 0,
  }
}

async function onCreateRecord() {
  errorMessage.value = ''
  const patientId = Number(createPatientId.value)
  if (!Number.isFinite(patientId) || patientId <= 0) {
    errorMessage.value = 'Vui long nhap ma benh nhan hop le'
    return
  }

  isCreating.value = true
  const result = await saveRecord(createDefaultExam(patientId), false)
  isCreating.value = false
  if (!result.success) {
    errorMessage.value = result.error?.message || 'Tao phieu kham that bai'
    return
  }

  createPatientId.value = ''
  await loadRecords()
}

function startEditRecord(record: LegacyExam) {
  editingId.value = record.phieukhamId
  editPatientId.value = String(record.benhnhanId || '')
  editEnvTemp.value = String(record.nhietdoMoitruong ?? 0)
}

function cancelEditRecord() {
  editingId.value = null
  editPatientId.value = ''
  editEnvTemp.value = ''
}

async function onSaveRecord(record: LegacyExam) {
  const patientId = Number(editPatientId.value)
  const envTemp = Number(editEnvTemp.value || 0)
  if (!Number.isFinite(patientId) || patientId <= 0) {
    errorMessage.value = 'Vui long nhap ma benh nhan hop le'
    return
  }
  if (!Number.isFinite(envTemp)) {
    errorMessage.value = 'Nhiet do moi truong khong hop le'
    return
  }

  const payload: LegacyExam = {
    ...record,
    benhnhanId: patientId,
    nhietdoMoitruong: envTemp,
  }

  isUpdating.value = true
  const result = await saveRecord(payload, true)
  isUpdating.value = false
  if (!result.success) {
    errorMessage.value = result.error?.message || 'Cap nhat phieu kham that bai'
    return
  }

  cancelEditRecord()
  await loadRecords()
}

async function onDeleteRecord(id: number) {
  const ok = window.confirm(`Xoa phieu kham #${id}?`)
  if (!ok) return

  deletingIds.value.push(id)
  const result = await deleteRecord(id)
  deletingIds.value = deletingIds.value.filter((x) => x !== id)
  if (!result.success) {
    errorMessage.value = result.error?.message || 'Xoa phieu kham that bai'
    return
  }

  await loadRecords()
}
</script>

<template>
  <section class="page-card">
    <h2>Phieu kham</h2>
    <p v-if="isLoading">Dang tai du lieu phieu kham...</p>
    <p v-else-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    <template v-else>
      <div class="patient-create-card">
        <h3>Tao phieu kham toi thieu</h3>
        <div class="toolbar-row">
          <input v-model="createPatientId" type="number" min="1" placeholder="Nhap ma benh nhan" />
          <button class="primary-btn" type="button" :disabled="isCreating" @click="onCreateRecord">
            {{ isCreating ? 'Dang tao...' : 'Tao phieu kham' }}
          </button>
        </div>
      </div>
      <div class="toolbar-row">
        <p>Tong phieu kham: {{ filteredRecords.length }} / {{ records.length }}</p>
        <input v-model="searchText" type="text" placeholder="Tim theo ma phieu, ma BN, ngay kham" />
      </div>
      <p v-if="filteredRecords.length === 0">Khong co phieu kham phu hop.</p>
      <ul class="simple-list">
        <li v-for="record in filteredRecords.slice(0, 20)" :key="record.phieukhamId" class="patient-row">
          <template v-if="editingId === record.phieukhamId">
            <div class="patient-edit-grid">
              <input v-model="editPatientId" type="number" min="1" placeholder="Ma benh nhan" />
              <input v-model="editEnvTemp" type="number" step="0.1" placeholder="Nhiet do moi truong" />
            </div>
            <div class="row-actions">
              <button class="primary-btn" type="button" :disabled="isUpdating" @click="onSaveRecord(record)">
                {{ isUpdating ? 'Dang luu...' : 'Luu' }}
              </button>
              <button class="ghost-btn" type="button" @click="cancelEditRecord">Huy</button>
            </div>
          </template>
          <template v-else>
            <div>
              <strong>Phieu #{{ record.phieukhamId }}</strong> - BN #{{ record.benhnhanId }}
              <span v-if="record.ngaykham"> - {{ record.ngaykham }}</span>
              <span> - Nhiet do MT: {{ record.nhietdoMoitruong }}</span>
            </div>
            <div class="row-actions">
              <button class="ghost-btn" type="button" @click="startEditRecord(record)">Sua</button>
              <button
                class="danger-btn"
                type="button"
                :disabled="isDeleting(record.phieukhamId)"
                @click="onDeleteRecord(record.phieukhamId)"
              >
                {{ isDeleting(record.phieukhamId) ? 'Dang xoa...' : 'Xoa' }}
              </button>
            </div>
          </template>
        </li>
      </ul>
    </template>
  </section>
</template>
