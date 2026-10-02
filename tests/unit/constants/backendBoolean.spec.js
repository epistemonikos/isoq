import { isBackendTrue } from '@/constants/backendBoolean'

describe('isBackendTrue', () => {
  // Los cinco valores que el backend considera verdaderos. Su propia
  // normalización usa exactamente esta lista
  // (isoq_server_py310, auth_server/controllers/core.py:470).
  it.each([true, 'true', 'True', 1, '1'])('reconoce %p como verdadero', (value) => {
    expect(isBackendTrue(value)).toBe(true)
  })

  it.each([false, 'false', 'False', 0, '0', null, undefined, ''])('trata %p como falso', (value) => {
    expect(isBackendTrue(value)).toBe(false)
  })

  it("no se deja engañar por el string 'false'", () => {
    // Ésta es la razón de ser de la función: Boolean('false') es true.
    expect(Boolean('false')).toBe(true)
    expect(isBackendTrue('false')).toBe(false)
  })

  it('devuelve un booleano, no el valor original', () => {
    // Quien la use puede comparar con === true sin sorpresas.
    expect(isBackendTrue('true')).toStrictEqual(true)
    expect(isBackendTrue(1)).toStrictEqual(true)
  })

  it('no acepta valores parecidos que el backend rechaza', () => {
    // 'TRUE', 'yes' y 2 no están en la lista del servidor: si el frontend
    // los aceptara, mostraría una casilla marcada que el backend guarda
    // como falsa.
    expect(isBackendTrue('TRUE')).toBe(false)
    expect(isBackendTrue('yes')).toBe(false)
    expect(isBackendTrue(2)).toBe(false)
  })

  it('no confunde tipos: el string "1" y el número 1 valen, otros no', () => {
    expect(isBackendTrue('1')).toBe(true)
    expect(isBackendTrue(1)).toBe(true)
    expect(isBackendTrue('01')).toBe(false)
  })
})
