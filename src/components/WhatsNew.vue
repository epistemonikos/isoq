<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="py-5">
        <h2>{{ $t('whats_new.title') }}</h2>
      </div>
    </b-container>
    <b-container fluid class="py-5">
      <!-- desde aqui -->
      <h3>{{ $t('whats_new.subtitle') }}</h3>
      <p>{{ $t('whats_new.desc') }}</p>
      <!-- February 2025 -->
      <h3>{{ $t('updates.feb_2025') }}</h3>
      <p class="font-weight-bold">{{ $t('updates.assessment_no_delete_title') }}</p>
      <ul>
        <li>{{ $t('updates.assessment_no_delete_desc') }}</li>
      </ul>
      <p class="font-weight-bold">{{ $t('updates.view_only_worksheets_title') }}</p>
      <ul>
        <li>{{ $t('updates.view_only_worksheets_desc') }}</li>
      </ul>
      <p class="font-weight-bold">{{ $t('updates.accessibility_title') }}</p>
      <ul>
        <li>{{ $t('updates.accessibility_desc') }}</li>
      </ul>
      <p class="font-weight-bold">{{ $t('updates.check_refs_title') }}</p>
      <ul>
        <li>{{ $t('updates.check_refs_desc') }}</li>
      </ul>

      <!-- December 2024 -->
      <h3>{{ $t('updates.dec_2024') }}</h3>
      <p class="font-weight-bold">{{ $t('updates.margins_title') }}</p>
      <ul>
        <li>{{ $t('updates.margins_desc') }}</li>
      </ul>
      <p class="font-weight-bold">{{ $t('updates.help_training_title') }}</p>
      <ul>
        <li>{{ $t('updates.help_training_desc') }}</li>
      </ul>

      <!-- May 2024 -->
      <h3>{{ $t('updates.may_2024') }}</h3>
      <p class="font-weight-bold">{{ $t('updates.newsletter_title') }}</p>
      <ul>
        <li>{{ $t('updates.newsletter_desc') }}</li>
      </ul>

      <!-- April 2024 -->
      <h3>{{ $t('updates.apr_2024') }}</h3>
      <p class="font-weight-bold">{{ $t('updates.mydata_redesign_title') }}</p>
      <ul>
        <li>{{ $t('updates.mydata_redesign_li1') }}</li>
        <li>{{ $t('updates.mydata_redesign_li2') }}</li>
        <li>{{ $t('updates.mydata_redesign_li3') }}</li>
      </ul>

      <!-- February 2024 -->
      <h3>{{ $t('updates.feb_2024') }}</h3>
      <p class="font-weight-bold">{{ $t('updates.no_jumping_title') }}</p>
      <ul>
        <li>{{ $t('updates.no_jumping_li1') }}</li>
        <li>{{ $t('updates.no_jumping_li2') }}</li>
      </ul>

      <!-- October 2023 -->
      <h3>{{ $t('updates.oct_2023') }}</h3>
      <p class="font-weight-bold">{{ $t('updates.leave_project_title') }}</p>
      <ul>
        <li>{{ $t('updates.leave_project_li1') }}</li>
        <li>{{ $t('updates.leave_project_li2') }}</li>
      </ul>
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
