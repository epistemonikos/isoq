<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-4" cols="12" md="6" offset-md="3">
          <b-form @submit.stop.prevent>
            <b-card
              v-if="ui.main"
              header="Reset your password">
              <b-form-group
                id="recovery_input_email"
                label="Email:"
                label-for="recovery_email">
                <b-form-input
                  id="recovery_email"
                  type="email"
                  required
                  :state="ui.error"
                  aria-describedby="input-live-feedback"
                  placeholder="Enter a valid email"
                  v-model="username">
                </b-form-input>
                <b-form-invalid-feedback
                  v-if="!ui.error"
                  id="input-live-feedback">
                  This email is not registered
                </b-form-invalid-feedback>
              </b-form-group>
              <b-card-text class="text-center text-forgot-create">
                <router-link :to="{name: 'Login'}">login</router-link><!-- | <router-link :to="{name: 'CreateAccount'}">new account</router-link> -->
              </b-card-text>
              <div slot="footer" class="text-right">
                <b-button
                  variant="outline-primary"
                  @click="recoverPass">Recover</b-button>
              </div>
            </b-card>
            <b-card
              v-if="ui.sent"
              header="Sent">
              <p>An email was sent to you with instructions for resetting your password.</p>
            </b-card>
          </b-form>
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
      ui: {
        main: true,
        sent: false,
        error: null
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
      axios.post(`/auth/recover`, params)
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
          console.log(error)
        })
    }
  }
}
</script>

<style>

</style>
