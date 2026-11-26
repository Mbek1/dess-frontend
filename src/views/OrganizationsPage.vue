<template>
  <main class="organizations-page">
    <header class="page-header">
      <div><p class="eyebrow">CASE REPOSITORY · COMMUNITY</p><h1>Organisation Directory</h1><p class="subtitle">Find your university, research institution or digital-forensics organisation, or submit one for verification.</p></div>
      <button class="primary-button" @click="showCreate = !showCreate"><i class="bi bi-plus-lg"></i> Add organisation</button>
    </header>

    <section class="directory-tools">
      <label class="search-box"><i class="bi bi-search"></i><input v-model="search" placeholder="Search organisations, descriptions or locations" @input="scheduleSearch" /></label>
      <select v-model="type" @change="loadOrganizations" aria-label="Filter by organisation type">
        <option value="">All organisation types</option>
        <option value="university">University</option><option value="research-institution">Research institution</option>
        <option value="forensics-organization">Digital forensics organisation</option><option value="government">Government institution</option>
        <option value="private-organization">Private organisation</option><option value="other">Other</option>
      </select>
    </section>

    <section v-if="showCreate" class="create-panel">
      <div class="panel-title"><div><h2>Submit an organisation</h2><p>New entries remain pending until an administrator verifies them.</p></div><button class="icon-button" @click="showCreate = false" aria-label="Close"><i class="bi bi-x-lg"></i></button></div>
      <form class="create-grid" @submit.prevent="createOrganization">
        <label>Organisation name<input v-model.trim="form.name" required minlength="3" maxlength="140" placeholder="e.g. University or Institute name" /></label>
        <label>Organisation type<select v-model="form.type"><option value="university">University</option><option value="research-institution">Research institution</option><option value="forensics-organization">Digital forensics organisation</option><option value="government">Government institution</option><option value="private-organization">Private organisation</option><option value="other">Other</option></select></label>
        <label>Location<input v-model.trim="form.location" maxlength="160" placeholder="City, country" /></label>
        <label>Website<input v-model.trim="form.website" maxlength="240" placeholder="https://" /></label>
        <label class="wide">Description<textarea v-model.trim="form.description" maxlength="1200" rows="3" placeholder="Briefly describe the organisation"></textarea></label>
        <div class="wide form-footer"><span v-if="formError" class="error">{{ formError }}</span><button class="primary-button" :disabled="creating">{{ creating ? 'Submitting…' : 'Submit for verification' }}</button></div>
      </form>
    </section>

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <p v-if="error" class="error notice" role="alert">{{ error }}</p>
    <div v-if="loading" class="loading"><i class="bi bi-arrow-repeat"></i> Loading organisations…</div>
    <section v-else class="organization-grid">
      <article v-for="org in organizations" :key="org._id" class="organization-card">
        <div class="card-top"><span class="org-icon"><i class="bi bi-building"></i></span><span class="verification" :class="org.verificationStatus">{{ org.verificationStatus === 'verified' ? 'Verified' : 'Awaiting verification' }}</span></div>
        <h2>{{ org.name }}</h2><p class="org-type">{{ typeLabel(org.type) }} <span v-if="org.location">· {{ org.location }}</span></p>
        <p class="description">{{ org.description || 'No description has been provided.' }}</p>
        <div class="card-meta"><span><i class="bi bi-people"></i> {{ org.memberCount }} members</span><a v-if="org.website" :href="safeWebsite(org.website)" target="_blank" rel="noopener noreferrer">Website <i class="bi bi-box-arrow-up-right"></i></a></div>
        <div class="card-actions">
          <span v-if="org.membershipStatus === 'approved'" class="member-state"><i class="bi bi-check-circle-fill"></i> Member</span>
          <span v-else-if="org.membershipStatus === 'pending'" class="pending-state"><i class="bi bi-hourglass-split"></i> Request pending</span>
          <span v-else-if="org.membershipStatus === 'rejected'" class="pending-state">Request declined</span>
          <button v-else class="join-button" :disabled="joining === org._id" @click="joinOrganization(org)">{{ joining === org._id ? 'Requesting…' : 'Request to join' }}</button>
          <button class="manage-button" @click="viewProfile(org)">View profile</button>
          <button v-if="org.canManage" class="manage-button" @click="openMembers(org)">Manage members</button>
          <button v-if="org.canVerify && org.verificationStatus !== 'verified'" class="manage-button" @click="verifyOrganization(org, 'verified')">Verify organisation</button>
          <button v-if="org.canVerify && org.verificationStatus !== 'rejected'" class="manage-button danger" @click="verifyOrganization(org, 'rejected')">Reject</button>
        </div>
      </article>
      <div v-if="!organizations.length" class="empty-state"><i class="bi bi-building"></i><h3>No organisations found</h3><p>Try a different search or submit the organisation if it is missing.</p></div>
    </section>

    <section v-if="selectedProfile" class="members-panel">
      <div class="panel-title"><div><h2>{{ selectedProfile.organization.name }}</h2><p>{{ typeLabel(selectedProfile.organization.type) }} · {{ selectedProfile.organization.location || 'Location not provided' }} · {{ selectedProfile.organization.verificationStatus }}</p></div><button class="icon-button" @click="selectedProfile = null" aria-label="Close"><i class="bi bi-x-lg"></i></button></div>
      <p class="profile-description">{{ selectedProfile.organization.description || 'No organisation description has been provided.' }}</p>
      <h3 class="member-heading">Associated members ({{ selectedProfile.members.length }})</h3>
      <div class="member-directory"><div v-for="(member, index) in selectedProfile.members" :key="index" class="member-chip"><i class="bi bi-person-circle"></i><span><strong>{{ member.name }}</strong><small>{{ member.userType }}</small></span></div></div>
    </section>

    <section v-if="selectedOrganization" class="members-panel">
      <div class="panel-title"><div><h2>Membership requests · {{ selectedOrganization.name }}</h2><p>Approve or decline requests to join this organisation.</p></div><button class="icon-button" @click="selectedOrganization = null" aria-label="Close"><i class="bi bi-x-lg"></i></button></div>
      <p v-if="membersError" class="error">{{ membersError }}</p>
      <div v-for="member in members" :key="member.membershipId" class="member-row">
        <div><strong>{{ member.user?.name || 'User' }}</strong><small>{{ member.user?.email }} · {{ member.userType }} · {{ member.status }}</small></div>
        <div v-if="member.status === 'pending'" class="member-actions"><button @click="reviewMember(member, 'approved')">Approve</button><button class="decline" @click="reviewMember(member, 'rejected')">Decline</button></div>
      </div>
      <p v-if="!members.length" class="empty-members">No membership requests or members to display.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import axios from 'axios';

interface Organization {
  _id: string; name: string; type: string; description: string; website: string; location: string;
  verificationStatus: string; memberCount: number; membershipStatus: string; canManage: boolean; canVerify: boolean;
}
interface Member { membershipId: string; user: { name: string; email: string }; userType: string; status: string; }
interface OrganizationProfile { organization: Organization; members: Array<{ name: string; userType: string }>; }
const organizations = ref<Organization[]>([]);
const loading = ref(false); const creating = ref(false); const joining = ref('');
const showCreate = ref(false); const search = ref(''); const type = ref('');
const notice = ref(''); const error = ref(''); const formError = ref(''); const membersError = ref('');
const selectedOrganization = ref<Organization | null>(null); const members = ref<Member[]>([]);
const selectedProfile = ref<OrganizationProfile | null>(null);
const form = ref({ name: '', type: 'university', description: '', website: '', location: '' });
let searchTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleSearch() { if (searchTimer) clearTimeout(searchTimer); searchTimer = setTimeout(() => void loadOrganizations(), 250); }
const token = () => sessionStorage.getItem('dess_token') || '';
const config = () => ({ headers: { Authorization: `Bearer ${token()}` }, withCredentials: true });

async function loadOrganizations() {
  loading.value = true; error.value = '';
  try {
    const response = await axios.get('/api/organizations', { ...config(), params: { search: search.value, type: type.value } });
    organizations.value = response.data.organizations || [];
  } catch (err: any) { error.value = err?.response?.data?.error || 'Could not load the organisation directory.'; }
  finally { loading.value = false; }
}
function typeLabel(value: string) { return ({ university: 'University', 'research-institution': 'Research institution', 'forensics-organization': 'Digital forensics organisation', government: 'Government institution', 'private-organization': 'Private organisation', other: 'Other' } as Record<string,string>)[value] || 'Organisation'; }
function safeWebsite(value: string) { return /^https?:\/\//i.test(value) ? value : `https://${value}`; }
async function createOrganization() {
  creating.value = true; formError.value = ''; notice.value = '';
  try {
    await axios.post('/api/organizations', form.value, config());
    notice.value = 'Organisation submitted. It will appear in the directory while awaiting administrator verification.';
    form.value = { name: '', type: 'university', description: '', website: '', location: '' }; showCreate.value = false;
    await loadOrganizations();
  } catch (err: any) { formError.value = err?.response?.data?.error || 'Could not submit this organisation.'; }
  finally { creating.value = false; }
}
async function joinOrganization(org: Organization) {
  joining.value = org._id; notice.value = '';
  try {
    await axios.post(`/api/organizations/${org._id}/join`, {}, config());
    notice.value = `Your request to join ${org.name} has been submitted.`; await loadOrganizations();
  } catch (err: any) { notice.value = err?.response?.data?.error || 'Could not submit membership request.'; }
  finally { joining.value = ''; }
}
async function viewProfile(org: Organization) {
  try { const response = await axios.get(`/api/organizations/${org._id}`, config()); selectedProfile.value = response.data; }
  catch (err: any) { error.value = err?.response?.data?.error || 'Could not load organisation profile.'; }
}
async function openMembers(org: Organization) {
  selectedOrganization.value = org; membersError.value = ''; members.value = [];
  try { const response = await axios.get(`/api/organizations/${org._id}/members`, config()); members.value = response.data.members || []; }
  catch (err: any) { membersError.value = err?.response?.data?.error || 'Could not load members.'; }
}
async function verifyOrganization(org: Organization, status: 'verified' | 'rejected') {
  try {
    await axios.patch(`/api/organizations/${org._id}/verification`, { status }, config());
    notice.value = `${org.name} marked ${status}.`; await loadOrganizations();
  } catch (err: any) { error.value = err?.response?.data?.error || 'Could not update organisation verification.'; }
}
async function reviewMember(member: Member, status: 'approved' | 'rejected') {
  if (!selectedOrganization.value) return;
  try {
    await axios.patch(`/api/organizations/${selectedOrganization.value._id}/members/${member.membershipId}`, { status }, config());
    await openMembers(selectedOrganization.value); await loadOrganizations();
  } catch (err: any) { membersError.value = err?.response?.data?.error || 'Could not update membership.'; }
}
onMounted(loadOrganizations);
onUnmounted(() => { if (searchTimer) clearTimeout(searchTimer); });
</script>

<style scoped>
.organizations-page{min-height:calc(100vh - 58px);padding:28px clamp(16px,3vw,44px);color:#e8f2ff;background:radial-gradient(ellipse at top right,#0a3158 0,transparent 42%),#04152d}
.page-header{display:flex;align-items:center;justify-content:space-between;gap:20px;max-width:1450px;margin:0 auto 22px}.eyebrow{margin:0 0 7px;color:#41c9a0;font-size:10px;font-weight:800;letter-spacing:.15em}.page-header h1{margin:0;color:#f1f7ff;font-size:clamp(23px,3vw,32px)}.subtitle{max-width:720px;margin:8px 0 0;color:#a9c2dc;font-size:13px;line-height:1.6}
.primary-button,.join-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:39px;padding:9px 14px;border:1px solid #168bff;border-radius:7px;color:white;background:#0876d9;font-size:12px;font-weight:700;cursor:pointer}.primary-button:disabled,.join-button:disabled{opacity:.6;cursor:wait}
.directory-tools,.create-panel,.organization-grid,.members-panel,.notice,.loading{max-width:1450px;margin-left:auto;margin-right:auto}.directory-tools{display:flex;gap:10px;margin-bottom:18px}.search-box{display:flex;flex:1;align-items:center;gap:10px;padding:0 12px;border:1px solid #17436d;border-radius:7px;background:#061d3a}.search-box input{width:100%;min-height:42px;border:0;outline:0;color:#eaf4ff;background:transparent;font-size:12px}.directory-tools select,.create-grid input,.create-grid select,.create-grid textarea{min-height:42px;padding:9px 11px;border:1px solid #17436d;border-radius:7px;color:#eaf4ff;background:#061d3a;font-size:12px}.directory-tools select{min-width:205px}
.create-panel,.members-panel{margin-bottom:18px;padding:18px;border:1px solid #17436d;border-radius:10px;background:#061d3a}.panel-title{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;margin-bottom:15px}.panel-title h2{margin:0;font-size:16px}.panel-title p{margin:5px 0 0;color:#9eb8d4;font-size:11px}.icon-button{width:30px;height:30px;border:1px solid #234b70;border-radius:6px;color:#c9def3;background:transparent;cursor:pointer}
.create-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.create-grid label{display:grid;gap:6px;color:#b8cce1;font-size:11px;font-weight:650}.create-grid .wide{grid-column:1/-1}.create-grid textarea{resize:vertical}.form-footer{display:flex;justify-content:space-between;align-items:center;gap:12px}
.organization-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:13px}.organization-card{display:flex;min-width:0;flex-direction:column;padding:16px;border:1px solid #17436d;border-radius:10px;background:linear-gradient(145deg,#082345,#061a34);box-shadow:0 10px 25px #00102044}.card-top{display:flex;align-items:center;justify-content:space-between}.org-icon{display:grid;width:38px;height:38px;place-items:center;border-radius:9px;color:#57d8b1;background:#0b493f;font-size:18px}.verification{padding:5px 8px;border-radius:20px;font-size:9px;font-weight:700}.verification.verified{color:#77edc8;background:#075342}.verification.pending{color:#ffd28a;background:#594018}.organization-card h2{margin:13px 0 4px;font-size:15px}.org-type{margin:0;color:#72b8f0;font-size:10px}.description{min-height:45px;margin:11px 0;color:#a9bfd6;font-size:11px;line-height:1.55}.card-meta{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid #163b5f;color:#9eb5cd;font-size:10px}.card-meta a{color:#65b5ff;text-decoration:none}.card-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:10px}.member-state,.pending-state{font-size:10px;color:#6fe2b9}.pending-state{color:#f6c77b}.manage-button,.member-actions button{padding:7px 9px;border:1px solid #2b638e;border-radius:6px;color:#b9dcf8;background:transparent;font-size:10px;cursor:pointer}.empty-state{grid-column:1/-1;padding:50px 20px;text-align:center;color:#a8bfd5}.empty-state>i{font-size:30px;color:#4a9cce}.empty-state h3{margin:12px 0 5px;color:#e7f2ff;font-size:16px}.empty-state p{font-size:11px}.notice{margin-top:12px;margin-bottom:12px;padding:10px 12px;border:1px solid #1d604f;border-radius:7px;color:#8de5c4;background:#063b32;font-size:11px}.error{color:#ffaaa9;font-size:11px}.loading{padding:35px;text-align:center;color:#a9bfd6}.members-panel{margin-top:18px}.profile-description{color:#b4c9de;font-size:12px;line-height:1.6}.member-heading{margin:14px 0 9px;color:#dcecff;font-size:12px}.member-directory{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}.member-chip{display:flex;align-items:center;gap:9px;padding:9px;border:1px solid #173f64;border-radius:7px;background:#08213e}.member-chip>i{color:#5bc8a6;font-size:19px}.member-chip span{display:grid;gap:3px}.member-chip strong{color:#dcecff;font-size:10px}.member-chip small{color:#9db6ce;font-size:9px}.member-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-top:1px solid #163b5f}.member-row>div:first-child{display:grid;gap:4px}.member-row strong{font-size:11px}.member-row small,.empty-members{color:#9db6ce;font-size:10px}.member-actions{display:flex;gap:6px}.member-actions .decline,.manage-button.danger{border-color:#74414b;color:#ffb4b4}.empty-members{margin:12px 0}
@media(max-width:680px){.page-header{align-items:flex-start;flex-direction:column}.directory-tools{flex-direction:column}.directory-tools select{width:100%}.create-grid{grid-template-columns:1fr}.create-grid .wide{grid-column:auto}.form-footer{align-items:flex-start;flex-direction:column}.member-row{align-items:flex-start;flex-direction:column}}
</style>
