<template>
  <div class="camelot-summary-table-container">
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
          <th class="border-bottom-0">{{ $t('camelot.step_four.table_headers.authors') }}</th>
          <th colspan="4" class="text-center group-header border-left">{{ $t('camelot.step_four.tabs.fit_meta_design') }}</th>
          <th colspan="4" class="text-center group-header border-left">{{ $t('camelot.step_four.tabs.fit_meta_conduct') }}</th>
          <th class="text-center group-header border-left">{{ $t('camelot.step_four.tabs.fit_design_conduct') }}</th>
          <th class="text-center group-header border-left header-overall-group">{{ $t('camelot.step_four.tabs.overall') }}</th>
          <th class="border-bottom-0"></th>
        </tr>
      </template>

      <template v-slot:cell(authors)="data">
        <span class="font-weight-bold">{{ data.item.authors }}</span>
      </template>

      <!-- Step One: FA 1-4 -->
      <template v-slot:cell(fa1)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(0, 0, data.item)]" :style="getCircleStyle(0, 0, data.item)"></div>
        </div>
      </template>
      <template v-slot:cell(fa2)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(0, 1, data.item)]" :style="getCircleStyle(0, 1, data.item)"></div>
        </div>
      </template>
      <template v-slot:cell(fa3)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(0, 2, data.item)]" :style="getCircleStyle(0, 2, data.item)"></div>
        </div>
      </template>
      <template v-slot:cell(fa4)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(0, 3, data.item)]" :style="getCircleStyle(0, 3, data.item)"></div>
        </div>
      </template>

      <!-- Step Two: FA 5-8 -->
      <template v-slot:cell(fa5)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(1, 0, data.item)]" :style="getCircleStyle(1, 0, data.item)"></div>
        </div>
      </template>
      <template v-slot:cell(fa6)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(1, 1, data.item)]" :style="getCircleStyle(1, 1, data.item)"></div>
        </div>
      </template>
      <template v-slot:cell(fa7)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(1, 2, data.item)]" :style="getCircleStyle(1, 2, data.item)"></div>
        </div>
      </template>
      <template v-slot:cell(fa8)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(1, 3, data.item)]" :style="getCircleStyle(1, 3, data.item)"></div>
        </div>
      </template>

      <!-- Step Three: FA 9 -->
      <template v-slot:cell(fa9)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(2, 0, data.item)]" :style="getCircleStyle(2, 0, data.item)"></div>
        </div>
      </template>

      <!-- Step Four: OA -->
      <template v-slot:cell(oa)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(3, 0, data.item)]" :style="getCircleStyle(3, 0, data.item)"></div>
        </div>
      </template>

      <!-- Summary Action -->
      <template v-slot:cell(actions)="data">
        <b-button size="sm" variant="link" @click="data.toggleDetails" class="p-0 text-primary">
          {{ data.detailsShowing ? $t('common.hide') : $t('common.show') }} {{ $t('camelot.step_four.common.fit_assessment') }}
          <font-awesome-icon :icon="data.detailsShowing ? 'chevron-up' : 'chevron-down'" class="ml-1" />
        </b-button>
      </template>

      <!-- Row Details Summary -->
      <template v-slot:row-details="data">
        <div class="summary-details-panel p-3 bg-light border-top">
          <div v-for="(stage, sIdx) in 4" :key="sIdx" class="stage-section mb-4">
            <h5 class="stage-header px-2 py-1 mb-2">{{ getStageTitle(sIdx) }}</h5>
            
            <b-table-simple small striped hover responsive class="summary-sub-table bg-white border">
              <b-thead head-variant="light">
                <b-tr>
                  <b-th style="width: 80px">{{ $t('camelot.step_three.camelot_field') }}</b-th>
                  <b-th style="width: 50px"></b-th>
                  <b-th>{{ $t('camelot.step_four.common.fit_assessment') }}</b-th>
                </b-tr>
              </b-thead>
              <b-tbody>
                <b-tr v-for="(option, oIdx) in data.item.stages[sIdx].options" :key="oIdx">
                  <b-td class="font-weight-bold text-center vertical-middle">
                    {{ getAssessmentLabel(sIdx, oIdx) }}
                  </b-td>
                  <b-td class="text-center vertical-middle">
                    <div v-if="option.option" class="assessment-circle circle-filled mx-auto" :style="{ backgroundColor: getOptionColor(option.option) }"></div>
                  </b-td>
                  <b-td>
                    <div v-if="option.option">
                      <div class="font-weight-bold">{{ getOptionText(option.option) }}</div>
                      <div class="text-muted small italic text-wrap-pre">{{ option.text }}</div>
                    </div>
                    <div v-else class="text-muted small italic">{{ $t('camelot.step_four.legend.not_completed') }}</div>
                  </b-td>
                </b-tr>
              </b-tbody>
            </b-table-simple>
          </div>
        </div>
      </template>
    </b-table>
  </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons'

library.add(faChevronUp, faChevronDown)

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
    }
  },
  data() {
    const headerClass = 'header-second-row'
    const overallHeaderClass = 'header-overall-row'

    return {
      fields: [
        { key: 'authors', label: 'Fit assessments', thClass: headerClass, tdClass: 'border-right' },
        { key: 'fa1', label: 'FA 1', thClass: headerClass, tdClass: 'assessment-col' },
        { key: 'fa2', label: 'FA 2', thClass: headerClass, tdClass: 'assessment-col' },
        { key: 'fa3', label: 'FA 3', thClass: headerClass, tdClass: 'assessment-col' },
        { key: 'fa4', label: 'FA 4', thClass: headerClass, tdClass: 'border-right assessment-col' },
        { key: 'fa5', label: 'FA 5', thClass: headerClass, tdClass: 'assessment-col' },
        { key: 'fa6', label: 'FA 6', thClass: headerClass, tdClass: 'assessment-col' },
        { key: 'fa7', label: 'FA 7', thClass: headerClass, tdClass: 'assessment-col' },
        { key: 'fa8', label: 'FA 8', thClass: headerClass, tdClass: 'border-right assessment-col' },
        { key: 'fa9', label: 'FA 9', thClass: headerClass, tdClass: 'border-right assessment-col' },
        { key: 'oa', label: 'OA', thClass: overallHeaderClass, tdClass: 'border-right assessment-col' },
        { key: 'actions', label: '', thClass: headerClass }
      ],
      responses: [
        { text: this.$t('camelot.responses.no_minimal'), value: 'A', color: '#1065AB' },
        { text: this.$t('camelot.responses.minor'), value: 'B', color: '#8EC4DE' },
        { text: this.$t('camelot.responses.moderate'), value: 'C', color: '#F6A482' },
        { text: this.$t('camelot.responses.serious'), value: 'D', color: '#B31529' },
        { text: this.$t('camelot.responses.unclear'), value: 'E', color: '#B3B3B3' }
      ]
    }
  },
  computed: {
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
    }
  },
  methods: {
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
      const labels = [
        ['FA1', 'FA2', 'FA3', 'FA4'],
        ['FA5', 'FA6', 'FA7', 'FA8'],
        ['FA9']
      ]
      return labels[stage][index]
    }
  }
}
</script>

<style lang="scss" scoped>
.camelot-summary-table-container {
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
