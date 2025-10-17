<template>
  <div class="registration-container">
    <div class="registration-card">
      <!-- Header -->
      <div class="registration-header">
        <h1>Регистрация ученика</h1>
        <p class="subtitle">Заполните форму для регистрации в онлайн-школе</p>
      </div>

      <!-- Индикатор шагов -->
      <div class="steps-indicator">
        <div :class="['step-item', step===1 && 'active']">
          <div class="step-circle">
            <span class="step-icon">👤</span>
          </div>
          <span class="step-label">Личные данные</span>
        </div>
        <div class="step-line"></div>
        <div :class="['step-item', step===2 && 'active']">
          <div class="step-circle">
            <span class="step-icon">📄</span>
          </div>
          <span class="step-label">Документы</span>
        </div>
      </div>

      <!-- Шаг 1 -->
      <div v-if="step===1" class="step-content">
        <div class="section">
          <h2 class="section-title">Родитель / Законный представитель</h2>

          <div class="form-group">
            <label class="form-label">Кто заполняет</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" value="parent" v-model="guardianType" class="radio-input" />
                <span>Родитель</span>
              </label>
              <label class="radio-label">
                <input type="radio" value="representative" v-model="guardianType" class="radio-input" />
                <span>Законный представитель</span>
              </label>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Фамилия <span class="required">*</span></label>
              <input
                v-model="g.last_name"
                :class="['form-input', errors['guardian.last_name'] && 'input-error']"
                placeholder="Введите фамилию"
              />
              <small class="error-message" v-if="errors['guardian.last_name']">{{ errors['guardian.last_name'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Имя <span class="required">*</span></label>
              <input
                v-model="g.first_name"
                :class="['form-input', errors['guardian.first_name'] && 'input-error']"
                placeholder="Введите имя"
              />
              <small class="error-message" v-if="errors['guardian.first_name']">{{ errors['guardian.first_name'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Отчество</label>
              <input
                v-model="g.middle_name"
                :class="['form-input', errors['guardian.middle_name'] && 'input-error']"
                placeholder="Введите отчество"
              />
              <small class="error-message" v-if="errors['guardian.middle_name']">{{ errors['guardian.middle_name'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Пол <span class="required">*</span></label>
              <select
                v-model="g.sex"
                :class="['form-input', errors['guardian.sex'] && 'input-error']"
              >
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
              <small class="error-message" v-if="errors['guardian.sex']">{{ errors['guardian.sex'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Гражданство <span class="required">*</span></label>
              <select
                v-model="g.citizenship"
                :class="['form-input', errors['guardian.citizenship'] && 'input-error']"
              >
                <option value="">Выберите страну</option>
                <option value="KG">Кыргызстан</option>
                <option value="RU">Российская Федерация</option>
                <option value="UZ">Узбекистан</option>
                <option value="TJ">Таджикистан</option>
                <option value="KZ">Казахстан</option>
                <option v-for="country in otherCountries" :key="country.code" :value="country.code">
                  {{ country.name }}
                </option>
              </select>
              <small class="error-message" v-if="errors['guardian.citizenship']">{{ errors['guardian.citizenship'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">PIN (14 цифр) <span class="required">*</span></label>
              <input
                v-model="g.pin"
                :class="['form-input', errors['guardian.pin'] && 'input-error']"
                placeholder="00000000000000"
                maxlength="14"
              />
              <small class="error-message" v-if="errors['guardian.pin']">{{ errors['guardian.pin'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Телефон <span class="required">*</span></label>
              <input
                v-model="g.phone"
                :class="['form-input', errors['guardian.phone'] && 'input-error']"
                placeholder="+996 XXX XXX XXX"
              />
              <small class="error-message" v-if="errors['guardian.phone']">{{ errors['guardian.phone'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Email <span class="required">*</span></label>
              <input
                type="email"
                v-model="g.email"
                :class="['form-input', errors['guardian.email'] && 'input-error']"
                placeholder="example@mail.com"
              />
              <small class="error-message" v-if="errors['guardian.email']">{{ errors['guardian.email'] }}</small>
            </div>

            <div class="form-group form-group-full">
              <label class="form-label">Адрес проживания <span class="required">*</span></label>
              <input
                v-model="g.address"
                :class="['form-input', errors['guardian.address'] && 'input-error']"
                placeholder="Город, улица, дом, квартира"
              />
              <small class="error-message" v-if="errors['guardian.address']">{{ errors['guardian.address'] }}</small>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Данные ученика</h2>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Фамилия <span class="required">*</span></label>
              <input
                v-model="s.last_name"
                :class="['form-input', errors['student.last_name'] && 'input-error']"
                placeholder="Введите фамилию"
              />
              <small class="error-message" v-if="errors['student.last_name']">{{ errors['student.last_name'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Имя <span class="required">*</span></label>
              <input
                v-model="s.first_name"
                :class="['form-input', errors['student.first_name'] && 'input-error']"
                placeholder="Введите имя"
              />
              <small class="error-message" v-if="errors['student.first_name']">{{ errors['student.first_name'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Отчество</label>
              <input
                v-model="s.middle_name"
                :class="['form-input', errors['student.middle_name'] && 'input-error']"
                placeholder="Введите отчество"
              />
              <small class="error-message" v-if="errors['student.middle_name']">{{ errors['student.middle_name'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">PIN ученика (14 цифр) <span class="required">*</span></label>
              <input
                v-model="s.pin"
                :class="['form-input', errors['student.pin'] && 'input-error']"
                placeholder="00000000000000"
                maxlength="14"
              />
              <small class="error-message" v-if="errors['student.pin']">{{ errors['student.pin'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Пол <span class="required">*</span></label>
              <select
                v-model="s.sex"
                :class="['form-input', errors['student.sex'] && 'input-error']"
              >
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
              <small class="error-message" v-if="errors['student.sex']">{{ errors['student.sex'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Гражданство <span class="required">*</span></label>
              <select
                v-model="s.citizenship"
                :class="['form-input', errors['student.citizenship'] && 'input-error']"
              >
                <option value="">Выберите страну</option>
                <option value="KG">Кыргызстан</option>
                <option value="RU">Российская Федерация</option>
                <option value="UZ">Узбекистан</option>
                <option value="TJ">Таджикистан</option>
                <option value="KZ">Казахстан</option>
                <option v-for="country in otherCountries" :key="country.code" :value="country.code">
                  {{ country.name }}
                </option>
              </select>
              <small class="error-message" v-if="errors['student.citizenship']">{{ errors['student.citizenship'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Дата рождения <span class="required">*</span></label>
              <input
                type="date"
                v-model="s.birth_date"
                :class="['form-input', errors['student.birth_date'] && 'input-error']"
                :max="maxBirthDate"
              />
              <small class="error-message" v-if="errors['student.birth_date']">{{ errors['student.birth_date'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Уровень (класс) <span class="required">*</span></label>
              <select
                v-model.number="level_id"
                :class="['form-input', errors['student.level_id'] && 'input-error']"
              >
                <option :value="0">Выберите уровень</option>
                <option v-for="lv in levels" :key="lv.id" :value="lv.id">
                  {{ lv.title || (lv.number + ' класс') }}
                </option>
              </select>
              <small class="error-message" v-if="errors['student.level_id']">{{ errors['student.level_id'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Телефон</label>
              <input
                v-model="s.phone"
                :class="['form-input', errors['student.phone'] && 'input-error']"
                placeholder="+996 XXX XXX XXX"
              />
              <small class="error-message" v-if="errors['student.phone']">{{ errors['student.phone'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Email <span class="required">*</span></label>
              <input
                type="email"
                v-model="s.email"
                :class="['form-input', errors['student.email'] && 'input-error']"
                placeholder="example@mail.com"
              />
              <small class="error-message" v-if="errors['student.email']">{{ errors['student.email'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Пароль <span class="required">*</span></label>
              <div class="password-input-wrapper">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  v-model="s.password"
                  :class="['form-input', errors['student.password'] && 'input-error']"
                  placeholder="Минимум 8 символов"
                />
                <button type="button" @click="showPassword = !showPassword" class="password-toggle">
                  {{ showPassword ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
              <small class="error-message" v-if="errors['student.password']">{{ errors['student.password'] }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Подтверждение пароля <span class="required">*</span></label>
              <div class="password-input-wrapper">
                <input
                  :type="showPasswordConfirm ? 'text' : 'password'"
                  v-model="s.password_confirmation"
                  :class="['form-input', errors['student.password_confirmation'] && 'input-error']"
                  placeholder="Повторите пароль"
                />
                <button type="button" @click="showPasswordConfirm = !showPasswordConfirm" class="password-toggle">
                  {{ showPasswordConfirm ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
              <small class="error-message" v-if="errors['student.password_confirmation']">{{ errors['student.password_confirmation'] }}</small>
            </div>

            <div class="form-group form-group-full">
              <label class="form-label">Фото студента (необязательно)</label>
              <div class="file-upload-wrapper">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  @change="handlePhotoChange"
                  :class="['form-input file-input', errors['student_photo'] && 'input-error']"
                  id="photo-upload"
                />
                <label for="photo-upload" class="file-label">
                  <span v-if="!studentPhotoPreview">📷 Выбрать фото</span>
                  <span v-else>✓ Фото выбрано</span>
                </label>
              </div>
              <small class="error-message" v-if="errors['student_photo']">{{ errors['student_photo'] }}</small>
              <div v-if="studentPhotoPreview" class="photo-preview">
                <img :src="studentPhotoPreview" alt="Preview" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="error1" class="alert alert-error">{{ error1 }}</div>

        <div class="form-actions">
          <button @click="goStep2" class="btn btn-primary btn-large">
            Далее: Документы
            <span class="btn-icon">→</span>
          </button>
        </div>
      </div>

      <!-- Шаг 2 -->
      <div v-else class="step-content">
        <div class="section">
          <h2 class="section-title">Загрузка документов</h2>
          <p class="section-description">Загрузите необходимые документы в формате JPEG, JPG или PDF</p>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Заявление родителя/представителя</label>
              <div class="file-upload-box">
                <input
                  type="file"
                  @change="pick('guardian_application',$event)"
                  accept=".jpg,.jpeg,.pdf"
                  :id="'file-guardian-app'"
                  class="file-input-hidden"
                />
                <label :for="'file-guardian-app'" class="file-upload-label">
                  <span class="file-icon">📄</span>
                  <span class="file-text">{{ files.guardian_application ? files.guardian_application.name : 'Выбрать файл' }}</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Копия паспорта родителя</label>
              <div class="file-upload-box">
                <input
                  type="file"
                  @change="pick('guardian_passport',$event)"
                  accept=".jpg,.jpeg,.pdf"
                  :id="'file-guardian-pass'"
                  class="file-input-hidden"
                />
                <label :for="'file-guardian-pass'" class="file-upload-label">
                  <span class="file-icon">📄</span>
                  <span class="file-text">{{ files.guardian_passport ? files.guardian_passport.name : 'Выбрать файл' }}</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Свидетельство о рождении</label>
              <div class="file-upload-box">
                <input
                  type="file"
                  @change="pick('birth_certificate',$event)"
                  accept=".jpg,.jpeg,.pdf"
                  :id="'file-birth-cert'"
                  class="file-input-hidden"
                />
                <label :for="'file-birth-cert'" class="file-upload-label">
                  <span class="file-icon">📄</span>
                  <span class="file-text">{{ files.birth_certificate ? files.birth_certificate.name : 'Выбрать файл' }}</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Документ с PIN-кодом студента</label>
              <div class="file-upload-box">
                <input
                  type="file"
                  @change="pick('student_pin_doc',$event)"
                  accept=".jpg,.jpeg,.pdf"
                  :id="'file-pin-doc'"
                  class="file-input-hidden"
                />
                <label :for="'file-pin-doc'" class="file-upload-label">
                  <span class="file-icon">📄</span>
                  <span class="file-text">{{ files.student_pin_doc ? files.student_pin_doc.name : 'Выбрать файл' }}</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Медицинская справка</label>
              <div class="file-upload-box">
                <input
                  type="file"
                  @change="pick('medical_certificate',$event)"
                  accept=".jpg,.jpeg,.pdf"
                  :id="'file-medical'"
                  class="file-input-hidden"
                />
                <label :for="'file-medical'" class="file-upload-label">
                  <span class="file-icon">📄</span>
                  <span class="file-text">{{ files.medical_certificate ? files.medical_certificate.name : 'Выбрать файл' }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div v-if="error2" class="alert alert-error">{{ error2 }}</div>
        <div v-if="ok" class="alert alert-success">
          <strong>✓ Регистрация завершена успешно!</strong>
          <p>Данные ученика сохранены. Вы можете войти в систему используя PIN и пароль.</p>
        </div>

        <div class="form-actions" v-if="!ok">
          <button @click="step=1" class="btn btn-secondary">
            <span class="btn-icon">←</span>
            Назад
          </button>
          <button @click="submitAll" :disabled="saving" class="btn btn-primary btn-large">
            {{ saving ? 'Отправка...' : 'Завершить регистрацию' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import api from '../utils/api'
import { ref, onMounted, computed } from 'vue'

const step = ref<1|2>(1)
const error1 = ref(''); const error2 = ref('')
const saving = ref(false); const ok = ref(false)
const showPassword = ref(false)
const showPasswordConfirm = ref(false)

// Max birth date (today)
const maxBirthDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// Countries list
const otherCountries = [
  { code: 'AF', name: 'Афганистан' },
  { code: 'AM', name: 'Армения' },
  { code: 'AZ', name: 'Азербайджан' },
  { code: 'BY', name: 'Беларусь' },
  { code: 'CN', name: 'Китай' },
  { code: 'GE', name: 'Грузия' },
  { code: 'IN', name: 'Индия' },
  { code: 'IR', name: 'Иран' },
  { code: 'MD', name: 'Молдова' },
  { code: 'MN', name: 'Монголия' },
  { code: 'PK', name: 'Пакистан' },
  { code: 'TR', name: 'Турция' },
  { code: 'TM', name: 'Туркменистан' },
  { code: 'UA', name: 'Украина' },
  { code: 'US', name: 'США' },
  { code: 'DE', name: 'Германия' },
  { code: 'FR', name: 'Франция' },
  { code: 'GB', name: 'Великобритания' },
]

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
  if (!s.value.email || !s.value.email.includes('@')) setFieldError('student.email','Некорректный email')
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

    await api.post('/auth/register-student', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    ok.value = true
  } catch (e:any) {
    if (e?.status === 422 && e?.data?.errors) {
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
.registration-container {
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 32px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.registration-card {
  max-width: 900px;
  width: 100%;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  overflow: hidden;
}

.registration-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px 24px;
  text-align: center;
}

.registration-header h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
}

.subtitle {
  margin: 0;
  opacity: 0.95;
  font-size: 16px;
}

/* Steps Indicator */
.steps-indicator {
  display: flex;
  align-items: center;
  padding: 24px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.step-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.step-item.active .step-circle {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.step-icon {
  font-size: 28px;
}

.step-label {
  font-size: 14px;
  font-weight: 500;
  color: #6c757d;
  text-align: center;
}

.step-item.active .step-label {
  color: #667eea;
  font-weight: 600;
}

.step-line {
  flex: 1;
  height: 2px;
  background: #dee2e6;
  margin: 0 16px;
  max-width: 100px;
}

/* Step Content */
.step-content {
  padding: 32px 24px;
}

/* Section */
.section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  color: #212121;
  margin-bottom: 8px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.section-description {
  color: #6c757d;
  margin-bottom: 20px;
  font-size: 14px;
}

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group-full {
  grid-column: 1 / -1;
}

.form-label {
  font-weight: 600;
  font-size: 14px;
  color: #424242;
  margin-bottom: 6px;
}

.required {
  color: #dc3545;
}

.form-input {
  padding: 12px 16px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.2s;
  font-family: inherit;
  background: #f8f9fa;
  color: #212121;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: #fff;
}

.form-input.input-error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 13px;
  margin-top: 4px;
}

/* Radio Group */
.radio-group {
  display: flex;
  gap: 20px;
  margin-top: 8px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.radio-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Password Toggle */
.password-input-wrapper {
  position: relative;
}

.password-input-wrapper .form-input {
  padding-right: 50px;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 20px;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border-radius: 4px;
}

.password-toggle:hover {
  background: #e9ecef;
}

/* File Upload */
.file-upload-wrapper {
  position: relative;
}

.file-input {
  opacity: 0;
  position: absolute;
  z-index: -1;
}

.file-label {
  display: inline-block;
  padding: 12px 24px;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  width: 100%;
}

.file-label:hover {
  background: #e9ecef;
  border-color: #667eea;
}

.photo-preview {
  margin-top: 12px;
}

.photo-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* File Upload Box (Step 2) */
.file-upload-box {
  position: relative;
}

.file-input-hidden {
  display: none;
}

.file-upload-label {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.file-upload-label:hover {
  background: #e9ecef;
  border-color: #667eea;
}

.file-icon {
  font-size: 24px;
}

.file-text {
  flex: 1;
  color: #6c757d;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Alerts */
.alert {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.alert-error {
  background: #ffebee;
  color: #c62828;
  border-left: 4px solid #c62828;
}

.alert-success {
  background: #e8f5e9;
  color: #2e7d32;
  border-left: 4px solid #2e7d32;
}

.alert-success strong {
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
}

.alert-success p {
  margin: 0;
  font-size: 14px;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e9ecef;
  color: #495057;
}

.btn-secondary:hover {
  background: #dee2e6;
}

.btn-large {
  padding: 14px 32px;
  font-size: 16px;
}

.btn-icon {
  font-size: 18px;
}

/* Responsive */
@media (max-width: 768px) {
  .registration-container {
    padding: 16px;
  }

  .registration-header {
    padding: 24px 16px;
  }

  .registration-header h1 {
    font-size: 24px;
  }

  .subtitle {
    font-size: 14px;
  }

  .steps-indicator {
    padding: 16px;
  }

  .step-circle {
    width: 48px;
    height: 48px;
  }

  .step-icon {
    font-size: 24px;
  }

  .step-label {
    font-size: 12px;
  }

  .step-line {
    margin: 0 8px;
    max-width: 40px;
  }

  .step-content {
    padding: 20px 16px;
  }

  .section-title {
    font-size: 18px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .step-label {
    display: none;
  }
}
</style>
