import Papa from 'papaparse'
import Api from '@/utils/Api'
import { exportTableToCSV } from '@/utils/csvExporter'

export const tableImportExportMixin = {
  data () {
    return {
      importDataTable: {
        error: null,
        fields: [],
        items: [],
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      },
      pre_ImportDataTable: ''
    }
  },

  methods: {
    generateTemplate () {
      const _refs = JSON.parse(JSON.stringify(this.refs))
      const obj = {
        fields: ['Reference ID', 'Author(s), Year'],
        data: []
      }

      for (const ref of _refs) {
        obj.data.push([ref.id, ref.content.split(';')[0]])
      }

      const data = Papa.unparse(obj)
      const csvData = new Blob([data], { type: 'text/csv;charset=utf-8;' })
      const csvURL = window.URL.createObjectURL(csvData)

      const link = document.createElement('a')
      link.setAttribute('href', csvURL)
      link.setAttribute('download', 'my_data.csv')
      document.body.appendChild(link)
      link.click()
    },

    loadTableImportData (event) {
      const file = event.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        this.pre_ImportDataTable = e.target.result
      }
      reader.readAsText(file)
    },

    cleanVars (isCancel = false) {
      this.importDataTable = {
        error: null,
        fields: [],
        items: [],
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      }
      this.pre_ImportDataTable = ''
      if (isCancel) {
        this.$refs[`import-table-${this.type}`].hide()
      }
    },

    exportTableToCSV () {
      exportTableToCSV({
        fields: this.dataTable.fields,
        items: this.dataTable.items,
        filename: 'exportable_table'
      })
    },

    async saveImportedData () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id,
        fields: this.importDataTable.fields,
        items: this.importDataTable.items
      }

      if (this.importDataTable.fields.length && this.importDataTable.items.length) {
        try {
          if (this.dataTable.items.length) {
            await this.cleanImportedData(this.dataTable.id, params)
          } else {
            await this.insertImportedData(params)
          }
          this.cleanVars()
        } catch (error) {
          this.$emit('print-errors', error)
        }
      }
    },

    async cleanImportedData (id, params) {
      await Api.delete(`/${this.type}/${id}`)
      this.pre_ImportDataTable = ''
      await this.insertImportedData(params)
    },

    async insertImportedData (params) {
      if (!params.organization || !params.project_id || !params.fields || !params.items) {
        return
      }
      await Api.post(`/${this.type}/`, params)
      this.$emit('get-project')
      this.$refs[`import-table-${this.type}`].hide()
    }
  }
}