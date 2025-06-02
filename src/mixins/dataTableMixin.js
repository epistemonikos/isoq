import axios from 'axios'

export const dataTableMixin = {
  data () {
    return {
      dataTable: {
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ],
        fieldsObjOriginal: []
      },
      dataTableSettings: {
        currentPage: 1,
        perPage: 10,
        isBusy: false
      }
    }
  },

  methods: {
    async getData () {
      this.dataTableSettings.isBusy = true
      try {
        const params = {
          organization: this.$route.params.org_id,
          project_id: this.$route.params.id
        }
        const response = await axios.get(`/api/${this.type}`, { params })

        if (response.data && response.data.length) {
          const tableData = JSON.parse(JSON.stringify(response.data[0]))
          this.dataTable = tableData

          if (this.dataTable && typeof this.dataTable === 'object' && this.dataTable.hasOwnProperty('fields')) {
            this.processTableData()
          }
        } else {
          this.resetDataTable()
        }

        this.$emit('updateDataTable', this.dataTable, this.type)
      } catch (error) {
        console.error('Error fetching data:', error)
        var errorMessage = 'An error occurred'
        if (error && error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message
        }
        this.$emit('print-errors', errorMessage)
      } finally {
        this.dataTableSettings.isBusy = false
      }
    },

    processTableData () {
      this.dataTable.fieldsObj = [{ 'key': 'authors', 'label': 'Author(s), Year' }]
      const fields = JSON.parse(JSON.stringify(this.dataTable.fields))
      const items = JSON.parse(JSON.stringify(this.dataTable.items))

      const sortedItems = items.sort(function (a, b) {
        if (a.authors < b.authors) return -1
        if (a.authors > b.authors) return 1
        return 0
      })
      this.dataTable.items = sortedItems

      this.processFields(fields)
      this.processItems(sortedItems)
    },

    processFields (fields) {
      const processedFields = []
      for (var i = 0; i < fields.length; i++) {
        var field = fields[i]
        if (field.key !== 'ref_id' && field.key !== 'authors' && field.key !== 'actions') {
          processedFields.push(field.label)
          this.dataTable.fieldsObj.push({ key: field.key, label: field.label })
        }
      }
      return processedFields
    },

    resetDataTable () {
      this.dataTable = {
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      }
    }
  }
}
