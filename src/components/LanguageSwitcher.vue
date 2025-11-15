<template>
  <div class="language-switcher">
    <button
      @click="changeLocale('ru')"
      :class="{ active: currentLocale === 'ru' }"
      class="lang-btn"
    >
      Русский
    </button>
    <button
      @click="changeLocale('ky')"
      :class="{ active: currentLocale === 'ky' }"
      class="lang-btn"
    >
      Кыргызча
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const currentLocale = computed(() => locale.value)

const changeLocale = (newLocale: string) => {
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
  // Перезагружаем страницу для применения изменений во всех компонентах
  window.location.reload()
}
</script>

<style scoped>
.language-switcher {
  display: flex;
  gap: 8px;
  align-items: center;
}

.lang-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.lang-btn:hover {
  background: #f5f5f5;
}

.lang-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}
</style>
