import { mount, createLocalVue } from '@vue/test-utils'
import AssessmentForm from '@/components/camelot/assessment/AssessmentForm.vue'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'

const localVue = createLocalVue()

jest.mock('@/utils/Api')
jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn()
}))

describe('AssessmentForm.vue', () => {
  let wrapper
  const propsData = {
    selectedMeta: 0,
    modalStage: 0,
    modalIndex: 0,
    refId: 'ref1',
    assessments: {
      id: 'assess1',
      items: [
        {
          ref_id: 'ref1',
          authors: 'Author 2024',
          stages: [
            {
              key: 0,
              options: [
                { option: null, text: '', notes: '' },
                { option: null, text: '', notes: '' },
                { option: null, text: '', notes: '' },
                { option: null, text: '', notes: '' }
              ]
            }
          ]
        }
      ]
    }
  }

  const $t = (key) => key
  const $bvModal = {
    show: jest.fn(),
    hide: jest.fn()
  }
  const $notify = {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockResolvedValue({ data: [] })
    // clearAllMocks no resetea implementaciones → re-establecer el default de acquireRef
    LockService.acquireRef.mockResolvedValue({ success: true })
    wrapper = mount(AssessmentForm, {
      localVue,
      propsData,
      mocks: {
        $t,
        $route: {
          params: {
            org_id: 'org1',
            id: 'proj1'
          }
        },
        $bvModal,
        $notify
      },
      stubs: {
        'b-card': true,
        'b-form-group': true,
        'b-form-radio-group': true,
        'b-form-radio': true,
        'b-form-textarea': true,
        'b-button': true,
        'b-modal': true
      }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('shows warning modal when saving with an option selected but no explanation', async () => {
    await wrapper.setData({
      selected: 'B',
      text1: '' // Empty explanation
    })
    
    // Trigger save
    await wrapper.vm.save()
    
    // Should show warning modal instead of calling API immediately
    expect($bvModal.show).toHaveBeenCalledWith('warning-explanation-modal-0-0')
    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('proceeds with save when "Do it later" is clicked', async () => {
    Api.patch.mockResolvedValue({ data: {} })

    await wrapper.setData({
      selected: 'B',
      text1: ''
    })

    // Simulate clicking "Do it later"
    await wrapper.vm.doItLater()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(Api.patch).toHaveBeenCalled()
    expect($bvModal.hide).toHaveBeenCalledWith('warning-explanation-modal-0-0')
  })

  it('cancels save and focuses explanation when "Do it now" is clicked', async () => {
    // We need to mock focus on the element
    const focusSpy = jest.fn()
    document.getElementById = jest.fn().mockReturnValue({ focus: focusSpy })
    
    await wrapper.vm.doItNow()
    
    expect($bvModal.hide).toHaveBeenCalledWith('warning-explanation-modal-0-0')
    expect(focusSpy).toHaveBeenCalled()
  })

  it('saves directly if explanation is present', async () => {
    Api.patch.mockResolvedValue({ data: {} })

    await wrapper.setData({
      selected: 'B',
      text1: 'Some explanation'
    })

    await wrapper.vm.save()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(Api.patch).toHaveBeenCalled()
    expect($bvModal.show).not.toHaveBeenCalledWith('warning-explanation-modal-0-0')
  })

  describe('user notifications', () => {
    it('shows success notification after successful patch', async () => {
      Api.patch.mockResolvedValue({ data: {} })
      await wrapper.setData({ selected: 'B', text1: 'Explanation' })
      await wrapper.vm.save()
      await new Promise(resolve => setTimeout(resolve, 0))
      expect($notify.success).toHaveBeenCalledWith('notifications.saved')
    })

    it('shows error notification when patch fails', async () => {
      Api.patch.mockRejectedValue(new Error('network error'))
      await wrapper.setData({ selected: 'B', text1: 'Explanation' })
      await wrapper.vm.save()
      await new Promise(resolve => setTimeout(resolve, 0))
      expect($notify.error).toHaveBeenCalledWith('notifications.save_error')
    })

    it('shows success notification after successful post (new assessment)', async () => {
      const propsWithoutId = {
        ...propsData,
        assessments: { items: [{ ref_id: 'ref1', stages: [{ key: 0, options: [{ option: null, text: '' }] }] }] }
      }
      Api.post.mockResolvedValue({ data: {} })
      const localWrapper = mount(AssessmentForm, {
        localVue,
        propsData: propsWithoutId,
        mocks: { $t, $route: { params: { org_id: 'org1', id: 'proj1' } }, $bvModal, $notify }
      })
      await localWrapper.setData({ selected: 'A', text1: 'Explanation' })
      await localWrapper.vm.save()
      await localWrapper.vm.$nextTick()
      expect($notify.success).toHaveBeenCalledWith('notifications.saved')
      localWrapper.destroy()
    })

    it('shows error notification when post fails', async () => {
      const propsWithoutId = {
        ...propsData,
        assessments: { items: [{ ref_id: 'ref1', stages: [{ key: 0, options: [{ option: null, text: '' }] }] }] }
      }
      Api.post.mockRejectedValue(new Error('network error'))
      const localWrapper = mount(AssessmentForm, {
        localVue,
        propsData: propsWithoutId,
        mocks: { $t, $route: { params: { org_id: 'org1', id: 'proj1' } }, $bvModal, $notify }
      })
      await localWrapper.setData({ selected: 'A', text1: 'Explanation' })
      await localWrapper.vm.save()
      await localWrapper.vm.$nextTick()
      expect($notify.error).toHaveBeenCalledWith('notifications.save_error')
      localWrapper.destroy()
    })
  })

  describe('explanationState computed', () => {
    it('returns null when no option is selected', async () => {
      await wrapper.setData({ selected: null, text1: '' })
      expect(wrapper.vm.explanationState).toBe(null)
    })

    it('returns null when no option is selected even if text is present', async () => {
      await wrapper.setData({ selected: null, text1: 'Some text' })
      expect(wrapper.vm.explanationState).toBe(null)
    })

    it('returns false when option is selected and explanation is empty', async () => {
      await wrapper.setData({ selected: 'B', text1: '' })
      expect(wrapper.vm.explanationState).toBe(false)
    })

    it('returns false when option is selected and explanation is whitespace only', async () => {
      await wrapper.setData({ selected: 'C', text1: '   ' })
      expect(wrapper.vm.explanationState).toBe(false)
    })

    it('returns true when option is selected and explanation has content', async () => {
      await wrapper.setData({ selected: 'A', text1: 'My explanation' })
      expect(wrapper.vm.explanationState).toBe(true)
    })

    it('updates reactively when selected changes from null to a value', async () => {
      await wrapper.setData({ selected: null, text1: '' })
      expect(wrapper.vm.explanationState).toBe(null)
      await wrapper.setData({ selected: 'D' })
      expect(wrapper.vm.explanationState).toBe(false)
    })

    it('updates reactively when text1 is filled after selecting an option', async () => {
      await wrapper.setData({ selected: 'B', text1: '' })
      expect(wrapper.vm.explanationState).toBe(false)
      await wrapper.setData({ text1: 'Now I wrote something' })
      expect(wrapper.vm.explanationState).toBe(true)
    })
  })

  describe('cancel()', () => {
    const propsWithData = {
      selectedMeta: 0,
      modalStage: 0,
      modalIndex: 0,
      refId: 'ref1',
      assessments: {
        id: 'assess1',
        items: [
          {
            ref_id: 'ref1',
            authors: 'Author A 2020',
            stages: [
              {
                key: 0,
                options: [
                  { option: 'B', text: 'Original explanation', notes: 'Original note' },
                  { option: null, text: '', notes: '' },
                  { option: null, text: '', notes: '' },
                  { option: null, text: '', notes: '' }
                ]
              }
            ]
          }
        ]
      }
    }

    it('cancels pending debounced save and resets local state to server values', async () => {
      const localWrapper = mount(AssessmentForm, {
        localVue,
        propsData: propsWithData,
        mocks: {
          $t,
          $route: { params: { org_id: 'org1', id: 'proj1' } },
          $bvModal,
          $notify
        },
        stubs: {
          'b-card': true, 'b-form-group': true, 'b-form-radio-group': true,
          'b-form-radio': true, 'b-form-textarea': true, 'b-button': true, 'b-modal': true
        }
      })

      const cancelSpy = jest.fn()
      const mockDebounced = Object.assign(jest.fn(), { cancel: cancelSpy })
      localWrapper.vm.autoSaveDebounced = mockDebounced

      // Simulate user editing
      await localWrapper.setData({ selected: 'D', text1: 'Changed explanation', notes: 'Changed note' })

      await localWrapper.vm.cancel()
      await localWrapper.vm.$nextTick()

      expect(cancelSpy).toHaveBeenCalled()
      expect(localWrapper.vm.autoSaveStatus).toBe(null)
      // State reverted to server values
      expect(localWrapper.vm.selected).toBe('B')
      expect(localWrapper.vm.text1).toBe('Original explanation')
      expect(localWrapper.vm.notes).toBe('Original note')
      expect($bvModal.hide).toHaveBeenCalledWith('modal-1')

      localWrapper.destroy()
    })

    it('hides the modal even when assessments.items is empty', async () => {
      const emptyProps = {
        ...propsWithData,
        assessments: { id: 'assess1', items: [] }
      }
      const localWrapper = mount(AssessmentForm, {
        localVue,
        propsData: emptyProps,
        mocks: {
          $t,
          $route: { params: { org_id: 'org1', id: 'proj1' } },
          $bvModal,
          $notify
        },
        stubs: {
          'b-card': true, 'b-form-group': true, 'b-form-radio-group': true,
          'b-form-radio': true, 'b-form-textarea': true, 'b-button': true, 'b-modal': true
        }
      })

      await localWrapper.vm.cancel()
      expect($bvModal.hide).toHaveBeenCalledWith('modal-1')

      localWrapper.destroy()
    })
  })

  describe('modalIndex watcher', () => {
    const twoItemProps = {
      selectedMeta: 0,
      modalStage: 0,
      modalIndex: 0,
      refId: 'ref1',
      assessments: {
        id: 'assess1',
        items: [
          {
            ref_id: 'ref1',
            authors: 'Author A 2020',
            stages: [
              {
                key: 0,
                options: [
                  { option: 'A', text: 'Explanation A', notes: 'Note A' },
                  { option: null, text: '', notes: '' },
                  { option: null, text: '', notes: '' },
                  { option: null, text: '', notes: '' }
                ]
              }
            ]
          },
          {
            ref_id: 'ref2',
            authors: 'Author B 2021',
            stages: [
              {
                key: 0,
                options: [
                  { option: null, text: '', notes: '' },
                  { option: null, text: '', notes: '' },
                  { option: null, text: '', notes: '' },
                  { option: null, text: '', notes: '' }
                ]
              }
            ]
          }
        ]
      }
    }

    it('resets selected/text1/notes to the new index item when modalIndex changes', async () => {
      const localWrapper = mount(AssessmentForm, {
        localVue,
        propsData: twoItemProps,
        mocks: {
          $t,
          $route: { params: { org_id: 'org1', id: 'proj1' } },
          $bvModal,
          $notify
        },
        stubs: {
          'b-card': true,
          'b-form-group': true,
          'b-form-radio-group': true,
          'b-form-radio': true,
          'b-form-textarea': true,
          'b-button': true,
          'b-modal': true
        }
      })

      // Initially shows item 0 (ref1) data
      expect(localWrapper.vm.selected).toBe('A')
      expect(localWrapper.vm.text1).toBe('Explanation A')
      expect(localWrapper.vm.notes).toBe('Note A')

      // Switch to item 1 (ref2) — empty fields
      await localWrapper.setProps({ modalIndex: 1 })
      await localWrapper.vm.$nextTick()

      expect(localWrapper.vm.selected).toBe(null)
      expect(localWrapper.vm.text1).toBe('')
      expect(localWrapper.vm.notes).toBe('')

      localWrapper.destroy()
    })

    it('cancels pending debounced save when modalIndex changes', async () => {
      const localWrapper = mount(AssessmentForm, {
        localVue,
        propsData: twoItemProps,
        mocks: {
          $t,
          $route: { params: { org_id: 'org1', id: 'proj1' } },
          $bvModal,
          $notify
        },
        stubs: {
          'b-card': true,
          'b-form-group': true,
          'b-form-radio-group': true,
          'b-form-radio': true,
          'b-form-textarea': true,
          'b-button': true,
          'b-modal': true
        }
      })

      const cancelSpy = jest.fn()
      const mockDebounced = Object.assign(jest.fn(), { cancel: cancelSpy })
      localWrapper.vm.autoSaveDebounced = mockDebounced

      await localWrapper.setProps({ modalIndex: 1 })
      await localWrapper.vm.$nextTick()

      expect(cancelSpy).toHaveBeenCalled()
      expect(localWrapper.vm.autoSaveStatus).toBe(null)

      localWrapper.destroy()
    })
  })

  describe('AssessmentForm.vue — lock granular (owned by StepFour)', () => {
    const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

    it('NO adquiere ni libera locks por sí mismo (el lock lo maneja StepFour)', async () => {
      wrapper.destroy()
      await flushPromises()
      expect(LockService.acquireRef).not.toHaveBeenCalled()
      expect(LockService.releaseRef).not.toHaveBeenCalled()
    })

    // The banner used to require a holder name, but the loss that matters arrives from
    // the heartbeat's 409, and that response carries no holder at all — so the one case
    // the user most needs explained was the one that rendered nothing.
    it('avisa que está en solo lectura aunque no se sepa quién tomó el lock', async () => {
      const roWrapper = mount(AssessmentForm, {
        localVue,
        propsData: { ...propsData, isReadOnly: true, lockedByUser: null },
        mocks: { $t, $route: { params: { org_id: 'org1', id: 'proj1' } }, $bvModal, $notify }
      })
      expect(roWrapper.find('[data-testid="assessment-readonly-notice"]').exists()).toBe(true)
      roWrapper.destroy()
    })

    it('no avisa nada mientras la celda se puede editar', async () => {
      const rwWrapper = mount(AssessmentForm, {
        localVue,
        propsData: { ...propsData, isReadOnly: false, lockedByUser: null },
        mocks: { $t, $route: { params: { org_id: 'org1', id: 'proj1' } }, $bvModal, $notify }
      })
      expect(rwWrapper.find('[data-testid="assessment-readonly-notice"]').exists()).toBe(false)
      rwWrapper.destroy()
    })

    it('no guarda (no llama Api.patch) cuando el prop isReadOnly es true', async () => {
      Api.patch.mockClear()
      const roWrapper = mount(AssessmentForm, {
        localVue,
        propsData: { ...propsData, isReadOnly: true },
        mocks: { $t, $route: { params: { org_id: 'org1', id: 'proj1' } }, $bvModal, $notify }
      })
      await roWrapper.setData({ selected: 'A', text1: 'x' })
      roWrapper.vm.performSave(false)
      await flushPromises()
      expect(Api.patch).not.toHaveBeenCalled()
      roWrapper.destroy()
    })

    it('no llama a Api.patch cuando no hay refId', async () => {
      Api.patch.mockClear()
      const noRefWrapper = mount(AssessmentForm, {
        localVue,
        propsData: { ...propsData, refId: '' },
        mocks: { $t, $route: { params: { org_id: 'org1', id: 'proj1' } }, $bvModal, $notify }
      })
      await noRefWrapper.setData({ selected: 'A', text1: 'x' })
      await noRefWrapper.vm.performSave(false)
      await flushPromises()
      expect(Api.patch).not.toHaveBeenCalled()
      noRefWrapper.destroy()
    })
  })

  // Verified in the browser: losing the lock mid-edit raised TWO toasts at once — the
  // conflict message naming who took the entry, and a generic "could not save, please
  // try again" whose advice cannot work while somebody else holds the lock.
  describe('AssessmentForm.vue — rechazo por lock al guardar', () => {
    const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

    const lockRejection = (status) => Object.assign(new Error('rejected'), {
      config: { url: '/isoqf_assessments/assess1/item/ref1/stage/0/option/0' },
      response: { status, data: {} }
    })

    it('no agrega el error genérico cuando el guardado se rechaza por el lock', async () => {
      Api.patch.mockRejectedValue(lockRejection(409))
      await wrapper.setData({ selected: 'A', text1: 'texto' })

      await wrapper.vm.performSave(false)
      await flushPromises()

      expect($notify.error).not.toHaveBeenCalled()
    })

    it('tampoco lo agrega cuando el rechazo es por permiso revocado', async () => {
      Api.patch.mockRejectedValue(lockRejection(403))
      await wrapper.setData({ selected: 'A', text1: 'texto' })

      await wrapper.vm.performSave(false)
      await flushPromises()

      expect($notify.error).not.toHaveBeenCalled()
    })

    // A real failure still deserves it: there the advice to retry is sound.
    it('sí avisa cuando el guardado falla por el servidor', async () => {
      Api.patch.mockRejectedValue(lockRejection(500))
      await wrapper.setData({ selected: 'A', text1: 'texto' })

      await wrapper.vm.performSave(false)
      await flushPromises()

      expect($notify.error).toHaveBeenCalledWith('notifications.save_error')
    })
  })

  // Endpoint D writes ONE leaf. Saving the whole study through B would wipe the
  // other nine cells, which is the data loss D exists to prevent.
  describe('AssessmentForm.vue — endpoint D (one leaf per save)', () => {
    const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

    it('PATCHea la hoja concreta, no el estudio completo', async () => {
      Api.patch.mockResolvedValue({ data: {} })
      await wrapper.setData({ selected: 'A', text1: 'explicación' })

      await wrapper.vm.performSave(false)
      await flushPromises()

      expect(Api.patch).toHaveBeenCalledWith(
        '/isoqf_assessments/assess1/item/ref1/stage/0/option/0',
        expect.any(Object)
      )
      expect(Api.patch).not.toHaveBeenCalledWith(
        '/isoqf_assessments/assess1/item/ref1',
        expect.anything()
      )
    })

    it('direcciona la celda que el modal tiene abierta', async () => {
      Api.patch.mockResolvedValue({ data: {} })
      await wrapper.setProps({ modalStage: 1, selectedMeta: 3 })
      await wrapper.setData({ selected: 'C', text1: 'x' })

      await wrapper.vm.performSave(false)
      await flushPromises()

      // stages[1] is absent from the fixture: the stage key falls back to the
      // array index, and the backend seeds the missing stage.
      expect(Api.patch.mock.calls[0][0])
        .toBe('/isoqf_assessments/assess1/item/ref1/stage/1/option/3')
    })

    // §1.2: missing keys are reset to their canonical empty value, not merged.
    it('envía las tres claves de la hoja aunque estén vacías', async () => {
      Api.patch.mockResolvedValue({ data: {} })
      await wrapper.setData({ selected: 'B', text1: 'texto', notes: '' })

      await wrapper.vm.performSave(false)
      await flushPromises()

      expect(Api.patch.mock.calls[0][1]).toEqual({
        option: 'B', text: 'texto', notes: ''
      })
    })

    it('no envía claves fuera de la whitelist {option, text, notes}', async () => {
      Api.patch.mockResolvedValue({ data: {} })
      await wrapper.setData({ selected: 'A', text1: 'x' })

      await wrapper.vm.performSave(false)
      await flushPromises()

      expect(Object.keys(Api.patch.mock.calls[0][1]).sort())
        .toEqual(['notes', 'option', 'text'])
    })

    // The backend keys stages by stages[].key, not by array position.
    it('usa stages[].key y no el índice del array cuando difieren', async () => {
      Api.patch.mockResolvedValue({ data: {} })
      const legacyWrapper = mount(AssessmentForm, {
        localVue,
        propsData: {
          ...propsData,
          assessments: {
            id: 'assess1',
            items: [{
              ref_id: 'ref1',
              authors: 'Author 2024',
              // Legacy document: the key is a string and does not match index 0.
              stages: [{ key: '2', options: [{ option: null, text: '', notes: '' }] }]
            }]
          }
        },
        mocks: { $t, $route: { params: { org_id: 'org1', id: 'proj1' } }, $bvModal, $notify }
      })
      await legacyWrapper.setData({ selected: 'A', text1: 'x' })

      await legacyWrapper.vm.performSave(false)
      await flushPromises()

      expect(Api.patch.mock.calls[0][0])
        .toBe('/isoqf_assessments/assess1/item/ref1/stage/2/option/0')
      legacyWrapper.destroy()
    })

    // StepFour seeds items in memory for every reference, so the "no document
    // yet" case has items but no document id.
    it('sigue creando el documento por POST cuando todavía no existe', async () => {
      Api.post.mockResolvedValue({ data: {} })
      const newWrapper = mount(AssessmentForm, {
        localVue,
        propsData: {
          ...propsData,
          assessments: { items: propsData.assessments.items }
        },
        mocks: { $t, $route: { params: { org_id: 'org1', id: 'proj1' } }, $bvModal, $notify }
      })
      await newWrapper.setData({ selected: 'A', text1: 'x' })

      await newWrapper.vm.performSave(false)
      await flushPromises()

      expect(Api.post).toHaveBeenCalledWith('/isoqf_assessments', expect.objectContaining({
        organization: 'org1',
        project_id: 'proj1'
      }))
      // The seeded study carries the full 4/4/1/1 skeleton.
      const posted = Api.post.mock.calls[0][1].items[0]
      expect(posted.stages.map(s => s.options.length)).toEqual([4, 4, 1, 1])
      expect(posted.stages[0].options[0]).toEqual({ option: 'A', text: 'x', notes: '' })
      newWrapper.destroy()
    })
  })
})
