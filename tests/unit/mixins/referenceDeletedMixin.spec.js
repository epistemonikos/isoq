import { shallowMount } from '@vue/test-utils'
import referenceDeletedMixin from '@/mixins/referenceDeletedMixin'
import projectFreshnessMixin from '@/mixins/projectFreshnessMixin'

jest.mock('@/utils/Api', () => ({ getHeaders: () => ({}) }))
jest.mock('@/store', () => ({ store: { state: { isOnline: true } } }))

const fire = (refId) => window.dispatchEvent(new CustomEvent('reference-deleted', {
  detail: { refId, deletedBy: 'Ana', source: 'lock' }
}))

// El editor de un estudio borrado se cierra: el servidor ya no acepta escrituras sobre
// él, y dejarlo en solo lectura invitaría a esperar algo que no va a pasar.
describe('referenceDeletedMixin', () => {
  const Editor = {
    mixins: [referenceDeletedMixin],
    data: () => ({ open: 'R1' }),
    render: h => h('div'),
    methods: {
      referenceDeletedOpenStudy () { return this.open },
      closeForDeletedReference: jest.fn()
    }
  }

  it('cierra el editor del estudio borrado', () => {
    const wrapper = shallowMount(Editor)
    fire('R1')
    expect(Editor.methods.closeForDeletedReference).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })

  it('no toca el editor de otro estudio, ni uno cerrado', async () => {
    Editor.methods.closeForDeletedReference.mockClear()
    const wrapper = shallowMount(Editor)
    fire('R2')
    await wrapper.setData({ open: null })
    fire('R1')
    expect(Editor.methods.closeForDeletedReference).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('deja de escuchar al desmontarse', () => {
    Editor.methods.closeForDeletedReference.mockClear()
    shallowMount(Editor).destroy()
    fire('R1')
    expect(Editor.methods.closeForDeletedReference).not.toHaveBeenCalled()
  })
})

// La fila del estudio borrado tiene que irse ya, no en el próximo sondeo — pero sin
// pisar el borrador de otro editor que siga abierto.
describe('projectFreshnessMixin — refresco al borrarse un estudio', () => {
  const View = (openEditor) => ({
    mixins: [projectFreshnessMixin],
    render: h => h('div'),
    data: () => ({ editorOpen: openEditor }),
    methods: {
      applyProjectRefresh: jest.fn(),
      hasOpenEditor () { return this.editorOpen }
    }
  })

  it('refresca en el acto sin editor abierto', () => {
    const Comp = View(false)
    const wrapper = shallowMount(Comp)
    fire('R1')
    expect(Comp.methods.applyProjectRefresh).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })

  it('con un editor abierto lo deja pendiente hasta que se cierre', async () => {
    const Comp = View(true)
    const wrapper = shallowMount(Comp)
    fire('R1')
    expect(Comp.methods.applyProjectRefresh).not.toHaveBeenCalled()
    expect(wrapper.vm.pendingRefresh).toBe(true)
    wrapper.vm.flushPendingRefresh()
    expect(Comp.methods.applyProjectRefresh).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })
})
