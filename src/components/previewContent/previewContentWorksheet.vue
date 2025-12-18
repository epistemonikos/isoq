<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="py-5">
        <b-row>
          <b-col cols="12" class="text-right d-print-none">
            <b-link class="return" :to="{ name: 'previewContentSoQf', params: { org_id: project.organization, isoqf_id: project.id, token: $route.params.token }}">
              <font-awesome-icon icon="long-arrow-alt-left" :title="$t('back')" />
              return to ISoQ table
            </b-link>
          </b-col>
        </b-row>
        <h2 class="toDoc font-weight-bold pb-2">GRADE-CERQual Assessment Worksheet</h2>
      </b-container>
    </b-container>
    <b-container>
      <b-row
        class="d-print-none justify-content-end mb-2 pt-2">
        <b-col
          cols="12"
          sm="2">
            <b-button
              id="exportButton"
              variant="outline-secondary"
              block
              @click="exportToWord()">
              Export to MS-Word
            </b-button>
        </b-col>
        <b-col
          cols="12"
          sm="2">
            <b-button
              id="printButton"
              @click="print"
              variant="outline-info"
              block>
              Print or save as PDF
            </b-button>
        </b-col>
      </b-row>
      <b-row class="mt-4">
        <b-col cols="12">
          <evidence-profile
            :evidenceProfile="evidence_profile"
            :ui="ui"
            :evidenceProfileTableSettings="evidence_profile_table_settings"
            :references="references"
            mode="view"
            :list="list"
            :refsWithTitle="[]"
            :project="{}"
            :permission="true"
            :selectOptions="select_options"
            :levelConfidence="level_confidence"
            :findings="{}"
            :methAssessments="meth_assessments"
            :extractedData="extracted_data"
            :showEditExtractedDataInPlace="{}"
            :modalData="modalData()"
            :charsOfStudies="characteristics_studies"></evidence-profile>
          <div
            v-if="((project.public_type === 'fully' && $route.params.token === 'public') || $route.params.token === project.sharedToken)">
            <chars-of-studies
              :ui="ui"
              :show="show"
              :mode="'view'"
              :list="list"
              :permission="true"
              :charsOfStudies="characteristics_studies"
              :refsWithTitle="[]"
              ></chars-of-studies>
          </div>

          <div
            v-if="((project.public_type === 'fully' && $route.params.token === 'public') || $route.params.token === project.sharedToken)">
            <methodological-assessments
              :ui="ui"
              :show="show"
              :mode="'view'"
              :list="list"
              :permission="true"
              :methAssessments="meth_assessments"
              :refsWithTitle="[]"></methodological-assessments>
          </div>

          <div
            v-if="((project.public_type === 'fully' && $route.params.token === 'public') || $route.params.token === project.sharedToken)">
            <extracted-data
              :ui="ui"
              :show="show"
              :mode="'view'"
              :list="list"
              :permission="true"
              :extractedData="extracted_data"
              :modePrintFieldObject="mode_print_fieldsObj"
              :refsWithTitle="[]"></extracted-data>
          </div>
          <div v-if="list.is_public">
            <div class="mt-5 alert alert-info" role="alert">
              <h5>License type</h5>
              <p>{{ theLicense(list.license_type) }}</p>
            </div>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import backToTop from '../backToTop'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, VerticalAlign, BorderStyle, PageOrientation } from 'docx'
import evidenceProfile from '../list/editListEvidenceProfile.vue'
import charsOfStudies from '../list/editListCharsOfStudies.vue'
import methAssessments from '../list/editListMethAssessments.vue'
import extractedData from '../list/editListExtractedData.vue'
import Commons from '../../utils/commons'

export default {
  components: {
    'back-to-top': backToTop,
    'evidence-profile': evidenceProfile,
    'chars-of-studies': charsOfStudies,
    'methodological-assessments': methAssessments,
    'extracted-data': extractedData
  },
  data () {
    return {
      ui: {
        methodological_assessments: {
          display_warning: true
        },
        coherence: {
          display_warning: true
        },
        adequacy: {
          extracted_data: {
            display_warning: true
          },
          chars_of_studies: {
            display_warning: true
          }
        },
        relevance: {
          chars_of_studies: {
            display_warning: true
          }
        },
        showExample: false
      },
      project: {
        inclusion: '',
        exclusion: '',
        review_question: ''
      },
      list: {
        id: '',
        title: '',
        description: '',
        authors: '',
        private: false,
        sources: [],
        extracted_data: {
          fields: [],
          items: []
        },
        cerqual: { option: null },
        references: []
      },
      evidence_profile: [
        {
          isoqf_id: 0,
          cerqual: { explanation: '', option: 0 },
          name: '',
          title: '',
          notes: '',
          coherence: { explanation: '', option: 0 },
          methodological_limitations: { explanation: '', option: 0 },
          references: [],
          relevance: { explanation: '', option: 0 },
          adequacy: { explanation: '', option: 0 }
        }
      ],
      evidence_profile_fields_print_version: [
        { key: 'isoqf_id', label: '#' },
        { key: 'name', label: 'Summarised review finding' },
        { key: 'methodological-limit', label: 'Methodological limitations' },
        { key: 'coherence', label: 'Coherence' },
        { key: 'adequacy', label: 'Adequacy' },
        { key: 'relevance', label: 'Relevance' },
        { key: 'cerqual', label: 'GRADE-CERQual assessment of confidence' },
        {
          key: 'references',
          label: 'References',
          formatter: value => {
            let references = ''
            for (let item of value) {
              for (let reference of this.references) {
                if (item === reference.id) {
                  references = references.concat(reference.content)
                }
              }
            }
            return references
          }
        }
      ],
      evidence_profile_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100],
        isBusy: false
      },
      characteristics_studies: {
        fields: [],
        items: []
      },
      characteristics_studies_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100],
        last_column: 0
      },
      meth_assessments: {
        nroOfColumns: 1,
        fields: [],
        items: []
      },
      methodological_assessments_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100]
      },
      extracted_data: {
        id: null,
        fields: [],
        items: [],
        fieldsObj: []
      },
      extracted_data_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100]
      },
      show: {
        selected: ['cs', 'ma', 'ed'],
        options: [
          { text: 'Characteristics Studies', value: 'cs' },
          { text: 'Methodological Assessments', value: 'ma' },
          { text: 'Extracted Data', value: 'ed' }
        ]
      },
      references: [],
      mode_print_fieldsObj: [
        {
          key: 'authors',
          label: 'Author(s), Year'
        },
        {
          key: 'column_0',
          label: 'Extracted data supporting the review finding'
        }
      ],
      select_options: [
        { value: 0, text: 'No/Very minor concerns' },
        { value: 1, text: 'Minor concerns' },
        { value: 2, text: 'Moderate concerns' },
        { value: 3, text: 'Serious concerns' },
        { value: null, text: 'Undefined' }
      ],
      level_confidence: [
        { value: 0, text: 'High confidence' },
        { value: 1, text: 'Moderate confidence' },
        { value: 2, text: 'Low confidence' },
        { value: 3, text: 'Very low confidence' },
        { value: null, text: 'Undefined' }
      ]
    }
  },
  mounted () {
    this.getList()
  },
  methods: {
    modalData: function () {
      const data = {
        'methodological_limitations': {
          'option': null,
          'example': '',
          'explanation': '',
          'notes': '',
          'title': ''
        },
        'coherence': {
          'option': null,
          'example': '',
          'explanation': '',
          'notes': '',
          'title': ''
        },
        'adequacy': {
          'option': null,
          'example': '',
          'explanation': '',
          'notes': '',
          'title': ''
        },
        'relevance': {
          'option': null,
          'example': '',
          'explanation': '',
          'notes': '',
          'title': ''
        },
        'cerqual': {
          'option': null,
          'example': '',
          'explanation': '',
          'notes': '',
          'title': ''
        },
        'type': '',
        'title ': ''
      }
      return data
    },
    getList: function (fromModal = false) {
      axios.get(`/api/isoqf_lists/${this.$route.params.id}`)
        .then((response) => {
          this.list = JSON.parse(JSON.stringify(response.data))
          this.list.sources = []
          this.evidence_profile = []
          this.extracted_data = {
            fields: [],
            items: []
          }
          this.getProject(this.list.project_id)
          this.getAllReferences()
          this.getStageOneData(fromModal)
          this.getCharsOfStudies()
          this.getMethAssessments()
          this.evidence_profile_table_settings.isBusy = false
          window.scrollTo({ top: 0, behavior: 'smooth' })
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getProject: function (projectId) {
      axios.get(`/api/isoqf_projects/${projectId}`)
        .then((response) => {
          this.project = response.data
          if (this.project.sharedToken !== this.$route.params.token && this.project.public_type === 'private') {
            this.$router.push({ name: 'MainPage' })
          }
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getAllReferences: function () {
      axios.get(`/api/isoqf_references?organization=${this.list.organization}&project_id=${this.list.project_id}`)
        .then((response) => {
          let _references = response.data
          let _refs = []
          let _refsWithTitles = []
          for (let reference of _references) {
            _refs.push({'id': reference.id, 'content': this.parseReference(reference, true)})
            _refsWithTitles.push({'id': reference.id, 'content': this.parseReference(reference, false)})
          }

          this.references = _refs.sort((a, b) => a.content.localeCompare(b.content))
          this.refsWithTitle = _refsWithTitles.sort((a, b) => a.content.localeCompare(b.content))
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getStageOneData: function (fromModal = false) {
      let params = {
        organization: this.list.organization,
        list_id: this.list.id
      }
      axios.get('/api/isoqf_findings', {params})
        .then((response) => {
          if (response.data.length) {
            this.findings = JSON.parse(JSON.stringify(response.data[0]))
            this.evidence_profile = []
            if (Object.prototype.hasOwnProperty.call(this.findings, 'evidence_profile')) {
              this.evidence_profile.push(this.findings.evidence_profile)
            }
            if (fromModal) {
              const title = this.buffer_modal_stage_two.title
              const type = this.buffer_modal_stage_two.type
              this.buffer_modal_stage_two = this.evidence_profile[0]
              this.buffer_modal_stage_two.title = title
              this.buffer_modal_stage_two.type = type
            }
          }
          // this.getStatus()
          this.getExtractedData()
          this.evidence_profile_table_settings.isBusy = false
        }).catch((error) => {
          this.printErrors(error)
        })
    },
    getExtractedData: function () {
      let params = {
        organization: this.list.organization,
        finding_id: this.findings.id
      }

      axios.get('/api/isoqf_extracted_data', {params})
        .then((response) => {
          this.extracted_data = {id: null, fields: [], items: []}
          if (response.data.length) {
            this.extracted_data = response.data[0]
            this.extracted_data.fields.push({key: 'actions', label: ''})
            let _fields = JSON.parse(JSON.stringify(this.extracted_data.fields))
            this.extracted_data.fieldsObj = []
            for (let field of _fields) {
              if (field.key !== 'ref_id') {
                this.extracted_data.fieldsObj.push(field)
                if (field.key !== 'actions') {
                  this.mode_print_fieldsObj.push(field)
                }
              }
            }

            const _references = this.list.references
            let _items = []
            let extractedDataItems = JSON.parse(JSON.stringify(this.extracted_data.items))
            extractedDataItems.sort(function (a, b) {
              if (a.authors < b.authors) {
                return -1
              }
              if (a.authors > b.authors) {
                return 1
              }
              return 0
            })
            this.extracted_data.original_items = extractedDataItems
            let haveContent = 0
            for (let reference of _references) {
              let index = 0
              for (let item of extractedDataItems) {
                if (item.ref_id === reference) {
                  _items.push({ ref_id: item.ref_id, authors: item.authors, column_0: item.column_0, index: index })
                  for (let i in item) {
                    if (item[i] !== 'ref_id' && item[i] !== 'authors') {
                      if (item[i] === '') {
                        haveContent++
                      }
                    }
                  }
                }
                index++
              }
            }

            this.ui.coherence.display_warning = true
            this.ui.adequacy.extracted_data.display_warning = true
            if (!haveContent) {
              this.ui.coherence.display_warning = false
              this.ui.adequacy.extracted_data.display_warning = false
            }
            this.extracted_data.items = _items
          }
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getCharsOfStudies: function () {
      let params = {
        organization: this.list.organization,
        project_id: this.list.project_id
      }
      axios.get('/api/isoqf_characteristics', {params})
        .then((response) => {
          if (response.data.length) {
            let data = response.data[0]
            let items = []

            let haveContent = 0
            for (let item of data.items) {
              for (let reference of this.list.references) {
                if (reference === item.ref_id) {
                  items.push(item)
                  for (let i in item) {
                    if (item[i] !== 'ref_id' && item[i] !== 'authors') {
                      if (item[i] === '') {
                        haveContent++
                      }
                    }
                  }
                  if (data.fields.length > Object.keys(item).length) {
                    haveContent++
                  }
                }
              }
            }
            if (data.fields.length < 3) {
              haveContent++
            }

            this.ui.adequacy.chars_of_studies.display_warning = true
            this.ui.relevance.chars_of_studies.display_warning = true
            if (!haveContent) {
              this.ui.adequacy.chars_of_studies.display_warning = false
              this.ui.relevance.chars_of_studies.display_warning = false
            }
            data.items = items
            this.characteristics_studies = data
            if (data.fields.length) {
              let fields = JSON.parse(JSON.stringify(data.fields))
              let lastItem = fields.splice(fields.length - 1, 1)
              this.characteristics_studies.last_column = lastItem[0].key.split('_')[1]
              this.characteristics_studies.fieldsObj = []
              let _fields = data.fields
              for (let field of _fields) {
                if (field.key !== 'ref_id') {
                  this.characteristics_studies.fieldsObj.push(field)
                }
              }
              if (!Object.prototype.hasOwnProperty.call(this.characteristics_studies, 'items')) {
                this.characteristics_studies.items = []
              }
            }
            this.buffer_characteristics_studies = JSON.parse(JSON.stringify(this.characteristics_studies))
            this.buffer_characteristics_studies.fields.splice(this.buffer_characteristics_studies.fields.length - 1, 1)

            let tableTop = []

            if (Object.prototype.hasOwnProperty.call(this.characteristics_studies, 'mainFields')) {
              const _tableTop = JSON.parse(JSON.stringify(this.characteristics_studies.mainFields))
              for (let tt of _tableTop) {
                tableTop.push({ 'label': tt.label, 'colspan': tt.fields.length })
              }
            }
            this.characteristics_studies.tableTop = tableTop
          } else {
            this.characteristics_studies = {
              items: [],
              fields: []
            }
          }
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getMethAssessments: function () {
      let params = {
        organization: this.list.organization,
        project_id: this.list.project_id
      }
      axios.get('/api/isoqf_assessments', {params})
        .then((response) => {
          if (response.data.length) {
            const _references = JSON.parse(JSON.stringify(this.list.references))
            let data = response.data[0]
            let items = []

            let haveContent = 0
            for (let item of data.items) {
              for (let reference of _references) {
                if (reference === item.ref_id) {
                  items.push(item)
                  for (let i in item) {
                    if (item[i] !== 'author' && item[i] !== 'ref_id') {
                      if (item[i] === '') {
                        haveContent++
                      }
                    }
                  }
                  if (data.fields.length > Object.keys(item).length) {
                    haveContent++
                  }
                }
              }
            }
            if (data.fields.length < 3) {
              haveContent++
            }
            this.ui.methodological_assessments.display_warning = true
            if (!haveContent) {
              this.ui.methodological_assessments.display_warning = false
            }

            data.items = items

            let _fields = data.fields
            data.fieldsObj = []
            for (let field of _fields) {
              if (field.key !== 'ref_id') {
                data.fieldsObj.push(field)
              }
            }

            this.meth_assessments = data
          } else {
            this.meth_assessments = { nroOfColumns: 1, fields: [], items: [] }
          }
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    displaySelectedOption: function (option) {
      if (option === null) {
        return ''
      } else if (option >= 0) {
        return this.select_options[option].text
      } else {
        return ''
      }
    },
    displayLevelConfidence: function (option) {
      if (option !== null) {
        return this.level_confidence[option].text
      }
      return ''
    },
    parseReference: (reference, onlyAuthors = false, hasSemicolon = true) => {
      let result = ''
      const semicolon = hasSemicolon ? '; ' : ''
      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        if (reference.authors.length < 1) {
          result = 'no autho(s)'
        } else if (reference.authors.length === 1) {
          result = reference.authors[0].split(',')[0] + ' ' + reference.publication_year + semicolon
        } else if (reference.authors.length === 2) {
          result = reference.authors[0].split(',')[0] + ' & ' + reference.authors[1].split(',')[0] + ' ' + reference.publication_year + semicolon
        } else {
          result = reference.authors[0].split(',')[0] + ' et al. ' + reference.publication_year + semicolon
        }
        if (!onlyAuthors) {
          result = result + reference.title
        }
        return result
      } else {
        return result
      }
    },
    print: function () {
      window.print()
    },
    printErrors: function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data)
        console.log(error.response.status)
        console.log(error.response.headers)
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request)
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message)
      }
      console.log(error.config)
    },
    exportToWord: function () {
      const filename = (this.project.name + ' - GRADE-CERQual Assessment Worksheet' || 'GRADE-CERQual Assessment Worksheet') + '.doc'
      const doc = new Document()

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
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: this.project.name,
                size: 24,
                font: { name: 'Times New Roman' },
                color: '000000'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: 'GRADE-CERQual Assessment Worksheet',
                bold: true,
                size: 28,
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
                children: [
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '2%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '#',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '28%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Summarized Review Finding',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '12%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Methodological limitations',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '12%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Coherence',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '12%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Adequacy',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '12%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Relevance',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '12%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'GRADE-CERQual assessment of confidence',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '10%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'References',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.evidence_profile[0].isoqf_id,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.evidence_profile[0].name,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.displaySelectedOption(this.evidence_profile[0].methodological_limitations.option),
                            bold: true,
                            size: 22
                          })
                        ]
                      }),
                      new Paragraph(''),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (this.evidence_profile[0].methodological_limitations.explanation.length) ? this.evidence_profile[0].methodological_limitations.explanation : '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.displaySelectedOption(this.evidence_profile[0].coherence.option),
                            bold: true,
                            size: 22
                          })
                        ]
                      }),
                      new Paragraph(''),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (this.evidence_profile[0].coherence.explanation.length) ? this.evidence_profile[0].coherence.explanation : '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.displaySelectedOption(this.evidence_profile[0].adequacy.option),
                            bold: true,
                            size: 22
                          })
                        ]
                      }),
                      new Paragraph(''),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (this.evidence_profile[0].adequacy.explanation.length) ? this.evidence_profile[0].adequacy.explanation : '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.displaySelectedOption(this.evidence_profile[0].relevance.option),
                            bold: true,
                            size: 22
                          })
                        ]
                      }),
                      new Paragraph(''),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (this.evidence_profile[0].relevance.explanation.length) ? this.evidence_profile[0].relevance.explanation : '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.displayLevelConfidence(this.evidence_profile[0].cerqual.option),
                            bold: true,
                            size: 22
                          })
                        ]
                      }),
                      new Paragraph(''),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (this.evidence_profile[0].cerqual.explanation.length) ? this.evidence_profile[0].cerqual.explanation : '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      ...this.generateReferences()
                    ]
                  })
                ]
              })
            ]
          }),
          ...this.showOtherTables(
            this.project.public_type,
            this.characteristics_studies,
            this.meth_assessments,
            this.extracted_data
          )
        ]
      })

      Packer.toBlob(doc).then(blob => {
        saveAs(blob, filename)
      })
    },
    showOtherTables: function (publicType, charsOfStudies, methAssessments, extractedData) {
      let content = []
      if (publicType === 'fully') {
        content.push(new Paragraph(''))
        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Characteristics of Studies',
                size: 24,
                bold: true
              })
            ]
          })
        )
        content.push(
          this.generateTable(JSON.parse(JSON.stringify(charsOfStudies)))
        )
        content.push(new Paragraph(''))
        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Methodological Assessments',
                size: 24,
                bold: true
              })
            ]
          })
        )
        content.push(
          this.generateTable(JSON.parse(JSON.stringify(methAssessments)))
        )
        content.push(new Paragraph(''))
        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Extracted Data',
                size: 24,
                bold: true
              })
            ]
          })
        )
        content.push(
          this.generateTable(JSON.parse(JSON.stringify(extractedData)))
        )
      }
      return content
    },
    generateReferences: function () {
      const allReferences = JSON.parse(JSON.stringify(this.references))
      const listReferences = JSON.parse(JSON.stringify(this.list.references))
      let epReferences = []
      for (let reference of allReferences) {
        if (listReferences.indexOf(reference.id) !== -1) {
          epReferences.push(reference.content)
        }
      }
      let arr = []
      for (let epr of epReferences) {
        arr.push(new Paragraph({
          children: [
            new TextRun({
              text: epr,
              size: 16
            })
          ]
        })
        )
      }
      return arr
    },
    generateTable: function (data) {
      return new Table({
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
          this.generateHeaderRow(JSON.parse(JSON.stringify(data.fields))),
          ...this.generateBodyRow(JSON.parse(JSON.stringify(data.items)))
        ]
      })
    },
    generateHeaderRow: function (data) {
      return new TableRow({
        tableHeader: true,
        children: [
          ...this.generateCell(data)
        ]
      })
    },
    generateBodyRow: function (data) {
      return data.map((item) => {
        return new TableRow({
          children: [
            ...this.prepareBodyCell(item)
          ]
        })
      })
    },
    generateCell: function (data) {
      let headers = []
      for (let d of data) {
        if (d.key !== 'ref_id' && d.key !== 'actions') {
          headers.push(d)
        }
      }
      const length = headers.length
      const size = 100 / length
      return headers.map((content) => {
        return new TableCell({
          verticalAlign: VerticalAlign.CENTER,
          width: {
            size: size.toString() + '%',
            type: WidthType.PERCENTAGE
          },
          children: [
            this.generateParagraph(content, true)
          ]
        })
      })
    },
    prepareBodyCell: function (data) {
      if (Object.prototype.hasOwnProperty.call(data, 'index')) {
        delete data.index
      }
      let arr = []
      const keys = Object.keys(data)
      let numbers = []
      for (let key of keys) {
        if (key !== 'ref_id' && key !== 'authors') {
          const newKey = parseInt(key.split('_')[1])
          numbers.push(newKey)
        }
      }
      const len = numbers.sort((a, b) => { return a - b }).slice(-1)[0]
      if (len !== undefined) {
        if (len) {
          arr.push(this.generateBodyCell(data.authors, true, 20))
          for (var cnt = 0; cnt <= len; cnt++) {
            if (Object.prototype.hasOwnProperty.call(data, 'column_' + cnt.toString())) {
              arr.push(this.generateBodyCell(data['column_' + cnt.toString()], false, 20))
            }
          }
        } else {
          arr.push(this.generateBodyCell(data.authors, true, 20))
          arr.push(this.generateBodyCell(data['column_0'], false, 20))
        }
      } else {
        arr.push(this.generateBodyCell(data.authors, true, 20))
        arr.push(this.generateBodyCell(' ', false, 20))
      }
      return arr
    },
    generateBodyCell: function (data, isBold, size) {
      return new TableCell({
        children: [
          this.generateParagraph(data, isBold, size)
        ]
      })
    },
    generateParagraph: function (data, isBold, size) {
      return new Paragraph({
        children: [
          this.generateText(data, isBold, size)
        ]
      })
    },
    generateText: function (data, isBold = false, size = 20) {
      if (Object.prototype.hasOwnProperty.call(data, 'label')) {
        return new TextRun({
          text: data.label,
          bold: isBold,
          size: size
        })
      } else {
        return new TextRun({
          text: data,
          bold: isBold,
          size: size
        })
      }
    },
    theLicense: function (license) {
      return Commons.theLicense(license)
    }
  }
}
</script>
