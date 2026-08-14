<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="py-5">
        <h2>{{ $t("profile.title") }}</h2>
      </b-container>
    </b-container>
    <b-container class="pt-5 pb-5">
      <p>{{ $t('gdpr.profile.intro') }}</p>
      <b-alert :variant="msgVariant" :show="showAlert()" dismissible>{{msg}}</b-alert>

      <b-card no-body class="p-3">
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
      <ul class="list-unstyled">
        <li>
          <b-form-checkbox v-model="newsletter">
            {{ $t('gdpr.preferences.newsletter') }}
          </b-form-checkbox>
        </li>
        <li>
          <b-form-checkbox v-model="improvement">
            {{ $t('gdpr.preferences.improvement') }}
          </b-form-checkbox>
        </li>
      </ul>

      <div class="mt-3">
        <b-button variant="primary" @click="update" :disabled="isDisabled">
          <b-spinner small v-if="isSavingProfile" class="mr-1"></b-spinner>
          {{ $t('common.save') }}
        </b-button>
      </div>
      </b-card>

      <b-card no-body class="mt-3 p-3">
        <h3>{{ $t('gdpr.manageData.title') }}</h3>

        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <p class="m-0 mr-md-4">
            <b>{{ $t('gdpr.export.label') }}</b> {{ $t('gdpr.export.description') }}
          </p>
          <b-button
            variant="outline-primary"
            class="mt-3 mt-md-0 flex-shrink-0 text-nowrap"
            :disabled="isExporting"
            @click="exportData">
            <b-spinner v-if="isExporting" small class="mr-2"></b-spinner>
            {{ $t('gdpr.export.button') }}
          </b-button>
        </div>

        <b-alert show class="mt-3">
          <p>{{ $t('gdpr.export.noteIntro') }}</p>
          <ul>
            <li>{{ $t('gdpr.export.note1') }}</li>
            <li>{{ $t('gdpr.export.note2') }}</li>
            <li>{{ $t('gdpr.export.note3') }}</li>
            <li>{{ $t('gdpr.export.note4') }}</li>
          </ul>
          <p class="mb-0">
            {{ $t('gdpr.export.noteFooter') }}
            <router-link :to="{ name: 'PrivacyAndTerms', query: { tab: 'privacy' } }">
              {{ $t('gdpr.export.privacyPolicy') }}
            </router-link>
          </p>
        </b-alert>

        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <p class="m-0 mr-md-4">
            <b>{{ $t('gdpr.deleteAccount.label') }}</b> {{ $t('gdpr.deleteAccount.description') }}
          </p>
          <b-button
            variant="outline-danger"
            class="mt-3 mt-md-0 flex-shrink-0 text-nowrap"
            :disabled="isDeletingAccount"
            @click="deleteAccount">
            <b-spinner v-if="isDeletingAccount" small class="mr-2"></b-spinner>
            {{ $t('gdpr.deleteAccount.button') }}
          </b-button>
        </div>

        <b-alert show variant="warning" class="mt-3">
          <p>{{ $t('gdpr.deleteAccount.noteIntro') }}</p>
          <ul>
            <li>{{ $t('gdpr.deleteAccount.note1') }}</li>
            <li>{{ $t('gdpr.deleteAccount.note2') }}</li>
            <li>{{ $t('gdpr.deleteAccount.note3') }}</li>
            <li>{{ $t('gdpr.deleteAccount.note4') }}</li>
            <li>{{ $t('gdpr.deleteAccount.note5') }}</li>
            <li>{{ $t('gdpr.deleteAccount.note6') }}</li>
          </ul>
          <p class="mb-0">
            {{ $t('gdpr.deleteAccount.noteFooter') }}
            <router-link :to="{ name: 'PrivacyAndTerms', query: { tab: 'privacy' } }">
              {{ $t('gdpr.export.privacyPolicy') }}
            </router-link>
            {{ $t('gdpr.deleteAccount.and') }}
            <router-link :to="{ name: 'PrivacyAndTerms', query: { tab: 'terms' } }">
              {{ $t('gdpr.deleteAccount.termsAndConditions') }}
            </router-link>
          </p>
        </b-alert>
      </b-card>

      <b-card no-body class="mt-3 p-3">
        <h3>{{ $t('gdpr.contact.sectionTitle') }}</h3>
        <p class="m-0">{{ $t('gdpr.contact.dataNote') }}</p>

        <b-card class="p-3 mt-3">
          <b-alert
            :show="!!contactMsg"
            :variant="contactMsgVariant"
            dismissible
            @dismissed="contactMsg = ''">{{ contactMsg }}</b-alert>

          <b-form-group
            :label="$t('gdpr.contact.subjectLabel')"
            :description="$t('gdpr.contact.subjectLabel')"
            label-for="input_privacy_subject"
            :state="subjectState"
            :invalid-feedback="$t('gdpr.contact.subjectFeedback')">
            <b-form-input
              id="input_privacy_subject"
              v-model="subject"
              :state="subjectState"
              trim></b-form-input>
          </b-form-group>

          <b-form-group
            :label="$t('gdpr.contact.messageLabel')"
            :description="$t('gdpr.contact.messageLabel')"
            label-for="input_privacy_message"
            :state="messageState"
            :invalid-feedback="$t('gdpr.contact.messageFeedback')">
            <b-form-textarea
              id="input_privacy_message"
              v-model="message"
              :placeholder="$t('gdpr.contact.messagePlaceholder')"
              rows="3"
              max-rows="6"
              :state="messageState"></b-form-textarea>
          </b-form-group>

          <div class="mt-3">
            <b-button
              variant="primary"
              :disabled="!isContactFormValid || isSendingContact"
              @click="sendContact">
              <b-spinner v-if="isSendingContact" small class="mr-2"></b-spinner>
              {{ $t('gdpr.contact.send') }}
            </b-button>
          </div>
        </b-card>
      </b-card>
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

    <b-modal
      id="modal-delete-account"
      :title="$t('gdpr.deleteAccount.modalTitle')"
      @hidden="resetDeleteModal">
      <b-alert show variant="danger">{{ $t('gdpr.deleteAccount.warning') }}</b-alert>

      <div v-if="isLoadingSharedProjects" class="text-center my-3">
        <b-spinner small></b-spinner>
      </div>

      <div v-else-if="sharedProjects.length">
        <p>{{ $t('gdpr.deleteAccount.transferIntro') }}</p>
        <b-form-group
          v-for="project in sharedProjects"
          :key="project.id"
          :label="project.name"
          :label-for="`new_owner_${project.id}`">
          <b-form-select
            :id="`new_owner_${project.id}`"
            v-model="projectsNewOwners[project.id]"
            :options="project.candidates">
            <template slot="first">
              <option :value="null" disabled>{{ $t('gdpr.deleteAccount.selectPlaceholder') }}</option>
            </template>
          </b-form-select>
        </b-form-group>
        <p class="text-muted small">{{ $t('gdpr.deleteAccount.readOnlyNote') }}</p>
      </div>

      <p>{{ $t('gdpr.deleteAccount.passwordPrompt') }}</p>
      <b-form-input
        type="password"
        v-model="deletePassword"
        :placeholder="$t('gdpr.deleteAccount.passwordPlaceholder')"></b-form-input>

      <b-alert :show="!!deleteError" variant="danger" class="mt-3">
        {{ deleteError }}
      </b-alert>

      <div slot="modal-footer">
        <b-button variant="outline-secondary" @click="$bvModal.hide('modal-delete-account')">
          {{ $t('gdpr.deleteAccount.cancel') }}
        </b-button>
        <b-button variant="danger" :disabled="isDeletingAccount" @click="confirmDeleteAccount">
          <b-spinner small v-if="isDeletingAccount" class="mr-1"></b-spinner>
          {{ $t('gdpr.deleteAccount.confirm') }}
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import { Trans } from '@/plugins/Translation'
import { isBackendTrue } from '@/constants/backendBoolean'

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
      exportError: '',
      subject: '',
      message: '',
      isSendingContact: false,
      contactMsg: '',
      contactMsgVariant: 'success',
      isDeletingAccount: false,
      deletePassword: '',
      deleteError: '',
      sharedProjects: [],
      projectsNewOwners: {},
      isLoadingSharedProjects: false,
      newsletter: false,
      improvement: false,
      // Copia de lo que había al cargar, para no mandar un POST cuando el
      // usuario abre el perfil y se va sin tocar nada.
      initialNewsletter: false,
      initialImprovement: false,
      isSavingProfile: false
    }
  },
  mounted () {
    this.initCheckboxes()
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
    },
    // Los tres valores de :state en Bootstrap-Vue: true, false y null.
    // null es el estado neutro y se reserva para el campo vacío — el que
    // nadie tocó todavía no se pinta de rojo. Devolver null en vez de false
    // para un valor insuficiente esconde el :invalid-feedback y deja el
    // botón deshabilitado sin decir por qué.
    subjectState: function () {
      if (this.subject.length === 0) return null
      // Sobre el texto recortado: doce espacios no son un asunto.
      return this.subject.trim().length >= 10
    },
    messageState: function () {
      if (this.message.length === 0) return null
      // filter(Boolean) descarta el elemento vacío que deja split cuando el
      // texto empieza con espacio, que si no contaría como una palabra. \s+
      // cubre también los saltos de línea del textarea.
      const words = this.message.trim().split(/\s+/).filter(Boolean)
      return words.length >= 5
    },
    isContactFormValid: function () {
      return this.subjectState === true && this.messageState === true
    },
    allProjectsHaveNewOwner: function () {
      if (this.sharedProjects.length === 0) return true
      return this.sharedProjects.every(p => {
        const owner = this.projectsNewOwners[p.id]
        return owner !== null && owner !== undefined
      })
    }
  },
  watch: {
    new_password () {
      this.checkDisabled()
    },
    new_password_repeat () {
      this.checkDisabled()
    },
    newsletter () {
      this.checkDisabled()
    },
    improvement () {
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
    // Un solo botón guarda la contraseña y las preferencias, porque en la
    // pantalla comparten tarjeta. Cada cosa se manda sólo si cambió: escribir
    // una contraseña no debe reescribir las preferencias, ni al revés.
    update: async function () {
      const validPassword = !!this.new_password &&
        this.new_password === this.new_password_repeat &&
        this.new_password.length >= 8
      const preferencesChanged = this.newsletter !== this.initialNewsletter ||
        this.improvement !== this.initialImprovement

      if (!validPassword && !preferencesChanged) return
      if (this.isSavingProfile) return

      this.msg = ''
      this.isSavingProfile = true
      try {
        if (validPassword) {
          const response = await Api.post('/users/change_password', {
            user_id: this.$store.state.user.id,
            new_password: this.new_password
          })
          if (response.data && response.data.status === 'password_compromised') {
            this.msgVariant = 'danger'
            this.msg = this.$t('account.password_compromised')
            return
          }
          this.new_password = null
          this.new_password_repeat = null
          this.msgVariant = 'success'
          this.msg = this.$t('profile.password_changed')
        }

        if (preferencesChanged) {
          await this.savePreferences()
        }
      } catch (error) {
        this.msgVariant = 'danger'
        this.msg = this.$t('gdpr.preferences.error')
      } finally {
        this.isSavingProfile = false
        this.checkDisabled()
      }
    },
    showAlert: function () {
      if (this.msg.length) {
        return true
      }
      return false
    },
    // Lleva las preferencias del store a las casillas, normalizadas.
    //
    // El backend devuelve estos campos con tipos mezclados; qué cuenta como
    // verdadero lo decide isBackendTrue, que es la misma regla que usa el
    // servidor y la que aplica needsTermsAcceptance a terms_accepted.
    initCheckboxes: function () {
      const user = this.$store.state.user || {}

      this.newsletter = isBackendTrue(user.newsletter)
      this.improvement = isBackendTrue(user.improvement)

      // Sin esta copia, savePreferences vería un cambio pendiente apenas se
      // abre el perfil y mandaría un POST que nadie pidió.
      this.initialNewsletter = this.newsletter
      this.initialImprovement = this.improvement
    },
    // La llama update(); no tiene botón propio. Deja que el error suba para
    // que update() lo reporte en una sola alerta.
    savePreferences: async function () {
      try {
        // Se mandan las dos siempre: el backend reescribe ambos campos en
        // cada llamada (core.py:470-471), así que omitir una la pondría en
        // false sin que el usuario lo haya pedido.
        await Api.post('/users/update_info', {
          user_id: this.$store.state.user.id,
          newsletter: this.newsletter,
          improvement: this.improvement
        })

        // Sólo tras confirmar: si falla, el cambio sigue pendiente y el
        // usuario puede reintentar.
        this.initialNewsletter = this.newsletter
        this.initialImprovement = this.improvement
        this.$store.dispatch('updateUser', {
          newsletter: this.newsletter,
          improvement: this.improvement
        })
        this.msg = this.$t('gdpr.preferences.success')
        this.msgVariant = 'success'
      } catch (error) {
        this.msg = this.$t('gdpr.preferences.error')
        this.msgVariant = 'danger'
        throw error
      }
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
    // El backend saca el usuario del token (core.py:737), así que el payload
    // lleva sólo asunto y mensaje. Despacha un correo real al buzón de
    // privacidad: la guarda de isSendingContact evita mandarlo dos veces.
    sendContact: async function () {
      if (!this.isContactFormValid || this.isSendingContact) return

      this.isSendingContact = true
      this.contactMsg = ''
      try {
        await Api.post('/users/privacy_contact', {
          subject: this.subject,
          message: this.message
        })
        this.contactMsg = this.$t('gdpr.contact.success')
        this.contactMsgVariant = 'success'
        this.subject = ''
        this.message = ''
      } catch (error) {
        // No se limpia el formulario: obligaría a reescribir todo el mensaje.
        this.contactMsg = this.$t('gdpr.contact.error')
        this.contactMsgVariant = 'danger'
      } finally {
        this.isSendingContact = false
      }
    },
    deleteAccount: function () {
      this.$bvModal.show('modal-delete-account')
      this.loadSharedProjects()
    },
    loadSharedProjects: async function () {
      this.isLoadingSharedProjects = true
      try {
        const response = await Api.get('/api/getProjects')
        const allProjects = response.data || []
        const myOrg = this.$store.state.user.personal_organization

        // Sólo los propios y compartidos. El backend usa este mismo criterio
        // (core.py:614-621): los propios SIN colaboradores no se transfieren,
        // se borran en cascada con todo lo que cuelga de ellos.
        const owned = allProjects.filter(p => {
          if (p.organization !== myOrg) return false
          return (p.can_write || []).length > 0 || (p.can_read || []).length > 0
        })

        // Un solo GET por usuario y todos en paralelo. El original los pedía
        // dentro de un bucle anidado y en serie: 10 proyectos × 5
        // colaboradores eran 50 peticiones encadenadas.
        const uniqueIds = [...new Set(owned.flatMap(p => [
          ...(p.can_write || []),
          ...(p.can_read || [])
        ]))]

        const fetched = await Promise.all(uniqueIds.map(uid =>
          Api.get(`/users/${uid}`).then(r => [uid, r.data]).catch(() => [uid, null])
        ))
        const usersById = Object.fromEntries(fetched)

        this.sharedProjects = owned
          .map(project => ({
            id: project.id,
            name: project.name,
            candidates: this.buildOwnerCandidates(project, usersById)
          }))
          .filter(p => p.candidates.length > 0)

        this.sharedProjects.forEach(p => this.$set(this.projectsNewOwners, p.id, null))
      } catch (error) {
        this.deleteError = this.$t('gdpr.deleteAccount.genericError')
      } finally {
        this.isLoadingSharedProjects = false
      }
    },
    // Candidatos a nuevo dueño del proyecto, en el formato { value, text }
    // que consume el <b-form-select>.
    //
    // El identificador es la CLAVE de usersById, no un campo del objeto: el
    // GET /users/<id> no devuelve el id dentro del payload.
    buildOwnerCandidates: function (project, usersById) {
      const writers = [...new Set(project.can_write || [])]
      const readers = [...new Set(project.can_read || [])]

      // Escritura primero. Quien está en las dos listas aparece una sola vez
      // y cuenta como escritura, que es el permiso que manda.
      const orderedIds = [...writers, ...readers.filter(uid => !writers.includes(uid))]

      return orderedIds
        .map(uid => {
          // Sin datos (el GET falló) o de baja: no puede heredar el proyecto.
          const user = usersById[uid]
          if (!user || !user.status) return null

          const label = `${user.first_name || ''} ${user.last_name || ''} (${user.username})`
          // El asterisco marca a quien hoy sólo tiene lectura.
          return { value: uid, text: writers.includes(uid) ? label : `${label} *` }
        })
        .filter(Boolean)
    },
    confirmDeleteAccount: async function () {
      this.deleteError = ''
      if (!this.deletePassword) {
        this.deleteError = this.$t('gdpr.deleteAccount.passwordRequired')
        return
      }
      if (!this.allProjectsHaveNewOwner) {
        this.deleteError = this.$t('gdpr.deleteAccount.ownersRequired')
        return
      }
      if (this.isDeletingAccount) return

      this.isDeletingAccount = true
      try {
        // Api.delete(path, data, config): el cuerpo va como segundo
        // argumento y Api lo arma como { ...config, data } (Api.js:529).
        // Envolverlo en { data: ... } mandaría {"data": {...}} anidado y el
        // backend leería password como undefined.
        const response = await Api.delete('/users/delete_account', {
          password: this.deletePassword,
          ownership_transfers: this.projectsNewOwners
        })

        if (response.data && response.data.result === 'success') {
          this.$bvModal.hide('modal-delete-account')
          // El backend ya cerró la sesión de su lado (logout_user); acá hay
          // que limpiar token y localStorage, o la próxima navegación
          // intentaría usar credenciales de una cuenta que ya no existe.
          await this.$store.dispatch('logout')
          this.$router.push({ name: 'Login' })
        } else {
          this.deleteError = (response.data && response.data.message) ||
            this.$t('gdpr.deleteAccount.genericError')
        }
      } catch (error) {
        this.deleteError = (error.response && error.response.data && error.response.data.message) ||
          this.$t('gdpr.deleteAccount.genericError')
      } finally {
        this.isDeletingAccount = false
      }
    },
    resetDeleteModal: function () {
      this.deletePassword = ''
      this.deleteError = ''
      this.sharedProjects = []
      this.projectsNewOwners = {}
      this.isLoadingSharedProjects = false
    },
    // El botón Save cubre la contraseña y las preferencias, así que se
    // habilita si cualquiera de las dos tiene algo que guardar. Antes sólo
    // miraba la contraseña, y cambiar una casilla dejaba el botón muerto.
    checkDisabled: function () {
      const preferencesChanged = this.newsletter !== this.initialNewsletter ||
        this.improvement !== this.initialImprovement
      if (preferencesChanged) {
        this.isDisabled = false
        return
      }

      // Sin contraseña escrita no hay nada más que guardar.
      if (!this.new_password) {
        this.isDisabled = true
        return
      }
      this.isDisabled = this.new_password !== this.new_password_repeat ||
        this.new_password.length < 8
    }
  }
}
</script>

<style>

</style>
