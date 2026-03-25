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
        <b-row align-h="end" v-if="$store.state.user.personal_organization === this.$route.params.id">
          <b-col cols="12" class="text-right">
            <b-button v-b-tooltip.hover
              :title="(isOnline) ? $t('project.create_new_isoq') : $t('offline.action_disabled')" variant="success"
              :disabled="!isOnline" @click="openModalNewFindingTable">{{ $t("project.add_new") }}</b-button>
          </b-col>
        </b-row>
        <b-row class="mt-3" v-if="projects.length > 10">
          <b-col cols="12" md="6" class="ml-auto">
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
        </b-row>
        <b-row class="mt-3">
          <b-col cols="12">
            <b-table id="organizations" responsive striped hover head-variant="light" :busy="ui.projectTable.isBusy"
              :fields="ui.projectTable.fields" :items="filteredProjects" sort-by="created_at" :sort-desc="true">
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
                  <b-badge v-if="data.item.use_camelot" variant="info" class="ml-2" v-b-tooltip.hover
                    title="This project uses CAMELOT">
                    C
                  </b-badge>
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
        @permission-changed="onPermissionChanged" />

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

export default {
  name: 'viewOrganization',
  components: {
    ProjectFormModal,
    RemoveProjectModal,
    ShareProjectModal,
    CloneProjectModal,
    LeaveProjectModal
  },
  data() {
    return {
      ui: {
        projectTable: {
          fields: [
            { key: 'private', label: this.$t('common.privacy') },
            { key: 'name', label: this.$t('common.title') },
            { key: 'actions', label: '' }
          ],
          isBusy: true
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
      lockedByUser: null
    }
  },
  computed: {
    filteredProjects() {
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
  created() {
    this.buffer_project = JSON.parse(JSON.stringify(this.tmp_buffer_project))
  },
  mounted() {
    this.getProjects()
  },
  methods: {
    getProjects: function () {
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
      if (
        project.organization === this.$store.state.user.personal_organization ||
        project.can_read.includes(this.$store.state.user.id) ||
        project.can_write.includes(this.$store.state.user.id)
      ) {
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
        project.is_owner = false
        project.allow_to_write = false
        project.allow_to_read = false
        if (project.organization === this.$store.state.user.personal_organization) {
          project.is_owner = true
          project.allow_to_write = true
          project.allow_to_read = true
        } else {
          if (project.organization !== this.$store.state.user.personal_organization) {
            project.is_owner = false
          }
          if (Object.prototype.hasOwnProperty.call(project, 'can_read')) {
            if (project.can_read.includes(this.$store.state.user.id)) {
              project.allow_to_read = true
            }
          }
          if (Object.prototype.hasOwnProperty.call(project, 'can_write')) {
            if (project.can_write.includes(this.$store.state.user.id)) {
              project.allow_to_write = true
            }
          } else {
            project.can_write = []
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
      this.users_allowed = []
      let _project = this.buffer_project
      if (Object.prototype.hasOwnProperty.call(_project, 'can_read')) {
        for (let user of _project.can_read) {
          Api.get(`/users/${user}`).then((response) => {
            const _user = response.data
            if (_user.status) {
              _user.user_can = 0
              _user.project_id = _project.id
              this.users_allowed.push(_user)
            }
          })
        }
      }
      if (Object.prototype.hasOwnProperty.call(_project, 'can_write')) {
        for (let user of _project.can_write) {
          Api.get(`/users/${user}`).then((response) => {
            const _user = response.data
            if (_user.status) {
              _user.user_can = 1
              _user.project_id = _project.id
              this.users_allowed.push(_user)
            }
          })
        }
      }
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
        this.buffer_project = project
        this.updateProjectInList(project)
        this.usersCanList(project.id)
      }
    },
    onUserUnshared: function (projectId) {
      Api.get('/isoqf_projects', { id: projectId }).then((response) => {
        if (response.status === 200 && response.data && response.data.length) {
          const project = this.processProject(response.data[0])
          if (Object.keys(project).length) {
            this.buffer_project = project
            this.updateProjectInList(project)
            this.usersCanList(project.id)
          }
        }
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
