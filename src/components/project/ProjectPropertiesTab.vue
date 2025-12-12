<template>
  <propertiesProject
    :project="project"
    @update-modification="$emit('update-modification')"
    :canWrite="canWrite"
    @update-project="$emit('update-project', $event)">
  </propertiesProject>
</template>

<script>
const propertiesProject = () => import(/* webpackChunkName: "propertiesProject" */ './propertiesProject.vue')

export default {
  name: 'ProjectPropertiesTab',
  components: {
    propertiesProject
  },
  props: {
    project: {
      type: Object,
      required: true
    },
    canWrite: {
      type: Boolean,
      default: false
    }
  }
}
</script>
