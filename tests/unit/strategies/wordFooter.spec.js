import { Packer } from 'docx'
import JSZip from 'jszip'
import {
  IsoQExportStrategy,
  CamelotExportStrategy,
  WorksheetExportStrategy
} from '@/strategies/exportStrategies'

// Pie de página de los Word: a la izquierda el proyecto (y en el Worksheet, «Finding N»);
// a la derecha la licencia —o «Unpublished — not for distribution» si el proyecto es
// privado— y «Page X of Y». En TODAS las secciones (verticales y horizontales), y la
// licencia ya no va como párrafo suelto en el cuerpo.
jest.mock('@/plugins/i18n', () => ({ i18n: { locale: 'en', t: k => k } }))

const concern = { option: 1, explanation: 'x' }
const ep = {
  id: 'f1', name: 'A finding', displayNumber: 3, references: ['r1'],
  methodological_limitations: concern, coherence: concern, adequacy: concern, relevance: concern, cerqual: concern
}
const references = [{ id: 'r1', authors: ['Smith J'], publication_year: '2020' }]
const PUBLIC = { name: 'My review', public_type: 'fully', license_type: 'CC-BY-SA' }
const PRIVATE = { name: 'My review', public_type: 'private', license_type: '' }

async function parts (doc) {
  const zip = await JSZip.loadAsync(await Packer.toBuffer(doc))
  const document = await zip.file('word/document.xml').async('string')
  const rels = await zip.file('word/_rels/document.xml.rels').async('string')
  const footers = {}
  for (const name of Object.keys(zip.files).filter(n => /^word\/footer\d+\.xml$/.test(n))) {
    footers[name.replace('word/', '')] = await zip.file(name).async('string')
  }
  // Pie de cada sección, siguiendo sectPr → footerReference → rels → footerN.xml
  const sections = (document.match(/<w:sectPr.*?<\/w:sectPr>/gs) || []).map(sect => {
    const ref = sect.match(/<w:footerReference [^>]*w:type="default"[^>]*>/)
    if (!ref) return null
    const rid = ref[0].match(/r:id="([^"]+)"/)[1]
    const target = rels.match(new RegExp(`Id="${rid}"[^>]*Target="([^"]+)"`))[1]
    return footers[target]
  })
  return { document, sections }
}

const text = (xml) => (xml.match(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g) || [])
  .map(t => t.replace(/<[^>]+>/g, '')).join('')

function expectFooter (footer, { left, right }) {
  expect(footer).toBeTruthy()
  const t = text(footer)
  expect(t).toContain(left)
  expect(t).toContain(right)
  // «Page X of Y»: campos PAGE y NUMPAGES de Word
  expect(footer).toMatch(/PAGE/)
  expect(footer).toMatch(/NUMPAGES/)
}

const isoq = (project) => {
  const findings = [{ id: ep.id, name: ep.name, displayNumber: 1, evidence_profile: { ...ep }, references: ['r1'] }]
  return new IsoQExportStrategy(project, { findings, lists: findings, references }).export()
}
const worksheet = (project) => new WorksheetExportStrategy(project, { evidenceProfile: ep, references }).export()
const camelot = (project) => new CamelotExportStrategy(project, {
  evidenceProfile: [ep], references, list: { references: ['r1'] }, includeStudyTables: true
}).export()

describe('Word footer', () => {
  it.each([
    ['iSoQ', isoq, 'My review'],
    ['Worksheet', worksheet, 'My review — actionButtons.word_export.footer_finding 3'],
    ['CAMELOT', camelot, 'My review — actionButtons.word_export.footer_finding 3']
  ])('%s, public project: name and license in every section', async (_, build, left) => {
    const { document, sections } = await parts(await build(PUBLIC))
    expect(sections.length).toBeGreaterThan(0)
    sections.forEach(f => expectFooter(f, { left, right: 'actionButtons.word_export.footer_license: CC BY-SA' }))
    // La licencia ya no va como párrafo suelto en el cuerpo.
    expect(text(document)).not.toContain('CC-BY-SA')
  })

  it.each([
    ['iSoQ', isoq],
    ['Worksheet', worksheet],
    ['CAMELOT', camelot]
  ])('%s, private project: «unpublished» instead of a license', async (_, build) => {
    const { sections } = await parts(await build(PRIVATE))
    expect(sections.length).toBeGreaterThan(0)
    sections.forEach(f => {
      expectFooter(f, { left: 'My review', right: 'actionButtons.word_export.footer_unpublished' })
      expect(text(f)).not.toContain('footer_license')
    })
  })

  it('public project without a stored license: the default one (effectiveLicense)', async () => {
    const { sections } = await parts(await isoq({ ...PUBLIC, license_type: '' }))
    sections.forEach(f => expect(text(f)).toContain('CC BY-NC-ND'))
  })
})
