import {
  generateAuthorInfo,
  getStandardBorders,
  getNoBorders,
  createLicenseSection,
  createReferencesSection,
  createDocumentHeader,
  createInfoParagraph,
  createProjectInfoSection,
  createParagraph,
  createTableCell,
  createTableHeader,
  createTableRows,
  createStandardTable,
  generateAndDownloadDocument
} from '@/utils/documentHelpers'

jest.mock('docx', () => ({
  Paragraph: jest.fn(opts => ({ type: 'Paragraph', ...opts })),
  TextRun: jest.fn(opts => ({ type: 'TextRun', ...opts })),
  Table: jest.fn(opts => ({ type: 'Table', ...opts })),
  TableCell: jest.fn(opts => ({ type: 'TableCell', ...opts })),
  TableRow: jest.fn(opts => ({ type: 'TableRow', ...opts })),
  Packer: {
    toBlob: jest.fn()
  },
  HeadingLevel: {
    HEADING_1: 'heading1',
    HEADING_2: 'heading2'
  },
  AlignmentType: {
    LEFT: 'left',
    CENTER: 'center'
  },
  WidthType: {
    PERCENTAGE: 'pct'
  },
  VerticalAlign: {
    CENTER: 'center'
  },
  BorderStyle: {
    SINGLE: 'single',
    NONE: 'none'
  },
  HeightRule: {
    EXACT: 'exact'
  }
}))

jest.mock('file-saver', () => ({
  saveAs: jest.fn()
}))

import { Paragraph, TextRun, Table, TableCell, TableRow, Packer } from 'docx'
import { saveAs } from 'file-saver'

beforeEach(() => {
  jest.clearAllMocks()
  Packer.toBlob.mockResolvedValue(new Blob(['test']))
})

describe('generateAuthorInfo', () => {
  it('returns empty string when no author', () => {
    expect(generateAuthorInfo({})).toBe('')
    expect(generateAuthorInfo({ author: '' })).toBe('')
  })

  it('returns author name alone when no email', () => {
    expect(generateAuthorInfo({ author: 'Jane Doe' })).toBe('Jane Doe')
  })

  it('appends email when both present', () => {
    expect(generateAuthorInfo({ author: 'Jane Doe', author_email: 'jane@example.com' }))
      .toBe('Jane Doe - jane@example.com')
  })
})

describe('getStandardBorders', () => {
  it('returns object with all six border keys', () => {
    const borders = getStandardBorders()
    expect(borders).toHaveProperty('top')
    expect(borders).toHaveProperty('bottom')
    expect(borders).toHaveProperty('left')
    expect(borders).toHaveProperty('right')
    expect(borders).toHaveProperty('insideHorizontal')
    expect(borders).toHaveProperty('insideVertical')
  })

  it('uses SINGLE style for visible borders', () => {
    const borders = getStandardBorders()
    expect(borders.top.style).toBe('single')
    expect(borders.bottom.style).toBe('single')
  })

  it('uses NONE for insideVertical', () => {
    expect(getStandardBorders().insideVertical.style).toBe('none')
  })
})

describe('getNoBorders', () => {
  it('returns object with all six border keys set to NONE', () => {
    const borders = getNoBorders()
    ;['top', 'bottom', 'left', 'right', 'insideHorizontal', 'insideVertical'].forEach(key => {
      expect(borders[key].style).toBe('none')
    })
  })
})

describe('createLicenseSection', () => {
  it('returns empty array for private projects', () => {
    expect(createLicenseSection({ public_type: 'private' })).toEqual([])
  })

  it('returns paragraphs for public projects', () => {
    const result = createLicenseSection({ public_type: 'public', license_type: 'CC-BY' })
    expect(result.length).toBeGreaterThan(0)
    expect(Paragraph).toHaveBeenCalled()
  })

  it('falls back to CC-BY-NC-ND when no license_type', () => {
    createLicenseSection({ public_type: 'public' })
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ text: 'CC-BY-NC-ND' }))
  })
})

describe('createReferencesSection', () => {
  const references = [
    { id: 1, content: 'Smith et al. 2020' },
    { id: 2, content: 'Jones et al. 2021' },
    { id: 3, content: 'Brown et al. 2022' }
  ]

  it('returns only referenced items', () => {
    createReferencesSection(references, [1, 3])
    expect(TextRun).toHaveBeenCalledTimes(2)
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ text: 'Smith et al. 2020' }))
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ text: 'Brown et al. 2022' }))
  })

  it('returns empty array when no references match', () => {
    const result = createReferencesSection(references, [99])
    expect(result).toHaveLength(0)
  })

  it('does not mutate original references array', () => {
    const original = [...references]
    createReferencesSection(references, [1])
    expect(references).toEqual(original)
  })
})

describe('createDocumentHeader', () => {
  it('creates two heading paragraphs plus an empty one', () => {
    const result = createDocumentHeader('My Project', 'Summary Table')
    expect(result).toHaveLength(3)
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ text: 'My Project', bold: true }))
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ text: 'Summary Table', bold: true }))
  })

  it('uses default size 36', () => {
    createDocumentHeader('P', 'T')
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ size: 36 }))
  })

  it('accepts custom size', () => {
    createDocumentHeader('P', 'T', 28)
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ size: 28 }))
  })
})

describe('createInfoParagraph', () => {
  it('creates label paragraph and content paragraph', () => {
    const result = createInfoParagraph('Review question', 'What is the effect?')
    expect(result).toHaveLength(2)
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ text: 'Review question', bold: true }))
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ text: 'What is the effect?' }))
  })

  it('uses empty string when content is undefined', () => {
    createInfoParagraph('Label', undefined)
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ text: '' }))
  })
})

describe('createProjectInfoSection', () => {
  const project = {
    review_question: 'What works?',
    authors: 'Smith, Jones',
    author: 'Smith',
    author_email: 'smith@uni.edu',
    published_status: false,
    description: 'A systematic review'
  }

  it('returns array of paragraphs', () => {
    const result = createProjectInfoSection(project)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes review question', () => {
    createProjectInfoSection(project)
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ text: 'What works?' }))
  })
})

describe('createParagraph', () => {
  it('creates a paragraph with text', () => {
    createParagraph('Hello world')
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ text: 'Hello world' }))
  })

  it('applies bold option', () => {
    createParagraph('Bold text', { bold: true })
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ bold: true }))
  })

  it('uses default size 24', () => {
    createParagraph('Text')
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ size: 24 }))
  })

  it('accepts custom size', () => {
    createParagraph('Text', { size: 32 })
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ size: 32 }))
  })
})

describe('createTableCell', () => {
  it('creates a TableCell with given text', () => {
    createTableCell('Cell content')
    expect(TableCell).toHaveBeenCalled()
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ text: 'Cell content' }))
  })

  it('uses empty string when content is undefined', () => {
    createTableCell(undefined)
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ text: '' }))
  })

  it('applies bold option', () => {
    createTableCell('Text', { bold: true })
    expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({ bold: true }))
  })
})

describe('createTableHeader', () => {
  it('creates a TableRow marked as header', () => {
    const headers = [{ text: 'Col 1' }, { text: 'Col 2' }]
    createTableHeader(headers)
    expect(TableRow).toHaveBeenCalledWith(expect.objectContaining({ tableHeader: true }))
    expect(TableCell).toHaveBeenCalledTimes(2)
  })
})

describe('createTableRows', () => {
  it('creates one TableRow per data row', () => {
    const data = [
      [{ text: 'A1' }, { text: 'B1' }],
      [{ text: 'A2' }, { text: 'B2' }]
    ]
    createTableRows(data)
    expect(TableRow).toHaveBeenCalledTimes(2)
    expect(TableCell).toHaveBeenCalledTimes(4)
  })
})

describe('createStandardTable', () => {
  it('creates a Table with header plus data rows', () => {
    const headers = [{ text: 'Col' }]
    const data = [[{ text: 'Row 1' }], [{ text: 'Row 2' }]]
    createStandardTable(data, headers)
    expect(Table).toHaveBeenCalled()
    // 1 header row + 2 data rows
    expect(TableRow).toHaveBeenCalledTimes(3)
  })
})

describe('generateAndDownloadDocument', () => {
  it('calls Packer.toBlob and saveAs on success', async () => {
    const mockDoc = {}
    const result = await generateAndDownloadDocument(mockDoc, 'report.docx')
    expect(Packer.toBlob).toHaveBeenCalledWith(mockDoc)
    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'report.docx')
    expect(result).toBe(true)
  })

  it('returns false and does not throw when Packer fails', async () => {
    Packer.toBlob.mockRejectedValueOnce(new Error('fail'))
    const result = await generateAndDownloadDocument({}, 'report.docx')
    expect(result).toBe(false)
    expect(saveAs).not.toHaveBeenCalled()
  })
})
