<template>
  <div class="d-inline">
    <b-button
      v-if="item.is_owner"
      title="Remove"
      variant="outline-danger"
      @click="modalRemoveProject(item)">
      <font-awesome-icon
        icon="trash"></font-awesome-icon>
    </b-button>

    <b-modal
      id="modal-remove-project"
      ref="modal-remove-project"
      title="Delete project"
      @ok="removeProject"
      @cancel="cleanProject"
      ok-title="Remove"
      ok-variant="outline-danger"
      cancel-variant="outline-secondary">
      <p>Are you sure you wanna remove "<b>{{this.buffer_project.name}}</b>" and all the data related?</p>
    </b-modal>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'removeProject',
  props: {
    item: Object,
    projects: Array
  },
  data () {
    return {
      ui: {
        projectTable: {
          isBusy: true
        }
      },
      buffer_project: {
        id: null,
        name: '',
        description: '',
        private: true,
        public_type: 'private',
        organization: this.$route.params.id,
        review_question: '',
        published_status: false,
        complete_by_author: true,
        url_doi: null,
        authors: '',
        lists_authors: '',
        author: '',
        author_email: '',
        is_public: false,
        sharedType: 0,
        sharedTo: '',
        sharedToError: '',
        sharedTokenOnOff: false,
        sharedToken: '',
        sharedCan: {
          read: [],
          write: []
        },
        temporaryUrl: '',
        invite_emails: [],
        tmp_invite_emails: []
      },
      tmp_buffer_project: {
        id: null,
        name: '',
        description: '',
        private: true,
        public_type: 'private',
        organization: this.$route.params.id,
        review_question: '',
        published_status: false,
        complete_by_author: true,
        url_doi: null,
        authors: '',
        lists_authors: '',
        author: '',
        author_email: '',
        is_public: false,
        sharedType: 0,
        sharedTo: '',
        sharedToError: '',
        sharedTokenOnOff: false,
        sharedToken: '',
        sharedCan: {
          read: [],
          write: []
        },
        temporaryUrl: '',
        invite_emails: [],
        tmp_invite_emails: []
      }
    }
  },
  methods: {
    modalRemoveProject: function (project) {
      this.buffer_project = JSON.parse(JSON.stringify(project))
      this.$refs['modal-remove-project'].show()
    },
    removeProject: function () {
      this.ui.projectTable.isBusy = true
      const params = {
        organization: this.$route.params.id,
        project_id: this.buffer_project.id
      }
      axios.get('/api/isoqf_lists', { params })
        .then((response) => {
          let requestsLists = []
          const lists = response.data
          for (let list of lists) {
            this.getFindings(list.id)
            requestsLists.push(axios.delete(`/api/isoqf_lists/${list.id}`))
          }
          this.processRequests(requestsLists)
        })
        .catch((error) => {
          console.log(error)
        })
      axios.get('/api/isoqf_list_categories', { params })
        .then((response) => {
          let requestsCategories = []
          const categories = response.data
          for (let category of categories) {
            requestsCategories.push(axios.delete(`/api/isoqf_list_categories/${category.id}`))
          }
          this.processRequests(requestsCategories)
        })
      axios.get('/api/isoqf_references', { params })
        .then((response) => {
          let referencesRequests = []
          const references = response.data
          for (let reference of references) {
            referencesRequests.push(axios.delete(`/api/isoqf_references/${reference.id}`))
          }
          this.processRequests(referencesRequests)
        })
        .catch((error) => {
          console.log(error)
        })
      axios.get('/api/isoqf_assessments', { params })
        .then((response) => {
          let requestsAssessments = []
          const methAssessments = response.data
          for (let methAssessment of methAssessments) {
            requestsAssessments.push(axios.delete(`/api/isoqf_assessments/${methAssessment.id}`))
          }
          this.processRequests(requestsAssessments)
        })
        .catch((error) => {
          console.log(error)
        })
      axios.get('/api/isoqf_characteristics', { params })
        .then((response) => {
          let requestsCharacteristics = []
          const charOfStudies = response.data
          for (let charOfStudy of charOfStudies) {
            requestsCharacteristics.push(axios.delete(`/api/isoqf_characteristics/${charOfStudy.id}`))
          }
          this.processRequests(requestsCharacteristics)
        })
        .catch((error) => {
          console.log(error)
        })
      axios.delete(`/api/isoqf_projects/${this.buffer_project.id}`)
        .then(() => {
          this.$emit('getProjects')
          this.ui.projectTable.isBusy = false
        })
        .catch((error) => {
          console.log(error)
        })
    },
    getFindings: function (id) {
      const params = {
        organization: this.$route.params.id,
        list_id: id
      }
      axios.get('/api/isoqf_findings', { params })
        .then((response) => {
          if (response.data.length) {
            let requestsFindings = []
            const findings = response.data
            for (let finding of findings) {
              this.getExtractedData(finding.id)
              requestsFindings.push(axios.delete(`/api/isoqf_findings/${finding.id}`))
            }
            this.processRequests(requestsFindings)
          }
        })
    },
    getExtractedData: function (id) {
      const params = {
        organization: this.$route.params.id,
        finding_id: id
      }
      axios.get('/api/isoqf_extracted_data', { params })
        .then((response) => {
          let requestsExtractedData = []
          const extractedData = response.data
          for (let data of extractedData) {
            requestsExtractedData.push(axios.delete(`/api/isoqf_extracted_data/${data.id}`))
          }
          this.processRequests(requestsExtractedData)
        })
        .catch((error) => {
          console.log(error)
        })
    },
    cleanProject: function () {
      this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
    },
    processRequests: function (requests) {
      axios.all(requests)
        .then()
        .catch((error) => {
          console.log(error)
        })
    }
  }
}
</script>

<style>

</style>
