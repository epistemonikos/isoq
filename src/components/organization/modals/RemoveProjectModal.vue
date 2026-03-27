<template>
  <b-modal
    id="modal-remove-project"
    ref="modal-remove-project"
    :title="$t('common.delete_project')"
    @ok="removeProject"
    @cancel="cleanProject"
    @show="resetData"
    :ok-title="$t('common.remove')"
    ok-variant="outline-danger"
    :ok-disabled="isOkDisabled"
    cancel-variant="outline-secondary">
    <p>{{ $t('common.confirm_remove_project') }} "<b>{{ project ? project.name : '' }}</b>" {{ $t('common.and_all_data') }}?</p>

    <div v-if="isShared" class="mt-3">
      <b-alert show variant="warning">
        {{ $t('common.delete_shared_project_warning') }}
      </b-alert>
      <b-form-group :label="$t('common.select_new_owner')">
        <b-form-select
          v-model="newOwner"
          :options="writeAccessUsersOptions"
          required>
          <template #first>
            <b-form-select-option :value="null" disabled>-- {{ $t('common.select_new_owner') }} --</b-form-select-option>
          </template>
        </b-form-select>
      </b-form-group>
    </div>

    <b-form-group :label="$t('common.enter_password_confirm')" class="mt-3">
      <b-form-input
        type="password"
        v-model="password"
        required
        :placeholder="$t('common.password')">
      </b-form-input>
    </b-form-group>

    <b-alert
      variant="danger"
      show
      v-if="serverError"
      dismissible
      @dismissed="serverError = null"
      class="mt-3">
      {{ serverError }}
    </b-alert>
  </b-modal>
</template>

<script>
import Api from '@/utils/Api'

export default {
  name: 'RemoveProjectModal',
  props: {
    project: {
      type: Object,
      required: true,
      default: () => ({})
    },
    usersAllowed: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      password: '',
      newOwner: null,
      serverError: null
    }
  },
  computed: {
    isShared () {
      return this.writeAccessUsers.length > 0
    },
    writeAccessUsers () {
      return this.usersAllowed.filter(user => user.user_can === 1)
    },
    writeAccessUsersOptions () {
      return this.writeAccessUsers.map(user => ({
        value: user.id,
        text: user.username || `${user.first_name} ${user.last_name}`
      }))
    },
    isOkDisabled () {
      if (!this.password) return true
      if (this.isShared && !this.newOwner) return true
      return false
    }
  },
  methods: {
    show () {
      this.$refs['modal-remove-project'].show()
    },
    hide () {
      this.$refs['modal-remove-project'].hide()
    },
    resetData () {
      this.password = ''
      this.newOwner = null
      this.serverError = null
    },
    removeProject: async function (e) {
      if (e) e.preventDefault()
      if (this.isOkDisabled) return

      this.$emit('processing', true)
      this.serverError = null
      const params = {
        password: this.password
      }
      if (this.isShared) {
        params.new_owner = this.newOwner
      }

      try {
        const response = await Api.delete(`/remove/project/${this.project.id}`, params)
        if (response.data.status) {
          this.$emit('project-removed')
          this.hide()
        } else {
          this.serverError = response.data.message || 'Error'
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          this.serverError = error.response.data.message
        } else {
          this.serverError = 'Error'
        }
        console.log(error)
      } finally {
        this.$emit('processing', false)
      }
    },
    cleanProject: function () {
      this.$emit('cancel')
    }
  }
}
</script>