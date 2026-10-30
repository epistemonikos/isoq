import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import TableColumnFilter from '@/components/common/TableColumnFilter.vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

function mountFilter () {
  return mount(TableColumnFilter, {
    localVue,
    propsData: {
      allColumns: [{ key: 'country', label: 'Country' }, { key: 'context', label: 'Context' }],
      value: ['country', 'context']
    },
    mocks: { $t: key => key },
    stubs: { 'font-awesome-icon': true }
  })
}

describe('TableColumnFilter (#397)', () => {
  // The filter also opens inside scrollable modals (Adequacy, Relevance), where
  // the modal body clipped the top of the menu and hid "Show all".
  it('positions the menu against the visible viewport so a scrollable modal body cannot clip it', () => {
    const dropdown = mountFilter().findComponent({ name: 'BDropdown' })
    expect(dropdown.props('boundary')).toBe('viewport')
    expect(dropdown.props('popperOpts')).toEqual(expect.objectContaining({ positionFixed: true }))
  })

  it('gives the menu a width that does not depend on where it is positioned', () => {
    expect(mountFilter().find('.dropdown-menu').classes()).toContain('modal-safe-menu')
  })

  it('keeps a long menu scrollable within the viewport height', () => {
    // b-dropdown-form puts the style on its <li> wrapper, the box that scrolls.
    const menuBox = mountFilter().find('.b-dropdown-form').element.parentElement
    expect(menuBox.style.maxHeight).toBe('calc(100vh - 6rem)')
    expect(menuBox.style.overflowY).toBe('auto')
  })

  it('still renders Show all as the first row', () => {
    const labels = mountFilter().findAll('.custom-checkbox label').wrappers.map(l => l.text())
    expect(labels[0]).toBe('common.show_all')
  })
})
