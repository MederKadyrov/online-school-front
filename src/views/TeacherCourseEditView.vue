<template>
  <div class="course-editor">
    <div class="container" v-if="course">
      <!-- Course Header -->
      <div class="course-header">
        <div class="course-info">
          <h2>{{ course.title }}</h2>
          <p class="course-meta">
            <span class="badge">{{ course.subject?.name }}</span>
            <span class="badge">{{ course.level?.number }} класс</span>
          </p>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="editor-layout">
        <!-- Sidebar: Modules -->
        <aside class="modules-sidebar">
          <div class="sidebar-header">
            <h3>Модули</h3>
            <button class="btn-icon" @click="createModule" title="Добавить модуль">
              <span>➕</span>
            </button>
          </div>
          <ul class="modules-list">
            <li
              v-for="m in course.modules"
              :key="m.id"
              :class="{ active: m.id === activeModuleId }"
              @click="activeModuleId = m.id"
              class="module-item"
            >
              <span class="module-number">{{ m.number }}</span>
              <span class="module-title">{{ m.title }}</span>
            </li>
          </ul>
        </aside>

        <!-- Main Content: Chapters & Paragraphs -->
        <main class="content-area">
          <div v-if="activeModule" class="module-content">
            <div class="module-header">
              <h3>{{ activeModule.number }}. {{ activeModule.title }}</h3>
            </div>

            <!-- Add Chapter -->
            <div class="add-section">
              <input
                v-model="newChapterTitle"
                class="form-input"
                placeholder="Название новой главы..."
                @keyup.enter="createChapter"
              >
              <button class="btn-primary" @click="createChapter">Добавить главу</button>
            </div>

            <!-- Chapters List -->
            <div class="chapters-list">
              <draggable
                v-model="chapters"
                item-key="id"
                handle=".drag-handle"
                @end="onReorderChapters"
              >
                <template #item="{ element: ch }">
                  <div class="chapter-card">
                    <!-- Chapter Header -->
                    <div class="chapter-header">
                      <span class="drag-handle">⋮⋮</span>
                      <div class="chapter-title-area">
                        <h4 v-if="editChapterId !== ch.id">
                          Глава {{ ch.number }}. {{ ch.title }}
                        </h4>
                        <div v-else class="edit-form">
                          <input v-model="editChapterTitle" class="form-input" />
                          <button class="btn-sm btn-primary" @click="saveChapter(ch)">Сохранить</button>
                          <button class="btn-sm" @click="cancelEditChapter">Отмена</button>
                        </div>
                      </div>
                      <div class="chapter-actions">
                        <button class="btn-icon-sm" @click="startEditChapter(ch)" title="Редактировать">✏️</button>
                        <button class="btn-icon-sm btn-danger" @click="removeChapter(ch)" title="Удалить">🗑</button>
                      </div>
                    </div>

                    <!-- Add Paragraph -->
                    <div class="add-paragraph">
                      <input
                        v-model="newParagraphTitle[ch.id]"
                        class="form-input-sm"
                        placeholder="Новый параграф..."
                        @keyup.enter="createParagraph(ch)"
                      >
                      <button class="btn-sm btn-secondary" @click="createParagraph(ch)">+ Параграф</button>
                    </div>

                    <!-- Paragraphs List -->
                    <draggable
                      v-model="paragraphsByChapter[ch.id]"
                      item-key="id"
                      handle=".para-drag"
                      :group="{ name: 'paras-'+ch.id, pull: false, put: false }"
                      :disabled="!(paragraphsByChapter[ch.id] && paragraphsByChapter[ch.id].length)"
                      @end="() => onReorderParagraphs(ch)"
                      class="paragraphs-list"
                    >
                      <template #item="{ element: p }">
                        <div class="paragraph-item">
                          <span class="para-drag">⋮⋮</span>

                          <div class="paragraph-content">
                            <template v-if="editParagraphId !== p.id">
                              <div class="paragraph-info">
                                <span class="paragraph-title">
                                  {{ ch.position }}.{{ p.position }} — {{ p.title }}
                                </span>
                                <span v-if="p.description" class="paragraph-desc">{{ p.description }}</span>
                              </div>

                              <div class="paragraph-actions">
                                <button class="action-btn" @click="startEditParagraph(p)" title="Редактировать">
                                  ✏️
                                </button>
                                <button class="action-btn" @click="openResources(ch, p)" title="Ресурсы">
                                  📎
                                  <span :class="['status-dot', p.resources_count > 0 ? 'green' : 'red']"></span>
                                </button>
                                <button class="action-btn" @click="openAssignment(ch, p)" title="Задание">
                                  📝
                                  <span :class="['status-dot', p.assignment_status === 'published' ? 'green' : 'red']"></span>
                                </button>
                                <button class="action-btn" @click="openQuiz(ch, p)" title="Тест">
                                  🧪
                                  <span :class="['status-dot', p.quiz_status === 'published' ? 'green' : p.has_quiz ? 'yellow' : 'red']"></span>
                                </button>
                                <button class="action-btn btn-danger" @click="removeParagraph(ch, p)" title="Удалить">
                                  🗑
                                </button>
                              </div>
                            </template>

                            <template v-else>
                              <div class="edit-paragraph">
                                <input v-model="editParagraphTitle" class="form-input-sm" placeholder="Название" />
                                <input v-model="editParagraphDesc" class="form-input-sm" placeholder="Описание (необязательно)" />
                                <button class="btn-sm btn-primary" @click="saveParagraph(ch, p)">Сохранить</button>
                                <button class="btn-sm" @click="cancelEditParagraph">Отмена</button>
                              </div>
                            </template>
                          </div>
                        </div>
                      </template>
                    </draggable>
                  </div>
                </template>
              </draggable>
            </div>
          </div>

          <div v-else class="empty-state">
            <p>Выберите модуль для редактирования</p>
          </div>
        </main>
      </div>
    </div>

    <!-- Панель ресурсов (Modal) -->
    <div v-if="resPanel.open" class="modal-overlay" @click="closeResPanel">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>📎 Ресурсы: {{ resPanel.paragraph?.title }}</h3>
          <button class="btn-close" @click="closeResPanel">×</button>
        </div>

        <div class="modal-body">
          <draggable
            v-model="resPanel.items"
            item-key="id"
            handle=".drag-handle"
            @end="onReorderResources"
            class="resources-list"
          >
            <template #item="{ element: r }">
              <div class="resource-item">
                <span class="drag-handle">⋮⋮</span>
                <div class="resource-content">
                  <strong class="resource-label">{{ labelResource(r) }}</strong>
                  <div class="resource-meta">
                    <span v-if="r.url">🔗 <a :href="r.url" target="_blank">{{ r.url }}</a></span>
                    <span v-if="r.path">📁 {{ r.path }}</span>
                    <span v-if="r.duration_sec">⏱️ {{ r.duration_sec }} сек</span>
                  </div>

                  <div v-if="resEdit.id === r.id" class="edit-section">
                    <input v-model="resEdit.title" class="form-input-sm" placeholder="Название" />
                    <input v-if="r.type !== 'file'" v-model="resEdit.url" class="form-input-sm" placeholder="URL" />
                    <textarea v-if="r.type === 'text'" v-model="resEdit.text_content" class="form-textarea" placeholder="Текст"></textarea>
                    <div class="button-group">
                      <button class="btn-sm btn-primary" @click="saveResourceEdit(r)">Сохранить</button>
                      <button class="btn-sm" @click="cancelResourceEdit">Отмена</button>
                    </div>
                  </div>
                </div>
                <div class="resource-actions">
                  <button class="btn-icon-sm" @click="startEditResource(r)">✏️</button>
                  <button class="btn-icon-sm btn-danger" @click="removeResource(r)">🗑</button>
                </div>
              </div>
            </template>
          </draggable>

          <div class="divider"></div>

          <h4>Добавить ресурс</h4>
          <div class="add-resource-form">
            <select v-model="resForm.type" class="form-select">
              <option value="video">📹 Видео</option>
              <option value="link">🔗 Ссылка</option>
              <option value="file">📁 Файл</option>
              <option value="presentation">📊 Презентация</option>
              <option value="text">📄 Текст</option>
            </select>

            <input
              v-if="resForm.type !== 'file' && resForm.type !== 'text'"
              v-model="resForm.url"
              class="form-input"
              placeholder="URL (YouTube, документ и т.п.)"
            />

            <textarea
              v-if="resForm.type === 'text'"
              v-model="resForm.text_content"
              class="form-textarea"
              placeholder="Текст контента"
              rows="4"
            ></textarea>

            <input v-if="resForm.type === 'file'" type="file" @change="onPickFile" class="form-file" />

            <input v-model="resForm.title" class="form-input" placeholder="Название ресурса (необязательно)" />
            <input
              v-model.number="resForm.duration_sec"
              class="form-input"
              type="number"
              min="0"
              placeholder="Длительность в секундах (опционально)"
            />

            <button class="btn-primary" @click="addResource" :disabled="resSaving">
              {{ resSaving ? 'Добавление...' : 'Добавить ресурс' }}
            </button>
            <p v-if="resErr" class="error-message">{{ resErr }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Панель задания (Modal) -->
    <div v-if="asg.open" class="modal-overlay" @click="closeAsg">
      <div class="modal-content modal-large" @click.stop>
        <div class="modal-header">
          <h3>📝 Задание: {{ asg.item?.title || 'Новое' }}</h3>
          <button class="btn-close" @click="closeAsg">×</button>
        </div>
        <div class="modal-body">

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
              <input v-model="quiz.form.title" class="inp" placeholder="Контрольная по теме «Кинематика»" @blur="autoSaveQuizBasics" />

              <label>Инструкции</label>
              <textarea v-model="quiz.form.instructions" class="inp" rows="5" placeholder="Опишите правила: время, критерии..." @blur="autoSaveQuizBasics"></textarea>

              <div class="row">
                <div>
                  <label>Лимит времени (сек)</label>
                  <input v-model.number="quiz.form.time_limit_sec" type="number" min="30" class="inp small" @blur="autoSaveQuizBasics" />
                </div>
                <div>
                  <label>Макс. попыток</label>
                  <input v-model.number="quiz.form.max_attempts" type="number" min="1" class="inp small" @blur="autoSaveQuizBasics" />
                </div>
              </div>

              <label class="inline">
                <input type="checkbox" v-model="quiz.form.shuffle" @change="autoSaveQuizBasics" /> Перемешивать вопросы/варианты
              </label>

              <p v-if="quiz.autoSaved" class="auto-saved">✓ Сохранено</p>


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
                      v-if="quiz.item.status === 'published'"
                      class="btn published"
                      disabled
                  >
                    Опубликовано ✓
                  </button>
                  <button
                      v-else
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
  saving:false, err:'', msg:'', autoSaved:false
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
  // Мгновенно обновим индикатор количества ресурсов в списке параграфов
  if (resPanel.value.paragraph && resPanel.value.paragraph.id === paragraphId) {
    resPanel.value.paragraph.resources_count = Array.isArray(data) ? data.length : 0
  }
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
    // Обновим индикатор у параграфа
    if (asg.value.paragraph) {
      asg.value.paragraph.has_assignment = true
      asg.value.paragraph.assignment_status = 'published'
    }
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
      // индикатор: зелёный только если опубликовано
      if (asg.value.paragraph) {
        asg.value.paragraph.has_assignment = asg.value.item.status === 'published'
        asg.value.paragraph.assignment_status = asg.value.item.status || null
      }
    } else {
      // удалено — очистим форму
      asg.value.form = { title:'', instructions:'', due_at:'', max_points:100 }
      if (asg.value.paragraph) {
        asg.value.paragraph.has_assignment = false
        asg.value.paragraph.assignment_status = null
      }
    }
  } catch (e:any) {
    asg.value.err = e?.data?.message || e?.message || 'Ошибка удаления'
  } finally { asg.value.saving = false }
}

// тесты (создание, редактирование, публикация)

function closeQuiz(){
  quiz.value.open=false
  quiz.value.autoSaved=false
}

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
    // обновим индикаторы у параграфа: тест создан как draft
    if (quiz.value.paragraph) {
      quiz.value.paragraph.has_quiz = true
      quiz.value.paragraph.quiz_status = 'draft'
    }
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
    saving:false, err:'', msg:'', autoSaved:false
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
/** Автосохранение базовых полей */
async function autoSaveQuizBasics(){
  if (!quiz.value.item?.id) return
  if (!quiz.value.form.title?.trim()) return

  try {
    const { data } = await api.put(`/teacher/quizzes/${quiz.value.item.id}`, {
      title: quiz.value.form.title,
      instructions: quiz.value.form.instructions || null,
      time_limit_sec: quiz.value.form.time_limit_sec || null,
      max_attempts: quiz.value.form.max_attempts || null,
      shuffle: !!quiz.value.form.shuffle
    })

    quiz.value.item = {
      ...quiz.value.item,
      title: data.title,
      instructions: data.instructions,
      time_limit_sec: data.time_limit_sec,
      max_attempts: data.max_attempts,
      shuffle: data.shuffle
    }

    // Показываем индикатор сохранения
    quiz.value.autoSaved = true
    setTimeout(() => { quiz.value.autoSaved = false }, 2000)

  } catch(e: any) {
    // Тихо игнорируем ошибки автосохранения
    console.error('Ошибка автосохранения:', e)
  }
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
    // обновим индикаторы у параграфа
    if (quiz.value.paragraph) {
      quiz.value.paragraph.has_quiz = true
      quiz.value.paragraph.quiz_status = 'published'
    }
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
    // обновим индикаторы у параграфа
    if (quiz.value.paragraph) {
      quiz.value.paragraph.has_quiz = false
      quiz.value.paragraph.quiz_status = null
    }
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
/* ============================================
   Container & Layout
   ============================================ */
.course-editor {
  min-height: 100vh;
  background: #fafafa;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

/* Course Header */
.course-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.course-info h2 {
  font-size: 28px;
  font-weight: 700;
  color: #212121;
  margin: 0 0 12px 0;
}

.course-meta {
  display: flex;
  gap: 12px;
  margin: 0;
}

.badge {
  padding: 6px 12px;
  background: #f0f7ff;
  color: #2196f3;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
}

/* Editor Layout */
.editor-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
}

/* ============================================
   Modules Sidebar
   ============================================ */
.modules-sidebar {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  height: fit-content;
  position: sticky;
  top: 88px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.sidebar-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #212121;
  margin: 0;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: #2196f3;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #1976d2;
  transform: scale(1.05);
}

.modules-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.module-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid transparent;
}

.module-item:hover {
  background: #f5f5f5;
}

.module-item.active {
  background: linear-gradient(90deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%);
  border-color: #2196f3;
  font-weight: 600;
}

.module-number {
  min-width: 28px;
  height: 28px;
  background: #e3f2fd;
  color: #2196f3;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.module-item.active .module-number {
  background: #2196f3;
  color: white;
}

.module-title {
  flex: 1;
  font-size: 14px;
  color: #424242;
}

.module-item.active .module-title {
  color: #2196f3;
}

/* ============================================
   Content Area
   ============================================ */
.content-area {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-height: 500px;
}

.module-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.module-header h3 {
  font-size: 22px;
  font-weight: 700;
  color: #212121;
  margin: 0 0 20px 0;
}

.add-section {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.form-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: white;
  color: #212121;
}

.form-input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.btn-primary {
  padding: 12px 24px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-primary:hover {
  background: #1976d2;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* ============================================
   Chapters
   ============================================ */
.chapters-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chapter-card {
  border: 1px solid #dee2e6;
  border-radius: 12px;
  padding: 20px;
  background: #fafafa;
  transition: all 0.2s;
}

.chapter-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chapter-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e9ecef;
}

.drag-handle {
  cursor: grab;
  user-select: none;
  color: #9e9e9e;
  font-size: 18px;
  padding: 4px;
}

.drag-handle:active {
  cursor: grabbing;
}

.chapter-title-area {
  flex: 1;
}

.chapter-title-area h4 {
  font-size: 18px;
  font-weight: 600;
  color: #212121;
  margin: 0;
}

.edit-form {
  display: flex;
  gap: 8px;
  align-items: center;
}

.chapter-actions {
  display: flex;
  gap: 8px;
}

.btn-icon-sm {
  width: 32px;
  height: 32px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-icon-sm:hover {
  background: #f5f5f5;
  border-color: #bdbdbd;
}

.btn-icon-sm.btn-danger:hover {
  background: #ffebee;
  border-color: #ef5350;
  color: #d32f2f;
}

.btn-sm {
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm.btn-primary {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.btn-sm.btn-primary:hover {
  background: #1976d2;
}

.btn-sm.btn-secondary {
  background: #757575;
  color: white;
  border-color: #757575;
}

.btn-sm.btn-secondary:hover {
  background: #616161;
}

/* ============================================
   Paragraphs
   ============================================ */
.add-paragraph {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.form-input-sm {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s;
  background: white;
  color: #212121;
}

.form-input-sm:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.paragraphs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.paragraph-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s;
}

.paragraph-item:hover {
  border-color: #bdbdbd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.para-drag {
  cursor: grab;
  user-select: none;
  color: #bdbdbd;
  font-size: 16px;
  padding-top: 2px;
}

.para-drag:active {
  cursor: grabbing;
}

.paragraph-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.paragraph-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.paragraph-title {
  font-size: 14px;
  font-weight: 600;
  color: #212121;
}

.paragraph-desc {
  font-size: 13px;
  color: #757575;
}

.paragraph-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.action-btn:hover {
  background: #f5f5f5;
  border-color: #bdbdbd;
}

.action-btn.btn-danger:hover {
  background: #ffebee;
  border-color: #ef5350;
  color: #d32f2f;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 2px;
}

.status-dot.green {
  background: #4caf50;
}

.status-dot.red {
  background: #f44336;
}

.status-dot.yellow {
  background: #ff9800;
}

.edit-paragraph {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

/* ============================================
   Empty State
   ============================================ */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9e9e9e;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

/* ============================================
   Modals
   ============================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  width: min(800px, 95vw);
  max-height: 90vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-large {
  width: min(1100px, 95vw);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #212121;
  margin: 0;
}

.btn-close {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  font-size: 28px;
  color: #757575;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.btn-close:hover {
  background: #e0e0e0;
  color: #212121;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

/* Resources */
.resources-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.resource-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.resource-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-label {
  font-size: 14px;
  font-weight: 600;
  color: #212121;
}

.resource-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #757575;
}

.resource-meta a {
  color: #2196f3;
  text-decoration: none;
}

.resource-meta a:hover {
  text-decoration: underline;
}

.resource-actions {
  display: flex;
  gap: 8px;
}

.edit-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
  margin-top: 12px;
}

.button-group {
  display: flex;
  gap: 8px;
}

.divider {
  height: 1px;
  background: #e0e0e0;
  margin: 24px 0;
}

.add-resource-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-select {
  padding: 12px 16px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: #f8f9fa;
  color: #212121;
  cursor: pointer;
}

.form-textarea {
  padding: 12px 16px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: #f8f9fa;
  color: #212121;
  resize: vertical;
}

.form-file {
  padding: 8px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: #f8f9fa;
}

.error-message {
  color: #d32f2f;
  background: #ffebee;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 0;
  border-left: 4px solid #d32f2f;
  font-size: 14px;
}

/* Grid layouts for assignment/quiz modals */
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.box {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
  margin: 12px 0;
}

.box.soft {
  background: #f8f9fa;
  border-style: dashed;
}

.muted {
  color: #757575;
  font-size: 14px;
}

.error {
  color: #d32f2f;
  font-size: 14px;
}

.ok {
  color: #2e7d32;
  font-size: 14px;
}

.auto-saved {
  color: #2e7d32;
  font-size: 14px;
  margin-top: 8px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Legacy styles for existing modal content */
label {
  font-weight: 600;
  margin-bottom: 6px;
  display: block;
  color: #424242;
  font-size: 14px;
}

.inp {
  padding: 10px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  background: #f8f9fa;
  color: #212121;
  width: 100%;
}

.inp.small {
  max-width: 200px;
}

.inp.tiny {
  max-width: 80px;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #424242;
  transition: all 0.2s;
}

.btn.primary {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.btn.danger {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.btn.published {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
  cursor: not-allowed;
}

.btn.xs {
  padding: 4px 8px;
  font-size: 12px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
}

.actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.tbl th,
.tbl td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.tbl th {
  background: #f5f5f5;
  font-weight: 600;
}

.hint {
  font-size: 13px;
  color: #757575;
  font-style: italic;
}

label.inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: normal;
  margin: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }

  .modules-sidebar {
    position: static;
  }

  .grid2 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 16px;
  }

  .course-header {
    padding: 16px;
  }

  .content-area {
    padding: 16px;
  }

  .modal-body {
    padding: 16px;
  }

  .add-section {
    flex-direction: column;
  }

  .paragraph-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .action-btn {
    justify-content: center;
  }
}
</style>
