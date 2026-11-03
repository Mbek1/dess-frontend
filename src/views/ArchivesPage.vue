<template>
  <div class="container py-5 archives-bg">
    <div class="archives-header card shadow-sm mb-4 p-4 d-flex flex-column flex-md-row align-items-md-center align-items-start gap-3">
      <div class="d-flex align-items-center gap-3">
        <div class="archives-icon"><i class="bi bi-archive"></i></div>
        <div>
          <h2 class="fw-bold mb-0 text-primary">Case Archives</h2>
          <div class="text-muted small">Browse, filter, and manage all cases</div>
        </div>
      </div>
      <div class="d-flex align-items-center gap-2 ms-md-auto mt-3 mt-md-0">
        <button class="btn btn-outline-secondary btn-sm" @click="fetchCases"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
        <a href="#/investigator" class="btn btn-outline-primary"><i class="bi bi-arrow-left"></i> Back to Dashboard</a>
      </div>
    </div>

    <!-- Create Case Modal -->
    <div v-if="showCreateCase" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add New Case</h5>
            <button type="button" class="btn-close" @click="showCreateCase = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitCase">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Case Name</label>
                  <input v-model="newCase.name" type="text" class="form-control" required />
                </div>
                <div class="col-12">
                  <label class="form-label">Description</label>
                  <textarea v-model="newCase.description" class="form-control" rows="2" required></textarea>
                </div>
                <div class="col-12">
                  <label class="form-label">Keywords</label>
                  <input v-model="newCase.keywords" type="text" class="form-control" placeholder="e.g., fraud, theft, investigation" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Case Type</label>
                  <select v-model="newCase.caseType" class="form-select" required>
                    <option value="">Select case type...</option>
                    <option value="civil">Civil</option>
                    <option value="criminal">Criminal</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Docket Number</label>
                  <input v-model="newCase.docketNumber" type="text" class="form-control" placeholder="e.g., 2026-NYC-001" />
                </div>
                <div class="col-12">
                  <label class="form-label">Add Team Member(s)</label>
                  <div class="input-group mb-2">
                    <input v-model="userSearch" @input="searchUsers" type="text" class="form-control" placeholder="Search users..." />
                    <button class="btn btn-outline-secondary" type="button" @click="searchUsers"><i class="bi bi-search"></i></button>
                  </div>
                  <div v-if="userResults.length" class="list-group mb-2">
                    <button v-for="user in userResults" :key="user._id" type="button" class="list-group-item list-group-item-action d-flex align-items-center flex-column align-items-start" @click="addTeamMember(user)">
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
                  <div v-if="newCase.team && newCase.team.length" class="mb-2">
                    <span v-for="member in newCase.team" :key="member._id" class="badge bg-primary me-1">
                      <i class="bi bi-person"></i> {{ member.name }}
                      <i class="bi bi-x ms-1" style="cursor:pointer;" @click.stop="removeTeamMember(member)"></i>
                    </span>
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label">Status</label>
                  <select v-model="newCase.status" class="form-select">
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div class="mt-3 d-flex gap-2 justify-content-end">
                <button class="btn btn-secondary" type="button" @click="showCreateCase = false">Cancel</button>
                <button class="btn btn-primary" type="submit" :disabled="creatingCase">
                  <span v-if="creatingCase" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Create Case
                </button>
              </div>
              <div v-if="createCaseError" class="text-danger mt-2">{{ createCaseError }}</div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Cases Table -->
    <div class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Case</th>
              <th>Description</th>
              <th class="text-center">Status</th>
              <th class="text-center">Type</th>
              <th class="text-center">Toggle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingCases">
              <td colspan="7" class="text-center py-5">Loading...</td>
            </tr>
            <tr v-else-if="casesError">
              <td colspan="7" class="text-center text-danger py-5">{{ casesError }}</td>
            </tr>
            <tr v-else-if="!loadingCases && filteredCases.length === 0">
              <td colspan="7" class="text-center text-muted py-5">
                <div>No cases found for this filter.</div>
              </td>
            </tr>
            <tr v-for="caseItem in filteredCases" :key="caseItem._id" class="fade-in-row">
              <td class="fw-semibold" style="white-space: nowrap; min-width: 120px;">{{ caseItem.caseId || caseItem.number }}</td>
              <td style="min-width: 140px;">{{ caseItem.name }}</td>
              <td style="min-width: 80px;"><button class="btn btn-link desc-btn p-0" @click="viewDescription(caseItem)">View</button></td>
              <td class="text-center">
                <span :class="caseItem.status === 'open' ? 'badge status-badge bg-success' : 'badge status-badge bg-secondary'">
                  {{ caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1) }}
                </span>
              </td>
              <td class="text-center">
                <span v-if="caseItem.caseType" class="badge bg-info text-capitalize">{{ caseItem.caseType }}</span>
              </td>
              <td class="text-center">
                <div class="form-check form-switch d-flex align-items-center justify-content-center">
                  <input class="form-check-input status-toggle" type="checkbox" role="switch" :checked="caseItem.status === 'open'" @change="toggleStatus(caseItem)" :disabled="updatingCaseId === caseItem._id">
                </div>
              </td>
              <td style="min-width: 180px;">
                <div class="d-flex gap-2 flex-wrap">
                  <button class="btn btn-outline-primary btn-sm" @click="viewCase(caseItem)"><i class="bi bi-eye"></i> Details</button>
                  <button class="btn btn-outline-secondary btn-sm" @click="downloadCase(caseItem)"><i class="bi bi-download"></i> Download</button>
                  <button class="btn btn-outline-info btn-sm" @click="openInviteModal(caseItem)"><i class="bi bi-person-plus"></i> Invite</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Description Modal -->
    <div v-if="showDescModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Case Description</h5>
            <button type="button" class="btn-close" @click="showDescModal = false"></button>
          </div>
          <div class="modal-body">
            <p v-html="descModalText"></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Closure Document Upload Modal -->
    <div v-if="showClosureModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Upload Closure Documents</h5>
            <button type="button" class="btn-close" @click="cancelClosure"></button>
          </div>
          <div class="modal-body">
            <p>Please upload the chain of custody and any legal documents used during the case. At least one document is required to close the case.</p>
            <input type="file" class="form-control mb-3" multiple @change="handleClosureFiles" />
            <div v-if="closureFiles.length">
              <ul class="list-group mb-2">
                <li v-for="file in closureFiles" :key="file.name" class="list-group-item small">{{ file.name }}</li>
              </ul>
            </div>
            <div v-if="closureError" class="text-danger small mb-2">{{ closureError }}</div>
            <div class="d-flex justify-content-end gap-2">
              <button class="btn btn-secondary" @click="cancelClosure">Cancel</button>
              <button class="btn btn-primary" @click="submitClosureDocs">Continue</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Closure Confirmation Dialog -->
    <div v-if="showClosureConfirm" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Case Closure</h5>
            <button type="button" class="btn-close" @click="cancelClosure"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to close this case? <b>This action is irreversible.</b> All uploaded documents will be stored for audit purposes. Closed cases cannot be reopened.</p>
            <div class="d-flex justify-content-end gap-2">
              <button class="btn btn-secondary" @click="cancelClosure">Cancel</button>
              <button class="btn btn-danger" @click="confirmClosure">Yes, Close Case</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Invite Team Member Modal -->
    <div v-if="showInviteModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Invite Team Member to {{ inviteCase?.name }}</h5>
            <button type="button" class="btn-close" @click="closeInviteModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Search Users</label>
              <div class="input-group">
                <input v-model="inviteUserSearch" @input="searchInviteUsers" type="text" class="form-control" placeholder="Search by name or email..." />
                <button class="btn btn-outline-secondary" type="button" @click="searchInviteUsers"><i class="bi bi-search"></i></button>
              </div>
            </div>
            <div v-if="inviteUserResults.length" class="list-group mb-3">
              <button v-for="user in inviteUserResults" :key="user._id" type="button" class="list-group-item list-group-item-action d-flex align-items-center flex-column align-items-start" @click="inviteTeamMember(user)">
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
            <div v-if="inviteUserSearch && !inviteUserResults.length" class="text-muted mb-3">No users found</div>
            <div v-if="inviteCase?.team && inviteCase.team.length" class="mb-3">
              <label class="form-label">Current Team Members</label>
              <div>
                <span v-for="member in inviteCase.team" :key="member._id" class="badge bg-success me-2 mb-2">
                  <i class="bi bi-person-check"></i> {{ member.name }}
                </span>
              </div>
            </div>
            <div v-if="inviteError" class="alert alert-danger" role="alert">{{ inviteError }}</div>
            <div v-if="inviteSuccess" class="alert alert-success" role="alert">Team member added successfully!</div>
            <div class="d-flex justify-content-end gap-2">
              <button class="btn btn-secondary" @click="closeInviteModal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { useRouter, useRoute } from 'vue-router';

const showCreateCase = ref(false);
const creatingCase = ref(false);
const createCaseError = ref('');
const allUsers = ref<any[]>([]);
if (!Array.isArray(allUsers.value)) allUsers.value = [];
const userSearch = ref('');
const userResults = ref<any[]>([]);
const newCase = ref({
  name: '',
  description: '',
  keywords: '',
  docketNumber: '',
  status: 'open',
  caseType: '',
  team: [] as any[],
});
const cases = ref<any[]>([]);
const loadingCases = ref(true);
const casesError = ref('');
const showDescModal = ref(false);
const descModalText = ref('');
const updatingCaseId = ref('');
const updateCaseError = ref('');
const router = useRouter();
const route = useRoute();

const filter = ref('all');
const filteredCases = computed(() => {
  if (filter.value === 'all') return cases.value;
  return cases.value.filter((c: any) => c.status === filter.value);
});

// --- Closure Modal State ---
const showClosureModal = ref(false);
const closureCase = ref<any>(null);
const closureFiles = ref<File[]>([]);
const closureError = ref('');
const showClosureConfirm = ref(false);

// --- Invite Modal State ---
const showInviteModal = ref(false);
const inviteCase = ref<any>(null);
const inviteUserSearch = ref('');
const inviteUserResults = ref<any[]>([]);
const inviteError = ref('');
const inviteSuccess = ref(false);

function searchUsers() {
  const q = userSearch.value.trim().toLowerCase();
  if (!q) { userResults.value = []; return; }
  userResults.value = allUsers.value
    .filter((u) => u.role === 'investigator')  // Only show investigators
    .filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .filter((u) => !newCase.value.team.some((m) => m._id === u._id));
}
function addTeamMember(user: any) {
  newCase.value.team.push(user);
  userResults.value = [];
  userSearch.value = '';
}
function removeTeamMember(member: any) {
  newCase.value.team = newCase.value.team.filter((m) => m.id !== member.id);
}

async function submitCase() {
  creatingCase.value = true;
  createCaseError.value = '';
  try {
    const payload = {
      name: newCase.value.name,
      description: newCase.value.description,
      keywords: newCase.value.keywords,
      docketNumber: newCase.value.docketNumber,
      status: newCase.value.status,
      caseType: newCase.value.caseType,
      team: [...newCase.value.team],
    };
    console.log('Creating case with payload:', payload);
    const res = await axios.post('/api/cases', payload);
    console.log('Case created successfully:', res.data);
    // Add new case to list or refetch
    await fetchCases();
    // Reset form
    newCase.value.name = '';
    newCase.value.description = '';
    newCase.value.keywords = '';
    newCase.value.docketNumber = '';
    newCase.value.status = 'open';
    newCase.value.caseType = '';
    newCase.value.team = [];
    showCreateCase.value = false;
  } catch (err: any) {
    console.error('Error creating case:', err.response?.data || err.message);
    createCaseError.value = err?.response?.data?.error || 'Failed to create case';
  } finally {
    creatingCase.value = false;
  }
}

onMounted(async () => {
  await fetchCases();
  // Check if we should open create case modal
  if (route.query.createCase === 'true') {
    showCreateCase.value = true;
    fetchUsers();
  }
});

// Watch for route query changes (e.g., when Create Case button is clicked on same page)
watch(() => route.query.createCase, (val) => {
  if (val === 'true') {
    showCreateCase.value = true;
    if (allUsers.value.length === 0) {
      fetchUsers();
    }
  }
});

async function fetchCases() {
  loadingCases.value = true;
  casesError.value = '';
  try {
    const res = await axios.get('/api/cases');
    if (Array.isArray(res.data)) {
      cases.value = res.data;
    } else {
      cases.value = [];
      casesError.value = 'Unexpected response from server.';
    }
  } catch (err: any) {
    cases.value = [];
    casesError.value = err?.response?.data?.error || 'Failed to fetch cases';
  } finally {
    loadingCases.value = false;
  }
}

function viewDescription(caseItem: any) {
  descModalText.value = caseItem.description;
  showDescModal.value = true;
}

function handleClosureFiles(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  closureFiles.value = files ? Array.from(files) : [];
}

async function toggleStatus(caseItem: any) {
  if (caseItem.status === 'open') {
    // Initiate closure flow
    closureCase.value = caseItem;
    closureFiles.value = [];
    closureError.value = '';
    showClosureModal.value = true;
  } else {
    // Do not allow reopening closed cases
    return;
  }
}

async function submitClosureDocs() {
  if (!closureFiles.value.length) {
    closureError.value = 'Please upload at least one document.';
    return;
  }
  closureError.value = '';
  showClosureModal.value = false;
  showClosureConfirm.value = true;
}

async function confirmClosure() {
  if (!closureCase.value) return;
  updatingCaseId.value = closureCase.value._id;
  updateCaseError.value = '';
  try {
    // Get user info from sessionStorage
    const userStr = sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (!user) {
      updateCaseError.value = 'User information not found. Please login again.';
      updatingCaseId.value = '';
      return;
    }
    
    let userId = user.id;
    
    // If id is missing, try to extract from token
    if (!userId) {
      const tokenStr = sessionStorage.getItem('dess_token');
      if (tokenStr) {
        try {
          // Decode JWT token to get user ID
          const base64Url = tokenStr.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map((c: string) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const decoded = JSON.parse(jsonPayload);
          userId = decoded.id;
        } catch (e) {
          console.error('Failed to decode token', e);
        }
      }
    }
    
    if (!userId) {
      updateCaseError.value = 'User ID not found. Please login again.';
      updatingCaseId.value = '';
      return;
    }
    
    // Create form data with files
    const formData = new FormData();
    closureFiles.value.forEach(file => {
      formData.append('documents', file);
    });
    
    formData.append('userId', userId);
    formData.append('userName', user.name);
    formData.append('userEmail', user.email);

    // Upload documents and close case
    await axios.post(`/api/cases/${closureCase.value._id}/close`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    await fetchCases();
    showClosureConfirm.value = false;
    closureCase.value = null;
    closureFiles.value = [];
  } catch (err: any) {
    updateCaseError.value = err?.response?.data?.error || 'Failed to close case';
  } finally {
    updatingCaseId.value = '';
  }
}


function cancelClosure() {
  showClosureModal.value = false;
  showClosureConfirm.value = false;
  closureCase.value = null;
  closureFiles.value = [];
  closureError.value = '';
}

function viewCase(caseItem: any) {
  router.push(`/cases/${caseItem._id}/tracking`);
}

async function downloadCase(caseItem: any) {
  try {
    const response = await axios.get(`/api/cases/${caseItem._id}/download`, {
      responseType: 'blob'
    });
    
    // Get filename from Content-Disposition header or use fallback
    const contentDisposition = response.headers['content-disposition'];
    let filename = `${caseItem.caseId || caseItem.number}_${new Date().toISOString().split('T')[0]}.zip`;
    
    if (contentDisposition) {
      // Extract filename from Content-Disposition header
      // Handles both: filename=value and filename="value"
      const match = contentDisposition.match(/filename=(?:"([^"]*)"|([^;,\n]*))/);
      if (match && (match[1] || match[2])) {
        filename = match[1] || match[2];
      }
    }
    
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error('Failed to download case:', err);
    alert('Failed to download case details. Please try again.');
  }
}

watch(showCreateCase, (val) => {
  if (val) fetchUsers();
});
async function fetchUsers() {
  try {
    const res = await axios.get('/api/users');
    // Ensure allUsers.value is always an array
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

// --- Invite Modal Functions ---
function openInviteModal(caseItem: any) {
  inviteCase.value = caseItem;
  inviteUserSearch.value = '';
  inviteUserResults.value = [];
  inviteError.value = '';
  inviteSuccess.value = false;
  showInviteModal.value = true;
  fetchUsers(); // Fetch users before opening modal
}

function closeInviteModal() {
  showInviteModal.value = false;
  inviteCase.value = null;
  inviteUserSearch.value = '';
  inviteUserResults.value = [];
  inviteError.value = '';
  inviteSuccess.value = false;
}

function searchInviteUsers() {
  const q = inviteUserSearch.value.trim().toLowerCase();
  if (!q) { 
    inviteUserResults.value = []; 
    return; 
  }
  inviteUserResults.value = allUsers.value
    .filter((u) => u.role === 'investigator')  // Only show investigators
    .filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .filter((u) => !inviteCase.value.team.some((m: any) => m._id === u._id));  // Exclude already added members
}

async function inviteTeamMember(user: any) {
  inviteError.value = '';
  inviteSuccess.value = false;
  
  if (!inviteCase.value) return;
  
  try {
    await axios.post(`/api/cases/${inviteCase.value._id}/add-member`, {
      userId: user._id,
      userName: user.name,
      userEmail: user.email
    });
    
    // Add user to local case team array
    inviteCase.value.team.push(user);
    inviteUserSearch.value = '';
    inviteUserResults.value = [];
    inviteSuccess.value = true;
    
    // Refresh cases list
    await fetchCases();
    
    setTimeout(() => {
      inviteSuccess.value = false;
    }, 3000);
  } catch (err: any) {
    inviteError.value = err?.response?.data?.error || 'Failed to add team member';
  }
}


</script>
<style scoped>
.btn-filter {
  background: #f3f4f6;
  color: #2563eb;
  font-weight: 500;
  border: none;
  border-radius: 2em;
  padding: 0.5em 1.5em;
  margin-right: 0.2em;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 4px 0 rgba(31,125,83,0.06);
  cursor: pointer;
}
.btn-filter.active, .btn-filter:hover {
  background: #e0e7ff;
  color: #1d4ed8;
  box-shadow: 0 2px 8px 0 rgba(31,125,83,0.13);
}
.fade-in-row {
  animation: fadeInRow 0.5s;
}
@keyframes fadeInRow {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.archives-header {
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 12px 0 rgba(31,125,83,0.08);
}
.archives-icon {
  font-size: 2.2rem;
  color: #2563eb;
  background: #e0e7ff;
  border-radius: 0.7em;
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.archives-filters {
  background: #f8fafc;
  border-radius: 1.2rem;
  box-shadow: 0 1px 6px 0 rgba(31,125,83,0.04);
}
.archives-bg {
  background: linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%);
  min-height: 100vh;
  border-radius: 1.5rem;
  box-shadow: 0 2px 24px 0 rgba(31,125,83,0.06);
  padding-bottom: 3rem !important;
}
.archives-table-wrapper {
  border-radius: 1.2rem;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(31,125,83,0.08);
  overflow: hidden;
}
.archives-table {
  border-radius: 1rem;
  overflow: hidden;
  background: #fff;
}
.archives-table thead th {
  background: #e0e7ff;
  color: #374151;
  font-weight: 600;
  border: none;
  padding-top: 1rem;
  padding-bottom: 1rem;
  letter-spacing: 0.02em;
  font-size: 1.08rem;
}
.archives-table tbody tr {
  transition: background 0.15s;
  border-bottom: 1px solid #f3f4f6;
}
.archives-table tbody tr:nth-child(even) {
  background: #f6f8fa;
}
.archives-table tbody tr:hover {
  background: #f8fafc;
}
.status-badge {
  font-size: 1rem;
  padding: 0.5em 1em;
  border-radius: 1em;
  letter-spacing: 0.03em;
  box-shadow: 0 1px 4px 0 rgba(31,125,83,0.07);
  border: 1px solid #e5e7eb;
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
.status-toggle {
  width: 2.2em;
  height: 1.2em;
  border-radius: 1em;
  background: rgb(127, 235, 226);
  border: none;
  transition: background 0.2s;
  box-shadow: 0 1px 4px 0 rgba(31,125,83,0.07);
  outline: none;
  cursor: pointer;
}
.desc-btn {
  color: #2563eb;
  font-weight: 500;
  text-decoration: underline;
  padding: 0;
}
.desc-btn:hover {
  color: #1d4ed8;
  text-decoration: underline;
}
.details-btn {
  border-radius: 1em;
  font-weight: 500;
  padding: 0.3em 1.1em;
  box-shadow: 0 1px 4px 0 rgba(31,125,83,0.07);
}
.modal-content {
  border-radius: 1.1em;
}
.btn-outline-primary {
  font-weight: 500;
  border-radius: 0.7em;
  padding: 0.5em 1.3em;
  border-width: 2px;
}
.btn-outline-primary:hover {
  background: #e0e7ff;
  color: #1d4ed8;
  border-color: #2563eb;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .archives-header {
    flex-direction: column !important;
    align-items: flex-start !important;
    padding: 1rem !important;
  }

  .archives-header .d-flex {
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
  }

  .archives-header h2 {
    font-size: 1.35rem;
    margin-bottom: 0.5rem;
  }

  .archives-header .btn {
    font-size: 0.85rem;
    padding: 0.45rem 0.7rem;
    width: auto;
  }

  .table {
    font-size: 0.8rem;
  }

  .table th,
  .table td {
    padding: 0.6rem 0.4rem;
    vertical-align: middle;
  }

  .table thead th {
    font-size: 0.8rem;
    padding: 0.6rem 0.4rem;
    white-space: nowrap;
  }

  .table-responsive {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 0.375rem;
  }

  .btn-outline-primary,
  .btn-outline-secondary {
    font-size: 0.75rem;
    padding: 0.35rem 0.5rem;
  }

  .btn-sm {
    padding: 0.25rem 0.45rem;
    font-size: 0.7rem;
  }

  .d-flex.gap-2 {
    flex-direction: row;
    gap: 0.2rem !important;
    flex-wrap: wrap;
  }

  .d-flex.gap-2 .btn {
    flex: 1;
    min-width: 65px;
    font-size: 0.68rem;
  }

  .badge {
    font-size: 0.75rem;
    padding: 0.3em 0.5em;
    margin-bottom: 0.25rem;
  }

  .status-badge {
    font-size: 0.85rem;
    padding: 0.35em 0.7em;
  }

  .modal-dialog {
    margin: 0.5rem;
    max-width: 95vw;
  }

  .form-control,
  .form-select,
  textarea {
    font-size: 15px;
  }

  .row.g-3 {
    row-gap: 0.6rem;
  }

  .col-md-4,
  .col-md-8,
  .col-12 {
    flex: 0 0 100%;
  }

  .archives-icon {
    width: 45px;
    height: 45px;
    font-size: 1.4rem;
  }

  .form-check.form-switch {
    flex-direction: row;
    align-items: center;
  }

  .form-check-input {
    width: 1.8em !important;
    height: 1.1em !important;
    margin-top: 0;
    margin-right: 0.5rem;
  }

  .form-label {
    font-size: 0.9rem;
    margin-bottom: 0.35rem;
  }
}

@media (max-width: 480px) {
  .archives-bg {
    padding: 0.5rem 0 !important;
  }

  .archives-header {
    padding: 0.75rem !important;
    flex-direction: column;
  }

  .archives-header h2 {
    font-size: 1.1rem;
  }

  .archives-header .btn {
    font-size: 0.75rem;
    padding: 0.35rem 0.5rem;
    width: 100%;
  }

  .card {
    border-radius: 0.375rem;
  }

  .card-body {
    padding: 0.75rem !important;
  }

  .table {
    font-size: 0.7rem;
    margin-bottom: 0;
  }

  .table th,
  .table td {
    padding: 0.4rem 0.25rem;
    word-break: break-word;
  }

  .table thead th {
    font-size: 0.7rem;
  }

  .btn-sm {
    padding: 0.15rem 0.3rem;
    font-size: 0.65rem;
  }

  .btn-outline-primary,
  .btn-outline-secondary {
    font-size: 0.65rem;
    padding: 0.25rem 0.4rem;
  }

  .d-flex.gap-2 {
    gap: 0.15rem !important;
    flex-wrap: wrap;
  }

  .d-flex.gap-2 .btn {
    flex: 1;
    min-width: 55px;
    font-size: 0.6rem;
  }

  .badge {
    font-size: 0.65rem;
    display: inline-block;
    padding: 0.25em 0.4em;
    margin: 0.15rem 0.15rem 0.15rem 0;
  }

  .form-label {
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
  }

  .desc-btn {
    word-break: break-word;
    font-size: 0.65rem;
  }

  .text-muted.small,
  .ms-auto.text-muted.small {
    font-size: 0.65rem;
  }

  h5 {
    font-size: 0.9rem;
  }

  .modal-header {
    padding: 0.75rem;
  }

  .modal-body {
    padding: 0.75rem;
  }

  .archives-icon {
    width: 35px;
    height: 35px;
    font-size: 1.2rem;
  }
}
</style>
