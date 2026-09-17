<template>
  <div class="assessment-form-wrapper">
    <b-card header-tag="header" footer-tag="footer" class="assessment-card shadow-sm border">
      <!-- <template #header>
      <h3 class="mb-0 font-weight-bold">{{ $t('camelot.assessment_form.title') }}</h3>
    </template> -->

      <div class="assessment-description mb-2 py-2">
        <p v-html="options[modalStage][selectedMeta].text" class="mb-0"></p>
      </div>

      <fieldset :disabled="isReadOnly" class="border-0 p-0 m-0">
        <!-- Shown for every read-only reason, named holder or not: the loss reported by
             the heartbeat carries no name, and that silence is what left users typing
             into a form that could no longer save. -->
        <b-alert v-if="isReadOnly" show variant="warning" class="mb-3"
          data-testid="assessment-readonly-notice">
          <font-awesome-icon icon="lock" class="mr-1" />
          {{ lockedByUser
            ? $t('lock.ref_locked_by', { user: lockedByUser })
            : $t('lock.ref_locked_by_no_user') }}
        </b-alert>

        <b-form-group label="" class="mb-4">
          <b-form-radio v-for="(value, index) in options[modalStage][selectedMeta].values" v-model="selected" :key="index"
            :value="value.value" :class="['mb-2', 'assessment-radio', 'radio-color-' + value.value]">
            {{ value.text }}
          </b-form-radio>
          <p v-if="selected !== null" class="mt-2 font-weight-light text-danger" style="cursor: pointer">
            <a @click="clearSelection">
              <font-awesome-icon icon="trash"></font-awesome-icon>
              {{ $t('worksheet.actions.clear_selection') }}
            </a>
          </p>
        </b-form-group>

        <!-- El id lleva la celda: `b-tabs` monta las cuatro instancias a la vez, así que un
             id literal las hacía indistinguibles para `getElementById` y el foco de
             "hacerlo ahora" caía siempre en la primera pestaña. -->
        <b-form-group :label="$t('camelot.assessment_form.explain_label')" :label-for="textareaId"
          class="font-weight-bold small" :state="explanationState">
          <b-form-textarea :id="textareaId" v-model="text1" rows="3"
            :placeholder="$t('camelot.assessment_form.text_placeholder')"
            :state="explanationState"></b-form-textarea>
          <b-form-invalid-feedback>{{ $t('camelot.assessment_form.explanation_required') }}</b-form-invalid-feedback>
        </b-form-group>

        <div class="mt-4 pt-3 border-top">
          <h3 class="notes-title">{{ $t('common.notes') }}</h3>
          <b-form-group label="" label-for="textarea-notes">
            <b-form-textarea id="textarea-notes" v-model="notes" rows="3"
              :placeholder="$t('camelot.assessment_form.text_placeholder')"></b-form-textarea>
            <p class="small text-muted mt-1 italic">{{ $t('worksheet.labels.notes_description') }}</p>
          </b-form-group>
        </div>
      </fieldset>

      <template #footer>
        <div class="d-flex justify-content-between align-items-center w-100">
          <span v-if="autoSaveStatus === 'saving'" class="text-muted small">
            <b-spinner small></b-spinner> {{ $t('common.auto_saving') }}
          </span>
          <span v-else-if="autoSaveStatus === 'saved'" class="text-success small">
            <font-awesome-icon icon="check"></font-awesome-icon> {{ $t('common.auto_saved') }}
          </span>
          <span v-else></span>
          <div>
            <b-button variant="outline-secondary" class="mr-2" size="sm" @click="cancel">
              {{ $t('common.cancel') }}
            </b-button>
            <b-button :disabled="button.disabled || isReadOnly" size="sm" :variant="(button.disabled || isReadOnly) ? 'outline-primary' : 'primary'"
              @click="save">
              <b-spinner small v-if="!button.disabled && isSaving"></b-spinner>
              {{ $t('camelot.assessment_form.save_button') }}
            </b-button>
          </div>
        </div>
      </template>
    </b-card>

    <b-modal :id="'warning-explanation-modal-' + modalStage + '-' + selectedMeta" :title="$t('common.warning')"
      :hide-footer="true">
      <p>{{ $t('worksheet.warnings.incomplete_explanation') }}</p>
      <b-container>
        <b-row align-h="between">
          <b-col cols="4">
            <b-button block @click="doItNow">
              {{ $t('worksheet.actions.do_it_now') }}
            </b-button>
          </b-col>
          <b-col cols="4">
            <b-button block @click="doItLater">
              {{ $t('worksheet.actions.do_it_later') }}
            </b-button>
          </b-col>
        </b-row>
      </b-container>
    </b-modal>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import { isLockRejection } from '@/utils/lockErrors'
import { resolveTableDoc } from '@/utils/tableDocs'
import _debounce from 'lodash.debounce'
import pendingEditsMixin from '@/mixins/pendingEditsMixin'
import {
  canonicalIndex,
  canonicalStageKey,
  emptyAssessmentItem
} from '@/utils/camelotAssessmentKeys'

export default {
  mixins: [pendingEditsMixin],
  name: 'AssessmentForm',
  data () {
    return {
      categories: [
        this.$t('camelot.assessment_form.categories.fit_meta_design'),
        this.$t('camelot.assessment_form.categories.fit_meta_conduct'),
        this.$t('camelot.assessment_form.categories.fit_design_conduct'),
        this.$t('camelot.assessment_form.overall_assessment')
      ],
      selected: null,
      text1: '',
      notes: '',
      /**
       * El nivel con el que se ABRIÓ esta celda. Es la referencia para decidir si un
       * guardado manual cambió el juicio, y a propósito NO es el valor almacenado:
       * entre elegir el nivel y llegar al botón Save pasan más de los 1,5 s del
       * debounce, así que el auto-guardado escribe primero y el almacenado ya coincide
       * con lo elegido. Medido en navegador. Sólo la mueven la hidratación de la celda
       * y el propio guardado manual.
       */
      baselineOption: null,
      /**
       * La celda tal como la tomamos del documento la última vez: al montar, al cambiar de
       * celda, o al guardar. Es el punto de comparación para saber si los campos traen un
       * borrador encima; no es lo mismo que `baselineOption`, que responde otra pregunta
       * (si el guardado MANUAL movió el juicio) y a propósito no se mueve con el
       * auto-guardado.
       */
      hydratedLeaf: { option: null, text: '', notes: '' },
      isSaving: false,
      autoSaveStatus: null,
      options: [
        [
          {
            text: this.$t('camelot.assessment_form.prompts.meta_research_vs_design'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.prompts.meta_stakeholders_vs_design'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.prompts.meta_researchers_vs_design'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.prompts.meta_context_vs_design'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          }
        ],
        [
          {
            text: this.$t('camelot.assessment_form.prompts.meta_research_vs_conduct'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.prompts.meta_stakeholders_vs_conduct'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.prompts.meta_researchers_vs_conduct'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.prompts.meta_context_vs_conduct'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          }
        ],
        [
          {
            text: this.$t('camelot.assessment_form.prompts.design_vs_conduct'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          }
        ],
        [
          {
            text: this.$t('camelot.assessment_form.prompts.overall'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          }
        ]
      ],
      button: {
        disabled: true
      }
    }
  },
  props: {
    selectedMeta: {
      type: Number,
      default: 0
    },
    modalStage: {
      type: Number,
      default: 0
    },
    assessments: {
      type: Object,
      default: () => ({})
    },
    refId: {
      type: String,
      default: ''
    },
    modalIndex: {
      type: Number,
      default: 0
    },
    // Lock state is owned by StepFour (single acquire per study open) and passed down.
    isReadOnly: {
      type: Boolean,
      default: false
    },
    lockedByUser: {
      type: String,
      default: null
    }
  },
  computed: {
    explanationState () {
      if (this.selected === null) return null
      return !!(this.text1 && this.text1.trim().length > 0)
    },
    /**
     * Hay un juicio elegido y ninguna explicación que lo sostenga. Es la misma condición
     * que abre el aviso desde el botón *Save*, escrita una sola vez: `save()` la reusa, y
     * StepFour la recibe por evento para poder frenar las otras salidas del formulario.
     */
    isIncomplete () {
      return this.explanationState === false
    },
    textareaId () {
      return `assessment-explanation-${this.modalStage}-${this.selectedMeta}`
    }
  },
  watch: {
    /**
     * El estado sube por evento y no se lee por `$refs`: estas instancias viven detrás de
     * un `b-tabs` con `v-for` dentro de un `v-if` por etapa, donde el padre no tiene una
     * referencia estable (mismo motivo que documenta `pendingEditsMixin`).
     *
     * `immediate` porque la celda puede llegar YA incompleta desde el servidor: el criterio
     * acordado mira el estado, no si alguien la tocó en esta sesión.
     */
    isIncomplete: {
      handler (incomplete) {
        this.$emit('incomplete-change', {
          stage: this.modalStage,
          meta: this.selectedMeta,
          incomplete
        })
      },
      immediate: true
    },
    modalStage (newValue) {
      if (this.autoSaveDebounced) this.autoSaveDebounced.cancel()
      this.autoSaveStatus = null
      if (this.assessments.items.length) {
        this.hydrateFrom(this.leafAt(this.assessments, this.modalIndex, newValue, this.selectedMeta))
        this.baselineOption = this.selected
      }
    },
    selectedMeta (newValue) {
      if (this.autoSaveDebounced) this.autoSaveDebounced.cancel()
      this.autoSaveStatus = null
      if (this.assessments.items) {
        this.hydrateFrom(this.leafAt(this.assessments, this.modalIndex, this.modalStage, newValue))
        this.baselineOption = this.selected
      }
    },
    modalIndex (newValue) {
      if (this.autoSaveDebounced) this.autoSaveDebounced.cancel()
      this.autoSaveStatus = null
      if (this.assessments.items && this.assessments.items[newValue]) {
        this.hydrateFrom(this.leafAt(this.assessments, newValue, this.modalStage, this.selectedMeta))
        this.baselineOption = this.selected
      }
    },
    /**
     * Rehidrata desde el documento recargado. NO toca `baselineOption`: este watcher
     * corre después de CADA guardado (el éxito dispara un refetch en el padre), así que
     * mover ahí la referencia la dejaría siempre igual a lo elegido.
     *
     * Y NO pisa un borrador. Acá llegan documentos que la persona no pidió: el refresco de
     * `viewProject` recarga las referencias cada 15 s y eso encadena un `getAssessments`,
     * y el refetch del propio guardado responde con lo que el servidor alcanzó a escribir.
     * Los dos llegan con datos ANTERIORES a lo que se está tecleando, así que sincronizar a
     * ciegas desmarcaba la opción recién elegida y borraba la explicación a medio escribir.
     * El criterio es el estado, no el origen: si los campos difieren de la última
     * hidratación, hay algo sin guardar encima y el documento entrante se descarta. La
     * próxima hidratación legítima llega igual — el guardado propio vuelve a fijar el punto
     * de referencia, y cambiar de celda rehidrata sin condición.
     */
    assessments: {
      handler (newValue) {
        if (!newValue.items.length) return
        if (this.hasUnsavedEdits()) return
        this.hydrateFrom(this.leafAt(newValue, this.modalIndex, this.modalStage, this.selectedMeta))
      },
      deep: true
    },
    selected (newValue) {
      this.checkChanges()
    },
    text1 (newValue) {
      this.checkChanges()
    },
    notes (newValue) {
      this.checkChanges()
    }
  },
  mounted: function () {
    if (this.assessments.items.length) {
      this.hydrateFrom(this.leafAt(this.assessments, this.modalIndex, this.modalStage, this.selectedMeta))
      this.baselineOption = this.selected
    }
    this.autoSaveDebounced = _debounce(function () { return this.performSave(true) }.bind(this), 1500)
  },
  beforeDestroy () {
    if (this.autoSaveDebounced) this.autoSaveDebounced.cancel()
    // Baja explícita. Las etapas se conmutan con `v-if`, así que estas instancias mueren
    // al navegar; sin este aviso el padre seguiría contando una celda que ya no existe y
    // frenaría salidas por algo que nadie puede ver ni corregir.
    this.$emit('incomplete-change', {
      stage: this.modalStage,
      meta: this.selectedMeta,
      incomplete: false
    })
  },
  methods: {
    /** La celda (stage, option) de un estudio dentro de un documento, o null si no está. */
    leafAt (doc, index, stage, meta) {
      const item = doc && doc.items ? doc.items[index] : null
      const stages = item && item.stages ? item.stages[stage] : null
      return stages && stages.options ? stages.options[meta] : null
    },
    /** Único punto donde el documento escribe en los campos: copia y fija la referencia. */
    hydrateFrom (leaf) {
      if (!leaf) return
      this.selected = leaf.option
      this.text1 = leaf.text
      this.notes = leaf.notes || ''
      this.markHydrated()
    },
    markHydrated () {
      this.hydratedLeaf = { option: this.selected, text: this.text1, notes: this.notes }
    },
    /** Hay algo escrito que el servidor todavía no confirmó. */
    hasUnsavedEdits () {
      const saved = this.hydratedLeaf
      return this.selected !== saved.option ||
        this.text1 !== saved.text ||
        this.notes !== saved.notes
    },
    checkChanges () {
      const item = this.assessments.items[this.modalIndex].stages[this.modalStage].options[this.selectedMeta]
      const hasChanges = item.option !== this.selected || item.text !== this.text1 || (item.notes || '') !== this.notes
      this.button.disabled = !hasChanges
      if (hasChanges && this.autoSaveDebounced) {
        this.autoSaveDebounced()
      } else if (!hasChanges && this.autoSaveDebounced) {
        this.autoSaveDebounced.cancel()
      }
    },
    getOptionColor (value) {
      const colors = {
        'A': '#1065AB', // No or minimal
        'B': '#8EC4DE', // Minor
        'C': '#F6A482', // Moderate
        'D': '#B31529', // Serious
        'E': '#B3B3B3' // Unclear
      }
      return colors[value] || '#B3B3B3'
    },
    cancel () {
      if (this.autoSaveDebounced) this.autoSaveDebounced.cancel()
      this.autoSaveStatus = null
      if (this.assessments.items && this.assessments.items[this.modalIndex]) {
        this.hydrateFrom(this.leafAt(this.assessments, this.modalIndex, this.modalStage, this.selectedMeta))
      }
      // Cerrar deja de ser decisión de este componente: el padre tiene que poder frenarlo
      // si alguna celda de la etapa quedó con un juicio sin explicar.
      this.$emit('request-close')
    },
    doItNow () {
      this.$bvModal.hide(`warning-explanation-modal-${this.modalStage}-${this.selectedMeta}`)
      this.$nextTick(() => {
        const el = document.getElementById(this.textareaId)
        if (el) el.focus()
      })
    },
    doItLater () {
      this.$bvModal.hide(`warning-explanation-modal-${this.modalStage}-${this.selectedMeta}`)
      this.saveNow()
    },
    save () {
      if (this.isIncomplete) {
        this.$bvModal.show(`warning-explanation-modal-${this.modalStage}-${this.selectedMeta}`)
        return
      }
      this.saveNow()
    },
    /**
     * Guardado manual. Descarta el auto-guardado que el watcher dejó agendado: iba a
     * escribir exactamente lo mismo, y llegaba ~700ms después como un segundo PATCH
     * idéntico. Medido en navegador — además de la escritura de más, esa segunda
     * recarga vuelve a colapsar la tabla cuando el hold de scroll ya expiró, y la
     * página termina en el tope igual.
     */
    saveNow () {
      if (this.autoSaveDebounced) this.autoSaveDebounced.cancel()
      this.performSave()
    },
    /**
     * El temporizador de inactividad está por cerrar el modal. Lo que `checkChanges` dejó
     * agendado a 1,5 s no sobrevive al cierre, y el `@hidden` de StepFour suelta el lock:
     * hay que escribirlo ahora o no se escribe nunca.
     *
     * No se consulta si esta instancia todavía tiene su leaf lock. Sería tentador —las
     * otras tres de la etapa ya lo soltaron— pero `flush()` de lodash es no-op cuando no
     * hay nada agendado, así que las que nadie tocó no emiten igual; el guard sólo se
     * activaría en el único caso donde SÍ hay texto pendiente, y ahí un 409 abre el
     * rescate con los campos copiables en vez de descartarlo en silencio. Además rompería
     * el flush offline, donde el permiso vive en `offlineRefs` y no en `refLocks`.
     */
    flushPendingEdits (scope) {
      if (this.isReadOnly) return
      if (scope && scope !== this.refId) return
      // Devuelve la escritura para que quien se va pueda esperarla: soltar el ref-lock con
      // el PATCH en vuelo lo deja llegar sin permiso (409 `lock_not_held`), y el texto se
      // pierde igual. `flush()` es no-op sin nada agendado, y ahí devuelve undefined.
      if (!this.autoSaveDebounced) return
      return this.autoSaveDebounced.flush()
    },
    clearSelection () {
      this.selected = null
      this.text1 = ''
      this.notes = ''
    },
    async performSave (silent = false) {
      if (this.isReadOnly) return
      if (!this.refId) {
        this.isSaving = false
        return
      }
      this.isSaving = true
      if (silent) this.autoSaveStatus = 'saving'

      // The leaf, with all three keys: the backend resets any key we omit to
      // its canonical empty value instead of merging it with what is stored.
      const leaf = { option: this.selected, text: this.text1, notes: this.notes }

      const onSuccess = () => {
        // Lo que acabamos de escribir pasa a ser "lo guardado", y antes de pedir el
        // refetch: si no, el documento que vuelve encontraría los campos marcados como
        // borrador y no se aplicaría nunca más. Si la persona siguió editando mientras el
        // PATCH volaba, sus valores ya difieren de éste y el borrador se sigue protegiendo.
        this.hydratedLeaf = { option: leaf.option, text: leaf.text, notes: leaf.notes }
        // Refetch rather than trusting the reloaded document this endpoint
        // returns: StepFour merges items across SEVERAL isoqf_assessments
        // documents, and a single doc would not reproduce that merge.
        this.$emit('getAssessments')
        // The judgement moved, and the person asked for it — the overall assessment
        // that took this cell into account may have gone stale. This component does not
        // know whether it did: it reports the fact and StepFour applies the rule, the
        // same split as `incomplete-change`. Auto-saves stay quiet on purpose; they fire
        // while the person is still choosing.
        if (!silent) {
          if (optionChanged) {
            this.$emit('option-saved', { stage: this.modalStage, meta: this.selectedMeta })
          }
          // Guardar a mano fija el nuevo punto de referencia. El auto-guardado no: es
          // justamente el que no debe consumir el aviso.
          this.baselineOption = this.selected
        }
        this.isSaving = false
        if (silent) {
          this.autoSaveStatus = 'saved'
          setTimeout(() => { this.autoSaveStatus = null }, 2000)
        } else {
          this.$notify.success(this.$t('notifications.saved'))
        }
      }
      const onError = (error) => {
        console.error('Error saving assessment data:', error)
        this.isSaving = false
        // The lock channel already told the user who took the entry and that their text
        // was kept locally. Adding "please try again" on top contradicts it: retrying
        // cannot succeed while somebody else holds the lock.
        if (isLockRejection(error)) {
          this.autoSaveStatus = null
          return
        }
        if (silent) {
          this.autoSaveStatus = 'error'
        } else {
          this.$notify.error(this.$t('notifications.save_error'))
        }
      }

      const currentItem = this.assessments.items
        ? this.assessments.items[this.modalIndex]
        : null

      // Keep the local copy in step so the grid updates before the refetch lands.
      const localLeaf = currentItem && currentItem.stages &&
        currentItem.stages[this.modalStage] &&
        currentItem.stages[this.modalStage].options
        ? currentItem.stages[this.modalStage].options[this.selectedMeta]
        : null
      const optionChanged = this.baselineOption !== this.selected
      if (localLeaf) Object.assign(localLeaf, leaf)

      // `assessments.id` en blanco no significa "no existe": también significa que el GET
      // falló o que todavía no llegó. Crear en esos casos parte el proyecto en dos
      // documentos y la lectura, que toma `data[0]`, puede caer en el que no tiene los
      // datos. La regla vive en `resolveTableDoc` porque la comparten tres pantallas.
      const destino = await resolveTableDoc({
        knownId: this.assessments.id,
        collection: '/isoqf_assessments',
        organization: this.$route.params.org_id,
        projectId: this.$route.params.id
      })
      if (destino.failed) {
        onError(new Error('No se pudo verificar el documento de assessments'))
        return
      }

      if (!destino.id) {
        // No document yet: create it through B with the canonical skeleton, then
        // every later edit goes through D.
        const seeded = emptyAssessmentItem(
          this.refId,
          currentItem ? currentItem.authors : ''
        )
        if (seeded.stages[this.modalStage] &&
            seeded.stages[this.modalStage].options[this.selectedMeta]) {
          Object.assign(seeded.stages[this.modalStage].options[this.selectedMeta], leaf)
        }
        return Api.post('/isoqf_assessments', {
          organization: this.$route.params.org_id,
          project_id: this.$route.params.id,
          items: [seeded]
        })
          .then(onSuccess)
          .catch(onError)
      }

      // The backend keys stages by stages[].key, not by array position, and
      // legacy documents store that key as a string.
      const stageKey = canonicalStageKey(
        currentItem && currentItem.stages ? currentItem.stages[this.modalStage] : null,
        this.modalStage
      )
      const optionIndex = canonicalIndex(this.selectedMeta)
      if (stageKey === null || optionIndex === null) {
        onError(new Error(`Unaddressable cell: stage ${this.modalStage}, option ${this.selectedMeta}`))
        return
      }

      // Endpoint D: writes ONE leaf. Saving the study through B would replace
      // all ten and wipe whatever anyone else just wrote.
      return Api.patch(
        `/isoqf_assessments/${destino.id}/item/${this.refId}/stage/${stageKey}/option/${optionIndex}`,
        leaf
      )
        .then(onSuccess)
        .catch(onError)
    }
  }
}
</script>

<style lang="scss" scoped>
.assessment-card {
  border-color: #2A70BC !important;
  border-radius: 0.5rem;
  overflow: hidden;
  border-top-width: 5px !important;

  .card-header {
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
  }

  .card-footer {
    background-color: #f8f9fa;
    border-top: 1px solid #dee2e6;
  }
}

html[data-theme="dark"] {
  .assessment-card {
    .card-header {
      background-color: #2a2a2a;
      border-bottom-color: #444;
    }

    .card-footer {
      background-color: #2a2a2a;
      border-top-color: #444;
    }
  }
}

.assessment-description {
  line-height: 1.4;
}

.notes-title {
  font-size: 0.8rem;
  font-weight: bold;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
}

.italic {
  font-style: italic;
}

.assessment-radio {
  display: flex;
  align-items: center;

  ::v-deep label {
    cursor: pointer;
    line-height: 1.5;
    margin-bottom: 0;
    padding-top: 2px;
  }

  // Estilos base para los radios personalizados de Bootstrap-Vue
  ::v-deep .custom-control-label::before {
    border-width: 2px;
  }

  // Definición de colores por nivel
  &.radio-color-A {
    ::v-deep .custom-control-input:checked~.custom-control-label::before {
      background-color: #1065AB !important;
      border-color: #1065AB !important;
    }

    ::v-deep .custom-control-input:checked~.custom-control-label::after {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%231065AB'/%3e%3c/svg%3e") !important;
    }

    ::v-deep .custom-control-label::before {
      border-color: #1065AB !important;
    }
  }

  &.radio-color-B {
    ::v-deep .custom-control-input:checked~.custom-control-label::before {
      background-color: #8EC4DE !important;
      border-color: #8EC4DE !important;
    }

    ::v-deep .custom-control-input:checked~.custom-control-label::after {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%238EC4DE'/%3e%3c/svg%3e") !important;
    }

    ::v-deep .custom-control-label::before {
      border-color: #8EC4DE !important;
    }
  }

  &.radio-color-C {
    ::v-deep .custom-control-input:checked~.custom-control-label::before {
      background-color: #F6A482 !important;
      border-color: #F6A482 !important;
    }

    ::v-deep .custom-control-input:checked~.custom-control-label::after {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23F6A482'/%3e%3c/svg%3e") !important;
    }

    ::v-deep .custom-control-label::before {
      border-color: #F6A482 !important;
    }
  }

  &.radio-color-D {
    ::v-deep .custom-control-input:checked~.custom-control-label::before {
      background-color: #B31529 !important;
      border-color: #B31529 !important;
    }

    ::v-deep .custom-control-input:checked~.custom-control-label::after {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23B31529'/%3e%3c/svg%3e") !important;
    }

    ::v-deep .custom-control-label::before {
      border-color: #B31529 !important;
    }
  }

  &.radio-color-E {
    ::v-deep .custom-control-input:checked~.custom-control-label::before {
      background-color: #B3B3B3 !important;
      border-color: #B3B3B3 !important;
    }

    ::v-deep .custom-control-input:checked~.custom-control-label::after {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23B3B3B3'/%3e%3c/svg%3e") !important;
    }

    ::v-deep .custom-control-label::before {
      border-color: #B3B3B3 !important;
    }
  }
}
</style>
