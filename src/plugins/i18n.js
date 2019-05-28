import Vue from 'vue'
import VueI18n from 'vue-i18n'
import en from '@/lang/en.json'
import es from '@/lang/es.json'

Vue.use(VueI18n)

// Create VueI18n instance with options
export const i18n = new VueI18n({
  locale: 'en', // set locale
  fallbackLocale: 'en',
  messages: {en, es} // set locale messages
})
