<template>
  <div class="pb-5">
    <b-row>
      <b-col
        cols="12"
        class="mb-2">
        <h2>Project properties</h2>
      </b-col>
    </b-row>
    <organizationForm
      :formData="project"
      :canEdit="canEdit"
      :highlight="highlight"
      @update-form-data="updateFormData"></organizationForm>
  </div>
</template>

<script>
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
    canEdit: {
      type: Boolean,
      required: true
    },
    highlight: {
      type: String,
      default: ''
    }
  },
  methods: {
    updateFormData: function (data) {
      this.$emit('update-project', data)
    }
  }
}
</script>
