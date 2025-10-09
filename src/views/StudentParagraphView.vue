<template>
  <div class="card"> <!-- Ресурсы --> <h4>Ресурсы</h4>
    <p v-if="resErr" class="error">{{ resErr }}</p>
    <ul v-if="res.length" class="res-list">
      <li v-for="r in res" :key="r.id" class="res-item"><strong>[{{ r.type }}]</strong>
        <span>{{ r.title || '(без названия)' }}</span>
        <template v-if="r.type === 'file' && r.path"> — <a :href="storageUrl(r.path)" target="_blank">Скачать</a> <small
            v-if="r.mime">({{ r.mime }})</small></template>
        <template v-else-if="r.type !== 'text' && r.url"> — <a :href="r.url" target="_blank">Открыть</a></template>
        <template v-else-if="r.type === 'text'">
          <div class="res-text" v-html="r.text_content"></div>
        </template>
        <small v-if="r.duration_sec"> • {{ r.duration_sec }} сек</small></li>
    </ul>
    <p v-else class="muted">В этом параграфе нет ресурсов</p>
    <hr/> <!-- Тест --> <h4>Тест</h4>
    <p v-if="quizErr" class="error">{{ quizErr }}</p>
    <div v-if="quiz && quiz.id"><p><strong>{{ quiz.title }}</strong></p>
      <div class="muted" v-if="quiz.instructions" v-html="quiz.instructions"></div>
      <p class="muted"> Лимит: {{ quiz.time_limit_sec ? quiz.time_limit_sec + ' сек' : 'без ограничений' }}, попыток:
        {{ quiz.max_attempts || 'без ограничений' }} </p>
      <RouterLink class="btn" :to="`/student/paragraphs/${route.params.paragraphId}/quiz`"> Перейти к тесту</RouterLink>
    </div>
    <p v-else class="muted">Тест ещё не опубликован</p>
    <hr/> <!-- Задание (как было) --> <h4>Задание</h4>
    <div v-if="asg"><p><strong>{{ asg.title }}</strong></p>
      <div v-html="asg.instructions"></div> <!-- Файл-условие задания (если прикреплён) --> <p
          v-if="asg.attachments_path" class="muted"> Файл-условие: <a :href="storageUrl(asg.attachments_path)"
                                                                      target="_blank" rel="noopener">
        {{ asg.attachments_path.split('/').pop() }} </a></p>
      <p class="muted"> Дедлайн: {{ asg.due_at || '—' }}, Максимум: {{ asg.max_points }} </p>
      <div class="newline">
        <textarea v-model="answer.text" class="inp" placeholder="Ваш ответ (опционально)"></textarea> <input type="file"
                                                                                                             @change="pickFile"/>
        <button class="btn primary" @click="submit">Отправить</button>
      </div>
      <div v-if="my"><p>Статус: {{ my.status }}, Балл: {{ my.score ?? '-' }}, Оценка: {{ my.grade_5 ?? '-' }}</p>
        <p v-if="my.teacher_comment">Комментарий учителя: {{ my.teacher_comment }}</p>
      </div>
    </div>
    <p v-else class="muted">Нет опубликованных заданий в этом параграфе.</p></div>
</template>
<script setup lang="ts">

import {ref, onMounted} from 'vue'

import {useRoute, RouterLink} from 'vue-router'


import api from '../utils/api'

const route = useRoute()


const asg = ref<any | null>(null)
const my = ref<any | null>(null)
const answer = ref<{ text: string, file: any | null }>({text: '', file: null})

// ресурсы
const res = ref<any[]>([])
const resErr = ref('')
// тест
const quiz = ref<any | null>(null)
const quizErr = ref('')

function storageUrl(path: string) {
  return `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/storage/${path.replace(/^public\//, '')}`
}

function pickFile(e: any) {
  answer.value.file = e.target.files?.[0] || null
}

async function load() {
  // задания (как было)
  const {data} = await
      api.get(`/student/paragraphs/${route.params.paragraphId}/assignments`)
  asg.value = data[0] || null
  if (asg.value) {
    const m = await api.get(`/student/assignments/${asg.value.id}/my`)
    my.value = m.data
  }
  // ресурсы
  try {
    const r = await api.get(`/student/paragraphs/${route.params.paragraphId}/resources`)
    res.value = r.data || []
  } catch (e: any) {
    resErr.value = e?.data?.message || e?.message || 'Не удалось загрузить ресурсы'
  }
  // тест (если опубликован)
  try {
    const q = await api.get(`/student/paragraphs/${route.params.paragraphId}/quiz`)
    quiz.value = q.data || null
  } catch (e: any) {
    quizErr.value = e?.data?.message || e?.message || 'Не удалось загрузить тест'
  }
}

async function submit() {
  if (!asg.value) return
  const fd = new FormData()
  if (answer.value.file) fd.append('file', answer.value.file)
  if (answer.value.text) fd.append('text_answer', answer.value.text)
  const {data} = await api.post(`/student/assignments/${asg.value.id}/submit`, fd, {headers: {'Content-Type': 'multipart/form-data'}})
  my.value = data
}

onMounted(load)
</script>

<style scoped>
.res-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px
}

.res-item {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px
}

.res-text {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 8px;
  margin-top: 6px
}

.error {
  color: #b00020
}

.muted {
  color: #666
}
</style>