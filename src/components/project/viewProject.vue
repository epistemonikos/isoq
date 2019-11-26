<template>
  <div class="mt-4">
    <b-container>
      <b-row align-h="end">
        <b-col cols="12" class="text-right d-print-none">
          <b-link @click="$router.go(-1)">
            <font-awesome-icon icon="long-arrow-alt-left" v-bind:title="$t('back')" />
            {{ $t('back') }}
          </b-link>
        </b-col>
      </b-row>
      <b-tabs content-class="mt-3" fill v-model="tabOpened">
        <b-tab title="Project properties">
          <b-row>
            <b-col
              cols="12">
              <h2>Project properties</h2>
            </b-col>
          </b-row>
          <b-row>
            <b-col
              cols="12">
              <b-form-group
                label="Title of review"
                label-for="projectName">
                <b-form-input
                  id="projectName"
                  v-model="project.name"></b-form-input>
              </b-form-group>
              <b-form-group
                label="Description">
                <b-form-textarea
                  v-model="project.description"></b-form-textarea>
              </b-form-group>
              <b-form-group
                label="Authors"
                label-for="authors">
                <b-form-input
                  id="authors"
                  v-model="project.authors">
                </b-form-input>
              </b-form-group>
              <b-form-group
                label="Review question"
                label-for="review_question">
                <b-form-textarea
                  id="review_question"
                  v-model="project.review_question"></b-form-textarea>
              </b-form-group>
              <b-form-group
                label-for="has-been-published"
                label="Has this review been published?">
                <b-select
                  id="has-been-published"
                  v-model="project.published_status"
                  :options="yes_or_no"></b-select>
              </b-form-group>
              <b-form-group
                v-if="project.published_status"
                :label="$t('URL or DOI')"
                label-for="project-list-url-doi">
                <b-input
                  placeholder="https://doi.org/10.1109/5.771073"
                  type="url"
                  id="project-list-url-doi"
                  v-model="project.url_doi"></b-input>
              </b-form-group>
              <b-form-group
                label="Is the iSoQf being completed by the review authors?"
                label-for="completed-by-author-status">
                <b-select
                  id="completed-by-author-status"
                  v-model="project.complete_by_author"
                  :options="yes_or_no"></b-select>
              </b-form-group>
              <b-form-group
                label="Visible?"
                label-for="project-list-status">
                <b-select
                  id="project-list-status"
                  v-model="project.private"
                  :options="global_status"></b-select>
              </b-form-group>
            </b-col>
          </b-row>
          <b-row align-h="end">
            <b-col
              cols="6">
              <b-button
                block
                variant="outline-success"
                @click="updateProjectInfo">
                Save
              </b-button>
            </b-col>
          </b-row>
        </b-tab>
        <b-tab title="iSoQf">
          <b-row class="mb-3">
            <b-col cols="12" class="toDoc">
              <h2><span v-if="mode==='edit'" class="d-print-none">Interactive </span>Summary of Qualitative Findings Table</h2>
            </b-col>
          </b-row>
          <b-row
            class="d-print-none justify-content-end mb-5">
            <b-col
              cols="12"
              sm="2">
              <b-dropdown
                v-if="mode==='view'"
                id="export-button"
                class="btn-block"
                variant="outline-secondary"
                right
                text="Export">
                <b-dropdown-item @click="generateAndDownload">to MS Word</b-dropdown-item>
                <b-dropdown-item disabled>to Cochrane</b-dropdown-item>
                <b-dropdown-item disabled>to GRADE</b-dropdown-item>
                <b-dropdown-divider></b-dropdown-divider>
                <b-dropdown-item @click="exportToRIS">the references</b-dropdown-item>
              </b-dropdown>
            </b-col>
            <b-col
              class="mt-1 mt-sm-0"
              v-if="mode==='view'"
              cols="12"
              sm="2">
                <b-button
                  variant="outline-info"
                  block
                  @click="printiSoQf">
                  <font-awesome-icon icon="print"></font-awesome-icon>
                  Print
                </b-button>
            </b-col>
            <b-col
              class="mt-1 mt-sm-0"
              v-if="mode==='view'"
              cols="12"
              sm="2">
                <b-button
                  @click="changeMode"
                  variant="outline-primary"
                  block>
                  <font-awesome-icon icon="edit"></font-awesome-icon>
                  Edit
                </b-button>
            </b-col>
            <b-col
              class="mt-1 mt-sm-0"
              v-if="mode==='edit'"
              cols="12"
              sm="2">
                <b-button
                  @click="changeMode"
                  variant="outline-success"
                  block>
                  <font-awesome-icon icon="eye"></font-awesome-icon>
                  View
                </b-button>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="12" class="toDoc">
              <h3 id="project-title">{{project.name}}</h3>
            </b-col>
            <b-col cols="12" sm="6" class="toDoc">
              <p v-if="project.description">{{project.description}}</p>
              <h5>Review question</h5>
              <p>{{project.review_question}}</p>
            </b-col>
            <b-col cols="12" sm="6" class="toDoc">
              <h5 v-if="Object.prototype.hasOwnProperty.call(project, 'authors')">Authors of the review</h5>
              <ul v-if="Object.prototype.hasOwnProperty.call(project, 'authors')">
                <li v-for="(author, index) in project.authors.split(',')" :key="index">{{ author.trim() }}</li>
              </ul>

              <h5>Has the review been published</h5>
              <p>{{(project.published_status) ? 'Yes': 'No'}} <span v-if="project.published_status">| DOI: <b-link :href="project.url_doi" target="_blank">{{ project.url_doi }}</b-link></span></p>

              <h5>Is the iSoQf being completed by the review authors?</h5>
              <p>{{(project.complete_by_author) ? 'Yes' : 'No'}}</p>
            </b-col>
          </b-row>
          <b-row>
            <b-col
              v-if="mode==='edit'"
              cols="12"
              class="my-2">
              <b-card
                bg-variant="light">
                <b-row>
                  <b-col
                    cols="12">
                    <b-form-group>
                      <b-input-group>
                        <b-form-input
                          v-model="table_settings.filter"
                          type="search"
                          id="filterInput"
                          placeholder="Type to Search"></b-form-input>
                        <b-input-group-append>
                          <b-button :disabled="!table_settings.filter" @click="table_settings.filter = null">Clear</b-button>
                        </b-input-group-append>
                      </b-input-group>
                    </b-form-group>
                  </b-col>
                </b-row>
                <b-row
                  align-h="end">
                  <b-col
                    class="mt-2 mt-sm-0"
                    cols="12"
                    sm="4">
                    <b-button
                      variant="outline-primary"
                      block
                      @click="openModalReferencesSingle">
                      Import references
                    </b-button>
                  </b-col>
                  <b-col
                    class="mt-2 mt-sm-0"
                    cols="12"
                    sm="4">
                    <b-button
                      v-b-tooltip.hover title="Copy and paste one synthesised review finding at a time into the iSoQf"
                      variant="outline-primary"
                      @click="modalAddSummarized"
                      block>
                      Add finding
                    </b-button>
                  </b-col>
                </b-row>
              </b-card>
            </b-col>
            <b-col cols="12">
              <b-table
                v-if="mode==='edit'"
                responsive
                id="findings"
                ref="findings"
                :fields="fields"
                :items="lists"
                empty-text="There are no findings to show"
                show-empty
                :busy="table_settings.isBusy"
                :current-page="table_settings.currentPage"
                :per-page="table_settings.perPage"
                :filter="table_settings.filter"
                @filtered="onFiltered"
                :filter-included-fields="['isoqf_id', 'name', 'cerqual_option', 'cerqual_explanation', 'ref_list']"
              >
                <template v-slot:head(isoqf_id)="data">
                  <span v-b-tooltip.hover title="Automatic numbering of synthesised review findings">{{ data.label }}</span>
                </template>
                <template v-slot:head(name)="data">
                  <span v-b-tooltip.hover title="Synthesised review findings produced by the review team">{{ data.label }}</span>
                </template>
                <template v-slot:head(confidence)="data">
                  <span v-b-tooltip.hover title="Assessment of the extent to which a review finding is a reasonable representation of the phenomenon of interest">{{ data.label }}</span>
                </template>
                <template v-slot:head(cerqual_explanation)="data">
                  <span v-b-tooltip.hover title="Statement explaining concerns with any of the CERQual components that justifies the level of confidence chosen">{{ data.label }}</span>
                </template>
                <template v-slot:head(references)="data">
                  <span v-b-tooltip.hover title="Studies that contribute to each review finding">{{ data.label }}</span>
                </template>
                <template v-slot:cell(isoqf_id)="data">
                  {{ data.item.isoqf_id }}
                </template>
                <template v-slot:cell(name)="data">
                  <b-link :to="{name: 'editList', params: {id: data.item.id}}">{{ data.item.name }}</b-link>
                </template>
                <template v-slot:cell(cerqual_option)="data">
                  {{ data.item.cerqual_option }}
                  <b-button
                    block
                    variant="outline-info"
                    :to="{name: 'editList', params: {id: data.item.id}}">
                      <span v-if="data.item.cerqual_option===''">Complete</span>
                      <span v-if="data.item.cerqual_option!=''">Edit</span>
                      CERQual Assessment
                    </b-button>
                </template>
                <template v-slot:cell(cerqual_explanation)="data">
                  {{ data.item.cerqual_explanation }}
                  <b-button
                    block
                    variant="outline-info"
                    :to="{name: 'editList', params: {id: data.item.id}}">
                      <span v-if="data.item.cerqual_explanation===''">Complete</span>
                      <span v-if="data.item.cerqual_explanation!=''">Edit</span>
                      CERQual Assessment
                  </b-button>
                </template>
                <template v-slot:cell(ref_list)="data">
                  {{ data.item.ref_list }}
                </template>
                <template v-slot:cell(actions)="data">
                  <font-awesome-icon icon="highlighter"
                    @click="openModalReferences(data.item.isoqf_id)"
                    v-b-tooltip.hover
                    title="Select the references that contribute to this review finding"></font-awesome-icon>
                </template>
                <template v-slot:table-busy>
                  <div class="text-center text-danger my-2">
                    <b-spinner class="align-middle"></b-spinner>
                    <strong>Loading...</strong>
                  </div>
                </template>
              </b-table>
              <b-table
                v-if="mode==='view'"
                class="toDoc"
                responsive
                id="findings"
                ref="findings"
                :fields="fields"
                :items="lists"
                empty-text="There are no findings to show"
                show-empty
                :busy="table_settings.isBusy"
                :current-page="table_settings.currentPage"
                :per-page="table_settings.perPage"
                :filter="table_settings.filter"
                @filtered="onFiltered"
                :filter-included-fields="['isoqf_id', 'name', 'cerqual_option', 'cerqual_explanation', 'ref_list']"
              >
                <template v-slot:cell(name)="data">
                  {{ data.item.name.replace(/’/g, "'") }}
                </template>
                <template v-slot:table-busy>
                  <div class="text-center text-danger my-2">
                    <b-spinner class="align-middle"></b-spinner>
                    <strong>Loading...</strong>
                  </div>
                </template>
              </b-table>
              <b-pagination
                v-if="mode==='edit'"
                v-model="table_settings.currentPage"
                :total-rows="lists.length"
                :per-page="table_settings.perPage"
                aria-controls="findings"
                align="center"></b-pagination>
              <b-modal
                id="add-summarized"
                ref="add-summarized"
                title="Summarized review finding"
                @ok="saveSummarized">
                <b-form-group
                  label="Summarized review"
                  label-for="summarized-review">
                  <b-form-input
                    id="summarized-review"
                    v-model="summarized_review"></b-form-input>
                </b-form-group>
                </b-modal>
              <b-modal
                id="modal-references"
                ref="modal-references"
                title="Add references"
                @ok="getProject"
                scrollable>
                <div class="mt-2">
                  <b-form-group
                    label="Load references"
                    label-for="input-ris-file">
                    <b-form-file
                      id="input-ris-file"
                      plain
                      @change="loadRefs($event)"></b-form-file>
                    <b-button
                      class="mt-2"
                      @click="saveReferences">
                        Upload
                    </b-button>
                  </b-form-group>
                </div>
                <div>
                  <b-alert
                    v-if="msgUploadReferences"
                    show
                    variant="info"
                    dismissible
                    @dismissed="msgUploadReferences=''">{{ msgUploadReferences }}</b-alert>
                </div>
                <div
                  class="mt-2"
                  v-if="references.length">
                  <p>Below are the references you have uploaded.</p>
                  <b-table
                    head-variant="light"
                    hover
                    bordered
                    borderless
                    :fields="fields_references_table"
                    :items="references">
                    <template v-slot:cell(action)="data">
                      <font-awesome-icon
                        icon="trash"
                        @click="data.toggleDetails"></font-awesome-icon>
                    </template>
                    <template v-slot:row-details="data">
                      <b-card>
                        <p>Are you sure you want to delete this reference?</p>
                        <b-button
                          block
                          variant="outline-success"
                          @click="data.toggleDetails">No</b-button>
                        <b-button
                          block
                          variant="outline-danger"
                          @click="confirmRemoveReferenceById(data.item.id)">Yes</b-button>
                      </b-card>
                    </template>
                  </b-table>
                </div>
              </b-modal>
              <b-modal
                id="modal-references-list"
                ref="modal-references-list"
                title="Select references"
                @ok="saveReferencesList"
                size="lg"
                scrollable>
                <div
                  class="mt-2"
                  v-if="references.length">
                  <b-form-group>
                    <b-form-checkbox
                      v-for="ref in references"
                      v-model="selected_references"
                      :key="ref.id"
                      :value="ref.id"
                      name="references">
                      {{ getDataDisplayRef(ref) }}
                    </b-form-checkbox>
                  </b-form-group>
                </div>
                <div
                  class="mt-2"
                  v-if="references.length === 0">
                  <p>To select references, first upload your full reference list by clicking "Import References" next to the search bar.</p>
                </div>
              </b-modal>
            </b-col>
          </b-row>
        </b-tab>
        <b-tab title="Key information" active>
          <b-row>
            <b-col
              cols="12">
              <h3>Key information on Included Studies</h3>
              <p>To optimize the functionality of iSoQf and save you time please add the following information. You first need to upload your reference list of included studies before moving on to characteristics of studies and methodological assessment tables. All of these files are needed in order to apply the CERQual approach and by including them here the relevant information will be automatically extracted where needed in the evidence profiles saving you time and reducing potential errors.</p>
            </b-col>
            <b-col
              cols="12">
              <h6>References for included Studies</h6>
              <p>You must import only the references for your final list of included studies </p>
              <b-alert
                v-if="msgUploadReferences"
                show
                variant="info"
                dismissible
                class="my-2"
                @dismissed="msgUploadReferences=''">{{ msgUploadReferences }}</b-alert>
              <b-form-file
                id="input-ris-file-key"
                plain
                @change="loadRefs($event)"></b-form-file>
              <b-button
                class="mt-2"
                @click="saveReferences">
                  Upload
              </b-button>
            </b-col>
            <b-col
              cols="12"
              class="mt-3">
              <h6>Characteristics of Studies table</h6>
              <b-button
                v-if="this.charsOfStudies.fields.length <= 3"
                @click="openModalCharsOfStudies"
                :disabled="(this.references.length) ? false : true">
                Create table
              </b-button>
              <b-button
                v-if="this.charsOfStudies.fields.length > 3"
                @click="openModalCharsOfStudiesEdit">
                Edit table
              </b-button>
              <b-button
                :disabled="(this.references.length) ? false : true">
                Import table
              </b-button>

              <b-table
                :fields="charsOfStudies.fields"
                :items="charsOfStudies.items"
                class="mt-3">
                <template
                  v-slot:cell(actions)="data">
                  <font-awesome-icon
                    @click="addDataCharsOfStudies(data.index)"
                    icon="edit"></font-awesome-icon>
                </template>
              </b-table>

              <b-modal
                id="open-char-of-studies-table-modal"
                ref="open-char-of-studies-table-modal"
                scrollable
                title="Columns header"
                @ok="saveCharacteristicsStudiesFields">
                  <b-form-group
                    label="Nro of columnns">
                    <b-form-input
                      id="nro-columns"
                      v-model="charsOfStudiesFieldsModal.nroColumns"
                      type="number" min="1" max="10"></b-form-input>
                  </b-form-group>
                  <b-form-group
                    v-for="cnt in parseInt(charsOfStudiesFieldsModal.nroColumns)"
                    :key="cnt"
                    :label="`Columnn #${cnt}`">
                    <b-input-group>
                      <b-form-input
                        :id="`column_${cnt}`"
                        v-model="charsOfStudiesFieldsModal.fields[cnt - 1]"
                        type="text"></b-form-input>
                      <b-input-group-append
                        v-if="charsOfStudies.id">
                        <b-button
                          @click="deleteFieldFromCharsSudies(cnt - 1)">
                          Del {{ cnt - 1 }}
                        </b-button>
                      </b-input-group-append>
                    </b-input-group>
                  </b-form-group>
              </b-modal>
              <b-modal
                id="open-char-of-studies-table-modal-edit"
                ref="open-char-of-studies-table-modal-edit"
                scrollable
                title="Edit Columns header"
                @ok="updateCharacteristicsStudiesFields">
                  <b-form-group
                    v-for="cnt in parseInt(charsOfStudiesFieldsModalEdit.nroColumns)"
                    :key="cnt"
                    :label="`Columnn #${cnt}`">
                    <b-input-group
                      v-if="charsOfStudiesFieldsModalEdit.fields.length">
                      <b-form-input
                        :id="`column_${cnt}`"
                        v-model="charsOfStudiesFieldsModalEdit.fields[cnt - 1].label"
                        type="text"></b-form-input>
                      <b-input-group-append
                        v-if="charsOfStudiesFieldsModalEdit.fields.length > 1">
                        <b-button
                          variant="outline-danger"
                          @click="deleteFieldFromCharsSudiesEdit(cnt - 1)">
                          <font-awesome-icon
                            icon="trash"></font-awesome-icon>
                        </b-button>
                      </b-input-group-append>
                    </b-input-group>
                  </b-form-group>
                  <b-button
                    class="mb-2"
                    @click="charsOfStudiesNewColumn"
                    variant="outline-success">
                    Add new column
                  </b-button>
              </b-modal>
              <b-modal
                ref="edit-chars-of-studies-data"
                title="Edit data"
                scrollable
                @ok="saveDataCharsOfStudies">
                <b-form-group
                  v-for="field of charsOfStudies.fields"
                  :key="field.id"
                  :label="field.label">
                  <b-form-input
                    v-if="field.key !== 'actions'"
                    :disabled="(field.key === 'ref_id' || field.key === 'authors') ? true : false"
                    v-model="charsOfStudiesFieldsModal.items[charsOfStudiesFieldsModal.selected_item_index][field.key]"></b-form-input>
                </b-form-group>
              </b-modal>
            </b-col>
            <b-col
              cols="12"
              class="mt-3">
              <h6>Methodological Assessments table</h6>
              <b-button
                :disabled="(this.references.length) ? false : true">
                Create table
              </b-button>
              <b-button
                :disabled="(this.references.length) ? false : true">
                Import table
              </b-button>
            </b-col>
          </b-row>
        </b-tab>
      </b-tabs>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data () {
    return {
      project: {
        name: '',
        authors: ''
      },
      lists: [],
      fields: [
        {
          key: 'isoqf_id',
          label: '#'
        },
        {
          key: 'name',
          label: 'Summarized review finding'
        },
        {
          key: 'cerqual_option',
          label: 'CERQual Assessment of confidence'
        },
        {
          key: 'cerqual_explanation',
          label: 'Explanation of CERQual Assessment'
        },
        {
          key: 'ref_list',
          label: 'References'
        },
        {
          key: 'actions',
          label: ''
        }
      ],
      table_settings: {
        isBusy: true,
        currentPage: 1,
        perPage: 5,
        filter: null,
        totalRows: 1
      },
      summarized_review: '',
      select_options: [
        { value: 0, text: 'No/Minor concerns' },
        { value: 1, text: 'Minor concerns' },
        { value: 2, text: 'Moderated concerns' },
        { value: 3, text: 'Serious concerns' }
      ],
      cerqual_confidence: [
        { value: 0, text: 'High confidence' },
        { value: 1, text: 'Moderate confidence' },
        { value: 2, text: 'Low confidence' },
        { value: 3, text: 'Very low confidence' }
      ],
      pre_references: '',
      references: [],
      fileReferences: [],
      fields_references_table:
        [
          {
            key: 'authors',
            label: 'Authors',
            formatter: value => {
              if (value.length === 1) {
                return value[0]
              } else if (value.length < 3) {
                return value[0] + ', ' + value[1]
              } else {
                return value[0] + ' et al.'
              }
            }
          },
          { key: 'publication_year', label: 'Year' },
          {
            key: 'id',
            label: 'Related to finding(s)',
            formatter: value => {
              let findings = []
              for (let list of this.lists) {
                for (let ref of list.raw_ref) {
                  if (ref.id === value) {
                    findings.push(`#${list.isoqf_id}`)
                  }
                }
              }
              return findings.join(', ')
            }
          },
          { key: 'action', label: '' }
        ],
      selected_list_index: null,
      selected_references: [],
      lastId: 1,
      mode: 'edit',
      msgUploadReferences: '',
      charsOfStudiesFieldsModal: {
        nroColumns: 1,
        fields: [],
        items: [],
        selected_item_index: 0
      },
      charsOfStudiesFieldsModalEdit: {
        nroColumns: 1,
        fields: []
      },
      charsOfStudies: {
        fields: [],
        items: [],
        authors: ''
      },
      tabOpened: 2,
      global_status: [
        { value: false, text: 'public' },
        { value: true, text: 'private' }
      ],
      yes_or_no: [
        { value: false, text: 'no' },
        { value: true, text: 'yes' }
      ]
    }
  },
  mounted () {
    this.openModalReferencesSingle(false)
    this.getProject()
  },
  watch: {
    pre_references: function (data) {
      this.fileReferences = []
      const file = data
      const allLines = file.split(/\r\n|\n/)
      // Reading line by line
      const titleTags = ['TI', 'T1', 'T2', 'T3']
      const authorTags = ['AU', 'A1', 'A2', 'A3', 'A4']
      const userDefinable = ['U1', 'U2', 'U3', 'U4', 'U5']
      let base = { authors: [], user_definable: [] }

      allLines.forEach((line) => {
        const key = line.split('  - ')[0]
        const content = line.split('  - ')[1]

        if (key === 'TY') {
          base['type'] = content
        }
        if (titleTags.includes(key)) {
          base['title'] = content
        }
        if (authorTags.includes(key)) {
          base['authors'].push(content)
        }
        if (key === 'AB') {
          base['abstract'] = content
        }
        if (key === 'VL') {
          base['volume_number'] = content
        }
        if (key === 'SP') {
          base['start_page'] = content
        }
        if (key === 'EP') {
          base['end_page'] = content
        }
        if (key === 'IN') {
          base['issue_number'] = content
        }
        if (key === 'SN') {
          base['isbn_issn'] = content
        }
        if (key === 'PY') {
          base['publication_year'] = content
        }
        if (key === 'DA') {
          base['date'] = content
        }
        if (key === 'DA') {
          base['date'] = content
        }
        if (key === 'DB') {
          base['database'] = content
        }
        if (key === 'UR') {
          base['url'] = content
        }
        if (key === 'DO') {
          base['doi'] = content
        }
        if (userDefinable.includes(key)) {
          base['user_definable'].push(content)
        }
        if (key === 'ER') {
          this.fileReferences.push(base)
          base = { authors: [], user_definable: [] }
        }
      })
    }
  },
  methods: {
    changeMode: function () {
      this.mode = (this.mode === 'edit') ? 'view' : 'edit'
      if (this.mode === 'view') {
        this.table_settings.perPage = this.lists.length
        this.table_settings.currentPage = 1
      } else {
        this.table_settings.perPage = 5
      }
    },
    parseReference: (reference, onlyAuthors = false) => {
      let result = ''
      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        if (reference.authors.length === 1) {
          result = reference.authors[0] + ', ' + reference.publication_year + '; '
        } else if (reference.authors.length < 3) {
          result = reference.authors[0] + ', ' + reference.authors[1] + ', ' + reference.publication_year + '; '
        } else {
          result = reference.authors[0] + ' et al., ' + reference.publication_year + '; '
        }
        if (!onlyAuthors) {
          result = result + reference.title
        }
        return result
      } else {
        return result
      }
    },
    displayReferences: function (value, key, references) {
      let _references = []
      for (let reference of value) {
        let obj = this.references.find(o => o.id === reference)
        let ref = this.parseReference(obj)
        _references.push(ref)
      }
      if (_references.length) {
        let result = ''
        for (let ref of _references) {
          result = result + ref + '\r\n'
        }
        return result
      }
      // return _references
    },
    getDataDisplayRef: function (reference) {
      return this.parseReference(reference)
    },
    getConfidence: function (value, key, item) {
      if (Object.prototype.hasOwnProperty.call(item, 'cerqual')) {
        if (Object.prototype.hasOwnProperty.call(item.cerqual, 'option') && item.cerqual.option != null) {
          return this.cerqual_confidence[item.cerqual.option].text
        }
      }
      return ''
    },
    loadRefs: function (event) {
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        this.pre_references = e.target.result
      }
      reader.readAsText(file)
    },
    saveReferences: function () {
      const references = this.fileReferences
      let axiosArray = []
      for (let ref of references) {
        ref.organization = this.$route.params.org_id
        ref.project_id = this.$route.params.id
        let newPromise = axios({
          method: 'POST',
          url: `/api/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`,
          data: ref
        })
        axiosArray.push(newPromise)
      }
      axios.all(axiosArray)
        .then(axios.spread((...responses) => {
          var cnt = 0
          responses.forEach(res => {
            if (this.references.push(res.data)) {
              cnt++
            }
          })
          this.msgUploadReferences = `${cnt} references have been added.`
          this.pre_references = ''
          this.fileReferences = []
        }))
        .catch((error) => {
          console.log('error', error)
        })
    },
    getProject: function () {
      const params = {
        organization: this.$route.params.org_id
      }
      axios.get(`/api/isoqf_projects/${this.$route.params.id}`, { params })
        .then((response) => {
          this.project = response.data
          this.getLists() // summary review
          this.getCharacteristics()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    getLists: function () { // related to summary review of a finding
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get('/api/isoqf_lists', { params })
        .then((response) => {
          this.lists = JSON.parse(JSON.stringify(response.data))
          if (this.lists.length) {
            let lists = JSON.parse(JSON.stringify(this.lists))
            this.lastId = parseInt(lists.splice(lists.length - 1, 1)[0].isoqf_id) + 1
            for (let list of this.lists) {
              if (!Object.prototype.hasOwnProperty.call(list, 'references')) {
                list.references = []
              }
              list.cerqual_option = ''
              if (list.cerqual.option != null) {
                list.cerqual_option = this.cerqual_confidence[list.cerqual.option].text
              }
              list.cerqual_explanation = list.cerqual.explanation
              list.ref_list = ''
              list.raw_ref = []
              for (let r of this.references) {
                for (let ref of list.references) {
                  if (ref === r.id) {
                    list.ref_list = list.ref_list + this.parseReference(r, true)
                    list.raw_ref.push(r)
                  }
                }
              }
            }
          }
          this.table_settings.isBusy = false
          this.table_settings.totalRows = this.lists.length
        })
        .catch((error) => {
          console.log(error)
        })
    },
    modalAddSummarized: function () {
      this.$refs['add-summarized'].show()
    },
    saveSummarized: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id,
        name: this.summarized_review,
        isoqf_id: this.lastId,
        cerqual: { option: null, explanation: '' },
        references: []
      }
      axios.post('/api/isoqf_lists/', params)
        .then((response) => {
          const listId = response.data.id
          const listName = response.data.name

          this.getLists()
          this.createFinding(listId, listName)
          this.summarized_review = ''
        })
        .catch((error) => {
          console.log(error)
        })
    },
    createFinding: function (listId, listName) {
      const params = {
        organization: this.$route.params.org_id,
        list_id: listId,
        name: listName,
        isoqf_id: this.lastId,
        evidence_profile: {
          name: listName,
          isoqf_id: this.lastId,
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
          }
        },
        references: []
      }
      axios.post('/api/isoqf_findings', params)
        .then((response) => {
          this.lastId = this.lastId + 1
          // console.log(response)
        })
        .catch((error) => {
          console.log(error)
        })
    },
    openModalReferencesSingle: function (showModal) {
      axios.get(`/api/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`)
        .then((response) => {
          this.references = response.data
          if (showModal) {
            this.msgUploadReferences = ''
            this.$refs['modal-references'].show()
          }
          if (!this.references.length) {
            // change for a tab
            // this.$bvModal.show('pre-load-refs')
          }
        })
        .catch((error) => {
          console.log(error)
        })
    },
    openModalReferences: function (isoqfId) {
      let cnt = 0
      for (let list of this.lists) {
        if (list.isoqf_id === isoqfId) {
          this.selected_list_index = cnt
        }
        cnt++
      }
      axios.get(`/api/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`)
        .then((response) => {
          this.references = response.data
          this.selected_references = this.lists[this.selected_list_index].references
          this.$refs['modal-references-list'].show()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    saveReferencesList: function () {
      this.table_settings.isBusy = true
      const params = {
        references: this.selected_references
      }
      axios.patch(`/api/isoqf_lists/${this.lists[this.selected_list_index].id}`, params)
        .then((response) => {
          this.selected_references = []
          this.selected_list_index = null
          this.getLists()
        })
    },
    onFiltered (filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.table_settings.totalRows = filteredItems.length
      this.table_settings.currentPage = 1
    },
    Export2Doc (element, filename = '') {
      const preHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>' + filename + '</title></head><body>'
      const postHtml = '</body></html>'

      let objs = document.getElementsByClassName(element)
      let content = ''
      for (let o of objs) {
        content = content + o.innerHTML + ' '
      }

      var html = preHtml + content + postHtml

      const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
      })

      // Specify link url
      var url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html)

      // Specify file name
      filename = filename ? filename + '.doc' : 'document.doc'

      // Create download link element
      var downloadLink = document.createElement('a')

      document.body.appendChild(downloadLink)

      if (navigator.msSaveOrOpenBlob) {
        navigator.msSaveOrOpenBlob(blob, filename)
      } else {
        downloadLink.href = url
        downloadLink.download = filename
        downloadLink.click()
      }

      document.body.removeChild(downloadLink)
    },
    generateAndDownload: function () {
      let element = document.getElementsByTagName('tbody')
      var nroElements = element[0].children.length
      var icon = (element[0].children[0].children.length > 1) ? JSON.parse(JSON.stringify(element[0].children[0].children[5].innerHTML)) : ''
      let title = document.getElementById('project-title').innerHTML

      var cnt = 0
      while (cnt < nroElements) {
        if (element[0].children.length > 1) {
          element[0].children[cnt].children[5].innerHTML = ''
        }
        cnt++
      }

      this.Export2Doc('toDoc', title)

      cnt = 0
      while (cnt < nroElements) {
        if (element[0].children.length > 1) {
          element[0].children[cnt].children[5].innerHTML = icon
        }
        cnt++
      }
    },
    processRIS: function (reference = {}) {
      let txt = ''

      if (Object.prototype.hasOwnProperty.call(reference, 'type')) {
        txt += 'TY  - ' + reference.type + '\r'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'abstract')) {
        txt += 'AB  - ' + reference.abstract + '\r'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'title')) {
        txt += 'TI  - ' + reference.title + '\r'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        var cnt = 1
        for (let a of reference.authors) {
          txt += `A${cnt} - ` + a + '\r'
          cnt++
        }
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'publication_year')) {
        txt += 'PY  - ' + reference.publication_year + '\r'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'database')) {
        txt += 'DB  - ' + reference.database + '\r'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'volume_number')) {
        txt += 'VL  - ' + reference.volume_number + '\r'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'url')) {
        txt += 'UR  - ' + reference.url + '\r'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'start_page')) {
        txt += 'SP  - ' + reference.start_page + '\r'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'isbn_issn')) {
        txt += 'SN  - ' + reference.isbn_issn + '\r'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'date')) {
        txt += 'DA  - ' + reference.date + '\r'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'user_definable')) {
        var count = 1
        for (let c of reference.user_definable) {
          txt += `C${count} - ` + c + '\r'
          count++
        }
      }
      txt += 'ER  - \n\r'
      return txt
    },
    exportToRIS: function () {
      let lists = JSON.parse(JSON.stringify(this.lists))
      var content = ''
      for (let l of lists) {
        for (let r of l.raw_ref) {
          content += this.processRIS(r)
        }
      }

      var element = document.createElement('a')
      element.setAttribute('href', 'data:text/text;charset=utf-8,' + encodeURI(content))
      element.setAttribute('download', 'references.ris')
      element.click()
    },
    confirmRemoveReferenceById: function (refId) {
      let lists = JSON.parse(JSON.stringify(this.lists))
      let objs = []

      for (let list of lists) {
        let obj = {id: null, references: []}
        for (let rr of list.raw_ref) {
          if (rr.id !== refId) {
            obj.references.push(rr.id)
          }
          if (rr.id === refId) {
            obj.id = list.id
            objs.push(obj)
          }
        }
      }
      let requests = []
      for (let o of objs) {
        requests.push(axios.patch(`/api/isoqf_lists/${o.id}`, {references: o.references}))
      }
      if (requests.length) {
        axios.all(requests)
          .then(axios.spread((response) => {
            //
          }))
      }

      axios.delete(`/api/isoqf_references/${refId}`)
        .then((response) => {
          this.openModalReferencesSingle(false)
        })
    },
    printiSoQf: function () {
      window.print()
    },
    getAuthorsFormat: function (authors = [], pubYear = '') {
      if (authors.length) {
        const nroAuthors = authors.length
        if (nroAuthors === 1) {
          return authors[0] + ', ' + pubYear
        } else if (nroAuthors === 2) {
          return authors[0] + ', ' + authors[1] + ', ' + pubYear
        } else {
          return authors[0] + ' et al., ' + ' ' + pubYear
        }
      } else {
        return ''
      }
    },
    deleteFieldFromCharsSudies: function (index) {
      let fields = JSON.parse(JSON.stringify(this.charsOfStudiesFieldsModal.fields))
      let params = {}
      params.fields = [{'key': 'ref_id', 'label': 'Reference ID'}, {'key': 'authors', 'label': 'Author(s)'}]

      fields.splice(index, 1)

      for (let cnt in fields) {
        let objField = {}
        objField.key = 'column_' + cnt
        objField.label = fields[cnt]
        params.fields.push(objField)
      }

      axios.patch(`/api/isoqf_characteristics/${this.charsOfStudies.id}`, params)
        .then((response) => {
          this.getProject()
        }).catch((error) => {
          console.log('error: ', error)
        })
    },
    deleteFieldFromCharsSudiesEdit: function (index) {
      let params = {}
      const _fields = JSON.parse(JSON.stringify(this.charsOfStudiesFieldsModalEdit.fields))
      const _items = JSON.parse(JSON.stringify(this.charsOfStudies.items))

      let removedField = _fields.splice(index, 1)[0]

      _fields.splice(0, 0, { 'key': 'ref_id', 'label': 'Reference ID' })
      _fields.splice(1, 0, { 'key': 'authors', 'label': 'Author' })

      for (let item of _items) {
        if (Object.prototype.hasOwnProperty.call(item, removedField.key)) {
          delete item[removedField.key]
        }
      }

      params.fields = _fields
      params.items = _items

      axios.patch(`/api/isoqf_characteristics/${this.charsOfStudies.id}`, params)
        .then((response) => {
          let _fields = JSON.parse(JSON.stringify(response.data['$set'].fields))
          const excluded = ['ref_id', 'authors', 'actions']
          let editFields = []
          for (let field of _fields) {
            if (!excluded.includes(field.key)) {
              editFields.push(field)
            }
          }

          this.charsOfStudiesFieldsModalEdit.fields = editFields
          this.charsOfStudiesFieldsModalEdit.nroColumns = editFields.length
          this.getProject()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    openModalCharsOfStudies: function () {
      let fields = JSON.parse(JSON.stringify(this.charsOfStudies.fields))
      let editFields = []
      const excluded = ['ref_id', 'authors', 'actions']
      for (let field of fields) {
        if (!excluded.includes(field.key)) {
          editFields.push(field.label)
        }
      }
      this.charsOfStudiesFieldsModal.fields = editFields
      this.$refs['open-char-of-studies-table-modal'].show()
    },
    openModalCharsOfStudiesEdit: function () {
      let _fields = JSON.parse(JSON.stringify(this.charsOfStudies.fields))
      let fields = []
      const excluded = ['ref_id', 'authors', 'actions']
      for (let field of _fields) {
        if (!excluded.includes(field.key)) {
          fields.push(field)
        }
      }

      this.charsOfStudiesFieldsModalEdit.fields = fields
      this.charsOfStudiesFieldsModalEdit.nroColumns = fields.length
      this.$refs['open-char-of-studies-table-modal-edit'].show()
    },
    charsOfStudiesNewColumn: function () {
      let _fields = JSON.parse(JSON.stringify(this.charsOfStudiesFieldsModalEdit.fields))
      let fields = []
      let column = '0'
      const excluded = ['ref_id', 'authors', 'actions']
      for (let field of _fields) {
        if (!excluded.includes(field.key)) {
          fields.push(field)
        }
      }

      this.charsOfStudiesFieldsModalEdit.nroColumns = fields.length + 1
      column = parseInt(this.charsOfStudiesFieldsModalEdit.fields[ fields.length - 1 ].key.split('_')[1]) + 1
      this.charsOfStudiesFieldsModalEdit.fields.push({'key': 'column_' + column.toString(), 'label': ''})
    },
    saveCharacteristicsStudiesFields: function () {
      let fields = JSON.parse(JSON.stringify(this.charsOfStudiesFieldsModal.fields))
      let references = JSON.parse(JSON.stringify(this.references))
      let params = {}
      params.fields = [{'key': 'ref_id', 'label': 'Reference ID'}, {'key': 'authors', 'label': 'Author(s)'}]
      params.items = []

      for (let cnt in fields) {
        let objField = {}
        objField.key = 'column_' + cnt
        objField.label = fields[cnt]
        params.fields.push(objField)
      }
      params.organization = this.$route.params.org_id
      params.project_id = this.$route.params.id
      params.nro_of_fields = fields.length

      for (let r of references) {
        let objItem = {}
        for (let cnt in fields) {
          objItem['column_' + cnt] = ''
        }
        objItem.ref_id = r.id
        objItem.authors = this.getAuthorsFormat(r.authors, r.publication_year)
        params.items.push(objItem)
      }

      if (Object.prototype.hasOwnProperty.call(this.charsOfStudies, 'id')) {
        axios.patch(`/api/isoqf_characteristics/${this.charsOfStudies.id}`, params)
          .then((response) => {
            console.log(response.data)
            this.getProject()
          }).catch((error) => {
            console.log('error: ', error)
          })
      } else {
        axios.post('/api/isoqf_characteristics', params)
          .then((response) => {
            // this.charsOfStudies = response.data
            this.getProject()
          })
          .catch((error) => {
            console.log(error)
          })
      }
    },
    updateCharacteristicsStudiesFields: function () {
      let params = {}
      let fields = JSON.parse(JSON.stringify(this.charsOfStudiesFieldsModalEdit.fields))

      fields.splice(0, 0, { 'key': 'ref_id', 'label': 'Reference ID' })
      fields.splice(1, 0, { 'key': 'authors', 'label': 'Author' })

      params.fields = fields

      let _items = JSON.parse(JSON.stringify(this.charsOfStudies.items))

      for (let item of _items) {
        for (let field of fields) {
          if (!Object.prototype.hasOwnProperty.call(item, field.key)) {
            delete item[field.key]
          }
        }
      }

      axios.patch(`/api/isoqf_characteristics/${this.charsOfStudies.id}`, params)
        .then((response) => {
          this.getProject()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    getCharacteristics: function () {
      axios.get(`/api/isoqf_characteristics?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`)
        .then((response) => {
          if (response.data.length) {
            this.charsOfStudies = response.data[0]
            this.charsOfStudies.fields.push({'key': 'actions', 'label': ''})
            if (Object.prototype.hasOwnProperty.call(this.charsOfStudies, 'fields')) {
              const fields = JSON.parse(JSON.stringify(this.charsOfStudies.fields))
              const items = JSON.parse(JSON.stringify(this.charsOfStudies.items))

              this.charsOfStudiesFieldsModal.nroColumns = fields.length - 3
              this.charsOfStudiesFieldsModal.fields = []
              for (let f of fields) {
                if (f.key !== 'ref_id' && f.key !== 'authors') {
                  this.charsOfStudiesFieldsModal.fields.push(f.label)
                }
              }

              for (let item of items) {
                this.charsOfStudiesFieldsModal.items.push(item)
              }
            }
            if (this.charsOfStudies.fields.length) {
              this.tabOpened = 1
            }
          }
        })
    },
    addDataCharsOfStudies: function (index = 0) {
      let items = JSON.parse(JSON.stringify(this.charsOfStudies.items))

      this.charsOfStudiesFieldsModal.items = items
      this.charsOfStudiesFieldsModal.selected_item_index = index
      this.$refs['edit-chars-of-studies-data'].show()
    },
    saveDataCharsOfStudies: function () {
      let params = {}
      let characteristicId = this.charsOfStudies.id
      params.items = this.charsOfStudiesFieldsModal.items

      axios.patch(`/api/isoqf_characteristics/${characteristicId}`, params)
        .then((response) => {
          this.getProject()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    updateProjectInfo: function () {
      let project = JSON.parse(JSON.stringify(this.project))
      axios.patch(`/api/isoqf_projects/${project.id}`, project)
        .then((response) => {
          this.getProject()
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }
}
</script>

<style scoped>
  div >>>
    #findings.table thead th {
      width: 15%;
    }
  div >>>
    #findings.table thead th:nth-child(2) {
      width: 45%;
    }
  div >>>
    #findings.table thead th:first-child {
      width: 5%;
    }
  div >>>
    #findings.table thead th:last-child {
      width: 5%;
    }
  div >>>
    #export-button button:first-child {
      width: 100%
    }
  div >>>
    #export-button ul {
      width: 100%
    }
  div >>>
    #findings.table tbody td li {
      font-size: 0.8rem;
      padding-top: 0.4rem;
      list-style-type: none;
    }
</style>
