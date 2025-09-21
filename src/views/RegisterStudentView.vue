<template>
  <div class="card">
    <h3>Register Student + Guardian</h3>
    <div class="row">
      <div>
        <h4>Guardian</h4>
        <label>Name</label><input v-model="g.name" />
        <label>PIN (14 digits)</label><input v-model="g.pin" />
        <label>Citizenship</label><input v-model="g.citizenship" />
        <label>Phone</label><input v-model="g.phone" />
        <label>Email</label><input v-model="g.email" />
        <label>Sex</label>
        <select v-model="g.sex">
          <option value="male">male</option>
          <option value="female">female</option>
          <option value="other">other</option>
        </select>
        <label>Address</label><input v-model="g.address" />
      </div>

      <div>
        <h4>Student</h4>
        <label>Name</label><input v-model="s.name" />
        <label>PIN (14 digits)</label><input v-model="s.pin" />
        <label>Citizenship</label><input v-model="s.citizenship" />
        <label>Phone</label><input v-model="s.phone" />
        <label>Email (optional)</label><input v-model="s.email" />
        <label>Sex</label>
        <select v-model="s.sex">
          <option value="male">male</option>
          <option value="female">female</option>
          <option value="other">other</option>
        </select>
        <label>Birth date</label><input v-model="s.birth_date" placeholder="YYYY-MM-DD" />
        <label>Grade</label><input v-model.number="s.grade" type="number" min="1" max="11" />
        <label>Class letter</label><input v-model="s.class_letter" />
      </div>
    </div>

    <button @click="submit" style="margin-top:8px;">Register</button>
    <div v-if="ok" class="success" style="margin-top:8px;">Registered ✔</div>
    <div v-if="error" class="error" style="margin-top:8px;">{{ error }}</div>

    <div v-if="result" class="card">
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import api from '../utils/api'
import { ref } from 'vue'

const ok = ref(false)
const error = ref('')
const result = ref('')

const g = ref({
  name: 'Иванов Иван',
  pin: '12345678901234',
  citizenship: 'KG',
  phone: '+996700000001',
  email: 'parent1@example.com',
  sex: 'male',
  address: 'Адрес',
})

const s = ref({
  name: 'Иванов Петр',
  pin: '98765432109876',
  citizenship: 'KG',
  phone: '+996700000002',
  email: 'pupil1@example.com',
  sex: 'male',
  birth_date: '2012-09-01',
  grade: 7,
  class_letter: 'А',
})

const submit = async () => {
  ok.value = false
  error.value = ''
  result.value = ''
  try {
    const { data } = await api.post('/auth/register-student', { guardian: g.value, student: s.value })
    ok.value = true
    result.value = JSON.stringify(data, null, 2)
  } catch (e: any) {
    error.value = JSON.stringify(e.data, null, 2)
  }
}
</script>
