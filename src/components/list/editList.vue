<template>
  <div>
    <b-alert
      :show="editingUser.show"
      class="position-fixed fixed-bottom m-0 rounded-0"
      style="z-index: 2000;"
      variant="danger"
      dismissible
    >
      The user <b>{{editingUser.first_name}} {{editingUser.last_name}}</b> is editing this finding. The edit mode is disabled.
    </b-alert>
    <edit-header-list
      :organizationId="list.organization"
      :projectId="list.project_id"
      :name="list.name"
      :mode="mode"
      :list="list"></edit-header-list>
    <b-container>
      <edit-list-actions-buttons
        :mode="mode"
        :permission="checkPermissions(list.organization)"
        :project="project"
        :evidenceProfile="evidence_profile"
        :selectOptions="select_options"
        :levelConfidence="level_confidence"
        :references="references"
        :list="list"
        :characteristicStudies="characteristics_studies"
        :methodologicalAssessments="meth_assessments"
        :extractedData="extracted_data"
        :license="theLicense(this.project.license_type)"
        @changeMode="changeMode"
        ></edit-list-actions-buttons>
      <b-row
        class="sticky-top"
        style="background-color: #fff; padding-bottom: 0.3rem"
        v-if="mode==='edit'">
        <b-col
          class="d-print-none"
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
      </b-row>
      <b-row
        class="justify-content-end"
        v-if="mode==='edit' && checkPermissions(list.organization)">
        <b-col
          cols="12"
          md="3">
            <b-button
              class="mt-2"
              @click="changeMode"
              variant="outline-success"
              block>
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
                  <videoHelp v-if="buffer_modal_stage_two.type === 'methodological-limitations'" :txt="`Evidence profile - ${buffer_modal_stage_two.title}`" tag="none" urlId="450835272"></videoHelp>
                  <videoHelp v-if="buffer_modal_stage_two.type === 'coherence'" :txt="`Evidence profile - ${buffer_modal_stage_two.title}`" tag="none" urlId="450835237"></videoHelp>
                  <videoHelp v-if="buffer_modal_stage_two.type === 'adequacy'" :txt="`Evidence profile - ${buffer_modal_stage_two.title}`" tag="none" urlId="450835188"></videoHelp>
                  <videoHelp v-if="buffer_modal_stage_two.type === 'relevance'" :txt="`Evidence profile - ${buffer_modal_stage_two.title}`" tag="none" urlId="450835406"></videoHelp>
                  <videoHelp v-if="buffer_modal_stage_two.type === 'cerqual'" :txt="`Evidence profile - ${buffer_modal_stage_two.title}`" tag="none" urlId="450835499"></videoHelp>
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
                            v-if="buffer_modal_stage_two.methodological_limitations.option !== null"
                            class="mt-4 font-weight-light"
                            label="Explain any concerns you have in your own words."
                            label-for="input-ml-explanation">
                            <template slot="description">
                              The GRADE-CERQual approach requires you to include an explanation for your judgement. Click <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4" target="_blank">here</a> to see an example
                            </template>
                            <b-form-textarea
                              id="input-ml-explanation"
                              v-model="buffer_modal_stage_two.methodological_limitations.explanation"
                              :placeholder="buffer_modal_stage_two.methodological_limitations.option === '0' ? '' : ''"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                          <b-form-group
                            class="mt-2 font-weight-light"
                            label-for="input-ml-notes"
                            description="Optional space for reviewers to leave notes for each other while working on GRADE-CERQual assessments">
                            <template slot="label">
                              <videoHelp txt="Notes" tag="none" urlId="462180668"></videoHelp>
                            </template>
                            <b-form-textarea
                              id="input-ml-notes"
                              v-model="buffer_modal_stage_two.methodological_limitations.notes"
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
                            You may have concerns if some of the data from included studies contradict the review finding, if it’s not clear if some of the underlying data support the review finding, or if there are plausible alternative descriptions, interpretations or explanations that could be used to synthesise the data. (guidance available <b-link :to="`/workspace/${list.organization}/isoqf/${list.project_id}#Guidance-on-Applying-CERQual`">here</b-link>)
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
                            v-if="buffer_modal_stage_two.coherence.option !== null"
                            class="mt-4 font-weight-light"
                            label="Explain any concerns in your own words."
                            label-for="input-coherence-explanation">
                            <template slot="description">
                              The GRADE-CERQual approach requires you to include an explanation for your judgement. Click <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4" target="_blank">here</a> to see an example.
                            </template>
                            <b-form-textarea
                              id="input-coherence-explanation"
                              v-model="buffer_modal_stage_two.coherence.explanation"
                              :placeholder="buffer_modal_stage_two.coherence.option === '0' ? '' : ''"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                          <b-form-group
                            class="mt-2 font-weight-light"
                            label-for="input-ml-notes"
                            description="Optional space for reviewers to leave notes for each other while working on GRADE-CERQual assessments">
                            <template slot="label">
                              <videoHelp txt="Notes" tag="none" urlId="462180668"></videoHelp>
                            </template>
                            <b-form-textarea
                              id="input-ml-notes"
                              v-model="buffer_modal_stage_two.coherence.notes"
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
                            v-if="buffer_modal_stage_two.adequacy.option !== null"
                            class="mt-4 font-weight-light"
                            label="Explain any concerns in your own words."
                            label-for="input-adequacy-explanation">
                            <template slot="description">
                              The GRADE-CERQual approach requires you to include an explanation for your judgement. Click <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4" target="_blank">here</a> to see an example.
                            </template>
                            <b-form-textarea
                              id="input-adequacy-explanation"
                              v-model="buffer_modal_stage_two.adequacy.explanation"
                              :placeholder="buffer_modal_stage_two.adequacy.option === '0' ? '' : ''"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                          <b-form-group
                            class="mt-2 font-weight-light"
                            label-for="input-ml-notes"
                            description="Optional space for reviewers to leave notes for each other while working on GRADE-CERQual assessments">
                            <template slot="label">
                              <videoHelp txt="Notes" tag="none" urlId="462180668"></videoHelp>
                            </template>
                            <b-form-textarea
                              id="input-ml-notes"
                              v-model="buffer_modal_stage_two.adequacy.notes"
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
                            v-if="buffer_modal_stage_two.relevance.option !== null"
                            class="mt-4 font-weight-light"
                            label="Explain any concerns in your own words using the terms indirect, partial or unclear relevance when appropriate."
                            label-for="input-relevance-explanation"
                            description="The GRADE-CERQual approach requires you to include an explanation for your judgement.">
                            <b-form-textarea
                              id="input-relevance-explanation"
                              v-model="buffer_modal_stage_two.relevance.explanation"
                              :placeholder="buffer_modal_stage_two.relevance.option === '0' ? '' : ''"
                              rows="6"
                              max-rows="100"></b-form-textarea>
                          </b-form-group>
                          <b-form-group
                            class="mt-2 font-weight-light"
                            label-for="input-ml-notes">
                            <template slot="label">
                              <videoHelp txt="Notes" tag="none" urlId="462180668"></videoHelp>
                            </template>
                            <template slot="description">
                              Optional space for reviewers to leave notes for each other while working on GRADE-CERQual assessments. Click <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4" target="_blank">here</a> to see an example.
                            </template>
                            <b-form-textarea
                              id="input-ml-notes"
                              v-model="buffer_modal_stage_two.relevance.notes"
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
                            <b-form-radio value="0" @change="propExplanation(cerqualExplanation, 'cerqual')">
                              High confidence <small v-b-tooltip.hover title="It is highly likely that the review finding is a reasonable representation of the phenomenon of interest">*</small>
                            </b-form-radio>
                            <b-form-radio value="1" @change="propExplanation(cerqualExplanation, 'cerqual')">
                              Moderate confidence <small v-b-tooltip.hover title="It is likely that the review finding is a reasonable representation of the phenomenon of interest">*</small>
                            </b-form-radio>
                            <b-form-radio value="2" @change="propExplanation(cerqualExplanation, 'cerqual')">
                              Low confidence <small v-b-tooltip.hover title="It is possible that the review finding is a reasonable representation of the phenomenon of interest">*</small>
                            </b-form-radio>
                            <b-form-radio value="3" @change="propExplanation(cerqualExplanation, 'cerqual')">
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
                            v-if="buffer_modal_stage_two.cerqual.option !== null"
                            class="mt-4 font-weight-light"
                            label-for="input-cerqual"
                            description="The GRADE-CERQual approach requires you to include an explanation for your judgement.">
                            <template slot="label">
                              Below is the minimum text required for an explanation. Now add detail about the specific concerns for the component(s) that most contributed to your assessment. <a href="#" @click="(ui.showExample) ? ui.showExample = false : ui.showExample = true ">{{ (ui.showExample) ? 'Hide' : 'Show' }} example</a>
                              <!-- Add detail about any concerns you identified for the four components into the minimum text provided below. Click <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/3" target="_blank">here</a> for an example.-->
                              <div class="mt-2 bg-light text-dark p-1" v-if="ui.showExample">
                                <p class="font-italic">If concerns about coherence and relevance contribute most to my decision to downgrade to “low confidence” then I will briefly summarise these specific concerns in brackets  e.g.</p>
                                <p class="font-italic">No/very minor concerns regarding methodological limitations, Moderate concerns regarding coherence <b>(some contradictory opinions expressed in the underlying data but not reflected in finding)</b>, No/Very minor concerns regarding adequacy, and Serious concerns regarding relevance <b>(indirectly relevant because studies are all from high income rather than LMICs)</b></p>
                                <p class="font-italic">[non bolded text is the minimum required text generated automatically and the bolded text are the details I have added to explain the concern]</p>
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
                            label-for="input-ml-notes"
                            description="Optional space for reviewers to leave notes for each other while working on GRADE-CERQual assessments">
                            <template slot="label">
                              <videoHelp txt="Notes" tag="none" urlId="462180668"></videoHelp>
                            </template>
                            <b-form-textarea
                              id="input-ml-notes"
                              v-model="buffer_modal_stage_two.cerqual.notes"
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
                                <template
                                  v-slot:cell(authors)="data">
                                  <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{data.item.authors}}</span>
                                </template>
                              </b-table>
                            </b-tab>
                            <b-tab title="Review Finding">
                              <edit-review-finding
                                @update-list-data="getList(true)"
                                :list="list"
                                :finding="findings">
                              </edit-review-finding>
                            </b-tab>
                            <b-tab>
                              <template slot="title">
                                Extracted Data <font-awesome-icon v-if="ui.methodological_assessments.extracted_data.display_warning" class="text-danger" icon="exclamation-circle"></font-awesome-icon>
                              </template>
                              <h4>Extracted data</h4>
                              <p
                                v-if="ui.methodological_assessments.extracted_data.display_warning"
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
                                <template
                                  v-slot:cell(authors)="data">
                                  <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{data.item.authors}}</span>
                                </template>
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
                                      @click="updateContentExtractedDataItem(data.item.ref_id)">
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
                            <template
                              v-slot:cell(authors)="data">
                              <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{data.item.authors}}</span>
                            </template>
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
                                  @click="updateContentExtractedDataItem(data.item.ref_id)">
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
                                <template
                                  v-slot:cell(authors)="data">
                                  <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{data.item.authors}}</span>
                                </template>
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
                                      @click="updateContentExtractedDataItem(data.item.ref_id)">
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
                                <template
                                  v-slot:cell(authors)="data">
                                  <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{data.item.authors}}</span>
                                </template>
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
                                <template
                                  v-slot:cell(authors)="data">
                                  <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{data.item.authors}}</span>
                                </template>
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
                            <b-tab title="Component assessments">
                              <h5>Methodological limitations</h5>
                              <p>
                                <b>{{displaySelectedOption(evidence_profile[0].methodological_limitations.option)}}</b>
                                <template v-if="parseInt(evidence_profile[0].methodological_limitations.option) > 0">
                                  <br>
                                  Explanation: <span v-if="evidence_profile[0].methodological_limitations.explanation">{{evidence_profile[0].methodological_limitations.explanation}}</span> <span v-else>Explanation not yet added</span>
                                </template>
                              </p>
                              <h5>Coherence</h5>
                              <p>
                                <b>{{displaySelectedOption(evidence_profile[0].coherence.option)}}</b>
                                <template v-if="parseInt(evidence_profile[0].coherence.option) > 0">
                                  <br>
                                  Explanation: <span v-if="evidence_profile[0].coherence.explanation">{{evidence_profile[0].coherence.explanation}}</span> <span v-else>Explanation not yet added</span>
                                </template>
                              </p>
                              <h5>Adequacy</h5>
                              <p>
                                <b>{{displaySelectedOption(evidence_profile[0].adequacy.option)}}</b>
                                <template v-if="parseInt(evidence_profile[0].adequacy.option) > 0">
                                  <br>
                                  Explanation: <span v-if="evidence_profile[0].adequacy.explanation">{{evidence_profile[0].adequacy.explanation}}</span> <span v-else>Explanation not yet added</span>
                                </template>
                              </p>
                              <h5>Relevance</h5>
                              <p>
                                <b>{{displaySelectedOption(evidence_profile[0].relevance.option)}}</b>
                                <template v-if="parseInt(evidence_profile[0].relevance.option) > 0">
                                  <br>
                                  Explanation: <span v-if="evidence_profile[0].relevance.explanation">{{evidence_profile[0].relevance.explanation}}</span> <span v-else>Explanation not yet added</span>
                                </template>
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
                        @click="closeWarningModalDoItNow(buffer_modal_stage_two.type)">Do it now</b-button>
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

              <div id="progress-status"
                v-if="mode==='edit'"
                class="d-print-none">
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
              </div>

              <evidence-profile-table
                :evidenceProfile="evidence_profile"
                :ui="ui"
                :evidenceProfileTableSettings="evidence_profile_table_settings"
                :references="references"
                :mode="mode"
                :list="list"
                :refsWithTitle="refsWithTitle"
                :project="project"
                :permission="checkPermissions(list.organization)"
                :selectOptions="select_options"
                :levelConfidence="level_confidence"
                :findings="findings"
                @update-list-data="getList"
                @bufferModalStageOne="bufferModalStageOne"
                @bufferModalStageTwo="bufferModalStageTwo"
                @openModalStageTwo="openModalStageTwo"
                @printErrors="printErrors"
              ></evidence-profile-table>

            <table-chars-of-studies
              :ui="ui"
              :show="show"
              :mode="mode"
              :list="list"
              :permission="checkPermissions(list.organization)"
              :charsOfStudies="characteristics_studies"
              :refsWithTitle="refsWithTitle"
              :showParagraph="true"></table-chars-of-studies>

            <table-meth-assessments
              :ui="ui"
              :show="show"
              :mode="mode"
              :list="list"
              :permission="checkPermissions(list.organization)"
              :methAssessments="meth_assessments"
              :refsWithTitle="refsWithTitle"
              :showParagraph="true"></table-meth-assessments>

            <table-extracted-data
              :ui="ui"
              :show="show"
              :mode="mode"
              :list="list"
              :permission="checkPermissions(list.organization)"
              :extractedData="extracted_data"
              :modePrintFieldObject="mode_print_fieldsObj"
              :refsWithTitle="refsWithTitle"
              :showParagraph="true"
              @printErrors="printErrors"
              @getExtractedData="getExtractedData"></table-extracted-data>

            <template v-if="Object.prototype.hasOwnProperty.call(this.project, 'license_type')">
              <div class="mt-5">
                <h5 class="text-info">License type</h5>
                <p class="text-info">{{ theLicense(this.project.license_type) }}</p>
                <!-- <img :src="licenseUrl" :alt="theLicense(this.project.license_type)"> -->
              </div>
            </template>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import draggable from 'vuedraggable'
import { parseReference, printErrors } from '@/utils/tools'
const bCardFilters = () => import(/* webpackChunkName: "backtotop" */'../tableActions/Filters')
const bCardActionTable = () => import(/* webpackChunkName: "backtotop" */'../tableActions/ActionTable')
const editReviewFinding = () => import(/* webpackChunkName: "backtotop" */'../editReviewFinding')
const backToTop = () => import(/* webpackChunkName: "backtotop" */'../backToTop')
const videoHelp = () => import(/* webpackChunkName: "videohelp" */'../videoHelp')
const editHeaderList = () => import(/* webpackChunkName: "editHeaderList" */'./editListHeader')
const editListActionButtons = () => import('./editListActionButtons.vue')
const editListEvidenceProfile = () => import('./editListEvidenceProfile.vue')
const editListCharsOfStudies = () => import('./editListCharsOfStudies.vue')
const editListMethAssessments = () => import('./editListMethAssessments.vue')
const editListExtractedData = () => import('./editListExtractedData.vue')

export default {
  components: {
    'bc-filters': bCardFilters,
    'bc-action-table': bCardActionTable,
    'edit-review-finding': editReviewFinding,
    'back-to-top': backToTop,
    draggable,
    videoHelp,
    'edit-header-list': editHeaderList,
    'edit-list-actions-buttons': editListActionButtons,
    'evidence-profile-table': editListEvidenceProfile,
    'table-chars-of-studies': editListCharsOfStudies,
    'table-meth-assessments': editListMethAssessments,
    'table-extracted-data': editListExtractedData
  },
  data () {
    return {
      licenseUrl: require('../../assets/by-88x31.png'),
      ui: {
        methodological_assessments: {
          display_warning: true,
          extracted_data: {
            display_warning: true
          }
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
      showPanel: true,
      editingUser: {
        show: false
      }
    }
  },
  mounted () {
    this.getList()
  },
  computed: {
    cerqualExplanation: function () {
      if (this.buffer_modal_stage_two.methodological_limitations.option &&
        this.buffer_modal_stage_two.coherence.option &&
        this.buffer_modal_stage_two.adequacy.option &&
        this.buffer_modal_stage_two.relevance.option) {
        return this.displaySelectedOption(this.buffer_modal_stage_two.methodological_limitations.option) + ' regarding methodological limitations, ' + this.displaySelectedOption(this.buffer_modal_stage_two.coherence.option) + ' regarding coherence, ' + this.displaySelectedOption(this.buffer_modal_stage_two.adequacy.option) + ' regarding adequacy, and ' + this.displaySelectedOption(this.buffer_modal_stage_two.relevance.option) + ' regarding relevance'
      } else {
        return ''
      }
    }
  },
  methods: {
    getReferenceInfo: function (refId) {
      for (let ref of this.refsWithTitle) {
        if (ref.id === refId) {
          return ref.content
        }
      }
    },
    checkPermissions: function (organizationId, type = 'can_write') {
      if (this.$store.state.user.personal_organization === organizationId) {
        return true
      }
      if (!Object.prototype.hasOwnProperty.call(this.project, type)) {
        return false
      }
      if (this.project[type].includes(this.$store.state.user.id)) {
        return true
      }
      return false
    },
    changeMode: function () {
      this.mode = (this.mode === 'edit') ? 'view' : 'edit'
    },
    getAllReferences: function () {
      console.log('getAllReferences')
      axios.get(`/api/isoqf_references?organization=${this.list.organization}&project_id=${this.list.project_id}`)
        .then((response) => {
          let _references = response.data
          let _refs = []
          let _refsWithTitles = []
          for (let reference of _references) {
            let refId = reference.id
            let refContent = parseReference(reference, true)
            _refs.push({'id': refId, 'content': refContent})
            let refWithTitle = {'id': refId, 'content': parseReference(reference, false)}
            _refsWithTitles.push(refWithTitle)
          }

          let sortFn = (a, b) => a.content.localeCompare(b.content)
          this.references = _refs.sort(sortFn)
          this.refsWithTitle = _refsWithTitles.sort(sortFn)
          console.log('references', this.references)
          console.log('refswithtitle', this.refsWithTitle)
        })
        .catch((error) => {
          printErrors(error)
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
          // this.checkWrittingStatus(this.list) // disabled for the v1
          this.getProject(this.list.project_id)
          this.getAllReferences()
          this.getStageOneData(fromModal)
          this.getCharsOfStudies()
          this.getMethAssessments()
          this.evidence_profile_table_settings.isBusy = false
          window.scrollTo({ top: 0, behavior: 'smooth' })
        })
        .catch((error) => {
          printErrors(error)
        })
    },
    updateMyData: function () {
      let _extractedData = []
      axios.get(`/api/isoqf_extracted_data?organization=${this.list.organization}&finding_id=${this.findings.id}`)
        .then((response) => {
          if (response.data.length && response.data[0].items.length && this.references.length > response.data[0].items.length) {
            let _items = response.data[0].items
            let _itemsChecks = []
            for (let item of _items) {
              _itemsChecks.push(item.ref_id)
            }
            for (let reference of this.references) {
              if (!_itemsChecks.includes(reference.id)) {
                _extractedData.push({ref_id: reference.id, authors: reference.content})
              }
            }
            _items.push(..._extractedData)
            let params = {
              items: _items
            }
            axios.patch(`/api/isoqf_extracted_data/${response.data[0].id}`, params)
              .then(() => {
                this.getExtractedData()
              })
          }
        })
    },
    getProject: function (projectId) {
      axios.get(`/api/isoqf_projects/${projectId}`)
        .then((response) => {
          this.project = response.data
          if (!Object.prototype.hasOwnProperty.call(this.project, 'inclusion')) {
            this.project.inclusion = ''
          }
          if (!Object.prototype.hasOwnProperty.call(this.project, 'exclusion')) {
            this.project.exclusion = ''
          }
        })
        .catch((error) => {
          printErrors(error)
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
          printErrors(error)
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
            this.updateMyData()
          }
          this.getStatus()
          this.getExtractedData()
          this.evidence_profile_table_settings.isBusy = false
        }).catch((error) => {
          printErrors(error)
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
    bufferModalStageOne: function (name) {
      this.buffer_modal_stage_one.name = name
    },
    bufferModalStageTwo: function (data, type, title) {
      this.buffer_modal_stage_two = data
      this.buffer_modal_stage_two.type = type
      this.buffer_modal_stage_two.title = title
    },
    openModalStageTwo: function () {
      this.showPanel = true
      this.$refs['modal-stage-two'].show()
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
          printErrors(error)
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
          .then(() => {
            this.getStageOneData()
            this.saveListName()
            this.$refs['modal-stage-two'].hide()
          })
          .catch((error) => {
            printErrors(error)
          })
      } else {
        axios.post(`/api/isoqf_findings`, params)
          .then((response) => {
            this.getStageOneData()
            this.$refs['modal-stage-two'].hide()
          })
          .catch((error) => {
            printErrors(error)
          })
      }
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
          printErrors(error)
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
          printErrors(error)
        })
    },
    getExtractedData: function () {
      let params = {
        organization: this.list.organization,
        finding_id: this.findings.id
      }
      axios.get('/api/isoqf_extracted_data', {params})
        .then((response) => {
          let localData = {id: null, fields: [], items: []}
          if (response.data.length) {
            localData = response.data[0]
            this.extracted_data = response.data[0]
            localData.fields.push({key: 'actions', label: ''})
            let _fields = JSON.parse(JSON.stringify(localData.fields))
            localData.fieldsObj = []
            this.mode_print_fieldsObj = []
            for (let field of _fields) {
              if (field.key !== 'ref_id') {
                localData.fieldsObj.push(field)
                if (field.key !== 'actions') {
                  this.mode_print_fieldsObj.push(field)
                }
              }
            }

            const _references = this.list.references
            let _items = []
            let extractedDataItems = JSON.parse(JSON.stringify(localData.items))
            extractedDataItems.sort(function (a, b) {
              if (a.authors < b.authors) {
                return -1
              }
              if (a.authors > b.authors) {
                return 1
              }
              return 0
            })
            localData.original_items = JSON.parse(JSON.stringify(localData.items))
            let haveContent = 0
            for (let i in _references) {
              let index = 0
              for (let item of extractedDataItems) {
                if (item.ref_id === _references[i]) {
                  _items.push({
                    ref_id: item.ref_id,
                    authors: item.authors,
                    column_0: item.column_0,
                    index: index
                  })
                  if (Object.prototype.hasOwnProperty.call(item, 'column_0')) {
                    if (item.column_0 === '') {
                      haveContent++
                    }
                  } else {
                    haveContent++
                  }
                }
                index++
              }
            }

            this.ui.coherence.display_warning = true
            this.ui.methodological_assessments.extracted_data.display_warning = true
            this.ui.adequacy.extracted_data.display_warning = true
            if (!haveContent) {
              this.ui.coherence.display_warning = false
              this.ui.methodological_assessments.extracted_data.display_warning = false
              this.ui.adequacy.extracted_data.display_warning = false
            }
            this.extracted_data.items = _items
          }
        })
        .catch((error) => {
          printErrors(error)
        })
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
    updateContentExtractedDataItem: function (refId) {
      let _items = JSON.parse(JSON.stringify(this.extracted_data.items))

      if (refId.length) {
        for (let i = 0; i < _items.length; i++) {
          if (_items[i].ref_id === refId) {
            _items[i] = JSON.parse(JSON.stringify(this.showEditExtractedDataInPlace.item))
          }
        }
      }

      const params = {
        organization: this.list.organization,
        finding_id: this.findings.id,
        items: _items
      }
      axios.patch(`/api/isoqf_extracted_data/${this.extracted_data.id}`, params)
        .then(() => {
          this.getExtractedData()
          this.showEditExtractedDataInPlace.display = false
        })
        .catch((error) => {
          printErrors(error)
        })
    },
    propExplanation: function (txt, type) {
      this.buffer_modal_stage_two[type].explanation = txt
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
    theLicense: function (license) {
      const globalLicenses = [
        {
          value: 'BY-NC-ND',
          text: 'CC BY-NC-ND: This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, for noncommercial purposes only, and only so long as attribution is given to the creator.',
          image: 'by-nc-nd-88x31.png'
        },
        { value: 'BY-ND', text: 'CC BY-ND: This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, and only so long as attribution is given to the creator. The license allows for commercial use.', image: 'by-nd-88x31.png' },
        { value: 'BY-NC-SA', text: 'CC BY-NC-SA: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.', image: 'by-nc-sa-88x31.png' },
        { value: 'BY-NC', text: 'CC BY-NC: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator.', image: 'by-nc-88x31.png' },
        { value: 'BY-SA', text: 'CC BY-SA: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.', image: 'by-sa-88x31.png' },
        { value: 'BY', text: 'CC BY: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use.', image: 'by-88x31.png' }
      ]

      if (license) {
        for (let lic of globalLicenses) {
          if (lic.value === license) {
            this.licenseUrl = require('../../assets/' + lic.image)
            return lic.text
          } else {
            this.licenseUrl = require('../../assets/' + globalLicenses[0].image)
            return globalLicenses[0].text
          }
        }
      }

      this.licenseUrl = require('../../assets/' + globalLicenses[0].image)
      return globalLicenses[0].text
    },
    returnTo: function () {
      if (this.list.userEditing === this.$store.state.user.id) {
        const params = { editing: false, userEditing: '' }
        axios.patch(`/api/isoqf_lists/${this.$route.params.id}`, params)
          .then((response) => {
            this.list.editing = false
            this.list.userEditing = ''
            this.$router.push({name: 'viewProject', params: {org_id: this.list.organization, id: this.list.project_id}})
          })
          .catch((error) => {
            console.log(error)
          })
      } else {
        this.$router.push({name: 'viewProject', params: {org_id: this.list.organization, id: this.list.project_id}})
      }
    }
  }
}
</script>

<style scoped>
  div >>>
    .navlink {
      padding: 0.5rem 0.9rem;
    }
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
  /* .extracted-data-table tbody tr td:last-child button {
    display: none;
  }
  .extracted-data-table tbody tr:hover td:last-child button {
    display: inline;
  } */
</style>
