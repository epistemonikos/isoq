'use strict'

/**
 * De qué commit salió este build.
 *
 * Nada dentro de `dist/` lo dice hoy. Los timestamps de los archivos cuentan cuándo corrió
 * webpack, que es otra cosa: un build de hoy sobre un checkout de hace once días los deja
 * todos con la fecha de hoy. El 2026-08-31 `isoqf-test` sirvió durante días código anterior
 * al 24 de agosto con un build reciente, y sólo se detectó datando las claves i18n del
 * bundle contra el `git log` — arqueología sobre 550 KB para responder una pregunta de una
 * línea.
 *
 * Lo caro no fue la arqueología. Fue que en esos días **nadie podía notar la diferencia**:
 * quien compiló vio un build correcto, backend asumía `develop` corriendo, y desde afuera no
 * había nada que mirar. El sello convierte eso en un request.
 *
 * Es diagnóstico, no un requisito: si no hay `git` —un tarball, una imagen sin git— el sello
 * dice `unknown` y el build sigue. Que falte el dato es aceptable; que por eso no se pueda
 * desplegar, no.
 */

const { execFileSync } = require('child_process')

// `execFileSync` con un arreglo y no `execSync` con una plantilla: no hay shell, así que no
// hay metacaracteres que interpretar. Hoy los argumentos son literales y daría igual, pero
// esto es una utilidad de build y el próximo que le agregue un argumento variable —una rama,
// un tag— no debería tener que acordarse de escaparlo.
function git (args) {
  return execFileSync('git', args, { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim()
}

/**
 * El commit, con `-dirty` si el checkout tiene cambios sin commitear.
 *
 * El sufijo no es cosmético: un build con modificaciones locales no es reproducible desde su
 * SHA, y decir el SHA a secas afirmaría que sí. Esa afirmación falsa es peor que no tener el
 * dato — manda a quien esté depurando a leer un código que no es el que está corriendo.
 */
function commitId () {
  try {
    const sha = git(['rev-parse', '--short', 'HEAD'])
    // Cualquier cosa que no sea un SHA (un `fatal:` que igual salga por stdout, una salida
    // vacía) se descarta: un valor con espacios rompería el `<meta>` en silencio, y el sello
    // quedaría ilegible justo cuando hiciera falta leerlo.
    if (!/^[0-9a-f]{7,40}$/.test(sha)) return 'unknown'
    const dirty = git(['status', '--porcelain']) !== ''
    return dirty ? `${sha}-dirty` : sha
  } catch (e) {
    return 'unknown'
  }
}

/**
 * Commit y fecha de compilación, los dos aptos para un atributo HTML.
 *
 * En ISO 8601 y sin espacios a propósito: `HtmlWebpackPlugin` compila el template con
 * `removeAttributeQuotes`, así que un valor con un espacio partiría el atributo en dos.
 *
 * La fecha va además del commit porque responden preguntas distintas: el commit dice QUÉ
 * está corriendo, la fecha dice si este build es el que acabás de hacer. Con el mismo commit
 * recompilado dos veces, sólo la fecha las distingue.
 */
function buildInfo () {
  return {
    commit: commitId(),
    builtAt: new Date().toISOString()
  }
}

module.exports = { buildInfo }
