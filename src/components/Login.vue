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
                  <router-link :to="{name: 'ForgotPassword'}">{{ $t('auth.forgot_password') }}</router-link><template v-if="registrationEnabled"> | <router-link :to="{name: 'CreateAccount'}">{{ $t('auth.new_account') }}</router-link></template>
                </b-card-text>
                <div slot="footer" class="text-right">
                  <b-button type="submit" variant="outline-primary">{{ $t('common.login') }}</b-button>
                </div>
            </b-card>
          </b-form>
        </b-col>
      </b-row>
    </b-container>

    <b-modal
      id="modal-terms-acceptance"
      :title="$t('gdpr.terms.modalTitle')"
      no-close-on-backdrop
      no-close-on-esc
      hide-header-close>
      <p>{{ $t('gdpr.terms.intro') }}</p>
      <p>
        <router-link :to="{name: 'PrivacyAndTerms', query: {tab: 'terms'}}" target="_blank">
          {{ $t('gdpr.terms.reviewHere') }}
        </router-link>
      </p>

      <b-form-checkbox v-model="termsAccepted" class="mb-2">
        {{ $t('gdpr.terms.acceptLabel') }}
      </b-form-checkbox>
      <b-form-checkbox v-model="newsletterAccepted">
        {{ $t('gdpr.terms.newsletterLabel') }}
      </b-form-checkbox>

      <b-alert :show="!!termsError" variant="danger" class="mt-3">
        {{ termsError }}
      </b-alert>

      <!-- Sin este aviso la opción de descarga es invisible justo para quien
           la necesita: el que va a cancelar no tiene motivo para explorar un
           botón antes de irse, ni sabe que cancelar cierra la sesión y que
           después ya no hay otra vía. El original tampoco lo explica. -->
      <p class="small text-muted mt-3 mb-0">{{ $t('gdpr.terms.declineNote') }}</p>

      <!-- Quien rechaza los términos pierde la sesión, y el perfil exige
           tenerlos aceptados: ésta es su única vía para llevarse sus datos. -->
      <div v-if="showDownloadSection" class="mt-3 p-3 border rounded">
        <p class="mb-2"><strong>{{ $t('gdpr.terms.downloadPrompt') }}</strong></p>
        <b-form-group
          :invalid-feedback="downloadError"
          :state="downloadError ? false : null">
          <b-form-input
            type="password"
            v-model="downloadPassword"
            :placeholder="$t('gdpr.terms.passwordPlaceholder')"
            :state="downloadError ? false : null"
            @keyup.enter="downloadData"></b-form-input>
        </b-form-group>
        <b-button
          variant="outline-secondary"
          size="sm"
          :disabled="isDownloading"
          @click="downloadData">
          <b-spinner v-if="isDownloading" small class="mr-1"></b-spinner>
          {{ $t('gdpr.terms.downloadButton') }}
        </b-button>
      </div>

      <div slot="modal-footer" class="d-flex justify-content-between align-items-center w-100">
        <b-button variant="link" size="sm" @click="showDownloadSection = !showDownloadSection">
          {{ $t('gdpr.terms.downloadToggle') }}
        </b-button>
        <div>
        <b-button variant="outline-secondary" @click="declineTerms">
          {{ $t('gdpr.terms.cancel') }}
        </b-button>
        <b-button
          variant="primary"
          :disabled="!termsAccepted || isAcceptingTerms"
          @click="acceptTerms">
          <b-spinner small v-if="isAcceptingTerms" class="mr-1"></b-spinner>
          {{ $t('gdpr.terms.accept') }}
        </b-button>
        </div>
      </div>
    </b-modal>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import { TERMS_VERSION, needsTermsAcceptance } from '@/constants/terms'
import { downloadPersonalData } from '@/services/personalDataExport'
import { isBackendTrue } from '@/constants/backendBoolean'

export default {
  data () {
    return {
      username: null,
      password: null,
      emailNotVerified: false,
      passwordCompromised: false,
      isResendingVerification: false,
      resendVerificationSent: false,
      termsAccepted: false,
      newsletterAccepted: false,
      termsError: '',
      isAcceptingTerms: false,
      showDownloadSection: false,
      downloadPassword: '',
      downloadError: '',
      isDownloading: false,
      // Adónde iba el usuario antes de que el modal lo interrumpiera. Se
      // resuelve una sola vez en login(), donde ya se conoce su organización
      // personal, y se consume en acceptTerms().
      pendingRedirect: null
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
  computed: {
    registrationEnabled () {
      return process.env.ENABLE_REGISTRATION === 'true'
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

          // Se consulta state.user, no response.data, y esto no es
          // intercambiable: /auth/login devuelve {status, user, access_token}
          // (isoq_server_py310, auth_server/controllers/core.py:114-118), así
          // que los términos vienen anidados en data.user y nunca en la raíz.
          // Aplicar la regla sobre `data` daría fail-closed en todos los
          // logins y el modal se abriría hasta para quien ya aceptó.
          //
          // Además tiene que coincidir con el guard de main.js, que lee
          // store.state.user: si discrepan, el usuario navega y el guard lo
          // desloguea en el acto, sin haber visto nunca el modal.
          if (needsTermsAcceptance(this.$store.state.user)) {
            this.pendingRedirect = redirectPath
            // La casilla arranca con lo que el usuario ya había elegido: el
            // PATCH manda este valor, así que dejarla siempre desmarcada
            // revocaba la suscripción de quien sólo venía a aceptar unos
            // términos actualizados.
            this.newsletterAccepted = isBackendTrue(this.$store.state.user.newsletter)
            this.$bvModal.show('modal-terms-acceptance')
            return
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
    },
    // Va por Api.patch y no por axios como el original: Api ya inyecta el
    // Authorization en getHeaders() y encola la mutación si estamos offline.
    async acceptTerms () {
      if (!this.termsAccepted || this.isAcceptingTerms) return

      this.termsError = ''
      this.isAcceptingTerms = true
      try {
        await Api.patch('/users/update_my_profile', {
          terms_accepted: true,
          terms_version: TERMS_VERSION,
          newsletter: this.newsletterAccepted
        })

        // El store se actualiza con lo que se acaba de persistir, así el guard
        // no vuelve a desviar en la navegación que sigue.
        //
        // El newsletter va incluido: se acaba de mandar en el PATCH, y si el
        // store no se entera, el perfil lo muestra desmarcado durante toda la
        // sesión y al guardar cualquier otra preferencia manda newsletter
        // false, revocando el consentimiento que el usuario acaba de dar.
        this.$store.dispatch('updateUser', {
          terms_accepted: true,
          terms_version: TERMS_VERSION,
          newsletter: this.newsletterAccepted
        })
        this.$bvModal.hide('modal-terms-acceptance')
        this.$router.push({ 'path': this.pendingRedirect }).catch(err => {
          if (err && err.name !== 'NavigationDuplicated') throw err
        })
      } catch (error) {
        this.termsError = this.$t('gdpr.terms.error')
      } finally {
        this.isAcceptingTerms = false
      }
    },
    // Misma exportación que ofrece el perfil, vía el servicio compartido: acá
    // se llega con sesión pero con los términos pendientes, así que el perfil
    // no es alcanzable (el guard desviaría).
    async downloadData () {
      this.downloadError = ''
      if (!this.downloadPassword) {
        this.downloadError = this.$t('gdpr.export.passwordRequired')
        return
      }
      if (this.isDownloading) return

      this.isDownloading = true
      try {
        await downloadPersonalData(this.$store.state.user.id, this.downloadPassword)
      } catch (error) {
        this.downloadError = error.backendMessage || this.$t('gdpr.terms.downloadError')
      } finally {
        this.isDownloading = false
      }
    },
    declineTerms () {
      this.$bvModal.hide('modal-terms-acceptance')
      return this.$store.dispatch('logout')
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
