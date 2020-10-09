<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-4" cols="12" md="6" offset-md="3">
          <b-form @submit.prevent="login">
            <b-card
              header="Login">
                <b-alert
                  :show="$store.state.status === 'error'"
                  variant="warning"
                  dismissible
                  @dismissed="changeStatus">
                    The user or password are wrong or doesn't exist. try again.
                </b-alert>
                <b-form-group
                  id="input_group_email"
                  label="Email:"
                  label-for="input_email">
                  <b-form-input
                    id="input_email"
                    v-model="username"
                    type="email"
                    required></b-form-input>
                </b-form-group>
                <b-form-group
                  id="input_group_password"
                  label="Password:"
                  label-for="input_password">
                  <b-form-input
                    id="input_password"
                    v-model="password"
                    type="password"
                    required></b-form-input>
                </b-form-group>
                <b-card-text class="text-center text-forgot-create">
                  <router-link :to="{name: 'ForgotPassword'}">forgot your password?</router-link><!-- | <router-link :to="{name: 'CreateAccount'}">new account</router-link>-->
                </b-card-text>
                <div slot="footer" class="text-right">
                  <b-button type="submit" variant="outline-primary">Login</b-button>
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
