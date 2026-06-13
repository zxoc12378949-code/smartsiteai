// SmartSite AI - Global Application Store (Pinia-like reactive state)
// Uses Vue 3 Composition API reactive() for global state management

import { reactive, computed } from 'vue';
import type { User, Project, Notification } from './api';

// ─────────────────────────────────────────
// Auth Store
// ─────────────────────────────────────────
const authState = reactive({
  token: localStorage.getItem('smartsite_token') || '',
  user: (() => {
    const stored = localStorage.getItem('smartsite_user');
    return stored ? JSON.parse(stored) as User : null as User | null;
  })(),
});

export const useAuth = () => {
  const isLoggedIn = computed(() => !!authState.token && !!authState.user);
  const currentUser = computed(() => authState.user);
  const currentRole = computed(() => authState.user?.role || '');

  const login = (token: string, user: User) => {
    authState.token = token;
    authState.user = user;
    localStorage.setItem('smartsite_token', token);
    localStorage.setItem('smartsite_user', JSON.stringify(user));
  };

  const logout = () => {
    authState.token = '';
    authState.user = null;
    localStorage.removeItem('smartsite_token');
    localStorage.removeItem('smartsite_user');
  };

  // Role-based permission helpers
  const can = {
    createInspection: computed(() => ['inspector', 'manager', 'admin'].includes(authState.user?.role || '')),
    createDefect: computed(() => ['inspector', 'manager', 'admin'].includes(authState.user?.role || '')),
    manageDefect: computed(() => ['manager', 'supervisor', 'admin'].includes(authState.user?.role || '')),
    closeDefect: computed(() => ['supervisor', 'manager', 'admin'].includes(authState.user?.role || '')),
    manageUsers: computed(() => authState.user?.role === 'admin'),
    viewReports: computed(() => true),
  };

  return { isLoggedIn, currentUser, currentRole, login, logout, can };
};

// ─────────────────────────────────────────
// Active Project Store
// ─────────────────────────────────────────
const projectState = reactive({
  activeProject: (() => {
    const stored = localStorage.getItem('smartsite_active_project');
    return stored ? JSON.parse(stored) as Project : null as Project | null;
  })(),
  projects: [] as Project[],
});

export const useProjectStore = () => {
  const activeProject = computed(() => projectState.activeProject);
  const projects = computed(() => projectState.projects);

  const setActiveProject = (project: Project | null) => {
    projectState.activeProject = project;
    if (project) {
      localStorage.setItem('smartsite_active_project', JSON.stringify(project));
    } else {
      localStorage.removeItem('smartsite_active_project');
    }
  };

  const setProjects = (list: Project[]) => {
    projectState.projects = list;
    // Auto-select first active project if none selected
    if (!projectState.activeProject && list.length > 0) {
      setActiveProject(list.find(p => p.status === 'active') || list[0] || null);
    }
  };

  return { activeProject, projects, setActiveProject, setProjects };
};

// ─────────────────────────────────────────
// Notifications Store
// ─────────────────────────────────────────
const notifState = reactive({
  notifications: [] as Notification[],
});

export const useNotifStore = () => {
  const notifications = computed(() => notifState.notifications);
  const unreadCount = computed(() => notifState.notifications.filter(n => !n.is_read).length);

  const setNotifications = (list: Notification[]) => {
    notifState.notifications = list;
  };

  const markRead = (id: string) => {
    const n = notifState.notifications.find(n => n.id === id);
    if (n) n.is_read = 1;
  };

  const markAllRead = () => {
    notifState.notifications.forEach(n => (n.is_read = 1));
  };

  return { notifications, unreadCount, setNotifications, markRead, markAllRead };
};

// ─────────────────────────────────────────
// Toast Notification Helper
// ─────────────────────────────────────────
const toastState = reactive({
  toasts: [] as Array<{ id: number; message: string; type: 'success' | 'warning' | 'danger'; title: string }>,
});

let toastIdCounter = 0;

export const useToast = () => {
  const toasts = computed(() => toastState.toasts);

  const show = (message: string, type: 'success' | 'warning' | 'danger' = 'success', title?: string) => {
    const id = ++toastIdCounter;
    const defaultTitle = type === 'success' ? '操作成功' : type === 'warning' ? '警告提示' : '錯誤';
    toastState.toasts.push({ id, message, type, title: title || defaultTitle });
    setTimeout(() => {
      const idx = toastState.toasts.findIndex(t => t.id === id);
      if (idx > -1) toastState.toasts.splice(idx, 1);
    }, 4000);
  };

  const dismiss = (id: number) => {
    const idx = toastState.toasts.findIndex(t => t.id === id);
    if (idx > -1) toastState.toasts.splice(idx, 1);
  };

  return { toasts, show, dismiss };
};
