<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="py-5">
        <h2>What's New</h2>
      </div>
    </b-container>
    <b-container fluid class="py-5">
      <!-- desde aqui -->
      <h3>What's new in iSoQ?</h3>
      <p>Here you will find the latest updates and improvements to iSoQ Version 1.0.0.</p>
      <!-- acá escribes tu comentario -->
      <h3>February 2025</h3>
      <p class="font-weight-bold">Changing your assessment won’t delete your explanation</p>
      <ul>
        <li>
          Based on user feedback, iSoQ will no longer delete the text you have written in an explanation box if you change your choice of level of concern or level of confidence.
        </li>
      </ul>
      <p class="font-weight-bold">Users with “view only” rights now see Worksheets</p>
      <ul>
        <li>
          When a user is invited to a project but assigned “view only” rights they can now see (but not edit) all pages including project properties, My Data section, iSoQ table and Worksheets with the Evidence Profile.
        </li>
      </ul>
      <p class="font-weight-bold">Accessibility: Increase and decrease text size</p>
      <ul>
        <li>
          You will now find a +A and -A in the top right corner of the screen so that you can adjust the size of the font throughout iSoQ.
        </li>
      </ul>
      <p class="font-weight-bold">Prompt to check your references, success starts here!</p>
      <ul>
        <li>
          When you import your references in Step 1 of the MyData section of iSoQ, your imported studies are now displayed, thus prompting you to look them over before manually moving to Step 2. It is important to make sure that your references have imported correctly and are complete. You cannot currently edit your references within iSoQ.
        </li>
      </ul>

      <h3>December 2024</h3>
      <p class="font-weight-bold">Narrower margins = easier viewing of content</p>
      <ul>
        <li>
          The margins have been reduced throughout the platform to maximize what you are able to see in tables and modals.
        </li>
      </ul>
      <p class="font-weight-bold">New section in help tab – iSoQ training</p>
      <ul>
        <li>
          We have added links to iSoQ training webinars on the Help page
        </li>
      </ul>

      <h3>May 2024</h3>
      <!-- acá escribes tu comentario -->
      <p class="font-weight-bold">Facilitating access to information on iSoQ development </p>
      <ul>
        <li>
          Users are now prompted to sign-up to the GRADE-CERQual newsletter when they create an account or change their password. GRADE-CERQual newsletters are sent three times a year and include the latest news about the iSoQ platform, upcoming training or webinars, and other resources for applying the GRADE-CERQual approach
        </li>
      </ul>

      <h3>April 2024</h3>
      <!-- acá escribes tu comentario -->
      <p class="font-weight-bold">We have redesigned the My Data page for easier navigation</p>
      <ul>
        <li>
          A table of contents on the left makes visualising and moving between each step easy
        </li>
        <li>
          Edit and delete buttons for each row in the tables (step 3&4) remain visible even when scrolling
        </li>
        <li>
          Scroll over the Authors names to see the title of the paper in Steps 3&4
        </li>
      </ul>

      <h3>February 2024</h3>
      <!-- acá escribes tu comentario -->
      <p class="font-weight-bold">No more jumping!</p>
      <ul>
        <li>
          Previously iSoQ defaulted to jumping to the top of the page when the user navigated between pages. Now iSoQ holds your spot on the page thus reducing scroll time.
        </li>
        <li>
         You will notice this enhancement especially when navigating back and forth between the iSoQ table and he GRADE-CERQual Assessment Worksheets for each finding.
        </li>
      </ul>

      <h3>October 2023</h3>
      <!-- acá escribes tu comentario -->
      <p class="font-weight-bold">Leaving a project simplified</p>
      <ul>
        <li>
           Users can now leave a project that was shared with them by clicking the "leave" button in My Workspace
        </li>
        <li>
          This will remove the project entirely from My Workspace
        </li>
      </ul>
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
