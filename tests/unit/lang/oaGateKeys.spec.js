import fs from 'fs'
import path from 'path'
import en from '@/lang/en.json'
import es from '@/lang/es.json'
import pt from '@/lang/pt.json'

/**
 * La red que impide que el aviso del gate salude con `camelot.step_four.oa_gate.blocked`.
 *
 * Escanea los literales `$t('camelot.step_four.oa_gate.…')` de los archivos que este
 * trabajo tocó y verifica que cada uno resuelva en los tres idiomas. Calcado de
 * inactivityWarningKeys.spec.
 */
const FILES = [
  'src/components/camelot/CamelotStepFourTable.vue',
  'src/components/camelot/StepFour.vue'
]

const KEY_RE = /\$t\(\s*'(camelot\.step_four\.oa_gate\.[a-z0-9_]+)'/g

function usedKeys () {
  const found = new Set()
  FILES.forEach((rel) => {
    const source = fs.readFileSync(path.resolve(rel), 'utf8')
    let m
    while ((m = KEY_RE.exec(source)) !== null) found.add(m[1])
  })
  return [...found].sort()
}

function resolve (dict, dotted) {
  return dotted.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict)
}

describe('claves del gate de la overall assessment', () => {
  const keys = usedKeys()

  // Las dos puertas tienen que hablar con la misma clave: si una empieza a usar otra,
  // la persona lee dos explicaciones distintas del mismo bloqueo.
  it('las dos puertas usan la clave del gate', () => {
    expect(keys).toEqual(['camelot.step_four.oa_gate.blocked'])
  })

  it.each([['en', en], ['es', es], ['pt', pt]])('%s traduce todas las claves usadas', (_lang, dict) => {
    const faltantes = keys.filter(k => typeof resolve(dict, k) !== 'string')
    expect(faltantes).toEqual([])
  })

  // El aviso tiene que decir qué falta, no sólo que no se puede: nombra los nueve FA.
  it.each([['en', en], ['es', es], ['pt', pt]])('%s nombra el rango FA1-FA9', (_lang, dict) => {
    expect(dict.camelot.step_four.oa_gate.blocked).toContain('FA1-FA9')
  })
})
