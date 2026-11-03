<template>
  <main class="admin-app">
    <div v-if="!isAdmin" class="access-denied">
      <section class="access-card">
        <span class="access-icon"><i class="bi bi-shield-lock-fill" aria-hidden="true"></i></span>
        <p class="admin-eyebrow">DESS / ADMINISTRATION</p>
        <h1>Administrator access required</h1>
        <p>This workspace is restricted to authorized administrators.</p>
        <button class="primary-control" type="button" @click="router.push('/')">Return to DESS</button>
      </section>
    </div>

    <template v-else>
      <button v-if="sidebarOpen" class="sidebar-backdrop" type="button" aria-label="Close navigation" @click="sidebarOpen = false"></button>
      <aside class="admin-sidebar" :class="{ 'sidebar-open': sidebarOpen }">
        <div class="admin-brand">
          <span class="brand-symbol"><i class="bi bi-shield-lock-fill" aria-hidden="true"></i></span>
          <span><strong>DESS</strong><small>CONTROL ROOM</small></span>
          <button class="sidebar-close" type="button" aria-label="Close navigation" @click="sidebarOpen = false"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
        </div>

        <div class="admin-scope"><span class="scope-dot"></span><span>Administrator workspace</span></div>
        <nav class="admin-navigation" aria-label="Administration modules">
          <p class="nav-section-label">OPERATIONS</p>
          <button v-for="item in navItems.slice(0, 4)" :key="item.id" type="button" class="admin-nav-item" :class="{ active: currentModule === item.id }" :aria-current="currentModule === item.id ? 'page' : undefined" @click="selectModule(item.id)">
            <i :class="`bi bi-${item.icon}`" aria-hidden="true"></i><span>{{ item.label }}</span><i v-if="currentModule === item.id" class="bi bi-chevron-right active-chevron" aria-hidden="true"></i>
          </button>
          <p class="nav-section-label records-label">RECORDS &amp; CONFIGURATION</p>
          <button v-for="item in navItems.slice(4)" :key="item.id" type="button" class="admin-nav-item" :class="{ active: currentModule === item.id }" :aria-current="currentModule === item.id ? 'page' : undefined" @click="selectModule(item.id)">
            <i :class="`bi bi-${item.icon}`" aria-hidden="true"></i><span>{{ item.label }}</span><i v-if="currentModule === item.id" class="bi bi-chevron-right active-chevron" aria-hidden="true"></i>
          </button>
        </nav>

        <footer class="sidebar-footer">
          <div class="admin-identity"><span class="admin-avatar">{{ initials(currentUser?.name) }}</span><span><strong>{{ currentUser?.name || 'Administrator' }}</strong><small>System administrator</small></span></div>
          <button class="logout-control" type="button" title="Sign out" aria-label="Sign out" @click="logout"><i class="bi bi-box-arrow-right" aria-hidden="true"></i></button>
        </footer>
      </aside>

      <section class="admin-main">
        <header class="admin-topbar">
          <button class="mobile-menu" type="button" aria-label="Open navigation" @click="sidebarOpen = true"><i class="bi bi-list" aria-hidden="true"></i></button>
          <div class="breadcrumb-title"><span>Administration</span><i class="bi bi-chevron-right" aria-hidden="true"></i><strong>{{ getModuleTitle() }}</strong></div>
          <div class="topbar-meta"><span class="secure-indicator"><i class="bi bi-shield-check" aria-hidden="true"></i> Privileged session</span><time>{{ currentTime }}</time></div>
        </header>

        <div class="admin-content">
          <header class="module-heading">
            <div><p class="admin-eyebrow">SYSTEM OPERATIONS</p><h1>{{ getModuleTitle() }}</h1><p>{{ getModuleDescription() }}</p></div>
          </header>

          <AdminDashboardOverview v-show="currentModule === 'dashboard'" :stats="dashboardStats" @open-audit="selectModule('audit')" />
          <AdminUserManagement v-show="currentModule === 'users'" />
          <AdminSecurityPolicy v-show="currentModule === 'security'" />
          <AdminCaseOversight v-show="currentModule === 'cases'" />
          <AdminAuditLogs v-show="currentModule === 'audit'" />
          <AdminReporting v-show="currentModule === 'reporting'" />
          <AdminSystemSettings v-show="currentModule === 'settings'" />
        </div>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import AdminDashboardOverview from '@/components/admin/AdminDashboardOverview.vue';
import AdminUserManagement from '@/components/admin/AdminUserManagement.vue';
import AdminSecurityPolicy from '@/components/admin/AdminSecurityPolicy.vue';
import AdminCaseOversight from '@/components/admin/AdminCaseOversight.vue';
import AdminAuditLogs from '@/components/admin/AdminAuditLogs.vue';
import AdminReporting from '@/components/admin/AdminReporting.vue';
import AdminSystemSettings from '@/components/admin/AdminSystemSettings.vue';

const router = useRouter();
const currentModule = ref('dashboard');
const currentUser = ref<any>(null);
const currentTime = ref('');
const isAdmin = ref(false);
const sidebarOpen = ref(false);
const dashboardStats = ref({ totalUsers: 0, totalCases: 0, totalEvidence: 0, failedLogins: 0, pendingDeletionVotes: 0 });
let clockTimer: ReturnType<typeof setInterval> | undefined;

const navItems = [
  { id: 'dashboard', label: 'Overview', icon: 'grid-1x2-fill' },
  { id: 'users', label: 'User management', icon: 'people-fill' },
  { id: 'security', label: 'Security & policy', icon: 'shield-lock' },
  { id: 'cases', label: 'Case oversight', icon: 'folder2-open' },
  { id: 'audit', label: 'Audit records', icon: 'journal-text' },
  { id: 'reporting', label: 'Reports', icon: 'file-earmark-bar-graph' },
  { id: 'settings', label: 'System settings', icon: 'sliders' }
];

const moduleDescriptions: Record<string, string> = {
  dashboard: 'Current system counts and recent administrative activity.',
  users: 'Review user accounts, roles, and access status.',
  security: 'Manage security controls and system policy.',
  cases: 'Review case records and evidence access.',
  audit: 'Search recorded administrative and system events.',
  reporting: 'Generate operational and compliance reports.',
  settings: 'Configure system-wide settings.'
};

function getModuleTitle() { return navItems.find(item => item.id === currentModule.value)?.label || 'Overview'; }
function getModuleDescription() { return moduleDescriptions[currentModule.value] || ''; }
function initials(name?: string) { return (name || 'Admin').split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase(); }
function selectModule(moduleId: string) { currentModule.value = moduleId; sidebarOpen.value = false; }

async function loadDashboardStats() {
  try {
    const token = sessionStorage.getItem('dess_token');
    const response = await axios.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
    dashboardStats.value = response.data;
  } catch (error) {
    console.error('Error loading admin dashboard metrics:', error);
  }
}

function logout() {
  sessionStorage.clear();
  router.push('/');
}

onMounted(() => {
  try {
    currentUser.value = JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch {
    currentUser.value = null;
  }
  isAdmin.value = currentUser.value?.role === 'admin' || sessionStorage.getItem('dess_user_role') === 'admin';
  if (!isAdmin.value) {
    window.setTimeout(() => router.push('/'), 2000);
    return;
  }
  void loadDashboardStats();
  const updateClock = () => { currentTime.value = new Date().toLocaleString(); };
  updateClock();
  clockTimer = setInterval(updateClock, 60000);
});

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer);
});
</script>

<style scoped>
.admin-app {
  --admin-bg: #04152d;
  --admin-panel: #071d39;
  --admin-line: #143b60;
  --admin-text: #e7f2ff;
  --admin-muted: #91acc9;
  display: flex;
  min-height: 100vh;
  color: var(--admin-text);
  background-color: var(--admin-bg);
  background-image: linear-gradient(rgba(24, 93, 154, .06) 1px, transparent 1px), linear-gradient(90deg, rgba(24, 93, 154, .06) 1px, transparent 1px);
  background-size: 34px 34px;
}
.access-denied { display: grid; width: 100%; min-height: 100vh; place-items: center; padding: 18px; }
.access-card { width: min(440px, 100%); padding: 28px; border: 1px solid var(--admin-line); border-radius: 8px; text-align: center; background: #071d39; }
.access-icon { display: grid; width: 48px; height: 48px; place-items: center; margin: 0 auto 15px; border: 1px solid #1c5785; border-radius: 10px; color: #77c3ff; background: #0a3156; font-size: 21px; }
.admin-eyebrow { margin: 0 0 5px; color: #66b9ff; font-size: 9px; font-weight: 750; }
.access-card h1 { margin: 0; color: #eff7ff; font-size: 20px; }.access-card > p:not(.admin-eyebrow) { color: #9db9d8; font-size: 11px; }
.primary-control { min-height: 36px; padding: 8px 12px; border: 1px solid #168bff; border-radius: 6px; color: white; background: #0876e1; cursor: pointer; font-size: 10px; font-weight: 700; }
.admin-sidebar { position: fixed; z-index: 20; top: 0; bottom: 0; left: 0; display: flex; width: 238px; flex-direction: column; border-right: 1px solid var(--admin-line); background: rgba(5, 23, 45, .98); }
.admin-brand { display: flex; align-items: center; gap: 10px; padding: 17px 15px; border-bottom: 1px solid var(--admin-line); }
.brand-symbol { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid #1e6197; border-radius: 8px; color: #83cbff; background: #0a3156; font-size: 16px; }
.admin-brand > span:nth-child(2) { display: grid; gap: 2px; }.admin-brand strong { color: #eaf5ff; font-size: 13px; letter-spacing: .04em; }.admin-brand small { color: #7d9bb8; font-size: 8px; font-weight: 700; }
.sidebar-close { display: none; margin-left: auto; border: 0; color: #adc8e2; background: transparent; font-size: 14px; }
.admin-scope { display: flex; align-items: center; gap: 7px; margin: 12px 12px 5px; padding: 8px; border: 1px solid #183e60; border-radius: 5px; color: #9db9d8; background: rgba(8, 41, 73, .55); font-size: 8px; }
.scope-dot { width: 6px; height: 6px; border-radius: 50%; background: #41d5a5; }
.admin-navigation { display: grid; gap: 3px; padding: 8px 10px; overflow-y: auto; }
.nav-section-label { margin: 10px 7px 4px; color: #6585a4; font-size: 8px; font-weight: 750; letter-spacing: .08em; }
.records-label { margin-top: 20px; }
.admin-nav-item { display: flex; min-height: 37px; align-items: center; gap: 9px; padding: 8px 9px; border: 1px solid transparent; border-radius: 5px; color: #a4bad0; text-align: left; background: transparent; cursor: pointer; font-size: 10px; }
.admin-nav-item > i:first-child { width: 16px; color: #7e9ab4; font-size: 12px; }.admin-nav-item span { flex: 1; }
.admin-nav-item:hover { border-color: #1b436b; color: #e3f2ff; background: rgba(12, 48, 82, .55); }
.admin-nav-item.active { border-color: #1a5d91; color: #eaf5ff; background: linear-gradient(90deg, rgba(12, 90, 151, .45), rgba(8, 49, 86, .35)); }
.admin-nav-item.active > i:first-child { color: #67bfff; }.active-chevron { color: #5daeff; font-size: 9px; }
.sidebar-footer { display: flex; align-items: center; gap: 8px; margin-top: auto; padding: 11px; border-top: 1px solid var(--admin-line); }
.admin-identity { display: flex; min-width: 0; flex: 1; align-items: center; gap: 8px; }
.admin-avatar { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; border: 1px solid #24699e; border-radius: 50%; color: #bde2ff; background: #0b3b69; font-size: 9px; font-weight: 750; }
.admin-identity > span:last-child { display: grid; min-width: 0; gap: 3px; }.admin-identity strong { overflow: hidden; color: #dcecff; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }.admin-identity small { color: #809bb7; font-size: 8px; }
.logout-control { display: grid; width: 30px; height: 30px; place-items: center; border: 1px solid #4f3443; border-radius: 5px; color: #e6a1ac; background: transparent; cursor: pointer; }
.admin-main { display: flex; min-width: 0; min-height: 100vh; flex: 1; flex-direction: column; margin-left: 238px; }
.admin-topbar { position: sticky; z-index: 10; top: 0; display: flex; min-height: 52px; align-items: center; justify-content: space-between; gap: 15px; padding: 0 21px; border-bottom: 1px solid var(--admin-line); background: rgba(4, 21, 45, .93); backdrop-filter: blur(12px); }
.breadcrumb-title { display: flex; min-width: 0; align-items: center; gap: 8px; color: #7695b3; font-size: 9px; }.breadcrumb-title i { color: #4b6c8b; font-size: 8px; }.breadcrumb-title strong { overflow: hidden; color: #cfe2f5; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.topbar-meta { display: flex; align-items: center; gap: 13px; color: #879fb7; font-size: 8px; }.topbar-meta time { white-space: nowrap; }
.secure-indicator { display: inline-flex; align-items: center; gap: 5px; color: #80dbc1; }.secure-indicator i { font-size: 11px; }
.mobile-menu { display: none; width: 31px; height: 31px; place-items: center; border: 1px solid #254b70; border-radius: 5px; color: #b9d1e8; background: transparent; }
.admin-content { width: min(1500px, 100%); margin: 0 auto; padding: 23px clamp(14px, 2vw, 28px) 34px; }
.module-heading { display: flex; align-items: end; justify-content: space-between; gap: 14px; margin-bottom: 17px; }
.module-heading h1 { margin: 0; color: #edf6ff; font-size: 22px; font-weight: 740; }.module-heading p:last-child { margin: 5px 0 0; color: #93afca; font-size: 10px; }
.sidebar-backdrop { display: none; }
@media (max-width: 860px) {
  .admin-sidebar { width: 220px; }
  .admin-main { margin-left: 220px; }
  .topbar-meta .secure-indicator { display: none; }
}
@media (max-width: 680px) {
  .admin-sidebar { z-index: 30; width: 260px; transform: translateX(-100%); transition: transform .18s ease; }
  .admin-sidebar.sidebar-open { transform: translateX(0); }
  .sidebar-close { display: grid; width: 28px; height: 28px; place-items: center; }
  .sidebar-backdrop { position: fixed; z-index: 25; inset: 0; display: block; border: 0; background: rgba(0, 8, 20, .68); }
  .admin-main { margin-left: 0; }
  .admin-topbar { justify-content: flex-start; padding: 0 11px; }
  .mobile-menu { display: grid; flex: 0 0 31px; }
  .breadcrumb-title { flex: 1; }
  .topbar-meta time { max-width: 90px; overflow: hidden; text-overflow: ellipsis; }
  .admin-content { padding: 17px 11px 26px; }
  .module-heading h1 { font-size: 19px; }
}
</style>
