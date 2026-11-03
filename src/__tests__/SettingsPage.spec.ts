import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import SettingsPage from '../views/SettingsPage.vue'

const EmptyView = { template: '<div />' }

async function mountSettings() {
  sessionStorage.setItem('user', JSON.stringify({ name: 'Researcher Test', email: 'researcher@example.test', role: 'researcher' }))
  sessionStorage.setItem('dess_user_role', 'researcher')
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/settings', component: SettingsPage },
      { path: '/researcher', component: EmptyView },
    ],
  })
  await router.push('/settings')
  await router.isReady()
  const wrapper = mount(SettingsPage, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('SettingsPage', () => {
  it('loads saved preferences and shows their summary', async () => {
    localStorage.setItem('dess_settings', JSON.stringify({ theme: 'dark', itemsPerPage: 50, weeklyDigest: false }))
    const { wrapper } = await mountSettings()

    expect((wrapper.find('#items-per-page').element as HTMLInputElement).value).toBe('50')
    expect(wrapper.text()).toContain('Dark')
    expect(wrapper.text()).toContain('50 items')
    expect(wrapper.text()).toContain('All changes saved')
  })

  it('saves changed preferences and returns researchers to their repository', async () => {
    const { wrapper, router } = await mountSettings()
    await wrapper.find('#critical-alerts').setValue(true)
    expect(wrapper.text()).toContain('Unsaved changes')
    await wrapper.find('.save-button').trigger('click')
    await flushPromises()

    expect(JSON.parse(localStorage.getItem('dess_settings') || '{}').criticalAlerts).toBe(true)
    expect(wrapper.text()).toContain('Preferences saved on this browser.')
    await wrapper.find('.settings-back').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/researcher')
  })
})
