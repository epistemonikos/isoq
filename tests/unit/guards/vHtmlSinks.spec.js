import { scan, scanCode } from './vHtmlScanner'
import ALLOWED from './vHtmlAllowlist'

/**
 * Guard for `v-html` (after the finding-name XSS, 2026-10-30).
 *
 * The "remove finding" modal rendered a collaborator's finding name as HTML through
 * `v-html="$t(...)"`: vue-i18n 8 does not escape parameters. A new `v-html` only passes if it
 * is in vHtmlAllowlist.js with the reason why no user text can reach it.
 */
describe('guard: every v-html is reviewed', () => {
  const found = scan()
  const foundKeys = found.map(f => f.key)

  it('every v-html is in the allowlist, with its reason', () => {
    const unknown = found.filter(f => !Object.prototype.hasOwnProperty.call(ALLOWED, f.key))
    const detail = unknown.map(f => `  ${f.key} (line ${f.line})`).join('\n')
    expect({
      unknown: unknown.length,
      help: unknown.length
        ? 'This v-html is not reviewed. If any part of it can come from a user, render it with {{ }} or <i18n> component interpolation; if it cannot, add it to tests/unit/guards/vHtmlAllowlist.js with the reason:\n' + detail
        : ''
    }).toEqual({ unknown: 0, help: '' })
  })

  // An entry that matches nothing protects nothing: it only waits for a new sink with the
  // same text to slip through unreviewed.
  it('the allowlist has no dead entries', () => {
    expect(Object.keys(ALLOWED).filter(key => !foundKeys.includes(key))).toEqual([])
  })

  it('every entry says why', () => {
    for (const [key, reason] of Object.entries(ALLOWED)) {
      expect({ key, long: typeof reason === 'string' && reason.trim().length > 20 }).toEqual({ key, long: true })
    }
  })

  it('the finding-name sink is gone and cannot come back through the allowlist', () => {
    const confirmRemove = k => k.includes('soqf_table.confirm_remove')
    expect(foundKeys.filter(confirmRemove)).toEqual([])
    expect(Object.keys(ALLOWED).filter(confirmRemove)).toEqual([])
  })
})

// The rule, pinned with examples: without this a scanner change could go blind and the
// guard would stay green while looking at nothing.
describe('guard: the v-html scanner', () => {
  const keysOf = code => scanCode(code, 'x.vue').map(f => f.key)

  it('finds double- and single-quoted sinks', () => {
    expect(keysOf('<p v-html="a"></p><p v-html=\'b\'></p>')).toEqual(['x.vue::a', 'x.vue::b'])
  })

  it('finds the original finding-name sink', () => {
    const code = '<span v-html="$t(\'soqf_table.confirm_remove\', { name: this.editFindingName.name })"></span>'
    expect(keysOf(code)).toEqual(['x.vue::$t(\'soqf_table.confirm_remove\', { name: this.editFindingName.name })'])
  })

  it('numbers a repeated expression, so a copy of an allowed sink is a new sink', () => {
    expect(keysOf('<p v-html="a"></p><p v-html="a"></p>')).toEqual(['x.vue::a', 'x.vue::a#2'])
  })

  it('ignores {{ }} and v-text', () => {
    expect(keysOf('<p>{{ a }}</p><p v-text="b"></p>')).toEqual([])
  })

  it('sees every .vue under src', () => {
    expect(scan().length).toBeGreaterThan(20)
  })
})
