<template>
  <div>
    <InactivityWarning
      v-if="lockHeld"
      :visible="inactivityWarning"
      :seconds-left="inactivitySecondsLeft"
      message-key="lock.inactivity_message"
      @keep-working="keepWorkingOnInactivity" />
    <b-form-group
      :label="ui.label"
      :label-for="`${local_criteria}-criteria`"
      :description="ui.description">
      <b-form-textarea
        :disabled="isReadOnly"
        :id="`${local_criteria}-criteria`"
        rows="6"
        max-rows="100"
        @focus.native="onFocus"
        @blur.native="onBlur"
        v-model="local_data"></b-form-textarea>
      <small
        v-if="blockedBy"
        class="lock-notice d-block">
        {{ $t('lock.ref_locked_by', { user: blockedBy }) }}
      </small>
    </b-form-group>
    <div
      v-if="ui.canEdit"
      class="float-right">
      <b-button
        :disabled="saveState.loading || isReadOnly"
        variant="outline-success"
        @click="criteriaAction(local_criteria)">
        <b-spinner
          v-if="saveState.loading"
          small
          label="Saving"
          variant="success">
        </b-spinner>
        {{ saveState.loading_txt }}
      </b-button>
    </div>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import _debounce from 'lodash.debounce'
import LockService from '@/services/lockService'
import { criteriaLockKey } from '@/utils/criteriaLockKeys'
import { userDisplayName } from '@/utils/userDisplayName'
import editorInactivityMixin from '@/mixins/editorInactivityMixin'
import InactivityWarning from '@/components/common/InactivityWarning.vue'

// Gracia entre salir de la caja y soltar el lock. Sin ella, cualquier clic fuera del
// textarea —seleccionar texto, mirar el otro criterio, ir al botón Guardar— cede la
// caja mientras la persona sigue trabajando en ella. Es además más larga que el
// debounce de 1,5 s del autoguardado, así que lo pendiente se persiste antes de soltar.
const RELEASE_GRACE = 5000

// Entering a box tells the other one in this tab to let go (see onOtherBoxEntered).
const BOX_ENTERED = 'criteria-box-entered'

export default {
  name: 'Criteria',
  mixins: [editorInactivityMixin],
  components: { InactivityWarning },
  props: {
    canEdit: Boolean,
    label: String,
    description: String,
    dataTxt: String,
    criteria: String,
    // Listado crudo de locks vigentes del proyecto, tal como lo sondea el padre.
    // Se pasa entero y no ya resuelto porque su reemplazo ES la señal de que hay
    // verdad nueva: cada sondeo borra lo que este cliente creyó de primera mano.
    refLocks: {
      type: Array,
      default: () => []
    }
  },
  created: function () {
    this.local_criteria = this.criteria
    this.ui.canEdit = this.canEdit
    this.ui.label = this.label
    this.ui.description = this.description
    this.local_data = this.dataTxt

    this.saveCriteria = _debounce(function () { this.criteriaAction(this.local_criteria) }, 1500)
  },
  computed: {
    /** Clave de `ref_locks` de esta caja. Null si el criterio no es bloqueable. */
    lockKey: function () {
      return criteriaLockKey(this.criteria)
    },
    currentUserName: function () {
      return userDisplayName(this.$store && this.$store.state && this.$store.state.user)
    },
    /**
     * Dueño de esta caja según el último sondeo, descartando el lock propio.
     *
     * Se descarta por DOS caminos, y hacen falta los dos: el registro de LockService
     * sólo conoce los locks de esta pestaña, así que sin comparar además por nombre un
     * lock propio dejado en otra pestaña se lee como ajeno y la caja queda bloqueada
     * contra uno mismo, con el propio nombre en el cartel (medido en navegador).
     * Es la misma comparación que hace `studyLockState` para los estudios.
     */
    polledHolder: function () {
      // `refLocks` is read FIRST, before any early return. `LockService.refLocks` is a plain
      // Map, not reactive: returning on it without having read the prop left the prop out
      // of this computed's dependencies, and Vue kept that null cached for good. A tab that
      // had held the box never saw who took it next — the 409 blocked it, each poll
      // unblocked it, and the box flickered (#407, measured with two accounts).
      const locks = this.refLocks
      if (!this.lockKey || LockService.refLocks.has(this.lockKey)) return null
      const lock = locks.find(item => item.ref_id === this.lockKey)
      if (!lock || !lock.user_name) return null
      // By `user_id`: comparing names took another account with the same name for this one,
      // and every poll unblocked the box the acquire had just refused (#407). The name stays
      // only as the fallback for a server that does not send the id.
      const myId = this.$store && this.$store.state && this.$store.state.user && this.$store.state.user.id
      const mine = (lock.user_id && myId) ? lock.user_id === myId : lock.user_name === this.currentUserName
      return mine ? null : lock.user_name
    },
    /**
     * Quién más está editando esta caja, si alguien lo está.
     *
     * Lo de primera mano gana mientras dure: el 409 del propio acquire y el
     * `ref-lock-lost` llegan antes que el próximo sondeo. Pero no sobrevive a él —
     * ver el watcher de `refLocks`.
     */
    /** The save button of THIS box: it used to read the inclusion one in both. */
    saveState: function () {
      return this.ui.project[this.local_criteria === 'inclusion' ? 'inclusion' : 'exclusion']
    },
    blockedBy: function () {
      return this.lockDeniedBy || this.polledHolder
    },
    isReadOnly: function () {
      return !this.ui.canEdit || Boolean(this.blockedBy) || this.lockDenied
    }
  },
  watch: {
    /**
     * Un sondeo nuevo reemplaza lo que este cliente sabía por su cuenta.
     *
     * Sin esto la caja quedaba muerta: al fallar el acquire se deshabilita, y un
     * textarea deshabilitado ya no se puede enfocar, así que no habría segundo
     * intento aunque la otra persona la soltara un minuto después.
     */
    refLocks: function () {
      this.lockDenied = false
      this.lockDeniedBy = null
    },
    /**
     * Someone else just let go of this box: what they wrote is on the server, and this tab
     * only had the text it loaded. The read used to happen only on entering the box, so
     * whoever was just looking saw it released but still with the old text (#407).
     */
    polledHolder: function (holder, previous) {
      if (previous && !holder && !this.lockHeld) this.refreshFromServer()
    },
    canEdit: function (newVal) {
      this.ui.canEdit = newVal
    },
    dataTxt: {
      immediate: true,
      handler: function (newVal) {
        this.savedText = newVal || ''
        this.local_data = newVal || ''
      }
    },
    // Compared with what the server has, not with the prop: the prop is the copy this view
    // loaded, and a text read fresh from the server must not be saved back as an edit.
    local_data: function (newVal) {
      if (newVal !== this.savedText) {
        this.saveCriteria()
      }
    },
    // Holding the box is what keeps it from everybody else, so that is what the 30 min
    // without activity measure (the same rule as the modals): looking at another window no
    // longer releases it, and without this it would stay taken for good.
    lockHeld: function (held) {
      if (held) this.startInactivityWatch()
      else this.stopInactivityWatch()
    }
  },
  data: function () {
    return {
      ui: {
        canEdit: false,
        label: '',
        description: '',
        project: {
          inclusion: {
            success: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            error: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            loading: false,
            loading_txt: this.$t('common.save')
          },
          exclusion: {
            success: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            error: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            loading: false,
            loading_txt: this.$t('common.save')
          }
        }
      },
      local_data: '',
      // What the server has for this box, as far as this tab knows: the last text read or saved.
      savedText: '',
      local_criteria: '',
      releaseTimer: null,
      // Rechazo conocido de primera mano por este cliente.
      lockDeniedBy: null,
      // Rechazado sin dueño a quien nombrar (403: a este usuario le sacaron can_write).
      lockDenied: false,
      // Sólo es true mientras el servidor nos concedió esta caja: sin esto el blur
      // liberaría un lock que quizá tiene otra persona.
      lockHeld: false,
      // Si el cursor está dentro de la caja AHORA. Se sigue aparte de `lockHeld` porque
      // el usuario se va mucho antes de que el servidor conteste.
      focused: false,
      // The last blur was the window losing focus with this box held (see onWindowFocus).
      awayWithBox: false
    }
  },
  mounted: function () {
    window.addEventListener('ref-lock-lost', this.onRefLockLost)
    window.addEventListener('focus', this.onWindowFocus)
    window.addEventListener(BOX_ENTERED, this.onOtherBoxEntered)
  },
  beforeDestroy: function () {
    window.removeEventListener('ref-lock-lost', this.onRefLockLost)
    window.removeEventListener('focus', this.onWindowFocus)
    window.removeEventListener(BOX_ENTERED, this.onOtherBoxEntered)
    // Cambiar de paso destruye este componente (el <b-tabs> de pasos es `lazy`): la
    // caja tiene que quedar libre ya, sin esperar la gracia que sirve para los clics.
    this.flushAndRelease()
  },
  methods: {
    /**
     * Pide el lock al entrar en la caja, no al guardar: así el rechazo llega antes de
     * que la persona escriba, y no después de haber redactado un párrafo.
     */
    onFocus: async function () {
      // Volver a la caja dentro de la gracia es seguir editando, no reentrar.
      this.cancelPendingRelease()
      this.focused = true
      this.awayWithBox = false
      window.dispatchEvent(new CustomEvent(BOX_ENTERED, { detail: { key: this.lockKey } }))
      if (!this.ui.canEdit || !this.lockKey) return
      if (!this.lockHeld) {
        const result = await LockService.acquireRef(this.$route.params.id, this.lockKey)
        if (!result || !result.success) {
          this.denyLock(result)
          return
        }
        this.lockHeld = true
        this.lockDeniedBy = null
        this.lockDenied = false
        // El lock llegó tarde: la persona ya se fue a la otra caja. Sin esto nadie lo
        // soltaría nunca, porque el blur pasó cuando todavía no teníamos nada que soltar.
        if (!this.focused) {
          this.scheduleRelease()
          return
        }
      }
      // Also when this tab already held it: the person may be coming back from another tab
      // of theirs where they kept writing.
      this.refreshFromServer()
    },
    denyLock: function (result) {
      this.lockDenied = true
      // Un 403 no tiene a quién culpar: nadie más lo tiene, este usuario perdió el
      // permiso de escritura. Anunciar un dueño ahí sería inventarlo.
      this.lockDeniedBy = (result && result.lockedBy) || null
      // El padre sondea cada 15 s; este rechazo es motivo para no esperarlos.
      this.$emit('lock-denied')
    },
    /**
     * Start from what the server has. This view loads the criteria once, so its copy goes
     * stale as soon as somebody else — or this same person in another tab — writes, and the
     * next keystroke saved that stale copy whole over theirs (#407). Read once we hold the
     * box: from then on nobody else can write it.
     *
     * Network only: a cached answer is exactly the stale copy this is here to replace.
     */
    refreshFromServer: async function () {
      // Edits of this tab not saved yet win: they are on their way to the server.
      if (this.local_data !== this.savedText) return
      const asked = this.local_data
      const response = await Api.get(`/isoqf_projects/${this.$route.params.id}`, null, { networkOnly: true })
        .catch(() => null)
      const project = response && (Array.isArray(response.data) ? response.data[0] : response.data)
      // The person started typing while the read was on its way: what they typed wins.
      if (!project || this.local_data !== asked) return
      const fresh = project[this.local_criteria] || ''
      this.savedText = fresh
      this.local_data = fresh
    },
    /**
     * El lock puede evaporarse en pleno tipeo: un latido fallido, o una concesión
     * offline que perdió la carrera al reconectar. Dejar la caja escribible sólo
     * llevaría a escribir un texto que nadie va a guardar.
     */
    onRefLockLost: function (event) {
      const detail = event.detail || {}
      if (detail.refId !== this.lockKey) return
      const wasHeld = this.lockHeld
      // Ya no es nuestro: soltarlo sería pedirle al servidor que suelte el de otro.
      this.lockHeld = false
      this.cancelPendingRelease()
      // Gone with nobody else holding it. The usual cause is another tab of this same
      // person: the server keeps ONE lock per person, so when that tab left the box it
      // deleted this tab's too. Nobody else is waiting for it: take it back in silence.
      if (wasHeld && detail.reason === 'lock_expired' && !detail.lockedBy) {
        this.retakeLock()
        return
      }
      this.lockDenied = true
      this.lockDeniedBy = detail.lockedBy || null
    },
    retakeLock: async function () {
      const result = await LockService.acquireRef(this.$route.params.id, this.lockKey)
      if (result && result.success) {
        this.lockHeld = true
        return
      }
      this.denyLock(result)
    },
    /**
     * 30 min without activity. Persist first, release second — the same order as leaving
     * the step — and take the cursor out of the box, so coming back is entering again: a
     * new lock and a fresh read, not typing into a box nobody holds.
     */
    onInactivityExpired: function () {
      this.focused = false
      this.flushAndRelease()
      const box = this.$el && this.$el.querySelector('textarea')
      if (box && document.activeElement === box) box.blur()
      if (this.$notify) this.$notify.warning(this.$t('lock.inactivity_released'))
    },
    onBlur: function () {
      // The page itself lost focus: the person went to another window, tab or app — a PDF,
      // NVivo — and is still working in this box. Releasing here handed it to somebody else,
      // whose text this tab then overwrote on coming back (#407). Coming back fires `focus`.
      if (typeof document !== 'undefined' && document.hasFocus && !document.hasFocus()) {
        this.awayWithBox = true
        return
      }
      this.focused = false
      // Se programa siempre, aunque todavía no tengamos el lock: si llega mientras corre
      // la gracia, este mismo temporizador lo suelta. `flushAndRelease` es inocuo cuando
      // no hay nada que soltar.
      this.scheduleRelease()
    },
    /**
     * The window came back after a blur that kept the box. If the cursor did not come back
     * here — the person clicked straight into the other box, or anywhere else — this box
     * got no further focus or blur, and nothing would release it: one person ended up
     * holding both (#407). Same 5 s grace as leaving the box inside the page.
     *
     * Checked a tick later: the window's `focus` arrives before the element's.
     */
    onWindowFocus: function () {
      if (!this.awayWithBox) return
      setTimeout(() => {
        if (!this.awayWithBox) return
        this.awayWithBox = false
        const box = this.$el && this.$el.querySelector('textarea')
        if (box && document.activeElement === box) return
        this.focused = false
        this.scheduleRelease()
      }, 0)
    },
    /**
     * The person entered the other box: they left this one. Released now, not after the
     * 5 s grace — that grace is for clicks around this box. With it, going from one box to
     * the other held BOTH for 5 s, and switching back and forth kept renewing it, so the
     * other person saw one person in both boxes (#407, measured).
     */
    onOtherBoxEntered: function (event) {
      const key = event && event.detail && event.detail.key
      if (key === this.lockKey) return
      if (!this.lockHeld && !this.releaseTimer) return
      this.focused = false
      this.awayWithBox = false
      this.flushAndRelease()
    },
    scheduleRelease: function () {
      this.cancelPendingRelease()
      this.releaseTimer = setTimeout(this.flushAndRelease, RELEASE_GRACE)
    },
    cancelPendingRelease: function () {
      if (this.releaseTimer) clearTimeout(this.releaseTimer)
      this.releaseTimer = null
    },
    /**
     * Persiste lo pendiente y recién ahí suelta la caja. El orden importa: el
     * autoguardado con debounce sobrevive a la destrucción del componente, así que
     * soltar primero dejaría una escritura viajando sin lock detrás.
     */
    flushAndRelease: function () {
      this.cancelPendingRelease()
      if (this.saveCriteria) this.saveCriteria.flush()
      if (!this.lockHeld) return
      this.lockHeld = false
      LockService.releaseRef(this.lockKey)
    },
    loadData: function () {
      this.local_data = this.dataTxt
      this.local_criteria = this.criteria
      this.ui.canEdit = this.canEdit
      this.ui.label = this.label
      this.ui.description = this.description
    },
    /** The server refused the write because somebody else holds the box (#407). */
    isCriteriaLockRejection: function (error) {
      const response = error && error.response
      return Boolean(response && response.status === 409 && response.data &&
        response.data.reason === 'locked_by_other_user')
    },
    onSaveRefused: function (error) {
      this.lockHeld = false
      this.cancelPendingRelease()
      this.lockDenied = true
      this.lockDeniedBy = error.response.data.locked_by || null
    },
    printErrors: function (error) {
      console.error(error)
    },
    /**
     * Only the tab that holds the box writes it. One that lost it, or never got it, would be
     * writing over whoever has it now.
     *
     * But a box that is enabled and has no lock here can still be typed into: the acquire on
     * entering lost a race, the box was disabled with the cursor inside — Chrome keeps it
     * there without a `blur` — and the next poll enabled it again, so typing fires no `focus`.
     * That save used to stay on «Saving…» for good (#407). It asks for the lock instead.
     */
    ensureLockForSave: async function () {
      const result = await LockService.acquireRef(this.$route.params.id, this.lockKey)
      if (!result || !result.success) {
        this.denyLock(result)
        return false
      }
      this.lockHeld = true
      this.lockDeniedBy = null
      this.lockDenied = false
      return true
    },
    criteriaAction: function (type, action = '') {
      if (!this.ui.canEdit || this.isReadOnly) return
      // With the lock already here the PATCH goes out in this same tick: `flushAndRelease`
      // flushes the pending save and releases right after, and the write must leave first.
      if (this.lockHeld || !this.lockKey) return this.sendCriteria(type, action)
      return this.ensureLockForSave().then(ok => (ok ? this.sendCriteria(type, action) : undefined))
    },
    sendCriteria: function (type, action) {
      const state = this.ui.project[type === 'inclusion' ? 'inclusion' : 'exclusion']
      const sent = action === 'clean' ? '' : (this.local_data || '')
      const params = { [type === 'inclusion' ? 'inclusion' : 'exclusion']: sent }
      state.loading = true
      state.loading_txt = this.$t('common.saving')
      return Api.patch(`/isoqf_projects/${this.$route.params.id}`, params)
        .then(() => {
          this.savedText = sent
          state.success.dismissCountDown = state.success.dismissSecs
          this.ui.project.type = type
          this.$emit('criteria-saved', { field: type, value: this.local_data })
        })
        .catch((error) => {
          if (this.isCriteriaLockRejection(error)) {
            this.onSaveRefused(error)
            return
          }
          this.printErrors(error)
          state.error.show = true
        })
        .finally(() => {
          state.loading = false
          state.loading_txt = this.$t('common.save')
        })
    }
  }
}
</script>
