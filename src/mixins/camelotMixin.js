export const camelotMixin = {
  data () {
    return {
      camelot: {
        fields: [
          { key: 'research_extractedData', label: 'Extracted data' },
          { key: 'research_concerns', label: 'Concerns' },
          { key: 'stakeholders_extractedData', label: 'Extracted data' },
          { key: 'stakeholders_concerns', label: 'Concerns' },
          { key: 'researchers_extractedData', label: 'Extracted data' },
          { key: 'researchers_concerns', label: 'Concerns' },
          { key: 'context_extractedData', label: 'Extracted data' },
          { key: 'context_concerns', label: 'Concerns' },
          { key: 'strategy_extractedData', label: 'Extracted data' },
          { key: 'strategy_concerns', label: 'Concerns' },
          { key: 'theory_extractedData', label: 'Extracted data' },
          { key: 'theory_concerns', label: 'Concerns' },
          { key: 'ethical_extractedData', label: 'Extracted data' },
          { key: 'ethical_concerns', label: 'Concerns' },
          { key: 'equity_extractedData', label: 'Extracted data' },
          { key: 'equity_concerns', label: 'Concerns' },
          { key: 'participant_extractedData', label: 'Extracted data' },
          { key: 'participant_concerns', label: 'Concerns' },
          { key: 'data_extractedData', label: 'Extracted data' },
          { key: 'data_concerns', label: 'Concerns' },
          { key: 'analysis_extractedData', label: 'Extracted data' },
          { key: 'analysis_concerns', label: 'Concerns' },
          { key: 'presentation_extractedData', label: 'Extracted data' },
          { key: 'presentation_concerns', label: 'Concerns' }
        ],
        categories: [
          {
            key: 'research',
            label: 'Meta domain 1 - Research',
            options: [
              { key: 'research_extractedData', label: 'Extracted data' },
              { key: 'research_concerns', label: 'Concerns' }
            ]
          },
          {
            key: 'stakeholders',
            label: 'Meta domain 2 - Stakeholders',
            options: [
              { key: 'stakeholders_extractedData', label: 'Extracted data' },
              { key: 'stakeholders_concerns', label: 'Concerns' }
            ]
          },
          {
            key: 'researchers',
            label: 'Meta domain 3 - Researchers',
            options: [
              { key: 'researchers_extractedData', label: 'Extracted data' },
              { key: 'researchers_concerns', label: 'Concerns' }
            ]
          },
          {
            key: 'context',
            label: 'Meta domain 4 - Context',
            options: [
              { key: 'context_extractedData', label: 'Extracted data' },
              { key: 'context_concerns', label: 'Concerns' }
            ]
          },
          {
            key: 'strategy',
            label: 'Research design 1 - Research strategy',
            options: [
              { key: 'strategy_extractedData', label: 'Extracted data' },
              { key: 'strategy_concerns', label: 'Concerns' }
            ]
          },
          {
            key: 'theory',
            label: 'Research design 2 - Theory',
            options: [
              { key: 'theory_extractedData', label: 'Extracted data' },
              { key: 'theory_concerns', label: 'Concerns' }
            ]
          },
          {
            key: 'ethical',
            label: 'Research design 3 - Ethical considerations',
            options: [
              { key: 'ethical_extractedData', label: 'Extracted data' },
              { key: 'ethical_concerns', label: 'Concerns' }
            ]
          },
          {
            key: 'equity',
            label: 'Research design 4 - Equity, diversity & inclusion considerations',
            options: [
              { key: 'equity_extractedData', label: 'Extracted data' },
              { key: 'equity_concerns', label: 'Concerns' }
            ]
          },
          {
            key: 'participant',
            label: 'Research conduct 1 - Participant recruitment & selection',
            options: [
              { key: 'participant_extractedData', label: 'Extracted data' },
              { key: 'participant_concerns', label: 'Concerns' }
            ]
          },
          {
            key: 'data',
            label: 'Research conduct 2 - Data collection',
            options: [
              { key: 'data_extractedData', label: 'Extracted data' },
              { key: 'data_concerns', label: 'Concerns' }
            ]
          },
          {
            key: 'analysis',
            label: 'Research conduct 3 - Analysis & interpretation',
            options: [
              { key: 'analysis_extractedData', label: 'Extracted data' },
              { key: 'analysis_concerns', label: 'Concerns' }
            ]
          },
          {
            key: 'presentation',
            label: 'Research conduct 4 - Presentation of findings',
            options: [
              { key: 'presentation_extractedData', label: 'Extracted data' },
              { key: 'presentation_concerns', label: 'Concerns' }
            ]
          }
        ],
        excluded: [
          'ref_id',
          'authors',
          'research_extractedData',
          'research_concerns',
          'stakeholders_extractedData',
          'stakeholders_concerns',
          'researchers_extractedData',
          'researchers_concerns',
          'context_extractedData',
          'context_concerns',
          'strategy_extractedData',
          'strategy_concerns',
          'theory_extractedData',
          'theory_concerns',
          'ethical_extractedData',
          'ethical_concerns',
          'equity_extractedData',
          'equity_concerns',
          'participant_extractedData',
          'participant_concerns',
          'data_extractedData',
          'data_concerns',
          'analysis_extractedData',
          'analysis_concerns',
          'presentation_extractedData',
          'presentation_concerns'
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
