<template>
  <div>
  <b-modal id="modal-evidence-profile-form" ref="modal-evidence-profile-form" scrollable
    :ok-disabled="!permission"
    @ok="saveEvidenceProfile(selectedOptions.type, $event)" ok-title="Save" ok-variant="outline-success"
    cancel-variant="outline-secondary">
    <template v-slot:modal-title>
      <videoHelp v-if="selectedOptions.type === 'methodological-limitations'"
        :txt="`Evidence profile - ${selectedOptions.title}`" tag="none" urlId="450835272"></videoHelp>
      <videoHelp v-if="selectedOptions.type === 'coherence'" :txt="`Evidence profile - ${selectedOptions.title}`"
        tag="none" urlId="450835237"></videoHelp>
      <videoHelp v-if="selectedOptions.type === 'adequacy'" :txt="`Evidence profile - ${selectedOptions.title}`"
        tag="none" urlId="450835188"></videoHelp>
      <videoHelp v-if="selectedOptions.type === 'relevance'" :txt="`Evidence profile - ${selectedOptions.title}`"
        tag="none" urlId="450835406"></videoHelp>
      <videoHelp v-if="selectedOptions.type === 'cerqual'" :txt="`Evidence profile - ${selectedOptions.title}`"
        tag="none" urlId="450835499"></videoHelp>
    </template>
    <b-container fluid>
      <b-row>
        <b-col id="left-modal-content" cols="12" sm="3">
          <div class="float-right mb-5">
            <span id="span-txt" class="bg-secondary text-white font-weight-bold ml-5 py-1 px-2"
              @click="btnShowHideColumn(showPanel, selectedOptions.type)">&lsaquo;</span>
          </div>

          <div id="left-methodological-limitations" v-if="selectedOptions.type === 'methodological-limitations'">
            <p class="font-weight-bold">
              Do you have any concerns about the methodological quality of
              contributing studies as a whole that could lower your confidence in
              the review finding?
            </p>
            <p class="font-weight-light">
              <b><u>Remember</u></b> this is an assessment of the whole body of
              evidence supporting this review finding, not an assessment of an individual
              contributing study. (guidance available
              <b-link :to="{
                name: 'viewProject',
                params: {
                  org_id: this.list.organization,
                  id: this.list.project_id
                },
                query: { tab: 'Guidance-on-applying-GRADE-CERQual' }
              }">here</b-link>)
            </p>
            <b-form-radio-group v-model="selectedOptions.methodological_limitations.option"
              name="methodological-limitations" stacked :disabled="!permission">
              <b-form-radio value="0">
                No/Very minor concerns
                <small v-b-tooltip.hover
                  title="No or very minor concerns regarding methodological limitations that are unlikely to reduce confidence in the review finding">*</small>
              </b-form-radio>
              <b-form-radio value="1">
                Minor concerns
                <small v-b-tooltip.hover
                  title="Minor concerns regarding methodological limitations that may reduce confidence in the review finding">*</small>
              </b-form-radio>
              <b-form-radio value="2">
                Moderate concerns
                <small v-b-tooltip.hover
                  title="Moderate concerns regarding methodological limitations that will probably reduce confidence in the review finding">*</small>
              </b-form-radio>
              <b-form-radio value="3">
                Serious concerns
                <small v-b-tooltip.hover
                  title="Serious concerns regarding methodological limitations that are very likely to reduce confidence in the review finding">*</small>
              </b-form-radio>
            </b-form-radio-group>
            <p v-if="permission" class="mt-2 font-weight-light text-danger" style="cursor: pointer">
              <a @click="clearMySelection('methodological_limitations')"
                v-if="selectedOptions.methodological_limitations.option !== null">
                <font-awesome-icon icon="trash"></font-awesome-icon>
                clear my selection
              </a>
            </p>
            <p class="pt-3">
              Select a level of concern above and complete the sentence that appears below to explain your concerns (not required for no/very minor concerns)
            </p>
            <b-form-group v-if="selectedOptions.methodological_limitations.option !== null"
              class="mt-4 font-weight-light" label-for="input-ml-explanation">
              <template slot="label">
                <p class="font-weight-bold">
                  {{ showMessage(selectedOptions.methodological_limitations.option, 'methodological_limitations') }}
                </p>
              </template>
              <template slot="description">
                The GRADE-CERQual approach requires you to include an explanation
                for your judgement. Click
                <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4"
                  target="_blank">here</a>
                to see an example
              </template>
              <b-form-textarea id="input-ml-explanation"
                v-model="selectedOptions.methodological_limitations.explanation" rows="6"
                max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <b-form-group class="mt-2 font-weight-light" label-for="input-ml-notes"
              description="Optional space for reviewers to leave notes for each other while working on GRADE-CERQual assessments">
              <template slot="label">
                <videoHelp txt="Notes" tag="none" urlId="462180668"></videoHelp>
              </template>
              <b-form-textarea id="input-ml-notes" v-model="selectedOptions.methodological_limitations.notes" rows="6"
                max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
          </div>

          <div id="left-coherence" v-if="selectedOptions.type === 'coherence'">
            <!-- coherence -->
            <p class="font-weight-bold">
              Do you have any concerns about the coherence between the review
              finding and the underlying data that could lower your confidence in
              the review finding?
            </p>
            <p class="font-weight-light">
              You may have concerns if some of the data from included studies
              contradict the review finding, if it’s not clear if some of the
              underlying data support the review finding, or if there are
              plausible alternative descriptions, interpretations or explanations
              that could be used to synthesise the data. (guidance available
              <b-link :to="{
                name: 'viewProject',
                params: {
                  org_id: this.list.organization,
                  id: this.list.project_id
                },
                query: { tab: 'Guidance-on-applying-GRADE-CERQual' }
              }">here</b-link>)
            </p>
            <p class="font-weight-light">
              <b><u>Remember</u></b>, coherence is not about the consistency of findings between
              studies, but is about the fit between the extracted data and the
              review finding as you have written it.
            </p>
            <b-form-radio-group v-model="selectedOptions.coherence.option" name="coherence" stacked :disabled="!permission">
              <b-form-radio value="0">
                No/Very minor concerns
                <small v-b-tooltip.hover
                  title="No or very minor concerns regarding coherence that are unlikely to reduce confidence in the review finding">*</small>
              </b-form-radio>
              <b-form-radio value="1">
                Minor concerns
                <small v-b-tooltip.hover
                  title="Minor concerns regarding coherence that may reduce confidence in the review finding">*</small>
              </b-form-radio>
              <b-form-radio value="2">
                Moderate concerns
                <small v-b-tooltip.hover
                  title="Moderate concerns regarding coherence that will probably reduce confidence in the review finding">*</small>
              </b-form-radio>
              <b-form-radio value="3">
                Serious concerns
                <small v-b-tooltip.hover
                  title="Serious concerns regarding coherence that are very likely to reduce confidence in the review finding">*</small>
              </b-form-radio>
            </b-form-radio-group>
            <p v-if="permission" class="mt-2 font-weight-light text-danger" style="cursor: pointer">
              <a @click="clearMySelection('coherence')" v-if="selectedOptions.coherence.option !== null">
                <font-awesome-icon icon="trash"></font-awesome-icon>
                clear my selection
              </a>
            </p>
            <p class="pt-3">
              Select a level of concern above and complete the sentence that appears below to explain your concerns (not required for no/very minor concerns)
            </p>
            <b-form-group v-if="selectedOptions.coherence.option !== null" class="mt-4 font-weight-light" label-for="input-coherence-explanation">
              <template slot="label">
                <p class="font-weight-bold">
                  {{ showMessage(selectedOptions.coherence.option, 'coherence') }}
                </p>
              </template>
              <template slot="description">
                The GRADE-CERQual approach requires you to include an explanation
                for your judgement. Click
                <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4"
                  target="_blank">here</a>
                to see an example.
              </template>
              <b-form-textarea id="input-coherence-explanation" v-model="selectedOptions.coherence.explanation" :placeholder="selectedOptions.coherence.option === '0' ? '' : ''" rows="6" max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <b-form-group class="mt-2 font-weight-light" label-for="input-ml-notes"
              description="Optional space for reviewers to leave notes for each other while working on GRADE-CERQual assessments">
              <template slot="label">
                <videoHelp txt="Notes" tag="none" urlId="462180668"></videoHelp>
              </template>
              <b-form-textarea id="input-ml-notes" v-model="selectedOptions.coherence.notes" rows="6"
                max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <!-- adequacy -->
          </div>

          <div id="left-adequacy" v-if="selectedOptions.type === 'adequacy'">
            <p class="font-weight-bold">
              <b>Do you have any concerns about the adequacy of the data (richness
                and /or quantity) supporting the review finding that could lower
                your confidence in the review finding?</b>
              (guidance available
              <b-link :to="{
                name: 'viewProject',
                params: {
                  org_id: this.list.organization,
                  id: this.list.project_id
                },
                query: { tab: 'Guidance-on-applying-GRADE-CERQual' }
              }">here</b-link>)
            </p>
            <b-form-radio-group v-model="selectedOptions.adequacy.option" name="adequacy" stacked :disabled="!permission">
              <b-form-radio value="0">
                No/Very minor concerns
                <small v-b-tooltip.hover
                  title="No or very minor concerns regarding adequacy that are unlikely to reduce confidence in the review finding">*</small>
              </b-form-radio>
              <b-form-radio value="1">
                Minor concerns
                <small v-b-tooltip.hover
                  title="Minor concerns regarding adequacy that may reduce confidence in the review finding">*</small>
              </b-form-radio>
              <b-form-radio value="2">
                Moderate concerns
                <small v-b-tooltip.hover
                  title="Moderate concerns regarding adequacy that will probably reduce confidence in the review finding">*</small>
              </b-form-radio>
              <b-form-radio value="3">
                Serious concerns
                <small v-b-tooltip.hover
                  title="Serious concerns regarding adequacy that are very likely to reduce confidence in the review finding">*</small>
              </b-form-radio>
            </b-form-radio-group>
            <p v-if="permission" class="mt-2 font-weight-light text-danger" style="cursor: pointer">
              <a @click="clearMySelection('adequacy')" v-if="selectedOptions.adequacy.option !== null">
                <font-awesome-icon icon="trash"></font-awesome-icon>
                clear my selection
              </a>
            </p>
            <b-form-group v-if="selectedOptions.adequacy.option !== null" class="mt-4 font-weight-light" label-for="input-adequacy-explanation">
              <template slot="label">
                <p class="font-weight-bold">
                  {{ showMessage(selectedOptions.adequacy.option, 'adequacy') }}
                </p>
              </template>
              <template slot="description">
                The GRADE-CERQual approach requires you to include an explanation
                for your judgement. Click
                <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4"
                  target="_blank">here</a>
                to see an example.
              </template>
              <b-form-textarea id="input-adequacy-explanation" v-model="selectedOptions.adequacy.explanation" :placeholder="selectedOptions.adequacy.option === '0' ? '' : ''" rows="6" max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <b-form-group class="mt-2 font-weight-light" label-for="input-ml-notes"
              description="Optional space for reviewers to leave notes for each other while working on GRADE-CERQual assessments">
              <template slot="label">
                <videoHelp txt="Notes" tag="none" urlId="462180668"></videoHelp>
              </template>
              <b-form-textarea id="input-ml-notes" v-model="selectedOptions.adequacy.notes" rows="6"
                max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <!-- relevance -->
          </div>

          <div id="left-relevance" v-if="selectedOptions.type === 'relevance'">
            <p class="font-weight-bold">
              Do you have any concerns about the relevance of the underlying
              studies to your review question that could lower your confidence in
              the review finding?
            </p>
            <p class="font-weight-light">
              You may have concerns if some of the underlying data are of indirect
              relevance, of partial relevance, or if it is unclear whether the
              underlying data is relevant. (guidance available
              <b-link :to="{
                name: 'viewProject',
                params: {
                  org_id: this.list.organization,
                  id: this.list.project_id
                },
                query: { tab: 'Guidance-on-applying-GRADE-CERQual' }
              }">here</b-link>)
            </p>
            <b-form-radio-group v-model="selectedOptions.relevance.option" name="relevance" stacked :disabled="!permission">
              <b-form-radio value="0">
                No/Very minor concerns
                <small v-b-tooltip.hover
                  title="No or very minor concerns regarding relevance that are unlikely to reduce confidence in the review finding">*</small>
              </b-form-radio>
              <b-form-radio value="1">
                Minor concerns
                <small v-b-tooltip.hover
                  title="Minor concerns regarding relevance that may reduce confidence in the review finding">*</small>
              </b-form-radio>
              <b-form-radio value="2">
                Moderate concerns
                <small v-b-tooltip.hover
                  title="Moderate concerns regarding relevance that will probably reduce confidence in the review finding">*</small>
              </b-form-radio>
              <b-form-radio value="3">
                Serious concerns
                <small v-b-tooltip.hover
                  title="Serious concerns regarding relevance that are very likely to reduce confidence in the review finding">*</small>
              </b-form-radio>
            </b-form-radio-group>
            <p v-if="permission" class="mt-2 font-weight-light text-danger" style="cursor: pointer">
              <a @click="clearMySelection('relevance')" v-if="selectedOptions.relevance.option !== null">
                <font-awesome-icon icon="trash"></font-awesome-icon>
                clear my selection
              </a>
            </p>
            <b-form-group v-if="selectedOptions.relevance.option !== null" class="mt-4 font-weight-light"
              label-for="input-relevance-explanation" description="The GRADE-CERQual approach requires you to include an explanation for your judgement.">
              <template slot="label">
                <p class="font-weight-bold">
                  {{ showMessage(selectedOptions.relevance.option, 'relevance') }}
                </p>
              </template>
              <b-form-textarea id="input-relevance-explanation" v-model="selectedOptions.relevance.explanation" :placeholder="selectedOptions.relevance.option === '0' ? '' : ''" rows="6" max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <b-form-group class="mt-2 font-weight-light" label-for="input-ml-notes">
              <template slot="label">
                <videoHelp txt="Notes" tag="none" urlId="462180668"></videoHelp>
              </template>
              <template slot="description">
                Optional space for reviewers to leave notes for each other while
                working on GRADE-CERQual assessments. Click
                <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4"
                  target="_blank">here</a>
                to see an example.
              </template>
              <b-form-textarea id="input-ml-notes" v-model="selectedOptions.relevance.notes" rows="6"
                max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <!-- CERQual assessment -->
          </div>

          <div id="left-cerqual" v-if="selectedOptions.type === 'cerqual'">
            <p class="font-weight-bold">
              To what extent is the review finding a reasonable representation of
              the phenomenon of interest?
            </p>
            <p>
              Click
              <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/5"
                target="_blank">here</a>
              for practical guidance on making an overall assessment of confidence
              for a review finding.
            </p>
            <b-form-radio-group v-model="selectedOptions.cerqual.option" @change="commonGenerateCerqualExplanation()" name="cerqual" stacked :disabled="!permission">
              <b-form-radio value="0">
                High confidence
                <small v-b-tooltip.hover
                  title="It is highly likely that the review finding is a reasonable representation of the phenomenon of interest">*</small>
              </b-form-radio>
              <b-form-radio value="1">
                Moderate confidence
                <small v-b-tooltip.hover
                  title="It is likely that the review finding is a reasonable representation of the phenomenon of interest">*</small>
              </b-form-radio>
              <b-form-radio value="2">
                Low confidence
                <small v-b-tooltip.hover
                  title="It is possible that the review finding is a reasonable representation of the phenomenon of interest">*</small>
              </b-form-radio>
              <b-form-radio value="3">
                Very low confidence
                <small v-b-tooltip.hover
                  title="It is not clear whether the review finding is a reasonable representation of the phenomenon of interest">*</small>
              </b-form-radio>
            </b-form-radio-group>
            <p v-if="permission" class="mt-2 font-weight-light text-danger" style="cursor: pointer">
              <a @click="clearMySelection('cerqual')" v-if="selectedOptions.cerqual.option !== null">
                <font-awesome-icon icon="trash"></font-awesome-icon>
                clear my selection
              </a>
            </p>
            <b-form-group v-if="selectedOptions.cerqual.option !== null" class="mt-4 font-weight-light"
              label-for="input-cerqual"
              description="The GRADE-CERQual approach requires you to include an explanation for your judgement.">
              <template slot="label">
                Below is the minimum text required for an explanation. Now add
                detail about the specific concerns for the component(s) that most
                contributed to your assessment.
                <a href="#" @click="
                  ui.showExample
                    ? (ui.showExample = false)
                    : (ui.showExample = true)
                  ">{{ ui.showExample ? "Hide" : "Show" }} example</a>
                <!-- Add detail about any concerns you identified for the four components into the minimum text provided below. Click <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/3" target="_blank">here</a> for an example.-->
                <div class="mt-2 bg-light text-dark p-1" v-if="ui.showExample">
                  <p class="font-italic">
                    If concerns about coherence and relevance contribute most to
                    my decision to downgrade to “low confidence” then I will
                    briefly summarise these specific concerns in brackets e.g.
                  </p>
                  <p class="font-italic">
                    No/very minor concerns regarding methodological limitations,
                    Moderate concerns regarding coherence
                    <b>(some contradictory opinions expressed in the underlying
                      data but not reflected in finding)</b>, No/Very minor concerns regarding adequacy, and Serious
                    concerns regarding relevance
                    <b>(indirectly relevant because studies are all from high
                      income rather than LMICs)</b>
                  </p>
                  <p class="font-italic">
                    [non bolded text is the minimum required text generated
                    automatically and the bolded text are the details I have added
                    to explain the concern]
                  </p>
                </div>
              </template>
              <b-form-textarea id="input-cerqual" v-model="selectedOptions.cerqual.explanation"
                placeholder="Enter an explanation" rows="6" max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <b-form-group class="mt-2 font-weight-light" label-for="input-ml-notes"
              description="Optional space for reviewers to leave notes for each other while working on GRADE-CERQual assessments">
              <template slot="label">
                <videoHelp txt="Notes" tag="none" urlId="462180668"></videoHelp>
              </template>
              <b-form-textarea id="input-ml-notes" v-model="selectedOptions.cerqual.notes" rows="6"
                max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
          </div>
        </b-col>
        <b-col id="right-modal-content" cols="12" sm="9">
          <div v-if="selectedOptions.type === 'methodological-limitations'">
            <b-tabs content-class="mt-3">
              <b-tab active>
                <template slot="title">
                  Methodological Assessments
                  <font-awesome-icon v-if="ui.methodological_assessments.display_warning" class="text-danger"
                    icon="exclamation-circle"></font-awesome-icon>
                </template>
                <h4>Methodological Assessments</h4>
                <p v-if="ui.methodological_assessments.display_warning" class="text-danger">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                  The Methodological Assessments table, or some data within it,
                  are missing. Add missing table/data in
                  <b-link :to="{
                    name: 'viewProject',
                    params: {
                      org_id: this.list.organization,
                      id: this.list.project_id
                    },
                    query: { tab: 'My-Data', step: 4 }
                  }">My Data</b-link>.
                </p>
                <b-table class="table-small-font" responsive head-variant="light" outlined
                  :fields="methAssessments.fieldsObj" :items="methAssessments.items">
                  <template v-slot:cell(authors)="data">
                    <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{ data.item.authors }}</span>
                  </template>
                </b-table>
              </b-tab>
              <b-tab title="Review Finding">
                <edit-review-finding @update-list-data="getList(true)" :list="list" :finding="findings" :permission="permission">
                </edit-review-finding>
              </b-tab>
              <b-tab>
                <template slot="title">
                  Extracted Data
                  <font-awesome-icon v-if="
                    ui.methodological_assessments.extracted_data.display_warning
                  " class="text-danger" icon="exclamation-circle"></font-awesome-icon>
                </template>
                <h4>Extracted data</h4>
                <p v-if="
                  ui.methodological_assessments.extracted_data.display_warning
                " class="text-danger">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                  Some or all of the extracted data for this review finding are missing.
                  Add them into the table below using the edit button for each
                  included study.
                </p>
                <table-extracted-data
                  :showTitle="false"
                  :showFilters="false"
                  :ui="ui"
                  :show="show"
                  :mode="mode"
                  :list="list"
                  :permission="permission"
                  :extractedData="extractedData"
                  :modePrintFieldObject="modePrintFieldObject"
                  :refsWithTitle="refsWithTitle"
                  :showParagraph="false"
                  @printErrors="printErrors"
                  @getExtractedData="getExtractedData"></table-extracted-data>
              </b-tab>
            </b-tabs>
          </div>

          <div v-if="selectedOptions.type === 'coherence'">
            <edit-review-finding @update-list-data="getList(true)" :list="list" :finding="findings" :permission="permission">
            </edit-review-finding>
            <h4>Extracted Data</h4>
            <p v-if="ui.adequacy.extracted_data.display_warning" class="text-danger">
              <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
              Some or all of the extracted data for this review finding are missing. Add
              them into the table below using the edit button for each included
              study.
            </p>
            <table-extracted-data
              :showTitle="false"
              :showFilters="false"
              :ui="ui"
              :show="show"
              :mode="mode"
              :list="list"
              :permission="permission"
              :extractedData="extractedData"
              :modePrintFieldObject="modePrintFieldObject"
              :refsWithTitle="refsWithTitle"
              :showParagraph="false"
              @printErrors="printErrors"
              @getExtractedData="getExtractedData"></table-extracted-data>
          </div>

          <div v-if="selectedOptions.type === 'adequacy'">
            <b-tabs content-class="mt-3">
              <b-tab active>
                <template slot="title">
                  Extracted Data
                  <font-awesome-icon v-if="ui.adequacy.extracted_data.display_warning" class="text-danger"
                    icon="exclamation-circle"></font-awesome-icon>
                </template>
                <h4>Extracted Data</h4>
                <p v-if="ui.adequacy.extracted_data.display_warning" class="text-danger">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                  Some or all of the extracted data for this review finding are missing.
                  Add them into the table below using the edit button for each
                  included study.
                </p>
                <b-table class="table-small-font extracted-data" responsive head-variant="light" outlined :fields="mode === 'view'
                    ? mode_print_fieldsObj
                    : extractedData.fieldsObj
                  " :items="extractedData.items">
                  <template v-slot:cell(authors)="data">
                    <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{ data.item.authors }}</span>
                  </template>
                  <template v-slot:cell(column_0)="data">
                    <template v-if="
                      showEditExtractedDataInPlace.display &&
                      showEditExtractedDataInPlace.item.index ===
                      data.item.index
                    ">
                      <b-form-group>
                        <b-form-textarea rows="6" max-rows="100"
                          v-model="showEditExtractedDataInPlace.item.column_0"></b-form-textarea>
                      </b-form-group>
                    </template>
                    <template v-else>
                      {{ data.item.column_0 }}
                    </template>
                  </template>
                  <template v-slot:cell(actions)="data">
                    <template v-if="
                      showEditExtractedDataInPlace.display &&
                      showEditExtractedDataInPlace.item.index ===
                      data.item.index
                    ">
                      <b-button block variant="success" @click="updateContentExtractedDataItem(data.item.ref_id)">
                        Save
                      </b-button>
                      <b-button block variant="outline-secondary" @click="cancelExtractedDataInPlace">
                        Cancel
                      </b-button>
                    </template>
                    <template v-else>
                      <b-button v-if="permission" variant="outline-success" @click="editExtractedDataInPlace(data.index)">
                        <font-awesome-icon icon="edit" :title="$t('Edit')" />
                      </b-button>
                    </template>
                  </template>
                </b-table>
              </b-tab>
              <b-tab>
                <template slot="title">
                  Characteristics of Studies
                  <font-awesome-icon v-if="ui.adequacy.chars_of_studies.display_warning" class="text-danger"
                    icon="exclamation-circle"></font-awesome-icon>
                </template>
                <h4>Characteristics of Studies</h4>
                <p v-if="ui.adequacy.chars_of_studies.display_warning" class="text-danger">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                  The Characteristics of Studies table, or some data within it,
                  are missing. Add missing table/data in
                  <b-link :to="{
                    name: 'viewProject',
                    params: {
                      org_id: this.list.organization,
                      id: this.list.project_id
                    },
                    query: { tab: 'My-Data', step: 3 }
                  }">My Data</b-link>.
                </p>
                <b-table class="table-small-font" responsive head-variant="light" outlined
                  :fields="charsOfStudies.fieldsObj" :items="charsOfStudies.items">
                  <template v-slot:cell(authors)="data">
                    <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{ data.item.authors }}</span>
                  </template>
                </b-table>
              </b-tab>
              <b-tab title="Review Finding">
                <edit-review-finding @update-list-data="getList(true)" :list="list" :finding="findings" :permission="permission">
                </edit-review-finding>
              </b-tab>
            </b-tabs>
          </div>

          <div v-if="selectedOptions.type === 'relevance'">
            <b-tabs content-class="mt-3">
              <b-tab active>
                <template slot="title">
                  Question and Criteria
                  <font-awesome-icon v-if="
                    project.review_question === ''
                      ? true
                      : false || project.inclusion === ''
                        ? true
                        : false || project.exclusion === ''
                          ? true
                          : false
                  " class="text-danger" icon="exclamation-circle"></font-awesome-icon>
                </template>
                <h4>Review Question</h4>
                <p v-if="project.review_question === ''" class="text-danger">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                  The review question is missing. Add it in
                  <b-link :to="{
                    name: 'viewProject',
                    params: {
                      org_id: this.list.organization,
                      id: this.list.project_id
                    },
                    query: { tab: 'Project-Property' }
                  }">Project Properties</b-link>.
                </p>
                <p>{{ project.review_question }}</p>
                <h4>Inclusion criteria</h4>
                <p v-if="project.inclusion === ''" class="text-danger">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                  The inclusion criteria are missing. Add them in
                  <b-link :to="{
                    name: 'viewProject',
                    params: {
                      org_id: this.list.organization,
                      id: this.list.project_id
                    },
                    query: { tab: 'My-Data', step: 2 }
                  }">My Data</b-link>.
                </p>
                <p>{{ project.inclusion }}</p>
                <h4>Exclusion criteria</h4>
                <p v-if="project.exclusion === ''" class="text-danger">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                  The exclusion criteria are missing. Add them in
                  <b-link :to="{
                    name: 'viewProject',
                    params: {
                      org_id: this.list.organization,
                      id: this.list.project_id
                    },
                    query: { tab: 'My-Data', step: 2 }
                  }">My Data</b-link>.
                </p>
                <p>{{ project.exclusion }}</p>
              </b-tab>
              <b-tab>
                <template slot="title">
                  Characteristics of Studies
                  <font-awesome-icon v-if="ui.adequacy.chars_of_studies.display_warning" class="text-danger"
                    icon="exclamation-circle"></font-awesome-icon>
                </template>
                <h4>Characteristics of Studies</h4>
                <p v-if="ui.adequacy.chars_of_studies.display_warning" class="text-danger">
                  The Characteristics of Studies table, or some data within it,
                  are missing. Add missing table/data in
                  <b-link :to="{
                    name: 'viewProject',
                    params: {
                      org_id: this.list.organization,
                      id: this.list.project_id
                    },
                    query: { tab: 'My-Data', step: 3 }
                  }">My Data</b-link>.
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                </p>
                <b-table class="table-small-font" responsive head-variant="light" outlined
                  :fields="charsOfStudies.fieldsObj" :items="charsOfStudies.items">
                  <template v-slot:cell(authors)="data">
                    <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{ data.item.authors }}</span>
                  </template>
                </b-table>
              </b-tab>
              <b-tab title="Review Finding">
                <edit-review-finding @update-list-data="getList(true)" :list="list" :finding="findings" :permission="permission">
                </edit-review-finding>
              </b-tab>
            </b-tabs>
          </div>

          <div v-if="selectedOptions.type === 'cerqual'">
            <b-tabs content-class="mt-3">
              <b-tab title="Component assessments">
                <h5>Methodological limitations</h5>
                <p>
                  <b>{{ displaySelectedOption(evidenceProfile[0].methodological_limitations.option) }}</b>
                  <template v-if="parseInt( evidenceProfile[0].methodological_limitations.option ) > 0">
                    <br />
                    Explanation:
                    <span v-if="evidenceProfile[0].methodological_limitations.explanation">{{ getExplanation('methodological-limitations', evidenceProfile[0].methodological_limitations.option, evidenceProfile[0].methodological_limitations.explanation) }}</span>
                    <span v-else>Explanation not yet added</span>
                  </template>
                </p>
                <h5>Coherence</h5>
                <p>
                  <b>{{ displaySelectedOption(evidenceProfile[0].coherence.option) }}</b>
                  <template v-if="parseInt(evidenceProfile[0].coherence.option) > 0">
                    <br />
                    Explanation:
                    <span v-if="evidenceProfile[0].coherence.explanation">{{ getExplanation('coherence', evidenceProfile[0].coherence.option, evidenceProfile[0].coherence.explanation) }}</span>
                    <span v-else>Explanation not yet added</span>
                  </template>
                </p>
                <h5>Adequacy</h5>
                <p>
                  <b>{{ displaySelectedOption(evidenceProfile[0].adequacy.option) }}</b>
                  <template v-if="parseInt(evidenceProfile[0].adequacy.option) > 0">
                    <br />
                    Explanation:
                    <span v-if="evidenceProfile[0].adequacy.explanation">{{ getExplanation('adequacy', evidenceProfile[0].adequacy.option, evidenceProfile[0].adequacy.explanation) }}</span>
                    <span v-else>Explanation not yet added</span>
                  </template>
                </p>
                <h5>Relevance</h5>
                <p>
                  <b>{{ displaySelectedOption(evidenceProfile[0].relevance.option) }}</b>
                  <template v-if="parseInt(evidenceProfile[0].relevance.option) > 0">
                    <br />
                    Explanation:
                    <span v-if="evidenceProfile[0].relevance.explanation">{{ getExplanation('relevance', evidenceProfile[0].relevance.option, evidenceProfile[0].relevance.explanation) }}</span>
                    <span v-else>Explanation not yet added</span>
                  </template>
                </p>
              </b-tab>
              <b-tab title="Review finding">
                <edit-review-finding @update-list-data="getList(true)" :list="list" :finding="findings" :permission="permission">
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
              @click="closeWarningModalDoItNow(selectedOptions.type)">Do it now</b-button>
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

    <b-modal
      id="modal-warning-changed-option"
      ref="modal-warning-changed-option"
      title="Warning"
      :hide-footer="true">
      <p>
        By changing this assessment, you will need to redo your overall GRADE-CERQual assessment of confidence. Your confidence level selection will be cleared, and your explanation erased. Your notes will be maintained.
      </p>
      <p v-if="showModalWarningChangedOption">
        Your project will revert to "private" and be removed from the iSoQ database. You can publish the project to the database once you have completed your GRADE-CERQual assessment of confidence.
      </p>
      <p>
        Do you wish to continue?
      </p>
      <b-container>
        <b-row>
          <b-col>
            <b-button
              block
              @click="updateOptions(selectedOptions.type, true)">Yes</b-button>
          </b-col>
          <b-col>
            <b-button
              block
              @click="updateOptions(selectedOptions.type, false)">No</b-button>
          </b-col>
        </b-row>
      </b-container>
    </b-modal>

    <b-modal
      id="modal-warning-cleaning-cerqual"
      ref="modal-warning-cleaning-cerqual"
      title="Warning"
      :hide-footer="true">
      <p>
        {{ clearCerqualWarningMessage }}
      </p>
      <p>
        Do you wish to continue?
      </p>
      <b-container>
        <b-row>
          <b-col>
            <b-button
              block
              @click="updateOptions(selectedOptions.type, true)">Yes</b-button>
          </b-col>
          <b-col>
            <b-button
              block
              @click="updateOptions(selectedOptions.type, false)">No</b-button>
          </b-col>
        </b-row>
      </b-container>
    </b-modal>
  </div>
</template>

<script>
import axios from 'axios'
import { displayExplanation, generateCerqualExplanation } from '../utils/commons'

export default {
  name: 'evidenceProfileForm',
  components: {
    videoHelp: () => import('@/components/videoHelp.vue'),
    'edit-review-finding': () => import('@/components/editReviewFinding.vue'),
    'table-extracted-data': () => import('./editListExtractedData.vue')
  },
  props: {
    modalData: Object,
    list: Object,
    ui: Object,
    methAssessments: Object,
    findings: Object,
    mode: String,
    extractedData: Object,
    refsWithTitle: Array,
    showEditExtractedDataInPlace: Object,
    charsOfStudies: Object,
    project: Object,
    evidenceProfile: Array,
    selectOptions: Array,
    permission: Boolean,
    show: Object,
    modePrintFieldObject: Array
  },
  data () {
    return {
      selectedOptions: {
        methodological_limitations: {
          option: null,
          explanation: '',
          notes: ''
        },
        coherence: {
          option: null,
          explanation: '',
          notes: ''
        },
        adequacy: {
          option: null,
          explanation: '',
          notes: ''
        },
        relevance: {
          option: null,
          explanation: '',
          notes: ''
        },
        title: '',
        type: '',
        isoqf_id: null
      },
      showPanel: true,
      localExtractedData: {
        items: [],
        fields: []
      },
      showModalWarningChangedOption: false
    }
  },
  watch: {
    extractedData: {
      handler: function (val) {
        this.localExtractedData = val
      },
      deep: true
    },
    modalData: function () {
      this.selectedOptions = JSON.parse(JSON.stringify(this.modalData))
    },
    'selectedOptions.methodological_limitations.option': function (val) {
      if (this.modalData.methodological_limitations.option !== val && this.modalData.cerqual.option !== null) {
        this.showModalWarningChangedOption = this.checkIfIsTheOnlyPublished()
        this.$refs['modal-warning-changed-option'].show()
      }
    },
    'selectedOptions.coherence.option': function (val) {
      if (this.modalData.coherence.option !== val && this.modalData.cerqual.option !== null) {
        this.showModalWarningChangedOption = this.checkIfIsTheOnlyPublished()
        this.$refs['modal-warning-changed-option'].show()
      }
    },
    'selectedOptions.adequacy.option': function (val) {
      if (this.modalData.adequacy.option !== val && this.modalData.cerqual.option !== null) {
        this.showModalWarningChangedOption = this.checkIfIsTheOnlyPublished()
        this.$refs['modal-warning-changed-option'].show()
      }
    },
    'selectedOptions.relevance.option': function (val) {
      if (this.modalData.relevance.option !== val && this.modalData.cerqual.option !== null) {
        this.showModalWarningChangedOption = this.checkIfIsTheOnlyPublished()
        this.$refs['modal-warning-changed-option'].show()
      }
    }
  },
  mounted () {
    this.selectedOptions = JSON.parse(JSON.stringify(this.modalData))
    this.localExtractedData = JSON.parse(JSON.stringify(this.extractedData))
  },
  computed: {
    clearCerqualWarningMessage: function () {
      if (this.checkIfIsTheOnlyPublished()) {
        return 'By clearing this assessment, this iSoQ project will revert to "private" and no longer appear on the iSoQ database. You can republish it when you have at least one review finding with a complete GRADE-CERQual assessment.'
      } else {
        return 'By clearing this assessment, this review finding will no longer appear in your published iSoQ project.'
      }
    }
  },
  methods: {
    commonGenerateCerqualExplanation: function () {
      this.selectedOptions.cerqual.explanation = generateCerqualExplanation(this.selectedOptions)
    },
    getExplanation: function (type, option, explanation) {
      return displayExplanation(type, option, explanation)
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
    getReferenceInfo: function (refId) {
      for (let ref of this.refsWithTitle) {
        if (ref.id === refId) {
          return ref.content
        }
      }
    },
    openWarningModalForExplanationText: function () {
      this.$refs['modal-warning-same-txt'].show()
    },
    closeWarningModalDoItNow: function (type = '') {
      this.selectedOptions.type = type
      this.$refs['modal-warning-same-txt'].hide()
    },
    closeWarningModalDoItLater: function () {
      this.continueSavingDataModal()
      this.$refs['modal-warning-same-txt'].hide()
    },
    saveEvidenceProfile: function (type, e) {
      e.preventDefault()
      if (this.checkValidationExplanationText(type, this.selectedOptions)) {
        this.openWarningModalForExplanationText()
      } else {
        if (this.checkIfIsTheOnlyPublished()) {
          let newType = type
          if (type === 'methodological-limitations') {
            newType = 'methodological_limitations'
          }
          if (this.selectedOptions[newType].option === null) {
            this.continueSavingDataModal(true)
          } else {
            this.continueSavingDataModal()
          }
        } else {
          this.continueSavingDataModal()
        }
      }
    },
    checkIfIsTheOnlyPublished: function () {
      if (this.list && this.list.cerqual_lists && this.list.cerqual_lists.includes(this.list.id) && this.list.cerqual_lists.length === 1 && this.list.project.private === false) {
        return true
      }
      return false
    },
    checkValidationExplanationText: function (type, prop) {
      switch (type) {
        case 'methodological-limitations':
          if (parseInt(prop.methodological_limitations.option) > 0 && prop.methodological_limitations.explanation === '') {
            return true
          }
          return false
        case 'coherence':
          if (parseInt(prop.coherence.option) > 0 && prop.coherence.explanation === '') {
            return true
          }
          return false
        case 'adequacy':
          if (parseInt(prop.adequacy.option) > 0 && prop.adequacy.explanation === '') {
            return true
          }
          return false
        case 'relevance':
          if (parseInt(prop.relevance.option) > 0 && prop.relevance.explanation === '') {
            return true
          }
          return false
        default:
          return false
      }
    },
    updateOptions: function (option, status) {
      if (option === 'methodological-limitations') {
        option = 'methodological_limitations'
      }
      if (status) {
        this.selectedOptions.cerqual.option = null
        this.selectedOptions.cerqual.explanation = ''
        if (option === 'cerqual') {
          this.$refs['modal-warning-cleaning-cerqual'].hide()
        } else {
          this.$refs['modal-warning-changed-option'].hide()
        }
      } else {
        this.selectedOptions[option].option = this.modalData[option].option
        if (option === 'cerqual') {
          this.$refs['modal-warning-cleaning-cerqual'].hide()
        } else {
          this.$refs['modal-warning-changed-option'].hide()
        }
      }
    },
    continueSavingDataModal: function (status = false) {
      const selectedOptions = this.selectedOptions
      this.$emit('busyEvidenceProfileTable', true)
      delete this.selectedOptions.type
      let params = {
        organization: this.list.organization,
        list_id: this.list.id,
        evidence_profile: selectedOptions
      }
      if (Object.prototype.hasOwnProperty.call(this.findings, 'id')) {
        axios.patch(`/api/isoqf_findings/${this.findings.id}`, params)
          .then(() => {
            if (status) {
              axios.post(`/api/unpublish/project/${this.list.project_id}`)
                .then(() => {
                  this.$emit('callGetStageOneData', false)
                  this.saveListName()
                  this.$refs['modal-evidence-profile-form'].hide()
                })
                .catch((error) => {
                  this.printErrors(error)
                })
            } else {
              this.$emit('callGetStageOneData', false)
              this.saveListName()
              this.$refs['modal-evidence-profile-form'].hide()
            }
          })
          .catch((error) => {
            this.printErrors(error)
          })
      } else {
        axios.post(`/api/isoqf_findings`, params)
          .then(() => {
            this.$emit('callGetStageOneData', false)
            this.$refs['modal-evidence-profile-form'].hide()
          })
          .catch((error) => {
            this.printErrors(error)
          })
      }
    },
    saveListName: function () {
      let params = {
        cerqual: this.selectedOptions.cerqual,
        evidence_profile: {
          methodological_limitations: this.selectedOptions.methodological_limitations,
          coherence: this.selectedOptions.coherence,
          adequacy: this.selectedOptions.adequacy,
          relevance: this.selectedOptions.relevance,
          cerqual: this.selectedOptions.cerqual
        }
      }
      axios.patch(`/api/isoqf_lists/${this.$route.params.id}`, params)
        .then((response) => {
          this.$emit('update-list-data')
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    openModalEvidenceProfie: function () {
      this.showPanel = true
      this.$refs['modal-evidence-profile-form'].show()
    },
    printErrors: function (error) {
      if (error.response) {
        console.log(error.response.data)
        console.log(error.response.status)
        console.log(error.response.headers)
      } else if (error.request) {
        console.log(error.request)
      } else {
        console.log('Error', error.message)
      }
      console.log(error.config)
    },
    showMessage: function (opt, type) {
      if (opt === null) {
        return ''
      }
      switch (type) {
        case 'methodological_limitations':
          if (opt === '0') {
            return 'No/very minor concerns regarding methodological limitations because'
          } else if (opt === '1') {
            return 'Minor concerns regarding methodological limitations because'
          } else if (opt === '2') {
            return 'Moderate concerns regarding methodological limitations because'
          } else if (opt === '3') {
            return 'Serious concerns regarding methodological limitations because'
          } else {
            return ''
          }
        case 'coherence':
          if (opt === '0') {
            return 'No/very minor concerns regarding coherence because'
          } else if (opt === '1') {
            return 'Minor concerns regarding coherence because'
          } else if (opt === '2') {
            return 'Moderate concerns regarding coherence because'
          } else if (opt === '3') {
            return 'Serious concerns regarding coherence because'
          } else {
            return ''
          }
        case 'adequacy':
          if (opt === '0') {
            return 'No/very minor concerns regarding adequacy because'
          } else if (opt === '1') {
            return 'Minor concerns regarding adequacy because'
          } else if (opt === '2') {
            return 'Moderate concerns regarding adequacy because'
          } else if (opt === '3') {
            return 'Serious concerns regarding adequacy because'
          } else {
            return ''
          }
        case 'relevance':
          if (opt === '0') {
            return 'No/very minor concerns regarding relevance because'
          } else if (opt === '1') {
            return 'Minor concerns regarding relevance because'
          } else if (opt === '2') {
            return 'Moderate concerns regarding relevance because'
          } else if (opt === '3') {
            return 'Serious concerns regarding relevance because'
          } else {
            return ''
          }
        default:
          return ''
      }
    },
    getList: function (status = false) {
      if (status) {
        this.$emit('update-list-data', true)
      }
    },
    displaySelectedOption: function (option) {
      if (option === null) {
        return ''
      } else if (option >= 0) {
        return this.selectOptions[option].text
      } else {
        return ''
      }
    },
    editExtractedDataInPlace: function (index) {
      const item = JSON.parse(JSON.stringify(this.extractedData.items[index]))
      const data = {
        display: true,
        item: item
      }
      this.$emit('setShowEditExtractedDataInPlace', data)
    },
    cancelExtractedDataInPlace: function () {
      const data = {
        display: false,
        item: {}
      }
      this.$emit('setShowEditExtractedDataInPlace', data)
    },
    updateContentExtractedDataItem: function (refId) {
      let _items = JSON.parse(JSON.stringify(this.extractedData.items))

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
      axios.patch(`/api/isoqf_extracted_data/${this.extractedData.id}`, params)
        .then(() => {
          this.$emit('getExtractedData', true)
          const data = {
            display: false,
            item: {}
          }
          this.$emit('setShowEditExtractedDataInPlace', data)
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getExtractedData: function (status) {
      this.$emit('getExtractedData', status)
    },
    clearMySelection: function (option) {
      switch (option) {
        case 'methodological_limitations':
          this.selectedOptions.methodological_limitations.option = null
          this.selectedOptions.methodological_limitations.explanation = ''
          this.selectedOptions.methodological_limitations.example = ''
          break
        case 'coherence':
          this.selectedOptions.coherence.option = null
          this.selectedOptions.coherence.explanation = ''
          break
        case 'adequacy':
          this.selectedOptions.adequacy.option = null
          this.selectedOptions.adequacy.explanation = ''
          break
        case 'relevance':
          this.selectedOptions.relevance.option = null
          this.selectedOptions.relevance.explanation = ''
          break
        case 'cerqual':
          this.selectedOptions.cerqual.option = null
          this.selectedOptions.cerqual.explanation = ''
          this.$refs['modal-warning-cleaning-cerqual'].show()
          break
      }
    }
  }
}
</script>
