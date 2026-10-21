import Project from '@/utils/project'
import Api from '@/utils/Api'

jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: { get: jest.fn(() => Promise.resolve({ data: { status: true } })), patch: jest.fn(() => Promise.resolve({ data: {} })) }
}))

const form = {
  id: 'p1',
  name: 'Proyecto',
  public_type: 'fully',
  license_type: 'CC-BY',
  authors: 'A',
  author: 'Autor',
  author_email: 'a@example.com',
  review_question: '¿Pregunta?',
  complete_by_author: true,
  no_personal_data_confirmed: true
}

// GET /api/project/can_publish used to receive the whole Properties form as query parameters,
// the authors' contact email included: every check left it in the access logs and in Sentry's
// breadcrumbs. The server reads the properties from the database; it only needs the project,
// the personal-data confirmation and, from the Publish modal, isModal.
describe('Project.canPublish — only what the server reads goes in the URL', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sends the id and the confirmation, nothing from the form', async () => {
    await Project.canPublish({ ...form })
    expect(Api.get).toHaveBeenCalledWith('/api/project/can_publish', { id: 'p1', no_personal_data_confirmed: true })
  })

  it('forwards isModal when the caller sets it', async () => {
    await Project.canPublish({ ...form, isModal: true })
    expect(Api.get).toHaveBeenCalledWith('/api/project/can_publish', { id: 'p1', no_personal_data_confirmed: true, isModal: true })
  })

  it('the Properties save goes through it with no personal data in the query', async () => {
    await Project.validations({ ...form })
    const params = Api.get.mock.calls[0][1]
    expect(Object.keys(params).sort()).toEqual(['id', 'no_personal_data_confirmed'])
  })
})
