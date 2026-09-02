import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([]),
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn(),
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

function createWrapper () {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = shallowMount(viewProject, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
      $router: { push: jest.fn() },
      $store: { state: { user: { personal_organization: 'org1', id: 1 } } },
      $notify
    },
    stubs
  })
  return { wrapper, $notify }
}

describe('viewProject.vue — processGetListCategories()', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper().wrapper
    await flushPromises()
  })

  afterEach(() => wrapper.destroy())

  it('clears options when data is empty', () => {
    wrapper.vm.processGetListCategories([])
    expect(wrapper.vm.list_categories.options).toEqual([])
    expect(wrapper.vm.modal_edit_list_categories.options).toEqual([])
  })

  it('prepends no_group entry to list_categories.options', () => {
    wrapper.vm.processGetListCategories([{ id: 'c1', text: 'Cat 1' }])
    expect(wrapper.vm.list_categories.options[0]).toEqual({ id: null, text: 'categories.no_group' })
  })

  it('does NOT prepend no_group to modal_edit_list_categories.options', () => {
    wrapper.vm.processGetListCategories([{ id: 'c1', text: 'Cat 1' }])
    expect(wrapper.vm.modal_edit_list_categories.options).toHaveLength(1)
    expect(wrapper.vm.modal_edit_list_categories.options[0].id).toBe('c1')
  })

  it('sorts categories alphabetically by text', () => {
    wrapper.vm.processGetListCategories([
      { id: 'c3', text: 'Zebra' },
      { id: 'c1', text: 'Apple' },
      { id: 'c2', text: 'Mango' }
    ])
    const sorted = wrapper.vm.list_categories.options.slice(1).map(o => o.text)
    expect(sorted).toEqual(['Apple', 'Mango', 'Zebra'])
  })

  it('adds empty text property to options that lack it', () => {
    wrapper.vm.processGetListCategories([{ id: 'c1' }])
    expect(wrapper.vm.modal_edit_list_categories.options[0].text).toBe('')
  })
})

describe('viewProject.vue — saveNewCategory()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('posts to /isoqf_list_categories with text and extra_info', async () => {
    Api.post.mockResolvedValueOnce({ data: {} })
    const { wrapper } = createWrapper()
    await flushPromises()
    jest.spyOn(wrapper.vm, 'getListCategories').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    await wrapper.setData({
      modal_edit_list_categories: {
        ...wrapper.vm.modal_edit_list_categories,
        text: 'My Category',
        extra_info: 'Some info'
      }
    })
    wrapper.vm.saveNewCategory()
    await flushPromises()
    expect(Api.post).toHaveBeenCalledWith('/isoqf_list_categories', expect.objectContaining({
      text: 'My Category',
      extra_info: 'Some info',
      organization: 'org1',
      project_id: 'proj1'
    }))
    wrapper.destroy()
  })

  it('calls getListCategories and getLists on success', async () => {
    Api.post.mockResolvedValueOnce({ data: {} })
    const { wrapper } = createWrapper()
    await flushPromises()
    const getListCategoriesSpy = jest.spyOn(wrapper.vm, 'getListCategories').mockResolvedValue()
    const getListsSpy = jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    wrapper.vm.saveNewCategory()
    await flushPromises()
    expect(getListCategoriesSpy).toHaveBeenCalled()
    expect(getListsSpy).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('resets modal state on success', async () => {
    Api.post.mockResolvedValueOnce({ data: {} })
    const { wrapper } = createWrapper()
    await flushPromises()
    jest.spyOn(wrapper.vm, 'getListCategories').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    await wrapper.setData({
      modal_edit_list_categories: {
        ...wrapper.vm.modal_edit_list_categories,
        new: true,
        text: 'My Cat',
        extra_info: 'Info'
      }
    })
    wrapper.vm.saveNewCategory()
    await flushPromises()
    expect(wrapper.vm.modal_edit_list_categories.new).toBe(false)
    expect(wrapper.vm.modal_edit_list_categories.text).toBe('')
    expect(wrapper.vm.modal_edit_list_categories.extra_info).toBe('')
    wrapper.destroy()
  })
})

// Nada impide en el servidor crear dos categorías con el mismo nombre en un proyecto: no
// hay índice único ni validación (medido: 21 grupos duplicados sobre 1730 categorías, en 5
// proyectos, 16 de ellos con findings repartidos entre las dos copias). Con dos homónimas,
// `Commons.sortFindings` las trata como grupos distintos: la tabla muestra dos secciones con
// el mismo título y la numeración de los findings se parte entre ambas.
//
// La regla es un invariante de TRANSICIÓN, no de estado: prohíbe INTRODUCIR una colisión y
// tolera las que ya existen. Por eso no hace falta migrar la base antes de publicar esto.
describe('viewProject.vue — nombre de categoría duplicado', () => {
  beforeEach(() => jest.clearAllMocks())

  async function conCatalogo (options, extra = {}) {
    const { wrapper } = createWrapper()
    await flushPromises()
    jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    jest.spyOn(wrapper.vm, 'getListCategories').mockResolvedValue()
    await wrapper.setData({
      modal_edit_list_categories: { ...wrapper.vm.modal_edit_list_categories, options, ...extra }
    })
    return wrapper
  }

  it('no crea una categoría cuyo nombre ya existe en el proyecto', async () => {
    const wrapper = await conCatalogo([{ id: 'c1', text: 'Barreras' }], { new: true, text: 'Barreras' })

    await wrapper.vm.saveNewCategory()

    expect(Api.post).not.toHaveBeenCalled()
    expect(wrapper.vm.categoryNameIsDuplicate).toBe(true)
    wrapper.destroy()
  })

  // Medido en la base: 200 categorías (11,6 %) tienen espacios al borde. Dos strings que la
  // persona percibe como el mismo nombre tienen que colisionar.
  it('compara sin distinguir mayúsculas ni espacios al borde', async () => {
    const wrapper = await conCatalogo([{ id: 'c1', text: 'Barreras ' }], { new: true, text: '  BARRERAS' })

    await wrapper.vm.saveNewCategory()

    expect(Api.post).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('sí crea una categoría con un nombre que no existe', async () => {
    const wrapper = await conCatalogo([{ id: 'c1', text: 'Barreras' }], { new: true, text: 'Facilitadores' })

    await wrapper.vm.saveNewCategory()

    expect(Api.post).toHaveBeenCalled()
    expect(wrapper.vm.categoryNameIsDuplicate).toBe(false)
    wrapper.destroy()
  })

  // El caso que hace innecesario limpiar los 5 proyectos que ya arrastran duplicados: quien
  // abre una categoría homónima para tocarle el extra_info no está introduciendo nada.
  it('deja guardar una categoría que YA tiene homónima si no le cambia el nombre', async () => {
    const wrapper = await conCatalogo(
      [{ id: 'c1', text: '3. Emotion' }, { id: 'c2', text: '3. Emotion' }],
      { edit: true, id: 'c1', text: '3. Emotion', extra_info: 'descripción nueva' })

    await wrapper.vm.updateCategoryName()

    expect(Api.patch).toHaveBeenCalled()
    expect(wrapper.vm.categoryNameIsDuplicate).toBe(false)
    wrapper.destroy()
  })

  it('no renombra una categoría al nombre de otra que ya existe', async () => {
    const wrapper = await conCatalogo(
      [{ id: 'c1', text: 'Barreras' }, { id: 'c2', text: 'Facilitadores' }],
      { edit: true, id: 'c1', text: 'Facilitadores' })

    await wrapper.vm.updateCategoryName()

    expect(Api.patch).not.toHaveBeenCalled()
    expect(wrapper.vm.categoryNameIsDuplicate).toBe(true)
    wrapper.destroy()
  })

  // El catálogo local puede tener minutos: el gestor se abre y la persona se queda pensando
  // el nombre mientras otro crea el mismo. Sin releer del servidor, la validación mira justo
  // el dato que sabemos viejo.
  it('relee el catálogo del servidor antes de escribir, no confía en el local', async () => {
    const { wrapper } = createWrapper()
    await flushPromises()
    jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    const releer = jest.spyOn(wrapper.vm, 'getListCategories').mockImplementation(async () => {
      wrapper.vm.modal_edit_list_categories.options = [{ id: 'ajena', text: 'Barreras' }]
    })
    await wrapper.setData({
      modal_edit_list_categories: { ...wrapper.vm.modal_edit_list_categories, options: [], new: true, text: 'Barreras' }
    })

    await wrapper.vm.saveNewCategory()

    expect(releer).toHaveBeenCalled()
    expect(Api.post).not.toHaveBeenCalled()
    expect(wrapper.vm.categoryNameIsDuplicate).toBe(true)
    wrapper.destroy()
  })

  // Medido: 11 categorías de la base no tienen el campo `text`. String(undefined) daría
  // 'undefined' y las haría colisionar entre sí.
  it('tolera categorías sin el campo text sin marcarlas como duplicadas', async () => {
    const wrapper = await conCatalogo(
      [{ id: 'c1' }, { id: 'c2', text: null }], { new: true, text: 'Barreras' })

    expect(wrapper.vm.categoryNameIsDuplicate).toBe(false)
    await wrapper.vm.saveNewCategory()
    expect(Api.post).toHaveBeenCalled()
    wrapper.destroy()
  })

  // `list_categories.options` lleva prependido el {id: null, text: no_group}; comparar
  // contra ése bloquearía ese nombre de regalo.
  it('no bloquea el nombre de la entrada sintética "sin grupo"', async () => {
    const wrapper = await conCatalogo([], { new: true, text: 'categories.no_group' })

    expect(wrapper.vm.categoryNameIsDuplicate).toBe(false)
    wrapper.destroy()
  })
})

describe('viewProject.vue — updateCategoryName()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('does not call Api.patch when id is falsy', async () => {
    const { wrapper } = createWrapper()
    await flushPromises()
    await wrapper.setData({
      modal_edit_list_categories: { ...wrapper.vm.modal_edit_list_categories, id: null }
    })
    wrapper.vm.updateCategoryName()
    await flushPromises()
    expect(Api.patch).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('patches /isoqf_list_categories/:id with text and extra_info', async () => {
    Api.patch.mockResolvedValueOnce({ data: {} })
    const { wrapper } = createWrapper()
    await flushPromises()
    jest.spyOn(wrapper.vm, 'getListCategories').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    await wrapper.setData({
      modal_edit_list_categories: {
        ...wrapper.vm.modal_edit_list_categories,
        id: 'cat1',
        text: 'Updated Name',
        extra_info: 'Extra'
      }
    })
    wrapper.vm.updateCategoryName()
    await flushPromises()
    expect(Api.patch).toHaveBeenCalledWith('/isoqf_list_categories/cat1', {
      text: 'Updated Name',
      extra_info: 'Extra'
    })
    wrapper.destroy()
  })

  it('resets modal state on success', async () => {
    Api.patch.mockResolvedValueOnce({ data: {} })
    const { wrapper } = createWrapper()
    await flushPromises()
    jest.spyOn(wrapper.vm, 'getListCategories').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    await wrapper.setData({
      modal_edit_list_categories: {
        ...wrapper.vm.modal_edit_list_categories,
        id: 'cat1',
        edit: true,
        text: 'Name',
        extra_info: 'Info',
        index: 2
      }
    })
    wrapper.vm.updateCategoryName()
    await flushPromises()
    expect(wrapper.vm.modal_edit_list_categories.edit).toBe(false)
    expect(wrapper.vm.modal_edit_list_categories.text).toBe('')
    expect(wrapper.vm.modal_edit_list_categories.extra_info).toBe('')
    expect(wrapper.vm.modal_edit_list_categories.index).toBeNull()
    expect(wrapper.vm.modal_edit_list_categories.id).toBeNull()
    wrapper.destroy()
  })
})

describe('viewProject.vue — removeCategory()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deletes /isoqf_list_categories/:id', async () => {
    Api.delete.mockResolvedValueOnce({ data: {} })
    const { wrapper } = createWrapper()
    await flushPromises()
    jest.spyOn(wrapper.vm, 'getListCategories').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'updateLists').mockImplementation(() => {})
    await wrapper.setData({
      modal_edit_list_categories: {
        ...wrapper.vm.modal_edit_list_categories,
        id: 'cat1',
        index: 0,
        options: [{ id: 'cat1', text: 'Category 1' }]
      }
    })
    wrapper.vm.removeCategory()
    await flushPromises()
    expect(Api.delete).toHaveBeenCalledWith('/isoqf_list_categories/cat1')
    wrapper.destroy()
  })

  it('calls getListCategories and updateLists with the deleted item on success', async () => {
    Api.delete.mockResolvedValueOnce({ data: {} })
    const { wrapper } = createWrapper()
    await flushPromises()
    const getListCategoriesSpy = jest.spyOn(wrapper.vm, 'getListCategories').mockResolvedValue()
    const updateListsSpy = jest.spyOn(wrapper.vm, 'updateLists').mockImplementation(() => {})
    await wrapper.setData({
      modal_edit_list_categories: {
        ...wrapper.vm.modal_edit_list_categories,
        id: 'cat1',
        index: 0,
        options: [{ id: 'cat1', text: 'Category 1' }]
      }
    })
    wrapper.vm.removeCategory()
    await flushPromises()
    expect(getListCategoriesSpy).toHaveBeenCalled()
    expect(updateListsSpy).toHaveBeenCalledWith([{ id: 'cat1', text: 'Category 1' }])
    wrapper.destroy()
  })

  it('resets modal state on success', async () => {
    Api.delete.mockResolvedValueOnce({ data: {} })
    const { wrapper } = createWrapper()
    await flushPromises()
    jest.spyOn(wrapper.vm, 'getListCategories').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'updateLists').mockImplementation(() => {})
    await wrapper.setData({
      modal_edit_list_categories: {
        ...wrapper.vm.modal_edit_list_categories,
        id: 'cat1',
        index: 0,
        remove: true,
        text: 'Category 1',
        extra_info: 'info',
        options: [{ id: 'cat1', text: 'Category 1' }]
      }
    })
    wrapper.vm.removeCategory()
    await flushPromises()
    expect(wrapper.vm.modal_edit_list_categories.remove).toBe(false)
    expect(wrapper.vm.modal_edit_list_categories.text).toBe('')
    expect(wrapper.vm.modal_edit_list_categories.extra_info).toBe('')
    expect(wrapper.vm.modal_edit_list_categories.index).toBeNull()
    expect(wrapper.vm.modal_edit_list_categories.id).toBeNull()
    wrapper.destroy()
  })

  it('shows success notification on success', async () => {
    Api.delete.mockResolvedValueOnce({ data: {} })
    const { wrapper, $notify } = createWrapper()
    await flushPromises()
    jest.spyOn(wrapper.vm, 'getListCategories').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'updateLists').mockImplementation(() => {})
    await wrapper.setData({
      modal_edit_list_categories: {
        ...wrapper.vm.modal_edit_list_categories,
        id: 'cat1',
        index: 0,
        options: [{ id: 'cat1', text: 'Category 1' }]
      }
    })
    wrapper.vm.removeCategory()
    await flushPromises()
    expect($notify.success).toHaveBeenCalledWith('notifications.deleted')
    wrapper.destroy()
  })

  it('shows error notification on failure', async () => {
    Api.delete.mockRejectedValueOnce(new Error('network'))
    const { wrapper, $notify } = createWrapper()
    await flushPromises()
    await wrapper.setData({
      modal_edit_list_categories: {
        ...wrapper.vm.modal_edit_list_categories,
        id: 'cat1',
        index: 0,
        options: [{ id: 'cat1', text: 'Category 1' }]
      }
    })
    wrapper.vm.removeCategory()
    await flushPromises()
    expect($notify.error).toHaveBeenCalledWith('notifications.delete_error')
    wrapper.destroy()
  })
})

describe('viewProject.vue — updateLists()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('patches lists whose category matches the deleted category id', async () => {
    Api.patch.mockResolvedValue({ data: {} })
    const { wrapper } = createWrapper()
    await flushPromises()
    jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    await wrapper.setData({
      lists: [
        { id: 'l1', category: 'cat1' },
        { id: 'l2', category: 'cat2' }
      ]
    })
    wrapper.vm.updateLists([{ id: 'cat1', text: 'Category 1' }])
    await flushPromises()
    expect(Api.patch).toHaveBeenCalledWith('/isoqf_lists/l1', expect.objectContaining({ category: null }))
    expect(Api.patch).not.toHaveBeenCalledWith('/isoqf_lists/l2', expect.anything())
    wrapper.destroy()
  })

  // `displayNumber` es una posición derivada y NO debe persistirse nunca: es el quinto
  // atributo que la migración del número existe para no tener. Mandar el documento
  // entero lo escribía de vuelta, junto con cualquier `isoqf_id` legado que la lista
  // trajera del servidor. El PATCH tiene que llevar sólo el campo que cambia.
  it('patches ONLY the category, never the whole list document', async () => {
    Api.patch.mockResolvedValue({ data: {} })
    const { wrapper } = createWrapper()
    await flushPromises()
    jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    await wrapper.setData({
      lists: [
        {
          id: '66b1ff0000000000000000a1',
          category: 'cat1',
          sort: 40,
          displayNumber: 2,
          isoqf_id: 97,
          name: 'un finding'
        }
      ]
    })

    wrapper.vm.updateLists([{ id: 'cat1', text: 'Category 1' }])
    await flushPromises()

    expect(Api.patch).toHaveBeenCalledWith('/isoqf_lists/66b1ff0000000000000000a1', { category: null })
    const payload = Api.patch.mock.calls[0][1]
    expect(payload).not.toHaveProperty('displayNumber')
    expect(payload).not.toHaveProperty('isoqf_id')
    expect(payload).not.toHaveProperty('sort')
    wrapper.destroy()
  })

  it('calls getLists after Promise.all resolves', async () => {
    Api.patch.mockResolvedValue({ data: {} })
    const { wrapper } = createWrapper()
    await flushPromises()
    const getListsSpy = jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    await wrapper.setData({ lists: [{ id: 'l1', category: 'cat1' }] })
    wrapper.vm.updateLists([{ id: 'cat1', text: 'Cat' }])
    await flushPromises()
    expect(getListsSpy).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('makes no PATCH requests when no lists match the deleted category', async () => {
    const { wrapper } = createWrapper()
    await flushPromises()
    jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    await wrapper.setData({ lists: [{ id: 'l1', category: 'cat2' }] })
    wrapper.vm.updateLists([{ id: 'cat1', text: 'Cat' }])
    await flushPromises()
    expect(Api.patch).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})

describe('viewProject.vue — getCategoryName()', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper().wrapper
    await flushPromises()
    await wrapper.setData({
      list_categories: {
        options: [
          { id: null, text: 'categories.no_group' },
          { id: 'cat1', text: 'Intervention A' },
          { id: 'cat2', text: 'Intervention B' }
        ],
        selected: null
      }
    })
  })

  afterEach(() => wrapper.destroy())

  it('returns the text for a matching category id', () => {
    expect(wrapper.vm.getCategoryName('cat1')).toBe('Intervention A')
  })

  it('returns empty string when no category matches', () => {
    expect(wrapper.vm.getCategoryName('cat99')).toBe('')
  })
})
