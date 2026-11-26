<template>
  <section class="repository-governance">
    <header class="governance-heading">
      <div><h2>Case Repository governance</h2><p>Moderate archived case records, review community reports and oversee individual evidence-access decisions.</p></div>
      <div class="heading-actions">
        <button type="button" class="organisation-link" @click="router.push('/organizations')"><i class="bi bi-buildings"></i> Organisation approvals</button>
        <button type="button" class="governance-refresh" :disabled="loading" @click="loadAll"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
      </div>
    </header>

    <p v-if="error" class="governance-alert error" role="alert">{{ error }}</p>
    <p v-if="success" class="governance-alert success" role="status">{{ success }}</p>

    <div class="governance-stats">
      <article><span>Open reports</span><strong>{{ summary.pendingReports || 0 }}</strong><small>Pending or in review</small></article>
      <article><span>Evidence requests</span><strong>{{ summary.pendingAccessRequests || 0 }}</strong><small>Awaiting investigator decision</small></article>
      <article><span>Cases under review</span><strong>{{ summary.underReviewCases || 0 }}</strong><small>Temporarily withheld from repository</small></article>
      <article><span>Hidden contributions</span><strong>{{ summary.hiddenContributions || 0 }}</strong><small>Preserved for possible restoration</small></article>
    </div>

    <nav class="governance-tabs" aria-label="Repository governance sections">
      <button v-for="tab in tabs" :key="tab.id" type="button" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id"><i :class="'bi bi-' + tab.icon"></i>{{ tab.label }}</button>
    </nav>

    <section v-if="activeTab === 'reports'" class="governance-panel">
      <div class="panel-heading"><div><h3>Community reports</h3><p>Review reports submitted about case records and discussion contributions.</p></div><span>{{ reports.length }} records</span></div>
      <div v-if="loading" class="panel-empty">Loading reports…</div>
      <div v-else-if="!reports.length" class="panel-empty">No reports match this filter.</div>
      <article v-for="report in reports" :key="report._id" class="moderation-record">
        <div class="record-topline"><span class="record-kind">{{ report.targetType }} report · {{ categoryLabel(report.category) }}</span><span class="record-status" :class="report.status">{{ report.status.replace('_',' ') }}</span></div>
        <h4>{{ report.caseNumber }} · {{ report.caseTitle }}</h4>
        <p class="record-meta">Submitted by {{ report.reporterName }} · {{ formatDate(report.createdAt) }}</p>
        <p class="record-description">{{ report.description }}</p>
        <label>Review note
          <textarea v-model.trim="reportNotes[report._id]" rows="2" maxlength="2000" placeholder="Record the moderation decision or next step..."></textarea>
        </label>
        <div class="record-actions">
          <button type="button" class="subtle-action" :disabled="savingId === report._id" @click="updateReport(report,'in_review')">Mark in review</button>
          <button type="button" class="subtle-action" :disabled="savingId === report._id" @click="updateReport(report,'dismissed')">Dismiss report</button>
          <button type="button" class="primary-action" :disabled="savingId === report._id" @click="updateReport(report,'actioned')">Mark actioned</button>
        </div>
      </article>
    </section>

    <section v-else-if="activeTab === 'cases'" class="governance-panel">
      <div class="panel-heading"><div><h3>Case repository moderation</h3><p>Repository visibility is separate from the operational DESS case status. Moderation never deletes or reopens a case.</p></div><span>{{ cases.length }} cases</span></div>
      <input v-model="caseSearch" class="governance-search" placeholder="Search case reference, title or description..." />
      <div v-if="loading" class="panel-empty">Loading archived cases…</div>
      <div v-else-if="!filteredCases.length" class="panel-empty">No repository cases found.</div>
      <article v-for="item in filteredCases" :key="item._id" class="moderation-record">
        <div class="record-topline"><span class="record-kind">{{ item.caseId }}</span><span class="record-status" :class="item.repositoryStatus">{{ item.repositoryStatus.replace('_',' ') }}</span></div>
        <h4>{{ item.name }}</h4>
        <p class="record-meta">{{ item.caseType }} · {{ item.evidenceCount }} evidence items · {{ item.sharedEvidenceCount }} globally shared · {{ item.reportCount }} open reports</p>
        <p class="record-description">{{ item.description || 'No description provided.' }}</p>
        <div class="moderation-controls">
          <label>Repository status
            <select v-model="caseDrafts[item._id].status">
              <option value="visible">Visible</option><option value="under_review">Under review</option><option value="hidden">Hidden</option>
            </select>
          </label>
          <label>Reason (required for review or hidden)
            <textarea v-model.trim="caseDrafts[item._id].reason" rows="2" maxlength="1200" placeholder="Explain why this record needs moderation..."></textarea>
          </label>
        </div>
        <div class="record-actions"><small>Assigned investigators: {{ (item.investigatorNames || []).join(', ') || 'Not recorded' }}</small><button type="button" class="primary-action" :disabled="savingId === item._id" @click="moderateCase(item)">{{ savingId === item._id ? 'Saving…' : 'Save moderation status' }}</button></div>
      </article>
    </section>

    <section v-else-if="activeTab === 'contributions'" class="governance-panel">
      <div class="panel-heading"><div><h3>Research contribution management</h3><p>Hide contributions that breach repository standards. Hidden content is retained and can be restored.</p></div><span>{{ contributions.length }} records</span></div>
      <div class="filter-row"><input v-model="contributionSearch" class="governance-search" placeholder="Search author, case or contribution..." /><select v-model="contributionFilter" aria-label="Filter contributions"><option value="">All moderation states</option><option value="visible">Visible</option><option value="hidden">Hidden</option></select></div>
      <div v-if="loading" class="panel-empty">Loading contributions…</div>
      <div v-else-if="!filteredContributions.length" class="panel-empty">No contributions match this filter.</div>
      <article v-for="item in filteredContributions" :key="item._id" class="moderation-record">
        <div class="record-topline"><span class="record-kind">{{ item.case?.caseId || 'Case unavailable' }} · {{ item.authorName }}</span><span class="record-status" :class="item.moderationStatus">{{ item.moderationStatus }}</span></div>
        <p class="record-description contribution-content">{{ item.content }}</p>
        <p class="record-meta">Posted {{ formatDate(item.createdAt) }} · {{ item.reportCount || 0 }} open report(s)</p>
        <label>Moderation reason
          <textarea v-model.trim="contributionDrafts[item._id].reason" rows="2" maxlength="1200" placeholder="Required when hiding a contribution..."></textarea>
        </label>
        <div class="record-actions">
          <small>{{ item.moderationReason ? 'Previous reason: ' + item.moderationReason : 'No moderation note recorded.' }}</small>
          <button v-if="item.moderationStatus !== 'hidden'" type="button" class="danger-action" :disabled="savingId === item._id || (contributionDrafts[item._id].reason || '').trim().length < 5" @click="moderateContribution(item,'hidden')">Hide contribution</button>
          <button v-else type="button" class="primary-action" :disabled="savingId === item._id" @click="moderateContribution(item,'visible')">Restore contribution</button>
        </div>
      </article>
    </section>

    <section v-else-if="activeTab === 'access'" class="governance-panel">
      <div class="panel-heading"><div><h3>Evidence access oversight</h3><p>Read-only oversight of researcher requests. The assigned investigator remains responsible for selecting and approving exact evidence items.</p></div><span>{{ accessRequests.length }} requests</span></div>
      <div v-if="loading" class="panel-empty">Loading evidence requests…</div>
      <div v-else-if="!accessRequests.length" class="panel-empty">No evidence access requests have been submitted.</div>
      <div v-else class="table-wrap">
        <table class="governance-table">
          <thead><tr><th>Case</th><th>Researcher</th><th>Purpose</th><th>Status</th><th>Decision</th><th>Submitted</th></tr></thead>
          <tbody>
            <tr v-for="request in accessRequests" :key="request._id">
              <td><strong>{{ request.caseNumber }}</strong><small>{{ request.caseTitle }}</small></td>
              <td><strong>{{ request.requesterName }}</strong><small>{{ request.requesterUserType || 'Researcher' }} · {{ request.requesterOrganization || 'No organisation' }}</small></td>
              <td class="purpose-cell">{{ request.purpose }}</td>
              <td><span class="record-status" :class="request.status">{{ request.status }}</span></td>
              <td>{{ request.approvedEvidenceIds?.length || 0 }} item(s)<small v-if="request.reviewedByName">{{ request.reviewedByName }}</small></td>
              <td>{{ formatDate(request.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-else class="governance-panel overview-panel">
      <div class="panel-heading"><div><h3>Governance overview</h3><p>Use the sections above to investigate reports, manage visibility and review access activity.</p></div></div>
      <div class="overview-guidance">
        <article><i class="bi bi-flag"></i><strong>Case moderation</strong><p>Temporarily place a case under review or hide it from researchers without changing its DESS operational status.</p><button type="button" @click="activeTab='cases'">Review cases</button></article>
        <article><i class="bi bi-person-check"></i><strong>Evidence access</strong><p>Researchers submit a purpose; assigned investigators decide which specific evidence can be released.</p><button type="button" @click="activeTab='access'">View access oversight</button></article>
        <article><i class="bi bi-chat-square-text"></i><strong>Contribution management</strong><p>Review community reports and hide or restore discussion contributions while retaining moderation history.</p><button type="button" @click="activeTab='contributions'">Manage contributions</button></article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { API_CONFIG } from '@/config';

const router = useRouter();
const tabs = [
  { id:'overview', label:'Overview', icon:'grid-1x2' },
  { id:'reports', label:'Reports', icon:'flag' },
  { id:'cases', label:'Case moderation', icon:'folder-check' },
  { id:'contributions', label:'Contributions', icon:'chat-square-text' },
  { id:'access', label:'Evidence access', icon:'person-check' }
];
const activeTab = ref('overview');
const loading = ref(false);
const savingId = ref('');
const error = ref('');
const success = ref('');
const summary = ref<any>({});
const reports = ref<any[]>([]);
const cases = ref<any[]>([]);
const contributions = ref<any[]>([]);
const accessRequests = ref<any[]>([]);
const caseSearch = ref('');
const contributionSearch = ref('');
const contributionFilter = ref('');
const reportNotes = ref<Record<string,string>>({});
const caseDrafts = ref<Record<string,{status:string;reason:string}>>({});
const contributionDrafts = ref<Record<string,{reason:string}>>({});
const filteredCases = computed(() => cases.value.filter(item => {
  const text = `${item.caseId || ''} ${item.name || ''} ${item.description || ''}`.toLowerCase();
  return text.includes(caseSearch.value.toLowerCase());
}));
const filteredContributions = computed(() => contributions.value.filter(item => {
  const text = `${item.authorName || ''} ${item.case?.caseId || ''} ${item.content || ''}`.toLowerCase();
  const statusMatch = !contributionFilter.value || item.moderationStatus === contributionFilter.value;
  return statusMatch && text.includes(contributionSearch.value.toLowerCase());
}));

function headers() {
  return { 'Content-Type':'application/json', Authorization:`Bearer ${sessionStorage.getItem('dess_token') || ''}` };
}
function url(path:string) { return `${API_CONFIG.baseURL}/api/repository-governance${path}`; }
async function api(path:string, options:RequestInit = {}) {
  const response = await fetch(url(path), { ...options, headers:{...headers(), ...(options.headers || {})}, credentials:'include' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The governance request failed.');
  return data;
}
function formatDate(value?:string) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleString();
}
function categoryLabel(value:string) {
  return String(value || 'other').replace(/_/g,' ').replace(/\b\w/g, char => char.toUpperCase());
}
async function loadAll() {
  loading.value = true; error.value = '';
  try {
    const [summaryData,reportData,caseData,contributionData,accessData] = await Promise.all([
      api('/admin/summary'),api('/admin/reports'),api('/admin/cases'),
      api('/admin/contributions'),api('/admin/access-requests')
    ]);
    summary.value = summaryData;
    reports.value = reportData.reports || [];
    cases.value = caseData.cases || [];
    contributions.value = contributionData.contributions || [];
    accessRequests.value = accessData.requests || [];
    reportNotes.value = Object.fromEntries(reports.value.map(item => [item._id, reportNotes.value[item._id] || item.reviewNote || '']));
    caseDrafts.value = Object.fromEntries(cases.value.map(item => [item._id, caseDrafts.value[item._id] || {status:item.repositoryStatus || 'visible',reason:item.repositoryModerationReason || ''}]));
    contributionDrafts.value = Object.fromEntries(contributions.value.map(item => [item._id, contributionDrafts.value[item._id] || {reason:''}]));
  } catch (loadError:any) {
    error.value = loadError?.message || 'Could not load repository governance data.';
  } finally { loading.value = false; }
}
async function updateReport(report:any,status:'in_review'|'actioned'|'dismissed') {
  savingId.value = report._id; error.value=''; success.value='';
  try {
    await api(`/admin/reports/${encodeURIComponent(report._id)}`, {method:'PATCH',body:JSON.stringify({status,reviewNote:reportNotes.value[report._id] || ''})});
    success.value = `Report for ${report.caseNumber} marked ${status.replace('_',' ')}.`;
    await loadAll();
  } catch (saveError:any) { error.value = saveError?.message || 'Could not update the report.'; }
  finally { savingId.value=''; }
}
async function moderateCase(item:any) {
  const draft = caseDrafts.value[item._id];
  if (!draft) return;
  if (draft.status !== 'visible' && draft.reason.trim().length < 5) { error.value='Add a reason before placing a case under review or hiding it.'; return; }
  savingId.value=item._id; error.value=''; success.value='';
  try {
    await api(`/admin/cases/${encodeURIComponent(item._id)}/moderation`, {method:'PATCH',body:JSON.stringify({status:draft.status,reason:draft.reason})});
    success.value = `${item.caseId} repository visibility updated to ${draft.status.replace('_',' ')}.`;
    await loadAll();
  } catch (saveError:any) { error.value = saveError?.message || 'Could not update case moderation.'; }
  finally { savingId.value=''; }
}
async function moderateContribution(item:any,status:'visible'|'hidden') {
  const reason = contributionDrafts.value[item._id]?.reason || '';
  if (status === 'hidden' && reason.trim().length < 5) { error.value='Add a reason before hiding a contribution.'; return; }
  savingId.value=item._id; error.value=''; success.value='';
  try {
    await api(`/admin/contributions/${encodeURIComponent(item._id)}/moderation`, {method:'PATCH',body:JSON.stringify({status,reason})});
    success.value = status === 'hidden' ? 'Contribution hidden from the public repository view.' : 'Contribution restored to the repository view.';
    await loadAll();
  } catch (saveError:any) { error.value = saveError?.message || 'Could not update contribution moderation.'; }
  finally { savingId.value=''; }
}
onMounted(() => { void loadAll(); });
</script>

<style scoped>
.repository-governance { display:grid; gap:14px; color:#dcecff; }
.governance-heading,.panel-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
.governance-heading h2 { margin:0; color:#eaf5ff; font-size:16px; }.governance-heading p,.panel-heading p { margin:5px 0 0; color:#91acc9; font-size:10px; line-height:1.55; }
.heading-actions { display:flex; flex-wrap:wrap; gap:7px; }
.governance-refresh,.organisation-link { min-height:31px; padding:6px 9px; border:1px solid #245783; border-radius:5px; color:#d8edff; background:#0b3155; cursor:pointer; font-size:9px; font-weight:650; }
.organisation-link { border-color:#246b65; color:#a5e2d1; background:#0b383b; }
.governance-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:9px; }
.governance-stats article,.governance-panel { border:1px solid #143b60; border-radius:7px; background:#071d39; }
.governance-stats article { display:grid; gap:5px; padding:12px; }.governance-stats span,.governance-stats small { color:#8daac7; font-size:9px; }.governance-stats strong { color:#e9f5ff; font-size:20px; }.governance-stats small { font-size:8px; }
.governance-tabs { display:flex; gap:5px; overflow-x:auto; padding-bottom:2px; }
.governance-tabs button { display:inline-flex; min-height:34px; flex:0 0 auto; align-items:center; gap:6px; padding:7px 10px; border:1px solid #20486b; border-radius:5px; color:#a9c3dc; background:#081f3a; cursor:pointer; font-size:9px; font-weight:650; }
.governance-tabs button.active { border-color:#237bb4; color:#eff8ff; background:#0d3c67; }
.governance-panel { display:grid; gap:12px; padding:14px; }
.panel-heading { align-items:center; padding-bottom:10px; border-bottom:1px solid #173f62; }.panel-heading h3 { margin:0; color:#e7f3ff; font-size:13px; }.panel-heading span { color:#82a1bd; font-size:9px; white-space:nowrap; }
.moderation-record { display:grid; gap:9px; padding:13px; border:1px solid #183f62; border-radius:7px; background:#06182e; }
.record-topline { display:flex; justify-content:space-between; align-items:center; gap:10px; }.record-kind { color:#77c5ff; font-size:8px; font-weight:800; text-transform:uppercase; letter-spacing:.06em; }.record-status { display:inline-flex; width:max-content; padding:4px 7px; border-radius:4px; color:#d4e5f4; background:#1a3b5c; font-size:8px; font-weight:750; text-transform:capitalize; }.record-status.pending,.record-status.in_review,.record-status.under_review { color:#f0d38e; background:#403419; }.record-status.hidden,.record-status.dismissed { color:#efb9c2; background:#472a37; }.record-status.visible,.record-status.actioned,.record-status.approved { color:#9de5ca; background:#123d35; }
.moderation-record h4 { margin:0; color:#e8f4ff; font-size:12px; }.record-meta { margin:0; color:#7e9bb7; font-size:8px; }.record-description { margin:0; color:#c4d9eb; font-size:10px; line-height:1.65; white-space:pre-wrap; overflow-wrap:anywhere; }.contribution-content { padding:9px; border-left:2px solid #287bb1; background:#081e36; }
.moderation-record label { display:grid; gap:5px; color:#9eb9d2; font-size:9px; font-weight:700; }
.moderation-record textarea,.moderation-record select,.governance-search,.filter-row select { width:100%; padding:8px; border:1px solid #294f70; border-radius:5px; color:#dcecff; background:#07182c; font-size:9px; }
.moderation-record textarea { min-height:52px; resize:vertical; }.moderation-record select { max-width:220px; }
.moderation-controls { display:grid; grid-template-columns:minmax(150px,.55fr) minmax(0,1.45fr); gap:10px; }.moderation-controls label { align-content:start; }
.record-actions { display:flex; align-items:center; justify-content:space-between; gap:10px; }.record-actions small { color:#829fba; font-size:8px; }
.primary-action,.subtle-action,.danger-action { min-height:29px; padding:6px 9px; border:1px solid #1d825f; border-radius:5px; color:#e4f7ef; background:#126044; cursor:pointer; font-size:8px; font-weight:700; }.subtle-action { border-color:#315574; color:#c0d8ec; background:#0b2b49; }.danger-action { border-color:#754a57; color:#f0c4ca; background:#38232e; }
.primary-action:disabled,.subtle-action:disabled,.danger-action:disabled,.governance-refresh:disabled { opacity:.45; cursor:not-allowed; }
.record-actions:has(.subtle-action) { flex-wrap:wrap; }.governance-search { max-width:450px; }.filter-row { display:flex; gap:8px; }.filter-row select { max-width:180px; }
.table-wrap { overflow-x:auto; } .governance-table { width:100%; min-width:850px; border-collapse:collapse; text-align:left; }.governance-table th,.governance-table td { padding:9px; border-bottom:1px solid #153b5c; color:#c7dced; vertical-align:top; font-size:8px; }.governance-table th { color:#83a2bf; background:#06182e; }.governance-table td strong,.governance-table td small { display:block; }.governance-table td small { margin-top:3px; color:#7997b4; font-size:8px; }.purpose-cell { min-width:240px; white-space:normal; line-height:1.5; }
.panel-empty { padding:22px; color:#8daac7; text-align:center; font-size:10px; }.governance-alert { margin:0; padding:9px 11px; border-radius:5px; font-size:9px; }.governance-alert.error { color:#ffc0c0; background:#3c202b; }.governance-alert.success { color:#9ce4c6; background:#123b34; }
.overview-guidance { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }.overview-guidance article { display:grid; align-content:start; justify-items:start; gap:8px; padding:14px; border:1px solid #173f62; border-radius:7px; background:#06182e; }.overview-guidance i { color:#73c4ff; font-size:18px; }.overview-guidance strong { color:#e5f2ff; font-size:11px; }.overview-guidance p { margin:0; color:#8eaac4; font-size:9px; line-height:1.6; }.overview-guidance button { min-height:28px; padding:5px 8px; border:1px solid #27577c; border-radius:4px; color:#cfe8ff; background:#0b3155; cursor:pointer; font-size:8px; }
@media(max-width:850px) { .governance-stats { grid-template-columns:repeat(2,minmax(0,1fr)); }.overview-guidance { grid-template-columns:1fr; } }
@media(max-width:650px) { .governance-heading,.panel-heading,.record-actions { align-items:flex-start; flex-direction:column; }.heading-actions { width:100%; }.heading-actions button { flex:1; }.moderation-controls { grid-template-columns:1fr; }.filter-row { flex-direction:column; }.filter-row select,.governance-search { max-width:none; }.record-actions button { width:100%; }.record-actions > small { line-height:1.5; } }
</style>
