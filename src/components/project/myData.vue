<template>
  <div>
    <b-row>
      <b-col
        cols="12">
        <videoHelp txt="Add data needed to make GRADE-CERQual assessments" tag="h3" urlId="449265292"></videoHelp>
        <p>
          To optimise the functionality of iSoQ, and save you time, please add the following information organised into 4 steps.
        </p>
      </b-col>
      <b-col
        cols="12">
        <h4 class="mt-5">STEP 1: Upload the <b>references</b> for your included studies (required)</h4>
        <p class="font-weight-light">
          You must import only the references for your final list of included studies
        </p>
        <b-card no-body>
          <b-tabs id="import-data" card>
            <b-tab title="File upload" active>
              <b-row>
                <b-col
                  cols="12">
                  <videoHelp txt="File upload" tag="h4" urlId="449247762"></videoHelp>
                </b-col>
              </b-row>
              <p class="font-weight-light">
                <b>STEP 1:</b> Export the references for your included studies from your reference management software (e.g. Endnote). You must select RIS as the output style.
              </p>
              <p class="font-weight-light">
                <b>STEP 2:</b> Import the .ris/.txt file into iSoQ.
              </p>
              <b-form-file
                id="input-ris-file-key"
                plain
                :disabled="!checkPermissions"
                @change="loadRefs($event)"></b-form-file>
              <b-button
                block
                :disabled="(fileReferences.length >= 1) ? false : true"
                class="mt-2"
                variant="success"
                @click="saveReferences()">
                  Upload
              </b-button>
              <p>
                Reminder: If you later add studies to your review, you can do a second import of these and they will be added to your existing list.
              </p>
            </b-tab>
            <b-tab title="Import from PubMed">
              <b-row>
                <b-col
                  cols="12">
                  <videoHelp txt="Import from PubMed" tag="h4" urlId="449248998"></videoHelp>
                </b-col>
              </b-row>
              <b-row>
                <b-col
                  sm="6">
                  <p class="font-weight-light">
                    You can import individual references from PubMed by pasting the references PMID below. The PMID is the 8-digit identification number appearing at the end of the web address for the article on PubMed. Add one PMID per line below and click Find.
                  </p>
                  <b-form-textarea
                    v-model="pubmed_request"
                    placeholder="Ej: 17253524"
                    rows="6"
                    max-rows="100"></b-form-textarea>
                  <b-button
                    v-if="checkPermissions"
                    id="btnEpisteRequest"
                    class="mt-2"
                    block
                    variant="outline-primary"
                    @click="PubmedRequest">Find</b-button>
                  <b-button
                    v-if="checkPermissions && pubmed_requested.length"
                    id="btnEpisteRequestClean"
                    class="mt-1"
                    block
                    variant="outline-secondary"
                    @click="PubmedRequestClean">Clean</b-button>
                </b-col>
                <b-col
                  sm="6">
                  <template
                    v-if="pubmed_loading">
                    <div class="text-center text-danger my-2">
                      <b-spinner class="align-middle"></b-spinner>
                      <strong>Loading...</strong>
                    </div>
                  </template>
                  <template
                    v-else-if="pubmed_error">
                    <p class="font-weight-light">
                      The reference could not be reached, try again or using other ID
                    </p>
                  </template>
                  <template v-else>
                    <ul v-if="pubmed_requested.length">
                      <li v-for="(r, index) in pubmed_requested" :key="index">
                        <b-form-checkbox
                          :id="`checkbox-${index}`"
                          v-model="pubmed_selected"
                          :name="`checkbox-${index}`"
                          :value="index"
                          :disabled="r.disabled">
                          {{ r.title }}
                        </b-form-checkbox>
                      </li>
                    </ul>
                    <b-button
                      v-if="pubmed_selected.length && checkPermissions"
                      variant="outline-success"
                      block
                      @click="importReferences()">Import references</b-button>
                  </template>
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
        v-if="references.length"
        cols="12"
        class="mt-3">
        <h4 class="mt-5">
          STEP 2: Enter the study <b>inclusion and exclusion criteria</b> used in the review (recommended)
        </h4>
        <b-container>
          <b-row>
            <b-col
              cols="12"
              md="6"
              class="pl-0">
              <criteria
                v-if="ui.project.show_criteria"
                label="Inclusion criteria"
                description="Please enter the study inclusion criteria used in the review"
                :isDisabled="checkPermissions"
                criteria="inclusion"
                :dataTxt="project.inclusion"
                @update-modification="updateModificationTime()">
              </criteria>
            </b-col>
            <b-col
              cols="12"
              md="6"
              class="pr-0">
              <criteria
                v-if="ui.project.show_criteria"
                label="Exclusion criteria"
                description="Please enter the study exclusion criteria used in the review"
                :isDisabled="checkPermissions"
                criteria="exclusion"
                :dataTxt="project.exclusion"
                @update-modification="updateModificationTime()">
              </criteria>
            </b-col>
          </b-row>
        </b-container>
      </b-col>
      <b-col
        v-if="references.length"
        cols="12"
        class="mt-3">
        <h4 class="mt-5">STEP 3: Create or import your <b>characteristics of studies table</b> (recommended)</h4>
        <p class="font-weight-light">
          Descriptive information extracted from the included studies (e.g. setting, country, perspectives, methods, etc.)
        </p>
        <b-row
          v-if="checkPermissions">
          <b-col
            sm="4">
            <b-button
              block
              variant="outline-primary"
              :disabled="(references.length) ? false : true"
              v-if="charsOfStudies.fields.length <= 2"
              @click="openModalCharsOfStudies()">
              Create Table
            </b-button>
            <b-button
              block
              variant="outline-primary"
              v-if="charsOfStudies.fields.length > 2"
              @click="openModalCharsOfStudiesEdit">
              Add or Edit column headings
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
            v-if="charsOfStudies.fields.length > 2">
            <b-button
              variant="outline-secondary"
              block
              @click="exportTableToCSV('chars_of_studies')">
              Export to XLS file
            </b-button>
          </b-col>
        </b-row>
        <b-row>
          <b-col
            cols="12">
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
                v-slot:cell(authors)="data">
                <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{data.item.authors}}</span>
              </template>
              <template
                v-slot:cell(actions)="data"
                v-if="charsOfStudies.fields.length > 2">
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
          </b-col>

          <b-col
            cols="12">
            <b-pagination
              v-if="charsOfStudies.items.length && charsOfStudies.items.length > charsOfStudiesTableSettings.perPage"
              align="center"
              v-model="charsOfStudiesTableSettings.currentPage"
              :total-rows="charsOfStudies.items.length"
              :per-page="charsOfStudiesTableSettings.perPage"
              aria-controls="chars-of-studies-table">
            </b-pagination>
          </b-col>

          <b-col
            cols="12">
            <back-to-top></back-to-top>
          </b-col>

          <b-modal
            size="xl"
            id="open-char-of-studies-table-modal"
            ref="open-char-of-studies-table-modal"
            scrollable
            :ok-disabled="(charsOfStudiesFieldsModal.fields[0])?false:true"
            @ok="saveCharacteristicsStudiesFields"
            ok-title="Save"
            ok-variant="outline-success"
            cancel-variant="outline-secondary">
            <template v-slot:modal-title>
              <videoHelp txt="Column Headers" tag="none" urlId="449742512"></videoHelp>
            </template>
            <p class="font-weight-light">
              Column headings describe the categories of the descriptive information extracted – e.g. setting, country, perspectives, methods, etc.
            </p>
            <ul class="font-weight-light text-danger">
              <li>Do not add columns for author or year (these will be added automatically)</li>
              <li>Do not add methodological assessments (critical/quality appraisal). These go in a separate table.</li>
            </ul>
            <b-form-group
              label="Number of columns">
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
            :ok-disabled="(charsOfStudiesFieldsModalEdit.fields.length)?((charsOfStudiesFieldsModalEdit.fields[0].label)?false:true):false"
            @ok="updateCharacteristicsStudiesFields"
            ok-variant="outline-success"
            ok-title="Save"
            cancel-variant="outline-secondary">
            <template v-slot:modal-title>
              <videoHelp txt="Edit column headers" tag="none" urlId="449742512"></videoHelp>
            </template>
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
                  <b-input-group-append>
                    <b-button
                      v-if="charsOfStudiesFieldsModalEdit.fields.length > 1"
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
            :no-close-on-backdrop="true"
            :no-close-on-esc="true"
            ok-title="Save"
            cancel-title="Close"
            size="xl"
            id="import-characteristics-table"
            ref="import-characteristics-table">
            <template v-slot:modal-title>
              <videoHelp txt="Import table" tag="none" urlId="450046545"></videoHelp>
            </template>
            <b-alert show variant="danger">
              <b>Beware:</b> The newly imported and saved data will delete and replace any previous data entered manually or through import.
            </b-alert>
            <p
            class="font-weight-light">
              To upload a table, follow these steps:
            </p>
            <h4>STEP 1: Download the template (excel file), save it to your computer, and populate it with your information.</h4>
            <p
              class="text-danger">
              <b>When you save the file, choose 'CSV-UTF-8 (Comma delimited) (*.csv)' as the "Save as type"</b>
            </p>
            <p class="text-danger">
              <b>Mac users: we are aware of compatibility issues and recommend you work on the table template in either Google drive, Open Office or LibreOffice.</b>
            </p>
            <p
              class="text-danger">
              <b>The first two columns «Reference ID» and «Author(s), Year» must not be altered in any way.</b>
            </p>
            <b-button
              variant="info"
              @click="generateTemplate">
              Download template
            </b-button>
            <h4 class="mt-5">STEP 2: Import the populated template to iSoQ</h4>
            <b-form-file
              ref="import-chars-table-file"
              id="input-template-chars-file"
              plain
              @change="loadTableImportData($event)"></b-form-file>
            <h4 class="mt-5">STEP 3: Look at the preview of the table below and accept or reject it</h4>
            <p>If it looks right, accept the import by clicking the "Save" button at the bottom of the page.</p>
            <p>If something doesn't look right, remove it by clicking the "Reject" button at the bottom of the page and return to Step 2. <a href="#" v-b-modal='`videoHelp-450046545`'>See help video</a> for support.</p>
            <b-alert
              variant="info"
              :show="importDataTable.error !== null">
              {{ importDataTable.error }}
            </b-alert>
            <b-table
              v-if="importDataTable.items.length"
              responsive
              :fields="importDataTable.fieldsObj"
              :items="importDataTable.items"></b-table>
            <template v-slot:modal-footer>
              <b-button
                variant="outline-secondary"
                @click="cleanVars('close', 'modal-chars')">Cancel</b-button>
              <b-button
                variant="outline-info"
                :disabled="!importDataTable.items.length"
                @click="cleanVars('chars')">Reject</b-button>
              <b-button
                variant="outline-success"
                :disabled="!importDataTable.items.length"
                @click="saveImportedData('isoqf_characteristics')">Save</b-button>
            </template>
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
        </b-row>
      </b-col>
      <b-col
        v-if="references.length"
        cols="12"
        class="mt-3">
        <h4 class="mt-5">STEP 4: Create or import your <b>methodological assessments table</b> (recommended)</h4>
        <p class="font-weight-light">
          Methodological assessments of each included study using an existing critical/quality appraisal tool (e.g. CASP)
        </p>
        <b-row
          v-if="checkPermissions">
          <b-col
            sm="4">
            <b-button
              block
              variant="outline-primary"
              :disabled="(references.length) ? false : true"
              v-if="methodologicalTableRefs.fields.length <= 2"
              @click="openModcontent()">
              Create Table
            </b-button>
            <b-button
              block
              variant="outline-primary"
              v-if="methodologicalTableRefs.fields.length > 2"
              @click="openModcontent(true)">
              Add or Edit column headings
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

        <b-row>
          <b-col
            cols="12">
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
                v-slot:cell(authors)="data">
                <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{data.item.authors}}</span>
              </template>
              <template
                v-slot:cell(actions)="data"
                v-if="methodologicalTableRefs.fields.length > 2">
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
          </b-col>

          <b-col
            cols="12">
            <b-pagination
              v-if="methodologicalTableRefs.items.length && methodologicalTableRefs.items.length > methodologicalTableRefsTableSettings.perPage"
              align="center"
              v-model="methodologicalTableRefsTableSettings.currentPage"
              :total-rows="methodologicalTableRefs.items.length"
              :per-page="methodologicalTableRefsTableSettings.perPage"
              aria-controls="chars-of-studies-table">
            </b-pagination>
          </b-col>

          <b-col
            cols="12">
            <back-to-top></back-to-top>
          </b-col>
        </b-row>

        <b-modal
          size="xl"
          id="open-methodological-table-modal"
          ref="open-methodological-table-modal"
          scrollable
          :ok-disabled="(methodologicalFieldsModal.fields.length)?((methodologicalFieldsModal.fields[0].length)?false:true):true"
          @ok="saveMethodologicalFields"
          ok-title="Save"
          ok-variant="outline-success"
          cancel-variant="outline-secondary">
          <template v-slot:modal-title>
            <videoHelp txt="Column Headers" tag="none" urlId="449764545"></videoHelp>
          </template>
            <p class="font-weight-light">
              Column headings correspond to the quality assessment criteria of the appraisal tool you used - e.g CASP - was there a clear statement of the aims of the research? (column 1), is a qualitative methodology appropriate? (column 2), etc
            </p>
            <b-form-group
              label="Number of columns">
              <b-form-input
                id="nro-columns"
                v-model="methodologicalFieldsModal.nroColumns"
                type="number" min="1" max="10"></b-form-input>
            </b-form-group>
            <b-form-group
              v-for="cnt in parseInt(methodologicalFieldsModal.nroColumns)"
              :key="cnt"
              :label="`Column #${cnt}`">
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
          :ok-disabled="(methodologicalFieldsModalEdit.fields.length)?((methodologicalFieldsModalEdit.fields[0].label.length)?false:true):false"
          @ok="updateMethodologicalFields"
          ok-title="Save"
          ok-variant="outline-success"
          cancel-variant="outline-secondary">
          <template v-slot:modal-title>
            <videoHelp txt="Edit column headers" tag="none" urlId="449764545"></videoHelp>
          </template>
            <p class="font-weight-light">
              Column headings correspond to the quality assessment criteria of the appraisal tool you used - e.g CASP - was there a clear statement of the aims of the research? (column 1), is a qualitative methodology appropriate? (column 2), etc
            </p>
            <draggable v-model="methodologicalFieldsModalEdit.fields" group="columns" @start="drag=true" @end="drag=false">
              <b-form-group
                v-for="(field, index) in methodologicalFieldsModalEdit.fields"
                :key="index"
                :label="`Column #${index}`">
                <b-input-group
                  v-if="methodologicalFieldsModalEdit.fields.length">
                  <b-form-input
                    :id="`column_${index}`"
                    v-model="field.label"
                    type="text"></b-form-input>
                  <b-input-group-append>
                    <b-button
                      v-if="methodologicalFieldsModalEdit.fields.length > 1"
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
              max-rows="100"
              placeholder="Enter both your assessment and the explanation for your assessment here"></b-form-textarea>
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
          :no-close-on-backdrop="true"
          :no-close-on-esc="true"
          ok-title="Save"
          cancel-title="Close"
          size="xl"
          id="import-methodological-table"
          ref="import-methodological-table">
          <template v-slot:modal-title>
            <videoHelp txt="Import table" tag="none" urlId="451099168"></videoHelp>
          </template>
          <b-alert show variant="danger">
            <b>Beware:</b> The newly imported and saved data will delete and replace any previous data entered manually or through import.
          </b-alert>
          <p
            class="font-weight-light">
            To upload a table, follow these steps:
          </p>
          <h4>STEP 1: Download the template (excel file), save it to your computer, and populate it with your information.</h4>
          <p
            class="text-danger">
            <b>When you save the file, choose 'CSV-UTF-8 (Comma delimited) (*.csv)' as the "Save as type"</b>
          </p>
          <p class="text-danger">
            <b>Mac users: we are aware of compatibility issues and recommend you work on the table template in either Google drive, Open Office or LibreOffice.</b>
          </p>
          <p
            class="text-danger">
            <b>The first two columns «Reference ID» and «Author(s), Year» must not be altered in any way.</b>
          </p>
          <b-button
            variant="info"
            @click="generateTemplate">
            Download template
          </b-button>
          <h4 class="mt-5">STEP 2: Import the populated template to iSoQ</h4>
          <b-form-file
            id="input-template-methodological-file"
            ref="import-meth-table-file"
            plain
            @change="loadTableImportData($event)"></b-form-file>
          <h4 class="mt-5">STEP 3: Look at the preview of the table below and accept or reject it</h4>
          <p>If it looks right, accept the import by clicking the "Save" button at the bottom of the page.</p>
          <p>If something doesn't look right, remove it by clicking the "Reject" button at the bottom of the page and return to Step 2. <a href="#" v-b-modal='`videoHelp-451099168`'>See help video</a> for support.</p>
          <b-alert
            variant="info"
            :show="importDataTable.error !== null">
            {{ importDataTable.error }}
          </b-alert>
          <b-table
            v-if="importDataTable.items.length"
            responsive
            :fields="importDataTable.fieldsObj"
            :items="importDataTable.items"></b-table>
          <template v-slot:modal-footer>
              <b-button
                variant="outline-secondary"
                @click="cleanVars('close', 'modal-meth')">Cancel</b-button>
              <b-button
                variant="outline-info"
                :disabled="!importDataTable.items.length"
                @click="cleanVars('meth')">Reject</b-button>
              <b-button
                variant="outline-success"
                :disabled="!importDataTable.items.length"
                @click="saveImportedData('isoqf_assessments')">Save</b-button>
            </template>
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
          @click="continueToIsoq">
          Continue to iSoQ
        </b-button>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import axios from 'axios'
const videoHelp = () => import(/* webpackChunkName: "videohelp" */ '../videoHelp')

export default {
  name: 'myData',
  props: {
    checkPermissions: Boolean
  },
  components: {
    videoHelp
  },
  data () {
    return {
      fileReferences: [],
      pre_references: '',
      loadReferences: false,
      episte_selected: [],
      pubmed_request: '',
      pubmed_requested: []
    }
  },
  methods: {
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
          this.updateMyDataTables()
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
    PubmedRequestClean: function () {
      document.getElementById('btnEpisteRequest').disabled = false
      this.pubmed_request = ''
      this.pubmed_requested = []
      this.pubmed_selected = []
      this.pubmed_loading = false
      this.pubmed_error = false
    },
    PubmedRequest: function () {
      const urlBase = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?api_key=abdb2d5a30084a5a7200df1515d45fb36f08&db=pubmed&retmode=json&id='
      document.getElementById('btnEpisteRequest').disabled = true
      this.pubmed_loading = true
      this.pubmed_error = false
      this.pubmed_response = []
      const allLines = this.pubmed_request.split(/\r\n|\n/)
      let requests = []
      allLines.forEach((line, index) => {
        requests.push(axios.get(urlBase + line))
      })
      axios.all(requests)
        .then(axios.spread((...responses) => {
          for (let response of responses) {
            let uid = response.data.result.uids[0]
            this.processPubmedData(response.data.result[uid])
          }
          this.pubmed_loading = false
        }))
        .catch((error) => {
          console.log(error)
        })
    },
    importReferences: function () {
      if (this.pubmed_selected.length) {
        for (let index of this.pubmed_selected) {
          delete this.pubmed_requested[index].disabled
          axios.post('/api/isoqf_references', this.pubmed_requested[index])
            .then(() => {
              this.pubmed_requested.splice(index, 1)
            })
            .catch((error) => {
              console.log(error)
            })
        }
        this.loadReferences = true
        this.pubmed_request = ''
        this.pubmed_requested = []
        this.pubmed_selected = []
        this.getReferences(false)
        document.getElementById('btnEpisteRequest').disabled = false
      }
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
    }
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
        const _line = line.split('  -')
        if (_line.length > 1) {
          const key = _line[0]
          const content = _line[1].trimStart()

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
          if (['PY', 'Y1'].includes(key)) {
            base['publication_year'] = content.split('/')[0]
            base['real_date'] = content
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
        }
      })
    }
  }
}
</script>

<style>

</style>
