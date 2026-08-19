<template>
  <div class="step-four-container">
    <b-alert show variant="info" v-if="isLoading">
      {{ $t('camelot.step_four.loading') }}
    </b-alert>
    <div v-else>
      <camelot-step-four-header :responses="ui.responses" :export-fields="exportFields" :export-items="exportItems" />

      <camelot-step-four-table :fields="ui.fields" :items="tableItems" :responses="ui.responses"
        :active-ref-locks="activeRefLocks" :can-edit="canEdit" @open-modal="onOpenModal" />
    </div>

    <b-modal id="modal-1" size="xl" dialog-class="camelot-modal-dialog" header-class="camelot-modal-header"
      footer-class="camelot-modal-footer" body-class="camelot-modal-body" no-close-on-backdrop no-close-on-esc
      @hidden="onAssessmentModalClosed">
      <template #modal-title>
        <div class="modal-title-container">
          <div class="modal-breadcrumb">
            {{ $t('camelot.step_four.breadcrumb_main') }} &gt;
            {{ $t('camelot.step_four.breadcrumb_sub') }} &gt;
            <span class="text-white">{{ ui.authors }}</span>
          </div>
          <div class="modal-main-title mt-1 d-flex align-items-center">
            {{ modalSubtitle }}
            <font-awesome-icon icon="info-circle" class="ml-2 cursor-pointer" style="font-size: 1.2rem;"
              v-b-toggle.sidebar-section-help />
          </div>
        </div>
      </template>

      <b-row>
        <b-col cols="12" class="camelot-modal-body">
          <template v-if="modal.stage < 2">
            <b-row>
              <!-- Columna 1: Design or Conduct Domain values (all items) - STATIC -->
              <b-col cols="4" class="modal-column-scroll">
                <div class="column-header mb-3">
                  <h3>{{ modal.stage === 0 ? $t('camelot.step_four.sections.research_design') :
                    $t('camelot.step_four.sections.research_conduct') }}</h3>
                </div>
                <div>
                  <camelot-assessment-card v-for="(item, iIndex) in (modal.stage === 0 ? meta[1] : meta[2]).items"
                    :key="iIndex" :meta-index="modal.stage === 0 ? 1 : 2" :item-index="iIndex"
                    :label="getMetaItemLabel(modal.stage === 0 ? 1 : 2, iIndex)"
                    :extracted-data="(modal.stage === 0 ? meta[1] : meta[2]).values[iIndex][item + 'extractedData']"
                    :concerns="(modal.stage === 0 ? meta[1] : meta[2]).values[iIndex][item + 'comments']"
                    :is-exclamation-active="displayExclamationAlert(modal.stage === 0 ? 1 : 2, iIndex)"
                    :editing-field="editingField" :is-saving="isSavingField" :is-read-only="isRefReadOnly"
                    @start-editing="onStartEditing"
                    @cancel-editing="onCancelEditing" @save-field="onSaveField" @auto-save-field="onAutoSaveField" />
                </div>
              </b-col>

              <!-- Columna 2: Navigation and Dynamic content -->
              <b-col cols="8">
                <div id="navegacion">
                  <div class="column-header mb-3">
                    <h3>{{ $t('camelot.step_four.sections.meta_domains') }}</h3>
                  </div>
                  <b-tabs v-model="modal.tab" nav-class="modal-nav-tabs nav-fill" align="right"
                    @input="selectedMeta = $event">
                    <b-tab v-for="(domain, dIndex) in ui.domainTabs" :key="dIndex"
                      :title-link-class="modal.tab === dIndex ? ['modal-active-tab', 'modal-active-tab-text'] : ['modal-normal-tab', 'modal-normal-tab-text']"
                      class="border p-2" style="border-color: #848E98 !important;">
                      <template #title>
                        <div class="d-flex align-items-center justify-content-center">
                          <div v-if="!isTabCompleted(modal.stage, dIndex)" class="assessment-circle mr-2" :style="{
                            width: '20px',
                            height: '20px',
                            border: '2.5px dashed ' + (modal.tab === dIndex ? '#ffffff' : (isDarkMode ? '#888888' : '#212529')) + ' !important',
                            background: 'transparent',
                            borderRadius: '50%',
                            display: 'inline-block'
                          }"></div>
                          <div v-else class="assessment-circle mr-2" :style="{
                            width: '20px',
                            height: '20px',
                            backgroundColor: getTabColor(modal.stage, dIndex),
                            borderRadius: '50%',
                            display: 'inline-block'
                          }"></div>
                          {{ domain.label }}
                        </div>
                      </template>
                      <b-row class="mt-1">
                        <!-- Columna 2.1: Meta Domain item (Research, Stakeholders, etc.) -->
                        <b-col cols="6" class="modal-column-scroll 00000">
                          <camelot-assessment-card :meta-index="0" :item-index="dIndex" :label="domain.label"
                            :extracted-data="meta[0].values[dIndex][meta[0].items[dIndex] + 'extractedData']"
                            :concerns="meta[0].values[dIndex][meta[0].items[dIndex] + 'comments']"
                            :is-exclamation-active="displayExclamationAlert(0, dIndex)" :editing-field="editingField"
                            :is-saving="isSavingField" :is-read-only="isRefReadOnly" @start-editing="onStartEditing" @cancel-editing="onCancelEditing"
                            @save-field="onSaveField" @auto-save-field="onAutoSaveField" />
                        </b-col>

                        <!-- Columna 2.2: Assessment Evaluation -->
                        <b-col cols="6">
                          <assessmentForm :assessments="assessments" :modalStage="modal.stage" :selectedMeta="dIndex"
                            :refId="refId" :modalIndex="modal.index"
                            :is-read-only="isCellReadOnly(modal.stage, dIndex)"
                            :locked-by-user="refLockedBy"
                            @getAssessments="getAssessments"></assessmentForm>
                        </b-col>
                      </b-row>
                    </b-tab>
                  </b-tabs>
                </div>
              </b-col>
            </b-row>
          </template>

          <template v-else-if="modal.stage === 2">
            <div>
              <b-row>
                <!-- Columna 1: Research Design -->
                <b-col cols="4" class="modal-column-scroll">
                  <div class="column-header mb-3">
                    <h3>{{ $t('camelot.step_four.sections.research_design') }}</h3>
                  </div>
                  <div>
                    <camelot-assessment-card v-for="(item, iIndex) in meta[1].items" :key="iIndex" :meta-index="1"
                      :item-index="iIndex" :label="getMetaItemLabel(1, iIndex)"
                      :extracted-data="meta[1].values[iIndex][item + 'extractedData']"
                      :concerns="meta[1].values[iIndex][item + 'comments']"
                      :is-exclamation-active="displayExclamationAlert(1, iIndex)" :editing-field="editingField"
                      :is-saving="isSavingField" :is-read-only="isRefReadOnly" @start-editing="onStartEditing" @cancel-editing="onCancelEditing"
                      @save-field="onSaveField" @auto-save-field="onAutoSaveField" />
                  </div>
                </b-col>

                <!-- Columna 2: Research Conduct -->
                <b-col cols="4" class="modal-column-scroll">
                  <div class="column-header mb-3">
                    <h3>{{ $t('camelot.step_four.sections.research_conduct') }}</h3>
                  </div>
                  <div>
                    <camelot-assessment-card v-for="(item, iIndex) in meta[2].items" :key="iIndex" :meta-index="2"
                      :item-index="iIndex" :label="getMetaItemLabel(2, iIndex)"
                      :extracted-data="meta[2].values[iIndex][item + 'extractedData']"
                      :concerns="meta[2].values[iIndex][item + 'comments']"
                      :is-exclamation-active="displayExclamationAlert(2, iIndex)" :editing-field="editingField"
                      :is-saving="isSavingField" :is-read-only="isRefReadOnly" @start-editing="onStartEditing" @cancel-editing="onCancelEditing"
                      @save-field="onSaveField" @auto-save-field="onAutoSaveField" />
                  </div>
                </b-col>

                <!-- Columna 3: Assessment Evaluation -->
                <b-col cols="4">
                  <assessmentForm :assessments="assessments" :modalStage="2" :selectedMeta="0" :refId="refId"
                    :modalIndex="modal.index" :is-read-only="isCellReadOnly(2, 0)"
                    :locked-by-user="refLockedBy"
                    @getAssessments="getAssessments"></assessmentForm>
                </b-col>
              </b-row>
            </div>
          </template>

          <template v-else-if="modal.stage === 3">
            <div class="mt-4">
              <b-row class="mt-4">
                <!-- Columna 1: Fit Design vs Meta Resumen -->
                <b-col cols="3" class="modal-column-scroll">
                  <!-- <div class="column-header mb-3">
                    <h3>{{ $t('camelot.step_four.sections.fit_between_design_meta') }}</h3>
                  </div> -->
                  <div>
                    <b-card v-for="(domain, dIndex) in ui.domainTabs" :key="dIndex" class="mb-3 item-card"
                      header-tag="header">
                      <template #header>
                        <div class="d-flex justify-content-between align-items-end">
                          <h4 :id="'fa' + dIndex + 1" class="mb-0 font-weight-bold">FA{{ dIndex + 1 }}</h4>
                          <b-tooltip :target="'fa' + dIndex + 1">{{
                            $t('camelot.step_four.sections.fa' + (dIndex + 1)) }}</b-tooltip>
                        </div>
                      </template>
                      <div class="field-section" v-if="assessments.items.length">
                        <responses :stage="0" :index="dIndex"
                          :option="assessments.items[modal.index].stages[0].options[dIndex].option"
                          :text="assessments.items[modal.index].stages[0].options[dIndex].text"></responses>
                      </div>
                    </b-card>
                  </div>
                </b-col>

                <!-- Columna 2: Fit Conduct vs Meta Resumen -->
                <b-col cols="3" class="modal-column-scroll">
                  <!-- <div class="column-header mb-3">
                    <h3>{{ $t('camelot.step_four.sections.fit_between_conduct_meta') }}</h3>
                  </div> -->
                  <div>
                    <b-card v-for="(domain, dIndex) in ui.domainTabs" :key="dIndex" class="mb-3 item-card"
                      header-tag="header">
                      <template #header>
                        <div class="d-flex justify-content-between align-items-end">
                          <h4 :id="'fa' + dIndex + 5" class="mb-0 font-weight-bold">FA{{ dIndex + 5 }}</h4>
                          <b-tooltip :target="'fa' + dIndex + 5">{{
                            $t('camelot.step_four.sections.fa' + (dIndex + 5)) }}</b-tooltip>
                        </div>
                      </template>
                      <div class="field-section" v-if="assessments.items.length">
                        <responses :stage="1" :index="dIndex"
                          :option="assessments.items[modal.index].stages[1].options[dIndex].option"
                          :text="assessments.items[modal.index].stages[1].options[dIndex].text"></responses>
                      </div>
                    </b-card>
                  </div>
                </b-col>

                <!-- Columna 3: Fit Design vs Conduct Resumen (FA9) -->
                <b-col cols="3" class="modal-column-scroll">
                  <b-card class="mb-3 item-card" header-tag="header">
                    <template #header>
                      <div class="d-flex justify-content-between align-items-end">
                        <h4 id="fa9" class="mb-0">FA9</h4>
                        <b-tooltip target="fa9">{{ $t('camelot.step_four.sections.fa9')
                          }}</b-tooltip>
                      </div>
                    </template>
                    <div class="p-1">
                      <responses v-if="assessments.items.length" :stage="2" :index="0"
                        :option="assessments.items[modal.index].stages[2].options[0].option"
                        :text="assessments.items[modal.index].stages[2].options[0].text"></responses>
                    </div>
                  </b-card>
                </b-col>

                <!-- Columna 4: Evaluación de ajuste final -->
                <b-col cols="3" class="">
                  <assessmentForm :assessments="assessments" :modalStage="3" :selectedMeta="0" :refId="refId"
                    :modalIndex="modal.index" :is-read-only="isCellReadOnly(3, 0)"
                    :locked-by-user="refLockedBy"
                    @getAssessments="getAssessments"></assessmentForm>
                </b-col>
              </b-row>
            </div>
          </template>
        </b-col>
      </b-row>

      <template #modal-footer>
        <div class="w-100 d-flex justify-content-between align-items-end px-3">
          <div v-if="modal.stage > 0" @click="goToStage(modal.stage - 1)" class="nav-footer-link">
            &lt; {{ getStageTitle(modal.stage - 1) }}
          </div>
          <div v-else></div>

          <div v-if="modal.stage < 3" @click="goToStage(modal.stage + 1)" class="nav-footer-link">
            {{ getStageTitle(modal.stage + 1) }} &gt;
          </div>
          <div v-else @click="$bvModal.hide('modal-1')" class="nav-footer-link">
            {{ $t('common.close') }}
          </div>
        </div>
      </template>
    </b-modal>

    <b-sidebar id="sidebar-section-help" :title="modalSubtitle" width="400px" shadow right backdrop>
      <div class="px-4 py-3" v-html="helpContent[modal.stage]">
      </div>
    </b-sidebar>

    <RefLockConflictModal
      ref="conflictModal"
      :locked-by="conflictLockedBy"
      :failed-data="conflictData || {}"
      :ref-id="conflictRefId"
      :source="conflictSource"
      @closed="clearConflict"
    />
  </div>
</template>

<script>
import Api from '@/utils/Api'
import LockService from '@/services/lockService'
import { isLockRejection } from '@/utils/lockErrors'
import {
  ASSESSMENT_CELLS,
  baseRefOf,
  emptyAssessmentItem,
  leafLockKey,
  leafPositionOf
} from '@/utils/camelotAssessmentKeys'
import Commons from '../../utils/commons.js'
import AssessmentForm from './assessment/AssessmentForm.vue'
import Responses from './Responses.vue'
import CamelotAssessmentCard from './CamelotAssessmentCard.vue'
import CamelotStepFourTable from './CamelotStepFourTable.vue'
import CamelotStepFourHeader from './CamelotStepFourHeader.vue'
import RefLockConflictModal from './RefLockConflictModal.vue'
import refLockStateMixin from '@/mixins/refLockStateMixin'
import projectFreshnessMixin from '@/mixins/projectFreshnessMixin'

export default {
  name: 'StepFour',
  mixins: [refLockStateMixin, projectFreshnessMixin],
  props: {
    type: {
      type: String,
      required: true
    },
    references: {
      type: Array,
      required: true
    },
    canEdit: {
      type: Boolean,
      default: false
    }
  },
  components: {
    AssessmentForm, Responses, CamelotAssessmentCard, CamelotStepFourTable, CamelotStepFourHeader, RefLockConflictModal
  },
  data () {
    const headerClass = 'header-second-row'
    const overallHeaderClass = 'header-overall-row'

    return {
      isLoading: false,
      ui: {
        fields: [
          { key: 'authors', label: this.$t('camelot.step_four.fit_assessments'), thClass: headerClass, tdClass: 'border-right' },
          // Group 1
          { key: 'fa1', label: 'FA 1', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'fa2', label: 'FA 2', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'fa3', label: 'FA 3', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'fa4', label: 'FA 4', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'edit1', label: '', thClass: headerClass, tdClass: 'border-right' },
          // Group 2
          { key: 'fa5', label: 'FA 5', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'fa6', label: 'FA 6', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'fa7', label: 'FA 7', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'fa8', label: 'FA 8', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'edit2', label: '', thClass: headerClass, tdClass: 'border-right' },
          // Group 3
          { key: 'fa9', label: 'FA 9', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'edit3', label: '', thClass: headerClass, tdClass: 'border-right' },
          // Group 4 (OA)
          { key: 'oa', label: 'OA', thClass: overallHeaderClass, tdClass: 'assessment-col' },
          { key: 'edit4', label: '', thClass: overallHeaderClass }
        ],
        authors: '',
        domainTabs: [
          { key: 'research', label: this.$t('camelot.step_four.meta_items.research') },
          { key: 'stakeholders', label: this.$t('camelot.step_four.meta_items.stakeholders') },
          { key: 'researchers', label: this.$t('camelot.step_four.meta_items.researchers') },
          { key: 'context', label: this.$t('camelot.step_four.meta_items.context') }
        ],
        responses: [
          { text: this.$t('camelot.responses.no_minimal'), value: 'A', color: '#1065AB' },
          { text: this.$t('camelot.responses.minor'), value: 'B', color: '#8EC4DE' },
          { text: this.$t('camelot.responses.moderate'), value: 'C', color: '#F6A482' },
          { text: this.$t('camelot.responses.serious'), value: 'D', color: '#B31529' },
          { text: this.$t('camelot.responses.unclear'), value: 'E', color: '#B3B3B3' }
        ]
      },
      characteristics: {
        items: []
      },
      assessments: {
        items: []
      },
      activeRefLocks: [], // [{ ref_id, user_name }] — refs locked by other users
      refLocksTimer: null,
      isRefReadOnly: false, // lock state for the study currently open in the modal
      // Study fields (isoqf_characteristics, endpoint B) are governed apart from the
      // cells: their lock is the bare study, which clashes with ANY cell of it. So a
      // single cell held by someone else closes the fields without closing the other
      // nine cells.
      studyFieldsReadOnly: false,
      studyFieldsLockedBy: null,
      holdsStudyLock: false,
      refLockedBy: null,
      isModalOpen: false,
      // Cells whose lock we asked for and did not get, as 'stage-option' keys.
      // Kept apart from the ones the /refs poll reports so a poll never erases
      // a refusal we just received.
      deniedCells: [],
      leafLockedBy: null,
      conflictData: null,
      conflictLockedBy: '',
      conflictRefId: '',
      // Decides the modal's wording: a live 409 must not be explained as an offline sync.
      conflictSource: 'live',
      selected: null,
      text1: '',
      modal: {
        stage: 0,
        index: 0,
        tab: 0,
        faLabel: null
      },
      meta: [
        {
          name: this.$t('camelot.step_four.sections.meta_domains'),
          items: ['research_', 'stakeholders_', 'researchers_', 'context_'],
          values: [
            {
              research_extractedData: '',
              research_comments: ''
            },
            {
              stakeholders_extractedData: '',
              stakeholders_comments: ''
            },
            {
              researchers_extractedData: '',
              researchers_comments: ''
            },
            {
              context_extractedData: '',
              context_comments: ''
            }
          ]
        },
        {
          name: this.$t('camelot.step_four.sections.research_design'),
          items: ['strategy_', 'ethical_', 'equity_', 'theory_'],
          values: [
            {
              strategy_extractedData: '',
              strategy_comments: ''
            },
            {
              ethical_extractedData: '',
              ethical_comments: ''
            },
            {
              equity_extractedData: '',
              equity_comments: ''
            },
            {
              theory_extractedData: '',
              theory_comments: ''
            }
          ]
        },
        {
          name: this.$t('camelot.step_four.sections.research_conduct'),
          items: ['participant_', 'data_', 'analysis_', 'presentation_'],
          values: [
            {
              participant_extractedData: '',
              participant_comments: ''
            },
            {
              data_extractedData: '',
              data_comments: ''
            },
            {
              analysis_extractedData: '',
              analysis_comments: ''
            },
            {
              presentation_extractedData: '',
              presentation_comments: ''
            }
          ]
        }
      ],
      selectedMeta: 0,
      refId: null,
      editingField: {
        metaIndex: null,
        itemIndex: null,
        type: null
      },
      editValueExtracted: '',
      editValueComments: '',
      isSavingField: false,
      showLegend: false,
      isDarkMode: document.documentElement.getAttribute('data-theme') === 'dark'
    }
  },
  mounted () {
    this._themeObserver = new MutationObserver(() => {
      this.isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark'
    })
    this._themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    // Polling de locks activos por estudio (colaboración simultánea)
    this.startRefLocksPolling()
    // Refresco inmediato cuando este mismo usuario adquiere/libera un lock
    window.addEventListener('ref-locks-changed', this.fetchAndUpdateRefLocks)
    window.addEventListener('ref-lock-conflict', this.handleRefLockConflict)
    // Without this the open modal only learned the lock was gone when a save came
    // back 409 — the user kept filling in an assessment that could no longer be saved.
    window.addEventListener('ref-lock-lost', this.handleRefLockLost)
  },
  beforeDestroy () {
    this._themeObserver.disconnect()
    this.stopRefLocksPolling()
    window.removeEventListener('ref-locks-changed', this.fetchAndUpdateRefLocks)
    window.removeEventListener('ref-lock-conflict', this.handleRefLockConflict)
    window.removeEventListener('ref-lock-lost', this.handleRefLockLost)
    LockService.releaseRef()
  },
  computed: {
    helpContent () {
      return {
        0: this.$t('camelot.step_four.help_modal.0'),
        1: this.$t('camelot.step_four.help_modal.1'),
        2: this.$t('camelot.step_four.help_modal.2'),
        3: this.$t('camelot.step_four.help_modal.3')
      }
    },
    exportFields () {
      return [
        { key: 'authors', label: 'Author(s), Year' },
        ...ASSESSMENT_CELLS.map(cell => ({ key: cell.key, label: cell.key.toUpperCase() }))
      ]
    },
    exportItems () {
      return this.tableItems.map(item => {
        const getVal = (stageIdx, optIdx) => {
          if (!item.stages || !item.stages[stageIdx] || !item.stages[stageIdx].options[optIdx]) return ''
          const opt = item.stages[stageIdx].options[optIdx]
          if (!opt.option && !opt.text) return ''
          let result = ''
          if (opt.option) {
            const response = this.ui.responses.find(r => r.value === opt.option)
            result += response ? response.text : opt.option
          }
          if (opt.text) {
            result += (result ? ', explanation: ' : 'explanation: ') + opt.text
          }
          return result
        }

        return ASSESSMENT_CELLS.reduce(
          (row, cell) => ({ ...row, [cell.key]: getVal(cell.stage, cell.option) }),
          { authors: item.authors }
        )
      })
    },
    tableItems () {
      if (!this.assessments.items) return []
      return this.assessments.items.map(item => {
        const ref = this.references.find(r => String(r.id) === String(item.ref_id))
        if (ref) {
          return {
            ...ref,
            ...item,
            // Force re-formatting authors for consistency with Step 3 and the fix
            authors: Commons.parseReference(ref, true, false)
          }
        }
        return item
      })
    },
    modalSubtitle () {
      const stages = [
        'fit_meta_design',
        'fit_meta_conduct',
        'fit_design_conduct',
        'overall'
      ]
      const title = this.$t(`camelot.step_four.tabs.${stages[this.modal.stage]}`)
      return this.modal.faLabel ? `${this.modal.faLabel} ${title}` : title
    },
    // The cell the modal currently has open, as its composite lock key.
    activeLeafRef () {
      return leafLockKey(this.refId, this.modal.stage, this.selectedMeta)
    },
    // Cells of the open study that the /refs poll shows held by someone else.
    // Disabling them up front is the whole point of the listing: the user finds
    // out before typing, not when the save is rejected.
    pollBlockedCells () {
      if (!this.isModalOpen || !this.refId) return []
      const { lockedLeaves } = this.studyLockStateOf(this.refId)
      return [...lockedLeaves.keys()].map(leafPositionOf).filter(Boolean)
    }
  },
  watch: {
    'modal.stage': function (newVal) {
      this.selectedMeta = 0
    },
    activeLeafRef (newKey, oldKey) {
      this.syncLeafLock(newKey, oldKey)
    },
    references: {
      handler (newVal) {
        this.getAssessments()
      },
      immediate: true
    }
  },
  methods: {
    // True when THIS cell is off limits: either the whole study is read-only, or
    // another user holds this particular leaf.
    isCellReadOnly (stage, option) {
      if (this.isRefReadOnly) return true
      const position = `${stage}-${option}`
      return this.pollBlockedCells.includes(position) ||
        this.deniedCells.includes(position)
    },
    /**
     * Moves the leaf lock as the modal walks from cell to cell. The bare study
     * lock stays put: it is what authorizes the Step 3 fields in the same modal.
     */
    async syncLeafLock (newKey, oldKey) {
      if (oldKey) await LockService.releaseRef(oldKey)
      this.leafLockedBy = null
      if (!newKey || !this.isModalOpen || !this.canEdit) return

      const result = await LockService.acquireRef(this.$route.params.id, newKey)
      if (result.success) {
        this.markCellDenied(this.modal.stage, this.selectedMeta, false)
        return
      }
      this.onLeafLockDenied(result)
    },
    /** Adds or clears the read-only mark on one cell. */
    markCellDenied (stage, option, denied = true) {
      const position = `${stage}-${option}`
      const without = this.deniedCells.filter(c => c !== position)
      this.deniedCells = denied ? [...without, position] : without
    },
    /**
     * The cell the user just moved to could not be locked. Note that a 409 here
     * can also mean somebody holds the WHOLE study (the backend rejects the two
     * granularities against each other), so `result.lockedBy` is the only
     * reliable detail — the reason does not distinguish the two cases.
     *
     * @param {{ lockedBy?: string, permissionDenied?: boolean }} result
     */
    onLeafLockDenied (result) {
      if (result.permissionDenied) {
        // Not a conflict: this user's can_write was revoked, so nothing in the
        // study is editable — the same conclusion acquireStudyLock reaches.
        this.isRefReadOnly = true
        this.leafLockedBy = null
        if (this.$notify) {
          this.$notify.warning(this.$t('lock.permissions_revoked'))
        }
        return
      }

      this.markCellDenied(this.modal.stage, this.selectedMeta)
      this.leafLockedBy = result.lockedBy || null
      if (this.$notify) {
        this.$notify.warning(this.$t('lock.ref_locked_by', { user: this.leafLockedBy }))
      }
    },
    async fetchAndUpdateRefLocks () {
      const locks = await LockService.fetchRefLocks(this.$route.params.id)
      this.activeRefLocks = locks
      // Same 15s tick, one more question: did anybody else change this project?
      this.checkProjectFreshness()
    },
    /** What a refresh means here: the grid plus the study fields it shows. */
    applyProjectRefresh: function () {
      this.getAssessments()
      this.getCharacteristics()
    },
    /** A reload while the modal is open would discard what the user is writing. */
    hasOpenEditor: function () {
      return this.isModalOpen
    },
    startRefLocksPolling () {
      this.fetchAndUpdateRefLocks()
      this.refLocksTimer = setInterval(() => this.fetchAndUpdateRefLocks(), 15000)
    },
    stopRefLocksPolling () {
      if (this.refLocksTimer) clearInterval(this.refLocksTimer)
      this.refLocksTimer = null
    },
    getReferenceData: function (reference) {
      return Commons.parseReference(reference, true, false)
    },
    getMetaItemLabel (metaIndex, itemIndex) {
      if (metaIndex === 0) {
        const keys = ['research', 'stakeholders', 'researchers', 'context']
        return this.$t(`camelot.step_four.meta_items.${keys[itemIndex]}`)
      } else if (metaIndex === 1) {
        const keys = ['strategy', 'ethical', 'equity', 'theory']
        return this.$t(`camelot.step_four.design_items.${keys[itemIndex]}`)
      } else if (metaIndex === 2) {
        const keys = ['participant', 'data', 'analysis', 'presentation']
        return this.$t(`camelot.step_four.conduct_items.${keys[itemIndex]}`)
      }
      return ''
    },
    getAssessments: function () {
      if (!this.references.length) return
      this.isLoading = true
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      Api.get('/isoqf_assessments', params)
        .then(response => {
          if (response.data.length) {
            // Build a set of current reference IDs for fast lookup
            const currentRefIds = new Set(this.references.map(r => String(r.id)))

            // Count non-null votes in an item (used to prefer items with real data)
            const countVotes = it => (it.stages || []).reduce(
              (n, s) => n + (s.options || []).filter(o => o.option !== null).length, 0
            )

            // Collect items from ALL assessment documents, keeping only active references.
            // When the same ref_id appears in multiple documents, prefer the one with more votes.
            const itemsByRefId = new Map()
            for (const doc of response.data) {
              for (const item of (doc.items || [])) {
                const key = String(item.ref_id)
                if (!currentRefIds.has(key)) continue
                const existing = itemsByRefId.get(key)
                if (!existing || countVotes(item) > countVotes(existing)) {
                  itemsByRefId.set(key, item)
                }
              }
            }

            // Use the document with the most matching items as the primary (its id is used for PATCH saves)
            let primaryDoc = response.data[0]
            let maxMatches = 0
            for (const doc of response.data) {
              const matches = (doc.items || []).filter(it => currentRefIds.has(String(it.ref_id))).length
              if (matches > maxMatches) {
                maxMatches = matches
                primaryDoc = doc
              }
            }

            this.assessments = {
              ...primaryDoc,
              items: JSON.parse(JSON.stringify(Array.from(itemsByRefId.values())))
            }

            // Sync references: add items for refs not yet in the assessment
            this.references.forEach(ref => {
              const exists = this.assessments.items.find(item => String(item.ref_id) === String(ref.id))
              if (!exists) {
                this.assessments.items.push(
                  emptyAssessmentItem(ref.id, this.getReferenceData(ref))
                )
              }
            })

            if (this.assessments.items.length > 0) {
              this.assessments.items = this.assessments.items.map(item => {
                const ref = this.references.find(r => String(r.id) === String(item.ref_id))
                if (ref) {
                  item.authors = Commons.parseReference(ref, true, false)
                }
                return item
              })
              this.assessments.items.sort((a, b) => {
                const authorsA = a.authors || ''
                const authorsB = b.authors || ''
                return authorsA.localeCompare(authorsB)
              })
            }
          } else {
            const sortedReferences = [...this.references].sort((a, b) => {
              const authorsA = this.getReferenceData(a) || ''
              const authorsB = this.getReferenceData(b) || ''
              return authorsA.localeCompare(authorsB)
            })

            this.assessments = {
              items: sortedReferences.map(
                ref => emptyAssessmentItem(ref.id, this.getReferenceData(ref))
              )
            }
          }
        })
        .catch(error => {
          console.error('Error fetching Assessments data:', error)
          this.$notify.error(this.$t('notifications.load_error'))
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    getCharacteristics: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      Api.get('/isoqf_characteristics', params)
        .then(response => {
          for (let y = 0; y < this.meta.length; y++) {
            for (let z = 0; z < this.meta[y].items.length; z++) {
              this.meta[y].values[z][this.meta[y].items[z] + 'extractedData'] = ''
              this.meta[y].values[z][this.meta[y].items[z] + 'comments'] = ''
            }
          }

          if (!response.data || !response.data.length) return

          const data = response.data[0]
          const items = data.items

          // Standardize authors to be strings instead of arrays
          if (items && Array.isArray(items)) {
            data.items = items.map(item => {
              const ref = this.references.find(r => r.id === item.ref_id)
              if (ref) {
                item.authors = Commons.parseReference(ref, true, false)
              }
              return item
            })
          }

          for (let x = 0; x < data.items.length; x++) {
            if (data.items[x].ref_id === this.refId) {
              for (let y = 0; y < this.meta.length; y++) {
                for (let z = 0; z < this.meta[y].items.length; z++) {
                  this.meta[y].values[z][this.meta[y].items[z] + 'extractedData'] = data.items[x][this.meta[y].items[z] + 'extractedData']
                  this.meta[y].values[z][this.meta[y].items[z] + 'comments'] = data.items[x][this.meta[y].items[z] + 'comments']
                }
              }
            }
          }

          this.characteristics = data
        })
        .catch(error => {
          console.error('Error fetching characteristics:', error)
          this.$notify.error(this.$t('notifications.load_error'))
        })
    },
    openModal: function (stage = 0, data, tab = 0, faLabel = null) {
      this.getCharacteristics()
      this.modal.stage = stage
      this.modal.index = data.index
      this.modal.tab = tab
      this.modal.faLabel = faLabel
      this.selectedMeta = tab
      this.refId = data.item.ref_id
      this.ui.authors = data.item.authors
      this.isModalOpen = true
      this.deniedCells = []
      // The bare study lock is NOT taken here: it would block the ten cells of this
      // study for everybody else for as long as the modal stays open. It is acquired
      // on demand, when a study field is actually edited (see onStartEditing).
      this.refreshStudyFieldsLockState(data.item.ref_id)
      // The refId/stage/tab assignments above may leave activeLeafRef unchanged
      // (reopening the same cell), so the watcher cannot be relied on here.
      this.syncLeafLock(this.activeLeafRef, null)
      this.$bvModal.show('modal-1')
    },
    onOpenModal ({ stage, data, tab, faLabel = null }) {
      this.openModal(stage, data, tab, faLabel)
    },
    /**
     * Reads from the lock listing whether the study fields can be written at all.
     * `saveWholeStudyBlocked` is the right question: endpoint B rewrites the whole
     * item, so anybody holding the study OR one of its cells blocks it.
     */
    refreshStudyFieldsLockState: function (refId) {
      // A user without write permission sees the whole assessment read-only, cells
      // included — the check acquireStudyLock used to make when the modal opened.
      if (!this.canEdit) {
        this.isRefReadOnly = true
        this.studyFieldsReadOnly = true
        this.studyFieldsLockedBy = null
        return
      }
      if (!refId) {
        this.studyFieldsReadOnly = false
        this.studyFieldsLockedBy = null
        return
      }
      const state = this.studyLockStateOf(refId)
      this.studyFieldsReadOnly = state.saveWholeStudyBlocked
      this.studyFieldsLockedBy = state.wholeStudyBlockedBy ||
        (state.lockedLeaves.size ? [...state.lockedLeaves.values()][0] : null)
      // Somebody holding the WHOLE study blocks every cell too (the backend rejects
      // both granularities against each other), so say it once on open instead of
      // letting the user discover it cell by cell. A single held cell does not.
      if (state.wholeStudyBlockedBy) {
        this.isRefReadOnly = true
        this.refLockedBy = state.wholeStudyBlockedBy
      }
    },
    /** Takes the study lock the field editor needs, or leaves the fields read-only. */
    async ensureStudyLock () {
      if (this.holdsStudyLock) return true
      if (!this.refId || !this.canEdit) return false
      const result = await LockService.acquireRef(this.$route.params.id, this.refId)
      if (result.success) {
        this.holdsStudyLock = true
        this.studyFieldsReadOnly = false
        this.studyFieldsLockedBy = null
        return true
      }
      this.studyFieldsReadOnly = true
      this.studyFieldsLockedBy = result.permissionDenied ? null : (result.lockedBy || null)
      if (this.$notify) {
        this.$notify.warning(result.permissionDenied
          ? this.$t('lock.permissions_revoked')
          : this.$t('lock.ref_locked_by', { user: this.studyFieldsLockedBy }))
      }
      return false
    },
    releaseStudyLock: function () {
      if (!this.holdsStudyLock) return
      LockService.releaseRef(this.refId)
      this.holdsStudyLock = false
    },
    async acquireStudyLock (refId) {
      if (!refId) return
      if (!this.canEdit) {
        this.isRefReadOnly = true
        this.refLockedBy = null
        return
      }
      const result = await LockService.acquireRef(this.$route.params.id, refId)
      if (result.success) {
        this.isRefReadOnly = false
        this.refLockedBy = null
      } else if (result.permissionDenied) {
        // Nobody else is editing this study — this user's own can_write was
        // revoked (their canEdit prop just hadn't caught up yet). Don't reuse
        // the "locked by X" message, there is no X.
        this.isRefReadOnly = true
        this.refLockedBy = null
        if (this.$notify) {
          this.$notify.warning(this.$t('lock.permissions_revoked'))
        }
      } else {
        this.isRefReadOnly = true
        this.refLockedBy = result.lockedBy || null
        if (this.$notify) {
          this.$notify.warning(this.$t('lock.ref_locked_by', { user: this.refLockedBy }))
        }
      }
    },
    onAssessmentModalClosed () {
      this.isModalOpen = false
      // No argument: releases the bare study lock AND every leaf lock still held.
      LockService.releaseRef()
      this.holdsStudyLock = false
      this.isRefReadOnly = false
      this.refLockedBy = null
      this.leafLockedBy = null
      this.studyFieldsReadOnly = false
      this.studyFieldsLockedBy = null
      this.deniedCells = []
      this.fetchAndUpdateRefLocks()
      // Nothing is being typed any more, so a reload held back while the modal was
      // open can be applied now.
      this.flushPendingRefresh()
    },
    /**
     * The heartbeat came back 409: this tab no longer holds a lock it thought it had.
     * Granularity decides the blast radius — the bare study takes every cell with it,
     * a leaf takes only its own cell (that is what endpoint D exists for).
     */
    handleRefLockLost (event) {
      const detail = (event && event.detail) || {}
      const lostRef = detail.refId
      if (!lostRef || !this.refId) return

      if (lostRef === this.refId) {
        this.isRefReadOnly = true
        this.refLockedBy = detail.lockedBy || null
        // Not just cosmetic: holdsStudyLock is what ensureStudyLock checks before
        // skipping the acquire, so leaving it true would silently authorize a write
        // we can no longer make.
        this.holdsStudyLock = false
        this.studyFieldsReadOnly = true
        this.studyFieldsLockedBy = detail.lockedBy || null
        return
      }

      if (baseRefOf(lostRef) !== this.refId) return
      const position = leafPositionOf(lostRef)
      if (!position) return
      const [stage, option] = position.split('-').map(Number)
      this.markCellDenied(stage, option)
      this.leafLockedBy = detail.lockedBy || null
    },
    handleRefLockConflict (event) {
      const { refId, failedData, lockedBy, source } = event.detail
      if (refId !== this.refId) return
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
    goToStage (stage) {
      this.modal.stage = stage
      this.modal.tab = 0
      this.selectedMeta = 0
    },
    getStageTitle (stage) {
      const stages = [
        'fit_meta_design',
        'fit_meta_conduct',
        'fit_design_conduct',
        'overall'
      ]
      return this.$t(`camelot.step_four.tabs.${stages[stage]}`)
    },
    displayExclamationAlert (metaIndex, itemIndex) {
      if (!this.meta[metaIndex] || !this.meta[metaIndex].values[itemIndex]) return false

      const itemPrefix = this.meta[metaIndex].items[itemIndex]
      const extractedData = this.meta[metaIndex].values[itemIndex][itemPrefix + 'extractedData']
      const comments = this.meta[metaIndex].values[itemIndex][itemPrefix + 'comments']

      return (!extractedData || extractedData.trim() === '') && (!comments || comments.trim() === '')
    },
    showFitAssessment: function (assessmentId, position) {
      this.selectedMeta = position
      this.$root.$emit('bv::toggle::collapse', assessmentId)
    },
    startEditing (metaIndex, itemIndex, type) {
      this.editingField = { metaIndex, itemIndex, type }
      const itemPrefix = this.meta[metaIndex].items[itemIndex]
      if (type === 'extractedData') {
        this.editValueExtracted = this.meta[metaIndex].values[itemIndex][itemPrefix + 'extractedData'] || ''
      } else {
        this.editValueComments = this.meta[metaIndex].values[itemIndex][itemPrefix + 'comments'] || ''
      }
    },
    async onStartEditing ({ metaIndex, itemIndex, type }) {
      // "One study, one user" for the study fields: whoever gets here second stays
      // read-only instead of overwriting. The lock also makes Step 3 show the study
      // as taken, which is exactly the mutual exclusion we want.
      if (!(await this.ensureStudyLock())) return
      this.startEditing(metaIndex, itemIndex, type)
    },
    scrollToField (metaIndex, itemIndex) {
      this.$nextTick(() => {
        const elementId = `field-${metaIndex}-${itemIndex}`
        const element = document.getElementById(elementId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    },
    cancelEditing () {
      const { metaIndex, itemIndex } = this.editingField
      this.editingField = { metaIndex: null, itemIndex: null, type: null }
      // Leaving the field editor is the end of "one study, one user": both the Cancel
      // button and saveField() (once the PATCH resolves) come through here, so the
      // study stops being locked as soon as nobody is writing its fields.
      this.releaseStudyLock()
      this.refreshStudyFieldsLockState(this.refId)
      this.editValueExtracted = ''
      this.editValueComments = ''
      if (metaIndex !== null && itemIndex !== null) {
        this.scrollToField(metaIndex, itemIndex)
      }
    },
    onCancelEditing () {
      this.cancelEditing()
    },
    saveField (newValue, keepEditing = false) {
      if (!this.characteristics || this.isRefReadOnly) return

      this.isSavingField = true
      const { metaIndex, itemIndex, type } = this.editingField
      const itemPrefix = this.meta[metaIndex].items[itemIndex]

      if (type === 'extractedData') {
        this.editValueExtracted = newValue
      } else {
        this.editValueComments = newValue
      }

      // Asegurar estructura básica si es un objeto nuevo
      if (!this.characteristics.organization) {
        this.characteristics.organization = this.$route.params.org_id
        this.characteristics.project_id = this.$route.params.id
      }

      if (!this.characteristics.items) {
        this.$set(this.characteristics, 'items', [])
      }

      // Actualizar o añadir el ítem en el arreglo principal
      let existingItemIdx = this.characteristics.items.findIndex(item => item.ref_id === this.refId)
      const fieldName = type === 'extractedData' ? itemPrefix + 'extractedData' : itemPrefix + 'comments'
      const fieldValue = type === 'extractedData' ? this.editValueExtracted : this.editValueComments

      if (existingItemIdx !== -1) {
        this.$set(this.characteristics.items[existingItemIdx], fieldName, fieldValue)
      } else {
        this.characteristics.items.push({
          ref_id: this.refId,
          authors: this.ui.authors,
          [fieldName]: fieldValue
        })
      }

      // Actualizar la vista local meta para feedback inmediato
      this.meta[metaIndex].values[itemIndex][fieldName] = fieldValue

      // Granular save: PATCH only this study row to the /item/<ref_id> sub-resource,
      // avoiding a Last-Write-Wins rewrite of the whole items array. The backend
      // upserts the matched item; other rows are left untouched. No refetch needed.
      const itemPayload = this.characteristics.items.find(it => String(it.ref_id) === String(this.refId))

      const request = this.characteristics.id
        ? Api.patch(`/isoqf_characteristics/${this.characteristics.id}/item/${this.refId}`, itemPayload)
        : Api.post('/isoqf_characteristics/', {
          organization: this.characteristics.organization,
          project_id: this.characteristics.project_id,
          items: [itemPayload]
        })

      request
        .then(response => {
          const responseData = response.data.$set || response.data
          this.characteristics = {
            ...this.characteristics,
            ...responseData,
            id: response.data.id || this.characteristics.id || response.data._id
          }

          if (!keepEditing) {
            this.cancelEditing()
            this.$notify.success(this.$t('notifications.saved'))
          }
          this.isSavingField = false
          this.$root.$emit('characteristics-updated', this.characteristics)
        })
        .catch(error => {
          console.error('Error saving characteristic field:', error)
          // Already announced by the lock channel, with the holder's name and the text
          // kept locally. The generic "try again" would contradict it.
          if (!isLockRejection(error)) {
            this.$notify.error(this.$t('notifications.save_error'))
          }
          this.isSavingField = false
          this.getCharacteristics()
        })
    },
    onSaveField (newValue) {
      this.saveField(newValue)
    },
    onAutoSaveField (newValue) {
      this.saveField(newValue, true)
    },
    getTabColor (stage, dIndex) {
      if (!this.assessments.items || !this.assessments.items[this.modal.index]) return null
      const currentItem = this.assessments.items[this.modal.index]
      if (!currentItem.stages || !currentItem.stages[stage]) return null
      if (!currentItem.stages[stage].options || !currentItem.stages[stage].options[dIndex]) return null
      const option = currentItem.stages[stage].options[dIndex].option
      if (!option) return null
      const response = this.ui.responses.find(r => r.value === option)
      return response ? response.color : null
    },
    isTabCompleted (stage, tabIndex) {
      if (!this.assessments.items || !this.assessments.items[this.modal.index]) return false

      const currentItem = this.assessments.items[this.modal.index]
      if (!currentItem.stages || !currentItem.stages[stage]) return false
      if (!currentItem.stages[stage].options || !currentItem.stages[stage].options[tabIndex]) return false

      const option = currentItem.stages[stage].options[tabIndex].option
      return option !== null
    }
  }
}
</script>

<style lang="scss">
.cursor-pointer {
  cursor: pointer;
}

.step-four-container {
  .help-link {
    color: #898989 !important;
    text-decoration: none !important;
    font-size: 0.9rem;

    &:hover,
    &:focus {
      color: #6c757d !important;
      text-decoration: underline !important;
    }
  }

  .color-preview-bars {
    gap: 1px;
    vertical-align: middle;
    align-items: center;

    .color-bar {
      width: 8px !important;
      height: 16px !important;
      display: block;
      flex-shrink: 0;
      border-radius: 1px;
    }
  }

  .camelot-table {
    font-size: 0.9rem;

    th,
    td {
      vertical-align: middle !important;
      padding: 0.75rem 0.5rem;
    }

    .assessment-col {
      width: 50px;
      min-width: 50px;
      padding: 0.5rem 0.25rem;
    }

    .edit-btn {
      white-space: nowrap;
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
    }
  }

  .header-top-row {
    background-color: #E9ECEF;
    color: #152536;

    th {
      border-bottom: none !important;
      padding: 1rem 0.5rem;
    }
  }

  .group-header {
    background-color: #E9ECEF;
  }

  .header-overall-group {
    background-color: #D8EBF5 !important;
  }

  .header-second-row {
    background-color: #D8DAE5 !important;
    color: #495057;

    th {
      font-weight: 500;
      font-size: 0.8rem;
      text-transform: uppercase;
    }
  }

  .header-overall-row {
    background-color: #D8EBF5 !important;
    color: #495057;

    th {
      font-weight: 500;
      font-size: 0.8rem;
    }
  }
}

.assessment-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.2);
  }
}

.circle-filled {
  border: none;
}

.circle-not-completed {
  border: 2px dashed #B3B3B3;
  background-color: transparent;
}

.camelot-modal-header {
  background-color: var(--modal-header-bg);
  color: var(--modal-header-color);
  border-bottom: none;
  padding: 1.5rem;

  .modal-breadcrumb {
    font-size: 0.85rem;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0.5px;
  }

  .modal-main-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #fff;
  }

  .close {
    color: #fff;
    text-shadow: none;
    opacity: 0.8;

    &:hover {
      opacity: 1;
    }
  }
}

.camelot-modal-footer {
  background-color: #F8F9FA;
  padding: 1.5rem;
  border-top: 1px solid #DEE2E6;

  .nav-footer-link {
    font-size: 0.95rem;
    font-weight: 500;
    color: #495057;
    cursor: pointer;
    text-decoration: none !important;
    transition: color 0.2s;

    &:hover {
      color: #1065AB;
      text-decoration: none !important;
    }
  }
}

.camelot-modal-body {
  color: #152536;
  background-color: #E9E9EB;

  h3 {
    font-size: 0.9rem;
    font-weight: bold;
    padding-bottom: 0.5rem;
  }

  h4 {
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    color: #495057;
    margin-bottom: 0;

    &:hover {
      color: #1065AB;
    }
  }

  h5 {
    font-size: 0.85rem;
    font-weight: bold;
    color: #152536;
    text-transform: uppercase;
  }

  p {
    font-size: 0.9rem;
    color: #212529;
  }
}

.modal-author {
  font-size: 1rem;
}

.modal-active-tab {
  font-weight: bold;
  background: linear-gradient(180deg, #dde3ec 0%, #cfd7e4 100%) !important;
  border-color: #287BDC !important;
}

.modal-active-tab-text {
  color: #1a5fa8 !important;
}

.modal-normal-tab {
  background-color: #E3E3E3 !important;
  border-color: #848E98 !important;
}

.modal-normal-tab-text {
  font-weight: bold;
  color: #212529 !important;
}

.column-header {
  margin-bottom: 1.5rem;
}

.text-wrap-pre {
  white-space: pre-wrap;
  word-break: break-word;
}

.edit-category-btn {
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none !important;

  &:hover {
    color: #0056b3 !important;
  }
}

.item-card {
  border: 1px solid #b6b6b6;
  border-radius: 0.5rem;
  overflow: hidden;

  .card-header {
    background-color: #CACACA;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #b6b6b6;
  }

  .card-body {
    padding: 1rem;
  }

  h3,
  h4 {
    border-bottom: none !important;
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
  }
}

@media (min-width: 1600px) {
  .camelot-modal-dialog {
    max-width: calc(100% - 80px) !important;
    margin: 1.75rem auto !important;
  }
}

.field-section {
  padding: 0.5rem;
  background-color: #fff;
  border-radius: 0.25rem;
}

.edit-btn-thin {
  padding: 0.1rem 0.4rem;
  font-size: 0.75rem;
  line-height: 1.2;
  white-space: nowrap;
  display: inline-flex !important;
  align-items: center;
  gap: 0.25rem;
}

.modal-column-scroll {
  max-height: max-content;
  overflow-y: auto;
  padding-right: 10px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #D8DAE5;
    border-radius: 3px;
  }
}

.b-sidebar-outer {
  z-index: 1060 !important;
}

.not-completed-alert {
  padding: 0 !important;
  display: flex !important;
  align-items: stretch;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  .alert-strip {
    width: 5px;
    flex-shrink: 0;
  }

  &.alert-warning {
    background: linear-gradient(90deg, #fff3cd 0%, #fff9e6 1%) !important;

    .alert-strip {
      background-color: #856404;
    }
  }

  &.alert-danger {
    background: linear-gradient(90deg, rgba(179, 21, 41, 0.1) 0%, rgba(179, 21, 41, 0.1) 100%) !important;
    border-color: #B31529;
    color: #B31529;

    .alert-strip {
      background-color: #B31529;
    }
  }

  .alert-content {
    padding: 0.25rem 0.5rem;
  }
}

html[data-theme="dark"] {
  .not-completed-alert {
    &.alert-warning {
      background: rgba(180, 120, 20, 0.2) !important;
      border-color: #a07820 !important;
      color: #f0c060;

      .alert-strip {
        background-color: #d4a017;
      }
    }
  }
}
</style>
