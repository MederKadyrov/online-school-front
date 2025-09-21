<template>
  <div class="card">
    <h3>Admin — Register Teacher</h3>

    <div class="row">
      <div>
        <label>Фамилия</label><input v-model="f.last_name" />
        <label>Имя</label><input v-model="f.first_name" />
        <label>Отчество</label><input v-model="f.middle_name" />

        <label>Email</label><input v-model="f.email" />
        <label>Пароль</label><input v-model="f.password" type="password" />
        <label>Подтверждение пароля</label><input type="password" v-model="f.password_confirmation" placeholder="Подтверждение пароля" />

        <label>Phone</label><input v-model="f.phone" />
      </div>
      <div>
        <label>Sex</label>
        <select v-model="f.sex">
          <option value="male">male</option>
          <option value="female">female</option>
          <option value="other">other</option>
        </select>
        <label>PIN (14 digits)</label><input v-model="f.pin" />
        <label>Citizenship</label><input v-model="f.citizenship" />
        <label>Address</label><input v-model="f.address" />
      </div>
    </div>

    <div class="card">
      <h4>Subjects</h4>
      <div v-if="subjects.length === 0">
        <small class="help">No subjects yet. Create on Admin Setup page.</small>
      </div>
      <ul v-else>
        <li v-for="s in subjects" :key="s.id">
          <label>
            <input type="checkbox" :value="s.id" v-model="selectedSubjects" />
            {{ s.name }} ({{ s.code }})
          </label>
        </li>
      </ul>
    </div>

    <button @click="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Create teacher' }}</button>
    <div v-if="ok" class="success" style="margin-top:8px;">Teacher created ✔</div>
    <div v-if="error" class="error" style="margin-top:8px; white-space: pre-wrap;">{{ error }}</div>

    <div v-if="result" class="card">
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import api from '../utils/api'
import { ref, onMounted } from 'vue'

const f = ref({
  last_name: "",
  first_name: "",
  middle_name: "",
  email: '',
  password: '',
  password_confirmation: "",
  phone: '',
  sex: 'other',
  pin: '',
  citizenship: 'KG',
  address: '',
})

const subjects = ref<any[]>([])
const selectedSubjects = ref<number[]>([])

const saving = ref(false)
const ok = ref(false)
const error = ref('')
const result = ref('')

async function loadSubjects() {
  try {
    const { data } = await api.get('/admin/subjects')
    subjects.value = data
  } catch (e:any) {
    error.value = e?.data?.message || 'Error loading subjects'
  }
}

async function submit() {
  saving.value = true
  ok.value = false
  error.value = ''
  result.value = ''
  try {
    // простая валидация фронта
    if (!/^\d{14}$/.test(f.value.pin)) throw new Error('PIN должен состоять из 14 цифр')
    if (!f.value.email || !f.value.password) throw new Error('Email/Password обязательны')

    const payload = { ...f.value, subject_ids: selectedSubjects.value }
    const { data } = await api.post('/admin/teachers', payload)
    ok.value = true
    result.value = JSON.stringify(data, null, 2)
  } catch (e:any) {
    error.value = e?.data?.message || (e?.data ? JSON.stringify(e.data) : e?.message || 'Error')
  } finally {
    saving.value = false
  }
}

onMounted(loadSubjects)
</script>
