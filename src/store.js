import Vue from 'vue'
import Vuex from 'vuex'
import Api from '@/utils/Api'

Vue.use(Vuex)

export const store = new Vuex.Store({
  state: {
    status: '',
    user: {},
    isOnline: navigator.onLine
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
      localStorage.setItem('user-data', JSON.stringify(user))
      // Solo guardar en l_s si realmente viene un token, para no borrar uno existente
      if (user.access_token && user.access_token !== 'null') {
        localStorage.setItem('l_s', user.access_token)
      } else {
        // Si no viene en el objeto user, intentamos ver si ya estaba en localStorage
        // para mantener la consistencia en el estado del usuario en Vuex
        const savedToken = localStorage.getItem('l_s')
        if (savedToken && savedToken !== 'null') {
          state.user.access_token = savedToken
        }
      }
    },
    auth_error (state) {
      state.status = 'error'
    },
    logout (state) {
      state.status = ''
      state.user = {}
      localStorage.removeItem('user-data')
      localStorage.removeItem('l_s')
      localStorage.removeItem('token')
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
    }
  },
  actions: {
    login ({commit}, user) {
      return new Promise((resolve, reject) => {
        commit('auth_request')
        const formData = new FormData()
        formData.append('username', user.username)
        formData.append('password', user.password)
        Api.post('/auth/login', formData)
          .then(response => {
            const data = response.data
            if (data.status !== 'false') {
              // El objeto usuario puede venir en data.user o ser data directamente
              const userObject = data.user ? data.user : data
              
              // Si el backend envía access_token, lo aseguramos en el userObject
              if (data.access_token) {
                userObject.access_token = data.access_token
              }

              // Asegurar que el status se mantenga si venía en la raíz
              if (!userObject.status && data.status) userObject.status = data.status

              commit('auth_success', userObject)
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
        Api.get('/auth/logout').then((response) => {
          console.log(response)
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
    getLogginInfo ({commit}) {
      // Si ya estamos logueados satisfactoriamente, nos aseguramos de tener un promise resuelto
      if (this.state.status === 'success') {
        commit('save_promise', Promise.resolve())
        return
      }

      // Si no tenemos status o hubo un error previo, pedimos info al servidor
      if (this.state.status === '' || this.state.status === 'error') {
        let promise = new Promise((resolve, reject) => {
          Api.post('/auth/user', null).then((response) => {
            const data = response.data
            if (data.status !== 'not_logged' && data.status !== 'false') {
              // El objeto usuario puede venir en data.user o ser data directamente
              const userObject = data.user ? data.user : data
              
              // Si el backend envía access_token (ej: en el refresco o reconexión), lo aseguramos
              if (data.access_token) {
                userObject.access_token = data.access_token
              }

              // Asegurar que el status se mantenga
              if (!userObject.status && data.status) userObject.status = data.status
              
              commit('auth_success', userObject)
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
                  if (user.access_token) {
                    localStorage.setItem('l_s', user.access_token)
                  }
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
    isLoggedIn: state => !!state.user.status,
    authStatus: state => state.status
  }
})
