<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="py-5">
        <b-row>
          <b-col cols="12" class="text-right d-print-none">
            <b-link class="return" :to="{ name: 'viewProject', params: { org_id: this.list.organization, id: this.list.project_id }}">
              <font-awesome-icon icon="long-arrow-alt-left" :title="$t('back')" />
              return to ISoQf table
            </b-link>
          </b-col>
        </b-row>
        <h2 class="toDoc font-weight-bold pb-2">GRADE-CERQual Assessment Worksheet <small v-if="mode === 'edit'" class="d-print-none" v-b-tooltip.hover title="This is where you will transparently assess the 4 components of CERQual in order to make an overall assessment of confidence">*</small></h2>
        <h3 class="mt-4 mt-sm-2" v-if="mode==='edit'"><span class="pre-title">Review finding:</span> <span class="title-finding">{{list.name}}</span></h3>
        <h3 class="mt-4 mt-sm-2" v-if="mode==='view'">&nbsp;</h3>
      </b-container>
    </b-container>
    <b-container>
      <b-row
        v-if="mode==='view'"
        class="d-print-none justify-content-end mb-2 pt-2">
        <b-col
          v-if="mode==='view'"
          cols="12"
          sm="2">
            <b-button
              id="exportButton"
              variant="outline-secondary"
              block
              @click="generateAndDownload('toDoc', 'filename')">
              Export to MS-Word
            </b-button>
        </b-col>
        <b-col
          v-if="mode==='view'"
          cols="12"
          sm="2">
            <b-button
              id="printButton"
              @click="print"
              variant="outline-info"
              block
              v-b-tooltip:printButton.bottom="'If you want to exclude or include the Characteristics of Studies, Methodological Assessments and Extracted Data tables in the file you are about to export or print, click the edit button and adjust your on/off settings for each table. Whatever is on in edit mode will be included in the exported or printed file.'">
              Print or save as PDF
            </b-button>
        </b-col>
        <b-col
          v-if="mode==='view'"
          cols="12"
          sm="2">
            <b-button
              id="editButton"
              @click="changeMode"
              variant="outline-primary"
              v-b-tooltip:editButton.top="'Click to edit'"
              block>
              Edit
            </b-button>
        </b-col>
      </b-row>
      <b-row
        v-if="mode==='edit'">
        <b-col
          class="d-print-none"
          sm="10"
          cols="12"
        ></b-col>
        <b-col
          cols="12"
          sm="2">
            <b-button
              class="mt-2"
              @click="changeMode"
              variant="outline-success"
              block
              v-b-tooltip.hover title="Click to enter view mode where you can export or print">
              Print or Export
            </b-button>
        </b-col>
      </b-row>

      <b-row class="mt-4">
        <b-col cols="12">
          <!--<b-tabs>-->
            <!-- Evidence Profile-->
            <!--<b-tab :title="$t('Evidence Profile')">-->
              <b-modal
                size="xl"
                id="modal-stage-two"
                ref="modal-stage-two"
                :title="$t('Evidence profile') + ' - ' + buffer_modal_stage_two.title"
                scrollable
                @ok="saveStageOneAndTwo"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                  <b-container>
                    <b-row>
                      <b-col
                       cols="12"
                       md="4">
                        <div v-if="buffer_modal_stage_two.type === 'methodological-limitations'">
                          <p class="font-weight-bold">
                            Do you have any concerns about the methodological quality of contributing studies as a whole that could lower your confidence in the review finding?
                          </p>
                          <p class="font-weight-light">
                            <b><u>Remember</u></b> this is an assessment of the whole body of evidence supporting this finding, not an assessment of an individual contributing study.
                            (guidance available <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#Guidance-on-Applying-CERQual`">here</b-link>)
                          </p>
                          <b-form-radio-group
                            v-model="buffer_modal_stage_two.methodological_limitations.option"
                            name="methodological-limitations"
                            stacked>
                            <b-form-radio value="0">
                              No/Very minor concerns <small v-b-tooltip.hover title="No or very minor concerns regarding methodological limitations that are unlikely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="1">
                              Minor concerns <small v-b-tooltip.hover title="Minor concerns regarding methodological limitations that may reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="2">
                              Moderate concerns <small v-b-tooltip.hover title="Moderate concerns regarding methodological limitations that will probably reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="3">
                              Serious concerns <small v-b-tooltip.hover title="Serious concerns regarding methodological limitations that are very likely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                          </b-form-radio-group>
                          <a
                            @click="buffer_modal_stage_two.methodological_limitations.option = null"
                            v-if="buffer_modal_stage_two.methodological_limitations.option !== null"
                            class="mt-2 font-weight-light text-danger">
                            <font-awesome-icon
                              icon="trash"></font-awesome-icon>
                            clear my selection
                          </a>
                          <b-form-group
                            class="mt-4 font-weight-light"
                            label="Explain any concerns you have in your own words."
                            label-for="input-ml-explanation"
                            description="The GRADE-CERQual approach requires you to include an explanation for your judgement.">
                            <b-form-textarea
                              id="input-ml-explanation"
                              v-model="buffer_modal_stage_two.methodological_limitations.explanation"
                              :placeholder="$t('Enter an explanation')"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                          <b-form-group
                            class="mt-2 font-weight-light"
                            label="Notes"
                            label-for="input-ml-notes"
                            description="Optional space for reviewers to leave notes for each other while working on CERQual assessments">
                            <b-form-textarea
                              id="input-ml-notes"
                              v-model="buffer_modal_stage_two.methodological_limitations.notes"
                              :placeholder="$t('Enter a note')"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                        </div>
                        <div v-if="buffer_modal_stage_two.type === 'coherence'">
                          <!-- coherence -->
                          <p class="font-weight-bold">
                            Do you have any concerns about the coherence between the review finding and the underlying data that could lower your confidence in the review finding?
                          </p>
                          <p class="font-weight-light">
                            You may have concerns if some of the data from included studies contradict the review finding, if it’s not clear if some of the underlying data support the review finding, or if there are plausible alternative descriptions, interpretations or explanations that could be used to synthesize the data. (guidance available <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#Guidance-on-Applying-CERQual`">here</b-link>)
                          </p>
                          <p class="font-weight-light">
                            <b><u>Remember</u></b>, coherence is not about the consistency of findings between studies, but is about the fit between the extracted data and the review finding as you have written it.
                          </p>
                          <b-form-radio-group
                            v-model="buffer_modal_stage_two.coherence.option"
                            name="coherence"
                            stacked>
                            <b-form-radio value="0">
                              No/Very minor concerns <small v-b-tooltip.hover title="No or very minor concerns regarding coherence that are unlikely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="1">
                              Minor concerns <small v-b-tooltip.hover title="Minor concerns regarding coherence that may reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="2">
                              Moderate concerns <small v-b-tooltip.hover title="Moderate concerns regarding coherence that will probably reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="3">
                              Serious concerns <small v-b-tooltip.hover title="Serious concerns regarding coherence that are very likely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                          </b-form-radio-group>
                          <a
                            @click="buffer_modal_stage_two.coherence.option = null"
                            v-if="buffer_modal_stage_two.coherence.option !== null"
                            class="mt-2 font-weight-light text-danger">
                            <font-awesome-icon
                              icon="trash"></font-awesome-icon>
                            clear my selection
                          </a>
                          <b-form-group
                            class="mt-4 font-weight-light"
                            label="Explain any concerns in your own words."
                            label-for="input-coherence-explanation"
                            description="The GRADE-CERQual approach requires you to include an explanation for your judgement.">
                            <b-form-textarea
                              id="input-coherence-explanation"
                              v-model="buffer_modal_stage_two.coherence.explanation"
                              :placeholder="$t('Enter an explanation')"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                          <b-form-group
                            class="mt-2 font-weight-light"
                            label="Notes"
                            label-for="input-ml-notes"
                            description="Optional space for reviewers to leave notes for each other while working on CERQual assessments">
                            <b-form-textarea
                              id="input-ml-notes"
                              v-model="buffer_modal_stage_two.coherence.notes"
                              :placeholder="$t('Enter a note')"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                          <!-- adequacy -->
                        </div>
                        <div v-if="buffer_modal_stage_two.type === 'adequacy'">
                          <p class="font-weight-light">
                            <b>Do you have any concerns about the adequacy of the data (richness and /or quantity) supporting the review finding that could lower your confidence in the review finding?</b>
                            (guidance available <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#Guidance-on-Applying-CERQual`">here</b-link>)
                          </p>
                          <b-form-radio-group
                            v-model="buffer_modal_stage_two.adequacy.option"
                            name="adequacy"
                            stacked>
                            <b-form-radio value="0">
                              No/Very minor concerns <small v-b-tooltip.hover title="No or very minor concerns regarding adequacy that are unlikely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="1">
                              Minor concerns <small v-b-tooltip.hover title="Minor concerns regarding adequacy that may reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="2">
                              Moderate concerns <small v-b-tooltip.hover title="Moderate concerns regarding adequacy that will probably reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="3">
                              Serious concerns <small v-b-tooltip.hover title="Serious concerns regarding adequacy that are very likely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                          </b-form-radio-group>
                          <a
                            @click="buffer_modal_stage_two.adequacy.option = null"
                            v-if="buffer_modal_stage_two.adequacy.option !== null"
                            class="mt-2 font-weight-light text-danger">
                            <font-awesome-icon
                              icon="trash"></font-awesome-icon>
                            clear my selection
                          </a>
                          <b-form-group
                            class="mt-4 font-weight-light"
                            label="Explain any concerns in your own words."
                            label-for="input-adequacy-explanation"
                            description="The GRADE-CERQual approach requires you to include an explanation for your judgement.">
                            <b-form-textarea
                              id="input-adequacy-explanation"
                              v-model="buffer_modal_stage_two.adequacy.explanation"
                              placeholder="Enter an explanation"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                          <b-form-group
                            class="mt-2 font-weight-light"
                            label="Notes"
                            label-for="input-ml-notes"
                            description="Optional space for reviewers to leave notes for each other while working on CERQual assessments">
                            <b-form-textarea
                              id="input-ml-notes"
                              v-model="buffer_modal_stage_two.adequacy.notes"
                              :placeholder="$t('Enter a note')"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                          <!-- relevance -->
                        </div>
                        <div v-if="buffer_modal_stage_two.type === 'relevance'">
                          <p class="font-weight-bold">
                            Do you have any concerns about the relevance of the underlying studies to your review question that could lower your confidence in the review finding?
                          </p>
                          <p class="font-weight-light">
                            You may have concerns if some of the underlying data are of indirect relevance, of partial relevance, or if it is unclear whether the underlying data is relevant. (guidance available <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#Guidance-on-Applying-CERQual`">here</b-link>)
                          </p>
                          <b-form-radio-group
                            v-model="buffer_modal_stage_two.relevance.option"
                            name="relevance"
                            stacked>
                            <b-form-radio value="0">
                              No/Very minor concerns <small v-b-tooltip.hover title="No or very minor concerns regarding relevance that are unlikely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="1">
                              Minor concerns <small v-b-tooltip.hover title="Minor concerns regarding relevance that may reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="2">
                              Moderate concerns <small v-b-tooltip.hover title="Moderate concerns regarding relevance that will probably reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="3">
                              Serious concerns <small v-b-tooltip.hover title="Serious concerns regarding relevance that are very likely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                          </b-form-radio-group>
                          <a
                            @click="buffer_modal_stage_two.relevance.option = null"
                            v-if="buffer_modal_stage_two.relevance.option !== null"
                            class="mt-2 font-weight-light text-danger">
                            <font-awesome-icon
                              icon="trash"></font-awesome-icon>
                            clear my selection
                          </a>
                          <b-form-group
                            class="mt-4 font-weight-light"
                            label="Explain any concerns in your own words using the terms indirect, partial or unclear relevance when appropriate."
                            label-for="input-relevance-explanation"
                            description="The GRADE-CERQual approach requires you to include an explanation for your judgement.">
                            <b-form-textarea
                              id="input-relevance-explanation"
                              v-model="buffer_modal_stage_two.relevance.explanation"
                              placeholder="Enter an explanation"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                          <b-form-group
                            class="mt-2 font-weight-light"
                            label="Notes"
                            label-for="input-ml-notes"
                            description="Optional space for reviewers to leave notes for each other while working on CERQual assessments">
                            <b-form-textarea
                              id="input-ml-notes"
                              v-model="buffer_modal_stage_two.relevance.notes"
                              :placeholder="$t('Enter a note')"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                          <!-- CERQual assessment -->
                        </div>
                        <div v-if="buffer_modal_stage_two.type === 'cerqual'">
                          <p class="font-weight-light">
                            To what extent is the review finding a reasonable representation of the phenomenon of interest?
                          </p>
                          <b-form-radio-group
                            v-model="buffer_modal_stage_two.cerqual.option"
                            name="cerqual"
                            stacked>
                            <b-form-radio value="0">
                              High confidence <small v-b-tooltip.hover title="It is highly likely that the review finding is a reasonable representation of the phenomenon of interest">*</small>
                            </b-form-radio>
                            <b-form-radio value="1">
                              Moderate confidence <small v-b-tooltip.hover title="It is likely that the review finding is a reasonable representation of the phenomenon of interest">*</small>
                            </b-form-radio>
                            <b-form-radio value="2">
                              Low confidence <small v-b-tooltip.hover title="It is possible that the review finding is a reasonable representation of the phenomenon of interest">*</small>
                            </b-form-radio>
                            <b-form-radio value="3">
                              Very low confidence <small v-b-tooltip.hover title="It is not clear whether the review finding is a reasonable representation of the phenomenon of interest">*</small>
                            </b-form-radio>
                          </b-form-radio-group>
                          <a
                            @click="buffer_modal_stage_two.cerqual.option = null"
                            v-if="buffer_modal_stage_two.cerqual.option !== null"
                            class="mt-2 font-weight-light text-danger">
                            <font-awesome-icon
                              icon="trash"></font-awesome-icon>
                            clear my selection
                          </a>
                          <b-form-group
                            class="mt-4 font-weight-light"
                            label="Explain your assessment by making reference to any identified concerns for all 4 components of CERQual (methodological limitations, coherence, adequacy, relevance)."
                            label-for="input-cerqual"
                            description="The GRADE-CERQual approach requires you to include an explanation for your judgement.">
                            <b-form-textarea
                              id="input-cerqual"
                              v-model="buffer_modal_stage_two.cerqual.explanation"
                              placeholder="Enter an explanation"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                          <b-form-group
                            class="mt-2 font-weight-light"
                            label="Notes"
                            label-for="input-ml-notes"
                            description="Optional space for reviewers to leave notes for each other while working on CERQual assessments">
                            <b-form-textarea
                              id="input-ml-notes"
                              v-model="buffer_modal_stage_two.cerqual.notes"
                              :placeholder="$t('Enter a note')"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                        </div>
                      </b-col>
                      <b-col
                        cols="12"
                        md="8">
                        <div v-if="buffer_modal_stage_two.type === 'methodological-limitations'">
                          <h4>Methodological Assessments</h4>
                          <b-table
                            class="table-small-font"
                            responsive
                            head-variant="light"
                            outlined
                            :fields="meth_assessments.fieldsObj"
                            :items="meth_assessments.items">
                          </b-table>
                        </div>

                        <div v-if="buffer_modal_stage_two.type === 'coherence'">
                          <h4>Review Finding</h4>
                          <p>{{ list.name }}</p>
                          <h4>Extracted Data</h4>
                          <b-table
                            class="table-small-font extracted-data"
                            responsive
                            head-variant="light"
                            outlined
                            :fields="(mode==='view') ? mode_print_fieldsObj : extracted_data.fieldsObj"
                            :items="extracted_data.items">
                            <template v-slot:cell(column_0)="data">
                              <template
                                v-if="showEditExtractedDataInPlace.display && showEditExtractedDataInPlace.item.index === data.item.index">
                                <b-form-group>
                                  <b-form-textarea
                                    rows="6"
                                    max-rows="100"
                                    v-model="showEditExtractedDataInPlace.item.column_0"></b-form-textarea>
                                </b-form-group>
                              </template>
                              <template
                                v-else>
                                {{ data.item.column_0 }}
                              </template>
                            </template>
                            <template v-slot:cell(actions)="data">
                              <template v-if="showEditExtractedDataInPlace.display && showEditExtractedDataInPlace.item.index === data.item.index">
                                <b-button
                                  block
                                  variant="success"
                                  @click="updateContentExtractedDataItem(data.item.index)">
                                  Save
                                </b-button>
                                <b-button
                                  block
                                  variant="outline-secondary"
                                  @click="cancelExtractedDataInPlace">
                                  Cancel
                                </b-button>
                              </template>
                              <template v-else>
                                <b-button
                                  variant="outline-success"
                                  @click="editExtractedDataInPlace(data.index)">
                                  <font-awesome-icon
                                    icon="edit"
                                    :title="$t('Edit')" />
                                </b-button>
                              </template>
                            </template>
                          </b-table>
                        </div>

                        <div v-if="buffer_modal_stage_two.type === 'adequacy'">
                          <h4>Characteristics of Studies</h4>
                          <b-table
                            class="table-small-font"
                            responsive
                            head-variant="light"
                            outlined
                            :fields="characteristics_studies.fieldsObj"
                            :items="characteristics_studies.items">
                          </b-table>
                          <h4>Extracted Data</h4>
                          <b-table
                            class="table-small-font extracted-data"
                            responsive
                            head-variant="light"
                            outlined
                            :fields="(mode==='view') ? mode_print_fieldsObj : extracted_data.fieldsObj"
                            :items="extracted_data.items">
                            <template v-slot:cell(column_0)="data">
                              <template
                                v-if="showEditExtractedDataInPlace.display && showEditExtractedDataInPlace.item.index === data.item.index">
                                <b-form-group>
                                  <b-form-textarea
                                    rows="6"
                                    max-rows="100"
                                    v-model="showEditExtractedDataInPlace.item.column_0"></b-form-textarea>
                                </b-form-group>

                              </template>
                              <template
                                v-else>
                                {{ data.item.column_0 }}
                              </template>
                            </template>
                            <template v-slot:cell(actions)="data">
                              <template v-if="showEditExtractedDataInPlace.display && showEditExtractedDataInPlace.item.index === data.item.index">
                                <b-button
                                  block
                                  variant="success"
                                  @click="updateContentExtractedDataItem(data.item.index)">
                                  Save
                                </b-button>
                                <b-button
                                  block
                                  variant="outline-secondary"
                                  @click="cancelExtractedDataInPlace">
                                  Cancel
                                </b-button>
                              </template>
                              <template v-else>
                                <b-button
                                  variant="outline-success"
                                  @click="editExtractedDataInPlace(data.index)">
                                  <font-awesome-icon
                                    icon="edit"
                                    :title="$t('Edit')" />
                                </b-button>
                              </template>
                            </template>
                          </b-table>
                        </div>

                        <div v-if="buffer_modal_stage_two.type === 'relevance'">
                          <h4>Review Question</h4>
                          <p>{{ project.review_question }}</p>
                          <h4>Inclusion criteria</h4>
                          <p>{{ project.inclusion }}</p>
                          <h4>Exclusion criteria</h4>
                          <p>{{ project.exclusion }}</p>
                          <h4>Characteristics of Studies</h4>
                          <b-table
                            class="table-small-font"
                            responsive
                            head-variant="light"
                            outlined
                            :fields="characteristics_studies.fieldsObj"
                            :items="characteristics_studies.items">
                          </b-table>
                        </div>

                        <div v-if="buffer_modal_stage_two.type === 'cerqual'">
                          <h5>Methodological limitations</h5>
                          <p>
                            <b>{{select_options[evidence_profile[0].methodological_limitations.option].text}}</b>
                            <br>
                            Explanation: <span v-if="evidence_profile[0].methodological_limitations.explanation">{{evidence_profile[0].methodological_limitations.explanation}}</span> <span v-else>Explanation not yet added</span>
                          </p>
                          <h5>Coherence</h5>
                          <p>
                            <b>{{select_options[evidence_profile[0].coherence.option].text}}</b>
                            <br>
                            Explanation: <span v-if="evidence_profile[0].coherence.explanation">{{evidence_profile[0].coherence.explanation}}</span> <span v-else>Explanation not yet added</span>
                          </p>
                          <h5>Adequacy</h5>
                          <p>
                            <b>{{select_options[evidence_profile[0].adequacy.option].text}}</b>
                            <br>
                            Explanation: <span v-if="evidence_profile[0].adequacy.explanation">{{evidence_profile[0].adequacy.explanation}}</span> <span v-else>Explanation not yet added</span>
                          </p>
                          <h5>Relevance</h5>
                          <p>
                            <b>{{select_options[evidence_profile[0].relevance.option].text}}</b>
                            <br>
                            Explanation: <span v-if="evidence_profile[0].relevance.explanation">{{evidence_profile[0].relevance.explanation}}</span> <span v-else>Explanation not yet added</span>
                          </p>
                        </div>
                      </b-col>
                    </b-row>
                  </b-container>

              </b-modal>

              <div
                v-if="mode==='edit'"
                class="d-print-none">
                <b-card>
                  <h5>Progress status <span v-b-tooltip.hover title="This progress bar shows you how far along you are in making your CERQual assessment of confidence. You have 5 assessments to make in total. Firstly, an assessment for each of the 4 CERQual components, and lastly the overall assessment.">*</span></h5>
                  <p v-if="list.cerqual.option !== null">
                    Your CERQual assessment has been added to the iSoQf for this finding. Click “return to iSoQf table” above to view it
                  </p>
                  <b-progress
                    :max="status_evidence_profile.max"
                    :variant="status_evidence_profile.variant"
                    show-progress
                    class="mb-3">
                    <b-progress-bar :value="status_evidence_profile.value" :label="`${status_evidence_profile.value}%`"></b-progress-bar>
                  </b-progress>
                </b-card>
              </div>

              <template v-if="evidence_profile.length">
                <h3 class="mt-4">Evidence Profile</h3>
                <b-table
                  class="d-print-none"
                  v-if="mode==='edit'"
                  id="assessments"
                  responsive
                  bordered
                  head-variant="light"
                  :fields="evidence_profile_fields"
                  :items="evidence_profile"
                  :filter="evidence_profile_table_settings.filter"
                  :busy="evidence_profile_table_settings.isBusy">
                  <template v-slot:head(isoqf_id)="data">
                    <span v-b-tooltip.hover title="Automatic numbering of summarized review findings">{{data.label}}</span>
                  </template>
                  <template v-slot:head(methodological-limit)="data">
                    <span v-b-tooltip.hover title="The extent to which there are concerns about the design or conduct of the primary studies that contributed evidence to an individual review finding">{{data.label}}</span>
                  </template>
                  <template v-slot:head(coherence)="data">
                    <span v-b-tooltip.hover title="An assessment of how clear and cogent the fit is between the data from the primary studies and a review finding that synthesises that data. By ‘cogent’, we mean well supported or compelling">{{data.label}}</span>
                  </template>
                  <template v-slot:head(adequacy)="data">
                    <span v-b-tooltip.hover title="An overall determination of the degree of richness and quantity of data supporting a review finding">{{data.label}}</span>
                  </template>
                  <template v-slot:head(relevance)="data">
                    <span v-b-tooltip.hover title="The extent to which the body of evidence from the primary studies supporting a review finding is applicable to the context (perspective or population, phenomenon of interest, setting) specified in the review question">{{data.label}}</span>
                  </template>
                  <template v-slot:head(cerqual)="data">
                    <span v-b-tooltip.hover title="Assessment of the extent to which a review finding is a reasonable representation of the phenomenon of interest">{{data.label}}</span>
                  </template>
                  <template v-slot:head(references)="data">
                    <span v-b-tooltip.hover title="Studies that contribute to this review finding">{{data.label}}</span>
                  </template>
                  <!-- content -->
                  <template v-slot:cell(isoqf_id)="data">
                    {{data.item.isoqf_id}}
                  </template>
                  <template v-slot:cell(methodological-limit)="data">
                    <div v-if="data.item.methodological_limitations.option !== null">
                      <b-button
                        block
                        class="d-print-none mb-3"
                        variant="outline-info"
                        @click="editStageTwo(data.item, 'methodological-limitations')">
                        Edit
                        <font-awesome-icon
                          v-if="data.item.methodological_limitations.notes"
                          icon="comments"></font-awesome-icon>
                      </b-button>
                      <p><b>{{select_options[data.item.methodological_limitations.option].text}}</b></p>
                      <p v-if="data.item.methodological_limitations.explanation">Explanation: {{data.item.methodological_limitations.explanation}}</p>
                      <p v-else class="text-muted font-weight-light">
                        <span
                          v-b-tooltip.hover
                          title="Provide an explanation for your assessment"
                          variant="info">Explanation not yet added</span>
                      </p>
                    </div>
                    <div v-else>
                      <b-button
                        block
                        class="d-print-none"
                        variant="info"
                        @click="editStageTwo(data.item, 'methodological-limitations')">
                        Assessment not completed
                        <font-awesome-icon
                          v-if="data.item.methodological_limitations.notes"
                          icon="comments"></font-awesome-icon>
                      </b-button>
                    </div>
                  </template>
                  <template v-slot:cell(coherence)="data">
                    <div v-if="data.item.coherence.option !== null">
                      <b-button
                        block
                        class="d-print-none mb-3"
                        variant="outline-info"
                        @click="editStageTwo(data.item, 'coherence')">
                        Edit
                        <font-awesome-icon
                          v-if="data.item.coherence.notes"
                          icon="comments"></font-awesome-icon>
                      </b-button>
                      <p><b>{{select_options[data.item.coherence.option].text}}</b></p>
                      <p v-if="data.item.coherence.explanation">Explanation: {{data.item.coherence.explanation}}</p>
                      <p v-else class="text-muted font-weight-light">
                        <span
                          v-b-tooltip.hover
                          title="Provide an explanation for your assessment"
                          variant="info">Explanation not yet added</span>
                      </p>
                    </div>
                    <div v-else>
                      <b-button
                        block
                        class="d-print-none"
                        variant="info"
                        @click="editStageTwo(data.item, 'coherence')">
                        Assessment not completed
                        <font-awesome-icon
                          v-if="data.item.coherence.notes"
                          icon="comments"></font-awesome-icon>
                      </b-button>
                    </div>
                  </template>
                  <template v-slot:cell(adequacy)="data">
                    <div v-if="data.item.adequacy.option !== null">
                      <b-button
                        block
                        class="d-print-none mb-3"
                        variant="outline-info"
                        @click="editStageTwo(data.item, 'adequacy')">
                        Edit
                        <font-awesome-icon
                          v-if="data.item.adequacy.notes"
                          icon="comments"></font-awesome-icon>
                      </b-button>
                      <p><b>{{select_options[data.item.adequacy.option].text}}</b></p>
                      <p v-if="data.item.adequacy.explanation">Explanation: {{data.item.adequacy.explanation}}</p>
                      <p v-else class="text-muted font-weight-light">
                        <span
                          v-b-tooltip.hover
                          title="Provide an explanation for your assessment"
                          variant="info">Explanation not yet added</span>
                      </p>
                    </div>
                    <div v-else>
                      <b-button
                        block
                        class="d-print-none"
                        variant="info"
                        @click="editStageTwo(data.item, 'adequacy')">
                        Assessment not completed
                        <font-awesome-icon
                          v-if="data.item.adequacy.notes"
                          icon="comments"></font-awesome-icon>
                      </b-button>
                    </div>
                  </template>
                  <template v-slot:cell(relevance)="data">
                    <div v-if="data.item.relevance.option !== null">
                      <b-button
                        block
                        class="d-print-none mb-3"
                        variant="outline-info"
                        @click="editStageTwo(data.item, 'relevance')">
                        Edit
                        <font-awesome-icon
                          v-if="data.item.relevance.notes"
                          icon="comments"></font-awesome-icon>
                      </b-button>
                      <p><b>{{select_options[data.item.relevance.option].text}}</b></p>
                      <p v-if="data.item.relevance.explanation">Explanation: {{data.item.relevance.explanation}}</p>
                      <p v-else class="text-muted font-weight-light">
                        <span
                          v-b-tooltip.hover
                          title="Provide an explanation for your assessment"
                          variant="info">Explanation not yet added</span>
                      </p>
                    </div>
                    <div v-else>
                      <b-button
                        block
                        class="d-print-none"
                        variant="info"
                        @click="editStageTwo(data.item, 'relevance')">
                        Assessment not completed
                        <font-awesome-icon
                          v-if="data.item.relevance.notes"
                          icon="comments"></font-awesome-icon>
                      </b-button>
                    </div>
                  </template>
                  <template v-slot:cell(cerqual)="data">
                    <div v-if="data.item.cerqual.option !== null">
                      <b-button
                        block
                        class="d-print-none mb-3"
                        variant="outline-info"
                        @click="editStageTwo(data.item, 'cerqual')">
                        Edit
                        <font-awesome-icon
                          v-if="data.item.cerqual.notes"
                          icon="comments"></font-awesome-icon>
                      </b-button>
                      <p><b>{{level_confidence[data.item.cerqual.option].text}}</b></p>
                      <p v-if="data.item.cerqual.explanation">Explanation: {{data.item.cerqual.explanation}}</p>
                      <p v-else class="text-muted font-weight-light">
                        <span
                          v-b-tooltip.hover
                          title="Provide an explanation for your assessment"
                          variant="info">Explanation not yet added</span>
                      </p>
                    </div>
                    <div v-else>
                      <b-button
                        v-if="data.item.methodological_limitations.option && data.item.coherence.option && data.item.adequacy.option && data.item.relevance.option"
                        block
                        class="d-print-none"
                        variant="info"
                        @click="editStageTwo(data.item, 'cerqual')">
                        Assessment not completed
                        <font-awesome-icon
                          v-if="data.item.cerqual.notes"
                          icon="comments"></font-awesome-icon>
                      </b-button>
                    </div>
                  </template>
                  <template v-slot:cell(references)="data">
                    <b-button
                      block
                      class="d-print-none mb-3"
                      variant="outline-info"
                      @click="openModalReferences">
                      View or Edit references
                    </b-button>
                    There are <b>{{ data.item.references.length }}</b> references.
                  </template>
                  <template v-slot:table-busy>
                    <div class="text-center text-danger my-2">
                      <b-spinner class="align-middle"></b-spinner>
                      <strong>Loading...</strong>
                    </div>
                  </template>
                </b-table>
                <!-- display table in print mode -->
                <b-table
                  class="toDoc"
                  v-if="mode==='view'"
                  id="assessments-print"
                  responsive striped caption-top
                  :fields="evidence_profile_fields_print_version"
                  :items="evidence_profile"
                  :filter="evidence_profile_table_settings.filter">
                  <template v-slot:head(isoqf_id)="data">
                    {{data.label}}
                  </template>
                  <template v-slot:head(name)="data">
                    {{data.label}}
                  </template>
                  <template v-slot:head(methodological-limit)="data">
                    {{data.label}}
                  </template>
                  <template v-slot:head(coherence)="data">
                    {{data.label}}
                  </template>
                  <template v-slot:head(adequacy)="data">
                    {{data.label}}
                  </template>
                  <template v-slot:head(relevance)="data">
                    {{data.label}}
                  </template>
                  <template v-slot:head(cerqual)="data">
                    {{data.label}}
                  </template>
                  <template v-slot:head(references)="data">
                    {{data.label}}
                  </template>
                  <template v-slot:cell(isoqf_id)="data">
                    {{data.item.isoqf_id}}
                  </template>
                  <template v-slot:cell(finding)="data">
                    {{data.item.name}}
                  </template>
                  <template v-slot:cell(methodological-limit)="data">
                    <div v-if="data.item.methodological_limitations.option !== null">
                      <p><b>{{select_options[data.item.methodological_limitations.option].text}}</b></p>
                      <p v-if="data.item.methodological_limitations.explanation">Explanation: {{data.item.methodological_limitations.explanation}}</p>
                    </div>
                  </template>
                  <template v-slot:cell(coherence)="data">
                    <div v-if="data.item.coherence.option !== null">
                      <p><b>{{select_options[data.item.coherence.option].text}}</b></p>
                      <p v-if="data.item.coherence.explanation">Explanation: {{data.item.coherence.explanation}}</p>
                    </div>
                  </template>
                  <template v-slot:cell(adequacy)="data">
                    <div v-if="data.item.adequacy.option !== null">
                      <p><b>{{select_options[data.item.adequacy.option].text}}</b></p>
                      <p v-if="data.item.adequacy.explanation">Explanation: {{data.item.adequacy.explanation}}</p>
                    </div>
                  </template>
                  <template v-slot:cell(relevance)="data">
                    <div v-if="data.item.relevance.option !== null">
                      <p><b>{{select_options[data.item.relevance.option].text}}</b></p>
                      <p v-if="data.item.relevance.explanation">Explanation: {{data.item.relevance.explanation}}</p>
                    </div>
                  </template>
                  <template v-slot:cell(cerqual)="data">
                    <div v-if="data.item.cerqual.option !== null">
                      <p><b>{{level_confidence[data.item.cerqual.option].text}}</b></p>
                      <p v-if="data.item.cerqual.explanation">Explanation: {{data.item.cerqual.explanation}}</p>
                    </div>
                  </template>
                  <template v-slot:cell(references)="data">
                    <p
                      class="reference-txt">
                      {{data.value}}
                    </p>
                  </template>
                </b-table>

                <b-modal
                  id="modalReferences"
                  ref="modalReferences"
                  title="References"
                  size="xl"
                  scrollable
                  @ok="saveReferencesList">
                  <b-alert
                    v-if="list.cerqual.option"
                    show
                    variant="danger">
                    <b>Warning!</b> By removing a reference you are modifying the underlining evidence base for this finding and will need to review your CERQual assessments. If you remove the reference, the extracted data you inputted from this study to support this finding will be deleted from the GRADE-CERQual Assessment Worksheet.
                  </b-alert>
                  <b-table
                    striped
                    responsive
                    :fields="[{key: 'checkbox', label: ''}, {key: 'content', label:'Author(s), Year, Title'}]"
                    :items="refsWithTitle">
                    <template v-slot:cell(checkbox)="data">
                      <b-form-checkbox
                        :id="`checkbox-${data.index}`"
                        v-model="list.references"
                        :name="`checkbox-${data.index}`"
                        :value="data.item.id">
                      </b-form-checkbox>
                    </template>
                  </b-table>
                </b-modal>
              </template>
              <template v-else>
                <div class="text-center my-5">
                  <p>
                    {{ $t('No evidence profile has been created') }} <b-link v-b-modal.modal-stage-two>{{ $t('add a evidence profile') }}</b-link>
                  </p>
                </div>
              </template>

            <div
              class="mt-5"
              v-if="show.selected.includes('cs')">
              <h3 class="toDoc">
                {{ $t('Characteristics of Studies') }} <small v-if="mode === 'edit'" class="d-print-none" v-b-tooltip.hover title="Descriptive information extracted from the contributing studies (e.g. country, participants, topic, setting, etc.)">*</small>
              </h3>
              <p class="d-print-none font-weight-light">
                To add data or make changes to this table do so in the
                <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#My-Data`">My Data</b-link>
                section of iSoQf
              </p>
              <template v-if="characteristics_studies.fields.length">
                <bc-filters
                  v-if="mode==='edit' && characteristics_studies.items.length"
                  class="d-print-none"
                  idname="chars-of-studies-filter"
                  :tableSettings="characteristics_studies_table_settings"
                  type="chars_of_studies"
                  :fields="characteristics_studies.fields"
                  :items="characteristics_studies.items">
                </bc-filters>
                <b-table
                  id="characteristics"
                  responsive
                  head-variant="light"
                  outlined
                  :fields="characteristics_studies.fieldsObj"
                  :items="characteristics_studies.items"
                  :filter="characteristics_studies_table_settings.filter"
                  class="mb-5 toDoc">
                  <template
                    v-if="characteristics_studies.tableTop.length"
                    v-slot:thead-top>
                    <b-tr>
                      <b-th></b-th>
                      <b-th
                        v-for="(value, index) of characteristics_studies.tableTop"
                        :key="index"
                        :colspan="value.colspan"
                        class="text-center">
                        {{ value.label }}
                      </b-th>
                    </b-tr>
                  </template>
                  <template v-slot:cell(actions)="row">
                    <font-awesome-icon
                      @click="modalDeleteCharsOfStudiesItemData(row)"
                      icon="trash"
                      title="Remove"/>
                    <font-awesome-icon
                      @click="openModalCharsOfStudiesditData(row)"
                      icon="edit"
                      title="Edit" />
                  </template>
                </b-table>

                <b-modal
                  size="xl"
                  title="Edit data"
                  ref="modal-stage-three-edit-data"
                  @ok="saveCharsOfStudiesEditedData">
                  <b-form-group
                    v-for="(field, index) in buffer_characteristics_studies.fields"
                    :key="index"
                    :label="`${field.label}`"
                    :label-for="`data-${index}`">
                    <b-form-input
                      :id="`data-${index}`"
                      v-if="field.key === 'ref_id' || field.key === 'authors'"
                      :disabled="(field.key === 'ref_id' || field.key === 'authors') ? true : false"
                      v-model="modal_stage_three_data[field.key]"></b-form-input>
                    <b-form-textarea
                      :id="`data-${index}`"
                      v-if="field.key !== 'ref_id' && field.key !== 'authors'"
                      v-model="modal_stage_three_data[field.key]"
                      rows="6"
                      max-rows="100"></b-form-textarea>
                    <b-form-textarea
                      :id="`data-${index}`"
                      rows="6"
                      max-rows="100"
                      v-model="modal_stage_three_data[field.key]"></b-form-textarea>
                  </b-form-group>
                </b-modal>
                <b-modal
                  title="Remove data content"
                  @ok="removeCharsOfStudiesItemData"
                  ref="modal-stage-three-remove-data"
                  scrollable
                  size="xl">
                  <p>Are you sure you want to delete all the content for this row?</p>
                  <b-table
                    responsive
                    :fields="buffer_modal_stage_three.fields"
                    :items="buffer_modal_stage_three.data"
                    class="mb-5">
                  </b-table>
                </b-modal>
              </template>
            </div>
            <!--</b-tab>-->
            <!-- Methodological Assessments -->
            <!--<b-tab :title="$t('Methodological Assessments')">-->
            <div
              class="mt-5 mb-5"
              v-if="show.selected.includes('ma')">
              <h3 class="toDoc">
                {{ $t('Methodological Assessments') }} <small v-if="mode === 'edit'" class="d-print-none" v-b-tooltip.hover title="Table with your methodological assessments of each contributing study using an existing quality/critical appraisal tool (e.g. CASP)">*</small>
              </h3>
              <p class="d-print-none font-weight-light">To add data or make changes to this table do so in the <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#My-Data`">My Data</b-link> section of iSoQf</p>
              <template v-if="meth_assessments.fields.length">
                <bc-filters
                  v-if="mode==='edit' && meth_assessments.items.length"
                  class="d-print-none"
                  idname="meth-assessments-filter"
                  :tableSettings="methodological_assessments_table_settings"
                  type="meth_assessments"
                  :fields="meth_assessments.fields"
                  :items="meth_assessments.items">
                </bc-filters>
                <b-table
                  class="toDoc"
                  id="methodological"
                  responsive
                  head-variant="light"
                  outlined
                  :fields="meth_assessments.fieldsObj"
                  :items="meth_assessments.items"
                  :filter="methodological_assessments_table_settings.filter">
                  <template v-slot:cell(actions)="row">
                    <font-awesome-icon icon="trash" @click="openModalRemoveDataMethAssessments(row)" :title="$t('Remove')" />
                    <font-awesome-icon icon="edit" @click="openModalEditDataMethAssessments(row)" :title="$t('Edit')" />
                  </template>
                </b-table>

                <b-modal
                  size="xl"
                  ref="modal-edit-data-stage-four"
                  title="Edit data"
                  @ok="saveUpdateDataMethAssessments">
                  <b-form-group
                    v-for="(field, index) in buffer_modal_meth_assessments_fields"
                    :key="index"
                    :label="`${field.label}`"
                    :label-for="`column-${index}`">
                    <b-form-textarea
                      :id="`column-${index}`"
                      v-model="modal_meth_assessments_data[field.key]"
                      rows="6"
                      max-rows="100"></b-form-textarea>
                  </b-form-group>
                </b-modal>
                <b-modal
                  @ok="removeDataMethAssessments"
                  ref="modal-remove-data-stage-four"
                  title="Remove data content"
                  scrollable
                  size="xl">
                  <p>Are you sure you want to delete all the content for this row?</p>
                  <b-table
                    :fields="buffer_meth_assessments_remove_item.fields"
                    :items="buffer_meth_assessments_remove_item.items"></b-table>
                </b-modal>
                <!-- end of -->
              </template>
            </div>

            <div
              class="mt-3"
              v-if="show.selected.includes('ed')">
              <h3 class="toDoc">
                {{ $t('Extracted Data') }} <small v-if="mode==='edit'" class="d-print-none" v-b-tooltip.hover title="Data extracted from each of the contributing studies.">*</small>
              </h3>
              <template v-if="extracted_data.fields.length">
                <bc-filters
                  v-if="mode==='edit'"
                  class="d-print-none"
                  idname="extracted-data-filter"
                  :tableSettings="extracted_data_table_settings"
                  type="extracted_data"
                  :fields="mode_print_fieldsObj"
                  :items="extracted_data.items">
                </bc-filters>
                <b-table
                  class="toDoc"
                  :id="(mode==='view') ? 'extracted-view' : 'extracted'"
                  responsive
                  head-variant="light"
                  outlined
                  :filter="extracted_data_table_settings.filter"
                  :fields="(mode==='view') ? mode_print_fieldsObj : extracted_data.fieldsObj"
                  :items="extracted_data.items"
                  :current-page="extracted_data_table_settings.currentPage">
                  <template
                    v-if="mode==='edit'"
                    v-slot:cell(actions)="data">
                    <b-button
                      class="d-print-none"
                      @click="openModalExtractedDataEditDataItem(data)"
                      variant="outline-success">
                      <font-awesome-icon
                        icon="edit"
                        :title="$t('Edit')" />
                    </b-button>
                    <b-button
                      class="d-print-none"
                      @click="openModalExtractedDataRemoveDataItem(data)"
                      variant="outline-danger">
                      <font-awesome-icon
                        icon="trash"
                        :title="$t('Remove')" />
                    </b-button>
                  </template>
                </b-table>
                <b-modal
                  id="modal-extracted-data-remove-data-item"
                  ref="modal-extracted-data-remove-data-item"
                  title="Remove data content"
                  @ok="extractedDataRemoveDataItem"
                  ok-variant="outline-success"
                  cancel-variant="outline-secondary">
                  <p>Are you sure you want to delete all the content for this row?</p>
                </b-modal>
                <b-modal
                  size="xl"
                  title="Edit data"
                  id="modal-extracted-data-data"
                  ref="modal-extracted-data-data"
                  @ok="saveDataExtractedData"
                  cancel-variant="outline-secondary"
                  ok-variant="outline-success"
                  ok-title="Save">
                  <b-form-group
                    v-for="(field, index) in buffer_extracted_data.fields"
                    :key="index"
                    :id="`label-field-${index}`"
                    :label="(field.key === 'column_0') ? 'Add the extracted data from this study that supports the review finding' : ''"
                    :label-for="`input-field-${index}`">
                    <b-form-textarea
                      :id="`input-field-${index}`"
                      v-if="field.key !== 'ref_id' && field.key !== 'authors'"
                      v-model="buffer_extracted_data_items[field.key]"
                      rows="6"
                      max-rows="100"></b-form-textarea>
                  </b-form-group>
                </b-modal>
              </template>
              <!--
              <template v-else>
                <p class="d-print-none font-weight-light">
                  To create or make changes to the column headings for this table, do so in the <b-link :to="`/organization/${list.organization}/project/${list.project_id}#My-Data`">My Data</b-link> section of iSoQf, once your headings are created you will be able to add the Extracted Data here.
                </p>
              </template>
              -->
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
import draggable from 'vuedraggable'

export default {
  components: {
    'bc-filters': bCardFilters,
    'bc-action-table': bCardActionTable,
    draggable
  },
  data () {
    return {
      project: {},
      /** filters **/
      nroOfRows: 1,
      evidence_profile_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100],
        isBusy: false
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
        selected: ['cs', 'ma', 'ed'],
        options: [
          { text: 'Characteristics Studies', value: 'cs' },
          { text: 'Methodological Assessments', value: 'ma' },
          { text: 'Extracted Data', value: 'ed' }
        ]
      },
      /** filters **/
      /** selectors **/
      select_options: [
        { value: 0, text: 'No/Very minor concerns' },
        { value: 1, text: 'Minor concerns' },
        { value: 2, text: 'Moderate concerns' },
        { value: 3, text: 'Serious concerns' },
        { value: null, text: 'Undefined' }
      ],
      level_confidence: [
        { value: 0, text: 'High confidence' },
        { value: 1, text: 'Moderate confidence' },
        { value: 2, text: 'Low confidence' },
        { value: 3, text: 'Very low confidence' },
        { value: null, text: 'Undefined' }
      ],
      /** selectors **/
      /** tables fields **/
      evidence_profile_fields: [
        { key: 'isoqf_id', label: '#' },
        { key: 'methodological-limit', label: 'Methodological limitations' },
        { key: 'coherence', label: 'Coherence' },
        { key: 'adequacy', label: 'Adequacy' },
        { key: 'relevance', label: 'Relevance' },
        { key: 'cerqual', label: 'CERQual Assessment of confidence' },
        { key: 'references', label: 'References' }
        /*
        {key: 'actions', label: 'Actions'}
        */
      ],
      evidence_profile_fields_print_version: [
        { key: 'isoqf_id', label: '#' },
        { key: 'name', label: 'Summarized review finding' },
        { key: 'methodological-limit', label: 'Methodological limitations' },
        { key: 'coherence', label: 'Coherence' },
        { key: 'adequacy', label: 'Adequacy' },
        { key: 'relevance', label: 'Relevance' },
        { key: 'cerqual', label: 'CERQual Assessment of confidence' },
        {
          key: 'references',
          label: 'References',
          formatter: value => {
            let references = ''
            for (let item of value) {
              for (let reference of this.references) {
                if (item === reference.id) {
                  references = references.concat(reference.content)
                }
              }
            }
            return references
          }
        }
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
      buffer_modal_stage_two: {
        methodological_limitations: {option: null, explanation: '', notes: '', title: 'a'},
        coherence: {option: null, explanation: '', notes: '', title: 'b'},
        adequacy: {option: null, explanation: '', notes: '', title: 'c'},
        relevance: {option: null, explanation: '', notes: '', title: 'd'},
        cerqual: {option: null, explanation: '', notes: '', title: 'e'}
      },
      buffer_modal_stage_three: {
        fields: [],
        data: []
      },
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
        },
        cerqual: {},
        references: []
      },
      buffer_meth_assessments: {
        nroOfColumns: 1,
        fields: [],
        items: []
      },
      buffer_meth_assessments_remove_item: {
        fields: [],
        items: []
      },
      buffer_meth_assessments_data: {
        fields: []
      },
      meth_assessments: {
        nroOfColumns: 1,
        fields: [],
        items: []
      },
      soqf: {},
      evidence_profile: [],
      status_evidence_profile: {
        value: 0,
        max: 100,
        variant: 'primary'
      },
      characteristics_studies: {
        fields: [],
        items: []
      },
      buffer_characteristics_studies: {},
      modal_stage_three_data: {},
      modal_meth_assessments_data: {},
      buffer_modal_meth_assessments_fields: {},
      extracted_data: {
        id: null,
        fields: [],
        items: [],
        fieldsObj: []
      },
      tmpExtractedDataFields: [
        { key: 'column_0', label: '' }
      ],
      importUrl: '',
      references: [],
      refsWithTitle: [],
      mode: 'edit',
      mode_print_fieldsObj: [],
      findings: null,
      showEditExtractedDataInPlace: {
        display: false,
        item: { authors: '', column_0: '', ref_id: null }
      }
    }
  },
  mounted () {
    this.getList()
  },
  methods: {
    changeMode: function () {
      this.mode = (this.mode === 'edit') ? 'view' : 'edit'
    },
    print: function () {
      window.print()
    },
    parseReference: (reference, onlyAuthors = false, hasSemicolon = true) => {
      let result = ''
      const semicolon = hasSemicolon ? '; ' : ''
      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        if (reference.authors.length < 1) {
          result = 'no autho(s)'
        } else if (reference.authors.length === 1) {
          result = reference.authors[0].split(',')[0] + ' ' + reference.publication_year + semicolon
        } else if (reference.authors.length === 2) {
          result = reference.authors[0].split(',')[0] + ' & ' + reference.authors[1].split(',')[0] + ' ' + reference.publication_year + semicolon
        } else {
          result = reference.authors[0].split(',')[0] + ' et al. ' + reference.publication_year + semicolon
        }
        if (!onlyAuthors) {
          result = result + reference.title
        }
        return result
      } else {
        return result
      }
    },
    openModalReferences: function () {
      this.$refs['modalReferences'].show()
    },
    getAllReferences: function () {
      axios.get(`/api/isoqf_references?organization=${this.list.organization}&project_id=${this.list.project_id}`)
        .then((response) => {
          let _references = response.data
          // this.references = response.data
          let _refs = []
          let _refsWithTitles = []
          for (let reference of _references) {
            _refs.push({'id': reference.id, 'content': this.parseReference(reference, true)})
            _refsWithTitles.push({'id': reference.id, 'content': this.parseReference(reference, false)})
          }

          this.references = _refs.sort((a, b) => a.content.localeCompare(b.content))
          this.refsWithTitle = _refsWithTitles.sort((a, b) => a.content.localeCompare(b.content))
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    saveReferencesList: function () {
      this.evidence_profile_table_settings.isBusy = true
      const params = {
        references: this.list.references
      }
      axios.patch(`/api/isoqf_lists/${this.list.id}`, params)
        .then((response) => {
          this.updateReferencesInFindings()
        })
    },
    updateReferencesInFindings: function () {
      let params = {
        'evidence_profile.references': this.list.references
      }
      axios.patch(`/api/isoqf_findings/${this.findings.id}`, params)
        .then((response) => {
          this.getList()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getList: function () {
      axios.get(`/api/isoqf_lists/${this.$route.params.id}`)
        .then((response) => {
          this.list = JSON.parse(JSON.stringify(response.data))
          this.list.sources = []
          this.evidence_profile = []
          this.extracted_data = {
            fields: [],
            items: []
          }
          this.getProject(this.list.project_id)
          this.getAllReferences()
          this.getStageOneData()
          this.getCharsOfStudies()
          this.getMethAssessments()
          this.evidence_profile_table_settings.isBusy = false
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getProject: function (projectId) {
      axios.get(`/api/isoqf_projects/${projectId}`)
        .then((response) => {
          this.project = response.data
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    renderReference: function (reference) {
      let authors = ''
      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        if (reference.authors.length === 1) {
          authors = reference.authors[0] + '. ' + reference.publication_year + '; '
        } else if (reference.authors.length < 3) {
          authors = reference.authors[0] + ', ' + reference.authors[1] + '. ' + reference.publication_year + '; '
        } else {
          authors = reference.authors[0] + ' et al., ' + reference.publication_year + '; '
        }
      }
      return authors
    },
    getReferences: function () {
      let promises = []
      for (let ref of this.list.references) {
        promises.push(axios.get(`/api/isoqf_references/${ref}`))
      }
      axios.all(promises)
        .then(axios.spread((...responses) => {
          let authors = []
          for (let response of responses) {
            const reference = response.data

            authors.push(this.renderReference(reference))
          }
          this.evidence_profile = [Object.assign({}, this.evidence_profile, { references: authors })]
        }))
        .catch((error) => {
          this.printErrors(error)
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
            this.findings = JSON.parse(JSON.stringify(response.data[0]))
            this.evidence_profile = []
            if (Object.prototype.hasOwnProperty.call(this.findings, 'evidence_profile')) {
              this.evidence_profile.push(this.findings.evidence_profile)
            }
          }
          this.getStatus()
          this.getExtractedData()
          this.evidence_profile_table_settings.isBusy = false
        }).catch((error) => {
          this.printErrors(error)
        })
    },
    getStatus: function () {
      this.status_evidence_profile.value = 0
      if (this.evidence_profile[0].methodological_limitations.option !== null) {
        this.status_evidence_profile.value = this.status_evidence_profile.value + 20
      }
      if (this.evidence_profile[0].coherence.option !== null) {
        this.status_evidence_profile.value = this.status_evidence_profile.value + 20
      }
      if (this.evidence_profile[0].adequacy.option !== null) {
        this.status_evidence_profile.value = this.status_evidence_profile.value + 20
      }
      if (this.evidence_profile[0].relevance.option !== null) {
        this.status_evidence_profile.value = this.status_evidence_profile.value + 20
      }
      if (this.evidence_profile[0].cerqual.option !== null) {
        this.status_evidence_profile.value = this.status_evidence_profile.value + 20
      }
      if (this.status_evidence_profile.value <= 40) {
        this.status_evidence_profile.variant = 'danger'
      }
      if (this.status_evidence_profile.value > 40 && this.status_evidence_profile.value <= 80) {
        this.status_evidence_profile.variant = 'warning'
      }
      if (this.status_evidence_profile.value === 100) {
        this.status_evidence_profile.variant = 'success'
      }
    },
    saveListName: function () {
      let params = {
        organization: this.list.organization,
        // name: this.buffer_modal_stage_one.name,
        cerqual: this.buffer_modal_stage_two.cerqual
      }
      axios.patch(`/api/isoqf_lists/${this.$route.params.id}`, params)
        .then((response) => {
          this.list.cerqual = response.data['$set'].cerqual
          this.list.name = this.buffer_modal_stage_one.name
          this.buffer_modal_stage_one = this.initial_modal_stage_one
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    saveStageOneAndTwo: function () {
      this.evidence_profile_table_settings.isBusy = true
      delete this.buffer_modal_stage_two.type
      // this.buffer_modal_stage_two.name = this.buffer_modal_stage_one.name
      let params = {
        organization: this.list.organization,
        list_id: this.list.id,
        // name: this.buffer_modal_stage_one.name,
        evidence_profile: this.buffer_modal_stage_two
      }
      if (Object.prototype.hasOwnProperty.call(this.findings, 'id')) {
        axios.patch(`/api/isoqf_findings/${this.findings.id}`, params)
          .then((response) => {
            this.getStageOneData()
            this.saveListName()
          })
          .catch((error) => {
            this.printErrors(error)
          })
      } else {
        axios.post(`/api/isoqf_findings`, params)
          .then((response) => {
            this.getStageOneData()
          })
          .catch((error) => {
            this.printErrors(error)
          })
      }
    },
    editStageTwo: function (data, type) {
      let theData = JSON.parse(JSON.stringify(data))
      this.buffer_modal_stage_one.name = theData.name
      this.buffer_modal_stage_two = {...theData}
      const titles = {
        'methodological-limitations': 'Methodological limitations',
        'coherence': 'Coherence',
        'adequacy': 'Adequacy',
        'relevance': 'Relevance',
        'cerqual': 'CERQual Assessment of Confidence'
      }
      this.buffer_modal_stage_two.type = type
      this.buffer_modal_stage_two.title = titles[type]
      this.$refs['modal-stage-two'].show()
    },
    getCharsOfStudies: function () {
      let params = {
        organization: this.list.organization,
        // list_id: this.$route.params.id
        project_id: this.list.project_id
      }
      axios.get('/api/isoqf_characteristics', {params})
        .then((response) => {
          if (response.data.length) {
            let data = response.data[0]
            let items = []

            for (let characteristic of data.items) {
              for (let reference of this.list.references) {
                if (reference === characteristic.ref_id) {
                  items.push(characteristic)
                }
              }
            }
            data.items = items
            this.characteristics_studies = data
            if (data.fields.length) {
              let fields = JSON.parse(JSON.stringify(data.fields))
              let lastItem = fields.splice(fields.length - 1, 1)
              this.characteristics_studies.last_column = lastItem[0].key.split('_')[1]
              // this.characteristics_studies.fields.push({key: 'actions', label: 'Actions'})
              this.characteristics_studies.fieldsObj = []
              let _fields = data.fields
              for (let field of _fields) {
                if (field.key !== 'ref_id') {
                  this.characteristics_studies.fieldsObj.push(field)
                }
              }
              if (!Object.prototype.hasOwnProperty.call(this.characteristics_studies, 'items')) {
                this.characteristics_studies.items = []
              }
            }
            this.buffer_characteristics_studies = JSON.parse(JSON.stringify(this.characteristics_studies))
            this.buffer_characteristics_studies.fields.splice(this.buffer_characteristics_studies.fields.length - 1, 1)

            let tableTop = []

            if (Object.prototype.hasOwnProperty.call(this.characteristics_studies, 'mainFields')) {
              const _tableTop = JSON.parse(JSON.stringify(this.characteristics_studies.mainFields))
              for (let tt of _tableTop) {
                tableTop.push({ 'label': tt.label, 'colspan': tt.fields.length })
              }
            }
            this.characteristics_studies.tableTop = tableTop
          } else {
            this.characteristics_studies = {
              items: [],
              fields: []
            }
          }
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    openModalCharsOfStudiesditData: function (row) {
      let item = JSON.parse(JSON.stringify(row))
      let index = item.index
      let data = item.item

      this.modal_stage_three_data = data
      this.characteristics_studies.data_index = index
      this.$refs['modal-stage-three-edit-data'].show()
    },
    saveCharsOfStudiesEditedData: function () {
      let CharsOfStudiesData = {}
      let index = this.characteristics_studies.data_index

      CharsOfStudiesData.items = JSON.parse(JSON.stringify(this.characteristics_studies.items))
      delete CharsOfStudiesData.items[index]
      CharsOfStudiesData.items[index] = this.modal_stage_three_data
      CharsOfStudiesData.organization = this.characteristics_studies.organization
      CharsOfStudiesData.list_id = this.characteristics_studies.list_id

      axios.patch(`/api/isoqf_characteristics/${this.characteristics_studies.id}`, CharsOfStudiesData)
        .then((response) => {
          this.modal_stage_three_data = {}
          delete this.characteristics_studies.data_index
          this.getCharsOfStudies()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    modalDeleteCharsOfStudiesItemData: function (row) {
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
    removeCharsOfStudiesItemData: function () {
      let data = JSON.parse(JSON.stringify(this.characteristics_studies.items))
      let CharsOfStudiesData = {}

      data.splice(this.characteristics_studies.data_index, 1)
      CharsOfStudiesData.items = data
      CharsOfStudiesData.organization = this.characteristics_studies.organization
      CharsOfStudiesData.list_id = this.characteristics_studies.list_id

      axios.patch(`/api/isoqf_characteristics/${this.characteristics_studies.id}`, CharsOfStudiesData)
        .then((response) => {
          this.modal_stage_three_data = {}
          delete this.characteristics_studies.data_index
          this.getCharsOfStudies()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getMethAssessments: function () {
      let params = {
        organization: this.list.organization,
        project_id: this.list.project_id
      }
      axios.get('/api/isoqf_assessments', {params})
        .then((response) => {
          if (response.data.length) {
            const _references = JSON.parse(JSON.stringify(this.list.references))
            let data = response.data[0]
            let items = []

            for (let item of data.items) {
              for (let reference of _references) {
                if (reference === item.ref_id) {
                  items.push(item)
                }
              }
            }

            data.items = items

            let _fields = data.fields
            data.fieldsObj = []
            for (let field of _fields) {
              if (field.key !== 'ref_id') {
                data.fieldsObj.push(field)
              }
            }

            this.meth_assessments = data
          } else {
            this.meth_assessments = { nroOfColumns: 1, fields: [], items: [] }
          }
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    openModalEditDataMethAssessments: function (row) {
      let tmpFields = JSON.parse(JSON.stringify(this.meth_assessments.fields))
      let tmpData = JSON.parse(JSON.stringify(this.meth_assessments.items))

      tmpFields.splice(tmpFields.length - 1, 1)
      this.buffer_modal_meth_assessments_fields = tmpFields
      this.modal_meth_assessments_data = tmpData.splice(row.index, 1)[0]
      this.buffer_meth_assessments.key_item = row.index
      this.$refs['modal-edit-data-stage-four'].show()
    },
    saveUpdateDataMethAssessments: function () {
      let tmpData = JSON.parse(JSON.stringify(this.modal_meth_assessments_data))
      let tmpMethAssessments = JSON.parse(JSON.stringify(this.meth_assessments))

      tmpMethAssessments.fields.splice(tmpMethAssessments.fields.length - 1, 1)
      tmpMethAssessments.items[this.buffer_meth_assessments.key_item] = tmpData
      axios.patch(`/api/isoqf_assessments/${this.meth_assessments.id}`, tmpMethAssessments)
        .then((response) => {
          delete this.buffer_meth_assessments.key_item
          this.$refs['modal-edit-data-stage-four'].hide()
          this.modal_meth_assessments_data = {}
          this.getMethAssessments()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    openModalRemoveDataMethAssessments: function (row) {
      let tmpMethAssessments = JSON.parse(JSON.stringify(this.meth_assessments))
      tmpMethAssessments.fields.splice(tmpMethAssessments.fields.length - 1, 1)
      this.buffer_meth_assessments_remove_item.fields = tmpMethAssessments.fields
      this.buffer_meth_assessments_remove_item.items = []
      this.buffer_meth_assessments_remove_item.items.push(tmpMethAssessments.items[row.index])
      this.buffer_meth_assessments_remove_item.key_item = row.index
      this.$refs['modal-remove-data-stage-four'].show()
    },
    removeDataMethAssessments: function () {
      let tmpMethAssessments = JSON.parse(JSON.stringify(this.meth_assessments))

      tmpMethAssessments.fields.splice(tmpMethAssessments.fields.length - 1, 1)
      tmpMethAssessments.items.splice(this.buffer_meth_assessments_remove_item.key_item, 1)
      axios.patch(`/api/isoqf_assessments/${this.meth_assessments.id}`, tmpMethAssessments)
        .then((response) => {
          this.buffer_meth_assessments_remove_item = {fields: [], items: []}
          this.getMethAssessments()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getExtractedData: function () {
      let params = {
        organization: this.list.organization,
        finding_id: this.findings.id
      }

      axios.get('/api/isoqf_extracted_data', {params})
        .then((response) => {
          this.extracted_data = {id: null, fields: [], items: []}
          if (response.data.length) {
            this.extracted_data = response.data[0]
            this.extracted_data.fields.push({key: 'actions', label: ''})
            let _fields = JSON.parse(JSON.stringify(this.extracted_data.fields))
            this.extracted_data.fieldsObj = []
            for (let field of _fields) {
              if (field.key !== 'ref_id') {
                this.extracted_data.fieldsObj.push(field)
                if (field.key !== 'actions') {
                  this.mode_print_fieldsObj.push(field)
                }
              }
            }

            const _references = this.list.references
            let _items = []
            let extractedDataItems = JSON.parse(JSON.stringify(this.extracted_data.items))
            extractedDataItems.sort(function (a, b) {
              if (a.authors < b.authors) {
                return -1
              }
              if (a.authors > b.authors) {
                return 1
              }
              return 0
            })
            this.extracted_data.original_items = extractedDataItems
            for (let reference of _references) {
              let index = 0
              for (let item of extractedDataItems) {
                if (item.ref_id === reference) {
                  _items.push({ ref_id: item.ref_id, authors: item.authors, column_0: item.column_0, index: index })
                }
                index++
              }
            }
            this.extracted_data.items = _items
          }
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    saveDataExtractedData: function () {
      let _item = JSON.parse(JSON.stringify(this.buffer_extracted_data_items))
      let _originalItems = JSON.parse(JSON.stringify(this.extracted_data.original_items))

      for (let index in _originalItems) {
        if (_item.index === parseInt(index)) {
          _originalItems[index] = { 'authors': _item.authors, 'column_0': _item.column_0, 'ref_id': _item.ref_id }
        }
      }

      let params = {
        organization: this.list.organization,
        list_id: this.$route.params.id,
        items: _originalItems
      }
      axios.patch(`/api/isoqf_extracted_data/${this.extracted_data.id}`, params)
        .then((response) => {
          this.getExtractedData()
          this.buffer_extracted_data = {fields: [], items: [], id: null}
          this.buffer_extracted_data_items = {}
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    openModalExtractedDataRemoveDataItem: function (data) {
      this.buffer_extracted_data.remove_index_item = data.index
      this.$refs['modal-extracted-data-remove-data-item'].show()
    },
    extractedDataRemoveDataItem: function () {
      let items = JSON.parse(JSON.stringify(this.extracted_data.items))
      const item = items[this.buffer_extracted_data.remove_index_item]
      let newItem = { 'ref_id': item.ref_id, 'authors': item.authors }
      items[this.buffer_extracted_data.remove_index_item] = newItem

      axios.patch(`/api/isoqf_extracted_data/${this.extracted_data.id}`, {items: items})
        .then((response) => {
          this.getExtractedData()
          delete this.buffer_extracted_data.remove_index_item
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    openModalExtractedDataEditDataItem: function (data) {
      this.extracted_data.edit_index_item = data.index
      this.buffer_extracted_data.fields = JSON.parse(JSON.stringify(this.extracted_data.fields))
      this.buffer_extracted_data.fields.splice(this.buffer_extracted_data.fields.length - 1, 1)
      this.buffer_extracted_data_items = JSON.parse(JSON.stringify(this.extracted_data.items[data.index]))
      this.$refs['modal-extracted-data-data'].show()
    },
    generateAndDownload: function (element, filename) {
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
    editExtractedDataInPlace: function (index) {
      const _item = JSON.parse(JSON.stringify(this.extracted_data.items[index]))
      this.showEditExtractedDataInPlace.display = true
      this.showEditExtractedDataInPlace.item = _item
    },
    cancelExtractedDataInPlace: function () {
      this.showEditExtractedDataInPlace.display = false
      this.showEditExtractedDataInPlace.item = {}
    },
    updateContentExtractedDataItem: function (index = 0) {
      const _items = JSON.parse(JSON.stringify(this.extracted_data.items))
      const _index = parseInt(index)
      let _originals = JSON.parse(JSON.stringify(this.extracted_data.original_items))
      if (_index) {
        let item = JSON.parse(JSON.stringify(this.showEditExtractedDataInPlace.item))
        _originals[_index] = item
      }

      for (let index in _originals) {
        for (let item of _items) {
          if (item.index === index) {
            _originals[index] = { 'authors': item.authors, 'column_0': item.column_0, 'ref_id': item.ref_id }
          }
        }
        index++
      }
      const params = {
        organization: this.list.organization,
        finding_id: this.findings.id,
        items: _originals
      }
      axios.patch(`/api/isoqf_extracted_data/${this.extracted_data.id}`, params)
        .then((response) => {
          this.getExtractedData()
          this.showEditExtractedDataInPlace.display = false
        })
        .catch((error) => {
          this.printErrors(error)
        })
    }
  }
}
</script>

<style scoped>
  div >>>
    a.return {
      font-size: 1.2rem;
    }
  div >>>
    h3 span {
      font-size: 1.55rem
    }
  div >>>
    h3 span.title-finding {
      font-weight: 300;
    }
  div >>>
    #assessments.table thead th:first-child {
      width: 2%;
    }
  div >>>
    #assessments.table thead th:last-child {
      width: 3%;
    }
  div >>>
    #assessments.table thead th {
      width: 19%;
    }
  div >>>
    #assessments-print.table thead th:first-child {
      width: 2%;
    }
  div >>>
    #assessments-print.table thead th:nth-child(2) {
      width: 35%;
    }
  div >>>
    #assessments-print.table thead th:last-child {
      width: 15%;
    }
  div >>>
    .table tbody td div li {
      font-size: 0.8rem;
      padding-top: 0.4rem;
      list-style-type: none;
    }
  div >>>
    #extracted.table thead th:last-child {
      text-align: right;
      width: 13%;
    }
  div >>>
    .table-small-font {
      font-size: 14px;
    }
  div >>>
    .table-small-font.extracted-data thead th:last-child {
      width: 3%;
    }
  div >>>
    .reference-txt {
      font-size: 12px;
    }
  @media print {
    @page {
      size: A4 landscape;
    }
  }
</style>
