import { shallowMount } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}))

describe('crudTables — número del finding en el warning de borrado', () => {
  const REF = '66b1ff0000000000000000f1'
  const LIST = '66b1ff0000000000000000a1'

  function createWrapper (lists) {
    return shallowMount(crudTables, {
      propsData: {
        type: 'isoqf_characteristics',
        prefix: 'ch',
        canEdit: true,
        project: { id: '66b1ff000000000000000001' },
        ui: { project: {} },
        references: [],
        refs: [],
        lists
      },
      mocks: {
        $t: (k, params) => (params ? `${k} ${JSON.stringify(params)}` : k),
        $route: { params: { id: '66b1ff000000000000000001', org_id: '66b1ff000000000000000002' } },
        $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
      },
      stubs: ['b-modal', 'b-table', 'b-button', 'b-form-input', 'draggable']
    })
  }

  it('usa displayNumber, no el isoqf_id persistido', () => {
    // sort=7, isoqf_id=99 y displayNumber=2: tres valores distintos a propósito,
    // para que el test falle si se lee el atributo equivocado.
    const lists = [
      { id: LIST, references: [REF], sort: 7, isoqf_id: 99, displayNumber: 2 }
    ]
    const wrapper = createWrapper(lists)
    wrapper.vm.$refs['removeContentModalDataTable'] = { show: jest.fn() }

    wrapper.vm.openModalRemoveContentDataTable(REF)

    expect(wrapper.vm.removeReferenceDataTable.findings).toEqual([2])
    wrapper.destroy()
  })
})
