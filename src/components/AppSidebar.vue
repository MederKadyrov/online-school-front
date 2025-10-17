<template>
  <aside class="app-sidebar" :class="{ collapsed: isCollapsed, 'mobile-open': mobileOpen }">
    <div class="sidebar-content">
      <!-- Sidebar Header -->
      <div class="sidebar-header">
        <div class="sidebar-logo" v-if="!isCollapsed">
          <span class="logo-icon">🎓</span>
          <span class="logo-text">Школа</span>
        </div>
        <div class="sidebar-logo-mini" v-else>
          <span class="logo-icon">🎓</span>
        </div>
      </div>

      <!-- User Info -->
      <div class="sidebar-user" v-if="!isCollapsed">
        <div class="user-avatar">{{ userInitial }}</div>
        <div class="user-info">
          <div class="user-name">{{ userName }}</div>
          <div class="user-role">{{ userRoleLabel }}</div>
        </div>
      </div>
      <div class="sidebar-user-mini" v-else>
        <div class="user-avatar-mini">{{ userInitial }}</div>
      </div>

      <!-- Navigation Menu -->
      <nav class="sidebar-nav">
        <div class="nav-section" v-if="!isCollapsed">
          <div class="nav-section-title">Навигация</div>
        </div>

        <RouterLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :title="item.label"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label" v-if="!isCollapsed">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <button @click="toggleCollapse" class="btn-collapse" :title="isCollapsed ? 'Развернуть' : 'Свернуть'">
          <span v-if="isCollapsed">→</span>
          <span v-else>←</span>
        </button>
      </div>
    </div>

    <!-- Overlay for mobile -->
    <div class="sidebar-overlay" @click="closeMobileSidebar" v-if="mobileOpen"></div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

defineProps<{
  mobileOpen?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toggle-collapse'): void
}>()

const auth = useAuthStore()
const isCollapsed = ref(false)

const userName = computed(() => auth.user?.name || 'Пользователь')
const userInitial = computed(() => auth.user?.username?.charAt(0).toUpperCase() || 'U')
const userRole = computed(() => auth.user?.role || '')

const userRoleLabel = computed(() => {
  const role = userRole.value
  if (role === 'admin') return 'Администратор'
  if (role === 'teacher') return 'Учитель'
  if (role === 'student') return 'Ученик'
  return 'Пользователь'
})

// Menu items by role
const menuItems = computed(() => {
  const role = userRole.value

  if (role === 'admin') {
    return [
      { path: '/admin/groups', icon: '🏫', label: 'Группы' },
      { path: '/admin/teachers', icon: '👨‍🏫', label: 'Учителя' },
      { path: '/admin/subjects', icon: '📚', label: 'Предметы' },
      { path: '/admin/submissions', icon: '✏️', label: 'Проверка работ' },
      { path: '/admin/journal', icon: '📖', label: 'Журнал' },
      { path: '/admin/user-passwords', icon: '🔑', label: 'Пароли' },
    ]
  }

  if (role === 'teacher') {
    return [
      { path: '/teacher/courses', icon: '📚', label: 'Курсы' },
      { path: '/teacher/submissions', icon: '✏️', label: 'Проверка работ' },
      { path: '/teacher/journal', icon: '📖', label: 'Журнал' },
    ]
  }

  if (role === 'student') {
    return [
      { path: '/student/courses', icon: '📚', label: 'Мои курсы' },
      { path: '/student/journal', icon: '📖', label: 'Журнал' },
      { path: '/student/grades', icon: '📊', label: 'Успеваемость' },
    ]
  }

  return []
})

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('toggle-collapse')
}

const closeMobileSidebar = () => {
  emit('close')
}
</script>

<style scoped>
.app-sidebar {
  position: fixed;
  left: 0;
  top: 64px; /* Height of top navigation */
  bottom: 0;
  width: 260px;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  transition: all 0.3s ease;
  z-index: 900;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0,0,0,0.08);
}

.app-sidebar.collapsed {
  width: 70px;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Header */
.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid #dee2e6;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  font-size: 20px;
  color: #212121;
}

.sidebar-logo-mini {
  display: flex;
  justify-content: center;
  font-size: 24px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  white-space: nowrap;
}

/* User Info */
.sidebar-user {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #dee2e6;
  background: #ffffff;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  color: #212121;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: #757575;
}

.sidebar-user-mini {
  padding: 16px;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid #dee2e6;
  background: #ffffff;
}

.user-avatar-mini {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.nav-section {
  padding: 16px 16px 8px 16px;
}

.nav-section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #757575;
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #424242;
  text-decoration: none;
  transition: all 0.2s;
  position: relative;
  margin: 2px 8px;
  border-radius: 8px;
  font-weight: 500;
}

.nav-item:hover {
  background: #f5f5f5;
  color: #212121;
}

.nav-item.router-link-active {
  background: linear-gradient(90deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%);
  color: #2196f3;
  font-weight: 600;
}

.nav-item.router-link-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: #2196f3;
  border-radius: 0 4px 4px 0;
}

.collapsed .nav-item {
  justify-content: center;
  padding: 12px 8px;
}

.nav-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
}

.nav-badge {
  background: #f44336;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

/* Footer */
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #dee2e6;
}

.btn-collapse {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  color: #424242;
  font-size: 18px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-collapse:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

/* Mobile */
.sidebar-overlay {
  display: none;
}

/* Tablet and below - hide sidebar by default */
@media (max-width: 1023px) {
  .app-sidebar {
    transform: translateX(-100%);
  }

  .app-sidebar.mobile-open {
    transform: translateX(0);
    width: 260px;
    box-shadow: 2px 0 20px rgba(0,0,0,0.2);
  }

  .app-sidebar.collapsed {
    width: 260px;
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 899;
  }

  .sidebar-footer {
    display: none;
  }
}

/* Mobile - account for bottom nav */
@media (max-width: 768px) {
  .app-sidebar {
    bottom: 64px;
  }

  .sidebar-overlay {
    bottom: 64px;
  }
}
</style>
