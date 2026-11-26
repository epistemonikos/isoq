import { lockBaseOf, worksheetLockKeys, releasedKeys } from '@/utils/worksheetLockScope'

const lock = (refId, userName = 'Ana Pérez') => ({ ref_id: refId, user_name: userName })

describe('worksheetLockScope', () => {
  describe('lockBaseOf', () => {
    // Las cuatro formas vivas de clave, cada una con su módulo propio. Este test es lo
    // único que ata las cuatro a UNA respuesta: si alguien agrega un eje nuevo y no lo
    // enchufa acá, la clave cae en el default y la hoja deja de refrescarse por ese eje.
    it('devuelve el documento de una clave de sección del evidence profile', () => {
      expect(lockBaseOf('f1::ep::coherence')).toBe('f1')
    })

    it('devuelve la referencia de una clave de celda del Paso 4', () => {
      expect(lockBaseOf('R1::s0::o2')).toBe('R1')
    })

    it('devuelve el documento de una clave de columnas', () => {
      expect(lockBaseOf('doc123::fields')).toBe('doc123')
    })

    it('una clave pelada es su propia base', () => {
      // Es la del `/identity` del finding y la de una fila de datos extraídos.
      expect(lockBaseOf('R1')).toBe('R1')
    })

    // El mismo caso que `lockErrors.spec.js` fija para los motivos del 409: no verifica
    // un valor real, verifica que lo DESCONOCIDO caiga en la rama correcta. Un eje que
    // el servidor ya emite y este cliente todavía no enumera tiene que seguir colgando
    // de su documento, igual que lo resuelve `base_ref_of` del otro lado.
    it('un sufijo que este cliente no conoce no se confunde con la base', () => {
      expect(lockBaseOf('f1::algo_que_todavia_no_existe::x')).toBe('f1')
    })

    it('devuelve null para lo que no es una clave', () => {
      expect(lockBaseOf(null)).toBeNull()
      expect(lockBaseOf('')).toBeNull()
      expect(lockBaseOf(42)).toBeNull()
    })
  })

  describe('worksheetLockKeys', () => {
    const BASES = ['f1', 'R1', 'R2', 'charsDoc']

    it('incluye la clave de una sección del hallazgo de esta hoja', () => {
      const keys = worksheetLockKeys([lock('f1::ep::coherence')], BASES)
      expect([...keys]).toEqual(['f1::ep::coherence'])
    })

    it('incluye la clave pelada del hallazgo', () => {
      // El `/identity`: alguien renombrando el finding o cambiando sus referencias.
      expect([...worksheetLockKeys([lock('f1')], BASES)]).toEqual(['f1'])
    })

    it('incluye la clave de una fila cuya referencia está en esta hoja', () => {
      expect([...worksheetLockKeys([lock('R2')], BASES)]).toEqual(['R2'])
    })

    it('incluye la clave de una celda del Paso 4 de una referencia de esta hoja', () => {
      // `table-meth-assessments` pinta esos datos dentro de la worksheet.
      expect([...worksheetLockKeys([lock('R1::s0::o2')], BASES)]).toEqual(['R1::s0::o2'])
    })

    it('incluye la clave de columnas de una tabla de esta hoja', () => {
      expect([...worksheetLockKeys([lock('charsDoc::fields')], BASES)]).toEqual(['charsDoc::fields'])
    })

    // El motivo por el que la pregunta se hace por BASE y no por finding: el sondeo trae
    // los locks de TODO el proyecto, y una hoja abierta no tiene nada que repintar
    // porque otra persona suelte una sección de otro hallazgo.
    it('descarta la clave de otro hallazgo del mismo proyecto', () => {
      expect([...worksheetLockKeys([lock('f9::ep::coherence')], BASES)]).toEqual([])
    })

    it('descarta la clave de una referencia que no está en esta hoja', () => {
      expect([...worksheetLockKeys([lock('R9::s0::o0')], BASES)]).toEqual([])
    })

    it('ignora los locks sin ref_id sin lanzar', () => {
      expect([...worksheetLockKeys([lock(null), {}, null], BASES)]).toEqual([])
    })

    it('devuelve un Set vacío sin locks o sin bases', () => {
      expect(worksheetLockKeys(null, BASES).size).toBe(0)
      expect(worksheetLockKeys([lock('f1')], null).size).toBe(0)
      expect(worksheetLockKeys([lock('f1')], []).size).toBe(0)
    })

    // Las bases llegan de `this.list`, donde un documento que todavía no existe deja un
    // `undefined` en el arreglo. Sin este descarte, una clave mal formada cuya base sea
    // `undefined` entraría, y la hoja se recargaría sola cada vez que apareciera o
    // desapareciera.
    it('descarta las bases vacías que llegan de un documento inexistente', () => {
      expect([...worksheetLockKeys([lock('R1')], [undefined, null, ''])]).toEqual([])
    })
  })

  describe('releasedKeys', () => {
    // Comparar claves DESAPARECIDAS y no tamaños: si en el mismo ciclo de sondeo una
    // persona suelta una sección y otra toma otra, el tamaño no cambia pero sí hay algo
    // nuevo que mostrar.
    it('detecta la clave que estaba y ya no está', () => {
      const antes = new Set(['f1::ep::coherence', 'R1'])
      const ahora = new Set(['R1'])
      expect(releasedKeys(antes, ahora)).toEqual(['f1::ep::coherence'])
    })

    it('detecta una liberación aunque el total no cambie', () => {
      const antes = new Set(['f1::ep::coherence'])
      const ahora = new Set(['f1::ep::adequacy'])
      expect(releasedKeys(antes, ahora)).toEqual(['f1::ep::coherence'])
    })

    it('no reporta nada cuando sólo se TOMAN locks nuevos', () => {
      const antes = new Set(['R1'])
      const ahora = new Set(['R1', 'f1::ep::coherence'])
      expect(releasedKeys(antes, ahora)).toEqual([])
    })

    // La instantánea arranca en null y el primer sondeo sólo siembra. Sin esto, montar
    // la vista con locks ajenos ya presentes no reportaría nada — pero montar la vista
    // SIN ellos y que aparecieran tampoco; el punto es que `null` significa «todavía no
    // sé», que no es lo mismo que «no había ninguno».
    it('no reporta nada contra una instantánea sin sembrar', () => {
      expect(releasedKeys(null, new Set(['f1']))).toEqual([])
    })
  })
})
