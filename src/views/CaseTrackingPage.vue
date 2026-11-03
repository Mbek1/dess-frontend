<template>
  <div class="container py-5 case-tracking-bg">
    <!-- Loading State -->
    <div v-if="loadingCase" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading case tracking details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="caseError" class="alert alert-danger" role="alert">
      <h4 class="alert-heading">Error loading case</h4>
      <p>{{ caseError }}</p>
      <hr>
      <p class="mb-0"><a href="#/archives" class="btn btn-outline-danger btn-sm">Back to Archives</a></p>
    </div>

    <!-- Main Content -->
    <div v-else-if="caseItem" class="case-tracking-container">
      <!-- Breadcrumbs -->
      <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb bg-transparent p-0 mb-0">
          <li class="breadcrumb-item"><a href="#/investigator">Dashboard</a></li>
          <li class="breadcrumb-item"><a href="#/archives">Archives</a></li>
          <li class="breadcrumb-item active" aria-current="page">{{ caseItem.caseId || `Case #${caseItem.number}` }}</li>
        </ol>
      </nav>

      <!-- Case Header -->
      <div class="case-header card p-4 mb-4 shadow-sm">
        <div class="d-flex flex-column flex-md-row align-items-md-between gap-3 mb-3">
          <div class="flex-grow-1">
            <h2 class="fw-bold mb-2 text-primary">{{ caseItem.caseId || `Case #${caseItem.number}` }}: {{ caseItem.name }}</h2>
            <div class="mb-2">
              <span :class="'badge ' + (caseItem.status === 'open' ? 'bg-success' : 'bg-secondary')">
                {{ caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1) }}
              </span>
              <span v-if="caseItem.caseType" class="badge bg-info text-capitalize ms-2">{{ caseItem.caseType }} Case</span>
              <span v-if="caseItem.escalationStatus === 'court'" class="badge bg-danger ms-2">
                <i class="bi bi-gavel"></i> Escalated to Court
              </span>
            </div>
          </div>
        </div>

        <!-- Case Description -->
        <div class="mb-4">
          <h5 class="fw-semibold text-dark">Description</h5>
          <p class="text-muted">{{ caseItem.description }}</p>
        </div>

        <!-- Case Details Grid -->
        <div class="row g-3 mb-4 pb-4 border-bottom">
          <div class="col-md-6">
            <div class="detail-item">
              <span class="detail-label">Created By:</span>
              <span class="detail-value">{{ caseItem.createdBy?.name || 'N/A' }}</span>
              <small class="text-muted ms-2">({{ caseItem.createdBy?.email }})</small>
            </div>
          </div>
          <div class="col-md-6">
            <div class="detail-item">
              <span class="detail-label">Created Date:</span>
              <span class="detail-value">{{ formatDate(caseItem.createdAt) }}</span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="detail-item">
              <span class="detail-label">Keywords:</span>
              <span class="detail-value">{{ caseItem.keywords || 'N/A' }}</span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="detail-item">
              <span class="detail-label">Docket Number:</span>
              <span class="detail-value">{{ caseItem.docketNumber || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- Escalation Info -->
        <div v-if="caseItem.escalationDetails && caseItem.escalationStatus === 'court'" class="alert alert-warning mb-0">
          <h6 class="alert-heading"><i class="bi bi-gavel"></i> Case Escalated to Court</h6>
          <div class="row g-2 small">
            <div class="col-md-6">
              <strong>Court Docket Number:</strong> {{ caseItem.escalationDetails.courtDocketNumber }}
            </div>
            <div class="col-md-6">
              <strong>Escalation Date:</strong> {{ formatDate(caseItem.escalationDetails.escalatedToCourtDate) }}
            </div>
            <div class="col-md-12">
              <strong>Escalated By:</strong> {{ caseItem.escalationDetails.escalatedToCourtBy?.name }}
              ({{ caseItem.escalationDetails.escalatedToCourtBy?.email }})
            </div>
          </div>
        </div>
      </div>

      <!-- Case Updates Section -->
      <div class="card p-4 mb-4 shadow-sm">
        <div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
          <h5 class="fw-semibold mb-0">Case Updates & Details</h5>
          <button class="btn btn-outline-primary btn-sm" @click="showUpdateModal = true">
            <i class="bi bi-plus-circle"></i> Add Update
          </button>
        </div>

        <!-- Updates List -->
        <div v-if="caseItem.caseUpdates && caseItem.caseUpdates.length" class="updates-timeline">
          <div v-for="(update, idx) in caseItem.caseUpdates" :key="idx" class="update-item mb-3 pb-3" :class="{ 'border-bottom': idx < caseItem.caseUpdates.length - 1 }">
            <div class="d-flex align-items-start gap-2">
              <div class="update-icon">
                <i class="bi bi-chat-left-text"></i>
              </div>
              <div class="flex-grow-1">
                <div class="d-flex align-items-center justify-content-between">
                  <strong>{{ update.updatedBy?.name || 'System' }}</strong>
                  <small class="text-muted">{{ formatDate(update.date) }}</small>
                </div>
                <small class="text-muted d-block mb-2">{{ update.updatedBy?.email }}</small>
                <p class="mb-0">{{ update.details }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-muted py-4">
          <p>No case updates yet. Add an update to track the latest case information.</p>
        </div>
      </div>

      <!-- Add Update Modal -->
      <div v-if="showUpdateModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add Case Update</h5>
              <button type="button" class="btn-close" @click="showUpdateModal = false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Update Details</label>
                <textarea v-model="updateDetails" class="form-control" rows="4" placeholder="Enter the latest case information or updates..." required></textarea>
              </div>
              <div v-if="updateError" class="alert alert-danger mb-3">{{ updateError }}</div>
              <div class="d-flex justify-content-end gap-2">
                <button class="btn btn-secondary" @click="showUpdateModal = false">Cancel</button>
                <button class="btn btn-primary" :disabled="!updateDetails.trim() || submittingUpdate" @click="submitUpdate">
                  <span v-if="submittingUpdate" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {{ submittingUpdate ? 'Adding...' : 'Add Update' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Team Management Section -->
      <div class="card p-4 mb-4 shadow-sm">
        <div class="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
          <h5 class="fw-semibold mb-0">Case Team</h5>
          <button class="btn btn-outline-primary btn-sm" @click="showAddTeamModal = true">
            <i class="bi bi-person-plus"></i> Add Team Member
          </button>
        </div>

        <!-- Team Members List -->
        <div v-if="caseItem.team && caseItem.team.length" class="team-list">
          <div v-for="member in caseItem.team" :key="member.id" class="team-member-item mb-3 p-3 rounded bg-light d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
              <div class="team-member-avatar">
                <i class="bi bi-person-circle"></i>
              </div>
              <div>
                <div class="fw-semibold">{{ member.name }}</div>
                <small class="text-muted">{{ member.email }}</small>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-muted py-4">
          <p>No team members assigned yet.</p>
        </div>
      </div>

      <!-- Add Team Member Modal -->
      <div v-if="showAddTeamModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add Team Member</h5>
              <button type="button" class="btn-close" @click="showAddTeamModal = false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Search Users</label>
                <div class="input-group">
                  <input v-model="teamUserSearch" @input="searchTeamUsers" type="text" class="form-control" placeholder="Search by name or email..." />
                  <button class="btn btn-outline-secondary" type="button" @click="searchTeamUsers">
                    <i class="bi bi-search"></i>
                  </button>
                </div>
              </div>
              <div v-if="teamUserResults.length" class="list-group mb-3">
                <button v-for="user in teamUserResults" :key="user._id" type="button" class="list-group-item list-group-item-action d-flex align-items-center flex-column align-items-start" @click="addTeamMember(user)">
                  <div class="d-flex align-items-center w-100">
                    <i class="bi bi-person me-2"></i> 
                    <span class="fw-bold">{{ user.name }}</span> 
                    <span class="ms-auto text-muted small">{{ user.email }}</span>
                  </div>
                  <small v-if="user.organizationRole || user.organizationName" class="text-muted ms-4" style="margin-top: 0.25rem;">
                    <i class="bi bi-building"></i> {{ user.organizationRole }}{{ user.organizationRole && user.organizationName ? ', ' : '' }}{{ user.organizationName }}
                  </small>
                </button>
              </div>
              <div v-if="teamUserSearch && !teamUserResults.length" class="text-muted mb-3">No users found</div>
              <div v-if="addTeamError" class="alert alert-danger mb-3">{{ addTeamError }}</div>
              <div v-if="addTeamSuccess" class="alert alert-success mb-3">Team member added successfully!</div>
              <div class="d-flex justify-content-end gap-2">
                <button class="btn btn-secondary" @click="showAddTeamModal = false">Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Escalate to Court Modal -->
      <div v-if="showEscalateModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-gavel"></i> Escalate Case to Court</h5>
              <button type="button" class="btn-close" @click="showEscalateModal = false"></button>
            </div>
            <div class="modal-body">
              <p class="text-muted mb-3">Enter the court docket number to escalate this case to court proceedings.</p>
              <div class="mb-3">
                <label class="form-label">Court Docket Number</label>
                <input v-model="courtDocketNumber" type="text" class="form-control" placeholder="e.g., 2026-COURT-12345" required />
                <small class="text-muted">Maintain the format: YYYY-COURT-NUMBER</small>
              </div>
              <div v-if="escalateError" class="alert alert-danger mb-3">{{ escalateError }}</div>
              <div class="d-flex justify-content-end gap-2">
                <button class="btn btn-secondary" @click="showEscalateModal = false">Cancel</button>
                <button class="btn btn-danger" :disabled="!courtDocketNumber.trim() || submittingEscalation" @click="submitEscalation">
                  <span v-if="submittingEscalation" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {{ submittingEscalation ? 'Escalating...' : 'Escalate to Court' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="card p-4 shadow-sm">
        <div class="d-flex flex-wrap gap-2">
          <button v-if="caseItem.escalationStatus !== 'court'" class="btn btn-danger" @click="showEscalateModal = true">
            <i class="bi bi-gavel"></i> Escalate to Court
          </button>
          <button class="btn btn-outline-primary" @click="goToCaseDetails">
            <i class="bi bi-arrow-right"></i> Full Case Details
          </button>
          <button class="btn btn-outline-secondary" @click="goBackToArchives">
            <i class="bi bi-arrow-left"></i> Back to Archives
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const caseItem = ref<any>(null);
const loadingCase = ref(true);
const caseError = ref('');

const showUpdateModal = ref(false);
const updateDetails = ref('');
const updateError = ref('');
const submittingUpdate = ref(false);

const showAddTeamModal = ref(false);
const teamUserSearch = ref('');
const teamUserResults = ref<any[]>([]);
const addTeamError = ref('');
const addTeamSuccess = ref(false);
const allUsers = ref<any[]>([]);

const showEscalateModal = ref(false);
const courtDocketNumber = ref('');
const escalateError = ref('');
const submittingEscalation = ref(false);

function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function loadCase() {
  loadingCase.value = true;
  caseError.value = '';
  try {
    const response = await axios.get(`/api/cases/${route.params.id}`);
    caseItem.value = response.data;
  } catch (err: any) {
    caseError.value = err?.response?.data?.error || 'Failed to load case';
    console.error('Error loading case:', err);
  } finally {
    loadingCase.value = false;
  }
}

async function submitUpdate() {
  submittingUpdate.value = true;
  updateError.value = '';
  try {
    const response = await axios.put(`/api/cases/${route.params.id}/add-update`, {
      details: updateDetails.value
    });
    caseItem.value = response.data.case;
    updateDetails.value = '';
    showUpdateModal.value = false;
  } catch (err: any) {
    updateError.value = err?.response?.data?.error || 'Failed to add update';
  } finally {
    submittingUpdate.value = false;
  }
}

async function fetchUsers() {
  try {
    const res = await axios.get('/api/users');
    if (Array.isArray(res.data)) {
      allUsers.value = res.data;
    } else if (res.data && typeof res.data === 'object' && Array.isArray(res.data.users)) {
      allUsers.value = res.data.users;
    } else {
      allUsers.value = [];
    }
  } catch (err) {
    allUsers.value = [];
  }
}

function searchTeamUsers() {
  const q = teamUserSearch.value.trim().toLowerCase();
  if (!q) {
    teamUserResults.value = [];
    return;
  }
  teamUserResults.value = allUsers.value
    .filter((u) => u.role === 'investigator')
    .filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .filter((u) => !caseItem.value.team.some((m: any) => m.id === u._id));
}

async function addTeamMember(user: any) {
  addTeamError.value = '';
  addTeamSuccess.value = false;

  try {
    const response = await axios.post(`/api/cases/${route.params.id}/add-member`, {
      userId: user._id,
      userName: user.name,
      userEmail: user.email
    });
    caseItem.value = response.data.case;
    teamUserSearch.value = '';
    teamUserResults.value = [];
    addTeamSuccess.value = true;

    setTimeout(() => {
      addTeamSuccess.value = false;
    }, 3000);
  } catch (err: any) {
    addTeamError.value = err?.response?.data?.error || 'Failed to add team member';
  }
}

async function submitEscalation() {
  submittingEscalation.value = true;
  escalateError.value = '';
  try {
    const response = await axios.post(`/api/cases/${route.params.id}/escalate-to-court`, {
      courtDocketNumber: courtDocketNumber.value
    });
    caseItem.value = response.data.case;
    courtDocketNumber.value = '';
    showEscalateModal.value = false;
  } catch (err: any) {
    escalateError.value = err?.response?.data?.error || 'Failed to escalate case';
  } finally {
    submittingEscalation.value = false;
  }
}

function goToCaseDetails() {
  router.push(`/cases/${route.params.id}`);
}

function goBackToArchives() {
  router.push('/archives');
}

onMounted(async () => {
  await loadCase();
  await fetchUsers();
});
</script>

<style scoped>
.case-tracking-bg {
  background: linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%);
  min-height: 100vh;
  border-radius: 1.5rem;
  padding-bottom: 3rem !important;
}

.case-header {
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 12px 0 rgba(31,125,83,0.08);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.detail-value {
  color: #1f2937;
}

.updates-timeline {
  position: relative;
  padding: 1rem 0;
}

.update-item {
  position: relative;
}

.update-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-size: 1rem;
}

.team-member-item {
  transition: all 0.2s;
}

.team-member-item:hover {
  background: #dbeafe !important;
  box-shadow: 0 2px 8px rgba(37,99,235,0.15);
}

.team-member-avatar {
  font-size: 1.5rem;
  color: #2563eb;
}

.modal-content {
  border: none;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

.btn {
  border-radius: 0.5rem;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}

.list-group-item-action {
  cursor: pointer;
  border: 1px solid #e5e7eb;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
}

.list-group-item-action:hover {
  background: #f0f9ff;
  border-color: #2563eb;
}
</style>
