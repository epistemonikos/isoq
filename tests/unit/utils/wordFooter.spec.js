import { footerTexts, licenseLabel } from '@/utils/wordFooter'

const t = k => k

describe('footerTexts', () => {
  it('public project: its license, as cited («CC BY-SA»)', () => {
    expect(footerTexts({ name: 'P', public_type: 'fully', license_type: 'CC-BY-SA' }, t))
      .toEqual({ left: 'P', right: 'actionButtons.word_export.footer_license: CC BY-SA' })
  })

  it('decides with the canonical rule (isProjectPublic), not the stored is_public', () => {
    const base = { name: 'P', license_type: 'CC-BY-SA' }
    expect(footerTexts({ ...base, public_type: 'fully', private: true, is_public: false }, t).right)
      .toContain('CC BY-SA')
    expect(footerTexts({ ...base, public_type: 'private', is_public: true }, t).right)
      .toBe('actionButtons.word_export.footer_unpublished')
  })

  it('public without a stored license: the default (effectiveLicense)', () => {
    expect(footerTexts({ name: 'P', public_type: 'partially', license_type: '' }, t).right)
      .toContain('CC BY-NC-ND')
  })

  it('with a finding number: «Project — Finding N»', () => {
    expect(footerTexts({ name: 'P', public_type: 'private' }, t, 4).left)
      .toBe('P — actionButtons.word_export.footer_finding 4')
  })

  it('licenseLabel', () => {
    expect(licenseLabel('CC-BY-NC-ND')).toBe('CC BY-NC-ND')
  })
})
