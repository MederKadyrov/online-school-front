<template>
  <div>
    <h3>Teacher Lessons</h3>
    <div class="row">
      <div>
        <label>From</label><input v-model="from" placeholder="2025-09-01" />
      </div>
      <div>
        <label>To</label><input v-model="to" placeholder="2025-09-30" />
      </div>
    </div>
    <button @click="loadLessons">Load</button>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-for="lesson in lessons?.data || []" :key="lesson.id" class="card">
      <div><b>#{{ lesson.id }}</b> — {{ lesson.subject?.name || ('subject ' + lesson.subject_id) }}</div>
      <div>Start: {{ lesson.starts_at }} — End: {{ lesson.ends_at }}</div>
      <div>Group: {{ lesson.group?.name || ('group ' + lesson.group_id) }}</div>
      <div v-if="lesson.meeting_url">
        <a :href="lesson.meeting_url" target="_blank">Join meeting</a>
      </div>
      <div style="margin-top:8px;">
        <button @click="openAttendance(lesson)">Mark attendance</button>
      </div>


      <div v-if="openLessonId === lesson.id" class="card" style="background:#f9f9f9;">
        <h4>Attendance for lesson #{{ lesson.id }}</h4>
        <div>
          <button @click="loadStudents(lesson.id)">Load students of this group</button>
          <div v-if="studentsError" class="error">{{ studentsError }}</div>
          <ul>
            <li v-for="st in students" :key="st.id" style="display:flex; gap:8px; align-items:center;">
              <span style="min-width:220px;">{{ st.name }} (id: {{ st.id }})</span>
              <select v-model="formStates[st.id]" style="max-width:220px;">
                <option value="">— статус —</option>
                <option value="present">present</option>
                <option value="late">late</option>
                <option value="excused_absence">excused_absence</option>
                <option value="unexcused_absence">unexcused_absence</option>
              </select>
            </li>
          </ul>
          <button @click="submitAttendance(lesson.id)" :disabled="saving">{{ saving ? 'Saving...' : 'Save attendance' }}</button>
          <div v-if="saveOk" class="success">Saved ✔</div>
          <div v-if="saveError" class="error">{{ saveError }}</div>
        </div>
      </div>

      <!--   Оценки   -->
      <div class="card" style="background:#192021; margin-top:10px;">
        <h4>Grades for lesson #{{ lesson.id }}</h4>
        <div v-if="gradesError" class="error">{{ gradesError }}</div>
        <div v-else>
          <table style="width:100%; border-collapse: collapse;">
            <thead>
            <tr>
              <th style="text-align:left; border-bottom:1px solid #eee; padding:6px;">Student</th>
              <th style="text-align:left; border-bottom:1px solid #eee; padding:6px;">Attendance</th>
              <th style="text-align:left; border-bottom:1px solid #eee; padding:6px;">Grade (1..10)</th>
              <th style="text-align:left; border-bottom:1px solid #eee; padding:6px;">Comment</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="st in students" :key="st.id">
              <td style="padding:6px;">{{ st.name }} (id: {{ st.id }})</td>
              <td style="padding:6px;">
                {{ attendanceByStudent[st.id] || '—' }}
              </td>
              <td style="padding:6px; max-width:120px;">
                <input
                    type="number" min="1" max="10"
                    v-model.number="grading(st.id).value"
                    :disabled="['excused_absence','unexcused_absence'].includes(attendanceByStudent[st.id])"
                    :title="(['excused_absence','unexcused_absence'].includes(attendanceByStudent[st.id]) ? 'Нельзя ставить оценку отсутствующим' : '')"
                    style="width:80px;"
                />
              </td>
              <td style="padding:6px;">
                <input
                    v-model="grading(st.id).comment"
                    :disabled="['excused_absence','unexcused_absence'].includes(attendanceByStudent[st.id])"
                    placeholder="optional"
                />
              </td>
            </tr>
            </tbody>
          </table>

          <button @click="submitGrades(lesson.id)" :disabled="savingGrades" style="margin-top:8px;">
            {{ savingGrades ? 'Saving...' : 'Save grades' }}
          </button>
          <div v-if="saveGradesOk" class="success">Grades saved ✔</div>
          <div v-if="saveGradesError" class="error">{{ saveGradesError }}</div>
        </div>
      </div>


    </div>

    <div v-if="lessons?.meta" style="margin-top:8px;">
      <small class="help">Total: {{ lessons.meta.total }}</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import api from '../utils/api'
import { ref } from 'vue'

const from = ref('2025-09-01')
const to = ref('2025-09-30')
const error = ref('')
const lessons = ref<any>(null)

const openLessonId = ref<number | null>(null)
const students = ref<any[]>([])
const studentsError = ref('')
const formStates = ref<Record<number, string>>({})
const saving = ref(false)
const saveOk = ref(false)
const saveError = ref('')

// grades
const gradingStates = ref<Record<number, { value: number | null; comment: string }>>({})
const attendanceByStudent = ref<Record<number, string>>({})
const gradesLoaded = ref(false)
const gradesError = ref('')

const savingGrades = ref(false)
const saveGradesOk = ref(false)
const saveGradesError = ref('')
const grading = (id: number) => {
  if (!gradingStates.value[id]) {
    gradingStates.value[id] = { value: null, comment: '' }
  }
  return gradingStates.value[id]
}
const att = (id: number) => attendanceByStudent.value[id] || ''


const loadLessons = async () => {
  error.value = ''
  try {
    const { data } = await api.get('/teacher/lessons', { params: { from: from.value, to: to.value } })
    lessons.value = data
  } catch (e: any) {
    error.value = e?.data?.message || 'Load error'
  }
}

const loadStudents = async (lessonId: number) => {
  studentsError.value = ''
  try {
    const { data } = await api.get(`/teacher/lessons/${lessonId}/students`)
    students.value = data

    // автозадаём всем "present" для посещаемости (как мы делали)
    formStates.value = {}
    for (const st of students.value) formStates.value[st.id] = 'present'

    // ВАЖНО: сразу подготовим контейнеры для оценок
    for (const st of students.value) {
      if (!gradingStates.value[st.id]) {
        gradingStates.value[st.id] = { value: null, comment: '' }
      }
    }
  } catch (e: any) {
    studentsError.value = e?.data?.message || 'Error loading students'
  }
}


const loadAttendanceForLesson = async (lessonId: number) => {
  // GET /teacher/lessons/{lesson}/attendance
  try {
    const { data } = await api.get(`/teacher/lessons/${lessonId}/attendance`)
    attendanceByStudent.value = {}
    for (const row of data) {
      attendanceByStudent.value[row.student_id] = row.status  // present/late/...
    }
  } catch (e:any) {
    // не критично для рендера, просто покажем пустое
    attendanceByStudent.value = {}
  }
}

const loadGradesForLesson = async (lessonId: number) => {
  gradesError.value = ''
  gradesLoaded.value = false
  try {
    const { data } = await api.get(`/teacher/lessons/${lessonId}/grades`)
    // заполним текущее состояние оценок (если были)
    gradingStates.value = {}
    for (const st of students.value) {
      const found = data.find((g: any) => g.student_id === st.id)
      gradingStates.value[st.id] = {
        value: found ? found.value : null,
        comment: found?.comment || ''
      }
    }
    gradesLoaded.value = true
  } catch (e:any) {
    gradesError.value = e?.data?.message || 'Error loading grades'
  }
}

const openAttendance = async (lesson: any) => {
  openLessonId.value = lesson.id
  students.value = []
  studentsError.value = ''
  formStates.value = {}
  saveError.value = ''
  saveOk.value = false
  await loadStudents(lesson.id)           // уже автозагрузка
  await loadAttendanceForLesson(lesson.id)
  await loadGradesForLesson(lesson.id)
}
const submitAttendance = async (lessonId: number) => {
  saving.value = true
  saveError.value = ''
  saveOk.value = false
  try {
    const items = Object.entries(formStates.value)
        .filter(([_, status]) => !!status)
        .map(([student_id, status]) => ({ student_id: Number(student_id), status }))
    if (!items.length) throw new Error('Не выбраны статусы ни для одного студента')

    await api.post('/teacher/attendance', { lesson_id: lessonId, items })
    saveOk.value = true
  } catch (e: any) {
    saveError.value = e?.data?.message || e?.data || e?.status || e?.toString()
  } finally {
    saving.value = false
  }
}

// Логика сохранения оценок

const submitGrades = async (lessonId: number) => {
  savingGrades.value = true
  saveGradesOk.value = false
  saveGradesError.value = ''
  try {
    // берём только тех, у кого выбран value (число)
    const items = Object.entries(gradingStates.value)
        .filter(([sid, obj]) => obj.value != null && obj.value !== undefined && obj.value !== '' )
        .map(([sid, obj]) => ({ student_id: Number(sid), value: Number(obj.value), comment: obj.comment || null }))

    if (!items.length) throw new Error('Нет ни одной оценки для сохранения')

    await api.post('/teacher/grades', { lesson_id: lessonId, items })
    saveGradesOk.value = true
  } catch (e:any) {
    saveGradesError.value = e?.data?.message || e?.message || 'Error'
  } finally {
    savingGrades.value = false
  }
}

loadLessons()
</script>
