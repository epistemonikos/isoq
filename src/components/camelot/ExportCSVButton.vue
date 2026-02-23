<template>
  <b-button
    variant="outline-primary"
    size="sm"
    @click="exportToCSV">
    <i class="fas fa-file-csv mr-1"></i>
    {{ $t('camelot.step_three.export_csv') }}
  </b-button>
</template>

<script>
import { exportTableToCSV } from '@/utils/csvExporter'
import Commons from '@/utils/commons'

export default {
  name: 'ExportCSVButton',
  props: {
    fields: {
      type: Array,
      required: true
    },
    items: {
      type: Array,
      required: true
    },
    filename: {
      type: String,
      default: 'characteristics_of_studies'
    }
  },
  methods: {
    formatAuthors (item) {
      return Commons.parseReference(item, true, false)
    },
    exportToCSV () {
      // Pre-process items: format authors and replace undefined/null with empty strings
      const processedItems = this.items.map(item => {
        const processed = {}
        this.fields.forEach(field => {
          if (field.key === 'authors') {
            processed[field.key] = this.formatAuthors(item)
          } else {
            const val = item[field.key]
            processed[field.key] = (val !== undefined && val !== null) ? val : ''
          }
        })
        return processed
      })

      exportTableToCSV({
        fields: this.fields,
        items: processedItems,
        filename: this.filename,
        excludeKeys: ['ref_id', 'id', 'actions']
      })
    }
  }
}
</script>
