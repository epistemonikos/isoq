/**
 * CARACTERIZACIÓN del entorno, no de nuestro código.
 *
 * El temporizador de inactividad va a pedir el flush de los editores por un CustomEvent en
 * `window` y, acto seguido, cerrar el modal. Si un listener que lanza cortara el dispatch,
 * un editor roto dejaría a los demás sin guardar; y si además propagara al emisor, el
 * cierre nunca ocurriría y el lock quedaría retenido — el peor final posible para un
 * mecanismo cuyo único propósito es liberarlo.
 *
 * Fija la garantía en la que se apoya la decisión de proteger con try/finally sólo el
 * llamado directo del Paso 3 y no el broadcast del Paso 4. Si esto se pusiera rojo con un
 * cambio de jsdom o de Jest, el Paso 4 también necesitaría protección.
 */
describe('window.dispatchEvent con un listener que lanza', () => {
  const EVT = 'flush-pending-edits-probe'

  it('sigue notificando a los demás listeners y no propaga al emisor', () => {
    const before = jest.fn()
    const after = jest.fn()
    const throwing = () => { throw new Error('editor roto') }

    window.addEventListener(EVT, before)
    window.addEventListener(EVT, throwing)
    window.addEventListener(EVT, after)

    // jsdom reporta la excepción a onerror en vez de relanzarla acá.
    const onError = jest.fn()
    window.addEventListener('error', onError)

    expect(() => window.dispatchEvent(new CustomEvent(EVT))).not.toThrow()

    expect(before).toHaveBeenCalledTimes(1)
    // Lo que importa: el listener posterior al que falló igual recibe el evento.
    expect(after).toHaveBeenCalledTimes(1)

    window.removeEventListener(EVT, before)
    window.removeEventListener(EVT, throwing)
    window.removeEventListener(EVT, after)
    window.removeEventListener('error', onError)
  })
})
