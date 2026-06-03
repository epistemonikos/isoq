<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-4" cols="12" md="6" offset-md="3">
          <b-alert variant="info" :show="verifying">
            Verifying your email address...
          </b-alert>
          <b-alert variant="danger" :show="!!errorMsg">
            {{ errorMsg }}
            <div class="mt-2">
              <router-link :to="{name: 'Login'}">Go to login</router-link>
            </div>
          </b-alert>
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
      verifying: true,
      errorMsg: ''
    }
  },
  mounted () {
    this.verifyEmail()
  },
  methods: {
    verifyEmail () {
      const token = this.$route.params.token
      axios.post('/auth/verify_email', { token })
        .then(() => {
          this.$router.push({ name: 'Login', query: { verified: 'true' } })
        })
        .catch(() => {
          this.verifying = false
          this.errorMsg = 'The verification link is invalid or has expired. Please try registering again or contact support.'
        })
    }
  }
}
</script>
