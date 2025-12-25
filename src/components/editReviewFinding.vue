<template>
  <div class="mb-3">
    <template v-if="!ui.editMode">
      <h4>{{ $t('review_finding.title') }}</h4>
      <p>{{ list.name }}</p>
      <b-button
        v-if="permissions"
        variant="outline-primary"
        @click="ui.editMode=true">{{ $t('common.edit') }}</b-button>
    </template>
    <template v-if="ui.editMode">
      <div>
        <h4>{{ $t('review_finding.edit_title') }}</h4>
        <b-form>
          <b-form-textarea
            rows="3"
            max-rows="30"
            v-model="reviewContent"></b-form-textarea>
        </b-form>
        <template v-if="permissions">
          <b-button
            class="mt-2"
            :disabled="!reviewContent.trim().length"
            variant="outline-primary"
            @click="updateReview">{{ $t('common.update') }}</b-button>
          <b-button
            class="mt-2"
            variant="outline-secondary"
            @click="ui.editMode=false">{{ $t('common.cancel') }}</b-button>
        </template>
      </div>
    </template>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'editReviewFinding',
  props: {
    list: Object,
    finding: Object,
    permissions: {
      type: Boolean,
      default: () => true
    }
  },
  data: function () {
    return {
      ui: {
        editMode: false
      },
      reviewContent: this.list.name
    }
  },
  methods: {
    updateReview: function () {
      const paramsList = {
        name: this.reviewContent
      }
      let paramsFindings = this.finding
      paramsFindings.name = this.reviewContent
      paramsFindings.evidence_profile.name = this.reviewContent

      let queryLists = axios.patch(`/api/isoqf_lists/${this.list.id}`, paramsList)
      let queryFindings = axios.patch(`/api/isoqf_findings/${this.finding.id}`, paramsFindings)

      axios.all([queryLists, queryFindings])
        .then(axios.spread((responseList, responseFInding) => {
          this.$emit('update-list-data')
          this.ui.editMode = false
        }))
    }
  }
}
</script>
