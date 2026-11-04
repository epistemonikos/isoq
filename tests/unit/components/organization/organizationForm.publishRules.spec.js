import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import organizationForm from '@/components/organization/organizationForm.vue'
import Project from '@/utils/project'
import Api from '@/utils/Api'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: { status: true } }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))

// The real publishRules module is used on purpose: this spec checks the form follows it.
jest.mock('@/utils/project', () => ({
  update: jest.fn(),
  create: jest.fn(),
  confirmIncompleteFindings: jest.fn().mockResolvedValue(true)
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

const COMPLETE = {
  id: 'p1',
  name: 'A title',
  authors: 'Smith J',
  author: 'Smith John',
  author_email: 'smith@example.org',
  review_question: 'What is it?',
  published_status: false,
  url_doi: '',
  complete_by_author: true,
  lists_authors: '',
  license_type: 'CC-BY-NC-ND',
  public_type: 'fully',
  no_personal_data_confirmed: true,
  use_camelot: false
}

function build (formData = {}, omit = []) {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const data = { ...COMPLETE, ...formData }
  omit.forEach(key => { delete data[key] })
  const wrapper = mount(organizationForm, {
    localVue,
    attachTo: document.body,
    propsData: { formData: data, canEdit: true },
    mocks: {
      $t: (key) => key,
      $route: { name: 'viewProject', params: { id: 'p1', org_id: 'org1' }, query: {} },
      $router: { push: jest.fn() },
      $notify
    },
    stubs: { videoHelp: true }
  })
  return { wrapper, $notify }
}

const saveButton = (wrapper) => wrapper.findAll('button').wrappers.find(b => b.text() === 'common.save')

describe('organizationForm.vue — shared publishing rules', () => {
  let wrapper
  afterEach(() => {
    if (wrapper) wrapper.destroy()
    wrapper = null
    jest.clearAllMocks()
  })

  test('url_doi blur marks an invalid value only when published_status is yes and public', async () => {
    ;({ wrapper } = build({ published_status: true, url_doi: 'not a url' }))
    const input = wrapper.find('#select-project-list-url-doi')
    await input.trigger('blur')
    expect(wrapper.vm.state.url_doi).toBe(false)
    expect(input.classes()).toContain('is-invalid')

    await input.setValue('https://example.org/review')
    await input.trigger('blur')
    expect(wrapper.vm.state.url_doi).toBeNull()
    expect(input.classes()).not.toContain('is-invalid')
  })

  test('url_doi blur never marks a private project', async () => {
    ;({ wrapper } = build({ published_status: true, url_doi: 'not a url', public_type: 'private' }))
    await wrapper.find('#select-project-list-url-doi').trigger('blur')
    expect(wrapper.vm.state.url_doi).toBeNull()
  })

  test('a title of two letters disables Save only when public', async () => {
    ;({ wrapper } = build({ name: 'ab' }))
    expect(saveButton(wrapper).attributes('disabled')).toBeTruthy()
    await wrapper.setProps({ formData: { ...COMPLETE, name: 'ab', public_type: 'private' } })
    expect(saveButton(wrapper).attributes('disabled')).toBeFalsy()
    await wrapper.setProps({ formData: { ...COMPLETE, name: '  ', public_type: 'private' } })
    expect(saveButton(wrapper).attributes('disabled')).toBeTruthy()
  })

  test('complete_by_author unanswered is marked when public', async () => {
    ;({ wrapper } = build({ complete_by_author: null }))
    await wrapper.find('#select-project-list-completed-by-author-status').trigger('blur')
    expect(wrapper.vm.state.complete_by_author).toBe(false)
    expect(wrapper.text()).toContain('project.validation.complete_by_author_required')
    const feedback = wrapper.findAll('.invalid-feedback').wrappers
      .find(f => f.text() === 'project.validation.complete_by_author_required')
    expect(feedback.isVisible()).toBe(true)
    expect(feedback.classes()).toContain('d-block')
  })

  test('the revert-to-private modal opens for any rule that stops holding, e.g. an email that becomes invalid', async () => {
    ;({ wrapper } = build())
    const show = jest.fn()
    wrapper.vm.$bvModal.show = show
    wrapper.vm.formData.author_email = 'broken'
    wrapper.vm.save()
    expect(show).toHaveBeenCalledWith('publish-warning-modal')
  })

  test('the revert-to-private modal stays closed when the project was private', () => {
    ;({ wrapper } = build({ public_type: 'private' }))
    const executeSave = jest.spyOn(wrapper.vm, 'executeSave').mockResolvedValue()
    wrapper.vm.formData.author_email = 'broken'
    wrapper.vm.save()
    expect(executeSave).toHaveBeenCalled()
  })

  test('cancel restores every changed field, licence included', async () => {
    ;({ wrapper } = build())
    const form = wrapper.vm.formData
    form.author_email = 'broken'
    form.name = 'Other'
    form.license_type = 'CC-BY'
    form.description = 'changed'
    form.public_type = 'private'
    wrapper.vm.pendingData = { ...form }
    wrapper.vm.handlePublishWarningCancel()
    expect(form.author_email).toBe(COMPLETE.author_email)
    expect(form.name).toBe(COMPLETE.name)
    expect(form.license_type).toBe('CC-BY-NC-ND')
    expect(form.public_type).toBe('fully')
    expect(form.description).toBeUndefined()
    expect(wrapper.vm.pendingData).toBeNull()
  })

  test('cancel leaves no red marks on the restored fields', async () => {
    ;({ wrapper } = build())
    wrapper.vm.$bvModal.show = jest.fn()
    wrapper.vm.formData.author_email = 'broken'
    wrapper.vm.formData.authors = ''
    wrapper.vm.save()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('#input-project-authors').classes()).toContain('is-invalid')
    wrapper.vm.handlePublishWarningCancel()
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.is-invalid').length).toBe(0)
  })

  test('opening it again clears marks that are no longer missing', async () => {
    ;({ wrapper } = build())
    wrapper.vm.$bvModal.show = jest.fn()
    wrapper.vm.markMissingFields({ ...COMPLETE, authors: '' })
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.state.authors).toBe(false)
    wrapper.vm.markMissingFields({ ...COMPLETE, author_email: 'broken' })
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.state.authors).toBeNull()
    expect(wrapper.vm.state.author_email).toBe(false)
  })

  test('a server publish_requirements_not_met marks missing_fields', async () => {
    ;({ wrapper } = build())
    const { $notify } = { $notify: wrapper.vm.$notify }
    Project.update.mockRejectedValue({
      response: { status: 400, data: { status: false, reason: 'publish_requirements_not_met', missing_fields: ['authors', 'license_type'], message: 'x' } }
    })
    await wrapper.vm.executeSave({ ...COMPLETE })
    expect(wrapper.vm.state.authors).toBe(false)
    expect(wrapper.vm.state.license).toBe(false)
    expect($notify.error).toHaveBeenCalledWith('project.notifications.publish_missing_fields')
    await flush()
    expect(wrapper.find('#input-project-authors').classes()).toContain('is-invalid')
  })

  test('a personal-data 400 is shown with its i18n key', async () => {
    ;({ wrapper } = build())
    Project.update.mockRejectedValue({
      response: { status: 400, data: { status: false, reason: 'personal_data_confirmation_required', message: 'raw server text' } }
    })
    await wrapper.vm.executeSave({ ...COMPLETE })
    expect(wrapper.vm.$notify.error).toHaveBeenCalledWith('publish.confirm_no_personal_data_required')
    expect(wrapper.vm.$notify.error).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.state.no_personal_data_confirmed).toBe(false)
  })

  test('a failed Project.update after a methodology change does not reload', async () => {
    ;({ wrapper } = build({ use_camelot: true }))
    const reload = jest.fn()
    const original = window.location
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, reload } })
    try {
      Api.get.mockResolvedValueOnce({ data: {} })
      Api.post.mockResolvedValueOnce({ data: { status: true } })
      Project.update.mockResolvedValue({
        data: { status: false, message: 'project.notifications.publish_missing_fields', state: { authors: false } }
      })
      wrapper.vm.pendingData = { ...COMPLETE, use_camelot: true }
      const hide = jest.spyOn(wrapper.vm.$bvModal, 'hide')
      await wrapper.vm.confirmCamelotToggle()
      expect(wrapper.vm.state.authors).toBe(false)
      expect(wrapper.vm.$notify.error).toHaveBeenCalledTimes(1)
      expect(wrapper.vm.$notify.error).toHaveBeenCalledWith('project.notifications.methodology_changed_properties_not_saved')
      expect(hide).toHaveBeenCalledWith('camelot-toggle-modal')
      expect(wrapper.vm.$router.push).not.toHaveBeenCalled()
      expect(reload).not.toHaveBeenCalled()
      expect(wrapper.vm.isMigrating).toBe(false)
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original })
    }
  })

  test('after a failed update following a methodology change, the next save does not convert again', async () => {
    ;({ wrapper } = build({ use_camelot: false }))
    Api.get.mockResolvedValue({ data: {} })
    Api.post.mockResolvedValue({ data: { status: true } })
    Project.update.mockResolvedValue({
      data: { status: false, message: 'project.notifications.publish_missing_fields', state: { authors: false } }
    })
    wrapper.vm.formData.use_camelot = true
    wrapper.vm.pendingData = { ...COMPLETE, use_camelot: true }
    await wrapper.vm.confirmCamelotToggle()
    const toggles = () => Api.post.mock.calls.filter(c => String(c[0]).includes('toggle_camelot')).length
    expect(toggles()).toBe(1)

    const show = jest.fn()
    wrapper.vm.$bvModal.show = show
    jest.spyOn(wrapper.vm, 'executeSave').mockResolvedValue()
    wrapper.vm.save()
    expect(show).not.toHaveBeenCalledWith('camelot-toggle-modal')
    expect(toggles()).toBe(1)
    expect(wrapper.vm.originalFormData.use_camelot).toBe(true)
  })

  test('a rejected can_publish shows an error and ends the save', async () => {
    ;({ wrapper } = build())
    Project.update.mockRejectedValue({
      response: { status: 500, data: { message: 'can_publish unavailable' } }
    })
    await expect(wrapper.vm.executeSave({ ...COMPLETE })).resolves.toBeUndefined()
    expect(wrapper.vm.$notify.error).toHaveBeenCalledWith('can_publish unavailable')
    expect(wrapper.vm.$notify.success).not.toHaveBeenCalled()
  })

  test('a project with complete_by_author stored as the string false requires lists_authors', async () => {
    ;({ wrapper } = build({ complete_by_author: 'false', lists_authors: '' }))
    const input = wrapper.find('#input-project-list-authors')
    expect(input.exists()).toBe(true)
    await input.trigger('blur')
    expect(wrapper.vm.state.lists_authors).toBe(false)
    expect(input.classes()).toContain('is-invalid')
  })
})

// The real Project.update runs the hook after validating and before the PATCH: this stands in.
const updateWithHook = async (data, beforeSave) => {
  if (beforeSave && await beforeSave() === false) return { data: { status: false, cancelled: true } }
  return { data: { status: true } }
}

describe('organizationForm.vue — Megan notice when going public from Properties', () => {
  let wrapper
  beforeEach(() => {
    Project.update.mockImplementation(updateWithHook)
  })
  afterEach(() => {
    if (wrapper) wrapper.destroy()
    wrapper = null
    jest.clearAllMocks()
    Project.confirmIncompleteFindings.mockResolvedValue(true)
  })

  test('going public from Properties asks the same confirmation, through the beforeSave hook', async () => {
    ;({ wrapper } = build({ public_type: 'private' }))
    const data = { ...COMPLETE, public_type: 'fully' }
    await wrapper.vm.executeSave(data)
    expect(Project.update).toHaveBeenCalledTimes(1)
    expect(typeof Project.update.mock.calls[0][1]).toBe('function')
    expect(Project.confirmIncompleteFindings).toHaveBeenCalledWith(wrapper.vm, 'p1')
    expect(wrapper.vm.$notify.success).toHaveBeenCalled()
  })

  test('a refused publish never shows the notice', async () => {
    ;({ wrapper } = build({ public_type: 'private' }))
    // Validation refuses: the real Project.update never reaches the hook.
    Project.update.mockResolvedValue({ data: { status: false, message: 'project.notifications.publish_missing_fields', state: {} } })
    await wrapper.vm.executeSave({ ...COMPLETE, public_type: 'fully' })
    expect(Project.confirmIncompleteFindings).not.toHaveBeenCalled()
    expect(wrapper.vm.$notify.error).toHaveBeenCalledWith('project.notifications.publish_missing_fields')
  })

  test('cancelling the confirmation stops the save without an error', async () => {
    ;({ wrapper } = build({ public_type: 'private' }))
    const { $notify } = wrapper.vm
    Project.confirmIncompleteFindings.mockResolvedValue(false)
    await wrapper.vm.executeSave({ ...COMPLETE, public_type: 'fully' })
    expect($notify.error).not.toHaveBeenCalled()
    expect($notify.success).not.toHaveBeenCalled()
  })

  test('Esc or a backdrop click (the notice resolves null) does not save', async () => {
    ;({ wrapper } = build({ public_type: 'private' }))
    const { $notify } = wrapper.vm
    Project.confirmIncompleteFindings.mockResolvedValue(null)
    await wrapper.vm.executeSave({ ...COMPLETE, public_type: 'fully' })
    expect($notify.error).not.toHaveBeenCalled()
    expect($notify.success).not.toHaveBeenCalled()
  })

  test('a failing count notifies and does not save', async () => {
    ;({ wrapper } = build({ public_type: 'private' }))
    Project.confirmIncompleteFindings.mockRejectedValue(new Error('boom'))
    await wrapper.vm.executeSave({ ...COMPLETE, public_type: 'fully' })
    expect(wrapper.vm.$notify.error).toHaveBeenCalledWith('notifications.publish_error')
    expect(wrapper.vm.$notify.success).not.toHaveBeenCalled()
  })

  test('saving a project that was already public does not ask', async () => {
    ;({ wrapper } = build())
    await wrapper.vm.executeSave({ ...COMPLETE, name: 'Other title' })
    expect(Project.confirmIncompleteFindings).not.toHaveBeenCalled()
  })

  test('saving a private project does not ask', async () => {
    ;({ wrapper } = build({ public_type: 'private' }))
    await wrapper.vm.executeSave({ ...COMPLETE, public_type: 'private' })
    expect(Project.confirmIncompleteFindings).not.toHaveBeenCalled()
  })
})

describe('organizationForm.vue — methodology change followed by a failing update', () => {
  let wrapper
  afterEach(() => {
    if (wrapper) wrapper.destroy()
    wrapper = null
    jest.clearAllMocks()
  })

  const toggles = () => Api.post.mock.calls.filter(c => String(c[0]).includes('toggle_camelot')).length

  test.each([
    ['rejects', () => Project.update.mockRejectedValue({ response: { status: 500, data: {} } })],
    ['returns status false', () => Project.update.mockResolvedValue({ data: { status: false, message: 'project.notifications.publish_missing_fields', state: {} } })]
  ])('when Project.update %s, the methodology stays synced and the next save does not convert again', async (_, arrange) => {
    ;({ wrapper } = build({ use_camelot: false }))
    Api.get.mockResolvedValue({ data: {} })
    Api.post.mockResolvedValue({ data: { status: true } })
    arrange()
    wrapper.vm.formData.use_camelot = true
    wrapper.vm.pendingData = { ...COMPLETE, use_camelot: true }
    await wrapper.vm.confirmCamelotToggle()
    expect(toggles()).toBe(1)
    expect(wrapper.vm.originalFormData.use_camelot).toBe(true)
    expect(wrapper.vm.formData.use_camelot).toBe(true)

    const show = jest.fn()
    wrapper.vm.$bvModal.show = show
    jest.spyOn(wrapper.vm, 'executeSave').mockResolvedValue()
    wrapper.vm.save()
    expect(show).not.toHaveBeenCalledWith('camelot-toggle-modal')
    expect(toggles()).toBe(1)
  })

  test('a thrown update says the properties were not saved, not that the methodology failed', async () => {
    ;({ wrapper } = build({ use_camelot: false }))
    Api.get.mockResolvedValue({ data: {} })
    Api.post.mockResolvedValue({ data: { status: true } })
    Project.update.mockRejectedValue({ response: { status: 500, data: {} } })
    wrapper.vm.pendingData = { ...COMPLETE, use_camelot: true }
    await wrapper.vm.confirmCamelotToggle()
    expect(wrapper.vm.$notify.error).toHaveBeenCalledWith('project.notifications.methodology_changed_properties_not_saved')
    expect(wrapper.vm.$notify.error).not.toHaveBeenCalledWith('project.notifications.error_updating_methodology')
    expect(wrapper.vm.isMigrating).toBe(false)
  })

  test('a refused update after the toggle raises one toast (the methodology note) and keeps the fields red', async () => {
    ;({ wrapper } = build({ use_camelot: false }))
    Api.get.mockResolvedValue({ data: {} })
    Api.post.mockResolvedValue({ data: { status: true } })
    Project.update.mockResolvedValue({ data: { status: false, message: 'project.notifications.publish_missing_fields', state: { author_email: false } } })
    wrapper.vm.pendingData = { ...COMPLETE, use_camelot: true }
    await wrapper.vm.confirmCamelotToggle()
    expect(wrapper.vm.$notify.error).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.$notify.error).toHaveBeenCalledWith('project.notifications.methodology_changed_properties_not_saved')
    expect(wrapper.vm.state.author_email).toBe(false)
  })

  test('a failed toggle still says the methodology could not be updated and keeps it unsynced', async () => {
    ;({ wrapper } = build({ use_camelot: false }))
    Api.get.mockResolvedValue({ data: {} })
    Api.post.mockRejectedValue(new Error('boom'))
    wrapper.vm.pendingData = { ...COMPLETE, use_camelot: true }
    await wrapper.vm.confirmCamelotToggle()
    expect(wrapper.vm.$notify.error).toHaveBeenCalledWith('project.notifications.error_updating_methodology')
    expect(wrapper.vm.originalFormData.use_camelot).toBe(false)
  })
})

describe('organizationForm.vue — revert-to-private modal', () => {
  let wrapper
  afterEach(() => {
    if (wrapper) wrapper.destroy()
    wrapper = null
    jest.clearAllMocks()
  })

  test('opening it marks the missing fields so the person sees what is missing', () => {
    ;({ wrapper } = build())
    wrapper.vm.$bvModal.show = jest.fn()
    wrapper.vm.formData.authors = ''
    wrapper.vm.formData.license_type = ''
    wrapper.vm.formData.author_email = 'broken'
    wrapper.vm.save()
    expect(wrapper.vm.$bvModal.show).toHaveBeenCalledWith('publish-warning-modal')
    expect(wrapper.vm.state.authors).toBe(false)
    expect(wrapper.vm.state.author_email).toBe(false)
    expect(wrapper.vm.state.name).toBeNull()
  })

  test('a person who already chose Private saves normally, without the modal', () => {
    ;({ wrapper } = build())
    const show = jest.fn()
    wrapper.vm.$bvModal.show = show
    const executeSave = jest.spyOn(wrapper.vm, 'executeSave').mockResolvedValue()
    wrapper.vm.formData.public_type = 'private'
    wrapper.vm.formData.author_email = 'broken'
    wrapper.vm.save()
    expect(show).not.toHaveBeenCalledWith('publish-warning-modal')
    expect(executeSave).toHaveBeenCalled()
  })

  // The project as last loaded is what the revert-to-private modal compares against. A
  // project that never stored the licence or the personal-data box gets those keys added
  // by v-model ($set) when the person picks a public level: that is an edit, not a new
  // project, and it must not become the "as loaded" state (it opened the modal on a
  // private project being published).
  test('adding a missing key while editing keeps the project as loaded', async () => {
    ;({ wrapper } = build({ public_type: 'private', private: true }, ['license_type', 'no_personal_data_confirmed']))
    wrapper.vm.formData.public_type = 'fully'
    await wrapper.vm.$nextTick()
    wrapper.vm.$set(wrapper.vm.formData, 'license_type', 'CC-BY-NC-ND')
    wrapper.vm.$set(wrapper.vm.formData, 'no_personal_data_confirmed', true)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.originalFormData.public_type).toBe('private')
    const show = jest.spyOn(wrapper.vm.$bvModal, 'show').mockImplementation(() => {})
    const executeSave = jest.spyOn(wrapper.vm, 'executeSave').mockImplementation(() => {})
    wrapper.vm.save()
    expect(show).not.toHaveBeenCalledWith('publish-warning-modal')
    expect(executeSave).toHaveBeenCalled()
  })

  test('a new project object from the parent still becomes the project as loaded', async () => {
    ;({ wrapper } = build({ public_type: 'private', private: true }))
    await wrapper.setProps({ formData: { ...COMPLETE, public_type: 'fully', private: false } })

    expect(wrapper.vm.originalFormData.public_type).toBe('fully')
  })
})
