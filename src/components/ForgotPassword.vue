<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-4" cols="12" md="6" offset-md="3">
          <b-form>
            <b-card
              header="Reset your password">
              <b-form-group
                id="recovery_input_email"
                label="Email:"
                label-for="recovery_email">
                <b-form-input
                  id="recovery_email"
                  type="email"
                  required
                  placeholder="Enter a valid email">
                </b-form-input>
              </b-form-group>
              <b-card-text class="text-center text-forgot-create">
                <router-link :to="{name: 'Login'}">login</router-link> | <router-link :to="{name: 'CreateAccount'}">new account</router-link>
              </b-card-text>
              <div slot="footer" class="text-right">
                <b-button variant="outline-primary">Recover</b-button>
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
