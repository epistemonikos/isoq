<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-4" cols="12" md="10" lg="8" offset-md="1" offset-lg="2">
          <b-form>
            <b-card
              v-if="ui.display_create_account"
              header="Create an account">
              <b-form-group
                id="input_group_name"
                label="Name:"
                label-for="input_name">
                <b-form-input
                  id="input_name"
                  type="text"
                  placeholder="Name"
                  v-model="user.first_name"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_surname"
                label="Surname:"
                label-for="input_surname">
                <b-form-input
                  id="input_surname"
                  type="text"
                  placeholder="Surname"
                  v-model="user.last_name"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_email"
                label="Email:"
                label-for="input_email">
                <b-form-input
                  id="input_email"
                  type="email"
                  :state="ui.username_validation"
                  required
                  aria-describedby="input-live-help input-live-feedback"
                  placeholder="Enter a valid email"
                  v-model="user.username"></b-form-input>
                <b-form-text
                  id="input-live-feedback"
                  v-if="!ui.username_validation">This username exist!</b-form-text>
                <b-form-text
                  id="input-live-help">This will be used for loggin.</b-form-text>
              </b-form-group>
              <b-form-group
                id="input_group_affiliation"
                label="Affiliation:"
                label-for="input_affiliation">
                <b-form-input
                  id="input_affiliation"
                  type="text"
                  placeholder="Your affiliation"
                  v-model="user.affiliation"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_password"
                label="Password:"
                label-for="input_password">
                <b-form-input
                  id="input_password"
                  type="password"
                  required
                  placeholder="Write an strong password with at least 8 alpha-numeric characters"
                  v-model="user.password"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_repeat_password"
                label="Repeat the password:"
                label-for="input_repeat_password">
                <b-form-input
                  id="input_repeat_password"
                  type="password"
                  required
                  placeholder="Write the same password above"
                  v-model="user.password_2"></b-form-input>
              </b-form-group>
              <b-card-text class="text-center text-forgot-create">
                <router-link :to="{name: 'Login'}">login</router-link> | <router-link :to="{name: 'ForgotPassword'}">forgot your password?</router-link>
              </b-card-text>
              <div
                slot="footer"
                class="text-right">
                <b-button
                  variant="outline-primary"
                  :disabled="!(ui.username_validation && ui.password_validation)"
                  @click="createAccount">Create account</b-button>
              </div>
            </b-card>
          </b-form>
        </b-col>
        <b-col class="mt-4" cols="12" md="10" lg="8" offset-md="1" offset-lg="2">
          <b-card
            v-if="ui.display_join_org_or_create_org"
            header="Your account has been created.">
            <p>
              As an individual, you will be able to create iSoQF tables, but they will remain in your personal space (i.e. they will be only visible when logged in your account).
            </p>
            <p>
              In order to share iSoQF tables with others you need to join an existing organisation or create a new one.
            </p>
            <b-row>
              <b-col cols="12" sm="6" class="text-center">
                <b-button
                  variant="outline-success"
                  block
                  size="lg"
                  @click="showJoinOrgCard">Join</b-button>
              </b-col>
              <b-col cols="12" sm="6" class="text-center">
                <b-button
                  variant="outline-success"
                  block
                  size="lg"
                  @click="showCreateOrgCard">Create</b-button>
              </b-col>
            </b-row>
          </b-card>
        </b-col>
        <b-col class="mt-4" cols="12" md="10" lg="8" offset-md="1" offset-lg="2">
          <b-card
            v-if="ui.display_join_org"
            header="Join to an a organisation">
            <b-form-group
              label="Organisation"
              label-for="input-select-organization">
              <b-form-select
                v-model="org_selected"
                :options="all_organizations"
                value-field="id"
                text-field="name"></b-form-select>
            </b-form-group>
            <div
              slot="footer"
              class="text-right">
              <b-button
                variant="outline-danger"
                @click="cancelCardShowOptions">Cancel</b-button>
              <b-button
                variant="outline-primary"
                @click="jointToOrg">Join</b-button>
            </div>
          </b-card>
        </b-col>
        <b-col class="mt-4" cols="12" md="10" lg="8" offset-md="1" offset-lg="2">
          <b-card
            v-if="ui.display_create_org"
            header="Create an organisation">
            <b-form-group
              label="Name"
              label-for="organization-name">
              <b-form-input
                id="organization-name"
                type="text">
              </b-form-input>
            </b-form-group>
            <b-form-group
              label="Website"
              label-for="organization-website">
              <b-form-input
                id="organization-website"
                type="url"
                placeholder="https://myorganization.org">
              </b-form-input>
            </b-form-group>
            <b-form-group>
              <b-form-checkbox
                v-model="nonprofit"
                value="false"
                unchecked-value="true">confirm this is a non-profit organisation</b-form-checkbox>
            </b-form-group>
            <b-form-group label="Plan">
              <b-form-radio-group
                id="option-plans"
                v-model="selected_plan"
                :options="plans"></b-form-radio-group>
            </b-form-group>
            <b-row>
              <b-col
                cols="12" sm="4"
                v-for="(plan, index) in plans"
                :key="index">
                <b-card
                  :header="plan.text">
                  <ul class="list-unstyled">
                    <li>users: {{plan.specs.users}}</li>
                    <li>tables: {{plan.specs.tables}}</li>
                    <li>price: {{plan.specs.price}}</li>
                  </ul>
                </b-card>
              </b-col>
            </b-row>
            <div
              slot="footer"
              class="text-right">
              <b-button
                variant="outline-danger"
                @click="cancelCardShowOptions">Cancel</b-button>
              <b-button
                variant="outline-primary">Create an Join</b-button>
            </div>
          </b-card>
        </b-col>
        <b-col class="mt-4" cols="12" md="10" lg="8" offset-md="1" offset-lg="2">
          <b-card
            v-if="ui.display_end_affiliation"
            header="You are done!">
            <p>Now, you can create and share iSoQF tables with your organisation.</p>
            <b-button
              variant="outline-success"
              :to="{name: 'Organizations'}">Go to organisations</b-button>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import _debounce from 'lodash.debounce'

export default {
  data () {
    return {
      ui: {
        username_validation: null,
        password_validation: false,
        display_create_account: true,
        display_join_org_or_create_org: false,
        display_join_org: false,
        display_create_org: false,
        display_end_affiliation: false
      },
      organizations: [
        {id: 'examples', name: 'Examples'},
        {id: 'episte', name: 'Test organisation'}
      ],
      user: {
        first_name: '',
        last_name: '',
        affiliation: '',
        username: '',
        password: '',
        password_2: ''
      },
      org_selected: '',
      all_organizations: [],
      nonprofit: true,
      selected_plan: false,
      plans: [
        {text: 'Small', value: 'small', specs: {users: 10, tables: 20, price: 'free'}},
        {text: 'Medium', value: 'medium', specs: {users: 50, tables: 200, price: '1000 USD a year'}},
        {text: 'Large', value: 'large', specs: {users: 'Contact us', tables: 'Contact us', price: 'Contact us'}}
      ]
    }
  },
  watch: {
    'user.username': function (email) {
      this.checkEmail()
    },
    'user.password': function () {
      this.comparePassword()
    },
    'user.password_2': function () {
      this.comparePassword()
    }
  },
  mounted () {
    this.getOrganizations()
  },
  created: function () {
    this.checkEmail = _debounce(this.checkEmailExist, 500)
  },
  methods: {
    createAccount: function () {
      let params = {
        user: this.user,
        organizations: this.organizations
      }
      axios.post('/create_user', params)
        .then((response) => {
          this.login(this.user.username, this.user.password)
          this.ui.display_create_account = false
          this.ui.display_join_org_or_create_org = true
          this.user = response.data
        })
        .catch((error) => {
          console.log(error)
        })
    },
    login (username, password) {
      this.$store
        .dispatch('login', {username, password})
        .then((response) => {
          console.log(response)
          // this.$router.push('/')
        })
        .catch((error) => console.log(error))
    },
    jointToOrg: function () {
      let params = {
        org_to_join: this.org_selected
      }
      axios.patch('/users/update_my_profile', params)
        .then((response) => {
          console.log(response)
          this.ui.display_join_org = false
          this.ui.display_end_affiliation = true
        })
        .catch((error) => {
          console.log(error)
        })
    },
    checkEmailExist: function () {
      axios.get(`/users/check_email?email=${this.user.username}`)
        .then((response) => {
          if (response.data.error === false) {
            this.ui.username_validation = true
          } else {
            this.ui.username_validation = false
          }
        })
        .catch((error) => {
          console.log(error)
        })
    },
    comparePassword: function () {
      if (this.ui.display_create_account === true) {
        let password = this.user.password.trim()
        let password2 = this.user.password_2.trim()
        this.ui.password_validation = false

        if (password !== '' && password2 !== '') {
          if (password === password2) {
            this.ui.password_validation = true
          }
        }
      } else {
        this.ui.password_validation = false
      }
    },
    getOrganizations: function () {
      axios.get('/api/organizations?personal_organization=false')
        .then((response) => {
          this.all_organizations = response.data
        })
        .catch((error) => {
          console.log(error)
        })
    },
    showJoinOrgCard: function () {
      this.ui.display_join_org_or_create_org = false
      this.ui.display_join_org = true
    },
    showCreateOrgCard: function () {
      this.ui.display_join_org_or_create_org = false
      this.ui.display_create_org = true
    },
    cancelCardShowOptions: function () {
      this.ui.display_join_org_or_create_org = true
      this.ui.display_create_org = false
      this.ui.display_join_org = false
    }
  }
}
</script>

<style>

</style>
