
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// ======================================================
// AXIOS CONFIGURATION
// ======================================================

// Allow cookies to accompany cross-origin API requests.
axios.defaults.withCredentials = true;

// ======================================================
// JWT AUTHENTICATION INTERCEPTOR
// ======================================================

axios.interceptors.request.use(
    (config) => {

        const token = sessionStorage.getItem('dess_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;

    },
    (error) => {
        return Promise.reject(error);
    }
);

// ======================================================
// VUE APPLICATION INITIALIZATION
// ======================================================

app.use(createPinia());

app.use(router);

app.mount('#app');
