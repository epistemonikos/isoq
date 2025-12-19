<template>
  <div>
    <template v-if="!canWrite">
      <b-row>
        <b-col
          cols="12">
            <p><b>{{ $t('Title of review') }}</b></p>
            <p>{{ formData.name }}</p>
            <p><b>{{ $t('Authors') }}</b></p>
            <p>{{ formData.authors }}</p>
            <p><b>{{ $t('Corresponding author') }}</b></p>
            <p>{{ formData.author }}</p>
            <p><b>{{ $t('Corresponding author\'s email address') }}</b></p>
            <p>{{ formData.author_email }}</p>
            <p><b>{{ $t('Review question') }}</b></p>
            <p>{{ formData.review_question }}</p>
            <p><b>{{ $t('Has this review been published?') }}</b></p>
            <p>{{ formData.published_status ? 'Yes' : 'No' }}</p>
            <p v-if="formData.published_status"><b>{{ $t('URL or DOI') }}</b></p>
            <p v-if="formData.published_status">{{ formData.url_doi }}</p>
            <p><b>{{ $t('Is the iSoQ being completed by the review authors?') }}</b></p>
            <p>{{ formData.complete_by_author ? 'Yes' : 'No' }}</p>
            <p v-if="!formData.complete_by_author"><b>{{ $t('Please list the authors of this iSoQ') }}</b></p>
            <p v-if="!formData.complete_by_author">{{ formData.lists_authors }}</p>
            <p><b>{{ $t('License') }}</b></p>
            <p>{{ formData.license_type }}</p>
            <p><b>{{ $t('Additional information') }}</b></p>
            <p>{{ formData.description }}</p>
        </b-col>
      </b-row>
    </template>
    <template v-if="canWrite">
      <b-row>
        <b-col>
          <b-alert
            :show="msgUpdateProject !== null && msgUpdateProject.length"
            dismissible
            :variant="variant"
            @dismissed="dismissAlertProject">
            {{ msgUpdateProject }}
          </b-alert>
        </b-col>
      </b-row>
      <b-row>
        <b-col
          cols="12">
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
              :state="state.name"
              @input="state.name = (formData.name !== '' && formData.name.length > 2) ? null : state.name"
              @blur="state.name = (formData.name !== '' && formData.name.length > 2) ? null : false"
              v-model="formData.name"></b-form-input>
            <b-form-invalid-feedback :state="state.name">{{ $t('The project must have a title that contain at least 3 characters') }}</b-form-invalid-feedback>
          </b-form-group>
          <b-form-group
            :label="$t('Authors')"
            label-for="input-project-authors"
            description="First then last name of all authors separated by commas">
            <b-form-input
              :disabled="!canWrite"
              id="input-project-authors"
              :placeholder="$t('Authors of review')"
              :state="state.authors"
              @input="state.authors = isProjectPublished ? (formData.authors !== '' && formData.authors.trim().length > 0) ? null : state.authors : null"
              @blur="state.authors = isProjectPublished ? (formData.authors !== '' && formData.authors.trim().length > 0) ? null : false : null"
              v-model="formData.authors"></b-form-input>
            <b-form-invalid-feedback :state="state.authors">{{ $t('The project must have at least one author') }}</b-form-invalid-feedback>
          </b-form-group>
          <b-form-group
            label="Corresponding author"
            label-for="input-project-author"
            description="First then last name">
            <b-form-input
              :disabled="!canWrite"
              id="input-project-author"
              :state="state.author"
              @input="state.author = isProjectPublished ? (formData.author !== '' && formData.author.trim().length >= 3) ? null : state.author : null"
              @blur="state.author = isProjectPublished ? (formData.author !== '' && formData.author.trim().length >= 3) ? null : false : null"
              v-model="formData.author"></b-form-input>
              <b-form-invalid-feedback :state="state.author">{{ $t('The project must have a corresponding author with at least 3 characters') }}</b-form-invalid-feedback>
          </b-form-group>
          <b-form-group
            label="Corresponding author's email address"
            label-for="input-project-author-email">
            <b-form-input
              :disabled="!canWrite"
              type="email"
              id="input-project-author-email"
              :state="state.author_email"
              @input="state.author_email = isProjectPublished ? (formData.author_email !== '' && validEmail(formData.author_email)) ? null : state.author_email : null"
              @blur="state.author_email = isProjectPublished ? (formData.author_email !== '' && validEmail(formData.author_email)) ? null : false : null"
              v-model="formData.author_email"></b-form-input>
              <b-form-invalid-feedback :state="state.author_email">{{ $t('The project must have a valid author email address') }}</b-form-invalid-feedback>
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
              :state="state.review_question"
              @input="state.review_question = isProjectPublished ? (formData.review_question !== '' && formData.review_question.trim().length >= 3) ? null : state.review_question : null"
              @blur="state.review_question = isProjectPublished ? (formData.review_question !== '' && formData.review_question.trim().length >= 3) ? null : false : null"
              v-model="formData.review_question"></b-form-textarea>
            <b-form-invalid-feedback :state="state.review_question">{{ $t('The project must have a review question with at least 3 characters') }}</b-form-invalid-feedback>
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
              :state="state.url_doi"
              @input="state.url_doi = (formData.url_doi !== '' && validUrl(formData.url_doi)) ? null : state.url_doi"
              @blur="state.url_doi = (formData.url_doi !== '' && validUrl(formData.url_doi) || formData.public_type !== 'private') ? null : false"
              v-model="formData.url_doi"></b-input>
            <b-form-invalid-feedback :state="state.url_doi">{{ $t('The project must have a valid URL or DOI') }}</b-form-invalid-feedback>
          </b-form-group>
          <b-form-group
            :label="$t('Is the iSoQ being completed by the review authors?')"
            label-for="select-project-list-completed-by-author-status">
            <b-select
              :disabled="!canWrite"
              id="select-project-list-completed-by-author-status"
              v-model="formData.complete_by_author"
              :options="yes_or_no"></b-select>
              <!-- <b-form-invalid-feedback :state="state.complete_by_author">{{ $t('The project must be completed by the review authors') }}</b-form-invalid-feedback> -->
          </b-form-group>
          <b-form-group
            v-if="!formData.complete_by_author"
            label="Please list the authors of this iSoQ"
            label-for="input-project-list-authors">
            <b-form-input
              :disabled="!canWrite"
              id="input-project-list-authors"
              :state="state.lists_authors"
              @input="state.lists_authors = isProjectPublished ? (formData.lists_authors !== '' && formData.lists_authors.trim().length > 0) ? null : state.lists_authors : null"
              @blur="state.lists_authors = isProjectPublished ? (formData.lists_authors !== '' && formData.lists_authors.trim().length > 0) ? null : false : null"
              v-model="formData.lists_authors"></b-form-input>
            <b-form-invalid-feedback :state="state.lists_authors">{{ $t('The project must have a list of authors') }}</b-form-invalid-feedback>
          </b-form-group>
          <b-form-group
            label-for="select-project-list-status"
            description="When you finish your iSoQ you can publish some, or all of it, to the iSoQ database. Until you are finished, keep it “private”. You can change these settings at any time.">
            <template v-slot:description v-if="formData.id === null">
              When you finish your iSoQ you can publish some, or all of it, to the iSoQ database. These options become available once you have entered the required project properties and have at least one review finding with a complete GRADE-CERQual assessment.
            </template>
            <template v-slot:label>
              <videoHelp txt="Visibility on the iSoQ database" tag="none" urlId="504176899"></videoHelp>
            </template>
            <b-select
              :disabled="!canWrite"
              id="select-project-list-status"
              v-model="formData.public_type"
              @change="resetState()"
              :options="global_status"></b-select>
            <b-form-invalid-feedback :state="state.can_publish">{{ $t('The project must have at least one review finding with a complete GRADE-CERQual assessment to be published to the iSoQ database. Select “Private” until you are finished.') }}</b-form-invalid-feedback>
          </b-form-group>
          <template v-if="formData.public_type !== 'private'">
            <b-form-group
              label-for="select-project-list-license">
              <template v-slot:label>
                Choose a license
              </template>
              <b-select
                :disabled="!canWrite"
                :state="state.license"
                @change="state.license = (formData.license_type !== '' && formData.license_type !== null) ? null : false"
                id="select-project-list-license"
                v-model="formData.license_type"
                :options="global_licenses"></b-select>
            </b-form-group>
            <b-form-invalid-feedback :state="state.license">{{ $t('The project must have a license') }}</b-form-invalid-feedback>
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
        </b-col>
      </b-row>
      <b-row align-h="end" v-if="canWrite && !isModal">
        <b-col
          cols="12"
          sm="6"
          md="4"
          lg="3"
          class="mb-3">
          <b-button
            block
            variant="outline-success"
            @click="save">
            Save
          </b-button>
        </b-col>
      </b-row>

      <!-- Warning modal for reverting to private -->
      <b-modal
        id="publish-warning-modal"
        title="Warning!"
        ok-title="Continue"
        cancel-title="Cancel"
        @ok="handlePublishWarningContinue"
        @cancel="handlePublishWarningCancel">
        <p>By removing this content your project will revert to "private" as it will no longer meet the requirements for being published to the iSoQ database. Do you wish to continue?</p>
      </b-modal>
    </template>
  </div>
</template>

<script>
import Project from '@/utils/project'

const videoHelp = () => import(/* webpackChunkName: "videohelp" */'../videoHelp')

export default {
  name: 'organizationForm',
  components: {videoHelp},
  props: {
    formData: Object,
    canWrite: Boolean,
    isModal: {
      type: Boolean,
      default: false
    }
  },
  mounted () {
    if (this.formData.id) {
      let data = JSON.parse(JSON.stringify(this.global_status))
      let newData = []
      for (let i of data) {
        if (i.disabled) {
          i.disabled = false
        }
        newData.push(i)
      }
      this.global_status = newData
    }
    // Store the initial form data for comparison
    this.originalFormData = JSON.parse(JSON.stringify(this.formData))
  },
  data: function () {
    return {
      variant: 'info',
      msgUpdateProject: null,
      global_status: [
        { value: 'private', text: 'Private - Your iSoQ is not publicly available on the iSoQ database', disabled: false },
        { value: 'fully', text: 'Fully Public - Your iSoQ table, Evidence Profile, and GRADE-CERQual Worksheets are publicly available on the iSoQ database', disabled: true },
        { value: 'partially', text: 'Partially Public - Your iSoQ table and Evidence Profile are publicly available on the iSoQ database', disabled: true },
        { value: 'minimally', text: 'Minimally Public - Your iSoQ table is available on the iSoQ database', disabled: true }
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
      ],
      state: {
        id: null,
        name: null,
        authors: null,
        author: null,
        author_email: null,
        review_question: null,
        published_status: null,
        url_doi: null,
        complete_by_author: null,
        lists_authors: null,
        license: null,
        can_publish: null
      },
      originalFormData: null,
      pendingData: null
    }
  },
  methods: {
    resetState: function () {
      this.state = {
        id: null,
        name: null,
        authors: null,
        author_email: null,
        review_question: null,
        published_status: null,
        url_doi: null,
        complete_by_author: null,
        lists_authors: null,
        license: null,
        can_publish: null
      }
    },
    dismissAlertProject: function () {
      this.msgUpdateProject = null
    },
    handlePublishWarningContinue: function () {
      // User confirmed they want to make the project private
      const data = this.pendingData
      data.public_type = 'private'
      data.license_type = ''

      // Reset the state since fields are no longer required in private mode
      this.resetState()

      // Continue with save operation
      this.executeSave(data)
      this.pendingData = null
    },
    handlePublishWarningCancel: function () {
      // User wants to cancel the unpublish action
      // Only restore the required fields that were removed, keep other valid changes
      const requiredFields = ['name', 'authors', 'author', 'author_email', 'review_question']

      for (const field of requiredFields) {
        const originalValue = this.originalFormData[field]
        const currentValue = this.formData[field]

        // Only restore if the field was removed (empty or whitespace only)
        if (originalValue && (!currentValue || currentValue.trim() === '')) {
          this.formData[field] = originalValue
        }
      }

      // Also restore the public_type if it was changed
      this.formData.public_type = this.originalFormData.public_type

      this.pendingData = null
    },
    checkRequiredFieldsRemoved: function (data) {
      // Check if project is currently published (not private)
      if (this.originalFormData.public_type !== 'private') {
        const requiredFields = ['name', 'authors', 'author', 'author_email', 'review_question']

        // Check if any required field was removed
        for (const field of requiredFields) {
          const originalValue = this.originalFormData[field]
          const newValue = data[field]

          if (originalValue && (!newValue || newValue.trim() === '')) {
            return true
          }
        }
      }
      return false
    },
    save: function () {
      const data = JSON.parse(JSON.stringify(this.formData))
      data.organization = this.$store.state.user.personal_organization

      // Check if required fields were removed from a published project
      if (this.checkRequiredFieldsRemoved(data)) {
        // Store the pending data and show warning modal
        this.pendingData = data
        this.$bvModal.show('publish-warning-modal')
      } else {
        // Proceed with normal save
        this.executeSave(data)
      }
    },
    executeSave: async function (data) {
      if (Object.prototype.hasOwnProperty.call(data, 'id') && data.id !== null) {
        const response = await Project.update(data)
        if (response.data.status) {
          this.variant = 'success'
          this.msgUpdateProject = 'The project has been updated'
          if (this.isModal) {
            document.getElementById('new-project').scrollTo({ top: 0, behavior: 'smooth' })
            this.$emit('modal-notification')
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            this.$emit('update-form-data', data)
          }
          // Update the original form data to reflect the new state
          this.originalFormData = JSON.parse(JSON.stringify(data))
        } else {
          this.variant = 'danger'
          this.state = { ...this.state, ...response.data.state }
          this.msgUpdateProject = response.data.message
          if (this.isModal) {
            document.getElementById('new-project').scrollTo({ top: 0, behavior: 'smooth' })
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }
      } else {
        const response = await Project.create(data)
        if (response.data.id) {
          this.variant = 'success'
          this.msgUpdateProject = 'The project has been created'
          this.$emit('modal-notification', response)
          // Update the original form data to reflect the new state
          this.originalFormData = JSON.parse(JSON.stringify(data))
        } else {
          this.variant = 'danger'
          this.msgUpdateProject = response.data.message
          this.state = { ...this.state, ...response.data.state }
          if (this.isModal) {
            document.getElementById('new-project').scrollTo({ top: 0, behavior: 'smooth' })
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }
      }
    },
    validEmail: function (email) {
      return Project.validEmail(email)
    },
    validUrl: function (url) {
      return Project.validUrl(url)
    },
    setMsgUpdateProject: function (msg) {
      this.msgUpdateProject = msg
      this.variant = 'danger'
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  },
  computed: {
    isProjectPublished () {
      // Check if the project is currently published (either original state or current selection)
      // A project requires validation if it's not private
      return this.formData.public_type !== 'private' ||
             (this.originalFormData && this.originalFormData.public_type !== 'private')
    }
  },
  watch: {
    formData: function (data) {
      if (data.id) {
        let data = JSON.parse(JSON.stringify(this.global_status))
        let newData = []
        for (let i of data) {
          if (i.disabled) {
            i.disabled = false
          }
          newData.push(i)
        }
        this.global_status = newData
      }

      // When formData changes externally, update the original data
      if (JSON.stringify(this.originalFormData) !== JSON.stringify(data)) {
        this.originalFormData = JSON.parse(JSON.stringify(data))
      }
    }
  }
}
</script>

<style>

</style>
