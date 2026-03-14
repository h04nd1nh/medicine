<script setup lang="ts">
import type { Patient } from '~/composables/usePatients'
import type { Examination, CreateExaminationDto } from '~/composables/useExaminations'

const route = useRoute()
const patientId = Number(route.params.patientId)

const { fetchOne: fetchPatient } = usePatients()
const { create: createExamination } = useExaminations()

const patient = ref<Patient | null>(null)
const isLoadingPatient = ref(true)
const isSubmitting = ref(false)
const errorMsg = ref('')
const result = ref<Examination | null>(null)

const loadPatient = async () => {
  isLoadingPatient.value = true
  try {
    patient.value = await fetchPatient(patientId)
  }
  catch {
    patient.value = null
  }
  finally {
    isLoadingPatient.value = false
  }
}

await loadPatient()

useSeoMeta({
  title: computed(() => patient.value ? `Khám bệnh - ${patient.value.fullName} | Hệ thống Y tế` : 'Khám bệnh | Hệ thống Y tế'),
  description: 'Khám và phân tích kinh lạc bệnh nhân'
})

const CHANNEL_GROUPS = [
  {
    title: 'Kinh tay (Chi trên)',
    channels: [
      { key: 'tieutruong', label: 'Tiểu trường' },
      { key: 'tam', label: 'Tâm' },
      { key: 'tamtieu', label: 'Tam tiêu' },
      { key: 'tambao', label: 'Tâm bào' },
      { key: 'daitrang', label: 'Đại tràng' },
      { key: 'phe', label: 'Phế' }
    ]
  },
  {
    title: 'Kinh chân (Chi dưới)',
    channels: [
      { key: 'bangquang', label: 'Bàng quang' },
      { key: 'than', label: 'Thận' },
      { key: 'dam', label: 'Đảm' },
      { key: 'vi', label: 'Vị' },
      { key: 'can', label: 'Can' },
      { key: 'ty', label: 'Tỳ' }
    ]
  }
]

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

const form = reactive<Record<string, number | string>>({
  tieutruongtrai: 0, tieutruongphai: 0,
  tamtrai: 0, tamphai: 0,
  tamtieutrai: 0, tamtieuphai: 0,
  tambaotrai: 0, tambaophai: 0,
  daitrangtrai: 0, daitrangphai: 0,
  phetrai: 0, phephai: 0,
  bangquangtrai: 0, bangquangphai: 0,
  thantrai: 0, thanphai: 0,
  damtrai: 0, damphai: 0,
  vitrai: 0, viphai: 0,
  cantrai: 0, canphai: 0,
  tytrai: 0, typhai: 0,
  notes: ''
})

const handleSubmit = async () => {
  errorMsg.value = ''
  isSubmitting.value = true
  result.value = null

  try {
    const dto: CreateExaminationDto = {
      patientId,
      notes: (form.notes as string) || undefined,
      tieutruongtrai: Number(form.tieutruongtrai),
      tieutruongphai: Number(form.tieutruongphai),
      tamtrai: Number(form.tamtrai),
      tamphai: Number(form.tamphai),
      tamtieutrai: Number(form.tamtieutrai),
      tamtieuphai: Number(form.tamtieuphai),
      tambaotrai: Number(form.tambaotrai),
      tambaophai: Number(form.tambaophai),
      daitrangtrai: Number(form.daitrangtrai),
      daitrangphai: Number(form.daitrangphai),
      phetrai: Number(form.phetrai),
      phephai: Number(form.phephai),
      bangquangtrai: Number(form.bangquangtrai),
      bangquangphai: Number(form.bangquangphai),
      thantrai: Number(form.thantrai),
      thanphai: Number(form.thanphai),
      damtrai: Number(form.damtrai),
      damphai: Number(form.damphai),
      vitrai: Number(form.vitrai),
      viphai: Number(form.viphai),
      cantrai: Number(form.cantrai),
      canphai: Number(form.canphai),
      tytrai: Number(form.tytrai),
      typhai: Number(form.typhai),
    }
    result.value = await createExamination(dto)
  }
  catch {
    errorMsg.value = 'Có lỗi xảy ra khi phân tích. Vui lòng thử lại.'
  }
  finally {
    isSubmitting.value = false
  }
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
  <div class="examine-page">
    <!-- Loading -->
    <div v-if="isLoadingPatient" class="loading-state">
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
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <NuxtLink :to="`/patients/${patient.id}`" class="back-btn">
            <UIcon name="i-lucide-arrow-left" />
          </NuxtLink>
          <div class="header-info">
            <div class="patient-avatar">{{ patient.fullName.charAt(0) }}</div>
            <div>
              <h1 class="page-title">Khám bệnh</h1>
              <p class="page-subtitle">{{ patient.fullName }} · {{ patient.gender }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Form -->
      <div v-if="!result" class="form-section">
        <div v-for="(group, gIdx) in CHANNEL_GROUPS" :key="group.title" class="input-table-card">
          <div class="input-table-header">
            <div class="input-table-header-left">
              <UIcon name="i-lucide-activity" class="input-table-icon" />
              <h2 class="input-table-title">{{ group.title }}</h2>
            </div>
            <span class="input-table-hint">{{ gIdx === 0 ? '6 kinh' : '6 kinh' }}</span>
          </div>
          <table class="input-table">
            <thead>
              <tr>
                <th class="col-stt">#</th>
                <th class="col-name">Kinh</th>
                <th class="col-val">Trái</th>
                <th class="col-val">Phải</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ch, idx) in group.channels" :key="ch.key">
                <td class="cell-stt">{{ gIdx * 6 + idx + 1 }}</td>
                <td class="cell-channel">{{ ch.label }}</td>
                <td class="cell-input">
                  <input
                    v-model.number="form[`${ch.key}trai`]"
                    class="ch-input"
                    type="number"
                    min="0"
                    step="1"
                    @focus="($event.target as HTMLInputElement).select()"
                  >
                </td>
                <td class="cell-input">
                  <input
                    v-model.number="form[`${ch.key}phai`]"
                    class="ch-input"
                    type="number"
                    min="0"
                    step="1"
                    @focus="($event.target as HTMLInputElement).select()"
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Notes -->
        <div class="notes-card">
          <label class="form-label">
            <UIcon name="i-lucide-notebook-pen" class="notes-icon" />
            Ghi chú
          </label>
          <textarea
            v-model="form.notes"
            class="form-textarea"
            rows="2"
            placeholder="Ghi chú thêm cho ca khám này..."
          />
        </div>

        <!-- Error -->
        <Transition name="fade">
          <div v-if="errorMsg" class="error-msg">
            <UIcon name="i-lucide-alert-circle" class="error-icon" />
            {{ errorMsg }}
          </div>
        </Transition>

        <!-- Submit -->
        <div class="submit-bar">
          <NuxtLink :to="`/patients/${patient.id}`" class="btn-cancel">Hủy</NuxtLink>
          <button class="btn-submit" :disabled="isSubmitting" @click="handleSubmit">
            <span v-if="isSubmitting" class="btn-loading">
              <UIcon name="i-lucide-loader-2" class="animate-spin" /> Đang phân tích...
            </span>
            <span v-else class="btn-loading">
              <UIcon name="i-lucide-scan-search" class="btn-icon" />
              Phân tích & Lưu kết quả
            </span>
          </button>
        </div>
      </div>

      <!-- Results -->
      <div v-else class="results-section">
        <!-- Summary -->
        <div class="result-header">
          <UIcon name="i-lucide-check-circle" class="result-header-icon" />
          <h2 class="result-header-title">Kết quả phân tích</h2>
          <span class="result-date">{{ new Date(result.createdAt).toLocaleString('vi-VN') }}</span>
        </div>

        <!-- Status cards -->
        <div class="status-grid">
          <div class="status-card">
            <span class="status-label">Âm - Dương</span>
            <span class="status-value" :class="statusClass(result.amDuong)">{{ result.amDuong }}</span>
          </div>
          <div class="status-card">
            <span class="status-label">Khí</span>
            <span class="status-value" :class="statusClass(result.khi)">{{ result.khi }}</span>
          </div>
          <div class="status-card">
            <span class="status-label">Huyết</span>
            <span class="status-value" :class="statusClass(result.huyet)">{{ result.huyet }}</span>
          </div>
        </div>

        <!-- Flags table -->
        <div class="table-card">
          <div class="table-card-header">
            <UIcon name="i-lucide-table-2" class="card-header-icon" />
            <h3 class="card-title">Chi tiết kinh lạc</h3>
          </div>
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
              <tr v-for="flag in result.flags" :key="flag.channelIndex">
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
        </div>

        <!-- Syndromes -->
        <div v-if="result.syndromes.length > 0" class="table-card">
          <div class="table-card-header">
            <UIcon name="i-lucide-stethoscope" class="card-header-icon" />
            <h3 class="card-title">Hội chứng phù hợp ({{ result.syndromes.length }})</h3>
          </div>
          <div class="syndromes-list">
            <div v-for="(syn, idx) in result.syndromes" :key="idx" class="syndrome-item">
              <div class="syndrome-header">
                <span class="syndrome-index">#{{ idx + 1 }}</span>
                <span v-if="syn.tieuket" class="syndrome-name">{{ syn.tieuket }}</span>
              </div>
              <div v-if="syn.trieuchung" class="syndrome-row">
                <span class="syndrome-label">Triệu chứng:</span>
                <span class="syndrome-text">{{ syn.trieuchung }}</span>
              </div>
              <div v-if="syn.benhly" class="syndrome-row">
                <span class="syndrome-label">Bệnh lý:</span>
                <span class="syndrome-text">{{ syn.benhly }}</span>
              </div>
              <div v-if="syn.phuyet_chamcuu" class="syndrome-row">
                <span class="syndrome-label">Phụ huyệt châm cứu:</span>
                <span class="syndrome-text">{{ syn.phuyet_chamcuu }}</span>
              </div>
              <div v-if="syn.giainghia_phuyet" class="syndrome-row">
                <span class="syndrome-label">Giải nghĩa phụ huyệt:</span>
                <span class="syndrome-text">{{ syn.giainghia_phuyet }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-syndromes">
          <UIcon name="i-lucide-info" class="info-icon" />
          <span>Không tìm thấy hội chứng phù hợp với các chỉ số đã nhập.</span>
        </div>

        <!-- Notes -->
        <div v-if="result.notes" class="result-notes">
          <span class="notes-label">Ghi chú:</span> {{ result.notes }}
        </div>

        <!-- Actions -->
        <div class="result-actions">
          <button class="btn-new" @click="result = null">
            <UIcon name="i-lucide-plus" class="btn-icon" />
            Khám mới
          </button>
          <NuxtLink :to="`/patients/${patient.id}`" class="btn-back">
            <UIcon name="i-lucide-arrow-left" class="btn-icon" />
            Quay lại hồ sơ
          </NuxtLink>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.examine-page {
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

/* ─── Input table cards ─── */
.form-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  align-items: start;
}

.input-table-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(226, 232, 240, 0.8);
  overflow: hidden;
}

.input-table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.input-table-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-table-icon {
  width: 20px;
  height: 20px;
  color: #1e88e5;
}

.input-table-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a2332;
  margin: 0;
}

.input-table-hint {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 500;
}

.input-table {
  width: 100%;
  border-collapse: collapse;
}

.input-table th {
  padding: 10px 16px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: center;
  border-bottom: 1px solid #f1f5f9;
}

.col-stt { width: 40px; text-align: center !important; }
.col-name { text-align: left !important; }
.col-val { width: 100px; }

.input-table td {
  padding: 0;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.input-table tr:last-child td { border-bottom: none; }

.input-table tr:hover { background: #f8fcff; }

.cell-stt {
  text-align: center;
  font-size: 0.78rem;
  font-weight: 600;
  color: #94a3b8;
  padding: 10px 0 !important;
}

.cell-channel {
  padding: 10px 16px !important;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a2332;
}

.cell-input {
  padding: 6px 8px !important;
}

.ch-input {
  width: 100%;
  padding: 8px 6px;
  border: 1.5px solid transparent;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1a2332;
  background: transparent;
  outline: none;
  text-align: center;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  -moz-appearance: textfield;
}

.ch-input::-webkit-inner-spin-button,
.ch-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.ch-input:hover {
  background: #f1f5f9;
}

.ch-input:focus {
  border-color: #1e88e5;
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(30, 136, 229, 0.15);
}

/* ─── Notes ─── */
.notes-card {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.notes-icon {
  width: 15px;
  height: 15px;
  color: #94a3b8;
}

.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.875rem;
  color: #1a2332;
  background: #ffffff;
  outline: none;
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-textarea:focus {
  border-color: #1e88e5;
  box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
}

/* ─── Error ─── */
.error-msg {
  grid-column: 1 / -1;
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

/* ─── Submit ─── */
.submit-bar {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 4px;
}

.btn-cancel {
  display: flex;
  align-items: center;
  padding: 11px 22px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  background: transparent;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.18s;
}

.btn-cancel:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.btn-submit {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #1565c0, #1e88e5);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(21, 101, 192, 0.3);
  transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(21, 101, 192, 0.4);
}

.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-icon { width: 18px; height: 18px; }
.btn-loading { display: flex; align-items: center; gap: 8px; }

/* ─── Results ─── */
.results-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: #e8f5e9;
  border-radius: 14px;
  border: 1px solid #c8e6c9;
}

.result-header-icon {
  width: 22px;
  height: 22px;
  color: #2e7d32;
}

.result-header-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1b5e20;
  margin: 0;
  flex: 1;
}

.result-date {
  font-size: 0.78rem;
  color: #4caf50;
}

/* ─── Status cards ─── */
.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.status-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 20px;
  text-align: center;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.status-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.status-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
}

.status--ok { color: #2e7d32; }
.status--warn { color: #e65100; }

/* ─── Flags table ─── */
.table-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(226, 232, 240, 0.8);
  overflow: hidden;
}

.table-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.card-header-icon { width: 18px; height: 18px; color: #1e88e5; }

.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a2332;
  margin: 0;
}

.flags-table {
  width: 100%;
  border-collapse: collapse;
}

.flags-table th {
  padding: 10px 14px;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0;
}

.flags-table th:first-child { text-align: left; }

.flags-table td {
  padding: 10px 14px;
  text-align: center;
  font-size: 0.85rem;
  color: #374151;
  border-bottom: 1px solid #f1f5f9;
}

.flags-table tr:last-child td { border-bottom: none; }
.cell-name { text-align: left !important; font-weight: 500; color: #1a2332; }

.flag-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.flag--normal { background: #f1f5f9; color: #64748b; }
.flag--high { background: #fff3e0; color: #e65100; }
.flag--low { background: #e3f2fd; color: #1565c0; }

/* ─── Syndromes ─── */
.syndromes-list {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.syndrome-item {
  padding: 14px 16px;
  background: #fafbfc;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}

.syndrome-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.syndrome-index {
  background: #1e88e5;
  color: #fff;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  flex-shrink: 0;
}

.syndrome-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a2332;
}

.syndrome-row {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-size: 0.83rem;
  line-height: 1.6;
}

.syndrome-label {
  font-weight: 600;
  color: #64748b;
  flex-shrink: 0;
  min-width: 150px;
}

.syndrome-text {
  color: #374151;
}

.no-syndromes {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 20px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 14px;
  color: #92400e;
  font-size: 0.85rem;
}

.info-icon { width: 18px; height: 18px; flex-shrink: 0; }

.result-notes {
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #374151;
}

.notes-label { font-weight: 600; color: #64748b; }

/* ─── Result actions ─── */
.result-actions {
  display: flex;
  gap: 12px;
}

.btn-new {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
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

.btn-new:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(21, 101, 192, 0.4);
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  text-decoration: none;
  transition: all 0.18s;
}

.btn-back:hover {
  border-color: #1e88e5;
  color: #1e88e5;
  background: #f0f7ff;
}

/* ─── Transitions ─── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 900px) {
  .form-section { grid-template-columns: 1fr; }
  .status-grid { grid-template-columns: 1fr; }
}
</style>
