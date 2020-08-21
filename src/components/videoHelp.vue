<template>
  <div>
    <template v-if="tag === 'none'">{{txt}} <span v-b-modal="`videoHelp-${urlId}`"><font-awesome-icon icon="question-circle"></font-awesome-icon></span></template>
    <template v-if="tag === 'h2'"><h2>{{txt}} <span v-b-modal="`videoHelp-${urlId}`"><font-awesome-icon icon="question-circle"></font-awesome-icon></span></h2></template>
    <template v-if="tag === 'h3'"><h3>{{txt}} <span v-b-modal="`videoHelp-${urlId}`"><font-awesome-icon icon="question-circle"></font-awesome-icon></span></h3></template>
    <template v-if="tag === 'h4'"><h4>{{txt}} <span v-b-modal="`videoHelp-${urlId}`"><font-awesome-icon icon="question-circle"></font-awesome-icon></span></h4></template>
    <b-modal
      title="Help"
      :id="`videoHelp-${urlId}`"
      ok-only
      ok-title="Close"
      size="xl">
      <b-embed
        type="iframe"
        aspect="16by9"
        :src="`https://player.vimeo.com/video/${urlId}?title=0&byline=0&portrait=0`"
        allowfullscreen
      ></b-embed>
    </b-modal>
  </div>
</template>

<script>
export default {
  name: 'videoHelp',
  props: {
    urlId: String,
    txt: String,
    tag: String
  },
  data () {
    return {}
  }
}
</script>

<style scoped lang="scss">
  h2>span>svg,
  h3>span>svg,
  h4>span>svg {
    font-size: 1rem;
  }
</style>
