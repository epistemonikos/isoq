<template>
  <div>
    <b-row
      v-if="showFilters"
      align-h="end">
      <b-col
        cols="12"
        sm="12">
        <b-card
          class="mt-3"
          bg-variant="light">
          <b-row>
            <b-col
              cols="12"
              sm="9"
              align-self="center">
              <b-form-group
                :label="$t('common.search')">
                <b-input-group>
                  <b-form-input
                    v-model="tableSettings.filter"
                    :placeholder="$t('action_table.search_placeholder')"></b-form-input>
                  <b-input-group-append>
                    <b-button
                      :disabled="!tableSettings.filter"
                      @click="tableSettings.filter = ''">{{ $t('common.clear') }}</b-button>
                  </b-input-group-append>
                </b-input-group>
              </b-form-group>
            </b-col>
            <b-col
              cols="12"
              sm="3"
              align-self="center"
              class="pt-3">
              <b-button
                block
                @click="toCSV(type)">
                {{ $t('characteristics.export_xls') }}
              </b-button>
            </b-col>
          </b-row>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>

<script>
const ExportToCsv = require('export-to-csv').ExportToCsv

export default {
  name: 'bCardFilters',
  props: {
    tableSettings: Object,
    idname: String,
    type: String,
    fields: Array,
    items: Array,
    showFilters: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      options: [],
      local_fields: this.fields,
      local_items: this.items
    }
  },
  watch: {
    items: function () {
      this.local_items = this.items
    }
  },
  methods: {
    orderKeys: function (obj) {
      var keys = Object.keys(obj).sort(function keyOrder (k1, k2) {
        if (k1 < k2) return -1
        else if (k1 > k2) return +1
        else return 0
      })

      let after = {}
      for (let i = 0; i < keys.length; i++) {
        after[keys[i]] = obj[keys[i]]
        delete obj[keys[i]]
      }

      for (let i = 0; i < keys.length; i++) {
        obj[keys[i]] = after[keys[i]]
      }
      return obj
    },
    toCSV: function (type) {
      const types = {
        'chars_of_studies': 'Characteristics of studies',
        'meth_assessments': 'Methodological assessments',
        'extracted_data': 'Extracted data'
      }
      let _fields = JSON.parse(JSON.stringify(this.local_fields))
      const _items = JSON.parse(JSON.stringify(this.local_items))
      let fields = []
      let keys = []
      for (let f of _fields) {
        if (f.key !== 'ref_id') {
          fields.push('"' + f.label + '"')
          keys.push(f.key)
        }
      }
      let items = []
      for (let i of _items) {
        let item = {}
        for (let k in keys) {
          if (Object.prototype.hasOwnProperty.call(i, keys[k])) {
            item[keys[k]] = i[keys[k]]
          } else {
            item[keys[k]] = ''
          }
        }
        items.push(item)
      }

      const options = {
        filename: types[type],
        fieldSeparator: ',',
        quoteStrings: '"',
        decimalSeparator: '.',
        showLabels: true,
        useBom: true,
        headers: fields
      }

      const csvExporter = new ExportToCsv(options)

      csvExporter.generateCsv(items)
    }
  }
}
</script>
