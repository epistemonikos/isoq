<template>
  <b-modal
    id="subscribe"
    ref="subscribe"
    title="Newsletter"
    ok-title="Yes"
    cancel-title="No"
    @ok="ok"
    @cancel="cancel">
    <p>
      Would you like to subscribe to the GRADE-CERQual mailing list?
      <br>
      You will receive three newsletters a year that include the latest news about iSoQ.
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
      this.$emit('resetshowSubscribe')
      this.$refs.subscribe.hide()
    },
    cancel () {
      this.hide()
    },
    ok () {
      window.open('https://docs.google.com/forms/d/e/1FAIpQLSctGa_fZ0A9XclGWcT2PHxP_I2FD0k4ylOeW93G8w18VRP11g/viewform', '_blank')
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
