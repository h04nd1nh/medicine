import { createRouter, createWebHistory } from 'vue-router'

const LoginView = () => import('@/views/LoginView.vue')
const DashboardLayout = () => import('@/views/DashboardLayout.vue')
const HomeView = () => import('@/views/HomeView.vue')
const PatientsView = () => import('@/views/PatientsView.vue')

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
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'login' },
    },
  ],
})

// Navigation guard
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('access_token')

  if (to.meta.requiresAuth && !token) {
    next({ name: 'login' })
  } else if (to.name === 'login' && token) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
