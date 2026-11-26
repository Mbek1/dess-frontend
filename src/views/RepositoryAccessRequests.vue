<template>
  <main class="access-inbox-page">
    <header class="access-inbox-header">
      <div>
        <p class="access-eyebrow">DESS · CASE REPOSITORY GOVERNANCE</p>
        <h1>Research evidence access requests</h1>
        <p>Review requests from researchers linked to cases assigned to you. You decide which specific evidence items may be shared.</p>
      </div>
      <button type="button" class="refresh-control" :disabled="loading" @click="loadRequests"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
    </header>

    <section class="access-inbox-stats">
      <article><span>Pending requests</span><strong>{{ requests.length }}</strong></article>
      <article><span>Selected evidence items</span><strong>{{ selectedTotal }}</strong></article>
      <article><span>Decision model</span><strong>Per researcher</strong></article>
    </section>

    <p v-if="error" class="inbox-alert error" role="alert">{{ error }}</p>
    <p v-if="success" class="inbox-alert success" role="status">{{ success }}</p>
    <div v-if="loading" class="inbox-empty"><i class="bi bi-arrow-repeat"></i> Loading access requests…</div>
    <div v-else-if="!requests.length" class="inbox-empty"><i class="bi bi-shield-check"></i><strong>No pending requests</strong><span>New research evidence access requests for your assigned closed cases will appear here.</span></div>

    <section v-else class="access-request-list">
      <article v-for="request in requests" :key="request._id" class="request-card">
        <header class="request-card-header">
          <div>
            <span class="case-reference">{{ request.caseNumber }}</span>
            <h2>{{ request.caseTitle }}</h2>
            <p>{{ request.requesterName }} <span v-if="request.requesterUserType">· {{ request.requesterUserType }}</span><span v-if="request.requesterOrganization"> · {{ request.requesterOrganization }}</span></p>
          </div>
          <span class="request-status"><i class="bi bi-hourglass-split"></i> Pending</span>
        </header>
        <section class="research-purpose">
          <span class="field-label">RESEARCH PURPOSE</span>
          <p>{{ request.purpose }}</p>
          <small>Submitted {{ formatDate(request.createdAt) }}</small>
        </section>
        <section class="evidence-selection">
          <div class="evidence-selection-heading">
            <div><span class="field-label">EVIDENCE RELEASE SELECTION</span><h3>Select the individual items you are willing to share</h3></div>
            <span class="selection-count">{{ selectedIds(request._id).length }} selected</span>
          </div>
          <div v-if="!request.restrictedEvidence?.length" class="no-evidence">No eligible restricted evidence items remain for this request.</div>
          <label v-for="evidence in request.restrictedEvidence || []" :key="evidence._id" class="evidence-choice">
            <input
              type="checkbox"
              :checked="selectedIds(request._id).includes(evidence._id)"
              @change="toggleEvidence(request._id, evidence._id, ($event.target as HTMLInputElement).checked)"
            />
            <span class="choice-icon"><i class="bi bi-file-earmark-lock"></i></span>
            <span class="choice-copy"><strong>{{ evidence.name }}</strong><small>{{ evidence.type || 'Unclassified' }} · {{ evidence.format || 'File' }}<span v-if="evidence.fileSize"> · {{ formatSize(evidence.fileSize) }}</span></small><small v-if="evidence.description">{{ evidence.description }}</small></span>
            <time v-if="evidence.uploadedAt">{{ formatDate(evidence.uploadedAt) }}</time>
          </label>
        </section>
        <label class="decision-note">Decision note
          <textarea v-model.trim="decisionNotes[request._id]" rows="2" maxlength="1200" placeholder="Add a reason for your decision. Required when declining."></textarea>
        </label>
        <footer class="request-actions">
          <span class="release-note"><i class="bi bi-lock-fill"></i> Approval grants access only to this researcher. It does not change global evidence visibility.</span>
          <div>
            <button type="button" class="decline-control" :disabled="savingId === request._id || (decisionNotes[request._id] || '').trim().length < 5" @click="reviewRequest(request, 'declined')">{{ savingId === request._id ? 'Saving…' : 'Decline request' }}</button>
            <button type="button" class="approve-control" :disabled="savingId === request._id || !selectedIds(request._id).length" @click="reviewRequest(request, 'approved')">{{ savingId === request._id ? 'Saving…' : 'Approve selected items' }}</button>
          </div>
        </footer>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { API_CONFIG } from '@/config';

interface EvidenceChoice {
  _id: string;
  name: string;
  description?: string;
  type?: string;
  format?: string;
  fileSize?: number;
  uploadedAt?: string;
}
interface AccessRequest {
  _id: string;
  caseId: string;
  caseNumber: string;
  caseTitle: string;
  requesterName: string;
  requesterUserType?: string;
  requesterOrganization?: string;
  purpose: string;
  createdAt: string;
  restrictedEvidence: EvidenceChoice[];
}

const requests = ref<AccessRequest[]>([]);
const selectedByRequest = ref<Record<string, string[]>>({});
const decisionNotes = ref<Record<string, string>>({});
const loading = ref(false);
const savingId = ref('');
const error = ref('');
const success = ref('');
const selectedTotal = computed(() => Object.values(selectedByRequest.value).reduce((sum, ids) => sum + ids.length, 0));

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sessionStorage.getItem('dess_token') || ''}`
  };
}
function apiUrl(path: string) { return `${API_CONFIG.baseURL}/api/repository-governance${path}`; }
function selectedIds(requestId: string) { return selectedByRequest.value[requestId] || []; }
function toggleEvidence(requestId: string, evidenceId: string, checked: boolean) {
  const current = new Set(selectedIds(requestId));
  if (checked) current.add(evidenceId);
  else current.delete(evidenceId);
  selectedByRequest.value = { ...selectedByRequest.value, [requestId]: [...current] };
}
function formatDate(value?: string) {
  if (!value) return 'Date not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not recorded' : date.toLocaleString();
}
function formatSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${Math.round((bytes / Math.pow(1024, index)) * 10) / 10} ${units[index]}`;
}
async function loadRequests() {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetch(apiUrl('/access-requests/inbox'), { headers: headers(), credentials: 'include' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not load access requests.');
    requests.value = data.requests || [];
    const next: Record<string, string[]> = {};
    for (const request of requests.value) {
      const valid = new Set((request.restrictedEvidence || []).map(item => item._id));
      next[request._id] = (selectedByRequest.value[request._id] || []).filter(id => valid.has(id));
    }
    selectedByRequest.value = next;
  } catch (loadError: any) {
    error.value = loadError?.message || 'Could not load access requests.';
  } finally {
    loading.value = false;
  }
}
async function reviewRequest(request: AccessRequest, decision: 'approved' | 'declined') {
  const evidenceIds = selectedIds(request._id);
  const decisionNote = (decisionNotes.value[request._id] || '').trim();
  if (decision === 'approved' && !evidenceIds.length) return;
  if (decision === 'declined' && decisionNote.length < 5) {
    error.value = 'Add a short reason before declining this request.';
    return;
  }
  savingId.value = request._id;
  error.value = '';
  success.value = '';
  try {
    const response = await fetch(apiUrl(`/access-requests/${encodeURIComponent(request._id)}/review`), {
      method: 'PATCH',
      headers: headers(),
      credentials: 'include',
      body: JSON.stringify({ decision, evidenceIds: decision === 'approved' ? evidenceIds : [], decisionNote })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not save the access decision.');
    success.value = decision === 'approved'
      ? `Approved ${data.approvedEvidenceCount || evidenceIds.length} selected evidence item(s) for ${request.requesterName}.`
      : `Declined the request from ${request.requesterName}.`;
    delete selectedByRequest.value[request._id];
    delete decisionNotes.value[request._id];
    await loadRequests();
  } catch (reviewError: any) {
    error.value = reviewError?.message || 'Could not save the access decision.';
  } finally {
    savingId.value = '';
  }
}
onMounted(() => { void loadRequests(); });
</script>

<style scoped>
.access-inbox-page { min-height:calc(100vh - 56px); padding:24px clamp(14px,2.2vw,32px) 38px; color:#e5f1ff; background:#04152d; }
.access-inbox-header { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; max-width:1250px; margin:0 auto 18px; }
.access-eyebrow,.field-label { margin:0 0 6px; color:#63b9ff; font-size:9px; font-weight:800; letter-spacing:.13em; }
.access-inbox-header h1 { margin:0; color:#f0f7ff; font-size:clamp(22px,2.5vw,30px); font-weight:800; }
.access-inbox-header p:last-child { max-width:780px; margin:6px 0 0; color:#93afca; font-size:11px; line-height:1.6; }
.refresh-control { min-height:35px; padding:7px 12px; border:1px solid #25577e; border-radius:7px; color:#d7ecff; background:#0b3155; cursor:pointer; font-size:10px; font-weight:650; }
.refresh-control:disabled { opacity:.5; cursor:wait; }
.access-inbox-stats { display:grid; max-width:1250px; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin:0 auto 15px; }
.access-inbox-stats article { display:grid; gap:5px; padding:13px 15px; border:1px solid #153d60; border-radius:9px; background:#071d39; }
.access-inbox-stats span { color:#89a8c7; font-size:9px; }
.access-inbox-stats strong { color:#e7f4ff; font-size:19px; }
.access-request-list { display:grid; max-width:1250px; gap:13px; margin:0 auto; }
.request-card { overflow:hidden; border:1px solid #164268; border-radius:11px; background:#071d39; box-shadow:0 8px 26px rgba(0,0,0,.12); }
.request-card-header { display:flex; justify-content:space-between; gap:15px; padding:17px 18px; border-bottom:1px solid #153b5c; background:linear-gradient(110deg,#09294a,#071d39); }
.case-reference { color:#68bdff; font-size:9px; font-weight:800; letter-spacing:.06em; }
.request-card-header h2 { margin:4px 0; color:#eaf5ff; font-size:16px; }
.request-card-header p { margin:0; color:#91abc4; font-size:10px; }
.request-status { display:inline-flex; height:max-content; align-items:center; gap:6px; padding:5px 9px; border:1px solid #705b2b; border-radius:20px; color:#eed18a; background:#332b19; font-size:8px; font-weight:750; white-space:nowrap; }
.research-purpose { display:grid; gap:6px; padding:14px 18px; border-bottom:1px solid #123653; }
.research-purpose p { margin:0; color:#d1e1ef; font-size:11px; line-height:1.7; white-space:pre-wrap; }
.research-purpose small { color:#7997b4; font-size:8px; }
.evidence-selection { display:grid; gap:10px; padding:15px 18px; }
.evidence-selection-heading { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.evidence-selection-heading h3 { margin:4px 0 0; color:#dbeeff; font-size:12px; }
.selection-count { padding:5px 8px; border-radius:15px; color:#9cddc7; background:#123b34; font-size:8px; font-weight:750; }
.evidence-choice { display:flex; align-items:center; gap:10px; padding:10px; border:1px solid #153d60; border-radius:8px; background:#06182e; cursor:pointer; }
.evidence-choice input { width:16px; height:16px; accent-color:#20ad7a; }
.choice-icon { display:grid; width:33px; height:33px; flex:0 0 33px; place-items:center; border-radius:8px; color:#81caff; background:#0c3154; }
.choice-copy { display:grid; min-width:0; flex:1; gap:3px; }
.choice-copy strong { overflow-wrap:anywhere; color:#e3f2ff; font-size:10px; }
.choice-copy small { color:#829fbb; font-size:8px; line-height:1.5; }
.evidence-choice time { color:#7795b1; font-size:8px; white-space:nowrap; }
.no-evidence { padding:15px; border:1px dashed #294b69; border-radius:8px; color:#9bb3ca; font-size:10px; text-align:center; }
.decision-note { display:grid; gap:6px; padding:0 18px 15px; color:#a8c0d6; font-size:9px; font-weight:700; }
.decision-note textarea { width:100%; min-height:58px; padding:9px; border:1px solid #285272; border-radius:7px; color:#dcecff; background:#06182e; font-size:10px; resize:vertical; }
.request-actions { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:12px 18px; border-top:1px solid #153b5c; background:#06172b; }
.release-note { display:flex; align-items:center; gap:6px; color:#829fba; font-size:8px; line-height:1.45; }
.release-note i { color:#79d5b3; }
.request-actions > div { display:flex; gap:7px; }
.approve-control,.decline-control { min-height:34px; padding:7px 11px; border-radius:6px; cursor:pointer; font-size:9px; font-weight:750; white-space:nowrap; }
.approve-control { border:1px solid #1b9f70; color:#fff; background:#168b62; }
.decline-control { border:1px solid #754a57; color:#f0c4ca; background:#38232e; }
.approve-control:disabled,.decline-control:disabled { opacity:.4; cursor:not-allowed; }
.inbox-empty { display:grid; max-width:650px; min-height:190px; align-content:center; justify-items:center; gap:8px; margin:0 auto; border:1px dashed #1c4569; border-radius:10px; color:#8eaac5; background:#071d39; font-size:10px; text-align:center; }
.inbox-empty i { color:#76c9b2; font-size:25px; }.inbox-empty strong { color:#dcecff; font-size:13px; }.inbox-empty span { max-width:430px; line-height:1.6; }
.inbox-alert { max-width:1250px; margin:0 auto 12px; padding:9px 11px; border-radius:6px; font-size:9px; }
.inbox-alert.error { color:#ffc0c0; background:#3c202b; }.inbox-alert.success { color:#9ce4c6; background:#123b34; }
@media(max-width:760px) {
  .access-inbox-header,.request-actions { align-items:stretch; flex-direction:column; }
  .access-inbox-header .refresh-control { align-self:flex-start; }
  .access-inbox-stats { grid-template-columns:1fr 1fr; }
  .request-card-header { flex-direction:column; }
  .request-actions > div { width:100%; }.request-actions > div button { flex:1; }
  .evidence-choice { flex-wrap:wrap; }.evidence-choice time { margin-left:59px; }
}
@media(max-width:420px) { .access-inbox-stats { grid-template-columns:1fr 1fr; }.request-card-header,.research-purpose,.evidence-selection { padding-right:12px; padding-left:12px; }.request-actions { padding:11px 12px; }.request-actions > div { flex-direction:column; } }
</style>
