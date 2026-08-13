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
              <p>{{ $t('profile.theme') }}</p>
            </b-td>
            <b-td>
              <b-form-select
                v-model="selectedTheme"
                :options="themeOptions"
                @change="onThemeChange">
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

      <hr class="my-5">

      <section>
        <h4>{{ $t('gdpr.export.sectionTitle') }}</h4>
        <p>{{ $t('gdpr.export.description') }}</p>
        <b-button variant="outline-primary" @click="exportData">
          {{ $t('gdpr.export.button') }}
        </b-button>
      </section>
    </b-container>

    <b-modal
      id="modal-export-data"
      :title="$t('gdpr.export.modalTitle')"
      @hidden="resetExportModal">
      <p>{{ $t('gdpr.export.passwordPrompt') }}</p>
      <b-form-input
        type="password"
        v-model="exportPassword"
        :placeholder="$t('gdpr.export.passwordPlaceholder')"
        @keyup.enter="confirmExportData"></b-form-input>

      <b-alert :show="!!exportError" variant="danger" class="mt-3">
        {{ exportError }}
      </b-alert>

      <div slot="modal-footer">
        <b-button variant="outline-secondary" @click="$bvModal.hide('modal-export-data')">
          {{ $t('gdpr.export.cancel') }}
        </b-button>
        <b-button variant="primary" :disabled="isExporting" @click="confirmExportData">
          <b-spinner small v-if="isExporting" class="mr-1"></b-spinner>
          {{ $t('gdpr.export.confirm') }}
        </b-button>
      </div>
    </b-modal>
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
      selectedLanguage: Trans.currentLanguage,
      selectedTheme: this.$store.state.theme,
      isExporting: false,
      exportPassword: '',
      exportError: ''
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
    },
    themeOptions: function () {
      return ['light', 'dark', 'system'].map(t => ({
        value: t,
        text: this.$t(`profile.themes.${t}`)
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
    onThemeChange: function (theme) {
      this.$store.dispatch('setTheme', theme)
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
    exportData: function () {
      this.$bvModal.show('modal-export-data')
    },
    confirmExportData: async function () {
      this.exportError = ''
      if (!this.exportPassword) {
        this.exportError = this.$t('gdpr.export.passwordRequired')
        return
      }

      this.isExporting = true
      try {
        const response = await Api.post('/users/get_full_data', {
          user_id: this.$store.state.user.id,
          password: this.exportPassword
        }, { responseType: 'blob' })

        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'profile_data.zip')
        document.body.appendChild(link)
        link.click()
        // Sin estas dos líneas queda un <a> huérfano en el DOM por cada
        // descarga y el blob retenido en memoria mientras viva la pestaña.
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        this.$bvModal.hide('modal-export-data')
      } catch (error) {
        this.exportError = await this.extractExportError(error)
      } finally {
        this.isExporting = false
      }
    },
    // Traduce el error de la exportación al texto que ve el usuario.
    //
    // El backend responde {result, message} con 400/403/404 —por ejemplo
    // {"result": "invalid_password", "message": "Incorrect password"}—
    // (isoq_server_py310, auth_server/controllers/core.py:489-498), pero la
    // petición pidió responseType 'blob' y axios parsea TAMBIÉN los errores
    // como Blob. Es decir, error.response.data no es un objeto: es un Blob
    // con ese JSON adentro, y leer .message da undefined. Hay que abrirlo.
    //
    // Todo lo que no sea un JSON con message cae al mensaje genérico: un 502
    // de nginx devuelve HTML, y un error de red no trae response.
    extractExportError: async function (error) {
      if (!error || !error.response || !error.response.data) {
        return this.$t('gdpr.export.genericError')
      }

      const blob = error.response.data
      let text
      try {
        if (typeof blob.text === 'function') {
          text = await blob.text()
        } else {
          // jsdom 16.7 —el de los tests— no implementa Blob.text(), aunque
          // los navegadores sí. FileReader existe en los dos.
          text = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = () => reject(reader.error)
            reader.readAsText(blob)
          })
        }
      } catch (err) {
        return this.$t('gdpr.export.genericError')
      }

      // No es JSON válido → genérico.
      let parsed
      try {
        parsed = JSON.parse(text)
      } catch (err) {
        return this.$t('gdpr.export.genericError')
      }

      // Tiene message → lo usamos. En caso contrario, genérico.
      if (parsed && typeof parsed.message === 'string' && parsed.message.length) {
        return parsed.message
      }

      return this.$t('gdpr.export.genericError')
    },
    resetExportModal: function () {
      this.exportPassword = ''
      this.exportError = ''
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
