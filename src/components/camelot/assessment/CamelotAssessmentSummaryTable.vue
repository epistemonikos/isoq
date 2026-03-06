<template>
  <div class="camelot-summary-table-container">
    <div v-if="!hideActions" class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="h5 mb-0 font-weight-bold text-secondary">{{ $t('camelot.step_four.breadcrumb_sub') }}</h4>
      
      <b-dropdown
        id="dropdown-filter-assessments"
        variant="outline-primary"
        size="sm"
        no-caret
        right
        class="assessment-filter-dropdown"
        @show="handleFilterDropdownShow"
      >
        <template #button-content>
          {{ $t('camelot.step_four.show_details_across_studies') }}
          <font-awesome-icon icon="filter" class="ml-1" />
        </template>
        <b-dropdown-form class="p-3" style="min-width: 320px; max-height: 500px; overflow-y: auto;">
          <h6 class="dropdown-header px-0 mb-2 font-weight-bold">{{ $t('common.filter_columns') }}</h6>
          
          <b-form-checkbox
            v-model="allVisible"
            class="mb-2 font-weight-bold"
            @change="toggleAllAssessments"
          >
            {{ $t('common.show_all') }}
          </b-form-checkbox>
          
          <div v-for="(group, gIdx) in filterGroups" :key="gIdx" class="filter-group-section mt-3">
            <div class="filter-group-title text-muted small font-weight-bold text-uppercase border-bottom mb-2 pb-1">
              {{ group.title }}
            </div>
            <div v-for="opt in group.options" :key="opt.value" class="mb-1 ml-2">
              <b-form-checkbox v-model="visibleAssessments" :value="opt.value">
                {{ opt.label }}
              </b-form-checkbox>
            </div>
          </div>
        </b-dropdown-form>
      </b-dropdown>
    </div>

    <b-table
      :fields="fields"
      :items="tableItems"
      bordered
      responsive
      class="camelot-table"
      thead-tr-class="header-second-row"
    >
      <template v-slot:thead-top>
        <tr class="header-top-row">
          <th class="border-bottom-0 bg-grey-light">{{ $t('camelot.step_four.table_headers.authors') }}</th>
          <th colspan="4" class="text-center group-header border-left bg-grey-lighter">{{ $t('camelot.step_four.tabs.fit_meta_design') }}</th>
          <th colspan="4" class="text-center group-header border-left bg-grey-lighter">{{ $t('camelot.step_four.tabs.fit_meta_conduct') }}</th>
          <th class="text-center group-header border-left bg-grey-lighter">{{ $t('camelot.step_four.tabs.fit_design_conduct') }}</th>
          <th class="text-center group-header border-left bg-grey-light">{{ $t('camelot.step_four.tabs.overall') }}</th>
          <th v-if="!hideActions" class="border-bottom-0 bg-grey-light"></th>
        </tr>
      </template>

      <template v-slot:cell(authors)="data">
        <span class="font-weight-bold">{{ data.item.authors }}</span>
      </template>

      <!-- Step One: FA 1-4 -->
      <template v-slot:cell(fa1)="data">
        <div class="d-flex justify-content-center">
          <div
            :class="['assessment-circle', getCircleClass(0, 0, data.item)]"
            :style="getCircleStyle(0, 0, data.item)"
            v-b-tooltip.hover="getCircleTooltip(0, 0, data.item)"
          ></div>
        </div>
      </template>
      <template v-slot:cell(fa2)="data">
        <div class="d-flex justify-content-center">
          <div
            :class="['assessment-circle', getCircleClass(0, 1, data.item)]"
            :style="getCircleStyle(0, 1, data.item)"
            v-b-tooltip.hover="getCircleTooltip(0, 1, data.item)"
          ></div>
        </div>
      </template>
      <template v-slot:cell(fa3)="data">
        <div class="d-flex justify-content-center">
          <div
            :class="['assessment-circle', getCircleClass(0, 2, data.item)]"
            :style="getCircleStyle(0, 2, data.item)"
            v-b-tooltip.hover="getCircleTooltip(0, 2, data.item)"
          ></div>
        </div>
      </template>
      <template v-slot:cell(fa4)="data">
        <div class="d-flex justify-content-center">
          <div
            :class="['assessment-circle', getCircleClass(0, 3, data.item)]"
            :style="getCircleStyle(0, 3, data.item)"
            v-b-tooltip.hover="getCircleTooltip(0, 3, data.item)"
          ></div>
        </div>
      </template>

      <!-- Step Two: FA 5-8 -->
      <template v-slot:cell(fa5)="data">
        <div class="d-flex justify-content-center">
          <div
            :class="['assessment-circle', getCircleClass(1, 0, data.item)]"
            :style="getCircleStyle(1, 0, data.item)"
            v-b-tooltip.hover="getCircleTooltip(1, 0, data.item)"
          ></div>
        </div>
      </template>
      <template v-slot:cell(fa6)="data">
        <div class="d-flex justify-content-center">
          <div
            :class="['assessment-circle', getCircleClass(1, 1, data.item)]"
            :style="getCircleStyle(1, 1, data.item)"
            v-b-tooltip.hover="getCircleTooltip(1, 1, data.item)"
          ></div>
        </div>
      </template>
      <template v-slot:cell(fa7)="data">
        <div class="d-flex justify-content-center">
          <div
            :class="['assessment-circle', getCircleClass(1, 2, data.item)]"
            :style="getCircleStyle(1, 2, data.item)"
            v-b-tooltip.hover="getCircleTooltip(1, 2, data.item)"
          ></div>
        </div>
      </template>
      <template v-slot:cell(fa8)="data">
        <div class="d-flex justify-content-center">
          <div
            :class="['assessment-circle', getCircleClass(1, 3, data.item)]"
            :style="getCircleStyle(1, 3, data.item)"
            v-b-tooltip.hover="getCircleTooltip(1, 3, data.item)"
          ></div>
        </div>
      </template>

      <!-- Step Three: FA 9 -->
      <template v-slot:cell(fa9)="data">
        <div class="d-flex justify-content-center">
          <div
            :class="['assessment-circle', getCircleClass(2, 0, data.item)]"
            :style="getCircleStyle(2, 0, data.item)"
            v-b-tooltip.hover="getCircleTooltip(2, 0, data.item)"
          ></div>
        </div>
      </template>

      <!-- Step Four: OA -->
      <template v-slot:cell(oa)="data">
        <div class="d-flex justify-content-center">
          <div
            :class="['assessment-circle', getCircleClass(3, 0, data.item)]"
            :style="getCircleStyle(3, 0, data.item)"
            v-b-tooltip.hover="getCircleTooltip(3, 0, data.item)"
          ></div>
        </div>
      </template>

      <!-- Summary Action -->
      <template v-slot:cell(actions)="data">
        <b-button size="sm" variant="outline-primary" @click="handleToggleDetails(data)" class="p-0 summary-toggle-btn">
          {{ data.detailsShowing ? $t('common.hide') : $t('common.show') }}
          <font-awesome-icon :icon="data.detailsShowing ? 'eye-slash' : 'eye'" class="ml-1" />
        </b-button>
      </template>

      <!-- Row Details Summary -->
      <template v-slot:row-details="data">
        <div class="summary-details-panel p-3 bg-light border-top">
          <template v-if="data.item.stages">
            <div v-for="stageIdx in activeStages" :key="stageIdx" class="stage-section mb-4">
              <template v-if="data.item.stages[stageIdx]">
                <h5 class="stage-header px-2 py-1 mb-2">{{ getStageTitle(stageIdx) }}</h5>
                
                <b-table-simple small striped hover responsive class="summary-sub-table bg-white border">
                  <b-tbody>
                    <template v-if="data.item.stages[stageIdx].options">
                      <template v-for="(option, oIdx) in data.item.stages[stageIdx].options">
                        <b-tr v-if="isAssessmentVisible(stageIdx, oIdx)" :key="oIdx">
                          <b-td class="font-weight-bold text-left vertical-middle first-col">
                            {{ getAssessmentLabel(stageIdx, oIdx) }}
                          </b-td>
                          <b-td class="text-center vertical-middle">
                            <div v-if="option.option" class="assessment-circle circle-filled mx-auto" :style="{ backgroundColor: getOptionColor(option.option) }"></div>
                            <div v-else class="assessment-circle circle-not-completed mx-auto"></div>
                          </b-td>
                          <b-td>
                            <div v-if="option.option">
                              <div class="font-weight-bold">{{ getOptionText(option.option) }}</div>
                              <div class="text-muted small italic text-wrap-pre">{{ option.text }}</div>
                            </div>
                            <div v-else class="text-muted small italic">{{ $t('camelot.step_four.legend.not_completed') }}</div>
                          </b-td>
                        </b-tr>
                      </template>
                    </template>
                  </b-tbody>
                </b-table-simple>
              </template>
            </div>
          </template>
          <div v-if="activeStages.length === 0 || !data.item.stages" class="text-center py-4 text-muted">
            <font-awesome-icon icon="filter" size="2x" class="mb-3 opacity-50" />
            <p>{{ $t('common.no_records') }}</p>
          </div>
        </div>
      </template>
    </b-table>
  </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronUp, faChevronDown, faFilter } from '@fortawesome/free-solid-svg-icons'

library.add(faChevronUp, faChevronDown, faFilter)

export default {
  name: 'CamelotAssessmentSummaryTable',
  props: {
    assessments: {
      type: Object,
      required: true
    },
    references: {
      type: Array,
      default: () => []
    },
    hideActions: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      responses: [
        { text: this.$t('camelot.responses.no_minimal'), value: 'A', color: '#1065AB' },
        { text: this.$t('camelot.responses.minor'), value: 'B', color: '#8EC4DE' },
        { text: this.$t('camelot.responses.moderate'), value: 'C', color: '#F6A482' },
        { text: this.$t('camelot.responses.serious'), value: 'D', color: '#B31529' },
        { text: this.$t('camelot.responses.unclear'), value: 'E', color: '#B3B3B3' }
      ],
      visibleAssessments: ['0-0', '0-1', '0-2', '0-3', '1-0', '1-1', '1-2', '1-3', '2-0', '3-0'],
      allVisible: true
    }
  },
  computed: {
    fields() {
      const faPrefix = this.$t('camelot.step_four.table_headers.fa_prefix') || 'FA'
      const oaLabel = this.$t('camelot.step_four.table_headers.oa_label') || 'OA'

      const fields = [
        { key: 'authors', label: this.$t('camelot.step_four.breadcrumb_sub'), thClass: 'header-second-row text-left', tdClass: 'border-right' },
        { key: 'fa1', label: `${faPrefix} 1`, thClass: 'header-second-row text-center', tdClass: 'assessment-col' },
        { key: 'fa2', label: `${faPrefix} 2`, thClass: 'header-second-row text-center', tdClass: 'assessment-col' },
        { key: 'fa3', label: `${faPrefix} 3`, thClass: 'header-second-row text-center', tdClass: 'assessment-col' },
        { key: 'fa4', label: `${faPrefix} 4`, thClass: 'header-second-row text-center border-right', tdClass: 'border-right assessment-col' },
        { key: 'fa5', label: `${faPrefix} 5`, thClass: 'header-second-row text-center', tdClass: 'assessment-col' },
        { key: 'fa6', label: `${faPrefix} 6`, thClass: 'header-second-row text-center', tdClass: 'assessment-col' },
        { key: 'fa7', label: `${faPrefix} 7`, thClass: 'header-second-row text-center', tdClass: 'assessment-col' },
        { key: 'fa8', label: `${faPrefix} 8`, thClass: 'header-second-row text-center border-right', tdClass: 'border-right assessment-col' },
        { key: 'fa9', label: `${faPrefix} 9`, thClass: 'header-second-row text-center border-right', tdClass: 'border-right assessment-col' },
        { key: 'oa', label: oaLabel, thClass: 'header-second-row text-center border-right', tdClass: 'border-right assessment-col' }
      ]

      if (!this.hideActions) {
        fields.push({ key: 'actions', label: '', thClass: 'header-second-row text-center' })
      }

      return fields
    },
    filterGroups() {
      return [
        {
          title: this.getStageTitle(0),
          options: [
            { label: this.$t('camelot.step_four.camelot_mixin.meta_domain_1'), value: '0-0' },
            { label: this.$t('camelot.step_four.camelot_mixin.meta_domain_2'), value: '0-1' },
            { label: this.$t('camelot.step_four.camelot_mixin.meta_domain_3'), value: '0-2' },
            { label: this.$t('camelot.step_four.camelot_mixin.meta_domain_4'), value: '0-3' }
          ]
        },
        {
          title: this.getStageTitle(1),
          options: [
            { label: this.$t('camelot.step_four.camelot_mixin.meta_domain_1'), value: '1-0' },
            { label: this.$t('camelot.step_four.camelot_mixin.meta_domain_2'), value: '1-1' },
            { label: this.$t('camelot.step_four.camelot_mixin.meta_domain_3'), value: '1-2' },
            { label: this.$t('camelot.step_four.camelot_mixin.meta_domain_4'), value: '1-3' }
          ]
        },
        {
          title: this.getStageTitle(2),
          options: [
            { label: this.$t('camelot.step_four.sections.fit_between_design_conduct'), value: '2-0' }
          ]
        },
        {
          title: this.getStageTitle(3),
          options: [
            { label: this.$t('camelot.step_four.tabs.overall'), value: '3-0' }
          ]
        }
      ]
    },
    tableItems() {
      if (!this.assessments || !this.assessments.items) return []

      let filteredItems = this.assessments.items
      if (this.references && this.references.length > 0) {
        const referenceIds = this.references.map(ref => {
          if (typeof ref === 'object' && ref !== null) {
            return String(ref.id || ref.ref_id)
          }
          return String(ref)
        })
        filteredItems = filteredItems.filter(item => referenceIds.includes(String(item.ref_id)))
      }

      return filteredItems
    },
    activeStages() {
      const active = []
      for (let stageIdx = 0; stageIdx < 4; stageIdx++) {
        const hasVisibleAssessment = this.visibleAssessments.some(v => v.startsWith(`${stageIdx}-`))
        if (hasVisibleAssessment) {
          active.push(stageIdx)
        }
      }
      return active
    },
    allAssessmentValues() {
      return this.filterGroups.flatMap(g => g.options.map(o => o.value))
    }
  },
  watch: {
    visibleAssessments(newVal) {
      this.allVisible = newVal.length === this.allAssessmentValues.length
      // Al cambiar los filtros, nos aseguramos de que todos los detalles estén abiertos si hay filtros activos
      if (newVal.length < this.allAssessmentValues.length && newVal.length > 0) {
        this.expandAllDetails(true)
      }
    }
  },
  methods: {
    handleFilterDropdownShow() {
      // Al abrir el filtro, si hay algún estudio abierto, los cerramos todos.
      const anyShowing = this.tableItems.some(item => item._showDetails)
      if (anyShowing) {
        this.expandAllDetails(false)
      } else {
        // Si no hay ninguno abierto, abrimos todos (mostrando la información filtrada)
        this.expandAllDetails(true)
      }
    },
    handleToggleDetails(data) {
      // Al presionar show o hide individual, se cierran todos los demás y se resetean los filtros
      const currentItemId = data.item.ref_id
      this.tableItems.forEach(item => {
        if (item.ref_id !== currentItemId) {
          this.$set(item, '_showDetails', false)
        }
      })
      
      this.toggleAllAssessments(true)
      data.toggleDetails()
    },
    expandAllDetails(show) {
      this.tableItems.forEach(item => {
        this.$set(item, '_showDetails', show)
      })
    },
    toggleAllAssessments(checked) {
      if (checked) {
        this.visibleAssessments = [...this.allAssessmentValues]
      } else {
        this.visibleAssessments = []
      }
    },
    isAssessmentVisible(stageIdx, oIdx) {
      return this.visibleAssessments.includes(`${stageIdx}-${oIdx}`)
    },
    getCircleClass(stage, optionIndex, item) {
      if (!item || !item.stages || !item.stages[stage] || !item.stages[stage].options[optionIndex]) {
        return 'circle-not-completed'
      }
      const option = item.stages[stage].options[optionIndex].option
      return option === null ? 'circle-not-completed' : 'circle-filled'
    },
    getCircleStyle(stage, optionIndex, item) {
      if (!item || !item.stages || !item.stages[stage] || !item.stages[stage].options[optionIndex]) {
        return {}
      }
      const option = item.stages[stage].options[optionIndex].option
      if (option === null) return {}
      
      const response = this.responses.find(r => r.value === option)
      return {
        backgroundColor: response ? response.color : '#B3B3B3'
      }
    },
    getOptionColor(optionValue) {
      const response = this.responses.find(r => r.value === optionValue)
      return response ? response.color : '#B3B3B3'
    },
    getOptionText(optionValue) {
      const response = this.responses.find(r => r.value === optionValue)
      return response ? response.text : optionValue
    },
    getCircleTooltip(stage, optionIndex, item) {
      if (!item || !item.stages || !item.stages[stage] || !item.stages[stage].options[optionIndex]) {
        return this.$t('camelot.step_four.legend.not_completed')
      }
      const optionValue = item.stages[stage].options[optionIndex].option
      if (optionValue === null) {
        return this.$t('camelot.step_four.legend.not_completed')
      }
      const response = this.responses.find(r => r.value === optionValue)
      return response ? response.text : optionValue
    },
    getStageTitle(stage) {
      const stages = [
        'fit_meta_design',
        'fit_meta_conduct',
        'fit_design_conduct',
        'overall'
      ]
      return this.$t(`camelot.step_four.tabs.${stages[stage]}`)
    },
    getAssessmentLabel(stage, index) {
      if (stage === 3) return this.$t('camelot.step_four.tabs.overall')
      const keys = [
        [
          'camelot.step_four.camelot_mixin.meta_domain_1',
          'camelot.step_four.camelot_mixin.meta_domain_2',
          'camelot.step_four.camelot_mixin.meta_domain_3',
          'camelot.step_four.camelot_mixin.meta_domain_4'
        ],
        [
          'camelot.step_four.camelot_mixin.meta_domain_1',
          'camelot.step_four.camelot_mixin.meta_domain_2',
          'camelot.step_four.camelot_mixin.meta_domain_3',
          'camelot.step_four.camelot_mixin.meta_domain_4'
        ],
        [
          'camelot.step_four.sections.fit_between_design_conduct'
        ]
      ]
      const key = keys[stage] ? keys[stage][index] : null
      return key ? this.$t(key) : ''
    }
  }
}
</script>

<style lang="scss" scoped>
.camelot-summary-table-container {
  ::v-deep .table-bordered {
    border: 1px solid #AAADB0 !important;
    
    th, td {
      border: 1px solid #AAADB0 !important;
    }
  }

  .camelot-table {
    font-size: 0.9rem;
    
    ::v-deep th, ::v-deep td {
      vertical-align: middle !important;
      padding: 0.75rem 0.5rem;
    }
    
    .assessment-col {
      width: 45px;
      min-width: 45px;
      padding: 0.5rem 0.25rem;
    }
  }

  .header-top-row {
    color: #152536;
    
    th {
      border-bottom: none !important;
      padding: 1rem 0.5rem;
    }

    .bg-grey-light {
      background-color: #E2E2E2 !important;
    }

    .bg-grey-lighter {
      background-color: #E9ECEF !important;
    }
  }

  .group-header {
  }

  .header-overall-group {
  }

  ::v-deep .header-second-row {
    background-color: #D3E9FF !important;
    color: #495057 !important;
    font-weight: bold;
    font-size: 0.8rem;
    text-transform: uppercase;
    vertical-align: middle !important;

    &.text-center {
      text-align: center !important;
    }

    &.text-left {
      text-align: left !important;
    }
  }

  .assessment-circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .circle-filled {
    border: none;
  }

  .circle-not-completed {
    border: 2px dashed #B3B3B3;
    background-color: transparent;
  }

  .summary-details-panel {
    border-left: 4px solid #1065AB;
  }

  .assessment-filter-dropdown {
    ::v-deep .dropdown-menu {
      padding: 0;
      border-radius: 0.5rem;
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }
  }

  .filter-group-title {
    color: #1065AB !important;
    letter-spacing: 0.02em;
  }

  .stage-header {
    background-color: #f0f2f5;
    color: #2c3e50;
    font-size: 0.95rem;
    font-weight: 700;
    text-transform: uppercase;
    border-left: 3px solid #1065AB;
    border-radius: 0 4px 4px 0;
  }

  .summary-sub-table {
    font-size: 0.85rem;
    margin-bottom: 0;
    table-layout: fixed;

    .first-col {
      width: 25%;
    }
    
    ::v-deep th {
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }

    .vertical-middle {
      vertical-align: middle;
    }
  }

  .text-wrap-pre {
    white-space: pre-wrap;
    word-break: break-word;
  }

  .italic {
    font-style: italic;
  }
}
</style>
