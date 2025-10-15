<template>
  <div class="card">
    <h3>Вход</h3>
    <label>PIN</label>
    <input v-model="pin" placeholder="12345678901234" maxlength="14" />
    <label>Пароль</label>
    <input v-model="password" type="password" placeholder="password" />
    <button @click="doLogin">Войти</button>
    <div v-if="error" class="error" style="margin-top:8px;">{{ error }}</div>
    <div style="margin-top: 16px; text-align: center;">
      <RouterLink to="/forgot-password" style="color: #007bff; text-decoration: none;">
        Забыли пароль?
      </RouterLink>
    </div>
    <div style="margin-top: 8px; text-align: center;">
      <RouterLink to="/register-student" style="color: #28a745; text-decoration: none; font-weight: 500;">
        Регистрация студента
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const pin = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()
const auth = useAuthStore()

const doLogin = async () => {
  error.value = ''
  try {
    await auth.login(pin.value, password.value)
    router.push('/teacher/lessons')
  } catch (e: any) {
    error.value = e?.data?.message || 'Login error'
  }
}
</script>
