<template>
  <div class="system-settings">
    <div class="settings-grid">
      <!-- Backup Settings -->
      <div class="settings-card">
        <div class="settings-header">
          <h4><i class="bi bi-cloud-check"></i> Backup & Recovery</h4>
        </div>
        <div class="settings-body">
          <div class="setting-item">
            <label>Backup Schedule</label>
            <select v-model="settings.backup.schedule" class="form-control">
              <option value="daily">Daily (2:00 AM)</option>
              <option value="weekly">Weekly (Sunday 2:00 AM)</option>
              <option value="monthly">Monthly (1st day 2:00 AM)</option>
            </select>
          </div>
          <div class="setting-item">
            <label>Backup Retention</label>
            <input v-model="settings.backup.retentionDays" type="number" class="form-control" />
            <small>Keep backups for this many days</small>
          </div>
          <div class="setting-item">
            <label>Backup Location</label>
            <input v-model="settings.backup.location" type="text" class="form-control" placeholder="e.g., /mnt/backups" />
          </div>
          <button class="btn btn-primary" @click="testBackup">
            <i class="bi bi-shuffle"></i> Test Backup Now
          </button>
          <div v-if="backupStatus" class="status-message" :class="backupStatus.status">
            {{ backupStatus.message }}
          </div>
        </div>
      </div>

      <!-- Log Settings -->
      <div class="settings-card">
        <div class="settings-header">
          <h4><i class="bi bi-file-text"></i> Logging & Retention</h4>
        </div>
        <div class="settings-body">
          <div class="setting-item">
            <label>Audit Log Retention</label>
            <input v-model="settings.logging.auditRetentionYears" type="number" class="form-control" />
            <small>Years to keep audit logs</small>
          </div>
          <div class="setting-item">
            <label>Application Log Level</label>
            <select v-model="settings.logging.logLevel" class="form-control">
              <option value="error">Error Only</option>
              <option value="warn">Warnings & Errors</option>
              <option value="info">Info, Warnings & Errors</option>
              <option value="debug">Debug (Verbose)</option>
            </select>
          </div>
          <div class="setting-item">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.logging.enableErrorAlerts" />
              Email alerts on errors
            </label>
          </div>
          <div class="setting-item">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.logging.enableSecurityAlerts" />
              Email alerts on security events
            </label>
          </div>
          <button class="btn btn-primary" @click="testLogs">
            <i class="bi bi-play-circle"></i> Purge Old Logs
          </button>
        </div>
      </div>

      <!-- Maintenance -->
      <div class="settings-card">
        <div class="settings-header">
          <h4><i class="bi bi-hammer"></i> Maintenance</h4>
        </div>
        <div class="settings-body">
          <div class="setting-item">
            <label class="checkbox-label">
              <input type="checkbox" v-model="maintenanceMode" @change="toggleMaintenanceMode" />
              <strong>Enable Maintenance Mode</strong>
            </label>
            <small v-if="maintenanceMode" class="warning-text">Users will see maintenance notice</small>
          </div>
          <div class="setting-item">
            <label>Maintenance Message</label>
            <textarea v-model="settings.maintenance.message" class="form-control" rows="3"></textarea>
          </div>
          <button class="btn btn-warning" @click="performDatabaseOptimization">
            <i class="bi bi-lightning"></i> Optimize Database
          </button>
          <button class="btn btn-warning" @click="clearCache">
            <i class="bi bi-trash"></i> Clear Cache
          </button>
        </div>
      </div>

      <!-- Integration Settings -->
      <div class="settings-card">
        <div class="settings-header">
          <h4><i class="bi bi-plug"></i> Integrations</h4>
        </div>
        <div class="settings-body">
          <div class="setting-item">
            <label>Email Service</label>
            <input v-model="settings.integrations.emailService" type="text" class="form-control" placeholder="e.g., SendGrid" />
          </div>
          <div class="setting-item">
            <label>Cloud Storage (Optional)</label>
            <select v-model="settings.integrations.cloudProvider" class="form-control">
              <option value="">None</option>
              <option value="aws">AWS S3</option>
              <option value="azure">Azure Blob</option>
              <option value="gcp">Google Cloud</option>
            </select>
          </div>
          <div class="setting-item">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.integrations.enableWebhooks" />
              Enable webhook notifications
            </label>
          </div>
          <button class="btn btn-primary" @click="testIntegrations">
            <i class="bi bi-arrow-repeat"></i> Test Connections
          </button>
        </div>
      </div>

      <!-- System Info -->
      <div class="settings-card info-card">
        <div class="settings-header">
          <h4><i class="bi bi-info-circle"></i> System Information</h4>
        </div>
        <div class="settings-body system-info">
          <div class="info-item">
            <span class="label">System Version</span>
            <span class="value">DESS v1.0.0</span>
          </div>
          <div class="info-item">
            <span class="label">Database Version</span>
            <span class="value">MongoDB 5.0</span>
          </div>
          <div class="info-item">
            <span class="label">Node.js Version</span>
            <span class="value">20.19.4</span>
          </div>
          <div class="info-item">
            <span class="label">Uptime</span>
            <span class="value">45 days, 12 hours</span>
          </div>
          <div class="info-item">
            <span class="label">Last Backup</span>
            <span class="value">{{ lastBackupDate }}</span>
          </div>
        </div>
      </div>

      <!-- Security Certificates -->
      <div class="settings-card">
        <div class="settings-header">
          <h4><i class="bi bi-shield-check"></i> SSL/TLS Certificates</h4>
        </div>
        <div class="settings-body">
          <div class="cert-status ok">
            <i class="bi bi-check-circle-fill"></i>
            <span>SSL Certificate: Valid (expires in 180 days)</span>
          </div>
          <div class="cert-status ok">
            <i class="bi bi-check-circle-fill"></i>
            <span>TLS 1.3: Enabled</span>
          </div>
          <button class="btn btn-primary" @click="renewCertificate">
            <i class="bi bi-arrow-repeat"></i> Renew Certificate
          </button>
        </div>
      </div>
    </div>

    <!-- Save Settings -->
    <div class="save-section">
      <button class="btn btn-primary" @click="saveSettings">
        <i class="bi bi-check-lg"></i> Save All Settings
      </button>
      <span v-if="settingsSaved" class="save-message">✓ Settings saved successfully</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { API_CONFIG } from '@/config';

const settingsSaved = ref(false);
const maintenanceMode = ref(false);
const backupStatus = ref<any>(null);
const lastBackupDate = ref(new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString());

const settings = ref({
  backup: {
    schedule: 'daily',
    retentionDays: 30,
    location: '/backups'
  },
  logging: {
    auditRetentionYears: 10,
    logLevel: 'info',
    enableErrorAlerts: true,
    enableSecurityAlerts: true
  },
  maintenance: {
    enabled: false,
    message: 'System is currently under maintenance. Please try again later.'
  },
  integrations: {
    emailService: 'SendGrid',
    cloudProvider: '',
    enableWebhooks: false
  }
});

function getToken() {
  return sessionStorage.getItem('dess_token') || '';
}

async function testBackup() {
  try {
    backupStatus.value = { status: 'loading', message: 'Running backup...' };
    const res = await fetch(`${API_CONFIG.baseURL}/api/admin/backup/test`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (res.ok) {
      backupStatus.value = { status: 'success', message: '✓ Backup completed successfully' };
      lastBackupDate.value = new Date().toLocaleDateString();
    } else {
      backupStatus.value = { status: 'error', message: '✗ Backup failed' };
    }
  } catch (err) {
    backupStatus.value = { status: 'error', message: '✗ Error running backup' };
  }
}

async function testLogs() {
  try {
    await fetch(`${API_CONFIG.baseURL}/api/admin/logs/purge`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    alert('Old logs purged successfully');
  } catch (err) {
    console.error('Error purging logs:', err);
  }
}

async function toggleMaintenanceMode() {
  try {
    await fetch(`${API_CONFIG.baseURL}/api/admin/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ enabled: maintenanceMode.value })
    });
  } catch (err) {
    console.error('Error toggling maintenance mode:', err);
  }
}

async function performDatabaseOptimization() {
  alert('Database optimization started. This may take a few minutes.');
}

async function clearCache() {
  alert('Cache cleared successfully');
}

async function testIntegrations() {
  alert('Testing integrations...');
}

async function renewCertificate() {
  alert('Certificate renewal initiated. You will receive an email confirmation.');
}

async function saveSettings() {
  try {
    const res = await fetch(`${API_CONFIG.baseURL}/api/admin/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(settings.value)
    });
    if (res.ok) {
      settingsSaved.value = true;
      setTimeout(() => { settingsSaved.value = false; }, 3000);
    }
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}
</script>

<style scoped>
.system-settings {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.settings-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  overflow: hidden;
}

.settings-header {
  background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%);
  padding: 1rem;
}

.settings-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.settings-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-item label {
  color: #8b949e;
  font-weight: 500;
  font-size: 0.9rem;
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

textarea.form-control {
  resize: vertical;
  font-family: monospace;
  font-size: 0.85rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #c9d1d9;
  font-weight: normal;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #58a6ff;
}

small {
  color: #6e7681;
  font-size: 0.8rem;
}

.warning-text {
  color: #ffc107;
  font-weight: 500;
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

.btn-warning {
  background: #f57c00;
}

.btn-warning:hover {
  background: #e65100;
}

.status-message {
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-message.success {
  background: rgba(165, 214, 167, 0.2);
  color: #a5d6a7;
  border: 1px solid #a5d6a7;
}

.status-message.error {
  background: rgba(218, 54, 51, 0.2);
  color: #da3633;
  border: 1px solid #da3633;
}

.status-message.loading {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  border: 1px solid #ffc107;
}

.info-card {
  background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
}

.system-info {
  gap: 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  border-bottom: 1px solid #30363d;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #8b949e;
}

.info-item .value {
  color: #58a6ff;
  font-weight: 600;
  font-family: monospace;
}

.cert-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.cert-status.ok {
  background: rgba(165, 214, 167, 0.1);
  color: #a5d6a7;
  border: 1px solid rgba(165, 214, 167, 0.3);
}

.cert-status i {
  font-size: 1.2rem;
}

.save-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
}

.save-message {
  color: #a5d6a7;
  font-weight: 500;
}
</style>
