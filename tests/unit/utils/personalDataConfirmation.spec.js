import {
  PERSONAL_DATA_CONFIRMED,
  needsPersonalDataConfirmation,
  isPersonalDataConfirmationRejection
} from '@/utils/personalDataConfirmation'

/**
 * Publicar exige confirmar que el contenido no identifica a participantes de estudios
 * primarios ni trae datos personales que no se puedan hacer públicos. El servidor lo hace
 * cumplir en PATCH /api/publish (400 `personal_data_confirmation_required`); estas
 * funciones son las que deshabilitan el botón antes de llegar ahí.
 */
describe('needsPersonalDataConfirmation', () => {
  it('el campo se llama como lo guarda el servidor', () => {
    expect(PERSONAL_DATA_CONFIRMED).toBe('no_personal_data_confirmed')
  })

  it.each(['fully', 'partially', 'minimally'])('público (%s) sin confirmar: falta', (publicType) => {
    expect(needsPersonalDataConfirmation({ public_type: publicType })).toBe(true)
    expect(needsPersonalDataConfirmation({ public_type: publicType, [PERSONAL_DATA_CONFIRMED]: false })).toBe(true)
  })

  it('sólo `true` confirma: el servidor rechaza "true" y 1', () => {
    expect(needsPersonalDataConfirmation({ public_type: 'fully', [PERSONAL_DATA_CONFIRMED]: 'true' })).toBe(true)
    expect(needsPersonalDataConfirmation({ public_type: 'fully', [PERSONAL_DATA_CONFIRMED]: 1 })).toBe(true)
  })

  it('público y confirmado: no falta', () => {
    expect(needsPersonalDataConfirmation({ public_type: 'fully', [PERSONAL_DATA_CONFIRMED]: true })).toBe(false)
  })

  it('privado no la necesita', () => {
    expect(needsPersonalDataConfirmation({ public_type: 'private' })).toBe(false)
  })
})

describe('isPersonalDataConfirmationRejection', () => {
  it('reconoce el 400 del servidor por su reason', () => {
    expect(isPersonalDataConfirmationRejection({
      response: { status: 400, data: { reason: 'personal_data_confirmation_required' } }
    })).toBe(true)
  })

  it('no confunde otro 400', () => {
    expect(isPersonalDataConfirmationRejection({ response: { status: 400, data: { reason: 'invalid_version' } } })).toBe(false)
    expect(isPersonalDataConfirmationRejection(new Error('boom'))).toBe(false)
    expect(isPersonalDataConfirmationRejection(undefined)).toBe(false)
  })
})
