<template>
  <nav v-if="breadcrumbs.length > 0" class="breadcrumbs-container">
    <div class="breadcrumbs">
      <RouterLink to="/" class="breadcrumb-item home">
        <span class="breadcrumb-icon">🏠</span>
        <span class="breadcrumb-label">Главная</span>
      </RouterLink>

      <template v-for="(crumb, index) in breadcrumbs" :key="index">
        <span class="breadcrumb-separator">›</span>

        <RouterLink
          v-if="crumb.path && index < breadcrumbs.length - 1"
          :to="crumb.path"
          class="breadcrumb-item"
        >
          <span v-if="crumb.icon" class="breadcrumb-icon">{{ crumb.icon }}</span>
          <span class="breadcrumb-label">{{ crumb.label }}</span>
        </RouterLink>

        <span v-else class="breadcrumb-item active">
          <span v-if="crumb.icon" class="breadcrumb-icon">{{ crumb.icon }}</span>
          <span class="breadcrumb-label">{{ crumb.label }}</span>
        </span>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBreadcrumb } from '../composables/useBreadcrumb'

const route = useRoute()
const { getBreadcrumb } = useBreadcrumb()

interface Breadcrumb {
  label: string
  path?: string
  icon?: string
}

const breadcrumbs = computed<Breadcrumb[]>(() => {
  const crumbs: Breadcrumb[] = []

  // Получаем все matched routes (включая родительские)
  const matched = route.matched.filter(r => r.meta && r.meta.breadcrumb)

  matched.forEach((record) => {
    const meta = record.meta

    // Проверяем, есть ли динамический breadcrumb для этого пути
    const dynamicCrumb = getBreadcrumb(route.path)

    // Если есть динамический breadcrumb, используем его
    if (dynamicCrumb && record.path === route.path) {
      crumbs.push(dynamicCrumb)
      return
    }

    // Если breadcrumb - это массив (иерархия)
    if (Array.isArray(meta.breadcrumb)) {
      meta.breadcrumb.forEach((bc: any) => {
        crumbs.push(bc)
      })
    }
    // Если breadcrumb - это функция, вызываем её с route
    else if (typeof meta.breadcrumb === 'function') {
      const result = meta.breadcrumb(route)
      if (result) {
        crumbs.push(result)
      }
    }
    // Если breadcrumb - это объект
    else if (typeof meta.breadcrumb === 'object') {
      crumbs.push(meta.breadcrumb as Breadcrumb)
    }
    // Если breadcrumb - это строка
    else if (typeof meta.breadcrumb === 'string') {
      crumbs.push({
        label: meta.breadcrumb,
        path: record.path,
      })
    }
  })

  return crumbs
})
</script>

<style scoped>
.breadcrumbs-container {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 12px 0;
  position: sticky;
  top: 64px;
  z-index: 100;
}

.breadcrumbs {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  text-decoration: none;
  color: #424242;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.breadcrumb-item:not(.active):hover {
  background: #f5f5f5;
  color: #2196f3;
}

.breadcrumb-item.home {
  color: #757575;
}

.breadcrumb-item.active {
  color: #2196f3;
  font-weight: 600;
  cursor: default;
}

.breadcrumb-icon {
  font-size: 16px;
  line-height: 1;
}

.breadcrumb-label {
  line-height: 1;
}

.breadcrumb-separator {
  color: #bdbdbd;
  font-size: 16px;
  user-select: none;
}

/* Mobile */
@media (max-width: 768px) {
  .breadcrumbs-container {
    padding: 8px 0;
  }

  .breadcrumbs {
    padding: 0 16px;
    gap: 4px;
  }

  .breadcrumb-item {
    padding: 4px 8px;
    font-size: 13px;
  }

  .breadcrumb-label {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .breadcrumb-icon {
    font-size: 14px;
  }
}
</style>
