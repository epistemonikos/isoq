// El modal de columnas pasa de "acumular todo y guardar al final" a aplicar cada
// operación por separado, porque los endpoints granulares son cuatro requests sin
// transacción: un guardado en bloque puede fallar a la mitad y no hay rollback posible
// desde el cliente.
//
// Este componente es el que sabe qué hizo el usuario, así que emite un evento por
// operación. La traducción a llamadas HTTP y el lock quedan en el padre.
//
// Se agrega sin romper al otro consumidor: `EditReferenceModal` sigue usándolo con el
// guardado en bloque, así que los eventos nuevos son aditivos y el borrado sólo cambia de
// forma cuando el padre lo pide con `confirm-remove`.
import { shallowMount } from '@vue/test-utils'
import CustomFieldsManager from '@/components/camelot/CustomFieldsManager.vue'

jest.mock('vuedraggable', () => ({ render: h => h('div') }))

function createWrapper (fields = [], extraProps = {}) {
  return shallowMount(CustomFieldsManager, {
    propsData: { fields, ...extraProps },
    mocks: { $t: key => key },
    stubs: {
      'b-card': true,
      'b-button': true,
      'b-form-group': { template: '<div><slot/><slot name="invalid-feedback"/></div>' },
      'b-form-input': true,
      'b-form-textarea': true,
      'b-form-invalid-feedback': true,
      'b-sidebar': true,
      draggable: { template: '<div><slot/></div>' }
    }
  })
}

describe('CustomFieldsManager — field-committed', () => {
  // El alta y el renombrado se aplican al salir del campo: es el momento en que el
  // título ya está escrito. Aplicarlo al crear la fila haría nacer una columna sin
  // título.
  it('emite field-committed al salir de un campo renombrado', async () => {
    const wrapper = createWrapper([{ key: 'column_a', label: 'Contexto' }])
    await wrapper.vm.$nextTick()
    wrapper.vm.localFields[0].label = 'Contexto del estudio'

    wrapper.vm.onLabelBlur(wrapper.vm.localFields[0])

    const emitido = wrapper.emitted('field-committed')
    expect(emitido).toHaveLength(1)
    expect(emitido[0][0]).toMatchObject({ key: 'column_a', label: 'Contexto del estudio' })
  })

  // Una columna nueva no tiene `key`: es lo que le dice al padre que hay que crearla en
  // vez de renombrarla.
  it('una columna nueva se emite sin key', async () => {
    const wrapper = createWrapper()
    wrapper.vm.addField()
    wrapper.vm.localFields[0].label = 'Recién puesta'

    wrapper.vm.onLabelBlur(wrapper.vm.localFields[0])

    expect(wrapper.emitted('field-committed')[0][0].key).toBeUndefined()
  })

  it('no emite nada si el campo quedó vacío', async () => {
    const wrapper = createWrapper()
    wrapper.vm.addField()

    wrapper.vm.onLabelBlur(wrapper.vm.localFields[0])

    expect(wrapper.emitted('field-committed')).toBeUndefined()
  })

  it('no emite nada si el label es sólo espacios', async () => {
    const wrapper = createWrapper([{ key: 'column_a', label: '   ' }])
    await wrapper.vm.$nextTick()

    wrapper.vm.onLabelBlur(wrapper.vm.localFields[0])

    expect(wrapper.emitted('field-committed')).toBeUndefined()
  })

  // Salir del campo sin haberlo tocado es lo más común: el usuario abre el modal y hace
  // clic en otra parte. No hay nada que guardar.
  it('no emite nada si el label no cambió respecto del original', async () => {
    const wrapper = createWrapper([{ key: 'column_a', label: 'Contexto' }])
    await wrapper.vm.$nextTick()

    wrapper.vm.onLabelBlur(wrapper.vm.localFields[0])

    expect(wrapper.emitted('field-committed')).toBeUndefined()
  })

  // Y una vez guardado, volver a pasar por el campo tampoco reenvía: si no, cada clic en
  // otra parte del modal repetiría el PATCH.
  it('no reenvía el mismo título dos veces', async () => {
    const wrapper = createWrapper([{ key: 'column_a', label: 'Contexto' }])
    await wrapper.vm.$nextTick()
    wrapper.vm.localFields[0].label = 'Otro'

    wrapper.vm.onLabelBlur(wrapper.vm.localFields[0])
    wrapper.vm.onLabelBlur(wrapper.vm.localFields[0])

    expect(wrapper.emitted('field-committed')).toHaveLength(1)
  })

  it('sigue marcando el campo como tocado, para la validación visual', async () => {
    const wrapper = createWrapper([{ key: 'column_a', label: 'Contexto' }])
    await wrapper.vm.$nextTick()
    const field = wrapper.vm.localFields[0]

    wrapper.vm.onLabelBlur(field)

    expect(wrapper.vm.touchedLabelIds).toContain(field.id)
  })
})

describe('CustomFieldsManager — borrado con confirmación del padre', () => {
  // Con las operaciones aplicándose al vuelo, el DELETE borra el contenido de esa columna
  // en todas las filas en el momento del clic. La lista local no puede adelantarse a la
  // confirmación, porque si el usuario dice que no hay que dejarla como estaba.
  it('con confirm-remove emite remove-requested y no toca la lista', async () => {
    const wrapper = createWrapper(
      [{ key: 'column_a', label: 'Contexto' }, { key: 'column_b', label: 'Método' }],
      { confirmRemove: true }
    )
    await wrapper.vm.$nextTick()

    wrapper.vm.removeField(0)

    expect(wrapper.emitted('remove-requested')[0][0]).toMatchObject({ key: 'column_a' })
    expect(wrapper.vm.localFields).toHaveLength(2)
    expect(wrapper.emitted('input')).toBeUndefined()
  })

  // EditReferenceModal no pasa la prop: sigue con el guardado en bloque, donde quitar la
  // fila de la lista ES la operación.
  it('sin la prop quita la fila como siempre', async () => {
    const wrapper = createWrapper([
      { key: 'column_a', label: 'Contexto' },
      { key: 'column_b', label: 'Método' }
    ])
    await wrapper.vm.$nextTick()

    wrapper.vm.removeField(0)

    expect(wrapper.vm.localFields).toHaveLength(1)
    expect(wrapper.vm.localFields[0].key).toBe('column_b')
    expect(wrapper.emitted('input')).toHaveLength(1)
    expect(wrapper.emitted('remove-requested')).toBeUndefined()
  })

  // El padre borra en el servidor y reasigna el v-model; la fila desaparece por el
  // watcher, sin que el hijo exponga nada para eso.
  it('la fila desaparece cuando el padre reasigna los fields', async () => {
    const wrapper = createWrapper(
      [{ key: 'column_a', label: 'Contexto' }, { key: 'column_b', label: 'Método' }],
      { confirmRemove: true }
    )
    await wrapper.vm.$nextTick()

    wrapper.setProps({ fields: [{ key: 'column_b', label: 'Método' }] })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.localFields.map(f => f.key)).toEqual(['column_b'])
  })
})

describe('CustomFieldsManager — order-changed', () => {
  // El reorden es lo único que se puede diferir: es conmutativo desde que el backend
  // acepta un subconjunto en `order`, así que el padre lo acumula y lo manda una vez al
  // cerrar en lugar de un request por arrastre.
  it('emite order-changed con las claves en su orden nuevo al soltar', async () => {
    const wrapper = createWrapper([
      { key: 'column_a', label: 'A' },
      { key: 'column_b', label: 'B' }
    ])
    await wrapper.vm.$nextTick()
    wrapper.vm.localFields.reverse()

    wrapper.vm.onDragEnd()

    expect(wrapper.emitted('order-changed')[0][0]).toEqual(['column_b', 'column_a'])
  })

  // Una columna recién agregada todavía no tiene clave: mandarla en `order` sería un 400
  // por clave desconocida, porque el servidor no la tiene.
  it('omite del orden las columnas que todavía no tienen clave', async () => {
    const wrapper = createWrapper([{ key: 'column_a', label: 'A' }])
    await wrapper.vm.$nextTick()
    wrapper.vm.addField()

    wrapper.vm.onDragEnd()

    expect(wrapper.emitted('order-changed')[0][0]).toEqual(['column_a'])
  })
})
