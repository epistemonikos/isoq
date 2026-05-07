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
              :show="showBanner && classBanner !== 'success'">
              {{ msgBanner }}
            </b-alert>
            <b-alert
              variant="success"
              :show="showBanner && classBanner === 'success'">
              {{ $t('account.password_changed') }}
              — <router-link :to="{ name: 'Login' }">{{ $t('common.login') }}</router-link>
              <span class="ml-2 text-muted">{{ $t('account.redirect_countdown', { seconds: countdown }) }}</span>
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
              :state="inputState"
              :valid-feedback="validMatch"
              :invalid-feedback="invalidMatch">
              <b-form-input
                id="repassword"
                type="password"
                v-model="repassword"
                :state="inputState"
                @blur="touched = true"></b-form-input>
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
import Api from '@/utils/Api'

export default {
  data () {
    return {
      showBanner: false,
      msgBanner: '',
      classBanner: '',
      password: '',
      repassword: '',
      msgPassword: '',
      touched: false,
      countdown: 5,
      redirectTimer: null
    }
  },
  computed: {
    state () {
      return this.password !== '' && this.password.length > 7 && this.password === this.repassword
    },
    inputState () {
      if (!this.touched) return null
      return this.state
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
  beforeDestroy () {
    if (this.redirectTimer) clearInterval(this.redirectTimer)
  },
  methods: {
    changePassword: function () {
      const params = {
        token: this.$route.params.token,
        username: this.$route.params.username,
        password: this.password
      }
      Api.post('/auth/new_password', params)
        .then((response) => {
          const data = response.data
          if (data.status === 'password_changed') {
            this.showBanner = true
            this.classBanner = 'success'
            this.countdown = 5
            this.redirectTimer = setInterval(() => {
              this.countdown--
              if (this.countdown <= 0) {
                clearInterval(this.redirectTimer)
                this.$router.push({ name: 'Login' })
              }
            }, 1000)
          } else if (data.status === 'password_compromised') {
            this.showBanner = true
            this.msgBanner = this.$t('account.password_compromised')
            this.classBanner = 'danger'
          } else {
            this.showBanner = true
            this.msgBanner = this.$t('account.invalid_token')
            this.classBanner = 'warning'
          }
        })
        .catch((error) => {
          console.error(error)
        })
    },
    cleanVars: function () {
      if (this.redirectTimer) {
        clearInterval(this.redirectTimer)
        this.redirectTimer = null
      }
      this.showBanner = false
      this.msgBanner = ''
      this.classBanner = ''
      this.password = ''
      this.repassword = ''
      this.msgPassword = ''
      this.touched = false
      this.countdown = 5
    }
  }
}
</script>
