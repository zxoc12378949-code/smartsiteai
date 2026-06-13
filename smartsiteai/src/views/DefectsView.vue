<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { defectsApi, usersApi } from '@/api'
import { useAuth, useProjectStore, useToast } from '@/store'
import type { Defect, DefectDetail, User } from '@/api'

const { currentUser, can } = useAuth()
const { activeProject } = useProjectStore()
const { show } = useToast()

const defects = ref<Defect[]>([])
const users = ref<User[]>([])
const loading = ref(true)
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const selectedDefect = ref<DefectDetail | null>(null)
const submitting = ref(false)
const resolveNotes = ref('')

const filterArea = ref('')
const filterRisk = ref('')
const searchQ = ref('')

// Dual-view & Bulk actions state
const viewMode = ref<'kanban' | 'table'>('kanban')
const selectedDefectIds = ref<string[]>([])
const sortingField = ref<'id' | 'title' | 'work_area' | 'risk_level' | 'due_date' | 'status'>('due_date')
const sortingOrder = ref<'asc' | 'desc'>('asc')

const form = ref({
  title: '',
  description: '',
  work_area: 'A區基礎',
  responsible_user_id: '' as string,
  due_date: '',
  risk_level: 'high' as 'low' | 'medium' | 'high',
  severity: 4,
  probability: 4,
})

// Filtered list
const filteredDefectsList = computed(() => {
  return defects.value.filter(d => {
    if (filterArea.value && d.work_area !== filterArea.value) return false
    if (filterRisk.value && d.risk_level !== filterRisk.value) return false
    if (searchQ.value) {
      const q = searchQ.value.toLowerCase()
      if (!`${d.title} ${d.description} ${d.responsible_user_name}`.toLowerCase().includes(q)) return false
    }
    return true
  })
})

// Group defects by status (for Kanban)
const grouped = computed(() => {
  const base = filteredDefectsList.value
  return {
    open: base.filter(d => d.status === 'open'),
    in_progress: base.filter(d => d.status === 'in_progress'),
    resolved: base.filter(d => d.status === 'resolved'),
    closed: base.filter(d => d.status === 'closed'),
  }
})

// Sorted list (for Table View)
const sortedDefectsList = computed(() => {
  const list = [...filteredDefectsList.value]
  list.sort((a, b) => {
    let valA: any = a[sortingField.value] ?? ''
    let valB: any = b[sortingField.value] ?? ''
    
    if (sortingField.value === 'risk_level') {
      const weights: Record<string, number> = { low: 1, medium: 2, high: 3 }
      valA = weights[a.risk_level] || 0
      valB = weights[b.risk_level] || 0
    }
    
    if (valA < valB) return sortingOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortingOrder.value === 'asc' ? 1 : -1
    return 0
  })
  return list
})

const isAllSelected = computed(() => {
  const list = filteredDefectsList.value
  return list.length > 0 && selectedDefectIds.value.length === list.length
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedDefectIds.value = []
  } else {
    selectedDefectIds.value = filteredDefectsList.value.map(d => d.id)
  }
}

// Bulk Actions Handlers
const handleBulkStatus = async (status: string) => {
  if (selectedDefectIds.value.length === 0) return
  submitting.value = true
  try {
    await Promise.all(
      selectedDefectIds.value.map(id => defectsApi.patchStatus(id, { status }))
    )
    show(`批次更新 ${selectedDefectIds.value.length} 項狀態成功`, 'success')
    selectedDefectIds.value = []
    await loadData()
  } catch (e: any) {
    show(e.message || '批次更新失敗', 'danger')
  } finally {
    submitting.value = false
  }
}

const handleBulkRisk = async (risk_level: 'low' | 'medium' | 'high') => {
  if (selectedDefectIds.value.length === 0) return
  submitting.value = true
  try {
    await Promise.all(
      selectedDefectIds.value.map(id => defectsApi.update(id, { risk_level }))
    )
    show(`批次更新 ${selectedDefectIds.value.length} 項風險等級成功`, 'success')
    selectedDefectIds.value = []
    await loadData()
  } catch (e: any) {
    show(e.message || '批次更新失敗', 'danger')
  } finally {
    submitting.value = false
  }
}

const handleBulkDelete = async () => {
  if (selectedDefectIds.value.length === 0) return
  if (!confirm(`確定要刪除選中的 ${selectedDefectIds.value.length} 項缺失？此操作無法復原。`)) return
  submitting.value = true
  try {
    await Promise.all(
      selectedDefectIds.value.map(id => defectsApi.delete(id))
    )
    show(`批次刪除 ${selectedDefectIds.value.length} 項缺失成功`, 'success')
    selectedDefectIds.value = []
    await loadData()
  } catch (e: any) {
    show(e.message || '批次刪除失敗', 'danger')
  } finally {
    submitting.value = false
  }
}

const toggleSort = (field: typeof sortingField.value) => {
  if (sortingField.value === field) {
    sortingOrder.value = sortingOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortingField.value = field
    sortingOrder.value = 'asc'
  }
}

const riskBadge = (level: string) =>
  level === 'high' ? 'badge-danger' : level === 'medium' ? 'badge-warning' : 'badge-secondary'

const statusBadge = (status: string) =>
  status === 'open' ? 'badge-danger' :
  status === 'in_progress' ? 'badge-warning' :
  status === 'resolved' ? 'badge-primary' : 'badge-success'

const isOverdue = (d: Defect) =>
  d.due_date && new Date(d.due_date) < new Date() && d.status !== 'resolved' && d.status !== 'closed'

const openCreateModal = () => {
  form.value = {
    title: '', description: '', work_area: 'A區基礎',
    responsible_user_id: users.value[0]?.id ?? '',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] as string,
    risk_level: 'high' as const, severity: 4, probability: 4,
  }
  showCreateModal.value = true
}

async function openDefectDetail(id: string) {
  try {
    selectedDefect.value = await defectsApi.get(id)
    resolveNotes.value = ''
    showDetailModal.value = true
  } catch (e: any) {
    show(e.message, 'danger')
  }
}

async function handleCreate() {
  if (!form.value.title || !form.value.due_date) {
    show('請填寫必要欄位', 'warning')
    return
  }
  if (!activeProject.value) {
    show('請先選擇工地', 'warning')
    return
  }
  submitting.value = true
  try {
    await defectsApi.create({
      project_id: activeProject.value.id,
      title: form.value.title,
      description: form.value.description,
      work_area: form.value.work_area,
      responsible_user_id: form.value.responsible_user_id,
      due_date: form.value.due_date,
      risk_level: form.value.risk_level,
      severity: form.value.severity,
      probability: form.value.probability,
      created_by: currentUser.value?.id,
    })
    show('缺失通報成功', 'success')
    showCreateModal.value = false
    await loadData()
  } catch (e: any) {
    show(e.message, 'danger')
  } finally {
    submitting.value = false
  }
}

async function handleStatusChange(status: string, notes?: string) {
  if (!selectedDefect.value) return
  submitting.value = true
  try {
    await defectsApi.patchStatus(selectedDefect.value.id, {
      status,
      resolved_notes: notes,
    })
    show('缺失狀態已更新', 'success')
    showDetailModal.value = false
    await loadData()
  } catch (e: any) {
    show(e.message, 'danger')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('確定要刪除此缺失？')) return
  try {
    await defectsApi.delete(id)
    show('缺失已刪除', 'success')
    await loadData()
  } catch (e: any) {
    show(e.message, 'danger')
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const [defs, usrs] = await Promise.all([
      defectsApi.list({ project_id: activeProject.value?.id }),
      usersApi.list(),
    ])
    defects.value = defs
    users.value = usrs
  } catch (e: any) {
    show(e.message, 'danger')
  } finally {
    loading.value = false
  }
}

// Determine action buttons for defect detail based on role+status
const availableActions = computed(() => {
  if (!selectedDefect.value || !currentUser.value) return []
  const d = selectedDefect.value
  const actions = []

  if (d.status === 'open') {
    actions.push({ label: '開始改善', status: 'in_progress', type: 'warning' })
  }
  if (d.status === 'in_progress') {
    actions.push({ label: '申報完成', status: 'resolved', needsNotes: true, type: 'primary' })
  }
  if (d.status === 'resolved') {
    actions.push({ label: '審核通過/結案', status: 'closed', type: 'success' })
    actions.push({ label: '駁回重作', status: 'in_progress', type: 'danger' })
  }

  return actions
})

onMounted(loadData)
</script>

<template>
  <div>
    <!-- Filter Bar -->
    <div class="filter-bar card">
      <div class="form-group" style="margin:0">
        <label>工區</label>
        <select v-model="filterArea" class="form-control">
          <option value="">全部</option>
          <option>A區基礎</option><option>B區主體</option>
          <option>C區外牆</option><option>D區機電</option>
        </select>
      </div>
      <div class="form-group" style="margin:0">
        <label>風險等級</label>
        <select v-model="filterRisk" class="form-control">
          <option value="">全部</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div class="form-group" style="margin:0">
        <label>搜尋</label>
        <input v-model="searchQ" type="text" class="form-control" placeholder="標題、工區、負責人..." />
      </div>
      
      <!-- View Toggle -->
      <div class="form-group" style="margin:0">
        <label>檢視模式</label>
        <div class="view-toggle">
          <button class="toggle-btn" :class="{ active: viewMode === 'kanban' }" @click="viewMode = 'kanban'; selectedDefectIds = []">📋 看板</button>
          <button class="toggle-btn" :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'">▤ 列表</button>
        </div>
      </div>

      <button v-if="can.createDefect.value" class="btn btn-warning" style="align-self:flex-end" @click="openCreateModal">
        + 通報缺失
      </button>
    </div>

    <!-- Bulk Actions Panel (Only visible when items are selected in Table View) -->
    <transition name="slide-fade">
      <div v-if="viewMode === 'table' && selectedDefectIds.length > 0" class="bulk-action-bar card">
        <div class="bulk-info">
          已選擇 <strong style="color:var(--warning)">{{ selectedDefectIds.length }}</strong> 項缺失
        </div>
        <div class="bulk-actions">
          <div class="bulk-action-group">
            <span class="bulk-group-label">變更狀態:</span>
            <button class="btn btn-sm btn-secondary" :disabled="submitting" @click="handleBulkStatus('in_progress')">改善中</button>
            <button class="btn btn-sm btn-secondary" :disabled="submitting" @click="handleBulkStatus('resolved')">已完成</button>
            <button class="btn btn-sm btn-secondary" :disabled="submitting" @click="handleBulkStatus('closed')">已結案</button>
          </div>
          
          <div class="bulk-action-group">
            <span class="bulk-group-label">變更風險:</span>
            <button class="btn btn-sm btn-secondary" :disabled="submitting" @click="handleBulkRisk('low')">Low</button>
            <button class="btn btn-sm btn-secondary" :disabled="submitting" @click="handleBulkRisk('medium')">Medium</button>
            <button class="btn btn-sm btn-secondary" :disabled="submitting" @click="handleBulkRisk('high')">High</button>
          </div>

          <button class="btn btn-sm btn-danger" :disabled="submitting" @click="handleBulkDelete">
            🗑 批次刪除
          </button>
        </div>
      </div>
    </transition>

    <!-- Loading -->
    <div v-if="loading" style="text-align:center; padding:48px; color:var(--text-muted)">
      <div class="spinner" style="margin:0 auto 16px"></div>
      載入中...
    </div>

    <!-- Kanban Board -->
    <div v-else-if="viewMode === 'kanban'" class="kanban-board">
      <!-- Column: Open -->
      <div class="kanban-col">
        <div class="kanban-header">
          <span class="badge badge-danger">待改善 (Open)</span>
          <span class="kanban-count">{{ grouped.open.length }}</span>
        </div>
        <div class="kanban-cards">
          <div v-if="grouped.open.length === 0" class="kanban-empty">無待改善缺失</div>
          <div v-for="d in grouped.open" :key="d.id" class="defect-card" @click="openDefectDetail(d.id)">
            <div class="defect-card-top">
              <span class="badge" :class="riskBadge(d.risk_level)">{{ d.risk_level }}</span>
              <span class="defect-area">{{ d.work_area }}</span>
            </div>
            <div class="defect-title">{{ d.title }}</div>
            <div class="defect-desc">{{ d.description }}</div>
            <div class="defect-meta">
              <span>👤 {{ d.responsible_user_name || '-' }}</span>
              <span :style="{ color: isOverdue(d) ? 'var(--danger)' : '' }">
                🕐 {{ d.due_date }} {{ isOverdue(d) ? '⚠' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Column: In Progress -->
      <div class="kanban-col">
        <div class="kanban-header">
          <span class="badge badge-warning">改善中 (In Progress)</span>
          <span class="kanban-count">{{ grouped.in_progress.length }}</span>
        </div>
        <div class="kanban-cards">
          <div v-if="grouped.in_progress.length === 0" class="kanban-empty">無改善中缺失</div>
          <div v-for="d in grouped.in_progress" :key="d.id" class="defect-card" @click="openDefectDetail(d.id)">
            <div class="defect-card-top">
              <span class="badge" :class="riskBadge(d.risk_level)">{{ d.risk_level }}</span>
              <span class="defect-area">{{ d.work_area }}</span>
            </div>
            <div class="defect-title">{{ d.title }}</div>
            <div class="defect-meta">
              <span>👤 {{ d.responsible_user_name || '-' }}</span>
              <span :style="{ color: isOverdue(d) ? 'var(--danger)' : '' }">
                🕐 {{ d.due_date }} {{ isOverdue(d) ? '⚠' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Column: Resolved -->
      <div class="kanban-col">
        <div class="kanban-header">
          <span class="badge badge-primary">已完成 (Resolved)</span>
          <span class="kanban-count">{{ grouped.resolved.length }}</span>
        </div>
        <div class="kanban-cards">
          <div v-if="grouped.resolved.length === 0" class="kanban-empty">無待審核缺失</div>
          <div v-for="d in grouped.resolved" :key="d.id" class="defect-card" @click="openDefectDetail(d.id)">
            <div class="defect-card-top">
              <span class="badge" :class="riskBadge(d.risk_level)">{{ d.risk_level }}</span>
              <span class="defect-area">{{ d.work_area }}</span>
            </div>
            <div class="defect-title">{{ d.title }}</div>
            <div class="defect-meta">
              <span>📅 改善日 {{ d.resolved_date || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Column: Closed -->
      <div class="kanban-col kanban-col-closed">
        <div class="kanban-header">
          <span class="badge badge-success">已結案 (Closed)</span>
          <span class="kanban-count">{{ grouped.closed.length }}</span>
        </div>
        <div class="kanban-cards">
          <div v-if="grouped.closed.length === 0" class="kanban-empty">無已結案缺失</div>
          <div v-for="d in grouped.closed" :key="d.id" class="defect-card defect-closed" @click="openDefectDetail(d.id)">
            <div class="defect-title" style="text-decoration: line-through; opacity:0.7">{{ d.title }}</div>
            <div class="defect-meta">
              <span>✅ 結案日 {{ d.closed_date }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table List View -->
    <div v-else class="card table-view-card" style="padding:0; overflow:hidden;">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th width="40" style="padding: 14px 10px 14px 20px">
                <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
              </th>
              <th @click="toggleSort('id')" class="sortable-th">
                缺失編號 <span class="sort-icon">{{ sortingField === 'id' ? (sortingOrder === 'asc' ? '▲' : '▼') : '↕' }}</span>
              </th>
              <th @click="toggleSort('title')" class="sortable-th">
                缺失項目 <span class="sort-icon">{{ sortingField === 'title' ? (sortingOrder === 'asc' ? '▲' : '▼') : '↕' }}</span>
              </th>
              <th @click="toggleSort('work_area')" class="sortable-th">
                工區位置 <span class="sort-icon">{{ sortingField === 'work_area' ? (sortingOrder === 'asc' ? '▲' : '▼') : '↕' }}</span>
              </th>
              <th @click="toggleSort('risk_level')" class="sortable-th">
                風險等級 <span class="sort-icon">{{ sortingField === 'risk_level' ? (sortingOrder === 'asc' ? '▲' : '▼') : '↕' }}</span>
              </th>
              <th>責任人</th>
              <th @click="toggleSort('due_date')" class="sortable-th">
                改善期限 <span class="sort-icon">{{ sortingField === 'due_date' ? (sortingOrder === 'asc' ? '▲' : '▼') : '↕' }}</span>
              </th>
              <th @click="toggleSort('status')" class="sortable-th">
                狀態 <span class="sort-icon">{{ sortingField === 'status' ? (sortingOrder === 'asc' ? '▲' : '▼') : '↕' }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="sortedDefectsList.length === 0">
              <td colspan="8" style="text-align:center; color:var(--text-muted); padding:40px;">
                無相符的缺失資料
              </td>
            </tr>
            <tr v-for="d in sortedDefectsList" :key="d.id" :class="{ 'tr-selected': selectedDefectIds.includes(d.id) }">
              <td style="padding: 14px 10px 14px 20px">
                <input type="checkbox" v-model="selectedDefectIds" :value="d.id" />
              </td>
              <td style="font-family:'Outfit', sans-serif; font-size:12px; color:var(--text-muted);">
                #{{ d.id.slice(0, 8) }}
              </td>
              <td>
                <a href="javascript:void(0)" @click="openDefectDetail(d.id)" style="font-weight:600; color:var(--primary); text-decoration:none; hover:underline">
                  {{ d.title }}
                </a>
              </td>
              <td>{{ d.work_area }}</td>
              <td>
                <span class="badge" :class="riskBadge(d.risk_level)">{{ d.risk_level }}</span>
              </td>
              <td>{{ d.responsible_user_name || '-' }}</td>
              <td :style="{ color: isOverdue(d) ? 'var(--danger)' : '' }">
                {{ d.due_date || '-' }} <span v-if="isOverdue(d)" style="font-size:11px; font-weight:bold">(逾期)</span>
              </td>
              <td>
                <span class="badge" :class="statusBadge(d.status)">{{ d.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>通報工地安全缺失</h3>
          <button class="modal-close" @click="showCreateModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>缺失標題 *</label>
            <input v-model="form.title" type="text" class="form-control" placeholder="例：施工架未設置中欄桿" required />
          </div>
          <div class="form-group">
            <label>缺失詳細描述</label>
            <textarea v-model="form.description" class="form-control" placeholder="詳細說明缺失位置與安全危害..."></textarea>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label>工區位置 *</label>
              <select v-model="form.work_area" class="form-control">
                <option>A區基礎</option><option>B區主體</option>
                <option>C區外牆</option><option>D區機電</option>
              </select>
            </div>
            <div class="form-group">
              <label>責任改善人 *</label>
              <select v-model="form.responsible_user_id" class="form-control">
                <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }} ({{ u.role }})</option>
              </select>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label>改善期限 *</label>
              <input v-model="form.due_date" type="date" class="form-control" required />
            </div>
            <div class="form-group">
              <label>風險等級</label>
              <select v-model="form.risk_level" class="form-control">
                <option value="low">Low (低風險)</option>
                <option value="medium">Medium (中風險)</option>
                <option value="high">High (高風險)</option>
              </select>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label>嚴重程度 ({{ form.severity }}/5)</label>
              <input v-model="form.severity" type="range" min="1" max="5" class="risk-slider" />
            </div>
            <div class="form-group">
              <label>發生機率 ({{ form.probability }}/5)</label>
              <input v-model="form.probability" type="range" min="1" max="5" class="risk-slider" />
            </div>
          </div>
          <div class="risk-score-preview" :class="form.severity * form.probability >= 16 ? 'risk-high' : form.severity * form.probability >= 6 ? 'risk-medium' : 'risk-low'">
            風險分數：{{ form.severity * form.probability }} /25
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreateModal = false">取消</button>
          <button class="btn btn-warning" :disabled="submitting" @click="handleCreate">
            {{ submitting ? '送出中...' : '送出通報' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetailModal && selectedDefect" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>缺失詳情</h3>
          <button class="modal-close" @click="showDetailModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-title-row">
            <span>{{ selectedDefect.title }}</span>
            <div style="display:flex; gap:6px;">
              <span class="badge" :class="riskBadge(selectedDefect.risk_level)">{{ selectedDefect.risk_level }}</span>
              <span class="badge badge-secondary">{{ selectedDefect.status }}</span>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item"><span class="meta-key">工區</span><span>{{ selectedDefect.work_area }}</span></div>
            <div class="meta-item"><span class="meta-key">負責人</span><span>{{ selectedDefect.responsible_user_name || '-' }}</span></div>
            <div class="meta-item"><span class="meta-key">改善期限</span><span>{{ selectedDefect.due_date || '-' }}</span></div>
            <div class="meta-item"><span class="meta-key">通報日期</span><span>{{ selectedDefect.created_at?.split('T')[0] }}</span></div>
          </div>

          <div v-if="selectedDefect.description" class="description-box">{{ selectedDefect.description }}</div>

          <!-- Resolved Block -->
          <div v-if="selectedDefect.resolved_notes" class="resolved-block">
            <strong>✔ 改善說明：</strong>{{ selectedDefect.resolved_notes }}
            <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">改善日期：{{ selectedDefect.resolved_date }}</div>
          </div>

          <!-- Resolve notes input (if in_progress + has permission) -->
          <div v-if="selectedDefect.status === 'in_progress' && availableActions.some(a => a.needsNotes)" class="form-group" style="margin-top:16px;">
            <label>改善說明備註（申報時必填）</label>
            <textarea v-model="resolveNotes" class="form-control" placeholder="請描述已採取的改善對策..."></textarea>
          </div>

          <!-- Risk Assessment -->
          <div v-if="selectedDefect.risk_assessment" class="risk-block">
            <div class="risk-score-label">
              風險分數：{{ selectedDefect.risk_assessment.risk_score }} /25
              (S{{ selectedDefect.risk_assessment.severity }} × P{{ selectedDefect.risk_assessment.probability }})
            </div>
            <div v-if="selectedDefect.risk_assessment.ai_suggestion" class="ai-suggestion">
              {{ selectedDefect.risk_assessment.ai_suggestion }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            v-if="can.manageDefect.value"
            class="btn btn-danger btn-sm"
            @click="handleDelete(selectedDefect.id)"
          >刪除</button>
          <button class="btn btn-secondary" @click="showDetailModal = false">關閉</button>
          <button
            v-for="action in availableActions"
            :key="action.status"
            class="btn"
            :class="`btn-${action.type}`"
            :disabled="submitting"
            @click="handleStatusChange(action.status, action.needsNotes ? resolveNotes : undefined)"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-bar { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 20px; }
.filter-bar .form-group { min-width: 140px; }

/* View toggle switch */
.view-toggle {
  display: flex;
  background: #E2E8F0;
  border-radius: var(--radius-sm);
  padding: 2px;
  border: 1px solid var(--border);
}

.toggle-btn {
  border: none;
  background: transparent;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.toggle-btn.active {
  background: white;
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

/* Bulk Action Bar */
.bulk-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  background: #FFF7ED;
  border: 1px solid #FFEDD5;
  margin-bottom: 20px;
  border-left: 4px solid var(--warning);
  animation: slideDown 0.25s ease-out;
}

@keyframes slideDown {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.bulk-info {
  font-size: 14px;
  font-weight: 500;
  color: var(--secondary);
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.bulk-action-group {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  border-right: 1px solid #FED7AA;
  padding-right: 20px;
}

.bulk-group-label {
  font-weight: 600;
  margin-right: 4px;
}

.sortable-th {
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.sortable-th:hover {
  background: #F1F5F9;
}

.sort-icon {
  font-size: 9px;
  margin-left: 4px;
  color: var(--text-muted);
}

.tr-selected td {
  background: #FFFBEB !important;
}

.table-view-card {
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
}

/* Kanban styles */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1200px) { .kanban-board { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) {
  .kanban-board { grid-template-columns: 1fr; }
  .bulk-action-bar { flex-direction: column; gap: 12px; align-items: stretch; }
  .bulk-actions { flex-direction: column; align-items: stretch; gap: 10px; }
  .bulk-action-group { border-right: none; padding-right: 0; }
}

.kanban-col {
  background: #F1F5F9;
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid var(--border);
  min-height: 400px;
  display: flex; flex-direction: column; gap: 10px;
}

.kanban-col-closed { opacity: 0.85; }

.kanban-header {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 8px;
}

.kanban-count {
  background: #E2E8F0; color: var(--secondary);
  font-size: 12px; font-weight: 700;
  padding: 2px 8px; border-radius: 10px;
}

.kanban-empty {
  text-align: center; padding: 32px 0;
  color: var(--text-muted); font-size: 12px;
  border: 2px dashed var(--border); border-radius: 8px;
}

.kanban-cards { display: flex; flex-direction: column; gap: 10px; flex: 1; }

.defect-card {
  background: white; border-radius: var(--radius-sm);
  border: 1px solid var(--border); box-shadow: var(--shadow-sm);
  padding: 14px; cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.defect-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.defect-closed { opacity: 0.75; }

.defect-card-top { display: flex; justify-content: space-between; margin-bottom: 8px; }
.defect-area { font-size: 11px; color: var(--text-muted); font-weight: 500; }
.defect-title { font-size: 13px; font-weight: 600; margin-bottom: 6px; line-height: 1.3; }
.defect-desc {
  font-size: 11px; color: var(--text-muted); margin-bottom: 10px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}

.defect-meta {
  display: flex; justify-content: space-between;
  font-size: 11px; color: var(--text-muted);
  border-top: 1px solid #F1F5F9; padding-top: 8px;
}

.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.risk-slider { width: 100%; height: 6px; accent-color: var(--warning); }

.risk-score-preview {
  text-align: center; padding: 12px; border-radius: 8px;
  font-weight: 700; font-size: 14px; margin-top: 8px;
}

.risk-high { background: #FEE2E2; color: var(--danger); }
.risk-medium { background: #FEF3C7; color: #92400E; }
.risk-low { background: #DCFCE7; color: var(--success); }

.detail-title-row {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 12px; font-size: 16px; font-weight: 700; margin-bottom: 16px;
}

.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.meta-item { display: flex; flex-direction: column; gap: 4px; }
.meta-key { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }

.description-box {
  background: #F8FAFC; border: 1px solid var(--border);
  border-radius: 8px; padding: 12px; font-size: 13px; line-height: 1.5;
  white-space: pre-wrap; color: var(--secondary); margin-bottom: 16px;
}

.resolved-block {
  background: #F0FDF4; border-left: 4px solid var(--success);
  padding: 14px; border-radius: 0 8px 8px 0; margin-bottom: 16px;
  font-size: 13px; color: #166534;
}

.risk-block {
  background: #F8FAFC; border: 1px solid var(--border);
  border-radius: 8px; padding: 14px; margin-top: 16px;
}

.risk-score-label { font-size: 13px; font-weight: 700; margin-bottom: 8px; }

.ai-suggestion {
  font-size: 12px; color: var(--secondary); line-height: 1.5;
  border-left: 3px solid var(--warning); padding-left: 10px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--warning);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* slide-fade transition */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.25s ease-out;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
