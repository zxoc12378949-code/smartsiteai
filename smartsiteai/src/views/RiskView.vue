<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { riskApi, defectsApi, dashboardApi } from '@/api'
import { useToast, useProjectStore } from '@/store'
import type { Defect, DashboardCharts } from '@/api'

const { activeProject } = useProjectStore()
const { show } = useToast()

const severity = ref(3)
const probability = ref(3)
const calculating = ref(false)

const score = computed(() => severity.value * probability.value)
const riskLevel = computed(() => score.value >= 16 ? 'high' : score.value >= 6 ? 'medium' : 'low')

const riskLevelLabel = computed(() => ({
  high: { text: 'High (高風險)', class: 'risk-high', bg: '#FEE2E2', color: '#991B1B' },
  medium: { text: 'Medium (中風險)', class: 'risk-medium', bg: '#FEF3C7', color: '#92400E' },
  low: { text: 'Low (低風險)', class: 'risk-low', bg: '#DCFCE7', color: '#166534' },
}[riskLevel.value]))

const selectedPreset = ref('harness')

const presets = [
  { value: 'harness', label: '高空作業人員未繫安全帶', s: 5, p: 4 },
  { value: 'scaffold', label: '施工架無搭設護欄與腳趾板', s: 4, p: 4 },
  { value: 'helmet', label: '工區入口人員未配戴安全帽', s: 3, p: 3 },
  { value: 'wiring', label: '臨時用電電線裸露且積水', s: 4, p: 5 },
  { value: 'storage', label: '逃生走道堆放易燃物阻礙通行', s: 3, p: 4 },
]

const aiRecommendations: Record<string, { immediate: string[]; prevention: string[] }> = {
  harness: {
    immediate: ['勒令該區高空作業暫停', '要求操作人員確實將安全帶掛鉤扣鎖於安全母索', '派安衛人員現場監督'],
    prevention: ['全面拉設水平安全母索', '實施現地入工安全講習', '嚴格處罰未掛鉤承商'],
  },
  scaffold: {
    immediate: ['限制人員攀登不完整施工架', '設置危險管制線張貼告示牌', '通知架子工立刻補設中欄桿及腳趾板'],
    prevention: ['施工架使用前須簽章驗收', '每日作業前進行自主安全檢查'],
  },
  helmet: {
    immediate: ['工地門口守衛攔阻未戴帽者進入', '提供備用安全帽並要求確實配戴', '違規者進行登記並扣款'],
    prevention: ['建立門禁卡結合安全帽偵測機制', '加強新進人員安衛教育訓練'],
  },
  wiring: {
    immediate: ['立即切斷異常配電箱電源迴路', '動用抽水機清除地面積水', '將電線架高或套入保護管'],
    prevention: ['所有臨時電箱必須上鎖並配備漏電斷路器', '每週指派電機工程師量測接地電阻'],
  },
  storage: {
    immediate: ['指派工班將阻礙通道的物料移至暫存區', '將易燃材料移至通風良好遠離火源處', '確保走道淨寬度大於1.2公尺'],
    prevention: ['推行工地5S管理制度', '下班前30分鐘為強制整理整頓時間'],
  },
}

function applyPreset(preset: typeof presets[0] | undefined) {
  if (!preset) return
  severity.value = preset.s
  probability.value = preset.p
}

const fallbackRec = { immediate: [] as string[], prevention: [] as string[] }
const currentPresetRec = computed(() => aiRecommendations[selectedPreset.value] ?? aiRecommendations['harness'] ?? fallbackRec)

// 5x5 Matrix data
const matrixCells = computed(() => {
  const rows = []
  for (let s = 5; s >= 1; s--) {
    const cols = []
    for (let p = 1; p <= 5; p++) {
      const sc = s * p
      const level = sc >= 16 ? 'high' : sc >= 6 ? 'medium' : 'low'
      const isActive = s === severity.value && p === probability.value
      cols.push({ s, p, score: sc, level, isActive })
    }
    rows.push({ s, cols })
  }
  return rows
})

function clickMatrix(s: number, p: number) {
  severity.value = s
  probability.value = p
}

// TAB & Dashboard calculations
const activeTab = ref<'matrix' | 'dashboard'>('matrix')
const defects = ref<Defect[]>([])
const charts = ref<DashboardCharts | null>(null)
const loading = ref(false)

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

const riskDistribution = computed(() => {
  const list = defects.value
  const high = list.filter(d => d.risk_level === 'high').length
  const medium = list.filter(d => d.risk_level === 'medium').length
  const low = list.filter(d => d.risk_level === 'low').length
  const total = high + medium + low
  
  const C = 188.49
  const weights = [
    { level: 'high', label: '高風險 (High)', count: high, color: 'var(--danger)' },
    { level: 'medium', label: '中風險 (Medium)', count: medium, color: 'var(--warning)' },
    { level: 'low', label: '低風險 (Low)', count: low, color: 'var(--success)' },
  ]
  
  let currentOffset = 0
  return weights.map(w => {
    const pct = total > 0 ? w.count / total : 0
    const dashArray = `${pct * C} ${C - (pct * C)}`
    const dashOffset = -currentOffset
    currentOffset += pct * C
    return {
      ...w,
      pct: Math.round(pct * 100),
      dashArray,
      dashOffset
    }
  })
})

const totalRiskCount = computed(() => defects.value.length)

const highRiskIssues = computed(() => {
  return defects.value.filter(d => d.risk_level === 'high' && d.status !== 'closed')
})

const riskTrendData = computed(() => {
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

const riskTrendMaxVal = computed(() => {
  const max = Math.max(...riskTrendData.value.map(d => d.count), 5)
  return Math.ceil(max / 5) * 5
})

const riskTrendPathData = (isArea: boolean) => {
  const data = riskTrendData.value
  if (data.length === 0) return ''
  const max = riskTrendMaxVal.value
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
  if (!activeProject.value) return
  loading.value = true
  try {
    const [defs, ch] = await Promise.all([
      defectsApi.list({ project_id: activeProject.value.id }),
      dashboardApi.charts(activeProject.value.id)
    ])
    defects.value = defs
    charts.value = ch
  } catch (e: any) {
    show(e.message || '載入風險數據失敗', 'danger')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="risk-page">
    <!-- Tab Controls -->
    <div class="tabs-nav card no-print">
      <button class="tab-nav-btn" :class="{ active: activeTab === 'matrix' }" @click="activeTab = 'matrix'">
        🎯 5×5 風險評估矩陣 & AI 建議
      </button>
      <button class="tab-nav-btn" :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">
        📈 工地風險數據儀表板 (Risk Dashboard)
      </button>
    </div>

    <div v-if="loading" style="text-align:center; padding:48px; color:var(--text-muted)">
      <div class="spinner" style="margin:0 auto 16px"></div>
      數據載入中...
    </div>

    <div v-else-if="activeTab === 'matrix'" class="risk-grid">
      <!-- Left: Calculator -->
      <div class="risk-calc card">
        <h3>工安風險等級評估</h3>
        <p class="calc-desc">Risk Score = Severity (嚴重程度) × Probability (發生機率)</p>

        <div class="sliders">
          <div class="form-group">
            <label>事故嚴重程度 (Severity: {{ severity }})</label>
            <input v-model="severity" type="range" min="1" max="5" class="risk-slider" />
            <div class="slider-labels"><span>1 微傷</span><span>3 需送醫</span><span>5 死亡</span></div>
          </div>
          <div class="form-group">
            <label>事件發生機率 (Probability: {{ probability }})</label>
            <input v-model="probability" type="range" min="1" max="5" class="risk-slider" />
            <div class="slider-labels"><span>1 極罕見</span><span>3 偶發</span><span>5 必然</span></div>
          </div>
        </div>

        <!-- Score Display -->
        <div class="score-display" :style="{ background: riskLevelLabel.bg, color: riskLevelLabel.color }">
          <div class="score-number">{{ score }}</div>
          <div class="score-level">{{ riskLevelLabel.text }}</div>
          <div class="score-sub">S{{ severity }} × P{{ probability }}</div>
        </div>

        <!-- 5x5 Matrix -->
        <div class="matrix-section">
          <h4>5×5 風險矩陣</h4>
          <div class="matrix-grid">
            <div class="matrix-row-header"></div>
            <div v-for="p in [1,2,3,4,5]" :key="p" class="matrix-col-header">P{{ p }}</div>

            <template v-for="row in matrixCells" :key="row.s">
              <div class="matrix-row-header">S{{ row.s }}</div>
              <div
                v-for="cell in row.cols"
                :key="`${cell.s}-${cell.p}`"
                class="matrix-cell"
                :class="[`matrix-${cell.level}`, { 'matrix-active': cell.isActive }]"
                @click="clickMatrix(cell.s, cell.p)"
              >
                {{ cell.score }}
              </div>
            </template>
          </div>
          <div class="matrix-legend">
            <span class="legend-item"><span class="legend-dot matrix-low-dot"></span>1-5 低風險</span>
            <span class="legend-item"><span class="legend-dot matrix-medium-dot"></span>6-15 中風險</span>
            <span class="legend-item"><span class="legend-dot matrix-high-dot"></span>16-25 高風險</span>
          </div>
        </div>
      </div>

      <!-- Right: AI Recommendations -->
      <div class="ai-panel card">
        <h3>🧠 AI 工安防護智慧建議引擎</h3>
        <p class="calc-desc">選擇常見工安異常場景，系統自動提供標準改善指引與預防對策。</p>

        <div class="form-group">
          <label>選擇預設工安異常場景</label>
          <select v-model="selectedPreset" class="form-control" @change="applyPreset(presets.find(p => p.value === selectedPreset)!)">
            <option v-for="p in presets" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>

        <div class="ai-box">
          <div class="ai-box-header">
            <span class="ai-label">⚡ AI 推薦改善措施</span>
            <span class="badge" :class="riskLevel === 'high' ? 'badge-danger' : riskLevel === 'medium' ? 'badge-warning' : 'badge-success'">
              {{ riskLevelLabel.text }}
            </span>
          </div>

          <div class="ai-section">
            <div class="ai-section-title">🚨 立即對策</div>
            <ol class="ai-list">
              <li v-for="item in currentPresetRec.immediate" :key="item">{{ item }}</li>
            </ol>
          </div>

          <div class="ai-section">
            <div class="ai-section-title">🛡️ 根本預防措施</div>
            <ol class="ai-list">
              <li v-for="item in currentPresetRec.prevention" :key="item">{{ item }}</li>
            </ol>
          </div>
        </div>

        <!-- Common Recommendations Table -->
        <div class="risk-rules-table">
          <h4>風險矩陣判讀標準</h4>
          <table>
            <thead>
              <tr><th>分數區間</th><th>風險等級</th><th>管制要求</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>1 – 5</td>
                <td><span class="badge badge-success">Low</span></td>
                <td>列入觀察，定期追蹤</td>
              </tr>
              <tr>
                <td>6 – 15</td>
                <td><span class="badge badge-warning">Medium</span></td>
                <td>限期 3 天改善，加強巡查頻率</td>
              </tr>
              <tr>
                <td>16 – 25</td>
                <td><span class="badge badge-danger">High</span></td>
                <td>立即停工整改，缺失需當日結案</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: Risk Dashboard -->
    <div v-else class="risk-dashboard-view">
      <div class="risk-dash-grid">
        <!-- Donut Risk Distribution -->
        <div class="card chart-card">
          <div class="chart-header">
            <h3>工地風險等級分佈</h3>
          </div>
          <div class="donut-chart-box">
            <div class="donut-svg-wrapper">
              <svg viewBox="0 0 100 100" class="donut-svg">
                <g transform="rotate(-90 50 50)">
                  <circle cx="50" cy="50" r="30" fill="none" stroke="#E2E8F0" stroke-width="8"></circle>
                  <circle
                    v-for="item in riskDistribution"
                    :key="item.level"
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
                <text x="50" y="46" text-anchor="middle" font-size="8" fill="var(--text-muted)" font-weight="500">總缺失</text>
                <text x="50" y="62" text-anchor="middle" font-size="16" font-weight="800" fill="var(--text-main)" font-family="'Outfit', sans-serif">{{ totalRiskCount }}</text>
              </svg>
            </div>
            <div class="donut-legend">
              <div v-for="item in riskDistribution" :key="item.level" class="donut-legend-item">
                <div class="legend-info">
                  <span class="legend-color-dot" :style="{ backgroundColor: item.color }"></span>
                  <span class="legend-label">{{ item.label }}</span>
                </div>
                <div class="legend-vals">
                  <span class="legend-count">{{ item.count }} 件</span>
                  <span class="legend-pct">{{ item.pct }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Risk Trend Line Chart -->
        <div class="card chart-card">
          <div class="chart-header">
            <h3>高風險缺失歷史趨勢 (最近6個月)</h3>
          </div>
          <div class="svg-chart-container">
            <svg viewBox="0 0 300 150" class="line-chart-svg">
              <line v-for="i in [0,1,2,3,4,5]" :key="i" x1="25" :y1="20 + i*20" x2="290" :y2="20 + i*20" stroke="#F1F5F9" stroke-width="1"></line>
              <text v-for="i in [0,1,2,3,4,5]" :key="i" x="20" :y="24 + (5-i)*20" text-anchor="end" font-size="7" fill="var(--text-muted)">{{ Math.round((riskTrendMaxVal / 5) * i) }}</text>

              <path
                v-if="riskTrendData.length > 0"
                :d="riskTrendPathData(true)"
                fill="url(#riskAreaGrad)"
                stroke="none"
              ></path>

              <path
                v-if="riskTrendData.length > 0"
                :d="riskTrendPathData(false)"
                fill="none"
                stroke="var(--danger)"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>

              <g v-for="(d, idx) in riskTrendData" :key="d.month">
                <circle
                  :cx="48 + idx*42"
                  :cy="120 - (d.count / riskTrendMaxVal) * 100"
                  r="4"
                  fill="white"
                  stroke="var(--danger)"
                  stroke-width="2"
                  class="line-point"
                >
                  <title>高風險缺失: {{ d.count }} 件</title>
                </circle>
                <text :x="48 + idx*42" y="135" text-anchor="middle" font-size="8" fill="var(--text-muted)">{{ d.month }}</text>
              </g>

              <defs>
                <linearGradient id="riskAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--danger)" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="var(--danger)" stop-opacity="0.0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      <!-- High Risk Issues List -->
      <div class="card high-risk-list-card" style="margin-top: 24px; padding: 0; overflow: hidden;">
        <div class="section-header" style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 15px; color: var(--danger)">🚨 待改善高風險缺失追蹤</h3>
          <span class="badge badge-danger">未解決共 {{ highRiskIssues.length }} 筆</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>缺失項目</th>
                <th>工區位置</th>
                <th>責任人</th>
                <th>改善期限</th>
                <th>目前狀態</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="highRiskIssues.length === 0">
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">
                  🎉 工地目前無未解決的高風險缺失！
                </td>
              </tr>
              <tr v-for="issue in highRiskIssues" :key="issue.id">
                <td>
                  <RouterLink to="/defects" style="font-weight: 600; color: var(--primary); text-decoration: none;">
                    {{ issue.title }}
                  </RouterLink>
                </td>
                <td>{{ issue.work_area }}</td>
                <td>{{ issue.responsible_user_name || '-' }}</td>
                <td style="color: var(--danger); font-weight:600">{{ issue.due_date || '-' }} (限期整改)</td>
                <td>
                  <span class="badge" :class="issue.status === 'in_progress' ? 'badge-warning' : 'badge-danger'">
                    {{ issue.status === 'in_progress' ? '改善中' : '未處理' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.risk-page { }

/* Tabs Navigation styling */
.tabs-nav {
  display: flex;
  gap: 12px;
  padding: 8px;
  margin-bottom: 24px;
  background: white;
}

.tab-nav-btn {
  border: 1px solid transparent;
  background: transparent;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  color: var(--secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.tab-nav-btn:hover {
  background: #F1F5F9;
}

.tab-nav-btn.active {
  background: var(--warning);
  color: white;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
}

.risk-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 24px;
}

@media (max-width: 1024px) { .risk-grid { grid-template-columns: 1fr; } }

.risk-calc, .ai-panel { display: flex; flex-direction: column; gap: 20px; }

.risk-calc h3, .ai-panel h3 { font-size: 18px; }

.calc-desc { font-size: 13px; color: var(--text-muted); margin-top: -12px; }

.sliders { display: flex; flex-direction: column; gap: 16px; }

.risk-slider {
  width: 100%; height: 6px; accent-color: var(--warning);
  display: block; margin-top: 8px;
}

.slider-labels {
  display: flex; justify-content: space-between;
  font-size: 10px; color: var(--text-muted); margin-top: 4px;
}

.score-display {
  text-align: center; padding: 24px;
  border-radius: var(--radius-md);
  transition: all 0.3s;
}

.score-number { font-family: 'Outfit', sans-serif; font-size: 56px; font-weight: 900; line-height: 1; }
.score-level { font-size: 16px; font-weight: 700; text-transform: uppercase; margin-top: 6px; }
.score-sub { font-size: 13px; opacity: 0.7; margin-top: 4px; }

.matrix-section h4 { font-size: 14px; margin-bottom: 12px; }

.matrix-grid {
  display: grid;
  grid-template-columns: 28px repeat(5, 1fr);
  gap: 3px;
}

.matrix-row-header, .matrix-col-header {
  font-size: 11px; font-weight: 700; color: var(--text-muted);
  display: flex; align-items: center; justify-content: center;
  height: 32px;
}

.matrix-cell {
  height: 32px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; cursor: pointer;
  transition: transform 0.1s;
}

.matrix-cell:hover { transform: scale(1.1); }

.matrix-low { background: #DCFCE7; color: #166534; }
.matrix-medium { background: #FEF3C7; color: #92400E; }
.matrix-high { background: #FEE2E2; color: #991B1B; }
.matrix-active { outline: 3px solid var(--primary); transform: scale(1.1); z-index: 10; }

.matrix-legend { display: flex; gap: 16px; margin-top: 12px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; }
.legend-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
.matrix-low-dot { background: #DCFCE7; border: 1px solid #22C55E; }
.matrix-medium-dot { background: #FEF3C7; border: 1px solid #F97316; }
.matrix-high-dot { background: #FEE2E2; border: 1px solid #EF4444; }

.ai-box {
  background: linear-gradient(135deg, #F8FAFC, #F1F5F9);
  border-left: 4px solid var(--warning);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  padding: 16px 20px;
}

.ai-box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.ai-label { font-size: 14px; font-weight: 700; }

.ai-section { margin-bottom: 16px; }
.ai-section-title { font-size: 13px; font-weight: 700; color: var(--secondary); margin-bottom: 8px; }

.ai-list {
  padding-left: 18px;
  display: flex; flex-direction: column; gap: 6px;
}

.ai-list li { font-size: 13px; color: var(--secondary); line-height: 1.4; }

.risk-rules-table { margin-top: 4px; }
.risk-rules-table h4 { font-size: 14px; margin-bottom: 12px; }

/* Risk Dashboard layout styling */
.risk-dashboard-view {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.risk-dash-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;
}

@media (max-width: 900px) {
  .risk-dash-grid { grid-template-columns: 1fr; }
}

.chart-card {
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  padding: 24px;
}

.chart-header {
  margin-bottom: 16px;
}

.chart-header h3 {
  font-size: 15px;
  color: var(--text-main);
  font-weight: 600;
}

/* Donut Chart adapt for Risk Dashboard */
.donut-chart-box {
  display: flex;
  align-items: center;
  gap: 16px;
}

.donut-svg-wrapper {
  width: 120px;
  height: 120px;
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
  gap: 8px;
}

.donut-legend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.legend-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color-dot {
  width: 8px;
  height: 8px;
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
  gap: 8px;
}

.legend-count {
  font-weight: 600;
  color: var(--text-main);
}

.legend-pct {
  color: var(--text-muted);
  font-size: 10px;
  width: 30px;
  text-align: right;
}

/* SVG Chart details */
.svg-chart-container {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.line-chart-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.line-point {
  cursor: pointer;
  transition: r 0.2s;
}

.line-point:hover {
  r: 6;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--warning);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
</style>
