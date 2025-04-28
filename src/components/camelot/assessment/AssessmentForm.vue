<template>
  <div>
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

    <div>
      <!-- <b-button>cancel</b-button> -->
      <b-button
        :disabled="button.disabled"
        :variant="(button.disabled) ? 'outline-primary' : 'primary'"
        @click="save">
        save
      </b-button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AssessmentForm',
  data () {
    return {
      categories: [
        'Fit between Meta domains and Research design',
        'Fit between Meta domains and Research conduct',
        'Fit between Research design and Research conduct',
        'Overall assessment'
      ],
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
      ],
      button: {
        disabled: true
      }
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
    },
    assessments: {
      type: Object,
      default: () => ({})
    },
    refId: {
      type: String,
      default: ''
    },
    modalIndex: {
      type: Number,
      default: 0
    }
  },
  watch: {
    modalStage (newValue) {
      if (this.assessments.items.length) {
        this.selected = this.assessments.items[this.modalIndex].stages[newValue].options[this.selectedMeta].option
        this.text1 = this.assessments.items[this.modalIndex].stages[newValue].options[this.selectedMeta].text
      }
    },
    selectedMeta (newValue) {
      if (this.assessments.items) {
        this.selected = this.assessments.items[this.modalIndex].stages[this.modalStage].options[newValue].option
        this.text1 = this.assessments.items[this.modalIndex].stages[this.modalStage].options[newValue].text
      }
    },
    assessments: {
      handler (newValue) {
        if (newValue.items.length) {
          this.selected = newValue.items[this.modalIndex].stages[this.modalStage].options[this.selectedMeta].option
          this.text1 = newValue.items[this.modalIndex].stages[this.modalStage].options[this.selectedMeta].text
        }
      },
      deep: true
    },
    selected (newValue) {
      if (this.assessments.items[this.modalIndex].stages[this.modalStage].options[this.selectedMeta].option === newValue) {
        this.button.disabled = true
      } else {
        this.button.disabled = false
      }
    },
    text1 (newValue) {
      if (this.assessments.items[this.modalIndex].stages[this.modalStage].options[this.selectedMeta].text === newValue) {
        this.button.disabled = true
      } else {
        this.button.disabled = false
      }
    }
  },
  mounted: function () {
    if (this.assessments.items.length) {
      this.selected = this.assessments.items[this.modalIndex].stages[this.modalStage].options[this.selectedMeta].option
      this.text1 = this.assessments.items[this.modalIndex].stages[this.modalStage].options[this.selectedMeta].text
    }
  },
  methods: {
    save () {
      const stages = [
        {
          key: 0,
          options: [
            {
              option: null,
              text: ''
            },
            {
              option: null,
              text: ''
            },
            {
              option: null,
              text: ''
            },
            {
              option: null,
              text: ''
            }
          ]
        },
        {
          key: 1,
          options: [
            {
              option: null,
              text: ''
            },
            {
              option: null,
              text: ''
            },
            {
              option: null,
              text: ''
            },
            {
              option: null,
              text: ''
            }
          ]
        },
        {
          key: 2,
          options: [
            {
              option: null,
              text: ''
            }
          ]
        },
        {
          key: 3,
          options: [
            {
              option: null,
              text: ''
            }
          ]
        }
      ]
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id,
        items: this.assessments.items || []
      }
      if (this.refId) {
        const data = {
          ref_id: this.refId,
          stages: (this.assessments.items.length) ? this.assessments.items[this.modalIndex].stages : stages || stages
        }
        if (params.items.find((el) => el.ref_id === this.refId)) {
          params.items.forEach((item) => {
            if (item.ref_id === this.refId) {
              item.stages[this.modalStage].options[this.selectedMeta].option = this.selected
              item.stages[this.modalStage].options[this.selectedMeta].text = this.text1
            }
          })
        } else {
          params.items.push(data)
        }
        if (this.assessments.id) {
          axios.patch(`/api/isoqf_assessments/${this.assessments.id}`, params)
            .then(response => {
              console.log('Data updated successfully:', response.data)
              this.$emit('getAssessments')
            })
            .catch(error => {
              console.error('Error updating data:', error)
            })
        } else {
          axios.post('/api/isoqf_assessments', params)
            .then(response => {
              this.$emit('getAssessments')
              console.log('Data saved successfully:', response.data)
            })
            .catch(error => {
              console.error('Error saving data:', error)
            })
        }
      } else {
        console.log('no ref id')
      }
    }
  }
}
</script>
