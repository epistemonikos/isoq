<template>
  <div class="mt-4">
    <b-container>
      <b-row>
        <b-col cols="12" class="text-right">
          <b-link @click="$router.go(-1)">
            <font-awesome-icon icon="long-arrow-alt-left" v-bind:title="$t('back')" />
            {{ $t('back') }}
          </b-link>
        </b-col>
      </b-row>
      <h2>Evidence Profile Worksheet</h2>
      <h3>{{list.name}}</h3>
      <b-row>
        <b-col
          cols="12">
          <b-form-checkbox-group
            v-model="show.selected"
            :options="show.options"
            switches></b-form-checkbox-group>
        </b-col>
      </b-row>
      <b-row class="mt-5">
        <b-col cols="12">
          <!--<b-tabs>-->
            <!-- Evidence Profile-->
            <!--<b-tab :title="$t('Evidence Profile')">-->
              <b-modal
                id="modal-stage-two"
                ref="modal-stage-two"
                v-bind:title="$t('Evidence profile')"
                scrollable
                @ok="saveStageOneAndTwo">
                <b-form-group
                  id="label-finding"
                  v-bind:label="$t('Finding')"
                  label-for="input-finding">
                  <b-form-input
                    id="input-finding"
                    type="text"
                    v-model="buffer_modal_stage_one.name"
                    required
                    v-bind:placeholder="$t('Enter a finding')"></b-form-input>
                </b-form-group>
                <h6>{{$t('Methodological Limitations')}}</h6>
                <b-form-radio-group
                  v-model="buffer_modal_stage_two.methodological_limitations.option"
                  :options="select_options"
                  name="methodological-limitations"
                  stacked></b-form-radio-group>
                <b-form-group
                  v-bind:label="$t('Explanation')"
                  label-for="input-ml-explanation">
                  <b-form-textarea
                    id="input-ml-explanation"
                    v-model="buffer_modal_stage_two.methodological_limitations.explanation"
                    v-bind:placeholder="$t('Enter an explanation')"></b-form-textarea>
                </b-form-group>
                <!-- coherence -->
                <h6>{{$t('Coherence')}}</h6>
                <b-form-radio-group
                  v-model="buffer_modal_stage_two.coherence.option"
                  :options="select_options"
                  name="coherence"
                  stacked></b-form-radio-group>
                <b-form-group
                  v-bind:label="$t('Explanation')"
                  label-for="input-coherence-explanation">
                  <b-form-textarea
                    id="input-coherence-explanation"
                    v-model="buffer_modal_stage_two.coherence.explanation"
                    v-bind:placeholder="$t('Enter an explanation')"></b-form-textarea>
                </b-form-group>
                <!-- adequacy -->
                <h6>{{$t('Adequacy')}}</h6>
                <b-form-radio-group
                  v-model="buffer_modal_stage_two.adequacy.option"
                  :options="select_options"
                  name="adequacy"
                  stacked></b-form-radio-group>
                <b-form-group
                  v-bind:label="$t('Explanation')"
                  label-for="input-adequacy-explanation">
                  <b-form-textarea
                    id="input-adequacy-explanation"
                    v-model="buffer_modal_stage_two.adequacy.explanation"
                    placeholder="Enter an explanation"></b-form-textarea>
                </b-form-group>
                <!-- relevance -->
                <h6>{{$t('Relevance')}}</h6>
                <b-form-radio-group
                  v-model="buffer_modal_stage_two.relevance.option"
                  :options="select_options"
                  name="relevance"
                  stacked></b-form-radio-group>
                <b-form-group
                  v-bind:label="$t('Explanation')"
                  label-for="input-relevance-explanation">
                  <b-form-textarea
                    id="input-relevance-explanation"
                    v-model="buffer_modal_stage_two.relevance.explanation"
                    placeholder="Enter an explanation"></b-form-textarea>
                </b-form-group>
                <!-- CERQual assessment -->
                <h6>{{$t('CERQual Assessment of Confidence')}}</h6>
                <b-form-radio-group
                  v-model="cerqual.cerqual_assessment.option"
                  :options="select_options"
                  name="cerqual_assessment"
                  stacked></b-form-radio-group>
                <b-form-group
                  v-bind:label="$t('Explanation')"
                  label-for="input-cerqual-assessment">
                  <b-form-textarea
                    id="input-cerqual-assessment"
                    v-model="cerqual.cerqual_assessment.explanation"
                    placeholder="Enter an explanation"></b-form-textarea>
                </b-form-group>
                <!-- Explanation of CERQual assessment -->
                <h6>{{$t('Explanation of CERQual Assessment')}}</h6>
                <b-form-radio-group
                  v-model="cerqual.cerqual_explanation.option"
                  :options="select_options"
                  name="cerqual_explanation"
                  stacked></b-form-radio-group>
                <b-form-group
                  v-bind:label="$t('Explanation')"
                  label-for="input-explanation-cerqual-assessment">
                  <b-form-textarea
                    id="input-explanation-cerqual-assessment"
                    v-model="cerqual.cerqual_explanation.explanation"
                    placeholder="Enter an explanation"></b-form-textarea>
                </b-form-group>
              </b-modal>
              <template v-if="evidence_profile.length">
                <b-table
                  responsive striped caption-top
                  :fields="evidence_profile_fields"
                  :items="evidence_profile"
                  :filter="evidence_profile_table_settings.filter"
                  :per-page="evidence_profile_table_settings.perPage">
                  <template slot="finding" slot-scope="data">
                    {{data.item.name}}
                  </template>
                  <template slot="methodological-limit" slot-scope="data">
                    <div v-if="data.item.methodological_limitations.option !== null">
                      <p>{{select_options[data.item.methodological_limitations.option].text}}</p>
                      <p v-if="data.item.methodological_limitations.explanation">Explanation: {{data.item.methodological_limitations.explanation}}</p>
                    </div>
                    <div v-else><i>Assessment not completed</i></div>
                  </template>
                  <template slot="coherence" slot-scope="data">
                    <div v-if="data.item.coherence.option !== null">
                      <p>{{select_options[data.item.coherence.option].text}}</p>
                      <p v-if="data.item.coherence.explanation">Explanation: {{data.item.coherence.explanation}}</p>
                    </div>
                    <div v-else><i>Assessment not completed</i></div>
                  </template>
                  <template slot="adequacy" slot-scope="data">
                    <div v-if="data.item.adequacy.option !== null">
                      <p>{{select_options[data.item.adequacy.option].text}}</p>
                      <p v-if="data.item.adequacy.explanation">Explanation: {{data.item.adequacy.explanation}}</p>
                    </div>
                    <div v-else><i>Assessment not completed</i></div>
                  </template>
                  <template slot="relevance" slot-scope="data">
                    <div v-if="data.item.relevance.option !== null">
                      <p>{{select_options[data.item.relevance.option].text}}</p>
                      <p v-if="data.item.relevance.explanation">Explanation: {{data.item.relevance.explanation}}</p>
                    </div>
                    <div v-else><i>Assessment not completed</i></div>
                  </template>
                  <template slot="actions" slot-scope="data">
                    <font-awesome-icon icon="trash" pull="right" title="Remove" />
                    <font-awesome-icon icon="edit" pull="right" title="Edit" @click="editStageTwo(data.item)" />
                  </template>
                </b-table>
              </template>
              <template v-else>
                <div class="text-center my-5">
                  <p>
                    {{ $t('No evidence profile has been created') }} <b-link v-b-modal.modal-stage-two>{{ $t('add a evidence profile') }}</b-link>
                  </p>
                </div>
              </template>
              <!-- end of Evidence Profile-->
            <!--</b-tab>-->
            <!-- Characteristics of Studies -->
            <!--<b-tab v-bind:title="$t('Characteristics of Studies')">-->
            <div v-if="show.selected.includes('cs')">
              <h3>{{$t('Characteristics of Studies')}}</h3>
              <!-- create study tables -->
              <b-modal
                title="Add fields"
                ref="modal-stage-three-create-fields"
                @ok="saveStageThreeCreateFields">
                <b-form-group
                  id="nro-of-fields"
                  label="Nro of fields"
                  label-for="number-of-fields">
                  <b-form-input
                    id="number-of-fields"
                    type="number"
                    v-model="modal_stage_three_create_fields.nro_of_fields"></b-form-input>
                  </b-form-group>
                <b-form-group
                  v-for="item in parseInt(modal_stage_three_create_fields.nro_of_fields)"
                  :key="item"
                  :label="`Column name #${item}`"
                  :label-for="`field-${item}`">
                  <b-form-input
                  :id="`field-${item}`"
                  type="text"
                  v-model="modal_stage_three_create_fields.fields[item - 1]"></b-form-input>
                  </b-form-group>
              </b-modal>
              <!-- end of create study tables -->
              <!-- modal edit fields -->
              <b-modal
                title="Edit fields"
                ref="modal-stage-three-edit-fields"
                @ok="saveStageThreeUpdateFields"
                @cancel="cancelModalStageThreeFields">
                <b-form-group
                  v-for="(item, index) in modal_stage_three_edit_fields"
                  :key="index"
                  :label="`Column #${index}`"
                  :label-for="`field-${index}`">
                  <b-input-group>
                    <b-form-input
                      :id="`field-${index}`"
                      type="text"
                      v-model="item.label"></b-form-input>
                    <b-input-group-append
                      v-if="modal_stage_three_edit_fields.length > 1">
                      <b-button
                        @click="removeFieldStageThree(item, index)">
                        <font-awesome-icon
                          icon="trash"></font-awesome-icon>
                      </b-button>
                    </b-input-group-append>
                  </b-input-group>
                </b-form-group>
                <b-button
                  variant="outline-success"
                  @click="addNewColumnStageThree">Add column</b-button>
              </b-modal>
              <!-- end of modal edit fields -->
              <!-- drop table -->
              <b-modal
                title="Drop table"
                ref="modal-stage-three-drop-table"
                @ok="stageThreeDropTable">
                <p>This action will remove all the data. Are you sure?</p>
              </b-modal>
              <!-- drop table -->
              <template v-if="characteristics_studies.fields.length">
                <bc-filters :tableSettings="characteristics_studies_table_settings"></bc-filters>
                <bc-action-table
                  :dropAction="openModalStageThreeDropTable"
                  :editAction="openModalStageThreeEditFields"
                  :addAction="openModalStageThreeAddData"></bc-action-table>
                <b-table
                  responsive striped caption-top
                  :fields="characteristics_studies.fields"
                  :items="characteristics_studies.data"
                  :filter="characteristics_studies_table_settings.filter"
                  :per-page="characteristics_studies_table_settings.perPage"
                  class="mb-5">
                  <template slot="actions" slot-scope="row">
                    <font-awesome-icon
                      @click="modalDeleteStageThreeItemData(row)"
                      icon="trash"
                      title="Remove"/>
                    <font-awesome-icon
                      @click="openModalStageThreEditData(row)"
                      icon="edit"
                      title="Edit" />
                  </template>
                </b-table>
                <b-pagination
                  class="mt-5"
                  align="center"
                  v-model="characteristics_studies_table_settings.currentPage"
                  :per-page="characteristics_studies_table_settings.perPage"
                  :total-rows="characteristics_studies.data.length"
                  limit="11"></b-pagination>
              </template>
              <template v-else>
                <div class="text-center my-5" v-if="!characteristics_studies.id">
                  <p>{{ $t('No studies') }} <b-link @click="openModalStageThreeCreateFields">{{ $t('add studies') }}</b-link></p>
                </div>
                <div class="text-center my-5" v-else>
                  <p>{{ $t('No studies') }} <b-link @click="openModalStageThreeEditFields">{{ $t('add studies') }}</b-link></p>
                </div>
              </template>
              <!-- create study data -->
              <b-modal
                title="Add data"
                ref="modal-stage-three-add-data"
                @ok="saveStageThreeCreateData">
                <b-form-group
                  v-for="(item, index) in buffer_characteristics_studies.fields"
                  :key="index"
                  :label="`${item.label}`"
                  :label-for="`data-${index}`">
                  <b-form-textarea
                    :id="`data-${index}`"
                    row="3"
                    v-model="modal_stage_three_data[item.key]"></b-form-textarea>
                </b-form-group>
              </b-modal>
              <!-- end of create study data -->
              <b-modal
                ref="modal-stage-three-edit-data"
                @ok="saveStageThreeEditedData">
                <b-form-group
                  v-for="(item, index) in buffer_characteristics_studies.fields"
                  :key="index"
                  :label="`${item.label}`"
                  :label-for="`data-${index}`">
                  <b-form-textarea
                    :id="`data-${index}`"
                    row="3"
                    v-model="modal_stage_three_data[item.key]"></b-form-textarea>
                </b-form-group>
              </b-modal>
              <b-modal
                title="Remove a row"
                @ok="removeStageThreeItemData"
                ref="modal-stage-three-remove-data"
                scrollable
                size="lg">
                <p>Are you sure you wanna remove this row?</p>
                <b-table
                  responsive
                  :fields="buffer_modal_stage_three.fields"
                  :items="buffer_modal_stage_three.data"
                  class="mb-5">
                </b-table>
              </b-modal>
            </div>
            <!--</b-tab>-->
            <!-- Methodological Assessments -->
            <!--<b-tab v-bind:title="$t('Methodological Assessments')">-->
            <div v-if="show.selected.includes('ma')">
              <h3>{{$t('Methodological Assessments')}}</h3>
              <b-modal
                title="Add Fields"
                ref="modal-stage-four-table"
                @ok="saveStageFourModalField">
                <b-form-group
                  :label="$t('Nro of cols')"
                  label-for="input-nro-cols">
                  <b-form-input
                    id="input-nro-cols"
                    type="number"
                    min="1"
                    max="30"
                    v-model="buffer_stage_four.nroOfColumns"
                    :placeholder="$t('A number between')"></b-form-input>
                </b-form-group>
                <!-- -->
                <b-form-group
                  v-for="item in parseInt(buffer_stage_four.nroOfColumns)"
                  :key="item"
                  :label="$t('Title of column', [item])"
                  :label-for="`input-column-nro-${item}`">
                  <b-form-input
                    :id="`input-column-nro-${item}`"
                    type="text"
                    :placeholder="$t('Title of column', [item])"
                    v-model="buffer_stage_four.fields[item - 1]"></b-form-input>
                </b-form-group>
                <!-- -->
              </b-modal>
              <b-modal
                ref="modal-edit-fields-stage-four"
                title="Edit Fields"
                @ok="updateFieldsStageFour">
                <b-form-group
                  v-for="(item, key) in buffer_modal_stage_four_fields.length"
                  :key="key"
                  :label="`Column #${key}`"
                  :label-for="`column-${key}`">
                  <b-input-group>
                    <b-form-input
                      :id="`column-${key}`"
                      v-model="buffer_modal_stage_four_fields[key].label"></b-form-input>
                      <b-input-group-append
                        v-if="buffer_modal_stage_four_fields.length > 1">
                        <b-button
                          @click="removeFieldStageFour(key)">
                          <font-awesome-icon
                            icon="trash"></font-awesome-icon>
                        </b-button>
                      </b-input-group-append>
                  </b-input-group>
                </b-form-group>
                <b-button
                  variant="outline-success"
                  @click="addColumnStageFour">
                  Add column
                </b-button>
              </b-modal>
              <b-modal
                id="open-modal-stage-four-drop-table"
                ref="open-modal-stage-four-drop-table"
                title="Drop table"
                @ok="stageFourDropTable">
                <p>This action will remove all the data. Are you sure?</p>
              </b-modal>
              <template v-if="stage_four.fields.length">
                <bc-filters :tableSettings="methodological_assessments_table_settings"></bc-filters>
                <bc-action-table
                  :dropAction="dropDatabaseStageFour"
                  :editAction="editFieldsModalStageFour"
                  :addAction="stageFourAddData"></bc-action-table>
                <b-table
                  responsive striped caption-top
                  :fields="stage_four.fields"
                  :items="stage_four.data"
                  :per-page="methodological_assessments_table_settings.perPage"
                  :filter="methodological_assessments_table_settings.filter">
                  <template slot="actions" slot-scope="row">
                    <font-awesome-icon icon="trash" @click="openModalRemoveDataStageFour(row)" :title="$t('Remove')" />
                    <font-awesome-icon icon="edit" @click="openModalEditDataStageFour(row)" :title="$t('Edit')" />
                  </template>
                </b-table>
                <b-pagination
                  class="mt-5"
                  align="center"
                  v-model="methodological_assessments_table_settings.currentPage"
                  :per-page="methodological_assessments_table_settings.perPage"
                  :total-rows="stage_four.data.length"
                  limit="11"></b-pagination>
                <!-- create -->
                <b-modal
                  title="Add data"
                  id="modal-stage-four-data"
                  ref="modal-stage-four-data"
                  @ok="saveDataStageFour">
                  <b-form-group
                    v-for="(field, index) in buffer_stage_four_data.fields"
                    :key="index"
                    :id="`label-field-${index}`"
                    :label="`${field.label}`"
                    :label-for="`input-field-${index}`">
                    <b-form-textarea
                      :id="`input-field-${index}`"
                      v-model="modal_stage_four_data[field.key]"></b-form-textarea>
                  </b-form-group>
                </b-modal>
                <b-modal
                  ref="modal-edit-data-stage-four"
                  title="Edit data"
                  @ok="saveUpdateDataStageFour">
                  <b-form-group
                    v-for="(field, index) in buffer_modal_stage_four_fields"
                    :key="index"
                    :label="`${field.label}`"
                    :label-for="`column-${index}`">
                    <b-form-textarea
                      :id="`column-${index}`"
                      v-model="modal_stage_four_data[field.key]"></b-form-textarea>
                  </b-form-group>
                </b-modal>
                <b-modal
                  @ok="removeDataStageFour"
                  ref="modal-remove-data-stage-four"
                  title="Remove item"
                  scrollable
                  size="lg">
                  <p>Are you sure you wanna remove this row?</p>
                  <b-table
                    :fields="buffer_stage_four_remove_item.fields"
                    :items="buffer_stage_four_remove_item.items"></b-table>
                </b-modal>
                <!-- end of -->
              </template>
              <template v-else>
                <div class="text-center my-5">
                  <p>{{ $t('No methodological') }} <b-link @click="stageFourOpenModalFields">{{ $t('add methodological assessments') }}</b-link></p>
                </div>
              </template>
            </div>
            <!--</b-tab>-->
            <!-- Extracted data -->
            <!--<b-tab v-bind:title="$t('Extracted Data')">-->
            <div v-if="show.selected.includes('ed')">
              <h3>{{$t('Extracted Data')}}</h3>
              <b-modal
                title="Import TSV"
                id="modal-stage-five-import"
                scrollable
                size="lg"
                @ok="saveImportedDataStageFive">
                <b-form-group
                  label="Paste your TSV file">
                  <b-form-textarea
                    placeholder="Paste your TSV file"
                    rows="3"
                    v-model="csvImport"></b-form-textarea>
                </b-form-group>
                <div v-if="stage_five_imported_data.fields.length">
                  <h5>Preview</h5>
                  <b-table
                    :fields="stage_five_imported_data.fields"
                    :items="stage_five_imported_data.items"></b-table>
                </div>
              </b-modal>
              <b-modal
                title="Add columns"
                id="modal-stage-five-table"
                ref="modal-stage-five-table">
                <b-form-group
                  :label="$t('Nro of cols')"
                  label-for="input-nro-cols">
                  <b-form-input
                    id="input-nro-cols"
                    type="number"
                    min="1"
                    max="10"
                    v-model="extracted_data.fields.length"
                    :placeholder="$t('A number between')"></b-form-input>
                </b-form-group>

                <!-- -->
                <b-form-group
                  v-for="(item, index) in extracted_data.fields.length"
                  :key="index"
                  :label="$t('Title of column', [index])"
                  :label-for="`input-column-nro-${index}`">
                  <b-form-input
                    :id="`input-column-nro-${index}`"
                    type="text"
                    :placeholder="$t('Title of column', [index])"
                    v-model="extracted_data.fields[index].label"></b-form-input>
                </b-form-group>
                <!-- -->
              </b-modal>
              <b-modal
                id="modal-stage-five-edit-columns"
                ref="modal-stage-five-edit-columns"
                title="Edit columns"
                @ok="updateStageFiveEditColumns"
                @cancel="cancelModalStageFiveEditColumns">
                <b-form-group
                  v-for="(item, index) in buffer_extracted_data.fields.length"
                  :key="index"
                  :label="$t('Title of column', [index])"
                  :label-for="`input-column-nro-${index}`">
                  <b-input-group>
                    <b-form-input
                      :id="`input-column-nro-${index}`"
                      type="text"
                      :placeholder="$t('Title of column', [index])"
                      v-model="buffer_extracted_data.fields[index].label"></b-form-input>
                    <b-input-group-append
                      v-if="buffer_extracted_data.fields.length > 1">
                      <b-button
                        @click="removeFieldStageFive(index)">
                        <font-awesome-icon
                          icon="trash"></font-awesome-icon>
                      </b-button>
                    </b-input-group-append>
                  </b-input-group>
                </b-form-group>
                <b-button
                  variant="outline-success"
                  @click="addColumnStageFive">Add column</b-button>
              </b-modal>
              <b-modal
                title="Drop table"
                ref="modal-stage-five-drop-table"
                id="modal-stage-five-drop-table"
                @ok="stageFiveDropTable">
                <p>This action will remove all the data. Are you sure?</p>
              </b-modal>
              <template v-if="extracted_data.fields.length">
                <bc-filters :tableSettings="extracted_data_table_settings"></bc-filters>
                <bc-action-table
                  :dropAction="dropDatabaseStageFive"
                  :editAction="openModalStageFiveEditColumns"
                  :addAction="openModalStageFiveAddDataItem"></bc-action-table>
                <b-table
                  responsive striped caption-top
                  :filter="extracted_data_table_settings.filter"
                  :fields="extracted_data.fields"
                  :items="extracted_data.items"
                  :per-page="extracted_data_table_settings.perPage"
                  :current-page="extracted_data_table_settings.currentPage">
                  <template slot="actions" slot-scope="data">
                    <font-awesome-icon
                      icon="trash"
                      @click="openModalStageFiveRemoveDataItem(data)"
                      :title="$t('Remove')" />
                    <font-awesome-icon
                      icon="edit"
                      @click="openModalStageFiveEditDataItem(data)"
                      :title="$t('Edit')" />
                  </template>
                </b-table>
                <b-pagination
                  class="mt-5"
                  align="center"
                  v-model="extracted_data_table_settings.currentPage"
                  :per-page="extracted_data_table_settings.perPage"
                  :total-rows="extracted_data.items.length"
                  limit="11"></b-pagination>
                <b-modal
                  id="modal-stage-five-remove-data-item"
                  ref="modal-stage-five-remove-data-item"
                  title="Remove data item"
                  @ok="stageFiveRemoveDataItem">
                  <p>Are you sure you wanna remove this row?</p>
                </b-modal>
                <!-- create extracted data -->
                <b-modal
                  title="Add data"
                  id="modal-stage-five-data"
                  ref="modal-stage-five-data"
                  @ok="saveDataStageFive">
                  <b-form-group
                    v-for="(field, index) in buffer_extracted_data.fields"
                    :key="index"
                    :id="`label-field-${index}`"
                    :label="`${field.label}`"
                    :label-for="`input-field-${index}`">
                    <b-form-textarea
                      :id="`input-field-${index}`"
                      type="text"
                      v-model="buffer_extracted_data_items[field.key]"></b-form-textarea>
                  </b-form-group>
                </b-modal>
                <!-- end of create extracted data -->
              </template>
              <template v-else>
                <div class="text-center my-5">
                  <p>{{ $t('No extracted data,') }} <!--<b-link v-b-modal.modal-stage-five-table>{{ $t('add extracted data') }}</b-link> or --><b-link v-b-modal.modal-stage-five-import>import a TSV</b-link></p>
                </div>
              </template>
            </div>
            <!--</b-tab>-->
          <!--</b-tabs>-->
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import bCardFilters from '../tableActions/Filters'
import bCardActionTable from '../tableActions/ActionTable'

export default {
  components: {
    'bc-filters': bCardFilters,
    'bc-action-table': bCardActionTable
  },
  data () {
    return {
      /** filters **/
      nroOfRows: 1,
      evidence_profile_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100]
      },
      characteristics_studies_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100],
        last_column: 0
      },
      methodological_assessments_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100]
      },
      extracted_data_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100]
      },
      show: {
        selected: [],
        options: [
          {text: 'Characteristics Studies', value: 'cs'},
          {text: 'Methodological Assessments', value: 'ma'},
          {text: 'Extracted Data', value: 'ed'}
        ]
      },
      /** filters **/
      /** selectors **/
      global_status: [
        { value: false, text: 'public' },
        { value: true, text: 'private' }
      ],
      select_options: [
        {value: 0, text: 'No/Minor concerns'},
        {value: 1, text: 'Minor concerns'},
        {value: 2, text: 'Moderated concerns'},
        {value: 3, text: 'Serious concerns'}
      ],
      level_confidence: [
        {value: 0, text: 'High confidence'},
        {value: 1, text: 'Moderate confidence'},
        {value: 2, text: 'Low confidence'},
        {value: 3, text: 'Very low confidence'}
      ],
      /** selectors **/
      /** tables fields **/
      soqf_fields: [
        {key: 'id', label: 'ID'},
        {key: 'name', label: 'Finding'},
        {key: 'cerqual', label: 'CERQual Assessment of Confidence'},
        {key: 'cerqual_explanation', label: 'Explanation of CERQual Assessment'},
        {key: 'actions', label: 'Actions'}
      ],
      evidence_profile_fields: [
        {key: 'name', label: 'Finding'},
        {key: 'methodological-limit', label: 'Methodological limitations'},
        {key: 'coherence', label: 'Coherence'},
        {key: 'adequacy', label: 'Adequacy'},
        {key: 'relevance', label: 'Relevance'},
        {key: 'actions', label: 'Actions'}
      ],
      /** tables fields **/
      initial_modal_stage_one: {
        id: null,
        name: '',
        list_id: '',
        organization: ''
      },
      buffer_modal_stage_one: {
        id: null,
        name: '',
        list_id: '',
        organization: ''
      },
      initial_modal_stage_two: {
        methodological_limitations: {option: null, explanation: ''},
        coherence: {option: null, explanation: ''},
        adequacy: {option: null, explanation: ''},
        relevance: {option: null, explanation: ''},
        cerqual_assessment: {option: null, explanation: ''},
        cerqual_explanation: {option: null, explanation: ''}
      },
      buffer_modal_stage_two: {
        methodological_limitations: {option: null, explanation: ''},
        coherence: {option: null, explanation: ''},
        adequacy: {option: null, explanation: ''},
        relevance: {option: null, explanation: ''},
        cerqual_assessment: {option: null, explanation: ''},
        cerqual_explanation: {option: null, explanation: ''}
      },
      cerqual: {
        cerqual_assessment: {option: null, explanation: ''},
        cerqual_explanation: {option: null, explanation: ''}
      },
      buffer_modal_stage_three: {
        fields: [],
        data: []
      },
      modal_stage_three_create_fields: {
        nro_of_fields: 1,
        fields: []
      },
      modal_stage_three_edit_fields: [],
      buffer_extracted_data: {
        fields: [],
        items: [],
        id: null
      },
      buffer_extracted_data_items: {},
      list: {
        id: '',
        title: '',
        description: '',
        authors: '',
        private: false,
        sources: [],
        extracted_data: {
          fields: [],
          items: []
        }
      },
      buffer_stage_four: {
        nroOfColumns: 1,
        fields: [],
        items: []
      },
      buffer_stage_four_remove_item: {
        fields: [],
        items: []
      },
      buffer_stage_four_data: {
        fields: []
      },
      stage_four: {
        nroOfColumns: 1,
        fields: [],
        items: []
      },
      soqf: {},
      evidence_profile: [],
      characteristics_studies: {
        fields: [],
        items: []
      },
      buffer_characteristics_studies: {},
      modal_stage_three_data: {},
      modal_stage_four_data: {},
      buffer_modal_stage_four_fields: {},
      csvImport: '',
      stage_five_imported_data: {
        fields: [],
        items: []
      },
      extracted_data: {
        id: null,
        fields: [],
        items: []
      }
    }
  },
  watch: {
    csvImport: function () {
      this.stage_five_imported_data.fields = []
      this.stage_five_imported_data.items = []
      let lines = this.csvImport.split('\n')
      for (let cnt in lines) {
        if (cnt < 1) {
          let header = lines[cnt].split('\t')
          for (let h in header) {
            this.stage_five_imported_data.fields.push({key: 'column_' + h, label: header[h]})
          }
        } else {
          let item = lines[cnt].split('\t')
          let e = {}
          for (let i in item) {
            e['column_' + i] = item[i]
          }
          this.stage_five_imported_data.items.push(e)
        }
      }
    }
  },
  mounted () {
    this.getList()
  },
  methods: {
    getList: function () {
      axios.get(`/api/isoqf_lists/${this.$route.params.id}`)
        .then((response) => {
          this.list = {...response.data}
          this.list.sources = []
          this.evidence_profile = []
          this.extracted_data = {
            fields: [],
            items: []
          }
          this.getStageOneData()
          this.getStageThree()
          this.getStageFour()
          this.getStageFive()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    getStageOneData: function () {
      let params = {
        organization: this.list.organization,
        list_id: this.list.id
      }
      axios.get('/api/isoqf_findings', {params})
        .then((response) => {
          if (response.data.length) {
            this.soqf = response.data[0]
          }
          this.evidence_profile = []
          if (this.soqf.hasOwnProperty('evidence_profile')) {
            let evidenceProfile = this.soqf.evidence_profile
            evidenceProfile.name = this.soqf.name
            this.evidence_profile.push(evidenceProfile)
          }
          if (this.soqf.hasOwnProperty('cerqual')) {
            this.cerqual = this.soqf.cerqual
          }
        }).catch((error) => {
          console.log(error)
        })
    },
    saveListName: function () {
      let params = {
        organization: this.list.organization,
        name: this.buffer_modal_stage_one.name,
        cerqual: this.cerqual
      }
      axios.patch(`/api/isoqf_lists/${this.$route.params.id}`, params)
        .then((response) => {
          this.list.name = this.buffer_modal_stage_one.name
          this.buffer_modal_stage_one = this.initial_modal_stage_one
        })
        .catch((error) => {
          console.log(error)
        })
    },
    saveStageOneAndTwo: function () {
      this.buffer_modal_stage_two.name = this.buffer_modal_stage_one.name
      let params = {
        organization: this.list.organization,
        list_id: this.list.id,
        name: this.buffer_modal_stage_one.name,
        evidence_profile: this.buffer_modal_stage_two,
        cerqual: this.cerqual
      }
      if (this.soqf.hasOwnProperty('id')) {
        axios.patch(`/api/isoqf_findings/${this.soqf.id}`, params)
          .then((response) => {
            this.getStageOneData()
            this.saveListName()
          })
          .catch((error) => {
            console.log(error)
          })
      } else {
        axios.post(`/api/isoqf_findings`, params)
          .then((response) => {
            this.getStageOneData()
          })
          .catch((error) => {
            console.log(error)
          })
      }
    },
    editStageTwo: function (data) {
      this.buffer_modal_stage_one.name = data.name
      this.buffer_modal_stage_two = {...data}
      this.$refs['modal-stage-two'].show()
    },
    getStageThree: function () {
      let params = {
        organization: this.list.organization,
        list_id: this.$route.params.id
      }
      axios.get('/api/isoqf_characteristics', {params})
        .then((response) => {
          if (response.data.length) {
            this.characteristics_studies = response.data[0]
            if (response.data[0].fields.length) {
              let fields = JSON.parse(JSON.stringify(response.data[0].fields))
              let lastItem = fields.splice(fields.length - 1, 1)
              this.characteristics_studies.last_column = lastItem[0].key.split('_')[1]
              this.characteristics_studies.fields.push({key: 'actions', label: 'Actions'})
            }
            this.buffer_characteristics_studies = JSON.parse(JSON.stringify(this.characteristics_studies))
            this.buffer_characteristics_studies.fields.splice(this.buffer_characteristics_studies.fields.length - 1, 1)
          }
        })
        .catch((error) => {
          console.log(error)
        })
    },
    openModalStageThreeCreateFields: function () {
      this.$refs['modal-stage-three-create-fields'].show()
    },
    openModalStageThreeEditFields: function () {
      this.modal_stage_three_edit_fields = JSON.parse(JSON.stringify(this.characteristics_studies.fields))
      this.modal_stage_three_edit_fields.splice(this.modal_stage_three_edit_fields.length - 1, 1)
      this.$refs['modal-stage-three-edit-fields'].show()
    },
    saveStageThreeCreateFields: function () {
      let fields = JSON.parse(JSON.stringify(this.modal_stage_three_create_fields.fields))
      let stageThreeFields = JSON.parse(JSON.stringify(this.modal_stage_three_create_fields))
      stageThreeFields.fields = []

      for (let cnt in fields) {
        let objField = {}
        objField.key = 'column_' + cnt
        objField.label = fields[cnt]
        stageThreeFields.fields.push(objField)
      }

      stageThreeFields.organization = this.list.organization
      stageThreeFields.list_id = this.$route.params.id

      axios.post('/api/isoqf_characteristics', stageThreeFields)
        .then((response) => {
          this.modal_stage_three_create_fields = {nro_of_fields: 1, fields: []}
          this.getStageThree()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    saveStageThreeUpdateFields: function () {
      let stageThreeFields = {}

      if (this.buffer_modal_stage_three.data.length && this.buffer_modal_stage_three.fields.length) {
        stageThreeFields.fields = JSON.parse(JSON.stringify(this.buffer_modal_stage_three.fields))
        stageThreeFields.data = JSON.parse(JSON.stringify(this.buffer_modal_stage_three.data))
      } else {
        stageThreeFields.fields = JSON.parse(JSON.stringify(this.modal_stage_three_edit_fields))
      }

      for (let cnt in stageThreeFields.fields) {
        if (stageThreeFields.fields[cnt].label === '') {
          stageThreeFields.fields.splice(cnt, 1)
        }
      }

      stageThreeFields.organization = this.characteristics_studies.organization
      stageThreeFields.list_id = this.characteristics_studies.list_id

      axios.patch(`/api/isoqf_characteristics/${this.characteristics_studies.id}`, stageThreeFields)
        .then((response) => {
          this.buffer_modal_stage_three = {data: [], fields: []}
          this.getStageThree()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    cancelModalStageThreeFields: function () {
      this.buffer_modal_stage_three = {fields: [], data: []}
    },
    removeFieldStageThree: function (field, index) {
      let removedField = JSON.parse(JSON.stringify(field))
      let stageThreeEditFields = JSON.parse(JSON.stringify(this.modal_stage_three_edit_fields))
      let stageThreeData = (this.characteristics_studies.hasOwnProperty('data')) ? JSON.parse(JSON.stringify(this.characteristics_studies.data)) : []

      stageThreeEditFields.splice(index, 1)
      this.buffer_modal_stage_three.fields = stageThreeEditFields
      this.modal_stage_three_edit_fields = stageThreeEditFields

      for (let item of stageThreeData) {
        delete item[removedField.key]
      }
      this.buffer_modal_stage_three.data = stageThreeData
    },
    openModalStageThreeAddData: function () {
      this.$refs['modal-stage-three-add-data'].show()
    },
    saveStageThreeCreateData: function () {
      let stageThreeData = {}

      stageThreeData.data = (this.characteristics_studies.hasOwnProperty('data')) ? JSON.parse(JSON.stringify(this.characteristics_studies.data)) : []
      stageThreeData.data.push(JSON.parse(JSON.stringify(this.modal_stage_three_data)))
      stageThreeData.organization = this.characteristics_studies.organization
      stageThreeData.list_id = this.characteristics_studies.list_id

      axios.patch(`/api/isoqf_characteristics/${this.characteristics_studies.id}`, stageThreeData)
        .then((response) => {
          this.modal_stage_three_data = {}
          this.getStageThree()
        })
    },
    openModalStageThreEditData: function (row) {
      let item = JSON.parse(JSON.stringify(row))
      let index = item.index
      let data = item.item

      this.modal_stage_three_data = data
      this.characteristics_studies.data_index = index
      this.$refs['modal-stage-three-edit-data'].show()
    },
    saveStageThreeEditedData: function () {
      let stageThreeData = {}
      let index = this.characteristics_studies.data_index

      stageThreeData.data = JSON.parse(JSON.stringify(this.characteristics_studies.data))
      delete stageThreeData.data[index]
      stageThreeData.data[index] = this.modal_stage_three_data
      stageThreeData.organization = this.characteristics_studies.organization
      stageThreeData.list_id = this.characteristics_studies.list_id

      axios.patch(`/api/isoqf_characteristics/${this.characteristics_studies.id}`, stageThreeData)
        .then((response) => {
          this.modal_stage_three_data = {}
          delete this.characteristics_studies.data_index
          this.getStageThree()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    modalDeleteStageThreeItemData: function (row) {
      let item = JSON.parse(JSON.stringify(row))
      let index = item.index
      let fields = JSON.parse(JSON.stringify(this.characteristics_studies.fields))

      fields.splice(fields.length - 1, 1)
      this.buffer_modal_stage_three = {fields: [], data: []}
      this.buffer_modal_stage_three.fields = fields
      this.buffer_modal_stage_three.data.push(row.item)
      this.characteristics_studies.data_index = index
      this.$refs['modal-stage-three-remove-data'].show()
    },
    removeStageThreeItemData: function () {
      let data = JSON.parse(JSON.stringify(this.characteristics_studies.data))
      let stageThreeData = {}

      data.splice(this.characteristics_studies.data_index, 1)
      stageThreeData.data = data
      stageThreeData.organization = this.characteristics_studies.organization
      stageThreeData.list_id = this.characteristics_studies.list_id

      axios.patch(`/api/isoqf_characteristics/${this.characteristics_studies.id}`, stageThreeData)
        .then((response) => {
          this.modal_stage_three_data = {}
          delete this.characteristics_studies.data_index
          this.getStageThree()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    addNewColumnStageThree: function () {
      let columnId = 0
      if (this.characteristics_studies.hasOwnProperty('last_column')) {
        columnId = parseInt(this.characteristics_studies.last_column) + 1
      }

      this.modal_stage_three_edit_fields.push({key: 'column_' + columnId, label: ''})
      this.characteristics_studies.last_column = columnId
    },
    openModalStageThreeDropTable: function () {
      this.$refs['modal-stage-three-drop-table'].show()
    },
    stageThreeDropTable: function () {
      axios.delete(`/api/isoqf_characteristics/${this.characteristics_studies.id}`)
        .then((response) => {
          this.characteristics_studies = {fields: [], items: []}
          this.getStageThree()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    getStageFour: function () {
      let params = {
        organization: this.list.organization,
        list_id: this.$route.params.id
      }
      axios.get('/api/isoqf_assessments', {params})
        .then((response) => {
          this.stage_four = {nroOfColumns: 1, fields: [], items: []}
          if (response.data.length) {
            this.stage_four = JSON.parse(JSON.stringify(response.data[0]))
            if (this.stage_four.fields.length) {
              this.stage_four.fields.push({key: 'actions', label: 'Actions'})
            }
          }
        })
        .catch((error) => {
          console.log(error)
        })
    },
    stageFourOpenModalFields: function () {
      this.$refs['modal-stage-four-table'].show()
    },
    saveStageFourModalField: function () {
      let bufferStageFourFields = JSON.parse(JSON.stringify(this.buffer_stage_four.fields))
      let params = {}

      params.organization = this.list.organization
      params.list_id = this.$route.params.id
      params.fields = []

      for (let cnt in bufferStageFourFields) {
        params.fields.push({key: 'column_' + cnt, label: bufferStageFourFields[cnt]})
      }
      params.nroOfColumns = params.fields.length
      axios.post('/api/isoqf_assessments', params)
        .then((response) => {
          this.buffer_stage_four = {fields: [], items: [], nroOfColumns: 1}
          this.getStageFour()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    stageFourAddData: function () {
      let tmpStageFourFields = JSON.parse(JSON.stringify(this.stage_four.fields))
      tmpStageFourFields.splice(tmpStageFourFields.length - 1, 1)
      this.buffer_stage_four_data.fields = tmpStageFourFields

      this.$refs['modal-stage-four-data'].show()
    },
    saveDataStageFour: function () {
      let params = {}
      params = JSON.parse(JSON.stringify(this.stage_four))
      params.fields.splice(params.fields.length - 1, 1)
      if (params.hasOwnProperty('data')) {
        params.data.push(this.modal_stage_four_data)
      } else {
        params.data = []
        params.data.push(this.modal_stage_four_data)
      }

      axios.patch(`/api/isoqf_assessments/${this.stage_four.id}`, params)
        .then((response) => {
          this.modal_stage_four_data = {}
          this.getStageFour()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    dropDatabaseStageFour: function () {
      this.$refs['open-modal-stage-four-drop-table'].show()
    },
    editFieldsModalStageFour: function () {
      let tmpStageFourFields = JSON.parse(JSON.stringify(this.stage_four.fields))
      tmpStageFourFields.splice(tmpStageFourFields.length - 1, 1)
      this.buffer_modal_stage_four_fields = tmpStageFourFields
      this.$refs['modal-edit-fields-stage-four'].show()
    },
    updateFieldsStageFour: function () {
      let tmpFields = JSON.parse(JSON.stringify(this.buffer_modal_stage_four_fields))
      let tmpStageFour = JSON.parse(JSON.stringify(this.stage_four))
      tmpStageFour.fields.splice(tmpStageFour.fields.length - 1, 1)

      if (tmpStageFour.hasOwnProperty('data')) {
        if (tmpStageFour.data.length) {
          let oldFields = []
          let newFields = []
          for (let item of tmpStageFour.fields) {
            oldFields.push(item.key)
          }
          for (let item of tmpFields) {
            newFields.push(item.key)
          }
          for (let i in oldFields) {
            if (!newFields.includes(oldFields[i])) {
              for (let item of tmpStageFour.data) {
                delete item[oldFields[i]]
              }
            }
          }
        }
      }
      tmpStageFour.fields = tmpFields
      axios.patch(`/api/isoqf_assessments/${this.stage_four.id}`, tmpStageFour)
        .then((response) => {
          this.buffer_modal_stage_four_fields = {}
          this.getStageFour()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    openModalEditDataStageFour: function (row) {
      let tmpFields = JSON.parse(JSON.stringify(this.stage_four.fields))
      let tmpData = JSON.parse(JSON.stringify(this.stage_four.data))

      tmpFields.splice(tmpFields.length - 1, 1)
      this.buffer_modal_stage_four_fields = tmpFields
      this.modal_stage_four_data = tmpData.splice(row.index, 1)[0]
      this.buffer_stage_four.key_item = row.index
      this.$refs['modal-edit-data-stage-four'].show()
    },
    saveUpdateDataStageFour: function () {
      let tmpData = JSON.parse(JSON.stringify(this.modal_stage_four_data))
      let tmpStageFour = JSON.parse(JSON.stringify(this.stage_four))

      tmpStageFour.fields.splice(tmpStageFour.fields.length - 1, 1)
      tmpStageFour.data[this.buffer_stage_four.key_item] = tmpData
      axios.patch(`/api/isoqf_assessments/${this.stage_four.id}`, tmpStageFour)
        .then((response) => {
          delete this.buffer_stage_four.key_item
          this.$refs['modal-edit-data-stage-four'].hide()
          this.modal_stage_four_data = {}
          this.getStageFour()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    openModalRemoveDataStageFour: function (row) {
      let tmpStageFour = JSON.parse(JSON.stringify(this.stage_four))
      tmpStageFour.fields.splice(tmpStageFour.fields.length - 1, 1)
      this.buffer_stage_four_remove_item.fields = tmpStageFour.fields
      this.buffer_stage_four_remove_item.items = []
      this.buffer_stage_four_remove_item.items.push(tmpStageFour.data[row.index])
      this.buffer_stage_four_remove_item.key_item = row.index
      this.$refs['modal-remove-data-stage-four'].show()
    },
    removeDataStageFour: function () {
      let tmpStageFour = JSON.parse(JSON.stringify(this.stage_four))

      tmpStageFour.fields.splice(tmpStageFour.fields.length - 1, 1)
      tmpStageFour.data.splice(this.buffer_stage_four_remove_item.key_item, 1)
      axios.patch(`/api/isoqf_assessments/${this.stage_four.id}`, tmpStageFour)
        .then((response) => {
          this.buffer_stage_four_remove_item = {fields: [], items: []}
          this.getStageFour()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    removeFieldStageFour: function (key) {
      this.buffer_modal_stage_four_fields.splice(key, 1)
    },
    addColumnStageFour: function () {
      let tmpFields = JSON.parse(JSON.stringify(this.buffer_modal_stage_four_fields))
      let lastItem = tmpFields.splice(tmpFields.length - 1, 1)[0]
      let lastId = parseInt(lastItem.key.split('_')[1]) + 1
      this.buffer_modal_stage_four_fields.push({key: 'column_' + lastId, label: ''})
    },
    stageFourDropTable: function () {
      axios.delete(`/api/isoqf_assessments/${this.stage_four.id}`)
        .then((response) => {
          this.getStageFour()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    getStageFive: function () {
      let params = {
        organization: this.list.organization,
        list_id: this.$route.params.id
      }
      axios.get('/api/isoqf_extracted_data', {params})
        .then((response) => {
          this.extracted_data = {id: null, fields: [], items: []}
          if (response.data.length) {
            this.extracted_data = response.data[0]
            delete this.extracted_data.organization
            delete this.extracted_data.list_id
            this.extracted_data.fields.push({key: 'actions', label: 'Actions'})
          }
        })
        .catch((error) => {
          console.log(error)
        })
    },
    saveImportedDataStageFive: function () {
      let params = {
        organization: this.list.organization,
        list_id: this.$route.params.id,
        fields: this.stage_five_imported_data.fields,
        items: this.stage_five_imported_data.items
      }

      axios.post('/api/isoqf_extracted_data', params)
        .then((response) => {
          this.stage_five_imported_data = {fields: [], items: []}
          this.getStageFive()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    saveDataStageFive: function () {
      let items = JSON.parse(JSON.stringify(this.extracted_data.items))
      if (this.extracted_data.hasOwnProperty('edit_index_item')) {
        items[this.extracted_data.edit_index_item] = this.buffer_extracted_data_items
      } else {
        items.push(this.buffer_extracted_data_items)
      }

      let params = {
        organization: this.list.organization,
        list_id: this.$route.params.id,
        items: items
      }
      axios.patch(`/api/isoqf_extracted_data/${this.extracted_data.id}`, params)
        .then((response) => {
          this.getStageFive()
          this.buffer_extracted_data = {fields: [], items: [], id: null}
          this.buffer_extracted_data_items = {}
        })
        .catch((error) => {
          console.log(error)
        })
    },
    stageFiveDropTable: function () {
      axios.delete(`/api/isoqf_extracted_data/${this.extracted_data.id}`)
        .then((response) => {
          this.getStageFive()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    addColumnStageFive: function () {
      let id = 0
      if (this.buffer_extracted_data.fields.length) {
        let tmpBufferExtractedData = JSON.parse(JSON.stringify(this.buffer_extracted_data))
        let tempItem = tmpBufferExtractedData.fields.splice(tmpBufferExtractedData.fields.length - 1, 1)
        id = parseInt(tempItem[0].key.split('_')[1]) + 1
      }
      this.buffer_extracted_data.fields.push({key: 'column_' + id, label: ''})
    },
    cancelModalStageFiveEditColumns: function () {
      this.buffer_extracted_data = {fields: [], items: [], id: null}
    },
    dropDatabaseStageFive: function () {
      this.$refs['modal-stage-five-drop-table'].show()
    },
    openModalStageFiveEditColumns: function () {
      this.buffer_extracted_data = JSON.parse(JSON.stringify(this.extracted_data))
      this.buffer_extracted_data.fields.splice(this.buffer_extracted_data.fields.length - 1, 1)
      this.$refs['modal-stage-five-edit-columns'].show()
    },
    updateStageFiveEditColumns: function () {
      let params = {
        fields: this.buffer_extracted_data.fields,
        items: this.buffer_extracted_data.items || []
      }
      axios.patch(`/api/isoqf_extracted_data/${this.extracted_data.id}`, params)
        .then((response) => {
          this.getStageFive()
          this.buffer_extracted_data = {fields: [], items: [], id: null}
        })
        .catch((error) => {
          console.log(error)
        })
    },
    removeFieldStageFive: function (index) {
      let tmpKey = this.buffer_extracted_data.fields[index].key
      this.buffer_extracted_data.fields.splice(index, 1)
      if (this.buffer_extracted_data.items.length) {
        for (let item of this.buffer_extracted_data.items) {
          delete item[tmpKey]
        }
      }
    },
    openModalStageFiveRemoveDataItem: function (data) {
      this.buffer_extracted_data.remove_index_item = data.index
      this.$refs['modal-stage-five-remove-data-item'].show()
    },
    stageFiveRemoveDataItem: function () {
      let items = JSON.parse(JSON.stringify(this.extracted_data.items))
      items.splice(items.length - 1, 1)
      items.splice(this.buffer_extracted_data.remove_index_item, 1)
      axios.patch(`/api/isoqf_extracted_data/${this.extracted_data.id}`, {items: items})
        .then((response) => {
          this.getStageFive()
          delete this.buffer_extracted_data.remove_index_item
        })
        .catch((error) => {
          console.log(error)
        })
    },
    openModalStageFiveAddDataItem: function () {
      this.buffer_extracted_data.fields = JSON.parse(JSON.stringify(this.extracted_data.fields))
      this.buffer_extracted_data.fields.splice(this.buffer_extracted_data.fields.length - 1, 1)
      this.$refs['modal-stage-five-data'].show()
    },
    openModalStageFiveEditDataItem: function (data) {
      this.extracted_data.edit_index_item = data.index
      this.buffer_extracted_data.fields = JSON.parse(JSON.stringify(this.extracted_data.fields))
      this.buffer_extracted_data.fields.splice(this.buffer_extracted_data.fields.length - 1, 1)
      this.buffer_extracted_data_items = JSON.parse(JSON.stringify(this.extracted_data.items[data.index]))
      this.$refs['modal-stage-five-data'].show()
    }
  }
}
</script>

<style>

</style>
