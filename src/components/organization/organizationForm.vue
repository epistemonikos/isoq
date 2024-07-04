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
              <videoHelp txt="Visibility on the iSoQ database" tag="none" urlId="504176899"></videoHelp>
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
        </b-col>
      </b-row>
      <b-row align-h="end" v-if="canWrite">
        <b-col
          cols="6"
          class="mb-3">
          <b-button
            block
            variant="outline-success"
            @click="updateProjectInfo">
            Save
          </b-button>
        </b-col>
      </b-row>
    </template>
  </div>
</template>

<script>
import axios from 'axios'
const videoHelp = () => import(/* webpackChunkName: "videohelp" */'../videoHelp')

export default {
  name: 'organizationForm',
  components: {videoHelp},
  props: {
    formData: Object,
    canWrite: Boolean
  },
  data: function () {
    return {
      variant: 'info',
      msgUpdateProject: null,
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
  },
  methods: {
    dismissAlertProject: function () {
      this.msgUpdateProject = null
    },
    updateProjectInfo: function () {
      let project = JSON.parse(JSON.stringify(this.formData))
      project.private = true
      project.is_public = false
      if (project.public_type !== 'private') {
        project.private = false
        project.is_public = true
        // check if the project has a title
        if (project.title === '') {
          this.setMsgUpdateProject('The project must have a title')
          return
        }
        // check if project has authors
        if (project.authors === '') {
          this.setMsgUpdateProject('The project must have at least one author')
          return
        }
        // check if project has author
        if (project.author === '') {
          this.setMsgUpdateProject('The project must have a corresponding author')
          return
        }
        // check if project has a valid author email address
        if (project.author_email !== '' && !this.validEmail(project.author_email)) {
          this.setMsgUpdateProject('The project must have a valid author email address')
          return
        }
        // check if project has a review question
        if (project.review_question === '') {
          this.setMsgUpdateProject('The project must have a review question')
          return
        }
        // check if published status is true
        if (!project.published_status) {
          this.setMsgUpdateProject('The project must be review been published')
          return
        }
        // check project url or doi
        if (project.published_status && (project.url_doi === '' || project.url_doi === null || !this.validUrl(project.url_doi))) {
          this.setMsgUpdateProject('The project must have a valid URL or DOI')
          return
        }
        // check if project has a complete by author set as true
        if (!project.complete_by_author) {
          this.setMsgUpdateProject('The project must have being completed by the review authors')
          return
        }
      }
      axios.patch(`/api/isoqf_projects/${project.id}`, project)
        .then(() => {
          let params = {
            project_id: project.id,
            is_public: project.is_public,
            private: project.private,
            license_type: project.license_type,
            public_type: project.public_type
          }
          axios.get(`/api/publish`, {params})
            .then(() => {
              this.variant = 'success'
              this.msgUpdateProject = 'The project has been updated'
              window.scrollTo({ top: 0, behavior: 'smooth' })
              this.$emit('update-modification')
            })
        })
        .catch((error) => {
          this.msgUpdateProject = error
        })
    },
    validEmail: function (email) {
      var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      return re.test(email)
    },
    validUrl: function (url) {
      var re = /^(http|https):\/\/[^ "]+$/
      return re.test(url)
    },
    setMsgUpdateProject: function (msg) {
      this.msgUpdateProject = msg
      this.variant = 'danger'
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}
</script>

<style>

</style>
