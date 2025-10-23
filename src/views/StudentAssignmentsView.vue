<template>
  <div class="assignments-container">
    <div class="assignments-header">
      <h1>📝 Мои задания</h1>
    </div>

    <div class="filters-panel">
      <div class="filter-group">
        <label>Курс:</label>
        <select v-model="filters.courseId" @change="loadAssignments">
          <option value="">Все курсы</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.title }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>Статус:</label>
        <select v-model="filters.status" @change="loadAssignments">
          <option value="">Все</option>
          <option value="pending">Не выполнено</option>
          <option value="submitted">Выполнено</option>
          <option value="graded">Оценено</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>

    <div v-else-if="assignments.length === 0" class="no-data">
      Заданий не найдено
    </div>

    <div v-else class="assignments-list">
      <div
        v-for="assignment in assignments"
        :key="assignment.id"
        class="assignment-card"
        :class="getAssignmentStatusClass(assignment)"
      >
        <div class="assignment-header">
          <div class="assignment-info">
            <h3>{{ assignment.title }}</h3>
            <div class="assignment-meta">
              <span class="course-name">{{ assignment.course_title }}</span>
              <span class="chapter-name">{{ assignment.module_title }} → {{ assignment.chapter_title }}</span>
            </div>
          </div>
          <div class="assignment-status">
            <span class="status-badge" :class="assignment.submission_status || 'pending'">
              {{ getStatusLabel(assignment.submission_status) }}
            </span>
          </div>
        </div>

        <div class="assignment-body">
          <p v-if="assignment.description" class="description">{{ assignment.description }}</p>

          <div class="assignment-details">
            <div v-if="assignment.deadline" class="detail-item">
              <span class="label">Срок сдачи:</span>
              <span class="value" :class="{ 'deadline-soon': isDeadlineSoon(assignment.deadline), 'deadline-passed': isDeadlinePassed(assignment.deadline) }">
                {{ formatDate(assignment.deadline) }}
              </span>
            </div>

            <div v-if="assignment.max_points" class="detail-item">
              <span class="label">Макс. баллы:</span>
              <span class="value">{{ assignment.max_points }}</span>
            </div>

            <div v-if="assignment.grade" class="detail-item">
              <span class="label">Оценка:</span>
              <span class="value grade">{{ assignment.grade }}/5</span>
            </div>
          </div>
        </div>

        <div class="assignment-footer">
          <button
            class="btn-primary"
            @click="goToParagraph(assignment.paragraph_id)"
          >
            {{ assignment.submission_status === 'graded' ? 'Посмотреть' : 'Выполнить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'

const router = useRouter()

interface Assignment {
  id: number
  title: string
  description: string | null
  deadline: string | null
  max_points: number
  paragraph_id: number
  course_title: string
  module_title: string
  chapter_title: string
  submission_status: string | null
  grade: number | null
}

interface Course {
  id: number
  title: string
}

const loading = ref(false)
const assignments = ref<Assignment[]>([])
const courses = ref<Course[]>([])

const filters = ref({
  courseId: '',
  status: ''
})

onMounted(() => {
  loadCourses()
  loadAssignments()
})

async function loadCourses() {
  try {
    const { data } = await api.get('/student/courses')
    courses.value = data
  } catch (error) {
    console.error('Failed to load courses:', error)
  }
}

async function loadAssignments() {
  loading.value = true
  try {
    const params: any = {}
    if (filters.value.courseId) params.course_id = filters.value.courseId
    if (filters.value.status) params.status = filters.value.status

    const { data } = await api.get('/student/assignments', { params })
    assignments.value = data
  } catch (error) {
    console.error('Failed to load assignments:', error)
  } finally {
    loading.value = false
  }
}

function getStatusLabel(status: string | null): string {
  if (!status || status === 'pending') return 'Не выполнено'
  if (status === 'submitted') return 'Выполнено'
  if (status === 'graded') return 'Оценено'
  return status
}

function getAssignmentStatusClass(assignment: Assignment): string {
  if (assignment.submission_status === 'graded') return 'graded'
  if (assignment.submission_status === 'submitted') return 'submitted'
  if (assignment.deadline && isDeadlinePassed(assignment.deadline)) return 'overdue'
  if (assignment.deadline && isDeadlineSoon(assignment.deadline)) return 'deadline-soon'
  return ''
}

function isDeadlineSoon(deadline: string): boolean {
  const deadlineDate = new Date(deadline)
  const now = new Date()
  const diffDays = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > 0 && diffDays <= 3
}

function isDeadlinePassed(deadline: string): boolean {
  return new Date(deadline) < new Date()
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function goToParagraph(paragraphId: number) {
  router.push(`/student/paragraphs/${paragraphId}`)
}
</script>

<style scoped>
.assignments-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.assignments-header {
  margin-bottom: 2rem;
}

.assignments-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #1a202c;
}

.filters-panel {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
  color: #1a202c;

}

.filter-group select:focus {
  outline: none;
  border-color: #3182ce;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #718096;
  font-size: 1.125rem;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: #a0aec0;
  font-size: 1.125rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.assignment-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  border-left: 4px solid #cbd5e0;
}

.assignment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.assignment-card.graded {
  border-left-color: #48bb78;
}

.assignment-card.submitted {
  border-left-color: #4299e1;
}

.assignment-card.deadline-soon {
  border-left-color: #ed8936;
}

.assignment-card.overdue {
  border-left-color: #f56565;
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.assignment-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.assignment-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #718096;
}

.course-name {
  font-weight: 500;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.pending {
  background: #fed7d7;
  color: #c53030;
}

.status-badge.submitted {
  background: #bee3f8;
  color: #2c5282;
}

.status-badge.graded {
  background: #c6f6d5;
  color: #22543d;
}

.assignment-body {
  padding: 1.5rem;
}

.description {
  color: #4a5568;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.assignment-details {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.detail-item .label {
  font-size: 0.875rem;
  color: #718096;
}

.detail-item .value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2d3748;
}

.detail-item .value.deadline-soon {
  color: #dd6b20;
}

.detail-item .value.deadline-passed {
  color: #e53e3e;
}

.detail-item .value.grade {
  color: #38a169;
  font-size: 1rem;
}

.assignment-footer {
  padding: 1rem 1.5rem;
  background: #f7fafc;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  padding: 0.625rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}
</style>
