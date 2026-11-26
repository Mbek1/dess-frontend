<template>
  <main class="research-workspace container-fluid py-4">
    <section class="workspace-hero mb-4">
      <div>
        <span class="eyebrow">CASE REPOSITORY</span>
        <h1>Research Workspace</h1>
        <p>Keep your case research organised in one private space.</p>
      </div>
      <button class="btn btn-light" type="button" @click="exportWorkspace" :disabled="exporting">
        <i class="bi bi-file-earmark-word me-2"></i>{{ exporting ? 'Preparing export…' : 'Export my workspace' }}
      </button>
    </section>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="notice" class="alert alert-success">{{ notice }}</div>

    <section class="workspace-stats row g-3 mb-4">
      <div class="col-6 col-lg-3"><div class="stat-card"><i class="bi bi-bookmark"></i><strong>{{ workspace.bookmarks.length }}</strong><span>Bookmarks</span></div></div>
      <div class="col-6 col-lg-3"><div class="stat-card"><i class="bi bi-journal-text"></i><strong>{{ workspace.notes.length }}</strong><span>Personal notes</span></div></div>
      <div class="col-6 col-lg-3"><div class="stat-card"><i class="bi bi-collection"></i><strong>{{ workspace.collections.length }}</strong><span>Collections</span></div></div>
      <div class="col-6 col-lg-3"><div class="stat-card"><i class="bi bi-folder2-open"></i><strong>{{ cases.length }}</strong><span>Available cases</span></div></div>
    </section>

    <nav class="workspace-tabs mb-4" aria-label="Research workspace sections">
      <button v-for="tab in tabs" :key="tab.id" type="button" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <i :class="tab.icon"></i>{{ tab.label }}
      </button>
    </nav>

    <section v-if="activeTab === 'overview'" class="row g-4">
      <div class="col-xl-7">
        <div class="workspace-panel h-100">
          <div class="panel-heading"><div><h2>Recently saved</h2><p>Your bookmarked cases and researcher-visible evidence.</p></div><button class="btn btn-sm btn-outline-primary" @click="activeTab = 'bookmarks'">View bookmarks</button></div>
          <article v-for="item in recentBookmarks" :key="item._id" class="saved-row">
            <div><span class="case-reference">{{ item.caseReference }}</span><h3>{{ item.caseTitle }}</h3><p v-if="item.evidenceName">Evidence: {{ item.evidenceName }}</p><small>Saved {{ formatDate(item.createdAt) }}</small></div>
            <div class="saved-actions"><router-link to="/researcher" class="btn btn-sm btn-outline-primary">Open repository</router-link></div>
          </article>
          <div v-if="!workspace.bookmarks.length" class="empty-state">Browse the Case Repository and use Save on a case or shared evidence item. Your bookmarks will appear here.</div>
        </div>
      </div>
      <div class="col-xl-5">
        <div class="workspace-panel mb-4">
          <div class="panel-heading"><div><h2>Recent notes</h2><p>Your private research observations.</p></div><button class="btn btn-sm btn-outline-primary" @click="activeTab = 'notes'">View all</button></div>
          <article v-for="note in recentNotes" :key="note._id" class="mini-item"><strong>{{ note.title }}</strong><span>{{ note.caseReference }} · {{ note.caseTitle }}</span><p>{{ note.content }}</p></article>
          <div v-if="!workspace.notes.length" class="empty-state">Your notes will appear here.</div>
        </div>
        <div class="workspace-panel">
          <div class="panel-heading"><div><h2>Your collections</h2><p>Group cases by topic or research project.</p></div><button class="btn btn-sm btn-outline-primary" @click="activeTab = 'collections'">Manage</button></div>
          <div v-for="collection in workspace.collections" :key="collection._id" class="collection-row"><i class="bi bi-collection"></i><div><strong>{{ collection.name }}</strong><span>{{ collection.caseIds.length }} cases</span></div></div>
          <div v-if="!workspace.collections.length" class="empty-state">Create your first research collection.</div>
        </div>
      </div>
    </section>

    <section v-else-if="activeTab === 'bookmarks'" class="workspace-panel">
      <div class="panel-heading"><div><h2>Saved bookmarks</h2><p>Cases and individual evidence items you want to revisit.</p></div></div>
      <div v-if="!workspace.bookmarks.length" class="empty-state">No bookmarks yet. Browse the Case Repository and use Save on a case or shared evidence item.</div>
      <article v-for="item in workspace.bookmarks" :key="item._id" class="saved-row">
        <div><span class="case-reference">{{ item.caseReference }}</span><h3>{{ item.caseTitle }}</h3><p v-if="item.evidenceName">Evidence: {{ item.evidenceName }}</p><small>Saved {{ formatDate(item.createdAt) }}</small></div>
        <div class="saved-actions"><router-link to="/researcher" class="btn btn-sm btn-outline-primary">Open repository</router-link><button class="btn btn-sm btn-outline-danger" @click="removeBookmark(item)">Remove</button></div>
      </article>
    </section>

    <section v-else-if="activeTab === 'notes'" class="row g-4">
      <div class="col-lg-5">
        <div class="workspace-panel">
          <div class="panel-heading"><div><h2>{{ editingNote ? 'Edit note' : 'Create a note' }}</h2><p>Notes are private to your account.</p></div></div>
          <form @submit.prevent="saveNote">
            <label class="form-label">Link to a case</label>
            <select v-model="noteForm.caseId" class="form-select mb-3" required><option value="">Choose a closed case…</option><option v-for="item in cases" :key="item._id" :value="item._id">{{ item.caseId }} — {{ item.name }}</option></select>
            <label class="form-label">Note title</label><input v-model="noteForm.title" class="form-control mb-3" maxlength="160" required placeholder="e.g. Observations on evidence patterns" />
            <label class="form-label">Your findings / observations</label><textarea v-model="noteForm.content" class="form-control mb-3" rows="7" maxlength="12000" required placeholder="Write your private research notes…"></textarea>
            <div class="d-flex gap-2"><button class="btn btn-primary" type="submit" :disabled="savingNote">{{ savingNote ? 'Saving…' : (editingNote ? 'Update note' : 'Save private note') }}</button><button v-if="editingNote" class="btn btn-outline-secondary" type="button" @click="resetNote">Cancel</button></div>
          </form>
        </div>
      </div>
      <div class="col-lg-7"><div class="workspace-panel"><div class="panel-heading"><div><h2>All research notes</h2><p>{{ workspace.notes.length }} saved notes</p></div></div>
        <div v-if="!workspace.notes.length" class="empty-state">No notes yet.</div>
        <article v-for="note in workspace.notes" :key="note._id" class="note-card"><div class="d-flex justify-content-between gap-3"><div><span class="case-reference">{{ note.caseReference }}</span><h3>{{ note.title }}</h3><small>{{ note.caseTitle }} · Updated {{ formatDate(note.updatedAt) }}</small></div><div class="saved-actions"><button class="btn btn-sm btn-outline-primary" @click="editNote(note)">Edit</button><button class="btn btn-sm btn-outline-danger" @click="deleteNote(note)">Delete</button></div></div><p class="note-content">{{ note.content }}</p></article>
      </div></div>
    </section>

    <section v-else-if="activeTab === 'collections'" class="row g-4">
      <div class="col-lg-5"><div class="workspace-panel"><div class="panel-heading"><div><h2>New collection</h2><p>Organise closed cases around a research topic.</p></div></div>
        <form @submit.prevent="createCollection"><label class="form-label">Collection name</label><input v-model="collectionForm.name" class="form-control mb-3" required maxlength="100" placeholder="e.g. Digital fraud cases" /><label class="form-label">Description</label><textarea v-model="collectionForm.description" class="form-control mb-3" rows="3" maxlength="500" placeholder="What is this collection about?" /><label class="form-label">Add cases</label><select v-model="collectionForm.caseIds" class="form-select mb-3" multiple size="6"><option v-for="item in cases" :key="item._id" :value="item._id">{{ item.caseId }} — {{ item.name }}</option></select><small class="text-muted d-block mb-3">Hold Ctrl (Windows) or Command (Mac) to select multiple cases.</small><button class="btn btn-primary" type="submit" :disabled="savingCollection">Create collection</button></form>
      </div></div>
      <div class="col-lg-7"><div class="workspace-panel"><div class="panel-heading"><div><h2>Research collections</h2><p>Private groups of cases for your research.</p></div></div>
        <div v-if="!workspace.collections.length" class="empty-state">No collections created yet.</div>
        <article v-for="collection in workspace.collections" :key="collection._id" class="note-card"><div class="d-flex justify-content-between gap-3"><div><h3><i class="bi bi-collection me-2"></i>{{ collection.name }}</h3><p>{{ collection.description || 'No description provided.' }}</p><small>{{ collection.caseIds.length }} cases · Created {{ formatDate(collection.createdAt) }}</small></div><button class="btn btn-sm btn-outline-danger align-self-start" @click="deleteCollection(collection)">Delete</button></div><div class="collection-cases"><span v-for="id in collection.caseIds" :key="id">{{ caseLabel(id) }}</span></div></article>
      </div></div>

    </section>

    <section v-else class="row g-4">
      <div class="col-12"><div class="workspace-panel">
        <div class="panel-heading"><div><h2>Collaboration invitations</h2><p>Respond to requests from researchers who contributed to the same case discussion. Invitations do not change evidence permissions.</p></div><button class="btn btn-sm btn-outline-primary" type="button" @click="loadCollaborationRequests" :disabled="loadingRequests">Refresh</button></div>
        <div v-if="requestError" class="alert alert-danger">{{ requestError }}</div>
        <div v-if="loadingRequests" class="empty-state">Loading collaboration requests...</div>
        <div v-else class="row g-4">
          <div class="col-lg-6"><h3 class="request-section-title">Received ({{ receivedRequests.length }})</h3><div v-if="!receivedRequests.length" class="empty-state">No received invitations.</div>
            <article v-for="request in receivedRequests" :key="request._id" class="request-card">
              <div class="request-card-head"><div><strong>{{ request.fromUser.name }}</strong><small>{{ request.fromUser.userType || 'Researcher' }} · {{ request.caseNumber }}</small></div><span class="request-status" :class="'status-' + request.status">{{ request.status }}</span></div>
              <h4>{{ request.caseTitle }}</h4><p>{{ request.message || 'The researcher invited you to collaborate on this case.' }}</p><small class="request-date">Received {{ formatDate(request.createdAt) }}</small>
              <div class="request-actions"><template v-if="request.status === 'pending'"><button type="button" class="btn btn-sm btn-primary" @click="respondToRequest(request, 'accepted')">Accept</button><button type="button" class="btn btn-sm btn-outline-secondary" @click="respondToRequest(request, 'declined')">Decline</button></template><router-link v-else-if="request.status === 'accepted'" class="btn btn-sm btn-outline-primary" :to="{ path: '/messages', query: { recipient: request.fromUser._id } }">Message collaborator</router-link></div>
            </article>
          </div>
          <div class="col-lg-6"><h3 class="request-section-title">Sent ({{ sentRequests.length }})</h3><div v-if="!sentRequests.length" class="empty-state">No sent invitations.</div>
            <article v-for="request in sentRequests" :key="request._id" class="request-card">
              <div class="request-card-head"><div><strong>{{ request.toUser.name }}</strong><small>{{ request.toUser.userType || 'Researcher' }} · {{ request.caseNumber }}</small></div><span class="request-status" :class="'status-' + request.status">{{ request.status }}</span></div>
              <h4>{{ request.caseTitle }}</h4><p>{{ request.message || 'No additional message.' }}</p><small class="request-date">Sent {{ formatDate(request.createdAt) }}</small>
              <div class="request-actions"><button v-if="request.status === 'pending'" type="button" class="btn btn-sm btn-outline-danger" @click="cancelRequest(request)">Cancel invitation</button><router-link v-else-if="request.status === 'accepted'" class="btn btn-sm btn-outline-primary" :to="{ path: '/messages', query: { recipient: request.toUser._id } }">Message collaborator</router-link></div>
            </article>
          </div>
        </div>
      </div></div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
const route = useRoute();

type CaseItem = { _id: string; caseId: string; name: string; description: string; caseType: string; evidence?: any[] };
type Workspace = { bookmarks: any[]; notes: any[]; collections: any[] };
const emptyWorkspace = (): Workspace => ({ bookmarks: [], notes: [], collections: [] });
const workspace = reactive<Workspace>(emptyWorkspace());
const cases = ref<CaseItem[]>([]);
const loading = ref(true);
const exporting = ref(false);
const error = ref('');
const notice = ref('');
const activeTab = ref('overview');
const savingNote = ref(false);
const savingCollection = ref(false);
const collaborationRequests = ref<any[]>([]);
const loadingRequests = ref(false);
const requestError = ref('');
const editingNote = ref('');
const noteForm = reactive({ caseId: '', title: '', content: '' });
const collectionForm = reactive<{ name: string; description: string; caseIds: string[] }>({ name: '', description: '', caseIds: [] });
const tabs = [
  { id: 'overview', label: 'Overview', icon: 'bi bi-grid' },
  { id: 'bookmarks', label: 'Bookmarks', icon: 'bi bi-bookmark' },
  { id: 'notes', label: 'Personal Notes', icon: 'bi bi-journal-text' },
  { id: 'collections', label: 'Collections', icon: 'bi bi-collection' },
  { id: 'collaborations', label: 'Collaborations', icon: 'bi bi-people' }
];
const recentBookmarks = computed(() => [...workspace.bookmarks].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0,5));
const recentNotes = computed(() => [...workspace.notes].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0,4));
const receivedRequests = computed(() => collaborationRequests.value.filter(item => item.direction === 'received'));
const sentRequests = computed(() => collaborationRequests.value.filter(item => item.direction === 'sent'));
function formatDate(value: string) { return value ? new Date(value).toLocaleDateString() : '—'; }
function caseLabel(id: string) { const item = cases.value.find(entry => entry._id === id); return item ? item.caseId + ' — ' + item.name : 'Case'; }
async function loadData() {
  loading.value = true; error.value = '';
  try {
    const [caseResponse, workspaceResponse, requestResponse] = await Promise.all([
      axios.get('/api/researcher/cases'),
      axios.get('/api/research-workspace'),
      axios.get('/api/repository-collaboration/collaboration-requests')
    ]);
    cases.value = caseResponse.data.closedCases || [];
    Object.assign(workspace, workspaceResponse.data || emptyWorkspace());
    collaborationRequests.value = requestResponse.data.requests || [];
  } catch (err: any) { error.value = err?.response?.data?.error || 'Could not load your research workspace.'; }
  finally { loading.value = false; }
}
async function refreshWorkspace(message = '') {
  const response = await axios.get('/api/research-workspace');
  Object.assign(workspace, response.data || emptyWorkspace());
  notice.value = message; error.value = '';
}
async function bookmark(item: CaseItem, ev?: any) {
  try { await axios.post('/api/research-workspace/bookmarks', { caseId: item._id, evidenceId: ev?._id }); await refreshWorkspace(ev ? 'Evidence bookmarked.' : 'Case bookmarked.'); }
  catch (err: any) { error.value = err?.response?.data?.error || 'Could not save bookmark.'; }
}
async function removeBookmark(item: any) {
  try { await axios.delete('/api/research-workspace/bookmarks/' + item._id); await refreshWorkspace('Bookmark removed.'); }
  catch (err: any) { error.value = err?.response?.data?.error || 'Could not remove bookmark.'; }
}
function startNote(item: CaseItem) { resetNote(); noteForm.caseId = item._id; activeTab.value = 'notes'; }
function resetNote() { editingNote.value = ''; noteForm.caseId = ''; noteForm.title = ''; noteForm.content = ''; }
function editNote(note: any) { editingNote.value = note._id; noteForm.caseId = note.caseId; noteForm.title = note.title; noteForm.content = note.content; }
async function saveNote() {
  savingNote.value = true; error.value = '';
  try {
    if (editingNote.value) await axios.patch('/api/research-workspace/notes/' + editingNote.value, { title: noteForm.title, content: noteForm.content });
    else await axios.post('/api/research-workspace/notes', noteForm);
    resetNote(); await refreshWorkspace('Research note saved.');
  } catch (err: any) { error.value = err?.response?.data?.error || 'Could not save research note.'; }
  finally { savingNote.value = false; }
}
async function deleteNote(note: any) {
  if (!window.confirm('Delete this personal research note?')) return;
  try { await axios.delete('/api/research-workspace/notes/' + note._id); await refreshWorkspace('Research note deleted.'); }
  catch (err: any) { error.value = err?.response?.data?.error || 'Could not delete research note.'; }
}
async function createCollection() {
  savingCollection.value = true; error.value = '';
  try { await axios.post('/api/research-workspace/collections', collectionForm); collectionForm.name = ''; collectionForm.description = ''; collectionForm.caseIds = []; await refreshWorkspace('Research collection created.'); }
  catch (err: any) { error.value = err?.response?.data?.error || 'Could not create collection.'; }
  finally { savingCollection.value = false; }
}
async function deleteCollection(collection: any) {
  if (!window.confirm('Delete this research collection? Saved cases and notes will not be deleted.')) return;
  try { await axios.delete('/api/research-workspace/collections/' + collection._id); await refreshWorkspace('Collection deleted.'); }
  catch (err: any) { error.value = err?.response?.data?.error || 'Could not delete collection.'; }
}
async function exportWorkspace() {
  exporting.value = true; error.value = '';
  try {
    const response = await axios.get('/api/research-workspace/export', { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'DESS-Research-Workspace.html'; anchor.click(); URL.revokeObjectURL(url);
  } catch (err: any) { error.value = err?.response?.data?.error || 'Could not export workspace.'; }
  finally { exporting.value = false; }
}

async function loadCollaborationRequests() {
  loadingRequests.value = true;
  requestError.value = '';
  try {
    const response = await axios.get('/api/repository-collaboration/collaboration-requests');
    collaborationRequests.value = response.data.requests || [];
  } catch (err: any) {
    requestError.value = err?.response?.data?.error || 'Could not load collaboration invitations.';
  } finally {
    loadingRequests.value = false;
  }
}

async function respondToRequest(request: any, status: 'accepted' | 'declined') {
  requestError.value = '';
  try {
    await axios.patch('/api/repository-collaboration/collaboration-requests/' + request._id + '/respond', { status });
    await loadCollaborationRequests();
    notice.value = status === 'accepted' ? 'Collaboration invitation accepted.' : 'Collaboration invitation declined.';
  } catch (err: any) {
    requestError.value = err?.response?.data?.error || 'Could not update collaboration invitation.';
  }
}

async function cancelRequest(request: any) {
  requestError.value = '';
  try {
    await axios.patch('/api/repository-collaboration/collaboration-requests/' + request._id + '/cancel');
    await loadCollaborationRequests();
    notice.value = 'Collaboration invitation cancelled.';
  } catch (err: any) {
    requestError.value = err?.response?.data?.error || 'Could not cancel collaboration invitation.';
  }
}

onMounted(() => {
  if (route.query.tab === 'collaborations') activeTab.value = 'collaborations';
  void loadData();
});
</script>

<style scoped>
.research-workspace{max-width:1500px;color:#172b45}.workspace-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:28px 32px;border-radius:18px;background:linear-gradient(120deg,#102b4d,#164c70);color:#fff}.workspace-hero h1{font-size:clamp(1.55rem,3vw,2.2rem);font-weight:800;margin:6px 0}.workspace-hero p{margin:0;color:#c6d9eb}.eyebrow{font-size:.7rem;letter-spacing:.16em;color:#7fe4dc;font-weight:800}.workspace-stats .stat-card{height:100%;display:grid;grid-template-columns:42px 1fr;align-items:center;gap:2px 10px;padding:17px;border:1px solid #dce7f2;border-radius:13px;background:#fff}.stat-card i{grid-row:span 2;color:#168b9a;font-size:1.4rem}.stat-card strong{font-size:1.4rem}.stat-card span{font-size:.78rem;color:#718198}.workspace-tabs{display:flex;gap:8px;flex-wrap:wrap}.workspace-tabs button{border:1px solid #d8e3ef;border-radius:9px;background:#fff;color:#53677f;padding:10px 15px;font-weight:650}.workspace-tabs button i{margin-right:8px}.workspace-tabs button.active{background:#eaf4fb;border-color:#8ab6d0;color:#155b83}.workspace-panel{padding:22px;border:1px solid #e0e8f0;border-radius:14px;background:#fff;box-shadow:0 5px 22px #183c5c0b}.panel-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.panel-heading h2{font-size:1.08rem;font-weight:800;margin:0;color:#173b5c}.panel-heading p{font-size:.8rem;color:#7b8ba0;margin:5px 0 0}.case-row,.saved-row,.note-card{padding:16px 0;border-bottom:1px solid #edf1f5}.case-row:last-child,.saved-row:last-child,.note-card:last-child{border-bottom:0}.case-reference{font-size:.7rem;font-weight:800;letter-spacing:.06em;color:#12838d}.case-row h3,.saved-row h3,.note-card h3{font-size:.96rem;font-weight:750;margin:4px 0;color:#203d5b}.case-row p,.note-card p{font-size:.82rem;color:#6c7d91;margin:6px 0}.case-meta{display:flex;gap:8px;flex-wrap:wrap}.case-meta span,.collection-cases span{font-size:.68rem;padding:4px 8px;border-radius:20px;background:#f0f5f9;color:#5c7088;text-transform:capitalize}.case-actions,.saved-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.evidence-picks{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:12px;font-size:.73rem;color:#718198}.evidence-chip{border:1px solid #d9e6ee;border-radius:20px;padding:4px 9px;background:#f8fbfd;color:#28647a;font-size:.7rem}.mini-item{padding:10px 0;border-bottom:1px solid #edf1f5}.mini-item strong,.mini-item span{display:block}.mini-item span,.mini-item p,.saved-row small,.note-card small{font-size:.73rem;color:#8090a3}.mini-item p{margin:5px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.collection-row{display:flex;gap:12px;align-items:center;padding:10px 0}.collection-row>i{font-size:1.25rem;color:#168b9a}.collection-row strong,.collection-row span{display:block}.collection-row span{font-size:.72rem;color:#7b8ba0}.empty-state{padding:24px;text-align:center;border:1px dashed #d5e0ea;border-radius:10px;color:#8493a5;font-size:.84rem}.saved-row,.saved-row>div:first-child{min-width:0}.saved-row{display:flex;justify-content:space-between;gap:15px;align-items:center}.saved-row p{font-size:.8rem;color:#6c7d91;margin:5px 0}.note-content{white-space:pre-wrap;overflow-wrap:anywhere;margin-top:14px!important}.collection-cases{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}@media(max-width:650px){.workspace-hero{align-items:flex-start;flex-direction:column;padding:22px}.workspace-hero .btn{width:100%}.workspace-panel{padding:16px}.saved-row{align-items:flex-start;flex-direction:column}.case-actions .btn{flex:1}.workspace-tabs button{flex:1 1 calc(50% - 8px)}}

.request-section-title { display:flex; align-items:center; gap:8px; margin:0 0 12px; color:#173b5c; font-size:.95rem; font-weight:800; }
.request-card { margin-bottom:12px; padding:15px; border:1px solid #e0e9e3; border-radius:10px; background:#fbfdfb; }
.request-card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.request-card-head strong,.request-card-head small { display:block; }
.request-card-head strong { color:#30463a; font-size:.88rem; }
.request-card-head small,.request-date { color:#849289; font-size:.72rem; }
.request-card h4 { margin:12px 0 5px; color:#1f3d2e; font-size:.9rem; font-weight:750; }
.request-card p { margin:0 0 9px; color:#687b70; font-size:.82rem; white-space:pre-wrap; }
.request-status { display:inline-flex; padding:4px 8px; border-radius:20px; color:#63766a; background:#eef2ef; font-size:.68rem; font-weight:750; text-transform:capitalize; }
.status-pending { color:#916d22; background:#fff5dd; }
.status-accepted { color:#18774e; background:#e8f6ee; }
.status-declined,.status-cancelled { color:#8b5d5d; background:#f8eeee; }
.request-actions { display:flex; flex-wrap:wrap; gap:7px; margin-top:12px; }

</style>
