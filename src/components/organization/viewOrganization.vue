<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="py-5">
        <h2>{{ $t('menu.my_workspace') }}</h2>
      </div>
    </b-container>
    <b-container fluid>
      <div class="my-4">
        <h3>{{ $t("menu.projects") }}</h3>
        <!-- <b-row align-h="end" v-if="$store.state.user.personal_organization === this.$route.params.id">
          <b-col cols="12" class="text-right">
            <b-button v-b-tooltip.hover
              :title="(isOnline) ? $t('project.create_new_isoq') : $t('offline.action_disabled')" variant="success"
              :disabled="!isOnline" @click="openModalNewFindingTable">{{ $t("project.add_new") }}</b-button>
          </b-col>
        </b-row> -->
        <b-row class="mt-3" v-if="projects.length > 10">
          <b-col class="w-100 d-flex justify-content-end">
            <b-row align-h="end">
              <b-col cols="7">
                <b-form-group>
                  <b-input-group>
                    <b-form-input v-model="searchQuery" type="search" id="filterInput"
                      :placeholder="$t('common.search')"></b-form-input>
                    <b-input-group-append>
                      <b-button :disabled="!searchQuery" @click="searchQuery = ''">{{ $t('common.clear') }}</b-button>
                    </b-input-group-append>
                  </b-input-group>
                </b-form-group>
              </b-col>
              <b-col>
                <b-button v-b-tooltip.hover
                  :title="(isOnline) ? $t('project.create_new_isoq') : $t('offline.action_disabled')" variant="success"
                  :disabled="!isOnline" @click="openModalNewFindingTable">{{ $t("project.add_new") }}</b-button>
              </b-col>
            </b-row>
          </b-col>
        </b-row>
        <b-row class="mt-3">
          <b-col cols="12">
            <b-table id="organizations" responsive striped hover head-variant="light" :busy="ui.projectTable.isBusy"
              :fields="ui.projectTable.fields" :items="filteredProjects" :per-page="ui.projectTable.perPage"
              :current-page="ui.projectTable.currentPage" sort-by="created_at" :sort-desc="true" show-empty
              :empty-text="searchQuery ? $t('common.no_results_for', { query: searchQuery }) : $t('common.no_records')">
              <template v-slot:cell(private)="data">
                <b-badge variant="light" class="publish-status" v-b-tooltip.hover
                  :title="(global_status.find(obj => obj.value === data.item.public_type) || {}).text">
                  {{(global_status.find(obj => obj.value === data.item.public_type) || {}).transValue}}
                </b-badge>
              </template>
              <template v-slot:cell(name)="data">
                <b-link :id="`p-${data.item.id}`" class="link-project"
                  :to="{ name: 'viewProject', params: { org_id: data.item.organization, id: data.item.id } }">
                  {{ data.item.name }}
                  <img v-if="data.item.use_camelot" :src="camelotLogo" class="ml-2" width="16" height="16"
                    style="vertical-align: text-bottom;" v-b-tooltip.hover="$t('project.uses_camelot')" />
                </b-link>
              </template>
              <template v-slot:cell(actions)="data">
                <div class="d-block d-lg-none">
                  <b-dropdown id="dropdown-1" :text="$t('project.project_options')" class="m-md-2"
                    variant="outline-secondary">
                    <b-dropdown-item v-if="data.item.is_owner || data.item.allow_to_write"
                      @click="openCloneModal(data.item)" link-class="text-decoration-none"><font-awesome-icon
                        icon="copy"></font-awesome-icon> {{ $t('common.duplicate') }}</b-dropdown-item>
                    <b-dropdown-item
                      v-if="data.item.is_owner && (data.item.sharedToken && data.item.sharedToken.length)"
                      @click="modalShareOptions(data.item, 2)" link-class="text-decoration-none"><font-awesome-icon
                        icon="link"></font-awesome-icon> {{ $t('common.shared') }}</b-dropdown-item>
                    <b-dropdown-item v-if="data.item.is_owner" @click="modalShareOptions(data.item)"
                      link-class="text-decoration-none"><font-awesome-icon icon="users"></font-awesome-icon> {{
                        $t('common.share') }}</b-dropdown-item>
                    <b-dropdown-item v-if="data.item.allow_to_write" @click="openModalEditProject(data.item)"
                      link-class="text-decoration-none"><font-awesome-icon icon="edit"></font-awesome-icon>{{
                        $t('common.edit') }}</b-dropdown-item>
                    <b-dropdown-item v-if="data.item.is_owner" @click="modalRemoveProject(data.item)"
                      link-class="text-decoration-none"><font-awesome-icon icon="trash"></font-awesome-icon> {{
                        $t('common.remove') }}</b-dropdown-item>
                    <b-dropdown-item v-if="!data.item.is_owner && (data.item.allow_to_write || data.item.allow_to_read)"
                      @click="openModalLeaveProject(data.item)" link-class="text-decoration-none"><font-awesome-icon
                        icon="sign-out-alt"></font-awesome-icon> {{ $t('common.leave') }}</b-dropdown-item>
                  </b-dropdown>
                </div>
                <div class="d-none d-lg-block">
                  <b-button v-if="data.item.is_owner || data.item.allow_to_write" :title="$t('common.duplicate')"
                    variant="outline-secondary" @click="openCloneModal(data.item)">
                    <font-awesome-icon icon="copy"></font-awesome-icon>
                  </b-button>
                  <b-button v-if="data.item.is_owner && (data.item.sharedToken && data.item.sharedToken.length)"
                    :title="$t('project.temp_link_warning')" variant="outline-secondary"
                    @click="modalShareOptions(data.item, 2)">
                    <font-awesome-icon icon="link"></font-awesome-icon>
                  </b-button>
                  <b-button v-if="data.item.is_owner" :title="$t('common.share')" variant="outline-secondary"
                    @click="modalShareOptions(data.item)">
                    <font-awesome-icon icon="users"></font-awesome-icon>
                  </b-button>
                  <b-button v-if="data.item.allow_to_write" :title="$t('common.edit')" variant="outline-success"
                    @click="openModalEditProject(data.item)">
                    <font-awesome-icon icon="edit"></font-awesome-icon>
                  </b-button>
                  <b-button v-if="data.item.is_owner" :title="$t('common.remove')" variant="outline-danger"
                    @click="modalRemoveProject(data.item)">
                    <font-awesome-icon icon="trash"></font-awesome-icon>
                  </b-button>
                  <b-button v-if="!data.item.is_owner && (data.item.allow_to_write || data.item.allow_to_read)"
                    :title="$t('common.leave')" variant="outline-success" @click="openModalLeaveProject(data.item)">
                    <font-awesome-icon icon="sign-out-alt"></font-awesome-icon>
                  </b-button>
                </div>
              </template>
              <template v-slot:table-busy>
                <div class="text-center text-danger my-2">
                  <b-spinner class="align-middle"></b-spinner>
                  <strong>{{ $t('common.loading') }}</strong>
                </div>
              </template>
            </b-table>
            <b-pagination v-if="filteredProjects.length > ui.projectTable.perPage" v-model="ui.projectTable.currentPage"
              :total-rows="filteredProjects.length" :per-page="ui.projectTable.perPage" aria-controls="organizations"
              align="center" class="mt-3"></b-pagination>
          </b-col>
        </b-row>
      </div>

      <ProjectFormModal ref="projectFormModal" :project="buffer_project" :canEditProject="canEditProject"
        :lockedByUser="lockedByUser" @cancel="cleanProject" @project-saved="onProjectSaved" />

      <RemoveProjectModal ref="removeProjectModal" :project="buffer_project" :usersAllowed="users_allowed"
        @processing="setProcessing" @cancel="cleanProject" @project-removed="onProjectRemoved" />

      <ShareProjectModal ref="shareProjectModal" :project="buffer_project" :usersAllowed="users_allowed"
        :initialTab="ui.tabIndex" @hidden="cleanProject" @processing="setProcessing" @project-shared="onProjectShared"
        @user-unshared="onUserUnshared" @invited-unshared="onInvitedUnshared"
        @permission-changed="onPermissionChanged" @shared-link-generated="onSharedLinkGenerated" />

      <CloneProjectModal ref="cloneProjectModal" :project="buffer_project" :uiCopy="ui.copy"
        @update-copy-state="updateCopyState" @clone-started="onCloneStarted" @project-cloned="onProjectCloned"
        @cancel="cleanProject" />

      <LeaveProjectModal ref="leaveProjectModal" :project="buffer_project" @processing="setProcessing"
        @cancel="cleanProject" @project-left="onProjectLeft" />

    </b-container>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import Api from '@/utils/Api'
import LockService from '@/services/lockService'
import ProjectFormModal from './modals/ProjectFormModal'
import RemoveProjectModal from './modals/RemoveProjectModal'
import ShareProjectModal from './modals/ShareProjectModal'
import CloneProjectModal from './modals/CloneProjectModal'
import LeaveProjectModal from './modals/LeaveProjectModal'
import preserveScrollMixin from '@/mixins/preserveScrollMixin'

export default {
  name: 'viewOrganization',
  mixins: [preserveScrollMixin],
  components: {
    ProjectFormModal,
    RemoveProjectModal,
    ShareProjectModal,
    CloneProjectModal,
    LeaveProjectModal
  },
  data () {
    return {
      ui: {
        projectTable: {
          fields: [
            { key: 'private', label: this.$t('common.privacy') },
            { key: 'name', label: this.$t('common.title') },
            { key: 'actions', label: '' }
          ],
          isBusy: true,
          perPage: 10,
          currentPage: 1
        },
        tabIndex: 0,
        copy: {
          project: false,
          lists: false,
          references: false,
          findings: false,
          replaceReferences: false,
          copyOf: false,
          referencesTable: false,
          showWarning: null,
          disableCloneModalBtn: false
        }
      },
      global_status: [
        { value: 'private', text: this.$t('project.status_private_text'), transValue: this.$t('project.status_private') },
        { value: 'fully', text: this.$t('project.status_fully_text'), transValue: this.$t('project.status_fully') },
        { value: 'partially', text: this.$t('project.status_partially_text'), transValue: this.$t('project.status_partially') },
        { value: 'minimally', text: this.$t('project.status_minimally_text'), transValue: this.$t('project.status_minimally') }
      ],
      tmp_buffer_project: {
        id: null,
        name: '',
        description: '',
        private: true,
        public_type: 'private',
        organization: this.$route.params.id,
        review_question: '',
        published_status: false,
        complete_by_author: true,
        url_doi: null,
        authors: '',
        lists_authors: '',
        author: '',
        author_email: '',
        is_public: false,
        sharedType: 0,
        sharedTo: '',
        sharedToError: '',
        sharedTokenOnOff: false,
        sharedToken: '',
        sharedCan: {
          read: [],
          write: []
        },
        temporaryUrl: '',
        invite_emails: [],
        tmp_invite_emails: [],
        use_camelot: true
      },
      buffer_project: {},
      users_allowed: [],
      projects: [],
      searchQuery: '',
      hashId: null,
      canEditProject: false,
      lockedByUser: null,
      camelotLogo: require('@/assets/camelot-logo.svg')
    }
  },
  computed: {
    filteredProjects () {
      if (!this.searchQuery) return this.projects
      const query = this.searchQuery.toLowerCase()
      return this.projects.filter(project => {
        return (
          (project.name && project.name.toLowerCase().includes(query)) ||
          (project.description && project.description.toLowerCase().includes(query)) ||
          (project.review_question && project.review_question.toLowerCase().includes(query)) ||
          (project.author && project.author.toLowerCase().includes(query)) ||
          (project.list_authors && project.list_authors.toLowerCase().includes(query))
        )
      })
    }
  },
  created () {
    this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
  },
  mounted () {
    this.getProjects()
  },
  methods: {
    getProjects: function () {
      // El slot `table-busy` colapsa el `tbody` y el navegador clampea la posición.
      // Punto único: acá pasan crear, editar, borrar, duplicar y dejar un proyecto.
      this.holdScrollPosition()
      this.ui.projectTable.isBusy = true
      Api.get('/getProjects')
        .then((response) => {
          this.projects = []
          let _projects = []
          for (const project of response.data) {
            const processProject = this.processProject(project)
            if (Object.keys(processProject).length) {
              _projects.push(processProject)
            }
          }
          const finalList = _projects.sort(function (a, b) { return ((a.created_at < b.created_at) ? -1 : ((a.created_at > b.created_at) ? 1 : 0)) * -1 })
          this.projects.push(...finalList)

          if (Object.prototype.hasOwnProperty.call(this.$route.query, 'hash') || this.hashId !== null) {
            const hash = (Object.prototype.hasOwnProperty.call(this.$route.query, 'hash')) ? `#${this.$route.query.hash}` : `#p-${this.hashId}`
            this.$router.push({
              name: 'viewOrganization',
              params: {
                organization: this.$route.params.org_id
              },
              hash: `${hash}`
            })
            this.hashId = null
          }
        }).catch((error) => {
          console.log(error)
        }).finally(() => {
          this.ui.projectTable.isBusy = false
        })
    },
    processProject: function (project) {
      if (!Object.prototype.hasOwnProperty.call(project, 'can_write')) {
        project.can_write = []
      }
      if (!Object.prototype.hasOwnProperty.call(project, 'can_read')) {
        project.can_read = []
      }
      if (!Object.prototype.hasOwnProperty.call(project, 'created_at')) {
        project.created_at = 0
      }

      const currentUserId = this.$store.state.user.id

      // Misma política que los booleanos de permisos de más abajo: si el backend
      // los mandó, mandan ellos. /getProjects ya filtra por permisos
      // (isoq_server_py310, services/project_service.py:288-293), así que todo lo
      // que llega acá es visible para este usuario y recalcular la regla sólo
      // puede QUITAR proyectos que el servidor sí autorizó. Cuando las dos copias
      // divergen, el síntoma es "me compartieron un proyecto y no lo veo".
      //
      // El cálculo local queda para la caché offline, que puede tener proyectos
      // guardados antes de que el backend empezara a mandar estos campos.
      const hasBackendPermissions =
        typeof project.is_owner === 'boolean' &&
        typeof project.allow_to_write === 'boolean' &&
        typeof project.allow_to_read === 'boolean'

      const userHasAccess = hasBackendPermissions
        ? (project.is_owner || project.allow_to_write || project.allow_to_read)
        : (
          project.organization === this.$store.state.user.personal_organization ||
          project.can_read.includes(currentUserId) ||
          project.can_write.includes(currentUserId) ||
          // Fallback: verificar en can_read_users y can_write_users (Fase 2: backend devuelve objetos)
          (project.can_read_users && Array.isArray(project.can_read_users) && project.can_read_users.some(u => u.id === currentUserId)) ||
          (project.can_write_users && Array.isArray(project.can_write_users) && project.can_write_users.some(u => u.id === currentUserId))
        )

      if (userHasAccess) {
        if (!Object.prototype.hasOwnProperty.call(project, 'sharedToken')) {
          project.sharedToken = ''
        }
        if (project.sharedToken === null || project.sharedToken === undefined) {
          project.sharedToken = ''
        }
        if (!Object.prototype.hasOwnProperty.call(project, 'sharedTokenOnOff')) {
          if (Object.prototype.hasOwnProperty.call(project, 'sharedToken') && project.sharedToken !== null && project.sharedToken.length) {
            project.sharedTokenOnOff = true
          } else {
            project.sharedToken = ''
            project.sharedTokenOnOff = false
          }
        } else {
          if (Object.prototype.hasOwnProperty.call(project, 'sharedToken') && project.sharedToken !== null && project.sharedToken.length) {
            project.sharedTokenOnOff = true
          } else {
            project.sharedToken = ''
            project.sharedTokenOnOff = false
          }
        }
        if (!Object.prototype.hasOwnProperty.call(project, 'tmp_invite_emails')) {
          project.tmp_invite_emails = []
        }

        // Se reutiliza hasBackendPermissions, calculado arriba para el gate de
        // acceso: los dos responden la misma pregunta y deben responderla igual.
        if (!hasBackendPermissions) {
          project.is_owner = false
          project.allow_to_write = false
          project.allow_to_read = false
          if (project.organization === this.$store.state.user.personal_organization) {
            project.is_owner = true
            project.allow_to_write = true
            project.allow_to_read = true
          } else {
            if (project.can_read.includes(this.$store.state.user.id)) {
              project.allow_to_read = true
            }
            if (project.can_write.includes(this.$store.state.user.id)) {
              project.allow_to_write = true
            }
          }
        }
        return project
      } else {
        return {}
      }
    },
    cleanProject: function () {
      this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
    },
    setProcessing: function (status) {
      this.ui.projectTable.isBusy = status
    },

    openModalNewFindingTable: function () {
      this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
      this.canEditProject = true
      this.$refs.projectFormModal.show()
    },
    openModalEditProject: async function (project) {
      let _project = JSON.parse(JSON.stringify(project))
      if (!Object.prototype.hasOwnProperty.call(_project, 'license_type')) {
        _project.license_type = 'CC-BY-NC-ND'
      }
      if (Object.prototype.hasOwnProperty.call(_project, 'license_type') && _project.license_type === '') {
        _project.license_type = 'CC-BY-NC-ND'
      }

      this.buffer_project = _project

      let basePermission = (this.$store.state.user.personal_organization === this.$route.params.id) ||
        (project.allow_to_write)

      if (basePermission) {
        const res = await LockService.acquire(project.id)
        if (res.success) {
          this.canEditProject = true
          this.lockedByUser = null
        } else {
          this.canEditProject = false
          if (res.lockedBy) {
            this.lockedByUser = res.lockedBy
          }
        }
      } else {
        this.canEditProject = false
      }
      this.$refs.projectFormModal.show()
    },
    onProjectSaved: function () {
      this.getProjects()
    },

    modalRemoveProject: function (project) {
      this.buffer_project = JSON.parse(JSON.stringify(project))
      this.usersCanList(project.id)
      this.$refs.removeProjectModal.show()
    },
    onProjectRemoved: function () {
      this.getProjects()
    },

    openModalLeaveProject: function (project) {
      this.buffer_project = JSON.parse(JSON.stringify(project))
      this.$refs.leaveProjectModal.show()
    },
    onProjectLeft: function () {
      this.getProjects()
    },

    openCloneModal: function (project) {
      this.buffer_project = JSON.parse(JSON.stringify(project))
      this.ui.copy = {
        project: false,
        lists: false,
        references: false,
        findings: false,
        replaceReferences: false,
        copyOf: false,
        referencesTable: false,
        showWarning: null,
        disableCloneModalBtn: false
      }
      this.$refs.cloneProjectModal.show()
    },
    updateCopyState: function ({ key, value }) {
      this.ui.copy[key] = value
    },
    onCloneStarted: function () {
      this.ui.copy.showWarning = true
    },
    onProjectCloned: function () {
      this.getProjects()
    },

    usersCanList: function (id) {
      const currentUserId = this.$store.state.user.id
      let _project = this.buffer_project
      const userMap = new Map() // Deduplicación: user.id o user.email → user object
      const hasFallback = ref => !ref || !Array.isArray(ref) || ref.length === 0

      // Intenta usar can_read_users (con estado active/inactive)
      if (_project.can_read_users && Array.isArray(_project.can_read_users) && _project.can_read_users.length > 0) {
        for (let user of _project.can_read_users) {
          if (user.id === currentUserId) continue
          if (!userMap.has(user.id)) {
            user.user_can = 0
            user.project_id = _project.id
            user.state = user.active ? 'active' : 'inactive'
            userMap.set(user.id, user)
          }
        }
      } else if (hasFallback(_project.can_read_users) && _project.can_read && Array.isArray(_project.can_read) && _project.can_read.length > 0) {
        // Fallback: can_read contiene solo IDs, hacer API calls (compatibilidad retroactiva)
        const readPromises = _project.can_read
          .filter(userId => userId !== currentUserId)
          .map(userId => Api.get(`/users/${userId}`).then((response) => {
            const _user = response.data
            if (_user) {
              _user.user_can = 0
              _user.project_id = _project.id
              _user.state = _user.active ? 'active' : 'inactive'
              userMap.set(_user.id, _user)
            }
          }))
        Promise.all(readPromises).then(() => {
          this.buildUsersList(userMap)
        })
        return
      }

      // Intenta usar can_write_users (con estado active/inactive, sobrescribe read)
      if (_project.can_write_users && Array.isArray(_project.can_write_users) && _project.can_write_users.length > 0) {
        for (let user of _project.can_write_users) {
          if (user.id === currentUserId) continue
          user.user_can = 1
          user.project_id = _project.id
          user.state = user.active ? 'active' : 'inactive'
          userMap.set(user.id, user) // Sobrescribe can_read si existe
        }
      } else if (hasFallback(_project.can_write_users) && _project.can_write && Array.isArray(_project.can_write) && _project.can_write.length > 0) {
        // Fallback: can_write contiene solo IDs, hacer API calls
        const writePromises = _project.can_write
          .filter(userId => userId !== currentUserId)
          .map(userId => Api.get(`/users/${userId}`).then((response) => {
            const _user = response.data
            if (_user) {
              _user.user_can = 1
              _user.project_id = _project.id
              _user.state = _user.active ? 'active' : 'inactive'
              userMap.set(_user.id, _user) // Sobrescribe can_read si existe
            }
          }))
        Promise.all(writePromises).then(() => {
          this.buildUsersList(userMap)
        })
        return
      }

      // Nota: pendientes NO se incluyen en users_allowed
      // Se muestran en su propia sección "Pending Access"

      this.buildUsersList(userMap)
    },
    buildUsersList: function (userMap) {
      this.users_allowed = Array.from(userMap.values())
    },
    modalShareOptions: function (project, tabIndex = 0) {
      this.ui.tabIndex = tabIndex
      this.buffer_project = JSON.parse(JSON.stringify(project))
      if (Object.prototype.hasOwnProperty.call(this.buffer_project, 'sharedTo')) {
        this.buffer_project.sharedTo = ''
      }
      this.usersCanList(project.id)
      this.$refs.shareProjectModal.show()
    },
    onProjectShared: function (updatedProject) {
      const project = this.processProject(updatedProject)
      if (Object.keys(project).length) {
        // Merge inteligente con spread operator para forzar reactividad en Vue
        // Actualiza arrays de usuarios y limpia formulario de invitación
        this.buffer_project = {
          ...this.buffer_project,
          can_read_users: project.can_read_users || this.buffer_project.can_read_users,
          can_write_users: project.can_write_users || this.buffer_project.can_write_users,
          pending_users: project.pending_users || this.buffer_project.pending_users,
          invite_emails: project.invite_emails || this.buffer_project.invite_emails,
          sharedTo: '',
          tmp_invite_emails: []
        }

        this.updateProjectInList(project)
        this.usersCanList(project.id)
      }
    },
    onUserUnshared: function (projectId) {
      Api.get(`/isoqf_projects/${projectId}`).then((response) => {
        if (response.status === 200 && response.data) {
          // Backend devuelve objeto único con ruta /isoqf_projects/{id}
          const projectData = Array.isArray(response.data) ? response.data[0] : response.data
          const project = this.processProject(projectData)
          if (Object.keys(project).length) {
            // Merge inteligente: actualiza arrays de usuarios y limpia formulario
            this.buffer_project = {
              ...this.buffer_project,
              can_read_users: project.can_read_users || this.buffer_project.can_read_users,
              can_write_users: project.can_write_users || this.buffer_project.can_write_users,
              pending_users: project.pending_users || this.buffer_project.pending_users,
              invite_emails: project.invite_emails || this.buffer_project.invite_emails,
              sharedTo: '',
              tmp_invite_emails: []
            }
            this.updateProjectInList(project)
            this.usersCanList(projectId)
          }
        }
      }).catch((error) => {
        console.log('onUserUnshared - error:', error)
      })
    },
    onInvitedUnshared: function (response) {
      let _response = response
      _response.tmp_invite_emails = []
      this.buffer_project.invite_emails = _response.invite_emails
      this.updateProjectInList(_response)
    },
    onPermissionChanged: function (project) {
      this.buffer_project = project
      this.getProjects()
    },
    onSharedLinkGenerated: function (data) {
      const { projectId, sharedToken } = data
      this.buffer_project.sharedToken = sharedToken
      this.buffer_project.sharedTokenOnOff = true
      this.updateProjectInList(this.buffer_project)
    },
    updateProjectInList: function (project) {
      let _projects = []
      for (let p of this.projects) {
        if (p.id === project.id) {
          _projects.push(project)
        } else {
          _projects.push(p)
        }
      }
      this.projects = _projects
    }
  }
}
</script>

<style scoped>
div>>>.publish-status {
  text-transform: uppercase;
}

div>>>.link-project {
  color: #000;
}

div>>>table#organizations thead th:nth-child(2) {
  width: 60%;
}

div>>>table#organizations thead th:last-child {
  width: 30%;
}

div>>>table#organizations tbody td:last-child {
  text-align: right;
}

div>>>table#organizations tbody td a {
  text-decoration: underline;
}
</style>
