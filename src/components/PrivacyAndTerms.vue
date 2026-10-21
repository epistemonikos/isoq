<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="py-5">
        <h2>{{ $t('gdpr.privacyAndTerms.title') }}</h2>
      </div>
    </b-container>
    <b-container class="py-5">
      <b-tabs v-model="activeTab" nav-class="privacy-terms-nav">

        <b-tab :title="$t('gdpr.privacyAndTerms.tabOverview')">
          <div class="tab-content-area">
            <h4 class="mb-4">{{ $t('gdpr.privacyAndTerms.faqTitle') }}</h4>
            <div class="faq-list">
              <div v-for="(item, index) in faqItems" :key="index" class="faq-item mb-3">
                <button
                  class="faq-question w-100 text-left d-flex justify-content-between align-items-center"
                  :aria-expanded="item.open ? 'true' : 'false'"
                  @click="toggleFaq(index)">
                  <span>{{ item.question }}</span>
                  <font-awesome-icon :icon="item.open ? 'chevron-up' : 'chevron-down'" class="faq-icon" />
                </button>
                <div v-if="item.open" class="faq-answer">
                  <p>{{ item.answer }}</p>
                </div>
              </div>
            </div>
          </div>
        </b-tab>

        <b-tab :title="$t('gdpr.privacyAndTerms.tabTerms')">
          <div class="tab-content-area">
            <h4 class="mb-4">{{ $t('gdpr.privacyAndTerms.tabTerms') }}</h4>
            <p>{{ $t('gdpr.privacyAndTerms.terms.p1') }}</p>
            <p>{{ $t('gdpr.privacyAndTerms.terms.p2') }}</p>
            <p>{{ $t('gdpr.privacyAndTerms.terms.p3') }}</p>
          </div>
        </b-tab>

        <b-tab :title="$t('gdpr.privacyAndTerms.tabPrivacy')">
          <div class="tab-content-area">
            <h4 class="mb-4">{{ $t('gdpr.privacyAndTerms.tabPrivacy') }}</h4>
            <p>{{ $t('gdpr.privacyAndTerms.privacy.p1') }}</p>
            <p>{{ $t('gdpr.privacyAndTerms.privacy.p2') }}</p>
            <p>{{ $t('gdpr.privacyAndTerms.privacy.p3') }}</p>
          </div>
        </b-tab>

        <b-tab :title="$t('gdpr.privacyAndTerms.tabProperty')">
          <div class="tab-content-area">
            <h4 class="mb-4">{{ $t('gdpr.privacyAndTerms.tabProperty') }}</h4>
            <p>{{ $t('gdpr.privacyAndTerms.property.p1') }}</p>
            <p>{{ $t('gdpr.privacyAndTerms.property.p2') }}</p>
          </div>
        </b-tab>

      </b-tabs>
    </b-container>
  </div>
</template>

<script>
const TAB_KEYS = ['overview', 'terms', 'privacy', 'property']

// Cuántas preguntas tiene el acordeón. Las claves son
// gdpr.privacyAndTerms.faq.q1..q6 / a1..a6 en los tres idiomas.
const FAQ_COUNT = 6

// indexOf en vez del `TAB_MAP[tab] || 0` del original: aquél funciona sólo
// por casualidad, porque overview ya es 0 y `0 || 0` da 0. Si se reordenan
// las pestañas, `||` descartaría un índice válido.
function tabIndex (tab) {
  const index = TAB_KEYS.indexOf(tab)
  return index === -1 ? 0 : index
}

export default {
  name: 'PrivacyAndTerms',
  data () {
    return {
      activeTab: tabIndex(this.$route.query.tab),
      // Qué preguntas están desplegadas. Vive aparte del texto porque es
      // estado de la sesión, no contenido traducible.
      openFaqs: Array.from({ length: FAQ_COUNT }, () => false)
    }
  },
  computed: {
    // Computed y no data a propósito: cambiar de idioma NO remonta esta
    // vista. LanguageSelector.vue:26-28 hace $router.push a la ruta resuelta
    // con params.lang, pero estas rutas no llevan prefijo :lang, así que es
    // la misma ruta y no hay remonte. Con el texto congelado en data(), el
    // acordeón quedaría en inglés mientras el resto de la página pasa a
    // español. Leer $t() acá lo ata al locale de vue-i18n.
    //
    // Se genera por índice para que agregar una séptima pregunta sea tocar
    // los tres JSON y subir FAQ_COUNT, sin editar el componente.
    faqItems () {
      return Array.from({ length: FAQ_COUNT }, (_, i) => {
        const index = i + 1
        return {
          question: this.$t(`gdpr.privacyAndTerms.faq.q${index}`),
          answer: this.$t(`gdpr.privacyAndTerms.faq.a${index}`),
          open: this.openFaqs[i]
        }
      })
    }
  },
  watch: {
    '$route.query.tab' (tab) {
      const index = tabIndex(tab)
      if (this.activeTab !== index) this.activeTab = index
    },
    activeTab (index) {
      const tab = TAB_KEYS[index]
      if (this.$route.query.tab !== tab) {
        this.$router.replace({ query: { tab } })
      }
    }
  },
  methods: {
    // $set y no openFaqs[index] = ...: Vue 2 no intercepta la asignación por
    // índice en arrays, así que el re-render no se dispararía.
    toggleFaq (index) {
      this.$set(this.openFaqs, index, !this.openFaqs[index])
    }
  }
}
</script>

<style lang="scss" scoped>
.tab-content-area {
  padding: 2rem 0;
}

.faq-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.faq-question {
  background: #f8f9fa;
  border: none;
  padding: 1rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: #eef0f2;
  }

  &[aria-expanded="true"] {
    background: #eef0f2;
  }
}

.faq-icon {
  flex-shrink: 0;
  margin-left: 1rem;
  color: #6c757d;
  font-size: 0.8rem;
}

.faq-answer {
  padding: 1rem 1.25rem;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  color: #555;
  font-size: 0.9rem;
  line-height: 1.6;

  p {
    margin-bottom: 0;
  }
}
</style>
