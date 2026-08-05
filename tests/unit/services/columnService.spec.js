// Las cuatro operaciones granulares de columna, contra el contrato acordado con el
// backend (docs/respuesta-backend-columnas-forma-fields.md §3 y
// docs/respuesta-backend-columnas-contrato-ejecucion.md).
//
// Por qué el alta es un PATCH y no un POST: el PATCH con clave elegida por el cliente es
// idempotente, así que se puede encolar sin conexión y reproducir sin crear una segunda
// columna. El POST existe pero genera la clave en el servidor, que offline no sirve —
// no habría con qué renderizar la columna ni con qué indexar el contenido de las filas.
import {
  addColumn,
  renameColumn,
  deleteColumn,
  reorderColumns,
  movableKeys,
  ensureTableDocument
} from '@/services/columnService'
import Api from '@/utils/Api'

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} }))
}))

const CLAVE_ALEATORIA = /^column_[0-9a-f]{24}$/

describe('columnService — addColumn', () => {
  beforeEach(() => jest.clearAllMocks())

  it('crea la columna con un PATCH sobre una clave que genera el cliente', async () => {
    await addColumn('isoqf_characteristics', 'doc1', 'Contexto')

    expect(Api.patch).toHaveBeenCalledTimes(1)
    const [url, body] = Api.patch.mock.calls[0]
    expect(url).toMatch(/^\/isoqf_characteristics\/doc1\/field\/column_[0-9a-f]{24}$/)
    expect(body).toEqual({ label: 'Contexto' })
  })

  it('devuelve la clave que usó, para que el llamador pueda renderizar la columna', async () => {
    const { key } = await addColumn('isoqf_characteristics', 'doc1', 'Contexto')

    expect(key).toMatch(CLAVE_ALEATORIA)
    expect(Api.patch.mock.calls[0][0]).toContain(key)
  })

  it('no manda `key` en el body: el backend lo rechaza con 400 porque va en el path', async () => {
    await addColumn('isoqf_characteristics', 'doc1', 'Contexto')

    expect(Api.patch.mock.calls[0][1]).not.toHaveProperty('key')
  })

  it('sirve igual para isoqf_assessments', async () => {
    await addColumn('isoqf_assessments', 'tbl9', 'Contexto')

    expect(Api.patch.mock.calls[0][0]).toMatch(/^\/isoqf_assessments\/tbl9\/field\//)
  })
})

describe('columnService — renameColumn', () => {
  beforeEach(() => jest.clearAllMocks())

  it('patchea sólo el label, sobre la clave que ya existe', async () => {
    await renameColumn('isoqf_characteristics', 'doc1', 'column_abc', 'Otro título')

    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_characteristics/doc1/field/column_abc',
      { label: 'Otro título' }
    )
  })
})

describe('columnService — deleteColumn', () => {
  beforeEach(() => jest.clearAllMocks())

  // El backend limpia la clave en todas las filas: no hay que mandar `items`.
  it('borra por clave y no manda cuerpo', async () => {
    await deleteColumn('isoqf_characteristics', 'doc1', 'column_abc')

    expect(Api.delete).toHaveBeenCalledWith('/isoqf_characteristics/doc1/field/column_abc')
  })
})

describe('columnService — reorderColumns', () => {
  beforeEach(() => jest.clearAllMocks())

  it('manda el orden con PUT', async () => {
    await reorderColumns('isoqf_characteristics', 'doc1', ['column_b', 'column_a'])

    expect(Api.put).toHaveBeenCalledWith(
      '/isoqf_characteristics/doc1/fields/order',
      { order: ['column_b', 'column_a'] }
    )
  })

  // `order` acepta un subconjunto, pero rechaza con 400 lo que NO está en el documento.
  // Un orden vacío no tiene nada que reordenar, así que el request se ahorra.
  it('no llama al servidor con un orden vacío', async () => {
    await reorderColumns('isoqf_characteristics', 'doc1', [])

    expect(Api.put).not.toHaveBeenCalled()
  })
})

describe('columnService — movableKeys', () => {
  // Los campos de sistema NO viajan en `order`: el backend los conserva en su slot y
  // devuelve 400 si se los mandan. Las 24 claves CAMELOT sí se reordenan.
  it('excluye los campos de sistema y conserva las CAMELOT', () => {
    const fields = [
      { key: 'ref_id', label: 'ID' },
      { key: 'authors', label: 'Authors' },
      { key: 'context_extractedData', label: 'Contexto' },
      { key: 'context_comments', label: 'Comentarios' },
      { key: 'column_abc', label: 'Mía' }
    ]

    expect(movableKeys(fields)).toEqual([
      'context_extractedData',
      'context_comments',
      'column_abc'
    ])
  })

  it('excluye también actions y edit, que el backend trata como de sistema', () => {
    const fields = [
      { key: 'actions', label: '' },
      { key: 'edit', label: '' },
      { key: 'column_abc', label: 'Mía' }
    ]

    expect(movableKeys(fields)).toEqual(['column_abc'])
  })

  it('tolera un fields ausente o con entradas sin clave', () => {
    expect(movableKeys(null)).toEqual([])
    expect(movableKeys([{ label: 'sin clave' }, { key: 'column_a', label: 'A' }]))
      .toEqual(['column_a'])
  })
})

describe('columnService — ensureTableDocument', () => {
  beforeEach(() => jest.clearAllMocks())

  it('devuelve el id del documento que ya existe, sin crear otro', async () => {
    Api.get.mockResolvedValueOnce({ data: [{ id: 'existente' }] })

    const id = await ensureTableDocument('isoqf_characteristics', 'org1', 'proj1')

    expect(id).toBe('existente')
    expect(Api.post).not.toHaveBeenCalled()
  })

  it('crea el documento cuando no hay ninguno', async () => {
    Api.get.mockResolvedValueOnce({ data: [] })
    Api.post.mockResolvedValueOnce({ data: { id: 'nuevo' } })

    const id = await ensureTableDocument('isoqf_characteristics', 'org1', 'proj1')

    expect(id).toBe('nuevo')
    expect(Api.post).toHaveBeenCalledTimes(1)
    const [url, body] = Api.post.mock.calls[0]
    expect(url).toBe('/isoqf_characteristics/')
    expect(body.project_id).toBe('proj1')
    expect(body.organization).toBe('org1')
  })

  // La creación es la única ruta donde el cliente sigue mandando `fields` completo: el
  // documento no existe, así que no hay copia obsoleta posible. Sólo los de sistema — las
  // columnas se agregan después, de a una, por los granulares.
  it('nace con los campos de sistema y sin columnas de usuario', async () => {
    Api.get.mockResolvedValueOnce({ data: [] })
    Api.post.mockResolvedValueOnce({ data: { id: 'nuevo' } })

    await ensureTableDocument('isoqf_characteristics', 'org1', 'proj1')

    expect(Api.post.mock.calls[0][1].fields.map(f => f.key)).toEqual(['ref_id', 'authors'])
  })

  // En CAMELOT las filas son un left-join virtual contra las referencias, así que el
  // documento no necesita nacer con `items`.
  it('no siembra filas', async () => {
    Api.get.mockResolvedValueOnce({ data: [] })
    Api.post.mockResolvedValueOnce({ data: { id: 'nuevo' } })

    await ensureTableDocument('isoqf_characteristics', 'org1', 'proj1')

    expect(Api.post.mock.calls[0][1]).not.toHaveProperty('items')
  })

  // La relectura previa es la mitigación acordada con el backend para la carrera de doble
  // creación, que hoy no tiene índice único que la cierre: encoge la ventana sin tomar el
  // lock de proyecto, que frenaría a todos los demás en el proyecto.
  it('consulta antes de crear, filtrando por proyecto', async () => {
    Api.get.mockResolvedValueOnce({ data: [] })
    Api.post.mockResolvedValueOnce({ data: { id: 'nuevo' } })

    await ensureTableDocument('isoqf_characteristics', 'org1', 'proj1')

    expect(Api.get).toHaveBeenCalledWith(
      '/isoqf_characteristics?organization=org1&project_id=proj1'
    )
  })
})

// En no-CAMELOT `<b-table>` lee `dataTable.items` de la base, así que el documento tiene
// que nacer con una fila por referencia o no hay dónde escribir. En CAMELOT las filas son
// un left-join virtual y no hace falta sembrar nada — de ahí que el sembrado sea opcional.
describe('columnService — ensureTableDocument con filas sembradas', () => {
  beforeEach(() => jest.clearAllMocks())

  const FILAS = [
    { ref_id: 'R1', authors: 'Smith 2020' },
    { ref_id: 'R2', authors: 'Doe 2021' }
  ]

  it('siembra las filas que le pasan', async () => {
    Api.get.mockResolvedValueOnce({ data: [] })
    Api.post.mockResolvedValueOnce({ data: { id: 'nuevo' } })

    await ensureTableDocument('isoqf_assessments', 'org1', 'proj1', { items: FILAS })

    expect(Api.post.mock.calls[0][1].items).toEqual(FILAS)
  })

  it('sin filas no manda la clave items', async () => {
    Api.get.mockResolvedValueOnce({ data: [] })
    Api.post.mockResolvedValueOnce({ data: { id: 'nuevo' } })

    await ensureTableDocument('isoqf_assessments', 'org1', 'proj1')

    expect(Api.post.mock.calls[0][1]).not.toHaveProperty('items')
  })

  // Si el documento ya existe, sembrar sobrescribiría las filas que tiene: el sembrado es
  // sólo para el nacimiento.
  it('no siembra nada si el documento ya existe', async () => {
    Api.get.mockResolvedValueOnce({ data: [{ id: 'existente' }] })

    const id = await ensureTableDocument('isoqf_assessments', 'org1', 'proj1', { items: FILAS })

    expect(id).toBe('existente')
    expect(Api.post).not.toHaveBeenCalled()
  })
})
