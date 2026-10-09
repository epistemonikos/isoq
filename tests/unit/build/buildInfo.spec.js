// De qué commit salió el build que está sirviendo un host.
//
// Hoy no hay forma de saberlo. `dist/` sólo dice cuándo corrió webpack: un build de hoy
// sobre un checkout de hace once días produce timestamps de hoy en todos los archivos.
// Pasó exactamente eso con `isoqf-test` el 2026-08-31, y sólo se detectó datando las claves
// i18n del bundle contra el `git log` — arqueología de 550 KB para responder una pregunta de
// una línea.
//
// Lo caro no fue la arqueología: fue que durante ocho días nadie podía notar la diferencia.
// Ni quien compiló (vio un build correcto), ni backend (asumía `develop` corriendo), ni
// nosotros mirando desde afuera.

const path = require('path')

const buildInfoPath = path.resolve(__dirname, '../../../build/buildInfo.js')

describe('buildInfo', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('devuelve el commit corto del checkout', () => {
    jest.doMock('child_process', () => ({
      execFileSync: jest.fn((_bin, args) =>
        Buffer.from(args.includes('status') ? '\n' : '59e20a6a\n'))
    }))
    const { buildInfo } = require(buildInfoPath)
    expect(buildInfo().commit).toBe('59e20a6a')
  })

  it('no cuenta los archivos sin trackear como suciedad', () => {
    // `git status --porcelain` los incluye por defecto, y eso arruina el indicador: un
    // apunte, un log, un script de al lado alcanzan para encenderlo. Medido el 2026-09-01
    // en el host del backend, que informaba `-dirty` con el checkout intacto y sólo
    // archivos ajenos a la plataforma sin trackear. Un indicador que nunca se apaga deja de
    // informar, y éste ya estaba en ese estado sin que nos diéramos cuenta.
    //
    // El falso negativo que esto abre —un archivo sin trackear que el build sí importe—
    // exige que la línea del `import` esté trackeada y sin cambios, o sea que ya existiera:
    // es rebuscado. El falso positivo es cotidiano.
    let argsDeStatus = null;
    jest.doMock('child_process', () => ({
      execFileSync: jest.fn((_bin, args) => {
        if (args.includes('status')) { argsDeStatus = args; return Buffer.from('\n'); }
        return Buffer.from('59e20a6a\n');
      })
    }));
    const { buildInfo } = require(buildInfoPath)
    expect(buildInfo().commit).toBe('59e20a6a')
    expect(argsDeStatus).toContain('--untracked-files=no')
  })

  it('marca el checkout sucio, porque entonces el commit no describe lo compilado', () => {
    // Un build con cambios sin commitear no es reproducible desde su SHA. Decir el SHA a
    // secas afirmaría que sí, y esa afirmación falsa es peor que no tener el dato: manda a
    // quien depure a leer un código que no es el que corre.
    jest.doMock('child_process', () => ({
      execFileSync: jest.fn((_bin, args) =>
        Buffer.from(args.includes('status') ? ' M src/app.vue\n' : '59e20a6a\n'))
    }))
    const { buildInfo } = require(buildInfoPath)
    expect(buildInfo().commit).toBe('59e20a6a-dirty')
  })

  it('el checkout limpio no lleva sufijo', () => {
    jest.doMock('child_process', () => ({
      execFileSync: jest.fn((_bin, args) => Buffer.from(args.includes('status') ? '\n' : '59e20a6a\n'))
    }))
    const { buildInfo } = require(buildInfoPath)
    expect(buildInfo().commit).toBe('59e20a6a')
  })

  it('no rompe el build cuando no hay git', () => {
    // Compilar desde un tarball, o en una imagen sin git, es legítimo. Que el sello falte es
    // aceptable; que por eso no se pueda desplegar, no. El sello es diagnóstico, no un
    // requisito.
    jest.doMock('child_process', () => ({
      execFileSync: jest.fn(() => { throw new Error('git: command not found') })
    }))
    const { buildInfo } = require(buildInfoPath)
    expect(buildInfo().commit).toBe('unknown')
  })

  it('sella la fecha en ISO sin espacios', () => {
    // `removeAttributeQuotes` de HtmlWebpackPlugin saca las comillas del atributo, así que un
    // valor con espacios partiría el HTML. ISO 8601 no tiene ninguno.
    jest.doMock('child_process', () => ({
      execFileSync: jest.fn(() => Buffer.from('59e20a6a\n'))
    }))
    const { buildInfo } = require(buildInfoPath)
    const { builtAt } = buildInfo()
    expect(builtAt).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/)
    expect(builtAt).not.toContain(' ')
  })

  it('el commit tampoco lleva espacios', () => {
    // Mismo motivo, y acá el riesgo es real: si `git` devuelve algo inesperado, un valor con
    // espacios rompería el `<meta>` en silencio y el sello quedaría ilegible justo cuando
    // hiciera falta.
    jest.doMock('child_process', () => ({
      execFileSync: jest.fn(() => Buffer.from('fatal: not a git repository\n'))
    }))
    const { buildInfo } = require(buildInfoPath)
    expect(buildInfo().commit).not.toContain(' ')
  })
})
