<template>
  <div class="mt-4">
    <b-container>
      <b-row>
        <b-col cols="12">
          <h2>{{ (org.name === 'My frameworks') ? 'My iSoQf' : org.name }}</h2>
          <p>{{ org.description }}</p>
        </b-col>
      </b-row>
      <div class="my-4">
        <h3>{{ $t("Projects") }}</h3>
        <b-row align-h="end">
          <b-col cols="12" class="text-right">
            <b-button v-b-tooltip.hover title="Create a new Interactive Summary of Qualitative Findings Table" variant="outline-primary" v-b-modal.new-project>{{ $t("Add new project") }}</b-button>
          </b-col>
        </b-row>
        <b-row
          class="mt-3">
          <b-col
            cols="12">
            <b-table
              id="organizations"
              responsive
              striped
              bordered
              borderless
              hover
              head-variant="light"
              :busy="projectTable.isBusy"
              :fields="projectTable.fields"
              :items="org.projects">
              <template v-slot:cell(private)="data">
                <font-awesome-icon
                  v-if="!data.item.private"
                  icon="globe"
                  title="Public"></font-awesome-icon>
              </template>
              <template v-slot:cell(name)="data">
                <b-link :to="{name: 'viewProject', params: {org_id: org.id, id: data.item.id}}">{{ data.item.name }}</b-link>
              </template>
              <template v-slot:cell(actions)="data">
                <b-button
                  title="Edit"
                  variant="outline-success"
                  @click="openModalEditProject(data.item)">
                  <font-awesome-icon
                    icon="edit"></font-awesome-icon>
                </b-button>
                <b-button
                  title="Remove"
                  variant="outline-danger"
                  @click="modalRemoveProject(data.item)">
                  <font-awesome-icon
                    icon="trash"></font-awesome-icon>
                </b-button>
              </template>
              <template v-slot:table-busy>
                <div class="text-center text-danger my-2">
                  <b-spinner class="align-middle"></b-spinner>
                  <strong>Loading...</strong>
                </div>
              </template>
            </b-table>
          </b-col>
        </b-row>
      </div>
      <!-- modals -->
      <b-modal
        scrollable
        id="new-project"
        ref="new-project"
        :title="(buffer_project.id) ? 'Edit iSoQf table' : 'New iSoQf table'"
        @ok="AddProject"
        @cancel="closeModalProject"
        :ok-disabled="!buffer_project.name"
        ok-title="Save"
        ok-variant="outline-success"
        cancel-variant="outline-secondary">
        <b-alert
          :show="ui.dismissCounters.dismissCountDown"
          @dismiss-count-down="countDownChanged"
          variant="danger"
          v-if="ui.error.status">
            <p>[{{ui.error.status}}] - {{ui.error.statusText}}</p>
            <p>This alert will dismiss after {{ this.ui.dismissCounters.dismissCountDown }} seconds...</p>
          </b-alert>
        <b-form-group
          :label="$t('Title of review')"
          label-for="input-project-list-name"
          description="Insert the title that you plan to use for this report or paper.">
          <b-form-input
            id="input-project-list-name"
            type="text"
            required
            :placeholder="$t('Title of review')"
            v-model="buffer_project.name"></b-form-input>
        </b-form-group>
        <b-form-group
          :label="$t('Authors')"
          label-for="input-project-authors"
          description="First then last name of all authors separated by commas">
          <b-form-input
            id="input-project-authors"
            :placeholder="$t('Authors of review')"
            v-model="buffer_project.authors"></b-form-input>
        </b-form-group>
        <b-form-group
          :label="$t('Review question')"
          label-for="input-project-review-question">
          <b-form-input
            id="input-project-review-question"
            :placeholder="$t('Insert main question that the review addresses')"
            v-model="buffer_project.review_question"></b-form-input>
        </b-form-group>
        <b-form-group
          :label="$t('Has this review been published?')"
          label-for="select-project-list-published-status">
          <b-select
            id="select-project-list-published-status"
            v-model="buffer_project.published_status"
            :options="yes_or_no"></b-select>
        </b-form-group>
        <b-form-group
          v-if="buffer_project.published_status"
          :label="$t('URL or DOI')"
          label-for="select-project-list-url-doi">
          <b-input
            placeholder="https://doi.org/10.1109/5.771073"
            type="url"
            id="select-project-list-url-doi"
            v-model="buffer_project.url_doi"></b-input>
        </b-form-group>
        <b-form-group
          :label="$t('Is the iSoQf being completed by the review authors?')"
          label-for="select-project-list-completed-by-author-status">
          <b-select
            id="select-project-list-completed-by-author-status"
            v-model="buffer_project.complete_by_author"
            :options="yes_or_no"></b-select>
        </b-form-group>
        <b-form-group
          v-if="!buffer_project.complete_by_author"
          label="Please list the authors of this iSoQf"
          label-for="input-project-list-authors">
          <b-form-input
            id="input-project-list-authors"
            v-model="buffer_project.lists_authors"></b-form-input>
        </b-form-group>
        <b-form-group
          label="Visibility on the iSoQf database"
          label-for="select-project-list-status"
          description="When you finish your iSoQf you can publish some, or all of it, to the iSoQf database. Until you are finished, keep it “private”. You can change these settings at any time.">
          <b-select
            id="select-project-list-status"
            v-model="buffer_project.private"
            :options="global_status"></b-select>
        </b-form-group>
        <b-form-group
          label="Aditional information"
          label-for="input-project-list-description">
          <b-form-textarea
            id="input-project-list-description"
            placeholder="Add any additional information important to your review, for example, if it was part of a guidelines process or commissioned by an organization or government"
            v-model="buffer_project.description"
            rows="3"></b-form-textarea>
        </b-form-group>
      </b-modal>
      <b-modal
        id="new-project-list"
        ref="new-project-list"
        :title="(buffer_project_list.id) ? 'Edit summarized review finding' : 'New summarized review finding'"
        @ok="AddOrUpdateProjectList"
        @hidden="cleanProjectList"
        ok-title="Save"
        ok-variant="outline-success"
        cancel-variant="outline-secondary">
        <b-form-group
          label="Summarized review"
          label-for="summarized-review">
          <b-form-input
            id="summarized-review"
            placeholder="Enter a summarized review finding"
            v-model="buffer_project_list.name"></b-form-input>
        </b-form-group>
      </b-modal>
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
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data () {
    return {
      project_id: '',
      organization: '',
      ui: {
        error: {
          status: '',
          statusText: ''
        },
        dismissCounters: {
          dismisSec: 10,
          dismissCountDown: 0
        }
      },
      global_status: [
        { value: 'private', text: 'Private - Your iSoQf is not publicly available on the iSoQf database' },
        { value: 'fully', text: 'Fully Public - Your iSoQf table, Evidence Profile, and GRADE CERQual Worksheets are publicly available on the iSoQf database' },
        { value: 'partially', text: 'Partially Public - Your iSoQf table and Evidence Profile are publicly available on the iSoQf database' },
        { value: 'minimally', text: 'Minimally Public - Your iSoQf table is available on the iSoQf database' }
      ],
      yes_or_no: [
        { value: false, text: 'no' },
        { value: true, text: 'yes' }
      ],
      tmp_buffer_project: {
        id: null,
        name: '',
        description: '',
        private: true,
        organization: this.$route.params.id,
        review_question: '',
        published_status: false,
        complete_by_author: true,
        url_doi: null,
        authors: '',
        lists_authors: ''
      },
      tmp_buffer_project_list: {
        id: null,
        name: '',
        organization: this.$route.params.id,
        project_id: ''
      },
      buffer_project: {
        id: null,
        name: '',
        description: '',
        private: 'private',
        organization: this.$route.params.id,
        review_question: '',
        published_status: false,
        complete_by_author: true,
        url_doi: null,
        authors: '',
        lists_authors: ''
      },
      buffer_project_list: {
        id: null,
        name: '',
        organization: this.$route.params.id,
        project_id: ''
      },
      org: {
        _id: '',
        groups: [],
        hidden_base_templates: [],
        id: '',
        logo_url: '',
        name: '',
        organization: '',
        personal_organization: '',
        project_order: [],
        warning_message: '',
        plan: '',
        projects: []
      },
      projectTable: {
        fields: [
          { key: 'private', label: '' },
          { key: 'name', label: 'Title' },
          { key: 'actions', label: '' }
        ],
        isBusy: true
      }
    }
  },
  mounted () {
    this.getOrganization()
  },
  methods: {
    getOrganization: function () {
      axios.get(`/api/organizations/${this.$route.params.id}`)
        .then((response) => {
          this.org = {...response.data}
          this.getProjectsAndLists()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    AddProject: function () {
      this.projectTable.isBusy = true
      if (this.buffer_project.id) {
        delete this.buffer_project.lists
        axios.patch(`/api/isoqf_projects/${this.buffer_project.id}`, this.buffer_project)
          .then((response) => {
            this.buffer_project = this.tmp_buffer_project
            this.getProjectsAndLists()
          })
          .catch((error) => {
            console.log(error)
          })
      } else {
        axios.post('/api/isoqf_projects', this.buffer_project)
          .then((response) => {
            this.buffer_project = this.tmp_buffer_project
            this.$refs['new-project'].hide()
            this.getProjectsAndLists()
          })
          .catch((error) => {
            this.ui.dismissCounters.dismissCountDown = this.ui.dismissCounters.dismisSec
            console.log('error', error)
            this.$refs['new-project'].show()
          })
      }
    },
    countDownChanged (dismissCountDown) {
      this.ui.dismissCounters.dismissCountDown = dismissCountDown
    },
    ModalAddList: function (idProject) {
      this.buffer_project_list.project_id = idProject
      this.$refs['new-project-list'].show()
    },
    AddOrUpdateProjectList: function () {
      if (this.buffer_project_list.id) {
        this.updateProjectList()
      } else {
        axios.post('/api/isoqf_lists', this.buffer_project_list, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': document.location.origin
          }
        })
          .then((response) => {
            this.buffer_project = this.tmp_buffer_project
            this.$refs['new-project-list'].hide()
            // get project lists
            this.buffer_project_list = this.tmp_buffer_project_list
            this.getProjectsAndLists()
          })
          .catch((error) => {
            this.ui.dismissCounters.dismissCountDown = this.ui.dismissCounters.dismisSec
            console.log('error list', error)
            this.$refs['new-project-list'].show()
          })
      }
    },
    getProjectsAndLists: function () {
      axios.all([
        axios.get('/api/isoqf_projects', {
          params: {
            organization: this.$route.params.id
          }
        }),
        axios.get('/api/isoqf_lists', {
          params: {
            organization: this.$route.params.id
          }
        })
      ]).then(axios.spread((projects, lists) => {
        this.$set(this.org, 'projects', projects.data)
        var projectlist = lists.data

        projects.data.forEach(function (v, k) {
          projects.data[k].lists = []
          // this.$set(projects.data[k], 'list', [])
          for (const pos in projectlist) {
            if (projects.data[k].id === projectlist[pos].project_id) {
              projects.data[k].lists.push(projectlist[pos])
            }
          }
        })
        this.projectTable.isBusy = false
      }))
    },
    editProjectList: function (projectPosition, listPosition) {
      this.buffer_project_list = JSON.parse(JSON.stringify(this.org.projects[projectPosition].lists[listPosition]))
      this.$refs['new-project-list'].show()
    },
    cleanProjectList: function () {
      this.buffer_project_list = this.tmp_buffer_project_list
    },
    cleanProject: function () {
      this.buffer_project = this.tmp_buffer_project
    },
    updateProjectList: function () {
      axios.patch(`/api/isoqf_lists/${this.buffer_project_list.id}`, this.buffer_project_list)
        .then((response) => {
          this.buffer_project = this.tmp_buffer_project
          this.buffer_project_list = this.tmp_buffer_project_list
          this.getProjectsAndLists()
          this.$refs['new-project-list'].hide()
          this.projectTable.isBusy = true
        })
        .catch((error) => {
          console.log(error)
        })
    },
    closeModalProject: function () {
      this.buffer_project = this.tmp_buffer_project
    },
    openModalEditProject: function (project) {
      this.buffer_project = JSON.parse(JSON.stringify(project))
      this.$refs['new-project'].show()
    },
    modalRemoveProject: function (project) {
      this.org.remove_project_id = project.id
      this.buffer_project = project
      this.$refs['modal-remove-project'].show()
    },
    removeProject: function () {
      this.projectTable.isBusy = true
      const _projects = JSON.parse(JSON.stringify(this.org.projects))
      let _lists = []
      let _charsOfStudies = []
      let _methAssessments = []
      let _extractedData = []
      let _references = []
      let _request = []
      const projectId = this.org.remove_project_id

      for (let project of _projects) {
        if (project.id === projectId) {
          _lists = project.lists
        }
      }

      for (let list of _lists) {
        axios.get(`/api/isoqf_findings?organization=${this.org.id}&list_id=${list.id}`)
          .then((response) => {
            for (let finding of response.data) {
              axios.delete(`/api/isoqf_findings/${finding.id}`)
                .then((response) => {})
                .catch((error) => {
                  console.log(error)
                })
            }
          })
          .catch((error) => {
            console.log(error)
          })
        _request.push(axios.delete(`/api/isoqf_lists/${list.id}`))
      }

      axios.get(`/api/isoqf_characteristics?organization=${this.org.id}&project_id=${projectId}`)
        .then((response) => {
          _charsOfStudies = response.data
          for (let study of _charsOfStudies) {
            axios.delete(`/api/isoqf_characteristics/${study.id}`)
              .then((response) => {})
              .catch((error) => {
                console.log(error)
              })
          }
        })
        .catch((error) => {
          console.log(error)
        })

      axios.get(`/api/isoqf_assessments?organization=${this.org.id}&project_id=${projectId}`)
        .then((response) => {
          _methAssessments = response.data
          for (let assessment of _methAssessments) {
            axios.delete(`/api/isoqf_assessments/${assessment.id}`)
              .then((response) => {})
              .catch((error) => {
                console.log(error)
              })
          }
        })
        .catch((error) => {
          console.log(error)
        })

      axios.get(`/api/isoqf_extracted_data?organization=${this.org.id}&project_id=${projectId}`)
        .then((response) => {
          _extractedData = response.data
          for (let extractedData of _extractedData) {
            axios.delete(`/api/isoqf_extracted_data/${extractedData.id}`)
              .then((response) => {})
              .catch((error) => {
                console.log(error)
              })
          }
        })
        .catch((error) => {
          console.log(error)
        })

      axios.get(`/api/isoqf_references?organization=${this.org.id}&project_id=${projectId}`)
        .then((response) => {
          _references = response.data
          for (let reference of _references) {
            axios.delete(`/api/isoqf_references/${reference.id}`)
              .then((response) => {})
              .catch((error) => {
                console.log(error)
              })
          }
        })
        .catch((error) => {
          console.log(error)
        })

      axios.all(_request)
        .then(axios.spread(function () {
          axios.delete(`/api/isoqf_projects/${projectId}`)
            .then((response) => {
              this.buffer_project = this.tmp_buffer_project
              delete this.org.remove_project_id
              this.getOrganization()
              this.getProjectsAndLists()
            })
            .catch((error) => {
              console.log(error)
            })
        }.bind(this)))
    }
  }
}
</script>

<style scoped>
  div >>>
    table#organizations thead th:nth-child(2) {
      width: 70%
    }
  div >>>
    table#organizations thead th:last-child {
      width: 20%
    }
  div >>>
    table#organizations tbody td:last-child {
      text-align: right;
    }
  div >>>
    table#organizations tbody td a {
      text-decoration: underline;
    }
</style>
