<template>
  <!-- ЕДИНЫЙ корневой элемент -->
  <div class="course-editor-container">

    <!-- Основной контент курса -->
    <div class="wrap" v-if="course">
      <div class="side">
        <h3>{{ course.title }}</h3>
        <p class="muted">{{ course.subject?.name }}, {{ course.level?.number }} класс</p>

        <h4>Модули</h4>
        <ul class="list">
          <li v-for="m in course.modules" :key="m.id" :class="{active: m.id===activeModuleId}" @click="activeModuleId=m.id">
            {{ m.number }}. {{ m.title }}
          </li>
        </ul>
        <button class="btn" @click="createModule">+ Модуль</button>
      </div>

      <div class="main">
        <div v-if="activeModule">
          <h4>{{ activeModule.number }}. {{ activeModule.title }}</h4>
          <div class="newline">
            <input v-model="newChapterTitle" class="inp" placeholder="Новая глава...">
            <button class="btn primary" @click="createChapter">Добавить главу</button>
          </div>

          <draggable
              v-model="chapters"
              item-key="id"
              handle=".grab"
              @end="onReorderChapters"
              class="list"
          >
            <template #item="{ element: ch }">
              <li class="chapter-item">
                <span class="grab">⋮⋮</span>
                <div class="row">
                  <h5 v-if="editChapterId !== ch.id">Глава {{ ch.number }}. {{ ch.title }}</h5>
                  <div v-else class="inline-edit">
                    <input v-model="editChapterTitle" class="inp" />
                    <button class="btn" @click="saveChapter(ch)">Сохранить</button>
                    <button class="btn" @click="cancelEditChapter">Отмена</button>
                  </div>
                  <div class="row-actions">
                    <button class="btn" @click="startEditChapter(ch)">✏️</button>
                    <button class="btn danger" @click="removeChapter(ch)">🗑</button>
                  </div>
                </div>

                <!-- Параграфы этой главы -->
                <div class="newline">
                  <input v-model="newParagraphTitle[ch.id]" class="inp" placeholder="Новый параграф...">
                  <button class="btn" @click="createParagraph(ch)">+ Параграф</button>
                </div>

                <draggable
                    v-model="paragraphsByChapter[ch.id]"
                    item-key="id"
                    handle=".grab"
                    :group="{ name: 'paras-'+ch.id, pull: false, put: false }"
                    :disabled="!(paragraphsByChapter[ch.id] && paragraphsByChapter[ch.id].length)"
                    @end="() => onReorderParagraphs(ch)"
                    class="list small"
                >
                  <template #item="{ element: p }">
                    <li class="para-item">
                      <span class="grab">⋮⋮</span>
                      <template v-if="editParagraphId !== p.id">
                        {{ ch.position }}.{{ p.position }} — {{ p.title }}
                        <span class="muted" v-if="p.description"> — {{ p.description }}</span>
                        <button class="btn xs" @click="startEditParagraph(p)">✏️</button>
                        <button class="btn xs" @click="openResources(ch, p)">
                          📎 Ресурсы
                          <span v-if="p.resources_count > 0" class="dot green"></span>
                          <span v-else class="dot red"></span>
                        </button>
                        <button class="btn xs" @click="openAssignment(ch, p)">
                          📝 Задание
                          <span v-if="p.has_assignment" class="dot green"></span>
                          <span v-else class="dot red"></span>
                        </button>
                        <button class="btn xs" @click="openQuiz(ch, p)">
                          🧪 Тест
                          <span v-if="p.has_quiz" class="dot green"></span>
                          <span v-else class="dot red"></span>
                        </button>
                        <button class="btn xs danger" @click="removeParagraph(ch, p)">🗑</button>
                      </template>
                      <template v-else>
                        <input v-model="editParagraphTitle" class="inp small" />
                        <input v-model="editParagraphDesc" class="inp small" placeholder="Описание (необязательно)" />
                        <button class="btn xs" @click="saveParagraph(ch, p)">Сохранить</button>
                        <button class="btn xs" @click="cancelEditParagraph">Отмена</button>
                      </template>
                    </li>
                  </template>
                </draggable>
              </li>
            </template>
          </draggable>

          <!-- Альтернативный вид без draggable -->

        </div>
        <div v-else class="muted">Выберите модуль слева</div>
      </div>

      <!-- Секция групп -->
      <div class="box">
        <h4>Группы курса</h4>
        <p class="muted">Курс будет доступен всем студентам выбранных групп.</p>

        <div class="newline">
          <input v-model="groupSearch" class="inp" placeholder="Поиск групп (литера/номер)" @input="debouncedLoadGroups" />
          <button class="btn" @click="loadGroups">Обновить</button>
        </div>

        <div class="groups-grid">
          <label v-for="g in groupsPool" :key="g.id" class="grp">
            <input type="checkbox" :value="g.id" v-model="selectedGroupIds">
            <span class="name">{{ g.display_name }}</span>
            <span class="meta">{{ g.students_count }} студентов</span>
          </label>
        </div>

        <div class="actions">
          <button class="btn primary" @click="saveGroups" :disabled="savingGroups">
            {{ savingGroups ? 'Сохранение…' : 'Сохранить привязку' }}
          </button>
        </div>

        <p v-if="groupsMsg" class="ok">{{ groupsMsg }}</p>
        <p v-if="groupsErr" class="error">{{ groupsErr }}</p>
      </div>

      <!-- Панель ресурсов -->
      <div v-if="resPanel.open" class="res-panel">
        <div class="res-body">
          <h4>Ресурсы: {{ resPanel.paragraph?.title }}</h4>
          <button class="close" @click="closeResPanel">×</button>

          <draggable
              v-model="resPanel.items"
              item-key="id"
              handle=".grab"
              @end="onReorderResources"
              class="res-list"
          >
            <template #item="{ element: r }">
              <div class="res-item">
                <div class="res-head">
                  <span class="grab">⋮⋮</span>
                  <strong>{{ labelResource(r) }}</strong>
                  <div class="res-actions">
                    <button class="btn xs" @click="startEditResource(r)">✏️</button>
                    <button class="btn xs danger" @click="removeResource(r)">🗑</button>
                  </div>
                </div>
                <div class="res-meta">
                  <span v-if="r.url">URL: <a :href="r.url" target="_blank">{{ r.url }}</a></span>
                  <span v-if="r.path">Файл: {{ r.path }}</span>
                  <span v-if="r.duration_sec">Длительность: {{ r.duration_sec }} сек</span>
                </div>

                <div v-if="resEdit.id === r.id" class="res-edit">
                  <input v-model="resEdit.title" class="inp small" placeholder="Название (необязательно)" />
                  <input v-if="r.type !== 'file'" v-model="resEdit.url" class="inp small" placeholder="Ссылка (URL)" />
                  <textarea v-if="r.type === 'text'" v-model="resEdit.text_content" class="inp" placeholder="Текст"></textarea>
                  <button class="btn xs" @click="saveResourceEdit(r)">Сохранить</button>
                  <button class="btn xs" @click="cancelResourceEdit">Отмена</button>
                </div>
              </div>
            </template>
          </draggable>

          <hr />
          <h5>Добавить ресурс</h5>
          <div class="add-res">
            <select v-model="resForm.type" class="inp small">
              <option value="video">Видео</option>
              <option value="link">Ссылка</option>
              <option value="file">Файл</option>
              <option value="presentation">Презентация</option>
              <option value="text">Текст</option>
            </select>

            <!-- video/link/presentation -->
            <input
                v-if="resForm.type !== 'file' && resForm.type !== 'text'"
                v-model="resForm.url"
                class="inp"
                placeholder="URL (YouTube, документ и т.п.)"
            />

            <!-- text -->
            <textarea
                v-if="resForm.type === 'text'"
                v-model="resForm.text_content"
                class="inp"
                placeholder="Текст контента"
            ></textarea>

            <!-- file -->
            <input v-if="resForm.type === 'file'" type="file" @change="onPickFile" />

            <input v-model="resForm.title" class="inp" placeholder="Название ресурса (необязательно)" />
            <input
                v-model.number="resForm.duration_sec"
                class="inp small"
                type="number"
                min="0"
                placeholder="Длительность, сек (опционально)"
            />

            <div class="actions">
              <button class="btn primary" @click="addResource" :disabled="resSaving">Добавить</button>
              <span v-if="resErr" class="error">{{ resErr }}</span>
            </div>
          </div>
        </div>
      </div>

<!--   Панель задания (модалка)   -->
      <div v-if="asg.open" class="res-panel">
        <div class="res-body">
          <button class="close" @click="closeAsg">×</button>
          <h4>Задание: {{ asg.item?.title || 'Новое' }}</h4>

          <div class="grid2">
            <div>
              <label>Название</label>
              <input v-model="asg.form.title" class="inp" placeholder="Например: Домашнее задание №1" />
              <label>Инструкции</label>
              <textarea v-model="asg.form.instructions" class="inp" rows="6"></textarea>
              <div class="row">
                <div>
                  <label>Дедлайн</label>
                  <input v-model="asg.form.due_at" type="datetime-local" class="inp small" />
                </div>
                <div>
                  <label>Макс. баллов</label>
                  <input v-model.number="asg.form.max_points" type="number" min="1" class="inp small" />
                </div>
              </div>



              <div class="newline">
                <label>Файл-условие (опц.)</label>
                <input
                  type="file"
                  @change="pickAsgFile"
                />
              </div>

              <!-- выбранный новый файл -->
              <p v-if="asg.file" class="muted">
                Выбран файл: {{ asg.file.name }}
              </p>

              <!-- уже прикреплённый файл из БД -->
              <p v-else-if="asg.item?.attachments_path" class="muted">
                Текущий файл:
                <a
                  :href="storageUrl(asg.item.attachments_path)"
                  target="_blank"
                >
                  {{ asg.item.attachments_path.split('/').pop() }}
                </a>
              </p>

              <div class="actions">
                <!-- если задания нет -->
                <button
                    v-if="!asg.item || !asg.item.id"
                    class="btn primary"
                    :disabled="asg.saving || !asg.form.title"
                    @click="createAndPublishAssignment"
                >
                  {{ asg.saving ? 'Создание…' : 'Создать и опубликовать' }}
                </button>

                <!-- если задание уже есть -->
                <template v-else>
                  <button
                      class="btn primary"
                      :disabled="asg.saving || !asg.form.title"
                      @click="saveAssignment"
                  >
                    {{ asg.saving ? 'Сохранение…' : 'Сохранить изменения' }}
                  </button>
                  <button class="btn danger" :disabled="asg.saving" @click="removeAssignment">
                    Удалить задание
                  </button>
                </template>
              </div>
              <p class="hint">Ученики увидят задание сразу после публикации.</p>
              <p class="error" v-if="asg.err">{{ asg.err }}</p>
              <p class="ok" v-if="asg.msg">{{ asg.msg }}</p>
            </div>

            <div>
              <h5>Отправки студентов</h5>
              <button class="btn xs" @click="loadSubmissions">Обновить</button>
              <table class="tbl small" v-if="asg.submissions.length">
                <thead><tr><th>Студент</th><th>Дата</th><th>Файл</th><th>Балл</th><th>Оценка</th><th></th></tr></thead>
                <tbody>
                <tr v-for="s in asg.submissions" :key="s.id">
                  <td>{{ s.student?.name }}</td>
                  <td>{{ s.submitted_at }}</td>
                  <td>
                    <a v-if="s.file_path" :href="storageUrl(s.file_path)" target="_blank">Скачать</a>
                    <span v-else class="muted">нет</span>
                  </td>
                  <td><input v-model.number="s._score" type="number" min="0" class="inp tiny" /></td>
                  <td>{{ s.grade_5 ?? '-' }}</td>
                  <td><button class="btn xs" @click="gradeSubmission(s)">Оценить</button></td>
                </tr>
                </tbody>
              </table>
              <p class="muted" v-else>Ещё нет отправок</p>
            </div>
          </div>
        </div>
      </div>

      <!--      -->

<!--   Модалка теста   -->
      <!-- Quiz modal -->
      <div v-if="quiz.open" class="res-panel">
        <div class="res-body">
          <button class="close" @click="closeQuiz">×</button>
          <h4>Тест: {{ quiz.item?.title || 'Новый' }}</h4>

          <div class="grid2">
            <!-- Левая колонка: карточка теста -->
            <div>
              <label>Название <span class="req">*</span></label>
              <input v-model="quiz.form.title" class="inp" placeholder="Контрольная по теме «Кинематика»" />

              <label>Инструкции</label>
              <textarea v-model="quiz.form.instructions" class="inp" rows="5" placeholder="Опишите правила: время, критерии..."></textarea>

              <div class="row">
                <div>
                  <label>Лимит времени (сек)</label>
                  <input v-model.number="quiz.form.time_limit_sec" type="number" min="30" class="inp small" />
                </div>
                <div>
                  <label>Макс. попыток</label>
                  <input v-model.number="quiz.form.max_attempts" type="number" min="1" class="inp small" />
                </div>
              </div>

              <label class="inline">
                <input type="checkbox" v-model="quiz.form.shuffle" /> Перемешивать вопросы/варианты
              </label>


              <!-- Блок действий -->
              <div class="actions">
                <!-- Если тест ещё не создан -->
                <button
                    v-if="!quiz.item || !quiz.item.id"
                    class="btn primary"
                    :disabled="quiz.saving || !quiz.form.title"
                    @click="createQuiz"
                >
                  {{ quiz.saving ? 'Создание…' : 'Создать' }}
                </button>

                <!-- Если тест уже создан -->
                <template v-else>
                  <button
                      class="btn primary"
                      :disabled="quiz.saving || !quiz.form.title"
                      @click="saveQuiz"
                  >
                    {{ quiz.saving ? 'Сохранение…' : 'Сохранить изменения' }}
                  </button>

                  <button
                      class="btn"
                      :disabled="quiz.saving || !canPublish"
                      title="Для публикации нужен хотя бы 1 вопрос; для single/multiple — с корректными вариантами"
                      @click="publishQuiz"
                  >
                    Опубликовать
                  </button>

                  <button class="btn danger" :disabled="quiz.saving" @click="removeQuiz">
                    Удалить тест
                  </button>

                  <span class="muted">
                    Статус: {{ quiz.item.status }} | Макс. баллов: {{ quiz.item.max_points }}
                  </span>
                </template>
              </div>

              <p class="error" v-if="quiz.err">{{ quiz.err }}</p>
              <p class="ok" v-if="quiz.msg">{{ quiz.msg }}</p>
            </div>

            <hr />

            <!-- Правая колонка: вопросы/варианты -->
            <!-- СЕКЦИЯ ВОПРОСОВ — видна только после создания теста -->
            <div v-if="quiz.item && quiz.item.id">

              <!-- Список вопросов -->
              <div v-if="quiz.questions.length === 0" class="muted">Пока нет вопросов</div>

              <div v-for="q in quiz.questions" :key="q.id" class="box">
                <div class="row">
                  <strong>#{{ q.position || '?' }} ({{ q.type }})</strong>
                  <button class="btn xs" @click="deleteQuestion(q)">Удалить</button>
                </div>

                <label>Текст вопроса</label>
                <textarea v-model="q._text" class="inp" rows="3" @blur="updateQuestion(q)"></textarea>

                <div class="row">
                  <label>Баллы</label>
                  <input v-model.number="q._points" type="number" min="1" class="inp tiny" @blur="updateQuestion(q)" />
                </div>

                <!-- Варианты -->
                <div v-if="q.type!=='text'">
                  <div class="row">
                    <span class="muted">Варианты</span>
                    <button class="btn xs" @click="addOption(q)">+ вариант</button>
                  </div>
                  <div v-if="!q.options || q.options.length===0" class="muted">Нет вариантов</div>

                  <!-- SINGLE: radio -->
                  <template v-if="q.type==='single'">
                    <div v-for="opt in (q.options || [])" :key="opt.id" class="row">
                      <label class="inline">
                        <input
                            type="radio"
                            :name="`correct_${q.id}`"
                            :checked="!!opt._is_correct"
                            @change="setSingleCorrect(q, opt)"
                        />
                        правильный
                      </label>
                      <input
                          v-model="opt._text"
                          class="inp"
                          placeholder="Текст варианта"
                          @blur="updateOption(q, opt)"
                      />
                      <button class="btn xs danger" @click="deleteOption(q, opt)">×</button>
                    </div>
                  </template>

                  <!-- MULTIPLE: checkbox -->
                  <template v-else>
                    <div v-for="opt in (q.options || [])" :key="opt.id" class="row">
                      <label class="inline">
                        <input
                            type="checkbox"
                            v-model="opt._is_correct"
                            @change="updateOption(q, opt)"
                        />
                        правильный
                      </label>
                      <input
                          v-model="opt._text"
                          class="inp"
                          placeholder="Текст варианта"
                          @blur="updateOption(q, opt)"
                      />
                      <button class="btn xs danger" @click="deleteOption(q, opt)">×</button>
                    </div>
                  </template>
                </div>
              </div>

              <!-- ↓↓↓ БЛОК «Создать вопрос» ВНИЗУ, под списком -->
              <div class="box soft">
                <div class="row">
                  <h5>Создать вопрос</h5>
                  <select v-model="quiz.newQ.type" class="inp small">
                    <option value="single">Один правильный</option>
                    <option value="multiple">Несколько правильных</option>
                    <option value="text">Свободный ответ</option>
                  </select>
                  <button class="btn xs" @click="addQuestion">+ Добавить вопрос</button>
                </div>
                <p class="muted">Совет: для single лучше иметь ≥2 варианта, из них ровно один правильный.</p>
              </div>
            </div>
            <!-- Если тест не создан — подсказка -->
            <div v-else class="muted">
              Создайте тест, чтобы добавить вопросы.
            </div>
          </div>
        </div>
      </div>

      <!--      -->
    </div>

    <!-- Сообщение об ошибке ВНУТРИ общего контейнера -->
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '../utils/api'
import draggable from 'vuedraggable'

const route = useRoute()
const id = Number(route.params.id)



const course = ref<any>(null)
const error = ref('')
const activeModuleId = ref<number|undefined>(undefined)
const newChapterTitle = ref('')
const newParagraphTitle = ref<Record<number,string>>({})

watch(activeModuleId, async (val) => {
  if (val) await loadChapters(val)
})

const chapters = ref<any[]>([])
const paragraphsByChapter = ref<Record<number, any[]>>({})

const activeModule = computed(()=> course.value?.modules?.find((m:any)=>m.id===activeModuleId.value))

const groupsPool = ref<any[]>([])
const selectedGroupIds = ref<number[]>([])
const groupSearch = ref('')
const groupsErr = ref('')
const groupsMsg = ref('')
const savingGroups = ref(false)

const editChapterId = ref<number|null>(null)
const editChapterTitle = ref('')

// Панель ресурсов
const resPanel = ref<{open:boolean, paragraph:any|null, items:any[]}>({open:false, paragraph:null, items:[]})
const resErr = ref('')
const resSaving = ref(false)
const resForm = ref<{type:string, url:string, title:string, text_content:string, duration_sec:number|null, file?:File|null}>({
  type:'video', url:'', title:'', text_content:'', duration_sec: null, file: undefined
})

// редактирование существующего ресурса
const resEdit = ref<{id:number|null, title:string, url:string, text_content:string}>({id:null, title:'', url:'', text_content:''})

const editParagraphId = ref<number|null>(null)
const editParagraphTitle = ref('')
const editParagraphDesc = ref('')

const asg = ref<any>({
  open:false, paragraph:null, item:null,
  form:{ title:'', instructions:'', due_at:'', max_points:100 },
  file:null, uploading:false, saving:false, err:'', msg:'',
  submissions: []
})

// ТЕСТ

const quiz = ref<any>({
  open:false, paragraph:null, item:null,
  form:{ title:'', instructions:'', time_limit_sec:null, max_attempts:null, shuffle:false },
  questions:[],
  newQ:{ type:'single' },
  saving:false, err:'', msg:''
})

/** Публикация — доступна только при валидных вопросах */
const canPublish = computed(() => {
  if (!quiz.value.item?.id) return false
  const qs = quiz.value.questions || []
  if (qs.length === 0) return false

  for (const q of qs) {
    if (q.type === 'text') continue
    const opts = q.options || []
    if (opts.length < 2) return false // базовая эвристика качества
    const correctCount = opts.filter((o:any)=>!!o._is_correct).length
    if (q.type === 'single' && correctCount !== 1) return false
    if (q.type === 'multiple' && correctCount < 1) return false
  }
  return true
})


async function loadCourse(){
  const { data } = await api.get(`/teacher/courses/${id}`)
  course.value = data
  if (!activeModuleId.value && data.modules?.length) activeModuleId.value = data.modules[0].id
  chapters.value = []
  paragraphsByChapter.value = {}
  if (activeModuleId.value) await loadChapters(activeModuleId.value)
}

async function createModule(){
  const { data } = await api.post(`/teacher/courses/${id}/modules`, {})
  await loadCourse()
  activeModuleId.value = data.id
}

async function createChapter(){
  if (!activeModuleId.value || !newChapterTitle.value.trim()) return
  const { data } = await api.post(`/teacher/modules/${activeModuleId.value}/chapters`, { title: newChapterTitle.value.trim() })
  // перезагрузим главы (чтобы номера/позиции были корректны)
  await loadChapters(activeModuleId.value)
  newChapterTitle.value = ''
}

async function createParagraph(ch:any){
  const title = newParagraphTitle.value[ch.id]?.trim()
  if (!title) return
  await api.post(`/teacher/chapters/${ch.id}/paragraphs`, { title })
  await loadParagraphs(ch.id)
  newParagraphTitle.value[ch.id] = ''
}


function debounce(fn: Function, ms=400) {
  let t:any; return (...a:any[]) => { clearTimeout(t); t = setTimeout(()=>fn(...a), ms) }
}
const debouncedLoadGroups = debounce(loadGroups, 400)

async function loadGroups() {
  if (!course.value?.level?.id && !course.value?.level?.number) return
  groupsErr.value = ''
  try {
    // Если course.level имеет id — лучше id, если только number — можно number->level_id заранее на бэке
    // В нашем CourseController::show мы возвращали level.id и level.number, так что используем level.id.
    const { data } = await api.get('/teacher/groups', {
      params: {
        level_id: course.value.level?.id,
        search: groupSearch.value || undefined,
      }
    })
    groupsPool.value = data
  } catch (e:any) {
    groupsErr.value = e?.data?.message || e?.message || 'Ошибка загрузки групп'
  }
}

async function saveGroups() {
  if (!course.value) return
  groupsErr.value = ''; groupsMsg.value = ''; savingGroups.value=true
  try {
    await api.post(`/teacher/courses/${course.value.id}/groups-sync`, { group_ids: selectedGroupIds.value })
    groupsMsg.value = 'Привязка сохранена'
  } catch (e:any) {
    groupsErr.value = e?.data?.message || e?.message || 'Не удалось сохранить'
  } finally {
    savingGroups.value=false
  }
}

async function loadChapters(moduleId:number){
  try {
    const { data } = await api.get(`/teacher/modules/${moduleId}/chapters`)
    chapters.value = data
    // под каждую главу можем сразу подтянуть параграфы
    for (const ch of chapters.value) {
      await loadParagraphs(ch.id)
    }
  } catch (e:any) {
    error.value = e?.data?.message || e?.message || 'Не удалось загрузить главы'
  }
}

async function loadParagraphs(chapterId:number){
  try {
    const { data } = await api.get(`/teacher/chapters/${chapterId}/paragraphs`)
    paragraphsByChapter.value[chapterId] = data
  } catch (e:any) {
    error.value = e?.data?.message || e?.message || 'Не удалось загрузить параграфы'
  }
}

function startEditChapter(ch:any){
  editChapterId.value = ch.id
  editChapterTitle.value = ch.title
}
function cancelEditChapter(){
  editChapterId.value = null
  editChapterTitle.value = ''
}
async function saveChapter(ch:any){
  if (!editChapterTitle.value.trim()) return
  await api.put(`/teacher/chapters/${ch.id}`, { title: editChapterTitle.value.trim() })
  await loadChapters(activeModuleId.value!)
  cancelEditChapter()
}
async function removeChapter(ch:any){
  if (!confirm(`Удалить главу "${ch.title}"?`)) return
  await api.delete(`/teacher/chapters/${ch.id}`)
  await loadChapters(activeModuleId.value!)
}

function startEditParagraph(p:any){
  editParagraphId.value = p.id
  editParagraphTitle.value = p.title
  editParagraphDesc.value = p.description || ''
}
function cancelEditParagraph(){
  editParagraphId.value = null
  editParagraphTitle.value = ''
  editParagraphDesc.value = ''
}
async function saveParagraph(ch:any, p:any){
  const payload:any = { title: editParagraphTitle.value.trim() }
  if (editParagraphDesc.value !== undefined) payload.description = editParagraphDesc.value
  await api.put(`/teacher/paragraphs/${p.id}`, payload)
  await loadParagraphs(ch.id)
  cancelEditParagraph()
}
async function removeParagraph(ch:any, p:any){
  if (!confirm(`Удалить параграф "${p.title}"?`)) return
  await api.delete(`/teacher/paragraphs/${p.id}`)
  await loadParagraphs(ch.id)
}

// Ресурсы

function labelResource(r:any){
  let t = r.title || '(без названия)'
  return `[${r.type}] ${t}`
}

async function openResources(ch:any, p:any){
  resPanel.value.open = true
  resPanel.value.paragraph = p
  await loadResources(p.id)
}
function closeResPanel(){
  resPanel.value.open = false
  resPanel.value.paragraph = null
  resPanel.value.items = []
  resForm.value = { type:'video', url:'', title:'', text_content:'', duration_sec:null }
  resEdit.value = { id:null, title:'', url:'', text_content:'' }
  resErr.value = ''
}
async function loadResources(paragraphId:number){
  const { data } = await api.get(`/teacher/paragraphs/${paragraphId}/resources`)
  resPanel.value.items = data
}
function onPickFile(e:any){
  const f = e.target.files?.[0]
  resForm.value.file = f || null
}

async function addResource(){
  if (!resPanel.value.paragraph) return
  resErr.value=''; resSaving.value=true
  try {
    let payload:any = { type: resForm.value.type, title: resForm.value.title || null, duration_sec: resForm.value.duration_sec || null }

    if (resForm.value.type === 'file') {
      if (!resForm.value.file) { resErr.value='Выберите файл'; resSaving.value=false; return }
      const fd = new FormData()
      fd.append('file', resForm.value.file)
      const { data: up } = await api.post('/teacher/upload/resource-file', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      payload.path = up.path
      payload.mime = up.mime
      payload.size_bytes = up.size_bytes
      payload.url = up.url // для отображения/скачивания
    } else if (resForm.value.type === 'text') {
      payload.text_content = resForm.value.text_content || ''
    } else {
      // video|link|presentation
      if (!resForm.value.url) { resErr.value='Укажите URL'; resSaving.value=false; return }
      payload.url = resForm.value.url
    }

    await api.post(`/teacher/paragraphs/${resPanel.value.paragraph.id}/resources`, payload)
    await loadResources(resPanel.value.paragraph.id)
    // очистим форму
    resForm.value = { type:'video', url:'', title:'', text_content:'', duration_sec:null }
  } catch (e:any) {
    resErr.value = e?.data?.message || e?.message || 'Не удалось добавить ресурс'
  } finally {
    resSaving.value=false
  }
}

function startEditResource(r:any){
  resEdit.value = { id: r.id, title: r.title || '', url: r.url || '', text_content: r.text_content || '' }
}
function cancelResourceEdit(){
  resEdit.value = { id:null, title:'', url:'', text_content:'' }
}
async function saveResourceEdit(r:any){
  if (!resPanel.value.paragraph || !resEdit.value.id) return
  const payload:any = { title: resEdit.value.title }
  if (r.type !== 'file') payload.url = resEdit.value.url
  if (r.type === 'text') payload.text_content = resEdit.value.text_content
  await api.put(`/teacher/resources/${resEdit.value.id}`, payload)
  await loadResources(resPanel.value.paragraph.id)
  cancelResourceEdit()
}
async function removeResource(r:any){
  if (!resPanel.value.paragraph) return
  if (!confirm('Удалить ресурс?')) return
  await api.delete(`/teacher/resources/${r.id}`)
  await loadResources(resPanel.value.paragraph.id)
}

// Методы для сохранения порядка:
async function onReorderChapters() {
  if (!activeModuleId.value) return
  const ids = chapters.value.map((c:any)=>c.id)
  await api.post(`/teacher/modules/${activeModuleId.value}/reorder`, { ids })
  // перезагрузим главы, чтобы актуализировать номера/позиции
  await loadChapters(activeModuleId.value)
}

async function onReorderParagraphs(ch:any) {
  const list = paragraphsByChapter.value[ch.id] || []
  const ids = list.map((p:any)=>p.id)
  await api.post(`/teacher/chapters/${ch.id}/reorder`, { ids })
  await loadParagraphs(ch.id)
}

async function onReorderResources() {
  if (!resPanel.value.paragraph) return
  const ids = resPanel.value.items.map((r:any)=>r.id)
  await api.post(`/teacher/paragraphs/${resPanel.value.paragraph.id}/reorder`, { ids })
  await loadResources(resPanel.value.paragraph.id)
}

// Задания
function storageUrl(path:string){ return `${import.meta.env.VITE_API_BASE_URL?.replace('/api','')}/storage/${path.replace(/^public\//,'')}` }

function closeAsg(){ asg.value.open=false }

function pickAsgFile(e:any) {
  asg.value.file = e.target.files?.[0] || null
}

async function loadSubmissions(){
  if (!asg.value.item?.id) { asg.value.err='Сперва сохраните задание'; return }
  const { data } = await api.get(`/teacher/assignments/${asg.value.item.id}/submissions`)
  // подготовим поле _score для ввода
  asg.value.submissions = data.map((s:any)=>({...s, _score: s.score ?? 0}))
}

async function gradeSubmission(s:any){
  if (!asg.value.item) return
  try{
    const { data } = await api.put(`/teacher/submissions/${s.id}/grade`, { score: s._score, status: 'returned' })
    s.score = s._score
    s.grade_5 = data.grade_5
  }catch(e:any){
    alert(e?.data?.message || e?.message)
  }
}

async function createAndPublishAssignment() {
  asg.value.err = ''; asg.value.msg = ''; asg.value.saving = true
  try {
    // 1) если выбран файл — загрузим
    let attachments_path: string | null = null
    if (asg.value.file) {
      const fd = new FormData()
      fd.append('file', asg.value.file)
      const up = await api.post('/teacher/upload/assignment-attachment', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      attachments_path = up.data?.path || null
    }

    // 2) создаём карточку
    const payload: any = {
      title: asg.value.form.title,
      instructions: asg.value.form.instructions || null,
      due_at: asg.value.form.due_at || null,
      max_points: asg.value.form.max_points || 100,
    }
    if (attachments_path) payload.attachments_path = attachments_path

    const { data: created } = await api.post(`/teacher/paragraphs/${asg.value.paragraph.id}/assignments`, payload)

    // 3) публикуем
    await api.post(`/teacher/assignments/${created.id}/publish`)

    // 4) UI-результат
    asg.value.item = { ...created, status: 'published', attachments_path }
    asg.value.msg = 'Задание создано и опубликовано'
  } catch (e:any) {
    asg.value.err = e?.data?.message || e?.message || 'Ошибка создания задания'
  } finally {
    asg.value.saving = false
  }
}

// Открытие модалки задания с подгрузкой текущего задания
async function openAssignment(ch:any, p:any) {
  asg.value = {
    open:true,
    paragraph:p,
    item:null,
    form:{ title:'', instructions:'', due_at:'', max_points:100 },
    file:null, saving:false, err:'', msg:'', submissions:[]
  }

  try {
    // Получить существующее (если есть)
    const { data } = await api.get(`/teacher/paragraphs/${p.id}/assignment`)
    if (data) {
      asg.value.item = data
      asg.value.form = {
        title: data.title || '',
        instructions: data.instructions || '',
        due_at: data.due_at ? data.due_at.slice(0,16) : '', // для input datetime-local
        max_points: data.max_points || 100,
      }
    }
  } catch (e:any) {
    // необязательно
  }
}

// Сохранить изменения (редактировать опубликованное) задание
async function saveAssignment() {
  asg.value.err = ''; asg.value.msg = ''; asg.value.saving = true
  try {
    let attachments_path: string | null = asg.value.item?.attachments_path || null
    if (asg.value.file) {
      const fd = new FormData()
      fd.append('file', asg.value.file)
      const up = await api.post('/teacher/upload/assignment-attachment', fd, {
        headers: {'Content-Type':'multipart/form-data'}
      })
      attachments_path = up.data?.path || attachments_path
    }

    const payload:any = {
      title: asg.value.form.title,
      instructions: asg.value.form.instructions || null,
      due_at: asg.value.form.due_at || null,
      max_points: asg.value.form.max_points || 100,
      attachments_path
    }

    const { data } = await api.put(`/teacher/assignments/${asg.value.item.id}`, payload)
    asg.value.item = data
    asg.value.msg = 'Изменения сохранены'
  } catch (e:any) {
    asg.value.err = e?.data?.message || e?.message || 'Ошибка сохранения'
  } finally { asg.value.saving = false }
}

// Удалить задание
async function removeAssignment() {
  if (!asg.value.item) return
  if (!confirm('Удалить это задание? Если есть отправки, оно будет скрыто (черновик).')) return
  asg.value.saving = true; asg.value.err=''; asg.value.msg=''
  try {
    const { data } = await api.delete(`/teacher/assignments/${asg.value.item.id}`)
    asg.value.msg = data?.message || 'Готово'
    // Обновим состояние: если реально удалилось — уберём из UI
    // Попробуем снова запросить задание по параграфу:
    const res = await api.get(`/teacher/paragraphs/${asg.value.paragraph.id}/assignment`)
    asg.value.item = res.data || null
    if (asg.value.item) {
      // если переведено в draft — подставим форму
      asg.value.form = {
        title: asg.value.item.title || '',
        instructions: asg.value.item.instructions || '',
        due_at: asg.value.item.due_at ? asg.value.item.due_at.slice(0,16) : '',
        max_points: asg.value.item.max_points || 100,
      }
    } else {
      // удалено — очистим форму
      asg.value.form = { title:'', instructions:'', due_at:'', max_points:100 }
    }
  } catch (e:any) {
    asg.value.err = e?.data?.message || e?.message || 'Ошибка удаления'
  } finally { asg.value.saving = false }
}

// тесты (создание, редактирование, публикация)

function closeQuiz(){ quiz.value.open=false }

/** NEW: Создать (без публикации) */

/** Создать тест (draft) */
async function createQuiz(){
  quiz.value.err=''; quiz.value.msg=''; quiz.value.saving=true
  try{
    const { data: created } = await api.post(`/teacher/paragraphs/${quiz.value.paragraph.id}/quizzes`, {
      title: quiz.value.form.title,
      instructions: quiz.value.form.instructions || null,
      time_limit_sec: quiz.value.form.time_limit_sec || null,
      max_attempts: quiz.value.form.max_attempts || null,
      shuffle: !!quiz.value.form.shuffle
    })
    const full = await api.get(`/teacher/quizzes/${created.id}`)
    applyQuiz(full.data)
    quiz.value.msg = 'Тест создан (draft). Теперь добавьте вопросы и опубликуйте.'
  }catch(e:any){
    quiz.value.err = e?.data?.message || e?.message || 'Ошибка создания теста'
  }finally{ quiz.value.saving=false }
}

async function openQuiz(ch:any, p:any){
  quiz.value = {
    open:true, paragraph:p, item:null,
    form:{ title:'', instructions:'', time_limit_sec:null, max_attempts:null, shuffle:false },
    questions:[], newQ:{ type:'single' },
    saving:false, err:'', msg:''
  }
  try{
    const { data } = await api.get(`/teacher/paragraphs/${p.id}/quiz`) // draft/published или null
    if (data) applyQuiz(data)
  } catch {}
}

function applyQuiz(q:any){
  quiz.value.item = q
  quiz.value.form = {
    title: q.title || '',
    instructions: q.instructions || '',
    time_limit_sec: q.time_limit_sec || null,
    max_attempts: q.max_attempts || null,
    shuffle: !!q.shuffle
  }
  quiz.value.questions = (q.questions || []).map((x:any)=>({
    ...x, _text:x.text, _points:x.points,
    options: (x.options || []).map((o:any)=>({ ...o, _text:o.text, _is_correct: !!o.is_correct }))
  }))
}


/** Редактирование существующего */
/** Сохранить изменения */
async function saveQuiz(){
  if (!quiz.value.item?.id) return
  quiz.value.saving=true; quiz.value.err=''; quiz.value.msg=''
  try{
    const { data } = await api.put(`/teacher/quizzes/${quiz.value.item.id}`, {
      title: quiz.value.form.title,
      instructions: quiz.value.form.instructions || null,
      time_limit_sec: quiz.value.form.time_limit_sec || null,
      max_attempts: quiz.value.form.max_attempts || null,
      shuffle: !!quiz.value.form.shuffle
    })
    applyQuiz(data)
    quiz.value.msg = 'Изменения сохранены'
  }catch(e:any){
    quiz.value.err = e?.data?.message || e?.message || 'Ошибка сохранения'
  }finally{ quiz.value.saving=false }
}


async function publishQuiz(){
  if (!quiz.value.item?.id) return
  if (!canPublish.value) {
    quiz.value.err = 'Для публикации проверьте вопросы: для single ровно один правильный; для multiple — ≥1; вариантов ≥2.'
    return
  }
  try{
    const { data } = await api.post(`/teacher/quizzes/${quiz.value.item.id}/publish`)
    quiz.value.item.status = 'published'
    quiz.value.item.max_points = data.max_points
    quiz.value.msg = 'Опубликовано'
  }catch(e:any){
    quiz.value.err = e?.data?.message || e?.message || 'Ошибка публикации'
  }
}

/** Управление вопросами и вариантами */
/** Добавить вопрос */
async function addQuestion(){
  if (!quiz.value.item?.id) { quiz.value.err='Сначала создайте тест'; return }
  const { data } = await api.post(`/teacher/quizzes/${quiz.value.item.id}/questions`, {
    type: quiz.value.newQ.type || 'single', text: 'Новый вопрос', points: 1
  })
  quiz.value.questions.push({ ...data, _text:data.text, _points:data.points, options:[] })
}

/** Обновить / удалить вопрос */
async function updateQuestion(q:any){
  await api.put(`/teacher/questions/${q.id}`, { text: q._text, points: q._points })
  q.text = q._text; q.points = q._points
}
async function deleteQuestion(q:any){
  if (!confirm('Удалить вопрос?')) return
  await api.delete(`/teacher/questions/${q.id}`)
  quiz.value.questions = quiz.value.questions.filter((x:any)=>x.id!==q.id)
}

/** Добавить вариант (с авто-first-correct для single) */
async function addOption(q:any){
  if (q.type === 'text') { quiz.value.err='Для текстового вопроса варианты не нужны'; return }
  const { data } = await api.post(`/teacher/questions/${q.id}/options`, { text:'Вариант', is_correct:false })
  q.options = q.options || []
  const newOpt = { ...data, _text:data.text, _is_correct: !!data.is_correct }
  q.options.push(newOpt)

  // UX: если это single и пока НИ ОДНОГО correct — делаем только что добавленный правильным
  if (q.type==='single' && (q.options.filter((o:any)=>o._is_correct).length === 0)) {
    await setSingleCorrect(q, newOpt)
  }
}

/** Обновить / удалить вариант */
async function updateOption(q:any, opt:any){
  await api.put(`/teacher/options/${opt.id}`, { text: opt._text, is_correct: !!opt._is_correct })
  opt.text = opt._text; opt.is_correct = !!opt._is_correct
}
async function deleteOption(q:any, opt:any){
  await api.delete(`/teacher/options/${opt.id}`)
  q.options = q.options.filter((o:any)=>o.id!==opt.id)
}

async function removeQuiz(){
  if (!quiz.value.item?.id) return
  if (!confirm('Удалить тест? При наличии попыток лучше переводить в черновик.')) return
  try{
    await api.delete(`/teacher/quizzes/${quiz.value.item.id}`)
    // сбросим состояние — теста нет
    quiz.value.item = null
    quiz.value.questions = []
    quiz.value.msg = 'Тест удалён'
  }catch(e:any){
    quiz.value.err = e?.data?.message || e?.message || 'Ошибка удаления'
  }
}

/** SINGLE: выбрать единственно правильный через radio */
async function setSingleCorrect(q:any, opt:any) {
  // локально — ровно один true
  (q.options || []).forEach((o:any) => { o._is_correct = (o.id === opt.id) })
  try {
    // сервер сам снимет у остальных is_correct (мы добавляли транзакцию в updateOption)
    await api.put(`/teacher/options/${opt.id}`, { is_correct: true, text: opt._text })
    ;(q.options || []).forEach((o:any) => { o.is_correct = !!o._is_correct })
  } catch (e:any) {
    // можно перезагрузить вопрос целиком при ошибке
  }
}

onMounted(loadCourse)
watch(()=>route.params.id, loadCourse)
</script>

<style scoped>
.wrap{display:grid;grid-template-columns:280px 1fr;gap:12px}
.side{border:1px solid #eee;border-radius:8px;padding:10px}
.main{border:1px solid #eee;border-radius:8px;padding:10px}
.list{list-style:none;padding:0;margin:8px 0}
.list li{padding:6px;border-radius:6px;cursor:pointer}
.list li.active, .list li:hover{background:#f6f8ff; color:#213547;}
.list.small li{padding:4px}
.newline{display:flex;gap:8px;margin:8px 0}
.inp{flex:1;padding:6px;border:1px solid #ddd;border-radius:6px}
.btn{padding:6px 10px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer}
.btn.primary{border-color:#0a4ea6;color:#0a4ea6}
.box{border:1px solid #f0f0f0;border-radius:8px;padding:8px;margin:8px 0}
.muted{color:#666}
.error{color:#b00020}

.groups-grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap:8px;
  margin:8px 0;
}
.grp{
  display:flex; flex-direction:column; gap:4px;
  border:1px solid #eee; border-radius:8px; padding:8px;
}
.grp .name{ font-weight:600 }
.grp .meta{ color:#666; font-size:12px }
.ok{ color:#0a7f2e; margin-top:6px }

.row{display:flex;justify-content:space-between;align-items:center}
.row-actions{display:flex;gap:6px}
.inline-edit{display:flex;gap:6px;align-items:center}
.btn.xs{padding:3px 6px;font-size:12px;}
.btn{color:#213547;}

.res-panel{
  position: fixed; inset: 0; background: rgba(0,0,0,.4);
  display:flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.res-body{
  width: min(900px, 95vw);
  max-height: 90vh; overflow:auto;
  background: darkslategray; border-radius:10px; padding:16px; position: relative;
  border:1px solid #eee;
}
.res-body h4 {color:#242424}
.res-body>button {color:#242424}
.res-body>h5 {color:#242424}

.res-body .close{
  position:absolute; right:10px; top:6px; border:none; background:transparent; font-size:22px; cursor:pointer;
}
.res-list{display:flex; flex-direction:column; gap:8px;}
.res-item{border:1px solid #f0f0f0; border-radius:8px; padding:8px; color:#242424;}
.res-head{display:flex; justify-content:space-between; align-items:center;}
.res-actions{display:flex; gap:6px;}
.add-res{display:flex; flex-direction:column; gap:8px;}

.chapter-item, .para-item { display:flex; flex-direction:column; gap:6px; }
.grab { cursor:grab; user-select:none; margin-right:8px; color:#888 }
.list > li, .list.small > li { display:flex; align-items:flex-start; gap:8px; }

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 5px;
}

.dot.green {
  background-color: #22c55e; /* зелёный */
}

.dot.red {
  background-color: #ef4444; /* красный */
}

</style>
