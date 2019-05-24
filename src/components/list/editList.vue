<template>
  <div class="mt-4">
    <b-container>
      <h2>Edit {{list.title}}</h2>
      <b-row>
        <b-col cols="12">
          <b-form>
            <b-form-group
              id="label-title"
              label="Title"
              label-for="input-title">
              <b-form-input
                id="input-title"
                v-model="list.title"
                type="text"
                required
                placeholder="Enter a title"></b-form-input>
            </b-form-group>
            <b-form-group
              id="label-description"
              label="Description"
              label-for="input-description">
              <b-form-textarea
                id="input-description"
                v-model="list.description"
                type="textarea"
                placeholder="Enter a description"></b-form-textarea>
            </b-form-group>

            <b-tabs>
              <b-tab title="SoQF">
                <b-table :fields="soqf_fields" :items="list.soqf" caption-top>
                  <template slot="table-caption">
                    <div class="text-right">
                      <b-button v-b-modal.modal-stage-one variant="outline-primary">Add new Finding</b-button>
                    </div>
                  </template>
                  <template slot="actions">
                    <font-awesome-icon icon="trash" pull="right" title="Remove" style="color: #dc3545" />
                    <font-awesome-icon icon="edit" pull="right" title="Edit" />
                  </template>
                </b-table>
                <!-- modal finding -->
                <b-modal id="modal-stage-one" ref="modal-stage-one">
                  <b-form-group
                    id="label-finding"
                    label="Finding"
                    label-for="input-finding">
                    <b-form-input
                      id="input-finding"
                      type="text"
                      v-model="buffer_modal_stage_one.name"
                      required
                      placeholder="Enter a finding"></b-form-input>
                  </b-form-group>
                  <div slot="modal-footer">
                    <b-button
                      variant="outline-primary"
                      @click="saveStageOne">Save</b-button>
                  </div>
                </b-modal>
                <!-- end modal finding -->
              </b-tab>
              <b-tab title="Evidence Profile">
                <!-- Evidence Profile-->
                <b-table responsive striped :fields="evidence_profile_fields" :items="list.evidence_profile" caption-top>
                  <template slot="table-caption">
                    <div class="text-right">
                      <b-button v-b-modal.modal-stage-two variant="outline-primary">Add new element</b-button>
                    </div>
                  </template>
                  <template slot="finding" slot-scope="data">
                    {{data.item.finding}}
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

                <b-modal id="modal-stage-two" ref="modal-stage-two" scrollable>
                  <b-form-group
                    id="label-finding"
                    label="Finding"
                    label-for="input-finding-textarea">
                    <b-form-textarea
                      id="input-finding-textarea"
                      v-model="buffer_modal_stage_two.finding"
                      required
                      placeholder="Enter a finding"></b-form-textarea>
                  </b-form-group>
                  <b-form-group
                    id="label-ml"
                    label="Methodological Limitations"
                    label-for="select-ml">
                    <b-form-select
                      id="select-ml"
                      required
                      v-model="buffer_modal_stage_two.methodological_limitations.option"
                      :options="select_options"></b-form-select>
                  </b-form-group>
                  <b-form-group
                    label="Explanation"
                    label-for="input-ml-explanation">
                    <b-form-textarea
                      id="input-ml-explanation"
                      v-model="buffer_modal_stage_two.methodological_limitations.explanation"
                      placeholder="Enter an explanation"></b-form-textarea>
                  </b-form-group>
                  <b-form-group
                    id="label-coherence"
                    label="Coherence"
                    label-for="select-coherence">
                    <b-form-select
                      id="select-coherence"
                      required
                      v-model="buffer_modal_stage_two.coherence.option"
                      :options="select_options"></b-form-select>
                  </b-form-group>
                  <b-form-group
                    label="Explanation"
                    label-for="input-coherence-explanation">
                    <b-form-textarea
                      id="input-coherence-explanation"
                      v-model="buffer_modal_stage_two.coherence.explanation"
                      placeholder="Enter an explanation"></b-form-textarea>
                  </b-form-group>
                  <b-form-group
                    id="label-adequacy"
                    label="Adequacy"
                    label-for="select-adequacy">
                    <b-form-select
                      id="select-adequacy"
                      required
                      v-model="buffer_modal_stage_two.adequacy.option"
                      :options="select_options"></b-form-select>
                  </b-form-group>
                  <b-form-group
                    label="Explanation"
                    label-for="input-adequacy-explanation">
                    <b-form-textarea
                      id="input-adequacy-explanation"
                      v-model="buffer_modal_stage_two.adequacy.explanation"
                      placeholder="Enter an explanation"></b-form-textarea>
                  </b-form-group>
                  <b-form-group
                    id="label-relevance"
                    label="Relevance"
                    label-for="select-relevance">
                    <b-form-select
                      id="select-relevance"
                      required
                      v-model="buffer_modal_stage_two.relevance.option"
                      :options="select_options"></b-form-select>
                  </b-form-group>
                  <b-form-group
                    label="Explanation"
                    label-for="input-relevance-explanation">
                    <b-form-textarea
                      id="input-relevance-explanation"
                      v-model="buffer_modal_stage_two.relevance.explanation"
                      placeholder="Enter an explanation"></b-form-textarea>
                  </b-form-group>
                  <div slot="modal-footer">
                    <b-button
                      variant="outline-primary"
                      @click="saveStageTwo">Save</b-button>
                  </div>
                </b-modal>
                <!-- end of Evidence Profile-->
              </b-tab>
              <b-tab title="Characteristics of Studies"></b-tab>
              <b-tab title="Methodological Assessments"></b-tab>
              <b-tab title="Extracted Data"></b-tab>
            </b-tabs>
            <!-- SoQF -->
            <!-- Characteristics of Studies -->
            <!-- Methodological Assessments -->
            <!-- Extracted data -->
            <b-row align-h="end">
              <b-col cols="12" md="2" class="text-right">
                <b-button type="submit" variant="outline-primary">Save</b-button>
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
          {id: 1, finding: 1, methodological_limitations: {option: 2, explanation: 'some explanation lorem ipsum'}, coherence: {option: null, explanation: ''}, adequacy: {option: null, explanation: ''}, relevance: {option: null, explanation: ''}},
          {id: 2, finding: 2, methodological_limitations: {option: 2, explanation: 'some explanation lorem ipsum'}, coherence: {option: null, explanation: ''}, adequacy: {option: null, explanation: ''}, relevance: {option: null, explanation: ''}}
        ],
        characteristics_studies: [
          {id: 1, study_id: '1'}
        ],
        methodological_assessments: [
          {id: 1, study_id: '1'}
        ],
        extracted_data: [
          {id: 1, study_id: '1', extracted_data: ''}
        ]
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
    }
  }
}
</script>

<style>

</style>
