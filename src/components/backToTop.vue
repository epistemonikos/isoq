<template>
  <div class="clearfix">
    <span @click="toTop">&uarr; Back to top</span>
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
