import Project from '@/utils/project'
import Api from '@/utils/Api'

jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: { get: jest.fn(() => Promise.resolve({ data: { status: true } })), patch: jest.fn(() => Promise.resolve({ data: {} })) }
}))

const complete = {
  id: 'p1',
  name: 'Proyecto',
  public_type: 'fully',
  license_type: 'CC-BY',
  authors: 'A',
  author: 'Autor',
  author_email: 'a@example.com',
  review_question: '¿Pregunta?',
  complete_by_author: true
}

/**
 * Propiedades guarda por `Project.update` → PATCH /api/publish. Sin la confirmación de datos
 * personales el servidor responde 400; la validación lo dice antes y marca el campo.
 */
describe('Project.validations — confirmación de datos personales', () => {
  beforeEach(() => jest.clearAllMocks())

  it('público sin confirmar: no pasa y marca la casilla', async () => {
    const result = await Project.validations({ ...complete })
    expect(result.data.status).toBe(false)
    expect(result.data.state.no_personal_data_confirmed).toBe(false)
    expect(Api.get).not.toHaveBeenCalled()
  })

  it('público confirmado: sigue a can_publish con la casilla', async () => {
    const result = await Project.validations({ ...complete, no_personal_data_confirmed: true })
    expect(result.data.status).toBe(true)
    expect(Api.get).toHaveBeenCalledWith('/api/project/can_publish', expect.objectContaining({ no_personal_data_confirmed: true }))
  })

  it('privado no la pide', async () => {
    const result = await Project.validations({ id: 'p1', name: 'Proyecto', public_type: 'private' })
    expect(result.data.status).toBe(true)
  })
})
