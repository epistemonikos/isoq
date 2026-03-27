<template>
  <b-button
    variant="primary"
    size="sm"
    @click="toggleConcerns"
    :disabled="!hasVisibleCamelotFields"
    :style="value ? { backgroundColor: '#19426E', borderColor: '#19426E' } : {}">
    {{ value ? $t('camelot.step_three.hide_concerns') : $t('camelot.step_three.show_concerns') }}
    <font-awesome-icon :icon="value ? 'comment-slash' : 'comment'" class="ml-1" />
  </b-button>
</template>

<script>
export default {
  name: 'ToggleConcernsButton',
  props: {
    // Current value of showConcerns
    value: {
      type: Boolean,
      required: true
    },
    hasVisibleCamelotFields: {
      type: Boolean,
      required: true
    },
    visibleColumnKeys: {
      type: Array,
      required: true
    },
    camelot: {
      type: Object,
      required: true
    }
  },
  methods: {
    toggleConcerns () {
      const newValue = !this.value
      this.$emit('input', newValue)
      
      let newVisibleKeys = [...this.visibleColumnKeys]
      
      if (newValue) {
        // Add comment keys only for CAMELOT fields that are currently visible
        const commentKeys = []
        if (this.camelot && this.camelot.categories) {
          this.camelot.categories.forEach(cat => {
            if (cat.options) {
              const extractedOpt = cat.options.find(opt => !opt.key.endsWith('_comments'))
              const commentOpt = cat.options.find(opt => opt.key && opt.key.endsWith('_comments'))
              
              if (extractedOpt && commentOpt && newVisibleKeys.includes(extractedOpt.key)) {
                commentKeys.push(commentOpt.key)
              }
            }
          })
        }
        
        // Merge unique keys
        commentKeys.forEach(k => {
          if (!newVisibleKeys.includes(k)) {
            newVisibleKeys.push(k)
          }
        })
      } else {
        // Remove all comment keys when hiding
        newVisibleKeys = newVisibleKeys.filter(k => !k.endsWith('_comments'))
      }
      
      this.$emit('update:visibleColumnKeys', newVisibleKeys)
    }
  }
}
</script>
