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

// El cargador del `.env` queda simulado: si no, un `.env` real en la máquina de quien corre la
// suite cambiaría lo que estos tests ven. Lo que hace el cargador se prueba en `entorno.spec.js`.
jest.mock('../../../config/entorno', () => ({
  ...jest.requireActual('../../../config/entorno'),
  cargarArchivoEnv: jest.fn()
}))

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

  it('SENTRY_RELEASE llega al bundle con el mismo fallback que usa el plugin de sourcemaps', () => {
    // `main.js` le pasa `process.env.SENTRY_RELEASE` a `Sentry.init`, pero nadie lo definía
    // para `DefinePlugin`: en el navegador valía `undefined`. Mientras tanto el plugin subía
    // los sourcemaps con `SENTRY_RELEASE || package.json version`, así que los eventos y los
    // sourcemaps nunca compartían release y los stack traces quedaban minificados.
    delete process.env.SENTRY_RELEASE
    expect(cargar().SENTRY_RELEASE).toBe(JSON.stringify(require('../../../package.json').version))
    process.env.SENTRY_RELEASE = 'isoq@abc123'
    expect(cargar().SENTRY_RELEASE).toBe('"isoq@abc123"')
    delete process.env.SENTRY_RELEASE
  })

  it('las credenciales del plugin de sourcemaps NO llegan al bundle', () => {
    // SENTRY_AUTH_TOKEN/ORG/PROJECT las lee `webpack.prod.conf.js` en tiempo de build. Todo
    // lo que esté en este archivo termina como literal en el JS que baja cualquier visitante.
    process.env.SENTRY_AUTH_TOKEN = 'secreto'
    const env = cargar()
    delete process.env.SENTRY_AUTH_TOKEN
    expect(Object.keys(env)).not.toContain('SENTRY_AUTH_TOKEN')
    expect(Object.values(env).join()).not.toContain('secreto')
  })
})

describe('config/prod.env.js — los feature flags', () => {
  // El valor por defecto vive en el archivo y viaja con el código: un host que no configura
  // nada obtiene lo que decidió el último commit. La variable de entorno sólo lo pisa en el
  // host que la define, sin editar el archivo trackeado — que es lo que dejaba el checkout
  // sucio, el build con sello `-dirty` y el `git pull` abortado.
  const FLAGS = {
    ENABLE_CONCURRENCY_CONTROL: '"on"',
    ENABLE_REGISTRATION: '"true"',
    ENABLE_GDPR: '"true"'
  }
  const originales = {}

  beforeEach(() => {
    Object.keys(FLAGS).forEach(f => { originales[f] = process.env[f]; delete process.env[f] })
  })

  afterEach(() => {
    Object.keys(FLAGS).forEach(f => {
      if (originales[f] === undefined) delete process.env[f]
      else process.env[f] = originales[f]
    })
  })

  it.each(Object.entries(FLAGS))('%s sin variable toma el default commiteado', (flag, porDefecto) => {
    expect(cargar()[flag]).toBe(porDefecto)
  })

  it.each(Object.keys(FLAGS))('%s se puede pisar desde el entorno', (flag) => {
    process.env[flag] = 'off'
    expect(cargar()[flag]).toBe('"off"')
  })

  it.each(Object.entries(FLAGS))('%s con la variable vacía cae al default, no a apagado', (flag, porDefecto) => {
    // `FLAG= npm run build` es casi siempre un export a medio escribir, no una decisión. Que
    // eso apagara GDPR o el control de concurrencia en silencio sería el peor error posible.
    process.env[flag] = ''
    expect(cargar()[flag]).toBe(porDefecto)
  })
})

describe('config/*.env — el .env de la raíz', () => {
  it('prod.env.js carga el .env al leerse', () => {
    // Es el único punto de carga: dev.env y test.env.js heredan de prod.env.js vía
    // webpack-merge, y webpack.prod.conf.js lo requiere antes de leer SENTRY_AUTH_TOKEN.
    // Se pide el mock DESPUÉS de `cargar()`: `resetModules` crea una instancia nueva del
    // mock, y la de antes no ve la llamada.
    cargar()
    const { cargarArchivoEnv } = require('../../../config/entorno')
    expect(cargarArchivoEnv).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['dev.env', 'ENABLE_GDPR', '"false"'],
    ['test.env.js', 'ENABLE_REGISTRATION', '"false"']
  ])('%s mantiene su default propio y también se pisa desde el entorno', (archivo, flag, porDefecto) => {
    const ruta = path.resolve(__dirname, '../../../config', archivo)
    const original = process.env[flag]
    delete process.env[flag]
    jest.resetModules()
    expect(require(ruta)[flag]).toBe(porDefecto)
    process.env[flag] = 'on'
    jest.resetModules()
    expect(require(ruta)[flag]).toBe('"on"')
    if (original === undefined) delete process.env[flag]
    else process.env[flag] = original
  })
})
