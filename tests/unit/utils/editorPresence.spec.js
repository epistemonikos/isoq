import {
  announcePresence, clearPresence, otherTabActiveOn, resetTabIdentityForTests
} from '@/utils/editorPresence'

/**
 * La coordinación entre pestañas de la MISMA persona.
 *
 * Hace falta porque el backend refresca el lock cuando el user_id coincide (las dos
 * pestañas reciben success) y `/refs` expone sólo `user_name`: no hay forma de
 * distinguirlas del lado del servidor.
 */
describe('editorPresence', () => {
  beforeEach(() => {
    localStorage.clear()
    resetTabIdentityForTests()
  })

  /** Ejecuta algo bajo una identidad de pestaña distinta. */
  function comoOtraPestana (fn) {
    resetTabIdentityForTests()
    const r = fn()
    resetTabIdentityForTests()
    return r
  }

  it('la propia marca no cuenta como "otra pestaña"', () => {
    announcePresence('R1', Date.now())
    expect(otherTabActiveOn('R1', 0)).toBe(false)
  })

  it('detecta otra pestaña con actividad más reciente', () => {
    const ahora = Date.now()
    comoOtraPestana(() => announcePresence('R1', ahora))
    // La que pregunta lleva cinco minutos sin tocar nada.
    expect(otherTabActiveOn('R1', ahora - 5 * 60 * 1000)).toBe(true)
  })

  // El sentido es "alguien trabajó DESPUÉS que yo", no "alguien existe".
  it('ignora otra pestaña que estuvo inactiva más tiempo que la nuestra', () => {
    const ahora = Date.now()
    comoOtraPestana(() => announcePresence('R1', ahora - 10 * 60 * 1000))
    expect(otherTabActiveOn('R1', ahora)).toBe(false)
  })

  it('no confunde estudios distintos', () => {
    const ahora = Date.now()
    comoOtraPestana(() => announcePresence('R9', ahora))
    expect(otherTabActiveOn('R1', 0)).toBe(false)
  })

  it('clearPresence borra la propia marca y respeta la ajena', () => {
    const ahora = Date.now()
    comoOtraPestana(() => announcePresence('R1', ahora))
    announcePresence('R1', ahora)

    clearPresence('R1')

    expect(otherTabActiveOn('R1', 0)).toBe(true)
    expect(localStorage.getItem('editor_active_R1')).not.toBeNull()
  })

  it('borra la clave entera cuando no queda nadie', () => {
    announcePresence('R1', Date.now())
    clearPresence('R1')
    expect(localStorage.getItem('editor_active_R1')).toBeNull()
  })

  it('descarta marcas rancias', () => {
    const viejo = Date.now() - 20 * 60 * 1000
    comoOtraPestana(() => announcePresence('R1', viejo))
    announcePresence('R1', Date.now())
    expect(otherTabActiveOn('R1', 0)).toBe(false)
  })

  // Fail-open: trabar la liberación por no poder leer una clave sería peor que el bug
  // que esto evita — volveríamos a dejar estudios tomados para siempre.
  it('con localStorage corrupto responde que no hay nadie', () => {
    localStorage.setItem('editor_active_R1', '{{ esto no es json')
    expect(otherTabActiveOn('R1', 0)).toBe(false)
    expect(() => announcePresence('R1', Date.now())).not.toThrow()
  })

  it('sin refId no hace nada', () => {
    expect(otherTabActiveOn(null, 0)).toBe(false)
    expect(() => announcePresence(null, Date.now())).not.toThrow()
    expect(() => clearPresence(null)).not.toThrow()
  })
})
