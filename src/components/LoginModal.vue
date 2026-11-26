<template>
  <div class="auth-bg auth-fullpage">
    <div class="auth-container">
      <div v-if="page === 'select'">
        <p class="eyebrow">DIGITAL EVIDENCE STORAGE SYSTEM</p>
        <h2>Choose your workspace</h2>
        <p class="intro">Sign in to the area that matches your account.</p>
        <button class="portal-button repository" type="button" @click="openPortal('researcher')">
          <i class="bi bi-journal-bookmark"></i><span><strong>Case Repository</strong><small>Students and researchers</small></span><i class="bi bi-arrow-right"></i>
        </button>
        <button class="portal-button dess" type="button" @click="openPortal('investigator')">
          <i class="bi bi-shield-lock"></i><span><strong>DESS Portal</strong><small>Investigators and case teams</small></span><i class="bi bi-arrow-right"></i>
        </button>
        <button class="back-button" type="button" @click="goHome">Back to home</button>
      </div>

      <div v-else>
        <p class="eyebrow">{{ role === 'researcher' ? 'CASE REPOSITORY' : 'DESS PORTAL' }}</p>
        <h2>{{ page === 'login' ? 'Welcome back' : 'Create your account' }}</h2>
        <p class="intro">{{ page === 'login' ? 'Sign in to continue to your workspace.' : 'Enter your details to get started.' }}</p>

        <form v-if="page === 'login'" @submit.prevent="onLogin">
          <label> Email address
            <input v-model.trim="email" type="email" autocomplete="username" required placeholder="you@example.com" />
          </label>
          <label> Password
            <input v-model="password" type="password" autocomplete="current-password" required placeholder="Enter your password" />
          </label>
          <button class="submit-button" type="submit" :disabled="loading">{{ loading ? 'Signing in…' : 'Sign in' }}</button>
          <p class="switch-copy">New to {{ role === 'researcher' ? 'the Case Repository' : 'DESS' }}? <a href="#" @click.prevent="switchPage('signup')">Create an account</a></p>
        </form>

        <form v-else @submit.prevent="onSignup">
          <label>Full name
            <input v-model.trim="name" type="text" autocomplete="name" required placeholder="Your full name" />
          </label>
          <label>Email address
            <input v-model.trim="email" type="email" autocomplete="email" required placeholder="you@example.com" />
          </label>
          <label>Password
            <input v-model="password" type="password" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters" />
          </label>

          <template v-if="role === 'researcher'">
            <fieldset>
              <legend>Which best describes you?</legend>
              <label class="choice"><input v-model="userType" type="radio" value="student" required /> Student</label>
              <label class="choice"><input v-model="userType" type="radio" value="researcher" required /> Researcher</label>
            </fieldset>
            <label>University / organisation
              <input v-model.trim="organizationName" type="text" required placeholder="Enter your institution or organisation" />
            </label>
            <p class="helper">This helps associate your Case Repository profile with your institution.</p>
          </template>

          <button class="submit-button" type="submit" :disabled="loading">{{ loading ? 'Creating account…' : 'Create account' }}</button>
          <p class="switch-copy">Already registered? <a href="#" @click.prevent="switchPage('login')">Sign in</a></p>
        </form>
        <button class="back-button" type="button" @click="goBack">← Change workspace</button>
      </div>
    </div>

    <div v-if="dialogOpen" class="dialog-backdrop" role="presentation" @click.self="dialogOpen = false">
      <section class="response-dialog" role="alertdialog" aria-modal="true" aria-labelledby="response-title">
        <div class="dialog-icon" :class="dialogKind"><i class="bi" :class="dialogKind === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'"></i></div>
        <h3 id="response-title">{{ dialogTitle }}</h3>
        <p>{{ dialogMessage }}</p>
        <button class="submit-button" type="button" @click="dialogOpen = false">{{ dialogKind === 'success' ? 'Continue' : 'Try again' }}</button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { API_CONFIG } from '@/config';

const props = defineProps<{ initialRole?: 'researcher' | 'investigator' }>();
const emit = defineEmits<{ close: [] }>();
const router = useRouter();
const page = ref<'select' | 'login' | 'signup'>(props.initialRole ? 'login' : 'select');
const role = ref<'researcher' | 'investigator'>(props.initialRole || 'researcher');
const email = ref('');
const password = ref('');
const name = ref('');
const userType = ref<'student' | 'researcher'>('student');
const organizationName = ref('');
const loading = ref(false);
const dialogOpen = ref(false);
const dialogKind = ref<'error' | 'success'>('error');
const dialogTitle = ref('');
const dialogMessage = ref('');

watch(() => props.initialRole, value => {
  if (value) {
    role.value = value;
    page.value = 'login';
  }
});

function showResponse(title: string, message: string, kind: 'error' | 'success' = 'error') {
  dialogTitle.value = title;
  dialogMessage.value = message;
  dialogKind.value = kind;
  dialogOpen.value = true;
}
function openPortal(selectedRole: 'researcher' | 'investigator') {
  role.value = selectedRole;
  page.value = 'login';
  clearForm();
}
function switchPage(target: 'login' | 'signup') {
  page.value = target;
  password.value = '';
  dialogOpen.value = false;
}
function clearForm() {
  email.value = '';
  password.value = '';
  name.value = '';
  organizationName.value = '';
  userType.value = 'student';
  dialogOpen.value = false;
}
function goBack() {
  if (props.initialRole) {
    router.push('/');
    return;
  }
  page.value = 'select';
  clearForm();
}
function goHome() {
  if (props.initialRole) router.push('/');
  else emit('close');
}
async function readResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error || data.message || (response.status === 401
      ? 'We could not sign you in. Check your email, password and selected workspace.'
      : 'The request could not be completed. Please try again.');
    throw new Error(message);
  }
  return data;
}
async function onLogin() {
  if (loading.value) return;
  loading.value = true;
  try {
    const response = await fetch(API_CONFIG.endpoints.auth.login, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value, role: role.value })
    });
    const data = await readResponse(response);
    sessionStorage.setItem('dess_token', data.token);
    sessionStorage.setItem('dess_user_role', data.user.role);
    sessionStorage.setItem('user', JSON.stringify(data.user));
    await router.push(data.user.role === 'researcher' ? '/researcher' : data.user.role === 'investigator' ? '/investigator' : '/admin');
  } catch (err: any) {
    showResponse('Unable to sign in', err?.message || 'A network error occurred. Please check your connection and try again.');
  } finally {
    loading.value = false;
  }
}
async function onSignup() {
  if (loading.value) return;
  loading.value = true;
  try {
    const payload: Record<string, string> = {
      name: name.value,
      email: email.value,
      password: password.value,
      role: role.value
    };
    if (role.value === 'researcher') {
      payload.userType = userType.value;
      payload.organizationName = organizationName.value;
    }
    const response = await fetch(API_CONFIG.endpoints.auth.signup, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await readResponse(response);
    showResponse('Account created', data.message || 'Your account has been created. You can now sign in.', 'success');
    page.value = 'login';
    password.value = '';
  } catch (err: any) {
    showResponse('Unable to create account', err?.message || 'A network error occurred. Please try again.');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-bg { position: fixed; z-index: 9999; inset: 0; display: grid; place-items: center; overflow-y: auto; padding: 22px; background: radial-gradient(circle at 15% 10%, #123b5c 0, transparent 35%), linear-gradient(135deg,#04152d,#071d39 65%,#092746); }
.auth-container { width: min(460px,100%); padding: clamp(22px,5vw,38px); border: 1px solid #1c4569; border-radius: 16px; color: #e8f3ff; background: rgba(5,25,49,.96); box-shadow: 0 24px 80px #0008; }
.eyebrow { margin: 0 0 9px; color: #54d6ad; font-size: 10px; font-weight: 800; letter-spacing: .16em; }
h2 { margin: 0; font-size: clamp(24px,5vw,30px); font-weight: 750; }
.intro { margin: 9px 0 24px; color: #9db9d8; font-size: 13px; }
.portal-button { display: flex; width: 100%; align-items: center; gap: 13px; margin: 12px 0; padding: 16px; border: 1px solid #28577c; border-radius: 10px; color: #eaf5ff; text-align: left; background: #0a2948; cursor: pointer; }
.portal-button > i:first-child { font-size: 23px; color: #6ed5b3; }.portal-button span { display: grid; flex: 1; gap: 4px; }.portal-button strong { font-size: 14px; }.portal-button small { color: #9db9d8; font-size: 11px; }.portal-button:hover { border-color: #48bda1; background: #0d3457; }
form { display: grid; gap: 15px; }form > label { display: grid; gap: 7px; color: #c9dced; font-size: 12px; font-weight: 650; }
input:not([type=radio]) { width: 100%; min-height: 43px; padding: 10px 12px; border: 1px solid #315777; border-radius: 7px; outline: none; color: #f3f8ff; background: #071b32; font: inherit; font-size: 14px; }input:focus { border-color: #45bda0; box-shadow: 0 0 0 3px #45bda022; }
fieldset { display: flex; flex-wrap: wrap; gap: 12px 20px; padding: 12px; border: 1px solid #315777; border-radius: 8px; }legend { padding: 0 5px; color: #c9dced; font-size: 12px; font-weight: 700; }.choice { display: inline-flex; align-items: center; gap: 7px; color: #dceafa; font-size: 13px; }.choice input { accent-color: #28b98e; }
.helper { margin: -7px 0 0; color: #8faac4; font-size: 11px; }
.submit-button { width: 100%; min-height: 44px; border: 0; border-radius: 7px; color: #03251f; background: #49d2a8; font-size: 13px; font-weight: 800; cursor: pointer; }.submit-button:disabled { opacity: .6; cursor: wait; }
.switch-copy { margin: 2px 0 0; color: #9db9d8; text-align: center; font-size: 12px; }.switch-copy a { color: #69d9b8; font-weight: 700; }.back-button { display: block; margin: 16px auto 0; padding: 7px 10px; border: 0; color: #9db9d8; background: transparent; cursor: pointer; font-size: 12px; }
.dialog-backdrop { position: fixed; z-index: 10000; inset: 0; display: grid; place-items: center; padding: 18px; background: #020b16bb; }.response-dialog { width: min(390px,100%); padding: 27px; border: 1px solid #315777; border-radius: 14px; color: #e8f3ff; text-align: center; background: #071d36; box-shadow: 0 20px 70px #0009; }.dialog-icon { display: grid; width: 48px; height: 48px; place-items: center; margin: 0 auto 13px; border-radius: 50%; font-size: 21px; }.dialog-icon.error { color: #ffb5ad; background: #692e37; }.dialog-icon.success { color: #8be8c9; background: #145443; }.response-dialog h3 { margin: 0 0 8px; font-size: 19px; }.response-dialog p { margin: 0 0 20px; color: #a9bfd5; font-size: 13px; line-height: 1.6; }
@media(max-width:480px) { .auth-bg { padding: 12px; align-items: center; }.auth-container { padding: 22px 18px; border-radius: 12px; }.portal-button { padding: 13px; } }
</style>
