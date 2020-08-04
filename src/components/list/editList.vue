<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="py-5">
        <b-row>
          <b-col cols="12" class="text-right d-print-none">
            <b-link class="return" :to="{ name: 'viewProject', params: { org_id: this.list.organization, id: this.list.project_id }}">
              <font-awesome-icon icon="long-arrow-alt-left" :title="$t('back')" />
              return to ISoQ table
            </b-link>
          </b-col>
        </b-row>
        <h2 class="toDoc font-weight-bold pb-2">GRADE-CERQual Assessment Worksheet <small v-if="mode === 'edit'" class="d-print-none" v-b-tooltip.hover title="This is where you will transparently assess the 4 components of CERQual in order to make an overall assessment of confidence">*</small><span class="d-print-none"><font-awesome-icon icon="question-circle"></font-awesome-icon></span></h2>
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
              @click="exportToWord()">
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
              block>
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
          cols="12">
          <b-nav class="mt-2">
            <b-nav-item disabled>Navigate this page:</b-nav-item>
            <b-nav-item href="#evidence-profile">
              Evidence Profile
              <span
                v-if="ui.adequacy.chars_of_studies.display_warning || ui.methodological_assessments.display_warning || ui.adequacy.extracted_data.display_warning || (project.review_question === '') ? true : false || (project.inclusion === '') ? true: false || (project.exclusion === '') ? true: false"
                class="text-danger"
                v-b-tooltip.hover title="Data are missing. Click link to see what's missing.">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
              </span>
            </b-nav-item>
            <b-nav-item href="#characteristics-of-studies">
              Characteristics of Studies
              <span
                v-if="ui.adequacy.chars_of_studies.display_warning"
                class="text-danger"
                v-b-tooltip.hover title="Data are missing. Click link to see what's missing.">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
              </span>
            </b-nav-item>
            <b-nav-item href="#methodological-assessments">
              Methodological Assessments
              <span
                v-if="ui.methodological_assessments.display_warning"
                class="text-danger"
                v-b-tooltip.hover title="Data are missing. Click link to see what's missing.">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
              </span>
            </b-nav-item>
            <b-nav-item href="#extracted-data">
              Extracted Data
              <span
                v-if="ui.adequacy.extracted_data.display_warning"
                class="text-danger"
                v-b-tooltip.hover title="Data are missing. Click link to see what's missing.">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
              </span>
            </b-nav-item>
          </b-nav>
        </b-col>
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
                scrollable
                @ok="saveStageOneAndTwo(buffer_modal_stage_two.type, $event)"
                ok-title="Save"
                ok-variant="outline-success"
                cancel-variant="outline-secondary">
                <template v-slot:modal-title>
                  Evidence profile - {{ buffer_modal_stage_two.title }} <font-awesome-icon icon="question-circle"></font-awesome-icon>
                </template>
                  <b-container>
                    <b-row>
                      <b-col
                        id="left-modal-content"
                        cols="12"
                        md="4">
                        <div
                          class="float-right mb-5">
                          <span
                            id="span-txt"
                            class="bg-secondary text-white font-weight-bold ml-5 py-1 px-2"
                            @click="btnShowHideColumn(showPanel, buffer_modal_stage_two.type)">&lsaquo;</span>
                        </div>

                        <div id="left-methodological-limitations" v-if="buffer_modal_stage_two.type === 'methodological-limitations'">
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
                            <b-form-radio value="0" @change="propExplanation('', 'methodological_limitations')">
                              No/Very minor concerns <small v-b-tooltip.hover title="No or very minor concerns regarding methodological limitations that are unlikely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="1" @change="propExplanation('Minor concerns regarding methodological limitations because...', 'methodological_limitations')">
                              Minor concerns <small v-b-tooltip.hover title="Minor concerns regarding methodological limitations that may reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="2" @change="propExplanation('Moderate concerns regarding methodological limitations because...', 'methodological_limitations')">
                              Moderate concerns <small v-b-tooltip.hover title="Moderate concerns regarding methodological limitations that will probably reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="3" @change="propExplanation('Serious concerns regarding methodological limitations because...', 'methodological_limitations')">
                              Serious concerns <small v-b-tooltip.hover title="Serious concerns regarding methodological limitations that are very likely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                          </b-form-radio-group>
                          <a
                            @click="buffer_modal_stage_two.methodological_limitations.option = null; buffer_modal_stage_two.methodological_limitations.explanation = ''"
                            v-if="buffer_modal_stage_two.methodological_limitations.option !== null"
                            class="mt-2 font-weight-light text-danger">
                            <font-awesome-icon
                              icon="trash"></font-awesome-icon>
                            clear my selection
                          </a>
                          <b-form-group
                            class="mt-4 font-weight-light"
                            label="Explain any concerns you have in your own words."
                            label-for="input-ml-explanation">
                            <template slot="description">
                              The GRADE-CERQual approach requires you to include an explanation for your judgement. Click <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4" target="_blank">here</a> to see an example
                            </template>
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

                        <div id="left-coherence" v-if="buffer_modal_stage_two.type === 'coherence'">
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
                            <b-form-radio value="0" @change="propExplanation('', 'coherence')">
                              No/Very minor concerns <small v-b-tooltip.hover title="No or very minor concerns regarding coherence that are unlikely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="1" @change="propExplanation('Minor concerns regarding coherence because...', 'coherence')">
                              Minor concerns <small v-b-tooltip.hover title="Minor concerns regarding coherence that may reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="2" @change="propExplanation('Moderate concerns regarding coherence because...', 'coherence')">
                              Moderate concerns <small v-b-tooltip.hover title="Moderate concerns regarding coherence that will probably reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="3" @change="propExplanation('Serious concerns regarding coherence because...', 'coherence')">
                              Serious concerns <small v-b-tooltip.hover title="Serious concerns regarding coherence that are very likely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                          </b-form-radio-group>
                          <a
                            @click="buffer_modal_stage_two.coherence.option = null; buffer_modal_stage_two.coherence.explanation = ''"
                            v-if="buffer_modal_stage_two.coherence.option !== null"
                            class="mt-2 font-weight-light text-danger">
                            <font-awesome-icon
                              icon="trash"></font-awesome-icon>
                            clear my selection
                          </a>
                          <b-form-group
                            class="mt-4 font-weight-light"
                            label="Explain any concerns in your own words."
                            label-for="input-coherence-explanation">
                            <template slot="description">
                              The GRADE-CERQual approach requires you to include an explanation for your judgement. Click <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4" target="_blank">here</a> to see an example.
                            </template>
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
                            description="Optional space for reviewers to leave notes for each other while working on GRADE-CERQual assessments">
                            <b-form-textarea
                              id="input-ml-notes"
                              v-model="buffer_modal_stage_two.coherence.notes"
                              :placeholder="$t('Enter a note')"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                          <!-- adequacy -->
                        </div>

                        <div id="left-adequacy" v-if="buffer_modal_stage_two.type === 'adequacy'">
                          <p class="font-weight-bold">
                            <b>Do you have any concerns about the adequacy of the data (richness and /or quantity) supporting the review finding that could lower your confidence in the review finding?</b>
                            (guidance available <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#Guidance-on-Applying-CERQual`">here</b-link>)
                          </p>
                          <b-form-radio-group
                            v-model="buffer_modal_stage_two.adequacy.option"
                            name="adequacy"
                            stacked>
                            <b-form-radio value="0" @change="propExplanation('', 'adequacy')">
                              No/Very minor concerns <small v-b-tooltip.hover title="No or very minor concerns regarding adequacy that are unlikely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="1" @change="propExplanation('Minor concerns regarding adequacy because...', 'adequacy')">
                              Minor concerns <small v-b-tooltip.hover title="Minor concerns regarding adequacy that may reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="2" @change="propExplanation('Moderate concerns regarding adequacy because...', 'adequacy')">
                              Moderate concerns <small v-b-tooltip.hover title="Moderate concerns regarding adequacy that will probably reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="3" @change="propExplanation('Serious concerns regarding adequacy because...', 'adequacy')">
                              Serious concerns <small v-b-tooltip.hover title="Serious concerns regarding adequacy that are very likely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                          </b-form-radio-group>
                          <a
                            @click="buffer_modal_stage_two.adequacy.option = null; buffer_modal_stage_two.adequacy.explanation = ''"
                            v-if="buffer_modal_stage_two.adequacy.option !== null"
                            class="mt-2 font-weight-light text-danger">
                            <font-awesome-icon
                              icon="trash"></font-awesome-icon>
                            clear my selection
                          </a>
                          <b-form-group
                            class="mt-4 font-weight-light"
                            label="Explain any concerns in your own words."
                            label-for="input-adequacy-explanation">
                            <template slot="description">
                              The GRADE-CERQual approach requires you to include an explanation for your judgement. Click <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4" target="_blank">here</a> to see an example.
                            </template>
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
                            description="Optional space for reviewers to leave notes for each other while working on GRADE-CERQual assessments">
                            <b-form-textarea
                              id="input-ml-notes"
                              v-model="buffer_modal_stage_two.adequacy.notes"
                              :placeholder="$t('Enter a note')"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                          <!-- relevance -->
                        </div>

                        <div id="left-relevance" v-if="buffer_modal_stage_two.type === 'relevance'">
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
                            <b-form-radio value="0" @change="propExplanation('', 'relevance')">
                              No/Very minor concerns <small v-b-tooltip.hover title="No or very minor concerns regarding relevance that are unlikely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="1" @change="propExplanation('Minor concerns regarding relevance because...', 'relevance')">
                              Minor concerns <small v-b-tooltip.hover title="Minor concerns regarding relevance that may reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="2" @change="propExplanation('Moderate concerns regarding relevance because...', 'relevance')">
                              Moderate concerns <small v-b-tooltip.hover title="Moderate concerns regarding relevance that will probably reduce confidence in the review finding">*</small>
                            </b-form-radio>
                            <b-form-radio value="3" @change="propExplanation('Serious concerns regarding relevance because...', 'relevance')">
                              Serious concerns <small v-b-tooltip.hover title="Serious concerns regarding relevance that are very likely to reduce confidence in the review finding">*</small>
                            </b-form-radio>
                          </b-form-radio-group>
                          <a
                            @click="buffer_modal_stage_two.relevance.option = null; buffer_modal_stage_two.relevance.explanation = ''"
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
                            label-for="input-ml-notes">
                            <template slot="description">
                              Optional space for reviewers to leave notes for each other while working on GRADE-CERQual assessments. Click <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4" target="_blank">here</a> to see an example.
                            </template>
                            <b-form-textarea
                              id="input-ml-notes"
                              v-model="buffer_modal_stage_two.relevance.notes"
                              :placeholder="$t('Enter a note')"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                          <!-- CERQual assessment -->
                        </div>

                        <div id="left-cerqual" v-if="buffer_modal_stage_two.type === 'cerqual'">
                          <p class="font-weight-bold">
                            To what extent is the review finding a reasonable representation of the phenomenon of interest?
                          </p>
                          <p>
                            Click <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/5" target="_blank">here</a> for practical guidance on making an overall assessment of confidence for a review finding.
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
                            @click="buffer_modal_stage_two.cerqual.option = null; buffer_modal_stage_two.cerqual.explanation = ''"
                            v-if="buffer_modal_stage_two.cerqual.option !== null"
                            class="mt-2 font-weight-light text-danger">
                            <font-awesome-icon
                              icon="trash"></font-awesome-icon>
                            clear my selection
                          </a>
                          <b-form-group
                            class="mt-4 font-weight-light"
                            label-for="input-cerqual"
                            description="The GRADE-CERQual approach requires you to include an explanation for your judgement.">
                            <template slot="label">
                              Below is the minimum text required for an explanation. Now add detail about the specific concerns for the component(s) that most contributed to your assessment. <a href="#" @click="(ui.showExample) ? ui.showExample = false : ui.showExample = true ">{{ (ui.showExample) ? 'Hide' : 'Show' }} example</a>
                              <!-- Add detail about any concerns you identified for the four components into the minimum text provided below. Click <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/3" target="_blank">here</a> for an example.-->
                              <div class="mt-2" v-if="ui.showExample">
                              <p>If concerns about coherence and relevance contribute most to my decision to downgrade to “low confidence” then I will briefly summarise these specific concerns in brackets  e.g.</p>
                              <p>No/very minor concerns regarding methodological limitations, Moderate concerns regarding coherence <b>(some contradictory opinions expressed in the underlying data but not reflected in finding)</b>, No/Very minor concerns regarding adequacy, and Serious concerns regarding relevance <b>(indirectly relevant because studies are all from high income rather than LMICs)</b></p>
                              <p>[non bolded text is the minimum required text generated automatically and the bolded text are the details I have added to explain the concern]</p>
                              </div>
                            </template>
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
                            description="Optional space for reviewers to leave notes for each other while working on GRADE-CERQual assessments">
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
                        id="right-modal-content"
                        cols="12"
                        md="8">
                        <div v-if="buffer_modal_stage_two.type === 'methodological-limitations'">
                          <b-tabs content-class="mt-3">
                            <b-tab active>
                              <template slot="title">
                                Methodological Assessments <font-awesome-icon v-if="ui.methodological_assessments.display_warning" class="text-danger" icon="exclamation-circle"></font-awesome-icon>
                              </template>
                              <h4>Methodological Assessments</h4>
                              <p
                                v-if="ui.methodological_assessments.display_warning"
                                class="text-danger">
                                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                                The Methodological Assessments table, or some data within it, are missing. Add missing table/data in <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#My-Data`">My Data</b-link>.
                              </p>
                              <b-table
                                class="table-small-font"
                                responsive
                                head-variant="light"
                                outlined
                                :fields="meth_assessments.fieldsObj"
                                :items="meth_assessments.items">
                              </b-table>
                            </b-tab>
                            <b-tab title="Review Finding">
                              <edit-review-finding
                                @update-list-data="getList(true)"
                                :list="list"
                                :finding="findings">
                              </edit-review-finding>
                            </b-tab>
                          </b-tabs>
                        </div>

                        <div v-if="buffer_modal_stage_two.type === 'coherence'">
                          <edit-review-finding
                            @update-list-data="getList(true)"
                            :list="list"
                            :finding="findings">
                          </edit-review-finding>
                          <h4>Extracted Data</h4>
                          <p
                            v-if="ui.adequacy.extracted_data.display_warning"
                            class="text-danger">
                            <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                            Some or all of the extracted data for this finding are missing. Add them into the table below using the edit button for each included study.
                          </p>
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
                          <b-tabs content-class="mt-3">
                            <b-tab active>
                              <template slot="title">
                                Extracted Data <font-awesome-icon v-if="ui.adequacy.extracted_data.display_warning" class="text-danger" icon="exclamation-circle"></font-awesome-icon>
                              </template>
                              <h4>Extracted Data</h4>
                              <p
                                v-if="ui.adequacy.extracted_data.display_warning"
                                class="text-danger">
                                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                                Some or all of the extracted data for this finding are missing. Add them into the table below using the edit button for each included study.
                              </p>
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
                            </b-tab>
                            <b-tab>
                              <template slot="title">
                                Characteristics of Studies <font-awesome-icon v-if="ui.adequacy.chars_of_studies.display_warning" class="text-danger" icon="exclamation-circle"></font-awesome-icon>
                              </template>
                              <h4>Characteristics of Studies</h4>
                              <p
                                v-if="ui.adequacy.chars_of_studies.display_warning"
                                class="text-danger">
                                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                                The Characteristics of Studies table, or some data within it, are missing. Add missing table/data in <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#My-Data`">My Data</b-link>.
                              </p>
                              <b-table
                                class="table-small-font"
                                responsive
                                head-variant="light"
                                outlined
                                :fields="characteristics_studies.fieldsObj"
                                :items="characteristics_studies.items">
                              </b-table>
                            </b-tab>
                            <b-tab title="Review Finding">
                              <edit-review-finding
                                @update-list-data="getList(true)"
                                :list="list"
                                :finding="findings">
                              </edit-review-finding>
                            </b-tab>
                          </b-tabs>
                        </div>

                        <div v-if="buffer_modal_stage_two.type === 'relevance'">
                          <b-tabs content-class="mt-3">
                            <b-tab active>
                              <template slot="title">
                                Question and Criteria <font-awesome-icon v-if="(project.review_question === '') ? true : false || (project.inclusion === '') ? true : false || (project.exclusion === '') ? true : false" class="text-danger" icon="exclamation-circle"></font-awesome-icon>
                              </template>
                              <h4>Review Question</h4>
                              <p
                                v-if="project.review_question === ''"
                                class="text-danger">
                                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                                The review question is missing. Add it in <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#Project-Property`">Project Properties</b-link>.
                              </p>
                              <p>{{ project.review_question }}</p>
                              <h4>Inclusion criteria</h4>
                              <p
                                v-if="project.inclusion === ''"
                                class="text-danger">
                                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                                The inclusion criteria are missing. Add them in <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#My-Data`">My Data</b-link>.
                              </p>
                              <p>{{ project.inclusion }}</p>
                              <h4>Exclusion criteria</h4>
                              <p
                                v-if="project.exclusion === ''"
                                class="text-danger">
                                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                                The exclusion criteria are missing. Add them in <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#My-Data`">My Data</b-link>.
                              </p>
                              <p>{{ project.exclusion }}</p>
                            </b-tab>
                            <b-tab>
                              <template slot="title">
                                Characteristics of Studies <font-awesome-icon v-if="ui.adequacy.chars_of_studies.display_warning" class="text-danger" icon="exclamation-circle"></font-awesome-icon>
                              </template>
                              <h4>Characteristics of Studies</h4>
                              <p
                                v-if="ui.adequacy.chars_of_studies.display_warning"
                                class="text-danger">
                                The Characteristics of Studies table, or some data within it, are missing. Add missing table/data in <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#My-Data`">My Data</b-link>.
                                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                              </p>
                              <b-table
                                class="table-small-font"
                                responsive
                                head-variant="light"
                                outlined
                                :fields="characteristics_studies.fieldsObj"
                                :items="characteristics_studies.items">
                              </b-table>
                            </b-tab>
                            <b-tab title="Review Finding">
                              <edit-review-finding
                                @update-list-data="getList(true)"
                                :list="list"
                                :finding="findings">
                              </edit-review-finding>
                            </b-tab>
                          </b-tabs>
                        </div>

                        <div v-if="buffer_modal_stage_two.type === 'cerqual'">
                          <b-tabs content-class="mt-3">
                            <b-tab title="Methodological limitations">
                              <h5>Methodological limitations</h5>
                              <p>
                                <b>{{displaySelectedOption(evidence_profile[0].methodological_limitations.option)}}</b>
                                <br>
                                Explanation: <span v-if="evidence_profile[0].methodological_limitations.explanation">{{evidence_profile[0].methodological_limitations.explanation}}</span> <span v-else>Explanation not yet added</span>
                              </p>
                              <h5>Coherence</h5>
                              <p>
                                <b>{{displaySelectedOption(evidence_profile[0].coherence.option)}}</b>
                                <br>
                                Explanation: <span v-if="evidence_profile[0].coherence.explanation">{{evidence_profile[0].coherence.explanation}}</span> <span v-else>Explanation not yet added</span>
                              </p>
                              <h5>Adequacy</h5>
                              <p>
                                <b>{{displaySelectedOption(evidence_profile[0].adequacy.option)}}</b>
                                <br>
                                Explanation: <span v-if="evidence_profile[0].adequacy.explanation">{{evidence_profile[0].adequacy.explanation}}</span> <span v-else>Explanation not yet added</span>
                              </p>
                              <h5>Relevance</h5>
                              <p>
                                <b>{{displaySelectedOption(evidence_profile[0].relevance.option)}}</b>
                                <br>
                                Explanation: <span v-if="evidence_profile[0].relevance.explanation">{{evidence_profile[0].relevance.explanation}}</span> <span v-else>Explanation not yet added</span>
                              </p>
                            </b-tab>
                            <b-tab title="Review finding">
                              <edit-review-finding
                                @update-list-data="getList(true)"
                                :list="list"
                                :finding="findings">
                              </edit-review-finding>
                            </b-tab>
                          </b-tabs>
                        </div>
                      </b-col>
                    </b-row>
                  </b-container>
              </b-modal>

              <b-modal
                id="modal-warning-same-txt"
                ref="modal-warning-same-txt"
                title="Warning"
                :hide-footer="true">
                <p>
                  It looks like you have not finished writing an explanation for your judgement
                </p>
                <b-container>
                  <b-row align-h="between">
                    <b-col
                      cols="4">
                      <b-button
                        block
                        @click="closeWarningModalDoItNow('methodological-limitations')">Do it now</b-button>
                    </b-col>
                    <b-col
                      cols="4">
                      <b-button
                        block
                        @click="closeWarningModalDoItLater()">Do it later</b-button>
                    </b-col>
                  </b-row>
                </b-container>
              </b-modal>

              <div
                v-if="mode==='edit'"
                class="d-print-none">
                <b-card>
                  <h5>Progress status <span v-b-tooltip.hover title="This progress bar shows you how far along you are in making your GRADE-CERQual assessment of confidence. You have 5 assessments to make in total. Firstly, an assessment for each of the 4 GRADE-CERQual components, and lastly the overall assessment.">*</span></h5>
                  <p v-if="list.cerqual.option !== null">
                    Your GRADE-CERQual assessment has been added to the iSoQ for this finding. Click “return to iSoQ table” above to view it
                  </p>
                  <b-progress
                    :value="status_evidence_profile.value"
                    :max="status_evidence_profile.max"
                    :variant="status_evidence_profile.variant"
                    class="mb-3">
                  </b-progress>
                </b-card>
              </div>

              <template v-if="evidence_profile.length">
                <a name="evidence-profile"></a>
                <h3 class="mt-4">
                  Evidence Profile
                  <span
                    v-if="ui.adequacy.chars_of_studies.display_warning || ui.methodological_assessments.display_warning || ui.adequacy.extracted_data.display_warning || (project.review_question === '') ? true : false || (project.inclusion === '') ? true: false || (project.exclusion === '') ? true: false"
                    class="text-danger d-print-none"
                    v-b-tooltip.hover title="Data are missing.">
                    <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                  </span>
                </h3>
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
                    <span
                      v-if="ui.methodological_assessments.display_warning"
                      class="text-danger"
                      v-b-tooltip.hover title="Data needed to make this assessment are missing. Click button below to see what's missing.">
                      <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                    </span>
                  </template>
                  <template v-slot:head(coherence)="data">
                    <span v-b-tooltip.hover title="An assessment of how clear and cogent the fit is between the data from the primary studies and a review finding that synthesises that data. By ‘cogent’, we mean well supported or compelling">{{data.label}}</span>
                    <span
                      v-if="ui.coherence.display_warning"
                      class="text-danger"
                      v-b-tooltip.hover title="Data needed to make this assessment are missing. Click button below to see what's missing.">
                      <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                    </span>
                  </template>
                  <template v-slot:head(adequacy)="data">
                    <span v-b-tooltip.hover title="An overall determination of the degree of richness and quantity of data supporting a review finding">{{data.label}}</span>
                    <span
                      v-if="ui.adequacy.extracted_data.display_warning || ui.adequacy.chars_of_studies.display_warning"
                      class="text-danger"
                      v-b-tooltip.hover title="Data needed to make this assessment are missing. Click button below to see what's missing.">
                      <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                    </span>
                  </template>
                  <template v-slot:head(relevance)="data">
                    <span v-b-tooltip.hover title="The extent to which the body of evidence from the primary studies supporting a review finding is applicable to the context (perspective or population, phenomenon of interest, setting) specified in the review question">{{data.label}}</span>
                    <span
                      v-if="ui.relevance.chars_of_studies.display_warning || ((project.inclusion.length) ? false : true) || ((project.exclusion.length) ? false : true) || ((project.review_question.length) ? false : true)"
                      class="text-danger"
                      v-b-tooltip.hover title="Data needed to make this assessment are missing. Click button below to see what's missing.">
                      <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                    </span>
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
                      <p><b>{{displaySelectedOption(data.item.methodological_limitations.option)}}</b></p>
                      <p v-if="data.item.methodological_limitations.explanation">
                        Explanation: {{data.item.methodological_limitations.explanation}}
                        <span
                          v-if="displayExclamationAlert('methodological-limitations')"
                          class="text-danger"
                          v-b-tooltip.hover
                          title="This explanation is incomplete">
                            <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                        </span>
                      </p>
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
                      <p><b>{{displaySelectedOption(data.item.coherence.option)}}</b></p>
                      <p v-if="data.item.coherence.explanation">
                        Explanation: {{data.item.coherence.explanation}}
                        <span
                          v-if="displayExclamationAlert('coherence')"
                          class="text-danger"
                          v-b-tooltip.hover
                          title="This explanation is incomplete">
                            <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                        </span>
                      </p>
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
                      <p><b>{{displaySelectedOption(data.item.adequacy.option)}}</b></p>
                      <p v-if="data.item.adequacy.explanation">
                        Explanation: {{data.item.adequacy.explanation}}
                        <span
                          v-if="displayExclamationAlert('adequacy')"
                          class="text-danger"
                          v-b-tooltip.hover
                          title="This explanation is incomplete">
                            <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                        </span>
                      </p>
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
                      <p><b>{{displaySelectedOption(data.item.relevance.option)}}</b></p>
                      <p v-if="data.item.relevance.explanation">
                        Explanation: {{data.item.relevance.explanation}}
                        <span
                          v-if="displayExclamationAlert('relevance')"
                          class="text-danger"
                          v-b-tooltip.hover
                          title="This explanation is incomplete">
                            <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                        </span>
                      </p>
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
                    <div v-if="data.item.methodological_limitations.option !== null && data.item.coherence.option !== null && data.item.adequacy.option !== null && data.item.relevance.option !== null">
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
                      <p><b>{{displayLevelConfidence(data.item.cerqual.option)}}</b></p>
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
                      <p><b>{{displaySelectedOption(data.item.methodological_limitations.option)}}</b></p>
                      <p v-if="data.item.methodological_limitations.explanation">Explanation: {{data.item.methodological_limitations.explanation}}</p>
                    </div>
                  </template>
                  <template v-slot:cell(coherence)="data">
                    <div v-if="data.item.coherence.option !== null">
                      <p><b>{{displaySelectedOption(data.item.coherence.option)}}</b></p>
                      <p v-if="data.item.coherence.explanation">Explanation: {{data.item.coherence.explanation}}</p>
                    </div>
                  </template>
                  <template v-slot:cell(adequacy)="data">
                    <div v-if="data.item.adequacy.option !== null">
                      <p><b>{{displaySelectedOption(data.item.adequacy.option)}}</b></p>
                      <p v-if="data.item.adequacy.explanation">Explanation: {{data.item.adequacy.explanation}}</p>
                    </div>
                  </template>
                  <template v-slot:cell(relevance)="data">
                    <div v-if="data.item.relevance.option !== null">
                      <p><b>{{displaySelectedOption(data.item.relevance.option)}}</b></p>
                      <p v-if="data.item.relevance.explanation">Explanation: {{data.item.relevance.explanation}}</p>
                    </div>
                  </template>
                  <template v-slot:cell(cerqual)="data">
                    <div v-if="data.item.cerqual.option !== null">
                      <p><b>{{displayLevelConfidence(data.item.cerqual.option)}}</b></p>
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

                <back-to-top></back-to-top>

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
                    <b>Warning!</b> By removing a reference you are modifying the underlining evidence base for this finding and will need to review your GRADE-CERQual assessments. If you remove the reference, the extracted data you inputted from this study to support this finding will be deleted from the GRADE-CERQual Assessment Worksheet.
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
              class="mt-5 mb-5"
              v-if="show.selected.includes('cs')">
              <a name="characteristics-of-studies"></a>
              <h3 class="toDoc">
                {{ $t('Characteristics of Studies') }} <small v-if="mode === 'edit'" class="d-print-none" v-b-tooltip.hover title="Descriptive information extracted from the contributing studies (e.g. country, participants, topic, setting, etc.)">*</small>
                <span
                  v-if="ui.adequacy.chars_of_studies.display_warning"
                  class="text-danger d-print-none"
                  v-b-tooltip.hover title="The Characteristics of Studies table, or some data within it, are missing.">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                </span>
              </h3>
              <p class="d-print-none font-weight-light">
                To add data or make changes to this table do so in the
                <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#My-Data`">My Data</b-link>
                section of iSoQ
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
                  class="toDoc">
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

                <back-to-top></back-to-top>
              </template>
            </div>
            <!--</b-tab>-->
            <!-- Methodological Assessments -->
            <!--<b-tab :title="$t('Methodological Assessments')">-->
            <div
              class="mt-5 mb-5"
              v-if="show.selected.includes('ma')">
              <a name="methodological-assessments"></a>
              <h3 class="toDoc">
                {{ $t('Methodological Assessments') }} <small v-if="mode === 'edit'" class="d-print-none" v-b-tooltip.hover title="Table with your methodological assessments of each contributing study using an existing quality/critical appraisal tool (e.g. CASP)">*</small>
                <span
                  v-if="ui.methodological_assessments.display_warning"
                  class="text-danger d-print-none"
                  v-b-tooltip.hover title="The Methodological Assessments table, or some data within it, are missing.">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                </span>
              </h3>
              <p class="d-print-none font-weight-light">To add data or make changes to this table do so in the <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#My-Data`">My Data</b-link> section of iSoQ</p>
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
                <back-to-top></back-to-top>
              </template>
            </div>

            <div
              class="mt-3"
              v-if="show.selected.includes('ed')">
              <a name="extracted-data"></a>
              <h3 class="toDoc">
                {{ $t('Extracted Data') }} <small v-if="mode==='edit'" class="d-print-none" v-b-tooltip.hover title="Data extracted from each of the contributing studies.">*</small>
                <font-awesome-icon icon="question-circle" class="d-print-none"></font-awesome-icon>
                <span
                  v-if="ui.adequacy.extracted_data.display_warning"
                  class="text-danger d-print-none"
                  v-b-tooltip.hover title="Some or all of the extracted data for this finding are missing.">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                </span>
              </h3>
              <p class="d-print-none font-weight-light">
                It is here that you enter the data extracted from included studies that support this review finding. This data is needed to make a GRADE-CERQual assessment.
              </p>
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

                <back-to-top></back-to-top>
              </template>
              <!--
              <template v-else>
                <p class="d-print-none font-weight-light">
                  To create or make changes to the column headings for this table, do so in the <b-link :to="`/organization/${list.organization}/project/${list.project_id}#My-Data`">My Data</b-link> section of iSoQ, once your headings are created you will be able to add the Extracted Data here.
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
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, VerticalAlign, BorderStyle, PageOrientation } from 'docx'
import editReviewFinding from '../editReviewFinding'
import backToTop from '../backToTop'

export default {
  components: {
    'bc-filters': bCardFilters,
    'bc-action-table': bCardActionTable,
    'edit-review-finding': editReviewFinding,
    'back-to-top': backToTop,
    draggable
  },
  data () {
    return {
      ui: {
        methodological_assessments: {
          display_warning: true
        },
        coherence: {
          display_warning: true
        },
        adequacy: {
          extracted_data: {
            display_warning: true
          },
          chars_of_studies: {
            display_warning: true
          }
        },
        relevance: {
          chars_of_studies: {
            display_warning: true
          }
        },
        showExample: false
      },
      project: {
        inclusion: '',
        exclusion: '',
        review_question: ''
      },
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
        { key: 'cerqual', label: 'GRADE-CERQual Assessment of confidence' },
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
        { key: 'cerqual', label: 'GRADE-CERQual Assessment of confidence' },
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
        methodological_limitations: {option: null, explanation: '', notes: '', title: ''},
        coherence: {option: null, explanation: '', notes: '', title: ''},
        adequacy: {option: null, explanation: '', notes: '', title: ''},
        relevance: {option: null, explanation: '', notes: '', title: ''},
        cerqual: {option: null, explanation: '', notes: '', title: ''}
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
      evidence_profile: [
        {
          isoqf_id: 0,
          cerqual: { explanation: '', option: 0 },
          name: '',
          title: '',
          notes: '',
          coherence: { explanation: '', option: 0 },
          methodological_limitations: { explanation: '', option: 0 },
          references: [],
          relevance: { explanation: '', option: 0 },
          adequacy: { explanation: '', option: 0 }
        }
      ],
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
      },
      showPanel: true
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
    getList: function (fromModal = false) {
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
          this.getStageOneData(fromModal)
          this.getCharsOfStudies()
          this.getMethAssessments()
          this.evidence_profile_table_settings.isBusy = false
          window.scrollTo({ top: 0, behavior: 'smooth' })
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
    getStageOneData: function (fromModal = false) {
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
            if (fromModal) {
              const title = this.buffer_modal_stage_two.title
              const type = this.buffer_modal_stage_two.type
              this.buffer_modal_stage_two = this.evidence_profile[0]
              this.buffer_modal_stage_two.title = title
              this.buffer_modal_stage_two.type = type
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
        cerqual: this.buffer_modal_stage_two.cerqual,
        evidence_profile: {
          methodological_limitations: this.buffer_modal_stage_two.methodological_limitations,
          coherence: this.buffer_modal_stage_two.coherence,
          adequacy: this.buffer_modal_stage_two.adequacy,
          relevance: this.buffer_modal_stage_two.relevance,
          cerqual: this.buffer_modal_stage_two.cerqual
        }
      }
      axios.patch(`/api/isoqf_lists/${this.$route.params.id}`, params)
        .then((response) => {
          this.list.cerqual = response.data['$set'].cerqual
          this.buffer_modal_stage_one = this.initial_modal_stage_one
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    openWarningModal: function () {
      this.$refs['modal-warning-same-txt'].show()
    },
    closeWarningModalDoItNow: function (type = '') {
      this.buffer_modal_stage_two.type = type
      this.$refs['modal-warning-same-txt'].hide()
    },
    closeWarningModalDoItLater: function () {
      this.continueSavingDataModal()
      this.$refs['modal-warning-same-txt'].hide()
    },
    saveStageOneAndTwo: function (type, e) {
      e.preventDefault()
      if (this.checkValidationText(type, this.buffer_modal_stage_two)) {
        this.openWarningModal()
      } else {
        this.continueSavingDataModal()
      }
    },
    checkValidationText: function (type, prop) {
      switch (type) {
        case 'methodological-limitations':
          if (
            prop.methodological_limitations.explanation === 'Minor concerns regarding methodological limitations because...' ||
            prop.methodological_limitations.explanation === 'Moderate concerns regarding methodological limitations because...' ||
            prop.methodological_limitations.explanation === 'Serious concerns regarding methodological limitations because...'
          ) {
            return true
          }
          return false
        case 'coherence':
          if (
            prop.coherence.explanation === 'Minor concerns regarding coherence because...' ||
            prop.coherence.explanation === 'Moderate concerns regarding coherence because...' ||
            prop.coherence.explanation === 'Serious concerns regarding coherence because...'
          ) {
            return true
          }
          return false
        case 'adequacy':
          if (
            prop.adequacy.explanation === 'Minor concerns regarding adequacy because...' ||
            prop.adequacy.explanation === 'Moderate concerns regarding adequacy because...' ||
            prop.adequacy.explanation === 'Serious concerns regarding adequacy because...'
          ) {
            return true
          }
          return false
        case 'relevance':
          if (
            prop.relevance.explanation === 'Minor concerns regarding relevance because...' ||
            prop.relevance.explanation === 'Moderate concerns regarding relevance because...' ||
            prop.relevance.explanation === 'Serious concerns regarding relevance because...'
          ) {
            return true
          }
          return false
        default:
          return false
      }
    },
    continueSavingDataModal: function () {
      this.evidence_profile_table_settings.isBusy = true
      delete this.buffer_modal_stage_two.type
      let params = {
        organization: this.list.organization,
        list_id: this.list.id,
        evidence_profile: this.buffer_modal_stage_two
      }
      if (Object.prototype.hasOwnProperty.call(this.findings, 'id')) {
        axios.patch(`/api/isoqf_findings/${this.findings.id}`, params)
          .then((response) => {
            this.getStageOneData()
            this.saveListName()
            this.$refs['modal-stage-two'].hide()
          })
          .catch((error) => {
            this.printErrors(error)
          })
      } else {
        axios.post(`/api/isoqf_findings`, params)
          .then((response) => {
            this.getStageOneData()
            this.$refs['modal-stage-two'].hide()
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
        'cerqual': 'GRADE-CERQual Assessment of Confidence'
      }
      this.buffer_modal_stage_two.type = type
      this.buffer_modal_stage_two.title = titles[type]
      if (type === 'cerqual') { this.populateCerqualExplanation() }
      this.showPanel = true
      this.$refs['modal-stage-two'].show()
    },
    getCharsOfStudies: function () {
      let params = {
        organization: this.list.organization,
        project_id: this.list.project_id
      }
      axios.get('/api/isoqf_characteristics', {params})
        .then((response) => {
          if (response.data.length) {
            let data = response.data[0]
            let items = []

            let haveContent = 0
            for (let item of data.items) {
              for (let reference of this.list.references) {
                if (reference === item.ref_id) {
                  items.push(item)
                  for (let i in item) {
                    if (item[i] !== 'ref_id' && item[i] !== 'authors') {
                      if (item[i] === '') {
                        haveContent++
                      }
                    }
                  }
                  if (data.fields.length > Object.keys(item).length) {
                    haveContent++
                  }
                }
              }
            }
            if (data.fields.length < 3) {
              haveContent++
            }

            this.ui.adequacy.chars_of_studies.display_warning = true
            this.ui.relevance.chars_of_studies.display_warning = true
            if (!haveContent) {
              this.ui.adequacy.chars_of_studies.display_warning = false
              this.ui.relevance.chars_of_studies.display_warning = false
            }
            data.items = items
            this.characteristics_studies = data
            if (data.fields.length) {
              let fields = JSON.parse(JSON.stringify(data.fields))
              let lastItem = fields.splice(fields.length - 1, 1)
              this.characteristics_studies.last_column = lastItem[0].key.split('_')[1]
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

            let haveContent = 0
            for (let item of data.items) {
              for (let reference of _references) {
                if (reference === item.ref_id) {
                  items.push(item)
                  for (let i in item) {
                    if (item[i] !== 'author' && item[i] !== 'ref_id') {
                      if (item[i] === '') {
                        haveContent++
                      }
                    }
                  }
                  if (data.fields.length > Object.keys(item).length) {
                    haveContent++
                  }
                }
              }
            }
            if (data.fields.length < 3) {
              haveContent++
            }
            this.ui.methodological_assessments.display_warning = true
            if (!haveContent) {
              this.ui.methodological_assessments.display_warning = false
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
            let haveContent = 0
            for (let reference of _references) {
              let index = 0
              for (let item of extractedDataItems) {
                if (item.ref_id === reference) {
                  _items.push({ ref_id: item.ref_id, authors: item.authors, column_0: item.column_0, index: index })
                  for (let i in item) {
                    if (item[i] !== 'ref_id' && item[i] !== 'authors') {
                      if (item[i] === '') {
                        haveContent++
                      }
                    }
                  }
                }
                index++
              }
            }

            this.ui.coherence.display_warning = true
            this.ui.adequacy.extracted_data.display_warning = true
            if (!haveContent) {
              this.ui.coherence.display_warning = false
              this.ui.adequacy.extracted_data.display_warning = false
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
      let newItem = { 'ref_id': item.ref_id, 'authors': item.authors, 'column_0': '' }
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
    exportToWord: function () {
      const filename = (this.project.name + ' - GRADE-CERQual Assessment Worksheet' || 'GRADE-CERQual Assessment Worksheet') + '.doc'
      const doc = new Document()

      doc.addSection({
        size: {
          orientation: PageOrientation.LANDSCAPE
        },
        margins: {
          top: 720,
          right: 720,
          bottom: 720,
          left: 720
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: this.project.name,
                size: 24,
                font: { name: 'Times New Roman' },
                color: '000000'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: 'GRADE-CERQual Assessment Worksheet',
                bold: true,
                size: 28,
                color: '000000'
              })
            ]
          }),
          new Paragraph(''),
          new Table({
            borders: {
              top: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              bottom: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              left: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              right: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              insideHorizontal: {
                size: 1,
                color: '000000',
                style: BorderStyle.SINGLE
              },
              insideVertical: {
                style: BorderStyle.NONE
              }
            },
            width: {
              size: '100%',
              type: WidthType.PERCENTAGE
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '2%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '#',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '28%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Summarized Review Finding',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '12%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Methodological limitations',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '12%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Coherence',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '12%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Adequacy',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '12%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Relevance',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '12%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'GRADE-CERQual Assessment of confidence',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: {
                      fill: '#EEEEEE'
                    },
                    width: {
                      size: '10%',
                      type: WidthType.PERCENTAGE
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'References',
                            bold: true,
                            size: 22
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.evidence_profile[0].isoqf_id,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.evidence_profile[0].name,
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.displaySelectedOption(this.evidence_profile[0].methodological_limitations.option),
                            bold: true,
                            size: 22
                          })
                        ]
                      }),
                      new Paragraph(''),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (this.evidence_profile[0].methodological_limitations.explanation.length) ? 'Explanation: ' + this.evidence_profile[0].methodological_limitations.explanation : '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.displaySelectedOption(this.evidence_profile[0].coherence.option),
                            bold: true,
                            size: 22
                          })
                        ]
                      }),
                      new Paragraph(''),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (this.evidence_profile[0].coherence.explanation.length) ? 'Explanation: ' + this.evidence_profile[0].coherence.explanation : '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.displaySelectedOption(this.evidence_profile[0].adequacy.option),
                            bold: true,
                            size: 22
                          })
                        ]
                      }),
                      new Paragraph(''),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (this.evidence_profile[0].adequacy.explanation.length) ? 'Explanation: ' + this.evidence_profile[0].adequacy.explanation : '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.displaySelectedOption(this.evidence_profile[0].relevance.option),
                            bold: true,
                            size: 22
                          })
                        ]
                      }),
                      new Paragraph(''),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (this.evidence_profile[0].relevance.explanation.length) ? 'Explanation: ' + this.evidence_profile[0].relevance.explanation : '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: this.displayLevelConfidence(this.evidence_profile[0].cerqual.option),
                            bold: true,
                            size: 22
                          })
                        ]
                      }),
                      new Paragraph(''),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: (this.evidence_profile[0].cerqual.explanation.length) ? 'Explanation: ' + this.evidence_profile[0].cerqual.explanation : '',
                            size: 22
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      ...this.generateReferences()
                    ]
                  })
                ]
              })
            ]
          }),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Characteristics of Studies',
                size: 24,
                bold: true
              })
            ]
          }),
          this.generateTable(JSON.parse(JSON.stringify(this.characteristics_studies))),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Methodological Assessments',
                size: 24,
                bold: true
              })
            ]
          }),
          this.generateTable(JSON.parse(JSON.stringify(this.meth_assessments))),
          new Paragraph(''),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Extracted Data',
                size: 24,
                bold: true
              })
            ]
          }),
          this.generateTable(JSON.parse(JSON.stringify(this.extracted_data)))
        ]
      })

      Packer.toBlob(doc).then(blob => {
        saveAs(blob, filename)
      })
    },
    generateTable: function (data) {
      return new Table({
        borders: {
          top: {
            size: 1,
            color: '000000',
            style: BorderStyle.SINGLE
          },
          bottom: {
            size: 1,
            color: '000000',
            style: BorderStyle.SINGLE
          },
          left: {
            size: 1,
            color: '000000',
            style: BorderStyle.SINGLE
          },
          right: {
            size: 1,
            color: '000000',
            style: BorderStyle.SINGLE
          },
          insideHorizontal: {
            size: 1,
            color: '000000',
            style: BorderStyle.SINGLE
          },
          insideVertical: {
            style: BorderStyle.NONE
          }
        },
        width: {
          size: '100%',
          type: WidthType.PERCENTAGE
        },
        rows: [
          this.generateHeaderRow(JSON.parse(JSON.stringify(data.fields))),
          ...this.generateBodyRow(JSON.parse(JSON.stringify(data.items)))
        ]
      })
    },
    generateHeaderRow: function (data) {
      return new TableRow({
        tableHeader: true,
        children: [
          ...this.generateCell(data)
        ]
      })
    },
    generateBodyRow: function (data) {
      return data.map((item) => {
        return new TableRow({
          children: [
            ...this.prepareBodyCell(item)
          ]
        })
      })
    },
    generateCell: function (data) {
      let headers = []
      for (let d of data) {
        if (d.key !== 'ref_id' && d.key !== 'actions') {
          headers.push(d)
        }
      }
      const length = headers.length
      const size = 100 / length
      return headers.map((content) => {
        return new TableCell({
          verticalAlign: VerticalAlign.CENTER,
          width: {
            size: size.toString() + '%',
            type: WidthType.PERCENTAGE
          },
          children: [
            this.generateParagraph(content, true)
          ]
        })
      })
    },
    prepareBodyCell: function (data) {
      if (Object.prototype.hasOwnProperty.call(data, 'index')) {
        delete data.index
      }
      let arr = []
      const keys = Object.keys(data)
      let numbers = []
      for (let key of keys) {
        if (key !== 'ref_id' && key !== 'authors') {
          const newKey = parseInt(key.split('_')[1])
          numbers.push(newKey)
        }
      }
      const len = numbers.sort((a, b) => { return a - b }).slice(-1)[0]
      if (len !== undefined) {
        if (len) {
          arr.push(this.generateBodyCell(data.authors, true, 20))
          for (var cnt = 0; cnt <= len; cnt++) {
            if (Object.prototype.hasOwnProperty.call(data, 'column_' + cnt.toString())) {
              arr.push(this.generateBodyCell(data['column_' + cnt.toString()], false, 20))
            }
          }
        } else {
          arr.push(this.generateBodyCell(data.authors, true, 20))
          arr.push(this.generateBodyCell(data['column_0'], false, 20))
        }
      } else {
        arr.push(this.generateBodyCell(data.authors, true, 20))
        arr.push(this.generateBodyCell(' ', false, 20))
      }
      return arr
    },
    generateBodyCell: function (data, isBold, size) {
      return new TableCell({
        children: [
          this.generateParagraph(data, isBold, size)
        ]
      })
    },
    generateParagraph: function (data, isBold, size) {
      return new Paragraph({
        children: [
          this.generateText(data, isBold, size)
        ]
      })
    },
    generateText: function (data, isBold = false, size = 20) {
      if (Object.prototype.hasOwnProperty.call(data, 'label')) {
        return new TextRun({
          text: data.label,
          bold: isBold,
          size: size
        })
      } else {
        return new TextRun({
          text: data,
          bold: isBold,
          size: size
        })
      }
    },
    generateReferences: function () {
      const allReferences = JSON.parse(JSON.stringify(this.references))
      const listReferences = JSON.parse(JSON.stringify(this.list.references))
      let epReferences = []
      for (let reference of allReferences) {
        if (listReferences.indexOf(reference.id) !== -1) {
          epReferences.push(reference.content)
        }
      }
      let arr = []
      for (let epr of epReferences) {
        arr.push(new Paragraph({
          children: [
            new TextRun({
              text: epr,
              size: 16
            })
          ]
        })
        )
      }
      return arr
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
      if (_index !== -1) {
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
    },
    propExplanation: function (txt, type) {
      this.buffer_modal_stage_two[type].explanation = txt
    },
    populateCerqualExplanation () {
      if (this.buffer_modal_stage_two.methodological_limitations.option !== null) {
        this.buffer_modal_stage_two.cerqual.explanation = this.displaySelectedOption(this.buffer_modal_stage_two.methodological_limitations.option) + ' regarding methodological limitations, ' + this.displaySelectedOption(this.buffer_modal_stage_two.coherence.option) + ' regarding coherence, ' + this.displaySelectedOption(this.buffer_modal_stage_two.adequacy.option) + ' regarding adequacy, and ' + this.displaySelectedOption(this.buffer_modal_stage_two.relevance.option) + ' regarding relevance'
      } else {
        this.buffer_modal_stage_two.cerqual.explanation = ''
      }
    },
    btnShowHideColumn: function (val, panel) {
      const elLeft = document.getElementById('left-modal-content')
      const elRight = document.getElementById('right-modal-content')
      const elSpan = document.getElementById('span-txt')
      const elPanel = document.getElementById('left-' + panel)
      if (val) {
        elLeft.className = 'col-md-1 col-12'
        elRight.className = 'col-md-11 col-12'
        elSpan.innerHTML = '&rsaquo;'
        elPanel.className = 'invisible'
        this.showPanel = false
      } else {
        elLeft.className = 'col-md-4 col-12'
        elRight.className = 'col-md-8 col-12'
        elSpan.innerHTML = '&lsaquo;'
        elPanel.className = 'visible'
        this.showPanel = true
      }
    },
    displaySelectedOption: function (option) {
      if (option === null) {
        return ''
      } else if (option >= 0) {
        return this.select_options[option].text
      } else {
        return ''
      }
    },
    displayLevelConfidence: function (option) {
      if (option !== null) {
        return this.level_confidence[option].text
      }
      return ''
    },
    displayExclamationAlert: function (type) {
      const evidenceProfile = this.evidence_profile[0]
      switch (type) {
        case 'methodological-limitations':
          if (this.checkValidationText(type, evidenceProfile)) {
            return true
          }
          break
        case 'coherence':
          if (this.checkValidationText(type, evidenceProfile)) {
            return true
          }
          break
        case 'adequacy':
          if (this.checkValidationText(type, evidenceProfile)) {
            return true
          }
          break
        case 'relevance':
          if (this.checkValidationText(type, evidenceProfile)) {
            return true
          }
          break
      }
      return false
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
  div >>>
    #span-txt {
      font-size: 2rem;
    }
  div >>>
    label b {
      font-weight: bold;
    }
  @media print {
    @page {
      size: A4 landscape;
    }
  }
</style>
