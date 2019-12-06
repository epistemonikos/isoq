<template>
  <div class="mt-4">
    <b-container>
      <b-row>
        <b-col cols="12" class="text-right d-print-none">
          <b-link @click="$router.go(-1)">
            <font-awesome-icon icon="long-arrow-alt-left" v-bind:title="$t('back')" />
            return to ISoQf table
          </b-link>
        </b-col>
      </b-row>
      <h2>CERQual Assessment Worksheet <small v-b-tooltip.hover title="This is where you will transparently assess the 4 components of CERQual in order to make an overall assessment of confidence">*</small></h2>
      <h3 v-if="mode==='edit'"><span class="pre-title">Review finding:</span> <span>{{list.name}}</span></h3>
      <b-row
        class="d-print-none justify-content-end mb-2">
        <b-col
          v-if="mode==='view'"
          cols="12"
          sm="2">
            <b-button
              @click="print"
              variant="outline-info"
              block>
              <font-awesome-icon icon="print"></font-awesome-icon>
              Print
            </b-button>
        </b-col>
        <b-col
          v-if="mode==='view'"
          cols="12"
          sm="2">
            <b-button
              @click="changeMode"
              variant="outline-primary"
              block>
              Edit
            </b-button>
        </b-col>
        <b-col
          v-if="mode==='edit'"
          cols="12"
          sm="3">
            <b-button
              @click="changeMode"
              variant="outline-success"
              block>
              View CERQual Evidence Profile
            </b-button>
        </b-col>
      </b-row>
      <b-row
        v-if="mode==='edit'"
        class="d-print-none">
        <b-col
          cols="12">
          <b-form-group>
            <b-form-checkbox-group id="checkbox-group-2" v-model="show.selected" switches>
              <b-form-checkbox value="cs"><span v-b-tooltip.hover title="Turn on to create or add a table with descriptive information about each study contributing to this finding">Characteristics Studies</span></b-form-checkbox>
              <b-form-checkbox value="ma"><span v-b-tooltip.hover title="Turn on to create or add a table with your methodological assessments (quality/critical appraisal) for each study contributing to this finding">Methodological Assessments</span></b-form-checkbox>
              <b-form-checkbox value="ed"><span v-b-tooltip.hover title="Turn on to create or add a table with all the extracted data coming from the studies contributing to this finding">Extracted Data</span></b-form-checkbox>
            </b-form-checkbox-group>
          </b-form-group>
        </b-col>
      </b-row>
      <b-row class="mt-2">
        <b-col cols="12">
          <!--<b-tabs>-->
            <!-- Evidence Profile-->
            <!--<b-tab :title="$t('Evidence Profile')">-->
              <b-modal
                id="modal-stage-two"
                ref="modal-stage-two"
                v-bind:title="$t('Evidence profile')"
                scrollable
                @ok="saveStageOneAndTwo"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                <div v-if="buffer_modal_stage_two.type === 'methodological-limitations'">
                  <h6>{{$t('Methodological Limitations')}}</h6>
                  <p class="font-weight-light">
                    Do you have any concerns about the methodological quality of contributing studies as a whole that could lower your confidence in the review finding?
                    Explain any concern in your own words. (tip: Refer to your Methodological Assessments table). Remember this is an assessment of the whole body of evidence supporting this finding, not an assessment of an individual contributing study.
                  </p>
                  <p class="font-weight-light">
                    You can find guidance on how to make this assessment in the “Guidance on applying CERQual” tab at the top right of this page.
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
                    class="mt-2"
                    v-bind:label="$t('Explanation')"
                    label-for="input-ml-explanation"
                    description="We encourage to add an explanation.">
                    <b-form-textarea
                      id="input-ml-explanation"
                      v-model="buffer_modal_stage_two.methodological_limitations.explanation"
                      v-bind:placeholder="$t('Enter an explanation')"></b-form-textarea>
                  </b-form-group>
                  <b-form-group
                    class="mt-2"
                    v-bind:label="Notes"
                    label-for="input-ml-notes"
                    description="Optional space for reviewers to leave notes for each other while working on CERQual assessments">
                    <b-form-textarea
                      id="input-ml-notes"
                      v-model="buffer_modal_stage_two.methodological_limitations.notes"
                      :placeholder="$t('Enter a note')"></b-form-textarea>
                  </b-form-group>
                </div>
                <div v-if="buffer_modal_stage_two.type === 'coherence'">
                  <!-- coherence -->
                  <h6>{{$t('Coherence')}}</h6>
                  <p class="font-weight-light">
                    Do you have any concerns about the coherence between the review finding and the underlying data that could lower your confidence in the review finding?
                    You may have concerns if some of the data from included studies contradict the review finding, if it’s not clear if some of the underlying data support the review finding, or if there are plausible alternative descriptions, interpretations or explanations that could be used to synthesize the data.
                    Explain any concerns in your own words. (tip: refer to your Extracted Data in relation to your review finding)
                  </p>
                  <p class="font-weight-light">
                    You can find guidance on how to make this assessment in the “Guidance on applying CERQual” tab at the top right of this page.
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
                    class="mt-2"
                    v-bind:label="$t('Explanation')"
                    label-for="input-coherence-explanation"
                    description="We encourage to add an explanation.">
                    <b-form-textarea
                      id="input-coherence-explanation"
                      v-model="buffer_modal_stage_two.coherence.explanation"
                      v-bind:placeholder="$t('Enter an explanation')"></b-form-textarea>
                  </b-form-group>
                  <b-form-group
                    class="mt-2"
                    v-bind:label="Notes"
                    label-for="input-ml-notes"
                    description="Optional space for reviewers to leave notes for each other while working on CERQual assessments">
                    <b-form-textarea
                      id="input-ml-notes"
                      v-model="buffer_modal_stage_two.coherence.notes"
                      :placeholder="$t('Enter a note')"></b-form-textarea>
                  </b-form-group>
                  <!-- adequacy -->
                </div>
                <div v-if="buffer_modal_stage_two.type === 'adequacy'">
                  <h6>{{$t('Adequacy')}}</h6>
                  <p class="font-weight-light">
                    Do you have any concerns about the adequacy of the data (richness and /or quantity) supporting the review finding that could lower your confidence in the review finding?
                    Explain any concerns in your own words. (tip: refer to your Characteristics of Studies table and your Extracted Data for this finding)
                  </p>
                  <p class="font-weight-light">
                    You can find guidance on how to make this assessment in the “Guidance on applying CERQual” tab at the top right of this page.
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
                    class="mt-2"
                    v-bind:label="$t('Explanation')"
                    label-for="input-adequacy-explanation"
                    description="We encourage to add an explanation.">
                    <b-form-textarea
                      id="input-adequacy-explanation"
                      v-model="buffer_modal_stage_two.adequacy.explanation"
                      placeholder="Enter an explanation"></b-form-textarea>
                  </b-form-group>
                  <b-form-group
                    class="mt-2"
                    v-bind:label="Notes"
                    label-for="input-ml-notes"
                    description="Optional space for reviewers to leave notes for each other while working on CERQual assessments">
                    <b-form-textarea
                      id="input-ml-notes"
                      v-model="buffer_modal_stage_two.adequacy.notes"
                      :placeholder="$t('Enter a note')"></b-form-textarea>
                  </b-form-group>
                  <!-- relevance -->
                </div>
                <div v-if="buffer_modal_stage_two.type === 'relevance'">
                  <h6>{{$t('Relevance')}}</h6>
                  <p class="font-weight-light">
                    Do you have any concerns about the relevance of the underlying studies to your review question that could lower your confidence in the review finding?
                    You may have concerns if some of the underlying data are of indirect relevance, of partial relevance, or if it is unclear whether the underlying data is relevant. Explain any concerns in your own words using the terms indirect, partial or unclear relevance when appropriate. (tip: refer to your Characteristics of Studies table and your review question)
                  </p>
                  <p class="font-weight-light">
                    You can find guidance on how to make this assessment in the “Guidance on applying CERQual” tab at the top right of this page.
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
                    class="mt-2"
                    v-bind:label="$t('Explanation')"
                    label-for="input-relevance-explanation"
                    description="We encourage to add an explanation.">
                    <b-form-textarea
                      id="input-relevance-explanation"
                      v-model="buffer_modal_stage_two.relevance.explanation"
                      placeholder="Enter an explanation"></b-form-textarea>
                  </b-form-group>
                  <b-form-group
                    class="mt-2"
                    v-bind:label="Notes"
                    label-for="input-ml-notes"
                    description="Optional space for reviewers to leave notes for each other while working on CERQual assessments">
                    <b-form-textarea
                      id="input-ml-notes"
                      v-model="buffer_modal_stage_two.relevance.notes"
                      :placeholder="$t('Enter a note')"></b-form-textarea>
                  </b-form-group>
                  <!-- CERQual assessment -->
                </div>
                <div v-if="buffer_modal_stage_two.type === 'cerqual'">
                  <h6>{{$t('CERQual Assessment of Confidence')}}</h6>
                  <p class="font-weight-ligth">
                    To what extent is the review finding a reasonable representation of the phenomenon of interest?
                    Explain your assessment by making reference to any identified concerns for all 4 components of CERQual (methodological limitations, coherence, adequacy, relevance).
                  </p>
                  <p class="font-weight-ligth">
                    You can find guidance on how to make this assessment in the “Guidance on applying CERQual” tab at the top right of this page.
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
                    class="mt-2"
                    v-bind:label="$t('Explanation')"
                    label-for="input-cerqual"
                    description="We encourage to add an explanation.">
                    <b-form-textarea
                      id="input-cerqual"
                      v-model="buffer_modal_stage_two.cerqual.explanation"
                      placeholder="Enter an explanation"></b-form-textarea>
                  </b-form-group>
                  <b-form-group
                    class="mt-2"
                    v-bind:label="Notes"
                    label-for="input-ml-notes"
                    description="Optional space for reviewers to leave notes for each other while working on CERQual assessments">
                    <b-form-textarea
                      id="input-ml-notes"
                      v-model="buffer_modal_stage_two.cerqual.notes"
                      :placeholder="$t('Enter a note')"></b-form-textarea>
                  </b-form-group>
                </div>
              </b-modal>
              <template v-if="evidence_profile.length">
                <h3>Evidence Profile</h3>
                <b-table
                  v-if="mode==='edit'"
                  id="assessments"
                  responsive striped caption-top
                  :fields="evidence_profile_fields"
                  :items="evidence_profile"
                  :filter="evidence_profile_table_settings.filter"
                  :per-page="evidence_profile_table_settings.perPage">
                  <template v-slot:head(isoqf_id)="data">
                    <span v-b-tooltip.hover title="Automatic numbering of synthesised review findings">{{data.label}}</span>
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
                  <template v-slot:cell(isoqf_id)="data">
                    {{data.item.isoqf_id}}
                  </template>
                  <template v-slot:cell(methodological-limit)="data">
                    <div v-if="data.item.methodological_limitations.option !== null">
                      <p>{{select_options[data.item.methodological_limitations.option].text}}</p>
                      <p v-if="data.item.methodological_limitations.explanation"><b>Explanation:</b> {{data.item.methodological_limitations.explanation}}</p>
                      <b-button
                        block
                        variant="outline-info d-print-none"
                        @click="editStageTwo(data.item, 'methodological-limitations')">
                        Edit
                      </b-button>
                    </div>
                    <div v-else>
                      <b-button
                        block
                        variant="outline-info d-print-none"
                        @click="editStageTwo(data.item, 'methodological-limitations')">
                        Assessment not completed
                      </b-button>
                    </div>
                  </template>
                  <template v-slot:cell(coherence)="data">
                    <div v-if="data.item.coherence.option !== null">
                      <p>{{select_options[data.item.coherence.option].text}}</p>
                      <p v-if="data.item.coherence.explanation"><b>Explanation:</b> {{data.item.coherence.explanation}}</p>
                      <b-button
                        block
                        variant="outline-info d-print-none"
                        @click="editStageTwo(data.item, 'coherence')">
                        Edit
                      </b-button>
                    </div>
                    <div v-else>
                      <b-button
                        block
                        variant="outline-info d-print-none"
                        @click="editStageTwo(data.item, 'coherence')">
                        Assessment not completed
                      </b-button>
                    </div>
                  </template>
                  <template v-slot:cell(adequacy)="data">
                    <div v-if="data.item.adequacy.option !== null">
                      <p>{{select_options[data.item.adequacy.option].text}}</p>
                      <p v-if="data.item.adequacy.explanation"><b>Explanation:</b> {{data.item.adequacy.explanation}}</p>
                      <b-button
                        block
                        variant="outline-info d-print-none"
                        @click="editStageTwo(data.item, 'adequacy')">
                        Edit
                      </b-button>
                    </div>
                    <div v-else>
                      <b-button
                        block
                        variant="outline-info d-print-none"
                        @click="editStageTwo(data.item, 'adequacy')">
                        Assessment not completed
                      </b-button>
                    </div>
                  </template>
                  <template v-slot:cell(relevance)="data">
                    <div v-if="data.item.relevance.option !== null">
                      <p>{{select_options[data.item.relevance.option].text}}</p>
                      <p v-if="data.item.relevance.explanation"><b>Explanation:</b> {{data.item.relevance.explanation}}</p>
                      <b-button
                        block
                        variant="outline-info d-print-none"
                        @click="editStageTwo(data.item, 'relevance')">
                        Edit
                      </b-button>
                    </div>
                    <div v-else>
                      <b-button
                        block
                        variant="outline-info d-print-none"
                        @click="editStageTwo(data.item, 'relevance')">
                        Assessment not completed
                      </b-button>
                    </div>
                  </template>
                  <template v-slot:cell(cerqual)="data">
                    <div v-if="data.item.cerqual.option !== null">
                      <p>{{level_confidence[data.item.cerqual.option].text}}</p>
                      <p v-if="data.item.cerqual.explanation"><b>Explanation:</b> {{data.item.cerqual.explanation}}</p>
                      <b-button
                        block
                        variant="outline-info d-print-none"
                        @click="editStageTwo(data.item, 'cerqual')">
                        Edit
                      </b-button>
                    </div>
                    <div v-else>
                      <b-button
                        block
                        variant="outline-info d-print-none"
                        @click="editStageTwo(data.item, 'cerqual')">
                        Assessment not completed
                      </b-button>
                    </div>
                  </template>
                  <template v-slot:cell(references)="data">
                    <div v-if="Object.prototype.hasOwnProperty.call(data.item, 'references')">
                      <li
                        :key="index"
                        v-for="(ref, index) in data.item.references">{{ ref }}</li>
                    </div>
                    <font-awesome-icon
                      icon="highlighter"
                      @click="openModalReferences"></font-awesome-icon>
                  </template>
                </b-table>

                <b-table
                  v-if="mode==='view'"
                  id="assessments-print"
                  responsive striped caption-top
                  :fields="evidence_profile_fields_print_version"
                  :items="evidence_profile"
                  :filter="evidence_profile_table_settings.filter"
                  :per-page="evidence_profile_table_settings.perPage">
                  <template v-slot:head(isoqf_id)="data">
                    <span v-b-tooltip.hover title="Automatic numbering of synthesised review findings">{{data.label}}</span>
                  </template>
                  <template v-slot:head(name)="data">
                    <span v-b-tooltip.hover title="Synthesised review finding you are applying the CERQual approach to">{{data.label}}</span>
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
                  <template v-slot:cell(isoqf_id)="data">
                    {{data.item.isoqf_id}}
                  </template>
                  <template v-slot:cell(finding)="data">
                    {{data.item.name}}
                  </template>
                  <template v-slot:cell(methodological-limit)="data">
                    <div v-if="data.item.methodological_limitations.option !== null">
                      <p>{{select_options[data.item.methodological_limitations.option].text}}</p>
                      <p v-if="data.item.methodological_limitations.explanation"><b>Explanation:</b> {{data.item.methodological_limitations.explanation}}</p>
                    </div>
                  </template>
                  <template v-slot:cell(coherence)="data">
                    <div v-if="data.item.coherence.option !== null">
                      <p>{{select_options[data.item.coherence.option].text}}</p>
                      <p v-if="data.item.coherence.explanation"><b>Explanation:</b> {{data.item.coherence.explanation}}</p>
                    </div>
                  </template>
                  <template v-slot:cell(adequacy)="data">
                    <div v-if="data.item.adequacy.option !== null">
                      <p>{{select_options[data.item.adequacy.option].text}}</p>
                      <p v-if="data.item.adequacy.explanation"><b>Explanation:</b> {{data.item.adequacy.explanation}}</p>
                    </div>
                  </template>
                  <template v-slot:cell(relevance)="data">
                    <div v-if="data.item.relevance.option !== null">
                      <p>{{select_options[data.item.relevance.option].text}}</p>
                      <p v-if="data.item.relevance.explanation"><b>Explanation:</b> {{data.item.relevance.explanation}}</p>
                    </div>
                  </template>
                  <template v-slot:cell(cerqual)="data">
                    <div v-if="data.item.cerqual.option !== null">
                      <p>{{level_confidence[data.item.cerqual.option].text}}</p>
                      <p v-if="data.item.cerqual.explanation"><b>Explanation:</b> {{data.item.cerqual.explanation}}</p>
                    </div>
                  </template>
                  <template v-slot:cell(references)="data">
                    <div v-if="Object.prototype.hasOwnProperty.call(data.item, 'references')">
                      <li
                        :key="index"
                        v-for="(ref, index) in data.item.references">{{ ref }}</li>
                    </div>
                  </template>
                </b-table>

                <div
                  v-if="mode==='edit'"
                  class="d-print-none">
                  <b-card>
                    <h5>Progress status</h5>
                    <p class="font-weight-light">
                      This progress bar shows you how far along you are in making your CERQual assessment of confidence. You have 5 assessments to make in total. Firstly, an assessment for each of the 4 CERQual components, and lastly the overall assessment. Each assessment accounts for 20% of the total.
                    </p>
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
                <b-modal
                  id="modalReferences"
                  ref="modalReferences"
                  title="References"
                  scrollable
                  @ok="saveReferencesList">
                  <div
                    class="mt-2"
                    v-if="references.length">
                    <b-form-group>
                      <b-form-checkbox
                        v-for="ref in references"
                        v-model="list.references"
                        :key="ref.id"
                        :value="ref.id"
                        name="references">
                        {{ parseReference(ref) }}
                      </b-form-checkbox>
                    </b-form-group>
                  </div>
                </b-modal>
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
            <div
              class="mt-3"
              v-if="show.selected.includes('cs')">
              <h3>{{$t('Characteristics of Studies')}} <small v-b-tooltip.hover title="Descriptive information extracted from the contributing studies (e.g. year, country, participants, topic, setting, etc.)">*</small></h3>
              <template v-if="characteristics_studies.fields.length">
                <bc-filters class="d-print-none" :tableSettings="characteristics_studies_table_settings"></bc-filters>
                <b-table
                  id="characteristics"
                  responsive striped caption-top
                  :fields="characteristics_studies.fields"
                  :items="characteristics_studies.items"
                  :filter="characteristics_studies_table_settings.filter"
                  :per-page="characteristics_studies_table_settings.perPage"
                  class="mb-5">
                  <template v-slot:cell(actions)="row">
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
                  class="mt-5 d-print-none"
                  align="center"
                  v-model="characteristics_studies_table_settings.currentPage"
                  :per-page="characteristics_studies_table_settings.perPage"
                  :total-rows="characteristics_studies.items.length"
                  limit="11"></b-pagination>
              </template>
              <template v-else>
                <div class="text-center my-5">
                  <bc-action-table
                    :displayImport="true"
                    :displayCreateTable="true"
                    :importUrl="`/api/isoqf_characteristics?organization=${this.list.organization}&list_id=${this.$route.params.id}`"
                    @response-ok-api="getStageThree"></bc-action-table>
                </div>
              </template>

              <b-modal
                title="Edit data"
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
            <div
              class="mt-3"
              v-if="show.selected.includes('ma')">
              <h3>{{$t('Methodological Assessments')}} <small v-b-tooltip.hover title="Table with your methodological assessments of each contributing study using an existing quality/critical appraisal tool (e.g. CASP)">*</small></h3>
              <template v-if="stage_four.fields.length">
                <bc-filters class="d-print-none" :tableSettings="methodological_assessments_table_settings"></bc-filters>
                <!--
                <bc-action-table
                  class="d-print-none"
                  :importUrl="`/api/isoqf_assessments/${stage_four.id}?organization=${stage_four.organization}&list_id=${stage_four.list_id}`"
                  @response-ok-api="getStageFour"
                  :displayDeleteTable="true"
                  :displayEditTable="true"
                  :displayImport="true"
                  :displayCreateContent="true"
                  :theContent="stage_four"></bc-action-table>
                -->
                <b-table
                  id="methodological"
                  responsive
                  striped
                  caption-top
                  :fields="stage_four.fields"
                  :items="stage_four.items"
                  :per-page="methodological_assessments_table_settings.perPage"
                  :filter="methodological_assessments_table_settings.filter">
                  <template v-slot:cell(actions)="row">
                    <font-awesome-icon icon="trash" @click="openModalRemoveDataStageFour(row)" :title="$t('Remove')" />
                    <font-awesome-icon icon="edit" @click="openModalEditDataStageFour(row)" :title="$t('Edit')" />
                  </template>
                </b-table>
                <b-pagination
                  class="mt-5 d-print-none"
                  align="center"
                  v-model="methodological_assessments_table_settings.currentPage"
                  :per-page="methodological_assessments_table_settings.perPage"
                  :total-rows="stage_four.items.length"
                  limit="11"></b-pagination>
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
                <div class="text-center my-5 d-print-none">
                  <bc-action-table
                    :displayImport="true"
                    :displayCreateTable="true"
                    :importUrl="`/api/isoqf_assessments?organization=${this.list.organization}&list_id=${this.$route.params.id}`"
                    @response-ok-api="getStageFour"></bc-action-table>
                </div>
              </template>
            </div>
            <!--</b-tab>-->
            <!-- Extracted data -->
            <!--<b-tab v-bind:title="$t('Extracted Data')">-->
            <div
              class="mt-3"
              v-if="show.selected.includes('ed')">
              <h3>{{$t('Extracted Data')}} <small v-b-tooltip.hover title="Data extracted from each of the contributing studies.">*</small></h3>
              <template v-if="extracted_data.fields.length">
                <bc-filters class="d-print-none" :tableSettings="extracted_data_table_settings"></bc-filters>
                <bc-action-table
                  class="d-print-none"
                  :importUrl="`/api/isoqf_extracted_data/${extracted_data.id}?organization=${extracted_data.organization}&list_id=${extracted_data.list_id}`"
                  @response-ok-api="getStageFive"
                  :displayDeleteTable="true"
                  :displayEditTable="true"
                  :displayImport="true"
                  :displayCreateContent="true"
                  :theContent="extracted_data"></bc-action-table>
                <b-table
                  id="extracted"
                  responsive striped caption-top
                  :filter="extracted_data_table_settings.filter"
                  :fields="extracted_data.fields"
                  :items="extracted_data.items"
                  :per-page="extracted_data_table_settings.perPage"
                  :current-page="extracted_data_table_settings.currentPage">
                  <template v-slot:cell(actions)="data">
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
                  class="mt-5 d-print-none"
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
                <b-modal
                  title="Edit data"
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
              </template>
              <template v-else>
                <div class="text-center my-5 d-print-none">
                  <bc-action-table
                    :displayImport="true"
                    :displayCreateTable="true"
                    :importUrl="`/api/isoqf_extracted_data?organization=${this.list.organization}&list_id=${this.$route.params.id}`"
                    @response-ok-api="getStageFive"></bc-action-table>
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
        { key: 'name', label: 'Finding' },
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
        methodological_limitations: {option: null, explanation: ''},
        coherence: {option: null, explanation: ''},
        adequacy: {option: null, explanation: ''},
        relevance: {option: null, explanation: ''},
        cerqual: {option: null, explanation: ''}
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
      modal_stage_four_data: {},
      buffer_modal_stage_four_fields: {},
      extracted_data: {
        id: null,
        fields: [],
        items: []
      },
      importUrl: '',
      references: [],
      mode: 'edit'
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
    parseReference: (reference) => {
      let result = ''
      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        if (reference.authors.length === 1) {
          result = reference.authors[0] + ', ' + reference.publication_year + '; ' + reference.title
        } else if (reference.authors.length < 3) {
          result = reference.authors[0] + ', ' + reference.authors[1] + ', ' + reference.publication_year + '; ' + reference.title
        } else {
          result = reference.authors[0] + ' et al., ' + reference.publication_year + '; ' + reference.title
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
          this.references = response.data
        })
        .catch((error) => {
          console.log(error)
        })
    },
    saveReferencesList: function () {
      this.evidence_profile_table_settings.isBusy = true
      const params = {
        references: this.list.references
      }
      axios.patch(`/api/isoqf_lists/${this.list.id}`, params)
        .then((response) => {
          this.getList()
        })
    },
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
          this.getAllReferences()
          this.getStageOneData()
          this.getStageThree()
          this.getStageFour()
          this.getStageFive()
          this.evidence_profile_table_settings.isBusy = false
        })
        .catch((error) => {
          console.log(error)
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
          this.evidence_profile = [Object.assign({}, this.evidence_profile[0], { references: authors })]
        }))
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
            this.findings = response.data[0]
          }
          this.evidence_profile = []
          if (Object.prototype.hasOwnProperty.call(this.findings, 'evidence_profile')) {
            let evidenceProfile = this.findings.evidence_profile
            this.evidence_profile.push(evidenceProfile)
          }
          this.getStatus()
          this.getReferences()
        }).catch((error) => {
          console.log(error)
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
        name: this.buffer_modal_stage_one.name,
        cerqual: this.buffer_modal_stage_two.cerqual
      }
      axios.patch(`/api/isoqf_lists/${this.$route.params.id}`, params)
        .then((response) => {
          this.list.cerqual = response.data['$set'].cerqual
          this.list.name = this.buffer_modal_stage_one.name
          this.buffer_modal_stage_one = this.initial_modal_stage_one
        })
        .catch((error) => {
          console.log(error)
        })
    },
    saveStageOneAndTwo: function () {
      delete this.buffer_modal_stage_two.type
      this.buffer_modal_stage_two.name = this.buffer_modal_stage_one.name
      let params = {
        organization: this.list.organization,
        list_id: this.list.id,
        name: this.buffer_modal_stage_one.name,
        evidence_profile: this.buffer_modal_stage_two
      }
      if (Object.prototype.hasOwnProperty.call(this.findings, 'id')) {
        axios.patch(`/api/isoqf_findings/${this.findings.id}`, params)
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
    editStageTwo: function (data, type) {
      let theData = JSON.parse(JSON.stringify(data))
      this.buffer_modal_stage_one.name = theData.name
      this.buffer_modal_stage_two = {...theData}
      this.buffer_modal_stage_two.type = type
      this.$refs['modal-stage-two'].show()
    },
    getStageThree: function () {
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
              if (!Object.prototype.hasOwnProperty.call(this.characteristics_studies, 'items')) {
                this.characteristics_studies.items = []
              }
            }
            this.buffer_characteristics_studies = JSON.parse(JSON.stringify(this.characteristics_studies))
            this.buffer_characteristics_studies.fields.splice(this.buffer_characteristics_studies.fields.length - 1, 1)
          } else {
            this.characteristics_studies = {
              items: [],
              fields: []
            }
          }
        })
        .catch((error) => {
          console.log(error)
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

      stageThreeData.items = JSON.parse(JSON.stringify(this.characteristics_studies.items))
      delete stageThreeData.items[index]
      stageThreeData.items[index] = this.modal_stage_three_data
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
      let data = JSON.parse(JSON.stringify(this.characteristics_studies.items))
      let stageThreeData = {}

      data.splice(this.characteristics_studies.data_index, 1)
      stageThreeData.items = data
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
    getStageFour: function () {
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
            this.stage_four = data
          } else {
            this.stage_four = { nroOfColumns: 1, fields: [], items: [] }
          }
        })
        .catch((error) => {
          console.log(error)
        })
    },
    openModalEditDataStageFour: function (row) {
      let tmpFields = JSON.parse(JSON.stringify(this.stage_four.fields))
      let tmpData = JSON.parse(JSON.stringify(this.stage_four.items))

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
      tmpStageFour.items[this.buffer_stage_four.key_item] = tmpData
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
      this.buffer_stage_four_remove_item.items.push(tmpStageFour.items[row.index])
      this.buffer_stage_four_remove_item.key_item = row.index
      this.$refs['modal-remove-data-stage-four'].show()
    },
    removeDataStageFour: function () {
      let tmpStageFour = JSON.parse(JSON.stringify(this.stage_four))

      tmpStageFour.fields.splice(tmpStageFour.fields.length - 1, 1)
      tmpStageFour.items.splice(this.buffer_stage_four_remove_item.key_item, 1)
      axios.patch(`/api/isoqf_assessments/${this.stage_four.id}`, tmpStageFour)
        .then((response) => {
          this.buffer_stage_four_remove_item = {fields: [], items: []}
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
            this.extracted_data.fields.push({key: 'actions', label: 'Actions'})
          }
        })
        .catch((error) => {
          console.log(error)
        })
    },
    saveDataStageFive: function () {
      let items = JSON.parse(JSON.stringify(this.extracted_data.items))
      if (Object.prototype.hasOwnProperty.call(this.extracted_data, 'edit_index_item')) {
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
    openModalStageFiveRemoveDataItem: function (data) {
      this.buffer_extracted_data.remove_index_item = data.index
      this.$refs['modal-stage-five-remove-data-item'].show()
    },
    stageFiveRemoveDataItem: function () {
      let items = JSON.parse(JSON.stringify(this.extracted_data.items))
      items.splice(items.length - 1, 1)
      axios.patch(`/api/isoqf_extracted_data/${this.extracted_data.id}`, {items: items})
        .then((response) => {
          this.getStageFive()
          delete this.buffer_extracted_data.remove_index_item
        })
        .catch((error) => {
          console.log(error)
        })
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

<style scoped>
  div >>>
    h3 span {
      font-size: 1.55rem
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
      width: 45%;
    }
  div >>>
    #assessments-print.table thead th:last-child {
      width: 3%;
    }
  div >>>
    #assessments-print.table thead th {
      width: 10%;
    }
  div >>>
    .table tbody td div li {
      font-size: 0.8rem;
      padding-top: 0.4rem;
      list-style-type: none;
    }
  div >>>
    #characteristics.table thead th:last-child {
      width: 2%;
    }
  div >>>
    #methodological.table thead th:last-child {
      width: 2%;
    }
  div >>>
    #extracted.table thead th:last-child {
      width: 2%;
    }
</style>
