<template>
  <div class="card">
    <div class="head">
      <h3>Преподаватели</h3>
      <router-link class="btn" to="/admin/teachers/new">+ Добавить</router-link>
    </div>

    <div class="toolbar">
      <input v-model="search" placeholder="Поиск: ФИО, email, телефон" @input="debouncedLoad" />
    </div>

    <table class="tbl">
      <thead>
      <tr>
        <th>ID</th>
        <th>ФИО</th>
        <th>Email</th>
        <th>Телефон</th>
        <th>Предметы</th>
        <th style="width:160px"></th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="t in teachers" :key="t.id">
        <td>{{ t.id }}</td>
        <td>{{ t.name }}</td>
        <td>{{ t.email }}</td>
        <td>{{ t.phone }}</td>
        <td>{{ (t.subjects || []).map(s=>s.name).join(', ') }}</td>
        <td class="actions">
          <router-link class="btn" :to="`/admin/teachers/${t.id}/edit`">Редактировать</router-link>
          <button class="btn danger" @click="remove(t)">Удалить</button>
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

const teachers = ref<any[]>([])
const search = ref('')
const error = ref('')

async function load() {
  error.value = ''
  try {
    const { data } = await api.get('/admin/teachers', { params: { search: search.value } })
    teachers.value = data
  } catch (e:any) {
    error.value = e?.data?.message || e?.message || 'Ошибка загрузки'
  }
}

function debounce(fn: Function, ms=400) {
  let t: any
  return (...args: any[]) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}
const debouncedLoad = debounce(load, 400)

async function remove(row: any) {
  if (!confirm(`Удалить преподавателя "${row.name}"?`)) return
  try {
    await api.delete(`/admin/teachers/${row.id}`)
    await load()
  } catch (e:any) {
    alert(e?.data?.message || e?.message || 'Не удалось удалить')
  }
}

load()
</script>

<style scoped>
.card { padding:12px; border:1px solid #eee; border-radius:8px; }
.head { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.toolbar { margin-bottom:8px; }
.tbl { width:100%; border-collapse:collapse; }
.tbl th, .tbl td { border-bottom:1px solid #eee; padding:8px; text-align:left; vertical-align:top; }
.btn { padding:6px 10px; border:1px solid #ddd; border-radius:6px; background:#fff; cursor:pointer; text-decoration:none; }
.btn.danger { border-color:#e53935; color:#e53935; }
.error { color:#b00020; margin-top:8px; }
.actions { display:flex; gap:6px; }
</style>
