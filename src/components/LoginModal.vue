<template>
  <div class="auth-bg auth-fullpage">
    <div class="bubbles">
      <span v-for="n in 30" :key="n" :style="bubbleStyle(n)">
        <i :class="bubbleIcon(n)"></i>
      </span>
    </div>
    <div class="auth-container">
      <div v-if="page === 'select'">
        <h2 class="mb-4 text-center">Sign Up / Login</h2>
        <div class="d-flex flex-column gap-3 align-items-center">
           <button class="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2" @click="goTo('login', 'researcher')">
            <i class="bi bi-person-circle fs-3"></i> Case Repository
          </button>

          <button class="btn btn-outline-success w-100 d-flex align-items-center justify-content-center gap-2" @click="goTo('login', 'investigator')">
            <i class="bi bi-shield-lock fs-3"></i> Practitioner Portal
          </button>
          
          <button class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2" @click="goHome">
            <i class="bi bi-house fs-3"></i> Go Back to Home Page
          </button>
        </div>
        <div class="mt-4 text-center">
          <span>Don't have an account? <a href="#" @click.prevent="page = 'signup'">Sign up here</a></span>
        </div>
      </div>
      <div v-else-if="page === 'login'">
        <h2 class="mb-4 text-center">Login</h2>
        <form @submit.prevent="onLogin">
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input v-model="email" type="email" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input v-model="password" type="password" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Portal</label>
            <input class="form-control" :value="roleLabel(role)" disabled />
          </div>
          <div class="mb-3 text-end">
            <a href="#" class="small">Forgot password?</a>
          </div>
          <button type="submit" class="btn btn-success w-100">Login</button>
        </form>
        <div class="mt-3 text-center">
          <span>Don't have an account? <a href="#" @click.prevent="page = 'signup'">Sign up here</a></span>
        </div>
        <div class="mt-2 text-center">
          <a href="#" @click.prevent="page = 'select'">&larr; Back</a>
        </div>
      </div>
      <div v-else-if="page === 'signup'">
        <h2 class="mb-4 text-center">Sign Up</h2>
        <form @submit.prevent="onSignup">
          <div class="mb-3">
            <label class="form-label">Name</label>
            <input v-model="name" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input v-model="email" type="email" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input v-model="password" type="password" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Portal</label>
            <select v-model="role" class="form-select" required>
              <option value="researcher">Repository</option>
              <option value="investigator">Practitioner Portal</option>
            </select>
          </div>
          <button type="submit" class="btn btn-success w-100">Sign Up</button>
        </form>
        <div class="mt-3 text-center">
          <span>Already have an account? <a href="#" @click.prevent="page = 'login'">Login here</a></span>
        </div>
        <div class="mt-2 text-center">
          <a href="#" @click.prevent="page = 'select'">&larr; Back</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { API_CONFIG } from '@/config';
const router = useRouter();
const emit = defineEmits<{ close: [] }>();
const page = ref<'select'|'login'|'signup'>('select');
const email = ref('');
const password = ref('');
const name = ref('');
const role = ref<'researcher'|'investigator'>('researcher');
const loading = ref(false);
const error = ref('');
const success = ref('');

function goTo(target: 'login'|'signup', selectedRole: 'researcher'|'investigator' = 'researcher') {
  page.value = target;
  role.value = selectedRole;
  error.value = '';
  success.value = '';
  email.value = '';
  password.value = '';
  name.value = '';
}
function goHome() {
  emit('close');
}
function onLogin() {
  error.value = '';
  success.value = '';
  loading.value = true;
  fetch(API_CONFIG.endpoints.auth.login, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.value, password: password.value, role: role.value })
  })
    .then(res => res.json())
    .then(data => {
      loading.value = false;
      if (data.error) {
        error.value = data.error;
      } else {
        success.value = data.message;
  sessionStorage.setItem('dess_token', data.token);
  sessionStorage.setItem('dess_user_role', data.user.role);
  sessionStorage.setItem('user', JSON.stringify(data.user));
        setTimeout(() => {
          if (data.user.role === 'researcher') {
            router.push('/researcher');
          } else if (data.user.role === 'investigator') {
            router.push('/investigator');
          } else {
            router.push('/');
          }
        }, 1000);
      }
    })
    .catch(() => {
      loading.value = false;
      error.value = 'Network error.';
    });
}
function onSignup() {
  error.value = '';
  success.value = '';
  loading.value = true;
  fetch(API_CONFIG.endpoints.auth.signup, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.value, email: email.value, password: password.value, role: role.value })
  })
    .then(res => res.json())
    .then(data => {
      loading.value = false;
      if (data.error) {
        error.value = data.error;
      } else {
        success.value = data.message;
        // Store signup data for profile pre-population
        localStorage.setItem('signupData', JSON.stringify({
          name: name.value,
          email: email.value,
          role: role.value
        }));
        setTimeout(() => { page.value = 'login'; }, 1200);
      }
    })
    .catch(() => {
      loading.value = false;
      error.value = 'Network error.';
    });
}
function roleLabel(role: string) {
  return role === 'researcher' ? 'Repository' : 'Practitioner Portal';
}
const lawIcons = [
  'bi bi-balance-scale',
  'bi bi-gavel',
  'bi bi-shield-lock',
  'bi bi-briefcase',
  'bi bi-journal-check',
  'bi bi-person-badge',
  'bi bi-file-earmark-lock',
  'bi bi-people',
  'bi bi-award',
  'bi bi-book',
  'bi bi-shield-check',
  'bi bi-clipboard-check',
  'bi bi-lock',
  'bi bi-unlock',
  'bi bi-person-check',
  'bi bi-archive',
];
function bubbleStyle(n: number) {
  const left = Math.random() * 100;
  const size = 24 + Math.random() * 32;
  const duration = 8 + Math.random() * 8;
  return {
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${size}px`,
    animationDuration: `${duration}s`,
    color: 'rgba(0, 183, 255, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}
function bubbleIcon(n: number) {
  // Use a seeded pseudo-random to keep icons stable per render
  const idx = n % lawIcons.length;
  return lawIcons[idx];
}
</script>

<style scoped>
.auth-bg.auth-fullpage {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #494b4d 0%, #414345 100%);
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.auth-container {
  background: rgba(160, 158, 158, 0.384);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  padding: 2.5rem 2rem;
  min-width: 340px;
  max-width: 95vw;
  z-index: 2;
}
.bubbles {
  position: absolute;
  left: 0; right: 0; bottom: 0; top: 0;
  z-index: 1;
  pointer-events: none;
}
  .bubbles span {
    position: absolute;
    bottom: -40px;
    /* No background, icon only */
    border-radius: 50%;
    animation: rise 12s linear infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
  }
  .bubbles i {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
@keyframes rise {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-110vh) scale(1.2); opacity: 0.2; }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .auth-container {
    padding: 1.5rem 1.5rem;
    min-width: 90vw;
    max-width: 90vw;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .btn {
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
  }

  .form-label {
    font-size: 0.95rem;
  }

  .form-control,
  .form-select {
    font-size: 16px;
    padding: 0.75rem;
  }

  .text-center {
    font-size: 0.9rem;
  }

  .text-center a {
    text-decoration: none;
    color: #1F7D53;
  }

  .text-center a:hover {
    text-decoration: underline;
  }

  .small {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .auth-container {
    padding: 1.5rem 1rem;
    min-width: 95vw;
    max-width: 95vw;
    border-radius: 12px;
  }

  h2 {
    font-size: 1.25rem;
    margin-bottom: 1.25rem;
  }

  .d-flex.flex-column {
    gap: 0.5rem;
  }

  .btn {
    padding: 0.65rem 0.75rem;
    font-size: 0.9rem;
    width: 100% !important;
    margin-bottom: 0.5rem;
  }

  .bi {
    font-size: 1.5rem;
  }

  .form-control,
  .form-select {
    font-size: 16px;
    padding: 0.6rem 0.75rem;
  }

  .form-label {
    font-size: 0.9rem;
    margin-bottom: 0.35rem;
  }

  .mb-3 {
    margin-bottom: 1rem;
  }

  .text-end {
    text-align: center;
  }

  .text-center {
    font-size: 0.85rem;
    margin-top: 1rem;
  }

  .small {
    font-size: 0.8rem;
  }

  span:not(.badge) {
    display: block;
    margin: 0.5rem 0;
  }
}
</style>
