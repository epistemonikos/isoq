// El DSN de Sentry sale del entorno, no de una edición local del archivo.
//
// `config/prod.env.js` mezcla dos cosas que no se comportan igual: feature flags, que TIENEN
// que viajar con el código, y valores propios de cada host, que no pueden. Mientras el
// secreto se completara editando el archivo, cada servidor quedaba con un archivo trackeado
// modificado — y eso rompe el `git pull` en cuanto un commit toca ese mismo archivo.
//
// Pasó: `2d6185e9` (2026-08-20) modificó `config/prod.env.js`, el pull del servidor de
// pruebas abortó, y el checkout quedó clavado once días mientras los builds seguían
// corriendo sobre código viejo. El archivo que bloquea el pull es justamente el que lleva los
// flags, así que el cambio con más probabilidad de no llegar es un cambio de flag — y
// `2d6185e9` era literalmente encender uno.

const path = require('path')

const prodEnvPath = path.resolve(__dirname, '../../../config/prod.env.js')

// Los valores van doblemente citados a propósito: `DefinePlugin` los sustituye tal cual en
// el código, así que lo que se guarda acá es el *literal fuente*, no el string.
const cargar = () => {
  jest.resetModules()
  return require(prodEnvPath)
}

describe('config/prod.env.js — el DSN de Sentry', () => {
  const entornoOriginal = process.env.SENTRY_DSN

  afterEach(() => {
    if (entornoOriginal === undefined) delete process.env.SENTRY_DSN
    else process.env.SENTRY_DSN = entornoOriginal
  })

  it('toma el DSN de la variable de entorno', () => {
    process.env.SENTRY_DSN = 'https://abc@o1.ingest.sentry.io/2'
    expect(cargar().SENTRY_DSN).toBe('"https://abc@o1.ingest.sentry.io/2"')
  })

  it('sin la variable queda vacío, no con un marcador de posición', () => {
    // El valor anterior era `"YOUR_SENTRY_DSN_HERE"`, que es **truthy**. `main.js` hace
    // `if (process.env.SENTRY_DSN)`, así que cualquier host que no editara el archivo
    // arrancaba Sentry con un DSN inválido en vez de saltearlo. Vacío es falsy y se saltea,
    // que es lo que la guarda de `main.js` siempre quiso decir.
    delete process.env.SENTRY_DSN
    expect(cargar().SENTRY_DSN).toBe('""')
  })

  it('el literal siempre es JSON válido, incluso con comillas en el valor', () => {
    // Se arma con `JSON.stringify` y no concatenando comillas: un valor con una comilla
    // rompería el literal y el bundle no compilaría, o peor, compilaría cualquier cosa.
    process.env.SENTRY_DSN = 'raro"con-comilla'
    expect(() => JSON.parse(cargar().SENTRY_DSN)).not.toThrow()
    expect(JSON.parse(cargar().SENTRY_DSN)).toBe('raro"con-comilla')
  })

  it('los feature flags siguen en el archivo, no en el entorno', () => {
    // Es la mitad que NO hay que mover. Los flags tienen que viajar con el código: sacarlos
    // al entorno obligaría a replicarlos a mano en cada host, que es exactamente el problema
    // que este cambio viene a resolver, sólo que al revés.
    const env = cargar()
    expect(env.ENABLE_CONCURRENCY_CONTROL).toBeDefined()
    expect(env.ENABLE_GDPR).toBeDefined()
    expect(env.ENABLE_REGISTRATION).toBeDefined()
  })
})
