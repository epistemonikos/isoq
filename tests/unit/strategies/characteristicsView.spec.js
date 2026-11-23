import { CamelotExportStrategy } from '@/strategies/exportStrategies'

// El Word de la worksheet CAMELOT sigue el filtro de «Characteristics of Studies»: las
// columnas ocultas no salen, y los comentarios sólo si «Show comments» está encendido.
// Así el Word es igual al PDF (que imprime la pantalla), como pidió Megan en #416.
jest.mock('@/plugins/i18n', () => ({ i18n: { locale: 'en', t: k => k } }))

const charData = {
  fields: [{ key: 'column_1', label: 'Country' }, { key: 'column_2', label: 'Setting' }],
  items: [{
    ref_id: 'r1', authors: 'Smith 2020;', column_1: 'Chile', column_2: 'Clinic',
    research_extractedData: 'R data', research_comments: 'R comment',
    stakeholders_extractedData: 'S data', stakeholders_comments: 'S comment'
  }]
}

const find = (node, key, out = []) => {
  if (Array.isArray(node)) node.forEach(n => find(n, key, out))
  else if (node && typeof node === 'object') {
    if (node.rootKey === key) out.push(node)
    else find(node.root, key, out)
  }
  return out
}
const text = node => find(node, 'w:t').map(t => t.root.filter(x => typeof x === 'string').join('')).join('')
const rows = table => find(table, 'w:tr').map(row => find(row, 'w:tc').map(text))

function build (view) {
  const strategy = new CamelotExportStrategy({ name: 'P' }, { characteristicStudies: charData, characteristicsView: view })
  return { strategy, table: strategy.createCharacteristicsTable(JSON.parse(JSON.stringify(charData))) }
}

describe('Word — Characteristics of Studies follows the screen filter', () => {
  // Otros caminos (la worksheet compartida, el documento del Paso 4) no tienen filtro en
  // pantalla: sin vista, la tabla queda como siempre, con todo y comentarios.
  it('without a view: every column and every comments column, as before', () => {
    const { strategy, table } = build(undefined)
    const [top, sub, body] = rows(table)
    const domains = strategy.getCamelotConfig().categories.length
    expect(top).toEqual(expect.arrayContaining(['Country', 'Setting', 'camelot.step_four.camelot_mixin.meta_domain_1']))
    expect(sub.filter(Boolean)).toHaveLength(2 + domains * 2)
    expect(body).toContain('R comment')
  })

  it('hidden columns do not appear, neither header nor data', () => {
    const { table } = build({ hiddenColumnKeys: ['column_2', 'research_extractedData'], showComments: false })
    const [top, , body] = rows(table)
    expect(top).not.toContain('Setting')
    expect(top).not.toContain('camelot.step_four.camelot_mixin.meta_domain_1')
    expect(top).toContain('Country')
    expect(top).toContain('camelot.step_four.camelot_mixin.meta_domain_2')
    expect(body).not.toContain('Clinic')
    expect(body).not.toContain('R data')
    expect(body).toContain('S data')
  })

  it('with comments on, each visible domain carries its comments column', () => {
    const { table } = build({ hiddenColumnKeys: ['research_extractedData'], showComments: true })
    const [, sub, body] = rows(table)
    expect(sub).toContain('camelot.step_four.camelot_mixin.concerns')
    expect(body).toContain('S comment')
    expect(body).not.toContain('R comment')
  })

  it('with comments off, no comments column at all', () => {
    const { table } = build({ hiddenColumnKeys: [], showComments: false })
    const [, sub, body] = rows(table)
    expect(sub).not.toContain('camelot.step_four.camelot_mixin.concerns')
    expect(body).not.toContain('S comment')
  })

  // La misma regla que la pantalla (utils/characteristicsColumns): el orden es el de
  // `fields`, aunque las claves propias sean hex, y los dominios van donde están en `fields`.
  it('keeps the screen order, with hex keys and domains in between', () => {
    const data = {
      fields: [
        { key: 'column_f00d', label: 'Setting' },
        { key: 'research_extractedData', label: 'R' }, { key: 'research_comments', label: 'RC' },
        { key: 'column_0a1b', label: 'Country' }
      ],
      items: [{ ref_id: 'r1', authors: 'Smith 2020;', column_f00d: 'Clinic', column_0a1b: 'Chile', research_extractedData: 'R data' }]
    }
    const strategy = new CamelotExportStrategy({ name: 'P' }, { characteristicStudies: data, characteristicsView: { hiddenColumnKeys: [], showComments: false } })
    const [top, , body] = rows(strategy.createCharacteristicsTable(data))
    expect(top.filter(t => t && t !== 'camelot.step_three.authors_label').slice(0, 3))
      .toEqual(['Setting', 'camelot.step_four.camelot_mixin.meta_domain_1', 'Country'])
    expect(body.slice(1, 4)).toEqual(['Clinic', 'R data', 'Chile'])
  })

  // `authors` ya trae el año (Commons.parseReference): la pantalla no lo repite y el Word tampoco.
  it('writes the author cell like the screen, without repeating the year', () => {
    const data = { fields: [{ key: 'column_1', label: 'C' }], items: [{ ref_id: 'r1', authors: 'Smith 2020;', year: '2020', column_1: 'x' }] }
    const strategy = new CamelotExportStrategy({ name: 'P' }, { characteristicStudies: data, characteristicsView: { hiddenColumnKeys: [], showComments: false } })
    const [, , body] = rows(strategy.createCharacteristicsTable(data))
    expect(body[0]).toBe('Smith 2020;')
  })

  // #416: el Word dice que la tabla está filtrada, igual que la pantalla y el PDF.
  it('the section carries the «filtered view» note when columns are hidden', () => {
    const strategy = new CamelotExportStrategy({ name: 'P' }, {
      characteristicStudies: charData, characteristicsView: { hiddenColumnKeys: ['column_2'], showComments: false }
    })
    const section = strategy.createCharacteristicsSection().map(text).join('|')
    expect(section).toContain('export.filtered_view.title')
    expect(section).toContain('export.filtered_view.hidden_columns')
  })

  it('no note without a filter', () => {
    const strategy = new CamelotExportStrategy({ name: 'P' }, { characteristicStudies: charData })
    expect(strategy.createCharacteristicsSection().map(text).join('|')).not.toContain('filtered_view')
  })

  // #416: Extracted data en el Word CAMELOT sigue su búsqueda, con nota y «sin resultados».
  it('CAMELOT extracted data: the note, and «no results» instead of an empty table', () => {
    const strategy = new CamelotExportStrategy({ name: 'P' }, {
      extractedData: { fields: [{ key: 'authors', label: 'A' }, { key: 'column_0', label: 'Data' }], items: [] },
      extractedView: { search: 'zzz', shown: 0, total: 4 }
    })
    const section = strategy.createExtractedDataSection().map(text).join('|')
    expect(section).toContain('export.filtered_view.search')
    expect(section).toContain('export.filtered_view.no_results')
  })

  it('CAMELOT extracted data without a search: no note', () => {
    const strategy = new CamelotExportStrategy({ name: 'P' }, {
      extractedData: { fields: [{ key: 'authors', label: 'A' }, { key: 'column_0', label: 'Data' }], items: [{ authors: 'S', column_0: 'q' }] }
    })
    expect(strategy.createExtractedDataSection().map(text).join('|')).not.toContain('filtered_view')
  })

  it('CAMELOT characteristics: a search is not possible there, but hiding every column is a note too', () => {
    const strategy = new CamelotExportStrategy({ name: 'P' }, { characteristicStudies: charData, characteristicsView: { hiddenColumnKeys: ['column_1'], showComments: false } })
    expect(strategy.createCharacteristicsSection().map(text).join('|')).toContain('hidden_columns')
  })
})
