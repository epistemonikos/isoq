<template>
  <div class="clearfix my-2">
    <span class="back-to-top" @click="toTop">&uarr; Back to top</span>
  </div>
</template>

<script>
export default {
  name: 'backToTop',
  data: function () {
    return {}
  },
  methods: {
    toTop: function () {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}
</script>

<style lang="scss" scoped>
.back-to-top {
  cursor: pointer;
}
</style>
