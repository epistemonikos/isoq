<template>
  <b-dropdown
    variant="primary"
    size="sm"
    no-caret
    v-bind="modalSafeDropdown"
    class="table-column-filter"
    ref="dropdown"
    @show="startDraft"
    @hide="finishDraft"
    @keydown.native.capture.esc="discardOnClose = true"
  >
    <template #button-content>
      {{ $t('common.filter_columns') }}
      <font-awesome-icon icon="filter" class="ml-1" />
    </template>

    <b-dropdown-form class="p-2" :style="menuStyle">
      <b-form-checkbox
        :checked="allSelected"
        :indeterminate="indeterminate"
        @change="toggleAll"
        class="mb-2 font-weight-bold"
      >
        {{ $t('common.show_all') }}
      </b-form-checkbox>

      <b-dropdown-divider></b-dropdown-divider>

      <div v-for="column in allColumns" :key="column.key" class="mb-1">
        <b-form-checkbox
          :checked="isColumnVisible(column.key)"
          @change="toggleColumn(column.key, $event)"
          :disabled="isLastVisible && isColumnVisible(column.key)"
        >
          {{ column.label }}
        </b-form-checkbox>
      </div>

      <!-- #412: its own Apply, so nobody reaches for the modal's Save to confirm the filter. -->
      <div class="table-column-filter__footer d-flex justify-content-end pt-2">
        <b-button
          variant="primary"
          size="sm"
          data-testid="column-filter-apply"
          @click="apply"
        >
          {{ $t('common.apply') }}
        </b-button>
      </div>
    </b-dropdown-form>
  </b-dropdown>
</template>

<script>
import { MODAL_SAFE_DROPDOWN, MODAL_SAFE_MENU_STYLE } from '@/utils/modalSafeDropdown'

const sameKeys = (a, b) => a.length === b.length && a.every(k => b.includes(k))

export default {
  name: 'TableColumnFilter',
  data () {
    return {
      // Also used inside scrollable modals (Adequacy, Relevance): see #397.
      modalSafeDropdown: MODAL_SAFE_DROPDOWN,
      menuStyle: { minWidth: '250px', ...MODAL_SAFE_MENU_STYLE },
      // #412: while the menu is open the choice is a draft; it reaches the table
      // when the menu closes (Apply or a click outside), and Esc throws it away.
      draft: null,
      discardOnClose: false
    }
  },
  props: {
    allColumns: {
      type: Array,
      required: true
      // Expected format: [{ key: 'col_key', label: 'Column Label' }, ...]
    },
    value: {
      type: Array,
      required: true
      // Array of visible column keys
    },
    minVisible: {
      type: Number,
      default: 1
    }
  },
  computed: {
    localVisible: {
      get () {
        return this.draft || this.value
      },
      set (newVal) {
        this.draft = newVal
      }
    },
    validVisibleKeys () {
      // Keys in localVisible that are actually present in allColumns
      return this.localVisible.filter(k => this.allColumns.some(c => c.key === k))
    },
    allSelected () {
      return this.allColumns.length > 0 && this.validVisibleKeys.length === this.allColumns.length
    },
    indeterminate () {
      return this.validVisibleKeys.length > 0 && this.validVisibleKeys.length < this.allColumns.length
    },
    isLastVisible () {
      return this.validVisibleKeys.length <= this.minVisible
    }
  },
  methods: {
    startDraft () {
      this.draft = [...this.value]
      this.discardOnClose = false
    },
    finishDraft () {
      const draft = this.draft
      const discard = this.discardOnClose
      this.draft = null
      this.discardOnClose = false
      if (discard || !draft || sameKeys(draft, this.value)) return
      this.$emit('input', draft)
    },
    apply () {
      // Closing is what applies: Apply and a click outside take the same path.
      this.$refs.dropdown.hide(true)
    },
    isColumnVisible (key) {
      return this.localVisible.includes(key)
    },
    toggleAll (checked) {
      if (checked) {
        // Select all
        const newKeys = this.allColumns.map(c => c.key)
        // Merge with existing to keep ghosts
        this.localVisible = Array.from(new Set([...this.localVisible, ...newKeys]))
      } else {
        // Deselect all (keep first)
        if (this.allColumns.length > 0) {
          const keepKey = this.allColumns[0].key
          // Remove all valid keys except keepKey
          const validKeysToRemove = this.allColumns.filter(c => c.key !== keepKey).map(c => c.key)
          this.localVisible = this.localVisible.filter(k => !validKeysToRemove.includes(k))

          // Ensure keepKey is visible
          if (!this.localVisible.includes(keepKey)) {
            this.localVisible.push(keepKey)
          }
        }
      }
    },
    toggleColumn (key, checked) {
      let newVisible = [...this.localVisible]

      if (checked) {
        if (!newVisible.includes(key)) {
          newVisible.push(key)
        }
      } else {
        // Check constraint against valid visible columns
        const validVisibleColumns = newVisible.filter(k => this.allColumns.some(c => c.key === k))

        // Prevent unchecking if it's the last one
        if (validVisibleColumns.length <= this.minVisible && validVisibleColumns.includes(key)) {
          return
        }

        newVisible = newVisible.filter(k => k !== key)
      }

      this.localVisible = newVisible
    }
  }
}
</script>

<style scoped>
/* Prevent dropdown from closing when clicking inside form */
.dropdown-menu {
  padding: 0;
}

/* The menu scrolls inside itself (MODAL_SAFE_MENU_STYLE): keep Apply in view on a long list. */
.table-column-filter__footer {
  position: sticky;
  bottom: -0.5rem; /* cover the form's own bottom padding (p-2) */
  margin-bottom: -0.5rem;
  padding-bottom: 0.5rem;
  background-color: #fff;
}

html[data-theme="dark"] .table-column-filter__footer {
  background-color: #2a2a2a; /* .dropdown-menu in dark mode, main.scss */
}
</style>
