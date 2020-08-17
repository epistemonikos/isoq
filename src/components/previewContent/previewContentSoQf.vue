<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="pt-5">
        <b-row align-h="end">
          <b-col
            cols="12"
            md="11" class="toDoc">
            <h2 id="project-title">{{ project.name }}</h2>
          </b-col>
          <b-col
            cols="12"
            md="1"
            class="text-right">
            <b-link class="d-print-none" :to="{ name: 'MainPage' }">
              <font-awesome-icon icon="long-arrow-alt-left" v-bind:title="$t('back')" />
              {{ $t('back') }}
            </b-link>
          </b-col>
        </b-row>
        <b-nav id="tabsTitle" tabs fill class="pt-5">
          <b-nav-item
            :active="(tabOpened === 0) ? true : false"
            @click="tabOpened=0">Project properties</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 1) ? true : false"
            @click="tabOpened=1">My Data</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 2) ? true : false"
            @click="tabOpened=2">iSoQf</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 3) ? true : false"
            @click="tabOpened=3">Guidance on applying GRADE-CERQual</b-nav-item>
        </b-nav>
      </b-container>
    </b-container>
    <b-container class="mb-5">
      <b-tabs
        id="tabsContent"
        content-class="mt-3"
        fill
        v-model="tabOpened">
        <b-tab>
          <b-row>
            <b-col
              cols="12"
              class="mb-2">
              <h2>Project properties</h2>
            </b-col>
          </b-row>
          <b-row>
            <b-col
              cols="12">
              <organizationForm
                :formData="project"
                :canWrite="false">
              </organizationForm>
            </b-col>
          </b-row>
          <back-to-top></back-to-top>
        </b-tab>
        <b-tab>
          <h4 class="mt-5">
            Study inclusion and exclusion criteria used in the review
          </h4>
          <b-container>
            <b-row>
              <b-col
                cols="12"
                md="6"
                class="pl-0">
                <criteria
                  v-if="ui.project.show_criteria"
                  label="Inclusion criteria"
                  description="Please enter the study inclusion criteria used in the review"
                  :isDisabled="true"
                  criteria="inclusion"
                  :dataTxt="project.inclusion">
                </criteria>
              </b-col>
              <b-col
                cols="12"
                md="6"
                class="pr-0">
                <criteria
                  v-if="ui.project.show_criteria"
                  label="Exclusion criteria"
                  description="Please enter the study exclusion criteria used in the review"
                  :isDisabled="true"
                  criteria="exclusion"
                  :dataTxt="project.exclusion">
                </criteria>
              </b-col>
            </b-row>
          </b-container>
          <div>
            <chars-of-studies-table
              v-if="charsOfStudies.fields.length"
              :tableData="charsOfStudies"
              :tableSettings="charsOfStudiesTableSettings">
            </chars-of-studies-table>
          </div>
          <back-to-top></back-to-top>
          <div>
            <meth-assessments-table
              v-if="methodologicalTableRefs.fieldsObj.length > 1"
              :tableData="methodologicalTableRefs"
              :tableSettings="methodologicalTableRefsTableSettings"></meth-assessments-table>
          </div>
          <back-to-top></back-to-top>
        </b-tab>
        <b-tab>
          <h2>Summary of Qualitative Findings Table</h2>
          <b-card header-tag="header">
            <template v-slot:header>
              <b-container fluid>
                <b-row v-b-toggle.info-project>
                  <b-col
                    cols="12">
                    <p
                    class="mb-0 text-left"
                    >{{ project.name }}</p>
                  </b-col>
                </b-row>
              </b-container>
            </template>
            <div id="info-project">
              <b-row>
                <b-col cols="12" md="8" class="toDoc">
                  <h5>Review question</h5>
                  <p>{{project.review_question}}</p>

                  <h5>Has the review been published?</h5>
                  <p>{{(project.published_status) ? 'Yes': 'No'}} <span v-if="project.published_status">| DOI: <b-link :href="project.url_doi" target="_blank">{{ project.url_doi }}</b-link></span></p>

                  <h5 v-if="project.description">Additional Information</h5>
                  <p v-if="project.description">{{project.description}}</p>
                </b-col>
                <b-col cols="12" md="4" class="toDoc">
                  <h5 v-if="Object.prototype.hasOwnProperty.call(project, 'authors')">Authors of the review</h5>
                  <ul v-if="Object.prototype.hasOwnProperty.call(project, 'authors')">
                    <li v-for="(author, index) in project.authors.split(',')" :key="index">{{ author.trim() }}</li>
                  </ul>

                  <h5>Corresponding author</h5>
                  <p v-if="project.author">{{ project.author }} <span v-if="project.author_email"><br />{{ project.author_email }}</span></p>

                  <h5 v-if="!project.complete_by_author">Is the iSoQ being completed by the review authors?</h5>
                  <p v-if="!project.complete_by_author">{{(project.complete_by_author) ? 'Yes' : 'No'}}</p>
                </b-col>
              </b-row>
            </div>
          </b-card>
          <div class="mt-3">
            <table-printing-findings
              v-if="lists.length"
              :data="lists">
            </table-printing-findings>
          </div>
          <back-to-top></back-to-top>
        </b-tab>
        <b-tab>
          <content-guidance></content-guidance>
          <back-to-top></back-to-top>
        </b-tab>
      </b-tabs>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import contentGuidance from '../contentGuidance'
import organizationForm from '../organization/organizationForm'
import Criteria from '../Criteria'
import tablePrintFindings from '../project/tablePrintFindings'
import charsOfStudiesDisplayDataTable from '../charsOfStudies/displayTableData'
import methAssessmentsDisplayDataTable from '../methAssessments/displayTableData'
import backToTop from '../backToTop'

export default {
  components: {
    'content-guidance': contentGuidance,
    organizationForm,
    'criteria': Criteria,
    'table-printing-findings': tablePrintFindings,
    'chars-of-studies-table': charsOfStudiesDisplayDataTable,
    'meth-assessments-table': methAssessmentsDisplayDataTable,
    'back-to-top': backToTop
  },
  data () {
    return {
      tabOpened: 2,
      ui: {
        project: {
          show_criteria: false
        }
      },
      project: {
        name: ''
      },
      lists: [],
      list_categories: {
        options: [],
        selected: null
      },
      references: [],
      cerqual_confidence: [
        { value: 0, text: 'High confidence' },
        { value: 1, text: 'Moderate confidence' },
        { value: 2, text: 'Low confidence' },
        { value: 3, text: 'Very low confidence' }
      ],
      table_settings: {
        isBusy: true,
        currentPage: 1,
        perPage: 5,
        filter: null,
        totalRows: 1,
        filterOn: ['isoqf_id', 'name', 'cerqual_option', 'cerqual_explanation', 'ref_list', 'category_name', 'status', 'explanation']
      },
      charsOfStudies: {
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      },
      charsOfStudiesTableSettings: {
        currentPage: 1,
        perPage: 10,
        isBusy: false
      },
      charsOfStudiesFieldsModal: {
        nroColumns: 1,
        fields: [],
        items: [],
        selected_item_index: 0
      },
      methodologicalTableRefs: {
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      },
      methodologicalTableRefsTableSettings: {
        currentPage: 1,
        perPage: 10,
        isBusy: false
      }
    }
  },
  mounted () {
    this.getProject()
    this.getListCategories()
    this.getReferences()
  },
  methods: {
    getProject: function () {
      const params = {
        organization: this.$route.params.org_id
      }
      axios.get(`/api/isoqf_projects/${this.$route.params.isoqf_id}`, { params })
        .then((response) => {
          this.project = response.data
          if (this.project.sharedToken === this.$route.params.token || this.project.is_public) {
            if (!Object.prototype.hasOwnProperty.call(this.project, 'inclusion')) {
              this.project.inclusion = ''
            }
            if (!Object.prototype.hasOwnProperty.call(this.project, 'exclusion')) {
              this.project.exclusion = ''
            }
            this.ui.project.show_criteria = true
            this.getLists() // summary review
            this.getCharacteristics()
            this.getMethodological()
          } else {
            this.$router.push({ name: 'MainPage' })
          }
        })
        .catch((error) => {
          console.log(error)
          // this.printErrors(error)
        })
    },
    getLists: function () { // related to summary review of a finding
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.isoqf_id
      }
      axios.get('/api/isoqf_lists', { params })
        .then((response) => {
          let data = JSON.parse(JSON.stringify(response.data))
          data.sort(function (a, b) {
            if (a.sort < b.sort) { return -1 }
            if (a.sort > b.sort) { return 1 }
            return 0
          })
          let cnt = 1
          for (let d of data) {
            d.sort = cnt
            d.isoqf_id = cnt
            cnt++
          }
          let _data = data

          if (_data.length) {
            // let lists = JSON.parse(JSON.stringify(this.lists))
            for (let list of _data) {
              if (!Object.prototype.hasOwnProperty.call(list, 'evidence_profile')) {
                list.status = 'unfinished'
                list.explanation = 'without_explanation'
              } else {
                list.status = 'completed'
                list.explanation = 'with_explanation'
                if (list.evidence_profile.cerqual.option === null) {
                  list.status = 'unfinished'
                }
                if (list.evidence_profile.cerqual.explanation === '') {
                  list.explanation = 'without_explanation'
                }
              }
              if (!Object.prototype.hasOwnProperty.call(list, 'references')) {
                list.references = []
              }
              if (!Object.prototype.hasOwnProperty.call(list, 'notes')) {
                list.notes = ''
              }
              if (!Object.prototype.hasOwnProperty.call(list, 'category')) {
                list.category = null
              } else {
                list.category_name = ''
                list.category_extra_info = ''
                if (this.list_categories.options.length) {
                  for (let category of this.list_categories.options) {
                    if (list.category === category.value) {
                      list.category_name = category.text
                      list.category_extra_info = category.extra_info
                    }
                  }
                }
              }
              list.cerqual_option = ''
              if (list.cerqual.option != null) {
                list.cerqual_option = this.cerqual_confidence[list.cerqual.option].text
              }
              list.cerqual_explanation = list.cerqual.explanation
              list.ref_list = ''
              list.raw_ref = []
              for (let r of this.references) {
                for (let ref of list.references) {
                  if (ref === r.id) {
                    list.ref_list = list.ref_list + this.parseReference(r, true)
                    list.raw_ref.push(r)
                  }
                }
              }
            }

            if (this.list_categories.options.length) {
              let categories = []
              for (let category of this.list_categories.options) {
                categories.push({'name': category.text, 'value': category.value, 'items': []})
              }

              for (let list of _data) {
                if (categories.length) {
                  for (let element of categories) {
                    if (element.value === list.category) {
                      element.items.push(
                        {
                          'id': list.id,
                          'isoqf_id': list.isoqf_id,
                          'name': list.name,
                          'cerqual_option': list.cerqual_option,
                          'cerqual_explanation': list.cerqual_explanation,
                          'ref_list': list.ref_list,
                          'sort': list.sort,
                          'notes': list.notes
                        }
                      )
                    }
                  }
                }
              }
              let newArr = []
              for (let cat of categories) {
                newArr.push({'is_category': true, 'name': cat.name})
                for (let item of cat.items) {
                  newArr.push(item)
                }
              }
              newArr.sort(function (a, b) {
                if (a.sort < b.sort) {
                  return -1
                }
                if (a.sort > b.sort) {
                  return 1
                }
                return 0
              })
              this.lists = newArr
            } else {
              let items = []
              for (let list of _data) {
                items.push(
                  {
                    'id': list.id,
                    'isoqf_id': list.isoqf_id,
                    'name': list.name,
                    'cerqual_option': list.cerqual_option,
                    'cerqual_explanation': list.cerqual_explanation,
                    'ref_list': list.ref_list,
                    'sort': list.sort,
                    'notes': list.notes
                  }
                )
              }
              items.sort(function (a, b) {
                if (a.sort < b.sort) {
                  return -1
                }
                if (a.sort > b.sort) {
                  return 1
                }
                return 0
              })
              this.lists = items
            }
          }
          this.table_settings.isBusy = false
          this.table_settings.totalRows = _data.length
        })
        .catch((error) => {
          console.log(error)
          // this.printErrors(error)
        })
    },
    getListCategories: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.isoqf_id
      }
      axios.get('/api/isoqf_list_categories/', { params })
        .then((response) => {
          if (response.data.length) {
            const options = JSON.parse(JSON.stringify(response.data[0].options))
            this.list_categories.options = options
          }
        })
        .catch((error) => {
          console.log(error)
          // this.printErrors(error)
        })
    },
    getReferences: function (changeTab = true) {
      axios.get(`/api/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.isoqf_id}`)
        .then((response) => {
          const data = JSON.parse(JSON.stringify(response.data))
          this.references = data
        })
        .catch((error) => {
          console.log(error)
          // this.printErrors(error)
        })
    },
    parseReference: (reference, onlyAuthors = false, hasSemicolon = true) => {
      let result = ''
      const semicolon = hasSemicolon ? '; ' : ''
      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        if (reference.authors.length) {
          if (reference.authors.length === 1) {
            result = reference.authors[0].split(',')[0] + ' ' + reference.publication_year + semicolon
          } else if (reference.authors.length === 2) {
            result = reference.authors[0].split(',')[0] + ' & ' + reference.authors[1].split(',')[0] + ' ' + reference.publication_year + semicolon
          } else {
            result = reference.authors[0].split(',')[0] + ' et al. ' + reference.publication_year + semicolon
          }
          if (!onlyAuthors) {
            result = result + reference.title
          }
        } else {
          return 'author(s) not found'
        }
      }
      return result
    },
    getCharacteristics: function () {
      this.charsOfStudiesTableSettings.isBusy = true
      axios.get(`/api/isoqf_characteristics?organization=${this.$route.params.org_id}&project_id=${this.$route.params.isoqf_id}`)
        .then((response) => {
          if (response.data.length) {
            this.charsOfStudies = JSON.parse(JSON.stringify(response.data[0]))
            if (Object.prototype.hasOwnProperty.call(this.charsOfStudies, 'fields')) {
              this.charsOfStudies.fieldsObj = [{ 'key': 'authors', 'label': 'Author(s), Year' }]

              const fields = JSON.parse(JSON.stringify(this.charsOfStudies.fields))
              const items = JSON.parse(JSON.stringify(this.charsOfStudies.items))

              const _items = items.sort((a, b) => a.authors.localeCompare(b.authors))
              this.charsOfStudies.items = _items

              this.charsOfStudiesFieldsModal.fields = []
              for (let f of fields) {
                if (f.key !== 'ref_id' && f.key !== 'authors' && f.key !== 'actions') {
                  this.charsOfStudiesFieldsModal.fields.push(f.label)
                  this.charsOfStudies.fieldsObj.push({ key: f.key, label: f.label })
                }
              }

              this.charsOfStudies.fieldsObj.push({'key': 'actions', 'label': ''})

              this.charsOfStudiesFieldsModal.nroColumns = (this.charsOfStudies.fieldsObj.length === 2) ? 1 : this.charsOfStudies.fieldsObj.length - 2

              for (let item of _items) {
                this.charsOfStudiesFieldsModal.items.push(item)
              }
            }
            this.charsOfStudiesTableSettings.isBusy = false
          } else {
            this.charsOfStudies = { fields: [], items: [], authors: '', fieldsObj: [ { key: 'authors', label: 'Author(s), Year' } ] }
          }
        })
    },
    getMethodological: function () {
      this.methodologicalTableRefsTableSettings.isBusy = true
      axios.get(`/api/isoqf_assessments?organization=${this.$route.params.org_id}&project_id=${this.$route.params.isoqf_id}`)
        .then((response) => {
          if (response.data.length) {
            this.methodologicalTableRefs = JSON.parse(JSON.stringify(response.data[0]))
            if (Object.prototype.hasOwnProperty.call(this.methodologicalTableRefs, 'fields')) {
              const fields = JSON.parse(JSON.stringify(this.methodologicalTableRefs.fields))
              const items = JSON.parse(JSON.stringify(this.methodologicalTableRefs.items))

              const _items = items.sort((a, b) => a.authors.localeCompare(b.authors))
              this.methodologicalTableRefs.items = _items

              this.methodologicalTableRefs.fieldsObj = [{ 'key': 'authors', 'label': 'Author(s), Year' }]
              // this.methodologicalFieldsModal.fields = []

              for (let f of fields) {
                if (f.key !== 'ref_id' && f.key !== 'authors' && f.key !== 'actions') {
                  // this.methodologicalFieldsModal.fields.push(f.label)
                  this.methodologicalTableRefs.fieldsObj.push({ key: f.key, label: f.label })
                }
              }
              this.methodologicalTableRefs.fieldsObj.push({'key': 'actions', 'label': ''})

              // this.methodologicalFieldsModal.nroColumns = (this.methodologicalTableRefs.fieldsObj.length === 2) ? 1 : this.methodologicalTableRefs.fieldsObj.length - 2

              // for (let item of _items) {
              //   this.methodologicalFieldsModal.items.push(item)
              // }

              this.methodologicalTableRefsTableSettings.isBusy = false
            }
          } else {
            this.methodologicalTableRefs = { fields: [], items: [], authors: '', fieldsObj: [ { key: 'authors', label: 'Author(s), Year' } ] }
          }
        })
    }
  }
}
</script>

<style scoped>
  div >>>
    #tabsContent .nav-link {
      display: none;
      padding: 0;
    }
    #tabsContent ul {
      border-bottom: 0px;
    }
    #tabsTitle {
      border-bottom: 1px solid #bbb;
    }
    #tabsTitle a {
      color: #3d3d3d;
    }
    #tabsTitle li:first-child,
    #tabsTitle li:last-child {
      margin-left: 0px;
      margin-right: 0px;
    }
    #tabsTitle li {
      border-top: 2px;
      border-left: 2px;
      border-right: 2px;
      border-color: #bbb;
      border-style: solid;
      border-bottom: 0px;
      margin-left: 5px;
      margin-right: 5px;
    }
</style>
