<template>
  <b-modal
    ref="modal-change-status"
    id="modal-change-status"
    scrollable
    size="xl"
    :ok-title="$t('actionButtons.modal.save')"
    ok-variant="outline-success"
    @ok="savePublicStatus"
    cancel-variant="outline-secondary"
    hide-header-close
    no-close-on-backdrop
    no-close-on-esc>
    <template v-slot:modal-title>
      <videoHelp :txt="$t('actionButtons.modal.title')" tag="none" urlId="504176899-1"></videoHelp>
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
      {{ $t('actionButtons.modal.publish_info') }}
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
      <h5>{{ $t('actionButtons.modal.choose_license') }}</h5>
      <p class="font-weight-light">{{ $t('actionButtons.modal.license_info') }} <a href="https://creativecommons.org/about/cclicenses/" target="_blank">{{ $t('actionButtons.modal.license_info_link_text') }}</a>.</p>
      <p class="font-weight-light">{{ $t('actionButtons.modal.license_responsibility') }}</p>
      <b-form-group>
        <b-form-radio-group
        id="modal-publish-license"
        v-model="modalProject.license_type"
        :options="global_licenses"
        @change="state.license_type = null"
        name="modal-radio-license"
        ></b-form-radio-group>
        <b-form-invalid-feedback :state="state.license_type">{{ $t('actionButtons.modal.must_select_license') }}</b-form-invalid-feedback>
      </b-form-group>
    </template>

    <template #modal-footer>
      <div class="w-100">
        <b-button
          variant="outline-success"
          class="float-right ml-3"
          :disabled="!isOnline"
          @click="savePublicStatus">
          <b-spinner small v-show="ui.publish.showLoader"></b-spinner>
          {{ $t('actionButtons.modal.save') }}
        </b-button>
        <b-button
          v-show="!ui.publish.showLoader"
          variant="outline-secondary"
          class="float-right"
          @click="$refs['modal-change-status'].hide()">
          {{ $t('actionButtons.modal.close') }}
        </b-button>
      </div>
    </template>
  </b-modal>
</template>

<script>
import Api from '@/utils/Api'
import videoHelp from '@/components/videoHelp'

export default {
  name: 'PublishModal',
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
    isOnline: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      modalProject: { name: '' },
      state: {
        license_type: null
      },
      errorsResponse: {
        message: '',
        items: []
      }
    }
  },
  computed: {
    global_status() {
      return [
        { text: this.$t('actionButtons.modal.private'), value: 'private' },
        { text: this.$t('actionButtons.modal.public'), value: 'public' },
        { text: this.$t('actionButtons.modal.unlisted'), value: 'unlisted' }
      ]
    },
    global_licenses() {
      return [
        { text: 'CC BY', value: 'CC-BY' },
        { text: 'CC BY-SA', value: 'CC-BY-SA' },
        { text: 'CC BY-ND', value: 'CC-BY-ND' },
        { text: 'CC BY-NC', value: 'CC-BY-NC' },
        { text: 'CC BY-NC-SA', value: 'CC-BY-NC-SA' },
        { text: 'CC BY-NC-ND', value: 'CC-BY-NC-ND' }
      ]
    }
  },
  mounted() {
    // Listen for modal show event to attach click handler
    this.$root.$on('bv::modal::shown', this.onModalShown)
  },
  beforeDestroy() {
    // Clean up event listeners
    this.$root.$off('bv::modal::shown', this.onModalShown)
    this.removeErrorLinkListener()
  },
  methods: {
    openModal() {
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

    async savePublicStatus(event) {
      event.preventDefault()
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
        const canPublish = await Api.get('/api/project/can_publish', {
          id: this.project.id,
          workspace: this.$route.params.org_id,
          isModal: isModal
        })
        
        if (canPublish.data.status) {
          Api.patch('/api/publish', { params })
            .then(() => {
              this.modalProject = { name: '' }
              this.$emit('getProject')
              this.$emit('uiPublishShowLoader', false)
              this.$refs['modal-change-status'].hide()
            })
            .catch((error) => {
              console.log(error)
            })
        } else {
          document.getElementById('modal-change-status___BV_modal_body_').scrollTo({ top: 0, behavior: 'smooth' })
          this.errorsResponse.message = canPublish.data.message
          this.$emit('uiPublishShowLoader', false)
        }
      } else {
        Api.patch('/api/publish', { params })
          .then(() => {
            this.modalProject = { name: '' }
            this.$emit('getProject')
            this.$emit('uiPublishShowLoader', false)
            this.$refs['modal-change-status'].hide()
          })
          .catch((error) => {
            console.log(error)
          })
      }
    },

    onModalShown(bvEvent, modalId) {
      // Only attach listener for our specific modal
      if (modalId === 'modal-change-status') {
        this.$nextTick(() => {
          const modalBody = document.getElementById('modal-change-status___BV_modal_body_')
          if (modalBody) {
            modalBody.addEventListener('click', this.handleErrorLinkClick)
          }
        })
      }
    },

    handleErrorLinkClick(event) {
      // Check if the clicked element is a link with hash
      if (event.target.tagName === 'A' && event.target.hash) {
        event.preventDefault()
        const hash = event.target.hash
        
        // Close the modal
        this.$refs['modal-change-status'].hide()
        
        // Navigate to the route with hash
        this.$router.push({ path: this.$route.path, hash: hash })
      }
    },

    removeErrorLinkListener() {
      const modalBody = document.getElementById('modal-change-status___BV_modal_body_')
      if (modalBody) {
        modalBody.removeEventListener('click', this.handleErrorLinkClick)
      }
    }
  }
}
</script>

<style scoped>
</style>
