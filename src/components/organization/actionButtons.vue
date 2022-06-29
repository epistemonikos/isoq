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
    <edit-project
      :item="item"
      :projects="projects"
      @getProjects="getProjects"></edit-project>
    <!--
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
import editProject from './editProject'

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
    'share-project': shareProjectBtn,
    'edit-project': editProject
  }
}
</script>

<style>

</style>
