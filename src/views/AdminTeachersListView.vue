<template>
  <div class="card">
    <div class="head">
      <h3>{{ $t('teachers.title') }}</h3>
      <router-link class="btn" to="/admin/teachers/new">+ {{ $t('teachers.add') }}</router-link>
    </div>

    <div class="toolbar">
      <input v-model="search" :placeholder="$t('teachers.searchPlaceholder')" @input="debouncedLoad" />
    </div>

    <table class="tbl">
      <thead>
      <tr>
        <th>{{ $t('teachers.fullName') }}</th>
        <th>{{ $t('teachers.email') }}</th>
        <th>{{ $t('teachers.phone') }}</th>
        <th>{{ $t('teachers.subjects') }}</th>
        <th style="width:160px">{{ $t('common.actions') }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="t in teachers" :key="t.id">
        <td>{{ t.name }}</td>
        <td>{{ t.email }}</td>
        <td>{{ t.phone }}</td>
        <td>{{ (t.subjects || []).map(s=>s.name).join(', ') }}</td>
        <td class="actions">
          <router-link class="btn" :to="`/admin/teachers/${t.id}/edit`">{{ $t('common.edit') }}</router-link>
          <button class="btn danger" @click="remove(t)">{{ $t('common.delete') }}</button>
        </td>
      </tr>
      </tbody>
    </table>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../utils/api'

const { t } = useI18n()

const teachers = ref<any[]>([])
const search = ref('')
const error = ref('')

async function load() {
  error.value = ''
  try {
    const { data } = await api.get('/admin/teachers', { params: { search: search.value } })
    teachers.value = data
  } catch (e:any) {
    error.value = e?.data?.message || e?.message || t('teachers.loadError')
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
  if (!confirm(t('teachers.deleteConfirm', { name: row.name }))) return
  try {
    await api.delete(`/admin/teachers/${row.id}`)
    await load()
  } catch (e:any) {
    alert(e?.data?.message || e?.message || t('teachers.deleteError'))
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
