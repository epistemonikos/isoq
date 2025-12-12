<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="pt-5">
        <b-row align-h="end">
          <b-col
            class="text-right">
            <b-link :to="{ name: 'viewOrganization', params: { id: this.$store.state.user.personal_organization }, query: {hash: `p-${this.project.id}`}}" class="d-print-none return">
              <font-awesome-icon icon="long-arrow-alt-left" title="return to My Workspace" />
              return to My Workspace
            </b-link>
          </b-col>
          <b-col
            cols="12" class="toDoc">
            <h2 id="project-title">{{ project.name }}</h2>
          </b-col>
        </b-row>
        <b-nav id="tabsTitle" tabs fill class="pt-5">
          <b-nav-item
            :active="(tabOpened === 0) ? true : false"
            @click="clickTab(0)">Project properties</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 1) ? true : false"
            @click="clickTab(1)">My Data</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 2) ? true : false"
            :disabled="(references.length) ? false : true"
            @click="clickTab(2)">iSoQ</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 3) ? true : false"
            @click="clickTab(3)">Guidance on applying GRADE-CERQual</b-nav-item>
        </b-nav>
      </div>
    </b-container>
    <b-container fluid class="mb-5">
      <div :class="{'block mt-3': (tabOpened===0)?true:false, 'd-none': (tabOpened===0)?!true:!false}">
        <ProjectPropertiesTab
          :project="project"
          :canWrite="checkPermissions()"
          @update-modification="updateModificationTime()"
          @update-project="updateDataProject">
        </ProjectPropertiesTab>
      </div>
      <div :class="{'block mt-3': (tabOpened===1)?true:false, 'd-none': (tabOpened===1)?!true:!false}">
        <MyDataTab
          :project="project"
          :ui="ui"
          :references="references"
          :lists="lists"
          :charsOfStudies="charsOfStudies"
          :methodologicalTableRefs="methodologicalTableRefs"
          :refs="refs"
          :loadReferences="loadReferences"
          @get-references="getReferences"
          @status-load-references="statusLoadReferences"
          @get-project="getProject"
          @update-modification="updateModificationTime()"
          @print-errors="printErrors"
          @update-data-table="updateDataTable"
          @set-item-data="setItemData"
          @continue-to-isoq="continueToIsoq">
        </MyDataTab>
      </div>
      <div :class="{'block mt-3': (tabOpened===2)?true:false, 'd-none': (tabOpened===2)?!true:!false}" :disabled="(references.length) ? false : true">
         <IsoqTab
           :mode="effectiveMode"
           :project="project"
           :ui="ui"
           :lists="lists"
           :findings="findings"
           :references="references"
           :charsOfStudies="charsOfStudies"
           :methodologicalTableRefs="methodologicalTableRefs"
           :lists_print_version="lists_print_version"
           :select_options="select_options"
           :cerqual_confidence="cerqual_confidence"
           :printableItems="printableItems"
           :list_categories="list_categories"
           :refs="refs"
           @ui-publish-show-loader="uiShowLoaders"
           @get-project="getProject"
           @change-mode="changeMode"
           @update-modification="updateModificationTime"
           @get-lists="getLists"
           @get-references="getReferences"
           @status-load-references="statusLoadReferences"
           @print-errors="printErrors"
           @refresh-categories="refreshCategories">
         </IsoqTab>
      </div>
      <div :class="{'block mt-3': (tabOpened===3)?true:false, 'd-none': (tabOpened===3)?!true:!false}">
        <GuidanceTab></GuidanceTab>
      </div>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import Commons from '../../utils/commons.js'

export default {
  components: {
    ProjectPropertiesTab: () => import('./ProjectPropertiesTab.vue'),
    MyDataTab: () => import('./MyDataTab.vue'),
    IsoqTab: () => import('./IsoqTab.vue'),
    GuidanceTab: () => import('./GuidanceTab.vue')
  },
  data () {
    return {
      project: {
        name: '',
        authors: '',
        inclusion: '',
        exclusion: ''
      },
      ui: {
        project: {
          type: '',
          inclusion: {
            success: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            error: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            loading: false,
            loading_txt: 'Save'
          },
          exclusion: {
            success: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            error: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            loading: false,
            loading_txt: 'Save'
          },
          displaySearch: false,
          showFilterOne: false,
          showFilterTwo: false,
          showFilterThree: false,
          show_criteria: false
        },
        itemData: null,
        publish: {
          showLoader: false
        }
      },
      lists: [],
      list_categories: {
        options: [],
        selected: null
      },
      lists_print_version: [],
      modal_edit_list_categories: {
        options: []
      },
      select_options: [
        { value: 0, text: 'No/Very minor concerns' },
        { value: 1, text: 'Minor concerns' },
        { value: 2, text: 'Moderate concerns' },
        { value: 3, text: 'Serious concerns' },
        { value: null, text: 'Undefined' }
      ],
      cerqual_confidence: [
        { value: 'hc', text: 'High confidence' },
        { value: 'mc', text: 'Moderate confidence' },
        { value: 'lc', text: 'Low confidence' },
        { value: 'vc', text: 'Very low confidence' },
        { value: null, text: 'Undefined' }
      ],
      references: [],
      refs: [],
      loadReferences: true,
      lastId: 1,
      mode: '',
      charsOfStudies: {
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      },
      tabOpened: 1,
      methodologicalTableRefs: {
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      },
      findings: [],
      printableItems: [],
      Commons: Commons
    }
  },
  async mounted () {
    await this.getListCategories()
    await this.getReferences()
    await this.getProject()
  },
  methods: {
    updateDataProject: function (data) {
      this.getProject()
    },
    setItemData: function (data) {
      this.ui.itemData = data
    },
    getListCategories: async function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get('/api/isoqf_list_categories', { params })
        .then((response) => {
          this.processGetListCategories(response.data)
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    refreshCategories: function () {
      this.getListCategories()
    },
    getReferences: async function (changeTab = true) {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get(`/api/isoqf_references`, { params })
        .then(async (response) => {
          this.references = await this.processGetReferencesRaw(response.data)
          this.refs = await this.processGetReferencesWithNames(response.data)
          if (changeTab) {
            if (this.references.length) {
              this.$nextTick(() => {
                if (Object.prototype.hasOwnProperty.call(this.$route.query, 'tab')) {
                  const tabs = ['Project-Property', 'My-Data', 'iSoQ', 'Guidance-on-applying-GRADE-CERQual']
                  this.tabOpened = tabs.indexOf(this.$route.query.tab)
                  // Step logic is now handled in MyDataTab, but we can keep tab logic here
                } else {
                  this.tabOpened = 2
                }
              })
            }
          }
          this.loadReferences = false
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getProject: async function () {
      const params = {
        organization: this.$route.params.org_id
      }
      axios.get(`/api/isoqf_projects/${this.$route.params.id}`, { params })
        .then((response) => {
          let _project = JSON.parse(JSON.stringify(response.data))
          if (!Object.prototype.hasOwnProperty.call(_project, 'inclusion')) {
            _project.inclusion = ''
          }
          if (!Object.prototype.hasOwnProperty.call(_project, 'exclusion')) {
            _project.exclusion = ''
          }
          if (!Object.prototype.hasOwnProperty.call(_project, 'license_type')) {
            _project.license_type = 'CC-BY-NC-ND'
          }
          if (Object.prototype.hasOwnProperty.call(_project, 'license_type')) {
            if (_project.license_type === '') {
              _project.license_type = 'CC-BY-NC-ND'
            }
          }
          this.project = _project
          // set mode based on permissions: prefer write -> edit, otherwise read -> view
          if (this.checkPermissions('can_write')) {
            this.mode = 'edit'
          } else if (this.checkPermissions('can_read')) {
            this.mode = 'view'
          } else {
            this.mode = ''
          }
          this.ui.project.show_criteria = true
          this.getLists()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    processGetListCategories: function (data) {
      this.list_categories.options = []
      this.modal_edit_list_categories.options = []
      if (data.length) {
        let options = JSON.parse(JSON.stringify(data))
        for (let option of options) {
          if (!Object.prototype.hasOwnProperty.call(option, 'text')) {
            option.text = ''
          }
        }
        options.sort((a, b) => a.text.localeCompare(b.text))
        let modalOptions = JSON.parse(JSON.stringify(options))
        options.splice(0, 0, {id: null, text: 'No group'})
        this.list_categories.options = options
        this.modal_edit_list_categories.options = modalOptions
      }
    },
    processGetReferencesRaw: async function (references) {
      const data = JSON.parse(JSON.stringify(references))
      for (const d of data) {
        d._showDetails = false
      }
      return data
    },
    processGetReferencesWithNames: async function (references) {
      const data = JSON.parse(JSON.stringify(references))
      let refs = []

      for (const reference of data) {
        let content = await this.parseReference(reference)
        if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
          refs.push({'id': reference.id, 'content': content})
        }
      }

      if (refs.length) {
        return refs.sort((a, b) => a.content.localeCompare(b.content))
      }
      return refs
    },
    getLists: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get('/api/isoqf_lists', { params })
        .then(async (response) => {
          this.lists = await this.processLists(response)
          const lists = response.data.map((list) => { return list.id })
          this.getFindings(lists.toString())
          this.routeAnchorHash()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    routeAnchorHash: function () {
      if (this.ui.itemData !== null || Object.prototype.hasOwnProperty.call(this.$route.query, 'hash')) {
        const hash = (this.ui.itemData !== null) ? `#${this.ui.itemData}` : `#${this.$route.query.hash}`
        // only if hash is not related to editing finding (needs check?)
        // simplified logic for itemData
         this.$router.push({
          name: 'viewProject',
          query: {
            tab: this.$route.query.tab
          },
          params: {
            organization: this.$route.params.org_id,
            id: this.$route.params.id
          },
          hash: `${hash}`
        })
        if (this.ui.itemData) {
           this.ui.itemData = null
        }
      }
    },
    updateDataTable: function (data, type) {
      if (type === 'isoqf_assessments') {
        this.methodologicalTableRefs = data
      } else {
        this.charsOfStudies = data
      }
    },
    statusLoadReferences: function (status) {
      this.loadReferences = status
    },
    clickTab: function (option) {
      this.tabOpened = option
    },
    uiShowLoaders: function (status) {
      this.ui.publish.showLoader = status
    },
    changeMode: function (mode) {
      this.mode = mode
    },
    parseReference: async (reference, onlyAuthors = false, hasSemicolon = true) => {
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
    processLists: async function (response) {
      let data = JSON.parse(JSON.stringify(response.data))
      if (data.length) {
        data.sort(function (a, b) {
          if (a.sort < b.sort) { return -1 }
          if (a.sort > b.sort) { return 1 }
          return 0
        })
        this.lastId = data.length + 1
        for (let list of data) {
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
            list.category_name_filtered = ''
            list.category_extra_info = ''
            if (this.list_categories.options.length) {
              for (let category of this.list_categories.options) {
                if (list.category === category.id) {
                  list.category_name = category.text
                  // clean from special chars the category.text and store under list.category_name_filtered
                  list.category_name_filtered = category.text.replace(/[^a-zA-Z0-9]/g, '')
                  list.category_extra_info = category.extra_info
                }
              }
            }
          }
          list.cerqual_option = ''
          if (list.cerqual.option != null) {
            list.cerqual_option = this.cerqual_confidence[list.cerqual.option].text
          }
          list.filter_cerqual = ''
          switch (list.cerqual_option) {
            case 'High confidence':
              list.filter_cerqual = 'hc'
              break
            case 'Moderate confidence':
              list.filter_cerqual = 'mc'
              break
            case 'Low confidence':
              list.filter_cerqual = 'lc'
              break
            case 'Very low confidence':
              list.filter_cerqual = 'vc'
              break
            default:
              list.filter_cerqual = ''
              break
          }
          list.cerqual_explanation = list.cerqual.explanation
          list.ref_list = ''
          list.raw_ref = []
          for (let r of this.references) {
            for (let ref of list.references) {
              if (ref === r.id) {
                list.ref_list = list.ref_list + await this.parseReference(r, true)
                list.raw_ref.push(r)
              }
            }
          }
        }

        if (this.list_categories.options.length) {
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
          categories.push({'name': 'Uncategorised findings', 'id': 'uncategorized', 'value': null, 'items': [], is_category: true})

          for (let list of data) {
            if (categories.length) {
              for (let category of categories) {
                if (category.value === list.category) {
                  category.items.push(
                    {
                      'id': list.id,
                      'name': list.name,
                      'cerqual_option': list.cerqual_option,
                      'filter_cerqual': list.filter_cerqual,
                      'cerqual_explanation': list.cerqual_explanation,
                      'ref_list': list.ref_list,
                      'sort': list.sort,
                      'notes': list.notes,
                      'evidence_profile': list.evidence_profile,
                      'references': list.references,
                      'cnt': 0
                    }
                  )
                }
              }
            }
          }
          let _items = []
          let cnt = 1
          for (const cat of categories) {
            if (cat.items.length) {
              _items.push(cat)
              for (const _item of cat.items) {
                _item.cnt = cnt
                _items.push(_item)
                cnt++
              }
            }
          }

          this.lists_print_version = _items
        } else {
          this.lists_print_version = data
        }

        this.printableItems = []
        for (let items of this.lists_print_version) {
          this.printableItems.push(items.id)
        }
      }
      return data
    },
    getFindings: function (listIds) {
      const params = {
        'list_ids': listIds
      }
      axios.get('/api/findings', {params})
        .then((response) => {
          if (response.data.length) {
            this.findings.push(...response.data)
          }
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    continueToIsoq: function () {
      this.clickTab(2)
    },
    checkPermissions: function (type = 'can_write') {
      // normalize input to an array of permission keys
      let perms = []
      if (Array.isArray(type)) {
        perms = type
      } else if (typeof type === 'string') {
        perms = type.split(',').map(t => t.trim()).filter(Boolean)
      } else {
        perms = ['can_write']
      }

      // if the current user belongs to the same personal organization, allow
      if (this.$store && this.$store.state && this.$store.state.user && this.$store.state.user.personal_organization === this.$route.params.org_id) {
        return true
      }

      // check any of the requested permissions on the project
      for (const perm of perms) {
        if (!Object.prototype.hasOwnProperty.call(this.project, perm)) {
          continue
        }

        const val = this.project[perm]
        // val is expected to be an array of user ids, but could be a comma-separated string
        if (Array.isArray(val)) {
          if (val.includes(this.$store.state.user.id)) {
            return true
          }
        } else if (typeof val === 'string') {
          const arr = val.split(',').map(x => x.trim()).filter(Boolean)
          if (arr.includes(String(this.$store.state.user.id))) {
            return true
          }
        }
      }

      return false
    },
    updateModificationTime: function () {
      const params = {
        last_update: Date.now()
      }
      axios.patch(`/api/isoqf_projects/${this.$route.params.id}`, params)
        .then()
        .catch((error) => {
          this.printErrors(error)
        })
    },
    printErrors: function (error) {
       Commons.printErrors(error)
    }
  },
  computed: {
    effectiveMode: function () {
      if (this.mode === 'edit') return 'edit'
      if (this.mode === 'view') return 'view'
      if (this.checkPermissions('can_write')) return 'edit'
      if (this.checkPermissions('can_read')) return 'view'
      return ''
    }
  }
}
</script>

<style scoped>
  .return {
    font-size: 1.2rem;
  }
  div >>>
    h2>span>svg,
    h3>span>svg,
    h4>span>svg {
      font-size: 1rem;
    }
  div >>>
    .nav-fill .nav-item {
      text-transform: uppercase;
      font-weight: bold;
    }
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
  @media print {
    div >>>
      ul.nav.nav-tabs.nav-fill {
        display: none !important;
      }
  }
</style>
