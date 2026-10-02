/**
 * Quién más está trabajando en este estudio, contando las otras pestañas de la MISMA
 * persona.
 *
 * El problema que resuelve, medido contra el backend: `acquire_ref_lock` **refresca** el
 * lock cuando el `user_id` coincide, así que abrir el mismo estudio en dos pestañas
 * devuelve `success` en las dos y ambas creen tenerlo. Y `GET /refs` expone sólo
 * `user_name`, sin `user_id` ni id de sesión, así que el frontend no puede distinguirlas.
 *
 * Sin esto, el temporizador convierte ese empate en pérdida de datos: la pestaña que dejé
 * de fondo expira, guarda SU copia vieja y borra el único lock que hay, mientras la otra
 * —donde estoy escribiendo— se queda sin lock y sin enterarse. Hoy no pasa porque nadie
 * libera solo; con el temporizador es el resultado esperable de dejar una pestaña abierta.
 *
 * Se coordina por `localStorage`, que es el canal que `lockService` ya usa para detectar
 * el logout en otra pestaña. Cada pestaña publica su propio `lastActivityAt`; la que está
 * por expirar mira si alguna otra tiene actividad más reciente que la suya.
 *
 * Todo falla hacia "no hay nadie más": si no se puede leer el `localStorage` (modo
 * privado, cuota llena, JSON corrupto), trabar la liberación sería peor que el bug que
 * esto evita — volveríamos a dejar estudios tomados para siempre.
 */

const PREFIX = 'editor_active_'

// Entradas más viejas que esto no dicen nada útil y sólo hacen crecer la clave.
const STALE_MS = 10 * 60 * 1000

/**
 * Identidad de ESTA pestaña. Vive en memoria a propósito: si se guardara en
 * `localStorage` las dos pestañas compartirían el id y no habría forma de distinguirlas,
 * que es justamente lo que hace falta.
 */
let tabId = null

function currentTabId () {
  if (tabId) return tabId
  const buf = new Uint32Array(2)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf)
  }
  tabId = `t${buf[0].toString(36)}${buf[1].toString(36)}`
  return tabId
}

function read (refId) {
  try {
    const raw = localStorage.getItem(PREFIX + refId)
    const parsed = raw ? JSON.parse(raw) : null
    return (parsed && typeof parsed === 'object') ? parsed : {}
  } catch (e) {
    return {}
  }
}

/** Publica la última actividad de esta pestaña sobre `refId`. */
export function announcePresence (refId, lastActivityAt) {
  if (!refId) return
  try {
    const now = Date.now()
    const entries = read(refId)
    entries[currentTabId()] = lastActivityAt || now
    Object.keys(entries).forEach((id) => {
      if (now - entries[id] > STALE_MS) delete entries[id]
    })
    localStorage.setItem(PREFIX + refId, JSON.stringify(entries))
  } catch (e) {
    // Sin presencia publicada, la otra pestaña decidirá como si estuviéramos solos.
  }
}

/** Borra la marca de esta pestaña; el resto queda intacto. */
export function clearPresence (refId) {
  if (!refId) return
  try {
    const entries = read(refId)
    delete entries[currentTabId()]
    if (Object.keys(entries).length) localStorage.setItem(PREFIX + refId, JSON.stringify(entries))
    else localStorage.removeItem(PREFIX + refId)
  } catch (e) {
    // Nada que hacer: la entrada caduca sola por STALE_MS.
  }
}

/**
 * ¿Hay otra pestaña con actividad más reciente que `since` sobre este estudio?
 *
 * `since` es la última actividad de la pestaña que pregunta: la comparación es "alguien
 * estuvo trabajando después que yo", no "alguien existe".
 */
export function otherTabActiveOn (refId, since) {
  if (!refId) return false
  const mine = currentTabId()
  const entries = read(refId)
  return Object.keys(entries).some(id => id !== mine && entries[id] > (since || 0))
}

/** Sólo para tests: olvida la identidad de pestaña para simular otra. */
export function resetTabIdentityForTests () {
  tabId = null
}
