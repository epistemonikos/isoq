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

            <!-- <b-tabs> -->
              <!-- <b-tab title="SoQF"> -->
                <h3>SoQF</h3>
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
              <!-- </b-tab> -->
              <!-- Evidence Profile-->
              <!-- <b-tab :title="$t('Evidence Profile')"> -->
                <h3>{{$t('Evidence Profile')}}</h3>
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
              <!-- </b-tab> -->
              <!-- Characteristics of Studies -->
              <!-- <b-tab v-bind:title="$t('Characteristics of Studies')"> -->
                <h3>{{$t('Characteristics of Studies')}}</h3>
                <!-- create study tables -->
                <b-modal
                  id="modal-stage-three-table"
                  ref="modal-stage-three-table"
                  @ok="saveStageThree">
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
                      v-model="buffer_characteristics_studies.fields[item - 1]"></b-form-input>
                  </b-form-group>
                  <!-- -->
                </b-modal>
                <!-- end of create study tables -->
                <template v-if="characteristics_studies.fields.length">
                  <b-table
                    responsive striped caption-top
                    :fields="characteristics_studies.fields"
                    :items="characteristics_studies.items"
                    class="mb-5">
                    <template slot="table-caption">
                      <div class="text-right">
                        <b-button @click="openModalStageThreeTable" variant="outline-primary">
                          <font-awesome-icon icon="table" />
                          Edit table
                        </b-button>
                        <b-button
                          v-if="characteristics_studies.fields.length"
                          v-b-modal.modal-stage-three-data
                          variant="outline-success">{{$t('Add data')}}</b-button>
                      </div>
                    </template>
                    <template slot="actions">
                      <font-awesome-icon icon="trash" pull="right" title="Remove" style="color: #dc3545" />
                      <font-awesome-icon icon="edit" pull="right" title="Edit" />
                    </template>
                  </b-table>
                </template>
                <template v-else>
                  <div class="text-center my-5">
                    <p>{{ $t('No studies') }} <b-link v-b-modal.modal-stage-three-table>{{ $t('add studies') }}</b-link></p>
                  </div>
                </template>
                <!-- create study data -->
                <b-modal
                  id="modal-stage-three-data"
                  ref="modal-stage-three-data"
                  @ok="saveStageThree">
                  <b-form-group
                    v-for="(field, index) in characteristics_studies.fields"
                    :key="index"
                    :id="`label-field-${index}`"
                    :label="`${field}`"
                    :label-for="`input-field-${index}`">
                    <b-form-input
                      :id="`input-field-${index}`"
                      type="text"
                      v-model="buffer_characteristics_studies[field]"></b-form-input>
                  </b-form-group>
                </b-modal>
                <!-- end of create study data -->
              <!-- </b-tab> -->
              <!-- Methodological Assessments -->
              <!-- <b-tab v-bind:title="$t('Methodological Assessments')"> -->
                <h3>{{$t('Methodological Assessments')}}</h3>
                <b-modal
                  id="modal-stage-four-table"
                  ref="modal-stage-four-table">
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
                      v-model="list.methodological_assessments.fields[item - 1]"></b-form-input>
                  </b-form-group>
                  <!-- -->
                </b-modal>
                <template v-if="list.methodological_assessments.fields.length">
                  <b-table
                    responsive striped caption-top
                    :fields="list.methodological_assessments.fields"
                    :items="list.methodological_assessments.items">
                    <template slot="table-caption">
                      <div class="text-right">
                        <b-button v-b-modal.modal-stage-four-table variant="outline-primary">{{$t('Edit table')}}</b-button>
                        <b-button
                          v-if="list.methodological_assessments.fields.length"
                          v-b-modal.modal-stage-four-data
                          variant="outline-success">{{$t('Add data')}}</b-button>
                      </div>
                    </template>
                    <template slot="actions">
                      <font-awesome-icon icon="trash" pull="right" :title="$t('Remove')" style="color: #dc3545" />
                      <font-awesome-icon icon="edit" pull="right" :title="$t('Edit')" />
                    </template>
                  </b-table>
                  <!-- create study data -->
                  <b-modal
                    id="modal-stage-four-data"
                    ref="modal-stage-four-data"
                    @ok="copyMethAssessments">
                    <b-form-group
                      v-for="(field, index) in list.methodological_assessments.fields"
                      :key="index"
                      :id="`label-field-${index}`"
                      :label="`${field}`"
                      :label-for="`input-field-${index}`">
                      <b-form-input
                        :id="`input-field-${index}`"
                        type="text"
                        v-model="buffer_methodological_assessments[field]"></b-form-input>
                    </b-form-group>
                  </b-modal>
                  <!-- end of create study data -->
                </template>
                <template v-else>
                  <div class="text-center my-5">
                    <p>{{ $t('No methodological') }} <b-link v-b-modal.modal-stage-four-table>{{ $t('add methodological assessments') }}</b-link></p>
                  </div>
                </template>
              <!-- </b-tab> -->
              <!-- Extracted data -->
              <!-- <b-tab v-bind:title="$t('Extracted Data')"> -->
                <h3>{{$t('Extracted Data')}}</h3>
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
                    ref="modal-stage-five-data"
                    @ok="copyMethAssessments">
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
                    <p>{{ $t('No extracted data') }} <b-link v-b-modal.modal-stage-five-table>{{ $t('add extracted data') }}</b-link></p>
                  </div>
                </template>
              <!-- </b-tab> -->
            <!-- </b-tabs> -->
            <!--
            <b-row align-h="end">
              <b-col cols="12" md="2" class="text-right">
                <b-button type="submit" variant="outline-primary">{{ $t('Save') }}</b-button>
              </b-col>
            </b-row>
            -->
          </b-form>
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
          pageOptions: [10, 50, 100]
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
      buffer_characteristics_studies: {
        fields: [],
        items: []
      },
      buffer_methodological_assessments: {},
      buffer_extracted_data: {},
      list: {
        id: '',
        title: '',
        description: '',
        authors: '',
        private: false,
        sources: [
          /*
          {id: 1, title: 'title source 1', authors: [{id: 1, name: 'name author'}], year: 2019, objective: 'lorem ipsum'},
          {id: 2, title: 'title source 2', authors: [{id: 1, name: 'name author'}], year: 2018, objective: 'lorem ipsum'}
          */
        ],
        methodological_assessments: {
          fields: [],
          items: []
        },
        extracted_data: {
          fields: [],
          items: []
        }
      },
      soqf: [],
      evidence_profile: [],
      characteristics_studies: {
        fields: [],
        items: []
      }
    }
  },
  mounted () {
    this.setting_tables.soqf_list.totalRows = this.soqf.length
    this.getList()
    this.getStageThreeData()
  },
  methods: {
    getList: function () {
      axios.get(`/api/isoqf_lists/${this.$route.params.id}`)
        .then((response) => {
          this.list = {...response.data}
          this.list.sources = []
          this.soqf = []
          this.evidence_profile = []
          this.list.methodological_assessments = {
            fields: [],
            items: []
          }
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
    getStageThreeData: function () {
      axios.get('/api/isoqf_characteristics', this.buffer_characteristics_studies)
        .then((response) => {
          if (response.data.length) {
            this.characteristics_studies = response.data[0]
          }
        }).catch((error) => {
          console.log(error)
        })
    },
    openModalStageThreeTable: function () {
      this.nroOfRows = this.characteristics_studies.fields.length
      this.buffer_characteristics_studies = this.characteristics_studies
      this.$refs['modal-stage-three-table'].show()
    },
    saveStageThree: function () {
      // todo: the study id needs to be copied to methods assessments and extracted data
      // this.characteristics_studies.items.push(this.buffer_characteristics_studies)
      if (this.buffer_characteristics_studies.id) {
        axios.patch(`/api/isoqf_characteristics/${this.buffer_characteristics_studies.id}`, this.buffer_characteristics_studies)
          .then((response) => {
            this.nroOfRows = 1
            this.getStageThreeData()
          })
          .catch((error) => {
            console.log(error)
          })
      } else {
        this.buffer_characteristics_studies.list_id = this.$route.params.id
        this.buffer_characteristics_studies.organization = this.list.organization
        axios.post('/api/isoqf_characteristics', this.buffer_characteristics_studies)
          .then((response) => {
            this.getStageThreeData()
          })
          .catch((error) => {
            console.log(error)
          })
      }
      // clean
      this.buffer_characteristics_studies = {
        fields: [],
        items: []
      }
      // close
      this.$refs['modal-stage-three-data'].hide()
    },
    copyMethAssessments: function () {
      this.list.methodological_assessments.items.push(this.buffer_methodological_assessments)
      // clean
      this.buffer_methodological_assessments = {}
      // close
      this.$refs['modal-stage-four-data'].hide()
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
