import { Packer } from 'docx'
import JSZip from 'jszip'
import { WorksheetExportStrategy } from '@/strategies/exportStrategies'

// Las tablas de los Pasos 3/4 y los datos extraídos del Worksheet en Word:
// - desde browse / enlace compartido: sólo si el proyecto está publicado «fully»;
// - desde el proyecto (miembros del equipo, `includeStudyTables`): siempre.
jest.mock('@/plugins/i18n', () => ({ i18n: { locale: 'en', t: k => k } }))

const table = (label, value) => ({
  fields: [{ key: 'ref_id', label: 'Reference ID' }, { key: 'authors', label: 'Author(s), Year' }, { key: 'column_0', label }],
  items: [{ ref_id: 'r1', authors: 'Smith 2020', column_0: value }]
})
const data = (extra = {}) => ({
  evidenceProfile: { name: 'A finding', displayNumber: 1, references: ['r1'] },
  references: [{ id: 'r1', authors: ['Smith J'], publication_year: '2020' }],
  characteristicsStudies: table('Country', 'STEP3-VALUE'),
  methodologicalAssessments: table('Aims clear?', 'STEP4-VALUE'),
  extractedData: table('Data', 'EXTRACTED-VALUE'),
  ...extra
})

async function text (project, d) {
  const doc = await new WorksheetExportStrategy(project, d).export()
  const zip = await JSZip.loadAsync(await Packer.toBuffer(doc))
  return zip.file('word/document.xml').async('string')
}

const VALUES = ['STEP3-VALUE', 'STEP4-VALUE', 'EXTRACTED-VALUE']

describe('Worksheet export: study tables', () => {
  it('shared view of a project published «fully»: included', async () => {
    const xml = await text({ name: 'P', public_type: 'fully' }, data())
    VALUES.forEach(v => expect(xml).toContain(v))
  })

  it('shared view of a project not published «fully»: left out', async () => {
    const xml = await text({ name: 'P', public_type: 'private' }, data())
    VALUES.forEach(v => expect(xml).not.toContain(v))
  })

  it('from the project (includeStudyTables): included even if private', async () => {
    const xml = await text({ name: 'P', public_type: 'private' }, data({ includeStudyTables: true }))
    VALUES.forEach(v => expect(xml).toContain(v))
  })
})

// CAMELOT sigue la misma regla (antes no miraba el tipo de publicación).
describe('CAMELOT export: study tables', () => {
  const { CamelotExportStrategy } = require('@/strategies/exportStrategies')
  const concern = { option: 1, explanation: 'x' }
  const ep = {
    name: 'A finding',
    displayNumber: 1,
    references: ['r1'],
    methodological_limitations: concern,
    coherence: concern,
    adequacy: concern,
    relevance: concern,
    cerqual: concern
  }
  const camelotData = (extra = {}) => ({
    evidenceProfile: [ep],
    references: [{ id: 'r1', authors: ['Smith J'], publication_year: '2020' }],
    list: { references: ['r1'] },
    license: 'CC-BY-NC-ND',
    ...extra
  })
  const TITLES = ['worksheet.characteristics_of_studies', 'worksheet.methodological_assessments', 'worksheet.extracted_data']

  async function camelotXml (project, d) {
    const doc = await new CamelotExportStrategy(project, d).export()
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc))
    return zip.file('word/document.xml').async('string')
  }

  it('shared view of a project published «fully»: included', async () => {
    const xml = await camelotXml({ name: 'P', public_type: 'fully' }, camelotData())
    TITLES.forEach(t => expect(xml).toContain(t))
  })

  it('shared view of a project not published «fully»: left out', async () => {
    // (La licencia va en el pie de página: ver wordFooter.spec.js.)
    const xml = await camelotXml({ name: 'P', public_type: 'partially', license_type: 'CC-BY-NC-ND' }, camelotData())
    TITLES.forEach(t => expect(xml).not.toContain(t))
  })

  it('from the project (includeStudyTables): included even if private', async () => {
    const xml = await camelotXml({ name: 'P', public_type: 'private' }, camelotData({ includeStudyTables: true }))
    TITLES.forEach(t => expect(xml).toContain(t))
  })
})
