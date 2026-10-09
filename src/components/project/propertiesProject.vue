<template>
  <div class="pb-5">
    <b-row>
      <b-col
        cols="12"
        class="mb-2">
        <h2>{{ $t('common.project_properties') }}</h2>
      </b-col>
    </b-row>
    <PropertiesLockAlert
      :status="propertiesLock.status"
      :lockedBy="propertiesLock.lockedBy"
      @resume="resumePropertiesLock" />
    <InactivityWarning
      :visible="inactivityWarning"
      :seconds-left="inactivitySecondsLeft"
      message-key="lock.properties_inactivity_message"
      @keep-working="keepWorkingOnInactivity" />
    <organizationForm
      :formData="project"
      :canEdit="formEditable"
      :highlight="highlight"
      @update-form-data="updateFormData"></organizationForm>
  </div>
</template>

<script>
import propertiesLockMixin from '@/mixins/propertiesLockMixin'
import editorInactivityMixin from '@/mixins/editorInactivityMixin'
import PropertiesLockAlert from './PropertiesLockAlert.vue'

export default {
  name: 'propertiesProject',
  mixins: [propertiesLockMixin, editorInactivityMixin],
  components: {
    PropertiesLockAlert,
    InactivityWarning: () => import('@/components/common/InactivityWarning.vue'),
    organizationForm: () => import(/* webpackChunkName: "organizationForm" */'../organization/organizationForm')
  },
  props: {
    project: {
      type: Object,
      required: true
    },
    canEdit: {
      type: Boolean,
      required: true
    },
    highlight: {
      type: String,
      default: ''
    },
    // viewProject oculta los tabs con `d-none`: este componente vive montado desde que se
    // entra al proyecto. El lock cuelga de que la pestaña esté a la vista, no de mounted.
    active: {
      type: Boolean,
      default: false
    },
    // Tiene que RECHAZAR si no pudo refrescar (ver propertiesLockMixin).
    refresh: {
      type: Function,
      default: () => Promise.resolve()
    }
  },
  computed: {
    wantsPropertiesLock () {
      return this.active && this.canEdit && !!this.project.id
    },
    formEditable () {
      return this.canEdit && this.propertiesLockHeld
    }
  },
  watch: {
    wantsPropertiesLock: {
      immediate: true,
      handler (wants) {
        if (wants) this.enterPropertiesLock()
        else this.leavePropertiesLock()
      }
    },
    propertiesLockHeld (held) {
      if (held) this.startInactivityWatch()
      else this.stopInactivityWatch()
    }
  },
  methods: {
    propertiesLockProjectId () {
      return this.project.id
    },
    refreshBeforePropertiesLock () {
      return this.refresh()
    },
    // Propiedades no autoguarda: al expirar se suelta y lo no guardado queda a la vista,
    // en solo lectura. El texto del aviso lo dice.
    onInactivityExpired () {
      this.expirePropertiesLock()
    },
    updateFormData: function (data) {
      this.$emit('update-project', data)
    }
  }
}
</script>
