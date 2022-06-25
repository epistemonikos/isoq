<template>
  <div>
    <clone-project-btn
      :item="item"
      :projects="projects"
      @getProjects="getProjects"></clone-project-btn>
    <!-- <b-button
      v-if="item.is_owner && (item.sharedToken.length)"
      title="You have a temporary link enabled for this project. It will remain enabled until you manually switch it off. Click here to switch it off"
      variant="outline-secondary"
      @click="modalShareOptions(item.id, 2)">
      <font-awesome-icon
        icon="link"></font-awesome-icon>
    </b-button>
    <b-button
      v-if="item.is_owner"
      title="Share"
      variant="outline-secondary"
      @click="modalShareOptions(item.id)">
      <font-awesome-icon
        icon="users"></font-awesome-icon>
    </b-button>
    <b-button
      v-if="item.allow_to_write"
      title="Edit"
      variant="outline-success"
      @click="openModalEditProject(item)">
      <font-awesome-icon
        icon="edit"></font-awesome-icon>
    </b-button>
    <b-button
      v-if="item.is_owner"
      title="Remove"
      variant="outline-danger"
      @click="modalRemoveProject(item)">
      <font-awesome-icon
        icon="trash"></font-awesome-icon>
    </b-button> -->
  </div>
</template>

<script>
import cloneProjectBtn from './cloneProject'

export default {
  name: 'actionButtons',
  props: {
    item: Object,
    projects: Array
  },
  data () {
    return {}
  },
  methods: {
    getProjects: function () {
      this.$emit('getProjects')
    }
  },
  components: {
    'clone-project-btn': cloneProjectBtn
  }
}
</script>

<style>

</style>
