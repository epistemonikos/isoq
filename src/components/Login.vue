<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-4" cols="12" md="7" offset-md="3">
          <b-form @submit.prevent="login">
            <b-card
              header="Login">
                <b-alert
                  :show="$store.state.status === 'error'"
                  variant="warning"
                  dismissible
                  @dismissed="changeStatus">
                    The user or password are wrong or doesn't exist. try again.
                </b-alert>
                <b-form-group
                  id="input_group_email"
                  label="Email:"
                  label-for="input_email">
                  <b-form-input
                    id="input_email"
                    v-model="username"
                    type="email"
                    required></b-form-input>
                </b-form-group>
                <b-form-group
                  id="input_group_password"
                  label="Password:"
                  label-for="input_password">
                  <b-form-input
                    id="input_password"
                    v-model="password"
                    type="password"
                    required></b-form-input>
                </b-form-group>
                <p>Would you like to subscribe to the GRADE-CERQual mailing list? <br><b>Yes! <a href="https://docs.google.com/forms/d/e/1FAIpQLSctGa_fZ0A9XclGWcT2PHxP_I2FD0k4ylOeW93G8w18VRP11g/viewform" target="_blank">I want to subscribe!</a></b></p>
                <b-card-text class="text-center text-forgot-create">
                  <router-link :to="{name: 'ForgotPassword'}">forgot your password?</router-link> | <router-link :to="{name: 'CreateAccount'}">new account</router-link>
                </b-card-text>
                <div slot="footer" class="text-right">
                  <b-button type="submit" variant="outline-primary">Login</b-button>
                </div>
            </b-card>
          </b-form>
        </b-col>
      </b-row>
    </b-container>

    <b-modal
      id="modal-terms-acceptance"
      title="Updated Terms and Conditions"
      no-close-on-backdrop
      no-close-on-esc
      hide-footer
      size="lg">

      <p>
        We have updated our Terms and Conditions and Privacy Policy.
        You must accept them to continue using iSoQ.
        You can review them
        <router-link :to="{name: 'PrivacyAndTerms', query: {tab: 'terms'}}" target="_blank">here</router-link>.
      </p>

      <b-form-checkbox v-model="termsAccepted" class="mb-2">
        I have read and accept the
        <router-link :to="{name: 'PrivacyAndTerms', query: {tab: 'terms'}}" target="_blank">Terms and Conditions</router-link>
        and
        <router-link :to="{name: 'PrivacyAndTerms', query: {tab: 'privacy'}}" target="_blank">Privacy Policy</router-link>.
      </b-form-checkbox>

      <b-form-checkbox v-model="newsletterAccepted" class="mb-4">
        I would like to receive emails with news and updates. (optional)
      </b-form-checkbox>

      <div v-if="showDownloadSection" class="mb-3 p-3 border rounded">
        <p class="mb-2"><strong>Enter your password to download your data:</strong></p>
        <b-form-group :invalid-feedback="downloadError" :state="downloadError ? false : null">
          <b-form-input
            type="password"
            v-model="downloadPassword"
            placeholder="Password"
            :state="downloadError ? false : null"
            @keyup.enter="downloadData" />
        </b-form-group>
        <b-button variant="outline-secondary" size="sm" @click="downloadData" :disabled="isDownloading">
          <b-spinner v-if="isDownloading" small class="mr-1"></b-spinner>
          Download my data
        </b-button>
      </div>

      <div class="d-flex justify-content-between align-items-center mt-3">
        <b-button variant="link" size="sm" @click="showDownloadSection = !showDownloadSection">
          Download my information
        </b-button>
        <div>
          <b-button variant="secondary" @click="declineTerms" class="mr-2">
            Cancel
          </b-button>
          <b-button variant="primary" @click="acceptTerms" :disabled="!termsAccepted || isAccepting">
            <b-spinner v-if="isAccepting" small class="mr-1"></b-spinner>
            Accept
          </b-button>
        </div>
      </div>
    </b-modal>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data () {
    return {
      username: null,
      password: null,
      termsAccepted: false,
      newsletterAccepted: false,
      pendingRoute: null,
      isAccepting: false,
      showDownloadSection: false,
      downloadPassword: '',
      downloadError: '',
      isDownloading: false
    }
  },
  methods: {
    login () {
      let username = this.username
      let password = this.password
      this.$store
        .dispatch('login', {username, password})
        .then((response) => {
          const personalInfo = response.data
          const basePath = `/workspace/${personalInfo.personal_organization}`
          const destination = this.$route.query.redirect ? this.$route.query.redirect : basePath

          if (!personalInfo.terms_accepted) {
            this.pendingRoute = destination
            this.$bvModal.show('modal-terms-acceptance')
          } else {
            this.$router.push({ path: destination })
          }
        })
        .catch((error) => console.log(error))
    },
    changeStatus () {
      this.$store.dispatch('changeStatus')
    },
    async acceptTerms () {
      this.isAccepting = true
      try {
        await axios.patch('/users/update_my_profile', {
          terms_accepted: true,
          newsletter: this.newsletterAccepted
        })
        this.$store.dispatch('updateUser', { terms_accepted: true, newsletter: this.newsletterAccepted })
        this.$bvModal.hide('modal-terms-acceptance')
        this.$router.push({ path: this.pendingRoute })
      } catch (e) {
        console.error('Error accepting terms:', e)
      } finally {
        this.isAccepting = false
      }
    },
    async declineTerms () {
      await this.$store.dispatch('logout')
      this.$bvModal.hide('modal-terms-acceptance')
      if (this.$route.name !== 'Login') {
        this.$router.push({ name: 'Login' })
      }
    },
    async downloadData () {
      this.downloadError = ''
      if (!this.downloadPassword) {
        this.downloadError = 'Password is required'
        return
      }
      this.isDownloading = true
      try {
        const response = await axios.post('/users/get_full_data', {
          user_id: this.$store.state.user.id,
          password: this.downloadPassword
        }, { responseType: 'blob' })

        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'profile_data.zip')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        this.showDownloadSection = false
        this.downloadPassword = ''
      } catch (error) {
        this.downloadError = error.response?.data?.message || 'Error downloading data.'
      } finally {
        this.isDownloading = false
      }
    }
  }
}
</script>

<style>
.card-header {
  text-align: center;
  text-transform: uppercase;
  font-weight: bold;
}
.text-forgot-create {
  font-size: .8rem;
}
</style>
