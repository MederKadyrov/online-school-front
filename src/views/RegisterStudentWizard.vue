<template>
  <div class="card">
    <!-- Индикатор шагов -->
    <div class="steps">
      <div :class="['step', step===1 && 'active']">
        <span class="icon">👤</span>
        <span>Личные данные</span>
      </div>
      <div class="line"></div>
      <div :class="['step', step===2 && 'active']">
        <span class="icon">📄</span>
        <span>Документы</span>
      </div>
    </div>

    <!-- Шаг 1 -->
    <div v-if="step===1">
      <h3>Шаг 1 — Личные данные</h3>

      <h4>Родитель / Законный представитель</h4>
      <div class="row-two">
        <div>
          <label>Кто заполняет</label>
          <div class="radio-row">
            <label>
              <input type="radio" value="parent" v-model="guardianType" />
              Родитель</label>
            <label><input type="radio" value="representative" v-model="guardianType" />
              Законный представитель</label>
          </div>

          <label>Фамилия</label>
          <input
              v-model="g.last_name"
              :class="['input', errors['guardian.last_name'] && 'error']"
          />
          <small class="error" v-if="errors['guardian.last_name']">{{ errors['guardian.last_name'] }}</small>

          <label>Имя</label>
          <input
              v-model="g.first_name"
              :class="['input', errors['guardian.first_name'] && 'error']"
          />
          <small class="error" v-if="errors['guardian.first_name']">{{ errors['guardian.first_name'] }}</small>

          <label>Отчество</label>
          <input
              v-model="g.middle_name"
              :class="['input', errors['guardian.middle_name'] && 'error']"
          />
          <small class="error" v-if="errors['guardian.middle_name']">{{ errors['guardian.middle_name'] }}</small>

          <label>Пол</label>
          <select
              v-model="g.sex"
              :class="['input', errors['guardian.sex'] && 'error']"
          >
            <option value="male">мужской</option>
            <option value="female">женский</option>
          </select>
          <small class="error" v-if="errors['guardian.sex']">{{ errors['guardian.sex'] }}</small>

          <label>Гражданство</label>
          <input
              v-model="g.citizenship"
              :class="['input', errors['guardian.citizenship'] && 'error']"
          />
          <small class="error" v-if="errors['guardian.citizenship']">{{ errors['guardian.citizenship'] }}</small>
        </div>
        <div>
          <label>PIN (14 цифр)</label>
          <input
              v-model="g.pin"
              :class="['input', errors['guardian.pin'] && 'error']"
          />
          <small class="error" v-if="errors['guardian.pin']">{{ errors['guardian.pin'] }}</small>

          <label>Телефон</label>
          <input
              v-model="g.phone"
              :class="['input', errors['guardian.phone'] && 'error']"
          />
          <small class="error" v-if="errors['guardian.phone']">{{ errors['guardian.phone'] }}</small>

          <label>Адрес проживания</label>
          <input
              v-model="g.address"
              :class="['input', errors['guardian.address'] && 'error']"
          />
          <small class="error" v-if="errors['guardian.address']">{{ errors['guardian.address'] }}</small>

          <label>Email</label>
          <input
              v-model="g.email"
              :class="['input', errors['guardian.email'] && 'error']"
          />
          <small class="error" v-if="errors['guardian.email']">{{ errors['guardian.email'] }}</small>
        </div>
      </div>

      <h4>Данные ученика</h4>
      <div class="row-two">
        <div>
          <label>Фамилия</label>
          <input
              v-model="s.last_name"
              :class="['input', errors['student.last_name'] && 'error']"
          />
          <small class="error" v-if="errors['student.last_name']">{{ errors['student.last_name'] }}</small>

          <label>Имя</label>
          <input
              v-model="s.first_name"
              :class="['input', errors['student.first_name'] && 'error']"
          />
          <small class="error" v-if="errors['student.first_name']">{{ errors['student.first_name'] }}</small>

          <label>Отчество</label>
          <input
              v-model="s.middle_name"
              :class="['input', errors['student.middle_name'] && 'error']"
          />
          <small class="error" v-if="errors['student.middle_name']">{{ errors['student.middle_name'] }}</small>

          <label>PIN ученика (14 цифр)</label>
          <input
              v-model="s.pin"
              :class="['input', errors['student.pin'] && 'error']"
          />
          <small class="error" v-if="errors['student.pin']">{{ errors['student.pin'] }}</small>

          <label>Пол</label>
          <select
              v-model="s.sex"
              :class="['input', errors['student.sex'] && 'error']"
          >
            <option value="male">мужской</option>
            <option value="female">женский</option>
          </select>
          <small class="error" v-if="errors['student.sex']">{{ errors['student.sex'] }}</small>

          <label>Гражданство</label>
          <input
              v-model="s.citizenship"
              :class="['input', errors['student.citizenship'] && 'error']"
          />
          <small class="error" v-if="errors['student.citizenship']">{{ errors['student.citizenship'] }}</small>

          <label>Дата рождения</label>
          <input
              v-model="s.birth_date"
              placeholder="YYYY-MM-DD"
              :class="['input', errors['student.birth_date'] && 'error']"
          />
          <small class="error" v-if="errors['student.birth_date']">{{ errors['student.birth_date'] }}</small>
        </div>
        <div>

          <label>Уровень (класс)</label>
          <select
              v-model.number="level_id"
              :class="['input', errors['student.level_id'] && 'error']"
          >
            <option :value="0">— выберите уровень —</option>
            <option v-for="lv in levels" :key="lv.id" :value="lv.id">
              {{ lv.title || (lv.number + ' класс') }}
            </option>
          </select>
          <small class="error" v-if="errors['student.level_id']">{{ errors['student.level_id'] }}</small>

          <label>Фото студента (необязательно)</label>
          <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              @change="handlePhotoChange"
              :class="['input', errors['student_photo'] && 'error']"
          />
          <small class="error" v-if="errors['student_photo']">{{ errors['student_photo'] }}</small>
          <div v-if="studentPhotoPreview" style="margin-top: 8px;">
            <img :src="studentPhotoPreview" alt="Preview" style="max-width: 150px; max-height: 150px; border-radius: 8px;" />
          </div>

          <label>Телефон</label>
          <input
              v-model="s.phone"
              :class="['input', errors['student.phone'] && 'error']"
          />
          <small class="error" v-if="errors['student.phone']">{{ errors['student.phone'] }}</small>

          <label>Пароль</label>
          <input
              type="password"
              v-model="s.password"
              :class="['input', errors['student.password'] && 'error']"
          />
          <small class="error" v-if="errors['student.password']">{{ errors['student.password'] }}</small>

          <label>Подтверждение пароля</label>
          <input
              type="password"
              v-model="s.password_confirmation"
              :class="['input', errors['student.password_confirmation'] && 'error']"
          />
          <small class="error" v-if="errors['student.password_confirmation']">{{ errors['student.password_confirmation'] }}</small>

          <label>Email (опционально)</label>
          <input
              v-model="s.email"
              :class="['input', errors['student.email'] && 'error']"
          />
          <small class="error" v-if="errors['student.email']">{{ errors['student.email'] }}</small>
        </div>
      </div>

      <div class="actions">
        <button @click="goStep2">Далее → Документы</button>
      </div>
      <div v-if="error1" class="error">{{ error1 }}</div>
    </div>

    <!-- Шаг 2 -->
    <div v-else>
      <h3>Шаг 2 — Загрузка документов (JPEG/JPG/PDF)</h3>

      <div class="row-two">
        <div>
          <label>Заявление родителя/законного представителя</label>
          <input type="file" @change="pick('guardian_application',$event)" accept=".jpg,.jpeg,.pdf" />
          <label>Копия свидетельства о рождении</label>
          <input type="file" @change="pick('birth_certificate',$event)" accept=".jpg,.jpeg,.pdf" />
          <label>Документ с PIN-кодом студента</label>
          <input type="file" @change="pick('student_pin_doc',$event)" accept=".jpg,.jpeg,.pdf" />
        </div>
        <div>
          <label>Копия паспорта родителя/представителя</label>
          <input type="file" @change="pick('guardian_passport',$event)" accept=".jpg,.jpeg,.pdf" />
          <label>Медицинская справка</label>
          <input type="file" @change="pick('medical_certificate',$event)" accept=".jpg,.jpeg,.pdf" />
        </div>
      </div>

      <div class="actions">
        <button @click="step=1" class="secondary">← Назад</button>
        <button @click="submitAll" :disabled="saving">{{ saving ? 'Сохранение...' : 'Отправить' }}</button>
      </div>

      <div v-if="error2" class="error">{{ error2 }}</div>
      <div v-if="ok" class="success">Регистрация завершена ✔</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import api from '../utils/api'
import { ref, onMounted } from 'vue'

const step = ref<1|2>(1)
const error1 = ref(''); const error2 = ref('')
const saving = ref(false); const ok = ref(false)
const student_id = ref<number | null>(null)

// уровни
const levels = ref<any[]>([])
const level_id = ref<number>(0)
async function loadLevels() {
  try {
    const { data } = await api.get('/levels')
    levels.value = data
  } catch (e) { console.error(e) }
}

// Индикатор типа законного представителя
const guardianType = ref<'parent'|'representative'>('parent')

// Родитель/представитель
const g = ref({
  last_name: '', first_name: '', middle_name: '',
  sex: 'female', citizenship: 'KG', pin: '', phone: '',
  address: '', email: '',
})

// Ученик
const s = ref({
  last_name: '', first_name: '', middle_name: '',
  sex: 'male', citizenship: 'KG', birth_date: '',
  pin: '',
  phone: '', email: '',
  password: '', password_confirmation: '',
  class_letter: ''
})

// Фото студента
const studentPhotoFile = ref<File | null>(null)
const studentPhotoPreview = ref<string>('')

// Файлы
const files = ref<Record<string, File | null>>({
  guardian_application: null,
  birth_certificate: null,
  student_pin_doc: null,
  guardian_passport: null,
  medical_certificate: null,
})

const errors = ref<Record<string,string>>({})
function setFieldError(field: string, msg: string) { errors.value[field] = msg }
function clearErrors() { errors.value = {} }

function pick(key: string, e: Event) {
  const input = e.target as HTMLInputElement
  files.value[key] = (input.files && input.files[0]) || null
}

function handlePhotoChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] || null
  studentPhotoFile.value = file

  if (file) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      studentPhotoPreview.value = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  } else {
    studentPhotoPreview.value = ''
  }
}

function validateClient(): boolean {
  clearErrors()
  // guardian
  if (!g.value.last_name) setFieldError('guardian.last_name','Обязательное поле')
  if (!g.value.first_name) setFieldError('guardian.first_name','Обязательное поле')
  if (!['male','female'].includes(g.value.sex)) setFieldError('guardian.sex','Выберите пол')
  if (!g.value.citizenship) setFieldError('guardian.citizenship','Обязательное поле')
  if (!/^\d{14}$/.test(g.value.pin)) setFieldError('guardian.pin','PIN: 14 цифр')
  if (!g.value.phone) setFieldError('guardian.phone','Обязательное поле')
  if (!g.value.address) setFieldError('guardian.address','Обязательное поле')
  if (!g.value.email || !g.value.email.includes('@')) setFieldError('guardian.email','Некорректный email')

  // student
  if (!s.value.last_name) setFieldError('student.last_name','Обязательное поле')
  if (!s.value.first_name) setFieldError('student.first_name','Обязательное поле')
  if (!s.value.pin || !/^\d{14}$/.test(s.value.pin)) {
    setFieldError('student.pin','PIN ученика: ровно 14 цифр')
  }
  if (!['male','female'].includes(s.value.sex)) setFieldError('student.sex','Выберите пол')
  if (!s.value.citizenship) setFieldError('student.citizenship','Обязательное поле')
  if (!s.value.birth_date) setFieldError('student.birth_date','Обязательное поле')
  if (!level_id.value) setFieldError('student.level_id','Выберите уровень (класс)')
  if (!s.value.password) setFieldError('student.password','Введите пароль')
  if (s.value.password !== s.value.password_confirmation) setFieldError('student.password_confirmation','Пароли не совпадают')

  return Object.keys(errors.value).length === 0
}


// Валидация и переход на шаг 2
async function goStep2() {
  error1.value = ''
  try {
    if (!validateClient()) {
      throw new Error('Исправьте ошибки в форме')
    }
    // префлайт: серверная проверка 422/200 (204)
    const payload = {
      guardian_type: guardianType.value,
      guardian: g.value,
      student: { ...s.value, level_id: level_id.value }
    }
    await api.post('/auth/register-student-validate', payload) // 204 No Content

    step.value = 2 // только если сервер одобрил
  } catch (e:any) {
    // распарсим 422 от Laravel
    if (e?.status === 422 && e?.data?.errors) {
      for (const [field, msgs] of Object.entries(e.data.errors)) {
        setFieldError(String(field), (msgs as string[]).join(', '))
      }
      error1.value = 'Проверьте заполнение полей'
    } else {
      error1.value = e?.data?.message || e?.message || 'Ошибка валидации'
    }
  }
}


// Отправка данных и файлов
async function submitAll() {
  error2.value = ''; ok.value = false; saving.value = true
  try {
    // Собираем FormData: и данные шага 1, и файлы
    const fd = new FormData()

    // guardian[...]
    Object.entries(g.value).forEach(([k,v]) => {
      if (v !== undefined && v !== null) fd.append(`guardian[${k}]`, String(v))
    })
    fd.append('guardian_type', guardianType.value)

    // student[...]
    const studentPayload = { ...s.value, level_id: level_id.value }
    Object.entries(studentPayload).forEach(([k,v]) => {
      if (v !== undefined && v !== null) fd.append(`student[${k}]`, String(v))
    })

    // файлы
    for (const [k,v] of Object.entries(files.value)) {
      if (v) fd.append(k, v as Blob)
    }

    // фото студента
    if (studentPhotoFile.value) {
      fd.append('student_photo', studentPhotoFile.value)
    }

    const { data } = await api.post('/auth/register-student', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    ok.value = true
    // при желании сохраним data.student_id
    // student_id.value = data.student_id
  } catch (e:any) {
    if (e?.status === 422 && e?.data?.errors) {
      // если внезапно упали на уникальностях/файлах — вернёмся на шаг 1 или покажем над формой
      const messages = []
      for (const [field, msgs] of Object.entries(e.data.errors)) {
        messages.push(`${field}: ${(msgs as string[]).join(', ')}`)
      }
      error2.value = messages.join('\n')
    } else {
      error2.value = e?.data?.message || e?.message || 'Ошибка при отправке'
    }
  } finally {
    saving.value = false
  }
}



onMounted(loadLevels)
</script>

<style scoped>
.card { padding:12px; border:1px solid #eee; border-radius:8px; }
.steps { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
.step { display:flex; align-items:center; gap:6px; padding:8px 12px; border-radius:999px; background:#f1f1f1; color:#555; }
.step.active { background:#dceeff; color:#0a4ea6; font-weight:600; }
.line { flex:1; height:2px; background:#eee; }
.radio-row { display:flex; gap:16px; margin:6px 0 10px; }
.row-two { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.actions { margin-top: 12px; display:flex; gap:8px; }
.secondary { background:#eee; }
.help { color:#666; }
.error { color:#b00020; white-space: pre-wrap; margin-top:8px; }
.success { color:#0a7f2e; margin-top:8px; }
</style>
