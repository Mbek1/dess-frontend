<template>
  <main class="messages-page">
    <header class="messages-heading">
      <div>
        <p class="messages-eyebrow"><i class="bi bi-shield-lock-fill" aria-hidden="true"></i> INTERNAL / ENCRYPTED IN TRANSIT</p>
        <h1>Messages</h1>
        <p>Secure, case-aware communication between authorized DESS users.</p>
      </div>
      <div class="heading-actions">
        <span class="connection-status"><i class="bi bi-circle-fill" aria-hidden="true"></i> Private workspace</span>
        <button class="compose-button" type="button" @click="startCompose">
          <i class="bi bi-pencil-square" aria-hidden="true"></i> New message
        </button>
      </div>
    </header>

    <section class="message-workspace" aria-label="Internal messages workspace">
      <aside class="message-sidebar" :class="{ 'mobile-hidden': mobileThreadOpen }">
        <div class="sidebar-top">
          <label class="message-search" for="conversation-search">
            <i class="bi bi-search" aria-hidden="true"></i>
            <input id="conversation-search" v-model="conversationSearch" type="search" placeholder="Search people or subjects" />
            <kbd>/</kbd>
          </label>
          <div class="folder-tabs" role="tablist" aria-label="Message folders">
            <button v-for="folder in folders" :key="folder.value" type="button" role="tab" :aria-selected="activeFolder === folder.value" :class="{ active: activeFolder === folder.value }" @click="setFolder(folder.value)">
              {{ folder.label }}<span v-if="folder.value === 'inbox' && unreadTotal" class="folder-count">{{ unreadTotal }}</span>
            </button>
            <button v-if="currentUserRole === 'investigator'" type="button" role="tab" :aria-selected="activeFolder === 'case-chats'" :class="{ active: activeFolder === 'case-chats' }" @click="setFolder('case-chats')">
              Case rooms<span v-if="unreadCaseChatTotal" class="folder-count">{{ unreadCaseChatTotal }}</span>
            </button>
          </div>
        </div>

        <div class="conversation-list" aria-live="polite">
          <div v-if="loadingList" class="list-state"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Loading messages</div>
          <div v-else-if="listError" class="list-state list-error" role="alert">{{ listError }}</div>
          <template v-else-if="activeFolder === 'case-chats'">
            <div v-if="filteredCaseChats.length === 0" class="list-state empty-list">
              <i class="bi bi-people" aria-hidden="true"></i><strong>No case rooms available</strong><span>Case rooms include investigators assigned to each case.</span>
            </div>
            <button v-for="chat in filteredCaseChats" :key="chat._id" class="conversation-row" :class="{ selected: activeCaseChat?._id === chat._id }" type="button" @click="openCaseChat(chat)">
              <span class="room-avatar"><i class="bi bi-people-fill" aria-hidden="true"></i></span>
              <span class="conversation-copy">
                <span class="conversation-meta"><strong>{{ chat.caseNumber }}</strong><time>{{ formatTime(chat.lastMessageAt) }}</time></span>
                <span class="conversation-subject">{{ chat.title }}</span>
                <span class="conversation-preview">{{ chat.lastMessage || 'Case room created' }}</span>
                <span class="conversation-tags"><span class="case-tag"><i class="bi bi-people" aria-hidden="true"></i> {{ chat.participants.length }} investigators</span></span>
              </span>
              <span v-if="chat.unreadCount" class="unread-dot" :aria-label="`${chat.unreadCount} unread`"></span>
            </button>
          </template>
          <template v-else>
          <div v-if="filteredConversations.length === 0" class="list-state empty-list">
            <i class="bi bi-inbox" aria-hidden="true"></i>
            <strong>{{ conversationSearch ? 'No matching messages' : 'No messages here yet' }}</strong>
            <span>{{ activeFolder === 'inbox' ? 'Start an internal conversation when you need to coordinate.' : 'Messages will appear in this folder.' }}</span>
          </div>
          <button v-for="conversation in filteredConversations" :key="conversation.conversationId" class="conversation-row" :class="{ selected: activeConversationId === conversation.conversationId }" type="button" @click="openConversation(conversation)">
            <span class="person-avatar">{{ initials(conversation.partner.name) }}</span>
            <span class="conversation-copy">
              <span class="conversation-meta"><strong>{{ conversation.partner.name }}</strong><time>{{ formatTime(conversation.latest.createdAt) }}</time></span>
              <span class="conversation-subject">{{ conversation.latest.subject }}</span>
              <span class="conversation-preview">{{ conversation.latest.senderId === currentUserId ? 'You: ' : '' }}{{ conversation.latest.content }}</span>
              <span class="conversation-tags">
                <span v-if="conversation.latest.caseNumber" class="case-tag"><i class="bi bi-folder2-open" aria-hidden="true"></i> {{ conversation.latest.caseNumber }}</span>
                <span v-if="conversation.latest.priority === 'urgent'" class="priority-tag">Urgent</span>
                <span v-else-if="conversation.latest.priority === 'high'" class="priority-tag priority-high">High</span>
              </span>
            </span>
            <span v-if="conversation.unread > 0" class="unread-dot" :aria-label="`${conversation.unread} unread`"></span>
          </button>
          </template>
        </div>
        <div class="sidebar-foot"><i class="bi bi-shield-check" aria-hidden="true"></i> Only you and the other participant can access these messages.</div>
      </aside>

      <section class="message-thread" :class="{ 'mobile-hidden': !mobileThreadOpen }">
        <div v-if="pageError" class="page-alert" role="alert"><i class="bi bi-exclamation-circle" aria-hidden="true"></i>{{ pageError }}</div>
        <div v-if="notice" class="page-notice" role="status"><i class="bi bi-check-circle" aria-hidden="true"></i>{{ notice }}</div>

        <template v-if="composeMode">
          <header class="thread-header">
            <button class="mobile-back" type="button" aria-label="Back to messages" @click="mobileThreadOpen = false"><i class="bi bi-arrow-left" aria-hidden="true"></i></button>
            <div class="thread-mark"><i class="bi bi-pencil-square" aria-hidden="true"></i></div>
            <div class="thread-heading-copy"><h2>Compose message</h2><p>Internal communication · visible to selected recipient</p></div>
            <button class="icon-action" type="button" title="Close compose" aria-label="Close compose" @click="cancelCompose"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
          </header>
          <div class="compose-body">
            <label class="compose-field" for="recipient-search">
              <span>To</span>
              <div class="recipient-input-wrap">
                <input id="recipient-search" v-model="recipientSearch" type="search" autocomplete="off" placeholder="Find an authorized DESS user" :disabled="Boolean(recipient)" @input="searchRecipients" />
                <button v-if="recipient" type="button" class="clear-recipient" aria-label="Change recipient" @click="clearRecipient"><i class="bi bi-x-circle" aria-hidden="true"></i></button>
              </div>
            </label>
            <div v-if="recipient" class="selected-recipient">
              <span class="person-avatar">{{ initials(recipient.name) }}</span>
              <span><strong>{{ recipient.name }}</strong><small>{{ recipient.email }} · {{ capitalize(recipient.role) }}</small></span>
              <span class="verified-recipient"><i class="bi bi-shield-check" aria-hidden="true"></i> DESS user</span>
            </div>
            <div v-if="recipientLoading" class="recipient-results">Searching directory...</div>
            <div v-else-if="recipientSearch.trim() && !recipient && recipients.length === 0" class="recipient-results">No matching users.</div>
            <div v-else-if="recipients.length" class="recipient-results">
              <button v-for="user in recipients" :key="user._id" type="button" class="recipient-option" @click="selectRecipient(user)">
                <span class="person-avatar">{{ initials(user.name) }}</span>
                <span><strong>{{ user.name }}</strong><small>{{ user.email }} · {{ capitalize(user.role) }}</small></span>
                <i class="bi bi-arrow-up-left" aria-hidden="true"></i>
              </button>
            </div>

            <label class="compose-field" for="message-subject"><span>Subject</span><input id="message-subject" v-model.trim="subject" maxlength="180" placeholder="Add a clear subject" /></label>
            <div class="compose-meta-row">
              <label class="compose-field" for="message-type"><span>Category</span><select id="message-type" v-model="messageType"><option value="general">General</option><option value="case-related">Case related</option><option value="follow-up">Follow-up</option><option value="urgent">Urgent</option></select></label>
              <label class="compose-field" for="message-priority"><span>Priority</span><select id="message-priority" v-model="priority"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
            </div>
            <div v-if="caseContext" class="case-context"><i class="bi bi-folder2-open" aria-hidden="true"></i><span>Linked case <strong>{{ caseContext.caseNumber }}</strong></span><button type="button" aria-label="Remove case link" @click="caseContext = null"><i class="bi bi-x-lg" aria-hidden="true"></i></button></div>
            <label class="compose-field body-field" for="message-body"><span>Message</span><textarea id="message-body" v-model="body" maxlength="20000" rows="8" placeholder="Write a concise, professional message. Avoid including credentials or sensitive personal data."></textarea></label>
            <div class="compose-footer"><span>{{ body.length }}/20,000 characters · Do not include passwords or authentication codes.</span><button class="send-button" type="button" :disabled="sending || !recipient || !subject.trim() || !body.trim()" @click="sendMessage()"><i class="bi bi-send-fill" aria-hidden="true"></i>{{ sending ? 'Sending...' : 'Send message' }}</button></div>
          </div>
        </template>

        <template v-else-if="activeCaseChat">
          <header class="thread-header">
            <button class="mobile-back" type="button" aria-label="Back to messages" @click="mobileThreadOpen = false"><i class="bi bi-arrow-left" aria-hidden="true"></i></button>
            <span class="room-avatar thread-avatar"><i class="bi bi-people-fill" aria-hidden="true"></i></span>
            <div class="thread-heading-copy"><h2>{{ activeCaseChat.title }}</h2><p>{{ activeCaseChat.caseNumber }} · {{ activeCaseChat.participants.length }} assigned investigators</p></div>
            <span class="case-tag"><i class="bi bi-shield-lock" aria-hidden="true"></i> Case team only</span>
          </header>
          <div ref="threadScroll" class="thread-scroll">
            <div v-if="loadingThread" class="thread-state"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Loading case room</div>
            <div v-else-if="caseChatMessages.length === 0" class="thread-state">No messages yet. Start the case conversation with the assigned team.</div>
            <div v-else class="thread-message-list">
              <div class="thread-day"><span>Case team conversation</span></div>
              <article v-for="message in caseChatMessages" :key="message._id" class="message-entry" :class="{ 'message-outgoing': message.senderId === currentUserId }">
                <div class="entry-byline"><strong>{{ message.senderId === currentUserId ? 'You' : message.senderName }}</strong><span class="case-team-role">{{ capitalize(message.senderRole) }}</span><time>{{ formatDateTime(message.createdAt) }}</time></div>
                <div class="entry-bubble"><p>{{ message.content }}</p><div class="entry-meta"><span>{{ message.readBy?.length || 0 }} read</span><span>{{ activeCaseChat.caseNumber }}</span></div></div>
              </article>
            </div>
          </div>
          <form class="reply-composer" @submit.prevent="sendCaseChatMessage">
            <label class="visually-hidden" for="case-chat-body">Message the case team</label>
            <textarea id="case-chat-body" v-model="replyBody" rows="2" maxlength="10000" placeholder="Message the assigned case team..." :disabled="sending"></textarea>
            <div class="reply-footer"><span>Visible to assigned investigators only · {{ replyBody.length }}/10,000</span><button class="send-button" type="submit" :disabled="sending || !replyBody.trim()"><i class="bi bi-send-fill" aria-hidden="true"></i>{{ sending ? 'Sending...' : 'Send to case team' }}</button></div>
          </form>
        </template>

        <template v-else-if="activeConversationId">
          <header class="thread-header">
            <button class="mobile-back" type="button" aria-label="Back to messages" @click="mobileThreadOpen = false"><i class="bi bi-arrow-left" aria-hidden="true"></i></button>
            <span class="person-avatar thread-avatar">{{ initials(activePartner?.name) }}</span>
            <div class="thread-heading-copy"><h2>{{ activePartner?.name || 'Conversation' }}</h2><p>{{ activePartner?.email }}<span v-if="activePartner?.role"> · {{ capitalize(activePartner.role) }}</span></p></div>
            <div class="thread-actions">
              <span v-if="activeConversationMessages[0]?.caseNumber" class="case-tag"><i class="bi bi-folder2-open" aria-hidden="true"></i> {{ activeConversationMessages[0].caseNumber }}</span>
              <button class="icon-action" type="button" title="Archive conversation" aria-label="Archive conversation" @click="archiveConversation"><i class="bi bi-archive" aria-hidden="true"></i></button>
              <button class="icon-action danger-action" type="button" title="Delete conversation for me" aria-label="Delete conversation for me" @click="deleteConversation"><i class="bi bi-trash3" aria-hidden="true"></i></button>
            </div>
          </header>
          <div ref="threadScroll" class="thread-scroll">
            <div v-if="loadingThread" class="thread-state"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Loading conversation</div>
            <div v-else-if="activeConversationMessages.length === 0" class="thread-state">No messages in this conversation.</div>
            <div v-else class="thread-message-list">
              <div class="thread-day"><span>Conversation history</span></div>
              <article v-for="message in activeConversationMessages" :key="message._id" class="message-entry" :class="{ 'message-outgoing': message.senderId === currentUserId }">
                <div class="entry-byline"><strong>{{ message.senderId === currentUserId ? 'You' : message.senderName }}</strong><time>{{ formatDateTime(message.createdAt) }}</time><span v-if="message.status === 'read' && message.senderId === currentUserId" class="read-receipt"><i class="bi bi-check2-all" aria-hidden="true"></i> Read</span></div>
                <div class="entry-bubble">
                  <div class="entry-topic"><strong>{{ message.subject }}</strong><span v-if="message.priority !== 'normal'" class="priority-tag" :class="{ 'priority-high': message.priority === 'high' }">{{ capitalize(message.priority) }} priority</span></div>
                  <p>{{ message.content }}</p>
                  <div class="entry-meta"><span>{{ categoryLabel(message.type) }}</span><span v-if="message.caseNumber">Case {{ message.caseNumber }}</span></div>
                </div>
              </article>
            </div>
          </div>
          <form class="reply-composer" @submit.prevent="sendReply">
            <label class="visually-hidden" for="reply-body">Reply message</label>
            <textarea id="reply-body" v-model="replyBody" rows="2" maxlength="20000" placeholder="Write a reply..." :disabled="sending"></textarea>
            <div class="reply-footer"><span>Internal message · {{ replyBody.length }}/20,000</span><button class="send-button" type="submit" :disabled="sending || !replyBody.trim()"><i class="bi bi-send-fill" aria-hidden="true"></i>{{ sending ? 'Sending...' : 'Reply' }}</button></div>
          </form>
        </template>

        <div v-else class="welcome-state">
          <div class="welcome-icon"><i class="bi bi-envelope-paper" aria-hidden="true"></i></div>
          <p class="messages-eyebrow">DESS INTERNAL COMMUNICATION</p>
          <h2>Keep case communication in context.</h2>
          <p>Choose a conversation to review its history or start a new message with an authorized colleague.</p>
          <button class="compose-button" type="button" @click="startCompose"><i class="bi bi-pencil-square" aria-hidden="true"></i> Compose a message</button>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { API_CONFIG } from '@/config';

interface MessageRecord {
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
  caseId?: string;
  caseNumber?: string;
  createdAt: string;
}
interface DirectoryUser { _id: string; name: string; email: string; role: string; organizationName?: string; organizationRole?: string }
interface Conversation { conversationId: string; latest: MessageRecord; messages: MessageRecord[]; unread: number; partner: DirectoryUser }
interface CaseChatRecord {
  _id: string;
  caseId: string;
  caseNumber: string;
  title: string;
  participants: DirectoryUser[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}
interface CaseChatMessageRecord {
  _id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  readBy: { userId: string; readAt: string }[];
  createdAt: string;
}
type Folder = 'inbox' | 'sent' | 'archived';

const route = useRoute();
const router = useRouter();
const currentUserId = ref('');
const currentUserRole = ref('');
const messages = ref<MessageRecord[]>([]);
const caseChats = ref<CaseChatRecord[]>([]);
const unreadTotal = ref(0);
const activeFolder = ref<Folder | 'case-chats'>('inbox');
const activeConversationId = ref('');
const activeCaseChat = ref<CaseChatRecord | null>(null);
const activeConversationMessages = ref<MessageRecord[]>([]);
const caseChatMessages = ref<CaseChatMessageRecord[]>([]);
const activePartner = ref<DirectoryUser | null>(null);
const conversationSearch = ref('');
const loadingList = ref(true);
const loadingThread = ref(false);
const sending = ref(false);
const listError = ref('');
const pageError = ref('');
const notice = ref('');
const mobileThreadOpen = ref(false);
const composeMode = ref(false);
const recipient = ref<DirectoryUser | null>(null);
const recipientSearch = ref('');
const recipients = ref<DirectoryUser[]>([]);
const recipientLoading = ref(false);
const subject = ref('');
const body = ref('');
const replyBody = ref('');
const messageType = ref<MessageRecord['type']>('general');
const priority = ref<MessageRecord['priority']>('normal');
const caseContext = ref<{ caseNumber?: string } | null>(null);
const threadScroll = ref<HTMLElement | null>(null);
let recipientSearchTimer: ReturnType<typeof setTimeout> | undefined;

const folders: { value: Folder; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'sent', label: 'Sent' },
  { value: 'archived', label: 'Archive' }
];

function getToken() { return sessionStorage.getItem('dess_token') || ''; }
function authHeaders() { return { Authorization: `Bearer ${getToken()}` }; }
function initials(name?: string) { return (name || 'DESS').split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase(); }
function capitalize(value?: string) { return value ? value[0].toUpperCase() + value.slice(1) : ''; }
function formatTime(value: string) { return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function formatDateTime(value: string) { return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function categoryLabel(value: string) { return ({ 'case-related': 'Case related', general: 'General', urgent: 'Urgent', 'follow-up': 'Follow-up' } as Record<string, string>)[value] || 'General'; }

const conversations = computed<Conversation[]>(() => {
  const groups = new Map<string, MessageRecord[]>();
  for (const message of messages.value) {
    const group = groups.get(message.conversationId) || [];
    group.push(message);
    groups.set(message.conversationId, group);
  }
  return [...groups.entries()].map(([conversationId, group]) => {
    const sorted = [...group].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latest = sorted[0];
    const isSender = latest.senderId === currentUserId.value;
    return {
      conversationId,
      latest,
      messages: sorted,
      unread: group.filter(message => message.recipientId === currentUserId.value && !message.read).length,
      partner: {
        _id: isSender ? latest.recipientId : latest.senderId,
        name: isSender ? latest.recipientName : latest.senderName,
        email: isSender ? latest.recipientEmail : latest.senderEmail,
        role: isSender ? latest.recipientRole : latest.senderRole
      }
    };
  }).sort((a, b) => new Date(b.latest.createdAt).getTime() - new Date(a.latest.createdAt).getTime());
});
const filteredConversations = computed(() => {
  const query = conversationSearch.value.trim().toLowerCase();
  if (!query) return conversations.value;
  return conversations.value.filter(conversation => [conversation.partner.name, conversation.partner.email, conversation.latest.subject, conversation.latest.content, conversation.latest.caseNumber].some(value => value?.toLowerCase().includes(query)));
});
const filteredCaseChats = computed(() => {
  const query = conversationSearch.value.trim().toLowerCase();
  if (!query) return caseChats.value;
  return caseChats.value.filter(chat => [chat.caseNumber, chat.title, chat.lastMessage, ...chat.participants.map(participant => participant.name)].some(value => value?.toLowerCase().includes(query)));
});
const unreadCaseChatTotal = computed(() => caseChats.value.reduce((sum, chat) => sum + chat.unreadCount, 0));

async function loadMessages() {
  loadingList.value = true;
  listError.value = '';
  try {
    const response = await axios.get(`${API_CONFIG.endpoints.messages}?view=${activeFolder.value}`, { headers: authHeaders() });
    messages.value = response.data;
    const unreadResponse = await axios.get(`${API_CONFIG.endpoints.messages}/unread-count`, { headers: authHeaders() });
    unreadTotal.value = unreadResponse.data.unreadCount;
  } catch (error: any) {
    listError.value = error?.response?.data?.error || 'Could not load messages.';
  } finally {
    loadingList.value = false;
  }
}

async function loadCaseChats() {
  loadingList.value = true;
  listError.value = '';
  try {
    const response = await axios.get(`${API_CONFIG.endpoints.messages}/case-chats`, { headers: authHeaders() });
    caseChats.value = response.data;
  } catch (error: any) {
    listError.value = error?.response?.data?.error || 'Could not load case rooms.';
  } finally {
    loadingList.value = false;
  }
}

async function setFolder(folder: Folder | 'case-chats') {
  activeFolder.value = folder;
  activeConversationId.value = '';
  activeCaseChat.value = null;
  activeConversationMessages.value = [];
  caseChatMessages.value = [];
  activePartner.value = null;
  composeMode.value = false;
  mobileThreadOpen.value = false;
  if (folder === 'case-chats') await loadCaseChats();
  else await loadMessages();
}

async function openConversation(conversation: Conversation) {
  activeConversationId.value = conversation.conversationId;
  activeCaseChat.value = null;
  caseChatMessages.value = [];
  activePartner.value = conversation.partner;
  composeMode.value = false;
  mobileThreadOpen.value = true;
  loadingThread.value = true;
  pageError.value = '';
  try {
    const response = await axios.get(`${API_CONFIG.endpoints.messages}/conversation/${conversation.partner._id}`, { headers: authHeaders() });
    activeConversationMessages.value = response.data;
    const incomingUnread = response.data.filter((message: MessageRecord) => message.recipientId === currentUserId.value && !message.read);
    await Promise.all(incomingUnread.map((message: MessageRecord) => axios.patch(`${API_CONFIG.endpoints.messages}/${message._id}/read`, {}, { headers: authHeaders() })));
    if (incomingUnread.length) {
      activeConversationMessages.value = activeConversationMessages.value.map(message => message.recipientId === currentUserId.value ? { ...message, read: true, status: 'read' } : message);
      await loadMessages();
    }
    await scrollThreadToBottom();
  } catch (error: any) {
    pageError.value = error?.response?.data?.error || 'Could not open this conversation.';
  } finally {
    loadingThread.value = false;
  }
}

async function openCaseChat(chat: CaseChatRecord) {
  activeCaseChat.value = chat;
  activeConversationId.value = '';
  activePartner.value = null;
  composeMode.value = false;
  mobileThreadOpen.value = true;
  loadingThread.value = true;
  pageError.value = '';
  try {
    const response = await axios.get(`${API_CONFIG.endpoints.messages}/case-chats/${chat.caseId}/messages`, { headers: authHeaders() });
    caseChatMessages.value = response.data.messages;
    await loadCaseChats();
    await scrollThreadToBottom();
  } catch (error: any) {
    pageError.value = error?.response?.data?.error || 'Could not open this case room.';
  } finally {
    loadingThread.value = false;
  }
}

function startCompose() {
  composeMode.value = true;
  activeConversationId.value = '';
  activeCaseChat.value = null;
  caseChatMessages.value = [];
  activeConversationMessages.value = [];
  activePartner.value = null;
  mobileThreadOpen.value = true;
  recipient.value = null;
  recipientSearch.value = '';
  recipients.value = [];
  subject.value = '';
  body.value = '';
  messageType.value = 'general';
  priority.value = 'normal';
  pageError.value = '';
  caseContext.value = null;
}

function cancelCompose() {
  composeMode.value = false;
  recipient.value = null;
  subject.value = '';
  body.value = '';
  mobileThreadOpen.value = false;
  void router.replace({ path: '/messages', query: {} });
}

async function applyRouteContext() {
  const recipientId = typeof route.query.recipient === 'string' ? route.query.recipient : '';
  const caseNumber = typeof route.query.caseNumber === 'string' ? route.query.caseNumber : '';
  if (recipientId) {
    startCompose();
    recipientLoading.value = true;
    try {
      const response = await axios.get(`${API_CONFIG.endpoints.users}?userId=${encodeURIComponent(recipientId)}`, { headers: authHeaders() });
      recipient.value = response.data[0] || null;
      if (!recipient.value) pageError.value = 'The selected recipient is not available.';
      caseContext.value = caseNumber ? { caseNumber } : null;
    } catch (error: any) {
      pageError.value = error?.response?.data?.error || 'Could not load the selected recipient.';
    } finally {
      recipientLoading.value = false;
    }
  }
}

function clearRecipient() { recipient.value = null; recipientSearch.value = ''; recipients.value = []; }
function selectRecipient(user: DirectoryUser) { recipient.value = user; recipients.value = []; recipientSearch.value = ''; }

function searchRecipients() {
  if (recipientSearchTimer) clearTimeout(recipientSearchTimer);
  const query = recipientSearch.value.trim();
  if (query.length < 2) { recipients.value = []; return; }
  recipientSearchTimer = setTimeout(async () => {
    recipientLoading.value = true;
    try {
      const response = await axios.get(`${API_CONFIG.endpoints.users}?search=${encodeURIComponent(query)}`, { headers: authHeaders() });
      recipients.value = response.data.filter((user: DirectoryUser) => user._id !== currentUserId.value);
    } catch (error: any) {
      pageError.value = error?.response?.data?.error || 'Could not search the directory.';
    } finally {
      recipientLoading.value = false;
    }
  }, 250);
}

async function sendMessage(parentMessageId?: string) {
  if (!recipient.value || !subject.value.trim() || !body.value.trim()) return;
  sending.value = true;
  pageError.value = '';
  notice.value = '';
  try {
    const response = await axios.post(API_CONFIG.endpoints.messages, {
      recipientId: recipient.value._id,
      subject: subject.value.trim(),
      content: body.value.trim(),
      type: messageType.value,
      priority: priority.value,
      ...(parentMessageId ? { parentMessageId } : {}),
      ...(caseContext.value?.caseNumber ? { caseNumber: caseContext.value.caseNumber } : {})
    }, { headers: authHeaders() });
    const sentMessage = response.data;
    composeMode.value = false;
    replyBody.value = '';
    body.value = '';
    await loadMessages();
    await router.replace({ path: '/messages', query: {} });
    const conversation = conversations.value.find(item => item.conversationId === sentMessage.conversationId);
    if (conversation) await openConversation(conversation);
    notice.value = 'Message sent securely.';
  } catch (error: any) {
    pageError.value = error?.response?.data?.error || 'Could not send this message.';
  } finally {
    sending.value = false;
  }
}

async function sendReply() {
  if (!activePartner.value || !activeConversationMessages.value.length) return;
  const latest = activeConversationMessages.value[activeConversationMessages.value.length - 1];
  recipient.value = activePartner.value;
  subject.value = latest.subject;
  body.value = replyBody.value;
  messageType.value = latest.type;
  priority.value = latest.priority;
  await sendMessage(latest._id);
}

async function sendCaseChatMessage() {
  if (!activeCaseChat.value || !replyBody.value.trim()) return;
  sending.value = true;
  pageError.value = '';
  try {
    const response = await axios.post(
      `${API_CONFIG.endpoints.messages}/case-chats/${activeCaseChat.value.caseId}/messages`,
      { content: replyBody.value.trim() },
      { headers: authHeaders() }
    );
    caseChatMessages.value.push(response.data);
    activeCaseChat.value.lastMessage = response.data.content;
    activeCaseChat.value.lastMessageAt = response.data.createdAt;
    replyBody.value = '';
    await loadCaseChats();
    await scrollThreadToBottom();
  } catch (error: any) {
    pageError.value = error?.response?.data?.error || 'Could not send this case-room message.';
  } finally {
    sending.value = false;
  }
}

async function archiveConversation() {
  if (!activePartner.value) return;
  try {
    await axios.patch(`${API_CONFIG.endpoints.messages}/conversation/${activePartner.value._id}/archive`, {}, { headers: authHeaders() });
    activeConversationId.value = '';
    activePartner.value = null;
    await loadMessages();
    notice.value = 'Conversation archived for your account.';
  } catch (error: any) {
    pageError.value = error?.response?.data?.error || 'Could not archive this conversation.';
  }
}

async function deleteConversation() {
  if (!activePartner.value || !window.confirm('Delete this conversation from your message view? This will not remove it for the other participant.')) return;
  try {
    await axios.delete(`${API_CONFIG.endpoints.messages}/conversation/${activePartner.value._id}`, { headers: authHeaders() });
    activeConversationId.value = '';
    activePartner.value = null;
    await loadMessages();
    notice.value = 'Conversation removed from your message view.';
  } catch (error: any) {
    pageError.value = error?.response?.data?.error || 'Could not delete this conversation.';
  }
}

async function scrollThreadToBottom() {
  await nextTick();
  if (threadScroll.value) threadScroll.value.scrollTop = threadScroll.value.scrollHeight;
}

function viewItem(event: KeyboardEvent) {
  if (event.key === '/' && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
    event.preventDefault();
    document.getElementById('conversation-search')?.focus();
  }
}

watch(() => [route.query.recipient, route.query.caseNumber], () => { void applyRouteContext(); });
onMounted(() => {
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  currentUserId.value = currentUser.id || '';
  currentUserRole.value = currentUser.role || '';
  void loadMessages();
  void applyRouteContext();
  window.addEventListener('keydown', viewItem);
});
onBeforeUnmount(() => {
  if (recipientSearchTimer) clearTimeout(recipientSearchTimer);
  window.removeEventListener('keydown', viewItem);
});
</script>

<style scoped>
.messages-page {
  --msg-bg: #04152d;
  --panel: #061d3a;
  --panel-2: #082345;
  --line: #123d6b;
  --main: #e7f2ff;
  --muted: #9db9d8;
  --blue: #168bff;
  --green: #06d6a0;
  display: flex;
  min-height: calc(100vh - 56px);
  flex-direction: column;
  padding: 18px clamp(12px, 2vw, 28px) 24px;
  color: var(--main);
  background-color: var(--msg-bg);
  background-image: linear-gradient(rgba(24, 93, 154, .07) 1px, transparent 1px), linear-gradient(90deg, rgba(24, 93, 154, .07) 1px, transparent 1px);
  background-size: 34px 34px;
}
.messages-heading { display: flex; width: min(1500px, 100%); align-items: flex-end; justify-content: space-between; gap: 20px; margin: 0 auto 15px; }
.messages-eyebrow { margin: 0 0 5px; color: #63b5ff; font-size: 9px; font-weight: 750; }
.messages-heading h1 { margin: 0; color: #f0f7ff; font-size: 23px; font-weight: 750; }
.messages-heading > div:first-child > p:last-child { margin: 4px 0 0; color: var(--muted); font-size: 11px; }
.heading-actions { display: flex; align-items: center; gap: 12px; }
.connection-status { display: inline-flex; align-items: center; gap: 6px; color: #a7c3dd; font-size: 10px; }
.connection-status i { color: #06d6a0; font-size: 7px; }
.compose-button,
.send-button { display: inline-flex; min-height: 36px; align-items: center; justify-content: center; gap: 7px; padding: 8px 12px; border: 1px solid #168bff; border-radius: 6px; color: white; background: #0876e1; cursor: pointer; font-size: 11px; font-weight: 700; }
.compose-button:hover,
.send-button:hover:not(:disabled) { background: #168bff; }
.send-button:disabled { opacity: .55; cursor: not-allowed; }
.message-workspace { display: grid; width: min(1500px, 100%); min-height: min(720px, calc(100vh - 150px)); flex: 1; grid-template-columns: minmax(270px, 340px) minmax(0, 1fr); overflow: hidden; margin: 0 auto; border: 1px solid var(--line); border-radius: 8px; background: rgba(5, 25, 50, .96); box-shadow: 0 18px 48px rgba(0, 0, 0, .22); }
.message-sidebar { display: flex; min-width: 0; flex-direction: column; border-right: 1px solid var(--line); background: rgba(5, 25, 50, .92); }
.sidebar-top { padding: 13px; border-bottom: 1px solid var(--line); }
.message-search { display: flex; min-height: 36px; align-items: center; gap: 8px; padding: 0 9px; border: 1px solid #1b436b; border-radius: 6px; color: #86a8c9; background: #041a34; }
.message-search input { width: 100%; min-width: 0; border: 0; outline: 0; color: #e1efff; background: transparent; font-size: 10px; }
.message-search input::placeholder { color: #7894b0; }
.message-search kbd { padding: 2px 5px; border: 1px solid #31516f; border-radius: 3px; color: #8ca9c6; background: #0a2848; font-size: 9px; }
.folder-tabs { display: flex; gap: 4px; margin-top: 11px; }
.folder-tabs button { display: inline-flex; min-height: 30px; align-items: center; gap: 6px; padding: 5px 9px; border: 1px solid transparent; border-radius: 5px; color: #9ab4cf; background: transparent; cursor: pointer; font-size: 10px; }
.folder-tabs button.active { border-color: #1b5b91; color: #e5f3ff; background: #0b3158; }
.folder-count { display: inline-grid; min-width: 17px; height: 17px; place-items: center; border-radius: 999px; color: #042039; background: #54ceff; font-size: 9px; font-weight: 800; }
.conversation-list { flex: 1; overflow-y: auto; }
.conversation-row { position: relative; display: flex; width: 100%; min-width: 0; align-items: flex-start; gap: 9px; padding: 12px 11px; border: 0; border-bottom: 1px solid rgba(18, 61, 107, .64); color: inherit; text-align: left; background: transparent; cursor: pointer; }
.conversation-row:hover { background: rgba(16, 57, 98, .44); }
.conversation-row.selected { border-left: 3px solid #178fff; background: rgba(15, 75, 128, .35); }
.person-avatar { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border: 1px solid #24699e; border-radius: 50%; color: #bde2ff; background: #0b3b69; font-size: 10px; font-weight: 750; }
.conversation-copy { display: grid; min-width: 0; flex: 1; gap: 4px; }
.conversation-meta { display: flex; align-items: center; justify-content: space-between; gap: 7px; }
.conversation-meta strong { overflow: hidden; color: #e3f0ff; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.conversation-meta time { flex: 0 0 auto; color: #809cb8; font-size: 8px; }
.conversation-subject { overflow: hidden; color: #bed4e8; font-size: 9px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.conversation-preview { overflow: hidden; color: #8da9c5; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.conversation-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.case-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 6px; border: 1px solid #1b527e; border-radius: 4px; color: #a9d8ff; background: rgba(10, 52, 90, .75); font-size: 8px; }
.priority-tag { padding: 3px 6px; border: 1px solid rgba(255, 116, 116, .35); border-radius: 4px; color: #ffc0c0; background: rgba(132, 29, 42, .28); font-size: 8px; font-weight: 700; }
.priority-high { border-color: rgba(255, 188, 87, .35); color: #ffda9c; background: rgba(133, 84, 16, .24); }
.unread-dot { position: absolute; top: 17px; right: 9px; width: 7px; height: 7px; border-radius: 50%; background: #34b9ff; box-shadow: 0 0 0 3px rgba(52, 185, 255, .13); }
.list-state { display: flex; min-height: 140px; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 20px; color: #91acc9; text-align: center; font-size: 10px; }
.empty-list i { color: #4084b8; font-size: 25px; }
.empty-list strong { color: #c5d8eb; font-size: 11px; }
.empty-list span { max-width: 210px; line-height: 1.5; }
.list-error { color: #ffb9b9; }
.sidebar-foot { display: flex; gap: 7px; padding: 10px 12px; border-top: 1px solid var(--line); color: #7794b1; font-size: 8px; line-height: 1.45; }
.sidebar-foot i { flex: 0 0 13px; color: #49c9a6; }
.message-thread { position: relative; display: flex; min-width: 0; flex-direction: column; overflow: hidden; background: rgba(4, 22, 44, .6); }
.thread-header { display: flex; min-height: 62px; align-items: center; gap: 10px; padding: 10px 15px; border-bottom: 1px solid var(--line); background: rgba(7, 31, 59, .96); }
.thread-avatar { width: 36px; height: 36px; flex-basis: 36px; }
.thread-mark { display: grid; width: 36px; height: 36px; flex: 0 0 36px; place-items: center; border: 1px solid #1c5687; border-radius: 8px; color: #77c3ff; background: #0a3156; }
.thread-heading-copy { min-width: 0; flex: 1; }
.thread-heading-copy h2 { overflow: hidden; margin: 0; color: #e5f2ff; font-size: 12px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.thread-heading-copy p { overflow: hidden; margin: 4px 0 0; color: #91acc9; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.thread-actions { display: flex; align-items: center; gap: 6px; }
.icon-action,.mobile-back { display: grid; width: 32px; height: 32px; flex: 0 0 32px; place-items: center; border: 1px solid #254b70; border-radius: 6px; color: #adc8e2; background: transparent; cursor: pointer; }
.icon-action:hover,.mobile-back:hover { border-color: #399df0; color: white; background: rgba(13, 64, 109, .5); }
.danger-action:hover { border-color: #a95462; color: #ffb4bc; background: rgba(96, 25, 37, .4); }
.mobile-back { display: none; }
.thread-scroll { flex: 1; overflow-y: auto; padding: 17px clamp(12px, 2.2vw, 28px); }
.thread-state { display: flex; min-height: 160px; align-items: center; justify-content: center; gap: 8px; color: #91acc9; font-size: 10px; }
.thread-message-list { display: flex; flex-direction: column; gap: 13px; max-width: 880px; margin: 0 auto; }
.thread-day { display: flex; align-items: center; gap: 10px; color: #7795b4; font-size: 9px; }
.thread-day::before,.thread-day::after { height: 1px; flex: 1; background: #153759; content: ''; }
.message-entry { display: flex; max-width: 82%; flex-direction: column; align-self: flex-start; gap: 4px; }
.message-outgoing { align-self: flex-end; }
.entry-byline { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; color: #829db8; font-size: 8px; }
.entry-byline strong { color: #bed4e8; font-size: 9px; }
.message-outgoing .entry-byline { justify-content: flex-end; }
.read-receipt { color: #5ac9ff; }
.entry-bubble { min-width: 130px; padding: 10px 12px; border: 1px solid #1b4267; border-radius: 7px 7px 7px 2px; background: #092344; }
.message-outgoing .entry-bubble { border-color: #15598a; border-radius: 7px 7px 2px 7px; background: #0b3156; }
.entry-topic { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 7px; margin-bottom: 6px; color: #deedff; font-size: 10px; }
.entry-topic .priority-tag { font-size: 8px; }
.entry-bubble p { margin: 0; color: #c1d5e8; font-size: 10px; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
.entry-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(36, 76, 115, .65); color: #8dabc6; font-size: 8px; }
.compose-body { display: flex; width: min(800px, 100%); flex: 1; flex-direction: column; gap: 13px; overflow-y: auto; margin: 0 auto; padding: 19px clamp(14px, 3vw, 34px); }
.compose-field { display: grid; gap: 6px; color: #a9c2da; font-size: 9px; font-weight: 700; }
.compose-field input,.compose-field textarea,.compose-field select,.reply-composer textarea { width: 100%; padding: 9px 10px; border: 1px solid #21476d; border-radius: 6px; outline: 0; color: #e4f2ff; background: #041a33; font-size: 10px; }
.compose-field input:focus,.compose-field textarea:focus,.compose-field select:focus,.reply-composer textarea:focus { border-color: #168bff; box-shadow: 0 0 0 2px rgba(22, 139, 255, .14); }
.compose-field input::placeholder,.compose-field textarea::placeholder,.reply-composer textarea::placeholder { color: #7894b0; }
.compose-field textarea,.reply-composer textarea { resize: vertical; line-height: 1.5; }
.recipient-input-wrap { position: relative; }
.recipient-input-wrap input { padding-right: 35px; }
.clear-recipient { position: absolute; top: 5px; right: 6px; width: 28px; height: 28px; border: 0; color: #91acc9; background: transparent; cursor: pointer; }
.selected-recipient { display: flex; align-items: center; gap: 9px; padding: 9px; border: 1px solid #1b527e; border-radius: 6px; background: rgba(8, 41, 73, .7); }
.selected-recipient > span:nth-child(2),.recipient-option > span:nth-child(2) { display: grid; min-width: 0; flex: 1; gap: 3px; }
.selected-recipient strong,.recipient-option strong { color: #dcedff; font-size: 10px; }
.selected-recipient small,.recipient-option small { overflow: hidden; color: #91acc9; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.verified-recipient { display: inline-flex; align-items: center; gap: 4px; color: #6de0bd; font-size: 8px; }
.recipient-results { display: grid; max-height: 180px; overflow-y: auto; gap: 5px; padding: 7px; border: 1px solid #1b436b; border-radius: 6px; color: #91acc9; font-size: 9px; }
.recipient-option { display: flex; align-items: center; gap: 8px; padding: 7px; border: 1px solid transparent; border-radius: 5px; color: inherit; text-align: left; background: transparent; cursor: pointer; }
.recipient-option:hover { border-color: #1b527e; background: rgba(8, 41, 73, .7); }
.recipient-option > i { color: #77c3ff; }
.compose-meta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.case-context { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid #1b527e; border-radius: 6px; color: #a9d8ff; background: rgba(10, 52, 90, .5); font-size: 9px; }
.case-context > span { flex: 1; }
.case-context button { border: 0; color: #9ab6cf; background: transparent; cursor: pointer; }
.body-field { flex: 1; }
.body-field textarea { min-height: 140px; }
.compose-footer,.reply-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: #829db8; font-size: 8px; }
.reply-composer { padding: 11px 15px; border-top: 1px solid var(--line); background: #061c36; }
.reply-composer textarea { min-height: 54px; max-height: 150px; }
.reply-footer { margin-top: 7px; }
.welcome-state { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center; }
.welcome-icon { display: grid; width: 64px; height: 64px; place-items: center; margin-bottom: 17px; border: 1px solid #1c5785; border-radius: 14px; color: #77c3ff; background: #0a3156; font-size: 27px; }
.welcome-state h2 { max-width: 420px; margin: 5px 0 8px; color: #e9f4ff; font-size: 19px; }
.welcome-state > p:not(.messages-eyebrow) { max-width: 380px; margin: 0 0 18px; color: #91acc9; font-size: 10px; line-height: 1.5; }
.page-alert,.page-notice { position: absolute; z-index: 3; top: 10px; right: 12px; display: flex; max-width: min(500px, calc(100% - 24px)); align-items: center; gap: 8px; padding: 9px 12px; border-radius: 6px; font-size: 10px; }
.page-alert { border: 1px solid rgba(255, 112, 112, .4); color: #ffc0c0; background: #3a1724; }
.page-notice { border: 1px solid rgba(6, 214, 160, .3); color: #8df0d2; background: #07332e; }

@media (max-width: 760px) {
  .messages-page { padding: 12px; }
  .messages-heading { align-items: flex-start; }
  .connection-status { display: none; }
  .message-workspace { position: relative; min-height: calc(100vh - 145px); grid-template-columns: minmax(0, 1fr); }
  .message-sidebar,.message-thread { grid-column: 1; grid-row: 1; }
  .message-sidebar.mobile-hidden,.message-thread.mobile-hidden { display: none; }
  .message-thread { min-height: 60vh; }
  .mobile-back { display: grid; }
  .message-entry { max-width: 92%; }
  .thread-actions .case-tag { display: none; }
}

@media (max-width: 480px) {
  .messages-heading h1 { font-size: 20px; }
  .messages-heading > div:first-child > p:last-child { max-width: 220px; font-size: 9px; line-height: 1.4; }
  .compose-button,.send-button { min-height: 34px; padding: 7px 9px; font-size: 9px; }
  .thread-header { padding: 9px; }
  .thread-actions { gap: 4px; }
  .icon-action { width: 29px; height: 29px; flex-basis: 29px; }
  .compose-meta-row { grid-template-columns: minmax(0, 1fr); }
  .compose-footer { align-items: flex-start; flex-direction: column; }
  .compose-footer .send-button { align-self: flex-end; }
}
</style>
