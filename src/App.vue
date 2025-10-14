<template>
  <div class="container">
    <nav style="display:flex; gap:12px; margin-bottom:16px;">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/login">Login</RouterLink>
      <RouterLink to="/register-student">Register Student</RouterLink>
      <RouterLink to="/teacher/lessons">Teacher Lessons</RouterLink>
      <RouterLink to="/admin/setup">Admin Setup</RouterLink>
      <RouterLink to="/admin/register-teacher">Register Teacher</RouterLink>
      <RouterLink to="/student/courses">My Courses</RouterLink>
      <RouterLink to="/student/grades">My Grades</RouterLink>
      <RouterLink to="/admin/teachers">Teachers</RouterLink>
      <RouterLink to="/admin/groups">Groups</RouterLink>
      <RouterLink to="/admin/subjects">Subjects</RouterLink>





      <button v-if="isAuth" @click="logout" style="margin-left:auto;">Logout</button>
    </nav>

    <nav style="display:flex; gap:12px; margin-bottom:16px;">
      <RouterLink to="/teacher/courses">Teacher courses</RouterLink>
      <RouterLink to="/teacher/submissions">Student Works</RouterLink>
      <RouterLink to="/teacher/journal">Teacher Journal</RouterLink>
      <RouterLink to="/student/courses">Student courses</RouterLink>
      <RouterLink to="/student/journal">Student Journal</RouterLink>
      <RouterLink to="/admin/submissions">Student Works</RouterLink>
      <RouterLink to="/admin/journal">Admin Journal</RouterLink>
      <RouterLink to="/admin/user-passwords">User Passwords</RouterLink>






      <button v-if="isAuth" @click="logout" style="margin-left:auto;">Logout</button>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const isAuth = computed(() => !!auth.token)
const logout = () => auth.logout()
</script>

<style>
.container { max-width: 960px; margin: 24px auto; font-family: system-ui, sans-serif; }
input, select, textarea { padding: 8px; margin: 4px 0; width: 100%; }
label { font-weight: 600; margin-top: 8px; display:block; }
button { padding: 8px 12px; cursor: pointer; }
.card { border: 1px solid #ddd; border-radius: 10px; padding: 12px; margin: 12px 0; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.error { color: #b00020; white-space: pre-wrap; }
.success { color: #0a7f2e; }
small.help { color: #666; }
</style>
