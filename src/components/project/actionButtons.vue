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
                :variant="(!project.private) ? 'outline-primary' : 'primary'"
                block
                v-b-tooltip.hover title="Click here when you have finished your iSoQ to select what you would like published to the publicly available iSoQ database">
                <span v-if="!project.private">Published</span><span v-else>Publish</span>
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
      scrollable
      size="xl"
      ok-title="Save"
      ok-variant="outline-success"
      @ok="savePublicStatus"
      cancel-variant="outline-secondary">
      <template v-slot:modal-title>
        <videoHelp txt="Publish to the iSoQ Database" tag="none" urlId="504176899-1"></videoHelp>
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
            v-model="getLicense"
            :options="global_licenses"
            name="modal-radio-license"
          ></b-form-radio-group>
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
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, VerticalAlign, BorderStyle, PageOrientation } from 'docx'
const videoHelp = () => import(/* webpackChunkName: "videohelp" */ '../videoHelp')

export default {
  name: 'actionButtons',
  props: {
    mode: String,
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
    cerqualConfidence: Array
  },
  components: {
    videoHelp
  },
  data () {
    return {
      modalProject: {},
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
      ]
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
          new Table({
            borders: {
              top: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              bottom: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              left: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              right: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              insideHorizontal: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              insideVertical: {
                style: BorderStyle.NONE
              }
            },
            width: {
              size: '100%',
              type: WidthType.PERCENTAGE
            },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#DDDDDD'
                    },
                    width: {
                      size: '5%',
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
                      size: '40%',
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
                      size: '20%',
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
                      size: '20%',
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
                      size: '15%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
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
          })
        ]
      })

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
                style: BorderStyle.SINGLE
              },
              bottom: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              left: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              right: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              insideHorizontal: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              insideVertical: {
                style: BorderStyle.NONE
              }
            },
            width: {
              size: '100%',
              type: WidthType.PERCENTAGE
            },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#DDDDDD'
                    },
                    width: {
                      size: '5%',
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
                      size: '40%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
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
                      size: '10%',
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
                      size: '10%',
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
                      size: '10%',
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
                      size: '10%',
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
                      size: '10%',
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
                      size: '5%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
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
              ...this.generateEvidenceProfileTable2(this.lists)
            ]
          })
        ]
      })
      Packer.toBlob(doc).then(blob => {
        saveAs(blob, filename)
      })
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
      if (!Object.prototype.hasOwnProperty.call(this.project, 'license_type')) {
        this.modalProject.license_type = 'CC-BY-NC-ND'
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
    savePublicStatus: function (event) {
      event.preventDefault()
      // this.ui.publish.showLoader = true
      this.$emit('uiPublishShowLoader', true)
      let params = {}
      params.private = true
      params.is_public = false
      params.public_type = this.modalProject.public_type
      params.license_type = this.modalProject.license_type
      if (this.modalProject.public_type !== 'private') {
        params.private = false
        params.is_public = true
      } else {
        params.license_type = ''
      }

      let lists = JSON.parse(JSON.stringify(this.lists))
      let _requests = []
      for (let list of lists) {
        _requests.push(axios.patch(`/api/isoqf_lists/${list.id}`, params))
      }
      let findings = JSON.parse(JSON.stringify(this.findings))
      for (let index in findings) {
        _requests.push(axios.patch(`/api/isoqf_findings/${findings[index]}`, params))
        axios.get(`/api/isoqf_extracted_data?organization=${this.$route.params.org_id}&finding_id=${findings[index]}`)
          .then((response) => {
            if (response.data.length) {
              _requests.push(axios.patch(`/api/isoqf_extracted_data/${response.data[0].id}`, { is_public: params.is_public }))
            }
          })
      }

      let otherParams = {}
      otherParams.is_public = false
      if (this.modalProject.public_type !== 'private') {
        otherParams.is_public = true
      }

      let references = JSON.parse(JSON.stringify(this.references))
      for (let ref of references) {
        _requests.push(axios.patch(`/api/isoqf_references/${ref.id}`, otherParams))
      }
      let characteristicTable = JSON.parse(JSON.stringify(this.charsOfStudies))
      _requests.push(axios.patch(`/api/isoqf_characteristics/${characteristicTable.id}`, otherParams))
      let methodologicalTable = JSON.parse(JSON.stringify(this.methodologicalTableRefs))
      _requests.push(axios.patch(`/api/isoqf_assessments/${methodologicalTable.id}`, otherParams))

      axios.all(_requests)
        .then(axios.spread(() => {
          axios.patch(`/api/isoqf_projects/${this.project.id}`, params)
            .then(() => {
              this.modalProject = {}
              // this.getProject()
              this.$emit('getProject')
              // this.ui.publish.showLoader = false
              this.$emit('uiPublishShowLoader', false)
              this.$refs['modal-change-status'].hide()
            })
            .catch((error) => {
              this.printErrors(error)
            })
        }))
        .catch((error) => {
          this.printErrors(error)
        })
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
      const items = this.listsPrintVersion
      return items.map((item, index) => {
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
    generateEvidenceProfileTable2: function () {
      const items = this.listsPrintVersion
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
                    width_size: '5%', text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : index + 1, font_size: 22, align: AlignmentType.CENTER
                  }),
                  this.generateTableCell({
                    width_size: '40%', text: item.name, font_size: 22, align: AlignmentType.CENTER
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
                      explanation: (item.evidence_profile.methodological_limitations.option.length) ? item.evidence_profile.methodological_limitations.explanation : '',
                      font_size: 22,
                      align: AlignmentType.LEFT
                    }
                  ),
                  this.generateTableCell({
                    width_size: '10%',
                    text: this.displaySelectedOption(item.evidence_profile.coherence.option),
                    explanation: (item.evidence_profile.coherence.explanation.length) ? item.evidence_profile.coherence.explanation : '',
                    font_size: 22,
                    align: AlignmentType.CENTER
                  }),
                  this.generateTableCell({
                    width_size: '10%',
                    text: this.displaySelectedOption(item.evidence_profile.adequacy.option),
                    explanation: (item.evidence_profile.adequacy.explanation.length) ? item.evidence_profile.adequacy.explanation : '',
                    font_size: 22,
                    align: AlignmentType.LEFT
                  }),
                  this.generateTableCell({
                    width_size: '10%',
                    text: this.displaySelectedOption(item.evidence_profile.relevance.option),
                    explanation: (item.evidence_profile.relevance.explanation.length) ? item.evidence_profile.relevance.explanation : '',
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
                  width_size: '40%', text: item.name, font_size: 22, align: AlignmentType.LEFT
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
