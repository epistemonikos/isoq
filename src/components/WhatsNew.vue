<template>
  <div>
    <b-container fluido class="workspace-header">
      <b-container class="py-5">
        <h2>What's New</h2>
      </b-container>
    </b-container>
    <b-container class="py-5">
      <!-- desde aqui -->
      <h3>What's new in iSoQ?</h3>
      <p>Here you will find the latest updates and improvements to iSoQ.</p>
      <h3>Version 1.0.0</h3>
      <p>Initial release of iSoQ.</p>
      <p>new content</p>
      <!-- acá escribes tu comentario -->
      <ul> We have redesigned the My Data page for easier navigation
        <li>item 1</li> A table of contents on the left makes visualising and moving between each step easy
        <li>item 2</li> Edit and delete buttons for each row in the tables (step 3&4) remain visible even when scrolling
        <li>item 3</li> Scroll over the Authors names to see the title of the paper in Steps 3&4
      </ul>

      <ol>
        <li>item 1</li>
        <li>item 2</li>
      </ol>
      <!-- hasta aqui -->
    </b-container>
  </div>
</template>

<script>
export default {
  name: 'WhatsNew',
  data () {
    return {}
  }
}
</script>
