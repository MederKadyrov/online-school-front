import { defineStore } from 'pinia'
import api from '../utils/api'

type User = { id: number; name: string; email: string | null }

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || '',
        user: null as User | null,
    }),
    actions: {
        async login(email: string, password: string) {
            const { data } = await api.post('/auth/login', { email, password })
            this.token = data.token
            localStorage.setItem('token', this.token)
            this.user = data.user
        },
        async fetchMe() {
            if (!this.token) return
            const { data } = await api.get('/auth/me')
            this.user = data
        },
        logout() {
            this.token = ''
            this.user = null
            localStorage.removeItem('token')
        },
    },
})
