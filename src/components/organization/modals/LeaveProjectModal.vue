<template>
  <b-modal
    ref="unlink-project"
    id="unlink-project"
    :title="$t('common.leave_project')"
    @ok="leaveProject"
    @cancel="cancelLeaveProject"
    :ok-title="$t('common.leave')">
    <p>{{ $t('common.leave_project_confirm') }} <b>{{ project ? project.name : '' }}</b></p>
  </b-modal>
</template>

<script>
import Api from '@/utils/Api'

export default {
  name: 'LeaveProjectModal',
  props: {
    project: {
      type: Object,
      required: true,
      default: () => ({})
    }
  },
  methods: {
    show () {
      this.$refs['unlink-project'].show()
    },
    hide () {
      this.$refs['unlink-project'].hide()
    },
    leaveProject: function (e) {
      if (e) e.preventDefault() // prevent modal from closing automatically
      const userId = this.$store.state.user.id
      this.$emit('processing', true)
      Api.post(`/project/${this.project.id}/unsubscribe?userId=${userId}`)
        .then((r) => {
          this.$emit('project-left')
          this.hide()
        })
        .catch((e) => {
          console.log(e)
        })
        .finally(() => {
          this.$emit('processing', false)
        })
    },
    cancelLeaveProject: function () {
      this.$emit('cancel')
    }
  }
}
</script>
