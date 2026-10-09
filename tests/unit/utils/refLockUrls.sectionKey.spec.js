import { refLockKeyFromUrl } from '@/utils/refLockUrls'

// La clave que `refLockKeyFromUrl` deriva de una URL NO es un detalle de enrutado:
// es la que usa el interceptor de 409 para elegir a qué editor avisarle, y la que la
// cola offline persiste para re-adquirir el lock en el replay. Si no coincide con la
// que el editor sostiene, un 409 en vivo queda MUDO (isLockRejection suprime el toast
// genérico dando por hecho que el canal de conflicto habló) y una escritura offline
// se pierde de forma permanente y silenciosa, re-fallando en cada reconexión.
describe('refLockKeyFromUrl — sección del evidence profile', () => {
  it('deriva la clave POR SECCIÓN de un PATCH de finding', () => {
    expect(refLockKeyFromUrl('/isoqf_findings/finding1/section/coherence'))
      .toBe('finding1::ep::coherence')
  })

  it('idem para el gemelo de listas', () => {
    expect(refLockKeyFromUrl('/isoqf_lists/list1/section/cerqual'))
      .toBe('list1::ep::cerqual')
  })

  it('sirve para las cinco secciones', () => {
    const secciones = ['methodological_limitations', 'coherence', 'adequacy', 'relevance', 'cerqual']
    secciones.forEach(s => {
      expect(refLockKeyFromUrl(`/isoqf_findings/f1/section/${s}`)).toBe(`f1::ep::${s}`)
    })
  })

  it('tolera query string y barra final', () => {
    expect(refLockKeyFromUrl('/isoqf_findings/f1/section/coherence?x=1')).toBe('f1::ep::coherence')
    expect(refLockKeyFromUrl('/isoqf_findings/f1/section/coherence/')).toBe('f1::ep::coherence')
  })

  it('con URL absoluta también', () => {
    expect(refLockKeyFromUrl('https://api.example.org/api/isoqf_findings/f1/section/adequacy'))
      .toBe('f1::ep::adequacy')
  })

  // ── Lo que NO debe cambiar ────────────────────────────────────────────
  it('la IDENTIDAD del finding sigue dando el id PELADO', () => {
    // `/identity` y `/finding/remove` bloquean el documento entero, y ésa es la clave
    // que hace chocar a quien renombra con quien evalúa una sección. Si acá también
    // se compusiera la clave de sección, se perdería esa exclusión.
    expect(refLockKeyFromUrl('/isoqf_findings/finding1/identity')).toBe('finding1')
    expect(refLockKeyFromUrl('/isoqf_findings/finding1/identity?x=1')).toBe('finding1')
  })

  it('las filas y las hojas del Paso 4 no se tocan', () => {
    expect(refLockKeyFromUrl('/isoqf_characteristics/doc1/item/R1')).toBe('R1')
    expect(refLockKeyFromUrl('/isoqf_assessments/doc1/item/R1/stage/0/option/2')).toBe('R1::s0::o2')
  })

  it('las columnas siguen dando <doc>::fields', () => {
    expect(refLockKeyFromUrl('/isoqf_characteristics/doc1/field/column_a')).toBe('doc1::fields')
  })

  it('una ruta genérica no inventa clave', () => {
    expect(refLockKeyFromUrl('/isoqf_lists/list1')).toBeNull()
    expect(refLockKeyFromUrl('/isoqf_projects/p1')).toBeNull()
    expect(refLockKeyFromUrl('')).toBeNull()
  })

  it('lo que emite es lo que el módulo de claves reconoce', () => {
    // Cierra el círculo entre los dos módulos: si uno cambia de forma y el otro no,
    // el lock se vuelve cosmético sin que nada más lo note.
    const { sectionLockBaseOf } = require('@/utils/evidenceProfileLockKeys')
    const key = refLockKeyFromUrl('/isoqf_findings/finding1/section/coherence')
    expect(sectionLockBaseOf(key)).toBe('finding1')
  })
})
