<script setup lang="ts">
</script>

<template>
  <div class="patients-page">
    <div class="page-header">
      <div>
        <h2 class="page-heading">Danh sách bệnh nhân</h2>
        <p class="page-description">Quản lý thông tin bệnh nhân của phòng khám</p>
      </div>
      <button class="btn-primary">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
        </svg>
        <span>Thêm bệnh nhân</span>
      </button>
    </div>

    <!-- Empty state -->
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
        </svg>
      </div>
      <h3 class="empty-title">Chưa có bệnh nhân</h3>
      <p class="empty-text">Bắt đầu thêm bệnh nhân mới để quản lý thông tin.</p>
    </div>
  </div>
</template>

<style scoped>
.patients-page{max-width:1200px;animation:fadeIn .4s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:var(--space-8);gap:var(--space-4);flex-wrap:wrap}
.page-heading{font-size:var(--font-size-xl);font-weight:700;color:var(--black);margin-bottom:var(--space-1)}
.page-description{font-size:var(--font-size-sm);color:var(--gray-500)}

.btn-primary{display:inline-flex;align-items:center;gap:var(--space-2);padding:10px 20px;background:linear-gradient(135deg,var(--brown-600),var(--brown-700));color:var(--white);font-size:var(--font-size-sm);font-weight:600;border-radius:var(--radius-md);transition:all var(--transition-fast)}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(139,94,47,.3)}
.btn-primary:active{transform:translateY(0)}

.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--space-16) var(--space-8);text-align:center}
.empty-icon{width:100px;height:100px;border-radius:50%;background:var(--brown-50);color:var(--brown-300);display:flex;align-items:center;justify-content:center;margin-bottom:var(--space-6)}
.empty-title{font-size:var(--font-size-lg);font-weight:700;color:var(--gray-700);margin-bottom:var(--space-2)}
.empty-text{font-size:var(--font-size-sm);color:var(--gray-500)}
</style>
