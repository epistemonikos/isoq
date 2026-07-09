<template>
  <div>
    <b-alert show variant="info" v-if="isLoading">
      {{ $t('camelot.step_four.loading') }}
    </b-alert>
    <b-alert show variant="info"
      v-else-if="references.length === 0 && (!methodologicalTableRefs.items || methodologicalTableRefs.items.length === 0)">
      {{ $t('camelot.step_four.no_records') }}
    </b-alert>
    <div v-else>
      <b-table :fields="fields" :items="tableItems" bordered responsive class="camelot-table" thead-tr-class="header-second-row">
        <template v-slot:thead-top>
          <tr class="header-top-row">
            <th class="border-bottom-0">
              {{ $t('camelot.step_four.table_headers.authors') }}
            </th>
            <th colspan="5" class="text-center group-header border-left">
              {{ $t('camelot.step_four.tabs.fit_meta_design') }}
            </th>
            <th colspan="5" class="text-center group-header border-left">
              {{ $t('camelot.step_four.tabs.fit_meta_conduct') }}
            </th>
            <th colspan="2" class="text-center group-header border-left">
              {{ $t('camelot.step_four.tabs.fit_design_conduct') }}
            </th>
            <th colspan="2" class="text-center group-header border-left header-overall-group">
              {{ $t('camelot.step_four.tabs.overall') }}
            </th>
          </tr>
        </template>

        <template v-slot:cell(authors)="data">
          <span class="font-weight-bold" style="white-space: nowrap">{{ data.item.authors }}</span>
        </template>

        <!-- FA 1-4 -->
        <template v-slot:cell(fa1)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(0, 0, data.item)]"
              :style="getCircleStyle(0, 0, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(fa2)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(0, 1, data.item)]"
              :style="getCircleStyle(0, 1, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(fa3)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(0, 2, data.item)]"
              :style="getCircleStyle(0, 2, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(fa4)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(0, 3, data.item)]"
              :style="getCircleStyle(0, 3, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(edit1)="data">
          <div class="d-flex justify-content-center align-items-center">
            <font-awesome-icon v-if="isGroupComplete(0, 4, data.item)" icon="check" class="text-success" />
          </div>
        </template>

        <!-- FA 5-8 -->
        <template v-slot:cell(fa5)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(1, 0, data.item)]"
              :style="getCircleStyle(1, 0, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(fa6)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(1, 1, data.item)]"
              :style="getCircleStyle(1, 1, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(fa7)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(1, 2, data.item)]"
              :style="getCircleStyle(1, 2, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(fa8)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(1, 3, data.item)]"
              :style="getCircleStyle(1, 3, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(edit2)="data">
          <div class="d-flex justify-content-center align-items-center">
            <font-awesome-icon v-if="isGroupComplete(1, 4, data.item)" icon="check" class="text-success" />
          </div>
        </template>

        <!-- FA 9 -->
        <template v-slot:cell(fa9)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(2, 0, data.item)]"
              :style="getCircleStyle(2, 0, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(edit3)="data">
          <div class="d-flex justify-content-center align-items-center">
            <font-awesome-icon v-if="isGroupComplete(2, 1, data.item)" icon="check" class="text-success" />
          </div>
        </template>

        <!-- OA -->
        <template v-slot:cell(oa)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(3, 0, data.item)]"
              :style="getCircleStyle(3, 0, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(edit4)="data">
          <div class="d-flex justify-content-center align-items-center">
            <font-awesome-icon v-if="isGroupComplete(3, 1, data.item)" icon="check" class="text-success" />
          </div>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import camelotCircleMixin from '@/mixins/camelotCircleMixin'
import Commons from '@/utils/commons'

export default {
  name: 'CamelotAssessmentsTablePreview',
  mixins: [camelotCircleMixin],
  props: {
    methodologicalTableRefs: {
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
      isLoading: false,
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
      assessments: {
        items: []
      }
    }
  },
  computed: {
    tableItems() {
      if (!this.assessments.items || !this.references) return []
      return this.assessments.items.map(item => {
        const ref = this.references.find(r => String(r.id) === String(item.ref_id))
        if (ref) {
          return {
            ...ref,
            ...item,
            authors: Commons.parseReference(ref, true, false)
          }
        }
        return item
      })
    }
  },
  watch: {
    methodologicalTableRefs: {
      handler(newVal) {
        if (newVal && newVal.items && this.references && this.references.length) {
          this.assessments = JSON.parse(JSON.stringify(newVal))
          // Sincronizar referencias: agregar items para referencias que no están en los assessments
          this.references.forEach(ref => {
            const exists = this.assessments.items.find(item => String(item.ref_id) === String(ref.id))
            if (!exists) {
              this.assessments.items.push({
                ref_id: ref.id,
                authors: Commons.parseReference(ref, true, false),
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
              })
            }
          })
        }
      },
      immediate: false,
      deep: true
    }
  },
  methods: {
    isGroupComplete(stage, optionCount, item) {
      if (!item || !item.stages || !item.stages[stage]) return false
      const options = item.stages[stage].options
      if (!options) return false
      for (let i = 0; i < optionCount; i++) {
        if (!options[i] || options[i].option === null) return false
      }
      return true
    }
  }
}
</script>

<style scoped>
.table th {
  vertical-align: middle;
  background-color: #f8f9fa;
}

.table {
  margin-bottom: 0;
}

.group-header {
  border-color: #dee2e6 !important;
}

.header-overall-group {
  border-color: #dee2e6 !important;
}

.header-top-row {
  background-color: #e9ecef;
}

.header-second-row {
  background-color: #f8f9fa;
}

.header-overall-row {
  background-color: #f8f9fa;
}

.border-left {
  border-left: 1px solid #dee2e6 !important;
}

.border-right {
  border-right: 2px solid #dee2e6 !important;
}

.assessment-col {
  text-align: center;
  padding: 0.5rem 0.25rem;
}
</style>
