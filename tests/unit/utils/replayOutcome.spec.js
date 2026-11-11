import { replayOutcome, rejectionReason } from '@/utils/replayOutcome'

const conStatus = (status, extra = {}) => ({ config: { url: '/isoqf_findings/f1' }, response: { status, data: {} }, ...extra })

/**
 * Qué hacer con una operación de la cola offline que el servidor no aceptó.
 *
 * Antes, todo lo que no fuera un conflicto de lock, versión o nombre duplicado se quedaba en
 * la cola para siempre: una edición hecha sin conexión por alguien a quien le quitaron el
 * permiso daba 403 en cada sincronización, el contador nunca bajaba y nadie le avisaba que
 * lo escrito no se iba a guardar.
 *
 * Lo reintentable es una lista explícita. Todo lo demás se descarta y se avisa. Escrito al
 * revés, cualquier código que el cliente no conozca volvería a trabar la cola para siempre.
 */
describe('replayOutcome', () => {
  it('sin respuesta: reintentar (la red se cayó a mitad de la corrida)', () => {
    expect(replayOutcome({ message: 'Network Error' })).toBe('retry')
  })

  it.each([401, 408, 429, 500, 502, 503, 504])('%s: reintentar', (status) => {
    // 401: la sesión venció; al volver a entrar la misma escritura puede pasar. Tirarla
    // sería perder trabajo por un token.
    expect(replayOutcome(conStatus(status))).toBe('retry')
  })

  it.each([400, 403, 404, 410, 422])('%s: descartar y avisar', (status) => {
    expect(replayOutcome(conStatus(status))).toBe('drop')
  })

  it('un código que este cliente todavía no conoce se descarta y se avisa, no se reintenta para siempre', () => {
    expect(replayOutcome(conStatus(499))).toBe('drop')
  })

  it('un 409 de lock en una ruta granular ya lo anunció el interceptor: descartar sin otro aviso', () => {
    const error = { config: { url: '/isoqf_characteristics/c1/item/R1' }, response: { status: 409, data: { locked_by: 'Ana' } } }
    expect(replayOutcome(error)).toBe('drop-announced')
  })

  it('un 403 en una ruta granular NO lo anuncia el interceptor en un replay: descartar y avisar', () => {
    // El interceptor lo mandaría al canal de locks («otra persona está editando»), que es
    // falso para una pérdida de permiso. En un replay lo anuncia la cola, con su motivo.
    const error = { config: { url: '/isoqf_characteristics/c1/item/R1' }, response: { status: 403, data: {} } }
    expect(replayOutcome(error)).toBe('drop')
  })
})

describe('rejectionReason', () => {
  it.each([
    [403, 'forbidden'],
    [404, 'gone'],
    [410, 'gone'],
    [400, 'rejected'],
    [499, 'rejected']
  ])('%s → %s', (status, reason) => {
    expect(rejectionReason(status)).toBe(reason)
  })
})

// Borrar algo que ya no está es haber llegado a donde se quería. El backend responde 404
// sobre un documento inexistente (antes daba 200 sin efecto): para un DELETE eso es éxito,
// y avisar «no se guardó» sería falso.
describe('replayOutcome — un DELETE que ya no encuentra nada', () => {
  it.each([404, 410])('%s en un DELETE: hecho, sin aviso', (status) => {
    expect(replayOutcome(conStatus(status), 'DELETE')).toBe('done')
  })

  it('un 404 en un PATCH sigue siendo trabajo perdido', () => {
    expect(replayOutcome(conStatus(404), 'PATCH')).toBe('drop')
  })

  it('un 403 en un DELETE sigue siendo un rechazo', () => {
    expect(replayOutcome(conStatus(403), 'DELETE')).toBe('drop')
  })
})

