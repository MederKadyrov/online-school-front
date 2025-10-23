<template>
  <div class="student-paragraph-view">
    <!-- Заголовок параграфа -->
    <div class="paragraph-header">
      <h1>{{ paragraph?.title || 'Параграф' }}</h1>
      <p v-if="paragraph?.chapter" class="paragraph-path">
        {{ paragraph.chapter?.module?.course?.title }} →
        Модуль {{ paragraph.chapter?.module?.number }} →
        Глава {{ paragraph.chapter?.number }}
      </p>
    </div>

    <!-- Сетка контента -->
    <div class="content-grid">

      <!-- Ресурсы -->
      <section class="content-section resources-section">
        <div class="section-header">
          <h2>📚 Учебные материалы</h2>
        </div>

        <div class="section-body">
          <p v-if="resErr" class="error-message">{{ resErr }}</p>

          <div v-if="res.length" class="resources-list">
            <div v-for="r in res" :key="r.id" class="resource-card">
              <div class="resource-header">
                <span class="resource-type-badge" :class="`badge-${r.type}`">
                  {{ getResourceTypeLabel(r.type) }}
                </span>
                <h3 class="resource-title">{{ r.title || '(без названия)' }}</h3>
              </div>

              <div class="resource-content">
                <template v-if="r.type === 'file' && r.path">
                  <a :href="storageUrl(r.path)" target="_blank" class="resource-link">
                    📎 Скачать файл
                  </a>
                  <span v-if="r.mime" class="resource-meta">{{ r.mime }}</span>
                </template>

                <template v-else-if="r.type !== 'text' && r.url">
                  <a :href="r.url" target="_blank" class="resource-link">
                    🔗 Открыть ссылку
                  </a>
                </template>

                <template v-else-if="r.type === 'text'">
                  <div class="resource-text" v-html="r.text_content"></div>
                </template>

                <span v-if="r.duration_sec" class="resource-duration">
                  ⏱️ {{ formatDuration(r.duration_sec) }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <span class="empty-icon">📭</span>
            <p>В этом параграфе нет учебных материалов</p>
          </div>
        </div>
      </section>

      <!-- Тест -->
      <section class="content-section quiz-section">
        <div class="section-header">
          <h2>✍️ Тестирование</h2>
        </div>

        <div class="section-body">
          <p v-if="quizErr" class="error-message">{{ quizErr }}</p>

          <div v-if="quiz && quiz.id" class="quiz-card">
            <h3 class="quiz-title">{{ quiz.title }}</h3>

            <div v-if="quiz.instructions" class="quiz-instructions" v-html="quiz.instructions"></div>

            <div class="quiz-info">
              <div class="info-item">
                <span class="info-icon">⏱️</span>
                <span class="info-label">Время:</span>
                <span class="info-value">{{ quiz.time_limit_sec ? formatDuration(quiz.time_limit_sec) : 'без ограничений' }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon">🔄</span>
                <span class="info-label">Попытки:</span>
                <span class="info-value">{{ quiz.max_attempts || 'без ограничений' }}</span>
              </div>
            </div>

            <RouterLink class="btn btn-primary btn-large" :to="`/student/paragraphs/${route.params.paragraphId}/quiz`">
              Начать тест
            </RouterLink>
          </div>

          <div v-else class="empty-state">
            <span class="empty-icon">📝</span>
            <p>Тест ещё не опубликован</p>
          </div>
        </div>
      </section>

      <!-- Задание -->
      <section class="content-section assignment-section">
        <div class="section-header">
          <h2>📋 Практическое задание</h2>
        </div>

        <div class="section-body">
          <div v-if="asg" class="assignment-card">
            <h3 class="assignment-title">{{ asg.title }}</h3>

            <div class="assignment-instructions" v-html="asg.instructions"></div>

            <!-- Файл-условие задания -->
            <div v-if="asg.attachments_path" class="attachment-info">
              <span class="attachment-icon">📎</span>
              <a :href="storageUrl(asg.attachments_path)" target="_blank" rel="noopener" class="attachment-link">
                {{ asg.attachments_path.split('/').pop() }}
              </a>
            </div>

            <div class="assignment-meta">
              <div class="meta-item">
                <span class="meta-icon">📅</span>
                <span class="meta-label">Дедлайн:</span>
                <span class="meta-value">{{ formatDate(asg.due_at) || 'не указан' }}</span>
              </div>
            </div>

            <!-- Статус отправки -->
            <div v-if="my" class="submission-status">
              <div class="status-header">
                <span class="status-badge" :class="`status-${my.status}`">
                  {{ getStatusLabel(my.status) }}
                </span>
                <span v-if="my.grade_5" class="grade-badge" :class="`grade-${my.grade_5}`">
                  Оценка: {{ my.grade_5 }}
                </span>
              </div>

              <div v-if="my.teacher_comment" class="teacher-comment">
                <strong>💬 Комментарий учителя:</strong>
                <p>{{ my.teacher_comment }}</p>
              </div>
            </div>

            <!-- Форма отправки -->
            <div class="submission-form" :class="{ 'disabled': isFormDisabled }">
              <h4>Отправить решение</h4>

              <div class="form-group">
                <label for="text-answer">Текстовый ответ (необязательно):</label>
                <textarea
                  id="text-answer"
                  v-model="answer.text"
                  class="form-textarea"
                  rows="6"
                  placeholder="Введите ваш ответ..."
                  :disabled="isFormDisabled"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="file-input">Прикрепить файл (необязательно):</label>
                <div class="file-input-wrapper">
                  <input
                    id="file-input"
                    type="file"
                    @change="pickFile"
                    :disabled="isFormDisabled"
                    class="file-input"
                  />
                  <label for="file-input" class="file-input-label">
                    <span class="file-icon">📎</span>
                    <span>{{ answer.file ? answer.file.name : 'Выберите файл' }}</span>
                  </label>
                </div>
              </div>

              <button
                class="btn btn-success btn-large"
                @click="submit"
                :disabled="submitting || isFormDisabled"
              >
                {{ submitting ? 'Отправка...' : 'Отправить задание' }}
              </button>

              <p v-if="isFormDisabled" class="form-note">
                Задание уже отправлено. Дождитесь проверки преподавателем.
              </p>
            </div>
          </div>

          <div v-else class="empty-state">
            <span class="empty-icon">📄</span>
            <p>Нет опубликованных заданий в этом параграфе</p>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import api from '../utils/api'
import { useBreadcrumb } from '../composables/useBreadcrumb'

const route = useRoute()
const { setBreadcrumb } = useBreadcrumb()

const paragraph = ref<any | null>(null)
const asg = ref<any | null>(null)
const my = ref<any | null>(null)
const answer = ref<{ text: string, file: any | null }>({ text: '', file: null })
const submitting = ref(false)

// ресурсы
const res = ref<any[]>([])
const resErr = ref('')

// тест
const quiz = ref<any | null>(null)
const quizErr = ref('')

// Computed свойство для проверки, должна ли форма быть заблокирована
const isFormDisabled = computed(() => {
  if (!my.value) return false
  return my.value.status === 'submitted' || my.value.status === 'returned'
})

function storageUrl(path: string) {
  return `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/storage/${path.replace(/^public\//, '')}`
}

function pickFile(e: any) {
  answer.value.file = e.target.files?.[0] || null
}

function getResourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'file': 'Файл',
    'video': 'Видео',
    'link': 'Ссылка',
    'text': 'Текст',
    'audio': 'Аудио'
  }
  return labels[type] || type
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'draft': 'Черновик',
    'submitted': 'Отправлено',
    'returned': 'Проверено'
  }
  return labels[status] || status
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} сек`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds > 0 ? `${minutes} мин ${remainingSeconds} сек` : `${minutes} мин`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function load() {
  try {
    const paragraphInfo = await api.get(`/student/paragraphs/${route.params.paragraphId}`)
    paragraph.value = paragraphInfo.data

    if (paragraph.value) {
      const courseId = paragraph.value.chapter?.module?.course?.id
      const courseTitle = paragraph.value.chapter?.module?.course?.title || 'Курс'
      const paragraphTitle = paragraph.value.title || 'Параграф'

      if (courseId) {
        setBreadcrumb(`/student/courses/${courseId}`, {
          label: courseTitle,
          icon: '📖',
          path: `/student/courses/${courseId}`
        })
      }

      setBreadcrumb(route.path, {
        label: paragraphTitle,
        icon: '📄',
        path: route.path
      })
    }
  } catch (e: any) {
    console.error('Не удалось загрузить информацию о параграфе:', e)
  }

  // задания
  try {
    const { data } = await api.get(`/student/paragraphs/${route.params.paragraphId}/assignments`)
    asg.value = data[0] || null
    if (asg.value) {
      const m = await api.get(`/student/assignments/${asg.value.id}/my`)
      my.value = m.data
    }
  } catch (e: any) {
    console.error('Ошибка загрузки задания:', e)
  }

  // ресурсы
  try {
    const r = await api.get(`/student/paragraphs/${route.params.paragraphId}/resources`)
    res.value = r.data || []
  } catch (e: any) {
    resErr.value = e?.data?.message || e?.message || 'Не удалось загрузить ресурсы'
  }

  // тест
  try {
    const q = await api.get(`/student/paragraphs/${route.params.paragraphId}/quiz`)
    quiz.value = q.data || null
  } catch (e: any) {
    quizErr.value = e?.data?.message || e?.message || 'Не удалось загрузить тест'
  }

  // Update progress
  try {
    await api.post(`/student/paragraphs/${route.params.paragraphId}/progress`)
  } catch (e: any) {
    console.error('Failed to update progress:', e)
  }
}

async function submit() {
  if (!asg.value || submitting.value) return

  submitting.value = true
  try {
    const fd = new FormData()
    if (answer.value.file) fd.append('file', answer.value.file)
    if (answer.value.text) fd.append('text_answer', answer.value.text)

    const { data } = await api.post(`/student/assignments/${asg.value.id}/submit`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    my.value = data
    answer.value = { text: '', file: null }

    // Update progress after submitting assignment
    try {
      await api.post(`/student/paragraphs/${route.params.paragraphId}/progress`)
    } catch (e: any) {
      console.error('Failed to update progress:', e)
    }
  } catch (e: any) {
    alert('Ошибка отправки: ' + (e?.data?.message || e?.message))
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.student-paragraph-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Заголовок параграфа */
.paragraph-header {
  margin-bottom: 30px;
}

.paragraph-header h1 {
  font-size: 28px;
  color: #213547;
  margin: 0 0 8px 0;
}

.paragraph-path {
  color: #666;
  font-size: 14px;
  margin: 0;
}

/* Сетка контента */
.content-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
}

/* Секции */
.content-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.section-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  color: white;
}

.section-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.section-body {
  padding: 24px;
}

/* Ресурсы */
.resources-list {
  display: grid;
  gap: 16px;
}

.resource-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.resource-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.resource-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.resource-type-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.badge-file { background: #dbeafe; color: #1e40af; }
.badge-video { background: #fce7f3; color: #be123c; }
.badge-link { background: #d1fae5; color: #065f46; }
.badge-text { background: #fef3c7; color: #92400e; }
.badge-audio { background: #e0e7ff; color: #3730a3; }

.resource-title {
  font-size: 16px;
  font-weight: 600;
  color: #213547;
  margin: 0;
  flex: 1;
}

.resource-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.resource-link:hover {
  text-decoration: underline;
}

.resource-text {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  line-height: 1.6;
  color: #374151;
}

.resource-meta,
.resource-duration {
  font-size: 13px;
  color: #6b7280;
}

/* Тест */
.quiz-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quiz-title {
  font-size: 20px;
  font-weight: 600;
  color: #213547;
  margin: 0;
}

.quiz-instructions {
  color: #4b5563;
  line-height: 1.6;
}

.quiz-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.info-icon {
  font-size: 20px;
}

.info-label {
  font-weight: 600;
  color: #6b7280;
  font-size: 14px;
}

.info-value {
  color: #213547;
  font-weight: 500;
}

/* Задание */
.assignment-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.assignment-title {
  font-size: 20px;
  font-weight: 600;
  color: #213547;
  margin: 0;
}

.assignment-instructions {
  color: #4b5563;
  line-height: 1.6;
}

.attachment-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
}

.attachment-icon {
  font-size: 20px;
}

.attachment-link {
  color: #92400e;
  text-decoration: none;
  font-weight: 500;
}

.attachment-link:hover {
  text-decoration: underline;
}

.assignment-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f3f4f6;
  border-radius: 6px;
}

.meta-icon {
  font-size: 18px;
}

.meta-label {
  font-weight: 600;
  color: #6b7280;
  font-size: 14px;
}

.meta-value {
  color: #213547;
  font-weight: 500;
}

/* Статус отправки */
.submission-status {
  padding: 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
}

.status-draft { background: #e5e7eb; color: #374151; }
.status-submitted { background: #fef3c7; color: #92400e; }
.status-returned { background: #d1fae5; color: #065f46; }

.grade-badge {
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
}

.grade-5 { background: #22c55e; color: white; }
.grade-4 { background: #3b82f6; color: white; }
.grade-3 { background: #f59e0b; color: white; }
.grade-2 { background: #ef4444; color: white; }

.teacher-comment {
  margin-top: 8px;
}

.teacher-comment strong {
  display: block;
  margin-bottom: 8px;
  color: #065f46;
}

.teacher-comment p {
  margin: 0;
  color: #166534;
  line-height: 1.6;
}

/* Форма отправки */
.submission-form {
  padding: 20px;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
}

.submission-form.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.submission-form h4 {
  margin: 0 0 16px 0;
  color: #213547;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.file-input-wrapper {
  position: relative;
}

.file-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.file-input-label {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.file-input-label:hover {
  border-color: #667eea;
  background: #f9fafb;
}

.file-icon {
  font-size: 20px;
}

.form-note {
  margin-top: 12px;
  color: #6b7280;
  font-size: 13px;
  font-style: italic;
}

/* Кнопки */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-large {
  padding: 14px 28px;
  font-size: 16px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-success {
  background: #22c55e;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #16a34a;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Пустое состояние */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.empty-state p {
  color: #6b7280;
  font-size: 15px;
  margin: 0;
}

/* Сообщения об ошибках */
.error-message {
  padding: 12px 16px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  font-size: 14px;
}

/* Адаптивность */
@media (min-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr 1fr;
  }

  .resources-section {
    grid-column: 1 / -1;
  }
}

@media (max-width: 767px) {
  .student-paragraph-view {
    padding: 16px;
  }

  .paragraph-header h1 {
    font-size: 24px;
  }

  .section-header {
    padding: 16px;
  }

  .section-header h2 {
    font-size: 18px;
  }

  .section-body {
    padding: 16px;
  }

  .quiz-info,
  .assignment-meta {
    grid-template-columns: 1fr;
  }
}

@media print {
  .submission-form,
  .btn {
    display: none;
  }
}
</style>
