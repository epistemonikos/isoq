// The six parts of the legal package, in the order of the document (A to F). The keys are the
// `?tab=` of /privacy-and-terms and the keys of `parts` in src/lang/legal/*.json.
export const LEGAL_PARTS = ['terms', 'privacy', 'cookies', 'property', 'processing', 'faq']

// «Part E», «see Part D»: the documents refer to each other by letter.
export function legalPartLetter (key) {
  return 'ABCDEF'.charAt(LEGAL_PARTS.indexOf(key))
}

// Clause 1.3 of the Terms: what people accept (the Agreement: A and D, plus E where it applies)
// and what they are only told about (B and C, notices that are linked, not accepted).
export const AGREEMENT_PARTS = ['terms', 'property', 'processing']
export const NOTICE_PARTS = ['privacy', 'cookies']
