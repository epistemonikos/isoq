// `config/entorno.js`: de dónde salen los valores que cambian según el servidor.
//
// Precedencia, de mayor a menor: la variable de la shell, el `.env` del servidor, el default
// commiteado. El `.env` no se versiona (su plantilla es `.env.example`); el default sí, para
// que un flag nuevo llegue a todos los servidores con el `git pull` aunque nadie toque su `.env`.

const fs = require('fs')
const os = require('os')
const path = require('path')

const { cargarArchivoEnv, desdeEntorno } = require('../../../config/entorno')

const VARIABLE = 'ISOQ_TEST_ENTORNO_VARIABLE'

describe('config/entorno.js', () => {
  let dir

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'isoq-entorno-'))
    delete process.env[VARIABLE]
  })

  afterEach(() => {
    delete process.env[VARIABLE]
    fs.rmdirSync(dir, { recursive: true })
  })

  const escribirEnv = (contenido) => {
    const archivo = path.join(dir, '.env')
    fs.writeFileSync(archivo, contenido)
    return archivo
  }

  it('lee los valores del archivo .env', () => {
    cargarArchivoEnv(escribirEnv(`${VARIABLE}=desde-archivo\n`))
    expect(desdeEntorno(VARIABLE, 'default')).toBe('"desde-archivo"')
  })

  it('la variable de la shell le gana al .env', () => {
    // `ENABLE_GDPR=false npm run build` tiene que seguir sirviendo para una prueba puntual
    // sin editar el `.env` del servidor.
    process.env[VARIABLE] = 'desde-shell'
    cargarArchivoEnv(escribirEnv(`${VARIABLE}=desde-archivo\n`))
    expect(desdeEntorno(VARIABLE, 'default')).toBe('"desde-shell"')
  })

  it('sin .env no falla y queda el default commiteado', () => {
    // Un servidor que todavía no creó su `.env` tiene que poder compilar igual que antes.
    expect(() => cargarArchivoEnv(path.join(dir, 'no-existe.env'))).not.toThrow()
    expect(desdeEntorno(VARIABLE, 'default')).toBe('"default"')
  })

  it('una línea vacía en el .env cae al default, no apaga el valor', () => {
    // `ENABLE_GDPR=` es casi siempre una línea a medio escribir, no una decisión.
    cargarArchivoEnv(escribirEnv(`${VARIABLE}=\n`))
    expect(desdeEntorno(VARIABLE, 'default')).toBe('"default"')
  })

  it('devuelve un literal fuente válido aunque el valor traiga comillas', () => {
    // `DefinePlugin` sustituye el valor como código: una comilla suelta rompería el bundle.
    process.env[VARIABLE] = 'raro"con-comilla'
    expect(JSON.parse(desdeEntorno(VARIABLE, ''))).toBe('raro"con-comilla')
  })
})
