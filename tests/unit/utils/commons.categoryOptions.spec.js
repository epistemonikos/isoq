import Commons from '@/utils/commons'

const unnamed = (n) => `(Unnamed group ${n})`

describe('Commons.categoryOptions', () => {
  it('a named category shows its own name and keeps text untouched', () => {
    const [cat] = Commons.categoryOptions([{ id: 'a', text: 'Barriers' }], unnamed)
    expect(cat.text).toBe('Barriers')
    expect(cat.label).toBe('Barriers')
    expect(cat.unnamed).toBe(false)
  })

  // Sólo el texto AUSENTE pasa a '': uno en blanco se deja como está porque sortFindings lo lee,
  // y cambiarlo movería el número de sus findings respecto de las vistas que usan el catálogo crudo.
  it('missing, empty and blank text are all unnamed; only a missing text becomes empty', () => {
    const cats = Commons.categoryOptions([
      { id: '03' },
      { id: '01', text: '' },
      { id: '02', text: '   ' }
    ], unnamed)
    expect(cats.map(c => c.unnamed)).toEqual([true, true, true])
    expect(cats.map(c => c.id)).toEqual(['01', '02', '03'])
    expect(cats.map(c => c.text)).toEqual(['', '   ', ''])
  })

  it('numbers the unnamed ones by id, so every view and reload agrees', () => {
    const shuffled = [{ id: '0c' }, { id: 'b', text: 'Beta' }, { id: '0a' }, { id: '0b', text: '' }]
    const labels = (input) => Object.fromEntries(
      Commons.categoryOptions(input, unnamed).map(c => [c.id, c.label])
    )
    const expected = { '0a': '(Unnamed group 1)', '0b': '(Unnamed group 2)', '0c': '(Unnamed group 3)', b: 'Beta' }
    expect(labels(shuffled)).toEqual(expected)
    expect(labels([...shuffled].reverse())).toEqual(expected)
  })

  it('orders the unnamed first and numerically, then the named alphabetically', () => {
    const input = [{ id: 'z', text: 'Zeta' }, { id: 'a', text: 'Alpha' }]
    for (let i = 1; i <= 11; i++) input.push({ id: String(i).padStart(2, '0') })
    const labels = Commons.categoryOptions(input, unnamed).map(c => c.label)
    expect(labels.slice(0, 3)).toEqual(['(Unnamed group 1)', '(Unnamed group 2)', '(Unnamed group 3)'])
    expect(labels[10]).toBe('(Unnamed group 11)')
    expect(labels.slice(-2)).toEqual(['Alpha', 'Zeta'])
  })

  it('does not mutate its input', () => {
    const input = [{ id: 'a' }]
    Commons.categoryOptions(input, unnamed)
    expect(input).toEqual([{ id: 'a' }])
  })

  it('the labels never reach the numbering: sortFindings sees the same text as with the raw catalog', () => {
    const raw = [{ id: 'u' }, { id: 'n', text: 'Named' }]
    const findings = [
      { id: 'f1', category: 'u', sort: 1 },
      { id: 'f2', category: 'n', sort: 1 },
      { id: 'f3', category: null, sort: 2 }
    ]
    const numbers = (cats) => Commons.sortFindings(findings, cats).map(f => `${f.id}:${f.displayNumber}`)
    expect(numbers(Commons.categoryOptions(raw, unnamed))).toEqual(numbers(raw))
  })
})
