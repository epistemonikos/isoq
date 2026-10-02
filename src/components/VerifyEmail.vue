<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-4" cols="12" md="6" offset-md="3">
          <b-card>
            <div v-if="status === 'verifying'" class="text-center">
              <b-spinner class="mr-2"></b-spinner>
              {{ $t('account.verifying_email') }}
            </div>
            <b-alert v-else-if="status === 'verified'" show variant="success">
              {{ $t('account.email_verified') }}
            </b-alert>
            <!-- La petición no llegó o el servidor falló: el enlace puede estar bien. Un token
                 inválido llega como 200 {status: 'invalid_token'} y cae en la rama de abajo. -->
            <b-alert v-else-if="status === 'request_failed'" show variant="warning">
              {{ $t(requestError) }}
              <div class="mt-2">
                <b-button size="sm" variant="outline-warning" data-test="verify-retry" @click="verifyToken">{{ $t('common.retry') }}</b-button>
              </div>
            </b-alert>
            <b-alert v-else-if="status === 'failed'" show variant="danger">
              {{ $t('account.verification_failed') }}
              <div class="mt-2">
                <router-link :to="{name: 'Login'}">{{ $t('common.login') }}</router-link>
              </div>
            </b-alert>
          </b-card>
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
      status: 'verifying',
      requestError: ''
    }
  },
  created () {
    this.verifyToken()
  },
  methods: {
    verifyToken () {
      const token = this.$route.params.token
      this.status = 'verifying'
      Api.get(`/auth/verify_email/${token}`)
        .then((response) => {
          if (response.data.status === 'verified') {
            this.status = 'verified'
            setTimeout(() => {
              this.$router.push({ name: 'Login' })
            }, 2000)
          } else {
            this.status = 'failed'
          }
        })
        .catch((error) => {
          this.requestError = requestFailureKey(error) || 'common.connection_failed'
          this.status = 'request_failed'
        })
    }
  }
}
</script>
