<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-4" cols="12" md="6" offset-md="3">
          <b-form @submit.stop.prevent>
            <b-card
              v-if="ui.main"
              :header="$t('account.reset_password')">
              <!-- La solicitud no llegó o el servidor falló. El «no registrado» sigue en el
                   propio campo: es otra cosa, y la persona lo corrige escribiendo. -->
              <b-alert :show="!!ui.requestError" variant="danger">
                {{ ui.requestError ? $t(ui.requestError) : '' }}
              </b-alert>
              <b-form-group
                id="recovery_input_email"
                :label="$t('account.email_label')"
                label-for="recovery_email">
                <b-form-input
                  id="recovery_email"
                  type="email"
                  required
                  :state="ui.error"
                  aria-describedby="input-live-feedback"
                  :placeholder="$t('account.email_placeholder')"
                  v-model="username">
                </b-form-input>
                <b-form-invalid-feedback
                  v-if="!ui.error"
                  id="input-live-feedback">
                  {{ $t('account.email_not_registered') }}
                </b-form-invalid-feedback>
              </b-form-group>
              <b-card-text class="text-center text-forgot-create">
                <router-link :to="{name: 'Login'}">{{ $t('common.login') }}</router-link><!-- | <router-link :to="{name: 'CreateAccount'}">new account</router-link> -->
              </b-card-text>
              <div slot="footer" class="text-right">
                <b-button
                  variant="outline-primary"
                  @click="recoverPass">{{ $t('common.recover') }}</b-button>
              </div>
            </b-card>
            <b-card
              v-if="ui.sent"
              :header="$t('common.sent')">
              <p>{{ $t('account.email_sent') }}</p>
            </b-card>
          </b-form>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import { requestFailureKey } from '@/utils/writeErrors'

export default {
  data () {
    return {
      ui: {
        main: true,
        sent: false,
        error: null,
        requestError: ''
      },
      username: '',
      tmpUsername: ''
    }
  },
  watch: {
    username: function () {
      if (this.tmpUsername !== this.username) {
        this.ui.error = null
      } else {
        this.ui.error = false
      }
    }
  },
  methods: {
    recoverPass: function () {
      let params = {
        username: this.username
      }
      this.ui.requestError = ''
      Api.post(`/auth/recover`, params)
        .then((response) => {
          if (response.data.status === 'sent') {
            this.ui.main = false
            this.ui.sent = true
          } else {
            this.ui.error = false
            this.tmpUsername = this.username
          }
        })
        .catch((error) => {
          // Antes sólo `console.error`: la persona apretaba «Recuperar», no pasaba nada y no
          // sabía si esperar el correo.
          console.error(error)
          this.ui.requestError = requestFailureKey(error) || 'common.server_failed'
        })
    }
  }
}
</script>

<style>

</style>
