import axios from 'axios'
import { store } from '../store'
import Api from '@/utils/Api'

// Mismo período que el latido de los locks, y por la misma razón: el TTL del
// servidor (`PRESENCE_TIMEOUT`, 180 s) está dimensionado para tolerar tres pings
// perdidos, que es el peor caso del *intensive throttling* de Chrome en pestañas
// ocultas. Si esto cambia, avisarle a backend.
const PRESENCE_PING_INTERVAL = 30000

/**
 * Presencia por hallazgo: informa quién está adentro, sin bloquear a nadie.
 *
 * Módulo aparte de `lockService` a propósito. Aquél gestiona exclusión mutua: puede
 * negar, tiene desalojos, emite `ref-lock-lost` y sostiene un mapa de claves. Éste
 * por contrato no puede negar nada, así que no comparte ningún invariante con él;
 * mezclarlos obligaría a cada lectura de aquel archivo —que ya pasa las 500 líneas—
 * a preguntarse cuál de las dos cosas está mirando.
 *
 * Una sola presencia viva por pestaña: se está en un hallazgo o en ninguno.
 */
class PresenceService {
  constructor () {
    this.projectId = null
    this.findingId = null
    this.timer = null

    this.ping = this.ping.bind(this)
    this.revalidate = this.revalidate.bind(this)

    if (typeof window !== 'undefined') {
      // Cerrar la pestaña no dispara `beforeDestroy`. Es best-effort, igual que el
      // release de los locks: el TTL del servidor es la red de abajo.
      window.addEventListener('pagehide', () => { this.leave() })
    }
    if (typeof document !== 'undefined' && document.addEventListener) {
      // Chrome ralentiza `setInterval` en pestañas ocultas hasta un disparo por
      // minuto. Volver al frente es el momento en que la persona retoma el trabajo y
      // en que más importa que los demás la sigan viendo.
      document.addEventListener('visibilitychange', this.revalidate)
    }
  }

  get isEnabled () {
    const flag = process.env.ENABLE_CONCURRENCY_CONTROL
    return flag === 'true' || flag === 'on' || flag === true
  }

  /** Marca presencia en un hallazgo y arranca el ping. Suelta el anterior, si había. */
  async enter (projectId, findingId) {
    if (!this.isEnabled || !projectId || !findingId) return
    if (this.findingId && this.findingId !== findingId) await this.leave()

    this.projectId = projectId
    this.findingId = findingId
    await this.ping()

    if (!this.timer) this.timer = setInterval(this.ping, PRESENCE_PING_INTERVAL)
  }

  /**
   * El POST es alta y latido a la vez.
   *
   * Sin conexión no se manda ni se encola: una presencia es una afirmación sobre el
   * presente, y reproducirla al reconectar diría que alguien está donde ya no está.
   * Es la diferencia con las mutaciones de negocio, que sí se encolan en `Api`.
   */
  async ping () {
    if (!this.projectId || !this.findingId) return
    if (store && store.state && !store.state.isOnline) return
    try {
      await axios.post(`/api/presence/${this.projectId}/${this.findingId}`, {},
        { headers: Api.getHeaders() })
    } catch (e) {
      // Saber quién está adentro es accesorio; nada de lo que llama a esto debe caer
      // por un fallo de red suyo.
    }
  }

  revalidate () {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      this.ping()
    }
  }

  /** Sale del hallazgo. Idempotente: el servidor acepta el DELETE de más. */
  async leave () {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    const { projectId, findingId } = this
    this.projectId = null
    this.findingId = null
    if (!this.isEnabled || !projectId || !findingId) return
    try {
      await axios.delete(`/api/presence/${projectId}/${findingId}`,
        { headers: Api.getHeaders() })
    } catch (e) {
      // El TTL del servidor lo limpia igual.
    }
  }

  /**
   * Quiénes están en cada hallazgo del proyecto.
   *
   * Devuelve `[]` ante cualquier fallo y nunca lanza: los llamadores lo invocan
   * desde cadenas que no tienen `.catch` propio, y ahí un throw se traga en silencio
   * todo lo que sigue — el mismo modo de falla que documenta
   * `editList.fetchAndUpdateRefLocks`.
   */
  async fetch (projectId) {
    if (!this.isEnabled || !projectId) return []
    try {
      const response = await axios.get(`/api/presence/${projectId}`,
        { headers: Api.getHeaders() })
      const data = response && response.data
      return (data && Array.isArray(data.present)) ? data.present : []
    } catch (e) {
      return []
    }
  }
}

export default new PresenceService()
