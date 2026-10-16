<template>
  <div class="camelot-summary-table-container">
    <div v-if="!hideActions" class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="h5 mr-auto mb-0 font-weight-bold text-secondary">{{ $t('camelot.step_four.breadcrumb_sub') }}</h4>

      <b-button variant="link" class="text-secondary" v-b-toggle.sidebar-right>
        {{ $t('camelot.assessment_table.sidebar.title') }}
      </b-button>

      <b-dropdown id="dropdown-filter-assessments" variant="outline-primary" size="sm" no-caret right
        class="assessment-filter-dropdown" v-bind="modalSafeDropdown">
        <template #button-content>
          {{ $t('camelot.step_four.show_details_across_studies') }}
          <font-awesome-icon icon="filter" class="ml-1" />
        </template>
        <b-dropdown-form class="p-3" :style="filterMenuStyle">
          <h6 class="dropdown-header px-0 mb-2 font-weight-bold">{{ $t('common.filter_columns') }}</h6>

          <b-form-radio-group v-model="selectedAssessment" name="assessment-filter" stacked>
            <b-form-radio value="all" class="mb-1 font-weight-bold">{{ $t('common.show_all') }}</b-form-radio>
            <b-form-radio value="none" class="mb-2 font-weight-bold">{{ $t('common.hide_all') }}</b-form-radio>
            <b-form-radio v-for="opt in filterOptions" :key="opt.value" :value="opt.value" class="mb-1">
              {{ opt.label }}
            </b-form-radio>
          </b-form-radio-group>
        </b-dropdown-form>
      </b-dropdown>
    </div>

    <b-table :fields="fields" :items="tableItems" bordered responsive class="camelot-table"
      thead-tr-class="header-second-row">
      <template v-slot:thead-top>
        <tr class="header-top-row">
          <th class="border-bottom-0 bg-grey-light">{{ $t('camelot.step_four.table_headers.authors') }}</th>
          <th colspan="4" class="text-center group-header border-left bg-grey-lighter">{{
            $t('camelot.step_four.tabs.fit_meta_design') }}</th>
          <th colspan="4" class="text-center group-header border-left bg-grey-lighter">{{
            $t('camelot.step_four.tabs.fit_meta_conduct') }}</th>
          <th class="text-center group-header border-left bg-grey-lighter">{{
            $t('camelot.step_four.tabs.fit_design_conduct') }}</th>
          <th class="text-center group-header border-left bg-grey-light">{{ $t('camelot.step_four.tabs.overall') }}</th>
          <th v-if="!hideActions" class="border-bottom-0 bg-grey-light"></th>
        </tr>
      </template>

      <template v-slot:cell(authors)="data">
        <span class="font-weight-bold">{{ data.item.authors }}</span>
      </template>

      <!-- Dynamic Clickable Headers -->
      <template v-for="field in fields.filter(f => f.assessmentKey)" v-slot:[`head(${field.key})`]="data">
        <div v-if="clickableHeaders" :key="field.key"
          class="w-100 h-100 d-flex align-items-center justify-content-center cursor-pointer"
          @click="handleHeaderClick(field.assessmentKey)" v-b-tooltip.hover
          :title="$t('camelot.step_four.tooltips.filter_by_this')">
          <u>
            {{ data.label }}
          </u>
        </div>
        <template v-else><span :key="field.key">{{ data.label }}</span></template>
      </template>

      <!-- Step One: FA 1-4 -->
      <template v-slot:cell(fa1)="data">
        <div class="d-flex justify-content-center">
          <assessment-circle :stage="0" :option-index="0" :item="data.item"
            :responses="responses" :tooltip="getCircleTooltip(0, 0, data.item)" />
        </div>
      </template>
      <template v-slot:cell(fa2)="data">
        <div class="d-flex justify-content-center">
          <assessment-circle :stage="0" :option-index="1" :item="data.item"
            :responses="responses" :tooltip="getCircleTooltip(0, 1, data.item)" />
        </div>
      </template>
      <template v-slot:cell(fa3)="data">
        <div class="d-flex justify-content-center">
          <assessment-circle :stage="0" :option-index="2" :item="data.item"
            :responses="responses" :tooltip="getCircleTooltip(0, 2, data.item)" />
        </div>
      </template>
      <template v-slot:cell(fa4)="data">
        <div class="d-flex justify-content-center">
          <assessment-circle :stage="0" :option-index="3" :item="data.item"
            :responses="responses" :tooltip="getCircleTooltip(0, 3, data.item)" />
        </div>
      </template>

      <!-- Step Two: FA 5-8 -->
      <template v-slot:cell(fa5)="data">
        <div class="d-flex justify-content-center">
          <assessment-circle :stage="1" :option-index="0" :item="data.item"
            :responses="responses" :tooltip="getCircleTooltip(1, 0, data.item)" />
        </div>
      </template>
      <template v-slot:cell(fa6)="data">
        <div class="d-flex justify-content-center">
          <assessment-circle :stage="1" :option-index="1" :item="data.item"
            :responses="responses" :tooltip="getCircleTooltip(1, 1, data.item)" />
        </div>
      </template>
      <template v-slot:cell(fa7)="data">
        <div class="d-flex justify-content-center">
          <assessment-circle :stage="1" :option-index="2" :item="data.item"
            :responses="responses" :tooltip="getCircleTooltip(1, 2, data.item)" />
        </div>
      </template>
      <template v-slot:cell(fa8)="data">
        <div class="d-flex justify-content-center">
          <assessment-circle :stage="1" :option-index="3" :item="data.item"
            :responses="responses" :tooltip="getCircleTooltip(1, 3, data.item)" />
        </div>
      </template>

      <!-- Step Three: FA 9 -->
      <template v-slot:cell(fa9)="data">
        <div class="d-flex justify-content-center">
          <assessment-circle :stage="2" :option-index="0" :item="data.item"
            :responses="responses" :tooltip="getCircleTooltip(2, 0, data.item)" />
        </div>
      </template>

      <!-- Step Four: OA -->
      <template v-slot:cell(oa)="data">
        <div class="d-flex justify-content-center">
          <assessment-circle :stage="3" :option-index="0" :item="data.item"
            :responses="responses" :tooltip="getCircleTooltip(3, 0, data.item)" />
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
                <!-- <h5 class="stage-header px-2 py-1 mb-2">{{ getStageTitle(stageIdx) }}</h5> -->

                <b-table-simple small striped hover responsive class="summary-sub-table bg-white border">
                  <b-tbody>
                    <template v-if="data.item.stages[stageIdx].options">
                      <template v-for="(option, oIdx) in data.item.stages[stageIdx].options">
                        <b-tr v-if="isAssessmentVisible(stageIdx, oIdx)" :key="oIdx">
                          <b-td class="text-left vertical-middle first-col" v-html="getAssessmentLabel(stageIdx, oIdx)">
                          </b-td>
                          <b-td class="text-center vertical-middle">
                            <div v-if="option.option" class="assessment-circle circle-filled mx-auto"
                              :style="{ backgroundColor: getOptionColor(option.option) }"></div>
                            <div v-else class="assessment-circle circle-not-completed mx-auto"></div>
                          </b-td>
                          <b-td>
                            <div v-if="option.option">
                              <div class="font-weight-bold">
                                <b-badge :style="{ backgroundColor: getOptionColor(option.option) }">
                                  {{ getOptionText(option.option) }}
                                </b-badge>
                              </div>
                              <div v-if="option.text" class="text-muted small text-wrap-pre">{{ option.text }}
                              </div>
                              <div v-else class="text-danger small">
                                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                                {{ $t('worksheet.labels.explanation_not_added') }}
                              </div>
                            </div>
                            <div v-else class="text-muted small italic">{{ $t('camelot.step_four.legend.not_completed')
                            }}</div>
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

    <b-sidebar id="sidebar-right" :title="$t('camelot.assessment_table.sidebar.title')" right backdrop shadow>
      <div class="px-3 py-2 sidebar-instructions">
        <p>
          {{ $t('camelot.assessment_table.sidebar.intro') }}
        </p>

        <p>{{ $t('camelot.assessment_table.sidebar.tips.title') }}</p>
        <ul>
          <li>
            {{ $t('camelot.assessment_table.sidebar.tips.tip_1') }}
          </li>
          <li>
            {{ $t('camelot.assessment_table.sidebar.tips.tip_2') }}
          </li>
          <li>
            {{ $t('camelot.assessment_table.sidebar.tips.tip_3') }}
          </li>
          <li>
            {{ $t('camelot.assessment_table.sidebar.tips.tip_4') }}
          </li>
        </ul>
      </div>

    </b-sidebar>
  </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronUp, faChevronDown, faFilter } from '@fortawesome/free-solid-svg-icons'
import AssessmentCircle from '@/components/camelot/AssessmentCircle.vue'
import {
  ASSESSMENT_CELLS,
  ASSESSMENT_POSITION_KEYS,
  positionKeyOf
} from '@/utils/camelotAssessmentKeys'
import { MODAL_SAFE_DROPDOWN, MODAL_SAFE_MENU_STYLE } from '@/utils/modalSafeDropdown'

library.add(faChevronUp, faChevronDown, faFilter)

// Columns that close a visual group and therefore carry the right border.
const GROUP_END_CELLS = ['fa4', 'fa8', 'fa9', 'oa']

export default {
  name: 'CamelotAssessmentSummaryTable',
  components: { AssessmentCircle },
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
    },
    clickableHeaders: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      responses: [
        { text: this.$t('camelot.responses.no_minimal'), value: 'A', color: '#1065AB' },
        { text: this.$t('camelot.responses.minor'), value: 'B', color: '#8EC4DE' },
        { text: this.$t('camelot.responses.moderate'), value: 'C', color: '#F6A482' },
        { text: this.$t('camelot.responses.serious'), value: 'D', color: '#B31529' },
        { text: this.$t('camelot.responses.unclear'), value: 'E', color: '#B3B3B3' }
      ],
      // The one view state of the summary (#391): 'all' and 'none' show and hide
      // the details of every study; a position key ('0-0' … '3-0') shows only that
      // assessment, in every study. Opening or closing the menu never changes it.
      selectedAssessment: 'all',
      modalSafeDropdown: MODAL_SAFE_DROPDOWN,
      filterMenuStyle: { minWidth: '320px', ...MODAL_SAFE_MENU_STYLE }
    }
  },
  computed: {
    fields () {
      const faPrefix = this.$t('camelot.step_four.table_headers.fa_prefix') || 'FA'
      const oaLabel = this.$t('camelot.step_four.table_headers.oa_label') || 'OA'

      const thClass = `header-second-row text-center ${this.clickableHeaders ? 'clickable-header' : ''}`
      const oaThClass = `header-overall-row text-center ${this.clickableHeaders ? 'clickable-header' : ''}`

      const fields = [
        { key: 'authors', label: this.$t('camelot.step_four.breadcrumb_sub'), thClass: 'header-second-row text-left', tdClass: 'border-right' },
        ...ASSESSMENT_CELLS.map((cell, index) => {
          const isOverall = cell.key === 'oa'
          const endsGroup = GROUP_END_CELLS.includes(cell.key)
          const baseThClass = isOverall ? oaThClass : thClass
          return {
            key: cell.key,
            assessmentKey: positionKeyOf(cell.key),
            label: isOverall ? oaLabel : `${faPrefix} ${index + 1}`,
            thClass: endsGroup ? `${baseThClass} border-right` : baseThClass,
            tdClass: endsGroup ? 'border-right assessment-col' : 'assessment-col'
          }
        })
      ]

      if (!this.hideActions) {
        fields.push({ key: 'actions', label: '', thClass: 'header-second-row text-center' })
      }

      return fields
    },
    // One radio per assessment (#391): the filter shows one assessment across
    // studies, or all of them. Derived from the grid so it cannot drift from it.
    filterOptions () {
      return ASSESSMENT_CELLS.map(cell => ({
        label: this.$t(`camelot.step_four.filter_options.${cell.key}`),
        value: positionKeyOf(cell.key)
      }))
    },
    // What the row details show. With 'none' a row opened by hand shows everything.
    visibleAssessments () {
      return ASSESSMENT_POSITION_KEYS.includes(this.selectedAssessment)
        ? [this.selectedAssessment]
        : [...ASSESSMENT_POSITION_KEYS]
    },
    detailsShownBySelection () {
      return this.selectedAssessment !== 'none'
    },
    tableItems () {
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

      // Si hideActions es true (vista Worksheet), forzamos que no se muestren los detalles
      if (this.hideActions) {
        return filteredItems.map(item => ({
          ...item,
          _showDetails: false
        }))
      }

      return filteredItems
    },
    activeStages () {
      const active = []
      for (let stageIdx = 0; stageIdx < 4; stageIdx++) {
        const hasVisibleAssessment = this.visibleAssessments.some(v => v.startsWith(`${stageIdx}-`))
        if (hasVisibleAssessment) {
          active.push(stageIdx)
        }
      }
      return active
    }
  },
  watch: {
    selectedAssessment () {
      this.expandAllDetails(this.detailsShownBySelection)
    },
    // Studies that arrive later (first load, reload after a save) follow the
    // current selection; a row already opened or closed by hand keeps its state.
    tableItems: {
      immediate: true,
      handler (items) {
        if (this.hideActions) return
        items.forEach(item => {
          if (item._showDetails === undefined) this.$set(item, '_showDetails', this.detailsShownBySelection)
        })
      }
    }
  },
  methods: {
    handleHeaderClick (assessmentKey) {
      if (!this.clickableHeaders) return

      this.selectedAssessment = assessmentKey
      // Clicking the header already selected still shows every study again.
      this.expandAllDetails(true)
    },
    // A row's own Show/Hide button opens or closes only that row, with the
    // current selection; it does not touch the selection or the other rows.
    handleToggleDetails (data) {
      data.toggleDetails()
    },
    expandAllDetails (show) {
      this.tableItems.forEach(item => {
        this.$set(item, '_showDetails', show)
      })
    },
    isAssessmentVisible (stageIdx, oIdx) {
      return this.visibleAssessments.includes(`${stageIdx}-${oIdx}`)
    },
    // Called when the modal opens: Show all, with every detail shown.
    resetTableState () {
      this.selectedAssessment = 'all'
      this.expandAllDetails(true)
    },
    getOptionColor (optionValue) {
      const response = this.responses.find(r => r.value === optionValue)
      return response ? response.color : '#B3B3B3'
    },
    getOptionText (optionValue) {
      const response = this.responses.find(r => r.value === optionValue)
      return response ? response.text : optionValue
    },
    getCircleTooltip (stage, optionIndex, item) {
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
    getStageTitle (stage) {
      const stages = [
        'fit_meta_design',
        'fit_meta_conduct',
        'fit_design_conduct',
        'overall'
      ]
      return this.$t(`camelot.step_four.tabs.${stages[stage]}`)
    },
    getAssessmentLabel (stage, index) {
      if (stage === 3) return this.$t('camelot.step_four.camelot_assessment_summary_table.overall')
      const keys = [
        [
          'camelot.step_four.camelot_assessment_summary_table.meta_domain_1',
          'camelot.step_four.camelot_assessment_summary_table.meta_domain_2',
          'camelot.step_four.camelot_assessment_summary_table.meta_domain_3',
          'camelot.step_four.camelot_assessment_summary_table.meta_domain_4'
        ],
        [
          'camelot.step_four.camelot_assessment_summary_table.meta_domain_5',
          'camelot.step_four.camelot_assessment_summary_table.meta_domain_6',
          'camelot.step_four.camelot_assessment_summary_table.meta_domain_7',
          'camelot.step_four.camelot_assessment_summary_table.meta_domain_8'
        ],
        [
          'camelot.step_four.camelot_assessment_summary_table.meta_domain_9'
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

    th,
    td {
      border: 1px solid #AAADB0 !important;
    }
  }

  .camelot-table {
    font-size: 0.9rem;

    ::v-deep th,
    ::v-deep td {
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
      width: 50%;
    }

    ::v-deep td:nth-child(2) {
      width: 5%;
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

  .clickable-header {
    cursor: pointer;
    padding: 0 !important;
    transition: background-color 0.2s;

    &:hover {
      background-color: #A3D1FF !important;
      color: #000 !important;
    }
  }

  .cursor-pointer {
    cursor: pointer;
    min-height: 40px;
  }
}
</style>
