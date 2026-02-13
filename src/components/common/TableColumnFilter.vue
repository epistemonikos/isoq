<template>
  <b-dropdown
    variant="outline-primary"
    size="sm"
    no-caret
    class="table-column-filter"
    ref="dropdown"
  >
    <template #button-content>
      <i class="fas fa-filter mr-1"></i>
      {{ $t('common.filter_columns') }}
    </template>

    <b-dropdown-form class="p-2" style="min-width: 250px; max-height: 400px; overflow-y: auto;">
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
    </b-dropdown-form>
  </b-dropdown>
</template>

<script>
export default {
  name: 'TableColumnFilter',
  props: {
    allColumns: {
      type: Array,
      required: true,
      // Expected format: [{ key: 'col_key', label: 'Column Label' }, ...]
    },
    value: {
      type: Array,
      required: true,
      // Array of visible column keys
    },
    minVisible: {
      type: Number,
      default: 1
    }
  },
  computed: {
    localVisible: {
      get() {
        return this.value
      },
      set(newVal) {
        this.$emit('input', newVal)
      }
    },
    validVisibleKeys() {
      // Keys in localVisible that are actually present in allColumns
      return this.localVisible.filter(k => this.allColumns.some(c => c.key === k))
    },
    allSelected() {
      return this.allColumns.length > 0 && this.validVisibleKeys.length === this.allColumns.length
    },
    indeterminate() {
      return this.validVisibleKeys.length > 0 && this.validVisibleKeys.length < this.allColumns.length
    },
    isLastVisible() {
      return this.validVisibleKeys.length <= this.minVisible
    }
  },
  methods: {
    isColumnVisible(key) {
      return this.localVisible.includes(key)
    },
    toggleAll(checked) {
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
    toggleColumn(key, checked) {
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
</style>
