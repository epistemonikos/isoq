import { scan, scanCode } from './silentCatchScanner'
import ALLOWED from './silentCatchAllowlist'

/**
 * Guardián de la auditoría de fallos silenciosos (2026-09-28).
 *
 * `Commons.printErrors` no muestra nada, y un `.catch` que sólo lo llamaba —o sólo hacía
 * `console.*`— dejaba a la persona sin saber que su escritura, su carga o su publicación
 * habían fallado: el spinner de publicar giraba para siempre, quitar el acceso a alguien
 * fallaba y el dueño creía que se lo había quitado. La auditoría encontró 124 de 227.
 *
 * Este test no deja volver: un `catch` silencioso nuevo sólo pasa si está en la allowlist,
 * con su motivo.
 */
describe('guardián: ningún catch nuevo se queda callado', () => {
  const found = scan()
  const foundKeys = found.map(f => f.key)

  it('todo catch silencioso está en la allowlist, con su motivo', () => {
    const nuevos = found.filter(f => !Object.prototype.hasOwnProperty.call(ALLOWED, f.key))
    const detalle = nuevos.map(f => `  ${f.key} (línea ${f.line} del script)`).join('\n')
    expect({
      nuevos: nuevos.length,
      ayuda: nuevos.length
        ? 'Este catch no le muestra nada a la persona. Avísale (writeErrorMessageKey, LoadErrorAlert o el b-alert de la pantalla) o, si callar es correcto, agrégalo a tests/unit/guards/silentCatchAllowlist.js con el motivo:\n' + detalle
        : ''
    }).toEqual({ nuevos: 0, ayuda: '' })
  })

  // Una entrada que ya no corresponde a nada no protege nada: sólo espera a que un silencio
  // nuevo aparezca con el mismo nombre y pase sin que nadie lo mire.
  it('la allowlist no tiene entradas muertas', () => {
    const muertas = Object.keys(ALLOWED).filter(key => !foundKeys.includes(key))
    expect(muertas).toEqual([])
  })

  it('cada entrada de la allowlist dice por qué', () => {
    for (const [key, motivo] of Object.entries(ALLOWED)) {
      expect({ key, largo: typeof motivo === 'string' && motivo.trim().length > 20 }).toEqual({ key, largo: true })
    }
  })
})

// La regla, fijada con ejemplos: sin esto, un cambio en el escáner podría volverlo ciego y el
// guardián pasaría en verde sin mirar nada.
describe('guardián: la regla del escáner', () => {
  const keysOf = (code) => scanCode(code, 'x.js').map(f => f.key)

  it.each([
    ['sólo console.error', 'function f () { p.catch((e) => { console.error(e) }) }'],
    ['sólo printErrors', 'function f () { p.catch((error) => { this.printErrors(error) }) }'],
    ['console.log(Commons.printErrors(e))', 'function f () { p.catch((e) => { console.log(Commons.printErrors(e)) }) }'],
    ['vacío', 'function f () { p.catch(() => {}) }'],
    ['try/catch que sólo loguea', 'function f () { try { g() } catch (e) { console.warn(e) } }'],
    ['flecha de expresión que loguea', 'function f () { p.catch(e => console.error(e)) }']
  ])('marca: %s', (_caso, code) => {
    expect(keysOf(code)).toEqual(['x.js::f'])
  })

  it.each([
    ['asigna un estado', 'function f () { p.catch(() => { this.loadError = true }) }'],
    ['avisa', 'function f () { p.catch((e) => { console.error(e); this.$notify.error("x") }) }'],
    ['delega en un método', 'function f () { p.catch((e) => this.onSaveError(e)) }'],
    ['devuelve un valor', 'function f () { p.catch(() => null) }'],
    ['relanza', 'function f () { try { g() } catch (e) { throw e } }'],
    ['emite print-errors (lo muestra viewProject.onTableError)', 'function f () { p.catch((e) => { this.$emit("print-errors", e) }) }'],
    ['pasa un handler por referencia', 'function f () { p.catch(this.onPublishError) }']
  ])('no marca: %s', (_caso, code) => {
    expect(keysOf(code)).toEqual([])
  })

  it('dos silencios en la misma función se numeran', () => {
    expect(keysOf('function f () { a.catch(() => {}); b.catch(() => {}) }')).toEqual(['x.js::f', 'x.js::f#2'])
  })
})
