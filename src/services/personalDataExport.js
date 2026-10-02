import Api from '@/utils/Api'

const ENDPOINT = '/users/get_full_data'
const FILENAME = 'profile_data.zip'

/**
 * Lee el cuerpo de un Blob como texto.
 *
 * jsdom 16.7 —el de los tests— no implementa Blob.prototype.text(), aunque
 * los navegadores sí. FileReader existe en los dos.
 */
function readBlob (blob) {
  if (typeof blob.text === 'function') return blob.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

/**
 * Saca el mensaje que mandó el backend, o null si no se puede.
 *
 * La petición pide responseType 'blob', así que axios parsea TAMBIÉN las
 * respuestas de error como Blob: error.response.data no es un objeto sino un
 * Blob con el JSON adentro, y leer .message da undefined. El backend responde
 * {result, message} con 400/403/404
 * (isoq_server_py310, auth_server/controllers/core.py:489-498).
 */
async function backendMessageFrom (error) {
  if (!error || !error.response || !error.response.data) return null

  let text
  try {
    text = await readBlob(error.response.data)
  } catch (e) {
    return null
  }

  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed.message === 'string' && parsed.message.length) {
      return parsed.message
    }
  } catch (e) {
    // Un 502 de nginx devuelve HTML, no JSON.
  }
  return null
}

/**
 * Descarga el zip con los datos personales del usuario.
 *
 * Vive acá y no dentro de un componente porque lo usan dos pantallas: el
 * perfil y el modal de aceptación de términos, donde alguien que va a
 * rechazarlos todavía puede llevarse sus datos.
 *
 * @param {string} userId
 * @param {string} password - contraseña de la cuenta, la exige el backend
 * @throws {Error} con `backendMessage`: el texto que mandó el servidor, o
 *   null si no lo hay. Quien llame decide qué mostrar en ese caso.
 */
export async function downloadPersonalData (userId, password) {
  let response
  try {
    response = await Api.post(ENDPOINT, { user_id: userId, password: password }, { responseType: 'blob' })
  } catch (error) {
    const failure = new Error('personal data export failed')
    failure.backendMessage = await backendMessageFrom(error)
    failure.cause = error
    throw failure
  }

  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', FILENAME)
  document.body.appendChild(link)
  link.click()
  // Sin estas dos líneas queda un <a> huérfano por cada descarga y el blob
  // retenido en memoria mientras viva la pestaña.
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
