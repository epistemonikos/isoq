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
            text: 'Meta domain <b>Research</b> against <b>Research design domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A', color: '#1065AB' },
              { text: 'Minor concerns', value: 'B', color: '#8EC4DE' },
              { text: 'Moderate concerns', value: 'C', color: '#F6A482' },
              { text: 'Serious concerns', value: 'D', color: '#B31529' },
              { text: 'Unclear', value: 'E', color: '#B3B3B3' }
            ]
          },
          {
            text: 'Meta domain <b>Stakeholders</b> against <b>Research design domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A', color: '#1065AB' },
              { text: 'Minor concerns', value: 'B', color: '#8EC4DE' },
              { text: 'Moderate concerns', value: 'C', color: '#F6A482' },
              { text: 'Serious concerns', value: 'D', color: '#B31529' },
              { text: 'Unclear', value: 'E', color: '#B3B3B3' }
            ]
          },
          {
            text: 'Meta domain <b>Researchers</b> against <b>Research design domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A', color: '#1065AB' },
              { text: 'Minor concerns', value: 'B', color: '#8EC4DE' },
              { text: 'Moderate concerns', value: 'C', color: '#F6A482' },
              { text: 'Serious concerns', value: 'D', color: '#B31529' },
              { text: 'Unclear', value: 'E', color: '#B3B3B3' }
            ]
          },
          {
            text: 'Meta domain <b>Context</b> against <b>Research design domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A', color: '#1065AB' },
              { text: 'Minor concerns', value: 'B', color: '#8EC4DE' },
              { text: 'Moderate concerns', value: 'C', color: '#F6A482' },
              { text: 'Serious concerns', value: 'D', color: '#B31529' },
              { text: 'Unclear', value: 'E', color: '#B3B3B3' }
            ]
          }
        ],
        [
          {
            text: 'Meta domain <b>Research</b> against <b>Research conduct domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A', color: '#1065AB' },
              { text: 'Minor concerns', value: 'B', color: '#8EC4DE' },
              { text: 'Moderate concerns', value: 'C', color: '#F6A482' },
              { text: 'Serious concerns', value: 'D', color: '#B31529' },
              { text: 'Unclear', value: 'E', color: '#B3B3B3' }
            ]
          },
          {
            text: 'Meta domain <b>Stakeholders</b> against <b>Research conduct domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A', color: '#1065AB' },
              { text: 'Minor concerns', value: 'B', color: '#8EC4DE' },
              { text: 'Moderate concerns', value: 'C', color: '#F6A482' },
              { text: 'Serious concerns', value: 'D', color: '#B31529' },
              { text: 'Unclear', value: 'E', color: '#B3B3B3' }
            ]
          },
          {
            text: 'Meta domain <b>Researchers</b> against <b>Research conduct domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A', color: '#1065AB' },
              { text: 'Minor concerns', value: 'B', color: '#8EC4DE' },
              { text: 'Moderate concerns', value: 'C', color: '#F6A482' },
              { text: 'Serious concerns', value: 'D', color: '#B31529' },
              { text: 'Unclear', value: 'E', color: '#B3B3B3' }
            ]
          },
          {
            text: 'Meta domain <b>Context</b> against <b>Research conduct domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A', color: '#1065AB' },
              { text: 'Minor concerns', value: 'B', color: '#8EC4DE' },
              { text: 'Moderate concerns', value: 'C', color: '#F6A482' },
              { text: 'Serious concerns', value: 'D', color: '#B31529' },
              { text: 'Unclear', value: 'E', color: '#B3B3B3' }
            ]
          }
        ],
        [
          {
            text: '<b>Research design domains</b> against <b>Research conduct domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A', color: '#1065AB' },
              { text: 'Minor concerns', value: 'B', color: '#8EC4DE' },
              { text: 'Moderate concerns', value: 'C', color: '#F6A482' },
              { text: 'Serious concerns', value: 'D', color: '#B31529' },
              { text: 'Unclear', value: 'E', color: '#B3B3B3' }
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
