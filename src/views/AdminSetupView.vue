<template>
  <div class="card">
    <h3>Admin — Quick Setup</h3>

    <!-- 1. Создать предмет -->
    <div class="card">
      <h4>1) Subject</h4>
      <div class="row">
        <div>
          <label>Name</label><input v-model="subject.name" placeholder="Math" />
        </div>
        <div>
          <label>Code</label><input v-model="subject.code" placeholder="MATH" />
        </div>
      </div>
      <button @click="createSubject">Create subject</button>
      <div v-if="msg.subject" class="success">{{ msg.subject }}</div>
      <div v-if="err.subject" class="error">{{ err.subject }}</div>
      <div style="margin-top:8px;">
        <small class="help">Existing: {{ subjects.map(s => s.code).join(', ') }}</small>
      </div>
    </div>

    <!-- 2. Создать группу -->
    <div class="card">
      <h4>2) Create group</h4>

      <div class="row">
        <div>
          <label>Group name</label>
          <input v-model="group.name" placeholder="Например: 7А" />
        </div>
        <div>
          <label>Level (class 1..12)</label>
          <select v-model.number="group.level_id">
            <option :value="0">— select level —</option>
            <option v-for="lv in levels" :key="lv.id" :value="lv.id">
              {{ lv.title || (lv.number + ' класс') }}
            </option>
          </select>
        </div>
        <div>
          <label>Class letter (optional)</label>
          <input v-model="group.class_letter" maxlength="2" />
        </div>
      </div>

      <button @click="createGroup" :disabled="saving.group">
        {{ saving.group ? 'Saving...' : 'Create group' }}
      </button>
      <div v-if="msg.group" class="success">{{ msg.group }}</div>
      <div v-if="err.group" class="error">{{ err.group }}</div>
    </div>



    <!-- 4. Прикрепить студентов к группе -->
    <div class="card">
      <h4>4) Attach students to group</h4>
      <div class="row">
        <div>
          <label>Group</label>
          <select v-model.number="attach.group_id">
            <option :value="0">— select group —</option>
            <option v-for="g in groups" :value="g.id" :key="g.id">{{ g.name }} ({{ g.students_count }})</option>
          </select>
        </div>
        <div>
          <label>Search</label>
          <input v-model="studentSearch" @input="loadStudents" placeholder="name/email/phone" />
        </div>
      </div>

      <div v-if="students.length === 0"><small class="help">No students loaded. Use search or register a student on 'Register Student' page.</small></div>
      <div v-else>
        <ul>
          <li v-for="s in students" :key="s.id">
            <label>
              <input type="checkbox" :value="s.id" v-model="attach.student_ids" />
              {{ s.name }} ({{ s.email || 'no email' }})
            </label>
          </li>
        </ul>
        <button @click="doAttach">Attach selected</button>
        <div v-if="msg.attach" class="success">{{ msg.attach }}</div>
        <div v-if="err.attach" class="error">{{ err.attach }}</div>
      </div>
    </div>

    <!-- 5. Создать урок -->
    <div class="card">
      <h4>5) Create lesson</h4>
      <div class="row">
        <div>
          <label>Teacher</label>
          <select v-model.number="selectedTeacherId">
            <option :value="0">— select teacher —</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">
              {{ t.name }} ({{ t.email || 'no email' }})
            </option>
          </select>
          <small class="help" v-if="teachers.length === 0">
            Нет учителей. Сначала создайте на странице “Register Teacher”.
          </small>
        </div>


      </div>

      <div class="row">
        <div>
          <label>Subject</label>
          <select v-model.number="lesson.subject_id">
            <option :value="0">— select subject —</option>
            <option v-for="s in subjects" :value="s.id" :key="s.id">{{ s.name }} ({{ s.code }})</option>
          </select>
        </div>
        <div>
          <label>Group</label>
          <select v-model.number="lesson.group_id">
            <option :value="0">— select group —</option>
            <option v-for="g in groups" :value="g.id" :key="g.id">{{ g.name }}</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div><label>Starts at (YYYY-MM-DD HH:mm:ss)</label><input v-model="lesson.starts_at" /></div>
        <div><label>Ends at</label><input v-model="lesson.ends_at" /></div>
      </div>
      <div class="row">
        <div><label>Meeting URL</label><input v-model="lesson.meeting_url" placeholder="https://meet.jit.si/..." /></div>
        <div>
          <label>Provider</label>
          <select v-model="lesson.meeting_provider">
            <option value="">—</option>
            <option value="jitsi">jitsi</option>
            <option value="bbb">bbb</option>
            <option value="zoom">zoom</option>
            <option value="meet">meet</option>
            <option value="custom">custom</option>
          </select>
        </div>
      </div>
      <button @click="createLesson">Create lesson</button>
      <div v-if="msg.lesson" class="success">{{ msg.lesson }}</div>
      <div v-if="err.lesson" class="error">{{ err.lesson }}</div>

      <div style="margin-top:12px;">
        <RouterLink to="/teacher/lessons">→ Go to Teacher Lessons</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import api from '../utils/api'
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const subjects = ref<any[]>([])
const groups   = ref<any[]>([])
const students = ref<any[]>([])
const teacherId = ref<number| null>(null)
// [LEVELS] новое состояние уровней
const levels = ref<any[]>([])

// группы
const group = ref<{ name: string; level_id: number; class_letter?: string }>({
  name: '',
  level_id: 0,
  class_letter: ''
})
const saving = ref({ group: false })
const msg = ref<{group?: string}>({ })
const err = ref<{group?: string}>({ })

const subject = ref({ name: 'Math', code: 'MATH' })

const attach = ref<{group_id:number, student_ids:number[]}>({ group_id: 0, student_ids: [] })
const studentSearch = ref('')

const lesson = ref({
  subject_id: 0,
  group_id: 0,
  starts_at:  new Date(Date.now()+86400000).toISOString().slice(0,19).replace('T',' '), // +1 день
  ends_at:    new Date(Date.now()+86400000+45*60000).toISOString().slice(0,19).replace('T',' '),
  meeting_provider: 'jitsi',
  meeting_url: 'https://meet.jit.si/lesson-demo'
})


const teachers = ref<any[]>([])
const selectedTeacherId = ref<number>(0)

async function loadLevels() { // [LEVELS]
  try {
    const { data } = await api.get('/levels')
    levels.value = data
  } catch (e: any) {
    console.error('loadLevels', e)
  }
}

async function loadGroups() {
  const { data } = await api.get('/admin/groups')
  groups.value = data
}

async function createGroup() {
  msg.value.group = ''; err.value.group = ''
  try {
    if (!group.value.name) throw new Error('Введите имя группы')
    if (!group.value.level_id) throw new Error('Выберите уровень (level)')
    saving.value.group = true
    await api.post('/admin/groups', group.value)
    msg.value.group = 'Group created ✔'
    group.value = { name: '', level_id: 0, class_letter: '' }
    await loadGroups()
  } catch (e: any) {
    err.value.group = e?.data?.message || e?.message || 'Error'
  } finally {
    saving.value.group = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadLevels(),   // [LEVELS]
    loadGroups(),
    // ... остальные загрузки как у тебя были: subjects, teachers, students и т.д.
  ])
})
async function loadSubjects(){ const {data} = await api.get('/admin/subjects'); subjects.value = data }
async function loadStudents(){ const {data} = await api.get('/admin/students', { params: { search: studentSearch.value } }); students.value = data }

async function createSubject(){
  msg.value.subject=''; err.value.subject=''
  try{ await api.post('/admin/subjects', subject.value); await loadSubjects(); msg.value.subject='Subject created' }
  catch(e:any){ err.value.subject = e.data?.message || JSON.stringify(e.data) }
}

async function doAttach(){
  msg.value.attach=''; err.value.attach=''
  try{
    if(!attach.value.group_id) throw new Error('Select group')
    if(!attach.value.student_ids.length) throw new Error('Select at least one student')
    await api.post(`/admin/groups/${attach.value.group_id}/attach-students`, { student_ids: attach.value.student_ids })
    msg.value.attach='Attached'
    await loadGroups()
  }catch(e:any){ err.value.attach = e.data?.message || e.message }
}
async function createLesson(){
  msg.value.lesson=''; err.value.lesson=''
  try{
    if (!selectedTeacherId.value) throw new Error('Выберите преподавателя')
    if (!lesson.value.subject_id) throw new Error('Выберите предмет')
    if (!lesson.value.group_id) throw new Error('Выберите группу')
    if (!lesson.value.starts_at || !lesson.value.ends_at) throw new Error('Укажите время начала и окончания')

    const payload = { ...lesson.value, teacher_id: selectedTeacherId.value }
    await api.post('/admin/lessons', payload)
    msg.value.lesson='Lesson created ✔'
  }catch(e:any){
    err.value.lesson = e?.data?.message || e?.message || 'Error'
  }
}


async function loadTeachers() {
  const { data } = await api.get('/admin/teachers')
  teachers.value = data
}

onMounted(async () => {
  await Promise.all([loadSubjects(), loadGroups(), loadStudents(), loadTeachers()])
})
</script>
<style scoped>
.card { padding:12px; border:1px solid #eee; border-radius:8px; margin-bottom:12px; }
.row { display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; }
.success { color:#0a7f2e; margin-top:8px; }
.error { color:#b00020; margin-top:8px; white-space: pre-wrap; }
</style>