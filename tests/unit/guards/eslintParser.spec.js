import path from 'path'
import { ESLint } from 'eslint'

/**
 * The lint parser understands the code we write (2026-10-21).
 *
 * babel-eslint 8.2.1 under ESLint 7 reported the variable of every for…of loop as unused:
 * about 140 of the ~190 lint errors in src were that, and they buried the real ones. Its
 * successor, @babel/eslint-parser, reads the project's .babelrc, so class properties parse.
 */
const root = path.resolve(__dirname, '../../..')
const lint = async (code, file = 'src/__eslint_guard__.js') => {
  const [result] = await new ESLint({ cwd: root }).lintText(code, { filePath: path.join(root, file) })
  return result.messages
}

describe('guard: the lint parser', () => {
  it('sees the variable of a for…of loop as used', async () => {
    const code = 'export function f (xs) {\n  let total = 0\n  for (const x of xs) {\n    total += x.n\n  }\n  return total\n}\n'
    expect(await lint(code)).toEqual([])
  })

  it('parses class properties, as Babel compiles them', async () => {
    const code = 'export default class A {\n  static base = 1\n  value = 2\n}\n'
    expect(await lint(code)).toEqual([])
  })

  it('does the same inside a .vue file', async () => {
    const code = '<template>\n  <div></div>\n</template>\n\n<script>\nexport default {\n  methods: {\n    f (xs) {\n      for (const x of xs) {\n        if (x.ok) return x\n      }\n    }\n  }\n}\n</script>\n'
    expect(await lint(code, 'src/__eslint_guard__.vue')).toEqual([])
  })

  it('still reports a variable that really is unused', async () => {
    const code = 'export function f () {\n  const unused = 1\n}\n'
    expect((await lint(code)).map(m => m.ruleId)).toEqual(['no-unused-vars'])
  })
})
