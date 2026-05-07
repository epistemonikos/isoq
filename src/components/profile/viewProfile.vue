<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="py-5">
        <h2>{{ $t("profile.title") }}</h2>
      </b-container>
    </b-container>
    <b-container class="pt-3 pb-5">
      <b-alert :variant="msgVariant" :show="showAlert()" dismissible>{{msg}}</b-alert>
      <b-table-simple>
        <b-tbody>
          <b-tr>
            <b-td>
              <p>{{ $t('profile.username') }}</p>
            </b-td>
            <b-td>
              {{username}}
            </b-td>
          </b-tr>
          <b-tr>
            <b-td>
              <p>{{ $t('profile.name') }}</p>
            </b-td>
            <b-td>
              {{fullname}}
            </b-td>
          </b-tr>
          <b-tr>
            <b-td>
              <p>{{ $t('profile.language') }}</p>
            </b-td>
            <b-td>
              <b-form-select
                v-model="selectedLanguage"
                :options="languageOptions"
                @change="onLanguageChange">
              </b-form-select>
            </b-td>
          </b-tr>
          <b-tr>
            <b-td>
              <p>{{ $t('profile.new_password') }}</p>
            </b-td>
            <b-td>
              <b-form-group
                :description="$t('profile.password_hint')"
                class="mb-0">
                <b-form-input type="password" v-model="new_password"></b-form-input>
            </b-form-group>
            </b-td>
          </b-tr>
          <b-tr>
            <b-td>
              <p>{{ $t('profile.repeat_password') }}</p>
            </b-td>
            <b-td>
              <b-form-group
                :description="$t('profile.password_hint')"
                class="mb-0">
                <b-form-input type="password" v-model="new_password_repeat"></b-form-input>
            </b-form-group>
            </b-td>
          </b-tr>
        </b-tbody>
      </b-table-simple>
      <b-button @click="update" :disabled="isDisabled">{{ $t('common.save') }}</b-button>
    </b-container>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import { Trans } from '@/plugins/Translation'

export default {
  name: 'viewProfile',
  data () {
    return {
      new_password: null,
      new_password_repeat: null,
      msg: '',
      msgVariant: 'success',
      isDisabled: true,
      selectedLanguage: Trans.currentLanguage
    }
  },
  computed: {
    username: function () {
      return this.$store.state.user.name
    },
    fullname: function () {
      return this.$store.state.user.first_name + ' ' + this.$store.state.user.last_name
    },
    languageOptions: function () {
      return Trans.supportedLanguages.map(lang => ({
        value: lang,
        text: this.$t(`profile.languages.${lang}`)
      }))
    }
  },
  watch: {
    new_password () {
      this.checkDisabled()
    },
    new_password_repeat () {
      this.checkDisabled()
    },
    msg () {
      if (this.msg.length) {
        this.showAlert()
      }
    }
  },
  methods: {
    onLanguageChange: function (lang) {
      Trans.changeLanguage(lang).then(() => {
        this.selectedLanguage = lang
      })
    },
    update: function () {
      this.msg = ''
      const params = {
        user_id: this.$store.state.user.id,
        new_password: this.new_password
      }
      Api.post(`/users/change_password`, params)
        .then((r) => {
          const data = r.data
          if (data.status === 'password_compromised') {
            this.msgVariant = 'danger'
            this.msg = this.$t('account.password_compromised')
          } else {
            this.new_password = null
            this.new_password_repeat = null
            this.msgVariant = 'success'
            this.msg = this.$t('profile.password_changed')
          }
        })
    },
    showAlert: function () {
      if (this.msg.length) {
        return true
      }
      return false
    },
    checkDisabled: function () {
      if (this.new_password !== this.new_password_repeat) {
        this.isDisabled = true
        return
      }
      if (this.new_password === null) {
        this.isDisabled = true
        return
      }
      if (this.new_password.length < 8) {
        this.isDisabled = true
        return
      }
      this.isDisabled = false
    }
  }
}
</script>

<style>

</style>
