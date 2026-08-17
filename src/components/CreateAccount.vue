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

              <template v-if="gdprEnabled">
                <p class="small">
                  {{ $t('gdpr.signup.privacyNote') }}
                  <router-link :to="{ name: 'PrivacyAndTerms', query: { tab: 'privacy' } }" target="_blank">
                    {{ $t('gdpr.export.privacyPolicy') }}
                  </router-link>
                </p>

                <b-form-checkbox v-model="newsletter" class="mb-2">
                  {{ $t('gdpr.preferences.newsletter') }}
                </b-form-checkbox>
                <b-form-checkbox v-model="improvement" class="mb-3">
                  {{ $t('gdpr.preferences.improvement') }}
                </b-form-checkbox>

                <p class="small mb-0">
                  {{ $t('gdpr.signup.termsNote') }}
                  <router-link :to="{ name: 'PrivacyAndTerms', query: { tab: 'terms' } }" target="_blank">
                    {{ $t('gdpr.deleteAccount.termsAndConditions') }}
                  </router-link>
                </p>
              </template>
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
import { TERMS_VERSION } from '@/constants/terms'
import { isGdprEnabled } from '@/constants/gdpr'

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
      },
      newsletter: false,
      improvement: false
    }
  },
  computed: {
    registrationEnabled () {
      return process.env.ENABLE_REGISTRATION === 'true'
    },
    gdprEnabled () {
      return isGdprEnabled()
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
      // Con GDPR encendido, crear la cuenta implica aceptar los términos, y el
      // backend lo exige: terms_accepted tiene que ser boolean Y true, y
      // terms_version un int entre 1 y CURRENT_TERMS_VERSION, o el alta
      // devuelve 400 (isoq_server_py310, auth_server/controllers/router.py).
      //
      // Con el flag apagado se omiten los cuatro campos. Para terms_accepted y
      // terms_version el efecto es real: el backend no los inventa, y la cuenta
      // queda sin registro de aceptación — que es lo correcto, porque el
      // template no mostró ninguna nota legal ni casilla.
      //
      // Para newsletter e improvement el efecto NO es el mismo, y conviene no
      // engañarse: create_user los coerce a False cuando faltan
      // (router.py:181-185), así que omitirlos equivale a mandar false. El alta
      // no puede evitar fijar esas dos preferencias. Se omiten igual por
      // coherencia del payload, no porque cambie lo que se guarda.
      // (El caso donde omitir SÍ preserva el valor previo es
      // POST /users/update_info, otro endpoint, corregido por backend en
      // 2026-08-17 — ver docs/backend-enable-gdpr-response.md §5.5.)
      let params = {
        user: {
          ...this.user
        }
      }
      if (this.gdprEnabled) {
        Object.assign(params.user, {
          terms_accepted: true,
          terms_version: TERMS_VERSION,
          newsletter: this.newsletter,
          improvement: this.improvement
        })
      }
      if (Object.prototype.hasOwnProperty.call(this.$route.query, 'token')) {
        params.shared = {
          token: this.$route.query['token']
        }
      }
      Api.post('/create_user', params)
        .then(() => {
          this.$router.push({ name: 'checkEmail', query: { email: this.user.username } })
        })
        .catch((error) => {
          this.ui.isProcessing = false
          const data = (error.response && error.response.data) || {}

          // El 400 por términos ausentes es el único fallo que este componente
          // puede predecir: pasa cuando ENABLE_GDPR está apagado acá y encendido
          // en el backend. Sin este caso el usuario ve 'invalid_terms_version'
          // sin message, cae en el error genérico y nadie relaciona el síntoma
          // con el flag.
          //
          // El backend ya lee su propio ENABLE_GDPR (desde 2026-08-17), así que
          // esta rama dejó de ser el camino esperado y pasó a ser lo que siempre
          // debió: el diagnóstico de dos capas desalineadas en un despliegue.
          // Por eso se conserva — se chequea la respuesta del servidor, no sólo
          // el flag local, y si ambos coinciden nunca se entra acá.
          if (!this.gdprEnabled &&
              (data.result === 'invalid_terms_version' || data.result === 'invalid_payload')) {
            console.error(
              '[CreateAccount] El backend rechazó el alta por los campos de términos. ' +
              'ENABLE_GDPR está apagado en el frontend y encendido en el backend: ' +
              'los dos tienen que coincidir. Revisar ENABLE_GDPR en el .env del servidor ' +
              '(auth_server/config.py) y en config/*.env de este proyecto.',
              data
            )
            this.errorMessage = this.$t('account.create_error_gdpr_mismatch')
            return
          }

          if (data.message) {
            this.errorMessage = data.message
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
          console.error(error)
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
