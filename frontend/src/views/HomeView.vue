<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="home-page">
    <!-- Welcome Section -->
    <div class="welcome-card">
      <div class="welcome-content">
        <h2 class="welcome-title">
          Chào mừng trở lại, <span class="highlight">{{ authStore.username || 'Admin' }}</span> 👋
        </h2>
        <p class="welcome-text">Quản lý phòng khám Y Học Cổ Truyền một cách dễ dàng và hiệu quả.</p>
      </div>
      <div class="welcome-art">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="55" stroke="rgba(255,255,255,.2)" stroke-width="2"/>
          <circle cx="60" cy="60" r="40" stroke="rgba(255,255,255,.15)" stroke-width="1.5"/>
          <path d="M60 20C60 20 40 40 40 60C40 71.046 48.954 80 60 80C71.046 80 80 71.046 80 60C80 40 60 20 60 20Z" fill="rgba(255,255,255,.25)"/>
          <circle cx="60" cy="60" r="6" fill="rgba(255,255,255,.5)"/>
        </svg>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon--patients">
          <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">--</span>
          <span class="stat-label">Bệnh nhân</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon--prescriptions">
          <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">--</span>
          <span class="stat-label">Bài thuốc</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon--herbs">
          <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.816 14.769 2.156 18 4.828 18h10.343c2.673 0 4.013-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187 1.949-1.95A3 3 0 009 8.172z" clip-rule="evenodd"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">--</span>
          <span class="stat-label">Vị thuốc</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon--appointments">
          <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">--</span>
          <span class="stat-label">Lịch hẹn</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="section">
      <h3 class="section-title">Truy cập nhanh</h3>
      <div class="quick-actions">
        <div class="action-card">
          <div class="action-icon">
            <svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
          </div>
          <span class="action-label">Danh sách bệnh nhân</span>
        </div>
        <div class="action-card">
          <div class="action-icon">
            <svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
          </div>
          <span class="action-label">Thêm bệnh nhân mới</span>
        </div>
        <div class="action-card">
          <div class="action-icon">
            <svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
          </div>
          <span class="action-label">Tra cứu bài thuốc</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page{max-width:1200px;animation:fadeIn .4s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.welcome-card{background:linear-gradient(135deg,var(--brown-600) 0%,var(--brown-800) 100%);border-radius:var(--radius-lg);padding:var(--space-8) var(--space-10);display:flex;align-items:center;justify-content:space-between;color:var(--white);margin-bottom:var(--space-8);position:relative;overflow:hidden}
.welcome-card::before{content:'';position:absolute;top:-50%;right:-20%;width:400px;height:400px;border-radius:50%;background:rgba(255,255,255,.05)}
.welcome-content{position:relative;z-index:1}
.welcome-title{font-size:var(--font-size-2xl);font-weight:700;margin-bottom:var(--space-2)}
.welcome-title .highlight{color:var(--brown-200)}
.welcome-text{font-size:var(--font-size-sm);color:rgba(255,255,255,.75)}
.welcome-art{position:relative;z-index:1;opacity:.8;animation:pulse-glow 4s ease-in-out infinite}
@keyframes pulse-glow{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}

.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-5);margin-bottom:var(--space-8)}
.stat-card{background:var(--white);border-radius:var(--radius-md);padding:var(--space-6);display:flex;align-items:center;gap:var(--space-4);box-shadow:var(--shadow-sm);border:1px solid var(--gray-200);transition:all var(--transition-fast)}
.stat-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-md)}
.stat-icon{width:48px;height:48px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.stat-icon--patients{background:rgba(166,114,53,.1);color:var(--brown-600)}
.stat-icon--prescriptions{background:rgba(39,174,96,.1);color:var(--success)}
.stat-icon--herbs{background:rgba(230,126,34,.1);color:var(--warning)}
.stat-icon--appointments{background:rgba(41,128,185,.1);color:var(--info)}
.stat-info{display:flex;flex-direction:column}
.stat-value{font-size:var(--font-size-2xl);font-weight:700;color:var(--black)}
.stat-label{font-size:var(--font-size-sm);color:var(--gray-500)}

.section{margin-bottom:var(--space-8)}
.section-title{font-size:var(--font-size-lg);font-weight:700;color:var(--black);margin-bottom:var(--space-5)}
.quick-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-4)}
.action-card{background:var(--white);border:1px solid var(--gray-200);border-radius:var(--radius-md);padding:var(--space-6);display:flex;flex-direction:column;align-items:center;gap:var(--space-3);cursor:pointer;transition:all var(--transition-fast);text-align:center}
.action-card:hover{border-color:var(--brown-300);background:var(--brown-50);transform:translateY(-2px);box-shadow:var(--shadow-md)}
.action-icon{width:56px;height:56px;border-radius:var(--radius-md);background:var(--brown-50);color:var(--brown-600);display:flex;align-items:center;justify-content:center;transition:all var(--transition-fast)}
.action-card:hover .action-icon{background:var(--brown-100);color:var(--brown-700)}
.action-label{font-size:var(--font-size-sm);font-weight:600;color:var(--gray-700)}

@media(max-width:768px){.welcome-card{flex-direction:column;text-align:center;padding:var(--space-6)}.welcome-art{margin-top:var(--space-4)}}
</style>
