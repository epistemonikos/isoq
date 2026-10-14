<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-4" cols="12" md="6" offset-md="3">
          <b-card :header="$t('account.check_email_title')">
            <p>
              <span v-if="email">{{ $t('account.check_email_message', { email }) }}</span>
              <span v-else>{{ $t('account.check_email_no_email') }}</span>
            </p>
            <b-alert v-if="resentSuccess" show variant="success">
              {{ $t('account.resend_email_sent') }}
            </b-alert>
            <b-alert v-if="resentError" show variant="danger">
              {{ $t('account.resend_email_error') }}
            </b-alert>
            <div class="text-center mt-3">
              <b-button
                variant="outline-primary"
                :disabled="isResending"
                @click="resendEmail">
                <b-spinner small v-if="isResending" class="mr-1"></b-spinner>
                {{ $t('account.resend_email_btn') }}
              </b-button>
            </div>
            <b-card-text class="text-center text-forgot-create mt-3">
              <router-link :to="{name: 'Login'}">{{ $t('common.login') }}</router-link>
            </b-card-text>
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
      isResending: false,
      resentSuccess: false,
      resentError: false
    }
  },
  computed: {
    email () {
      return this.$route.query.email || ''
    }
  },
  methods: {
    resendEmail () {
      this.isResending = true
      this.resentSuccess = false
      this.resentError = false
      Api.post('/auth/resend_verification', { email: this.email })
        .then(() => {
          this.resentSuccess = true
          this.isResending = false
        })
        .catch(() => {
          this.resentError = true
          this.isResending = false
        })
    }
  }
}
</script>
