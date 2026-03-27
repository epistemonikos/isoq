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
import { exportTableToCSV } from '@/utils/csvExporter'
import Commons from '@/utils/commons.js'

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
      return Commons.orderKeys(obj)
    },
    toCSV: function (type) {
      const types = {
        'chars_of_studies': 'Characteristics of studies',
        'meth_assessments': 'Methodological assessments',
        'extracted_data': 'Extracted data'
      }
      exportTableToCSV({
        fields: this.local_fields,
        items: this.local_items,
        filename: types[type] || 'exportable_table',
        excludeKeys: ['ref_id']
      })
    }
  }
}
</script>
