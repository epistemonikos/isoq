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
      <b-row>
        <b-col cols="12">
          <h1>{{project.name}}</h1>
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
          <p>{{(project.published_status) ? 'Yes': 'No'}}</p>
          <h5>Is the iSoQf being completed by the review authors?</h5>
          <p>{{(project.complete_by_author) ? 'Yes' : 'No'}}</p>
        </b-col>
        <b-col cols="12" class="text-right my-2">
          <b-button
            variant="outline-primary"
            @click="modalAddSummarized">
            Add finding
          </b-button>
        </b-col>
        <b-col cols="12">
          <template v-if="lists.length">
            <b-table
              :fields="table_settings.fields"
              :items="lists">
              <template slot="[index]" slot-scope="data">{{data.index + 1}}</template>
              <template slot="[name]" slot-scope="data">
                <b-link :to="{name: 'editList', params: {id: data.item.id}}">{{data.item.name}}</b-link>
              </template>
              <template slot="[confidence]" slot-scope="data" v-if="data.item.hasOwnProperty('cerqual') && data.item.cerqual.option !== null">
                {{cerqual_confidence[data.item.cerqual.option].text}}
              </template>
              <template slot="[explanation]" slot-scope="data" v-if="data.item.hasOwnProperty('cerqual') && data.item.cerqual.explanation !== null">
                {{data.item.cerqual.explanation}}
              </template>
              <template slot="[references]" slot-scope="data">
                <b-button
                  @click="openModalReferences(data.item.id)">Add references</b-button>
              </template>
            </b-table>
          </template>
          <template v-else>
            <p>No data found. try to <b-link v-b-modal.add-summarized>add summarized</b-link> review finding.</p>
          </template>
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
            @ok="saveReferences">
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
      table_settings: {
        fields: [
          {
            key: 'index',
            label: '#'
          },
          {
            key: 'name',
            label: 'Summarized review finding'
          },
          {
            key: 'confidence',
            label: 'CERQual Assessment of confidence'
          },
          {
            key: 'explanation',
            label: 'Explanation of CERQual Assessment'
          },
          {
            key: 'references',
            label: 'References'
          }
        ]
      },
      summarized_review: '',
      select_options: [
        {value: 0, text: 'No/Minor concerns'},
        {value: 1, text: 'Minor concerns'},
        {value: 2, text: 'Moderated concerns'},
        {value: 3, text: 'Serious concerns'}
      ],
      cerqual_confidence: [
        {value: 0, text: 'High confidence'},
        {value: 1, text: 'Moderate confidence'},
        {value: 2, text: 'Low confidence'},
        {value: 3, text: 'Very low confidence'}
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
              } else if (value.length < 2) {
                return value[0] + ',' + value[1]
              } else {
                return value[0] + ' et al.'
              }
            }
          },
          {key: 'publication_year', label: 'Year'}
        ],
      selected_list_id: ''
    }
  },
  mounted () {
    this.getProject()
  },
  watch: {
    pre_references: function (data) {
      this.references = []
      const file = data
      const allLines = file.split(/\r\n|\n/)
      // Reading line by line
      let titleTags = ['TI', 'T1', 'T2', 'T3']
      let authorTags = ['AU', 'A1', 'A2', 'A3', 'A4']
      let userDefinable = ['U1', 'U2', 'U3', 'U4', 'U5']
      let content = ''
      let key = ''
      let base = {authors: [], user_definable: []}

      allLines.forEach((line) => {
        key = line.split('  - ')[0]
        content = line.split('  - ')[1]

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
          base = {authors: [], user_definable: []}
        }
      })
    }
  },
  methods: {
    loadRefs: function (event) {
      let file = event.target.files[0]
      let reader = new FileReader()
      reader.onload = (e) => {
        this.pre_references = e.target.result
      }
      reader.readAsText(file)
    },
    saveReferences: function () {
      let references = this.references
      let axiosArray = []
      for (let ref of references) {
        ref.organization = this.$route.params.org_id
        ref.list_id = this.selected_list_id
        let newPromise = axios({
          method: 'POST',
          url: `/api/isoqf_references?organization=${this.$route.params.org_id}`,
          data: ref
        })
        axiosArray.push(newPromise)
      }
      axios.all(axiosArray)
        .then(axios.spread((...responses) => {
          responses.forEach(res => console.log('Success'))
          console.log('submitted all axios calls')
          this.pre_references = ''
          this.references = []
        }))
        .catch((error) => {
          console.log('error', error)
        })
    },
    getProject: function () {
      let params = {
        organization: this.$route.params.org_id
      }
      axios.get(`/api/isoqf_projects/${this.$route.params.id}`, {params})
        .then((response) => {
          this.project = response.data
          this.getLists() // summary review
        })
        .catch((error) => {
          console.log(error)
        })
    },
    getLists: function () { // related to summary review of a finding
      let params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get(`/api/isoqf_lists`, {params})
        .then((response) => {
          this.lists = response.data
        })
        .catch((error) => {
          console.log(error)
        })
    },
    modalAddSummarized: function () {
      this.$refs['add-summarized'].show()
    },
    saveSummarized: function () {
      let params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id,
        name: this.summarized_review
      }
      axios.post('/api/isoqf_lists/', params)
        .then((response) => {
          let listId = response.data.id
          let listName = response.data.name

          this.getLists()
          this.createFinding(listId, listName)
        })
        .catch((error) => {
          console.log(error)
        })
    },
    createFinding: function (listId, listName) {
      let params = {
        organization: this.$route.params.org_id,
        list_id: listId,
        name: listName,
        evidence_profile: {
          name: listName,
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
          }
        }
      }
      axios.post(`/api/isoqf_findings`, params)
        .then((response) => {
          console.log(response)
        })
        .catch((error) => {
          console.log(error)
        })
    },
    openModalReferences: function (listId) {
      this.selected_list_id = listId
      axios.get(`/api/isoqf_references?organization=${this.$route.params.org_id}&list_id=${listId}`)
        .then((response) => {
          console.log(response.data)
          this.references = response.data
          this.$refs['modal-references'].show()
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
