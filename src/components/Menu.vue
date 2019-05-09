<template>
  <div>
    <b-navbar toggleable="lg" type="dark" variant="info">
      <b-navbar-brand :to="{name: 'MainPage'}">iSoF Qualy</b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-item :to="{name: 'About'}">About</b-nav-item>
          <b-nav-item>Browse</b-nav-item>
          <b-nav-item :to="{name: 'Login'}">Login</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>

<script>
export default {

}
</script>

<style>

</style>
