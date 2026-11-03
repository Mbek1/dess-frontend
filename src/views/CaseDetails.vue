<template>
  <div class="container py-5 case-details-bg">
    <div v-if="loadingCase" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading case details...</p>
    </div>
    <div v-else-if="caseError" class="alert alert-danger" role="alert">
      <h4 class="alert-heading">Error loading case</h4>
      <p>{{ caseError }}</p>
      <hr>
      <p class="mb-0"><a href="#/archives" class="btn btn-outline-danger btn-sm">Back to Archives</a></p>
    </div>
    <div v-else-if="caseItem">
    <!-- Breadcrumbs -->
    <nav aria-label="breadcrumb" class="mb-4">
      <ol class="breadcrumb bg-transparent p-0 mb-0">
        <li class="breadcrumb-item"><a href="#/investigator">Dashboard</a></li>
        <li class="breadcrumb-item"><a href="#/archives">Archives</a></li>
        <li class="breadcrumb-item active" aria-current="page">Case #{{ caseItem.number }}</li>
      </ol>
    </nav>
    <!-- Case Header -->
    <div class="case-header card p-4 mb-4 d-flex flex-md-row flex-column align-items-md-center align-items-start gap-4">
      <div class="flex-grow-1">
        <h2 class="fw-bold mb-1 text-primary">{{ caseItem.caseId || `Case #${caseItem.number}` }}: {{ caseItem.name }}</h2>
        <div class="mb-2">
          <span :class="caseItem.status === 'open' ? 'badge status-badge bg-success' : 'badge status-badge bg-secondary'">{{ caseItem.status }}</span>
          <span v-if="caseItem.caseType" class="badge bg-info ms-2 text-capitalize">{{ caseItem.caseType }} Case</span>
        </div>
        <p class="mt-2 text-muted">{{ caseItem.description }}</p>
      </div>
      <div>
        <button class="btn btn-outline-primary" @click="showAddEvidence = true"><i class="bi bi-plus-circle"></i> Add Evidence</button>
      </div>
    </div>
    <!-- Evidence Section -->
    <div class="evidence-section card p-4 mb-4">
      <h4 class="mb-3 fw-semibold text-dark">Evidence</h4>
      <div v-if="caseItem.evidence && caseItem.evidence.filter((ev: any) => !ev.deleted).length">
        <ul class="list-group evidence-list">
          <li v-for="ev in caseItem.evidence.filter((ev: any) => !ev.deleted)" :key="ev._id || ev.filename" class="list-group-item d-flex align-items-center gap-3">
            <div class="evidence-icon"><i class="bi bi-file-earmark-text"></i></div>
            <div class="flex-grow-1">
              <div class="fw-semibold">{{ ev.name || ev.filename }}</div>
              <div class="text-muted small">Type: {{ ev.type }} | Format: {{ ev.format }}</div>
              <div class="text-muted small">Description: {{ ev.description }}</div>
              <div class="text-muted small">Hash: {{ ev.hash }}</div>
              <span class="badge" :class="ev.visibleToResearchers ? 'bg-success' : 'bg-secondary'">
                {{ ev.visibleToResearchers ? 'Shared with researchers' : 'Investigator-only' }}
              </span>
              <div v-if="ev.deletionRequest?.status === 'pending'" class="small text-warning mt-2">
                Deletion vote: {{ ev.deletionRequest.votes.length }}/{{ ev.deletionRequest.eligibleVoterIds.length }} votes · Due {{ formatVoteDeadline(ev.deletionRequest.expiresAt) }}
              </div>
              <div v-else-if="ev.deletionRequest?.status === 'kept'" class="small text-success mt-2">
                Retained: {{ formatVoteResolution(ev.deletionRequest.resolution) }}
              </div>
              <div v-else-if="ev.deleted" class="small text-danger mt-2">Deleted by team majority</div>
              <div v-if="verificationResults[ev._id]" class="small" :class="verificationResults[ev._id].matches ? 'text-success' : 'text-danger'">
                SHA-256 {{ verificationResults[ev._id].matches ? 'MATCH' : 'MISMATCH' }}
                <span v-if="verificationResults[ev._id].error">: {{ verificationResults[ev._id].error }}</span>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-success" :disabled="verifyingEvidenceId === ev._id" @click="verifyEvidence(ev)">
                <i class="bi bi-shield-check"></i> {{ verifyingEvidenceId === ev._id ? 'Checking...' : 'Verify' }}
              </button>
              <button class="btn btn-sm btn-outline-info" @click="viewEvidence(ev)" title="View uploaded evidence"><i class="bi bi-eye"></i> View file</button>
              <button class="btn btn-sm" :class="ev.visibleToResearchers ? 'btn-outline-warning' : 'btn-outline-primary'" :disabled="ev.deletionRequest?.status === 'pending'" @click="toggleResearcherVisibility(ev)">
                <i class="bi" :class="ev.visibleToResearchers ? 'bi-eye-slash' : 'bi-globe2'"></i>
                {{ ev.visibleToResearchers ? 'Make private' : 'Share with researchers' }}
              </button>
              <template v-if="ev.deletionRequest?.status === 'pending' && !ev.deleted">
                <button class="btn btn-sm btn-outline-success" :disabled="hasVoted(ev)" @click="castDeletionVote(ev, 'keep')">Keep</button>
                <button class="btn btn-sm btn-outline-danger" :disabled="hasVoted(ev)" @click="castDeletionVote(ev, 'delete')">Vote delete</button>
              </template>
              <button v-else-if="!ev.deleted" class="btn btn-sm btn-outline-danger" @click="openDeleteModal(ev)">
                <i class="bi bi-trash3"></i> Request deletion
              </button>
            </div>
          </li>
        </ul>
      </div>
      <div v-else class="text-center text-muted py-4">
        <img src="/img/no-evidence.svg" alt="No evidence" style="height: 80px;" class="mb-2" />
        <div>No evidence uploaded for this case yet.</div>
        <button class="btn btn-outline-primary mt-3" @click="showAddEvidence = true"><i class="bi bi-plus-circle"></i> Add Evidence</button>
      </div>
      <div v-if="evidencePreview" class="evidence-preview-backdrop" @click.self="closeEvidencePreview">
        <section class="evidence-preview-dialog" role="dialog" aria-modal="true" :aria-label="`Evidence preview: ${evidencePreview.name}`">
          <header class="evidence-preview-header">
            <div><h5>{{ evidencePreview.name }}</h5><small>{{ evidencePreview.mimeType }}</small></div>
            <button type="button" class="btn-close" aria-label="Close evidence preview" @click="closeEvidencePreview"></button>
          </header>
          <div class="evidence-preview-content">
            <img v-if="evidencePreview.mimeType.startsWith('image/')" :src="evidencePreview.url" :alt="evidencePreview.name" />
            <video v-else-if="evidencePreview.mimeType.startsWith('video/')" :src="evidencePreview.url" controls />
            <audio v-else-if="evidencePreview.mimeType.startsWith('audio/')" :src="evidencePreview.url" controls />
            <iframe v-else-if="evidencePreview.mimeType === 'application/pdf' || evidencePreview.mimeType === 'text/plain'" :src="evidencePreview.url" :title="evidencePreview.name"></iframe>
            <div v-else class="text-center text-muted p-5">This file type cannot be previewed inline. Use Download to inspect it.</div>
          </div>
          <footer class="evidence-preview-footer">
            <span>Verified case access · SHA-256 {{ evidencePreview.hash.slice(0, 16) }}...</span>
            <a class="btn btn-primary btn-sm" :href="evidencePreview.url" :download="evidencePreview.name"><i class="bi bi-download"></i> Download</a>
          </footer>
        </section>
      </div>
      <div v-if="evidenceActionError" class="alert alert-danger mt-3" role="alert">{{ evidenceActionError }}</div>
      <!-- Delete Evidence Modal -->
      <div v-if="showDeleteModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
        <div class="modal-dialog">
          <div class="modal-content evidence-modal">
            <div class="modal-header">
              <h5 class="modal-title">Request Evidence Deletion</h5>
              <button type="button" class="btn-close" @click="closeDeleteModal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">Provide a reason to start a team vote for <b>{{ evidenceToDelete?.name || evidenceToDelete?.filename }}</b>. The file is kept if votes tie or the vote is incomplete after three working days.</div>
              <input v-model="deleteReason" type="text" class="form-control mb-3" placeholder="Reason for deletion" required />
              <div class="d-flex justify-content-end gap-2">
                <button class="btn btn-secondary" @click="closeDeleteModal">Cancel</button>
                <button class="btn btn-danger" :disabled="!deleteReason.trim() || requestingDeletion" @click="deleteEvidence">{{ requestingDeletion ? 'Opening vote...' : 'Open deletion vote' }}</button>
              </div>
              <div v-if="deleteError" class="text-danger mt-2 small">{{ deleteError }}</div>
            </div>
          </div>
        </div>
      </div>
      <!-- ...existing code for empty state and single delete modal... -->
    </div>
    <!-- Add Evidence Modal -->
    <div v-if="showAddEvidence" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
      <div class="modal-dialog">
        <div class="modal-content evidence-modal">
          <div class="modal-header">
            <h5 class="modal-title">Add Evidence</h5>
            <button type="button" class="btn-close" @click="closeAddEvidence"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitEvidence">
              <div class="mb-3">
                <label class="form-label">Evidence File</label>
                <input type="file" class="form-control" @change="handleEvidenceFile" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Name of Evidence</label>
                <input v-model="evidenceName" type="text" class="form-control" placeholder="Enter evidence name" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Description of Evidence</label>
                <textarea v-model="evidenceDescription" class="form-control" rows="2" placeholder="Describe the evidence" required></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Format Type</label>
                <input v-model="evidenceFormat" type="text" class="form-control" placeholder="Auto-detected format" readonly />
              </div>
              <button type="submit" class="btn btn-primary w-100">Upload Evidence</button>
            </form>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// --- Evidence Deletion Modal State ---
const showDeleteModal = ref(false);
const evidenceToDelete = ref<any>(null);
const deleteReason = ref('');
const deleteError = ref('');

function openDeleteModal(ev: any) {
  evidenceToDelete.value = ev;
  deleteReason.value = '';
  deleteError.value = '';
  showDeleteModal.value = true;
}
async function viewEvidence(ev: any) {
  evidenceActionError.value = '';
  try {
    const response = await axios.get(`/api/cases/${caseItem.value._id}/evidence/${ev._id}/file`, { responseType: 'blob' });
    const mimeType = response.headers['content-type'] || ev.mimeType || 'application/octet-stream';
    evidencePreview.value = {
      name: ev.originalName || ev.name || 'Evidence file',
      mimeType,
      hash: ev.hash,
      url: URL.createObjectURL(response.data)
    };
  } catch (err: any) {
    evidenceActionError.value = err?.response?.data?.error || 'Failed to load evidence file';
  }
}
function closeEvidencePreview() {
  if (evidencePreview.value?.url) URL.revokeObjectURL(evidencePreview.value.url);
  evidencePreview.value = null;
}
function hasVoted(ev: any) {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  return ev.deletionRequest?.votes?.some((vote: any) => vote.userId === user.id) || false;
}
function formatVoteDeadline(value: string) {
  return new Date(value).toLocaleDateString();
}
function formatVoteResolution(value: string) {
  return ({ tie_keep: 'vote tied; evidence retained', majority_keep: 'team majority retained evidence', timeout_keep: 'vote expired; evidence retained' } as Record<string, string>)[value] || 'evidence retained';
}
async function toggleResearcherVisibility(ev: any) {
  evidenceActionError.value = '';
  try {
    await axios.patch(`/api/cases/${caseItem.value._id}/evidence/${ev._id}/visibility`, {
      visibleToResearchers: !ev.visibleToResearchers
    });
    await fetchCase();
  } catch (err: any) {
    evidenceActionError.value = err?.response?.data?.error || 'Failed to update researcher access';
  }
}
async function castDeletionVote(ev: any, decision: 'delete' | 'keep') {
  evidenceActionError.value = '';
  try {
    await axios.post(`/api/cases/${caseItem.value._id}/evidence/${ev._id}/deletion-vote`, { decision });
    await fetchCase();
  } catch (err: any) {
    evidenceActionError.value = err?.response?.data?.error || 'Failed to submit vote';
  }
}
function closeDeleteModal() {
  showDeleteModal.value = false;
  evidenceToDelete.value = null;
  deleteReason.value = '';
  deleteError.value = '';
}
async function deleteEvidence() {
  if (!caseItem.value || !evidenceToDelete.value || !deleteReason.value.trim()) return;
  requestingDeletion.value = true;
  deleteError.value = '';
  try {
    await axios.post(`/api/cases/${caseItem.value._id}/evidence/${evidenceToDelete.value._id}/deletion-request`, { reason: deleteReason.value.trim() });
    await fetchCase();
    closeDeleteModal();
  } catch (err: any) {
    deleteError.value = err?.response?.data?.error || 'Failed to start deletion vote';
  } finally {
    requestingDeletion.value = false;
  }
}
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const caseItem = ref<any>(null);
const loadingCase = ref(true);
const caseError = ref('');
const showAddEvidence = ref(false);
const evidenceFile = ref<File|null>(null);
const evidenceType = ref('');
const evidenceName = ref('');
const evidenceDescription = ref('');
const evidenceFormat = ref('');
const addingEvidence = ref(false);
const addEvidenceError = ref('');
const verifyingEvidenceId = ref<string | null>(null);
const verificationResults = ref<Record<string, { matches: boolean; error?: string }>>({});
const evidencePreview = ref<{ name: string; mimeType: string; hash: string; url: string } | null>(null);
const evidenceActionError = ref('');
const requestingDeletion = ref(false);

onMounted(async () => {
  await fetchCase();
});

async function fetchCase() {
  loadingCase.value = true;
  caseError.value = '';
  try {
    const id = route.params.id;
    const res = await axios.get(`/api/cases/${id}`);
    caseItem.value = res.data;
  } catch (err: any) {
    caseError.value = err?.response?.data?.error || 'Failed to fetch case details';
  } finally {
    loadingCase.value = false;
  }
}

function handleEvidenceFile(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  evidenceFile.value = files && files.length ? files[0] : null;
  if (evidenceFile.value) {
    // Auto-detect format type and set evidenceType
    const type = evidenceFile.value.type || '';
    let format = '';
    let detectedType = '';
    if (type.startsWith('image/')) { format = 'Image'; detectedType = 'image'; }
    else if (type.startsWith('video/')) { format = 'Video'; detectedType = 'video'; }
    else if (type.startsWith('audio/')) { format = 'Audio'; detectedType = 'audio'; }
    else if (type === 'application/pdf') { format = 'PDF Document'; detectedType = 'pdf'; }
    else if (type.startsWith('application/')) { format = 'Document'; detectedType = 'document'; }
    else if (type) { format = type; detectedType = type; }
    else {
      // fallback to file extension
      const ext = evidenceFile.value.name.split('.').pop()?.toLowerCase();
      if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif') { format = 'Image'; detectedType = 'image'; }
      else if (ext === 'mp4' || ext === 'avi' || ext === 'mov') { format = 'Video'; detectedType = 'video'; }
      else if (ext === 'mp3' || ext === 'wav') { format = 'Audio'; detectedType = 'audio'; }
      else if (ext === 'pdf') { format = 'PDF Document'; detectedType = 'pdf'; }
      else if (ext) { format = ext.toUpperCase(); detectedType = ext; }
      else { format = 'Unknown'; detectedType = 'unknown'; }
    }
    evidenceFormat.value = format;
    evidenceType.value = detectedType;
  } else {
    evidenceFormat.value = '';
    evidenceType.value = '';
  }
}
function closeAddEvidence() {
  showAddEvidence.value = false;
  evidenceFile.value = null;
  evidenceType.value = '';
  evidenceName.value = '';
  evidenceDescription.value = '';
  evidenceFormat.value = '';
  addEvidenceError.value = '';
}
async function submitEvidence() {
  if (!caseItem.value || !evidenceFile.value || !evidenceName.value || !evidenceDescription.value) return;
  addingEvidence.value = true;
  addEvidenceError.value = '';
  try {
    // Upload file to server first
    const formData = new FormData();
    formData.append('evidence', evidenceFile.value);
    const uploadRes = await axios.post(`/api/cases/${caseItem.value._id}/upload-evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    const uploadedFilename = uploadRes.data.filename;
    if (!uploadRes.data.hash) throw new Error('Server did not return the calculated SHA-256 hash');
    
    const payload = {
      filename: uploadedFilename,
      originalName: uploadRes.data.originalName || evidenceFile.value.name,
      mimeType: uploadRes.data.mimeType || evidenceFile.value.type || 'application/octet-stream',
      type: evidenceType.value,
      name: evidenceName.value,
      description: evidenceDescription.value,
      format: evidenceFormat.value
    };
    await axios.post(`/api/cases/${caseItem.value._id}/evidence`, payload);
    await fetchCase(); // Refresh case details
    closeAddEvidence();
  } catch (err: any) {
    addEvidenceError.value = err?.response?.data?.error || 'Failed to add evidence';
  } finally {
    addingEvidence.value = false;
  }
}

async function verifyEvidence(ev: any) {
  if (!caseItem.value || !ev?._id) return;
  verifyingEvidenceId.value = ev._id;
  delete verificationResults.value[ev._id];
  try {
    const response = await axios.post(`/api/cases/${caseItem.value._id}/evidence/${ev._id}/verify`);
    verificationResults.value[ev._id] = { matches: response.data.matches };
  } catch (err: any) {
    verificationResults.value[ev._id] = {
      matches: false,
      error: err?.response?.data?.error || 'Verification failed'
    };
  } finally {
    verifyingEvidenceId.value = null;
  }
}
</script>

<style scoped>
.case-details-bg {
  background: linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%);
  min-height: 100vh;
  border-radius: 1.5rem;
  box-shadow: 0 2px 24px 0 rgba(31,125,83,0.06);
  padding-bottom: 3rem !important;
}
.case-header.card {
  border-radius: 1.2rem;
  box-shadow: 0 2px 12px 0 rgba(31,125,83,0.10);
  background: linear-gradient(90deg, #f0f4ff 0%, #f8fafc 100%);
}
.status-badge {
  font-size: 1rem;
  padding: 0.5em 1em;
  border-radius: 1em;
  letter-spacing: 0.03em;
  display: inline-block;
}
.status-badge.bg-success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%) !important;
  color: #10b981 !important;
  font-weight: 500;
}
.status-badge.bg-secondary {
  background: linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%) !important;
  color: #6b7280 !important;
  font-weight: 500;
}
.evidence-section.card {
  border-radius: 1.2rem;
  box-shadow: 0 2px 12px 0 rgba(31,125,83,0.08);
  background: #fff;
}
.evidence-list .list-group-item {
  border: none;
  border-radius: 0.7em;
  margin-bottom: 0.3em;
  background: #f3f4f6;
  transition: background 0.15s;
  flex-wrap: wrap;
}
.evidence-list .list-group-item:hover {
  background: #f8fafc;
}
.evidence-icon {
  font-size: 2rem;
  color: #2563eb;
  background: #e0e7ff;
  border-radius: 0.7em;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.evidence-modal {
  border-radius: 1.1em;
  box-shadow: 0 4px 24px 0 rgba(31,125,83,0.16);
}
.breadcrumb {
  background: none;
  font-size: 1.05rem;
}
.breadcrumb-item a {
  color: #2563eb;
  text-decoration: none;
}
.breadcrumb-item a:hover {
  text-decoration: underline;
}
.evidence-preview-backdrop {
  position: fixed;
  z-index: 1200;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(3, 12, 27, .82);
}
.evidence-preview-dialog {
  display: flex;
  width: min(1050px, 100%);
  max-height: min(92vh, 900px);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #244c70;
  border-radius: 8px;
  background: #071d39;
  box-shadow: 0 24px 70px rgba(0, 0, 0, .45);
}
.evidence-preview-header,
.evidence-preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  color: #e7f2ff;
  background: #0a2748;
}
.evidence-preview-header h5 { margin: 0; font-size: 14px; }
.evidence-preview-header small,
.evidence-preview-footer span { color: #9db9d8; font-size: 10px; }
.evidence-preview-content { display: grid; min-height: 220px; flex: 1; place-items: center; overflow: auto; padding: 14px; background: #031124; }
.evidence-preview-content img,
.evidence-preview-content video { max-width: 100%; max-height: 70vh; object-fit: contain; }
.evidence-preview-content audio { width: min(600px, 100%); }
.evidence-preview-content iframe { width: 100%; min-height: 68vh; border: 0; background: white; }
.evidence-preview-footer { border-top: 1px solid #244c70; }

/* Mobile responsiveness */
@media (max-width: 768px) {
  .case-details-bg {
    padding: 1rem !important;
    border-radius: 0.75rem;
    padding-bottom: 2rem !important;
  }

  .case-header.card {
    border-radius: 0.8rem;
    padding: 1.5rem !important;
    flex-direction: column !important;
  }

  .case-header h2 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .case-header div:last-child {
    width: 100%;
  }

  .case-header .btn {
    width: 100%;
  }

  .evidence-section.card {
    border-radius: 0.8rem;
    padding: 1.5rem !important;
  }

  .evidence-list .list-group-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .evidence-icon {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .evidence-list .list-group-item .btn {
    width: 100%;
    margin-left: 0 !important;
    margin-top: 0.5rem;
  }

  .modal-dialog {
    margin: 0.5rem;
  }

  .breadcrumb {
    font-size: 0.9rem;
  }

  .breadcrumb-item {
    margin-right: 0.25rem;
  }

  .form-control,
  .form-label,
  textarea {
    font-size: 16px;
  }

  .btn-primary,
  .btn-secondary,
  .btn-danger {
    padding: 0.625rem 1rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .case-details-bg {
    padding: 0.75rem !important;
  }

  .case-header.card {
    padding: 1rem !important;
  }

  .case-header h2 {
    font-size: 1.25rem;
  }

  .evidence-section.card {
    padding: 1rem !important;
  }

  .status-badge {
    font-size: 0.85rem;
    padding: 0.4em 0.8em;
  }

  .breadcrumb {
    font-size: 0.8rem;
  }

  .modal-content {
    border-radius: 0.75rem;
  }

  .modal-header h5 {
    font-size: 1.1rem;
  }

  h4 {
    font-size: 1.1rem;
  }

  .text-muted.small {
    font-size: 0.8rem;
  }
}
</style>
