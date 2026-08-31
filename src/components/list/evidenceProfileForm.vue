<template>
  <div>
    <b-modal id="modal-evidence-profile-form" ref="modal-evidence-profile-form" scrollable
      :ok-disabled="!canEditFinding"
      @ok="saveEvidenceProfile(selectedOptions.type, $event)" :ok-title="$t('common.save')" ok-variant="outline-success"
      cancel-variant="outline-secondary" @show="onModalShow" @hidden="onModalHidden">
      <template v-slot:modal-title>
        <videoHelp v-if="selectedOptions.type === 'methodological-limitations'"
          :txt="$t('worksheet_nav.evidence_profile') + ' - ' + selectedOptions.title" tag="none" urlId="450835272">
        </videoHelp>
        <videoHelp v-if="selectedOptions.type === 'coherence'"
          :txt="$t('worksheet_nav.evidence_profile') + ' - ' + selectedOptions.title" tag="none" urlId="450835237">
        </videoHelp>
        <videoHelp v-if="selectedOptions.type === 'adequacy'"
          :txt="$t('worksheet_nav.evidence_profile') + ' - ' + selectedOptions.title" tag="none" urlId="450835188">
        </videoHelp>
        <videoHelp v-if="selectedOptions.type === 'relevance'"
          :txt="$t('worksheet_nav.evidence_profile') + ' - ' + selectedOptions.title" tag="none" urlId="450835406">
        </videoHelp>
        <videoHelp v-if="selectedOptions.type === 'cerqual'"
          :txt="$t('worksheet_nav.evidence_profile') + ' - ' + selectedOptions.title" tag="none" urlId="450835499">
        </videoHelp>
      </template>
      <b-container fluid>
        <b-alert v-if="readOnlyNotice" show variant="warning" class="mb-3"
          data-testid="finding-readonly-notice">
          <font-awesome-icon icon="lock" class="mr-1"></font-awesome-icon>{{ readOnlyNotice }}
        </b-alert>
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
                name="methodological-limitations" stacked :disabled="!canEditFinding">
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
                class="mt-4 font-weight-light" label-for="input-ml-explanation"
                :state="explanationStateFor('methodological_limitations')">
                <template slot="label">
                  <p class="font-weight-bold">
                    {{ showMessage(selectedOptions.methodological_limitations.option, 'methodological_limitations') }}
                  </p>
                </template>
                <template slot="description">
                  <span
                    :class="explanationStateFor('methodological_limitations') === false ? 'text-danger' : 'text-muted'">
                    {{ $t('worksheet.labels.explanation_required') }}
                    <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4"
                      target="_blank"
                      :class="explanationStateFor('methodological_limitations') === false ? 'text-danger' : ''">
                      <u>{{ $t('common.click') }} {{ $t('common.here') }}</u>
                    </a>
                    {{ $t('worksheet.labels.click_here_example') }}
                  </span>
                </template>
                <b-form-textarea id="input-ml-explanation"
                  v-model="selectedOptions.methodological_limitations.explanation" rows="6" max-rows="100"
                  :disabled="!canEditFinding" :state="explanationStateFor('methodological_limitations')"></b-form-textarea>
              </b-form-group>
              <b-form-group class="mt-2 font-weight-light" label-for="input-ml-notes"
                :description="$t('worksheet.labels.notes_description')">
                <template slot="label">
                  <videoHelp :txt="$t('common.notes')" tag="none" urlId="462180668"></videoHelp>
                </template>
                <b-form-textarea id="input-ml-notes" v-model="selectedOptions.methodological_limitations.notes" rows="6"
                  max-rows="100" :disabled="!canEditFinding"></b-form-textarea>
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
              <b-form-radio-group v-model="selectedOptions.coherence.option" name="coherence" stacked
                :disabled="!canEditFinding">
                <b-form-radio value="0">
                  {{ $t('worksheet.options.no_concerns') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.coherence.no_concerns')">*</small>
                </b-form-radio>
                <b-form-radio value="1">
                  {{ $t('worksheet.options.minor_concerns') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.coherence.minor_concerns')">*</small>
                </b-form-radio>
                <b-form-radio value="2">
                  {{ $t('worksheet.options.moderate_concerns') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.coherence.moderate_concerns')">*</small>
                </b-form-radio>
                <b-form-radio value="3">
                  {{ $t('worksheet.options.serious_concerns') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.coherence.serious_concerns')">*</small>
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
              <b-form-group v-if="selectedOptions.coherence.option !== null" class="mt-4 font-weight-light"
                label-for="input-coherence-explanation" :state="explanationStateFor('coherence')">
                <template slot="label">
                  <p class="font-weight-bold">
                    {{ showMessage(selectedOptions.coherence.option, 'coherence') }}
                  </p>
                </template>
                <template slot="description">
                  <span :class="explanationStateFor('coherence') === false ? 'text-danger' : 'text-muted'">
                    {{ $t('worksheet.labels.explanation_required') }}
                    <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4"
                      target="_blank" :class="explanationStateFor('coherence') === false ? 'text-danger' : ''">
                      <u>{{ $t('common.click') }} {{ $t('common.here') }}</u>
                    </a>
                    {{ $t('worksheet.labels.click_here_example') }}
                  </span>
                </template>
                <b-form-textarea id="input-coherence-explanation" v-model="selectedOptions.coherence.explanation"
                  :placeholder="selectedOptions.coherence.option === '0' ? '' : ''" rows="6" max-rows="100"
                  :disabled="!canEditFinding" :state="explanationStateFor('coherence')"></b-form-textarea>
              </b-form-group>
              <b-form-group class="mt-2 font-weight-light" label-for="input-ml-notes"
                :description="$t('worksheet.labels.notes_description')">
                <template slot="label">
                  <videoHelp :txt="$t('common.notes')" tag="none" urlId="462180668"></videoHelp>
                </template>
                <b-form-textarea id="input-ml-notes" v-model="selectedOptions.coherence.notes" rows="6" max-rows="100"
                  :disabled="!canEditFinding"></b-form-textarea>
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
              <b-form-radio-group v-model="selectedOptions.adequacy.option" name="adequacy" stacked
                :disabled="!canEditFinding">
                <b-form-radio value="0">
                  {{ $t('worksheet.options.no_concerns') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.adequacy.no_concerns')">*</small>
                </b-form-radio>
                <b-form-radio value="1">
                  {{ $t('worksheet.options.minor_concerns') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.adequacy.minor_concerns')">*</small>
                </b-form-radio>
                <b-form-radio value="2">
                  {{ $t('worksheet.options.moderate_concerns') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.adequacy.moderate_concerns')">*</small>
                </b-form-radio>
                <b-form-radio value="3">
                  {{ $t('worksheet.options.serious_concerns') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.adequacy.serious_concerns')">*</small>
                </b-form-radio>
              </b-form-radio-group>
              <p v-if="permission" class="mt-2 font-weight-light text-danger" style="cursor: pointer">
                <a @click="clearMySelection('adequacy')" v-if="selectedOptions.adequacy.option !== null">
                  <font-awesome-icon icon="trash"></font-awesome-icon>
                  {{ $t('worksheet.actions.clear_selection') }}
                </a>
              </p>
              <b-form-group v-if="selectedOptions.adequacy.option !== null" class="mt-4 font-weight-light"
                label-for="input-adequacy-explanation" :state="explanationStateFor('adequacy')">
                <template slot="label">
                  <p class="font-weight-bold">
                    {{ showMessage(selectedOptions.adequacy.option, 'adequacy') }}
                  </p>
                </template>
                <template slot="description">
                  <span :class="explanationStateFor('adequacy') === false ? 'text-danger' : 'text-muted'">
                    {{ $t('worksheet.labels.explanation_required') }}
                    <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4"
                      target="_blank" :class="explanationStateFor('adequacy') === false ? 'text-danger' : ''">
                      <u>{{ $t('common.click') }} {{ $t('common.here') }}</u></a>
                    {{ $t('worksheet.labels.click_here_example') }}
                  </span>
                </template>
                <b-form-textarea id="input-adequacy-explanation" v-model="selectedOptions.adequacy.explanation"
                  :placeholder="selectedOptions.adequacy.option === '0' ? '' : ''" rows="6" max-rows="100"
                  :disabled="!canEditFinding" :state="explanationStateFor('adequacy')"></b-form-textarea>
              </b-form-group>
              <b-form-group class="mt-2 font-weight-light" label-for="input-ml-notes"
                :description="$t('worksheet.labels.notes_description')">
                <template slot="label">
                  <videoHelp :txt="$t('common.notes')" tag="none" urlId="462180668"></videoHelp>
                </template>
                <b-form-textarea id="input-ml-notes" v-model="selectedOptions.adequacy.notes" rows="6" max-rows="100"
                  :disabled="!canEditFinding"></b-form-textarea>
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
              <b-form-radio-group v-model="selectedOptions.relevance.option" name="relevance" stacked
                :disabled="!canEditFinding">
                <b-form-radio value="0">
                  {{ $t('worksheet.options.no_concerns') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.relevance.no_concerns')">*</small>
                </b-form-radio>
                <b-form-radio value="1">
                  {{ $t('worksheet.options.minor_concerns') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.relevance.minor_concerns')">*</small>
                </b-form-radio>
                <b-form-radio value="2">
                  {{ $t('worksheet.options.moderate_concerns') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.relevance.moderate_concerns')">*</small>
                </b-form-radio>
                <b-form-radio value="3">
                  {{ $t('worksheet.options.serious_concerns') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.relevance.serious_concerns')">*</small>
                </b-form-radio>
              </b-form-radio-group>
              <p v-if="permission" class="mt-2 font-weight-light text-danger" style="cursor: pointer">
                <a @click="clearMySelection('relevance')" v-if="selectedOptions.relevance.option !== null">
                  <font-awesome-icon icon="trash"></font-awesome-icon>
                  {{ $t('worksheet.actions.clear_selection') }}
                </a>
              </p>
              <b-form-group v-if="selectedOptions.relevance.option !== null" class="mt-4 font-weight-light"
                label-for="input-relevance-explanation" :state="explanationStateFor('relevance')">
                <template slot="label">
                  <p class="font-weight-bold">
                    {{ showMessage(selectedOptions.relevance.option, 'relevance') }}
                  </p>
                </template>
                <template slot="description">
                  <span :class="explanationStateFor('relevance') === false ? 'text-danger' : 'text-muted'">
                    {{ $t('worksheet.labels.explanation_required') }}
                  </span>
                </template>
                <b-form-textarea id="input-relevance-explanation" v-model="selectedOptions.relevance.explanation"
                  :placeholder="selectedOptions.relevance.option === '0' ? '' : ''" rows="6" max-rows="100"
                  :disabled="!canEditFinding" :state="explanationStateFor('relevance')"></b-form-textarea>
              </b-form-group>
              <b-form-group class="mt-2 font-weight-light" label-for="input-ml-notes">
                <template slot="label">
                  <videoHelp :txt="$t('common.notes')" tag="none" urlId="462180668"></videoHelp>
                </template>
                <template slot="description">
                  {{ $t('worksheet.labels.notes_description') }}. {{ $t('common.click') }}
                  <a href="https://implementationscience.biomedcentral.com/articles/10.1186/s13012-017-0689-2/tables/4"
                    target="_blank">
                    <u>{{ $t('common.here') }}</u>
                  </a>
                  {{ $t('worksheet.labels.click_here_example') }}.
                </template>
                <b-form-textarea id="input-ml-notes" v-model="selectedOptions.relevance.notes" rows="6" max-rows="100"
                  :disabled="!canEditFinding"></b-form-textarea>
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
              <b-form-radio-group v-model="selectedOptions.cerqual.option" @change="commonGenerateCerqualExplanation()"
                name="cerqual" stacked :disabled="!canEditFinding">
                <b-form-radio value="0">
                  {{ $t('worksheet.options.high_confidence') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.cerqual.high')">*</small>
                </b-form-radio>
                <b-form-radio value="1">
                  {{ $t('worksheet.options.moderate_confidence') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.cerqual.moderate')">*</small>
                </b-form-radio>
                <b-form-radio value="2">
                  {{ $t('worksheet.options.low_confidence') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.cerqual.low')">*</small>
                </b-form-radio>
                <b-form-radio value="3">
                  {{ $t('worksheet.options.very_low_confidence') }}
                  <small v-b-tooltip.hover :title="$t('worksheet.tooltips.cerqual.very_low')">*</small>
                </b-form-radio>
              </b-form-radio-group>
              <p v-if="permission" class="mt-2 font-weight-light text-danger" style="cursor: pointer">
                <a @click="clearMySelection('cerqual')" v-if="selectedOptions.cerqual.option !== null">
                  <font-awesome-icon icon="trash"></font-awesome-icon>
                  {{ $t('worksheet.actions.clear_selection') }}
                </a>
              </p>
              <b-form-group v-if="selectedOptions.cerqual.option !== null" class="mt-4 font-weight-light"
                label-for="input-cerqual" :state="explanationStateFor('cerqual')">
                <template slot="label">
                  {{ $t('worksheet.labels.cerqual_explanation_instruction') }}
                  <a href="#" @click="
                    ui.showExample
                      ? (ui.showExample = false)
                      : (ui.showExample = true)
                    ">{{ ui.showExample ? $t('worksheet.actions.hide_example') : $t('worksheet.actions.show_example')
                    }}</a>
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
                <template slot="description">
                  <span :class="explanationStateFor('cerqual') === false ? 'text-danger' : 'text-muted'">
                    <font-awesome-icon v-if="explanationStateFor('cerqual') === false" icon="exclamation-triangle"
                      class="mr-1"></font-awesome-icon>
                    {{ $t('worksheet.labels.explanation_required') }}
                  </span>
                </template>
                <b-form-textarea id="input-cerqual" v-model="selectedOptions.cerqual.explanation"
                  :placeholder="$t('common.enter_explanation')" rows="6" max-rows="100" :disabled="!canEditFinding"
                  :state="explanationStateFor('cerqual')"></b-form-textarea>
              </b-form-group>
              <b-form-group class="mt-2 font-weight-light" label-for="input-ml-notes"
                :description="$t('worksheet.labels.notes_description')">
                <template slot="label">
                  <videoHelp :txt="$t('common.notes')" tag="none" urlId="462180668"></videoHelp>
                </template>
                <b-form-textarea id="input-ml-notes" v-model="selectedOptions.cerqual.notes" rows="6" max-rows="100"
                  :disabled="!canEditFinding"></b-form-textarea>
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
                  <template v-if="project.use_camelot">
                    <assessment-table ref="camelotTable" :assessments="methAssessments" :references="list.references"
                      :hideActions="false" :clickableHeaders="true" />
                  </template>
                  <template v-else>
                    <b-table class="table-small-font" responsive head-variant="light" outlined
                      :fields="methAssessments.fieldsObj" :items="methAssessments.items">
                      <template v-slot:cell(authors)="data">
                        <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{ data.item.authors
                        }}</span>
                      </template>
                    </b-table>
                  </template>
                </b-tab>
                <b-tab :title="$t('worksheet.titles.review_finding')">
                  <edit-review-finding @update-list-data="getList(true)" :list="list" :finding="findings"
                    :permission="permission">
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
                  <table-extracted-data :showTitle="false" :showFilters="false" :ui="ui" :show="show" :mode="mode"
                    :list="list" :permission="permission" :extractedData="extractedData"
                    :modePrintFieldObject="modePrintFieldObject" :refsWithTitle="refsWithTitle" :showParagraph="false"
                    @printErrors="printErrors" @getExtractedData="getExtractedData"></table-extracted-data>
                </b-tab>
              </b-tabs>
            </div>

            <div v-if="selectedOptions.type === 'coherence'">
              <edit-review-finding @update-list-data="getList(true)" :list="list" :finding="findings"
                :permission="permission">
              </edit-review-finding>
              <h4>{{ $t('worksheet.extracted_data') }}</h4>
              <p v-if="ui.adequacy.extracted_data.display_warning" class="text-danger">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
                {{ $t('worksheet.warnings.extracted_data_missing_detail') }}
              </p>
              <table-extracted-data :showTitle="false" :showFilters="false" :ui="ui" :show="show" :mode="mode"
                :list="list" :permission="permission" :extractedData="extractedData"
                :modePrintFieldObject="modePrintFieldObject" :refsWithTitle="refsWithTitle" :showParagraph="false"
                @printErrors="printErrors" @getExtractedData="getExtractedData"></table-extracted-data>
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
                        <b-alert v-if="rowReadOnlyNotice" show variant="warning" class="mb-2"
                          data-testid="row-readonly-notice">
                          {{ rowReadOnlyNotice }}
                        </b-alert>
                        <b-form-group>
                          <b-form-textarea rows="6" max-rows="100" :disabled="isRowReadOnly"
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
                        <b-button block variant="success" :disabled="isRowReadOnly"
                          @click="updateContentExtractedDataItem(data.item.ref_id)">
                          {{ $t('common.save') }}
                        </b-button>
                        <b-button block variant="outline-secondary" @click="cancelExtractedDataInPlace">
                          {{ $t('common.cancel') }}
                        </b-button>
                      </template>
                      <template v-else>
                        <b-button v-if="permission" variant="outline-success"
                          @click="editExtractedDataInPlace(data.index)">
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
                  <template v-if="project.use_camelot">
                    <camelot-characteristics-table :charsOfStudies="charsOfStudies" />
                  </template>
                  <template v-else>
                    <b-table class="table-small-font" responsive head-variant="light" outlined
                      :fields="charsOfStudies.fieldsObj" :items="charsOfStudies.items">
                      <template v-slot:cell(authors)="data">
                        <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{ data.item.authors
                        }}</span>
                      </template>
                    </b-table>
                  </template>
                </b-tab>
                <b-tab :title="$t('worksheet.titles.review_finding')">
                  <edit-review-finding @update-list-data="getList(true)" :list="list" :finding="findings"
                    :permission="permission">
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
                      project.review_question === '' ||
                      project.inclusion === '' ||
                      project.exclusion === ''
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
                    <font-awesome-icon v-if="ui.relevance.chars_of_studies.display_warning" class="text-danger"
                      icon="exclamation-circle"></font-awesome-icon>
                  </template>
                  <h4>{{ $t('worksheet.characteristics_of_studies') }}</h4>
                  <p v-if="ui.relevance.chars_of_studies.display_warning" class="text-danger">
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
                  <template v-if="project.use_camelot">
                    <camelot-characteristics-table :charsOfStudies="charsOfStudies" />
                  </template>
                  <template v-else>
                    <b-table class="table-small-font" responsive head-variant="light" outlined
                      :fields="charsOfStudies.fieldsObj" :items="charsOfStudies.items">
                      <template v-slot:cell(authors)="data">
                        <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{ data.item.authors
                        }}</span>
                      </template>
                    </b-table>
                  </template>
                </b-tab>
                <b-tab :title="$t('worksheet.titles.review_finding')">
                  <edit-review-finding @update-list-data="getList(true)" :list="list" :finding="findings"
                    :permission="permission">
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
                    <template v-if="parseInt(evidenceProfile[0].methodological_limitations.option) > 0">
                      <br />
                      {{ $t('common.explanation_colon') }}
                      <span v-if="evidenceProfile[0].methodological_limitations.explanation">{{
                        getExplanation('methodological-limitations',
                          evidenceProfile[0].methodological_limitations.option,
                          evidenceProfile[0].methodological_limitations.explanation) }}</span>
                      <span v-else>{{ $t('worksheet.labels.explanation_not_added') }}</span>
                    </template>
                  </p>
                  <h5>{{ $t('worksheet.domains.coherence') }}</h5>
                  <p>
                    <b>{{ displaySelectedOption(evidenceProfile[0].coherence.option) }}</b>
                    <template v-if="parseInt(evidenceProfile[0].coherence.option) > 0">
                      <br />
                      {{ $t('common.explanation_colon') }}
                      <span v-if="evidenceProfile[0].coherence.explanation">{{ getExplanation('coherence',
                        evidenceProfile[0].coherence.option, evidenceProfile[0].coherence.explanation) }}</span>
                      <span v-else>{{ $t('worksheet.labels.explanation_not_added') }}</span>
                    </template>
                  </p>
                  <h5>{{ $t('worksheet.domains.adequacy') }}</h5>
                  <p>
                    <b>{{ displaySelectedOption(evidenceProfile[0].adequacy.option) }}</b>
                    <template v-if="parseInt(evidenceProfile[0].adequacy.option) > 0">
                      <br />
                      {{ $t('common.explanation_colon') }}
                      <span v-if="evidenceProfile[0].adequacy.explanation">{{ getExplanation('adequacy',
                        evidenceProfile[0].adequacy.option, evidenceProfile[0].adequacy.explanation) }}</span>
                      <span v-else>{{ $t('worksheet.labels.explanation_not_added') }}</span>
                    </template>
                  </p>
                  <h5>{{ $t('worksheet.domains.relevance') }}</h5>
                  <p>
                    <b>{{ displaySelectedOption(evidenceProfile[0].relevance.option) }}</b>
                    <template v-if="parseInt(evidenceProfile[0].relevance.option) > 0">
                      <br />
                      {{ $t('common.explanation_colon') }}
                      <span v-if="evidenceProfile[0].relevance.explanation">{{ getExplanation('relevance',
                        evidenceProfile[0].relevance.option, evidenceProfile[0].relevance.explanation) }}</span>
                      <span v-else>{{ $t('worksheet.labels.explanation_not_added') }}</span>
                    </template>
                  </p>
                </b-tab>
                <b-tab :title="$t('worksheet.titles.review_finding')">
                  <edit-review-finding @update-list-data="getList(true)" :list="list" :finding="findings"
                    :permission="permission">
                  </edit-review-finding>
                </b-tab>
              </b-tabs>
            </div>
          </b-col>
        </b-row>
      </b-container>
    </b-modal>

    <b-modal id="modal-warning-same-txt" ref="modal-warning-same-txt" :title="$t('common.warning')" :hide-footer="true" @hidden="onWarningExplanationModalHidden">
      <p>
        {{ $t('worksheet.warnings.incomplete_explanation') }}
      </p>
      <b-container>
        <b-row align-h="between">
          <b-col cols="4">
            <b-button block @click="closeWarningModalDoItNow(selectedOptions.type)">{{ $t('worksheet.actions.do_it_now')
            }}</b-button>
          </b-col>
          <b-col cols="4">
            <b-button block @click="closeWarningModalDoItLater()">{{ $t('worksheet.actions.do_it_later') }}</b-button>
          </b-col>
        </b-row>
      </b-container>
    </b-modal>

    <b-modal id="modal-warning-changed-option" ref="modal-warning-changed-option" :title="$t('common.warning')"
      :hide-footer="true" @hidden="onWarningChangedOptionModalHidden">
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
            <b-button block @click="updateOptions(selectedOptions.type, true)">{{ $t('common.yes') }}</b-button>
          </b-col>
          <b-col>
            <b-button block @click="updateOptions(selectedOptions.type, false)">{{ $t('common.no') }}</b-button>
          </b-col>
        </b-row>
      </b-container>
    </b-modal>

    <b-modal id="modal-warning-cleaning-cerqual" ref="modal-warning-cleaning-cerqual" :title="$t('common.warning')"
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
            <b-button block @click="updateOptions(selectedOptions.type, true)">{{ $t('common.yes') }}</b-button>
          </b-col>
          <b-col>
            <b-button block @click="updateOptions(selectedOptions.type, false)">{{ $t('common.no') }}</b-button>
          </b-col>
        </b-row>
      </b-container>
    </b-modal>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import Commons from '@/utils/commons'
import LockService from '@/services/lockService'
import { displayExplanation, generateCerqualExplanation } from '../utils/commons'

// Whitelisted evidence_profile sub-sections targetable by the granular
// PATCH /isoqf_findings|isoqf_lists/<id>/section/<name> endpoint.
const EVIDENCE_PROFILE_SECTIONS = ['methodological_limitations', 'coherence', 'adequacy', 'relevance', 'cerqual']

export default {
  name: 'evidenceProfileForm',
  components: {
    videoHelp: () => import('@/components/videoHelp.vue'),
    'edit-review-finding': () => import('@/components/editReviewFinding.vue'),
    'assessment-table': () => import('@/components/camelot/assessment/CamelotAssessmentSummaryTable.vue'),
    'camelot-characteristics-table': () => import('@/components/camelot/characteristics/CharacteristicsTable.vue'),
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
      // Endpoint A locks the DOCUMENT, so the lock's ref_id is the finding_id.
      // A row edited inline writes through endpoint C and needs its own lock, held
      // at the same time as this one (multi-slot LockService).
      isFindingReadOnly: false,
      findingLockedBy: null,
      // True only when the lock was taken away mid-edit. Opening onto an already-locked
      // finding is a different story: that one is announced by a toast on open.
      lockLostWhileEditing: false,
      lockedFindingRef: null,
      modalOpen: false,
      // True when a `hidden` from a previous modal session is still on its way.
      staleHiddenPending: false,
      lockedRowRef: null,
      isRowReadOnly: false,
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
        cerqual: {
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
      showModalWarningChangedOption: false,
      pendingExplanationFocusId: null,
      pendingChangedOptionFocusId: null
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
      if (val !== null) {
        if (this.modalData.methodological_limitations.option !== val && this.modalData.cerqual.option !== null) {
          this.showModalWarningChangedOption = this.checkIfIsTheOnlyPublished()
          this.$refs['modal-warning-changed-option']?.show()
        } else if (val != 0) {
          this.focusExplanation('input-ml-explanation')
        }
      }
    },
    'selectedOptions.coherence.option': function (val) {
      if (val !== null) {
        if (this.modalData.coherence.option !== val && this.modalData.cerqual.option !== null) {
          this.showModalWarningChangedOption = this.checkIfIsTheOnlyPublished()
          this.$refs['modal-warning-changed-option']?.show()
        } else if (val != 0) {
          this.focusExplanation('input-coherence-explanation')
        }
      }
    },
    'selectedOptions.adequacy.option': function (val) {
      if (val !== null) {
        if (this.modalData.adequacy.option !== val && this.modalData.cerqual.option !== null) {
          this.showModalWarningChangedOption = this.checkIfIsTheOnlyPublished()
          this.$refs['modal-warning-changed-option']?.show()
        } else if (val != 0) {
          this.focusExplanation('input-adequacy-explanation')
        }
      }
    },
    'selectedOptions.relevance.option': function (val) {
      if (val !== null) {
        if (this.modalData.relevance.option !== val && this.modalData.cerqual.option !== null) {
          this.showModalWarningChangedOption = this.checkIfIsTheOnlyPublished()
          this.$refs['modal-warning-changed-option']?.show()
        } else if (val != 0) {
          this.focusExplanation('input-relevance-explanation')
        }
      }
    }
  },
  mounted () {
    this.selectedOptions = JSON.parse(JSON.stringify(this.modalData))
    this.localExtractedData = JSON.parse(JSON.stringify(this.extractedData))
    window.addEventListener('ref-lock-lost', this.onRefLockLost)
  },
  beforeDestroy () {
    window.removeEventListener('ref-lock-lost', this.onRefLockLost)
    // Verified live: the lock was acquired, the modal never finished opening, and the
    // later hide() emitted no `hidden` — the lock stayed orphaned until the TTL.
    this.releaseFindingLock()
    this.releaseRowLock()
  },
  computed: {
    // Single flag for every input in the form: writing needs both the permission
    // and the finding's lock.
    canEditFinding: function () {
      return this.permission && !this.isFindingReadOnly
    },
    // Text of the banner shown at the top of the form while it is read-only.
    // Falsy = no banner. Available keys: 'lock.lost_while_editing' ({user}),
    // 'lock.lost_while_editing_no_user', 'lock.ref_locked_by' ({user}).
    // State to read from: isFindingReadOnly, lockLostWhileEditing, findingLockedBy,
    // permission.
    readOnlyNotice: function () {
      // - El banner aparece en los tres casos de solo-lectura
      // - Sin permiso de escritura (permission falso) el usuario nunca esperó editar: un aviso de "perdiste el lock" ahí sería ruido.
      // - Ojo con findingLockedBy nulo: el mensaje no puede terminar diciendo "editado por undefined" — ese fue exactamente el bug que motivó tener la variante _no_user.
      const user = this.findingLockedBy
      if (this.lockLostWhileEditing) {
        if (user) {
          return this.$t('lock.lost_while_editing', { user })
        } else {
          return this.$t('lock.lost_while_editing_no_user')
        }
      } else if (this.isFindingReadOnly) {
        if (user) {
          return this.$t('lock.ref_locked_by', { user })
        } else {
          return this.$t('lock.ref_locked_by_no_user')
        }
      }
      return null
    },
    // Same idea as readOnlyNotice, for the inline row editor inside the table. The row
    // has no "lost while editing" flag of its own: the only way it turns read-only is
    // by losing or failing to get its lock, and both deserve the banner.
    rowReadOnlyNotice: function () {
      if (!this.isRowReadOnly) return null
      return this.rowLockedBy
        ? this.$t('lock.lost_while_editing', { user: this.rowLockedBy })
        : this.$t('lock.ref_locked_by_no_user')
    },
    clearCerqualWarningMessage: function () {
      if (this.checkIfIsTheOnlyPublished()) {
        return this.$t('worksheet.warnings.clear_cerqual_revert')
      } else {
        return this.$t('worksheet.warnings.clear_cerqual_simple')
      }
    }
  },
  methods: {
    explanationStateFor: function (domain) {
      const d = this.selectedOptions[domain]
      if (!d || d.option === null || parseInt(d.option) === 0) return null
      return !!(d.explanation && d.explanation.trim().length > 0)
    },
    focusExplanation: function (id) {
      setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.focus()
      }, 0)
    },
    parseReference: function (reference, onlyAuthors = false, hasSemicolon = true) {
      return Commons.parseReference(reference, onlyAuthors, hasSemicolon)
    },
    commonGenerateCerqualExplanation: function () {
      this.selectedOptions.cerqual.explanation = generateCerqualExplanation(this.selectedOptions)
      this.focusExplanation('input-cerqual')
    },
    onModalShow: function () {
      // Reopening while the previous session is still closing means its `hidden` is
      // still in flight and must not be taken for the closing of this one.
      this.staleHiddenPending = this.modalOpen
      this.modalOpen = true
      this.acquireFindingLock()
      this.$nextTick(() => {
        if (this.$refs.camelotTable && typeof this.$refs.camelotTable.resetTableState === 'function') {
          this.$refs.camelotTable.resetTableState()
        }
      })
    },
    // Mirrors StepFour.vue's acquireStudyLock: asked for on open, so the rejection
    // reaches the user before they fill the form instead of on save.
    async acquireFindingLock () {
      const findingId = this.findings && this.findings.id
      // A finding with no id yet is created by POST on save — nothing to lock.
      if (!findingId || !this.permission) return
      const result = await LockService.acquireRef(this.list.project_id, findingId)
      if (result.success) {
        this.lockedFindingRef = findingId
        this.isFindingReadOnly = false
        this.findingLockedBy = null
        this.lockLostWhileEditing = false
      } else if (result.permissionDenied) {
        this.isFindingReadOnly = true
        this.findingLockedBy = null
        if (this.$notify) this.$notify.warning(this.$t('lock.permissions_revoked'))
      } else {
        this.isFindingReadOnly = true
        this.findingLockedBy = result.lockedBy || null
        if (this.$notify) {
          this.$notify.warning(this.$t('lock.ref_locked_by', { user: this.findingLockedBy }))
        }
      }
    },
    // Two locks live in this modal, so the event has to be routed: the finding's
    // lock greys out the whole form, a row's lock only that row.
    onRefLockLost: function (event) {
      const detail = event.detail || {}
      const findingId = this.findings && this.findings.id
      if (detail.refId && detail.refId === findingId) {
        this.isFindingReadOnly = true
        this.findingLockedBy = detail.lockedBy || null
        this.lockLostWhileEditing = true
        return
      }
      if (detail.refId && detail.refId === this.lockedRowRef) {
        this.isRowReadOnly = true
      }
    },
    onModalHidden: function () {
      // BootstrapVue emits `hidden` asynchronously: a late one belongs to the previous
      // session, and releasing now would leave the open form without its lock.
      if (this.staleHiddenPending) {
        this.staleHiddenPending = false
        return
      }
      this.modalOpen = false
      this.releaseFindingLock()
      // An inline row editor left open when the modal closes must not leak its lock.
      this.releaseRowLock()
      this.isFindingReadOnly = false
      this.findingLockedBy = null
      this.lockLostWhileEditing = false
    },
    releaseFindingLock: function () {
      if (this.lockedFindingRef) LockService.releaseRef(this.lockedFindingRef)
      this.lockedFindingRef = null
    },
    async acquireRowLock (refId) {
      if (!refId || !this.permission) return
      const result = await LockService.acquireRef(this.list.project_id, refId)
      if (result.success) {
        this.lockedRowRef = refId
        this.isRowReadOnly = false
        return
      }
      this.lockedRowRef = null
      this.isRowReadOnly = true
      if (this.$notify) {
        this.$notify.warning(result.permissionDenied
          ? this.$t('lock.permissions_revoked')
          : this.$t('lock.ref_locked_by', { user: result.lockedBy || '' }))
      }
    },
    releaseRowLock: function () {
      if (this.lockedRowRef) LockService.releaseRef(this.lockedRowRef)
      this.lockedRowRef = null
      this.isRowReadOnly = false
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
      this.$refs['modal-warning-same-txt']?.show()
    },
    closeWarningModalDoItNow: function (type = '') {
      this.selectedOptions.type = type
      const idMap = {
        'methodological-limitations': 'input-ml-explanation',
        'coherence': 'input-coherence-explanation',
        'adequacy': 'input-adequacy-explanation',
        'relevance': 'input-relevance-explanation',
        'cerqual': 'input-cerqual'
      }
      this.pendingExplanationFocusId = idMap[type] || null
      this.$refs['modal-warning-same-txt']?.hide()
    },
    onWarningExplanationModalHidden: function () {
      if (this.pendingExplanationFocusId) {
        this.focusExplanation(this.pendingExplanationFocusId)
        this.pendingExplanationFocusId = null
      }
    },
    closeWarningModalDoItLater: function () {
      this.continueSavingDataModal()
      this.$refs['modal-warning-same-txt']?.hide()
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
      if (!type) return false
      const domain = type.replace(/-/g, '_')
      const d = prop[domain]
      if (!d || d.option === null || parseInt(d.option) === 0) return false
      return !(d.explanation && d.explanation.trim().length > 0)
    },
    updateOptions: function (option, status) {
      if (option === 'methodological-limitations') {
        option = 'methodological_limitations'
      }
      if (status) {
        this.selectedOptions.cerqual.option = null
        this.selectedOptions.cerqual.explanation = ''
        if (option === 'cerqual') {
          this.$refs['modal-warning-cleaning-cerqual']?.hide()
        } else {
          const idMap = {
            methodological_limitations: 'input-ml-explanation',
            coherence: 'input-coherence-explanation',
            adequacy: 'input-adequacy-explanation',
            relevance: 'input-relevance-explanation'
          }
          const newOption = this.selectedOptions[option]?.option
          if (newOption && parseInt(newOption) !== 0) {
            this.pendingChangedOptionFocusId = idMap[option] || null
          }
          this.$refs['modal-warning-changed-option']?.hide()
        }
      } else {
        this.selectedOptions[option].option = this.modalData[option].option
        if (option === 'cerqual') {
          this.$refs['modal-warning-cleaning-cerqual']?.hide()
        } else {
          this.$refs['modal-warning-changed-option']?.hide()
        }
      }
    },
    onWarningChangedOptionModalHidden: function () {
      if (this.pendingChangedOptionFocusId) {
        this.focusExplanation(this.pendingChangedOptionFocusId)
        this.pendingChangedOptionFocusId = null
      }
    },
    continueSavingDataModal: function (status = false) {
      this.$emit('busyEvidenceProfileTable', true)
      // Writing a section without the finding's lock is a guaranteed 409, and the
      // failure is invisible (console only) with the spinner left spinning.
      if (this.isFindingReadOnly) {
        this.$emit('busyEvidenceProfileTable', false)
        return
      }

      if (Object.prototype.hasOwnProperty.call(this.findings, 'id')) {
        // Granular save: PATCH only the evidence_profile sections that actually changed
        // vs the loaded values, via the /section/<name> sub-resource. Editing a section
        // can also reset cerqual, so the diff naturally picks up both. Untouched sections
        // and other findings are never overwritten (no full evidence_profile rewrite).
        const changed = EVIDENCE_PROFILE_SECTIONS.filter(s =>
          JSON.stringify(this.selectedOptions[s]) !== JSON.stringify(this.modalData[s]))

        Promise.all(changed.map(s =>
          Api.patch(`/isoqf_findings/${this.findings.id}/section/${s}`, this.selectedOptions[s])))
          .then(() => status ? Api.post(`/unpublish/project/${this.list.project_id}`) : null)
          .then(() => {
            this.$emit('callGetStageOneData', false)
            // The backend now seals the list's evidence_profile mirror + top-level cerqual
            // when the finding sections are written, so the frontend no longer PATCHes the
            // list. We still refetch the list (update-list-data) to pull the sealed mirror
            // into the preview/export.
            this.$emit('update-list-data')
            this.$refs['modal-evidence-profile-form']?.hide()
          })
          .catch((error) => {
            this.printErrors(error)
          })
      } else {
        // New finding: no id yet to target /section/, create it with the full profile.
        const { type, title, isoqf_id, displayNumber, ...evidenceProfileData } = this.selectedOptions
        Api.post(`/isoqf_findings`, {
          organization: this.list.organization,
          list_id: this.list.id,
          evidence_profile: evidenceProfileData
        })
          .then(() => {
            this.$emit('callGetStageOneData', false)
            this.$refs['modal-evidence-profile-form']?.hide()
          })
          .catch((error) => {
            this.printErrors(error)
          })
      }
    },
    openModalEvidenceProfie: function () {
      this.showPanel = true
      this.$refs['modal-evidence-profile-form']?.show()
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
      this.acquireRowLock(item.ref_id)
      const data = {
        display: true,
        item: item
      }
      this.$emit('setShowEditExtractedDataInPlace', data)
    },
    cancelExtractedDataInPlace: function () {
      this.releaseRowLock()
      const data = {
        display: false,
        item: {}
      }
      this.$emit('setShowEditExtractedDataInPlace', data)
    },
    updateContentExtractedDataItem: function (refId) {
      // Granular save: PATCH only this row via the /item/<ref_id> sub-resource so
      // concurrent edits to other rows are not overwritten (no whole-array rewrite).
      const row = JSON.parse(JSON.stringify(this.showEditExtractedDataInPlace.item))
      // Without this row's lock the PATCH is a guaranteed 409.
      if (this.isRowReadOnly) return Promise.resolve()
      return Api.patch(`/isoqf_extracted_data/${this.extractedData.id}/item/${refId}`, row)
        .then(() => {
          this.releaseRowLock()
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
          this.$refs['modal-warning-cleaning-cerqual']?.show()
          break
      }
    }
  }
}
</script>
