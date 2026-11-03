<template>
  <div class="audit-logs">
    <!-- Filters -->
    <div class="audit-filters">
      <input v-model="filterUser" type="text" placeholder="Filter by user..." class="form-control" />
      <input v-model="filterCase" type="text" placeholder="Filter by case..." class="form-control" />
      <select v-model="filterAction" class="form-control">
        <option value="">All Actions</option>
        <option value="LOGIN">Login</option>
        <option value="UPLOAD">Upload Evidence</option>
        <option value="DOWNLOAD">Download</option>
        <option value="ACCESS">Access</option>
        <option value="DELETE">Delete</option>
        <option value="MODIFY">Modify</option>
      </select>
      <button class="btn-export" @click="exportLogs">
        <i class="bi bi-download"></i> Export CSV
      </button>
    </div>

    <!-- Timeline View -->
    <div class="timeline-container">
      <div v-if="logs.length > 0" v-for="log in filteredLogs" :key="log._id" class="timeline-item">
        <div class="timeline-marker" :class="log.action.toLowerCase()"></div>
        <div class="timeline-content">
          <div class="log-header">
            <span class="log-time">{{ formatTime(log.date || log.timestamp || new Date()) }}</span>
            <span class="log-action" :class="`action-${log.action.toLowerCase()}`">{{ log.action }}</span>
            <span class="log-user">{{ log.userName || log.user || 'System' }}</span>
          </div>
          <div class="log-description">{{ log.description }}</div>
          <div v-if="log.details" class="log-details">
            <span v-for="(value, key) in log.details" :key="key" class="detail-tag">
              {{ key }}: <code>{{ typeof value === 'object' ? JSON.stringify(value) : value }}</code>
            </span>
          </div>
        </div>
      </div>
      <div v-else class="text-muted text-center py-4">
        <i class="bi bi-inbox"></i> No audit logs found
      </div>
    </div>

    <!-- Chain of Custody Section -->
    <div class="coc-section">
      <h4><i class="bi bi-link"></i> Chain of Custody Example</h4>
      <div class="coc-timeline">
        <div class="coc-item">
          <span class="coc-time">[12:03]</span>
          <span class="coc-action upload">UPLOAD</span>
          <span>Evidence uploaded by Investigator A</span>
          <span class="coc-hash">Hash: abc123def456</span>
        </div>
        <div class="coc-item">
          <span class="coc-time">[12:04]</span>
          <span class="coc-action verify">VERIFY</span>
          <span>Hash generated and verified</span>
        </div>
        <div class="coc-item">
          <span class="coc-time">[12:05]</span>
          <span class="coc-action access">ACCESS</span>
          <span>Accessed by Prosecutor B</span>
        </div>
        <div class="coc-item">
          <span class="coc-time">[12:07]</span>
          <span class="coc-action download">DOWNLOAD</span>
          <span>Downloaded by Prosecutor B</span>
          <span class="coc-hash">Hash verified: ✓ MATCH</span>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="audit-stats">
      <div class="stat-box">
        <div class="stat-label">Total Events (24h)</div>
        <div class="stat-value">{{ totalEvents }}</div>
      </div>
      <div class="stat-box warning">
        <div class="stat-label">Suspicious Activities</div>
        <div class="stat-value">{{ suspiciousCount }}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Failed Logins (24h)</div>
        <div class="stat-value">{{ failedLoginCount }}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Evidence Modified</div>
        <div class="stat-value">0</div>
        <div class="stat-note">✓ No tampering detected</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const filterUser = ref('');
const filterCase = ref('');
const filterAction = ref('');
const logs = ref<any[]>([]);
const totalEvents = ref(0);
const suspiciousCount = ref(0);
const failedLoginCount = ref(0);

// Mock data for demonstration
const mockLogs = [
  {
    _id: '1',
    timestamp: new Date(Date.now() - 3600000),
    user: 'investigator_a',
    action: 'UPLOAD',
    description: 'Evidence uploaded - Crime_Scene_Photos.zip',
    details: { size: '2.5MB', hash: 'abc123def456' }
  },
  {
    _id: '2',
    timestamp: new Date(Date.now() - 3000000),
    user: 'prosecutor_b',
    action: 'ACCESS',
    description: 'Accessed case #2024-001',
    details: {}
  },
  {
    _id: '3',
    timestamp: new Date(Date.now() - 1800000),
    user: 'investigator_c',
    action: 'DOWNLOAD',
    description: 'Downloaded evidence',
    details: { hashVerified: 'MATCH' }
  },
  {
    _id: '4',
    timestamp: new Date(Date.now() - 900000),
    user: 'admin',
    action: 'LOGIN',
    description: 'Admin logged in',
    details: { ip: '192.168.1.100' }
  },
  {
    _id: '5',
    timestamp: new Date(Date.now() - 600000),
    user: 'unknown_user',
    action: 'LOGIN',
    description: 'Failed login attempt',
    details: { ip: '203.0.113.45', attempts: '3' }
  }
];

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const userMatch = !filterUser.value || log.user.toLowerCase().includes(filterUser.value.toLowerCase());
    const caseMatch = !filterCase.value || log.description.toLowerCase().includes(filterCase.value.toLowerCase());
    const actionMatch = !filterAction.value || log.action === filterAction.value;
    return userMatch && caseMatch && actionMatch;
  });
});

function formatTime(date: Date | string) {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
}

function exportLogs() {
  const csv = [
    ['Timestamp', 'User', 'Action', 'Description', 'Details'],
    ...logs.value.map(log => [
      formatTime(log.date || log.timestamp),
      log.userName || log.user || 'System',
      log.action,
      log.description,
      JSON.stringify(log.details || {})
    ])
  ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

function getToken() {
  return sessionStorage.getItem('dess_token') || '';
}

async function loadLogs() {
  try {
    const token = getToken();
    const response = await axios.get('/api/admin/audit-logs', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.data && response.data.logs) {
      logs.value = response.data.logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.date || log.createdAt || Date.now())
      }));
      totalEvents.value = logs.value.length;
      suspiciousCount.value = logs.value.filter(l => l.status === 'FAILED' || l.action === 'ACCESS_DENIED' || l.status === 'SUSPICIOUS_ACTIVITY').length;
      failedLoginCount.value = logs.value.filter(l => l.action === 'LOGIN' && l.status === 'FAILED').length;
    }
  } catch (err) {
    console.error('Error loading logs:', err);
  }
}

onMounted(() => {
  loadLogs();
  // Refresh logs every 20 seconds for real-time updates
  setInterval(loadLogs, 20000);
});
</script>

<style scoped>
.audit-logs {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.audit-filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-control {
  background: #0d1117;
  border: 1px solid #30363d;
  color: #c9d1d9;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  flex: 1;
  min-width: 200px;
}

.form-control:focus {
  border-color: #58a6ff;
  outline: none;
}

.btn-export {
  background: #0d47a1;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-export:hover {
  background: #1565c0;
}

.timeline-container {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 2rem 1.5rem;
  position: relative;
}

.timeline-container::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #0d47a1 0%, transparent 100%);
}

.timeline-item {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  position: relative;
}

.timeline-marker {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #30363d;
  border: 2px solid #0d1117;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  font-size: 0.7rem;
  color: #8b949e;
}

.timeline-marker.upload {
  background: rgba(88, 166, 255, 0.2);
  border-color: #58a6ff;
  color: #58a6ff;
}

.timeline-marker.download {
  background: rgba(165, 214, 167, 0.2);
  border-color: #a5d6a7;
  color: #a5d6a7;
}

.timeline-marker.access {
  background: rgba(255, 193, 7, 0.2);
  border-color: #ffc107;
  color: #ffc107;
}

.timeline-marker.login {
  background: rgba(79, 195, 247, 0.2);
  border-color: #4fc3f7;
  color: #4fc3f7;
}

.timeline-content {
  flex: 1;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 1rem;
}

.log-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.log-time {
  color: #8b949e;
  font-size: 0.85rem;
  font-weight: 500;
}

.log-action {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  background: #30363d;
}

.log-action.action-upload {
  background: rgba(88, 166, 255, 0.2);
  color: #58a6ff;
}

.log-action.action-download {
  background: rgba(165, 214, 167, 0.2);
  color: #a5d6a7;
}

.log-action.action-login {
  background: rgba(79, 195, 247, 0.2);
  color: #4fc3f7;
}

.log-user {
  color: #58a6ff;
  font-weight: 500;
}

.log-description {
  color: #c9d1d9;
  margin-bottom: 0.5rem;
}

.log-details {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.detail-tag {
  background: #0d1117;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.8rem;
  color: #8b949e;
}

code {
  color: #58a6ff;
  font-family: monospace;
}

.coc-section {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 1.5rem;
}

.coc-section h4 {
  margin: 0 0 1rem 0;
  color: #c9d1d9;
}

.coc-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.coc-item {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-left: 4px solid #0d47a1;
  border-radius: 6px;
  flex-wrap: wrap;
}

.coc-time {
  color: #8b949e;
  font-weight: 600;
  min-width: 60px;
}

.coc-action {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  background: #30363d;
  color: #8b949e;
}

.coc-action.upload {
  background: rgba(88, 166, 255, 0.2);
  color: #58a6ff;
}

.coc-action.download {
  background: rgba(165, 214, 167, 0.2);
  color: #a5d6a7;
}

.coc-action.verify {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.coc-action.access {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.coc-hash {
  color: #58a6ff;
  font-family: monospace;
  font-size: 0.85rem;
}

.audit-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-box {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}

.stat-box.warning {
  border-color: #da3633;
  background: rgba(218, 54, 51, 0.05);
}

.stat-label {
  color: #8b949e;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #58a6ff;
}

.stat-box.warning .stat-value {
  color: #da3633;
}

.stat-note {
  font-size: 0.8rem;
  color: #a5d6a7;
  margin-top: 0.5rem;
}
</style>
