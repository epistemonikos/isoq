import { shallowMount, createLocalVue } from '@vue/test-utils'
import RefLockConflictModal from '@/components/camelot/RefLockConflictModal.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

describe('RefLockConflictModal.vue', () => {
  const mockConflictData = {
    lockedBy: 'Ana López',
    failedData: { ref_id: 'ref1', campo1: 'valor A', campo2: 'valor B' },
    refId: 'ref1'
  }

  it('muestra el nombre del usuario que tomó el lock', () => {
    const wrapper = shallowMount(RefLockConflictModal, {
      localVue,
      propsData: mockConflictData,
      mocks: { $t: (key, params) => params ? `${key} ${JSON.stringify(params)}` : key }
    })
    expect(wrapper.text()).toContain('Ana López')
    wrapper.destroy()
  })

  it('muestra los campos fallidos como texto copiable', () => {
    const wrapper = shallowMount(RefLockConflictModal, {
      localVue,
      propsData: mockConflictData,
      mocks: { $t: (key) => key }
    })
    // Los valores no-sistema se exponen como campos copiables
    expect(wrapper.vm.conflictFields).toEqual({ campo1: 'valor A', campo2: 'valor B' })
    wrapper.destroy()
  })

  it('emite "closed" al cerrar', () => {
    const wrapper = shallowMount(RefLockConflictModal, {
      localVue,
      propsData: mockConflictData,
      mocks: { $t: (key) => key }
    })
    wrapper.vm.onClose()
    expect(wrapper.emitted('closed')).toBeTruthy()
    wrapper.destroy()
  })

  it('excluye ref_id/authors/id/_id de los campos copiables', () => {
    const wrapper = shallowMount(RefLockConflictModal, {
      localVue,
      propsData: {
        lockedBy: 'Ana',
        refId: 'ref1',
        failedData: { ref_id: 'ref1', authors: 'X', id: 'i', _id: 'j', campo1: 'v' }
      },
      mocks: { $t: (key) => key }
    })
    expect(wrapper.vm.conflictFields).toEqual({ campo1: 'v' })
    wrapper.destroy()
  })
})
