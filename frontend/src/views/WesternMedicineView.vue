<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { api } from '@/services/api'

// Interfaces
interface ChungBenh {
  id: number
  ma_chung_benh: string
  ten_chung_benh: string
  mo_ta: string | null
}

interface BenhTayY {
  id: number
  ten_benh: string
  idChungBenh: number
  chungBenh: ChungBenh | null
  baiThuocList?: any[]
}

const activeTab = ref<'chung-benh' | 'benh-tay-y'>('chung-benh')
const isLoading = ref(true)
const error = ref<string | null>(null)

// Data
const chungBenhList = ref<ChungBenh[]>([])
const benhTayYList = ref<BenhTayY[]>([])

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    const [cbRes, btyRes] = await Promise.all([
      api.get<any>('/chung-benh'),
      api.get<any>('/benh-tay-y')
    ])
    
    // Handle both Array or wrapped data
    chungBenhList.value = Array.isArray(cbRes) ? cbRes : (cbRes.data || [])
    benhTayYList.value = Array.isArray(btyRes) ? btyRes : (btyRes.data || [])
    
  } catch (err: any) {
    console.error(err)
    error.value = 'Lỗi khi tải dữ liệu: ' + err.message
  } finally {
    isLoading.value = false
  }
}

// Compute map for displaying Chung Benh name in Benh Tay Y table if relations aren't joined properly
const chungBenhMap = computed(() => {
  return chungBenhList.value.reduce((acc, cb) => {
    acc[cb.id] = cb
    return acc
  }, {} as Record<number, ChungBenh>)
})

</script>

<template>
  <div class="western-medicine-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Quản Lý Bệnh Tây Y</h1>
        <p class="page-subtitle">Quản lý hệ thống phân loại chủng bệnh và bệnh lý tây y</p>
      </div>
      <div class="view-toggle">
        <button 
          class="toggle-btn" 
          :class="{ active: activeTab === 'chung-benh' }"
          @click="activeTab = 'chung-benh'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
          Chủng Bệnh
        </button>
        <button 
          class="toggle-btn" 
          :class="{ active: activeTab === 'benh-tay-y' }"
          @click="activeTab = 'benh-tay-y'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          Bệnh Tây Y
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải dữ liệu...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary mt-4" @click="fetchData">Thử lại</button>
    </div>

    <div v-else class="content-body">
      <!-- TAB CHỦNG BỆNH -->
      <div v-if="activeTab === 'chung-benh'" class="tab-content">
        <div class="data-card">
          <div class="card-header">
            <h3>Danh sách Chủng Bệnh</h3>
            <span class="badge badge-info">{{ chungBenhList.length }} chủng bệnh</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th width="80">ID</th>
                  <th width="200">Mã Chủng Bệnh</th>
                  <th>Tên Chủng Bệnh</th>
                  <th>Mô tả</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="chungBenhList.length === 0">
                  <td colspan="4" class="text-center py-8 text-gray-500">Chưa có dữ liệu chủng bệnh</td>
                </tr>
                <tr v-for="cb in chungBenhList" :key="cb.id">
                  <td>#{{ cb.id }}</td>
                  <td class="font-medium text-brown-700">{{ cb.ma_chung_benh }}</td>
                  <td class="font-bold">{{ cb.ten_chung_benh }}</td>
                  <td class="text-gray-600">{{ cb.mo_ta || 'Không có mô tả' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB BỆNH TÂY Y -->
      <div v-else class="tab-content">
        <div class="data-card">
          <div class="card-header">
            <h3>Danh sách Bệnh Tây Y</h3>
            <span class="badge badge-success">{{ benhTayYList.length }} bệnh</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th width="80">ID</th>
                  <th>Tên Bệnh</th>
                  <th>Thuộc Chủng Bệnh</th>
                  <th class="text-right">Số Bài Thuốc</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="benhTayYList.length === 0">
                  <td colspan="4" class="text-center py-8 text-gray-500">Chưa có dữ liệu bệnh tây y</td>
                </tr>
                <tr v-for="bty in benhTayYList" :key="bty.id">
                  <td>#{{ bty.id }}</td>
                  <td class="font-bold text-brown-900">{{ bty.ten_benh }}</td>
                  <td>
                    <span class="chung-benh-badge" v-if="bty.chungBenh || chungBenhMap[bty.idChungBenh]">
                      {{ bty.chungBenh?.ten_chung_benh || chungBenhMap[bty.idChungBenh]?.ten_chung_benh }}
                    </span>
                    <span class="text-gray-400 italic" v-else>Chưa phân loại</span>
                  </td>
                  <td class="text-right">
                    <span class="badge badge-default">{{ bty.baiThuocList?.length || 0 }} bài thuốc</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.western-medicine-page {
  animation: fadeIn 0.4s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 2px solid var(--brown-100);
}
.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--brown-800);
  margin-bottom: var(--space-1);
}
.page-subtitle {
  color: var(--gray-500);
  font-size: var(--font-size-md);
}

/* Toggle */
.view-toggle {
  display: flex;
  background: var(--white);
  padding: 4px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--brown-200);
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  transition: all var(--transition-base);
}
.toggle-btn:hover {
  color: var(--brown-600);
}
.toggle-btn.active {
  background: var(--brown-600);
  color: var(--white);
  box-shadow: 0 2px 4px rgba(161, 98, 7, 0.2);
}

/* Content */
.data-card {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  background: var(--brown-50);
  border-bottom: 1px solid var(--brown-100);
}
.card-header h3 {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--brown-900);
  margin: 0;
}

/* Table */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th, .data-table td {
  padding: var(--space-3) var(--space-5);
  text-align: left;
  border-bottom: 1px solid var(--gray-100);
}
.data-table th {
  background: #fdfbf9;
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.data-table tbody tr {
  transition: background 0.2s;
}
.data-table tbody tr:hover {
  background: var(--gray-50);
}
.data-table td {
  font-size: var(--font-size-md);
  color: var(--gray-800);
  vertical-align: middle;
}

/* Utils */
.text-right { text-align: right !important; }
.text-center { text-align: center !important; }
.py-8 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
.font-bold { font-weight: 700 !important; }
.font-medium { font-weight: 600 !important; }
.text-brown-700 { color: var(--brown-700) !important; }
.text-brown-900 { color: var(--brown-900) !important; }
.text-gray-600 { color: var(--gray-600) !important; }
.text-gray-500 { color: var(--gray-500) !important; }
.text-gray-400 { color: var(--gray-400) !important; }
.italic { font-style: italic !important; }

/* Badges */
.badge { display: inline-block; padding: 4px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-info { background: #e0f2fe; color: #0369a1; }
.badge-success { background: #d1fae5; color: #059669; }
.badge-default { background: #f3f4f6; color: #4b5563; }

.chung-benh-badge {
  display: inline-block;
  padding: 4px 10px;
  background: var(--brown-100);
  color: var(--brown-700);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-12) 0;
  color: var(--brown-600);
}
.error-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--danger);
  background: #fef2f2;
  border-radius: var(--radius-lg);
}
</style>
