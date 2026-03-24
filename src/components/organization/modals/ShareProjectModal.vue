<!-- eslint-disable vue/no-mutating-props -->
<template>
  <b-modal
    size="xl"
    id="modal-share-options"
    ref="modal-share-options"
    ok-only
    :ok-title="$t('common.close')"
    @hidden="onHidden"
    scrollable>
    <template v-slot:modal-title>
      <videoHelp :txt="$t('common.share')" tag="none" urlId="449741356"></videoHelp>
    </template>
    <b-tabs v-model="tabIndex">
      <b-tab
        :title="$t('common.invite') || 'Invite'">
        <b-container class="pt-3">
          <b-form-group
            :label="$t('common.insert_emails_add')"
            label-for="input-emails-invite">
            <b-input
              type="email"
              v-model="project.sharedTo"></b-input>
          </b-form-group>
          <p
            class="text-danger"
            v-if="project.sharedToError != ''">
            {{project.sharedToError}}
          </p>
          <b-button
            :disabled="!enabledToShare || !isOnline"
            @click="addEmailForShare">{{ $t('common.add') }}</b-button>
          <div
            class="my-3"
            v-if="project.tmp_invite_emails && project.tmp_invite_emails.length">
            <p class="mb-1 font-weight-light">{{ $t('common.project_will_be_shared') }}</p>
            <b-badge
            class="mx-1"
            v-for="(email, index) in project.tmp_invite_emails"
            :key="index"
            variant="dark">
              {{ email }}
              <span @click="removeSharedEmail(index)" style="cursor: pointer;">x</span>
            </b-badge>
          </div>
          <b-form-group
            :label="$t('common.can')">
            <b-form-select
              v-model="project.sharedType"
              :options="[{value: 0, text: $t('common.can_view_project') || 'View the project'}, {value: 1, text: $t('common.can_view_edit_project') || 'View and edit the project'}]"></b-form-select>
          </b-form-group>
          <b-button
            variant="success"
            @click="saveSharedProject">{{ $t('common.invite') }}</b-button>
        </b-container>
      </b-tab>
      <b-tab
        :title="$t('common.users_with_access') || 'Users with access'">
        <b-container class="pt-3">
          <h4>{{ $t('common.users_with_access')}}</h4>
          <b-table
            show-empty
            responsive
            :fields="[{key: 'username', label: $t('common.username')}, {key: 'first_name', label: $t('common.first_name')}, {key: 'last_name', label: $t('common.last_name')}, {key: 'user_can', label: $t('common.user_can')}, {key: 'actions', label: $t('common.actions')}]"
            :items="usersAllowed">
            <template v-slot:cell(actions)="data">
              <b-button
                variant="danger"
                @click="unshare(data.index, data.item.id)">{{ $t('common.unshare') }}</b-button>
            </template>
            <template v-slot:cell(user_can)="data">
              <b-form-select
                v-model="data.item.user_can"
                :options="[{value: 0, text: $t('common.can_view') || 'Can view'}, {value: 1, text: $t('common.can_view_edit') || 'Can view and edit'}]"
                @change="changePermission(data.item.project_id, data.item.id, data.item.user_can, data.item.index)"></b-form-select>
            </template>
            <template v-slot:empty>
              <p class="font-weight-light text-center my-3">{{ $t('common.no_users_access') }}</p>
            </template>
          </b-table>
          <div
            v-if="project.invite_emails && project.invite_emails.length">
            <h4>{{ $t('common.pending_access') }}</h4>
            <b-table-simple
              v-if="project.invite_emails && project.invite_emails.length">
              <b-thead>
                <b-tr>
                  <b-th>{{ $t('common.email') }}</b-th>
                  <b-th>{{ $t('common.actions') }}</b-th>
                </b-tr>
              </b-thead>
              <b-tbody>
                <b-tr v-for="(email, index) of project.invite_emails" :key="index">
                  <b-td>{{ email }}</b-td>
                  <b-td>
                    <b-button
                      variant="danger"
                      @click="unshareInvited(email)">
                      {{ $t('common.unshare') }}
                    </b-button>
                  </b-td>
                </b-tr>
              </b-tbody>
            </b-table-simple>
          </div>
        </b-container>
      </b-tab>
      <b-tab
        :title="$t('common.temporary_sharing')">
        <b-container class="pt-3">
          <p>{{ $t('common.temporary_sharing_description') }}</p>
          <b-form-checkbox
            switch
            v-model="project.sharedTokenOnOff"
            :value="true"
            :unchecked-value="false">{{ $t('common.generate_temporary_url') }} <span class="text-danger">{{ $t('common.temporary_url_warning') }}</span></b-form-checkbox>
          <div
            v-if="project.sharedTokenOnOff"
            class="mt-2">
            <p>{{ $t('common.copy_share_url') }}</p>
            <b-form-input
              :value="project.temporaryUrl"></b-form-input>
          </div>
        </b-container>
      </b-tab>
    </b-tabs>
  </b-modal>
</template>

<script>
/* eslint-disable vue/no-mutating-props */
/* eslint-disable no-unused-vars */
import Api from '@/utils/Api'

const videoHelp = () => import(/* webpackChunkName: "videohelp" */'../../videoHelp')

export default {
  name: 'ShareProjectModal',
  components: {
    videoHelp
  },
  props: {
    project: {
      type: Object,
      required: true,
      default: () => ({})
    },
    usersAllowed: {
      type: Array,
      default: () => []
    },
    initialTab: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      tabIndex: 0,
      enabledToShare: false
    }
  },
  watch: {
    initialTab (val) {
      this.tabIndex = val
    },
    'project.sharedTo': function () {
      const project = this.project
      let regex = /^\S+@\S+\.\S+$/
      let enabledButton = true
      if (Object.prototype.hasOwnProperty.call(project, 'sharedTo') && project.sharedTo) {
        const emails = project.sharedTo.split(',')
        for (let email of emails) {
          if (!regex.test(email.trim())) {
            enabledButton = false
          }
        }
      } else {
        enabledButton = false
      }
      this.enabledToShare = enabledButton
    },
    'project.sharedTokenOnOff': function () {
      let project = this.project
      let isPublic = false
      if (Object.prototype.hasOwnProperty.call(project, 'sharedTokenOnOff')) {
        if (project.sharedTokenOnOff) {
          if (!project.sharedToken || !project.sharedToken.length) {
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
        Api.patch('/sharedLink', { params })
          .then(() => {})
          .catch((error) => {
            console.log(error)
          })
      }
    }
  },
  methods: {
    show () {
      this.tabIndex = this.initialTab
      this.$refs['modal-share-options'].show()
    },
    hide () {
      this.$refs['modal-share-options'].hide()
    },
    onHidden () {
      this.$emit('hidden')
    },
    addEmailForShare: function () {
      if (!this.project.sharedTo) return
      let emails = this.project.sharedTo.split(',')
      this.project.tmp_invite_emails = emails.map(e => {
        if (e.trim() !== this.$store.state.user.name) {
          return e.trim().toLowerCase()
        }
        return null
      }).filter(Boolean)
    },
    saveSharedProject: async function () {
      if (!this.project.tmp_invite_emails || !this.project.tmp_invite_emails.length) return
      const sharedEmails = this.project.tmp_invite_emails.join()
      const projectId = this.project.id
      const params = {
        current_user: this.$store.state.user.name,
        emails: sharedEmails,
        user_can: this.project.sharedType || 0,
        org: this.$route.params.id
      }
      this.$emit('processing', true)
      await Api.post(`/share/project/${projectId}`, params)
        .then((response) => {
          if (response.status === 200 && response.data && response.data.length) {
            this.$emit('project-shared', response.data[0])
            this.project.sharedTo = ''
            this.project.tmp_invite_emails = []
          }
        }).catch((error) => {
          console.log(error)
        }).finally(() => {
          this.$emit('processing', false)
        })
    },
    removeUser: async function (project, params) {
      try {
        const data = await Api.post(`/share/project/${project}/unshare`, null, {params: params})
        return data
      } catch (error) {
        console.log('errors: => ', error)
      }
    },
    unshare: function (_index, userId) {
      const projectId = this.project.id
      const params = {
        'user_id': userId,
        'org_id': this.$route.params.id,
        'current_user': this.$store.state.user.id
      }
      this.$emit('processing', true)
      this.removeUser(projectId, params)
        .then((response) => {
          if (response && response.status === 200) {
            this.$emit('user-unshared', projectId)
          }
        }).finally(() => {
          this.$emit('processing', false)
        })
    },
    unshareInvited: function (email) {
      const projectId = this.project.id
      this.$emit('processing', true)
      Api.post(`/share/project/${projectId}/unshare?email=${email}&org_id=${this.$route.params.id}&current_user=${this.$store.state.user.id}`)
        .then((response) => {
          this.$emit('invited-unshared', response.data)
        })
        .catch((error) => {
          console.log(error)
        })
        .finally(() => {
          this.$emit('processing', false)
        })
    },
    removeSharedEmail: function (index) {
      this.project.tmp_invite_emails.splice(index, 1)
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
      this.$emit('processing', true)
      Api.patch(`/share/project/${projectId}/options-update`, params)
        .then((response) => {
          if (response.data && response.data.length) {
            this.$emit('permission-changed', response.data[0])
          }
        }).catch((error) => {
          console.log(error)
        }).finally(() => {
          this.$emit('processing', false)
        })
    }
  }
}
</script>
