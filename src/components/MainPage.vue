<template>
  <div
    id="mainContainer"
    class="vh-100"
    :style="{ backgroundImage: `url(${require('@/assets/a.jpg')})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', color: '#FFF' }"
  >
    <div class="d-flex flex-column h-100">
      <b-container fluid class="mb-auto">
        <b-row>
          <b-col cols="12" md="3" class="pt-5">
            <h2>iSoQ <span>{{ $t('home.version') }}</span></h2>
            <i18n path="home.slogan" tag="p" class="slogan"><a href="https://www.cerqual.org/" target="_blank">GRADE-CERQual</a></i18n>
          </b-col>
          <b-col cols="12">
            <ul id="main-page-nav" class="unstyled-list">
              <li><b-link :to="{ name: 'About' }">{{ $t('home.learn_more') }}</b-link></li>
              <li><b-link :to="{ name: 'Browse' }">{{ $t('menu.browse') }}</b-link></li>
              <li><b-link href="https://vimeo.com/687899560" target="_blank">{{ $t('home.watch_video') }}</b-link></li>
            </ul>
          </b-col>
        </b-row>
      </b-container>
      <b-container fluid class="bg-black py-3">
        <b-row>
          <b-col class="text-center" cols="3" align-self="center">
            <b-img fluid :src="require('@/assets/logo-niph.png')" height="30" :alt="$t('home.niph_alt')"></b-img>
          </b-col>
          <b-col class="text-center" cols="3" align-self="center">
            <b-img fluid :src="require('@/assets/logo-epistemonikos.png')" height="30" :alt="$t('home.epistemonikos_alt')"></b-img>
          </b-col>
          <b-col class="text-center" cols="3" align-self="center">
            <b-img fluid :src="require('@/assets/logo-nust.png')" height="30" :alt="$t('home.nust_alt')"></b-img>
          </b-col>
          <b-col class="text-center" cols="3" align-self="center">
            <b-img fluid :src="require('@/assets/hvl_logo_en_neg.png')" height="30" :alt="$t('home.hvl_alt')"></b-img>
          </b-col>
        </b-row>
      </b-container>
      <div class="">
        <b-col align-self="center">
          <p class="text-center credit">{{ $t('home.image_credit') }}</p>
        </b-col>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainPage',
  data () {
    return {
      ui: {
        error: null
      }
    }
  }
}
</script>

<style scoped>
  #mainContainer {
    color: #FFF;
  }
  div >>>
    h2 {
      font-size: 80px;
    }
    h2>span {
      font-size: 1rem;
    }
    .slogan {
      font-style: italic;
      font-weight: 200;
      font-size: 26px;
    }
    .slogan a {
      color: #FFF;
      text-decoration: underline;
    }
    .uea {
      font-size: 12px;
    }
  .credit {
    font-size: 0.75rem;
  }
</style>
