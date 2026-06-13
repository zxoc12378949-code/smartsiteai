<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { dashboardApi, defectsApi } from '@/api'
import { useProjectStore, useToast } from '@/store'
import type { DashboardSummary, DashboardCharts, Defect } from '@/api'

const { activeProject } = useProjectStore()
const { show } = useToast()

const summary = ref<DashboardSummary | null>(null)
const charts = ref<DashboardCharts | null>(null)
const recentDefects = ref<Defect[]>([])
const loading = ref(true)

const riskBadge = (level: string) =>
  level === 'high' ? 'badge-danger' : level === 'medium' ? 'badge-warning' : 'badge-secondary'

const statusBadge = (status: string) =>
  status === 'open' ? 'badge-danger' :
  status === 'in_progress' ? 'badge-warning' :
  status === 'resolved' ? 'badge-primary' : 'badge-success'

const isOverdue = (d: Defect) =>
  d.due_date && new Date(d.due_date) < new Date() && d.status !== 'resolved' && d.status !== 'closed'

const completionPct = (rate: number) => Math.round(rate * 100)

const last6Months = computed(() => {
  const months = []
  const d = new Date()
  for (let i = 5; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
    const yyyy = m.getFullYear()
    const mm = String(m.getMonth() + 1).padStart(2, '0')
    months.push(`${yyyy}-${mm}`)
  }
  return months
})

// Donut chart calculations
const donutData = computed(() => {
  if (!charts.value) return []
  const dist = charts.value.status_distribution || []
  const total = dist.reduce((sum, item) => sum + item.count, 0)
  
  let currentOffset = 0
  const C = 188.49
  
  const colors: Record<string, string> = {
    open: 'var(--danger)',
    in_progress: 'var(--warning)',
    resolved: '#3B82F6',
    closed: 'var(--success)'
  }
  
  const labels: Record<string, string> = {
    open: '待改善 (Open)',
    in_progress: '改善中 (In Progress)',
    resolved: '已完成 (Resolved)',
    closed: '已結案 (Closed)'
  }

  return dist.map(item => {
    const pct = total > 0 ? item.count / total : 0
    const dashArray = `${pct * C} ${C - (pct * C)}`
    const dashOffset = -currentOffset
    currentOffset += pct * C
    return {
      status: item.status,
      label: labels[item.status] || item.status,
      count: item.count,
      color: colors[item.status] || '#94A3B8',
      dashArray,
      dashOffset,
      pct: Math.round(pct * 100)
    }
  })
})

const donutTotal = computed(() => donutData.value.reduce((sum, item) => sum + item.count, 0))

// Stacked Bar chart calculations (Inspection Completion Trend)
const barChartData = computed(() => {
  if (!charts.value) return []
  const trend = charts.value.inspection_trend || []
  return last6Months.value.map(m => {
    const items = trend.filter(t => t.month === m)
    const passCount = items.filter(t => t.status === 'pass' || t.status === 'warning').reduce((sum, i) => sum + i.count, 0)
    const failCount = items.filter(t => t.status === 'fail').reduce((sum, i) => sum + i.count, 0)
    return {
      month: m.slice(5) + '月',
      pass: passCount,
      fail: failCount,
      total: passCount + failCount
    }
  })
})

const barMaxVal = computed(() => {
  const max = Math.max(...barChartData.value.map(d => d.total), 5)
  return Math.ceil(max / 5) * 5
})

// Line chart calculations (High Risk Trend)
const lineChartData = computed(() => {
  if (!charts.value) return []
  const trend = charts.value.risk_trend || []
  return last6Months.value.map(m => {
    const found = trend.find(t => t.month === m)
    return {
      month: m.slice(5) + '月',
      count: found ? found.count : 0
    }
  })
})

const lineMaxVal = computed(() => {
  const max = Math.max(...lineChartData.value.map(d => d.count), 5)
  return Math.ceil(max / 5) * 5
})

const linePathData = (isArea: boolean) => {
  const data = lineChartData.value
  if (data.length === 0) return ''
  const max = lineMaxVal.value
  const points = data.map((d, idx) => ({
    x: 48 + idx * 42,
    y: 120 - (d.count / max) * 100
  }))

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]
    const p1 = points[i]
    const cpX1 = p0.x + 18
    const cpY1 = p0.y
    const cpX2 = p1.x - 18
    const cpY2 = p1.y
    d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`
  }

  if (isArea) {
    d += ` L ${points[points.length - 1].x} 120 L ${points[0].x} 120 Z`
  }
  return d
}

const loadData = async () => {
  loading.value = true
  try {
    const pid = activeProject.value?.id
    const [sum, ch, defs] = await Promise.all([
      dashboardApi.summary(pid),
      dashboardApi.charts(pid),
      defectsApi.list({ project_id: pid, status: 'open' }),
    ])
    summary.value = sum
    charts.value = ch
    recentDefects.value = defs.slice(0, 5)
  } catch (e: any) {
    show(e.message || '資料載入失敗', 'danger')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="dashboard">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>資料載入中...</p>
    </div>

    <template v-else-if="summary">
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-body">
            <p class="kpi-label">巡檢總數</p>
            <div class="kpi-value">{{ summary.total_inspections }}</div>
            <div class="kpi-sub trend-up">↑ 本月累積</div>
          </div>
          <div class="kpi-icon kpi-icon-blue">📋</div>
        </div>

        <div class="kpi-card kpi-card-warn">
          <div class="kpi-body">
            <p class="kpi-label">未完成缺失</p>
            <div class="kpi-value" style="color: var(--warning)">{{ summary.open_defects }}</div>
            <div class="kpi-sub trend-warn">待改善 / 改善中</div>
          </div>
          <div class="kpi-icon kpi-icon-warn">⚠️</div>
        </div>

        <div class="kpi-card kpi-card-danger">
          <div class="kpi-body">
            <p class="kpi-label">高風險缺失</p>
            <div class="kpi-value" style="color: var(--danger)">{{ summary.high_risk_defects }}</div>
            <div class="kpi-sub trend-down">需立即處理</div>
          </div>
          <div class="kpi-icon kpi-icon-danger">🔴</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-body">
            <p class="kpi-label">缺失改善率</p>
            <div class="kpi-value" style="color: var(--success)">{{ completionPct(summary.completion_rate) }}%</div>
            <div class="kpi-sub trend-up">目標 85%</div>
          </div>
          <div class="kpi-icon kpi-icon-green">✅</div>
        </div>
      </div>

      <!-- Charts Area -->
      <div class="charts-grid" v-if="charts">
        <!-- Defect Status Distribution (Donut Chart) -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>缺失狀態分布</h3>
          </div>
          <div class="donut-chart-box">
            <div class="donut-svg-wrapper">
              <svg viewBox="0 0 100 100" class="donut-svg">
                <g transform="rotate(-90 50 50)">
                  <circle cx="50" cy="50" r="30" fill="none" stroke="#E2E8F0" stroke-width="8"></circle>
                  <circle
                    v-for="item in donutData"
                    :key="item.status"
                    cx="50"
                    cy="50"
                    r="30"
                    fill="none"
                    :stroke="item.color"
                    stroke-width="8"
                    :stroke-dasharray="item.dashArray"
                    :stroke-dashoffset="item.dashOffset"
                    stroke-linecap="round"
                    class="donut-segment"
                  ></circle>
                </g>
                <text x="50" y="45" text-anchor="middle" font-size="10" fill="var(--text-muted)" font-weight="500">總缺失</text>
                <text x="50" y="64" text-anchor="middle" font-size="20" font-weight="800" fill="var(--text-main)" font-family="'Outfit', sans-serif">{{ donutTotal }}</text>
              </svg>
            </div>
            <div class="donut-legend">
              <div v-for="item in donutData" :key="item.status" class="donut-legend-item">
                <div class="legend-info">
                  <span class="legend-color-dot" :style="{ backgroundColor: item.color }"></span>
                  <span class="legend-label">{{ item.label }}</span>
                </div>
                <div class="legend-vals">
                  <span class="legend-count">{{ item.count }}</span>
                  <span class="legend-pct">{{ item.pct }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Inspection Completion Trend (Bar Chart) -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>巡檢結果趨勢 (最近6個月)</h3>
          </div>
          <div class="svg-chart-container">
            <svg viewBox="0 0 300 150" class="bar-chart-svg">
              <!-- Grid lines -->
              <line v-for="i in [0,1,2,3,4,5]" :key="i" x1="25" :y1="20 + i*20" x2="290" :y2="20 + i*20" stroke="#F1F5F9" stroke-width="1"></line>
              <text v-for="i in [0,1,2,3,4,5]" :key="i" x="20" :y="24 + (5-i)*20" text-anchor="end" font-size="9" fill="var(--text-muted)">{{ Math.round((barMaxVal / 5) * i) }}</text>

              <!-- Bars -->
              <g v-for="(d, idx) in barChartData" :key="d.month">
                <!-- Pass Bar -->
                <rect
                  :x="40 + idx*42"
                  :y="120 - ((d.pass + d.fail) / barMaxVal) * 100"
                  width="16"
                  :height="((d.pass + d.fail) / barMaxVal) * 100"
                  fill="url(#passGrad)"
                  rx="3"
                ></rect>
                <!-- Fail Bar -->
                <rect
                  v-if="d.fail > 0"
                  :x="40 + idx*42"
                  :y="120 - (d.fail / barMaxVal) * 100"
                  width="16"
                  :height="(d.fail / barMaxVal) * 100"
                  fill="url(#failGrad)"
                  rx="3"
                ></rect>
                
                <rect
                  :x="35 + idx*42"
                  y="10"
                  width="26"
                  height="115"
                  fill="transparent"
                  class="bar-hover-zone"
                >
                  <title>合格: {{ d.pass }} | 異常: {{ d.fail }}</title>
                </rect>

                <!-- X Axis labels -->
                <text :x="48 + idx*42" y="135" text-anchor="middle" font-size="10" fill="var(--text-muted)">{{ d.month }}</text>
              </g>

              <defs>
                <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#4ADE80" />
                  <stop offset="100%" stop-color="#22C55E" />
                </linearGradient>
                <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#F87171" />
                  <stop offset="100%" stop-color="#EF4444" />
                </linearGradient>
              </defs>
            </svg>
            <div class="chart-legend-row">
              <span class="legend-item"><span class="legend-color-dot" style="background:#22C55E"></span>合格巡檢</span>
              <span class="legend-item"><span class="legend-color-dot" style="background:#EF4444"></span>異常巡檢</span>
            </div>
          </div>
        </div>

        <!-- High Risk Trend (Line Chart) -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>高風險缺失趨勢 (最近6個月)</h3>
          </div>
          <div class="svg-chart-container">
            <svg viewBox="0 0 300 150" class="line-chart-svg">
              <!-- Grid lines -->
              <line v-for="i in [0,1,2,3,4,5]" :key="i" x1="25" :y1="20 + i*20" x2="290" :y2="20 + i*20" stroke="#F1F5F9" stroke-width="1"></line>
              <text v-for="i in [0,1,2,3,4,5]" :key="i" x="20" :y="24 + (5-i)*20" text-anchor="end" font-size="9" fill="var(--text-muted)">{{ Math.round((lineMaxVal / 5) * i) }}</text>

              <!-- Path Area -->
              <path
                v-if="lineChartData.length > 0"
                :d="linePathData(true)"
                fill="url(#lineAreaGrad)"
                stroke="none"
              ></path>

              <!-- Path Line -->
              <path
                v-if="lineChartData.length > 0"
                :d="linePathData(false)"
                fill="none"
                stroke="var(--warning)"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>

              <!-- Data Points -->
              <g v-for="(d, idx) in lineChartData" :key="d.month">
                <circle
                  :cx="48 + idx*42"
                  :cy="120 - (d.count / lineMaxVal) * 100"
                  r="4"
                  fill="white"
                  stroke="var(--warning)"
                  stroke-width="2"
                  class="line-point"
                >
                  <title>高風險缺失: {{ d.count }} 件</title>
                </circle>
                <text :x="48 + idx*42" y="135" text-anchor="middle" font-size="10" fill="var(--text-muted)">{{ d.month }}</text>
              </g>

              <defs>
                <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--warning)" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="var(--warning)" stop-opacity="0.0" />
                </linearGradient>
              </defs>
            </svg>
            <div class="chart-legend-row">
              <span class="legend-item"><span class="legend-color-dot" style="background:var(--warning)"></span>高風險缺失數量</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Active Defects Table -->
      <div class="section-card">
        <div class="section-header">
          <h3>待改善重要缺失</h3>
          <RouterLink to="/defects" class="btn btn-secondary btn-sm">查看全部</RouterLink>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>缺失項目</th>
                <th>工區</th>
                <th>負責人</th>
                <th>改善期限</th>
                <th>風險</th>
                <th>狀態</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="recentDefects.length === 0">
                <td colspan="6" style="text-align:center; color:var(--text-muted); padding:32px;">
                  🎉 目前無待改善缺失！
                </td>
              </tr>
              <tr v-for="d in recentDefects" :key="d.id">
                <td>
                  <RouterLink :to="`/defects`" style="font-weight:600; color:var(--primary); text-decoration:none;">
                    {{ d.title }}
                  </RouterLink>
                </td>
                <td>{{ d.work_area }}</td>
                <td>{{ d.responsible_user_name || '-' }}</td>
                <td :style="{ color: isOverdue(d) ? 'var(--danger)' : '' }">
                  {{ d.due_date }} {{ isOverdue(d) ? '(逾期)' : '' }}
                </td>
                <td><span class="badge" :class="riskBadge(d.risk_level)">{{ d.risk_level }}</span></td>
                <td><span class="badge" :class="statusBadge(d.status)">{{ d.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 400px; gap: 16px; color: var(--text-muted);
}

.spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--warning);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 28px;
}

.kpi-card {
  background: white; border-radius: var(--radius-md);
  border: 1px solid var(--border); box-shadow: var(--shadow-sm);
  padding: 24px;
  display: flex; justify-content: space-between; align-items: flex-start;
  transition: transform 0.2s, box-shadow 0.2s;
}

.kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

.kpi-label { font-size: 13px; color: var(--text-muted); font-weight: 500; margin-bottom: 8px; }
.kpi-value { font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 800; line-height: 1; margin-bottom: 8px; }
.kpi-sub { font-size: 12px; font-weight: 500; }
.trend-up { color: var(--success); }
.trend-down { color: var(--danger); }
.trend-warn { color: var(--warning); }

.kpi-icon { font-size: 28px; }

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 28px;
}

.chart-card {
  background: white; border-radius: var(--radius-md);
  border: 1px solid var(--border); box-shadow: var(--shadow-sm);
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.chart-header { margin-bottom: 16px; }
.chart-header h3 { font-size: 18px; color: var(--text-main); font-weight: 600; }

/* Donut Chart styles */
.donut-chart-box {
  display: flex;
  align-items: center;
  gap: 24px;
}

.donut-svg-wrapper {
  width: 160px;
  height: 160px;
  flex-shrink: 0;
}

.donut-svg {
  width: 100%;
  height: 100%;
}

.donut-segment {
  transition: stroke-dashoffset 0.5s ease-in-out;
}

.donut-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.donut-legend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.legend-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.legend-label {
  color: var(--text-muted);
  font-weight: 500;
}

.legend-vals {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-count {
  font-weight: 600;
  color: var(--text-main);
}

.legend-pct {
  color: var(--text-muted);
  font-size: 12px;
  width: 36px;
  text-align: right;
}

/* SVG charts containers */
.svg-chart-container {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}

.bar-chart-svg, .line-chart-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.bar-hover-zone {
  cursor: pointer;
}

.bar-hover-zone:hover + rect {
  opacity: 0.85;
}

.line-point {
  cursor: pointer;
  transition: r 0.2s;
}

.line-point:hover {
  r: 6;
}

.chart-legend-row {
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 13px;
  margin-top: 4px;
}

.chart-legend-row .legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-weight: 500;
}

.section-card {
  background: white; border-radius: var(--radius-md);
  border: 1px solid var(--border); box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.section-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}

.section-header h3 { font-size: 16px; }

.table-wrap { overflow-x: auto; }
</style>
