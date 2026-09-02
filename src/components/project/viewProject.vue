<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="pt-3">
        <b-row align-h="end">
          <b-col class="text-right">
            <b-link
              :to="{ name: 'viewOrganization', params: { id: this.$store.state.user.personal_organization }, query: { hash: `p-${this.project.id}` } }"
              class="d-print-none return">
              <font-awesome-icon icon="long-arrow-alt-left" :title="$t('project.return_workspace')" />
              {{ $t('project.return_workspace') }}
            </b-link>
          </b-col>
          <b-col cols="12" class="toDoc">
            <h2 id="project-title">{{ project.name }}</h2>
          </b-col>
        </b-row>
        <b-nav id="tabsTitle" tabs fill class="pt-3">
          <b-nav-item :active="(tabOpened === 0) ? true : false" @click="clickTab(0)">{{ $t('project.properties')
            }}</b-nav-item>
          <b-nav-item :active="(tabOpened === 1) ? true : false" @click="clickTab(1)">{{ $t('project.my_data')
            }}</b-nav-item>
          <b-nav-item :active="(tabOpened === 2) ? true : false" :disabled="(references.length) ? false : true"
            @click="clickTab(2)">{{ $t('project.isoq') }}</b-nav-item>
          <b-nav-item :active="(tabOpened === 3) ? true : false" @click="clickTab(3)">{{ $t('project.guidance_applying')
            }}</b-nav-item>
        </b-nav>
      </div>
    </b-container>
    <b-container fluid class="mb-5">
      <div :class="{ 'block mt-3': (tabOpened === 0) ? true : false, 'd-none': (tabOpened === 0) ? !true : !false }">
        <propertiesProject :project="project" :canEdit="isEditing"
          :highlight="$route.query.highlight" @update-project="updateDataProject">
        </propertiesProject>
      </div>
      <div :class="{ 'block mt-3': (tabOpened === 1) ? true : false, 'd-none': (tabOpened === 1) ? !true : !false }">
        <b-row>
          <b-col cols="12">
            <videoHelp :txt="$t('modals.add_data_title')" tag="h3" urlId="449265292"></videoHelp>
            <p>
              {{ $t('project.optimize_info') }}
            </p>
          </b-col>
          <b-card no-body class="col-12">
            <b-tabs pills card small vertical nav-wrapper-class="w-15" content-class="w-85" class="link-steps nowrap"
              active-nav-item-class="btn-success" v-model="stepStage" lazy>
              <b-tab :title="$t('steps.step_1_references')">
                <UploadReferences :canEdit="isEditing" :loadReferences="loadReferences" :references="references"
                  :lists="lists" :charsOfStudies="charsOfStudies" :methodologicalTableRefs="methodologicalTableRefs"
                  :useCamelot="project.use_camelot" @CallGetReferences="getReferences"
                  @statusLoadReferences="statusLoadReferences" @CallGetProject="getProject"></UploadReferences>
                <div class="mt-3">
                  <b-row v-if="references.length">
                    <b-col cols="auto" class="mr-auto">
                    </b-col>
                    <b-col cols="auto">
                      <a class="btn btn-success text-white" @click="stepStage++">{{ $t('common.step_2') || 'Step 2'
                        }}</a>
                    </b-col>
                  </b-row>
                </div>
              </b-tab>
              <b-tab :title="$t('steps.step_2_inclusion_exclusion')" :disabled="references.length ? false : true">
                <div>
                  <InclusionExclusioCriteria :canEdit="isEditing" :project="project" :ui="ui"
                    @criteria-saved="onCriteriaSaved($event)">
                  </InclusionExclusioCriteria>
                  <div class="mt-3">
                    <b-row>
                      <b-col cols="auto" class="mr-auto">
                        <a class="btn btn-success text-white" @click="stepStage--">{{ $t('common.step_1') || 'Step 1'
                          }}</a>
                      </b-col>
                      <b-col cols="auto">
                        <a class="btn btn-success text-white" @click="stepStage++">{{ $t('common.step_3') || 'Step 3'
                          }}</a>
                      </b-col>
                    </b-row>
                  </div>
                </div>
              </b-tab>
              <b-tab :title="$t('steps.step_3_characteristics')" :disabled="references.length ? false : true">
                <h4 v-if="!project.use_camelot" v-html="$t('characteristics.step_title')"></h4>
                <h4 v-else v-html="$t('characteristics.step_title_camelot')"></h4>
                <p class="font-weight-light" v-if="project.use_camelot" v-html="formattedCamelotDescription">
                </p>
                <p class="font-weight-light" v-else>
                  {{ $t('characteristics.description') }}
                </p>
                <template v-if="project.use_camelot">
                  <CamelotStepThree type="isoqf_characteristics" :references="references" :canEdit="isEditing">
                  </CamelotStepThree>
                </template>
                <template v-else>
                  <crudTables type="isoqf_characteristics" prefix="ch" :canEdit="isEditing" :project="project" :ui="ui"
                    :references="references" :refs="refs" :lists="lists" @get-project="getProject"
                    @print-errors="printErrors" @updateDataTable="updateDataTable">
                  </crudTables>
                </template>
                <div class="mt-3">
                  <b-row>
                    <b-col cols="auto" class="mr-auto">
                      <a class="btn btn-success text-white" @click="stepStage--">{{ $t('common.step_2') || 'Step 2'
                        }}</a>
                    </b-col>
                    <b-col cols="auto">
                      <a class="btn btn-success text-white" @click="stepStage++">{{ $t('common.step_4') || 'Step 4'
                        }}</a>
                    </b-col>
                  </b-row>
                </div>
              </b-tab>
              <b-tab :title="$t('steps.step_4_methodological')" :disabled="references.length ? false : true">
                <h4 v-if="project.use_camelot" v-html="$t('steps.step_4_description_camelot')"></h4>
                <h4 v-else v-html="$t('steps.step_4_description')"></h4>
                <p class="font-weight-light" v-if="project.use_camelot" v-html="$t('camelot.step_four.description')">
                </p>
                <p class="font-weight-light" v-else>
                  {{ $t('steps.step_4_long_description') }}
                </p>
                <template v-if="project.use_camelot">
                  <CamelotStepFour type="isoqf_methodological" :references="references" :canEdit="isEditing">
                  </CamelotStepFour>
                </template>
                <template v-else>
                  <crudTables type="isoqf_assessments" prefix="as" :canEdit="isEditing" :project="project" :ui="ui"
                    :references="references" :refs="refs" :lists="lists" @get-project="getProject"
                    @print-errors="printErrors" @updateDataTable="updateDataTable">
                  </crudTables>
                </template>
                <div class="mt-3">
                  <b-row>
                    <b-col cols="auto" class="mr-auto">
                      <a class="btn btn-success text-white" @click="stepStage--">{{ $t('common.step_3') || 'Step 3'
                        }}</a>
                    </b-col>
                    <b-col cols="auto">
                      <b-button block variant="success" class="mb-3" @click="continueToIsoq">
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
      <div :class="{ 'block mt-3': (tabOpened === 2) ? true : false, 'd-none': (tabOpened === 2) ? !true : !false }"
        :disabled="(references.length) ? false : true">

        <b-row class="mb-3">
          <b-col cols="12" class="toDoc">
            <videoHelp :txt="title" :tag="'h2'" :urlId="'449743080'"></videoHelp>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <action-buttons :mode="effectiveMode" :canWrite="canWrite" :project="project"
              :ui="ui" :lists="lists" :findings="findings" :references="references" :charsOfStudies="charsOfStudies"
              :methodologicalTableRefs="methodologicalTableRefs" :listsPrintVersion="lists_print_version"
              :selectOptions="translatedSelectOptions" :cerqualConfidence="translatedCerqualConfidence"
              :printableItems="printableItems" @uiPublishShowLoader="uiShowLoaders" @getProject="getProject"
              @changeMode="changeMode" @changeTableSettings="changeTableSettings"></action-buttons>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="12">
            <b-card header-tag="header">
              <template v-slot:header>
                <b-container fluid>
                  <b-row v-b-toggle.info-project>
                    <b-col cols="11">
                      <p class="mb-0 text-left">{{ $t('common.see_more_info') || 'See more information' }}</p>
                    </b-col>
                    <b-col cols="1" align-self="end">
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
                    <p>{{ project.review_question }}</p>

                    <h5>{{ $t('publish.review_published') }}</h5>
                    <p>{{ (project.published_status) ? $t('common.yes') : $t('common.no') }} <span
                        v-if="project.published_status">| DOI: <b-link :href="project.url_doi" target="_blank">{{
                          project.url_doi }}</b-link></span></p>

                    <h5 v-if="project.description">{{ $t('publish.additional_info') }}</h5>
                    <p v-if="project.description">{{ project.description }}</p>

                    <template v-if="project.public_type !== 'private'">
                      <h5>{{ $t('common.license') || 'License' }}</h5>
                      <p>{{ project.license_type }}</p>
                    </template>
                  </b-col>
                  <b-col cols="12" md="4" class="toDoc">
                    <h5 v-if="Object.prototype.hasOwnProperty.call(project, 'authors')">{{ $t('publish.authors_review')
                      }}
                    </h5>
                    <ul v-if="Object.prototype.hasOwnProperty.call(project, 'authors')">
                      <li v-for="(author, index) in project.authors.split(',')" :key="index">{{ author.trim() }}</li>
                    </ul>

                    <h5>{{ $t('publish.corresponding_author') }}</h5>
                    <p v-if="project.author">{{ project.author }} <span v-if="project.author_email"><br />{{
                      project.author_email }}</span></p>

                    <h5 v-if="!project.complete_by_author">
                      {{ $t('common.completed_by_authors') }}</h5>
                    <p v-if="!project.complete_by_author">
                      {{ (project.complete_by_author) ? $t('common.yes') : $t('common.no') }}
                    </p>
                  </b-col>
                </b-row>
              </b-collapse>
            </b-card>
          </b-col>
        </b-row>
        <b-row class="mt-2">
          <b-col v-if="canWrite" cols="12">
            <b-row class="mb-2">
              <b-col v-if="effectiveMode === 'edit'" md="3" cols="12">
                <b-button class="mt-1" v-b-tooltip.hover
                  :title="(isOnline) ? ($t('common.add_review_finding_tooltip') || 'Copy and paste one summarised review finding at a time into the iSoQ') : $t('offline.action_disabled')"
                  :variant="(lists.length) ? 'outline-success' : 'success'" :disabled="!isOnline" @click="modalAddList"
                  block>
                  {{ $t('common.add_review_finding_table') || 'Add review finding to the table' }}
                </b-button>
              </b-col>
              <b-col v-if="effectiveMode === 'edit'" md="4" cols="12">
                <b-button class="mt-1" v-b-tooltip.hover
                  :title="(isOnline) ? ($t('common.organize_groups_tooltip') || 'If you want to organise your review findings into groups, for example by theme or topic, you can do so by creating review finding groups here.') : $t('offline.action_disabled')"
                  variant="outline-secondary" :disabled="!isOnline" @click="modalListCategories" block>
                  {{ $t('common.organize_groups') || 'Organise review findings into groups' }}
                </b-button>
              </b-col>
              <b-col v-if="effectiveMode === 'edit' && lists.length > 1" md="3" cols="12">
                <b-button class="mt-1" block variant="outline-secondary" @click="modalSortFindings">{{
                  $t('common.reorder_findings') || 'Re-order your review findings' }}</b-button>

                <b-modal ref="modal-sort-findings" id="modal-sort-findings" size="xl" :ok-title="$t('common.save')"
                  ok-variant="outline-success" cancel-variant="outline-danger" scrollable @ok="saveSortedLists"
                  @show="onProjectEditorOpen(true)" @hidden="onProjectEditorOpen(false)">
                  <template v-slot:modal-title>
                    <videoHelp :txt="$t('modals.reorder_findings_title')" tag="none" urlId="462176102"></videoHelp>
                  </template>
                  <p class="font-weight-light">
                    {{ $t('modals.drag_drop_instruction') }}
                  </p>
                  <b-list-group>
                    <draggable v-model="sorted_lists" group="columns" @start="drag = true" @end="drag = false">
                      <b-list-group-item v-for="(item, index) of sorted_lists" :key="index"
                        class="flex-column align-items-start" style="cursor: move">
                        <div class="d-flex w-100 justify-content-between">
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
              <b-col v-if="effectiveMode === 'edit' && lists.length > 1" md="2" cols="12">
                <b-button class="mt-1" block variant="outline-secondary"
                  @click="toggleSearch(ui.project.displaySearch)">{{
                    $t('common.search') }}</b-button>
              </b-col>
            </b-row>
          </b-col>
          <b-col v-if="effectiveMode === 'edit' && lists.length && ui.project.displaySearch" cols="12"
            class="my-2 d-print-none">
            <b-card id="card-search" bg-variant="light">
              <b-row>
                <b-col cols="11">
                  <videoHelp :txt="$t('common.search')" tag="h4" urlId="462176356"></videoHelp>
                </b-col>
                <b-col cols="1">
                  <b-button class="close mb-1" @click="toggleSearch(ui.project.displaySearch)">×</b-button>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="12">
                  <b-form-group>
                    <b-input-group>
                      <b-form-input v-model="table_settings.filter" type="search" id="filterInput"
                        :placeholder="$t('action_table.search_placeholder')"></b-form-input>
                      <b-input-group-append>
                        <b-button :disabled="!table_settings.filter" @click="table_settings.filter = null">{{
                          $t('common.clear') }}</b-button>
                      </b-input-group-append>
                    </b-input-group>
                  </b-form-group>
                </b-col>
              </b-row>

            </b-card>
          </b-col>
          <b-col cols="12" class="toDoc">
            <template v-if="checkPermissions(['can_read', 'can_write'])">
              <ViewTable :class="{ 'd-none': effectiveMode === 'view', 'd-print-none': true }" :lists="lists"
                :list_categories="list_categories" :fields="translatedTableFields" :project="project"
                :mode="effectiveMode" :canEdit="isEditing" :isBusy="table_settings.isBusy" :references="references"
                :refs="refs" :filter="table_settings.filter" :findings="findings" :refLocks="activeRefLocks"
                @get-lists="getLists" @get-project="getProject" @add-list="modalAddList" @set-busy="setBusy"
                @editor-open="onIsoqEditorOpen" @lock-denied="fetchAndUpdateRefLocks"
                @set-load-references="statusLoadReferences" @get-references="getReferences"
                @update-project-status="getProject" />
            </template>
            <!-- printed version -->
            <PrintViewTable :class="{ 'd-none': effectiveMode === 'edit', 'd-print-block': true }"
              :dataPrintVersion="lists_print_version" :references="references" :categories="list_categories"
              :printableItems="printableItems" :project="project" :hasPermission="checkPermissions('can_read')">
            </PrintViewTable>
            <!-- eopv -->
            <b-modal size="xl" centered id="add-summarized" ref="add-summarized"
              :title="$t('common.add_summarized_finding') || 'Add Summarised review finding'"
              :ok-disabled="(summarized_review) ? false : true" @ok="createList" :ok-title="$t('common.save')"
              ok-variant="outline-success" cancel-variant="outline-secondary"
              @show="onProjectEditorOpen(true)" @hidden="onProjectEditorOpen(false)">
              <b-form-group :label="$t('soqf_table.summarised_finding')" label-for="summarized-review">
                <template slot="description">
                  {{ $t('common.click') || 'Click' }}
                  <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/1"
                    target="_blank">
                    {{ $t('common.here') || 'here' }}
                  </a>
                  {{ $t('soqf_table.tips_writing') }}
                </template>
                <b-form-textarea id="summarized-review" v-model="summarized_review" rows="6"
                  max-rows="100"></b-form-textarea>
              </b-form-group>
              <b-form-group v-if="list_categories.options.length" :label="$t('soqf_table.select_group')"
                :description="$t('soqf_table.group_optional')">
                <b-form-select v-model="list_categories.selected" value-field="id" text-field="text"
                  :options="list_categories.options"></b-form-select>
              </b-form-group>
            </b-modal>

            <b-modal size="xl" id="modalEditListCategories" ref="modalEditListCategories" scrollable
              @show="onProjectEditorOpen(true)" @hidden="onProjectEditorOpen(false)">
              <template v-slot:modal-title>
                <videoHelp :txt="$t('modals.review_finding_groups')" tag="none" urlId="451100564"></videoHelp>
              </template>
              <template
                v-if="!(modal_edit_list_categories.new) && !(modal_edit_list_categories.edit) && !(modal_edit_list_categories.remove)">
                <p class="font-weight-light">
                  {{ $t('modals.categories_long_description') }}
                </p>
                <p class="text-danger">
                  {{ $t('modals.categories_numbering_instruction') }}
                </p>
              </template>
              <template
                v-if="modal_edit_list_categories.options.length && !(modal_edit_list_categories.new) && !(modal_edit_list_categories.edit) && !(modal_edit_list_categories.remove)">
                <b-table head-variant="highlight" striped :fields="translatedModalFields"
                  :items="modal_edit_list_categories.options">
                  <template v-slot:cell(actions)="data">
                    <b-button block variant="outline-success" @click="editListCategoryName(data.index)">{{
                      $t('common.edit') }}</b-button>
                    <b-button block variant="outline-danger" class="mt-1" @click="removeListCategory(data)">{{
                      $t('common.remove') }}</b-button>
                  </template>
                </b-table>
              </template>
              <template v-if="modal_edit_list_categories.new">
                <p class="text-danger">
                  {{ $t('modals.categories_numbering_instruction') }}
                </p>
                <b-form-group class="mt-3" :label="$t('common.add_group_name') || 'Add group name'">
                  <b-form-input v-model="modal_edit_list_categories.text"
                    :state="categoryNameIsDuplicate ? false : null"></b-form-input>
                  <p v-if="categoryNameIsDuplicate" class="text-danger mt-1 mb-0">
                    {{ $t('categories.duplicate_name') }}
                  </p>
                </b-form-group>
                <b-form-group class="mt-3"
                  :label="$t('common.describe_group') || 'Describe this group for the user viewing this table'">
                  <b-form-input v-model="modal_edit_list_categories.extra_info"></b-form-input>
                </b-form-group>
              </template>
              <template class="mt-3" v-if="modal_edit_list_categories.edit">
                <p class="text-danger">
                  {{ $t('modals.categories_numbering_instruction') }}
                </p>
                <b-form-group :label="$t('common.edit_group_name') || 'Edit group name'">
                  <b-form-input v-model="modal_edit_list_categories.text"
                    :state="categoryNameIsDuplicate ? false : null"></b-form-input>
                  <p v-if="categoryNameIsDuplicate" class="text-danger mt-1 mb-0">
                    {{ $t('categories.duplicate_name') }}
                  </p>
                </b-form-group>
                <b-form-group class="mt-3"
                  :label="$t('common.describe_group') || 'Describe this group for the user viewing this table'">
                  <b-form-input v-model="modal_edit_list_categories.extra_info"></b-form-input>
                </b-form-group>
              </template>
              <template class="mt-3" v-if="modal_edit_list_categories.remove">
                <p>
                  {{ $t('modals.confirm_delete_group') }} <b>{{ modal_edit_list_categories.text }}</b>?
                </p>
              </template>
              <template v-slot:modal-footer>
                <div v-if="modal_edit_list_categories.remove">
                  <b-button variant="outline-primary" @click="modalCancelCategoryButtons">{{ $t('common.cancel')
                    }}</b-button>
                  <b-button variant="outline-danger" @click="removeCategory()">{{ $t('common.confirm') || 'Confirm'
                    }}</b-button>
                </div>
                <div v-if="modal_edit_list_categories.new">
                  <b-button variant="outline-primary" @click="modalCancelCategoryButtons">{{ $t('common.cancel')
                    }}</b-button>
                  <b-button variant="outline-success"
                    :disabled="modal_edit_list_categories.text === '' || categoryNameIsDuplicate"
                    @click="saveNewCategory">{{ $t('common.save') }}</b-button>
                </div>
                <div v-if="!modal_edit_list_categories.new">
                  <b-button
                    v-if="!(modal_edit_list_categories.new) && !(modal_edit_list_categories.edit) && !(modal_edit_list_categories.remove)"
                    variant="outline-primary" :disabled="!isOnline" @click="modal_edit_list_categories.new = true">
                    {{ $t('common.add_new_finding_group') }}
                  </b-button>
                </div>
                <div v-if="modal_edit_list_categories.edit">
                  <b-button variant="outline-primary" @click="modalCancelCategoryButtons">{{ $t('common.cancel')
                    }}</b-button>
                  <b-button variant="outline-success"
                    :disabled="modal_edit_list_categories.text === '' || categoryNameIsDuplicate"
                    @click="updateCategoryName(modal_edit_list_categories.index)">{{ $t('common.update') }}</b-button>
                </div>
              </template>
            </b-modal>
            <back-to-top></back-to-top>
            <!-- Lock Modals -->
            <b-modal id="modal-lock-lost" :title="$t('lock.connection_lost')" ok-only :ok-title="$t('lock.reload')" @ok="reloadPage"
              no-close-on-backdrop no-close-on-esc hide-header-close>
              <div class="text-center">
                <font-awesome-icon icon="exclamation-triangle" size="3x" class="text-warning mb-3" />
                <p>{{ $t('lock.lock_lost_message') }}</p>
              </div>
            </b-modal>
            <b-modal id="modal-lock-idle" :title="$t('lock.session_timeout')" ok-only :ok-title="$t('lock.reload')" @ok="reloadPage"
              no-close-on-backdrop no-close-on-esc hide-header-close>
              <div class="text-center">
                <font-awesome-icon icon="lock" size="3x" class="text-secondary mb-3" />
                <p>{{ $t('lock.idle_message') }}</p>
              </div>
            </b-modal>
          </b-col>
        </b-row>
      </div>
      <div :class="{ 'block mt-3': (tabOpened === 3) ? true : false, 'd-none': (tabOpened === 3) ? !true : !false }">
        <content-guidance></content-guidance>
      </div>
    </b-container>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import LockService from '@/services/lockService'
import draggable from 'vuedraggable'
import Commons from '../../utils/commons.js'
import preserveScrollMixin from '@/mixins/preserveScrollMixin'
import projectFreshnessMixin from '@/mixins/projectFreshnessMixin'

const contentGuidance = () => import(/* webpackChunkName: "contentguidance" */ '../contentGuidance.vue')
const backToTop = () => import(/* webpackChunkName: "backtotop" */ '../backToTop.vue')
const videoHelp = () => import(/* webpackChunkName: "videohelp" */ '../videoHelp.vue')
const actionButtons = () => import(/* webpackChunkName: 'actionButtons' */'./actionButtons.vue')
const propertiesProject = () => import(/* webpackChunkName: "propertiesProject" */ './propertiesProject.vue')
const UploadReferences = () => import(/* webpackChunkName: "uploadReferences" */ './UploadReferences.vue')
const InclusionExclusioCriteria = () => import(/* webpackChunkName: "inclusionExclusionCriteria" */ './InclusionExclusionCriteria.vue')
const PrintViewTable = () => import(/* webpackChunkName: "printViewTable" */ './PrintViewTable.vue')

// Mismo tick que usan los Pasos 3 y 4. Es el techo de cuánto puede tardar en verse un
// finding creado por otra persona, y de cuánto tarda una fila en aparecer bloqueada.
const PROJECT_POLL_INTERVAL = 15000

// Un nombre de categoría comparable. Tolera `text` ausente o null a propósito: medido,
// hay 11 categorías en la base sin ese campo, y `String(undefined)` daría 'undefined'.
function normalizeCategoryName (text) {
  return String(text === null || text === undefined ? '' : text).trim().toLowerCase()
}

// Identidad del catálogo de categorías por CONTENIDO, no por referencia.
// `processGetListCategories` reasigna `list_categories.options` a un array nuevo en cada
// getListCategories(), así que un watcher sobre el array se dispara aunque nada haya
// cambiado. Los tres campos son los que `processLists()` lee para pintar la fila.
function categoryCatalogSignature (options) {
  if (!Array.isArray(options)) return ''
  return options
    .map(o => [o && o.id, (o && o.text) || '', (o && o.extra_info) || ''].join('\u0000'))
    .join('\u0001')
}

export default {
  mixins: [preserveScrollMixin, projectFreshnessMixin],
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
      // Locks vigentes del proyecto, sondeados junto con la frescura (ver
      // startProjectPolling). Se los pasamos a ViewTable para que grisée los botones de
      // un finding que otro está editando antes de que alguien lo intente.
      activeRefLocks: [],
      // Un refresco automático repinta `lists` debajo de quien esté escribiendo. Estos
      // dos dicen si hay un editor abierto: uno para los modales de ViewTable (llegan por
      // el evento `editor-open`) y otro para los de esta misma vista.
      // El refresco automático se declara dueño de la recarga del listado mientras corre,
      // para que el watcher del catálogo no la duplique.
      suppressCategoryReload: false,
      isoqEditorOpen: false,
      projectEditorOpen: false,
      stepStage: 0,
      camelotLogo: require('@/assets/camelot-logo.svg'),
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
      references: [],
      refs: [],
      loadReferences: true,
      // True only during the initial mount load. getProject() already triggers getLists();
      // the list_categories.options watcher must not fire a second getLists while this is on.
      initialLoad: true,
      fileReferences: [],
      selected_list_index: null,
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
      episte_request: '',
      episte_selected: [],
      episte_loading: false,
      episte_error: false,
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
  created () {
    // Un solo uso: el deep-link a un finding debe centrarlo al entrar, no en cada
    // recarga posterior. En `$_` porque nada lo renderiza. Ver routeAnchorHash().
    this.$_pendingAnchorScroll = true
  },
  async mounted () {
    window.addEventListener('lock-lost', this.handleLockLost)
    window.addEventListener('lock-idle', this.handleIdle)
    window.addEventListener('axios-refresh-lock', this.handleLockLost)
    // A write was rejected with 403 somewhere in the app (project properties,
    // a finding save, a ref-lock attempt, etc.) — re-check this user's permission
    // right away instead of waiting for them to navigate to a different tab/step.
    window.addEventListener('permission-denied', this.refreshPermissions)
    // Un lock tomado o soltado en esta misma pestaña no espera al próximo tick.
    window.addEventListener('ref-locks-changed', this.fetchAndUpdateRefLocks)

    // Categories and references are independent of each other, so load them
    // concurrently. Both must finish before getProject() (its getLists() → processLists()
    // sorts findings by category and cross-references refs), hence the Promise.all barrier.
    await Promise.all([this.getListCategories(), this.getReferences()])
    // Load project which will also trigger getLists()
    await this.getProject()
    // Initial load done: from now on a category change should reload lists via the watcher.
    this.initialLoad = false
    // Other parallel data loads
    this.getCharacteristicsData()
    this.getAssessmentsData()
    // Después de la carga inicial: el primer tick sólo ceba `knownLastUpdate`, así que
    // arrancarlo acá y no al entrar al tab iSoQ es lo que hace que un cambio ajeno se vea
    // sin recargar. Ver startProjectPolling.
    this.startProjectPolling()
  },
  beforeDestroy () {
    LockService.release()
    // Same net as editList.vue: SPA navigation fires no pagehide, so a ref lock held by
    // a child (a crudTables row, a camelot study) would survive leaving the project and
    // stay held until the server TTL. Verified live before this was added.
    LockService.releaseRef()
    window.removeEventListener('lock-lost', this.handleLockLost)
    window.removeEventListener('lock-idle', this.handleIdle)
    window.removeEventListener('axios-refresh-lock', this.handleLockLost)
    window.removeEventListener('permission-denied', this.refreshPermissions)
    window.removeEventListener('ref-locks-changed', this.fetchAndUpdateRefLocks)
    this.stopProjectPolling()
  },
  methods: {
    /**
     * Lo que significa recargar acá: releer el listado de findings del tab iSoQ.
     *
     * Las tres cosas, y en este orden. El catálogo de categorías y las referencias no son
     * decoración de la fila: `processLists()` deriva de ellos el nombre del grupo, y vía
     * `Commons.sortFindings` el agrupamiento del que sale el NÚMERO del finding. Con el
     * catálogo viejo, una categoría que otra persona acaba de crear llega sin nombre y su
     * finding se ordena como si no tuviera grupo.
     *
     * Medido en navegador antes de arreglarlo: con la categoría nueva asignada por otra
     * persona, esta pantalla mostraba `4 = Feeling extreme…` y `5 = Example one`, y la de
     * al lado los mostraba al revés. Es justo lo que el número del finding no puede hacer,
     * porque es con lo que dos personas se reparten el trabajo.
     *
     * `getReferences(false)`: con su default `true` reposiciona el tab y el step, o sea que
     * un refresco de fondo te sacaría del tab que estás mirando.
     */
    applyProjectRefresh: async function () {
      // El watcher de `list_categories.options` también recarga el listado cuando el
      // catálogo cambia, así que sin coordinarlos un cambio ajeno de categoría pedía
      // isoqf_lists + findings DOS veces (medido en navegador). Acá el refresco se declara
      // dueño de esa recarga y el watcher se abstiene: un solo par de GETs.
      //
      // El `$nextTick` no es decorativo — los watchers de Vue 2 corren en la cola del
      // scheduler, o sea después del `await`. Sin esperar ese flush, el flag bajaría antes
      // de que el watcher haya tenido su turno y volvería a haber dos recargas.
      this.suppressCategoryReload = true
      try {
        await Promise.all([this.getListCategories(), this.getReferences(false)])
        await this.$nextTick()
      } finally {
        this.suppressCategoryReload = false
      }
      this.getLists()
    },
    /**
     * Repintar la tabla debajo de alguien que escribe le descarta el borrador, y además
     * dejaría colgados los índices que los modales capturaron al abrir.
     */
    hasOpenEditor: function () {
      return this.isoqEditorOpen || this.projectEditorOpen
    },
    /** ViewTable avisa por evento porque los modales del listado viven en el hijo. */
    onIsoqEditorOpen: function (open) {
      this.isoqEditorOpen = open
      if (!open) this.flushPendingRefresh()
    },
    /** Ídem para los modales propios de esta vista (alta, reordenar, categorías). */
    onProjectEditorOpen: function (open) {
      this.projectEditorOpen = open
      if (!open) this.flushPendingRefresh()
    },
    fetchAndUpdateRefLocks: async function () {
      this.activeRefLocks = await LockService.fetchRefLocks(this.$route.params.id)
    },
    /**
     * Un solo timer para las dos preguntas que se le hacen al servidor cada 15 s: quién
     * tiene tomado qué, y si alguien cambió algo. Mismo piggyback que StepThree/StepFour.
     *
     * Va en esta vista y no en ViewTable porque `getLists()` vive acá, y sobre todo
     * porque viewProject no se desmonta mientras se esté en el proyecto: los cuatro tabs
     * se ocultan con `d-none`, no con `v-if`. Ese detalle ES el bug reportado — quien
     * estaba en "My data" mientras otro creaba findings no los veía al volver a iSoQ,
     * porque nada re-pedía la lista. Con el sondeo corriendo desde `mounted`, el tab
     * oculto ya llega actualizado.
     */
    startProjectPolling: function () {
      this.fetchAndUpdateRefLocks()
      this.checkProjectFreshness()
      this.projectPollTimer = setInterval(() => {
        this.fetchAndUpdateRefLocks()
        this.checkProjectFreshness()
      }, PROJECT_POLL_INTERVAL)
    },
    stopProjectPolling: function () {
      if (this.projectPollTimer) clearInterval(this.projectPollTimer)
      this.projectPollTimer = null
    },
    setBusy: function (value) {
      this.table_settings.isBusy = value
    },
    updateDataProject: function (data) {
      this.getProject()
    },
    getListCategories: async function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      return Api.get('/isoqf_list_categories', params)
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
      return Api.get(`/isoqf_references`, params)
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
      return Api.get(`/isoqf_projects/${this.$route.params.id}`, params)
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
          if (!Object.prototype.hasOwnProperty.call(_project, 'can_write')) {
            _project.can_write = []
          }
          if (!Object.prototype.hasOwnProperty.call(_project, 'can_read')) {
            _project.can_read = []
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

          // Granular per-ref locking replaces the project-wide lock here: this view
          // never acquires one. The project lock survives only in viewOrganization.vue,
          // around the Properties modal — the one write that is still project-scoped.

          this.ui.project.show_criteria = true
          this.getLists()
        })
        .catch((error) => {
          if (error.isOfflineError) {
            this.$notify.warning(this.$t('offline.projectNotCached'))
          }
          Commons.printErrors(error)
        })
    },
    // Re-checks this user's can_write/can_read against the server without a full
    // reload, so a permission change made by the project owner while this user has
    // the project open takes effect on their next tab/step navigation.
    refreshPermissions: async function () {
      const params = {
        organization: this.$route.params.org_id
      }
      try {
        const response = await Api.get(`/isoqf_projects/${this.$route.params.id}`, params)
        const wasWrite = this.checkPermissions('can_write')
        this.$set(this.project, 'can_write', response.data.can_write)
        this.$set(this.project, 'can_read', response.data.can_read)
        const isWriteNow = this.checkPermissions('can_write')

        if (wasWrite && !isWriteNow) {
          // Lost write access while in edit mode
          if (this.mode === 'edit') {
            this.mode = 'view'
            this.$bvToast.toast(this.$t('lock.permissions_revoked'), {
              title: this.$t('notifications.error'),
              variant: 'danger',
              solid: true
            })
          }
        } else if (!wasWrite && isWriteNow) {
          // Gained write access: drop the user straight into edit mode so the
          // toast's promise ("you can edit now") holds without an extra click.
          this.mode = 'edit'
          this.$bvToast.toast(this.$t('lock.permissions_granted'), {
            title: this.$t('notifications.success'),
            variant: 'success',
            solid: true
          })
        }
      } catch (error) {
        console.warn('refreshPermissions failed', error)
      }
    },
    getCharacteristicsData: async function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }

      try {
        const response = await Api.get('/isoqf_characteristics', params)
        if (response.data && response.data.length > 0) {
          this.charsOfStudies = response.data[0]
        } else {
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
          this.methodologicalTableRefs = response.data[0]
        } else {
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
        options.splice(0, 0, { id: null, text: this.$t('categories.no_group') })
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
          refs.push({ 'id': reference.id, 'content': content })
        }
      }

      if (refs.length) {
        return refs.sort((a, b) => a.content.localeCompare(b.content))
      }
      return refs
    },
    getLists: function () {
      // El slot `table-busy` reemplaza el `tbody` entero: el documento se acorta y el
      // navegador clampea la posición. Acá porque es el punto único por donde pasan
      // todas las mutaciones de la tabla — crear, borrar y reordenar findings.
      this.holdScrollPosition()
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
          // Reset isBusy so a parse/processing error surfaces an empty/error table instead of
          // an infinite spinner (isBusy starts true and is only cleared on the happy path).
          this.table_settings.isBusy = false
          Commons.printErrors(error)
        })
    },
    /**
     * Centra el finding al que apunta la URL, y sólo al entrar.
     *
     * Antes esto hacía un `$router.push` con un hash y después scrolleaba al ancla.
     * Ese push era el bug reportado: no navega a ninguna parte —mismo `name`, mismos
     * `params`, sólo cambia el hash— pero vue-router no distingue y ejecuta el
     * `scrollBehavior` global de main.js igual, que devuelve `{x: 0, y: 0}`. Es decir
     * que cada guardado de una fila mandaba al usuario al tope. De paso reconstruía
     * `query` con sólo `tab` y se comía `step`.
     *
     * Sacarlo no pierde nada: nadie lee ese hash. El único lector de `$route.hash` en
     * toda la app es Login.vue, para el redirect de OAuth.
     *
     * Queda sólo el scroll del deep-link entrante desde la worksheet
     * (editListHeader.vue arma `query: {tab: 'iSoQ', hash: 'a-<list.id>'}`), y queda
     * detrás de un flag de un solo uso. El flag no es prolijidad: antes el propio push
     * reescribía el query y borraba `hash`, así que esto corría una vez sola. Sin push,
     * `hash` sobrevive en la URL y cada getLists() posterior —cada guardado, cada
     * renombre— volvería a arrastrar al usuario hasta ese finding. Limpiar el query con
     * `$router.replace` tampoco sirve: en vue-router 3 `replace` también dispara
     * `scrollBehavior`.
     */
    routeAnchorHash: function () {
      if (!this.$_pendingAnchorScroll) return
      if (!Object.prototype.hasOwnProperty.call(this.$route.query, 'hash')) return
      this.$_pendingAnchorScroll = false

      const elementId = `${this.$route.query.hash}`
      // `$nextTick` y no `setTimeout(0)`: el ancla vive en una fila de la tabla que
      // se está repintando en este mismo tick, así que buscarla antes del re-render
      // encuentra el DOM viejo o nada.
      this.$nextTick(() => {
        const el = document.getElementById(elementId)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
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
        }).catch(() => { })
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
    displaySelectedOption: function (option, type) {
      return Commons.displaySelectedOption(option, type)
    },
    parseReference: function (reference, onlyAuthors = false, hasSemicolon = true) {
      return Commons.parseReference(reference, onlyAuthors, hasSemicolon)
    },
    processLists: async function (response) {
      let data = JSON.parse(JSON.stringify(response.data))
      if (data.length) {
        data = Commons.sortFindings(data, this.list_categories)
        // Sort the references once, not once per list: this.references does not change
        // during the loop, so hoisting the clone+sort turns an O(lists x refs log refs)
        // per-list cost into a single O(refs log refs).
        const sortedReferences = [...this.references].sort((a, b) => a.id - b.id)
        // parseReference(r, true) is pure for a fixed reference, so the authors string is
        // identical every time a list cites that reference. Build it once per reference here
        // instead of once per (list, ref) match in the loop below (was O(Σ list.references)
        // parses; now O(references)).
        const parsedAuthorsById = new Map()
        for (const r of sortedReferences) {
          parsedAuthorsById.set(r.id, this.parseReference(r, true))
        }
        for (let list of data) {
          if (!Object.prototype.hasOwnProperty.call(list, 'evidence_profile')) {
            list.status = 'unfinished'
            list.explanation = 'without_explanation'
          } else {
            list.status = 'completed'
            list.explanation = 'with_explanation'
            // Granular updates may persist only the changed sections, so backfill any missing
            // evidence_profile section with a safe default before any reader touches it.
            Commons.normalizeEvidenceProfile(list)
            // Read the authoritative cerqual via resolveCerqual: the granular-update writer keeps
            // the top-level list.cerqual in sync but may leave evidence_profile without a cerqual key.
            const cerqual = Commons.resolveCerqual(list)
            if (cerqual.option === null) {
              list.status = 'unfinished'
            }
            if (cerqual.explanation === '') {
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
          // Iterate sortedReferences (id order preserved) and keep only the ones this list
          // cites; the Set turns the inner O(list.references) scan into an O(1) membership test.
          const citedIds = new Set(list.references)
          for (let r of sortedReferences) {
            if (citedIds.has(r.id)) {
              list.ref_list = list.ref_list + parsedAuthorsById.get(r.id)
              list.raw_ref.push(r)
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
          categories.push({ 'name': this.$t('categories.uncategorised_findings'), 'id': 'uncategorized', 'value': null, 'items': [], is_category: true })

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
                      'displayNumber': list.displayNumber
                    }
                  )
                }
              }
            }
          }
          // El número ya viene en displayNumber desde sortFindings: acá sólo se
          // intercalan los encabezados de categoría, que no llevan número.
          let _items = []
          for (const cat of categories) {
            if (cat.items.length) {
              _items.push(cat)
              _items.push(...cat.items)
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
          // Replace (don't append): getFindings is always called with the full set of
          // list_ids at once, so a fresh load must supersede the previous one. Appending
          // left stale/duplicate findings in memory on any re-load (open, category edit).
          this.findings = [...response.data]
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
      // this.lists is sortFindings' output, ordered by (category, sort) for display — NOT by
      // sort. The last element in that display order does not carry the maximum persisted
      // sort, so the new list's sort must be computed from the real max, not from position.
      let sort = 1
      const sorts = this.lists.map(l => Number(l.sort)).filter(Number.isFinite)
      if (sorts.length) {
        sort = Math.max(...sorts) + 1
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
        })
        .catch((error) => {
          Commons.printErrors(error)
          this.$notify.error(this.$t('notifications.create_error'))
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
        evidence_profile: {
          name: listName,
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
          this.$notify.success(this.$t('notifications.created'))
        })
        .catch((error) => {
          Commons.printErrors(error)
          this.$notify.error(this.$t('notifications.create_error'))
        })
    },
    getAuthorsFormat: function (authors = [], pubYear = '') {
      return Commons.getAuthorsFormat(authors, pubYear)
    },
    modalListCategories: async function () {
      await this.getListCategories()
      this.$refs['modalEditListCategories'].show()
    },
    /**
     * La categoría del proyecto que choca con el nombre que hay en el formulario, o null.
     *
     * Es un invariante de TRANSICIÓN, no de estado: sólo impide INTRODUCIR una colisión.
     * Al renombrar, un texto igual al que la categoría ya tenía pasa igual, aunque tenga
     * una homónima. Sin esa excepción, en los proyectos que ya arrastran duplicados
     * (medido: 21 grupos en 5 proyectos, 16 con findings en las dos copias) nadie podría
     * tocarle el `extra_info` a una de ellas — y sería justo quien intenta desenredarlas.
     *
     * Compara contra `modal_edit_list_categories.options`, que es el catálogo puro; el otro
     * lleva prependido el `{id: null, text: no_group}` y bloquearía ese nombre de regalo.
     * El ámbito es el proyecto: `getListCategories()` filtra por `project_id`, y así tiene
     * que quedar — hay 238 nombres que se repiten legítimamente entre proyectos distintos.
     */
    findCollidingCategory: function () {
      const options = this.modal_edit_list_categories.options || []
      const wanted = normalizeCategoryName(this.modal_edit_list_categories.text)
      if (!wanted) return null
      const ownId = this.modal_edit_list_categories.edit ? this.modal_edit_list_categories.id : null
      const own = ownId ? options.find(o => o && o.id === ownId) : null
      if (own && normalizeCategoryName(own.text) === wanted) return null
      return options.find(o => o && o.id !== ownId && normalizeCategoryName(o.text) === wanted) || null
    },
    /**
     * Relee el catálogo del servidor y responde si el nombre choca.
     *
     * El catálogo local puede tener minutos —el gestor se abre y la persona se queda
     * pensando el nombre mientras otro crea el mismo—, así que la única comparación que
     * vale es contra el servidor y en el mismo gesto que la escritura. Al volver, el
     * computed `categoryNameIsDuplicate` ya ve la categoría ajena y pinta el aviso solo.
     */
    hasFreshCategoryNameCollision: async function () {
      await this.getListCategories()
      return this.findCollidingCategory() !== null
    },
    saveNewCategory: async function () {
      if (await this.hasFreshCategoryNameCollision()) return
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
    updateCategoryName: async function () {
      const objID = this.modal_edit_list_categories.id

      if (objID) {
        if (await this.hasFreshCategoryNameCollision()) return
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
            this.$notify.success(this.$t('notifications.deleted'))
          })
          .catch((error) => {
            Commons.printErrors(error)
            this.$notify.error(this.$t('notifications.delete_error'))
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
      // Sólo el campo que cambia. Mandar el documento entero reescribía `displayNumber`
      // —una posición derivada que no debe persistirse en ninguna parte— y de paso
      // devolvía a la base cualquier `isoqf_id` legado que la lista trajera del servidor.
      // El refetch de getLists() deja el estado local consistente.
      const _request = []
      for (const list of this.lists) {
        if (list.category === deletedCategoryValue[0].id) {
          _request.push(Api.patch(`/isoqf_lists/${list.id}`, { category: null }))
        }
      }
      Promise.all(_request)
        .then(() => {
          this.getLists()
        })
    },
    modalSortFindings: function () {
      // this.lists is already in the derived display order (category, then sort) — the same
      // order the user sees in the iSoQ table. Re-sorting by the raw persisted `sort` used to
      // be a no-op back when sortFindings renumbered sort to 1..N on every read, but now that
      // it doesn't, re-sorting here would show the drag modal in a different order than the
      // table it is meant to reorder, and that reordered view is what saveSortedLists writes
      // back as the new 1..N sort.
      this.sorted_lists = JSON.parse(JSON.stringify(this.lists))
      this.$refs['modal-sort-findings'].show()
    },
    saveSortedLists: function () {
      let cnt = 1
      let requests = []
      this.table_settings.isBusy = true
      for (const list of this.sorted_lists) {
        const sortValue = cnt++
        // El número visible se deriva de este orden, así que no hay espejo que
        // actualizar en isoqf_findings. Antes esto costaba 2N escrituras.
        requests.push(Api.patch(`/isoqf_lists/${list.id}`, { 'sort': sortValue }))
      }

      Promise.all(requests)
        .then(() => {
          this.getLists()
          this.$refs['modal-sort-findings'].hide()
          this.$notify.success(this.$t('notifications.saved'))
        })
        .catch((error) => {
          this.table_settings.isBusy = false
          Commons.printErrors(error)
          this.$notify.error(this.$t('notifications.save_error'))
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
    onCriteriaSaved: function (payload) {
      this.$set(this.project, payload.field, payload.value)
    }
  },
  watch: {
    'list_categories.options': function (newVal, oldVal) {
      // NOTE: getProject() already calls getLists() on the initial mount, so firing here too
      // duplicates GET /isoqf_lists + GET /findings (and, before the reset fix, duplicated
      // findings in memory). Guard against the initial load using this.initialLoad, while
      // still reloading when categories genuinely change afterwards (and not on empty).
      if (!newVal || newVal.length === 0 || this.initialLoad) return
      // applyProjectRefresh() ya se hizo cargo de la recarga; ver el comentario de allá.
      if (this.suppressCategoryReload) return
      // Y comparar el CONTENIDO, no la referencia: `processGetListCategories` reasigna el
      // array en cada getListCategories(), así que sin esto el watcher se dispara siempre.
      // Costaba dos cosas: abrir el gestor de categorías pedía isoqf_lists + findings de
      // gusto, y el refresco automático los pedía dos veces (acá y en applyProjectRefresh).
      if (categoryCatalogSignature(newVal) === categoryCatalogSignature(oldVal)) return
      this.getLists()
    },
    '$route.query.tab': function (val) {
      const tabs = ['Project-Property', 'My-Data', 'iSoQ', 'Guidance-on-applying-GRADE-CERQual']
      const index = tabs.indexOf(val)
      if (index !== -1) {
        this.tabOpened = index
      }
      // The iSoQ "Print or export" button toggles mode='view' (preview), but mode is
      // shared across all tabs — leaving it 'view' locks Properties/My-Data read-only.
      // Re-derive mode from permissions on tab change so the preview stays local to iSoQ.
      if (this.checkPermissions('can_write')) {
        this.mode = 'edit'
      } else if (this.checkPermissions('can_read')) {
        this.mode = 'view'
      }
      this.refreshPermissions()
      // Al entrar al tab es cuando la persona mira la tabla: no la hagamos esperar hasta
      // el próximo tick. `knownLastUpdate` ya está cebado por el sondeo de mounted.
      this.checkProjectFreshness()
    },
    '$route.query.step': function (val) {
      if (val) {
        this.stepStage = parseInt(val) - 1
      }
      this.refreshPermissions()
    },
    '$route.params.id': {
      handler: function (id) {
        this.getProject()
        this.getListCategories()
        this.getReferences()
      }
    }
  },
  computed: {
    /** Aviso en vivo mientras se escribe. El chequeo que manda es el del submit. */
    categoryNameIsDuplicate: function () {
      return this.findCollidingCategory() !== null
    },
    formattedCamelotDescription: function () {
      const desc = this.$t('camelot.step_three.description')
      const iconHtml = `<img src="${this.camelotLogo}" width="16" height="16" class="align-middle mx-1" />`
      return desc.replace('{icon}', iconHtml)
    },
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
          { key: 'displayNumber', label: '#' },
          { key: 'name', label: this.$t('table_headers.summarised_finding') },
          { key: 'category_name', label: this.$t('table_headers.review_finding_groups') },
          { key: 'cerqual_option', label: this.$t('table_headers.cerqual_assessment') },
          { key: 'cerqual_explanation', label: this.$t('table_headers.cerqual_explanation') },
          { key: 'ref_list', label: this.$t('table_headers.references') }
        ],
        without_categories: [
          { key: 'displayNumber', label: '#' },
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
    select_options: function () {
      return [
        { value: 0, text: this.$t('cerqual_options.no_very_minor_concerns') },
        { value: 1, text: this.$t('cerqual_options.minor_concerns') },
        { value: 2, text: this.$t('cerqual_options.moderate_concerns') },
        { value: 3, text: this.$t('cerqual_options.serious_concerns') },
        { value: null, text: this.$t('cerqual_options.undefined') }
      ]
    },
    cerqual_confidence: function () {
      return [
        { value: 'hc', text: this.$t('cerqual_options.high_confidence') },
        { value: 'mc', text: this.$t('cerqual_options.moderate_confidence') },
        { value: 'lc', text: this.$t('cerqual_options.low_confidence') },
        { value: 'vc', text: this.$t('cerqual_options.very_low_confidence') },
        { value: null, text: this.$t('cerqual_options.undefined') }
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
    }
  }
}
</script>

<style scoped>
.return {
  font-size: 1.2rem;
}

div>>>h2>span>svg,
h3>span>svg,
h4>span>svg {
  font-size: 1rem;
}

div>>>.nav-fill .nav-item {
  text-transform: uppercase;
  font-weight: bold;
}

div>>>a.table-edit-list {
  color: #000;
  text-decoration: underline;
}

div>>>#chars-of-studies-table thead th:first-child {
  width: 25%;
}

div>>>#methodological-table thead th:first-child {
  width: 25%;
}

div>>>#extracted-data-table thead th:first-child {
  width: 25%;
}

div>>>#chars-of-studies-table thead th:last-child {
  width: 13%;
}

div>>>#methodological-table thead th:last-child {
  width: 13%;
}

div>>>#findings.table thead th {
  width: 15%;
}

div>>>#findings.table thead th:nth-child(2) {
  width: 45%;
}

div>>>#findings.table thead th:first-child {
  width: 5%;
}

div>>>#findings.table thead th:last-child {
  width: 5%;
}

div>>>.text-danger.remove-opt {
  cursor: pointer;
}

div>>>#findings-print.table thead th {
  width: 15%;
}

div>>>#findings-print.table thead th:nth-child(2) {
  width: 35%;
}

div>>>#findings-print.table thead th:first-child {
  width: 5%;
}

div>>>#findings-print.table thead th:last-child {
  width: 15%;
}
</style>
