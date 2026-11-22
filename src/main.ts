
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'
import router from './router'
import API_CONFIG from './config'

const app = createApp(App)

function applySavedTheme() {
    try {
        const saved = JSON.parse(localStorage.getItem('dess_settings') || '{}')
        const choice = saved.theme === 'auto' ? 'system' : saved.theme
        const theme = choice === 'dark' || (choice === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
            ? 'dark'
            : 'light'
        document.documentElement.dataset.dessTheme = theme
        document.documentElement.dataset.dessThemeChoice = ['light', 'dark', 'system'].includes(choice) ? choice : 'light'
    } catch {
        document.documentElement.dataset.dessTheme = 'light'
        document.documentElement.dataset.dessThemeChoice = 'light'
    }
}

applySavedTheme()
window.addEventListener('dess-settings-updated', applySavedTheme)
window.addEventListener('storage', (event) => {
    if (event.key === 'dess_settings') applySavedTheme()
})
const systemThemeQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
systemThemeQuery?.addEventListener?.('change', () => {
    try {
        const saved = JSON.parse(localStorage.getItem('dess_settings') || '{}')
        if (saved.theme === 'system' || saved.theme === 'auto') applySavedTheme()
    } catch {
        applySavedTheme()
    }
})

// ======================================================
// CENTRAL API CONFIGURATION
// ======================================================

// All relative Axios requests will now go to Express,
// instead of the Vue frontend domain.

axios.defaults.baseURL = API_CONFIG.baseURL

// Support cookie-based authentication where required.
axios.defaults.withCredentials = true

// ======================================================
// JWT AUTHENTICATION INTERCEPTOR
// ======================================================

axios.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('dess_token')

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// ======================================================
// INITIALIZE VUE APPLICATION
// ======================================================

app.use(createPinia())
app.use(router)

app.mount('#app')


// Refresh short-lived access tokens transparently while the server-side
// session remains active. A shared promise prevents parallel 401 responses
// from rotating the same refresh token more than once.
let refreshPromise: Promise<string> | null = null;

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as any;
        const requestUrl = String(originalRequest?.url || '');

        if (
            error.response?.status !== 401 ||
            !originalRequest ||
            originalRequest._dessRetried ||
            requestUrl.includes('/api/auth/login') ||
            requestUrl.includes('/api/auth/signup') ||
            requestUrl.includes('/api/auth/refresh')
        ) {
            return Promise.reject(error)
        }

        originalRequest._dessRetried = true;

        try {
            if (!refreshPromise) {
                refreshPromise = axios.post('/api/auth/refresh', {}, { withCredentials: true })
                    .then((response) => {
                        const token = response.data?.token
                        if (!token) throw new Error('Refresh response did not include an access token')
                        sessionStorage.setItem('dess_token', token)
                        return token as string
                    })
                    .finally(() => {
                        refreshPromise = null
                    })
            }

            const newToken = await refreshPromise
            originalRequest.headers = originalRequest.headers || {}
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return axios(originalRequest)
        } catch (refreshError) {
            sessionStorage.removeItem('dess_token')
            sessionStorage.removeItem('user')
            sessionStorage.removeItem('dess_user_role')
            await router.push('/login')
            return Promise.reject(refreshError)
        }
    }
)
