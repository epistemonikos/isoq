import { sortByAuthors, filterDisplayFields, loadFileAsText } from '@/utils/tableDataUtils'

describe('sortByAuthors', () => {
  it('ordena items por authors ascendente', () => {
    const items = [
      { authors: 'Smith 2020' },
      { authors: 'Adams 2019' },
      { authors: 'Jones 2021' }
    ]
    const result = sortByAuthors(items)
    expect(result[0].authors).toBe('Adams 2019')
    expect(result[1].authors).toBe('Jones 2021')
    expect(result[2].authors).toBe('Smith 2020')
  })

  it('items sin authors van al principio', () => {
    const items = [
      { authors: 'Smith 2020' },
      { authors: '' },
      { authors: 'Adams 2019' }
    ]
    const result = sortByAuthors(items)
    expect(result[0].authors).toBe('')
  })

  it('no muta el array original', () => {
    const items = [{ authors: 'Smith' }, { authors: 'Adams' }]
    const original = [...items]
    sortByAuthors(items)
    expect(items[0]).toBe(original[0])
    expect(items[1]).toBe(original[1])
  })

  it('tolera items con authors undefined', () => {
    const items = [{ authors: 'Smith' }, {}]
    expect(() => sortByAuthors(items)).not.toThrow()
  })
})

describe('filterDisplayFields', () => {
  it('excluye fields con key ref_id, authors y actions', () => {
    const fields = [
      { key: 'ref_id', label: 'ID' },
      { key: 'authors', label: 'Authors' },
      { key: 'actions', label: '' },
      { key: 'column_0', label: 'My Field' }
    ]
    const result = filterDisplayFields(fields)
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('column_0')
  })

  it('retorna todos los campos cuando no hay excluidos', () => {
    const fields = [
      { key: 'column_0', label: 'Field A' },
      { key: 'column_1', label: 'Field B' }
    ]
    expect(filterDisplayFields(fields)).toHaveLength(2)
  })

  it('retorna array vacío si todos los campos son excluidos', () => {
    const fields = [{ key: 'ref_id' }, { key: 'authors' }, { key: 'actions' }]
    expect(filterDisplayFields(fields)).toHaveLength(0)
  })

  it('retorna array vacío si fields está vacío', () => {
    expect(filterDisplayFields([])).toHaveLength(0)
  })
})

describe('loadFileAsText', () => {
  let originalFileReader

  beforeEach(() => {
    originalFileReader = global.FileReader
  })

  afterEach(() => {
    global.FileReader = originalFileReader
  })

  it('resuelve con el contenido del archivo', async () => {
    global.FileReader = class {
      readAsText () { this.onload({ target: { result: 'file content' } }) }
    }
    const event = { target: { files: [new Blob(['file content'])] } }
    const result = await loadFileAsText(event)
    expect(result).toBe('file content')
  })

  it('resuelve con null si no hay archivo', async () => {
    const event = { target: { files: [] } }
    const result = await loadFileAsText(event)
    expect(result).toBeNull()
  })
})
