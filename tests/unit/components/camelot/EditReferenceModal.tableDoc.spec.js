import { shallowMount } from '@vue/test-utils'
import EditReferenceModal from '@/components/camelot/EditReferenceModal.vue'
import Api from '@/utils/Api'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: { id: 'nuevo1', items: [] } }),
  patch: jest.fn().mockResolvedValue({ data: { items: [] } })
}))
jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: {
    acquireRef: jest.fn().mockResolvedValue({ success: true }),
    releaseRef: jest.fn(),
    refLocks: new Map()
  }
}))

/**
 * El tercero y último de los lugares que crean un documento de tabla: el editor de
 * estudios del Paso 3. Mismo patrón que los otros dos — `charsData.id` en blanco no
 * significa sólo "no existe", también "el GET falló" o "todavía no llegó" — y la misma
 * consecuencia: un segundo documento del proyecto, con las lecturas cayendo en cualquiera
 * de los dos.
 */
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

describe('EditReferenceModal — no crear un segundo documento de características', () => {
  let wrapper

  const build = (charsData) => shallowMount(EditReferenceModal, {
    propsData: {
      reference: { id: 'ref1', ref_id: 'ref1', authors: 'Autor 2020' },
      charsData,
      camelot: { fields: [], categories: [] },
      visibleColumnKeys: []
    },
    mocks: {
      $t: (key) => key,
      $route: { params: { org_id: 'org1', id: 'proj1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    },
    stubs: {
      'b-modal': true, 'b-form-group': true, 'b-form-input': true, 'b-form-textarea': true,
      'b-button': true, 'b-alert': true, 'font-awesome-icon': true, 'b-form-checkbox': true,
      'b-row': true, 'b-col': true, 'b-table': true, 'b-tooltip': true
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
    Api.get.mockResolvedValue({ data: [] })
    Api.patch.mockResolvedValue({ data: { items: [] } })
    Api.post.mockResolvedValue({ data: { id: 'nuevo1', items: [] } })
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('sin id local, si el servidor YA tiene documento, escribe en ese', async () => {
    wrapper = build({ items: [], fields: [] })
    Api.get.mockResolvedValue({ data: [{ id: 'chars1' }] })

    wrapper.vm.performSave(false)
    await flushPromises()
    await flushPromises()

    expect(Api.post).not.toHaveBeenCalled()
    expect(Api.patch).toHaveBeenCalled()
  })

  it('sin id y sin documento en el servidor, crea: es la primera vez', async () => {
    wrapper = build({ items: [], fields: [] })
    Api.get.mockResolvedValue({ data: [] })

    wrapper.vm.performSave(false)
    await flushPromises()
    await flushPromises()

    expect(Api.post).toHaveBeenCalledWith('/isoqf_characteristics/', expect.any(Object))
  })

  it('si no se puede verificar, no crea a ciegas', async () => {
    wrapper = build({ items: [], fields: [] })
    Api.get.mockRejectedValue(new Error('red caída'))

    wrapper.vm.performSave(false)
    await flushPromises()
    await flushPromises()

    expect(Api.post).not.toHaveBeenCalled()
  })

  it('con el documento cargado no consulta de más', async () => {
    wrapper = build({ id: 'chars1', items: [], fields: [] })
    Api.get.mockClear()

    wrapper.vm.performSave(false)
    await flushPromises()

    expect(Api.get).not.toHaveBeenCalled()
    expect(Api.patch).toHaveBeenCalled()
  })
})
