<template>
  <div>
    <b-form-group
      :label="ui.label"
      :label-for="`${local_criteria}-criteria`"
      :description="ui.description">
      <b-form-textarea
        :disabled="!ui.canEdit"
        :id="`${local_criteria}-criteria`"
        rows="6"
        max-rows="100"
        v-model="local_data"></b-form-textarea>
    </b-form-group>
    <div
      v-if="ui.canEdit"
      class="float-right">
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
import Api from '@/utils/Api'
import _debounce from 'lodash.debounce'

export default {
  name: 'Criteria',
  props: {
    canEdit: Boolean,
    label: String,
    description: String,
    dataTxt: String,
    criteria: String
  },
  created: function () {
    this.local_criteria = this.criteria
    this.ui.canEdit = this.canEdit
    this.ui.label = this.label
    this.ui.description = this.description
    this.local_data = this.dataTxt

    this.saveCriteria = _debounce(function () { this.criteriaAction(this.local_criteria) }, 1500)
  },
  watch: {
    canEdit: function (newVal) {
      this.ui.canEdit = newVal
    },
    dataTxt: {
      immediate: true,
      handler: function (newVal) {
        this.local_data = newVal || ''
      }
    },
    local_data: function (newVal) {
      if (newVal !== this.dataTxt) {
        this.saveCriteria()
      }
    }
  },
  data: function () {
    return {
      ui: {
        canEdit: false,
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
            loading_txt: this.$t('common.save')
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
            loading_txt: this.$t('common.save')
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
      this.ui.canEdit = this.canEdit
      this.ui.label = this.label
      this.ui.description = this.description
    },
    printErrors: function (error) {
      console.error(error)
    },
    criteriaAction: function (type, action = '') {
      let params = {}
      if (type === 'inclusion') {
        this.ui.project.inclusion.loading = true
        this.ui.project.inclusion.loading_txt = this.$t('common.saving')
        params.inclusion = this.local_data || ''
        if (action === 'clean') {
          params.inclusion = ''
        }
      } else {
        this.ui.project.exclusion.loading = true
        this.ui.project.exclusion.loading_txt = this.$t('common.saving')
        params.exclusion = this.local_data || ''
        if (action === 'clean') {
          params.exclusion = ''
        }
      }
      if (this.ui.canEdit) {
        Api.patch(`/isoqf_projects/${this.$route.params.id}`, params)
          .then((response) => {
            if (type === 'inclusion') {
              this.ui.project.inclusion.loading = false
              this.ui.project.inclusion.loading_txt = this.$t('common.save')
              this.ui.project.inclusion.success.dismissCountDown = this.ui.project.inclusion.success.dismissSecs
              this.ui.project.type = 'inclusion'
              // this.getProject()
            }
            if (type === 'exclusion') {
              this.ui.project.exclusion.loading = false
              this.ui.project.exclusion.loading_txt = this.$t('common.save')
              this.ui.project.exclusion.success.dismissCountDown = this.ui.project.exclusion.success.dismissSecs
              this.ui.project.type = 'exclusion'
              // this.getProject()
            }
            this.$emit('criteria-saved', { field: type, value: this.local_data })
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
}
</script>
