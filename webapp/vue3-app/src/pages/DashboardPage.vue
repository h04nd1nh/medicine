<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getPatients } from '../services/patientService'
import { getRecords } from '../services/examinationService'

const patientCount = ref(0)
const recordCount = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  isLoading.value = true
  const [patientsResult, recordsResult] = await Promise.all([getPatients(), getRecords()])
  isLoading.value = false

  if (!patientsResult.success || !patientsResult.data) {
    errorMessage.value = patientsResult.error?.message ?? 'Khong tai duoc du lieu benh nhan'
    return
  }
  if (!recordsResult.success || !recordsResult.data) {
    errorMessage.value = recordsResult.error?.message ?? 'Khong tai duoc du lieu phieu kham'
    return
  }

  patientCount.value = patientsResult.data.length
  recordCount.value = recordsResult.data.length
})
</script>

<template>
  <section class="page-card">
    <h2>Dashboard</h2>
    <p v-if="isLoading">Dang tai du lieu dashboard...</p>
    <p v-else-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    <div v-else class="dashboard-grid-vue">
      <div class="stat-box">
        <span>Benh nhan</span>
        <strong>{{ patientCount }}</strong>
      </div>
      <div class="stat-box">
        <span>Phieu kham</span>
        <strong>{{ recordCount }}</strong>
      </div>
    </div>
  </section>
</template>
