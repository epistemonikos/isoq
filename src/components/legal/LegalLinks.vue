<template>
  <!-- A new window: leaving the sign-up form or the acceptance modal loses what was typed. -->
  <span class="legal-links">
    <template v-for="(key, index) in parts">
      <span v-if="index" :key="`${key}-separator`"> · </span><router-link :key="key" :to="{ name: 'PrivacyAndTerms', query: { tab: key } }" target="_blank">{{ $t(`gdpr.privacyAndTerms.tabs.${key}`) }}</router-link>
    </template>
  </span>
</template>

<script>
// Links to parts of the legal package, named as their tabs in /privacy-and-terms.
export default {
  name: 'LegalLinks',
  props: {
    // Keys of LEGAL_PARTS (src/constants/legal.js).
    parts: {
      type: Array,
      required: true
    }
  }
}
</script>
