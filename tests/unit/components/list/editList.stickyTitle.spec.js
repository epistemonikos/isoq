import { shallowMount, createLocalVue } from '@vue/test-utils'
import editList from '@/components/list/editList.vue'
import BootstrapVue from 'bootstrap-vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService', () => ({ releaseRef: jest.fn(), refLocks: new Map() }))
jest.mock('@/mixins/camelotMixin', () => ({
  camelotMixin: { data () { return { camelot: { categories: [], fields: [] } } } }
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const stubs = {
  'edit-header-list': true, 'edit-list-actions-buttons': true,
  'evidence-profile-table': true, 'table-chars-of-studies': true,
  'table-meth-assessments': true, 'table-extracted-data': true,
  'font-awesome-icon': true
}

// jsdom no tiene IntersectionObserver: se captura el callback para simular el scroll.
let observed
beforeEach(() => {
  observed = null
  window.IntersectionObserver = jest.fn(function (cb) {
    this.observe = jest.fn(el => { observed = { cb, el } })
    this.disconnect = jest.fn()
  })
})

async function mountEdit () {
  const wrapper = shallowMount(editList, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'list1' } },
      $store: { state: { user: { personal_organization: 'org1', id: 42 } } }
    },
    stubs,
    methods: { getList: jest.fn() }
  })
  await wrapper.setData({ mode: 'edit', list: { ...wrapper.vm.list, name: 'Mothers value support' } })
  return wrapper
}

const stickyTitle = w => w.find('[data-test="sticky-finding-title"]')

describe('editList.vue — el título del finding en el menú pegado', () => {
  it('no aparece mientras el menú está en su lugar', async () => {
    const wrapper = await mountEdit()
    expect(observed).not.toBeNull()
    expect(stickyTitle(wrapper).exists()).toBe(false)
  })

  it('aparece cuando el menú queda pegado arriba, y se va al volver', async () => {
    const wrapper = await mountEdit()
    observed.cb([{ isIntersecting: false, boundingClientRect: { top: -10 } }])
    await wrapper.vm.$nextTick()
    expect(stickyTitle(wrapper).text()).toContain('review_finding.title')
    expect(stickyTitle(wrapper).text()).toContain('Mothers value support')

    observed.cb([{ isIntersecting: true, boundingClientRect: { top: 5 } }])
    await wrapper.vm.$nextTick()
    expect(stickyTitle(wrapper).exists()).toBe(false)
  })

  it('un sentinela que sale por abajo (página corta) no lo muestra', async () => {
    const wrapper = await mountEdit()
    observed.cb([{ isIntersecting: false, boundingClientRect: { top: 900 } }])
    await wrapper.vm.$nextTick()
    expect(stickyTitle(wrapper).exists()).toBe(false)
  })
})
