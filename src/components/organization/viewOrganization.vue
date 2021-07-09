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
                <b-button
                  v-if="data.item.is_owner || data.item.allow_to_write"
                  title="Duplicate"
                  variant="outline-secondary"
                  @click="openCloneModal(data.item.id)">
                  <font-awesome-icon
                    icon="copy"></font-awesome-icon>
                </b-button>
                <b-button
                  v-if="data.item.is_owner && (data.item.sharedToken.length)"
                  title="You have a temporary link enabled for this project. It will remain enabled until you manually switch it off. Click here to switch it off"
                  variant="outline-secondary"
                  @click="modalShareOptions(data.item.id, 2)">
                  <font-awesome-icon
                    icon="link"></font-awesome-icon>
                </b-button>
                <b-button
                  v-if="data.item.is_owner || data.item.allow_to_write"
                  title="Share"
                  variant="outline-secondary"
                  @click="modalShareOptions(data.item.id)">
                  <font-awesome-icon
                    icon="users"></font-awesome-icon>
                </b-button>
                <b-button
                  v-if="data.item.allow_to_write"
                  title="Edit"
                  variant="outline-success"
                  @click="openModalEditProject(data.item)">
                  <font-awesome-icon
                    icon="edit"></font-awesome-icon>
                </b-button>
                <b-button
                  v-if="data.item.is_owner"
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
        id="new-project"
        ref="new-project"
        size="xl"
        :title="(buffer_project.id) ? 'Edit iSoQ table' : 'New iSoQ table'"
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
          :canWrite="($store.state.user.personal_organization === this.$route.params.id)"></organizationForm>
      </b-modal>
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
        ok-only
        ok-title="Close"
        scrollable>
        <template v-slot:modal-title>
          <videoHelp txt="Share" tag="none" urlId="449741356"></videoHelp>
        </template>
        <b-tabs v-model="ui.tabIndex">
          <b-tab
            title="Invite">
            <b-container class="pt-3">
              <b-form-group
                label='Insert emails separated by commas and click "add"'
                label-for="input-emails-invite">
                <b-input
                  type="email"
                  v-model="buffer_project.sharedTo"></b-input>
              </b-form-group>
              <p
                class="text-danger"
                v-if="buffer_project.sharedToError != ''">
                {{buffer_project.sharedToError}}
              </p>
              <b-button
                :disabled="!ui.sharedProject.enabledToShare"
                @click="addEmailForShare">add</b-button>
              <div
                class="my-3"
                v-if="buffer_project.tmp_invite_emails.length">
                <p class="mb-1 font-weight-light">This project will be shared with:</p>
                <b-badge
                class="mx-1"
                v-for="(email, index) in buffer_project.tmp_invite_emails"
                :key="index"
                variant="dark">
                  {{ email }}
                  <span @click="removeSharedEmail(index)">x</span>
                </b-badge>
              </div>
              <b-form-group
                label="Can:">
                <b-form-select
                  v-model="buffer_project.sharedType"
                  :options="[{value: 0, text:'View the project'}, {value: 1, text: 'View and edit the project'}]"></b-form-select>
              </b-form-group>
              <b-button
                :disabled="!buffer_project.tmp_invite_emails.length"
                variant="success"
                @click="saveSharedProject(buffer_project.id)">Invite</b-button>
            </b-container>
          </b-tab>
          <b-tab
            title="Users with access">
            <b-container class="pt-3">
              <h4>Users with Access</h4>
              <b-table
                show-empty
                responsive
                :fields="['username', 'first_name', 'last_name', 'user_can', 'actions']"
                :items="users_allowed">
                <template v-slot:cell(actions)="data">
                  <b-button
                    variant="danger"
                    @click="unshare(data.index, data.item.id)">unshare</b-button>
                </template>
                <template v-slot:cell(user_can)="data">
                  <b-form-select
                    v-model="data.item.user_can"
                    :options="[{value: 0, text: 'Can view'}, {value: 1, text: 'Can view and edit'}]"
                    @change="changePermission(data.item.project_id, data.item.id, data.item.user_can, data.item.index)"></b-form-select>
                </template>
                <template v-slot:empty>
                  <p class="font-weight-light text-center my-3">No users have access to this project</p>
                </template>
              </b-table>
              <div
                v-if="buffer_project.invite_emails.length">
                <h4>Pending access</h4>
                <b-table-simple
                  v-if="buffer_project.invite_emails.length">
                  <b-thead>
                    <b-tr>
                      <b-th>Email</b-th>
                      <b-th>Actions</b-th>
                    </b-tr>
                  </b-thead>
                  <b-tbody>
                    <b-tr v-for="(email, index) of buffer_project.invite_emails" :key="index">
                      <b-td>{{ email }}</b-td>
                      <b-td>
                        <b-button
                          variant="danger"
                          @click="unshareInvited(email)">
                          unshare
                        </b-button>
                      </b-td>
                    </b-tr>
                  </b-tbody>
                </b-table-simple>
              </div>
            </b-container>
          </b-tab>
          <b-tab
            title="Temporary sharing">
            <b-container class="pt-3">
              <p>Enable this option to share the project with a user who does not have an iSoQ account. Anyone you send the link to will be able to see the project but not edit it.</p>
              <b-form-checkbox
                switch
                v-model="buffer_project.sharedTokenOnOff"
                :value="true"
                :unchecked-value="false">Generate a temporary URL. <span class="text-danger">This link will not expire automatically. You must switch it off manually to disable it.</span></b-form-checkbox>
              <div
                v-if="buffer_project.sharedTokenOnOff"
                class="mt-2">
                <p>Copy and Share this URL</p>
                <b-form-input
                  :value="buffer_project.temporaryUrl"></b-form-input>
              </div>
            </b-container>
          </b-tab>
        </b-tabs>
      </b-modal>
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
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
const organizationForm = () => import(/* webpackChunkName: "organizationform" */'../organization/organizationForm')
const videoHelp = () => import(/* webpackChunkName: "videohelp" */'../videoHelp')

export default {
  components: {
    'organizationForm': organizationForm,
    videoHelp
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
        tabIndex: 0,
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
      projects: [],
      modalCloneId: null,
      modalCloneNewId: null
    }
  },
  mounted () {
    this.getProjects()
  },
  watch: {
    'buffer_project.sharedTo': function () {
      const project = this.buffer_project
      let regex = /\S+@\S+\.\S+/
      let enabledButton = true
      if (Object.prototype.hasOwnProperty.call(project, 'sharedTo')) {
        const emails = this.buffer_project.sharedTo.split(',')
        for (let email of emails) {
          if (!regex.test(email)) {
            enabledButton = false
          }
        }
      } else {
        enabledButton = false
      }
      this.ui.sharedProject.enabledToShare = enabledButton
    },
    'buffer_project.sharedTokenOnOff': function () {
      let project = this.buffer_project
      let isPublic = false
      if (Object.prototype.hasOwnProperty.call(project, 'sharedTokenOnOff')) {
        if (project.sharedTokenOnOff) {
          if (!project.sharedToken.length) {
            project.sharedToken = this.randomString(16, 'bLB8OBkcwzbHLF14MrhMvWCX7Zkfz5jqVPY1vkdU97OOdZVc')
          }
          project.temporaryUrl = window.location.origin + '/preview/isoq/' + project.organization + '/' + project.id + '/' + project.sharedToken
          isPublic = true
        } else {
          project.sharedToken = ''
          project.temporaryUrl = ''
          isPublic = false
        }
      } else {
        project.sharedToken = ''
        project.temporaryUrl = ''
        isPublic = false
      }
      if (Object.prototype.hasOwnProperty.call(project, 'id') && project.id !== null) {
        const params = {
          sharedToken: project.sharedToken,
          is_public: isPublic
        }
        axios.patch(`/api/isoqf_projects/${project.id}`, params)
          .then(() => {})
          .catch((error) => {
            console.log(error)
          })
      }
    }
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
    AddProject: function () {
      this.ui.projectTable.isBusy = true
      this.buffer_project.private = true
      this.buffer_project.is_public = false
      if (this.buffer_project.public_type !== 'private') {
        this.buffer_project.private = false
        this.buffer_project.is_public = true
      }
      if (this.buffer_project.id) {
        delete this.buffer_project.lists
        axios.patch(`/api/isoqf_projects/${this.buffer_project.id}`, this.buffer_project)
          .then(() => {
            this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
            this.getProjects()
          })
          .catch((error) => {
            console.log(error)
          })
      } else {
        const _date = Date.now()
        this.buffer_project.created_at = _date
        this.buffer_project.last_update = _date
        axios.post('/api/isoqf_projects', this.buffer_project)
          .then(() => {
            this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
            this.$refs['new-project'].hide()
            this.getProjects()
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
            this.getProjects()
          })
          .catch((error) => {
            this.ui.dismissCounters.dismissCountDown = this.ui.dismissCounters.dismisSec
            console.log('error list', error)
            this.$refs['new-project-list'].show()
          })
      }
    },
    getProjectsAndLists: function () {
      let projects = []
      let lists = []
      const excludeOrgs = ['examples', 'episte']

      for (let org of this.$store.state.user.orgs) {
        if (!excludeOrgs.includes(org.id)) {
          projects.push(axios.get('/api/isoqf_projects', {
            params: {
              organization: org.id
            }
          }))
          lists.push(axios.get('/api/isoqf_lists', {
            params: {
              organization: org.id
            }
          }))
        }
      }
      axios.all(projects).then(axios.spread((...results) => {
        for (const result of results) {
          let _projects = result.data
          for (let project of _projects) {
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
            this.projects.push(project)
          }
        }
      }))
      this.ui.projectTable.isBusy = false
    },
    editProjectList: function (projectPosition, listPosition) {
      this.buffer_project_list = JSON.parse(JSON.stringify(this.projects[projectPosition].lists[listPosition]))
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
          this.getProjects()
          this.$refs['new-project-list'].hide()
          this.ui.projectTable.isBusy = true
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
        .then((response) => {
          this.getProjects()
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
    processRequests: function (requests) {
      axios.all(requests)
        .then(() => {
          // console.log(responses)
        })
        .catch((error) => {
          console.log(error)
        })
    },
    usersCanList: function (id) {
      this.users_allowed = []
      let _project = JSON.parse(JSON.stringify(this.buffer_project))
      if (Object.prototype.hasOwnProperty.call(_project, 'can_read')) {
        for (let user of _project.can_read) {
          axios.get(`/users/${user}`)
            .then((response) => {
              const _user = response.data
              if (_user.status) {
                _user.user_can = 0
                _user.project_id = _project.id
                // _user.index = index
                this.users_allowed.push(_user)
              }
            })
        }
      }
      if (Object.prototype.hasOwnProperty.call(_project, 'can_write')) {
        for (let user of _project.can_write) {
          axios.get(`/users/${user}`)
            .then((response) => {
              const _user = response.data
              if (_user.status) {
                _user.user_can = 1
                _user.project_id = _project.id
                // _user.index = index
                this.users_allowed.push(_user)
              }
            })
        }
      }
    },
    modalShareOptions: function (id, tabIndex = 0) {
      this.ui.tabIndex = tabIndex
      this.buffer_project = {}
      for (let p of this.projects) {
        if (p.id === id) {
          this.buffer_project = p
        }
      }
      // this.buffer_project.index = index
      this.usersCanList(id)
      this.$refs['modal-share-options'].show()
    },
    addEmailForShare: function () {
      let emails = this.buffer_project.sharedTo.split(',')
      this.buffer_project.tmp_invite_emails = emails.map(e => {
        if (e !== this.$store.state.user.name) {
          return e.trim().toLowerCase()
        }
      })
    },
    saveSharedProject: function (id) {
      const sharedEmails = this.buffer_project.tmp_invite_emails.join()
      const projectId = this.buffer_project.id
      const params = {
        current_user: this.$store.state.user.name,
        emails: sharedEmails,
        user_can: this.buffer_project.sharedType,
        org: this.$route.params.id
      }
      axios.post(`/share/project/${projectId}`, params)
        .then(() => {
          // const _response = response.data[0]
          // const index = this.buffer_project.index
          // _response.index = index
          // this.projects[index] = _response
          // this.buffer_project = _response
          this.buffer_project.sharedTo = ''
          this.buffer_project.tmp_invite_emails = []
          this.usersCanList(id)
          this.getProjects()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    unshare: function (_index, userId) {
      const projectId = this.buffer_project.id
      axios.post(`/share/project/${projectId}/unshare?user_id=${userId}&org_id=${this.$route.params.id}&current_user=${this.$store.state.user.id}`)
        .then((response) => {
          // this.projects[this.buffer_project.index] = response.data
          this.getProjects()
          this.users_allowed.splice(_index)
        })
        .catch((error) => {
          console.log(error)
        })
    },
    unshareInvited: function (email) {
      const projectId = this.buffer_project.id
      axios.post(`/share/project/${projectId}/unshare?email=${email}&org_id=${this.$route.params.id}&current_user=${this.$store.state.user.id}`)
        .then((response) => {
          let _response = response.data
          _response.tmp_invite_emails = []
          this.projects[this.buffer_project.index] = _response
          this.buffer_project.invite_emails = _response.invite_emails
        })
        .catch((error) => {
          console.log(error)
        })
    },
    removeSharedEmail: function (index) {
      this.buffer_project.tmp_invite_emails.splice(index, 1)
    },
    randomString: function (len, charSet) {
      charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      var randomString = ''
      for (var i = 0; i < len; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length)
        randomString += charSet.substring(randomPoz, randomPoz + 1)
      }
      return randomString
    },
    changePermission: function (projectId, userId, option, index) {
      const params = {
        'user_id': userId,
        'option': option
      }
      axios.patch(`/share/project/${projectId}/options-update`, params)
        .then((response) => {
          const project = response.data[0]
          // this.projects[index] = project
          this.buffer_project = project
          this.getProjects()
        }).catch((error) => {
          console.log(error)
        })
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
          this.ui.copy.project = false
        })
        .catch((error) => {
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
                this.ui.copy.lists = false
              })
          }
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
                }
              })
              .then(() => {
                this.ui.copy.references = false
                this.generateCopyOfLists(originalProject, project)
                this.generateCopyOf('isoqf_assessments', originalProject, project)
                this.generateCopyOf('isoqf_characteristics', originalProject, project)
                this.getProjects()
              })
          }
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
    openCloneModal: function (id) {
      this.buffer_project = {}
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
      this.ui.copy.showWarning = null
      this.modalCloneId = null
      this.modalCloneNewId = null
      this.ui.copy.disableCloneModalBtn = false
      this.buffer_project = this.tmp_buffer_project
      this.$bvModal.hide('clone-modal')
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
