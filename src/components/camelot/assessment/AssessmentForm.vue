<template>
  <div>
    <div>
      <h3>{{ $t('camelot.assessment_form.title') }}</h3>
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
      :label="$t('camelot.assessment_form.explain_label')"
      label-for="textarea-formatter">
      <b-form-textarea
        id="textarea-formatter"
        v-model="text1"
        :placeholder="$t('camelot.assessment_form.text_placeholder')"></b-form-textarea>
    </b-form-group>

    <div class="mt-4">
      <h3 class="notes-title">{{ $t('common.notes') }}</h3>
      <b-form-group label="" label-for="textarea-notes">
        <b-form-textarea
          id="textarea-notes"
          v-model="notes"
          rows="3"
          :placeholder="$t('camelot.assessment_form.text_placeholder')"></b-form-textarea>
        <p class="small text-muted mt-1 italic">{{ $t('worksheet.labels.notes_description') }}</p>
      </b-form-group>
    </div>

    <div class="d-flex justify-content-end gap-2 mt-3">
      <b-button
        variant="outline-secondary"
        class="mr-2"
        @click="cancel">
        {{ $t('common.cancel') }}
      </b-button>
      <b-button
        :disabled="button.disabled"
        :variant="(button.disabled) ? 'outline-primary' : 'primary'"
        @click="save">
        <b-spinner small v-if="!button.disabled && isSaving"></b-spinner>
        {{ $t('camelot.assessment_form.save_button') }}
      </b-button>
    </div>
  </div>
</template>

<script>
import Api from '@/utils/Api'

export default {
  name: 'AssessmentForm',
  data () {
    return {
      categories: [
        this.$t('camelot.assessment_form.categories.fit_meta_design'),
        this.$t('camelot.assessment_form.categories.fit_meta_conduct'),
        this.$t('camelot.assessment_form.categories.fit_design_conduct'),
        this.$t('camelot.assessment_form.overall_assessment')
      ],
      selected: null,
      text1: '',
      notes: '',
      isSaving: false,
      options: [
        [
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_research_vs_design'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_stakeholders_vs_design'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_researchers_vs_design'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_context_vs_design'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          }
        ],
        [
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_research_vs_conduct'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_stakeholders_vs_conduct'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_researchers_vs_conduct'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          },
          {
            text: this.$t('camelot.assessment_form.descriptions.meta_context_vs_conduct'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          }
        ],
        [
          {
            text: this.$t('camelot.assessment_form.descriptions.design_vs_conduct'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
            ]
          }
        ],
        [
          {
            text: this.$t('camelot.assessment_form.overall_assessment'),
            values: [
              { text: this.$t('camelot.responses.no_minimal'), value: 'A' },
              { text: this.$t('camelot.responses.minor'), value: 'B' },
              { text: this.$t('camelot.responses.moderate'), value: 'C' },
              { text: this.$t('camelot.responses.serious'), value: 'D' },
              { text: this.$t('camelot.responses.unclear'), value: 'E' }
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
        this.notes = this.assessments.items[this.modalIndex].stages[newValue].options[this.selectedMeta].notes || ''
      }
    },
    selectedMeta (newValue) {
      if (this.assessments.items) {
        this.selected = this.assessments.items[this.modalIndex].stages[this.modalStage].options[newValue].option
        this.text1 = this.assessments.items[this.modalIndex].stages[this.modalStage].options[newValue].text
        this.notes = this.assessments.items[this.modalIndex].stages[this.modalStage].options[newValue].notes || ''
      }
    },
    assessments: {
      handler (newValue) {
        if (newValue.items.length) {
          this.selected = newValue.items[this.modalIndex].stages[this.modalStage].options[this.selectedMeta].option
          this.text1 = newValue.items[this.modalIndex].stages[this.modalStage].options[this.selectedMeta].text
          this.notes = newValue.items[this.modalIndex].stages[this.modalStage].options[this.selectedMeta].notes || ''
        }
      },
      deep: true
    },
    selected (newValue) {
      this.checkChanges()
    },
    text1 (newValue) {
      this.checkChanges()
    },
    notes (newValue) {
      this.checkChanges()
    }
  },
  mounted: function () {
    if (this.assessments.items.length) {
      this.selected = this.assessments.items[this.modalIndex].stages[this.modalStage].options[this.selectedMeta].option
      this.text1 = this.assessments.items[this.modalIndex].stages[this.modalStage].options[this.selectedMeta].text
      this.notes = this.assessments.items[this.modalIndex].stages[this.modalStage].options[this.selectedMeta].notes || ''
    }
  },
  methods: {
    checkChanges () {
      const item = this.assessments.items[this.modalIndex].stages[this.modalStage].options[this.selectedMeta]
      if (item.option === this.selected && item.text === this.text1 && (item.notes || '') === this.notes) {
        this.button.disabled = true
      } else {
        this.button.disabled = false
      }
    },
    cancel () {
      this.$bvModal.hide('modal-1')
    },
    save () {
      this.isSaving = true
      const stages = [
        {
          key: 0,
          options: [
            {
              option: null,
              text: '',
              notes: ''
            },
            {
              option: null,
              text: '',
              notes: ''
            },
            {
              option: null,
              text: '',
              notes: ''
            },
            {
              option: null,
              text: '',
              notes: ''
            }
          ]
        },
        {
          key: 1,
          options: [
            {
              option: null,
              text: '',
              notes: ''
            },
            {
              option: null,
              text: '',
              notes: ''
            },
            {
              option: null,
              text: '',
              notes: ''
            },
            {
              option: null,
              text: '',
              notes: ''
            }
          ]
        },
        {
          key: 2,
          options: [
            {
              option: null,
              text: '',
              notes: ''
            }
          ]
        },
        {
          key: 3,
          options: [
            {
              option: null,
              text: '',
              notes: ''
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
          authors: this.assessments.items[this.modalIndex].authors,
          stages: (this.assessments.items.length) ? this.assessments.items[this.modalIndex].stages : stages || stages
        }
        if (params.items.find((el) => el.ref_id === this.refId)) {
          params.items.forEach((item) => {
            if (item.ref_id === this.refId) {
              item.stages[this.modalStage].options[this.selectedMeta].option = this.selected
              item.stages[this.modalStage].options[this.selectedMeta].text = this.text1
              item.stages[this.modalStage].options[this.selectedMeta].notes = this.notes
            }
          })
        } else {
          params.items.push(data)
        }
        if (this.assessments.id) {
          Api.patch(`/isoqf_assessments/${this.assessments.id}`, params)
            .then(response => {
              console.log('Data updated successfully:', response.data)
              this.$emit('getAssessments')
              this.isSaving = false
            })
            .catch(error => {
              console.error('Error updating data:', error)
              this.isSaving = false
            })
        } else {
          Api.post('/isoqf_assessments', params)
            .then(response => {
              this.$emit('getAssessments')
              console.log('Data saved successfully:', response.data)
              this.isSaving = false
            })
            .catch(error => {
              console.error('Error saving data:', error)
              this.isSaving = false
            })
        }
      } else {
        console.log('no ref id')
        this.isSaving = false
      }
    }
  }
}
</script>

<style scoped>
.notes-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #1065AB;
  border-bottom: 2px solid #1065AB;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}
.italic {
  font-style: italic;
}
</style>