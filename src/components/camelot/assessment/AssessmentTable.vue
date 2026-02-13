<template>
    <div>
        <b-table
            :items="tableItems"
            :fields="fields"
            responsive
            bordered
            head-variant="light"
            class="assessment-table"
        >
            <template #thead-top>
              <b-tr>
                <b-th>&nbsp;</b-th>
                <b-th>&nbsp;</b-th>
                <b-th colspan="4" class="text-center first-stage-header">{{ $t('camelot.assessment_table.headers.research_design') }}</b-th>
                <b-th colspan="4" class="text-center second-stage-header">{{ $t('camelot.assessment_table.headers.research_conduct') }}</b-th>
                <b-th>&nbsp;</b-th>
              </b-tr>
            </template>
            <!-- Encabezados de grupo para las columnas anidadas -->
            <template #thead>
                <tr>
                    <th v-for="field in fields" :key="field.key">{{ field.label }}</th>
                </tr>
            </template>
            <template v-slot:cell(authors)="data">
                {{ data.item.authors }}
            </template>
            <template v-slot:cell(lastStage)="data">
                <div v-if="data.item.lastStage">
                    <div v-for="(option, index) in data.item.lastStage.options" :key="index" class="d-flex align-items-start">
                        <div
                            v-if="option.option"
                            class="option-circle mr-2"
                            :style="{ backgroundColor: getOptionColor(option.option) }"
                        />
                        <p><strong>{{ getOptionText(option.option) }}</strong></p>
                        <p>{{ option.text }}</p>
                    </div>
                </div>
                <span v-else>&nbsp;</span>
            </template>

            <!-- Plantillas para las columnas de Research design (firstStage) -->
            <template v-slot:cell(firstStage0)="data">
                <div v-if="data.item.firstStage0 && data.item.firstStage0.option" class="d-flex align-items-start">
                    <div
                        class="option-circle mr-2"
                        :style="{ backgroundColor: getOptionColor(data.item.firstStage0.option) }"
                    />
                    <div>
                        <p><strong>{{ getOptionText(data.item.firstStage0.option) }}</strong></p>
                        <p>{{ data.item.firstStage0.text }}</p>
                    </div>
                </div>
                <span v-else>&nbsp;</span>
            </template>
            <template v-slot:cell(firstStage1)="data">
                <div v-if="data.item.firstStage1 && data.item.firstStage1.option" class="d-flex align-items-start">
                    <div
                        class="option-circle mr-2"
                        :style="{ backgroundColor: getOptionColor(data.item.firstStage1.option) }"
                    />
                    <div>
                        <p><strong>{{ getOptionText(data.item.firstStage1.option) }}</strong></p>
                        <p>{{ data.item.firstStage1.text }}</p>
                    </div>
                </div>
                <span v-else>&nbsp;</span>
            </template>
            <template v-slot:cell(firstStage2)="data">
                <div v-if="data.item.firstStage2 && data.item.firstStage2.option" class="d-flex align-items-start">
                    <div
                        class="option-circle mr-2"
                        :style="{ backgroundColor: getOptionColor(data.item.firstStage2.option) }"
                    />
                    <div>
                        <p><strong>{{ getOptionText(data.item.firstStage2.option) }}</strong></p>
                        <p>{{ data.item.firstStage2.text }}</p>
                    </div>
                </div>
                <span v-else>&nbsp;</span>
            </template>
            <template v-slot:cell(firstStage3)="data">
                <div v-if="data.item.firstStage3 && data.item.firstStage3.option" class="d-flex align-items-start">
                    <div
                        class="option-circle mr-2"
                        :style="{ backgroundColor: getOptionColor(data.item.firstStage3.option) }"
                    />
                    <div>
                        <p><strong>{{ getOptionText(data.item.firstStage3.option) }}</strong></p>
                        <p>{{ data.item.firstStage3.text }}</p>
                    </div>
                </div>
                <span v-else>&nbsp;</span>
            </template>

            <!-- Plantillas para las columnas de Research conduct (secondStage) -->
            <template v-slot:cell(secondStage0)="data">
                <div v-if="data.item.secondStage0 && data.item.secondStage0.option" class="d-flex align-items-start">
                    <div
                        class="option-circle mr-2"
                        :style="{ backgroundColor: getOptionColor(data.item.secondStage0.option) }"
                    />
                    <div>
                        <p><strong>{{ getOptionText(data.item.secondStage0.option) }}</strong></p>
                        <p>{{ data.item.secondStage0.text }}</p>
                    </div>
                </div>
                <span v-else>&nbsp;</span>
            </template>
            <template v-slot:cell(secondStage1)="data">
                <div v-if="data.item.secondStage1 && data.item.secondStage1.option" class="d-flex align-items-start">
                    <div
                        class="option-circle mr-2"
                        :style="{ backgroundColor: getOptionColor(data.item.secondStage1.option) }"
                    />
                    <div>
                        <p><strong>{{ getOptionText(data.item.secondStage1.option) }}</strong></p>
                        <p>{{ data.item.secondStage1.text }}</p>
                    </div>
                </div>
                <span v-else>&nbsp;</span>
            </template>
            <template v-slot:cell(secondStage2)="data">
                <div v-if="data.item.secondStage2 && data.item.secondStage2.option" class="d-flex align-items-start">
                    <div
                        class="option-circle mr-2"
                        :style="{ backgroundColor: getOptionColor(data.item.secondStage2.option) }"
                    />
                    <div>
                        <p><strong>{{ getOptionText(data.item.secondStage2.option) }}</strong></p>
                        <p>{{ data.item.secondStage2.text }}</p>
                    </div>
                </div>
                <span v-else>&nbsp;</span>
            </template>
            <template v-slot:cell(secondStage3)="data">
                <div v-if="data.item.secondStage3 && data.item.secondStage3.option" class="d-flex align-items-start">
                    <div
                        class="option-circle mr-2"
                        :style="{ backgroundColor: getOptionColor(data.item.secondStage3.option) }"
                    />
                    <div>
                        <p><strong>{{ getOptionText(data.item.secondStage3.option) }}</strong></p>
                        <p>{{ data.item.secondStage3.text }}</p>
                    </div>
                </div>
                <span v-else>&nbsp;</span>
            </template>

            <template v-slot:cell(thirdStage)="data">
                <div v-if="data.item.thirdStage">
                    <div v-for="(option, index) in data.item.thirdStage.options" :key="index" class="d-flex align-items-start">
                        <div
                            v-if="option.option"
                            class="option-circle mr-2"
                            :style="{ backgroundColor: getOptionColor(option.option) }"
                        />
                        <p><strong>{{ getOptionText(option.option) }}</strong></p>
                        <p>{{ option.text }}</p>
                    </div>
                </div>
                <span v-else>&nbsp;</span>
            </template>
        </b-table>
    </div>
</template>

<script>
export default {
  name: 'AssessmentTable',
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
  data () {
    return {
      fields: [
        { key: 'authors', label: this.$t('camelot.assessment_table.headers.authors') },
        { key: 'lastStage', label: this.$t('camelot.assessment_table.headers.overall_assessment') },
        // Research design (firstStage) columns
        { key: 'firstStage0', label: this.$t('camelot.assessment_table.headers.research'), thClass: 'first-stage-col' },
        { key: 'firstStage1', label: this.$t('camelot.assessment_table.headers.stakeholders'), thClass: 'first-stage-col' },
        { key: 'firstStage2', label: this.$t('camelot.assessment_table.headers.researchers'), thClass: 'first-stage-col' },
        { key: 'firstStage3', label: this.$t('camelot.assessment_table.headers.context'), thClass: 'first-stage-col' },
        // Research conduct (secondStage) columns
        { key: 'secondStage0', label: this.$t('camelot.assessment_table.headers.research'), thClass: 'second-stage-col' },
        { key: 'secondStage1', label: this.$t('camelot.assessment_table.headers.stakeholders'), thClass: 'second-stage-col' },
        { key: 'secondStage2', label: this.$t('camelot.assessment_table.headers.researchers'), thClass: 'second-stage-col' },
        { key: 'secondStage3', label: this.$t('camelot.assessment_table.headers.context'), thClass: 'second-stage-col' },
        { key: 'thirdStage', label: this.$t('camelot.assessment_table.headers.researchers_domain') }
      ]
    }
  },
  methods: {
    getOptionText (option) {
      const optionsMap = {
        'A': this.$t('camelot.assessment_table.options.no_minimal'),
        'B': this.$t('camelot.assessment_table.options.minor'),
        'C': this.$t('camelot.assessment_table.options.moderate'),
        'D': this.$t('camelot.assessment_table.options.serious'),
        'E': this.$t('camelot.assessment_table.options.unclear')
      }
      return optionsMap[option] || option
    },
    getOptionColor (option) {
      const colorMap = {
        'A': '#1065AB',
        'B': '#8EC4DE',
        'C': '#F6A482',
        'D': '#B31529',
        'E': '#B3B3B3'
      }
      return colorMap[option] || '#B3B3B3'
    }
  },
  computed: {
    tableItems () {
      if (!this.assessments || !this.assessments.items) return []

      let filteredItems = this.assessments.items
      if (this.references && this.references.length > 0) {
        filteredItems = filteredItems.filter(item => {
          for (let i = 0; i < this.references.length; i++) {
            const ref = this.references[i]
            const refId = typeof ref === 'object' ? (ref.id || ref.ref_id) : ref
            if (String(refId) === String(item.ref_id)) {
              return true
            }
          }
          return false
        })
      }

      return filteredItems.map(item => {
        const stages = item.stages || []
        const lastStage = stages.length > 0 ? stages[stages.length - 1] : null
        const firstStage = stages.length > 0 ? stages[0] : null
        const secondStage = stages.length > 1 ? stages[1] : null
        const thirdStage = stages.length > 2 ? stages[2] : null

        // Preparar las opciones de Research design (firstStage) como columnas separadas
        const firstStageOptions = firstStage && firstStage.options ? firstStage.options : []
        // Preparar las opciones de Research conduct (secondStage) como columnas separadas
        const secondStageOptions = secondStage && secondStage.options ? secondStage.options : []

        return {
          authors: item.authors,
          lastStage,
          // Columnas individuales para firstStage
          firstStage0: firstStageOptions[0] || null,
          firstStage1: firstStageOptions[1] || null,
          firstStage2: firstStageOptions[2] || null,
          firstStage3: firstStageOptions[3] || null,
          // Columnas individuales para secondStage
          secondStage0: secondStageOptions[0] || null,
          secondStage1: secondStageOptions[1] || null,
          secondStage2: secondStageOptions[2] || null,
          secondStage3: secondStageOptions[3] || null,
          thirdStage
        }
      })
    }
  }
}
</script>

<style scoped>
.table {
    margin-top: 1rem;
}

.option-circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    flex-shrink: 0;
}

.first-stage-header,
.first-stage-col {
    background-color: rgba(16, 101, 171, 0.1);
}

.second-stage-header,
.second-stage-col {
    background-color: rgba(142, 196, 222, 0.1);
}

/* Estilos para las celdas que contienen opciones */
.assessment-table td {
    min-width: 120px;
    vertical-align: top;
}

/* Estilos responsivos */
@media (max-width: 992px) {
    .assessment-table {
        font-size: 0.9rem;
    }
    .assessment-table td {
        min-width: 100px;
    }
}
</style>
