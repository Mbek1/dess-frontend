<template>
  <div class="user-management">
    <!-- Header with Create User Button -->
    <div class="management-header">
      <h3>User Management</h3>
      <button class="btn btn-primary" @click="showCreateForm = !showCreateForm">
        <i class="bi bi-person-plus-fill"></i> Create User
      </button>
    </div>

    <!-- Create User Form -->
    <div v-if="showCreateForm" class="form-card">
      <h4>Add New User</h4>
      <form @submit.prevent="createUser">
        <div class="form-grid">
          <div>
            <label>Name</label>
            <input v-model="newUser.name" type="text" class="form-control" required />
          </div>
          <div>
            <label>Email</label>
            <input v-model="newUser.email" type="email" class="form-control" required />
          </div>
          <div>
            <label>Role</label>
            <select v-model="newUser.role" class="form-control" required>
              <option value="">Select Role</option>
              <option value="investigator">Investigator</option>
              <option value="prosecutor">Prosecutor</option>
              <option value="auditor">Auditor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label>Password</label>
            <input v-model="newUser.password" type="password" class="form-control" required />
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-success">Create User</button>
          <button type="button" class="btn btn-outline-secondary" @click="showCreateForm = false">Cancel</button>
        </div>
      </form>
    </div>

    <!-- Role Permission Matrix -->
    <div class="matrix-card">
      <h4>Role Permission Matrix</h4>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th><i class="bi bi-cloud-upload"></i> Upload</th>
              <th><i class="bi bi-cloud-download"></i> Download</th>
              <th><i class="bi bi-trash"></i> Delete</th>
              <th><i class="bi bi-eye"></i> View Logs</th>
              <th><i class="bi bi-folder-check"></i> Assign Case</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in roles" :key="role.name">
              <td class="role-name">{{ role.name }}</td>
              <td v-for="perm in permissionKeys" :key="perm">
                <i v-if="role.permissions[perm]" class="bi bi-check-circle-fill allowed"></i>
                <i v-else class="bi bi-x-circle-fill denied"></i>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Users List -->
    <div class="users-list-card">
      <h4>Active Users</h4>
      <div class="users-filters">
        <input v-model="searchUser" type="text" placeholder="Search users..." class="form-control" />
        <select v-model="filterRole" class="form-control">
          <option value="">All Roles</option>
          <option value="investigator">Investigator</option>
          <option value="prosecutor">Prosecutor</option>
          <option value="auditor">Auditor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div class="users-table">
        <div class="user-row header">
          <div class="user-name">Name</div>
          <div class="user-email">Email</div>
          <div class="user-role">Role</div>
          <div class="user-status">Status</div>
          <div class="user-mfa">MFA</div>
          <div class="user-actions">Actions</div>
        </div>

        <div v-for="user in filteredUsers" :key="user._id" class="user-row">
          <div class="user-name">{{ user.name }}</div>
          <div class="user-email">{{ user.email }}</div>
          <div class="user-role">
            <span class="badge" :class="`badge-${user.role}`">{{ user.role }}</span>
          </div>
          <div class="user-status">
            <span v-if="user.active" class="status-badge active">Active</span>
            <span v-else class="status-badge inactive">Inactive</span>
          </div>
          <div class="user-mfa">
            <input type="checkbox" :checked="user.mfaEnabled" @change="toggleMFA(user._id, $event)" />
          </div>
          <div class="user-actions">
            <button class="action-btn" @click="editUser(user)" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="action-btn danger" @click="toggleUserStatus(user._id)" :title="user.active ? 'Deactivate' : 'Activate'">
              <i :class="user.active ? 'bi bi-lock-fill' : 'bi bi-unlock-fill'"></i>
            </button>
            <button class="action-btn warning" @click="forcePasswordReset(user._id)" title="Reset Password">
              <i class="bi bi-key-fill"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const showCreateForm = ref(false);
const searchUser = ref('');
const filterRole = ref('');
const users = ref<any[]>([]);
const newUser = ref({
  name: '',
  email: '',
  role: '',
  password: ''
});

const permissionKeys = ['upload', 'download', 'delete', 'viewLogs', 'assignCase'] as const;

const roles = [
  {
    name: 'Investigator',
    permissions: { upload: true, download: true, delete: false, viewLogs: false, assignCase: false }
  },
  {
    name: 'Prosecutor',
    permissions: { upload: false, download: true, delete: false, viewLogs: true, assignCase: true }
  },
  {
    name: 'Auditor',
    permissions: { upload: false, download: false, delete: false, viewLogs: true, assignCase: false }
  },
  {
    name: 'Admin',
    permissions: { upload: false, download: false, delete: false, viewLogs: true, assignCase: false }
  }
];

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchUser.value.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchUser.value.toLowerCase());
    const matchesRole = !filterRole.value || u.role === filterRole.value;
    return matchesSearch && matchesRole;
  });
});

function getToken() {
  return sessionStorage.getItem('dess_token') || '';
}

async function createUser() {
  try {
    const token = getToken();
    await axios.post('/api/admin/users', newUser.value, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    showCreateForm.value = false;
    newUser.value = { name: '', email: '', role: '', password: '' };
    loadUsers();
  } catch (err) {
    console.error('Error creating user:', err);
  }
}

async function toggleUserStatus(userId: string) {
  try {
    const token = getToken();
    await axios.patch(`/api/admin/users/${userId}/toggle-status`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    loadUsers();
  } catch (err) {
    console.error('Error toggling user status:', err);
  }
}

async function forcePasswordReset(userId: string) {
  try {
    const token = getToken();
    await axios.post(`/api/admin/users/${userId}/reset-password`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    alert('Password reset initiated. User will receive reset link.');
  } catch (err) {
    console.error('Error resetting password:', err);
  }
}

async function toggleMFA(userId: string, event: any) {
  try {
    const token = getToken();
    await axios.patch(`/api/admin/users/${userId}/mfa`, 
      { enabled: event.target.checked },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
  } catch (err) {
    console.error('Error toggling MFA:', err);
  }
}

function editUser(user: any) {
  console.log('Edit user:', user);
}

async function loadUsers() {
  try {
    const token = getToken();
    const response = await axios.get('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    users.value = response.data || [];
  } catch (err) {
    console.error('Error loading users:', err);
  }
}

onMounted(() => {
  loadUsers();
});

loadUsers();
</script>

<style scoped>
.user-management {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.management-header h3 {
  margin: 0;
  color: #c9d1d9;
}

.form-card,
.matrix-card,
.users-list-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 1.5rem;
}

.form-card h4,
.matrix-card h4,
.users-list-card h4 {
  margin: 0 0 1rem 0;
  color: #c9d1d9;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-grid div {
  display: flex;
  flex-direction: column;
}

.form-grid label {
  font-size: 0.9rem;
  color: #8b949e;
  margin-bottom: 0.5rem;
}

.form-control {
  background: #0d1117;
  border: 1px solid #30363d;
  color: #c9d1d9;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}

.form-control:focus {
  background: #0d1117;
  border-color: #58a6ff;
  color: #c9d1d9;
  outline: none;
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #0d47a1;
  color: #fff;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-success {
  background: #2e8555;
  color: #fff;
}

.btn-success:hover {
  background: #3da365;
}

.btn-outline-secondary {
  background: transparent;
  border: 1px solid #30363d;
  color: #8b949e;
}

.btn-outline-secondary:hover {
  background: #161b22;
  border-color: #58a6ff;
  color: #58a6ff;
}

.table-responsive {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

table thead {
  background: #0d1117;
  border-bottom: 2px solid #30363d;
}

table th {
  padding: 1rem;
  text-align: left;
  color: #8b949e;
  font-weight: 600;
  font-size: 0.9rem;
}

table td {
  padding: 1rem;
  border-bottom: 1px solid #30363d;
  color: #c9d1d9;
}

.role-name {
  font-weight: 500;
}

table i.allowed {
  color: #a5d6a7;
}

table i.denied {
  color: #da3633;
}

.users-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.users-filters .form-control {
  flex: 1;
}

.users-table {
  display: flex;
  flex-direction: column;
}

.user-row {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr 1fr 2fr;
  gap: 1rem;
  padding: 1rem;
  align-items: center;
  border-bottom: 1px solid #30363d;
}

.user-row.header {
  background: #0d1117;
  font-weight: 600;
  color: #8b949e;
  border-bottom: 2px solid #30363d;
}

.user-name {
  color: #c9d1d9;
  font-weight: 500;
}

.user-email {
  color: #8b949e;
  font-size: 0.9rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.badge-investigator {
  background: rgba(88, 166, 255, 0.2);
  color: #58a6ff;
}

.badge-prosecutor {
  background: rgba(165, 214, 167, 0.2);
  color: #a5d6a7;
}

.badge-auditor {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.badge-admin {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.active {
  background: rgba(165, 214, 167, 0.2);
  color: #a5d6a7;
}

.status-badge.inactive {
  background: rgba(218, 54, 51, 0.2);
  color: #da3633;
}

.user-actions {
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

.action-btn.danger:hover {
  background: #da3633;
  color: #fff;
}

.action-btn.warning:hover {
  background: #ffc107;
  color: #000;
}
</style>
