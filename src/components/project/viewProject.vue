<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="pt-5">
        <b-row align-h="end">
          <b-col
            cols="12"
            md="11" class="toDoc">
            <h2 id="project-title">{{ project.name }}</h2>
          </b-col>
          <b-col
            cols="12"
            md="1"
            class="text-right">
            <b-link :to="{ name: 'viewOrganization', params: { id: this.$route.params.org_id }}" class="d-print-none">
              <font-awesome-icon icon="long-arrow-alt-left" v-bind:title="$t('back')" />
              {{ $t('back') }}
            </b-link>
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
            @click="tabOpened=2">iSoQf</b-nav-item>
          <b-nav-item
            :active="(tabOpened === 3) ? true : false"
            @click="tabOpened=3">Guidance on applying CERQual</b-nav-item>
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
              <organizationForm
                :formData="project"></organizationForm>
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
        <b-tab>
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
              <h4 class="mt-5">STEP 1: Upload the references for your included Studies (required)</h4>
              <p class="font-weight-light">
                You must import only the references for your final list of included studies
              </p>
              <b-card no-body>
                <b-tabs id="import-data" card>
                  <b-tab title="Import from">
                    <b-row>
                      <b-col
                        sm="6">
                        <p class="font-weight-light">
                          <b>STEP 1:</b> You can import from Epistemonikos DB or PubMed pasting the ID of the references (one by line)
                        </p>
                        <b-form-textarea
                          v-model="episte_request"
                          placeholder="Ej: 17253524"
                          rows="6"
                          max-rows="100"></b-form-textarea>
                        <b-button
                          id="btnEpisteRequest"
                          class="mt-2"
                          block
                          variant="outline-primary"
                          @click="EpisteRequest">Find</b-button>
                      </b-col>
                      <b-col
                        sm="6">
                        <template
                          v-if="episte_loading">
                          <div class="text-center text-danger my-2">
                            <b-spinner class="align-middle"></b-spinner>
                            <strong>Loading...</strong>
                          </div>
                        </template>
                        <template
                          v-else-if="episte_error">
                          <p class="font-weight-light">
                            The reference could not be reached, try again or using other ID
                          </p>
                        </template>
                        <template v-else>
                          <ul v-if="episte_response.length">
                            <li v-for="(r, index) in episte_response" :key="index">
                              <b-form-checkbox
                                :id="`checkbox-${index}`"
                                v-model="episte_selected"
                                :name="`checkbox-${index}`"
                                :value="index">
                                {{ r.citation }}
                              </b-form-checkbox>
                            </li>
                          </ul>
                          <b-button
                            v-if="episte_response.length"
                            variant="outline-success"
                            block
                            @click="saveReferences('EpisteDB')">Import references</b-button>
                        </template>
                      </b-col>
                    </b-row>
                  </b-tab>
                  <b-tab title="File upload" active>
                    <b-row>
                      <b-col
                        cols="6">
                        <p class="font-weight-light">
                          <b>STEP 1:</b> Export the references for your included studies from your reference management software (e.g. Endnote). You must select RIS as the output style.
                        </p>
                        <p class="font-weight-light">
                          <b>STEP 2:</b> Import the .ris/.txt file into iSoQf.
                        </p>
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
                          @click="saveReferences()">
                            Upload
                        </b-button>
                      </b-col>
                    </b-row>
                  </b-tab>
                </b-tabs>
              </b-card>
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
              <h4 class="mt-5">
                STEP 2: Enter the study inclusion and exclusion criteria used in the review (recommended)
              </h4>
              <b-container>
                <b-row>
                  <b-col
                    cols="12"
                    md="6"
                    class="pl-0">
                    <b-form-group
                      label="Inclusion criteria"
                      label-for="inclusion-criteria"
                      description="Please enter the study inclusion criteria used in the review">
                      <b-form-textarea
                        id="inclusion-criteria"
                        rows="6"
                        max-rows="100"
                        v-model="project.inclusion"
                        @></b-form-textarea>
                    </b-form-group>
                  </b-col>
                  <b-col
                    cols="12"
                    md="6"
                    class="pr-0">
                    <b-form-group
                      label="Exclusion criteria"
                      label-for="exclusion-criteria"
                      description="please enter the study exclusion criteria used in the review">
                      <b-form-textarea
                        id="exclusion-criteria"
                        rows="6"
                        max-rows="100"
                        v-model="project.exclusion"></b-form-textarea>
                    </b-form-group>
                  </b-col>
                </b-row>
              </b-container>
            </b-col>
            <b-col
              cols="12"
              class="mt-3">
              <h4 class="mt-5">STEP 3: Create or Import your Characteristics of Studies Table (recommended)</h4>
              <p class="font-weight-light">
                Descriptive information extracted from the included studies (e.g. setting, country, perspectives, methods, etc.)
              </p>
              <b-row>
                <b-col
                  sm="4">
                  <b-button
                    block
                    variant="outline-primary"
                    v-if="charsOfStudies.fields.length <= 2"
                    @click="openModalCharsOfStudies()"
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
                  sm="1">
                  <p class="text-center pt-1">OR</p>
                </b-col>
                <b-col
                  sm="4">
                  <b-button
                    block
                    variant="outline-info"
                    :disabled="(references.length) ? false : true"
                    v-b-modal.import-characteristics-table>
                    Import table
                  </b-button>
                </b-col>
                <b-col
                  sm="3"
                  v-if="charsOfStudies.items.length > 1">
                  <b-button
                    variant="outline-secondary"
                    block
                    @click="exportTableToCSV('chars_of_studies')">
                    Export to XLS file
                  </b-button>
                </b-col>
              </b-row>
              <b-table
                sort-by="authors"
                responsive
                id="chars-of-studies-table"
                class="table-content-refs mt-3"
                v-if="charsOfStudies.fieldsObj.length > 1"
                :fields="charsOfStudies.fieldsObj"
                :items="charsOfStudies.items"
                :current-page="charsOfStudiesTableSettings.currentPage"
                :per-page="charsOfStudiesTableSettings.perPage"
                :busy="charsOfStudiesTableSettings.isBusy">
                <template
                  v-slot:cell(actions)="data">
                  <b-button
                    block
                    variant="outline-success"
                    @click="addDataCharsOfStudies((charsOfStudiesTableSettings.currentPage > 1) ? (charsOfStudiesTableSettings.perPage * (charsOfStudiesTableSettings.currentPage - 1)) + data.index : data.index)">
                    <font-awesome-icon
                      icon="edit"></font-awesome-icon>
                  </b-button>
                  <b-button
                    block
                    variant="outline-danger"
                    @click="removeItemCharOfStudies((charsOfStudiesTableSettings.currentPage > 1) ? (charsOfStudiesTableSettings.perPage * (charsOfStudiesTableSettings.currentPage - 1)) + data.index : data.index, data.item.ref_id)">
                    <font-awesome-icon
                      icon="trash"></font-awesome-icon>
                  </b-button>
                </template>
                <template v-slot:table-busy>
                  <div class="text-center text-danger my-2">
                    <b-spinner class="align-middle"></b-spinner>
                    <strong>Loading...</strong>
                  </div>
                </template>
              </b-table>
              <b-pagination
                v-if="charsOfStudies.items.length && charsOfStudies.items.length > charsOfStudiesTableSettings.perPage"
                align="center"
                v-model="charsOfStudiesTableSettings.currentPage"
                :total-rows="charsOfStudies.items.length"
                :per-page="charsOfStudiesTableSettings.perPage"
                aria-controls="chars-of-studies-table"></b-pagination>

              <b-modal
                size="xl"
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
                size="xl"
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
                size="xl"
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
                    v-model="charsOfStudiesFieldsModal.items[charsOfStudiesFieldsModal.selected_item_index][field.key]"
                    rows="2"
                    max-rows="100"></b-form-textarea>
                </b-form-group>
              </b-modal>
              <b-modal
                scrollable
                :no-close-on-backdrop="true"
                :no-close-on-esc="true"
                ok-title="Save"
                cancel-title="Close"
                size="xl"
                id="import-characteristics-table"
                ref="import-characteristics-table"
                title="Import table"
                @ok="saveImportedData('isoqf_characteristics')"
                @cancel="cleanVars('import-characteristics-table')"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                <b-alert show variant="danger">
                  <b>Beware:</b> The newly imported and saved data will delete and replace any previous data entered manually or through import.
                </b-alert>
                <p
                 class="font-weight-light">
                  To upload a table, follow these steps:
                </p>
                <h4>STEP 1: Download the template (excel file), save it to your computer, and populate it with your information.</h4>
                <p
                  class="font-weight-light text-danger">
                  The first two columns «Reference ID» and «Author(s), Year» must not be altered in any way.
                </p>
                <b-button
                  variant="info"
                  @click="generateTemplate">
                  Download template
                </b-button>
                <h4 class="mt-3">STEP 2: Import the populated template to iSoQf</h4>
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
                size="xl"
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
              <h4 class="mt-5">STEP 4: Create or import your Methodological Assessments Table (recommended)</h4>
              <p class="font-weight-light">
                Methodological assessments of each included study using an existing critical/quality appraisal tool (e.g. CASP)
              </p>
              <b-row>
                <b-col
                  sm="4">
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
                  sm="1">
                  <p class="text-center pt-1">OR</p>
                </b-col>
                <b-col
                  sm="4">
                  <b-button
                    block
                    variant="outline-info"
                    :disabled="(references.length) ? false : true"
                    v-b-modal.import-methodological-table>
                    Import table
                  </b-button>
                </b-col>
                <b-col
                  sm="3"
                  v-if="methodologicalTableRefs.fields.length > 2">
                  <b-button
                    variant="outline-secondary"
                    block
                    @click="exportTableToCSV('meth_assessments')">
                    Export to XLS file
                  </b-button>
                </b-col>
              </b-row>

              <b-table
                sort-by="authors"
                responsive
                id="methodological-table"
                v-if="methodologicalTableRefs.fieldsObj.length > 1"
                class="table-content-refs mt-3"
                :per-page="methodologicalTableRefsTableSettings.perPage"
                :current-page="methodologicalTableRefsTableSettings.currentPage"
                :fields="methodologicalTableRefs.fieldsObj"
                :items="methodologicalTableRefs.items"
                :busy="methodologicalTableRefsTableSettings.isBusy">
                <template
                  v-slot:cell(actions)="data">
                  <b-button
                    block
                    variant="outline-success"
                    @click="addDataMethodological((methodologicalTableRefsTableSettings.currentPage > 1) ? (methodologicalTableRefsTableSettings.perPage * (methodologicalTableRefsTableSettings.currentPage - 1)) + data.index : data.index)">
                    <font-awesome-icon
                      icon="edit"></font-awesome-icon>
                  </b-button>
                  <b-button
                    block
                    variant="outline-danger"
                    @click="removeItemMethodological((methodologicalTableRefsTableSettings.currentPage > 1) ? (methodologicalTableRefsTableSettings.perPage * (methodologicalTableRefsTableSettings.currentPage - 1)) + data.index : data.index, data.item.ref_id)">
                    <font-awesome-icon
                      icon="trash"></font-awesome-icon>
                  </b-button>
                </template>
                <template v-slot:table-busy>
                  <div class="text-center text-danger my-2">
                    <b-spinner class="align-middle"></b-spinner>
                    <strong>Loading...</strong>
                  </div>
                </template>
              </b-table>
              <b-pagination
                v-if="methodologicalTableRefs.items.length && methodologicalTableRefs.items.length > methodologicalTableRefsTableSettings.perPage"
                align="center"
                v-model="methodologicalTableRefsTableSettings.currentPage"
                :total-rows="methodologicalTableRefs.items.length"
                :per-page="methodologicalTableRefsTableSettings.perPage"
                aria-controls="chars-of-studies-table"></b-pagination>

              <b-modal
                size="xl"
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
                size="xl"
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
                size="xl"
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
                    v-model="methodologicalFieldsModal.items[methodologicalFieldsModal.selected_item_index][field.key]"
                    rows="2"
                    max-rows="100"></b-form-textarea>
                </b-form-group>
              </b-modal>
              <b-modal
                size="xl"
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
                size="xl"
                id="import-methodological-table"
                ref="import-methodological-table"
                title="Import table"
                @ok="saveImportedData('isoqf_assessments')"
                @cancel="cleanVars('import-methodological-table')"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                <b-alert show variant="danger">
                  <b>Beware:</b> The newly imported and saved data will delete and replace any previous data entered manually or through import.
                </b-alert>
                <p
                  class="font-weight-light">
                  To upload a table, follow these steps:
                </p>
                <h4>STEP 1: Download the template (excel file), save it to your computer, and populate it with your information.</h4>
                <p
                  class="font-weight-light text-danger">
                  The first two columns «Reference ID» and «Author(s), Year» must not be altered in any way.
                </p>
                <b-button
                  variant="info"
                  @click="generateTemplate">
                  Download template
                </b-button>
                <h4 class="mt-3">STEP 2: Import the populated template to iSoQf</h4>
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
                class="mb-3"
                @click="tabOpened=2">
                Continue to iSoQf
              </b-button>
            </b-col>
          </b-row>
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
                    <b-dropdown-item @click="generateAndDownload">to MS Word</b-dropdown-item>
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
                      @click="printiSoQf">
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
                      variant="outline-primary"
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
                      class="mt-1"
                      @click="modalChangePublicStatus"
                      :variant="(!project.private) ? 'outline-primary' : 'primary'"
                      block
                      v-b-tooltip.hover title="Click here when you have finished your iSoQf to select what you would like published to the publicly available iSoQf database">
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
              <h2><span v-if="mode==='edit'" class="d-print-none">Interactive </span>Summary of Qualitative Findings Table</h2>
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
                          >{{ project.name }}</p>
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
                      </b-col>
                      <b-col cols="12" md="4" class="toDoc">
                        <h5 v-if="Object.prototype.hasOwnProperty.call(project, 'authors')">Authors of the review</h5>
                        <ul v-if="Object.prototype.hasOwnProperty.call(project, 'authors')">
                          <li v-for="(author, index) in project.authors.split(',')" :key="index">{{ author.trim() }}</li>
                        </ul>

                        <h5>Corresponding author</h5>
                        <p v-if="project.author">{{ project.author }} <span v-if="project.author_email"><br />{{ project.author_email }}</span></p>

                        <h5 v-if="!project.complete_by_author">Is the iSoQf being completed by the review authors?</h5>
                        <p v-if="!project.complete_by_author">{{(project.complete_by_author) ? 'Yes' : 'No'}}</p>
                      </b-col>
                    </b-row>
                  </b-collapse>
                </b-card>
            </b-col>
          </b-row>
          <b-row>
            <b-col
              v-if="mode==='edit' && this.lists.length"
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
              </b-card>
            </b-col>
            <b-col
              cols="12">
              <b-row
                class="mb-2">
                <b-col
                  v-if="mode!=='view'"
                  md="4"
                  cols="12">
                  <b-button
                    class="mt-1"
                    v-b-tooltip.hover title="Copy and paste one summarized review finding at a time into the iSoQf"
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
                    v-b-tooltip.hover title="If you want to categorize your review findings, for example by theme or topic, you can do so by creating review finding categories here."
                    variant="outline-secondary"
                    @click="modalListCategories"
                    block>
                    Assign categories to your review findings
                  </b-button>
                </b-col>
                <b-col
                  v-if="mode!=='view' && lists.length > 1"
                  md="4"
                  cols="12">
                  <b-button
                    class="mt-1"
                    block
                    variant="outline-secondary"
                    @click="modalSortFindings">Re-order your review findings</b-button>

                  <b-modal
                    title="Re-order your review findings"
                    ref="modal-sort-findings"
                    id="modal-sort-findings"
                    size="xl"
                    ok-title="Save"
                    ok-variant="outline-success"
                    cancel-variant="outline-primary"
                    scrollable
                    @ok="saveSortedLists">
                    <p class="font-weight-light">
                      Drag and drop findings to re-order them in the iSoQf table
                    </p>
                    <b-list-group>
                      <draggable v-model="sorted_lists" group="columns" @start="drag=true" @end="drag=false">
                        <b-list-group-item v-for="(item, index) of sorted_lists" :key="index" class="flex-column align-items-start">
                          <div
                            v-if="item.category >= 0"
                            class="d-flex w-100 justify-content-between">
                            <h5 class="mb-1">{{ item.name }}</h5>
                          </div>
                          <p class="font-weight-light">{{ getCategoryName(item.category) }}</p>
                        </b-list-group-item>
                      </draggable>
                    </b-list-group>
                  </b-modal>
                </b-col>
              </b-row>
            </b-col>
            <b-col cols="12" class="toDoc">
              <template
                v-if="mode==='edit'">
                <b-table
                  :selectable="(mode==='view')?true:false"
                  select-mode="multi"
                  selected-variant="warning"
                  responsive
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
                    <span v-b-tooltip.hover title="Automatic numbering of summarized review findings">{{ data.label }}</span>
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
                  <!-- data -->
                  <template v-slot:cell(sort)="data">
                    {{ data.item.isoqf_id }}
                  </template>
                  <template v-slot:cell(name)="data">
                    <span v-if="mode === 'edit'">
                      <b-row
                        class="mb-3">
                        <b-col
                          sm="6"
                          cols="12">
                          <b-button
                            block
                            v-if="mode==='edit'"
                            variant="outline-success"
                            @click="editModalFindingName(data.index)">
                            <font-awesome-icon
                              v-if=(data.item.notes.length)
                              icon="comments"></font-awesome-icon>
                            Edit
                          </b-button>
                        </b-col>
                        <b-col
                          class="mt-1 mt-sm-0"
                          sm="6"
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
                  <template v-slot:cell(cerqual_option)="data">
                    <b-button
                      v-if="mode==='edit' && data.item.references.length"
                      class="d-print-none mb-3"
                      :disabled="(data.item.references.length) ? false : true"
                      block
                      :variant="(data.item.cerqual_option === '') ? 'info' : 'outline-info'"
                      :to="{name: 'editList', params: {id: data.item.id}}">
                        <span v-if="data.item.cerqual_option===''">Complete</span>
                        <span v-if="data.item.cerqual_option!=''">Edit</span>
                        CERQual Assessment
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
                        <span v-if="data.item.cerqual_explanation===''">Complete</span>
                        <span v-if="data.item.cerqual_explanation!=''">Edit</span>
                        CERQual Assessment
                    </b-button>
                    <b>{{ data.item.cerqual_explanation }}</b>
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
                      <b-th>Summarized review finding</b-th>
                      <b-th>CERQual Assessment of confidence</b-th>
                      <b-th>Explanation of CERQual Assessment</b-th>
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
                          <p>{{ item.isoqf_id }}</p>
                        </b-td>
                        <b-td
                          style="vertical-align: top;">
                          <p>{{ item.name }}</p>
                        </b-td>
                        <b-td
                          style="vertical-align: top;">
                          <p>{{ item.cerqual_option }}</p>
                        </b-td>
                        <b-td
                          style="vertical-align: top;">
                          <p>{{ item.cerqual_explanation }}</p>
                        </b-td>
                        <b-td
                          style="vertical-align: top;">
                          <p class="references">{{ item.ref_list }}</p>
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
                title="Edit Summarized review finding"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary"
                @ok="updateListName">
                <b-form-group
                  label="Summarized review finding"
                  label-for="finding-name">
                  <b-form-textarea
                    id="finding-name"
                    v-model="editFindingName.name"
                    rows="6"
                    max-rows="100"></b-form-textarea>
                </b-form-group>
                <b-form-group
                  v-if="list_categories.options.length"
                  label="Select review finding category"
                  description="You can leave this option blank. You can always assign a finding to a category later.">
                  <b-form-select
                    v-model="editFindingName.category"
                    :options="list_categories.options"></b-form-select>
                </b-form-group>
                <b-form-group
                  label="Notes"
                  label-for="finding-note"
                  description="Optional space for reviewers to leave notes for each other about this review finding">
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
                title="Remove summarized review finding"
                ok-title="Confirm"
                ok-variant="outline-danger"
                cancel-variant="outline-secondary"
                @ok="confirmRemoveList">
                <p class="text-danger">
                  Warning! Deleting this finding will also delete its associated GRADE-CERQual Assessment Worksheet.
                </p>
                <p>
                  Confirm you want to remove <b>{{ this.editFindingName.name }}</b> from the iSoQf table?
                </p>
              </b-modal>
              <b-modal
                size="xl"
                id="add-summarized"
                ref="add-summarized"
                title="Add Summarized review finding"
                :ok-disabled="(summarized_review)?false:true"
                @ok="createList"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                <b-form-group
                  label="Summarized review finding"
                  label-for="summarized-review">
                  <b-form-textarea
                    id="summarized-review"
                    v-model="summarized_review"
                    rows="6"
                    max-rows="100"></b-form-textarea>
                </b-form-group>
                <b-form-group
                  v-if="list_categories.options.length"
                  label="Select review finding category"
                  description="You can leave this option blank. You can always assign a finding to a category later.">
                  <b-form-select
                    v-model="list_categories.selected"
                    :options="list_categories.options"></b-form-select>
                </b-form-group>
              </b-modal>

              <b-modal
                v-if="selected_list_index >= 0"
                id="modal-references-list"
                ref="modal-references-list"
                title="References"
                @ok="saveReferencesList"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary"
                size="xl"
                scrollable>
                <template v-if="references.length">
                  <div
                    class="mt-2">
                    <b-alert
                      v-if="showBanner"
                      show
                      variant="danger">
                      <b>Warning!</b> By removing a reference you are modifying the underlining evidence base for this finding and will need to review your CERQual assessments. If you remove the reference, the extracted data you inputted from this study to support this finding will be deleted from the GRADE-CERQual Assessment Worksheet.
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
                    <!--
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
                    -->
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
                title="Review Finding Categories"
                scrollable
                ok-only
                ok-title="Close"
                ok-variant="outline-success">
                <p class="font-weight-light">
                  Some reviewers choose to group their review findings into different categories, for example into themes or topics. To do so, add the names of the categories here. After you have created review finding categories you will be prompted to select a category for each finding you add. You can choose not to assign a category to a review finding, or assign it later.
                </p>
                <b-table
                  head-variant="highlight"
                  striped
                  v-if="modal_edit_list_categories.options.length && !(modal_edit_list_categories.new) && !(modal_edit_list_categories.edit) && !(modal_edit_list_categories.remove)"
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
                      @click="removeListCategory(data.index)">Remove</b-button>
                  </template>
                </b-table>
                <b-button
                  v-if="!(modal_edit_list_categories.new) && !(modal_edit_list_categories.edit) && !(modal_edit_list_categories.remove)"
                  variant="outline-primary"
                  @click="modal_edit_list_categories.new=true">
                  Add new review finding category
                </b-button>
                <template
                  v-if="modal_edit_list_categories.new">
                  <b-form-group
                    class="mt-3"
                    label="Add category name">
                    <b-form-input
                      v-model="modal_edit_list_categories.name"></b-form-input>
                  </b-form-group>
                </template>
                <template
                  class="mt-3"
                  v-if="modal_edit_list_categories.edit">
                  <b-form-group
                    label="Edit category name">
                    <b-form-input
                      v-model="modal_edit_list_categories.name"></b-form-input>
                  </b-form-group>
                  <b-button
                    variant="outline-primary"
                    @click="modalCancelCategoryButtons">Cancel</b-button>
                  <b-button
                    variant="outline-success"
                    @click="updateCategoryName(modal_edit_list_categories.index)">Save</b-button>
                </template>
                <template
                  class="mt-3"
                  v-if="modal_edit_list_categories.remove">
                  <p>Confirm you want to remove <b>{{ modal_edit_list_categories.name }}</b> from categories?</p>
                  <b-button
                    variant="outline-primary"
                    @click="modalCancelCategoryButtons">Cancel</b-button>
                  <b-button
                    variant="outline-danger"
                    @click="removeCategory(modal_edit_list_categories.index)">Confirm</b-button>
                </template>
                <template v-slot:modal-footer v-if="modal_edit_list_categories.new">
                  <b-button
                    variant="outline-primary"
                    @click="modalCancelCategoryButtons">Cancel</b-button>
                  <b-button
                    variant="outline-success"
                    @click="saveNewCategory">Save</b-button>
                </template>
              </b-modal>
            </b-col>
          </b-row>
        </b-tab>
        <b-tab>
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
        size="xl"
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
      <b-modal
        ref="modal-change-status"
        scrollable
        size="xl"
        title="Publish to the iSoQf Database"
        ok-title="Save"
        ok-variant="outline-success"
        @ok="savePublicStatus"
        cancel-variant="outline-secondary">
        <p class="font-weight-light">
          By publishing your iSoQf to the online database, your contribution becomes searchable, readable and downloadable by the public. Please select a visibility setting below and click “publish”. Click the icon next to each to see an example. We recommend users choose Fully Public to maximise transparency. You can change your visibility settings at any time in Project Properties.
        </p>
        <b-form-group>
          <b-form-radio-group
            id="modal-publish-status"
            v-model="modal_project.public_type"
            :options="global_status"
            name="modal-radio-status"
          ></b-form-radio-group>
        </b-form-group>
      </b-modal>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import draggable from 'vuedraggable'
import parser from '../../plugins/parser'
import organizationForm from '../organization/organizationForm'
import _debounce from 'lodash.debounce'

export default {
  components: {
    draggable,
    organizationForm
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
            }
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
            }
          }
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
          { key: 'text', label: 'Category name' },
          { key: 'actions', label: '' }
        ],
        options: [],
        new: false,
        edit: false,
        remove: false,
        name: '',
        index: null
      },
      list_category: {
        name: ''
      },
      fields: {
        with_categories: [
          {
            key: 'sort',
            label: '#'
          },
          {
            key: 'name',
            label: 'Summarized review finding'
          },
          {
            key: 'category',
            label: 'Review Finding Categories',
            formatter: (value, key, item) => {
              if (value === null) {
                return ''
              }
              const categories = this.list_categories.options
              let category = ''
              for (let cat of categories) {
                if (cat.value === value) {
                  category = cat.text
                }
              }
              return category
            }
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
        without_categories: [
          {
            key: 'sort',
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
        ]
      },
      table_settings: {
        isBusy: true,
        currentPage: 1,
        perPage: 5,
        filter: null,
        totalRows: 1,
        filterOn: ['isoqf_id', 'name', 'cerqual_option', 'cerqual_explanation', 'ref_list']
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
        { value: 'private', text: 'Private - Your iSoQf is not publicly available on the iSoQf database' },
        { value: 'fully', text: 'Fully Public - Your iSoQf table, Evidence Profile, and GRADE CERQual Worksheets are publicly available on the iSoQf database' },
        { value: 'partially', text: 'Partially Public - Your iSoQf table and Evidence Profile are publicly available on the iSoQf database' },
        { value: 'minimally', text: 'Minimally Public - Your iSoQf table is available on the iSoQf database' }
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
        notes: null
      },
      episte_request: '',
      episte_response: [],
      episte_selected: [],
      episte_loading: false,
      episte_error: false,
      finding: {},
      showBanner: false,
      sorted_lists: [],
      changeTxtProjectProperties: '+'
    }
  },
  watch: {
    'project.inclusion': function () {
      this.saveInclusionCriteria()
    },
    'project.exclusion': function () {
      this.saveExclusionCriteria()
    },
    pre_ImportDataTable: function (data) {
      const allLines = data.split(/\r\n|\n/)
      let fields = []
      let items = []

      allLines.forEach((line, index) => {
        if (line !== '') {
          let contents = parser.parse(line)
          contents = contents[0]
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
  mounted () {
    this.getListCategories()
    this.getReferences()
    this.openModalReferencesSingle(false)
    this.getProject()
    this.$root.$on('bv::collapse::state', (collapseId, isOpen) => {
      if (collapseId === 'info-project') {
        this.changeTxtProjectProperties = '+'
        if (isOpen) {
          this.changeTxtProjectProperties = '-'
        }
        if (!isOpen && this.mode === 'view') {
          this.$root.$emit('bv::toggle::collapse', 'info-project')
        }
      }
    })
  },
  created: function () {
    this.saveInclusionCriteria = _debounce(function () { this.criteriaAction('inclusion') }, 1500)
    this.saveExclusionCriteria = _debounce(function () { this.criteriaAction('exclusion') }, 1500)
  },
  methods: {
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
      this.$root.$emit('bv::toggle::collapse', 'info-project')
    },
    printiSoQf: function () {
      /*
      if (!document.getElementsByClassName('b-table-row-selected').length) {
        this.dismissAlertPrint = true
      } else {
      */
      window.print()
      // }
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
    saveReferences: function (from = '') {
      this.loadReferences = true
      let references = ''
      if (!from) {
        references = this.fileReferences
      } else {
        let _r = []
        for (let index of this.episte_selected) {
          let content = JSON.parse(JSON.stringify(this.episte_response[index].content))
          content.publication_year = content.year
          delete (content.year)
          content.isbn_issn = content.publication.ISSN
          if (content.publication.type === 'journal') {
            content.type = 'JOUR'
          }
          _r.push(content)
        }
        references = _r
      }
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
        .then((responses) => {
          let cnt = 0
          for (let response of responses) {
            const data = response.data
            this.references.push(data)
            cnt++
          }
          const _references = JSON.parse(JSON.stringify(this.references))
          this.prefetchDataForExtractedDataUpdate(_references)

          this.msgUploadReferences = `${cnt} references have been added.`
          this.pre_references = ''
          this.fileReferences = []
          this.episte_response = []
          this.getReferences(false)
        })
        .catch((error) => {
          console.log('error', error)
        })
    },
    prefetchDataForExtractedDataUpdate: function (references) {
      let _lists = JSON.parse(JSON.stringify(this.lists))
      let _requestFindings = []
      let _requestExtractedData = []

      for (let list of _lists) {
        _requestFindings.push(axios.get(`/api/isoqf_findings/?organization=${this.$route.params.org_id}&list_id=${list.id}`))
      }
      axios.all(_requestFindings)
        .then((responses) => {
          for (let _response of responses) {
            let response = _response.data[0]
            _requestExtractedData.push(axios.get(`/api/isoqf_extracted_data/?organization=${response.organization}&finding_id=${response.id}`))
          }
          this.updateExtractedDataReferences(_requestExtractedData, references)
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    updateExtractedDataReferences: function (querys = [], references = []) {
      if (references.length) {
        if (querys.length) {
          axios.all(querys)
            .then((responses) => {
              let item = {}
              let _items = []
              let patchExtractedData = []
              for (let reference of references) {
                item = {
                  'ref_id': reference.id,
                  'authors': this.parseReference(reference, true),
                  'column_0': ''
                }
                _items.push(item)
              }
              for (let _response of responses) {
                let response = _response.data[0]
                for (let _item of _items) {
                  for (let item of response.items) {
                    if (item.ref_id === _item.ref_id) {
                      if (item.column_0.length) {
                        _item.column_0 = item.column_0
                      }
                    }
                  }
                }
                const params = {
                  items: _items
                }
                patchExtractedData.push(axios.patch(`/api/isoqf_extracted_data/${response.id}`, params))
              }
              if (patchExtractedData.length) {
                axios.all(patchExtractedData)
                  .then((responses) => {})
                  .catch((error) => {
                    this.printErrors(error)
                  })
              }
            })
        }
      }
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
          this.getLists() // summary review
          this.getCharacteristics()
          this.getMethodological()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getLists: function () { // related to summary review of a finding
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
          let cnt = 1
          for (let d of data) {
            d.sort = cnt
            d.isoqf_id = cnt
            cnt++
          }
          this.lists = data
          let _lists = data

          if (this.lists.length) {
            let lists = JSON.parse(JSON.stringify(this.lists))
            this.lastId = parseInt(lists.slice(-1)[0].isoqf_id) + 1
            for (let list of this.lists) {
              if (!Object.prototype.hasOwnProperty.call(list, 'references')) {
                list.references = []
              }
              if (!Object.prototype.hasOwnProperty.call(list, 'notes')) {
                list.notes = ''
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

            if (this.list_categories.options.length) {
              let _arr = []
              for (let category of this.list_categories.options) {
                _arr.push({'name': category.text, 'value': category.value, 'items': []})
              }

              for (let list of _lists) {
                if (_arr.length) {
                  for (let element of _arr) {
                    if (element.value === list.category) {
                      element.items.push(
                        {
                          'isoqf_id': list.isoqf_id,
                          'name': list.name,
                          'cerqual_option': list.cerqual_option,
                          'cerqual_explanation': list.cerqual_explanation,
                          'ref_list': list.ref_list,
                          'sort': list.sort,
                          'notes': list.notes
                        }
                      )
                    }
                  }
                }
              }
              let newArr = []
              for (let cat of _arr) {
                newArr.push({'is_category': true, 'name': cat.name})
                for (let item of cat.items) {
                  newArr.push(item)
                }
              }
              newArr.sort(function (a, b) {
                if (a.sort < b.sort) {
                  return -1
                }
                if (a.sort > b.sort) {
                  return 1
                }
                return 0
              })
              this.lists_print_version = newArr
            } else {
              let items = []
              for (let list of _lists) {
                items.push(
                  {
                    'isoqf_id': list.isoqf_id,
                    'name': list.name,
                    'cerqual_option': list.cerqual_option,
                    'cerqual_explanation': list.cerqual_explanation,
                    'ref_list': list.ref_list,
                    'sort': list.sort,
                    'notes': list.notes
                  }
                )
              }
              items.sort(function (a, b) {
                if (a.sort < b.sort) {
                  return -1
                }
                if (a.sort > b.sort) {
                  return 1
                }
                return 0
              })
              this.lists_print_version = items
            }
          }
          this.table_settings.isBusy = false
          this.table_settings.totalRows = this.lists.length
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
      let querys = []
      for (let list of _lists) {
        querys.push(axios.patch(`/api/isoqf_lists/${list.id}`, {'sort': list.sort, 'isoqf_id': list.isoqf_id}))
      }
      axios.all(querys)
        .then((responses) => {
          const params = {
            organization: this.$route.params.org_id,
            project_id: this.$route.params.id,
            name: this.summarized_review,
            isoqf_id: this.lastId,
            cerqual: { option: null, explanation: '' },
            references: [],
            category: this.list_categories.selected,
            sort: _sort
          }
          axios.post('/api/isoqf_lists/', params)
            .then((response) => {
              const listId = response.data.id
              const listName = response.data.name

              this.getLists()
              this.createFinding(listId, listName)
              this.summarized_review = ''
              this.list_categories.selected = null
            })
            .catch((error) => {
              this.printErrors(error)
            })
        })
        .catch((error) => {
          this.printErrors(error)
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
          },
          references: []
        },
        references: []
      }
      axios.post('/api/isoqf_findings', params)
        .then((response) => {
          this.createExtractedData(response.data.id)
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
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
                  const tabs = ['#Project-Property', '#My-Data', '#iSoQf', '#Guidance-on-Applying-CERQual']
                  this.tabOpened = tabs.indexOf(this.$route.hash)
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
      let list = JSON.parse(JSON.stringify(this.lists[index]))

      const params = {
        organization: this.$route.params.org_id,
        list_id: list.id
      }
      axios.get('/api/isoqf_findings/', {params})
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
    },
    saveReferencesList: function () {
      this.loadReferences = true
      this.table_settings.isBusy = true
      const params = {
        references: this.selected_references
      }
      axios.patch(`/api/isoqf_lists/${this.lists[this.selected_list_index].id}`, params)
        .then((response) => {
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
        .then((response) => {
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
            this.printErrors(error)
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
          this.printErrors(error)
        })
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
    saveDataCharsOfStudies: function () {
      let params = {}
      let characteristicId = this.charsOfStudies.id
      params.items = this.charsOfStudiesFieldsModal.items

      axios.patch(`/api/isoqf_characteristics/${characteristicId}`, params)
        .then((response) => {
          this.getProject()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    updateProjectInfo: function () {
      let project = JSON.parse(JSON.stringify(this.project))
      project.private = true
      project.is_public = false
      if (project.public_type !== 'private') {
        project.private = false
        project.is_public = true
      }
      axios.patch(`/api/isoqf_projects/${project.id}`, project)
        .then((response) => {
          this.msgUpdateProject = 'The project has been updated'
          window.scrollTo({ top: 0, behavior: 'smooth' })
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
      this.importDataTable = { fields: [], items: [], fieldsObj: [{ key: 'authors', label: 'Author(s), Year' }] }
      this.pre_ImportDataTable = ''
    },
    cleanVars: function (modal = '') {
      this.importDataTable = { fields: [], items: [], fieldsObj: [{ key: 'authors', label: 'Author(s), Year' }] }
      this.pre_ImportDataTable = ''
      this.$refs[modal].hide()
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
          this.printErrors(error)
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
          this.printErrors(error)
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
            this.printErrors(error)
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
          this.printErrors(error)
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
          this.printErrors(error)
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
          this.printErrors(error)
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
          this.printErrors(error)
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
          .then((response) => {})
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
              getExtractedData.push(axios.get(`/api/isoqf_extracted_data/?organization=${this.$route.params.org_id}&finding_id=${finding.id}`))
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
        .then((responses) => {
          this.getReferences()
          this.openModalReferencesSingle(false)
          this.getProject()
          this.resetData()
          this.$refs['modal-references'].hide()
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
    editModalFindingName: function (index) {
      const list = this.lists[index]
      this.editFindingName.index = index
      this.editFindingName.name = list.name
      this.editFindingName.category = list.category
      this.editFindingName.notes = list.notes
      const params = {
        organization: this.$route.params.org_id,
        list_id: list.id
      }
      axios.get('/api/isoqf_findings/', {params})
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
      const index = this.editFindingName.index
      _lists[index].name = this.editFindingName.name
      _lists[index].category = this.editFindingName.category
      _lists[index].notes = this.editFindingName.notes

      axios.patch(`/api/isoqf_lists/${_lists[index].id}`, _lists[index])
        .then((response) => {
          this.updateFinding(this.editFindingName)
          this.getLists()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    updateFinding: function (finding) {
      const params = {
        name: finding.name,
        notes: finding.notes,
        'evidence_profile.name': finding.name,
        'evidence_profile.notes': finding.notes
      }
      axios.patch(`/api/isoqf_findings/${finding.finding_id}`, params)
        .then((response) => {})
        .catch((error) => {
          this.printErrors(error)
        })
    },
    removeModalFinding: function (index) {
      this.editFindingName.index = index
      this.editFindingName.name = this.lists[index].name
      const params = {
        organization: this.$route.params.org_id,
        list_id: this.lists[index].id
      }
      axios.get('/api/isoqf_findings/', {params})
        .then((response) => {
          // console.log('finding_id', response.data[0].id)
          this.editFindingName.finding_id = response.data[0].id
        })
        .catch((error) => {
          this.printErrors(error)
        })
      this.$refs['remove-finding'].show()
    },
    confirmRemoveList: function () {
      const index = this.editFindingName.index
      const _list = JSON.parse(JSON.stringify(this.lists[index]))
      axios.delete(`/api/isoqf_lists/${_list.id}`)
        .then((response) => {
          this.confirmRemoveFinding(this.editFindingName.finding_id)
          this.getLists()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    confirmRemoveFinding: function (findingID) {
      axios.delete(`/api/isoqf_findings/${findingID}`)
        .then((response) => {
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
      axios.get('/api/isoqf_list_categories/', { params })
        .then((response) => {
          if (response.data.length) {
            const options = JSON.parse(JSON.stringify(response.data[0].options))
            this.list_categories.options = options
            this.modal_edit_list_categories.id = response.data[0].id
            this.modal_edit_list_categories.options = options
          }
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    saveListCategoryName: function () {
      const options = [
        { value: 0, text: this.list_category.name }
      ]
      const params = {
        options: options,
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.post('/api/isoqf_list_categories/', params)
        .then((response) => {
          this.list_categories.options = response.data.options
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
      const objID = this.modal_edit_list_categories.id
      let _options = JSON.parse(JSON.stringify(this.list_categories.options))
      if (_options.length) {
        const newValue = (_options[_options.length - 1].value !== null) ? parseInt(_options[_options.length - 1].value) + 1 : 0
        _options.push({ value: newValue, text: this.modal_edit_list_categories.name })
      } else {
        _options = [
          { value: 0, text: this.modal_edit_list_categories.name }
        ]
      }
      const params = {
        options: _options,
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      if (objID) {
        axios.patch(`/api/isoqf_list_categories/${objID}`, params)
          .then((response) => {
            this.getListCategories()
            this.getLists()
            this.modal_edit_list_categories.new = false
            this.modal_edit_list_categories.name = ''
          })
          .catch((error) => {
            this.printErrors(error)
          })
      } else {
        axios.post('/api/isoqf_list_categories/', params)
          .then((response) => {
            this.getListCategories()
            this.getLists()
            this.modal_edit_list_categories.new = false
            this.modal_edit_list_categories.name = ''
          })
          .catch((error) => {
            this.printErrors(error)
          })
      }
    },
    editListCategoryName: function (index) {
      let _options = JSON.parse(JSON.stringify(this.modal_edit_list_categories.options))

      this.modal_edit_list_categories.name = _options[index].text
      this.modal_edit_list_categories.edit = true
      this.modal_edit_list_categories.index = index
    },
    updateCategoryName: function (index) {
      const objID = this.modal_edit_list_categories.id
      let _options = JSON.parse(JSON.stringify(this.modal_edit_list_categories.options))

      _options[index].text = this.modal_edit_list_categories.name

      if (objID) {
        const params = {
          options: _options,
          organization: this.$route.params.org_id,
          project_id: this.$route.params.id
        }
        axios.patch(`/api/isoqf_list_categories/${objID}`, params)
          .then((response) => {
            this.getListCategories()
            this.getLists()
            this.modal_edit_list_categories.edit = false
            this.modal_edit_list_categories.name = ''
            this.modal_edit_list_categories.index = null
          })
          .catch((error) => {
            this.printErrors(error)
          })
      }
    },
    removeListCategory: function (index) {
      let _options = JSON.parse(JSON.stringify(this.modal_edit_list_categories.options))

      this.modal_edit_list_categories.name = _options[index].text
      this.modal_edit_list_categories.remove = true
      this.modal_edit_list_categories.index = index
    },
    removeCategory: function () {
      const objID = this.modal_edit_list_categories.id
      const index = this.modal_edit_list_categories.index
      const _options = JSON.parse(JSON.stringify(this.modal_edit_list_categories.options))
      const deletedItem = _options.splice(index, 1)

      if (objID) {
        const params = {
          options: _options,
          organization: this.$route.params.org_id,
          project_id: this.$route.params.id
        }
        axios.patch(`/api/isoqf_list_categories/${objID}`, params)
          .then((response) => {
            this.getListCategories()
            this.updateLists(deletedItem)
            this.modal_edit_list_categories.remove = false
            this.modal_edit_list_categories.name = ''
            this.modal_edit_list_categories.index = null
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
      this.modal_edit_list_categories.name = ''
      this.modal_edit_list_categories.index = null
    },
    modalChangePublicStatus: function () {
      this.modal_project = JSON.parse(JSON.stringify(this.project))
      this.$refs['modal-change-status'].show()
    },
    savePublicStatus: function () {
      let params = {}
      params.private = true
      params.is_public = false
      if (this.modal_project.public_type !== 'private') {
        params.private = false
        params.is_public = true
      }
      params.public_type = this.modal_project.public_type

      axios.patch(`/api/isoqf_projects/${this.project.id}`, params)
        .then((response) => {
          this.modal_project = {}
          this.getProject()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    exportTableToCSV: function (type) {
      var csv = 'data:text/csv;charset=utf-8,'
      const _types = ['chars_of_studies', 'meth_assessments']
      let _protoCSV = []
      let _keys = []
      var cnt = 1

      if (_types.indexOf(type) !== -1) {
        switch (type) {
          case 'chars_of_studies':
            _protoCSV.push(JSON.parse(JSON.stringify(this.charsOfStudies.fields)))
            _protoCSV.push(JSON.parse(JSON.stringify(this.charsOfStudies.items)))
            break
          case 'meth_assessments':
            _protoCSV.push(JSON.parse(JSON.stringify(this.methodologicalTableRefs.fields)))
            _protoCSV.push(JSON.parse(JSON.stringify(this.methodologicalTableRefs.items)))
            break
          default:
            break
        }

        for (let _element in _protoCSV) {
          if (_element === '0') {
            cnt = 1
            for (let element of _protoCSV[_element]) {
              _keys.push(element.key)
              csv = csv.concat('"' + element.label + ((cnt < _protoCSV[_element].length) ? '",' : '"' + '\n'))
              cnt++
            }
          } else {
            for (let index in _protoCSV[_element]) {
              cnt = 1
              for (let key of _keys) {
                csv = csv.concat('"' + _protoCSV[_element][index][key] + ((cnt < Object.keys(_protoCSV[_element][index]).length) ? '",' : '"' + '\n'))
                cnt++
              }
            }
          }
        }
      }

      let encodedUri = encodeURI(csv)
      let link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', type + '.csv')
      document.body.appendChild(link)

      link.click()
    },
    updateLists: function (deletedCategoryValue) {
      let _lists = JSON.parse(JSON.stringify(this.lists))
      let _request = []
      for (let list of _lists) {
        if (list.category === deletedCategoryValue[0].value) {
          list.category = null
          _request.push(axios.patch(`/api/isoqf_lists/${list.id}`, list))
        }
      }
      axios.all(_request)
        .then(axios.spread((...response) => {
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
        .then(axios.spread((response) => {
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
        .then((response) => {})
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
            .then((response) => {
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
    criteriaAction: function (type, action = '') {
      let params = {}
      if (type === 'inclusion') {
        params.inclusion = this.project.inclusion || ''
        if (action === 'clean') {
          params.inclusion = ''
        }
      } else {
        params.exclusion = this.project.exclusion || ''
        if (action === 'clean') {
          params.exclusion = ''
        }
      }
      axios.patch(`/api/isoqf_projects/${this.$route.params.id}`, params)
        .then((response) => {
          if (type === 'inclusion') {
            this.ui.project.inclusion.success.dismissCountDown = this.ui.project.inclusion.success.dismissSecs
            this.ui.project.type = 'inclusion'
            this.getProject()
          }
          if (type === 'exclusion') {
            this.ui.project.exclusion.success.dismissCountDown = this.ui.project.exclusion.success.dismissSecs
            this.ui.project.type = 'exclusion'
            this.getProject()
          }
        })
        .catch((error) => {
          this.printErrors(error)
          if (type === 'inclusion') {
            this.ui.project.inclusion.error.show = true
          }
          if (type === 'exclusion') {
            this.ui.project.exclusion.error.show = true
          }
        })
    },
    countDownChanged (dismissCountDown) {
      if (this.ui.project.type === 'inclusion') {
        this.ui.project.inclusion.success.dismissCountDown = dismissCountDown
      }
      if (this.ui.project.type === 'exclusion') {
        this.ui.project.exclusion.success.dismissCountDown = dismissCountDown
      }
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
    #findings-print .references {
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
  @media print {
    @page {
      size: A4 landscape;
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
