import {
  EVIDENCE_PROFILE_SECTIONS,
  sectionOfType,
  sectionLockBaseOf,
  lockKeyBelongsTo,
  sectionLockKey,
  parseSectionLockKey,
  blockedSectionsOf
} from '@/utils/evidenceProfileLockKeys'

const FID = 'f1'
const lock = (refId, userName = 'Ana Pérez') => ({ ref_id: refId, user_name: userName })

describe('evidenceProfileLockKeys', () => {
  describe('EVIDENCE_PROFILE_SECTIONS', () => {
    // Los cinco nombres literales, y en grafía de guión BAJO. Es la lista que el
    // servidor tiene en `auth_server/libs/evidence_profile.py`, y nada ata las dos
    // copias: si alguien cambia una, este test es lo único que lo delata de este
    // lado.
    it('son las cinco secciones canónicas, con guión bajo', () => {
      expect(EVIDENCE_PROFILE_SECTIONS).toEqual([
        'methodological_limitations',
        'coherence',
        'adequacy',
        'relevance',
        'cerqual'
      ])
    })
  })

  describe('sectionOfType', () => {
    it('traduce la grafía con guión que usa la tabla', () => {
      expect(sectionOfType('methodological-limitations')).toBe('methodological_limitations')
    })

    it('es idempotente: acepta la grafía canónica sin tocarla', () => {
      expect(sectionOfType('methodological_limitations')).toBe('methodological_limitations')
      expect(sectionOfType('coherence')).toBe('coherence')
    })

    it('devuelve null para lo que no es una sección', () => {
      // Lo desconocido no se convierte en una sección: si `editStageTwo` recibiera
      // un tipo mal escrito, mejor que no bloquee nada que bloquear algo ajeno.
      expect(sectionOfType('inventada')).toBeNull()
      expect(sectionOfType('')).toBeNull()
      expect(sectionOfType(undefined)).toBeNull()
      expect(sectionOfType(null)).toBeNull()
      expect(sectionOfType(42)).toBeNull()
    })
  })

  describe('sectionLockBaseOf', () => {
    it('devuelve el documento del que cuelga una clave de sección', () => {
      expect(sectionLockBaseOf('f1::ep::coherence')).toBe('f1')
      expect(sectionLockBaseOf('f1::ep::methodological_limitations')).toBe('f1')
      expect(sectionLockBaseOf('f1::ep::cerqual')).toBe('f1')
    })

    // ── Test "de camino" ────────────────────────────────────────────────
    // No verifica un valor de negocio: verifica que cada forma de clave del
    // keyspace caiga en la rama correcta. El patrón es el de `lockErrors.spec.js`,
    // y existe porque este keyspace ya tiene cinco formas conviviendo y una sola
    // función que las distingue en cada repo.
    it('no confunde ninguna otra forma del keyspace', () => {
      expect(sectionLockBaseOf('R1::s0::o2')).toBeNull()      // hoja del Paso 4
      expect(sectionLockBaseOf('doc1::fields')).toBeNull()    // columnas de tabla
      expect(sectionLockBaseOf('criteria::inclusion')).toBeNull() // criterios Paso 2
      expect(sectionLockBaseOf('f1')).toBeNull()              // documento pelado
      expect(sectionLockBaseOf('')).toBeNull()
      expect(sectionLockBaseOf(undefined)).toBeNull()
    })

    it('NO parsea la forma corta que se descartó en el diseño', () => {
      // `<fid>::<section>` fue la primera propuesta y se descartó: obligaba al
      // servidor a enumerar las cinco secciones dentro de su módulo de parentesco,
      // y entonces una sección nueva que este cliente emitiera antes de que el
      // servidor la conociera perdería el parentesco con su documento SIN ningún
      // error visible. Este caso está escrito para que nadie la reintroduzca.
      expect(sectionLockBaseOf('f1::coherence')).toBeNull()
      expect(sectionLockBaseOf('f1::cerqual')).toBeNull()
    })

    it('el infijo es literal, no un comodín', () => {
      expect(sectionLockBaseOf('f1::epx::coherence')).toBeNull()
      expect(sectionLockBaseOf('f1::ep')).toBeNull()
      expect(sectionLockBaseOf('f1::ep::')).toBeNull()
      expect(sectionLockBaseOf('::ep::coherence')).toBeNull()
      expect(sectionLockBaseOf('f1::ep::a::b')).toBeNull()
    })

    it('acepta una sección que este cliente todavía no conoce', () => {
      // Deliberado, y es el punto del infijo: espeja `base_ref_of` del servidor,
      // que usa `[A-Za-z0-9_]+` genérico. Si el servidor conoce una sexta sección y
      // este cliente no, la clave tiene que seguir colgando de su documento igual
      // que allá — enumerar acá haría que los dos repos discrepasen justo en el caso
      // que nadie prueba.
      expect(sectionLockBaseOf('f1::ep::seccion_nueva')).toBe('f1')
    })
  })

  describe('lockKeyBelongsTo', () => {
    it('el documento pelado le pertenece', () => {
      expect(lockKeyBelongsTo('f1', 'f1')).toBe(true)
    })

    it('cualquier sección suya le pertenece', () => {
      expect(lockKeyBelongsTo('f1::ep::coherence', 'f1')).toBe(true)
      expect(lockKeyBelongsTo('f1::ep::cerqual', 'f1')).toBe(true)
      // Incluida una que este cliente no enumera: es lo que el servidor va a
      // rechazar cuando alguien pida `f1` pelado para renombrar o borrar.
      expect(lockKeyBelongsTo('f1::ep::seccion_nueva', 'f1')).toBe(true)
    })

    it('una sección de OTRO documento no le pertenece', () => {
      expect(lockKeyBelongsTo('f2::ep::coherence', 'f1')).toBe(false)
    })

    it('no decide por prefijo', () => {
      // Mismo invariante que el servidor fija en
      // `test_leaf_lock_of_a_ref_that_merely_starts_with_ours_does_not_block`: el
      // parentesco es por el separador, nunca por `startsWith`.
      expect(lockKeyBelongsTo('f1X::ep::coherence', 'f1')).toBe(false)
      expect(lockKeyBelongsTo('f1X', 'f1')).toBe(false)
    })

    it('las otras formas del keyspace no le pertenecen', () => {
      expect(lockKeyBelongsTo('f1::s0::o0', 'f1')).toBe(false)
      expect(lockKeyBelongsTo('f1::fields', 'f1')).toBe(false)
    })

    it('sin clave o sin documento es false, no una excepción', () => {
      // `releaseRef` busca por igualdad de string, así que una clave a medio
      // construir no sería un error sino un lock colgado hasta el TTL.
      expect(lockKeyBelongsTo(undefined, 'f1')).toBe(false)
      expect(lockKeyBelongsTo('f1', undefined)).toBe(false)
      expect(lockKeyBelongsTo('', '')).toBe(false)
    })
  })

  describe('sectionLockKey', () => {
    it('compone la clave del contrato', () => {
      expect(sectionLockKey('f1', 'coherence')).toBe('f1::ep::coherence')
    })

    it('acepta la grafía con guión y emite la canónica', () => {
      expect(sectionLockKey('f1', 'methodological-limitations'))
        .toBe('f1::ep::methodological_limitations')
    })

    it('es estricto al emitir: null sin finding o con sección inventada', () => {
      // Misma razón que `fieldsLockKey`: una clave a medio construir se tomaría
      // sobre nada y NUNCA se soltaría, porque `releaseRef` busca por igualdad de
      // string. No sería un error visible sino un lock colgado hasta el TTL.
      expect(sectionLockKey(undefined, 'coherence')).toBeNull()
      expect(sectionLockKey('', 'coherence')).toBeNull()
      expect(sectionLockKey('f1', 'inventada')).toBeNull()
      expect(sectionLockKey('f1', undefined)).toBeNull()
    })

    it('lo que emite, `sectionLockBaseOf` lo lee de vuelta', () => {
      const key = sectionLockKey('f1', 'cerqual')
      expect(sectionLockBaseOf(key)).toBe('f1')
    })
  })

  describe('parseSectionLockKey', () => {
    it('parte la clave en documento y sección', () => {
      expect(parseSectionLockKey('f1::ep::coherence'))
        .toEqual({ findingId: 'f1', section: 'coherence' })
    })

    it('es permisivo al leer: acepta una sección que no enumeramos', () => {
      expect(parseSectionLockKey('f1::ep::seccion_nueva'))
        .toEqual({ findingId: 'f1', section: 'seccion_nueva' })
    })

    it('devuelve null para cualquier otra forma', () => {
      expect(parseSectionLockKey('f1')).toBeNull()
      expect(parseSectionLockKey('f1::coherence')).toBeNull()
      expect(parseSectionLockKey('R1::s0::o0')).toBeNull()
      expect(parseSectionLockKey('doc::fields')).toBeNull()
      expect(parseSectionLockKey(undefined)).toBeNull()
    })
  })

  describe('blockedSectionsOf', () => {
    it('una sección tomada bloquea SÓLO esa — el objetivo de la feature', () => {
      const blocked = blockedSectionsOf([lock('f1::ep::coherence')], FID, 'Yo Mismo')
      expect([...blocked.keys()]).toEqual(['coherence'])
      expect(blocked.get('coherence')).toBe('Ana Pérez')
    })

    it('el documento pelado bloquea las cinco', () => {
      // Es un lock estrictamente MÁS AMPLIO: lo sostiene quien edita la identidad
      // del finding desde ViewTable, y un bundle viejo durante el despliegue.
      // Ignorarlo sería fail-open: dos personas escribiendo la misma sección.
      const blocked = blockedSectionsOf([lock(FID)], FID, 'Yo Mismo')
      expect([...blocked.keys()].sort()).toEqual([...EVIDENCE_PROFILE_SECTIONS].sort())
    })

    it('una sección que este cliente no enumera NO bloquea ninguna', () => {
      // Parece fail-open y es lo contrario. El servidor evalúa `other == base` al
      // pedir `f1::ep::coherence`, y contra `f1::ep::algo_nuevo` da falso: AUTORIZA.
      // Bloquear acá sería más restrictivo que el servidor.
      const blocked = blockedSectionsOf([lock('f1::ep::seccion_nueva')], FID, 'Yo Mismo')
      expect(blocked.size).toBe(0)
    })

    it('pero esa misma clave sí ocupa el finding en la otra pregunta', () => {
      // Las dos reglas conviven porque son preguntas distintas, y las dos espejan
      // al servidor: `f1` pelado SÍ choca con `f1::ep::algo_nuevo`.
      expect(lockKeyBelongsTo('f1::ep::seccion_nueva', FID)).toBe(true)
    })

    it('dos secciones tomadas por dos personas se nombran cada una', () => {
      const blocked = blockedSectionsOf([
        lock('f1::ep::coherence', 'Ana Pérez'),
        lock('f1::ep::adequacy', 'Beto Díaz')
      ], FID, 'Yo Mismo')
      expect(blocked.get('coherence')).toBe('Ana Pérez')
      expect(blocked.get('adequacy')).toBe('Beto Díaz')
      expect(blocked.has('relevance')).toBe(false)
    })

    it('el dueño de una sección concreta gana sobre el del documento', () => {
      // El documento sólo rellena lo que nadie reclamó, así que el cartel de una
      // sección con dueño propio sigue nombrando a esa persona.
      const blocked = blockedSectionsOf([
        lock('f1::ep::coherence', 'Ana Pérez'),
        lock(FID, 'Beto Díaz')
      ], FID, 'Yo Mismo')
      expect(blocked.get('coherence')).toBe('Ana Pérez')
      expect(blocked.get('adequacy')).toBe('Beto Díaz')
    })

    it('descarta el lock propio dejado en otra pestaña', () => {
      // El descarte que `foreignRefLocks` no puede hacer: sólo conoce ESTA pestaña.
      // Sin esto, abrir la worksheet dos veces se bloquea contra uno mismo.
      const blocked = blockedSectionsOf([lock('f1::ep::coherence', 'Yo Mismo')], FID, 'Yo Mismo')
      expect(blocked.size).toBe(0)
    })

    it('un lock sin nombre no bloquea', () => {
      // Sin a quién nombrar, el cartel queda mudo y el botón muerto.
      const blocked = blockedSectionsOf([
        { ref_id: 'f1::ep::coherence', user_name: null }
      ], FID, 'Yo Mismo')
      expect(blocked.size).toBe(0)
    })

    it('una sección de OTRO finding no bloquea nada', () => {
      const blocked = blockedSectionsOf([lock('otro::ep::coherence')], FID, 'Yo Mismo')
      expect(blocked.size).toBe(0)
    })

    it('no decide por prefijo', () => {
      const blocked = blockedSectionsOf([lock('f1X::ep::coherence')], FID, 'Yo Mismo')
      expect(blocked.size).toBe(0)
    })

    // ── Test "de camino" ────────────────────────────────────────────────
    // Por este listado pasan TODAS las claves vigentes del proyecto, de los cinco
    // ejes que conviven en `ref_locks`. No verifica un valor de negocio: verifica
    // que cada forma ajena caiga en la rama de ignorar, y sin lanzar.
    it('ignora sin lanzar las claves de los otros ejes', () => {
      const otros = [
        lock('R1'), lock('R1::s0::o0'), lock('doc1::fields'),
        lock('criteria::inclusion'), lock('f1::coherence'),
        lock('f1::ep::'), lock('::ep::coherence'), lock('f1::epx::coherence')
      ]
      expect(() => blockedSectionsOf(otros, FID, 'Yo Mismo')).not.toThrow()
      expect(blockedSectionsOf(otros, FID, 'Yo Mismo').size).toBe(0)
    })

    it('entradas degeneradas devuelven un Map vacío, no una excepción', () => {
      expect(blockedSectionsOf([], FID, 'Yo').size).toBe(0)
      expect(blockedSectionsOf(undefined, FID, 'Yo').size).toBe(0)
      expect(blockedSectionsOf([lock('f1::ep::coherence')], undefined, 'Yo').size).toBe(0)
      expect(blockedSectionsOf([null, undefined, {}], FID, 'Yo').size).toBe(0)
    })
  })
})
