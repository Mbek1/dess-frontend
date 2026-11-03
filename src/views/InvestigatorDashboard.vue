<template>
  <div class="container py-5">
    <!-- Top Bar: Profile, Settings, Create Case -->
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap">
      <div>
        <!-- Navbar actions moved to AppNavigation.vue -->
      </div>
 
    
      
    <!-- Create Case Modal -->
    <div v-if="showCreateCase" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add New Case</h5>
            <button type="button" class="btn-close" @click="showCreateCase = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitCase">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Case Name</label>
                  <input v-model="newCase.name" type="text" class="form-control" required />
                </div>
                <div class="col-12">
                  <label class="form-label">Description</label>
                  <textarea v-model="newCase.description" class="form-control" rows="2" required></textarea>
                </div>
                <div class="col-12">
                  <label class="form-label">Keywords</label>
                  <input v-model="newCase.keywords" type="text" class="form-control" placeholder="e.g., fraud, theft, investigation" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Case Type</label>
                  <select v-model="newCase.caseType" class="form-select" required>
                    <option value="">Select case type...</option>
                    <option value="civil">Civil</option>
                    <option value="criminal">Criminal</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Docket Number</label>
                  <input v-model="newCase.docketNumber" type="text" class="form-control" placeholder="e.g., 2026-NYC-001" />
                </div>
                <div class="col-12">
                  <label class="form-label">Add Team Member(s)</label>
                  <div class="input-group mb-2">
                    <input v-model="userSearch" @input="searchUsers" type="text" class="form-control" placeholder="Search users...">
                    <button class="btn btn-outline-secondary" type="button" @click="searchUsers"><i class="bi bi-search"></i></button>
                  </div>
                  <div v-if="userResults.length" class="list-group mb-2">
                    <button v-for="user in userResults" :key="user.id" type="button" class="list-group-item list-group-item-action d-flex align-items-center" @click="addTeamMember(user)">
                      <i class="bi bi-person me-2"></i> {{ user.name }} <span class="ms-auto text-muted small">{{ user.email }}</span>
                    </button>
                  </div>
                  <div v-if="newCase.team.length" class="mb-2">
                    <span v-for="member in newCase.team" :key="(member as any)._id || (member as any).id" class="badge bg-primary me-1">
                      <i class="bi bi-person"></i> {{ member.name }}
                      <i class="bi bi-x ms-1" style="cursor:pointer;" @click.stop="removeTeamMember(member)"></i>
                    </span>
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label">Status</label>
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" v-model="newCase.status" true-value="open" false-value="closed" id="caseStatusSwitch">
                    <label class="form-check-label" for="caseStatusSwitch">{{ newCase.status === 'open' ? 'Open' : 'Closed' }}</label>
                  </div>
                </div>
              </div>
              <div class="mt-4 text-end">
                <button type="button" class="btn btn-secondary me-2" @click="showCreateCase = false">Cancel</button>
                <button type="submit" class="btn btn-success">Create Case</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- Welcome Section -->
    <div class="welcome-section d-flex align-items-center mb-5">
      <img src="/img/hero-img.png" alt="Logo" style="height: 48px;" class="me-3" />
      <div>
        <h2 class="mb-0">Welcome, {{ loggedInName || 'Investigator' }}!</h2>
        <small class="text-muted">{{ today }}</small>
      </div>
    </div>
    <!-- Statistics Cards -->
    <div class="row mb-5 g-4">
      <div class="col-md-4">
        <div class="stat-card stat-all h-100">
          <div class="stat-icon"><i class="bi bi-folder2-open"></i></div>
          <div>
            <div class="stat-label">All Cases</div>
            <div class="stat-value">{{ stats.all }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card stat-open h-100">
          <div class="stat-icon"><i class="bi bi-folder-symlink"></i></div>
          <div>
            <div class="stat-label">Open Cases</div>
            <div class="stat-value">{{ stats.open }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card stat-closed h-100">
          <div class="stat-icon"><i class="bi bi-folder-check"></i></div>
          <div>
            <div class="stat-label">Closed Cases</div>
            <div class="stat-value">{{ stats.closed }}</div>
          </div>
        </div>
      </div>
    </div>

<button class="btn btn-success" @click="showCreateCase = true"><i class="bi bi-plus-circle"></i> Create Case</button>

    <!-- Tab Content -->
    <div v-if="activeTab==='notifications'" class="notifications-section">
      <div v-if="notifications.length === 0" class="alert alert-info">
        <i class="bi bi-info-circle"></i> No new notifications.
      </div>
      <div v-else class="notifications-list">
        <div v-for="(notification, index) in notifications" :key="index" :class="['notification-card', 'alert', notification.type === 'error' ? 'alert-danger' : notification.type === 'warning' ? 'alert-warning' : notification.type === 'success' ? 'alert-success' : 'alert-info']">
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <div class="notification-title fw-bold">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-meta text-muted small mt-2">
                <i class="bi bi-clock"></i> {{ formatTime(notification.timestamp) }}
              </div>
              <div v-if="notification.caseId" class="notification-case mt-2">
                <span class="badge bg-primary">Case: {{ notification.caseId }}</span>
              </div>
            </div>
            <button class="btn btn-sm btn-link text-secondary" @click="dismissNotification(index)">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Elegant Message Modal -->
    <div v-if="showMessages" class="modal d-block" style="background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);">
      <div class="modal-dialog" style="margin: 1rem auto; max-width: 95vw; height: calc(100vh - 2rem);">
        <div class="modal-content" style="height: 100%; display: flex; flex-direction: column; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.25rem; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h5 style="margin: 0; font-size: 1.25rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                <i class="bi bi-chat-dots"></i> Messages
              </h5>
              <small style="opacity: 0.9; margin-top: 0.25rem; display: block;">Stay connected with your team</small>
            </div>
            <button @click="showMessages = false" class="btn-close btn-close-white" style="opacity: 0.8;"></button>
          </div>
          
          <!-- Main Content -->
          <div style="flex: 1; display: flex; overflow: hidden; background: white;">
            <!-- Left Sidebar - Conversations List -->
            <div class="d-none d-md-flex" style="width: 35%; flex-direction: column; border-right: 1px solid #e0e0e0; background: #fafafa;">
              <!-- Sidebar Header -->
              <div style="padding: 1rem; border-bottom: 1px solid #e0e0e0; flex-shrink: 0;">
                <button @click="openNewMessageComposer()" class="btn btn-sm btn-primary w-100" style="border-radius: 6px; font-weight: 500;">
                  <i class="bi bi-pencil-square"></i> Compose Message
                </button>
              </div>
              
              <!-- Conversations List -->
              <div style="flex: 1; overflow-y: auto;">
                <div v-if="groupedConversations.length === 0" style="padding: 2rem 1rem; text-align: center;">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem;">📭</div>
                  <p style="margin: 0; color: #999; font-size: 0.9rem;">No messages yet</p>
                  <p style="margin: 0.5rem 0 0 0; color: #bbb; font-size: 0.85rem;">Start a new conversation</p>
                </div>
                
                <div v-for="(msg, idx) in groupedConversations" :key="msg._id" 
                     @click="selectConversation(msg)" 
                     :style="{
                       'padding': '0.75rem 1rem',
                       'cursor': 'pointer',
                       'background': selectedConversation?._id === msg._id ? '#e8eaf6' : (idx % 2 === 0 ? 'white' : 'transparent'),
                       'border-left': selectedConversation?._id === msg._id ? '4px solid #667eea' : '4px solid transparent',
                       'transition': 'all 0.2s ease'
                     }"
                     style="border-bottom: 1px solid #f0f0f0;">
                  <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <strong style="font-size: 0.95rem; color: #222; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ msg.conversationPartnerName }}</strong>
                    <div style="display: flex; gap: 0.25rem;">
                      <span v-if="!msg.read && msg.recipientId === currentUserId" class="badge bg-primary" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;">New</span>
                      <span v-if="msg.priority === 'urgent'" class="badge bg-danger" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;">!</span>
                    </div>
                  </div>
                  <p style="margin: 0.25rem 0; font-size: 0.85rem; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ msg.subject }}</p>
                  <small style="color: #999; font-size: 0.8rem;">{{ formatTime(msg.createdAt) }}</small>
                </div>
              </div>
            </div>
            
            <!-- Right Side - Main View -->
            <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
              <!-- Top Bar with Back Button (Mobile) & Options -->
              <div style="padding: 0.75rem 1rem; border-bottom: 1px solid #e0e0e0; background: #f5f5f5; display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0;">
                <button @click="goBackToMessageList" class="btn btn-sm btn-outline-secondary d-md-none">
                  <i class="bi bi-chevron-left"></i>
                </button>
                <div style="flex: 1; font-size: 0.9rem; color: #666; font-weight: 500;">
                  <span v-if="selectedConversation">💬 Conversation</span>
                  <span v-else-if="messageRecipient">✏️ New Message</span>
                  <span v-else>🔍 Search Users</span>
                </div>
                <button @click="openNewMessageComposer()" class="btn btn-sm btn-primary d-none d-md-inline-flex">
                  <i class="bi bi-pencil-square"></i>
                </button>
              </div>
              
              <!-- View Content - Scrollable -->
              <div style="flex: 1; overflow-y: auto; padding: 1.5rem; background: white; display: flex; flex-direction: column;">
                <!-- Conversation View -->
                <div v-if="selectedConversation" style="display: flex; flex-direction: column; height: 100%;">
                  <!-- Conversation Header -->
                  <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 2px solid #f0f0f0;">
                    <p style="margin: 0; font-size: 0.85rem; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Conversation with</p>
                    <h6 style="margin: 0.5rem 0 0 0; font-weight: 600; color: #222;">{{ selectedConversation.senderId === currentUserId ? selectedConversation.recipientName : selectedConversation.senderName }}</h6>
                    <small style="color: #999;">{{ selectedConversation.senderId === currentUserId ? selectedConversation.recipientEmail : selectedConversation.senderEmail }}</small>
                  </div>
                  
                  <!-- Messages -->
                  <div ref="conversationScroll" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem;">
                    <div v-for="msg in conversationMessages" :key="msg._id" 
                         :style="{
                           'display': 'flex',
                           'justify-content': msg.senderId === currentUserId ? 'flex-end' : 'flex-start'
                         }">
                      <div :style="{
                        'background': msg.senderId === currentUserId ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e8e8e8',
                        'color': msg.senderId === currentUserId ? 'white' : '#222',
                        'padding': '0.75rem 1rem',
                        'border-radius': msg.senderId === currentUserId ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                        'max-width': '75%',
                        'box-shadow': '0 2px 8px rgba(0,0,0,0.1)'
                      }">
                        <p style="margin: 0 0 0.5rem 0; font-weight: 600; font-size: 0.9rem;">{{ msg.subject }}</p>
                        <p style="margin: 0 0 0.75rem 0; font-size: 0.95rem; line-height: 1.4;">{{ msg.content }}</p>
                        <div style="display: flex; gap: 0.5rem; align-items: center; justify-content: space-between; font-size: 0.8rem; opacity: 0.8;">
                          <span>{{ formatTime(msg.createdAt) }}</span>
                          <span v-if="msg.priority !== 'normal'" :style="{'color': msg.senderId === currentUserId ? 'rgba(255,255,255,0.9)' : '#666'}">{{ msg.priority }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Search for New Conversation -->
                <div v-else-if="!messageRecipient" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; flex: 1;">
                  <div style="margin-bottom: 1rem;">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">🔍</div>
                    <h6 style="margin: 0; font-weight: 600; color: #222;">Start a New Conversation</h6>
                    <p style="margin: 0.5rem 0 0 0; color: #999; font-size: 0.9rem;">Search for a user to message</p>
                  </div>
                  
                  <div style="width: 100%; max-width: 350px;">
                    <input v-model="messagingUserSearch" type="text" class="form-control" placeholder="Type name or email..." @input="searchMessagingUsers" style="border-radius: 8px; border: 1px solid #ddd; padding: 0.75rem;" />
                    
                    <div v-if="messagingSearchResults.length > 0" style="margin-top: 1rem; max-height: 250px; overflow-y: auto;">
                      <div v-for="user in messagingSearchResults" :key="user._id" 
                           @click="selectMessagingRecipient(user)" 
                           style="padding: 0.75rem; background: white; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; margin-bottom: 0.5rem;">
                        <strong style="display: block; color: #222;">{{ user.name }}</strong>
                        <small style="color: #999;">{{ user.email }} ({{ capitalizeCase(user.role) }})</small>
                        <small v-if="user.organizationRole || user.organizationName" style="display: block; color: #666; font-style: italic; margin-top: 0.25rem;">
                          <i class="bi bi-building"></i> {{ user.organizationRole }}{{ user.organizationRole && user.organizationName ? ', ' : '' }}{{ user.organizationName }}
                        </small>
                      </div>
                    </div>
                    <div v-else-if="messagingUserSearch" style="margin-top: 1rem; color: #999; font-size: 0.9rem;">
                      No users found
                    </div>
                  </div>
                </div>
                
                <!-- Compose New Message Preview -->
                <div v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; flex: 1;">
                  <div style="max-width: 350px;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">✉️</div>
                    <p style="margin: 0; color: #999; font-size: 0.9rem; margin-bottom: 1rem;">Composing message to:</p>
                    
                    <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #667eea;">
                      <p style="margin: 0; font-weight: 600; color: #222; font-size: 0.95rem;">{{ messageRecipient.name }}</p>
                      <small style="color: #999;">{{ messageRecipient.email }}</small>
                    </div>
                    
                    <button @click="openNewMessageComposer()" class="btn btn-sm btn-outline-secondary" style="border-radius: 6px;">
                      <i class="bi bi-arrow-left"></i> Change Recipient
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Fixed Compose Box -->
              <div v-if="messageRecipient || selectedConversation" style="border-top: 1px solid #e0e0e0; background: white; padding: 1rem; flex-shrink: 0;">
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                  <input v-if="messageRecipient && !selectedConversation" v-model="messageSubject" type="text" class="form-control" placeholder="Subject line..." style="border-radius: 6px; border: 1px solid #ddd; padding: 0.75rem;" />
                  <textarea v-model="messageContent" class="form-control" :placeholder="messageRecipient && !selectedConversation ? 'Type your message...' : 'Type your reply...'" rows="2" style="border-radius: 6px; border: 1px solid #ddd; padding: 0.75rem; resize: none; font-family: inherit;"></textarea>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.75rem; align-items: center;">
                    <select v-if="messageRecipient && !selectedConversation" v-model="messagePriority" class="form-select" style="border-radius: 6px; border: 1px solid #ddd; padding: 0.5rem;">
                      <option value="low">📌 Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">⚡ High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                    <select v-if="messageRecipient && !selectedConversation" v-model="messageType" class="form-select" style="border-radius: 6px; border: 1px solid #ddd; padding: 0.5rem;">
                      <option value="general">General</option>
                      <option value="case-related">Case</option>
                      <option value="urgent">Urgent</option>
                      <option value="follow-up">Follow-up</option>
                    </select>
                    <button @click="sendMessage" class="btn btn-primary" :disabled="!messageContent.trim() || (!selectedConversation && !messageRecipient)" style="border-radius: 6px; font-weight: 500;">
                      <i class="bi bi-send"></i> Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { API_CONFIG } from '@/config';
import axios from 'axios';

const router = useRouter();

// Interfaces
interface TeamUser {
  id: number;
  name: string;
  email: string;
}

interface Notification {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  caseId?: string;
}

interface Message {
  _id: string;
  conversationId: string;
  parentMessageId?: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  recipientRole: string;
  subject: string;
  content: string;
  type: 'case-related' | 'general' | 'urgent' | 'follow-up';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  readAt?: string;
  status: 'draft' | 'sent' | 'delivered' | 'read';
  createdAt: string;
  updatedAt: string;
  conversationPartnerId?: string;
  conversationPartnerName?: string;
  conversationPartnerEmail?: string;
}

  // Token and navigation helpers are provided by AppNavigation
  // Use `window.getNavToken()` and `window.nav*` helpers exposed by AppNavigation.vue
const user = JSON.parse(sessionStorage.getItem('user') || '{}');

// State
const today = new Date().toLocaleDateString();
const activeTab = ref('archives');
const showCreateCase = ref(false);
const showMessages = ref(false);
const caseFilter = ref<'all'|'open'|'closed'>('all');

// Notifications state
const notifications = ref<Notification[]>([]);

// Messages state
const userMessages = ref<Message[]>([]);
const selectedConversation = ref<Message | null>(null);
const messageContent = ref('');
const currentUserId = ref('');
const messageRecipient = ref<any>(null);
const messagingUserSearch = ref('');
const messagingSearchResults = ref<any[]>([]);
const messageSubject = ref('');
const messageType = ref<'case-related' | 'general' | 'urgent' | 'follow-up'>('general');
const messagePriority = ref<'low' | 'normal' | 'high' | 'urgent'>('normal');
const unreadMessageCount = ref(0);
const conversationScroll = ref<HTMLElement | null>(null);

currentUserId.value = user?.id || '';

// Computed properties
const conversationMessages = computed(() => {
  if (!selectedConversation.value) return [];
  return userMessages.value.filter(m => m.conversationId === selectedConversation.value?.conversationId).reverse();
});

// Group messages by conversation partner (show only latest message per user)
const groupedConversations = computed(() => {
  const grouped: { [key: string]: Message } = {};
  
  userMessages.value.forEach(msg => {
    // Determine the conversation partner
    const partnerId = msg.senderId === currentUserId.value ? msg.recipientId : msg.senderId;
    const partnerName = msg.senderId === currentUserId.value ? msg.recipientName : msg.senderName;
    const partnerEmail = msg.senderId === currentUserId.value ? msg.recipientEmail : msg.senderEmail;
    
    const key = partnerId;
    
    // Keep the most recent message for each partner
    if (!grouped[key] || new Date(msg.createdAt).getTime() > new Date(grouped[key].createdAt).getTime()) {
      grouped[key] = {
        ...msg,
        conversationPartnerId: partnerId,
        conversationPartnerName: partnerName,
        conversationPartnerEmail: partnerEmail
      };
    }
  });
  
  // Convert to array and sort by most recent
  return Object.values(grouped).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

// Logout handled centrally by AppNavigation (window.navLogout)

// User and case management state
const allUsers = ref<any[]>([]);
const userSearch = ref('');
const userResults = ref<any[]>([]);
const loggedInName = ref('');

// New case form state
const newCase = ref({
  name: '',
  description: '',
  keywords: '',
  docketNumber: '',
  status: 'open',
  caseType: '',
  team: [] as TeamUser[],
});

// Case data types
interface EvidenceItem {
  filename: string;
  type: string;
}
interface AuditLogItem {
  filename: string;
  type: string;
  date: string;
}
interface CaseItem {
  _id: string;
  number: number;
  name: string;
  description: string;
  status: string;
  team: TeamUser[];
  evidence?: EvidenceItem[];
  auditLog?: AuditLogItem[];
}

const cases = ref<CaseItem[]>([]);
const loadingCases = ref(true);
const casesError = ref('');

// Case details modal state
const showCaseDetails = ref(false);
const selectedCase = ref<CaseItem|null>(null);
const evidenceFile = ref<File|null>(null);
const evidenceType = ref('');

// Case closure modal state
const showCloseCaseModal = ref(false);
const closureDocFile = ref<File|null>(null);
const closureDocType = ref('');

const creatingCase = ref(false);

// Utility functions
// Notifications are added via AppNavigation.addNavNotification when available

function dismissNotification(index: number) {
  notifications.value.splice(index, 1);
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

function capitalizeCase(text: string): string {
  return (text || '').charAt(0).toUpperCase() + (text || '').slice(1);
}

function updateLoggedInName() {
  try {
    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
    loggedInName.value = userData?.name || '';
  } catch {
    loggedInName.value = '';
  }
}

// Local wrappers to call AppNavigation's exposed helpers (avoid direct `window` in templates)
// Navbar actions moved to AppNavigation.vue; wrappers removed

// Fetch users from backend
async function fetchUsers() {
  try {
    const res = await axios.get('/api/users', {
      headers: { 'Authorization': `Bearer ${(window as any).getNavToken ? (window as any).getNavToken() : ''}` }
    });
    if (Array.isArray(res.data)) {
      allUsers.value = res.data.map((u: any) => ({
        ...u,
        name: typeof u.name === 'string' ? u.name.trim() : '',
        email: typeof u.email === 'string' ? u.email.trim() : '',
      }));
    }
  } catch (err) {
    console.error('Error fetching users:', err);
    allUsers.value = [];
  }
}

// Load cases
async function loadCases() {
  try {
    loadingCases.value = true;
    const res = await axios.get('/api/cases', {
      headers: { 'Authorization': `Bearer ${(window as any).getNavToken ? (window as any).getNavToken() : ''}` }
    });
    if (Array.isArray(res.data)) {
      cases.value = res.data;
      
      // Build notifications from case audit logs
      for (const caseItem of res.data) {
        if (caseItem.auditLog && Array.isArray(caseItem.auditLog)) {
          const recentLogs = caseItem.auditLog.slice(0, 5);
          for (const log of recentLogs) {
            const logDate = new Date(log.date);
            const hoursSinceAction = (new Date().getTime() - logDate.getTime()) / (1000 * 60 * 60);
            
            if (hoursSinceAction < 24) {
              let notificationType: 'info' | 'success' | 'warning' | 'error' = 'info';
              let title = '';
              
              if (log.action?.includes('EVIDENCE_UPLOAD')) {
                notificationType = 'success';
                title = '📄 Evidence Uploaded';
              } else if (log.action?.includes('CASE_CLOSE')) {
                notificationType = 'warning';
                title = '✓ Case Closed';
              } else if (log.action?.includes('CASE_CREATE') || log.action === 'CASE_UPDATE') {
                notificationType = 'info';
                title = '📋 Case Updated';
              }
              
              if (title) {
                if ((window as any).addNavNotification) {
                  (window as any).addNavNotification(
                    title,
                    `${log.description} by ${log.performedBy?.name || 'Unknown'}`,
                    notificationType
                  );
                }
              }
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.error('Error loading cases:', err);
    casesError.value = err?.response?.data?.error || 'Failed to fetch cases';
  } finally {
    loadingCases.value = false;
  }
}

// Case management functions
function openCaseDetails(caseItem: CaseItem) {
  selectedCase.value = caseItem;
  showCaseDetails.value = true;
  evidenceFile.value = null;
  evidenceType.value = '';
}

function closeCaseDetails() {
  showCaseDetails.value = false;
  selectedCase.value = null;
  evidenceFile.value = null;
  evidenceType.value = '';
}

function handleEvidenceFile(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  evidenceFile.value = files && files.length ? files[0] : null;
}

function submitEvidence() {
  if (!selectedCase.value || !evidenceFile.value || !evidenceType.value) return;
  const newEvidence: EvidenceItem = {
    filename: evidenceFile.value.name,
    type: evidenceType.value,
  };
  if (!selectedCase.value.evidence) selectedCase.value.evidence = [];
  selectedCase.value.evidence.push(newEvidence);
  evidenceFile.value = null;
  evidenceType.value = '';
}

function closeCloseCaseModal() {
  showCloseCaseModal.value = false;
  closureDocFile.value = null;
  closureDocType.value = '';
}

function handleClosureDocFile(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  closureDocFile.value = files && files.length ? files[0] : null;
}

function submitClosureDoc() {
  if (!selectedCase.value || !closureDocFile.value || !closureDocType.value) return;
  const logItem: AuditLogItem = {
    filename: closureDocFile.value.name,
    type: closureDocType.value,
    date: new Date().toLocaleString(),
  };
  if (!selectedCase.value.auditLog) selectedCase.value.auditLog = [];
  selectedCase.value.auditLog.push(logItem);
  selectedCase.value.status = 'closed';
  closeCloseCaseModal();
  closeCaseDetails();
}

// Computed
const stats = computed(() => ({
  all: cases.value.length,
  open: cases.value.filter((c) => c.status === 'open').length,
  closed: cases.value.filter((c) => c.status === 'closed').length,
}));

// User search for case creation
function searchUsers() {
  const normalize = (str: string) => str && typeof str === 'string' ? str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim() : '';
  const q = normalize(userSearch.value);
  if (!q) { userResults.value = []; return; }
  userResults.value = allUsers.value
    .filter((u: any) => u.role === 'investigator')
    .filter((u: any) => {
      const uname = typeof u.name === 'string' ? normalize(u.name) : '';
      const uemail = typeof u.email === 'string' ? normalize(u.email) : '';
      return uname.includes(q) || uemail.includes(q);
    })
    .filter((u: any) => {
      const uid = u._id || u.id;
      return !newCase.value.team.some((m: any) => (m._id || m.id) === uid);
    });
}

function addTeamMember(user: any) {
  newCase.value.team.push(user);
  userResults.value = [];
  userSearch.value = '';
}

function removeTeamMember(member: any) {
  const mid = (member as any)._id || (member as any).id;
  newCase.value.team = newCase.value.team.filter((m: any) => (m._id || m.id) !== mid);
}

// Lifecycle hook
onMounted(async () => {
  updateLoggedInName();
  await fetchUsers();
  await loadCases();
  // Request central loader to fetch messages (AppNavigation will dispatch 'messages-loaded')
  if ((window as any).navLoadMessages) await (window as any).navLoadMessages();
  
  // Refresh messages every 30 seconds (delegated to AppNavigation)
  const interval = setInterval(() => {
    if ((window as any).navLoadMessages) (window as any).navLoadMessages();
  }, 30000);

  return () => clearInterval(interval);
});

// Listen for messages loaded event from AppNavigation
function handleMessagesLoaded(e: any) {
  try {
    const data = e?.detail || [];
    userMessages.value = Array.isArray(data) ? data : [];
    // compute unread count
    unreadMessageCount.value = userMessages.value.filter((m: any) => !m.read && m.recipientId === currentUserId.value).length;
  } catch (err) {
    console.error('Error handling messages-loaded event', err);
  }
}

function handleOpenDashboardMessages() {
  router.push('/messages');
}

window.addEventListener('messages-loaded', handleMessagesLoaded as EventListener);
window.addEventListener('open-dashboard-messages', handleOpenDashboardMessages as EventListener);
window.addEventListener('open-notifications-tab', () => {
  activeTab.value = 'notifications';
  // refresh cases/notifications
  loadCases().catch(console.error);
});

// Watch for modal open to fetch users
watch(showCreateCase, (val) => {
  if (val) fetchUsers();
});

const createCaseError = ref('');
async function submitCase() {
  creatingCase.value = true;
  createCaseError.value = '';
  try {
    const payload = {
      name: newCase.value.name,
      description: newCase.value.description,
      keywords: newCase.value.keywords,
      docketNumber: newCase.value.docketNumber,
      status: newCase.value.status,
      caseType: newCase.value.caseType,
      team: [...newCase.value.team],
    };
    const res = await axios.post('/api/cases', payload);
    // Add new case to list
    cases.value.push(res.data);
    
    // Add notification
    const caseId = res.data.caseId || `Case #${res.data.number}`;
    if ((window as any).addNavNotification) {
      (window as any).addNavNotification('✨ New Case Created', `"${newCase.value.name}" has been successfully created`, 'success');
    }
    
    // Reset form
    newCase.value.name = '';
    newCase.value.description = '';
    newCase.value.keywords = '';
    newCase.value.docketNumber = '';
    newCase.value.caseType = '';
    newCase.value.team = [];
    newCase.value.status = 'open';
    showCreateCase.value = false;
  } catch (err: any) {
    createCaseError.value = err?.response?.data?.error || 'Failed to create case';
  } finally {
    creatingCase.value = false;
  }
}

function goToArchives() {
  router.push('/archives');
}
// Profile/settings navigation delegated to AppNavigation (window.navGoToProfile / window.navGoToSettings)
function viewAllCases() { caseFilter.value = 'all'; }
function viewOpenCases() { caseFilter.value = 'open'; }
function viewClosedCases() { caseFilter.value = 'closed'; }

// Messaging functions
// Message loading delegated to AppNavigation (window.navLoadMessages)

function openNewMessageComposer() {
  selectedConversation.value = null;
  messageRecipient.value = null;
  messagingUserSearch.value = '';
  messagingSearchResults.value = [];
  messageContent.value = '';
  messageSubject.value = '';
}

function goBackToMessageList() {
  selectedConversation.value = null;
  messageRecipient.value = null;
  messagingUserSearch.value = '';
  messagingSearchResults.value = [];
  messageContent.value = '';
  messageSubject.value = '';
  messagePriority.value = 'normal';
  messageType.value = 'general';
}

async function searchMessagingUsers() {
  if (!messagingUserSearch.value.trim()) {
    messagingSearchResults.value = [];
    return;
  }

  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/users?search=${encodeURIComponent(messagingUserSearch.value)}`, {
      headers: { 'Authorization': `Bearer ${(window as any).getNavToken ? (window as any).getNavToken() : ''}` }
    });
    const data = await response.json();
    messagingSearchResults.value = data.filter((u: any) => u._id !== currentUserId.value);
  } catch (err) {
    console.error('Error searching users:', err);
  }
}

function selectMessagingRecipient(user: any) {
  messageRecipient.value = user;
  messagingUserSearch.value = '';
  messagingSearchResults.value = [];
}

async function sendMessage() {
  if (!messageContent.value.trim()) return;

  try {
    let recipientId: string;
    let subject: string;

    if (selectedConversation.value) {
      // Reply to existing conversation
      recipientId = selectedConversation.value.senderId === currentUserId.value
        ? selectedConversation.value.recipientId
        : selectedConversation.value.senderId;
      subject = selectedConversation.value.subject.startsWith('RE:') 
        ? selectedConversation.value.subject 
        : 'RE: ' + selectedConversation.value.subject;
    } else if (messageRecipient.value && messageSubject.value.trim()) {
      // New message
      recipientId = messageRecipient.value._id || messageRecipient.value.id;
      subject = messageSubject.value.trim();
    } else {
      alert('Please select a recipient and enter a subject for new messages');
      return;
    }

    // Validate all required fields before sending
    if (!recipientId || !subject || !messageContent.value.trim()) {
      console.error('Missing fields:', { recipientId, subject, content: messageContent.value });
      alert('Error: Missing required fields');
      return;
    }

    const payload = {
      recipientId,
      subject,
      content: messageContent.value.trim(),
      type: messageType.value,
      priority: messagePriority.value,
      parentMessageId: selectedConversation.value?._id
    };
    
    console.log('Sending message with payload:', payload);

    const response = await fetch(`${API_CONFIG.endpoints.messages}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(window as any).getNavToken ? (window as any).getNavToken() : ''}`
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    if (!response.ok) {
      console.error('Error sending message:', responseData);
      alert('Failed to send message: ' + (responseData.error || 'Unknown error'));
      return;
    }

    console.log('Message sent successfully');
    messageContent.value = '';
    messageSubject.value = '';
    messageType.value = 'general';
    messagePriority.value = 'normal';
    if ((window as any).navLoadMessages) await (window as any).navLoadMessages();
    selectedConversation.value = null;
    messageRecipient.value = null;
  } catch (err) {
    console.error('Error sending message:', err);
  }
}

function selectConversation(msg: Message) {
  selectedConversation.value = msg;
  // Mark as read
  fetch(`${API_CONFIG.baseURL}/api/messages/${msg._id}/read`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${(window as any).getNavToken ? (window as any).getNavToken() : ''}` }
  }).catch(console.error);
}
</script>

<style scoped>
.dashboard-card {
  min-height: 160px;
  margin-bottom: 1rem;
  cursor: pointer;
}
.clickable:hover {
  box-shadow: 0 0 0 2px #1F7D53;
  background: #f8f9fa;
}
.dashboard-tabs .nav-link {
  font-size: 1.1rem;
  font-weight: 500;
  color: #2563eb;
  border: none;
  background: none;
  border-radius: 0.7em 0.7em 0 0;
  margin-right: 0.5em;
  transition: background 0.15s, color 0.15s;
}
.dashboard-tabs .nav-link.active, .dashboard-tabs .nav-link:hover {
  background: #e0e7ff;
  color: #1d4ed8;
}
.btn-archives {
  background: linear-gradient(90deg, #e0e7ff 0%, #f3f4f6 100%);
  color: #2563eb;
  font-weight: 500;
  border: none;
  border-radius: 0.7em;
  padding: 0.6em 1.5em;
  box-shadow: 0 2px 8px 0 rgba(31,125,83,0.07);
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}
.btn-archives:hover {
  background: #c7d2fe;
  color: #1d4ed8;
  box-shadow: 0 4px 16px 0 rgba(31,125,83,0.13);
}
/* Statistics Cards Styling */
.stat-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 12px 0 rgba(31,125,83,0.08);
  padding: 1.5rem 2rem;
  transition: box-shadow 0.2s, transform 0.2s;
  cursor: pointer;
  border: none;
}
.stat-card:hover {
  box-shadow: 0 4px 24px 0 rgba(31,125,83,0.16);
  transform: translateY(-2px) scale(1.02);
}
.stat-icon {
  font-size: 2.5rem;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
}
.stat-all .stat-icon {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #3b82f6;
}
.stat-open .stat-icon {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #10b981;
}
.stat-closed .stat-icon {
  background: linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%);
  color: #6b7280;
}
.stat-label {
  font-size: 1.1rem;
  color: #6b7280;
  font-weight: 500;
}
.stat-value {
  font-size: 2.2rem;
  font-weight: 700;
  color: #1f2937;
}
.container.py-5 {
  background: linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%);
  min-height: 100vh;
  border-radius: 1.5rem;
  box-shadow: 0 2px 24px 0 rgba(31,125,83,0.06);
  padding-bottom: 3rem !important;
}
.welcome-section {
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 12px 0 rgba(31,125,83,0.08);
  padding: 1.5rem 2rem;
  margin-bottom: 2.5rem;
}
.dashboard-card {
  min-height: 160px;
  margin-bottom: 1rem;
  cursor: pointer;
}
.clickable:hover {
  box-shadow: 0 0 0 2px #1F7D53;
  background: #f8f9fa;
}
.dashboard-tabs .nav-link {
  font-size: 1.1rem;
  font-weight: 500;
  color: #2563eb;
  border: none;
  background: none;
  border-radius: 0.7em 0.7em 0 0;
  margin-right: 0.5em;
  transition: background 0.15s, color 0.15s;
}
.dashboard-tabs .nav-link.active, .dashboard-tabs .nav-link:hover {
  background: #e0e7ff;
  color: #1d4ed8;
}
.btn-archives {
  background: linear-gradient(90deg, #e0e7ff 0%, #f3f4f6 100%);
  color: #2563eb;
  font-weight: 500;
  border: none;
  border-radius: 0.7em;
  padding: 0.6em 1.5em;
  box-shadow: 0 2px 8px 0 rgba(31,125,83,0.07);
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}
.btn-archives:hover {
  background: #c7d2fe;
  color: #1d4ed8;
  box-shadow: 0 4px 16px 0 rgba(31,125,83,0.13);
}
/* Statistics Cards Styling */
.stat-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 12px 0 rgba(31,125,83,0.08);
  padding: 1.5rem 2rem;
  transition: box-shadow 0.2s, transform 0.2s;
  cursor: pointer;
  border: none;
}
.stat-card:hover {
  box-shadow: 0 4px 24px 0 rgba(31,125,83,0.16);
  transform: translateY(-2px) scale(1.02);
}
.stat-icon {
  font-size: 2.5rem;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
}
.stat-all .stat-icon {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #3b82f6;
}
.stat-open .stat-icon {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #10b981;
}
.stat-closed .stat-icon {
  background: linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%);
  color: #6b7280;
}
.stat-label {
  font-size: 1.1rem;
  color: #6b7280;
  font-weight: 500;
}
.stat-value {
  font-size: 2.2rem;
  font-weight: 700;
  color: #1f2937;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .d-flex.justify-content-between {
    flex-direction: column;
    gap: 1rem;
  }

  .d-flex.justify-content-between > div {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .btn {
    flex: 1;
    min-width: 120px;
    font-size: 0.9rem;
    padding: 0.5rem 0.75rem;
  }

  .btn-outline-primary,
  .btn-outline-secondary,
  .btn-outline-danger,
  .btn-archives {
    font-size: 0.85rem;
    padding: 0.5rem 0.75rem;
  }

  .dashboard-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .dashboard-tabs .nav-link {
    font-size: 0.95rem;
    padding: 0.5rem 1rem;
    white-space: nowrap;
  }

  .stat-card {
    padding: 1rem;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 1.8rem;
    margin-right: 0;
  }

  .stat-label {
    font-size: 0.9rem;
  }

  .stat-value {
    font-size: 1.8rem;
  }

  .welcome-section {
    flex-direction: column;
    text-align: center;
    margin-bottom: 2rem;
  }

  .welcome-section img {
    margin-right: 0 !important;
    margin-bottom: 1rem;
  }

  .welcome-section h2 {
    font-size: 1.5rem;
  }

  .modal-dialog {
    margin: 0.5rem;
  }

  .modal-dialog.modal-lg {
    max-width: 95vw;
  }

  .form-control,
  .form-select,
  textarea {
    font-size: 16px;
  }

  .row.g-3 {
    row-gap: 1rem;
  }

  .col-md-4,
  .col-md-8,
  .col-md-12 {
    flex: 0 0 100%;
  }

  .list-group-item {
    flex-wrap: wrap;
  }

  .badge {
    margin-top: 0.25rem;
  }

  .table-responsive {
    font-size: 0.85rem;
  }

  .table th,
  .table td {
    padding: 0.5rem;
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .btn {
    font-size: 0.8rem;
    padding: 0.4rem 0.6rem;
  }

  h2 {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.8rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .dashboard-tabs .nav-link {
    font-size: 0.8rem;
    padding: 0.5rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .form-label {
    font-size: 0.9rem;
  }

  .card-title {
    font-size: 1rem;
  }
}

/* Notifications Styling */
.notifications-section {
  margin-top: 1rem;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notification-card {
  border-left: 4px solid currentColor;
  border-radius: 0.5rem;
  animation: slideIn 0.3s ease-out;
}

.notification-card.alert-info {
  border-left-color: #0dcaf0;
}

.notification-card.alert-success {
  border-left-color: #198754;
}

.notification-card.alert-warning {
  border-left-color: #ffc107;
}

.notification-card.alert-danger {
  border-left-color: #dc3545;
}

.notification-title {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.notification-message {
  font-size: 0.95rem;
  color: #495057;
}

.notification-meta {
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.notification-case {
  display: inline-block;
}

.notification-case .badge {
  font-size: 0.8rem;
  padding: 0.35em 0.6em;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 480px) {
  .notification-card {
    font-size: 0.9rem;
  }

  .notification-title {
    font-size: 0.95rem;
  }

  .notification-message {
    font-size: 0.85rem;
  }

  .notification-meta {
    font-size: 0.75rem;
  }
}
</style>
