<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usersApi } from '@/api'
import { useAuth, useToast } from '@/store'
import type { User } from '@/api'

const { can } = useAuth()
const { show } = useToast()

const users = ref<User[]>([])
const loading = ref(true)
const showModal = ref(false)
const submitting = ref(false)
const editingId = ref('')
const searchQ = ref('')

const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'inspector' as User['role'],
  department: '',
})

const roleColors: Record<string, string> = {
  admin: 'badge-danger',
  manager: 'badge-warning',
  inspector: 'badge-primary',
  supervisor: 'badge-success',
}

const roleLabels: Record<string, string> = {
  admin: '系統管理者',
  manager: '工地主任',
  inspector: '巡檢人員',
  supervisor: '監造人員',
}

const filtered = computed(() => {
  if (!searchQ.value) return users.value
  const q = searchQ.value.toLowerCase()
  return users.value.filter(u =>
    `${u.name} ${u.email} ${u.department} ${u.role}`.toLowerCase().includes(q)
  )
})

function openCreateModal() {
  editingId.value = ''
  form.value = { name: '', email: '', password: '', role: 'inspector', department: '' }
  showModal.value = true
}

function openEditModal(u: User) {
  editingId.value = u.id
  form.value = { name: u.name, email: u.email, password: '', role: u.role, department: u.department || '' }
  showModal.value = true
}

async function handleSubmit() {
  if (!form.value.name || !form.value.email) {
    show('請填寫必要欄位', 'warning')
    return
  }
  if (!editingId.value && !form.value.password) {
    show('新增成員時密碼為必填欄位', 'warning')
    return
  }

  submitting.value = true
  try {
    if (editingId.value) {
      await usersApi.update(editingId.value, {
        name: form.value.name,
        department: form.value.department,
        role: form.value.role,
      })
      show('成員資料已更新', 'success')
    } else {
      await usersApi.create({
        name: form.value.name,
        email: form.value.email,
        password: form.value.password,
        role: form.value.role,
        department: form.value.department,
      })
      show('成功新增團隊成員', 'success')
    }
    showModal.value = false
    await loadData()
  } catch (e: any) {
    show(e.message, 'danger')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(u: User) {
  if (!confirm(`確定要移除成員「${u.name}」？此動作無法復原。`)) return
  try {
    await usersApi.delete(u.id)
    show('成員已移除', 'success')
    await loadData()
  } catch (e: any) {
    show(e.message, 'danger')
  }
}

const loadData = async () => {
  loading.value = true
  try {
    users.value = await usersApi.list()
  } catch (e: any) {
    show(e.message, 'danger')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div>
    <!-- Actions Bar -->
    <div class="filter-bar card">
      <div class="form-group" style="margin:0; flex:1;">
        <label>搜尋成員</label>
        <input v-model="searchQ" type="text" class="form-control" placeholder="輸入姓名、Email 或部門..." />
      </div>
      <button v-if="can.manageUsers.value" class="btn btn-warning" style="align-self:flex-end;" @click="openCreateModal">
        + 新增成員
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="text-align:center; padding:48px; color:var(--text-muted)">載入中...</div>

    <!-- Users Grid -->
    <div v-else class="users-grid">
      <div v-for="u in filtered" :key="u.id" class="user-card card">
        <div class="user-avatar">{{ u.name.slice(-2) }}</div>
        <div class="user-card-name">{{ u.name }}</div>
        <div class="user-card-dept">{{ u.department || '無部門設定' }}</div>
        <div class="user-card-email">{{ u.email }}</div>
        <span class="badge" :class="roleColors[u.role]">{{ roleLabels[u.role] || u.role }}</span>

        <div v-if="can.manageUsers.value" class="user-card-actions">
          <button class="btn btn-secondary btn-sm" @click="openEditModal(u)">編輯</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(u)">移除</button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ editingId ? '編輯成員資料' : '新增團隊成員' }}</h3>
          <button class="modal-close" @click="showModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>姓名 *</label>
            <input v-model="form.name" type="text" class="form-control" placeholder="例：陳小明" required />
          </div>
          <div class="form-group">
            <label>電子郵件 *</label>
            <input v-model="form.email" type="email" class="form-control" :disabled="!!editingId" placeholder="user@smartsite.com" />
          </div>
          <div class="form-group" v-if="!editingId">
            <label>初始密碼 *</label>
            <input v-model="form.password" type="password" class="form-control" placeholder="至少8位英數字" />
          </div>
          <div class="form-group">
            <label>部門職稱</label>
            <input v-model="form.department" type="text" class="form-control" placeholder="例：安衛室 - 助理工程師" />
          </div>
          <div class="form-group">
            <label>系統角色</label>
            <select v-model="form.role" class="form-control">
              <option value="inspector">Inspector (巡檢人員)</option>
              <option value="manager">Site Manager (工地主任)</option>
              <option value="supervisor">Supervisor (監造人員)</option>
              <option value="admin">Administrator (系統管理者)</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModal = false">取消</button>
          <button class="btn btn-warning" :disabled="submitting" @click="handleSubmit">
            {{ submitting ? '儲存中...' : '儲存成員' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-bar { display: flex; gap: 16px; align-items: flex-end; margin-bottom: 20px; }

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.user-card {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 8px;
}

.user-avatar {
  width: 64px; height: 64px; border-radius: 50%;
  background: linear-gradient(135deg, var(--secondary), var(--primary));
  color: white; display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 700; margin-bottom: 8px;
}

.user-card-name { font-size: 16px; font-weight: 700; }
.user-card-dept { font-size: 12px; color: var(--text-muted); }
.user-card-email { font-size: 12px; color: var(--text-muted); word-break: break-all; }

.user-card-actions {
  display: flex; gap: 8px; width: 100%; margin-top: 12px;
  border-top: 1px solid var(--border); padding-top: 12px;
}

.user-card-actions button { flex: 1; }
</style>
