<template>
  <div>
    <b-table
      :fields="ui.fields"
      :items="assessments.items">
      <template
        v-slot:cell(authors)="data">
        {{ data.item.authors }}
      </template>
      <template
        v-slot:cell(stepOne)="data">
        <b-button @click="openModal(0, data)" :variant="(isCompleted(0, data.index)) ? 'outline-primary': 'primary'">Assess</b-button>
      </template>
      <template
        v-slot:cell(stepTwo)="data">
        <b-button @click="openModal(1, data)" :variant="(isCompleted(1, data.index)) ? 'outline-primary': 'primary'">Assess</b-button>
      </template>
      <template
        v-slot:cell(stepThree)="data">
        <b-button @click="openModal(2, data)" :variant="(isCompleted(2, data.index)) ? 'outline-primary': 'primary'">Assess</b-button>
      </template>
      <template
        v-slot:cell(stepFour)="data">
        <b-button @click="openModal(3, data)" :variant="(isCompleted(3, data.index)) ? 'outline-primary': 'primary'">Assess</b-button>
      </template>
    </b-table>

    <b-modal id="modal-1" size="xl" hide-footer title="Methodological assessment" class="modal-header">
      <b-row>
        <b-col cols="12" class="modal-body">
          <b-tabs nav-class="modal-nav-tabs" v-model="modal.stage" align="right">
            <template #tabs-start>
              <li role="presentation" class="nav-item mr-auto align-self-center modal-author"><b>{{ ui.authors }}</b></li>
            </template>
            <b-tab title-item-class="align-self-center" :title-link-class="modal.stage === 0 ? ['modal-active-tab', 'modal-active-tab-text'] : ['modal-normal-tab', 'modal-normal-tab-text']">
              <template #title>
                Fit between <br/>Meta domains and <br/>Research design
              </template>
              <b-row>
                <b-col cols="12">
                  <h2>Fit between Meta domains and Research design</h2>
                  <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus itaque aliquid consequatur delectus cupiditate, expedita eos quis quidem perferendis, illum dolorem! Natus corrupti atque iure quo adipisci perferendis voluptatibus reiciendis?</p>
                </b-col>
                <b-col cols="4">
                  <assessmentForm
                    :assessments="assessments"
                    :modalStage="modal.stage"
                    :selectedMeta="selectedMeta"
                    :refId="refId"
                    :modalIndex="modal.index"
                    @getAssessments="getAssessments"></assessmentForm>
                </b-col>
                <b-col cols="4">
                  <div>
                    <h3>Meta domains</h3>
                  </div>
                  <div role="tablist">
                    <div class="p-1" role="tab">
                      <h4 block @click="showFitAssessment('accordion-aa', 0)">1 - Research</h4>
                    </div>
                    <b-collapse id="accordion-aa" visible accordion="aa" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[0].values[0]['research_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[0].values[0]['research_concerns'] }}
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block @click="showFitAssessment('accordion-ab', 1)">2 - Stakeholders</h4>
                    </div>
                    <b-collapse id="accordion-ab" accordion="aa" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[0].values[1]['stakeholders_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[0].values[1]['stakeholders_concerns'] }}
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block @click="showFitAssessment('accordion-ac', 2)">3 - Researchers</h4>
                    </div>
                    <b-collapse id="accordion-ac" accordion="aa" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[0].values[2]['researchers_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[0].values[2]['researchers_concerns'] }}
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block @click="showFitAssessment('accordion-ad', 3)">4 - Context</h4>
                    </div>
                    <b-collapse id="accordion-ad" accordion="aa" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[0].values[3]['context_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[0].values[3]['context_concerns'] }}
                    </b-collapse>
                  </div>
                </b-col>
                <b-col cols="4">
                  <div>
                    <h3>Research design domains</h3>
                  </div>
                  <div role="tablist">
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-ae>1 - Research strategy</h4>
                    </div>
                    <b-collapse id="accordion-ae" visible accordion="ab" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[1].values[0]['strategy_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[1].values[0]['strategy_concerns'] }}
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-af>2 - Ethical considerations</h4>
                    </div>
                    <b-collapse id="accordion-af" accordion="ab" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[1].values[1]['ethical_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[1].values[1]['ethical_concerns'] }}
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-ag>3 - Equity, diversity & inclusion considerations</h4>
                    </div>
                    <b-collapse id="accordion-ag" accordion="ab" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[1].values[2]['equity_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[1].values[2]['equity_concerns'] }}
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-ah>4 - Theory</h4>
                    </div>
                    <b-collapse id="accordion-ah" accordion="ab" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[1].values[3]['theory_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[1].values[3]['theory_concerns'] }}
                    </b-collapse>
                  </div>
                </b-col>
              </b-row>
            </b-tab>
            <b-tab :title-link-class="modal.stage === 1 ? ['modal-active-tab', 'modal-active-tab-text'] : ['modal-normal-tab', 'modal-normal-tab-text']">
              <template #title>
                Fit between <br/>Meta domains and <br/>Research conduct
              </template>
              <b-row>
                <b-col cols="12">
                  <h2>Fit between Meta domains and Research conduct</h2>
                  <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus itaque aliquid consequatur delectus cupiditate, expedita eos quis quidem perferendis, illum dolorem! Natus corrupti atque iure quo adipisci perferendis voluptatibus reiciendis?</p>
                </b-col>
                <b-col cols="4">
                  <assessmentForm
                    :assessments="assessments"
                    :modalStage="modal.stage"
                    :selectedMeta="selectedMeta"
                    :refId="refId"
                    :modalIndex="modal.index"
                    @getAssessments="getAssessments"></assessmentForm>
                </b-col>
                <b-col cols="4">
                  <div>
                    <h3>Meta domains</h3>
                  </div>
                  <div role="tablist">
                    <div class="p-1" role="tab">
                      <h4 block @click="showFitAssessment('accordion-ba', 0)">1 - Research</h4>
                    </div>
                    <b-collapse id="accordion-ba" visible accordion="ba" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[0].values[0]['research_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[0].values[0]['research_concerns'] }}
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block @click="showFitAssessment('accordion-bb', 1)">2 - Stakeholders</h4>
                    </div>
                    <b-collapse id="accordion-bb" accordion="ba" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[0].values[1]['stakeholders_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[0].values[1]['stakeholders_concerns'] }}
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block @click="showFitAssessment('accordion-bc', 2)">3 - Researchers</h4>
                    </div>
                    <b-collapse id="accordion-bc" accordion="ba" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[0].values[2]['researchers_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[0].values[2]['researchers_concerns'] }}
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block @click="showFitAssessment('accordion-bd', 3)">4 - Context</h4>
                    </div>
                    <b-collapse id="accordion-bd" accordion="ba" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[0].values[3]['context_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[0].values[3]['context_concerns'] }}
                    </b-collapse>
                  </div>
                </b-col>
                <b-col cols="4">
                  <div>
                    <h3>Research conduct domains</h3>
                  </div>
                  <div role="tablist">
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-be>1 - Participant recruitment & selection</h4>
                    </div>
                    <b-collapse id="accordion-be" visible accordion="bb" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[2].values[0]['participant_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[2].values[0]['participant_concerns'] }}
                    </b-collapse>

                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-bf>2 - Data collection</h4>
                    </div>
                    <b-collapse id="accordion-bf" accordion="bb" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[2].values[1]['data_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[2].values[1]['data_concerns'] }}
                    </b-collapse>

                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-bg>3 - Analysis and interpretation</h4>
                    </div>
                    <b-collapse id="accordion-bg" accordion="bb" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[2].values[2]['analysis_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[2].values[2]['analysis_concerns'] }}
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-bh>4 - Presentation of findings</h4>
                    </div>
                    <b-collapse id="accordion-bh" accordion="bb" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[2].values[3]['presentation_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[2].values[3]['presentation_concerns'] }}
                    </b-collapse>
                  </div>
                </b-col>
              </b-row>
            </b-tab>
            <b-tab :title-link-class="modal.stage === 2 ? ['modal-active-tab', 'modal-active-tab-text'] : ['modal-normal-tab', 'modal-normal-tab-text']">
              <template #title>
                Fit between <br/>Research design and <br/>Research conduct
              </template>
              <b-row>
                <b-col cols="12">
                  <h2>Fit between Research design and Research conduct</h2>
                  <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus itaque aliquid consequatur delectus cupiditate, expedita eos quis quidem perferendis, illum dolorem! Natus corrupti atque iure quo adipisci perferendis voluptatibus reiciendis?</p>
                </b-col>
                <b-col cols="4">
                  <assessmentForm
                    :assessments="assessments"
                    :modalStage="modal.stage"
                    :selectedMeta="selectedMeta"
                    :refId="refId"
                    :modalIndex="modal.index"
                    @getAssessments="getAssessments"></assessmentForm>
                </b-col>
                <b-col cols="4">
                  <div>
                    <h3>Research design domains</h3>
                  </div>
                  <div role="tablist">
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-ca>1 - Research strategy</h4>
                    </div>
                    <b-collapse id="accordion-ca" visible accordion="ca" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[1].values[0]['strategy_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[1].values[0]['strategy_concerns'] }}
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-cb>2 - Ethical considerations</h4>
                    </div>
                    <b-collapse id="accordion-cb" accordion="ca" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[1].values[1]['ethical_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[1].values[1]['ethical_concerns'] }}
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-cc>3 - Equity, diversity & inclusion considerations</h4>
                    </div>
                    <b-collapse id="accordion-cc" accordion="ca" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[1].values[2]['equity_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[1].values[2]['equity_concerns'] }}
                    </b-collapse>
                    <div class="p-1" role="tab">
                      <h4 block v-b-toggle.accordion-cd>4 - Theory</h4>
                    </div>
                    <b-collapse id="accordion-cd" accordion="ca" role="tabpanel">
                      <h5>Extracted data</h5>
                      {{ this.meta[1].values[3]['theory_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[1].values[3]['theory_concerns'] }}
                    </b-collapse>
                  </div>
                </b-col>
                <b-col cols="4">
                  <div>
                    <div>
                      <h3>Research conduct domains</h3>
                    </div>
                    <div role="tablist">
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-ce>1 - Participant recruitment & selection</h4>
                      </div>
                      <b-collapse id="accordion-ce" visible accordion="cb" role="tabpanel">
                        <h5>Extracted data</h5>
                      {{ this.meta[2].values[0]['participant_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[2].values[0]['participant_concerns'] }}
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-cf>2 - Data collection</h4>
                      </div>
                      <b-collapse id="accordion-cf" accordion="cb" role="tabpanel">
                        <h5>Extracted data</h5>
                      {{ this.meta[2].values[1]['data_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[2].values[1]['data_concerns'] }}
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-cg>3 - Analysis and interpretation</h4>
                      </div>
                      <b-collapse id="accordion-cg" accordion="cb" role="tabpanel">
                        <h5>Extracted data</h5>
                      {{ this.meta[2].values[2]['analysis_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[2].values[2]['analysis_concerns'] }}
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-ch>4 - Presentation of findings</h4>
                      </div>
                      <b-collapse id="accordion-ch" accordion="cb" role="tabpanel">
                        <h5>Extracted data</h5>
                      {{ this.meta[2].values[3]['presentation_extractedData'] }}
                      <h5>Concerns</h5>
                      {{ this.meta[2].values[3]['presentation_concerns'] }}
                      </b-collapse>
                    </div>
                  </div>
                </b-col>
              </b-row>
            </b-tab>
            <b-tab :title-link-class="modal.stage === 3 ? ['modal-active-tab', 'modal-active-tab-text'] : ['modal-normal-tab', 'modal-normal-tab-text']" title-item-class="align-self-end">
              <template #title>
                Overall assessment
              </template>
              <b-row>
                <b-col cols="12">
                  <h2>Overall assessment</h2>
                  <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus itaque aliquid consequatur delectus cupiditate, expedita eos quis quidem perferendis, illum dolorem! Natus corrupti atque iure quo adipisci perferendis voluptatibus reiciendis?</p>
                </b-col>
                <b-col cols="3">
                  <assessmentForm
                    :assessments="assessments"
                    :modalStage="modal.stage"
                    :selectedMeta="selectedMeta"
                    :refId="refId"
                    :modalIndex="modal.index"
                    @getAssessments="getAssessments"></assessmentForm>
                </b-col>
                <b-col cols="3">
                  <div>
                    <h3>Fit between Research design and each Meta domain</h3>
                  </div>
                  <div role="tablist">
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-da>1 - Research</h4>
                      </div>
                      <b-collapse id="accordion-da" visible accordion="da" role="tabpanel">
                        <template v-if="assessments.items.length">
                          <responses
                            :stage="0"
                            :index="0"
                            :option="assessments.items[modal.index].stages[0].options[0].option"
                            :text="assessments.items[modal.index].stages[0].options[0].text"></responses>
                        </template>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-db>2 - Stakeholders</h4>
                      </div>
                      <b-collapse id="accordion-db" accordion="da" role="tabpanel">
                        <template v-if="assessments.items.length">
                          <responses
                            :stage="0"
                            :index="1"
                            :option="assessments.items[modal.index].stages[0].options[1].option"
                            :text="assessments.items[modal.index].stages[0].options[1].text"></responses>
                        </template>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-dc>3 - Researchers</h4>
                      </div>
                      <b-collapse id="accordion-dc" accordion="da" role="tabpanel">
                        <template v-if="assessments.items.length">
                          <responses
                            :stage="0"
                            :index="2"
                            :option="assessments.items[modal.index].stages[0].options[2].option"
                            :text="assessments.items[modal.index].stages[0].options[2].text"></responses>
                        </template>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-dd>4 - Context</h4>
                      </div>
                      <b-collapse id="accordion-dd" accordion="da" role="tabpanel">
                        <template v-if="assessments.items.length">
                          <responses
                            :stage="0"
                            :index="3"
                            :option="assessments.items[modal.index].stages[0].options[3].option"
                            :text="assessments.items[modal.index].stages[0].options[3].text"></responses>
                        </template>
                      </b-collapse>
                  </div>
                </b-col>
                <b-col cols="3">
                  <div>
                    <div>
                      <h3>Fit between Research conduct and each Meta domain</h3>
                    </div>
                    <div role="tablist">
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-de>Research strategy</h4>
                      </div>
                      <b-collapse id="accordion-de" visible accordion="db" role="tabpanel">
                        <template v-if="assessments.items.length">
                          <responses
                            :stage="1"
                            :index="0"
                            :option="assessments.items[modal.index].stages[1].options[0].option"
                            :text="assessments.items[modal.index].stages[1].options[0].text"></responses>
                        </template>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-df>Ethical considerations</h4>
                      </div>
                      <b-collapse id="accordion-df" accordion="db" role="tabpanel">
                        <template v-if="assessments.items.length">
                          <responses
                            :stage="1"
                            :index="1"
                            :option="assessments.items[modal.index].stages[1].options[1].option"
                            :text="assessments.items[modal.index].stages[1].options[1].text"></responses>
                        </template>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-dg>Equity, diversity & inclusion  considerations</h4>
                      </div>
                      <b-collapse id="accordion-dg" accordion="db" role="tabpanel">
                        <template v-if="assessments.items.length">
                          <responses
                            :stage="1"
                            :index="2"
                            :option="assessments.items[modal.index].stages[1].options[2].option"
                            :text="assessments.items[modal.index].stages[1].options[2].text"></responses>
                        </template>
                      </b-collapse>
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-dh>Theory</h4>
                      </div>
                      <b-collapse id="accordion-dh" accordion="db" role="tabpanel">
                        <template v-if="assessments.items.length">
                          <responses
                            :stage="1"
                            :index="3"
                            :option="assessments.items[modal.index].stages[1].options[3].option"
                            :text="assessments.items[modal.index].stages[1].options[3].text"></responses>
                        </template>
                      </b-collapse>
                    </div>
                  </div>
                </b-col>
                <b-col cols="3">
                  <div>
                    <div>
                      <h3>Fit between Research design and Research conduct domains</h3>
                    </div>
                    <div role="tablist">
                      <div class="p-1" role="tab">
                        <h4 block v-b-toggle.accordion-di>Fit assessment</h4>
                      </div>
                      <b-collapse id="accordion-di" visible accordion="dc" role="tabpanel">
                        <template v-if="assessments.items.length">
                          <responses
                            :stage="2"
                            :index="0"
                            :option="assessments.items[modal.index].stages[2].options[0].option"
                            :text="assessments.items[modal.index].stages[2].options[0].text"></responses>
                        </template>
                      </b-collapse>
                    </div>

                  </div>
                </b-col>
              </b-row>
            </b-tab>
          </b-tabs>
        </b-col>
      </b-row>
    </b-modal>
  </div>
</template>

<script>
import axios from 'axios'
import Commons from '../../utils/commons.js'
import AssessmentForm from './assessment/AssessmentForm.vue'
import Responses from './Responses.vue'

export default {
  name: 'StepFour',
  props: {
    type: {
      type: String,
      required: true
    },
    references: {
      type: Array,
      required: true
    }
  },
  components: {
    AssessmentForm, Responses
  },
  data () {
    return {
      // Define any local data properties here if needed
      ui: {
        fields: [
          { key: 'authors', label: 'Study' },
          { key: 'stepOne', label: 'Fit between Meta domains and Research design' },
          { key: 'stepTwo', label: 'Fit between Meta domains and Research conduct' },
          { key: 'stepThree', label: 'Fit between Research design and Research conduct' },
          { key: 'stepFour', label: 'Overall assessment' }
        ],
        authors: ''
      },
      characteristics: [],
      assessments: {
        items: [
          {
            ref_id: null,
            stages: [
              {
                key: 0,
                options: [
                  {
                    option: null,
                    text: ''
                  },
                  {
                    option: null,
                    text: ''
                  },
                  {
                    option: null,
                    text: ''
                  },
                  {
                    option: null,
                    text: ''
                  }
                ]
              },
              {
                key: 1,
                options: [
                  {
                    option: null,
                    text: ''
                  },
                  {
                    option: null,
                    text: ''
                  },
                  {
                    option: null,
                    text: ''
                  },
                  {
                    option: null,
                    text: ''
                  }
                ]
              },
              {
                key: 2,
                options: [
                  {
                    option: null,
                    text: ''
                  }
                ]
              },
              {
                key: 3,
                options: [
                  {
                    option: null,
                    text: ''
                  }
                ]
              }
            ]
          }
        ]
      },
      selected: null,
      text1: '',
      modal: {
        stage: 0,
        index: 0
      },
      meta: [
        {
          name: 'Meta Domains',
          items: ['research_', 'stakeholders_', 'researchers_', 'context_'],
          values: [
            {
              research_extractedData: '',
              research_concerns: ''
            },
            {
              stakeholders_extractedData: '',
              stakeholders_concerns: ''
            },
            {
              researchers_extractedData: '',
              researchers_concerns: ''
            },
            {
              context_extractedData: '',
              context_concerns: ''
            }
          ]
        },
        {
          name: 'Research design domains',
          items: ['strategy_', 'ethical_', 'equity_', 'theory_'],
          values: [
            {
              strategy_extractedData: '',
              strategy_concerns: ''
            },
            {
              ethical_extractedData: '',
              ethical_concerns: ''
            },
            {
              equity_extractedData: '',
              equity_concerns: ''
            },
            {
              theory_extractedData: '',
              theory_concerns: ''
            }
          ]
        },
        {
          name: 'Research conduct',
          items: ['participant_', 'data_', 'analysis_', 'presentation_'],
          values: [
            {
              participant_extractedData: '',
              participant_concerns: ''
            },
            {
              data_extractedData: '',
              data_concerns: ''
            },
            {
              analysis_extractedData: '',
              analysis_concerns: ''
            },
            {
              presentation_extractedData: '',
              presentation_concerns: ''
            }
          ]
        }
      ],
      selectedMeta: 0,
      refId: null
    }
  },
  watch: {
    // Watch for changes in props or data if needed
    'modal.stage': function (newVal) {
      this.selectedMeta = 0
    },
    assessments: {
      handler (newVal) {
        this.isCompleted()
      },
      deep: true
    },
    references: {
      handler (newVal) {
        this.getAssessments()
      },
      immediate: true
    }
  },
  computed: {
    // Define any computed properties here if needed
  },
  mounted () {
    // Fetch data when the component is mounted
    this.getAssessments()
  },
  methods: {
    // Define any methods here if needed
    getReferenceData: function (reference) {
      return Commons.parseReference(reference, true, false)
    },
    getAssessments: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get('/api/isoqf_assessments', { params })
        .then(response => {
          if (response.data.length) {
            this.assessments = {...response.data[0]}
          } else {
            // Inicializar con estructura vacía si no hay datos
            this.assessments = {
              items: this.references.map(ref => ({
                ref_id: ref.id,
                authors: this.getReferenceData(ref),
                stages: [
                  {
                    key: 0,
                    options: Array(4).fill({ option: null, text: '' })
                  },
                  {
                    key: 1,
                    options: Array(4).fill({ option: null, text: '' })
                  },
                  {
                    key: 2,
                    options: [{ option: null, text: '' }]
                  }
                ]
              }))
            }
          }
        })
        .catch(error => {
          console.error('Error fetching Assessments data:', error)
        })
    },
    getCharacteristics: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      axios.get('/api/isoqf_characteristics', { params })
        .then(response => {
          const data = response.data[0]
          const items = data.items

          for (let x = 0; x < items.length; x++) {
            if (items[x].ref_id === this.refId) {
              for (let y = 0; y < this.meta.length; y++) {
                for (let z = 0; z < this.meta[y].items.length; z++) {
                  this.meta[y].values[z][this.meta[y].items[z] + 'extractedData'] = items[x][this.meta[y].items[z] + 'extractedData']
                  this.meta[y].values[z][this.meta[y].items[z] + 'concerns'] = items[x][this.meta[y].items[z] + 'concerns']
                }
              }
            }
          }

          this.characteristics = response.data[0]
        })
        .catch(error => {
          console.error('Error fetching characteristics:', error)
        })
    },
    openModal: function (stage = 0, modal) {
      this.getCharacteristics()
      this.modal.stage = stage
      this.modal.index = modal.index
      this.selectedMeta = 0
      this.refId = modal.item.ref_id
      this.ui.authors = modal.item.authors
      this.$bvModal.show('modal-1')
    },
    showFitAssessment: function (assessmentId, position) {
      this.selectedMeta = position
      this.$root.$emit('bv::toggle::collapse', assessmentId)
    },
    isCompleted: function (stage = 0, index = 0) {
      // Verificar si el item existe y tiene la estructura necesaria
      if (!this.assessments ||
          !this.assessments.items ||
          !this.assessments.items[index] ||
          !this.assessments.items[index].stages ||
          !this.assessments.items[index].stages[stage] ||
          !this.assessments.items[index].stages[stage].options) {
        return false
      }

      const options = this.assessments.items[index].stages[stage].options
      let cnt = 0
      for (let i = 0; i < options.length; i++) {
        if (options[i].option === null) {
          cnt++
        }
      }
      return cnt === 0
    }
  }
}
</script>

<style lang="scss">
.modal-header {
  background-color: #1E2137;
  color: #fff;
  font-size: 1.375rem;
}
.modal-body {
  color: #152536;
}
.modal-author {
  font-size: 1rem;
}
.modal-active-tab {
  font-weight: bold;
  background-color: #9B9EB6 !important;
}
.modal-active-tab-text {
  color: #152536;
}
.modal-normal-tab {
  background-color: #D8DAE5 !important;
}
.modal-normal-tab-text {
  color: #6C6C6C;
}
</style>
