<template>
  <main class="admin-overview">
    <section class="metric-grid" aria-label="System metrics">
      <article class="metric-panel">
        <span class="metric-icon users-icon"><i class="bi bi-people-fill" aria-hidden="true"></i></span>
        <span class="metric-copy"><small>Registered users</small><strong>{{ stats.totalUsers }}</strong><span>All account roles</span></span>
      </article>
      <article class="metric-panel">
        <span class="metric-icon cases-icon"><i class="bi bi-folder2-open" aria-hidden="true"></i></span>
        <span class="metric-copy"><small>Case records</small><strong>{{ stats.totalCases }}</strong><span>Open and closed</span></span>
      </article>
      <article class="metric-panel">
        <span class="metric-icon evidence-icon"><i class="bi bi-file-earmark-lock2" aria-hidden="true"></i></span>
        <span class="metric-copy"><small>Active evidence</small><strong>{{ stats.totalEvidence }}</strong><span>Not marked deleted</span></span>
      </article>
      <article class="metric-panel" :class="{ 'metric-attention': stats.pendingDeletionVotes > 0 }">
        <span class="metric-icon votes-icon"><i class="bi bi-ui-checks" aria-hidden="true"></i></span>
        <span class="metric-copy"><small>Pending deletion votes</small><strong>{{ stats.pendingDeletionVotes }}</strong><span>Investigator team decisions</span></span>
      </article>
    </section>

    <section class="overview-columns">
      <section class="overview-panel audit-panel">
        <header class="panel-heading">
          <div><p class="panel-eyebrow">SYSTEM ACTIVITY</p><h2>Recent audit events</h2></div>
          <button type="button" class="quiet-action" @click="$emit('open-audit')"><i class="bi bi-arrow-up-right" aria-hidden="true"></i> Open audit log</button>
        </header>
        <div v-if="loading" class="panel-state"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Loading audit events</div>
        <div v-else-if="error" class="panel-state error-state" role="alert">{{ error }}</div>
        <div v-else-if="recentActions.length" class="audit-list">
          <article v-for="action in recentActions" :key="action._id" class="audit-row">
            <span class="audit-indicator" :class="actionTone(action.action)"></span>
            <div class="audit-copy"><strong>{{ action.description || action.action }}</strong><small>{{ action.userName || action.userId || 'System' }} · {{ action.action }}</small></div>
            <time>{{ formatTimeAgo(action.timestamp || action.date) }}</time>
          </article>
        </div>
        <div v-else class="panel-state">No audit events have been recorded yet.</div>
      </section>

      <aside class="overview-panel security-panel">
        <header class="panel-heading">
          <div><p class="panel-eyebrow">ACCESS MONITORING</p><h2>Security activity</h2></div>
          <span class="panel-icon"><i class="bi bi-shield-lock" aria-hidden="true"></i></span>
        </header>
        <div class="security-stat">
          <span class="security-stat-icon"><i class="bi bi-person-x" aria-hidden="true"></i></span>
          <span><small>Failed sign-ins, past 24 hours</small><strong>{{ stats.failedLogins }}</strong></span>
          <span class="stat-state" :class="stats.failedLogins ? 'state-warning' : 'state-neutral'">{{ stats.failedLogins ? 'Review' : 'No events' }}</span>
        </div>
        <div class="security-note"><i class="bi bi-info-circle" aria-hidden="true"></i><span>Metrics reflect database records. Session counts, storage usage, and integrity percentages are not reported unless measured by an active monitor.</span></div>
        <div class="control-list">
          <div><i class="bi bi-person-check-fill" aria-hidden="true"></i><span>Role-based API access</span><strong>Enabled</strong></div>
          <div><i class="bi bi-file-earmark-text-fill" aria-hidden="true"></i><span>Audit event history</span><strong>Enabled</strong></div>
          <div><i class="bi bi-people-fill" aria-hidden="true"></i><span>Case deletion decisions</span><strong>Team vote</strong></div>
        </div>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import axios from 'axios';

interface DashboardStats {
  totalUsers: number;
  totalCases: number;
  totalEvidence: number;
  failedLogins: number;
  pendingDeletionVotes: number;
}

const props = defineProps<{ stats: DashboardStats }>();
defineEmits<{ 'open-audit': [] }>();

const recentActions = ref<any[]>([]);
const loading = ref(false);
const error = ref('');
let refreshTimer: ReturnType<typeof setInterval> | undefined;

function getToken() { return sessionStorage.getItem('dess_token') || ''; }

function formatTimeAgo(value?: string | Date) {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

function actionTone(action: string) {
  if (action.includes('DELETE') || action.includes('FAILED') || action.includes('ACCESS_DENIED')) return 'tone-warning';
  if (action.includes('UPLOAD') || action.includes('CREATE')) return 'tone-success';
  return 'tone-info';
}

async function loadRecentActions() {
  loading.value = true;
  error.value = '';
  try {
    const response = await axios.get('/api/admin/audit-logs?limit=8', {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    recentActions.value = response.data.logs || [];
  } catch (requestError: any) {
    error.value = requestError?.response?.data?.error || 'Could not load recent audit events.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadRecentActions();
  refreshTimer = setInterval(() => { void loadRecentActions(); }, 60000);
});

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});
</script>

<style scoped>
.admin-overview { display: grid; gap: 14px; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.metric-panel,.overview-panel { border: 1px solid #163d62; border-radius: 7px; color: #e7f2ff; background: linear-gradient(145deg, #082241, #06192f); }
.metric-panel { display: flex; min-width: 0; align-items: center; gap: 11px; padding: 14px; }
.metric-attention { border-color: rgba(255, 190, 80, .5); }
.metric-icon,.panel-icon,.security-stat-icon { display: grid; width: 36px; height: 36px; flex: 0 0 36px; place-items: center; border: 1px solid #1c5687; border-radius: 8px; color: #80c9ff; background: #0b3156; font-size: 15px; }
.users-icon { color: #75c4ff; }.cases-icon { color: #8bdac8; }.evidence-icon { color: #f3cb7c; }.votes-icon { color: #ffd48a; }
.metric-copy { display: grid; min-width: 0; gap: 3px; }
.metric-copy small,.metric-copy span { overflow: hidden; color: #94aec7; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.metric-copy strong { color: #edf6ff; font-size: 20px; line-height: 1.1; }
.overview-columns { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(280px, .85fr); gap: 12px; align-items: start; }
.overview-panel { min-width: 0; overflow: hidden; }
.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px; border-bottom: 1px solid #173b60; }
.panel-eyebrow { margin: 0 0 4px; color: #68b7f5; font-size: 8px; font-weight: 750; }
.panel-heading h2 { margin: 0; color: #e6f2ff; font-size: 13px; font-weight: 700; }
.quiet-action { display: inline-flex; min-height: 30px; align-items: center; gap: 5px; padding: 6px 8px; border: 1px solid #275279; border-radius: 5px; color: #b7d5ef; background: transparent; cursor: pointer; font-size: 9px; }
.quiet-action:hover { border-color: #3e8cc5; background: #0b3156; }
.panel-icon { width: 31px; height: 31px; flex-basis: 31px; }
.panel-state { display: flex; min-height: 120px; align-items: center; justify-content: center; gap: 8px; padding: 16px; color: #93aec8; font-size: 10px; text-align: center; }
.error-state { color: #ffbaba; }
.audit-list { display: grid; }
.audit-row { display: grid; grid-template-columns: 7px minmax(0, 1fr) auto; align-items: center; gap: 9px; padding: 10px 14px; border-bottom: 1px solid rgba(22, 61, 96, .72); }
.audit-row:last-child { border-bottom: 0; }
.audit-indicator { width: 7px; height: 7px; border-radius: 50%; background: #71bfff; }
.tone-success { background: #43d5a8; }.tone-warning { background: #ffc96a; }.tone-info { background: #71bfff; }
.audit-copy { display: grid; min-width: 0; gap: 3px; }
.audit-copy strong { overflow: hidden; color: #dcecff; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.audit-copy small { overflow: hidden; color: #8faac5; font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
.audit-row time { color: #7894b0; font-size: 8px; white-space: nowrap; }
.security-stat { display: flex; align-items: center; gap: 9px; padding: 14px; border-bottom: 1px solid #173b60; }
.security-stat > span:nth-child(2) { display: grid; flex: 1; gap: 4px; }
.security-stat small { color: #9db9d8; font-size: 9px; }
.security-stat strong { color: #edf6ff; font-size: 20px; }
.stat-state { padding: 4px 7px; border: 1px solid #31516f; border-radius: 999px; color: #a7bfd6; font-size: 8px; }
.state-warning { border-color: rgba(255, 190, 80, .4); color: #ffd48a; background: rgba(150, 94, 0, .15); }
.security-note { display: flex; align-items: flex-start; gap: 8px; margin: 12px; padding: 9px; border: 1px solid #21476d; border-radius: 5px; color: #92acc6; background: rgba(4, 24, 47, .55); font-size: 8px; line-height: 1.45; }
.security-note i { flex: 0 0 12px; color: #66b9ff; }
.control-list { display: grid; padding: 0 12px 12px; }
.control-list div { display: flex; align-items: center; gap: 7px; padding: 7px 2px; border-bottom: 1px solid rgba(22, 61, 96, .6); color: #a9c1d9; font-size: 8px; }
.control-list div:last-child { border-bottom: 0; }
.control-list i { color: #71bded; }.control-list strong { margin-left: auto; color: #83e0c3; font-size: 8px; font-weight: 600; }
@media (max-width: 950px) { .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.overview-columns { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 560px) { .metric-grid { grid-template-columns: minmax(0, 1fr); }.metric-panel { padding: 11px; }.audit-row { grid-template-columns: 7px minmax(0, 1fr); }.audit-row time { grid-column: 2; } }
</style>
