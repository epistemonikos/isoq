import Vue from 'vue'
import Vuex from 'vuex'
import Api from '@/utils/Api'

Vue.use(Vuex)

export const store = new Vuex.Store({
  state: {
    status: '',
    user: {}
  },
  mutations: {
    auth_request (state) {
      state.status = 'loading'
    },
    auth_success (state, user) {
      state.status = 'success'
      state.user = user
      localStorage.setItem('user-data', JSON.stringify(user))
    },
    auth_error (state) {
      state.status = 'error'
    },
    logout (state) {
      state.status = ''
      state.user = {}
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
            const user = response.data
            if (user.status !== 'false') {
              commit('auth_success', user)
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
      if (this.state.status === '') {
        let promise = new Promise((resolve, reject) => {
          Api.post('/auth/user', null).then((response) => {
            if (response.data.status !== 'not_logged') {
              commit('auth_success', response.data)
            } else {
              commit('logout')
            }
            resolve()
          }).catch((error) => {
            console.log(error)
            // If offline, try to restore from localStorage
            if (!navigator.onLine) {
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
      }
    }
  },
  getters: {
    isLoggedIn: state => !!state.user.status,
    authStatus: state => state.status
  }
})
