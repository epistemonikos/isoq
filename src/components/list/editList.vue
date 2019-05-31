<template>
  <div class="mt-4">
    <b-container>
      <h2>{{ $t('Edit') }} {{list.title}}</h2>
      <b-row>
        <b-col cols="12">
          <b-form>
            <b-form-group
              id="label-title"
              v-bind:label="$t('Title')"
              label-for="input-title">
              <b-form-input
                id="input-title"
                v-model="list.title"
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
                placeholder="$t('Enter a description')"></b-form-textarea>
            </b-form-group>

            <b-tabs>
              <b-tab title="SoQF">
                <b-table :fields="soqf_fields" :items="list.soqf" caption-top>
                  <template slot="table-caption">
                    <div class="text-right">
                      <b-button v-b-modal.modal-stage-one variant="outline-primary">{{ $t('Add new Finding') }}</b-button>
                    </div>
                  </template>
                  <template slot="actions">
                    <font-awesome-icon icon="trash" pull="right" v-bind:title="$t('Remove')" style="color: #dc3545" />
                    <font-awesome-icon icon="edit" pull="right" v-bind:title="$t('Edit')" />
                  </template>
                </b-table>
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
                <!-- end modal finding -->
              </b-tab>
              <!-- Evidence Profile-->
              <b-tab title="Evidence Profile">
                <b-table
                  responsive striped caption-top
                  :fields="evidence_profile_fields"
                  :items="list.evidence_profile">
                  <template slot="table-caption">
                    <div class="text-right">
                      <b-button v-b-modal.modal-stage-two variant="outline-primary">Add new element</b-button>
                    </div>
                  </template>
                  <template slot="finding" slot-scope="data">
                    {{data.item.finding_id}}
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

                <b-modal id="modal-stage-two" ref="modal-stage-two" v-bind:title="$t('Evidence profile')" scrollable>
                  <b-form-group
                    id="label-finding"
                    v-bind:label="$t('Finding')"
                    label-for="input-finding-textarea">
                    <b-form-textarea
                      id="input-finding-textarea"
                      v-model="buffer_modal_stage_two.finding"
                      required
                      v-bind:placeholder="$t('Enter a finding')"></b-form-textarea>
                  </b-form-group>
                  <b-form-group
                    id="label-ml"
                    v-bind:label="$t('Methodological Limitations')"
                    label-for="select-ml">
                    <b-form-select
                      id="select-ml"
                      required
                      v-model="buffer_modal_stage_two.methodological_limitations.option"
                      :options="select_options"></b-form-select>
                  </b-form-group>
                  <b-form-group
                    v-bind:label="$t('Explanation')"
                    label-for="input-ml-explanation">
                    <b-form-textarea
                      id="input-ml-explanation"
                      v-model="buffer_modal_stage_two.methodological_limitations.explanation"
                      v-bind:placeholder="$t('Enter an explanation')"></b-form-textarea>
                  </b-form-group>
                  <b-form-group
                    id="label-coherence"
                    v-bind:label="$t('Coherence')"
                    label-for="select-coherence">
                    <b-form-select
                      id="select-coherence"
                      required
                      v-model="buffer_modal_stage_two.coherence.option"
                      :options="select_options"></b-form-select>
                  </b-form-group>
                  <b-form-group
                    v-bind:label="$t('Explanation')"
                    label-for="input-coherence-explanation">
                    <b-form-textarea
                      id="input-coherence-explanation"
                      v-model="buffer_modal_stage_two.coherence.explanation"
                      v-bind:placeholder="$t('Enter an explanation')"></b-form-textarea>
                  </b-form-group>
                  <b-form-group
                    id="label-adequacy"
                    v-bind:label="$t('Adequacy')"
                    label-for="select-adequacy">
                    <b-form-select
                      id="select-adequacy"
                      required
                      v-model="buffer_modal_stage_two.adequacy.option"
                      :options="select_options"></b-form-select>
                  </b-form-group>
                  <b-form-group
                    v-bind:label="$t('Explanation')"
                    label-for="input-adequacy-explanation">
                    <b-form-textarea
                      id="input-adequacy-explanation"
                      v-model="buffer_modal_stage_two.adequacy.explanation"
                      placeholder="Enter an explanation"></b-form-textarea>
                  </b-form-group>
                  <b-form-group
                    id="label-relevance"
                    v-bind:label="$t('Relevance')"
                    label-for="select-relevance">
                    <b-form-select
                      id="select-relevance"
                      required
                      v-model="buffer_modal_stage_two.relevance.option"
                      :options="select_options"></b-form-select>
                  </b-form-group>
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
                <!-- end of Evidence Profile-->
              </b-tab>
              <!-- Characteristics of Studies -->
              <b-tab v-bind:title="$t('Characteristics of Studies')">
                <!-- create study tables -->
                <b-modal
                  id="modal-stage-three-table"
                  ref="modal-stage-three-table">
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
                      v-model="list.characteristics_studies.fields[item - 1]"></b-form-input>
                  </b-form-group>
                  <!-- -->
                </b-modal>
                <!-- end of create study tables -->
                <template v-if="list.characteristics_studies.fields.length">
                <b-table
                  responsive striped caption-top
                  :fields="list.characteristics_studies.fields"
                  :items="list.characteristics_studies.items">
                  <template slot="table-caption">
                    <div class="text-right">
                      <b-button v-b-modal.modal-stage-three-table variant="outline-primary">Edit table</b-button>
                      <b-button
                        v-if="list.characteristics_studies.fields.length"
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
                  <div class="text-center mt-5">
                    <p>{{ $t('No studies') }} <b-link v-b-modal.modal-stage-three-table>{{ $t('add studies') }}</b-link></p>
                  </div>
                </template>
                <!-- create study data -->
                <b-modal
                  id="modal-stage-three-data"
                  ref="modal-stage-three-data"
                  @ok="copyStudies">
                  <b-form-group
                    v-for="(field, index) in list.characteristics_studies.fields"
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
              </b-tab>
              <!-- Methodological Assessments -->
              <b-tab v-bind:title="$t('Methodological Assessments')">
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
                  <div class="text-center mt-5">
                    <p>{{ $t('No methodological') }} <b-link v-b-modal.modal-stage-four-table>{{ $t('add methodological assessments') }}</b-link></p>
                  </div>
                </template>
              </b-tab>
              <!-- Extracted data -->
              <b-tab v-bind:title="$t('Extracted Data')">
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
                <template>
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
                <template>
                  <div class="text-center mt-5">
                    <p>{{ $t('No extracted data') }} <b-link v-b-modal.modal-stage-five-table>{{ $t('add extracted data') }}</b-link></p>
                  </div>
                </template>
              </b-tab>
            </b-tabs>
            <b-row align-h="end">
              <b-col cols="12" md="2" class="text-right">
                <b-button type="submit" variant="outline-primary">{{ $t('Save') }}</b-button>
              </b-col>
            </b-row>
          </b-form>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
export default {
  data () {
    return {
      nroOfRows: 1,
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
      soqf_fields: [
        {key: 'id', label: 'ID'},
        {key: 'finding', label: 'Finding'},
        {key: 'actions', label: 'Actions'}
      ],
      evidence_profile_fields: [
        {key: 'finding', label: 'Finding'},
        {key: 'methodological-limit', label: 'Methodological limitations'},
        {key: 'coherence', label: 'Coherence'},
        {key: 'adequacy', label: 'Adequacy'},
        {key: 'relevance', label: 'Relevance'},
        {key: 'actions', label: 'Actions'}
      ],
      initial_modal_stage_one: {
        id: null,
        name: ''
      },
      buffer_modal_stage_one: {
        id: null,
        name: ''
      },
      initial_modal_stage_two: {
        id: null,
        finding: '',
        methodological_limitations: {option: null, explanation: ''},
        coherence: {option: null, explanation: ''},
        adequacy: {option: null, explanation: ''},
        relevance: {option: null, explanation: ''}
      },
      buffer_modal_stage_two: {
        id: null,
        finding: '',
        methodological_limitations: {option: null, explanation: ''},
        coherence: {option: null, explanation: ''},
        adequacy: {option: null, explanation: ''},
        relevance: {option: null, explanation: ''}
      },
      buffer_characteristics_studies: {},
      buffer_methodological_assessments: {},
      buffer_extracted_data: {},
      list: {
        id: 1,
        title: 'title',
        description: 'description',
        sources: [
          {id: 1, title: 'title source 1', authors: [{id: 1, name: 'name author'}], year: 2019, objective: 'lorem ipsum'},
          {id: 2, title: 'title source 2', authors: [{id: 1, name: 'name author'}], year: 2018, objective: 'lorem ipsum'}
        ],
        soqf: [
          {id: 1, finding: 'some finding 01', overall_cerqual: '', explanation_cerqual: '', contribution_studies: ''},
          {id: 2, finding: 'some finding 02', overall_cerqual: '', explanation_cerqual: '', contribution_studies: ''}
        ],
        evidence_profile: [
          {id: 1, finding_id: 1, methodological_limitations: {option: 2, explanation: 'some explanation lorem ipsum'}, coherence: {option: null, explanation: ''}, adequacy: {option: null, explanation: ''}, relevance: {option: null, explanation: ''}},
          {id: 2, finding_id: 2, methodological_limitations: {option: 2, explanation: 'some explanation lorem ipsum'}, coherence: {option: null, explanation: ''}, adequacy: {option: null, explanation: ''}, relevance: {option: null, explanation: ''}}
        ],
        characteristics_studies: {
          fields: [],
          items: []
        },
        methodological_assessments: {
          fields: [],
          items: []
        },
        extracted_data: {
          fields: [],
          items: []
        }
      }
    }
  },
  methods: {
    editStageOne: function () {},
    saveStageOne: function () {
      let theID = this.list.soqf.length + 1
      this.list.soqf.push({id: theID, finding: this.buffer_modal_stage_one.name, overall_cerqual: '', explanation_cerqual: '', contribution_studies: ''})
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
      this.list.evidence_profile.push(this.buffer_modal_stage_two)
      // clean
      this.buffer_modal_stage_two = {...this.initial_modal_stage_two}
      // close
      this.$refs['modal-stage-two'].hide()
    },
    copyStudies: function () {
      // todo: the study id needs to be copied to methods assessments and extracted data
      this.list.characteristics_studies.items.push(this.buffer_characteristics_studies)
      // clean
      this.buffer_characteristics_studies = {}
      // close
      this.$refs['modal-stage-three-data'].hide()
    },
    copyMethAssessments: function () {
      this.list.methodological_assessments.items.push(this.buffer_methodological_assessments)
      // clean
      this.buffer_methodological_assessments = {}
      // close
      this.$refs['modal-stage-four-data'].hide()
    }
  }
}
</script>

<style>

</style>
