import { VERSION_FIELD, ITEM_METADATA_KEYS, copyItemMetadata, isItemMetadata } from '@/utils/itemMetadata'

describe('itemMetadata — las claves que el servidor guarda dentro de la fila', () => {
  it('nombra el contador de versión', () => {
    expect(VERSION_FIELD).toBe('_v')
    expect(ITEM_METADATA_KEYS).toContain('_v')
  })

  describe('copyItemMetadata()', () => {
    it('copia el contador que la fila trae', () => {
      const target = { ref_id: 'r1', column_0: 'x' }

      copyItemMetadata(target, { ref_id: 'r1', column_0: 'x', _v: 7 })

      expect(target._v).toBe(7)
    })

    // Un `_v` no entero es `400 invalid_version`: el servidor lo lee como una
    // expectativa mal formada, no como un dato ausente. Omitir la clave es el camino
    // tolerado — escribe sin comprobar la frescura y lo registra como warning.
    it('no inventa la clave cuando la fila no la trae', () => {
      const target = { ref_id: 'r1' }

      copyItemMetadata(target, { ref_id: 'r1' })

      expect('_v' in target).toBe(false)
    })

    // El servidor rechaza con `400 invalid_version` cualquier `_v` que no sea entero, y
    // lo rechaza a propósito: ignorarlo saltaría la comprobación en silencio. Copiar un
    // valor corrupto —un documento viejo, un roundtrip por XLSX que lo devuelve como
    // texto— convierte esa defensa en un guardado que no se puede completar nunca.
    it.each([
      ['null', null],
      ['cadena vacía', ''],
      ['un número en texto', '3'],
      ['un booleano', true],
      ['un decimal', 1.5],
      ['un negativo', -1]
    ])('descarta un contador que llega como %s', (_label, value) => {
      const target = { ref_id: 'r1' }

      copyItemMetadata(target, { ref_id: 'r1', _v: value })

      expect('_v' in target).toBe(false)
    })

    it('conserva la versión 0 en vez de tomarla por ausente', () => {
      const target = { ref_id: 'r1' }

      copyItemMetadata(target, { ref_id: 'r1', _v: 0 })

      expect(target._v).toBe(0)
    })

    it('devuelve el mismo objeto, para poder encadenarlo en un map', () => {
      const target = { ref_id: 'r1' }

      expect(copyItemMetadata(target, { _v: 2 })).toBe(target)
    })

    it('tolera una fila de origen nula', () => {
      const target = { ref_id: 'r1' }

      expect(() => copyItemMetadata(target, null)).not.toThrow()
      expect('_v' in target).toBe(false)
    })
  })

  describe('isItemMetadata()', () => {
    // Las heurísticas de «fila vacía» recorren las claves del ítem y preguntan si alguna
    // tiene valor. `_v` es un número, así que sin esto toda fila vacía pasaría a tener
    // contenido y los avisos de datos incompletos dejarían de aparecer.
    it('reconoce el contador de versión', () => {
      expect(isItemMetadata('_v')).toBe(true)
    })

    it('no reclama una columna', () => {
      expect(isItemMetadata('column_0')).toBe(false)
    })
  })
})
