<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="py-5">
        <h2>{{ $t('gdpr.privacyAndTerms.title') }}</h2>
      </div>
    </b-container>
    <b-container class="py-5">
      <!-- Clause 11.4 of the Terms: the English version prevails over any translation. -->
      <b-alert :show="isTranslation" variant="info" data-test="translation-notice">
        {{ $t(showOriginal ? 'gdpr.privacyAndTerms.originalNotice' : 'gdpr.privacyAndTerms.translationNotice') }}
        <b-button size="sm" variant="outline-info" class="ml-2" @click="showOriginal = !showOriginal">
          {{ $t(showOriginal ? 'gdpr.privacyAndTerms.showTranslation' : 'gdpr.privacyAndTerms.showOriginal') }}
        </b-button>
      </b-alert>

      <b-alert :show="status === 'error'" variant="warning" data-test="legal-load-error">
        {{ $t('gdpr.privacyAndTerms.loadError') }}
        <b-button size="sm" variant="outline-warning" class="ml-2" @click="load">
          {{ $t('common.retry') }}
        </b-button>
      </b-alert>

      <div v-if="status === 'loading'" class="text-center text-muted py-3">
        <b-spinner small class="mr-1"></b-spinner>
        {{ $t('common.loading') }}
      </div>

      <b-tabs v-model="activeTab" nav-class="privacy-terms-nav">
        <b-tab v-for="tab in tabs" :key="tab.key" :title="tab.title">
          <div class="tab-content-area">
            <legal-document v-if="documents" :part="documents.parts[tab.key]" />
          </div>
        </b-tab>
      </b-tabs>
    </b-container>
  </div>
</template>

<script>
import LegalDocument from '@/components/legal/LegalDocument'
import { LEGAL_PARTS, legalPartLetter } from '@/constants/legal'
import { loadLegalDocuments } from '@/utils/legalDocuments'

// The FAQ used to be the first tab, called overview: links shared before keep working.
const TAB_ALIASES = { overview: 'faq' }

// indexOf and not `map[tab] || 0`: with || a valid index 0 would only work by accident.
function tabIndex (tab) {
  const index = LEGAL_PARTS.indexOf(TAB_ALIASES[tab] || tab)
  return index === -1 ? 0 : index
}

export default {
  name: 'PrivacyAndTerms',
  components: { LegalDocument },
  data () {
    return {
      activeTab: tabIndex(this.$route.query.tab),
      documents: null,
      status: 'loading',
      showOriginal: false
    }
  },
  computed: {
    // Read from $i18n: changing language does NOT remount this view (LanguageSelector pushes
    // the same route, which has no :lang prefix).
    isTranslation () {
      return this.$i18n.locale !== 'en'
    },
    documentLocale () {
      return this.showOriginal ? 'en' : this.$i18n.locale
    },
    tabs () {
      return LEGAL_PARTS.map(key => ({
        key,
        title: `${legalPartLetter(key)} · ${this.$t(`gdpr.privacyAndTerms.tabs.${key}`)}`
      }))
    }
  },
  watch: {
    '$route.query.tab' (tab) {
      const index = tabIndex(tab)
      if (this.activeTab !== index) this.activeTab = index
    },
    activeTab (index) {
      const tab = LEGAL_PARTS[index]
      if (this.$route.query.tab !== tab) {
        this.$router.replace({ query: { tab } })
      }
    },
    documentLocale () {
      this.load()
    }
  },
  created () {
    this.load()
  },
  methods: {
    load () {
      const locale = this.documentLocale
      this.status = 'loading'
      return loadLegalDocuments(locale)
        .then((documents) => {
          // A slower answer for a language the page no longer shows must not replace it.
          if (locale !== this.documentLocale) return
          this.documents = documents
          this.status = 'ready'
        })
        .catch(() => {
          if (locale !== this.documentLocale) return
          this.status = 'error'
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.tab-content-area {
  padding: 2rem 0;
}
</style>
