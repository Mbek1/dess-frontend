import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import axios from 'axios'
import AppNavigation from '../components/AppNavigation.vue'

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { notifications: [], unreadCount: 0 } }),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const EmptyView = { template: '<div />' }

async function mountResearcherNavigation(initialPath = '/researcher') {
  vi.mocked(axios.get).mockResolvedValue({ data: { notifications: [], unreadCount: 0 } } as never)
  sessionStorage.setItem('dess_token', 'test-token')
  sessionStorage.setItem('user', JSON.stringify({ id: 'researcher-1', name: 'Researcher', role: 'researcher' }))
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/researcher', component: EmptyView },
      { path: '/researcher-profile', component: EmptyView },
      { path: '/messages', component: EmptyView },
      { path: '/settings', component: EmptyView },
      { path: '/archives', component: EmptyView },
      { path: '/investigator', component: EmptyView },
      { path: '/login', component: EmptyView },
      { path: '/', component: EmptyView },
    ],
  })
  await router.push(initialPath)
  await router.isReady()
  const wrapper = mount(AppNavigation, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

afterEach(() => {
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('researcher navigation', () => {
  it('only shows researcher-appropriate destinations', async () => {
    const { wrapper } = await mountResearcherNavigation()
    const links = wrapper.findAll('a').map(link => link.text())

    expect(links.some(link => link.includes('Repository'))).toBe(true)
    expect(links.some(link => link.includes('Archives'))).toBe(false)
    expect(wrapper.text()).not.toContain('Create Case')
    expect(wrapper.find('.navbar-brand').attributes('href')).toBe('/researcher')
  })

  it('routes profile to the researcher profile and opens persisted notifications in place', async () => {
    const { wrapper, router } = await mountResearcherNavigation('/researcher-profile')
    await wrapper.find('button[title="Profile"]').trigger('click')
    await wrapper.findAll('a.dropdown-item').find(link => link.text().includes('My Profile'))?.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/researcher-profile')

    await wrapper.find('button[title="Notifications"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('.notification-dropdown').exists()).toBe(true)
    expect(axios.get).toHaveBeenCalledWith('/api/notifications?limit=30', expect.any(Object))
    expect(router.currentRoute.value.path).toBe('/researcher-profile')
    expect(router.currentRoute.value.path).not.toBe('/investigator')
  })

  it('opens the shared internal messaging workspace', async () => {
    const { wrapper, router } = await mountResearcherNavigation()
    await wrapper.find('button[title="Messages"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/messages')
  })
})
