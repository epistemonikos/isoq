<template>
  <div>
    <b-form-group
      :label="$t('Title of review')"
      label-for="input-project-list-name"
      description="Insert the title that you plan to use for this report or paper.">
      <b-form-input
        :disabled="!canWrite"
        id="input-project-list-name"
        type="text"
        required
        :placeholder="$t('Title of review')"
        v-model="formData.name"></b-form-input>
    </b-form-group>
    <b-form-group
      :label="$t('Authors')"
      label-for="input-project-authors"
      description="First then last name of all authors separated by commas">
      <b-form-input
        :disabled="!canWrite"
        id="input-project-authors"
        :placeholder="$t('Authors of review')"
        v-model="formData.authors"></b-form-input>
    </b-form-group>
    <b-form-group
      label="Corresponding author"
      label-for="input-project-author"
      description="First then last name">
      <b-form-input
        :disabled="!canWrite"
        id="input-project-author"
        v-model="formData.author"></b-form-input>
    </b-form-group>
    <b-form-group
      label="Corresponding author's email address"
      label-for="input-project-author-email">
      <b-form-input
        :disabled="!canWrite"
        type="email"
        id="input-project-author-email"
        v-model="formData.author_email"></b-form-input>
    </b-form-group>
    <b-form-group
      :label="$t('Review question')"
      label-for="input-project-review-question">
      <b-form-textarea
        :disabled="!canWrite"
        id="input-project-review-question"
        :placeholder="$t('Insert main question that the review addresses')"
        rows="6"
        max-rows="100"
        v-model="formData.review_question"></b-form-textarea>
    </b-form-group>
    <b-form-group
      :label="$t('Has this review been published?')"
      label-for="select-project-list-published-status">
      <b-select
        :disabled="!canWrite"
        id="select-project-list-published-status"
        v-model="formData.published_status"
        :options="yes_or_no"></b-select>
    </b-form-group>
    <b-form-group
      v-if="formData.published_status"
      :label="$t('URL or DOI')"
      label-for="select-project-list-url-doi">
      <b-input
        :disabled="!canWrite"
        placeholder="https://doi.org/10.1109/5.771073"
        type="url"
        id="select-project-list-url-doi"
        v-model="formData.url_doi"></b-input>
    </b-form-group>
    <b-form-group
      :label="$t('Is the iSoQ being completed by the review authors?')"
      label-for="select-project-list-completed-by-author-status">
      <b-select
        :disabled="!canWrite"
        id="select-project-list-completed-by-author-status"
        v-model="formData.complete_by_author"
        :options="yes_or_no"></b-select>
    </b-form-group>
    <b-form-group
      v-if="!formData.complete_by_author"
      label="Please list the authors of this iSoQ"
      label-for="input-project-list-authors">
      <b-form-input
        :disabled="!canWrite"
        id="input-project-list-authors"
        v-model="formData.lists_authors"></b-form-input>
    </b-form-group>
    <b-form-group
      label-for="select-project-list-status"
      description="When you finish your iSoQ you can publish some, or all of it, to the iSoQ database. Until you are finished, keep it “private”. You can change these settings at any time.">
      <template v-slot:label>
        Visibility on the iSoQ database <font-awesome-icon icon="question-circle"></font-awesome-icon>
      </template>
      <b-select
        :disabled="!canWrite"
        id="select-project-list-status"
        v-model="formData.public_type"
        :options="global_status"></b-select>
    </b-form-group>
    <template v-if="formData.public_type !== 'private'">
      <b-form-group
        label-for="select-project-list-license">
        <template v-slot:label>
          Choose a license
        </template>
        <b-select
          :disabled="!canWrite"
          id="select-project-list-license"
          v-model="defaultLicense"
          :options="global_licenses"></b-select>
      </b-form-group>
      <p v-for="license of global_licenses" :key="license.value">
        <span v-if="license.value === formData.license_type">
          <b>Explanation:</b> {{ license.explanation }}
        </span>
      </p>
    </template>
    <b-form-group
      label="Additional information"
      label-for="input-project-list-description">
      <b-form-textarea
        :disabled="!canWrite"
        id="input-project-list-description"
        placeholder="Add any additional information important to your review, for example, if it was part of a guidelines process or commissioned by an organization or government"
        v-model="formData.description"
        rows="6"
        max-rows="100"></b-form-textarea>
    </b-form-group>
  </div>
</template>

<script>
// import axios from 'axios'

export default {
  name: 'organizationForm',
  props: {
    formData: Object,
    canWrite: Boolean
  },
  data: function () {
    return {
      global_status: [
        { value: 'private', text: 'Private - Your iSoQ is not publicly available on the iSoQ database' },
        { value: 'fully', text: 'Fully Public - Your iSoQ table, Evidence Profile, and GRADE-CERQual Worksheets are publicly available on the iSoQ database' },
        { value: 'partially', text: 'Partially Public - Your iSoQ table and Evidence Profile are publicly available on the iSoQ database' },
        { value: 'minimally', text: 'Minimally Public - Your iSoQ table is available on the iSoQ database' }
      ],
      yes_or_no: [
        { value: false, text: 'no' },
        { value: true, text: 'yes' }
      ],
      global_licenses: [
        { value: 'CC-BY-NC-ND', text: 'CC BY-NC-ND', explanation: 'This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, for noncommercial purposes only, and only so long as attribution is given to the creator.' },
        { value: 'CC-BY-ND', text: 'CC BY-ND', explanation: 'This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, and only so long as attribution is given to the creator. The license allows for commercial use.' },
        { value: 'CC-BY-NC-SA', text: 'CC BY-NC-SA', explanation: 'This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.' },
        { value: 'CC-BY-NC', text: 'CC BY-NC', explanation: 'This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator.' },
        { value: 'CC-BY-SA', text: 'CC BY-SA', explanation: 'This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.' },
        { value: 'CC-BY', text: 'CC BY', explanation: 'This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use.' }
      ]
    }
  },
  computed: {
    defaultLicense: {
      get: function () {
        if (!Object.prototype.hasOwnProperty.call(this.formData, 'license_type')) {
          return 'CC-BY-NC-ND'
        } else {
          return this.formData.license_type
        }
      },
      set: function (license) {
        this.formData.license_type = license
      }
    }
  }
}
</script>

<style>

</style>
