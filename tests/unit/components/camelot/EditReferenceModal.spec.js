import { shallowMount } from '@vue/test-utils'
import EditReferenceModal from '@/components/camelot/EditReferenceModal.vue'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'

// Mock Api
jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} }))
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn()
}))

const $t = (key) => key
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

describe('EditReferenceModal.vue', () => {
  let wrapper
  const mockCamelot = {
    fields: [{ key: 'field1', label: 'Field 1' }],
    categories: [
      {
        key: 'cat1',
        label: 'Category 1',
        options: [{ key: 'field1', label: 'Field 1' }]
      }
    ]
  }
  const mockCharsData = {
    id: 'char1',
    fields: [
      { key: 'authors', label: 'Authors' },
      { key: 'column_1', label: 'Custom Field 1' },
      { key: 'design_extractedData', label: 'Study Design' },
      { key: 'design_comments', label: 'Concerns' }
    ],
    items: []
  }
  const mockReference = {
    id: 'ref1',
    authors: ['Smith, J'],
    publication_year: '2020',
    column_1: 'Custom Value',
    design_extractedData: 'Data Value',
    design_comments: 'Concern Value'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(EditReferenceModal, {
      propsData: {
        reference: mockReference,
        charsData: mockCharsData,
        camelot: mockCamelot
      },
      mocks: {
        $t,
        $route: { params: { org_id: 'org1', id: 'proj1' } },
        $bvModal: {
          show: jest.fn(),
          hide: jest.fn()
        },
        $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
      },
      stubs: {
        'b-modal': true,
        'b-row': true,
        'b-col': true,
        'b-card': true,
        'b-card-body': true,
        'b-form-textarea': true,
        'CustomFieldsManager': true
      }
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('initializes editForm and localReference from reference prop', () => {
    expect(wrapper.vm.localReference.id).toBe('ref1')
    expect(wrapper.vm.editForm.id).toBe('ref1')
  })

  it('calls Api.patch (partial /item/{refId}) when handleModalOk is triggered', async () => {
    await wrapper.vm.handleModalOk()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_characteristics/char1/item/ref1',
      expect.objectContaining({
        ref_id: 'ref1',
        authors: 'Smith 2020',
        column_1: 'Custom Value',
        design_extractedData: 'Data Value',
        design_comments: 'Concern Value'
      })
    )
    expect(wrapper.emitted('saved')).toBeTruthy()
  })

  describe('hasInvalidCustomFields', () => {
    it('returns false when all non-Camelot fields have labels', async () => {
      await wrapper.setData({
        customFields: [
          { isCamelot: false, locked: false, label: 'My column' },
          { isCamelot: true, locked: true, label: 'Camelot field' }
        ]
      })
      expect(wrapper.vm.hasInvalidCustomFields).toBe(false)
    })

    it('returns true when a non-Camelot field has an empty label', async () => {
      await wrapper.setData({
        customFields: [
          { isCamelot: false, locked: false, label: '' }
        ]
      })
      expect(wrapper.vm.hasInvalidCustomFields).toBe(true)
    })

    it('returns true when a non-Camelot field has a whitespace-only label', async () => {
      await wrapper.setData({
        customFields: [
          { isCamelot: false, locked: false, label: '   ' }
        ]
      })
      expect(wrapper.vm.hasInvalidCustomFields).toBe(true)
    })

    it('ignores Camelot fields with empty labels', async () => {
      await wrapper.setData({
        customFields: [
          { isCamelot: true, locked: true, label: '' }
        ]
      })
      expect(wrapper.vm.hasInvalidCustomFields).toBe(false)
    })

    it('returns false when there are no custom fields', async () => {
      await wrapper.setData({ customFields: [] })
      expect(wrapper.vm.hasInvalidCustomFields).toBe(false)
    })
  })

  describe('performSave()', () => {
    const fullCharsDoc = {
      id: 'char1',
      _id: 'char1-db',
      project_id: 'proj1',
      fields: [
        { key: 'authors', label: 'Authors' },
        { key: 'column_1', label: 'Custom Field 1' }
      ],
      items: [
        { ref_id: 'ref1', authors: 'Smith 2020', column_1: 'Value A' },
        { ref_id: 'ref2', authors: 'Doe 2021', column_1: 'Value B' }
      ]
    }

    it('usa PATCH parcial /item/{refId} y emite saved con el doc completo del backend', async () => {
      // El backend del PATCH parcial devuelve el documento completo actualizado.
      Api.patch.mockResolvedValue({ data: fullCharsDoc })

      await wrapper.vm.handleModalOk()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(Api.patch).toHaveBeenCalledWith(
        '/isoqf_characteristics/char1/item/ref1',
        expect.objectContaining({ ref_id: 'ref1' })
      )
      // Ya NO se llama al endpoint del documento completo.
      expect(Api.patch).not.toHaveBeenCalledWith(
        expect.stringMatching(/\/isoqf_characteristics\/char1\/$/),
        expect.any(Object)
      )

      expect(wrapper.emitted('saved')).toBeTruthy()
      const emittedData = wrapper.emitted('saved')[0][0]
      expect(emittedData.items).toBeDefined()
      expect(emittedData.items.find(i => i.ref_id === 'ref2')).toBeDefined()
    })

    it('emits saved using _id from server response when available', async () => {
      const serverResponse = { ...fullCharsDoc, _id: 'char1-db-updated' }
      Api.patch.mockResolvedValue({ data: serverResponse })

      await wrapper.vm.handleModalOk()
      await new Promise(resolve => setTimeout(resolve, 0))

      const emittedData = wrapper.emitted('saved')[0][0]
      expect(emittedData._id).toBe('char1-db-updated')
    })
  })

  describe('EditReferenceModal.vue — lock granular', () => {
    beforeEach(() => jest.clearAllMocks())

    it('llama acquireRef con projectId y refId cuando el modal se muestra', async () => {
      LockService.acquireRef.mockResolvedValue({ success: true })
      await wrapper.vm.onModalShown()
      await flushPromises()
      expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'ref1')
      expect(wrapper.vm.isReadOnly).toBe(false)
    })

    it('deshabilita edición (isReadOnly=true) cuando acquireRef retorna 409', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana López' })
      await wrapper.vm.onModalShown()
      await flushPromises()
      expect(wrapper.vm.isReadOnly).toBe(true)
      expect(wrapper.vm.lockedByUser).toBe('Ana López')
      expect(wrapper.vm.$notify.warning).toHaveBeenCalledWith('lock.ref_locked_by')
    })

    it('deshabilita edición SIN nombre de usuario y avisa "permisos revocados" cuando acquireRef retorna permissionDenied (403)', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, permissionDenied: true })
      await wrapper.vm.onModalShown()
      await flushPromises()
      expect(wrapper.vm.isReadOnly).toBe(true)
      expect(wrapper.vm.lockedByUser).toBeNull()
      expect(wrapper.vm.$notify.warning).toHaveBeenCalledWith('lock.permissions_revoked')
    })

    it('llama releaseRef en resetModal', () => {
      wrapper.vm.resetModal()
      expect(LockService.releaseRef).toHaveBeenCalled()
    })

    it('no guarda (no llama Api.patch) cuando isReadOnly es true', async () => {
      await wrapper.setData({ isReadOnly: true })
      await wrapper.vm.performSave(false)
      await flushPromises()
      expect(Api.patch).not.toHaveBeenCalled()
    })
  })

  // Third editor with the same double message: the conflict toast plus a generic
  // "could not save, please try again" that cannot be acted on.
  describe('rechazo por lock al guardar', () => {
    const rejection = (status) => Object.assign(new Error('rejected'), {
      config: { url: '/isoqf_characteristics/char1/item/ref1' },
      response: { status, data: {} }
    })

    it('no agrega el error genérico cuando el guardado se rechaza por el lock', async () => {
      Api.patch.mockRejectedValue(rejection(409))

      await wrapper.vm.performSave(true)
      await flushPromises()

      expect(wrapper.vm.$notify.error).not.toHaveBeenCalled()
    })

    it('sí avisa cuando el guardado falla por el servidor', async () => {
      Api.patch.mockRejectedValue(rejection(500))

      await wrapper.vm.performSave(true)
      await flushPromises()

      expect(wrapper.vm.$notify.error).toHaveBeenCalledWith('notifications.save_error')
    })
  })

  // Step 3's editor had the same hole as Step 4's: it listened for the conflict on
  // save but not for the lock going away, so a study taken over mid-edit stayed fully
  // writable on screen.
  describe('pérdida del lock con el editor abierto', () => {
    it('pasa a solo lectura cuando pierde el lock del estudio abierto', async () => {
      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: 'ref1', lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()

      expect(wrapper.vm.isReadOnly).toBe(true)
      expect(wrapper.vm.lockedByUser).toBe('Ana Pérez')
    })

    it('ignora la pérdida del lock de otro estudio', async () => {
      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: 'ref9', lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()

      expect(wrapper.vm.isReadOnly).toBe(false)
    })

    it('deja de escuchar el aviso al destruirse', () => {
      const removeSpy = jest.spyOn(window, 'removeEventListener')
      wrapper.destroy()
      expect(removeSpy).toHaveBeenCalledWith('ref-lock-lost', expect.any(Function))
      removeSpy.mockRestore()
    })
  })
})
