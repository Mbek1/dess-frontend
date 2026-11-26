<template>
  <main class="researcher-page" :class="{ 'compact-list-view': compactLists }">
    <header class="repository-header">
      <div class="brand-mark"><i class="bi bi-archive-fill" aria-hidden="true"></i></div>
      <div class="repository-title">
        <p class="repository-eyebrow">CASE REPOSITORY</p>
        <h1>Closed case library</h1>
        <p>Review archived cases and evidence approved for research access.</p>
      </div>
      <button class="activity-button" type="button" @click="showNotifications = !showNotifications">
        <i class="bi bi-bell" aria-hidden="true"></i>
        Activity
        <span v-if="unreadNotifications" class="unread-count">{{ unreadNotifications }}</span>
      </button>
    </header>

    <section class="repository-stats" aria-label="Repository summary">
      <div class="stat-item"><span class="stat-icon"><i class="bi bi-folder2-open" aria-hidden="true"></i></span><span class="stat-copy"><small>Closed cases</small><strong>{{ stats.closedCases }}</strong></span></div>
      <div class="stat-item"><span class="stat-icon"><i class="bi bi-file-earmark-check" aria-hidden="true"></i></span><span class="stat-copy"><small>Shared evidence files</small><strong>{{ stats.sharedEvidence }}</strong></span></div>
      <div class="stat-item"><span class="stat-icon"><i class="bi bi-shield-lock" aria-hidden="true"></i></span><span class="stat-copy"><small>Research-restricted items</small><strong>{{ stats.restrictedEvidence }}</strong></span></div>
      <div class="stat-aside"><i class="bi bi-shield-check" aria-hidden="true"></i><span>Case and evidence access is managed by authorised case teams.</span></div>
    </section>

    <section v-if="showNotifications" class="activity-panel" aria-labelledby="activity-heading">
      <div class="activity-heading"><div><p class="section-eyebrow">ACCOUNT ACTIVITY</p><h2 id="activity-heading">Recent notifications</h2></div><button class="icon-button" type="button" aria-label="Close activity" @click="showNotifications = false"><i class="bi bi-x-lg" aria-hidden="true"></i></button></div>
      <div v-if="notificationsLoading" class="inline-state">Loading activity...</div>
      <div v-else-if="notifications.length === 0" class="inline-state">No recent notifications.</div>
      <div v-else class="activity-list">
        <button v-for="notification in notifications" :key="notification._id" class="activity-row" type="button" @click="openNotification(notification)">
          <span class="activity-mark" :class="activityTone(notification.kind)"><i class="bi" :class="activityIcon(notification.kind)" aria-hidden="true"></i></span>
          <span class="activity-copy"><strong>{{ notification.title }}</strong><small>{{ notification.body }}</small><time>{{ formatRelative(notification.createdAt) }}</time></span>
          <span v-if="!notification.readAt" class="activity-unread" aria-label="Unread"></span>
        </button>
      </div>
    </section>

    <section class="repository-toolbar" aria-label="Case search and filters">
      <label class="case-search" for="case-search">
        <i class="bi bi-search" aria-hidden="true"></i>
        <input id="case-search" v-model="search" type="search" placeholder="Search case ID, title, description or keywords" @input="scheduleSearch" />
        <kbd>/</kbd>
      </label>
      <label class="sort-control" for="case-type-filter"><span>Classification</span><select id="case-type-filter" v-model="caseTypeFilter" @change="loadCases"><option value="">All types</option><option value="civil">Civil</option><option value="criminal">Criminal</option></select></label>
      <label class="sort-control" for="evidence-type-filter"><span>Evidence</span><select id="evidence-type-filter" v-model="evidenceTypeFilter" @change="loadCases"><option value="">All evidence</option><option v-for="type in availableEvidenceTypes" :key="type" :value="type">{{ type }}</option></select></label>
      <label class="sort-control" for="organization-filter"><span>Organisation</span><select id="organization-filter" v-model="organizationFilter" @change="loadCases"><option value="">All organisations</option><option v-for="name in availableOrganizations" :key="name" :value="name">{{ name }}</option></select></label>
      <label class="sort-control" for="case-sort"><span>Sort</span><select id="case-sort" v-model="sortBy" @change="loadCases"><option value="createdAt">Date created</option><option value="updatedAt">Recently updated</option><option value="name">Case name</option><option value="caseId">Case ID</option><option value="caseType">Classification</option></select></label>
      <label class="sort-control order-control" for="case-order"><span>Order</span><select id="case-order" v-model="sortOrder" @change="loadCases"><option value="desc">Newest first</option><option value="asc">Oldest first</option></select></label>
      <button class="clear-filters-button" type="button" @click="clearFilters"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Clear filters</button>
    </section>

    <section class="case-results" aria-labelledby="results-heading">
      <div class="results-heading"><div><p class="section-eyebrow">ARCHIVED MATERIAL</p><h2 id="results-heading">Cases <span>{{ filteredCases.length }}</span></h2></div><div class="results-note"><i class="bi bi-info-circle" aria-hidden="true"></i> Restricted evidence is counted but not identifiable or downloadable.</div></div>
      <div v-if="loading" class="repository-state"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Loading repository</div>
      <div v-else-if="error" class="repository-state error-state" role="alert"><i class="bi bi-exclamation-circle" aria-hidden="true"></i>{{ error }}</div>
      <div v-else-if="filteredCases.length === 0" class="repository-state empty-state"><i class="bi bi-folder2-open" aria-hidden="true"></i><strong>No archived cases found</strong><span>Adjust your search or check back when a case has been closed.</span></div>
      <div v-else class="case-table-wrap">
        <table class="case-table">
          <thead><tr><th>Case</th><th>Classification</th><th>Evidence access</th><th>Archived</th><th><span class="visually-hidden">Actions</span></th></tr></thead>
          <tbody>
            <tr v-for="caseItem in paginatedCases" :key="caseItem._id">
              <td class="case-cell"><strong>{{ caseItem.caseId || `Case ${caseItem.number}` }}</strong><span>{{ caseItem.name }}</span><small>{{ caseItem.description }}</small></td>
              <td><span class="case-type">{{ capitalizeCase(caseItem.caseType) }}</span></td>
              <td><div class="access-counts"><span class="shared-count"><i class="bi bi-file-earmark-check" aria-hidden="true"></i>{{ sharedCount(caseItem) }} shared</span><span class="restricted-count"><i class="bi bi-lock" aria-hidden="true"></i>{{ restrictedCount(caseItem) }} restricted</span></div></td>
              <td class="date-cell">{{ formatDate(caseItem.updatedAt || caseItem.createdAt) }}</td>
              <td class="case-actions"><button class="details-button" type="button" @click="inspectCase(caseItem)"><i class="bi bi-eye" aria-hidden="true"></i> Details</button><button class="details-button" type="button" @click="saveBookmark(caseItem)"><i class="bi bi-bookmark-plus" aria-hidden="true"></i> Save</button><button class="download-button" type="button" :disabled="downloadingId === caseItem._id" @click="downloadCase(caseItem)"><i class="bi" :class="downloadingId === caseItem._id ? 'bi-arrow-repeat' : 'bi-download'" aria-hidden="true"></i>{{ downloadingId === caseItem._id ? 'Preparing' : 'Download' }}</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <nav v-if="totalPages > 1" class="repository-pagination" aria-label="Repository pages">
        <span>Showing {{ (currentPage - 1) * itemsPerPage + 1 }}–{{ Math.min(currentPage * itemsPerPage, filteredCases.length) }} of {{ filteredCases.length }} cases</span>
        <div class="pagination-actions">
          <button type="button" :disabled="currentPage === 1" @click="currentPage--"><i class="bi bi-chevron-left" aria-hidden="true"></i> Previous</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button type="button" :disabled="currentPage === totalPages" @click="currentPage++">Next <i class="bi bi-chevron-right" aria-hidden="true"></i></button>
        </div>
      </nav>
    </section>

    <div v-if="selectedCase" class="dialog-backdrop" @click.self="selectedCase = null">
      <section class="case-dialog" role="dialog" aria-modal="true" :aria-labelledby="`case-title-${selectedCase._id}`">
        <header class="dialog-header"><div><p class="section-eyebrow">CASE RECORD</p><h2 :id="`case-title-${selectedCase._id}`">{{ selectedCase.caseId || `Case ${selectedCase.number}` }}</h2><p>{{ selectedCase.name }}</p></div><button class="icon-button" type="button" aria-label="Close case details" @click="selectedCase = null"><i class="bi bi-x-lg" aria-hidden="true"></i></button></header>
        <div class="dialog-content">
          <div class="case-description"><span>Case description</span><p>{{ selectedCase.description || 'No description provided.' }}</p></div>
          <section class="related-cases-panel" aria-labelledby="related-cases-heading">
            <div class="related-cases-heading"><div><p class="section-eyebrow">DISCOVER MORE</p><h3 id="related-cases-heading">Related cases</h3></div><span v-if="relatedCases.length">{{ relatedCases.length }} suggestions</span></div>
            <div v-if="relatedLoading" class="related-state">Finding similar cases...</div>
            <div v-else-if="relatedCases.length" class="related-case-list">
              <button v-for="related in relatedCases" :key="related._id" class="related-case-row" type="button" @click="inspectCase(related)">
                <span class="related-case-icon"><i class="bi bi-diagram-3" aria-hidden="true"></i></span>
                <span class="related-case-copy"><strong>{{ related.caseId || related.name }}</strong><small>{{ related.name }} · {{ capitalizeCase(related.caseType) }}</small><small>{{ related.relevanceReasons?.join(' · ') }}</small></span>
                <i class="bi bi-arrow-up-right" aria-hidden="true"></i>
              </button>
            </div>
            <p v-else class="related-state">No sufficiently similar cases were found in the accessible archive.</p>
          </section>
          <div class="evidence-heading"><div><p class="section-eyebrow">EVIDENCE ACCESS</p><h3>{{ selectedCase.evidence.length }} items in case</h3></div><span class="access-legend"><i class="bi bi-unlock" aria-hidden="true"></i> Researcher approved</span></div>
          <div v-if="sharedEvidence(selectedCase).length" class="shared-evidence-list">
            <article v-for="evidence in sharedEvidence(selectedCase)" :key="evidence._id" class="shared-evidence-row">
              <span class="evidence-file-icon"><i class="bi bi-file-earmark-check" aria-hidden="true"></i></span>
              <span class="shared-evidence-copy"><strong>{{ evidence.name }}</strong><small>{{ evidence.type }} · {{ evidence.format }} · {{ evidence.description }}</small><code v-if="evidence.hash">SHA-256 {{ evidence.hash }}</code></span>
              <button class="evidence-save-button" type="button" @click="saveBookmark(selectedCase, evidence)"><i class="bi bi-bookmark-plus" aria-hidden="true"></i> Save</button><span class="available-label">Available in archive</span>
            </article>
          </div>
          <div v-else class="restricted-only">No evidence files have been shared with researchers.</div>
          <div v-if="restrictedCount(selectedCase)" class="restricted-summary"><i class="bi bi-shield-lock-fill" aria-hidden="true"></i><span><strong>{{ restrictedCount(selectedCase) }} restricted evidence item(s)</strong><small>These items remain visible to the assigned DESS team and are omitted from this case download.</small></span></div>
        </div>
        <footer class="dialog-footer"><span><i class="bi bi-shield-check" aria-hidden="true"></i> Research access is managed by the assigned DESS team.</span><button class="download-button" type="button" :disabled="downloadingId === selectedCase._id" @click="downloadCase(selectedCase)"><i class="bi bi-download" aria-hidden="true"></i> Download available files</button></footer>
      </section>
    </div>

    <div v-if="openCaseError" class="dialog-backdrop" @click.self="openCaseError = null">
      <section class="case-dialog open-case-dialog" role="dialog" aria-modal="true" aria-labelledby="open-case-title">
        <header class="dialog-header"><div><p class="section-eyebrow">SEARCH RESULT</p><h2 id="open-case-title">{{ openCaseError.caseId }}</h2><p>{{ openCaseError.name }}</p></div><button class="icon-button" type="button" aria-label="Close case notice" @click="openCaseError = null"><i class="bi bi-x-lg" aria-hidden="true"></i></button></header>
        <div class="dialog-content"><div class="open-case-status"><i class="bi bi-hourglass-split" aria-hidden="true"></i><span>This case is still open. Repository access becomes available after closure.</span></div><div v-if="openCaseError.createdBy" class="case-manager"><span class="person-initials">{{ initials(openCaseError.createdBy.name) }}</span><span><strong>{{ openCaseError.createdBy.name }}</strong><small>Case manager · {{ openCaseError.createdBy.email }}</small></span></div></div>
        <footer class="dialog-footer"><span>Contact is sent through DESS internal messages.</span><button v-if="openCaseError.createdBy" class="download-button" type="button" @click="contactInvestigator"><i class="bi bi-send" aria-hidden="true"></i> Contact case lead</button></footer>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { API_CONFIG } from '@/config';

interface EvidenceSummary {
  _id: string;
  availableToResearchers: boolean;
  name?: string;
  description?: string;
  type?: string;
  format?: string;
  hash?: string;
  uploadedAt?: string;
}
interface CaseRecord {
  _id: string;
  caseId: string;
  number: number;
  name: string;
  caseType: string;
  description: string;
  status: string;
  evidence: EvidenceSummary[];
  createdAt: string;
  updatedAt: string;
  relevanceScore?: number;
  relevanceReasons?: string[];
}
interface NotificationRecord {
  _id: string;
  kind: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
  link?: string;
}

const router = useRouter();
const search = ref('');
const caseTypeFilter = ref('');
const evidenceTypeFilter = ref('');
const organizationFilter = ref('');
const availableEvidenceTypes = ref<string[]>([]);
const availableOrganizations = ref<string[]>([]);
const relatedCases = ref<CaseRecord[]>([]);
const relatedLoading = ref(false);
const sortBy = ref('createdAt');
const sortOrder = ref('desc');
const allCases = ref<CaseRecord[]>([]);
const loading = ref(false);
const error = ref('');
const downloadingId = ref('');
const selectedCase = ref<CaseRecord | null>(null);
const openCaseError = ref<any>(null);
const showNotifications = ref(false);
const notifications = ref<NotificationRecord[]>([]);
const notificationsLoading = ref(false);
const unreadNotifications = ref(0);
const itemsPerPage = ref(20);
const currentPage = ref(1);
const compactLists = ref(false);
let searchTimer: ReturnType<typeof setTimeout> | undefined;
let refreshTimer: ReturnType<typeof setInterval> | undefined;

const getToken = () => sessionStorage.getItem('dess_token') || '';
const headers = () => ({ Authorization: `Bearer ${getToken()}` });
const filteredCases = computed(() => allCases.value);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredCases.value.length / itemsPerPage.value)));
const paginatedCases = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredCases.value.slice(start, start + itemsPerPage.value);
});
const stats = computed(() => ({
  closedCases: allCases.value.length,
  sharedEvidence: allCases.value.reduce((sum, item) => sum + sharedCount(item), 0),
  restrictedEvidence: allCases.value.reduce((sum, item) => sum + restrictedCount(item), 0)
}));

function syncUiPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem('dess_settings') || '{}');
    const requestedPageSize = Number(saved.itemsPerPage);
    itemsPerPage.value = [10, 20, 50].includes(requestedPageSize) ? requestedPageSize : 20;
    compactLists.value = saved.compactLists === true;
    currentPage.value = 1;
  } catch {
    itemsPerPage.value = 20;
    compactLists.value = false;
    currentPage.value = 1;
  }
}
function handleSettingsUpdated() {
  syncUiPreferences();
}

function sharedCount(caseItem: CaseRecord) { return caseItem.evidence.filter(item => item.availableToResearchers).length; }
function restrictedCount(caseItem: CaseRecord) { return caseItem.evidence.filter(item => !item.availableToResearchers).length; }
function sharedEvidence(caseItem: CaseRecord) { return caseItem.evidence.filter(item => item.availableToResearchers); }
function capitalizeCase(value: string) { return value ? value[0].toUpperCase() + value.slice(1) : 'Unclassified'; }
function initials(name?: string) { return (name || 'DESS').split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase(); }
function formatDate(value: string) { return value ? new Date(value).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not recorded'; }
function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return formatDate(value);
}
function activityIcon(kind: string) {
  if (kind.includes('DELETION')) return 'bi-trash3';
  if (kind === 'EVIDENCE_UPLOAD') return 'bi-file-earmark-plus';
  if (kind === 'EVIDENCE_VISIBILITY') return 'bi-eye';
  return 'bi-info-circle';
}
function activityTone(kind: string) { return kind.includes('DELETION') ? 'tone-warning' : kind === 'EVIDENCE_UPLOAD' ? 'tone-success' : 'tone-info'; }

function scheduleSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  currentPage.value = 1;
  searchTimer = setTimeout(() => { void loadCases(); }, 250);
}

async function loadCases() {
  loading.value = true;
  error.value = '';
  try {
    const params = new URLSearchParams({ sortBy: sortBy.value, order: sortOrder.value });
    if (search.value.trim()) params.set('search', search.value.trim());
    if (caseTypeFilter.value) params.set('caseType', caseTypeFilter.value);
    if (evidenceTypeFilter.value) params.set('evidenceType', evidenceTypeFilter.value);
    if (organizationFilter.value) params.set('organization', organizationFilter.value);
    const response = await fetch(`${API_CONFIG.baseURL}/api/researcher/cases?${params}`, { headers: headers() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load repository');
    allCases.value = data.closedCases || [];
    availableEvidenceTypes.value = data.filters?.evidenceTypes || [];
    availableOrganizations.value = data.filters?.organizations || [];
    currentPage.value = 1;
    openCaseError.value = data.openCaseFound && search.value.trim() ? data.openCaseFound : null;
  } catch (loadError: any) {
    error.value = loadError?.message || 'Failed to load the research repository.';
  } finally {
    loading.value = false;
  }
}

async function loadNotifications() {
  notificationsLoading.value = true;
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/notifications?limit=8`, { headers: headers() });
    const data = await response.json();
    if (response.ok) {
      notifications.value = data.notifications || [];
      unreadNotifications.value = data.unreadCount || 0;
    }
  } catch {
    notifications.value = [];
  } finally {
    notificationsLoading.value = false;
  }
}

async function openNotification(notification: NotificationRecord) {
  if (!notification.readAt) {
    await fetch(`${API_CONFIG.baseURL}/api/notifications/${notification._id}/read`, { method: 'PATCH', headers: headers() });
    notification.readAt = new Date().toISOString();
    unreadNotifications.value = Math.max(0, unreadNotifications.value - 1);
  }
  if (notification.link) await router.push(notification.link);
}

async function saveBookmark(caseItem: CaseRecord, evidence?: EvidenceSummary) {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/research-workspace/bookmarks`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseItem._id, ...(evidence ? { evidenceId: evidence._id } : {}) })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok && response.status !== 409) throw new Error(data.error || 'Could not save bookmark');
    error.value = response.status === 409 ? 'This item is already in your Research Workspace.' : '';
    if (response.ok) error.value = evidence ? 'Evidence saved to your Research Workspace.' : 'Case saved to your Research Workspace.';
  } catch (bookmarkError: any) {
    error.value = bookmarkError?.message || 'Could not save bookmark.';
  }
}

async function inspectCase(caseItem: CaseRecord) {
  selectedCase.value = caseItem;
  relatedCases.value = [];
  relatedLoading.value = true;
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/researcher/cases/${caseItem._id}/related`, { headers: headers() });
    const data = await response.json();
    if (response.ok) relatedCases.value = data.relatedCases || [];
  } catch {
    relatedCases.value = [];
  } finally {
    relatedLoading.value = false;
  }
}

function clearFilters() {
  search.value = '';
  caseTypeFilter.value = '';
  evidenceTypeFilter.value = '';
  organizationFilter.value = '';
  sortBy.value = 'createdAt';
  sortOrder.value = 'desc';
  currentPage.value = 1;
  void loadCases();
}

async function downloadCase(caseItem: CaseRecord) {
  downloadingId.value = caseItem._id;
  error.value = '';
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/researcher/cases/${caseItem._id}/download`, { headers: headers() });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Download failed');
    }
    const blob = await response.blob();
    const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || `${caseItem.caseId}-research-archive.zip`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  } catch (downloadError: any) {
    error.value = downloadError?.message || 'Could not download this case archive.';
  } finally {
    downloadingId.value = '';
  }
}

async function contactInvestigator() {
  const manager = openCaseError.value?.createdBy;
  if (!manager) return;
  const recipient = manager.id || manager._id || manager.userId;
  if (!recipient) {
    error.value = 'The case manager has no messaging account linked to this case.';
    return;
  }
  await router.push({ path: '/messages', query: { recipient: String(recipient), caseNumber: openCaseError.value.caseId } });
  openCaseError.value = null;
}

function handleResearcherActivity() { showNotifications.value = true; }
onMounted(() => {
  syncUiPreferences();
  window.addEventListener('dess-settings-updated', handleSettingsUpdated);
  void loadCases();
  void loadNotifications();
  window.addEventListener('open-researcher-notifications', handleResearcherActivity);
  refreshTimer = setInterval(() => { void loadNotifications(); }, 60000);
});
onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
  if (refreshTimer) clearInterval(refreshTimer);
  window.removeEventListener('dess-settings-updated', handleSettingsUpdated);
  window.removeEventListener('open-researcher-notifications', handleResearcherActivity);
});
</script>

<style scoped>
.researcher-page {
  --repo-bg: #04152d;
  --repo-panel: #061d3a;
  --repo-line: #123d6b;
  --repo-text: #e7f2ff;
  --repo-muted: #9db9d8;
  min-height: calc(100vh - 56px);
  padding: 22px clamp(14px, 2.2vw, 32px) 34px;
  color: var(--repo-text);
  background-color: var(--repo-bg);
  background-image: linear-gradient(rgba(24, 93, 154, .07) 1px, transparent 1px), linear-gradient(90deg, rgba(24, 93, 154, .07) 1px, transparent 1px);
  background-size: 34px 34px;
}
.repository-header,.repository-stats,.repository-toolbar,.case-results { width: min(1450px, 100%); margin-inline: auto; }
.repository-header { display: flex; align-items: center; gap: 14px; margin-bottom: 15px; }
.brand-mark { display: grid; width: 48px; height: 48px; flex: 0 0 48px; place-items: center; border: 1px solid #1d629a; border-radius: 10px; color: #82caff; background: #0a3156; font-size: 22px; }
.repository-title { min-width: 0; flex: 1; }
.repository-eyebrow,.section-eyebrow { margin: 0 0 5px; color: #5daeff; font-size: 9px; font-weight: 750; }
.repository-title h1 { margin: 0; color: #f0f7ff; font-size: 22px; font-weight: 750; }
.repository-title > p:last-child { margin: 4px 0 0; color: var(--repo-muted); font-size: 10px; }
.activity-button { position: relative; display: inline-flex; min-height: 36px; align-items: center; gap: 7px; padding: 7px 10px; border: 1px solid #1f527c; border-radius: 6px; color: #cde7ff; background: #082345; cursor: pointer; font-size: 10px; font-weight: 650; }
.unread-count { display: inline-grid; min-width: 17px; height: 17px; place-items: center; border-radius: 999px; color: #06203b; background: #5dc5ff; font-size: 8px; font-weight: 800; }
.repository-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(180px, 1.15fr); gap: 0; margin-bottom: 14px; border: 1px solid var(--repo-line); border-radius: 7px; background: rgba(6, 29, 58, .92); }
.stat-item { display: flex; min-width: 0; align-items: center; gap: 10px; padding: 12px 14px; border-right: 1px solid rgba(18, 61, 107, .8); }
.stat-icon { display: grid; width: 33px; height: 33px; flex: 0 0 33px; place-items: center; border-radius: 8px; color: #77c3ff; background: #0b3156; font-size: 16px; }
.stat-copy { display: grid; gap: 3px; }
.stat-copy small { color: #93afcd; font-size: 9px; }
.stat-copy strong { color: #e8f4ff; font-size: 17px; line-height: 1; }
.stat-aside { display: flex; align-items: center; gap: 8px; padding: 10px 14px; color: #9db9d8; font-size: 9px; line-height: 1.4; }
.stat-aside i { flex: 0 0 15px; color: #57d2ac; font-size: 15px; }
.activity-panel { width: min(1450px, 100%); margin: 0 auto 13px; padding: 13px; border: 1px solid var(--repo-line); border-radius: 7px; background: rgba(6, 29, 58, .96); }
.activity-heading,.results-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.activity-heading h2,.results-heading h2 { margin: 0; color: #e8f4ff; font-size: 14px; }
.icon-button { display: grid; width: 30px; height: 30px; place-items: center; border: 1px solid #21476d; border-radius: 5px; color: #adc8e2; background: transparent; cursor: pointer; }
.activity-list { display: grid; margin-top: 9px; }
.activity-row { display: flex; align-items: center; gap: 9px; padding: 9px 5px; border: 0; border-top: 1px solid #143553; color: inherit; text-align: left; background: transparent; cursor: pointer; }
.activity-mark { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; border-radius: 7px; font-size: 13px; }
.tone-warning { color: #ffd48a; background: rgba(150, 94, 0, .2); }.tone-success { color: #72f5ce; background: rgba(0, 130, 103, .23); }.tone-info { color: #90cdff; background: rgba(15, 88, 150, .27); }
.activity-copy { display: grid; min-width: 0; flex: 1; gap: 3px; }
.activity-copy strong { color: #dcecff; font-size: 10px; }
.activity-copy small { overflow: hidden; color: #9db9d8; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.activity-copy time { color: #7894b0; font-size: 8px; }
.activity-unread { width: 7px; height: 7px; border-radius: 50%; background: #3bbcff; }
.inline-state { padding: 12px 4px; color: #8ca9c6; font-size: 10px; }
.repository-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; margin-bottom: 15px; padding: 10px; border: 1px solid var(--repo-line); border-radius: 7px; background: rgba(6, 29, 58, .9); }
.clear-filters-button { display: inline-flex; min-height: 34px; align-items: center; gap: 5px; padding: 6px 9px; border: 1px solid #d8e8dd; border-radius: 5px; color: #267452; background: #fff; cursor: pointer; font-size: 9px; font-weight: 650; }
.clear-filters-button:hover { border-color: #9fd5b4; background: #f1faf5; }
.related-cases-panel { display: grid; gap: 8px; padding: 12px; border: 1px solid #e1eae4; border-radius: 8px; background: #f8fbf9; }
.related-cases-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.related-cases-heading h3 { margin: 0; color: #30463a; font-size: 12px; }
.related-cases-heading > span { color: #819087; font-size: 8px; }
.related-case-list { display: grid; }
.related-case-row { display: flex; align-items: center; gap: 9px; padding: 9px 2px; border: 0; border-top: 1px solid #e7eee9; color: #344a3c; text-align: left; background: transparent; cursor: pointer; }
.related-case-row:hover { background: #f0f8f3; }
.related-case-icon { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; border-radius: 6px; color: #18875f; background: #e5f4eb; }
.related-case-copy { display: grid; min-width: 0; flex: 1; gap: 3px; }
.related-case-copy strong { color: #14845f; font-size: 9px; }
.related-case-copy small { overflow: hidden; color: #819087; font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
.related-case-row > i { color: #819087; font-size: 10px; }
.related-state { margin: 0; color: #819087; font-size: 9px; }
.case-search { display: flex; min-width: 180px; flex: 1; align-items: center; gap: 8px; padding: 0 9px; border: 1px solid #1b436b; border-radius: 5px; color: #8cabc9; background: #041a34; }
.case-search input { width: 100%; min-width: 0; height: 34px; border: 0; outline: 0; color: #e1efff; background: transparent; font-size: 10px; }
.case-search input::placeholder { color: #7894b0; }
.case-search kbd { padding: 2px 5px; border: 1px solid #31516f; border-radius: 3px; color: #8ca9c6; background: #0a2848; font-size: 8px; }
.sort-control { display: flex; align-items: center; gap: 7px; color: #9bb6d1; font-size: 9px; }
.sort-control select { min-height: 34px; padding: 6px 25px 6px 8px; border: 1px solid #21476d; border-radius: 5px; color: #dcecff; background: #061a33; font-size: 9px; }
.results-heading { margin-bottom: 9px; }
.results-heading h2 span { margin-left: 5px; color: #7ebcf1; font-size: 10px; font-weight: 500; }
.results-note { display: flex; align-items: center; gap: 6px; color: #8eaac5; font-size: 9px; }
.case-table-wrap { overflow-x: auto; border: 1px solid var(--repo-line); border-radius: 7px; background: rgba(6, 29, 58, .94); }
.case-table { width: 100%; border-collapse: collapse; }
.case-table th { padding: 10px 12px; border-bottom: 1px solid #1b436b; color: #88a6c4; text-align: left; font-size: 8px; font-weight: 750; text-transform: uppercase; }
.case-table td { padding: 12px; border-bottom: 1px solid rgba(18, 61, 107, .55); color: #bad0e6; vertical-align: middle; font-size: 10px; }
.case-table tbody tr:last-child td { border-bottom: 0; }
.case-cell { min-width: 210px; }
.case-cell strong,.case-cell span,.case-cell small { display: block; }
.case-cell strong { color: #9ed3ff; font-size: 9px; }
.case-cell span { margin-top: 3px; color: #e0edfa; font-weight: 650; }
.case-cell small { overflow: hidden; max-width: 350px; margin-top: 4px; color: #89a5c1; text-overflow: ellipsis; white-space: nowrap; }
.case-type { display: inline-flex; padding: 4px 7px; border: 1px solid #275279; border-radius: 4px; color: #c8dff3; background: #0a2949; font-size: 8px; }
.access-counts { display: grid; gap: 4px; white-space: nowrap; }
.shared-count,.restricted-count { display: inline-flex; align-items: center; gap: 5px; font-size: 9px; }
.shared-count { color: #78e1c4; }.restricted-count { color: #a4b9ce; }
.date-cell { color: #96afc7 !important; white-space: nowrap; font-size: 9px !important; }
.case-actions { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.details-button,.download-button,.evidence-save-button { display: inline-flex; min-height: 30px; align-items: center; gap: 5px; padding: 6px 8px; border: 1px solid #245478; border-radius: 5px; color: #b8d9f5; background: transparent; cursor: pointer; font-size: 9px; }
.details-button:hover { border-color: #3e8cc5; background: rgba(20, 84, 133, .25); }
.evidence-save-button { align-items: center; gap: 5px; padding: 5px 8px; border: 1px solid #245478; border-radius: 5px; color: #b8d9f5; background: transparent; cursor: pointer; font-size: 9px; }
.download-button { border-color: #1378cb; color: white; background: #086cbd; }
.download-button:hover:not(:disabled) { background: #1288e8; }
.download-button:disabled { opacity: .55; cursor: wait; }
.repository-state { display: flex; min-height: 180px; flex-direction: column; align-items: center; justify-content: center; gap: 9px; border: 1px solid var(--repo-line); border-radius: 7px; color: #92acc7; background: rgba(6, 29, 58, .88); font-size: 10px; text-align: center; }
.empty-state i { color: #4c88b8; font-size: 26px; }.empty-state strong { color: #d3e6f7; font-size: 12px; }.empty-state span { max-width: 320px; line-height: 1.5; }
.error-state { color: #ffbaba; }
.dialog-backdrop { position: fixed; z-index: 1100; inset: 0; display: grid; place-items: center; padding: 16px; background: rgba(0, 8, 20, .8); }
.case-dialog { display: flex; width: min(740px, 100%); max-height: 90vh; flex-direction: column; overflow: hidden; border: 1px solid #1c5785; border-radius: 8px; background: #071d39; box-shadow: 0 24px 70px rgba(0, 0, 0, .42); }
.dialog-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 17px; border-bottom: 1px solid #173b60; background: #0a2748; }
.dialog-header h2 { margin: 0; color: #eaf5ff; font-size: 16px; }.dialog-header p:last-child { margin: 4px 0 0; color: #a3bdd5; font-size: 10px; }
.dialog-content { display: grid; gap: 15px; overflow-y: auto; padding: 16px; }
.case-description span { color: #82a2c0; font-size: 8px; font-weight: 750; text-transform: uppercase; }.case-description p { margin: 5px 0 0; color: #c8dcef; font-size: 10px; line-height: 1.55; }
.evidence-heading { display: flex; align-items: end; justify-content: space-between; gap: 10px; }.evidence-heading h3 { margin: 0; color: #e3f0fc; font-size: 12px; }.access-legend { color: #76ddbf; font-size: 8px; }
.shared-evidence-list { display: grid; border-top: 1px solid #173b60; }.shared-evidence-row { display: flex; align-items: center; gap: 9px; padding: 9px 1px; border-bottom: 1px solid #173b60; }
.evidence-file-icon { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; border-radius: 6px; color: #80d5bf; background: #0b3c4b; }
.shared-evidence-copy { display: grid; min-width: 0; flex: 1; gap: 3px; }.shared-evidence-copy strong { color: #dcecff; font-size: 9px; }.shared-evidence-copy small { color: #90abc5; font-size: 8px; }.shared-evidence-copy code { overflow: hidden; color: #78c1f3; font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
.available-label { color: #71ddbd; font-size: 8px; white-space: nowrap; }.restricted-only { padding: 12px; border: 1px dashed #31516f; border-radius: 5px; color: #9db9d8; font-size: 9px; }
.restricted-summary { display: flex; align-items: flex-start; gap: 9px; padding: 10px; border: 1px solid #35516c; border-radius: 6px; color: #b5cbe0; background: rgba(10, 34, 59, .8); }.restricted-summary>i { flex: 0 0 14px; color: #8da7c0; }.restricted-summary span { display: grid; gap: 3px; }.restricted-summary strong { font-size: 9px; }.restricted-summary small { color: #8da8c3; font-size: 8px; line-height: 1.4; }
.dialog-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 16px; border-top: 1px solid #173b60; }.dialog-footer>span { color: #8faac5; font-size: 8px; }.open-case-status { display: flex; align-items: center; gap: 8px; padding: 11px; border: 1px solid rgba(255, 190, 80, .35); border-radius: 6px; color: #ffd48a; background: rgba(150, 94, 0, .16); font-size: 10px; line-height: 1.4; }
.case-manager { display: flex; align-items: center; gap: 9px; padding-top: 12px; border-top: 1px solid #173b60; }.person-initials { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid #24699e; border-radius: 50%; color: #bde2ff; background: #0b3b69; font-size: 10px; }.case-manager>span:last-child { display: grid; gap: 3px; }.case-manager strong { color: #e3f0fc; font-size: 10px; }.case-manager small { color: #91acc9; font-size: 8px; }

@media (max-width: 900px) {
  .repository-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .stat-aside { grid-column: 1 / -1; border-top: 1px solid rgba(18, 61, 107, .8); }
  .case-actions { flex-direction: column; align-items: stretch; }
}
@media (max-width: 650px) {
  .researcher-page { padding: 14px 10px 24px; }
  .repository-header { gap: 9px; }.brand-mark { width: 40px; height: 40px; flex-basis: 40px; font-size: 18px; }
  .repository-title h1 { font-size: 18px; }.repository-title > p:last-child { max-width: 225px; font-size: 9px; line-height: 1.4; }
  .activity-button { font-size: 0; }.activity-button i,.unread-count { font-size: 10px; }
  .repository-stats { grid-template-columns: 1fr 1fr; }.stat-item { padding: 9px; }.stat-item:nth-child(2) { border-right: 0; }.stat-item:nth-child(3) { border-top: 1px solid rgba(18, 61, 107, .8); }.stat-aside { grid-column: auto; border-top: 1px solid rgba(18, 61, 107, .8); }
  .repository-toolbar { flex-wrap: wrap; }.case-search { flex-basis: 100%; }.sort-control { flex: 1; justify-content: space-between; }.sort-control select { min-width: 0; max-width: 135px; }.order-control { max-width: 170px; }
  .results-heading { align-items: flex-start; flex-direction: column; gap: 5px; }
  .case-table,.case-table tbody,.case-table tr,.case-table td { display: block; width: 100%; }.case-table thead { display: none; }.case-table tr { padding: 8px 10px; border-bottom: 1px solid #173b60; }.case-table td { padding: 5px 2px; border: 0; }.case-cell small { max-width: 100%; }.case-actions { flex-direction: row; }.case-actions button { flex: 1; justify-content: center; }
  .dialog-footer { align-items: stretch; flex-direction: column; }.available-label { display: none; }
}


/* Brighter repository palette with clear case and evidence access states. */
.researcher-page {
  --repo-bg: #f1f6f3;
  --repo-panel: #ffffff;
  --repo-line: #e1eae4;
  --repo-text: #20342a;
  --repo-muted: #718479;
  padding: 22px clamp(14px, 2.2vw, 32px) 34px;
  color: var(--repo-text);
  background: #f1f6f3;
  background-image: radial-gradient(rgba(31, 131, 83, .045) .8px, transparent .8px);
  background-size: 18px 18px;
}
.brand-mark { border-color: #cce7d8; color: #16865f; background: #e4f4ea; }
.repository-eyebrow,.section-eyebrow { color: #15966c; }
.repository-title h1 { color: #1d3327; }
.repository-title > p:last-child { color: #718479; }
.activity-button { border-color: #cfe5d7; color: #257553; background: #fff; }
.activity-button:hover { border-color: #9fd8b7; background: #f4fbf6; }
.unread-count { color: #fff; background: #18ad78; }
.repository-stats { border-color: #e0e9e3; border-radius: 10px; background: #fff; box-shadow: 0 6px 20px rgba(35, 75, 50, .045); }
.stat-item { border-right-color: #edf2ee; }
.stat-icon { color: #18875f; background: #eaf7ef; }
.stat-copy small { color: #7c8d82; }
.stat-copy strong { color: #20392b; }
.stat-aside { color: #708277; }
.stat-aside i { color: #18a477; }
.activity-panel { border-color: #e0e9e3; border-radius: 10px; background: #fff; box-shadow: 0 6px 20px rgba(35, 75, 50, .045); }
.activity-heading h2,.results-heading h2 { color: #20392b; }
.icon-button { border-color: #e2ebe5; color: #75867b; background: #fff; }
.icon-button:hover { color: #13845d; background: #f1faf5; }
.activity-row { border-top-color: #edf2ee; }
.activity-copy strong { color: #344a3c; }
.activity-copy small { color: #77887d; }
.activity-copy time { color: #91a096; }
.activity-unread { background: #18b981; }
.inline-state { color: #839188; }
.repository-toolbar { border-color: #e0e9e3; border-radius: 10px; background: #fff; box-shadow: 0 5px 16px rgba(35, 75, 50, .04); }
.case-search { border-color: #e0e9e3; color: #829187; background: #f8fbf9; }
.case-search input { color: #263a2e; }
.case-search input::placeholder { color: #9aa89f; }
.case-search kbd { border-color: #e3ebe6; color: #78877e; background: #fff; }
.sort-control { color: #728278; }
.sort-control select { border-color: #dfe9e2; color: #30493a; background: #f9fcfa; }
.results-heading h2 span { color: #13966c; }
.results-note { color: #849289; }
.case-table-wrap { border-color: #e0e9e3; border-radius: 10px; background: #fff; box-shadow: 0 8px 24px rgba(35, 75, 50, .045); }
.case-table th { border-bottom-color: #e9f0eb; color: #829087; background: #f8fbf9; }
.case-table td { border-bottom-color: #edf2ee; color: #52685a; }
.case-table tbody tr:hover { background: #fbfefc; }
.case-cell strong { color: #14845f; }
.case-cell span { color: #2b4033; }
.case-cell small { color: #87958b; }
.case-type { border-color: #dbece1; color: #327653; background: #f0f8f3; }
.shared-count { color: #16895f; }.restricted-count { color: #87948b; }
.date-cell { color: #7d8b82 !important; }
.details-button,.download-button,.evidence-save-button { border-color: #cfe5d7; color: #257553; background: #fff; }
.details-button:hover { border-color: #a2d8b7; background: #f1faf5; }
.download-button { border-color: #18ac78; color: #fff; background: #17ad78; }
.download-button:hover:not(:disabled) { background: #0e9465; }
.repository-state { border-color: #e0e9e3; border-radius: 10px; color: #819087; background: #fff; }
.empty-state i { color: #8eb9a0; }.empty-state strong { color: #30463a; }.empty-state span { color: #849289; }
.dialog-backdrop { background: rgba(19, 39, 28, .48); }
.case-dialog { border-color: #e1eae4; border-radius: 12px; background: #fff; box-shadow: 0 24px 70px rgba(24, 57, 37, .2); }
.dialog-header { border-bottom-color: #eaf0ec; background: #f6faf7; }
.dialog-header h2 { color: #20372a; }.dialog-header p:last-child { color: #718479; }
.dialog-content { background: #fff; }
.case-description span { color: #168b64; }.case-description p { color: #52685a; }
.evidence-heading h3 { color: #30463a; }.access-legend { color: #138a60; }
.shared-evidence-list { border-top-color: #eaf0ec; }
.shared-evidence-row { border-bottom-color: #eaf0ec; }
.evidence-file-icon { color: #18875f; background: #eaf7ef; }
.shared-evidence-copy strong { color: #354d3f; }.shared-evidence-copy small { color: #819087; }.shared-evidence-copy code { color: #458b68; }
.available-label { color: #18875f; }
.restricted-only { border-color: #e1e9e3; color: #78887e; }
.restricted-summary { border-color: #e4ece6; color: #697b70; background: #f8fbf9; }
.restricted-summary>i { color: #8a9a90; }.restricted-summary small { color: #87958c; }
.dialog-footer { border-top-color: #eaf0ec; }.dialog-footer>span { color: #7d8c83; }
.open-case-status { border-color: #f0e0bf; color: #936d28; background: #fff9ed; }
.case-manager { border-top-color: #eaf0ec; }.person-initials { border-color: #d1e9da; color: #237b55; background: #e7f5eb; }
.case-manager strong { color: #30463a; }.case-manager small { color: #7d8d82; }
.repository-pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid #e0e9e3; border-top: 0; border-radius: 0 0 10px 10px; color: #819087; background: #fff; font-size: .75rem; }
.pagination-actions { display: flex; align-items: center; gap: 10px; }
.pagination-actions span { color: #6f8175; font-size: .7rem; white-space: nowrap; }
.pagination-actions button { min-height: 32px; padding: 6px 10px; border: 1px solid #d8e8dd; border-radius: 6px; color: #267452; background: #fff; cursor: pointer; font-size: .72rem; font-weight: 650; }
.pagination-actions button:hover:not(:disabled) { border-color: #9fd5b4; background: #f1faf5; }
.pagination-actions button:disabled { opacity: .4; cursor: not-allowed; }
.compact-list-view .case-table td { padding-top: 7px; padding-bottom: 7px; }
.compact-list-view .case-table th { padding-top: 8px; padding-bottom: 8px; }

@media (max-width: 650px) {
  .repository-pagination { align-items: flex-start; flex-direction: column; }
  .pagination-actions { width: 100%; justify-content: space-between; }
  .stat-item { border-color: #edf2ee !important; }
}

</style>
