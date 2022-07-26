<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="py-5">
        <h2>My Workspace</h2>
      </b-container>
    </b-container>
    <b-container>
      <div class="my-4">
        <h3>{{ $t("Projects") }}</h3>
        <b-row align-h="end" v-if="$store.state.user.personal_organization === this.$route.params.id">
          <b-col cols="12" class="text-right">
            <edit-project
              :projects="projects"
              @getProjects="getProjects"
              :newProject="true"></edit-project>
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
              hover
              head-variant="light"
              :busy="ui.projectTable.isBusy"
              :fields="ui.projectTable.fields"
              :items="projects"
              sort-by="created_at"
              :sort-desc="true">
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
                <b-link
                  class="link-project"
                  :to="{name: 'viewProject', params: {org_id: data.item.organization, id: data.item.id}}">
                  {{ data.item.name }}
                </b-link>
              </template>
              <template v-slot:cell(actions)="data">
                <action-btns
                  :item="data.item"
                  :projects="projects"
                  @getProjects="getProjects"></action-btns>
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
        size="xl"
        id="new-project-list"
        ref="new-project-list"
        :title="(buffer_project_list.id) ? 'Edit summarised review finding' : 'New summarised review finding'"
        @ok="AddOrUpdateProjectList"
        @hidden="cleanProjectList"
        ok-title="Save"
        ok-variant="outline-success"
        cancel-variant="outline-secondary">
        <b-form-group
          label="Summarised review"
          label-for="summarized-review">
          <b-form-input
            id="summarized-review"
            placeholder="Enter a summarised review finding"
            v-model="buffer_project_list.name"></b-form-input>
        </b-form-group>
      </b-modal>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import actionBtns from './actionButtons.vue'
import editProject from './editProject'

export default {
  components: {
    'edit-project': editProject,
    'action-btns': actionBtns
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
        },
        sharedProject: {
          enabledToShare: false
        },
        projectTable: {
          fields: [
            { key: 'private', label: 'Privacy' },
            { key: 'name', label: 'Title' },
            { key: 'actions', label: '' }
          ],
          isBusy: true
        },
        tabIndex: 0
      },
      global_status: [
        { value: 'private', text: 'Private - Your iSoQ is not publicly available on the iSoQ database' },
        { value: 'fully', text: 'Fully Public - Your iSoQ table, Evidence Profile, and GRADE-CERQual Worksheets are publicly available on the iSoQ database' },
        { value: 'partially', text: 'Partially Public - Your iSoQ table and Evidence Profile are publicly available on the iSoQ database' },
        { value: 'minimally', text: 'Minimally Public - Your iSoQ table is available on the iSoQ database' }
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
      users_allowed: [],
      projects: []
    }
  },
  mounted () {
    this.getProjects()
  },
  methods: {
    getProjects: function () {
      let requests = []
      const excludeOrgs = ['examples', 'episte']
      this.projects = []

      for (let _org of this.$store.state.user.orgs) {
        if (!excludeOrgs.includes(_org.id)) {
          requests.push(axios.get('/api/isoqf_projects', {
            params: {
              organization: _org.id
            }
          }))
        }
      }
      axios.all(requests).then(axios.spread((...responses) => {
        let _projects = []
        for (let response of responses) {
          if (response.data.length) {
            for (let project of response.data) {
              if (!Object.prototype.hasOwnProperty.call(project, 'can_write')) {
                project.can_write = []
              }
              if (!Object.prototype.hasOwnProperty.call(project, 'can_read')) {
                project.can_read = []
              }
              if (!Object.prototype.hasOwnProperty.call(project, 'created_at')) {
                project.created_at = 0
              }
              if (
                project.organization === this.$store.state.user.personal_organization ||
                project.can_read.includes(this.$store.state.user.id) ||
                project.can_write.includes(this.$store.state.user.id)
              ) {
                if (!Object.prototype.hasOwnProperty.call(project, 'sharedTokenOnOff')) {
                  if (Object.prototype.hasOwnProperty.call(project, 'sharedToken') && project.sharedToken.length) {
                    project.sharedTokenOnOff = true
                  } else {
                    project.sharedTokenOnOff = false
                  }
                } else {
                  if (Object.prototype.hasOwnProperty.call(project, 'sharedToken') && project.sharedToken.length) {
                    project.sharedTokenOnOff = true
                  } else {
                    project.sharedTokenOnOff = false
                  }
                }
                if (!Object.prototype.hasOwnProperty.call(project, 'tmp_invite_emails')) {
                  project.tmp_invite_emails = []
                }
                project.is_owner = false
                project.allow_to_write = false
                project.allow_to_read = false
                if (project.organization === this.$store.state.user.personal_organization) {
                  project.is_owner = true
                  project.allow_to_write = true
                  project.allow_to_read = true
                } else {
                  if (project.organization !== this.$store.state.user.personal_organization) {
                    project.is_owner = false
                  }
                  if (Object.prototype.hasOwnProperty.call(project, 'can_write')) {
                    if (project.can_write.includes(this.$store.state.user.id)) {
                      project.allow_to_write = true
                    }
                  } else {
                    project.can_write = []
                  }
                }
                _projects.push(project)
              }
            }
          }
        }
        const finalList = _projects.sort(function (a, b) { return ((a.created_at < b.created_at) ? -1 : ((a.created_at > b.created_at) ? 1 : 0)) * -1 })
        this.projects.push(...finalList)
      })).catch((error) => {
        console.log(error)
      })
      this.ui.projectTable.isBusy = false
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
            this.getProjects()
          })
          .catch((error) => {
            this.ui.dismissCounters.dismissCountDown = this.ui.dismissCounters.dismisSec
            console.log('error list', error)
            this.$refs['new-project-list'].show()
          })
      }
    },
    // getProjectsAndLists: function () {
    //   let projects = []
    //   let lists = []
    //   const excludeOrgs = ['examples', 'episte']

    //   for (let org of this.$store.state.user.orgs) {
    //     if (!excludeOrgs.includes(org.id)) {
    //       projects.push(axios.get('/api/isoqf_projects', {
    //         params: {
    //           organization: org.id
    //         }
    //       }))
    //       lists.push(axios.get('/api/isoqf_lists', {
    //         params: {
    //           organization: org.id
    //         }
    //       }))
    //     }
    //   }
    //   axios.all(projects).then(axios.spread((...results) => {
    //     for (const result of results) {
    //       let _projects = result.data
    //       for (let project of _projects) {
    //         if (!Object.prototype.hasOwnProperty.call(project, 'sharedTokenOnOff')) {
    //           if (Object.prototype.hasOwnProperty.call(project, 'sharedToken') && project.sharedToken.length) {
    //             project.sharedTokenOnOff = true
    //           } else {
    //             project.sharedTokenOnOff = false
    //           }
    //         } else {
    //           if (Object.prototype.hasOwnProperty.call(project, 'sharedToken') && project.sharedToken.length) {
    //             project.sharedTokenOnOff = true
    //           } else {
    //             project.sharedTokenOnOff = false
    //           }
    //         }
    //         if (!Object.prototype.hasOwnProperty.call(project, 'tmp_invite_emails')) {
    //           project.tmp_invite_emails = []
    //         }
    //         project.is_owner = false
    //         project.allow_to_write = false
    //         project.allow_to_read = false
    //         if (project.organization === this.$store.state.user.personal_organization) {
    //           project.is_owner = true
    //           project.allow_to_write = true
    //           project.allow_to_read = true
    //         } else {
    //           if (project.organization !== this.$store.state.user.personal_organization) {
    //             project.is_owner = false
    //           }
    //           if (Object.prototype.hasOwnProperty.call(project, 'can_write')) {
    //             if (project.can_write.includes(this.$store.state.user.id)) {
    //               project.allow_to_write = true
    //             }
    //           } else {
    //             project.can_write = []
    //           }
    //         }
    //         this.projects.push(project)
    //       }
    //     }
    //   }))
    //   this.ui.projectTable.isBusy = false
    // },
    // editProjectList: function (projectPosition, listPosition) {
    //   this.buffer_project_list = JSON.parse(JSON.stringify(this.projects[projectPosition].lists[listPosition]))
    //   this.$refs['new-project-list'].show()
    // },
    cleanProjectList: function () {
      this.buffer_project_list = JSON.parse(JSON.stringify(this.tmp_buffer_project_list))
    },
    updateProjectList: function () {
      axios.patch(`/api/isoqf_lists/${this.buffer_project_list.id}`, this.buffer_project_list)
        .then((response) => {
          this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
          this.buffer_project_list = JSON.parse(JSON.stringify(this.tmp_buffer_project_list))
          this.getProjects()
          this.$refs['new-project-list'].hide()
          this.ui.projectTable.isBusy = true
        })
        .catch((error) => {
          console.log(error)
        })
    }
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
  /* div >>>
    table#organizations tbody tr td button {
      display: none;
    }
  div >>>
    table#organizations tbody tr:hover td button {
      display: inline;
    } */
  div >>>
    table#organizations tbody td:last-child {
      text-align: right;
    }
  div >>>
    table#organizations tbody td a {
      text-decoration: underline;
    }
</style>
