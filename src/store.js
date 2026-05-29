import Vue from 'vue'
import Vuex from 'vuex'
import Api from '@/utils/Api'
import * as Sentry from '@sentry/vue'

Vue.use(Vuex)

export function parseUserFromResponse (data) {
  const userObject = data.user ? data.user : data
  if (data.access_token && !userObject.access_token) {
    userObject.access_token = data.access_token
  }
  if (!userObject.status && data.status) {
    userObject.status = data.status
  }
  return userObject
}

export const store = new Vuex.Store({
  state: {
    status: '',
    token: localStorage.getItem('l_s') || null,
    user: {},
    isOnline: navigator.onLine,
    theme: localStorage.getItem('user_theme') || 'light'
  },
  mutations: {
    SET_ONLINE (state, status) {
      state.isOnline = status
    },
    auth_request (state) {
      state.status = 'loading'
    },
    auth_success (state, user) {
      state.status = 'success'
      state.user = user
      const token = (user.access_token && user.access_token !== 'null')
        ? user.access_token
        : state.token
      if (token && token !== 'null') {
        state.token = token
        state.user.access_token = token
        localStorage.setItem('l_s', token)
      }
      localStorage.setItem('user-data', JSON.stringify(state.user))
      Sentry.setUser({ id: user.id, email: user.email, username: user.email })
    },
    auth_error (state) {
      state.status = 'error'
    },
    logout (state) {
      state.status = ''
      state.token = null
      state.user = {}
      localStorage.removeItem('user-data')
      localStorage.removeItem('l_s')
      localStorage.removeItem('token')
      Sentry.setUser(null)
    },
    user_can (state, _bool) {
      state.user.can_write_other_orgs = _bool
    },
    is_owner (state, _bool) {
      state.user.is_owner = _bool
    },
    change_status (state) {
      state.status = ''
    },
    save_promise (state, promise) {
      state.promise = promise
    },
    SET_THEME (state, theme) {
      state.theme = theme
      localStorage.setItem('user_theme', theme)
    }
  },
  actions: {
    setTheme ({ commit }, theme) {
      commit('SET_THEME', theme)
    },
    login ({commit}, user) {
      return new Promise((resolve, reject) => {
        commit('auth_request')
        const formData = new FormData()
        formData.append('username', user.username)
        formData.append('password', user.password)
        Api.post('/auth/login', formData)
          .then(response => {
            const data = response.data
            if (data.status === 'email_not_verified') {
              commit('auth_error')
              localStorage.removeItem('token')
              reject({ response: { data } })
              return
            }
            if (data.status === 'password_compromised') {
              commit('auth_error')
              localStorage.removeItem('token')
              reject({ response: { data } })
              return
            }
            if (data.status !== 'invalid_credentials') {
              commit('auth_success', parseUserFromResponse(data))
              commit('save_promise', Promise.resolve())
              resolve(response)
            } else {
              commit('auth_error')
              localStorage.removeItem('token')
            }
          })
          .catch(error => {
            commit('auth_error')
            localStorage.removeItem('token')
            reject(error)
          })
      })
    },
    logout ({commit}) {
      return new Promise((resolve, reject) => {
        Api.get('/auth/logout').then(() => {
          commit('logout')
          // Al desloguearse, resetear el promise para que la próxima navegación dispare getLogginInfo
          commit('save_promise', null)
          resolve()
        }).catch((error) => {
          reject(error)
        })
      })
    },
    usercan ({commit}, _bool) {
      commit('user_can', _bool)
    },
    isowner ({commit}, _bool) {
      commit('is_owner', _bool)
    },
    changeStatus ({commit}) {
      commit('change_status')
    },
    forcedLogin ({ commit }, userId) {
      return new Promise((resolve, reject) => {
        Api.post('/auth/forced_login', { user_id: userId })
          .then(response => {
            const data = response.data
            commit('auth_success', parseUserFromResponse(data))
            commit('save_promise', Promise.resolve())
            resolve(data)
          })
          .catch(error => {
            reject(error)
          })
      })
    },
    getLogginInfo ({commit}) {
      const hasToken = !!this.state.token
      // Si ya estamos logueados satisfactoriamente y tenemos token, nos aseguramos de tener un promise resuelto
      if (this.state.status === 'success' && hasToken) {
        commit('save_promise', Promise.resolve())
        return
      }

      // Si no tenemos status o hubo un error previo, o si perdimos el token estando logueados, pedimos info al servidor
      if (this.state.status === '' || this.state.status === 'error' || (this.state.status === 'success' && !hasToken)) {
        let promise = new Promise((resolve, reject) => {
          Api.post('/auth/user', null).then((response) => {
            const data = response.data
            if (data.status !== 'not_logged' && data.status !== 'invalid_credentials') {
              const userObject = parseUserFromResponse(data)
              const finalToken = userObject.access_token || this.state.token
              if (!finalToken || finalToken === 'null') {
                console.warn('Session is valid by cookie but missing access_token header. Forcing logout for robustness.')
                commit('logout')
              } else {
                commit('auth_success', userObject)
              }
            } else {
              commit('logout')
            }
            resolve()
          }).catch((error) => {
            console.log(error)
            // If offline or network error, try to restore from localStorage
            const isOffline = !navigator.onLine ||
                              (error.message && error.message.includes('Network Error')) ||
                              error.isOfflineError === true

            if (isOffline) {
              const userData = localStorage.getItem('user-data')
              if (userData) {
                try {
                  const user = JSON.parse(userData)
                  commit('auth_success', user)
                  console.log('Restored user session from local storage (offline mode)')
                  resolve()
                  return
                } catch (e) {
                  console.error('Error parsing stored user data', e)
                }
              }
            }

            commit('logout')
            reject(error)
          })
        })
        commit('save_promise', promise)
      } else if (this.state.status === 'success' && !this.state.promise) {
        // Asegurarse de tener un promise resuelto si ya estamos logueados
        commit('save_promise', Promise.resolve())
      }
    }
  },
  getters: {
    isLoggedIn: state => !!state.user.status && !!state.token && state.token !== 'null',
    authStatus: state => state.status
  }
})
