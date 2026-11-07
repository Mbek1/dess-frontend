<template>
  <div v-if="isAuthenticated" class="dess-feedback">
    <button
      v-if="!isOpen"
      class="feedback-launcher"
      type="button"
      aria-label="Open feedback form"
      title="Share feedback"
      @click="openForm"
    >
      <i class="bi bi-chat-square-heart" aria-hidden="true"></i>
      <span>Feedback</span>
    </button>

    <section v-if="isOpen" class="feedback-panel" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <header class="feedback-header">
        <div>
          <h2 id="feedback-title">Share your feedback</h2>
          <p>Help us improve DESS.</p>
        </div>
        <button class="feedback-close" type="button" aria-label="Close feedback form" @click="closeForm">
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </header>

      <form class="feedback-form" @submit.prevent="submitFeedback">
        <label for="feedback-category">What is your feedback about?</label>
        <select id="feedback-category" v-model="form.category" required>
          <option value="bug">Report a problem</option>
          <option value="feature-request">Suggest a feature</option>
          <option value="usability">Ease of use</option>
          <option value="general">General feedback</option>
        </select>

        <label for="feedback-rating">How would you rate your experience? <span>(optional)</span></label>
        <select id="feedback-rating" v-model="form.rating">
          <option value="">No rating</option>
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Good</option>
          <option value="3">3 - Average</option>
          <option value="2">2 - Poor</option>
          <option value="1">1 - Very poor</option>
        </select>

        <label for="feedback-subject">Subject</label>
        <input
          id="feedback-subject"
          v-model.trim="form.subject"
          type="text"
          maxlength="150"
          placeholder="Briefly describe your feedback"
          required
        />

        <label for="feedback-message">Details</label>
        <textarea
          id="feedback-message"
          v-model.trim="form.message"
          rows="5"
          maxlength="5000"
          placeholder="Tell us what happened or what you would like to see..."
          required
        ></textarea>
        <div class="feedback-counter">{{ form.message.length }}/5000</div>

        <p v-if="errorMessage" class="feedback-error" role="alert">{{ errorMessage }}</p>
        <div v-if="successMessage" class="feedback-success" role="status">
          <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
          {{ successMessage }}
        </div>

        <button class="feedback-submit" type="submit" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="feedback-spinner" aria-hidden="true"></span>
          {{ isSubmitting ? 'Submitting...' : 'Submit feedback' }}
        </button>
        <p class="feedback-privacy">Your feedback is linked to your DESS account so the team can follow up if necessary.</p>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { API_CONFIG } from '@/config';

const route = useRoute();
const isAuthenticated = ref(false);
const isOpen = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const emptyForm = () => ({
  category: 'general',
  rating: '',
  subject: '',
  message: ''
});
const form = reactive(emptyForm());

function checkAuthentication() {
  isAuthenticated.value = Boolean(
    sessionStorage.getItem('dess_token') && sessionStorage.getItem('user')
  );
  if (!isAuthenticated.value) isOpen.value = false;
}

function openForm() {
  errorMessage.value = '';
  successMessage.value = '';
  isOpen.value = true;
}

function closeForm() {
  if (isSubmitting.value) return;
  isOpen.value = false;
}

async function submitFeedback() {
  errorMessage.value = '';
  successMessage.value = '';
  const token = sessionStorage.getItem('dess_token');
  if (!token) {
    errorMessage.value = 'Your session has expired. Please log in again.';
    checkAuthentication();
    return;
  }

  isSubmitting.value = true;
  try {
    const response = await axios.post(
      `${API_CONFIG.baseURL}/api/feedback`,
      {
        category: form.category,
        rating: form.rating === '' ? undefined : Number(form.rating),
        subject: form.subject,
        message: form.message
      },
      {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    successMessage.value = response.data.message || 'Thank you. Your feedback has been submitted.';
    Object.assign(form, emptyForm());
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.error || 'We could not submit your feedback. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
}

watch(() => route.fullPath, checkAuthentication);
window.addEventListener('storage', checkAuthentication);
checkAuthentication();
</script>

<style scoped>
.dess-feedback { position: fixed; right: 24px; bottom: 24px; z-index: 1080; font-family: inherit; }
.feedback-launcher {
  display: inline-flex; align-items: center; justify-content: center; gap: 9px;
  min-height: 50px; padding: 0 20px; border: 1px solid #2585df; border-radius: 999px;
  color: #fff; background: linear-gradient(135deg, #1676d2, #0755a5);
  box-shadow: 0 8px 24px rgba(4, 35, 75, .28); font-size: .92rem; font-weight: 650;
  cursor: pointer; transition: transform .18s ease, box-shadow .18s ease;
}
.feedback-launcher:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(4, 35, 75, .35); }
.feedback-launcher i { font-size: 1.15rem; }
.feedback-panel {
  width: min(390px, calc(100vw - 32px)); max-height: min(720px, calc(100vh - 100px));
  overflow-y: auto; border: 1px solid #d9e4f0; border-radius: 16px; background: #fff;
  color: #172b43; box-shadow: 0 18px 55px rgba(8, 30, 58, .25);
}
.feedback-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 20px 20px 16px; color: #fff; background: linear-gradient(135deg, #172b46, #0d477f);
  border-radius: 15px 15px 0 0;
}
.feedback-header h2 { margin: 0; font-size: 1.12rem; font-weight: 700; }
.feedback-header p { margin: 5px 0 0; color: #c9d9ea; font-size: .84rem; }
.feedback-close { border: 0; padding: 4px; color: #fff; background: transparent; cursor: pointer; }
.feedback-form { display: grid; gap: 8px; padding: 18px 20px 20px; }
.feedback-form label { margin-top: 5px; color: #243b55; font-size: .82rem; font-weight: 650; }
.feedback-form label span { color: #718096; font-weight: 400; }
.feedback-form input, .feedback-form select, .feedback-form textarea {
  width: 100%; padding: 10px 11px; border: 1px solid #cbd7e4; border-radius: 8px;
  color: #172b43; background: #fff; font: inherit; font-size: .88rem; outline: none;
}
.feedback-form input:focus, .feedback-form select:focus, .feedback-form textarea:focus {
  border-color: #2784d9; box-shadow: 0 0 0 3px rgba(39, 132, 217, .13);
}
.feedback-form textarea { resize: vertical; min-height: 110px; }
.feedback-counter { margin-top: -5px; color: #718096; text-align: right; font-size: .72rem; }
.feedback-submit {
  display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 8px;
  min-height: 43px; border: 0; border-radius: 8px; color: #fff; background: #1268b8;
  font-weight: 650; cursor: pointer;
}
.feedback-submit:hover:not(:disabled) { background: #0b559a; }
.feedback-submit:disabled { opacity: .65; cursor: wait; }
.feedback-error, .feedback-success { margin: 4px 0; padding: 9px 10px; border-radius: 7px; font-size: .82rem; }
.feedback-error { color: #a32626; background: #fff0f0; }
.feedback-success { display: flex; gap: 7px; color: #17663b; background: #eaf8ef; }
.feedback-privacy { margin: 3px 0 0; color: #718096; font-size: .72rem; line-height: 1.45; }
.feedback-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.45); border-top-color: #fff; border-radius: 50%; animation: feedback-spin .7s linear infinite; }
@keyframes feedback-spin { to { transform: rotate(360deg); } }
@media (max-width: 480px) {
  .dess-feedback { right: 14px; bottom: 14px; }
  .feedback-launcher { min-height: 46px; padding: 0 16px; }
  .feedback-panel { width: calc(100vw - 28px); max-height: calc(100vh - 82px); }
}
</style>
