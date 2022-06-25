<template>
  <div>
    <b-button
      v-if="item.is_owner || item.allow_to_write"
      title="Duplicate"
      variant="outline-secondary"
      @click="openCloneModal(item.id)">
      <font-awesome-icon
        icon="copy"></font-awesome-icon>
    </b-button>

    <b-modal
      id="clone-modal"
      title="Duplicate a project"
      ok-title="Duplicate"
      cancel-title="Close"
      @ok="startCloning"
      @cancel="closeCloneModal"
      :cancel-disabled="this.ui.copy.project || this.ui.copy.lists || this.ui.copy.references || this.ui.copy.findings || this.ui.copy.replaceReferences || this.ui.copy.copyOf || this.ui.copy.referencesTable"
      :ok-disabled="((this.ui.copy.project || this.ui.copy.lists || this.ui.copy.references || this.ui.copy.findings || this.ui.copy.replaceReferences || this.ui.copy.copyOf || this.ui.copy.referencesTable) || this.ui.copy.showWarning)"
      no-close-on-backdrop
      no-close-on-esc>
      <template v-if="modalCloneId != null">
        <p>
          Click on the "duplicate" button to start making a copy of the project "<b>{{buffer_project.name}}</b>".
          <br>
          The content of the duplicate will be identical to the original but it will not be shared with other users automatically.
          <br>
          Use the "share" button to share the duplicated project.
        </p>
      </template>
      <template v-if="(this.ui.copy.project || this.ui.copy.lists || this.ui.copy.references || this.ui.copy.findings || this.ui.copy.replaceReferences || this.ui.copy.copyOf || this.ui.copy.referencesTable) && this.ui.copy.showWarning">
        <div
          class="text-center">
          <b-spinner
            class="text-center"
            label="Loading..." variant="secondary"></b-spinner>
        </div>
      </template>
      <template v-if="!(this.ui.copy.project || this.ui.copy.lists || this.ui.copy.references || this.ui.copy.findings || this.ui.copy.replaceReferences || this.ui.copy.copyOf || this.ui.copy.referencesTable) && this.ui.copy.showWarning">
        <p class="text-center text-success">Duplicate complete. You can now close this modal.</p>
      </template>
    </b-modal>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'cloneProject',
  props: {
    item: Object,
    projects: Array
  },
  data () {
    return {
      ui: {
        copy: {
          project: false,
          lists: false,
          references: false,
          findings: false,
          replaceReferences: false,
          copyOf: false,
          referencesTable: false,
          showWarning: null,
          disableCloneModalBtn: false
        }
      },
      modalCloneId: null,
      modalCloneNewId: null,
      buffer_project: {
        references: []
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
      },
      newReferences: []
    }
  },
  methods: {
    openCloneModal: function (id) {
      this.buffer_project = {references: []}
      for (let p of this.projects) {
        if (p.id === id) {
          this.buffer_project = p
        }
      }
      this.modalCloneId = id
      this.$bvModal.show('clone-modal')
    },
    startCloning: function (event) {
      event.preventDefault()
      this.ui.copy.showWarning = true
      this.ui.copy.disableCloneModalBtn = true

      if (this.modalCloneId !== null || this.modalCloneId !== '') {
        this.generateACopyOfAProject(this.modalCloneId)
      }
    },
    closeCloneModal: function () {
      this.modalCloneId = null
      this.modalCloneNewId = null
      this.ui.copy.showWarning = null
      this.ui.copy.disableCloneModalBtn = false
      this.buffer_project = this.tmp_buffer_project
      this.$bvModal.hide('clone-modal')
    },
    generateACopyOfAProject: function () {
      this.ui.copy.project = true
      let newProject = JSON.parse(JSON.stringify(this.buffer_project))
      const originalProject = JSON.parse(JSON.stringify(this.buffer_project))
      delete newProject.id
      delete newProject._id
      newProject.name = '(Copy of) ' + newProject.name
      newProject.sharedCan = {read: [], write: []}
      newProject.temporaryUrl = ''
      newProject.invite_emails = []
      newProject.tmp_invite_emails = []
      newProject.is_owner = true
      newProject.organization = this.$route.params.id
      newProject.created_at = Date.now()
      newProject.can_write = []
      newProject.can_read = []
      newProject.private = true
      newProject.is_public = false
      axios.post('/api/isoqf_projects', newProject)
        .then((response) => {
          this.modalCloneNewId = response.data.id
          this.generateCopyOfReferences(originalProject, response.data)
          this.generateCopyOfCategories(originalProject)
          this.ui.copy.project = false
        })
        .catch((error) => {
          this.displayErrors(error)
        })
    },
    generateCopyOfReferences: function (originalProject, project) {
      this.ui.copy.references = true
      const params = {
        organization: originalProject.organization,
        project_id: originalProject.id
      }
      axios.get('/api/isoqf_references', {params})
        .then((response) => {
          let newReferences = []
          if (response.data.length < 1) {
            this.ui.copy.references = false
          }
          for (let reference of response.data) {
            let modifiedRef = JSON.parse(JSON.stringify(reference))
            modifiedRef.oldId = reference.id
            modifiedRef.project_id = project.id
            modifiedRef.organization = this.$route.params.id
            delete modifiedRef.id
            delete modifiedRef._id
            newReferences.push(modifiedRef)
          }
          if (newReferences.length) {
            let postReferences = []
            for (let reference of newReferences) {
              postReferences.push(axios.post('/api/isoqf_references', reference))
            }
            axios.all(postReferences)
              .then((responses) => {
                this.buffer_project.references = []
                for (let response of responses) {
                  this.buffer_project.references.push(response.data)
                  this.newReferences.push(response.data)
                }
              })
              .then(() => {
                this.ui.copy.references = false
                this.generateCopyOfLists(originalProject, project)
                this.generateCopyOf('isoqf_assessments', originalProject, project)
                this.generateCopyOf('isoqf_characteristics', originalProject, project)
                // this.getProjects()
                this.$emit('getProjects')
              })
          }
        })
    },
    generateCopyOfCategories: function (originalProject) {
      const params = {
        project_id: originalProject.id,
        organization: originalProject.organization
      }
      axios.get('/api/isoqf_list_categories', {params})
        .then((response) => {
          for (let category of response.data) {
            let modifiedCategory = JSON.parse(JSON.stringify(category))
            modifiedCategory.oldId = modifiedCategory.id
            delete modifiedCategory.id
            delete modifiedCategory._id
            modifiedCategory.project_id = this.modalCloneNewId
            modifiedCategory.organization = this.$route.params.id
            axios.post('/api/isoqf_list_categories', modifiedCategory)
          }
        })
        .catch((error) => {
          this.displayErrors(error)
        })
    },
    generateCopyOfLists: function (originalProject, newProject) {
      this.ui.copy.lists = true
      const params = {
        project_id: originalProject.id,
        organization: originalProject.organization
      }
      axios.get('/api/isoqf_lists', {params})
        .then((response) => {
          if (response.data.length < 1) {
            this.ui.copy.lists = false
          }
          for (let list of response.data) {
            let modifiedList = JSON.parse(JSON.stringify(list))
            const originalList = JSON.parse(JSON.stringify(list))
            delete modifiedList.id
            delete modifiedList._id
            modifiedList.project_id = newProject.id
            modifiedList.organization = this.$route.params.id
            for (let reference of this.buffer_project.references) {
              let i = modifiedList.references.indexOf(reference.oldId)
              if (i !== -1) {
                modifiedList.references[i] = reference.id
              }
            }
            axios.post('/api/isoqf_lists', modifiedList)
              .then((response) => {
                this.generateCopyOfFindings(originalList, response.data)
                this.replaceReferences(response.data)
                this.replaceCategory(response.data)
                this.ui.copy.lists = false
              })
          }
        })
    },
    generateCopyOf: function (table, originalProject, project) {
      this.ui.copy.copyOf = true
      let params = {
        organization: originalProject.organization,
        project_id: originalProject.id
      }
      if (table === 'isoqf_extracted_data') {
        params = {
          organization: originalProject.organization,
          finding_id: originalProject.id
        }
      }
      axios.get(`/api/${table}`, {params})
        .then((response) => {
          if (response.data.length < 1) {
            this.ui.copy.copyOf = false
          }
          let q = []
          for (let data of response.data) {
            let modifiedData = JSON.parse(JSON.stringify(data))
            delete modifiedData.id
            delete modifiedData._id
            modifiedData.organization = this.$route.params.id
            if (table === 'isoqf_extracted_data') {
              modifiedData.finding_id = project.id
              modifiedData.list_id = project.list_id
            } else {
              modifiedData.project_id = project.id
            }
            q.push(axios.post(`/api/${table}`, modifiedData))
          }
          axios.all(q)
            .then((responses) => {
              for (let response of responses) {
                this.replaceReferencesTable(table, response.data)
              }
            })
            .then(() => {
              this.ui.copy.copyOf = false
            })
        })
    },
    generateCopyOfFindings: function (originalList, newList) {
      this.ui.copy.findings = true
      const params = {
        organization: originalList.organization,
        list_id: originalList.id
      }
      axios.get('/api/isoqf_findings', {params})
        .then((response) => {
          if (response.data.length < 1) {
            this.ui.copy.findings = false
          }
          for (let finding of response.data) {
            let modifiedFinding = JSON.parse(JSON.stringify(finding))
            const originalFinding = JSON.parse(JSON.stringify(finding))
            delete modifiedFinding.id
            delete modifiedFinding._id
            modifiedFinding.organization = this.$route.params.id
            modifiedFinding.list_id = newList.id
            if (Object.prototype.hasOwnProperty.call(modifiedFinding, 'evidence_profile')) {
              if (Object.prototype.hasOwnProperty.call(modifiedFinding.evidence_profile, 'references')) {
                for (let nr of this.newReferences) {
                  for (let ref in modifiedFinding.evidence_profile.references) {
                    if (nr.oldId === modifiedFinding.evidence_profile.references[ref]) {
                      modifiedFinding.evidence_profile.references[ref] = nr.id
                    }
                  }
                }
              }
            }
            axios.post('/api/isoqf_findings', modifiedFinding)
              .then((response) => {
                this.generateCopyOf('isoqf_extracted_data', originalFinding, response.data)
                this.ui.copy.findings = false
              })
          }
        })
    },
    replaceReferences: function (newList) {
      this.ui.copy.replaceReferences = true
      const params = {
        organization: newList.organization,
        project_id: this.modalCloneId// newList.project_id
      }
      axios.get('/api/isoqf_references', {params})
        .then((response) => {
          if (response.data.length < 1) {
            this.ui.copy.replaceReferences = false
          }
          if (newList.references.length) {
            for (let reference of response.data) {
              let index = newList.references.indexOf(reference.oldId)
              if (index !== -1) {
                newList.references[index] = reference.id
              }
            }
            axios.patch(`/api/isoqf_lists/${newList.id}`, {references: newList.references})
              .then(() => {
                this.ui.copy.replaceReferences = false
              })
          } else {
            this.ui.copy.replaceReferences = false
          }
        })
    },
    replaceCategory: function (newList) {
      const params = {
        organization: newList.organization,
        project_id: newList.project_id
      }
      axios.get('/api/isoqf_list_categories', params)
        .then((response) => {
          for (let category of response.data) {
            if (category.oldId === newList.category) {
              axios.patch('/api/isoqf_lists/' + newList.id, {category: category.id})
            }
          }
        })
    },
    replaceReferencesTable: function (table, data) {
      this.ui.copy.referencesTable = true
      let params = {
        organization: data.organization,
        project_id: data.project_id
      }
      if (table === 'isoqf_extracted_data') {
        params.project_id = this.modalCloneNewId
      }
      axios.get('/api/isoqf_references', {params})
        .then((response) => {
          if (data.items.length) {
            for (let reference of response.data) {
              for (let item of data.items) {
                if (reference.oldId === item.ref_id) {
                  item.ref_id = reference.id
                }
              }
            }
            axios.patch(`/api/${table}/${data.id}`, {items: data.items})
              .then(() => {
                this.ui.copy.referencesTable = false
              })
          }
        })
    },
    displayErrors: function (error) {
      if (error.response) {
        // Request made and server responded
        console.log(error.response.data)
        console.log(error.response.status)
        console.log(error.response.headers)
      } else if (error.request) {
        // The request was made but no response was received
        console.log('Request', error.request)
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message)
      }
    }
  }
}
</script>

<style>

</style>
