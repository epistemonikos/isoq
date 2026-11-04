import Project from '@/utils/project'
import Api from '@/utils/Api'

jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(() => Promise.resolve({ data: { status: true } })), patch: jest.fn(() => Promise.resolve({ data: {} })) }
}))

const form = {
  id: 'p1',
  name: 'Proyecto',
  public_type: 'fully',
  license_type: 'CC-BY',
  authors: 'Ana Pérez',
  author: 'Autor',
  author_email: 'a@example.com',
  review_question: '¿Pregunta?',
  complete_by_author: true,
  no_personal_data_confirmed: true
}

describe('Project.canPublish asks the server with a body, never queued', () => {
  beforeEach(() => jest.clearAllMocks())

  test('posts the form values in the body, never queued', async () => {
    await Project.canPublish({ ...form })
    expect(Api.post).toHaveBeenCalledWith(
      '/api/project/can_publish',
      expect.objectContaining({ id: 'p1', author_email: 'a@example.com', no_personal_data_confirmed: true }),
      { noQueue: true }
    )
    expect(Api.get).not.toHaveBeenCalled()
  })

  test('only known keys travel, and none with dots, hashes or dollars', async () => {
    await Project.canPublish({ ...form, 'x.y': 1, $z: 2, isModal: true, last_update: 5 })
    const body = Api.post.mock.calls[0][1]
    expect(body).not.toHaveProperty('x.y')
    expect(body).not.toHaveProperty('$z')
    expect(body).not.toHaveProperty('last_update')
    expect(body).not.toHaveProperty('isModal')
    expect(body.public_type).toBe('fully')
    expect(body.license_type).toBe('CC-BY')
  })

  test('absent keys are not sent', async () => {
    await Project.canPublish({ id: 'p1' })
    expect(Object.keys(Api.post.mock.calls[0][1]).sort()).toEqual(['id'])
  })
})
