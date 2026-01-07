<template>
  <div
    class="mt-5 mb-5"
    v-if="show.selected.includes('cs')">
    <a name="characteristics-of-studies"></a>
    <h3 class="toDoc">
      {{ $t('worksheet.characteristics_of_studies') }} <small v-if="mode === 'edit'" class="d-print-none" v-b-tooltip.hover :title="$t('worksheet.tooltips.definitions.chars_tooltip')">*</small>
      <span
        v-if="ui.adequacy.chars_of_studies.display_warning"
        class="text-danger d-print-none"
        v-b-tooltip.hover :title="$t('worksheet.warnings.chars_missing')">
        <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
      </span>
    </h3>
    <p
      v-if="showParagraph"
      class="d-print-none font-weight-light">
      {{ $t('help.instructions.add_data_link_pre') }}
      <b-link
        :to="`/workspace/${list.organization}/isoqf/${list.project_id}?tab=My-Data&step=3`">
        {{ $t('project.my_data') }}
      </b-link>
      {{ $t('help.instructions.add_data_link_post') }}
    </p>
    <template v-if="useCamelot">
      <camelot-characteristics-table
        :charsOfStudies="charsOfStudies" />
    </template>
    <template v-if="!useCamelot && charsOfStudies.fields.length">
      <bc-filters
        v-if="mode==='edit' && charsOfStudies.items.length && permission"
        class="d-print-none"
        idname="chars-of-studies-filter"
        :tableSettings="characteristics_studies_table_settings"
        type="chars_of_studies"
        :fields="charsOfStudies.fields"
        :items="charsOfStudies.items">
      </bc-filters>
      <b-table
        id="characteristics"
        responsive
        head-variant="light"
        outlined
        :fields="charsOfStudies.fieldsObj"
        :items="charsOfStudies.items"
        :filter="characteristics_studies_table_settings.filter"
        class="toDoc">
        <template
          v-slot:cell(authors)="data">
          <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{data.item.authors}}</span>
        </template>
        <template
          v-if="charsOfStudies.tableTop.length"
          v-slot:thead-top>
          <b-tr>
            <b-th></b-th>
            <b-th
              v-for="(value, index) of charsOfStudies.tableTop"
              :key="index"
              :colspan="value.colspan"
              class="text-center">
              {{ value.label }}
            </b-th>
          </b-tr>
        </template>
      </b-table>

      <back-to-top></back-to-top>
    </template>
  </div>
</template>

<script>
const backToTop = () => import(/* webpackChunkName: "backtotop" */'../backToTop')
const bCardFilters = () => import(/* webpackChunkName: "backtotop" */'../tableActions/Filters')
const CamelotCharacteristicsTable = () => import(/* webpackChunkName: "camelot-characteristics-table" */'../camelot/characteristics/CharacteristicsTable.vue')

export default {
  name: 'editListCharsOfStudies',
  props: {
    ui: Object,
    show: Object,
    mode: String,
    list: Object,
    permission: Boolean,
    charsOfStudies: Object,
    refsWithTitle: Array,
    showParagraph: {
      type: Boolean,
      default: false
    },
    useCamelot: {
      type: Boolean,
      default: false
    }
  },
  components: {
    'back-to-top': backToTop,
    'bc-filters': bCardFilters,
    'camelot-characteristics-table': CamelotCharacteristicsTable
  },
  data () {
    return {
      characteristics_studies_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100],
        last_column: 0
      },
      modal_stage_three_data: {},
      buffer_modal_stage_three: {
        fields: [],
        data: []
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
    }
  }
}
</script>

<style>

</style>
