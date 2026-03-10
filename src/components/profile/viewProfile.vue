<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="py-5">
        <h2>{{ $t("Profile") }}</h2>
      </b-container>
    </b-container>
    <b-container class="pt-5 pb-5">
      <p>Manage your information, download your data, configure your privacy settings, contact us, or delete your account.</p>
      <b-alert variant="success" :show="showAlert()" dismissible>{{msg}}</b-alert>
      <b-card no-body class="p-3">
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

        <ul>
          <li>
            <b-checkbox v-model="newsletter">I agree to receive email communications about important service updates and news (optional)</b-checkbox>
          </li>
          <li>
            <b-checkbox v-model="improvement">I agree to the use of my data in aggregated and anonymized form to help improve the service (optional)</b-checkbox>
          </li>
        </ul>
        
        <div class="mt-3">
          <b-button variant="primary" @click="update" :disabled="isDisabled">Save</b-button>
        </div>
      </b-card>
      
      <b-card no-body class="mt-3 p-3">
        <h3>Manage profile</h3>
        <div class="d-flex flex-row justify-content-between align-items-center">
          <div>
            <p class="m-0">Download profile data: Export all of your profile information in a JSON file </p>
          </div>
          <div>
            <b-button variant="outline-primary">Export profile data</b-button>
          </div>
        </div>

        <b-alert show class="mt-3">
          <p>Note: You can download a copy of your personal data associated with your account.</p>
          <ul>
            <li>
              The export will include the personal information you provided (e.g., name, email) and records of your activity in the platform.
            </li>
            <li>
              Data will be provided in a structured, commonly used, machine-readable format (JSON,CSV,XML).
            </li>
            <li>
              Exporting your data does not delete it from our systems. You can request deletion separately.
            </li>
            <li>
              We may take up to 30 days to provide the full export, in line with our Privacy Policy.
            </li>
          </ul>

          <p>For full details, see our <router-link :to="{name: 'PrivacyPolicy'}">Privacy Policy</router-link></p>
        </b-alert>


        <div class="d-flex flex-row justify-content-between align-items-center">
          <div>
            <p class="m-0">Delete account: Export all of your profile information in a JSON file </p>
          </div>
          <div>
            <b-button variant="outline-danger">Delete account</b-button>
          </div>
        </div>

        <b-alert show variant="warning" class="mt-3">
          <p>Important: Deleting your account is permanent and cannot be undone.</p>
          <ul>
            <li>
              Your personal information will be deleted from our active systems.
            </li>
            <li>
              Some records may be retained as required by law (e.g. billing, legal compliance, or security logs).
            </li>
            <li>
              Data that has been anonymized or aggregated (not linked to you) may be kept for research or statistical purposes.
            </li>
            <li>
              If you change your mind, you must create a new account. Deleted accounts cannot be restored.
            </li>
          </ul>

          <p>For full details, see our <router-link :to="{name: 'PrivacyPolicy'}">Privacy Policy</router-link> and <router-link :to="{name: 'TermsAndConditions'}">Terms and conditions</router-link></p>
        </b-alert>
      </b-card>

      <b-card no-body class="mt-3 p-3">
        <h3>Privacy preferences</h3>
        <div>
          <div>
            <p class="m-0">Your data is processed according to our Privacy Policy. This is required to provide the service</p>
          </div>
          <b-card class="p-3 mt-3">
            <b-alert :show="contactMsg.length > 0" :variant="contactMsgVariant" dismissible @dismissed="contactMsg = ''">{{ contactMsg }}</b-alert>
            <b-form-group
              id="fieldset-1"
              description="Subject"
              label="Subject"
              label-for="input-1"
              valid-feedback="Looks good!"
              invalid-feedback="Subject must be at least 10 characters long."
              :state="subjectState">
              <b-form-input id="input-1" v-model="subject" :state="subjectState" trim></b-form-input>
            </b-form-group>
            <b-form-group
              id="fieldset-2"
              description="Your message"
              label="Message"
              label-for="input-2"
              valid-feedback="Looks good!"
              invalid-feedback="Message must contain at least 5 words."
              :state="messageState">
              <b-form-textarea id="textarea"
                v-model="message"
                placeholder="Enter your message..."
                :state="messageState"
                rows="3"
                max-rows="6"></b-form-textarea>
            </b-form-group>
            <div class="mt-3">
              <b-button variant="primary" @click="sendContact" :disabled="!isContactFormValid || isSendingContact">
                <b-spinner v-if="isSendingContact" small class="mr-2"></b-spinner>
                Send
              </b-button>
            </div>
          </b-card>
        </div>

      </b-card>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import { RouterLink } from 'vue-router';

export default {
  name: 'viewProfile',
  data () {
    return {
      new_password: null,
      new_password_repeat: null,
      msg: '',
      isDisabled: true,
      newsletter: false,
      improvement: false,
      initial_newsletter: false,
      initial_improvement: false,
      subject: '',
      message: '',
      isSendingContact: false,
      contactMsg: '',
      contactMsgVariant: 'success'
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
    subjectState: function () {
      if (this.subject.length === 0) return null
      return this.subject.trim().length >= 10
    },
    messageState: function () {
      if (this.message.length === 0) return null
      const wordCount = this.message.trim().split(/\s+/).filter(word => word.length > 0).length
      return wordCount >= 5
    },
    isContactFormValid: function () {
      return this.subjectState === true && this.messageState === true
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
    initCheckboxes: function () {
      const user = this.$store.state.user
      const trueValues = [true, 'true', 'True', 1, '1']
      
      if (user) {
        this.newsletter = trueValues.includes(user.newsletter)
        this.improvement = trueValues.includes(user.improvement)
        this.initial_newsletter = this.newsletter
        this.initial_improvement = this.improvement
      }
    },
    update: async function () {
      this.msg = ''
      this.isDisabled = true
      const promises = []
      
      const hasPasswordInput = this.new_password !== null && this.new_password !== ''
      const validPassword = hasPasswordInput && this.new_password === this.new_password_repeat && this.new_password.length >= 8
      
      const checkboxesChanged = this.newsletter !== this.initial_newsletter || this.improvement !== this.initial_improvement
      
      try {
        if (validPassword) {
          const passParams = {
            user_id: this.$store.state.user.id,
            new_password: this.new_password
          }
          promises.push(axios.post(`/users/change_password`, passParams))
        }
        
        if (checkboxesChanged) {
          const infoParams = {
            user_id: this.$store.state.user.id,
            newsletter: this.newsletter,
            improvement: this.improvement
          }
          promises.push(axios.post(`/users/update_info`, infoParams))
        }
        
        if (promises.length > 0) {
          await Promise.all(promises)
          
          let successMsgs = []
          if (validPassword) {
            successMsgs.push('password')
            this.new_password = null
            this.new_password_repeat = null
          }
          
          if (checkboxesChanged) {
            successMsgs.push('privacy settings')
            this.initial_newsletter = this.newsletter
            this.initial_improvement = this.improvement
            this.$store.state.user.newsletter = this.newsletter
            this.$store.state.user.improvement = this.improvement
          }
          
          this.msg = `Your ${successMsgs.join(' and ')} ${successMsgs.length > 1 ? 'have' : 'has'} been updated!`
        }
      } catch (error) {
        console.error(error)
        this.msg = 'An error occurred while updating your profile.'
      } finally {
        this.checkDisabled()
      }
    },
    sendContact: async function () {
      if (!this.isContactFormValid) return
      
      this.isSendingContact = true
      this.contactMsg = ''
      
      try {
        await axios.post('/users/contact', {
          subject: this.subject,
          message: this.message
        })
        this.contactMsg = 'Your message has been sent successfully!'
        this.contactMsgVariant = 'success'
        this.subject = ''
        this.message = ''
      } catch (error) {
        console.error(error)
        this.contactMsg = 'Failed to send message. Please try again.'
        this.contactMsgVariant = 'danger'
      } finally {
        this.isSendingContact = false
      }
    },
    showAlert: function () {
      if (this.msg.length) {
        return true
      }
      return false
    },
    checkDisabled: function () {
      const checkboxesChanged = this.newsletter !== this.initial_newsletter || this.improvement !== this.initial_improvement
      
      const hasPasswordInput = this.new_password !== null && this.new_password !== ''
      
      if (hasPasswordInput) {
        const validPassword = this.new_password === this.new_password_repeat && this.new_password.length >= 8
        if (!validPassword) {
          this.isDisabled = true
          return
        }
      }
      
      if (checkboxesChanged || (hasPasswordInput && this.new_password === this.new_password_repeat && this.new_password.length >= 8)) {
        this.isDisabled = false
      } else {
        this.isDisabled = true
      }
    }
  }
}
</script>

<style>

</style>
