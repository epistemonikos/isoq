// #329 — una plantilla del Paso 3/4 descargada antes de cambiar las referencias del Paso 1.
// Borrar y volver a subir referencias genera ids NUEVOS, así que la plantilla vieja trae
// filas de estudios que ya no existen y le faltan los nuevos. Importarla dejaba datos
// huérfanos que no salían en la worksheet. Regla: si los ids no coinciden, no se importa.
import { templateReferenceMismatch } from '@/utils/templateReferences'

const refs = [
  { id: 'R1', authors: ['Armstrong, A'], publication_year: '2020' },
  { id: 'R2', authors: ['Beta, B'], publication_year: '2021' }
]

describe('templateReferenceMismatch', () => {
  it('null cuando la plantilla trae exactamente los estudios actuales, en cualquier orden', () => {
    const items = [{ ref_id: 'R2', authors: 'Beta 2021' }, { ref_id: 'R1', authors: 'Armstrong 2020' }]
    expect(templateReferenceMismatch(items, refs)).toBeNull()
  })

  it('nombra las filas de estudios que ya no existen', () => {
    const items = [
      { ref_id: 'R1', authors: 'Armstrong 2020' },
      { ref_id: 'R2', authors: 'Beta 2021' },
      { ref_id: 'VIEJO', authors: 'Armstrong et al. 2020' }
    ]
    expect(templateReferenceMismatch(items, refs)).toEqual({ unknown: ['Armstrong et al. 2020'], missing: [] })
  })

  it('nombra los estudios actuales que no tienen fila en la plantilla', () => {
    const items = [{ ref_id: 'R1', authors: 'Armstrong 2020' }]
    const result = templateReferenceMismatch(items, refs)
    expect(result.unknown).toEqual([])
    expect(result.missing).toHaveLength(1)
    expect(result.missing[0]).toContain('Beta')
  })

  // Excel deja filas en blanco al final; no son estudios.
  it('ignora las filas totalmente vacías', () => {
    const items = [
      { ref_id: 'R1', authors: 'Armstrong 2020' },
      { ref_id: 'R2', authors: 'Beta 2021' },
      { ref_id: '', authors: '', column_0: '' }
    ]
    expect(templateReferenceMismatch(items, refs)).toBeNull()
  })

  it('compara como texto: un id numérico leído del Excel sigue coincidiendo', () => {
    const items = [{ ref_id: '123', authors: 'A' }]
    expect(templateReferenceMismatch(items, [{ id: 123, authors: ['A'], publication_year: '' }])).toBeNull()
  })

  it('una fila sin id pero con contenido es de un estudio desconocido', () => {
    const items = [
      { ref_id: 'R1', authors: 'Armstrong 2020' },
      { ref_id: 'R2', authors: 'Beta 2021' },
      { ref_id: '', authors: 'Sin id 2019', column_0: 'dato' }
    ]
    expect(templateReferenceMismatch(items, refs).unknown).toEqual(['Sin id 2019'])
  })
})
