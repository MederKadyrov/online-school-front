<template>
  <div class="card">
    <h3>Тест</h3>

    <div v-if="!quiz">
      <p class="muted">В этом параграфе тест пока не опубликован.</p>
    </div>

    <div v-else>
      <p><strong>{{ quiz.title }}</strong></p>
      <div v-html="quiz.instructions"></div>

      <!-- Информация о лимитах и оставшихся попытках -->
      <p class="muted">
        Лимит: {{ quiz.time_limit_sec || 'нет' }} сек,
        попыток:
        <template v-if="quiz.max_attempts">
          <template v-if="remainingAttempts !== null && remainingAttempts > 0">
            осталось {{ remainingAttempts }} из {{ quiz.max_attempts }}
          </template>
          <template v-else>
            У Вас закончились попытки
          </template>
        </template>
        <template v-else>
          без ограничений
        </template>
      </p>

      <!-- Таймер в процессе попытки -->
      <p v-if="attempt && attempt.status==='in_progress' && quiz.time_limit_sec" class="muted">
        Оставшееся время: {{ formatTime(timeLeft) }}
      </p>

      <!-- Блок кнопок: начало/повтор и возврат -->
      <div class="actions">
        <button
          v-if="!inProgress"
          class="btn primary"
          @click="start"
          :disabled="!!quiz.max_attempts && remainingAttempts === 0"
        >
          {{ attempt ? 'Пройти заново' : 'Начать' }}
        </button>
        <router-link class="btn" :to="`/student/paragraphs/${paragraphId}`">
          Вернуться к параграфу
        </router-link>
        
      </div>

      <!-- Вопросы во время попытки -->
      <div v-if="inProgress">
        <div v-for="q in quiz.questions" :key="q.id" class="box">
          <p><strong>#{{ q.position }}.</strong> {{ q.text }} <small>({{ q.points }} б.)</small></p>

          <!-- single -->
          <div v-if="q.type==='single'">
            <label v-for="o in q.options" :key="o.id" class="inline block">
              <input type="radio" :name="'q_'+q.id" :value="o.id"
                     :checked="chosen[q.id]?.includes(o.id)"
                     @change="chooseSingle(q, o)" />
              {{ o.text }}
            </label>
          </div>

          <!-- multiple -->
          <div v-else-if="q.type==='multiple'">
            <label v-for="o in q.options" :key="o.id" class="inline block">
              <input type="checkbox"
                     :checked="chosen[q.id]?.includes(o.id)"
                     @change="toggleMulti(q, o)" />
              {{ o.text }}
            </label>
          </div>

          <!-- text -->
          <div v-else>
            <textarea class="inp" rows="3" v-model="textAns[q.id]" @blur="saveText(q)"></textarea>
          </div>
        </div>

        <div class="actions">
          <button
            class="btn primary"
            @click="finish"
            :disabled="finishing"
          >
            Завершить
          </button>
        </div>
      </div>

      <!-- Итоги после завершения -->
      <div v-if="result && !inProgress" class="result-summary">
        <p class="ok">
          Результат: {{ result.score }}/{{ quiz.max_points }} → {{ result.grade_5 }}/5
        </p>
        <p class="muted">
          Правильных: {{ result.correct_count ?? '–' }},
          Неправильных: {{ result.wrong_count ?? '–' }}
          <span v-if="result.unanswered_count !== undefined">,
            Без ответа: {{ result.unanswered_count }}
          </span>
        </p>
        <div class="actions">
          <button
            class="btn primary"
            v-if="!quiz.max_attempts || (remainingAttempts !== null && remainingAttempts > 0)"
            @click="start"
          >
            Пройти заново
          </button>

        </div>
        <p v-if="quiz.max_attempts && remainingAttempts !== null && remainingAttempts === 0" class="error">
          У Вас закончились попытки
        </p>
      </div>

      <p class="error" v-if="err">{{ err }}</p>
    </div>
  </div>
</template>
<script setup lang="ts">
// Импорты
import { ref, onMounted, onUnmounted, computed } from 'vue'
import api from '../utils/api'
import { useRoute } from 'vue-router'
import { useBreadcrumb } from '../composables/useBreadcrumb'

const route = useRoute()
const paragraphId = Number(route.params.paragraphId)
const { setBreadcrumb } = useBreadcrumb()

const quiz = ref<any|null>(null)
const attempt = ref<any|null>(null)
const err = ref('')
const finishing = ref(false)
const result = ref<any|null>(null)

// выбранные ответы
const chosen = ref<Record<number, number[]>>({})
const textAns = ref<Record<number, string>>({})

// попытки
const attempts = ref<any[]>([])
const remainingAttempts = computed(() => {
  if (!quiz.value?.max_attempts) return null
  return Math.max((quiz.value.max_attempts || 0) - (attempts.value?.length || 0), 0)
})

const inProgress = computed(() => attempt.value?.status === 'in_progress')

// таймер
const timeLeft = ref(0)
let timerId: any = null

function clearTimer() {
  if (timerId) { clearInterval(timerId); timerId = null }
}

function formatTime(s: number) {
  const mm = Math.floor((s || 0) / 60).toString().padStart(2, '0')
  const ss = ((s || 0) % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
}

function setupTimerFromAttempt(att: any) {
  clearTimer()
  if (!quiz.value?.time_limit_sec) return
  const startStr = att?.started_at
  if (!startStr) return
  const startMs = Date.parse(String(startStr).replace(' ', 'T'))
  const endMs = startMs + (Number(quiz.value.time_limit_sec) || 0) * 1000
  const tick = async () => {
    const sec = Math.max(0, Math.ceil((endMs - Date.now()) / 1000))
    timeLeft.value = sec
    if (sec <= 0 && attempt.value && attempt.value.status === 'in_progress') {
      clearTimer()
      try { await finish() } catch {}
    }
  }
  tick()
  timerId = setInterval(tick, 1000)
}

async function load(){
  err.value=''

  // Получаем информацию о параграфе для breadcrumbs
  try {
    const paragraphInfo = await api.get(`/student/paragraphs/${paragraphId}`)
    const paragraph = paragraphInfo.data

    if (paragraph) {
      const courseId = paragraph.chapter?.module?.course?.id
      const courseTitle = paragraph.chapter?.module?.course?.title || 'Курс'
      const paragraphTitle = paragraph.title || 'Параграф'

      // Устанавливаем breadcrumb для курса
      if (courseId) {
        setBreadcrumb(`/student/courses/${courseId}`, {
          label: courseTitle,
          icon: '📖',
          path: `/student/courses/${courseId}`
        })
      }

      // Устанавливаем breadcrumb для параграфа
      setBreadcrumb(`/student/paragraphs/${paragraphId}`, {
        label: paragraphTitle,
        icon: '📄',
        path: `/student/paragraphs/${paragraphId}`
      })
    }
  } catch (e: any) {
    console.error('Не удалось загрузить информацию о параграфе:', e)
  }

  const { data } = await api.get(`/student/paragraphs/${paragraphId}/quiz`)
  quiz.value = data || null
  if (quiz.value?.id) {
    // Устанавливаем breadcrumb для теста
    setBreadcrumb(route.path, {
      label: quiz.value.title || 'Тест',
      icon: '🧪',
      path: route.path
    })

    const list = await api.get(`/student/quizzes/${quiz.value.id}/my-attempts`)
    attempts.value = list.data || []
    const curr = (attempts.value || []).find((a:any)=>a.status==='in_progress')
    if (curr) {
      attempt.value = curr
      setupTimerFromAttempt(curr)
    }
  }
}

async function start(){
  err.value=''
  if (!quiz.value) return
  try {
    const { data } = await api.post(`/student/quizzes/${quiz.value.id}/start`, {})
    attempt.value = data
    chosen.value = {}
    textAns.value = {}
    // обновим список попыток и таймер
    const list = await api.get(`/student/quizzes/${quiz.value.id}/my-attempts`)
    attempts.value = list.data || []
    setupTimerFromAttempt(data)
    result.value = null
  } catch (e:any) {
    err.value = e?.data?.message || e?.message || 'Не удалось начать попытку'
  }
}

async function chooseSingle(q:any, o:any){
  chosen.value[q.id] = [o.id]
  await api.post(`/student/attempts/${attempt.value.id}/answer`, {
    question_id: q.id, selected_option_ids: [o.id]
  })
}

async function toggleMulti(q:any, o:any){
  const list = new Set(chosen.value[q.id] || [])
  if (list.has(o.id)) list.delete(o.id); else list.add(o.id)
  chosen.value[q.id] = Array.from(list)
  await api.post(`/student/attempts/${attempt.value.id}/answer`, {
    question_id: q.id, selected_option_ids: chosen.value[q.id]
  })
}

async function saveText(q:any){
  await api.post(`/student/attempts/${attempt.value.id}/answer`, {
    question_id: q.id, text_answer: textAns.value[q.id] || ''
  })
}

async function finish(){
  finishing.value = true
  err.value = ''
  try{
    const { data } = await api.post(`/student/attempts/${attempt.value.id}/finish`, {})
    attempt.value = data
    result.value = data
    clearTimer()
    if (quiz.value?.id) {
      const list = await api.get(`/student/quizzes/${quiz.value.id}/my-attempts`)
      attempts.value = list.data || []
    }
  }catch(e:any){
    err.value = e?.data?.message || e?.message || 'Ошибка завершения'
  }finally{
    finishing.value = false
  }
}

onMounted(load)
onUnmounted(clearTimer)
</script>
