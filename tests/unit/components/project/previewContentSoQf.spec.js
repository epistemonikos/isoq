import { shallowMount, mount, createLocalVue } from '@vue/test-utils'
import PrintViewTable from '@/components/project/PrintViewTable.vue'
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

  // Los ids reales son el string hex de un ObjectId: el viejo `sort((a, b) => a.id - b.id)`
  // daba NaN y no ordenaba nada, así que las citas de la columna References salían en el
  // orden de subida de las referencias al proyecto y no en orden alfabético.
  it('lista las citas de cada finding en orden alfabético, no en el de subida', async () => {
    const ids = ['65a1f0c2e4b0a1b2c3d4e5f6', '65a1f0c2e4b0a1b2c3d4e5f7', '65a1f0c2e4b0a1b2c3d4e5f8']
    Api.get.mockResolvedValue({
      data: {
        ...BUNDLE,
        lists: [{ ...BUNDLE.lists[0], references: ids }],
        // Orden de subida: Smith, Adams, Moore.
        references: [
          { id: ids[0], authors: ['Smith J'], publication_year: '2020' },
          { id: ids[1], authors: ['Adams A'], publication_year: '2019' },
          { id: ids[2], authors: ['Moore M'], publication_year: '2021' }
        ]
      }
    })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
    await flushPromises()

    expect(wrapper.vm.lists[0].raw_ref.map(r => r.id)).toEqual([ids[1], ids[2], ids[0]])
    wrapper.destroy()
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

describe('previewContentSoQf — hidden stubs and incomplete lists (public views)', () => {
  const complete = (id, sort, category = null) => ({
    id, name: `Finding ${id}`, sort, category, notes: '', references: ['ref1'],
    cerqual: { option: 0, explanation: 'Reason' }, evidence_profile: { cerqual: { option: 0, explanation: 'Reason' } }
  })
  const hiddenStub = (id, sort, category = null) => ({ id, project_id: 'p1', sort, category, hidden: true })

  // Renders what the page passes to the printable table and returns its DOM text.
  const renderedTable = (wrapper) => {
    const table = mount(PrintViewTable, {
      localVue,
      mocks: { $t: (key) => key, $route: { params: { token: 'public' } } },
      propsData: {
        references: wrapper.vm.references,
        dataPrintVersion: wrapper.vm.lists_print_version,
        categories: wrapper.vm.list_categories,
        printableItems: wrapper.vm.printableItems,
        hasPermission: true,
        isPublic: true,
        project: { id: 'p1', public_type: 'fully' }
      },
      stubs: { 'router-link': true, 'b-link': true }
    })
    const text = table.find('#findings-print').text()
    table.destroy()
    return text
  }
  const numbersOf = (wrapper) => {
    const table = mount(PrintViewTable, {
      localVue,
      mocks: { $t: (key) => key, $route: { params: { token: 'public' } } },
      propsData: {
        references: [], dataPrintVersion: wrapper.vm.lists_print_version, categories: wrapper.vm.list_categories,
        printableItems: wrapper.vm.printableItems, hasPermission: true, isPublic: false, project: { id: 'p1' }
      }
    })
    const cells = table.find('#findings-print').findAll('tbody tr').wrappers
      .filter(tr => tr.findAll('td').length > 1)
      .map(tr => tr.findAll('td').at(0).text())
    table.destroy()
    return cells
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('bundle route', () => {
    const mountBundle = async (bundle) => {
      Api.get.mockResolvedValue({ data: { ...BUNDLE, ...bundle } })
      const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
      await flushPromises()
      return wrapper
    }

    test('hidden stubs keep the public numbering with gaps', async () => {
      const wrapper = await mountBundle({ lists: [complete('l1', 1), hiddenStub('l2', 2), complete('l3', 3)] })

      expect(numbersOf(wrapper)).toEqual(['1', '3'])
      expect(renderedTable(wrapper)).not.toContain('Finding l2')
      expect(wrapper.vm.table_settings.totalRows).toBe(2)
      expect(wrapper.vm.printableItems).not.toContain('l2')
      wrapper.destroy()
    })

    test('hidden stubs keep the public numbering with gaps when there are categories', async () => {
      const wrapper = await mountBundle({
        lists: [complete('l1', 1, 'cat1'), hiddenStub('l2', 2, 'cat1'), complete('l3', 3, 'cat1')]
      })

      expect(numbersOf(wrapper)).toEqual(['1', '3'])
      wrapper.destroy()
    })

    test('a category with only hidden findings has no header', async () => {
      const wrapper = await mountBundle({
        lists: [complete('l1', 1, 'cat1'), hiddenStub('l2', 1, 'cat2')],
        list_categories: [
          { id: 'cat1', text: 'Category A', extra_info: '' },
          { id: 'cat2', text: 'Category B', extra_info: '' }
        ]
      })

      const text = renderedTable(wrapper)
      expect(text).toContain('Category A')
      expect(text).not.toContain('Category B')
      wrapper.destroy()
    })

    test('a list without cerqual does not break the public table', async () => {
      const bare = { id: 'l9', name: 'Bare finding', sort: 1, category: null }
      const wrapper = await mountBundle({ lists: [bare] })

      expect(wrapper.vm.loadErrors.lists).toBe(false)
      expect(renderedTable(wrapper)).toContain('Bare finding')
      expect(wrapper.vm.lists[0].status).toBe('unfinished')
      wrapper.destroy()
    })

    test('status follows the shared definition of complete', async () => {
      const noRefs = { ...complete('l2', 2), references: [] }
      const wrapper = await mountBundle({ lists: [complete('l1', 1), noRefs] })

      expect(wrapper.vm.lists.map(l => [l.id, l.status])).toEqual([['l1', 'completed'], ['l2', 'unfinished']])
      wrapper.destroy()
    })
  })

  describe('public route', () => {
    const mountPublic = async (lists, categories = []) => {
      Api.get.mockImplementation((url) => {
        if (String(url).includes('isoqf_projects')) return Promise.resolve({ data: { id: 'p1', public_type: 'fully' } })
        if (String(url).includes('isoqf_list_categories')) return Promise.resolve({ data: categories })
        if (String(url).includes('isoqf_lists')) return Promise.resolve({ data: lists })
        if (String(url).includes('isoqf_references')) return Promise.resolve({ data: BUNDLE.references })
        return Promise.resolve({ data: [] })
      })
      const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: publicMocks })
      await flushPromises()
      await flushPromises()
      return wrapper
    }

    test('hidden stubs keep the public numbering with gaps', async () => {
      const wrapper = await mountPublic([complete('l1', 1), hiddenStub('l2', 2), complete('l3', 3)])

      expect(numbersOf(wrapper)).toEqual(['1', '3'])
      expect(wrapper.vm.table_settings.totalRows).toBe(2)
      const findingCalls = Api.get.mock.calls.filter(c => String(c[0]).includes('isoqf_findings'))
      expect(findingCalls.map(c => c[1].list_id).sort()).toEqual(['l1', 'l3'])
      wrapper.destroy()
    })

    test('a list without cerqual does not break the public table', async () => {
      const wrapper = await mountPublic([{ id: 'l9', name: 'Bare finding', sort: 1, category: null }])

      expect(wrapper.vm.loadErrors.lists).toBe(false)
      expect(renderedTable(wrapper)).toContain('Bare finding')
      wrapper.destroy()
    })
  })
})
