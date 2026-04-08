<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getPatients } from '../services/patientService'
import type { LegacyPatient } from '../types/medical'

const isLoading = ref(false)
const errorMessage = ref('')
const patients = ref<LegacyPatient[]>([])

onMounted(async () => {
  isLoading.value = true
  const result = await getPatients()
  isLoading.value = false
  if (!result.success || !result.data) {
    errorMessage.value = result.error?.message ?? 'Khong tai duoc du lieu benh nhan'
    return
  }
  patients.value = result.data
})
</script>

<template>
  <section class="page-card">
    <h2>Bệnh nhân</h2>
    <p v-if="isLoading">Dang tai danh sach benh nhan...</p>
    <p v-else-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    <template v-else>
      <p>Da ket noi API typed. Tong so benh nhan: {{ patients.length }}</p>
      <ul class="simple-list">
        <li v-for="patient in patients.slice(0, 10)" :key="patient.benhnhanId">
          {{ patient.hoten || 'Khong ten' }} ({{ patient.benhnhanId }})
        </li>
      </ul>
    </template>
  </section>
</template>
