<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="py-5">
        <h2>My Workspace</h2>
      </div>
    </b-container>
    <b-container fluid>
      <b-table
        :items="projects"
        :fields="fields"
        :busy="isLoading"
        striped
        hover>

        <template #table-busy>
          <div class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner>
            <strong>Cargando...</strong>
          </div>
        </template>

        <template v-slot:cell(private)="data">
          <b-badge
            variant="light"
            class="publish-status"
            v-b-tooltip.hover
            :title="publicTypeOptions.map((obj)=>{ if (obj.value === data.item.public_type) { return obj.text } })">
            {{ data.item.public_type }}
          </b-badge>
        </template>

        <template #cell(actions)="row">
          <b-button-group>
            <b-button
              size="sm"
              variant="primary"
              @click="openEditModal(row.item)">
              Editar
            </b-button>
            <b-button
              size="sm"
              variant="danger"
              @click="deleteProject(row.item.id)">
              Eliminar
            </b-button>
            <b-button
              size="sm"
              variant="info"
              @click="openCloneModal(row.item)">
              Duplicar
            </b-button>
          </b-button-group>
        </template>

      </b-table>
    </b-container>

    <!-- Modal de Edición -->
    <b-modal
      id="new-project"
      ref="new-project"
      v-model="showEditModal"
      :title="(editingProject.id) ? 'Edit iSoQ table' : 'New iSoQ table'"
      @ok="saveProject"
      @cancel="closeEditModal"
      :ok-disabled="!isFormValid"
      ok-title="Guardar"
      cancel-title="Cancelar">
      <organizationForm
          ref="organizationForm"
          :formData="editingProject"
          :canWrite="($store.state.user.personal_organization === this.$route.params.id)"
          :isModal="true"
          @modal-notification="modalNotification"></organizationForm>
    </b-modal>

    <!-- Modal de Confirmación de Duplicación -->
    <b-modal
      id="clone-confirmation"
      ref="clone-confirmation"
      v-model="showCloneModal"
      title="Duplicate a project"
      @ok="cloneProject"
      @cancel="closeCloneModal"
      ok-title="Duplicate"
      cancel-title="Close"
      :ok-disabled="!isLoading && isCloneDone || isLoading">
      <template v-if="isLoading">
        <div class="text-center">
          <b-spinner class="align-middle"></b-spinner>
          <strong>Loading...</strong>
        </div>
      </template>
      <template v-if="!isLoading && !isCloneDone">
        <p>
          Click on the "duplicate" button to start making a copy of the project "<b>{{ cloningProject && cloningProject.name || '' }}</b>".
          <br>
          The content of the duplicate will be identical to the original but it will not be shared with other users automatically.
          <br>
          Use the "share" button to share the duplicated project.
        </p>
      </template>
      <template v-if="!isLoading && isCloneDone">
        <p class="text-center text-success">Duplicate complete. You can now close this modal.</p>
      </template>
    </b-modal>
  </div>
</template>

<script>
import axios from 'axios'
import organizationForm from '@/components/organization/organizationForm.vue'

export default {
  components: {
    organizationForm
  },
  data () {
    return {
      projects: [],
      isLoading: false,
      showEditModal: false,
      showCloneModal: false,
      isCloneDone: false,
      editingProject: this.getDefaultProject(),
      cloningProject: null,
      errors: {
        name: '',
        author_email: ''
      },
      fields: [
        { key: 'private', label: 'Privacy' },
        { key: 'name', label: 'Title' },
        { key: 'actions', label: '' }
      ],
      publicTypeOptions: [
        { value: 'private', text: 'Private - Your iSoQ is not publicly available on the iSoQ database' },
        { value: 'fully', text: 'Fully Public - Your iSoQ table, Evidence Profile, and GRADE-CERQual Worksheets are publicly available on the iSoQ database' },
        { value: 'partially', text: 'Partially Public - Your iSoQ table and Evidence Profile are publicly available on the iSoQ database' },
        { value: 'minimally', text: 'Minimally Public - Your iSoQ table is available on the iSoQ database' }
      ]
    }
  },

  computed: {
    isFormValid () {
      return this.editingProject.name &&
             !this.errors.name &&
             !this.errors.author_email
    }
  },

  mounted () {
    this.getProjects()
  },

  methods: {
    getDefaultProject () {
      return {
        id: null,
        name: '',
        description: '',
        private: true,
        public_type: 'private',
        organization: this.$route.params.id,
        review_question: '',
        published_status: false,
        complete_by_author: true,
        url_doi: '',
        authors: '',
        lists_authors: '',
        author: '',
        author_email: '',
        is_public: false
      }
    },

    openEditModal (project) {
      this.editingProject = { ...project }
      this.showEditModal = true
    },

    closeEditModal () {
      this.editingProject = this.getDefaultProject()
      this.showEditModal = false
      this.errors = {
        name: '',
        author_email: ''
      }
    },

    modalNotification: function () {
      this.$refs['new-project'].hide()
      this.getProjects()
    },

    saveProject: function (e) {
      e.preventDefault()
      this.$refs['organizationForm'].save()
    },

    async getProjects () {
      this.isLoading = true
      try {
        const response = await axios.get('/api/getProjects')
        this.projects = response.data.sort((a, b) => {
          const dateA = new Date(a.last_update || 0)
          const dateB = new Date(b.last_update || 0)
          return dateB - dateA
        })
      } catch (error) {
        console.error('Error al obtener proyectos:', error)
      } finally {
        this.isLoading = false
      }
    },

    async deleteProject (projectId) {
      if (confirm('¿Está seguro de eliminar este proyecto?')) {
        try {
          this.isLoading = true
          const response = await axios.get(`/api/remove/project/${projectId}`)

          if (response.data.status) {
            await this.getProjects()
          } else {
            throw new Error('No se pudo eliminar el proyecto')
          }
        } catch (error) {
          console.error('Error al eliminar proyecto:', error)
          alert('Error al eliminar el proyecto. Por favor, intente nuevamente.')
        } finally {
          this.isLoading = false
        }
      }
    },

    openCloneModal (project) {
      this.cloningProject = project
      this.showCloneModal = true
      this.isCloneDone = false
    },

    closeCloneModal () {
      this.cloningProject = null
      this.showCloneModal = false
      this.isCloneDone = false
    },

    async cloneProject (e) {
      e.preventDefault()
      try {
        this.isLoading = true
        const response = await axios.get(`/api/clone/project/${this.cloningProject.id}/org/${this.$route.params.id}`)

        if (response.data.status) {
          this.isLoading = false
          this.isCloneDone = true
        } else {
          throw new Error('No se pudo duplicar el proyecto')
        }
      } catch (error) {
        console.error('Error al duplicar proyecto:', error)
        this.isLoading = false
        this.isCloneDone = false
        alert('Error al duplicar el proyecto. Por favor, intente nuevamente.')
      } finally {
        this.isLoading = false
        this.isCloneDone = true
      }
    }
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}
</style>
