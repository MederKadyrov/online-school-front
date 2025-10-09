<template>
  <div class="submissions-container">
    <h2>Мониторинг работ студентов</h2>
    <p class="subtitle">Просмотр всех работ для контроля за учителями</p>

    <!-- Фильтры -->
    <div class="filters">
      <div class="filter-row">
        <div class="filter-item">
          <label>Статус</label>
          <select v-model="filters.status" class="inp" @change="loadSubmissions">
            <option value="">Все</option>
            <option value="submitted">Отправлено</option>
            <option value="returned">Проверено</option>
          </select>
        </div>

        <div class="filter-item">
          <label>Учитель</label>
          <select v-model="filters.teacher_id" class="inp" @change="onTeacherChange">
            <option value="">Все учителя</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>

        <div class="filter-item">
          <label>Курс</label>
          <select v-model="filters.course_id" class="inp" @change="loadSubmissions">
            <option value="">Все курсы</option>
            <option v-for="c in filteredCourses" :key="c.id" :value="c.id">{{ c.display_name }}</option>
          </select>
        </div>

        <div class="filter-item">
          <label>Группа</label>
          <select v-model="filters.group_id" class="inp" @change="loadSubmissions">
            <option value="">Все группы</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.display_name }}</option>
          </select>
        </div>

        <div class="filter-item">
          <label>Поиск студента</label>
          <input
            v-model="filters.student_search"
            class="inp"
            placeholder="Имя студента"
            @input="debouncedLoad"
          />
        </div>
      </div>
    </div>

    <!-- Счётчики -->
    <div class="counters">
      <span class="counter">Всего: <strong>{{ submissions.length }}</strong></span>
      <span class="counter ungraded">Непроверенных: <strong>{{ ungradedCount }}</strong></span>
      <span class="counter graded">Проверенных: <strong>{{ gradedCount }}</strong></span>
    </div>

    <!-- Таблица -->
    <div class="table-wrapper">
      <table class="submissions-table" v-if="submissions.length">
        <thead>
          <tr>
            <th>Студент</th>
            <th>Группа</th>
            <th>Учитель</th>
            <th>Курс</th>
            <th>Задание</th>
            <th>Дата отправки</th>
            <th>Статус</th>
            <th>Балл</th>
            <th>Оценка</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in submissions" :key="s.id" :class="{'highlight-new': s.status === 'submitted'}">
            <td>{{ s.student?.name || '—' }}</td>
            <td>{{ s.group?.name || '—' }}</td>
            <td>{{ s.teacher?.name || '—' }}</td>
            <td class="course-cell">{{ s.course?.title || '—' }}</td>
            <td class="assignment-cell">{{ s.assignment?.title || '—' }}</td>
            <td>{{ formatDate(s.submitted_at) }}</td>
            <td>
              <span class="status-badge" :class="statusClass(s.status)">
                {{ statusLabel(s.status) }}
              </span>
            </td>
            <td>{{ s.score ?? '—' }}</td>
            <td>{{ s.grade_5 ?? '—' }}</td>
            <td class="actions-cell">
              <button class="btn xs" @click="openViewModal(s)" title="Просмотр">
                👁️
              </button>
              <a
                v-if="s.file_path"
                :href="storageUrl(s.file_path)"
                target="_blank"
                class="btn xs"
                title="Скачать файл"
              >
                📎
              </a>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="muted">Нет отправок</p>
    </div>

    <!-- Модалка для просмотра -->
    <div v-if="viewModal.open" class="modal-overlay" @click.self="closeViewModal">
      <div class="modal-content">
        <button class="close-btn" @click="closeViewModal">×</button>
        <h3>Просмотр работы</h3>

        <div class="submission-details">
          <p><strong>Студент:</strong> {{ viewModal.submission?.student?.name }}</p>
          <p><strong>Группа:</strong> {{ viewModal.submission?.group?.name }}</p>
          <p><strong>Учитель:</strong> {{ viewModal.submission?.teacher?.name }}</p>
          <p><strong>Курс:</strong> {{ viewModal.submission?.course?.title }}</p>
          <p><strong>Задание:</strong> {{ viewModal.submission?.assignment?.title }}</p>
          <p><strong>Дата отправки:</strong> {{ formatDate(viewModal.submission?.submitted_at) }}</p>
          <p><strong>Статус:</strong>
            <span class="status-badge" :class="statusClass(viewModal.submission?.status)">
              {{ statusLabel(viewModal.submission?.status) }}
            </span>
          </p>
        </div>

        <div v-if="viewModal.submission?.text_answer" class="text-answer">
          <label>Текстовый ответ:</label>
          <div class="answer-box">{{ viewModal.submission.text_answer }}</div>
        </div>

        <div v-if="viewModal.submission?.file_path" class="file-download">
          <label>Файл:</label>
          <a :href="storageUrl(viewModal.submission.file_path)" target="_blank" class="btn">
            📎 Скачать файл
          </a>
        </div>

        <div v-if="viewModal.submission?.status === 'returned'" class="grading-info">
          <div class="grade-row">
            <div>
              <label>Балл:</label>
              <p class="grade-value">{{ viewModal.submission.score ?? '—' }}</p>
            </div>
            <div>
              <label>Оценка:</label>
              <p class="grade-value">{{ viewModal.submission.grade_5 ?? '—' }} / 5</p>
            </div>
          </div>

          <div v-if="viewModal.submission.teacher_comment" class="teacher-comment">
            <label>Комментарий учителя:</label>
            <div class="comment-box">{{ viewModal.submission.teacher_comment }}</div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn" @click="closeViewModal">Закрыть</button>
        </div>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '../utils/api'

const submissions = ref<any[]>([])
const courses = ref<any[]>([])
const groups = ref<any[]>([])
const teachers = ref<any[]>([])
const error = ref('')

const filters = ref({
  status: '',
  teacher_id: '',
  course_id: '',
  group_id: '',
  student_search: ''
})

const viewModal = ref({
  open: false,
  submission: null as any
})

const ungradedCount = computed(() =>
  submissions.value.filter(s => s.status === 'submitted').length
)

const gradedCount = computed(() =>
  submissions.value.filter(s => s.status === 'returned').length
)

// Фильтрация курсов по выбранному учителю
const filteredCourses = computed(() => {
  if (!filters.value.teacher_id) {
    return courses.value // Показать все курсы
  }
  return courses.value.filter(c => c.teacher_id === Number(filters.value.teacher_id))
})

function storageUrl(path: string) {
  return `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/storage/${path.replace(/^public\//, '')}`
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    'submitted': 'Отправлено',
    'returned': 'Проверено',
    'needs_fix': 'Требует доработки'
  }
  return labels[status] || status
}

function statusClass(status: string) {
  return {
    'status-submitted': status === 'submitted',
    'status-returned': status === 'returned'
  }
}

async function loadSubmissions() {
  error.value = ''
  try {
    const params: any = {}
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.teacher_id) params.teacher_id = filters.value.teacher_id
    if (filters.value.course_id) params.course_id = filters.value.course_id
    if (filters.value.group_id) params.group_id = filters.value.group_id
    if (filters.value.student_search) params.student_search = filters.value.student_search

    const { data } = await api.get('/admin/submissions', { params })
    submissions.value = data
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Ошибка загрузки'
  }
}

async function loadCourses() {
  try {
    const { data } = await api.get('/admin/submissions/courses')
    courses.value = data
  } catch (e: any) {
    console.error('Ошибка загрузки курсов:', e)
  }
}

async function loadGroups() {
  try {
    const { data } = await api.get('/admin/groups')
    groups.value = data
  } catch (e: any) {
    console.error('Ошибка загрузки групп:', e)
  }
}

async function loadTeachers() {
  try {
    const { data } = await api.get('/admin/submissions/teachers')
    teachers.value = data
  } catch (e: any) {
    console.error('Ошибка загрузки учителей:', e)
  }
}

async function onTeacherChange() {
  // Сбрасываем выбранный курс при смене учителя
  const selectedCourse = courses.value.find(c => c.id === Number(filters.value.course_id))

  // Если выбранный курс не принадлежит новому учителю, сбрасываем
  if (filters.value.teacher_id && selectedCourse && selectedCourse.teacher_id !== Number(filters.value.teacher_id)) {
    filters.value.course_id = ''
  }

  await loadSubmissions()
}

function debounce(fn: Function, ms = 400) {
  let t: any
  return (...args: any[]) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

const debouncedLoad = debounce(loadSubmissions, 400)

function openViewModal(submission: any) {
  viewModal.value.open = true
  viewModal.value.submission = submission
}

function closeViewModal() {
  viewModal.value.open = false
  viewModal.value.submission = null
}

onMounted(async () => {
  await Promise.all([
    loadSubmissions(),
    loadCourses(),
    loadGroups(),
    loadTeachers()
  ])
})
</script>

<style scoped>
.submissions-container {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  margin-bottom: 20px;
  font-size: 14px;
}

.filters {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-item label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.inp {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.counters {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eee;
}

.counter {
  font-size: 14px;
  color: #666;
}

.counter strong {
  font-size: 16px;
  color: #213547;
}

.counter.ungraded strong {
  color: #d97706;
}

.counter.graded strong {
  color: #22c55e;
}

.table-wrapper {
  overflow-x: auto;
}

.submissions-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  color: #555;
}

.submissions-table thead {
  background: #f6f8ff;
}

.submissions-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  color: #213547;
  border-bottom: 2px solid #e5e7eb;
}

.submissions-table td {
  padding: 12px;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.submissions-table tbody tr:hover {
  background: #fafafa;
}

.submissions-table tbody tr.highlight-new {
  background: #fff7ed;
}

.course-cell, .assignment-cell {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-submitted {
  background: #fef3c7;
  color: #92400e;
}

.status-returned {
  background: #d1fae5;
  color: #065f46;
}

.actions-cell {
  display: flex;
  gap: 6px;
}

.btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  color: #213547;
  display: inline-block;
}

.btn:hover {
  background: #f0f0f0;
}

.btn.xs {
  padding: 4px 8px;
  font-size: 12px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  color: #555;
}

.close-btn {
  position: absolute;
  right: 12px;
  top: 12px;
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #213547;
}

.submission-details {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.submission-details p {
  margin: 6px 0;
  font-size: 14px;
}

.text-answer {
  margin-bottom: 16px;
}

.answer-box {
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
  white-space: pre-wrap;
  font-size: 14px;
}

.file-download {
  margin-bottom: 16px;
}

.grading-info {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.grade-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.grade-row label {
  font-size: 13px;
  font-weight: 600;
  color: #065f46;
}

.grade-value {
  font-size: 24px;
  font-weight: 700;
  color: #16a34a;
  margin: 4px 0 0 0;
}

.teacher-comment {
  margin-top: 12px;
}

.teacher-comment label {
  font-size: 13px;
  font-weight: 600;
  color: #065f46;
  display: block;
  margin-bottom: 8px;
}

.comment-box {
  background: #fff;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 12px;
  white-space: pre-wrap;
  font-size: 14px;
  color: #166534;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: flex-end;
}

.error {
  color: #dc2626;
  margin-top: 8px;
  font-size: 14px;
}

.muted {
  color: #666;
  text-align: center;
  padding: 40px;
}
</style>
