<template>
  <div v-if="mode === 'view'">
    <!-- Export Dropdown -->
    <b-col cols="12" md="3" xl="3">
      <b-dropdown
        id="export-button"
        class="mt-1"
        block
        variant="outline-secondary"
        right
        :text="$t('actionButtons.export')">
        <b-dropdown-item @click="ExportToWord(project.name)">
          {{ $t('actionButtons.to_ms_word') }}
        </b-dropdown-item>
        <b-dropdown-item @click="exportToRIS">
          {{ $t('actionButtons.the_references') }}
        </b-dropdown-item>
      </b-dropdown>
    </b-col>

    <!-- Print/PDF Button -->
    <b-col cols="12" md="3" xl="3">
      <b-button
        class="mt-1"
        variant="outline-info"
        block
        @click="printiSoQ">
        {{ $t('actionButtons.print_save_pdf') }}
      </b-button>
    </b-col>

    <!-- Progress Indicator -->
    <b-row v-if="exportState.isLoading" class="mt-2">
      <b-col cols="12">
        <b-progress
          :value="exportState.progress"
          :max="100"
          show-progress
          animated>
          {{ exportState.currentStep }}
        </b-progress>
      </b-col>
    </b-row>

    <!-- Error Message -->
    <b-row v-if="exportState.error" class="mt-2">
      <b-col cols="12">
        <b-alert
          show
          variant="danger"
          dismissible
          @dismissed="setError(null)">
          {{ exportState.error }}
        </b-alert>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { documentExportMixin } from '@/mixins/documentExportMixin'
import { useExportState } from '@/composables/useExportState'
import { ExportStrategyFactory } from '@/strategies/exportStrategies'
import { DocumentGenerator } from '@/utils/documentGenerator'

export default {
  name: 'ExportActions',
  mixins: [documentExportMixin, useExportState()],
  props: {
    mode: {
      type: String,
      required: true
    },
    project: {
      type: Object,
      required: true
    },
    findings: {
      type: Array,
      default: () => []
    },
    references: {
      type: Array,
      default: () => []
    },
    listsPrintVersion: {
      type: Array,
      default: () => []
    },
    printableItems: {
      type: Array,
      default: () => []
    },
    cerqualConfidence: {
      type: Array,
      default: () => []
    },
    selectOptions: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    async ExportToWord(filename = '') {
      try {
        this.startExport(3) // 3 steps: validation, generation, download

        filename = filename ? filename + ' - Summary of Qualitative Findings Table.docx' : 'Summary of Qualitative Findings Table.docx'

        this.updateProgress(1, 'Validando datos...')

        // Validate data before proceeding
        const data = {
          findings: this.findings,
          references: this.references,
          listsPrintVersion: this.listsPrintVersion,
          printableItems: this.printableItems
        }

        const documentGenerator = new DocumentGenerator()
        const errors = documentGenerator.validateData(data, ['findings'])
        if (errors.length > 0) {
          this.setError(errors.join(', '))
          return
        }

        this.updateProgress(2, 'Generando documento...')

        // Use export strategy
        const strategyType = this.project.use_camelot ? 'camelot' : 'isoq'
        const strategy = ExportStrategyFactory.createStrategy(strategyType, this.project, data)
        const success = await strategy.generateAndDownload(filename)

        if (success) {
          this.finishExport()
        } else {
          this.setError('Error al generar el documento')
        }
      } catch (error) {
        console.error('Error en ExportToWord:', error)
        this.setError('Error inesperado al exportar el documento')
      }
    },

    exportToRIS() {
      const _refs = JSON.parse(JSON.stringify(this.references))
      let content = ''
      for (let ref of _refs) {
        content += this.processRIS(ref)
      }

      var element = document.createElement('a')
      element.setAttribute('href', 'data:text/text;charset=utf-8,' + encodeURI(content))
      element.setAttribute('download', 'references.ris')
      element.click()
    },

    processRIS(reference = {}) {
      let txt = ''

      if (Object.prototype.hasOwnProperty.call(reference, 'type')) {
        txt += 'TY  - ' + reference.type + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'abstract')) {
        txt += 'AB  - ' + reference.abstract + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'title')) {
        txt += 'TI  - ' + reference.title + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        var cnt = 1
        for (let a of reference.authors) {
          txt += `A${cnt}  - ` + a + '\r\n'
          cnt++
        }
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'publication_year')) {
        txt += 'PY  - ' + reference.publication_year + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'database')) {
        txt += 'DB  - ' + reference.database + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'volume_number')) {
        txt += 'VL  - ' + reference.volume_number + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'url')) {
        txt += 'UR  - ' + reference.url + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'start_page')) {
        txt += 'SP  - ' + reference.start_page + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'isbn_issn')) {
        txt += 'SN  - ' + reference.isbn_issn + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'date')) {
        txt += 'DA  - ' + reference.date + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'user_definable')) {
        var count = 1
        for (let c of reference.user_definable) {
          txt += `C${count} - ` + c + '\r\n'
          count++
        }
      }
      txt += 'ER  - ' + '\r\n'
      return txt
    },

    printiSoQ() {
      window.print()
    }
  }
}
</script>

<style scoped>
</style>
