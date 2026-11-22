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
    localStorage.setItem('dess_settings', JSON.stringify({ theme: 'dark', itemsPerPage: 50, showMessagePreviews: false }))
    const { wrapper } = await mountSettings()

    expect((wrapper.find('#items-per-page').element as HTMLInputElement).value).toBe('50')
    expect(wrapper.text()).toContain('Dark')
    expect(wrapper.text()).toContain('50 cases')
    expect(wrapper.text()).toContain('Hidden')
    expect(wrapper.text()).toContain('All changes saved')
    expect(document.documentElement.dataset.dessTheme).toBe('dark')
  })

  it('saves changed preferences and returns researchers to their repository', async () => {
    const { wrapper, router } = await mountSettings()
    await wrapper.find('#compact-lists').setValue(true)
    await wrapper.find('#message-previews').setValue(false)
    await wrapper.find('#items-per-page').setValue('50')
    expect(wrapper.text()).toContain('Unsaved changes')
    await wrapper.find('.save-button').trigger('click')
    await flushPromises()

    const savedSettings = JSON.parse(localStorage.getItem('dess_settings') || '{}')
    expect(savedSettings.compactLists).toBe(true)
    expect(savedSettings.showMessagePreviews).toBe(false)
    expect(savedSettings.itemsPerPage).toBe(50)
    expect(wrapper.text()).toContain('Preferences saved and applied.')
    await wrapper.find('.settings-back').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/researcher')
  })
})
