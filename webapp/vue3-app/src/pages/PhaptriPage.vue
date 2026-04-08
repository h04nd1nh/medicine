<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { thuocService } from '../services/thuocService'
import type { PhapTri } from '../types/thuoc'

const rows = ref<PhapTri[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const editingId = ref<number | null>(null)
const chungTrang = ref('')
const nguyenTac = ref('')
const yNghia = ref('')

function resetForm() {
  editingId.value = null
  chungTrang.value = ''
  nguyenTac.value = ''
  yNghia.value = ''
}

async function loadRows() {
  isLoading.value = true
  const result = await thuocService.getPhapTri()
  isLoading.value = false
  if (!result.success || !result.data) {
    errorMessage.value = result.error?.message || 'Khong tai duoc danh sach phap tri'
    return
  }
  errorMessage.value = ''
  rows.value = result.data
}

function startEdit(row: PhapTri) {
  editingId.value = row.id
  chungTrang.value = row.chung_trang || ''
  nguyenTac.value = row.nguyen_tac || ''
  yNghia.value = row.y_nghia_co_che || ''
}

async function saveRow() {
  const payload = {
    chung_trang: chungTrang.value.trim() || null,
    nguyen_tac: nguyenTac.value.trim() || null,
    y_nghia_co_che: yNghia.value.trim() || null,
  }
  const result = editingId.value
    ? await thuocService.updatePhapTri(editingId.value, payload)
    : await thuocService.createPhapTri(payload)

  if (!result.success) {
    errorMessage.value = result.error?.message || 'Luu phap tri that bai'
    return
  }
  resetForm()
  await loadRows()
}

async function deleteRow(id: number) {
  if (!window.confirm(`Xoa phap tri #${id}?`)) return
  const result = await thuocService.deletePhapTri(id)
  if (!result.success) {
    errorMessage.value = result.error?.message || 'Xoa phap tri that bai'
    return
  }
  await loadRows()
}

onMounted(loadRows)
</script>

<template>
  <section class="page-card">
    <h2>Quản lý Pháp trị</h2>

    <div class="patient-create-card">
      <h3>{{ editingId ? 'Cap nhat phap tri' : 'Them phap tri' }}</h3>
      <div class="patient-create-grid">
        <input v-model="chungTrang" type="text" placeholder="Chung trang" />
        <input v-model="nguyenTac" type="text" placeholder="Nguyen tac" />
        <input v-model="yNghia" type="text" placeholder="Y nghia co che" style="grid-column: span 2" />
      </div>
      <div class="row-actions">
        <button class="primary-btn" type="button" @click="saveRow">{{ editingId ? 'Luu' : 'Them' }}</button>
        <button v-if="editingId" class="ghost-btn" type="button" @click="resetForm">Huy</button>
      </div>
    </div>

    <p v-if="isLoading">Dang tai du lieu phap tri...</p>
    <p v-else-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    <ul v-else class="simple-list">
      <li v-for="row in rows" :key="row.id" class="patient-row">
        <div>
          <strong>#{{ row.id }}</strong>
          <span v-if="row.chung_trang"> - {{ row.chung_trang }}</span>
          <span v-if="row.nguyen_tac"> - {{ row.nguyen_tac }}</span>
        </div>
        <div class="row-actions">
          <button class="ghost-btn" type="button" @click="startEdit(row)">Sua</button>
          <button class="danger-btn" type="button" @click="deleteRow(row.id)">Xoa</button>
        </div>
      </li>
    </ul>
  </section>
</template>
