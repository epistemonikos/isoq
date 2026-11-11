import { mount } from '@vue/test-utils'
import LegalDocument from '@/components/legal/LegalDocument'

const PART = {
  heading: 'Part C — Cookie Policy',
  meta: 'Version 1.0 · Effective date: 1 December 2026',
  blocks: [
    { type: 'p', text: '**1.1 Provider.** The Platform <img src=x onerror="alert(1)">' },
    { type: 'h2', text: '1. Strictly necessary cookies' },
    { type: 'h3', text: 'References' },
    { type: 'ul', items: ['(a) first', '(b) **second**'] },
    { type: 'table', head: ['Name', 'Purpose'], rows: [['iSoQ session cookie', 'Keeps you logged in']] },
    { type: 'p', text: 'Representatives: [● name, address, email].' }
  ]
}

const FAQ = {
  heading: 'Part F — Frequently Asked Questions',
  intro: 'This FAQ summarises Parts A–E.',
  items: [
    { q: 'What is iSoQ?', a: 'A free platform.' },
    { q: 'Do I have to pay?', a: 'No.' }
  ]
}

const build = (part) => mount(LegalDocument, {
  propsData: { part },
  stubs: { 'font-awesome-icon': true }
})

describe('LegalDocument.vue', () => {
  it('shows the heading and the version line', () => {
    const wrapper = build(PART)
    expect(wrapper.find('h3').text()).toBe('Part C — Cookie Policy')
    expect(wrapper.find('.legal-meta').text()).toBe('Version 1.0 · Effective date: 1 December 2026')
  })

  it('renders sections, lists and bold text', () => {
    const wrapper = build(PART)
    expect(wrapper.find('h4').text()).toBe('1. Strictly necessary cookies')
    expect(wrapper.find('h5').text()).toBe('References')
    expect(wrapper.find('p strong').text()).toBe('1.1 Provider.')
    expect(wrapper.findAll('li').wrappers.map(li => li.text())).toEqual(['(a) first', '(b) second'])
    expect(wrapper.find('li strong').text()).toBe('second')
  })

  it('renders tables with their header row', () => {
    const wrapper = build(PART)
    expect(wrapper.findAll('th').wrappers.map(th => th.text())).toEqual(['Name', 'Purpose'])
    expect(wrapper.findAll('td').wrappers.map(td => td.text())).toEqual(['iSoQ session cookie', 'Keeps you logged in'])
  })

  it('wraps wide tables so they scroll instead of the page', () => {
    expect(build(PART).find('.table-responsive table').exists()).toBe(true)
  })

  it('never turns the text into markup', () => {
    const wrapper = build(PART)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('<img src=x onerror="alert(1)">')
  })

  it('highlights the placeholders legal has not filled yet', () => {
    expect(build(PART).find('mark.legal-placeholder').text()).toBe('[● name, address, email]')
  })

  // ─── FAQ ─────────────────────────────────────────────────────────────────────

  it('shows the FAQ as closed questions', () => {
    const wrapper = build(FAQ)
    expect(wrapper.text()).toContain('This FAQ summarises Parts A–E.')
    expect(wrapper.findAll('.faq-question').wrappers.map(q => q.text())).toEqual(['What is iSoQ?', 'Do I have to pay?'])
    expect(wrapper.find('.faq-answer').exists()).toBe(false)
  })

  it('opens and closes one question at a time', async () => {
    const wrapper = build(FAQ)
    const question = wrapper.findAll('.faq-question').at(1)

    await question.trigger('click')
    expect(wrapper.findAll('.faq-answer').wrappers.map(a => a.text())).toEqual(['No.'])
    expect(question.attributes('aria-expanded')).toBe('true')

    await question.trigger('click')
    expect(wrapper.find('.faq-answer').exists()).toBe(false)
  })

  it('keeps the open question when the text changes language', async () => {
    const wrapper = build(FAQ)
    await wrapper.findAll('.faq-question').at(0).trigger('click')

    await wrapper.setProps({ part: { ...FAQ, items: [{ q: '¿Qué es iSoQ?', a: 'Una plataforma gratuita.' }, FAQ.items[1]] } })

    expect(wrapper.find('.faq-answer').text()).toBe('Una plataforma gratuita.')
  })
})
