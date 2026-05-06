<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-4" cols="12" md="7" offset-md="3">
          <b-form @submit.prevent="login">
            <b-card
              :header="$t('common.login')">
                <b-alert
                  :show="$store.state.status === 'error' && !emailNotVerified && !passwordCompromised"
                  variant="warning"
                  dismissible
                  @dismissed="changeStatus">
                    {{ $t('auth.login_error') }}
                </b-alert>
                <b-alert
                  :show="emailNotVerified"
                  variant="warning">
                  {{ $t('account.email_not_verified') }}
                  <div class="mt-2">
                    <b-button
                      variant="outline-warning"
                      size="sm"
                      :disabled="isResendingVerification"
                      @click="resendVerification">
                      <b-spinner small v-if="isResendingVerification" class="mr-1"></b-spinner>
                      {{ $t('account.resend_verification_btn') }}
                    </b-button>
                    <span v-if="resendVerificationSent" class="ml-2">{{ $t('account.resend_email_sent') }}</span>
                  </div>
                </b-alert>
                <b-alert
                  :show="passwordCompromised"
                  variant="danger">
                  {{ $t('auth.password_compromised') }}
                </b-alert>
                <b-form-group
                  id="input_group_email"
                  :label="$t('auth.email')"
                  label-for="input_email">
                  <b-form-input
                    id="input_email"
                    v-model="username"
                    type="email"
                    required></b-form-input>
                </b-form-group>
                <b-form-group
                  id="input_group_password"
                  :label="$t('auth.password')"
                  label-for="input_password">
                  <b-form-input
                    id="input_password"
                    v-model="password"
                    type="password"
                    required></b-form-input>
                </b-form-group>
                <p>{{ $t('auth.subscribe_text') }} <br><b><a href="https://docs.google.com/forms/d/e/1FAIpQLSctGa_fZ0A9XclGWcT2PHxP_I2FD0k4ylOeW93G8w18VRP11g/viewform" target="_blank">{{ $t('auth.subscribe_link') }}</a></b></p>
                <b-card-text class="text-center text-forgot-create">
                  <router-link :to="{name: 'ForgotPassword'}">{{ $t('auth.forgot_password') }}</router-link> | <router-link :to="{name: 'CreateAccount'}">{{ $t('auth.new_account') }}</router-link>
                </b-card-text>
                <div slot="footer" class="text-right">
                  <b-button type="submit" variant="outline-primary">{{ $t('common.login') }}</b-button>
                </div>
            </b-card>
          </b-form>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import Api from '@/utils/Api'

export default {
  data () {
    return {
      username: null,
      password: null,
      emailNotVerified: false,
      passwordCompromised: false,
      isResendingVerification: false,
      resendVerificationSent: false
    }
  },
  watch: {
    username () {
      this.emailNotVerified = false
      this.passwordCompromised = false
      this.resendVerificationSent = false
    },
    password () {
      this.emailNotVerified = false
      this.passwordCompromised = false
    }
  },
  methods: {
    login () {
      let username = this.username
      let password = this.password
      this.emailNotVerified = false
      this.passwordCompromised = false
      this.resendVerificationSent = false
      this.$store
        .dispatch('login', {username, password})
        .then((response) => {
          const data = response.data
          const personalOrg = (data.user && data.user.personal_organization)
            ? data.user.personal_organization
            : data.personal_organization

          const basePath = `/workspace/${personalOrg}`
          let redirectPath = (this.$route.query.redirect) ? this.$route.query.redirect : basePath

          if (this.$route.hash && !redirectPath.includes('#')) {
            redirectPath += this.$route.hash
          }

          this.$router.push({ 'path': redirectPath }).catch(err => {
            if (err && err.name !== 'NavigationDuplicated') throw err
          })
        })
        .catch((error) => {
          if (error && error.response && error.response.data &&
              error.response.data.status === 'email_not_verified') {
            this.emailNotVerified = true
          } else if (error && error.response && error.response.data &&
              error.response.data.status === 'password_compromised') {
            this.passwordCompromised = true
          } else {
            console.error(error)
          }
        })
    },
    resendVerification () {
      this.isResendingVerification = true
      this.resendVerificationSent = false
      Api.post('/auth/resend_verification', { email: this.username })
        .then(() => {
          this.resendVerificationSent = true
          this.isResendingVerification = false
        })
        .catch(() => {
          this.isResendingVerification = false
        })
    },
    changeStatus () {
      this.$store.dispatch('changeStatus')
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
