<template>
  <div class="mb-3 d-flex justify-content-end align-items-end">
    <b-button variant="link" class="p-0 help-link d-flex align-items-center mr-3" v-b-toggle.sidebar-help>
      <!-- <font-awesome-icon icon="question-circle" class="mr-1" /> -->
      {{ $t('camelot.step_four.how_to_read.title') }}
    </b-button>

    <b-dropdown
      variant="outline-primary"
      size="sm"
      no-caret
      right
      class="legend-dropdown"
      @show="showLegend = true"
      @hide="showLegend = false"
    >
      <template #button-content>
        {{ showLegend ? $t('camelot.step_four.legend.hide') : $t('camelot.step_four.legend.show') }}
        <div class="color-preview-bars d-inline-flex ml-2">
          <div class="color-bar" style="background-color: #1065AB;"></div>
          <div class="color-bar" style="background-color: #8EC4DE;"></div>
          <div class="color-bar" style="background-color: #F6A482;"></div>
          <div class="color-bar" style="background-color: #B31529;"></div>
          <div class="color-bar" style="background-color: #B3B3B3;"></div>
        </div>
      </template>
      <div class="p-3" style="min-width: 320px;">
        <h6 class="font-weight-bold mb-3">{{ $t('camelot.step_four.legend.title') }}</h6>
        <div v-for="response in responses" :key="response.value" class="d-flex align-items-end mb-2">
          <div class="assessment-circle circle-filled mr-2" :style="{ backgroundColor: response.color }"></div>
          <span class="small">{{ response.text }}</span>
        </div>
        <div class="d-flex align-items-end mb-0">
          <div class="assessment-circle circle-not-completed mr-2" style="border-color: #B3B3B3;"></div>
          <span class="small">{{ $t('camelot.step_four.legend.not_completed') }}</span>
        </div>
      </div>
    </b-dropdown>

    <b-sidebar id="sidebar-help" :title="$t('camelot.step_four.how_to_read.title')" width="500px" shadow right backdrop>
      <div class="px-3 py-2 sidebar-instructions">
        <h5 class="mb-3">{{ $t('camelot.step_four.how_to_read.section_1') }}</h5>
        <div v-html="$t('camelot.step_four.how_to_read.content_1')" class="mb-4"></div>
        <hr>

        <h5 class="mb-3">{{ $t('camelot.step_four.how_to_read.section_2') }}</h5>
        <p class="mb-3">{{ $t('camelot.step_four.how_to_read.content_2_pre') }}</p>

        <div class="legend-box p-3 mb-3 border rounded bg-light">
          <div v-for="response in responses" :key="response.value" class="d-flex align-items-center mb-2">
            <div class="assessment-circle circle-filled mr-2" :style="{ backgroundColor: response.color, width: '16px', height: '16px' }"></div>
            <span class="small font-weight-bold">{{ response.text }}</span>
          </div>
          <div class="d-flex align-items-center">
            <div class="assessment-circle circle-not-completed mr-2" style="border-color: #B3B3B3; width: '16px', height: '16px'"></div>
            <span class="small font-weight-bold">{{ $t('camelot.step_four.legend.not_completed') }}</span>
          </div>
        </div>

        <p class="mb-4">{{ $t('camelot.step_four.how_to_read.content_2_post') }}</p>
        <hr>

        <h5 class="mb-3">{{ $t('camelot.step_four.how_to_read.section_3') }}</h5>
        <div v-html="$t('camelot.step_four.how_to_read.content_3')" class="mb-4"></div>
        <hr>

        <h5 class="mb-3">{{ $t('camelot.step_four.how_to_read.section_4') }}</h5>
        <div v-html="$t('camelot.step_four.how_to_read.content_4')"></div>
      </div>
    </b-sidebar>
  </div>
</template>

<script>
export default {
  name: 'CamelotStepFourHeader',
  props: {
    responses: { type: Array, required: true }
  },
  data () {
    return {
      showLegend: false
    }
  }
}
</script>

<style scoped lang="scss">
.sidebar-instructions {
  font-size: 0.9rem;
  line-height: 1.4;

  h5 {
    color: #1065AB;
    font-weight: bold;
    font-size: 1.1rem;
  }

  ::v-deep ul {
    padding-left: 1.2rem;
    margin-bottom: 1rem;
    li {
      margin-bottom: 0.5rem;
    }
  }

  .legend-box {
    .assessment-circle {
      flex-shrink: 0;
    }
  }
}
</style>
