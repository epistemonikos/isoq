<template>
  <div>
    <b-form-group
      :label="ui.label"
      :label-for="`${local_criteria}-criteria`"
      :description="ui.description">
      <b-form-textarea
        :disabled="ui.isEnabled"
        :id="`${local_criteria}-criteria`"
        rows="6"
        max-rows="100"
        v-model="local_data"></b-form-textarea>
    </b-form-group>
    <div class="float-right">
      <b-button
        :disabled="ui.project.inclusion.loading"
        variant="outline-success"
        @click="criteriaAction(local_criteria)">
        <b-spinner
          v-if="ui.project.inclusion.loading"
          small
          label="Saving"
          variant="success">
        </b-spinner>
        {{ ui.project.inclusion.loading_txt }}
      </b-button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import _debounce from 'lodash.debounce'

export default {
  name: 'Criteria',
  props: {
    isEnabled: Boolean,
    label: String,
    description: String,
    dataTxt: String,
    criteria: String
  },
  created: function () {
    this.saveCriteria = _debounce(function () { this.criteriaAction(this.local_criteria) }, 1500)
  },
  watch: {
    local_data: function () {
      this.saveCriteria()
    }
  },
  mounted () {
    this.loadData()
  },
  data: function () {
    return {
      ui: {
        isEnabled: false,
        label: '',
        description: '',
        project: {
          inclusion: {
            success: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            error: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            loading: false,
            loading_txt: 'Save'
          },
          exclusion: {
            success: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            error: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            loading: false,
            loading_txt: 'Save'
          }
        }
      },
      local_data: '',
      local_criteria: ''
    }
  },
  methods: {
    loadData: function () {
      this.local_data = this.dataTxt
      this.local_criteria = this.criteria
      this.ui.isEnabled = this.isEnabled
      this.ui.label = this.label
      this.ui.description = this.description
    },
    criteriaAction: function (type, action = '') {
      let params = {}
      if (type === 'inclusion') {
        this.ui.project.inclusion.loading = true
        this.ui.project.inclusion.loading_txt = 'Saving'
        params.inclusion = this.local_data || ''
        if (action === 'clean') {
          params.inclusion = ''
        }
      } else {
        this.ui.project.exclusion.loading = true
        this.ui.project.exclusion.loading_txt = 'Saving'
        params.exclusion = this.local_data || ''
        if (action === 'clean') {
          params.exclusion = ''
        }
      }
      axios.patch(`/api/isoqf_projects/${this.$route.params.id}`, params)
        .then((response) => {
          if (type === 'inclusion') {
            this.ui.project.inclusion.loading = false
            this.ui.project.inclusion.loading_txt = 'Save'
            this.ui.project.inclusion.success.dismissCountDown = this.ui.project.inclusion.success.dismissSecs
            this.ui.project.type = 'inclusion'
            // this.getProject()
          }
          if (type === 'exclusion') {
            this.ui.project.exclusion.loading = false
            this.ui.project.exclusion.loading_txt = 'Save'
            this.ui.project.exclusion.success.dismissCountDown = this.ui.project.exclusion.success.dismissSecs
            this.ui.project.type = 'exclusion'
            // this.getProject()
          }
        })
        .catch((error) => {
          this.printErrors(error)
          if (type === 'inclusion') {
            this.ui.project.inclusion.error.show = true
          }
          if (type === 'exclusion') {
            this.ui.project.exclusion.error.show = true
          }
        })
    }
  }
}
</script>
