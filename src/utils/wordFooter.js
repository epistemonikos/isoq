import { AlignmentType, ExternalHyperlink, Footer, PageNumber, Paragraph, Tab, TabStopType, TextRun } from 'docx'
import { contentWidth } from '@/utils/wordTableWidths'
import { FONT } from '@/utils/wordTypography'
import { footerTexts, licenseLabel } from '@/utils/exportFooter'

// Los textos son una sola regla para el Word y el PDF (#416): viven en exportFooter.
export { footerTexts, licenseLabel }

// Pie de página de los exports Word: a la izquierda el proyecto (y en el Worksheet, el
// finding por su número: el texto puede ocupar varias líneas); a la derecha la licencia y
// «Page X of Y»; debajo, el enlace a la página pública. Un proyecto privado no tiene
// licencia vigente (despublicar guarda `license_type: ''`) ni página pública: lleva sólo
// el número de página (#416: Megan pidió quitar el aviso de «no publicado»).

const FOOTER_SIZE = 16 // 8 pt
const FOOTER_COLOR = '7F7F7F'

/**
 * El `Footer` de docx para una sección: el tope derecho del tabulador va al ancho útil de
 * SU página, así que una sección horizontal y una vertical necesitan cada una el suyo.
 */
export function buildFooter ({ left, right, link }, page, t) {
  const run = (props) => new TextRun({ font: FONT, size: FOOTER_SIZE, color: FOOTER_COLOR, ...props })
  const paragraphs = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      tabStops: [{ type: TabStopType.RIGHT, position: contentWidth(page) }],
      children: [
        run({ text: left }),
        run({
          children: [
            new Tab(),
            `${right ? `${right} · ` : ''}${t('actionButtons.word_export.footer_page')} `,
            PageNumber.CURRENT,
            ` ${t('actionButtons.word_export.footer_of')} `,
            PageNumber.TOTAL_PAGES
          ]
        })
      ]
    })
  ]
  if (link) {
    paragraphs.push(new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [
        new ExternalHyperlink({
          link,
          children: [run({ text: link, style: 'Hyperlink' })]
        })
      ]
    }))
  }
  return new Footer({ children: paragraphs })
}
