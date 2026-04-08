<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getAppointments, updateAppointmentStatus } from '../services/appointmentService'
import type { AppointmentItem } from '../types/appointment'

const items = ref<AppointmentItem[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const total = ref(0)
const updatingIds = ref<number[]>([])
const statusOptions = ['pending', 'confirmed', 'completed', 'cancelled']

function getDisplayName(row: AppointmentItem): string {
  return row.patientName || row.patient_name || row.fullName || 'Chua co ten'
}

function getDisplayPhone(row: AppointmentItem): string {
  return row.phone || row.patientPhone || ''
}

function getDisplayDate(row: AppointmentItem): string {
  return row.appointmentDate || row.appointment_date || ''
}

async function loadAppointments() {
  isLoading.value = true
  const result = await getAppointments(1, 20)
  isLoading.value = false
  if (!result.success || !result.data) {
    errorMessage.value = result.error?.message ?? 'Khong tai duoc danh sach lich hen'
    return
  }
  items.value = result.data.data
  total.value = result.data.total
}

function isUpdating(id: number): boolean {
  return updatingIds.value.includes(id)
}

async function onChangeStatus(id: number, event: Event) {
  const target = event.target as HTMLSelectElement
  const nextStatus = target.value
  if (!nextStatus) return

  updatingIds.value.push(id)
  const result = await updateAppointmentStatus(id, nextStatus)
  updatingIds.value = updatingIds.value.filter((x) => x !== id)

  if (!result.success) {
    errorMessage.value = result.error?.message || 'Cap nhat trang thai that bai'
    return
  }

  await loadAppointments()
}

onMounted(loadAppointments)
</script>

<template>
  <section class="page-card">
    <h2>Lịch hẹn</h2>
    <p v-if="isLoading">Dang tai lich hen...</p>
    <p v-else-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    <template v-else>
      <p>Tong lich hen: {{ total }}</p>
      <ul class="simple-list">
        <li v-for="row in items.slice(0, 10)" :key="row.id">
          <div class="appt-row">
            <div>
              <strong>#{{ row.id }}</strong> - {{ getDisplayName(row) }}
              <span v-if="getDisplayPhone(row)"> - {{ getDisplayPhone(row) }}</span>
              <span v-if="getDisplayDate(row)"> - {{ getDisplayDate(row) }}</span>
            </div>
            <div class="appt-actions">
              <select
                :value="row.status || 'pending'"
                :disabled="isUpdating(row.id)"
                @change="onChangeStatus(row.id, $event)"
              >
                <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>
        </li>
      </ul>
    </template>
  </section>
</template>
