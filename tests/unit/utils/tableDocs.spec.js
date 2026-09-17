import { resolveTableDoc } from '@/utils/tableDocs'
import Api from '@/utils/Api'

jest.mock('@/utils/Api', () => ({ get: jest.fn() }))

/**
 * La regla que decide entre crear y actualizar la tabla de un proyecto, en un solo lugar
 * porque la necesitan tres pantallas. Lo que se fija acá es la distinción que el bug no
 * hacía: "no tengo id" no es lo mismo que "no existe".
 */
describe('resolveTableDoc', () => {
  const base = {
    collection: '/isoqf_characteristics',
    organization: 'org1',
    projectId: 'proj1'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
  })

  it('con el id conocido no le pregunta a nadie', async () => {
    const resultado = await resolveTableDoc({ ...base, knownId: 'chars1' })

    expect(resultado).toEqual({ id: 'chars1' })
    expect(Api.get).not.toHaveBeenCalled()
  })

  it('sin id, devuelve el documento que el servidor ya tiene', async () => {
    Api.get.mockResolvedValue({ data: [{ id: 'chars1' }] })

    const resultado = await resolveTableDoc({ ...base, knownId: null })

    expect(resultado).toEqual({ id: 'chars1' })
    expect(Api.get).toHaveBeenCalledWith('/isoqf_characteristics', {
      organization: 'org1',
      project_id: 'proj1'
    })
  })

  it('sin id y sin documento, habilita la creación', async () => {
    Api.get.mockResolvedValue({ data: [] })

    expect(await resolveTableDoc({ ...base, knownId: undefined })).toEqual({ id: null })
  })

  // La diferencia que da sentido a todo esto: no poder preguntar NO es lo mismo que no
  // existir. Crear acá es lo que parte el proyecto en dos documentos.
  it('si la consulta falla, avisa que no se pudo verificar', async () => {
    Api.get.mockRejectedValue(new Error('red caída'))

    expect(await resolveTableDoc({ ...base, knownId: null })).toEqual({ failed: true })
  })

  it('una respuesta sin id utilizable tampoco inventa uno', async () => {
    Api.get.mockResolvedValue({ data: [{ items: [] }] })

    expect(await resolveTableDoc({ ...base, knownId: null })).toEqual({ id: null })
  })

  it('tolera una respuesta vacía del cliente HTTP', async () => {
    Api.get.mockResolvedValue(undefined)

    expect(await resolveTableDoc({ ...base, knownId: null })).toEqual({ id: null })
  })
})
