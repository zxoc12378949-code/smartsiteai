<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { defectsApi, inspectionsApi } from '@/api'
import { useProjectStore, useToast } from '@/store'
import type { Defect, Inspection } from '@/api'

const { activeProject } = useProjectStore()
const { show } = useToast()

const defects = ref<Defect[]>([])
const inspections = ref<Inspection[]>([])
const loading = ref(true)

const filterArea = ref('')
const dateStart = ref('2026-06-01')
const dateEnd = ref(new Date().toISOString().split('T')[0])

const filteredDefects = computed(() => {
  return defects.value.filter(d => {
    if (filterArea.value && d.work_area !== filterArea.value) return false
    const createdDay = d.created_at ? d.created_at.split('T')[0] : ''
    if (dateStart.value && createdDay && createdDay < dateStart.value) return false
    if (dateEnd.value && createdDay && createdDay > dateEnd.value) return false
    return true
  })
})

const filteredInspections = computed(() => {
  return inspections.value.filter(i => {
    if (filterArea.value && i.work_area !== filterArea.value) return false
    if (dateStart.value && i.inspection_date < dateStart.value) return false
    if (dateEnd.value && i.inspection_date > dateEnd.value) return false
    return true
  })
})

const summary = computed(() => {
  const defs = filteredDefects.value
  const ins = filteredInspections.value
  const resolved = defs.filter(d => d.status === 'resolved' || d.status === 'closed')
  return {
    totalInspections: ins.length,
    totalDefects: defs.length,
    resolvedCount: resolved.length,
    resolutionRate: defs.length > 0 ? Math.round((resolved.length / defs.length) * 100) : 100,
  }
})

const riskBadge = (level: string) =>
  level === 'high' ? 'badge-danger' : level === 'medium' ? 'badge-warning' : 'badge-secondary'

const statusBadge = (status: string) =>
  status === 'open' ? 'badge-danger' :
  status === 'in_progress' ? 'badge-warning' :
  status === 'resolved' ? 'badge-primary' : 'badge-success'

function exportCSV() {
  const defs = filteredDefects.value
  if (defs.length === 0) { show('查無可匯出資料', 'warning'); return }

  let csv = '\uFEFF缺失編號,缺失標題,工區,負責人,通報日期,改善期限,風險等級,目前狀態,改善說明\r\n'
  defs.forEach(d => {
    csv += `"${d.id}","${d.title}","${d.work_area}","${d.responsible_user_name || ''}","${d.created_at?.split('T')[0] || ''}","${d.due_date || ''}","${d.risk_level}","${d.status}","${d.resolved_notes || ''}"\r\n`
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `SmartSite_Report_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  show('CSV 報表已匯出', 'success')
}

function exportPDF() {
  window.print()
}

const loadData = async () => {
  loading.value = true
  try {
    const [defs, ins] = await Promise.all([
      defectsApi.list({ project_id: activeProject.value?.id }),
      inspectionsApi.list({ project_id: activeProject.value?.id }),
    ])
    defects.value = defs
    inspections.value = ins
  } catch (e: any) {
    show(e.message, 'danger')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div id="report-section">
    <!-- Filter Bar -->
    <div class="filter-bar card no-print">
      <div class="form-group" style="margin:0">
        <label>工區範圍</label>
        <select v-model="filterArea" class="form-control">
          <option value="">全部工區</option>
          <option>A區基礎</option><option>B區主體</option>
          <option>C區外牆</option><option>D區機電</option>
        </select>
      </div>
      <div class="form-group" style="margin:0">
        <label>開始日期</label>
        <input v-model="dateStart" type="date" class="form-control" />
      </div>
      <div class="form-group" style="margin:0">
        <label>結束日期</label>
        <input v-model="dateEnd" type="date" class="form-control" />
      </div>
      <div style="display:flex; gap:8px; align-self:flex-end;">
        <button class="btn btn-secondary" @click="exportCSV">
          📥 匯出 Excel
        </button>
        <button class="btn btn-warning" @click="exportPDF">
          🖨️ 匯出 PDF
        </button>
      </div>
    </div>

    <!-- Print Title -->
    <div class="print-only print-title">
      <h1>SmartSite AI 工地安全管理報告</h1>
      <p>工地：{{ activeProject?.name }} | 期間：{{ dateStart }} ~ {{ dateEnd }} | 產出日期：{{ new Date().toLocaleDateString('zh-TW') }}</p>
    </div>

    <!-- Summary KPIs -->
    <div class="kpi-row" v-if="!loading">
      <div class="kpi-mini-card">
        <div class="kpi-mini-val">{{ summary.totalInspections }}</div>
        <div class="kpi-mini-label">期間巡檢次數</div>
      </div>
      <div class="kpi-mini-card">
        <div class="kpi-mini-val">{{ summary.totalDefects }}</div>
        <div class="kpi-mini-label">新增缺失總計</div>
      </div>
      <div class="kpi-mini-card">
        <div class="kpi-mini-val" style="color:var(--success)">{{ summary.resolvedCount }}</div>
        <div class="kpi-mini-label">累計改善完成</div>
      </div>
      <div class="kpi-mini-card">
        <div class="kpi-mini-val" style="color:var(--success)">{{ summary.resolutionRate }}%</div>
        <div class="kpi-mini-label">缺失改善率</div>
      </div>
    </div>

    <!-- Defects Detail Table -->
    <div class="card" style="padding:0; overflow:hidden; margin-top:20px;">
      <div class="section-header" style="padding:20px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
        <h3>缺失改善明細報表</h3>
        <span class="badge badge-secondary">共 {{ filteredDefects.length }} 筆</span>
      </div>
      <div v-if="loading" style="padding:48px; text-align:center; color:var(--text-muted)">載入中...</div>
      <div v-else style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>缺失項目</th>
              <th>工區</th>
              <th>責任人</th>
              <th>通報日期</th>
              <th>改善期限</th>
              <th>風險等級</th>
              <th>目前狀態</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredDefects.length === 0">
              <td colspan="8" style="text-align:center; color:var(--text-muted); padding:32px;">查無相符資料</td>
            </tr>
            <tr v-for="(d, i) in filteredDefects" :key="d.id">
              <td style="color:var(--text-muted); font-size:12px;">{{ i + 1 }}</td>
              <td style="font-weight:600; max-width:240px;">{{ d.title }}</td>
              <td>{{ d.work_area }}</td>
              <td>{{ d.responsible_user_name || '-' }}</td>
              <td>{{ d.created_at?.split('T')[0] }}</td>
              <td>{{ d.due_date || '-' }}</td>
              <td><span class="badge" :class="riskBadge(d.risk_level)">{{ d.risk_level }}</span></td>
              <td><span class="badge" :class="statusBadge(d.status)">{{ d.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Inspections Table -->
    <div class="card" style="padding:0; overflow:hidden; margin-top:20px;">
      <div style="padding:20px 24px; border-bottom:1px solid var(--border);">
        <h3>巡檢紀錄明細</h3>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr><th>日期</th><th>工區</th><th>巡檢員</th><th>結果</th><th>備註</th></tr>
          </thead>
          <tbody>
            <tr v-for="i in filteredInspections" :key="i.id">
              <td>{{ i.inspection_date }}</td>
              <td>{{ i.work_area }}</td>
              <td>{{ i.inspector_name || '-' }}</td>
              <td>
                <span class="badge" :class="i.status === 'pass' ? 'badge-success' : i.status === 'warning' ? 'badge-warning' : 'badge-danger'">
                  {{ i.status }}
                </span>
              </td>
              <td style="max-width:200px; font-size:12px; color:var(--text-muted);">{{ i.notes || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-bar { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 20px; }

.kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }

.kpi-mini-card {
  background: white; border-radius: var(--radius-md);
  border: 1px solid var(--border); box-shadow: var(--shadow-sm);
  padding: 20px; text-align: center;
}

.kpi-mini-val { font-family: 'Outfit', sans-serif; font-size: 30px; font-weight: 800; margin-bottom: 6px; }
.kpi-mini-label { font-size: 12px; color: var(--text-muted); font-weight: 500; }

/* Print styles */
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  .filter-bar { display: none !important; }
}

.print-only { display: none; }

.print-title h1 { font-size: 20px; margin-bottom: 4px; }
.print-title p { font-size: 12px; color: var(--text-muted); margin-bottom: 20px; }
</style>
