import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

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
        axios({url: '/auth/login', data: formData, method: 'POST'})
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
        axios.get('/auth/logout').then((response) => {
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
          let instance = axios.create({
            withCredentials: true
          })
          instance.post('/auth/user').then((response) => {
            if (response.data.status !== 'not_logged') {
              commit('auth_success', response.data)
            } else {
              commit('logout')
            }
            resolve()
          }).catch((error) => {
            console.log(error)
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
