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
      <h2>{{ $t('Edit') }} {{list.name}}</h2>
      <b-row>
        <b-col cols="12">
          <b-form>
            <b-form-group
              id="label-title"
              v-bind:label="$t('Title')"
              label-for="input-title">
              <b-form-input
                id="input-title"
                v-model="list.name"
                type="text"
                required
                v-bind:placeholder="$t('Enter a title')"></b-form-input>
            </b-form-group>
            <b-form-group
              id="label-description"
              v-bind:label="$t('Description')"
              label-for="input-description">
              <b-form-textarea
                id="input-description"
                v-model="list.description"
                type="textarea"
                :placeholder="$t('Enter a description')"></b-form-textarea>
            </b-form-group>
            <b-form-group
              :label="$t('Authors')"
              label-for="input-project-authors">
              <b-form-input
                id="input-project-authors"
                :placeholder="$t('Insert authors separated by commas')"
                v-model="list.authors"></b-form-input>
            </b-form-group>
            <b-form-group
              :label="$t('Visible')"
              label-for="select-project-list-status">
              <b-select
                id="select-project-list-status"
                v-model="list.private"
                :options="global_status"></b-select>
            </b-form-group>
          </b-form>
            <b-tabs>
              <b-tab title="SoQF">
                <!-- <h3>SoQF</h3> -->
                <!-- modal finding -->
                <b-modal id="modal-stage-one" ref="modal-stage-one">
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
                  <div slot="modal-footer">
                    <b-button
                      variant="outline-primary"
                      @click="saveStageOne">{{ $t('Save') }}</b-button>
                  </div>
                </b-modal>
                <template v-if="soqf.length">
                  <b-table
                    striped
                    :fields="soqf_fields"
                    :items="soqf"
                    caption-top
                    :current-page="setting_tables.soqf_list.current_page"
                    :per-page="setting_tables.soqf_list.perPage"
                    :filter="setting_tables.soqf_list.filter"
                    @filtered="onFilterediSoQF">
                    <template slot="table-caption">
                      <div class="text-right">
                        <b-button v-b-modal.modal-stage-one variant="outline-primary">{{ $t('Add new Finding') }}</b-button>
                      </div>
                      <div>
                        <b-form-group
                          label="Search"
                          label-for="filter-input-isoqf-list">
                          <b-form-input
                            id="filter-input-isoqf-list"
                            v-model="setting_tables.soqf_list.filter"></b-form-input>
                        </b-form-group>
                        <b-form-group label-cols-sm="6" label="Per page" class="mb-0">
                          <b-form-select v-model="setting_tables.soqf_list.perPage" :options="setting_tables.soqf_list.pageOptions"></b-form-select>
                        </b-form-group>
                      </div>
                    </template>
                    <template slot="actions">
                      <font-awesome-icon icon="trash" pull="right" v-bind:title="$t('Remove')" style="color: #dc3545" />
                      <font-awesome-icon icon="edit" pull="right" v-bind:title="$t('Edit')" />
                    </template>
                  </b-table>
                  <!-- pagination -->
                  <b-row>
                    <b-col>
                      <b-pagination
                        v-model="setting_tables.soqf_list.current_page"
                        :per-page="setting_tables.soqf_list.perPage"
                        :total-rows="setting_tables.soqf_list.totalRows"></b-pagination>
                    </b-col>
                  </b-row>

                </template>
                <template v-else>
                  <div class="text-center my-5">
                    <p>
                      {{ $t('no isoqf has been created') }} <b-link v-b-modal.modal-stage-one>{{ $t('add a finding') }}</b-link>
                    </p>
                  </div>
                </template>
                <!-- end modal finding -->
              </b-tab>
              <!-- Evidence Profile-->
              <b-tab :title="$t('Evidence Profile')">
                <!-- <h3>{{$t('Evidence Profile')}}</h3> -->
                <b-modal
                  id="modal-stage-two"
                  ref="modal-stage-two"
                  v-bind:title="$t('Evidence profile')"
                  scrollable>
                  <b-form-group
                    :label="$t('Finding')"
                    label-for="input-select-finding">
                    <b-form-select
                      id="input-select-finding"
                      :options="soqf"
                      value-field="id"
                      text-field="name"
                      v-model="buffer_modal_stage_two.finding_id"></b-form-select>
                  </b-form-group>
                  <h6>{{$t('Methodological Limitations')}}</h6>
                  <b-form-checkbox-group
                    v-model="buffer_modal_stage_two.methodological_limitations.option"
                    :options="select_options"
                    name="methodological-limitations"
                    stacked></b-form-checkbox-group>
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
                  <b-form-checkbox-group
                    v-model="buffer_modal_stage_two.coherence.option"
                    :options="select_options"
                    name="coherence"
                    stacked></b-form-checkbox-group>
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
                  <b-form-checkbox-group
                    v-model="buffer_modal_stage_two.adequacy.option"
                    :options="select_options"
                    name="adequacy"
                    stacked></b-form-checkbox-group>
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
                  <b-form-checkbox-group
                    v-model="buffer_modal_stage_two.relevance.option"
                    :options="select_options"
                    name="relevance"
                    stacked></b-form-checkbox-group>
                  <b-form-group
                    v-bind:label="$t('Explanation')"
                    label-for="input-relevance-explanation">
                    <b-form-textarea
                      id="input-relevance-explanation"
                      v-model="buffer_modal_stage_two.relevance.explanation"
                      placeholder="Enter an explanation"></b-form-textarea>
                  </b-form-group>
                  <div slot="modal-footer">
                    <b-button
                      variant="outline-primary"
                      @click="saveStageTwo">{{ $t('Save') }}</b-button>
                  </div>
                </b-modal>
                <template v-if="evidence_profile.length">
                  <b-table
                    responsive striped caption-top
                    :fields="evidence_profile_fields"
                    :items="evidence_profile">
                    <template slot="table-caption">
                      <div class="text-right">
                        <b-button v-b-modal.modal-stage-two variant="outline-primary">Add new element</b-button>
                      </div>
                    </template>
                    <template slot="finding" slot-scope="data">
                      {{data.item.name}}
                    </template>
                    <template slot="methodological-limit" slot-scope="data">
                      <div v-if="data.item.methodological_limitations.option !== null">
                        <p>{{select_options[data.item.methodological_limitations.option].text}}</p>
                        <p>Explanation: {{data.item.methodological_limitations.explanation}}</p>
                      </div>
                      <div v-else><i>No data</i></div>
                    </template>

                    <template slot="coherence" slot-scope="data">
                      <div v-if="data.item.coherence.option !== null">
                        <p>{{select_options[data.item.coherence.option].text}}</p>
                        <p>Explanation: {{data.item.coherence.explanation}}</p>
                      </div>
                      <div v-else><i>No data</i></div>
                    </template>

                    <template slot="adequacy" slot-scope="data">
                      <div v-if="data.item.adequacy.option !== null">
                        <p>{{select_options[data.item.adequacy.option].text}}</p>
                        <p>Explanation: {{data.item.adequacy.explanation}}</p>
                      </div>
                      <div v-else><i>No data</i></div>
                    </template>

                    <template slot="relevance" slot-scope="data">
                      <div v-if="data.item.relevance.option !== null">
                        <p>{{select_options[data.item.relevance.option].text}}</p>
                        <p>Explanation: {{data.item.relevance.explanation}}</p>
                      </div>
                      <div v-else><i>No data</i></div>
                    </template>

                    <template slot="actions" slot-scope="data">
                      <font-awesome-icon icon="trash" pull="right" title="Remove" style="color: #dc3545" />
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
              </b-tab>
              <!-- Characteristics of Studies -->
              <b-tab v-bind:title="$t('Characteristics of Studies')">
                <!-- <h3>{{$t('Characteristics of Studies')}}</h3> -->
                <!-- create study tables -->
                <b-modal
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
                  ref="modal-stage-three-edit-fields"
                  @ok="saveStageThreeUpdateFields">
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
                        v-if="characteristics_studies.fields.length > 2">
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
                <template v-if="characteristics_studies.fields.length">
                  <b-table
                    responsive striped caption-top
                    :fields="characteristics_studies.fields"
                    :items="characteristics_studies.data"
                    class="mb-5">
                    <template slot="table-caption">
                      <div class="text-right">
                        <b-button
                          @click="openModalStageThreeEditFields"
                          variant="outline-primary">
                            <font-awesome-icon icon="table" />
                            Edit table
                        </b-button>
                        <b-button
                          v-if="characteristics_studies.fields.length"
                          @click="openModalStageThreeAddData"
                          variant="outline-success">{{$t('Add data')}}</b-button>
                      </div>
                    </template>
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
                </template>
                <template v-else>
                  <div class="text-center my-5">
                    <p>{{ $t('No studies') }} <b-link @click="openModalStageThreeCreateFields">{{ $t('add studies') }}</b-link></p>
                  </div>
                </template>
                <!-- create study data -->
                <b-modal
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
              </b-tab>
              <!-- Methodological Assessments -->
              <b-tab v-bind:title="$t('Methodological Assessments')">
                <!-- <h3>{{$t('Methodological Assessments')}}</h3> -->
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
                        <b-input-group-append>
                          <b-button
                            @click="removeFieldStageFour(key)">
                            <font-awesome-icon
                              icon="trash"></font-awesome-icon>
                          </b-button>
                        </b-input-group-append>
                    </b-input-group>
                  </b-form-group>
                  <b-button
                    @click="addColumnStageFour">
                    Add column
                  </b-button>
                </b-modal>
                <template v-if="stage_four.fields.length">
                  <b-table
                    responsive striped caption-top
                    :fields="stage_four.fields"
                    :items="stage_four.data">
                    <template slot="table-caption">
                      <div class="text-right">
                        <b-button @click="editFieldsModalStageFour" variant="outline-primary">{{$t('Edit table')}}</b-button>
                        <b-button
                          v-if="stage_four.fields.length"
                          @click="stageFourAddData"
                          variant="outline-success">{{$t('Add data')}}</b-button>
                      </div>
                    </template>
                    <template slot="actions" slot-scope="row">
                      <font-awesome-icon icon="trash" @click="openModalRemoveDataStageFour(row)" :title="$t('Remove')" />
                      <font-awesome-icon icon="edit" @click="openModalEditDataStageFour(row)" :title="$t('Edit')" />
                    </template>
                  </b-table>
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
                      <b-form-input
                        :id="`input-field-${index}`"
                        type="text"
                        v-model="modal_stage_four_data[field.key]"></b-form-input>
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
              </b-tab>
              <!-- Extracted data -->
              <b-tab v-bind:title="$t('Extracted Data')">
                <!-- <h3>{{$t('Extracted Data')}}</h3> -->
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
                  <b-table
                    :fields="stage_five_imported_data.fields"
                    :items="stage_five_imported_data.items"></b-table>
                </b-modal>
                <b-modal
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
                      v-model="nroOfRows"
                      :placeholder="$t('A number between')"></b-form-input>
                  </b-form-group>

                  <!-- -->
                  <b-form-group
                    v-for="item in parseInt(nroOfRows)"
                    :key="item"
                    :label="$t('Title of column', [item])"
                    :label-for="`input-column-nro-${item}`">
                    <b-form-input
                      :id="`input-column-nro-${item}`"
                      type="text"
                      :placeholder="$t('Title of column', [item])"
                      v-model="list.extracted_data.fields[item - 1]"></b-form-input>
                  </b-form-group>
                  <!-- -->
                </b-modal>
                <template v-if="list.extracted_data.fields.length">
                  <b-table
                    responsive striped caption-top
                    :fields="list.extracted_data.fields"
                    :items="list.extracted_data.items">
                    <template slot="table-caption">
                      <div class="text-right">
                        <b-button v-b-modal.modal-stage-five-table variant="outline-primary">{{$t('Edit table')}}</b-button>
                        <b-button
                          v-if="list.extracted_data.fields.length"
                          v-b-modal.modal-stage-five-data
                          variant="outline-success">{{$t('Add data')}}</b-button>
                      </div>
                    </template>
                    <template slot="actions">
                      <font-awesome-icon icon="trash" pull="right" :title="$t('Remove')" style="color: #dc3545" />
                      <font-awesome-icon icon="edit" pull="right" :title="$t('Edit')" />
                    </template>
                  </b-table>
                  <!-- create extracted data -->
                  <b-modal
                    id="modal-stage-five-data"
                    ref="modal-stage-five-data">
                    <b-form-group
                      v-for="(field, index) in list.extracted_data.fields"
                      :key="index"
                      :id="`label-field-${index}`"
                      :label="`${field}`"
                      :label-for="`input-field-${index}`">
                      <b-form-input
                        :id="`input-field-${index}`"
                        type="text"
                        v-model="buffer_extracted_data[field]"></b-form-input>
                    </b-form-group>
                  </b-modal>
                  <!-- end of create extracted data -->
                </template>
                <template v-else>
                  <div class="text-center my-5">
                    <p>{{ $t('No extracted data') }} <b-link v-b-modal.modal-stage-five-table>{{ $t('add extracted data') }}</b-link> or <b-link v-b-modal.modal-stage-five-import>import</b-link></p>
                  </div>
                </template>
              </b-tab>
            </b-tabs>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data () {
    return {
      /** filters **/
      nroOfRows: 1,
      setting_tables: {
        soqf_list: {
          filter: '',
          totalRows: 1,
          currentPage: 1,
          perPage: 10,
          pageOptions: [10, 50, 100]
        },
        evidence_profile_list: {
          filter: '',
          totalRows: 1,
          currentPage: 1,
          perPage: 10,
          pageOptions: [10, 50, 100]
        },
        characteristics_studies_list: {
          filter: '',
          totalRows: 1,
          currentPage: 1,
          perPage: 10,
          pageOptions: [10, 50, 100],
          last_column: 0
        },
        methodological_assessments_list: {
          filter: '',
          totalRows: 1,
          currentPage: 1,
          perPage: 10,
          pageOptions: [10, 50, 100]
        },
        extracted_data_list: {
          filter: '',
          totalRows: 1,
          currentPage: 1,
          perPage: 10,
          pageOptions: [10, 50, 100]
        }
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
        {key: 'finding_id', label: 'ID'},
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
        finding_id: '',
        methodological_limitations: {option: null, explanation: ''},
        coherence: {option: null, explanation: ''},
        adequacy: {option: null, explanation: ''},
        relevance: {option: null, explanation: ''}
      },
      buffer_modal_stage_two: {
        finding_id: '',
        methodological_limitations: {option: null, explanation: ''},
        coherence: {option: null, explanation: ''},
        adequacy: {option: null, explanation: ''},
        relevance: {option: null, explanation: ''}
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
      buffer_extracted_data: {},
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
      soqf: [],
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
      }
    }
  },
  watch: {
    csvImport: function () {
      this.stage_five_imported_data.fields = []
      this.stage_five_imported_data.items = []
      let lines = this.csvImport.split('\n')
      for (let cnt in lines) {
        if (cnt<1) {
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
    this.setting_tables.soqf_list.totalRows = this.soqf.length
    this.getList()
    this.getStageThree()
    this.getStageFour()
  },
  methods: {
    getList: function () {
      axios.get(`/api/isoqf_lists/${this.$route.params.id}`)
        .then((response) => {
          this.list = {...response.data}
          this.list.sources = []
          this.soqf = []
          this.evidence_profile = []
          this.list.extracted_data = {
            fields: [],
            items: []
          }
          this.getStageOneData()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    getStageOneData: function () {
      axios.get('/api/isoqf_findings', {
        params: {
          organization: this.list.organization,
          list_id: this.list.id
        }
      }).then((response) => {
        this.soqf = response.data
        this.evidence_profile = []
        for (let i in this.soqf) {
          if (this.soqf[i].hasOwnProperty('evidence_profile')) {
            let evidenceProfile = this.soqf[i].evidence_profile
            evidenceProfile.name = this.soqf[i].name
            this.evidence_profile.push(evidenceProfile)
          }
        }
      }).catch((error) => {
        console.log(error)
      })
    },
    editStageOne: function () {
      // todo
    },
    saveStageOne: function () {
      this.buffer_modal_stage_one.list_id = this.list.id
      this.buffer_modal_stage_one.organization = this.list.organization
      axios.post('/api/isoqf_findings', this.buffer_modal_stage_one)
        .then((response) => {
          this.getStageOneData()
        })
        .catch((error) => {
          console.log(error)
        })
      // clean
      this.buffer_modal_stage_one = {...this.initial_modal_stage_one}
      // close
      this.$refs['modal-stage-one'].hide()
    },
    editStageTwo: function (data) {
      this.buffer_modal_stage_two = {...data}
      this.$refs['modal-stage-two'].show()
    },
    saveStageTwo: function () {
      // this.evidence_profile.push(this.buffer_modal_stage_two)
      let data = { evidence_profile: this.buffer_modal_stage_two }
      axios.patch(`/api/isoqf_findings/${this.buffer_modal_stage_two.finding_id}`, data)
        .then((response) => {
          // console.log(response.data)
          this.getStageOneData()
        })
        .catch((error) => {
          console.log(error)
        })
      // clean
      this.buffer_modal_stage_two = {...this.initial_modal_stage_two}
      // close
      this.$refs['modal-stage-two'].hide()
    },
    getStageThree: function () {
      let params = {}
      params.organization = this.list.organization
      params.list_id = this.$route.params.id
      axios.get('/api/isoqf_characteristics', params)
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
    removeFieldStageThree: function (field, index) {
      let removedField = JSON.parse(JSON.stringify(field))
      let stageThreeEditFields = JSON.parse(JSON.stringify(this.modal_stage_three_edit_fields))
      let stageThreeData = JSON.parse(JSON.stringify(this.characteristics_studies.data))

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

      stageThreeData.data = JSON.parse(JSON.stringify(this.characteristics_studies.data))
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
      let columnId = parseInt(this.characteristics_studies.last_column) + 1
      this.modal_stage_three_edit_fields.push({key: 'column_' + columnId, label: ''})
      this.characteristics_studies.last_column = columnId
    },
    getStageFour: function () {
      let params = {}
      params.organization = this.list.organization
      params.list_id = this.$route.params.id
      axios.get('/api/isoqf_assessments', params)
        .then((response) => {
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
    saveImportedDataStageFive: function () {
      let params = {}
      params.organization = this.list.organization
      params.list_id = this.$route.params.id
      params.fields = this.stage_five_imported_data.fields
      params.items = this.stage_five_imported_data.items
      axios.post('/api/isoqf_extracted_data', params)
        .then((response) => {
          this.stage_five_imported_data = {fields: [], items: []}
          console.log(response)
        })
        .catch((error) => {
          console.log(error)
        })
    },
    onFilterediSoQF (filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.setting_tables.soqf_list.totalRows = filteredItems.length
      this.setting_tables.soqf_list.currentPage = 1
    }
  }
}
</script>

<style>

</style>
