<template>
  <div>
    <b-row>
      <b-col
        cols="12">
        <b-row
          class="d-print-none justify-content-end mb-2">
          <b-col
            v-if="mode==='view'"
            cols="12"
            md="3"
            xl="3">
            <b-dropdown
              id="export-button"
              class="mt-1"
              block
              variant="outline-secondary"
              right
              :text="$t('actionButtons.export')">
              <b-dropdown-item @click="ExportToWord(project.name)">{{ $t('actionButtons.to_ms_word') }}</b-dropdown-item>
              <b-dropdown-item @click="exportToRIS">{{ $t('actionButtons.the_references') }}</b-dropdown-item>
            </b-dropdown>
          </b-col>
          <b-col
            v-if="mode==='view'"
            cols="12"
            md="3"
            xl="3">
              <b-button
                class="mt-1"
                variant="outline-info"
                block
                @click="printiSoQ">
                {{ $t('actionButtons.print_save_pdf') }}
              </b-button>
          </b-col>
          <b-col
            v-if="mode==='view' && !preview && canWrite && !isLocked"
            cols="12"
            md="3"
            xl="3">
              <b-button
                class="mt-1"
                @click="changeMode"
                variant="primary"
                block>
                <font-awesome-icon icon="edit"></font-awesome-icon>
                {{ $t('actionButtons.edit') }}
              </b-button>
          </b-col>
          <b-col
            v-if="mode==='edit'"
            cols="12"
            md="3"
            xl="3">
              <b-button
                v-if="canWrite"
                class="mt-1"
                @click="modalChangePublicStatus"
                :disabled="!isOnline"
                :variant="(project.is_public) ? 'outline-primary' : 'primary'"
                block
                v-b-tooltip.hover :title="$t('actionButtons.publish_tooltip')">
                <span v-if="project.is_public">{{ $t('actionButtons.published') }}</span><span v-else>{{ $t('actionButtons.publish') }}</span>
              </b-button>
          </b-col>
          <b-col
            v-if="mode==='edit'"
            cols="12"
            md="3"
            xl="3">
              <b-button
                class="mt-1"
                @click="changeMode"
                variant="outline-success"
                block
                v-b-tooltip.hover :title="$t('actionButtons.view_mode_tooltip')">
                {{ $t('actionButtons.print_or_export') }}
              </b-button>
          </b-col>
        </b-row>
      </b-col>
    </b-row>

    <!-- Indicador de progreso -->
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

    <!-- Mensaje de error -->
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

    <b-modal
      ref="modal-change-status"
      id="modal-change-status"
      scrollable
      size="xl"
      :ok-title="$t('actionButtons.modal.save')"
      ok-variant="outline-success"
      @ok="savePublicStatus"
      cancel-variant="outline-secondary"
      hide-header-close
      no-close-on-backdrop
      no-close-on-esc>
      <template v-slot:modal-title>
        <videoHelp :txt="$t('actionButtons.modal.title')" tag="none" urlId="504176899-1"></videoHelp>
      </template>

      <template v-if="errorsResponse.message !== ''">
        <b-alert
          show
          variant="danger"
          dismissible
          @dismissed="errorsResponse.message = ''">
          <p class="mb-0" v-html="errorsResponse.message"></p>
        </b-alert>
      </template>

      <p class="font-weight-light">
        {{ $t('actionButtons.modal.publish_info') }}
      </p>
      <b-form-group>
        <b-form-radio-group
        id="modal-publish-status"
        v-model="modalProject.public_type"
        :options="global_status"
        name="modal-radio-status"
        ></b-form-radio-group>
      </b-form-group>

      <template v-if="modalProject.public_type !== 'private'">
        <h5>{{ $t('actionButtons.modal.choose_license') }}</h5>
        <p class="font-weight-light">{{ $t('actionButtons.modal.license_info') }} <a href="https://creativecommons.org/about/cclicenses/" target="_blank">{{ $t('actionButtons.modal.license_info_link_text') }}</a>.</p>
        <p class="font-weight-light">{{ $t('actionButtons.modal.license_responsibility') }}</p>
        <b-form-group>
          <b-form-radio-group
          id="modal-publish-license"
          v-model="modalProject.license_type"
          :options="global_licenses"
          @change="state.license_type = null"
          name="modal-radio-license"
          ></b-form-radio-group>
          <b-form-invalid-feedback :state="state.license_type">{{ $t('actionButtons.modal.must_select_license') }}</b-form-invalid-feedback>
        </b-form-group>
      </template>

      <template #modal-footer>
        <div class="w-100">
          <b-button
            variant="outline-success"
            class="float-right ml-3"
            @click="savePublicStatus">
            <b-spinner small v-show="ui.publish.showLoader"></b-spinner>
            {{ $t('actionButtons.modal.save') }}
          </b-button>
          <b-button
            v-show="!ui.publish.showLoader"
            variant="outline-secondary"
            class="float-right"
            @click="$refs['modal-change-status'].hide()">
            {{ $t('actionButtons.modal.close') }}
          </b-button>
        </div>
      </template>
    </b-modal>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, VerticalAlign, BorderStyle, PageOrientation, HeightRule } from 'docx'
import Commons from '@/utils/commons.js'
import { documentExportMixin } from '@/mixins/documentExportMixin'
import { useExportState } from '@/composables/useExportState'
import { ExportStrategyFactory } from '@/strategies/exportStrategies'
import { DocumentGenerator } from '@/utils/documentGenerator'
const videoHelp = () => import(/* webpackChunkName: "videohelp" */ '../videoHelp')

export default {
  name: 'actionButtons',
  mixins: [documentExportMixin, useExportState()],
  props: {
    mode: {
      type: String,
      required: false,
      default: ''
    },
    preview: {
      type: Boolean,
      default: false
    },
    project: Object,
    canWrite: Boolean,
    isLocked: {
      type: Boolean,
      default: false
    },
    ui: Object,
    lists: Array,
    findings: Array,
    references: Array,
    charsOfStudies: Object,
    methodologicalTableRefs: Object,
    listsPrintVersion: Array,
    selectOptions: Array,
    cerqualConfidence: Array,
    printableItems: Array
  },
  components: {
    videoHelp
  },

  data () {
    return {
      modalProject: {name: ''},
      errors: [],
      state: {
        name: null,
        authors: null,
        author: null,
        author_email: null,
        review_question: null,
        published_status: null,
        url_doi: null,
        complete_by_author: null,
        lists_authors: null,
        public_type: null,
        license_type: null
      },
      errorsResponse: {
        message: '',
        items: []
      },

    }
  },
  watch: {
    'modalProject.name': function (val) {
      this.state.name = val.length > 0 ? null : false
    }
  },
  mounted () {
    // Listen for modal show event to attach click handler
    this.$root.$on('bv::modal::shown', this.onModalShown)
  },
  beforeDestroy () {
    // Clean up event listeners
    this.$root.$off('bv::modal::shown', this.onModalShown)
    this.removeErrorLinkListener()
  },
  methods: {
    onModalShown (bvEvent, modalId) {
      // Only attach listener for our specific modal
      if (modalId === 'modal-change-status') {
        this.$nextTick(() => {
          const modalBody = document.getElementById('modal-change-status___BV_modal_body_')
          if (modalBody) {
            modalBody.addEventListener('click', this.handleErrorLinkClick)
          }
        })
      }
    },
    removeErrorLinkListener () {
      const modalBody = document.getElementById('modal-change-status___BV_modal_body_')
      if (modalBody) {
        modalBody.removeEventListener('click', this.handleErrorLinkClick)
      }
    },
    handleErrorLinkClick (event) {
      // Use closest() to handle clicks on link or its children
      const link = event.target.closest('a')
      if (link && link.href) {
        const href = link.getAttribute('href')
        if (href && href.startsWith('#/')) {
          event.preventDefault()
          event.stopPropagation()
          
          // Close the modal using Bootstrap Vue's modal API
          this.$bvModal.hide('modal-change-status')
          
          // Navigate to the route after a small delay to ensure modal closes
          this.$nextTick(() => {
            const route = href.substring(1) // Remove the '#' prefix
            this.$router.push(route)
          })
        }
      }
    },
    ExportToWord: async function (filename = '') {
      try {
        this.startExport(3) // 3 pasos: validación, generación, descarga

        filename = filename ? filename + ' - Summary of Qualitative Findings Table.docx' : 'Summary of Qualitative Findings Table.docx'

        this.updateProgress(1, 'Validando datos...')

        // Validar datos antes de proceder
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

        // Usar la estrategia de exportación
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
    generateFindingsTable () {
      if (this.findings.length === 0) {
        return []
      }
      return [new Table({
        borders: {
          top: {
            size: 1,
            color: '000000',
            style: BorderStyle.NONE
          },
          bottom: {
            size: 1,
            color: '000000',
            style: BorderStyle.NONE
          },
          left: {
            size: 1,
            color: '000000',
            style: BorderStyle.NONE
          },
          right: {
            size: 1,
            color: '000000',
            style: BorderStyle.NONE
          },
          insideHorizontal: {
            size: 1,
            color: '000000',
            style: BorderStyle.NONE
          },
          insideVertical: {
            style: BorderStyle.NONE
          }
        },
        width: {
          size: 5000,
          type: WidthType.PERCENTAGE
        },
        layout: {
          type: TableLayoutType.FIXED,
          width: {
            size: 5000,
            type: WidthType.PERCENTAGE
          }
        },
        rows: [
          new TableRow({
            tableHeader: true,
            height: {
              height: 1444,
              rule: HeightRule.EXACT
            },
            children: [
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                shading: {
                  fill: '#DDDDDD'
                },
                width: {
                  size: 250,
                  type: WidthType.PERCENTAGE
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: '#',
                        size: 22,
                        bold: true
                      })
                    ]
                  })
                ]
              }),
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                width: {
                  size: 2000,
                  type: WidthType.PERCENTAGE
                },
                shading: {
                  fill: '#DDDDDD'
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: this.$t('actionButtons.word_export.table_headers.summarised_finding'),
                        size: 22,
                        bold: true
                      })
                    ]
                  })
                ]
              }),
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                width: {
                  size: 1000,
                  type: WidthType.PERCENTAGE
                },
                shading: {
                  fill: '#DDDDDD'
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: this.$t('actionButtons.word_export.table_headers.cerqual_assessment'),
                        size: 22,
                        bold: true
                      })
                    ]
                  })
                ]
              }),
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                shading: {
                  fill: '#DDDDDD'
                },
                width: {
                  size: 1000,
                  type: WidthType.PERCENTAGE
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: this.$t('actionButtons.word_export.table_headers.cerqual_explanation'),
                        size: 22,
                        bold: true
                      })
                    ]
                  })
                ]
              }),
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                shading: {
                  fill: '#DDDDDD'
                },
                width: {
                  size: 750,
                  type: WidthType.PERCENTAGE
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: this.$t('actionButtons.word_export.table_headers.references'),
                        size: 22,
                        bold: true
                      })
                    ]
                  })
                ]
              })
            ]
          }),
          ...this.generateFindingsTableContent()
        ]
      })]
    },
    generateLicense: function (project) {
      let content = []
      if (project.public_type !== 'private') {
        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: this.$t('actionButtons.word_export.license'),
                bold: true,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: project.license_type,
                size: 24
              })
            ]
          }),
          new Paragraph('')
        )
      }
      return content
    },
    modalChangePublicStatus: function () {
      this.modalProject = JSON.parse(JSON.stringify(this.project))
      this.modalProject.isModal = true
      if (!Object.prototype.hasOwnProperty.call(this.project, 'license_type')) {
        this.modalProject.license_type = 'CC-BY-NC-ND'
      }
      this.errorsResponse = {
        message: '',
        items: []
      }
      this.$refs['modal-change-status'].show()
    },
    changeMode: function () {
      this.$emit('changeMode', (this.mode === 'edit') ? 'view' : 'edit')
      if (this.mode === 'view') {
        this.$emit('changeTableSettings', {perPage: this.lists.length, currentPage: 1})
      } else {
        this.$emit('changeTableSettings', {perPage: 5, currentPage: 1})
      }
    },
    savePublicStatus: async function (event) {
      event.preventDefault()
      this.$emit('uiPublishShowLoader', true)
      let params = {}
      params.id = this.project.id
      params.public_type = this.modalProject.public_type
      const isModal = this.modalProject.isModal || false
      params.private = true
      params.is_public = false

      if (this.modalProject.public_type !== 'private') {
        params.private = false
        params.is_public = true
        params.license_type = this.modalProject.license_type
        if (this.modalProject.license_type === '' || this.modalProject.license_type === null) {
          this.state.license_type = false
          this.$emit('uiPublishShowLoader', false)
          return
        }
      } else {
        params.license_type = ''
      }

      if (this.modalProject.public_type !== 'private') {
        const canPublish = await Api.get('/api/project/can_publish', {id: this.project.id, workspace: this.$route.params.org_id, isModal: isModal})
        if (canPublish.data.status) {
          Api.patch('/api/publish', {params})
            .then(() => {
              this.modalProject = {name: ''}
              this.$emit('getProject')
              this.$emit('uiPublishShowLoader', false)
              this.$refs['modal-change-status'].hide()
            })
            .catch((error) => {
              console.log(error)
            })
        } else {
          document.getElementById('modal-change-status___BV_modal_body_').scrollTo({ top: 0, behavior: 'smooth' })
          this.errorsResponse.message = canPublish.data.message
          this.$emit('uiPublishShowLoader', false)
        }
      } else {
        Api.patch('/api/publish', {params})
          .then(() => {
            this.modalProject = {name: ''}
            this.$emit('getProject')
            this.$emit('uiPublishShowLoader', false)
            this.$refs['modal-change-status'].hide()
          })
          .catch((error) => {
            console.log(error)
          })
      }
    },
    exportToRIS: function () {
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
    processRIS: function (reference = {}) {
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
    printiSoQ: function () {
      window.print()
    },
    generateAuthorInfo: function () {
      let data = ''
      if (this.project.author.length) {
        data = this.project.author.toString()
        if (this.project.author_email.length) {
          const email = this.project.author_email.toString()
          data = data.concat(' - ' + email)
        }
      }

      return new TextRun({
        text: data,
        size: 24
      })
    },
    generateFindingsTableContent: function () {
      const filteredItems = this.filteredPrintedData()
      return filteredItems.map((item, index) => {
        if (Object.prototype.hasOwnProperty.call(item, 'is_category')) {
          return new TableRow({
            children: [
              new TableCell({
                columnSpan: 5,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: item.name.toUpperCase(),
                        bold: true,
                        size: 22
                      })
                    ]
                  })
                ]
              })
            ]
          })
        } else {
          return new TableRow({
            children: [
              this.generateTableCell({width_size: '5%', text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : index + 1, font_size: 22, align: AlignmentType.CENTER}),
              this.generateTableCell({width_size: '40%', text: item.name, font_size: 22, align: AlignmentType.LEFT}),
              this.generateTableCell({width_size: '20%', text: item.cerqual_option, font_size: 22, align: AlignmentType.CENTER}),
              this.generateTableCell({width_size: '20%', text: item.cerqual_explanation, font_size: 22, align: AlignmentType.LEFT}),
              this.generateTableCell({width_size: '15%', text: item.ref_list, font_size: 16, align: AlignmentType.LEFT})
            ]
          })
        }
      })
    },
    generateTableCell: function (content) {
      return new TableCell({
        width: {
          size: content.width_size,
          type: WidthType.PERCENTAGE
        },
        children: [
          this.generateParagraph(content),
          ...(this.generateParagraphExplanation(content))
        ]
      })
    },
    generateParagraph: function (content) {
      return new Paragraph({
        indent: {
          left: 100,
          right: 100
        },
        alignment: content.alignment,
        children: [
          this.generateText(content)
        ]
      })
    },
    generateText: function (content) {
      return new TextRun({
        text: content.text,
        size: content.font_size
      })
    },
    generateParagraphExplanation: function (content) {
      let paragraph = []
      if (content.explanation !== '') {
        if (Object.prototype.hasOwnProperty.call(content, 'explanation')) {
          paragraph.push(
            new Paragraph('')
          )
          paragraph.push(
            new Paragraph({
              children: [
                ...(this.generateExplanationText(content))
              ]
            })
          )
        }
      }
      return paragraph
    },
    generateExplanationText: function (content) {
      let text = []
      text.push(
        new TextRun({
          text: this.$t('actionButtons.word_export.explanation_label'),
          size: content.font_size,
          bold: true
        })
      )
      text.push(
        new TextRun({
          text: content.explanation,
          size: content.font_size
        })
      )
      return text
    },
    filteredPrintedData: function () {
      const items = this.listsPrintVersion
      return items.filter((item) => {
        if (this.printableItems.includes(item.id)) {
          return item
        }
      })
    },
    generateEvidenceProfileTable2: function () {
      const items = this.filteredPrintedData()
      return items.map((item, index) => {
        if (Object.prototype.hasOwnProperty.call(item, 'is_category')) {
          return new TableRow({
            children: [
              new TableCell({
                columnSpan: 8,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: item.name.toUpperCase(),
                        bold: true,
                        size: 22
                      })
                    ]
                  })
                ]
              })
            ]
          })
        } else {
          if (Object.prototype.hasOwnProperty.call(item, 'evidence_profile')) {
            if (item.evidence_profile === undefined) {
              return new TableRow({
                children: [
                  this.generateTableCell({
                    width_size: '5%',
                    text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : index + 1,
                    font_size: 22,
                    align: AlignmentType.CENTER
                  }),
                  this.generateTableCell({width_size: '40%', text: item.name, font_size: 22, align: AlignmentType.CENTER}),
                  new TableCell({
                    columnSpan: 5,
                    width_size: '40%',
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  this.generateTableCell({
                    width_size: '5%',
                    text: this.returnRefWithNames(item.references),
                    font_size: 16,
                    align: AlignmentType.LEFT
                  })
                ]
              })
            } else {
              return new TableRow({
                children: [
                  this.generateTableCell({
                    width_size: '5%',
                    text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : index + 1,
                    font_size: 22,
                    align: AlignmentType.CENTER
                  }),
                  this.generateTableCell({
                    width_size: '40%',
                    text: item.name,
                    font_size: 22,
                    align: AlignmentType.CENTER
                  }),
                  this.generateTableCell(
                    {
                      width_size: '10%',
                      text: this.displaySelectedOption(item.evidence_profile.methodological_limitations.option),
                      explanation: (item.evidence_profile.methodological_limitations.option.length) ? this.getExplanation('methodological-limitations', item.evidence_profile.methodological_limitations.option, item.evidence_profile.methodological_limitations.explanation) : '',
                      font_size: 22,
                      align: AlignmentType.LEFT
                    }
                  ),
                  this.generateTableCell({
                    width_size: '10%',
                    text: this.displaySelectedOption(item.evidence_profile.coherence.option),
                    explanation: (item.evidence_profile.coherence.explanation.length) ? this.getExplanation('coherence', item.evidence_profile.coherence.option, item.evidence_profile.coherence.explanation) : '',
                    font_size: 22,
                    align: AlignmentType.CENTER
                  }),
                  this.generateTableCell({
                    width_size: '10%',
                    text: this.displaySelectedOption(item.evidence_profile.adequacy.option),
                    explanation: (item.evidence_profile.adequacy.explanation.length) ? this.getExplanation('adequacy', item.evidence_profile.adequacy.option, item.evidence_profile.adequacy.explanation) : '',
                    font_size: 22,
                    align: AlignmentType.LEFT
                  }),
                  this.generateTableCell({
                    width_size: '10%',
                    text: this.displaySelectedOption(item.evidence_profile.relevance.option),
                    explanation: (item.evidence_profile.relevance.explanation.length) ? this.getExplanation('relevance', item.evidence_profile.relevance.option, item.evidence_profile.relevance.explanation) : '',
                    font_size: 22,
                    align: AlignmentType.LEFT
                  }),
                  this.generateTableCell({
                    width_size: '10%',
                    text: this.displaySelectedOption(item.evidence_profile.cerqual.option, 'cerqual'),
                    explanation: (item.evidence_profile.cerqual.explanation.length) ? item.evidence_profile.cerqual.explanation : '',
                    font_size: 22,
                    align: AlignmentType.LEFT
                  }),
                  this.generateTableCell({
                    width_size: '5%',
                    text: this.returnRefWithNames(item.references),
                    font_size: 16,
                    align: AlignmentType.LEFT
                  })
                ]
              })
            }
          } else {
            return new TableRow({
              children: [
                this.generateTableCell({
                  width_size: '40%',
                  text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : (Object.prototype.hasOwnProperty.call(item, 'sort')) ? item.sort : index + 1,
                  font_size: 22,
                  align: AlignmentType.LEFT
                }),
                this.generateTableCell({
                  width_size: '40%',
                  text: item.name,
                  font_size: 22,
                  align: AlignmentType.LEFT
                }),
                new TableCell({
                  columnSpan: 5,
                  width_size: '40%',
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: '',
                          size: 22
                        })
                      ]
                    })
                  ]
                }),
                this.generateTableCell({
                  width_size: '10%',
                  text: this.returnRefWithNames(item.references),
                  font_size: 16,
                  align: AlignmentType.LEFT
                })
              ]
            })
          }
        }
      })
    },
    generateTableWithoutCategories: function (findings) {
      return findings.map((finding) => {
        return new TableRow({
          tableHeader: true,
          children: [
            this.generateTableCell({width_size: '5%', text: finding.sort, font_size: 22, align: AlignmentType.CENTER}),
            this.generateTableCell({width_size: '40%', text: finding.name, font_size: 22, align: AlignmentType.LEFT}),
            this.generateTableCell({width_size: '20%', text: finding.cerqual_option, font_size: 22, align: AlignmentType.CENTER}),
            this.generateTableCell({width_size: '20%', text: finding.cerqual_explanation, font_size: 22, align: AlignmentType.LEFT}),
            this.generateTableCell({width_size: '15%', text: finding.ref_list, font_size: 16, align: AlignmentType.LEFT})
          ]
        })
      })
    },
    displaySelectedOption: function (option, type = '') {
      return Commons.displaySelectedOption(option, type)
    },
    returnRefWithNames: function (array) {
      let authorsList = []
      for (const i in array) {
        for (const r of this.references) {
          if (r.id === array[i]) {
            authorsList.push(this.getAuthorsFormat(r.authors, r.publication_year))
          }
        }
      }
      authorsList.sort()
      let authors = ''
      for (let x in authorsList) {
        authors = authors + authorsList[x] + '; '
      }
      return authors
    },
    getAuthorsFormat: function (authors = [], pubYear = '') {
      return Commons.getAuthorsFormat(authors, pubYear)
    },
    getExplanation: function (type, option, explanation) {
      return displayExplanation(type, option, explanation)
    },
    handleErrorClick: function (event) {
      if (event.target.tagName === 'A') {
        this.$refs['modal-change-status'].hide()
      }
    }
  },
  computed: {
    global_status () {
      return [
        { value: 'private', text: this.$t('actionButtons.status.private') },
        { value: 'fully', text: this.$t('actionButtons.status.fully') },
        { value: 'partially', text: this.$t('actionButtons.status.partially') },
        { value: 'minimally', text: this.$t('actionButtons.status.minimally') }
      ]
    },
    global_licenses () {
      return [
        { value: 'CC-BY-NC-ND', text: this.$t('actionButtons.licenses.cc_by_nc_nd') },
        { value: 'CC-BY-ND', text: this.$t('actionButtons.licenses.cc_by_nd') },
        { value: 'CC-BY-NC-SA', text: this.$t('actionButtons.licenses.cc_by_nc_sa') },
        { value: 'CC-BY-NC', text: this.$t('actionButtons.licenses.cc_by_nc') },
        { value: 'CC-BY-SA', text: this.$t('actionButtons.licenses.cc_by_sa') },
        { value: 'CC-BY', text: this.$t('actionButtons.licenses.cc_by') }
      ]
    },
    yes_or_no () {
      return [
        { value: false, text: this.$t('actionButtons.yes_no.no') },
        { value: true, text: this.$t('actionButtons.yes_no.yes') }
      ]
    },
    getLicense: {
      get: function () {
        if (!Object.prototype.hasOwnProperty.call(this.modalProject, 'license_type')) {
          return 'CC-BY-NC-ND'
        } else {
          if (this.modalProject.license_type === '') {
            return 'CC-BY-NC-ND'
          } else {
            return this.modalProject.license_type
          }
        }
      },
      set: function (license) {
        this.modalProject.license_type = license
      }
    }
  }
}
</script>

<style>

</style>