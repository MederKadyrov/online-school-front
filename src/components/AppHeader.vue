<template>
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
        <LanguageSwitcher />
        <button v-if="isAuth" @click="logout" class="btn-logout">
          Выйти
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LanguageSwitcher from './LanguageSwitcher.vue'

const props = defineProps<{
  sidebarOpen: boolean
  hasSidebar: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
  (e: 'logout'): void
}>()

const auth = useAuthStore()
const router = useRouter()

const isAuth = computed(() => !!auth.token)

const toggleSidebar = () => {
  emit('toggle-sidebar')
}

const logout = () => {
  emit('logout')
}
</script>

<style scoped>
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

/* Responsive */
@media (min-width: 1024px) {
  .logo-text {
    display: inline;
  }
}

@media (max-width: 768px) {
  .logo-text {
    display: inline;
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
</style>
