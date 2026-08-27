<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="pt-3">
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
            <b-link class="d-print-none" :to="($route.params.token === 'public') ? { name: 'Browse' } : { name: 'MainPage' }">
              <font-awesome-icon icon="long-arrow-alt-left" v-bind:title="$t('common.back')" />
              {{ $t('common.back') }}
            </b-link>
          </b-col>
        </b-row>
        <b-nav id="tabsTitle" tabs fill class="pt-lg-3 pt-5 d-print-none">
          <b-nav-item
            :active="(tabOpened === 0) ? true : false"
            @click="tabOpened=0">{{ $t('project.properties') }}</b-nav-item>
          <!-- <b-nav-item
            disabled
            :active="(tabOpened === 1) ? true : false"
            @click="tabOpened=1">My Data</b-nav-item> -->
          <b-nav-item
            :active="(tabOpened === 2) ? true : false"
            @click="tabOpened=2">iSoQ</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 3) ? true : false"
            @click="tabOpened=3">{{ $t('project.guidance_applying') }}</b-nav-item>
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
              <h2>{{ $t('project.properties') }}</h2>
            </b-col>
          </b-row>
          <b-row>
            <b-col
              cols="12">
              <organizationForm
                :formData="project"
                :canEdit="false">
              </organizationForm>
            </b-col>
          </b-row>
          <back-to-top></back-to-top>
        </b-tab>
        <b-tab>
          <h4 class="mt-5">
            {{ $t('project.inclusion_exclusion') }}
          </h4>
          <b-container>
            <b-row>
              <b-col
                cols="12"
                md="6"
                class="pl-0">
                <criteria
                  v-if="ui.project.show_criteria"
                  :label="$t('inclusion.inclusion_criteria')"
                  :description="$t('inclusion.inclusion_placeholder')"
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
                  :label="$t('inclusion.exclusion_criteria')"
                  :description="$t('inclusion.exclusion_placeholder')"
                  :isDisabled="true"
                  criteria="exclusion"
                  :dataTxt="project.exclusion">
                </criteria>
              </b-col>
            </b-row>
          </b-container>
          <div>
            <camelot-characteristics-table-preview
              v-if="project.use_camelot && charsOfStudies.fields && charsOfStudies.fields.length"
              :charsOfStudies="charsOfStudiesRows"
              :references="references">
            </camelot-characteristics-table-preview>
            <chars-of-studies-table
              v-else-if="!project.use_camelot && charsOfStudies.fields && charsOfStudies.fields.length"
              :tableData="charsOfStudiesRows"
              :tableSettings="charsOfStudiesTableSettings">
            </chars-of-studies-table>
          </div>
          <back-to-top></back-to-top>
          <div>
            <camelot-assessments-table-preview
              v-if="project.use_camelot && methodologicalTableRefs.items && methodologicalTableRefs.items.length"
              :methodologicalTableRefs="methodologicalRows"
              :references="references">
            </camelot-assessments-table-preview>
            <meth-assessments-table
              v-else-if="!project.use_camelot && methodologicalTableRefs.fieldsObj && methodologicalTableRefs.fieldsObj.length > 1"
              :tableData="methodologicalRows"
              :tableSettings="methodologicalTableRefsTableSettings"></meth-assessments-table>
          </div>
          <back-to-top></back-to-top>
        </b-tab>
        <b-tab>
          <b-container fluid>
            <action-buttons
              :mode="'view'"
              :preview="true"
              :project="project"
              :canWrite="true"
              :ui="ui"
              :lists="lists"
              :findings="findings"
              :references="references"
              :charsOfStudies="charsOfStudies"
              :methodologicalTableRefs="methodologicalTableRefs"
              :listsPrintVersion="lists_print_version"
              :selectOptions="select_options"
              :cerqualConfidence="cerqual_confidence"
              :printableItems="printableItems"></action-buttons>
          </b-container>
          <h2>{{ $t('publish.soqf_table_title') }}</h2>
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
                  <h5>{{ $t('project.review_question') }}</h5>
                  <p>{{project.review_question}}</p>

                  <h5>{{ $t('publish.review_published') }}</h5>
                  <p>{{(project.published_status) ? $t('yes_no.yes') : $t('yes_no.no')}} <span v-if="project.published_status">| DOI: <b-link :href="project.url_doi" target="_blank">{{ project.url_doi }}</b-link></span></p>

                  <h5 v-if="project.description">{{ $t('project.additional_info') }}</h5>
                  <p v-if="project.description">{{project.description}}</p>
                </b-col>
                <b-col cols="12" md="4" class="toDoc">
                  <h5 v-if="Object.prototype.hasOwnProperty.call(project, 'authors')">{{ $t('publish.authors_review') }}</h5>
                  <ul v-if="Object.prototype.hasOwnProperty.call(project, 'authors')">
                    <li v-for="(author, index) in project.authors.split(',')" :key="index">{{ author.trim() }}</li>
                  </ul>

                  <h5>{{ $t('project.corresponding_author') }}</h5>
                  <p v-if="project.author">{{ project.author }} <span v-if="project.author_email"><br />{{ project.author_email }}</span></p>

                  <h5 v-if="!project.complete_by_author">{{ $t('project.completed_by_authors') }}</h5>
                  <p v-if="!project.complete_by_author">{{(project.complete_by_author) ? $t('yes_no.yes') : $t('yes_no.no')}}</p>
                </b-col>
                <b-col
                  cols="12">
                  <h5 v-if="project.license_type">{{ $t('publish.licensed_under') }}</h5>
                  <p v-if="project.license_type">{{getLicense(project.license_type)}}</p>
                </b-col>
              </b-row>
            </div>
          </b-card>
          <div class="mt-3">
            <print-view-table
              v-if="lists_print_version.length"
              :dataPrintVersion="lists_print_version"
              :references="references"
              :categories="list_categories"
              :printableItems="printableItems"
              :isPublic="true"
              :token="$route.params.token"
              :project="project"
              :onlySummary="true"
              :hasPermission="true">
            </print-view-table>
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
import Api from '@/utils/Api'
import Commons from '@/utils/commons'
import { withDerivedRows } from '@/utils/derivedRows'

const contentGuidance = () => import(/* webpackChunkName: "contentguidance" */'../contentGuidance')
const organizationForm = () => import(/* webpackChunkName: "organizationForm" */'../organization/organizationForm')
const Criteria = () => import(/* webpackChunkName: "criteria" */'../Criteria')
const PrintViewTable = () => import(/* webpackChunkName: "printViewTable" */'../project/PrintViewTable')
const charsOfStudiesDisplayDataTable = () => import(/* webpackChunkName: "charsofstudiesdisplaydatatable" */'../charsOfStudies/displayTableData')
const methAssessmentsDisplayDataTable = () => import(/* webpackChunkName: "methassessmentssisplaysatatable" */'../methAssessments/displayTableData')
const camelotCharacteristicsTablePreview = () => import(/* webpackChunkName: "camelotcharacteristicstablepreview" */'../camelot/preview/CamelotCharacteristicsTablePreview.vue')
const camelotAssessmentsTablePreview = () => import(/* webpackChunkName: "camelotassessmentstablepreview" */'../camelot/preview/CamelotAssessmentsTablePreview.vue')
const backToTop = () => import(/* webpackChunkName: "backtotop" */'../backToTop')
const actionButtons = () => import(/* webpackChunkName: "actionButtonsProject" */'../project/actionButtons.vue')

export default {
  components: {
    'content-guidance': contentGuidance,
    organizationForm,
    'criteria': Criteria,
    'print-view-table': PrintViewTable,
    'chars-of-studies-table': charsOfStudiesDisplayDataTable,
    'meth-assessments-table': methAssessmentsDisplayDataTable,
    'camelot-characteristics-table-preview': camelotCharacteristicsTablePreview,
    'camelot-assessments-table-preview': camelotAssessmentsTablePreview,
    'back-to-top': backToTop,
    'action-buttons': actionButtons
  },
  data () {
    return {
      bundleMode: false,
      name: 'previewContentSoqf',
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
      lists_print_version: [],
      list_categories: {
        options: [],
        selected: null
      },
      references: [],
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
          { key: 'authors', label: this.$t('references.author_year') }
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
          { key: 'authors', label: this.$t('references.author_year') }
        ]
      },
      methodologicalTableRefsTableSettings: {
        currentPage: 1,
        perPage: 10,
        isBusy: false
      },
      findings: [],
      printableItems: []
    }
  },
  mounted () {
    if (this.$route.name === 'sharedContent') {
      this.bundleMode = true
      this.loadSharedBundle()
    } else {
      this.getProject()
      this.getListCategories()
      this.getReferences()
    }
  },
  watch: {
    'list_categories.options': function (newVal) {
      if (this.bundleMode) return
      if (newVal && newVal.length > 0) {
        this.getLists()
      }
    }
  },
  computed: {
    /**
     * Las dos tablas del proyecto, completadas con los estudios que no tienen fila.
     *
     * Van como computed y no dentro del `.then` del documento porque las referencias llegan
     * por un request aparte: derivar al recibir el documento haría que el resultado
     * dependiera de cuál respondiera primero. Así se recalcula cuando llegan.
     *
     * Esta vista es de sólo lectura —preview e impresión, también pública— así que nadie
     * puede sembrar desde acá. Antes la única siembra venía de un PATCH de documento
     * completo en los Pasos 3 y 4, que además nunca corría para un proyecto que nadie
     * editó en esos pasos.
     */
    charsOfStudiesRows () {
      return this.withStudyRows(this.charsOfStudies)
    },
    methodologicalRows () {
      return this.withStudyRows(this.methodologicalTableRefs)
    },
    select_options: function () {
      return [
        { value: 0, text: this.$t('cerqual_options.no_very_minor_concerns') },
        { value: 1, text: this.$t('cerqual_options.minor_concerns') },
        { value: 2, text: this.$t('cerqual_options.moderate_concerns') },
        { value: 3, text: this.$t('cerqual_options.serious_concerns') },
        { value: null, text: this.$t('cerqual_options.undefined') }
      ]
    },
    cerqual_confidence: function () {
      return [
        { value: 0, text: this.$t('cerqual_options.high_confidence') },
        { value: 1, text: this.$t('cerqual_options.moderate_confidence') },
        { value: 2, text: this.$t('cerqual_options.low_confidence') },
        { value: 3, text: this.$t('cerqual_options.very_low_confidence') }
      ]
    }
  },
  methods: {
    printDoc: function () {
      window.print()
    },
    getLicense: function (license) {
      if (!license) return ''
      const key = `commons.licenses.${license}`
      const text = this.$t(key)
      return text === key ? '' : text
    },
    getProject: function () {
      const params = {
        organization: this.$route.params.org_id
      }
      Api.get(`/isoqf_projects/${this.$route.params.isoqf_id}`, params)
        .then((response) => {
          this.project = response.data
          if (this.project.public_type !== 'private') {
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
        .catch(() => {
          this.$router.push({ name: 'MainPage' })
        })
    },
    getLists: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.isoqf_id
      }
      Api.get('/isoqf_lists', params)
        .then((response) => {
          this.findings = []
          let data = JSON.parse(JSON.stringify(response.data))
          data = Commons.sortFindings(data, this.list_categories)
          if (data.length) {
            for (let list of data) {
              if (!Object.prototype.hasOwnProperty.call(list, 'evidence_profile')) {
                list.status = 'unfinished'
                list.explanation = 'without_explanation'
              } else {
                list.status = 'completed'
                list.explanation = 'with_explanation'
                Commons.normalizeEvidenceProfile(list)
                const cerqual = Commons.resolveCerqual(list)
                if (cerqual.option === null) {
                  list.status = 'unfinished'
                }
                if (cerqual.explanation === '') {
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
                    if (list.category === category.id) {
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
              // Derive the filter code from the numeric option (0-3), not the
              // translated label, so filtering keeps working in any language.
              list.filter_cerqual = { 0: 'hc', 1: 'mc', 2: 'lc', 3: 'vc' }[list.cerqual.option] || ''
              list.cerqual_explanation = list.cerqual.explanation
              list.ref_list = ''
              list.raw_ref = []
              for (let r of [...this.references].sort((a, b) => a.id - b.id)) {
                for (let ref of list.references) {
                  if (ref === r.id) {
                    list.ref_list = list.ref_list + this.parseReference(r, true)
                    list.raw_ref.push(r)
                  }
                }
              }
              this.getFinding(this.$route.params.org_id, list.id)
            }

            if (this.list_categories.options.length) {
              this.lists_print_version = []
              let categories = []

              for (let category of this.list_categories.options) {
                if (category.id !== null) {
                  categories.push({
                    'name': category.text,
                    'id': category.id,
                    'value': category.id,
                    'items': [],
                    is_category: true
                  })
                }
              }
              categories.push({
                'name': this.$t('categories.uncategorised_findings') || 'Uncategorised findings',
                'id': 'uncategorized',
                'value': null,
                'items': [],
                is_category: true
              })

              for (let list of data) {
                if (categories.length) {
                  for (let category of categories) {
                    // Robust comparison of IDs (string conversion)
                    const listCatId = list.category ? list.category.toString() : null
                    const categoryValue = category.value ? category.value.toString() : null

                    if (categoryValue === listCatId) {
                      category.items.push(
                        {
                          'id': list.id,
                          'displayNumber': list.displayNumber,
                          'name': list.name,
                          'cerqual_option': list.cerqual_option,
                          'filter_cerqual': list.filter_cerqual,
                          'cerqual_explanation': list.cerqual_explanation,
                          'ref_list': list.ref_list,
                          'sort': list.sort,
                          'notes': list.notes,
                          'evidence_profile': list.evidence_profile,
                          'references': list.references
                        }
                      )
                    }
                  }
                }
              }
              // El número ya viene en displayNumber desde sortFindings: acá sólo se
              // intercalan los encabezados de categoría, que no llevan número.
              let _items = []
              for (const cat of categories) {
                if (cat.items.length) {
                  _items.push(cat)
                  _items.push(...cat.items)
                }
              }

              this.lists_print_version = _items
            } else {
              this.lists_print_version = data
            }

            this.printableItems = []
            for (let items of this.lists_print_version) {
              if (items.id) {
                this.printableItems.push(items.id)
              }
            }
          }
          this.lists = data
          this.table_settings.isBusy = false
          this.table_settings.totalRows = data.length
        })
        .catch((error) => {
          console.log(error)
        })
    },
    getFinding: function (orgId, listId) {
      const params = {
        organization: orgId,
        list_id: listId
      }
      Api.get('/isoqf_findings', params)
        .then((response) => {
          if (response.data.length) {
            if (!this.findings.find(f => f.id === response.data[0].id)) {
              this.findings.push(response.data[0])
            }
          }
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getListCategories: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.isoqf_id
      }
      Api.get('/isoqf_list_categories', params)
        .then((response) => {
          this.list_categories.options = []
          if (response.data.length) {
            let options = JSON.parse(JSON.stringify(response.data))
            for (let option of options) {
              if (!Object.prototype.hasOwnProperty.call(option, 'text')) {
                option.text = ''
              }
            }
            options.sort((a, b) => a.text.localeCompare(b.text))
            options.splice(0, 0, {id: null, text: this.$t('categories.no_group') || 'No group'})
            this.list_categories.options = options
          }
        })
        .catch((error) => {
          console.log(error)
        })
    },
    getReferences: function (changeTab = true) {
      Api.get(`/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.isoqf_id}`)
        .then((response) => {
          const data = JSON.parse(JSON.stringify(response.data))
          this.references = data
        })
        .catch((error) => {
          console.log(error)
          // this.printErrors(error)
        })
    },
    parseReference: function (reference, onlyAuthors = false, hasSemicolon = true) {
      return Commons.parseReference(reference, onlyAuthors, hasSemicolon)
    },
    /** Un clon de la tabla con una fila por estudio, derivando las que falten. */
    withStudyRows: function (table) {
      const base = table || { fields: [], items: [] }
      // `references` arranca vacío y el endpoint puede devolver algo que no sea un array;
      // sin la guarda, el computed rompe el render de la preview entera.
      const refs = Array.isArray(this.references) ? this.references : []
      const refIds = refs.map(r => r.id)
      return {
        ...base,
        items: withDerivedRows(base.items, refIds, (refId) => {
          const ref = refs.find(r => String(r.id) === String(refId))
          return {
            ref_id: refId,
            authors: ref ? Commons.parseReference(ref, true, false) : ''
          }
        })
      }
    },
    getCharacteristics: function () {
      this.charsOfStudiesTableSettings.isBusy = true
      Api.get(`/isoqf_characteristics?organization=${this.$route.params.org_id}&project_id=${this.$route.params.isoqf_id}`)
        .then((response) => {
          if (response.data.length) {
            this.charsOfStudies = JSON.parse(JSON.stringify(response.data[0]))
            if (Object.prototype.hasOwnProperty.call(this.charsOfStudies, 'fields')) {
              this.charsOfStudies.fieldsObj = [{ 'key': 'authors', 'label': this.$t('references.author_year') }]

              const fields = JSON.parse(JSON.stringify(this.charsOfStudies.fields))
              const items = JSON.parse(JSON.stringify(this.charsOfStudies.items))

              const _items = items.sort((a, b) => {
                const authorsA = (a.authors || '').toString()
                const authorsB = (b.authors || '').toString()
                return authorsA.localeCompare(authorsB)
              })
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
            this.charsOfStudies = { fields: [], items: [], authors: '', fieldsObj: [ { key: 'authors', label: this.$t('references.author_year') } ] }
          }
        })
    },
    getMethodological: function () {
      this.methodologicalTableRefsTableSettings.isBusy = true
      Api.get(`/isoqf_assessments?organization=${this.$route.params.org_id}&project_id=${this.$route.params.isoqf_id}`)
        .then((response) => {
          if (response.data.length) {
            this.methodologicalTableRefs = JSON.parse(JSON.stringify(response.data[0]))
            if (Object.prototype.hasOwnProperty.call(this.methodologicalTableRefs, 'fields')) {
              const fields = JSON.parse(JSON.stringify(this.methodologicalTableRefs.fields))
              const items = JSON.parse(JSON.stringify(this.methodologicalTableRefs.items))

              const _items = items.sort((a, b) => {
                const authorsA = (a.authors || '').toString()
                const authorsB = (b.authors || '').toString()
                return authorsA.localeCompare(authorsB)
              })
              this.methodologicalTableRefs.items = _items

              this.methodologicalTableRefs.fieldsObj = [{ 'key': 'authors', 'label': this.$t('references.author_year') }]
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
            this.methodologicalTableRefs = { fields: [], items: [], authors: '', fieldsObj: [ { key: 'authors', label: this.$t('references.author_year') } ] }
          }
        })
    },
    loadSharedBundle: function () {
      const token = this.$route.params.token
      Api.get(`/shared/${token}`)
        .then((response) => {
          const bundle = response.data

          this.project = bundle.project
          if (!Object.prototype.hasOwnProperty.call(this.project, 'inclusion')) {
            this.project.inclusion = ''
          }
          if (!Object.prototype.hasOwnProperty.call(this.project, 'exclusion')) {
            this.project.exclusion = ''
          }
          this.ui.project.show_criteria = true

          this.references = bundle.references || []
          this.findings = bundle.findings || []

          const rawCats = bundle.list_categories || []
          if (rawCats.length) {
            const catOptions = JSON.parse(JSON.stringify(rawCats))
            for (let option of catOptions) {
              if (!Object.prototype.hasOwnProperty.call(option, 'text')) {
                option.text = ''
              }
            }
            catOptions.sort((a, b) => a.text.localeCompare(b.text))
            catOptions.splice(0, 0, { id: null, text: this.$t('categories.no_group') || 'No group' })
            this.list_categories.options = catOptions
          }

          const rawLists = bundle.lists || []
          let data = JSON.parse(JSON.stringify(rawLists))
          data = Commons.sortFindings(data, this.list_categories)
          if (data.length) {
            for (let list of data) {
              if (!Object.prototype.hasOwnProperty.call(list, 'evidence_profile')) {
                list.status = 'unfinished'
                list.explanation = 'without_explanation'
              } else {
                list.status = 'completed'
                list.explanation = 'with_explanation'
                Commons.normalizeEvidenceProfile(list)
                const cerqual = Commons.resolveCerqual(list)
                if (cerqual.option === null) {
                  list.status = 'unfinished'
                }
                if (cerqual.explanation === '') {
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
                    if (list.category === category.id) {
                      list.category_name = category.text
                      list.category_extra_info = category.extra_info
                    }
                  }
                }
              }
              list.cerqual_option = ''
              if (list.cerqual && list.cerqual.option != null) {
                list.cerqual_option = this.cerqual_confidence[list.cerqual.option].text
              }
              // Derive the filter code from the numeric option (0-3), not the
              // translated label, so filtering keeps working in any language.
              list.filter_cerqual = { 0: 'hc', 1: 'mc', 2: 'lc', 3: 'vc' }[list.cerqual && list.cerqual.option] || ''
              list.cerqual_explanation = list.cerqual ? list.cerqual.explanation : ''
              list.ref_list = ''
              list.raw_ref = []
              for (let r of [...this.references].sort((a, b) => a.id - b.id)) {
                for (let ref of list.references) {
                  if (ref === r.id) {
                    list.ref_list = list.ref_list + this.parseReference(r, true)
                    list.raw_ref.push(r)
                  }
                }
              }
            }

            if (this.list_categories.options.length) {
              this.lists_print_version = []
              let categories = []
              for (let category of this.list_categories.options) {
                if (category.id !== null) {
                  categories.push({
                    'name': category.text,
                    'id': category.id,
                    'value': category.id,
                    'items': [],
                    is_category: true
                  })
                }
              }
              categories.push({
                'name': this.$t('categories.uncategorised_findings') || 'Uncategorised findings',
                'id': 'uncategorized',
                'value': null,
                'items': [],
                is_category: true
              })
              for (let list of data) {
                for (let category of categories) {
                  const listCatId = list.category ? list.category.toString() : null
                  const categoryValue = category.value ? category.value.toString() : null
                  if (categoryValue === listCatId) {
                    category.items.push({
                      'id': list.id,
                      'displayNumber': list.displayNumber,
                      'name': list.name,
                      'cerqual_option': list.cerqual_option,
                      'filter_cerqual': list.filter_cerqual,
                      'cerqual_explanation': list.cerqual_explanation,
                      'ref_list': list.ref_list,
                      'sort': list.sort,
                      'notes': list.notes,
                      'evidence_profile': list.evidence_profile,
                      'references': list.references
                    })
                  }
                }
              }
              // El número ya viene en displayNumber desde sortFindings: acá sólo se
              // intercalan los encabezados de categoría, que no llevan número.
              let _items = []
              for (const cat of categories) {
                if (cat.items.length) {
                  _items.push(cat)
                  _items.push(...cat.items)
                }
              }
              this.lists_print_version = _items
            } else {
              this.lists_print_version = data
            }

            this.printableItems = []
            for (let items of this.lists_print_version) {
              if (items.id) {
                this.printableItems.push(items.id)
              }
            }
          }
          this.lists = data
          this.table_settings.isBusy = false
          this.table_settings.totalRows = data.length
          this.charsOfStudiesTableSettings.isBusy = false
          this.methodologicalTableRefsTableSettings.isBusy = false

          const chars = bundle.characteristics || []
          if (chars.length) {
            this.charsOfStudies = JSON.parse(JSON.stringify(chars[0]))
            this.charsOfStudies.fieldsObj = this.charsOfStudies.fieldsObj || [{ 'key': 'authors', 'label': this.$t('references.author_year') }]
            if (Object.prototype.hasOwnProperty.call(this.charsOfStudies, 'fields')) {
              const fields = JSON.parse(JSON.stringify(this.charsOfStudies.fields))
              const items = JSON.parse(JSON.stringify(this.charsOfStudies.items))
              const _items = items.sort((a, b) => {
                const authorsA = (a.authors || '').toString()
                const authorsB = (b.authors || '').toString()
                return authorsA.localeCompare(authorsB)
              })
              this.charsOfStudies.items = _items
              this.charsOfStudiesFieldsModal.fields = []
              for (let f of fields) {
                if (f.key !== 'ref_id' && f.key !== 'authors' && f.key !== 'actions') {
                  this.charsOfStudiesFieldsModal.fields.push(f.label)
                  this.charsOfStudies.fieldsObj.push({ key: f.key, label: f.label })
                }
              }
              this.charsOfStudies.fieldsObj.push({ 'key': 'actions', 'label': '' })
              this.charsOfStudiesFieldsModal.nroColumns = (this.charsOfStudies.fieldsObj.length === 2) ? 1 : this.charsOfStudies.fieldsObj.length - 2
              for (let item of _items) {
                this.charsOfStudiesFieldsModal.items.push(item)
              }
            }
          }

          const assessments = bundle.assessments || []
          if (assessments.length) {
            this.methodologicalTableRefs = JSON.parse(JSON.stringify(assessments[0]))
            this.methodologicalTableRefs.fieldsObj = this.methodologicalTableRefs.fieldsObj || [{ 'key': 'authors', 'label': this.$t('references.author_year') }]
            if (Object.prototype.hasOwnProperty.call(this.methodologicalTableRefs, 'fields')) {
              const fields = JSON.parse(JSON.stringify(this.methodologicalTableRefs.fields))
              const items = JSON.parse(JSON.stringify(this.methodologicalTableRefs.items))
              const _items = items.sort((a, b) => {
                const authorsA = (a.authors || '').toString()
                const authorsB = (b.authors || '').toString()
                return authorsA.localeCompare(authorsB)
              })
              this.methodologicalTableRefs.items = _items
              this.methodologicalTableRefs.fieldsObj = [{ 'key': 'authors', 'label': this.$t('references.author_year') }]
              for (let f of fields) {
                if (f.key !== 'ref_id' && f.key !== 'authors' && f.key !== 'actions') {
                  this.methodologicalTableRefs.fieldsObj.push({ key: f.key, label: f.label })
                }
              }
              this.methodologicalTableRefs.fieldsObj.push({ 'key': 'actions', 'label': '' })
            }
          }

          // Para proyectos Camelot, si no vinieron los datos en el bundle, intentar cargarlos desde la API
          if (this.project.use_camelot) {
            if (!chars.length && this.charsOfStudies.fields && this.charsOfStudies.fields.length === 0) {
              this.loadCharacteristicsForSharedLink()
            }
            if (!assessments.length && (!this.methodologicalTableRefs.items || this.methodologicalTableRefs.items.length === 0)) {
              this.loadAssessmentsForSharedLink()
            }
          }
        })
        .catch((error) => {
          let errorMessage = this.$t('shared.link_invalid')

          if (error.response) {
            const status = error.response.status
            const data = error.response.data

            if (status === 404 && data && data.message) {
              if (data.message.includes('Invalid or expired')) {
                errorMessage = this.$t('shared.link_invalid')
              } else if (data.message.includes('Not found')) {
                errorMessage = this.$t('shared.resource_not_found')
              }
            } else if (status === 403) {
              errorMessage = this.$t('shared.access_denied')
            }
          }

          this.$bvToast.toast(errorMessage, {
            title: this.$t('common.warning'),
            variant: 'danger',
            solid: true,
            toaster: 'b-toaster-top-center'
          })

          setTimeout(() => {
            this.$router.push({ name: 'MainPage' })
          }, 2000)
        })
    },
    loadCharacteristicsForSharedLink: function () {
      const token = this.$route.params.token
      const params = {
        organization: this.project.organization || '',
        project_id: this.project.id
      }
      Api.get(`/api/shared/${token}/isoqf_characteristics`, params)
        .then(response => {
          if (response.data && response.data.length > 0) {
            const serverData = response.data[0] || { fields: [], items: [] }
            if (serverData.items && Array.isArray(serverData.items)) {
              serverData.items = serverData.items.map(item => {
                const ref = this.references.find(r => r.id === item.ref_id)
                if (ref) {
                  item.authors = Commons.parseReference(ref, true, false)
                }
                return item
              })
            }
            this.charsOfStudies = serverData
          }
        })
        .catch(error => {
          console.error('Error loading characteristics for shared link:', error)
        })
    },
    loadAssessmentsForSharedLink: function () {
      const token = this.$route.params.token
      const params = {
        organization: this.project.organization || '',
        project_id: this.project.id
      }
      Api.get(`/api/shared/${token}/isoqf_assessments`, params)
        .then(response => {
          if (response.data && response.data.length > 0) {
            const serverData = response.data[0] || { items: [] }
            if (serverData.items && Array.isArray(serverData.items)) {
              serverData.items = serverData.items.map(item => {
                const ref = this.references.find(r => String(r.id) === String(item.ref_id))
                if (ref) {
                  item.authors = Commons.parseReference(ref, true, false)
                }
                return item
              })
            }
            this.methodologicalTableRefs = serverData
          }
        })
        .catch(error => {
          console.error('Error loading assessments for shared link:', error)
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
    html[data-theme="dark"] div >>> #tabsTitle a {
      color: #fff;
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
