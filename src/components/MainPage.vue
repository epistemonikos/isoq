<template>
  <div id="mainContainer" class="vh-100">
    <div class="d-flex flex-column h-100">
      <b-container fluid class="mb-auto">
        <b-row>
          <b-col cols="12" md="3" class="pt-5">
            <h2>iSoQ <span>Version 1.0</span></h2>
            <p class="slogan">An online tool for applying the <a href="https://www.cerqual.org/" target="_blank">GRADE-CERQual</a> approach to findings of a qualitative evidence synthesis</p>
          </b-col>
          <b-col cols="12">
            <ul id="main-page-nav" class="unstyled-list">
              <li><b-link :to="{ name: 'About' }">Learn more about iSoQ</b-link></li>
              <li><b-link :to="{ name: 'Browse' }">Browse</b-link></li>
              <li><b-link href="https://vimeo.com/687899560" target="_blank">Watch a short video</b-link></li>
            </ul>
          </b-col>
        </b-row>
      </b-container>
      <b-container fluid class="bg-black py-3">
        <b-row>
          <b-col class="text-center" cols="3" align-self="center">
            <b-img fluid :src="require('@/assets/logo-niph.png')" height="30" alt="NIPH"></b-img>
          </b-col>
          <b-col class="text-center" cols="3" align-self="center">
            <b-img fluid :src="require('@/assets/logo-epistemonikos.png')" height="30" alt="Epistemonikos Foundation"></b-img>
          </b-col>
          <b-col class="text-center" cols="3" align-self="center">
            <b-img fluid :src="require('@/assets/logo-nust.png')" height="30" alt="NTNU"></b-img>
          </b-col>
          <b-col class="text-center" cols="3" align-self="center">
            <b-img fluid :src="require('@/assets/hvl_logo_en_neg.png')" height="30" alt="HVL"></b-img>
          </b-col>
        </b-row>
      </b-container>
      <div class="">
        <b-col align-self="center">
          <p class="text-center credit">Image by Sarah Rosenbaum, Norway</p>
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
    background: url('../assets/a.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
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
    li {
      font-size: 20px;
    }
    li a {
      color: white;
    }
    li a:hover {
      text-decoration: none;
    }
    .uea {
      font-size: 12px;
    }
  .credit {
    font-size: 0.75rem;
  }
</style>
