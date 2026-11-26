<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="py-5">
        <h2>{{ $t('help.title') }}</h2>
      </div>
    </b-container>
    <b-container fluid class="py-5">
      <h3>{{ $t('help.need_help') }}</h3>
      <i18n path="help.need_help_desc" tag="p">
        <a href="https://docs.google.com/forms/d/e/1FAIpQLScVstt7-452TRn9ku8c-aml7mY5QOqBccB06I6xpyx13Yam3Q/viewform" target="_blank" place="0">{{ $t('help.this_form') }}</a>
      </i18n>
      <p>{{ $t('help.email_us') }}</p>

      <h3>{{ $t('help.feedback') }}</h3>
      <i18n path="help.feedback_desc" tag="p">
        <a href="https://docs.google.com/forms/d/1uIqAenD-giNJqRDUJSH9Jyg_AdxaIFIDz8zvVzgGufM/edit" target="_blank" place="0">{{ $t('help.the_following_form') }}</a>
      </i18n>

      <h3>{{ $t('help.support_webinars') }}</h3>
      <i18n path="help.support_webinars_desc" tag="p">
        <a href="https://www.cerqual.org/upcoming-events/" target="_blank" place="0">{{ $t('help.upcoming_events') }}</a>
      </i18n>

      <h3>{{ $t('help.videos') }}</h3>
      <ol start="0">
        <li><a href="https://vimeo.com/505239646" target="_blank">{{ $t('help.video_list.welcome') }}</a></li>
        <li><a href="https://vimeo.com/449741356" target="_blank">{{ $t('help.video_list.sharing') }}</a></li>
        <li><a href="https://vimeo.com/504176899" target="_blank">{{ $t('help.video_list.visibility') }}</a></li>
        <li><a href="https://vimeo.com/449265292" target="_blank">{{ $t('help.video_list.my_data') }}</a></li>
        <li><a href="https://vimeo.com/449247762" target="_blank">{{ $t('help.video_list.importing_references') }}</a></li>
        <li><a href="https://vimeo.com/449248998" target="_blank">{{ $t('help.video_list.importing_pubmed') }}</a></li>
        <li><a href="https://vimeo.com/449742512" target="_blank">{{ $t('help.video_list.creating_characteristics') }}</a></li>
        <li><a href="https://vimeo.com/450046545" target="_blank">{{ $t('help.video_list.importing_characteristics') }}</a></li>
        <li><a href="https://vimeo.com/449764545" target="_blank">{{ $t('help.video_list.creating_methodological') }}</a></li>
        <li><a href="https://vimeo.com/451099168" target="_blank">{{ $t('help.video_list.importing_methodological') }}</a></li>
        <li><a href="https://vimeo.com/449743080" target="_blank">{{ $t('help.video_list.isoq_overview') }}</a></li>
        <li><a href="https://vimeo.com/451100564" target="_blank">{{ $t('help.video_list.organising_findings') }}</a></li>
        <li><a href="https://vimeo.com/462176102" target="_blank">{{ $t('help.video_list.reordering_findings') }}</a></li>
        <li><a href="https://vimeo.com/462176356" target="_blank">{{ $t('help.video_list.searching_table') }}</a></li>
        <li><a href="https://vimeo.com/462176506" target="_blank">{{ $t('help.video_list.leaving_notes_findings') }}</a></li>
        <li><a href="https://vimeo.com/451100482" target="_blank">{{ $t('help.video_list.cerqual_worksheet_overview') }}</a></li>
        <li><a href="https://vimeo.com/450836795" target="_blank">{{ $t('help.video_list.adding_extracted_data') }}</a></li>
        <li><a href="https://vimeo.com/450835272" target="_blank">{{ $t('help.video_list.assessing_methodological') }}</a></li>
        <li><a href="https://vimeo.com/450835237" target="_blank">{{ $t('help.video_list.assessing_coherence') }}</a></li>
        <li><a href="https://vimeo.com/450835188" target="_blank">{{ $t('help.video_list.assessing_adequacy') }}</a></li>
        <li><a href="https://vimeo.com/450835406" target="_blank">{{ $t('help.video_list.assessing_relevance') }}</a></li>
        <li><a href="https://vimeo.com/450835499" target="_blank">{{ $t('help.video_list.overall_confidence') }}</a></li>
        <li><a href="https://vimeo.com/462180668" target="_blank">{{ $t('help.video_list.leaving_notes_cerqual') }}</a></li>
      </ol>

      <h3>{{ $t('help.train_webinars') }}</h3>
      <ul>
        <li><a href="https://vimeo.com/737300971" target="_blank">{{ $t('help.training_webinars_list.presentation') }}</a></li>
        <li><a href="https://vimeo.com/738892529" target="_blank">{{ $t('help.training_webinars_list.demo') }}</a></li>
        <li><a href="https://training.cochrane.org/resource/how-the-isoq-tool-can-help-you-apply-grade-cerqual-in-your-qes" target="_blank">{{ $t('help.training_webinars_list.cochrane_training') }}</a></li>
      </ul>

      <h3>{{ $t('help.gc_webinars') }}</h3>
      <ul>
        <li><a href="https://training.cochrane.org/resource/grade-cerqual-webinar" target="_blank">{{ $t('help.gc_webinars_list.webinar') }}</a></li>
        <li><a href="https://www.cerqual.org/upcoming-events/" target="_blank">{{ $t('help.gc_webinars_list.upcoming') }}</a></li>
      </ul>
    </b-container>
  </div>
</template>

<script>
export default {
  name: 'Help',
  data () {
    return {}
  }
}
</script>
