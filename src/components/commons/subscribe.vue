<template>
  <b-modal id="subscribe" ref="subscribe" title="Newsletter" ok-only ok-title="Close">
    <p>Would you like to be subscribed to our newsletter?<br>
    <b>Yeah! <a href="https://docs.google.com/forms/d/e/1FAIpQLSctGa_fZ0A9XclGWcT2PHxP_I2FD0k4ylOeW93G8w18VRP11g/viewform" target="_blank">I want to subscribe!</a></b></p>
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
  }
}
</script>
