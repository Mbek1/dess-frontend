import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// Add axios interceptor to include JWT token in all requests
axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('dess_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

app.use(createPinia())
app.use(router)

app.mount('#app')
