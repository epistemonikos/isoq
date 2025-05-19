<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="py-5">
        <h2>My Workspace</h2>
      </div>
    </b-container>
    <b-container fluid>
      <div class="my-4">
        <h3>{{ $t("Projects") }}</h3>
        <b-row align-h="end" v-if="$store.state.user.personal_organization === this.$route.params.id">
          <b-col cols="12" class="text-right">
            <b-button
              v-b-tooltip.hover
              title="Create a new Interactive Summary of Qualitative Findings Table"
              variant="success"
              @click="openNewProjectModal">{{ $t("Add new project") }}</b-button>
          </b-col>
        </b-row>
        <b-row
          class="mt-3">
          <b-col>
            <b-table
              :items="projects"
              :fields="fields"
              :busy="isLoading"
              striped
              hover>

              <template #table-busy>
                <div class="text-center my-2">
                  <b-spinner class="align-middle"></b-spinner>
                  <strong>Loading...</strong>
                </div>
              </template>

              <template v-slot:cell(private)="row">
                <b-badge
                  variant="light"
                  class="publish-status"
                  v-b-tooltip.hover
                  :title="publicTypeOptions.map((obj)=>{ if (obj.value === row.item.public_type) { return obj.text } })">
                  {{ row.item.public_type }}
                </b-badge>
              </template>

              <template v-slot:cell(name)="row">
                <b-link
                  :id="`p-${row.item.id}`"
                  class="link-project"
                  :to="{name: 'viewProject', params: {org_id: row.item.organization, id: row.item.id}}">
                  {{ row.item.name }}
                </b-link>
              </template>

              <template #cell(actions)="row">
                <b-button-group>
                  <!-- Botones para el dueño del proyecto -->
                  <template v-if="row.item.isOwner">
                    <b-button
                      size="sm"
                      variant="outline-secondary"
                      title="Duplicate"
                      @click="openCloneModal(row.item)">
                      <font-awesome-icon
                        icon="copy"></font-awesome-icon>
                    </b-button>
                    <b-button
                      v-if="row.item.sharedToken"
                      size="sm"
                      variant="outline-secondary"
                      title="You have a temporary link enabled for this project. It will remain enabled until you manually switch it off. Click here to switch it off"
                      @click="openShareModalWithTab(row.item)">
                      <font-awesome-icon
                        icon="link"></font-awesome-icon>
                    </b-button>
                    <b-button
                      size="sm"
                      variant="outline-secondary"
                      title="Share"
                      @click="openShareModal(row.item)">
                      <font-awesome-icon
                        icon="users"></font-awesome-icon>
                    </b-button>
                    <b-button
                      size="sm"
                      variant="outline-success"
                      title="Edit"
                      @click="openEditModal(row.item)">
                      <font-awesome-icon
                        icon="edit"></font-awesome-icon>
                    </b-button>
                    <b-button
                      size="sm"
                      variant="outline-danger"
                      title="Remove"
                      @click="deleteProject(row.item.id)">
                      <font-awesome-icon
                        icon="trash"></font-awesome-icon>
                    </b-button>
                  </template>

                  <!-- Botones para usuarios con permisos de escritura -->
                  <template v-else-if="row.item.allowToWrite">
                    <b-button
                      size="sm"
                      variant="outline-secondary"
                      title="Duplicate"
                      @click="openCloneModal(row.item)">
                      <font-awesome-icon
                        icon="copy"></font-awesome-icon>
                    </b-button>
                    <b-button
                      size="sm"
                      variant="outline-success"
                      title="Edit"
                      @click="openEditModal(row.item)">
                      <font-awesome-icon
                        icon="edit"></font-awesome-icon>
                    </b-button>
                    <b-button
                      size="sm"
                      variant="outline-success"
                      title="Leave"
                      @click="openLeaveModal(row.item)">
                      <font-awesome-icon
                        icon="sign-out-alt"></font-awesome-icon>
                    </b-button>
                  </template>

                  <!-- Botones para usuarios con solo permisos de lectura -->
                  <template v-else-if="row.item.allowToRead">
                    <b-button
                      size="sm"
                      variant="outline-success"
                      title="Leave"
                      @click="openLeaveModal(row.item)">
                      <font-awesome-icon
                        icon="sign-out-alt"></font-awesome-icon>
                    </b-button>
                  </template>
                </b-button-group>
              </template>

            </b-table>
          </b-col>
        </b-row>
      </div>
    </b-container>

    <!-- Modal de Edición -->
    <b-modal
      id="new-project"
      ref="new-project"
      v-model="showEditModal"
      :title="(editingProject.id) ? 'Edit iSoQ table' : 'New iSoQ table'"
      @ok="saveProject"
      @cancel="closeEditModal"
      :ok-disabled="!editingProject.name"
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

      <p>
        Click on the "duplicate" button to start making a copy of the project "<b>{{ cloningProject && cloningProject.name || '' }}</b>".
        <br>
        The content of the duplicate will be identical to the original but it will not be shared with other users automatically.
        <br>
        Use the "share" button to share the duplicated project.
      </p>

      <template v-if="isLoading">
        <div class="text-center">
          <b-spinner class="align-middle"></b-spinner>
          <strong>Loading...</strong>
        </div>
      </template>
      <template v-if="!isLoading && isCloneDone">
        <p class="text-center text-success">Duplicate complete. You can now close this modal.</p>
      </template>
    </b-modal>

    <!-- Modal de Compartir -->
    <b-modal
      id="share-modal"
      ref="share-modal"
      v-model="showShareModal"
      title="Share Project"
      size="lg"
      @hide="closeShareModal">
      <b-tabs content-class="mt-3">
        <b-tab title="Invite" active>
          <b-form @submit.stop.prevent="addEmail">
            <b-form-group
              label="Email addresses"
              description="Enter email addresses separated by commas">
              <b-form-input
                v-model="emailInput"
                :state="emailInputState"
                placeholder="email1@example.com, email2@example.com"
                @input="validateEmails">
              </b-form-input>
              <b-form-invalid-feedback :state="emailInputState">
                {{ emailInputError }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-button
              type="submit"
              variant="primary"
              :disabled="!isEmailInputValid">
              Add
            </b-button>
          </b-form>

          <div v-if="inviteEmails.length > 0" class="mt-3">
            <h6>Added emails:</h6>
            <b-list-group>
              <b-list-group-item v-for="(email, index) in inviteEmails" :key="index">
                {{ email }}
                <b-button
                  size="sm"
                  variant="danger"
                  class="float-right"
                  @click="removeEmail(index)">
                  Remove
                </b-button>
              </b-list-group-item>
            </b-list-group>

            <b-form-group class="mt-3" label="Permissions">
              <b-form-select
                v-model="selectedPermission"
                :options="permissionOptions">
              </b-form-select>
            </b-form-group>

            <b-button
              variant="success"
              class="mt-3"
              :disabled="!canInvite"
              @click="sendInvites">
              Invite
            </b-button>
          </div>
        </b-tab>
        <b-tab title="Users with access">
          <div v-if="isLoading">
            <div class="text-center my-2">
              <b-spinner class="align-middle"></b-spinner>
              <strong>Loading...</strong>
            </div>
          </div>
          <div v-else>
            <!-- Tabla de usuarios registrados -->
            <h5 class="mt-3">Users with Access</h5>
            <b-table
              :items="registeredUsers"
              :fields="registeredUsersFields"
              striped
              hover>
              <template #cell(user_can)="data">
                <b-form-select
                  v-model="data.item.user_can"
                  :options="permissionOptions"
                  @change="updateUserPermission(data.item)">
                </b-form-select>
              </template>
              <template #cell(actions)="data">
                <b-button
                  size="sm"
                  variant="danger"
                  @click="unshareUser(data.item)">
                  Unshare
                </b-button>
              </template>
              <template v-slot:empty>
                <p class="font-weight-light text-center my-3">No users have access to this project</p>
              </template>
            </b-table>

            <!-- Tabla de usuarios no registrados -->
            <h5 class="mt-4">Pending access</h5>
            <b-table
              :items="pendingUsers"
              :fields="pendingUsersFields"
              striped
              hover>
              <template #cell(actions)="data">
                <b-button
                  size="sm"
                  variant="danger"
                  @click="unshareEmail(data.item.email)">
                  Unshare
                </b-button>
              </template>
              <template v-slot:empty>
                <p class="font-weight-light text-center my-3">No pending access requests</p>
              </template>
            </b-table>
          </div>
        </b-tab>
        <b-tab title="Temporary sharing">
          <div class="mt-3">
            <p>
              Enable this option to share the project with a user who does not have an iSoQ account.
              Anyone you send the link to will be able to see the project but not edit it.
            </p>

            <b-form-group>
              <b-form-checkbox
                v-model="isTemporaryEnabled"
                switch
                @change="handleTemporarySharing">
                Generate a temporary URL. <span class="text-danger">This link will not expire automatically. You must switch it off manually to disable it.</span>
              </b-form-checkbox>
            </b-form-group>

            <div v-if="isTemporaryEnabled && temporaryUrl" class="mt-3">
              <b-form-group label="Share this link">
                <b-input-group>
                  <b-form-input
                    v-model="temporaryUrl"
                    readonly>
                  </b-form-input>
                  <b-input-group-append>
                    <b-button
                      variant="outline-secondary"
                      @click="copyToClipboard">
                      Copy
                    </b-button>
                  </b-input-group-append>
                </b-input-group>
              </b-form-group>
            </div>
          </div>
        </b-tab>
      </b-tabs>
    </b-modal>

    <!-- Modal de Leave -->
    <b-modal
      id="leave-modal"
      ref="leave-modal"
      v-model="showLeaveModal"
      title="Leave project"
      @ok="leaveProject"
      @cancel="closeLeaveModal"
      ok-title="Leave"
      cancel-title="Cancel"
      ok-variant="danger">
      <p>Leave the project <b>{{ leavingProject ? leavingProject.name : '' }}</b></p>
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
      showShareModal: false,
      isCloneDone: false,
      editingProject: this.getDefaultProject(),
      cloningProject: null,
      sharingProject: null,
      emailInput: '',
      emailInputState: null,
      emailInputError: '',
      inviteEmails: [],
      selectedPermission: null,
      permissionOptions: [
        { value: 0, text: 'View the project' },
        { value: 1, text: 'View and edit the project' }
      ],
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
      ],
      registeredUsers: [],
      pendingUsers: [],
      registeredUsersFields: [
        { key: 'username', label: 'Username' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'user_can', label: 'Permissions' },
        { key: 'actions', label: 'Actions' }
      ],
      pendingUsersFields: [
        { key: 'email', label: 'Email' },
        { key: 'actions', label: 'Actions' }
      ],
      isTemporaryEnabled: false,
      temporaryUrl: '',
      sharedToken: '',
      showLeaveModal: false,
      leavingProject: null
    }
  },

  computed: {
    isFormValid () {
      return this.editingProject.name &&
             !this.errors.name &&
             !this.errors.author_email
    },
    isEmailInputValid () {
      return this.emailInputState === true
    },
    canInvite () {
      return this.inviteEmails.length > 0 && this.selectedPermission !== null
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
        this.projects = response.data.map(project => {
          // Verificar si el usuario es dueño del proyecto
          const isOwner = project.organization === this.$store.state.user.personal_organization

          // Si no es dueño, verificar permisos de lectura y escritura
          let allowToRead = false
          let allowToWrite = false

          if (!isOwner) {
            allowToRead = project.can_read && project.can_read.includes(this.$store.state.user.id)
            allowToWrite = project.can_write && project.can_write.includes(this.$store.state.user.id)
          }

          return {
            ...project,
            isOwner,
            allowToRead,
            allowToWrite
          }
        }).sort((a, b) => {
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
          await this.getProjects()
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
    },

    openShareModal (project) {
      this.sharingProject = project
      this.showShareModal = true
      this.resetShareForm()
      this.loadUsersWithAccess()

      // Usar token y URL existentes si están disponibles, o generar nuevos
      this.sharedToken = project.sharedToken || this.generateSharedToken()
      this.temporaryUrl = project.temporaryUrl || `${window.location.origin}/preview/isoq/${project.organization}/${project.id}/${this.sharedToken}`

      // Si el proyecto ya tiene un token compartido, habilitar el checkbox
      if (project.sharedToken) {
        this.isTemporaryEnabled = true
      }
    },

    closeShareModal () {
      this.sharingProject = null
      this.showShareModal = false
      this.resetShareForm()
    },

    resetShareForm () {
      this.emailInput = ''
      this.emailInputState = null
      this.emailInputError = ''
      this.inviteEmails = []
      this.selectedPermission = null
      this.isTemporaryEnabled = false
      this.temporaryUrl = ''
      this.sharedToken = ''
    },

    validateEmails () {
      if (!this.emailInput.trim()) {
        this.emailInputState = null
        this.emailInputError = ''
        return
      }

      const emails = this.emailInput.split(',').map(email => email.trim())
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const invalidEmails = emails.filter(email => !emailRegex.test(email))

      if (invalidEmails.length > 0) {
        this.emailInputState = false
        this.emailInputError = 'Invalid email format'
      } else {
        this.emailInputState = true
        this.emailInputError = ''
      }
    },

    addEmail () {
      if (!this.isEmailInputValid) return

      const emails = this.emailInput.split(',').map(email => email.trim())
      this.inviteEmails.push(...emails)
      this.emailInput = ''
      this.emailInputState = null
      this.emailInputError = ''
    },

    removeEmail (index) {
      this.inviteEmails.splice(index, 1)
    },

    async sendInvites () {
      if (!this.canInvite) return

      try {
        this.isLoading = true
        const response = await axios.post(`/share/project/${this.sharingProject.id}`, {
          current_user: this.$store.state.user.name,
          emails: this.inviteEmails,
          user_can: this.selectedPermission,
          org: this.$route.params.id
        })

        if (response.status === 200) {
          this.$bvToast.toast('Invitations sent successfully', {
            title: 'Success',
            variant: 'success'
          })
          this.resetShareForm()

          // Actualizar el proyecto con los datos más recientes
          const updatedProject = await axios.get(`/api/isoqf_projects/${this.sharingProject.id}`)
          this.sharingProject = updatedProject.data

          // Limpiar las listas actuales
          this.registeredUsers = []
          this.pendingUsers = []

          // Recargar la lista de usuarios
          await this.loadUsersWithAccess()
        } else {
          throw new Error(`Failed to send invitations: ${response.data.message || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Error sending invitations:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response && error.response.data,
          status: error.response && error.response.status
        })
        const errorMessage = error.response && error.response.data && error.response.data.message
        this.$bvToast.toast(errorMessage || 'Error sending invitations. Please try again.', {
          title: 'Error',
          variant: 'danger'
        })
      } finally {
        this.isLoading = false
      }
    },

    async loadUsersWithAccess () {
      if (!this.sharingProject) return

      this.isLoading = true
      try {
        // Cargar usuarios registrados
        const userIds = [
          ...(this.sharingProject.can_read || []),
          ...(this.sharingProject.can_write || [])
        ]

        const uniqueUserIds = [...new Set(userIds)]
        const userPromises = uniqueUserIds.map(id =>
          axios.get(`/users/${id}`)
            .then(response => ({
              ...response.data,
              user_can: this.sharingProject.can_write.includes(id) ? 1 : 0
            }))
            .catch(() => null)
        )

        const users = await Promise.all(userPromises)
        this.registeredUsers = users.filter(user => user !== null)

        // Cargar usuarios no registrados
        this.pendingUsers = (this.sharingProject.invite_emails || []).map(email => ({
          email,
          user_can: 0
        }))
      } catch (error) {
        console.error('Error loading users:', error)
        this.$bvToast.toast('Error loading users. Please try again.', {
          title: 'Error',
          variant: 'danger'
        })
      } finally {
        this.isLoading = false
      }
    },

    async updateUserPermission (user) {
      try {
        const response = await axios.patch(`/share/project/${this.sharingProject.id}/options-update`, {
          'user_id': user.id,
          'option': user.user_can
        })

        if (response.status === 200) {
          this.$bvToast.toast('User permissions updated successfully', {
            title: 'Success',
            variant: 'success'
          })
        } else {
          throw new Error('Failed to update user permissions')
        }
      } catch (error) {
        console.error('Error updating user permissions:', error)
        this.$bvToast.toast('Error updating user permissions. Please try again.', {
          title: 'Error',
          variant: 'danger'
        })
        // Recargar usuarios para restaurar el estado anterior
        this.loadUsersWithAccess()
      }
    },

    async unshareUser (user) {
      try {
        const response = await axios.post(`/share/project/${this.sharingProject.id}/unshare`, null, {params: {
          current_user: this.$store.state.user.name,
          user_id: user.id,
          org_id: this.$route.params.id
        }})

        if (response.status === 200) {
          this.$bvToast.toast('User removed successfully', {
            title: 'Success',
            variant: 'success'
          })
          // Actualizar el proyecto con los datos más recientes
          const updatedProject = await axios.get(`/api/isoqf_projects/${this.sharingProject.id}`)
          this.sharingProject = updatedProject.data
          // Recargar la lista de usuarios
          await this.loadUsersWithAccess()
        } else {
          throw new Error('Failed to remove user')
        }
      } catch (error) {
        console.error('Error removing user:', error)
        this.$bvToast.toast('Error removing user. Please try again.', {
          title: 'Error',
          variant: 'danger'
        })
      }
    },

    async unshareEmail (email) {
      try {
        const response = await axios.post(`/share/project/${this.sharingProject.id}/unshare`, null, {params: {
          current_user: this.$store.state.user.name,
          email: email,
          org_id: this.$route.params.id
        }})

        if (response.status === 200) {
          this.$bvToast.toast('Email removed successfully', {
            title: 'Success',
            variant: 'success'
          })
          // Actualizar el proyecto con los datos más recientes
          const updatedProject = await axios.get(`/api/isoqf_projects/${this.sharingProject.id}`)
          this.sharingProject = updatedProject.data
          // Limpiar las listas actuales
          this.registeredUsers = []
          this.pendingUsers = []
          // Recargar la lista de usuarios
          await this.loadUsersWithAccess()
        } else {
          throw new Error('Failed to remove email')
        }
      } catch (error) {
        console.error('Error removing email:', error)
        this.$bvToast.toast('Error removing email. Please try again.', {
          title: 'Error',
          variant: 'danger'
        })
      }
    },

    async handleTemporarySharing () {
      if (!this.sharingProject) return

      try {
        this.isLoading = true
        const response = await axios.patch('/api/sharedLink', {params: {
          sharedToken: this.isTemporaryEnabled ? this.sharedToken : null,
          is_public: this.isTemporaryEnabled,
          temporaryUrl: this.isTemporaryEnabled ? this.temporaryUrl : null,
          project_id: this.sharingProject.id
        }})

        if (response.status === 200) {
          if (!this.isTemporaryEnabled) {
            this.temporaryUrl = ''
            this.sharedToken = ''
          }
          this.$bvToast.toast(
            this.isTemporaryEnabled ? 'Temporary sharing enabled' : 'Temporary sharing disabled',
            {
              title: 'Success',
              variant: 'success'
            }
          )
          this.getProjects()
        } else {
          throw new Error('Failed to update temporary sharing')
        }
      } catch (error) {
        console.error('Error updating temporary sharing:', error)
        this.$bvToast.toast('Error updating temporary sharing. Please try again.', {
          title: 'Error',
          variant: 'danger'
        })
        // Revertir el estado del checkbox
        this.isTemporaryEnabled = !this.isTemporaryEnabled
      } finally {
        this.isLoading = false
      }
    },

    copyToClipboard () {
      const textArea = document.createElement('textarea')
      textArea.value = this.temporaryUrl
      document.body.appendChild(textArea)
      textArea.select()

      try {
        const successful = document.execCommand('copy')
        if (successful) {
          this.$bvToast.toast('Link copied to clipboard', {
            title: 'Success',
            variant: 'success'
          })
        } else {
          throw new Error('Copy command failed')
        }
      } catch (err) {
        console.error('Failed to copy text: ', err)
        this.$bvToast.toast('Failed to copy link', {
          title: 'Error',
          variant: 'danger'
        })
      }

      document.body.removeChild(textArea)
    },

    generateSharedToken () {
      // Generar un token aleatorio de 32 caracteres
      const array = new Uint8Array(16)
      window.crypto.getRandomValues(array)
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    },

    openShareModalWithTab (project) {
      this.openShareModal(project)
      this.$nextTick(() => {
        const modalContent = document.querySelector('#share-modal___BV_modal_content_')
        if (modalContent) {
          const tabs = modalContent.querySelectorAll('.nav-link')
          if (tabs && tabs.length >= 3) {
            tabs[2].click()
          }
        }
      })
    },

    openLeaveModal (project) {
      this.leavingProject = project
      this.showLeaveModal = true
    },

    closeLeaveModal () {
      this.leavingProject = null
      this.showLeaveModal = false
    },

    async leaveProject () {
      if (!this.leavingProject) return

      try {
        this.isLoading = true
        const response = await axios.post(`/project/${this.leavingProject.id}/unsubscribe?userId=${this.$store.state.user.id}`)

        if (response.status === 200) {
          this.$bvToast.toast('Successfully left the project', {
            title: 'Success',
            variant: 'success'
          })
          await this.getProjects()
        } else {
          throw new Error('Failed to leave the project')
        }
      } catch (error) {
        console.error('Error leaving project:', error)
        this.$bvToast.toast('Error leaving the project. Please try again.', {
          title: 'Error',
          variant: 'danger'
        })
      } finally {
        this.isLoading = false
        this.closeLeaveModal()
      }
    },

    openNewProjectModal () {
      this.editingProject = this.getDefaultProject()
      this.showEditModal = true
    }
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}
.publish-status {
  text-transform: uppercase;
}
.link-project {
  color: #000;
}
</style>
