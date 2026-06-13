<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastContainer from './components/ToastContainer.vue'
</script>

<template>
  <RouterView />
  <ToastContainer />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap');

:root {
  --primary: #0F172A;
  --primary-light: #1E293B;
  --secondary: #334155;
  --warning: #F97316;
  --warning-dark: #EA580C;
  --success: #22C55E;
  --danger: #EF4444;
  --background: #F8FAFC;
  --card-bg: #FFFFFF;
  --text-main: #0F172A;
  --text-muted: #64748B;
  --border: #E2E8F0;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --sidebar-width: 260px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background-color: var(--background);
  color: var(--text-main);
  min-height: 100vh;
}

h1, h2, h3, h4 { font-family: 'Outfit', sans-serif; font-weight: 600; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

/* Utility classes */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 8px; padding: 10px 18px; font-size: 14px; font-weight: 500;
  border-radius: var(--radius-sm); border: 1px solid transparent;
  cursor: pointer; transition: all 0.2s ease; font-family: inherit;
  text-decoration: none;
}
.btn-primary { background-color: var(--primary); color: white; }
.btn-primary:hover { background-color: var(--primary-light); }
.btn-warning { background-color: var(--warning); color: white; }
.btn-warning:hover { background-color: var(--warning-dark); }
.btn-success { background-color: var(--success); color: white; }
.btn-success:hover { background-color: #16A34A; }
.btn-danger { background-color: var(--danger); color: white; }
.btn-danger:hover { background-color: #DC2626; }
.btn-secondary { background-color: white; border-color: var(--border); color: var(--secondary); }
.btn-secondary:hover { background-color: #F8FAFC; }
.btn-sm { padding: 6px 12px; font-size: 12px; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.badge {
  display: inline-flex; align-items: center;
  padding: 4px 8px; font-size: 12px; font-weight: 600; border-radius: 4px;
}
.badge-success { background-color: #DCFCE7; color: var(--success); }
.badge-warning { background-color: #FFF7ED; color: var(--warning); }
.badge-danger { background-color: #FEE2E2; color: var(--danger); }
.badge-primary { background-color: #EFF6FF; color: #3B82F6; }
.badge-secondary { background-color: #F1F5F9; color: var(--secondary); }

.card {
  background: var(--card-bg); border-radius: var(--radius-md);
  border: 1px solid var(--border); box-shadow: var(--shadow-sm);
  padding: 24px;
}

.form-group { margin-bottom: 18px; display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: var(--secondary); }
.form-control {
  width: 100%; padding: 10px 12px; font-size: 14px;
  border-radius: var(--radius-sm); border: 1px solid var(--border);
  outline: none; font-family: inherit; transition: border-color 0.2s, box-shadow 0.2s;
  background: white;
}
.form-control:focus {
  border-color: var(--warning);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
}
textarea.form-control { resize: vertical; min-height: 80px; }

/* Table styles */
table { width: 100%; border-collapse: collapse; }
th {
  background: #F8FAFC; padding: 14px 20px; font-size: 12px;
  font-weight: 600; text-transform: uppercase; color: var(--text-muted);
  letter-spacing: 0.5px; border-bottom: 1px solid var(--border); text-align: left;
}
td { padding: 14px 20px; font-size: 14px; border-bottom: 1px solid var(--border); color: var(--text-main); }
tr:last-child td { border-bottom: none; }
tr:hover td { background: #F8FAFC; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px); z-index: 100;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-card {
  background: var(--card-bg); border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg); width: 100%; max-width: 640px;
  max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;
  animation: modalIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes modalIn {
  from { transform: scale(0.95) translateY(12px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}
.modal-header {
  padding: 20px 24px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}
.modal-close {
  background: none; border: none; cursor: pointer;
  color: var(--text-muted); padding: 4px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.modal-close:hover { background: #F1F5F9; color: var(--text-main); }
.modal-body { padding: 24px; overflow-y: auto; flex: 1; }
.modal-footer {
  padding: 16px 24px; border-top: 1px solid var(--border);
  display: flex; justify-content: flex-end; gap: 12px; background: #F8FAFC;
}

/* Page transitions */
.page-enter-active, .page-leave-active { transition: opacity 0.2s, transform 0.2s; }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; }

@media print {
  #app-sidebar, header, .no-print { display: none !important; }
}
</style>
