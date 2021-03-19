<template>
  <div>
    <b-row
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
                label="Search">
                <b-input-group>
                  <b-form-input
                    v-model="tableSettings.filter"
                    placeholder="Type to search the text in the table below"></b-form-input>
                  <b-input-group-append>
                    <b-button
                      :disabled="!tableSettings.filter"
                      @click="tableSettings.filter = ''">Clear</b-button>
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
                Export to XLS file
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
    items: Array
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
      // var csv = 'data:text/csv;charset=utf-8,'
      const types = {
        'chars_of_studies': 'Characteristics of studies',
        'meth_assessments': 'Methodological assessments',
        'extracted_data': 'Extracted data'
      }
      let _headers = []
      let headers = JSON.parse(JSON.stringify(this.local_fields))
      for (let header of headers) {
        if (header.key !== 'ref_id') {
          _headers.push('"' + header.label + '"')
        }
      }
      _headers.sort((a, b) => a - b)

      let items = JSON.parse(JSON.stringify(this.local_items))
      for (let item of items) {
        delete item.ref_id
        delete item.index
        item = this.orderKeys(item)
      }
      // console.log(items)
      let data = items

      const options = {
        filename: types[type],
        fieldSeparator: ',',
        quoteStrings: '"',
        decimalSeparator: '.',
        showLabels: true,
        useBom: true,
        headers: _headers
      }

      const csvExporter = new ExportToCsv(options)

      csvExporter.generateCsv(data)
    }
  }
}
</script>
