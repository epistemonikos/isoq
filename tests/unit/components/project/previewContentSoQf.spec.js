import { shallowMount, createLocalVue } from '@vue/test-utils'
import previewContentSoQf from '@/components/previewContent/previewContentSoQf.vue'
import Api from '@/utils/Api'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} }))
}))

const BUNDLE = {
  project: { id: 'p1', name: 'Test Project', public_type: 'private', inclusion: '', exclusion: '' },
  lists: [
    {
      id: 'l1', isoqf_id: 1, name: 'Finding 1', sort: 1, category: null,
      notes: '', references: [], cerqual: { option: 0, explanation: 'High confidence reason' },
      evidence_profile: { cerqual: { option: 0, explanation: 'High confidence reason' } }
    }
  ],
  findings: [{ id: 'f1', list_id: 'l1' }],
  references: [{ id: 'ref1', authors: 'Smith', year: '2020', title: 'Study 1' }],
  characteristics: [],
  assessments: [],
  list_categories: [{ id: 'cat1', text: 'Category A', extra_info: '' }]
}

const sharedMocks = {
  $t: (key) => key,
  $route: { name: 'sharedContent', params: { token: 'abc123' } },
  $router: { push: jest.fn() }
}

const publicMocks = {
  $t: (key) => key,
  $route: { name: 'previewContentSoQf', params: { org_id: 'org1', isoqf_id: 'p1', token: 'public' } },
  $router: { push: jest.fn() }
}

describe('previewContentSoQf.vue — bundle mode (/shared/:token)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls GET /shared/:token (not collection endpoints) when route is sharedContent', async () => {
    Api.get.mockResolvedValue({ data: BUNDLE })

    shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })

    expect(Api.get).toHaveBeenCalledWith('/shared/abc123')
    expect(Api.get).not.toHaveBeenCalledWith(expect.stringContaining('isoqf_projects'))
    expect(Api.get).not.toHaveBeenCalledWith(expect.stringContaining('isoqf_lists'))
  })

  it('populates project from bundle data', async () => {
    Api.get.mockResolvedValue({ data: BUNDLE })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
    await flushPromises()

    expect(wrapper.vm.project.name).toBe('Test Project')
    expect(wrapper.vm.ui.project.show_criteria).toBe(true)
  })

  it('populates references and findings from bundle', async () => {
    Api.get.mockResolvedValue({ data: BUNDLE })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
    await flushPromises()

    expect(wrapper.vm.references).toEqual(BUNDLE.references)
    expect(wrapper.vm.findings).toEqual(BUNDLE.findings)
  })

  it('processes list_categories from bundle', async () => {
    Api.get.mockResolvedValue({ data: BUNDLE })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
    await flushPromises()

    const options = wrapper.vm.list_categories.options
    expect(options.some(o => o.id === 'cat1')).toBe(true)
    expect(options.some(o => o.id === null)).toBe(true)
  })

  it('processes lists from bundle (cerqual_option, filter_cerqual)', async () => {
    Api.get.mockResolvedValue({ data: BUNDLE })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
    await flushPromises()

    expect(wrapper.vm.lists.length).toBe(1)
    // cerqual_option now comes from cerqual_confidence via $t (mocked as key => key),
    // so it resolves to the i18n key instead of a hardcoded English string.
    expect(wrapper.vm.lists[0].cerqual_option).toBe('cerqual_options.high_confidence')
    expect(wrapper.vm.lists[0].filter_cerqual).toBe('hc')
  })

  it('redirects to MainPage on 404 (invalid token)', async () => {
    Api.get.mockRejectedValue(new Error('404'))

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 2000))

    expect(sharedMocks.$router.push).toHaveBeenCalledWith({ name: 'MainPage' })
  }, 10000)

  it('does NOT call loadSharedBundle for public route (old route stays working)', () => {
    Api.get.mockResolvedValue({ data: { sharedToken: 'public', public_type: 'fully' } })

    shallowMount(previewContentSoQf, { localVue, mocks: publicMocks })

    expect(Api.get).not.toHaveBeenCalledWith(expect.stringContaining('/shared/'))
    expect(Api.get).toHaveBeenCalledWith(
      expect.stringContaining('isoqf_projects'),
      expect.any(Object)
    )
  })

  it('redirects to MainPage for a private project loaded via the /browse route', async () => {
    Api.get.mockResolvedValue({ data: { id: 'p1', public_type: 'private' } })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: publicMocks })
    await flushPromises()

    expect(wrapper.vm.$router.push).toHaveBeenCalledWith({ name: 'MainPage' })
  })

  it('does not treat a leftover project.sharedToken as authorization for a private project', async () => {
    // The project payload can no longer carry sharedToken (backend stopped returning it),
    // but even if a stale value were present it must not grant access on its own.
    Api.get.mockResolvedValue({ data: { id: 'p1', public_type: 'private', sharedToken: 'public' } })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: publicMocks })
    await flushPromises()

    expect(wrapper.vm.$router.push).toHaveBeenCalledWith({ name: 'MainPage' })
  })

  describe('el número del finding viene de displayNumber, no de cnt', () => {
    const L1 = '66b1ff0000000000000000a1'
    const L2 = '66b1ff0000000000000000a2'
    const CAT_A = '66b1ff0000000000000000c1'
    const CAT_Z = '66b1ff0000000000000000c2'

    it('numera agrupando por categoría y no deja rastros de cnt', async () => {
      // L2 está en Alpha, así que va primero y es el #1 aunque su sort sea mayor.
      // Los isoqf_id (41, 42) están al revés a propósito.
      const bundle = {
        ...BUNDLE,
        lists: [
          { ...BUNDLE.lists[0], id: L1, category: CAT_Z, sort: 5, isoqf_id: 41 },
          { ...BUNDLE.lists[0], id: L2, category: CAT_A, sort: 9, isoqf_id: 42 }
        ],
        list_categories: [
          { id: CAT_A, text: 'Alpha', extra_info: '' },
          { id: CAT_Z, text: 'Zeta', extra_info: '' }
        ]
      }

      Api.get.mockResolvedValue({ data: bundle })
      const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
      await flushPromises()

      const items = wrapper.vm.lists_print_version.filter(i => i.id === L1 || i.id === L2)
      expect(items.map(i => [i.id, i.displayNumber])).toEqual([[L2, 1], [L1, 2]])
      // Los encabezados de categoría no llevan número
      const headers = wrapper.vm.lists_print_version.filter(i => i.id !== L1 && i.id !== L2)
      expect(headers.every(h => h.displayNumber === undefined)).toBe(true)

      wrapper.destroy()
    })
  })

  // La preview y la impresión del proyecto usaban `items` verbatim, así que un estudio sin
  // fila en el documento no aparecía. Su única siembra venía de un PATCH de documento
  // completo en el Paso 3/4, que es la ruta que el servidor va a cerrar — y que además
  // nunca corría para un proyecto que nadie editó en esos pasos.
  describe('estudios sin fila en el documento', () => {
    const refs = [
      { id: 'r1', content: 'Smith, J. (2020). Uno.' },
      { id: 'r2', content: 'Garcia, M. (2021). Dos.' }
    ]

    it('los deriva en la tabla de características', () => {
      const wrapper = shallowMount(previewContentSoQf, {
        localVue,
        mocks: publicMocks,
        data () {
          return {
            project: { id: 'p1', use_camelot: false },
            references: refs,
            charsOfStudies: {
              fields: [{ key: 'ref_id' }, { key: 'authors' }, { key: 'column_0' }],
              items: [{ ref_id: 'r1', authors: 'Smith 2020', column_0: 'algo' }]
            }
          }
        }
      })

      const ids = wrapper.vm.charsOfStudiesRows.items.map(i => i.ref_id)
      expect(ids).toEqual(expect.arrayContaining(['r1', 'r2']))
      wrapper.destroy()
    })

    it('los deriva en la tabla de evaluaciones metodológicas', () => {
      const wrapper = shallowMount(previewContentSoQf, {
        localVue,
        mocks: publicMocks,
        data () {
          return {
            project: { id: 'p1', use_camelot: false },
            references: refs,
            methodologicalTableRefs: {
              fields: [{ key: 'ref_id' }, { key: 'authors' }],
              fieldsObj: [{ key: 'authors' }, { key: 'column_0' }],
              items: [{ ref_id: 'r2', authors: 'Garcia 2021' }]
            }
          }
        }
      })

      const ids = wrapper.vm.methodologicalRows.items.map(i => i.ref_id)
      expect(ids).toEqual(expect.arrayContaining(['r1', 'r2']))
      wrapper.destroy()
    })

    // Las referencias llegan por un request aparte: si se derivara al recibir el documento,
    // el resultado dependería de cuál respondiera primero.
    it('no depende de que las referencias hayan llegado antes que el documento', async () => {
      const wrapper = shallowMount(previewContentSoQf, {
        localVue,
        mocks: publicMocks,
        data () {
          return {
            project: { id: 'p1', use_camelot: false },
            references: [],
            charsOfStudies: {
              fields: [{ key: 'ref_id' }, { key: 'authors' }],
              items: [{ ref_id: 'r1', authors: 'Smith 2020' }]
            }
          }
        }
      })
      // `mounted` puebla `references` con la respuesta del mock de forma asíncrona: sin
      // dejarla asentar, sobrescribe lo que este test siembra después.
      await flushPromises()
      await wrapper.setData({
        references: [],
        charsOfStudies: {
          fields: [{ key: 'ref_id' }, { key: 'authors' }],
          items: [{ ref_id: 'r1', authors: 'Smith 2020' }]
        }
      })
      expect(wrapper.vm.charsOfStudiesRows.items).toHaveLength(1)

      await wrapper.setData({ references: refs })

      expect(wrapper.vm.charsOfStudiesRows.items).toHaveLength(2)
      wrapper.destroy()
    })
  })
})
