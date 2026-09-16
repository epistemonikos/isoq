import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import CamelotAssessmentCard from '@/components/camelot/CamelotAssessmentCard.vue'
import { requestPendingEditsFlush } from '@/mixins/pendingEditsMixin'

/**
 * El flush por lotes visto desde la tarjeta.
 *
 * El caso que más importa acá no es que persista: es que NO persista cuando no le toca.
 * `StepFour.saveField` saca el destino de la escritura de su propio `editingField` y la
 * tarjeta emite sólo su `editValue`, así que una tarjeta que ya no está en edición
 * escribiría su texto en el campo de otra — y el endpoint B reescribe el ítem completo,
 * o sea corrupción, no pérdida.
 */
const localVue = createLocalVue()
localVue.use(BootstrapVue)

const NADIE = { metaIndex: null, itemIndex: null, type: null }
const ESTA_TARJETA = { metaIndex: 1, itemIndex: 2, type: 'extractedData' }
const OTRA_TARJETA = { metaIndex: 1, itemIndex: 3, type: 'comments' }

function createWrapper (overrides = {}) {
  return shallowMount(CamelotAssessmentCard, {
    localVue,
    propsData: {
      metaIndex: 1,
      itemIndex: 2,
      label: 'Research strategy',
      extractedData: 'lo guardado',
      concerns: '',
      refId: 'R1',
      editingField: ESTA_TARJETA,
      ...overrides
    },
    mocks: { $t: key => key }
  })
}

/** Deja un debounce agendado, como si la persona estuviera tipeando. */
async function typing (wrapper, texto = 'texto sin guardar') {
  await wrapper.setData({ editValue: texto })
  wrapper.vm.onInput()
}

/**
 * El mismo desajuste emisor/destino por el camino NATURAL del debounce, que es el que la
 * gente recorre a diario: escribir en un campo y pasar a otro antes de 1,5 s.
 *
 * Medido en navegador contra el servidor real antes del arreglo: el texto de
 * "Research strategy / Extracted data" aterrizaba en `ethical_comments`.
 */
describe('CamelotAssessmentCard — el debounce que sobrevive al cambio de tarjeta', () => {
  // Los fake timers se encienden ANTES de agendar: si se encendieran después, el debounce
  // habría quedado en un timer real y `advanceTimersByTime` no lo alcanzaría — los casos
  // negativos pasarían por la razón equivocada.
  //
  // El `editingField` se fija al montar, sin setProps: setProps es asíncrono y su await
  // depende de nextTick, que los fake timers modernos también falsean.
  function agendado (editingField) {
    const wrapper = createWrapper({ editingField })
    jest.useFakeTimers()
    wrapper.vm.editValue = 'texto sin guardar'
    wrapper.vm.onInput()
    return wrapper
  }

  afterEach(() => { jest.useRealTimers() })

  it('sí emite al vencer el debounce si sigue siendo la tarjeta en edición', () => {
    const wrapper = agendado(ESTA_TARJETA)
    jest.advanceTimersByTime(2000)
    expect(wrapper.emitted('auto-save-field')[0]).toEqual(['texto sin guardar'])
    wrapper.destroy()
  })

  it('NO emite al vencer el debounce si el foco ya se movió a otra tarjeta', () => {
    const wrapper = agendado(OTRA_TARJETA)
    jest.advanceTimersByTime(2000)
    expect(wrapper.emitted('auto-save-field')).toBeUndefined()
    wrapper.destroy()
  })

  it('NO emite al vencer el debounce si el usuario canceló', () => {
    const wrapper = agendado(NADIE)
    jest.advanceTimersByTime(2000)
    expect(wrapper.emitted('auto-save-field')).toBeUndefined()
    wrapper.destroy()
  })
})

describe('CamelotAssessmentCard — flush por lotes', () => {
  it('persiste lo pendiente sin esperar el debounce de 1,5 s', async () => {
    const wrapper = createWrapper()
    await typing(wrapper)
    expect(wrapper.emitted('auto-save-field')).toBeUndefined()

    requestPendingEditsFlush('R1')

    expect(wrapper.emitted('auto-save-field')[0]).toEqual(['texto sin guardar'])
    wrapper.destroy()
  })

  // El corazón del tramo: sin este gate el texto va al campo equivocado.
  it('NO emite si el foco de edición ya se movió a otra tarjeta', async () => {
    const wrapper = createWrapper()
    await typing(wrapper)
    await wrapper.setProps({ editingField: OTRA_TARJETA })

    requestPendingEditsFlush('R1')

    expect(wrapper.emitted('auto-save-field')).toBeUndefined()
    wrapper.destroy()
  })

  // Con editingField en nulls, saveField revienta en meta[null].
  it('NO emite si el usuario canceló y no hay campo en edición', async () => {
    const wrapper = createWrapper()
    await typing(wrapper)
    await wrapper.setProps({ editingField: NADIE })

    requestPendingEditsFlush('R1')

    expect(wrapper.emitted('auto-save-field')).toBeUndefined()
    wrapper.destroy()
  })

  it('ignora el pedido de otro estudio', async () => {
    const wrapper = createWrapper()
    await typing(wrapper)

    requestPendingEditsFlush('R9')

    expect(wrapper.emitted('auto-save-field')).toBeUndefined()
    wrapper.destroy()
  })

  it('no emite en solo lectura', async () => {
    const wrapper = createWrapper({ isReadOnly: true })
    await typing(wrapper)

    requestPendingEditsFlush('R1')

    expect(wrapper.emitted('auto-save-field')).toBeUndefined()
    wrapper.destroy()
  })

  // `flush()` de lodash es no-op sin nada agendado: por eso no hace falta un guard extra.
  it('sin cambios pendientes no emite nada', () => {
    const wrapper = createWrapper()

    requestPendingEditsFlush('R1')

    expect(wrapper.emitted('auto-save-field')).toBeUndefined()
    wrapper.destroy()
  })

  it('deja de escuchar al destruirse', async () => {
    const wrapper = createWrapper()
    await typing(wrapper)
    wrapper.destroy()

    expect(() => requestPendingEditsFlush('R1')).not.toThrow()
  })
})
