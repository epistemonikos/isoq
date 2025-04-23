<template>
  <div>
    <pre>{{ selectedMeta }}</pre>
    <div>
      <h3>Fit assessment</h3>
    </div>

    <p v-html="options[modalStage][selectedMeta].text"></p>

    <b-form-group label="" v-slot="{ ariaDescribedby }">
      <b-form-radio
        v-for="(value, index) in options[modalStage][selectedMeta].values"
        v-model="selected"
        :key="index"
        :value="value.value">
        {{ value.text }}
      </b-form-radio>
    </b-form-group>

    <b-form-group
      label="Explain any concerns you have in your own words"
      label-for="textarea-formatter">
      <b-form-textarea
        id="textarea-formatter"
        v-model="text1"
        placeholder="Enter your text"></b-form-textarea>
    </b-form-group>
  </div>
</template>

<script>
export default {
  name: 'AssessmentForm',
  data () {
    return {
      selected: null,
      text1: '',
      options: [
        [
          {
            text: 'Meta domain <b>Research</b> against <b>Research design domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A' },
              { text: 'Minor concerns', value: 'B' },
              { text: 'Moderate concerns', value: 'C' },
              { text: 'Serious concerns', value: 'D' },
              { text: 'Unclear', value: 'E' }
            ]
          },
          {
            text: 'Meta domain <b>Stakeholders</b> against <b>Research design domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A' },
              { text: 'Minor concerns', value: 'B' },
              { text: 'Moderate concerns', value: 'C' },
              { text: 'Serious concerns', value: 'D' },
              { text: 'Unclear', value: 'E' }
            ]
          },
          {
            text: 'Meta domain <b>Researchers</b> against <b>Research design domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A' },
              { text: 'Minor concerns', value: 'B' },
              { text: 'Moderate concerns', value: 'C' },
              { text: 'Serious concerns', value: 'D' },
              { text: 'Unclear', value: 'E' }
            ]
          },
          {
            text: 'Meta domain <b>Context</b> against <b>Research design domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A' },
              { text: 'Minor concerns', value: 'B' },
              { text: 'Moderate concerns', value: 'C' },
              { text: 'Serious concerns', value: 'D' },
              { text: 'Unclear', value: 'E' }
            ]
          }
        ],
        [
          {
            text: 'Meta domain <b>Research</b> against <b>Research conduct domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A' },
              { text: 'Minor concerns', value: 'B' },
              { text: 'Moderate concerns', value: 'C' },
              { text: 'Serious concerns', value: 'D' },
              { text: 'Unclear', value: 'E' }
            ]
          },
          {
            text: 'Meta domain <b>Stakeholders</b> against <b>Research conduct domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A' },
              { text: 'Minor concerns', value: 'B' },
              { text: 'Moderate concerns', value: 'C' },
              { text: 'Serious concerns', value: 'D' },
              { text: 'Unclear', value: 'E' }
            ]
          },
          {
            text: 'Meta domain <b>Researchers</b> against <b>Research conduct domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A' },
              { text: 'Minor concerns', value: 'B' },
              { text: 'Moderate concerns', value: 'C' },
              { text: 'Serious concerns', value: 'D' },
              { text: 'Unclear', value: 'E' }
            ]
          },
          {
            text: 'Meta domain <b>Context</b> against <b>Research conduct domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A' },
              { text: 'Minor concerns', value: 'B' },
              { text: 'Moderate concerns', value: 'C' },
              { text: 'Serious concerns', value: 'D' },
              { text: 'Unclear', value: 'E' }
            ]
          }
        ],
        [
          {
            text: '<b>Research design domains</b> against <b>Research conduct domains</b>',
            values: [
              { text: 'No or minimal concerns', value: 'A' },
              { text: 'Minor concerns', value: 'B' },
              { text: 'Moderate concerns', value: 'C' },
              { text: 'Serious concerns', value: 'D' },
              { text: 'Unclear', value: 'E' }
            ]
          }
        ],
        [
          {
            text: 'Overall assessment',
            values: [
              { text: 'No or minimal concerns', value: 'A' },
              { text: 'Minor concerns', value: 'B' },
              { text: 'Moderate concerns', value: 'C' },
              { text: 'Serious concerns', value: 'D' },
              { text: 'Unclear', value: 'E' }
            ]
          }
        ]
      ]
    }
  },
  props: {
    selectedMeta: {
      type: Number,
      default: 0
    },
    modalStage: {
      type: Number,
      default: 0
    }
  }
}
</script>
