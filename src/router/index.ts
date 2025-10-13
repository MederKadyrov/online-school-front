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

const routes: RouteRecordRaw[] = [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    { path: '/register-student', component: RegisterStudentWizard, meta: { auth: true } },
    { path: '/teacher/lessons', component: TeacherLessons, meta: { auth: true } },
    { path: '/admin/setup', component: AdminSetupView, meta: { auth: true } },
    { path: '/admin/register-teacher', component: AdminRegisterTeacher, meta: { auth: true } },
    { path: '/student/courses', component: () => import('../views/StudentCoursesView.vue'), meta: { auth: true } },
    { path: '/student/courses/:id', name: 'student-course', component: () => import('../views/StudentCourseView.vue'), meta: { auth: true } },
    { path: '/student/grades', component: StudentGrades, meta: { auth: true } },
    { path: '/student/paragraphs/:paragraphId', component: () => import('../views/StudentParagraphView.vue'), meta: { auth: true } },
    { path: '/student/paragraphs/:paragraphId/quiz', component: () => import('../views/StudentQuizView.vue'), meta: { auth: true } },




    {
        path: '/admin/teachers',
        component: () => import('../views/AdminTeachersListView.vue'),
    },
    {
        path: '/admin/teachers/new',
        component: () => import('../views/AdminTeacherFormView.vue'),
    },
    {
        path: '/admin/teachers/:id/edit',
        component: () => import('../views/AdminTeacherFormView.vue'),
    },
    {
        path: '/admin/groups',
        component: () => import('../views/AdminGroupsListView.vue'),
    },
    {
        path: '/admin/groups/new',
        component: () => import('../views/AdminGroupFormView.vue'),
    },
    {
        path: '/admin/groups/:id/edit',
        component: () => import('../views/AdminGroupFormView.vue'),
    },
    { path: '/admin/groups/:id/courses', component: () => import('../views/AdminGroupCoursesView.vue') },
    { path: '/admin/groups/:id/students', component: () => import('../views/AdminGroupStudentsView.vue') },
    { path: '/admin/submissions', component: () => import('../views/AdminSubmissionsView.vue'), meta: { auth: true } },
    { path: '/admin/journal', component: () => import('../views/AdminJournalView.vue'), meta: { auth: true } },

    {
        path: '/admin/subjects',
        component: () => import('../views/AdminSubjectsListView.vue'),
    },
    {
        path: '/admin/subjects/new',
        component: () => import('../views/AdminSubjectFormView.vue'),
    },
    {
        path: '/admin/subjects/:id/edit',
        component: () => import('../views/AdminSubjectFormView.vue'),
    },

    { path: '/teacher/courses', component: () => import('../views/TeacherCoursesView.vue') },
    { path: '/teacher/courses/:id/edit', component: () => import('../views/TeacherCourseEditView.vue') },
    { path: '/teacher/submissions', component: () => import('../views/TeacherSubmissionsView.vue'), meta: { auth: true } },
    { path: '/teacher/journal', component: () => import('../views/TeacherJournalView.vue'), meta: { auth: true } },

    { path: '/student/journal', component: () => import('../views/StudentJournalView.vue'), meta: { auth: true } },

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
