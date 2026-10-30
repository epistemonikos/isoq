export const camelotMixin = {
  computed: {
    camelot () {
      return {
        fields: [
          { key: 'research_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
          { key: 'research_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') },
          { key: 'stakeholders_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
          { key: 'stakeholders_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') },
          { key: 'researchers_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
          { key: 'researchers_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') },
          { key: 'context_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
          { key: 'context_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') },
          { key: 'strategy_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
          { key: 'strategy_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') },
          { key: 'theory_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
          { key: 'theory_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') },
          { key: 'ethical_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
          { key: 'ethical_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') },
          { key: 'equity_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
          { key: 'equity_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') },
          { key: 'participant_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
          { key: 'participant_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') },
          { key: 'data_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
          { key: 'data_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') },
          { key: 'analysis_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
          { key: 'analysis_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') },
          { key: 'presentation_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
          { key: 'presentation_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') }
        ],
        categories: [
          {
            key: 'research',
            label: this.$t('camelot.step_four.camelot_mixin.meta_domain_1'),
            options: [
              { key: 'research_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
              { key: 'research_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') }
            ]
          },
          {
            key: 'stakeholders',
            label: this.$t('camelot.step_four.camelot_mixin.meta_domain_2'),
            options: [
              { key: 'stakeholders_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
              { key: 'stakeholders_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') }
            ]
          },
          {
            key: 'researchers',
            label: this.$t('camelot.step_four.camelot_mixin.meta_domain_3'),
            options: [
              { key: 'researchers_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
              { key: 'researchers_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') }
            ]
          },
          {
            key: 'context',
            label: this.$t('camelot.step_four.camelot_mixin.meta_domain_4'),
            options: [
              { key: 'context_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
              { key: 'context_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') }
            ]
          },
          {
            key: 'strategy',
            label: this.$t('camelot.step_four.camelot_mixin.research_design_1'),
            options: [
              { key: 'strategy_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
              { key: 'strategy_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') }
            ]
          },
          {
            key: 'theory',
            label: this.$t('camelot.step_four.camelot_mixin.research_design_2'),
            options: [
              { key: 'theory_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
              { key: 'theory_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') }
            ]
          },
          {
            key: 'ethical',
            label: this.$t('camelot.step_four.camelot_mixin.research_design_3'),
            options: [
              { key: 'ethical_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
              { key: 'ethical_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') }
            ]
          },
          {
            key: 'equity',
            label: this.$t('camelot.step_four.camelot_mixin.research_design_4'),
            options: [
              { key: 'equity_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
              { key: 'equity_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') }
            ]
          },
          {
            key: 'participant',
            label: this.$t('camelot.step_four.camelot_mixin.research_conduct_1'),
            options: [
              { key: 'participant_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
              { key: 'participant_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') }
            ]
          },
          {
            key: 'data',
            label: this.$t('camelot.step_four.camelot_mixin.research_conduct_2'),
            options: [
              { key: 'data_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
              { key: 'data_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') }
            ]
          },
          {
            key: 'analysis',
            label: this.$t('camelot.step_four.camelot_mixin.research_conduct_3'),
            options: [
              { key: 'analysis_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
              { key: 'analysis_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') }
            ]
          },
          {
            key: 'presentation',
            label: this.$t('camelot.step_four.camelot_mixin.research_conduct_4'),
            options: [
              { key: 'presentation_extractedData', label: this.$t('camelot.step_four.camelot_mixin.extracted_data') },
              { key: 'presentation_comments', label: this.$t('camelot.step_four.camelot_mixin.concerns') }
            ]
          }
        ],
        excluded: [
          'ref_id',
          'authors',
          'research_extractedData',
          'research_comments',
          'stakeholders_extractedData',
          'stakeholders_comments',
          'researchers_extractedData',
          'researchers_comments',
          'context_extractedData',
          'context_comments',
          'strategy_extractedData',
          'strategy_comments',
          'theory_extractedData',
          'theory_comments',
          'ethical_extractedData',
          'ethical_comments',
          'equity_extractedData',
          'equity_comments',
          'participant_extractedData',
          'participant_comments',
          'data_extractedData',
          'data_comments',
          'analysis_extractedData',
          'analysis_comments',
          'presentation_extractedData',
          'presentation_comments',
          'actions'
        ]
      }
    }
  },

  methods: {
    addFieldsObjects (fieldsObj) {
      for (const field of this.camelot.fields) {
        fieldsObj.push(field)
      }
    },

    scrollToSection (sectionId) {
      const element = document.getElementById(sectionId)
      if (element) {
        this.modal.selectedOption = sectionId
        const camelotContainer = document.getElementById('camelot')
        const offset = element.offsetTop - camelotContainer.offsetTop
        camelotContainer.scrollTo({
          top: offset,
          behavior: 'smooth'
        })
      }
    }
  }
}
