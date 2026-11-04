import { mount, createLocalVue } from '@vue/test-utils'
import UploadReferences from '@/components/project/UploadReferences.vue'
import BootstrapVue from 'bootstrap-vue'
import { fetchPublicationState } from '@/utils/publicationState'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/utils/publicationState')
jest.mock('@/utils/commons', () => ({
  getAuthorsFormat: jest.fn(() => 'Smith J'),
  parseReference: jest.fn(() => 'Smith J 2020'),
  getLastName: jest.fn(a => a.split(',')[0])
}))
jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: { refLocks: new Map() }
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

Object.defineProperty(window, 'localStorage', {
  value: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() },
  configurable: true
})

const flush = () => new Promise(resolve => setTimeout(resolve, 0))
const REVERT = 'references.delete_reverts_private'

const cited = (id, refs) => ({ id, name: id, cerqual: { option: 1, explanation: 'x' }, references: refs })
const publicProject = { id: 'proj1', public_type: 'fully' }

function createWrapper () {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = mount(UploadReferences, {
    localVue,
    propsData: {
      canEdit: true,
      references: [{ id: 'R1', authors: 'Smith J', title: 'T' }, { id: 'R2', authors: 'Smith J', title: 'U' }],
      lists: [],
      activeRefLocks: []
    },
    mocks: {
      $t: key => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $notify,
      $store: { state: { user: { id: 'me' } } }
    },
    stubs: { 'font-awesome-icon': true, videoHelp: true }
  })
  return { wrapper, $notify }
}

const trashButtons = wrapper => wrapper.findAll('td button')

describe('UploadReferences — deleting studies that would make the project private', () => {
  beforeEach(() => jest.clearAllMocks())

  test('a single study says so when it is what keeps the only visible finding complete', async () => {
    fetchPublicationState.mockResolvedValue({ project: publicProject, lists: [cited('L1', ['R1'])] })
    const { wrapper } = createWrapper()
    await trashButtons(wrapper).at(0).trigger('click')
    await flush()
    expect(fetchPublicationState).toHaveBeenCalledWith('proj1')
    expect(wrapper.text()).toContain(REVERT)
    wrapper.destroy()
  })

  test('a single study does not say so when another finding keeps the project public', async () => {
    fetchPublicationState.mockResolvedValue({ project: publicProject, lists: [cited('L1', ['R1']), cited('L2', ['R2'])] })
    const { wrapper } = createWrapper()
    await trashButtons(wrapper).at(0).trigger('click')
    await flush()
    expect(wrapper.text()).toContain('references.confirm_delete')
    expect(wrapper.text()).not.toContain(REVERT)
    wrapper.destroy()
  })

  test('deleting all studies says so when no visible finding would remain', async () => {
    fetchPublicationState.mockResolvedValue({ project: publicProject, lists: [cited('L1', ['R1']), cited('L2', ['R2'])] })
    const { wrapper } = createWrapper()
    const deleteAll = wrapper.findAll('button').filter(b => b.text() === 'references.delete_all')
    await deleteAll.at(0).trigger('click')
    await flush()
    expect(wrapper.find('[data-test="delete-reverts-private"]').text()).toBe(REVERT)
    wrapper.destroy()
  })

  test('a private project gets no revert text', async () => {
    fetchPublicationState.mockResolvedValue({ project: { id: 'proj1', public_type: 'private' }, lists: [cited('L1', ['R1'])] })
    const { wrapper } = createWrapper()
    await trashButtons(wrapper).at(0).trigger('click')
    await flush()
    expect(wrapper.text()).toContain('references.confirm_delete')
    expect(wrapper.text()).not.toContain(REVERT)
    wrapper.destroy()
  })

  test('a failed re-read notifies and does not open the confirmation', async () => {
    fetchPublicationState.mockRejectedValue(new Error('down'))
    const { wrapper, $notify } = createWrapper()
    await trashButtons(wrapper).at(0).trigger('click')
    await flush()
    expect($notify.error).toHaveBeenCalledWith('notifications.save_error')
    expect(wrapper.text()).not.toContain('references.confirm_delete')
    wrapper.destroy()
  })
})
