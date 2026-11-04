<template>
  <b-modal
    ref="modal-change-status"
    id="modal-change-status"
    scrollable
    size="xl"
    :ok-title="$t('actionButtons.modal.save')"
    ok-variant="outline-success"
    @ok="savePublicStatus"
    @hidden="onHidden"
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
        <p class="mb-0">{{ $t(errorsResponse.message) }}</p>
        <b-button
          v-if="errorsResponse.missingFields.length"
          class="mt-2"
          size="sm"
          variant="outline-danger"
          @click="goToProperties">
          {{ $t('publish.go_to_properties') }}
        </b-button>
      </b-alert>
    </template>

    <PropertiesLockAlert
      :status="propertiesLock.status"
      :lockedBy="propertiesLock.lockedBy" />

    <template v-if="propertiesLockHeld">
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
        <b-form-group>
          <b-form-checkbox
            id="modal-publish-personal-data"
            v-model="modalProject.no_personal_data_confirmed"
            name="modal-checkbox-personal-data">
            {{ $t('publish.confirm_no_personal_data') }}
          </b-form-checkbox>
        </b-form-group>
      </template>
    </template>

    <template #modal-footer>
      <div class="w-100">
        <b-button
          variant="outline-success"
          class="float-right ml-3"
          :disabled="!isOnline || !propertiesLockHeld || missingPersonalDataConfirmation"
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
import Project from '@/utils/project'
import { effectiveLicense, isProjectPublic } from '@/utils/publishRules'
import { writeErrorMessageKey } from '@/utils/writeErrors'
import videoHelp from '@/components/videoHelp'
import propertiesLockMixin from '@/mixins/propertiesLockMixin'
import PropertiesLockAlert from '@/components/project/PropertiesLockAlert.vue'
import { PERSONAL_DATA_CONFIRMED, needsPersonalDataConfirmation } from '@/utils/personalDataConfirmation'

export default {
  name: 'PublishModal',
  mixins: [propertiesLockMixin],
  components: {
    videoHelp,
    PropertiesLockAlert
  },
  props: {
    project: {
      type: Object,
      required: true
    },
    ui: {
      type: Object,
      required: true
    }
  },
  computed: {
    global_status () {
      return [
        { value: 'private', text: this.$t('actionButtons.status.private') },
        { value: 'fully', text: this.$t('actionButtons.status.fully') },
        { value: 'partially', text: this.$t('actionButtons.status.partially') },
        { value: 'minimally', text: this.$t('actionButtons.status.minimally') }
      ]
    },
    global_licenses () {
      return [
        { value: 'CC-BY-NC-ND', text: this.$t('actionButtons.licenses.cc_by_nc_nd') },
        { value: 'CC-BY-ND', text: this.$t('actionButtons.licenses.cc_by_nd') },
        { value: 'CC-BY-NC-SA', text: this.$t('actionButtons.licenses.cc_by_nc_sa') },
        { value: 'CC-BY-NC', text: this.$t('actionButtons.licenses.cc_by_nc') },
        { value: 'CC-BY-SA', text: this.$t('actionButtons.licenses.cc_by_sa') },
        { value: 'CC-BY', text: this.$t('actionButtons.licenses.cc_by') }
      ]
    },
    isOnline () {
      return this.$store.state.isOnline
    },
    // Obligatoria para publicar; el servidor la exige igual (ver utils/personalDataConfirmation).
    missingPersonalDataConfirmation () {
      return needsPersonalDataConfirmation(this.modalProject)
    }
  },
  data () {
    return {
      modalProject: { name: '' },
      state: {
        license_type: null
      },
      errorsResponse: {
        message: '',
        missingFields: []
      }
    }
  },
  methods: {
    openModal () {
      this.loadModalProject(this.project)
      this.errorsResponse = {
        message: '',
        missingFields: []
      }
      this.$refs['modal-change-status'].show()
      if (this.project.id) this.enterPropertiesLock()
    },

    loadModalProject (project) {
      this.modalProject = JSON.parse(JSON.stringify(project))
      this.modalProject.isModal = true
      // Unpublishing stores an empty licence and the server never requires one: an empty
      // or absent value takes the default, as Properties does.
      this.modalProject.license_type = effectiveLicense(project.license_type)
    },

    onHidden () {
      this.leavePropertiesLock()
    },

    propertiesLockProjectId () {
      return this.project.id
    },

    // Rechaza si falla: el mixin no toma el lock sobre datos viejos. `networkOnly` por lo
    // mismo: una respuesta de la caché nunca trae lo que el otro acaba de guardar.
    refreshBeforePropertiesLock () {
      return Api.get(`/isoqf_projects/${this.project.id}`, { organization: this.$route.params.org_id }, { networkOnly: true })
        .then((response) => {
          this.loadModalProject(response.data)
          // La vista de atrás también quedó vieja: que la recargue.
          this.$emit('getProject')
        })
    },

    async savePublicStatus (event) {
      event.preventDefault()
      // Defensa además del botón deshabilitado: el `@ok` del b-modal también llega acá.
      if (!this.propertiesLockHeld || this.missingPersonalDataConfirmation) return
      this.$emit('uiPublishShowLoader', true)
      this.errorsResponse = { message: '', missingFields: [] }

      let params = {}
      params.id = this.project.id
      params.public_type = this.modalProject.public_type
      params.private = true
      params.is_public = false

      if (this.modalProject.public_type !== 'private') {
        params.private = false
        params.is_public = true
        params.license_type = effectiveLicense(this.modalProject.license_type)
        params[PERSONAL_DATA_CONFIRMED] = true
      } else {
        params.license_type = ''
      }

      if (this.modalProject.public_type !== 'private') {
        try {
          const answer = (await Project.canPublish({
            ...this.modalProject,
            id: this.project.id,
            public_type: this.modalProject.public_type,
            license_type: effectiveLicense(this.modalProject.license_type),
            [PERSONAL_DATA_CONFIRMED]: true
          })).data
          if (!answer.status) {
            const missing = Array.isArray(answer.missing_fields) ? answer.missing_fields : []
            const body = document.getElementById('modal-change-status___BV_modal_body_')
            if (body) body.scrollTo({ top: 0, behavior: 'smooth' })
            this.errorsResponse = {
              message: missing.length ? 'project.notifications.publish_missing_fields' : 'project.validation.publish_requirement',
              missingFields: missing
            }
            this.$emit('uiPublishShowLoader', false)
            return
          }
          // Megan's notice: only complete findings will be visible.
          // Only on the private -> public transition (`project` is the pre-edit state).
          if (!isProjectPublic(this.project) && !await Project.confirmIncompleteFindings(this, this.project.id)) {
            this.$emit('uiPublishShowLoader', false)
            return
          }
        } catch (error) {
          // Without this catch the method rejected and the spinner kept turning.
          this.onPublishError(error)
          return
        }
        return this.patchPublicStatus(params)
      } else {
        return this.patchPublicStatus(params)
      }
    },

    patchPublicStatus (params) {
      return Api.patch('/api/publish', { params })
        .then(() => {
          this.modalProject = { name: '' }
          this.$emit('getProject')
          this.$emit('uiPublishShowLoader', false)
          this.$refs['modal-change-status'].hide()
        })
        .catch(this.onPublishError)
    },

    // Antes terminaba en `console.log` sin apagar el loader: el spinner giraba para siempre y
    // nadie decía que el proyecto había quedado como estaba. El modal queda abierto con lo
    // elegido, para reintentar.
    onPublishError (error) {
      this.$emit('uiPublishShowLoader', false)
      // The server refused for missing fields (the project changed under this modal): the
      // in-modal alert says it, with the way to Properties, as the pre-check does. One event,
      // one channel: no toast for it.
      const data = error && error.response && error.response.data
      if (data && data.reason === 'publish_requirements_not_met') {
        const missing = Array.isArray(data.missing_fields) ? data.missing_fields : []
        const body = document.getElementById('modal-change-status___BV_modal_body_')
        if (body) body.scrollTo({ top: 0, behavior: 'smooth' })
        this.errorsResponse = {
          message: missing.length ? 'project.notifications.publish_missing_fields' : 'project.validation.publish_requirement',
          missingFields: missing
        }
        return
      }
      const key = writeErrorMessageKey(error, 'notifications.publish_error')
      if (key) this.$notify.error(this.$t(key))
    },

    // Back to the Properties tab with the fields that stop the publication highlighted.
    goToProperties () {
      const missing = this.errorsResponse.missingFields
      this.$refs['modal-change-status'].hide()
      const query = { ...this.$route.query, tab: 'Project-Property', highlight: missing.join(',') }
      const navigation = this.$router.push({ path: this.$route.path, query })
      if (navigation && navigation.catch) {
        return navigation.catch(err => { if (err && err.name !== 'NavigationDuplicated') throw err })
      }
    }
  }
}
</script>

<style scoped>
</style>
