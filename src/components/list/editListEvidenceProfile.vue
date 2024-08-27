<template>
  <div v-if="evidenceProfile.length">
    <a name="evidence-profile"></a>
    <h3 class="mt-4">
      Evidence Profile
      <span
        v-if="ui.adequacy.chars_of_studies.display_warning || ui.methodological_assessments.display_warning || ui.adequacy.extracted_data.display_warning || (project.review_question === '') ? true : false || (project.inclusion === '') ? true: false || (project.exclusion === '') ? true: false"
        class="text-danger d-print-none"
        v-b-tooltip.hover title="Data are missing.">
        <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
      </span>
    </h3>
    <b-table
      class="d-print-none"
      v-if="mode==='edit'"
      id="assessments"
      responsive
      bordered
      head-variant="light"
      :fields="evidenceProfileFields"
      :items="evidenceProfile"
      :filter="evidenceProfileTableSettings.filter"
      :busy="evidenceProfileTableSettings.isBusy">
      <template v-slot:head(isoqf_id)="data">
        <span v-b-tooltip.hover title="Automatic numbering of summarised review findings">{{data.label}}</span>
      </template>
      <template v-slot:head(methodological-limit)="data">
        <span v-b-tooltip.hover title="The extent to which there are concerns about the design or conduct of the primary studies that contributed evidence to an individual review finding">{{data.label}}</span>
        <span
          v-if="ui.methodological_assessments.display_warning || ui.methodological_assessments.extracted_data.display_warning"
          class="text-danger"
          v-b-tooltip.hover title="Data needed to make this assessment are missing. Click button below to see what's missing.">
          <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
        </span>
      </template>
      <template v-slot:head(coherence)="data">
        <span v-b-tooltip.hover title="An assessment of how clear and cogent the fit is between the data from the primary studies and a review finding that synthesises that data. By ‘cogent’, we mean well supported or compelling">{{data.label}}</span>
        <span
          v-if="ui.coherence.display_warning"
          class="text-danger"
          v-b-tooltip.hover title="Data needed to make this assessment are missing. Click button below to see what's missing.">
          <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
        </span>
      </template>
      <template v-slot:head(adequacy)="data">
        <span v-b-tooltip.hover title="An overall determination of the degree of richness and quantity of data supporting a review finding">{{data.label}}</span>
        <span
          v-if="ui.adequacy.extracted_data.display_warning || ui.adequacy.chars_of_studies.display_warning"
          class="text-danger"
          v-b-tooltip.hover title="Data needed to make this assessment are missing. Click button below to see what's missing.">
          <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
        </span>
      </template>
      <template v-slot:head(relevance)="data">
        <span v-b-tooltip.hover title="The extent to which the body of evidence from the primary studies supporting a review finding is applicable to the context (perspective or population, phenomenon of interest, setting) specified in the review question">{{data.label}}</span>
        <span
          v-if="ui.relevance.chars_of_studies.display_warning || ((project.inclusion.length) ? false : true) || ((project.exclusion.length) ? false : true) || ((project.review_question.length) ? false : true)"
          class="text-danger"
          v-b-tooltip.hover title="Data needed to make this assessment are missing. Click button below to see what's missing.">
          <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
        </span>
      </template>
      <template v-slot:head(cerqual)="data">
        <span v-b-tooltip.hover title="Assessment of the extent to which a review finding is a reasonable representation of the phenomenon of interest">{{data.label}}</span>
      </template>
      <template v-slot:head(references)="data">
        <span v-b-tooltip.hover title="Studies that contribute to this review finding">{{data.label}}</span>
      </template>
      <!-- content -->
      <template v-slot:cell(isoqf_id)="data">
        {{data.item.isoqf_id}}
      </template>
      <template v-slot:cell(methodological-limit)="data">
        <div v-if="data.item.methodological_limitations.option !== null">
          <template v-if="permission">
            <b-button
              block
              class="d-print-none mb-3"
              variant="outline-info"
              @click="editStageTwo(data.item, 'methodological-limitations')">
              Edit
              <font-awesome-icon
                v-if="data.item.methodological_limitations.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
          </template>
          <p><b>{{displaySelectedOption(data.item.methodological_limitations.option)}}</b></p>
          <p v-if="data.item.methodological_limitations.explanation">
            Explanation {{ displayExplanation('methodological-limitations', data.item.methodological_limitations.option, data.item.methodological_limitations.explanation) }}
            <span
              v-if="displayExclamationAlert('methodological-limitations')"
              class="text-danger"
              v-b-tooltip.hover
              title="This explanation is incomplete">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
            </span>
          </p>
          <p v-else class="text-muted font-weight-light">
            <span
              v-if="data.item.methodological_limitations.option !== '0'"
              v-b-tooltip.hover
              title="Provide an explanation for your assessment"
              variant="info">Explanation not yet added</span>
            <span
              v-if="displayExclamationAlert('methodological-limitations')"
              class="text-danger"
              v-b-tooltip.hover
              title="This explanation is incomplete">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
            </span>
          </p>
        </div>
        <div v-else>
          <template v-if="permission">
            <b-button
              block
              class="d-print-none"
              variant="info"
              @click="editStageTwo(data.item, 'methodological-limitations')">
              Assessment not completed
              <font-awesome-icon
                v-if="data.item.methodological_limitations.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
          </template>
        </div>
      </template>
      <template v-slot:cell(coherence)="data">
        <div v-if="data.item.coherence.option !== null">
          <template v-if="permission">
            <b-button
              block
              class="d-print-none mb-3"
              variant="outline-info"
              @click="editStageTwo(data.item, 'coherence')">
              Edit
              <font-awesome-icon
                v-if="data.item.coherence.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
          </template>
          <p><b>{{displaySelectedOption(data.item.coherence.option)}}</b></p>
          <p v-if="data.item.coherence.explanation">
            Explanation: {{ displayExplanation('coherence', data.item.coherence.option, data.item.coherence.explanation) }}
            <span
              v-if="displayExclamationAlert('coherence')"
              class="text-danger"
              v-b-tooltip.hover
              title="This explanation is incomplete">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
            </span>
          </p>
          <p v-else class="text-muted font-weight-light">
            <span
              v-if="data.item.coherence.option !== '0'"
              v-b-tooltip.hover
              title="Provide an explanation for your assessment"
              variant="info">Explanation not yet added</span>
            <span
              v-if="displayExclamationAlert('coherence')"
              class="text-danger"
              v-b-tooltip.hover
              title="This explanation is incomplete">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
            </span>
          </p>
        </div>
        <div v-else>
          <template v-if="permission">
            <b-button
              block
              class="d-print-none"
              variant="info"
              @click="editStageTwo(data.item, 'coherence')">
              Assessment not completed
              <font-awesome-icon
                v-if="data.item.coherence.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
          </template>
        </div>
      </template>
      <template v-slot:cell(adequacy)="data">
        <div v-if="data.item.adequacy.option !== null">
          <template v-if="permission">
            <b-button
              block
              class="d-print-none mb-3"
              variant="outline-info"
              @click="editStageTwo(data.item, 'adequacy')">
              Edit
              <font-awesome-icon
                v-if="data.item.adequacy.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
          </template>
          <p><b>{{displaySelectedOption(data.item.adequacy.option)}}</b></p>
          <p v-if="data.item.adequacy.explanation">
            Explanation: {{ displayExplanation('adequacy', data.item.adequacy.option, data.item.adequacy.explanation) }}
            <span
              v-if="displayExclamationAlert('adequacy')"
              class="text-danger"
              v-b-tooltip.hover
              title="This explanation is incomplete">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
            </span>
          </p>
          <p v-else class="text-muted font-weight-light">
            <span
              v-if="data.item.adequacy.option !== '0'"
              v-b-tooltip.hover
              title="Provide an explanation for your assessment"
              variant="info">Explanation not yet added</span>
            <span
              v-if="displayExclamationAlert('adequacy')"
              class="text-danger"
              v-b-tooltip.hover
              title="This explanation is incomplete">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
            </span>
          </p>
        </div>
        <div v-else>
          <template v-if="permission">
            <b-button
              block
              class="d-print-none"
              variant="info"
              @click="editStageTwo(data.item, 'adequacy')">
              Assessment not completed
              <font-awesome-icon
                v-if="data.item.adequacy.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
          </template>
        </div>
      </template>
      <template v-slot:cell(relevance)="data">
        <div v-if="data.item.relevance.option !== null">
          <template v-if="permission">
            <b-button
              block
              class="d-print-none mb-3"
              variant="outline-info"
              @click="editStageTwo(data.item, 'relevance')">
              Edit
              <font-awesome-icon
                v-if="data.item.relevance.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
          </template>
          <p><b>{{displaySelectedOption(data.item.relevance.option)}}</b></p>
          <p v-if="data.item.relevance.explanation">
            Explanation: {{ displayExplanation('relevance', data.item.relevance.option, data.item.relevance.explanation) }}
            <span
              v-if="displayExclamationAlert('relevance')"
              class="text-danger"
              v-b-tooltip.hover
              title="This explanation is incomplete">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
            </span>
          </p>
          <p v-else class="text-muted font-weight-light">
            <span
              v-if="data.item.relevance.option !== '0'"
              v-b-tooltip.hover
              title="Provide an explanation for your assessment"
              variant="info">Explanation not yet added</span>
            <span
              v-if="displayExclamationAlert('relevance')"
              class="text-danger"
              v-b-tooltip.hover
              title="This explanation is incomplete">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
            </span>
          </p>
        </div>
        <div v-else>
          <template v-if="permission">
            <b-button
              block
              class="d-print-none"
              variant="info"
              @click="editStageTwo(data.item, 'relevance')">
              Assessment not completed
              <font-awesome-icon
                v-if="data.item.relevance.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
          </template>
        </div>
      </template>
      <template v-slot:cell(cerqual)="data">
        <div v-if="data.item.methodological_limitations.option !== null && data.item.coherence.option !== null && data.item.adequacy.option !== null && data.item.relevance.option !== null && data.item.cerqual.option !== null">
          <template v-if="permission">
            <b-button
              block
              class="d-print-none mb-3"
              variant="outline-info"
              @click="editStageTwo(data.item, 'cerqual')">
              Edit
              <font-awesome-icon
                v-if="data.item.cerqual.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
          </template>
          <p><b>{{displayLevelConfidence(data.item.cerqual.option)}}</b></p>
          <p v-if="data.item.cerqual.option && data.item.cerqual.explanation">Explanation: {{data.item.cerqual.explanation}}</p>
          <p v-else class="text-muted font-weight-light" v-b-tooltip.hover="{title: 'Provide an explanation for your assessment', placement: 'bottom'}">
            Explanation not yet added
          </p>
        </div>
        <div v-else>
          <template v-if="permission">
            <b-button
              v-if="data.item.methodological_limitations.option && data.item.coherence.option && data.item.adequacy.option && data.item.relevance.option"
              block
              class="d-print-none"
              variant="info"
              @click="editStageTwo(data.item, 'cerqual')">
              Assessment not completed
              <font-awesome-icon
                v-if="data.item.cerqual.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
          </template>
        </div>
      </template>
      <template v-slot:cell(references)="data">
        <template v-if="permission">
          <b-button
            block
            class="d-print-none mb-3"
            variant="outline-info"
            @click="openModalReferences">
            View or Edit references
          </b-button>
        </template>
        There are <b>{{ data.item.references.length }}</b> references.
      </template>
      <template v-slot:table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
          <strong>Loading...</strong>
        </div>
      </template>
    </b-table>
    <!-- display table in print mode -->
    <b-table
      class="toDoc"
      v-if="mode==='view'"
      id="assessments-print"
      responsive striped caption-top
      :fields="evidenceProfileFieldsPrintVersion"
      :items="evidenceProfile"
      :filter="evidenceProfileTableSettings.filter">
      <template v-slot:head(isoqf_id)="data">
        {{data.label}}
      </template>
      <template v-slot:head(name)="data">
        {{data.label}}
      </template>
      <template v-slot:head(methodological-limit)="data">
        {{data.label}}
      </template>
      <template v-slot:head(coherence)="data">
        {{data.label}}
      </template>
      <template v-slot:head(adequacy)="data">
        {{data.label}}
      </template>
      <template v-slot:head(relevance)="data">
        {{data.label}}
      </template>
      <template v-slot:head(cerqual)="data">
        {{data.label}}
      </template>
      <template v-slot:head(references)="data">
        {{data.label}}
      </template>
      <template v-slot:cell(isoqf_id)="data">
        {{data.item.isoqf_id}}
      </template>
      <template v-slot:cell(finding)="data">
        {{data.item.name}}
      </template>
      <template v-slot:cell(methodological-limit)="data">
        <div v-if="data.item.methodological_limitations.option !== null">
          <p><b>{{displaySelectedOption(data.item.methodological_limitations.option)}}</b></p>
          <p v-if="data.item.methodological_limitations.explanation">Explanation: {{data.item.methodological_limitations.explanation}}</p>
        </div>
      </template>
      <template v-slot:cell(coherence)="data">
        <div v-if="data.item.coherence.option !== null">
          <p><b>{{displaySelectedOption(data.item.coherence.option)}}</b></p>
          <p v-if="data.item.coherence.explanation">Explanation: {{data.item.coherence.explanation}}</p>
        </div>
      </template>
      <template v-slot:cell(adequacy)="data">
        <div v-if="data.item.adequacy.option !== null">
          <p><b>{{displaySelectedOption(data.item.adequacy.option)}}</b></p>
          <p v-if="data.item.adequacy.explanation">Explanation: {{data.item.adequacy.explanation}}</p>
        </div>
      </template>
      <template v-slot:cell(relevance)="data">
        <div v-if="data.item.relevance.option !== null">
          <p><b>{{displaySelectedOption(data.item.relevance.option)}}</b></p>
          <p v-if="data.item.relevance.explanation">Explanation: {{data.item.relevance.explanation}}</p>
        </div>
      </template>
      <template v-slot:cell(cerqual)="data">
        <div v-if="data.item.cerqual.option !== null">
          <p><b>{{displayLevelConfidence(data.item.cerqual.option)}}</b></p>
          <p v-if="data.item.cerqual.explanation">Explanation: {{data.item.cerqual.explanation}}</p>
        </div>
      </template>
      <template v-slot:cell(references)="data">
        <p
          class="reference-txt">
          {{data.value}}
        </p>
      </template>
    </b-table>

    <back-to-top></back-to-top>

    <b-modal
      id="modalReferences"
      ref="modalReferences"
      title="References"
      size="xl"
      scrollable
      @ok="saveReferencesList">
      <b-alert
        v-if="list.cerqual.option"
        show
        variant="danger">
        <b>Warning!</b> By removing a reference you are modifying the underlining evidence base for this finding and will need to review your GRADE-CERQual assessments. If you remove the reference, the extracted data you inputted from this study to support this finding will be deleted from the GRADE-CERQual Assessment Worksheet.
      </b-alert>
      <b-table
        striped
        responsive
        :fields="[{key: 'checkbox', label: ''}, {key: 'content', label:'Author(s), Year, Title'}]"
        :items="refsWithTitle">
        <template v-slot:cell(checkbox)="data">
          <b-form-checkbox
            :id="`checkbox-${data.index}`"
            v-model="list.references"
            :name="`checkbox-${data.index}`"
            :value="data.item.id">
          </b-form-checkbox>
        </template>
      </b-table>
    </b-modal>

    <!-- modal -->
    <evidence-profile-form
      ref="evidenceProfileForm"
      :modalData="modalData"
      :list="list"
      :ui="ui"
      :methAssessments="methAssessments"
      :findings="findings"
      :mode="mode"
      :extractedData="extractedData"
      :refsWithTitle="refsWithTitle"
      :showEditExtractedDataInPlace="showEditExtractedDataInPlace"
      :charsOfStudies="charsOfStudies"
      :project="project"
      :evidenceProfile="evidenceProfile"
      :selectOptions="selectOptions"
      @update-list-data="getList"
      @busyEvidenceProfileTable="busyEvidenceProfileTable"
      @callGetStageOneData="callGetStageOneData"
      @setShowEditExtractedDataInPlace="setShowEditExtractedDataInPlace"
      @getExtractedData="getExtractedData"></evidence-profile-form>
    <!-- end modal -->
  </div>
  <div v-else>
    <div class="text-center my-5">
      <p>
        {{ $t('No evidence profile has been created') }} <b-link v-b-modal.modal-evidence-profile-form>{{ $t('add a evidence profile') }}</b-link>
      </p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
const backToTop = () => import(/* webpackChunkName: "backtotop" */'../backToTop')

export default {
  name: 'editListEvidenceProfile',
  props: {
    evidenceProfile: Array,
    ui: Object,
    evidenceProfileTableSettings: Object,
    references: Array,
    mode: String,
    list: Object,
    refsWithTitle: Array,
    project: Object,
    permission: Boolean,
    selectOptions: Array,
    levelConfidence: Array,
    findings: Object,
    methAssessments: Object,
    extractedData: Object,
    showEditExtractedDataInPlace: Object,
    modalData: Object,
    charsOfStudies: Object
  },
  components: {
    'back-to-top': backToTop,
    'evidence-profile-form': () => import('./evidenceProfileForm.vue'),
    'videoHelp': () => import('../videoHelp')
  },
  data () {
    return {
      evidenceProfileFields: [
        { key: 'isoqf_id', label: '#' },
        { key: 'methodological-limit', label: 'Methodological limitations' },
        { key: 'coherence', label: 'Coherence' },
        { key: 'adequacy', label: 'Adequacy' },
        { key: 'relevance', label: 'Relevance' },
        { key: 'cerqual', label: 'GRADE-CERQual assessment of confidence' },
        { key: 'references', label: 'References' }
      ],
      evidenceProfileFieldsPrintVersion: [
        { key: 'isoqf_id', label: '#' },
        { key: 'name', label: 'Summarised review finding' },
        { key: 'methodological-limit', label: 'Methodological limitations' },
        { key: 'coherence', label: 'Coherence' },
        { key: 'adequacy', label: 'Adequacy' },
        { key: 'relevance', label: 'Relevance' },
        { key: 'cerqual', label: 'GRADE-CERQual assessment of confidence' },
        {
          key: 'references',
          label: 'References',
          formatter: value => {
            let references = ''
            for (let item of value) {
              for (let reference of this.references) {
                if (item === reference.id) {
                  references = references.concat(reference.content)
                }
              }
            }
            return references
          }
        }
      ]
    }
  },
  methods: {
    displayExplanation: function (type, option, explanation) {
      if (type === '') {
        return ''
      }
      if (option === '0') {
        return explanation
      }
      if (explanation === '') {
        return ''
      }
      let options = {}
      switch (type) {
        case 'methodological-limitations':
          options = {
            '1': 'Minor concerns regarding methodological limitations because',
            '2': 'Moderate concerns regarding methodological limitations because',
            '3': 'Serious concerns regarding methodological limitations because'
          }
          return `${options[option]} ${explanation}`
        case 'coherence':
          options = {
            '1': 'Minor concerns regarding coherence because',
            '2': 'Moderate concerns regarding coherence because',
            '3': 'Serious concerns regarding coherence because'
          }
          return `${options[option]} ${explanation}`
        case 'adequacy':
          options = {
            '1': 'Minor concerns regarding adequacy because',
            '2': 'Moderate concerns regarding adequacy because',
            '3': 'Serious concerns regarding adequacy because'
          }
          return `${options[option]} ${explanation}`
        case 'relevance':
          options = {
            '1': 'Minor concerns regarding relevance because',
            '2': 'Moderate concerns regarding relevance because',
            '3': 'Serious concerns regarding relevance because'
          }
          return `${options[option]} ${explanation}`
        default:
          return ''
      }
    },
    saveReferencesList: function () {
      this.evidenceProfileTableSettings.isBusy = true
      const params = {
        references: this.list.references
      }
      axios.patch(`/api/isoqf_lists/${this.list.id}`, params)
        .then(() => {
          this.updateReferencesInFindings()
        })
    },
    updateReferencesInFindings: function () {
      let params = {
        'evidence_profile.references': this.list.references
      }
      axios.patch(`/api/isoqf_findings/${this.findings.id}`, params)
        .then((response) => {
          this.$emit('update-list-data')
          // this.getList()
        })
        .catch((error) => {
          this.$emit('printErrors', error)
          // this.printErrors(error)
        })
    },
    displaySelectedOption: function (option) {
      if (option === null) {
        return ''
      } else if (option >= 0) {
        return this.selectOptions[option].text
      } else {
        return ''
      }
    },
    displayExclamationAlert: function (type) {
      const evidenceProfile = this.evidenceProfile[0]
      switch (type) {
        case 'methodological-limitations':
          if (this.checkValidationText(type, evidenceProfile)) {
            return true
          }
          break
        case 'coherence':
          if (this.checkValidationText(type, evidenceProfile)) {
            return true
          }
          break
        case 'adequacy':
          if (this.checkValidationText(type, evidenceProfile)) {
            return true
          }
          break
        case 'relevance':
          if (this.checkValidationText(type, evidenceProfile)) {
            return true
          }
          break
      }
      return false
    },
    displayLevelConfidence: function (option) {
      if (option !== null) {
        return this.levelConfidence[option].text
      }
      return ''
    },
    checkValidationText: function (type, prop) {
      switch (type) {
        case 'methodological-limitations':
          if (prop.methodological_limitations.option > 0 && prop.methodological_limitations.explanation === '') {
            return true
          }
          return false
        case 'coherence':
          if (prop.coherence.option > 0 && prop.coherence.explanation === '') {
            return true
          }
          return false
        case 'adequacy':
          if (prop.adequacy.option > 0 && prop.adequacy.explanation === '') {
            return true
          }
          return false
        case 'relevance':
          if (prop.relevance.option > 0 && prop.relevance.explanation === '') {
            return true
          }
          return false
        default:
          return false
      }
    },
    openModalReferences: function () {
      this.$refs['modalReferences'].show()
    },
    editStageTwo: function (data, type) {
      const titles = {
        'methodological-limitations': 'Methodological limitations',
        'coherence': 'Coherence',
        'adequacy': 'Adequacy',
        'relevance': 'Relevance',
        'cerqual': 'GRADE-CERQual assessment of confidence'
      }
      data.type = type
      data.title = titles[type]
      const theData = JSON.parse(JSON.stringify(data))
      this.$emit('modalDataChanged', theData)
      this.$refs.evidenceProfileForm.openModalEvidenceProfie()
    },
    getList: function (status = false) {
      this.$emit('update-list-data', status)
    },
    busyEvidenceProfileTable: function (status) {
      this.$emit('busyEvidenceProfileTable', status)
    },
    callGetStageOneData: function (status) {
      this.$emit('callGetStageOneData', status)
    },
    setShowEditExtractedDataInPlace: function (data) {
      this.$emit('setShowEditExtractedDataInPlace', data)
    },
    getExtractedData: function () {
      this.$emit('getExtractedData')
    }
  }
}
</script>

<style>

</style>
