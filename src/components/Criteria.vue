<template>
  <div>
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
        class="text-warning d-block">
        {{ $t('lock.ref_locked_by', { user: blockedBy }) }}
      </small>
    </b-form-group>
    <div
      v-if="ui.canEdit"
      class="float-right">
      <b-button
        :disabled="ui.project.inclusion.loading || isReadOnly"
        variant="outline-success"
        @click="criteriaAction(local_criteria)">
        <b-spinner
          v-if="ui.project.inclusion.loading"
          small
          label="Saving"
          variant="success">
        </b-spinner>
        {{ ui.project.inclusion.loading_txt }}
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

// Gracia entre salir de la caja y soltar el lock. Sin ella, cualquier clic fuera del
// textarea —seleccionar texto, mirar el otro criterio, ir al botón Guardar— cede la
// caja mientras la persona sigue trabajando en ella. Es además más larga que el
// debounce de 1,5 s del autoguardado, así que lo pendiente se persiste antes de soltar.
const RELEASE_GRACE = 5000

export default {
  name: 'Criteria',
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
      if (!this.lockKey || LockService.refLocks.has(this.lockKey)) return null
      const lock = this.refLocks.find(item => item.ref_id === this.lockKey)
      if (!lock || !lock.user_name) return null
      return lock.user_name === this.currentUserName ? null : lock.user_name
    },
    /**
     * Quién más está editando esta caja, si alguien lo está.
     *
     * Lo de primera mano gana mientras dure: el 409 del propio acquire y el
     * `ref-lock-lost` llegan antes que el próximo sondeo. Pero no sobrevive a él —
     * ver el watcher de `refLocks`.
     */
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
    canEdit: function (newVal) {
      this.ui.canEdit = newVal
    },
    dataTxt: {
      immediate: true,
      handler: function (newVal) {
        this.local_data = newVal || ''
      }
    },
    local_data: function (newVal) {
      if (newVal !== this.dataTxt) {
        this.saveCriteria()
      }
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
      focused: false
    }
  },
  mounted: function () {
    window.addEventListener('ref-lock-lost', this.onRefLockLost)
  },
  beforeDestroy: function () {
    window.removeEventListener('ref-lock-lost', this.onRefLockLost)
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
      if (!this.ui.canEdit || !this.lockKey) return
      if (this.lockHeld) return
      const result = await LockService.acquireRef(this.$route.params.id, this.lockKey)
      if (result && result.success) {
        this.lockHeld = true
        this.lockDeniedBy = null
        this.lockDenied = false
        // El lock llegó tarde: la persona ya se fue a la otra caja. Sin esto nadie lo
        // soltaría nunca, porque el blur pasó cuando todavía no teníamos nada que soltar.
        if (!this.focused) this.scheduleRelease()
        return
      }
      this.lockDenied = true
      // Un 403 no tiene a quién culpar: nadie más lo tiene, este usuario perdió el
      // permiso de escritura. Anunciar un dueño ahí sería inventarlo.
      this.lockDeniedBy = (result && result.lockedBy) || null
      // El padre sondea cada 15 s; este rechazo es motivo para no esperarlos.
      this.$emit('lock-denied')
    },
    /**
     * El lock puede evaporarse en pleno tipeo: un latido fallido, o una concesión
     * offline que perdió la carrera al reconectar. Dejar la caja escribible sólo
     * llevaría a escribir un texto que nadie va a guardar.
     */
    onRefLockLost: function (event) {
      const detail = event.detail || {}
      if (detail.refId !== this.lockKey) return
      // Ya no es nuestro: soltarlo sería pedirle al servidor que suelte el de otro.
      this.lockHeld = false
      this.cancelPendingRelease()
      this.lockDenied = true
      this.lockDeniedBy = detail.lockedBy || null
    },
    onBlur: function () {
      this.focused = false
      // Se programa siempre, aunque todavía no tengamos el lock: si llega mientras corre
      // la gracia, este mismo temporizador lo suelta. `flushAndRelease` es inocuo cuando
      // no hay nada que soltar.
      this.scheduleRelease()
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
    printErrors: function (error) {
      console.error(error)
    },
    criteriaAction: function (type, action = '') {
      let params = {}
      if (type === 'inclusion') {
        this.ui.project.inclusion.loading = true
        this.ui.project.inclusion.loading_txt = this.$t('common.saving')
        params.inclusion = this.local_data || ''
        if (action === 'clean') {
          params.inclusion = ''
        }
      } else {
        this.ui.project.exclusion.loading = true
        this.ui.project.exclusion.loading_txt = this.$t('common.saving')
        params.exclusion = this.local_data || ''
        if (action === 'clean') {
          params.exclusion = ''
        }
      }
      if (this.ui.canEdit && !this.isReadOnly) {
        Api.patch(`/isoqf_projects/${this.$route.params.id}`, params)
          .then((response) => {
            if (type === 'inclusion') {
              this.ui.project.inclusion.loading = false
              this.ui.project.inclusion.loading_txt = this.$t('common.save')
              this.ui.project.inclusion.success.dismissCountDown = this.ui.project.inclusion.success.dismissSecs
              this.ui.project.type = 'inclusion'
              // this.getProject()
            }
            if (type === 'exclusion') {
              this.ui.project.exclusion.loading = false
              this.ui.project.exclusion.loading_txt = this.$t('common.save')
              this.ui.project.exclusion.success.dismissCountDown = this.ui.project.exclusion.success.dismissSecs
              this.ui.project.type = 'exclusion'
              // this.getProject()
            }
            this.$emit('criteria-saved', { field: type, value: this.local_data })
          })
          .catch((error) => {
            this.printErrors(error)
            if (type === 'inclusion') {
              this.ui.project.inclusion.error.show = true
            }
            if (type === 'exclusion') {
              this.ui.project.exclusion.error.show = true
            }
          })
      }
    }
  }
}
</script>
