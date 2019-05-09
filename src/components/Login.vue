<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-4" cols="12" md="6" offset-md="3">
          <b-form>
            <b-card
              header="Login">
                <b-form-group
                  id="input_group_email"
                  label="Email:"
                  label-for="input_email">
                  <b-form-input
                    id="input_email"
                    v-model="form.email"
                    type="email"
                    required
                    placeholder="Enter a valid email"></b-form-input>
                </b-form-group>
                <b-form-group
                  id="input_group_password"
                  label="Password:"
                  label-for="input_password">
                  <b-form-input
                    id="input_password"
                    v-model="form.password"
                    type="password"
                    required
                    placeholder="Enter your strong password"></b-form-input>
                </b-form-group>
                <b-card-text class="text-center text-forgot-create">
                  <router-link :to="{name: 'ForgotPassword'}">forgot your password?</router-link> | <router-link :to="{name: 'CreateAccount'}">new account</router-link>
                </b-card-text>
                <div slot="footer" class="text-right">
                  <b-button variant="outline-primary">Login</b-button>
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
      form: {
        email: null,
        password: null
      }
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
