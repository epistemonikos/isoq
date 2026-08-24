<template>
  <b-modal id="modal-edit-reference" ref="modal-edit-reference" :title="modalTitle" size="xl" @ok="handleModalOk"
    @hidden="resetModal" @shown="onModalShownAll" header-bg-variant="custom-blue" no-close-on-esc
    no-close-on-backdrop>
    <template v-if="localReference">
      <b-alert v-if="isReadOnly && !isOffline" show variant="warning" class="mb-3"
        data-testid="reference-readonly-notice">
        <font-awesome-icon icon="lock" class="mr-1" />
        {{ lockedByUser
          ? $t('lock.ref_locked_by', { user: lockedByUser })
          : $t('lock.ref_locked_by_no_user') }}
      </b-alert>
      <b-alert v-if="isReadOnly && isOffline" show variant="secondary" class="mb-3">
        {{ $t('lock.ref_lock_offline') }}
      </b-alert>
      <!--
        Fuera del fieldset a propósito: adentro, el botón "Sigo trabajando" quedaría
        deshabilitado exactamente cuando el editor está en solo lectura.
      -->
      <InactivityWarning
        :visible="inactivityWarning"
        :seconds-left="inactivitySecondsLeft"
        @keep-working="keepWorkingOnInactivity" />
      <fieldset :disabled="isReadOnly" class="border-0 p-0 m-0">
      <b-row>
        <!-- Menú flotante a la izquierda -->
        <b-col cols="3" class="menu-sidebar">
          <b-button size="sm" variant="success" class="mb-2 w-100" @click="$refs.customFieldsManager.addField()">
            <font-awesome-icon icon="plus" class="mr-1"></font-awesome-icon>
            {{ $t('camelot.step_three.modal.add_field_button') }}
          </b-button>
          <div class="sticky-menu p-2">
            <div class="menu-section-title mb-1">{{ $t('camelot.step_three.study_characteristics') }}</div>
            <div class="menu-section mb-0" v-if="customFields.length > 0">
              <div v-for="(field, index) in customFields" :key="'menu-custom-' + index" class="menu-item"
                :class="{ 'active-menu-item': activeSection === 'custom-field-' + index }"
                @click="scrollToSection('custom-field-' + index)">
                <div class="d-flex align-items-center">
                  <span class="text-truncate mr-1">
                    {{ field.isCamelot ? (field.categoryLabel || field.label) : (field.label ||
                      $t('camelot.step_three.modal.no_title')) }}
                  </span>
                  <img v-if="field.isCamelot" :src="camelotLogo" class="flex-shrink-0" width="16" height="16"
                    v-b-tooltip.hover="$t('camelot.step_three.camelot_field')" />
                </div>
              </div>
            </div>
          </div>
        </b-col>

        <!-- Contenido del formulario -->
        <b-col cols="9">
          <!-- Campos unificados -->
          <div class="mb-4">
            <CustomFieldsManager ref="customFieldsManager" v-model="customFields" @change="onFieldChanged" :with-values="true"
              :show-header="false"
              :show-add-button="false"
              :add-button-text="$t('camelot.step_three.modal.add_field_button')"
              :empty-text="$t('camelot.step_three.modal.no_custom_fields')"
              :move-instruction-text="$t('camelot.step_three.modal.move_instruction')"
              :move-button-text="$t('camelot.step_three.modal.move_button')"
              :delete-button-text="$t('camelot.step_three.delete_button')"
              :label-text="$t('camelot.step_three.modal.title_label')"
              :content-label-text="$t('camelot.step_three.modal.content_label')"
              :placeholder-label="$t('camelot.step_three.modal.field_title_placeholder')"
              :placeholder-value="$t('camelot.step_three.modal.field_content_placeholder')" id-prefix="custom-field-" />
          </div>
        </b-col>
      </b-row>
      </fieldset>
    </template>
    <template v-else>
      <b-alert show variant="info">{{ $t('camelot.step_three.modal.no_selection') }}</b-alert>
    </template>

    <template #modal-footer="{ ok, cancel }">
      <span v-if="autoSaveStatus === 'saving'" class="text-muted mr-auto small align-self-center">
        <b-spinner small></b-spinner> {{ $t('common.auto_saving') }}
      </span>
      <span v-else-if="autoSaveStatus === 'saved'" class="text-success mr-auto small align-self-center">
        <font-awesome-icon icon="check"></font-awesome-icon> {{ $t('common.auto_saved') }}
      </span>
      <span v-else class="mr-auto"></span>
      <b-button size="md" variant="secondary" @click="cancel()" :disabled="isSaving">
        {{ $t('common.cancel') }}
      </b-button>
      <b-button size="md" variant="primary" @click="ok()" :disabled="isSaving || hasInvalidCustomFields || isReadOnly">
        <b-spinner v-if="isSaving" small></b-spinner>
        {{ $t('camelot.step_three.modal.save_button') }}
      </b-button>
    </template>
    <RefLockConflictModal
      ref="conflictModal"
      :locked-by="conflictLockedBy"
      :failed-data="conflictData || {}"
      :ref-id="conflictRefId"
      :source="conflictSource"
      @closed="clearConflict"
    />
  </b-modal>
</template>

<script>
import Api from '@/utils/Api'
import LockService from '@/services/lockService'
import { isLockRejection } from '@/utils/lockErrors'
import Commons from '@/utils/commons'
import { isCustomField, newCustomFieldKey } from '@/utils/customFieldsHelper'
import _debounce from 'lodash.debounce'
import editorInactivityMixin from '@/mixins/editorInactivityMixin'
import { announcePresence, clearPresence, otherTabActiveOn } from '@/utils/editorPresence'

export default {
  name: 'EditReferenceModal',
  components: {
    CustomFieldsManager: () => import('./CustomFieldsManager.vue'),
    RefLockConflictModal: () => import('./RefLockConflictModal.vue'),
    InactivityWarning: () => import('@/components/common/InactivityWarning.vue')
  },
  mixins: [editorInactivityMixin],
  props: {
    reference: {
      type: Object,
      default: null
    },
    charsData: {
      type: Object,
      required: true
    },
    camelot: {
      type: Object,
      required: true
    },
    visibleColumnKeys: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      camelotLogo: require('@/assets/camelot-logo.svg'),
      localReference: null,
      editForm: {},
      customFields: [],
      activeSection: null,
      observer: null,
      isSaving: false,
      // El 409 de un guardado en vuelo llega DESPUÉS de que el modal se cerró, y para
      // entonces `localReference` ya es null: sin esto el guard descarta el conflicto y
      // el texto rechazado se pierde de vista (queda en localStorage y nadie lo lee).
      // Se consume una sola vez porque `ref-lock-conflict` también se emite por 403 y
      // por el replay de la cola: dejarlo vivo abriría el modal sobre un editor cerrado.
      pendingConflictRefId: '',
      // "Cerrá el editor pero NO sueltes el lock": lo usa el caso de la otra pestaña de
      // la misma persona. Sin esto, cerrar por cualquier vía llama a releaseRef y le saca
      // el estudio a quien está escribiendo del otro lado.
      skipReleaseOnClose: false,
      autoSaveStatus: null,
      isReadOnly: false,
      lockedByUser: null,
      isOffline: false,
      conflictData: null,
      conflictLockedBy: '',
      conflictRefId: '',
      conflictSource: 'live'
    }
  },
  computed: {
    modalTitle () {
      if (this.localReference) {
        const authorInfo = Commons.parseReference(this.localReference, true, false)
        return `${this.$t('camelot.step_three.modal.title', { reference_id: authorInfo })}`
      }
      return this.$t('camelot.step_three.modal.title')
    },
    hasInvalidCustomFields () {
      return this.customFields.some(f => !f.isCamelot && !f.locked && (!f.label || !f.label.trim()))
    }
  },
  created () {
    this.autoSaveDebounced = _debounce(function () { this.performSave(false) }.bind(this), 1500)
  },
  mounted () {
    window.addEventListener('ref-lock-conflict', this.handleRefLockConflict)
    // The conflict listener only fires on a rejected save. This one fires the moment
    // the lock is gone, so the fields stop accepting input before that.
    window.addEventListener('ref-lock-lost', this.handleRefLockLost)
  },
  beforeDestroy () {
    window.removeEventListener('ref-lock-conflict', this.handleRefLockConflict)
    window.removeEventListener('ref-lock-lost', this.handleRefLockLost)
  },
  watch: {
    reference: {
      immediate: true,
      handler (newVal) {
        if (newVal) {
          this.localReference = { ...newVal }
          this.editForm = { ...newVal }
          this.initializeCustomFields(newVal)
        } else {
          this.resetModal()
        }
      }
    },
    customFields: {
      handler () {
        if (this.observer) {
          this.$nextTick(() => {
            this.initScrollSpy()
          })
        }
      }
    }
  },
  methods: {
    show () {
      this.$bvModal.show('modal-edit-reference')
    },
    hide () {
      this.$bvModal.hide('modal-edit-reference')
    },
    onModalShownAll () {
      this.initScrollSpy()
      this.onModalShown()
    },
    async onModalShown () {
      if (!this.localReference) return
      // Nueva sesión de edición: el conflicto que quedó esperando ya no aplica.
      this.pendingConflictRefId = ''
      const result = await LockService.acquireRef(
        this.$route.params.id,
        this.localReference.id
      )
      if (result.success) {
        this.isReadOnly = false
        this.lockedByUser = null
        // Sólo con el lock en la mano: sin él no hay nada que liberar y la cuenta
        // regresiva sería una amenaza vacía. No hace falta consultar un `canEdit` —
        // acá no existe como prop, y el permiso ya está resuelto en este resultado.
        if (LockService.isEnabled) this.startInactivityWatch()
      } else if (result.permissionDenied) {
        // Nobody else is editing this study — this user's own can_write was
        // revoked. Don't reuse the "locked by X" message, there is no X.
        this.isReadOnly = true
        this.lockedByUser = null
        if (this.$notify) {
          this.$notify.warning(this.$t('lock.permissions_revoked'))
        }
      } else {
        this.isReadOnly = true
        this.lockedByUser = result.lockedBy || null
        if (this.$notify) {
          this.$notify.warning(this.$t('lock.ref_locked_by', { user: this.lockedByUser }))
        }
      }
    },
    handleRefLockLost (event) {
      const detail = (event && event.detail) || {}
      const refId = this.localReference && this.localReference.id
      if (!detail.refId || detail.refId !== refId) return
      this.isReadOnly = true
      // The heartbeat's 409 carries no holder; the banner falls back to a neutral
      // wording rather than hiding itself.
      this.lockedByUser = detail.lockedBy || null
      // Sin lock no queda nada que soltar: el reloj perdió su razón de ser.
      this.stopInactivityWatch()
    },
    /**
     * Thirty minutes with nobody typing. Persist first, close second: the modal's
     * `@hidden` releases the lock, so a save fired after it would travel with no lock
     * behind it and come back 409. Same ordering as Criteria.flushAndRelease.
     */
    /** Publica que esta pestaña sigue con el estudio abierto, y desde cuándo. */
    onInactivityHeartbeat (lastActivityAt) {
      announcePresence(this.localReference && this.localReference.id, lastActivityAt)
    },
    onInactivityExpired (lastActivityAt) {
      // Otra pestaña de la MISMA persona puede tener este estudio abierto y activo: el
      // backend refresca el lock cuando el user_id coincide, así que las dos creen
      // tenerlo, y /refs no expone con qué sesión distinguirlas. Liberarlo acá se lo
      // sacaría a quien está escribiendo, y guardar nuestra copia vieja pisaría lo suyo.
      const refId = this.localReference && this.localReference.id
      if (otherTabActiveOn(refId, lastActivityAt)) {
        this.skipReleaseOnClose = true
        this.stopInactivityWatch()
        this.hide()
        this.resetModal()
        return
      }
      try {
        // A lost lock has nothing to save — performSave would bail on isReadOnly anyway,
        // but saying it here is what makes the intent testable.
        if (!this.isReadOnly && this.autoSaveDebounced) this.autoSaveDebounced.flush()
      } finally {
        // A throwing flush must not keep the modal open holding the lock: that is the
        // worst possible ending for a mechanism whose only purpose is to release it.
        if (this.$notify) this.$notify.warning(this.$t('lock.inactivity_released'))
        this.hide()
        // Igual que en StepFour: el `@hidden` puede no llegar (depende de
        // `transitionend`, que no corre con la pestaña oculta) y ahí es donde vive el
        // releaseRef. `resetModal` es idempotente, así que llamarlo de más no molesta.
        this.resetModal()
      }
    },
    /** Recuerda a quién esperar un 409 que va a llegar después del cierre. */
    retainConflictTarget () {
      if (!this.isSaving) return
      this.pendingConflictRefId = (this.localReference && this.localReference.id) || ''
    },
    handleRefLockConflict (event) {
      const { refId, failedData, lockedBy, source } = event.detail
      const open = this.localReference && this.localReference.id
      const expected = refId === open || (refId && refId === this.pendingConflictRefId)
      if (!expected) return
      // Consumido: un segundo conflicto sobre el mismo estudio ya no nos incumbe.
      this.pendingConflictRefId = ''
      this.conflictData = failedData
      this.conflictLockedBy = lockedBy
      this.conflictRefId = refId
      this.conflictSource = source || 'live'
      this.$nextTick(() => {
        if (this.$refs.conflictModal) this.$refs.conflictModal.show()
      })
    },
    clearConflict () {
      this.conflictData = null
      this.conflictLockedBy = ''
      this.conflictRefId = ''
      this.conflictSource = 'live'
    },
    resetModal () {
      clearPresence(this.localReference && this.localReference.id)
      this.stopInactivityWatch()
      const suelta = !this.skipReleaseOnClose
      this.skipReleaseOnClose = false
      // Antes de perder localReference, que es contra lo que compara el guard.
      this.retainConflictTarget()
      if (suelta) LockService.releaseRef()
      this.destroyScrollSpy()
      if (this.autoSaveDebounced) this.autoSaveDebounced.cancel()
      this.editForm = {}
      this.customFields = []
      this.activeSection = null
      this.localReference = null
      this.isSaving = false
      this.autoSaveStatus = null
      this.isReadOnly = false
      this.lockedByUser = null
      this.isOffline = false
      this.$emit('close')
    },
    initScrollSpy () {
      this.destroyScrollSpy()

      this.$nextTick(() => {
        // Usamos una zona de detección muy estrecha cerca del tope (20% del viewport)
        // Esto actúa como una "línea de disparo" más que como un área
        const options = {
          root: null,
          rootMargin: '-120px 0px -75% 0px',
          threshold: 0
        }

        // Mapa para rastrear qué elementos están cruzando la línea de activación
        const visibleSections = new Map()

        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              visibleSections.set(entry.target.id, entry.boundingClientRect.top)
            } else {
              visibleSections.delete(entry.target.id)
            }
          })

          if (visibleSections.size > 0) {
            // De los elementos que están en la zona activa, elegimos el que tenga el 'top' más pequeño
            // (el que esté más arriba)
            let topmostId = this.activeSection
            let minTop = Infinity

            visibleSections.forEach((top, id) => {
              if (top < minTop) {
                minTop = top
                topmostId = id
              }
            })

            if (this.activeSection !== topmostId) {
              this.activeSection = topmostId
            }
          }
        }, options)

        // Observar secciones
        const observeElements = () => {
          if (this.customFields) {
            this.customFields.forEach((_, index) => {
              const el = document.getElementById('custom-field-' + index)
              if (el) this.observer.observe(el)
            })
          }
        }

        observeElements()
      })
    },
    destroyScrollSpy () {
      if (this.observer) {
        this.observer.disconnect()
        this.observer = null
      }
    },
    initializeCustomFields (itemValues = null) {
      if (!this.charsData || !Array.isArray(this.charsData.fields)) {
        this.customFields = []
        return
      }

      const parsedFields = []

      this.charsData.fields.forEach(field => {
        // Skip system fields
        if (['authors', 'ref_id', 'actions', 'edit'].includes(field.key)) return
        // Skip comments as they are bundled with extractedData
        if (field.key.endsWith('_comments')) return

        const isCamelot = field.key.endsWith('_extractedData')

        const customFieldObj = {
          label: field.label || '',
          value: (itemValues && itemValues[field.key]) || '',
          key: field.key,
          locked: isCamelot,
          isCamelot: isCamelot,
          hasComments: false,
          commentsValue: '',
          commentsKey: '',
          categoryLabel: '',
          extractedDataLabel: '',
          commentsLabel: ''
        }

        if (isCamelot) {
          const commentsKey = field.key.replace('_extractedData', '_comments')
          customFieldObj.hasComments = true
          customFieldObj.commentsKey = commentsKey
          customFieldObj.commentsValue = (itemValues && itemValues[commentsKey]) || ''

          let categoryLabel = field.label
          let extractedDataLabel = this.$t('camelot.step_three.modal.content_label')
          let commentsLabel = this.$t('camelot.step_three.concerns_label') || 'Comments'

          if (this.camelot && this.camelot.categories) {
            const categoryMatch = this.camelot.categories.find(c => c.options && c.options.some(o => o.key === field.key))
            if (categoryMatch) {
              categoryLabel = categoryMatch.label
              const extOpt = categoryMatch.options.find(o => o.key === field.key)
              if (extOpt) extractedDataLabel = extOpt.label

              const concOpt = categoryMatch.options.find(o => o.key === commentsKey)
              if (concOpt) commentsLabel = concOpt.label
            }
          }

          customFieldObj.categoryLabel = categoryLabel
          customFieldObj.extractedDataLabel = extractedDataLabel
          customFieldObj.commentsLabel = commentsLabel
        }

        parsedFields.push(customFieldObj)
      })

      // Add any undefined custom fields that might only exist on the item
      if (itemValues) {
        Object.keys(itemValues).forEach(key => {
          if (isCustomField(key) && !parsedFields.find(cf => cf.key === key)) {
            parsedFields.push({
              label: key,
              value: itemValues[key] || '',
              key: key,
              locked: false,
              isCamelot: false,
              hasComments: false
            })
          }
        })
      }

      this.customFields = parsedFields
    },
    scrollToSection (id) {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        if (id.includes('custom-field-')) {
          element.classList.add('highlight-new-field')
          setTimeout(() => {
            element.classList.remove('highlight-new-field')
          }, 2000)
        }
      }
    },
    onFieldChanged () {
      this.autoSaveDebounced()
    },
    handleModalOk (bvModalEvent) {
      if (bvModalEvent) bvModalEvent.preventDefault()
      if (this.autoSaveDebounced) this.autoSaveDebounced.cancel()
      this.performSave(true)
    },
    performSave (closeAfter) {
      if (this.isSaving || this.isReadOnly) return
      this.isSaving = true
      if (!closeAfter) this.autoSaveStatus = 'saving'

      const item = {
        ref_id: this.localReference.id || '',
        authors: Commons.parseReference(this.localReference, true, false)
      }

      const newFieldsArray = []
      const generatedKeys = {}

      const systemFields = (this.charsData.fields || []).filter(field =>
        ['authors', 'ref_id', 'actions', 'edit'].includes(field.key)
      )

      this.customFields.forEach((field, index) => {
        if (field.label && field.label.trim() !== '') {
          let fieldKey = field.key
          if (!field.locked && (!fieldKey || !fieldKey.startsWith('column_'))) {
            fieldKey = newCustomFieldKey()
            generatedKeys[index] = fieldKey
          }

          item[fieldKey] = field.value || ''
          newFieldsArray.push({ key: fieldKey, label: field.label })

          if (field.hasComments) {
            item[field.commentsKey] = field.commentsValue || ''
            const existingCommentsField = this.charsData.fields.find(f => f.key === field.commentsKey)
            if (existingCommentsField) {
              newFieldsArray.push(existingCommentsField)
            } else {
              newFieldsArray.push({ key: field.commentsKey, label: this.$t('camelot.step_three.concerns_label') || 'Comments' })
            }
          }
        }
      })

      const customFieldsArray = [...systemFields, ...newFieldsArray]
      const serverFields = this.charsData.fields || []
      const customKeys = new Set(customFieldsArray.map(f => f.key))
      const mergedFields = [
        ...customFieldsArray,
        ...serverFields.filter(sf => !customKeys.has(sf.key))
      ]

      // Include `fields` in the body only when new columns were generated — the
      // backend PATCH-parcial endpoint updates just this item, and optionally the
      // shared `fields` list when present.
      const payload = Object.keys(generatedKeys).length > 0
        ? { ...item, fields: mergedFields }
        : item

      const apiCall = this.charsData.id
        ? Api.patch(`/isoqf_characteristics/${this.charsData.id}/item/${item.ref_id}`, payload)
        : Api.post('/isoqf_characteristics/', {
          organization: this.$route.params.org_id || '',
          project_id: this.$route.params.id || '',
          items: [item],
          fields: mergedFields
        })

      apiCall
        .then(response => {
          this.isSaving = false

          Object.entries(generatedKeys).forEach(([index, key]) => {
            if (this.customFields[index]) {
              this.customFields[index].key = key
            }
          })

          const savedData = {
            ...this.charsData,
            ...response.data,
            id: response.data.id || this.charsData.id,
            _id: response.data._id || this.charsData._id
          }

          const oldFieldKeys = this.charsData.fields ? this.charsData.fields.map(f => f.key) : []
          const newKeys = customFieldsArray
            .filter(f =>
              f.key !== 'authors' &&
              f.key !== 'ref_id' &&
              f.key !== 'actions' &&
              !oldFieldKeys.includes(f.key)
            )
            .map(f => f.key)

          if (newKeys.length > 0) {
            this.$emit('update:visibleColumnKeys', [...this.visibleColumnKeys, ...newKeys])
          }

          this.$emit('saved', savedData)

          if (closeAfter) {
            this.$notify.success(this.$t('notifications.saved'))
            this.hide()
          } else {
            this.autoSaveStatus = 'saved'
            setTimeout(() => { this.autoSaveStatus = null }, 2000)
          }
        })
        .catch(error => {
          this.isSaving = false
          console.error('Error saving reference characteristics:', error)
          // The lock channel already explained this one. 'error' on the auto-save
          // indicator would be just as misleading as the toast: nothing to retry.
          if (isLockRejection(error)) {
            this.autoSaveStatus = null
            return
          }
          if (closeAfter) {
            this.$notify.error(this.$t('notifications.save_error'))
          } else {
            this.autoSaveStatus = 'error'
          }
        })
    }
  }
}
</script>

<style scoped>
.sticky-menu {
  position: sticky;
  top: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.menu-section-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #6c757d;
}

.menu-item {
  padding: 5px 10px;
  margin: 2px 0;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.85rem;
}

.menu-item:hover {
  background-color: #e9ecef;
  color: #007bff;
}

.active-menu-item {
  font-weight: bold;
  color: #007bff;
  background-color: #e9ecef;
}

.menu-sidebar {
  max-height: 100%;
}

@keyframes highlightBackground {
  0% {
    background-color: rgba(40, 167, 69, 0.2);
  }

  50% {
    background-color: rgba(40, 167, 69, 0.1);
  }

  100% {
    background-color: transparent;
  }
}

.highlight-new-field {
  animation: highlightBackground 2s ease-out;
}

.active-menu-item {
  font-weight: bold;
  color: #007bff;
  background-color: #e9ecef;
}

.menu-sidebar {
  max-height: 100%;
}

@keyframes highlightBackground {
  0% {
    background-color: rgba(40, 167, 69, 0.2);
  }

  50% {
    background-color: rgba(40, 167, 69, 0.1);
  }

  100% {
    background-color: transparent;
  }
}

.highlight-new-field {
  animation: highlightBackground 2s ease-out;
}

html[data-theme="dark"] .sticky-menu {
  background-color: #2a2a2a;
  border-color: #444;
  color: #e0e0e0;
}

html[data-theme="dark"] .menu-section-title {
  color: #aaa;
}

html[data-theme="dark"] .menu-item:hover {
  background-color: #3a3a3a;
  color: #90b8d8;
}

html[data-theme="dark"] .active-menu-item {
  background-color: #2d3d50;
  color: #90b8d8;
}
</style>
