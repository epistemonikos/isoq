<template>
  <div
    class="assessment-circle d-inline-flex align-items-center justify-content-center"
    :class="[stateClass, { 'is-clickable': clickable }]"
    :style="circleStyle"
    :title="title"
    :aria-label="title"
    v-b-tooltip.hover
    @click="$emit('click')">
    <font-awesome-icon v-if="missingExplanation" icon="exclamation" class="circle-warning-icon" />
  </div>
</template>

<script>
import camelotCircleMixin from '@/mixins/camelotCircleMixin'

export default {
  name: 'AssessmentCircle',
  mixins: [camelotCircleMixin],
  props: {
    stage: { type: Number, required: true },
    optionIndex: { type: Number, required: true },
    item: { type: Object, default: null },
    // camelotCircleMixin reads `this.responses` to map an option to its colour.
    responses: { type: Array, default: () => [] },
    clickable: { type: Boolean, default: false },
    // Optional base tooltip from the caller (the summary table shows the
    // response text there). The warning is appended to it, never replaces it.
    tooltip: { type: String, default: '' }
  },
  computed: {
    stateClass () {
      return this.getCircleClass(this.stage, this.optionIndex, this.item)
    },
    circleStyle () {
      return this.getCircleStyle(this.stage, this.optionIndex, this.item)
    },
    missingExplanation () {
      return this.isMissingExplanation(this.stage, this.optionIndex, this.item)
    },
    title () {
      if (!this.missingExplanation) return this.tooltip || null
      const warning = this.$t('camelot.step_four.no_explanation')
      return this.tooltip ? `${this.tooltip} — ${warning}` : warning
    }
  }
}
</script>

<style lang="scss" scoped>
.assessment-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.is-clickable {
  cursor: pointer;

  &:hover {
    transform: scale(1.2);
  }
}

.circle-filled {
  border: none;
}

.circle-not-completed {
  border: 2px dashed #B3B3B3;
  background-color: transparent;
}

// Assessed, but the explanation is still missing. The fill stays — it is what
// the grid reads at a glance — and the dashed ring carries the warning. Both
// the ring and the icon colour come inline, from the mixin's contrast check.
.circle-incomplete {
  border: 2px dashed;
}

.circle-warning-icon {
  font-size: 11px;
  line-height: 1;
}
</style>
