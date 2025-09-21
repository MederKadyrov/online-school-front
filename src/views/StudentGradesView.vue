<template>
  <div class="card">
    <h3>Мои оценки</h3>

    <div class="row">
      <div>
        <label>С даты (YYYY-MM-DD)</label>
        <input v-model="from" placeholder="2025-06-01" />
      </div>
      <div>
        <label>По дату (YYYY-MM-DD)</label>
        <input v-model="to" placeholder="2025-08-31" />
      </div>
    </div>
    <button @click="load" :disabled="loading">{{ loading ? 'Загрузка...' : 'Показать' }}</button>

    <div v-if="error" class="error" style="margin-top:8px; white-space: pre-wrap;">{{ error }}</div>

    <div v-if="forbidden" class="error" style="margin-top:8px;">
      Эта страница доступна только <b>ученикам</b>.<br/>
      Войдите под аккаунтом ученика, чтобы посмотреть оценки.
    </div>

    <div v-if="!forbidden && rows.length">
      <table style="width:100%; border-collapse: collapse; margin-top:12px;">
        <thead>
        <tr>
          <th style="text-align:left; border-bottom:1px solid #eee; padding:6px;">Дата</th>
          <th style="text-align:left; border-bottom:1px solid #eee; padding:6px;">Предмет</th>
          <th style="text-align:left; border-bottom:1px solid #eee; padding:6px;">Группа</th>
          <th style="text-align:left; border-bottom:1px solid #eee; padding:6px;">Оценка</th>
          <th style="text-align:left; border-bottom:1px solid #eee; padding:6px;">Комментарий</th>
          <th style="text-align:left; border-bottom:1px solid #eee; padding:6px;">Учитель</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="g in rows" :key="g.id">
          <td style="padding:6px;">
            {{ (g.graded_at || g.created_at || '').replace('T',' ').slice(0,19) }}
          </td>
          <td style="padding:6px;">{{ g.lesson?.subject?.name || '—' }}</td>
          <td style="padding:6px;">
            {{ g.lesson?.group?.name || (g.lesson?.group?.grade ? g.lesson.group.grade + (g.lesson.group.class_letter || '') : '—') }}
          </td>
          <td style="padding:6px;"><b>{{ g.value }}</b></td>
          <td style="padding:6px;">{{ g.comment || '' }}</td>
          <td style="padding:6px;">
            {{ g.lesson?.teacher?.user?.name || '—' }}
          </td>
        </tr>
        </tbody>
      </table>

      <div style="display:flex; gap:8px; align-items:center; margin-top:10px;">
        <button @click="prev" :disabled="!canPrev">← Prev</button>
        <button @click="next" :disabled="!canNext">Next →</button>
        <small class="help">
          Страница {{ meta.current_page }} из {{ meta.last_page }},
          всего записей: {{ meta.total }}
        </small>
      </div>
    </div>

    <div v-if="!forbidden && !rows.length && !loading" style="margin-top:8px;">
      <small class="help">Пока нет оценок за выбранный период.</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import api from '../utils/api'
import { ref, onMounted } from 'vue'

const from = ref<string>('')
const to   = ref<string>('')
const loading = ref(false)
const error = ref('')
const forbidden = ref(false)

const rows = ref<any[]>([])
const meta = ref<any>({ current_page: 1, last_page: 1, total: 0 })
const nextUrl = ref<string | null>(null)
const prevUrl = ref<string | null>(null)

const parseLinks = (resp: any) => {
  // Laravel paginator: resp.data, resp.links (array) | resp.meta.links (for API Resource)
  // попробуем оба варианта
  const l = resp.links || resp.meta?.links || []
  nextUrl.value = (l.find((x: any) => x.rel === 'next')?.url) || (l.find((x: any) => x.label?.toLowerCase().includes('next'))?.url) || null
  prevUrl.value = (l.find((x: any) => x.rel === 'prev')?.url) || (l.find((x: any) => x.label?.toLowerCase().includes('previous') || x.label?.includes('« Previous'))?.url) || null
}

const canNext = computed(() => !!nextUrl.value)
const canPrev = computed(() => !!prevUrl.value)

async function load(pageUrl?: string) {
  loading.value = true
  error.value = ''
  forbidden.value = false
  try {
    const params: any = {}
    if (from.value) params.from = from.value
    if (to.value)   params.to   = to.value

    const { data } = pageUrl
        ? await api.get(pageUrl.replace(/^http:\/\/127\.0\.0\.1:8000\/api/, '')) // если backend вернул абсолютный URL
        : await api.get('/student/grades', { params })

    rows.value = data.data || data // на случай, если пагинация отключена
    meta.value = data.meta || { current_page: 1, last_page: 1, total: rows.value.length }
    parseLinks(data)
  } catch (e: any) {
    if (e.status === 403) {
      forbidden.value = true
    } else {
      error.value = e?.data?.message || JSON.stringify(e?.data || e) || 'Error'
    }
  } finally {
    loading.value = false
  }
}

const next = () => { if (nextUrl.value) load(nextUrl.value) }
const prev = () => { if (prevUrl.value) load(prevUrl.value) }

onMounted(() => {
  // по умолчанию — последние 90 дней
  const end = new Date()
  const start = new Date(Date.now() - 90*24*60*60*1000)
  const fmt = (d: Date) => d.toISOString().slice(0,10)
  from.value = fmt(start)
  to.value = fmt(end)
  load()
})
</script>
