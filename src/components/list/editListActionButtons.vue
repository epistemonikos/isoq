<template>
  <div>
  <b-row
    v-if="mode==='view' && permission"
    class="d-print-none justify-content-end mb-2 pt-2">
    <b-col
      v-if="mode==='view'"
      cols="12"
      sm="2">
        <b-button
          id="exportButton"
          variant="outline-secondary"
          block
          @click="exportToWord()">
          {{ $t('actionButtons.export') }} {{ $t('actionButtons.to_ms_word') }}
        </b-button>
    </b-col>
    <b-col
      v-if="mode==='view'"
      cols="12"
      sm="2">
        <b-button
          id="printButton"
          @click="print"
          variant="outline-info"
          block>
          {{ $t('publish.print_pdf') }}
        </b-button>
    </b-col>
    <b-col
      v-if="mode==='view'"
      cols="12"
      sm="2">
        <b-button
          id="editButton"
          @click="changeMode"
          variant="primary"
          v-b-tooltip:editButton.top="'Click to edit'"
          block>
          {{ $t('common.edit') }}
        </b-button>
    </b-col>
  </b-row>
  </div>
</template>

<script>
import { exportToWord } from '../../services/wordExportService'

export default {
  name: 'editListActionsButtons',
  props: {
    mode: String,
    permission: Boolean,
    project: Object,
    evidenceProfile: Array,
    selectOptions: Array,
    levelConfidence: Array,
    references: Array,
    list: Object,
    characteristicStudies: Object,
    methodologicalAssessments: Object,
    extractedData: Object,
    license: String
  },
  methods: {
    changeMode: function () {
      this.$emit('changeMode')
    },
    exportToWord: async function () {
      const data = {
        evidenceProfile: JSON.parse(JSON.stringify(this.evidenceProfile || [])),
        characteristicStudies: JSON.parse(JSON.stringify(this.characteristicStudies || {})),
        methodologicalAssessments: JSON.parse(JSON.stringify(this.methodologicalAssessments || {})),
        extractedData: JSON.parse(JSON.stringify(this.extractedData || {})),
        selectOptions: JSON.parse(JSON.stringify(this.selectOptions || [])),
        levelConfidence: JSON.parse(JSON.stringify(this.levelConfidence || [])),
        references: JSON.parse(JSON.stringify(this.references || [])),
        list: JSON.parse(JSON.stringify(this.list || {})),
        license: this.license
      }

      await exportToWord(this.project, data, {
        filename: (this.project.name + ' - GRADE-CERQual Assessment Worksheet' || 'GRADE-CERQual Assessment Worksheet') + '.docx'
      })
    },
    print: function () {
      window.print()
    }
  }
}
</script>

<style>

</style>
