import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import axios from 'axios'
import ProfileDashboard from '../components/ProfileDashboard.vue'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}))

const EmptyView = { template: '<div />' }
const user = {
  _id: 'researcher-123456789012',
  id: 'researcher-123456789012',
  name: 'Researcher Test',
  email: 'researcher@example.test',
  role: 'researcher',
  organizationName: 'Research Institute',
  organizationRole: 'Researcher',
  organizationIdNumber: 'ORG-23',
  profilePicture: '',
}
const verification = {
  emailVerified: false,
  identity: null,
  organization: null,
  selfieStatus: 'not_configured',
  livenessStatus: 'not_configured',
}

async function mountProfile() {
  sessionStorage.setItem('dess_token', 'test-token')
  sessionStorage.setItem('user', JSON.stringify(user))
  vi.mocked(axios.get).mockImplementation(async (url) => ({
    data: String(url).endsWith('/verification') ? verification : user,
  }) as never)
  vi.mocked(axios.patch).mockResolvedValue({ data: user } as never)
  vi.mocked(axios.post).mockResolvedValue({ data: { profilePicture: '/uploads/avatars/researcher-test.jpg' } } as never)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/researcher', component: EmptyView }],
  })
  await router.push('/researcher')
  await router.isReady()

  const wrapper = mount(ProfileDashboard, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

afterEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('ProfileDashboard', () => {
  it('loads account information and reflects unverified service states honestly', async () => {
    const wrapper = await mountProfile()

    expect(wrapper.text()).toContain('Researcher Test')
    expect(wrapper.text()).toContain('researcher@example.test')
    expect(wrapper.text()).toContain('Email Unverified')
    expect(wrapper.text()).toContain('Not Submitted')
    expect(wrapper.text()).toContain('Selfie Verification')
    expect(wrapper.text()).toContain('Liveness Check')
    expect(wrapper.text()).toContain('Not configured')
    expect(wrapper.text()).not.toContain('Face Match')
  })

  it('saves organization ID and profile changes through the authenticated profile API', async () => {
    const wrapper = await mountProfile()
    await wrapper.find('#organization-id-input').setValue('ORG-NEW-42')
    await wrapper.find('#name-input').setValue('Updated Researcher')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(axios.patch).toHaveBeenCalledWith(
      '/api/users/researcher-123456789012',
      expect.objectContaining({ name: 'Updated Researcher', organizationIdNumber: 'ORG-NEW-42' }),
      expect.objectContaining({ withCredentials: true }),
    )
    expect(wrapper.text()).toContain('Profile changes saved.')
  })

  it('uploads a selected avatar and updates the displayed profile image', async () => {
    const wrapper = await mountProfile()
    const file = new File(['test-avatar-image'], 'researcher.png', { type: 'image/png' })
    const input = wrapper.find('#avatar-input')

    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await flushPromises()

    expect(axios.post).toHaveBeenCalledWith(
      '/api/users/researcher-123456789012/avatar',
      expect.any(FormData),
      expect.objectContaining({ withCredentials: true }),
    )
    expect(wrapper.find('.profile-avatar').attributes('src')).toBe('/uploads/avatars/researcher-test.jpg')
  })
})
