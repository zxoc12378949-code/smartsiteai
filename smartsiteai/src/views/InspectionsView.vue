<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { inspectionsApi, usersApi } from '@/api'
import { useAuth, useProjectStore, useToast } from '@/store'
import type { Inspection, InspectionDetail, User } from '@/api'

const { currentUser, can } = useAuth()
const { activeProject } = useProjectStore()
const { show } = useToast()

const inspections = ref<Inspection[]>([])
const loading = ref(true)
const showModal = ref(false)
const showDetailModal = ref(false)
const submitting = ref(false)
const selectedDetail = ref<InspectionDetail | null>(null)
const users = ref<User[]>([])

// Filters
const filterArea = ref('')
const filterStatus = ref('')
const searchQ = ref('')

// Form fields
const form = ref({
  inspection_date: '',
  work_area: 'A區基礎',
  notes: '',
  status: 'pass' as 'pass' | 'warning' | 'fail',
  helmet: 'normal',
  scaffold: 'normal',
  electrical: 'normal',
  fall: 'normal',
  storage: 'normal',
  housekeeping: 'normal',
})

const checklistItems = [
  { key: 'helmet', label: '安全帽配戴 (Safety Helmet Compliance)' },
  { key: 'scaffold', label: '施工架安全 (Scaffold Safety)' },
  { key: 'electrical', label: '用電安全 (Electrical Safety)' },
  { key: 'fall', label: '防墜設施 (Fall Protection)' },
  { key: 'storage', label: '物料堆放 (Material Storage)' },
  { key: 'housekeeping', label: '工地整理整頓 (Site Housekeeping)' },
]

const resultOptions = [
  { value: 'normal', label: '合格', class: 'opt-pass' },
  { value: 'abnormal', label: '不合格', class: 'opt-fail' },
]

const filtered = computed(() => {
  return inspections.value.filter(i => {
    if (filterArea.value && i.work_area !== filterArea.value) return false
    if (filterStatus.value && i.status !== filterStatus.value) return false
    if (searchQ.value) {
      const q = searchQ.value.toLowerCase()
      if (!`${i.inspector_name} ${i.work_area} ${i.project_name} ${i.notes}`.toLowerCase().includes(q)) return false
    }
    return true
  })
})

const statusBadge = (s: string) =>
  s === 'pass' ? 'badge-success' : s === 'warning' ? 'badge-warning' : 'badge-danger'

const computedResult = computed(() => {
  const vals = checklistItems.map(c => (form.value as any)[c.key])
  if (vals.some(v => v === 'abnormal')) return 'fail'
  return 'pass'
})

const passRate = (detail: InspectionDetail) => {
  if (!detail.items.length) return '100%'
  const pass = detail.items.filter(i => i.result === 'normal').length
  return `${Math.round((pass / detail.items.length) * 100)}%`
}

function openNewModal() {
  form.value = {
    inspection_date: new Date().toISOString().split('T')[0],
    work_area: 'A區基礎',
    notes: '',
    status: 'pass' as const,
    helmet: 'normal', scaffold: 'normal', electrical: 'normal',
    fall: 'normal', storage: 'normal', housekeeping: 'normal',
  }
  showModal.value = true
}

async function openDetail(id: string) {
  try {
    selectedDetail.value = await inspectionsApi.get(id)
    showDetailModal.value = true
  } catch (e: any) {
    show(e.message, 'danger')
  }
}

async function handleDelete(id: string) {
  if (!confirm('確定要刪除此巡檢紀錄？')) return
  try {
    await inspectionsApi.delete(id)
    show('巡檢紀錄已刪除', 'success')
    await loadData()
  } catch (e: any) {
    show(e.message, 'danger')
  }
}

async function handleSubmit() {
  if (!form.value.inspection_date || !form.value.work_area) {
    show('請填寫必要欄位', 'warning')
    return
  }
  if (!activeProject.value) {
    show('請先選擇工地專案', 'warning')
    return
  }

  submitting.value = true
  try {
    const items = checklistItems.map(c => ({
      item_name: c.label.split('(')[0].trim(),
      result: (form.value as any)[c.key]
    }))

    await inspectionsApi.create({
      project_id: activeProject.value!.id,
      inspector_id: currentUser.value!.id,
      inspection_date: form.value.inspection_date,
      work_area: form.value.work_area,
      status: computedResult.value as 'pass' | 'warning' | 'fail',
      notes: form.value.notes,
      items,
    })

    show(
      computedResult.value === 'fail'
        ? '巡檢不合格，系統已自動生成缺失卡片！'
        : '巡檢紀錄儲存成功',
      computedResult.value === 'fail' ? 'danger' : 'success'
    )
    showModal.value = false
    await loadData()
  } catch (e: any) {
    show(e.message, 'danger')
  } finally {
    submitting.value = false
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const [ins, usrs] = await Promise.all([
      inspectionsApi.list({ project_id: activeProject.value?.id }),
      usersApi.list(),
    ])
    inspections.value = ins
    users.value = usrs
  } catch (e: any) {
    show(e.message || '載入失敗', 'danger')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div>
    <!-- Filters + New Button -->
    <div class="filter-bar card">
      <div class="form-group" style="margin:0">
        <label>工區篩選</label>
        <select v-model="filterArea" class="form-control">
          <option value="">全部工區</option>
          <option>A區基礎</option><option>B區主體</option>
          <option>C區外牆</option><option>D區機電</option>
        </select>
      </div>
      <div class="form-group" style="margin:0">
        <label>結果篩選</label>
        <select v-model="filterStatus" class="form-control">
          <option value="">全部</option>
          <option value="pass">Pass (合格)</option>
          <option value="warning">Warning (警告)</option>
          <option value="fail">Fail (不合格)</option>
        </select>
      </div>
      <div class="form-group" style="margin:0">
        <label>關鍵字</label>
        <input v-model="searchQ" type="text" class="form-control" placeholder="搜尋人員、工區..." />
      </div>
      <button v-if="can.createInspection.value" class="btn btn-warning" @click="openNewModal">
        + 新增巡檢
      </button>
    </div>

    <!-- Table -->
    <div class="card" style="padding:0; overflow:hidden;">
      <div v-if="loading" style="padding:48px; text-align:center; color:var(--text-muted)">載入中...</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>巡檢日期</th>
              <th>工區</th>
              <th>巡檢員</th>
              <th>合格率</th>
              <th>綜合結果</th>
              <th>備註</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="7" style="text-align:center; color:var(--text-muted); padding:32px;">查無巡檢紀錄</td>
            </tr>
            <tr v-for="i in filtered" :key="i.id">
              <td style="font-weight:600">{{ i.inspection_date }}</td>
              <td><span class="badge badge-secondary">{{ i.work_area }}</span></td>
              <td>{{ i.inspector_name }}</td>
              <td>-</td>
              <td><span class="badge" :class="statusBadge(i.status)">{{ i.status }}</span></td>
              <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-muted); font-size:12px;">{{ i.notes || '-' }}</td>
              <td>
                <div style="display:flex; gap:6px;">
                  <button class="btn btn-secondary btn-sm" @click="openDetail(i.id)">詳情</button>
                  <button v-if="can.manageDefect.value" class="btn btn-danger btn-sm" @click="handleDelete(i.id)">刪除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Inspection Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>新增工地巡檢紀錄</h3>
          <button class="modal-close" @click="showModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row-2">
            <div class="form-group">
              <label>巡檢日期 *</label>
              <input v-model="form.inspection_date" type="date" class="form-control" required />
            </div>
            <div class="form-group">
              <label>巡檢工區 *</label>
              <select v-model="form.work_area" class="form-control">
                <option>A區基礎</option><option>B區主體</option>
                <option>C區外牆</option><option>D區機電</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>安全檢查清單</label>
            <div class="checklist-grid">
              <div v-for="item in checklistItems" :key="item.key" class="checklist-item">
                <span class="checklist-label">{{ item.label }}</span>
                <div class="checklist-options">
                  <label v-for="opt in resultOptions" :key="opt.value" class="opt-label" :class="opt.class">
                    <input type="radio" :name="item.key" :value="opt.value" v-model="(form as any)[item.key]" />
                    {{ opt.label }}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Computed Result Preview -->
          <div class="result-preview" :class="`result-${computedResult}`">
            綜合結果預測：<strong>{{ computedResult.toUpperCase() }}</strong>
          </div>

          <div class="form-group">
            <label>巡勘備註說明</label>
            <textarea v-model="form.notes" class="form-control" placeholder="請填寫細部狀況或特殊注記..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModal = false">取消</button>
          <button class="btn btn-warning" :disabled="submitting" @click="handleSubmit">
            {{ submitting ? '儲存中...' : '儲存巡檢' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetailModal && selectedDetail" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>巡檢詳情</h3>
          <button class="modal-close" @click="showDetailModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-meta">
            <div class="meta-item"><span class="meta-key">巡檢日期</span><span>{{ selectedDetail.inspection_date }}</span></div>
            <div class="meta-item"><span class="meta-key">工區</span><span>{{ selectedDetail.work_area }}</span></div>
            <div class="meta-item"><span class="meta-key">巡檢員</span><span>{{ selectedDetail.inspector_name }}</span></div>
            <div class="meta-item">
              <span class="meta-key">結果</span>
              <span class="badge" :class="statusBadge(selectedDetail.status)">{{ selectedDetail.status }}</span>
            </div>
            <div class="meta-item"><span class="meta-key">合格率</span><span>{{ passRate(selectedDetail) }}</span></div>
          </div>

          <div class="checklist-result-list">
            <div v-for="item in selectedDetail.items" :key="item.id" class="checklist-result-item">
              <span>{{ item.item_name }}</span>
              <span class="badge" :class="item.result === 'normal' ? 'badge-success' : 'badge-danger'">
                {{ item.result === 'normal' ? 'Pass' : 'Fail' }}
              </span>
            </div>
          </div>

          <div v-if="selectedDetail.notes" style="margin-top:16px;">
            <div class="meta-key" style="margin-bottom:6px;">備註說明</div>
            <div class="notes-box">{{ selectedDetail.notes }}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDetailModal = false">關閉</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex; gap: 16px; align-items: flex-end;
  flex-wrap: wrap; margin-bottom: 20px;
}

.filter-bar .form-group { min-width: 160px; margin: 0; }

.table-wrap { overflow-x: auto; }

.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.checklist-grid { display: flex; flex-direction: column; gap: 10px; }

.checklist-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; border: 1px solid var(--border);
  border-radius: 8px; background: #F8FAFC;
}

.checklist-label { font-size: 13px; font-weight: 500; flex: 1; }

.checklist-options { display: flex; gap: 16px; }

.opt-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; cursor: pointer;
}

.opt-pass input:checked + span, .opt-pass { color: var(--success); }
.opt-fail input:checked + span, .opt-fail { color: var(--danger); }

.result-preview {
  padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;
  font-size: 14px; font-weight: 600; text-align: center;
}

.result-pass { background: #DCFCE7; color: var(--success); }
.result-fail { background: #FEE2E2; color: var(--danger); }

.detail-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }

.meta-item { display: flex; flex-direction: column; gap: 4px; }
.meta-key { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }

.checklist-result-list { display: flex; flex-direction: column; gap: 8px; }

.checklist-result-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; background: #F8FAFC;
  border: 1px solid var(--border); border-radius: 6px; font-size: 13px;
}

.notes-box {
  background: #F8FAFC; border: 1px solid var(--border);
  border-radius: 8px; padding: 12px; font-size: 13px;
  line-height: 1.5; white-space: pre-wrap; color: var(--secondary);
}
</style>
