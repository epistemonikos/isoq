<template>
  <div class="d-inline">
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
      @getProjects="getProjects"
      :newProject="false"></edit-project>
    <remove-project
      :item="item"
      :projects="projects"
      @getProjects="getProjects"></remove-project>
  </div>
</template>

<script>
import cloneProjectBtn from './cloneProject'
import shareProjectBtn from './shareProject'
import editProject from './editProject'
import removeProject from './removeProject'

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
    'edit-project': editProject,
    'remove-project': removeProject
  }
}
</script>

<style>

</style>
