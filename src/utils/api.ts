import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
    timeout: 15000,
    withCredentials: false,
})

api.interceptors.request.use((config) => {
    const auth = useAuthStore()
    if (auth?.token) {
        config.headers = config.headers || {}
        config.headers['Authorization'] = `Bearer ${auth.token}`
        config.headers['Accept'] = 'application/json'
    }
    return config
})

api.interceptors.response.use(
    (r) => r,
    (error) => {
        if (error.response) return Promise.reject(error.response)
        return Promise.reject({ status: 0, data: { message: 'Network error' } })
    }
)

export default api
