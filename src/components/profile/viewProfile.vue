<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="py-5">
        <h2>{{ $t("Profile") }}</h2>
      </b-container>
    </b-container>
    <b-container class="pt-5 pb-5">
      <p>Manage your information, download your data, configure your privacy settings, contact us, or delete your
        account.</p>
      <b-alert variant="success" :show="showAlert()" dismissible>{{ msg }}</b-alert>
      <b-card no-body class="p-3">
        <b-table-simple>
          <b-tbody>
            <b-tr>
              <b-td>
                <p>username</p>
              </b-td>
              <b-td>
                {{ username }}
              </b-td>
            </b-tr>
            <b-tr>
              <b-td>
                <p>name</p>
              </b-td>
              <b-td>
                {{ fullname }}
              </b-td>
            </b-tr>
            <b-tr>
              <b-td>
                <p>new password</p>
              </b-td>
              <b-td>
                <b-form-group description="8 characters at least" class="mb-0">
                  <b-form-input type="password" v-model="new_password"></b-form-input>
                </b-form-group>
              </b-td>
            </b-tr>
            <b-tr>
              <b-td>
                <p>repeat password</p>
              </b-td>
              <b-td>
                <b-form-group description="8 characters at least" class="mb-0">
                  <b-form-input type="password" v-model="new_password_repeat"></b-form-input>
                </b-form-group>
              </b-td>
            </b-tr>
          </b-tbody>
        </b-table-simple>

        <ul class="list-unstyled">
          <li>
            <b-checkbox v-model="newsletter">I agree to receive email communications about important service updates and
              news (optional)</b-checkbox>
          </li>
          <li>
            <b-checkbox v-model="improvement">I agree to the use of my data in aggregated and anonymized form to help
              improve the service (optional)</b-checkbox>
          </li>
        </ul>

        <div class="mt-3">
          <b-button variant="primary" @click="update" :disabled="isDisabled">Save</b-button>
        </div>
      </b-card>

      <b-card no-body class="mt-3 p-3">
        <h3>Manage profile data</h3>
        <div class="d-flex flex-row justify-content-between align-items-center">
          <div>
            <p class="m-0"><b>Download profile data:</b> Export all of the personal data and profile information in a
              JSON file</p>
          </div>
          <div>
            <b-button variant="outline-primary" @click="exportData" :disabled="isExporting">
              <b-spinner v-if="isExporting" small class="mr-2"></b-spinner>
              Export profile data
            </b-button>
          </div>
        </div>

        <b-alert show class="mt-3">
          <p>Note: You can download a copy of the profile data associated with your account.</p>
          <ul>
            <li>
              The export will include the personal information you provided (e.g., name, email) and records of your
              activity in the platform. Export all of the personal data and your profile information in a JSON file
            </li>
            <li>
              Data will be provided in a structured, commonly used, machine-readable format (JSON,CSV,XML).
            </li>
            <li>
              Exporting your profile does not delete it from our systems. You can request deletion separately.
            </li>
            <li>
              We may take up to 30 days to provide the full export, in line with our Privacy Policy.
            </li>
          </ul>

          <p>For full details, see our <router-link :to="{ name: 'PrivacyPolicy' }">Privacy Policy</router-link></p>
        </b-alert>


        <div class="d-flex flex-row justify-content-between align-items-center">
          <div>
            <p class="m-0">
              <b>Delete account:</b> Permanently delete your account, all personal data and all the iSoQ projects you
              have created, including all the data you have created and entered into those projects.
            </p>
          </div>
          <div>
            <b-button variant="outline-danger" @click="deleteAccount" :disabled="isDeletingAccount">
              <b-spinner v-if="isDeletingAccount" small class="mr-2"></b-spinner>
              Delete account
            </b-button>
          </div>
        </div>

        <b-alert show variant="warning" class="mt-3">
          <p>Important: Deleting your account is permanent and cannot be undone.</p>
          <ul>
            <li>
              Your personal data will be deleted from our active systems.
            </li>
            <li>
              All the projects you created in iSoQ and all the data created and entered into those projects will be a
              deleted permanently. If a project was created by you and shared with others, deleting your account will
              delete the project for all shared users. Before deleting your account, you may want to ask those you
              shared the project with to create a copy of the project in their Workspace so that they retain a copy of
              the shared project before you delete your account.
            </li>
            <li>
              Some records may be retained as required by law (e.g. legal compliance, or security logs).
            </li>
            <li>
              Data that has been anonymized or aggregated (not linked to you) may be kept for research or statistical
              purposes.
            </li>
            <li>
              If you change your mind, you must create a new account. Deleted accounts cannot be restored.
            </li>
          </ul>

          <p>For full details, see our <router-link :to="{ name: 'PrivacyPolicy' }">Privacy Policy</router-link> and
            <router-link :to="{ name: 'TermsAndConditions' }">Terms and conditions</router-link>
          </p>
        </b-alert>
      </b-card>

      <b-card no-body class="mt-3 p-3">
        <h3>Privacy preferences</h3>
        <div>
          <div>
            <p class="m-0">Your data is processed according to our Privacy Policy. This is required to provide the
              service</p>
          </div>
          <b-card class="p-3 mt-3">
            <b-alert :show="contactMsg.length > 0" :variant="contactMsgVariant" dismissible
              @dismissed="contactMsg = ''">{{ contactMsg }}</b-alert>
            <b-form-group id="fieldset-1" description="Subject" label="Subject" label-for="input-1"
              valid-feedback="Looks good!" invalid-feedback="Subject must be at least 10 characters long."
              :state="subjectState">
              <b-form-input id="input-1" v-model="subject" :state="subjectState" trim></b-form-input>
            </b-form-group>
            <b-form-group id="fieldset-2" description="Your message" label="Message" label-for="input-2"
              valid-feedback="Looks good!" invalid-feedback="Message must contain at least 5 words."
              :state="messageState">
              <b-form-textarea id="textarea" v-model="message" placeholder="Enter your message..." :state="messageState"
                rows="3" max-rows="6"></b-form-textarea>
            </b-form-group>
            <div class="mt-3">
              <b-button variant="primary" @click="sendContact" :disabled="!isContactFormValid || isSendingContact">
                <b-spinner v-if="isSendingContact" small class="mr-2"></b-spinner>
                Send
              </b-button>
            </div>
          </b-card>
        </div>

      </b-card>
    </b-container>

    <b-modal id="modal-export-data" title="Export Profile Data" @hidden="resetExportModal" no-close-on-backdrop
      hide-footer>
      <p>Please enter your password to confirm and download your profile data:</p>

      <b-form-group label="Password" label-for="export-password-input" :invalid-feedback="exportError"
        :state="exportError ? false : null">
        <b-form-input id="export-password-input" type="password" v-model="exportPassword"
          @keyup.enter="confirmExportData" :state="exportError ? false : null" required></b-form-input>
      </b-form-group>

      <div class="d-flex flex-row justify-content-end mt-4">
        <b-button variant="secondary" @click="$bvModal.hide('modal-export-data')" class="mr-2">
          Cancel
        </b-button>
        <b-button variant="primary" @click="confirmExportData" :disabled="isExporting">
          <b-spinner v-if="isExporting" small class="mr-2"></b-spinner>
          Export data
        </b-button>
      </div>
    </b-modal>

    <b-modal id="modal-delete-account" size="xl" title="Delete Account" @hidden="resetDeleteModal" no-close-on-backdrop
      hide-footer>
      <p class="text-danger">
        <b>Are you sure you want to permanently delete your account? This action cannot be undone.</b>
      </p>

      <p>
        Deleting your account will delete all of the projects you have created in iSoQ.
        If you have shared projects that you created, these will appear below.
        You will first need to assign a new owner to these shared projects before deleting your account.
      </p>

      <div v-if="isLoadingSharedProjects" class="text-center py-3">
        <b-spinner label="Loading projects..."></b-spinner>
        <p>Checking shared projects...</p>
      </div>

      <div v-else-if="sharedProjects.length > 0">
        <p>You are the owner of shared projects. You must assign a new owner to each shared project before deleting your
          account.</p>
        <b-table-simple striped hover small responsive>
          <b-thead head-variant="light">
            <b-tr>
              <b-th>Project Name</b-th>
              <b-th>New Owner</b-th>
            </b-tr>
          </b-thead>
          <b-tbody>
            <b-tr v-for="project in sharedProjects" :key="project.id">
              <b-td>{{ project.name }}</b-td>
              <b-td>
                <b-form-select v-model="projectsNewOwners[project.id]" :options="project.candidates">
                  <template #first>
                    <b-form-select-option :value="null" disabled>-- Select a new owner --</b-form-select-option>
                  </template>
                </b-form-select>
              </b-td>
            </b-tr>
          </b-tbody>
        </b-table-simple>

        <p class="text-muted">
          * Users with an asterisk (*) only have read access to the project. If you select a user with read access as
          the new owner, they will be able to edit the project.
        </p>
      </div>

      <p class="mt-3">Please enter your password to confirm account deletion:</p>

      <b-form-group label="Password" label-for="delete-password-input" :invalid-feedback="deleteError"
        :state="deleteError ? false : null">
        <b-form-input id="delete-password-input" type="password" v-model="deletePassword"
          @keyup.enter="confirmDeleteAccount" :state="deleteError ? false : null" required></b-form-input>
      </b-form-group>

      <div class="d-flex flex-row justify-content-end mt-4">
        <b-button variant="secondary" @click="$bvModal.hide('modal-delete-account')" class="mr-2">
          Cancel
        </b-button>
        <b-button variant="danger" @click="confirmDeleteAccount"
          :disabled="isDeletingAccount || !deletePassword || !allProjectsHaveNewOwner">
          <b-spinner v-if="isDeletingAccount" small class="mr-2"></b-spinner>
          Delete account permanently
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import axios from 'axios'
import { RouterLink } from 'vue-router'

export default {
  name: 'viewProfile',
  data() {
    return {
      new_password: null,
      new_password_repeat: null,
      msg: '',
      isDisabled: true,
      newsletter: false,
      improvement: false,
      initial_newsletter: false,
      initial_improvement: false,
      subject: '',
      message: '',
      isSendingContact: false,
      contactMsg: '',
      contactMsgVariant: 'success',
      isExporting: false,
      isDeletingAccount: false,
      deletePassword: '',
      deleteError: '',
      exportPassword: '',
      exportError: '',
      sharedProjects: [],
      projectsNewOwners: {},
      isLoadingSharedProjects: false
    }
  },
  mounted() {
    this.initCheckboxes()
  },
  computed: {
    username: function () {
      return this.$store.state.user.name
    },
    fullname: function () {
      return this.$store.state.user.first_name + ' ' + this.$store.state.user.last_name
    },
    subjectState: function () {
      if (this.subject.length === 0) return null
      return this.subject.trim().length >= 10
    },
    messageState: function () {
      if (this.message.length === 0) return null
      const wordCount = this.message.trim().split(/\s+/).filter(word => word.length > 0).length
      return wordCount >= 5
    },
    isContactFormValid: function () {
      return this.subjectState === true && this.messageState === true
    },
    allProjectsHaveNewOwner: function () {
      if (this.sharedProjects.length === 0) return true
      return this.sharedProjects.every(p => this.projectsNewOwners[p.id] !== null && this.projectsNewOwners[p.id] !== undefined)
    }
  },
  watch: {
    new_password() {
      this.checkDisabled()
    },
    new_password_repeat() {
      this.checkDisabled()
    },
    newsletter() {
      this.checkDisabled()
    },
    improvement() {
      this.checkDisabled()
    },
    msg() {
      if (this.msg.length) {
        this.showAlert()
      }
    }
  },
  methods: {
    initCheckboxes: function () {
      const user = this.$store.state.user
      const trueValues = [true, 'true', 'True', 1, '1']

      if (user) {
        this.newsletter = trueValues.includes(user.newsletter)
        this.improvement = trueValues.includes(user.improvement)
        this.initial_newsletter = this.newsletter
        this.initial_improvement = this.improvement
      }
    },
    update: async function () {
      this.msg = ''
      this.isDisabled = true
      const promises = []

      const hasPasswordInput = this.new_password !== null && this.new_password !== ''
      const validPassword = hasPasswordInput && this.new_password === this.new_password_repeat && this.new_password.length >= 8

      const checkboxesChanged = this.newsletter !== this.initial_newsletter || this.improvement !== this.initial_improvement

      try {
        if (validPassword) {
          const passParams = {
            user_id: this.$store.state.user.id,
            new_password: this.new_password
          }
          promises.push(axios.post(`/users/change_password`, passParams))
        }

        if (checkboxesChanged) {
          const infoParams = {
            user_id: this.$store.state.user.id,
            newsletter: this.newsletter,
            improvement: this.improvement
          }
          promises.push(axios.post(`/users/update_info`, infoParams))
        }

        if (promises.length > 0) {
          await Promise.all(promises)

          let successMsgs = []
          if (validPassword) {
            successMsgs.push('password')
            this.new_password = null
            this.new_password_repeat = null
          }

          if (checkboxesChanged) {
            successMsgs.push('privacy settings')
            this.initial_newsletter = this.newsletter
            this.initial_improvement = this.improvement
            this.$store.state.user.newsletter = this.newsletter
            this.$store.state.user.improvement = this.improvement
          }

          this.msg = `Your ${successMsgs.join(' and ')} ${successMsgs.length > 1 ? 'have' : 'has'} been updated!`
        }
      } catch (error) {
        console.error(error)
        this.msg = 'An error occurred while updating your profile.'
      } finally {
        this.checkDisabled()
      }
    },
    exportData: function () {
      this.$bvModal.show('modal-export-data')
    },
    confirmExportData: async function () {
      this.exportError = ''
      if (!this.exportPassword) {
        this.exportError = 'Password is required'
        return
      }

      this.isExporting = true
      try {
        const response = await axios.post('/users/get_full_data', {
          user_id: this.$store.state.user.id,
          password: this.exportPassword
        }, {
          responseType: 'blob'
        })

        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'profile_data.zip')
        document.body.appendChild(link)
        link.click()

        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        this.$bvModal.hide('modal-export-data')
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          this.exportError = error.response.data.message
        } else {
          this.exportError = 'An error occurred while exporting your data.'
        }
        console.error('Error exporting data:', error)
      } finally {
        this.isExporting = false
      }
    },
    resetExportModal: function () {
      this.exportPassword = ''
      this.exportError = ''
    },
    sendContact: async function () {
      if (!this.isContactFormValid) return

      this.isSendingContact = true
      this.contactMsg = ''

      try {
        await axios.post('/users/privacy_contact', {
          subject: this.subject,
          message: this.message
        })
        this.contactMsg = 'Your message has been sent successfully!'
        this.contactMsgVariant = 'success'
        this.subject = ''
        this.message = ''
      } catch (error) {
        console.error(error)
        this.contactMsg = 'Failed to send message. Please try again.'
        this.contactMsgVariant = 'danger'
      } finally {
        this.isSendingContact = false
      }
    },
    deleteAccount: async function () {
      this.isLoadingSharedProjects = true
      this.$bvModal.show('modal-delete-account')
      try {
        const response = await axios.get('/api/getProjects')
        const allProjects = response.data
        const myPersonalOrg = this.$store.state.user.personal_organization
        const myUserId = this.$store.state.user.id

        // Find projects I own and are shared
        const sharedOwnedProjects = allProjects.filter(p => {
          const isOwner = p.organization === myPersonalOrg
          const hasCollaborators = (p.can_read && p.can_read.filter(uid => uid !== myUserId).length > 0) ||
            (p.can_write && p.can_write.filter(uid => uid !== myUserId).length > 0)
          return isOwner && hasCollaborators
        })

        const projectsToTransfer = []
        for (const project of sharedOwnedProjects) {
          const writeCandidatesIds = (project.can_write || []).filter(uid => uid !== myUserId)
          const readCandidatesIds = (project.can_read || []).filter(uid => uid !== myUserId && !writeCandidatesIds.includes(uid))

          const allCandidatesIds = [...writeCandidatesIds, ...readCandidatesIds]

          const candidates = []
          for (const uid of allCandidatesIds) {
            const userRes = await axios.get(`/users/${uid}`)
            if (userRes.data && userRes.data.status) {
              let text = (userRes.data.first_name || '') + ' ' + (userRes.data.last_name || '') + ' (' + userRes.data.username + ')'
              if (readCandidatesIds.includes(uid)) {
                text += ' *'
              }
              candidates.push({
                value: uid,
                text: text
              })
            }
          }

          if (candidates.length > 0) {
            projectsToTransfer.push({
              id: project.id,
              name: project.name,
              candidates: candidates
            })
            this.$set(this.projectsNewOwners, project.id, null)
          }
        }
        this.sharedProjects = projectsToTransfer
      } catch (error) {
        console.error('Error fetching shared projects:', error)
      } finally {
        this.isLoadingSharedProjects = false
      }
    },
    confirmDeleteAccount: async function () {
      this.deleteError = ''
      if (!this.deletePassword) {
        this.deleteError = 'Password is required'
        return
      }

      if (!this.allProjectsHaveNewOwner) {
        this.deleteError = 'All shared projects must have a new owner assigned.'
        return
      }

      this.isDeletingAccount = true
      try {
        const response = await axios.delete('/users/delete_account', {
          data: {
            password: this.deletePassword,
            ownership_transfers: this.projectsNewOwners
          }
        })
        if (response.data && response.data.result === 'success') {
          this.$bvModal.hide('modal-delete-account')
          window.location.href = '/'
        } else {
          this.deleteError = response.data.message || 'Failed to delete account. Please try again.'
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          this.deleteError = error.response.data.message
        } else {
          this.deleteError = 'An error occurred while deleting your account.'
        }
        console.error(error)
      } finally {
        this.isDeletingAccount = false
      }
    },
    resetDeleteModal: function () {
      this.deletePassword = ''
      this.deleteError = ''
      this.sharedProjects = []
      this.projectsNewOwners = {}
      this.isLoadingSharedProjects = false
    },
    showAlert: function () {
      if (this.msg.length) {
        return true
      }
      return false
    },
    checkDisabled: function () {
      const checkboxesChanged = this.newsletter !== this.initial_newsletter || this.improvement !== this.initial_improvement

      const hasPasswordInput = this.new_password !== null && this.new_password !== ''

      if (hasPasswordInput) {
        const validPassword = this.new_password === this.new_password_repeat && this.new_password.length >= 8
        if (!validPassword) {
          this.isDisabled = true
          return
        }
      }

      if (checkboxesChanged || (hasPasswordInput && this.new_password === this.new_password_repeat && this.new_password.length >= 8)) {
        this.isDisabled = false
      } else {
        this.isDisabled = true
      }
    }
  }
}
</script>

<style></style>
