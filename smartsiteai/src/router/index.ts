import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/',
      component: () => import('../views/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
        { path: 'inspections', name: 'inspections', component: () => import('../views/InspectionsView.vue') },
        { path: 'defects', name: 'defects', component: () => import('../views/DefectsView.vue') },
        { path: 'risk', name: 'risk', component: () => import('../views/RiskView.vue') },
        { path: 'reports', name: 'reports', component: () => import('../views/ReportsView.vue') },
        { path: 'users', name: 'users', component: () => import('../views/UsersView.vue'), meta: { requiresAdmin: true } },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const { isLoggedIn, currentRole } = useAuth()

  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { name: 'login' }
  }
  if (to.meta.requiresGuest && isLoggedIn.value) {
    return { name: 'dashboard' }
  }
  if (to.meta.requiresAdmin && currentRole.value !== 'admin') {
    return { name: 'dashboard' }
  }
})

export default router
