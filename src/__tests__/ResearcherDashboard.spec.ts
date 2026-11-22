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

async function mountDashboard(cases = [sharedCase]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const data = url.includes('/api/notifications')
      ? { notifications: [], unreadCount: 0 }
      : { closedCases: cases, openCaseFound: null }
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
  localStorage.clear()
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

  it('uses the saved page size and compact-list preference', async () => {
    localStorage.setItem('dess_settings', JSON.stringify({ itemsPerPage: 10, compactLists: true }))
    const cases = Array.from({ length: 12 }, (_, index) => ({
      ...sharedCase,
      _id: `case-${index}`,
      caseId: `2026-CASE-${index + 1}`,
      name: `Archived case ${index + 1}`
    }))
    const { wrapper } = await mountDashboard(cases)

    expect(wrapper.find('.researcher-page').classes()).toContain('compact-list-view')
    expect(wrapper.findAll('.case-table tbody tr')).toHaveLength(10)
    expect(wrapper.text()).toContain('Showing 1–10 of 12 cases')
    await wrapper.find('.pagination-actions button:last-child').trigger('click')
    expect(wrapper.findAll('.case-table tbody tr')).toHaveLength(2)
    expect(wrapper.text()).toContain('Showing 11–12 of 12 cases')
  })

  it('labels downloadable case material as investigator-approved evidence', async () => {
    const { wrapper } = await mountDashboard()
    await wrapper.find('.details-button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Download available files')
    expect(wrapper.text()).toContain('Research access is managed by the assigned DESS team.')
  })
})
