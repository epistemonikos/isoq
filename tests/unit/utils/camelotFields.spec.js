// Las 24 claves CAMELOT (12 dominios × extractedData + comments) son fijas: no se crean,
// no se borran y no se renombran. Aun así tienen que estar en el `fields` del documento,
// porque `fields` es lo único de lo que la tabla del Paso 3 deriva sus columnas y es donde
// vive el orden que el usuario eligió (`order` sólo puede mencionar claves que existan).
//
// El documento nace sin ellas: `ensureTableDocument` siembra sólo `ref_id` y `authors`.
// Mientras no existía documento nadie lo notaba, porque la carga inyectaba el catálogo en
// memoria cuando `fields` venía vacío — una condición que deja de cumplirse para siempre
// en cuanto se crea la primera columna.
//
// Ésta es la regla única de reconciliación, compartida por las cuatro puertas por las que
// `charsData` entra desde el servidor.
import { withCamelotFields, withoutVirtualMark } from '@/utils/camelotFields'

const CATALOGO = [
  { key: 'research_extractedData', label: 'Extracted data' },
  { key: 'research_comments', label: 'Comments' },
  { key: 'context_extractedData', label: 'Extracted data' },
  { key: 'context_comments', label: 'Comments' }
]

describe('withCamelotFields', () => {
  it('devuelve el catálogo entero cuando el documento todavía no tiene fields', () => {
    expect(withCamelotFields(undefined, CATALOGO).map(f => f.key))
      .toEqual(CATALOGO.map(f => f.key))
    expect(withCamelotFields([], CATALOGO).map(f => f.key))
      .toEqual(CATALOGO.map(f => f.key))
  })

  it('agrega las claves CAMELOT que faltan al documento recién nacido', () => {
    const fields = [
      { key: 'ref_id', label: 'ID' },
      { key: 'authors', label: 'Authors' },
      { key: 'column_abc', label: 'Mi columna' }
    ]

    expect(withCamelotFields(fields, CATALOGO).map(f => f.key)).toEqual([
      'ref_id', 'authors', 'column_abc',
      'research_extractedData', 'research_comments',
      'context_extractedData', 'context_comments'
    ])
  })

  it('no toca el documento que ya tiene todas las claves CAMELOT', () => {
    const fields = [
      { key: 'ref_id', label: 'ID' },
      ...CATALOGO,
      { key: 'column_abc', label: 'Mi columna' }
    ]

    expect(withCamelotFields(fields, CATALOGO)).toEqual(fields)
  })

  it('respeta el orden y el label que el documento ya tenía', () => {
    // El orden persistido es una elección del usuario: reconciliar no puede reordenar.
    const fields = [
      { key: 'context_extractedData', label: 'Renombrada por el servidor' },
      { key: 'ref_id', label: 'ID' }
    ]
    const resultado = withCamelotFields(fields, CATALOGO)

    expect(resultado[0]).toEqual({ key: 'context_extractedData', label: 'Renombrada por el servidor' })
    expect(resultado[1]).toEqual({ key: 'ref_id', label: 'ID' })
    expect(resultado.map(f => f.key)).toEqual([
      'context_extractedData', 'ref_id',
      'research_extractedData', 'research_comments', 'context_comments'
    ])
  })

  it('no inventa columnas cuando el proyecto no es CAMELOT', () => {
    // `crudTables` comparte el documento pero no tiene catálogo: sin él, nada que agregar.
    const fields = [{ key: 'ref_id', label: 'ID' }, { key: 'column_0', label: 'Uno' }]

    expect(withCamelotFields(fields, [])).toEqual(fields)
    expect(withCamelotFields(fields, null)).toEqual(fields)
  })

  it('es idempotente: aplicarla dos veces da lo mismo', () => {
    const fields = [{ key: 'ref_id', label: 'ID' }]
    const una = withCamelotFields(fields, CATALOGO)

    expect(withCamelotFields(una, CATALOGO)).toEqual(una)
  })

  it('no muta el array que recibe', () => {
    const fields = [{ key: 'ref_id', label: 'ID' }]
    withCamelotFields(fields, CATALOGO)

    expect(fields).toHaveLength(1)
  })
})

// El reorden (`PUT /fields/order`) es la razón por la que esto no puede ser sólo cosmético:
// el backend rechaza con 400 cualquier clave de `order` que no esté guardada en el
// documento (`parse_field_order`: "Unknown field keys in `order`"). Una clave que sólo
// existe porque la reconciliamos NO está guardada, así que el modal tiene que poder
// distinguirla — si no, arrastrar una columna en un proyecto viejo pasaría a fallar.
describe('withCamelotFields — las claves repuestas se distinguen de las guardadas', () => {
  it('marca las que agrega y deja intactas las del documento', () => {
    const fields = [
      { key: 'ref_id', label: 'ID' },
      { key: 'research_extractedData', label: 'Extracted data' }
    ]
    const resultado = withCamelotFields(fields, CATALOGO)

    expect(resultado.find(f => f.key === 'ref_id').virtual).toBeUndefined()
    expect(resultado.find(f => f.key === 'research_extractedData').virtual).toBeUndefined()
    expect(resultado.find(f => f.key === 'context_extractedData').virtual).toBe(true)
    expect(resultado.find(f => f.key === 'research_comments').virtual).toBe(true)
  })

  it('no le pega la marca al catálogo que recibe', () => {
    withCamelotFields([], CATALOGO)

    expect(CATALOGO.some(f => f.virtual)).toBe(false)
  })
})

// La marca es de cliente y no puede llegar a la base: una clave guardada CON `virtual`
// quedaría excluida del reorden para siempre, en silencio. El único camino que todavía
// manda `fields` al servidor es la rama POST de `EditReferenceModal` (creación del
// documento desde el editor de estudios), y tiene que limpiarla.
describe('withoutVirtualMark', () => {
  it('quita la marca sin tocar el resto', () => {
    const fields = [
      { key: 'ref_id', label: 'ID' },
      { key: 'context_extractedData', label: 'CAMELOT', virtual: true }
    ]

    expect(withoutVirtualMark(fields)).toEqual([
      { key: 'ref_id', label: 'ID' },
      { key: 'context_extractedData', label: 'CAMELOT' }
    ])
  })

  it('tolera un fields ausente', () => {
    expect(withoutVirtualMark(undefined)).toEqual([])
    expect(withoutVirtualMark(null)).toEqual([])
  })

  it('no muta los objetos originales', () => {
    const fields = [{ key: 'a', label: 'A', virtual: true }]
    withoutVirtualMark(fields)

    expect(fields[0].virtual).toBe(true)
  })
})
