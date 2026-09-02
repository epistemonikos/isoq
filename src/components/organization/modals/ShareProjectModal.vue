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
            <template v-slot:cell(username)="data">
              <!-- Estado: ACTIVO (normal) -->
              <span v-if="data.item.state === 'active'">
                {{ data.item.username || data.item.email }}
              </span>
              <!-- Estado: INACTIVO (tachado) -->
              <span v-else-if="data.item.state === 'inactive'" class="text-muted"
                :style="{ textDecoration: 'line-through' }">
                {{ data.item.username || data.item.email }}
                <span style="font-size: 0.9em;">*</span>
              </span>
            </template>
            <template v-slot:cell(actions)="data">
              <b-button
                variant="danger"
                @click="unshare(data.index, data.item)">{{ $t('common.unshare') }}</b-button>
            </template>
            <template v-slot:cell(user_can)="data">
              <b-form-select
                v-model="data.item.user_can"
                :disabled="data.item.state !== 'active'"
                :title="data.item.state !== 'active' ? getDisabledTitle(data.item.state) : ''"
                :options="[{value: 0, text: $t('common.can_view') || 'Can view'}, {value: 1, text: $t('common.can_view_edit') || 'Can view and edit'}]"
                @change="changePermission(data.item.project_id, data.item.id, data.item.user_can, data.item.index)"></b-form-select>
            </template>
            <template v-slot:empty>
              <p class="font-weight-light text-center my-3">{{ $t('common.no_users_access') }}</p>
            </template>
          </b-table>
          <p class="text-muted small mt-2">
            <span class="font-italic">*{{ $t('common.inactive_user_note') || 'Inactive user - cannot modify permissions' }}</span>
          </p>
          <!-- Usuarios pendientes (sin cuenta) -->
          <div
            v-if="project.pending_users && project.pending_users.length">
            <h4 class="mt-4">{{ $t('common.pending_access') }}</h4>
            <b-table
              show-empty
              responsive
              :fields="[{key: 'email', label: $t('common.email')}, {key: 'permission', label: $t('common.user_can')}, {key: 'expires_at', label: $t('common.expires')}, {key: 'actions', label: $t('common.actions')}]"
              :items="project.pending_users">
              <template v-slot:cell(email)="data">
                <span style="font-style: italic; color: #0066cc;">{{ data.item.email }}</span>
              </template>
              <template v-slot:cell(permission)="data">
                <span>{{ data.item.user_can === 0 ? $t('common.can_view') : $t('common.can_view_edit') }}</span>
              </template>
              <template v-slot:cell(expires_at)="data">
                <span class="small text-muted">{{ formatDate(data.item.expires_at) }}</span>
              </template>
              <template v-slot:cell(actions)="data">
                <b-button
                  variant="danger"
                  size="sm"
                  @click="unshare(data.index, data.item)">
                  {{ $t('common.revoke') || 'Revoke' }}
                </b-button>
              </template>
              <template v-slot:empty>
                <p class="font-weight-light text-center my-3">{{ $t('common.no_pending_invitations') || 'No pending invitations' }}</p>
              </template>
            </b-table>
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
      const project = this.project
      const enable = !!(project.sharedTokenOnOff)
      if (!enable) {
        project.sharedToken = ''
        project.temporaryUrl = ''
      }
      if (Object.prototype.hasOwnProperty.call(project, 'id') && project.id !== null) {
        Api.patch('/sharedLink', { params: { project_id: project.id, enable } })
          .then((response) => {
            if (enable && response.data && response.data.sharedToken) {
              project.sharedToken = response.data.sharedToken
              this.$set(project, 'temporaryUrl', window.location.origin + '/#/shared/' + response.data.sharedToken)
              this.$emit('shared-link-generated', { projectId: project.id, sharedToken: response.data.sharedToken })
            }
          })
          .catch((error) => {
            console.log(error)
          })
      }
    }
  },
  methods: {
    show () {
      this.tabIndex = this.initialTab
      if (this.project.sharedTokenOnOff && this.project.sharedToken && !this.project.temporaryUrl) {
        this.project.temporaryUrl = window.location.origin + '/#/shared/' + this.project.sharedToken
      }
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
          if (response.status === 200 && response.data) {
            // Backend devuelve el proyecto como objeto, no como array
            const projectData = Array.isArray(response.data) ? response.data[0] : response.data
            this.$emit('project-shared', projectData)
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
    unshare: function (_index, user) {
      const projectId = this.project.id
      const params = {
        'org_id': this.$route.params.id,
        'current_user': this.$store.state.user.id
      }

      // Detectar si es pendiente: tiene email pero NO id
      if (user.email && !user.id) {
        params.email = user.email
      } else {
        params.user_id = user.id
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
    },
    formatDate: function (dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleDateString(this.$i18n.locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },
    getDisabledTitle: function (state) {
      if (state === 'inactive') {
        return this.$t('common.inactive_user') || 'Inactive user'
      } else if (state === 'pending') {
        return this.$t('common.pending_user_cannot_modify') || 'Pending users cannot have permissions modified until they accept the invitation'
      }
      return ''
    }
  }
}
</script>
