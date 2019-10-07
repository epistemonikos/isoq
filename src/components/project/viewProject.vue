<template>
  <div class="mt-4">
    <b-container>
      <b-row align-h="end">
        <b-col cols="12" class="text-right">
          <b-link @click="$router.go(-1)">
            <font-awesome-icon icon="long-arrow-alt-left" v-bind:title="$t('back')" />
            {{ $t('back') }}
          </b-link>
        </b-col>
      </b-row>
      <b-row class="mb-3">
        <b-col cols="12">
          <h1>Interactive Summary of Qualitative Findings Table</h1>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12">
          <h2>{{project.name}}</h2>
        </b-col>
        <b-col cols="12" sm="6">
          <p v-if="project.description">{{project.description}}</p>
          <h5>Review question</h5>
          <p>{{project.review_question}}</p>
        </b-col>
        <b-col cols="12" sm="6">
          <h5>Authors of the review</h5>
          <ul>
            <li v-for="(author, index) in project.authors.split(',')" :key="index">{{author.trim()}}</li>
          </ul>
          <h5>Has the review been published</h5>
          <p>{{(project.published_status) ? 'Yes': 'No'}} <span v-if="project.published_status"><b-link :href="project.url_doi" target="_blank"><font-awesome-icon icon="globe"></font-awesome-icon></b-link></span></p>

          <h5>Is the iSoQf being completed by the review authors?</h5>
          <p>{{(project.complete_by_author) ? 'Yes' : 'No'}}</p>
        </b-col>
        <b-col cols="12" class="my-2">
          <b-card
            bg-variant="light">
            <b-row>
              <b-col
                cols="12"
                sm="6">
                <b-form-group>
                  <b-input-group>
                    <b-form-input
                      v-model="table_settings.filter"
                      type="search"
                      id="filterInput"
                      placeholder="Type to Search"></b-form-input>
                    <b-input-group-append>
                      <b-button :disabled="!table_settings.filter" @click="table_settings.filter = null">Clear</b-button>
                    </b-input-group-append>
                  </b-input-group>
                </b-form-group>
              </b-col>
              <b-col
                cols="12"
                sm="3">
                <b-button
                  variant="outline-primary"
                  block
                  @click="openModalReferencesSingle">
                  Import references
                </b-button>
              </b-col>
              <b-col
                cols="12"
                sm="3">
                <b-button
                  class="mt-2 mt-sm-0"
                  v-b-tooltip.hover title="Copy and paste one synthesised review finding at a time into the iSoQf"
                  variant="outline-primary"
                  @click="modalAddSummarized"
                  block>
                  Add finding
                </b-button>
              </b-col>
            </b-row>
          </b-card>
        </b-col>
        <b-col cols="12">
          <b-table
            responsive
            id="findings"
            ref="findings"
            :fields="fields"
            :items="lists"
            empty-text="There are no findings to show"
            show-empty
            :busy="table_settings.isBusy"
            :current-page="table_settings.currentPage"
            :per-page="table_settings.perPage"
            :filter="table_settings.filter"
            @filtered="onFiltered"
            :filter-included-fields="['isoqf_id', 'name', 'cerqual_option', 'cerqual_explanation']"
          >
            <template v-slot:head(isoqf_id)="data">
              <span v-b-tooltip.hover title="Automatic numbering of synthesised review findings">{{ data.label }}</span>
            </template>
            <template v-slot:head(name)="data">
              <span v-b-tooltip.hover title="Synthesised review findings produced by the review team">{{ data.label }}</span>
            </template>
            <template v-slot:head(confidence)="data">
              <span v-b-tooltip.hover title="Assessment of the extent to which a review finding is a reasonable representation of the phenomenon of interest">{{ data.label }}</span>
            </template>
            <template v-slot:head(cerqual_explanation)="data">
              <span v-b-tooltip.hover title="Statement explaining concerns with any of the CERQual components that justifies the level of confidence chosen">{{ data.label }}</span>
            </template>
            <template v-slot:head(references)="data">
              <span v-b-tooltip.hover title="Studies that contribute to each review finding">{{ data.label }}</span>
            </template>
            <template v-slot:cell(isoqf_id)="data">
              {{ data.item.isoqf_id }}
            </template>
            <template v-slot:cell(name)="data">
              <b-link :to="{name: 'editList', params: {id: data.item.id}}">{{ data.item.name }}</b-link>
            </template>
            <template v-slot:cell(cerqual_explanation)="data">
              {{ data.item.cerqual_explanation }}
            </template>
            <template v-slot:cell(ref_list)="data">
              <li
                v-for="(key, index) in data.item.ref_list"
                :key="key">
                {{ data.item.ref_list[index] }}
              </li>
            </template>
            <template v-slot:cell(actions)="data">
              <font-awesome-icon icon="highlighter"
                @click="openModalReferences(data.index)"
                v-b-tooltip.hover
                title="Add the references that contribute to this review finding"></font-awesome-icon>
              <!--<font-awesome-icon
                icon="edit"></font-awesome-icon>-->
            </template>
            <template v-slot:table-busy>
              <div class="text-center text-danger my-2">
                <b-spinner class="align-middle"></b-spinner>
                <strong>Loading...</strong>
              </div>
            </template>
          </b-table>
          <b-pagination
            v-model="table_settings.currentPage"
            :total-rows="lists.length"
            :per-page="table_settings.perPage"
            aria-controls="findings"
            align="center"></b-pagination>
          <b-modal
            id="add-summarized"
            ref="add-summarized"
            title="Summarized review finding"
            @ok="saveSummarized">
            <b-form-group
              label="Summarized review"
              label-for="summarized-review">
              <b-form-input
                id="summarized-review"
                v-model="summarized_review"></b-form-input>
            </b-form-group>
            </b-modal>
          <b-modal
            id="modal-references"
            ref="modal-references"
            title="Add references"
            @ok="saveReferences"
            scrollable>
            <div
              class="mt-2"
              v-if="references.length">
              <p>In this space we will show your references loaded before or the new one.</p>
              <b-table
                head-variant="light"
                hover
                bordered
                borderless
                :fields="fields_references_table"
                :items="references">
              </b-table>
            </div>
            <b-form-group
              label="Load references"
              label-for="input-ris-file">
              <b-form-file
                id="input-ris-file"
                plain
                @change="loadRefs($event)"></b-form-file>
            </b-form-group>
          </b-modal>
          <b-modal
            id="modal-references-list"
            ref="modal-references-list"
            title="Select references"
            @ok="saveReferencesList"
            size="lg"
            scrollable>
            <div
              class="mt-2"
              v-if="references.length">
              <b-form-group>
                <b-form-checkbox
                  v-for="ref in references"
                  v-model="selected_references"
                  :key="ref.id"
                  :value="ref.id"
                  name="references">
                  {{ getDataDisplayRef(ref) }}
                </b-form-checkbox>
              </b-form-group>
            </div>
            <div
              class="mt-2"
              v-if="references.length === 0">
              <p>To select references, first upload your full reference list by clicking “Import References” next to the search bar.</p>
            </div>
          </b-modal>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data () {
    return {
      project: {
        name: '',
        authors: ''
      },
      lists: [],
      fields: [
        {
          key: 'isoqf_id',
          label: '#'
        },
        {
          key: 'name',
          label: 'Summarized review finding'
        },
        {
          key: 'cerqual_option',
          label: 'CERQual Assessment of confidence',
          formatter: (value, key, item) => {
            if (Object.prototype.hasOwnProperty.call(item, 'cerqual')) {
              if (Object.prototype.hasOwnProperty.call(item.cerqual, 'option') && value != null) {
                return this.cerqual_confidence[value].text
              }
            }
          },
          filterByFormatted: true
        },
        {
          key: 'cerqual_explanation',
          label: 'Explanation of CERQual Assessment'
        },
        {
          key: 'ref_list',
          label: 'References'
        },
        {
          key: 'actions',
          label: ''
        }
      ],
      table_settings: {
        isBusy: true,
        currentPage: 1,
        perPage: 5,
        filter: null,
        totalRows: 1
      },
      summarized_review: '',
      select_options: [
        { value: 0, text: 'No/Minor concerns' },
        { value: 1, text: 'Minor concerns' },
        { value: 2, text: 'Moderated concerns' },
        { value: 3, text: 'Serious concerns' }
      ],
      cerqual_confidence: [
        { value: 0, text: 'High confidence' },
        { value: 1, text: 'Moderate confidence' },
        { value: 2, text: 'Low confidence' },
        { value: 3, text: 'Very low confidence' }
      ],
      pre_references: '',
      references: [],
      fields_references_table:
        [
          {
            key: 'authors',
            label: 'Authors',
            formatter: value => {
              if (value.length === 1) {
                return value[0]
              } else if (value.length < 3) {
                return value[0] + ', ' + value[1]
              } else {
                return value[0] + ' et al.'
              }
            }
          },
          { key: 'publication_year', label: 'Year' }
        ],
      selected_list_index: null,
      selected_references: [],
      lastId: 1
    }
  },
  mounted () {
    this.openModalReferencesSingle(false)
    this.getProject()
  },
  watch: {
    pre_references: function (data) {
      this.references = []
      const file = data
      const allLines = file.split(/\r\n|\n/)
      // Reading line by line
      const titleTags = ['TI', 'T1', 'T2', 'T3']
      const authorTags = ['AU', 'A1', 'A2', 'A3', 'A4']
      const userDefinable = ['U1', 'U2', 'U3', 'U4', 'U5']
      let base = { authors: [], user_definable: [] }

      allLines.forEach((line) => {
        const key = line.split('  - ')[0]
        const content = line.split('  - ')[1]

        if (key === 'TY') {
          base['type'] = content
        }
        if (titleTags.includes(key)) {
          base['title'] = content
        }
        if (authorTags.includes(key)) {
          base['authors'].push(content)
        }
        if (key === 'AB') {
          base['abstract'] = content
        }
        if (key === 'VL') {
          base['volume_number'] = content
        }
        if (key === 'SP') {
          base['start_page'] = content
        }
        if (key === 'EP') {
          base['end_page'] = content
        }
        if (key === 'IN') {
          base['issue_number'] = content
        }
        if (key === 'SN') {
          base['isbn_issn'] = content
        }
        if (key === 'PY') {
          base['publication_year'] = content
        }
        if (key === 'DA') {
          base['date'] = content
        }
        if (key === 'DA') {
          base['date'] = content
        }
        if (key === 'DB') {
          base['database'] = content
        }
        if (key === 'UR') {
          base['url'] = content
        }
        if (key === 'DO') {
          base['doi'] = content
        }
        if (userDefinable.includes(key)) {
          base['user_definable'].push(content)
        }
        if (key === 'ER') {
          this.references.push(base)
          base = { authors: [], user_definable: [] }
        }
      })
    }
  },
  methods: {
    parseReference: (reference) => {
      let result = ''
      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        if (reference.authors.length === 1) {
          result = reference.authors[0] + ', ' + reference.publication_year + '; ' + reference.title
        } else if (reference.authors.length < 3) {
          result = reference.authors[0] + ', ' + reference.authors[1] + ', ' + reference.publication_year + '; ' + reference.title
        } else {
          result = reference.authors[0] + ' et al., ' + reference.publication_year + '; ' + reference.title
        }
        return result
      } else {
        return result
      }
    },
    displayReferences: function (value, key, references) {
      let _references = []
      for (let reference of value) {
        let obj = this.references.find(o => o.id === reference)
        let ref = this.parseReference(obj)
        _references.push(ref)
      }
      if (_references.length) {
        let result = ''
        for (let ref of _references) {
          result = result + ref + '\r\n'
        }
        return result
      }
      // return _references
    },
    getDataDisplayRef: function (reference) {
      return this.parseReference(reference)
    },
    getConfidence: function (value, key, item) {
      if (Object.prototype.hasOwnProperty.call(item, 'cerqual')) {
        if (Object.prototype.hasOwnProperty.call(item.cerqual, 'option') && item.cerqual.option != null) {
          return this.cerqual_confidence[item.cerqual.option].text
        }
      }
      return ''
    },
    loadRefs: function (event) {
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        this.pre_references = e.target.result
      }
      reader.readAsText(file)
    },
    saveReferences: function () {
      const references = this.references
      let axiosArray = []
      for (let ref of references) {
        ref.organization = this.$route.params.org_id
        ref.project_id = this.$route.params.id
        let newPromise = axios({
          method: 'POST',
          url: `/api/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`,
          data: ref
        })
        axiosArray.push(newPromise)
      }
      axios.all(axiosArray)
        .then(axios.spread((...responses) => {
          responses.forEach(res => console.log('Success'))
          // console.log('submitted all axios calls')
          this.pre_references = ''
          this.references = []
        }))
        .catch((error) => {
          console.log('error', error)
        })
    },
    getProject: function () {
      const params = {
        organization: this.$route.params.org_id
      }
      axios.get(`/api/isoqf_projects/${this.$route.params.id}`, { params })
        .then((response) => {
          this.project = response.data
          this.getLists() // summary review
        })
        .catch((error) => {
          console.log(error)
        })
    },
    getLists: function () { // related to summary review of a finding
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get('/api/isoqf_lists', { params })
        .then((response) => {
          this.lists = JSON.parse(JSON.stringify(response.data))
          if (this.lists.length) {
            let lists = JSON.parse(JSON.stringify(this.lists))
            this.lastId = parseInt(lists.splice(lists.length - 1, 1)[0].isoqf_id) + 1
            for (let list of this.lists) {
              if (!Object.prototype.hasOwnProperty.call(list, 'references')) {
                list.references = []
              }
              list.cerqual_option = list.cerqual.option
              list.cerqual_explanation = list.cerqual.explanation
              list.ref_list = []
              for (let r of this.references) {
                for (let ref of list.references) {
                  if (ref === r.id) {
                    list.ref_list.push(this.parseReference(r))
                  }
                }
              }
            }
          }
          this.table_settings.isBusy = false
          this.table_settings.totalRows = this.lists.length
        })
        .catch((error) => {
          console.log(error)
        })
    },
    modalAddSummarized: function () {
      this.$refs['add-summarized'].show()
    },
    saveSummarized: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id,
        name: this.summarized_review,
        isoqf_id: this.lastId,
        cerqual: { option: null, explanation: '' },
        references: []
      }
      axios.post('/api/isoqf_lists/', params)
        .then((response) => {
          const listId = response.data.id
          const listName = response.data.name

          this.getLists()
          this.createFinding(listId, listName)
          this.summarized_review = ''
        })
        .catch((error) => {
          console.log(error)
        })
    },
    createFinding: function (listId, listName) {
      const params = {
        organization: this.$route.params.org_id,
        list_id: listId,
        name: listName,
        isoqf_id: this.lastId,
        evidence_profile: {
          name: listName,
          isoqf_id: this.lastId,
          relevance: {
            explanation: '',
            option: null
          },
          adequacy: {
            explanation: '',
            option: null
          },
          coherence: {
            explanation: '',
            option: null
          },
          methodological_limitations: {
            explanation: '',
            option: null
          },
          cerqual: {
            explanation: '',
            option: null
          }
        },
        references: []
      }
      axios.post('/api/isoqf_findings', params)
        .then((response) => {
          this.lastId = this.lastId + 1
          // console.log(response)
        })
        .catch((error) => {
          console.log(error)
        })
    },
    openModalReferencesSingle: function (showModal) {
      axios.get(`/api/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`)
        .then((response) => {
          this.references = response.data
          if (showModal) {
            this.$refs['modal-references'].show()
          }
        })
        .catch((error) => {
          console.log(error)
        })
    },
    openModalReferences: function (index) {
      this.selected_list_index = index
      axios.get(`/api/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`)
        .then((response) => {
          this.references = response.data
          this.selected_references = this.lists[this.selected_list_index].references
          this.$refs['modal-references-list'].show()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    saveReferencesList: function () {
      this.table_settings.isBusy = true
      const params = {
        references: this.selected_references
      }
      axios.patch(`/api/isoqf_lists/${this.lists[this.selected_list_index].id}`, params)
        .then((response) => {
          this.selected_references = []
          this.selected_list_index = null
          this.getLists()
        })
    },
    onFiltered (filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.table_settings.totalRows = filteredItems.length
      this.table_settings.currentPage = 1
    }
  }
}
</script>

<style scoped>
  div >>>
    #findings.table thead th {
      width: 24%;
    }
  div >>>
    #findings.table thead th:first-child {
      width: 4%;
    }
  div >>>
    #findings.table tbody td li {
      font-size: 0.8rem;
      padding-top: 0.4rem;
      list-style-type: none;
    }
</style>
