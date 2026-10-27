<template>
  <article class="legal-document">
    <h3 class="mb-2">{{ part.heading }}</h3>
    <p v-if="part.meta" class="legal-meta text-muted small mb-4">{{ part.meta }}</p>
    <p v-if="part.intro" v-html="inline(part.intro)"></p>

    <template v-for="(block, index) in part.blocks || []">
      <h4 v-if="block.type === 'h2'" :key="index" class="legal-section">{{ block.text }}</h4>
      <h5 v-else-if="block.type === 'h3'" :key="index" class="legal-section">{{ block.text }}</h5>
      <ul v-else-if="block.type === 'ul'" :key="index">
        <li v-for="(item, itemIndex) in block.items" :key="itemIndex" v-html="inline(item)"></li>
      </ul>
      <div v-else-if="block.type === 'table'" :key="index" class="table-responsive mb-3">
        <table class="table table-sm table-bordered legal-table">
          <thead>
            <tr>
              <th v-for="(cell, cellIndex) in block.head" :key="cellIndex" scope="col">{{ cell }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in block.rows" :key="rowIndex">
              <td v-for="(cell, cellIndex) in row" :key="cellIndex" v-html="inline(cell)"></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else :key="index" v-html="inline(block.text)"></p>
    </template>

    <div v-if="part.items" class="faq-list">
      <div v-for="(item, index) in part.items" :key="index" class="faq-item mb-3">
        <button
          class="faq-question w-100 text-left d-flex justify-content-between align-items-center"
          :aria-expanded="isOpen(index) ? 'true' : 'false'"
          @click="toggle(index)">
          <span>{{ item.q }}</span>
          <font-awesome-icon :icon="isOpen(index) ? 'chevron-up' : 'chevron-down'" class="faq-icon" />
        </button>
        <div v-if="isOpen(index)" class="faq-answer">
          <p v-html="inline(item.a)"></p>
        </div>
      </div>
    </div>
  </article>
</template>

<script>
import { legalInline } from '@/utils/legalInline'

// One part of the legal package (src/lang/legal/*.json). Every v-html goes through
// legalInline, which escapes the text before adding <strong> and the placeholder marks.
export default {
  name: 'LegalDocument',
  props: {
    part: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      // Open questions by position: state of the session, not of the text, so it survives a
      // change of language.
      openItems: []
    }
  },
  methods: {
    inline: legalInline,
    isOpen (index) {
      return this.openItems.includes(index)
    },
    toggle (index) {
      this.openItems = this.isOpen(index)
        ? this.openItems.filter(open => open !== index)
        : [...this.openItems, index]
    }
  }
}
</script>

<style lang="scss" scoped>
.legal-document {
  line-height: 1.6;
  overflow-wrap: break-word;
}

.legal-section {
  margin-top: 1.75rem;
}

.legal-table {
  font-size: 0.9rem;
}

.legal-document ::v-deep .legal-placeholder {
  background: #fff3cd;
  padding: 0 0.15rem;
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

  &:hover,
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

  p {
    margin-bottom: 0;
  }
}
</style>
