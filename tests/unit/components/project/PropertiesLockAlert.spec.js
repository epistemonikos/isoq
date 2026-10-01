import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import PropertiesLockAlert from '@/components/project/PropertiesLockAlert.vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const $t = (key, params) => (params && params.user ? `${key}:${params.user}` : key)
const mountWith = (propsData) => mount(PropertiesLockAlert, { localVue, propsData, mocks: { $t } })

describe('PropertiesLockAlert', () => {
  it('denied dibuja el nombre de quien tiene el lock', () => {
    const w = mountWith({ status: 'denied', lockedBy: 'Ana' })
    expect(w.find('[data-testid="properties-lock-alert"]').text()).toContain('lock.properties_locked_by:Ana')
  })

  it('lost sin nombre dibuja el texto anónimo', () => {
    expect(mountWith({ status: 'lost', lockedBy: null }).text()).toContain('lock.properties_lost')
  })

  it.each(['idle', 'acquiring', 'held'])('%s no dibuja nada', (status) => {
    expect(mountWith({ status, lockedBy: null }).find('[data-testid="properties-lock-alert"]').exists()).toBe(false)
  })

  it('released_idle ofrece seguir y emite resume', async () => {
    const w = mountWith({ status: 'released_idle', lockedBy: null })
    await w.find('[data-testid="properties-lock-resume"]').trigger('click')
    expect(w.emitted('resume')).toHaveLength(1)
  })

  it('denied no ofrece botón: se destraba solo', () => {
    expect(mountWith({ status: 'denied', lockedBy: 'Ana' }).find('[data-testid="properties-lock-resume"]').exists()).toBe(false)
  })
})
