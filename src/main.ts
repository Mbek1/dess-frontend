
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'
import router from './router'
import API_CONFIG from './config'

const app = createApp(App)

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
