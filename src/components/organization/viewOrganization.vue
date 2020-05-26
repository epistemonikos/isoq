<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="py-5">
        <h2>{{ (org.name === 'My frameworks') ? 'My iSoQf' : org.name }}</h2>
        <p v-if="org.description">{{ org.description }}</p>
      </b-container>
    </b-container>
    <b-container>
      <div class="my-4">
        <h3>{{ $t("Projects") }}</h3>
        <b-row align-h="end" v-if="$store.state.user.is_owner">
          <b-col cols="12" class="text-right">
            <b-button
              v-b-tooltip.hover
              title="Create a new Interactive Summary of Qualitative Findings Table"
              variant="success"
              @click="openModalNewFindingTable">{{ $t("Add new project") }}</b-button>
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
              hover
              head-variant="light"
              :busy="projectTable.isBusy"
              :fields="projectTable.fields"
              :items="org.projects">
              <template v-slot:cell(private)="data">
                <b-badge
                  variant="light"
                  class="publish-status"
                  v-b-tooltip.hover
                  :title="global_status.map((obj)=>{ if (obj.value === data.item.public_type) { return obj.text } })">
                  {{ data.item.public_type }}
                </b-badge>
              </template>
              <template v-slot:cell(name)="data">
                <b-link class="link-project" :to="{name: 'viewProject', params: {org_id: org.id, id: data.item.id}}">{{ data.item.name }}</b-link>
              </template>
              <template v-slot:cell(actions)="data">
                <b-button
                  v-if="$store.state.user.is_owner"
                  title="Invite"
                  variant="outline-secondary">
                  <font-awesome-icon
                    icon="users"
                    @click="modalShareOptions(data.index)"></font-awesome-icon>
                </b-button>
                <b-button
                  v-if="$store.state.user.can_write_other_orgs"
                  title="Edit"
                  variant="outline-success"
                  @click="openModalEditProject(data.item)">
                  <font-awesome-icon
                    icon="edit"></font-awesome-icon>
                </b-button>
                <b-button
                  v-if="$store.state.user.is_owner"
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
        size="xl"
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
        <organizationForm
          :formData="buffer_project"
          :canWrite="($store.state.user.is_owner || $store.state.user.can_write_other_orgs)"></organizationForm>
      </b-modal>
      <b-modal
        size="xl"
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
      <b-modal
        size="xl"
        id="modal-share-options"
        ref="modal-share-options"
        title="Invite"
        scrollable>
        <b-tabs>
          <b-tab
            title="Invite">
            <b-form-group
              label="Insert emails separated by commas"
              label-for="input-emails-invite">
              <b-input
                type="email"
                v-model="buffer_project.sharedTo"></b-input>
            </b-form-group>
            <b-button @click="addEmailForShare">add</b-button>
            <b-form-group
              label="Can:">
              <b-form-select
                v-model="buffer_project.sharedType"
                :options="[{value: 0, text:'View the project'}, {value: 1, text: 'View and edit the project'}]"></b-form-select>
            </b-form-group>
            <b-button
              :disabled="!buffer_project.invite_emails.length"
              variant="success"
              @click="saveSharedProject(tmp_buffer_project.index)">Invite</b-button>
          </b-tab>
          <b-tab
            title="Can access">
            <b-table
              responsive
              :fields="['email', 'name', 'actions']"
              :items="[{email: 'damian@pistemonikos.org', 'name': 'diaman', 'actions':''},{email: 'damian@pistemonikos.org', 'name': 'diaman', 'actions':''}]"></b-table>
          </b-tab>
        </b-tabs>
      </b-modal>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import organizationForm from '../organization/organizationForm'

export default {
  components: {
    'organizationForm': organizationForm
  },
  data () {
    return {
      users: [],
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
        invite_emails: []
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
        invite_emails: []
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
          { key: 'private', label: 'Public' },
          { key: 'name', label: 'Title' },
          { key: 'actions', label: '' }
        ],
        isBusy: true
      }
    }
  },
  mounted () {
    this.getOrganization()
    this.getUsers()
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
      this.buffer_project.private = true
      this.buffer_project.is_public = false
      if (this.buffer_project.public_type !== 'private') {
        this.buffer_project.private = false
        this.buffer_project.is_public = true
      }
      if (this.buffer_project.id) {
        delete this.buffer_project.lists
        axios.patch(`/api/isoqf_projects/${this.buffer_project.id}`, this.buffer_project)
          .then((response) => {
            this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
            this.getProjectsAndLists()
          })
          .catch((error) => {
            console.log(error)
          })
      } else {
        axios.post('/api/isoqf_projects', this.buffer_project)
          .then((response) => {
            this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
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
        axios.post('/api/isoqf_lists', this.buffer_project_list)
          .then((response) => {
            this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
            this.$refs['new-project-list'].hide()
            // get project lists
            this.buffer_project_list = JSON.parse(JSON.stringify(this.tmp_buffer_project_list))
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
        if (this.$store.state.user.personal_organization === this.$route.params.id) {
          this.$store.dispatch('usercan', true)
          this.$store.dispatch('isowner', true)
          this.$set(this.org, 'projects', projects.data)
        } else {
          this.$store.dispatch('isowner', false)
          let _projectsData = projects.data
          let _projects = []
          for (let project of _projectsData) {
            if (!Object.prototype.hasOwnProperty.call(project, 'can_read')) {
              project.can_read = []
            }
            if (!Object.prototype.hasOwnProperty.call(project, 'can_write')) {
              project.can_write = []
            }
            if (Object.prototype.hasOwnProperty.call(project, 'can_read') || Object.prototype.hasOwnProperty.call(project, 'can_write')) {
              if (project.can_read.includes(this.$store.state.user.id) || project.can_write.includes(this.$store.state.user.id)) {
                this.$store.dispatch('usercan', false)
                if (project.can_write.includes(this.$store.state.user.id)) {
                  this.$store.dispatch('usercan', true)
                }
                _projects.push(project)
              }
            }
          }
          _projectsData = _projects
          this.$set(this.org, 'projects', _projectsData)
        }
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
      this.buffer_project_list = JSON.parse(JSON.stringify(this.tmp_buffer_project_list))
    },
    cleanProject: function () {
      this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
    },
    updateProjectList: function () {
      axios.patch(`/api/isoqf_lists/${this.buffer_project_list.id}`, this.buffer_project_list)
        .then((response) => {
          this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
          this.buffer_project_list = JSON.parse(JSON.stringify(this.tmp_buffer_project_list))
          this.getProjectsAndLists()
          this.$refs['new-project-list'].hide()
          this.projectTable.isBusy = true
        })
        .catch((error) => {
          console.log(error)
        })
    },
    openModalNewFindingTable: function () {
      this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
      this.$refs['new-project'].show()
    },
    closeModalProject: function () {
      this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
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
                .then((response) => {
                  axios.get(`/api/isoqf_extracted_data?organization=${this.org.id}&finding_id=${finding.id}`)
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
                })
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
      axios.get(`/api/isoqf_list_categories?organization=${this.org.id}&project_id=${projectId}`)
        .then((response) => {
          let _categories = response.data

          for (let category of _categories) {
            axios.delete(`/api/isoqf_list_categories/${category.id}`)
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
              this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
              delete this.org.remove_project_id
              this.getOrganization()
              this.getProjectsAndLists()
            })
            .catch((error) => {
              console.log(error)
            })
        }.bind(this)))
    },
    modalShareOptions: function (index) {
      this.org.projects[index].sharedTo = {user_views: [], user_edits: []}
      this.org.projects[index].sharedType = 0
      this.tmp_buffer_project = this.org.projects[index]
      this.tmp_buffer_project.index = index
      this.$refs['modal-share-options'].show()
    },
    getUsers: function () {
      axios.get('/users/get_all')
        .then((response) => {
          this.users = JSON.parse(JSON.stringify(response.data))
        })
        .catch((error) => {
          console.log(error)
        })
    },
    addEmailForShare: function () {
      let regex = /\S+@\S+\.\S+/
      if (regex.test(this.buffer_project.sharedTo)) {
        if (!this.buffer_project.invite_emails.includes(this.buffer_project.sharedTo)) {
          this.buffer_project.invite_emails.push(this.buffer_project.sharedTo)
          this.buffer_project.sharedTo = ''
        }
      } else {
        console.log('error')
      }
    },
    saveSharedProject: function (index) {
      const sharedEmails = this.buffer_project.invite_emails.join()
      const projectId = this.org.projects[index].id
      const params = {
        emails: sharedEmails,
        user_can: this.buffer_project.sharedType,
        org: this.$route.params.id
      }
      axios.post(`/share/project/${projectId}`, params)
        .then((response) => {
          this.buffer_project.sharedType = null
          this.buffer_project.sharedTo = ''
          this.buffer_project.invite_emails = []
        })
        .catch((error) => {
          console.log(error)
        })
    }
    /*
    saveSharedProject: function (index) {
      const params = {
        is_public: true
      }
      let requestsPush = []
      let requestsGet = []
      let requestsGetFindings = []
      let _checkUsers = []
      const project = JSON.parse(JSON.stringify(this.tmp_buffer_project))

      const sharedUsers = project.invite_emails.split(',')
      for (let user of sharedUsers) {
        _checkUsers.push(axios.get(`/users/check_email?email=${user.trim()}`))
      }
      axios.all(_checkUsers)
        .then((responses) => {
          for (let response of responses) {
            let _response = JSON.parse(JSON.stringify(response.data))
            if (_response.error === 'Mail already exists') {
              let userEmail = response.request.responseURL.split('=')[1]
              let _roles = ['user']
              console.log(project)
              if (project.sharedType) {
                _roles.push('editor')
              }
              let params = {
                org: {
                  id: this.$route.params.id,
                  roles: _roles
                }
              }
              let user = this.users.find(u => u.username === userEmail)
              console.log(userEmail)
              console.log('user', user)
              if (user !== undefined) {
                axios.patch(`/users/${user.id}/update_roles`, params)
                  .then((response) => {})
                  .catch((error) => {
                    console.log(error)
                  })
              }
            }
          }
        })
        .catch((error) => {
          console.log(error)
        })

      axios.patch(`/api/isoqf_projects/${this.org.projects[index].id}`, params)
        .then((response) => {})
        .catch((error) => {
          console.log(error)
        })

      for (let list of this.org.projects[index].lists) {
        requestsPush.push(axios.patch(`/api/isoqf_lists/${list.id}`, params))
      }
      axios.all(requestsPush)
        .then(responses => {})
        .catch((error) => {
          console.log(error)
        })

      for (let list of this.org.projects[index].lists) {
        requestsGet.push(axios.get(`/api/isoqf_lists/${list.id}`))
        requestsGetFindings.push(axios.get(`/api/isoqf_findings/?organization=${list.organization}&list_id=${list.id}`))
      }
      axios.all(requestsGet)
        .then(responses => {
          let references = []
          let requests = []
          let requestsAssessments = []
          let requestsCharacteristics = []

          for (let response of responses) {
            let _response = response.data
            for (let reference of _response.references) {
              references.push(reference)
            }
            requestsAssessments.push(axios.get(`/api/isoqf_assessments?project_id=${_response.project_id}`))
            requestsCharacteristics.push(axios.get(`/api/isoqf_characteristics?project_id=${_response.project_id}`))
          }

          axios.all(requestsAssessments)
            .then((responses) => {
              let requestsPatch = []
              for (let response of responses) {
                for (let _response of response.data) {
                  requestsPatch.push(axios.patch(`/api/isoqf_assessments/${_response.id}`, params))
                }
              }
              axios.all(requestsPatch)
                .then((responses) => {})
                .catch((error) => {
                  console.log(error)
                })
            })
            .catch((error) => {
              console.log(error)
            })
          axios.all(requestsCharacteristics)
            .then((responses) => {
              let requestsPatch = []
              for (let response of responses) {
                for (let _response of response.data) {
                  requestsPatch.push(axios.patch(`/api/isoqf_characteristics/${_response.id}`, params))
                }
              }
              axios.all(requestsPatch)
                .then((responses) => {})
                .catch((error) => {
                  console.log(error)
                })
            })
            .catch((error) => {
              console.log(error)
            })

          for (let reference of references) {
            requests.push(axios.patch(`/api/isoqf_references/${reference}`, params))
          }
          axios.all(requests)
            .then(responses => {})
        })
      axios.all(requestsGetFindings)
        .then((responses) => {
          let requestsPatch = []
          let requestsGet = []
          for (let response of responses) {
            let _response = response.data[0]
            requestsPatch.push(axios.patch(`/api/isoqf_findings/${_response.id}`, params))
            requestsGet.push(axios.get(`/api/isoqf_extracted_data?finding_id=${_response.id}`))
          }

          axios.all(requestsPatch)
            .then((responses) => {})
            .catch((error) => {
              console.log(error)
            })
          axios.all(requestsGet)
            .then((responses) => {
              console.log(responses)
              let _responses = responses
              let requests = []

              for (let response of _responses) {
                for (let extractedDataItem of response.data) {
                  requests.push(axios.patch(`/api/isoqf_extracted_data/${extractedDataItem.id}`, params))
                }
              }
              axios.all(requests)
                .then((response) => {})
                .catch((error) => {
                  console.log(error)
                })
            })
            .catch((error) => {
              console.log(error)
            })
        })
        .catch((error) => {
          console.log(error)
        })

      this.tmp_buffer_project = {
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
        invite_emails: ''
      }
    }
    */
  }
}
</script>

<style scoped>
  div >>>
    .publish-status {
      text-transform: uppercase;
    }
  div >>>
    .link-project {
      color: #000;
    }
  div >>>
    table#organizations thead th:nth-child(2) {
      width: 70%;
    }
  div >>>
    table#organizations thead th:last-child {
      width: 20%;
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
