import { createRouter, createWebHistory } from 'vue-router'

const LoginView = () => import('@/views/LoginView.vue')
const DashboardLayout = () => import('@/views/DashboardLayout.vue')
const HomeView = () => import('@/views/HomeView.vue')
const PatientsView = () => import('@/views/PatientsView.vue')
const PatientDetailView = () => import('@/views/PatientDetailView.vue')
const NewExaminationView = () => import('@/views/NewExaminationView.vue')
const MeridianResultsView = () => import('@/views/MeridianResultsView.vue')
const AppointmentsView = () => import('@/views/AppointmentsView.vue')
const WesternMedicineView = () => import('@/views/WesternMedicineView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      redirect: { name: 'home' },
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
        },
        {
          path: 'patients',
          name: 'patients',
          component: PatientsView,
        },
        {
          path: 'appointments',
          name: 'appointments',
          component: AppointmentsView,
        },
        {
          path: 'western-medicine',
          name: 'western-medicine',
          component: WesternMedicineView,
        },
        {
          path: 'patients/:id',
          name: 'patient-detail',
          component: PatientDetailView,
          props: true,
        },
        {
          path: 'patients/:id/new-examination',
          name: 'new-examination',
          component: NewExaminationView,
          props: true,
        },
        {
          path: 'patients/:patientId/examinations/:examId',
          name: 'meridian-results',
          component: MeridianResultsView,
          props: true,
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'login' },
    },
  ],
})

// Navigation guard
router.beforeEach((to) => {
  const token = localStorage.getItem('access_token')

  if (to.meta.requiresAuth && !token) {
    return { name: 'login' }
  }
  if (to.name === 'login' && token) {
    return { name: 'dashboard' }
  }
})

export default router
