<template>
  <div>
    <div v-if="hasSelection()" class="d-flex flex-row justify-content-start">
      <div class="circle rounded-circle" :style="`background-color: ${getColor()};`"></div>
      <div class="ml-2">
        <strong>{{ getText() }}</strong>
      </div>
    </div>
    <p>{{ text }}</p>
  </div>
</template>

<script>
export default {
  name: 'Responses',
  props: {
    stage: {
      type: Number,
      default: 0
    },
    index: {
      type: Number,
      default: 0
    },
    option: {
      type: String,
      default: ''
    },
    text: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      // Define any local state here if needed
      options: [
        [
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_research_vs_design'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A', color: '#1065AB' },
              { text: this.$t('camelot.responses.minor'), value: 'B', color: '#8EC4DE' },
              { text: this.$t('camelot.responses.moderate'), value: 'C', color: '#F6A482' },
              { text: this.$t('camelot.responses.serious'), value: 'D', color: '#B31529' },
              { text: this.$t('camelot.responses.unclear'), value: 'E', color: '#B3B3B3' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_stakeholders_vs_design'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A', color: '#1065AB' },
              { text: this.$t('camelot.responses.minor'), value: 'B', color: '#8EC4DE' },
              { text: this.$t('camelot.responses.moderate'), value: 'C', color: '#F6A482' },
              { text: this.$t('camelot.responses.serious'), value: 'D', color: '#B31529' },
              { text: this.$t('camelot.responses.unclear'), value: 'E', color: '#B3B3B3' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_researchers_vs_design'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A', color: '#1065AB' },
              { text: this.$t('camelot.responses.minor'), value: 'B', color: '#8EC4DE' },
              { text: this.$t('camelot.responses.moderate'), value: 'C', color: '#F6A482' },
              { text: this.$t('camelot.responses.serious'), value: 'D', color: '#B31529' },
              { text: this.$t('camelot.responses.unclear'), value: 'E', color: '#B3B3B3' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_context_vs_design'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A', color: '#1065AB' },
              { text: this.$t('camelot.responses.minor'), value: 'B', color: '#8EC4DE' },
              { text: this.$t('camelot.responses.moderate'), value: 'C', color: '#F6A482' },
              { text: this.$t('camelot.responses.serious'), value: 'D', color: '#B31529' },
              { text: this.$t('camelot.responses.unclear'), value: 'E', color: '#B3B3B3' }
            ]
          }
        ],
        [
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_research_vs_conduct'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A', color: '#1065AB' },
              { text: this.$t('camelot.responses.minor'), value: 'B', color: '#8EC4DE' },
              { text: this.$t('camelot.responses.moderate'), value: 'C', color: '#F6A482' },
              { text: this.$t('camelot.responses.serious'), value: 'D', color: '#B31529' },
              { text: this.$t('camelot.responses.unclear'), value: 'E', color: '#B3B3B3' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_stakeholders_vs_conduct'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A', color: '#1065AB' },
              { text: this.$t('camelot.responses.minor'), value: 'B', color: '#8EC4DE' },
              { text: this.$t('camelot.responses.moderate'), value: 'C', color: '#F6A482' },
              { text: this.$t('camelot.responses.serious'), value: 'D', color: '#B31529' },
              { text: this.$t('camelot.responses.unclear'), value: 'E', color: '#B3B3B3' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_researchers_vs_conduct'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A', color: '#1065AB' },
              { text: this.$t('camelot.responses.minor'), value: 'B', color: '#8EC4DE' },
              { text: this.$t('camelot.responses.moderate'), value: 'C', color: '#F6A482' },
              { text: this.$t('camelot.responses.serious'), value: 'D', color: '#B31529' },
              { text: this.$t('camelot.responses.unclear'), value: 'E', color: '#B3B3B3' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_context_vs_conduct'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A', color: '#1065AB' },
              { text: this.$t('camelot.responses.minor'), value: 'B', color: '#8EC4DE' },
              { text: this.$t('camelot.responses.moderate'), value: 'C', color: '#F6A482' },
              { text: this.$t('camelot.responses.serious'), value: 'D', color: '#B31529' },
              { text: this.$t('camelot.responses.unclear'), value: 'E', color: '#B3B3B3' }
            ]
          }
        ],
        [
          {
            text: this.$t('camelot.assessment_form.descriptions.design_vs_conduct'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A', color: '#1065AB' },
              { text: this.$t('camelot.responses.minor'), value: 'B', color: '#8EC4DE' },
              { text: this.$t('camelot.responses.moderate'), value: 'C', color: '#F6A482' },
              { text: this.$t('camelot.responses.serious'), value: 'D', color: '#B31529' },
              { text: this.$t('camelot.responses.unclear'), value: 'E', color: '#B3B3B3' }
            ]
          }
        ]
      ]
    }
  },
  methods: {
    hasSelection: function () {
      if (!this.option) return false
      const option = this.options[this.stage][this.index].values.find(item => item.value === this.option)
      return !!option
    },
    getColor: function () {
      const option = this.options[this.stage][this.index].values.find(item => item.value === this.option)
      return option ? option.color : ''
    },
    getText: function () {
      const option = this.options[this.stage][this.index].values.find(item => item.value === this.option)
      return option ? option.text : ''
    }
  }
}
</script>

<style scoped lang="scss">
.circle {
  width: 20px;
  height: 20px;
}
</style>
