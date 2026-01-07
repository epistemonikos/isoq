<template>
  <div>
    <b-table
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
        <span v-b-tooltip.hover :title="$t('soqf_table.auto_numbering')">{{ data.label }}</span>
      </template>
      <template v-slot:head(name)="data">
        <span v-b-tooltip.hover :title="$t('soqf_table.finding_summary')">{{ data.label }}</span>
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
        <span v-b-tooltip.hover :title="$t('soqf_table.confidence_desc')">{{ data.label }}</span>
        <b-dropdown
          id="dropdown-cerqual-option"
          text=""
          class="finding-filter"
          :no-caret="false"
          size="sm">
          <b-dropdown-item @click="tableFilter('hc', 2)" :active="isFilterActive('hc')">{{ $t('soqf_table.high_confidence') }}</b-dropdown-item>
          <b-dropdown-item @click="tableFilter('mc', 2)" :active="isFilterActive('mc')">{{ $t('soqf_table.moderate_confidence') }}</b-dropdown-item>
          <b-dropdown-item @click="tableFilter('lc', 2)" :active="isFilterActive('lc')">{{ $t('soqf_table.low_confidence') }}</b-dropdown-item>
          <b-dropdown-item @click="tableFilter('vc', 2)" :active="isFilterActive('vc')">{{ $t('soqf_table.very_low_confidence') }}</b-dropdown-item>
          <b-dropdown-divider></b-dropdown-divider>
          <b-dropdown-item @click="tableFilter('completed', 2)" :active="isFilterActive('completed')">{{ $t('soqf_table.assessments_completed') }}</b-dropdown-item>
          <b-dropdown-item @click="tableFilter('unfinished', 2)" :active="isFilterActive('unfinished')">{{ $t('soqf_table.assessments_not_completed') }}</b-dropdown-item>
        </b-dropdown>
        <span v-if="ui.project.showFilterTwo" class="text-danger remove-opt" @click="cleanTableFilter">&times;</span>
      </template>
      <template v-slot:head(cerqual_explanation)="data">
        <span v-b-tooltip.hover :title="$t('soqf_table.explanation_desc')">{{ data.label }}</span>
        <b-dropdown
          id="dropdown-cerqual-explanation"
          text=""
          class="finding-filter"
          :no-caret="false"
          size="sm">
          <b-dropdown-item @click="tableFilter('with_explanation', 3)" :active="isFilterActive('with_explanation')">{{ $t('common.completed') }}</b-dropdown-item>
          <b-dropdown-item @click="tableFilter('without_explanation', 3)" :active="isFilterActive('without_explanation')">{{ $t('common.not_completed') }}</b-dropdown-item>
        </b-dropdown>
        <span v-if="ui.project.showFilterThree" class="text-danger remove-opt" @click="cleanTableFilter">&times;</span>
      </template>
      <template v-slot:head(ref_list)="data">
        <span v-b-tooltip.hover :title="$t('soqf_table.studies_contribute')">{{ data.label }}</span>
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
                {{ $t('common.edit') }}
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
                {{ $t('common.remove') }}
              </b-button>
            </b-col>
          </b-row>
          <b-link class="table-edit-list" v-if="data.item.references.length" :to="{name: 'editList', params: {id: data.item.id}}">{{ data.item.name }}</b-link>
          <span v-if="data.item.references.length === 0">{{ data.item.name }}</span>
        </span>
        <span v-else>
          <template v-if="mode==='view' && data.item.references.length">
            <b-link class="table-edit-list" :to="{name: 'editList', params: {id: data.item.id}}">{{ data.item.name }}</b-link>
          </template>
          <template v-else>
            {{ data.item.name }}
          </template>
        </span>
      </template>
      <template v-slot:cell(category_name)="data">
        <template v-if="data.item.category !== null">
          <b-button
            v-if="mode==='edit'"
            block
            variant="outline-info"
            @click="editModalFindingName(data)">{{ $t('soqf_table.edit_group') }}</b-button>
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
            @click="editModalFindingName(data)">{{ $t('soqf_table.assign_group') }}</b-button>
        </template>
      </template>
      <template v-slot:cell(cerqual_option)="data">
        <b-button
          v-if="data.item.references.length"
          class="d-print-none mb-3"
          :disabled="(data.item.references.length) ? false : true"
          block
          :variant="(data.item.cerqual_option === '') ? 'info' : 'outline-info'"
          :to="{name: 'editList', params: {id: data.item.id}}">
            <font-awesome-icon
              v-if="mode==='edit' && Object.prototype.hasOwnProperty.call(data.item, 'evidence_profile') && (data.item.evidence_profile.methodological_limitations.notes || data.item.evidence_profile.coherence.notes || data.item.evidence_profile.adequacy.notes || data.item.evidence_profile.relevance.notes || data.item.evidence_profile.cerqual.notes)"
              icon="comments"></font-awesome-icon>
            <span v-if="mode === 'edit' && data.item.cerqual_option===''">{{ $t('common.complete') }}</span>
            <span v-if="mode === 'edit' && data.item.cerqual_option!=''">{{ $t('common.edit') }}</span>
            <span v-if="mode !== 'edit'">{{ $t('common.view') }}</span>
            {{ $t('soqf_table.gc_assessment') }}
          </b-button>
        <b>{{ data.item.cerqual_option }}</b>
      </template>
      <template v-slot:cell(cerqual_explanation)="data">
        <b-button
          v-if="data.item.references.length"
          class="d-print-none mb-3"
          :disabled="(data.item.references.length) ? false : true"
          block
          :variant="(data.item.cerqual_explanation==='') ? 'info' : 'outline-info'"
          :to="{name: 'editList', params: {id: data.item.id}}">
            <font-awesome-icon
              v-if="mode === 'edit' && Object.prototype.hasOwnProperty.call(data.item, 'evidence_profile') && (data.item.evidence_profile.methodological_limitations.notes || data.item.evidence_profile.coherence.notes || data.item.evidence_profile.adequacy.notes || data.item.evidence_profile.relevance.notes || data.item.evidence_profile.cerqual.notes)"
              icon="comments"></font-awesome-icon>
            <span v-if="mode === 'edit' && data.item.cerqual_explanation===''">{{ $t('common.complete') }}</span>
            <span v-if="mode === 'edit' && data.item.cerqual_explanation!=''">{{ $t('common.edit') }}</span>
            <span v-if="mode !== 'edit'">{{ $t('common.view') }}</span>
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
            <span v-if="data.item.references.length">{{ $t('soqf_table.view_edit_refs') }}</span>
            <span v-else>{{ $t('soqf_table.select_references') }}</span>
          </b-button>
          <span v-html="$t('soqf_table.refs_count', {count: data.item.raw_ref.length})"></span>
        </template>
      </template>
      <template v-slot:empty>
        <p class="text-center my-5">
          {{ $t('soqf_table.no_findings') }} <a href="#" @click="modalAddList">{{ $t('soqf_table.add_review_finding') }}</a>
        </p>
      </template>
      <template v-slot:table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
          <strong>{{ $t('common.loading') }}</strong>
        </div>
      </template>
    </b-table>
    <!-- modals -->
    <b-modal
      size="lg"
      id="edit-finding-name"
      ref="edit-finding-name"
      :title="$t('soqf_table.edit_finding')"
      :ok-title="$t('common.save')"
      ok-variant="outline-success"
      cancel-variant="outline-secondary"
      :ok-disabled="!editFindingName.name || !editFindingName.name.trim().length"
      @ok="updateListName">
      <b-alert
        :show="editingUser.show"
        variant="danger">
        <span v-html="$t('soqf_table.user_editing', {first_name: editingUser.first_name, last_name: editingUser.last_name})"></span>
      </b-alert>
      <b-form-group
        :label="$t('soqf_table.summarised_finding')"
        label-for="finding-name">
        <template slot="description">{{ $t('soqf_table.tips_writing') }}</template>
        <b-form-textarea
          id="finding-name"
          v-model="editFindingName.name"
          rows="6"
          max-rows="100"></b-form-textarea>
      </b-form-group>
      <b-form-group
        v-if="list_categories.options.length"
        :label="$t('soqf_table.select_group')"
        :description="$t('soqf_table.group_optional')">
        <b-form-select
          v-model="editFindingName.category"
          value-field="id"
          text-field="text"
          :options="list_categories.options"></b-form-select>
      </b-form-group>
      <b-form-group
        label-for="finding-note"
        :description="$t('soqf_table.notes_placeholder')">
        <template v-slot:label>
          <videoHelp :txt="$t('common.notes')" tag="none" urlId="462176506"></videoHelp>
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
      :title="$t('soqf_table.remove_finding')"
      :ok-title="$t('common.confirm')"
      ok-variant="outline-danger"
      cancel-variant="outline-secondary"
      @ok="confirmRemoveList">
      <b-alert
        :show="editingUser.show"
        variant="danger">
        <span v-html="$t('soqf_table.user_editing', {first_name: editingUser.first_name, last_name: editingUser.last_name})"></span>
      </b-alert>
      <p v-if="ui.project.showExtendedExplanationTextForDeleting" class="text-danger">
        {{ $t('soqf_table.delete_warning_revert') }}
      </p>
      <p v-else class="text-danger">
        {{ $t('soqf_table.delete_warning') }}
      </p>
      <p>
        <span v-html="$t('soqf_table.confirm_remove', {name: this.editFindingName.name})"></span>
      </p>
    </b-modal>

    <b-modal
      v-if="selected_list_index >= 0"
      id="modal-references-list"
      ref="modal-references-list"
      :title="$t('soqf_table.references')"
      @ok="checkReferencesBeforeSaving"
      @hidden="handleReferencesModalHidden"
      @cancel="cancelReferencesList"
      :ok-disabled="(selected_list_index === null) ? true : false"
      :no-close-on-backdrop="pendingSaveReferences"
      :no-close-on-esc="pendingSaveReferences"
      :ok-title="$t('common.save')"
      ok-variant="outline-success"
      cancel-variant="outline-secondary"
      size="xl"
      scrollable>
      <b-alert
        :show="editingUser.show"
        variant="danger">
        <span v-html="$t('soqf_table.user_editing', {first_name: editingUser.first_name, last_name: editingUser.last_name})"></span>
      </b-alert>
      <template v-if="references.length">
        <div
          class="mt-2">
          <b-alert
            v-if="showBanner"
            show
            variant="danger">
            {{ $t('soqf_table.remove_ref_warning') }}
          </b-alert>
          <b-table
            responsive
            striped
            :fields="[{key: 'checkbox', label: ''}, {key: 'content', label: $t('soqf_table.author_year_title')}]"
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
          <p>{{ $t('references.select_first') }}</p>
        </div>
      </template>
    </b-modal>

    <b-modal
      id="modal-no-references-warning"
      ref="modal-no-references-warning"
      :title="$t('project.warning')"
      @ok="confirmSaveNoReferences"
      @cancel="cancelNoReferencesWarning"
      :ok-title="$t('common.continue')"
      ok-variant="outline-danger"
      cancel-variant="outline-secondary"
      no-close-on-backdrop
      no-close-on-esc>
      <p>{{ $t('soqf_table.remove_all_unpublish') }}</p>
    </b-modal>

    <b-modal
      id="modal-private-project-warning"
      ref="modal-private-project-warning"
      :title="$t('project.warning')"
      @ok="confirmSavePrivateProject"
      @cancel="cancelPrivateProjectWarning"
      :ok-title="$t('common.continue')"
      ok-variant="outline-danger"
      cancel-variant="outline-secondary"
      no-close-on-backdrop
      no-close-on-esc>
      <p>{{ $t('soqf_table.remove_all_revert') }}</p>
    </b-modal>
  </div>
</template>

<script>
import Api from '@/utils/Api'
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
            loading_txt: this.$t('common.save')
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
            loading_txt: this.$t('common.save')
          },
          displaySearch: false,
          showFilterOne: false,
          showFilterTwo: false,
          showFilterThree: false,
          show_criteria: false,
          showExtendedExplanationTextForDeleting: false
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
        editing: false,
        organization: null,
        list_id: null,
        isoqf_id: null,
        evidence_profile: {
          name: '',
          isoqf_id: null,
          relevance: {
            explanation: '',
            option: null
          },
          adequacy: {
            explanation: '',
            option: null
          },
          coherence: {
            explanation: '',
            option: null
          },
          methodological_limitations: {
            explanation: '',
            option: null
          },
          cerqual: {
            explanation: '',
            option: null
          },
          references: []
        },
        references: [],
        is_public: null,
        license_type: null,
        private: null,
        public_type: null
      },
      selected_list_index: null,
      showBanner: false,
      selected_references: [],
      original_references: [],
      finding: {},
      pendingSaveReferences: false
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
          {key: 'name', label: this.$t('table_headers.summarised_finding')},
          {key: 'category_name', label: this.$t('table_headers.review_finding_groups')},
          {key: 'cerqual_option', label: this.$t('table_headers.cerqual_assessment')},
          {key: 'cerqual_explanation', label: this.$t('table_headers.cerqual_explanation')},
          {key: 'ref_list', label: this.$t('table_headers.references')}
        ],
        without_categories: [
          {key: 'sort', label: 'No.'},
          {key: 'name', label: this.$t('table_headers.summarised_finding')},
          {key: 'cerqual_option', label: this.$t('table_headers.cerqual_assessment')},
          {key: 'cerqual_explanation', label: this.$t('table_headers.cerqual_explanation')},
          {key: 'ref_list', label: this.$t('table_headers.references')}
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
      required: false,
      default: ''
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
      Api.get('/isoqf_findings', params)
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
      const params = {
        organization: this.$route.params.org_id,
        list_id: data.item.id
      }
      Api.get('/isoqf_findings', params)
        .then((response) => {
          this.editFindingName = {...response.data[0]}

          let cnt = 0
          for (const el of this.lists) {
            if (Object.prototype.hasOwnProperty.call(el, 'evidence_profile') && el.evidence_profile.cerqual.option !== null) {
              cnt++
            }
          }

          // Only show extended warning if the project is currently public and would become private
          if (!this.project.private && cnt === 1 && this.editFindingName.evidence_profile.cerqual.option !== null) {
            this.ui.project.showExtendedExplanationTextForDeleting = true
          } else {
            this.ui.project.showExtendedExplanationTextForDeleting = false
          }

          this.$refs['remove-finding'].show()
        })
        .catch((error) => {
          console.log(Commons.printErrors(error))
        })
    },
    modalAddList: function () {
      this.$emit('add-list')
    },
    openModalReferences: function (data) {
      this.editFindingName = this.setEditFindingNameProp(data)
      const index = this.lists.findIndex((item) => item.id === data.item.id)
      this.selected_list_index = index
      const params = {
        list_id: data.item.id
      }
      Api.get('/isoqf_findings', params)
        .then(async (response) => {
          if (response.data.length) {
            this.finding = JSON.parse(JSON.stringify(response.data[0]))
            await this.$emit('get-references', false)
            this.selected_references = data.item.references
            this.original_references = [...data.item.references]
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
      Api.patch(`/isoqf_lists/${this.editFindingName.id}`, list)
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
      Api.patch(`/isoqf_findings/${finding.finding_id}`, params)
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
      const params = {
        project_id: this.$route.params.id,
        finding_id: this.editFindingName.id
      }
      Api.post('/finding/remove', params)
        .then(() => {
          this.$emit('get-project')
        })
        .catch((error) => {
          this.$emit('set-busy', false)
          console.log(Commons.printErrors(error))
        })
    },
    cancelReferencesList: function () {
      this.$refs['modal-references-list'].hide()
    },
    checkReferencesBeforeSaving: function (bvModalEvent) {
      // Prevent modal from closing automatically
      // Only show warning if there were original references and all have been removed
      if (this.selected_references.length === 0 && this.original_references.length > 0 && this.project.is_public) {
        bvModalEvent.preventDefault()
        this.pendingSaveReferences = true

        let findingsWithRefsCount = 0
        for (const item of this.lists) {
          if (item.references && item.references.length > 0) {
            findingsWithRefsCount++
          }
        }

        // Special case: if there's only one item in the list, removing all references will make the project private
        if (findingsWithRefsCount <= 1) {
          this.$refs['modal-private-project-warning'].show()
        } else {
          this.$refs['modal-no-references-warning'].show()
        }
        return
      }

      // If no warning is needed, proceed with saving
      this.saveReferencesList()
    },

    handleReferencesModalHidden: function () {
      // Only clean up if not pending save from warning dialog
      if (!this.pendingSaveReferences) {
        this.cleanReferencesList()
      }
    },

    confirmSaveNoReferences: function () {
      // User confirmed they want to proceed with no references
      this.saveReferencesList()
      // Close both modals
      this.$nextTick(() => {
        this.pendingSaveReferences = false
        this.$refs['modal-references-list'].hide()
      })
    },

    cancelNoReferencesWarning: function () {
      // User cancelled - restore original references selection
      this.selected_references = [...this.original_references]
      this.pendingSaveReferences = false
    },

    confirmSavePrivateProject: function () {
      // User confirmed they want to proceed, making the project private
      this.saveProjectAsPrivate()
      // Save the references (which will be empty)
      this.saveReferencesList()
      // Close both modals
      this.$nextTick(() => {
        this.pendingSaveReferences = false
        this.$refs['modal-references-list'].hide()
      })
    },

    cancelPrivateProjectWarning: function () {
      // User cancelled - restore original references selection
      this.selected_references = [...this.original_references]
      this.pendingSaveReferences = false
    },

    saveProjectAsPrivate: function () {
      // Update the project to be private
      const params = {
        is_public: false,
        private: true,
        license_type: '',
        public_type: 'private'
      }
      Api.patch(`/isoqf_projects/${this.project.id}`, params)
        .then(() => {
          // Emit an event to notify the parent component that the project status changed
          this.$emit('update-project-status')
        })
        .catch((error) => {
          console.log(Commons.printErrors(error))
        })
    },

    saveReferencesList: function () {
      this.$emit('set-load-references', true)
      this.$emit('set-busy', true)
      const index = this.selected_list_index
      const params = {
        references: this.selected_references
      }
      Api.patch(`/isoqf_lists/${this.lists[index].id}`, params)
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
      this.original_references = []
      this.finding = {}
      this.pendingSaveReferences = false
    },
    updateFindingReferences: function (references) {
      const params = {
        'evidence_profile.references': references
      }
      Api.patch(`/isoqf_findings/${this.finding.id}`, params)
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
