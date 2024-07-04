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
      :canWrite="canWrite"></organizationForm>
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
    canWrite: {
      type: Boolean,
      required: true
    }
  }
}
</script>
