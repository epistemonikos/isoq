import { shallowMount, createLocalVue } from '@vue/test-utils'
import editListExtractedData from '@/components/list/editListExtractedData.vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const makeWrapper = (extractedData) => shallowMount(editListExtractedData, {
  localVue,
  propsData: {
    ui: {},
    show: { selected: [] },
    mode: 'edit',
    list: { id: 'list1', organization: 'org1' },
    permission: true,
    extractedData: extractedData || { id: 'ed1', fields: [], fieldsObj: [], items: [] },
    modePrintFieldObject: [],
    refsWithTitle: []
  },
  mocks: {
    $t: key => key,
    $route: { params: { org_id: 'org1', id: 'list1' } }
  },
  stubs: {
    videoHelp: true, 'bc-filters': true, 'back-to-top': true,
    'b-table': true, 'b-modal': true, 'b-button': true, 'b-form-group': true,
    'b-form-input': true, 'b-row': true, 'b-col': true, 'font-awesome-icon': true
  }
})

describe('editListExtractedData.vue — granular per-row save (endpoint C)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('saveDataExtractedData PATCHes only the edited row to /item/<ref_id>', async () => {
    const wrapper = makeWrapper({
      id: 'ed1',
      fields: [],
      fieldsObj: [],
      items: [
        { ref_id: 'ref1', authors: 'Smith 2020', column_0: 'old' },
        { ref_id: 'ref2', authors: 'Jones 2021', column_0: 'other' }
      ]
    })
    await wrapper.setData({
      buffer_extracted_data_items: { ref_id: 'ref1', authors: 'Smith 2020', column_0: 'new text' }
    })

    await wrapper.vm.saveDataExtractedData()
    await flushPromises()

    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_extracted_data/ed1/item/ref1',
      expect.objectContaining({ ref_id: 'ref1', authors: 'Smith 2020', column_0: 'new text' })
    )
    // No whole-array rewrite
    expect(Api.patch.mock.calls[0][1].items).toBeUndefined()
    wrapper.destroy()
  })

  it('extractedDataRemoveDataItem resets the row (blank columns) via /item/<ref_id>, keeping ref_id + authors', async () => {
    const wrapper = makeWrapper({
      id: 'ed1',
      fields: [],
      fieldsObj: [],
      items: [{ ref_id: 'ref1', authors: 'Smith 2020', column_0: 'to be cleared' }]
    })
    await wrapper.setData({
      buffer_extracted_data: { ...wrapper.vm.buffer_extracted_data, remove_index_item: 0 }
    })

    await wrapper.vm.extractedDataRemoveDataItem()
    await flushPromises()

    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_extracted_data/ed1/item/ref1',
      expect.objectContaining({ ref_id: 'ref1', authors: 'Smith 2020', column_0: '' })
    )
    expect(Api.patch.mock.calls[0][1].items).toBeUndefined()
    wrapper.destroy()
  })
})

describe('editListExtractedData.vue — el contador de versión por ítem', () => {
  // El `_v` viaja DENTRO de la fila y estos dos caminos la reconstruyen desde cero. Si se
  // pierde, el servidor acepta el PATCH por compatibilidad y deja de comprobar la frescura:
  // no hay 409, no hay cartel, y dos personas se pisan sin enterarse. Lo que se comprueba
  // acá es que el camino no lo descarte — no que valga un número en particular.
  beforeEach(() => jest.clearAllMocks())

  it('saveDataExtractedData reenvía el `_v` que la fila trae', async () => {
    const wrapper = makeWrapper({
      id: 'ed1',
      fields: [],
      fieldsObj: [],
      items: [{ ref_id: 'ref1', authors: 'Smith 2020', column_0: 'old', _v: 7 }]
    })
    await wrapper.setData({
      buffer_extracted_data_items: { ref_id: 'ref1', authors: 'Smith 2020', column_0: 'new text', _v: 7 }
    })

    await wrapper.vm.saveDataExtractedData()
    await flushPromises()

    expect(Api.patch.mock.calls[0][1]._v).toBe(7)
    wrapper.destroy()
  })

  it('extractedDataRemoveDataItem reenvía el `_v` que la fila trae', async () => {
    const wrapper = makeWrapper({
      id: 'ed1',
      fields: [],
      fieldsObj: [],
      items: [{ ref_id: 'ref1', authors: 'Smith 2020', column_0: 'to be cleared', _v: 3 }]
    })
    await wrapper.setData({
      buffer_extracted_data: { ...wrapper.vm.buffer_extracted_data, remove_index_item: 0 }
    })

    await wrapper.vm.extractedDataRemoveDataItem()
    await flushPromises()

    expect(Api.patch.mock.calls[0][1]._v).toBe(3)
    wrapper.destroy()
  })

  it('no inventa la clave cuando la fila todavía no tiene versión', async () => {
    // Fila recién derivada, nunca escrita: el endpoint por ítem es un upsert y el servidor
    // rechaza con 400 un `_v` que no sea entero. Mandar `undefined` o un 0 de relleno
    // convertiría esa defensa en un guardado que no se puede completar nunca.
    const wrapper = makeWrapper({
      id: 'ed1',
      fields: [],
      fieldsObj: [],
      items: [{ ref_id: 'ref1', authors: 'Smith 2020', column_0: '' }]
    })
    await wrapper.setData({
      buffer_extracted_data_items: { ref_id: 'ref1', authors: 'Smith 2020', column_0: 'primera vez' }
    })

    await wrapper.vm.saveDataExtractedData()
    await flushPromises()

    expect('_v' in Api.patch.mock.calls[0][1]).toBe(false)
    wrapper.destroy()
  })
})
