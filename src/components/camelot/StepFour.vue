<template>
  <div class="step-four-container">
    <camelot-step-four-header :responses="ui.responses" />

    <camelot-step-four-table
      :fields="ui.fields"
      :items="tableItems"
      :responses="ui.responses"
      @open-modal="onOpenModal"
    />

    <b-modal id="modal-1" size="xl" header-class="camelot-modal-header" footer-class="camelot-modal-footer" body-class="camelot-modal-body">
      <template #modal-title>
        <div class="modal-title-container">
          <div class="modal-breadcrumb">
            {{ $t('camelot.step_four.breadcrumb_main') }} &gt; 
            {{ $t('camelot.step_four.breadcrumb_sub') }} &gt; 
            <span class="text-white">{{ ui.authors }}</span>
          </div>
          <div class="modal-main-title mt-1">
            {{ modalSubtitle }}
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
                  <h3>{{ modal.stage === 0 ? $t('camelot.step_four.sections.research_design') : $t('camelot.step_four.sections.research_conduct') }}</h3>
                </div>
                <div>
                  <camelot-assessment-card
                    v-for="(item, iIndex) in (modal.stage === 0 ? meta[1] : meta[2]).items"
                    :key="iIndex"
                    :meta-index="modal.stage === 0 ? 1 : 2"
                    :item-index="iIndex"
                    :label="getMetaItemLabel(modal.stage === 0 ? 1 : 2, iIndex)"
                    :extracted-data="(modal.stage === 0 ? meta[1] : meta[2]).values[iIndex][item + 'extractedData']"
                    :comments="(modal.stage === 0 ? meta[1] : meta[2]).values[iIndex][item + 'comments']"
                    :is-exclamation-active="displayExclamationAlert(modal.stage === 0 ? 1 : 2, iIndex)"
                    :editing-field="editingField"
                    :is-saving="isSavingField"
                    @start-editing="onStartEditing"
                    @cancel-editing="onCancelEditing"
                    @save-field="onSaveField"
                  />
                </div>
              </b-col>
              
              <!-- Columna 2: Navigation and Dynamic content -->
              <b-col cols="8">
                <div id="navegacion">
                  <b-tabs v-model="modal.tab" nav-class="modal-nav-tabs nav-fill" align="right" @input="selectedMeta = $event">
                    <b-tab 
                      v-for="(domain, dIndex) in ui.domainTabs" 
                      :key="dIndex"
                      :title-link-class="modal.tab === dIndex ? ['modal-active-tab', 'modal-active-tab-text'] : ['modal-normal-tab', 'modal-normal-tab-text']"
                      class="border p-2"
                      style="border-color: #848E98 !important;"
                    >
                      <template #title>
                        <div class="d-flex align-items-center justify-content-center">
                          <div v-if="!isTabCompleted(modal.stage, dIndex)" 
                            class="assessment-circle mr-2" 
                            :style="{
                              width: '20px', 
                              height: '20px', 
                              border: '2.5px dashed ' + (modal.tab === dIndex ? '#ffffff' : '#212529') + ' !important', 
                              background: 'transparent', 
                              borderRadius: '50%', 
                              display: 'inline-block'
                            }"></div>
                          {{ domain.label }}
                        </div>
                      </template>                      
                      <b-row class="mt-1">
                        <!-- Columna 2.1: Meta Domain item (Research, Stakeholders, etc.) -->
                        <b-col cols="6" class="modal-column-scroll 00000">
                          <camelot-assessment-card
                            :meta-index="0"
                            :item-index="dIndex"
                            :label="domain.label"
                            :extracted-data="meta[0].values[dIndex][meta[0].items[dIndex] + 'extractedData']"
                            :comments="meta[0].values[dIndex][meta[0].items[dIndex] + 'comments']"
                            :is-exclamation-active="displayExclamationAlert(0, dIndex)"
                            :editing-field="editingField"
                            :is-saving="isSavingField"
                            @start-editing="onStartEditing"
                            @cancel-editing="onCancelEditing"
                            @save-field="onSaveField"
                          />
                        </b-col>
                        
                        <!-- Columna 2.2: Assessment Evaluation -->
                        <b-col cols="6">
                          <assessmentForm
                            :assessments="assessments"
                            :modalStage="modal.stage"
                            :selectedMeta="dIndex"
                            :refId="refId"
                            :modalIndex="modal.index"
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
                    <camelot-assessment-card
                      v-for="(item, iIndex) in meta[1].items"
                      :key="iIndex"
                      :meta-index="1"
                      :item-index="iIndex"
                      :label="getMetaItemLabel(1, iIndex)"
                      :extracted-data="meta[1].values[iIndex][item + 'extractedData']"
                      :comments="meta[1].values[iIndex][item + 'comments']"
                      :is-exclamation-active="displayExclamationAlert(1, iIndex)"
                      :editing-field="editingField"
                      :is-saving="isSavingField"
                      @start-editing="onStartEditing"
                      @cancel-editing="onCancelEditing"
                      @save-field="onSaveField"
                    />
                  </div>
                </b-col>
                
                <!-- Columna 2: Research Conduct -->
                <b-col cols="4" class="modal-column-scroll">
                  <div class="column-header mb-3">
                    <h3>{{ $t('camelot.step_four.sections.research_conduct') }}</h3>
                  </div>
                  <div>
                    <camelot-assessment-card
                      v-for="(item, iIndex) in meta[2].items"
                      :key="iIndex"
                      :meta-index="2"
                      :item-index="iIndex"
                      :label="getMetaItemLabel(2, iIndex)"
                      :extracted-data="meta[2].values[iIndex][item + 'extractedData']"
                      :comments="meta[2].values[iIndex][item + 'comments']"
                      :is-exclamation-active="displayExclamationAlert(2, iIndex)"
                      :editing-field="editingField"
                      :is-saving="isSavingField"
                      @start-editing="onStartEditing"
                      @cancel-editing="onCancelEditing"
                      @save-field="onSaveField"
                    />
                  </div>
                </b-col>

                <!-- Columna 3: Assessment Evaluation -->
                <b-col cols="4">
                  <assessmentForm
                    :assessments="assessments"
                    :modalStage="2"
                    :selectedMeta="0"
                    :refId="refId"
                    :modalIndex="modal.index"
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
                    <b-card v-for="(domain, dIndex) in ui.domainTabs" :key="dIndex" class="mb-3 item-card" header-tag="header">
                      <template #header>
                        <div class="d-flex justify-content-between align-items-end">
                          <h4 :id="'fa' + dIndex + 1" class="mb-0 font-weight-bold">FA{{ dIndex + 1 }}</h4>
                          <b-tooltip :target="'fa' + dIndex + 1">{{ $t('camelot.step_four.sections.fit_between_design_meta') }}</b-tooltip>
                        </div>
                      </template>
                      <div class="field-section" v-if="assessments.items.length">
                        <responses
                          :stage="0"
                          :index="dIndex"
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
                    <b-card v-for="(domain, dIndex) in ui.domainTabs" :key="dIndex" class="mb-3 item-card" header-tag="header">
                      <template #header>
                        <div class="d-flex justify-content-between align-items-end">
                          <h4 :id="'fa' + dIndex + 5" class="mb-0 font-weight-bold">FA{{ dIndex + 5 }}</h4>
                          <b-tooltip :target="'fa' + dIndex + 5">{{ $t('camelot.step_four.sections.fit_between_conduct_meta') }}</b-tooltip>
                        </div>
                      </template>
                      <div class="field-section" v-if="assessments.items.length">
                        <responses
                          :stage="1"
                          :index="dIndex"
                          :option="assessments.items[modal.index].stages[1].options[dIndex].option"
                          :text="assessments.items[modal.index].stages[1].options[dIndex].text"></responses>
                      </div>
                    </b-card>
                  </div>
                </b-col>

                <!-- Columna 3: Fit Design vs Conduct Resumen (FA9) -->
                <b-col cols="3" class="modal-column-scroll">
                  <b-card  class="mb-3 item-card" header-tag="header">
                    <template #header>
                      <div class="d-flex justify-content-between align-items-end">
                        <h4 id="fa9" class="mb-0">FA9</h4>
                        <b-tooltip target="fa9">{{ $t('camelot.step_four.sections.fit_between_design_conduct') }}</b-tooltip>
                      </div>
                    </template>
                    <div class="p-1">
                      <responses
                        v-if="assessments.items.length"
                        :stage="2"
                        :index="0"
                        :option="assessments.items[modal.index].stages[2].options[0].option"
                        :text="assessments.items[modal.index].stages[2].options[0].text"></responses>
                    </div>
                  </b-card>                  
                </b-col>

                <!-- Columna 4: Evaluación de ajuste final -->
                <b-col cols="3" class="">
                  <assessmentForm
                    :assessments="assessments"
                    :modalStage="3"
                    :selectedMeta="0"
                    :refId="refId"
                    :modalIndex="modal.index"
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
  </div>
</template>

<script>
import Api from '@/utils/Api'
import Commons from '../../utils/commons.js'
import AssessmentForm from './assessment/AssessmentForm.vue'
import Responses from './Responses.vue'
import CamelotAssessmentCard from './CamelotAssessmentCard.vue'
import CamelotStepFourTable from './CamelotStepFourTable.vue'
import CamelotStepFourHeader from './CamelotStepFourHeader.vue'

export default {
  name: 'StepFour',
  props: {
    type: {
      type: String,
      required: true
    },
    references: {
      type: Array,
      required: true
    }
  },
  components: {
    AssessmentForm, Responses, CamelotAssessmentCard, CamelotStepFourTable, CamelotStepFourHeader
  },
  data () {
    const headerClass = 'header-second-row'
    const overallHeaderClass = 'header-overall-row'

    return {
      ui: {
        fields: [
          { key: 'authors', label: 'Fit assessments', thClass: headerClass, tdClass: 'border-right' },
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
      showLegend: false
    }
  },
  computed: {
    tableItems () {
      if (!this.assessments.items) return []
      return this.assessments.items.map(item => {
        const ref = this.references.find(r => r.id === item.ref_id)
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
    }
  },
  watch: {
    'modal.stage': function (newVal) {
      this.selectedMeta = 0
    },
    references: {
      handler (newVal) {
        this.getAssessments()
      },
      immediate: true
    }
  },
  mounted () {
    this.getAssessments()
  },
  methods: {
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
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      Api.get('/isoqf_assessments', params)
        .then(response => {
          if (response.data.length) {
            this.assessments = {...response.data[0]}
            if (this.assessments.items && this.assessments.items.length > 0) {
              this.assessments.items.sort((a, b) => {
                const authorsA = a.authors || '';
                const authorsB = b.authors || '';
                return authorsA.localeCompare(authorsB);
              });
            }
          } else {
            const sortedReferences = [...this.references].sort((a, b) => {
              const authorsA = this.getReferenceData(a) || '';
              const authorsB = this.getReferenceData(b) || '';
              return authorsA.localeCompare(authorsB);
            });

            this.assessments = {
              items: sortedReferences.map(ref => ({
                ref_id: ref.id,
                authors: this.getReferenceData(ref),
                stages: [
                  {
                    key: 0,
                    options: Array.from({ length: 4 }, () => ({ option: null, text: '' }))
                  },
                  {
                    key: 1,
                    options: Array.from({ length: 4 }, () => ({ option: null, text: '' }))
                  },
                  {
                    key: 2,
                    options: [{ option: null, text: '' }]
                  },
                  {
                    key: 3,
                    options: [{ option: null, text: '' }]
                  }
                ]
              }))
            }
          }
        })
        .catch(error => {
          console.error('Error fetching Assessments data:', error)
        })
    },
    getCharacteristics: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      Api.get('/isoqf_characteristics', params)
        .then(response => {
          if (!response.data || !response.data.length) return;
          
          const data = response.data[0]
          const items = data.items

          for (let x = 0; x < items.length; x++) {
            if (items[x].ref_id === this.refId) {
              for (let y = 0; y < this.meta.length; y++) {
                for (let z = 0; z < this.meta[y].items.length; z++) {
                  this.meta[y].values[z][this.meta[y].items[z] + 'extractedData'] = items[x][this.meta[y].items[z] + 'extractedData']
                  this.meta[y].values[z][this.meta[y].items[z] + 'comments'] = items[x][this.meta[y].items[z] + 'comments']
                }
              }
            }
          }

          this.characteristics = response.data[0]
        })
        .catch(error => {
          console.error('Error fetching characteristics:', error)
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
      this.$bvModal.show('modal-1')
    },
    onOpenModal({ stage, data, tab, faLabel = null }) {
      this.openModal(stage, data, tab, faLabel)
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
    onStartEditing({ metaIndex, itemIndex, type }) {
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
      this.editValueExtracted = ''
      this.editValueComments = ''
      if (metaIndex !== null && itemIndex !== null) {
        this.scrollToField(metaIndex, itemIndex)
      }
    },
    onCancelEditing() {
      this.cancelEditing()
    },
    saveField (newValue) {
      if (!this.characteristics) return
      
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

      const savePromise = this.characteristics.id
        ? Api.patch(`/isoqf_characteristics/${this.characteristics.id}/`, this.characteristics)
        : Api.post('/isoqf_characteristics/', this.characteristics)

      savePromise
        .then(response => {
          const responseData = response.data.$set || response.data
          // Sincronizar objeto local con respuesta del servidor
          this.characteristics = { 
            ...this.characteristics, 
            ...responseData, 
            id: response.data.id || this.characteristics.id || response.data._id 
          }
          
          this.cancelEditing()
          this.isSavingField = false
          // Notificar a otros componentes (Paso 3)
          this.$root.$emit('characteristics-updated', this.characteristics)
        })
        .catch(error => {
          console.error('Error saving characteristic field:', error)
          this.isSavingField = false
          this.getCharacteristics()
        })
    },
    onSaveField(newValue) {
      this.saveField(newValue)
    },
    isTabCompleted (stage, tabIndex) {
      if (!this.assessments.items || !this.assessments.items[this.modal.index]) return false
      
      const currentItem = this.assessments.items[this.modal.index]
      if (!currentItem.stages || !currentItem.stages[stage]) return false
      if (!currentItem.stages[stage].options || !currentItem.stages[stage].options[tabIndex]) return false
      
      const option = currentItem.stages[stage].options[tabIndex].option
      return option !== null
    },
    getCircleClass: function (stage, optionIndex, item) {
      if (!item || !item.stages || !item.stages[stage] || !item.stages[stage].options[optionIndex]) {
        return 'circle-not-completed'
      }
      const option = item.stages[stage].options[optionIndex].option
      return option === null ? 'circle-not-completed' : 'circle-filled'
    },
    getCircleStyle: function (stage, optionIndex, item) {
      if (!item || !item.stages || !item.stages[stage] || !item.stages[stage].options[optionIndex]) {
        return {}
      }
      const option = item.stages[stage].options[optionIndex].option
      if (option === null) return {}
      
      const response = this.ui.responses.find(r => r.value === option)
      return {
        backgroundColor: response ? response.color : '#B3B3B3'
      }
    }
  }
}
</script>

<style lang="scss">
.step-four-container {
  .help-link {
    color: #898989 !important;
    text-decoration: none !important;
    font-size: 0.9rem;
    
    &:hover, &:focus {
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
    
    th, td {
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
  background-color: #1E2137;
  color: #fff;
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
  background: linear-gradient(180deg, #287BDC 0%, #2C649B 100%) !important;
  border-color: #2C649B !important;
}
.modal-active-tab-text {
  color: #ffffff !important;
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

  h3, h4 {
    border-bottom: none !important;
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
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
    background: linear-gradient(90deg, #fff3cd 0%, #fff9e6 100%) !important;
    .alert-strip {
      background-color: #856404;
    }
  }

  &.alert-danger {
    background: linear-gradient(90deg, rgba(179, 21, 41, 0.5) 0%, rgba(179, 21, 41, 0.35) 100%) !important;
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
</style>
