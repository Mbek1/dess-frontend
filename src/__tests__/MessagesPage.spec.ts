import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import axios from 'axios'
import MessagesPage from '../views/MessagesPage.vue'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const EmptyView = { template: '<div />' }
const recipient = {
  _id: 'investigator-2',
  name: 'Case Investigator',
  email: 'investigator@example.test',
  role: 'investigator',
  profilePicture: '/api/users/investigator-2/avatar?v=42'
}
const sentMessage = {
  _id: 'message-1',
  conversationId: 'conversation-1',
  senderId: 'researcher-1',
  senderName: 'Researcher Test',
  senderEmail: 'researcher@example.test',
  senderRole: 'researcher',
  recipientId: recipient._id,
  recipientName: recipient.name,
  recipientEmail: recipient.email,
  recipientRole: recipient.role,
  subject: 'Question about case',
  content: 'Please review this case reference.',
  type: 'case-related',
  priority: 'normal',
  read: false,
  status: 'delivered',
  caseId: 'case-1',
  caseNumber: '2026-001',
  senderProfilePicture: '/api/users/researcher-1/avatar?v=41',
  recipientProfilePicture: '/api/users/investigator-2/avatar?v=42',
  createdAt: new Date().toISOString(),
}
const caseChat = {
  _id: 'room-1',
  caseId: 'case-1',
  caseNumber: '2026-001',
  title: '2026-001 · Archived case',
  participants: [{
    _id: 'participant-record-1',
    userId: 'investigator-1',
    name: 'Investigator One',
    email: 'one@example.test',
    role: 'investigator',
    profilePicture: '/api/users/investigator-1/avatar?v=43'
  }],
  lastMessage: 'Team update',
  lastMessageAt: new Date().toISOString(),
  unreadCount: 0,
}

async function mountMessages(path = '/messages', role = 'researcher') {
  const messageSent = { value: false }
  sessionStorage.setItem('dess_token', 'test-token')
  sessionStorage.setItem('user', JSON.stringify({ id: 'researcher-1', name: 'Researcher Test', role }))
  vi.mocked(axios.get).mockImplementation(async (url) => {
    if (String(url).endsWith('/case-chats')) return { data: [caseChat] } as never
    if (String(url).endsWith('/case-chats/case-1/messages')) return { data: { chat: caseChat, messages: [] } } as never
    if (String(url).includes('/api/users?userId=')) return { data: [recipient] } as never
    if (String(url).includes('/api/messages/unread-count')) return { data: { unreadCount: 0 } } as never
    if (String(url).includes('/conversation/')) return { data: [sentMessage] } as never
    if (String(url).includes('/api/messages')) return { data: messageSent.value ? [sentMessage] : [] } as never
    return { data: [] } as never
  })
  vi.mocked(axios.post).mockImplementation(async () => {
    messageSent.value = true
    return { data: sentMessage } as never
  })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/messages', component: MessagesPage }, { path: '/investigator', component: EmptyView }],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(MessagesPage, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router, messageSent }
}

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('MessagesPage', () => {
  it('resolves case-contact recipients from the authenticated directory', async () => {
    const { wrapper } = await mountMessages('/messages?recipient=investigator-2&caseNumber=2026-001')

    expect(wrapper.text()).toContain('Compose message')
    expect(wrapper.text()).toContain('Case Investigator')
    expect(wrapper.text()).toContain('2026-001')
    expect(wrapper.find('img[alt="Case Investigator profile photo"]').attributes('src')).toContain('/api/users/investigator-2/avatar?v=42')
    expect(axios.get).toHaveBeenCalledWith(
      '/api/users?userId=investigator-2',
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    )
  })

  it('sends case context, then opens the conversation in the workspace', async () => {
    const { wrapper, router } = await mountMessages('/messages?recipient=investigator-2&caseNumber=2026-001')
    await wrapper.find('#message-subject').setValue('Question about case')
    await wrapper.find('#message-body').setValue('Please review this case reference.')
    await wrapper.find('.send-button').trigger('click')
    await flushPromises()

    expect(axios.post).toHaveBeenCalledWith(
      '/api/messages',
      expect.objectContaining({ recipientId: recipient._id, caseNumber: '2026-001' }),
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    )
    expect(router.currentRoute.value.query).toEqual({})
    expect(wrapper.text()).toContain('Case Investigator')
    expect(wrapper.text()).toContain('Message sent securely.')
  })

  it('uses the latest sender and recipient photos in direct message threads', async () => {
    const { wrapper, messageSent } = await mountMessages()
    messageSent.value = true

    const sentFolder = wrapper.findAll('.folder-tabs button').find(button => button.text().includes('Sent'))
    expect(sentFolder).toBeTruthy()
    await sentFolder!.trigger('click')
    await flushPromises()
    await wrapper.find('.conversation-row').trigger('click')
    await flushPromises()

    expect(wrapper.find('img[alt="Case Investigator profile photo"]').attributes('src')).toContain('/api/users/investigator-2/avatar?v=42')
    expect(wrapper.find('img[alt="Researcher Test profile photo"]').attributes('src')).toContain('/api/users/researcher-1/avatar?v=41')
  })

  it('opens investigators on their case rooms and refreshes them when a case is created', async () => {
    const { wrapper } = await mountMessages('/messages', 'investigator')
    const caseRoomsTab = wrapper.findAll('.folder-tabs button').find(button => button.text().includes('Case rooms'))
    expect(caseRoomsTab).toBeTruthy()
    expect(caseRoomsTab!.attributes('aria-selected')).toBe('true')
    expect(axios.get).toHaveBeenCalledWith(
      '/api/messages/case-chats',
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    )

    window.dispatchEvent(new CustomEvent('dess-case-created'))
    await flushPromises()
    expect(axios.get).toHaveBeenCalledTimes(expect.any(Number))
    expect(wrapper.text()).toContain('2026-001 · Archived case')
  })

  it('opens and closes case-room details as a drawer on mobile and the back button returns to the room list', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
    const { wrapper } = await mountMessages('/messages', 'investigator')
    await flushPromises()
    await wrapper.find('.conversation-row').trigger('click')
    await flushPromises()

    const detailsButton = wrapper.find('button[aria-label="Toggle case room details"]')
    expect(detailsButton.attributes('aria-expanded')).toBe('false')
    await detailsButton.trigger('click')
    expect(wrapper.find('.contact-details.mobile-details-open').exists()).toBe(true)

    await wrapper.find('button[aria-label="Close details panel"]').trigger('click')
    expect(wrapper.find('.contact-details.mobile-details-open').exists()).toBe(false)

    await wrapper.find('.mobile-back').trigger('click')
    expect(wrapper.find('.message-sidebar.mobile-hidden').exists()).toBe(false)
    expect(wrapper.find('.message-thread.mobile-hidden').exists()).toBe(true)
  })

  it('shows case rooms only to investigators and supports group replies', async () => {
    const { wrapper } = await mountMessages('/messages', 'investigator')
    const roomTab = wrapper.findAll('.folder-tabs button').find(button => button.text().includes('Case rooms'))
    expect(roomTab).toBeTruthy()
    await roomTab!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('2026-001 · Archived case')
    await wrapper.find('.conversation-row').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('assigned DESS users')
    expect(wrapper.text()).toContain('Room information')
    expect(wrapper.text()).toContain('Assigned DESS users')
    expect(wrapper.find('img[alt="Investigator One profile photo"]').attributes('src')).toContain('/api/users/investigator-1/avatar?v=43')
    await wrapper.find('#case-chat-body').setValue('Group status update')
    await wrapper.find('.reply-composer').trigger('submit')
    await flushPromises()

    expect(axios.post).toHaveBeenCalledWith(
      '/api/messages/case-chats/case-1/messages',
      { content: 'Group status update' },
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    )

    const researcher = await mountMessages('/messages', 'researcher')
    expect(researcher.wrapper.text()).not.toContain('Case rooms')
  })
})
