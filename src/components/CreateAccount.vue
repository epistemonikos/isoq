<template>
  <div>
    <b-container>
      <b-row v-if="!registrationEnabled">
        <b-col class="mt-5" cols="12" md="6" lg="4" offset-md="3" offset-lg="4">
          <b-alert show variant="warning" class="text-center">
            {{ $t('account.registration_disabled') }}
          </b-alert>
        </b-col>
      </b-row>
      <b-row v-else>
        <b-col class="mt-4" cols="12" md="10" lg="8" offset-md="1" offset-lg="2">
          <b-form>
            <b-card :header="$t('account.create_account')">
              <b-form-group
                id="input_group_name"
                :label="$t('account.name_label')"
                label-for="input_name">
                <b-form-input
                  id="input_name"
                  type="text"
                  :placeholder="$t('account.name_placeholder')"
                  v-model="user.first_name"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_surname"
                :label="$t('account.surname_label')"
                label-for="input_surname">
                <b-form-input
                  id="input_surname"
                  type="text"
                  :placeholder="$t('account.surname_placeholder')"
                  v-model="user.last_name"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_email"
                :label="$t('account.email_label')"
                label-for="input_email">
                <b-form-input
                  id="input_email"
                  :state="ui.username_validation"
                  required
                  aria-describedby="input-live-help input-live-feedback"
                  :placeholder="$t('account.email_placeholder')"
                  v-model.trim="user.username">
                </b-form-input>
                <b-form-text
                  id="input-live-feedback"
                  v-if="!ui.username_validation && ui.username_validation !== null">{{ $t('account.email_exists_error') }}</b-form-text>
                <b-form-text
                  id="input-live-help">{{ $t('account.email_username_hint') }}</b-form-text>
              </b-form-group>
              <b-form-group
                id="input_group_password"
                :label="$t('account.password_label')"
                label-for="input_password">
                <b-form-input
                  id="input_password"
                  type="password"
                  required
                  :placeholder="$t('account.password_placeholder')"
                  v-model="user.password"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_repeat_password"
                :label="$t('account.repeat_password_label')"
                label-for="input_repeat_password">
                <b-form-input
                  id="input_repeat_password"
                  type="password"
                  required
                  :placeholder="$t('account.repeat_password_placeholder')"
                  v-model="user.password_2"></b-form-input>
              </b-form-group>

              <b-alert
                v-if="errorMessage"
                show
                variant="danger"
                dismissible
                @dismissed="errorMessage = ''">
                {{ errorMessage }}
              </b-alert>

              <b-card-text class="text-center text-forgot-create">
                <router-link :to="{name: 'Login'}">{{ $t('common.login') }}</router-link> | <router-link :to="{name: 'ForgotPassword'}">{{ $t('auth.forgot_password') }}</router-link>
              </b-card-text>
              <div
                slot="footer"
                class="text-right">
                <b-button
                  variant="outline-primary"
                  :disabled="!(ui.username_validation && ui.password_validation) || ui.isProcessing"
                  @click="createAccount">
                  <b-spinner small v-if="ui.isProcessing" class="mr-1"></b-spinner>
                  {{ $t('account.create_account_btn') }}
                </b-button>
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
import _debounce from 'lodash.debounce'

export default {
  data () {
    return {
      ui: {
        username_validation: null,
        password_validation: false,
        isProcessing: false
      },
      errorMessage: '',
      user: {
        first_name: '',
        last_name: '',
        username: '',
        password: '',
        password_2: ''
      }
    }
  },
  computed: {
    registrationEnabled () {
      return process.env.ENABLE_REGISTRATION === 'true'
    }
  },
  watch: {
    'user.username': function () {
      this.checkEmail()
    },
    'user.password': function () {
      this.comparePassword()
    },
    'user.password_2': function () {
      this.comparePassword()
    }
  },
  created () {
    this.checkEmail = _debounce(this.checkEmailExist, 500)
  },
  methods: {
    validEmail (email) {
      var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      this.ui.username_validation = re.test(email)
    },
    createAccount () {
      this.ui.isProcessing = true
      this.errorMessage = ''
      let params = { user: this.user }
      if (Object.prototype.hasOwnProperty.call(this.$route.query, 'o') &&
        Object.prototype.hasOwnProperty.call(this.$route.query, 'p') &&
        Object.prototype.hasOwnProperty.call(this.$route.query, 'r')) {
        params.shared = {
          o: this.$route.query['o'],
          p: this.$route.query['p'],
          r: this.$route.query['r']
        }
      }
      Api.post('/create_user', params)
        .then(() => {
          this.$router.push({ name: 'checkEmail', query: { email: this.user.username } })
        })
        .catch((error) => {
          this.ui.isProcessing = false
          if (error.response && error.response.data && error.response.data.message) {
            this.errorMessage = error.response.data.message
          } else {
            this.errorMessage = this.$t('account.create_error')
          }
        })
    },
    checkEmailExist () {
      if (!this.user.username) return
      const email = this.user.username.trim()
      Api.get('/users/check_email', { email })
        .then((response) => {
          this.ui.username_validation = response.data.error === false
        })
        .then(() => {
          if (this.ui.username_validation) {
            this.validEmail(email)
          } else {
            this.ui.username_validation = false
          }
        })
        .catch((error) => {
          console.log(error)
        })
    },
    comparePassword () {
      if (!this.user.password || !this.user.password_2) {
        this.ui.password_validation = false
        return
      }
      if (this.user.password !== this.user.password_2) {
        this.ui.password_validation = false
        return
      }
      if (this.user.password.length < 8) {
        this.ui.password_validation = false
        return
      }
      this.ui.password_validation = true
    }
  }
}
</script>

<style>

</style>
