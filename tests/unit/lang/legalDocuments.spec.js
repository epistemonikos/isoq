import en from '@/lang/legal/en.json'
import es from '@/lang/legal/es.json'
import pt from '@/lang/legal/pt.json'
import { LEGAL_PARTS } from '@/constants/legal'
import { TERMS_VERSION } from '@/constants/terms'
import { loadLegalDocuments } from '@/utils/legalDocuments'

/**
 * The legal package (Google Doc «iSoQ — Legal Terms Package») is published as six parts, A to F.
 * Legal numbers its drafts (v4.0, v4.1); users see the first published version, 1.0.
 */
const LOCALES = [['en', en], ['es', es], ['pt', pt]]

function strings (node, out = []) {
  if (typeof node === 'string') out.push(node)
  else if (Array.isArray(node)) node.forEach(child => strings(child, out))
  else if (node && typeof node === 'object') Object.values(node).forEach(child => strings(child, out))
  return out
}

// Same shape as English: block types, list lengths and table sizes. A translation that drops a
// clause or merges two paragraphs changes the shape.
function shape (part) {
  return {
    hasMeta: typeof part.meta === 'string',
    blocks: (part.blocks || []).map(block => [
      block.type,
      (block.items || []).length,
      (block.head || []).length,
      (block.rows || []).map(row => row.length).join(',')
    ].join(':')),
    items: (part.items || []).length
  }
}

describe('legal parts', () => {
  it('are A to F, in the order of the document', () => {
    expect(LEGAL_PARTS).toEqual(['terms', 'privacy', 'cookies', 'property', 'processing', 'faq'])
  })

  it('the FAQ keeps its 25 questions', () => {
    expect(en.parts.faq.items).toHaveLength(25)
  })

  it('the version users accept is the one the client sends as terms_version', () => {
    expect(en.parts.terms.meta).toMatch(new RegExp(`^Version ${TERMS_VERSION}\\.0 `))
  })
})

describe.each(LOCALES)('legal documents in %s', (_, doc) => {
  it('have the six parts, in order', () => {
    expect(Object.keys(doc.parts)).toEqual(LEGAL_PARTS)
  })

  it.each(LEGAL_PARTS)('%s has the same shape as the English text', (key) => {
    expect(shape(doc.parts[key])).toEqual(shape(en.parts[key]))
  })

  it.each(LEGAL_PARTS)('%s has a heading', (key) => {
    expect(doc.parts[key].heading.trim()).not.toBe('')
  })

  it('show version 1.0, never the draft numbers', () => {
    LEGAL_PARTS.filter(key => doc.parts[key].meta).forEach(key => {
      expect(doc.parts[key].meta).toMatch(/\b1\.0\b/)
    })
    // «CC BY-NC-ND 4.0» is a licence, not a version: look only at version wording.
    expect(strings(doc).join('\n')).not.toMatch(/\b(Version|Versión|Versão|v)\s?4\.\d/i)
  })

  it('carry no placeholder text', () => {
    expect(strings(doc).join('\n')).not.toMatch(/lorem ipsum/i)
  })

  it('have every ** paired', () => {
    strings(doc).forEach(text => {
      expect((text.match(/\*\*/g) || []).length % 2).toBe(0)
    })
  })

  it('have no empty text', () => {
    strings(doc).forEach(text => expect(text.trim()).not.toBe(''))
  })

  // Legal still has to fill these in (EEA and UK representatives, newsletter provider). When
  // they do, this list shrinks; publishing to master with any left is a deploy checklist item.
  it('keep exactly the placeholders legal has not filled yet', () => {
    const count = key => strings(doc.parts[key]).join('\n').split('[●').length - 1
    expect(LEGAL_PARTS.map(key => [key, count(key)]).filter(([, n]) => n))
      .toEqual([['terms', 1], ['privacy', 4]])
  })
})

describe('loadLegalDocuments', () => {
  it.each(LOCALES)('loads %s', async (locale, doc) => {
    expect(await loadLegalDocuments(locale)).toEqual(doc)
  })

  it('falls back to English for a language without a translation', async () => {
    expect(await loadLegalDocuments('fr')).toEqual(en)
  })
})
