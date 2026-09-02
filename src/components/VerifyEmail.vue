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

export default {
  data () {
    return {
      status: 'verifying'
    }
  },
  created () {
    this.verifyToken()
  },
  methods: {
    verifyToken () {
      const token = this.$route.params.token
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
        .catch(() => {
          this.status = 'failed'
        })
    }
  }
}
</script>
