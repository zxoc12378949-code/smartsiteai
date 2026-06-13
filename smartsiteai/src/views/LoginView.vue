<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import { useAuth, useToast } from '@/store'

const router = useRouter()
const { login } = useAuth()
const { show } = useToast()

const email = ref('manager@smartsite.com')
const password = ref('Manager@1234')
const loading = ref(false)
const errorMsg = ref('')

const demoAccounts = [
  { label: 'Admin (系統管理者)', email: 'admin@smartsite.com', password: 'Admin@1234', role: 'admin' },
  { label: 'Manager (工地主任)', email: 'manager@smartsite.com', password: 'Manager@1234', role: 'manager' },
  { label: 'Inspector (巡檢人員)', email: 'inspector@smartsite.com', password: 'Inspector@1234', role: 'inspector' },
  { label: 'Supervisor (監造人員)', email: 'supervisor@smartsite.com', password: 'Supervisor@1234', role: 'supervisor' },
]

function selectDemo(acc: typeof demoAccounts[0]) {
  email.value = acc.email
  password.value = acc.password
}

async function handleLogin() {
  if (!email.value || !password.value) {
    errorMsg.value = '請輸入 Email 與密碼'
    return
  }
  loading.value = true
  errorMsg.value = ''

  try {
    const res = await authApi.login(email.value, password.value)
    login(res.token, res.user)
    show(`歡迎回來，${res.user.name}！`, 'success')
    router.push('/dashboard')
  } catch (e: any) {
    errorMsg.value = e.message || '登入失敗，請確認帳密'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- Background decoration -->
    <div class="login-bg">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>

    <div class="login-wrapper">
      <!-- Left Brand Panel -->
      <div class="login-brand">
        <div class="brand-logo">
          <span class="logo-icon">S</span>
          <span class="logo-text">SmartSite <em>AI</em></span>
        </div>
        <h1>智慧工地安全<br>巡檢管理平台</h1>
        <p>整合數位巡檢、缺失追蹤、風險評估與 AI 智慧建議，打造全方位工地安全解決方案。</p>

        <div class="feature-list">
          <div class="feature-item">
            <span class="feature-icon">📋</span>
            <span>標準化數位巡檢流程</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">⚡</span>
            <span>即時缺失追蹤與改善管理</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🧠</span>
            <span>AI 驅動風險評估建議</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📊</span>
            <span>多維度報表與數據分析</span>
          </div>
        </div>
      </div>

      <!-- Right Login Form -->
      <div class="login-form-panel">
        <div class="login-form-card">
          <h2>登入系統</h2>
          <p class="form-subtitle">請輸入您的帳號與密碼</p>

          <div v-if="errorMsg" class="error-alert">{{ errorMsg }}</div>

          <form @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="login-email">電子郵件 (Email)</label>
              <input
                id="login-email"
                v-model="email"
                type="email"
                class="form-control"
                placeholder="user@smartsite.com"
                autocomplete="email"
                required
              />
            </div>

            <div class="form-group">
              <label for="login-password">密碼 (Password)</label>
              <input
                id="login-password"
                v-model="password"
                type="password"
                class="form-control"
                placeholder="••••••••"
                autocomplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              class="btn btn-warning btn-login"
              :disabled="loading"
            >
              <span v-if="loading">登入中...</span>
              <span v-else>登入 →</span>
            </button>
          </form>

          <!-- Demo Accounts Quick Select -->
          <div class="demo-accounts">
            <p class="demo-title">🔑 測試帳號快速登入</p>
            <div class="demo-grid">
              <button
                v-for="acc in demoAccounts"
                :key="acc.email"
                class="demo-btn"
                :class="`demo-btn-${acc.role}`"
                @click="selectDemo(acc)"
              >
                {{ acc.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
  background: var(--primary);
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.07;
}

.bg-circle-1 {
  width: 600px; height: 600px;
  background: var(--warning);
  top: -200px; left: -200px;
}

.bg-circle-2 {
  width: 400px; height: 400px;
  background: #3B82F6;
  bottom: -100px; left: 200px;
}

.bg-circle-3 {
  width: 300px; height: 300px;
  background: var(--success);
  top: 100px; left: 40%;
}

.login-wrapper {
  display: flex;
  width: 100%;
  min-height: 100vh;
  position: relative;
  z-index: 10;
}

/* Brand Panel */
.login-brand {
  flex: 1;
  padding: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: white;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 48px;
}

.logo-icon {
  background: linear-gradient(135deg, var(--warning), #FB923C);
  width: 48px; height: 48px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 800; color: white;
  font-family: 'Outfit', sans-serif;
}

.logo-text {
  font-family: 'Outfit', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.5px;
}

.logo-text em {
  font-style: normal;
  color: var(--warning);
}

.login-brand h1 {
  font-size: 42px;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 20px;
  color: white;
}

.login-brand p {
  font-size: 16px;
  color: rgba(255,255,255,0.65);
  line-height: 1.6;
  max-width: 420px;
  margin-bottom: 40px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 15px;
  color: rgba(255,255,255,0.8);
}

.feature-icon {
  font-size: 20px;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.08);
  border-radius: 8px;
}

/* Form Panel */
.login-form-panel {
  width: 480px;
  background: var(--background);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  border-radius: 24px 0 0 24px;
}

.login-form-card {
  width: 100%;
}

.login-form-card h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 6px;
}

.form-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 32px;
}

.error-alert {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  color: var(--danger);
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  margin-bottom: 20px;
}

.btn-login {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  border-radius: var(--radius-md);
  margin-top: 8px;
}

.demo-accounts {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.demo-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.demo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.demo-btn {
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  text-align: center;
}

.demo-btn-admin { background: #FEE2E2; color: var(--danger); }
.demo-btn-admin:hover { background: #FECACA; }
.demo-btn-manager { background: #FFF7ED; color: var(--warning); }
.demo-btn-manager:hover { background: #FFEDD5; }
.demo-btn-inspector { background: #EFF6FF; color: #3B82F6; }
.demo-btn-inspector:hover { background: #DBEAFE; }
.demo-btn-supervisor { background: #F0FDF4; color: var(--success); }
.demo-btn-supervisor:hover { background: #DCFCE7; }

@media (max-width: 900px) {
  .login-wrapper { flex-direction: column; }
  .login-brand { padding: 40px; }
  .login-form-panel { width: 100%; border-radius: 24px 24px 0 0; }
}
</style>
