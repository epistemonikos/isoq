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
