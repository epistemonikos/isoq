<template>
  <b-modal
    id="new-project"
    ref="new-project"
    size="xl"
    :title="(project.id) ? $t('common.edit_isoq_table') || 'Edit iSoQ table' : $t('common.new_isoq_table') || 'New iSoQ table'"
    @ok="save"
    @cancel="closeModalProject"
    @hidden="closeModalProject"
    :ok-disabled="!project.name || !canEditProject"
    :ok-title="$t('common.save')"
    ok-variant="outline-success"
    cancel-variant="outline-secondary">
    <b-alert
      :show="error.status ? dismissCountDown : 0"
      @dismiss-count-down="countDownChanged"
      variant="danger"
      v-if="error.status">
        <p>[{{error.status}}] - {{error.statusText}}</p>
        <p>This alert will dismiss after {{ dismissCountDown }} seconds...</p>
      </b-alert>
    <b-alert
      show
      variant="warning"
      v-if="lockedByUser">
      {{ $t('lock.project_locked_by', { user: lockedByUser }) || `Project is currently being edited by ${lockedByUser}. Read-only mode.` }}
    </b-alert>
    <organizationForm
      ref="organizationForm"
      :formData="project"
      :canEdit="canEditProject"
      :isModal="true"
      @modal-notification="modalNotification"></organizationForm>
  </b-modal>
</template>

<script>
import LockService from '@/services/lockService'
const organizationForm = () => import(/* webpackChunkName: "organizationForm" */'../../organization/organizationForm')

export default {
  name: 'ProjectFormModal',
  components: {
    organizationForm
  },
  props: {
    project: {
      type: Object,
      required: true,
      default: () => ({})
    },
    canEditProject: {
      type: Boolean,
      default: false
    },
    lockedByUser: {
      type: String,
      default: null
    }
  },
  data () {
    return {
      dismissCountDown: 0,
      error: {
        status: '',
        statusText: ''
      }
    }
  },
  methods: {
    show () {
      this.$refs['new-project'].show()
    },
    hide () {
      this.$refs['new-project'].hide()
    },
    save: function (e) {
      if (e) e.preventDefault()
      this.$refs['organizationForm'].save()
    },
    closeModalProject: function () {
      LockService.release()
      this.$emit('cancel')
    },
    modalNotification: function () {
      this.hide()
      this.$emit('project-saved')
    },
    countDownChanged (dismissCountDown) {
      this.dismissCountDown = dismissCountDown
    },
    showError (error) {
      this.error.status = error.status
      this.error.statusText = error.statusText
      this.dismissCountDown = 10
    }
  }
}
</script>
