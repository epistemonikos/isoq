<template>
  <div>
    <b-table
      :selectable="(mode==='view')?true:false"
      select-mode="multi"
      selected-variant="warning"
      bordered
      head-variant="light"
      id="findings"
      ref="findings"
      sort-by="sort"
      :fields="(list_categories.options.length)?fields.with_categories:fields.without_categories"
      :items="lists"
      show-empty
      :busy="isBusy"
      :current-page="table_settings.currentPage"
      :filter="table_settings.filter"
      @filtered="onFiltered"
      :filter-included-fields="table_settings.filterOn">
      <template v-slot:head(sort)="data">
        <span v-b-tooltip.hover title="Automatic numbering of summarised review findings">{{ data.label }}</span>
      </template>
      <template v-slot:head(name)="data">
        <span v-b-tooltip.hover title="Summaries of each review finding produced by the review team">{{ data.label }}</span>
      </template>
      <template v-slot:head(category_name)="data">
        {{data.label}}
        <b-dropdown
          id="dropdown-categories"
          text=""
          class="finding-filter"
          :no-caret="false"
          size="sm">
          <b-dropdown-item
          v-for="(category, index) of list_categories.options"
          :key="index"
          @click="tableFilter(category.text, 1)" :active="isFilterActive(category.text)">{{ category.text }}</b-dropdown-item>
        </b-dropdown>
        <span v-if="ui.project.showFilterOne" class="text-danger remove-opt" @click="cleanTableFilter">&times;</span>
      </template>
      <template v-slot:head(cerqual_option)="data">
        <span v-b-tooltip.hover title="Assessment of the extent to which a review finding is a reasonable representation of the phenomenon of interest">{{ data.label }}</span>
        <b-dropdown
          id="dropdown-cerqual-option"
          text=""
          class="finding-filter"
          :no-caret="false"
          size="sm">
          <b-dropdown-item @click="tableFilter('hc', 2)" :active="isFilterActive('hc')">High confidence</b-dropdown-item>
          <b-dropdown-item @click="tableFilter('mc', 2)" :active="isFilterActive('mc')">Moderate confidence</b-dropdown-item>
          <b-dropdown-item @click="tableFilter('lc', 2)" :active="isFilterActive('lc')">Low confidence</b-dropdown-item>
          <b-dropdown-item @click="tableFilter('vc', 2)" :active="isFilterActive('vc')">Very low confidence</b-dropdown-item>
          <b-dropdown-divider></b-dropdown-divider>
          <b-dropdown-item @click="tableFilter('completed', 2)" :active="isFilterActive('completed')">Assessments completed</b-dropdown-item>
          <b-dropdown-item @click="tableFilter('unfinished', 2)" :active="isFilterActive('unfinished')">Assessments not completed</b-dropdown-item>
        </b-dropdown>
        <span v-if="ui.project.showFilterTwo" class="text-danger remove-opt" @click="cleanTableFilter">&times;</span>
      </template>
      <template v-slot:head(cerqual_explanation)="data">
        <span v-b-tooltip.hover title="Statement explaining concerns with any of the GRADE-CERQual components that justifies the level of confidence chosen">{{ data.label }}</span>
        <b-dropdown
          id="dropdown-cerqual-explanation"
          text=""
          class="finding-filter"
          :no-caret="false"
          size="sm">
          <b-dropdown-item @click="tableFilter('with_explanation', 3)" :active="isFilterActive('with_explanation')">Completed</b-dropdown-item>
          <b-dropdown-item @click="tableFilter('without_explanation', 3)" :active="isFilterActive('without_explanation')">Not completed</b-dropdown-item>
        </b-dropdown>
        <span v-if="ui.project.showFilterThree" class="text-danger remove-opt" @click="cleanTableFilter">&times;</span>
      </template>
      <template v-slot:head(ref_list)="data">
        <span v-b-tooltip.hover title="Studies that contribute to each review finding">{{ data.label }}</span>
      </template>
      <!-- data -->
      <template v-slot:cell(sort)="data">
        {{(Object.prototype.hasOwnProperty.call(data.item, 'sort')) ? data.item.sort : data.index + 1}}
      </template>
      <template v-slot:cell(name)="data">
        <a :id="`a-${data.item.id}`"></a>
        <span v-if="mode === 'edit'">
          <b-row
            class="mb-3">
            <b-col
              lg="6"
              cols="12">
              <b-button
                block
                v-if="mode==='edit'"
                variant="outline-success"
                @click="editModalFindingName(data)">
                <font-awesome-icon
                  v-if=(data.item.notes.length)
                  icon="comments"></font-awesome-icon>
                Edit
              </b-button>
            </b-col>
            <b-col
              class="mt-1 mt-lg-0"
              lg="6"
              cols="12">
              <b-button
                block
                v-if="mode==='edit'"
                variant="outline-danger"
                @click="removeModalFinding(data)">
                Remove
              </b-button>
            </b-col>
          </b-row>
          <b-link class="table-edit-list" v-if="data.item.references.length" :to="{name: 'editList', params: {id: data.item.id}}">{{ data.item.name }}</b-link>
          <span v-if="data.item.references.length === 0">{{ data.item.name }}</span>
        </span>
        <span v-else>
          {{ data.item.name }}
        </span>
      </template>
      <template v-slot:cell(category_name)="data">
        <template v-if="data.item.category !== null">
          <b-button
            block
            variant="outline-info"
            @click="editModalFindingName(data)">Edit group</b-button>
          {{ data.item.category_name }}
          <span
            v-if="data.item.category_extra_info !== ''"
            v-b-tooltip.hover
            :title="data.item.category_extra_info">*</span>
        </template>
        <template v-else>
          <b-button
            v-if="mode==='edit' && data.item.references.length"
            variant="info"
            block
            @click="editModalFindingName(data)">Assign group</b-button>
        </template>
      </template>
      <template v-slot:cell(cerqual_option)="data">
        <b-button
          v-if="mode==='edit' && data.item.references.length"
          class="d-print-none mb-3"
          :disabled="(data.item.references.length) ? false : true"
          block
          :variant="(data.item.cerqual_option === '') ? 'info' : 'outline-info'"
          :to="{name: 'editList', params: {id: data.item.id}}">
            <font-awesome-icon
              v-if="Object.prototype.hasOwnProperty.call(data.item, 'evidence_profile') && (data.item.evidence_profile.methodological_limitations.notes || data.item.evidence_profile.coherence.notes || data.item.evidence_profile.adequacy.notes || data.item.evidence_profile.relevance.notes || data.item.evidence_profile.cerqual.notes)"
              icon="comments"></font-awesome-icon>
            <span v-if="data.item.cerqual_option===''">Complete</span>
            <span v-if="data.item.cerqual_option!=''">Edit</span>
            GRADE-CERQual Assessment
          </b-button>
        <b>{{ data.item.cerqual_option }}</b>
      </template>
      <template v-slot:cell(cerqual_explanation)="data">
        <b-button
          v-if="mode==='edit' && data.item.references.length"
          class="d-print-none mb-3"
          :disabled="(data.item.references.length) ? false : true"
          block
          :variant="(data.item.cerqual_explanation==='') ? 'info' : 'outline-info'"
          :to="{name: 'editList', params: {id: data.item.id}}">
            <font-awesome-icon
              v-if="Object.prototype.hasOwnProperty.call(data.item, 'evidence_profile') && (data.item.evidence_profile.methodological_limitations.notes || data.item.evidence_profile.coherence.notes || data.item.evidence_profile.adequacy.notes || data.item.evidence_profile.relevance.notes || data.item.evidence_profile.cerqual.notes)"
              icon="comments"></font-awesome-icon>
            <span v-if="data.item.cerqual_explanation===''">Complete</span>
            <span v-if="data.item.cerqual_explanation!=''">Edit</span>
            GRADE-CERQual Assessment
        </b-button>
        <b class="cerqual-explanation" v-if="data.item.cerqual_option !== ''">{{ data.item.cerqual_explanation }}</b>
      </template>
      <template v-slot:cell(ref_list)="data">
        <template v-if="mode!=='edit'">
          {{ data.item.ref_list }}
        </template>
        <template v-else>
          <b-button
            block
            class="mb-3 d-print-none"
            :variant="(data.item.references.length) ? 'outline-info' : 'info'"
            @click="openModalReferences(data)">
            <span v-if="data.item.references.length">View or edit references</span>
            <span v-else>Select references</span>
          </b-button>
          There are <b>{{ data.item.raw_ref.length }}</b> references.
        </template>
      </template>
      <template v-slot:empty>
        <p class="text-center my-5">
          There are no findings to show, <a href="#" @click="modalAddList">add review finding</a>
        </p>
      </template>
      <template v-slot:table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
          <strong>Loading...</strong>
        </div>
      </template>
    </b-table>
    <!-- modals -->
    <b-modal
      size="xl"
      id="edit-finding-name"
      ref="edit-finding-name"
      title="Edit Summarised review finding"
      ok-title="Save"
      ok-variant="outline-success"
      cancel-variant="outline-secondary"
      @ok="updateListName">
      <b-alert
        :show="editingUser.show"
        variant="danger">
        The user <b>{{editingUser.first_name}} {{editingUser.last_name}}</b> is editing this finding. The edit mode is disabled.
      </b-alert>
      <b-form-group
        label="Summarised review finding"
        label-for="finding-name">
        <template slot="description">Click <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/1" target="_blank">here</a> for tips for writing a summarised review finding</template>
        <b-form-textarea
          id="finding-name"
          v-model="editFindingName.name"
          rows="6"
          max-rows="100"></b-form-textarea>
      </b-form-group>
      <b-form-group
        v-if="list_categories.options.length"
        label="Select review finding group"
        description="You can leave this option blank. You can always assign a finding to a group later.">
        <b-form-select
          v-model="editFindingName.category"
          value-field="id"
          text-field="text"
          :options="list_categories.options"></b-form-select>
      </b-form-group>
      <b-form-group
        label-for="finding-note"
        description="Optional space for reviewers to leave notes for each other about this review finding">
        <template v-slot:label>
          <videoHelp txt="Notes" tag="none" urlId="462176506"></videoHelp>
        </template>
        <b-form-textarea
          id="finding-note"
          v-model="editFindingName.notes"
          rows="6"
          max-rows="100"></b-form-textarea>
      </b-form-group>
    </b-modal>

    <b-modal
      size="xl"
      id="remove-finding"
      ref="remove-finding"
      title="Remove summarised review finding"
      ok-title="Confirm"
      ok-variant="outline-danger"
      cancel-variant="outline-secondary"
      @ok="confirmRemoveList">
      <b-alert
        :show="editingUser.show"
        variant="danger">
        The user <b>{{editingUser.first_name}} {{editingUser.last_name}}</b> is editing this finding. The edit mode is disabled.
      </b-alert>
      <p class="text-danger">
        Warning! Deleting this finding will also delete its associated GRADE-CERQual Assessment Worksheet.
      </p>
      <p>
        Confirm you want to remove <b>{{ this.editFindingName.name }}</b> from the iSoQ table?
      </p>
    </b-modal>

    <b-modal
      v-if="selected_list_index >= 0"
      id="modal-references-list"
      ref="modal-references-list"
      title="References"
      @ok="saveReferencesList"
      @cancel="cancelReferencesList"
      :ok-disabled="(selected_list_index === null) ? true : false"
      ok-title="Save"
      ok-variant="outline-success"
      cancel-variant="outline-secondary"
      size="xl"
      scrollable>
      <b-alert
        :show="editingUser.show"
        variant="danger">
        The user <b>{{editingUser.first_name}} {{editingUser.last_name}}</b> is editing this finding. The edit mode is disabled.
      </b-alert>
      <template v-if="references.length">
        <div
          class="mt-2">
          <b-alert
            v-if="showBanner"
            show
            variant="danger">
            <b>Warning!</b> By removing a reference you are modifying the underlining evidence base for this finding and will need to review your GRADE-CERQual assessments. If you remove the reference, the extracted data you inputted from this study to support this finding will be deleted from the GRADE-CERQual Assessment Worksheet.
          </b-alert>
          <b-table
            responsive
            striped
            :fields="[{key: 'checkbox', label: ''}, {key: 'content', label:'Author(s), Year, Title'}]"
            :items="refs">
            <template v-slot:cell(checkbox)="data">
              <b-form-checkbox
                :id="`checkbox-${data.index}`"
                v-model="selected_references"
                :name="`checkbox-${data.index}`"
                :value="data.item.id">
              </b-form-checkbox>
            </template>
          </b-table>
        </div>
      </template>
      <template v-else>
        <div
          class="mt-2">
          <p>To select references, first upload your full reference list by clicking "Import References" next to the search bar.</p>
        </div>
      </template>
    </b-modal>
  </div>
</template>

<script>
import axios from 'axios'
import Commons from '../../utils/commons.js'

export default {
  name: 'ViewTable',
  components: {
    videoHelp: () => import('@/components/videoHelp.vue')
  },
  data () {
    return {
      ui: {
        project: {
          type: '',
          inclusion: {
            success: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            error: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            loading: false,
            loading_txt: 'Save'
          },
          exclusion: {
            success: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            error: {
              show: false,
              dismissSecs: 5,
              dismissCountDown: 0
            },
            loading: false,
            loading_txt: 'Save'
          },
          displaySearch: false,
          showFilterOne: false,
          showFilterTwo: false,
          showFilterThree: false,
          show_criteria: false
        },
        itemData: null,
        publish: {
          showLoader: false
        }
      },
      table_settings: {
        isBusy: true,
        currentPage: 1,
        perPage: 5,
        filter: null,
        totalRows: 1,
        filterOn: ['filter_cerqual', 'category_name', 'explanation']
      },
      editingUser: {
        show: false,
        first_name: '',
        last_name: ''
      },
      editFindingName: {
        index: null,
        id: null,
        finding_id: null,
        name: null,
        notes: null,
        editing: false
      },
      selected_list_index: null,
      showBanner: false,
      selected_references: [],
      finding: {}
    }
  },
  props: {
    lists: {
      type: Array,
      required: true,
      default: () => []
    },
    list_categories: {
      type: Object,
      required: true,
      default: () => ({
        options: [],
        selected: null
      })
    },
    fields: {
      type: Object,
      required: true,
      default: () => ({
        with_categories: [
          {key: 'sort', label: 'No.'},
          {key: 'name', label: 'Summarised review finding'},
          {key: 'category_name', label: 'Review finding group'},
          {key: 'cerqual_option', label: 'GRADE-CERQual Assessment'},
          {key: 'cerqual_explanation', label: 'Explanation'},
          {key: 'ref_list', label: 'References'}
        ],
        without_categories: [
          {key: 'sort', label: 'No.'},
          {key: 'name', label: 'Summarised review finding'},
          {key: 'cerqual_option', label: 'GRADE-CERQual Assessment'},
          {key: 'cerqual_explanation', label: 'Explanation'},
          {key: 'ref_list', label: 'References'}
        ]
      })
    },
    project: {
      type: Object,
      required: true,
      default: () => ({
        is_public: false
      })
    },
    references: {
      type: Array,
      required: true,
      default: () => []
    },
    refs: {
      type: Array,
      required: true,
      default: () => []
    },
    mode: {
      type: String,
      required: true,
      default: 'view'
    },
    isBusy: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  methods: {
    onFiltered: function (filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.table_settings.totalRows = filteredItems.length
      this.table_settings.currentPage = 1
    },
    cleanTableFilter () {
      this.ui.project.showFilterOne = false
      this.ui.project.showFilterTwo = false
      this.ui.project.showFilterThree = false
      this.table_settings.filter = ''
    },
    isFilterActive: function (val) {
      const regex = new RegExp(`^${val}$`, 'i')
      return regex.test(this.table_settings.filter)
    },
    tableFilter: function (txt, filter) {
      this.table_settings.filter = txt
      switch (filter) {
        case 1:
          this.ui.project.showFilterOne = true
          this.ui.project.showFilterTwo = false
          this.ui.project.showFilterThree = false
          break
        case 2:
          this.ui.project.showFilterOne = false
          this.ui.project.showFilterTwo = true
          this.ui.project.showFilterThree = false
          break
        case 3:
          this.ui.project.showFilterOne = false
          this.ui.project.showFilterTwo = false
          this.ui.project.showFilterThree = true
          break
      }
      window.scrollTo({ top: 600, behavior: 'smooth' })
    },
    editModalFindingName: function (data) {
      this.editFindingName = this.setEditFindingNameProp(data)

      const params = {
        organization: this.$route.params.org_id,
        list_id: data.item.id
      }
      axios.get('/api/isoqf_findings', {params})
        .then((response) => {
          this.editFindingName.finding_id = response.data[0].id
        })
        .catch((error) => {
          console.log(Commons.printErrors(error))
        })
      this.$refs['edit-finding-name'].show()
    },
    removeModalFinding: function (data) {
      this.editFindingName.index = data.index
      this.editFindingName.name = data.item.name
      this.editFindingName.id = data.item.id
      const params = {
        organization: this.$route.params.org_id,
        list_id: data.item.id
      }
      axios.get('/api/isoqf_findings', {params})
        .then((response) => {
          this.editFindingName.finding_id = response.data[0].id
        })
        .catch((error) => {
          console.log(Commons.printErrors(error))
        })
      this.$refs['remove-finding'].show()
    },
    modalAddList: function () {
      this.list_categories.selected = null
      this.$refs['add-summarized'].show()
    },
    openModalReferences: function (data) {
      this.editFindingName = this.setEditFindingNameProp(data)
      const index = this.lists.findIndex((item) => item.id === data.item.id)
      this.selected_list_index = index
      const params = {
        list_id: data.item.id
      }
      axios.get('/api/isoqf_findings', {params})
        .then(async (response) => {
          if (response.data.length) {
            this.finding = JSON.parse(JSON.stringify(response.data[0]))
            await this.$emit('get-references', false)
            this.selected_references = data.item.references
            this.showBanner = false
            if (data.item.cerqual_option !== '') {
              this.showBanner = true
            }
            this.$refs['modal-references-list'].show()
          }
        })
        .catch((error) => {
          console.log(Commons.printErrors(error))
        })
    },
    setEditFindingNameProp: function (data) {
      return {
        index: data.index,
        id: data.item.id,
        name: data.item.name,
        category: data.item.category,
        notes: data.item.notes
      }
    },
    updateListName: async function () {
      this.$emit('set-busy', true)
      const list = await this.processDataList()
      axios.patch(`/api/isoqf_lists/${this.editFindingName.id}`, list)
        .then(() => {
          this.updateFinding(this.editFindingName)
          this.$emit('update-modification-time')
        })
        .catch((error) => {
          console.log(Commons.printErrors(error))
        })
    },
    processDataList: async function () {
      const lists = JSON.parse(JSON.stringify(this.lists))
      let _item = {}
      _item.is_public = false
      if (this.project.is_public) {
        _item.is_public = true
      }
      for (let item of lists) {
        if (item.id === this.editFindingName.id) {
          _item = item
          _item.name = this.editFindingName.name
          _item.category = this.editFindingName.category
          _item.notes = this.editFindingName.notes
        }
      }
      return _item
    },
    updateFinding: function (finding) {
      let isPublic = false
      if (this.project.is_public) {
        isPublic = true
      }
      const params = {
        name: finding.name,
        notes: finding.notes,
        is_public: isPublic,
        'evidence_profile.name': finding.name,
        'evidence_profile.notes': finding.notes
      }
      axios.patch(`/api/isoqf_findings/${finding.finding_id}`, params)
        .then(() => {
          this.$emit('get-lists')
        })
        .catch((error) => {
          console.log(Commons.printErrors(error))
        })
    },
    confirmRemoveList: function () {
      if (!this.editFindingName.id) {
        return
      }
      this.$emit('set-busy', true)
      axios.delete(`/api/isoqf_lists/${this.editFindingName.id}`)
        .then(() => {
          this.confirmRemoveFinding()
        })
        .catch((error) => {
          this.$emit('set-busy', false)
          console.log(Commons.printErrors(error))
        })
    },
    confirmRemoveFinding: function () {
      if (!this.editFindingName.finding_id) {
        return
      }
      axios.delete(`/api/isoqf_findings/${this.editFindingName.finding_id}`)
        .then(() => {
          this.deleteExtractedData()
        })
        .catch((error) => {
          this.$emit('set-busy', false)
          console.log(Commons.printErrors(error))
        })
    },
    deleteExtractedData: function () {
      const params = {
        organization: this.$route.params.org_id,
        finding_id: this.editFindingName.finding_id
      }
      axios.get('/api/isoqf_extracted_data', {params})
        .then((response) => {
          axios.delete(`/api/isoqf_extracted_data/${response.data[0].id}`)
            .then(() => {
              this.updateSortList(JSON.parse(JSON.stringify(this.editFindingName)))
              this.editFindingName = {
                index: null,
                finding_id: null,
                id: null,
                name: null,
                notes: null,
                editing: false
              }
            })
            .catch((error) => {
              this.$emit('set-busy', false)
              console.log(Commons.printErrors(error))
            })
        })
        .catch((error) => {
          this.$emit('set-busy', false)
          console.log(Commons.printErrors(error))
        })
    },
    updateSortList: function (data) {
      const index = data.index
      let lists = JSON.parse(JSON.stringify(this.lists))
      lists.splice(index, 1)
      let querys = []
      let cnt = 1
      for (const list of lists) {
        querys.push(axios.patch(`/api/isoqf_lists/${list.id}`, {sort: cnt}))
        cnt++
      }
      Promise.all(querys)
        .then(() => {
          this.$emit('get-lists')
        })
        .catch((error) => {
          this.$emit('set-busy', false)
          console.log(Commons.printErrors(error))
        })
    },
    cancelReferencesList: function () {
      this.cleanReferencesList()
      this.$refs['modal-references-list'].hide()
    },
    saveReferencesList: function () {
      this.$emit('set-load-references', true)
      this.$emit('set-busy', true)
      const index = this.selected_list_index
      const params = {
        references: this.selected_references
      }
      axios.patch(`/api/isoqf_lists/${this.lists[index].id}`, params)
        .then(async () => {
          this.updateFindingReferences(this.selected_references)
          this.$emit('get-lists')
        })
        .catch((error) => {
          console.log(Commons.printErrors(error))
        })
    },
    cleanReferencesList: function () {
      this.selected_references = []
      this.finding = {}
    },
    updateFindingReferences: function (references) {
      const params = {
        'evidence_profile.references': references
      }
      axios.patch(`/api/isoqf_findings/${this.finding.id}`, params)
        .then(() => {
          this.cleanReferencesList()
          this.$emit('set-load-references', false)
        })
        .catch((error) => {
          console.log(Commons.printErrors(error))
        })
    }
  }
}
</script>
