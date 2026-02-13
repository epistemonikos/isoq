<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="py-5">
        <h2>{{ $t("menu.about") }}</h2>
      </div>
    </b-container>
    <b-container fluid class="pt-5 pb-5">
      <h3>{{ $t('about.what_is_isoq') }}</h3>
      <p>{{ $t('about.what_is_isoq_p1') }}</p>
      <ul>
        <li>{{ $t('about.what_is_isoq_li1') }}</li>
        <li>{{ $t('about.what_is_isoq_li2') }}</li>
        <li>{{ $t('about.what_is_isoq_li3') }}</li>
      </ul>
      <i18n path="about.launch_text" tag="p">
        <a href="https://vimeo.com/737300971" target="_blank" place="0">{{ $t('about.presentation') }}</a>
        <a href="https://vimeo.com/738892529" target="_blank" place="1">{{ $t('about.live_demo') }}</a>
      </i18n>

      <h3>{{ $t('about.what_is_gc') }}</h3>
      <i18n path="about.gc_desc" tag="p">
        <a href="https://www.cerqual.org" target="_blank" place="0">GRADE-CERQual</a>
      </i18n>

      <h3>{{ $t('about.when_use') }}</h3>
      <p>{{ $t('about.when_use_p1') }}</p>
      <p>{{ $t('about.when_use_p2') }}</p>
      <i18n path="about.when_use_p3" tag="p" class="text-primary">
        <a href="https://doi.org/10.5281/zenodo.5101812" target="_blank" place="0"><u>{{ $t('about.epoc_template') }}</u></a>
      </i18n>

      <h3>{{ $t('about.replace_software') }}</h3>
      <p>{{ $t('about.replace_desc') }}</p>

      <h3>{{ $t('about.invite_collaborators') }}</h3>
      <p>{{ $t('about.invite_desc') }}</p>

      <h3>{{ $t('about.export') }}</h3>
      <p>{{ $t('about.export_desc') }}</p>

      <h3>{{ $t('about.public') }}</h3>
      <p>{{ $t('about.public_desc') }}</p>

      <h3>{{ $t('about.mac') }}</h3>
      <p>
        {{ $t('about.mac_desc') }}
      </p>

      <h3>{{ $t('about.funding') }}</h3>
      <p>{{ $t('about.funding_desc') }}</p>

      <h3>{{ $t('about.licence') }}</h3>
      <ul>
        <i18n path="about.licence_li1" tag="li">
          <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" place="0">Creative Commons Attribution Non-Commercial ShareAlike International Licence (CC-BY-NC-SA)</a>
        </i18n>
        <i18n path="about.licence_li2" tag="li">
          <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" target="_blank" place="0">Creative Commons Attribution-Non-Commercial No-Derivatives 4.0 International Licence (CC-BY-NC-ND)</a>
        </i18n>
        <i18n path="about.licence_li3" tag="li">
          <a href="https://implementationscience.biomedcentral.com/articles/supplements/volume-13-supplement-1" target="_blank" place="0">{{ $t('about.licence_li3_link') }}</a>
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" place="1">Creative Commons Attribution 4.0 International Licence (CC-BY)</a>
        </i18n>
        <i18n path="about.licence_li4" tag="li">
          <a href="https://creativecommons.org" target="_blank" place="0">Creative Commons</a>
          <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" target="_blank" place="1">CC-BY-NC-ND</a>
        </i18n>
      </ul>

      <h3>{{ $t('about.cite') }}</h3>
      <p>{{ $t('about.cite_desc') }}</p>
    </b-container>
  </div>
</template>

<script>
export default {

}
</script>

<style>

</style>
