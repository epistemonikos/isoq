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

  // The modal's default copy opens with "While you were offline". Shown after a live
  // 409 it contradicts what the user just experienced, so the source decides the text.
  it('usa el mensaje de conflicto en vivo cuando el rechazo no vino de la cola offline', () => {
    const wrapper = shallowMount(RefLockConflictModal, {
      localVue,
      propsData: { ...mockConflictData, source: 'live' },
      mocks: { $t: (key) => key }
    })
    expect(wrapper.vm.conflictMessageKey).toBe('lock.ref_conflict_message_live')
    wrapper.destroy()
  })

  it('conserva el mensaje offline cuando el rechazo vino de la cola', () => {
    const wrapper = shallowMount(RefLockConflictModal, {
      localVue,
      propsData: { ...mockConflictData, source: 'replay' },
      mocks: { $t: (key) => key }
    })
    expect(wrapper.vm.conflictMessageKey).toBe('lock.ref_conflict_message')
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

  // El payload que falló es la fila entera, así que arrastra el contador de versión que
  // el servidor guarda dentro de ella. Ofrecerlo como campo copiable le presenta al
  // usuario un número interno como si fuera algo que escribió.
  it('excluye el contador de versión de los campos copiables', () => {
    const wrapper = shallowMount(RefLockConflictModal, {
      localVue,
      propsData: {
        lockedBy: 'Ana',
        refId: 'ref1',
        failedData: { ref_id: 'ref1', _v: 4, campo1: 'v' }
      },
      mocks: { $t: (key) => key }
    })
    expect(wrapper.vm.conflictFields).toEqual({ campo1: 'v' })
    wrapper.destroy()
  })
})
