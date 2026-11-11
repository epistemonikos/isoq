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

// #412: people checked columns and then pressed the main modal's "Save", which
// closed the whole modal. The menu now holds the choice as a draft and applies it
// with its own "Apply" button; clicking outside applies too, Esc discards.
describe('TableColumnFilter — Apply button (#412)', () => {
  function mountAttached () {
    return mount(TableColumnFilter, {
      localVue,
      attachTo: document.body,
      propsData: {
        allColumns: [{ key: 'country', label: 'Country' }, { key: 'context', label: 'Context' }],
        value: ['country', 'context']
      },
      mocks: { $t: key => key },
      stubs: { 'font-awesome-icon': true }
    })
  }

  async function open (wrapper) {
    const dropdown = wrapper.findComponent({ name: 'BDropdown' })
    dropdown.vm.visible = true
    await wrapper.vm.$nextTick()
    return dropdown
  }

  const checkbox = (wrapper, label) =>
    wrapper.findAll('.custom-checkbox').wrappers.find(w => w.text() === label).find('input')
  const applyButton = wrapper => wrapper.find('[data-testid="column-filter-apply"]')
  const emitted = wrapper => wrapper.emitted('input') || []

  let wrapper
  afterEach(() => wrapper.destroy())

  it('does not change the table while the person is still choosing', async () => {
    wrapper = mountAttached()
    await open(wrapper)

    await checkbox(wrapper, 'Context').setChecked(false)

    expect(emitted(wrapper)).toEqual([])
    expect(checkbox(wrapper, 'Context').element.checked).toBe(false)
  })

  it('applies the choice and closes the menu when Apply is pressed', async () => {
    wrapper = mountAttached()
    const dropdown = await open(wrapper)
    await checkbox(wrapper, 'Context').setChecked(false)

    await applyButton(wrapper).trigger('click')

    expect(emitted(wrapper)).toEqual([[['country']]])
    expect(dropdown.vm.visible).toBe(false)
  })

  it('applies the choice when the menu closes by a click outside', async () => {
    jest.useFakeTimers()
    try {
      wrapper = mountAttached()
      const dropdown = await open(wrapper)
      await checkbox(wrapper, 'Context').setChecked(false)

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      jest.runAllTimers()
      await wrapper.vm.$nextTick()

      expect(dropdown.vm.visible).toBe(false)
      expect(emitted(wrapper)).toEqual([[['country']]])
    } finally {
      jest.useRealTimers()
    }
  })

  it('discards the choice when the menu closes with Esc', async () => {
    wrapper = mountAttached()
    const dropdown = await open(wrapper)
    await checkbox(wrapper, 'Context').setChecked(false)

    await checkbox(wrapper, 'Context').trigger('keydown', { key: 'Escape', keyCode: 27 })

    expect(dropdown.vm.visible).toBe(false)
    expect(emitted(wrapper)).toEqual([])
  })

  it('reopens on the applied columns, not on a discarded draft', async () => {
    wrapper = mountAttached()
    await open(wrapper)
    await checkbox(wrapper, 'Context').setChecked(false)
    await checkbox(wrapper, 'Context').trigger('keydown', { key: 'Escape', keyCode: 27 })

    await open(wrapper)

    expect(checkbox(wrapper, 'Context').element.checked).toBe(true)
  })

  it('emits nothing when the menu closes without changes', async () => {
    wrapper = mountAttached()
    await open(wrapper)

    await applyButton(wrapper).trigger('click')

    expect(emitted(wrapper)).toEqual([])
  })

  it('applies "Show all" from the draft as well', async () => {
    wrapper = mountAttached()
    await wrapper.setProps({ value: ['country'] })
    await open(wrapper)

    await checkbox(wrapper, 'common.show_all').setChecked(true)
    expect(emitted(wrapper)).toEqual([])

    await applyButton(wrapper).trigger('click')
    expect(emitted(wrapper)).toEqual([[['country', 'context']]])
  })

  it('keeps the last visible column checked in the draft', async () => {
    wrapper = mountAttached()
    await open(wrapper)
    await checkbox(wrapper, 'Context').setChecked(false)

    expect(checkbox(wrapper, 'Country').attributes('disabled')).toBe('disabled')
  })

  it('shows a labelled Apply button pinned to the bottom of the menu, after the last column', () => {
    wrapper = mountAttached()
    const button = applyButton(wrapper)

    expect(button.text()).toBe('common.apply')
    expect(button.element.closest('.table-column-filter__footer')).not.toBeNull()
    const form = wrapper.find('.b-dropdown-form').element
    expect(form.lastElementChild.classList.contains('table-column-filter__footer')).toBe(true)
  })
})
