<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="pt-5">
        <b-row align-h="end">
          <b-col
            class="text-right">
            <b-link :to="{ name: 'viewOrganization', params: { id: this.$store.state.user.personal_organization }, query: {hash: `p-${this.project.id}`}}" class="d-print-none return">
              <font-awesome-icon icon="long-arrow-alt-left" :title="$t('project.return_workspace')" />
              {{ $t('project.return_workspace') }}
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
            @click="clickTab(0)">{{ $t('project.properties') }}</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 1) ? true : false"
            @click="clickTab(1)">{{ $t('project.my_data') }}</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 2) ? true : false"
            :disabled="(references.length) ? false : true"
            @click="clickTab(2)">{{ $t('project.isoq') }}</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 3) ? true : false"
            @click="clickTab(3)">{{ $t('project.guidance_applying') }}</b-nav-item>
        </b-nav>
      </div>
    </b-container>
    <b-container fluid class="mb-5">
      <div :class="{'block mt-3': (tabOpened===0)?true:false, 'd-none': (tabOpened===0)?!true:!false}">
        <propertiesProject
          :project="project"
          @update-modification="updateModificationTime()"
          :canEdit="isEditing"
          :highlight="$route.query.highlight"
          @update-project="updateDataProject">
        </propertiesProject>
      </div>
      <div :class="{'block mt-3': (tabOpened===1)?true:false, 'd-none': (tabOpened===1)?!true:!false}">
        <b-row>
          <b-col
            cols="12">
            <videoHelp :txt="$t('modals.add_data_title')" tag="h3" urlId="449265292"></videoHelp>
            <p>
              {{ $t('project.optimize_info') }}
            </p>
          </b-col>
          <b-card no-body class="col-12">
            <b-tabs pills card small vertical nav-wrapper-class="w-15" content-class="w-85" class="link-steps nowrap" active-nav-item-class="btn-success" v-model="stepStage">
              <b-tab :title="$t('steps.step_1_references')">
                <UploadReferences
                  :canEdit="isEditing"
                  :loadReferences="loadReferences"
                  :references="references"
                  :lists="lists"
                  :charsOfStudies="charsOfStudies"
                  :methodologicalTableRefs="methodologicalTableRefs"
                  :useCamelot="project.use_camelot"
                  @CallGetReferences="getReferences"
                  @statusLoadReferences="statusLoadReferences"
                  @CallGetProject="getProject"></UploadReferences>
                <div class="mt-3">
                  <b-row v-if="references.length">
                    <b-col cols="auto" class="mr-auto">
                    </b-col>
                    <b-col cols="auto">
                      <a class="btn btn-success text-white" @click="stepStage++">{{ $t('common.step_2') || 'Step 2' }}</a>
                    </b-col>
                  </b-row>
                </div>
              </b-tab>
              <b-tab :title="$t('steps.step_2_inclusion_exclusion')" :disabled="references.length?false:true">
                <div>
                  <InclusionExclusioCriteria
                    :canEdit="isEditing"
                    :project="project"
                    :ui="ui"
                    @update-modification="updateModificationTime()"></InclusionExclusioCriteria>
                  <div class="mt-3">
                    <b-row>
                      <b-col cols="auto" class="mr-auto">
                        <a class="btn btn-success text-white" @click="stepStage--">{{ $t('common.step_1') || 'Step 1' }}</a>
                      </b-col>
                      <b-col cols="auto">
                        <a class="btn btn-success text-white" @click="stepStage++">{{ $t('common.step_3') || 'Step 3' }}</a>
                      </b-col>
                    </b-row>
                  </div>
                </div>
              </b-tab>
              <b-tab :title="$t('steps.step_3_characteristics')" :disabled="references.length?false:true">
                <h4 v-html="$t('characteristics.step_title')"></h4>
                <p class="font-weight-light">
                  {{ $t('characteristics.description') }}
                </p>
                <template v-if="project.use_camelot">
                  <CamelotStepThree type="isoqf_characteristics" :references="references"></CamelotStepThree>
                </template>
                <template v-else>
                  <crudTables
                    type="isoqf_characteristics"
                    prefix="ch"
                    :canEdit="isEditing"
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
                </template>
                <div class="mt-3">
                  <b-row>
                    <b-col cols="auto" class="mr-auto">
                      <a class="btn btn-success text-white" @click="stepStage--">{{ $t('common.step_2') || 'Step 2' }}</a>
                    </b-col>
                    <b-col cols="auto">
                      <a class="btn btn-success text-white" @click="stepStage++">{{ $t('common.step_4') || 'Step 4' }}</a>
                    </b-col>
                  </b-row>
                </div>
              </b-tab>
              <b-tab :title="$t('steps.step_4_methodological')" :disabled="references.length?false:true">
                <h4 v-html="$t('steps.step_4_description')"></h4>
                <p class="font-weight-light">
                  {{ $t('steps.step_4_long_description') }}
                </p>
                <template v-if="project.use_camelot">
                  <CamelotStepFour type="isoqf_methodological" :references="references"></CamelotStepFour>
                </template>
                <template v-else>
                  <crudTables
                    type="isoqf_assessments"
                    prefix="as"
                    :canEdit="isEditing"
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
                </template>
                <div class="mt-3">
                  <b-row>
                    <b-col cols="auto" class="mr-auto">
                      <a class="btn btn-success text-white" @click="stepStage--">{{ $t('common.step_3') || 'Step 3' }}</a>
                    </b-col>
                    <b-col cols="auto">
                      <b-button
                        block
                        variant="success"
                        class="mb-3"
                        @click="continueToIsoq">
                        {{ $t('common.continue_to_isoq') || 'Continue to iSoQ' }}
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
          :mode="effectiveMode"
          :canWrite="canWrite"
          :isLocked="isLockedByOther"
          :project="project"
          :ui="ui"
          :lists="lists"
          :findings="findings"
          :references="references"
          :charsOfStudies="charsOfStudies"
          :methodologicalTableRefs="methodologicalTableRefs"
          :listsPrintVersion="lists_print_version"
          :selectOptions="translatedSelectOptions"
          :cerqualConfidence="translatedCerqualConfidence"
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
                      >{{ $t('common.see_more_info') || 'See more information' }}</p>
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
                    <h5>{{ $t('publish.review_question') }}</h5>
                    <p>{{project.review_question}}</p>

                    <h5>{{ $t('publish.review_published') }}</h5>
                    <p>{{(project.published_status) ? $t('common.yes'): $t('common.no')}} <span v-if="project.published_status">| DOI: <b-link :href="project.url_doi" target="_blank">{{ project.url_doi }}</b-link></span></p>

                    <h5 v-if="project.description">{{ $t('publish.additional_info') }}</h5>
                    <p v-if="project.description">{{project.description}}</p>

                    <template v-if="project.public_type !== 'private'">
                      <h5>{{ $t('common.license') || 'License' }}</h5>
                      <p>{{ project.license_type }}</p>
                    </template>
                  </b-col>
                  <b-col cols="12" md="4" class="toDoc">
                    <h5 v-if="Object.prototype.hasOwnProperty.call(project, 'authors')">{{ $t('publish.authors_review') }}</h5>
                    <ul v-if="Object.prototype.hasOwnProperty.call(project, 'authors')">
                      <li v-for="(author, index) in project.authors.split(',')" :key="index">{{ author.trim() }}</li>
                    </ul>

                    <h5>{{ $t('publish.corresponding_author') }}</h5>
                    <p v-if="project.author">{{ project.author }} <span v-if="project.author_email"><br />{{ project.author_email }}</span></p>

                    <h5 v-if="!project.complete_by_author">{{ $t('common.completed_by_authors') || 'Is the iSoQ being completed by the review authors?' }}</h5>
                    <p v-if="!project.complete_by_author">{{(project.complete_by_author) ? $t('common.yes') : $t('common.no')}}</p>
                  </b-col>
                </b-row>
              </b-collapse>
            </b-card>
          </b-col>
        </b-row>
        <b-row
          class="mt-2">
          <b-col
            v-if="canWrite"
            cols="12">
            <b-row
              class="mb-2">
              <b-col
                v-if="effectiveMode === 'edit'"
                md="3"
                cols="12">
                <b-button
                  class="mt-1"
                  v-b-tooltip.hover :title="(isOnline) ? ($t('common.add_review_finding_tooltip') || 'Copy and paste one summarised review finding at a time into the iSoQ') : $t('offline.action_disabled')"
                  :variant="(lists.length) ? 'outline-success' : 'success'"
                  :disabled="!isOnline"
                  @click="modalAddList"
                  block>
                  {{ $t('common.add_review_finding_table') || 'Add review finding to the table' }}
                </b-button>
              </b-col>
              <b-col
                v-if="effectiveMode === 'edit'"
                md="4"
                cols="12">
                <b-button
                  class="mt-1"
                  v-b-tooltip.hover :title="(isOnline) ? ($t('common.organize_groups_tooltip') || 'If you want to organise your review findings into groups, for example by theme or topic, you can do so by creating review finding groups here.') : $t('offline.action_disabled')"
                  variant="outline-secondary"
                  :disabled="!isOnline"
                  @click="modalListCategories"
                  block>
                  {{ $t('common.organize_groups') || 'Organise review findings into groups' }}
                </b-button>
              </b-col>
              <b-col
                v-if="effectiveMode === 'edit' && lists.length > 1"
                md="3"
                cols="12">
                <b-button
                  class="mt-1"
                  block
                  variant="outline-secondary"
                  @click="modalSortFindings">{{ $t('common.reorder_findings') || 'Re-order your review findings' }}</b-button>

                <b-modal
                  ref="modal-sort-findings"
                  id="modal-sort-findings"
                  size="xl"
                  :ok-title="$t('common.save')"
                  ok-variant="outline-success"
                  cancel-variant="outline-danger"
                  scrollable
                  @ok="saveSortedLists">
                  <template v-slot:modal-title>
                    <videoHelp :txt="$t('modals.reorder_findings_title')" tag="none" urlId="462176102"></videoHelp>
                  </template>
                  <p class="font-weight-light">
                    {{ $t('modals.drag_drop_instruction') }}
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
                        <p class="font-weight-bold">
                          <template v-if="item.category">
                            {{ getCategoryName(item.category) }}&nbsp;-&nbsp;
                          </template>
                          {{ item.cerqual_option }}
                        </p>
                      </b-list-group-item>
                    </draggable>
                  </b-list-group>
                </b-modal>
              </b-col>
              <b-col
                v-if="effectiveMode === 'edit' && lists.length > 1"
                md="2"
                cols="12">
                <b-button
                  class="mt-1"
                  block
                  variant="outline-secondary"
                  @click="toggleSearch(ui.project.displaySearch)">{{ $t('common.search') }}</b-button>
              </b-col>
            </b-row>
          </b-col>
          <b-col
            v-if="effectiveMode === 'edit' && lists.length && ui.project.displaySearch"
            cols="12"
            class="my-2 d-print-none">
            <b-card
              id="card-search"
              bg-variant="light">
              <b-row>
                <b-col
                  cols="11">
                  <videoHelp :txt="$t('common.search')" tag="h4" urlId="462176356"></videoHelp>
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
                        :placeholder="$t('action_table.search_placeholder')"></b-form-input>
                      <b-input-group-append>
                        <b-button :disabled="!table_settings.filter" @click="table_settings.filter = null">{{ $t('common.clear') }}</b-button>
                      </b-input-group-append>
                    </b-input-group>
                  </b-form-group>
                </b-col>
              </b-row>

            </b-card>
          </b-col>
          <b-col cols="12" class="toDoc">
            <template
              v-if="checkPermissions(['can_read', 'can_write'])">
              <ViewTable
                :class="{'d-none': effectiveMode === 'view', 'd-print-none': true}"
                :lists="lists"
                :list_categories="list_categories"
                :fields="translatedTableFields"
                :project="project"
                :mode="effectiveMode"
                :isBusy="table_settings.isBusy"
                :references="references"
                :refs="refs"
                @update-modification-time="updateModificationTime"
                @get-lists="getLists"
                @get-project="getProject"
                @add-list="modalAddList"
                @set-busy="setBusy"
                @set-load-references="statusLoadReferences"
                @get-references="getReferences"
                @update-project-status="getProject"
                 />
            </template>
            <!-- printed version -->
            <PrintViewTable
              :class="{'d-none': effectiveMode === 'edit', 'd-print-block': true}"
              :dataPrintVersion="lists_print_version"
              :references="references"
              :categories="list_categories"
              :printableItems="printableItems"
              :project="project"
              :hasPermission="checkPermissions('can_read')"></PrintViewTable>
            <!-- eopv -->
            <b-modal
              size="xl"
              id="add-summarized"
              ref="add-summarized"
              :title="$t('common.add_summarized_finding') || 'Add Summarised review finding'"
              :ok-disabled="(summarized_review)?false:true"
              @ok="createList"
              :ok-title="$t('common.save')"
              ok-variant="outline-success"
              cancel-variant="outline-secondary">
              <b-form-group
                :label="$t('soqf_table.summarised_finding')"
                label-for="summarized-review">
                <template slot="description">{{ $t('common.click') || 'Click' }} <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/1" target="_blank">{{ $t('common.here') || 'here' }}</a> {{ $t('soqf_table.tips_writing') || 'for tips for writing a summarised review finding' }}</template>
                <b-form-textarea
                  id="summarized-review"
                  v-model="summarized_review"
                  rows="6"
                  max-rows="100"></b-form-textarea>
              </b-form-group>
              <b-form-group
                v-if="list_categories.options.length"
                :label="$t('soqf_table.select_group')"
                :description="$t('soqf_table.group_optional')">
                <b-form-select
                  v-model="list_categories.selected"
                  value-field="id"
                  text-field="text"
                  :options="list_categories.options"></b-form-select>
              </b-form-group>
            </b-modal>

            <b-modal
              size="xl"
              id="modalEditListCategories"
              ref="modalEditListCategories"
              scrollable>
              <template v-slot:modal-title>
                <videoHelp :txt="$t('modals.review_finding_groups')" tag="none" urlId="451100564"></videoHelp>
              </template>
              <template v-if="!(modal_edit_list_categories.new) && !(modal_edit_list_categories.edit) && !(modal_edit_list_categories.remove)">
                <p class="font-weight-light">
                  {{ $t('modals.categories_long_description') }}
                </p>
                <p class="text-danger">
                  {{ $t('modals.categories_numbering_instruction') }}
                </p>
              </template>
              <template
                v-if="modal_edit_list_categories.options.length && !(modal_edit_list_categories.new) && !(modal_edit_list_categories.edit) && !(modal_edit_list_categories.remove)">
                <b-table
                  head-variant="highlight"
                  striped
                  :fields="translatedModalFields"
                  :items="modal_edit_list_categories.options">
                  <template v-slot:cell(actions)="data">
                    <b-button
                      block
                      variant="outline-success"
                      @click="editListCategoryName(data.index)">{{ $t('common.edit') }}</b-button>
                    <b-button
                      block
                      variant="outline-danger"
                      class="mt-1"
                      @click="removeListCategory(data)">{{ $t('common.remove') }}</b-button>
                  </template>
                </b-table>
              </template>
              <template
                v-if="modal_edit_list_categories.new">
                <p class="text-danger">
                  {{ $t('modals.categories_numbering_instruction') }}
                </p>
                <b-form-group
                  class="mt-3"
                  :label="$t('common.add_group_name') || 'Add group name'">
                  <b-form-input
                    v-model="modal_edit_list_categories.text"></b-form-input>
                </b-form-group>
                <b-form-group
                  class="mt-3"
                  :label="$t('common.describe_group') || 'Describe this group for the user viewing this table'">
                  <b-form-input
                    v-model="modal_edit_list_categories.extra_info"></b-form-input>
                </b-form-group>
              </template>
              <template
                class="mt-3"
                v-if="modal_edit_list_categories.edit">
                <p class="text-danger">
                  {{ $t('modals.categories_numbering_instruction') }}
                </p>
                <b-form-group
                  :label="$t('common.edit_group_name') || 'Edit group name'">
                  <b-form-input
                    v-model="modal_edit_list_categories.text"></b-form-input>
                </b-form-group>
                <b-form-group
                  class="mt-3"
                  :label="$t('common.describe_group') || 'Describe this group for the user viewing this table'">
                  <b-form-input
                    v-model="modal_edit_list_categories.extra_info"></b-form-input>
                </b-form-group>
              </template>
              <template
                class="mt-3"
                v-if="modal_edit_list_categories.remove">
                <p>
                  {{ $t('modals.confirm_delete_group') }} <b>{{ modal_edit_list_categories.text }}</b>?
                </p>
              </template>
              <template
                v-slot:modal-footer>
                <div
                  v-if="modal_edit_list_categories.remove">
                  <b-button
                    variant="outline-primary"
                    @click="modalCancelCategoryButtons">{{ $t('common.cancel') }}</b-button>
                  <b-button
                    variant="outline-danger"
                    @click="removeCategory()">{{ $t('common.confirm') || 'Confirm' }}</b-button>
                </div>
                <div
                  v-if="modal_edit_list_categories.new">
                  <b-button
                    variant="outline-primary"
                    @click="modalCancelCategoryButtons">{{ $t('common.cancel') }}</b-button>
                  <b-button
                    variant="outline-success"
                    :disabled="modal_edit_list_categories.text === ''"
                    @click="saveNewCategory">{{ $t('common.save') }}</b-button>
                </div>
                <div
                  v-if="!modal_edit_list_categories.new">
                  <b-button
                    v-if="!(modal_edit_list_categories.new) && !(modal_edit_list_categories.edit) && !(modal_edit_list_categories.remove)"
                    variant="outline-primary"
                    :disabled="!isOnline"
                    @click="modal_edit_list_categories.new=true">
                    {{ $t('common.add_new_finding_group') || 'Add new review finding group' }}
                  </b-button>
                </div>
                <div
                  v-if="modal_edit_list_categories.edit">
                  <b-button
                    variant="outline-primary"
                    @click="modalCancelCategoryButtons">{{ $t('common.cancel') }}</b-button>
                  <b-button
                    variant="outline-success"
                    :disabled="modal_edit_list_categories.text === ''"
                    @click="updateCategoryName(modal_edit_list_categories.index)">{{ $t('common.update') }}</b-button>
                </div>
              </template>
            </b-modal>
            <back-to-top></back-to-top>
            <!-- Lock Modals -->
            <b-modal id="modal-lock-lost" title="Connection Lost" ok-only ok-title="Reload" @ok="reloadPage" no-close-on-backdrop no-close-on-esc hide-header-close>
                <div class="text-center">
                    <font-awesome-icon icon="exclamation-triangle" size="3x" class="text-warning mb-3" />
                    <p>{{ $t('lock.lock_lost_message') || 'The connection to the server was lost or another user has taken the edit lock. To prevent data loss, please reload the page.' }}</p>
                </div>
            </b-modal>
             <b-modal id="modal-lock-idle" title="Session Timeout" ok-only ok-title="Reload" @ok="reloadPage" no-close-on-backdrop no-close-on-esc hide-header-close>
                <div class="text-center">
                    <font-awesome-icon icon="lock" size="3x" class="text-secondary mb-3" />
                    <p>{{ $t('lock.idle_message') || 'You have been inactive for a while. To allow others to edit, your write access has been released. Please reload to resume editing.' }}</p>
                </div>
            </b-modal>
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
import Api from '@/utils/Api'
import LockService from '@/services/lockService'
import draggable from 'vuedraggable'
import { Paragraph, TextRun, AlignmentType, TableCell, TableRow } from 'docx'
import Commons from '../../utils/commons.js'

const contentGuidance = () => import(/* webpackChunkName: "contentguidance" */ '../contentGuidance.vue')
const backToTop = () => import(/* webpackChunkName: "backtotop" */ '../backToTop.vue')
const videoHelp = () => import(/* webpackChunkName: "videohelp" */ '../videoHelp.vue')
const actionButtons = () => import(/* webpackChunkName: 'actionButtons' */'./actionButtons.vue')
const propertiesProject = () => import(/* webpackChunkName: "propertiesProject" */ './propertiesProject.vue')
const UploadReferences = () => import(/* webpackChunkName: "uploadReferences" */ './UploadReferences.vue')
const InclusionExclusioCriteria = () => import(/* webpackChunkName: "inclusionExclusionCriteria" */ './InclusionExclusionCriteria.vue')
const PrintViewTable = () => import(/* webpackChunkName: "printViewTable" */ './PrintViewTable.vue')

export default {
  components: {
    draggable,
    'content-guidance': contentGuidance,
    'back-to-top': backToTop,
    videoHelp,
    'action-buttons': actionButtons,
    propertiesProject,
    UploadReferences,
    InclusionExclusioCriteria,
    crudTables: () => import(/* webpackChunkName: "crudTables" */ '@/components/project/crudTables.vue'),
    PrintViewTable,
    ViewTable: () => import(/* webpackChunkName: "viewTable" */ '@/components/project/ViewTable.vue'),
    CamelotStepThree: () => import(/* webpackChunkName: "camelotStepThree" */ '@/components/camelot/StepThree.vue'),
    CamelotStepFour: () => import(/* webpackChunkName: "camelotStepFour" */ '@/components/camelot/StepFour.vue')
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
        filterOn: ['filter_cerqual', 'category_name', 'explanation', 'status']
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
      lastId: 1,
      mode: '',
      msgUploadReferences: '',
      charsOfStudies: {
        id: null,
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ],
        fieldsObjOriginal: []
      },
      tabOpened: 1,
      yes_or_no: [
        { value: false, text: 'no' },
        { value: true, text: 'yes' }
      ],
      methodologicalTableRefs: {
        id: null,
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ],
        fieldsObjOriginal: []
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
      lockInfo: {
        locked: false,
        lockedBy: null
      },
      lockDataRecovery: null,
      finding: {},
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
    window.addEventListener('lock-lost', this.handleLockLost)
    window.addEventListener('lock-idle', this.handleIdle)
    window.addEventListener('axios-refresh-lock', this.handleLockLost)
    await this.getListCategories()
    await this.getReferences()
    await this.getProject()
    await this.getCharacteristicsData()
    await this.getAssessmentsData()
  },
  beforeDestroy () {
    LockService.release()
    window.removeEventListener('lock-lost', this.handleLockLost)
    window.removeEventListener('lock-idle', this.handleIdle)
    window.removeEventListener('axios-refresh-lock', this.handleLockLost)
  },
  methods: {
    setBusy: function (value) {
      this.table_settings.isBusy = value
    },
    updateDataProject: function (data) {
      this.getProject()
    },
    isActiveStepTwo: function () {
      if (this.references.length === 0) { return false }
      if (this.project.inclusion === '' || this.project.exclusion === '') { this.stepStage = 1; return true }
    },
    setItemData: function (data) {
      this.ui.itemData = data
    },
    getListCategories: async function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      Api.get('/isoqf_list_categories', params)
        .then((response) => {
          this.processGetListCategories(response.data)
        })
        .catch((error) => {
          Commons.printErrors(error)
        })
    },
    getReferences: async function (changeTab = true) {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      Api.get(`/isoqf_references`, params)
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
          if (this.references.length && changeTab) {
            this.stepStage = 1
          }
          this.loadReferences = false
        })
        .catch((error) => {
          Commons.printErrors(error)
        })
    },
    getProject: async function () {
      const params = {
        organization: this.$route.params.org_id
      }
      Api.get(`/isoqf_projects/${this.$route.params.id}`, params)
        .then((response) => {
          let _project = JSON.parse(JSON.stringify(response.data))
          if (!Object.prototype.hasOwnProperty.call(_project, 'inclusion')) {
            _project.inclusion = ''
          }
          if (!Object.prototype.hasOwnProperty.call(_project, 'exclusion')) {
            _project.exclusion = ''
          }
          if (!Object.prototype.hasOwnProperty.call(_project, 'license_type')) {
            _project.license_type = 'CC-BY-NC-ND'
          }
          if (Object.prototype.hasOwnProperty.call(_project, 'license_type')) {
            if (_project.license_type === '') {
              _project.license_type = 'CC-BY-NC-ND'
            }
          }
          this.project = _project
          // set mode based on permissions: prefer write -> edit, otherwise read -> view
          if (this.checkPermissions('can_write')) {
            this.mode = 'edit'
          } else if (this.checkPermissions('can_read')) {
            this.mode = 'view'
          } else {
            this.mode = ''
          }

          // Attempt to acquire lock if in edit mode
          if (this.mode === 'edit') {
            this.attemptLock()
          }

          this.ui.project.show_criteria = true
          this.getLists()
        })
        .catch((error) => {
          Commons.printErrors(error)
        })
    },
    getCharacteristicsData: async function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }

      try {
        const response = await Api.get('/isoqf_characteristics', params)
        if (response.data && response.data.length > 0) {
          console.log('Características cargadas:', response.data[0])
          this.charsOfStudies = response.data[0]
        } else {
          console.log('No se encontraron características, manteniendo estructura vacía')
          // Mantener la estructura vacía pero con IDs nulos
          this.charsOfStudies = {
            id: null,
            fields: [],
            items: [],
            authors: '',
            fieldsObj: [
              {
                key: 'authors',
                label: 'Author(s), Year'
              }
            ],
            fieldsObjOriginal: []
          }
        }
      } catch (error) {
        console.error('Error cargando características:', error)
      }
    },
    getAssessmentsData: async function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }

      try {
        const response = await Api.get('/isoqf_assessments', params)
        if (response.data && response.data.length > 0) {
          console.log('Evaluaciones cargadas:', response.data[0])
          this.methodologicalTableRefs = response.data[0]
        } else {
          console.log('No se encontraron evaluaciones, manteniendo estructura vacía')
          // Mantener la estructura vacía pero con IDs nulos
          this.methodologicalTableRefs = {
            id: null,
            fields: [],
            items: [],
            authors: '',
            fieldsObj: [
              {
                key: 'authors',
                label: 'Author(s), Year'
              }
            ],
            fieldsObjOriginal: []
          }
        }
      } catch (error) {
        console.error('Error cargando evaluaciones:', error)
      }
    },
    async attemptLock () {
      const res = await LockService.acquire(this.project.id)
      if (res.success) {
        this.lockInfo.locked = true
        this.lockInfo.lockedBy = null
      } else if (res.lockedBy) {
        this.lockInfo.locked = false
        this.lockInfo.lockedBy = res.lockedBy
        this.mode = 'view'
        this.$bvToast.toast(this.$t('lock.project_locked_by', { user: res.lockedBy }) || `Project is currently being edited by ${res.lockedBy}. Read-only mode.`, {
          title: this.$t('lock.locked_title') || 'Project Locked',
          variant: 'warning',
          solid: true,
          noAutoHide: true
        })
      }
    },
    handleLockLost (e) {
      if ((e.detail && e.detail.projectId === this.project.id) || e.type === 'axios-refresh-lock') {
        this.mode = 'view'
        this.$bvModal.show('modal-lock-lost')
      }
    },
    handleIdle (e) {
        if (e.detail && e.detail.projectId === this.project.id) {
        this.mode = 'view'
        this.$bvModal.show('modal-lock-idle')
      }
    },
    reloadPage () {
        window.location.reload()
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
        options.splice(0, 0, {id: null, text: this.$t('categories.no_group')})
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
      Api.get('/isoqf_lists', params)
        .then(async (response) => {
          this.lists = await this.processLists(response)
          const lists = response.data.map((list) => { return list.id })
          this.getFindings(lists.toString())
          this.table_settings.totalRows = this.lists.length
          this.routeAnchorHash()
          this.table_settings.isBusy = false
        })
        .catch((error) => {
          Commons.printErrors(error)
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
      const tabs = ['Project-Property', 'My-Data', 'iSoQ', 'Guidance-on-applying-GRADE-CERQual']
      if (this.$route.query.tab !== tabs[option]) {
        const query = { ...this.$route.query, tab: tabs[option] }
        if (Object.prototype.hasOwnProperty.call(query, 'highlight')) {
          delete query.highlight
        }
        this.$router.push({
          query: query
        }).catch(() => {})
      }
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
    displaySelectedOption: function (option, type) {
      return Commons.displaySelectedOption(option, type)
    },
    parseReference: async function (reference, onlyAuthors = false, hasSemicolon = true) {
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
          return this.$t('references.author_not_found')
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
            list.cerqual_option = this.translatedCerqualConfidence[list.cerqual.option].text
          }
          list.filter_cerqual = ''
          if (list.cerqual.option != null) {
            const optionValue = this.translatedCerqualConfidence[list.cerqual.option].value
            list.filter_cerqual = optionValue || ''
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
          categories.push({'name': this.$t('categories.uncategorised_findings'), 'id': 'uncategorized', 'value': null, 'items': [], is_category: true})

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

        this.printableItems = []
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
      Api.get('/findings', params)
        .then((response) => {
          if (response.data.length) {
            this.findings.push(...response.data)
          }
        })
        .catch((error) => {
          Commons.printErrors(error)
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
      Api.post('/isoqf_lists', params)
        .then((response) => {
          const listId = response.data.id
          const listName = response.data.name

          this.createFinding(listId, listName)
          this.summarized_review = ''
          this.list_categories.selected = null
          this.updateModificationTime()
        })
        .catch((error) => {
          Commons.printErrors(error)
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
      Api.post('/isoqf_findings', params)
        .then(async (response) => {
          await this.createExtractedData(response.data.id)
        })
        .catch((error) => {
          Commons.printErrors(error)
        })
    },
    generateEvidenceProfileTableWithCategories: function (findings) {
      let content = []
      for (const position in findings) {
        let rowTitle = this.$t('categories.uncategorised_findings')
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
        return this.$t('references.author_not_found')
      }
    },
    saveListCategoryName: function () {
      const params = {
        text: this.list_category.name,
        extra_info: this.list_category.extra_info,
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      Api.post('/isoqf_list_categories', params)
        .then((response) => {
          this.list_categories.options = response.data
          this.list_categories.selected = null
          this.list_categories.skip = false
        })
        .catch((error) => {
          Commons.printErrors(error)
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

      Api.post('/isoqf_list_categories', params)
        .then(async () => {
          await this.getListCategories()
          this.getLists()
          this.modal_edit_list_categories.new = false
          this.modal_edit_list_categories.text = ''
          this.modal_edit_list_categories.extra_info = ''
        })
        .catch((error) => {
          Commons.printErrors(error)
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
        Api.patch(`/isoqf_list_categories/${objID}`, params)
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
            Commons.printErrors(error)
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
        Api.delete(`/isoqf_list_categories/${objID}`)
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
            Commons.printErrors(error)
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
          _request.push(Api.patch(`/isoqf_lists/${list.id}`, list))
        }
      }
      Promise.all(_request)
        .then(() => {
          this.getLists()
        })
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
        requests.push(Api.patch(`/isoqf_lists/${list.id}`, params))
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
          Commons.printErrors(error)
        })
    },
    updateFindingSort: function (listId, sort, getList = false) {
      const params = {
        organization: this.$route.params.org_id,
        list_id: listId
      }
      Api.get('/isoqf_findings', params)
        .then((reponse) => {
          const findingId = reponse.data[0].id
          const params = {
            'isoqf_id': sort,
            'evidence_profile.isoqf_id': sort
          }
          Api.patch(`/isoqf_findings/${findingId}`, params)
            .then(() => {
              this.getLists()
            })
            .catch((error) => {
              this.table_settings.isBusy = false
              Commons.printErrors(error)
            })
        })
    },
    getCategoryName: function (id) {
      const _categories = JSON.parse(JSON.stringify(this.list_categories))
      let _category = ''
      for (let category of _categories.options) {
        if (category.id === id) {
          _category = category.text
        }
      }
      return _category
    },
    printErrors: function (error) {
      Commons.printErrors(error)
    },
    createExtractedData: async function (findingID) {
      const _references = JSON.parse(JSON.stringify(this.references))
      let params = {
        fields: [
          { key: 'ref_id', label: this.$t('table_headers.reference_id') },
          { key: 'authors', label: this.$t('table_headers.author_year') },
          { key: 'column_0', label: this.$t('table_headers.extracted_data') }
        ],
        items: [],
        organization: this.$route.params.org_id,
        finding_id: findingID
      }

      for (let reference of _references) {
        params.items.push({ 'ref_id': reference.id, 'authors': await this.parseReference(reference, true), 'column_0': '' })
      }

      Api.post('/isoqf_extracted_data', params)
        .then(() => {
          this.getLists()
        })
        .catch((error) => {
          Commons.printErrors(error)
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
    continueToIsoq: function () {
      this.clickTab(2)
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

      // Safeguard: if user data is missing (e.g. offline), return false
      if (!this.$store || !this.$store.state || !this.$store.state.user) {
        return false
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
    },
    updateModificationTime: function () {
      const params = {
        last_update: Date.now()
      }
      Api.patch(`/isoqf_projects/${this.$route.params.id}`, params)
        .then()
        .catch((error) => {
          Commons.printErrors(error)
        })
    }
  },
  watch: {
    'list_categories.options': function (newVal) {
      if (newVal && newVal.length > 0) {
        this.getLists()
      }
    },
    '$route.query.tab': function (val) {
      const tabs = ['Project-Property', 'My-Data', 'iSoQ', 'Guidance-on-applying-GRADE-CERQual']
      const index = tabs.indexOf(val)
      if (index !== -1) {
        this.tabOpened = index
      }
    },
    '$route.query.step': function (val) {
      if (val) {
        this.stepStage = parseInt(val) - 1
      }
    },
    '$route.params.id': {
      handler: function (id) {
        this.lockInfo = {
          locked: false,
          lockedBy: null
        }
        this.getProject()
        this.getListCategories()
        this.getReferences()
      }
    }
  },
  computed: {
    title: function () {
      let txt = ''
      if (this.mode === 'edit') {
        txt = this.$t('common.interactive') + ' '
      }
      txt = txt + this.$t('publish.soqf_table_title')
      return txt
    },
    translatedSelectOptions: function () {
      return [
        { value: 0, text: this.$t('cerqual_options.no_very_minor_concerns') },
        { value: 1, text: this.$t('cerqual_options.minor_concerns') },
        { value: 2, text: this.$t('cerqual_options.moderate_concerns') },
        { value: 3, text: this.$t('cerqual_options.serious_concerns') },
        { value: null, text: this.$t('cerqual_options.undefined') }
      ]
    },
    translatedCerqualConfidence: function () {
      return [
        { value: 'hc', text: this.$t('cerqual_options.high_confidence') },
        { value: 'mc', text: this.$t('cerqual_options.moderate_confidence') },
        { value: 'lc', text: this.$t('cerqual_options.low_confidence') },
        { value: 'vc', text: this.$t('cerqual_options.very_low_confidence') },
        { value: null, text: this.$t('cerqual_options.undefined') }
      ]
    },
    translatedTableFields: function () {
      return {
        with_categories: [
          { key: 'sort', label: '#' },
          { key: 'name', label: this.$t('table_headers.summarised_finding') },
          { key: 'category_name', label: this.$t('table_headers.review_finding_groups') },
          { key: 'cerqual_option', label: this.$t('table_headers.cerqual_assessment') },
          { key: 'cerqual_explanation', label: this.$t('table_headers.cerqual_explanation') },
          { key: 'ref_list', label: this.$t('table_headers.references') }
        ],
        without_categories: [
          { key: 'sort', label: '#' },
          { key: 'name', label: this.$t('table_headers.summarised_finding') },
          { key: 'cerqual_option', label: this.$t('table_headers.cerqual_assessment') },
          { key: 'cerqual_explanation', label: this.$t('table_headers.cerqual_explanation') },
          { key: 'ref_list', label: this.$t('table_headers.references') }
        ]
      }
    },
    translatedModalFields: function () {
      return [
        { key: 'text', label: this.$t('modals.group_name_label') },
        { key: 'actions', label: '' }
      ]
    },
    effectiveMode: function () {
      // If explicit mode is set to edit or view, use it
      if (this.mode === 'edit') return 'edit'
      if (this.mode === 'view') return 'view'

      // If mode is empty, derive from permissions: prefer write
      if (this.checkPermissions('can_write')) return 'edit'
      if (this.checkPermissions('can_read')) return 'view'

      // safe default: empty string when user has no read/write permissions
      return ''
    },
    canWrite: function () {
      return this.checkPermissions('can_write')
    },
    isEditing: function () {
      return this.effectiveMode === 'edit' && this.canWrite
    },
    isLockedByOther: function () {
      return !!(this.lockInfo && this.lockInfo.lockedBy)
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
  div >>>
    #methodological-table thead th:first-child {
      width: 25%;
    }
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
</style>