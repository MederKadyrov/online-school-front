import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import Home from '../views/HomeView.vue'
import Login from '../views/LoginView.vue'
import RegisterStudentWizard from '../views/RegisterStudentWizard.vue'
import TeacherLessons from '../views/TeacherLessonsView.vue'
import { useAuthStore } from '../stores/auth'
import AdminSetupView from "../views/AdminSetupView.vue";
import AdminRegisterTeacher from '../views/AdminRegisterTeacherView.vue'
import StudentGrades from '../views/StudentGradesView.vue'
import ForgotPassword from '../views/ForgotPasswordView.vue'

const routes: RouteRecordRaw[] = [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    { path: '/forgot-password', component: ForgotPassword },
    { path: '/register-student', component: RegisterStudentWizard },
    {
        path: '/teacher/lessons',
        component: TeacherLessons,
        meta: {
            auth: true,
            breadcrumb: { label: 'Уроки', icon: '📚' }
        }
    },
    {
        path: '/admin/setup',
        component: AdminSetupView,
        meta: {
            auth: true,
            breadcrumb: { label: 'Настройка', icon: '⚙️' }
        }
    },
    {
        path: '/admin/register-teacher',
        component: AdminRegisterTeacher,
        meta: {
            auth: true,
            breadcrumb: { label: 'Регистрация учителя', icon: '👨‍🏫' }
        }
    },
    {
        path: '/student/courses',
        component: () => import('../views/StudentCoursesView.vue'),
        meta: {
            auth: true,
            breadcrumb: { label: 'Мои курсы', icon: '📚', path: '/student/courses' }
        }
    },
    {
        path: '/student/courses/:id',
        name: 'student-course',
        component: () => import('../views/StudentCourseView.vue'),
        meta: {
            auth: true,
            breadcrumb: [
                { label: 'Мои курсы', icon: '📚', path: '/student/courses' },
                { label: 'Курс', icon: '📖' }
            ]
        }
    },
    {
        path: '/student/grades',
        component: StudentGrades,
        meta: {
            auth: true,
            breadcrumb: { label: 'Оценки', icon: '📊' }
        }
    },
    {
        path: '/student/profile',
        component: () => import('../views/StudentProfileView.vue'),
        meta: {
            auth: true,
            breadcrumb: { label: 'Мой профиль', icon: '👤' }
        }
    },
    {
        path: '/student/paragraphs/:paragraphId',
        component: () => import('../views/StudentParagraphView.vue'),
        meta: {
            auth: true,
            breadcrumb: [
                { label: 'Мои курсы', icon: '📚', path: '/student/courses' },
                { label: 'Курс', icon: '📖' },
                { label: 'Параграф', icon: '📄' }
            ]
        }
    },
    {
        path: '/student/paragraphs/:paragraphId/quiz',
        component: () => import('../views/StudentQuizView.vue'),
        meta: {
            auth: true,
            breadcrumb: [
                { label: 'Мои курсы', icon: '📚', path: '/student/courses' },
                { label: 'Курс', icon: '📖' },
                { label: 'Параграф', icon: '📄' },
                { label: 'Тест', icon: '🧪' }
            ]
        }
    },




    // Admin - Teachers
    {
        path: '/admin/teachers',
        component: () => import('../views/AdminTeachersListView.vue'),
        meta: {
            breadcrumb: { label: 'Учителя', icon: '👨‍🏫' }
        }
    },
    {
        path: '/admin/teachers/new',
        component: () => import('../views/AdminTeacherFormView.vue'),
        meta: {
            breadcrumb: { label: 'Новый учитель', icon: '➕' }
        }
    },
    {
        path: '/admin/teachers/:id/edit',
        component: () => import('../views/AdminTeacherFormView.vue'),
        meta: {
            breadcrumb: { label: 'Редактирование', icon: '✏️' }
        }
    },

    // Admin - Groups
    {
        path: '/admin/groups',
        component: () => import('../views/AdminGroupsListView.vue'),
        meta: {
            breadcrumb: { label: 'Группы', icon: '🏫', path: '/admin/groups' }
        }
    },
    {
        path: '/admin/groups/new',
        component: () => import('../views/AdminGroupFormView.vue'),
        meta: {
            breadcrumb: [
                { label: 'Группы', icon: '🏫', path: '/admin/groups' },
                { label: 'Новая группа', icon: '➕' }
            ]
        }
    },
    {
        path: '/admin/groups/:id/edit',
        component: () => import('../views/AdminGroupFormView.vue'),
        meta: {
            breadcrumb: [
                { label: 'Группы', icon: '🏫', path: '/admin/groups' },
                { label: 'Редактирование', icon: '✏️' }
            ]
        }
    },
    {
        path: '/admin/groups/:id/courses',
        component: () => import('../views/AdminGroupCoursesView.vue'),
        meta: {
            breadcrumb: [
                { label: 'Группы', icon: '🏫', path: '/admin/groups' },
                { label: 'Курсы группы', icon: '📚' }
            ]
        }
    },
    {
        path: '/admin/groups/:id/students',
        component: () => import('../views/AdminGroupStudentsView.vue'),
        meta: {
            breadcrumb: [
                { label: 'Группы', icon: '🏫', path: '/admin/groups' },
                { label: 'Студенты', icon: '👨‍🎓' }
            ]
        }
    },

    // Admin - Other
    {
        path: '/admin/students',
        component: () => import('../views/AdminStudentsView.vue'),
        meta: {
            auth: true,
            breadcrumb: { label: 'Студенты', icon: '👨‍🎓' }
        }
    },
    {
        path: '/admin/courses',
        component: () => import('../views/AdminCoursesView.vue'),
        meta: {
            auth: true,
            breadcrumb: { label: 'Курсы учителей', icon: '📚' }
        }
    },
    {
        path: '/admin/courses/:id',
        component: () => import('../views/AdminCourseDetailView.vue'),
        meta: {
            auth: true,
            breadcrumb: [
                { label: 'Курсы учителей', icon: '📚', path: '/admin/courses' },
                { label: 'Детали курса', icon: '📖' }
            ]
        }
    },
    {
        path: '/admin/submissions',
        component: () => import('../views/AdminSubmissionsView.vue'),
        meta: {
            auth: true,
            breadcrumb: { label: 'Проверка работ', icon: '✏️' }
        }
    },
    {
        path: '/admin/journal',
        component: () => import('../views/AdminJournalView.vue'),
        meta: {
            auth: true,
            breadcrumb: { label: 'Журнал', icon: '📖' }
        }
    },
    {
        path: '/admin/user-passwords',
        component: () => import('../views/AdminUserPasswordsView.vue'),
        meta: {
            auth: true,
            breadcrumb: { label: 'Пароли', icon: '🔑' }
        }
    },

    // Admin - Subjects
    {
        path: '/admin/subjects',
        component: () => import('../views/AdminSubjectsListView.vue'),
        meta: {
            breadcrumb: { label: 'Предметы', icon: '📚' }
        }
    },
    {
        path: '/admin/subjects/new',
        component: () => import('../views/AdminSubjectFormView.vue'),
        meta: {
            breadcrumb: { label: 'Новый предмет', icon: '➕' }
        }
    },
    {
        path: '/admin/subjects/:id/edit',
        component: () => import('../views/AdminSubjectFormView.vue'),
        meta: {
            breadcrumb: { label: 'Редактирование', icon: '✏️' }
        }
    },

    // Teacher
    {
        path: '/teacher/courses',
        component: () => import('../views/TeacherCoursesView.vue'),
        meta: {
            breadcrumb: { label: 'Мои курсы', icon: '📚', path: '/teacher/courses' }
        }
    },
    {
        path: '/teacher/courses/:id/edit',
        component: () => import('../views/TeacherCourseEditView.vue'),
        meta: {
            breadcrumb: [
                { label: 'Мои курсы', icon: '📚', path: '/teacher/courses' },
                { label: 'Редактирование курса', icon: '✏️' }
            ]
        }
    },
    {
        path: '/teacher/submissions',
        component: () => import('../views/TeacherSubmissionsView.vue'),
        meta: {
            auth: true,
            breadcrumb: { label: 'Проверка работ', icon: '✏️' }
        }
    },
    {
        path: '/teacher/journal',
        component: () => import('../views/TeacherJournalView.vue'),
        meta: {
            auth: true,
            breadcrumb: { label: 'Журнал', icon: '📖' }
        }
    },
    {
        path: '/teacher/profile',
        component: () => import('../views/TeacherProfileView.vue'),
        meta: {
            auth: true,
            breadcrumb: { label: 'Мой профиль', icon: '👤' }
        }
    },

    // Student
    {
        path: '/student/journal',
        component: () => import('../views/StudentJournalView.vue'),
        meta: {
            auth: true,
            breadcrumb: { label: 'Журнал', icon: '📖' }
        }
    },
    {
        path: '/student/assignments',
        component: () => import('../views/StudentAssignmentsView.vue'),
        meta: {
            auth: true,
            breadcrumb: { label: 'Мои задания', icon: '📝' }
        }
    },

]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to, _from, next) => {
    const auth = useAuthStore()
    if (to.meta.auth && !auth.token) {
        return next('/login')
    }
    next()
})

export default router
