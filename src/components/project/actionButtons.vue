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
              text="Export">
              <b-dropdown-item @click="ExportToWord(project.name)">to MS Word</b-dropdown-item>
              <b-dropdown-item @click="exportToRIS">the references</b-dropdown-item>
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
                Print or save as PDF
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
                Edit
              </b-button>
          </b-col>
          <b-col
            v-if="mode==='edit'"
            cols="12"
            md="3"
            xl="3">
              <b-button
                v-if="permissions"
                class="mt-1"
                @click="modalChangePublicStatus"
                :variant="(project.is_public) ? 'outline-primary' : 'primary'"
                block
                v-b-tooltip.hover title="Click here when you have finished your iSoQ to select what you would like published to the publicly available iSoQ database">
                <span v-if="project.is_public">Published</span><span v-else>Publish</span>
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
                v-b-tooltip.hover title="Click to enter view mode where you can export or print">
                Print or Export
              </b-button>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
    <b-modal
      ref="modal-change-status"
      id="modal-change-status"
      scrollable
      size="xl"
      ok-title="Save"
      ok-variant="outline-success"
      @ok="savePublicStatus"
      cancel-variant="outline-secondary"
      hide-header-close
      no-close-on-backdrop
      no-close-on-esc>
      <template v-slot:modal-title>
        <videoHelp txt="Publish to the iSoQ Database" tag="none" urlId="504176899-1"></videoHelp>
      </template>

      <template v-if="errorsResponse.message !== ''">
        <b-alert
          show
          variant="danger"
          dismissible
          @dismissed="errorsResponse.message = ''">
          <p class="mb-0" v-html="errorsResponse.message" @click="handleErrorClick"></p>
        </b-alert>
      </template>

      <p class="font-weight-light">
        By publishing your iSoQ to the online database, your contribution becomes searchable, readable and downloadable by the public. Please select a visibility setting below and click “publish”. Click the icon next to each to see an example. We recommend users choose Fully Public to maximise transparency. You can change your visibility settings at any time in Project Properties.
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
        <h5>Choose a license</h5>
        <p class="font-weight-light">Please choose a Creative Commons licence under which you would like to publish your work to the iSoQ database. The default is CC-BY-NC-ND. Read more about Creative Commons licenses <a href="https://creativecommons.org/about/cclicenses/" target="_blnak">here</a>.</p>
        <p class="font-weight-light">It is your responsibility to ensure that publishing your work to the iSoQ database does not violate any existing licencing agreement – e.g. with academic journals or funders.</p>
        <b-form-group>
          <b-form-radio-group
          id="modal-publish-license"
          v-model="modalProject.license_type"
          :options="global_licenses"
          @change="state.license_type = null"
          name="modal-radio-license"
          ></b-form-radio-group>
          <b-form-invalid-feedback :state="state.license_type">You must select a Creative Commons license.</b-form-invalid-feedback>
        </b-form-group>
      </template>

      <template #modal-footer>
        <div class="w-100">
          <b-button
            variant="outline-success"
            class="float-right ml-3"
            @click="savePublicStatus">
            <b-spinner small v-show="ui.publish.showLoader"></b-spinner>
            Save
          </b-button>
          <b-button
            v-show="!ui.publish.showLoader"
            variant="outline-secondary"
            class="float-right"
            @click="$refs['modal-change-status'].hide()">
            Close
          </b-button>
        </div>
      </template>
    </b-modal>
  </div>
</template>

<script>
import axios from 'axios'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, VerticalAlign, BorderStyle, PageOrientation, HeightRule, TableLayoutType } from 'docx'
import { displayExplanation } from '../utils/commons'
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
    videoHelp
  },
  data () {
    return {
      modalProject: {name: ''},
      global_status: [
        { value: 'private', text: 'Private - Your iSoQ is not publicly available on the iSoQ database' },
        { value: 'fully', text: 'Fully Public - Your iSoQ table, Evidence Profile, and GRADE-CERQual Worksheets are publicly available on the iSoQ database' },
        { value: 'partially', text: 'Partially Public - Your iSoQ table and Evidence Profile are publicly available on the iSoQ database' },
        { value: 'minimally', text: 'Minimally Public - Your iSoQ table is available on the iSoQ database' }
      ],
      global_licenses: [
        { value: 'CC-BY-NC-ND', text: 'CC BY-NC-ND: This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, for noncommercial purposes only, and only so long as attribution is given to the creator.' },
        { value: 'CC-BY-ND', text: 'CC BY-ND: This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, and only so long as attribution is given to the creator. The license allows for commercial use.' },
        { value: 'CC-BY-NC-SA', text: 'CC BY-NC-SA: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.' },
        { value: 'CC-BY-NC', text: 'CC BY-NC: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator.' },
        { value: 'CC-BY-SA', text: 'CC BY-SA: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.' },
        { value: 'CC-BY', text: 'CC BY: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use.' }
      ],
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
