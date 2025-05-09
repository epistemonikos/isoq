<template>
  <div
    class="mt-5 mb-5"
    v-if="show && show.selected && show.selected.includes('ma')">
    <a name="methodological-assessments"></a>
    <h3 class="toDoc">
      {{ $t('Methodological Assessments') }} <small v-if="mode === 'edit'" class="d-print-none" v-b-tooltip.hover title="Table with your methodological assessments of each contributing study using an existing quality/critical appraisal tool (e.g. CASP)">*</small>
      <span
        v-if="ui && ui.methodological_assessments && ui.methodological_assessments.display_warning"
        class="text-danger d-print-none"
        v-b-tooltip.hover title="The Methodological Assessments table, or some data within it, are missing.">
        <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
      </span>
    </h3>
    <p v-if="showParagraph" class="d-print-none font-weight-light">To add data or make changes to this table do so in the <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}?tab=My-Data&step=4`">My Data</b-link> section of iSoQ</p>
    <template v-if="isCamelot">
      <assessment-table :assessments="methAssessments" />
    </template>
    <template v-else>
      <template v-if="methAssessments && methAssessments.fields && methAssessments.fields.length">
        <bc-filters
          v-if="mode==='edit' && methAssessments.items && methAssessments.items.length && permission"
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
          :fields="methAssessments.fieldsObj || []"
          :items="methAssessments.items || []"
          :filter="methodological_assessments_table_settings.filter">
          <template
            v-slot:cell(authors)="data">
            <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{data.item.authors}}</span>
          </template>
        </b-table>

        <!-- end of -->
        <back-to-top></back-to-top>
      </template>
    </template>
  </div>
</template>

<script>
import AssessmentTable from '../camelot/assessment/AssessmentTable.vue'

const backToTop = () => import(/* webpackChunkName: "backtotop" */'../backToTop')
const bCardFilters = () => import(/* webpackChunkName: "backtotop" */'../tableActions/Filters')
export default {
  name: 'editListMethAssessments',
  props: {
    ui: {
      type: Object,
      default: () => ({
        methodological_assessments: {
          display_warning: false
        }
      })
    },
    show: {
      type: Object,
      default: () => ({
        selected: []
      })
    },
    mode: {
      type: String,
      default: 'edit'
    },
    list: {
      type: Object,
      required: true
    },
    permission: {
      type: Boolean,
      default: false
    },
    methAssessments: {
      type: Object,
      default: () => ({
        fields: [],
        items: [],
        fieldsObj: []
      })
    },
    refsWithTitle: {
      type: Array,
      default: () => []
    },
    showParagraph: {
      type: Boolean,
      default: false
    },
    isCamelot: {
      type: Boolean,
      default: true
    }
  },
  components: {
    'back-to-top': backToTop,
    'bc-filters': bCardFilters,
    'assessment-table': AssessmentTable
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
      if (!this.refsWithTitle || !Array.isArray(this.refsWithTitle)) {
        return ''
      }

      for (let ref of this.refsWithTitle) {
        if (ref && ref.id === refId) {
          return ref.content || ''
        }
      }
      return ''
    }
  }
}
</script>

<style>

</style>
