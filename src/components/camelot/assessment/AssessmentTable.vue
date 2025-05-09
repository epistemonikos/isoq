<template>
    <div>
        <b-table
            :items="tableItems"
            :fields="fields"
            responsive
            bordered
            head-variant="light"
        >
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
            <template v-slot:cell(firstStage)="data">
                <div v-if="data.item.firstStage">
                    <div v-for="(option, index) in data.item.firstStage.options" :key="index" class="d-flex align-items-start">
                        <div
                            v-if="option.option"
                            class="option-circle mr-2"
                            :style="{ backgroundColor: getOptionColor(option.option) }"
                        />
                        <div>
                            <p><strong>{{ getOptionText(option.option) }}</strong></p>
                            <p>{{ option.text }}</p>
                        </div>
                    </div>
                </div>
                <span v-else>&nbsp;</span>
            </template>
            <template v-slot:cell(secondStage)="data">
                <div v-if="data.item.secondStage">
                    <div v-for="(option, index) in data.item.secondStage.options" :key="index" class="d-flex align-items-start">
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
    }
  },
  data () {
    return {
      fields: [
        { key: 'authors', label: 'Authors' },
        { key: 'lastStage', label: 'Research question & aim domain' },
        { key: 'firstStage', label: 'Stakeholders domain' },
        { key: 'secondStage', label: 'Researchers domain' },
        { key: 'thirdStage', label: 'Overall assessment' }
      ]
    }
  },
  methods: {
    getOptionText (option) {
      const optionsMap = {
        'A': 'No or minimal concern',
        'B': 'Minor concerns',
        'C': 'Moderate concerns',
        'D': 'Serious concerns',
        'E': 'Unclear'
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

      return this.assessments.items.map(item => {
        const stages = item.stages || []
        const lastStage = stages.length > 0 ? stages[stages.length - 1] : null
        const firstStage = stages.length > 0 ? stages[0] : null
        const secondStage = stages.length > 1 ? stages[1] : null
        const thirdStage = stages.length > 2 ? stages[2] : null

        return {
          authors: item.authors,
          lastStage,
          firstStage,
          secondStage,
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
</style>
