import { shallowMount } from '@vue/test-utils'
import CustomFieldsManager from '@/components/camelot/CustomFieldsManager.vue'

jest.mock('vuedraggable', () => ({ render: h => h('div') }))

function createWrapper (fields = []) {
  return shallowMount(CustomFieldsManager, {
    propsData: { fields },
    mocks: { $t: key => key },
    stubs: {
      'b-card': true,
      'b-button': true,
      'b-form-group': { template: '<div><slot/><slot name="invalid-feedback"/></div>' },
      'b-form-input': true,
      'b-form-textarea': true,
      'b-form-invalid-feedback': true,
      'b-sidebar': true,
      draggable: { template: '<div><slot/></div>' }
    }
  })
}

describe('CustomFieldsManager.vue', () => {
  describe('touchedLabelIds tracking', () => {
    it('starts with an empty touchedLabelIds array', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.touchedLabelIds).toEqual([])
    })

    it('markLabelTouched adds an id to touchedLabelIds', () => {
      const wrapper = createWrapper()
      wrapper.vm.markLabelTouched('field_123')
      expect(wrapper.vm.touchedLabelIds).toContain('field_123')
    })

    it('markLabelTouched does not add duplicate ids', () => {
      const wrapper = createWrapper()
      wrapper.vm.markLabelTouched('field_123')
      wrapper.vm.markLabelTouched('field_123')
      expect(wrapper.vm.touchedLabelIds.filter(id => id === 'field_123')).toHaveLength(1)
    })

    it('markLabelTouched ignores falsy ids', () => {
      const wrapper = createWrapper()
      wrapper.vm.markLabelTouched(null)
      wrapper.vm.markLabelTouched(undefined)
      wrapper.vm.markLabelTouched('')
      expect(wrapper.vm.touchedLabelIds).toHaveLength(0)
    })

    it('removeField cleans up the removed field id from touchedLabelIds', async () => {
      const wrapper = createWrapper([{ id: 'field_abc', label: '', value: '' }])
      await wrapper.vm.$nextTick()
      wrapper.vm.markLabelTouched('field_abc')
      expect(wrapper.vm.touchedLabelIds).toContain('field_abc')

      wrapper.vm.removeField(0)
      expect(wrapper.vm.touchedLabelIds).not.toContain('field_abc')
    })
  })

  describe('getLabelState', () => {
    it('returns null when field has not been touched', () => {
      const wrapper = createWrapper()
      const field = { id: 'field_1', label: '' }
      expect(wrapper.vm.getLabelState(field)).toBe(null)
    })

    it('returns false when field has been touched and label is empty', () => {
      const wrapper = createWrapper()
      const field = { id: 'field_1', label: '' }
      wrapper.vm.markLabelTouched('field_1')
      expect(wrapper.vm.getLabelState(field)).toBe(false)
    })

    it('returns false when field has been touched and label is whitespace only', () => {
      const wrapper = createWrapper()
      const field = { id: 'field_1', label: '   ' }
      wrapper.vm.markLabelTouched('field_1')
      expect(wrapper.vm.getLabelState(field)).toBe(false)
    })

    it('returns null when field has been touched and label has content', () => {
      const wrapper = createWrapper()
      const field = { id: 'field_1', label: 'My column' }
      wrapper.vm.markLabelTouched('field_1')
      expect(wrapper.vm.getLabelState(field)).toBe(null)
    })
  })

  describe('addField', () => {
    it('adds a new field to localFields', () => {
      const wrapper = createWrapper()
      wrapper.vm.addField()
      expect(wrapper.vm.localFields).toHaveLength(1)
    })

    it('new field starts with empty label and is not in touchedLabelIds', () => {
      const wrapper = createWrapper()
      wrapper.vm.addField()
      const newField = wrapper.vm.localFields[0]
      expect(newField.label).toBe('')
      expect(wrapper.vm.touchedLabelIds).not.toContain(newField.id)
    })
  })
})
