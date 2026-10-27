import { legalInline } from '@/utils/legalInline'

describe('legalInline', () => {
  it('turns **text** into <strong>', () => {
    expect(legalInline('**1.1 Provider.** The Platform')).toBe('<strong>1.1 Provider.</strong> The Platform')
  })

  it('handles several bold spans in one sentence', () => {
    expect(legalInline('the "**Platform**" and "**we**"'))
      .toBe('the &quot;<strong>Platform</strong>&quot; and &quot;<strong>we</strong>&quot;')
  })

  it('escapes HTML before adding any markup', () => {
    // The text ends up in v-html: nothing in it may become a tag.
    expect(legalInline('<script>alert(1)</script> & <b>x</b>'))
      .toBe('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &lt;b&gt;x&lt;/b&gt;')
  })

  it('escapes quotes and apostrophes', () => {
    expect(legalInline('Users\' "data"')).toBe('Users&#39; &quot;data&quot;')
  })

  it('marks the placeholders legal has not filled yet', () => {
    expect(legalInline('in the EEA, [● name, address, email];'))
      .toBe('in the EEA, <mark class="legal-placeholder">[● name, address, email]</mark>;')
  })

  it('leaves an unpaired ** as text', () => {
    expect(legalInline('a ** b')).toBe('a ** b')
  })

  it('returns an empty string for missing text', () => {
    expect(legalInline(undefined)).toBe('')
  })
})
