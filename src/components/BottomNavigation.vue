<template>
  <nav class="bottom-nav" v-if="isAuth && isMobile">
    <RouterLink
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="bottom-nav-item"
    >
      <span class="bottom-nav-icon">{{ item.icon }}</span>
      <span class="bottom-nav-label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const isMobile = ref(false)

const isAuth = computed(() => !!auth.token)
const userRole = computed(() => auth.user?.role || '')

// Check if mobile on mount and window resize
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// Bottom navigation items by role (max 4-5 items for good UX)
const navItems = computed(() => {
  const role = userRole.value

  if (role === 'student') {
    return [
      { path: '/student/courses', icon: '📚', label: 'Курсы' },
      { path: '/student/journal', icon: '📖', label: 'Журнал' },
      { path: '/student/grades', icon: '📊', label: 'Оценки' },
    ]
  }

  if (role === 'teacher') {
    return [
      { path: '/teacher/courses', icon: '📚', label: 'Курсы' },
      { path: '/teacher/submissions', icon: '✏️', label: 'Работы' },
      { path: '/teacher/journal', icon: '📖', label: 'Журнал' },
    ]
  }

  if (role === 'admin') {
    return [
      { path: '/admin/groups', icon: '🏫', label: 'Группы' },
      { path: '/admin/teachers', icon: '👨‍🏫', label: 'Учителя' },
      { path: '/admin/subjects', icon: '📚', label: 'Предметы' },
      { path: '/admin/journal', icon: '📖', label: 'Журнал' },
    ]
  }

  return []
})
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #ffffff;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 999;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-decoration: none;
  color: #757575;
  padding: 8px 4px;
  transition: all 0.2s;
  position: relative;
}

.bottom-nav-item:active {
  background: rgba(0,0,0,0.05);
}

.bottom-nav-item.router-link-active {
  color: #2196f3;
}

.bottom-nav-item.router-link-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 3px;
  background: #2196f3;
  border-radius: 0 0 3px 3px;
}

.bottom-nav-icon {
  font-size: 24px;
  line-height: 1;
}

.bottom-nav-label {
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}

/* Add padding to body to prevent content from being hidden behind bottom nav */
@media (max-width: 768px) {
  :global(body) {
    padding-bottom: 64px;
  }
}
</style>
