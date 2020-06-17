<template>
  <div class="h-100">
    <b-container id="mainPage" fluid class="pt-5 h-100">
      <b-row>
        <b-col cols="12" md="6" lg="3">
          <h2>iSoQ</h2>
          <p class="slogan">Lorem ipsum dolor sit amet consectetur, adipisicing elit. A fuga tenetur accusantium blanditiis nostrum dicta officia harum repudiandae saepe consectetur id illum, perspiciatis iure nobis qui pariatur eius cupiditate magnam.</p>
        </b-col>
      </b-row>

      <b-row class="py-5">
        <b-col cols="12" md="4" lg="3">
          <ul class="unstyled-list">
            <li>Learn more about iSoQ</li>
            <li>Browse</li>
          </ul>
        </b-col>
      </b-row>

      <b-row class="pt-5" align-v="end">
        <b-col cols="12" md="4">
          <p class="uea">This project has received funding from the European Union’s Seventh Framework Programme for research, technological development and demonstration under grant agreement n°258583 and from Epistemonikos foundation that currently maintains and further develop the iSoQ.</p>
          <p class="uea">iSoQ is licensed under a Creative Commons Attribution-NonCommercial 3.0 Unported License</p>
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
  div >>>
    #mainPage {
      background: url('https://isof.epistemonikos.org/assets/images/home_background.jpg');
      background-size: cover;
      color: #FFF;
    }
    h2 {
      font-size: 80px;
    }
    .slogan {
      font-style: italic;
      font-weight: 200;
      font-size: 26px;
    }
    li {
      font-size: 20px;
    }
    .uea {
      font-size: 12px;
    }
</style>
