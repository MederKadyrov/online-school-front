<template>
  <div class="admin-journal-view">
    <h1>Журнал оценок</h1>

    <!-- Фильтры -->
    <div class="filters">
      <div class="filter-group">
        <label>Группа:</label>
        <select v-model="filters.group_id" @change="onGroupChange">
          <option value="">Выберите группу</option>
          <option v-for="group in groups" :key="group.id" :value="group.id">
            {{ group.display_name }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>Курс:</label>
        <select v-model="filters.course_id" @change="onCourseChange" :disabled="!filters.group_id">
          <option value="">Выберите курс</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.display_name }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>Модуль:</label>
        <select v-model="filters.module_id" @change="loadJournal" :disabled="!filters.course_id">
          <option value="all">Все модули</option>
          <option v-for="module in modules" :key="module.id" :value="module.id">
            {{ module.display_name }}
          </option>
        </select>
      </div>

      <button @click="exportJournal" :disabled="!journalData.students?.length" class="export-btn">
        📄 Экспорт
      </button>
    </div>

    <!-- Статистика -->
    <div v-if="journalData.summary" class="summary">
      <div class="summary-item">
        <span>Всего студентов:</span>
        <strong>{{ journalData.summary.total_students }}</strong>
      </div>
      <div class="summary-item">
        <span>Всего оценок:</span>
        <strong>{{ journalData.summary.total_grades }}</strong>
      </div>
      <div class="summary-item">
        <span>Средний балл:</span>
        <strong>{{ journalData.summary.average_grade?.toFixed(2) || 'N/A' }}</strong>
      </div>
    </div>

    <!-- Таблица журнала -->
    <div v-if="loading" class="loading">Загрузка...</div>

    <div v-else-if="journalData.students?.length" class="journal-table-wrapper">
      <table class="journal-table">
        <thead>
          <tr class="header-row-1">
            <th rowspan="3" class="sticky-col">№</th>
            <th rowspan="3" class="sticky-col student-name-col">Студент</th>
            <template v-for="module in journalData.modules" :key="module.module_id">
              <th
                :colspan="(paragraphsByModule[module.module_id]?.length || 0) * 2 + 1"
                :class="getModuleClass(module.module_number)"
              >
                {{ module.display_name }}
              </th>
            </template>
            <th rowspan="3" class="average-col">Средний балл</th>
            <th rowspan="3" class="final-grade-col">Годовая</th>
            <th v-if="journalData.course?.has_exam_grades" rowspan="3" class="final-grade-col">Экзамен</th>
            <th v-if="journalData.course?.has_exam_grades" rowspan="3" class="final-grade-col">Итоговая</th>
          </tr>
          <tr class="header-row-2">
            <template v-for="module in journalData.modules" :key="'para-' + module.module_id">
              <template v-for="paragraph in paragraphsByModule[module.module_id]" :key="paragraph.paragraph_id">
                <th colspan="2" class="paragraph-header" :title="paragraph.title">
                  {{ paragraph.display_name }}
                </th>
              </template>
              <th rowspan="2" class="module-grade-header">МО</th>
            </template>
          </tr>
          <tr class="header-row-3">
            <template v-for="module in journalData.modules" :key="'sub-' + module.module_id">
              <template v-for="paragraph in paragraphsByModule[module.module_id]" :key="'subh-' + paragraph.paragraph_id">
                <th class="subheader">З</th>
                <th class="subheader">Т</th>
              </template>
            </template>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(student, index) in journalData.students" :key="student.student_id">
            <td class="sticky-col">{{ index + 1 }}</td>
            <td class="sticky-col student-name-col">{{ student.student_name }}</td>

            <template v-for="module in journalData.modules" :key="'mod-' + module.module_id">
              <template v-for="paragraph in paragraphsByModule[module.module_id]" :key="'grade-' + paragraph.paragraph_id">
                <td
                  class="grade-cell"
                  :class="[
                    getGradeCellClass(student.grades_by_paragraph[paragraph.paragraph_id]?.assignment?.grade),
                    getModuleCellClass(module.module_number)
                  ]"
                  @click="handleGradeClick(student.grades_by_paragraph[paragraph.paragraph_id]?.assignment)"
                >
                  {{ student.grades_by_paragraph[paragraph.paragraph_id]?.assignment?.grade || '—' }}
                </td>
                <td
                  class="grade-cell"
                  :class="[
                    getGradeCellClass(student.grades_by_paragraph[paragraph.paragraph_id]?.quiz?.grade),
                    getModuleCellClass(module.module_number)
                  ]"
                  @click="handleGradeClick(student.grades_by_paragraph[paragraph.paragraph_id]?.quiz)"
                >
                  {{ student.grades_by_paragraph[paragraph.paragraph_id]?.quiz?.grade || '—' }}
                </td>
              </template>

              <!-- Модульная оценка -->
              <td
                class="module-grade-cell"
                :class="[
                  getGradeCellClass(student.grades_by_module[module.module_id]?.grade),
                  getModuleCellClass(module.module_number)
                ]"
                :title="student.grades_by_module[module.module_id]?.graded_at ? 'Выставлено: ' + formatDate(student.grades_by_module[module.module_id]!.graded_at!) : ''"
              >
                {{ student.grades_by_module[module.module_id]?.grade || '—' }}
              </td>
            </template>

            <td class="average-cell">{{ student.average?.toFixed(2) || 'N/A' }}</td>

            <!-- Годовая оценка -->
            <td
              class="final-grade-cell"
              :class="getGradeCellClass(student.yearly_grade?.grade)"
              :title="student.yearly_grade?.graded_at ? 'Выставлено: ' + formatDate(student.yearly_grade.graded_at) : ''"
            >
              {{ student.yearly_grade?.grade || '—' }}
            </td>

            <!-- Экзаменационная оценка (только для 9 и 11 классов) -->
            <td
              v-if="journalData.course?.has_exam_grades"
              class="final-grade-cell"
              :class="getGradeCellClass(student.exam_grade?.grade)"
              :title="student.exam_grade?.graded_at ? 'Выставлено: ' + formatDate(student.exam_grade.graded_at) : ''"
            >
              {{ student.exam_grade?.grade || '—' }}
            </td>

            <!-- Итоговая оценка (только для 9 и 11 классов) -->
            <td
              v-if="journalData.course?.has_exam_grades"
              class="final-grade-cell"
              :class="getGradeCellClass(student.final_grade?.grade)"
              :title="student.final_grade?.graded_at ? 'Выставлено: ' + formatDate(student.final_grade.graded_at) : ''"
            >
              {{ student.final_grade?.grade || '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="filters.group_id && filters.course_id" class="no-data">
      Нет данных для отображения
    </div>

    <div v-else class="no-data">
      Выберите группу и курс для просмотра журнала
    </div>

    <!-- Модалка с деталями оценки -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>Детали оценки</h2>

        <div v-if="gradeDetails" class="grade-details">
          <div class="detail-row">
            <span class="label">Студент:</span>
            <span class="value">{{ gradeDetails.student_name }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Группа:</span>
            <span class="value">{{ gradeDetails.group }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Предмет:</span>
            <span class="value">{{ gradeDetails.subject }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Учитель:</span>
            <span class="value">{{ gradeDetails.teacher }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Тип:</span>
            <span class="value">{{ getGradeType(gradeDetails.type) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Название:</span>
            <span class="value">{{ gradeDetails.title }}</span>
          </div>
          <div v-if="gradeDetails.type === 'QuizAttempt'" class="detail-row">
            <span class="label">Баллы:</span>
            <span class="value">{{ gradeDetails.score }} / {{ gradeDetails.max_points }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Оценка:</span>
            <span class="value grade-badge" :class="getGradeBadgeClass(gradeDetails.grade_5)">
              {{ gradeDetails.grade_5 }}
            </span>
          </div>
          <div class="detail-row">
            <span class="label">Дата:</span>
            <span class="value">{{ formatDate(gradeDetails.graded_at) }}</span>
          </div>

          <div v-if="gradeDetails.teacher_comment" class="detail-row full-width">
            <span class="label">Комментарий учителя:</span>
            <p class="comment">{{ gradeDetails.teacher_comment }}</p>
          </div>

          <!-- Дополнительная информация для теста -->
          <div v-if="gradeDetails.quiz" class="extra-info">
            <h3>Информация о тесте</h3>
            <div class="detail-row">
              <span class="label">Начало:</span>
              <span class="value">{{ formatDate(gradeDetails.quiz.started_at) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Окончание:</span>
              <span class="value">{{ formatDate(gradeDetails.quiz.finished_at) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Автопроверка:</span>
              <span class="value">{{ gradeDetails.quiz.autograded ? 'Да' : 'Нет' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Ответов:</span>
              <span class="value">{{ gradeDetails.quiz.answers_count }}</span>
            </div>
          </div>

          <!-- Дополнительная информация для задания -->
          <div v-if="gradeDetails.assignment" class="extra-info">
            <h3>Информация о задании</h3>
            <div class="detail-row">
              <span class="label">Сдано:</span>
              <span class="value">{{ formatDate(gradeDetails.assignment.submitted_at) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Статус:</span>
              <span class="value">{{ getSubmissionStatus(gradeDetails.assignment.status) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Файл:</span>
              <span class="value">{{ gradeDetails.assignment.has_file ? 'Прикреплен' : 'Нет' }}</span>
            </div>
            <div v-if="gradeDetails.assignment.text_answer" class="detail-row full-width">
              <span class="label">Ответ студента:</span>
              <p class="comment">{{ gradeDetails.assignment.text_answer }}</p>
            </div>
          </div>
        </div>

        <div v-else class="loading">Загрузка...</div>

        <button @click="closeModal" class="close-btn">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '../utils/api'
// import api from '@/services/api'

interface Group {
  id: number
  display_name: string
}

interface Course {
  id: number
  display_name: string
}

interface Module {
  id: number
  display_name: string
}

interface ParagraphInfo {
  paragraph_id: number
  module_id: number
  module_number: number
  chapter_number: number
  paragraph_number: number
  display_name: string
  title: string
}

interface ModuleInfo {
  module_id: number
  module_number: number
  display_name: string
  title: string
}

interface GradeInfo {
  id: number
  grade: number | null
  score: number
  max_points: number
}

interface ModuleGradeInfo {
  id: number
  grade: number | null
  graded_at: string | null
}

interface FinalGradeInfo {
  id: number
  grade: number | null
  graded_at: string | null
  teacher_comment?: string | null
}

interface StudentData {
  student_id: number
  student_name: string
  grades_by_paragraph: {
    [paragraph_id: number]: {
      assignment: GradeInfo | null
      quiz: GradeInfo | null
    }
  }
  grades_by_module: {
    [module_id: number]: ModuleGradeInfo | null
  }
  yearly_grade?: FinalGradeInfo | null
  exam_grade?: FinalGradeInfo | null
  final_grade?: FinalGradeInfo | null
  average: number
}

interface JournalData {
  students: StudentData[]
  paragraphs: ParagraphInfo[]
  modules: ModuleInfo[]
  course?: {
    id: number
    level_id: number
    has_exam_grades: boolean
  }
  summary?: {
    total_students: number
    total_grades: number
    average_grade: number
  }
}

const groups = ref<Group[]>([])
const courses = ref<Course[]>([])
const modules = ref<Module[]>([])

const filters = ref({
  group_id: '',
  course_id: '',
  module_id: 'all'
})

const journalData = ref<JournalData>({ students: [], paragraphs: [], modules: [] })
const loading = ref(false)

const showModal = ref(false)
const gradeDetails = ref<any>(null)

// Группируем параграфы по модулям для визуального отображения
const paragraphsByModule = computed(() => {
  const grouped: { [moduleId: number]: ParagraphInfo[] } = {}
  journalData.value.paragraphs.forEach(para => {
    if (!grouped[para.module_id]) {
      grouped[para.module_id] = []
    }
    grouped[para.module_id].push(para)
  })
  return grouped
})

onMounted(async () => {
  await loadGroups()
  await loadCourses()
})

async function loadGroups() {
  try {
    const response = await api.get('/admin/journal/groups')
    groups.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки групп:', error)
  }
}

async function loadCourses(groupId?: string) {
  try {
    const params = groupId ? { group_id: groupId } : {}
    const response = await api.get('/admin/journal/courses', { params })
    courses.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки курсов:', error)
  }
}

async function onGroupChange() {
  filters.value.course_id = ''
  filters.value.module_id = 'all'
  modules.value = []
  journalData.value = { students: [], paragraphs: [], modules: [] }

  // Загружаем курсы для выбранной группы
  if (filters.value.group_id) {
    await loadCourses(filters.value.group_id)
  } else {
    courses.value = []
  }
}

async function onCourseChange() {
  filters.value.module_id = 'all'
  await loadModules()
  await loadJournal()
}

async function loadModules() {
  if (!filters.value.course_id) return

  try {
    const response = await api.get('/admin/journal/modules', {
      params: { course_id: filters.value.course_id }
    })
    modules.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки модулей:', error)
  }
}

async function loadJournal() {
  if (!filters.value.group_id || !filters.value.course_id) return

  loading.value = true
  try {
    const response = await api.get('/admin/journal', {
      params: filters.value
    })
    journalData.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки журнала:', error)
  } finally {
    loading.value = false
  }
}

function handleGradeClick(gradeInfo: GradeInfo | null | undefined) {
  if (gradeInfo && gradeInfo.id) {
    showGradeDetails(gradeInfo.id)
  }
}

async function showGradeDetails(gradeId: number) {
  showModal.value = true
  gradeDetails.value = null

  try {
    const response = await api.get(`/admin/journal/grades/${gradeId}`)
    gradeDetails.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки деталей оценки:', error)
  }
}

function closeModal() {
  showModal.value = false
  gradeDetails.value = null
}

function getGradeCellClass(grade: number | null | undefined): string {
  if (!grade) return ''
  if (grade === 5) return 'grade-5'
  if (grade >= 4) return 'grade-4'
  if (grade >= 3) return 'grade-3'
  return 'grade-2'
}

function getModuleClass(moduleNumber: number): string {
  return `module-${moduleNumber % 4}`
}

function getModuleCellClass(moduleNumber: number): string {
  return `module-bg-${moduleNumber % 4}`
}

function getRomanNumeral(number: number): string {
  const map: { [key: number]: string } = {
    10: 'X', 9: 'IX', 5: 'V', 4: 'IV', 1: 'I'
  }
  let result = ''
  let num = number
  for (const value in map) {
    const intValue = parseInt(value)
    while (num >= intValue) {
      result += map[intValue]
      num -= intValue
    }
  }
  return result
}

function getGradeBadgeClass(grade: number | null): string {
  if (!grade) return 'grade-none'
  if (grade === 5) return 'grade-5'
  if (grade === 4) return 'grade-4'
  if (grade === 3) return 'grade-3'
  return 'grade-2'
}

function getGradeType(type: string): string {
  const types: Record<string, string> = {
    'QuizAttempt': 'Тест',
    'AssignmentSubmission': 'Задание',
    'Module': 'Модуль',
    'Lesson': 'Урок'
  }
  return types[type] || type
}

function getSubmissionStatus(status: string): string {
  const statuses: Record<string, string> = {
    'submitted': 'Сдано',
    'returned': 'Проверено',
    'needs_fix': 'Требует доработки'
  }
  return statuses[status] || status
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function exportJournal() {
  try {
    const response = await api.get('/admin/journal/export', {
      params: {
        group_id: filters.value.group_id,
        course_id: filters.value.course_id,
        module_id: filters.value.module_id
      },
      responseType: 'blob'
    })

    // Создаем blob URL и скачиваем файл
    const blob = new Blob([response.data], { type: 'text/csv; charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // Извлекаем имя файла из заголовка Content-Disposition или генерируем его
    const contentDisposition = response.headers['content-disposition']
    let filename = 'journal.csv'
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '')
      }
    }

    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Ошибка экспорта журнала:', error)
    alert('Ошибка при экспорте данных')
  }
}
</script>

<style scoped>
.admin-journal-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-weight: 600;
  font-size: 14px;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
  background-color: #fcfbfb;
  color: #333;
}

.filter-group select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.export-btn {
  padding: 8px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.export-btn:hover:not(:disabled) {
  background-color: #218838;
}

.export-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.summary {
  display: flex;
  gap: 30px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.summary-item span {
  font-size: 14px;
  color: #666;
}

.summary-item strong {
  font-size: 24px;
  color: #333;
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

.journal-table-wrapper {
  overflow-x: auto;
  position: relative;
}

.journal-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  color: #333;
  font-size: 13px;
}

.journal-table th,
.journal-table td {
  padding: 8px;
  text-align: center;
  border: 1px solid #ddd;
}

.journal-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 10;
}

.journal-table .sticky-col {
  position: sticky;
  left: 0;
  background-color: white;
  z-index: 5;
}

.journal-table thead .sticky-col {
  z-index: 15;
  background-color: #f8f9fa;
}

.student-name-col {
  left: 40px !important;
  min-width: 180px;
  text-align: left;
}

.journal-table tbody .sticky-col:first-child {
  left: 0;
  width: 40px;
}

.journal-table tbody tr:hover {
  background-color: #f8f9fa;
}

.journal-table tbody tr:hover .sticky-col {
  background-color: #f8f9fa;
}

/* Заголовки модулей */
.header-row-1 th {
  background-color: #e9ecef;
  font-size: 14px;
  font-weight: 700;
}

.module-0 {
  background-color: #e3f2fd !important;
}

.module-1 {
  background-color: #f3e5f5 !important;
}

.module-2 {
  background-color: #e8f5e9 !important;
}

.module-3 {
  background-color: #fff3e0 !important;
}

/* Заголовки параграфов */
.paragraph-header {
  background-color: #f8f9fa;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

/* Подзаголовки З/Т */
.header-row-3 .subheader {
  background-color: #dee2e6;
  font-size: 11px;
  font-weight: 600;
  width: 35px;
  padding: 4px;
}

/* Ячейки с оценками */
.grade-cell {
  cursor: pointer;
  font-weight: 600;
  min-width: 35px;
  padding: 6px 4px;
  transition: transform 0.1s, box-shadow 0.1s;
}

.grade-cell:hover {
  transform: scale(1.05);
  box-shadow: 0 0 8px rgba(0,0,0,0.2);
  z-index: 20;
}

/* Фоны ячеек по модулям */
.module-bg-0 {
  background-color: #f0f8ff;
}

.module-bg-1 {
  background-color: #faf5ff;
}

.module-bg-2 {
  background-color: #f1f8f4;
}

.module-bg-3 {
  background-color: #fffaf0;
}

/* Цветовая индикация оценок */
.grade-cell.grade-5 {
  font-weight: 700;
}

.grade-cell.grade-4 {
  font-weight: 700;
}

.grade-cell.grade-3 {
  font-weight: 700;
}

.grade-cell.grade-2 {
  font-weight: 700;
}

/* Модульная оценка */
.module-grade-header {
  background-color: #dee2e6;
  font-size: 11px;
  font-weight: 700;
  width: 40px;
  padding: 4px;
  border-left: 2px solid #495057 !important;
}

.module-grade-cell {
  font-weight: 700;
  min-width: 40px;
  padding: 6px 4px;
  border-left: 2px solid #495057 !important;
  background-color: rgba(0, 0, 0, 0.02);
}

/* Колонка среднего балла */
.average-col {
  background-color: #e9ecef;
  font-weight: 700;
  min-width: 100px;
}

.average-cell {
  background-color: #f8f9fa;
  font-weight: 700;
  font-size: 14px;
  color: #495057;
}

/* Финальные оценки (годовая, экзаменационная, итоговая) */
.final-grade-col {
  background-color: #fff3cd;
  font-weight: 700;
  min-width: 80px;
  border-left: 2px solid #ffc107;
  color: #856404;
}

.final-grade-cell {
  background-color: #fffbf0;
  font-weight: 700;
  font-size: 14px;
  text-align: center;
  border-left: 2px solid #ffc107;
}

.grade-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s;
}

.grade-badge:hover {
  transform: scale(1.1);
}

.grade-5 {
  background-color: #28a745;
  color: white;
}

.grade-4 {
  color: white;
  background-color: #17a2b8;
}

.grade-3 {
  background-color: #ffc107;
  color: #333;
}

.grade-2 {
  background-color: #dc3545;
  color: white;
}

.grade-none {
  background-color: #6c757d;
  color: white;
}

.no-grades {
  color: #999;
  font-style: italic;
}

/* Модалка */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  color: #333;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 20px;
}

.grade-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.detail-row.full-width {
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.detail-row .label {
  font-weight: 600;
  color: #666;
}

.detail-row .value {
  color: #333;
}

.detail-row .comment {
  margin: 0;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  width: 100%;
  white-space: pre-wrap;
}

.extra-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #ddd;
}

.extra-info h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
}

.close-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
}

.close-btn:hover {
  background-color: #5a6268;
}

@media print {
  .filters, .export-btn, .modal-overlay {
    display: none !important;
  }

  .grade-badge {
    cursor: default;
  }

  .grade-badge:hover {
    transform: none;
  }
}
</style>
