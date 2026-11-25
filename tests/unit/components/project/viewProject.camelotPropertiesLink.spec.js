import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

// Guía CAMELOT (doc de Megan, 2026-11-20): la intro del Paso 4 enlaza a Propiedades en pestaña nueva.
// cambiaban `stepStage` y nunca escribían `?step=`, así que la recarga no sabía dónde

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([]),
  releaseRef: jest.fn()
}))

jest.mock('vuedraggable', () => ({ render: h => h('div') }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const stubs = {
  'action-buttons': true, 'propertiesProject': true, 'UploadReferences': true,
  'InclusionExclusioCriteria': true, 'crudTables': true, 'PrintViewTable': true,
  'ViewTable': true, 'CamelotStepThree': true, 'CamelotStepFour': true,
  'videoHelp': true, 'back-to-top': true, 'content-guidance': true
}

describe('viewProject.vue — enlace a Propiedades en la intro CAMELOT del Paso 4', () => {
  beforeEach(() => {
    Api.get.mockImplementation((url) => Promise.resolve({
      data: url === '/isoqf_references' ? [{ id: 'r1', authors: [], publication_year: '2020' }] : []
    }))
  })

  it('pasa a la traducción la URL de Propiedades del proyecto', async () => {
    const $route = { params: { id: 'proj1', org_id: 'org1' }, query: { tab: 'My-Data', step: '4' } }
    const $router = {
      push: jest.fn().mockResolvedValue(),
      replace: jest.fn().mockResolvedValue(),
      resolve: jest.fn(loc => ({ href: `#/workspace/${loc.params.org_id}/isoqf/${loc.params.id}?tab=${loc.query.tab}` }))
    }
    const wrapper = shallowMount(viewProject, {
      localVue,
      mocks: {
        $t: (key, params) => key === 'camelot.step_four.description'
          ? `<a href="${params.properties_url}" target="_blank">Project Properties</a>`
          : key,
        $route,
        $router,
        $store: { state: { user: { personal_organization: 'other-org', id: 1 } } },
        $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
      },
      stubs
    })
    await flushPromises()
    await wrapper.setData({ project: { ...wrapper.vm.project, use_camelot: true } })

    const link = wrapper.find('a[href="#/workspace/org1/isoqf/proj1?tab=Project-Property"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('target')).toBe('_blank')
    wrapper.destroy()
  })

  it('escapa la URL: un id con comilla no sale del atributo href', async () => {
    const $route = { params: { id: "x' onmouseover='alert(1)", org_id: 'org1' }, query: { tab: 'My-Data', step: '4' } }
    const $router = {
      push: jest.fn().mockResolvedValue(),
      replace: jest.fn().mockResolvedValue(),
      // Como vue-router 3: encodeURIComponent deja pasar la comilla simple.
      resolve: jest.fn(loc => ({ href: `#/isoqf/${encodeURIComponent(loc.params.id)}` }))
    }
    const wrapper = shallowMount(viewProject, {
      localVue,
      mocks: {
        $t: (key, params) => key === 'camelot.step_four.description'
          ? `<a href='${params.properties_url}' target='_blank'>Project Properties</a>`
          : key,
        $route,
        $router,
        $store: { state: { user: { personal_organization: 'other-org', id: 1 } } },
        $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
      },
      stubs
    })
    await flushPromises()
    await wrapper.setData({ project: { ...wrapper.vm.project, use_camelot: true } })

    const link = wrapper.find('p.font-weight-light a')
    // Sólo href y target: la comilla no abrió un atributo nuevo.
    expect(Array.from(link.element.attributes).map(a => a.name)).toEqual(['href', 'target'])
    expect(link.attributes('href')).toBe("#/isoqf/x'%20onmouseover%3D'alert(1)")
    wrapper.destroy()
  })
})
