<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="py-5">
        <h2>{{ $t("profile.title") }}</h2>
      </b-container>
    </b-container>
    <b-container class="pt-5 pb-5">
      <b-alert variant="success" :show="showAlert()" dismissible>{{msg}}</b-alert>
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
    <subscribe :show="showSubscribe" @resetshowSubscribe="resetshowSubscribe"></subscribe>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import subscribe from '@/components/commons/subscribe.vue'
import { Trans } from '@/plugins/Translation'

export default {
  name: 'viewProfile',
  components: {
    subscribe
  },
  data () {
    return {
      new_password: null,
      new_password_repeat: null,
      msg: '',
      showSubscribe: false,
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
    password () {
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
          this.new_password = null
          this.new_password_repeat = null
          this.msg = this.$t('profile.password_changed')
          this.showSubscribe = true
        })
    },
    showAlert: function () {
      if (this.msg.length) {
        return true
      }
      return false
    },
    resetshowSubscribe: function () {
      this.showSubscribe = false
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
