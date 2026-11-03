<template>
  <main class="profile-page">
    <div v-if="loading" class="profile-loading" role="status">
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <span>Loading your profile...</span>
    </div>

    <div v-else class="profile-layout">
      <div class="profile-main-column">
        <section class="profile-banner">
          <div class="avatar-wrap">
            <img :src="profilePicture" :alt="`${name || 'User'} profile picture`" class="profile-avatar" @error="useFallbackAvatar" />
            <label class="avatar-edit" for="avatar-input" title="Update profile photo">
              <i class="bi bi-camera-fill" aria-hidden="true"></i>
              <span class="visually-hidden">Update profile photo</span>
            </label>
            <input id="avatar-input" class="visually-hidden" type="file" accept="image/*" @change="uploadAvatar" />
          </div>
          <div class="profile-identity">
            <h1>{{ name || 'Your Profile' }}</h1>
            <p class="profile-role">{{ roleLabel }}</p>
            <div class="identity-badges">
              <span class="status-pill" :class="emailVerified ? 'status-success' : 'status-pending'">
                <i class="bi" :class="emailVerified ? 'bi-envelope-check-fill' : 'bi-envelope-exclamation-fill'" aria-hidden="true"></i>
                Email {{ emailVerified ? 'Verified' : 'Unverified' }}
              </span>
              <span class="status-pill" :class="identityClass">
                <i class="bi bi-shield-check" aria-hidden="true"></i>
                Identity {{ identityLabel }}
              </span>
            </div>
            <p class="account-reference">Account ID: {{ accountReference }}</p>
          </div>
          <button class="outline-action photo-action" type="button" @click="triggerAvatarInput">
            <i class="bi bi-camera" aria-hidden="true"></i> Update Photo
          </button>
        </section>

        <section class="profile-panel personal-panel">
          <div class="panel-heading">
            <div class="heading-mark"><i class="bi bi-person-vcard-fill" aria-hidden="true"></i></div>
            <div>
              <h2>Personal Information</h2>
              <p>Your basic details and contact information.</p>
            </div>
            <button class="outline-action edit-action" type="button" @click="focusField('name-input')">
              <i class="bi bi-pencil" aria-hidden="true"></i> Edit Information
            </button>
          </div>

          <form class="profile-form" @submit.prevent="saveProfile">
            <div class="field-grid">
              <label class="profile-field" for="name-input">
                <span>Full Name</span>
                <input id="name-input" v-model.trim="name" autocomplete="name" required />
              </label>
              <label class="profile-field" for="email-input">
                <span>Email Address</span>
                <span class="input-with-status">
                  <input id="email-input" v-model.trim="email" autocomplete="email" type="email" required />
                  <span class="field-status" :class="emailVerified ? 'status-success' : 'status-muted'">
                    <i class="bi" :class="emailVerified ? 'bi-check-circle-fill' : 'bi-clock-fill'" aria-hidden="true"></i>
                    {{ emailVerified ? 'Verified' : 'Unverified' }}
                  </span>
                </span>
              </label>
              <label class="profile-field" for="organization-input">
                <span>Organization Name</span>
                <input id="organization-input" v-model.trim="organizationName" autocomplete="organization" placeholder="e.g., Research Institute" />
              </label>
              <label class="profile-field" for="organization-role-input">
                <span>Organization Role</span>
                <input id="organization-role-input" v-model.trim="organizationRole" placeholder="e.g., Lead Researcher" />
              </label>
              <label class="profile-field" for="password-input">
                <span>New Password</span>
                <span class="input-with-status">
                  <input id="password-input" v-model="password" autocomplete="new-password" :type="showPassword ? 'text' : 'password'" placeholder="Leave blank to keep current" />
                  <button class="input-icon" type="button" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
                    <i class="bi" :class="showPassword ? 'bi-eye-slash' : 'bi-eye'" aria-hidden="true"></i>
                  </button>
                </span>
              </label>
              <button class="outline-action password-action" type="button" @click="focusField('password-input')">
                <i class="bi bi-lock-fill" aria-hidden="true"></i> Change Password
              </button>
            </div>
            <div v-if="error" class="feedback feedback-error" role="alert">{{ error }}</div>
            <div v-if="saved" class="feedback feedback-success" role="status">Profile changes saved.</div>
            <div class="form-actions">
              <button class="primary-action" type="submit" :disabled="saving">
                <i class="bi" :class="saving ? 'bi-arrow-repeat' : 'bi-floppy'" aria-hidden="true"></i>
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
              <button class="secondary-action" type="button" @click="cancelChanges">
                <i class="bi bi-x-lg" aria-hidden="true"></i> Cancel
              </button>
            </div>
          </form>
        </section>

        <section class="profile-panel verification-panel" id="identity-verification">
          <div class="panel-heading">
            <div class="heading-mark"><i class="bi bi-shield-lock-fill" aria-hidden="true"></i></div>
            <div>
              <h2>Identity Verification</h2>
              <p>Document review status for your account.</p>
            </div>
            <span class="status-pill" :class="identityClass">
              <i class="bi bi-shield-check" aria-hidden="true"></i> {{ identityLabel }}
            </span>
          </div>

          <div class="verification-grid">
            <article class="verification-item">
              <div class="verification-item-head">
                <div class="document-icon"><i class="bi bi-file-earmark-text-fill" aria-hidden="true"></i></div>
                <div><h3>Identity Document</h3><span class="status-pill" :class="documentStatusClass(identityDocument)">{{ documentStatusLabel(identityDocument) }}</span></div>
              </div>
              <dl v-if="identityDocument" class="document-details">
                <div><dt>File</dt><dd>{{ identityDocument.originalName }}</dd></div>
                <div><dt>Uploaded</dt><dd>{{ formatDate(identityDocument.uploadedAt) }}</dd></div>
              </dl>
              <p v-else class="empty-document">No identity document submitted.</p>
              <div class="document-actions">
                <label class="outline-action upload-action" for="identity-document-input">
                  <i class="bi bi-cloud-arrow-up" aria-hidden="true"></i> {{ identityDocument ? 'Replace Document' : 'Upload Document' }}
                </label>
                <input id="identity-document-input" class="visually-hidden" type="file" accept="application/pdf,image/jpeg,image/png" @change="uploadVerificationDocument('identity', $event)" />
                <button v-if="identityDocument" class="text-action" type="button" @click="downloadDocument('identity')">
                  <i class="bi bi-eye" aria-hidden="true"></i> View Document
                </button>
              </div>
            </article>

            <article class="verification-item unavailable-item">
              <div class="verification-item-head">
                <div class="document-icon"><i class="bi bi-person-bounding-box" aria-hidden="true"></i></div>
                <div><h3>Selfie Verification</h3><span class="status-pill status-muted">Not configured</span></div>
              </div>
              <p class="empty-document">Selfie matching is not connected in this system.</p>
              <span class="disabled-note"><i class="bi bi-info-circle" aria-hidden="true"></i> No biometric data is collected.</span>
            </article>

            <article class="verification-item unavailable-item">
              <div class="verification-item-head">
                <div class="document-icon"><i class="bi bi-shield-fill-check" aria-hidden="true"></i></div>
                <div><h3>Liveness Check</h3><span class="status-pill status-muted">Not configured</span></div>
              </div>
              <p class="empty-document">Liveness detection is not connected in this system.</p>
              <span class="disabled-note"><i class="bi bi-info-circle" aria-hidden="true"></i> No automated check has run.</span>
            </article>
          </div>
          <div v-if="verificationError" class="feedback feedback-error" role="alert">{{ verificationError }}</div>
        </section>

        <section class="profile-panel organization-panel">
          <div class="panel-heading">
            <div class="heading-mark"><i class="bi bi-building" aria-hidden="true"></i></div>
            <div>
              <h2>Organization Details</h2>
              <p>Your organization information and verification document.</p>
            </div>
          </div>
          <div class="organization-grid">
            <label class="profile-field" for="organization-name-detail">
              <span>Organization Name</span>
              <input id="organization-name-detail" v-model.trim="organizationName" placeholder="Organization or institution" />
            </label>
            <label class="profile-field" for="organization-role-detail">
              <span>Organization Role</span>
              <input id="organization-role-detail" v-model.trim="organizationRole" placeholder="Your role" />
            </label>
            <label class="profile-field" for="organization-id-input">
              <span>Organization ID Number</span>
              <input id="organization-id-input" v-model.trim="organizationIdNumber" placeholder="Optional" />
            </label>
            <div class="organization-document">
              <span class="field-label">Organization ID Document</span>
              <span v-if="organizationDocument" class="organization-doc-status">
                {{ organizationDocument.originalName }} · {{ documentStatusLabel(organizationDocument) }}
              </span>
              <span v-else class="organization-doc-status">No document submitted</span>
              <label class="outline-action upload-action" for="organization-document-input">
                <i class="bi bi-cloud-arrow-up" aria-hidden="true"></i> Upload ID Document
              </label>
              <input id="organization-document-input" class="visually-hidden" type="file" accept="application/pdf,image/jpeg,image/png" @change="uploadVerificationDocument('organization', $event)" />
            </div>
          </div>
        </section>
      </div>

      <aside class="profile-side-column">
        <section class="profile-panel status-panel">
          <div class="side-heading">
            <div class="heading-mark"><i class="bi bi-patch-check-fill" aria-hidden="true"></i></div>
            <div><h2>Verification Status</h2><p>Current checks on your account.</p></div>
          </div>
          <div class="status-row">
            <div class="status-icon"><i class="bi bi-envelope-fill" aria-hidden="true"></i></div>
            <div class="status-copy"><strong>Email Verification</strong><small>{{ email }}</small></div>
            <span class="status-pill" :class="emailVerified ? 'status-success' : 'status-pending'">{{ emailVerified ? 'Verified' : 'Pending' }}</span>
          </div>
          <div class="status-row">
            <div class="status-icon"><i class="bi bi-person-fill" aria-hidden="true"></i></div>
            <div class="status-copy"><strong>Identity Document</strong><small>{{ documentStatusLabel(identityDocument) }}</small></div>
            <span class="status-pill" :class="documentStatusClass(identityDocument)">{{ documentStatusLabel(identityDocument) }}</span>
          </div>
          <div class="overall-status" :class="identityClass">
            <div class="overall-icon"><i class="bi bi-shield-check" aria-hidden="true"></i></div>
            <div><strong>Overall Status</strong><small>{{ overallStatusDescription }}</small></div>
            <span>{{ identityLabel }}</span>
          </div>
        </section>

        <section class="profile-panel quick-panel">
          <div class="side-heading">
            <div class="heading-mark"><i class="bi bi-lightning-charge-fill" aria-hidden="true"></i></div>
            <div><h2>Quick Actions</h2></div>
          </div>
          <button class="quick-action" type="button" @click="scrollToVerification">
            <span class="quick-icon"><i class="bi bi-file-earmark-text" aria-hidden="true"></i></span>
            <span><strong>View Verification Details</strong><small>Review your submitted documents</small></span>
            <i class="bi bi-chevron-right" aria-hidden="true"></i>
          </button>
          <button class="quick-action" type="button" @click="downloadReport">
            <span class="quick-icon"><i class="bi bi-download" aria-hidden="true"></i></span>
            <span><strong>Download Verification Report</strong><small>Download current status summary</small></span>
            <i class="bi bi-chevron-right" aria-hidden="true"></i>
          </button>
          <button class="quick-action" type="button" @click="focusField('password-input')">
            <span class="quick-icon"><i class="bi bi-key-fill" aria-hidden="true"></i></span>
            <span><strong>Change Password</strong><small>Update your account password</small></span>
            <i class="bi bi-chevron-right" aria-hidden="true"></i>
          </button>
        </section>

        <section class="profile-panel privacy-panel">
          <div class="side-heading">
            <div class="heading-mark"><i class="bi bi-lock-fill" aria-hidden="true"></i></div>
            <div><h2>Security &amp; Privacy</h2></div>
          </div>
          <ul class="privacy-list">
            <li><i class="bi bi-shield-lock" aria-hidden="true"></i><span>Verification documents are stored outside public uploads.</span></li>
            <li><i class="bi bi-people" aria-hidden="true"></i><span>Only you and authorized administrators can access your documents.</span></li>
            <li><i class="bi bi-key" aria-hidden="true"></i><span>Your password is never shown in plain text.</span></li>
            <li><i class="bi bi-file-earmark-check" aria-hidden="true"></i><span>Uploaded documents remain pending until an administrator reviews them.</span></li>
          </ul>
          <p class="privacy-note">Email confirmation, identity approval, selfie matching, and liveness detection require verification services that are not configured in this application.</p>
        </section>
      </aside>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { API_CONFIG } from '@/config';

type DocumentKind = 'identity' | 'organization';
interface VerificationDocument {
  originalName: string;
  size: number;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
}
interface VerificationState {
  emailVerified: boolean;
  identity: VerificationDocument | null;
  organization: VerificationDocument | null;
  selfieStatus: string;
  livenessStatus: string;
}

const router = useRouter();
const fallbackAvatar = '/img/user.jpg';
const loading = ref(true);
const saving = ref(false);
const saved = ref(false);
const error = ref('');
const verificationError = ref('');
const userId = ref('');
const name = ref('');
const email = ref('');
const role = ref('');
const organizationName = ref('');
const organizationRole = ref('');
const organizationIdNumber = ref('');
const password = ref('');
const showPassword = ref(false);
const profilePicture = ref(fallbackAvatar);
const verification = ref<VerificationState>({
  emailVerified: false,
  identity: null,
  organization: null,
  selfieStatus: 'not_configured',
  livenessStatus: 'not_configured'
});

const roleLabel = computed(() => role.value ? role.value[0].toUpperCase() + role.value.slice(1) : 'DESS User');
const emailVerified = computed(() => verification.value.emailVerified);
const identityDocument = computed(() => verification.value.identity);
const organizationDocument = computed(() => verification.value.organization);
const accountReference = computed(() => userId.value ? userId.value.slice(-12).toUpperCase() : 'Not available');
const identityLabel = computed(() => {
  if (identityDocument.value?.status === 'approved') return 'Verified';
  if (identityDocument.value?.status === 'rejected') return 'Action Required';
  if (identityDocument.value?.status === 'pending') return 'Pending Review';
  return 'Not Submitted';
});
const identityClass = computed(() => {
  if (identityDocument.value?.status === 'approved') return 'status-success';
  if (identityDocument.value?.status === 'rejected') return 'status-danger';
  return 'status-pending';
});
const overallStatusDescription = computed(() => {
  if (!emailVerified.value && !identityDocument.value) return 'Email and identity checks are incomplete.';
  if (identityDocument.value?.status === 'pending') return 'Your document is waiting for review.';
  if (identityDocument.value?.status === 'rejected') return 'Review the document status and submit a replacement.';
  if (identityDocument.value?.status === 'approved' && emailVerified.value) return 'Configured checks have been approved.';
  return 'Some verification checks are not configured.';
});

function getToken() {
  return sessionStorage.getItem('dess_token') || '';
}

function authConfig() {
  return { headers: { Authorization: `Bearer ${getToken()}` }, withCredentials: true };
}

function resolveProfilePicture(url: string) {
  if (url.startsWith('/uploads/')) return `${API_CONFIG.baseURL}${url}`;
  return url || fallbackAvatar;
}

async function refreshAuthToken() {
  const response = await axios.post('/api/auth/refresh', null, { withCredentials: true });
  if (!response.data?.token) throw new Error('Please sign in again.');
  sessionStorage.setItem('dess_token', response.data.token);
}

async function requestWithRefresh<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (requestError: any) {
    if (requestError?.response?.status !== 401) throw requestError;
    await refreshAuthToken();
    return request();
  }
}

function roleHome() {
  if (role.value === 'researcher') return '/researcher';
  if (role.value === 'admin') return '/admin';
  return '/investigator';
}

function goBack() {
  router.push(roleHome());
}

async function loadProfile() {
  loading.value = true;
  error.value = '';
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('user') || 'null');
    const signupData = JSON.parse(sessionStorage.getItem('signupData') || 'null');
    if (!storedUser?.id) {
      if (signupData) {
        name.value = signupData.name || '';
        email.value = signupData.email || '';
        role.value = signupData.role || '';
        organizationName.value = signupData.organizationName || '';
        organizationRole.value = signupData.organizationRole || '';
        loading.value = false;
        return;
      }
      await router.replace('/login');
      return;
    }

    userId.value = storedUser.id;
    const response = await requestWithRefresh(() => axios.get(`/api/users/${userId.value}`, authConfig()));
    const user = response.data;
    name.value = user.name || '';
    email.value = user.email || '';
    role.value = user.role || storedUser.role || '';
    organizationName.value = user.organizationName || '';
    organizationRole.value = user.organizationRole || '';
    organizationIdNumber.value = user.organizationIdNumber || '';
    profilePicture.value = resolveProfilePicture(user.profilePicture || '');
    sessionStorage.setItem('user', JSON.stringify({ ...storedUser, ...user }));
    await loadVerification();
  } catch (loadError: any) {
    error.value = loadError?.response?.data?.error || loadError?.message || 'Failed to load your profile.';
  } finally {
    loading.value = false;
  }
}

async function loadVerification() {
  if (!userId.value) return;
  try {
    const response = await requestWithRefresh(() => axios.get(`/api/users/${userId.value}/verification`, authConfig()));
    verification.value = response.data;
  } catch (loadError: any) {
    verificationError.value = loadError?.response?.data?.error || 'Verification status is unavailable.';
  }
}

function focusField(id: string) {
  document.getElementById(id)?.focus();
}

function triggerAvatarInput() {
  document.getElementById('avatar-input')?.click();
}

function useFallbackAvatar() {
  profilePicture.value = fallbackAvatar;
}

async function uploadAvatar(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !userId.value) return;
  error.value = '';
  if (!file.type.startsWith('image/')) {
    error.value = 'Choose an image file for your profile photo.';
    input.value = '';
    return;
  }

  const formData = new FormData();
  formData.append('avatar', file);
  try {
    const response = await requestWithRefresh(() => axios.post(`/api/users/${userId.value}/avatar`, formData, authConfig()));
    profilePicture.value = resolveProfilePicture(response.data.profilePicture);
    const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    sessionStorage.setItem('user', JSON.stringify({ ...storedUser, profilePicture: response.data.profilePicture }));
  } catch (uploadError: any) {
    error.value = uploadError?.response?.data?.error || 'Could not update your photo.';
  } finally {
    input.value = '';
  }
}

async function uploadVerificationDocument(kind: DocumentKind, event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !userId.value) return;
  verificationError.value = '';
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    verificationError.value = 'Choose a PDF, JPEG, or PNG document.';
    input.value = '';
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    verificationError.value = 'The document must be smaller than 10 MB.';
    input.value = '';
    return;
  }

  const formData = new FormData();
  formData.append('document', file);
  try {
    await requestWithRefresh(() => axios.post(`/api/users/${userId.value}/verification-documents/${kind}`, formData, authConfig()));
    await loadVerification();
  } catch (uploadError: any) {
    verificationError.value = uploadError?.response?.data?.error || 'Could not upload the verification document.';
  } finally {
    input.value = '';
  }
}

async function downloadDocument(kind: DocumentKind) {
  try {
    const response = await requestWithRefresh(() => axios.get(
      `/api/users/${userId.value}/verification-documents/${kind}`,
      { ...authConfig(), responseType: 'blob' }
    ));
    const documentRecord = kind === 'identity' ? identityDocument.value : organizationDocument.value;
    const objectUrl = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = documentRecord?.originalName || `${kind}-document`;
    link.click();
    URL.revokeObjectURL(objectUrl);
  } catch (downloadError: any) {
    verificationError.value = downloadError?.response?.data?.error || 'Could not open the private document.';
  }
}

function documentStatusLabel(documentRecord: VerificationDocument | null) {
  if (!documentRecord) return 'Not submitted';
  if (documentRecord.status === 'approved') return 'Approved';
  if (documentRecord.status === 'rejected') return 'Action required';
  return 'Pending review';
}

function documentStatusClass(documentRecord: VerificationDocument | null) {
  if (documentRecord?.status === 'approved') return 'status-success';
  if (documentRecord?.status === 'rejected') return 'status-danger';
  return documentRecord ? 'status-pending' : 'status-muted';
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

async function saveProfile() {
  if (!userId.value) {
    error.value = 'Sign in to save profile changes.';
    return;
  }
  saving.value = true;
  saved.value = false;
  error.value = '';
  try {
    const payload: Record<string, string> = {
      name: name.value,
      email: email.value,
      organizationName: organizationName.value,
      organizationRole: organizationRole.value,
      organizationIdNumber: organizationIdNumber.value
    };
    if (password.value) payload.password = password.value;
    const response = await requestWithRefresh(() => axios.patch(`/api/users/${userId.value}`, payload, authConfig()));
    const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    sessionStorage.setItem('user', JSON.stringify({ ...storedUser, ...response.data }));
    await loadVerification();
    password.value = '';
    saved.value = true;
  } catch (saveError: any) {
    error.value = saveError?.response?.data?.error || saveError?.message || 'Failed to save profile changes.';
  } finally {
    saving.value = false;
  }
}

async function cancelChanges() {
  saved.value = false;
  await loadProfile();
}

function scrollToVerification() {
  document.getElementById('identity-verification')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function downloadReport() {
  const report = [
    'DESS VERIFICATION STATUS REPORT',
    `Generated: ${new Date().toISOString()}`,
    `Account: ${name.value} (${email.value})`,
    `Role: ${roleLabel.value}`,
    `Email verification: ${emailVerified.value ? 'Verified' : 'Not verified'}`,
    `Identity document: ${documentStatusLabel(identityDocument.value)}`,
    `Organization document: ${documentStatusLabel(organizationDocument.value)}`,
    'Selfie verification: Not configured',
    'Liveness detection: Not configured',
    '',
    'This report summarizes stored application status and is not an identity certificate.'
  ].join('\n');
  const objectUrl = URL.createObjectURL(new Blob([report], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = 'dess-verification-status.txt';
  link.click();
  URL.revokeObjectURL(objectUrl);
}

onMounted(loadProfile);
</script>

<style scoped>
.profile-page {
  --profile-bg: #04152d;
  --panel-bg: #061d3a;
  --panel-raised: #082345;
  --line: #123d6b;
  --text-main: #e7f2ff;
  --text-muted: #9db9d8;
  --blue: #168bff;
  --green: #06d6a0;
  min-height: calc(100vh - 56px);
  padding: 18px clamp(12px, 2vw, 28px) 28px;
  color: var(--text-main);
  background-color: var(--profile-bg);
  background-image: linear-gradient(rgba(24, 93, 154, .08) 1px, transparent 1px), linear-gradient(90deg, rgba(24, 93, 154, .08) 1px, transparent 1px);
  background-size: 34px 34px;
}

.profile-loading {
  display: flex;
  min-height: 55vh;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
}

.profile-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.9fr) minmax(280px, .94fr);
  gap: 16px;
  max-width: 1540px;
  margin: 0 auto;
  align-items: start;
}

.profile-main-column,
.profile-side-column {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.profile-banner,
.profile-panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(7, 32, 63, .98), rgba(4, 24, 49, .98));
  box-shadow: 0 10px 24px rgba(0, 0, 0, .13);
}

.profile-banner {
  display: flex;
  min-height: 108px;
  align-items: center;
  gap: 18px;
  padding: 14px 18px;
  background-image: linear-gradient(155deg, transparent 72%, rgba(0, 106, 220, .16) 72%, transparent 73%);
}

.avatar-wrap {
  position: relative;
  flex: 0 0 76px;
  width: 76px;
  height: 76px;
}

.profile-avatar {
  width: 76px;
  height: 76px;
  border: 2px solid #45a5ff;
  border-radius: 50%;
  object-fit: cover;
  background: #123b68;
}

.avatar-edit {
  position: absolute;
  right: -2px;
  bottom: 1px;
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border: 2px solid var(--profile-bg);
  border-radius: 50%;
  color: white;
  background: var(--blue);
  cursor: pointer;
}

.profile-identity { min-width: 0; flex: 1; }
.profile-identity h1 { margin: 0; color: #f0f7ff; font-size: 20px; font-weight: 700; }
.profile-role { margin: 1px 0 6px; color: #a9c5e3; font-size: 13px; }
.identity-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.account-reference { margin: 6px 0 0; color: #94b5d8; font-size: 11px; }

.status-pill {
  display: inline-flex;
  min-height: 22px;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border: 1px solid transparent;
  border-radius: 999px;
  white-space: nowrap;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
}

.status-success { border-color: rgba(6, 214, 160, .3); color: #72f5ce; background: rgba(0, 130, 103, .23); }
.status-pending { border-color: rgba(255, 190, 80, .35); color: #ffd48a; background: rgba(150, 94, 0, .2); }
.status-danger { border-color: rgba(255, 112, 112, .35); color: #ffaaaa; background: rgba(150, 22, 38, .22); }
.status-muted { border-color: rgba(150, 180, 210, .2); color: #b0c2d5; background: rgba(130, 160, 190, .12); }

.outline-action,
.primary-action,
.secondary-action {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 7px 11px;
  border: 1px solid #1675c8;
  border-radius: 6px;
  color: #cde7ff;
  background: rgba(4, 36, 73, .8);
  cursor: pointer;
  font-size: 11px;
  font-weight: 650;
  text-decoration: none;
  transition: background .16s ease, border-color .16s ease;
}

.outline-action:hover { border-color: #39a1ff; color: white; background: rgba(14, 88, 153, .4); }
.photo-action { flex: 0 0 auto; align-self: flex-start; }
.profile-panel { padding: 15px; }

.panel-heading,
.side-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  margin-bottom: 13px;
}

.panel-heading > div:nth-child(2),
.side-heading > div:nth-child(2) { min-width: 0; flex: 1; }
.heading-mark { display: grid; width: 25px; height: 28px; flex: 0 0 25px; place-items: center; color: #1d9cff; font-size: 21px; }
.panel-heading h2,
.side-heading h2 { margin: 0; color: #e8f4ff; font-size: 14px; font-weight: 700; }
.panel-heading p,
.side-heading p { margin: 3px 0 0; color: var(--text-muted); font-size: 10px; }
.edit-action { margin-left: auto; }

.field-grid,
.organization-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px 10px;
}

.profile-field { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.profile-field > span:first-child,
.field-label { color: #b7cde5; font-size: 10px; font-weight: 600; }
.profile-field input {
  width: 100%;
  min-width: 0;
  min-height: 37px;
  padding: 8px 10px;
  border: 1px solid #143c64;
  border-radius: 6px;
  outline: none;
  color: #e2efff;
  background: rgba(4, 24, 47, .78);
  font-size: 11px;
}
.profile-field input::placeholder { color: #728eae; }
.profile-field input:focus { border-color: #168bff; box-shadow: 0 0 0 2px rgba(22, 139, 255, .16); }
.input-with-status { position: relative; display: flex; min-width: 0; align-items: center; }
.input-with-status input { padding-right: 100px; }
.field-status { position: absolute; right: 7px; display: inline-flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 700; }
.input-icon { position: absolute; right: 7px; display: grid; width: 26px; height: 26px; place-items: center; border: 0; color: #94b4d7; background: transparent; cursor: pointer; }
.password-action { align-self: end; justify-self: end; min-width: 140px; min-height: 37px; }
.form-actions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
.primary-action { border-color: #168bff; color: white; background: #0876e1; }
.primary-action:hover { background: #168bff; }
.primary-action:disabled { opacity: .7; cursor: wait; }
.secondary-action { border-color: #31516f; color: #c1d3e6; background: transparent; }
.feedback { margin-top: 10px; padding: 8px 10px; border-radius: 6px; font-size: 12px; }
.feedback-error { border: 1px solid rgba(255, 112, 112, .35); color: #ffc0c0; background: rgba(115, 20, 32, .25); }
.feedback-success { border: 1px solid rgba(6, 214, 160, .28); color: #8df0d2; background: rgba(0, 120, 90, .22); }

.verification-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; }
.verification-item { min-width: 0; padding: 11px; border: 1px solid #153f6a; border-radius: 7px; background: rgba(6, 29, 57, .82); }
.verification-item-head { display: flex; align-items: center; gap: 8px; min-height: 40px; }
.document-icon,
.status-icon,
.quick-icon { display: grid; width: 35px; height: 35px; flex: 0 0 35px; place-items: center; border-radius: 9px; color: #d7edff; background: #10487e; font-size: 17px; }
.verification-item h3 { margin: 0 0 5px; color: #dcecff; font-size: 11px; font-weight: 700; }
.document-details { display: grid; gap: 5px; margin: 10px 0; }
.document-details div { display: grid; grid-template-columns: 55px minmax(0, 1fr); gap: 5px; font-size: 10px; }
.document-details dt { color: #8eabc9; font-weight: 500; }
.document-details dd { overflow-wrap: anywhere; margin: 0; color: #c7d9ec; }
.empty-document { min-height: 34px; margin: 11px 0; color: #9cb4cd; font-size: 10px; line-height: 1.5; }
.document-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.upload-action { min-height: 30px; padding: 6px 8px; font-size: 10px; }
.text-action { border: 0; color: #79baff; background: transparent; cursor: pointer; font-size: 10px; }
.text-action:hover { color: white; }
.disabled-note { display: flex; gap: 5px; color: #7f9ab6; font-size: 9px; line-height: 1.4; }

.organization-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: end; }
.organization-document { display: flex; min-width: 0; flex-direction: column; gap: 5px; padding: 8px; border: 1px dashed #1c639a; border-radius: 6px; background: rgba(3, 25, 50, .7); }
.organization-doc-status { overflow: hidden; color: #91acc9; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }

.side-heading { margin-bottom: 12px; }
.side-heading .heading-mark { font-size: 20px; }
.status-row { display: flex; min-width: 0; align-items: center; gap: 8px; margin-top: 7px; padding: 9px; border: 1px solid #143d67; border-radius: 7px; background: rgba(5, 28, 54, .7); }
.status-icon { width: 33px; height: 33px; flex-basis: 33px; }
.status-copy { display: grid; min-width: 0; flex: 1; gap: 3px; }
.status-copy strong { color: #dcecff; font-size: 10px; }
.status-copy small { overflow: hidden; color: #94b1d0; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.overall-status { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding: 10px; border: 1px solid rgba(6, 214, 160, .26); border-radius: 7px; background: rgba(0, 130, 103, .14); }
.overall-status.status-pending { border-color: rgba(255, 190, 80, .3); background: rgba(150, 94, 0, .13); }
.overall-status.status-danger { border-color: rgba(255, 112, 112, .3); background: rgba(150, 22, 38, .14); }
.overall-icon { display: grid; width: 35px; height: 35px; flex: 0 0 35px; place-items: center; border: 2px solid currentColor; border-radius: 50%; font-size: 19px; }
.overall-status > div:nth-child(2) { display: grid; min-width: 0; flex: 1; gap: 3px; }
.overall-status strong { font-size: 10px; }
.overall-status small { color: #a8c2d9; font-size: 9px; line-height: 1.4; }
.overall-status > span { font-size: 9px; font-weight: 700; white-space: nowrap; }

.quick-panel { padding-bottom: 10px; }
.quick-action { display: flex; width: 100%; min-width: 0; align-items: center; gap: 8px; margin-top: 6px; padding: 8px; border: 1px solid #143d67; border-radius: 7px; color: inherit; text-align: left; background: rgba(5, 28, 54, .72); cursor: pointer; }
.quick-action:hover { border-color: #1d76bb; background: rgba(10, 52, 91, .8); }
.quick-icon { width: 31px; height: 31px; flex-basis: 31px; font-size: 15px; }
.quick-action > span:nth-child(2) { display: grid; min-width: 0; flex: 1; gap: 3px; }
.quick-action strong { color: #dcecff; font-size: 9px; }
.quick-action small { color: #93afcd; font-size: 9px; }
.quick-action > i { color: #7da5ca; font-size: 11px; }
.privacy-list { display: grid; gap: 9px; margin: 0; padding: 0; list-style: none; }
.privacy-list li { display: flex; align-items: flex-start; gap: 9px; color: #b3c9df; font-size: 10px; line-height: 1.45; }
.privacy-list i { flex: 0 0 15px; color: #63adf6; font-size: 12px; }
.privacy-note { margin: 12px 0 0; padding-top: 10px; border-top: 1px solid #143d67; color: #91aac5; font-size: 9px; line-height: 1.5; }

@media (max-width: 1000px) {
  .profile-layout { grid-template-columns: minmax(0, 1.45fr) minmax(260px, .9fr); }
  .verification-grid { grid-template-columns: 1fr; }
  .organization-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 760px) {
  .profile-page { padding: 12px; }
  .profile-layout { grid-template-columns: minmax(0, 1fr); }
  .profile-banner { align-items: flex-start; gap: 12px; padding: 13px; }
  .avatar-wrap, .profile-avatar { width: 60px; height: 60px; }
  .avatar-wrap { flex-basis: 60px; }
  .profile-identity h1 { font-size: 18px; }
  .photo-action { min-height: 31px; padding: 6px 8px; font-size: 0; }
  .photo-action i { font-size: 13px; }
  .panel-heading { align-items: flex-start; }
  .edit-action { font-size: 0; }
  .edit-action i { font-size: 13px; }
  .verification-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 520px) {
  .profile-banner { display: grid; grid-template-columns: 54px minmax(0, 1fr) 32px; align-items: center; gap: 10px; }
  .avatar-wrap, .profile-avatar { width: 52px; height: 52px; }
  .avatar-wrap { flex-basis: 52px; }
  .profile-identity h1 { font-size: 16px; }
  .profile-role { font-size: 11px; }
  .identity-badges { gap: 4px; }
  .identity-badges .status-pill { padding: 3px 6px; font-size: 8px; }
  .account-reference { font-size: 9px; }
  .photo-action { width: 32px; height: 32px; min-width: 32px; padding: 0; }
  .field-grid, .organization-grid { grid-template-columns: minmax(0, 1fr); }
  .verification-grid { grid-template-columns: minmax(0, 1fr); }
  .verification-item { padding: 10px; }
  .password-action { justify-self: start; }
  .profile-panel { padding: 12px; }
}
</style>