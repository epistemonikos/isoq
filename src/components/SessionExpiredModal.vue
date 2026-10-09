<template>
  <b-modal
    id="modal-session-expired"
    :visible="visible"
    :title="$t('session_expired.title')"
    no-close-on-backdrop
    no-close-on-esc
    hide-header-close
    centered>
    <p>{{ $t('session_expired.text') }}</p>
    <b-alert :show="Boolean(error)" variant="danger">{{ error ? $t(error) : '' }}</b-alert>
    <b-form @submit.prevent="reLogin">
      <b-form-group :label="$t('auth.email')" label-for="session_expired_email">
        <b-form-input
          id="session_expired_email"
          v-model="username"
          type="email"
          autocomplete="username"
          required></b-form-input>
      </b-form-group>
      <b-form-group :label="$t('auth.password')" label-for="session_expired_password">
        <b-form-input
          id="session_expired_password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          autofocus
          required></b-form-input>
      </b-form-group>
    </b-form>
    <template #modal-footer>
      <b-button variant="link" :disabled="submitting" @click="useAnotherAccount">
        {{ $t('session_expired.another_account') }}
      </b-button>
      <b-button variant="outline-primary" :disabled="submitting || !password" @click="reLogin">
        <b-spinner small v-if="submitting" class="mr-1"></b-spinner>
        {{ $t('common.login') }}
      </b-button>
    </template>
  </b-modal>
</template>

<script>
import Api from '@/utils/Api'
import LockService from '@/services/lockService'
import {
  SESSION_EXPIRED, SESSION_RESTORED, isSessionExpired, clearSessionExpired
} from '@/utils/sessionExpiry'

/*
 * Volver a entrar sin salir de la pantalla.
 *
 * Desde 2026-10-06 la sesión vence tras 8 h sin actividad o a los 7 días. Mandar a la
 * persona al login perdería lo que esté en pantalla —un editor abierto, una celda a medio
 * escribir—, así que el login se hace acá y nada navega: los editores siguen montados, la
 * cola offline sigue en IndexedDB, y al entrar sale lo encolado y el latido recupera los
 * locks.
 *
 * Con OTRA cuenta no se restaura: esa persona heredaría editores y cola ajenos, así que la
 * página se recarga.
 */
export default {
  name: 'SessionExpiredModal',
  data () {
    const user = (this.$store.state && this.$store.state.user) || {}
    return {
      visible: isSessionExpired(),
      username: user.username || user.email || '',
      password: '',
      error: '',
      submitting: false
    }
  },
  mounted () {
    window.addEventListener(SESSION_EXPIRED, this.onExpired)
    window.addEventListener(SESSION_RESTORED, this.onRestored)
  },
  beforeDestroy () {
    window.removeEventListener(SESSION_EXPIRED, this.onExpired)
    window.removeEventListener(SESSION_RESTORED, this.onRestored)
  },
  methods: {
    onExpired () {
      const user = this.$store.state.user || {}
      if (!this.username) this.username = user.username || user.email || ''
      this.error = ''
      this.visible = true
    },
    onRestored () {
      this.visible = false
    },
    async reLogin () {
      if (this.submitting) return
      const previousId = (this.$store.state.user || {}).id
      this.submitting = true
      this.error = ''
      try {
        await this.$store.dispatch('login', { username: this.username, password: this.password })
      } catch (error) {
        const status = error && error.response && error.response.data && error.response.data.status
        if (status === 'invalid_credentials') this.error = 'auth.login_error'
        else if (status === 'password_compromised') this.error = 'auth.password_compromised'
        else this.error = 'session_expired.request_failed'
        this.submitting = false
        return
      }
      this.password = ''
      this.submitting = false
      const currentId = (this.$store.state.user || {}).id
      if (previousId && currentId !== previousId) {
        this.reloadPage()
        return
      }
      clearSessionExpired()
      this.visible = false
      Api.syncPendingOperations()
      LockService.refHeartbeat()
    },
    useAnotherAccount () {
      clearSessionExpired()
      this.visible = false
      this.$store.commit('logout')
      this.$store.commit('save_promise', null)
      this.$router.push({ name: 'Login', query: { redirect: this.$route.fullPath } })
    },
    reloadPage () {
      window.location.reload()
    }
  }
}
</script>
