<template>
  <div
    class="mt-3"
    v-if="show.selected.includes('ed')">
    <a name="extracted-data"></a>
    <template v-if="showParagraph">
      <videoHelp :txt="$t('worksheet.extracted_data')" tag="h3-extracted-data" urlId="450836795" :warning="ui.adequacy.extracted_data.display_warning"></videoHelp>
    </template>
    <template v-else>
      <h3 v-if="showTitle">{{ $t('worksheet.extracted_data') }}</h3>
    </template>
    <p v-if="showParagraph" class="d-print-none font-weight-light">
      It is here that you enter the data extracted from included studies that support this review finding. This data is needed to make a GRADE-CERQual assessment.
    </p>
    <template v-if="localExtractedData.fields.length">
      <bc-filters
        v-if="mode==='edit'"
        :showFilters="showFilters"
        class="d-print-none"
        idname="extracted-data-filter"
        :tableSettings="tableSettings"
        type="extracted_data"
        :fields="modePrintFieldObject"
        :items="localExtractedData.items">
      </bc-filters>
      <b-table
        class="toDoc extracted-data-table"
        :id="(mode==='view') ? 'extracted-view' : 'extracted'"
        responsive
        head-variant="light"
        outlined
        :filter="tableSettings.filter"
        :fields="(mode==='view') ? modePrintFieldObject : localExtractedData.fieldsObj"
        :items="localExtractedData.items"
        :current-page="tableSettings.currentPage">
        <template v-slot:cell(authors)="data">
          <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{data.item.authors}}</span>
        </template>
        <template
          v-if="mode==='edit' && permission"
          v-slot:cell(actions)="data">
          <b-button
            class="d-print-none"
            @click="openModalExtractedDataEditDataItem(data)"
            variant="outline-success">
            <font-awesome-icon
              icon="edit"
              :title="$t('common.edit')" />
          </b-button>
          <b-button
            class="d-print-none"
            @click="openModalExtractedDataRemoveDataItem(data)"
            variant="outline-danger">
            <font-awesome-icon
              icon="trash"
              :title="$t('common.remove')" />
          </b-button>
        </template>
      </b-table>
      <b-modal
        id="modal-extracted-data-remove-data-item"
        ref="modal-extracted-data-remove-data-item"
        title="Remove data content"
        @ok="extractedDataRemoveDataItem"
        ok-variant="outline-success"
        cancel-variant="outline-secondary">
        <p>Are you sure you want to delete all the content for this row?</p>
      </b-modal>
      <b-modal
        size="xl"
        title="Edit data"
        id="modal-extracted-data-data"
        ref="modal-extracted-data-data"
        @ok="saveDataExtractedData"
        cancel-variant="outline-secondary"
        ok-variant="outline-success"
        ok-title="Save">
        <b-form-group
          v-for="(field, index) in buffer_extracted_data.fields"
          :key="index"
          :id="`label-field-${index}`"
          :label="(field.key === 'column_0') ? 'Add the extracted data from this study that supports the review finding' : ''"
          :label-for="`input-field-${index}`">
          <b-form-textarea
            :id="`input-field-${index}`"
            v-if="field.key !== 'ref_id' && field.key !== 'authors'"
            v-model="buffer_extracted_data_items[field.key]"
            rows="6"
            max-rows="100"></b-form-textarea>
        </b-form-group>
      </b-modal>

      <back-to-top></back-to-top>
    </template>
  </div>
</template>

<script>
import axios from 'axios'
const videoHelp = () => import(/* webpackChunkName: "videohelp" */'../videoHelp')
const backToTop = () => import(/* webpackChunkName: "backtotop" */'../backToTop')
const bCardFilters = () => import(/* webpackChunkName: "backtotop" */'../tableActions/Filters')

export default {
  name: 'editListExtractedData',
  props: {
    ui: Object,
    show: Object,
    mode: String,
    list: Object,
    permission: Boolean,
    extractedData: Object,
    modePrintFieldObject: Array,
    refsWithTitle: Array,
    showParagraph: {
      type: Boolean,
      default: false
    },
    showFilters: Boolean,
    showTitle: {
      type: Boolean,
      default: true
    }
  },
  components: {
    'back-to-top': backToTop,
    'bc-filters': bCardFilters,
    videoHelp
  },
  data () {
    return {
      buffer_extracted_data_items: {},
      buffer_extracted_data: {
        fields: [],
        items: [],
        id: null
      },
      tableSettings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100]
      },
      localExtractedData: {
        fields: [],
        items: []
      }
    }
  },
  methods: {
    getReferenceInfo: function (refId) {
      for (let ref of this.refsWithTitle) {
        if (ref.id === refId) {
          return ref.content
        }
      }
    },
    openModalExtractedDataEditDataItem: function (data) {
      this.localExtractedData.edit_index_item = data.index
      this.buffer_extracted_data.fields = JSON.parse(JSON.stringify(this.localExtractedData.fields))
      this.buffer_extracted_data.fields.splice(this.buffer_extracted_data.fields.length - 1, 1)
      this.buffer_extracted_data_items = JSON.parse(JSON.stringify(this.localExtractedData.items[data.index]))
      this.$refs['modal-extracted-data-data'].show()
    },
    openModalExtractedDataRemoveDataItem: function (data) {
      this.buffer_extracted_data.remove_index_item = data.index
      this.$refs['modal-extracted-data-remove-data-item'].show()
    },
    extractedDataRemoveDataItem: function () {
      let items = JSON.parse(JSON.stringify(this.localExtractedData.items))
      const item = items[this.buffer_extracted_data.remove_index_item]
      let newItem = { 'ref_id': item.ref_id, 'authors': item.authors, 'column_0': '' }
      items[this.buffer_extracted_data.remove_index_item] = newItem

      axios.patch(`/api/isoqf_extracted_data/${this.localExtractedData.id}`, {items: items})
        .then(() => {
          this.$emit('getExtractedData', true)
          delete this.buffer_extracted_data.remove_index_item
        })
        .catch((error) => {
          this.$emit('printErrors', error)
        })
    },
    saveDataExtractedData: function () {
      let _item = JSON.parse(JSON.stringify(this.buffer_extracted_data_items))
      let _originalItems = JSON.parse(JSON.stringify(this.localExtractedData.original_items))

      for (let index in _originalItems) {
        if (_item.ref_id === _originalItems[index].ref_id) {
          _originalItems[index] = {
            'authors': _item.authors,
            'column_0': _item.column_0,
            'ref_id': _item.ref_id
          }
        }
      }

      let params = {
        organization: this.list.organization,
        list_id: this.$route.params.id,
        items: _originalItems
      }
      axios.patch(`/api/isoqf_extracted_data/${this.localExtractedData.id}`, params)
        .then(() => {
          this.$emit('getExtractedData', true)
          this.buffer_extracted_data = {fields: [], items: [], id: null}
          this.buffer_extracted_data_items = {}
        })
        .catch((error) => {
          this.$emit('printErrors', error)
        })
    }
  },
  mounted () {
    this.localExtractedData = this.extractedData
  },
  watch: {
    extractedData: {
      handler: function (val) {
        this.localExtractedData = val
      },
      deep: true
    }
  }
}
</script>

<style>

</style>
