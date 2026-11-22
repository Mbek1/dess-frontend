<template>
  <section class="access-review">
    <div class="review-toolbar">
      <div><h2>Account access review</h2><p>Review account roles, status, MFA configuration and recent sign-in activity.</p></div>
      <button type="button" class="refresh-button" :disabled="loading" @click="loadData"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
    </div>
    <p v-if="error" class="review-error" role="alert">{{ error }}</p>
    <p v-if="success" class="review-success" role="status">{{ success }}</p>
    <div class="review-stats">
      <article><span>Total accounts</span><strong>{{ users.length }}</strong></article>
      <article><span>Active accounts</span><strong>{{ users.filter(user => user.active).length }}</strong></article>
      <article><span>Active sessions</span><strong>{{ sessions.length }}</strong></article>
      <article><span>MFA enabled</span><strong>{{ users.filter(user => user.mfaEnabled).length }}</strong></article>
    </div>

    <div class="review-card">
      <div class="card-heading"><h3>Accounts</h3><span>{{ users.length }} records</span></div>
      <div v-if="loading" class="empty-state">Loading account review…</div>
      <div v-else-if="!users.length" class="empty-state">No user accounts found.</div>
      <div v-else class="table-wrap">
        <table>
          <thead><tr><th>Account</th><th>Role</th><th>Status</th><th>MFA</th><th>Last login</th><th>Sessions</th><th>Action</th></tr></thead>
          <tbody>
            <tr v-for="user in users" :key="user._id">
              <td><strong>{{ user.name }}</strong><small>{{ user.email }}</small></td>
              <td>
                <select v-model="draftRoles[user._id]" :disabled="isSelf(user)" aria-label="Account role">
                  <option value="investigator">Investigator</option>
                  <option value="researcher">Researcher</option>
                  <option value="admin">Administrator</option>
                </select>
              </td>
              <td><span class="status-pill" :class="user.active ? 'enabled' : 'disabled'">{{ user.active ? 'Active' : 'Disabled' }}</span></td>
              <td><span class="status-pill" :class="user.mfaEnabled ? 'enabled' : 'disabled'">{{ user.mfaEnabled ? 'Enabled' : 'Not enabled' }}</span></td>
              <td>{{ formatDate(user.lastLoginAt) }}</td>
              <td>{{ user.activeSessionCount }}</td>
              <td>
                <div class="row-actions">
                  <button type="button" :disabled="isSelf(user) || savingId === user._id" @click="saveAccess(user)">
                    {{ savingId === user._id ? 'Saving…' : 'Save access' }}
                  </button>
                  <button type="button" class="secondary-action" :disabled="isSelf(user) || savingId === user._id" @click="toggleStatus(user)">
                    {{ user.active ? 'Disable' : 'Enable' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="review-card">
      <div class="card-heading"><h3>Active sessions</h3><span>{{ sessions.length }} active</span></div>
      <div v-if="!sessions.length" class="empty-state">There are no active sessions.</div>
      <div v-else class="table-wrap">
        <table>
          <thead><tr><th>User</th><th>Device</th><th>IP address</th><th>Last activity</th><th>Expires</th><th>Action</th></tr></thead>
          <tbody>
            <tr v-for="session in sessions" :key="session.id">
              <td><strong>{{ session.user?.name || 'Unknown user' }}</strong><small>{{ session.user?.email }}</small></td>
              <td>{{ session.deviceLabel }}</td>
              <td>{{ session.ipAddress || 'Not recorded' }}</td>
              <td>{{ formatDate(session.lastActivityAt) }}</td>
              <td>{{ formatDate(session.expiresAt) }}</td>
              <td><button type="button" class="danger-action" :disabled="savingId === session.id" @click="revokeSession(session)">{{ savingId === session.id ? 'Revoking…' : 'Revoke' }}</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <p class="review-footnote">Changing a user's role or disabling an account revokes that user's existing sessions. MFA status is informational until the authenticator-app setup is completed.</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { API_CONFIG } from '@/config';

const users = ref<any[]>([]);
const sessions = ref<any[]>([]);
const draftRoles = ref<Record<string, string>>({});
const loading = ref(false);
const savingId = ref('');
const error = ref('');
const success = ref('');
let currentUserId = '';

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sessionStorage.getItem('dess_token') || ''}`
  };
}

function isSelf(user: any) {
  return String(user._id) === currentUserId;
}

function formatDate(value?: string) {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
}

async function api(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_CONFIG.baseURL}/api/admin${path}`, {
    ...options, headers: { ...headers(), ...(options.headers || {}) }, credentials: 'include'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The administrator request failed.');
  return data;
}

async function loadData() {
  loading.value = true;
  error.value = '';
  try {
    const [accessData, sessionData] = await Promise.all([
      api('/security/access-review'),
      api('/security/sessions')
    ]);
    users.value = accessData.users || [];
    sessions.value = sessionData.sessions || [];
    draftRoles.value = Object.fromEntries(users.value.map(user => [user._id, user.role]));
  } catch (err: any) {
    error.value = err.message || 'Could not load the access review.';
  } finally {
    loading.value = false;
  }
}

async function saveAccess(user: any, active = user.active) {
  savingId.value = user._id;
  error.value = '';
  success.value = '';
  try {
    await api(`/security/users/${encodeURIComponent(user._id)}/access`, {
      method: 'PATCH',
      body: JSON.stringify({ active, role: draftRoles.value[user._id] })
    });
    success.value = `Access updated for ${user.name}. Their existing sessions were revoked.`;
    await loadData();
  } catch (err: any) {
    error.value = err.message || 'Could not update account access.';
  } finally {
    savingId.value = '';
  }
}

async function toggleStatus(user: any) {
  if (!window.confirm(`${user.active ? 'Disable' : 'Enable'} the account for ${user.name}?`)) return;
  await saveAccess(user, !user.active);
}

async function revokeSession(session: any) {
  if (!window.confirm(`Revoke the active session for ${session.user?.name || 'this user'}?`)) return;
  savingId.value = session.id;
  error.value = '';
  success.value = '';
  try {
    await api(`/security/sessions/${encodeURIComponent(session.id)}`, { method: 'DELETE' });
    success.value = 'Session revoked. The device must sign in again.';
    await loadData();
  } catch (err: any) {
    error.value = err.message || 'Could not revoke the session.';
  } finally {
    savingId.value = '';
  }
}

try {
  const currentUser = JSON.parse(sessionStorage.getItem('user') || 'null');
  currentUserId = String(currentUser?.id || currentUser?._id || '');
} catch {
  currentUserId = '';
}

onMounted(() => { void loadData(); });
</script>

<style scoped>
.access-review{display:grid;gap:15px;color:#dcecff}.review-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px}.review-toolbar h2{margin:0;color:#eaf5ff;font-size:15px}.review-toolbar p{margin:5px 0 0;color:#91acc9;font-size:10px}.refresh-button,.row-actions button,.danger-action{min-height:30px;padding:6px 9px;border:1px solid #245783;border-radius:5px;color:#d8edff;background:#0b3155;cursor:pointer;font-size:9px;font-weight:650}.refresh-button:disabled,.row-actions button:disabled,.danger-action:disabled{opacity:.5;cursor:default}.review-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.review-stats article,.review-card{border:1px solid #143b60;border-radius:7px;background:#071d39}.review-stats article{display:grid;gap:6px;padding:12px}.review-stats span,.card-heading span{color:#8daac7;font-size:9px}.review-stats strong{color:#e9f5ff;font-size:19px}.review-card{overflow:hidden}.card-heading{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #143b60}.card-heading h3{margin:0;color:#e8f4ff;font-size:12px}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:800px;text-align:left}th,td{padding:10px 11px;border-bottom:1px solid #123653;font-size:9px;white-space:nowrap}th{color:#7f9fbd;background:#06182e;font-weight:700}td{color:#c8dced}td strong,td small{display:block}td small{margin-top:3px;color:#7997b4;font-size:8px}.status-pill{display:inline-block;padding:4px 6px;border-radius:4px;font-size:8px;font-weight:700}.status-pill.enabled{color:#83e0c0;background:#123e3b}.status-pill.disabled{color:#e9b3b3;background:#482c39}select{max-width:130px;padding:5px;border:1px solid #315675;border-radius:4px;color:#dcecff;background:#07182c;font-size:9px}.row-actions{display:flex;gap:5px}.row-actions .secondary-action{border-color:#67404a;color:#efb6bd;background:#33202b}.danger-action{border-color:#67404a;color:#efb6bd;background:#33202b}.empty-state{padding:20px;color:#8daac7;text-align:center;font-size:10px}.review-error,.review-success,.review-footnote{margin:0;padding:9px 11px;border-radius:5px;font-size:9px}.review-error{color:#ffc0c0;background:#3c202b}.review-success{color:#9ce4c6;background:#123b34}.review-footnote{color:#90aaca;background:#071d39;border:1px solid #143b60}@media(max-width:760px){.review-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.review-toolbar{align-items:flex-start;flex-direction:column}.review-card .table-wrap{margin:0}}
</style>
