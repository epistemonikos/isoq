import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import ViewTable from '@/components/project/ViewTable.vue'
import Api from '@/utils/Api'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [{ id: 'finding1' }] }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  refLocks: new Map()
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))
const localVue = createLocalVue()
localVue.use(BootstrapVue)

// R2 ya no existe: otra persona lo borró en el Paso 1, pero la lista todavía lo apunta.
const LIST = {
  id: 'list1', name: 'F', notes: '', sort: 1, references: ['R1', 'R2'], category: null,
  cerqual_option: '', raw_ref: [], evidence_profile: { cerqual: { option: null } }
}

function createWrapper () {
  const wrapper = shallowMount(ViewTable, {
    localVue,
    propsData: {
      lists: [LIST],
      list_categories: { options: [], selected: null },
      fields: { with_categories: [], without_categories: [] },
      project: { id: 'proj1', is_public: false, private: true },
      references: [],
      refs: [{ id: 'R1', content: 'Smith 2020' }],
      isBusy: false,
      mode: 'edit',
      canEdit: true,
      findings: [{ id: 'finding1', list_id: 'list1' }],
      refLocks: []
    },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    },
    stubs: { videoHelp: true }
  })
  wrapper.vm.$refs['modal-references-list'] = { show: jest.fn(), hide: jest.fn() }
  return wrapper
}

describe('ViewTable — referencias de un finding con un estudio borrado', () => {
  beforeEach(() => jest.clearAllMocks())

  // No se dibuja como checkbox, y guardar lo reenviaba.
  it('el modal arranca sin el estudio que ya no existe y no lo reenvía', async () => {
    const wrapper = createWrapper()
    await wrapper.vm.openModalReferences({ index: 0, item: LIST })
    await flushPromises()
    expect(wrapper.vm.selected_references).toEqual(['R1'])

    await wrapper.vm.saveReferencesList()
    expect(Api.patch).toHaveBeenCalledWith('/isoqf_findings/finding1/identity', { references: ['R1'] })
    wrapper.destroy()
  })

  // Borrado con el modal ya abierto: el servidor guarda el resto y lo dice.
  it('avisa lo que el servidor descartó en dropped_references', async () => {
    const events = []
    const record = e => events.push(e.detail)
    window.addEventListener('reference-deleted', record)
    Api.patch.mockResolvedValueOnce({
      data: { id: 'finding1', dropped_references: [{ ref_id: 'R1', deleted_by: 'Ana Pérez' }] }
    })
    const wrapper = createWrapper()
    await wrapper.vm.openModalReferences({ index: 0, item: LIST })
    await flushPromises()

    await wrapper.vm.saveReferencesList()

    expect(events).toEqual([{ refId: 'R1', deletedBy: 'Ana Pérez', source: 'identity' }])
    window.removeEventListener('reference-deleted', record)
    wrapper.destroy()
  })
})
