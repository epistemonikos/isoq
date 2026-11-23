import { effectiveLicense, isProjectPublic } from '@/utils/publishRules'
import { publicProjectUrl } from '@/utils/publicPreviewAccess'

// Qué dice el pie de página de los exportables, sin saber de formatos: lo dibujan el Word
// (wordFooter.js, con docx) y el PDF (printFooter.js, con @page). Una sola regla para los
// dos: Megan pidió que el PDF sea consistente con el Word (#416).

/** «CC-BY-NC-ND» → «CC BY-NC-ND», como se cita una licencia Creative Commons. */
export function licenseLabel (code) {
  return String(code).replace(/^CC-/, 'CC ')
}

/** Los textos del pie, sin docx: `{ left, right, link }` (`right` sin el número de página;
 *  `right` y `link` vacíos en un proyecto privado). */
export function footerTexts (project, t, findingNumber) {
  const name = (project && project.name) || ''
  const left = findingNumber
    ? `${name} — ${t('actionButtons.word_export.footer_finding')} ${findingNumber}`
    : name
  if (!isProjectPublic(project)) return { left, right: '', link: '' }
  const right = `${t('actionButtons.word_export.footer_license')}: ${licenseLabel(effectiveLicense(project.license_type))}`
  return { left, right, link: publicProjectUrl(project) }
}
