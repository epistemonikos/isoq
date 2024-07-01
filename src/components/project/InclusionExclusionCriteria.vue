<template>
  <div>
    <h4>STEP 2: Enter the study <b>inclusion and exclusion criteria</b> used in the review (recommended)</h4>
    <b-container>
      <b-row>
        <b-col
          cols="12"
          md="6"
          class="pl-0">
          <criteria
            v-if="ui.project.show_criteria"
            label="Inclusion criteria"
            description="Please enter the study inclusion criteria used in the review"
            :isDisabled="checkPermissions"
            criteria="inclusion"
            :dataTxt="project.inclusion"
            @update-modification="updateModificationTime()">
          </criteria>
        </b-col>
        <b-col
          cols="12"
          md="6"
          class="pr-0">
          <criteria
            v-if="ui.project.show_criteria"
            label="Exclusion criteria"
            description="Please enter the study exclusion criteria used in the review"
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
