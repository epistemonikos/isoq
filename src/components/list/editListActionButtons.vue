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
import printFooterMixin from '@/mixins/printFooterMixin'

export default {
  name: 'editListActionsButtons',
  mixins: [printFooterMixin],
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
    license: String,
    // Lo que muestran las tablas de la worksheet (filtro de columnas, búsqueda), por tabla:
    // `{ characteristics, methodological, extracted }`. El Word lo sigue (#416).
    tableViews: Object
  },
  methods: {
    /** printFooterMixin: el pie del PDF, el mismo del Word (#416). */
    printFooterSource: function () {
      return this.project && this.project.id
        ? { project: this.project, findingNumber: this.evidenceProfile && this.evidenceProfile[0] && this.evidenceProfile[0].displayNumber }
        : null
    },
    changeMode: function () {
      this.$emit('changeMode')
    },
    exportToWord: async function () {
      const clone = (value, fallback) => JSON.parse(JSON.stringify(value || fallback))
      const filename = (this.project.name || '') + ' - GRADE-CERQual Assessment Worksheet.docx'

      // #416: lo exportado es lo que se ve. Cada tabla con buscador manda sus filas visibles
      // y su búsqueda (para la nota del documento); sin búsqueda, la tabla entera.
      const views = this.tableViews || {}
      const searched = (table, view) => {
        const copy = clone(table, {})
        const active = !!(view && view.search && Array.isArray(view.items))
        if (active) copy.items = clone(view.items, [])
        return [copy, active ? { search: view.search, shown: view.shown, total: view.total } : null]
      }
      const [extractedData, extractedView] = searched(this.extractedData, views.extracted)

      if (this.project.use_camelot) {
        await exportToWord(this.project, {
          evidenceProfile: clone(this.evidenceProfile, []),
          characteristicStudies: clone(this.characteristicStudies, {}),
          methodologicalAssessments: clone(this.methodologicalAssessments, {}),
          extractedData,
          extractedView,
          selectOptions: clone(this.selectOptions, []),
          levelConfidence: clone(this.levelConfidence, []),
          references: clone(this.list.fullreferences, []),
          list: clone(this.list, {}),
          license: this.license,
          // Columnas ocultas y comentarios de la tabla CAMELOT de Characteristics.
          characteristicsView: views.characteristics || null,
          // Quien exporta desde acá es del equipo: todas las tablas (ver includesStudyTables).
          includeStudyTables: true
        }, { filename, strategy: 'camelot' })
        return
      }

      // Sin CAMELOT: el mismo Worksheet que la vista compartida (previewContentWorksheet),
      // pero con las tablas de los Pasos 3/4 y los datos extraídos siempre: quien exporta
      // desde acá es del equipo, no un lector público.
      const evidenceProfile = this.evidenceProfile && this.evidenceProfile.length ? this.evidenceProfile[0] : {}
      const [characteristicsStudies, characteristicsView] = searched(this.characteristicStudies, views.characteristics)
      const [methodologicalAssessments, methodologicalView] = searched(this.methodologicalAssessments, views.methodological)
      await exportToWord(this.project, {
        evidenceProfile: clone(evidenceProfile, {}),
        characteristicsStudies,
        characteristicsView,
        methodologicalAssessments,
        methodologicalView,
        extractedData,
        extractedView,
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
