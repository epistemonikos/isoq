<template>
  <div>
    <b-button
      v-if="item.is_owner && (item.sharedToken.length)"
      title="You have a temporary link enabled for this project. It will remain enabled until you manually switch it off. Click here to switch it off"
      variant="outline-secondary"
      @click="modalShareOptions(item.id, 2)">
      <font-awesome-icon
        icon="link"></font-awesome-icon>
    </b-button>

    <b-button
      v-if="item.is_owner"
      title="Share"
      variant="outline-secondary"
      @click="modalShareOptions(item.id)">
      <font-awesome-icon
        icon="users"></font-awesome-icon>
    </b-button>

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
  </div>
</template>

<script>
import axios from 'axios'
import { v4 as uuid } from 'uuid'

const videoHelp = () => import(/* webpackChunkName: "videohelp" */'../videoHelp')

export default {
  name: 'shareProject',
  props: {
    item: Object,
    projects: Array
  },
  data () {
    return {
      ui: {
        tabIndex: 0,
        sharedProject: {
          enabledToShare: false
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
        tmp_invite_emails: [],
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
      users_allowed: []
    }
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
            project.sharedToken = uuid()
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
    modalShareOptions: function (id, tabIndex = 0) {
      this.ui.tabIndex = tabIndex
      this.buffer_project = {
        references: []
      }
      for (let p of this.projects) {
        if (p.id === id) {
          this.buffer_project = p
        }
      }
      // this.buffer_project.index = index
      this.usersCanList(id)
      this.$refs['modal-share-options'].show()
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
    removeSharedEmail: function (index) {
      this.buffer_project.tmp_invite_emails.splice(index, 1)
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
          this.buffer_project.sharedTo = ''
          this.buffer_project.tmp_invite_emails = []
          this.usersCanList(id)
          this.$emit('getProjects')
        })
        .catch((error) => {
          console.log(error)
        })
    },
    unshare: function (_index, userId) {
      const projectId = this.buffer_project.id
      axios.post(`/share/project/${projectId}/unshare?user_id=${userId}&org_id=${this.$route.params.id}&current_user=${this.$store.state.user.id}`)
        .then(() => {
          // this.projects[this.buffer_project.index] = response.data
          this.$emit('getProjects')
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
          this.$emit('getProjects')
        }).catch((error) => {
          console.log(error)
        })
    },
    addEmailForShare: function () {
      let emails = this.buffer_project.sharedTo.split(',')
      this.buffer_project.tmp_invite_emails = emails.map(e => {
        if (e !== this.$store.state.user.name) {
          return e.trim().toLowerCase()
        }
      })
    }
  },
  components: {
    videoHelp
  }
}
</script>

<style>

</style>
