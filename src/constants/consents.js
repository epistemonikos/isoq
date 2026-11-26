// Versión del texto de las casillas de consentimiento (`gdpr.preferences.newsletter` e
// `gdpr.preferences.improvement` en en/es/pt). Viaja como `consent_text_version` y el
// backend la guarda junto a cada consentimiento (consent_history, GDPR Art. 7.1): es la
// prueba de qué leyó la persona. Lo manda el cliente porque es el único que sabe qué
// build sirvió.
//
// Al cambiar cualquiera de esos textos: subir PRIMERO CURRENT_CONSENT_TEXT_VERSION en el
// servidor (isoq_server_py310, auth_server/libs/consents.py) y desplegarlo, y después
// este número. El servidor rechaza con 400 una versión mayor que la suya, así que al
// revés nadie podría registrarse. tests/unit/constants/consents.spec.js falla si el
// texto cambia sin que cambie este número.
export const CONSENT_TEXT_VERSION = 1
