<template>
  <div>
    <b-card
      class="d-none d-sm-flex"
      bg-variant="light">
      <b-row>
        <b-col
          class="my-1"
          cols="12"
          sm="3">
          <b-button
            block
            @click="dropAction"
            variant="outline-danger">
              <font-awesome-icon icon="table" />
              Delete table
          </b-button>
        </b-col>
        <b-col
          class="my-1"
          cols="12"
          sm="3">
          <b-button
            block
            @click="editAction"
            variant="outline-primary">
              <font-awesome-icon icon="table" />
              Edit table
          </b-button>
        </b-col>
        <b-col
          class="my-1"
          cols="12"
          sm="3">
          <b-button
            block
            v-b-modal.modal-stage-import-tsv
            variant="outline-success">
              <font-awesome-icon icon="file-upload" />
              {{$t('Import data')}}
          </b-button>
        </b-col>
        <b-col
          class="my-1"
          cols="12"
          sm="3">
          <b-button
            block
            @click="addAction"
            variant="outline-success">
              <font-awesome-icon icon="plus" />
              {{$t('Add data')}}
          </b-button>
        </b-col>
      </b-row>
    </b-card>
    <!-- import modal -->
    <b-modal
      id="modal-stage-import-tsv"
      ref="modal-stage-import-tsv"
      scrollable
      size="lg"
      @ok="importTSV"
      @cancel="cleanTSV"
      title="Import data">
      {{importUrl}}
      <b-form-group
        label="Paste your TSV file">
        <b-form-textarea
          placeholder="Paste your TSV file"
          rows="3"></b-form-textarea>
      </b-form-group>
      <b-form-group
        label="OR load a TSV file"
        label-for="input-tsv-file">
        <b-form-file
          id="input-tsv-file"
          plain
          @change="loadTSV($event)"></b-form-file>
      </b-form-group>
      <div v-if="tsv.fields.length">
        <h5>Preview</h5>
        <b-table
          :fields="tsv.fields"
          :items="tsv.items"></b-table>
      </div>
    </b-modal>
    <!-- end import modal -->
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ActionTable',
  props: {
    importUrl: '',
    dropAction: '',
    editAction: '',
    addAction: ''
  },
  data () {
    return {
      pre_tsv: '',
      tsv: {
        fields: [],
        items: []
      }
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
      console.log('aaaaa')
      if (this.tsv.items.length) {
        axios.patch(`${this.importUrl}`, this.tsv)
          .then((response) => {
            console.log(response)
          })
          .catch((error) => {
            console.log(error)
          })
      }
    }
  }
}
</script>

<style>

</style>
