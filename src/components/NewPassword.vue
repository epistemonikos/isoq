<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-4" cols="12" md="6" offset-md="3">
          <b-form>
            <b-alert
              dismissible
              @dismissed="cleanVars"
              :variant="classBanner"
              :show="showBanner">
              {{ msgBanner }}
            </b-alert>
            <b-form-group
              :label="$t('common.password')"
              label-for="password">
              <b-form-input
                id="password"
                type="password"
                v-model="password"></b-form-input>
            </b-form-group>
            <b-form-group
              :label="$t('account.repeat_password_label')"
              label-for="repassword"
              :state="state"
              :valid-feedback="validMatch"
              :invalid-feedback="invalidMatch">
              <b-form-input
                id="repassword"
                type="password"
                v-model="repassword"
                :state="state"></b-form-input>
            </b-form-group>
            <b-button
              variant="success"
              :disabled="!state"
              @click="changePassword">{{ $t('common.change') }}</b-button>
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
      showBanner: false,
      msgBanner: '',
      classBanner: '',
      password: '',
      repassword: '',
      msgPassword: ''
    }
  },
  computed: {
    state () {
      if (this.password === this.repassword && this.password !== '' && this.password.length > 7) {
        return true
      }
      return false
    },
    invalidMatch () {
      if (this.password.length > 7) {
        return ''
      } else if (this.password !== this.repassword) {
        return this.$t('account.password_mismatch')
      } else {
        return this.$t('account.password_min_chars')
      }
    },
    validMatch () {
      return this.state ? this.$t('common.match') : ''
    }
  },
  methods: {
    changePassword: function () {
      const params = {
        token: this.$route.params.token,
        username: this.$route.params.username,
        password: this.password
      }
      axios.post('/auth/new_password', params)
        .then((response) => {
          const data = response.data
          if (data.status === 'password_changed') {
            this.showBanner = true
            this.msgBanner = this.$t('account.password_changed')
            this.classBanner = 'success'
          } else {
            this.showBanner = true
            this.msgBanner = this.$t('account.invalid_token')
            this.classBanner = 'warning'
          }
        })
        .catch((error) => {
          console.log(error)
        })
    },
    cleanVars: function () {
      this.showBanner = false
      this.msgBanner = ''
      this.classBanner = ''
      this.password = ''
      this.repassword = ''
      this.msgPassword = ''
    }
  }
}
</script>
