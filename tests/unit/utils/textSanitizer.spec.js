import { TextSanitizer, sanitizeText, sanitizeWithLimit, safeText, extractTextFromPath, TEXT_LIMITS } from '@/utils/textSanitizer'

describe('TextSanitizer', () => {
  let sanitizer

  beforeEach(() => {
    sanitizer = new TextSanitizer()
  })

  describe('Constructor and Options', () => {
    it('should create instance with default options', () => {
      expect(sanitizer.options.preserveEmojis).toBe(true)
      expect(sanitizer.options.stripHtml).toBe(true)
      expect(sanitizer.options.normalizeWhitespace).toBe(true)
    })

    it('should accept custom options', () => {
      const customSanitizer = new TextSanitizer({ preserveEmojis: false })
      expect(customSanitizer.options.preserveEmojis).toBe(false)
    })
  })

  describe('Emoji Handling', () => {
    it('should preserve emojis by default', () => {
      const input = 'Proyecto 🚀 de investigación'
      const output = sanitizer.sanitize(input)
      expect(output).toContain('🚀')
      expect(output).toBe('Proyecto 🚀 de investigación')
    })

    it('should remove emojis when preserveEmojis is false', () => {
      const input = 'Proyecto 🚀 de investigación 😀'
      const output = sanitizer.sanitize(input, { preserveEmojis: false })
      expect(output).not.toContain('🚀')
      expect(output).not.toContain('😀')
      expect(output).toBe('Proyecto de investigación')
    })

    it('should handle multiple emoji types', () => {
      const input = 'Test 🚀 ❤️ 🎉 ✅ text'
      const output = sanitizer.sanitize(input, { preserveEmojis: false })
      expect(output).toBe('Test text')
    })
  })

  describe('HTML Tag Stripping', () => {
    it('should strip HTML tags', () => {
      const input = '<b>Bold</b> and <i>italic</i> text'
      const output = sanitizer.sanitize(input)
      expect(output).toBe('Bold and italic text')
    })

    it('should handle nested HTML tags', () => {
      const input = '<div><p><b>Nested</b> content</p></div>'
      const output = sanitizer.sanitize(input)
      expect(output).toBe('Nested content')
    })

    it('should handle malformed HTML', () => {
      const input = '<b>Unclosed tag'
      const output = sanitizer.sanitize(input)
      expect(output).toBe('Unclosed tag')
    })

    it('should decode HTML entities', () => {
      const input = 'Text &amp; more &lt;text&gt; &quot;quoted&quot;'
      const output = sanitizer.sanitize(input)
      expect(output).toBe('Text & more <text> "quoted"')
    })

    it('should handle &nbsp; entities', () => {
      const input = 'Text&nbsp;with&nbsp;spaces'
      const output = sanitizer.sanitize(input)
      expect(output).toBe('Text with spaces')
    })
  })

  describe('Markdown Stripping', () => {
    it('should strip markdown when enabled', () => {
      const input = '**Bold** and *italic* text'
      const output = sanitizer.sanitize(input, { stripMarkdown: true })
      expect(output).toBe('Bold and italic text')
    })

    it('should handle markdown links', () => {
      const input = 'Check [this link](https://example.com) out'
      const output = sanitizer.sanitize(input, { stripMarkdown: true })
      expect(output).toBe('Check this link out')
    })

    it('should handle markdown code blocks', () => {
      const input = 'Use `code` here'
      const output = sanitizer.sanitize(input, { stripMarkdown: true })
      expect(output).toBe('Use code here')
    })

    it('should handle markdown headings', () => {
      const input = '# Heading\nContent'
      const output = sanitizer.sanitize(input, { stripMarkdown: true })
      expect(output).toBe('Heading\nContent')
    })
  })

  describe('Whitespace Normalization', () => {
    it('should normalize multiple spaces', () => {
      const input = 'Text    with    multiple    spaces'
      const output = sanitizer.sanitize(input)
      expect(output).toBe('Text with multiple spaces')
    })

    it('should convert tabs to spaces', () => {
      const input = 'Text\t\twith\ttabs'
      const output = sanitizer.sanitize(input)
      expect(output).toBe('Text with tabs')
    })

    it('should limit consecutive newlines', () => {
      const input = 'Line1\n\n\n\n\nLine2'
      const output = sanitizer.sanitize(input)
      expect(output).toBe('Line1\n\nLine2')
    })

    it('should respect maxConsecutiveNewlines option', () => {
      const input = 'Line1\n\n\n\n\nLine2'
      const output = sanitizer.sanitize(input, { maxConsecutiveNewlines: 1 })
      expect(output).toBe('Line1\nLine2')
    })

    it('should trim each line when preserving newlines', () => {
      const input = '  Line1  \n  Line2  '
      const output = sanitizer.sanitize(input)
      expect(output).toBe('Line1\nLine2')
    })

    it('should convert newlines to spaces when not preserving them', () => {
      const input = 'Line1\nLine2\nLine3'
      const output = sanitizer.sanitize(input, { preserveNewlines: false })
      expect(output).toBe('Line1 Line2 Line3')
    })
  })

  describe('Invisible Characters', () => {
    it('should remove zero-width spaces', () => {
      const input = 'Text\u200Bwith\u200Binvisible'
      const output = sanitizer.sanitize(input)
      expect(output).toBe('Textwithinvisible')
    })

    it('should remove BOM (Byte Order Mark)', () => {
      const input = '\uFEFFText with BOM'
      const output = sanitizer.sanitize(input)
      expect(output).toBe('Text with BOM')
    })

    it('should remove soft hyphens', () => {
      const input = 'Text\u00ADwith\u00ADhyphens'
      const output = sanitizer.sanitize(input)
      expect(output).toBe('Textwithhyphens')
    })

    it('should remove zero-width joiners and non-joiners', () => {
      const input = 'Text\u200C\u200Dwith\u200Czwj'
      const output = sanitizer.sanitize(input)
      expect(output).toBe('Textwithzwj')
    })
  })

  describe('Control Characters', () => {
    it('should remove control characters', () => {
      const input = 'Text\x00with\x01control\x02chars'
      const output = sanitizer.sanitize(input)
      expect(output).toBe('Textwithcontrolchars')
    })

    it('should preserve newlines and tabs', () => {
      const input = 'Text\nwith\nnewlines'
      const output = sanitizer.sanitize(input)
      expect(output).toContain('\n')
    })
  })

  describe('XML Character Escaping', () => {
    it('should escape XML characters when enabled', () => {
      const input = 'Text with & "quotes"'
      const output = sanitizer.sanitize(input, { escapeXml: true })
      expect(output).toContain('&amp;')
      expect(output).toContain('&quot;')
    })

    it('should not escape XML by default', () => {
      const input = 'Text with <tags> & "quotes"'
      const output = sanitizer.sanitize(input)
      // Should have stripped tags and normalized whitespace
      expect(output).toBe('Text with & "quotes"')
    })
  })

  describe('Text Truncation', () => {
    it('should truncate long text', () => {
      const input = 'A'.repeat(1000)
      const output = sanitizer.truncate(input, 100)
      expect(output.length).toBeLessThanOrEqual(103) // 100 + '...'
      expect(output).toMatch(/\.\.\.$/)
    })

    it('should truncate at word boundary', () => {
      const input = 'This is a very long sentence that needs truncation'
      const output = sanitizer.truncate(input, 20)
      expect(output).toBe('This is a very long...')
    })

    it('should handle text shorter than maxLength', () => {
      const input = 'Short text'
      const output = sanitizer.truncate(input, 100)
      expect(output).toBe('Short text')
    })

    it('should use custom suffix', () => {
      const input = 'A'.repeat(100)
      const output = sanitizer.truncate(input, 50, ' [...]')
      expect(output).toMatch(/\[\.\.\.\]$/)
    })
  })

  describe('sanitizeWithLimit', () => {
    it('should sanitize and truncate', () => {
      const input = '<b>Very long text</b> ' + 'A'.repeat(1000)
      const output = sanitizer.sanitizeWithLimit(input, 50)
      expect(output.length).toBeLessThanOrEqual(53)
      expect(output).not.toContain('<b>')
    })
  })

  describe('Static Helper Methods', () => {
    describe('safeText', () => {
      it('should handle null', () => {
        expect(TextSanitizer.safeText(null)).toBe('')
      })

      it('should handle undefined', () => {
        expect(TextSanitizer.safeText(undefined)).toBe('')
      })

      it('should handle empty string', () => {
        expect(TextSanitizer.safeText('')).toBe('')
      })

      it('should handle numbers', () => {
        expect(TextSanitizer.safeText(123)).toBe('123')
      })

      it('should handle booleans', () => {
        expect(TextSanitizer.safeText(true)).toBe('Yes')
        expect(TextSanitizer.safeText(false)).toBe('No')
      })

      it('should handle arrays', () => {
        expect(TextSanitizer.safeText(['a', 'b', 'c'])).toBe('a, b, c')
      })

      it('should use default value', () => {
        expect(TextSanitizer.safeText(null, 'N/A')).toBe('N/A')
      })
    })

    describe('extractTextFromPath', () => {
      it('should extract nested property', () => {
        const obj = {
          evidence_profile: {
            coherence: {
              explanation: 'Test explanation'
            }
          }
        }
        const result = TextSanitizer.extractTextFromPath(obj, 'evidence_profile.coherence.explanation')
        expect(result).toBe('Test explanation')
      })

      it('should return default for missing path', () => {
        const obj = { foo: 'bar' }
        const result = TextSanitizer.extractTextFromPath(obj, 'missing.path', 'default')
        expect(result).toBe('default')
      })

      it('should handle null object', () => {
        const result = TextSanitizer.extractTextFromPath(null, 'any.path', 'default')
        expect(result).toBe('default')
      })
    })
  })

  describe('Helper Functions', () => {
    it('sanitizeText should work', () => {
      const result = sanitizeText('<b>Test</b>')
      expect(result).toBe('Test')
    })

    it('sanitizeWithLimit should work', () => {
      const result = sanitizeWithLimit('<b>Test</b> ' + 'A'.repeat(100), 20)
      expect(result.length).toBeLessThanOrEqual(23)
    })

    it('safeText should work', () => {
      expect(safeText(null)).toBe('')
      expect(safeText(123)).toBe('123')
    })

    it('extractTextFromPath should work', () => {
      const obj = { a: { b: 'value' } }
      expect(extractTextFromPath(obj, 'a.b')).toBe('value')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      expect(sanitizer.sanitize('')).toBe('')
    })

    it('should handle whitespace-only string', () => {
      expect(sanitizer.sanitize('   \n\n   ')).toBe('')
    })

    it('should handle mixed content', () => {
      const input = '<b>Bold</b> 🚀 with **markdown** and\n\nmultiple\n\n\nnewlines'
      const output = sanitizer.sanitize(input, { stripMarkdown: true })
      expect(output).not.toContain('<b>')
      expect(output).not.toContain('**')
      expect(output).toContain('🚀')
    })

    it('should handle very long text', () => {
      const input = 'A'.repeat(100000)
      const output = sanitizer.sanitize(input)
      expect(output.length).toBe(100000)
    })

    it('should handle special Unicode characters', () => {
      const input = 'Text with 中文 and العربية'
      const output = sanitizer.sanitize(input)
      expect(output).toBe('Text with 中文 and العربية')
    })
  })

  describe('TEXT_LIMITS constant', () => {
    it('should export text limits', () => {
      expect(TEXT_LIMITS.projectName).toBe(200)
      expect(TEXT_LIMITS.findingExplanation).toBe(5000)
      expect(TEXT_LIMITS.cerqualExplanation).toBe(5000)
    })
  })

  describe('Real-world Scenarios', () => {
    it('should handle project name with emojis and HTML', () => {
      const input = '<h1>My Project 🚀</h1> - <b>Research</b>'
      const output = sanitizer.sanitizeWithLimit(input, TEXT_LIMITS.projectName)
      expect(output).toBe('My Project 🚀 - Research')
    })

    it('should handle finding explanation with multiple issues', () => {
      const input = `
        <p>This is a **very important** finding 😊</p>
        
        
        
        <p>With multiple    spaces and\t\ttabs</p>
        <script>alert('xss')</script>
      `
      const output = sanitizer.sanitize(input)
      expect(output).not.toContain('<p>')
      expect(output).not.toContain('<script>')
      expect(output).toContain('😊')
      expect(output).not.toMatch(/ {2,}/)
    })

    it('should handle reference content with special characters', () => {
      const input = 'Author, J. (2023). "Title with <special> & characters". Journal.'
      const output = sanitizer.sanitizeWithLimit(input, TEXT_LIMITS.referenceContent)
      expect(output).toBe('Author, J. (2023). "Title with & characters". Journal.')
    })
  })
})
