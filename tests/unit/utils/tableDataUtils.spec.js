import { sortByAuthors, sortByStudyLabel, filterDisplayFields, loadFileAsText } from '@/utils/tableDataUtils'

// El orden de los estudios es de presentación: se deriva de la etiqueta que la persona lee
// («Autor Año»), no del orden en que se marcaron las referencias.
describe('sortByStudyLabel', () => {
  it('ordena por la etiqueta que devuelve labelOf', () => {
    const items = [{ id: 'a', l: 'Smith 2020' }, { id: 'b', l: 'Adams 2019' }, { id: 'c', l: 'Jones 2021' }]
    expect(sortByStudyLabel(items, i => i.l).map(i => i.id)).toEqual(['b', 'c', 'a'])
  })

  it('no distingue mayúsculas: una minúscula inicial no se va al final', () => {
    const items = [{ l: 'Zhang 2018' }, { l: 'de Vries 2017' }, { l: 'Brown 2016' }]
    expect(sortByStudyLabel(items, i => i.l).map(i => i.l)).toEqual(['Brown 2016', 'de Vries 2017', 'Zhang 2018'])
  })

  it('un acento no manda el estudio al final', () => {
    const items = [{ l: 'Zapata 2018' }, { l: 'Álvarez 2017' }, { l: 'Bravo 2016' }]
    expect(sortByStudyLabel(items, i => i.l).map(i => i.l)).toEqual(['Álvarez 2017', 'Bravo 2016', 'Zapata 2018'])
  })

  it('a igual etiqueta conserva el orden de entrada', () => {
    const items = [{ id: 1, l: 'Smith 2020' }, { id: 2, l: 'Smith 2020' }, { id: 3, l: 'Adams 2019' }]
    expect(sortByStudyLabel(items, i => i.l).map(i => i.id)).toEqual([3, 1, 2])
  })

  it('tolera etiquetas ausentes y no muta la entrada', () => {
    const items = [{ l: 'Smith' }, {}, { l: null }]
    const copia = [...items]
    expect(() => sortByStudyLabel(items, i => i.l)).not.toThrow()
    expect(items).toEqual(copia)
  })
})

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
