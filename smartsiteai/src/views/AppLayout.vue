<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth, useNotifStore, useToast } from '@/store'
import { projectsApi, notificationsApi } from '@/api'
import { useProjectStore } from '@/store'

const router = useRouter()
const route = useRoute()
const { currentUser, can, logout } = useAuth()
const { notifications, unreadCount, setNotifications, markAllRead } = useNotifStore()
const { activeProject, projects, setProjects, setActiveProject } = useProjectStore()
const { show } = useToast()

const sidebarOpen = ref(false)
const notifDrawerOpen = ref(false)

// Sidebar nav items
const navItems = computed(() => [
  { path: '/dashboard', icon: '📊', label: '工地總覽', name: 'dashboard' },
  { path: '/inspections', icon: '📋', label: '巡檢管理', name: 'inspections' },
  { path: '/defects', icon: '⚠️', label: '缺失管理', name: 'defects' },
  { path: '/risk', icon: '🔥', label: '風險分析', name: 'risk' },
  { path: '/reports', icon: '📈', label: '報表中心', name: 'reports' },
  ...(can.manageUsers.value ? [{ path: '/users', icon: '👥', label: '使用者管理', name: 'users' }] : []),
])

const pageTitle = computed(() => {
  const found = navItems.value.find(n => route.path.startsWith(n.path))
  return found ? found.label : 'SmartSite AI'
})

const handleLogout = () => {
  logout()
  show('已安全登出系統', 'success')
  router.push('/login')
}

const loadInitialData = async () => {
  try {
    const [projs, notifs] = await Promise.all([
      projectsApi.list(),
      notificationsApi.list(currentUser.value?.id),
    ])
    setProjects(projs)
    setNotifications(notifs)
  } catch (e) {
    console.warn('Failed to load initial data:', e)
  }
}

const handleMarkAllRead = async () => {
  try {
    await notificationsApi.markAllRead(currentUser.value?.id)
    markAllRead()
    show('所有通知已標記為已讀', 'success')
  } catch {}
}

onMounted(() => {
  loadInitialData()
})
</script>

<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }" id="app-sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon-sm">S</div>
        <div class="logo-text-sm">SmartSite <em>AI</em></div>
      </div>

      <!-- Active Project Selector -->
      <div class="project-selector" v-if="projects.length > 0">
        <label>📁 作業工地</label>
        <select
          class="project-select"
          :value="activeProject?.id"
          @change="(e) => setActiveProject(projects.find(p => p.id === (e.target as HTMLSelectElement).value) || null)"
        >
          <option v-for="p in projects" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path.startsWith(item.path) }"
          @click="sidebarOpen = false"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <div class="user-mini">
          <div class="user-avatar-sm">{{ currentUser?.name?.slice(-2) }}</div>
          <div class="user-mini-info">
            <span class="user-mini-name">{{ currentUser?.name }}</span>
            <span class="user-mini-role">{{ currentUser?.role }}</span>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout" title="登出">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </aside>

    <!-- Sidebar Overlay (mobile) -->
    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    ></div>

    <!-- Main Wrapper -->
    <div class="main-wrapper">
      <!-- Top Header -->
      <header class="app-header">
        <button class="menu-toggle" @click="sidebarOpen = !sidebarOpen">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div class="header-title">
          <h1>{{ pageTitle }}</h1>
        </div>

        <div class="header-actions">
          <!-- Notification Bell -->
          <div class="notif-bell" @click="notifDrawerOpen = !notifDrawerOpen">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
          </div>

          <!-- User Profile -->
          <div class="header-user">
            <div class="user-avatar">{{ currentUser?.name?.slice(-2) }}</div>
            <div class="user-info">
              <span class="user-name">{{ currentUser?.name }}</span>
              <span class="user-role-tag">{{ currentUser?.role }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="page-content">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>

    <!-- Notification Drawer -->
    <Transition name="drawer">
      <div class="notif-drawer" v-if="notifDrawerOpen">
        <div class="drawer-header">
          <h3>系統通知</h3>
          <button class="modal-close" @click="notifDrawerOpen = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="drawer-body">
          <div v-if="notifications.length === 0" class="notif-empty">
            暫無通知
          </div>
          <div
            v-for="n in notifications"
            :key="n.id"
            class="notif-item"
            :class="{ unread: !n.is_read }"
          >
            <div class="notif-item-title">{{ n.title }}</div>
            <div class="notif-item-msg">{{ n.message }}</div>
            <div class="notif-item-time">{{ n.created_at?.split('T')[0] || '' }}</div>
          </div>
        </div>
        <div class="drawer-footer">
          <button class="btn-link" @click="handleMarkAllRead">全部標為已讀</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
}

/* Sidebar */
.sidebar {
  width: var(--sidebar-width);
  background: var(--primary);
  color: #F8FAFC;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; bottom: 0; left: 0;
  z-index: 50;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 24px rgba(15, 23, 42, 0.15);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.logo-icon-sm {
  background: linear-gradient(135deg, var(--warning), #FB923C);
  width: 34px; height: 34px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 18px; color: white;
  font-family: 'Outfit', sans-serif;
}

.logo-text-sm {
  font-family: 'Outfit', sans-serif;
  font-size: 18px; font-weight: 700; color: white;
}

.logo-text-sm em { font-style: normal; color: var(--warning); }

.project-selector {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.project-selector label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  display: block;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.project-select {
  width: 100%;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  color: white;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s;
}

.nav-item:hover { background: rgba(255,255,255,0.08); color: white; }
.nav-item.active {
  background: var(--warning);
  color: white;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

.nav-icon { font-size: 16px; width: 20px; text-align: center; }

.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-mini { flex: 1; display: flex; align-items: center; gap: 10px; }

.user-avatar-sm {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #334155, #1E293B);
  color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  flex-shrink: 0;
}

.user-mini-info { display: flex; flex-direction: column; }
.user-mini-name { font-size: 13px; font-weight: 600; color: white; }
.user-mini-role { font-size: 10px; color: rgba(255,255,255,0.5); }

.logout-btn {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.6);
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}

.logout-btn:hover { background: rgba(239,68,68,0.2); border-color: var(--danger); color: var(--danger); }

/* Main Wrapper */
.main-wrapper {
  margin-left: var(--sidebar-width);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Header */
.app-header {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  height: 68px;
  border-bottom: 1px solid var(--border);
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 40;
}

.menu-toggle {
  display: none;
  background: none; border: none; cursor: pointer;
  color: var(--text-main); padding: 4px;
}

.header-title h1 { font-size: 20px; color: var(--text-main); }

.header-actions { display: flex; align-items: center; gap: 16px; }

.notif-bell {
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  color: var(--secondary);
  transition: background 0.15s;
}

.notif-bell:hover { background: #F1F5F9; }

.notif-badge {
  position: absolute;
  top: 2px; right: 2px;
  background: var(--danger);
  color: white;
  font-size: 9px; font-weight: 700;
  width: 16px; height: 16px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid white;
}

.header-user {
  display: flex; align-items: center; gap: 10px;
}

.user-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
}

.user-info { display: flex; flex-direction: column; }
.user-name { font-size: 13px; font-weight: 600; }
.user-role-tag { font-size: 11px; color: var(--text-muted); }

/* Page Content */
.page-content {
  padding: 32px;
  flex: 1;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
}

/* Notification Drawer */
.notif-drawer {
  position: fixed;
  top: 68px; right: 0; bottom: 0;
  width: 320px;
  background: white;
  box-shadow: -4px 4px 20px rgba(15, 23, 42, 0.08);
  border-left: 1px solid var(--border);
  z-index: 90;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-header h3 { font-size: 15px; }

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notif-empty {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 0;
  font-size: 13px;
}

.notif-item {
  padding: 12px;
  background: #F8FAFC;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.notif-item.unread {
  border-left: 3px solid var(--warning);
  background: #FFFBF7;
}

.notif-item-title { font-size: 12px; font-weight: 600; margin-bottom: 4px; }
.notif-item-msg { font-size: 11px; color: var(--text-muted); line-height: 1.4; }
.notif-item-time { font-size: 10px; color: var(--text-muted); text-align: right; margin-top: 6px; }

.drawer-footer {
  padding: 12px;
  border-top: 1px solid var(--border);
  text-align: center;
}

.btn-link {
  background: none; border: none;
  color: var(--warning); font-size: 12px; font-weight: 600;
  cursor: pointer;
}

/* Transitions */
.drawer-enter-active, .drawer-leave-active { transition: transform 0.3s ease; }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }

.sidebar-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 45;
}

@media (max-width: 1023px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.sidebar-open { transform: translateX(0); }
  .main-wrapper { margin-left: 0; }
  .menu-toggle { display: flex; }
  .header-title h1 { font-size: 16px; }
  .user-info { display: none; }
}

@media (max-width: 640px) {
  .page-content { padding: 16px; }
  .app-header { padding: 0 16px; }
}
</style>
