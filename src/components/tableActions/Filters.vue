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
                @click="exportToCSV(type)">
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
  methods: {
    exportToCSV: function (type) {
      var csv = 'data:text/csv;charset=utf-8,'
      const types = ['chars_of_studies', 'meth_assessments', 'extracted_data']
      let _keys = []
      var cnt = 1

      if (types.indexOf(type) !== -1) {
        let _protoCSV = []
        _protoCSV.push(JSON.parse(JSON.stringify(this.local_fields)))
        _protoCSV.push(JSON.parse(JSON.stringify(this.local_items)))

        for (let _element in _protoCSV) {
          if (_element === '0') {
            cnt = 1
            for (let element of _protoCSV[_element]) {
              _keys.push(element.key)
              csv = csv.concat('"' + element.label + ((cnt < _protoCSV[_element].length) ? '",' : '"' + '\n'))
              cnt++
            }
          } else {
            for (let index in _protoCSV[_element]) {
              cnt = 1
              for (let key of _keys) {
                csv = csv.concat('"' + _protoCSV[_element][index][key] + ((cnt < _keys.length) ? '",' : '"' + '\n'))
                cnt++
              }
            }
          }
        }
      }

      let encodedUri = encodeURI(csv)
      let link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', type + '.csv')
      document.body.appendChild(link)

      link.click()
    }
  }
}
</script>
