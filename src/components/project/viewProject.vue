<template>
  <div class="mt-4">
    <b-container>
      <b-row align-h="end">
        <b-col cols="12" class="text-right d-print-none">
          <b-link :to="{ name: 'viewOrganization', params: { id: this.$route.params.org_id }}">
            <font-awesome-icon icon="long-arrow-alt-left" v-bind:title="$t('back')" />
            {{ $t('back') }}
          </b-link>
        </b-col>
      </b-row>
      <b-tabs
        content-class="mt-3"
        fill
        v-model="tabOpened">
        <b-tab title="Project properties">
          <b-row>
            <b-col
              cols="12">
              <b-alert
                :show="msgUpdateProject !==null && msgUpdateProject.length"
                dismissible
                variant="info"
                @dismissed="dismissAlertProject">
                {{ msgUpdateProject }}
              </b-alert>
            </b-col>
            <b-col
              cols="12"
              class="mb-2">
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
                v-if="!project.complete_by_author"
                label="Please list the authors of this iSoQf"
                label-for="list-authors">
                <b-form-input
                  id="list-authors"
                  v-model="project.lists_authors">
                </b-form-input>
              </b-form-group>
              <b-form-group
                label="Visible?"
                label-for="project-list-status">
                <b-select
                  id="project-list-status"
                  v-model="project.private"
                  :options="global_status"></b-select>
              </b-form-group>
              <b-form-group
                label="Aditional information">
                <b-form-textarea
                  v-model="project.description"></b-form-textarea>
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
        <b-tab title="Uploaded Data">
          <b-row>
            <b-col
              cols="12">
              <h3>Add Data Needed to Make CERQual Assessments</h3>
              <p>
                To optimize the functionality of iSoQf, and save you time, please add the following information organised into 4 steps.
              </p>
            </b-col>
            <b-col
              cols="12">
              <h4>STEP 1: Upload the references for your included Studies (required)</h4>
              <p class="font-weight-light">
                You must import only the references for your final list of included studies
              </p>
              <b-row>
                <b-col
                  cols="6">
                  <b-form-file
                    id="input-ris-file-key"
                    plain
                    @change="loadRefs($event)"></b-form-file>
                </b-col>
                <b-col
                  cols="6">
                  <b-button
                    block
                    :disabled="(fileReferences.length >= 1) ? false : true"
                    class="mt-2"
                    variant="success"
                    @click="saveReferences">
                      Upload
                  </b-button>
                </b-col>
              </b-row>
              <b-row
                class="mt-3">
                <b-col
                  cols="12">
                  <b-card
                    bg-variant="light">
                    <template
                      v-if="loadReferences">
                      <div class="text-center text-danger my-2">
                        <b-spinner class="align-middle"></b-spinner>
                        <strong>Loading...</strong>
                      </div>
                    </template>
                    <template v-else>
                      <b-row v-if="!references.length">
                        <b-col
                          cols="12">
                            <p>No references have been uploaded</p>
                        </b-col>
                      </b-row>
                      <b-row v-else>
                        <b-col
                          cols="6"
                          class="pt-2">
                          <span>
                            You have <b>{{ references.length }}</b> references loaded
                          </span>
                        </b-col>
                        <b-col cols="6">
                          <b-button
                            block
                            @click="openModalReferencesSingle"
                            variant="outline-primary">
                            View references
                          </b-button>
                        </b-col>
                      </b-row>
                    </template>
                  </b-card>
                </b-col>
              </b-row>
            </b-col>
            <b-col
              cols="12"
              class="mt-3">
              <h4>STEP 2: Create or Import your Characteristics of Studies Table (recommended)</h4>
              <p class="font-weight-light">
                Descriptive information extracted from the included studies (e.g. setting, country, perspectives, methods, etc.)
              </p>
              <b-row>
                <b-col
                  sm="5">
                  <b-button
                    block
                    variant="outline-primary"
                    v-if="charsOfStudies.fields.length <= 2"
                    @click="openModalCharsOfStudies"
                    :disabled="(references.length) ? false : true">
                    Create Table
                  </b-button>
                  <b-button
                    block
                    variant="outline-primary"
                    v-if="charsOfStudies.fields.length > 2"
                    @click="openModalCharsOfStudiesEdit">
                    Edit column headings
                  </b-button>
                </b-col>
                <b-col
                  sm="2">
                  <p class="text-center pt-1">OR</p>
                </b-col>
                <b-col
                  sm="5">
                  <b-button
                    block
                    variant="outline-info"
                    :disabled="(references.length) ? false : true"
                    v-b-modal.import-characteristics-table>
                    Import table
                  </b-button>
                </b-col>
              </b-row>
              <b-table
                sort-by="authors"
                responsive
                id="chars-of-studies-table"
                v-if="charsOfStudies.fieldsObj.length > 1"
                :fields="charsOfStudies.fieldsObj"
                :items="charsOfStudies.items"
                :current-page="charsOfStudiesConfigTable.currentPage"
                :per-page="charsOfStudiesConfigTable.perPage"
                class="table-content-refs mt-3">
                <template
                  v-slot:cell(actions)="data">
                  <b-button
                    variant="outline-success"
                    @click="addDataCharsOfStudies(data.index)">
                    <font-awesome-icon
                      icon="edit"></font-awesome-icon>
                  </b-button>
                  <b-button
                    variant="outline-danger"
                    @click="removeItemCharOfStudies(data.index, data.item.ref_id)">
                    <font-awesome-icon
                      icon="trash"></font-awesome-icon>
                  </b-button>
                </template>
              </b-table>
              <b-pagination
                v-if="charsOfStudies.items.length"
                align="center"
                v-model="charsOfStudiesConfigTable.currentPage"
                :total-rows="charsOfStudies.items.length"
                :per-page="charsOfStudiesConfigTable.perPage"
                aria-controls="chars-of-studies-table"></b-pagination>

              <b-modal
                id="open-char-of-studies-table-modal"
                ref="open-char-of-studies-table-modal"
                scrollable
                title="Column Headers"
                :ok-disabled="(charsOfStudiesFieldsModal.fields[0])?false:true"
                @ok="saveCharacteristicsStudiesFields"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                  <p class="font-weight-light">
                    Column headings describe the categories of the descriptive information extracted – e.g. setting, country, perspectives, methods, etc.
                  </p>
                  <ul class="font-weight-light text-danger">
                    <li>Do not add columns for author or year (these will be added automatically)</li>
                    <li>Do not add methodological assessments (critical/quality appraisal). These go in a separate table.</li>
                  </ul>
                  <b-form-group
                    label="Number of columnns">
                    <b-form-input
                      id="nro-columns"
                      v-model="charsOfStudiesFieldsModal.nroColumns"
                      type="number" min="1"></b-form-input>
                  </b-form-group>
                  <b-form-group
                    v-for="cnt in parseInt(charsOfStudiesFieldsModal.nroColumns)"
                    :key="cnt"
                    :label="`Column #${cnt}`">
                    <b-input-group>
                      <b-form-input
                        :id="`column_${cnt}`"
                        v-model="charsOfStudiesFieldsModal.fields[cnt - 1]"
                        type="text"></b-form-input>
                      <b-input-group-append
                        v-if="charsOfStudies.id">
                        <b-button
                          variant="outline-danger"
                          @click="deleteFieldFromCharsSudies(cnt - 1)">
                          <font-awesome-icon
                            icon="trash"></font-awesome-icon>
                        </b-button>
                      </b-input-group-append>
                    </b-input-group>
                  </b-form-group>
              </b-modal>
              <b-modal
                id="open-char-of-studies-table-modal-edit"
                ref="open-char-of-studies-table-modal-edit"
                scrollable
                title="Edit Column Headers"
                :ok-disabled="(charsOfStudiesFieldsModalEdit.fields.length)?((charsOfStudiesFieldsModalEdit.fields[0].label)?false:true):false"
                @ok="updateCharacteristicsStudiesFields"
                ok-variant="outline-success"
                ok-title="Save"
                cancel-variant="outline-secondary">
                  <p class="font-weight-light">
                    Column headings describe the categories of the descriptive information extracted – e.g. setting, country, perspectives, methods, etc.
                  </p>
                  <draggable v-model="charsOfStudiesFieldsModalEdit.fields" group="columns" @start="drag=true" @end="drag=false">
                    <b-form-group
                      v-for="(field, index) in charsOfStudiesFieldsModalEdit.fields"
                      :key="index"
                      :label="`Column #${index}`">
                      <b-input-group>
                        <b-form-input
                          :id="`column_${index}`"
                          v-model="field.label"
                          type="text"></b-form-input>
                        <b-input-group-append
                          v-if="charsOfStudiesFieldsModalEdit.fields.length > 1">
                          <b-button
                            :id="`drag-button-chars-${index}`"
                            variant="outline-secondary"
                            v-b-tooltip
                            title="Drag to sort">
                            <font-awesome-icon
                              icon="arrows-alt"></font-awesome-icon>
                          </b-button>
                          <b-button
                            variant="outline-danger"
                            @click="deleteFieldFromCharsSudiesEdit(index)">
                            <font-awesome-icon
                              icon="trash"></font-awesome-icon>
                          </b-button>
                        </b-input-group-append>
                      </b-input-group>
                    </b-form-group>
                  </draggable>
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
                @ok="saveDataCharsOfStudies"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                <b-form-group
                  v-for="field of charsOfStudies.fields"
                  :key="field.id"
                  :label="field.label">
                  <b-form-input
                    :disabled="(field.key === 'ref_id' || field.key === 'authors') ? true : false"
                    v-if="field.key === 'ref_id' || field.key === 'authors'"
                    v-model="charsOfStudiesFieldsModal.items[charsOfStudiesFieldsModal.selected_item_index][field.key]">
                  </b-form-input>
                  <b-form-textarea
                    v-if="field.key !== 'ref_id' && field.key !== 'authors'"
                    v-model="charsOfStudiesFieldsModal.items[charsOfStudiesFieldsModal.selected_item_index][field.key]"></b-form-textarea>
                </b-form-group>
              </b-modal>
              <b-modal
                scrollable
                :no-close-on-backdrop="true"
                :no-close-on-esc="true"
                ok-title="Save"
                cancel-title="Close"
                size="lg"
                id="import-characteristics-table"
                ref="import-characteristics-table"
                title="Import table"
                @ok="saveImportedData('isoqf_characteristics')"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                <b-alert show variant="danger">
                  <b>Beware:</b> The newly imported and saved data will delete and replace any previous data entered manually or through import.
                </b-alert>
                <p
                 class="font-weight-light">
                  To upload a table, follow these steps:
                </p>
                <h4>STEP 1: Download the template (excel file) and save it to your computer.</h4>
                <b-button
                  block
                  variant="outline-info"
                  @click="generateTemplate">
                  Download template
                </b-button>
                <h4
                  class="mt-3">STEP 2: Populate the template with your information.</h4>
                <p
                  class="font-weight-light text-danger">
                  The first two columns «Reference ID» and «Author(s), Year» must not be altered in any way.
                </p>
                <h4>STEP 3: Import the populated template to iSoQf</h4>
                <b-row>
                  <b-col
                    class="mb-2"
                    cols="12">
                    <b-form-file
                      id="input-template-chars-file"
                      plain
                      @change="loadTableImportData($event)"></b-form-file>
                  </b-col>
                  <b-col
                    cols="12">
                    <b-table
                      v-if="importDataTable.items.length"
                      responsive
                      :fields="importDataTable.fieldsObj"
                      :items="importDataTable.items"
                    ></b-table>
                  </b-col>
                </b-row>
              </b-modal>
              <b-modal
                id="removeContentModalCharsOfStudies"
                ref="removeContentModalCharsOfStudies"
                title="Remove content"
                ok-title="Confirm"
                ok-variant="outline-danger"
                cancel-variant="outline-success"
                @cancel="cleanRemoveContentCharsOfStudies"
                @ok="removeDataFromLists">
                <p>Are you sure you want to delete all the content for this row?</p>
                <p
                  v-if="removeReferenceCharsOfStudies.findings.length === 0">
                  <b>No findings will be affected</b>
                </p>
                <p
                  v-if="removeReferenceCharsOfStudies.findings.length">
                  <b>Findings that will be affected</b>
                  <ul>
                    <li v-for="(finding, index) in removeReferenceCharsOfStudies.findings" :key="index">
                      {{ `finding # ${finding}`}}
                    </li>
                  </ul>
                </p>
              </b-modal>
            </b-col>
            <b-col
              cols="12"
              class="mt-3">
              <h4>STEP 3: Create or import your Methodological Assessments Table (recommended)</h4>
              <p class="font-weight-light">
                Methodological assessments of each included study using an existing critical/quality appraisal tool (e.g. CASP)
              </p>
              <b-row>
                <b-col
                  sm="5">
                  <b-button
                    block
                    variant="outline-primary"
                    v-if="methodologicalTableRefs.fields.length <= 2"
                    @click="openModcontent()"
                    :disabled="(references.length) ? false : true">
                    Create Table
                  </b-button>
                  <b-button
                    block
                    variant="outline-primary"
                    v-if="methodologicalTableRefs.fields.length > 2"
                    @click="openModcontent(true)">
                    Edit column headings
                  </b-button>
                </b-col>
                <b-col
                  sm="2">
                  <p class="text-center pt-1">OR</p>
                </b-col>
                <b-col
                  sm="5">
                  <b-button
                    block
                    variant="outline-info"
                    :disabled="(references.length) ? false : true"
                    v-b-modal.import-methodological-table>
                    Import table
                  </b-button>
                </b-col>
              </b-row>

              <b-table
                sort-by="authors"
                responsive
                v-if="methodologicalTableRefs.fieldsObj.length > 1"
                class="table-content-refs mt-3"
                :per-page="methodologicalTableRefsTableSettings.perPage"
                :current-page="methodologicalTableRefsTableSettings.currentPage"
                :fields="methodologicalTableRefs.fieldsObj"
                :items="methodologicalTableRefs.items">
                <template
                  v-slot:cell(actions)="data">
                  <b-button
                    variant="outline-success"
                    @click="addDataMethodological(data.index)">
                    <font-awesome-icon
                      icon="edit"></font-awesome-icon>
                  </b-button>
                  <b-button
                    variant="outline-danger"
                    @click="removeItemMethodological(data.index, data.item.ref_id)">
                    <font-awesome-icon
                      icon="trash"></font-awesome-icon>
                  </b-button>
                </template>
              </b-table>
              <b-pagination
                v-if="methodologicalTableRefs.items.length"
                align="center"
                v-model="methodologicalTableRefsTableSettings.currentPage"
                :total-rows="methodologicalTableRefs.items.length"
                :per-page="methodologicalTableRefsTableSettings.perPage"
                aria-controls="chars-of-studies-table"></b-pagination>

              <b-modal
                id="open-methodological-table-modal"
                ref="open-methodological-table-modal"
                scrollable
                title="Column Headers"
                :ok-disabled="(methodologicalFieldsModal.fields.length)?((methodologicalFieldsModal.fields[0].length)?false:true):true"
                @ok="saveMethodologicalFields"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                  <p class="font-weight-light">
                    Column headings correspond to the quality assessment criteria of the appraisal tool you used - e.g CASP - was there a clear statement of the aims of the research? (column 1), is a qualitative methodology appropriate? (column 2), etc
                  </p>
                  <b-form-group
                    label="Number of columnns">
                    <b-form-input
                      id="nro-columns"
                      v-model="methodologicalFieldsModal.nroColumns"
                      type="number" min="1" max="10"></b-form-input>
                  </b-form-group>
                  <b-form-group
                    v-for="cnt in parseInt(methodologicalFieldsModal.nroColumns)"
                    :key="cnt"
                    :label="`Columnn #${cnt}`">
                    <b-input-group>
                      <b-form-input
                        :id="`column_${cnt}`"
                        v-model="methodologicalFieldsModal.fields[cnt - 1]"
                        type="text"></b-form-input>
                      <b-input-group-append
                        v-if="methodologicalTableRefs.id">
                        <b-button
                          variant="outline-danger"
                          @click="deleteFieldFromMethodological(index)">
                          <font-awesome-icon
                            icon="trash"></font-awesome-icon>
                        </b-button>
                      </b-input-group-append>
                    </b-input-group>
                  </b-form-group>
              </b-modal>
              <b-modal
                id="open-methodological-table-modal-edit"
                ref="open-methodological-table-modal-edit"
                scrollable
                title="Edit Columns header"
                :ok-disabled="(methodologicalFieldsModalEdit.fields.length)?((methodologicalFieldsModalEdit.fields[0].label.length)?false:true):false"
                @ok="updateMethodologicalFields"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                  <p class="font-weight-light">
                    Column headings correspond to the quality assessment criteria of the appraisal tool you used - e.g CASP - was there a clear statement of the aims of the research? (column 1), is a qualitative methodology appropriate? (column 2), etc
                  </p>
                  <draggable v-model="methodologicalFieldsModalEdit.fields" group="columns" @start="drag=true" @end="drag=false">
                    <b-form-group
                      v-for="(field, index) in methodologicalFieldsModalEdit.fields"
                      :key="index"
                      :label="`Columnn #${index}`">
                      <b-input-group
                        v-if="methodologicalFieldsModalEdit.fields.length">
                        <b-form-input
                          :id="`column_${index}`"
                          v-model="field.label"
                          type="text"></b-form-input>
                        <b-input-group-append
                          v-if="methodologicalFieldsModalEdit.fields.length > 1">
                          <b-button
                            :id="`drag-button-meth-${index}`"
                            variant="outline-secondary"
                            v-b-tooltip
                            title="Drag to sort">
                            <font-awesome-icon
                              icon="arrows-alt"></font-awesome-icon>
                          </b-button>
                          <b-button
                            variant="outline-danger"
                            @click="deleteFieldFromMethodological(index)">
                            <font-awesome-icon
                              icon="trash"></font-awesome-icon>
                          </b-button>
                        </b-input-group-append>
                      </b-input-group>
                    </b-form-group>
                  </draggable>
                  <b-button
                    class="mb-2"
                    @click="methodologicalNewColumn"
                    variant="outline-success">
                    Add new column
                  </b-button>
              </b-modal>
              <b-modal
                ref="edit-methodological-data"
                title="Edit data"
                scrollable
                @ok="saveDataMethodological"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                <b-form-group
                  v-for="field of methodologicalTableRefs.fields"
                  :key="field.id"
                  :label="field.label">
                  <b-form-input
                    :disabled="(field.key === 'ref_id' || field.key === 'authors') ? true : false"
                    v-if="field.key === 'ref_id' || field.key === 'authors'"
                    v-model="methodologicalFieldsModal.items[methodologicalFieldsModal.selected_item_index][field.key]"></b-form-input>
                  <b-form-textarea
                    v-if="field.key !== 'ref_id' && field.key !== 'authors'"
                    v-model="methodologicalFieldsModal.items[methodologicalFieldsModal.selected_item_index][field.key]"></b-form-textarea>
                </b-form-group>
              </b-modal>
              <b-modal
                ref="removeReferenceModalMethodological"
                title="Remove content"
                ok-title="Confirm"
                ok-variant="outline-danger"
                cancel-variant="outline-success"
                @cancel="cleanRemoveReferenceMethodological"
                @ok="removeDataContentMethodological">
                <p>Are you sure you want to delete all the content for this row?</p>
                <p
                  v-if="removeReferenceMethodological.findings.length === 0">
                  <b>No findings will be affected</b>
                </p>
                <p
                  v-if="removeReferenceMethodological.findings.length">
                  <b>Findings that will be affected</b>
                  <ul>
                    <li v-for="(finding, index) in removeReferenceMethodological.findings" :key="index">
                      {{ `finding # ${finding}`}}
                    </li>
                  </ul>
                </p>
              </b-modal>
              <b-modal
                scrollable
                :no-close-on-backdrop="true"
                :no-close-on-esc="true"
                ok-title="Save"
                cancel-title="Close"
                size="lg"
                id="import-methodological-table"
                ref="import-methodological-table"
                title="Import table"
                @ok="saveImportedData('isoqf_assessments')"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                <b-alert show variant="danger">
                  <b>Beware:</b> The newly imported and saved data will delete and replace any previous data entered manually or through import.
                </b-alert>
                <p
                  class="font-weight-light">
                  To upload a table, follow these steps:
                </p>
                <h4>STEP 1: Download the template (excel file) and save it to your computer.</h4>
                <b-button
                  block
                  variant="outline-info"
                  @click="generateTemplate">
                  Download template
                </b-button>
                <h4
                  class="mt-3">STEP 2: Populate the template with your information.</h4>
                <p
                 class="font-weight-light text-danger">
                  The first two columns «Reference ID» and «Author(s), Year» must not be altered in any way.
                </p>
                <h4>STEP 3: Import the populated template to iSoQf</h4>
                <b-row>
                  <b-col
                    class="mb-2"
                    cols="12">
                    <b-form-file
                      id="input-template-methodological-file"
                      plain
                      @change="loadTableImportData($event)"></b-form-file>
                  </b-col>
                  <b-col
                    cols="12">
                    <b-table
                      v-if="importDataTable.items.length"
                      responsive
                      :fields="importDataTable.fieldsObj"
                      :items="importDataTable.items"
                    ></b-table>
                  </b-col>
                </b-row>
              </b-modal>
            </b-col>
            <b-col
              cols="12"
              class="mt-3">
              <h4>STEP 4: Create or Import  the Headings of your Extracted Data Table (recommended)</h4>
              <p class="font-weight-light">
                Data extracted from the included studies
              </p>
              <p class="font-weight-light">
                * Note that this table operates differently from the previous two. At this stage you will only add the column headings and not the data. Data will be added to the table later when you complete the CERQual assessment worksheets)
              </p>
              <b-row>
                <b-col
                  sm="5">
                  <b-button
                    block
                    variant="outline-primary"
                    v-if="extractedDataTableRefs.fields.length <= 2"
                    @click="openModalExtractedData()"
                    :disabled="(references.length) ? false : true">
                    Create Table
                  </b-button>
                  <b-button
                    block
                    variant="outline-primary"
                    v-if="extractedDataTableRefs.fields.length > 2"
                    @click="openModalExtractedData(true)">
                    Edit column headings
                  </b-button>
                </b-col>
                <b-col
                  sm="2">
                  <p class="text-center pt-1">OR</p>
                </b-col>
                <b-col
                  sm="5">
                  <b-button
                    block
                    variant="outline-info"
                    :disabled="(references.length) ? false : true"
                    v-b-modal.import-extracted-data-table>
                    Import table
                  </b-button>
                </b-col>
              </b-row>

              <b-table
                sort-by="authors"
                responsive
                v-if="extractedDataTableRefs.items.length"
                :per-page="extractedDataTableRefsTableSettings.perPage"
                :current-page="extractedDataTableRefsTableSettings.currentPage"
                class="table-content-refs mt-3"
                :fields="extractedDataTableRefs.fieldsObj"
                :items="extractedDataTableRefs.items">
              </b-table>
              <b-pagination
                v-if="extractedDataTableRefs.items.length"
                align="center"
                v-model="extractedDataTableRefsTableSettings.currentPage"
                :total-rows="extractedDataTableRefs.items.length"
                :per-page="extractedDataTableRefsTableSettings.perPage"
                aria-controls="chars-of-studies-table"></b-pagination>

              <b-modal
                id="open-extracted-data-table-modal"
                ref="open-extracted-data-table-modal"
                scrollable
                title="Column Headers"
                :ok-disabled="(extractedDataFieldsModal.fields.length)?false:true"
                @ok="saveExtractedDataFields"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                  <p class="font-weight-light">
                    Column headings describe the categories you extracted data to. If you used a framework to extract your data, each column would be a component of your framework.
                  </p>
                  <b-form-group
                    label="Number of columnns">
                    <b-form-input
                      id="nro-columns"
                      v-model="extractedDataFieldsModal.nroColumns"
                      type="number" min="1" max="10"></b-form-input>
                  </b-form-group>
                  <b-form-group
                    v-for="cnt in parseInt(extractedDataFieldsModal.nroColumns)"
                    :key="cnt"
                    :label="`Columnn #${cnt}`">
                    <b-input-group>
                      <b-form-input
                        :id="`column_${cnt}`"
                        v-model="extractedDataFieldsModal.fields[cnt - 1]"
                        type="text"></b-form-input>
                      <b-input-group-append
                        v-if="extractedDataTableRefs.id">
                        <b-button
                          variant="outline-danger"
                          @click="deleteFieldFromExtractedData(cnt - 1)">
                          <font-awesome-icon
                            icon="trash"></font-awesome-icon>
                        </b-button>
                      </b-input-group-append>
                    </b-input-group>
                  </b-form-group>
              </b-modal>
              <b-modal
                id="open-extracted-data-table-modal-edit"
                ref="open-extracted-data-table-modal-edit"
                scrollable
                title="Edit Column Headers"
                :ok-disabled="(extractedDataFieldsModalEdit.fields.length)?((extractedDataFieldsModalEdit.fields[0].label.length)?false:true):false"
                @ok="updateExtractedDataFields"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                  <p class="font-weight-light">
                    Column headings describe the categories you extracted data to. If you used a framework to extract your data, each column would be a component of your framework.
                  </p>
                  <draggable v-model="extractedDataFieldsModalEdit.fields" group="columns" @start="drag=true" @end="drag=false">
                    <b-form-group
                      v-for="(field, index) in extractedDataFieldsModalEdit.fields"
                      :key="index"
                      :label="`Columnn #${index}`">
                      <b-input-group
                        v-if="extractedDataFieldsModalEdit.fields.length">
                        <b-form-input
                          :id="`column_${index}`"
                          v-model="field.label"
                          type="text"></b-form-input>
                        <b-input-group-append
                          v-if="extractedDataFieldsModalEdit.fields.length > 1">
                          <b-button
                            :id="`drag-button-extracted-${index}`"
                            variant="outline-secondary"
                            v-b-tooltip
                            title="Drag to sort">
                            <font-awesome-icon
                              icon="arrows-alt"></font-awesome-icon>
                          </b-button>
                          <b-button
                            variant="outline-danger"
                            @click="deleteFieldFromExtractedDataEdit(index)">
                            <font-awesome-icon
                              icon="trash"></font-awesome-icon>
                          </b-button>
                        </b-input-group-append>
                      </b-input-group>
                    </b-form-group>
                  </draggable>
                  <b-button
                    class="mb-2"
                    @click="extractedDataNewColumn"
                    variant="outline-success">
                    Add new column
                  </b-button>
              </b-modal>
              <b-modal
                scrollable
                :no-close-on-backdrop="true"
                :no-close-on-esc="true"
                ok-title="Save"
                cancel-title="Close"
                size="lg"
                id="import-extracted-data-table"
                ref="import-extracted-data-table"
                title="Import table"
                @ok="saveImportedData('isoqf_extracted_data')"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                <b-alert show variant="danger">
                  <b>Beware:</b> The newly imported and saved data will delete and replace any previous data entered manually or through import.
                </b-alert>
                <p
                  class="font-weight-light">
                  To upload a table, follow these steps:
                </p>
                <h4>STEP 1: Download the template (excel file) and save it to your computer.</h4>
                <b-button
                  block
                  variant="outline-info"
                  @click="generateTemplate">
                  Download template
                </b-button>
                <h4
                  class="mt-3">STEP 2: Populate the template with your information.</h4>
                <p
                  class="font-weight-light text-danger">
                  The first two columns «Reference ID» and «Author(s), Year» must not be altered in any way.
                </p>
                <h4>STEP 3: Import the populated template to iSoQf</h4>
                <b-row>
                  <b-col
                    class="mb-2"
                    cols="12">
                    <b-form-file
                      id="input-template-extracted-data-file"
                      plain
                      @change="loadTableImportData($event)"></b-form-file>
                  </b-col>
                  <b-col
                    cols="12">
                    <b-table
                      v-if="importDataTable.items.length"
                      responsive
                      :fields="importDataTable.fieldsObj"
                      :items="importDataTable.items"
                    ></b-table>
                  </b-col>
                </b-row>
              </b-modal>
            </b-col>
          </b-row>
          <b-row
            v-if="references.length"
            align-h="end"
            class="mt-5 mb-2">
            <b-col
              cols="6">
              <b-button
                block
                variant="success"
                @click="tabOpened=2">
                Continue to iSoQf
              </b-button>
            </b-col>
          </b-row>
        </b-tab>
        <b-tab
          :disabled="(references.length) ? false : true"
          title="iSoQf">
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
                <!--
                <b-dropdown-item disabled>to Cochrane</b-dropdown-item>
                <b-dropdown-item disabled>to GRADE</b-dropdown-item>
                <b-dropdown-divider></b-dropdown-divider>
                -->
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
                  block
                  v-b-tooltip.hover title="Click to enter view mode where you can export or print">
                  Print or Export
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

              <h5 v-if="!project.complete_by_author">Authors of the iSoQf</h5>
              <ul v-if="!project.complete_by_author && Object.prototype.hasOwnProperty.call(project, 'lists_authors')">
                <li v-for="(author, index) in project.lists_authors.split(',')" :key="index">{{ author.trim() }}</li>
              </ul>

              <h5>Has the review been published</h5>
              <p>{{(project.published_status) ? 'Yes': 'No'}} <span v-if="project.published_status">| DOI: <b-link :href="project.url_doi" target="_blank">{{ project.url_doi }}</b-link></span></p>

              <h5 v-if="project.complete_by_author">Is the iSoQf being completed by the review authors?</h5>
              <p v-if="project.complete_by_author">{{(project.complete_by_author) ? 'Yes' : 'No'}}</p>
            </b-col>
          </b-row>
          <b-row>
            <b-col
              v-if="mode==='edit'"
              cols="12"
              class="my-2 d-print-none">
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
                          placeholder="Type to search the table below"></b-form-input>
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
                      View references
                    </b-button>
                  </b-col>
                </b-row>
              </b-card>
            </b-col>
            <b-col
              cols="12">
              <b-row
                class="mb-2">
                <b-col
                  v-if="mode==='view'"
                  cols="12">
                  <b-alert class="d-print-none" v-model="dismissAlertPrint" variant="danger" dismissible>
                    You must select at least one item of the table
                  </b-alert>
                </b-col>
                <b-col
                  v-if="mode==='view'"
                  cols="4">
                  <b-button
                    variant="outline-primary"
                    class="d-print-none"
                    @click="$refs.findings.selectAllRows()"
                    block>
                    Select all items
                  </b-button>
                </b-col>
                <b-col
                  v-if="mode!=='view'"
                  cols="4">
                  <b-button
                    v-b-tooltip.hover title="Copy and paste one summarized review finding at the time into the iSoQf"
                    variant="primary"
                    @click="modalAddSummarized"
                    block>
                    Add review finding to the table
                  </b-button>
                </b-col>
              </b-row>
            </b-col>
            <b-col cols="12">
              <b-table
                class="toDoc"
                :selectable="(mode==='view')?true:false"
                select-mode="multi"
                selected-variant="warning"
                responsive
                id="findings"
                ref="findings"
                sort-by="isoqf_id"
                :fields="fields"
                :items="lists"
                show-empty
                :busy="table_settings.isBusy"
                :current-page="table_settings.currentPage"
                :per-page="table_settings.perPage"
                :filter="table_settings.filter"
                @filtered="onFiltered"
                :filter-included-fields="['isoqf_id', 'name', 'cerqual_option', 'cerqual_explanation', 'ref_list']">
                <template v-slot:head(isoqf_id)="data">
                  <span v-b-tooltip.hover title="Automatic numbering of synthesised review findings">{{ data.label }}</span>
                </template>
                <template v-slot:head(name)="data">
                  <span v-b-tooltip.hover title="Summaries of each review finding produced by the review team">{{ data.label }}</span>
                </template>
                <template v-slot:head(cerqual_option)="data">
                  <span v-b-tooltip.hover title="Assessment of the extent to which a review finding is a reasonable representation of the phenomenon of interest">{{ data.label }}</span>
                </template>
                <template v-slot:head(cerqual_explanation)="data">
                  <span v-b-tooltip.hover title="Statement explaining concerns with any of the CERQual components that justifies the level of confidence chosen">{{ data.label }}</span>
                </template>
                <template v-slot:head(ref_list)="data">
                  <span v-b-tooltip.hover title="Studies that contribute to each review finding">{{ data.label }}</span>
                </template>
                <template v-slot:cell(isoqf_id)="data">
                  {{ data.item.isoqf_id }}
                </template>
                <template v-slot:cell(name)="data">
                  <span v-if="mode === 'edit'">
                    <b-link v-if="data.item.references.length" :to="{name: 'editList', params: {id: data.item.id}}">{{ data.item.name }}</b-link>
                    <span v-if="data.item.references.length === 0">{{ data.item.name }}</span>
                    <b-row>
                      <b-col
                        cols="6">
                        <b-button
                          block
                          v-if="mode==='edit'"
                          variant="outline-info"
                          @click="editModalFindingName(data.index)">
                          Edit
                        </b-button>
                      </b-col>
                      <b-col
                        cols="6">
                        <b-button
                          block
                          v-if="mode==='edit'"
                          variant="outline-info"
                          @click="removeModalFinding(data.index)">
                          Remove
                        </b-button>
                      </b-col>
                    </b-row>
                  </span>
                  <span v-else>
                    {{ data.item.name }}
                  </span>
                </template>
                <template v-slot:cell(cerqual_option)="data">
                  {{ data.item.cerqual_option }}
                  <b-button
                    v-if="mode==='edit' && data.item.references.length"
                    class="d-print-none"
                    :disabled="(data.item.references.length) ? false : true"
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
                    v-if="mode==='edit' && data.item.references.length"
                    class="d-print-none"
                    :disabled="(data.item.references.length) ? false : true"
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
                  <b-button
                    v-if="mode==='edit'"
                    block
                    class="mt-2 d-print-none"
                    :variant="(data.item.references.length) ? 'outline-info' : 'info'"
                    @click="openModalReferences(data.item.isoqf_id)">
                    Select references
                  </b-button>
                </template>
                <template v-slot:empty>
                  <p class="text-center">
                    There are no findings to show, <a href="#" @click="modalAddSummarized">add review finding</a>
                  </p>
                </template>
                <template v-slot:table-busy>
                  <div class="text-center text-danger my-2">
                    <b-spinner class="align-middle"></b-spinner>
                    <strong>Loading...</strong>
                  </div>
                </template>
              </b-table>
              <b-pagination
                v-if="mode === 'edit'"
                class="d-print-none"
                v-model="table_settings.currentPage"
                :total-rows="lists.length"
                :per-page="table_settings.perPage"
                aria-controls="findings"
                align="center"></b-pagination>
              <b-modal
                id="edit-finding-name"
                ref="edit-finding-name"
                title="Edit finding"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary"
                @ok="updateListName">
                <b-form-group
                  label="Summarized review finding"
                  label-for="finding-name">
                  <b-form-textarea
                    id="finding-name"
                    v-model="editFindingName.name"></b-form-textarea>
                </b-form-group>
              </b-modal>
              <b-modal
                id="remove-finding"
                ref="remove-finding"
                title="Remove finding"
                ok-title="Remove"
                ok-variant="outline-danger"
                cancel-variant="outline-secondary"
                @ok="confirmRemoveFinding">
                <p>
                  Are you sure you want to remove this finding?
                </p>
              </b-modal>
              <b-modal
                id="add-summarized"
                ref="add-summarized"
                title="Summarized review finding"
                :ok-disabled="(summarized_review)?false:true"
                @ok="saveSummarized"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                <b-form-group
                  label="Summarized review finding"
                  label-for="summarized-review">
                  <b-form-textarea
                    id="summarized-review"
                    v-model="summarized_review"></b-form-textarea>
                </b-form-group>
              </b-modal>

              <b-modal
                id="modal-references-list"
                ref="modal-references-list"
                title="Select references"
                @ok="saveReferencesList"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary"
                size="lg"
                scrollable>
                <div
                  class="mt-2"
                  v-if="references.length">
                  <b-form-group>
                    <b-form-checkbox
                      v-for="ref in refs"
                      v-model="selected_references"
                      :key="ref.id"
                      :value="ref.id"
                      name="references">
                      {{ ref.content }}
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
        <b-tab title="Guidance on applying CERQual">
          <h3>Introduction to CERQual</h3>
          <p><a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0688-3" target="_blank">https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0688-3</a></p>
          <p>[Lewin S, Booth A, Glenton C, Munthe-Kaas H, Rashidian A, Wainwright M, Bohren MA, Tunçalp Ö, Colvin CJ, Garside R, Carlsen B, Langlois EV, Noyes J. Applying GRADE-CERQual to qualitative evidence synthesis findings: introduction to the series. Implement Sci. 2018 Jan 25;13(Suppl 1):2]</p>
          <h3>Assessing Methodological Limitations</h3>
          <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0690-9" target="_blank">https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0690-9</a>
          <p>[Munthe-Kaas H, Bohren MA, Glenton C, Lewin S, Noyes J, Tunçalp Ö, Booth A, Garside R, Colvin CJ, Wainwright M, Rashidian A, Flottorp S, Carlsen B. Applying GRADE-CERQual to qualitative evidence synthesis findings-paper 3: how to assess methodological limitations. Implement Sci. 2018 Jan 25;13(Suppl 1):9]</p>
          <h3>Assessing Coherence</h3>
          <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0691-8" target="_blank">https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0691-8</a>
          <p>[Colvin CJ, Garside R, Wainwright M, Munthe-Kaas H, Glenton C, Bohren MA, Carlsen B, Tunçalp Ö, Noyes J, Booth A, Rashidian A, Flottorp S, Lewin S. Applying GRADE-CERQual to qualitative evidence synthesis findings-paper 4: how to assess coherence. Implement Sci. 2018 Jan 25;13(Suppl 1):13]</p>
          <h3>Assessing Adequacy of Data</h3>
          <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0692-7" target="_blank">https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0692-7</a>
          <p>[Glenton C, Carlsen B, Lewin S, Munthe-Kaas H, Colvin CJ, Tunçalp Ö, Bohren MA, Noyes J, Booth A, Garside R, Rashidian A, Flottorp S, Wainwright M. Applying GRADE-CERQual to qualitative evidence synthesis findings-paper 5: how to assess adequacy of data. Implement Sci. 2018 Jan 25;13(Suppl 1):14.]</p>
          <h3>Assessing Relevance</h3>
          <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0693-6" target="_blank">https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0693-6</a>
          <p>[Noyes J, Booth A, Lewin S, Carlsen B, Glenton C, Colvin CJ, Garside R, Bohren MA, Rashidian A, Wainwright M, Tunςalp Ö, Chandler J, Flottorp S, Pantoja T, Tucker JD, Munthe-Kaas H. Applying GRADE-CERQual to qualitative evidence synthesis findings-paper 6: how to assess relevance of the data. Implement Sci. 2018 Jan 25;13(Suppl 1):4.]</p>
          <h3>Making an Overall CERQual Assessment of Confidence and Preparing SoQf Table</h3>
          <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2" target="_blank">https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2</a>
          <p>[Lewin S, Bohren M, Rashidian A, Munthe-Kaas H, Glenton C, Colvin CJ, Garside R, Noyes J, Booth A, Tunçalp Ö, Wainwright M, Flottorp S, Tucker JD, Carlsen B. Applying GRADE-CERQual to qualitative evidence synthesis findings-paper 2: how to make an overall CERQual assessment of confidence and create a Summary of Qualitative Findings table. Implement Sci. 2018 Jan 25;13(Suppl 1):10]</p>
          <h4>Additional resources:</h4>
          <p>Booth A, Lewin S, Glenton C, Munthe-Kaas H, Toews I, Noyes J, Rashidian A, Berg RC, Nyakang'o B, Meerpohl JJ; GRADE-CERQual Coordinating Team. Applying GRADE-CERQual to qualitative evidence synthesis findings-paper 7: understanding the potential impacts of dissemination bias. Implement Sci. 2018 Jan 25;13(Suppl 1):12. <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0694-5" target="_blank">FULL TEXT</a><p>
          <p>Simon Lewin, Claire Glenton, Heather Munthe-Kaas, Benedicte Carlsen, Christopher J. Colvin, Metin Gülmezoglu, Jane Noyes, Andrew Booth, Ruth Garside, and Arash Rashidian. Using qualitative evidence in decision making for health and social interventions: an approach to assess confidence in findings from qualitative evidence syntheses (GRADE-CERQual). PLoS Med 12, no. 10 (2015) 001895. <a href="http://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1001895" target="_blank">FULL TEXT</a></p>

          <b-alert show variant="info" class="text-center">
          A Portuguese version of the guidance can be <a href="http://www.saude.sp.gov.br/resources/instituto-de-saude/homepage/temas-saude-coletiva/49213001internetinterativo.pdf" target="_blank">found here</a>
          </b-alert>
        </b-tab>
      </b-tabs>
      <b-modal
        id="modal-references"
        ref="modal-references"
        title="References"
        size="lg"
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
                  variant="outline-danger"
                  @click="data.toggleDetails">
                  <font-awesome-icon
                    icon="trash"></font-awesome-icon>
                </b-button>
              </template>
              <template v-slot:row-details="data">
                <b-card>
                  <p>You are about to exclude a study from your review. This will delete it, and all associated information, from all tables in iSoQf. If you exclude this study please remember to redo your CERQual assessments for all findings that it supported.</p>
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
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import draggable from 'vuedraggable'

export default {
  components: {
    draggable
  },
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
      refs: [],
      loadReferences: true,
      fileReferences: [],
      fields_references_table:
        [
          {
            key: 'authors',
            label: 'Author(s)',
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
        authors: '',
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      },
      charsOfStudiesConfigTable: {
        currentPage: 1,
        perPage: 10
      },
      tabOpened: 1,
      global_status: [
        { value: false, text: 'public' },
        { value: true, text: 'private' }
      ],
      yes_or_no: [
        { value: false, text: 'no' },
        { value: true, text: 'yes' }
      ],
      msgUpdateProject: null,
      pre_ImportDataTable: '',
      importDataTable: {
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
        perPage: 10
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
      extractedDataTableRefs: {
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      },
      extractedDataTableRefsTableSettings: {
        currentPage: 1,
        perPage: 10
      },
      extractedDataFieldsModal: {
        nroColumns: 1,
        fields: [],
        items: [],
        selected_item_index: 0
      },
      extractedDataFieldsModalEdit: {
        nroColumns: 1,
        fields: []
      },
      removeReferenceExtractedData: {
        id: null,
        findings: []
      },
      dismissAlertPrint: false,
      appearMsgRemoveReferences: false,
      disableBtnRemoveAllRefs: false,
      editFindingName: {
        index: null,
        name: null
      }
    }
  },
  mounted () {
    this.getReferences()
    this.openModalReferencesSingle(false)
    this.getProject()
  },
  watch: {
    pre_ImportDataTable: function (data) {
      const allLines = data.split(/\r\n|\n/)
      let fields = []
      let items = []

      allLines.forEach((line, index) => {
        if (line !== '') {
          const contents = this.CSVtoArray(line)
          let columnFieldNro = 0
          let columnItemNro = 0
          if (index === 0) {
            for (let cnt in contents) {
              let obj = {}
              if (parseInt(cnt) === 0) {
                obj.key = 'ref_id'
              }
              if (parseInt(cnt) === 1) {
                obj.key = 'authors'
              }
              if (parseInt(cnt) > 1) {
                this.importDataTable.fieldsObj.push({ 'key': 'column_' + columnFieldNro, 'label': contents[cnt] })
                obj.key = 'column_' + columnFieldNro
                columnFieldNro++
              }
              obj.label = contents[cnt]
              fields.push(obj)
            }
          } else {
            let obj = {}
            for (let cnt in contents) {
              if (parseInt(cnt) === 0) {
                obj.ref_id = contents[cnt]
              }
              if (parseInt(cnt) === 1) {
                obj.authors = contents[cnt]
              }
              if (parseInt(cnt) > 1) {
                obj[`column_${columnItemNro}`] = contents[cnt]
                columnItemNro++
              }
            }
            items.push(obj)
          }
        }
      })

      this.importDataTable.fields = fields
      this.importDataTable.items = items
    },
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
        const _line = line.split('  - ')
        const key = _line[0]
        const content = _line[1]

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
    CSVtoArray: function (text) {
      // https://stackoverflow.com/a/8497474
      const reValid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/
      const reValue = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g

      if (!reValid.test(text)) return null
      let a = []
      text.replace(reValue,
        function (m0, m1, m2, m3) {
          if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"))
          else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'))
          else if (m3 !== undefined) a.push(m3)
          return ''
        }
      )

      if (/,\s*$/.test(text)) a.push('')
      return a
    },
    changeMode: function () {
      this.mode = (this.mode === 'edit') ? 'view' : 'edit'
      if (this.mode === 'view') {
        this.table_settings.perPage = this.lists.length
        this.table_settings.currentPage = 1
        this.$refs.findings.selectAllRows()
      } else {
        this.table_settings.perPage = 5
        this.$refs.findings.clearSelected()
      }
    },
    printiSoQf: function () {
      if (!document.getElementsByClassName('b-table-row-selected').length) {
        this.dismissAlertPrint = true
      } else {
        window.print()
      }
    },
    parseReference: (reference, onlyAuthors = false, hasSemicolon = true) => {
      let result = ''
      const semicolon = hasSemicolon ? '; ' : ''
      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        if (reference.authors.length === 1) {
          result = reference.authors[0] + ', ' + reference.publication_year + semicolon
        } else if (reference.authors.length < 3) {
          result = reference.authors[0] + ', ' + reference.authors[1] + ', ' + reference.publication_year + semicolon
        } else {
          result = reference.authors[0] + ' et al., ' + reference.publication_year + semicolon
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
      this.loadReferences = true
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
          this.getReferences(false)
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
          this.getMethodological()
          this.getExtractedData()
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
            this.lastId = parseInt(lists.slice(-1)[0].isoqf_id) + 1
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
      this.table_settings.isBusy = true
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
        .then((response) => {})
        .catch((error) => {
          console.log(error)
        })
    },
    getReferences: function (changeTab = true) {
      axios.get(`/api/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`)
        .then((response) => {
          let _references = response.data
          this.references = response.data
          let _refs = []
          for (let reference of _references) {
            _refs.push({'id': reference.id, 'content': this.getDataDisplayRef(reference)})
          }

          this.refs = _refs.sort((a, b) => a.content.localeCompare(b.content))
          if (changeTab) {
            if (this.references.length) {
              this.$nextTick(() => {
                if (this.$route.hash) {
                  this.tabOpened = 1
                } else {
                  this.tabOpened = 2
                }
              })
            }
          }
          this.loadReferences = false
        })
        .catch((error) => {
          console.log(error)
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
    openModalReferences: function (isoqfId) {
      let cnt = 0
      for (let list of this.lists) {
        if (list.isoqf_id === isoqfId) {
          this.selected_list_index = cnt
        }
        cnt++
      }
      this.getReferences()
      this.selected_references = this.lists[this.selected_list_index].references
      this.$refs['modal-references-list'].show()
    },
    saveReferencesList: function () {
      this.loadReferences = true
      this.table_settings.isBusy = true
      const params = {
        references: this.selected_references
      }
      axios.patch(`/api/isoqf_lists/${this.lists[this.selected_list_index].id}`, params)
        .then((response) => {
          this.selected_references = []
          this.selected_list_index = null
          this.getReferences()
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
      let title = document.getElementById('project-title').innerHTML
      this.Export2Doc('toDoc', title)
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
      let _extractedData = JSON.parse(JSON.stringify(this.extractedDataTableRefs))
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

      if (Object.prototype.hasOwnProperty.call(_extractedData, 'id')) {
        if (_extractedData.items.length) {
          let items = []

          for (let item of _extractedData.items) {
            if (item.ref_id !== refId) {
              items.push(item)
            }
          }
          _extractedData.items = items

          requests.push(axios.patch(`/api/isoqf_extracted_data/${_extractedData.id}`, _extractedData))
        }
      }

      for (let o of objs) {
        requests.push(axios.patch(`/api/isoqf_lists/${o.id}`, {references: o.references}))
      }

      if (requests.length) {
        axios.all(requests)
          .then(axios.spread(function (response) {}))
      }

      axios.delete(`/api/isoqf_references/${refId}`)
        .then((response) => {
          this.getReferences(false)
          this.openModalReferencesSingle(false)
          this.getProject()
        })
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
      params.fields = [{'key': 'ref_id', 'label': 'Reference ID'}, {'key': 'authors', 'label': 'Author(s), Year'}]
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
      fields.splice(1, 0, { 'key': 'authors', 'label': 'Author(s), Year' })

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
          } else {
            this.charsOfStudies = { fields: [], items: [], authors: '', fieldsObj: [ { key: 'authors', label: 'Author(s), Year' } ] }
          }
        })
    },
    getMethodological: function () {
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

              if (items.length) {
                this.methodologicalTableRefs.fieldsObj.push({ 'key': 'actions', 'label': '' })
              }

              for (let item of _items) {
                this.methodologicalFieldsModal.items.push(item)
              }
            }
          } else {
            this.methodologicalTableRefs = { fields: [], items: [], authors: '', fieldsObj: [ { key: 'authors', label: 'Author(s), Year' } ] }
          }
        })
    },
    getExtractedData: function () {
      axios.get(`/api/isoqf_extracted_data?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`)
        .then((response) => {
          if (response.data.length) {
            let _extractedData = response.data[0]
            if (Object.prototype.hasOwnProperty.call(_extractedData, 'fields')) {
              _extractedData.fieldsObj = [{ 'key': 'authors', 'label': 'Author(s), Year' }]

              const fields = JSON.parse(JSON.stringify(_extractedData.fields))

              this.extractedDataFieldsModal.fields = []
              for (let f of fields) {
                if (f.key !== 'ref_id' && f.key !== 'authors' && f.key !== 'actions') {
                  _extractedData.fieldsObj.push({ key: f.key, label: f.label })
                }
              }

              this.extractedDataFieldsModal.nroColumns = (_extractedData.fieldsObj.length === 1) ? 1 : _extractedData.fieldsObj.length - 1
            }
            if (Object.prototype.hasOwnProperty.call(_extractedData, 'items')) {
              const _items = _extractedData.items
              let items = []
              for (let item of _items) {
                let itemObj = { 'ref_id': item.ref_id, 'authors': item.authors }
                items.push(itemObj)
              }
              _extractedData.items = items
            }
            this.extractedDataTableRefs = _extractedData
          } else {
            this.extractedDataTableRefs = { fields: [], items: [], authors: '', fieldsObj: [ { key: 'authors', label: 'Author(s), Year' } ] }
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
          this.msgUpdateProject = 'The project has been updated'
        })
        .catch((error) => {
          this.msgUpdateProject = error
        })
    },
    dismissAlertProject: function () {
      this.msgUpdateProject = null
    },
    generateTemplate: function () {
      // const _references = JSON.parse(JSON.stringify(this.references))
      const _refs = JSON.parse(JSON.stringify(this.refs))
      let csvContent = 'data:text/csv;charset=utf-8,'
      csvContent += '"Reference ID","Author(s), Year"' + '\r\n'

      for (let ref of _refs) {
        // csvContent += ref.id + ',' + '"' + this.parseReference(ref, true, false) + '"' + '\r\n'
        csvContent += ref.id + ',' + '"' + ref.content.split(';')[0] + '"' + '\r\n'
      }

      let encodedUri = encodeURI(csvContent)
      let link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', 'my_data.csv')
      document.body.appendChild(link)

      link.click()
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
      let params = {}
      params.organization = this.$route.params.org_id
      params.project_id = this.$route.params.id
      params.fields = this.importDataTable.fields
      params.items = this.importDataTable.items
      if (endpoint === 'isoqf_characteristics') {
        if (this.charsOfStudies.items.length) {
          this.cleanImportedData(this.charsOfStudies.id, endpoint, params)
        } else {
          this.insertImportedData(endpoint, params)
        }
      }
      if (endpoint === 'isoqf_assessments') {
        if (this.methodologicalTableRefs.items.length) {
          this.cleanImportedData(this.methodologicalTableRefs.id, endpoint, params)
        } else {
          this.insertImportedData(endpoint, params)
        }
      }
      if (endpoint === 'isoqf_extracted_data') {
        if (this.extractedDataTableRefs.items.length) {
          this.cleanImportedData(this.extractedDataTableRefs.id, endpoint, params)
        } else {
          this.insertImportedData(endpoint, params)
        }
      }
      this.importDataTable = { fields: [], items: [], fieldsObj: [{ key: 'authors', label: 'Author(s), Year' }] }
      this.pre_ImportDataTable = ''
    },
    cleanImportedData: function (id = '', endpoint = '', params = {}) {
      axios.delete(`/api/${endpoint}/${id}`)
        .then((response) => {
          this.pre_ImportDataTable = ''
          this.insertImportedData(endpoint, params)
        })
    },
    insertImportedData: function (endpoint = '', params = {}) {
      axios.post(`/api/${endpoint}/`, params)
        .then((response) => {
          this.getProject()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    removeItemCharOfStudies: function (index, id) {
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
    removeDataFromLists: function () {
      const index = this.removeReferenceCharsOfStudies.index
      let _items = JSON.parse(JSON.stringify(this.charsOfStudies.items))
      let params = {}
      let cnt = 0
      let items = []

      for (let item of _items) {
        if (cnt === index) {
          items.push({'ref_id': item.ref_id, 'authors': item.authors})
        } else {
          items.push(item)
        }
        cnt++
      }

      params.items = items

      axios.patch(`/api/isoqf_characteristics/${this.charsOfStudies.id}`, params)
        .then((response) => {
          this.getCharacteristics()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    cleanRemoveContentCharsOfStudies: function () {
      this.removeReferenceCharsOfStudies = {
        id: null,
        findings: []
      }
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
    saveMethodologicalFields: function () {
      let fields = JSON.parse(JSON.stringify(this.methodologicalFieldsModal.fields))
      let references = JSON.parse(JSON.stringify(this.references))
      let params = {}
      params.fields = [{'key': 'ref_id', 'label': 'Reference ID'}, {'key': 'authors', 'label': 'Author(s), Year'}]
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

      if (Object.prototype.hasOwnProperty.call(this.methodologicalTableRefs, 'id')) {
        axios.patch(`/api/isoqf_assessments/${this.methodologicalTableRefs.id}`, params)
          .then((response) => {
            this.getProject()
          }).catch((error) => {
            console.log('error: ', error)
          })
      } else {
        axios.post('/api/isoqf_assessments', params)
          .then((response) => {
            // this.charsOfStudies = response.data
            this.getProject()
          })
          .catch((error) => {
            console.log(error)
          })
      }
    },
    methodologicalNewColumn: function () {
      let _fields = JSON.parse(JSON.stringify(this.methodologicalFieldsModalEdit.fields))
      let fields = []
      let column = '0'
      const excluded = ['ref_id', 'authors', 'actions']
      for (let field of _fields) {
        if (!excluded.includes(field.key)) {
          fields.push(field)
        }
      }

      this.methodologicalFieldsModalEdit.nroColumns = fields.length + 1
      column = parseInt(this.methodologicalFieldsModalEdit.fields[ fields.length - 1 ].key.split('_')[1]) + 1
      this.methodologicalFieldsModalEdit.fields.push({'key': 'column_' + column.toString(), 'label': ''})
    },
    updateMethodologicalFields: function () {
      let params = {}
      let fields = JSON.parse(JSON.stringify(this.methodologicalFieldsModalEdit.fields))

      fields.splice(0, 0, { 'key': 'ref_id', 'label': 'Reference ID' })
      fields.splice(1, 0, { 'key': 'authors', 'label': 'Author(s), Year' })

      params.fields = fields

      let _items = JSON.parse(JSON.stringify(this.methodologicalTableRefs.items))

      for (let item of _items) {
        for (let field of fields) {
          if (!Object.prototype.hasOwnProperty.call(item, field.key)) {
            delete item[field.key]
          }
        }
      }

      axios.patch(`/api/isoqf_assessments/${this.methodologicalTableRefs.id}`, params)
        .then((response) => {
          this.getProject()
        })
        .catch((error) => {
          console.log(error)
        })
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
          console.log(error)
        })
    },
    addDataMethodological: function (index = 0) {
      let items = JSON.parse(JSON.stringify(this.methodologicalTableRefs.items))

      this.methodologicalFieldsModal.items = items
      this.methodologicalFieldsModal.selected_item_index = index
      this.$refs['edit-methodological-data'].show()
    },
    saveDataMethodological: function () {
      let params = {}
      const id = this.methodologicalTableRefs.id
      params.items = this.methodologicalFieldsModal.items

      axios.patch(`/api/isoqf_assessments/${id}`, params)
        .then((response) => {
          this.getProject()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    removeItemMethodological: function (index, id) {
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
    removeDataContentMethodological: function () {
      const index = this.removeReferenceMethodological.index
      let _items = JSON.parse(JSON.stringify(this.methodologicalTableRefs.items))
      let params = {}
      let cnt = 0
      let items = []

      for (let item of _items) {
        if (cnt === index) {
          items.push({'ref_id': item.ref_id, 'authors': item.authors})
        } else {
          items.push(item)
        }
        cnt++
      }

      params.items = items

      axios.patch(`/api/isoqf_assessments/${this.methodologicalTableRefs.id}`, params)
        .then((response) => {
          this.getMethodological()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    openModalExtractedData: function (edit = false) {
      let _fields = JSON.parse(JSON.stringify(this.extractedDataTableRefs.fields))
      let fields = []
      const excluded = ['ref_id', 'authors', 'actions']
      for (let field of _fields) {
        if (!excluded.includes(field.key)) {
          fields.push(field)
        }
      }

      if (edit) {
        this.extractedDataFieldsModalEdit.fields = fields
        this.extractedDataFieldsModalEdit.nroColumns = fields.length
        this.$refs['open-extracted-data-table-modal-edit'].show()
      } else {
        this.extractedDataFieldsModal.fields = fields
        this.$refs['open-extracted-data-table-modal'].show()
      }
    },
    saveExtractedDataFields: function () {
      let fields = JSON.parse(JSON.stringify(this.extractedDataFieldsModal.fields))
      let references = JSON.parse(JSON.stringify(this.references))
      let params = {}
      params.fields = [{'key': 'ref_id', 'label': 'Reference ID'}, {'key': 'authors', 'label': 'Author(s), Year'}]
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

      if (Object.prototype.hasOwnProperty.call(this.extractedDataTableRefs, 'id')) {
        axios.patch(`/api/isoqf_extracted_data/${this.extractedDataTableRefs.id}`, params)
          .then((response) => {
            this.getProject()
          }).catch((error) => {
            console.log('error: ', error)
          })
      } else {
        axios.post('/api/isoqf_extracted_data', params)
          .then((response) => {
            // this.charsOfStudies = response.data
            this.getProject()
          })
          .catch((error) => {
            console.log(error)
          })
      }
    },
    deleteFieldFromExtractedData: function (index) {
      let fields = JSON.parse(JSON.stringify(this.extractedDataFieldsModal.fields))
      let params = {}
      params.fields = [{'key': 'ref_id', 'label': 'Reference ID'}, {'key': 'authors', 'label': 'Author(s), Year'}]

      fields.splice(index, 1)

      for (let cnt in fields) {
        let objField = {}
        objField.key = 'column_' + cnt
        objField.label = fields[cnt]
        params.fields.push(objField)
      }

      axios.patch(`/api/isoqf_extracted_data/${this.extractedDataTableRefs.id}`, params)
        .then((response) => {
          this.getProject()
        }).catch((error) => {
          console.log('error: ', error)
        })
    },
    updateExtractedDataFields: function () {
      let params = {}
      let fields = JSON.parse(JSON.stringify(this.extractedDataFieldsModalEdit.fields))

      fields.splice(0, 0, { 'key': 'ref_id', 'label': 'Reference ID' })
      fields.splice(1, 0, { 'key': 'authors', 'label': 'Author(s), Year' })

      params.fields = fields

      let _items = JSON.parse(JSON.stringify(this.extractedDataTableRefs.items))

      for (let item of _items) {
        for (let field of fields) {
          if (!Object.prototype.hasOwnProperty.call(item, field.key)) {
            delete item[field.key]
          }
        }
      }

      axios.patch(`/api/isoqf_extracted_data/${this.extractedDataTableRefs.id}`, params)
        .then((response) => {
          this.getProject()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    deleteFieldFromExtractedDataEdit: function (index) {
      let params = {}
      const _fields = JSON.parse(JSON.stringify(this.extractedDataFieldsModalEdit.fields))
      const _items = JSON.parse(JSON.stringify(this.extractedDataTableRefs.items))

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

      axios.patch(`/api/isoqf_extracted_data/${this.extractedDataTableRefs.id}`, params)
        .then((response) => {
          let _fields = JSON.parse(JSON.stringify(response.data['$set'].fields))
          const excluded = ['ref_id', 'authors', 'actions']
          let editFields = []
          for (let field of _fields) {
            if (!excluded.includes(field.key)) {
              editFields.push(field)
            }
          }

          this.extractedDataFieldsModalEdit.fields = editFields
          this.extractedDataFieldsModalEdit.nroColumns = editFields.length
          this.getProject()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    extractedDataNewColumn: function () {
      let _fields = JSON.parse(JSON.stringify(this.extractedDataFieldsModalEdit.fields))
      let fields = []
      let column = '0'
      const excluded = ['ref_id', 'authors', 'actions']
      for (let field of _fields) {
        if (!excluded.includes(field.key)) {
          fields.push(field)
        }
      }

      this.extractedDataFieldsModalEdit.nroColumns = fields.length + 1
      column = parseInt(this.extractedDataFieldsModalEdit.fields[ fields.length - 1 ].key.split('_')[1]) + 1
      this.extractedDataFieldsModalEdit.fields.push({'key': 'column_' + column.toString(), 'label': ''})
    },
    addDataExtractedData: function (index = 0) {
      let items = JSON.parse(JSON.stringify(this.extractedDataTableRefs.items))

      this.extractedDataFieldsModal.items = items
      this.extractedDataFieldsModal.selected_item_index = index
      this.$refs['edit-extracted-data-data'].show()
    },
    saveDataExtractedData: function () {
      let params = {}
      const id = this.extractedDataTableRefs.id
      params.items = this.extractedDataFieldsModal.items

      axios.patch(`/api/isoqf_extracted_data/${id}`, params)
        .then((response) => {
          this.getProject()
        })
        .catch((error) => {
          console.log(error)
        })
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
      let _lists = JSON.parse(JSON.stringify(this.lists))
      const _charsOfStudies = JSON.parse(JSON.stringify(this.charsOfStudies))
      const _assessments = JSON.parse(JSON.stringify(this.methodologicalTableRefs))
      const _extractedData = JSON.parse(JSON.stringify(this.extractedDataTableRefs))
      const _references = JSON.parse(JSON.stringify(this.references))
      let requests = []

      if (Object.prototype.hasOwnProperty.call(_charsOfStudies, 'id')) {
        requests.push(axios.delete(`/api/isoqf_characteristics/${_charsOfStudies.id}`))
      }
      if (Object.prototype.hasOwnProperty.call(_assessments, 'id')) {
        requests.push(axios.delete(`/api/isoqf_assessments/${_assessments.id}`))
      }
      if (Object.prototype.hasOwnProperty.call(_extractedData, 'id')) {
        requests.push(axios.delete(`/api/isoqf_extracted_data/${_extractedData.id}`))
      }
      for (let list of _lists) {
        list.references = []
        axios.patch(`/api/isoqf_lists/${list.id}`, list)
          .then((response) => {})
          .catch((error) => {
            console.log(error)
          })
      }
      for (let reference of _references) {
        requests.push(axios.delete(`/api/isoqf_references/${reference.id}`))
      }

      axios.all(requests)
        .then(axios.spread(function () {
          this.getReferences()
          this.openModalReferencesSingle(false)
          this.getProject()
          this.$refs['modal-references'].hide()
        }.bind(this)))
    },
    editModalFindingName: function (index) {
      const listName = this.lists[index].name
      this.editFindingName.index = index
      this.editFindingName.name = listName
      this.$refs['edit-finding-name'].show()
    },
    updateListName: function () {
      let _lists = JSON.parse(JSON.stringify(this.lists))
      const index = this.editFindingName.index
      _lists[index].name = this.editFindingName.name

      axios.patch(`/api/isoqf_lists/${_lists[index].id}`, _lists[index])
        .then((response) => {
          this.getLists()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    removeModalFinding: function (index) {
      this.editFindingName.index = index
      this.$refs['remove-finding'].show()
    },
    confirmRemoveFinding: function () {
      const index = this.editFindingName.index
      const _list = JSON.parse(JSON.stringify(this.lists[index]))
      axios.delete(`/api/isoqf_lists/${_list.id}`)
        .then((response) => {
          this.getLists()
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
    .nav-fill .nav-item {
      text-transform: uppercase;
      font-weight: bold;
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
    .table-content-refs.table thead th:first-child {
      width: 35%;
    }
  div >>>
    .table-content-refs.table thead th:last-child {
      width: 15%;
    }
  div >>>
    .table-content-refs.table tbody td:last-child {
      text-align: right;
    }
  @media print {
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
