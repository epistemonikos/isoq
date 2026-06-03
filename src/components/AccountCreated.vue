<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-5" cols="12" md="8" lg="6" offset-md="2" offset-lg="3">
          <b-card class="text-center">
            <div class="mb-4">
              <font-awesome-icon icon="check-circle" size="4x" class="text-success" />
            </div>
            <h4 class="mb-3">Account created successfully!</h4>
            <p class="mb-1">
              We've sent a verification email to:
            </p>
            <p class="font-weight-bold mb-4">{{ email }}</p>
            <p class="text-muted mb-4">
              Click the link in the email to activate your account and log in.
              If you don't see it, check your spam folder.
            </p>

            <b-alert variant="success" :show="resendSuccess" class="mb-3">
              Verification email sent. Please check your inbox.
            </b-alert>

            <div class="d-flex flex-column align-items-center">
              <b-button
                v-if="!resendSuccess"
                variant="outline-secondary"
                size="sm"
                :disabled="isResending"
                class="mb-3"
                @click="resendVerification">
                <b-spinner v-if="isResending" small class="mr-1"></b-spinner>
                Resend verification email
              </b-button>
              <router-link :to="{ name: 'Login' }">Back to Login</router-link>
            </div>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data () {
    return {
      isResending: false,
      resendSuccess: false
    }
  },
  computed: {
    email () {
      return this.$route.query.email || ''
    }
  },
  methods: {
    async resendVerification () {
      this.isResending = true
      try {
        await axios.post('/auth/resend_verification', { username: this.email })
        this.resendSuccess = true
      } catch (error) {
        console.log(error)
      } finally {
        this.isResending = false
      }
    }
  }
}
</script>
