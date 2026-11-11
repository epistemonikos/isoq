import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import StepOnePresenceAlert from '@/components/project/StepOnePresenceAlert.vue'
import { STEP_ONE_PRESENCE } from '@/utils/stepOnePresence'
import en from '@/lang/en.json'
import es from '@/lang/es.json'
import pt from '@/lang/pt.json'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
const mountAlert = (presence) => mount(StepOnePresenceAlert, {
  localVue,
  propsData: { presence, currentUserId: 'me' },
  mocks: { $t: key => key }
})

// #399: a highlighted banner on Step 1 when someone else who can edit is there too.
describe('StepOnePresenceAlert', () => {
  it('warns when someone else is on Step 1', () => {
    const w = mountAlert([{ finding_id: STEP_ONE_PRESENCE, user_id: 'u-ana', user_name: 'Ana Soto' }])
    const alert = w.find('[data-testid="step-one-presence"]')
    expect(alert.exists()).toBe(true)
    expect(alert.html()).toContain('alert-warning')
    expect(alert.text()).toContain('presence.step_one_others')
  })

  it('stays hidden when only oneself is there', () => {
    const w = mountAlert([{ finding_id: STEP_ONE_PRESENCE, user_id: 'me', user_name: 'Me' }])
    expect(w.find('[data-testid="step-one-presence"]').exists()).toBe(false)
  })

  it('uses the wording product asked for, in every language', () => {
    expect(en.presence.step_one_others).toBe('Warning! Another user is working in Step 1. We recommend you view only (no editing).')
    expect(es.presence.step_one_others).toEqual(expect.any(String))
    expect(pt.presence.step_one_others).toEqual(expect.any(String))
  })
})
