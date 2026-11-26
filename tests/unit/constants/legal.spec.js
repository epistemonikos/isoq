import { LEGAL_PARTS, AGREEMENT_PARTS, NOTICE_PARTS, legalPartLetter } from '@/constants/legal'

describe('legal parts', () => {
  it('letters follow the order of the document', () => {
    expect(LEGAL_PARTS.map(legalPartLetter).join('')).toBe('ABCDEF')
  })

  // Clause 1.3 of the Terms: the Agreement is A and D, plus E where it applies. B and C are
  // notices, linked and acknowledged but not accepted; F is informational.
  it('people accept the Agreement: Terms, Intellectual Property and Data Processing Terms', () => {
    expect(AGREEMENT_PARTS).toEqual(['terms', 'property', 'processing'])
  })

  it('the Privacy Policy and the Cookie Policy are only notices', () => {
    expect(NOTICE_PARTS).toEqual(['privacy', 'cookies'])
  })
})
