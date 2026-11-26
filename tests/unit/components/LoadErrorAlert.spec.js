import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import LoadErrorAlert from '@/components/LoadErrorAlert.vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Interpola de verdad: lo que se prueba es que los nombres de las partes LLEGAN al texto.
const $t = (key, params) => (params ? `${key}|${JSON.stringify(params)}` : key)
const mountIt = (propsData) => shallowMount(LoadErrorAlert, { localVue, propsData, mocks: { $t } })

// El aviso de «no se pudo cargar» de las vistas con varias cargas (proyecto, vistas
// compartidas). Una sola pieza, para que todas digan lo mismo del mismo modo.
describe('LoadErrorAlert', () => {
  it('sin partes caídas no dibuja nada', () => {
    expect(mountIt({ parts: [] }).find('[data-test="load-error"]').exists()).toBe(false)
  })

  it('nombra lo que faltó', () => {
    const w = mountIt({ parts: ['references', 'categories'] })
    expect(w.text()).toContain('project.load_part.references, project.load_part.categories')
  })

  it('si faltan los grupos, agrega la nota de numeración', () => {
    expect(mountIt({ parts: ['categories'] }).text()).toContain('project.load_error_numbering')
    expect(mountIt({ parts: ['references'] }).text()).not.toContain('project.load_error_numbering')
  })

  it('Reintentar emite retry', () => {
    const w = mountIt({ parts: ['references'] })
    w.find('[data-test="load-error-retry"]').trigger('click')
    expect(w.emitted('retry')).toBeTruthy()
  })
})
