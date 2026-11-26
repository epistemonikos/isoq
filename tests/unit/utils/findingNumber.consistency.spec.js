import Commons from '@/utils/commons'

/**
 * El test que cierra el caso de uso real: dos personas coordinan por el número
 * ("yo trabajo en el 3, tú en el 4"). Si dos vistas derivan números distintos
 * para el mismo finding, trabajan sobre el equivocado.
 *
 * Las cuatro vistas y el exportable comparten UNA derivación, así que basta con
 * verificar que llamarla con la misma entrada da la misma salida, y que los
 * atributos legados NO la influyen.
 */
describe('el número del finding es el mismo en todas las vistas', () => {
  const L1 = '66b1ff0000000000000000a1'
  const L2 = '66b1ff0000000000000000a2'
  const L3 = '66b1ff0000000000000000a3'
  const CAT_A = '66b1ff0000000000000000c1'
  const CAT_Z = '66b1ff0000000000000000c2'

  const categories = [{ id: CAT_A, text: 'Alpha' }, { id: CAT_Z, text: 'Zeta' }]
  const L4 = '66b1ff0000000000000000a4'

  // sort con huecos, isoqf_id inconsistente: el estado real de un proyecto viejo
  // al que le borraron findings. L4 no tiene categoría (category: null) — es el caso que
  // viewProject.vue y previewContentSoQf.vue le agregan una entrada sintética {id: null, ...}
  // al array de categorías, mientras que editList.vue y previewContentWorksheet.vue no.
  const lists = [
    { id: L1, category: CAT_Z, sort: 2, isoqf_id: 91 },
    { id: L2, category: CAT_A, sort: 7, isoqf_id: 92 },
    { id: L3, category: CAT_A, sort: 30, isoqf_id: 4 },
    { id: L4, category: null, sort: 15, isoqf_id: 50 }
  ]

  it('da el mismo número llamada por vistas distintas con la misma entrada', () => {
    const fromTable = Commons.sortFindings(lists, categories)
    const fromWorksheet = Commons.sortFindings(lists, categories)
    const fromPreview = Commons.sortFindings(lists, categories)

    const numbersOf = (r) => r.map(l => [l.id, l.displayNumber])

    expect(numbersOf(fromWorksheet)).toEqual(numbersOf(fromTable))
    expect(numbersOf(fromPreview)).toEqual(numbersOf(fromTable))
    expect(numbersOf(fromTable)).toEqual([[L2, 1], [L3, 2], [L1, 3], [L4, 4]])
  })

  // Regresión de CRITICAL 1: viewProject.vue/previewContentSoQf.vue pasan las categorías con
  // una entrada sintética {id: null, text: <label>} agregada para el dropdown de "sin
  // categoría"; editList.vue/previewContentWorksheet.vue pasan el array crudo de la API, sin
  // esa entrada. La derivación debe dar el mismo número sin importar cuál de las dos formas
  // reciba, y debe depender genuinamente de las categorías (si no, el test no prueba nada).
  it('la entrada sintética {id:null} no cambia el número, y las categorías sí lo cambian', () => {
    const withSynthetic = [{ id: null, text: 'No group' }, ...categories]

    const numbersOf = (r) => r.map(l => [l.id, l.displayNumber])

    expect(numbersOf(Commons.sortFindings(lists, withSynthetic)))
      .toEqual(numbersOf(Commons.sortFindings(lists, categories)))
    expect(numbersOf(Commons.sortFindings(lists, [])))
      .not.toEqual(numbersOf(Commons.sortFindings(lists, categories)))
  })

  it('ni el sort persistido ni el isoqf_id cambian el número', () => {
    const baseline = Commons.sortFindings(lists, categories).map(l => l.displayNumber)

    // Mismo orden relativo, valores persistidos completamente distintos.
    const scrambled = [
      { id: L1, category: CAT_Z, sort: 500, isoqf_id: 1 },
      { id: L2, category: CAT_A, sort: 501, isoqf_id: 2 },
      { id: L3, category: CAT_A, sort: 502, isoqf_id: 3 },
      { id: L4, category: null, sort: 503, isoqf_id: 4 }
    ]

    expect(Commons.sortFindings(scrambled, categories).map(l => l.displayNumber)).toEqual(baseline)
  })
})
