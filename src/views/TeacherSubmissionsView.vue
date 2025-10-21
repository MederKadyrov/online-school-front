<template>
  <div class="submissions-container">
    <h2>Работы студентов</h2>

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
          <label>Курс</label>
          <select v-model="filters.course_id" class="inp" @change="onCourseChange">
            <option value="">Все курсы</option>
            <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.title }}</option>
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
          <label>Задание</label>
          <select v-model="filters.assignment_id" class="inp" @change="loadSubmissions" :disabled="!filters.course_id">
            <option value="">{{ filters.course_id ? 'Все задания курса' : 'Сначала выберите курс' }}</option>
            <option v-for="a in assignments" :key="a.id" :value="a.id">{{ a.display_name }}</option>
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
            <th>Курс</th>
            <th>Задание</th>
            <th>Дата отправки</th>
            <th>Статус</th>
            <th>Оценка</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in submissions" :key="s.id" :class="{'highlight-new': s.status === 'submitted'}">
            <td>{{ s.student?.name || '—' }}</td>
            <td>{{ s.group?.name || '—' }}</td>
            <td class="course-cell">{{ s.course?.title || '—' }}</td>
            <td class="assignment-cell">{{ s.assignment?.title || '—' }}</td>
            <td>{{ formatDate(s.submitted_at) }}</td>
            <td>
              <span class="status-badge" :class="statusClass(s.status)">
                {{ statusLabel(s.status) }}
              </span>
            </td>
            <td>{{ s.grade_5 ?? '—' }}</td>
            <td class="actions-cell">
              <button class="btn xs" @click="openGradeModal(s)" title="Проверить">
                ✏️
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

    <!-- Модалка для проверки -->
    <div v-if="gradeModal.open" class="modal-overlay" @click.self="closeGradeModal">
      <div class="modal-content">
        <button class="close-btn" @click="closeGradeModal">×</button>
        <h3>Проверка работы</h3>

        <div class="submission-details">
          <p><strong>Студент:</strong> {{ gradeModal.submission?.student?.name }}</p>
          <p><strong>Группа:</strong> {{ gradeModal.submission?.group?.name }}</p>
          <p><strong>Задание:</strong> {{ gradeModal.submission?.assignment?.title }}</p>
          <p><strong>Дата отправки:</strong> {{ formatDate(gradeModal.submission?.submitted_at) }}</p>
        </div>

        <div v-if="gradeModal.submission?.text_answer" class="text-answer">
          <label>Текстовый ответ:</label>
          <div class="answer-box">{{ gradeModal.submission.text_answer }}</div>
        </div>

        <div v-if="gradeModal.submission?.file_path" class="file-download">
          <label>Файл:</label>
          <a :href="storageUrl(gradeModal.submission.file_path)" target="_blank" class="btn">
            📎 Скачать файл
          </a>
        </div>

        <div class="grade-form">
          <div class="form-row">
            <div class="form-item">
              <label>Оценка <span class="req">*</span></label>
              <select v-model.number="gradeModal.form.grade_5" class="inp">
                <option :value="null">Не выбрано</option>
                <option :value="2">2 (неудовлетворительно)</option>
                <option :value="3">3 (удовлетворительно)</option>
                <option :value="4">4 (хорошо)</option>
                <option :value="5">5 (отлично)</option>
              </select>
            </div>
          </div>

          <div class="form-item">
            <label>Комментарий</label>
            <textarea v-model="gradeModal.form.teacher_comment" class="inp" rows="4" placeholder="Оставьте комментарий студенту"></textarea>
          </div>

          <div class="modal-actions">
            <button class="btn primary" @click="submitGrade" :disabled="gradeModal.saving">
              {{ gradeModal.saving ? 'Сохранение...' : 'Оценить и вернуть' }}
            </button>
            <button class="btn" @click="closeGradeModal">Отмена</button>
          </div>

          <p v-if="gradeModal.err" class="error">{{ gradeModal.err }}</p>
          <p v-if="gradeModal.msg" class="ok">{{ gradeModal.msg }}</p>
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
const assignments = ref<any[]>([])
const error = ref('')

const filters = ref({
  status: '',
  course_id: '',
  group_id: '',
  assignment_id: '',
  student_search: ''
})

const gradeModal = ref({
  open: false,
  submission: null as any,
  form: {
    grade_5: null as number | null,
    teacher_comment: ''
  },
  saving: false,
  err: '',
  msg: ''
})

const ungradedCount = computed(() =>
  submissions.value.filter(s => s.status === 'submitted').length
)

const gradedCount = computed(() =>
  submissions.value.filter(s => s.status === 'returned').length
)

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
    if (filters.value.course_id) params.course_id = filters.value.course_id
    if (filters.value.group_id) params.group_id = filters.value.group_id
    if (filters.value.assignment_id) params.assignment_id = filters.value.assignment_id
    if (filters.value.student_search) params.student_search = filters.value.student_search

    const { data } = await api.get('/teacher/submissions', { params })
    submissions.value = data
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Ошибка загрузки'
  }
}

async function loadCourses() {
  try {
    const { data } = await api.get('/teacher/courses')
    courses.value = data
  } catch (e: any) {
    console.error('Ошибка загрузки курсов:', e)
  }
}

async function loadGroups() {
  try {
    const { data } = await api.get('/teacher/groups')
    groups.value = data
  } catch (e: any) {
    console.error('Ошибка загрузки групп:', e)
  }
}

async function loadAssignments(courseId?: string | number) {
  if (!courseId) {
    assignments.value = []
    return
  }

  try {
    const { data } = await api.get(`/teacher/courses/${courseId}/assignments`)
    assignments.value = data
  } catch (e: any) {
    console.error('Ошибка загрузки заданий:', e)
    assignments.value = []
  }
}

async function onCourseChange() {
  // Сбрасываем выбранное задание
  filters.value.assignment_id = ''

  // Загружаем задания выбранного курса
  await loadAssignments(filters.value.course_id)

  // Загружаем отправки
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

function openGradeModal(submission: any) {
  gradeModal.value.open = true
  gradeModal.value.submission = submission
  gradeModal.value.form = {
    grade_5: submission.grade_5 ?? null,
    teacher_comment: submission.teacher_comment || ''
  }
  gradeModal.value.err = ''
  gradeModal.value.msg = ''
}

function closeGradeModal() {
  gradeModal.value.open = false
  gradeModal.value.submission = null
}

async function submitGrade() {
  if (!gradeModal.value.submission) return

  if (gradeModal.value.form.grade_5 === null || gradeModal.value.form.grade_5 === undefined) {
    gradeModal.value.err = 'Выберите оценку'
    return
  }

  gradeModal.value.saving = true
  gradeModal.value.err = ''
  gradeModal.value.msg = ''

  try {
    await api.put(`/teacher/submissions/${gradeModal.value.submission.id}/grade`, {
      grade_5: gradeModal.value.form.grade_5,
      teacher_comment: gradeModal.value.form.teacher_comment,
      status: 'returned'
    })

    gradeModal.value.msg = 'Оценка выставлена'

    // Обновим submission в списке
    const idx = submissions.value.findIndex(s => s.id === gradeModal.value.submission.id)
    if (idx !== -1) {
      submissions.value[idx].grade_5 = gradeModal.value.form.grade_5
      submissions.value[idx].teacher_comment = gradeModal.value.form.teacher_comment
      submissions.value[idx].status = 'returned'
    }

    setTimeout(() => {
      closeGradeModal()
    }, 1000)
  } catch (e: any) {
    gradeModal.value.err = e?.data?.message || e?.message || 'Ошибка сохранения оценки'
  } finally {
    gradeModal.value.saving = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadSubmissions(),
    loadCourses(),
    loadGroups()
  ])
  // Задания загружаются только после выбора курса
})
</script>

<style scoped>
.submissions-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 20px;
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

.btn.primary {
  background: #0a4ea6;
  color: #fff;
  border-color: #0a4ea6;
}

.btn.primary:hover {
  background: #083d85;
}

.btn.primary:disabled {
  background: #ccc;
  border-color: #ccc;
  cursor: not-allowed;
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
  max-width: 600px;
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
  margin: 4px 0;
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

.grade-form {
  margin-top: 16px;
}

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.form-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item label {
  font-size: 14px;
  font-weight: 600;
}

.req {
  color: #dc2626;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.error {
  color: #dc2626;
  margin-top: 8px;
  font-size: 14px;
}

.ok {
  color: #22c55e;
  margin-top: 8px;
  font-size: 14px;
}

.muted {
  color: #666;
  text-align: center;
  padding: 40px;
}
</style>
