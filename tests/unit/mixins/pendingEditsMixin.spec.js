import { shallowMount, createLocalVue } from '@vue/test-utils'
import pendingEditsMixin, { requestPendingEditsFlush, FLUSH_PENDING_EDITS } from '@/mixins/pendingEditsMixin'

const localVue = createLocalVue()

const Escucha = {
  mixins: [pendingEditsMixin],
  template: '<div />',
  data () { return { pedidos: [] } },
  methods: { flushPendingEdits (scope) { this.pedidos.push(scope) } }
}

// El contrato es opcional: un componente puede llevar el mixin y no implementarlo todavía.
const Sordo = { mixins: [pendingEditsMixin], template: '<div />' }

describe('pendingEditsMixin', () => {
  it('entrega el pedido con su scope', () => {
    const wrapper = shallowMount(Escucha, { localVue })
    requestPendingEditsFlush('R1')
    expect(wrapper.vm.pedidos).toEqual(['R1'])
    wrapper.destroy()
  })

  it('entrega scope null cuando no se especifica', () => {
    const wrapper = shallowMount(Escucha, { localVue })
    requestPendingEditsFlush()
    expect(wrapper.vm.pedidos).toEqual([null])
    wrapper.destroy()
  })

  // Cada componente decide si el scope le corresponde: el canal no filtra.
  it('reparte a todos los oyentes y deja que cada uno decida', () => {
    const a = shallowMount(Escucha, { localVue })
    const b = shallowMount(Escucha, { localVue })
    requestPendingEditsFlush('R7')
    expect(a.vm.pedidos).toEqual(['R7'])
    expect(b.vm.pedidos).toEqual(['R7'])
    a.destroy(); b.destroy()
  })

  it('un componente sin flushPendingEdits no rompe', () => {
    const wrapper = shallowMount(Sordo, { localVue })
    expect(() => requestPendingEditsFlush('R1')).not.toThrow()
    wrapper.destroy()
  })

  it('deja de escuchar al destruirse', () => {
    const wrapper = shallowMount(Escucha, { localVue })
    const vm = wrapper.vm
    wrapper.destroy()
    requestPendingEditsFlush('R1')
    expect(vm.pedidos).toEqual([])
  })

  it('el nombre del evento es estable', () => {
    expect(FLUSH_PENDING_EDITS).toBe('flush-pending-edits')
  })
})
