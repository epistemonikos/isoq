import { shallowMount, createLocalVue } from '@vue/test-utils'
import NotifyPlugin from '@/plugins/notify'

const TestComponent = { template: '<div></div>' }

describe('NotifyPlugin', () => {
  let localVue
  let mockToast
  let wrapper

  beforeEach(() => {
    localVue = createLocalVue()
    localVue.use(NotifyPlugin)
    mockToast = jest.fn()

    wrapper = shallowMount(TestComponent, {
      localVue,
      mocks: {
        $bvToast: { toast: mockToast },
        $t: (key) => key
      }
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('installs $notify on every Vue instance', () => {
    expect(wrapper.vm.$notify).toBeDefined()
    expect(typeof wrapper.vm.$notify.success).toBe('function')
    expect(typeof wrapper.vm.$notify.error).toBe('function')
    expect(typeof wrapper.vm.$notify.warning).toBe('function')
  })

  describe('$notify.success', () => {
    it('calls $bvToast.toast with success variant', () => {
      wrapper.vm.$notify.success('Saved!')
      expect(mockToast).toHaveBeenCalledWith('Saved!', expect.objectContaining({
        variant: 'success',
        solid: true
      }))
    })

    it('uses notifications.success as title', () => {
      wrapper.vm.$notify.success('Saved!')
      expect(mockToast).toHaveBeenCalledWith('Saved!', expect.objectContaining({
        title: 'notifications.success'
      }))
    })

    it('accepts options overrides', () => {
      wrapper.vm.$notify.success('Saved!', { autoHideDelay: 1000 })
      expect(mockToast).toHaveBeenCalledWith('Saved!', expect.objectContaining({
        autoHideDelay: 1000
      }))
    })
  })

  describe('$notify.error', () => {
    it('calls $bvToast.toast with danger variant', () => {
      wrapper.vm.$notify.error('Failed!')
      expect(mockToast).toHaveBeenCalledWith('Failed!', expect.objectContaining({
        variant: 'danger',
        solid: true
      }))
    })

    it('uses notifications.error as title', () => {
      wrapper.vm.$notify.error('Failed!')
      expect(mockToast).toHaveBeenCalledWith('Failed!', expect.objectContaining({
        title: 'notifications.error'
      }))
    })

    it('uses a longer autoHideDelay than success', () => {
      wrapper.vm.$notify.success('ok')
      wrapper.vm.$notify.error('fail')
      const successDelay = mockToast.mock.calls[0][1].autoHideDelay
      const errorDelay = mockToast.mock.calls[1][1].autoHideDelay
      expect(errorDelay).toBeGreaterThan(successDelay)
    })
  })

  describe('$notify.warning', () => {
    it('calls $bvToast.toast with warning variant', () => {
      wrapper.vm.$notify.warning('Heads up!')
      expect(mockToast).toHaveBeenCalledWith('Heads up!', expect.objectContaining({
        variant: 'warning',
        solid: true
      }))
    })

    it('uses notifications.warning as title', () => {
      wrapper.vm.$notify.warning('Heads up!')
      expect(mockToast).toHaveBeenCalledWith('Heads up!', expect.objectContaining({
        title: 'notifications.warning'
      }))
    })
  })

  describe('shared behavior', () => {
    it('always uses b-toaster-bottom-right', () => {
      wrapper.vm.$notify.success('ok')
      wrapper.vm.$notify.error('fail')
      wrapper.vm.$notify.warning('warn')
      mockToast.mock.calls.forEach(([, options]) => {
        expect(options.toaster).toBe('b-toaster-bottom-right')
      })
    })

    it('can override toaster position via options', () => {
      wrapper.vm.$notify.success('ok', { toaster: 'b-toaster-top-right' })
      expect(mockToast).toHaveBeenCalledWith('ok', expect.objectContaining({
        toaster: 'b-toaster-top-right'
      }))
    })
  })
})
