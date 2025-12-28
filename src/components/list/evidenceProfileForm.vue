<template>
  <div>
  <b-modal id="modal-evidence-profile-form" ref="modal-evidence-profile-form" scrollable
    :ok-disabled="!permission"
    @ok="saveEvidenceProfile(selectedOptions.type, $event)" :ok-title="$t('common.save')" ok-variant="outline-success"
    cancel-variant="outline-secondary">
    <template v-slot:modal-title>
      <videoHelp v-if="selectedOptions.type === 'methodological-limitations'"
        :txt="$t('worksheet_nav.evidence_profile') + ' - ' + selectedOptions.title" tag="none" urlId="450835272"></videoHelp>
      <videoHelp v-if="selectedOptions.type === 'coherence'" :txt="$t('worksheet_nav.evidence_profile') + ' - ' + selectedOptions.title"
        tag="none" urlId="450835237"></videoHelp>
      <videoHelp v-if="selectedOptions.type === 'adequacy'" :txt="$t('worksheet_nav.evidence_profile') + ' - ' + selectedOptions.title"
        tag="none" urlId="450835188"></videoHelp>
      <videoHelp v-if="selectedOptions.type === 'relevance'" :txt="$t('worksheet_nav.evidence_profile') + ' - ' + selectedOptions.title"
        tag="none" urlId="450835406"></videoHelp>
      <videoHelp v-if="selectedOptions.type === 'cerqual'" :txt="$t('worksheet_nav.evidence_profile') + ' - ' + selectedOptions.title"
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
              {{ $t('worksheet.questions.methodological_limitations') }}
            </p>
            <p class="font-weight-light">
              {{ $t('worksheet.reminders.whole_body') }} ({{ $t('worksheet.labels.guidance_available') }}
              <b-link :to="{
                name: 'viewProject',
                params: {
                  org_id: this.list.organization,
                  id: this.list.project_id
                },
                query: { tab: 'Guidance-on-applying-GRADE-CERQual' }
              }">{{ $t('common.here') }}</b-link>)
            </p>
            <b-form-radio-group v-model="selectedOptions.methodological_limitations.option"
              name="methodological-limitations" stacked :disabled="!permission">
              <b-form-radio value="0">
                {{ $t('worksheet.options.no_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.methodological_limitations.no_concerns')">*</small>
              </b-form-radio>
              <b-form-radio value="1">
                {{ $t('worksheet.options.minor_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.methodological_limitations.minor_concerns')">*</small>
              </b-form-radio>
              <b-form-radio value="2">
                {{ $t('worksheet.options.moderate_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.methodological_limitations.moderate_concerns')">*</small>
              </b-form-radio>
              <b-form-radio value="3">
                {{ $t('worksheet.options.serious_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.methodological_limitations.serious_concerns')">*</small>
              </b-form-radio>
            </b-form-radio-group>
            <p v-if="permission" class="mt-2 font-weight-light text-danger" style="cursor: pointer">
              <a @click="clearMySelection('methodological_limitations')"
                v-if="selectedOptions.methodological_limitations.option !== null">
                <font-awesome-icon icon="trash"></font-awesome-icon>
                {{ $t('worksheet.actions.clear_selection') }}
              </a>
            </p>
            <p class="pt-3">
              {{ $t('worksheet.labels.select_level') }}
            </p>
            <b-form-group v-if="selectedOptions.methodological_limitations.option !== null"
              class="mt-4 font-weight-light" label-for="input-ml-explanation">
              <template slot="label">
                <p class="font-weight-bold">
                  {{ showMessage(selectedOptions.methodological_limitations.option, 'methodological_limitations') }}
                </p>
              </template>
              <template slot="description">
                {{ $t('worksheet.labels.explanation_required') }}
                <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4"
                  target="_blank">{{ $t('common.click') }} {{ $t('common.here') }}</a>
                {{ $t('worksheet.labels.click_here_example') }}
              </template>
              <b-form-textarea id="input-ml-explanation"
                v-model="selectedOptions.methodological_limitations.explanation" rows="6"
                max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <b-form-group class="mt-2 font-weight-light" label-for="input-ml-notes"
              :description="$t('worksheet.labels.notes_description')">
              <template slot="label">
                <videoHelp :txt="$t('common.notes')" tag="none" urlId="462180668"></videoHelp>
              </template>
              <b-form-textarea id="input-ml-notes" v-model="selectedOptions.methodological_limitations.notes" rows="6"
                max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
          </div>

          <div id="left-coherence" v-if="selectedOptions.type === 'coherence'">
            <!-- coherence -->
            <p class="font-weight-bold">
              {{ $t('worksheet.questions.coherence') }}
            </p>
            <p class="font-weight-light">
              {{ $t('worksheet.reminders.coherence_concerns') }} ({{ $t('worksheet.labels.guidance_available') }}
              <b-link :to="{
                name: 'viewProject',
                params: {
                  org_id: this.list.organization,
                  id: this.list.project_id
                },
                query: { tab: 'Guidance-on-applying-GRADE-CERQual' }
              }">{{ $t('common.here') }}</b-link>)
            </p>
            <p class="font-weight-light">
              {{ $t('worksheet.reminders.coherence') }}
            </p>
            <b-form-radio-group v-model="selectedOptions.coherence.option" name="coherence" stacked :disabled="!permission">
              <b-form-radio value="0">
                {{ $t('worksheet.options.no_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.coherence.no_concerns')">*</small>
              </b-form-radio>
              <b-form-radio value="1">
                {{ $t('worksheet.options.minor_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.coherence.minor_concerns')">*</small>
              </b-form-radio>
              <b-form-radio value="2">
                {{ $t('worksheet.options.moderate_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.coherence.moderate_concerns')">*</small>
              </b-form-radio>
              <b-form-radio value="3">
                {{ $t('worksheet.options.serious_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.coherence.serious_concerns')">*</small>
              </b-form-radio>
            </b-form-radio-group>
            <p v-if="permission" class="mt-2 font-weight-light text-danger" style="cursor: pointer">
              <a @click="clearMySelection('coherence')" v-if="selectedOptions.coherence.option !== null">
                <font-awesome-icon icon="trash"></font-awesome-icon>
                {{ $t('worksheet.actions.clear_selection') }}
              </a>
            </p>
            <p class="pt-3">
              {{ $t('worksheet.labels.select_level') }}
            </p>
            <b-form-group v-if="selectedOptions.coherence.option !== null" class="mt-4 font-weight-light" label-for="input-coherence-explanation">
              <template slot="label">
                <p class="font-weight-bold">
                  {{ showMessage(selectedOptions.coherence.option, 'coherence') }}
                </p>
              </template>
              <template slot="description">
                {{ $t('worksheet.labels.explanation_required') }}
                <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4"
                  target="_blank">{{ $t('common.click') }} {{ $t('common.here') }}</a>
                {{ $t('worksheet.labels.click_here_example') }}
              </template>
              <b-form-textarea id="input-coherence-explanation" v-model="selectedOptions.coherence.explanation" :placeholder="selectedOptions.coherence.option === '0' ? '' : ''" rows="6" max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <b-form-group class="mt-2 font-weight-light" label-for="input-ml-notes"
              :description="$t('worksheet.labels.notes_description')">
              <template slot="label">
                <videoHelp :txt="$t('common.notes')" tag="none" urlId="462180668"></videoHelp>
              </template>
              <b-form-textarea id="input-ml-notes" v-model="selectedOptions.coherence.notes" rows="6"
                max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <!-- adequacy -->
          </div>

          <div id="left-adequacy" v-if="selectedOptions.type === 'adequacy'">
            <p class="font-weight-bold">
              <b>{{ $t('worksheet.questions.adequacy_bold') }}</b>
              ({{ $t('worksheet.labels.guidance_available') }}
              <b-link :to="{
                name: 'viewProject',
                params: {
                  org_id: this.list.organization,
                  id: this.list.project_id
                },
                query: { tab: 'Guidance-on-applying-GRADE-CERQual' }
              }">{{ $t('common.here') }}</b-link>)
            </p>
            <b-form-radio-group v-model="selectedOptions.adequacy.option" name="adequacy" stacked :disabled="!permission">
              <b-form-radio value="0">
                {{ $t('worksheet.options.no_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.adequacy.no_concerns')">*</small>
              </b-form-radio>
              <b-form-radio value="1">
                {{ $t('worksheet.options.minor_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.adequacy.minor_concerns')">*</small>
              </b-form-radio>
              <b-form-radio value="2">
                {{ $t('worksheet.options.moderate_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.adequacy.moderate_concerns')">*</small>
              </b-form-radio>
              <b-form-radio value="3">
                {{ $t('worksheet.options.serious_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.adequacy.serious_concerns')">*</small>
              </b-form-radio>
            </b-form-radio-group>
            <p v-if="permission" class="mt-2 font-weight-light text-danger" style="cursor: pointer">
              <a @click="clearMySelection('adequacy')" v-if="selectedOptions.adequacy.option !== null">
                <font-awesome-icon icon="trash"></font-awesome-icon>
                {{ $t('worksheet.actions.clear_selection') }}
              </a>
            </p>
            <b-form-group v-if="selectedOptions.adequacy.option !== null" class="mt-4 font-weight-light" label-for="input-adequacy-explanation">
              <template slot="label">
                <p class="font-weight-bold">
                  {{ showMessage(selectedOptions.adequacy.option, 'adequacy') }}
                </p>
              </template>
              <template slot="description">
                {{ $t('worksheet.labels.explanation_required') }}
                <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4"
                  target="_blank">{{ $t('common.click') }} {{ $t('common.here') }}</a>
                {{ $t('worksheet.labels.click_here_example') }}
              </template>
              <b-form-textarea id="input-adequacy-explanation" v-model="selectedOptions.adequacy.explanation" :placeholder="selectedOptions.adequacy.option === '0' ? '' : ''" rows="6" max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <b-form-group class="mt-2 font-weight-light" label-for="input-ml-notes"
              :description="$t('worksheet.labels.notes_description')">
              <template slot="label">
                <videoHelp :txt="$t('common.notes')" tag="none" urlId="462180668"></videoHelp>
              </template>
              <b-form-textarea id="input-ml-notes" v-model="selectedOptions.adequacy.notes" rows="6"
                max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <!-- relevance -->
          </div>

          <div id="left-relevance" v-if="selectedOptions.type === 'relevance'">
            <p class="font-weight-bold">
              {{ $t('worksheet.questions.relevance') }}
            </p>
            <p class="font-weight-light">
              {{ $t('worksheet.reminders.relevance_concerns') }} ({{ $t('worksheet.labels.guidance_available') }}
              <b-link :to="{
                name: 'viewProject',
                params: {
                  org_id: this.list.organization,
                  id: this.list.project_id
                },
                query: { tab: 'Guidance-on-applying-GRADE-CERQual' }
              }">{{ $t('common.here') }}</b-link>)
            </p>
            <b-form-radio-group v-model="selectedOptions.relevance.option" name="relevance" stacked :disabled="!permission">
              <b-form-radio value="0">
                {{ $t('worksheet.options.no_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.relevance.no_concerns')">*</small>
              </b-form-radio>
              <b-form-radio value="1">
                {{ $t('worksheet.options.minor_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.relevance.minor_concerns')">*</small>
              </b-form-radio>
              <b-form-radio value="2">
                {{ $t('worksheet.options.moderate_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.relevance.moderate_concerns')">*</small>
              </b-form-radio>
              <b-form-radio value="3">
                {{ $t('worksheet.options.serious_concerns') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.relevance.serious_concerns')">*</small>
              </b-form-radio>
            </b-form-radio-group>
            <p v-if="permission" class="mt-2 font-weight-light text-danger" style="cursor: pointer">
              <a @click="clearMySelection('relevance')" v-if="selectedOptions.relevance.option !== null">
                <font-awesome-icon icon="trash"></font-awesome-icon>
                {{ $t('worksheet.actions.clear_selection') }}
              </a>
            </p>
            <b-form-group v-if="selectedOptions.relevance.option !== null" class="mt-4 font-weight-light"
              label-for="input-relevance-explanation" :description="$t('worksheet.labels.explanation_required')">
              <template slot="label">
                <p class="font-weight-bold">
                  {{ showMessage(selectedOptions.relevance.option, 'relevance') }}
                </p>
              </template>
              <b-form-textarea id="input-relevance-explanation" v-model="selectedOptions.relevance.explanation" :placeholder="selectedOptions.relevance.option === '0' ? '' : ''" rows="6" max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <b-form-group class="mt-2 font-weight-light" label-for="input-ml-notes">
              <template slot="label">
                <videoHelp :txt="$t('common.notes')" tag="none" urlId="462180668"></videoHelp>
              </template>
              <template slot="description">
                {{ $t('worksheet.labels.notes_description') }}. {{ $t('common.click') }}
                <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4"
                  target="_blank">{{ $t('common.here') }}</a>
                {{ $t('worksheet.labels.click_here_example') }}.
              </template>
              <b-form-textarea id="input-ml-notes" v-model="selectedOptions.relevance.notes" rows="6"
                max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <!-- CERQual assessment -->
          </div>

          <div id="left-cerqual" v-if="selectedOptions.type === 'cerqual'">
            <p class="font-weight-bold">
              {{ $t('worksheet.labels.cerqual_question') }}
            </p>
            <p>
              {{ $t('common.click') }}
              <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/5"
                target="_blank">{{ $t('common.here') }}</a>
              {{ $t('worksheet.labels.cerqual_guidance_link') }}
            </p>
            <b-form-radio-group v-model="selectedOptions.cerqual.option" @change="commonGenerateCerqualExplanation()" name="cerqual" stacked :disabled="!permission">
              <b-form-radio value="0">
                {{ $t('worksheet.options.high_confidence') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.cerqual.high')">*</small>
              </b-form-radio>
              <b-form-radio value="1">
                {{ $t('worksheet.options.moderate_confidence') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.cerqual.moderate')">*</small>
              </b-form-radio>
              <b-form-radio value="2">
                {{ $t('worksheet.options.low_confidence') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.cerqual.low')">*</small>
              </b-form-radio>
              <b-form-radio value="3">
                {{ $t('worksheet.options.very_low_confidence') }}
                <small v-b-tooltip.hover
                  :title="$t('worksheet.tooltips.cerqual.very_low')">*</small>
              </b-form-radio>
            </b-form-radio-group>
            <p v-if="permission" class="mt-2 font-weight-light text-danger" style="cursor: pointer">
              <a @click="clearMySelection('cerqual')" v-if="selectedOptions.cerqual.option !== null">
                <font-awesome-icon icon="trash"></font-awesome-icon>
                {{ $t('worksheet.actions.clear_selection') }}
              </a>
            </p>
            <b-form-group v-if="selectedOptions.cerqual.option !== null" class="mt-4 font-weight-light"
              label-for="input-cerqual"
              :description="$t('worksheet.labels.explanation_required')">
              <template slot="label">
                {{ $t('worksheet.labels.cerqual_explanation_instruction') }}
                <a href="#" @click="
                  ui.showExample
                    ? (ui.showExample = false)
                    : (ui.showExample = true)
                  ">{{ ui.showExample ? $t('worksheet.actions.hide_example') : $t('worksheet.actions.show_example') }}</a>
                <!-- Add detail about any concerns you identified for the four components into the minimum text provided below. Click <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/3" target="_blank">here</a> for an example.-->
                <div class="mt-2 bg-light text-dark p-1" v-if="ui.showExample">
                  <p class="font-italic">
                    {{ $t('worksheet.labels.example_intro') }}
                  </p>
                  <p class="font-italic">
                    {{ $t('worksheet.labels.example_body_1') }}
                    <b>{{ $t('worksheet.labels.example_body_bold_1') }}</b>
                    {{ $t('worksheet.labels.example_body_2') }}
                    <b>{{ $t('worksheet.labels.example_body_bold_2') }}</b>
                  </p>
                  <p class="font-italic">
                    {{ $t('worksheet.labels.example_footer') }}
                  </p>
                </div>
              </template>
              <b-form-textarea id="input-cerqual" v-model="selectedOptions.cerqual.explanation"
                :placeholder="$t('common.enter_explanation')" rows="6" max-rows="100" :disabled="!permission"></b-form-textarea>
            </b-form-group>
            <b-form-group class="mt-2 font-weight-light" label-for="input-ml-notes"
              :description="$t('worksheet.labels.notes_description')">
              <template slot="label">
                <videoHelp :txt="$t('common.notes')" tag="none" urlId="462180668"></videoHelp>
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
                  {{ $t('worksheet.domains.methodological_limitations') }}
                  <font-awesome-icon v-if="ui.methodological_assessments.display_warning" class="text-danger"
                    icon="exclamation-circle"></font-awesome-icon>
                </template>
                <h4>{{ $t('worksheet.domains.methodological_limitations') }}</h4>
                <p v-if="ui.methodological_assessments.display_warning" class="text-danger">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                  {{ $t('worksheet.warnings.meth_missing') }}
                  {{ $t('common.add') }} {{ $t('common.here') }}
                  <b-link :to="{
                    name: 'viewProject',
                    params: {
                      org_id: this.list.organization,
                      id: this.list.project_id
                    },
                    query: { tab: 'My-Data', step: 4 }
                  }">{{ $t('common.my_data') }}</b-link>.
                </p>
                <b-table class="table-small-font" responsive head-variant="light" outlined
                  :fields="methAssessments.fieldsObj" :items="methAssessments.items">
                  <template v-slot:cell(authors)="data">
                    <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{ data.item.authors }}</span>
                  </template>
                </b-table>
              </b-tab>
              <b-tab :title="$t('worksheet.titles.review_finding')">
                <edit-review-finding @update-list-data="getList(true)" :list="list" :finding="findings" :permission="permission">
                </edit-review-finding>
              </b-tab>
              <b-tab>
                <template slot="title">
                  {{ $t('worksheet.extracted_data') }}
                  <font-awesome-icon v-if="
                    ui.methodological_assessments.extracted_data.display_warning
                  " class="text-danger" icon="exclamation-circle"></font-awesome-icon>
                </template>
                <h4>{{ $t('worksheet.extracted_data') }}</h4>
                <p v-if="
                  ui.methodological_assessments.extracted_data.display_warning
                " class="text-danger">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                  {{ $t('worksheet.warnings.extracted_data_missing') }}
                  {{ $t('common.add') }} {{ $t('common.here') }}
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
            <h4>{{ $t('worksheet.extracted_data') }}</h4>
            <p v-if="ui.adequacy.extracted_data.display_warning" class="text-danger">
              <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
              {{ $t('worksheet.warnings.extracted_data_missing_detail') }}
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
                  {{ $t('worksheet.extracted_data') }}
                  <font-awesome-icon v-if="ui.adequacy.extracted_data.display_warning" class="text-danger"
                    icon="exclamation-circle"></font-awesome-icon>
                </template>
                <h4>{{ $t('worksheet.extracted_data') }}</h4>
                <p v-if="ui.adequacy.extracted_data.display_warning" class="text-danger">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                  {{ $t('worksheet.warnings.extracted_data_missing_detail') }}
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
                        {{ $t('common.save') }}
                      </b-button>
                      <b-button block variant="outline-secondary" @click="cancelExtractedDataInPlace">
                        {{ $t('common.cancel') }}
                      </b-button>
                    </template>
                    <template v-else>
                      <b-button v-if="permission" variant="outline-success" @click="editExtractedDataInPlace(data.index)">
                        <font-awesome-icon icon="edit" :title="$t('common.edit')" />
                      </b-button>
                    </template>
                  </template>
                </b-table>
              </b-tab>
              <b-tab>
                <template slot="title">
                  {{ $t('worksheet.characteristics_of_studies') }}
                  <font-awesome-icon v-if="ui.adequacy.chars_of_studies.display_warning" class="text-danger"
                    icon="exclamation-circle"></font-awesome-icon>
                </template>
                <h4>{{ $t('worksheet.characteristics_of_studies') }}</h4>
                <p v-if="ui.adequacy.chars_of_studies.display_warning" class="text-danger">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                  {{ $t('worksheet.warnings.chars_of_studies_missing') }}
                  <b-link :to="{
                    name: 'viewProject',
                    params: {
                      org_id: this.list.organization,
                      id: this.list.project_id
                    },
                    query: { tab: 'My-Data', step: 3 }
                  }">{{ $t('common.my_data') }}</b-link>.
                </p>
                <b-table class="table-small-font" responsive head-variant="light" outlined
                  :fields="charsOfStudies.fieldsObj" :items="charsOfStudies.items">
                  <template v-slot:cell(authors)="data">
                    <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{ data.item.authors }}</span>
                  </template>
                </b-table>
              </b-tab>
              <b-tab :title="$t('worksheet.titles.review_finding')">
                <edit-review-finding @update-list-data="getList(true)" :list="list" :finding="findings" :permission="permission">
                </edit-review-finding>
              </b-tab>
            </b-tabs>
          </div>

          <div v-if="selectedOptions.type === 'relevance'">
            <b-tabs content-class="mt-3">
              <b-tab active>
                <template slot="title">
                  {{ $t('worksheet.titles.question_criteria') }}
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
                <h4>{{ $t('worksheet.titles.review_question') }}</h4>
                <p v-if="project.review_question === ''" class="text-danger">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                  {{ $t('worksheet.warnings.review_question_missing') }}
                  {{ $t('common.add') }} {{ $t('common.here') }}
                  <b-link :to="{
                    name: 'viewProject',
                    params: {
                      org_id: this.list.organization,
                      id: this.list.project_id
                    },
                    query: { tab: 'Project-Property' }
                  }">{{ $t('common.project_properties') }}</b-link>.
                </p>
                <p>{{ project.review_question }}</p>
                <h4>{{ $t('worksheet.titles.inclusion_criteria') }}</h4>
                <p v-if="project.inclusion === ''" class="text-danger">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                  {{ $t('worksheet.warnings.inclusion_missing') }}
                  <b-link :to="{
                    name: 'viewProject',
                    params: {
                      org_id: this.list.organization,
                      id: this.list.project_id
                    },
                    query: { tab: 'My-Data', step: 2 }
                  }">{{ $t('common.my_data') }}</b-link>.
                </p>
                <p>{{ project.inclusion }}</p>
                <h4>{{ $t('worksheet.titles.exclusion_criteria') }}</h4>
                <p v-if="project.exclusion === ''" class="text-danger">
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                  {{ $t('worksheet.warnings.exclusion_missing') }}
                  <b-link :to="{
                    name: 'viewProject',
                    params: {
                      org_id: this.list.organization,
                      id: this.list.project_id
                    },
                    query: { tab: 'My-Data', step: 2 }
                  }">{{ $t('common.my_data') }}</b-link>.
                </p>
                <p>{{ project.exclusion }}</p>
              </b-tab>
              <b-tab>
                <template slot="title">
                  {{ $t('worksheet.characteristics_of_studies') }}
                  <font-awesome-icon v-if="ui.adequacy.chars_of_studies.display_warning" class="text-danger"
                    icon="exclamation-circle"></font-awesome-icon>
                </template>
                <h4>{{ $t('worksheet.characteristics_of_studies') }}</h4>
                <p v-if="ui.adequacy.chars_of_studies.display_warning" class="text-danger">
                  {{ $t('worksheet.warnings.chars_of_studies_missing') }}
                  <b-link :to="{
                    name: 'viewProject',
                    params: {
                      org_id: this.list.organization,
                      id: this.list.project_id
                    },
                    query: { tab: 'My-Data', step: 3 }
                  }">{{ $t('common.my_data') }}</b-link>.
                  <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                </p>
                <b-table class="table-small-font" responsive head-variant="light" outlined
                  :fields="charsOfStudies.fieldsObj" :items="charsOfStudies.items">
                  <template v-slot:cell(authors)="data">
                    <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{ data.item.authors }}</span>
                  </template>
                </b-table>
              </b-tab>
              <b-tab :title="$t('worksheet.titles.review_finding')">
                <edit-review-finding @update-list-data="getList(true)" :list="list" :finding="findings" :permission="permission">
                </edit-review-finding>
              </b-tab>
            </b-tabs>
          </div>

          <div v-if="selectedOptions.type === 'cerqual'">
            <b-tabs content-class="mt-3">
              <b-tab :title="$t('worksheet.titles.component_assessments')">
                <h5>{{ $t('worksheet.domains.methodological_limitations') }}</h5>
                <p>
                  <b>{{ displaySelectedOption(evidenceProfile[0].methodological_limitations.option) }}</b>
                  <template v-if="parseInt( evidenceProfile[0].methodological_limitations.option ) > 0">
                    <br />
                    {{ $t('common.explanation_colon') }}
                    <span v-if="evidenceProfile[0].methodological_limitations.explanation">{{ getExplanation('methodological-limitations', evidenceProfile[0].methodological_limitations.option, evidenceProfile[0].methodological_limitations.explanation) }}</span>
                    <span v-else>{{ $t('worksheet.labels.explanation_not_added') }}</span>
                  </template>
                </p>
                <h5>{{ $t('worksheet.domains.coherence') }}</h5>
                <p>
                  <b>{{ displaySelectedOption(evidenceProfile[0].coherence.option) }}</b>
                  <template v-if="parseInt(evidenceProfile[0].coherence.option) > 0">
                    <br />
                    {{ $t('common.explanation_colon') }}
                    <span v-if="evidenceProfile[0].coherence.explanation">{{ getExplanation('coherence', evidenceProfile[0].coherence.option, evidenceProfile[0].coherence.explanation) }}</span>
                    <span v-else>{{ $t('worksheet.labels.explanation_not_added') }}</span>
                  </template>
                </p>
                <h5>{{ $t('worksheet.domains.adequacy') }}</h5>
                <p>
                  <b>{{ displaySelectedOption(evidenceProfile[0].adequacy.option) }}</b>
                  <template v-if="parseInt(evidenceProfile[0].adequacy.option) > 0">
                    <br />
                    {{ $t('common.explanation_colon') }}
                    <span v-if="evidenceProfile[0].adequacy.explanation">{{ getExplanation('adequacy', evidenceProfile[0].adequacy.option, evidenceProfile[0].adequacy.explanation) }}</span>
                    <span v-else>{{ $t('worksheet.labels.explanation_not_added') }}</span>
                  </template>
                </p>
                <h5>{{ $t('worksheet.domains.relevance') }}</h5>
                <p>
                  <b>{{ displaySelectedOption(evidenceProfile[0].relevance.option) }}</b>
                  <template v-if="parseInt(evidenceProfile[0].relevance.option) > 0">
                    <br />
                    {{ $t('common.explanation_colon') }}
                    <span v-if="evidenceProfile[0].relevance.explanation">{{ getExplanation('relevance', evidenceProfile[0].relevance.option, evidenceProfile[0].relevance.explanation) }}</span>
                    <span v-else>{{ $t('worksheet.labels.explanation_not_added') }}</span>
                  </template>
                </p>
              </b-tab>
              <b-tab :title="$t('worksheet.titles.review_finding')">
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
      :title="$t('common.warning')"
      :hide-footer="true">
      <p>
        {{ $t('worksheet.warnings.incomplete_explanation') }}
      </p>
      <b-container>
        <b-row align-h="between">
          <b-col
            cols="4">
            <b-button
              block
              @click="closeWarningModalDoItNow(selectedOptions.type)">{{ $t('worksheet.actions.do_it_now') }}</b-button>
          </b-col>
          <b-col
            cols="4">
            <b-button
              block
              @click="closeWarningModalDoItLater()">{{ $t('worksheet.actions.do_it_later') }}</b-button>
          </b-col>
        </b-row>
      </b-container>
    </b-modal>

    <b-modal
      id="modal-warning-changed-option"
      ref="modal-warning-changed-option"
      :title="$t('common.warning')"
      :hide-footer="true">
      <p>
        {{ $t('worksheet.warnings.changed_option') }}
      </p>
      <p v-if="showModalWarningChangedOption">
        {{ $t('worksheet.warnings.revert_private') }}
      </p>
      <p>
        {{ $t('common.continue_question') }}
      </p>
      <b-container>
        <b-row>
          <b-col>
            <b-button
              block
              @click="updateOptions(selectedOptions.type, true)">{{ $t('common.yes') }}</b-button>
          </b-col>
          <b-col>
            <b-button
              block
              @click="updateOptions(selectedOptions.type, false)">{{ $t('common.no') }}</b-button>
          </b-col>
        </b-row>
      </b-container>
    </b-modal>

    <b-modal
      id="modal-warning-cleaning-cerqual"
      ref="modal-warning-cleaning-cerqual"
      :title="$t('common.warning')"
      :hide-footer="true">
      <p>
        {{ clearCerqualWarningMessage }}
      </p>
      <p>
        {{ $t('common.continue_question') }}
      </p>
      <b-container>
        <b-row>
          <b-col>
            <b-button
              block
              @click="updateOptions(selectedOptions.type, true)">{{ $t('common.yes') }}</b-button>
          </b-col>
          <b-col>
            <b-button
              block
              @click="updateOptions(selectedOptions.type, false)">{{ $t('common.no') }}</b-button>
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
        return this.$t('worksheet.warnings.clear_cerqual_revert')
      } else {
        return this.$t('worksheet.warnings.clear_cerqual_simple')
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
      // Use publishable_lists (findings with both cerqual AND references) if available
      // Otherwise fall back to cerqual_lists for backwards compatibility
      const publishableLists = this.list.publishable_lists || this.list.cerqual_lists || []
      if (this.list && publishableLists && publishableLists.includes(this.list.id) && publishableLists.length === 1 && this.list.project.private === false) {
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
      const levels = ['no_concerns', 'minor_concerns', 'moderate_concerns', 'serious_concerns']
      const levelKey = levels[parseInt(opt)]
      if (!levelKey) return ''

      let domainKey = ''
      switch (type) {
        case 'methodological_limitations':
          domainKey = 'methodological_limitations'
          break
        case 'coherence':
          domainKey = 'coherence'
          break
        case 'adequacy':
          domainKey = 'adequacy'
          break
        case 'relevance':
          domainKey = 'relevance'
          break
        default:
          return ''
      }

      return this.$t('worksheet.generated_text.' + levelKey) + ' ' + this.$t('worksheet.domains_lc.' + domainKey) + ' ' + this.$t('common.because')
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
