<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-4" cols="12" md="10" lg="8" offset-md="1" offset-lg="2">
          <b-form>
            <b-card
              header="Create an account">
              <b-form-group
                id="input_group_name"
                label="Name:"
                label-for="input_name">
                <b-form-input
                  id="input_name"
                  type="text"
                  placeholder="Name"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_surname"
                label="Surname:"
                label-for="input_surname">
                <b-form-input
                  id="input_surname"
                  type="text"
                  placeholder="Surname"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_email"
                label="Email:"
                label-for="input_email">
                <b-form-input
                  id="input_email"
                  type="email"
                  required
                  placeholder="Enter a valid email"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_affiliation"
                label="Affiliation:"
                label-for="input_affiliation">
                <b-form-input
                  id="input_affiliation"
                  type="text"
                  placeholder="Your affiliation"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_password"
                label="Password:"
                label-for="input_password">
                <b-form-input
                  id="input_password"
                  type="password"
                  required
                  placeholder="Write an strong password with at least 8 alpha-numeric characters"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_repeat_password"
                label="Repeat the password:"
                label-for="input_repeat_password">
                <b-form-input
                  id="input_repeat_password"
                  type="password"
                  required
                  placeholder="Write the same password above"></b-form-input>
              </b-form-group>
              <b-card-text class="text-center text-forgot-create">
                <router-link :to="{name: 'Login'}">login</router-link> | <router-link :to="{name: 'ForgotPassword'}">forgot your password?</router-link>
              </b-card-text>
              <div
                slot="footer"
                class="text-right">
                <b-button
                  variant="outline-primary">Create account</b-button>
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

}
</script>

<style>

</style>
