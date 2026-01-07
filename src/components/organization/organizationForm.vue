<template>
  <div>
    <template v-if="!canEdit">
      <b-row>
        <b-col
          cols="12">
            <p><b>{{ $t('project.title_of_review') }}</b></p>
            <p>{{ formData.name }}</p>
            <p><b>{{ $t('project.authors') }}</b></p>
            <p>{{ formData.authors }}</p>
            <p><b>{{ $t('project.corresponding_author') }}</b></p>
            <p>{{ formData.author }}</p>
            <p><b>{{ $t('project.corresponding_author_email') }}</b></p>
            <p>{{ formData.author_email }}</p>
            <p><b>{{ $t('project.review_question') }}</b></p>
            <p>{{ formData.review_question }}</p>
            <p><b>{{ $t('project.published_status') }}</b></p>
            <p>{{ formData.published_status ? $t('common.yes') : $t('common.no') }}</p>
            <p v-if="formData.published_status"><b>{{ $t('project.url_doi') }}</b></p>
            <p v-if="formData.published_status">{{ formData.url_doi }}</p>
            <p><b>{{ $t('project.completed_by_authors') }}</b></p>
            <p>{{ formData.complete_by_author ? $t('common.yes') : $t('common.no') }}</p>
            <p v-if="!formData.complete_by_author"><b>{{ $t('project.list_authors_isoq') }}</b></p>
            <p v-if="!formData.complete_by_author">{{ formData.lists_authors }}</p>
            <p><b>{{ $t('project.license_label') }}</b></p>
            <p>{{ formData.license_type }}</p>
            <p><b>{{ $t('project.additional_info') }}</b></p>
            <p>{{ formData.description }}</p>
        </b-col>
      </b-row>
    </template>
    <template v-if="canEdit">
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
            :label="$t('project.title_of_review')"
            label-for="input-project-list-name"
            :description="$t('project.insert_title_desc')">
            <b-form-input
              :disabled="!canEdit"
              id="input-project-list-name"
              type="text"
              required
              :placeholder="$t('project.title_placeholder')"
              :state="state.name"
              @input="state.name = (formData.name !== '' && formData.name.length > 2) ? null : state.name"
              @blur="state.name = (formData.name !== '' && formData.name.length > 2) ? null : false"
              v-model="formData.name"></b-form-input>
            <b-form-invalid-feedback :state="state.name">{{ $t('project.validation.title_min_length') }}</b-form-invalid-feedback>
          </b-form-group>
          <b-form-group
            :label="$t('project.authors')"
            label-for="input-project-authors"
            :description="$t('project.authors_desc')">
            <b-form-input
              :disabled="!canEdit"
              id="input-project-authors"
              :placeholder="$t('project.authors_input_placeholder')"
              :state="state.authors"
              @input="state.authors = isProjectPublished ? (formData.authors !== '' && formData.authors.trim().length > 0) ? null : state.authors : null"
              @blur="state.authors = isProjectPublished ? (formData.authors !== '' && formData.authors.trim().length > 0) ? null : false : null"
              v-model="formData.authors"></b-form-input>
            <b-form-invalid-feedback :state="state.authors">{{ $t('project.validation.at_least_one_author') }}</b-form-invalid-feedback>
          </b-form-group>
          <b-form-group
            :label="$t('project.corresponding_author')"
            label-for="input-project-author"
            :description="$t('project.author_desc')">
            <b-form-input
              :disabled="!canEdit"
              id="input-project-author"
              :state="state.author"
              @input="state.author = isProjectPublished ? (formData.author !== '' && formData.author.trim().length >= 3) ? null : state.author : null"
              @blur="state.author = isProjectPublished ? (formData.author !== '' && formData.author.trim().length >= 3) ? null : false : null"
              v-model="formData.author"></b-form-input>
              <b-form-invalid-feedback :state="state.author">{{ $t('project.validation.corresponding_author_min_length') }}</b-form-invalid-feedback>
          </b-form-group>
          <b-form-group
            :label="$t('project.corresponding_author_email')"
            label-for="input-project-author-email">
            <b-form-input
              :disabled="!canEdit"
              type="email"
              id="input-project-author-email"
              :state="state.author_email"
              @input="state.author_email = isProjectPublished ? (formData.author_email !== '' && validEmail(formData.author_email)) ? null : state.author_email : null"
              @blur="state.author_email = isProjectPublished ? (formData.author_email !== '' && validEmail(formData.author_email)) ? null : false : null"
              v-model="formData.author_email"></b-form-input>
              <b-form-invalid-feedback :state="state.author_email">{{ $t('project.validation.valid_email') }}</b-form-invalid-feedback>
          </b-form-group>
          <b-form-group
            :label="$t('project.review_question')"
            label-for="input-project-review-question">
            <b-form-textarea
              :disabled="!canEdit"
              id="input-project-review-question"
              :placeholder="$t('project.insert_question_placeholder')"
              rows="6"
              max-rows="100"
              :state="state.review_question"
              @input="state.review_question = isProjectPublished ? (formData.review_question !== '' && formData.review_question.trim().length >= 3) ? null : state.review_question : null"
              @blur="state.review_question = isProjectPublished ? (formData.review_question !== '' && formData.review_question.trim().length >= 3) ? null : false : null"
              v-model="formData.review_question"></b-form-textarea>
            <b-form-invalid-feedback :state="state.review_question">{{ $t('project.validation.question_min_length') }}</b-form-invalid-feedback>
          </b-form-group>
          <b-form-group
            :label="$t('project.published_status')"
            label-for="select-project-list-published-status">
            <b-select
              :disabled="!canEdit"
              id="select-project-list-published-status"
              v-model="formData.published_status"
              :options="yes_or_no"></b-select>
          </b-form-group>
          <b-form-group
            v-if="formData.published_status"
            :label="$t('project.url_doi')"
            label-for="select-project-list-url-doi">
            <b-input
              :disabled="!canEdit"
              :placeholder="$t('project.url_placeholder')"
              type="url"
              id="select-project-list-url-doi"
              :state="state.url_doi"
              @input="state.url_doi = (formData.url_doi !== '' && validUrl(formData.url_doi)) ? null : state.url_doi"
              @blur="state.url_doi = (formData.url_doi !== '' && validUrl(formData.url_doi) || formData.public_type !== 'private') ? null : false"
              v-model="formData.url_doi"></b-input>
            <b-form-invalid-feedback :state="state.url_doi">{{ $t('project.validation.valid_url_doi') }}</b-form-invalid-feedback>
          </b-form-group>
          <b-form-group
            :label="$t('project.completed_by_authors')"
            label-for="select-project-list-completed-by-author-status">
            <b-select
              :disabled="!canEdit"
              id="select-project-list-completed-by-author-status"
              v-model="formData.complete_by_author"
              :options="yes_or_no"></b-select>
              <!-- <b-form-invalid-feedback :state="state.complete_by_author">{{ $t('The project must be completed by the review authors') }}</b-form-invalid-feedback> -->
          </b-form-group>
          <b-form-group
            v-if="!formData.complete_by_author"
            :label="$t('project.list_authors_isoq')"
            label-for="input-project-list-authors">
            <b-form-input
              :disabled="!canEdit"
              id="input-project-list-authors"
              :state="state.lists_authors"
              @input="state.lists_authors = isProjectPublished ? (formData.lists_authors !== '' && formData.lists_authors.trim().length > 0) ? null : state.lists_authors : null"
              @blur="state.lists_authors = isProjectPublished ? (formData.lists_authors !== '' && formData.lists_authors.trim().length > 0) ? null : false : null"
              v-model="formData.lists_authors"></b-form-input>
            <b-form-invalid-feedback :state="state.lists_authors">{{ $t('project.validation.list_authors_required') }}</b-form-invalid-feedback>
          </b-form-group>
          <b-form-group
            label-for="select-project-list-status"
            :description="$t('project.publish_desc_private')">
            <template v-slot:description v-if="formData.id === null">
              {{ $t('project.publish_desc_public') }}
            </template>
            <template v-slot:label>
              <videoHelp :txt="$t('project.visibility_video_txt')" tag="none" urlId="504176899"></videoHelp>
            </template>
            <b-select
              :disabled="!canEdit"
              id="select-project-list-status"
              v-model="formData.public_type"
              @change="resetState()"
              :options="global_status"></b-select>
            <b-form-invalid-feedback :state="state.can_publish">{{ $t('project.validation.publish_requirement') }}</b-form-invalid-feedback>
          </b-form-group>
          <template v-if="formData.public_type !== 'private'">
            <b-form-group
              label-for="select-project-list-license">
              <template v-slot:label>
                {{ $t('project.choose_license') }}
              </template>
              <b-select
                :disabled="!canEdit"
                :state="state.license"
                @change="state.license = (formData.license_type !== '' && formData.license_type !== null) ? null : false"
                id="select-project-list-license"
                v-model="formData.license_type"
                :options="global_licenses"></b-select>
            </b-form-group>
            <b-form-invalid-feedback :state="state.license">{{ $t('project.validation.license_required') }}</b-form-invalid-feedback>
            <p v-for="license of global_licenses" :key="license.value">
              <span v-if="license.value === formData.license_type">
                <b>{{ $t('project.explanation') }}</b> {{ license.explanation }}
              </span>
            </p>
          </template>
          <b-form-group
            :label="$t('project.additional_info')"
            label-for="input-project-list-description">
            <b-form-textarea
              :disabled="!canEdit"
              id="input-project-list-description"
              :placeholder="$t('project.additional_info_placeholder')"
              v-model="formData.description"
              rows="6"
              max-rows="100"></b-form-textarea>
          </b-form-group>
        </b-col>
      </b-row>
      <b-row align-h="end" v-if="canEdit && !isModal">
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
            {{ $t('common.save') }}
          </b-button>
        </b-col>
      </b-row>

      <!-- Warning modal for reverting to private -->
      <b-modal
        id="publish-warning-modal"
        :title="$t('project.warning')"
        :ok-title="$t('common.continue')"
        :cancel-title="$t('common.cancel')"
        @ok="handlePublishWarningContinue"
        @cancel="handlePublishWarningCancel">
        <p>{{ $t('project.revert_private_warning') }}</p>
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
    canEdit: Boolean,
    isModal: {
      type: Boolean,
      default: false
    },
    highlight: {
      type: String,
      default: ''
    }
  },
  mounted () {
    // Store the initial form data for comparison
    this.originalFormData = JSON.parse(JSON.stringify(this.formData))
  },
  data: function () {
    return {
      variant: 'info',
      msgUpdateProject: null,
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
          if (Object.prototype.hasOwnProperty.call(this.$route.query, 'highlight')) {
            const query = { ...this.$route.query }
            delete query.highlight
            this.$router.push({ query }).catch(() => {})
          }
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
          if (Object.prototype.hasOwnProperty.call(this.$route.query, 'highlight')) {
            const query = { ...this.$route.query }
            delete query.highlight
            this.$router.push({ query }).catch(() => {})
          }
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
    yes_or_no () {
      return [
        { value: false, text: this.$t('common.no') },
        { value: true, text: this.$t('common.yes') }
      ]
    },
    global_status () {
      const disabled = !this.formData.id
      return [
        { value: 'private', text: this.$t('project.status_private_text'), disabled: false },
        { value: 'fully', text: this.$t('project.status_fully_text'), disabled },
        { value: 'partially', text: this.$t('project.status_partially_text'), disabled },
        { value: 'minimally', text: this.$t('project.status_minimally_text'), disabled }
      ]
    },
    global_licenses () {
      return [
        { value: 'CC-BY-NC-ND', text: 'CC BY-NC-ND', explanation: this.$t('project.license_cc_by_nc_nd_exp') },
        { value: 'CC-BY-ND', text: 'CC BY-ND', explanation: this.$t('project.license_cc_by_nd_exp') },
        { value: 'CC-BY-NC-SA', text: 'CC BY-NC-SA', explanation: this.$t('project.license_cc_by_nc_sa_exp') },
        { value: 'CC-BY-NC', text: 'CC BY-NC', explanation: this.$t('project.license_cc_by_nc_exp') },
        { value: 'CC-BY-SA', text: 'CC BY-SA', explanation: this.$t('project.license_cc_by_sa_exp') },
        { value: 'CC-BY', text: 'CC BY', explanation: this.$t('project.license_cc_by_exp') }
      ]
    },
    isProjectPublished () {
      // Check if the project is currently published (either original state or current selection)
      // A project requires validation if it's not private
      return this.formData.public_type !== 'private' ||
             (this.originalFormData && this.originalFormData.public_type !== 'private')
    }
  },
  watch: {
    highlight: {
      handler: function (val) {
        if (val && val.length > 0) {
          const fields = val.split(',')
          for (const field of fields) {
            let fieldName = field
            if (field === 'license_type') {
              fieldName = 'license'
            }
            if (Object.prototype.hasOwnProperty.call(this.state, fieldName)) {
              this.state[fieldName] = false
            }
          }
        }
      },
      immediate: true
    },
    formData: {
      handler (newFormData) {
        // When formData changes externally, update the original data
        if (JSON.stringify(this.originalFormData) !== JSON.stringify(newFormData)) {
          this.originalFormData = JSON.parse(JSON.stringify(newFormData))
        }
      },
      immediate: true
    }
  }
}
</script>

<style>

</style>
