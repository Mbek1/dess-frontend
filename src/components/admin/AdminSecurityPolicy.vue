<template>
  <div class="security-policy">
    <div class="policy-grid">
      <!-- Password Policy -->
      <div class="policy-card">
        <div class="policy-header">
          <h4><i class="bi bi-key-fill"></i> Password Policy</h4>
          <button class="edit-btn" @click="editPolicy('password')">
            <i class="bi bi-pencil"></i>
          </button>
        </div>
        <div class="policy-content">
          <div class="policy-item">
            <span class="label">Minimum Length</span>
            <span class="value">{{ policies.password.minLength }} characters</span>
          </div>
          <div class="policy-item">
            <span class="label">Require Uppercase</span>
            <i :class="policies.password.requireUppercase ? 'bi bi-check-lg' : 'bi bi-x-lg'"></i>
          </div>
          <div class="policy-item">
            <span class="label">Require Numbers</span>
            <i :class="policies.password.requireNumbers ? 'bi bi-check-lg' : 'bi bi-x-lg'"></i>
          </div>
          <div class="policy-item">
            <span class="label">Require Special Chars</span>
            <i :class="policies.password.requireSpecialChars ? 'bi bi-check-lg' : 'bi bi-x-lg'"></i>
          </div>
          <div class="policy-item">
            <span class="label">Expiry Days</span>
            <span class="value">{{ policies.password.expiryDays }} days</span>
          </div>
        </div>
      </div>

      <!-- Session Policy -->
      <div class="policy-card">
        <div class="policy-header">
          <h4><i class="bi bi-clock-history"></i> Session Policy</h4>
          <button class="edit-btn" @click="editPolicy('session')">
            <i class="bi bi-pencil"></i>
          </button>
        </div>
        <div class="policy-content">
          <div class="policy-item">
            <span class="label">Session Timeout</span>
            <span class="value">{{ policies.session.timeoutMinutes }} minutes</span>
          </div>
          <div class="policy-item">
            <span class="label">Idle Timeout</span>
            <span class="value">{{ policies.session.idleTimeoutMinutes }} minutes</span>
          </div>
          <div class="policy-item">
            <span class="label">Max Active Sessions</span>
            <span class="value">{{ policies.session.maxActiveSessions }}</span>
          </div>
          <div class="policy-item">
            <span class="label">Auto Lock After Failed Attempts</span>
            <span class="value">{{ policies.session.lockoutThreshold }} attempts</span>
          </div>
          <div class="policy-item">
            <span class="label">Lockout Duration</span>
            <span class="value">{{ policies.session.lockoutDurationMinutes }} minutes</span>
          </div>
        </div>
      </div>

      <!-- MFA Policy -->
      <div class="policy-card">
        <div class="policy-header">
          <h4><i class="bi bi-shield-check"></i> MFA & Security</h4>
          <button class="edit-btn" @click="editPolicy('mfa')">
            <i class="bi bi-pencil"></i>
          </button>
        </div>
        <div class="policy-content">
          <div class="policy-item">
            <span class="label">Enforce MFA for Admins</span>
            <input type="checkbox" v-model="policies.mfa.enforceMFAAdmins" />
          </div>
          <div class="policy-item">
            <span class="label">Enforce MFA for Investigators</span>
            <input type="checkbox" v-model="policies.mfa.enforceMFAInvestigators" />
          </div>
          <div class="policy-item">
            <span class="label">Enable IP Whitelisting</span>
            <input type="checkbox" v-model="policies.mfa.enableIPWhitelist" />
          </div>
          <div class="policy-item">
            <span class="label">Require TLS/SSL</span>
            <i class="bi bi-check-lg checked"></i>
          </div>
        </div>
      </div>

      <!-- Evidence & Retention -->
      <div class="policy-card">
        <div class="policy-header">
          <h4><i class="bi bi-archive-fill"></i> Evidence Retention</h4>
          <button class="edit-btn" @click="editPolicy('retention')">
            <i class="bi bi-pencil"></i>
          </button>
        </div>
        <div class="policy-content">
          <div class="policy-item">
            <span class="label">Default Retention Period</span>
            <span class="value">{{ policies.retention.defaultRetentionYears }} years</span>
          </div>
          <div class="policy-item">
            <span class="label">Archive After Closure</span>
            <span class="value">{{ policies.retention.archiveAfterClosureDays }} days</span>
          </div>
          <div class="policy-item">
            <span class="label">Purge Old Evidence</span>
            <i :class="policies.retention.enableAutoPurge ? 'bi bi-check-lg' : 'bi bi-x-lg'"></i>
          </div>
          <div class="policy-item">
            <span class="label">Keep Audit Logs</span>
            <span class="value">{{ policies.retention.auditLogRetentionYears }} years</span>
          </div>
        </div>
      </div>

      <!-- Compliance & Standards -->
      <div class="policy-card">
        <div class="policy-header">
          <h4><i class="bi bi-check2-all"></i> Compliance</h4>
        </div>
        <div class="policy-content compliance">
          <div class="compliance-item">
            <span>NIST SP 800-53 (US)</span>
            <i class="bi bi-check-circle-fill"></i>
          </div>
          <div class="compliance-item">
            <span>CJIS Security Policy (FBI)</span>
            <i class="bi bi-check-circle-fill"></i>
          </div>
          <div class="compliance-item">
            <span>ISO 27001</span>
            <i class="bi bi-check-circle-fill"></i>
          </div>
          <div class="compliance-item">
            <span>Digital Signature Act</span>
            <i class="bi bi-check-circle-fill"></i>
          </div>
        </div>
      </div>

      <!-- Audit Policy -->
      <div class="policy-card">
        <div class="policy-header">
          <h4><i class="bi bi-file-text"></i> Audit Settings</h4>
          <button class="edit-btn" @click="editPolicy('audit')">
            <i class="bi bi-pencil"></i>
          </button>
        </div>
        <div class="policy-content">
          <div class="policy-item">
            <span class="label">Log Access Events</span>
            <input type="checkbox" v-model="policies.audit.logAccessEvents" checked />
          </div>
          <div class="policy-item">
            <span class="label">Log Modifications</span>
            <input type="checkbox" v-model="policies.audit.logModifications" checked />
          </div>
          <div class="policy-item">
            <span class="label">Log Authentication</span>
            <input type="checkbox" v-model="policies.audit.logAuthentication" checked />
          </div>
          <div class="policy-item">
            <span class="label">Alert on Suspicious Activity</span>
            <input type="checkbox" v-model="policies.audit.alertSuspiciousActivity" checked />
          </div>
        </div>
      </div>
    </div>

    <!-- Save Changes -->
    <div class="save-section">
      <button class="btn btn-primary" @click="savePolicies">
        <i class="bi bi-check-lg"></i> Save All Changes
      </button>
      <span v-if="saved" class="save-message">✓ Policies updated successfully</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { API_CONFIG } from '@/config';

const saved = ref(false);
const policies = ref({
  password: {
    minLength: 12,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expiryDays: 90
  },
  session: {
    timeoutMinutes: 60,
    idleTimeoutMinutes: 30,
    maxActiveSessions: 3,
    lockoutThreshold: 5,
    lockoutDurationMinutes: 15
  },
  mfa: {
    enforceMFAAdmins: true,
    enforceMFAInvestigators: true,
    enableIPWhitelist: false
  },
  retention: {
    defaultRetentionYears: 7,
    archiveAfterClosureDays: 30,
    enableAutoPurge: false,
    auditLogRetentionYears: 10
  },
  audit: {
    logAccessEvents: true,
    logModifications: true,
    logAuthentication: true,
    alertSuspiciousActivity: true
  }
});

function editPolicy(policyType: string) {
  // TODO: Implement inline editor or modal
  console.log('Edit policy:', policyType);
}

async function savePolicies() {
  try {
    const res = await fetch(`${API_CONFIG.baseURL}/api/admin/policies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('dess_token')}`
      },
      body: JSON.stringify(policies.value)
    });
    if (res.ok) {
      saved.value = true;
      setTimeout(() => { saved.value = false; }, 3000);
    }
  } catch (err) {
    console.error('Error saving policies:', err);
  }
}
</script>

<style scoped>
.security-policy {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.policy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.policy-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  overflow: hidden;
}

.policy-header {
  background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.policy-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.policy-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.policy-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  font-size: 0.9rem;
}

.label {
  color: #8b949e;
  font-weight: 500;
}

.value {
  color: #58a6ff;
  font-weight: 600;
}

.policy-item i {
  font-size: 1.2rem;
  color: #a5d6a7;
}

.policy-item i.checked {
  color: #a5d6a7;
}

.policy-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #58a6ff;
}

.compliance {
  gap: 0.5rem;
}

.compliance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(165, 214, 167, 0.1);
  border: 1px solid rgba(165, 214, 167, 0.3);
  border-radius: 6px;
  color: #a5d6a7;
}

.compliance-item i {
  font-size: 1.3rem;
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

.btn {
  padding: 0.5rem 1.5rem;
  background: #0d47a1;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:hover {
  background: #1565c0;
}

.save-message {
  color: #a5d6a7;
  font-weight: 500;
}
</style>
