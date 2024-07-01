<template>
  <div>
    <b-alert show :variant="ui.variant" class="text-center">
      <p>{{ ui.text }} <a :href="ui.url" target="_blank">{{ ui.url_text }}</a></p>
    </b-alert>
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
        variant: 'danger'
      }
    }
  }
}
</script>

<style scoped lang="scss">
  .alert {
    border-radius: 0;
    p {
      margin-bottom: 0;
      font-size: 1.2rem;
    }
  }
</style>
