<template>
  <div class="student-journal-view">
    <h1>Мои оценки</h1>

    <!-- Фильтры -->
    <div class="filters">
      <div class="filter-group">
        <label>Курс:</label>
        <select v-model="filters.course_id" @change="onCourseChange">
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
    </div>

    <!-- Статистика -->
    <div v-if="journalData.total_grades !== undefined" class="summary">
      <div class="summary-item">
        <span>Всего оценок:</span>
        <strong>{{ journalData.total_grades }}</strong>
      </div>
      <div class="summary-item">
        <span>Средний балл:</span>
        <strong>{{ journalData.average?.toFixed(2) || 'N/A' }}</strong>
      </div>
    </div>

    <!-- Таблица оценок -->
    <div v-if="loading" class="loading">Загрузка...</div>

    <div v-else-if="filters.course_id && journalData.paragraphs?.length" class="journal-table-wrapper">
      <table class="journal-table">
        <thead>
          <tr class="header-row-1">
            <template v-for="module in journalData.modules" :key="module.module_id">
              <th
                :colspan="(paragraphsByModule[module.module_id]?.length || 0) * 2 + 1"
                :class="getModuleClass(module.module_number)"
              >
                {{ module.display_name }} - {{ module.title }}
              </th>
            </template>
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
          <tr>
            <template v-for="module in journalData.modules" :key="'mod-' + module.module_id">
              <template v-for="paragraph in paragraphsByModule[module.module_id]" :key="'grade-' + paragraph.paragraph_id">
                <td
                  class="grade-cell"
                  :class="[
                    getGradeCellClass(journalData.grades_by_paragraph[paragraph.paragraph_id]?.assignment?.grade),
                    getModuleCellClass(module.module_number)
                  ]"
                  @click="showGradeDetails(journalData.grades_by_paragraph[paragraph.paragraph_id]?.assignment)"
                  :title="getGradeTitle(journalData.grades_by_paragraph[paragraph.paragraph_id]?.assignment)"
                >
                  {{ journalData.grades_by_paragraph[paragraph.paragraph_id]?.assignment?.grade || '—' }}
                </td>
                <td
                  class="grade-cell"
                  :class="[
                    getGradeCellClass(journalData.grades_by_paragraph[paragraph.paragraph_id]?.quiz?.grade),
                    getModuleCellClass(module.module_number)
                  ]"
                  @click="showGradeDetails(journalData.grades_by_paragraph[paragraph.paragraph_id]?.quiz)"
                  :title="getGradeTitle(journalData.grades_by_paragraph[paragraph.paragraph_id]?.quiz)"
                >
                  {{ journalData.grades_by_paragraph[paragraph.paragraph_id]?.quiz?.grade || '—' }}
                </td>
              </template>

              <!-- Модульная оценка -->
              <td
                class="module-grade-cell"
                :class="[
                  getGradeCellClass(journalData.grades_by_module[module.module_id]?.grade),
                  getModuleCellClass(module.module_number)
                ]"
                @click="showModuleGradeDetails(journalData.grades_by_module[module.module_id])"
                :title="getModuleGradeTitle(journalData.grades_by_module[module.module_id])"
              >
                {{ journalData.grades_by_module[module.module_id]?.grade || '—' }}
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="filters.course_id" class="no-data">
      Нет оценок по выбранному курсу
    </div>

    <div v-else class="no-data">
      Выберите курс для просмотра оценок
    </div>

    <!-- Модалка с деталями оценки -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>Детали оценки</h2>

        <div v-if="gradeDetails" class="grade-details">
          <div class="detail-row">
            <span class="label">Тип:</span>
            <span class="value">{{ gradeDetails.title }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Баллы:</span>
            <span class="value">{{ gradeDetails.score }} / {{ gradeDetails.max_points }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Оценка:</span>
            <span class="value grade-badge" :class="getGradeBadgeClass(gradeDetails.grade)">
              {{ gradeDetails.grade }}
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
        </div>

        <button @click="closeModal" class="close-btn">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '../utils/api'

interface Course {
  id: number
  display_name: string
  subject_name: string
  teacher_name: string
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
  title: string
  graded_at: string
  teacher_comment?: string | null
}

interface ModuleGradeInfo {
  id: number
  grade: number | null
  graded_at: string | null
  teacher_comment?: string | null
}

interface JournalData {
  grades_by_paragraph: {
    [paragraph_id: number]: {
      assignment: GradeInfo | null
      quiz: GradeInfo | null
    }
  }
  grades_by_module: {
    [module_id: number]: ModuleGradeInfo | null
  }
  paragraphs: ParagraphInfo[]
  modules: ModuleInfo[]
  average?: number
  total_grades?: number
}

const courses = ref<Course[]>([])
const modules = ref<Module[]>([])

const filters = ref({
  course_id: '',
  module_id: 'all'
})

const journalData = ref<JournalData>({
  grades_by_paragraph: {},
  grades_by_module: {},
  paragraphs: [],
  modules: []
})
const loading = ref(false)

const showModal = ref(false)
const gradeDetails = ref<GradeInfo | null>(null)

// Группируем параграфы по модулям
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
  await loadCourses()
})

async function loadCourses() {
  try {
    const response = await api.get('/student/journal/courses')
    courses.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки курсов:', error)
  }
}

async function onCourseChange() {
  filters.value.module_id = 'all'
  if (filters.value.course_id) {
    await loadModules()
    await loadJournal()
  } else {
    journalData.value = {
      grades_by_paragraph: {},
      grades_by_module: {},
      paragraphs: [],
      modules: []
    }
  }
}

async function loadModules() {
  if (!filters.value.course_id) return

  try {
    const response = await api.get('/student/journal/modules', {
      params: { course_id: filters.value.course_id }
    })
    modules.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки модулей:', error)
  }
}

async function loadJournal() {
  if (!filters.value.course_id) return

  loading.value = true
  try {
    const response = await api.get('/student/journal', {
      params: filters.value
    })
    journalData.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки журнала:', error)
  } finally {
    loading.value = false
  }
}

function showGradeDetails(gradeInfo: GradeInfo | null | undefined) {
  if (gradeInfo) {
    gradeDetails.value = gradeInfo
    showModal.value = true
  }
}

function showModuleGradeDetails(moduleGrade: ModuleGradeInfo | null | undefined) {
  if (moduleGrade) {
    gradeDetails.value = {
      id: moduleGrade.id,
      grade: moduleGrade.grade,
      score: 0,
      max_points: 0,
      title: 'Модульная оценка',
      graded_at: moduleGrade.graded_at || '',
      teacher_comment: moduleGrade.teacher_comment
    }
    showModal.value = true
  }
}

function closeModal() {
  showModal.value = false
  gradeDetails.value = null
}

function getGradeTitle(gradeInfo: GradeInfo | null | undefined): string {
  if (!gradeInfo) return ''
  return `${gradeInfo.title}\nБаллы: ${gradeInfo.score}/${gradeInfo.max_points}\nДата: ${formatDate(gradeInfo.graded_at)}`
}

function getModuleGradeTitle(moduleGrade: ModuleGradeInfo | null | undefined): string {
  if (!moduleGrade) return ''
  return `Модульная оценка\nДата: ${formatDate(moduleGrade.graded_at || '')}`
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

function getGradeBadgeClass(grade: number | null): string {
  if (!grade) return 'grade-none'
  if (grade === 5) return 'grade-5'
  if (grade === 4) return 'grade-4'
  if (grade === 3) return 'grade-3'
  return 'grade-2'
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
</script>

<style scoped>
.student-journal-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
  color: #2c3e50;
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
  color: #2c3e50;
}

.filter-group select {
  padding: 10px 14px;
  border: 2px solid #3498db;
  border-radius: 6px;
  min-width: 250px;
  font-size: 14px;
  transition: all 0.3s;
}

.filter-group select:focus {
  outline: none;
  border-color: #2980b9;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.filter-group select:disabled {
  background-color: #ecf0f1;
  cursor: not-allowed;
  border-color: #bdc3c7;
}

.summary {
  display: flex;
  gap: 40px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 25px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-item span {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.summary-item strong {
  font-size: 32px;
  color: white;
  font-weight: 700;
}

.loading, .no-data {
  text-align: center;
  padding: 60px;
  color: #7f8c8d;
  font-size: 18px;
  background-color: #ecf0f1;
  border-radius: 8px;
}

.journal-table-wrapper {
  overflow-x: auto;
  position: relative;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-radius: 8px;
}

.journal-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  color: #2c3e50;
  font-size: 14px;
}

.journal-table th,
.journal-table td {
  padding: 12px;
  text-align: center;
  border: 1px solid #e0e0e0;
}

.journal-table th {
  background-color: #34495e;
  color: white;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
}

/* Заголовки модулей */
.header-row-1 th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-size: 15px;
  font-weight: 700;
  padding: 15px;
}

.module-0 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

.module-1 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
}

.module-2 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important;
}

.module-3 {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%) !important;
}

/* Заголовки параграфов */
.paragraph-header {
  background-color: #ecf0f1;
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
}

/* Подзаголовки З/Т */
.header-row-3 .subheader {
  background-color: #bdc3c7;
  font-size: 12px;
  font-weight: 700;
  width: 45px;
  padding: 8px;
  color: #2c3e50;
}

/* Ячейки с оценками */
.grade-cell {
  cursor: pointer;
  font-weight: 700;
  font-size: 16px;
  min-width: 45px;
  padding: 12px 8px;
  transition: all 0.2s;
}

.grade-cell:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 20;
}

/* Фоны ячеек по модулям */
.module-bg-0 {
  background-color: #f0f3ff;
}

.module-bg-1 {
  background-color: #fff0f7;
}

.module-bg-2 {
  background-color: #f0fbff;
}

.module-bg-3 {
  background-color: #f0fff7;
}

/* Цветовая индикация оценок */
.grade-cell.grade-5 {
  /* color: #27ae60; */
  font-weight: 800;
}

.grade-cell.grade-4 {
  /* color: #3498db; */
  font-weight: 800;
}

.grade-cell.grade-3 {
  /* color: #f39c12; */
  font-weight: 800;
}

.grade-cell.grade-2 {
  /* color: #e74c3c; */
  font-weight: 800;
}

/* Модульная оценка */
.module-grade-header {
  background-color: #95a5a6;
  font-size: 12px;
  font-weight: 700;
  width: 50px;
  padding: 8px;
  border-left: 3px solid #34495e !important;
  color: white;
}

.module-grade-cell {
  font-weight: 800;
  font-size: 18px;
  min-width: 50px;
  padding: 12px 8px;
  border-left: 3px solid #34495e !important;
  background-color: rgba(52, 73, 94, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.module-grade-cell:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 20;
}

.grade-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 16px;
}

.grade-5 {
  background-color: #27ae60;
  color: white;
}

.grade-4 {
  background-color: #3498db;
  color: white;
}

.grade-3 {
  background-color: #f39c12;
  color: white;
}

.grade-2 {
  background-color: #e74c3c;
  color: white;
}

.grade-none {
  background-color: #95a5a6;
  color: white;
}

/* Модалка */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background-color: white;
  padding: 35px;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 25px;
  color: #2c3e50;
  font-size: 24px;
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
  padding: 14px;
  background-color: #ecf0f1;
  border-radius: 6px;
}

.detail-row.full-width {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.detail-row .label {
  font-weight: 700;
  color: #7f8c8d;
  font-size: 14px;
}

.detail-row .value {
  color: #2c3e50;
  font-weight: 600;
}

.detail-row .comment {
  margin: 0;
  padding: 12px;
  background-color: white;
  border-radius: 6px;
  width: 100%;
  white-space: pre-wrap;
  border-left: 4px solid #3498db;
}

.close-btn {
  margin-top: 25px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
}

.close-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>
