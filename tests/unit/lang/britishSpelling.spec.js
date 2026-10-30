import en from '@/lang/en.json'
import legalEn from '@/lang/legal/en.json'

// iSoQ writes British English (#374): organisation, prioritisation, anonymised, colour.
const AMERICAN = /\b\w*(?:iz(?:e|es|ed|ing|ation|ations)|yz(?:e|es|ed|ing))\b|\b(?:colors?|behaviors?|behavioral|centers?|favorites?)\b/gi
// -ize words that are spelt the same in British English, or are not spelling at all.
const NOT_AMERICAN = /^(?:size|sizes|sized|resize|resized|resizing|seize|seized|prize|prizes|citizen|citizens)$/i

// Text iSoQ does not author. Each entry says why it keeps its spelling.
const EXEMPT = [
  // A placeholder web address, not a word.
  'account.website_placeholder',
  // CAMELOT guidance: methods content written by the CAMELOT authors, with quotes from published
  // studies and proper names ("Center for ..."). Changing its spelling is their decision.
  'camelot.'
]

function americanSpellings (messages) {
  const found = []
  const walk = (node, path) => {
    Object.entries(node).forEach(([key, value]) => {
      const full = path ? `${path}.${key}` : key
      if (value && typeof value === 'object') return walk(value, full)
      if (EXEMPT.some(prefix => full === prefix || (prefix.endsWith('.') && full.startsWith(prefix)))) return
      const words = (String(value).match(AMERICAN) || []).filter(word => !NOT_AMERICAN.test(word))
      if (words.length) found.push(`${full}: ${words.join(', ')}`)
    })
  }
  walk(messages, '')
  return found
}

describe('British spelling in English texts', () => {
  it('the interface texts use British spelling', () => {
    expect(americanSpellings(en)).toEqual([])
  })

  it('the legal documents use British spelling', () => {
    expect(americanSpellings(legalEn)).toEqual([])
  })

  it('catches the American forms it is meant to catch', () => {
    // Guards the guard: a regex that matches nothing would pass the two tests above forever.
    expect(americanSpellings({ a: 'Organization', b: 'anonymized data', c: 'two colors', d: 'resize it' }))
      .toEqual(['a: Organization', 'b: anonymized', 'c: colors'])
  })
})
