import Project from '@/utils/project'
import Api from '@/utils/Api'

jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(() => Promise.resolve({ data: { status: true, missing_fields: [], has_complete_finding: true } })),
    patch: jest.fn(() => Promise.resolve({ data: {} }))
  }
}))

const base = {
  name: 'Review',
  authors: 'Ana Pérez',
  author: 'Ana Pérez',
  author_email: 'ana@example.com',
  review_question: 'Why so?',
  complete_by_author: true,
  public_type: 'fully',
  no_personal_data_confirmed: true,
  id: 'p1'
}

describe('Project.validations with the shared publishing rules', () => {
  beforeEach(() => jest.clearAllMocks())

  test('a two-letter title is missing when publishing', async () => {
    const { data } = await Project.validations({ ...base, name: 'AB' })
    expect(data.status).toBe(false)
    expect(data.state.name).toBe(false)
    expect(data.message).toBe('project.notifications.publish_missing_fields')
    expect(Api.post).not.toHaveBeenCalled()
  })

  test('WHO is a valid author', async () => {
    const { data } = await Project.validations({ ...base, authors: 'WHO' })
    expect(data.status).toBe(true)
  })

  test('a private project only needs a non-blank title', async () => {
    expect((await Project.validations({ public_type: 'private', name: 'X' })).data.status).toBe(true)
    const { data } = await Project.validations({ public_type: 'private', name: '  ' })
    expect(data.state.name).toBe(false)
    expect(data.message).toBe('project.notifications.required_fields_error')
  })

  test('a DOI is accepted as url_doi', async () => {
    const { data } = await Project.validations({ ...base, published_status: 'true', url_doi: '10.1000/xyz' })
    expect(data.state && data.state.url_doi).not.toBe(false)
  })

  test('string answers from old projects count', async () => {
    const { data } = await Project.validations({ ...base, complete_by_author: 'false', lists_authors: 'WHO' })
    expect(data.status).toBe(true)
  })

  test('a blank licence does not block and is sent as CC-BY-NC-ND', async () => {
    const result = await Project.update({ ...base, license_type: '' })
    expect(result.data.status).toBe(true)
    expect(Api.patch.mock.calls[0][1].params.license_type).toBe('CC-BY-NC-ND')
  })

  test('top-level keys with dots, hashes or dollars never reach the PATCH', async () => {
    await Project.update({ ...base, 'a.b': 1, '#c': 2, $d: 3 })
    const sent = Api.patch.mock.calls[0][1].params
    expect(Object.keys(sent).filter(k => /[.#$]/.test(k))).toEqual([])
  })

  test('beforeSave runs after the validations and before the PATCH', async () => {
    const order = []
    Api.post.mockImplementationOnce(() => { order.push('can_publish'); return Promise.resolve({ data: { status: true } }) })
    Api.patch.mockImplementationOnce(() => { order.push('patch'); return Promise.resolve({ data: {} }) })
    const result = await Project.update({ ...base }, async () => { order.push('beforeSave') })
    expect(order).toEqual(['can_publish', 'beforeSave', 'patch'])
    expect(result.data.status).toBe(true)
  })

  test('beforeSave returning false aborts without a PATCH and says it was cancelled', async () => {
    const result = await Project.update({ ...base }, async () => false)
    expect(Api.patch).not.toHaveBeenCalled()
    expect(result.data).toEqual({ status: false, cancelled: true })
  })

  test('beforeSave never runs when the validations refuse', async () => {
    const beforeSave = jest.fn()
    Api.post.mockResolvedValueOnce({ data: { status: false, missing_fields: ['author_email'] } })
    const result = await Project.update({ ...base }, beforeSave)
    expect(beforeSave).not.toHaveBeenCalled()
    expect(result.data.status).toBe(false)
    expect(Api.patch).not.toHaveBeenCalled()
  })

  test('server missing_fields mark the fields', async () => {
    Api.post.mockResolvedValueOnce({ data: { status: false, missing_fields: ['author_email'], has_complete_finding: true } })
    const { data } = await Project.validations({ ...base })
    expect(data.status).toBe(false)
    expect(data.state.author_email).toBe(false)
    expect(data.message).toBe('project.notifications.publish_missing_fields')
  })

  test('no complete finding uses the publish requirement message', async () => {
    Api.post.mockResolvedValueOnce({ data: { status: false, missing_fields: [], has_complete_finding: false } })
    const { data } = await Project.validations({ ...base })
    expect(data.message).toBe('project.validation.publish_requirement')
    expect(data.state.can_publish).toBe(false)
  })

  test('the server asking for the confirmation maps to its message', async () => {
    Api.post.mockResolvedValueOnce({ data: { status: false, reason: 'personal_data_confirmation_required', missing_fields: [] } })
    const { data } = await Project.validations({ ...base })
    expect(data.message).toBe('publish.confirm_no_personal_data_required')
    expect(data.state.no_personal_data_confirmed).toBe(false)
  })

  test('a failing can_publish rejects so the caller can show it', async () => {
    Api.post.mockRejectedValueOnce(new Error('network'))
    await expect(Project.validations({ ...base })).rejects.toThrow('network')
  })
})
