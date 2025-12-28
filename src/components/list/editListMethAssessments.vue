<template>
  <div
    class="mt-5 mb-5"
    v-if="show.selected.includes('ma')">
    <a name="methodological-assessments"></a>
    <h3 class="toDoc">
      {{ $t('worksheet.methodological_assessments') }} <small v-if="mode === 'edit'" class="d-print-none" v-b-tooltip.hover :title="$t('worksheet.tooltips.definitions.meth_tooltip')">*</small>
      <span
        v-if="ui.methodological_assessments.display_warning"
        class="text-danger d-print-none"
        v-b-tooltip.hover :title="$t('worksheet.warnings.meth_missing')">
        <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
      </span>
    </h3>
    <pre>- {{ methAssessments }}</pre>
    <pre>- {{ list.project_id }}</pre>
    <p v-if="showParagraph" class="d-print-none font-weight-light">
      {{ $t('help.instructions.add_data_link_pre') }}<b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}?tab=My-Data&step=4`">{{ $t('common.my_data') }}</b-link>{{ $t('help.instructions.add_data_link_post') }}
    </p>
    <template v-if="methAssessments.fields.length">
      <bc-filters
        v-if="mode==='edit' && methAssessments.items.length && permission"
        class="d-print-none"
        idname="meth-assessments-filter"
        :tableSettings="methodological_assessments_table_settings"
        type="meth_assessments"
        :fields="methAssessments.fields"
        :items="methAssessments.items">
      </bc-filters>
      <b-table
        class="toDoc"
        id="methodological"
        responsive
        head-variant="light"
        outlined
        :fields="methAssessments.fieldsObj"
        :items="methAssessments.items"
        :filter="methodological_assessments_table_settings.filter">
        <template
          v-slot:cell(authors)="data">
          <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{data.item.authors}}</span>
        </template>
      </b-table>

      <!-- end of -->
      <back-to-top></back-to-top>
    </template>
  </div>
</template>

<script>
const backToTop = () => import(/* webpackChunkName: "backtotop" */'../backToTop')
const bCardFilters = () => import(/* webpackChunkName: "backtotop" */'../tableActions/Filters')

export default {
  name: 'editListMethAssessments',
  props: {
    ui: Object,
    show: Object,
    mode: String,
    list: Object,
    permission: Boolean,
    methAssessments: Object,
    refsWithTitle: Array,
    showParagraph: {
      type: Boolean,
      default: false
    }
  },
  components: {
    'back-to-top': backToTop,
    'bc-filters': bCardFilters
  },
  data () {
    return {
      methodological_assessments_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100]
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
