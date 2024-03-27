<template>
  <div id="mainContainer" class="vh-100">
    <b-container fluid>
      <b-row cols="1">
        <b-col>
          <h2>iSoQ <span>Version 1.0</span></h2>
          <p class="slogan">An online tool for applying the <a href="https://www.cerqual.org/" target="_blank">GRADE-CERQual</a> approach to findings of a qualitative evidence synthesis</p>
        </b-col>
      <!-- </b-row>

      <b-row> -->
        <b-col>
          <ul id="main-page-nav" class="unstyled-list">
            <li><b-link :to="{ name: 'About' }">Learn more about iSoQ</b-link></li>
            <li><b-link :to="{ name: 'Browse' }">Browse</b-link></li>
            <li><b-link href="https://vimeo.com/687899560" target="_blank">Watch a short video</b-link></li>
          </ul>
        </b-col>
      <!-- </b-row>

      <b-row> -->
        <b-col align-self="end">
          <ul class="list-inline logo-orgs w-100">
            <li class="list-inline-item">
              <img src="../assets/logo-niph.png" height="50" alt="NIPH">
            </li>
            <li class="list-inline-item">
              <img src="../assets/hvl_logo_en_neg.png" height="50" alt="HVL">
            </li>
            <li class="list-inline-item">
              <img src="../assets/logo-nust.png" height="50" alt="Norwegian University ST">
            </li>
            <li class="list-inline-item">
              <img src="../assets/logo-epistemonikos.png" height="50" alt="Epistemonikos Foundation">
            </li>
          </ul>
          <p class="credit">Image by Sarah Rosenbaum, Norway</p>
        </b-col>
      </b-row>
    </b-container>
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
