<template>
  <div>
    <clone-project-btn
      :item="item"
      :projects="projects"
      @getProjects="getProjects"></clone-project-btn>
    <share-project
      :item="item"
      :projects="projects"
      @getProjects="getProjects"></share-project>
    <!--
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
import shareProjectBtn from './shareProject'

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
    'clone-project-btn': cloneProjectBtn,
    'share-project': shareProjectBtn
  }
}
</script>

<style>

</style>
