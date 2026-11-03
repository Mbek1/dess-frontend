import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import ResearcherDashboard from '../views/ResearcherDashboard.vue'

const EmptyView = { template: '<div />' }
const sharedCase = {
  _id: 'case-1',
  caseId: '2026-ABC-001',
  number: 1001,
  name: 'Archived case',
  caseType: 'criminal',
  description: 'Case description',
  status: 'closed',
  createdAt: '2026-10-30T12:00:00.000Z',
  updatedAt: '2026-10-30T12:00:00.000Z',
  evidence: [
    { _id: 'evidence-shared', availableToResearchers: true, name: 'Shared report', description: 'Approved for research', type: 'document', format: 'PDF', hash: 'public-hash' },
    { _id: 'evidence-restricted', availableToResearchers: false }
  ]
}

async function mountDashboard() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const data = url.includes('/api/notifications')
      ? { notifications: [], unreadCount: 0 }
      : { closedCases: [sharedCase], openCaseFound: null }
    return { ok: true, json: async () => data } as Response
  })
  vi.stubGlobal('fetch', fetchMock)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/researcher', component: ResearcherDashboard },
      { path: '/messages', component: EmptyView },
    ],
  })
  await router.push('/researcher')
  await router.isReady()
  const wrapper = mount(ResearcherDashboard, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router, fetchMock }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('ResearcherDashboard evidence access', () => {
  it('shows shared and restricted counts without exposing restricted evidence metadata', async () => {
    const { wrapper } = await mountDashboard()

    expect(wrapper.text()).toContain('1 shared')
    expect(wrapper.text()).toContain('1 restricted')
    await wrapper.find('.details-button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Shared report')
    expect(wrapper.text()).toContain('Approved for research')
    expect(wrapper.text()).toContain('1 restricted evidence item(s)')
    expect(wrapper.text()).not.toContain('evidence-restricted')
    expect(wrapper.text()).not.toContain('private-hash')
  })

  it('labels downloadable case material as investigator-approved evidence', async () => {
    const { wrapper } = await mountDashboard()
    await wrapper.find('.details-button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Download available files')
    expect(wrapper.text()).toContain('Research access is set by the case investigators.')
  })
})
