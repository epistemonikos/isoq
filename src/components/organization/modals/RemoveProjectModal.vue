<template>
  <b-modal
    id="modal-remove-project"
    ref="modal-remove-project"
    :title="$t('common.delete_project')"
    @ok="removeProject"
    @cancel="cleanProject"
    :ok-title="$t('common.remove')"
    ok-variant="outline-danger"
    cancel-variant="outline-secondary">
    <p>{{ $t('common.confirm_remove_project') }} "<b>{{ project ? project.name : '' }}</b>" {{ $t('common.and_all_data') }}?</p>
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
    }
  },
  methods: {
    show () {
      this.$refs['modal-remove-project'].show()
    },
    hide () {
      this.$refs['modal-remove-project'].hide()
    },
    removeProject: function (e) {
      if (e) e.preventDefault() // prevent modal from closing automatically
      this.$emit('processing', true)
      Api.delete(`/remove/project/${this.project.id}`)
        .then((response) => {
          if (response.data.status) {
            this.$emit('project-removed')
            this.hide()
          } else {
            console.log(response.data)
          }
        })
        .catch((error) => {
          console.log(error)
        })
        .finally(() => {
          this.$emit('processing', false)
        })
    },
    cleanProject: function () {
      this.$emit('cancel')
    }
  }
}
</script>
