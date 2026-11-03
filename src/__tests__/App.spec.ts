import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useRoute } from 'vue-router'
import App from '../App.vue'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
}))

describe('App', () => {
  it('hides application navigation on the landing page', () => {
    vi.mocked(useRoute).mockReturnValue({ path: '/' } as ReturnType<typeof useRoute>)

    const wrapper = mount(App, {
      global: {
        stubs: {
          AppNavigation: { template: '<nav data-test="app-navigation" />' },
          'router-view': { template: '<main data-test="route-content" />' },
        },
      },
    })

    expect(wrapper.find('[data-test="app-navigation"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="route-content"]').exists()).toBe(true)
  })

  it('shows application navigation on non-landing routes', () => {
    vi.mocked(useRoute).mockReturnValue({ path: '/investigator' } as ReturnType<typeof useRoute>)

    const wrapper = mount(App, {
      global: {
        stubs: {
          AppNavigation: { template: '<nav data-test="app-navigation" />' },
          'router-view': { template: '<main data-test="route-content" />' },
        },
      },
    })

    expect(wrapper.find('[data-test="app-navigation"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="route-content"]').exists()).toBe(true)
  })
})
