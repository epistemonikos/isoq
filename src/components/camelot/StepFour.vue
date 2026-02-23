<template>
  <div class="step-four-container">
    <div class="mb-3 d-flex justify-content-end align-items-center">
      <b-button variant="link" class="p-0 help-link d-flex align-items-center mr-3" v-b-toggle.sidebar-help>
        <font-awesome-icon icon="question-circle" class="mr-1" />
        {{ $t('camelot.step_four.how_to_read.title') }}
      </b-button>

      <b-dropdown
        variant="outline-primary"
        size="sm"
        no-caret
        right
        class="legend-dropdown"
        @show="showLegend = true"
        @hide="showLegend = false"
      >
        <template #button-content>
          {{ showLegend ? $t('camelot.step_four.legend.hide') : $t('camelot.step_four.legend.show') }}
          <div class="color-preview-bars d-inline-flex ml-2">
            <div class="color-bar" style="background-color: #1065AB;"></div>
            <div class="color-bar" style="background-color: #8EC4DE;"></div>
            <div class="color-bar" style="background-color: #F6A482;"></div>
            <div class="color-bar" style="background-color: #B31529;"></div>
            <div class="color-bar" style="background-color: #B3B3B3;"></div>
          </div>
        </template>
        <div class="p-3" style="min-width: 320px;">
          <h6 class="font-weight-bold mb-3">{{ $t('camelot.step_four.legend.title') }}</h6>
          <div v-for="response in ui.responses" :key="response.value" class="d-flex align-items-center mb-2">
            <div class="assessment-circle circle-filled mr-2" :style="{ backgroundColor: response.color }"></div>
            <span class="small">{{ response.text }}</span>
          </div>
          <div class="d-flex align-items-center mb-0">
            <div class="assessment-circle circle-not-completed mr-2"></div>
            <span class="small">{{ $t('camelot.step_four.legend.not_completed') }}</span>
          </div>
        </div>
      </b-dropdown>
    </div>

    <b-sidebar id="sidebar-help" :title="$t('camelot.step_four.how_to_read.title')" shadow right backdrop>
      <div class="px-3 py-2">
        <h5 class="mb-3">{{ $t('camelot.step_four.how_to_read.section_1') }}</h5>
        <hr>
        <h5 class="mb-3">{{ $t('camelot.step_four.how_to_read.section_2') }}</h5>
        <hr>
        <h5 class="mb-3">{{ $t('camelot.step_four.how_to_read.section_3') }}</h5>
        <hr>
        <h5 class="mb-3">{{ $t('camelot.step_four.how_to_read.section_4') }}</h5>
      </div>
    </b-sidebar>

    <b-table
      :fields="ui.fields"
      :items="assessments.items"
      bordered
      responsive
      class="camelot-table"
      thead-tr-class="header-second-row"
    >
      <template v-slot:thead-top>
        <tr class="header-top-row">
          <th class="border-bottom-0">{{ $t('camelot.step_four.table_headers.authors') }}</th>
          <th colspan="5" class="text-center group-header border-left">{{ $t('camelot.step_four.tabs.fit_meta_design') }}</th>
          <th colspan="5" class="text-center group-header border-left">{{ $t('camelot.step_four.tabs.fit_meta_conduct') }}</th>
          <th colspan="2" class="text-center group-header border-left">{{ $t('camelot.step_four.tabs.fit_design_conduct') }}</th>
          <th colspan="2" class="text-center group-header border-left header-overall-group">{{ $t('camelot.step_four.tabs.overall') }}</th>
        </tr>
      </template>

      <template v-slot:cell(authors)="data">
        <span class="font-weight-bold">{{ data.item.authors }}</span>
      </template>

      <!-- Step One: FA 1-4 + Edit -->
      <template v-slot:cell(fa1)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(0, 0, data.item)]" :style="getCircleStyle(0, 0, data.item)" @click="openModal(0, data, 0)"></div>
        </div>
      </template>
      <template v-slot:cell(fa2)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(0, 1, data.item)]" :style="getCircleStyle(0, 1, data.item)" @click="openModal(0, data, 1)"></div>
        </div>
      </template>
      <template v-slot:cell(fa3)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(0, 2, data.item)]" :style="getCircleStyle(0, 2, data.item)" @click="openModal(0, data, 2)"></div>
        </div>
      </template>
      <template v-slot:cell(fa4)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(0, 3, data.item)]" :style="getCircleStyle(0, 3, data.item)" @click="openModal(0, data, 3)"></div>
        </div>
      </template>
      <template v-slot:cell(edit1)="data">
        <div class="d-flex justify-content-center">
          <b-button size="sm" variant="outline-primary" @click="openModal(0, data)" class="edit-btn">
            {{ $t('common.edit') }} <font-awesome-icon icon="edit" class="ml-1" />
          </b-button>
        </div>
      </template>

      <!-- Step Two: FA 5-8 + Edit -->
      <template v-slot:cell(fa5)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(1, 0, data.item)]" :style="getCircleStyle(1, 0, data.item)" @click="openModal(1, data, 0)"></div>
        </div>
      </template>
      <template v-slot:cell(fa6)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(1, 1, data.item)]" :style="getCircleStyle(1, 1, data.item)" @click="openModal(1, data, 1)"></div>
        </div>
      </template>
      <template v-slot:cell(fa7)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(1, 2, data.item)]" :style="getCircleStyle(1, 2, data.item)" @click="openModal(1, data, 2)"></div>
        </div>
      </template>
      <template v-slot:cell(fa8)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(1, 3, data.item)]" :style="getCircleStyle(1, 3, data.item)" @click="openModal(1, data, 3)"></div>
        </div>
      </template>
      <template v-slot:cell(edit2)="data">
        <div class="d-flex justify-content-center">
          <b-button size="sm" variant="outline-primary" @click="openModal(1, data)" class="edit-btn">
            {{ $t('common.edit') }} <font-awesome-icon icon="edit" class="ml-1" />
          </b-button>
        </div>
      </template>

      <!-- Step Three: FA 9 + Edit -->
      <template v-slot:cell(fa9)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(2, 0, data.item)]" :style="getCircleStyle(2, 0, data.item)" @click="openModal(2, data, 0)"></div>
        </div>
      </template>
      <template v-slot:cell(edit3)="data">
        <div class="d-flex justify-content-center">
          <b-button size="sm" variant="outline-primary" @click="openModal(2, data)" class="edit-btn">
            {{ $t('common.edit') }} <font-awesome-icon icon="edit" class="ml-1" />
          </b-button>
        </div>
      </template>

      <!-- Step Four: OA + Edit -->
      <template v-slot:cell(oa)="data">
        <div class="d-flex justify-content-center">
          <div :class="['assessment-circle', getCircleClass(3, 0, data.item)]" :style="getCircleStyle(3, 0, data.item)" @click="openModal(3, data, 0)"></div>
        </div>
      </template>
      <template v-slot:cell(edit4)="data">
        <div class="d-flex justify-content-center">
          <b-button size="sm" variant="outline-primary" @click="openModal(3, data)" class="edit-btn">
            {{ $t('common.edit') }} <font-awesome-icon icon="edit" class="ml-1" />
          </b-button>
        </div>
      </template>
    </b-table>

    <b-modal id="modal-1" size="xl" header-class="camelot-modal-header" footer-class="camelot-modal-footer">
      <template #modal-title>
        <div class="modal-title-container">
          <div class="modal-breadcrumb">
            {{ $t('camelot.step_four.breadcrumb_main') }} &gt; 
            {{ $t('camelot.step_four.breadcrumb_sub') }} &gt; 
            <span class="text-white">{{ ui.authors }}</span>
          </div>
          <div class="modal-main-title mt-1">
            {{ modalSubtitle }}
          </div>
        </div>
      </template>
      <b-row>
        <b-col cols="12" class="modal-body">
          <b-tabs v-model="modal.tab" nav-class="modal-nav-tabs" align="right" @input="selectedMeta = $event">
            <template #tabs-start>
              <!-- <li role="presentation" class="nav-item mr-auto align-self-center modal-author"><b>{{ ui.authors }}*</b></li> -->
            </template>
            
            <template v-if="modal.stage < 2">
              <b-tab 
                v-for="(domain, dIndex) in ui.domainTabs" 
                :key="dIndex" 
                :title="domain.label"
                :title-link-class="modal.tab === dIndex ? ['modal-active-tab', 'modal-active-tab-text'] : ['modal-normal-tab', 'modal-normal-tab-text']"
              >
                <b-row class="mt-4">
                  <!-- Columna 1: Design or Conduct Domain values (all items) -->
                  <b-col cols="4" class="modal-column-scroll">
                    <div class="column-header mb-3">
                      <h3>{{ modal.stage === 0 ? $t('camelot.step_four.sections.research_design') : $t('camelot.step_four.sections.research_conduct') }}</h3>
                    </div>
                    <div>
                      <div v-for="(item, iIndex) in (modal.stage === 0 ? meta[1] : meta[2]).items" :key="iIndex" class="mb-3 border-bottom pb-2">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                          <h4 class="mb-0 font-weight-bold">
                            {{ iIndex + 1 }} - {{ getMetaItemLabel(modal.stage === 0 ? 1 : 2, iIndex) }}
                            <font-awesome-icon v-if="displayExclamationAlert(modal.stage === 0 ? 1 : 2, iIndex)" icon="exclamation-circle" class="text-danger ml-1" />
                          </h4>
                          <b-button v-if="editingField.metaIndex !== (modal.stage === 0 ? 1 : 2) || editingField.itemIndex !== iIndex"
                            size="sm" variant="link" class="p-0 text-primary edit-category-btn" @click="startEditing(modal.stage === 0 ? 1 : 2, iIndex)">
                            {{ $t('common.edit') }} <font-awesome-icon icon="edit" class="ml-1" />
                          </b-button>
                        </div>

                        <div class="pl-2">
                          <template v-if="editingField.metaIndex === (modal.stage === 0 ? 1 : 2) && editingField.itemIndex === iIndex">
                            <!-- Modo Edición Combinado -->
                            <h5 class="small text-muted mt-1">{{ $t('camelot.step_four.common.extracted_data') }}</h5>
                            <b-form-textarea v-model="editValueExtracted" size="sm" rows="3" class="mb-2"></b-form-textarea>
                            
                            <h5 class="small text-muted mt-1">{{ $t('camelot.step_four.common.concerns') }}</h5>
                            <b-form-textarea v-model="editValueConcerns" size="sm" rows="3" class="mb-2"></b-form-textarea>
                            
                            <b-alert show variant="danger" class="mb-2 small not-completed-alert">
                              <div class="alert-strip"></div>
                              <div class="alert-content">{{ $t('camelot.step_four.inline_edit.warning') }}</div>
                            </b-alert>
                            
                            <div class="d-flex justify-content-end gap-2 mb-2">
                              <b-button size="sm" variant="danger" @click="cancelEditing" class="mr-2">{{ $t('common.cancel') }}</b-button>
                              <b-button size="sm" variant="primary" :disabled="isSavingField" @click="saveField">
                                <b-spinner small v-if="isSavingField"></b-spinner>
                                {{ $t('common.save') }}
                              </b-button>
                            </div>
                          </template>
                          
                          <template v-else>
                            <!-- Modo Vista -->
                            <h5 class="small text-muted mt-1">{{ $t('camelot.step_four.common.extracted_data') }}</h5>
                            <p v-if="(modal.stage === 0 ? meta[1] : meta[2]).values[iIndex][item + 'extractedData']" class="mb-2 text-wrap-pre">{{ (modal.stage === 0 ? meta[1] : meta[2]).values[iIndex][item + 'extractedData'] }}</p>
                            <b-alert v-else show variant="warning" class="mb-2 small not-completed-alert">
                              <div class="alert-strip"></div>
                              <div class="alert-content">{{ $t('common.not_completed') }}</div>
                            </b-alert>
                            
                            <h5 class="small text-muted mt-1">{{ $t('camelot.step_four.common.concerns') }}</h5>
                            <p v-if="(modal.stage === 0 ? meta[1] : meta[2]).values[iIndex][item + 'concerns']" class="mb-0 text-wrap-pre">{{ (modal.stage === 0 ? meta[1] : meta[2]).values[iIndex][item + 'concerns'] }}</p>
                            <b-alert v-else show variant="warning" class="mb-0 small not-completed-alert">
                              <div class="alert-strip"></div>
                              <div class="alert-content">{{ $t('common.not_completed') }}</div>
                            </b-alert>
                          </template>
                        </div>
                      </div>
                    </div>
                  </b-col>
                  
                  <!-- Columna 2: Split into 2.1 and 2.2 -->
                  <b-col cols="8">
                    <b-row>
                      <!-- Columna 2.1: Meta Domain item (Research, Stakeholders, etc.) -->
                      <b-col cols="6" class="modal-column-scroll">
                        <div class="column-header mb-3 d-flex justify-content-between align-items-center border-bottom pb-2">
                          <h3 class="mb-0 border-0">
                            {{ domain.label }}
                            <font-awesome-icon v-if="displayExclamationAlert(0, dIndex)" icon="exclamation-circle" class="text-danger ml-1" />
                          </h3>
                          <b-button v-if="editingField.metaIndex !== 0 || editingField.itemIndex !== dIndex"
                            size="sm" variant="link" class="p-0 text-primary edit-category-btn" @click="startEditing(0, dIndex)">
                            {{ $t('common.edit') }} <font-awesome-icon icon="edit" class="ml-1" />
                          </b-button>
                        </div>
                        <div class="pl-2">
                          <template v-if="editingField.metaIndex === 0 && editingField.itemIndex === dIndex">
                            <!-- Modo Edición Combinado Meta Domain -->
                            <h5 class="small text-muted mt-1">{{ $t('camelot.step_four.common.extracted_data') }}</h5>
                            <b-form-textarea v-model="editValueExtracted" size="sm" rows="3" class="mb-2"></b-form-textarea>
                            
                            <h5 class="small text-muted mt-1">{{ $t('camelot.step_four.common.concerns') }}</h5>
                            <b-form-textarea v-model="editValueConcerns" size="sm" rows="3" class="mb-2"></b-form-textarea>
                            
                            <b-alert show variant="danger" class="mb-2 small not-completed-alert">
                              <div class="alert-strip"></div>
                              <div class="alert-content">{{ $t('camelot.step_four.inline_edit.warning') }}</div>
                            </b-alert>
                            
                            <div class="d-flex justify-content-end gap-2 mb-2">
                              <b-button size="sm" variant="danger" @click="cancelEditing" class="mr-2">{{ $t('common.cancel') }}</b-button>
                              <b-button size="sm" variant="primary" :disabled="isSavingField" @click="saveField">
                                <b-spinner small v-if="isSavingField"></b-spinner>
                                {{ $t('common.save') }}
                              </b-button>
                            </div>
                          </template>
                          
                          <template v-else>
                            <!-- Modo Vista Meta Domain -->
                            <h5 class="small text-muted mt-1">{{ $t('camelot.step_four.common.extracted_data') }}</h5>
                            <p v-if="meta[0].values[dIndex][meta[0].items[dIndex] + 'extractedData']" class="mb-2 text-wrap-pre">{{ meta[0].values[dIndex][meta[0].items[dIndex] + 'extractedData'] }}</p>
                            <b-alert v-else show variant="warning" class="mb-2 small not-completed-alert">
                              <div class="alert-strip"></div>
                              <div class="alert-content">{{ $t('common.not_completed') }}</div>
                            </b-alert>
                            
                            <h5 class="small text-muted mt-1">{{ $t('camelot.step_four.common.concerns') }}</h5>
                            <p v-if="meta[0].values[dIndex][meta[0].items[dIndex] + 'concerns']" class="mb-0 text-wrap-pre">{{ meta[0].values[dIndex][meta[0].items[dIndex] + 'concerns'] }}</p>
                            <b-alert v-else show variant="warning" class="mb-0 small not-completed-alert">
                              <div class="alert-strip"></div>
                              <div class="alert-content">{{ $t('common.not_completed') }}</div>
                            </b-alert>
                          </template>
                        </div>
                      </b-col>
                      
                      <!-- Columna 2.2: Assessment Evaluation -->
                      <b-col cols="6" class="border-left">
                        <assessmentForm
                          :assessments="assessments"
                          :modalStage="modal.stage"
                          :selectedMeta="dIndex"
                          :refId="refId"
                          :modalIndex="modal.index"
                          @getAssessments="getAssessments"></assessmentForm>
                      </b-col>
                    </b-row>
                  </b-col>
                </b-row>
              </b-tab>
            </template>
            
            <template v-else-if="modal.stage === 2">
              <b-tab 
                :title="$t('camelot.step_four.tabs.fit_design_conduct')"
                :title-link-class="['modal-active-tab', 'modal-active-tab-text']"
              >
                <b-row class="mt-4">
                  <!-- Columna 1: Research Design -->
                  <b-col cols="4" class="modal-column-scroll">
                    <div class="column-header mb-3">
                      <h3>{{ $t('camelot.step_four.sections.research_design') }}</h3>
                    </div>
                    <div>
                      <div v-for="(item, iIndex) in meta[1].items" :key="iIndex" class="mb-3 border-bottom pb-2">
                        <h4 class="mb-2 font-weight-bold">
                          {{ iIndex + 1 }} - {{ getMetaItemLabel(1, iIndex) }}
                          <font-awesome-icon v-if="displayExclamationAlert(1, iIndex)" icon="exclamation-circle" class="text-danger ml-1" />
                        </h4>
                        <div class="pl-2">
                          <h5 class="mt-1 small text-muted">{{ $t('camelot.step_four.common.extracted_data') }}</h5>
                          <p v-if="meta[1].values[iIndex][item + 'extractedData']" class="mb-0">{{ meta[1].values[iIndex][item + 'extractedData'] }}</p>
                          <b-alert v-else show variant="warning" class="mb-0 small not-completed-alert">
                            <div class="alert-strip"></div>
                            <div class="alert-content">{{ $t('common.not_completed') }}</div>
                          </b-alert>
                        </div>
                      </div>
                    </div>
                  </b-col>
                  
                  <!-- Columna 2: Research Conduct -->
                  <b-col cols="4" class="modal-column-scroll">
                    <div class="column-header mb-3">
                      <h3>{{ $t('camelot.step_four.sections.research_conduct') }}</h3>
                    </div>
                    <div>
                      <div v-for="(item, iIndex) in meta[2].items" :key="iIndex" class="mb-3 border-bottom pb-2">
                        <h4 class="mb-2 font-weight-bold">
                          {{ iIndex + 1 }} - {{ getMetaItemLabel(2, iIndex) }}
                          <font-awesome-icon v-if="displayExclamationAlert(2, iIndex)" icon="exclamation-circle" class="text-danger ml-1" />
                        </h4>
                        <div class="pl-2">
                          <h5 class="mt-1 small text-muted">{{ $t('camelot.step_four.common.extracted_data') }}</h5>
                          <p v-if="meta[2].values[iIndex][item + 'extractedData']" class="mb-0">{{ meta[2].values[iIndex][item + 'extractedData'] }}</p>
                          <b-alert v-else show variant="warning" class="mb-0 small not-completed-alert">
                            <div class="alert-strip"></div>
                            <div class="alert-content">{{ $t('common.not_completed') }}</div>
                          </b-alert>
                        </div>
                      </div>
                    </div>
                  </b-col>

                  <!-- Columna 3: Assessment Evaluation -->
                  <b-col cols="4" class="border-left">
                    <assessmentForm
                      :assessments="assessments"
                      :modalStage="2"
                      :selectedMeta="0"
                      :refId="refId"
                      :modalIndex="modal.index"
                      @getAssessments="getAssessments"></assessmentForm>
                  </b-col>
                </b-row>
              </b-tab>
            </template>
            
            <template v-else-if="modal.stage === 3">
              <b-tab 
                :title="$t('camelot.step_four.tabs.overall')"
                :title-link-class="['modal-active-tab', 'modal-active-tab-text']"
              >
                <b-row class="mt-4">
                  <!-- Columna 1: Fit Design vs Meta Resumen -->
                  <b-col cols="3" class="modal-column-scroll">
                    <div class="column-header mb-3">
                      <h3>{{ $t('camelot.step_four.sections.fit_between_design_meta') }}</h3>
                    </div>
                    <div>
                      <div v-for="(domain, dIndex) in ui.domainTabs" :key="dIndex" class="mb-3 border-bottom pb-2">
                        <h4 class="mb-2 font-weight-bold">{{ dIndex + 1 }} - {{ domain.label }}</h4>
                        <div class="pl-2" v-if="assessments.items.length">
                          <responses
                            :stage="0"
                            :index="dIndex"
                            :option="assessments.items[modal.index].stages[0].options[dIndex].option"
                            :text="assessments.items[modal.index].stages[0].options[dIndex].text"></responses>
                        </div>
                      </div>
                    </div>
                  </b-col>

                  <!-- Columna 2: Fit Conduct vs Meta Resumen -->
                  <b-col cols="3" class="modal-column-scroll">
                    <div class="column-header mb-3">
                      <h3>{{ $t('camelot.step_four.sections.fit_between_conduct_meta') }}</h3>
                    </div>
                    <div>
                      <div v-for="(domain, dIndex) in ui.domainTabs" :key="dIndex" class="mb-3 border-bottom pb-2">
                        <h4 class="mb-2 font-weight-bold">{{ dIndex + 1 }} - {{ domain.label }}</h4>
                        <div class="pl-2" v-if="assessments.items.length">
                          <responses
                            :stage="1"
                            :index="dIndex"
                            :option="assessments.items[modal.index].stages[1].options[dIndex].option"
                            :text="assessments.items[modal.index].stages[1].options[dIndex].text"></responses>
                        </div>
                      </div>
                    </div>
                  </b-col>

                  <!-- Columna 3: Fit Design vs Conduct Resumen (FA9) -->
                  <b-col cols="3" class="modal-column-scroll border-left">
                    <div class="column-header mb-3">
                      <h3>{{ $t('camelot.step_four.sections.fit_between_design_conduct') }}</h3>
                    </div>
                    <div class="p-1">
                      <responses
                        v-if="assessments.items.length"
                        :stage="2"
                        :index="0"
                        :option="assessments.items[modal.index].stages[2].options[0].option"
                        :text="assessments.items[modal.index].stages[2].options[0].text"></responses>
                    </div>
                  </b-col>

                  <!-- Columna 4: Evaluación de ajuste final -->
                  <b-col cols="3" class="border-left">
                    <assessmentForm
                      :assessments="assessments"
                      :modalStage="3"
                      :selectedMeta="0"
                      :refId="refId"
                      :modalIndex="modal.index"
                      @getAssessments="getAssessments"></assessmentForm>
                  </b-col>
                </b-row>
              </b-tab>
            </template>
          </b-tabs>
        </b-col>
      </b-row>
      <template #modal-footer>
        <div class="w-100 d-flex justify-content-between align-items-center px-3">
          <div v-if="modal.stage > 0" @click="goToStage(modal.stage - 1)" class="nav-footer-link">
            &lt; {{ getStageTitle(modal.stage - 1) }}
          </div>
          <div v-else></div>
          
          <div v-if="modal.stage < 3" @click="goToStage(modal.stage + 1)" class="nav-footer-link">
            {{ getStageTitle(modal.stage + 1) }} &gt;
          </div>
          <div v-else @click="$bvModal.hide('modal-1')" class="nav-footer-link">
            {{ $t('common.close') }}
          </div>
        </div>
      </template>
    </b-modal>
  </div>
</template>

<script>
import Api from '@/utils/Api'
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
    const headerClass = 'header-second-row'
    const overallHeaderClass = 'header-overall-row'

    return {
      ui: {
        fields: [
          { key: 'authors', label: 'Fit assessments', thClass: headerClass, tdClass: 'border-right' },
          // Group 1
          { key: 'fa1', label: 'FA 1', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'fa2', label: 'FA 2', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'fa3', label: 'FA 3', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'fa4', label: 'FA 4', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'edit1', label: '', thClass: headerClass, tdClass: 'border-right' },
          // Group 2
          { key: 'fa5', label: 'FA 5', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'fa6', label: 'FA 6', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'fa7', label: 'FA 7', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'fa8', label: 'FA 8', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'edit2', label: '', thClass: headerClass, tdClass: 'border-right' },
          // Group 3
          { key: 'fa9', label: 'FA 9', thClass: headerClass, tdClass: 'assessment-col' },
          { key: 'edit3', label: '', thClass: headerClass, tdClass: 'border-right' },
          // Group 4 (OA)
          { key: 'oa', label: 'OA', thClass: overallHeaderClass, tdClass: 'assessment-col' },
          { key: 'edit4', label: '', thClass: overallHeaderClass }
        ],
        authors: '',
        domainTabs: [
          { key: 'research', label: this.$t('camelot.step_four.meta_items.research') },
          { key: 'stakeholders', label: this.$t('camelot.step_four.meta_items.stakeholders') },
          { key: 'researchers', label: this.$t('camelot.step_four.meta_items.researchers') },
          { key: 'context', label: this.$t('camelot.step_four.meta_items.context') }
        ],
        responses: [
          { text: this.$t('camelot.responses.no_minimal'), value: 'A', color: '#1065AB' },
          { text: this.$t('camelot.responses.minor'), value: 'B', color: '#8EC4DE' },
          { text: this.$t('camelot.responses.moderate'), value: 'C', color: '#F6A482' },
          { text: this.$t('camelot.responses.serious'), value: 'D', color: '#B31529' },
          { text: this.$t('camelot.responses.unclear'), value: 'E', color: '#B3B3B3' }
        ]
      },
      characteristics: {
        items: []
      },
      assessments: {
        items: []
      },
      selected: null,
      text1: '',
      modal: {
        stage: 0,
        index: 0,
        tab: 0
      },
      meta: [
        {
          name: this.$t('camelot.step_four.sections.meta_domains'),
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
          name: this.$t('camelot.step_four.sections.research_design'),
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
          name: this.$t('camelot.step_four.sections.research_conduct'),
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
      refId: null,
      editingField: {
        metaIndex: null,
        itemIndex: null
      },
      editValueExtracted: '',
      editValueConcerns: '',
      isSavingField: false,
      showLegend: false
    }
  },
  computed: {
    modalSubtitle () {
      const stages = [
        'fit_meta_design',
        'fit_meta_conduct',
        'fit_design_conduct',
        'overall'
      ]
      return this.$t(`camelot.step_four.tabs.${stages[this.modal.stage]}`)
    }
  },
  watch: {
    'modal.stage': function (newVal) {
      this.selectedMeta = 0
    },
    references: {
      handler (newVal) {
        this.getAssessments()
      },
      immediate: true
    }
  },
  mounted () {
    this.getAssessments()
  },
  methods: {
    getReferenceData: function (reference) {
      return Commons.parseReference(reference, true, false)
    },
    getMetaItemLabel (metaIndex, itemIndex) {
      if (metaIndex === 0) {
        const keys = ['research', 'stakeholders', 'researchers', 'context']
        return this.$t(`camelot.step_four.meta_items.${keys[itemIndex]}`)
      } else if (metaIndex === 1) {
        const keys = ['strategy', 'ethical', 'equity', 'theory']
        return this.$t(`camelot.step_four.design_items.${keys[itemIndex]}`)
      } else if (metaIndex === 2) {
        const keys = ['participant', 'data', 'analysis', 'presentation']
        return this.$t(`camelot.step_four.conduct_items.${keys[itemIndex]}`)
      }
      return ''
    },
    getAssessments: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      Api.get('/isoqf_assessments', params)
        .then(response => {
          if (response.data.length) {
            this.assessments = {...response.data[0]}
            if (this.assessments.items && this.assessments.items.length > 0) {
              this.assessments.items.sort((a, b) => {
                const authorsA = a.authors || '';
                const authorsB = b.authors || '';
                return authorsA.localeCompare(authorsB);
              });
            }
          } else {
            const sortedReferences = [...this.references].sort((a, b) => {
              const authorsA = this.getReferenceData(a) || '';
              const authorsB = this.getReferenceData(b) || '';
              return authorsA.localeCompare(authorsB);
            });

            this.assessments = {
              items: sortedReferences.map(ref => ({
                ref_id: ref.id,
                authors: this.getReferenceData(ref),
                stages: [
                  {
                    key: 0,
                    options: Array.from({ length: 4 }, () => ({ option: null, text: '' }))
                  },
                  {
                    key: 1,
                    options: Array.from({ length: 4 }, () => ({ option: null, text: '' }))
                  },
                  {
                    key: 2,
                    options: [{ option: null, text: '' }]
                  },
                  {
                    key: 3,
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
      Api.get('/isoqf_characteristics', params)
        .then(response => {
          if (!response.data || !response.data.length) return;
          
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
    openModal: function (stage = 0, data, tab = 0) {
      this.getCharacteristics()
      this.modal.stage = stage
      this.modal.index = data.index
      this.modal.tab = tab
      this.selectedMeta = tab
      this.refId = data.item.ref_id
      this.ui.authors = data.item.authors
      this.$bvModal.show('modal-1')
    },
    goToStage (stage) {
      this.modal.stage = stage
      this.modal.tab = 0
      this.selectedMeta = 0
    },
    getStageTitle (stage) {
      const stages = [
        'fit_meta_design',
        'fit_meta_conduct',
        'fit_design_conduct',
        'overall'
      ]
      return this.$t(`camelot.step_four.tabs.${stages[stage]}`)
    },
    displayExclamationAlert (metaIndex, itemIndex) {
      if (!this.meta[metaIndex] || !this.meta[metaIndex].values[itemIndex]) return false

      const itemPrefix = this.meta[metaIndex].items[itemIndex]
      const extractedData = this.meta[metaIndex].values[itemIndex][itemPrefix + 'extractedData']
      const concerns = this.meta[metaIndex].values[itemIndex][itemPrefix + 'concerns']

      return (!extractedData || extractedData.trim() === '') && (!concerns || concerns.trim() === '')
    },
    showFitAssessment: function (assessmentId, position) {
      this.selectedMeta = position
      this.$root.$emit('bv::toggle::collapse', assessmentId)
    },
    startEditing (metaIndex, itemIndex) {
      this.editingField = { metaIndex, itemIndex }
      const itemPrefix = this.meta[metaIndex].items[itemIndex]
      this.editValueExtracted = this.meta[metaIndex].values[itemIndex][itemPrefix + 'extractedData'] || ''
      this.editValueConcerns = this.meta[metaIndex].values[itemIndex][itemPrefix + 'concerns'] || ''
    },
    cancelEditing () {
      this.editingField = { metaIndex: null, itemIndex: null }
      this.editValueExtracted = ''
      this.editValueConcerns = ''
    },
    saveField () {
      if (!this.characteristics) return
      
      this.isSavingField = true
      const { metaIndex, itemIndex } = this.editingField
      const itemPrefix = this.meta[metaIndex].items[itemIndex]
      
      // Asegurar estructura básica si es un objeto nuevo
      if (!this.characteristics.organization) {
        this.characteristics.organization = this.$route.params.org_id
        this.characteristics.project_id = this.$route.params.id
      }
      
      if (!this.characteristics.items) {
        this.$set(this.characteristics, 'items', [])
      }

      // Actualizar o añadir el ítem en el arreglo principal
      let existingItemIdx = this.characteristics.items.findIndex(item => item.ref_id === this.refId)

      if (existingItemIdx !== -1) {
        this.$set(this.characteristics.items[existingItemIdx], itemPrefix + 'extractedData', this.editValueExtracted)
        this.$set(this.characteristics.items[existingItemIdx], itemPrefix + 'concerns', this.editValueConcerns)
      } else {
        this.characteristics.items.push({
          ref_id: this.refId,
          authors: this.ui.authors,
          [itemPrefix + 'extractedData']: this.editValueExtracted,
          [itemPrefix + 'concerns']: this.editValueConcerns
        })
      }
      
      // Actualizar la vista local meta para feedback inmediato
      this.meta[metaIndex].values[itemIndex][itemPrefix + 'extractedData'] = this.editValueExtracted
      this.meta[metaIndex].values[itemIndex][itemPrefix + 'concerns'] = this.editValueConcerns

      const savePromise = this.characteristics.id
        ? Api.patch(`/isoqf_characteristics/${this.characteristics.id}/`, this.characteristics)
        : Api.post('/isoqf_characteristics/', this.characteristics)

      savePromise
        .then(response => {
          const responseData = response.data.$set || response.data
          // Sincronizar objeto local con respuesta del servidor
          this.characteristics = { 
            ...this.characteristics, 
            ...responseData, 
            id: response.data.id || this.characteristics.id || response.data._id 
          }
          
          this.cancelEditing()
          this.isSavingField = false
          // Notificar a otros componentes (Paso 3)
          this.$root.$emit('characteristics-updated', this.characteristics)
        })
        .catch(error => {
          console.error('Error saving characteristic field:', error)
          this.isSavingField = false
          this.getCharacteristics()
        })
    },
    getCircleClass: function (stage, optionIndex, item) {
      if (!item || !item.stages || !item.stages[stage] || !item.stages[stage].options[optionIndex]) {
        return 'circle-not-completed'
      }
      const option = item.stages[stage].options[optionIndex].option
      return option === null ? 'circle-not-completed' : 'circle-filled'
    },
    getCircleStyle: function (stage, optionIndex, item) {
      if (!item || !item.stages || !item.stages[stage] || !item.stages[stage].options[optionIndex]) {
        return {}
      }
      const option = item.stages[stage].options[optionIndex].option
      if (option === null) return {}
      
      const response = this.ui.responses.find(r => r.value === option)
      return {
        backgroundColor: response ? response.color : '#B3B3B3'
      }
    }
  }
}
</script>

<style lang="scss">
.step-four-container {
  .help-link {
    color: #898989 !important;
    text-decoration: none !important;
    font-size: 0.9rem;
    
    &:hover, &:focus {
      color: #6c757d !important;
      text-decoration: underline !important;
    }
  }

  .color-preview-bars {
    gap: 1px;
    vertical-align: middle;
    align-items: center;
    .color-bar {
      width: 8px !important;
      height: 16px !important;
      display: block;
      flex-shrink: 0;
      border-radius: 1px;
    }
  }

  .camelot-table {
    font-size: 0.9rem;
    
    th, td {
      vertical-align: middle !important;
      padding: 0.75rem 0.5rem;
    }
    
    .assessment-col {
      width: 50px;
      min-width: 50px;
      padding: 0.5rem 0.25rem;
    }

    .edit-btn {
      white-space: nowrap;
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
    }
  }

  .header-top-row {
    background-color: #E9ECEF;
    color: #152536;
    
    th {
      border-bottom: none !important;
      padding: 1rem 0.5rem;
    }
  }

  .group-header {
    background-color: #E9ECEF;
  }

  .header-overall-group {
    background-color: #D8EBF5 !important;
  }

  .header-second-row {
    background-color: #D8DAE5 !important;
    color: #495057;
    
    th {
      font-weight: 500;
      font-size: 0.8rem;
      text-transform: uppercase;
    }
  }

  .header-overall-row {
    background-color: #D8EBF5 !important;
    color: #495057;
    th {
      font-weight: 500;
      font-size: 0.8rem;
    }
  }

  .assessment-circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    flex-shrink: 0;
    transition: transform 0.2s;
    
    &:hover {
      transform: scale(1.2);
    }
  }

  .circle-filled {
    border: none;
  }

  .circle-not-completed {
    border: 2px dashed #B3B3B3;
    background-color: transparent;
  }
}

.camelot-modal-header {
  background-color: #1E2137;
  color: #fff;
  border-bottom: none;
  padding: 1.5rem;

  .modal-breadcrumb {
    font-size: 0.85rem;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0.5px;
  }

  .modal-main-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #fff;
  }

  .close {
    color: #fff;
    text-shadow: none;
    opacity: 0.8;
    &:hover {
      opacity: 1;
    }
  }
}

.camelot-modal-footer {
  background-color: #F8F9FA;
  padding: 1.5rem;
  border-top: 1px solid #DEE2E6;

  .nav-footer-link {
    font-size: 0.95rem;
    font-weight: 500;
    color: #495057;
    cursor: pointer;
    text-decoration: none !important;
    transition: color 0.2s;
    
    &:hover {
      color: #1065AB;
      text-decoration: none !important;
    }
  }
}

.modal-body {
  color: #152536;
  
  h3 {
    font-size: 1.1rem;
    font-weight: bold;
    color: #1065AB;
    border-bottom: 2px solid #1065AB;
    padding-bottom: 0.5rem;
  }
  
  h4 {
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    color: #495057;
    margin-bottom: 0;
    
    &:hover {
      color: #1065AB;
    }
  }
  
  h5 {
    font-size: 0.85rem;
    font-weight: bold;
    color: #6C757D;
    text-transform: uppercase;
    margin-top: 1rem;
  }
  
  p {
    font-size: 0.9rem;
    color: #212529;
  }
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

.column-header {
  margin-bottom: 1.5rem;
}

.text-wrap-pre {
  white-space: pre-wrap;
  word-break: break-word;
}

.edit-category-btn {
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none !important;
  
  &:hover {
    color: #0056b3 !important;
  }
}

.modal-column-scroll {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #D8DAE5;
    border-radius: 3px;
  }
}

.not-completed-alert {
  padding: 0 !important;
  display: flex !important;
  align-items: stretch;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  .alert-strip {
    width: 5px;
    flex-shrink: 0;
  }

  &.alert-warning {
    background: linear-gradient(90deg, #fff3cd 0%, #fff9e6 100%) !important;
    .alert-strip {
      background-color: #856404;
    }
  }

  &.alert-danger {
    background: linear-gradient(90deg, rgba(179, 21, 41, 0.5) 0%, rgba(179, 21, 41, 0.35) 100%) !important;
    border-color: #B31529;
    color: #B31529;

    .alert-strip {
      background-color: #B31529;
    }
  }
  
  .alert-content {
    padding: 0.25rem 0.5rem;
  }
}
</style>
