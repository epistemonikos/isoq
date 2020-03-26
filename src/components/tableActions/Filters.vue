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
              sm="8"
              align-self="center">
              <b-form-group
                label="Search">
                <b-input-group>
                  <b-form-input
                    v-model="tableSettings.filter"></b-form-input>
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
              sm="2"
              align-self="center">
              <b-form-group label="Items per page" >
                <b-form-select
                  v-model="tableSettings.perPage"
                  :options="tableSettings.pageOptions"></b-form-select>
              </b-form-group>
            </b-col>
            <b-col
              cols="12"
              sm="2"
              align-self="center">
              <b-button
                block
                class="mt-4"
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
      const types = ['chars_of_studies', 'meth_assessments']
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
                csv = csv.concat('"' + _protoCSV[_element][index][key] + ((cnt < Object.keys(_protoCSV[_element][index]).length) ? '",' : '"' + '\n'))
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
