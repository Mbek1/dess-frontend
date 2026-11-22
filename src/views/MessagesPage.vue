<template>
  <main class="messages-page" :class="{ 'compact-list-view': compactLists }">
    <header class="messages-heading">
      <div>
        <p class="messages-eyebrow"><i class="bi bi-shield-lock-fill" aria-hidden="true"></i> DESS WORKSPACE / CASE-AWARE MESSAGING</p>
        <h1>Messages</h1>
        <p>Secure, case-aware communication between authorized DESS users.</p>
      </div>
      <div class="heading-actions">
        <span class="connection-status"><i class="bi bi-circle-fill" aria-hidden="true"></i> Authenticated workspace</span>
        <button class="compose-button" type="button" @click="startCompose">
          <i class="bi bi-pencil-square" aria-hidden="true"></i> New message
        </button>
      </div>
    </header>

    <section class="message-workspace" :class="{ 'with-details': showDetails && !composeMode && (activePartner || activeCaseChat), 'details-open': showDetails }" aria-label="Internal messages workspace">
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
              <i class="bi bi-people" aria-hidden="true"></i><strong>No case rooms available</strong><span>Case rooms include DESS users assigned to each case.</span>
            </div>
            <button v-for="chat in filteredCaseChats" :key="chat._id" class="conversation-row" :class="{ selected: activeCaseChat?._id === chat._id }" type="button" @click="openCaseChat(chat)">
              <span class="room-avatar"><i class="bi bi-people-fill" aria-hidden="true"></i></span>
              <span class="conversation-copy">
                <span class="conversation-meta"><strong>{{ chat.caseNumber }}</strong><time>{{ formatTime(chat.lastMessageAt) }}</time></span>
                <span class="conversation-subject">{{ chat.title }}</span>
                <span v-if="showMessagePreviews" class="conversation-preview">{{ chat.lastMessage || 'Case room created' }}</span>
                <span class="conversation-tags"><span class="case-tag"><i class="bi bi-people" aria-hidden="true"></i> {{ chat.participants.length }} DESS users</span></span>
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
            <span class="person-avatar">
              <img v-if="avatarSource(conversation.partner._id, conversation.partner.profilePicture)" :src="avatarSource(conversation.partner._id, conversation.partner.profilePicture)" :alt="`${conversation.partner.name} profile photo`" @error="markAvatarFailed(conversation.partner._id, conversation.partner.profilePicture)" />
              <span v-else>{{ initials(conversation.partner.name) }}</span>
            </span>
            <span class="conversation-copy">
              <span class="conversation-meta"><strong>{{ conversation.partner.name }}</strong><time>{{ formatTime(conversation.latest.createdAt) }}</time></span>
              <span class="conversation-subject">{{ conversation.latest.subject }}</span>
              <span v-if="showMessagePreviews" class="conversation-preview">{{ conversation.latest.senderId === currentUserId ? 'You: ' : '' }}{{ conversation.latest.content }}</span>
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
        <div class="sidebar-foot"><i class="bi bi-shield-check" aria-hidden="true"></i> Direct messages are displayed to their intended participants.</div>
      </aside>

      <section class="message-thread" :class="{ 'mobile-hidden': !mobileThreadOpen }">
        <div v-if="pageError" class="page-alert" role="alert"><i class="bi bi-exclamation-circle" aria-hidden="true"></i>{{ pageError }}</div>
        <div v-if="notice" class="page-notice" role="status"><i class="bi bi-check-circle" aria-hidden="true"></i>{{ notice }}</div>

        <template v-if="composeMode">
          <header class="thread-header">
            <button class="mobile-back" type="button" aria-label="Back to messages" @click="backToConversationList"><i class="bi bi-arrow-left" aria-hidden="true"></i></button>
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
              <span class="person-avatar">
                <img v-if="avatarSource(recipient._id, recipient.profilePicture)" :src="avatarSource(recipient._id, recipient.profilePicture)" :alt="`${recipient.name} profile photo`" @error="markAvatarFailed(recipient._id, recipient.profilePicture)" />
                <span v-else>{{ initials(recipient.name) }}</span>
              </span>
              <span><strong>{{ recipient.name }}</strong><small>{{ recipient.email }} · {{ capitalize(recipient.role) }}</small></span>
              <span class="verified-recipient"><i class="bi bi-shield-check" aria-hidden="true"></i> DESS user</span>
            </div>
            <div v-if="recipientLoading" class="recipient-results">Searching directory...</div>
            <div v-else-if="recipientSearch.trim() && !recipient && recipients.length === 0" class="recipient-results">No matching users.</div>
            <div v-else-if="recipients.length" class="recipient-results">
              <button v-for="user in recipients" :key="user._id" type="button" class="recipient-option" @click="selectRecipient(user)">
                <span class="person-avatar">
                  <img v-if="avatarSource(user._id, user.profilePicture)" :src="avatarSource(user._id, user.profilePicture)" :alt="`${user.name} profile photo`" @error="markAvatarFailed(user._id, user.profilePicture)" />
                  <span v-else>{{ initials(user.name) }}</span>
                </span>
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
            <button class="mobile-back" type="button" aria-label="Back to messages" @click="backToConversationList"><i class="bi bi-arrow-left" aria-hidden="true"></i></button>
            <span class="room-avatar thread-avatar"><i class="bi bi-people-fill" aria-hidden="true"></i></span>
            <div class="thread-heading-copy"><h2>{{ activeCaseChat.title }}</h2><p>{{ activeCaseChat.caseNumber }} · {{ activeCaseChat.participants.length }} assigned DESS users</p></div>
            <div class="thread-actions">
              <span class="case-tag"><i class="bi bi-shield-lock" aria-hidden="true"></i> Case team only</span>
              <button class="icon-action" type="button" :aria-expanded="detailsExpanded" aria-controls="message-details-panel" title="Show case room details" aria-label="Toggle case room details" @click="toggleDetails"><i class="bi bi-info-circle" aria-hidden="true"></i></button>
            </div>
          </header>
          <div ref="threadScroll" class="thread-scroll">
            <div v-if="loadingThread" class="thread-state"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Loading case room</div>
            <div v-else-if="caseChatMessages.length === 0" class="thread-state">No messages yet. Start the case conversation with the assigned team.</div>
            <div v-else class="thread-message-list">
              <div class="thread-day"><span>Case team conversation</span></div>
              <article v-for="message in caseChatMessages" :key="message._id" class="message-entry" :class="{ 'message-outgoing': message.senderId === currentUserId }">
                <div class="entry-byline">
                  <span class="message-author-avatar">
                    <img v-if="avatarSource(message.senderId, message.senderProfilePicture)" :src="avatarSource(message.senderId, message.senderProfilePicture)" :alt="`${message.senderName} profile photo`" @error="markAvatarFailed(message.senderId, message.senderProfilePicture)" />
                    <span v-else>{{ initials(message.senderName) }}</span>
                  </span>
                  <strong>{{ message.senderId === currentUserId ? 'You' : message.senderName }}</strong><span class="case-team-role">{{ capitalize(message.senderRole) }}</span><time>{{ formatDateTime(message.createdAt) }}</time>
                </div>
                <div class="entry-bubble"><p>{{ message.content }}</p><div class="entry-meta"><span>{{ message.readBy?.length || 0 }} read</span><span>{{ activeCaseChat.caseNumber }}</span></div></div>
              </article>
            </div>
          </div>
          <form class="reply-composer" @submit.prevent="sendCaseChatMessage">
            <label class="visually-hidden" for="case-chat-body">Message the case team</label>
            <textarea id="case-chat-body" v-model="replyBody" rows="2" maxlength="10000" placeholder="Message the assigned case team..." :disabled="sending"></textarea>
            <div class="reply-footer"><span>Visible to assigned DESS users only · {{ replyBody.length }}/10,000</span><button class="send-button" type="submit" :disabled="sending || !replyBody.trim()"><i class="bi bi-send-fill" aria-hidden="true"></i>{{ sending ? 'Sending...' : 'Send to case team' }}</button></div>
          </form>
        </template>

        <template v-else-if="activeConversationId">
          <header class="thread-header">
            <button class="mobile-back" type="button" aria-label="Back to messages" @click="backToConversationList"><i class="bi bi-arrow-left" aria-hidden="true"></i></button>
            <span class="person-avatar thread-avatar">
              <img v-if="avatarSource(activePartner?._id, activePartner?.profilePicture)" :src="avatarSource(activePartner?._id, activePartner?.profilePicture)" :alt="`${activePartner?.name || 'Contact'} profile photo`" @error="markAvatarFailed(activePartner?._id, activePartner?.profilePicture)" />
              <span v-else>{{ initials(activePartner?.name) }}</span>
            </span>
            <div class="thread-heading-copy"><h2>{{ activePartner?.name || 'Conversation' }}</h2><p>{{ activePartner?.email }}<span v-if="activePartner?.role"> · {{ capitalize(activePartner.role) }}</span></p></div>
            <div class="thread-actions">
              <span v-if="activeConversationMessages[0]?.caseNumber" class="case-tag"><i class="bi bi-folder2-open" aria-hidden="true"></i> {{ activeConversationMessages[0].caseNumber }}</span>
              <button class="icon-action" type="button" :aria-expanded="detailsExpanded" aria-controls="message-details-panel" title="Show contact details" aria-label="Toggle contact details" @click="toggleDetails"><i class="bi bi-info-circle" aria-hidden="true"></i></button>
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
                <div class="entry-byline">
                  <span class="message-author-avatar">
                    <img v-if="avatarSource(message.senderId, message.senderProfilePicture)" :src="avatarSource(message.senderId, message.senderProfilePicture)" :alt="`${message.senderName} profile photo`" @error="markAvatarFailed(message.senderId, message.senderProfilePicture)" />
                    <span v-else>{{ initials(message.senderName) }}</span>
                  </span>
                  <strong>{{ message.senderId === currentUserId ? 'You' : message.senderName }}</strong><time>{{ formatDateTime(message.createdAt) }}</time><span v-if="message.status === 'read' && message.senderId === currentUserId" class="read-receipt"><i class="bi bi-check2-all" aria-hidden="true"></i> Read</span>
                </div>
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

      <button
        v-if="mobileDetailsOpen && (activePartner || activeCaseChat)"
        class="mobile-details-backdrop"
        type="button"
        aria-label="Close conversation details"
        @click="closeDetails"
      ></button>
      <aside
        v-if="(showDetails || mobileDetailsOpen) && !composeMode && (activePartner || activeCaseChat)"
        id="message-details-panel"
        class="contact-details"
        :class="{ 'mobile-details-open': mobileDetailsOpen }"
        :aria-label="activeCaseChat ? 'Case room details' : 'Contact details'"
        :role="mobileDetailsOpen ? 'dialog' : undefined"
        :aria-modal="mobileDetailsOpen ? 'true' : undefined"
      >
        <header class="details-panel-header">
          <div><p class="details-eyebrow">CONVERSATION INFO</p><h3>{{ activeCaseChat ? 'Case room' : 'Contact details' }}</h3></div>
          <button class="icon-action" type="button" aria-label="Close details panel" @click="closeDetails"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
        </header>

        <template v-if="activePartner">
          <div class="contact-profile">
            <span class="contact-avatar">
              <img v-if="avatarSource(activePartner._id, activePartner.profilePicture)" :src="avatarSource(activePartner._id, activePartner.profilePicture)" :alt="`${activePartner.name} profile photo`" @error="markAvatarFailed(activePartner._id, activePartner.profilePicture)" />
              <span v-else>{{ initials(activePartner.name) }}</span>
            </span>
            <h4>{{ activePartner.name }}</h4>
            <span class="contact-role">{{ capitalize(activePartner.role) }}</span>
          </div>
          <section class="details-section">
            <h4>Contact information</h4>
            <div class="detail-field"><span>Email address</span><a :href="'mailto:' + activePartner.email">{{ activePartner.email }}</a></div>
            <div v-if="activePartner.organizationName" class="detail-field"><span>Organization</span><strong>{{ activePartner.organizationName }}</strong></div>
            <div v-if="activePartner.organizationRole" class="detail-field"><span>Position</span><strong>{{ activePartner.organizationRole }}</strong></div>
          </section>
          <section class="details-section">
            <h4>Conversation</h4>
            <div class="detail-field"><span>Messages in thread</span><strong>{{ activeConversationMessages.length }}</strong></div>
            <div class="detail-field"><span>Last activity</span><strong>{{ activeConversationMessages.length ? formatDateTime(activeConversationMessages[activeConversationMessages.length - 1].createdAt) : 'Not available' }}</strong></div>
            <div v-if="activeConversationMessages.find(message => message.caseNumber)" class="linked-case-card">
              <i class="bi bi-folder2-open" aria-hidden="true"></i>
              <span><small>Linked case</small><strong>{{ activeConversationMessages.find(message => message.caseNumber)?.caseNumber }}</strong></span>
            </div>
          </section>
          <a class="contact-email-action" :href="'mailto:' + activePartner.email"><i class="bi bi-envelope" aria-hidden="true"></i> Email contact</a>
        </template>

        <template v-else-if="activeCaseChat">
          <div class="contact-profile case-room-profile">
            <span class="case-room-detail-icon"><i class="bi bi-people-fill" aria-hidden="true"></i></span>
            <h4>{{ activeCaseChat.title }}</h4>
            <span class="contact-role">{{ activeCaseChat.caseNumber }}</span>
          </div>
          <section class="details-section">
            <h4>Room information</h4>
            <div class="detail-field"><span>Assigned participants</span><strong>{{ activeCaseChat.participants.length }}</strong></div>
            <div class="detail-field"><span>Messages in room</span><strong>{{ caseChatMessages.length }}</strong></div>
            <div class="detail-field"><span>Last activity</span><strong>{{ formatDateTime(activeCaseChat.lastMessageAt) }}</strong></div>
          </section>
          <section class="details-section">
            <h4>Assigned DESS users</h4>
            <div v-for="participant in activeCaseChat.participants" :key="participant.userId || participant._id" class="participant-row">
              <span class="participant-avatar">
                <img v-if="avatarSource(participant.userId || participant._id, participant.profilePicture)" :src="avatarSource(participant.userId || participant._id, participant.profilePicture)" :alt="`${participant.name} profile photo`" @error="markAvatarFailed(participant.userId || participant._id, participant.profilePicture)" />
                <span v-else>{{ initials(participant.name) }}</span>
              </span>
              <span><strong>{{ participant.name }}</strong><small>{{ capitalize(participant.role) }}</small></span>
            </div>
          </section>
          <div class="details-security-note"><i class="bi bi-shield-lock" aria-hidden="true"></i> This room is limited to users assigned to the case.</div>
        </template>
      </aside>
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
  senderProfilePicture?: string;
  recipientProfilePicture?: string;
  createdAt: string;
}
interface DirectoryUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  organizationName?: string;
  organizationRole?: string;
  profilePicture?: string;
}
interface CaseChatParticipant {
  _id?: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  profilePicture?: string;
}
interface Conversation { conversationId: string; latest: MessageRecord; messages: MessageRecord[]; unread: number; partner: DirectoryUser }
interface CaseChatRecord {
  _id: string;
  caseId: string;
  caseNumber: string;
  title: string;
  participants: CaseChatParticipant[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}
interface CaseChatMessageRecord {
  _id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderProfilePicture?: string;
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
const showDetails = ref(true);
const mobileDetailsOpen = ref(false);
const isSmallScreen = ref(false);
const showMessagePreviews = ref(true);
const compactLists = ref(false);
const confirmBeforeDelete = ref(true);
const failedAvatarKeys = ref<string[]>([]);
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

function avatarKey(userId?: string, profilePicture?: string) {
  return userId && profilePicture ? `${userId}|${profilePicture}` : '';
}

function avatarSource(userId?: string, profilePicture?: string) {
  if (!userId || !profilePicture || failedAvatarKeys.value.includes(avatarKey(userId, profilePicture))) return '';
  if (/^https?:\/\//i.test(profilePicture)) return profilePicture;
  return `${API_CONFIG.baseURL}${profilePicture.startsWith('/') ? '' : '/'}${profilePicture}`;
}

function markAvatarFailed(userId?: string, profilePicture?: string) {
  const key = avatarKey(userId, profilePicture);
  if (key && !failedAvatarKeys.value.includes(key)) failedAvatarKeys.value = [...failedAvatarKeys.value, key];
}
function capitalize(value?: string) { if (!value) return ''; return value.toLowerCase() === 'investigator' ? 'DESS User' : value[0].toUpperCase() + value.slice(1); }
function formatTime(value: string) { return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function formatDateTime(value: string) { return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function categoryLabel(value: string) { return ({ 'case-related': 'Case related', general: 'General', urgent: 'Urgent', 'follow-up': 'Follow-up' } as Record<string, string>)[value] || 'General'; }

function syncUiPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem('dess_settings') || '{}');
    showMessagePreviews.value = saved.showMessagePreviews !== false;
    compactLists.value = saved.compactLists === true;
    confirmBeforeDelete.value = saved.confirmBeforeDelete !== false;
  } catch {
    showMessagePreviews.value = true;
    compactLists.value = false;
    confirmBeforeDelete.value = true;
  }
}

function handleSettingsUpdated() {
  syncUiPreferences();
}

function syncViewport() {
  isSmallScreen.value = window.matchMedia?.('(max-width: 760px)').matches ?? window.innerWidth <= 760;
  if (!isSmallScreen.value) mobileDetailsOpen.value = false;
}

const detailsExpanded = computed(() => isSmallScreen.value ? mobileDetailsOpen.value : showDetails.value);

function toggleDetails() {
  if (isSmallScreen.value) mobileDetailsOpen.value = !mobileDetailsOpen.value;
  else showDetails.value = !showDetails.value;
}

function closeDetails() {
  if (isSmallScreen.value) mobileDetailsOpen.value = false;
  else showDetails.value = false;
}

function backToConversationList() {
  mobileThreadOpen.value = false;
  mobileDetailsOpen.value = false;
}

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
        role: isSender ? latest.recipientRole : latest.senderRole,
        profilePicture: isSender ? latest.recipientProfilePicture : latest.senderProfilePicture
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
    if (activeCaseChat.value) {
      const refreshedRoom = caseChats.value.find((room: CaseChatRecord) => room._id === activeCaseChat.value?._id);
      if (refreshedRoom) activeCaseChat.value = refreshedRoom;
    }
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
  if (!activePartner.value) return;
  if (confirmBeforeDelete.value && !window.confirm('Delete this conversation from your message view? This will not remove it for the other participant.')) return;
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
let caseChatRefreshTimer: ReturnType<typeof setInterval> | undefined;

async function refreshActiveFolder() {
  if (activeFolder.value === 'case-chats' && currentUserRole.value === 'investigator') {
    await loadCaseChats();
  } else if (activeFolder.value !== 'case-chats') {
    await loadMessages();
  }
}

function handleCaseCreated() {
  if (currentUserRole.value !== 'investigator') return;
  activeFolder.value = 'case-chats';
  void loadCaseChats();
}

onMounted(() => {
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  currentUserId.value = currentUser.id || '';
  currentUserRole.value = currentUser.role || '';
  syncUiPreferences();
  syncViewport();
  window.addEventListener('resize', syncViewport);
  window.addEventListener('focus', refreshActiveFolder);
  window.addEventListener('dess-case-created', handleCaseCreated);
  window.addEventListener('dess-settings-updated', handleSettingsUpdated);
  if (currentUserRole.value === 'investigator') {
    activeFolder.value = 'case-chats';
    void loadCaseChats();
    caseChatRefreshTimer = setInterval(() => {
      if (document.visibilityState !== 'hidden' && activeFolder.value === 'case-chats') void loadCaseChats();
    }, 30000);
  } else {
    activeFolder.value = 'inbox';
    void loadMessages();
  }
  void applyRouteContext();
  window.addEventListener('keydown', viewItem);
});
onBeforeUnmount(() => {
  if (recipientSearchTimer) clearTimeout(recipientSearchTimer);
  if (caseChatRefreshTimer) clearInterval(caseChatRefreshTimer);
  window.removeEventListener('resize', syncViewport);
  window.removeEventListener('focus', refreshActiveFolder);
  window.removeEventListener('dess-case-created', handleCaseCreated);
  window.removeEventListener('dess-settings-updated', handleSettingsUpdated);
  window.removeEventListener('keydown', viewItem);
});
</script>

<style scoped>
.messages-page {
  --msg-bg: #f2f5fa;
  --panel: #ffffff;
  --panel-soft: #f8faff;
  --line: #e3e9f2;
  --main: #17243a;
  --muted: #718096;
  --blue: #245cc5;
  --blue-soft: #edf4ff;
  --green: #0a9f78;
  display: flex;
  min-height: calc(100vh - 56px);
  flex-direction: column;
  padding: 24px clamp(14px, 2.5vw, 34px) 30px;
  color: var(--main);
  background: var(--msg-bg);
}

.messages-heading {
  display: flex;
  width: min(1500px, 100%);
  align-items: flex-end;
  justify-content: space-between;
  gap: 22px;
  margin: 0 auto 18px;
}
.messages-eyebrow {
  margin: 0 0 7px;
  color: var(--blue);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: .09em;
}
.messages-heading h1 {
  margin: 0;
  color: #17243a;
  font-size: clamp(1.55rem, 2vw, 1.9rem);
  font-weight: 800;
  letter-spacing: -.03em;
}
.messages-heading > div:first-child > p:last-child {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: .9rem;
}
.heading-actions { display: flex; align-items: center; gap: 14px; }
.connection-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #63758d;
  font-size: .78rem;
  font-weight: 600;
}
.connection-status i { color: var(--green); font-size: .5rem; }
.compose-button,
.send-button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 15px;
  border: 1px solid var(--blue);
  border-radius: 9px;
  color: #fff;
  background: var(--blue);
  box-shadow: 0 4px 12px rgba(36, 92, 197, .16);
  cursor: pointer;
  font-size: .86rem;
  font-weight: 700;
  transition: background .18s ease, transform .18s ease, box-shadow .18s ease;
}
.compose-button:hover,
.send-button:hover:not(:disabled) {
  background: #194ba9;
  box-shadow: 0 6px 16px rgba(36, 92, 197, .22);
  transform: translateY(-1px);
}
.send-button:disabled { opacity: .55; cursor: not-allowed; box-shadow: none; }

.message-workspace {
  display: grid;
  width: min(1500px, 100%);
  min-height: min(760px, calc(100vh - 170px));
  flex: 1;
  grid-template-columns: minmax(290px, 360px) minmax(0, 1fr);
  overflow: hidden;
  margin: 0 auto;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--panel);
  box-shadow: 0 14px 38px rgba(25, 43, 72, .08);
}
.message-sidebar {
  display: flex;
  min-width: 0;
  flex-direction: column;
  border-right: 1px solid var(--line);
  background: #fff;
}
.sidebar-top { padding: 18px; border-bottom: 1px solid var(--line); }
.message-search {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border: 1px solid #dce4ef;
  border-radius: 9px;
  color: #8291a5;
  background: #f8faff;
}
.message-search:focus-within {
  border-color: #8caeea;
  box-shadow: 0 0 0 3px rgba(36, 92, 197, .09);
}
.message-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: var(--main);
  background: transparent;
  font-size: .84rem;
}
.message-search input::placeholder { color: #9aa7b8; }
.message-search kbd {
  padding: 3px 6px;
  border: 1px solid #dfe6ef;
  border-radius: 5px;
  color: #7d8ca1;
  background: #fff;
  font-size: .72rem;
}
.folder-tabs { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 14px; }
.folder-tabs button {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 7px;
  padding: 6px 11px;
  border: 1px solid transparent;
  border-radius: 7px;
  color: #64748b;
  background: transparent;
  cursor: pointer;
  font-size: .78rem;
  font-weight: 650;
}
.folder-tabs button:hover { color: var(--blue); background: #f4f7fc; }
.folder-tabs button.active {
  border-color: #d7e4fb;
  color: #174ba9;
  background: var(--blue-soft);
}
.folder-count {
  display: inline-grid;
  min-width: 19px;
  height: 19px;
  place-items: center;
  padding: 0 5px;
  border-radius: 999px;
  color: #fff;
  background: var(--blue);
  font-size: .68rem;
  font-weight: 800;
}
.conversation-list { flex: 1; overflow-y: auto; }
.conversation-row {
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: flex-start;
  gap: 11px;
  padding: 15px 16px;
  border: 0;
  border-bottom: 1px solid #eef1f6;
  color: inherit;
  text-align: left;
  background: #fff;
  cursor: pointer;
  transition: background .15s ease;
}
.conversation-row:hover { background: #f8faff; }
.conversation-row.selected {
  border-left: 3px solid var(--blue);
  background: #f0f5ff;
}
.person-avatar {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border: 1px solid #d9e6fb;
  border-radius: 50%;
  color: #2457aa;
  background: #edf4ff;
  font-size: .77rem;
  font-weight: 800;
}
.conversation-copy { display: grid; min-width: 0; flex: 1; gap: 5px; }
.conversation-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.conversation-meta strong {
  overflow: hidden;
  color: #23334b;
  font-size: .84rem;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conversation-meta time { flex: 0 0 auto; color: #8a97a9; font-size: .7rem; }
.conversation-subject {
  overflow: hidden;
  color: #52647b;
  font-size: .8rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conversation-preview {
  overflow: hidden;
  color: #8290a3;
  font-size: .77rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conversation-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.case-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 7px;
  border: 1px solid #dce7f6;
  border-radius: 5px;
  color: #49688f;
  background: #f5f8fd;
  font-size: .68rem;
}
.priority-tag {
  padding: 4px 7px;
  border: 1px solid #f3d6d6;
  border-radius: 5px;
  color: #a53c48;
  background: #fff4f4;
  font-size: .68rem;
  font-weight: 750;
}
.priority-high { border-color: #f0dfba; color: #946315; background: #fff9eb; }
.unread-dot {
  position: absolute;
  top: 19px;
  right: 13px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2770dd;
  box-shadow: 0 0 0 3px rgba(39, 112, 221, .1);
}
.list-state {
  display: flex;
  min-height: 170px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 22px;
  color: #8190a4;
  text-align: center;
  font-size: .82rem;
}
.empty-list i { color: #8da8cf; font-size: 1.9rem; }
.empty-list strong { color: #41536d; font-size: .9rem; }
.empty-list span { max-width: 230px; line-height: 1.55; }
.list-error { color: #b5474f; }
.sidebar-foot {
  display: flex;
  gap: 8px;
  padding: 13px 16px;
  border-top: 1px solid var(--line);
  color: #8592a4;
  font-size: .7rem;
  line-height: 1.5;
}
.sidebar-foot i { flex: 0 0 14px; color: var(--green); }

.message-thread {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  background: #f8fafd;
}
.thread-header {
  display: flex;
  min-height: 76px;
  align-items: center;
  gap: 12px;
  padding: 13px 20px;
  border-bottom: 1px solid var(--line);
  background: #fff;
}
.thread-avatar { width: 42px; height: 42px; flex-basis: 42px; }
.thread-mark {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border: 1px solid #d8e5fa;
  border-radius: 11px;
  color: var(--blue);
  background: #edf4ff;
  font-size: 1.05rem;
}
.thread-heading-copy { min-width: 0; flex: 1; }
.thread-heading-copy h2 {
  overflow: hidden;
  margin: 0;
  color: #1e2d43;
  font-size: .98rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.thread-heading-copy p {
  overflow: hidden;
  margin: 5px 0 0;
  color: #7b899d;
  font-size: .77rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.thread-actions { display: flex; align-items: center; gap: 7px; }
.icon-action,.mobile-back {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  border: 1px solid #dce4ee;
  border-radius: 8px;
  color: #687990;
  background: #fff;
  cursor: pointer;
}
.icon-action:hover,.mobile-back:hover { border-color: #a8c1e9; color: var(--blue); background: #f4f8ff; }
.danger-action:hover { border-color: #efc5c8; color: #b43c4a; background: #fff6f6; }
.mobile-back { display: none; }
.thread-scroll { flex: 1; overflow-y: auto; padding: 22px clamp(14px, 3vw, 38px); }
.thread-state {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: #7d8ca1;
  font-size: .84rem;
}
.thread-message-list { display: flex; flex-direction: column; gap: 16px; max-width: 900px; margin: 0 auto; }
.thread-day { display: flex; align-items: center; gap: 12px; color: #8b98aa; font-size: .72rem; }
.thread-day::before,.thread-day::after { height: 1px; flex: 1; background: #e3e9f1; content: ''; }
.message-entry { display: flex; max-width: 82%; flex-direction: column; align-self: flex-start; gap: 6px; }
.message-outgoing { align-self: flex-end; }
.entry-byline { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; color: #8a97a9; font-size: .69rem; }
.entry-byline strong { color: #475971; font-size: .76rem; font-weight: 750; }
.message-outgoing .entry-byline { justify-content: flex-end; }
.read-receipt { color: #2985c9; }
.entry-bubble {
  min-width: 150px;
  padding: 13px 15px;
  border: 1px solid #e1e7ef;
  border-radius: 12px 12px 12px 3px;
  background: #fff;
  box-shadow: 0 3px 12px rgba(29, 48, 77, .04);
}
.message-outgoing .entry-bubble {
  border-color: #d5e3fb;
  border-radius: 12px 12px 3px 12px;
  background: #edf4ff;
}
.entry-topic { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 7px; color: #283a54; font-size: .84rem; }
.entry-topic .priority-tag { font-size: .66rem; }
.entry-bubble p { margin: 0; color: #4c5e75; font-size: .86rem; line-height: 1.65; white-space: pre-wrap; overflow-wrap: anywhere; }
.entry-meta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; padding-top: 8px; border-top: 1px solid #e7edf5; color: #8290a3; font-size: .68rem; }

.compose-body {
  display: flex;
  width: min(820px, 100%);
  flex: 1;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  margin: 0 auto;
  padding: 24px clamp(16px, 3.5vw, 40px);
}
.compose-field { display: grid; gap: 7px; color: #53647b; font-size: .78rem; font-weight: 750; }
.compose-field input,.compose-field textarea,.compose-field select,.reply-composer textarea {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #dce4ee;
  border-radius: 8px;
  outline: 0;
  color: #24344b;
  background: #fff;
  font-size: .86rem;
}
.compose-field input:focus,.compose-field textarea:focus,.compose-field select:focus,.reply-composer textarea:focus {
  border-color: #8baee8;
  box-shadow: 0 0 0 3px rgba(36, 92, 197, .1);
}
.compose-field input::placeholder,.compose-field textarea::placeholder,.reply-composer textarea::placeholder { color: #9aa7b8; }
.compose-field textarea,.reply-composer textarea { resize: vertical; line-height: 1.6; }
.recipient-input-wrap { position: relative; }
.recipient-input-wrap input { padding-right: 38px; }
.clear-recipient {
  position: absolute;
  top: 6px;
  right: 7px;
  width: 30px;
  height: 30px;
  border: 0;
  color: #8190a4;
  background: transparent;
  cursor: pointer;
}
.selected-recipient {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px;
  border: 1px solid #dbe7f7;
  border-radius: 9px;
  background: #f5f8fd;
}
.selected-recipient > span:nth-child(2),.recipient-option > span:nth-child(2) { display: grid; min-width: 0; flex: 1; gap: 4px; }
.selected-recipient strong,.recipient-option strong { color: #283a54; font-size: .83rem; }
.selected-recipient small,.recipient-option small { overflow: hidden; color: #78879b; font-size: .74rem; text-overflow: ellipsis; white-space: nowrap; }
.verified-recipient { display: inline-flex; align-items: center; gap: 5px; color: #078360; font-size: .72rem; font-weight: 650; }
.recipient-results { display: grid; max-height: 210px; overflow-y: auto; gap: 6px; padding: 8px; border: 1px solid #e0e7f0; border-radius: 9px; color: #78879b; background: #fff; font-size: .76rem; }
.recipient-option { display: flex; align-items: center; gap: 9px; padding: 9px; border: 1px solid transparent; border-radius: 7px; color: inherit; text-align: left; background: transparent; cursor: pointer; }
.recipient-option:hover { border-color: #dbe7f7; background: #f4f8fe; }
.recipient-option > i { color: var(--blue); }
.compose-meta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.case-context { display: flex; align-items: center; gap: 9px; padding: 10px 12px; border: 1px solid #d6e4f7; border-radius: 8px; color: #45658f; background: #f2f7ff; font-size: .78rem; }
.case-context > span { flex: 1; }
.case-context button { border: 0; color: #74869d; background: transparent; cursor: pointer; }
.body-field { flex: 1; }
.body-field textarea { min-height: 160px; }
.compose-footer,.reply-footer { display: flex; align-items: center; justify-content: space-between; gap: 14px; color: #8390a2; font-size: .7rem; }
.reply-composer { padding: 14px 18px; border-top: 1px solid var(--line); background: #fff; }
.reply-composer textarea { min-height: 60px; max-height: 160px; background: #f9fbfe; }
.reply-footer { margin-top: 9px; }
.welcome-state { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; padding: 36px; text-align: center; }
.welcome-icon {
  display: grid;
  width: 70px;
  height: 70px;
  place-items: center;
  margin-bottom: 18px;
  border: 1px solid #d7e5fb;
  border-radius: 18px;
  color: var(--blue);
  background: #edf4ff;
  font-size: 1.8rem;
}
.welcome-state h2 { max-width: 460px; margin: 7px 0 9px; color: #21324a; font-size: 1.35rem; font-weight: 800; }
.welcome-state > p:not(.messages-eyebrow) { max-width: 410px; margin: 0 0 20px; color: #7d8ba0; font-size: .88rem; line-height: 1.6; }
.page-alert,.page-notice {
  position: absolute;
  z-index: 3;
  top: 12px;
  right: 14px;
  display: flex;
  max-width: min(500px, calc(100% - 28px));
  align-items: center;
  gap: 9px;
  padding: 11px 14px;
  border-radius: 8px;
  font-size: .8rem;
  box-shadow: 0 6px 20px rgba(22, 35, 55, .12);
}
.page-alert { border: 1px solid #f0cfd2; color: #9c3540; background: #fff5f5; }
.page-notice { border: 1px solid #cceadd; color: #087b5a; background: #f0fbf6; }

@media (max-width: 760px) {
  .messages-page { padding: 16px 12px 20px; }
  .messages-heading { align-items: flex-start; }
  .connection-status { display: none; }
  .message-workspace { position: relative; min-height: calc(100vh - 150px); grid-template-columns: minmax(0, 1fr); }
  .message-sidebar,.message-thread { grid-column: 1; grid-row: 1; }
  .message-sidebar.mobile-hidden,.message-thread.mobile-hidden { display: none; }
  .message-thread { min-height: 60vh; }
  .mobile-back { display: grid; }
  .message-entry { max-width: 92%; }
  .thread-actions .case-tag { display: none; }
}

@media (max-width: 480px) {
  .messages-heading { align-items: flex-start; gap: 10px; }
  .messages-heading h1 { font-size: 1.45rem; }
  .messages-heading > div:first-child > p:last-child { max-width: 230px; font-size: .78rem; line-height: 1.45; }
  .compose-button,.send-button { min-height: 39px; padding: 8px 10px; font-size: .78rem; }
  .thread-header { padding: 10px; }
  .thread-actions { gap: 4px; }
  .icon-action { width: 32px; height: 32px; flex-basis: 32px; }
  .compose-meta-row { grid-template-columns: minmax(0, 1fr); }
  .compose-footer { align-items: flex-start; flex-direction: column; }
  .compose-footer .send-button { align-self: flex-end; }
}


/* Light, three-panel conversation workspace inspired by the supplied reference. */
.messages-page {
  --msg-bg: #f1f7f4;
  --panel: #ffffff;
  --panel-soft: #f7fbf9;
  --line: #e2ebe6;
  --main: #192a25;
  --muted: #71817a;
  --blue: #159c78;
  --blue-soft: #e8f7f0;
  --green: #17b981;
  padding: 22px clamp(12px, 2.2vw, 28px) 28px;
}
.messages-heading { width: min(1580px, 100%); margin-bottom: 15px; }
.messages-eyebrow { color: #139b76; }
.messages-heading h1 { color: #17251f; }
.connection-status { color: #74867d; }
.compose-button,.send-button { border-color: #1dbb82; background: #19b978; box-shadow: 0 5px 13px rgba(25, 185, 120, .16); }
.compose-button:hover,.send-button:hover:not(:disabled) { border-color: #0f9c69; background: #0f9c69; }
.message-workspace { width: min(1580px, 100%); min-height: min(790px, calc(100vh - 155px)); grid-template-columns: minmax(250px, 290px) minmax(0, 1fr); border-color: #e1e9e4; border-radius: 12px; box-shadow: 0 12px 34px rgba(31, 64, 47, .07); }
.message-workspace.with-details { grid-template-columns: minmax(245px, 275px) minmax(380px, 1fr) minmax(235px, 270px); }
.message-sidebar { background: #fff; border-right-color: #e4ece7; }
.sidebar-top { padding: 15px; }
.message-search { border-color: #e1eae4; background: #f8fbf9; }
.folder-tabs { gap: 4px; }
.folder-tabs button.active { border-color: #ccebdd; color: #087b59; background: #e8f7f0; }
.folder-count { background: #17b981; }
.conversation-row { padding: 13px 14px; border-bottom-color: #edf2ee; }
.conversation-row:hover { background: #f7fbf8; }
.conversation-row.selected { border-left-color: #1dbb82; background: #eaf8f1; box-shadow: inset 3px 0 #1dbb82; }
.person-avatar { background: #e4f3eb; color: #19845f; }
.room-avatar { color: #16815e; background: #e4f5eb; }
.case-tag { border-color: #d4eadf; color: #24785d; background: #f0faf4; }
.priority-tag { border-color: #f2d8d4; color: #a64b43; background: #fff5f3; }
.priority-high { border-color: #f0e1bc; color: #946315; background: #fff9eb; }
.unread-dot { background: #19b978; }
.sidebar-foot { color: #85938b; background: #fbfdfb; }
.message-thread { min-width: 0; background: #fbfdfc; }
.thread-header { min-height: 68px; padding: 12px 17px; border-bottom-color: #e5ede8; background: #fff; }
.thread-heading-copy h2 { color: #1a2a23; }
.thread-heading-copy p { color: #809087; }
.icon-action,.mobile-back { border-color: #e1eae4; color: #73827a; background: #fff; }
.icon-action:hover,.mobile-back:hover { border-color: #b5dfc9; color: #13845d; background: #f1faf5; }
.thread-scroll { background-color: #f8fbf9; background-image: radial-gradient(rgba(28, 142, 96, .05) .8px, transparent .8px); background-size: 18px 18px; }
.thread-day { color: #9aa79f; }
.thread-day::before,.thread-day::after { background: #e5ede8; }
.entry-byline strong { color: #41564b; }
.entry-bubble { border-color: #e4ebe6; border-radius: 12px 12px 12px 4px; background: #fff; box-shadow: 0 3px 10px rgba(32, 69, 48, .04); }
.message-outgoing .entry-bubble { border-color: #d2eee0; border-radius: 12px 12px 4px 12px; background: #e2f6eb; }
.entry-topic { color: #20372b; }
.entry-bubble p { color: #40564b; }
.entry-meta { border-top-color: #e7efe9; color: #819087; }
.reply-composer { border-top-color: #e5ede8; background: #fff; }
.reply-composer textarea { border-color: #e1eae4; border-radius: 9px; background: #f8fbf9; }
.reply-composer textarea:focus { border-color: #91d6b2; box-shadow: 0 0 0 3px rgba(23, 185, 129, .1); }
.compose-body { background: #fbfdfb; }
.welcome-icon { color: #159c78; background: #e5f6ed; }
.welcome-state h2 { color: #20372b; }
.welcome-state > p:not(.messages-eyebrow) { color: #7d8f84; }
.contact-details { display: flex; min-width: 0; flex-direction: column; overflow-y: auto; border-left: 1px solid #e4ece7; background: #fff; }
.details-panel-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 17px 15px; border-bottom: 1px solid #edf2ee; }
.details-eyebrow { margin: 0 0 4px; color: #159c78; font-size: .62rem; font-weight: 800; letter-spacing: .09em; }
.details-panel-header h3 { margin: 0; color: #23342b; font-size: .95rem; font-weight: 750; }
.contact-profile { display: grid; justify-items: center; gap: 7px; padding: 22px 15px 18px; border-bottom: 1px solid #edf2ee; text-align: center; }
.contact-avatar,.case-room-detail-icon { display: grid; width: 76px; height: 76px; place-items: center; border: 4px solid #f0f8f3; border-radius: 50%; color: #17865e; background: #e5f5eb; font-size: 1.25rem; font-weight: 800; }
.case-room-detail-icon { border-radius: 20px; font-size: 1.7rem; }
.contact-profile h4 { margin: 3px 0 0; color: #1b2b22; font-size: 1rem; font-weight: 800; }
.contact-role { color: #16956c; font-size: .75rem; font-weight: 650; }
.details-section { display: grid; gap: 11px; padding: 15px; border-bottom: 1px solid #edf2ee; }
.details-section h4 { margin: 0; color: #30443a; font-size: .79rem; font-weight: 750; }
.detail-field { display: grid; gap: 4px; }
.detail-field > span { color: #87958c; font-size: .67rem; }
.detail-field strong,.detail-field a { overflow-wrap: anywhere; color: #40584b; font-size: .75rem; font-weight: 650; text-decoration: none; }
.detail-field a:hover { color: #0f986b; }
.linked-case-card { display: flex; align-items: center; gap: 9px; padding: 10px; border: 1px solid #dcefe4; border-radius: 8px; color: #16845d; background: #f1faf4; }
.linked-case-card > span { display: grid; gap: 3px; }
.linked-case-card small { color: #7c9384; font-size: .64rem; }
.linked-case-card strong { color: #27714f; font-size: .77rem; }
.participant-row { display: flex; align-items: center; gap: 8px; }
.participant-avatar { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; border-radius: 50%; color: #237c5a; background: #e6f5ec; font-size: .64rem; font-weight: 750; }
.participant-row > span:last-child { display: grid; gap: 2px; }
.participant-row strong { color: #3a5144; font-size: .72rem; }
.participant-row small { color: #89968e; font-size: .64rem; }
.details-security-note { display: flex; align-items: flex-start; gap: 8px; margin: 13px; padding: 10px; border-radius: 7px; color: #668474; background: #f2f8f3; font-size: .68rem; line-height: 1.45; }
.details-security-note i { color: #159c78; }
.compact-list-view .conversation-row { padding-top: 8px; padding-bottom: 8px; }
.compact-list-view .case-tag { font-size: .62rem; }
.hide-previews .conversation-preview { display: none; }

@media (max-width: 1080px) {
  .message-workspace.with-details { grid-template-columns: minmax(240px, 285px) minmax(0, 1fr); }
  .contact-details { display: none; }
  .message-workspace.with-details.details-open { grid-template-columns: minmax(240px, 285px) minmax(0, 1fr) minmax(230px, 250px); }
  .message-workspace.with-details.details-open .contact-details { display: flex; }
}
@media (max-width: 760px) {
  .messages-page { padding: 16px 12px 20px; }
  .message-workspace,.message-workspace.with-details,.message-workspace.with-details.details-open { grid-template-columns: minmax(0, 1fr); }
  .message-sidebar,.message-thread { grid-column: 1; grid-row: 1; }
  .message-sidebar.mobile-hidden,.message-thread.mobile-hidden { display: none; }
  .folder-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
  }
  .folder-tabs button { flex: 0 0 auto; min-height: 42px; white-space: nowrap; }
  .contact-details { display: none !important; }
  .contact-details.mobile-details-open {
    position: absolute;
    z-index: 13;
    inset: 0 auto 0 0;
    display: flex !important;
    width: min(88vw, 380px);
    max-width: 100%;
    border: 0;
    border-radius: 0 14px 14px 0;
    box-shadow: 12px 0 36px rgba(13, 35, 23, .2);
  }
  .mobile-details-backdrop {
    position: absolute;
    z-index: 12;
    inset: 0;
    display: block;
    width: 100%;
    border: 0;
    background: rgba(12, 24, 18, .42);
  }
  .message-workspace { overflow: hidden; }
  .thread-header .icon-action,.thread-header .mobile-back { min-width: 40px; min-height: 40px; }
}


/* Live DESS account avatars */
.person-avatar,.contact-avatar,.participant-avatar,.message-author-avatar {
  position: relative;
  overflow: hidden;
}
.person-avatar img,.contact-avatar img,.participant-avatar img,.message-author-avatar img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}
.person-avatar > span,.contact-avatar > span,.participant-avatar > span,.message-author-avatar > span {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
}
.contact-avatar img { border: 0; }
.participant-avatar { overflow: hidden; }
.message-author-avatar {
  display: inline-grid;
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
  place-items: center;
  border-radius: 50%;
  color: #267a58;
  background: #e3f4e9;
  font-size: .58rem;
  font-weight: 750;
}
.message-author-avatar img { border-radius: 50%; }
.entry-byline { align-items: center; }

</style>