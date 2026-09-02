// Qué le decimos a la persona que está por importar una tabla.
//
// El import es DELETE + POST del documento completo: exige el lock de PROYECTO, pero no
// mira los ref locks. Quien esté editando un estudio del Paso 3 o 4 sostiene un lock por
// `ref_id`, así que el import le pasa por encima sin conflicto y sin aviso, con las filas
// ya borradas. Backend decidió no cerrarlo del lado servidor —un import destructivo que
// falla porque alguien tiene una fila abierta es una lotería— y sugirió que preguntemos
// antes.
//
// Esta función es la regla de lectura del listado, aparte del componente y sin i18n: qué
// cuenta como estudio, quién queda nombrado, y cuándo un lock de columnas es nuestro.
//
// LA CLAVE NO LLEVA COLECCIÓN, Y ESO ES LA GRANULARIDAD, NO UNA FALTA. El ref lock es
// `(project_id, ref_id)`: la unidad de bloqueo es el estudio, no su fila en una tabla.
// Quien edita `R1` en isoqf_characteristics bloquea `R1` en isoqf_assessments y en
// isoqf_extracted_data, y el servidor verifica lo mismo para las tres. Por eso el texto
// dice «de este proyecto»: es exacto, y no hay falsos positivos que disculpar.
// Las claves `<doc_id>::fields` son la excepción —identifican un documento— y van aparte.
import { summarizeImportLocks } from '@/utils/importLockWarning'

const TABLA = 'tabla-1'

describe('summarizeImportLocks()', () => {
  it('sin locks no hay nada que avisar', () => {
    expect(summarizeImportLocks([], TABLA)).toEqual({
      studyCount: 0,
      names: [],
      columnsLockedBy: null
    })
  })

  it('cuenta un estudio por cada ref y nombra a quien lo tiene', () => {
    const locks = [
      { ref_id: 'R1', user_name: 'Ana López' },
      { ref_id: 'R2', user_name: 'Luis Pérez' }
    ]

    expect(summarizeImportLocks(locks, TABLA)).toEqual({
      studyCount: 2,
      names: ['Ana López', 'Luis Pérez'],
      columnsLockedBy: null
    })
  })

  it('cuenta una sola vez el estudio tomado por varias celdas del Paso 4', () => {
    // Endpoint D bloquea la celda, no el estudio: dos hojas del mismo `ref_id` son un
    // solo estudio para quien va a importar, porque el import se lleva la fila entera.
    const locks = [
      { ref_id: 'R1::s0::o1', user_name: 'Ana López' },
      { ref_id: 'R1::s2::o0', user_name: 'Ana López' }
    ]

    expect(summarizeImportLocks(locks, TABLA)).toEqual({
      studyCount: 1,
      names: ['Ana López'],
      columnsLockedBy: null
    })
  })

  it('no cuenta dos veces a la misma persona con dos estudios', () => {
    const locks = [
      { ref_id: 'R1', user_name: 'Ana López' },
      { ref_id: 'R2', user_name: 'Ana López' }
    ]

    expect(summarizeImportLocks(locks, TABLA)).toEqual({
      studyCount: 2,
      names: ['Ana López'],
      columnsLockedBy: null
    })
  })

  it('el lock de columnas de ESTA tabla se avisa aparte y no es un estudio', () => {
    // El import reemplaza `fields` además de `items`, así que un renombrado de columna en
    // curso también se pierde. Pero llamarlo «estudio» sería falso.
    const locks = [{ ref_id: `${TABLA}::fields`, user_name: 'Ana López' }]

    expect(summarizeImportLocks(locks, TABLA)).toEqual({
      studyCount: 0,
      names: [],
      columnsLockedBy: 'Ana López'
    })
  })

  it('ignora el lock de columnas de OTRA tabla', () => {
    // El único lock que NO afecta a este import: las columnas de otro documento. Los de
    // fila afectan siempre, porque el lock es del estudio y no de la tabla.
    const locks = [{ ref_id: 'otra-tabla::fields', user_name: 'Ana López' }]

    expect(summarizeImportLocks(locks, TABLA)).toEqual({
      studyCount: 0,
      names: [],
      columnsLockedBy: null
    })
  })

  it('sin id de tabla todavía, ningún lock de columnas es atribuible', () => {
    // La tabla puede no existir aún: `dataTable.id` viene vacío hasta el primer guardado.
    const locks = [{ ref_id: 'tabla-1::fields', user_name: 'Ana López' }]

    expect(summarizeImportLocks(locks, '')).toEqual({
      studyCount: 0,
      names: [],
      columnsLockedBy: null
    })
  })

  it('una clave de forma desconocida cuenta como estudio, no se descarta', () => {
    // Misma decisión que la allowlist de `lockErrors.js` pero al revés, y a propósito:
    // ahí un motivo nuevo cae en el comportamiento anterior; acá una clave nueva cae del
    // lado que avisa. Callarnos sobre un lock que existe es el único error que le cuesta
    // trabajo a alguien.
    const locks = [{ ref_id: 'R1::granularidad_que_todavia_no_existe', user_name: 'Ana' }]

    const resumen = summarizeImportLocks(locks, TABLA)

    expect(resumen.studyCount).toBe(1)
    expect(resumen.names).toEqual(['Ana'])
  })

  it('tolera un lock sin nombre sin dejar un hueco en la lista', () => {
    const locks = [
      { ref_id: 'R1' },
      { ref_id: 'R2', user_name: 'Ana López' }
    ]

    const resumen = summarizeImportLocks(locks, TABLA)

    expect(resumen.studyCount).toBe(2)
    expect(resumen.names).toEqual(['Ana López'])
  })
})
