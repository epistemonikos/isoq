<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="py-5">
        <h2>My Workspace</h2>
      </div>
    </b-container>
    <b-container fluid>
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
                  :id="`p-${data.item.id}`"
                  class="link-project"
                  :to="{name: 'viewProject', params: {org_id: data.item.organization, id: data.item.id}}">
                  {{ data.item.name }}
                </b-link>
              </template>
              <template v-slot:cell(actions)="data">
                <div class="d-block d-lg-none">
                  <b-dropdown id="dropdown-1" text="Project Options" class="m-md-2" variant="outline-secondary">
                    <b-dropdown-item v-if="data.item.is_owner || data.item.allow_to_write" @click="openCloneModal(data.item.id)" link-class="text-decoration-none"><font-awesome-icon icon="copy"></font-awesome-icon> Duplicate</b-dropdown-item>
                    <b-dropdown-item v-if="data.item.is_owner && (data.item.sharedToken.length)" @click="modalShareOptions(data.item.id, 2)" link-class="text-decoration-none"><font-awesome-icon icon="link"></font-awesome-icon> Shared</b-dropdown-item>
                    <b-dropdown-item v-if="data.item.is_owner" @click="modalShareOptions(data.item.id)" link-class="text-decoration-none"><font-awesome-icon icon="users"></font-awesome-icon> Share</b-dropdown-item>
                    <b-dropdown-item v-if="data.item.allow_to_write" @click="openModalEditProject(data.item)" link-class="text-decoration-none"><font-awesome-icon icon="edit"></font-awesome-icon>Edit</b-dropdown-item>
                    <b-dropdown-item v-if="data.item.is_owner" @click="modalRemoveProject(data.item)" link-class="text-decoration-none"><font-awesome-icon icon="trash"></font-awesome-icon> Remove</b-dropdown-item>
                    <b-dropdown-item v-if="!data.item.is_owner && (data.item.allow_to_write || data.item.allow_to_read)" @click="openModalLeaveProject(data.item)" link-class="text-decoration-none"><font-awesome-icon icon="sign-out-alt"></font-awesome-icon> Leave</b-dropdown-item>
                  </b-dropdown>
                </div>
                <div class="d-none d-lg-block">
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
                    v-if="data.item.is_owner"
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
                  <b-button
                    v-if="!data.item.is_owner && (data.item.allow_to_write || data.item.allow_to_read)"
                    title="Leave"
                    variant="outline-success"
                    @click="openModalLeaveProject(data.item)">
                    <font-awesome-icon
                      icon="sign-out-alt"></font-awesome-icon>
                  </b-button>
                </div>
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
        @ok="save"
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
          ref="organizationForm"
          :formData="buffer_project"
          :canWrite="($store.state.user.personal_organization === this.$route.params.id)"
          :isModal="true"
          @modal-notification="modalNotification"></organizationForm>
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
      <b-modal
        ref="unlink-project"
        id="unlink-project"
        title="Leave project"
        @ok="leaveProject"
        @cancel="cancelLeaveProject"
        ok-title="Leave">
        <p>Leave the project <b>{{buffer_project.name}}</b></p>
      </b-modal>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'

const organizationForm = () => import(/* webpackChunkName: "organizationform" */'../organization/organizationForm')
const videoHelp = () => import(/* webpackChunkName: "videohelp" */'../videoHelp')

export default {
  name: 'viewOrganization',
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
        license_type: 'CC-BY-NC-ND',
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
      modalCloneNewId: null,
      newReferences: [],
      hashId: null
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
          is_public: isPublic,
          temporaryUrl: project.temporaryUrl,
          project_id: project.id
        }
        axios.patch('/api/sharedLink', { params })
          .then(() => {})
          .catch((error) => {
            console.log(error)
          })
      }
    }
  },
  methods: {
    getProjectById: async function (params) {
      try {
        const response = await axios.get('/api/isoqf_projects', {params: params})
        return response
      } catch (error) {
        console.log(error)
      }
    },
    axiosGetProjects: async function (organizationId) {
      try {
        return axios.get('/api/isoqf_projects', {
          params: {
            organization: organizationId
          }
        })
      } catch (error) {
        console.log(error)
      }
    },
    getProjects: function () {
      axios.get('/api/getProjects')
        .then((response) => {
          this.projects = []
          let _projects = []
          for (const project of response.data) {
            const processProject = this.processProject(project)
            if (Object.keys(processProject).length) {
              _projects.push(processProject)
            }
          }
          const finalList = _projects.sort(function (a, b) { return ((a.created_at < b.created_at) ? -1 : ((a.created_at > b.created_at) ? 1 : 0)) * -1 })
          this.projects.push(...finalList)

          if (Object.prototype.hasOwnProperty.call(this.$route.query, 'hash') || this.hashId !== null) {
            const hash = (Object.prototype.hasOwnProperty.call(this.$route.query, 'hash')) ? `#${this.$route.query.hash}` : `#p-${this.hashId}`
            this.$router.push({
              name: 'viewOrganization',
              params: {
                organization: this.$route.params.org_id
              },
              hash: `${hash}`
            })
            this.hashId = null
          }
        }).catch((error) => {
          console.log(error)
        })
      this.ui.projectTable.isBusy = false
    },
    processProject: function (project) {
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
        if (!Object.prototype.hasOwnProperty.call(project, 'sharedToken')) {
          project.sharedToken = ''
        }
        if (project.sharedToken === null || project.sharedToken === undefined) {
          project.sharedToken = ''
        }
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
          if (Object.prototype.hasOwnProperty.call(project, 'can_read')) {
            if (project.can_read.includes(this.$store.state.user.id)) {
              project.allow_to_read = true
            }
          }
          if (Object.prototype.hasOwnProperty.call(project, 'can_write')) {
            if (project.can_write.includes(this.$store.state.user.id)) {
              project.allow_to_write = true
            }
          } else {
            project.can_write = []
          }
        }
        return project
      } else {
        return {}
      }
    },
    modalNotification: function () {
      this.$refs['new-project'].hide()
      this.getProjects()
    },
    save: function (e) {
      e.preventDefault()
      this.$refs['organizationForm'].save()
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
      let _project = JSON.parse(JSON.stringify(project))
      if (!Object.prototype.hasOwnProperty.call(_project, 'license_type')) {
        _project.license_type = 'CC-BY-NC-ND'
      }
      if (Object.prototype.hasOwnProperty.call(_project, 'license_type')) {
        if (_project.license_type === '') {
          _project.license_type = 'CC-BY-NC-ND'
        }
      }

      this.buffer_project = _project
      this.$refs['new-project'].show()
    },
    modalRemoveProject: function (project) {
      this.buffer_project = JSON.parse(JSON.stringify(project))
      this.$refs['modal-remove-project'].show()
    },
    removeProject: function () {
      this.ui.projectTable.isBusy = true
      axios.get(`/api/remove/project/${this.buffer_project.id}`)
        .then((response) => {
          if (response.data.status) {
            this.getProjects()
            this.ui.projectTable.isBusy = false
          } else {
            this.ui.projectTable.isBusy = false
            console.log(response.data)
          }
        })
        .catch((error) => {
          console.log(error)
          this.ui.projectTable.isBusy = false
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
      if (Object.prototype.hasOwnProperty.call(this.buffer_project, 'sharedTo')) {
        this.buffer_project.sharedTo = ''
      }
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
    saveSharedProject: async function () {
      const sharedEmails = this.buffer_project.tmp_invite_emails.join()
      const projectId = this.buffer_project.id
      const params = {
        current_user: this.$store.state.user.name,
        emails: sharedEmails,
        user_can: this.buffer_project.sharedType,
        org: this.$route.params.id
      }
      await axios.post(`/share/project/${projectId}`, params)
        .then((response) => {
          if (response.status === 200) {
            const project = this.processProject(response.data[0])
            if (Object.keys(project).length) {
              this.buffer_project = project
              const projects = JSON.parse(JSON.stringify(this.projects))
              let _projects = []
              for (let p of projects) {
                if (p.id === project.id) {
                  _projects.push(project)
                } else {
                  _projects.push(p)
                }
              }
              this.projects = _projects
              this.buffer_project.sharedTo = ''
              this.buffer_project.tmp_invite_emails = []
              this.usersCanList(project.id)
            }
          }
        }).catch((error) => {
          console.log(error)
        })
    },
    removeUser: async function (project, params) {
      try {
        const data = await axios.post(`/share/project/${project}/unshare`, null, {params: params})
        return data
      } catch (error) {
        console.log('errors: => ', error)
      }
    },
    unshare: function (_index, userId) {
      const projectId = this.buffer_project.id
      const params = {
        'user_id': userId,
        'org_id': this.$route.params.id,
        'current_user': this.$store.state.user.id
      }
      this.removeUser(projectId, params)
        .then((response) => {
          if (response.status === 200) {
            this.getProjectById({id: projectId})
              .then((response) => {
                if (response.status === 200) {
                  const project = this.processProject(response.data[0])
                  if (Object.keys(project).length) {
                    this.buffer_project = project
                    const projects = JSON.parse(JSON.stringify(this.projects))
                    let _projects = []
                    for (let p of projects) {
                      if (p.id === project.id) {
                        _projects.push(project)
                      } else {
                        _projects.push(p)
                      }
                    }
                    this.projects = _projects
                    this.usersCanList(project.id)
                  }
                }
              })
          }
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
    generateACopyOfAProject: async function () {
      this.ui.copy.project = true
      axios.get(`/api/clone/project/${this.buffer_project.id}/org/${this.$route.params.id}`)
        .then(() => {
          this.ui.copy.project = false
          this.getProjects()
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
    },
    openModalLeaveProject: function (data) {
      this.buffer_project = {}
      for (let p of this.projects) {
        if (p.id === data.id) {
          this.buffer_project = p
        }
      }
      this.$bvModal.show('unlink-project')
    },
    leaveProject: function () {
      const userId = this.$store.state.user.id
      axios.post(`/project/${this.buffer_project.id}/unsubscribe?userId=${userId}`)
        .then((r) => {
          this.getProjects()
        })
        .catch((e) => {
          console.log(e)
        })

      this.$bvModal.hide('unlink-project')
    },
    cancelLeaveProject: function () {
      this.buffer_project = this.tmp_buffer_project
      this.$bvModal.hide('unlink-project')
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
      width: 60%;
    }
  div >>>
    table#organizations thead th:last-child {
      width: 30%;
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
