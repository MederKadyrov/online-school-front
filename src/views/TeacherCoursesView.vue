<template>
  <div class="card">
    <h3>Мои курсы</h3>

    <div class="quick">
      <select v-model.number="form.subject_id" class="inp">
        <option :value="0">Выбери предмет</option>
        <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <select v-model.number="form.level_id" class="inp">
        <option :value="0">Класс (уровень)</option>
        <option v-for="l in levels" :key="l.id" :value="l.id">{{ l.number }} класс</option>
      </select>
      <button class="btn primary" @click="createCourse">Создать курс</button>
    </div>

    <div class="grid">
      <div class="course" v-for="c in rows" :key="c.id">
        <h4>{{ c.title }}</h4>
        <p class="muted">Предмет: {{ c.subject }} • Класс: {{ c.level }} • Статус: {{ c.status }}</p>
        <router-link class="btn" :to="`/teacher/courses/${c.id}/edit`">Открыть</router-link>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../utils/api'

const rows = ref<any[]>([])
const subjects = ref<any[]>([])
const levels = ref<any[]>([])
const error = ref('')
const form = ref({ subject_id: 0, level_id: 0 })

async function loadSubjects(){ const { data } = await api.get('/teacher/subjects'); subjects.value = data }
async function loadLevels(){ const { data } = await api.get('/levels'); levels.value = data }
async function load(){ const { data } = await api.get('/teacher/courses'); rows.value = data }

async function createCourse(){
  if (!form.value.subject_id || !form.value.level_id) { alert('Выберите предмет и уровень'); return }
  const { data } = await api.post('/teacher/courses', form.value)
  // после создания попадём в редактор
  window.location.href = `/teacher/courses/${data.id}/edit`
}

onMounted(async ()=>{ await Promise.all([loadSubjects(), loadLevels(), load()]) })
</script>

<style scoped>
.card{padding:12px;border:1px solid #eee;border-radius:8px}
.quick{display:flex;gap:8px;margin-bottom:12px}
.inp{padding:6px;border:1px solid #ddd;border-radius:6px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.course{border:1px solid #eee;border-radius:8px;padding:10px}
.btn{padding:6px 10px;border:1px solid #ddd;border-radius:6px;background:#fff;text-decoration:none;cursor:pointer}
.btn.primary{border-color:#0a4ea6;color:#0a4ea6}
.muted{color:#666}
.error{color:#b00020}
</style>
