<template>
  <b-modal
    id="clone-modal"
    ref="clone-modal"
    :title="$t('common.duplicate_project') || 'Duplicate a project'"
    :ok-title="$t('common.duplicate')"
    :cancel-title="$t('common.close')"
    @ok="startCloning"
    @cancel="closeCloneModal"
    :cancel-disabled="isCopying"
    :ok-disabled="(isCopying || uiCopy.showWarning)"
    no-close-on-backdrop
    no-close-on-esc>
    <template v-if="project && project.id != null">
        <p>
          {{ $t('common.duplicate_instruction_1') }} "<b>{{project.name}}</b>".
          <br>
          {{ $t('common.duplicate_instruction_2') }}
          <br>
          {{ $t('common.duplicate_instruction_3') }}
        </p>
    </template>
    <template v-if="isCopying && uiCopy.showWarning">
      <div
        class="text-center">
        <b-spinner
          class="text-center"
          label="Loading..." variant="secondary"></b-spinner>
      </div>
    </template>
    <template v-if="!isCopying && uiCopy.showWarning">
      <p class="text-center text-success">{{ $t('common.duplicate_complete') || 'Duplicate complete. You can now close this modal.' }}</p>
    </template>
  </b-modal>
</template>

<script>
import Api from '@/utils/Api'

export default {
  name: 'CloneProjectModal',
  props: {
    project: {
      type: Object,
      required: true,
      default: () => ({})
    },
    uiCopy: {
      type: Object,
      required: true
    }
  },
  computed: {
    isCopying () {
      return this.uiCopy.project || this.uiCopy.lists || this.uiCopy.references || this.uiCopy.findings || this.uiCopy.replaceReferences || this.uiCopy.copyOf || this.uiCopy.referencesTable
    }
  },
  methods: {
    show () {
      this.$refs['clone-modal'].show()
    },
    hide () {
      this.$refs['clone-modal'].hide()
    },
    startCloning: function (event) {
      if (event) event.preventDefault()
      this.$emit('clone-started')

      if (this.project && this.project.id !== null) {
        this.generateACopyOfAProject(this.project.id)
      }
    },
    generateACopyOfAProject: async function (id) {
      this.$emit('update-copy-state', { key: 'project', value: true })
      Api.get(`/clone/project/${id}/org/${this.$route.params.id}`)
        .then(() => {
          this.$emit('update-copy-state', { key: 'project', value: false })
          this.$emit('project-cloned')
        })
        .catch((error) => {
          this.$emit('update-copy-state', { key: 'project', value: false })
          if (error.response) {
            console.log(error.response.data)
          } else if (error.request) {
            console.log('Request', error.request)
          } else {
            console.log('Error', error.message)
          }
        })
    },
    closeCloneModal: function () {
      this.$emit('cancel')
      this.hide()
    }
  }
}
</script>
