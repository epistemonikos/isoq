import routes from '@/router'

const rutaPor = (name) => routes.find(r => r.name === name)
const rutaPorPath = (path) => routes.find(r => r.path === path)

// Las tres URLs que master publicó y que tienen que seguir resolviendo si
// alguien las compartió (ver el comentario en src/router/index.js).
const URLS_LEGADAS = ['/terms-and-conditions', '/privacy-policy', '/intellectual-property']

describe('ruta PrivacyAndTerms — gate por ENABLE_GDPR', () => {
  afterEach(() => {
    process.env.ENABLE_GDPR = 'on'
  })

  it('deja entrar con el flag encendido', () => {
    process.env.ENABLE_GDPR = 'on'
    const next = jest.fn()

    rutaPor('PrivacyAndTerms').beforeEnter({}, {}, next)

    // next() sin argumento: sigue la navegación normal.
    expect(next).toHaveBeenCalledWith(undefined)
  })

  it('redirige a la home con el flag apagado', () => {
    process.env.ENABLE_GDPR = 'off'
    const next = jest.fn()

    rutaPor('PrivacyAndTerms').beforeEnter({}, {}, next)

    expect(next).toHaveBeenCalledWith({ name: 'MainPage' })
  })

  it('redirige también cuando el flag no está definido', () => {
    delete process.env.ENABLE_GDPR
    const next = jest.fn()

    rutaPor('PrivacyAndTerms').beforeEnter({}, {}, next)

    expect(next).toHaveBeenCalledWith({ name: 'MainPage' })
  })

  it('el destino de la redirección existe como ruta', () => {
    // Un next({name}) hacia un nombre inexistente deja la app en blanco con un
    // error de consola, que es justo lo que este diseño quiere evitar.
    expect(rutaPor('MainPage')).toBeDefined()
  })

  // ─── Las URLs legadas ────────────────────────────────────────────────────────
  //
  // La ruta NO se elimina con el flag apagado, precisamente para que estas tres
  // no queden apuntando a un nombre que ya no existe. Redirigen por nombre, así
  // que heredan el beforeEnter y salen a la home en vez de romperse.

  it.each(URLS_LEGADAS)('%s sigue registrada y redirige por nombre', (path) => {
    const ruta = rutaPorPath(path)

    expect(ruta).toBeDefined()
    expect(ruta.redirect.name).toBe('PrivacyAndTerms')
  })

  it('PrivacyAndTerms sigue registrada con el flag apagado', () => {
    process.env.ENABLE_GDPR = 'off'
    expect(rutaPor('PrivacyAndTerms')).toBeDefined()
  })
})
