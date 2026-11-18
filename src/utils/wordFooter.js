import { AlignmentType, Footer, PageNumber, Paragraph, Tab, TabStopType, TextRun } from 'docx'
import { effectiveLicense, isProjectPublic } from '@/utils/publishRules'
import { contentWidth } from '@/utils/wordTableWidths'
import { FONT } from '@/utils/wordTypography'

// Pie de página de los exports Word: a la izquierda el proyecto (y en el Worksheet, el
// finding por su número: el texto puede ocupar varias líneas); a la derecha la licencia y
// «Page X of Y». Un proyecto privado no tiene licencia vigente (despublicar guarda
// `license_type: ''`): lleva el aviso de no publicado en su lugar.

const FOOTER_SIZE = 16 // 8 pt
const FOOTER_COLOR = '7F7F7F'

/** «CC-BY-NC-ND» → «CC BY-NC-ND», como se cita una licencia Creative Commons. */
export function licenseLabel (code) {
  return String(code).replace(/^CC-/, 'CC ')
}

/** Los textos del pie, sin docx: `{ left, right }` (`right` sin el número de página). */
export function footerTexts (project, t, findingNumber) {
  const name = (project && project.name) || ''
  const left = findingNumber
    ? `${name} — ${t('actionButtons.word_export.footer_finding')} ${findingNumber}`
    : name
  const right = isProjectPublic(project)
    ? `${t('actionButtons.word_export.footer_license')}: ${licenseLabel(effectiveLicense(project.license_type))}`
    : t('actionButtons.word_export.footer_unpublished')
  return { left, right }
}

/**
 * El `Footer` de docx para una sección: el tope derecho del tabulador va al ancho útil de
 * SU página, así que una sección horizontal y una vertical necesitan cada una el suyo.
 */
export function buildFooter ({ left, right }, page, t) {
  const run = (props) => new TextRun({ font: FONT, size: FOOTER_SIZE, color: FOOTER_COLOR, ...props })
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        tabStops: [{ type: TabStopType.RIGHT, position: contentWidth(page) }],
        children: [
          run({ text: left }),
          run({
            children: [
              new Tab(),
              `${right} · ${t('actionButtons.word_export.footer_page')} `,
              PageNumber.CURRENT,
              ` ${t('actionButtons.word_export.footer_of')} `,
              PageNumber.TOTAL_PAGES
            ]
          })
        ]
      })
    ]
  })
}
