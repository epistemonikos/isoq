import { mount, createLocalVue } from '@vue/test-utils'
import AssessmentForm from '@/components/camelot/assessment/AssessmentForm.vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()

jest.mock('@/utils/Api')
jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn()
}))

/**
 * Un documento nuevo que llega del servidor NO puede pisar lo que la persona está
 * escribiendo. Llega por dos caminos, y los dos terminan en el mismo watcher:
 *
 *   1. el refresco de `viewProject` (cada 15 s) recarga las referencias, y el watcher de
 *      `references` en StepFour vuelve a pedir los assessments;
 *   2. el propio guardado emite `getAssessments`, y lo que se teclee entre el PATCH y la
 *      llegada del GET viaja en la ventana.
 *
 * El criterio es el estado, no el origen: si los campos difieren de la última hidratación,
 * hay un borrador encima y el documento entrante se ignora.
 */
const docWith = (leaf) => ({
  id: 'assess1',
  items: [
    {
      ref_id: 'ref1',
      authors: 'Author 2024',
      stages: [
        {
          key: 0,
          options: [
            { option: leaf.option, text: leaf.text, notes: leaf.notes || '' },
            { option: null, text: '', notes: '' },
            { option: null, text: '', notes: '' },
            { option: null, text: '', notes: '' }
          ]
        }
      ]
    }
  ]
})

describe('AssessmentForm — documento entrante vs. borrador local', () => {
  let wrapper

  const build = (assessments) => mount(AssessmentForm, {
    localVue,
    propsData: {
      selectedMeta: 0,
      modalStage: 0,
      modalIndex: 0,
      refId: 'ref1',
      assessments
    },
    mocks: {
      $t: (key) => key,
      $route: { params: { org_id: 'org1', id: 'proj1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    },
    stubs: {
      'b-card': true,
      'b-form-group': true,
      'b-form-radio-group': true,
      'b-form-radio': true,
      'b-form-textarea': true,
      'b-button': true,
      'b-modal': true,
      'b-alert': true,
      'font-awesome-icon': true
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockResolvedValue({ data: [] })
    Api.patch.mockResolvedValue({ data: {} })
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
  })

  it('no desmarca la opción que la persona acaba de elegir', async () => {
    wrapper = build(docWith({ option: null, text: '' }))

    // La persona elige un nivel; el auto-guardado todavía no salió.
    wrapper.vm.selected = 'C'
    await wrapper.vm.$nextTick()

    // Llega el documento del servidor: todavía sin su elección.
    wrapper.setProps({ assessments: docWith({ option: null, text: '' }) })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selected).toBe('C')
  })

  it('no borra la explicación que se está tecleando', async () => {
    wrapper = build(docWith({ option: 'B', text: '' }))

    wrapper.vm.text1 = 'Estudio con muestreo limi'
    await wrapper.vm.$nextTick()

    wrapper.setProps({ assessments: docWith({ option: 'B', text: '' }) })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.text1).toBe('Estudio con muestreo limi')
  })

  it('no revierte el cambio hecho mientras el guardado anterior estaba en vuelo', async () => {
    wrapper = build(docWith({ option: null, text: '' }))

    // Primer nivel elegido y guardado.
    wrapper.vm.selected = 'A'
    await wrapper.vm.$nextTick()
    wrapper.vm.performSave(true)
    await wrapper.vm.$nextTick()

    // Se arrepiente antes de que llegue el refetch que dispara ese guardado.
    wrapper.vm.selected = 'D'
    await wrapper.vm.$nextTick()

    // El GET responde con lo que el PATCH alcanzó a escribir: 'A'.
    wrapper.setProps({ assessments: docWith({ option: 'A', text: '' }) })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selected).toBe('D')
  })

  it('aplica el documento entrante cuando no hay nada sin guardar', async () => {
    wrapper = build(docWith({ option: null, text: '' }))

    wrapper.setProps({ assessments: docWith({ option: 'B', text: 'desde el servidor' }) })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selected).toBe('B')
    expect(wrapper.vm.text1).toBe('desde el servidor')
  })

  it('vuelve a aceptar documentos entrantes después de un guardado propio', async () => {
    wrapper = build(docWith({ option: null, text: '' }))

    wrapper.vm.selected = 'C'
    wrapper.vm.text1 = 'porque sí'
    await wrapper.vm.$nextTick()
    await wrapper.vm.performSave(true)
    await wrapper.vm.$nextTick()

    // Lo guardado ya es el punto de referencia: un documento posterior manda.
    wrapper.setProps({ assessments: docWith({ option: 'E', text: 'lo cambió otra persona' }) })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selected).toBe('E')
    expect(wrapper.vm.text1).toBe('lo cambió otra persona')
  })
})

/**
 * Las pestañas FA1..FA4 de una etapa son CUATRO instancias vivas a la vez (`:selectedMeta="dIndex"`
 * dentro del v-for de b-tab), todas sobre el mismo objeto `assessments`. Así que el documento que
 * llega por el guardado de FA1 —su `Object.assign` local primero, su refetch después— dispara el
 * watcher de las cuatro, incluida la pestaña donde la persona acaba de elegir algo y todavía no
 * se guardó. Es el camino más frecuente del reporte: se trabaja de corrido FA1 → FA2 → FA3.
 */
describe('AssessmentForm — una pestaña no pisa a la de al lado', () => {
  const dosCeldas = (leaf0, leaf1) => ({
    id: 'assess1',
    items: [
      {
        ref_id: 'ref1',
        authors: 'Author 2024',
        stages: [
          {
            key: 0,
            options: [
              { option: leaf0.option, text: leaf0.text, notes: '' },
              { option: leaf1.option, text: leaf1.text, notes: '' },
              { option: null, text: '', notes: '' },
              { option: null, text: '', notes: '' }
            ]
          }
        ]
      }
    ]
  })

  const montar = (assessments, meta) => mount(AssessmentForm, {
    localVue,
    propsData: { selectedMeta: meta, modalStage: 0, modalIndex: 0, refId: 'ref1', assessments },
    mocks: {
      $t: (key) => key,
      $route: { params: { org_id: 'org1', id: 'proj1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    },
    stubs: {
      'b-card': true, 'b-form-group': true, 'b-form-radio-group': true, 'b-form-radio': true,
      'b-form-textarea': true, 'b-button': true, 'b-modal': true, 'b-alert': true,
      'font-awesome-icon': true
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockResolvedValue({ data: [] })
    Api.patch.mockResolvedValue({ data: {} })
  })

  it('FA2 conserva la opción recién elegida cuando FA1 guarda', async () => {
    const doc = dosCeldas({ option: null, text: '' }, { option: null, text: '' })
    const fa1 = montar(doc, 0)
    const fa2 = montar(doc, 1)

    // La persona viene de elegir en FA1, se pasa a FA2 y marca una opción.
    fa1.vm.selected = 'A'
    fa1.vm.text1 = 'lo de FA1'
    await fa1.vm.$nextTick()
    fa2.vm.selected = 'C'
    await fa2.vm.$nextTick()

    // FA1 guarda: muta el documento compartido y su refetch trae el estado del servidor,
    // que todavía no sabe nada de lo que se marcó en FA2.
    await fa1.vm.performSave(true)
    await fa1.vm.$nextTick()
    const recargado = dosCeldas({ option: 'A', text: 'lo de FA1' }, { option: null, text: '' })
    fa1.setProps({ assessments: recargado })
    fa2.setProps({ assessments: recargado })
    await fa2.vm.$nextTick()

    expect(fa2.vm.selected).toBe('C')
    expect(fa1.vm.selected).toBe('A')

    fa1.destroy()
    fa2.destroy()
  })

  it('y tampoco le borra la explicación a medio escribir', async () => {
    const doc = dosCeldas({ option: 'B', text: '' }, { option: 'D', text: '' })
    const fa1 = montar(doc, 0)
    const fa2 = montar(doc, 1)

    fa2.vm.text1 = 'la razón del FA2, a medio escribir'
    await fa2.vm.$nextTick()

    fa1.vm.text1 = 'la de FA1'
    await fa1.vm.$nextTick()
    await fa1.vm.performSave(true)
    await fa1.vm.$nextTick()
    const recargado = dosCeldas({ option: 'B', text: 'la de FA1' }, { option: 'D', text: '' })
    fa2.setProps({ assessments: recargado })
    await fa2.vm.$nextTick()

    expect(fa2.vm.text1).toBe('la razón del FA2, a medio escribir')

    fa1.destroy()
    fa2.destroy()
  })
})
