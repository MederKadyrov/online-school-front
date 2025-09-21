<template>
  <div class="card">
    <div class="head">
      <h3>Предметы</h3>
      <router-link class="btn" to="/admin/subjects/new">+ Создать</router-link>
    </div>

    <div class="toolbar">
      <input v-model="search" class="inp" placeholder="Поиск по названию/коду/области" @input="debouncedLoad" />
      <select v-model.number="filterAreaId" class="inp small" @change="load">
        <option :value="0">Все области</option>
        <option v-for="a in areas" :key="a.id" :value="a.id">
          {{ a.name }}
        </option>
      </select>
    </div>

    <table class="tbl">
      <thead>
      <tr>
        <th style="width:80px">ID</th>
        <th>Название предмета</th>
        <th>Код</th>
        <th>Образовательная область</th>
        <th style="width:180px"></th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="s in rows" :key="s.id">
        <td>{{ s.id }}</td>
        <td>{{ s.name }}</td>
        <td><code>{{ s.code }}</code></td>
        <td>{{ s.area?.name || '—' }}</td>
        <td class="actions">
          <router-link class="btn" :to="`/admin/subjects/${s.id}/edit`">Редактировать</router-link>
          <button class="btn danger" @click="removeRow(s)">Удалить</button>
        </td>
      </tr>
      </tbody>
    </table>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '../utils/api'

const rows = ref<any[]>([])
const areas = ref<any[]>([])
const error = ref('')
const search = ref('')
const filterAreaId = ref(0)

async function loadAreas() {
  const { data } = await api.get('/admin/educational-areas')
  areas.value = data
}

async function load() {
  error.value = ''
  try {
    const params:any = {}
    if (search.value.trim()) params.search = search.value.trim()
    if (filterAreaId.value) params.area_id = filterAreaId.value
    const { data } = await api.get('/admin/subjects', { params })
    rows.value = data
  } catch (e:any) {
    error.value = e?.data?.message || e?.message || 'Ошибка загрузки'
  }
}

function debounce(fn: Function, ms=400) {
  let t:any
  return (...args:any[]) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}
const debouncedLoad = debounce(load, 400)

async function removeRow(s:any) {
  if (!confirm(`Удалить предмет "${s.name}"?`)) return
  try {
    await api.delete(`/admin/subjects/${s.id}`)
    await load()
  } catch (e:any) {
    alert(e?.data?.message || e?.message || 'Не удалось удалить')
  }
}

loadAreas().then(load)
</script>

<style scoped>
.card{padding:12px;border:1px solid #eee;border-radius:8px}
.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.toolbar{display:flex;gap:8px;align-items:center;margin-bottom:8px}
.tbl{width:100%;border-collapse:collapse}
.tbl th,.tbl td{border-bottom:1px solid #eee;padding:8px;text-align:left}
.inp{padding:6px;border:1px solid #ddd;border-radius:6px}
.inp.small{padding:4px 6px}
.btn{padding:6px 10px;border:1px solid #ddd;border-radius:6px;background:#fff;text-decoration:none;cursor:pointer}
.btn.danger{border-color:#e53935;color:#e53935}
.actions{display:flex;gap:6px}
.error{margin-top:8px;color:#b00020}
code{background:#f6f6f6;padding:1px 4px;border-radius:4px}
</style>
