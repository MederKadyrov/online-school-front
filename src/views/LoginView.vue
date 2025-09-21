<template>
  <div class="card">
    <h3>Login</h3>
    <label>Email</label>
    <input v-model="email" placeholder="admin@example.com" />
    <label>Password</label>
    <input v-model="password" type="password" placeholder="password" />
    <button @click="doLogin">Login</button>
    <div v-if="error" class="error" style="margin-top:8px;">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('admin@example.com')
const password = ref('password')
const error = ref('')
const router = useRouter()
const auth = useAuthStore()

const doLogin = async () => {
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    router.push('/teacher/lessons')
  } catch (e: any) {
    error.value = e?.data?.message || 'Login error'
  }
}
</script>
