<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="pt-5">
        <b-row align-h="end">
          <b-col
            class="text-right">
            <b-link :to="{ name: 'viewOrganization', params: { id: this.$store.state.user.personal_organization }}" class="d-print-none return">
              <font-awesome-icon icon="long-arrow-alt-left" title="return to My Workspace" />
              return to My Workspace
            </b-link>
          </b-col>
          <b-col
            cols="12" class="toDoc">
            <h2 id="project-title">{{ project.name }}</h2>
          </b-col>
        </b-row>
        <b-nav id="tabsTitle" tabs fill class="pt-5">
          <b-nav-item
            :active="(tabOpened === 0) ? true : false"
            @click="tabOpened=0">Project properties</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 1) ? true : false"
            @click="tabOpened=1">My Data</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 2) ? true : false"
            @click="tabOpened=2">iSoQ</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 3) ? true : false"
            @click="tabOpened=3">Guidance on applying GRADE-CERQual</b-nav-item>
        </b-nav>
      </b-container>
    </b-container>
    <b-container class="mb-5">
      <b-tabs
        id="tabsContent"
        content-class="mt-3"
        fill
        v-model="tabOpened">
        <b-tab>
          <projectProperties
            :project="project"
            :checkPermissions="checkPermissions()"
            @updateModificationTime="updateModificationTime"></projectProperties>
        </b-tab>
        <b-tab>
          <myData
            :checkPermissions="checkPermissions()"
            :references="references"
            :ui="ui"
            :project="project"
            :charsOfStudies="charsOfStudies"
            :charsOfStudiesFieldsModal="charsOfStudiesFieldsModal"
            :charsOfStudiesFieldsModalEdit="charsOfStudiesFieldsModalEdit"
            :importDataTable="importDataTable"
            :removeReferenceCharsOfStudies="removeReferenceCharsOfStudies"
            :methodologicalTableRefs="methodologicalTableRefs"
            :methodologicalFieldsModal="methodologicalFieldsModal"
            :methodologicalFieldsModalEdit="methodologicalFieldsModalEdit"
            :removeReferenceMethodological="removeReferenceMethodological"
            :lists="lists"
            :episte_response="episte_response"
            :loadReferences="loadReferences"
            @getReferences="getReferences"
            @updateMyDataTables="updateMyDataTables"
            @restoreEpisteResponse="restoreEpisteResponse"
            @changeLoadReferencesStatus="changeLoadReferencesStatus"
            @openModalReferencesSingle="openModalReferencesSingle"></myData>
        </b-tab>
        <b-tab
          :disabled="(references.length) ? false : true">
          <b-row>
            <b-col
              cols="12">
              <b-row
                class="d-print-none justify-content-end mb-2">
                <b-col
                  v-if="mode==='view'"
                  cols="12"
                  md="3"
                  xl="3">
                  <b-dropdown
                    id="export-button"
                    class="mt-1"
                    block
                    variant="outline-secondary"
                    right
                    text="Export">
                    <b-dropdown-item @click="ExportToWord(project.name)">to MS Word</b-dropdown-item>
                    <b-dropdown-item @click="exportToRIS">the references</b-dropdown-item>
                  </b-dropdown>
                </b-col>
                <b-col
                  v-if="mode==='view'"
                  cols="12"
                  md="3"
                  xl="3">
                    <b-button
                      class="mt-1"
                      variant="outline-info"
                      block
                      @click="printiSoQ">
                      Print or save as PDF
                    </b-button>
                </b-col>
                <b-col
                  v-if="mode==='view'"
                  cols="12"
                  md="3"
                  xl="3">
                    <b-button
                      class="mt-1"
                      @click="changeMode"
                      variant="primary"
                      block>
                      <font-awesome-icon icon="edit"></font-awesome-icon>
                      Edit
                    </b-button>
                </b-col>
                <b-col
                  v-if="mode==='edit'"
                  cols="12"
                  md="3"
                  xl="3">
                    <b-button
                      v-if="checkPermissions()"
                      class="mt-1"
                      @click="modalChangePublicStatus"
                      :variant="(!project.private) ? 'outline-primary' : 'primary'"
                      block
                      v-b-tooltip.hover title="Click here when you have finished your iSoQ to select what you would like published to the publicly available iSoQ database">
                      <span v-if="!project.private">Published</span><span v-else>Publish</span>
                    </b-button>
                </b-col>
                <b-col
                  v-if="mode==='edit'"
                  cols="12"
                  md="3"
                  xl="3">
                    <b-button
                      class="mt-1"
                      @click="changeMode"
                      variant="outline-success"
                      block
                      v-b-tooltip.hover title="Click to enter view mode where you can export or print">
                      Print or Export
                    </b-button>
                </b-col>
              </b-row>
            </b-col>
          </b-row>
          <b-row class="mb-3">
            <b-col cols="12" class="toDoc">
              <videoHelp :txt="(mode==='edit'?'Interactive ':'') + 'Summary of Qualitative Findings Table'" tag="h2" urlId="449743080"></videoHelp>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="12">
              <b-card header-tag="header">
                <template v-slot:header>
                  <b-container fluid>
                    <b-row v-b-toggle.info-project>
                      <b-col
                        cols="11">
                        <p
                        class="mb-0 text-left"
                        >See more information</p>
                      </b-col>
                      <b-col
                        cols="1"
                        align-self="end">
                        <p class="text-right">
                          {{ changeTxtProjectProperties }}
                        </p>
                      </b-col>
                    </b-row>
                  </b-container>
                </template>
                <b-collapse id="info-project">
                  <b-row>
                    <b-col cols="12" md="8" class="toDoc">
                      <h5>Review question</h5>
                      <p>{{project.review_question}}</p>

                      <h5>Has the review been published?</h5>
                      <p>{{(project.published_status) ? 'Yes': 'No'}} <span v-if="project.published_status">| DOI: <b-link :href="project.url_doi" target="_blank">{{ project.url_doi }}</b-link></span></p>

                      <h5 v-if="project.description">Additional Information</h5>
                      <p v-if="project.description">{{project.description}}</p>

                      <template v-if="project.public_type !== 'private'">
                        <h5>License</h5>
                        <p>{{ project.license_type }}</p>
                      </template>
                    </b-col>
                    <b-col cols="12" md="4" class="toDoc">
                      <h5 v-if="Object.prototype.hasOwnProperty.call(project, 'authors')">Authors of the review</h5>
                      <ul v-if="Object.prototype.hasOwnProperty.call(project, 'authors')">
                        <li v-for="(author, index) in project.authors.split(',')" :key="index">{{ author.trim() }}</li>
                      </ul>

                      <h5>Corresponding author</h5>
                      <p v-if="project.author">{{ project.author }} <span v-if="project.author_email"><br />{{ project.author_email }}</span></p>

                      <h5 v-if="!project.complete_by_author">Is the iSoQ being completed by the review authors?</h5>
                      <p v-if="!project.complete_by_author">{{(project.complete_by_author) ? 'Yes' : 'No'}}</p>
                    </b-col>
                  </b-row>
                </b-collapse>
              </b-card>
            </b-col>
          </b-row>
          <b-row
            class="mt-2">
            <b-col
              v-if="checkPermissions()"
              cols="12">
              <b-row
                class="mb-2">
                <b-col
                  v-if="mode!=='view'"
                  md="3"
                  cols="12">
                  <b-button
                    class="mt-1"
                    v-b-tooltip.hover title="Copy and paste one summarised review finding at a time into the iSoQ"
                    :variant="(lists.length) ? 'outline-success' : 'success'"
                    @click="modalAddList"
                    block>
                    Add review finding to the table
                  </b-button>
                </b-col>
                <b-col
                  v-if="mode!=='view'"
                  md="4"
                  cols="12">
                  <b-button
                    class="mt-1"
                    v-b-tooltip.hover title="If you want to organise your review findings into groups, for example by theme or topic, you can do so by creating review finding groups here."
                    variant="outline-secondary"
                    @click="modalListCategories"
                    block>
                    Organise review findings into groups
                  </b-button>
                </b-col>
                <b-col
                  v-if="mode!=='view' && lists.length > 1"
                  md="3"
                  cols="12">
                  <b-button
                    class="mt-1"
                    block
                    variant="outline-secondary"
                    @click="modalSortFindings">Re-order your review findings</b-button>

                  <b-modal
                    ref="modal-sort-findings"
                    id="modal-sort-findings"
                    size="xl"
                    ok-title="Save"
                    ok-variant="outline-success"
                    cancel-variant="outline-primary"
                    scrollable
                    @ok="saveSortedLists">
                    <template v-slot:modal-title>
                      <videoHelp txt="Re-order your review findings" tag="none" urlId="462176102"></videoHelp>
                    </template>
                    <p class="font-weight-light">
                      Drag and drop findings to re-order them in the iSoQ table
                    </p>
                    <b-list-group>
                      <draggable v-model="sorted_lists" group="columns" @start="drag=true" @end="drag=false">
                        <b-list-group-item
                          v-for="(item, index) of sorted_lists"
                          :key="index"
                          class="flex-column align-items-start"
                          style="cursor: move">
                          <div
                            class="d-flex w-100 justify-content-between">
                            <h5 class="mb-1">{{ item.name }}</h5>
                          </div>
                          <p class="font-weight-light">{{ getCategoryName(item.category) }} - <b>{{ item.cerqual_option }}</b></p>
                        </b-list-group-item>
                      </draggable>
                    </b-list-group>
                  </b-modal>
                </b-col>
                <b-col
                  v-if="mode!=='view' && lists.length > 1"
                  md="2"
                  cols="12">
                  <b-button
                    class="mt-1"
                    block
                    variant="outline-secondary"
                    @click="toggleSearch(ui.project.displaySearch)">Search</b-button>
                </b-col>
              </b-row>
            </b-col>
            <b-col
              v-if="mode==='edit' && this.lists.length && ui.project.displaySearch"
              cols="12"
              class="my-2 d-print-none">
              <b-card
                id="card-search"
                bg-variant="light">
                <b-row>
                  <b-col
                    cols="11">
                    <videoHelp txt="Search" tag="h4" urlId="462176356"></videoHelp>
                  </b-col>
                  <b-col
                    cols="1">
                    <b-button
                      class="close mb-1"
                      @click="toggleSearch(ui.project.displaySearch)">×</b-button>
                  </b-col>
                </b-row>
                <b-row>
                  <b-col
                    cols="12">
                    <b-form-group>
                      <b-input-group>
                        <b-form-input
                          v-model="table_settings.filter"
                          type="search"
                          id="filterInput"
                          placeholder="Type to search the text in the table below"></b-form-input>
                        <b-input-group-append>
                          <b-button :disabled="!table_settings.filter" @click="table_settings.filter = null">Clear</b-button>
                        </b-input-group-append>
                      </b-input-group>
                    </b-form-group>
                  </b-col>
                </b-row>

              </b-card>
            </b-col>
            <b-col cols="12" class="toDoc">
              <template
                v-if="mode==='edit' && checkPermissions()">
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
                  :busy="table_settings.isBusy"
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
                      @click="tableFilter(category.text, 1)">{{ category.text }}</b-dropdown-item>
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
                      <b-dropdown-item @click="tableFilter('hc', 2)">High confidence</b-dropdown-item>
                      <b-dropdown-item @click="tableFilter('mc', 2)">Moderate confidence</b-dropdown-item>
                      <b-dropdown-item @click="tableFilter('lc', 2)">Low confidence</b-dropdown-item>
                      <b-dropdown-item @click="tableFilter('vc', 2)">Very low confidence</b-dropdown-item>
                      <b-dropdown-divider></b-dropdown-divider>
                      <b-dropdown-item @click="tableFilter('completed', 2)">Assessments completed</b-dropdown-item>
                      <b-dropdown-item @click="tableFilter('unfinished', 2)">Assessments not completed</b-dropdown-item>
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
                      <b-dropdown-item @click="tableFilter('with_explanation', 3)">Completed</b-dropdown-item>
                      <b-dropdown-item @click="tableFilter('without_explanation', 3)">Not completed</b-dropdown-item>
                    </b-dropdown>
                    <span v-if="ui.project.showFilterThree" class="text-danger remove-opt" @click="cleanTableFilter">&times;</span>
                  </template>
                  <template v-slot:head(ref_list)="data">
                    <span v-b-tooltip.hover title="Studies that contribute to each review finding">{{ data.label }}</span>
                  </template>
                  <!-- data -->
                  <template v-slot:cell(sort)="data">
                    {{data.index + 1}}
                  </template>
                  <template v-slot:cell(name)="data">
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
                            @click="removeModalFinding(data.index)">
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
                    <!-- <pre>{{data.item}}</pre> -->
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
                        @click="openModalReferences(data.index, data.item.isoqf_id)">
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
              </template>
              <!-- printed version -->
              <template v-else>
                <b-table-simple
                  id="findings-print"
                  ref="findings-print">
                  <b-thead>
                    <b-tr>
                      <b-th>#</b-th>
                      <b-th>Summarised review finding</b-th>
                      <b-th>GRADE-CERQual assessment of confidence</b-th>
                      <b-th>Explanation of GRADE-CERQual assessment</b-th>
                      <b-th>References</b-th>
                    </b-tr>
                  </b-thead>
                  <b-tbody>
                    <b-tr v-for="(item, index) of lists_print_version" :key="index">
                      <template v-if="item.is_category">
                        <b-td
                          colspan="5"
                          class="text-center text-uppercase font-weight-bolder"
                          style="font-weight: bold; text-align: center; text-transform: uppercase;">
                          {{ item.name }}
                        </b-td>
                      </template>
                      <template v-else>
                        <b-td
                          style="vertical-align: top;">
                          <template v-if="list_categories.options.length">
                          <p>{{item.cnt}}</p>
                          </template>
                          <template v-else>
                          {{index+1}}
                          </template>
                        </b-td>
                        <b-td
                          style="vertical-align: top;">
                          <template v-if="checkPermissions('can_read')">
                          <template v-if="item.ref_list.length">
                            <p>
                              {{ item.name }}
                            </p>
                          </template>
                          <template v-else>
                          {{ item.name }}
                          </template>
                          </template>
                          <template v-else>
                            <p>{{ item.name }}</p>
                          </template>
                        </b-td>
                        <b-td
                          style="vertical-align: top;">
                          <p>{{ item.cerqual_option }}</p>
                        </b-td>
                        <b-td
                          style="vertical-align: top;">
                          <template v-if="item.cerqual_option !== ''">
                            <p>{{ item.cerqual_explanation }}</p>
                          </template>
                          <template v-else>
                            <p>&nbsp;</p>
                          </template>
                        </b-td>
                        <b-td
                          style="vertical-align: top;">
                          <p class="references">{{ item.ref_list }}</p>
                        </b-td>
                      </template>
                    </b-tr>
                  </b-tbody>
                </b-table-simple>
                <back-to-top></back-to-top>

                <h3>Evidence Profile Table</h3>
                <b-table-simple>
                  <b-thead>
                    <b-tr>
                      <b-th>#</b-th>
                      <b-th>Summarised review finding</b-th>
                      <b-th>Methodological limitations</b-th>
                      <b-th>Coherence</b-th>
                      <b-th>Adequacy</b-th>
                      <b-th>Relevance</b-th>
                      <b-th>GRADE-CERQual assessment of confidence</b-th>
                      <b-th>References</b-th>
                    </b-tr>
                  </b-thead>
                  <b-tbody>
                    <b-tr v-for="(item, index) of this.lists_print_version" :key="index">
                      <template v-if="item.is_category">
                        <b-td
                          colspan="8"
                          class="text-center text-uppercase font-weight-bolder"
                          style="font-weight: bold; text-align: center; text-transform: uppercase;">
                          {{ item.name }}
                        </b-td>
                      </template>
                      <template v-else>
                      <b-td>
                        <template v-if="list_categories.options.length">
                        <p>{{item.cnt}}</p>
                        </template>
                        <template v-else>
                        {{index+1}}
                        </template>
                      </b-td>
                      <b-td>
                        <p>{{item.name}}</p>
                      </b-td>
                      <b-td>
                        <template v-if="Object.prototype.hasOwnProperty.call(item, 'evidence_profile') && item.evidence_profile !== undefined">
                          <template v-if="Object.prototype.hasOwnProperty.call(item.evidence_profile, 'methodological_limitations')">
                          <p>{{displaySelectedOption(item.evidence_profile.methodological_limitations.option)}}</p>
                          <template v-if="item.evidence_profile.methodological_limitations.explanation!==''">
                            <p><b>Explanation:</b> {{item.evidence_profile.methodological_limitations.explanation}}</p>
                          </template>
                          </template>
                        </template>
                      </b-td>
                      <b-td>
                        <template v-if="Object.prototype.hasOwnProperty.call(item, 'evidence_profile') && item.evidence_profile !== undefined">
                          <template v-if="Object.prototype.hasOwnProperty.call(item.evidence_profile, 'coherence')">
                          <p>{{displaySelectedOption(item.evidence_profile.coherence.option)}}</p>
                          <template v-if="item.evidence_profile.coherence.explanation!==''">
                            <p><b>Explanation:</b> {{item.evidence_profile.coherence.explanation}}</p>
                          </template>
                          </template>
                          </template>
                      </b-td>
                      <b-td>
                        <template v-if="Object.prototype.hasOwnProperty.call(item, 'evidence_profile') && item.evidence_profile !== undefined">
                          <template v-if="Object.prototype.hasOwnProperty.call(item.evidence_profile, 'adequacy')">
                          <p>{{displaySelectedOption(item.evidence_profile.adequacy.option)}}</p>
                          <template v-if="item.evidence_profile.adequacy.explanation!==''">
                            <p><b>Explanation:</b> {{item.evidence_profile.adequacy.explanation}}</p>
                          </template>
                          </template>
                        </template>
                      </b-td>
                      <b-td>
                        <template v-if="Object.prototype.hasOwnProperty.call(item, 'evidence_profile') && item.evidence_profile !== undefined">
                          <template v-if="Object.prototype.hasOwnProperty.call(item.evidence_profile, 'relevance')">
                          <p>{{displaySelectedOption(item.evidence_profile.relevance.option)}}</p>
                          <template v-if="item.evidence_profile.relevance.explanation!==''">
                            <p><b>Explanation:</b> {{item.evidence_profile.relevance.explanation}}</p>
                          </template>
                          </template>
                        </template>
                      </b-td>
                      <b-td>
                        <template v-if="Object.prototype.hasOwnProperty.call(item, 'evidence_profile') && item.evidence_profile !== undefined">
                          <template v-if="Object.prototype.hasOwnProperty.call(item.evidence_profile, 'cerqual')">
                          <p>{{displaySelectedOption(item.evidence_profile.cerqual.option, 'cerqual')}}</p>
                          <template v-if="item.evidence_profile.cerqual.explanation!==''">
                            <p><b>Explanation:</b> {{item.evidence_profile.cerqual.explanation}}</p>
                          </template>
                          </template>
                        </template>
                      </b-td>
                      <b-td>
                        <p class="references">{{returnRefWithNames(item.references)}}</p>
                      </b-td>
                      </template>
                    </b-tr>
                  </b-tbody>
                </b-table-simple>
              </template>
              <!-- eopv -->
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
                size="xl"
                id="add-summarized"
                ref="add-summarized"
                title="Add Summarised review finding"
                :ok-disabled="(summarized_review)?false:true"
                @ok="createList"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                <b-form-group
                  label="Summarised review finding"
                  label-for="summarized-review">
                  <template slot="description">Click <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/1" target="_blank">here</a> for tips for writing a summarised review finding</template>
                  <b-form-textarea
                    id="summarized-review"
                    v-model="summarized_review"
                    rows="6"
                    max-rows="100"></b-form-textarea>
                </b-form-group>
                <b-form-group
                  v-if="list_categories.options.length"
                  label="Select review finding group"
                  description="You can leave this option blank. You can always assign a finding to a group later.">
                  <b-form-select
                    v-model="list_categories.selected"
                    value-field="id"
                    text-field="text"
                    :options="list_categories.options"></b-form-select>
                </b-form-group>
              </b-modal>

              <b-modal
                v-if="selected_list_index >= 0"
                id="modal-references-list"
                ref="modal-references-list"
                title="References"
                @ok="saveReferencesList"
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

              <b-modal
                size="xl"
                id="modalEditListCategories"
                ref="modalEditListCategories"
                scrollable>
                <template v-slot:modal-title>
                  <videoHelp txt="Review finding groups" tag="none" urlId="451100564"></videoHelp>
                </template>
                <template v-if="!(modal_edit_list_categories.new) && !(modal_edit_list_categories.edit) && !(modal_edit_list_categories.remove)">
                  <p class="font-weight-light">
                    Some reviewers choose to organise their review findings into different groups, for example into themes or topics. To do so, add the names of the groups here. After you have created groups for your review findings you will be prompted to assign each new review finding to a group. You can choose not to assign a review finding to a group, or assign it later.
                  </p>
                  <p class="text-danger">
                    Use numbers (1,2,3) or letters (a,b,c) before the name of the group to set the display order for the exported/printed Summary of Qualitative Findings and Evidence Profile tables. For example, 1. Feasibility, 2. Acceptability.
                  </p>
                </template>
                <template
                  v-if="modal_edit_list_categories.options.length && !(modal_edit_list_categories.new) && !(modal_edit_list_categories.edit) && !(modal_edit_list_categories.remove)">
                  <b-table
                    head-variant="highlight"
                    striped
                    :fields="modal_edit_list_categories.fields"
                    :items="modal_edit_list_categories.options">
                    <template v-slot:cell(actions)="data">
                      <b-button
                        block
                        variant="outline-success"
                        @click="editListCategoryName(data.index)">Edit</b-button>
                      <b-button
                        block
                        variant="outline-danger"
                        class="mt-1"
                        @click="removeListCategory(data)">Remove</b-button>
                    </template>
                  </b-table>
                </template>
                <template
                  v-if="modal_edit_list_categories.new">
                  <p class="text-danger">
                    Use numbers (1,2,3) or letters (a,b,c) before the name of the group to set the display order for the exported/printed Summary of Qualitative Findings and Evidence Profile tables. For example, 1. Feasibility, 2. Acceptability.
                  </p>
                  <b-form-group
                    class="mt-3"
                    label="Add group name">
                    <b-form-input
                      v-model="modal_edit_list_categories.text"></b-form-input>
                  </b-form-group>
                  <b-form-group
                    class="mt-3"
                    label="Describe this group for the user viewing this table">
                    <b-form-input
                      v-model="modal_edit_list_categories.extra_info"></b-form-input>
                  </b-form-group>
                </template>
                <template
                  class="mt-3"
                  v-if="modal_edit_list_categories.edit">
                  <p class="text-danger">
                    Use numbers (1,2,3) or letters (a,b,c) before the name of the group to set the display order for the exported/printed Summary of Qualitative Findings and Evidence Profile tables. For example, 1. Feasibility, 2. Acceptability.
                  </p>
                  <b-form-group
                    label="Edit group name">
                    <b-form-input
                      v-model="modal_edit_list_categories.text"></b-form-input>
                  </b-form-group>
                  <b-form-group
                    class="mt-3"
                    label="Describe this group for the user viewing this table">
                    <b-form-input
                      v-model="modal_edit_list_categories.extra_info"></b-form-input>
                  </b-form-group>
                </template>
                <template
                  class="mt-3"
                  v-if="modal_edit_list_categories.remove">
                  <p>
                    Are you sure you want to remove the review finding group <b>{{ modal_edit_list_categories.text }}</b>?
                  </p>
                </template>
                <template
                  v-slot:modal-footer>
                  <div
                    v-if="modal_edit_list_categories.remove">
                    <b-button
                      variant="outline-primary"
                      @click="modalCancelCategoryButtons">Cancel</b-button>
                    <b-button
                      variant="outline-danger"
                      @click="removeCategory()">Confirm</b-button>
                  </div>
                  <div
                    v-if="modal_edit_list_categories.new">
                    <b-button
                      variant="outline-primary"
                      @click="modalCancelCategoryButtons">Cancel</b-button>
                    <b-button
                      variant="outline-success"
                      :disabled="modal_edit_list_categories.text === ''"
                      @click="saveNewCategory">Save</b-button>
                  </div>
                  <div
                    v-if="!modal_edit_list_categories.new">
                    <b-button
                      v-if="!(modal_edit_list_categories.new) && !(modal_edit_list_categories.edit) && !(modal_edit_list_categories.remove)"
                      variant="outline-primary"
                      @click="modal_edit_list_categories.new=true">
                      Add new review finding group
                    </b-button>
                  </div>
                  <div
                    v-if="modal_edit_list_categories.edit">
                    <b-button
                      variant="outline-primary"
                      @click="modalCancelCategoryButtons">Cancel</b-button>
                    <b-button
                      variant="outline-success"
                      :disabled="modal_edit_list_categories.text === ''"
                      @click="updateCategoryName(modal_edit_list_categories.index)">Update</b-button>
                  </div>
                </template>
              </b-modal>
              <back-to-top></back-to-top>
            </b-col>
          </b-row>
        </b-tab>
        <b-tab>
          <content-guidance></content-guidance>
        </b-tab>
      </b-tabs>
      <b-modal
        id="modal-references"
        ref="modal-references"
        title="References"
        size="xl"
        :ok-only="!checkPermissions()"
        @ok="getProject"
        @cancel="confirmRemoveAllReferences($event)"
        scrollable
        ok-variant="outline-success"
        ok-title="Close"
        cancel-variant="outline-danger"
        cancel-title="Remove all references"
        :cancel-disabled="disableBtnRemoveAllRefs">
        <template v-if="appearMsgRemoveReferences">
          <b-row>
            <b-col
              cols="12">
              <p>This action will remove all the references</p>
            </b-col>
          </b-row>
          <b-row>
            <b-col
              cols="6">
              <b-button
                block
                @click="removeAllReferences"
                variant="outline-danger">
                Continue
              </b-button>
            </b-col>
            <b-col
              cols="6">
              <b-button
                block
                @click="appearMsgRemoveReferences = false"
                variant="outline-success">
                Cancel
              </b-button>
            </b-col>
          </b-row>
        </template>
        <template v-else>
          <div
            class="mt-2"
            v-if="references.length">
            <p>Below are the references you have uploaded.</p>
            <b-table
              sort-by="authors"
              responsive
              hover
              bordered
              borderless
              striped
              :fields="fields_references_table"
              :items="references">
              <template v-slot:cell(action)="data">
                <b-button
                  v-if="checkPermissions()"
                  variant="outline-danger"
                  @click="data.toggleDetails">
                  <font-awesome-icon
                    icon="trash"></font-awesome-icon>
                </b-button>
              </template>
              <template v-slot:row-details="data">
                <b-card>
                  <p>You are about to exclude a study from your review. This will delete it, and all associated information, from all tables in iSoQ. If you exclude this study please remember to redo your GRADE-CERQual assessments for all findings that it supported.</p>
                  <p>{{ findRelatedFindings(data.item.id) }}</p>
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
        </template>
      </b-modal>
      <b-modal
        ref="modal-change-status"
        scrollable
        size="xl"
        ok-title="Save"
        ok-variant="outline-success"
        @ok="savePublicStatus"
        cancel-variant="outline-secondary">
        <template v-slot:modal-title>
          <videoHelp txt="Publish to the iSoQ Database" tag="none" urlId="504176899-1"></videoHelp>
        </template>
        <p class="font-weight-light">
          By publishing your iSoQ to the online database, your contribution becomes searchable, readable and downloadable by the public. Please select a visibility setting below and click “publish”. Click the icon next to each to see an example. We recommend users choose Fully Public to maximise transparency. You can change your visibility settings at any time in Project Properties.
        </p>
        <b-form-group>
          <b-form-radio-group
            id="modal-publish-status"
            v-model="modal_project.public_type"
            :options="global_status"
            name="modal-radio-status"
          ></b-form-radio-group>
        </b-form-group>
        <template v-if="modal_project.public_type !== 'private'">
          <h5>Choose a license</h5>
          <p class="font-weight-light">Please choose a Creative Commons licence under which you would like to publish your work to the iSoQ database. The default is CC-BY-NC-ND. Read more about Creative Commons licenses <a href="https://creativecommons.org/about/cclicenses/" target="_blnak">here</a>.</p>
          <p class="font-weight-light">It is your responsibility to ensure that publishing your work to the iSoQ database does not violate any existing licencing agreement – e.g. with academic journals or funders.</p>
          <b-form-group>
            <b-form-radio-group
              id="modal-publish-license"
              v-model="getLicense"
              :options="global_licenses"
              name="modal-radio-license"
            ></b-form-radio-group>
          </b-form-group>
        </template>
        <template #modal-footer>
          <div class="w-100">
            <b-button
              variant="outline-success"
              class="float-right ml-3"
              @click="savePublicStatus">
              <b-spinner small v-show="ui.publish.showLoader"></b-spinner>
              Save
            </b-button>
            <b-button
              variant="outline-secondary"
              class="float-right"
              @click="$refs['modal-change-status'].hide()">
              Close
            </b-button>
          </div>
        </template>
      </b-modal>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import draggable from 'vuedraggable'
// import parser from '../../plugins/parser'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, VerticalAlign, BorderStyle, PageOrientation } from 'docx'
import Papa from 'papaparse'
const ExportCSV = require('export-to-csv').ExportToCsv

const projectProperties = () => import('@/components/project/projectProperties')
const contentGuidance = () => import(/* webpackChunkName: "contentguidance" */ '../contentGuidance')
const backToTop = () => import(/* webpackChunkName: "backtotop" */ '../backToTop')
const Criteria = () => import(/* webpackChunkName: "criteria" */ '../Criteria')
const videoHelp = () => import(/* webpackChunkName: "videohelp" */ '../videoHelp')
const myData = () => import(/* webpackChunkName: "videohelp" */ './myData')

export default {
  components: {
    draggable,
    projectProperties,
    'content-guidance': contentGuidance,
    'back-to-top': backToTop,
    'criteria': Criteria,
    videoHelp,
    myData
  },
  data () {
    return {
      project: {
        name: '',
        authors: '',
        inclusion: '',
        exclusion: ''
      },
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
        publish: {
          showLoader: false
        }
      },
      modal_project: {},
      lists: [],
      list_categories: {
        options: [],
        selected: null
      },
      lists_print_version: [],
      modal_edit_list_categories: {
        id: null,
        fields: [
          { key: 'text', label: 'Name of group' },
          { key: 'actions', label: '' }
        ],
        options: [],
        new: false,
        edit: false,
        remove: false,
        text: '',
        extra_info: '',
        index: null
      },
      list_category: {
        name: '',
        extra_info: ''
      },
      fields: {
        with_categories: [
          {
            key: 'sort',
            label: '#'
          },
          {
            key: 'name',
            label: 'Summarised review finding'
          },
          {
            key: 'category_name',
            label: 'Review Finding Groups'
          },
          {
            key: 'cerqual_option',
            label: 'GRADE-CERQual assessment of confidence'
          },
          {
            key: 'cerqual_explanation',
            label: 'Explanation of GRADE-CERQual assessment'
          },
          {
            key: 'ref_list',
            label: 'References'
          }
        ],
        without_categories: [
          {
            key: 'sort',
            label: '#'
          },
          {
            key: 'name',
            label: 'Summarised review finding'
          },
          {
            key: 'cerqual_option',
            label: 'GRADE-CERQual assessment of confidence'
          },
          {
            key: 'cerqual_explanation',
            label: 'Explanation of GRADE-CERQual assessment'
          },
          {
            key: 'ref_list',
            label: 'References'
          }
        ]
      },
      table_settings: {
        isBusy: true,
        currentPage: 1,
        perPage: 5,
        filter: null,
        totalRows: 1,
        filterOn: ['isoqf_id', 'name', 'filter_cerqual', 'cerqual_explanation', 'ref_list', 'category_name', 'status', 'explanation']
      },
      summarized_review: '',
      select_options: [
        { value: 0, text: 'No/Very minor concerns' },
        { value: 1, text: 'Minor concerns' },
        { value: 2, text: 'Moderate concerns' },
        { value: 3, text: 'Serious concerns' },
        { value: null, text: 'Undefined' }
      ],
      cerqual_confidence: [
        { value: 'hc', text: 'High confidence' },
        { value: 'mc', text: 'Moderate confidence' },
        { value: 'lc', text: 'Low confidence' },
        { value: 'vc', text: 'Very low confidence' },
        { value: null, text: 'Undefined' }
      ],
      pre_references: '',
      references: [],
      refs: [],
      loadReferences: true,
      fields_references_table:
        [
          {
            key: 'authors',
            label: 'Author(s)',
            formatter: value => {
              if (value.length < 1) {
                return 'no author(s)'
              } else if (value.length === 1) {
                return value[0].split(',')[0]
              } else if (value.length === 2) {
                return value[0].split(',')[0] + ' & ' + value[1].split(',')[0]
              } else {
                return value[0].split(',')[0] + ' et al.'
              }
            }
          },
          { key: 'title', label: 'Title' },
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
      charsOfStudiesFieldsModal: {
        nroColumns: 1,
        fields: [],
        items: [],
        selected_item_index: 0
      },
      charsOfStudiesFieldsModalEdit: {
        nroColumns: 1,
        fields: [],
        items: [],
        selected_item_index: 0
      },
      charsOfStudies: {
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      },
      charsOfStudiesTableSettings: {
        currentPage: 1,
        perPage: 10,
        isBusy: false
      },
      tabOpened: 1,
      global_status: [
        { value: 'private', text: 'Private - Your iSoQ is not publicly available on the iSoQ database' },
        { value: 'fully', text: 'Fully Public - Your iSoQ table, Evidence Profile, and GRADE-CERQual Worksheets are publicly available on the iSoQ database' },
        { value: 'partially', text: 'Partially Public - Your iSoQ table and Evidence Profile are publicly available on the iSoQ database' },
        { value: 'minimally', text: 'Minimally Public - Your iSoQ table is available on the iSoQ database' }
      ],
      global_licenses: [
        { value: 'CC-BY-NC-ND', text: 'CC BY-NC-ND: This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, for noncommercial purposes only, and only so long as attribution is given to the creator.' },
        { value: 'CC-BY-ND', text: 'CC BY-ND: This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, and only so long as attribution is given to the creator. The license allows for commercial use.' },
        { value: 'CC-BY-NC-SA', text: 'CC BY-NC-SA: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.' },
        { value: 'CC-BY-NC', text: 'CC BY-NC: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator.' },
        { value: 'CC-BY-SA', text: 'CC BY-SA: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.' },
        { value: 'CC-BY', text: 'CC BY: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use.' }
      ],
      yes_or_no: [
        { value: false, text: 'no' },
        { value: true, text: 'yes' }
      ],
      msgUpdateProject: null,
      pre_ImportDataTable: '',
      importDataTable: {
        error: null,
        fields: [],
        items: [],
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      },
      removeReferenceCharsOfStudies: {
        id: null,
        findings: []
      },
      methodologicalTableRefs: {
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      },
      methodologicalTableRefsTableSettings: {
        currentPage: 1,
        perPage: 10,
        isBusy: false
      },
      methodologicalFieldsModal: {
        nroColumns: 1,
        fields: [],
        items: [],
        selected_item_index: 0
      },
      methodologicalFieldsModalEdit: {
        nroColumns: 1,
        fields: []
      },
      removeReferenceMethodological: {
        id: null,
        findings: []
      },
      dismissAlertPrint: false,
      appearMsgRemoveReferences: false,
      disableBtnRemoveAllRefs: false,
      editFindingName: {
        index: null,
        name: null,
        notes: null,
        editing: false
      },
      episte_request: '',
      episte_response: [],
      episte_loading: false,
      episte_error: false,
      finding: {},
      showBanner: false,
      sorted_lists: [],
      changeTxtProjectProperties: '+',
      pubmed_request: '',
      pubmed_requested: [],
      findings: [],
      editingUser: {
        show: false
      }
    }
  },
  watch: {
    pre_ImportDataTable: function (data) {
      let fields = []
      let items = []
      const csvData = Papa.parse(data, { skipEmptyLines: true })
      this.importDataTable.error = null
      if (csvData.data.length) {
        if (csvData.data[0].length < 3) {
          this.importDataTable.error = 'Your data might be wrongly formatted and therefore will not display. Check that you saved your file as the following file type: CSV-UTF-8 (Comma delimited) (*.csv). Also check that your table has at least one column.'
        } else {
          for (let cnt in csvData.data) {
            if (parseInt(cnt) === 0) {
              let cntI = 0
              for (let i in csvData.data[cnt]) {
                let obj = {}
                if (parseInt(i) === 0) {
                  obj.key = 'ref_id'
                }
                if (parseInt(i) === 1) {
                  obj.key = 'authors'
                }
                if (parseInt(i) > 1) {
                  this.importDataTable.fieldsObj.push({ 'key': 'column_' + cntI, 'label': csvData.data[cnt][i] })
                  obj.key = 'column_' + cntI
                  cntI++
                }
                obj.label = csvData.data[cnt][i]
                fields.push(obj)
              }
            } else {
              let cntI = 0
              let obj = {}
              for (let i in csvData.data[cnt]) {
                if (parseInt(i) === 0) {
                  obj.ref_id = csvData.data[cnt][i]
                }
                if (parseInt(i) === 1) {
                  obj.authors = csvData.data[cnt][i]
                }
                if (parseInt(i) > 1) {
                  obj[`column_${cntI}`] = csvData.data[cnt][i]
                  cntI++
                }
              }
              items.push(obj)
            }
          }
        }
      }
      this.importDataTable.fields = fields
      this.importDataTable.items = items
    }
  },
  mounted () {
    this.getListCategories()
    this.getReferences()
    this.openModalReferencesSingle(false)
    this.getProject()
  },
  methods: {
    getReferences: function (changeTab = true) {
      axios.get(`/api/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`)
        .then((response) => {
          const data = JSON.parse(JSON.stringify(response.data))
          let _references = data
          this.references = data
          let _refs = []
          for (let reference of _references) {
            let content = this.parseReference(reference)
            if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
              _refs.push({'id': reference.id, 'content': content})
            }
          }

          this.refs = _refs.sort((a, b) => a.content.localeCompare(b.content))
          if (changeTab) {
            if (this.references.length) {
              this.$nextTick(() => {
                if (this.$route.hash) {
                  const tabs = ['#Project-Property', '#My-Data', '#iSoQ', '#Guidance-on-Applying-CERQual']
                  this.tabOpened = tabs.indexOf(this.$route.hash)
                } else {
                  this.tabOpened = 2
                }
              })
            }
          }
          this.loadReferences = false
          this.updateMyDataTables()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getReferenceInfo: function (refId) {
      for (let ref of this.refs) {
        if (ref.id === refId) {
          return ref.content
        }
      }
    },
    returnRefWithNames: function (array) {
      let authorsList = []
      for (const i in array) {
        for (const r of this.references) {
          if (r.id === array[i]) {
            authorsList.push(this.getAuthorsFormat(r.authors, r.publication_year))
            // authors = this.getAuthorsFormat(r.authors, r.publication_year) + '; ' + authors
          }
        }
      }
      authorsList.sort()
      let authors = ''
      for (let x in authorsList) {
        authors = authors + authorsList[x] + '; '
      }
      return authors
    },
    displaySelectedOption: function (option, type = '') {
      if (option === null) {
        return ''
      } else if (option >= 0) {
        if (type === 'cerqual') {
          return this.cerqual_confidence[option].text
        } else {
          return this.select_options[option].text
        }
      } else {
        return ''
      }
    },
    EpisteRequest: function () {
      document.getElementById('btnEpisteRequest').disabled = true
      this.episte_loading = true
      this.episte_error = false
      this.episte_response = []
      const allLines = this.episte_request.split(/\r\n|\n/)
      allLines.forEach((line, index) => {
        const instance = axios.create({
          withCredentials: true,
          headers: {
            'Authorization': 'Token token="bcd43ca4789d1d52b28a288828d738c2"'
          }
        })

        instance.get(`https://api.epistemonikos.org/v1/documents/${line}?show=relations`)
          .then((response) => {
            let obj = {}
            obj.citation = response.data.citation
            obj.content = response.data.content
            this.episte_response.push(obj)
            document.getElementById('btnEpisteRequest').disabled = false
            this.episte_loading = false
          }).catch((error) => {
            this.episte_loading = false
            this.episte_error = true
            document.getElementById('btnEpisteRequest').disabled = false
            this.printErrors(error)
          })
      })
    },
    changeMode: function () {
      this.mode = (this.mode === 'edit') ? 'view' : 'edit'
      if (this.mode === 'view') {
        this.table_settings.perPage = this.lists.length
        this.table_settings.currentPage = 1
      } else {
        this.table_settings.perPage = 5
      }
    },
    printiSoQ: function () {
      window.print()
    },
    parseReference: (reference, onlyAuthors = false, hasSemicolon = true) => {
      let result = ''
      const semicolon = hasSemicolon ? '; ' : ''
      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        if (reference.authors.length) {
          if (reference.authors.length === 1) {
            result = reference.authors[0].split(',')[0] + ' ' + reference.publication_year + semicolon
          } else if (reference.authors.length === 2) {
            result = reference.authors[0].split(',')[0] + ' & ' + reference.authors[1].split(',')[0] + ' ' + reference.publication_year + semicolon
          } else {
            result = reference.authors[0].split(',')[0] + ' et al. ' + reference.publication_year + semicolon
          }
          if (!onlyAuthors) {
            result = result + reference.title
          }
        } else {
          return 'author(s) not found'
        }
      }
      return result
    },
    getProject: function () {
      const params = {
        organization: this.$route.params.org_id
      }
      axios.get(`/api/isoqf_projects/${this.$route.params.id}`, { params })
        .then((response) => {
          this.project = response.data
          if (!Object.prototype.hasOwnProperty.call(this.project, 'inclusion')) {
            this.project.inclusion = ''
          }
          if (!Object.prototype.hasOwnProperty.call(this.project, 'exclusion')) {
            this.project.exclusion = ''
          }
          this.ui.project.show_criteria = true
          this.getLists() // summary review
          this.getCharacteristics()
          this.getMethodological()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getLists: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get('/api/isoqf_lists', { params })
        .then((response) => {
          let data = JSON.parse(JSON.stringify(response.data))
          data.sort(function (a, b) {
            if (a.sort < b.sort) { return -1 }
            if (a.sort > b.sort) { return 1 }
            return 0
          })
          if (data.length) {
            this.lastId = parseInt(data.slice(-1)[0].isoqf_id) + 1
            for (let list of data) {
              if (!Object.prototype.hasOwnProperty.call(list, 'evidence_profile')) {
                list.status = 'unfinished'
                list.explanation = 'without_explanation'
              } else {
                list.status = 'completed'
                list.explanation = 'with_explanation'
                if (list.evidence_profile.cerqual.option === null) {
                  list.status = 'unfinished'
                }
                if (list.evidence_profile.cerqual.explanation === '') {
                  list.explanation = 'without_explanation'
                }
              }
              if (!Object.prototype.hasOwnProperty.call(list, 'references')) {
                list.references = []
              }
              if (!Object.prototype.hasOwnProperty.call(list, 'notes')) {
                list.notes = ''
              }
              if (!Object.prototype.hasOwnProperty.call(list, 'category')) {
                list.category = null
              } else {
                list.category_name = ''
                list.category_extra_info = ''
                if (this.list_categories.options.length) {
                  for (let category of this.list_categories.options) {
                    if (list.category === category.id) {
                      list.category_name = category.text
                      list.category_extra_info = category.extra_info
                    }
                  }
                }
              }
              list.cerqual_option = ''
              if (list.cerqual.option != null) {
                list.cerqual_option = this.cerqual_confidence[list.cerqual.option].text
              }
              list.filter_cerqual = ''
              switch (list.cerqual_option) {
                case 'High confidence':
                  list.filter_cerqual = 'hc'
                  break
                case 'Moderate confidence':
                  list.filter_cerqual = 'mc'
                  break
                case 'Low confidence':
                  list.filter_cerqual = 'lc'
                  break
                case 'Very low confidence':
                  list.filter_cerqual = 'vc'
                  break
                default:
                  list.filter_cerqual = ''
                  break
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
              this.getFinding(this.$route.params.org_id, list.id)
            }

            if (this.list_categories.options.length) {
              let categories = []

              for (let category of this.list_categories.options) {
                if (category.id !== null) {
                  categories.push({'name': category.text, 'value': category.id, 'items': [], is_category: true})
                }
              }
              categories.push({'name': 'Uncategorised findings', 'value': null, 'items': [], is_category: true})

              for (let list of data) {
                if (categories.length) {
                  for (let category of categories) {
                    if (category.value === list.category) {
                      category.items.push(
                        {
                          'isoqf_id': list.isoqf_id,
                          'name': list.name,
                          'cerqual_option': list.cerqual_option,
                          'filter_cerqual': list.filter_cerqual,
                          'cerqual_explanation': list.cerqual_explanation,
                          'ref_list': list.ref_list,
                          'sort': list.sort,
                          'notes': list.notes,
                          'evidence_profile': list.evidence_profile,
                          'references': list.references,
                          'cnt': 0
                        }
                      )
                    }
                  }
                }
              }
              let _items = []
              let cnt = 1
              for (const cat of categories) {
                if (cat.items.length) {
                  _items.push(cat)
                  for (const _item of cat.items) {
                    _item.cnt = cnt
                    _items.push(_item)
                    cnt++
                  }
                }
              }

              this.lists_print_version = _items
            } else {
              this.lists_print_version = data
            }
          }
          this.lists = data
          this.table_settings.isBusy = false
          this.table_settings.totalRows = data.length
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getFinding: function (orgId, listId) {
      const params = {
        organization: orgId,
        list_id: listId
      }
      axios.get('/api/isoqf_findings', {params})
        .then((response) => {
          if (response.data.length) {
            if (!this.findings.includes(response.data[0].id)) {
              this.findings.push(response.data[0].id)
            }
          }
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    modalAddList: function () {
      this.list_categories.selected = null
      this.$refs['add-summarized'].show()
    },
    createList: function () {
      this.table_settings.isBusy = true
      let _lists = JSON.parse(JSON.stringify(this.lists))
      let _sort = 1
      if (_lists.length) {
        _sort = parseInt(_lists.slice(-1)[0].sort) + 1
      }
      let isPublic = false
      if (this.project.is_public) {
        isPublic = true
      }
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id,
        name: this.summarized_review,
        isoqf_id: this.lastId,
        cerqual: { option: null, explanation: '' },
        references: [],
        category: this.list_categories.selected,
        sort: _sort,
        editing: false,
        is_public: isPublic
      }
      axios.post('/api/isoqf_lists', params)
        .then((response) => {
          const listId = response.data.id
          const listName = response.data.name

          this.getLists()
          this.createFinding(listId, listName)
          this.summarized_review = ''
          this.list_categories.selected = null
          this.updateModificationTime()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    createFinding: function (listId, listName) {
      let isPublic = false
      if (this.project.is_public) {
        isPublic = true
      }
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
          },
          references: []
        },
        references: [],
        is_public: isPublic
      }
      axios.post('/api/isoqf_findings', params)
        .then((response) => {
          this.createExtractedData(response.data.id)
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    openModalReferencesSingle: function (showModal) {
      if (showModal) {
        this.getReferences(false)
        this.msgUploadReferences = ''
        this.appearMsgRemoveReferences = false
        this.disableBtnRemoveAllRefs = false
        this.$refs['modal-references'].show()
      }
    },
    openModalReferences: function (index, isoqfId) {
      this.selected_list_index = index
      axios.get(`/api/isoqf_lists/${this.lists[index].id}`)
        .then(() => {
          let list = JSON.parse(JSON.stringify(this.lists[index]))
          const params = {
            organization: this.$route.params.org_id,
            list_id: list.id
          }
          axios.get('/api/isoqf_findings', {params})
            .then((response) => {
              if (response.data.length) {
                this.finding = JSON.parse(JSON.stringify(response.data[0]))
              }
            })
            .catch((error) => {
              this.printErrors(error)
            })

          this.getReferences()
          this.selected_references = this.lists[index].references
          this.showBanner = false
          if (this.lists[index].cerqual_option !== '') {
            this.showBanner = true
          }
          this.$refs['modal-references-list'].show()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    saveReferencesList: function () {
      this.loadReferences = true
      this.table_settings.isBusy = true
      const params = {
        references: this.selected_references
      }
      axios.patch(`/api/isoqf_lists/${this.lists[this.selected_list_index].id}`, params)
        .then(() => {
          this.updateFindingReferences(this.selected_references)
          this.selected_references = []
          this.selected_list_index = null
          this.getReferences()
          this.getLists()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    updateFindingReferences: function (references) {
      const params = {
        'evidence_profile.references': references
      }
      axios.patch(`/api/isoqf_findings/${this.finding.id}`, params)
        .then(() => {
          this.finding = {}
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    onFiltered (filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.table_settings.totalRows = filteredItems.length
      this.table_settings.currentPage = 1
    },
    ExportToWord: function (filename = '') {
      filename = filename ? filename + ' - Summary of Qualitative Findings Table.docx' : 'Summary of Qualitative Findings Table.docx'
      const doc = new Document()

      doc.addSection({
        margins: {
          top: 720,
          right: 720,
          bottom: 720,
          left: 720
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: this.project.name,
                bold: true,
                size: 36,
                font: { name: 'Times New Roman' },
                color: '000000'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'Summary of Qualitative Findings Table',
                bold: true,
                size: 36,
                font: { name: 'Times New Roman' },
                color: '000000'
              })
            ]
          }),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Review question',
                bold: true,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: this.project.review_question,
                size: 24
              })
            ]
          }),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Authors of the review',
                bold: true,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: this.project.authors,
                size: 24
              })
            ]
          }),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Corresponding author',
                bold: true,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [
              this.generateAuthorInfo()
            ]
          }),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Has the review been published?',
                bold: true,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: (this.project.published_status) ? ('Yes' + (this.project.url_doi.length) ? ' | DOI: ' + this.project.url_doi : '') : 'No',
                size: 24
              })
            ]
          }),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Additional Information',
                bold: true,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: this.project.description,
                size: 24
              })
            ]
          }),
          new Paragraph(''),
          ...this.generateLicense(this.project),
          new Table({
            borders: {
              top: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              bottom: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              left: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              right: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              insideHorizontal: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              insideVertical: {
                style: BorderStyle.NONE
              }
            },
            width: {
              size: '100%',
              type: WidthType.PERCENTAGE
            },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#DDDDDD'
                    },
                    width: {
                      size: '5%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: '#',
                            size: 22,
                            bold: true
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    width: {
                      size: '40%',
                      type: WidthType.PERCENTAGE
                    },
                    shading: {
                      fill: '#DDDDDD'
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'Summarised review finding',
                            size: 22,
                            bold: true
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    width: {
                      size: '20%',
                      type: WidthType.PERCENTAGE
                    },
                    shading: {
                      fill: '#DDDDDD'
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'GRADE-CERQual Assessment of confidence',
                            size: 22,
                            bold: true
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#DDDDDD'
                    },
                    width: {
                      size: '20%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'Explanation of GRADE-CERQual Assessment',
                            size: 22,
                            bold: true
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#DDDDDD'
                    },
                    width: {
                      size: '15%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'References',
                            size: 22,
                            bold: true
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),
              ...this.generateFindingsTableContent()
            ]
          })
        ]
      })

      doc.addSection({
        size: {
          orientation: PageOrientation.LANDSCAPE
        },
        margins: {
          top: 720,
          right: 720,
          bottom: 720,
          left: 720
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [
              new TextRun({
                text: 'Evidence Profile Table',
                bold: true,
                size: 32,
                font: { name: 'Times New Roman' },
                color: '000000'
              })
            ]
          }),
          new Paragraph(''),
          new Table({
            borders: {
              top: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              bottom: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              left: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              right: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              insideHorizontal: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              insideVertical: {
                style: BorderStyle.NONE
              }
            },
            width: {
              size: '100%',
              type: WidthType.PERCENTAGE
            },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#DDDDDD'
                    },
                    width: {
                      size: '5%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: '#',
                            size: 22,
                            bold: true
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#DDDDDD'
                    },
                    width: {
                      size: '40%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'Summarised review finding',
                            size: 22,
                            bold: true
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    width: {
                      size: '10%',
                      type: WidthType.PERCENTAGE
                    },
                    shading: {
                      fill: '#DDDDDD'
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'Methodological limitations',
                            size: 22,
                            bold: true
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    width: {
                      size: '10%',
                      type: WidthType.PERCENTAGE
                    },
                    shading: {
                      fill: '#DDDDDD'
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'Coherence',
                            size: 22,
                            bold: true
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#DDDDDD'
                    },
                    width: {
                      size: '10%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'Adequacy',
                            size: 22,
                            bold: true
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#DDDDDD'
                    },
                    width: {
                      size: '10%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'Relevance',
                            size: 22,
                            bold: true
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#DDDDDD'
                    },
                    width: {
                      size: '10%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'GRADE-CERQual assessment of confidence',
                            size: 22,
                            bold: true
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#DDDDDD'
                    },
                    width: {
                      size: '5%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'References',
                            size: 22,
                            bold: true
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),
              ...this.generateEvidenceProfileTable2(this.lists)
            ]
          })
        ]
      })
      Packer.toBlob(doc).then(blob => {
        saveAs(blob, filename)
      })
    },
    generateLicense: function (project) {
      let content = []
      if (project.public_type !== 'private') {
        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'License',
                bold: true,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: project.license_type,
                size: 24
              })
            ]
          }),
          new Paragraph('')
        )
      }
      return content
    },
    generateEvidenceProfileTableWithCategories: function (findings) {
      let content = []
      for (const position in findings) {
        let rowTitle = 'Uncategorised findings'
        for (const category of this.list_categories.options) {
          if (findings[position].length) {
            if (findings[position][0].category === null) {
              break
            }
            if (findings[position][0].category === category.id) {
              rowTitle = category.text
            }
          }
        }
        if (findings[position].length) {
          content.push(
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: 5,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: rowTitle.toUpperCase(),
                          bold: true,
                          size: 22
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          )
          content.push(...this.generateEvidenceProfileTableWithoutCategories(findings[position]))
        }
      }
      return content
    },
    generateEvidenceProfileTable: function (findings) {
      let categories = JSON.parse(JSON.stringify(this.list_categories.options)).filter((category) => { return category.id !== null })
      categories.sort(function (a, b) {
        if (a.text < b.text) { return -1 }
        if (a.text > b.text) { return 1 }
        return 0
      })

      let _findings = {}
      for (let category of categories) {
        _findings[category.id] = []
      }
      if (categories.length) {
        _findings['uncategorised'] = []
        for (let finding of findings) {
          if (Object.prototype.hasOwnProperty.call(finding, 'category')) {
            if (finding.category !== null) {
              if (Object.prototype.hasOwnProperty.call(_findings, finding.category.toString())) {
                _findings[finding.category].push(finding)
              } else {
                _findings[finding.category] = []
                _findings[finding.category].push(finding)
              }
            } else {
              _findings['uncategorised'].push(finding)
            }
          }
        }
        return this.generateEvidenceProfileTableWithCategories(_findings)
      } else {
        return this.generateEvidenceProfileTableWithoutCategories(findings)
      }
    },
    generateEvidenceProfileTableWithoutCategories: function (findings) {
      return findings.map((finding) => {
        if (Object.prototype.hasOwnProperty.call(finding, 'evidence_profile')) {
          return new TableRow({
            tableHeader: true,
            children: [
              this.generateTableCell({
                width_size: '40%', text: finding.name, font_size: 22, align: AlignmentType.CENTER
              }),
              this.generateTableCell({
                width_size: '10%', text: this.displaySelectedOption(finding.evidence_profile.methodological_limitations.option), font_size: 22, align: AlignmentType.LEFT
              }),
              this.generateTableCell({
                width_size: '10%', text: this.displaySelectedOption(finding.evidence_profile.coherence.option), font_size: 22, align: AlignmentType.CENTER
              }),
              this.generateTableCell({
                width_size: '10%', text: this.displaySelectedOption(finding.evidence_profile.adequacy.option), font_size: 22, align: AlignmentType.LEFT
              }),
              this.generateTableCell({
                width_size: '10%', text: this.displaySelectedOption(finding.evidence_profile.relevance.option), font_size: 22, align: AlignmentType.LEFT
              }),
              this.generateTableCell({
                width_size: '10%', text: this.displaySelectedOption(finding.evidence_profile.cerqual.option), font_size: 22, align: AlignmentType.LEFT
              }),
              this.generateTableCell({
                width_size: '10%', text: this.returnRefWithNames(finding.references), font_size: 16, align: AlignmentType.LEFT
              })
            ]
          })
        } else {
          return new TableRow({
            children: [
              this.generateTableCell({
                width_size: '40%', text: finding.name, font_size: 22, align: AlignmentType.LEFT
              }),
              new TableCell({
                columnSpan: 5,
                width_size: '40%',
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: '',
                        size: 22
                      })
                    ]
                  })
                ]
              }),
              this.generateTableCell({
                width_size: '10%',
                text: this.returnRefWithNames(finding.references),
                font_size: 16,
                align: AlignmentType.LEFT
              })
            ]
          })
        }
      })
    },
    generateEvidenceProfileTable2: function () {
      const items = this.lists_print_version
      return items.map((item, index) => {
        if (Object.prototype.hasOwnProperty.call(item, 'is_category')) {
          return new TableRow({
            children: [
              new TableCell({
                columnSpan: 8,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: item.name.toUpperCase(),
                        bold: true,
                        size: 22
                      })
                    ]
                  })
                ]
              })
            ]
          })
        } else {
          if (Object.prototype.hasOwnProperty.call(item, 'evidence_profile')) {
            if (item.evidence_profile === undefined) {
              return new TableRow({
                children: [
                  this.generateTableCell({
                    width_size: '5%', text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : index + 1, font_size: 22, align: AlignmentType.CENTER
                  }),
                  this.generateTableCell({
                    width_size: '40%', text: item.name, font_size: 22, align: AlignmentType.CENTER
                  }),
                  new TableCell({
                    columnSpan: 5,
                    width_size: '40%',
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  this.generateTableCell({
                    width_size: '5%',
                    text: this.returnRefWithNames(item.references),
                    font_size: 16,
                    align: AlignmentType.LEFT
                  })
                ]
              })
            } else {
              return new TableRow({
                children: [
                  this.generateTableCell({
                    width_size: '5%',
                    text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : index + 1,
                    font_size: 22,
                    align: AlignmentType.CENTER
                  }),
                  this.generateTableCell({
                    width_size: '40%',
                    text: item.name,
                    font_size: 22,
                    align: AlignmentType.CENTER
                  }),
                  this.generateTableCell(
                    {
                      width_size: '10%',
                      text: this.displaySelectedOption(item.evidence_profile.methodological_limitations.option),
                      explanation: (item.evidence_profile.methodological_limitations.option.length) ? item.evidence_profile.methodological_limitations.explanation : '',
                      font_size: 22,
                      align: AlignmentType.LEFT
                    }
                  ),
                  this.generateTableCell({
                    width_size: '10%',
                    text: this.displaySelectedOption(item.evidence_profile.coherence.option),
                    explanation: (item.evidence_profile.coherence.explanation.length) ? item.evidence_profile.coherence.explanation : '',
                    font_size: 22,
                    align: AlignmentType.CENTER
                  }),
                  this.generateTableCell({
                    width_size: '10%',
                    text: this.displaySelectedOption(item.evidence_profile.adequacy.option),
                    explanation: (item.evidence_profile.adequacy.explanation.length) ? item.evidence_profile.adequacy.explanation : '',
                    font_size: 22,
                    align: AlignmentType.LEFT
                  }),
                  this.generateTableCell({
                    width_size: '10%',
                    text: this.displaySelectedOption(item.evidence_profile.relevance.option),
                    explanation: (item.evidence_profile.relevance.explanation.length) ? item.evidence_profile.relevance.explanation : '',
                    font_size: 22,
                    align: AlignmentType.LEFT
                  }),
                  this.generateTableCell({
                    width_size: '10%',
                    text: this.displaySelectedOption(item.evidence_profile.cerqual.option, 'cerqual'),
                    explanation: (item.evidence_profile.cerqual.explanation.length) ? item.evidence_profile.cerqual.explanation : '',
                    font_size: 22,
                    align: AlignmentType.LEFT
                  }),
                  this.generateTableCell({
                    width_size: '5%',
                    text: this.returnRefWithNames(item.references),
                    font_size: 16,
                    align: AlignmentType.LEFT
                  })
                ]
              })
            }
          } else {
            return new TableRow({
              children: [
                this.generateTableCell({
                  width_size: '40%', text: item.name, font_size: 22, align: AlignmentType.LEFT
                }),
                new TableCell({
                  columnSpan: 5,
                  width_size: '40%',
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: '',
                          size: 22
                        })
                      ]
                    })
                  ]
                }),
                this.generateTableCell({
                  width_size: '10%',
                  text: this.returnRefWithNames(item.references),
                  font_size: 16,
                  align: AlignmentType.LEFT
                })
              ]
            })
          }
        }
      })
    },
    generateFindingsTableContent: function () {
      const items = this.lists_print_version
      return items.map((item, index) => {
        if (Object.prototype.hasOwnProperty.call(item, 'is_category')) {
          return new TableRow({
            children: [
              new TableCell({
                columnSpan: 5,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: item.name.toUpperCase(),
                        bold: true,
                        size: 22
                      })
                    ]
                  })
                ]
              })
            ]
          })
        } else {
          return new TableRow({
            children: [
              this.generateTableCell({width_size: '5%', text: (Object.prototype.hasOwnProperty.call(item, 'cnt')) ? item.cnt : index + 1, font_size: 22, align: AlignmentType.CENTER}),
              this.generateTableCell({width_size: '40%', text: item.name, font_size: 22, align: AlignmentType.LEFT}),
              this.generateTableCell({width_size: '20%', text: item.cerqual_option, font_size: 22, align: AlignmentType.CENTER}),
              this.generateTableCell({width_size: '20%', text: item.cerqual_explanation, font_size: 22, align: AlignmentType.LEFT}),
              this.generateTableCell({width_size: '15%', text: item.ref_list, font_size: 16, align: AlignmentType.LEFT})
            ]
          })
        }
      })
    },
    generateTableWithoutCategories: function (findings) {
      return findings.map((finding) => {
        return new TableRow({
          tableHeader: true,
          children: [
            this.generateTableCell({width_size: '5%', text: finding.sort, font_size: 22, align: AlignmentType.CENTER}),
            this.generateTableCell({width_size: '40%', text: finding.name, font_size: 22, align: AlignmentType.LEFT}),
            this.generateTableCell({width_size: '20%', text: finding.cerqual_option, font_size: 22, align: AlignmentType.CENTER}),
            this.generateTableCell({width_size: '20%', text: finding.cerqual_explanation, font_size: 22, align: AlignmentType.LEFT}),
            this.generateTableCell({width_size: '15%', text: finding.ref_list, font_size: 16, align: AlignmentType.LEFT})
          ]
        })
      })
    },
    generateTableCell: function (content) {
      return new TableCell({
        width: {
          size: content.width_size,
          type: WidthType.PERCENTAGE
        },
        children: [
          this.generateParagraph(content),
          ...(this.generateParagraphExplanation(content))
        ]
      })
    },
    generateParagraph: function (content) {
      return new Paragraph({
        indent: {
          left: 100,
          right: 100
        },
        alignment: content.alignment,
        children: [
          this.generateText(content)
        ]
      })
    },
    generateText: function (content) {
      return new TextRun({
        text: content.text,
        size: content.font_size
      })
    },
    generateParagraphExplanation: function (content) {
      let paragraph = []
      if (Object.prototype.hasOwnProperty.call(content, 'explanation')) {
        paragraph.push(
          new Paragraph('')
        )
        paragraph.push(
          new Paragraph({
            children: [
              ...(this.generateExplanationText(content))
            ]
          })
        )
      }
      return paragraph
    },
    generateExplanationText: function (content) {
      let text = []
      text.push(
        new TextRun({
          text: 'Explanation: ',
          size: content.font_size,
          bold: true
        })
      )
      text.push(
        new TextRun({
          text: content.explanation,
          size: content.font_size
        })
      )
      return text
    },
    generateAuthorInfo: function () {
      let data = ''
      if (this.project.author.length) {
        data = this.project.author.toString()
        if (this.project.author_email.length) {
          const email = this.project.author_email.toString()
          data = data.concat(' - ' + email)
        }
      }

      return new TextRun({
        text: data,
        size: 24
      })
    },
    processRIS: function (reference = {}) {
      let txt = ''

      if (Object.prototype.hasOwnProperty.call(reference, 'type')) {
        txt += 'TY  - ' + reference.type + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'abstract')) {
        txt += 'AB  - ' + reference.abstract + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'title')) {
        txt += 'TI  - ' + reference.title + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        var cnt = 1
        for (let a of reference.authors) {
          txt += `A${cnt}  - ` + a + '\r\n'
          cnt++
        }
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'publication_year')) {
        txt += 'PY  - ' + reference.publication_year + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'database')) {
        txt += 'DB  - ' + reference.database + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'volume_number')) {
        txt += 'VL  - ' + reference.volume_number + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'url')) {
        txt += 'UR  - ' + reference.url + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'start_page')) {
        txt += 'SP  - ' + reference.start_page + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'isbn_issn')) {
        txt += 'SN  - ' + reference.isbn_issn + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'date')) {
        txt += 'DA  - ' + reference.date + '\r\n'
      }
      if (Object.prototype.hasOwnProperty.call(reference, 'user_definable')) {
        var count = 1
        for (let c of reference.user_definable) {
          txt += `C${count} - ` + c + '\r\n'
          count++
        }
      }
      txt += 'ER  - ' + '\r\n'
      return txt
    },
    exportToRIS: function () {
      const _refs = JSON.parse(JSON.stringify(this.references))
      let content = ''
      for (let ref of _refs) {
        content += this.processRIS(ref)
      }

      var element = document.createElement('a')
      element.setAttribute('href', 'data:text/text;charset=utf-8,' + encodeURI(content))
      element.setAttribute('download', 'references.ris')
      element.click()
    },
    confirmRemoveReferenceById: function (refId) {
      let lists = JSON.parse(JSON.stringify(this.lists))
      let _charsOfStudies = JSON.parse(JSON.stringify(this.charsOfStudies))
      let _assessments = JSON.parse(JSON.stringify(this.methodologicalTableRefs))
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

      if (Object.prototype.hasOwnProperty.call(_charsOfStudies, 'id')) {
        if (_charsOfStudies.items.length) {
          let items = []

          for (let item of _charsOfStudies.items) {
            if (item.ref_id !== refId) {
              items.push(item)
            }
          }
          _charsOfStudies.items = items

          requests.push(axios.patch(`/api/isoqf_characteristics/${_charsOfStudies.id}`, _charsOfStudies))
        }
      }

      if (Object.prototype.hasOwnProperty.call(_assessments, 'id')) {
        if (_assessments.items.length) {
          let items = []

          for (let item of _assessments.items) {
            if (item.ref_id !== refId) {
              items.push(item)
            }
          }
          _assessments.items = items

          requests.push(axios.patch(`/api/isoqf_assessments/${_assessments.id}`, _assessments))
        }
      }

      for (let o of objs) {
        requests.push(axios.patch(`/api/isoqf_lists/${o.id}`, {references: o.references}))
      }

      if (requests.length) {
        axios.all(requests)
          .then(axios.spread())
      }

      axios.delete(`/api/isoqf_references/${refId}`)
        .then(() => {
          this.getReferences(false)
          this.openModalReferencesSingle(false)
          this.getProject()
        })
    },
    getAuthorsFormat: function (authors = [], pubYear = '') {
      if (authors.length) {
        const nroAuthors = authors.length
        if (nroAuthors === 1) {
          return authors[0].split(',')[0] + ' ' + pubYear
        } else if (nroAuthors === 2) {
          return authors[0].split(',')[0] + ' & ' + authors[1].split(',')[0] + ' ' + pubYear
        } else {
          return authors[0].split(',')[0] + ' et al. ' + ' ' + pubYear
        }
      } else {
        return 'author(s) not found'
      }
    },
    deleteFieldFromCharsSudies: function (index) {
      let fields = JSON.parse(JSON.stringify(this.charsOfStudiesFieldsModal.fields))
      let params = {}
      params.fields = [{'key': 'ref_id', 'label': 'Reference ID'}, {'key': 'authors', 'label': 'Author(s), Year'}]

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
      _fields.splice(1, 0, { 'key': 'authors', 'label': 'Author(s), Year' })

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
          this.printErrors(error)
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
    getCharacteristics: function () {
      this.charsOfStudiesTableSettings.isBusy = true
      axios.get(`/api/isoqf_characteristics?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`)
        .then((response) => {
          if (response.data.length) {
            this.charsOfStudies = response.data[0]
            if (Object.prototype.hasOwnProperty.call(this.charsOfStudies, 'fields')) {
              this.charsOfStudies.fieldsObj = [{ 'key': 'authors', 'label': 'Author(s), Year' }]

              const fields = JSON.parse(JSON.stringify(this.charsOfStudies.fields))
              const items = JSON.parse(JSON.stringify(this.charsOfStudies.items))

              const _items = items.sort((a, b) => a.authors.localeCompare(b.authors))
              this.charsOfStudies.items = _items

              this.charsOfStudiesFieldsModal.fields = []
              for (let f of fields) {
                if (f.key !== 'ref_id' && f.key !== 'authors' && f.key !== 'actions') {
                  this.charsOfStudiesFieldsModal.fields.push(f.label)
                  this.charsOfStudies.fieldsObj.push({ key: f.key, label: f.label })
                }
              }

              this.charsOfStudies.fieldsObj.push({'key': 'actions', 'label': ''})

              this.charsOfStudiesFieldsModal.nroColumns = (this.charsOfStudies.fieldsObj.length === 2) ? 1 : this.charsOfStudies.fieldsObj.length - 2

              for (let item of _items) {
                this.charsOfStudiesFieldsModal.items.push(item)
              }
            }
            this.charsOfStudiesTableSettings.isBusy = false
          } else {
            this.charsOfStudies = { fields: [], items: [], authors: '', fieldsObj: [ { key: 'authors', label: 'Author(s), Year' } ] }
          }
        })
    },
    getMethodological: function () {
      this.methodologicalTableRefsTableSettings.isBusy = true
      axios.get(`/api/isoqf_assessments?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`)
        .then((response) => {
          if (response.data.length) {
            this.methodologicalTableRefs = response.data[0]
            if (Object.prototype.hasOwnProperty.call(this.methodologicalTableRefs, 'fields')) {
              const fields = JSON.parse(JSON.stringify(this.methodologicalTableRefs.fields))
              const items = JSON.parse(JSON.stringify(this.methodologicalTableRefs.items))

              const _items = items.sort((a, b) => a.authors.localeCompare(b.authors))
              this.methodologicalTableRefs.items = _items

              this.methodologicalTableRefs.fieldsObj = [{ 'key': 'authors', 'label': 'Author(s), Year' }]
              this.methodologicalFieldsModal.fields = []

              for (let f of fields) {
                if (f.key !== 'ref_id' && f.key !== 'authors' && f.key !== 'actions') {
                  this.methodologicalFieldsModal.fields.push(f.label)
                  this.methodologicalTableRefs.fieldsObj.push({ key: f.key, label: f.label })
                }
              }
              this.methodologicalTableRefs.fieldsObj.push({'key': 'actions', 'label': ''})

              this.methodologicalFieldsModal.nroColumns = (this.methodologicalTableRefs.fieldsObj.length === 2) ? 1 : this.methodologicalTableRefs.fieldsObj.length - 2

              for (let item of _items) {
                this.methodologicalFieldsModal.items.push(item)
              }

              this.methodologicalTableRefsTableSettings.isBusy = false
            }
          } else {
            this.methodologicalTableRefs = { fields: [], items: [], authors: '', fieldsObj: [ { key: 'authors', label: 'Author(s), Year' } ] }
          }
        })
    },
    addDataCharsOfStudies: function (index = 0) {
      let items = JSON.parse(JSON.stringify(this.charsOfStudies.items))

      this.charsOfStudiesFieldsModal.items = items
      this.charsOfStudiesFieldsModal.selected_item_index = index
      this.$refs['edit-chars-of-studies-data'].show()
    },
    loadTableImportData: function (event) {
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        this.pre_ImportDataTable = e.target.result
      }
      reader.readAsText(file)
    },
    saveImportedData: function (endpoint = '') {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id,
        fields: this.importDataTable.fields,
        items: this.importDataTable.items
      }
      if (this.importDataTable.fields.length && this.importDataTable.items.length) {
        if (endpoint === 'isoqf_characteristics') {
          this.charsOfStudiesTableSettings.isBusy = true
          if (this.charsOfStudies.items.length) {
            this.cleanImportedData(this.charsOfStudies.id, endpoint, params)
          } else {
            this.insertImportedData(endpoint, params)
          }
        }
        if (endpoint === 'isoqf_assessments') {
          this.methodologicalTableRefsTableSettings.isBusy = true
          if (this.methodologicalTableRefs.items.length) {
            this.cleanImportedData(this.methodologicalTableRefs.id, endpoint, params)
          } else {
            this.insertImportedData(endpoint, params)
          }
        }
      }
      this.importDataTable = {
        error: null,
        fields: [],
        items: [],
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      }
      this.pre_ImportDataTable = ''
    },
    cleanVars: function (str = '', modal) {
      this.importDataTable = {
        error: null,
        fields: [],
        items: [],
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      }
      this.pre_ImportDataTable = ''
      if (str === 'chars') {
        this.$refs['import-chars-table-file'].reset()
      }
      if (str === 'meth') {
        this.$refs['import-meth-table-file'].reset()
      }
      if (str === 'close') {
        const _modal = (modal === 'modal-chars') ? 'import-characteristics-table' : 'import-methodological-table'
        this.$refs[_modal].hide()
      }
    },
    cleanImportedData: function (id = '', endpoint = '', params = {}) {
      axios.delete(`/api/${endpoint}/${id}`)
        .then(() => {
          this.pre_ImportDataTable = ''
          this.insertImportedData(endpoint, params)
        })
    },
    insertImportedData: function (endpoint = '', params = {}) {
      const modal = (endpoint === 'isoqf_characteristics') ? 'import-characteristics-table' : 'import-methodological-table'
      axios.post(`/api/${endpoint}/`, params)
        .then(() => {
          this.getProject()
          this.$refs[modal].hide()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    removeItemCharOfStudies: function (index, id) {
      this.removeReferenceCharsOfStudies = {
        id: null,
        findings: []
      }
      let lists = JSON.parse(JSON.stringify(this.lists))

      this.removeReferenceCharsOfStudies.id = id
      this.removeReferenceCharsOfStudies.index = index

      for (let list of lists) {
        for (let ref of list.references) {
          if (id === ref) {
            this.removeReferenceCharsOfStudies.findings.push(list.isoqf_id)
          }
        }
      }
      this.$refs['removeContentModalCharsOfStudies'].show()
    },
    openModcontent: function (edit = false) {
      let _fields = JSON.parse(JSON.stringify(this.methodologicalTableRefs.fields))
      let fields = []
      const excluded = ['ref_id', 'authors', 'actions']
      for (let field of _fields) {
        if (!excluded.includes(field.key)) {
          fields.push(field)
        }
      }

      if (edit) {
        this.methodologicalFieldsModalEdit.fields = fields
        this.methodologicalFieldsModalEdit.nroColumns = fields.length
        this.$refs['open-methodological-table-modal-edit'].show()
      } else {
        this.methodologicalFieldsModal.fields = fields
        this.$refs['open-methodological-table-modal'].show()
      }
    },
    deleteFieldFromMethodological: function (index) {
      let params = {}
      const _fields = JSON.parse(JSON.stringify(this.methodologicalFieldsModalEdit.fields))
      const _items = JSON.parse(JSON.stringify(this.methodologicalTableRefs.items))

      let removedField = _fields.splice(index, 1)[0]

      _fields.splice(0, 0, { 'key': 'ref_id', 'label': 'Reference ID' })
      _fields.splice(1, 0, { 'key': 'authors', 'label': 'Author(s), Year' })

      for (let item of _items) {
        if (Object.prototype.hasOwnProperty.call(item, removedField.key)) {
          delete item[removedField.key]
        }
      }

      params.fields = _fields
      params.items = _items

      axios.patch(`/api/isoqf_assessments/${this.methodologicalTableRefs.id}`, params)
        .then((response) => {
          let _fields = JSON.parse(JSON.stringify(response.data['$set'].fields))
          const excluded = ['ref_id', 'authors', 'actions']
          let editFields = []
          for (let field of _fields) {
            if (!excluded.includes(field.key)) {
              editFields.push(field)
            }
          }

          this.methodologicalFieldsModalEdit.fields = editFields
          this.methodologicalFieldsModalEdit.nroColumns = editFields.length
          this.getProject()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    addDataMethodological: function (index = 0) {
      let items = JSON.parse(JSON.stringify(this.methodologicalTableRefs.items))

      this.methodologicalFieldsModal.items = items
      this.methodologicalFieldsModal.selected_item_index = index
      this.$refs['edit-methodological-data'].show()
    },
    removeItemMethodological: function (index, id) {
      this.removeReferenceMethodological = {
        id: null,
        findings: []
      }
      let lists = JSON.parse(JSON.stringify(this.lists))

      this.removeReferenceMethodological.id = id
      this.removeReferenceMethodological.index = index

      for (let list of lists) {
        for (let ref of list.references) {
          if (id === ref) {
            this.removeReferenceMethodological.findings.push(list.isoqf_id)
          }
        }
      }
      this.$refs['removeReferenceModalMethodological'].show()
    },
    cleanRemoveReferenceMethodological: function () {
      this.removeReferenceMethodological = {
        id: null,
        findings: []
      }
    },
    findRelatedFindings: function (refId = null) {
      if (refId) {
        let findings = []
        for (let list of this.lists) {
          for (let ref of list.raw_ref) {
            if (ref.id === refId) {
              findings.push(`#${list.isoqf_id}`)
            }
          }
        }
        if (findings.length) {
          return 'The findings affected are: ' + findings.join(', ')
        } else {
          return 'No findings will be affected.'
        }
      }
    },
    confirmRemoveAllReferences: function (event) {
      event.preventDefault()
      this.appearMsgRemoveReferences = true
      this.disableBtnRemoveAllRefs = true
    },
    removeAllReferences: function () {
      this.loadReferences = true
      this.$refs['modal-references'].hide()
      let _lists = JSON.parse(JSON.stringify(this.lists))
      const _charsOfStudies = JSON.parse(JSON.stringify(this.charsOfStudies))
      const _assessments = JSON.parse(JSON.stringify(this.methodologicalTableRefs))
      const _references = JSON.parse(JSON.stringify(this.references))
      let requests = []

      if (Object.prototype.hasOwnProperty.call(_charsOfStudies, 'id')) {
        requests.push(axios.delete(`/api/isoqf_characteristics/${_charsOfStudies.id}`))
      }
      if (Object.prototype.hasOwnProperty.call(_assessments, 'id')) {
        requests.push(axios.delete(`/api/isoqf_assessments/${_assessments.id}`))
      }
      for (let reference of _references) {
        requests.push(axios.delete(`/api/isoqf_references/${reference.id}`))
      }

      let _requestFindings = []
      for (let list of _lists) {
        _requestFindings.push(axios.get(`/api/isoqf_findings?organization=${this.$route.params.org_id}&list_id=${list.id}`))
        list.references = []
        axios.patch(`/api/isoqf_lists/${list.id}`, list)
          .then(() => {})
          .catch((error) => {
            this.printErrors(error)
          })
      }
      if (_requestFindings.length) {
        axios.all(_requestFindings)
          .then((responses) => {
            let getExtractedData = []
            for (let response of responses) {
              let finding = response.data[0]
              getExtractedData.push(axios.get(`/api/isoqf_extracted_data?organization=${this.$route.params.org_id}&finding_id=${finding.id}`))
            }
            if (getExtractedData.length) {
              this.getAndDeleteExtractedData(getExtractedData)
            }
          })
          .catch((error) => {
            this.printErrors(error)
          })
      }
      axios.all(requests)
        .then(() => {
          this.getReferences()
          this.openModalReferencesSingle(false)
          this.getProject()
          this.resetData()
        })
    },
    getAndDeleteExtractedData: function (requests) {
      if (requests.length) {
        axios.all(requests)
          .then((responses) => {
            for (let response of responses) {
              let data = response.data[0]
              axios.patch(`/api/isoqf_extracted_data/${data.id}`, { items: [] })
                .then((response) => {})
                .catch((error) => {
                  this.printErrors(error)
                })
            }
          })
      }
    },
    editModalFindingName: function (data) {
      this.editFindingName.index = data.index
      this.editFindingName.id = data.item.id
      this.editFindingName.name = data.item.name
      this.editFindingName.category = data.item.category
      this.editFindingName.notes = data.item.notes

      const params = {
        organization: this.$route.params.org_id,
        list_id: data.item.id
      }
      axios.get('/api/isoqf_findings', {params})
        .then((response) => {
          this.editFindingName.finding_id = response.data[0].id
        })
        .catch((error) => {
          this.printErrors(error)
        })
      this.$refs['edit-finding-name'].show()
    },
    updateListName: function () {
      this.table_settings.isBusy = true
      let _lists = JSON.parse(JSON.stringify(this.lists))
      let _item = {}
      _item.is_public = false
      if (this.project.is_public) {
        _item.is_public = true
      }
      for (let item of _lists) {
        if (item.id === this.editFindingName.id) {
          _item = item
          _item.name = this.editFindingName.name
          _item.category = this.editFindingName.category
          _item.notes = this.editFindingName.notes
        }
      }

      axios.patch(`/api/isoqf_lists/${this.editFindingName.id}`, _item)
        .then(() => {
          this.updateFinding(this.editFindingName)
          this.getLists()
          this.updateModificationTime()
        })
        .catch((error) => {
          this.printErrors(error)
        })
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
        .then(() => {})
        .catch((error) => {
          this.printErrors(error)
        })
    },
    removeModalFinding: function (index) {
      const list = this.lists[index]
      axios.get(`/api/isoqf_lists/${list.id}`)
        .then((response) => {
          this.editFindingName.index = index
          this.editFindingName.name = response.data.name
          const params = {
            organization: this.$route.params.org_id,
            list_id: response.data.id
          }
          axios.get('/api/isoqf_findings', {params})
            .then((response) => {
              this.editFindingName.finding_id = response.data[0].id
            })
            .catch((error) => {
              this.printErrors(error)
            })
          this.$refs['remove-finding'].show()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    confirmRemoveList: function () {
      const index = this.editFindingName.index
      const _list = JSON.parse(JSON.stringify(this.lists[index]))
      axios.delete(`/api/isoqf_lists/${_list.id}`)
        .then(() => {
          this.confirmRemoveFinding(this.editFindingName.finding_id)
          this.getLists()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    confirmRemoveFinding: function (findingID) {
      axios.delete(`/api/isoqf_findings/${findingID}`)
        .then(() => {
          this.deleteExtractedData(findingID)
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    resetData: function () {
      this.charsOfStudiesFieldsModal.nroColumns = 1
      this.charsOfStudiesFieldsModal.selected_item_index = 0
      this.charsOfStudiesFieldsModalEditnroColumns = 1
      this.charsOfStudiesFieldsModalEditfields = []
      this.charsOfStudiesFieldsModalEditmainFields = []
    },
    getListCategories: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get('/api/isoqf_list_categories', { params })
        .then((response) => {
          if (response.data.length) {
            let options = JSON.parse(JSON.stringify(response.data))
            options.sort((a, b) => a.text.localeCompare(b.text))
            let _options = JSON.parse(JSON.stringify(options))
            options.splice(0, 0, {id: null, text: 'No group'})
            this.list_categories.options = options
            this.modal_edit_list_categories.options = _options
          } else {
            this.list_categories.options = []
            this.modal_edit_list_categories.options = []
          }
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    saveListCategoryName: function () {
      const params = {
        text: this.list_category.name,
        extra_info: this.list_category.extra_info,
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.post('/api/isoqf_list_categories', params)
        .then((response) => {
          this.list_categories.options = response.data
          this.list_categories.selected = null
          this.list_categories.skip = false
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    modalListCategories: function () {
      this.getListCategories()
      this.$refs['modalEditListCategories'].show()
    },
    saveNewCategory: function () {
      const params = {
        text: this.modal_edit_list_categories.text,
        extra_info: this.modal_edit_list_categories.extra_info,
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }

      axios.post('/api/isoqf_list_categories', params)
        .then(() => {
          this.getListCategories()
          this.getLists()
          this.modal_edit_list_categories.new = false
          this.modal_edit_list_categories.text = ''
          this.modal_edit_list_categories.extra_info = ''
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    editListCategoryName: function (index) {
      let _options = JSON.parse(JSON.stringify(this.modal_edit_list_categories.options))

      this.modal_edit_list_categories.text = _options[index].text
      this.modal_edit_list_categories.extra_info = _options[index].extra_info
      this.modal_edit_list_categories.edit = true
      this.modal_edit_list_categories.index = index
      this.modal_edit_list_categories.id = _options[index].id
    },
    updateCategoryName: function () {
      const objID = this.modal_edit_list_categories.id

      if (objID) {
        const params = {
          text: this.modal_edit_list_categories.text,
          extra_info: this.modal_edit_list_categories.extra_info
        }
        axios.patch(`/api/isoqf_list_categories/${objID}`, params)
          .then(() => {
            this.getListCategories()
            this.getLists()
            this.modal_edit_list_categories.edit = false
            this.modal_edit_list_categories.text = ''
            this.modal_edit_list_categories.extra_info = ''
            this.modal_edit_list_categories.index = null
            this.modal_edit_list_categories.id = null
          })
          .catch((error) => {
            this.printErrors(error)
          })
      }
    },
    removeListCategory: function (data) {
      const index = data.index
      let _options = JSON.parse(JSON.stringify(this.modal_edit_list_categories.options))

      this.modal_edit_list_categories.text = _options[index].text
      this.modal_edit_list_categories.extra_info = _options[index].extra_info
      this.modal_edit_list_categories.remove = true
      this.modal_edit_list_categories.index = index
      this.modal_edit_list_categories.id = data.item.id
    },
    removeCategory: function () {
      const objID = this.modal_edit_list_categories.id
      const index = this.modal_edit_list_categories.index
      const _options = JSON.parse(JSON.stringify(this.modal_edit_list_categories.options))
      const deletedItem = _options.splice(index, 1)

      if (objID) {
        axios.delete(`/api/isoqf_list_categories/${objID}`)
          .then(() => {
            this.getListCategories()
            this.updateLists(deletedItem)
            this.modal_edit_list_categories.remove = false
            this.modal_edit_list_categories.text = ''
            this.modal_edit_list_categories.extra_info = ''
            this.modal_edit_list_categories.index = null
            this.modal_edit_list_categories.id = null
          })
          .catch((error) => {
            this.printErrors(error)
          })
      }
    },
    modalCancelCategoryButtons: function () {
      this.modal_edit_list_categories.new = false
      this.modal_edit_list_categories.edit = false
      this.modal_edit_list_categories.remove = false
      this.modal_edit_list_categories.text = ''
      this.modal_edit_list_categories.extra_info = ''
      this.modal_edit_list_categories.index = null
      this.modal_edit_list_categories.id = null
    },
    modalChangePublicStatus: function () {
      this.modal_project = JSON.parse(JSON.stringify(this.project))
      if (!Object.prototype.hasOwnProperty.call(this.project, 'license_type')) {
        this.modal_project.license_type = 'CC-BY-NC-ND'
      }
      this.$refs['modal-change-status'].show()
    },
    savePublicStatus: function (event) {
      event.preventDefault()
      this.ui.publish.showLoader = true
      let params = {}
      params.private = true
      params.is_public = false
      params.public_type = this.modal_project.public_type
      params.license_type = this.modal_project.license_type
      if (this.modal_project.public_type !== 'private') {
        params.private = false
        params.is_public = true
      } else {
        params.license_type = ''
      }

      let lists = JSON.parse(JSON.stringify(this.lists))
      let _requests = []
      for (let list of lists) {
        _requests.push(axios.patch(`/api/isoqf_lists/${list.id}`, params))
      }
      let findings = JSON.parse(JSON.stringify(this.findings))
      for (let index in findings) {
        _requests.push(axios.patch(`/api/isoqf_findings/${findings[index]}`, params))
        axios.get(`/api/isoqf_extracted_data?organization=${this.$route.params.org_id}&finding_id=${findings[index]}`)
          .then((response) => {
            if (response.data.length) {
              _requests.push(axios.patch(`/api/isoqf_extracted_data/${response.data[0].id}`, { is_public: params.is_public }))
            }
          })
      }

      let otherParams = {}
      otherParams.is_public = false
      if (this.modal_project.public_type !== 'private') {
        otherParams.is_public = true
      }

      let references = JSON.parse(JSON.stringify(this.references))
      for (let ref of references) {
        _requests.push(axios.patch(`/api/isoqf_references/${ref.id}`, otherParams))
      }
      let characteristicTable = JSON.parse(JSON.stringify(this.charsOfStudies))
      _requests.push(axios.patch(`/api/isoqf_characteristics/${characteristicTable.id}`, otherParams))
      let methodologicalTable = JSON.parse(JSON.stringify(this.methodologicalTableRefs))
      _requests.push(axios.patch(`/api/isoqf_assessments/${methodologicalTable.id}`, otherParams))

      axios.all(_requests)
        .then(axios.spread(() => {
          axios.patch(`/api/isoqf_projects/${this.project.id}`, params)
            .then(() => {
              this.modal_project = {}
              this.getProject()
              this.ui.publish.showLoader = false
              this.$refs['modal-change-status'].hide()
            })
            .catch((error) => {
              this.printErrors(error)
            })
        }))
        .catch((error) => {
          this.printErrors(error)
        })
    },
    exportTableToCSV: function (type) {
      const _types = ['chars_of_studies', 'meth_assessments']
      let _headers = []
      let headers = []
      let _items = []
      let items = []

      if (_types.indexOf(type) !== -1) {
        switch (type) {
          case 'chars_of_studies':
            _headers = JSON.parse(JSON.stringify(this.charsOfStudies.fields))
            _items = JSON.parse(JSON.stringify(this.charsOfStudies.items))
            break
          case 'meth_assessments':
            _headers = JSON.parse(JSON.stringify(this.methodologicalTableRefs.fields))
            _items = JSON.parse(JSON.stringify(this.methodologicalTableRefs.items))
            break
          default:
            _headers = []
            _items = []
            break
        }

        let keys = []
        for (let f of _headers) {
          if (f.key !== 'ref_id' && f.key !== 'id') {
            headers.push('"' + f.label + '"')
            keys.push(f.key)
          }
        }

        for (let i of _items) {
          let item = {}
          for (let k in keys) {
            if (Object.prototype.hasOwnProperty.call(i, keys[k])) {
              item[keys[k]] = i[keys[k]]
            } else {
              item[keys[k]] = ''
            }
          }
          items.push(item)
        }
      }
      const options = {
        filename: type,
        fieldSeparator: ',',
        quoteStrings: '"',
        decimalSeparator: '.',
        showLabels: true,
        useBom: true,
        headers: headers
      }
      const csvExporter = new ExportCSV(options)
      csvExporter.generateCsv(items)
    },
    updateLists: function (deletedCategoryValue) {
      let _lists = JSON.parse(JSON.stringify(this.lists))
      let _request = []
      for (let list of _lists) {
        if (list.category === deletedCategoryValue[0].id) {
          list.category = null
          _request.push(axios.patch(`/api/isoqf_lists/${list.id}`, list))
        }
      }
      axios.all(_request)
        .then(axios.spread(() => {
          this.getLists()
        }))
    },
    modalSortFindings: function () {
      let _lists = JSON.parse(JSON.stringify(this.lists))
      _lists.sort(function (a, b) {
        if (a.sort < b.sort) {
          return -1
        }
        if (a.sort > b.sort) {
          return 1
        }
        return 0
      })
      this.sorted_lists = _lists
      this.$refs['modal-sort-findings'].show()
    },
    saveSortedLists: function () {
      let cnt = 1
      let requests = []
      for (let list of this.sorted_lists) {
        list.isoqf_id = cnt
        list.sort = cnt
        requests.push(axios.patch(`/api/isoqf_lists/${list.id}`, {'isoqf_id': cnt, 'sort': cnt}))
        cnt++
      }

      axios.all(requests)
        .then(axios.spread(() => {
          this.getLists()
        }))
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getCategoryName: function (id) {
      const _categories = JSON.parse(JSON.stringify(this.list_categories))
      let _category = ''
      for (let category of _categories.options) {
        if (category.value === id) {
          _category = category.text
        }
      }
      return _category
    },
    printErrors: function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data)
        console.log(error.response.status)
        console.log(error.response.headers)
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request)
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message)
      }
      console.log(error.config)
    },
    createExtractedData: function (findingID) {
      const _references = JSON.parse(JSON.stringify(this.references))
      let params = {
        fields: [
          { key: 'ref_id', label: 'Reference ID' },
          { key: 'authors', label: 'Author(s), Year' },
          { key: 'column_0', label: 'Extracted data supporting the review finding' }
        ],
        items: [],
        organization: this.$route.params.org_id,
        finding_id: findingID
      }

      for (let reference of _references) {
        params.items.push({ 'ref_id': reference.id, 'authors': this.parseReference(reference, true), 'column_0': '' })
      }

      axios.post('/api/isoqf_extracted_data', params)
        .then()
        .catch((error) => {
          this.printErrors(error)
        })
    },
    deleteExtractedData: function (findingID) {
      const params = {
        organization: this.$route.params.org_id,
        finding_id: findingID
      }
      axios.get('/api/isoqf_extracted_data', {params})
        .then((response) => {
          axios.delete(`/api/isoqf_extracted_data/${response.data[0].id}`)
            .then(() => {
              this.getLists()
            })
            .catch((error) => {
              this.printErrors(error)
            })
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    countDownChanged (dismissCountDown) {
      if (this.ui.project.type === 'inclusion') {
        this.ui.project.inclusion.success.dismissCountDown = dismissCountDown
      }
      if (this.ui.project.type === 'exclusion') {
        this.ui.project.exclusion.success.dismissCountDown = dismissCountDown
      }
    },
    nextTab () {
      window.scrollTo({ 'top': 0, 'behavior': 'smooth' })
    },
    toggleSearch (show) {
      if (show) {
        this.ui.project.displaySearch = false
      } else {
        this.ui.project.displaySearch = true
      }
      this.table_settings.filter = ''
      window.scrollTo({ top: 500, behavior: 'smooth' })
    },
    tableFilter (txt, filter) {
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
    cleanTableFilter () {
      this.ui.project.showFilterOne = false
      this.ui.project.showFilterTwo = false
      this.ui.project.showFilterThree = false
      this.table_settings.filter = ''
    },
    checkPermissions: function (type = 'can_write') {
      if (this.$store.state.user.personal_organization === this.$route.params.org_id) {
        return true
      } else {
        if (!Object.prototype.hasOwnProperty.call(this.project, type)) {
          return false
        }
        if (this.project[type].includes(this.$store.state.user.id)) {
          return true
        }
      }
      return false
    },
    updateModificationTime: function () {
      const params = {
        last_update: Date.now()
      }
      axios.patch(`/api/isoqf_projects/${this.$route.params.id}`, params)
        .then()
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getUserInfo: function (userId) {
      axios.get(`/users/${userId}`)
        .then((response) => {
          this.editingUser = response.data
          this.editingUser.show = true
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    updateMyDataTables: function () {
      let _itemsChars = []
      let _itemsMeth = []

      axios.get(`/api/isoqf_characteristics?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`)
        .then((response) => {
          if (response.data.length && response.data[0].items.length && this.references.length > response.data[0].items.length) {
            let _items = response.data[0].items
            let _itemsChecks = []
            for (let item of _items) {
              _itemsChecks.push(item.ref_id)
            }
            for (let reference of this.references) {
              if (!_itemsChecks.includes(reference.id)) {
                _itemsChars.push({ref_id: reference.id, authors: this.parseReference(reference, true, false)})
              }
            }
            _items.push(..._itemsChars)
            let params = {
              items: _items
            }
            axios.patch(`/api/isoqf_characteristics/${response.data[0].id}`, params)
              .then(() => {
                this.getCharacteristics()
              })
          }
        })

      axios.get(`/api/isoqf_assessments?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`)
        .then((response) => {
          if (response.data.length && response.data[0].items.length && this.references.length > response.data[0].items.length) {
            let _items = response.data[0].items
            let _itemsChecks = []
            for (let item of _items) {
              _itemsChecks.push(item.ref_id)
            }
            for (let reference of this.references) {
              if (!_itemsChecks.includes(reference.id)) {
                _itemsMeth.push({ref_id: reference.id, authors: this.parseReference(reference, true, false)})
              }
            }
            _items.push(..._itemsMeth)
            let params = {
              items: _items
            }
            axios.patch(`/api/isoqf_assessments/${response.data[0].id}`, params)
              .then(() => {
                this.getMethodological()
              })
          }
        })
    },
    restoreEpisteResponse: function () {
      this.episte_response = []
    },
    changeLoadReferencesStatus: function (status) {
      this.loadReferences = status
    }
  },
  computed: {
    getLicense: {
      get: function () {
        if (!Object.prototype.hasOwnProperty.call(this.modal_project, 'license_type')) {
          return 'CC-BY-NC-ND'
        } else {
          if (this.modal_project.license_type === '') {
            return 'CC-BY-NC-ND'
          } else {
            return this.modal_project.license_type
          }
        }
      },
      set: function (license) {
        this.modal_project.license_type = license
      }
    }
  }
}
</script>

<style scoped>
  .return {
    font-size: 1.2rem;
  }
  div >>>
    h2>span>svg,
    h3>span>svg,
    h4>span>svg {
      font-size: 1rem;
    }
  div >>>
    .nav-fill .nav-item {
      text-transform: uppercase;
      font-weight: bold;
    }
  div >>>
    a.table-edit-list {
      color: #000;
      text-decoration: underline;
    }
  div >>>
    #chars-of-studies-table thead th:first-child {
      width: 25%;
    }
    /* #chars-of-studies-table tbody tr td button {
      display: none;
    }
    #chars-of-studies-table tbody tr:hover td button {
      display: inline;
    } */
  div >>>
    #methodological-table thead th:first-child {
      width: 25%;
    }
    /* #methodological-table tbody tr td button {
      display: none;
    }
    #methodological-table tbody tr:hover td button {
      display: inline;
    } */
  div >>>
    #extracted-data-table thead th:first-child {
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
    .text-danger.remove-opt {
      cursor: pointer;
    }
  div >>>
    #findings-print.table thead th {
      width: 15%;
    }
  div >>>
    #findings-print.table thead th:nth-child(2) {
      width: 35%;
    }
  div >>>
    #findings-print.table thead th:first-child {
      width: 5%;
    }
  div >>>
    #findings-print.table thead th:last-child {
      width: 15%;
    }
  div >>>
    table#findings-print tbody tr td a {
      color: #000;
    }
  div >>>
    table .references {
      font-size: 12px;
    }
  div >>>
    #export-button button:first-child {
      width: 100%;
    }
  div >>>
    #export-button ul {
      width: 100%;
    }
  div >>>
    #findings.table tbody td li {
      font-size: 0.8rem;
      padding-top: 0.4rem;
      list-style-type: none;
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
    #dropdown-categories .btn-secondary {
      color: #495057;
      background-color: transparent;
      border-color: transparent;
    }
  div >>>
    #dropdown-cerqual-option .btn-secondary {
      color: #495057;
      background-color: transparent;
      border-color: transparent;
    }
  div >>>
    #dropdown-cerqual-explanation .btn-secondary {
      color: #495057;
      background-color: transparent;
      border-color: transparent;
    }
  div >>>
    #import-data a.nav-link {
      display: block;
      padding: .5rem 1rem;
    }
  div >>>
    #tabsContent .nav-link {
      display: none;
      padding: 0;
    }
    #tabsContent ul {
      border-bottom: 0px;
    }
    #tabsTitle {
      border-bottom: 1px solid #bbb;
    }
    #tabsTitle a {
      color: #3d3d3d;
    }
    #tabsTitle li:first-child,
    #tabsTitle li:last-child {
      margin-left: 0px;
      margin-right: 0px;
    }
    #tabsTitle li {
      border-top: 2px;
      border-left: 2px;
      border-right: 2px;
      border-color: #bbb;
      border-style: solid;
      border-bottom: 0px;
      margin-left: 5px;
      margin-right: 5px;
    }
    .card-header {
      padding: .5rem .5rem 0 .5rem;
    }
    b.cerqual-explanation {
      font-size: 13px;
    }
    #card-search .card-body {
      padding: .3rem;
    }
  div >>>
    #modal-publish-license > .custom-control-inline {
      padding-bottom: 0.6rem;
    }
  @media print {
    div >>>
      #info-project {
        display: block !important;
      }
    div >>>
      #findings tbody tr:not(.b-table-row-selected) {
        display: none !important;
      }
    div >>>
      ul.nav.nav-tabs.nav-fill {
        display: none !important;
      }
  }
</style>
