// SmartSite AI - Frontend API Service Layer
// Connects Vue frontend to Cloudflare Worker REST API

const BASE_URL = '/api/v1';

// ─────────────────────────────────────────
// HTTP Client
// ─────────────────────────────────────────
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('smartsite_token');

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error((data as any).error || `HTTP ${res.status}`);
  return data as T;
}

// ─────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { name: string; email: string; password: string; role?: string; department?: string }) =>
    request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─────────────────────────────────────────
// Users API
// ─────────────────────────────────────────
export const usersApi = {
  list: (role?: string) =>
    request<User[]>(`/users${role ? `?role=${role}` : ''}`),

  get: (id: string) => request<User>(`/users/${id}`),

  create: (data: Partial<User> & { password: string }) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<User>) =>
    request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
};

// ─────────────────────────────────────────
// Projects API
// ─────────────────────────────────────────
export const projectsApi = {
  list: () => request<Project[]>('/projects'),
  get: (id: string) => request<Project>(`/projects/${id}`),
  create: (data: Partial<Project>) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ message: string }>(`/projects/${id}`, { method: 'DELETE' }),
};

// ─────────────────────────────────────────
// Inspections API
// ─────────────────────────────────────────
export const inspectionsApi = {
  list: (params?: { project_id?: string; inspector_id?: string; date_from?: string; date_to?: string; status?: string }) => {
    const filtered: Record<string, string> = {}
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) filtered[k] = v })
    const qs = Object.keys(filtered).length ? '?' + new URLSearchParams(filtered).toString() : ''
    return request<Inspection[]>(`/inspections${qs}`)
  },

  get: (id: string) => request<InspectionDetail>(`/inspections/${id}`),

  create: (data: CreateInspectionDto) =>
    request<Inspection>('/inspections', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Inspection>) =>
    request<Inspection>(`/inspections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ message: string }>(`/inspections/${id}`, { method: 'DELETE' }),

  addItem: (inspectionId: string, item: { item_name: string; result: string }) =>
    request<InspectionItem>(`/inspections/${inspectionId}/items`, {
      method: 'POST', body: JSON.stringify(item)
    }),

  getItems: (inspectionId: string) =>
    request<InspectionItem[]>(`/inspections/${inspectionId}/items`),
};

// ─────────────────────────────────────────
// Defects API
// ─────────────────────────────────────────
export const defectsApi = {
  list: (params?: { status?: string; risk_level?: string; project_id?: string; work_area?: string }) => {
    const filtered: Record<string, string> = {}
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) filtered[k] = v })
    const qs = Object.keys(filtered).length ? '?' + new URLSearchParams(filtered).toString() : ''
    return request<Defect[]>(`/defects${qs}`)
  },

  get: (id: string) => request<DefectDetail>(`/defects/${id}`),

  create: (data: CreateDefectDto) =>
    request<Defect>('/defects', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Defect>) =>
    request<Defect>(`/defects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ message: string }>(`/defects/${id}`, { method: 'DELETE' }),

  patchStatus: (id: string, data: { status: string; resolved_notes?: string }) =>
    request<Defect>(`/defects/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ─────────────────────────────────────────
// Risk API
// ─────────────────────────────────────────
export const riskApi = {
  calculate: (severity: number, probability: number) =>
    request<{ risk_score: number; level: string }>('/risk/calculate', {
      method: 'POST',
      body: JSON.stringify({ severity, probability }),
    }),

  getByDefect: (defectId: string) =>
    request<RiskAssessment>(`/risk/defect/${defectId}`),

  create: (data: { defect_id: string; severity: number; probability: number; ai_suggestion?: string }) =>
    request<RiskAssessment>('/risk', { method: 'POST', body: JSON.stringify(data) }),
};

// ─────────────────────────────────────────
// Notifications API
// ─────────────────────────────────────────
export const notificationsApi = {
  list: (userId?: string, isRead?: boolean) => {
    const params: Record<string, string> = {};
    if (userId) params.user_id = userId;
    if (isRead !== undefined) params.is_read = String(isRead);
    const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return request<Notification[]>(`/notifications${qs}`);
  },

  markRead: (id: string) =>
    request<Notification>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllRead: (userId?: string) =>
    request<{ message: string }>(`/notifications/read-all${userId ? `?user_id=${userId}` : ''}`, { method: 'PATCH' }),
};

// ─────────────────────────────────────────
// Dashboard API
// ─────────────────────────────────────────
export const dashboardApi = {
  summary: (projectId?: string) =>
    request<DashboardSummary>(`/dashboard/summary${projectId ? `?project_id=${projectId}` : ''}`),

  charts: (projectId?: string) =>
    request<DashboardCharts>(`/dashboard/charts${projectId ? `?project_id=${projectId}` : ''}`),
};

// ─────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'inspector' | 'manager' | 'supervisor' | 'admin';
  department?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  location?: string;
  status: 'active' | 'archived';
  created_at?: string;
}

export interface Inspection {
  id: string;
  project_id: string;
  inspector_id: string;
  inspection_date: string;
  work_area: string;
  status: 'pass' | 'warning' | 'fail';
  notes?: string;
  created_at?: string;
  inspector_name?: string;
  project_name?: string;
}

export interface InspectionItem {
  id: string;
  inspection_id: string;
  item_name: string;
  result: 'normal' | 'abnormal';
}

export interface InspectionDetail extends Inspection {
  items: InspectionItem[];
}

export interface CreateInspectionDto {
  project_id: string;
  inspector_id: string;
  inspection_date: string;
  work_area: string;
  status?: string;
  notes?: string;
  items?: Array<{ item_name: string; result: string }>;
}

export interface Defect {
  id: string;
  project_id: string;
  inspection_id?: string;
  title: string;
  description?: string;
  work_area: string;
  risk_level: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  responsible_user_id?: string;
  due_date?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  resolved_notes?: string;
  resolved_date?: string;
  closed_date?: string;
  responsible_user_name?: string;
  created_by_name?: string;
  project_name?: string;
}

export interface DefectDetail extends Defect {
  attachments: DefectAttachment[];
  risk_assessment?: RiskAssessment;
}

export interface DefectAttachment {
  id: string;
  defect_id: string;
  file_url: string;
  file_type?: string;
  attachment_type: 'before' | 'after';
}

export interface CreateDefectDto {
  project_id: string;
  inspection_id?: string;
  title: string;
  description?: string;
  work_area: string;
  risk_level?: string;
  responsible_user_id?: string;
  due_date?: string;
  created_by?: string;
  severity?: number;
  probability?: number;
}

export interface RiskAssessment {
  id: string;
  defect_id: string;
  severity: number;
  probability: number;
  risk_score: number;
  ai_suggestion?: string;
  created_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'defect_created' | 'due_soon' | 'overdue' | 'resolved' | 'status_changed';
  title: string;
  message: string;
  is_read: number;
  created_at?: string;
}

export interface DashboardSummary {
  total_inspections: number;
  open_defects: number;
  high_risk_defects: number;
  completion_rate: number;
}

export interface DashboardCharts {
  defect_distribution: Array<{ risk_level: string; count: number }>;
  defect_by_area: Array<{ work_area: string; count: number }>;
  inspection_trend: Array<{ month: string; count: number; status: string }>;
  risk_trend: Array<{ month: string; count: number }>;
  status_distribution: Array<{ status: string; count: number }>;
}
