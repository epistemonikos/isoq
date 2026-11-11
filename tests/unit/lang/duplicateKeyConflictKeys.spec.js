import fs from 'fs'
import path from 'path'
import en from '@/lang/en.json'
import es from '@/lang/es.json'
import pt from '@/lang/pt.json'

/**
 * La red que impide que el aviso del nombre duplicado salude con
 * `offline.duplicateKeyConflict`.
 *
 * Escanea los literales del componente y verifica que cada uno resuelva en los tres
 * idiomas. Mismo patrón que `versionConflictKeys.spec` e `inactivityWarningKeys.spec`.
 */
const KEY_RE = /\$t\(\s*'(offline\.duplicateKey[A-Za-z]+)'/g

const FILES = ['src/components/OfflineIndicator.vue']

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

describe('claves del aviso de nombre duplicado', () => {
  const keys = usedKeys()

  it('el aviso usa las tres que necesita', () => {
    expect(keys).toEqual([
      'offline.duplicateKeyConflict',
      'offline.duplicateKeyConflictNoName',
      'offline.duplicateKeyConflictTitle'
    ])
  })

  it.each([['en', en], ['es', es], ['pt', pt]])('resuelven todas en %s', (_lang, dict) => {
    const missing = keys.filter((key) => typeof resolve(dict, key) !== 'string')
    expect(missing).toEqual([])
  })

  // El `{name}` es el dato que hace útil el aviso: sin él la persona no sabe cuál de sus
  // cambios se cayó. Una traducción que se lo coma deja el mensaje correcto y vacío.
  it.each([['en', en], ['es', es], ['pt', pt]])('el texto de %s interpola el nombre', (_lang, dict) => {
    expect(resolve(dict, 'offline.duplicateKeyConflict')).toContain('{name}')
  })

  // El texto no puede prometer un reintento: la operación se descartó de la cola porque
  // el payload lleva justamente el nombre que choca. Tiene que decir qué hacer en su
  // lugar, y para eso necesita más que un «hubo un conflicto».
  it.each([['en', en], ['es', es], ['pt', pt]])('el texto de %s explica, no sólo avisa', (_lang, dict) => {
    expect(resolve(dict, 'offline.duplicateKeyConflict').length).toBeGreaterThan(60)
    expect(resolve(dict, 'offline.duplicateKeyConflictNoName').length).toBeGreaterThan(60)
  })
})
