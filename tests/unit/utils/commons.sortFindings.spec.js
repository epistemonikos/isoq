import Commons from '@/utils/commons'

describe('Commons.sortFindings — displayNumber', () => {
  // Ids en hex de 24 caracteres: es lo que manda el servidor.
  const L1 = '66b1ff0000000000000000a1'
  const L2 = '66b1ff0000000000000000a2'
  const L3 = '66b1ff0000000000000000a3'
  const CAT_ALPHA = '66b1ff0000000000000000c1'
  const CAT_ZETA = '66b1ff0000000000000000c2'

  const categories = [
    { id: CAT_ALPHA, text: 'Alpha' },
    { id: CAT_ZETA, text: 'Zeta' }
  ]

  it('asigna displayNumber contiguo 1..N en el orden (categoría, sort)', () => {
    const findings = [
      { id: L1, category: CAT_ZETA, sort: 10 },
      { id: L2, category: CAT_ALPHA, sort: 40 },
      { id: L3, category: CAT_ALPHA, sort: 20 }
    ]

    const result = Commons.sortFindings(findings, categories)

    expect(result.map(f => f.id)).toEqual([L3, L2, L1])
    expect(result.map(f => f.displayNumber)).toEqual([1, 2, 3])
  })

  it('los huecos en el sort persistido no afectan displayNumber', () => {
    const findings = [
      { id: L1, category: CAT_ALPHA, sort: 1 },
      { id: L2, category: CAT_ALPHA, sort: 7 },
      { id: L3, category: CAT_ALPHA, sort: 99 }
    ]

    const result = Commons.sortFindings(findings, categories)

    expect(result.map(f => f.displayNumber)).toEqual([1, 2, 3])
  })

  it('con sort duplicado displayNumber sigue siendo contiguo', () => {
    const findings = [
      { id: L1, category: CAT_ALPHA, sort: 4 },
      { id: L2, category: CAT_ALPHA, sort: 4 }
    ]

    const result = Commons.sortFindings(findings, categories)

    expect(result.map(f => f.displayNumber)).toEqual([1, 2])
  })

  it('acepta las categorías como objeto con options', () => {
    const findings = [{ id: L1, category: CAT_ALPHA, sort: 5 }]

    const result = Commons.sortFindings(findings, { options: categories })

    expect(result[0].displayNumber).toBe(1)
  })

  it('no muta el array de entrada', () => {
    const findings = [{ id: L1, category: CAT_ALPHA, sort: 9 }]

    Commons.sortFindings(findings, categories)

    expect(findings[0].displayNumber).toBeUndefined()
    expect(findings[0].sort).toBe(9)
  })

  it('NO muta el sort persistido: es la preferencia de orden, no el número', () => {
    const findings = [
      { id: '66b1ff0000000000000000a1', category: null, sort: 40 },
      { id: '66b1ff0000000000000000a2', category: null, sort: 90 }
    ]

    const result = Commons.sortFindings(findings, [])

    expect(result.map(f => f.sort)).toEqual([40, 90])
    expect(result.map(f => f.displayNumber)).toEqual([1, 2])
  })
})
