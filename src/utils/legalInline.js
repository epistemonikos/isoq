// The legal documents (src/lang/legal/*.json) carry only two inline marks: **bold** and the
// [● …] placeholders legal has not filled yet. The result goes into v-html, so the text is
// escaped first and only then gets the markup it is allowed to have.
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function legalInline (text) {
  return String(text || '')
    .replace(/[&<>"']/g, (char) => ESCAPES[char])
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[●[^\]]*\]/g, (placeholder) => `<mark class="legal-placeholder">${placeholder}</mark>`)
}
