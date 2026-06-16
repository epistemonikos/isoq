<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="py-5">
        <h2>Privacy and Terms</h2>
      </div>
    </b-container>
    <b-container class="py-5">
      <b-tabs v-model="activeTab" nav-class="privacy-terms-nav">
        <b-tab title="Overview">
          <div class="tab-content-area">
            <h4 class="mb-4">Frequently Asked Questions</h4>
            <div class="faq-list">
              <div v-for="(item, index) in faqItems" :key="index" class="faq-item mb-3">
                <button class="faq-question w-100 text-left d-flex justify-content-between align-items-center"
                  :aria-expanded="item.open ? 'true' : 'false'" @click="toggleFaq(index)">
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

        <b-tab title="Terms and Conditions">
          <div class="tab-content-area">
            <h4 class="mb-4">Terms and Conditions</h4>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum.</p>
            <p>Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra,
              est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod
              gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut
              ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas
              fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec,
              commodo eget, iaculis quis, ante. Phasellus semper porta diam.</p>
            <p>Sed molestie augue sit amet leo consequat posuere. Vestibulum ante ipsum primis in faucibus orci luctus
              et ultrices posuere cubilia curae; Proin vel ante a orci tempus eleifend ut et magna. Lorem ipsum dolor
              sit amet, consectetur adipiscing elit. Vivamus luctus urna sed urna ultricies ac tempor dui sagittis.</p>
          </div>
        </b-tab>

        <b-tab title="Privacy Policy">
          <div class="tab-content-area">
            <h4 class="mb-4">Privacy Policy</h4>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum.</p>
            <p>Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra,
              est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod
              gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut
              ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas
              fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec,
              commodo eget, iaculis quis, ante. Phasellus semper porta diam.</p>
            <p>Sed molestie augue sit amet leo consequat posuere. Vestibulum ante ipsum primis in faucibus orci luctus
              et ultrices posuere cubilia curae; Proin vel ante a orci tempus eleifend ut et magna. Lorem ipsum dolor
              sit amet, consectetur adipiscing elit. Vivamus luctus urna sed urna ultricies ac tempor dui sagittis.</p>
          </div>
        </b-tab>

        <b-tab title="Other">
          <div class="tab-content-area">
            <h4 class="mb-4">Other</h4>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum.</p>
            <p>Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra,
              est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod
              gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut
              ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas
              fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec,
              commodo eget, iaculis quis, ante. Phasellus semper porta diam.</p>
          </div>
        </b-tab>
      </b-tabs>
    </b-container>
  </div>
</template>

<script>
const TAB_MAP = { overview: 0, terms: 1, privacy: 2, other: 3 }
const TAB_KEYS = ['overview', 'terms', 'privacy', 'other']

export default {
  name: 'PrivacyAndTerms',
  data() {
    return {
      activeTab: TAB_MAP[this.$route.query.tab] || 0,
      faqItems: [
        {
          question: 'What is iSoQ and who is it for?',
          answer: 'iSoQ (Interactive Summary of Qualitative Findings) is a tool developed by the Epistemonikos Foundation to help researchers create and share structured summaries of qualitative research evidence using the GRADE-CERQual approach. It is designed for systematic review authors, guideline developers, and evidence synthesis teams.',
          open: false
        },
        {
          question: 'How is my personal data used?',
          answer: 'Your personal data is used solely to provide and improve the iSoQ service. We collect only the information necessary to create and manage your account, collaborate on projects, and communicate service-related updates. We do not sell or share your data with third parties for marketing purposes.',
          open: false
        },
        {
          question: 'Who can see my projects and data?',
          answer: 'Projects are private by default and visible only to workspace members you invite. You can choose to publish a project publicly, at which point a read-only preview becomes accessible to anyone. You have full control over the visibility of your work at all times.',
          open: false
        },
        {
          question: 'Can I delete my account and data?',
          answer: 'Yes. You may request deletion of your account and associated personal data at any time by contacting us. Upon verified request, we will remove your personal information from our active systems within a reasonable timeframe, subject to any legal retention obligations.',
          open: false
        },
        {
          question: 'What cookies does iSoQ use?',
          answer: 'iSoQ uses session cookies required for authentication and to keep you logged in during your visit. We do not use third-party advertising or tracking cookies. You can manage cookie preferences through your browser settings, though disabling session cookies will prevent you from logging in.',
          open: false
        },
        {
          question: 'How do I report a concern or request support?',
          answer: 'For privacy concerns, data requests, or technical support, please contact the Epistemonikos team through the official contact channels listed on the Epistemonikos Foundation website. We aim to respond to all inquiries within 5 business days.',
          open: false
        }
      ]
    }
  },
  watch: {
    '$route.query.tab'(tab) {
      const index = TAB_MAP[tab] || 0
      if (this.activeTab !== index) this.activeTab = index
    },
    activeTab(index) {
      const tab = TAB_KEYS[index]
      if (this.$route.query.tab !== tab) {
        this.$router.replace({ query: { tab } })
      }
    }
  },
  methods: {
    toggleFaq(index) {
      this.faqItems[index].open = !this.faqItems[index].open
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
