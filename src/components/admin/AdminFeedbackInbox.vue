<template>
  <section class="feedback-inbox">
    <div class="inbox-toolbar">
      <div>
        <p class="inbox-eyebrow">USER SUBMISSIONS</p>
        <h2>Feedback inbox</h2>
        <p class="inbox-description">Review reports, suggestions and comments submitted from the DESS workspace.</p>
      </div>
      <div class="toolbar-actions">
        <label class="filter-control">
          <span>Status</span>
          <select v-model="statusFilter" @change="loadFeedback(1)">
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="in-review">In review</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
        <button class="refresh-button" type="button" :disabled="loading" @click="loadFeedback(page)">
          <i class="bi bi-arrow-clockwise" :class="{ spinning: loading }" aria-hidden="true"></i>
          Refresh
        </button>
      </div>
    </div>

    <div class="inbox-summary">
      <span><strong>{{ pagination.total }}</strong> submission{{ pagination.total === 1 ? '' : 's' }}</span>
      <span v-if="pagination.pages > 1">Page {{ pagination.page }} of {{ pagination.pages }}</span>
    </div>

    <div class="inbox-layout">
      <aside class="submission-list" aria-label="Feedback submissions">
        <div v-if="loading && !records.length" class="list-state">
          <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          Loading feedback...
        </div>
        <div v-else-if="errorMessage" class="list-state state-error" role="alert">
          {{ errorMessage }}
          <button type="button" @click="loadFeedback(page)">Try again</button>
        </div>
        <div v-else-if="!records.length" class="list-state">
          <i class="bi bi-inbox" aria-hidden="true"></i>
          <strong>No feedback found</strong>
          <span>Submissions will appear here when users send feedback.</span>
        </div>
        <template v-else>
          <button
            v-for="item in records"
            :key="item._id"
            type="button"
            class="submission-card"
            :class="{ selected: selectedId === item._id }"
            @click="selectFeedback(item)"
          >
            <span class="submission-meta">
              <span class="category-label">{{ categoryLabel(item.category) }}</span>
              <span class="status-label" :class="'status-' + item.status">{{ statusLabel(item.status) }}</span>
            </span>
            <strong class="submission-subject">{{ item.subject }}</strong>
            <span class="submission-preview">{{ item.message }}</span>
            <span class="submission-footer">
              <span>{{ item.userName || item.userEmail || 'DESS user' }}</span>
              <time>{{ formatDate(item.createdAt) }}</time>
            </span>
          </button>
        </template>

        <div v-if="pagination.pages > 1" class="pagination-controls">
          <button type="button" :disabled="page <= 1 || loading" @click="loadFeedback(page - 1)">
            <i class="bi bi-chevron-left" aria-hidden="true"></i> Previous
          </button>
          <button type="button" :disabled="page >= pagination.pages || loading" @click="loadFeedback(page + 1)">
            Next <i class="bi bi-chevron-right" aria-hidden="true"></i>
          </button>
        </div>
      </aside>

      <article class="submission-detail">
        <template v-if="selectedFeedback">
          <header class="detail-header">
            <div>
              <span class="category-label">{{ categoryLabel(selectedFeedback.category) }}</span>
              <h3>{{ selectedFeedback.subject }}</h3>
              <p>Submitted {{ formatDate(selectedFeedback.createdAt) }}</p>
            </div>
            <span class="status-label" :class="'status-' + selectedFeedback.status">
              {{ statusLabel(selectedFeedback.status) }}
            </span>
          </header>

          <div class="sender-card">
            <span class="sender-avatar"><i class="bi bi-person-fill" aria-hidden="true"></i></span>
            <div>
              <strong>{{ selectedFeedback.userName || 'DESS user' }}</strong>
              <a v-if="selectedFeedback.userEmail" :href="'mailto:' + selectedFeedback.userEmail">{{ selectedFeedback.userEmail }}</a>
              <small v-else>Account-linked submission</small>
            </div>
          </div>

          <div v-if="selectedFeedback.rating" class="rating-row">
            <span>Experience rating</span>
            <strong>{{ selectedFeedback.rating }} / 5</strong>
          </div>

          <section class="message-section">
            <h4>Feedback details</h4>
            <p>{{ selectedFeedback.message }}</p>
          </section>

          <section class="status-editor">
            <div>
              <h4>Update status</h4>
              <p>Track the team's progress on this submission.</p>
            </div>
            <div class="status-editor-controls">
              <select v-model="statusDraft" aria-label="Feedback status">
                <option value="new">New</option>
                <option value="in-review">In review</option>
                <option value="resolved">Resolved</option>
              </select>
              <button type="button" :disabled="savingStatus || statusDraft === selectedFeedback.status" @click="saveStatus">
                {{ savingStatus ? 'Saving...' : 'Save status' }}
              </button>
            </div>
            <p v-if="updateMessage" class="update-message" role="status">{{ updateMessage }}</p>
            <p v-if="updateError" class="update-error" role="alert">{{ updateError }}</p>
          </section>
        </template>
        <div v-else class="detail-empty">
          <i class="bi bi-chat-square-text" aria-hidden="true"></i>
          <strong>Select a submission</strong>
          <span>Choose a feedback item from the list to read its full details.</span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import axios from 'axios';

type FeedbackStatus = 'new' | 'in-review' | 'resolved';

interface FeedbackRecord {
  _id: string;
  userName?: string;
  userEmail?: string;
  category: string;
  rating?: number;
  subject: string;
  message: string;
  status: FeedbackStatus;
  createdAt: string;
}

interface FeedbackPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const records = ref<FeedbackRecord[]>([]);
const selectedId = ref('');
const statusFilter = ref('');
const statusDraft = ref<FeedbackStatus>('new');
const page = ref(1);
const pagination = ref<FeedbackPagination>({ page: 1, limit: 20, total: 0, pages: 0 });
const loading = ref(false);
const savingStatus = ref(false);
const errorMessage = ref('');
const updateMessage = ref('');
const updateError = ref('');

const selectedFeedback = computed(() => records.value.find(item => item._id === selectedId.value) || null);

function authConfig() {
  const token = sessionStorage.getItem('dess_token') || '';
  return {
    withCredentials: true,
    headers: { Authorization: `Bearer ${token}` }
  };
}

function selectFeedback(item: FeedbackRecord) {
  selectedId.value = item._id;
  statusDraft.value = item.status;
  updateMessage.value = '';
  updateError.value = '';
}

async function loadFeedback(nextPage = 1) {
  loading.value = true;
  errorMessage.value = '';
  updateMessage.value = '';
  updateError.value = '';
  try {
    const params: Record<string, string | number> = { page: nextPage, limit: 20 };
    if (statusFilter.value) params.status = statusFilter.value;
    const response = await axios.get('/api/feedback', { ...authConfig(), params });
    records.value = response.data.feedback || [];
    pagination.value = response.data.pagination || { page: nextPage, limit: 20, total: records.value.length, pages: 1 };
    page.value = pagination.value.page || nextPage;

    if (!records.value.some(item => item._id === selectedId.value)) {
      if (records.value.length) selectFeedback(records.value[0]);
      else selectedId.value = '';
    } else if (selectedFeedback.value) {
      statusDraft.value = selectedFeedback.value.status;
    }
  } catch (requestError: any) {
    errorMessage.value = requestError?.response?.data?.error || 'Could not load feedback submissions.';
  } finally {
    loading.value = false;
  }
}

async function saveStatus() {
  const item = selectedFeedback.value;
  if (!item) return;
  savingStatus.value = true;
  updateMessage.value = '';
  updateError.value = '';
  try {
    const response = await axios.patch(
      `/api/feedback/${item._id}/status`,
      { status: statusDraft.value },
      authConfig()
    );
    const updated = response.data as FeedbackRecord;
    const index = records.value.findIndex(record => record._id === updated._id);
    if (index >= 0) {
      if (statusFilter.value && statusFilter.value !== updated.status) {
        records.value.splice(index, 1);
        if (records.value.length) selectFeedback(records.value[Math.min(index, records.value.length - 1)]);
        else selectedId.value = '';
      } else {
        records.value.splice(index, 1, updated);
        statusDraft.value = updated.status;
      }
    }
    updateMessage.value = 'Feedback status updated.';
  } catch (requestError: any) {
    updateError.value = requestError?.response?.data?.error || 'Could not update this feedback status.';
  } finally {
    savingStatus.value = false;
  }
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    bug: 'Problem report',
    'feature-request': 'Feature request',
    usability: 'Usability',
    general: 'General'
  };
  return labels[category] || 'Feedback';
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    new: 'New',
    'in-review': 'In review',
    resolved: 'Resolved'
  };
  return labels[status] || status;
}

function formatDate(value?: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

onMounted(() => { void loadFeedback(1); });
</script>

<style scoped>
.feedback-inbox { display: grid; gap: 12px; color: #dcecff; }
.inbox-toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; padding: 15px; border: 1px solid #163d62; border-radius: 8px; background: linear-gradient(145deg, #082241, #06192f); }
.inbox-eyebrow { margin: 0 0 4px; color: #68b7f5; font-size: 8px; font-weight: 750; letter-spacing: .08em; }
.inbox-toolbar h2 { margin: 0; color: #edf6ff; font-size: 17px; font-weight: 700; }
.inbox-description { margin: 5px 0 0; color: #94aec7; font-size: 10px; }
.toolbar-actions { display: flex; align-items: flex-end; gap: 8px; }
.filter-control { display: grid; gap: 4px; color: #9db9d8; font-size: 9px; }
.filter-control select,.status-editor-controls select { min-height: 34px; padding: 6px 9px; border: 1px solid #285279; border-radius: 5px; color: #dcecff; background: #071d39; font: inherit; font-size: 10px; }
.refresh-button,.status-editor-controls button { display: inline-flex; min-height: 34px; align-items: center; justify-content: center; gap: 6px; padding: 7px 10px; border: 1px solid #168bff; border-radius: 5px; color: #fff; background: #0876d8; cursor: pointer; font-size: 10px; font-weight: 650; }
.refresh-button:disabled,.status-editor-controls button:disabled { opacity: .55; cursor: not-allowed; }
.spinning { animation: spin .8s linear infinite; }
.inbox-summary { display: flex; justify-content: space-between; color: #91acc9; font-size: 9px; }
.inbox-summary strong { color: #dcecff; font-size: 11px; }
.inbox-layout { display: grid; grid-template-columns: minmax(280px, .85fr) minmax(0, 1.5fr); gap: 12px; align-items: start; }
.submission-list,.submission-detail { min-width: 0; overflow: hidden; border: 1px solid #163d62; border-radius: 8px; background: linear-gradient(145deg, #082241, #06192f); }
.submission-list { display: grid; align-content: start; }
.submission-card { display: grid; gap: 7px; width: 100%; padding: 12px; border: 0; border-bottom: 1px solid rgba(25, 66, 103, .75); color: inherit; text-align: left; background: transparent; cursor: pointer; }
.submission-card:hover,.submission-card.selected { background: rgba(12, 71, 120, .48); }
.submission-card.selected { box-shadow: inset 3px 0 #45a9ff; }
.submission-meta,.submission-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px; }
.category-label { display: inline-flex; width: fit-content; padding: 3px 7px; border: 1px solid #285279; border-radius: 999px; color: #9ed2ff; background: rgba(12, 66, 111, .35); font-size: 8px; font-weight: 650; }
.status-label { display: inline-flex; width: fit-content; padding: 3px 7px; border: 1px solid #385571; border-radius: 999px; color: #c1d3e6; background: rgba(130, 160, 190, .1); font-size: 8px; font-weight: 700; white-space: nowrap; }
.status-new { border-color: rgba(255, 190, 80, .38); color: #ffd48a; background: rgba(150, 94, 0, .15); }
.status-in-review { border-color: rgba(93, 174, 255, .38); color: #9ed2ff; background: rgba(14, 88, 153, .2); }
.status-resolved { border-color: rgba(67, 213, 168, .35); color: #83e0c3; background: rgba(0, 130, 103, .16); }
.submission-subject { overflow: hidden; color: #e7f2ff; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.submission-preview { display: -webkit-box; overflow: hidden; color: #9bb4ce; font-size: 9px; line-height: 1.45; line-clamp: 2; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.submission-footer { color: #7898b7; font-size: 8px; }
.submission-footer time { white-space: nowrap; }
.list-state { display: grid; min-height: 175px; place-content: center; justify-items: center; gap: 8px; padding: 18px; color: #91acc9; font-size: 10px; text-align: center; }
.list-state > i { color: #65baff; font-size: 23px; }
.list-state strong { color: #dcecff; font-size: 12px; }
.list-state button { border: 0; color: #75c4ff; background: transparent; cursor: pointer; }
.state-error { color: #ffbaba; }
.pagination-controls { display: flex; justify-content: space-between; gap: 8px; padding: 10px; }
.pagination-controls button { min-height: 30px; padding: 5px 8px; border: 1px solid #285279; border-radius: 5px; color: #b9d5ef; background: transparent; cursor: pointer; font-size: 9px; }
.pagination-controls button:disabled { opacity: .4; cursor: not-allowed; }
.submission-detail { min-height: 420px; padding: 16px; }
.detail-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid #173b60; }
.detail-header h3 { margin: 8px 0 4px; color: #edf6ff; font-size: 16px; }
.detail-header p { margin: 0; color: #8faac5; font-size: 9px; }
.sender-card { display: flex; align-items: center; gap: 10px; margin: 14px 0; padding: 10px; border: 1px solid #21476d; border-radius: 6px; background: rgba(4, 24, 47, .55); }
.sender-avatar { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border-radius: 50%; color: #bde2ff; background: #10487e; }
.sender-card > div { display: grid; gap: 3px; }
.sender-card strong { color: #dcecff; font-size: 10px; }
.sender-card a,.sender-card small { color: #82bff3; font-size: 9px; text-decoration: none; }
.rating-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid rgba(22, 61, 96, .65); color: #9db9d8; font-size: 10px; }
.rating-row strong { color: #ffd48a; }
.message-section { padding: 15px 0; }
.message-section h4,.status-editor h4 { margin: 0 0 7px; color: #dcecff; font-size: 11px; font-weight: 700; }
.message-section p { margin: 0; color: #b5cbe0; font-size: 11px; line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; }
.status-editor { display: grid; gap: 10px; margin-top: 6px; padding: 13px; border: 1px solid #21476d; border-radius: 7px; background: rgba(4, 24, 47, .55); }
.status-editor h4 { margin-bottom: 3px; }
.status-editor p { margin: 0; color: #91acc9; font-size: 9px; }
.status-editor-controls { display: flex; flex-wrap: wrap; gap: 8px; }
.status-editor-controls select { min-width: 140px; flex: 1; }
.status-editor-controls button { min-width: 105px; }
.status-editor .update-message { color: #83e0c3; }
.status-editor .update-error { color: #ffaaaa; }
.detail-empty { display: grid; min-height: 385px; place-content: center; justify-items: center; gap: 9px; color: #91acc9; font-size: 10px; text-align: center; }
.detail-empty i { color: #65baff; font-size: 27px; }
.detail-empty strong { color: #e7f2ff; font-size: 13px; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 850px) { .inbox-layout { grid-template-columns: minmax(0, 1fr); } .submission-detail { min-height: 300px; } }
@media (max-width: 560px) { .inbox-toolbar { align-items: stretch; flex-direction: column; } .toolbar-actions { justify-content: space-between; } .detail-header { flex-direction: column; } }
</style>
