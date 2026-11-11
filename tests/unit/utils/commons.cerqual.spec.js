
import Commons from '@/utils/commons'

describe('Commons.resolveCerqual', () => {
  const DEFAULT = { option: null, explanation: '', notes: '' }

  it('prefers the list top-level cerqual (authoritative source of truth)', () => {
    const list = {
      cerqual: { option: '2', explanation: 'top', notes: '' },
      evidence_profile: { cerqual: { option: '0', explanation: 'stale mirror' } }
    }
    expect(Commons.resolveCerqual(list)).toEqual({ option: '2', explanation: 'top', notes: '' })
  })

  it('falls back to evidence_profile.cerqual for findings without a top-level copy', () => {
    const finding = {
      evidence_profile: { cerqual: { option: '1', explanation: 'from ep', notes: 'n' } }
    }
    expect(Commons.resolveCerqual(finding)).toEqual({ option: '1', explanation: 'from ep', notes: 'n' })
  })

  it('returns a safe default when a list has no cerqual anywhere (the malformed granular-update shape)', () => {
    // Real-world regression: evidence_profile mirror written without a cerqual section
    const list = {
      evidence_profile: {
        methodological_limitations: { option: '1', explanation: 'x' },
        coherence: { option: '1', explanation: 'x' },
        adequacy: { option: '1', explanation: 'x' },
        relevance: { option: '0', explanation: '' }
      }
    }
    expect(Commons.resolveCerqual(list)).toEqual(DEFAULT)
  })

  it('returns a safe default for null / undefined items', () => {
    expect(Commons.resolveCerqual(null)).toEqual(DEFAULT)
    expect(Commons.resolveCerqual(undefined)).toEqual(DEFAULT)
  })

  it('never throws when reading .option/.explanation off the result', () => {
    const bare = {}
    expect(() => Commons.resolveCerqual(bare).option).not.toThrow()
    expect(Commons.resolveCerqual(bare).option).toBeNull()
  })
})

describe('Commons.normalizeEvidenceProfile', () => {
  const SECTIONS = ['methodological_limitations', 'coherence', 'adequacy', 'relevance', 'cerqual']

  it('fills every missing section with a safe default (partial granular-update shape)', () => {
    // Real regression: a freshly-created finding saved only one section granularly.
    const list = {
      cerqual: { option: null, explanation: '' },
      evidence_profile: {
        methodological_limitations: { option: '1', explanation: 'done', notes: '' },
        coherence: { option: '0', explanation: '', notes: '' }
      }
    }
    Commons.normalizeEvidenceProfile(list)
    for (const s of SECTIONS) {
      expect(list.evidence_profile[s]).toBeDefined()
      expect(() => list.evidence_profile[s].notes).not.toThrow()
    }
    // untouched sections keep their real data
    expect(list.evidence_profile.methodological_limitations.option).toBe('1')
    // missing sections get the empty default
    expect(list.evidence_profile.adequacy).toEqual({ option: null, explanation: '', notes: '' })
  })

  it('mirrors the authoritative top-level cerqual into evidence_profile.cerqual', () => {
    const list = {
      cerqual: { option: '2', explanation: 'top', notes: 'n' },
      evidence_profile: { methodological_limitations: { option: '1', explanation: '', notes: '' } }
    }
    Commons.normalizeEvidenceProfile(list)
    expect(list.evidence_profile.cerqual).toEqual({ option: '2', explanation: 'top', notes: 'n' })
  })

  it('leaves a list without evidence_profile untouched', () => {
    const list = { name: 'no ep' }
    expect(() => Commons.normalizeEvidenceProfile(list)).not.toThrow()
    expect(list.evidence_profile).toBeUndefined()
  })

  it('does not throw on null/undefined', () => {
    expect(() => Commons.normalizeEvidenceProfile(null)).not.toThrow()
    expect(() => Commons.normalizeEvidenceProfile(undefined)).not.toThrow()
  })
})
