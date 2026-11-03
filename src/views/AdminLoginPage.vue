<template>
  <div class="admin-login-container">
    <div class="admin-login-card">
      <div class="login-header">
        <i class="bi bi-shield-lock" style="font-size: 2rem; color: #1f1f1f;"></i>
        <h1>Admin Portal</h1>
        <p class="mb-0 text-muted">Secure Access Required</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="mb-3">
          <label for="adminEmail" class="form-label">Email Address</label>
          <input
            v-model="email"
            type="email"
            class="form-control"
            id="adminEmail"
            placeholder="admin@system.local"
            required
          />
        </div>

        <div class="mb-3">
          <label for="adminPassword" class="form-label">Password</label>
          <input
            v-model="password"
            type="password"
            class="form-control"
            id="adminPassword"
            placeholder="Enter your password"
            required
          />
        </div>

        <div v-if="error" class="alert alert-danger" role="alert">
          <i class="bi bi-exclamation-circle"></i> {{ error }}
        </div>

        <button
          type="submit"
          class="btn btn-primary w-100"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          {{ isLoading ? 'Logging in...' : 'Login to Admin Panel' }}
        </button>

        <div class="mt-3 text-center">
          <a href="#/" class="link-secondary text-decoration-none">Back to Home</a>
        </div>
      </form>

      <div class="security-notice mt-4 p-3 bg-light rounded">
        <small class="text-muted">
          <i class="bi bi-info-circle"></i>
          This is a secure administrator interface. All access is logged and monitored for security purposes.
        </small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

async function handleLogin() {
  error.value = '';
  isLoading.value = true;

  try {
    const response = await axios.post('/api/auth/login', {
      email: email.value,
      password: password.value,
      role: 'admin'
    });

    if (response.data.token && response.data.user) {
      // Store token and user info
      sessionStorage.setItem('dess_token', response.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
      sessionStorage.setItem('dess_user_role', response.data.user.role);

      // Redirect to admin dashboard
      router.push('/admin');
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Login failed. Please try again.';
    console.error('Admin login error:', err);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.admin-login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.admin-login-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  padding: 2rem;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f1f1f;
  margin: 1rem 0 0.25rem;
}

.login-form {
  margin-bottom: 1rem;
}

.form-label {
  font-weight: 600;
  color: #1f1f1f;
  margin-bottom: 0.5rem;
}

.form-control {
  border-radius: 0.5rem;
  border: 1px solid #ddd;
  padding: 0.75rem;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.btn-primary {
  border-radius: 0.5rem;
  font-weight: 600;
  padding: 0.75rem;
  background: #667eea;
  border: none;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  border-radius: 0.5rem;
  border: none;
  margin-bottom: 1rem;
}

.security-notice {
  border-left: 3px solid #667eea;
}

.link-secondary {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.link-secondary:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .admin-login-card {
    margin: 1rem;
    padding: 1.5rem;
  }

  .login-header h1 {
    font-size: 1.5rem;
  }
}
</style>
