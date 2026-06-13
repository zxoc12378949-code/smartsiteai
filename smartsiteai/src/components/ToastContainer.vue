<script setup lang="ts">
import { useToast } from '@/store'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="`toast-${t.type}`"
      >
        <div class="toast-icon">
          <span v-if="t.type === 'success'">✓</span>
          <span v-else-if="t.type === 'warning'">!</span>
          <span v-else>✗</span>
        </div>
        <div class="toast-body">
          <div class="toast-title">{{ t.title }}</div>
          <div class="toast-msg">{{ t.message }}</div>
        </div>
        <button class="toast-close" @click="dismiss(t.id)">×</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px; right: 24px;
  display: flex; flex-direction: column;
  gap: 10px;
  z-index: 1000;
}

.toast {
  background: white;
  border-radius: 10px;
  box-shadow: var(--shadow-lg);
  padding: 14px 18px;
  display: flex; align-items: center; gap: 12px;
  min-width: 300px; max-width: 400px;
  border-left: 4px solid var(--primary);
}

.toast-success { border-left-color: var(--success); }
.toast-warning { border-left-color: var(--warning); }
.toast-danger { border-left-color: var(--danger); }

.toast-icon {
  width: 24px; height: 24px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px;
  flex-shrink: 0;
}

.toast-success .toast-icon { background: #DCFCE7; color: var(--success); }
.toast-warning .toast-icon { background: #FFF7ED; color: var(--warning); }
.toast-danger .toast-icon { background: #FEE2E2; color: var(--danger); }

.toast-body { flex: 1; }
.toast-title { font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 2px; }
.toast-msg { font-size: 12px; color: var(--text-muted); }

.toast-close {
  background: none; border: none; cursor: pointer;
  color: var(--text-muted); font-size: 18px; line-height: 1;
}

.toast-enter-active, .toast-leave-active { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.toast-enter-from { transform: translateX(100%) translateY(20px); opacity: 0; }
.toast-leave-to { opacity: 0; transform: translateY(10px); }
</style>
