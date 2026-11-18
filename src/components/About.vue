<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="py-5">
        <h2>{{ $t("menu.about") }}</h2>
      </div>
    </b-container>
    <b-container fluid class="pt-3 pb-5">
      <div class="row">
        <div class="col-md-3 mb-4">
          <nav data-test="about-toc" class="about-toc bg-light p-3 rounded border" :aria-label="$t('about.contents')">
            <h5 class="mb-3 border-bottom pb-2">{{ $t('about.contents') }}</h5>
            <ul class="nav flex-column">
              <li v-for="section in sections" :key="section.id" class="nav-item">
                <a class="nav-link px-0" :href="sectionHref(section.id)" @click.prevent="scrollToSection(section.id)">{{ $t(section.title) }}</a>
              </li>
            </ul>
          </nav>
        </div>

        <div class="col-md-9 about-sections">
          <h3 id="what-is-isoq">{{ $t('about.what_is_isoq') }}</h3>
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

          <h3 id="what-is-grade-cerqual">{{ $t('about.what_is_gc') }}</h3>
          <i18n path="about.gc_desc" tag="p">
            <a href="https://www.cerqual.org" target="_blank" place="0">GRADE-CERQual</a>
          </i18n>

          <h3 id="when-to-use">{{ $t('about.when_use') }}</h3>
          <p>{{ $t('about.when_use_p1') }}</p>
          <p>{{ $t('about.when_use_p2') }}</p>
          <i18n path="about.when_use_p3" tag="p" class="text-primary">
            <a href="https://doi.org/10.5281/zenodo.5101812" target="_blank" place="0"><u>{{ $t('about.epoc_template') }}</u></a>
          </i18n>

          <h3 id="replace-software">{{ $t('about.replace_software') }}</h3>
          <p>{{ $t('about.replace_desc') }}</p>

          <h3 id="invite-collaborators">{{ $t('about.invite_collaborators') }}</h3>
          <p>{{ $t('about.invite_desc') }}</p>

          <h3 id="export">{{ $t('about.export') }}</h3>
          <p>{{ $t('about.export_desc') }}</p>

          <h3 id="public">{{ $t('about.public') }}</h3>
          <p>{{ $t('about.public_desc') }}</p>

          <h3 id="mac-compatibility">{{ $t('about.mac') }}</h3>
          <p>
            {{ $t('about.mac_desc') }}
          </p>

          <h3 id="funding">{{ $t('about.funding') }}</h3>
          <p>{{ $t('about.funding_desc') }}</p>

          <h3 id="licence">{{ $t('about.licence') }}</h3>
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

          <h3 id="cite">{{ $t('about.cite') }}</h3>
          <i18n path="about.cite_desc" tag="p">
            <router-link :to="{ name: 'About' }" place="0">{{ $t('about.cite_team_link') }}</router-link>
          </i18n>
          <p><small>{{ $t('about.cite_team') }}</small></p>

          <h3 id="terms-and-conditions">{{ $t('about.terms') }}</h3>
          <i18n path="about.terms_desc" tag="p">
            <router-link :to="{ name: 'PrivacyAndTerms' }" place="0">{{ $t('about.terms_link') }}</router-link>
          </i18n>
        </div>
      </div>
    </b-container>
  </div>
</template>

<script>
// Same order as the headings below; the ids match the old table of contents on master.
const SECTIONS = [
  { id: 'what-is-isoq', title: 'about.what_is_isoq' },
  { id: 'what-is-grade-cerqual', title: 'about.what_is_gc' },
  { id: 'when-to-use', title: 'about.when_use' },
  { id: 'replace-software', title: 'about.replace_software' },
  { id: 'invite-collaborators', title: 'about.invite_collaborators' },
  { id: 'export', title: 'about.export' },
  { id: 'public', title: 'about.public' },
  { id: 'mac-compatibility', title: 'about.mac' },
  { id: 'funding', title: 'about.funding' },
  { id: 'licence', title: 'about.licence' },
  { id: 'cite', title: 'about.cite' },
  { id: 'terms-and-conditions', title: 'about.terms' }
]

export default {
  name: 'About',
  data () {
    return { sections: SECTIONS }
  },
  mounted () {
    const id = (this.$route.hash || '').slice(1)
    if (id) this.$nextTick(() => this.scrollToSection(id))
  },
  methods: {
    // The router is in hash mode: a bare href="#cite" is a route change, and the catch-all route
    // sends it to the home page. The href carries the About route plus the section, so a copied or
    // new-tab link still opens here; a click only scrolls, since any navigation jumps to the top.
    sectionHref (id) {
      return this.$router.resolve({ name: 'About', hash: `#${id}` }).href
    },
    scrollToSection (id) {
      const heading = this.$el.querySelector(`.about-sections [id="${id}"]`)
      if (!heading) return
      heading.scrollIntoView({ block: 'start' })
      // Keyboard and screen reader users carry on reading from the section, not from the link.
      heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
    }
  }
}
</script>

<style scoped>
@media (min-width: 768px) {
  .about-toc {
    position: sticky;
    top: 1rem;
  }
}
.about-sections h3 {
  scroll-margin-top: 1rem;
}
.about-sections h3:focus {
  outline: none;
}
</style>
