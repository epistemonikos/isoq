<template>
  <div>
    <b-row>
      <b-col
        cols="12">
        <b-alert
          :show="msgUpdateProject !==null && msgUpdateProject.length"
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
          :canWrite="checkPermissions"></organizationForm>
      </b-col>
    </b-row>
    <b-row align-h="end" v-if="checkPermissions">
      <b-col
        cols="6">
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
import axios from 'axios'
const organizationForm = () => import(/* webpackChunkName: "organizationform" */ '@/components/organization/organizationForm')

export default {
  name: 'projectProperties',
  props: {
    project: Object,
    checkPermissions: Boolean
  },
  components: {
    organizationForm
  },
  data () {
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
          this.msgUpdateProject = 'The project has been updated'
          window.scrollTo({ top: 0, behavior: 'smooth' })
          // this.updateModificationTime()
          this.$emit('updateModificationTime')
        })
        .catch((error) => {
          this.msgUpdateProject = error
        })
    }
  }
}
</script>

<style>

</style>
