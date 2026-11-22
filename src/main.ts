
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
