<template>
  <div>
    <b-card
      class="d-none d-sm-flex"
      bg-variant="light">
      <b-row>
        <b-col
          class="my-1"
          cols="12"
          sm="3"
          v-if="displayDeleteTable">
          <b-button
            block
            @click="modalDropTable"
            variant="outline-danger">
              <font-awesome-icon icon="table" />
              {{ $t('action_table.delete_table') }}
          </b-button>
        </b-col>
        <b-col
          class="my-1"
          cols="12"
          sm="3"
          v-if="displayEditTable">
          <b-button
            block
            @click="modalEditTable"
            variant="outline-primary">
              <font-awesome-icon icon="table" />
              {{ $t('action_table.edit_columns') }}
          </b-button>
        </b-col>
        <b-col
          class="my-1"
          cols="12"
          sm="3"
          v-if="displayImport">
          <b-button
            block
            @click="modalImport"
            variant="outline-success">
              <font-awesome-icon icon="file-upload" />
              {{ $t('action_table.import_data') }}
          </b-button>
        </b-col>
        <b-col
          class="my-1"
          cols="12"
          sm="3"
          v-if="displayCreateContent">
          <b-button
            block
            @click="modalCreateContent"
            variant="outline-success">
              <font-awesome-icon icon="plus" />
              {{ $t('action_table.add_data') }}
          </b-button>
        </b-col>
        <b-col
          class="my-1"
          cols="12"
          sm="3"
          v-if="displayCreateTable">
          <b-button
            block
            @click="modalCreateTable"
            variant="outline-primary">
              <font-awesome-icon icon="table" />
              {{ $t('action_table.create_table') }}
          </b-button>
        </b-col>
      </b-row>
    </b-card>
    <!-- import modal -->
    <b-modal
      id="modal-stage-import-tsv"
      ref="modal-stage-import-tsv"
      scrollable
      size="xl"
      @ok="importTSV"
      @cancel="cleanTSV"
      :title="$t('action_table.import_data')">
      <b-alert show variant="warning"><b>{{ $t('action_table.important') }}</b> {{ $t('action_table.import_warning') }}</b-alert>
      <b-form-group
        :label="$t('action_table.upload_tsv')"
        label-for="input-tsv-file">
        <b-form-file
          id="input-tsv-file"
          plain
          @change="loadTSV($event)"></b-form-file>
      </b-form-group>
      <div v-if="tsv.fields.length">
        <h5>{{ $t('common.preview') }}</h5>
        <b-table
          :fields="tsv.fields"
          :items="tsv.items"></b-table>
      </div>
    </b-modal>
    <!-- end import modal -->
    <!-- modal drop table -->
    <b-modal
      size="xl"
      id="modal-drop-table"
      :title="$t('action_table.drop_table')"
      ref="modal-drop-table"
      @ok="dropTable">
      <p>{{ $t('action_table.confirm_drop') }}</p>
    </b-modal>
    <!-- end modal drop table-->
    <!-- create study tables -->
    <b-modal
      size="xl"
      :title="$t('action_table.add_columns')"
      ref="modal-create-fields"
      @ok="saveCreateFields">
      <b-form-group
        id="nro-of-fields"
        :label="$t('action_table.nro_columns')"
        label-for="number-of-fields">
        <b-form-input
          id="number-of-fields"
          type="number"
          v-model="modalCreateFields.nro_of_fields"></b-form-input>
        </b-form-group>
      <b-form-group
        v-for="item in parseInt(modalCreateFields.nro_of_fields)"
        :key="item"
        :label="$t('action_table.column_name_n', {n: item})"
        :label-for="`field-${item}`">
        <b-form-input
        :id="`field-${item}`"
        type="text"
        v-model="modalCreateFields.fields[item - 1]"></b-form-input>
        </b-form-group>
    </b-modal>
    <!-- end of create study tables -->
    <!-- modal edit fields -->
    <b-modal
      size="xl"
      :title="$t('action_table.edit_fields')"
      ref="modal-edit-fields"
      @ok="saveUpdateFields"
      @cancel="cancelModalFields">
      <draggable v-model="modalEditFields" group="columns" @start="drag=true" @end="drag=false">
        <b-form-group
          v-for="(item, index) in modalEditFields"
          :key="index"
          :label="$t('action_table.column_n', {n: index})"
          :label-for="`field-${index}`">
          <b-input-group>
            <b-form-input
              :id="`field-${index}`"
              type="text"
              v-model="item.label"></b-form-input>
            <b-input-group-append
              v-if="modalEditFields.length > 1">
              <b-button
                @click="removeField(item, index)">
                <font-awesome-icon
                  icon="trash"></font-awesome-icon>
              </b-button>
            </b-input-group-append>
          </b-input-group>
        </b-form-group>
      </draggable>
      <b-button
        variant="outline-success"
        @click="addNewColumn">{{ $t('action_table.add_column') }}</b-button>
    </b-modal>
    <!-- end of modal edit fields -->
    <!-- create study data -->
    <b-modal
      size="xl"
      :title="$t('action_table.add_data')"
      ref="modal-add-data"
      @ok="saveNewData">
      <b-form-group
        v-for="(item, index) in modalAddData.fields"
        :key="index"
        :label="`${item.label}`"
        :label-for="`data-${index}`">
        <b-form-textarea
          :id="`data-${index}`"
          rows="6"
          max-rows="100"
          v-model="newItem[item.key]"></b-form-textarea>
      </b-form-group>
    </b-modal>
    <!-- end of create study data -->
  </div>
</template>

<script>
import Api from '@/utils/Api'
import draggable from 'vuedraggable'

export default {
  name: 'ActionTable',
  components: {
    draggable
  },
  props: {
    importUrl: '',
    displayDeleteTable: false,
    displayEditTable: false,
    displayImport: false,
    displayCreateTable: false,
    displayCreateContent: false,
    theContent: {}
  },
  data: function () {
    return {
      pre_tsv: '',
      tsv: {
        fields: [],
        items: []
      },
      modalCreateFields: {
        nro_of_fields: 1,
        fields: []
      },
      modalEditFields: [],
      modalContent: {},
      lastFieldColumnId: 0,
      modalAddData: {
        fields: [],
        items: []
      },
      newItem: {}
    }
  },
  methods: {
    loadTSV: function (event) {
      let file = event.target.files[0]
      let reader = new FileReader()
      reader.onload = (e) => {
        let lines = e.target.result.split('\n')
        for (let cnt in lines) {
          if (cnt < 1) {
            let header = lines[cnt].split('\t')
            for (let h in header) {
              this.tsv.fields.push({key: 'column_' + h, label: header[h]})
            }
          } else {
            let item = lines[cnt].split('\t')
            let e = {}
            for (let i in item) {
              e['column_' + i] = item[i]
            }
            this.tsv.items.push(e)
          }
        }
        this.pre_tsv = e.target.result
      }
      reader.readAsText(file)
    },
    cleanTSV: function () {
      this.pre_tsv = ''
      this.tsv = {fields: [], items: []}
      this.$refs['modal-stage-import-tsv'].hide()
    },
    importTSV: function () {
      if (this.tsv.items.length) {
        let params = {}
        let urlParams = this.importUrl.split('?')[1].split('&')
        for (let p of urlParams) {
          let key = p.split('=')[0]
          let value = p.split('=')[1]
          params[key] = value
        }
        params.fields = this.tsv.fields
        params.items = this.tsv.items

        if (this.importUrl.split('?')[0].split('/').length === 4) {
          Api.put(`${this.importUrl}`, params)
            .then((response) => {
              this.$emit('response-ok-api')
            })
            .catch((error) => {
              console.log(error)
            })
        } else {
          Api.post(`${this.importUrl}`, params)
            .then((response) => {
              this.$emit('response-ok-api')
            })
            .catch((error) => {
              console.log(error)
            })
        }
      }
    },
    modalDropTable: function () {
      this.$refs['modal-drop-table'].show()
    },
    modalEditTable: function () {
      this.modalContent = JSON.parse(JSON.stringify(this.theContent))
      let fields = JSON.parse(JSON.stringify(this.theContent.fields))
      fields.splice(fields.length - 1, 1)
      this.modalEditFields = fields

      this.$refs['modal-edit-fields'].show()
    },
    modalImport: function () {
      this.$refs['modal-stage-import-tsv'].show()
    },
    modalCreateContent: function () {
      this.modalContent = JSON.parse(JSON.stringify(this.theContent))
      let fields = JSON.parse(JSON.stringify(this.theContent.fields))
      fields.splice(fields.length - 1, 1)

      this.modalAddData.fields = fields
      this.$refs['modal-add-data'].show()
    },
    saveNewData: function () {
      let params = {}
      let urlParams = this.importUrl.split('?')[1].split('&')
      for (let p of urlParams) {
        let key = p.split('=')[0]
        let value = p.split('=')[1]
        params[key] = value
      }
      this.modalContent.items.push(this.newItem)

      params.items = this.modalContent.items

      Api.patch(`${this.importUrl}`, params)
        .then((response) => {
          this.newItem = {}
          this.modalContent = {}
          this.$emit('response-ok-api')
        })
        .catch((error) => {
          console.log(error)
        })
    },
    createTableOpenModal: function () {},
    dropTable: function () {
      Api.delete(`${this.importUrl}`)
        .then((response) => {
          this.$emit('response-ok-api')
        })
        .catch((error) => {
          console.log(error)
        })
    },
    modalCreateTable: function () {
      this.$refs['modal-create-fields'].show()
    },
    saveCreateFields: function () {
      let fields = JSON.parse(JSON.stringify(this.modalCreateFields.fields))
      let params = JSON.parse(JSON.stringify(this.modalCreateFields))
      params.fields = []
      params.items = []

      for (let cnt in fields) {
        let objField = {}
        objField.key = 'column_' + cnt
        objField.label = fields[cnt]
        params.fields.push(objField)
      }

      let urlParams = this.importUrl.split('?')[1].split('&')
      for (let p of urlParams) {
        let key = p.split('=')[0]
        let value = p.split('=')[1]
        params[key] = value
      }

      Api.post(`${this.importUrl}`, params)
        .then((response) => {
          this.modalCreateFields = {
            nro_of_fields: 1,
            fields: []
          }
          this.$emit('response-ok-api')
        })
        .catch((error) => {
          console.log(error)
        })
    },
    saveUpdateFields: function () {
      let params = {}

      if (this.modalContent.hasOwnProperty('fields')) {
        params.fields = JSON.parse(JSON.stringify(this.modalEditFields))
      }

      for (let cnt in params.fields) {
        if (params.fields[cnt].label === '') {
          params.fields.splice(cnt, 1)
        }
      }

      let urlParams = this.importUrl.split('?')[1].split('&')
      for (let p of urlParams) {
        let key = p.split('=')[0]
        let value = p.split('=')[1]
        params[key] = value
      }

      Api.patch(`${this.importUrl}`, params)
        .then((response) => {
          this.modalContent = {}
          this.modalEditFields = []
          // this.getStageThree()
          this.$emit('response-ok-api')
        })
        .catch((error) => {
          console.log(error)
        })
    },
    addNewColumn: function () {
      let theFields = JSON.parse(JSON.stringify(this.modalEditFields))
      let lastFieldColumnId = parseInt(theFields.splice(theFields.length - 1, 1)[0]['key'].split('_')[1]) + 1
      let newField = {
        key: 'column_' + lastFieldColumnId,
        label: ''
      }
      this.modalEditFields.push(newField)
    },
    cancelModalFields: function () {
      this.modalEditFields = {}
      this.$refs['modal-edit-fields'].hide()
    },
    removeField: function (item, index) {
      this.modalEditFields.splice(index, 1)
    }
  }

}
</script>

<style>

</style>
