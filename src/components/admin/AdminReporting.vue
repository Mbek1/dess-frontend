<template>
  <div class="reporting">
    <div class="reports-grid">
      <div class="report-card" @click="generateReport('evidence')">
        <i class="bi bi-archive-fill"></i>
        <h4>Evidence Activity Report</h4>
        <p>Track all uploads, downloads, and access</p>
        <span class="last-generated">Last: 2 days ago</span>
      </div>

      <div class="report-card" @click="generateReport('user')">
        <i class="bi bi-people-fill"></i>
        <h4>User Activity Report</h4>
        <p>Login history and access patterns</p>
        <span class="last-generated">Last: 5 days ago</span>
      </div>

      <div class="report-card" @click="generateReport('case')">
        <i class="bi bi-folder-fill"></i>
        <h4>Case Status Report</h4>
        <p>Overview of open, closed, archived cases</p>
        <span class="last-generated">Last: 1 week ago</span>
      </div>

      <div class="report-card" @click="generateReport('storage')">
        <i class="bi bi-hdd-fill"></i>
        <h4>Storage Utilization Report</h4>
        <p>Disk usage by case and type</p>
        <span class="last-generated">Last: 10 days ago</span>
      </div>

      <div class="report-card" @click="generateReport('security')">
        <i class="bi bi-shield-lock"></i>
        <h4>Security Incident Report</h4>
        <p>Failed logins, unauthorized access, alerts</p>
        <span class="last-generated">Last: Yesterday</span>
      </div>

      <div class="report-card" @click="generateReport('compliance')">
        <i class="bi bi-check2-all"></i>
        <h4>Compliance Report</h4>
        <p>NIST, CJIS, ISO 27001 compliance status</p>
        <span class="last-generated">Last: 3 days ago</span>
      </div>
    </div>

    <!-- Report Generator -->
    <div class="report-generator">
      <h3>Custom Report Builder</h3>
      <div class="generator-form">
        <div class="form-group">
          <label>Report Type</label>
          <select v-model="customReport.type" class="form-control">
            <option value="">Select Type</option>
            <option value="evidence">Evidence</option>
            <option value="user">User</option>
            <option value="case">Case</option>
          </select>
        </div>

        <div class="form-group">
          <label>Date Range</label>
          <div class="date-inputs">
            <input v-model="customReport.startDate" type="date" class="form-control" />
            <span>to</span>
            <input v-model="customReport.endDate" type="date" class="form-control" />
          </div>
        </div>

        <div class="form-group">
          <label>Format</label>
          <select v-model="customReport.format" class="form-control">
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
          </select>
        </div>

        <button class="btn btn-primary" @click="generateCustomReport">
          <i class="bi bi-download"></i> Generate Report
        </button>
      </div>
    </div>

    <!-- Recent Reports -->
    <div class="recent-reports">
      <h3>Recent Reports</h3>
      <div class="reports-table">
        <div class="report-row header">
          <div>Report Type</div>
          <div>Generated</div>
          <div>Format</div>
          <div>Status</div>
          <div>Action</div>
        </div>
        <div v-for="report in recentReports" :key="report.id" class="report-row">
          <div class="report-name">{{ report.name }}</div>
          <div>{{ formatDate(report.created) }}</div>
          <div class="format-badge">{{ report.format.toUpperCase() }}</div>
          <div>
            <span class="status-badge" :class="report.status">{{ report.status }}</span>
          </div>
          <div class="report-actions">
            <button class="action-btn" title="Download">
              <i class="bi bi-download"></i>
            </button>
            <button class="action-btn" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { API_CONFIG } from '@/config';

const customReport = ref({
  type: '',
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  format: 'pdf'
});

const recentReports = [
  {
    id: 1,
    name: 'Evidence Activity Report',
    created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    format: 'pdf',
    status: 'completed'
  },
  {
    id: 2,
    name: 'Security Incident Report',
    created: new Date(Date.now() - 24 * 60 * 60 * 1000),
    format: 'pdf',
    status: 'completed'
  },
  {
    id: 3,
    name: 'User Activity Report',
    created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    format: 'csv',
    status: 'completed'
  },
  {
    id: 4,
    name: 'Storage Utilization Report',
    created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    format: 'excel',
    status: 'completed'
  },
  {
    id: 5,
    name: 'Compliance Report',
    created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    format: 'pdf',
    status: 'completed'
  }
];

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString();
}

async function generateReport(type: string) {
  try {
    const res = await fetch(`${API_CONFIG.baseURL}/api/admin/reports/${type}`, {
      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('dess_token')}` }
    });
    if (res.ok) {
      const blob = await res.blob();
      downloadFile(blob, `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`);
    }
  } catch (err) {
    console.error('Error generating report:', err);
  }
}

async function generateCustomReport() {
  if (!customReport.value.type) {
    alert('Please select a report type');
    return;
  }

  try {
    const res = await fetch(`${API_CONFIG.baseURL}/api/admin/reports/custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('dess_token')}`
      },
      body: JSON.stringify(customReport.value)
    });
    if (res.ok) {
      const blob = await res.blob();
      downloadFile(blob, `report-${new Date().toISOString().split('T')[0]}.${customReport.value.format}`);
    }
  } catch (err) {
    console.error('Error generating custom report:', err);
  }
}

function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
</script>

<style scoped>
.reporting {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.report-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.report-card:hover {
  border-color: #58a6ff;
  background: #0d1117;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(88, 166, 255, 0.15);
}

.report-card i {
  font-size: 2rem;
  color: #58a6ff;
}

.report-card h4 {
  margin: 0;
  color: #c9d1d9;
}

.report-card p {
  margin: 0;
  color: #8b949e;
  font-size: 0.9rem;
}

.last-generated {
  font-size: 0.8rem;
  color: #6e7681;
  margin-top: auto;
}

.report-generator {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 1.5rem;
}

.report-generator h3 {
  margin: 0 0 1rem 0;
  color: #c9d1d9;
}

.generator-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: flex-end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #8b949e;
  font-size: 0.9rem;
  font-weight: 600;
}

.form-control {
  background: #0d1117;
  border: 1px solid #30363d;
  color: #c9d1d9;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}

.form-control:focus {
  border-color: #58a6ff;
  outline: none;
}

.date-inputs {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.date-inputs .form-control {
  flex: 1;
}

.date-inputs span {
  color: #8b949e;
}

.btn {
  padding: 0.5rem 1rem;
  background: #0d47a1;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #1565c0;
}

.recent-reports {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 1.5rem;
}

.recent-reports h3 {
  margin: 0 0 1rem 0;
  color: #c9d1d9;
}

.reports-table {
  display: flex;
  flex-direction: column;
}

.report-row {
  display: grid;
  grid-template-columns: 2fr 1fr 0.8fr 1fr 0.8fr;
  gap: 1rem;
  padding: 1rem;
  align-items: center;
  border-bottom: 1px solid #30363d;
}

.report-row.header {
  background: #0d1117;
  font-weight: 600;
  color: #8b949e;
  border-bottom: 2px solid #30363d;
  margin-bottom: 0.5rem;
}

.report-name {
  color: #c9d1d9;
}

.format-badge {
  background: rgba(88, 166, 255, 0.2);
  color: #58a6ff;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #30363d;
  color: #8b949e;
}

.status-badge.completed {
  background: rgba(165, 214, 167, 0.2);
  color: #a5d6a7;
}

.report-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
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

.action-btn:hover {
  background: #58a6ff;
  color: #000;
}
</style>
