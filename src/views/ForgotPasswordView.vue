<template>
  <div class="card">
    <h3>Восстановление пароля</h3>

    <!-- Шаг 1: Ввод PIN -->
    <div v-if="step === 1">
      <p style="color: #666; margin-bottom: 16px;">
        Введите ваш PIN для получения кода восстановления на email
      </p>
      <label>PIN</label>
      <input
        v-model="pin"
        placeholder="12345678901234"
        maxlength="14"
        @keyup.enter="sendCode"
      />
      <button @click="sendCode" :disabled="loading">
        {{ loading ? 'Отправка...' : 'Отправить код' }}
      </button>
      <div v-if="maskedEmail" style="color: #28a745; margin-top: 8px;">
        Код отправлен на {{ maskedEmail }}
      </div>
      <div v-if="error" class="error" style="margin-top: 8px;">{{ error }}</div>
      <RouterLink to="/login" style="display: block; margin-top: 16px; color: #007bff;">
        Вернуться к входу
      </RouterLink>
    </div>

    <!-- Шаг 2: Ввод кода и нового пароля -->
    <div v-if="step === 2">
      <p style="color: #666; margin-bottom: 16px;">
        Введите код из email и новый пароль
      </p>
      <label>Код из email</label>
      <input
        v-model="code"
        placeholder="123456"
        maxlength="6"
        @keyup.enter="resetPassword"
      />
      <label>Новый пароль</label>
      <input
        v-model="password"
        type="password"
        placeholder="Минимум 6 символов"
        @keyup.enter="resetPassword"
      />
      <label>Подтверждение пароля</label>
      <input
        v-model="passwordConfirmation"
        type="password"
        placeholder="Повторите пароль"
        @keyup.enter="resetPassword"
      />
      <button @click="resetPassword" :disabled="loading">
        {{ loading ? 'Сохранение...' : 'Сбросить пароль' }}
      </button>
      <button @click="goBackToStep1" style="background: #6c757d; margin-top: 8px;">
        Отправить код повторно
      </button>
      <div v-if="error" class="error" style="margin-top: 8px;">{{ error }}</div>
    </div>

    <!-- Шаг 3: Успех -->
    <div v-if="step === 3">
      <div style="color: #28a745; text-align: center; padding: 24px;">
        <h4>✓ Пароль успешно изменен!</h4>
        <p>Теперь вы можете войти с новым паролем</p>
        <RouterLink to="/login">
          <button style="margin-top: 16px;">Перейти к входу</button>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import api from '../utils/api'

const step = ref(1)
const pin = ref('')
const code = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const maskedEmail = ref('')
const error = ref('')
const loading = ref(false)

const sendCode = async () => {
  error.value = ''
  if (!pin.value || pin.value.length !== 14) {
    error.value = 'PIN должен содержать 14 символов'
    return
  }

  loading.value = true
  try {
    const { data } = await api.post('/auth/forgot-password', { pin: pin.value })
    maskedEmail.value = data.email
    step.value = 2
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Ошибка отправки кода'
  } finally {
    loading.value = false
  }
}

const resetPassword = async () => {
  error.value = ''

  if (!code.value || code.value.length !== 6) {
    error.value = 'Код должен содержать 6 цифр'
    return
  }

  if (!password.value || password.value.length < 6) {
    error.value = 'Пароль должен содержать минимум 6 символов'
    return
  }

  if (password.value !== passwordConfirmation.value) {
    error.value = 'Пароли не совпадают'
    return
  }

  loading.value = true
  try {
    await api.post('/auth/reset-password', {
      pin: pin.value,
      code: code.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
    step.value = 3
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Ошибка сброса пароля'
  } finally {
    loading.value = false
  }
}

const goBackToStep1 = () => {
  step.value = 1
  code.value = ''
  password.value = ''
  passwordConfirmation.value = ''
  error.value = ''
  maskedEmail.value = ''
}
</script>

<style scoped>
.card {
  max-width: 400px;
  margin: 40px auto;
  padding: 24px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #555;
}

h3 {
  margin-top: 0;
  margin-bottom: 16px;
  text-align: center;
}

h4 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

label {
  display: block;
  margin-top: 12px;
  margin-bottom: 4px;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

button {
  width: 100%;
  margin-top: 16px;
  padding: 10px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background: #0056b3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  color: #dc3545;
  font-size: 14px;
}

a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
