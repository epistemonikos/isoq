<template>
  <b-modal
    ref="modal-change-status"
    id="modal-change-status"
    scrollable
    size="xl"
    ok-title="Save"
    ok-variant="outline-success"
    @ok="savePublicStatus"
    cancel-variant="outline-secondary"
    hide-header-close
    no-close-on-backdrop
    no-close-on-esc>
    <template v-slot:modal-title>
      <videoHelp txt="Publish to the iSoQ Database" tag="none" urlId="504176899-1"></videoHelp>
    </template>

    <template v-if="errorsResponse.message !== ''">
      <b-alert
        show
        variant="danger"
        dismissible
        @dismissed="errorsResponse.message = ''">
        <p class="mb-0" v-html="errorsResponse.message"></p>
      </b-alert>
    </template>

    <p class="font-weight-light">
      By publishing your iSoQ to the online database, your contribution becomes searchable, readable and downloadable by the public. Please select a visibility setting below and click “publish”. Click the icon next to each to see an example. We recommend users choose Fully Public to maximise transparency. You can change your visibility settings at any time in Project Properties.
    </p>
    <b-form-group>
      <b-form-radio-group
      id="modal-publish-status"
      v-model="modalProject.public_type"
      :options="global_status"
      name="modal-radio-status"
      ></b-form-radio-group>
    </b-form-group>

    <template v-if="modalProject.public_type !== 'private'">
      <h5>Choose a license</h5>
      <p class="font-weight-light">Please choose a Creative Commons licence under which you would like to publish your work to the iSoQ database. The default is CC-BY-NC-ND. Read more about Creative Commons licenses <a href="https://creativecommons.org/about/cclicenses/" target="_blnak">here</a>.</p>
      <p class="font-weight-light">It is your responsibility to ensure that publishing your work to the iSoQ database does not violate any existing licencing agreement – e.g. with academic journals or funders.</p>
      <b-form-group>
        <b-form-radio-group
        id="modal-publish-license"
        v-model="modalProject.license_type"
        :options="global_licenses"
        @change="state.license_type = null"
        name="modal-radio-license"
        ></b-form-radio-group>
        <b-form-invalid-feedback :state="state.license_type">You must select a Creative Commons license.</b-form-invalid-feedback>
      </b-form-group>
    </template>

    <template #modal-footer>
      <div class="w-100">
        <b-button
          variant="outline-success"
          class="float-right ml-3"
          @click="savePublicStatus">
          <b-spinner small v-show="ui.publish.showLoader"></b-spinner>
          Save
        </b-button>
        <b-button
          v-show="!ui.publish.showLoader"
          variant="outline-secondary"
          class="float-right"
          @click="$refs['modal-change-status'].hide()">
          Close
        </b-button>
      </div>
    </template>
  </b-modal>
</template>

<script>
import axios from 'axios'
const videoHelp = () => import(/* webpackChunkName: "videohelp" */ '../videoHelp')

export default {
  name: 'PublishProjectModal',
  components: {
    videoHelp
  },
  props: {
    project: {
      type: Object,
      required: true
    },
    ui: {
      type: Object,
      required: true
    },
    workspaceId: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      modalProject: { name: '' },
      global_status: [
        { value: 'private', text: 'Private - Your iSoQ is not publicly available on the iSoQ database' },
        { value: 'fully', text: 'Fully Public - Your iSoQ table, Evidence Profile, and GRADE-CERQual Worksheets are publicly available on the iSoQ database' },
        { value: 'partially', text: 'Partially Public - Your iSoQ table and Evidence Profile are publicly available on the iSoQ database' },
        { value: 'minimally', text: 'Minimally Public - Your iSoQ table is available on the iSoQ database' }
      ],
      global_licenses: [
        { value: 'CC-BY-NC-ND', text: 'CC BY-NC-ND: This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, for noncommercial purposes only, and only so long as attribution is given to the creator.' },
        { value: 'CC-BY-ND', text: 'CC BY-ND: This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, and only so long as attribution is given to the creator. The license allows for commercial use.' },
        { value: 'CC-BY-NC-SA', text: 'CC BY-NC-SA: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.' },
        { value: 'CC-BY-NC', text: 'CC BY-NC: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator.' },
        { value: 'CC-BY-SA', text: 'CC BY-SA: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.' },
        { value: 'CC-BY', text: 'CC BY: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use.' }
      ],
      state: {
        license_type: null
      },
      errorsResponse: {
        message: '',
        items: []
      }
    }
  },
  watch: {
    'modalProject.name': function (val) {
      this.state.name = val.length > 0 ? null : false
    }
  },
  computed: {
    getLicense: {
      get: function () {
        if (!Object.prototype.hasOwnProperty.call(this.modalProject, 'license_type')) {
          return 'CC-BY-NC-ND'
        } else {
          if (this.modalProject.license_type === '') {
            return 'CC-BY-NC-ND'
          } else {
            return this.modalProject.license_type
          }
        }
      },
      set: function (license) {
        this.modalProject.license_type = license
      }
    }
  },
  methods: {
    show () {
      this.modalProject = JSON.parse(JSON.stringify(this.project))
      this.modalProject.isModal = true
      if (!Object.prototype.hasOwnProperty.call(this.project, 'license_type')) {
        this.modalProject.license_type = 'CC-BY-NC-ND'
      }
      this.errorsResponse = {
        message: '',
        items: []
      }
      this.$refs['modal-change-status'].show()
    },
    savePublicStatus: async function (event) {
      if (event) event.preventDefault()
      this.$emit('uiPublishShowLoader', true)
      let params = {}
      params.id = this.project.id
      params.public_type = this.modalProject.public_type
      const isModal = this.modalProject.isModal || false
      params.private = true
      params.is_public = false

      if (this.modalProject.public_type !== 'private') {
        params.private = false
        params.is_public = true
        params.license_type = this.modalProject.license_type
        if (this.modalProject.license_type === '' || this.modalProject.license_type === null) {
          this.state.license_type = false
          this.$emit('uiPublishShowLoader', false)
          return
        }
      } else {
        params.license_type = ''
      }

      if (this.modalProject.public_type !== 'private') {
        const canPublish = await axios.get('/api/project/can_publish', {params: {id: this.project.id, workspace: this.workspaceId, isModal: isModal}})
        if (canPublish.data.status) {
          axios.patch('/api/publish', {params})
            .then(() => {
              this.modalProject = {name: ''}
              this.$emit('getProject')
              this.$emit('uiPublishShowLoader', false)
              this.$refs['modal-change-status'].hide()
            })
            .catch((error) => {
              console.log(error)
            })
        } else {
          const modalBody = document.getElementById('modal-change-status___BV_modal_body_')
          if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' })
          this.errorsResponse.message = canPublish.data.message
          this.$emit('uiPublishShowLoader', false)
        }
      } else {
        axios.patch('/api/publish', {params})
          .then(() => {
            this.modalProject = {name: ''}
            this.$emit('getProject')
            this.$emit('uiPublishShowLoader', false)
            this.$refs['modal-change-status'].hide()
          })
          .catch((error) => {
            console.log(error)
          })
      }
    }
  }
}
</script>
