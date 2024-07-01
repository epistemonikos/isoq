<template>
  <div>
    <b-alert show :variant="ui.variant" class="text-center">{{ ui.text }} <a :href="ui.url" target="_blank">{{ ui.url_text }}</a></b-alert>
  </div>
</template>

<script>
export default {
  name: 'Event',
  data () {
    return {
      ui: {
        error: null,
        text: 'Attend a live demo on September 26, 2024.',
        url: 'https://training.cochrane.org/zoom/meeting/XnMukn%252BaRhayM%252FJlVxkicA%253D%253D/signup',
        url_text: 'Sign up here',
        variant: 'primary'
      }
    }
  }
}
</script>

<style scoped>
  .alert {
    border-radius: 0;
  }
</style>
