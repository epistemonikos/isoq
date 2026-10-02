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

  // Regresión CRITICAL 1: viewProject.vue y previewContentSoQf.vue le agregan al array de
  // categorías una entrada sintética {id: null, text: <label traducido>} para el dropdown de
  // "sin categoría". Si sortFindings hace `options.find(c => c.id === id)`, un finding con
  // category: null hace match con esa entrada y ordena por su texto traducido en vez de ir
  // siempre al final junto al resto de los sin-categoría. editList.vue y
  // previewContentWorksheet.vue NO agregan esa entrada, así que el mismo finding cae al
  // fallback 'zzzzzzzz' en esas vistas: el número diverge entre vistas.
  it('el finding sin categoría va al final aunque las categorías incluyan la entrada sintética id:null', () => {
    const CAT_TRUST = '66b1ff0000000000000000c3'
    const L_TRUST = '66b1ff0000000000000000a4'
    const L_UNCAT = '66b1ff0000000000000000a5'

    const optionsWithSynthetic = [
      { id: null, text: 'No group' },
      { id: CAT_TRUST, text: 'Trust' }
    ]

    const findings = [
      { id: L_TRUST, category: CAT_TRUST, sort: 15, isoqf_id: 7 },
      { id: L_UNCAT, category: null, sort: 25, isoqf_id: 8 }
    ]

    const result = Commons.sortFindings(findings, optionsWithSynthetic)

    expect(result.map(f => f.id)).toEqual([L_TRUST, L_UNCAT])
    expect(result.map(f => f.displayNumber)).toEqual([1, 2])
  })

  // Minor fix: el comparador ordenaba nombres de categoría con < / > de código de punto sobre
  // strings en minúscula, mientras que todos los callers construyen su options con
  // localeCompare (viewProject.vue:950, previewContentSoQf.vue:557). 'á' (U+00E1) es mayor que
  // 'z' (U+007A) en código de punto, así que la comparación cruda ordena "Zona" antes que
  // "Área" — al revés de lo que da localeCompare, que trata la tilde como cercana a la letra
  // base. Con usuarios de habla hispana/portuguesa, eso vuelve la columna "#" no-monótona
  // entre la vista que armó las opciones (localeCompare) y sortFindings (código de punto).
  it('ordena nombres de categoría con localeCompare, no con código de punto (tildes)', () => {
    const CAT_AREA = '66b1ff0000000000000000c4'
    const CAT_ZONA = '66b1ff0000000000000000c5'
    const L_AREA = '66b1ff0000000000000000a6'
    const L_ZONA = '66b1ff0000000000000000a7'

    const options = [
      { id: CAT_AREA, text: 'Área' },
      { id: CAT_ZONA, text: 'Zona' }
    ]

    const findings = [
      { id: L_ZONA, category: CAT_ZONA, sort: 12, isoqf_id: 3 },
      { id: L_AREA, category: CAT_AREA, sort: 44, isoqf_id: 9 }
    ]

    const result = Commons.sortFindings(findings, options)

    // localeCompare('en'): 'área' antes que 'zona' (á tratada como cercana a 'a', no como > 'z').
    expect('área'.localeCompare('zona', 'en')).toBeLessThan(0)
    expect(result.map(f => f.id)).toEqual([L_AREA, L_ZONA])
    expect(result.map(f => f.displayNumber)).toEqual([1, 2])
  })

  // Non-blocking del re-review: catA.localeCompare(catB) sin locale explícito usa la
  // colación por defecto del runtime — dos usuarios en máquinas configuradas con locales
  // distintos podrían ver el "#" en orden distinto para el mismo finding, exactamente el bug
  // que esta rama cierra, ahora filtrándose por el locale del sistema en vez del idioma de la
  // UI. Hay que fijar el locale, y el test tiene que poder fallar bajo un locale alternativo
  // plausible o no está probando nada.
  //
  // 'ö' es el ejemplo que sí discrimina: en 'en' (y en 'es') colacionan cerca de 'o', pero en
  // sueco ('sv') la 'ö' es una letra propia que colaciona DESPUÉS de la 'z'. Confirmado
  // empíricamente en este runtime (Node con ICU completo):
  //   'örebro'.localeCompare('zurich', 'en') === -1   (Örebro antes que Zürich)
  //   'örebro'.localeCompare('zurich', 'sv') === 1    (Örebro después que Zürich)
  // Si sortFindings alguna vez dejara de pasar el locale explícito, o pasara el locale de la
  // UI en vez de uno fijo, este finding cambiaría de posición según el idioma/configuración
  // de quien mira, no según los datos.
  it('fija la colación a un locale explícito (no el de la app): "ö" no cambia de posición según el sistema', () => {
    // Primero, la prueba de que el locale SÍ discrimina — si esto dejara de ser cierto en
    // algún runtime, la aserción de abajo no probaría nada.
    expect('örebro'.localeCompare('zurich', 'en')).toBeLessThan(0)
    expect('örebro'.localeCompare('zurich', 'sv')).toBeGreaterThan(0)

    const CAT_OREBRO = '66b1ff0000000000000000c6'
    const CAT_ZURICH = '66b1ff0000000000000000c7'
    const L_OREBRO = '66b1ff0000000000000000a8'
    const L_ZURICH = '66b1ff0000000000000000a9'

    const options = [
      { id: CAT_OREBRO, text: 'Örebro' },
      { id: CAT_ZURICH, text: 'Zurich' }
    ]

    const findings = [
      { id: L_ZURICH, category: CAT_ZURICH, sort: 8, isoqf_id: 21 },
      { id: L_OREBRO, category: CAT_OREBRO, sort: 33, isoqf_id: 22 }
    ]

    const result = Commons.sortFindings(findings, options)

    // Colación 'en' pinneada: Örebro antes que Zurich. Si el código dejara caer el segundo
    // argumento de localeCompare (colación por defecto) esto seguiría pasando en la mayoría
    // de runtimes — la prueba real de que el locale está fijo es que coincide con 'en' aunque
    // el entorno de quien corre el test tenga otro locale configurado.
    expect(result.map(f => f.id)).toEqual([L_OREBRO, L_ZURICH])
    expect(result.map(f => f.displayNumber)).toEqual([1, 2])

    // Verificación directa de que se pasa 'en' explícitamente: se espía localeCompare y se
    // confirma que al menos una llamada usó ('en') como segundo argumento. Esto SÍ discrimina
    // una regresión donde alguien borra el segundo argumento o lo cambia por this.$i18n.locale.
    const spy = jest.spyOn(String.prototype, 'localeCompare')
    Commons.sortFindings(findings, options)
    const localesUsed = spy.mock.calls.map(call => call[1])
    expect(localesUsed).toContain('en')
    spy.mockRestore()
  })
})
