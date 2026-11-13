import { Packer } from 'docx'
import JSZip from 'jszip'
import {
  IsoQExportStrategy,
  CamelotExportStrategy,
  WorksheetExportStrategy
} from '@/strategies/exportStrategies'

// #168: en el Word, la columna «#» del SoQf y del Evidence Profile tiene que ser la más
// angosta y la del finding, más o menos el doble de cada una de las demás.
//
// Se mide sobre el XML que genera docx DE VERDAD: un ancho que no se ve en el
// document.xml no existe para Word. Antes salían `tcW` de «250%» y «2000%», `tblW` de
// «5000%», `tblLayout` «[object Object]» y una grilla de 100 twips iguales: Word
// repartía las columnas a su manera.

jest.mock('@/plugins/i18n', () => ({ i18n: { locale: 'en', t: k => k } }))

const concern = (option) => ({ option, explanation: 'Some concerns, explained in one sentence.' })
const ep = (n) => ({
  id: 'f' + n,
  displayNumber: n,
  name: 'Women described a strong sense of isolation during the postpartum period ' + n,
  methodological_limitations: concern(1),
  coherence: concern(0),
  adequacy: concern(2),
  relevance: concern(1),
  cerqual: { option: 1, explanation: 'Minor concerns across the board.' },
  references: ['r1', 'r2']
})
const references = [
  { id: 'r1', authors: ['Smith J'], publication_year: '2020' },
  { id: 'r2', authors: ['Pérez A'], publication_year: '2019' }
]

async function documentXml (doc) {
  const zip = await JSZip.loadAsync(await Packer.toBuffer(doc))
  return zip.file('word/document.xml').async('string')
}

const attr = (tag, name) => {
  const m = tag && tag.match(new RegExp(`w:${name}="([^"]*)"`))
  return m ? m[1] : undefined
}

// Cada tabla con el ancho útil de la página de su sección (pgSz − márgenes). En OOXML
// las propiedades de sección van al FINAL de la sección; la última va en el body.
function measureTables (xml) {
  const body = xml.match(/<w:body>(.*)<\/w:body>/s)[1]
  const tables = []
  const re = /<w:tbl>.*?<\/w:tbl>|<w:sectPr.*?<\/w:sectPr>/gs
  let pending = []
  let m
  while ((m = re.exec(body))) {
    if (m[0].startsWith('<w:tbl>')) {
      pending.push(m[0])
      continue
    }
    const sect = m[0]
    const pgSz = sect.match(/<w:pgSz[^>]*>/)[0]
    const pgMar = sect.match(/<w:pgMar[^>]*>/)[0]
    const width = Number(attr(pgSz, 'w'))
    const height = Number(attr(pgSz, 'h'))
    const pageWidth = attr(pgSz, 'orient') === 'landscape' ? Math.max(width, height) : Math.min(width, height)
    const content = pageWidth - Number(attr(pgMar, 'left')) - Number(attr(pgMar, 'right'))
    for (const tbl of pending) {
      const firstRow = tbl.match(/<w:tr>.*?<\/w:tr>/s)[0]
      tables.push({
        content,
        tblW: tbl.match(/<w:tblW[^>]*>/)[0],
        layout: attr(tbl.match(/<w:tblLayout[^>]*>/)?.[0], 'type'),
        grid: (tbl.match(/<w:gridCol[^>]*>/g) || []).map(g => Number(attr(g, 'w'))),
        cells: (firstRow.match(/<w:tcW[^>]*>/g) || []).map(t => ({ type: attr(t, 'type'), w: attr(t, 'w') }))
      })
    }
    pending = []
  }
  return tables
}

// La regla de Megan, sobre la grilla (lo que usa el layout fijo) y sobre las celdas.
function expectFindingTableShape (table, columns) {
  expect(table.layout).toBe('fixed')
  expect(attr(table.tblW, 'type')).toBe('pct')
  expect(attr(table.tblW, 'w')).toBe('100%')

  expect(table.grid).toHaveLength(columns)
  const total = table.grid.reduce((a, b) => a + b, 0)
  expect(Math.abs(total - table.content)).toBeLessThanOrEqual(columns)

  const [number, finding, ...others] = table.grid
  expect(number).toBeLessThan(Math.min(...others))
  // Lo bastante ancho para «100» con los márgenes de celda por defecto (2 × 108 twips).
  expect(number).toBeGreaterThanOrEqual(500)
  for (const other of others) {
    expect(finding / other).toBeGreaterThan(1.8)
    expect(finding / other).toBeLessThan(2.2)
  }

  // Las celdas dicen lo mismo que la grilla, en porcentajes válidos que suman 100.
  expect(table.cells).toHaveLength(columns)
  const pcts = table.cells.map(c => {
    expect(c.type).toBe('pct')
    expect(c.w).toMatch(/^\d+(\.\d+)?%$/)
    return parseFloat(c.w)
  })
  expect(pcts.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 0)
  pcts.forEach((p, i) => expect(p / 100).toBeCloseTo(table.grid[i] / total, 2))
}

// La página, como la escribe docx 9: la orientación va en `page.size.orientation` y los
// márgenes en `page.margin`. Con las claves de docx 5 (`page.orientation`, `margins`) salía
// todo vertical y con 1440 de margen, sin error.
async function pageSetups (doc) {
  const xml = await documentXml(doc)
  return (xml.match(/<w:sectPr.*?<\/w:sectPr>/gs) || []).map(sect => {
    const pgSz = sect.match(/<w:pgSz[^>]*>/)[0]
    const pgMar = sect.match(/<w:pgMar[^>]*>/)[0]
    return {
      orient: attr(pgSz, 'orient'),
      width: Number(attr(pgSz, 'w')),
      height: Number(attr(pgSz, 'h')),
      margins: ['top', 'right', 'bottom', 'left'].map(k => Number(attr(pgMar, k)))
    }
  })
}

describe('Word export page setup (docx 9)', () => {
  const landscape = { orient: 'landscape', width: 16838, height: 11906, margins: [720, 720, 720, 720] }

  it('Worksheet: landscape A4 with 720 margins', async () => {
    const doc = await new WorksheetExportStrategy({ name: 'P' }, { evidenceProfile: ep(1), references }).export()
    expect(await pageSetups(doc)).toEqual([landscape])
  })

  it('CAMELOT: every section landscape A4 with 720 margins', async () => {
    const doc = await new CamelotExportStrategy({ name: 'P' }, {
      evidenceProfile: [ep(1)], references, list: { references: ['r1', 'r2'] }
    }).export()
    const setups = await pageSetups(doc)
    expect(setups).toHaveLength(4)
    setups.forEach(s => expect(s).toEqual(landscape))
  })

  it('iSoQ: SoQf portrait, Evidence Profile landscape, builder margins (720)', async () => {
    const doc = await new IsoQExportStrategy({ name: 'P' }, { findings: [], lists: [], references }).export()
    expect(await pageSetups(doc)).toEqual([
      { orient: 'portrait', width: 11906, height: 16838, margins: [720, 720, 720, 720] },
      landscape
    ])
  })
})

describe('Word export column widths (#168)', () => {
  it('iSoQ: SoQf and Evidence Profile tables', async () => {
    const findings = [1, 2].map(n => {
      const e = ep(n)
      return {
        id: e.id,
        name: e.name,
        displayNumber: n,
        evidence_profile: { ...e },
        references: e.references,
        cerqual_option: 'Moderate confidence',
        cerqual_explanation: 'Minor concerns across the board.'
      }
    })
    const doc = await new IsoQExportStrategy({ name: 'P' }, { findings, lists: findings, references }).export()
    const [soqf, evidence] = measureTables(await documentXml(doc))

    expectFindingTableShape(soqf, 5)
    expectFindingTableShape(evidence, 8)
  })

  it('CAMELOT: Evidence Profile table', async () => {
    const doc = await new CamelotExportStrategy({ name: 'P' }, {
      evidenceProfile: [ep(1)],
      references,
      list: { references: ['r1', 'r2'] }
    }).export()
    const [evidence] = measureTables(await documentXml(doc))

    expectFindingTableShape(evidence, 8)
  })

  it('Worksheet: Evidence Profile table', async () => {
    const doc = await new WorksheetExportStrategy({ name: 'P' }, { evidenceProfile: ep(1), references }).export()
    const [evidence] = measureTables(await documentXml(doc))

    expectFindingTableShape(evidence, 8)
  })
})

// #168: la fila del grupo de findings tiene que cruzar la tabla entera. La estrategia
// pedía `columnSpan`, pero el builder no se lo pasaba a docx: salía una sola celda en la
// primera columna.
describe('Word export category rows (#168)', () => {
  const rowsWith = (table, text) =>
    (table.match(/<w:tr>.*?<\/w:tr>|<w:tr .*?<\/w:tr>/gs) || []).filter(tr => tr.includes(text))

  it('iSoQ: the category row spans every column of SoQf and Evidence Profile', async () => {
    const e = ep(1)
    const findings = [
      { is_category: true, name: 'Group A' },
      {
        id: e.id,
        name: e.name,
        displayNumber: 1,
        evidence_profile: { ...e },
        references: e.references
      }
    ]
    const xml = await documentXml(
      await new IsoQExportStrategy({ name: 'P' }, { findings, lists: findings, references }).export()
    )
    const tables = xml.match(/<w:tbl>.*?<\/w:tbl>/gs)
    const expected = [[tables[0], 5], [tables[1], 8]]

    expected.forEach(([table, columns]) => {
      const [row] = rowsWith(table, 'GROUP A')
      expect(row).toBeDefined()
      expect((row.match(/<w:tc>/g) || []).length).toBe(1)
      expect(attr(row.match(/<w:gridSpan[^>]*>/)?.[0], 'val')).toBe(String(columns))
      expect(attr(row.match(/<w:tcW[^>]*>/)?.[0], 'w')).toBe('100%')
    })
  })
})

// El Evidence Profile del export iSoQ alinea sus celdas como el SoQf: al centro vertical.
// Los dominios y el CERQual iban arriba y el «#» y el finding al medio.
describe('Word export iSoQ Evidence Profile alignment', () => {
  it('every data cell is vertically centered', async () => {
    const e = ep(1)
    const findings = [{
      id: e.id,
      name: e.name,
      displayNumber: 1,
      evidence_profile: { ...e },
      references: e.references
    }]
    const xml = await documentXml(
      await new IsoQExportStrategy({ name: 'P' }, { findings, lists: findings, references }).export()
    )
    const evidence = xml.match(/<w:tbl>.*?<\/w:tbl>/gs)[1]
    const dataRow = (evidence.match(/<w:tr>.*?<\/w:tr>/gs) || []).find(tr => tr.includes(e.name))
    const aligns = (dataRow.match(/<w:tc>.*?<\/w:tc>/gs) || [])
      .map(tc => attr(tc.match(/<w:vAlign[^>]*>/)?.[0], 'val'))

    expect(aligns).toHaveLength(8)
    expect(aligns.every(a => a === 'center')).toBe(true)
  })
})

// El Evidence Profile del export iSoQ lleva los mismos bordes que el SoQf (antes, ninguno).
describe('Word export iSoQ Evidence Profile borders', () => {
  it('uses the same table borders as the SoQf', async () => {
    const e = ep(1)
    const findings = [{
      id: e.id,
      name: e.name,
      displayNumber: 1,
      evidence_profile: { ...e },
      references: e.references
    }]
    const xml = await documentXml(
      await new IsoQExportStrategy({ name: 'P' }, { findings, lists: findings, references }).export()
    )
    const [soqf, evidence] = xml.match(/<w:tbl>.*?<\/w:tbl>/gs)
      .map(t => t.match(/<w:tblBorders>.*?<\/w:tblBorders>/s)[0])

    expect(soqf).toMatch(/<w:top w:val="single"/)
    expect(evidence).toBe(soqf)
  })
})

// Cebra (#168): las filas de findings alternan blanco y #F7F7F7, y la cuenta parte de
// nuevo en cada grupo (el primer finding de un grupo es siempre blanco).
describe('Word export iSoQ zebra rows', () => {
  it('alternates F7F7F7 on both tables, restarting at each group', async () => {
    const finding = (n) => {
      const e = ep(n)
      return { id: e.id, name: e.name, displayNumber: n, evidence_profile: { ...e }, references: e.references }
    }
    const findings = [
      { is_category: true, name: 'Group A' },
      finding(1), finding(2), finding(3),
      { is_category: true, name: 'Group B' },
      finding(4), finding(5)
    ]
    const xml = await documentXml(
      await new IsoQExportStrategy({ name: 'P' }, { findings, lists: findings, references }).export()
    )
    const tables = xml.match(/<w:tbl>.*?<\/w:tbl>/gs).slice(0, 2)

    tables.forEach(table => {
      const rows = table.match(/<w:tr>.*?<\/w:tr>/gs) || []
      const fills = [1, 2, 3, 4, 5].map(n => {
        const row = rows.find(tr => tr.includes(ep(n).name + '<'))
        const cells = row.match(/<w:tc>.*?<\/w:tc>/gs)
        const cellFills = cells.map(tc => attr(tc.match(/<w:shd[^>]*>/)?.[0], 'fill') || 'none')
        expect(new Set(cellFills).size).toBe(1)
        return cellFills[0]
      })
      expect(fills).toEqual(['none', 'F7F7F7', 'none', 'none', 'F7F7F7'])
    })
  })
})

// Tipografía (#168): todo Calibri; texto y tablas en 10 pt (w:sz 20) y sólo los títulos
// (en negrita, fuera de las tablas) en 12 o 14 pt. Sin fuente por defecto en styles.xml,
// Word dibujaba en Times New Roman todo run sin `font`.
describe('Word export typography', () => {
  async function parts (doc) {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc))
    return {
      document: await zip.file('word/document.xml').async('string'),
      styles: await zip.file('word/styles.xml').async('string')
    }
  }

  const runs = (xml) => xml.match(/<w:r>.*?<\/w:r>|<w:r .*?<\/w:r>/gs) || []
  const size = (run) => attr(run.match(/<w:sz [^>]*>/)?.[0], 'val')
  const isBold = (run) => { const b = run.match(/<w:b\/>|<w:b [^>]*>/)?.[0]; return Boolean(b) && attr(b, 'val') !== 'false' }

  function expectCalibri10 ({ document, styles }) {
    const defaults = styles.match(/<w:docDefaults>.*?<\/w:docDefaults>/s)[0]
    expect(attr(defaults.match(/<w:rFonts[^>]*>/)?.[0], 'ascii')).toBe('Calibri')
    expect(attr(defaults.match(/<w:sz [^>]*>/)?.[0], 'val')).toBe('20')

    // Ningún estilo de título pide otra fuente.
    const headingFonts = (styles.match(/<w:style [^>]*w:styleId="(Heading\d|Title)".*?<\/w:style>/gs) || [])
      .map(s => attr(s.match(/<w:rFonts[^>]*>/)?.[0], 'ascii'))
      .filter(Boolean)
    expect(headingFonts.every(f => f === 'Calibri')).toBe(true)

    // Ningún run pide una fuente distinta de Calibri.
    const fonts = (document.match(/<w:rFonts[^>]*>/g) || []).map(t => attr(t, 'ascii'))
    expect(fonts.filter(f => f !== 'Calibri')).toEqual([])

    // En las tablas, todo 10 pt.
    const tableSizes = (document.match(/<w:tbl>.*?<\/w:tbl>/gs) || [])
      .flatMap(runs).map(size).filter(Boolean)
    expect(tableSizes.length).toBeGreaterThan(0)
    expect([...new Set(tableSizes)]).toEqual(['20'])

    // Fuera de las tablas: 10 pt, o 12/14 pt sólo en títulos en negrita.
    const outside = runs(document.replace(/<w:tbl>.*?<\/w:tbl>/gs, ''))
    outside.forEach(run => {
      const s = size(run)
      if (!s || s === '20') return
      expect(['24', '28']).toContain(s)
      expect(isBold(run)).toBe(true)
    })
  }

  const isoqFindings = () => {
    const e = ep(1)
    return [
      { is_category: true, name: 'Group A' },
      { id: e.id, name: e.name, displayNumber: 1, evidence_profile: { ...e }, references: e.references }
    ]
  }

  it('iSoQ', async () => {
    const findings = isoqFindings()
    const project = { name: 'P', review_question: 'Q', authors: 'A', description: 'D' }
    expectCalibri10(await parts(await new IsoQExportStrategy(project, { findings, lists: findings, references }).export()))
  })

  it('CAMELOT', async () => {
    expectCalibri10(await parts(await new CamelotExportStrategy({ name: 'P' }, {
      evidenceProfile: [ep(1)],
      references,
      list: { references: ['r1', 'r2'] }
    }).export()))
  })

  it('Worksheet', async () => {
    expectCalibri10(await parts(await new WorksheetExportStrategy({ name: 'P' }, { evidenceProfile: ep(1), references }).export()))
  })
})

// Export iSoQ: el SoQf queda vertical y el Evidence Profile, más extenso, en horizontal;
// y el nivel de confianza del SoQf va en negrita (como en el Evidence Profile).
describe('Word export iSoQ: Evidence Profile landscape and bold CERQual', () => {
  const build = async () => {
    const e = ep(1)
    const findings = [{ id: e.id, name: e.name, displayNumber: 1, evidence_profile: { ...e }, references: e.references }]
    return documentXml(await new IsoQExportStrategy({ name: 'P' }, { findings, lists: findings, references }).export())
  }

  it('SoQf section is portrait and the Evidence Profile section is landscape', async () => {
    const xml = await build()
    const body = xml.match(/<w:body>(.*)<\/w:body>/s)[1]
    // Cada sectPr cierra la sección que lo precede: [SoQf, Evidence Profile].
    const pages = (body.match(/<w:sectPr.*?<\/w:sectPr>/gs) || []).map(s => {
      const pgSz = s.match(/<w:pgSz[^>]*>/)[0]
      return { w: Number(attr(pgSz, 'w')), h: Number(attr(pgSz, 'h')), orient: attr(pgSz, 'orient') }
    })
    expect(pages).toHaveLength(2)
    expect(pages[0].w).toBeLessThan(pages[0].h)
    expect(pages[1].orient).toBe('landscape')
    expect(pages[1].w).toBeGreaterThan(pages[1].h)

    // La tabla del Evidence Profile va DESPUÉS del primer sectPr (en la sección horizontal).
    const firstSect = body.indexOf('<w:sectPr')
    const tables = [...body.matchAll(/<w:tbl>/g)].map(m => m.index)
    expect(tables[0]).toBeLessThan(firstSect)
    expect(tables[1]).toBeGreaterThan(firstSect)
  })

  it('the CERQual level in the SoQf is bold', async () => {
    const soqf = (await build()).match(/<w:tbl>.*?<\/w:tbl>/gs)[0]
    const row = soqf.match(/<w:tr>.*?<\/w:tr>/gs).find(tr => tr.includes('Moderate') || tr.includes('moderate_confidence'))
    const cell = row.match(/<w:tc>.*?<\/w:tc>/gs)[2]
    // `bold: false` sale como <w:b w:val="false"/>: hay que exigir la negrita encendida.
    const b = cell.match(/<w:b\/>|<w:b [^>]*>/)?.[0]
    expect(b).toBeDefined()
    expect(attr(b, 'val')).not.toBe('false')
  })
})
