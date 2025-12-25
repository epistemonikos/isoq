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
        <li><a href="https://vimeo.com/505239646" target="_blank">iSoQ Welcome Video - The Essentials [8:58 min]</a></li>
        <li><a href="https://vimeo.com/449741356" target="_blank">Sharing an iSoQ project [1:45 min]</a></li>
        <li><a href="https://vimeo.com/504176899" target="_blank">Visibility Settings on the iSoQ Database [3:19 min]</a></li>
        <li><a href="https://vimeo.com/449265292" target="_blank">Overview of the My Data page [1:30 min]</a></li>
        <li><a href="https://vimeo.com/449247762" target="_blank">Importing references for included studies [3:00 min]</a></li>
        <li><a href="https://vimeo.com/449248998" target="_blank">Importing references from PubMed [1:08 min]</a></li>
        <li><a href="https://vimeo.com/449742512" target="_blank">Creating a characteristics of studies table [1:50 min]</a></li>
        <li><a href="https://vimeo.com/450046545" target="_blank">Importing a characteristics of studies table [8:54 min]</a></li>
        <li><a href="https://vimeo.com/449764545" target="_blank">Creating a methodological assessments table [2:20 min]</a></li>
        <li><a href="https://vimeo.com/451099168" target="_blank">Importing a methodological assessments table [9:52 min]</a></li>
        <li><a href="https://vimeo.com/449743080" target="_blank">Overview of the Interactive Summary of Qualitative Findings Table [5:26 min]</a></li>
        <li><a href="https://vimeo.com/451100564" target="_blank">Organising review findings into groups [3:38 min]</a></li>
        <li><a href="https://vimeo.com/462176102" target="_blank">Re-ordering review findings [1:35 min]</a></li>
        <li><a href="https://vimeo.com/462176356" target="_blank">Searching the iSoQ table [0:44 min]</a></li>
        <li><a href="https://vimeo.com/462176506" target="_blank">Leaving notes about review findings [1:02 min]</a></li>
        <li><a href="https://vimeo.com/451100482" target="_blank">Overview of the GRADE-CERQual Assessment Worksheet [2:35 min]</a></li>
        <li><a href="https://vimeo.com/450836795" target="_blank">Adding Extracted Data [5:02 min]</a></li>
        <li><a href="https://vimeo.com/450835272" target="_blank">Overview of assessing Methodological Limitations [3:13 min]</a></li>
        <li><a href="https://vimeo.com/450835237" target="_blank">Overview of assessing Coherence [2:20 min]</a></li>
        <li><a href="https://vimeo.com/450835188" target="_blank">Overview of assessing Adequacy [2:40 min]</a></li>
        <li><a href="https://vimeo.com/450835406" target="_blank">Overview of assessing Relevance [2:18 min]</a></li>
        <li><a href="https://vimeo.com/450835499" target="_blank">Overview of the Overall Assessment of Confidence [2:33 min]</a></li>
        <li><a href="https://vimeo.com/462180668" target="_blank">Leaving notes about GRADE-CERQual assessments [1:33 min]</a></li>
      </ol>

      <h3>{{ $t('help.training_webinars') }}</h3>
      <ul>
        <li><a href="https://vimeo.com/737300971" target="_blank">Watch a presentation on iSoQ</a></li>
        <li><a href="https://vimeo.com/738892529" target="_blank">Watch a demo of the iSoQ tool</a></li>
        <li><a href="https://training.cochrane.org/resource/how-the-isoq-tool-can-help-you-apply-grade-cerqual-in-your-qes" target="_blank">Access the Cochrane Learning Live training on iSoQ</a></li>
      </ul>

      <h3>{{ $t('help.gc_webinars') }}</h3>
      <ul>
        <li><a href="https://training.cochrane.org/resource/grade-cerqual-webinar" target="_blank">Access the Cochrane Training Webinar on GRADE-CERQual</a></li>
        <li><a href="https://www.cerqual.org/upcoming-events/" target="_blank">Information on upcoming live GRADE-CERQual webinars</a></li>
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
