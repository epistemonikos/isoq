import { isGdprEnabled } from '@/constants/gdpr'

// tests/unit/setup.js pone ENABLE_GDPR en 'on' para toda la suite, así que acá
// hay que guardar y restaurar: sin esto, el primer caso que lo apaga se lo
// apaga también a los specs que corran después en el mismo worker.
describe('isGdprEnabled — fail-open', () => {
  const originalFlag = process.env.ENABLE_GDPR

  afterEach(() => {
    process.env.ENABLE_GDPR = originalFlag
  })

  it('está apagado si el flag no está definido', () => {
    // El caso del despliegue que nunca tocó prod.env.js. Decisión explícita:
    // ausente significa apagado, al revés que needsTermsAcceptance, que es
    // fail-closed. Son dos preguntas distintas — ver src/constants/gdpr.js.
    delete process.env.ENABLE_GDPR
    expect(isGdprEnabled()).toBe(false)
  })

  it.each(['on', 'true'])('está encendido con %p', (value) => {
    process.env.ENABLE_GDPR = value
    expect(isGdprEnabled()).toBe(true)
  })

  it.each(['off', 'false', '', 'yes', 'sí', '1', 'ON', 'True'])('está apagado con %p', (value) => {
    // '1', 'ON' y 'True' apagados a propósito: la lista de valores encendidos
    // es cerrada y sensible a mayúsculas, igual que lockService.isEnabled.
    // Un typo deja el flag apagado, que es el lado seguro de esta decisión.
    process.env.ENABLE_GDPR = value
    expect(isGdprEnabled()).toBe(false)
  })

  it('lee el flag en cada llamada, no al importar el módulo', () => {
    // De esto depende que los specs puedan alternar el flag sin jest.resetModules().
    process.env.ENABLE_GDPR = 'on'
    expect(isGdprEnabled()).toBe(true)
    process.env.ENABLE_GDPR = 'off'
    expect(isGdprEnabled()).toBe(false)
  })
})
