import { mount } from '@vue/test-utils'
import printFooterMixin from '@/mixins/printFooterMixin'

// #416: el pie del PDF se pone sólo mientras se imprime (el botón llama a window.print(),
// que dispara beforeprint; Ctrl+P también) y se saca al terminar.
const STYLE = () => document.getElementById('isoq-print-footer')

function host (source) {
  return mount({
    mixins: [printFooterMixin],
    template: '<div />',
    methods: { printFooterSource: () => source }
  }, { mocks: { $t: k => k } })
}

const PUBLIC = { id: 'p1', organization: 'o1', name: 'My review', public_type: 'fully', license_type: 'CC-BY' }

afterEach(() => { if (STYLE()) STYLE().remove() })

describe('printFooterMixin', () => {
  it('adds the footer on beforeprint and removes it on afterprint', () => {
    const wrapper = host({ project: PUBLIC, findingNumber: 2 })
    expect(STYLE()).toBeNull()
    window.dispatchEvent(new Event('beforeprint'))
    expect(STYLE().textContent).toContain('My review — actionButtons.word_export.footer_finding 2')
    expect(STYLE().textContent).toContain('CC BY')
    window.dispatchEvent(new Event('afterprint'))
    expect(STYLE()).toBeNull()
    wrapper.destroy()
  })

  it('reads the project at print time, not at mount', () => {
    const source = { project: { ...PUBLIC, name: 'Old' } }
    const wrapper = host(source)
    source.project = { ...PUBLIC, name: 'Renamed' }
    window.dispatchEvent(new Event('beforeprint'))
    expect(STYLE().textContent).toContain('Renamed')
    wrapper.destroy()
  })

  it('without a project yet it adds nothing', () => {
    const wrapper = host(null)
    window.dispatchEvent(new Event('beforeprint'))
    expect(STYLE()).toBeNull()
    wrapper.destroy()
  })

  it('stops listening and cleans up when destroyed', () => {
    const wrapper = host({ project: PUBLIC })
    window.dispatchEvent(new Event('beforeprint'))
    wrapper.destroy()
    expect(STYLE()).toBeNull()
    window.dispatchEvent(new Event('beforeprint'))
    expect(STYLE()).toBeNull()
  })
})
