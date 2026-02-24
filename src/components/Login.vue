<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-4" cols="12" md="7" offset-md="3">
          <b-form @submit.prevent="login">
            <b-card
              :header="$t('common.login')">
                <b-alert
                  :show="$store.state.status === 'error'"
                  variant="warning"
                  dismissible
                  @dismissed="changeStatus">
                    {{ $t('auth.login_error') }}
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
                  <router-link :to="{name: 'ForgotPassword'}">{{ $t('auth.forgot_password') }}</router-link> | <router-link :to="{name: 'CreateAccount'}">{{ $t('auth.new_account') }}</router-link>
                </b-card-text>
                <div slot="footer" class="text-right">
                  <b-button type="submit" variant="outline-primary">{{ $t('common.login') }}</b-button>
                </div>
            </b-card>
          </b-form>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
export default {
  data () {
    return {
      username: null,
      password: null
    }
  },
  methods: {
    login () {
      let username = this.username
      let password = this.password
      this.$store
        .dispatch('login', {username, password})
        .then((response) => {
          const personalInfo = response.data
          const basePath = `/workspace/${personalInfo.personal_organization}`
          const path = { 'path': (this.$route.query.redirect) ? this.$route.query.redirect : basePath }
          this.$router.push(path)
        })
        .catch((error) => console.log(error))
    },
    changeStatus () {
      this.$store.dispatch('changeStatus')
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
