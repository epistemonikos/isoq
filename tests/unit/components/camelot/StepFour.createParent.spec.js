// El POST que crea el documento de la tabla tiene que llevar el proyecto padre.
//
// Antes esto era sólo higiene: un documento sin `project_id` quedaba huérfano e
// invisible en toda vista de proyecto, pero se creaba. Ahora el backend autoriza el
// POST de las colecciones hijas resolviendo el proyecto padre DESDE EL BODY
// (docs/respuesta-backend-columnas-contrato-ejecucion.md §B2.d), así que un body sin
// padre resoluble es 403 y el guardado falla.
//
// `saveField` toma el padre de `this.characteristics`, que se inicializa como
// `{ items: [] }` (StepFour.vue:354) — sin padre. Lo que hace que funcione es el guard
// de :1038-1041, que lo rellena desde `$route.params` antes de armar el payload. Este
// test fija ese guard: si desaparece, el POST vuelve a salir con `undefined`.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import StepFour from '@/components/camelot/StepFour.vue'
import Api from '@/utils/Api'
import BootstrapVue from 'bootstrap-vue'

jest.mock('@/utils/Api')

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const STUBS = {
  'font-awesome-icon': true,
  'b-modal': true,
  'b-table': true,
  'b-tabs': true,
  'b-tab': true,
  'b-row': true,
  'b-col': true,
  'b-collapse': true,
  'assessmentForm': true,
  'responses': true
}

describe('StepFour.vue — crear el documento de characteristics manda el proyecto padre', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    // La tabla todavía no existe: el GET no devuelve nada y saveField cae en el POST.
    Api.get.mockResolvedValue({ data: [] })
    Api.post.mockResolvedValue({ data: { id: 'char-nuevo' } })
    Api.patch.mockResolvedValue({ data: {} })

    wrapper = shallowMount(StepFour, {
      localVue,
      propsData: { type: 'camelot', references: [{ id: 'ref1', authors: 'Author 2024' }] },
      mocks: {
        $t: msg => msg,
        $route: { params: { org_id: 'org1', id: 'proj1' } }
      },
      stubs: STUBS
    })
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
  })

  it('POSTea organization y project_id tomados de la ruta cuando el documento no existe', async () => {
    // `characteristics` como queda al montar sin documento en la base: sin id y sin padre.
    wrapper.setData({
      characteristics: { items: [] },
      refId: 'ref1',
      editingField: { metaIndex: 1, itemIndex: 0, type: 'extractedData' },
      editValueExtracted: 'Texto nuevo'
    })

    await wrapper.vm.saveField('Texto nuevo')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(Api.post).toHaveBeenCalledWith(
      '/isoqf_characteristics/',
      expect.objectContaining({
        organization: 'org1',
        project_id: 'proj1'
      })
    )
  })

  // El padre no puede llegar como `undefined`: JSON.stringify borra esas claves del
  // body, así que el backend recibiría un objeto sin `project_id` y respondería 403 —
  // el mismo síntoma que si nunca lo hubiéramos mandado.
  it('nunca manda organization ni project_id como undefined', async () => {
    wrapper.setData({
      characteristics: { items: [] },
      refId: 'ref1',
      editingField: { metaIndex: 1, itemIndex: 0, type: 'extractedData' },
      editValueExtracted: 'Texto nuevo'
    })

    await wrapper.vm.saveField('Texto nuevo')
    await new Promise(resolve => setTimeout(resolve, 0))

    const body = Api.post.mock.calls[0][1]
    expect(body.organization).toBeTruthy()
    expect(body.project_id).toBeTruthy()
  })
})
