<template>
  <div :class="{'navbar-nav ml-auto': isMenu}">
    <template v-if="isMenu">
      <b-nav-item @click="increaseFontSize">{{ $t('accessibility.increase_font') }}</b-nav-item>
      <b-nav-item @click="decreaseFontSize">{{ $t('accessibility.decrease_font') }}</b-nav-item>
    </template>
    <template v-else>
      <b-container fluid class="float-right">
        <b-row align-h="end">
          <b-col cols="1" class="mt-2">
            <ul class="list-inline text-center accessibility">
              <!-- <li class="list-inline-item">Font size</li> -->
              <li class="list-inline-item" style="cursor: pointer" @click="increaseFontSize">{{ $t('accessibility.increase_font') }}</li>
              <li class="list-inline-item" style="cursor: pointer" @click="decreaseFontSize">{{ $t('accessibility.decrease_font') }}</li>
            </ul>
          </b-col>
        </b-row>
      </b-container>
    </template>
  </div>
</template>

<script>
export default {
  name: 'Accessibility',
  props: {
    isMenu: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    increaseFontSize () {
      const currentSize = window.getComputedStyle(document.body, null).getPropertyValue('font-size')
      const body = document.querySelector('body')
      if (parseInt(currentSize) < 24) {
        body.style.fontSize = `${parseInt(currentSize) + 2}px`
      }
    },
    decreaseFontSize () {
      const currentSize = window.getComputedStyle(document.body, null).getPropertyValue('font-size')
      const body = document.querySelector('body')
      if (parseInt(currentSize) > 16) {
        body.style.fontSize = `${parseInt(currentSize) - 2}px`
      }
    }
  }
}
</script>

<style scoped lang="scss">
.accessibility {
  li {
    background-color: white;
    padding: 0 0.2rem;
  }
  .list-inline-item:not(:last-child) {
    margin-right: 0;
  }
}
</style>
