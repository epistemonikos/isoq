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
      const clone = (value, fallback) => JSON.parse(JSON.stringify(value || fallback))
      const filename = (this.project.name || '') + ' - GRADE-CERQual Assessment Worksheet.docx'

      if (this.project.use_camelot) {
        await exportToWord(this.project, {
          evidenceProfile: clone(this.evidenceProfile, []),
          characteristicStudies: clone(this.characteristicStudies, {}),
          methodologicalAssessments: clone(this.methodologicalAssessments, {}),
          extractedData: clone(this.extractedData, {}),
          selectOptions: clone(this.selectOptions, []),
          levelConfidence: clone(this.levelConfidence, []),
          references: clone(this.list.fullreferences, []),
          list: clone(this.list, {}),
          license: this.license,
          // Quien exporta desde acá es del equipo: todas las tablas (ver includesStudyTables).
          includeStudyTables: true
        }, { filename, strategy: 'camelot' })
        return
      }

      // Sin CAMELOT: el mismo Worksheet que la vista compartida (previewContentWorksheet),
      // pero con las tablas de los Pasos 3/4 y los datos extraídos siempre: quien exporta
      // desde acá es del equipo, no un lector público.
      const evidenceProfile = this.evidenceProfile && this.evidenceProfile.length ? this.evidenceProfile[0] : {}
      await exportToWord(this.project, {
        evidenceProfile: clone(evidenceProfile, {}),
        characteristicsStudies: clone(this.characteristicStudies, {}),
        methodologicalAssessments: clone(this.methodologicalAssessments, {}),
        extractedData: clone(this.extractedData, {}),
        references: clone(this.list.fullreferences, []),
        list: clone(this.list, {}),
        findings: [{ ...clone(this.list, {}), evidence_profile: clone(evidenceProfile, {}) }],
        includeStudyTables: true
      }, { filename, strategy: 'worksheet' })
    },
    print: function () {
      window.print()
    }
  }
}
</script>

<style>

</style>
