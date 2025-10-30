<template>
  <div class="app-root">
    <!-- Header - всегда на всю ширину -->
    <header class="app-header">
      <div class="header-content">
        <!-- Hamburger button - всегда показываем для admin/teacher -->
        <button
          v-if="hasSidebar"
          @click="toggleSidebar"
          class="btn-hamburger"
          :class="{ active: sidebarOpen }"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <!-- Logo -->
        <RouterLink to="/" class="logo">
          <span class="logo-icon">🎓</span>
          <span class="logo-text">Школа</span>
        </RouterLink>

        <div class="header-spacer"></div>

        <!-- Guest Navigation (horizontal) -->
        <nav v-if="!isAuth" class="guest-nav">
          <RouterLink to="/login" class="guest-nav-link">
            <span class="guest-nav-icon">🔐</span>
            <span class="guest-nav-label">Вход</span>
          </RouterLink>
          <RouterLink to="/register-student" class="guest-nav-link guest-nav-link-primary">
            <span class="guest-nav-icon">📝</span>
            <span class="guest-nav-label">Регистрация</span>
          </RouterLink>
        </nav>

        <!-- User actions -->
        <div class="header-actions">
          <button v-if="isAuth" @click="logout" class="btn-logout">
            Выйти
          </button>
        </div>
      </div>
    </header>

    <!-- Breadcrumbs -->
    <AppBreadcrumbs v-if="isAuth" />

    <!-- Main Layout -->
    <div class="app-layout">
      <!-- Sidebar -->
      <aside
        v-if="hasSidebar"
        class="app-sidebar"
        :class="{
          open: sidebarOpen,
          collapsed: sidebarCollapsed
        }"
      >
        <div class="sidebar-content">
          <!-- User Info -->
          <div class="sidebar-user">
            <div class="user-avatar">{{ userInitial }}</div>
            <div class="user-info" v-if="!sidebarCollapsed">
              <div class="user-name">{{ userName }}</div>
              <div class="user-role">{{ userRoleLabel }}</div>
            </div>
          </div>

          <!-- Navigation Menu -->
          <nav class="sidebar-nav">
            <RouterLink
              v-for="item in menuItems"
              :key="item.path"
              :to="item.path"
              class="nav-item"
              :title="item.label"
              @click="closeSidebarOnMobile"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label" v-if="!sidebarCollapsed">{{ item.label }}</span>
            </RouterLink>
          </nav>

          <!-- Collapse button (desktop only) -->
          <div class="sidebar-footer">
            <button @click="toggleCollapse" class="btn-collapse" :title="sidebarCollapsed ? 'Развернуть' : 'Свернуть'">
              <span v-if="sidebarCollapsed">→</span>
              <span v-else>←</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Overlay for mobile -->
      <div
        v-if="hasSidebar && sidebarOpen"
        class="sidebar-overlay"
        @click="closeSidebar"
      ></div>

      <!-- Main Content -->
      <main class="app-main" :class="{ 'with-sidebar': hasSidebar, 'sidebar-collapsed': sidebarCollapsed }">
        <router-view />
      </main>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import AppBreadcrumbs from './components/AppBreadcrumbs.vue'

const auth = useAuthStore()
const router = useRouter()

// State
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)

// Computed
const isAuth = computed(() => !!auth.token)
const userRole = computed(() => auth.user?.role || '')
const userName = computed(() => auth.user?.name || 'Пользователь')
const userInitial = computed(() => auth.user?.username?.charAt(0).toUpperCase() || 'U')

const userRoleLabel = computed(() => {
  const role = userRole.value
  if (role === 'admin') return 'Администратор'
  if (role === 'teacher') return 'Учитель'
  if (role === 'student') return 'Ученик'
  return 'Пользователь'
})

const hasSidebar = computed(() => {
  const role = userRole.value
  return role === 'admin' || role === 'teacher' || role === 'student'
})

// Menu items by role
const menuItems = computed(() => {
  const role = userRole.value

  if (role === 'admin') {
    return [
      { path: '/admin/groups', icon: '🏫', label: 'Группы' },
      { path: '/admin/students', icon: '👨‍🎓', label: 'Студенты' },
      { path: '/admin/teachers', icon: '👨‍🏫', label: 'Учителя' },
      { path: '/admin/courses', icon: '📚', label: 'Курсы учителей' },
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
      { path: '/teacher/profile', icon: '👤', label: 'Профиль' },
    ]
  }

  if (role === 'student') {
    return [
      { path: '/student/courses', icon: '📚', label: 'Мои курсы' },
      { path: '/student/assignments', icon: '📝', label: 'Мои задания' },
      { path: '/student/journal', icon: '📊', label: 'Журнал оценок' },
      { path: '/student/grades', icon: '⭐', label: 'Успеваемость' },
      { path: '/student/profile', icon: '👤', label: 'Профиль' },
    ]
  }

  return []
})

// Methods
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
  if (window.innerWidth >= 1024) {
    // На desktop сохраняем состояние
    localStorage.setItem('sidebarOpen', sidebarOpen.value.toString())
  }
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const closeSidebarOnMobile = () => {
  if (window.innerWidth < 1024) {
    closeSidebar()
  }
}

const toggleCollapse = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString())
}

const logout = () => {
  auth.logout()
  router.push('/login')
}

// Restore sidebar state from localStorage
onMounted(async () => {
  // Загружаем данные пользователя при монтировании
  if (auth.token && !auth.user) {
    try {
      await auth.fetchMe()
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  // После загрузки пользователя восстанавливаем состояние sidebar
  if (hasSidebar.value) {
    const savedOpen = localStorage.getItem('sidebarOpen')
    const savedCollapsed = localStorage.getItem('sidebarCollapsed')

    // На desktop показываем sidebar по умолчанию
    if (window.innerWidth >= 1024) {
      sidebarOpen.value = savedOpen !== 'false'
    }

    sidebarCollapsed.value = savedCollapsed === 'true'
  }
})
</script>

<style>
/* Global Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #212121;
  background: #fafafa;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  padding: 2rem 0 0 0;
}

/* App Root - Full Height */
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ============================================
   HEADER - Always Full Width
   ============================================ */
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #dee2e6;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  z-index: 1000;
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
}

.header-spacer {
  flex: 1;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #212121;
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
  border-radius: 8px;
  transition: background 0.2s;
}

.btn-hamburger:hover {
  background: #f5f5f5;
}

.btn-hamburger span {
  width: 24px;
  height: 2px;
  background: #212121;
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

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-logout {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  color: #212121;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-logout:hover {
  background: #f5f5f5;
}

/* Guest Navigation (horizontal) */
.guest-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.guest-nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  text-decoration: none;
  color: #424242;
  border-radius: 8px;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 14px;
  border: 1px solid #dee2e6;
  background: #ffffff;
}

.guest-nav-link:hover {
  background: #f5f5f5;
  border-color: #bdbdbd;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.guest-nav-link-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.guest-nav-link-primary:hover {
  background: linear-gradient(135deg, #5568d3 0%, #65408b 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.guest-nav-icon {
  font-size: 18px;
}

.guest-nav-label {
  white-space: nowrap;
}

/* ============================================
   LAYOUT - Sidebar + Main Content
   ============================================ */
.app-layout {
  /* Header height */
  margin-top: 64px;
  flex: 1;
  display: flex;
  position: relative;
}

/* ============================================
   SIDEBAR
   ============================================ */
.app-sidebar {
  position: fixed;
  left: 0;
  top: 64px;
  bottom: 0;
  width: 260px;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  transition: transform 0.3s ease, width 0.3s ease;
  z-index: 999;
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
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

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
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
  margin-bottom: 4px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
}

.nav-item:hover {
  background: #e9ecef;
  color: #212121;
}

.nav-item.router-link-active {
  background: linear-gradient(90deg, rgba(33, 150, 243, 0.15) 0%, rgba(33, 150, 243, 0.08) 100%);
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
}

.app-sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 12px;
}

.app-sidebar.collapsed .nav-label {
  display: none;
}

/* Sidebar Footer */
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
  background: #e9ecef;
}

/* Sidebar Overlay (mobile) */
.sidebar-overlay {
  display: none;
}

/* ============================================
   MAIN CONTENT
   ============================================ */
.app-main {
  flex: 1;
  /* padding: 24px; */
  min-height: calc(100vh - 64px);
  background: #fafafa;
  transition: margin-left 0.3s ease;
}

.app-main.with-sidebar {
  /* margin-left: 260px; */
}

.app-main.with-sidebar.sidebar-collapsed {
  margin-left: 70px;
}

/* ============================================
   RESPONSIVE
   ============================================ */

/* Desktop */
@media (min-width: 1024px) {
  .logo-text {
    display: inline;
  }

  .app-sidebar {
    transform: translateX(0);
  }

  .app-sidebar:not(.open) {
    transform: translateX(-100%);
  }
}

/* Tablet and Mobile */
@media (max-width: 1023px) {
  .app-sidebar {
    transform: translateX(-100%);
  }

  .app-sidebar.open {
    transform: translateX(0);
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
    z-index: 998;
  }

  .sidebar-footer {
    display: none;
  }

  .app-main.with-sidebar {
    margin-left: 0;
  }

  .app-main.with-sidebar.sidebar-collapsed {
    margin-left: 0;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .logo-text {
    display: inline;
  }

  .app-main {
    padding: 16px 12px;
  }

  /* Hide guest nav labels on small screens */
  .guest-nav {
    gap: 8px;
  }

  .guest-nav-link {
    padding: 10px 12px;
  }

  .guest-nav-label {
    display: none;
  }

  .guest-nav-icon {
    font-size: 20px;
  }
}

/* ============================================
   FORM ELEMENTS
   ============================================ */
input, select, textarea {
  padding: 12px;
  margin: 4px 0;
  width: 100%;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  transition: border-color 0.2s;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

label {
  font-weight: 600;
  margin-top: 12px;
  margin-bottom: 4px;
  display: block;
  color: #424242;
  font-size: 14px;
}

button:not(.btn-logout):not(.btn-hamburger):not(.btn-collapse) {
  padding: 12px 24px;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
  font-family: inherit;
  background: #2196f3;
  color: white;
}

button:not(.btn-logout):not(.btn-hamburger):not(.btn-collapse):hover {
  background: #1976d2;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

button:not(.btn-logout):not(.btn-hamburger):not(.btn-collapse):active {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Card */
.card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

/* Grid Layout */
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .row {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 16px;
  }
}

/* Messages */
.error {
  color: #d32f2f;
  background: #ffebee;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 12px 0;
  white-space: pre-wrap;
  border-left: 4px solid #d32f2f;
  font-size: 14px;
}

.success {
  color: #2e7d32;
  background: #e8f5e9;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 12px 0;
  border-left: 4px solid #2e7d32;
  font-size: 14px;
}

small.help {
  color: #757575;
  font-size: 12px;
  display: block;
  margin-top: 4px;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  color: #212121;
  margin-bottom: 16px;
}

h1 {
  font-size: 32px;
  font-weight: 700;
}

h2 {
  font-size: 24px;
  font-weight: 600;
}

h3 {
  font-size: 20px;
  font-weight: 600;
}

@media (max-width: 768px) {
  h1 {
    font-size: 24px;
  }

  h2 {
    font-size: 20px;
  }

  h3 {
    font-size: 18px;
  }
}

/* Utility Classes */
.text-center {
  text-align: center;
}

.mt-1 { margin-top: 8px; }
.mt-2 { margin-top: 16px; }
.mt-3 { margin-top: 24px; }
.mb-1 { margin-bottom: 8px; }
.mb-2 { margin-bottom: 16px; }
.mb-3 { margin-bottom: 24px; }

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-1 { gap: 8px; }
.gap-2 { gap: 16px; }
.gap-3 { gap: 24px; }
</style>
