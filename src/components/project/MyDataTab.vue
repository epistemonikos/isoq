<template>
  <div>
    <b-row>
      <b-col cols="12">
        <videoHelp txt="Add data needed to make GRADE-CERQual assessments" tag="h3" urlId="449265292"></videoHelp>
        <p>
          To optimise the functionality of iSoQ, and save you time, please add the following information organised into 4 steps.
        </p>
      </b-col>
      <b-card no-body class="col-12">
        <b-tabs pills card small vertical nav-wrapper-class="w-15" content-class="w-85" class="link-steps nowrap" active-nav-item-class="btn-success" v-model="stepStage">
          <b-tab title="STEP 1: References">
            <UploadReferences
              :checkPermissions="checkPermissions()"
              :loadReferences="loadReferences"
              :references="references"
              :lists="lists"
              :charsOfStudies="charsOfStudies"
              :methodologicalTableRefs="methodologicalTableRefs"
              @CallGetReferences="$emit('get-references', $event)"
              @statusLoadReferences="$emit('status-load-references', $event)"
              @CallGetProject="$emit('get-project')"></UploadReferences>
            <div class="mt-3">
              <b-row v-if="references.length">
                <b-col cols="auto" class="mr-auto">
                </b-col>
                <b-col cols="auto">
                  <a class="btn btn-success text-white" @click="stepStage++">Step 2</a>
                </b-col>
              </b-row>
            </div>
          </b-tab>
          <b-tab title="STEP 2: Inclusion & Exclusion criteria" :disabled="references.length?false:true">
            <div>
              <InclusionExclusioCriteria
                :checkPermissions="checkPermissions()"
                :project="project"
                :ui="ui"
                @update-modification="$emit('update-modification')"></InclusionExclusioCriteria>
              <div class="mt-3">
                <b-row>
                  <b-col cols="auto" class="mr-auto">
                    <a class="btn btn-success text-white" @click="stepStage--">Step 1</a>
                  </b-col>
                  <b-col cols="auto">
                    <a class="btn btn-success text-white" @click="stepStage++">Step 3</a>
                  </b-col>
                </b-row>
              </div>
            </div>
          </b-tab>
          <b-tab title="STEP 3: Characteristics of studies table" :disabled="references.length?false:true">
            <h4>STEP 3: Create or import your <b>characteristics of studies table</b> (recommended)</h4>
            <p class="font-weight-light">
              Descriptive information extracted from the included studies (e.g. setting, country, perspectives, methods, etc.)
            </p>
            <crudTables
              type="isoqf_characteristics"
              prefix="ch"
              :checkPermissions="checkPermissions()"
              :project="project"
              :ui="ui"
              :references="references"
              :refs="refs"
              :lists="lists"
              @get-project="$emit('get-project')"
              @print-errors="$emit('print-errors', $event)"
              @updateDataTable="$emit('update-data-table', $event)"
              @set-item-data="$emit('set-item-data', $event)"
              ></crudTables>
            <div class="mt-3">
              <b-row>
                <b-col cols="auto" class="mr-auto">
                  <a class="btn btn-success text-white" @click="stepStage--">Step 2</a>
                </b-col>
                <b-col cols="auto">
                  <a class="btn btn-success text-white" @click="stepStage++">Step 4</a>
                </b-col>
              </b-row>
            </div>
          </b-tab>
          <b-tab title="STEP 4: Methodological assessments table" :disabled="references.length?false:true">
            <h4>STEP 4: Create or import your <b>methodological assessments table</b> (recommended)</h4>
            <p class="font-weight-light">
              Methodological assessments of each included study using an existing critical/quality appraisal tool (e.g. CASP)
            </p>
            <crudTables
              type="isoqf_assessments"
              prefix="as"
              :checkPermissions="checkPermissions()"
              :project="project"
              :ui="ui"
              :references="references"
              :refs="refs"
              :lists="lists"
              @get-project="$emit('get-project')"
              @print-errors="$emit('print-errors', $event)"
              @updateDataTable="$emit('update-data-table', $event)"
              @set-item-data="$emit('set-item-data', $event)"
            ></crudTables>
            <div class="mt-3">
              <b-row>
                <b-col cols="auto" class="mr-auto">
                  <a class="btn btn-success text-white" @click="stepStage--">Step 3</a>
                </b-col>
                <b-col cols="auto">
                  <b-button
                    block
                    variant="success"
                    class="mb-3"
                    @click="$emit('continue-to-isoq')">
                    Continue to iSoQ
                  </b-button>
                </b-col>
              </b-row>
            </div>
          </b-tab>
        </b-tabs>
      </b-card>
    </b-row>
  </div>
</template>

<script>
const videoHelp = () => import(/* webpackChunkName: "videohelp" */ '../videoHelp.vue')
const UploadReferences = () => import(/* webpackChunkName: "uploadReferences" */ './UploadReferences.vue')
const InclusionExclusioCriteria = () => import(/* webpackChunkName: "inclusionExclusionCriteria" */ './InclusionExclusionCriteria.vue')

export default {
  name: 'MyDataTab',
  components: {
    videoHelp,
    UploadReferences,
    InclusionExclusioCriteria,
    crudTables: () => import(/* webpackChunkName: "crudTables" */ '@/components/project/crudTables.vue')
  },
  props: {
    project: {
      type: Object,
      required: true
    },
    ui: {
      type: Object,
      required: true
    },
    references: {
      type: Array,
      required: true
    },
    lists: {
      type: Array,
      default: () => []
    },
    charsOfStudies: {
      type: Object,
      default: () => ({})
    },
    methodologicalTableRefs: {
      type: Object,
      default: () => ({})
    },
    refs: {
      type: Array,
      default: () => []
    },
    loadReferences: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      stepStage: 0
    }
  },
  mounted () {
    if (Object.prototype.hasOwnProperty.call(this.$route.query, 'step')) {
      this.stepStage = parseInt(this.$route.query.step) - 1
    }
  },
  methods: {
    isActiveStepTwo: function () {
      if (this.references.length === 0) { return false }
      if (this.project.inclusion === '' || this.project.exclusion === '') { this.stepStage = 1; return true }
    },
    checkPermissions: function (type = 'can_write') {
      // normalize input to an array of permission keys
      let perms = []
      if (Array.isArray(type)) {
        perms = type
      } else if (typeof type === 'string') {
        perms = type.split(',').map(t => t.trim()).filter(Boolean)
      } else {
        perms = ['can_write']
      }

      // if the current user belongs to the same personal organization, allow
      if (this.$store && this.$store.state && this.$store.state.user && this.$store.state.user.personal_organization === this.$route.params.org_id) {
        return true
      }

      // check any of the requested permissions on the project
      for (const perm of perms) {
        if (!Object.prototype.hasOwnProperty.call(this.project, perm)) {
          continue
        }

        const val = this.project[perm]
        // val is expected to be an array of user ids, but could be a comma-separated string
        if (Array.isArray(val)) {
          if (val.includes(this.$store.state.user.id)) {
            return true
          }
        } else if (typeof val === 'string') {
          const arr = val.split(',').map(x => x.trim()).filter(Boolean)
          if (arr.includes(String(this.$store.state.user.id))) {
            return true
          }
        }
      }

      return false
    }
  }
}
</script>

<style scoped>
  div >>>
    #chars-of-studies-table thead th:first-child {
      width: 25%;
    }
  div >>>
    #methodological-table thead th:first-child {
      width: 25%;
    }
  div >>>
    #chars-of-studies-table thead th:last-child {
      width: 13%;
    }
  div >>>
    #methodological-table thead th:last-child {
      width: 13%;
    }
  div >>>
    table#chars-of-studies-table tbody td:last-child {
      min-width: 10%;
    }
  div >>>
    table#methodological-table tbody td:last-child {
      min-width: 10%;
    }
  div >>>
    #import-data a.nav-link {
      display: block;
      padding: .5rem 1rem;
    }
</style>
