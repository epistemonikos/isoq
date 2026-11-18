<template>
  <b-modal
    id="new-project"
    ref="new-project"
    size="xl"
    :title="(project.id) ? $t('common.edit_isoq_table') || 'Edit iSoQ table' : $t('common.new_isoq_table') || 'New iSoQ table'"
    @ok="save"
    @cancel="closeModalProject"
    @hidden="closeModalProject"
    :ok-disabled="okDisabled"
    :ok-title="$t('common.save')"
    ok-variant="outline-success"
    cancel-variant="outline-secondary">
    <PropertiesLockAlert
      :status="propertiesLock.status"
      :lockedBy="propertiesLock.lockedBy" />
    <organizationForm
      ref="organizationForm"
      :formData="project"
      :canEdit="canEdit"
      :isModal="true"
      @modal-notification="modalNotification"></organizationForm>
  </b-modal>
</template>

<script>
import Api from '@/utils/Api'
import propertiesLockMixin from '@/mixins/propertiesLockMixin'
import PropertiesLockAlert from '@/components/project/PropertiesLockAlert.vue'
import { needsPersonalDataConfirmation } from '@/utils/personalDataConfirmation'
const organizationForm = () => import(/* webpackChunkName: "organizationForm" */'../../organization/organizationForm')

export default {
  name: 'ProjectFormModal',
  mixins: [propertiesLockMixin],
  components: {
    organizationForm,
    PropertiesLockAlert
  },
  props: {
    project: {
      type: Object,
      required: true,
      default: () => ({})
    },
    // Sólo el permiso. El lock lo resuelve este modal (propertiesLockMixin).
    canEditProject: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    // Un proyecto nuevo no tiene a quién bloquear.
    canEdit () {
      return this.canEditProject && (!this.project.id || this.propertiesLockHeld)
    },
    // organizationForm escribe la casilla de datos personales en este mismo objeto.
    okDisabled () {
      return !this.project.name || !this.canEdit || needsPersonalDataConfirmation(this.project)
    }
  },
  methods: {
    show () {
      this.$refs['new-project'].show()
      // El padre asigna `project` justo antes de llamarnos y el prop llega un tick tarde:
      // leído ahora sería el proyecto ANTERIOR (o ninguno).
      this.$nextTick(() => {
        if (this.project.id && this.canEditProject) this.enterPropertiesLock()
      })
    },
    hide () {
      this.$refs['new-project'].hide()
    },
    save: function (e) {
      if (e) e.preventDefault()
      this.$refs['organizationForm'].save()
    },
    closeModalProject: function () {
      this.leavePropertiesLock()
      this.$emit('cancel')
    },
    propertiesLockProjectId () {
      return this.project.id
    },
    // Rechaza si falla: el mixin no toma el lock sobre datos viejos. `networkOnly` por lo
    // mismo: una respuesta de la caché nunca trae lo que el otro acaba de guardar.
    refreshBeforePropertiesLock () {
      const projectId = this.project.id
      return Api.get(`/isoqf_projects/${projectId}`, { organization: this.$route.params.id }, { networkOnly: true })
        .then((response) => {
          // Se cerró y se abrió otro proyecto mientras refrescaba: pisarlo con éste mostraría
          // y bloquearía el proyecto equivocado.
          if (this.project.id !== projectId) throw new Error('project changed while refreshing')
          this.$emit('project-refreshed', response.data)
        })
    },
    modalNotification: function () {
      this.hide()
      this.$emit('project-saved')
    }
  }
}
</script>
