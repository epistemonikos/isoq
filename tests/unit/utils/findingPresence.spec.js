// Quién se nombra como "revisando" un hallazgo, y quién NO.
//
// La presencia es un superconjunto de los locks: quien abre un editor sigue estando
// adentro, pero ya tiene un mensaje más informativo ("está evaluando Coherence").
// Nombrarlo dos veces con dos textos distintos es peor que no nombrarlo.
import { presentReviewersOf, joinReviewerNames } from '@/utils/findingPresence'

const PRESENT = [
  { finding_id: 'f1', user_id: 'u-ana', user_name: 'Ana Soto' },
  { finding_id: 'f1', user_id: 'u-luis', user_name: 'Luis Paz' },
  { finding_id: 'f2', user_id: 'u-mara', user_name: 'Mara Ruiz' }
]

describe('presentReviewersOf', () => {
  it('nombra a quienes están en ESE hallazgo', () => {
    expect(presentReviewersOf(PRESENT, [], 'f1', 'u-yo'))
      .toEqual(['Ana Soto', 'Luis Paz'])
  })

  it('no me nombra a mí mismo', () => {
    expect(presentReviewersOf(PRESENT, [], 'f1', 'u-ana')).toEqual(['Luis Paz'])
  })

  it('el orden NO depende del orden del sondeo', () => {
    // `GET /presence` no garantiza orden, igual que `GET /refs`. Sin orden estable,
    // dos personas mirando la misma fila leen nombres en distinto orden y el texto
    // cambia entre dos sondeos sin que nada haya cambiado.
    const alReves = [PRESENT[1], PRESENT[0]]
    expect(presentReviewersOf(alReves, [], 'f1', 'u-yo'))
      .toEqual(['Ana Soto', 'Luis Paz'])
  })

  it('quien tiene el lock del hallazgo sale de la lista', () => {
    const locks = [{ ref_id: 'f1', user_id: 'u-ana', user_name: 'Ana Soto' }]
    expect(presentReviewersOf(PRESENT, locks, 'f1', 'u-yo')).toEqual(['Luis Paz'])
  })

  it('quien tiene el lock de una SECCIÓN también sale', () => {
    const locks = [
      { ref_id: 'f1::ep::coherence', user_id: 'u-luis', user_name: 'Luis Paz' }
    ]
    expect(presentReviewersOf(PRESENT, locks, 'f1', 'u-yo')).toEqual(['Ana Soto'])
  })

  it('un lock de OTRO hallazgo no saca a nadie', () => {
    const locks = [{ ref_id: 'f2', user_id: 'u-ana', user_name: 'Ana Soto' }]
    expect(presentReviewersOf(PRESENT, locks, 'f1', 'u-yo'))
      .toEqual(['Ana Soto', 'Luis Paz'])
  })

  it('dos personas con el mismo nombre se cuentan por separado', () => {
    // La comparación va por user_id y no por nombre: los homónimos son reales en
    // proyectos con varios colaboradores de la misma institución.
    const homonimos = [
      { finding_id: 'f1', user_id: 'u-1', user_name: 'Ana Soto' },
      { finding_id: 'f1', user_id: 'u-2', user_name: 'Ana Soto' }
    ]
    expect(presentReviewersOf(homonimos, [], 'f1', 'u-yo'))
      .toEqual(['Ana Soto', 'Ana Soto'])
  })

  it('una fila sin nombre no se dibuja', () => {
    // Sin a quién nombrar el cartel queda mudo. Mismo criterio que blockedSectionsOf.
    const sinNombre = [{ finding_id: 'f1', user_id: 'u-x', user_name: null }]
    expect(presentReviewersOf(sinNombre, [], 'f1', 'u-yo')).toEqual([])
  })

  it('entradas basura no lanzan', () => {
    expect(presentReviewersOf(null, null, 'f1', 'u-yo')).toEqual([])
    expect(presentReviewersOf(PRESENT, [], null, 'u-yo')).toEqual([])
    expect(presentReviewersOf([null, undefined], [], 'f1', 'u-yo')).toEqual([])
  })
})

// El conector («y» / «and» / «e») no es el mismo string en las tres traducciones, así
// que unirlo acá en vez de con un `join(' y ')` en cada componente es lo que evita que
// un idioma cuya puntuación de listas difiera obligue a tocar dos copias.
describe('joinReviewerNames', () => {
  it('sin nombres devuelve vacío', () => {
    expect(joinReviewerNames([], ' y ')).toBe('')
  })

  it('un nombre se devuelve tal cual, sin conector', () => {
    expect(joinReviewerNames(['Ana Soto'], ' y ')).toBe('Ana Soto')
  })

  it('dos nombres van unidos sólo por el conector', () => {
    expect(joinReviewerNames(['Ana Soto', 'Luis Paz'], 'y'))
      .toBe('Ana Soto y Luis Paz')
  })

  it('tres o más van con comas y el conector antes del último', () => {
    expect(joinReviewerNames(['Ana Soto', 'Luis Paz', 'Mara Ruiz'], 'y'))
      .toBe('Ana Soto, Luis Paz y Mara Ruiz')
  })

  it('usa el conector que le pasan, no uno propio', () => {
    // Nunca "y" hardcodeado: si el conector viene en inglés, el resultado tiene que
    // quedar en inglés.
    expect(joinReviewerNames(['Ana Soto', 'Luis Paz'], 'and'))
      .toBe('Ana Soto and Luis Paz')
  })
})
