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
        commit('logout')
        // localStorage.removeItem('token')
        // delete axios.defaults.headers.common['Authorization']
        resolve()
      })
    }
  },
  getters: {
    isLoggedIn: state => !!state.user.status,
    authStatus: state => state.status
  }
})
