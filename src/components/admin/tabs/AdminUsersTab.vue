<template>
  <div>
    <b-row class="mb-3 align-items-center">
      <b-col md="6">
        <b-form-input
          v-model="filter"
          :placeholder="$t('admin.search_placeholder')"
          debounce="300"
        />
      </b-col>
      <b-col md="3" offset-md="3" class="d-flex align-items-center justify-content-end">
        <label class="mb-0 mr-2 text-nowrap">{{ $t('admin.per_page') }}</label>
        <b-form-select
          v-model="perPage"
          :options="perPageOptions"
          size="sm"
          style="width: auto"
          @change="onPerPageChange"
        />
      </b-col>
    </b-row>

    <b-alert variant="danger" :show="!!loadError">{{ loadError }}</b-alert>

    <b-table
      :items="filteredUsers"
      :fields="fields"
      :busy="isBusy"
      responsive
      striped
      hover
      show-empty
      :empty-text="$t('admin.no_users')"
    >
      <template #table-busy>
        <div class="text-center my-3">
          <b-spinner />
        </div>
      </template>

      <template #cell(active)="{ item }">
        <b-badge :variant="item.active ? 'success' : 'secondary'">
          {{ item.active ? $t('admin.active') : $t('admin.inactive') }}
        </b-badge>
      </template>

      <template #cell(actions)="{ item }">
        <b-dropdown size="sm" variant="outline-secondary" right boundary="window">
          <b-dropdown-item v-if="isSupport" @click="openImpersonate(item)">
            <font-awesome-icon icon="sign-out-alt" class="mr-1" />
            {{ $t('admin.impersonate') }}
          </b-dropdown-item>
          <b-dropdown-item @click="openEdit(item)">
            <font-awesome-icon icon="edit" class="mr-1" />
            {{ $t('admin.edit_user') }}
          </b-dropdown-item>
          <b-dropdown-item v-if="!item.active" @click="openActivate(item)">
            <font-awesome-icon icon="check-circle" class="mr-1" />
            {{ $t('admin.reactivate') }}
          </b-dropdown-item>
          <b-dropdown-item v-if="item.active" @click="openDeactivate(item)">
            <font-awesome-icon icon="eye-slash" class="mr-1" />
            {{ $t('admin.deactivate') }}
          </b-dropdown-item>
          <b-dropdown-item @click="openForceLogout(item)">
            <font-awesome-icon icon="sign-out-alt" class="mr-1" />
            {{ $t('admin.force_logout') }}
          </b-dropdown-item>
          <b-dropdown-divider v-if="isSuperAdmin" />
          <b-dropdown-item v-if="isSuperAdmin" @click="openManageFlags(item)">
            <font-awesome-icon icon="key" class="mr-1" />
            {{ $t('admin.manage_flags') }}
          </b-dropdown-item>
          <b-dropdown-item v-if="isSuperAdmin" variant="danger" @click="openDelete(item)">
            <font-awesome-icon icon="trash" class="mr-1" />
            {{ $t('admin.delete') }}
          </b-dropdown-item>
        </b-dropdown>
      </template>
    </b-table>

    <b-row class="align-items-center mt-2">
      <b-col class="text-muted small">
        {{ pageInfo }}
      </b-col>
      <b-col>
        <b-pagination
          :value="currentPage"
          :total-rows="total"
          :per-page="perPage"
          :disabled="isBusy"
          align="right"
          class="mb-0"
          @change="goToPage"
        />
      </b-col>
    </b-row>

    <!-- Impersonate confirm modal -->
    <b-modal
      id="modal-impersonate"
      :title="$t('admin.impersonate_confirm_title')"
      ok-variant="warning"
      :ok-title="$t('admin.impersonate')"
      cancel-variant="outline-secondary"
      :ok-disabled="isImpersonating"
      @ok.prevent="doImpersonate"
      @hidden="impersonateError = ''"
    >
      <p v-if="selectedUser">
        {{ $t('admin.impersonate_confirm_body', { name: fullName(selectedUser), email: selectedUser.username }) }}
      </p>
      <b-alert variant="danger" :show="!!impersonateError">{{ impersonateError }}</b-alert>
      <b-spinner v-if="isImpersonating" small />
    </b-modal>

    <activate-user-modal
      ref="activateModal"
      :user="selectedUser"
      @activated="onActivated"
    />

    <deactivate-user-modal
      ref="deactivateModal"
      :user="selectedUser"
      @deactivated="onDeactivated"
    />

    <edit-user-modal
      ref="editModal"
      :user="selectedUser"
      @updated="onUpdated"
    />

    <manage-flags-modal
      ref="flagsModal"
      :user="selectedUser"
      :current-user-id="currentUserId"
      @flags-updated="onFlagsUpdated"
    />

    <force-logout-modal
      ref="forceLogoutModal"
      :user="selectedUser"
    />

    <delete-user-modal
      ref="deleteModal"
      :user="selectedUser"
      :all-users="users"
      @deleted="onDeleted"
    />
  </div>
</template>

<script>
import Api from '@/utils/Api'
import ActivateUserModal from '../modals/ActivateUserModal'
import DeactivateUserModal from '../modals/DeactivateUserModal'
import EditUserModal from '../modals/EditUserModal'
import ManageFlagsModal from '../modals/ManageFlagsModal'
import ForceLogoutModal from '../modals/ForceLogoutModal'
import DeleteUserModal from '../modals/DeleteUserModal'
import preserveScrollMixin from '@/mixins/preserveScrollMixin'

export default {
  mixins: [preserveScrollMixin],
  components: {
    ActivateUserModal,
    DeactivateUserModal,
    EditUserModal,
    ManageFlagsModal,
    ForceLogoutModal,
    DeleteUserModal
  },
  data () {
    return {
      users: [],
      total: 0,
      isBusy: false,
      loadError: '',
      filter: '',
      currentPage: 1,
      perPage: 50,
      perPageOptions: [10, 25, 50, 100],
      selectedUser: null,
      isImpersonating: false,
      impersonateError: ''
    }
  },
  computed: {
    isSupport () {
      return !!this.$store.state.user.support
    },
    isSuperAdmin () {
      return !!this.$store.state.user.superadmin
    },
    currentUserId () {
      return this.$store.state.user.id || null
    },
    fields () {
      return [
        { key: 'full_name', label: this.$t('admin.col_name'), sortable: true },
        { key: 'username', label: this.$t('admin.col_email'), sortable: true },
        { key: 'active', label: this.$t('admin.col_active'), sortable: true },
        { key: 'owned_projects', label: this.$t('admin.col_owned_projects'), sortable: true },
        { key: 'shared_projects', label: this.$t('admin.col_shared_projects'), sortable: true },
        { key: 'actions', label: this.$t('admin.col_actions') }
      ]
    },
    processedUsers () {
      return this.users.map(u => ({
        ...u,
        full_name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username
      }))
    },
    filteredUsers () {
      const q = this.filter.toLowerCase().trim()
      if (!q) return this.processedUsers
      return this.processedUsers.filter(u =>
        u.full_name.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q))
      )
    },
    pageInfo () {
      if (this.total === 0) return ''
      const from = (this.currentPage - 1) * this.perPage + 1
      const to = Math.min(from + this.users.length - 1, this.total)
      return this.$t('admin.page_info', { from, to, total: this.total })
    }
  },
  created () {
    this.loadUsers(1)
  },
  methods: {
    async loadUsers (page) {
      // El slot `table-busy` colapsa el `tbody`: el documento se acorta y el navegador
      // clampea la posición. Acá pasan la paginación, la búsqueda y cada acción sobre
      // un usuario, así que basta con sostenerla una vez.
      this.holdScrollPosition()
      this.isBusy = true
      this.loadError = ''
      const offset = (page - 1) * this.perPage
      try {
        const response = await Api.get('/admin/users', { _limit: this.perPage, _offset: offset })
        const { users, total } = response.data
        this.users = users || []
        this.total = total || 0
        this.currentPage = page
      } catch (err) {
        this.loadError = this.$t('admin.load_error')
      } finally {
        this.isBusy = false
      }
    },
    goToPage (page) {
      this.loadUsers(page)
    },
    onPerPageChange () {
      this.loadUsers(1)
    },
    fullName (user) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
    },
    openImpersonate (user) {
      this.selectedUser = user
      this.impersonateError = ''
      this.$bvModal.show('modal-impersonate')
    },
    async doImpersonate () {
      this.isImpersonating = true
      this.impersonateError = ''
      try {
        const data = await this.$store.dispatch('forcedLogin', this.selectedUser.id)
        this.$bvModal.hide('modal-impersonate')
        this.$router.push({ name: 'viewOrganization', params: { id: data.personal_organization } })
      } catch (err) {
        const status = err.response && err.response.status
        if (status === 403) {
          this.impersonateError = this.$t('admin.error_self_action')
        } else {
          this.impersonateError = this.$t('notifications.error')
        }
      } finally {
        this.isImpersonating = false
      }
    },
    openActivate (user) {
      this.selectedUser = user
      this.$nextTick(() => {
        this.$refs.activateModal.show()
      })
    },
    openDeactivate (user) {
      this.selectedUser = user
      this.$refs.deactivateModal.show()
    },
    openEdit (user) {
      this.selectedUser = user
      this.$nextTick(() => {
        this.$refs.editModal.show()
      })
    },
    openManageFlags (user) {
      this.selectedUser = user
      this.$nextTick(() => {
        this.$refs.flagsModal.show()
      })
    },
    openForceLogout (user) {
      this.selectedUser = user
      this.$nextTick(() => {
        this.$refs.forceLogoutModal.show()
      })
    },
    openDelete (user) {
      this.selectedUser = user
      this.$nextTick(() => {
        this.$refs.deleteModal.show()
      })
    },
    onActivated (userId) {
      const user = this.users.find(u => u.id === userId)
      if (user) this.$set(user, 'active', true)
    },
    onDeactivated (userId) {
      const user = this.users.find(u => u.id === userId)
      if (user) this.$set(user, 'active', false)
    },
    onUpdated (userId, changes) {
      const user = this.users.find(u => u.id === userId)
      if (user) Object.assign(user, changes)
    },
    onFlagsUpdated (userId, newFlags) {
      const user = this.users.find(u => u.id === userId)
      if (user) Object.assign(user, newFlags)
    },
    onDeleted (userId) {
      this.users = this.users.filter(u => u.id !== userId)
      this.total = Math.max(0, this.total - 1)
    }
  }
}
</script>
