import { needsTermsAcceptance, TERMS_VERSION } from '@/constants/terms'

describe('needsTermsAcceptance — fail-closed', () => {
  it('pide aceptación si el usuario es undefined', () => {
    expect(needsTermsAcceptance(undefined)).toBe(true)
  })

  it('pide aceptación si el objeto usuario está vacío', () => {
    expect(needsTermsAcceptance({})).toBe(true)
  })

  it('pide aceptación si terms_accepted es false', () => {
    expect(needsTermsAcceptance({ terms_accepted: false, terms_version: TERMS_VERSION })).toBe(true)
  })

  it('pide aceptación si terms_accepted es el string "false"', () => {
    // Con !user.terms_accepted esto pasaría como aceptado: 'false' es truthy.
    expect(needsTermsAcceptance({ terms_accepted: 'false', terms_version: TERMS_VERSION })).toBe(true)
  })

  it.each([true, 'true', 'True', 1, '1'])('acepta %p como aceptación válida', (value) => {
    expect(needsTermsAcceptance({ terms_accepted: value, terms_version: TERMS_VERSION })).toBe(false)
  })

  it('pide aceptación si terms_version no viene, aunque terms_accepted sea true', () => {
    // El caso que motivó toda esta función: undefined < 1 es false,
    // así que comparar directo dejaría pasar a todo el mundo.
    expect(needsTermsAcceptance({ terms_accepted: true })).toBe(true)
  })

  it('pide aceptación si terms_version no es numérico', () => {
    expect(needsTermsAcceptance({ terms_accepted: true, terms_version: 'abc' })).toBe(true)
    expect(needsTermsAcceptance({ terms_accepted: true, terms_version: null })).toBe(true)
  })

  it('pide aceptación si terms_version es anterior a la vigente', () => {
    expect(needsTermsAcceptance({ terms_accepted: true, terms_version: TERMS_VERSION - 1 })).toBe(true)
  })

  it('no pide aceptación si la versión coincide', () => {
    expect(needsTermsAcceptance({ terms_accepted: true, terms_version: TERMS_VERSION })).toBe(false)
  })

  it('acepta terms_version como string numérico', () => {
    expect(needsTermsAcceptance({ terms_accepted: true, terms_version: String(TERMS_VERSION) })).toBe(false)
  })

  it('no pide aceptación si es posterior a la vigente', () => {
    expect(needsTermsAcceptance({ terms_accepted: true, terms_version: TERMS_VERSION + 1 })).toBe(false)
  })

  it('pide aceptación al usuario nuevo que el backend devuelve con los defaults', () => {
    // Forma exacta con que isoq_server_py310 devuelve un usuario que nunca
    // aceptó: models.py setea ambos campos siempre, con False y 0.
    expect(needsTermsAcceptance({ terms_accepted: false, terms_version: 0 })).toBe(true)
  })
})

// Fixture capturado de POST /auth/user contra isoq_server_py310 el 2026-08-11.
// No es un mock inventado: es la respuesta literal del backend, recortada a los
// campos que esta regla mira. Si el backend cambia la forma o los tipos de
// terms_accepted / terms_version, este bloque es el que debería avisarlo.
const RESPUESTA_REAL_AUTH_USER = {
  status: 'logged',
  terms_accepted: false,
  terms_version: 0,
  newsletter: false,
  improvement: false,
  email_verified: true
}

describe('contrato con la respuesta real de /auth/user', () => {
  it('pide aceptación a un usuario que nunca aceptó', () => {
    expect(needsTermsAcceptance(RESPUESTA_REAL_AUTH_USER)).toBe(true)
  })

  it('deja pasar al mismo usuario tras aceptar la versión vigente', () => {
    expect(needsTermsAcceptance({
      ...RESPUESTA_REAL_AUTH_USER,
      terms_accepted: true,
      terms_version: TERMS_VERSION
    })).toBe(false)
  })

  it('el backend manda booleano e integer, no strings', () => {
    // Documenta por qué TRUTHY existe igual: isoq_server (el viejo) sí
    // devolvía strings, y la regla tiene que servir para los dos.
    expect(typeof RESPUESTA_REAL_AUTH_USER.terms_accepted).toBe('boolean')
    expect(typeof RESPUESTA_REAL_AUTH_USER.terms_version).toBe('number')
  })
})
