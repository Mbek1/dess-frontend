<template>
  <div class="case-oversight">
    <div class="search-filter">
      <input v-model="searchCase" type="text" placeholder="Search cases..." class="form-control" />
      <select v-model="filterStatus" class="form-control">
        <option value="">All Statuses</option>
        <option value="open">Open</option>
        <option value="closed">Closed</option>
        <option value="archived">Archived</option>
      </select>
    </div>

    <div class="cases-overview">
      <div class="case-stat">
        <div class="stat-value">{{ caseStats.total }}</div>
        <div class="stat-label">Total Cases</div>
      </div>
      <div class="case-stat">
        <div class="stat-value">{{ caseStats.open }}</div>
        <div class="stat-label">Open Cases</div>
      </div>
      <div class="case-stat">
        <div class="stat-value">{{ caseStats.closed }}</div>
        <div class="stat-label">Closed Cases</div>
      </div>
      <div class="case-stat">
        <div class="stat-value">{{ caseStats.totalEvidence }}</div>
        <div class="stat-label">Evidence Items</div>
      </div>
    </div>

    <div class="cases-table-wrapper">
      <table class="cases-table">
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Name</th>
            <th>Status</th>
            <th>Evidence Count</th>
            <th>Assigned To</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="caseItem in filteredCases" :key="caseItem._id">
            <td class="case-id">{{ caseItem.caseId }}</td>
            <td>{{ caseItem.name }}</td>
            <td>
              <span class="status-badge" :class="caseItem.status">
                {{ caseItem.status.toUpperCase() }}
              </span>
            </td>
            <td>{{ caseItem.evidenceCount || 0 }}</td>
            <td>{{ caseItem.assignedTo || 'N/A' }}</td>
            <td>{{ formatDate(caseItem.createdAt) }}</td>
            <td>
              <button class="view-btn" @click="viewCaseDetails(caseItem._id)" title="View Details">
                <i class="bi bi-eye"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Case Details Modal -->
    <div v-if="selectedCase" class="case-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Case Details - {{ selectedCase.name }}</h3>
          <button class="close-btn" @click="selectedCase = null">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Case ID</label>
              <span>{{ selectedCase.caseId }}</span>
            </div>
            <div class="detail-item">
              <label>Status</label>
              <span class="status-badge" :class="selectedCase.status">
                {{ selectedCase.status.toUpperCase() }}
              </span>
            </div>
            <div class="detail-item">
              <label>Created</label>
              <span>{{ formatDate(selectedCase.createdAt) }}</span>
            </div>
            <div class="detail-item">
              <label>Last Modified</label>
              <span>{{ formatDate(selectedCase.updatedAt) }}</span>
            </div>
          </div>

          <div class="evidence-section">
            <h4>Evidence Items (Read-Only)</h4>
            <div class="evidence-list">
              <div v-for="evidence in selectedCase.evidence" :key="evidence._id" class="evidence-item">
                <div class="evidence-header">
                  <span class="evidence-name">{{ evidence.name }}</span>
                  <span class="evidence-type">{{ evidence.type }}</span>
                </div>
                <div class="evidence-details">
                  <span>Hash: <code>{{ truncateHash(evidence.hash) }}</code></span>
                  <span>Size: {{ formatSize(evidence.size) }}</span>
                  <span>Uploaded: {{ formatDate(evidence.uploadedAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="admin-note">
            <i class="bi bi-info-circle"></i>
            <span>Admin cannot modify or delete evidence. All changes are logged in the audit trail.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const searchCase = ref('');
const filterStatus = ref('');
const cases = ref<any[]>([]);
const selectedCase = ref<any>(null);
const caseStats = ref({
  total: 0,
  open: 0,
  closed: 0,
  totalEvidence: 0
});

const filteredCases = computed(() => {
  return cases.value.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchCase.value.toLowerCase()) ||
                          c.caseId.toLowerCase().includes(searchCase.value.toLowerCase());
    const matchesStatus = !filterStatus.value || c.status === filterStatus.value;
    return matchesSearch && matchesStatus;
  });
});

function getToken() {
  return sessionStorage.getItem('dess_token') || '';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

function formatSize(bytes: number) {
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function truncateHash(hash: string) {
  return hash.substring(0, 16) + '...';
}

async function loadCases() {
  try {
    const token = getToken();
    const response = await axios.get('/api/admin/cases-oversight', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.data) {
      cases.value = response.data.cases || [];
      caseStats.value = response.data.stats || { total: 0, open: 0, closed: 0, totalEvidence: 0 };
    }
  } catch (err) {
    console.error('Error loading cases:', err);
  }
}

async function viewCaseDetails(caseId: string) {
  try {
    const token = getToken();
    const response = await axios.get(`/api/admin/cases/${caseId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    selectedCase.value = response.data;
  } catch (err) {
    console.error('Error loading case details:', err);
  }
}

onMounted(loadCases);
</script>

<style scoped>
.case-oversight {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.search-filter {
  display: flex;
  gap: 1rem;
}

.form-control {
  background: #0d1117;
  border: 1px solid #30363d;
  color: #c9d1d9;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  flex: 1;
}

.form-control:focus {
  border-color: #58a6ff;
  outline: none;
}

.cases-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.case-stat {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #58a6ff;
}

.stat-label {
  font-size: 0.85rem;
  color: #8b949e;
  margin-top: 0.5rem;
}

.cases-table-wrapper {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  overflow-x: auto;
}

.cases-table {
  width: 100%;
  border-collapse: collapse;
}

.cases-table thead {
  background: #0d1117;
  border-bottom: 2px solid #30363d;
}

.cases-table th {
  padding: 1rem;
  text-align: left;
  color: #8b949e;
  font-weight: 600;
  font-size: 0.9rem;
}

.cases-table td {
  padding: 1rem;
  border-bottom: 1px solid #30363d;
  color: #c9d1d9;
}

.case-id {
  font-family: monospace;
  color: #58a6ff;
  font-weight: 500;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.open {
  background: rgba(88, 166, 255, 0.2);
  color: #58a6ff;
}

.status-badge.closed {
  background: rgba(165, 214, 167, 0.2);
  color: #a5d6a7;
}

.status-badge.archived {
  background: rgba(189, 189, 189, 0.2);
  color: #bdbdbd;
}

.view-btn {
  background: #30363d;
  border: none;
  color: #8b949e;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: #58a6ff;
  color: #000;
}

.case-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #30363d;
  background: #0d1117;
}

.modal-header h3 {
  margin: 0;
  color: #c9d1d9;
}

.close-btn {
  background: transparent;
  border: none;
  color: #8b949e;
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item label {
  font-size: 0.85rem;
  color: #8b949e;
  font-weight: 600;
}

.detail-item span {
  color: #c9d1d9;
}

.evidence-section h4 {
  margin: 1rem 0 0.75rem 0;
  color: #c9d1d9;
}

.evidence-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.evidence-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 0.75rem;
}

.evidence-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.evidence-name {
  color: #c9d1d9;
  font-weight: 500;
}

.evidence-type {
  background: rgba(88, 166, 255, 0.2);
  color: #58a6ff;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
}

.evidence-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #8b949e;
}

code {
  background: #0d1117;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
  color: #58a6ff;
}

.admin-note {
  background: rgba(218, 54, 51, 0.1);
  border-left: 4px solid #da3633;
  padding: 1rem;
  border-radius: 6px;
  color: #da3633;
  display: flex;
  gap: 0.75rem;
}
</style>
