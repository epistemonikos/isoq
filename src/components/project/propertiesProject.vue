<template>
    <div class="pb-5">
        <b-row>
            <b-col
              cols="12">
              <b-alert
                :show="msgUpdateProject !== null && msgUpdateProject.length"
                dismissible
                variant="info"
                @dismissed="dismissAlertProject">
                {{ msgUpdateProject }}
              </b-alert>
            </b-col>
            <b-col
              cols="12"
              class="mb-2">
              <h2>Project properties</h2>
            </b-col>
          </b-row>
          <b-row>
            <b-col
              cols="12">
              <organizationForm
                :formData="project"
                :canWrite="canWrite"></organizationForm>
            </b-col>
          </b-row>
          <b-row align-h="end" v-if="canWrite">
            <b-col
              cols="6"
              class="mb-3">
              <b-button
                block
                variant="outline-success"
                @click="updateProjectInfo">
                Save
              </b-button>
            </b-col>
          </b-row>
    </div>
</template>

<script>
// import axios
import axios from 'axios'

export default {
  name: 'propertiesProject',
  components: {
    organizationForm: () => import(/* webpackChunkName: "organizationForm" */'../organization/organizationForm')
  },
  props: {
    project: {
      type: Object,
      required: true
    },
    canWrite: {
      type: Boolean,
      required: true
    }
  },
  data: function () {
    return {
      msgUpdateProject: null
    }
  },
  methods: {
    dismissAlertProject: function () {
      this.msgUpdateProject = null
    },
    updateProjectInfo: function () {
      let project = JSON.parse(JSON.stringify(this.project))
      project.private = true
      project.is_public = false
      if (project.public_type !== 'private') {
        project.private = false
        project.is_public = true
      }
      axios.patch(`/api/isoqf_projects/${project.id}`, project)
        .then(() => {
          let params = {
            project_id: project.id,
            is_public: project.is_public,
            private: project.private,
            license_type: project.license_type,
            public_type: project.public_type
          }
          axios.get(`/api/publish`, {params})
            .then(() => {
              this.msgUpdateProject = 'The project has been updated'
              window.scrollTo({ top: 0, behavior: 'smooth' })
              this.$emit('update-modification')
            })
        })
        .catch((error) => {
          this.msgUpdateProject = error
        })
    }
  }
}
</script>
