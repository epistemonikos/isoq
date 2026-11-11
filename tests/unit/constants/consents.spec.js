import { CONSENT_TEXT_VERSION } from '@/constants/consents'
import en from '@/lang/en.json'
import es from '@/lang/es.json'
import pt from '@/lang/pt.json'

// El servidor guarda junto a cada consentimiento la versión del texto que la persona
// vio (consent_history, GDPR Art. 7.1). Esa versión sólo prueba algo si cambia cada vez
// que cambia el texto, y nada lo obliga salvo este test.
//
// Si falla porque editaste una casilla:
//   1. sube CURRENT_CONSENT_TEXT_VERSION en el SERVIDOR y despliégalo primero
//      (isoq_server_py310, auth_server/libs/consents.py): al revés el alta da 400;
//   2. sube CONSENT_TEXT_VERSION en src/constants/consents.js;
//   3. agrega aquí los textos nuevos bajo la versión nueva. No borres los viejos:
//      son el registro de qué decía cada versión.
const TEXTS_BY_VERSION = {
  1: {
    en: {
      newsletter: 'I agree to receive email communications about important service updates and news (optional)',
      improvement: 'I agree to the use of my data in aggregated and anonymised form to help improve the service (optional)'
    },
    es: {
      newsletter: 'Acepto recibir comunicaciones por correo sobre actualizaciones importantes del servicio y novedades (opcional)',
      improvement: 'Acepto el uso de mis datos de forma agregada y anonimizada para ayudar a mejorar el servicio (opcional)'
    },
    pt: {
      newsletter: 'Aceito receber comunicações por email sobre atualizações importantes do serviço e novidades (opcional)',
      improvement: 'Aceito a utilização dos meus dados de forma agregada e anonimizada para ajudar a melhorar o serviço (opcional)'
    }
  }
}

describe('CONSENT_TEXT_VERSION', () => {
  it('es un entero positivo, como lo valida el servidor', () => {
    expect(Number.isInteger(CONSENT_TEXT_VERSION)).toBe(true)
    expect(CONSENT_TEXT_VERSION).toBeGreaterThanOrEqual(1)
  })

  it.each([['en', en], ['es', es], ['pt', pt]])(
    'los textos de las casillas en %s son los de la versión declarada',
    (lang, messages) => {
      const expected = TEXTS_BY_VERSION[CONSENT_TEXT_VERSION]
      expect(expected).toBeDefined()
      expect({
        newsletter: messages.gdpr.preferences.newsletter,
        improvement: messages.gdpr.preferences.improvement
      }).toEqual(expected[lang])
    }
  )
})
