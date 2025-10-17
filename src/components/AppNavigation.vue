<template>
  <nav class="app-nav">
    <!-- Desktop Header -->
    <div class="nav-header">
      <div class="nav-container">
        <!-- Logo -->
        <RouterLink to="/" class="logo">
          <span class="logo-icon">🎓</span>
          <span class="logo-text">Школа</span>
        </RouterLink>

        <!-- Hamburger for sidebar (desktop with sidebar) -->
        <button
          v-if="isAuth && hasSidebar"
          @click="toggleSidebar"
          class="btn-hamburger sidebar-toggle"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <!-- Page Title / Breadcrumbs (optional) -->
        <div class="nav-spacer"></div>

        <!-- Right Side Actions -->
        <div class="nav-actions">
          <button v-if="isAuth" @click="logout" class="btn-logout">
            Выйти
          </button>
          <button
            v-if="isAuth && !hasSidebar"
            @click="toggleMobileMenu"
            class="btn-hamburger mobile-only"
            :class="{ active: mobileMenuOpen }"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Sidebar Menu -->
    <Transition name="sidebar">
      <div v-if="mobileMenuOpen && isAuth" class="mobile-sidebar" @click.self="toggleMobileMenu">
        <div class="sidebar-content">
          <div class="sidebar-header">
            <div class="user-info">
              <div class="user-avatar">{{ userInitial }}</div>
              <div class="user-details">
                <div class="user-role">{{ userRoleLabel }}</div>
              </div>
            </div>
            <button @click="toggleMobileMenu" class="btn-close">✕</button>
          </div>

          <div class="sidebar-menu">
            <RouterLink
              v-for="item in visibleMenuItems"
              :key="item.path"
              :to="item.path"
              class="sidebar-link"
              @click="toggleMobileMenu"
            >
              <span class="sidebar-icon">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </RouterLink>
          </div>

          <div class="sidebar-footer">
            <button @click="handleLogout" class="btn-logout-mobile">
              <span>🚪</span>
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const auth = useAuthStore()
const router = useRouter()
const mobileMenuOpen = ref(false)

const isAuth = computed(() => !!auth.token)
const userRole = computed(() => auth.user?.role || '')
const userInitial = computed(() => auth.user?.username?.charAt(0).toUpperCase() || 'U')

const userRoleLabel = computed(() => {
  const role = userRole.value
  if (role === 'admin') return 'Администратор'
  if (role === 'teacher') return 'Учитель'
  if (role === 'student') return 'Ученик'
  return 'Пользователь'
})

// Check if current role should have sidebar
const hasSidebar = computed(() => {
  const role = userRole.value
  return role === 'admin' || role === 'teacher'
})

// Menu items by role
const menuItems = computed(() => {
  const role = userRole.value

  if (role === 'student') {
    return [
      { path: '/student/courses', icon: '📚', label: 'Мои курсы' },
      { path: '/student/journal', icon: '📖', label: 'Журнал' },
      { path: '/student/grades', icon: '📊', label: 'Успеваемость' },
    ]
  }

  if (role === 'teacher') {
    return [
      { path: '/teacher/courses', icon: '📚', label: 'Курсы' },
      { path: '/teacher/submissions', icon: '✏️', label: 'Проверка работ' },
      { path: '/teacher/journal', icon: '📖', label: 'Журнал' },
    ]
  }

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

  return []
})

const visibleMenuItems = computed(() => {
  return isAuth.value ? menuItems.value : []
})

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const handleLogout = () => {
  mobileMenuOpen.value = false
  auth.logout()
  router.push('/login')
}

const logout = () => {
  auth.logout()
  router.push('/login')
}

const toggleSidebar = () => {
  emit('toggle-sidebar')
}
</script>

<style scoped>
/* Variables */
:root {
  --nav-height: 64px;
  --nav-bg: #ffffff;
  --nav-border: #dee2e6;
  --primary-color: #2196f3;
  --text-primary: #212121;
  --text-secondary: #757575;
  --hover-bg: #f5f5f5;
}

/* Navigation Header */
.app-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--nav-bg);
  border-bottom: 1px solid var(--nav-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.nav-header {
  height: var(--nav-height);
}

.nav-container {
  max-width: 100%;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
}

.nav-spacer {
  flex: 1;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 20px;
  transition: opacity 0.2s;
}

.logo:hover {
  opacity: 0.8;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  display: none;
}

/* Desktop Menu */
.nav-menu {
  display: flex;
  gap: 8px;
  align-items: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  text-decoration: none;
  color: var(--text-secondary);
  border-radius: 8px;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 14px;
}

.nav-link:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.nav-link.router-link-active {
  color: var(--primary-color);
  background: rgba(33, 150, 243, 0.08);
}

.nav-icon {
  font-size: 18px;
}

/* Actions */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-logout {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--nav-border);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-primary);
  transition: all 0.2s;
}

.btn-logout:hover {
  background: var(--hover-bg);
}

/* Hamburger Button */
.btn-hamburger {
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 0;
  border-radius: 8px;
  transition: background 0.2s;
}

.btn-hamburger:hover {
  background: var(--hover-bg);
}

.btn-hamburger span {
  width: 24px;
  height: 2px;
  background: var(--text-primary);
  transition: all 0.3s;
  border-radius: 2px;
}

.btn-hamburger.active span:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.btn-hamburger.active span:nth-child(2) {
  opacity: 0;
}

.btn-hamburger.active span:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

/* Sidebar Toggle (desktop) */
.sidebar-toggle {
  display: none;
}

@media (min-width: 1024px) {
  .sidebar-toggle {
    display: flex;
  }
}

/* Mobile Sidebar */
.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
}

.sidebar-content {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  max-width: 80vw;
  background: var(--nav-bg);
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0,0,0,0.1);
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid var(--nav-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-role {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.btn-close {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.btn-close:hover {
  background: var(--hover-bg);
}

.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  text-decoration: none;
  color: var(--text-primary);
  border-radius: 8px;
  transition: all 0.2s;
  font-weight: 500;
  margin-bottom: 4px;
}

.sidebar-link:hover {
  background: var(--hover-bg);
}

.sidebar-link.router-link-active {
  background: rgba(33, 150, 243, 0.08);
  color: var(--primary-color);
}

.sidebar-icon {
  font-size: 22px;
  width: 28px;
  text-align: center;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--nav-border);
}

.btn-logout-mobile {
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: 1px solid var(--nav-border);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  color: var(--text-primary);
  transition: all 0.2s;
}

.btn-logout-mobile:hover {
  background: var(--hover-bg);
}

.btn-logout-mobile span:first-child {
  font-size: 20px;
}

/* Transitions */
.sidebar-enter-active, .sidebar-leave-active {
  transition: opacity 0.3s;
}

.sidebar-enter-active .sidebar-content,
.sidebar-leave-active .sidebar-content {
  transition: transform 0.3s;
}

.sidebar-enter-from, .sidebar-leave-to {
  opacity: 0;
}

.sidebar-enter-from .sidebar-content {
  transform: translateX(100%);
}

.sidebar-leave-to .sidebar-content {
  transform: translateX(100%);
}

/* Responsive */
.mobile-only {
  display: none;
}

.desktop-only {
  display: flex;
}

@media (max-width: 768px) {
  .mobile-only {
    display: flex;
  }

  .desktop-only {
    display: none;
  }

  .logo-text {
    display: inline;
  }

  .nav-link span:not(.nav-icon) {
    display: none;
  }
}

@media (min-width: 769px) {
  .logo-text {
    display: inline;
  }
}
</style>
