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
            v-if="mode==='view' && !preview"
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
    
    <!-- Publish Modal Component -->
    <PublishModal
      ref="publishModal"
      :project="project"
      :ui="ui"
      @getProject="$emit('getProject')"
      @uiPublishShowLoader="$emit('uiPublishShowLoader', $event)"
    />
  </div>
</template>

<script>
import axios from 'axios'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, VerticalAlign, BorderStyle, PageOrientation, HeightRule, TableLayoutType } from 'docx'
import { displayExplanation } from '../utils/commons'
import PublishModal from '@/components/project/PublishModal'
const videoHelp = () => import(/* webpackChunkName: "videohelp" */ '../videoHelp')

export default {
  name: 'actionButtons',
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
    permissions: Boolean,
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
    videoHelp,
    PublishModal
  },
  data () {
    return {
      modalProject: {name: ''},
      yes_or_no: [
        { value: false, text: 'no' },
        { value: true, text: 'yes' }
      ],
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
      }
    }
  },
  watch: {
    'modalProject.name': function (val) {
      this.state.name = val.length > 0 ? null : false
    }
  },
  methods: {
    ExportToWord: function (filename = '') {
      filename = filename ? filename + ' - Summary of Qualitative Findings Table.docx' : 'Summary of Qualitative Findings Table.docx'
      const doc = new Document()

      doc.addSection({
        margins: {
          top: 720,
          right: 720,
          bottom: 720,
          left: 720
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: this.project.name,
                bold: true,
                size: 36,
                font: { name: 'Times New Roman' },
                color: '000000'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'Summary of Qualitative Findings Table',
                bold: true,
                size: 36,
                font: { name: 'Times New Roman' },
                color: '000000'
              })
            ]
          }),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Review question',
                bold: true,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: this.project.review_question,
                size: 24
              })
            ]
          }),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Authors of the review',
                bold: true,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: this.project.authors,
                size: 24
              })
            ]
          }),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Corresponding author',
                bold: true,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [
              this.generateAuthorInfo()
            ]
          }),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Has the review been published?',
                bold: true,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: (this.project.published_status) ? ('Yes' + (this.project.url_doi.length) ? ' | DOI: ' + this.project.url_doi : '') : 'No',
                size: 24
              })
            ]
          }),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Additional Information',
                bold: true,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: this.project.description,
                size: 24
              })
            ]
          }),
          new Paragraph(''),
          ...this.generateLicense(this.project),
          ...this.generateFindingsTable()
        ]
      })
      if (this.findings.length && (this.$route.name === 'viewProject' || (this.$route.name === 'previewContentSoQf' && this.project.public_type !== 'minimally'))) {
        doc.addSection({
          size: {
            orientation: PageOrientation.LANDSCAPE
          },
          margins: {
            top: 720,
            right: 720,
            bottom: 720,
            left: 720
          },
          children: [
            new Paragraph({
              heading: HeadingLevel.HEADING_3,
              children: [
                new TextRun({
                  text: 'Evidence Profile Table',
                  bold: true,
                  size: 32,
                  font: { name: 'Times New Roman' },
                  color: '000000'
                })
              ]
            }),
            new Paragraph(''),
            new Table({
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
                      shading: {
                        fill: '#DDDDDD'
                      },
                      width: {
                        size: 1500,
                        type: WidthType.PERCENTAGE
                      },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.LEFT,
                          children: [
                            new TextRun({
                              text: 'Summarised review finding',
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
                        size: 500,
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
                              text: 'Methodological limitations',
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
                        size: 500,
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
                              text: 'Coherence',
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
                        size: 500,
                        type: WidthType.PERCENTAGE
                      },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: 'Adequacy',
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
                        size: 500,
                        type: WidthType.PERCENTAGE
                      },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: 'Relevance',
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
                        size: 500,
                        type: WidthType.PERCENTAGE
                      },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: 'GRADE-CERQual assessment of confidence',
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
                          alignment: AlignmentType.LEFT,
                          children: [
                            new TextRun({
                              text: 'References',
                              size: 22,
                              bold: true
                            })
                          ]
                        })
                      ]
                    })
                  ]
                }),
                ...this.generateEvidenceProfileTable2()
              ]
            })
          ]
        })
      }
      Packer.toBlob(doc).then(blob => {
        saveAs(blob, filename)
      })
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
                    alignment: AlignmentType.LEFT,
                    children: [
                      new TextRun({
                        text: 'Summarised review finding',
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
                        text: 'GRADE-CERQual Assessment of confidence',
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
                        text: 'Explanation of GRADE-CERQual Assessment',
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
                    alignment: AlignmentType.LEFT,
                    children: [
                      new TextRun({
                        text: 'References',
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
                text: 'License',
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
      this.$refs.publishModal.openModal()
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
        const canPublish = await axios.get('/api/project/can_publish', {params: {id: this.project.id, workspace: this.$route.params.org_id, isModal: isModal}})
        if (canPublish.data.status) {
          axios.patch('/api/publish', {params})
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
        axios.patch('/api/publish', {params})
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
              this.generateTableCell({width_size: 250, text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : index + 1, font_size: 22, align: AlignmentType.CENTER}),
              this.generateTableCell({width_size: 2000, text: item.name, font_size: 22, align: AlignmentType.LEFT}),
              this.generateTableCell({width_size: 1000, text: item.cerqual_option, font_size: 22, align: AlignmentType.CENTER}),
              this.generateTableCell({width_size: 1000, text: item.cerqual_explanation, font_size: 22, align: AlignmentType.LEFT}),
              this.generateTableCell({width_size: 750, text: item.ref_list, font_size: 16, align: AlignmentType.LEFT})
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
          text: 'Explanation: ',
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
                    width_size: 250,
                    text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : index + 1,
                    font_size: 22,
                    align: AlignmentType.CENTER
                  }),
                  this.generateTableCell({
                    width_size: 1500, text: item.name, font_size: 22, align: AlignmentType.CENTER
                  }),
                  new TableCell({
                    columnSpan: 5,
                    width_size: 2500,
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
                    width_size: 750,
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
                    width_size: 250,
                    text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : index + 1,
                    font_size: 22,
                    align: AlignmentType.CENTER
                  }),
                  this.generateTableCell({
                    width_size: 1500,
                    text: item.name,
                    font_size: 22,
                    align: AlignmentType.CENTER
                  }),
                  this.generateTableCell(
                    {
                      width_size: 500,
                      text: this.displaySelectedOption(item.evidence_profile.methodological_limitations.option),
                      explanation: (item.evidence_profile.methodological_limitations.option.length) ? this.getExplanation('methodological-limitations', item.evidence_profile.methodological_limitations.option, item.evidence_profile.methodological_limitations.explanation) : '',
                      font_size: 22,
                      align: AlignmentType.LEFT
                    }
                  ),
                  this.generateTableCell({
                    width_size: 500,
                    text: this.displaySelectedOption(item.evidence_profile.coherence.option),
                    explanation: (item.evidence_profile.coherence.explanation.length) ? this.getExplanation('coherence', item.evidence_profile.coherence.option, item.evidence_profile.coherence.explanation) : '',
                    font_size: 22,
                    align: AlignmentType.CENTER
                  }),
                  this.generateTableCell({
                    width_size: 500,
                    text: this.displaySelectedOption(item.evidence_profile.adequacy.option),
                    explanation: (item.evidence_profile.adequacy.explanation.length) ? this.getExplanation('adequacy', item.evidence_profile.adequacy.option, item.evidence_profile.adequacy.explanation) : '',
                    font_size: 22,
                    align: AlignmentType.LEFT
                  }),
                  this.generateTableCell({
                    width_size: 500,
                    text: this.displaySelectedOption(item.evidence_profile.relevance.option),
                    explanation: (item.evidence_profile.relevance.explanation.length) ? this.getExplanation('relevance', item.evidence_profile.relevance.option, item.evidence_profile.relevance.explanation) : '',
                    font_size: 22,
                    align: AlignmentType.LEFT
                  }),
                  this.generateTableCell({
                    width_size: 500,
                    text: this.displaySelectedOption(item.evidence_profile.cerqual.option, 'cerqual'),
                    explanation: (item.evidence_profile.cerqual.explanation.length) ? item.evidence_profile.cerqual.explanation : '',
                    font_size: 22,
                    align: AlignmentType.LEFT
                  }),
                  this.generateTableCell({
                    width_size: 750,
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
                  width_size: 250,
                  text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : (Object.prototype.hasOwnProperty.call(item, 'sort')) ? item.sort : index + 1,
                  font_size: 22,
                  align: AlignmentType.LEFT
                }),
                this.generateTableCell({
                  width_size: 1500,
                  text: item.name,
                  font_size: 22,
                  align: AlignmentType.LEFT
                }),
                new TableCell({
                  columnSpan: 5,
                  width_size: 2500,
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
                  width_size: 750,
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
            this.generateTableCell({width_size: 250, text: finding.sort, font_size: 22, align: AlignmentType.CENTER}),
            this.generateTableCell({width_size: 2000, text: finding.name, font_size: 22, align: AlignmentType.LEFT}),
            this.generateTableCell({width_size: 1000, text: finding.cerqual_option, font_size: 22, align: AlignmentType.CENTER}),
            this.generateTableCell({width_size: 1000, text: finding.cerqual_explanation, font_size: 22, align: AlignmentType.LEFT}),
            this.generateTableCell({width_size: 750, text: finding.ref_list, font_size: 16, align: AlignmentType.LEFT})
          ]
        })
      })
    },
    displaySelectedOption: function (option, type = '') {
      if (option === null) {
        return ''
      } else if (option >= 0) {
        if (type === 'cerqual') {
          return this.cerqualConfidence[option].text
        } else {
          return this.selectOptions[option].text
        }
      } else {
        return ''
      }
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
      if (authors.length) {
        const nroAuthors = authors.length
        if (nroAuthors === 1) {
          return authors[0].split(',')[0] + ' ' + pubYear
        } else if (nroAuthors === 2) {
          return authors[0].split(',')[0] + ' & ' + authors[1].split(',')[0] + ' ' + pubYear
        } else {
          return authors[0].split(',')[0] + ' et al. ' + ' ' + pubYear
        }
      } else {
        return 'author(s) not found'
      }
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
