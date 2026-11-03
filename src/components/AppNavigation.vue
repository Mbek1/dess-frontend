<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top">
    <div class="container-fluid">
      <!-- Logo/Brand -->
      <router-link :to="dashboardRoute" class="navbar-brand fw-bold">
        <i class="bi bi-shield-lock"></i> DESS
      </router-link>

      <!-- Toggle Button for Mobile -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Navigation Menu -->
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto align-items-lg-center gap-2">
          <!-- Role-based navigation -->
          <li class="nav-item" v-if="userRole === 'investigator'">
            <router-link to="/investigator" class="nav-link" active-class="active">
              <i class="bi bi-speedometer2"></i> Dashboard
            </router-link>
          </li>
          <li class="nav-item" v-else-if="userRole === 'researcher'">
            <router-link to="/researcher" class="nav-link" active-class="active">
              <i class="bi bi-book"></i> Repository
            </router-link>
          </li>
          <li class="nav-item" v-else-if="userRole === 'admin'">
            <router-link to="/admin" class="nav-link" active-class="active">
              <i class="bi bi-gear"></i> Admin Panel
            </router-link>
          </li>

          <!-- Archives (for authenticated users) -->
          <li class="nav-item" v-if="isAuthenticated && userRole === 'investigator'">
            <router-link to="/archives" class="nav-link" active-class="active">
              <i class="bi bi-archive"></i> Archives
            </router-link>
          </li>

          <!-- Create Case Button (for investigators) -->
          <li class="nav-item" v-if="isAuthenticated && userRole === 'investigator'">
            <button type="button" class="btn btn-success" @click="showCreateCaseModal" title="Create New Case">
              <i class="bi bi-plus-circle"></i> Create Case
            </button>
          </li>

          <!-- Divider -->
          <li class="nav-item" v-if="isAuthenticated">
            <div class="vr"></div>
          </li>

          <!-- Notifications Button -->
          <li class="nav-item" v-if="isAuthenticated && userRole !== 'admin'">
            <div class="position-relative">
              <button
                type="button"
                class="btn btn-outline-light position-relative"
                @click="toggleNotifications"
                title="Notifications"
              >
                <i class="bi bi-bell"></i> Notifications
                <span v-if="notificationCount > 0" class="badge bg-danger position-absolute top-0 start-100 translate-middle">
                  {{ notificationCount }}
                </span>
              </button>
              <ul v-if="showNotificationsDropdown" class="dropdown-menu dropdown-menu-end notification-dropdown d-block show" style="position: absolute; right: 0;">
                <li class="notification-menu-heading">
                  <strong>Notifications</strong>
                  <button v-if="unreadNotificationCount" type="button" @click="markAllNotificationsRead">Mark all read</button>
                </li>
                <li v-if="notifications.length === 0" class="dropdown-item text-muted">
                  <i class="bi bi-inbox"></i> No notifications
                </li>
                <li v-for="notification in notifications" :key="notification._id" class="notification-menu-item">
                  <button class="notification-open" :class="{ unread: !notification.readAt }" type="button" @click="openNotification(notification)">
                    <span class="notification-indicator" :class="`notification-${notifTypeClass(notification.kind)}`"></span>
                    <span class="notification-content">
                      <strong>{{ notification.title }}</strong>
                      <small>{{ notification.body }}</small>
                      <time>{{ formatTime(notification.createdAt) }}</time>
                    </span>
                  </button>
                  <button class="notification-dismiss" type="button" :aria-label="`Dismiss ${notification.title}`" @click="dismissNotification(notification)">
                    <i class="bi bi-x-lg" aria-hidden="true"></i>
                  </button>
                </li>
              </ul>
            </div>
          </li>

          <!-- Messages Button -->
          <li class="nav-item" v-if="isAuthenticated">
            <button
              type="button"
              class="btn btn-outline-light position-relative"
              @click="openMessages"
              title="Messages"
            >
              <i class="bi bi-chat-dots"></i> Messages
              <span v-if="unreadMessagesCount > 0" class="badge bg-danger position-absolute top-0 start-100 translate-middle">
                {{ unreadMessagesCount }}
              </span>
            </button>
          </li>

          <!-- Profile Dropdown -->
          <li class="nav-item" v-if="isAuthenticated">
            <div class="position-relative">
              <button class="btn btn-outline-light" type="button" @click="toggleProfile" title="Profile">
                <i class="bi bi-person-circle"></i> {{ userName }}
              </button>
              <ul v-if="showProfileDropdown" class="dropdown-menu dropdown-menu-end profile-dropdown d-block show" style="position: absolute; right: 0;">
                <li>
                  <h6 class="dropdown-header">{{ userName }}</h6>
                </li>
                <li>
                  <small class="dropdown-header text-muted">{{ userRole }}</small>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <a class="dropdown-item" @click="goToProfileAndClose">
                    <i class="bi bi-person"></i> My Profile
                  </a>
                </li>
                <li>
                  <a class="dropdown-item" @click="goToSettingsAndClose">
                    <i class="bi bi-gear"></i> Settings
                  </a>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <button @click="logoutAndClose" class="dropdown-item text-danger" type="button">
                    <i class="bi bi-box-arrow-right"></i> Logout
                  </button>
                </li>
              </ul>
            </div>
          </li>

          <!-- Login Button (for unauthenticated users) -->
          <li class="nav-item" v-if="!isAuthenticated">
            <router-link to="/login" class="btn btn-success">
              <i class="bi bi-box-arrow-in-right"></i> Login
            </router-link>
          </li>
        </ul>
      </div>
    </div>

    <!-- Messages Modal -->
    <div v-if="showMessagesModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Messages</h5>
            <button type="button" class="btn-close" @click="closeMessages"></button>
          </div>
                <div class="modal-body">
                  <div v-if="userMessages.length === 0" class="text-center py-5 text-muted">
                    <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                    <p class="mt-3">No messages yet</p>
                  </div>
                  <div v-else class="messages-container">
                    <div v-for="message in userMessages" :key="message._id" class="message-item card mb-3">
                      <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 class="card-subtitle mb-1">
                              <strong>{{ message.senderName }}</strong>
                              <small class="text-muted">({{ message.senderEmail }})</small>
                            </h6>
                            <h5 class="card-title">{{ message.subject }}</h5>
                          </div>
                          <span v-if="!message.read" class="badge bg-primary">New</span>
                        </div>
                        <p class="card-text">{{ message.content }}</p>
                        <div class="d-flex justify-content-between align-items-center">
                          <small class="text-muted">
                            <i class="bi bi-clock"></i> {{ formatTime(message.createdAt) }}
                          </small>
                          <small class="badge" :class="message.priority === 'urgent' ? 'bg-danger' : message.priority === 'high' ? 'bg-warning' : 'bg-secondary'">
                            {{ message.priority }}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import { API_CONFIG } from '@/config';

const router = useRouter();
const route = useRoute();

const isAuthenticated = ref(false);
const userName = ref('');
const userRole = ref('');
const unreadMessagesCount = ref(0);
const showMessagesModal = ref(false);
const showProfileDropdown = ref(false);
const dashboardRoute = computed(() => {
  if (!isAuthenticated.value) return '/';
  if (userRole.value === 'researcher') return '/researcher';
  if (userRole.value === 'admin') return '/admin';
  return '/investigator';
});
// Messages state
const userMessages = ref<any[]>([]);

const getToken = () => sessionStorage.getItem('dess_token') || '';

async function loadMessages() {
  try {
    const response = await fetch(`${API_CONFIG.endpoints.messages}`, {
      credentials: 'include'
    });
    const data = await response.json();
    userMessages.value = data;
    // notify listeners (e.g., InvestigatorDashboard) that messages were loaded
    try {
      window.dispatchEvent(new CustomEvent('messages-loaded', { detail: data }));
    } catch (e) {
      // ignore
    }

    const unreadResp = await fetch(`${API_CONFIG.baseURL}/api/messages/unread-count`, {
      credentials: 'include'
    });
    const unreadData = await unreadResp.json();
    unreadMessagesCount.value = unreadData.unreadCount;
  } catch (err) {
    console.error('Error loading messages:', err);
  }
}

function goToProfile() {
  showProfileDropdown.value = false;
  router.push(userRole.value === 'researcher' ? '/researcher-profile' : '/profile');
}

function goToSettings() {
  showProfileDropdown.value = false;
  router.push('/settings');
}

interface Notification {
  _id: string;
  kind: string;
  title: string;
  body: string;
  readAt?: string;
  createdAt: string;
  caseId?: string;
  link?: string;
}

const notifications = ref<Notification[]>([]);
const unreadNotificationCount = ref(0);
const notificationCount = computed(() => unreadNotificationCount.value);
const showNotificationsDropdown = ref(false);
let notificationTimer: ReturnType<typeof setInterval> | undefined;

function checkAuth() {
  const token = sessionStorage.getItem('dess_token');
  const user = sessionStorage.getItem('user');
  
  if (token && user) {
    isAuthenticated.value = true;
    try {
      const userData = JSON.parse(user);
      userName.value = userData.name || 'User';
      userRole.value = userData.role || '';
    } catch (e) {
      isAuthenticated.value = false;
    }
  } else {
    isAuthenticated.value = false;
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (e) {
    console.warn('Logout request failed', e);
  }
  sessionStorage.removeItem('dess_token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('dess_user_role');
  notifications.value = [];
  unreadNotificationCount.value = 0;
  showMessagesModal.value = false;
  router.push('/');
}

async function openMessages() {
  await router.push('/messages');
}

function closeMessages() {
  showMessagesModal.value = false;
}

function showCreateCaseModal() {
  router.push({ path: '/archives', query: { createCase: 'true' } });
}

function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return dateObj.toLocaleDateString();
}

function notifTypeClass(kind: string): string {
  if (kind.includes('DELETION') || kind === 'CASE_CLOSED') return 'warning';
  if (kind === 'EVIDENCE_UPLOAD' || kind === 'EVIDENCE_VISIBILITY') return 'success';
  if (kind === 'CASE_CHAT_MESSAGE') return 'info';
  return 'info';
}

async function loadNotifications() {
  if (!isAuthenticated.value) {
    notifications.value = [];
    unreadNotificationCount.value = 0;
    return;
  }
  try {
    const response = await axios.get('/api/notifications?limit=30', { headers: { Authorization: `Bearer ${getToken()}` }, withCredentials: true });
    notifications.value = response.data.notifications || [];
    unreadNotificationCount.value = response.data.unreadCount || 0;
  } catch (err) {
    console.error('Error loading notifications:', err);
  }
}

function toggleNotifications() {
  showNotificationsDropdown.value = !showNotificationsDropdown.value;
  if (showNotificationsDropdown.value) void loadNotifications();
}

function toggleProfile() {
  showProfileDropdown.value = !showProfileDropdown.value;
}

async function openNotification(notification: Notification) {
  if (!notification.readAt) {
    await axios.patch(`/api/notifications/${notification._id}/read`, {}, { headers: { Authorization: `Bearer ${getToken()}` } });
    notification.readAt = new Date().toISOString();
    unreadNotificationCount.value = Math.max(0, unreadNotificationCount.value - 1);
  }
  showNotificationsDropdown.value = false;
  if (notification.link) await router.push(notification.link);
}

async function dismissNotification(notification: Notification) {
  await axios.delete(`/api/notifications/${notification._id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  notifications.value = notifications.value.filter(item => item._id !== notification._id);
  if (!notification.readAt) unreadNotificationCount.value = Math.max(0, unreadNotificationCount.value - 1);
}

async function markAllNotificationsRead() {
  await axios.patch('/api/notifications/read-all', {}, { headers: { Authorization: `Bearer ${getToken()}` } });
  const readAt = new Date().toISOString();
  notifications.value = notifications.value.map(notification => ({ ...notification, readAt }));
  unreadNotificationCount.value = 0;
}

function goToProfileAndClose() {
  goToProfile();
  showProfileDropdown.value = false;
}

function goToSettingsAndClose() {
  goToSettings();
  showProfileDropdown.value = false;
}

function logoutAndClose() {
  logout();
  showProfileDropdown.value = false;
}

function closeDropdowns() {
  // Close Bootstrap dropdowns after navigation
  const dropdownElements = document.querySelectorAll('[data-bs-toggle="dropdown"]');
  dropdownElements.forEach((el: any) => {
    const instance = (window as any).bootstrap?.Dropdown?.getInstance(el);
    if (instance) {
      instance.hide();
    }
  });
}

// Expose helper functions for other views to use
(window as any).navLoadMessages = loadMessages;
(window as any).navOpenMessages = openMessages;
(window as any).getNavToken = getToken;
(window as any).navLogout = logout;
(window as any).navGoToProfile = goToProfile;
(window as any).navGoToSettings = goToSettings;

onMounted(() => {
  checkAuth();
  void loadNotifications();
  notificationTimer = setInterval(() => { void loadNotifications(); }, 60000);
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  if (notificationTimer) clearInterval(notificationTimer);
  document.removeEventListener('click', handleClickOutside);
});

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const navEl = document.querySelector('.navbar');
  if (navEl && !navEl.contains(target)) {
    showNotificationsDropdown.value = false;
    showProfileDropdown.value = false;
  }
}

watch(() => route.path, () => {
  checkAuth();
  if (isAuthenticated.value) void loadNotifications();
});

</script>

<style scoped>
.navbar {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) !important;
  border-bottom: 2px solid #0f3460;
}

.navbar-brand {
  font-size: 1.5rem;
  color: #00d4ff !important;
}

.navbar-brand i {
  margin-right: 0.5rem;
}

.nav-link {
  color: #e0e0e0 !important;
  transition: all 0.3s ease;
  font-weight: 500;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem !important;
}

.nav-link:hover {
  color: #00d4ff !important;
  background-color: rgba(0, 212, 255, 0.1);
}

.nav-link.active {
  color: #00d4ff !important;
  background-color: rgba(0, 212, 255, 0.2);
  border-bottom: 2px solid #00d4ff;
}

.dropdown-menu {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #0f3460;
  border-radius: 0.75rem;
  min-width: 300px;
}

.notification-dropdown {
  min-width: 350px;
  max-height: 400px;
  overflow-y: auto;
}

.notification-dropdown .dropdown-item {
  white-space: normal;
  border-bottom: 1px solid #0f3460;
  padding: 0.75rem;
}

.notification-dropdown .dropdown-item:hover {
  background-color: rgba(0, 212, 255, 0.1);
}

.notification-menu-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 0.8rem;
  border-bottom: 1px solid #0f3460;
  color: #e7f2ff;
  font-size: 0.78rem;
}

.notification-menu-heading button {
  padding: 0;
  border: 0;
  color: #74c8ff;
  background: transparent;
  cursor: pointer;
  font-size: 0.68rem;
}

.notification-menu-item {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid #0f3460;
}

.notification-open {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.7rem 0.6rem 0.7rem 0.8rem;
  border: 0;
  color: #c4d8ec;
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.notification-open:hover,
.notification-open.unread { background: rgba(0, 110, 190, 0.12); }
.notification-indicator { width: 7px; height: 7px; flex: 0 0 7px; margin-top: 0.23rem; border-radius: 50%; background: #64bfff; }
.notification-success { background: #06d6a0; }
.notification-warning { background: #ffc96a; }
.notification-info { background: #64bfff; }
.notification-content { display: grid; min-width: 0; gap: 0.18rem; }
.notification-content strong { color: #e5f1ff; font-size: 0.68rem; }
.notification-content small { display: -webkit-box; overflow: hidden; color: #a4bad0; font-size: 0.63rem; line-height: 1.35; line-clamp: 2; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.notification-content time { color: #7997b5; font-size: 0.58rem; }
.notification-dismiss { width: 30px; flex: 0 0 30px; border: 0; color: #809bb5; background: transparent; cursor: pointer; font-size: 0.62rem; }
.notification-dismiss:hover { color: #ff9a9a; }

.profile-dropdown {
  min-width: 280px;
}

.dropdown-header {
  color: #00d4ff;
  font-weight: 600;
}

.dropdown-item {
  color: #e0e0e0;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background-color: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
}

.dropdown-item.text-danger:hover {
  background-color: rgba(220, 38, 38, 0.1);
  color: #ff6b6b;
}

.dropdown-divider {
  border-color: #0f3460;
}

.btn-outline-light {
  border-color: #e0e0e0;
  color: #e0e0e0;
}

.btn-outline-light:hover {
  background-color: rgba(0, 212, 255, 0.1);
  border-color: #00d4ff;
  color: #00d4ff;
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
}

.btn-success:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.vr {
  height: 1.5rem;
  background-color: #0f3460;
}

.navbar-toggler {
  border-color: #00d4ff;
}

.navbar-toggler:focus {
  box-shadow: 0 0 0 0.25rem rgba(0, 212, 255, 0.25);
}

.badge {
  font-size: 0.65rem;
  padding: 0.35rem 0.5rem;
}

.modal {
  display: block;
  position: fixed;
  z-index: 1050;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
}

.text-success {
  color: #10b981 !important;
}

.text-warning {
  color: #f59e0b !important;
}

.text-danger {
  color: #ef4444 !important;
}

.text-info {
  color: #06b6d4 !important;
}

@media (max-width: 991px) {
  .nav-link {
    padding: 0.75rem 0 !important;
  }

  .dropdown-menu {
    min-width: auto;
  }

  .notification-dropdown {
    min-width: auto;
  }
}
</style>
