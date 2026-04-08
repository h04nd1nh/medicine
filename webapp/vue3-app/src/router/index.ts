import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import MainLayout from '../layouts/MainLayout.vue'
import LoginPage from '../pages/LoginPage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import PatientsPage from '../pages/PatientsPage.vue'
import ExaminationsPage from '../pages/ExaminationsPage.vue'
import AppointmentsPage from '../pages/AppointmentsPage.vue'
import ModelsPage from '../pages/ModelsPage.vue'
import AnalysisPage from '../pages/AnalysisPage.vue'
import TayyPage from '../pages/TayyPage.vue'
import DongyPage from '../pages/DongyPage.vue'
import ThuocPage from '../pages/ThuocPage.vue'
import TrieuchungPage from '../pages/TrieuchungPage.vue'
import PhaptriPage from '../pages/PhaptriPage.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginPage, meta: { public: true } },
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: DashboardPage },
        { path: 'patients', name: 'patients', component: PatientsPage },
        { path: 'examinations', name: 'examinations', component: ExaminationsPage },
        { path: 'appointments', name: 'appointments', component: AppointmentsPage },
        { path: 'tayy', name: 'tayy', component: TayyPage },
        { path: 'dongy', name: 'dongy', component: DongyPage },
        { path: 'thuoc', name: 'thuoc', component: ThuocPage },
        { path: 'trieuchung', name: 'trieuchung', component: TrieuchungPage },
        { path: 'phaptri', name: 'phaptri', component: PhaptriPage },
        { path: 'models', name: 'models', component: ModelsPage },
        { path: 'analysis/:id?', name: 'analysis', component: AnalysisPage, props: true },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  if (to.meta.public) return true
  return authStore.isAuthenticated ? true : '/login'
})

export default router
