<template>
  <b-modal
    id="subscribe"
    ref="subscribe"
    :title="$t('subscribe.title')"
    :ok-title="$t('common.yes')"
    :cancel-title="$t('common.no')"
    @ok="ok"
    @cancel="cancel">
    <p>
      {{ $t('subscribe.question') }}
      <br>
      {{ $t('subscribe.description') }}
    </p>
  </b-modal>
</template>

<script>
export default {
  name: 'subscribe',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    isCreatedAccount: {
      type: Boolean,
      default: false,
      required: false
    }
  },
  watch: {
    show () {
      if (this.show) {
        this.$refs.subscribe.show()
      }
    }
  },
  methods: {
    hide () {
      if (this.isCreatedAccount) {
        this.$emit('doLogin')
      }
      this.$emit('resetshowSubscribe')
      this.$refs.subscribe.hide()
    },
    cancel () {
      this.hide()
    },
    ok () {
      window.open('https://docs.google.com/forms/d/e/1FAIpQLSctGa_fZ0A9XclGWcT2PHxP_I2FD0k4ylOeW93G8w18VRP11g/viewform', '_blank')
      if (this.isCreatedAccount) {
        this.$emit('doLogin')
      }
      this.$emit('resetshowSubscribe')
      this.hide()
    }
  }
}
</script>

<style lang="scss">
.modal-footer.btn-centered {
  justify-content: center !important;
}
</style>
