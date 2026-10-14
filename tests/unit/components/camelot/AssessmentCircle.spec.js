import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import AssessmentCircle from '@/components/camelot/AssessmentCircle.vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const RESPONSES = [{ text: 'No concerns', value: 'A', color: '#1065AB' }]

const build = (option, text, extraProps = {}) => mount(AssessmentCircle, {
  localVue,
  propsData: {
    stage: 0,
    optionIndex: 0,
    item: { stages: [{ options: [{ option, text }] }] },
    responses: RESPONSES,
    ...extraProps
  },
  mocks: { $t: (msg) => msg },
  stubs: { 'font-awesome-icon': { template: '<i class="fa-stub"></i>' } }
})

describe('AssessmentCircle.vue', () => {
  it('shows an exclamation mark when the assessment has no explanation', () => {
    expect(build('A', '').find('.fa-stub').exists()).toBe(true)
  })

  it('shows no exclamation mark once an explanation exists', () => {
    expect(build('A', 'Because of X').find('.fa-stub').exists()).toBe(false)
  })

  it('shows no exclamation mark on an unassessed cell', () => {
    expect(build(null, '').find('.fa-stub').exists()).toBe(false)
  })

  it('keeps the assessment colour as fill and rings it when the explanation is missing', () => {
    const circle = build('A', '').find('.assessment-circle')
    expect(circle.classes()).toContain('circle-incomplete')
    // jsdom serialises background-color as rgb() and border-color as the hex
    const style = circle.attributes('style').toLowerCase()
    expect(style).toContain('background-color: rgb(16, 101, 171)')
    expect(style).toContain('border-color: #ffffff')
  })

  it('describes the missing explanation for assistive tech', () => {
    expect(build('A', '').find('.assessment-circle').attributes('title'))
      .toBe('camelot.step_four.no_explanation')
  })

  it('carries no title when the assessment is complete', () => {
    expect(build('A', 'Because of X').find('.assessment-circle').attributes('title'))
      .toBeFalsy()
  })

  it('emits click so the parent can open the modal', () => {
    const wrapper = build('A', '')
    wrapper.find('.assessment-circle').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  // The summary table already shows the response text on hover; the warning has
  // to be added to it, not replace it.
  it('appends the warning to a caller-supplied tooltip', () => {
    expect(build('A', '', { tooltip: 'No concerns' }).find('.assessment-circle').attributes('title'))
      .toBe('No concerns — camelot.step_four.no_explanation')
  })

  it('keeps the caller tooltip untouched when the assessment is complete', () => {
    expect(build('A', 'why', { tooltip: 'No concerns' }).find('.assessment-circle').attributes('title'))
      .toBe('No concerns')
  })
})
