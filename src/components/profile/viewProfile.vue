<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="py-5">
        <h2>{{ $t("Profile") }}</h2>
      </b-container>
    </b-container>
    <b-container class="pt-5 pb-5">
      <b-alert variant="success" :show="showAlert()" dismissible>{{msg}}</b-alert>
      <b-table-simple>
        <b-tbody>
          <b-tr>
            <b-td>
              <p>username</p>
            </b-td>
            <b-td>
              {{username}}
            </b-td>
          </b-tr>
          <b-tr>
            <b-td>
              <p>name</p>
            </b-td>
            <b-td>
              {{fullname}}
            </b-td>
          </b-tr>
          <b-tr>
            <b-td>
              <p>new password</p>
            </b-td>
            <b-td>
              <b-form-group
                description="8 characters at least"
                class="mb-0">
                <b-form-input type="password" v-model="new_password"></b-form-input>
            </b-form-group>
            </b-td>
          </b-tr>
          <b-tr>
            <b-td>
              <p>repeat password</p>
            </b-td>
            <b-td>
              <b-form-group
                description="8 characters at least"
                class="mb-0">
                <b-form-input type="password" v-model="new_password_repeat"></b-form-input>
            </b-form-group>
            </b-td>
          </b-tr>
        </b-tbody>
      </b-table-simple>
      <b-button @click="update" :disabled="isDisabled">Save</b-button>
    </b-container>
    <subscribe :show="showSubscribe" @resetshowSubscribe="resetshowSubscribe"></subscribe>
  </div>
</template>

<script>
import axios from 'axios'
import subscribe from '@/components/commons/subscribe.vue'

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
      isDisabled: true
    }
  },
  computed: {
    username: function () {
      return this.$store.state.user.name
    },
    fullname: function () {
      return this.$store.state.user.first_name + ' ' + this.$store.state.user.last_name
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
    update: function () {
      this.msg = ''
      const params = {
        user_id: this.$store.state.user.id,
        new_password: this.new_password
      }
      axios.post(`/users/change_password`, params)
        .then((r) => {
          this.new_password = null
          this.new_password_repeat = null
          this.msg = 'Your password has been changed!'
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
