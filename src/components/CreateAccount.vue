<template>
  <div>
    <b-container>
      <b-row>
        <b-col class="mt-4" cols="12" md="10" lg="8" offset-md="1" offset-lg="2">
          <b-form>
            <b-card
              v-if="ui.display_create_account"
              :header="$t('account.create_account')">
              <b-form-group
                id="input_group_name"
                :label="$t('account.name_label')"
                label-for="input_name">
                <b-form-input
                  id="input_name"
                  type="text"
                  :placeholder="$t('account.name_placeholder')"
                  v-model="user.first_name"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_surname"
                :label="$t('account.surname_label')"
                label-for="input_surname">
                <b-form-input
                  id="input_surname"
                  type="text"
                  :placeholder="$t('account.surname_placeholder')"
                  v-model="user.last_name"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_email"
                :label="$t('account.email_label')"
                label-for="input_email">
                <b-form-input
                  id="input_email"
                  :state="ui.username_validation"
                  required
                  aria-describedby="input-live-help input-live-feedback"
                  :placeholder="$t('account.email_placeholder')"
                  v-model.trim="user.username">
                </b-form-input>
                <b-form-text
                  id="input-live-feedback"
                  v-if="!ui.username_validation && ui.username_validation !== null">{{ $t('account.email_exists_error') }}</b-form-text>
                <b-form-text
                  id="input-live-help">{{ $t('account.email_username_hint') }}</b-form-text>
              </b-form-group>
              <b-form-group
                v-if="false"
                id="input_group_affiliation"
                :label="$t('account.affiliation_label')"
                label-for="input_affiliation">
                <b-form-input
                  id="input_affiliation"
                  type="text"
                  :placeholder="$t('account.affiliation_placeholder')"
                  v-model="user.affiliation"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_password"
                :label="$t('account.password_label')"
                label-for="input_password">
                <b-form-input
                  id="input_password"
                  type="password"
                  required
                  :placeholder="$t('account.password_placeholder')"
                  v-model="user.password"></b-form-input>
              </b-form-group>
              <b-form-group
                id="input_group_repeat_password"
                :label="$t('account.repeat_password_label')"
                label-for="input_repeat_password">
                <b-form-input
                  id="input_repeat_password"
                  type="password"
                  required
                  :placeholder="$t('account.repeat_password_placeholder')"
                  v-model="user.password_2"></b-form-input>
              </b-form-group>

              <b-card-text class="text-center text-forgot-create">
                <router-link :to="{name: 'Login'}">{{ $t('common.login') }}</router-link> | <router-link :to="{name: 'ForgotPassword'}">{{ $t('auth.forgot_password') }}</router-link>
              </b-card-text>
              <div
                slot="footer"
                class="text-right">
                <b-button
                  variant="outline-primary"
                  :disabled="!(ui.username_validation && ui.password_validation)"
                  @click="createAccount">{{ $t('account.create_account_btn') }}</b-button>
              </div>
            </b-card>
          </b-form>
        </b-col>
        <b-col class="mt-4" cols="12" md="10" lg="8" offset-md="1" offset-lg="2">
          <b-card
            v-if="ui.display_join_org_or_create_org"
            :header="$t('account.account_created')">
            <p>
              {{ $t('account.individual_info') }}
            </p>
            <p>
              {{ $t('account.share_info') }}
            </p>
            <b-row>
              <b-col cols="12" sm="6" class="text-center">
                <b-button
                  variant="outline-success"
                  block
                  size="lg"
                  @click="showJoinOrgCard">{{ $t('common.join') }}</b-button>
              </b-col>
              <b-col cols="12" sm="6" class="text-center">
                <b-button
                  variant="outline-success"
                  block
                  size="lg"
                  @click="showCreateOrgCard">{{ $t('common.create') }}</b-button>
              </b-col>
            </b-row>
          </b-card>
        </b-col>
        <b-col class="mt-4" cols="12" md="10" lg="8" offset-md="1" offset-lg="2">
          <b-card
            v-if="ui.display_join_org"
            :header="$t('account.join_organization')">
            <b-form-group
              :label="$t('account.organization_label')"
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
                @click="cancelCardShowOptions">{{ $t('common.cancel') }}</b-button>
              <b-button
                variant="outline-primary"
                @click="jointToOrg">{{ $t('common.join') }}</b-button>
            </div>
          </b-card>
        </b-col>
        <b-col class="mt-4" cols="12" md="10" lg="8" offset-md="1" offset-lg="2">
          <b-card
            v-if="ui.display_create_org"
            :header="$t('account.create_organization')">
            <b-form-group
              :label="$t('common.name')"
              label-for="organization-name">
              <b-form-input
                id="organization-name"
                type="text"
                v-model="organization.name">
              </b-form-input>
            </b-form-group>
            <b-form-group
              :label="$t('account.website_label')"
              label-for="organization-website">
              <b-form-input
                id="organization-website"
                type="url"
                :placeholder="$t('account.website_placeholder')"
                v-model="organization.website">
              </b-form-input>
            </b-form-group>
            <b-form-group>
              <b-form-checkbox
                v-model="organization.nonprofit"
                value="false"
                unchecked-value="true">{{ $t('account.nonprofit_confirm') }}</b-form-checkbox>
            </b-form-group>
            <b-form-group :label="$t('account.plan_label')">
              <b-form-radio-group
                id="option-plans"
                v-model="organization.selected_plan"
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
                    <li>{{ $t('account.users_label') }}: {{plan.specs.users}}</li>
                    <li>{{ $t('account.tables_label') }}: {{plan.specs.tables}}</li>
                    <li>{{ $t('account.price_label') }}: {{plan.specs.price}}</li>
                  </ul>
                </b-card>
              </b-col>
            </b-row>
            <div
              slot="footer"
              class="text-right">
              <b-button
                variant="outline-danger"
                @click="cancelCardShowOptions">{{ $t('common.cancel') }}</b-button>
              <b-button
                variant="outline-primary"
                @click="organizationRequest">{{ $t('account.create_and_join') }}</b-button>
            </div>
          </b-card>
        </b-col>
        <b-col class="mt-4" cols="12" md="10" lg="8" offset-md="1" offset-lg="2">
          <b-card
            v-if="ui.display_end_affiliation"
            :header="$t('account.you_are_done')">
            <p>{{ $t('account.can_create_share') }}</p>
            <div class="text-right">
              <b-button
                variant="outline-success"
                :to="{name: 'Organizations'}">{{ $t('account.go_to_organizations') }}</b-button>
            </div>
          </b-card>
          <b-card
            v-if="ui.display_end_org_creation"
            :header="$t('account.thanks_registering')">
            <p>{{ $t('account.start_using_now') }}</p>
            <div class="text-right">
              <b-button
                variant="outline-success"
                :to="{name: 'Organizations'}">{{ $t('account.go_to_organizations') }}</b-button>
            </div>
          </b-card>
        </b-col>
      </b-row>
    </b-container>

    <subscribe :show="showSubscribe" :isCreatedAccount="true" @doLogin="login(user.username, user.password)"></subscribe>
  </div>
</template>

<script>
import axios from 'axios'
import _debounce from 'lodash.debounce'
import subscribe from '@/components/commons/subscribe.vue'

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
        display_end_affiliation: false,
        display_end_org_creation: false
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
      organization: {
        name: '',
        website: '',
        nonprofit: true,
        selected_plan: false
      },
      plansData: [
        {value: 'small', specs: {users: 10, tables: 20, priceKey: 'plan_free'}},
        {value: 'medium', specs: {users: 50, tables: 200, priceKey: 'plan_1000'}},
        {value: 'large', specs: {usersKey: 'plan_contact', tablesKey: 'plan_contact', priceKey: 'plan_contact'}}
      ],
      showSubscribe: false
    }
  },
  components: {
    subscribe
  },
  computed: {
    plans () {
      return this.plansData.map(plan => {
        const textKey = `account.plan_${plan.value}`
        const specs = {
          users: plan.specs.usersKey ? this.$t(`account.${plan.specs.usersKey}`) : plan.specs.users,
          tables: plan.specs.tablesKey ? this.$t(`account.${plan.specs.tablesKey}`) : plan.specs.tables,
          price: this.$t(`account.${plan.specs.priceKey}`)
        }
        return {
          text: this.$t(textKey),
          value: plan.value,
          specs: specs
        }
      })
    }
  },
  watch: {
    'user.username': function () {
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
    validEmail: function (email) {
      var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      if (re.test(email)) {
        this.ui.username_validation = true
      } else {
        this.ui.username_validation = false
      }
    },
    createAccount: function () {
      let params = {
        user: this.user,
        organizations: this.organizations
      }
      if (Object.prototype.hasOwnProperty.call(this.$route.query, 'o') &&
        Object.prototype.hasOwnProperty.call(this.$route.query, 'p') &&
        Object.prototype.hasOwnProperty.call(this.$route.query, 'r')) {
        params.shared = {
          o: this.$route.query['o'],
          p: this.$route.query['p'],
          r: this.$route.query['r']
        }
      }
      axios.post('/create_user', params)
        .then(() => {
          // this.login(this.user.username, this.user.password)
          this.showSubscribe = true
        })
        .catch((error) => {
          console.log(error)
        })
    },
    login (username, password) {
      this.$store
        .dispatch('login', {username, password})
        .then((response) => {
          this.ui.display_create_account = false
          this.ui.display_join_org_or_create_org = false
          this.user = response.data
          let orgPath = {'id': response.data.personal_organization}
          const path = { 'name': 'viewOrganization', 'params': orgPath }
          this.$router.push(path)
        })
        .catch((error) => console.log(error))
    },
    jointToOrg: function () {
      let params = {
        org_to_join: this.org_selected
      }
      axios.patch('/users/update_my_profile', params)
        .then((response) => {
          this.ui.display_join_org = false
          this.ui.display_end_affiliation = true
        })
        .catch((error) => {
          console.log(error)
        })
    },
    organizationRequest: function () {
      let params = {
        billing: {
          plan: this.organization.selected_plan
        },
        for_profit: this.organization.nonprofit,
        name: this.organization.name,
        website: this.organization.website
      }
      axios.post('/organizations/request_new', params)
        .then((response) => {
          this.ui.display_create_org = false
          this.ui.display_end_org_creation = true
        })
        .catch((error) => {
          console.log(error)
        })
    },
    checkEmailExist: function () {
      const email = this.user.username.trim()
      axios.get(`/users/check_email?email=${email}`)
        .then((response) => {
          if (response.data.error === false) {
            this.ui.username_validation = true
          } else {
            this.ui.username_validation = false
          }
        })
        .then(() => {
          if (this.ui.username_validation) {
            this.validEmail(email)
          } else {
            this.ui.username_validation = false
          }
        })
        .catch((error) => {
          console.log(error)
        })
    },
    comparePassword: function () {
      if (this.user.password !== this.user.password_2) {
        this.ui.password_validation = false
        return
      }
      if (this.user.password === null || this.user.password_2 === null) {
        this.ui.password_validation = false
        return
      }
      if (this.user.password.length < 8 || this.user.password_2 < 8) {
        this.ui.password_validation = false
        return
      }
      this.ui.password_validation = true
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
