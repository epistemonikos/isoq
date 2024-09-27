<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="pt-5">
        <b-row align-h="end">
          <b-col
            class="text-right">
            <b-link :to="{ name: 'viewOrganization', params: { id: this.$store.state.user.personal_organization }, query: {hash: `p-${this.project.id}`}}" class="d-print-none return">
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
            @click="clickTab(0)">Project properties</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 1) ? true : false"
            @click="clickTab(1)">My Data</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 2) ? true : false"
            :disabled="(references.length) ? false : true"
            @click="clickTab(2)">iSoQ</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 3) ? true : false"
            @click="clickTab(3)">Guidance on applying GRADE-CERQual</b-nav-item>
        </b-nav>
      </b-container>
    </b-container>
    <b-container class="mb-5">
      <div :class="{'block mt-3': (tabOpened===0)?true:false, 'd-none': (tabOpened===0)?!true:!false}">
        <propertiesProject
          :project="project"
          @update-modification="updateModificationTime()"
          :canWrite="checkPermissions()">
        </propertiesProject>
      </div>
      <div :class="{'block mt-3': (tabOpened===1)?true:false, 'd-none': (tabOpened===1)?!true:!false}">
        <b-row>
          <b-col
            cols="12">
            <videoHelp txt="Add data needed to make GRADE-CERQual assessments" tag="h3" urlId="449265292"></videoHelp>
            <p>
              To optimise the functionality of iSoQ, and save you time, please add the following information organised into 4 steps.
            </p>
          </b-col>
          <b-card no-body>
            <b-tabs pills card small vertical nav-wrapper-class="w-15" content-class="w-85" class="link-steps nowrap" active-nav-item-class="btn-success" v-model="stepStage">
              <b-tab title="STEP 1: References">
                <UploadReferences
                  :checkPermissions="checkPermissions()"
                  :loadReferences="loadReferences"
                  :references="references"
                  :lists="lists"
                  :charsOfStudies="charsOfStudies"
                  :methodologicalTableRefs="methodologicalTableRefs"
                  @CallGetReferences="getReferences"
                  @statusLoadReferences="statusLoadReferences"
                  @CallGetProject="getProject"></UploadReferences>
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
                <InclusionExclusioCriteria
                  :checkPermissions="checkPermissions()"
                  :project="project"
                  :ui="ui"
                  @update-modification="updateModificationTime()"></InclusionExclusioCriteria>
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
                  @get-project="getProject"
                  @print-errors="printErrors"
                  @updateDataTable="updateDataTable"
                  @set-item-data="setItemData"
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
                  @get-project="getProject"
                  @print-errors="printErrors"
                  @updateDataTable="updateDataTable"
                  @set-item-data="setItemData"
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
                        @click="continueToIsoq">
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
      <div :class="{'block mt-3': (tabOpened===2)?true:false, 'd-none': (tabOpened===2)?!true:!false}" :disabled="(references.length) ? false : true">
        <action-buttons
          :mode="mode"
          :permissions="checkPermissions()"
          :project="project"
          :ui="ui"
          :lists="lists"
          :findings="findings"
          :references="references"
          :charsOfStudies="charsOfStudies"
          :methodologicalTableRefs="methodologicalTableRefs"
          :listsPrintVersion="lists_print_version"
          :selectOptions="select_options"
          :cerqualConfidence="cerqual_confidence"
          :printableItems="printableItems"
          @uiPublishShowLoader="uiShowLoaders"
          @getProject="getProject"
          @changeMode="changeMode"
          @changeTableSettings="changeTableSettings"></action-buttons>
        <b-row class="mb-3">
          <b-col cols="12" class="toDoc">
            <videoHelp
              :txt="title"
              :tag="'h2'"
              :urlId="'449743080'"></videoHelp>
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
            </template>
            <!-- printed version -->
            <template v-else>
              <b-table-simple
                id="findings-print"
                ref="findings-print">
                <b-thead>
                  <b-tr>
                    <!-- <b-th class="d-print-none">Printable?</b-th> -->
                    <b-th>#</b-th>
                    <b-th>Summarised review finding</b-th>
                    <b-th>GRADE-CERQual assessment of confidence</b-th>
                    <b-th>Explanation of GRADE-CERQual assessment</b-th>
                    <b-th>References</b-th>
                  </b-tr>
                </b-thead>
                <b-tbody>
                  <b-tr v-for="(item, index) of lists_print_version" :key="index" :class="{'d-print-none': !printableItems.includes(item.id)}">
                    <!-- <b-td class="d-print-none">
                      <b-form-checkbox :value="item.id" v-model="printableItems"></b-form-checkbox>
                    </b-td> -->
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
              <div class="mt-5">
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
                  <b-tr v-for="(item, index) of this.lists_print_version" :key="index" :class="{'d-print-none': !printableItems.includes(item.id)}">
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
                      {{ index + 1 }}
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
              </div>
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
      </div>
      <div :class="{'block mt-3': (tabOpened===3)?true:false, 'd-none': (tabOpened===3)?!true:!false}">
        <content-guidance></content-guidance>
      </div>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import draggable from 'vuedraggable'
import { Paragraph, TextRun, AlignmentType, TableCell, TableRow } from 'docx'

const organizationForm = () => import(/* webpackChunkName: "organizationform" */ '../organization/organizationForm.vue')
const contentGuidance = () => import(/* webpackChunkName: "contentguidance" */ '../contentGuidance.vue')
const backToTop = () => import(/* webpackChunkName: "backtotop" */ '../backToTop.vue')
const videoHelp = () => import(/* webpackChunkName: "videohelp" */ '../videoHelp.vue')
const actionButtons = () => import(/* webpackChunkName: 'actionButtons' */'./actionButtons.vue')
const propertiesProject = () => import(/* webpackChunkName: "propertiesProject" */ './propertiesProject.vue')
const UploadReferences = () => import(/* webpackChunkName: "uploadReferences" */ './UploadReferences.vue')
const InclusionExclusioCriteria = () => import(/* webpackChunkName: "inclusionExclusionCriteria" */ './InclusionExclusionCriteria.vue')

export default {
  components: {
    draggable,
    organizationForm,
    'content-guidance': contentGuidance,
    'back-to-top': backToTop,
    videoHelp,
    'action-buttons': actionButtons,
    propertiesProject,
    UploadReferences,
    InclusionExclusioCriteria,
    CharacteristicsOfStudiesTable: () => import(/* webpackChunkName: "characteristicsOfStudiesTable" */ './CharacteristicsOfStudiesTable.vue'),
    crudTables: () => import(/* webpackChunkName: "crudTables" */ '@/components/project/crudTables.vue')
  },
  data () {
    return {
      stepStage: 0,
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
        itemData: null,
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
      references: [],
      refs: [],
      loadReferences: true,
      fileReferences: [],
      selected_list_index: null,
      selected_references: [],
      lastId: 1,
      mode: 'edit',
      msgUploadReferences: '',
      charsOfStudies: {
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      },
      tabOpened: 1,
      yes_or_no: [
        { value: false, text: 'no' },
        { value: true, text: 'yes' }
      ],
      methodologicalTableRefs: {
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      },
      dismissAlertPrint: false,
      appearMsgRemoveReferences: false,
      disableBtnRemoveAllRefs: false,
      editFindingName: {
        index: null,
        id: null,
        finding_id: null,
        name: null,
        notes: null,
        editing: false
      },
      episte_request: '',
      episte_selected: [],
      episte_loading: false,
      episte_error: false,
      finding: {},
      showBanner: false,
      sorted_lists: [],
      changeTxtProjectProperties: '+',
      btnSearchPubMed: false,
      findings: [],
      editingUser: {
        show: false
      },
      printableItems: []
    }
  },
  async mounted () {
    await this.getListCategories()
    await this.getReferences()
    await this.getProject()
  },
  methods: {
    setItemData: function (data) {
      this.ui.itemData = data
    },
    getListCategories: async function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get('/api/isoqf_list_categories', { params })
        .then((response) => {
          this.processGetListCategories(response.data)
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getReferences: async function (changeTab = true) {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get(`/api/isoqf_references`, { params })
        .then(async (response) => {
          this.references = await this.processGetReferencesRaw(response.data)
          this.refs = await this.processGetReferencesWithNames(response.data)

          if (changeTab) {
            if (this.references.length) {
              this.$nextTick(() => {
                if (Object.prototype.hasOwnProperty.call(this.$route.query, 'tab')) {
                  const tabs = ['Project-Property', 'My-Data', 'iSoQ', 'Guidance-on-applying-GRADE-CERQual']
                  this.tabOpened = tabs.indexOf(this.$route.query.tab)
                  if (Object.prototype.hasOwnProperty.call(this.$route.query, 'step')) {
                    this.stepStage = parseInt(this.$route.query.step) - 1
                  }
                } else {
                  this.tabOpened = 2
                }
              })
            }
          }
          this.loadReferences = false
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getProject: async function () {
      const params = {
        organization: this.$route.params.org_id
      }
      axios.get(`/api/isoqf_projects/${this.$route.params.id}`, { params })
        .then((response) => {
          this.project = JSON.parse(JSON.stringify(response.data))
          if (!Object.prototype.hasOwnProperty.call(this.project, 'inclusion')) {
            this.project.inclusion = ''
          }
          if (!Object.prototype.hasOwnProperty.call(this.project, 'exclusion')) {
            this.project.exclusion = ''
          }
          this.ui.project.show_criteria = true
          this.getLists()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    processGetListCategories: function (data) {
      this.list_categories.options = []
      this.modal_edit_list_categories.options = []
      if (data.length) {
        let options = JSON.parse(JSON.stringify(data))
        for (let option of options) {
          if (!Object.prototype.hasOwnProperty.call(option, 'text')) {
            option.text = ''
          }
        }
        options.sort((a, b) => a.text.localeCompare(b.text))
        let modalOptions = JSON.parse(JSON.stringify(options))
        options.splice(0, 0, {id: null, text: 'No group'})
        this.list_categories.options = options
        this.modal_edit_list_categories.options = modalOptions
      }
    },
    processGetReferencesRaw: async function (references) {
      const data = JSON.parse(JSON.stringify(references))
      for (const d of data) {
        d._showDetails = false
      }
      return data
    },
    processGetReferencesWithNames: async function (references) {
      const data = JSON.parse(JSON.stringify(references))
      let refs = []

      for (const reference of data) {
        let content = await this.parseReference(reference)
        if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
          refs.push({'id': reference.id, 'content': content})
        }
      }

      if (refs.length) {
        return refs.sort((a, b) => a.content.localeCompare(b.content))
      }
      return refs
    },
    getLists: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get('/api/isoqf_lists', { params })
        .then(async (response) => {
          this.lists = await this.processLists(response)
          const lists = response.data.map((list) => { return list.id })
          this.getFindings(lists.toString())
          this.table_settings.totalRows = this.lists.length
          this.routeAnchorHash()
          this.table_settings.isBusy = false
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    routeAnchorHash: function () {
      if (this.editFindingName.id !== null || this.ui.itemData !== null || Object.prototype.hasOwnProperty.call(this.$route.query, 'hash')) {
        const hash = (this.editFindingName.id !== null) ? `#a-${this.editFindingName.id}` : (this.ui.itemData !== null) ? `#${this.ui.itemData}` : `#${this.$route.query.hash}`
        this.$router.push({
          name: 'viewProject',
          query: {
            tab: this.$route.query.tab
          },
          params: {
            organization: this.$route.params.org_id,
            id: this.$route.params.id
          },
          hash: `${hash}`
        })
        this.resetFindingName()
        this.resetItemData()
      }
    },
    resetItemData: function () {
      this.ui.itemData = null
    },
    resetFindingName: function () {
      this.editFindingName = {
        index: null,
        id: null,
        name: null,
        notes: null,
        editing: false
      }
    },
    updateDataTable: function (data, type) {
      if (type === 'isoqf_assessments') {
        this.methodologicalTableRefs = data
      } else {
        this.charsOfStudies = data
      }
    },
    statusLoadReferences: function (status) {
      this.loadReferences = status
    },
    clickTab: function (option) {
      this.tabOpened = option
      // let theHash = ''
      // switch (option) {
      //   case 0:
      //     theHash = 'Project-Property'
      //     break
      //   case 1:
      //     theHash = 'My-Data'
      //     break
      //   case 2:
      //     theHash = 'iSoQ'
      //     break
      //   case 3:
      //     theHash = 'Guidance-on-applying-GRADE-CERQual'
      //     break
      // }
      // if (Object.hasOwnProperty.call(this.$route.query, 'step')) {
      //   this.$router.push({query: {tab: `${theHash}`, step: this.$route.query.step}})
      // } else {
      //   this.$router.push({query: {tab: `${theHash}`}})
      // }
    },
    uiShowLoaders: function (status) {
      this.ui.publish.showLoader = status
    },
    changeMode: function (mode) {
      this.mode = mode
    },
    changeTableSettings: function (params) {
      this.table_settings.perPage = params.perPage
      this.table_settings.currentPage = params.currentPage
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
    parseReference: async (reference, onlyAuthors = false, hasSemicolon = true) => {
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
    processLists: async function (response) {
      let data = JSON.parse(JSON.stringify(response.data))
      if (data.length) {
        data.sort(function (a, b) {
          if (a.sort < b.sort) { return -1 }
          if (a.sort > b.sort) { return 1 }
          return 0
        })
        this.lastId = data.length + 1// parseInt(data.slice(-1)[0].isoqf_id) + 1
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
            list.category_name_filtered = ''
            list.category_extra_info = ''
            if (this.list_categories.options.length) {
              for (let category of this.list_categories.options) {
                if (list.category === category.id) {
                  list.category_name = category.text
                  // clean from special chars the category.text and store under list.category_name_filtered
                  list.category_name_filtered = category.text.replace(/[^a-zA-Z0-9]/g, '')
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
                list.ref_list = list.ref_list + await this.parseReference(r, true)
                list.raw_ref.push(r)
              }
            }
          }
        }

        if (this.list_categories.options.length) {
          let categories = []

          for (let category of this.list_categories.options) {
            if (category.id !== null) {
              categories.push({
                'name': category.text,
                'id': category.id,
                'value': category.id,
                'items': [],
                is_category: true
              })
            }
          }
          categories.push({'name': 'Uncategorised findings', 'id': 'uncategorized', 'value': null, 'items': [], is_category: true})

          for (let list of data) {
            if (categories.length) {
              for (let category of categories) {
                if (category.value === list.category) {
                  category.items.push(
                    {
                      'id': list.id,
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

        for (let items of this.lists_print_version) {
          this.printableItems.push(items.id)
        }
      }
      this.table_settings.isBusy = false
      return data
    },
    getFindings: function (listIds) {
      const params = {
        'list_ids': listIds
      }
      axios.get('/api/findings', {params})
        .then((response) => {
          if (response.data.length) {
            this.findings.push(...response.data)
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
      let sort = 1
      if (this.lists.length) {
        sort = this.lists.slice(-1)[0].sort + 1
      }
      let isPublic = false
      if (this.project.is_public) {
        isPublic = true
      }
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id,
        name: this.summarized_review,
        cerqual: { option: null, explanation: '' },
        references: [],
        category: this.list_categories.selected,
        editing: false,
        is_public: isPublic,
        sort: sort
      }
      axios.post('/api/isoqf_lists', params)
        .then((response) => {
          const listId = response.data.id
          const listName = response.data.name

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
        .then(async (response) => {
          await this.createExtractedData(response.data.id)
        })
        .catch((error) => {
          this.printErrors(error)
        })
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
            await this.getReferences(false)
            this.selected_references = data.item.references
            this.showBanner = false
            if (data.item.cerqual_option !== '') {
              this.showBanner = true
            }
            this.$refs['modal-references-list'].show()
          }
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    cleanReferencesList: function () {
      this.selected_references = []
      this.selected_list_index = null
      this.finding = {}
    },
    cancelReferencesList: function () {
      this.cleanReferencesList()
      this.$refs['modal-references-list'].hide()
    },
    saveReferencesList: function () {
      this.loadReferences = true
      this.table_settings.isBusy = true
      const index = this.selected_list_index
      const params = {
        references: this.selected_references
      }
      axios.patch(`/api/isoqf_lists/${this.lists[index].id}`, params)
        .then(async () => {
          this.updateFindingReferences(this.selected_references)
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
          this.cleanReferencesList()
          this.loadReferences = false
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    onFiltered: function (filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.table_settings.totalRows = filteredItems.length
      this.table_settings.currentPage = 1
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
    setEditFindingNameProp: function (data) {
      return {
        index: data.index,
        id: data.item.id,
        name: data.item.name,
        category: data.item.category,
        notes: data.item.notes
      }
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
          this.printErrors(error)
        })
      this.$refs['edit-finding-name'].show()
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
    updateListName: async function () {
      this.table_settings.isBusy = true
      const list = await this.processDataList()
      axios.patch(`/api/isoqf_lists/${this.editFindingName.id}`, list)
        .then(() => {
          this.updateFinding(this.editFindingName)
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
        .then(() => {
          this.getLists()
        })
        .catch((error) => {
          this.printErrors(error)
        })
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
          this.printErrors(error)
        })
      this.$refs['remove-finding'].show()
    },
    confirmRemoveList: function () {
      if (!this.editFindingName.id) {
        return
      }
      this.table_settings.isBusy = true
      axios.delete(`/api/isoqf_lists/${this.editFindingName.id}`)
        .then(() => {
          this.confirmRemoveFinding()
        })
        .catch((error) => {
          this.table_settings.isBusy = false
          this.printErrors(error)
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
          this.table_settings.isBusy = false
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
    modalListCategories: async function () {
      await this.getListCategories()
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
        .then(async () => {
          await this.getListCategories()
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
          .then(async () => {
            await this.getListCategories()
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
          .then(async () => {
            await this.getListCategories()
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
      this.table_settings.isBusy = true
      for (const list of this.sorted_lists) {
        const params = {
          'sort': cnt
        }
        requests.push(axios.patch(`/api/isoqf_lists/${list.id}`, params))
        cnt++
      }

      Promise.all(requests)
        .then((responses) => {
          for (const response of responses) {
            this.updateFindingSort(response.data.id, response.data.$set.sort)
          }
        })
        .catch((error) => {
          this.table_settings.isBusy = false
          this.printErrors(error)
        })
    },
    updateFindingSort: function (listId, sort, getList = false) {
      const params = {
        organization: this.$route.params.org_id,
        list_id: listId
      }
      axios.get('/api/isoqf_findings', {params})
        .then((reponse) => {
          const findingId = reponse.data[0].id
          const params = {
            'isoqf_id': sort,
            'evidence_profile.isoqf_id': sort
          }
          axios.patch(`/api/isoqf_findings/${findingId}`, params)
            .then(() => {
              this.getLists()
            })
            .catch((error) => {
              this.table_settings.isBusy = false
              this.printErrors(error)
            })
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
    createExtractedData: async function (findingID) {
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
        params.items.push({ 'ref_id': reference.id, 'authors': await this.parseReference(reference, true), 'column_0': '' })
      }

      axios.post('/api/isoqf_extracted_data', params)
        .then(() => {
          this.getLists()
        })
        .catch((error) => {
          this.printErrors(error)
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
              this.table_settings.isBusy = false
              this.printErrors(error)
            })
        })
        .catch((error) => {
          this.table_settings.isBusy = false
          this.printErrors(error)
        })
    },
    updateSortList: function (data) {
      const index = data.index
      this.lists.splice(index, 1)
      let querys = []
      let cnt = 1
      for (const list of this.lists) {
        querys.push(axios.patch(`/api/isoqf_lists/${list.id}`, {sort: cnt}))
        cnt++
      }
      Promise.all(querys)
        .then(() => {
          this.getLists()
        })
        .catch((error) => {
          this.table_settings.isBusy = false
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
    isFilterActive: function (val) {
      const regex = new RegExp(`^${val}$`, 'i')
      return regex.test(this.table_settings.filter)
    },
    cleanTableFilter () {
      this.ui.project.showFilterOne = false
      this.ui.project.showFilterTwo = false
      this.ui.project.showFilterThree = false
      this.table_settings.filter = ''
    },
    continueToIsoq: function () {
      this.clickTab(2)
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
    }
  },
  computed: {
    title: function () {
      let txt = ''
      if (this.mode === 'edit') {
        txt = 'Interactive '
      }
      txt = txt + 'Summary of Qualitative Findings Table'
      return txt
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
