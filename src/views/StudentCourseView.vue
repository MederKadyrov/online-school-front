<template>
  <div class="card" v-if="course">
    <h2>{{ course.title }}</h2>
    <p class="muted">
      <span v-if="course.subject">{{ course.subject.name }}</span>
      <span v-if="course.level"> • {{ course.level.number }} класс</span>
      <span v-if="course.teacher"> • {{ course.teacher.name }}</span>
    </p>
    <section v-if="course.modules?.length" class="modules">
      <details v-for="m in course.modules" :key="m.id" open>
        <summary>{{ m.number }}. {{ m.title }}</summary>
        <ul v-if="m.chapters?.length" class="chapters">
          <li v-for="ch in m.chapters" :key="ch.id">
            <strong>{{ ch.number }}. {{ ch.title }}</strong>
            <ul v-if="ch.paragraphs?.length" class="paragraphs">
              <li v-for="p in ch.paragraphs" :key="p.id">
                <RouterLink :to="`/student/paragraphs/${p.id}`" class="paragraph-link"> {{ ch.number }}.{{ p.number }} — {{ p.title }}
                  <span v-if="p.description" class="muted"> — {{ p.description }}</span>
                </RouterLink> </li> </ul> <p v-else class="muted">Нет параграфов</p>
          </li>
        </ul>
        <p v-else class="muted">Нет глав</p>
      </details>
    </section>
  </div>
  <p v-else class="muted">Загрузка…</p>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import api from '../utils/api'
import { useBreadcrumb } from '../composables/useBreadcrumb'

const route = useRoute()
const course = ref<any|null>(null)
const error = ref('')
const { setBreadcrumb } = useBreadcrumb()

async function load() {
  try {
    const { data } = await api.get(`/student/courses/${route.params.id}`)
    course.value = data

    // Обновляем breadcrumb с названием курса
    if (data && data.title) {
      setBreadcrumb(route.path, {
        label: data.title,
        icon: '📖'
      })
    }
  } catch (e:any) {
    error.value = e?.data?.message || e?.message || 'Не удалось загрузить курс'
  }
}

onMounted(load)

// Следим за изменениями route.params.id
watch(() => route.params.id, () => {
  if (route.params.id) {
    load()
  }
})
</script>

<style scoped>
.card { padding:16px; border:1px solid #eee; border-radius:10px; color: #666666}
.modules details { border:1px solid #f4f4f4; border-radius:6px; padding:8px; margin-bottom:10px; background:#fafafa }
summary { cursor:pointer; font-weight:600 }
.chapters { list-style:none; padding:0; margin:6px 0 0 0; display:flex; flex-direction:column; gap:6px }
.paragraphs { list-style:none; margin:6px 0 0 0; padding-left:16px; display:flex; flex-direction:column; gap:4px }
.paragraph-link { color:inherit; text-decoration:none }
.paragraph-link:hover { text-decoration:underline }
.muted { color:#666 }
</style>