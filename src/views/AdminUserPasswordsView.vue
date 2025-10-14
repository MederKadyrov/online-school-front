<template>
  <div class="container">
    <h2>Управление паролями пользователей</h2>

    <div class="search-box">
      <input
        v-model="searchQuery"
        placeholder="Поиск по ФИО или PIN..."
        @input="debouncedSearch"
      />
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>

    <div v-if="!loading && users.length === 0" class="empty">
      Пользователи не найдены
    </div>

    <table v-if="!loading && users.length > 0">
      <thead>
        <tr>
          <th>PIN</th>
          <th>ФИО</th>
          <th>Email</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.pin }}</td>
          <td>{{ user.full_name }}</td>
          <td>{{ user.email || '—' }}</td>
          <td>
            <button @click="openResetModal(user)" class="btn-reset">
              Сбросить пароль
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="pagination.total > pagination.per_page" class="pagination">
      <button
        @click="loadPage(pagination.current_page - 1)"
        :disabled="pagination.current_page === 1"
      >
        ← Назад
      </button>
      <span>Страница {{ pagination.current_page }} из {{ pagination.last_page }}</span>
      <button
        @click="loadPage(pagination.current_page + 1)"
        :disabled="pagination.current_page === pagination.last_page"
      >
        Вперед →
      </button>
    </div>

    <!-- Модалка для сброса пароля -->
    <div v-if="showResetModal" class="modal-overlay" @click="closeResetModal">
      <div class="modal" @click.stop>
        <h3>Сброс пароля</h3>
        <p><strong>Пользователь:</strong> {{ selectedUser?.full_name }}</p>
        <p><strong>PIN:</strong> {{ selectedUser?.pin }}</p>

        <div v-if="tempPassword" class="success-box">
          <p><strong>✓ Пароль успешно сброшен!</strong></p>
          <p>Временный пароль:</p>
          <div class="temp-password">{{ tempPassword }}</div>
          <p style="font-size: 12px; color: #666; margin-top: 8px;">
            Сохраните этот пароль и передайте пользователю
          </p>
        </div>

        <div v-if="!tempPassword">
          <p style="color: #dc3545; margin-bottom: 16px;">
            Вы уверены, что хотите сбросить пароль этому пользователю?
          </p>
          <button @click="confirmReset" class="btn-confirm" :disabled="resetting">
            {{ resetting ? 'Сброс...' : 'Да, сбросить пароль' }}
          </button>
        </div>

        <button @click="closeResetModal" class="btn-close">
          {{ tempPassword ? 'Закрыть' : 'Отмена' }}
        </button>

        <div v-if="error" class="error">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../utils/api'

type User = {
  id: number
  pin: string
  full_name: string
  email: string | null
}

const users = ref<User[]>([])
const loading = ref(false)
const searchQuery = ref('')
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0
})

const showResetModal = ref(false)
const selectedUser = ref<User | null>(null)
const tempPassword = ref('')
const resetting = ref(false)
const error = ref('')

let debounceTimer: ReturnType<typeof setTimeout>

const debouncedSearch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    loadPage(1)
  }, 500)
}

const loadPage = async (page: number) => {
  loading.value = true
  try {
    const { data } = await api.get('/admin/users/passwords', {
      params: {
        page,
        search: searchQuery.value || undefined
      }
    })
    users.value = data.data
    pagination.value = {
      current_page: data.current_page,
      last_page: data.last_page,
      per_page: data.per_page,
      total: data.total
    }
  } catch (e) {
    console.error('Error loading users:', e)
  } finally {
    loading.value = false
  }
}

const openResetModal = (user: User) => {
  selectedUser.value = user
  tempPassword.value = ''
  error.value = ''
  showResetModal.value = true
}

const closeResetModal = () => {
  showResetModal.value = false
  selectedUser.value = null
  tempPassword.value = ''
  error.value = ''
}

const confirmReset = async () => {
  if (!selectedUser.value) return

  resetting.value = true
  error.value = ''

  try {
    const { data } = await api.post(`/admin/users/${selectedUser.value.id}/reset-password`)
    tempPassword.value = data.temp_password
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Ошибка сброса пароля'
  } finally {
    resetting.value = false
  }
}

onMounted(() => {
  loadPage(1)
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  margin-bottom: 24px;
}

.search-box {
  margin-bottom: 20px;
}

.search-box input {
  width: 100%;
  max-width: 400px;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #666;
}

table {
  color: #000;
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
}

.btn-reset {
  padding: 6px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-reset:hover {
  background: #c82333;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  color: #666;
}

.modal h3 {
  margin-top: 0;
  margin-bottom: 16px;
}

.success-box {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 16px;
  border-radius: 4px;
  margin: 16px 0;
}

.temp-password {
  background: #fff;
  padding: 12px;
  border: 2px solid #28a745;
  border-radius: 4px;
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  letter-spacing: 2px;
  margin: 8px 0;
}

.btn-confirm {
  width: 100%;
  padding: 10px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 8px;
}

.btn-confirm:hover:not(:disabled) {
  background: #c82333;
}

.btn-confirm:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-close {
  width: 100%;
  padding: 10px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-close:hover {
  background: #5a6268;
}

.error {
  color: #dc3545;
  margin-top: 12px;
  font-size: 14px;
}
</style>
