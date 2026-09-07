<template>
  <div v-if="evidenceProfile.length">
    <a name="evidence-profile"></a>
    <h3 class="mt-4">
      {{ $t('worksheet_nav.evidence_profile') }}
      <span
        v-if="ui.adequacy.chars_of_studies.display_warning || ui.methodological_assessments.display_warning || ui.adequacy.extracted_data.display_warning || (project.review_question === '') ? true : false || (project.inclusion === '') ? true: false || (project.exclusion === '') ? true: false"
        class="text-danger d-print-none"
        v-b-tooltip.hover :title="$t('worksheet.warnings.data_missing_link')">
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
      :fields="evidenceProfileFields"
      :items="evidenceProfile"
      :filter="evidenceProfileTableSettings.filter"
      :busy="evidenceProfileTableSettings.isBusy">
      <template v-slot:head(displayNumber)="data">
        <span v-b-tooltip.hover :title="$t('table_headers.auto_numbering')">{{data.label}}</span>
      </template>
      <template v-slot:head(methodological-limit)="data">
        <span v-b-tooltip.hover :title="$t('worksheet.tooltips.definitions.methodological_limitations')">{{data.label}}</span>
        <span
          v-if="ui.methodological_assessments.display_warning || ui.methodological_assessments.extracted_data.display_warning"
          class="text-danger"
          v-b-tooltip.hover :title="$t('worksheet.warnings.data_missing_assessment')">
          <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
        </span>
      </template>
      <template v-slot:head(coherence)="data">
        <span v-b-tooltip.hover :title="$t('worksheet.tooltips.definitions.coherence')">{{data.label}}</span>
        <span
          v-if="ui.coherence.display_warning"
          class="text-danger"
          v-b-tooltip.hover :title="$t('worksheet.warnings.data_missing_assessment')">
          <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
        </span>
      </template>
      <template v-slot:head(adequacy)="data">
        <span v-b-tooltip.hover :title="$t('worksheet.tooltips.definitions.adequacy')">{{data.label}}</span>
        <span
          v-if="ui.adequacy.extracted_data.display_warning || ui.adequacy.chars_of_studies.display_warning"
          class="text-danger"
          v-b-tooltip.hover :title="$t('worksheet.warnings.data_missing_assessment')">
          <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
        </span>
      </template>
      <template v-slot:head(relevance)="data">
        <span v-b-tooltip.hover :title="$t('worksheet.tooltips.definitions.relevance')">{{data.label}}</span>
        <span
          v-if="ui.relevance.chars_of_studies.display_warning || ((project.inclusion.length) ? false : true) || ((project.exclusion.length) ? false : true) || ((project.review_question.length) ? false : true)"
          class="text-danger"
          v-b-tooltip.hover :title="$t('worksheet.warnings.data_missing_assessment')">
          <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
        </span>
      </template>
      <template v-slot:head(cerqual)="data">
        <span v-b-tooltip.hover :title="$t('worksheet.tooltips.definitions.cerqual')">{{data.label}}</span>
      </template>
      <template v-slot:head(references)="data">
        <span v-b-tooltip.hover :title="$t('worksheet.tooltips.definitions.references')">{{data.label}}</span>
      </template>
      <!-- content -->
      <template v-slot:cell(displayNumber)="data">
        {{data.item.displayNumber}}
      </template>
      <template v-slot:cell(methodological-limit)="data">
        <div v-if="data.item.methodological_limitations.option !== null">
          <template>
            <b-button
              block
              class="d-print-none mb-3"
              variant="outline-info"
              :disabled="isSectionDisabled('methodological_limitations')"
              @click="editStageTwo(data.item, 'methodological-limitations')">
              <template v-if="permission">{{ $t('common.edit') }}</template>
              <template v-else>{{ $t('common.view') }}</template>
              <font-awesome-icon
                v-if="data.item.methodological_limitations.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
            <!-- Texto visible y no tooltip: bootstrap-vue no monta tooltips sobre
                 botones `disabled` (el navegador no emite eventos de mouse en ellos).
                 Verificado en navegador; ver ViewTable.vue. -->
            <small
              v-if="isSectionDisabled('methodological_limitations')"
              class="text-warning d-block mb-2"
              data-testid="ep-locked-methodological_limitations">
              <font-awesome-icon icon="user"></font-awesome-icon>
              {{ sectionLockedByName('methodological_limitations') }}
            </small>
          </template>
          <p><b>{{displaySelectedOption(data.item.methodological_limitations.option)}}</b></p>
          <p v-if="data.item.methodological_limitations.explanation">
            <span class="font-weight-bolder text-black-50">{{ $t('worksheet_nav.explanation') }}:</span> {{ getExplanation('methodological-limitations', data.item.methodological_limitations.option, data.item.methodological_limitations.explanation) }}
            <span
              v-if="displayExclamationAlert('methodological-limitations')"
              class="text-danger"
              v-b-tooltip.hover
              :title="$t('worksheet.warnings.incomplete_explanation')">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
            </span>
          </p>
          <p v-else class="text-muted font-weight-light">
            <span
              v-if="data.item.methodological_limitations.option !== '0'"
              v-b-tooltip.hover
              :title="$t('worksheet.tooltips.provide_explanation')"
              variant="info">{{ $t('worksheet.labels.explanation_not_added') }}</span>
            <span
              v-if="displayExclamationAlert('methodological-limitations')"
              class="text-danger"
              v-b-tooltip.hover
              :title="$t('worksheet.tooltips.incomplete_explanation')">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
            </span>
          </p>
        </div>
        <div v-else>
          <template v-if="permission">
            <b-button
              block
              class="d-print-none"
              variant="info"
              :disabled="isSectionDisabled('methodological_limitations')"
              @click="editStageTwo(data.item, 'methodological-limitations')">
              {{ $t('soqf_table.assessment_not_completed') }}
              <font-awesome-icon
                v-if="data.item.methodological_limitations.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
            <!-- Texto visible y no tooltip: bootstrap-vue no monta tooltips sobre
                 botones `disabled` (el navegador no emite eventos de mouse en ellos).
                 Verificado en navegador; ver ViewTable.vue. -->
            <small
              v-if="isSectionDisabled('methodological_limitations')"
              class="text-warning d-block mb-2"
              data-testid="ep-locked-methodological_limitations">
              <font-awesome-icon icon="user"></font-awesome-icon>
              {{ sectionLockedByName('methodological_limitations') }}
            </small>
          </template>
        </div>
      </template>
      <template v-slot:cell(coherence)="data">
        <div v-if="data.item.coherence.option !== null">
          <template>
            <b-button
              block
              class="d-print-none mb-3"
              variant="outline-info"
              :disabled="isSectionDisabled('coherence')"
              @click="editStageTwo(data.item, 'coherence')">
              <template v-if="permission">{{ $t('common.edit') }}</template>
              <template v-else>{{ $t('common.view') }}</template>
              <font-awesome-icon
                v-if="data.item.coherence.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
            <!-- Texto visible y no tooltip: bootstrap-vue no monta tooltips sobre
                 botones `disabled` (el navegador no emite eventos de mouse en ellos).
                 Verificado en navegador; ver ViewTable.vue. -->
            <small
              v-if="isSectionDisabled('coherence')"
              class="text-warning d-block mb-2"
              data-testid="ep-locked-coherence">
              <font-awesome-icon icon="user"></font-awesome-icon>
              {{ sectionLockedByName('coherence') }}
            </small>
          </template>
          <p><b>{{displaySelectedOption(data.item.coherence.option)}}</b></p>
          <p v-if="data.item.coherence.explanation">
            <span class="font-weight-bolder text-black-50">{{ $t('worksheet_nav.explanation') }}:</span> {{ getExplanation('coherence', data.item.coherence.option, data.item.coherence.explanation) }}
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
              v-if="data.item.coherence.option !== '0'"
              v-b-tooltip.hover
              :title="$t('worksheet.tooltips.provide_explanation')"
              variant="info">{{ $t('worksheet.labels.explanation_not_added') }}</span>
            <span
              v-if="displayExclamationAlert('coherence')"
              class="text-danger"
              v-b-tooltip.hover
              :title="$t('worksheet.tooltips.incomplete_explanation')">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
            </span>
          </p>
        </div>
        <div v-else>
          <template v-if="permission">
            <b-button
              block
              class="d-print-none"
              variant="info"
              :disabled="isSectionDisabled('coherence')"
              @click="editStageTwo(data.item, 'coherence')">
              {{ $t('soqf_table.assessment_not_completed') }}
              <font-awesome-icon
                v-if="data.item.coherence.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
            <!-- Texto visible y no tooltip: bootstrap-vue no monta tooltips sobre
                 botones `disabled` (el navegador no emite eventos de mouse en ellos).
                 Verificado en navegador; ver ViewTable.vue. -->
            <small
              v-if="isSectionDisabled('coherence')"
              class="text-warning d-block mb-2"
              data-testid="ep-locked-coherence">
              <font-awesome-icon icon="user"></font-awesome-icon>
              {{ sectionLockedByName('coherence') }}
            </small>
          </template>
        </div>
      </template>
      <template v-slot:cell(adequacy)="data">
        <div v-if="data.item.adequacy.option !== null">
          <template>
            <b-button
              block
              class="d-print-none mb-3"
              variant="outline-info"
              :disabled="isSectionDisabled('adequacy')"
              @click="editStageTwo(data.item, 'adequacy')">
              <template v-if="permission">{{ $t('common.edit') }}</template>
              <template v-else>{{ $t('common.view') }}</template>
              <font-awesome-icon
                v-if="data.item.adequacy.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
            <!-- Texto visible y no tooltip: bootstrap-vue no monta tooltips sobre
                 botones `disabled` (el navegador no emite eventos de mouse en ellos).
                 Verificado en navegador; ver ViewTable.vue. -->
            <small
              v-if="isSectionDisabled('adequacy')"
              class="text-warning d-block mb-2"
              data-testid="ep-locked-adequacy">
              <font-awesome-icon icon="user"></font-awesome-icon>
              {{ sectionLockedByName('adequacy') }}
            </small>
          </template>
          <p><b>{{displaySelectedOption(data.item.adequacy.option)}}</b></p>
          <p v-if="data.item.adequacy.explanation">
            <span class="font-weight-bolder text-black-50">{{ $t('worksheet_nav.explanation') }}:</span> {{ getExplanation('adequacy', data.item.adequacy.option, data.item.adequacy.explanation) }}
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
              v-if="data.item.adequacy.option !== '0'"
              v-b-tooltip.hover
              :title="$t('worksheet.tooltips.provide_explanation')"
              variant="info">{{ $t('worksheet.labels.explanation_not_added') }}</span>
            <span
              v-if="displayExclamationAlert('adequacy')"
              class="text-danger"
              v-b-tooltip.hover
              :title="$t('worksheet.tooltips.incomplete_explanation')">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
            </span>
          </p>
        </div>
        <div v-else>
          <template v-if="permission">
            <b-button
              block
              class="d-print-none"
              variant="info"
              :disabled="isSectionDisabled('adequacy')"
              @click="editStageTwo(data.item, 'adequacy')">
              {{ $t('soqf_table.assessment_not_completed') }}
              <font-awesome-icon
                v-if="data.item.adequacy.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
            <!-- Texto visible y no tooltip: bootstrap-vue no monta tooltips sobre
                 botones `disabled` (el navegador no emite eventos de mouse en ellos).
                 Verificado en navegador; ver ViewTable.vue. -->
            <small
              v-if="isSectionDisabled('adequacy')"
              class="text-warning d-block mb-2"
              data-testid="ep-locked-adequacy">
              <font-awesome-icon icon="user"></font-awesome-icon>
              {{ sectionLockedByName('adequacy') }}
            </small>
          </template>
        </div>
      </template>
      <template v-slot:cell(relevance)="data">
        <div v-if="data.item.relevance.option !== null">
          <template>
            <b-button
              block
              class="d-print-none mb-3"
              variant="outline-info"
              :disabled="isSectionDisabled('relevance')"
              @click="editStageTwo(data.item, 'relevance')">
              <template v-if="permission">{{ $t('common.edit') }}</template>
              <template v-else>{{ $t('common.view') }}</template>
              <font-awesome-icon
                v-if="data.item.relevance.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
            <!-- Texto visible y no tooltip: bootstrap-vue no monta tooltips sobre
                 botones `disabled` (el navegador no emite eventos de mouse en ellos).
                 Verificado en navegador; ver ViewTable.vue. -->
            <small
              v-if="isSectionDisabled('relevance')"
              class="text-warning d-block mb-2"
              data-testid="ep-locked-relevance">
              <font-awesome-icon icon="user"></font-awesome-icon>
              {{ sectionLockedByName('relevance') }}
            </small>
          </template>
          <p><b>{{displaySelectedOption(data.item.relevance.option)}}</b></p>
          <p v-if="data.item.relevance.explanation">
            <span class="font-weight-bolder text-black-50">{{ $t('worksheet_nav.explanation') }}:</span> {{ getExplanation('relevance', data.item.relevance.option, data.item.relevance.explanation) }}
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
              v-if="data.item.relevance.option !== '0'"
              v-b-tooltip.hover
              :title="$t('worksheet.tooltips.provide_explanation')"
              variant="info">{{ $t('worksheet.labels.explanation_not_added') }}</span>
            <span
              v-if="displayExclamationAlert('relevance')"
              class="text-danger"
              v-b-tooltip.hover
              :title="$t('worksheet.tooltips.incomplete_explanation')">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
            </span>
          </p>
        </div>
        <div v-else>
          <template v-if="permission">
            <b-button
              block
              class="d-print-none"
              variant="info"
              :disabled="isSectionDisabled('relevance')"
              @click="editStageTwo(data.item, 'relevance')">
              {{ $t('soqf_table.assessment_not_completed') }}
              <font-awesome-icon
                v-if="data.item.relevance.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
            <!-- Texto visible y no tooltip: bootstrap-vue no monta tooltips sobre
                 botones `disabled` (el navegador no emite eventos de mouse en ellos).
                 Verificado en navegador; ver ViewTable.vue. -->
            <small
              v-if="isSectionDisabled('relevance')"
              class="text-warning d-block mb-2"
              data-testid="ep-locked-relevance">
              <font-awesome-icon icon="user"></font-awesome-icon>
              {{ sectionLockedByName('relevance') }}
            </small>
          </template>
        </div>
      </template>
      <template v-slot:cell(cerqual)="data">
        <div v-if="data.item.methodological_limitations.option !== null && data.item.coherence.option !== null && data.item.adequacy.option !== null && data.item.relevance.option !== null && data.item.cerqual.option !== null">
          <template>
            <b-button
              block
              class="d-print-none mb-3"
              variant="outline-info"
              :disabled="isSectionDisabled('cerqual')"
              @click="editStageTwo(data.item, 'cerqual')">
              <template v-if="permission">{{ $t('common.edit') }}</template>
              <template v-else>{{ $t('common.view') }}</template>
              <font-awesome-icon
                v-if="data.item.cerqual.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
            <!-- Texto visible y no tooltip: bootstrap-vue no monta tooltips sobre
                 botones `disabled` (el navegador no emite eventos de mouse en ellos).
                 Verificado en navegador; ver ViewTable.vue. -->
            <small
              v-if="isSectionDisabled('cerqual')"
              class="text-warning d-block mb-2"
              data-testid="ep-locked-cerqual">
              <font-awesome-icon icon="user"></font-awesome-icon>
              {{ sectionLockedByName('cerqual') }}
            </small>
          </template>
          <p><b>{{displayLevelConfidence(data.item.cerqual.option)}}</b></p>
          <p v-if="data.item.cerqual.option && data.item.cerqual.explanation">
            <span class="font-weight-bolder text-black-50">{{ $t('worksheet_nav.explanation') }}:</span> {{data.item.cerqual.explanation}}
          </p>
          <p v-else class="text-muted font-weight-light" v-b-tooltip.hover="{title: $t('worksheet.tooltips.provide_explanation'), placement: 'bottom'}">
            {{ $t('worksheet.labels.explanation_not_added') }}
          </p>
        </div>
        <div v-else>
          <template v-if="permission">
            <b-button
              v-if="data.item.methodological_limitations.option && data.item.coherence.option && data.item.adequacy.option && data.item.relevance.option"
              block
              class="d-print-none"
              variant="info"
              :disabled="isSectionDisabled('cerqual')"
              @click="editStageTwo(data.item, 'cerqual')">
              {{ $t('soqf_table.assessment_not_completed') }}
              <font-awesome-icon
                v-if="data.item.cerqual.notes"
                icon="comments"></font-awesome-icon>
            </b-button>
            <!-- Texto visible y no tooltip: bootstrap-vue no monta tooltips sobre
                 botones `disabled` (el navegador no emite eventos de mouse en ellos).
                 Verificado en navegador; ver ViewTable.vue. -->
            <small
              v-if="isSectionDisabled('cerqual')"
              class="text-warning d-block mb-2"
              data-testid="ep-locked-cerqual">
              <font-awesome-icon icon="user"></font-awesome-icon>
              {{ sectionLockedByName('cerqual') }}
            </small>
          </template>
        </div>
      </template>
      <template v-slot:cell(references)="data">
        <template>
          <b-button
            block
            class="d-print-none mb-3"
            variant="outline-info"
            @click="openModalReferences">
            <template v-if="permission">{{ $t('soqf_table.edit_references') }}</template>
            <template v-else>{{ $t('soqf_table.view_references') }}</template>
          </b-button>
        </template>
        <span v-html="$t('soqf_table.refs_count', {count: data.item.references.length})"></span>
      </template>
      <template v-slot:table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
          <strong>{{ $t('common.loading') }}</strong>
        </div>
      </template>
    </b-table>
    <!-- display table in print mode -->
    <b-table
      class="toDoc"
      v-if="mode==='view'"
      id="assessments-print"
      responsive striped caption-top
      :fields="evidenceProfileFieldsPrintVersion"
      :items="evidenceProfile"
      :filter="evidenceProfileTableSettings.filter">
      <template v-slot:head(displayNumber)="data">
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
      <template v-slot:cell(displayNumber)="data">
        {{data.item.displayNumber}}
      </template>
      <template v-slot:cell(finding)="data">
        {{data.item.name}}
      </template>
      <template v-slot:cell(methodological-limit)="data">
        <div v-if="data.item.methodological_limitations.option !== null">
          <p><b>{{displaySelectedOption(data.item.methodological_limitations.option)}}</b></p>
          <p v-if="data.item.methodological_limitations.explanation">{{ $t('worksheet_nav.explanation') }}: {{getExplanation('methodological-limitations', data.item.methodological_limitations.option, data.item.methodological_limitations.explanation)}}</p>
        </div>
      </template>
      <template v-slot:cell(coherence)="data">
        <div v-if="data.item.coherence.option !== null">
          <p><b>{{displaySelectedOption(data.item.coherence.option)}}</b></p>
          <p v-if="data.item.coherence.explanation">{{ $t('worksheet_nav.explanation') }}: {{getExplanation('coherence', data.item.coherence.option, data.item.coherence.explanation)}}</p>
        </div>
      </template>
      <template v-slot:cell(adequacy)="data">
        <div v-if="data.item.adequacy.option !== null">
          <p><b>{{displaySelectedOption(data.item.adequacy.option)}}</b></p>
          <p v-if="data.item.adequacy.explanation">{{ $t('worksheet_nav.explanation') }}: {{getExplanation('adequacy', data.item.adequacy.option, data.item.adequacy.explanation)}}</p>
        </div>
      </template>
      <template v-slot:cell(relevance)="data">
        <div v-if="data.item.relevance.option !== null">
          <p><b>{{displaySelectedOption(data.item.relevance.option)}}</b></p>
          <p v-if="data.item.relevance.explanation">{{ $t('worksheet_nav.explanation') }}: {{getExplanation('relevance', data.item.relevance.option, data.item.relevance.explanation)}}</p>
        </div>
      </template>
      <template v-slot:cell(cerqual)="data">
        <div v-if="data.item.cerqual.option !== null">
          <p><b>{{displayLevelConfidence(data.item.cerqual.option)}}</b></p>
          <p v-if="data.item.cerqual.explanation">{{ $t('worksheet_nav.explanation') }}: {{data.item.cerqual.explanation}}</p>
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
      :title="$t('soqf_table.references')"
      size="xl"
      scrollable
      @ok="checkReferencesBeforeSaving"
      @hidden="handleReferencesModalHidden"
      :no-close-on-backdrop="pendingSaveReferences"
      :no-close-on-esc="pendingSaveReferences"
      :ok-disabled="!permission">
      <b-alert
        v-if="list.cerqual.option"
        show
        variant="danger">
        <span v-html="$t('soqf_table.remove_ref_warning')"></span>
      </b-alert>
      <b-table
        striped
        hover
        responsive
        class="references-list-table"
        :fields="[{key: 'content', label: $t('soqf_table.author_year_title')}]"
        :items="refsWithTitle">
        <template v-slot:head(content)="data">
          <span class="ml-4">{{ data.label }}</span>
        </template>
        <template v-slot:cell(content)="data">
          <b-form-checkbox
            class="w-100 cursor-pointer"
            :id="`checkbox-${data.index}`"
            v-model="localReferences"
            :name="`checkbox-${data.index}`"
            :value="data.item.id"
            :disabled="!permission">
            <span class="ml-2">{{ data.item.content }}</span>
          </b-form-checkbox>
        </template>
      </b-table>
    </b-modal>

    <b-modal
      id="modal-no-references-warning"
      ref="modal-no-references-warning"
      :title="$t('common.warning')"
      @ok="confirmSaveNoReferences"
      @cancel="cancelNoReferencesWarning"
      :ok-title="$t('common.continue')"
      ok-variant="outline-danger"
      cancel-variant="outline-secondary"
      no-close-on-backdrop
      no-close-on-esc>
      <p>{{ $t('soqf_table.remove_all_unpublish') }}</p>
    </b-modal>

    <b-modal
      id="modal-private-project-warning"
      ref="modal-private-project-warning"
      :title="$t('common.warning')"
      @ok="confirmSavePrivateProject"
      @cancel="cancelPrivateProjectWarning"
      :ok-title="$t('common.continue')"
      ok-variant="outline-danger"
      cancel-variant="outline-secondary"
      no-close-on-backdrop
      no-close-on-esc>
      <p>{{ $t('soqf_table.remove_all_revert') }}</p>
    </b-modal>

    <!-- modal -->
    <evidence-profile-form
      ref="evidenceProfileForm"
      :modalData="modalData"
      :list="list"
      :ui="ui"
      :show="show"
      :methAssessments="methAssessments"
      :findings="findings"
      :mode="mode"
      :extractedData="localExtractedData"
      :refsWithTitle="refsWithTitle"
      :showEditExtractedDataInPlace="showEditExtractedDataInPlace"
      :charsOfStudies="charsOfStudies"
      :project="project"
      :evidenceProfile="evidenceProfile"
      :selectOptions="selectOptions"
      :permission="permission"
      :modePrintFieldObject="modePrintFieldObject"
      @update-list-data="getList"
      @lock-denied="$emit('lock-denied')"
      @busyEvidenceProfileTable="busyEvidenceProfileTable"
      @callGetStageOneData="callGetStageOneData"
      @setShowEditExtractedDataInPlace="setShowEditExtractedDataInPlace"
      @getExtractedData="getExtractedData"></evidence-profile-form>
    <!-- end modal -->
  </div>
  <div v-else>
    <div class="text-center my-5">
      <p>
        {{ $t('worksheet.no_evidence_profile') }} <b-link v-b-modal.modal-evidence-profile-form>{{ $t('worksheet.add_evidence_profile') }}</b-link>
      </p>
    </div>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import { displayExplanation } from '../utils/commons'
import refLockStateMixin from '@/mixins/refLockStateMixin'
import { sectionOfType, blockedSectionsOf } from '@/utils/evidenceProfileLockKeys'
const backToTop = () => import(/* webpackChunkName: "backtotop" */'../backToTop')

export default {
  name: 'editListEvidenceProfile',
  // De acá salen `currentUserName` y `foreignRefLocks`. Lo que importa del mixin es
  // que descarta el lock propio por DOS caminos —el registro local de esta pestaña
  // y la comparación por nombre para otra pestaña de la misma persona—; sin el
  // segundo, abrir la worksheet dos veces te bloquea contra vos mismo, con tu
  // propio nombre en el cartel. Ese bug ya se derivó mal dos veces en este repo.
  mixins: [refLockStateMixin],
  props: {
    evidenceProfile: Array,
    ui: Object,
    evidenceProfileTableSettings: Object,
    references: Array,
    mode: String,
    list: Object,
    // El nombre es el que `refLockStateMixin` espera, así no hace falta un computed
    // puente (mismo criterio que `CamelotStepFourTable`). El default cubre a
    // `previewContentWorksheet`, que monta esta tabla en modo vista sin sondear.
    activeRefLocks: {
      type: Array,
      default: () => []
    },
    refsWithTitle: Array,
    project: Object,
    permission: Boolean,
    selectOptions: Array,
    levelConfidence: Array,
    findings: Object,
    methAssessments: Object,
    extractedData: Object,
    showEditExtractedDataInPlace: Object,
    modalData: Object,
    charsOfStudies: Object,
    show: Object,
    modePrintFieldObject: Array
  },
  components: {
    'back-to-top': backToTop,
    'evidence-profile-form': () => import('./evidenceProfileForm.vue')
  },
  mounted: function () {
    this.localExtractedData = this.extractedData
  },
  watch: {
    extractedData: {
      handler: function (val) {
        this.localExtractedData = val
      },
      deep: true
    }
  },
  data () {
    return {
      localReferences: [],
      pendingSaveReferences: false,
      localExtractedData: {
        fields: [],
        items: []
      }
    }
  },
  computed: {
    // Computed y no método: la plantilla lo consulta dos veces por cada uno de los diez
    // sitios de botón, y así el Map se arma una vez por cambio de los locks en vez de
    // veinte veces por render.
    blockedSections () {
      const findingId = this.findings && this.findings.id
      return blockedSectionsOf(this.foreignRefLocks, findingId, this.currentUserName)
    },
    evidenceProfileFields () {
      return [
        { key: 'displayNumber', label: '#' },
        { key: 'methodological-limit', label: this.$t('worksheet.methodological_limitations') },
        { key: 'coherence', label: this.$t('worksheet.coherence') },
        { key: 'adequacy', label: this.$t('worksheet.adequacy') },
        { key: 'relevance', label: this.$t('worksheet.relevance') },
        { key: 'cerqual', label: this.$t('soqf_table.print_confidence') },
        { key: 'references', label: this.$t('soqf_table.references') }
      ]
    },
    evidenceProfileFieldsPrintVersion () {
      return [
        { key: 'displayNumber', label: '#' },
        { key: 'name', label: this.$t('soqf_table.summarised_finding') },
        { key: 'methodological-limit', label: this.$t('worksheet.methodological_limitations') },
        { key: 'coherence', label: this.$t('worksheet.coherence') },
        { key: 'adequacy', label: this.$t('worksheet.adequacy') },
        { key: 'relevance', label: this.$t('worksheet.relevance') },
        { key: 'cerqual', label: this.$t('soqf_table.print_confidence') },
        {
          key: 'references',
          label: this.$t('soqf_table.references'),
          formatter: value => {
            return value
              .map(refId => {
                const ref = this.references.find(r => r.id === refId)
                return ref ? ref.content : ''
              })
              .join('')
          }
        }
      ]
    }
  },
  methods: {
    getExplanation: function (type, option, explanation) {
      return displayExplanation(type, option, explanation)
    },
    checkReferencesBeforeSaving: function (bvModalEvent) {
      // Prevenir que el modal se cierre automáticamente si no hay referencias seleccionadas
      // y había referencias originalmente
      if (this.localReferences.length === 0 && this.list.references.length > 0 && this.project.is_public) {
        bvModalEvent.preventDefault()
        this.pendingSaveReferences = true

        // Verificar si hay otros lists en el proyecto con referencias
        this.checkOtherListsWithReferences()
        return
      }

      // Si no se necesita mostrar la advertencia, proceder con el guardado
      this.saveReferencesList()
    },

    checkOtherListsWithReferences: function () {
      // Hacer una consulta para obtener todos los lists del proyecto
      Api.get(`/isoqf_lists`, { project_id: this.project.id })
        .then((response) => {
          const allLists = response.data
          // Filtrar el list actual y verificar si hay otros con referencias
          const otherListsWithReferences = allLists.filter(list =>
            list.id !== this.list.id && list.references && list.references.length > 0
          )

          if (otherListsWithReferences.length === 0) {
            // Si no hay otros lists con referencias, el proyecto se vuelve privado
            this.$refs['modal-private-project-warning'].show()
          } else {
            // Si hay otros lists con referencias, solo este finding desaparece
            this.$refs['modal-no-references-warning'].show()
          }
        })
        .catch((error) => {
          console.log('Error checking other lists:', error)
          // En caso de error, mostrar el modal estándar por seguridad
          this.$refs['modal-no-references-warning'].show()
        })
    },

    handleReferencesModalHidden: function () {
      // Solo limpiar si no hay una operación pendiente
      if (!this.pendingSaveReferences) {
        this.cleanReferencesList()
      }
    },

    confirmSaveNoReferences: function () {
      // El usuario confirmó que desea continuar sin referencias
      this.saveReferencesList()
      // Cerrar ambos modales
      this.$nextTick(() => {
        this.pendingSaveReferences = false
        this.$refs['modalReferences'].hide()
      })
    },

    cancelNoReferencesWarning: function () {
      // El usuario canceló - restaurar localReferences al estado original
      this.localReferences = [...this.list.references]
      this.pendingSaveReferences = false
    },

    confirmSavePrivateProject: function () {
      // El usuario confirmó que desea continuar, haciendo el proyecto privado
      this.saveProjectAsPrivate()
      // Guardar las referencias (que estarán vacías)
      this.saveReferencesList()
      // Cerrar ambos modales
      this.$nextTick(() => {
        this.pendingSaveReferences = false
        this.$refs['modalReferences'].hide()
      })
    },

    cancelPrivateProjectWarning: function () {
      // El usuario canceló - restaurar localReferences al estado original
      this.localReferences = [...this.list.references]
      this.pendingSaveReferences = false
    },

    saveProjectAsPrivate: function () {
      // Actualizar el proyecto para que sea privado
      const params = {
        is_public: false,
        private: true,
        license_type: '',
        public_type: 'private'
      }
      Api.patch(`/isoqf_projects/${this.project.id}`, params)
        .then(() => {
          // Emitir un evento para notificar al componente padre que el estado del proyecto cambió
          this.$emit('update-project-status')
        })
        .catch((error) => {
          console.log('Error updating project status:', error)
        })
    },

    cleanReferencesList: function () {
      this.localReferences = []
      this.pendingSaveReferences = false
    },

    saveReferencesList: function () {
      this.busyEvidenceProfileTable(true)
      const params = {
        references: this.localReferences
      }
      Api.patch(`/isoqf_lists/${this.list.id}`, params)
        .then(() => {
          this.updateReferencesInFindings()
          this.cleanReferencesList()
        })
    },
    updateReferencesInFindings: function () {
      // Persist to the top-level finding field (source of truth). The old
      // 'evidence_profile.references' dot-notation write was silently flattened
      // to a garbage field by the backend sanitizer.
      let params = {
        references: this.localReferences
      }
      Api.patch(`/isoqf_findings/${this.findings.id}`, params)
        .then((response) => {
          this.$emit('update-list-data')
          // this.getList()
        })
        .catch((error) => {
          this.$emit('printErrors', error)
          // this.printErrors(error)
        })
    },
    displaySelectedOption: function (option) {
      if (option === null) {
        return ''
      } else if (option >= 0 && this.selectOptions && this.selectOptions[option]) {
        return this.selectOptions[option].text
      } else {
        return ''
      }
    },
    displayExclamationAlert: function (type) {
      const evidenceProfile = this.evidenceProfile[0]
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
    },
    displayLevelConfidence: function (option) {
      if (option !== null && this.levelConfidence && this.levelConfidence[option]) {
        return this.levelConfidence[option].text
      }
      return ''
    },
    checkValidationText: function (type, prop) {
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
    openModalReferences: function () {
      // Copiar las referencias a la variable local para edición
      this.localReferences = [...this.list.references]
      this.$refs['modalReferences'].show()
    },
    // ── Bloqueo visible de los assessments ─────────────────────────────
    // La unidad de lock es la SECCIÓN (`<fid>::ep::<name>`), pero el lock del
    // documento pelado sigue bloqueando las cinco: es más amplio y lo sostienen
    // quien edita la identidad del finding desde `ViewTable` y cualquier pestaña
    // con un bundle previo al despliegue. Las dos reglas, y la del sufijo que este
    // cliente no enumera, viven en `blockedSectionsOf` — que espeja `base_ref_of`
    // del servidor, la función que realmente decide un conflicto.
    //
    // El doble descarte del lock propio es el punto: `foreignRefLocks` (del mixin)
    // saca los que ESTA pestaña sostiene, y `currentUserName` los que sostiene otra
    // pestaña de la misma persona. Sin el segundo, abrir la worksheet dos veces se
    // bloquea contra uno mismo.
    // Normaliza las dos grafías vivas: la plantilla pasa guión bajo, el guard de
    // `editStageTwo` recibe el `type` con guión.
    sectionHolderOf: function (section) {
      const canonical = sectionOfType(section)
      if (!canonical) return null
      return this.blockedSections.get(canonical) || null
    },
    // `permission` va en la condición a propósito: en la rama «ya completada» el
    // botón existe también para quien no puede escribir, donde dice «View». Grisar
    // el View sería una regresión — leer no molesta a nadie.
    isSectionDisabled: function (section) {
      return Boolean(this.permission && this.sectionHolderOf(section))
    },
    sectionLockedByName: function (section) {
      const holder = this.sectionHolderOf(section)
      return holder ? this.$t('lock.ref_locked_by', { user: holder }) : ''
    },
    editStageTwo: function (data, type) {
      // Defensa en profundidad: el botón ya está `disabled`, pero el sondeo puede
      // tener hasta 15 s de atraso y el grisado es una comodidad, no la garantía
      // (la garantía es el acquire del modal). Mismo criterio que `StepThree`.
      if (this.isSectionDisabled(type)) return
      const titles = {
        'methodological-limitations': this.$t('worksheet.methodological_limitations'),
        'coherence': this.$t('worksheet.coherence'),
        'adequacy': this.$t('worksheet.adequacy'),
        'relevance': this.$t('worksheet.relevance'),
        'cerqual': this.$t('soqf_table.print_confidence')
      }
      data.type = type
      data.title = titles[type]
      const theData = JSON.parse(JSON.stringify(data))
      this.$emit('modalDataChanged', theData)
      this.$refs.evidenceProfileForm.openModalEvidenceProfie()
    },
    getList: function (status = false) {
      this.$emit('update-list-data', status)
    },
    busyEvidenceProfileTable: function (status) {
      this.$emit('busyEvidenceProfileTable', status)
    },
    callGetStageOneData: function (status) {
      this.$emit('callGetFinding', status)
    },
    setShowEditExtractedDataInPlace: function (data) {
      this.$emit('setShowEditExtractedDataInPlace', data)
    },
    getExtractedData: function (status) {
      this.$emit('getExtractedData', status)
    }
  }
}
</script>

<style lang="scss" scoped>
.cursor-pointer {
  cursor: pointer;
}

.references-list-table {
  ::v-deep .custom-control-label {
    width: 100%;
    cursor: pointer;
    padding-top: 2px;
  }
}
</style>
