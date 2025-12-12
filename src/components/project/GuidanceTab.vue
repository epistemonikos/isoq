<template>
  <content-guidance></content-guidance>
</template>

<script>
const contentGuidance = () => import(/* webpackChunkName: "contentguidance" */ '../contentGuidance.vue')

export default {
  name: 'GuidanceTab',
  components: {
    'content-guidance': contentGuidance
  }
}
</script>
