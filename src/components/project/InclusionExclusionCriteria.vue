<template>
  <div>
    <h4 v-html="$t('inclusion.step_title')"></h4>
    <b-container fluid>
      <b-row>
        <b-col
          cols="6"
          class="pl-0">
          <criteria
            v-if="ui.project.show_criteria"
            :label="$t('inclusion.inclusion_criteria')"
            :description="$t('inclusion.inclusion_placeholder')"
            :isDisabled="checkPermissions"
            criteria="inclusion"
            :dataTxt="project.inclusion"
            @update-modification="updateModificationTime()">
          </criteria>
        </b-col>
        <b-col
          cols="6"
          class="pr-0">
          <criteria
            v-if="ui.project.show_criteria"
            :label="$t('inclusion.exclusion_criteria')"
            :description="$t('inclusion.exclusion_placeholder')"
            :isDisabled="checkPermissions"
            criteria="exclusion"
            :dataTxt="project.exclusion"
            @update-modification="updateModificationTime()">
          </criteria>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
export default {
  name: 'InclusionExclusionCriteria',
  props: {
    checkPermissions: {
      type: Boolean,
      required: true
    },
    project: {
      type: Object,
      required: true
    },
    ui: {
      type: Object,
      required: true
    }
  },
  components: {
    criteria: () => import('@/components/Criteria.vue')
  },
  methods: {
    updateModificationTime () {
      this.$emit('update-modification')
    }
  }
}
</script>
