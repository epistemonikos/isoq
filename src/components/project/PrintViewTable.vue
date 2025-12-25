<template>
  <div>
    <b-table-simple
      id="findings-print"
      ref="findings-print">
      <b-thead>
        <b-tr>
          <b-th>#</b-th>
          <b-th>Summarised review finding</b-th>
          <b-th>GRADE-CERQual assessment of confidence</b-th>
          <b-th>Explanation of GRADE-CERQual assessment</b-th>
          <b-th>References</b-th>
        </b-tr>
      </b-thead>
      <b-tbody>
        <b-tr v-for="(item, index) of dataPrintVersion" :key="index" :class="{'d-print-none': !printableItems.includes(item.id)}">
          <template v-if="item.is_category">
            <b-td
              colspan="5"
              class="text-center text-uppercase font-weight-bolder"
              style="font-weight: bold; text-align: center; text-transform: uppercase;">
              {{ item.name }}
            </b-td>
          </template>
          <template v-else>
            <b-td
              style="vertical-align: top;">
              <template v-if="categories.options.length">
                <p>{{item.cnt}}</p>
              </template>
              <template v-else>
                {{index+1}}
              </template>
            </b-td>
            <b-td
              style="vertical-align: top;">
              <template v-if="hasPermission">
                <template v-if="item.ref_list.length">
                  <p>
                  {{ item.name }}
                  </p>
                </template>
                <template v-else>
                  {{ item.name }}
                </template>
              </template>
              <template v-else>
                <p>{{ item.name }}</p>
              </template>
            </b-td>
            <b-td
              style="vertical-align: top;">
              <p>{{ item.cerqual_option }}</p>
            </b-td>
            <b-td
              style="vertical-align: top;">
              <template v-if="item.cerqual_option !== ''">
                <p>{{ item.cerqual_explanation }}</p>
              </template>
              <template v-else>
                <p>&nbsp;</p>
              </template>
            </b-td>
            <b-td
              style="vertical-align: top;">
              <p class="references">{{ item.ref_list }}</p>
            </b-td>
          </template>
        </b-tr>
      </b-tbody>
    </b-table-simple>
    <backToTop></backToTop>
    <div class="mt-5">
      <h3>{{ $t('worksheet.evidence_profile') }}</h3>
      <b-table-simple style="table-layout: fixed; width: 100%;">
        <b-thead>
          <b-tr>
            <b-th style="width: 5%">#</b-th>
            <b-th style="width: 35%">Summarised review finding</b-th>
            <b-th style="width: 10%">{{ $t('worksheet.methodological_limitations') }}</b-th>
            <b-th style="width: 10%">{{ $t('worksheet.coherence') }}</b-th>
            <b-th style="width: 10%">{{ $t('worksheet.adequacy') }}</b-th>
            <b-th style="width: 10%">{{ $t('worksheet.relevance') }}</b-th>
            <b-th style="width: 10%">GRADE-CERQual assessment of confidence</b-th>
            <b-th style="width: 10%">References</b-th>
          </b-tr>
        </b-thead>
        <b-tbody>
          <b-tr v-for="(item, index) of dataPrintVersion" :key="index" :class="{'d-print-none': !printableItems.includes(item.id)}">
            <template v-if="item.is_category">
              <b-td
                colspan="8"
                class="text-center text-uppercase font-weight-bolder"
                style="font-weight: bold; text-align: center; text-transform: uppercase;">
                {{ item.name }}
              </b-td>
            </template>
            <template v-else>
              <b-td style="width: 5%">
                <template v-if="categories.options.length">
                <p>{{item.cnt}}</p>
                </template>
                <template v-else>
                {{ index + 1 }}
                </template>
              </b-td>
              <b-td style="width: 35%">
                  <p>{{item.name}}</p>
              </b-td>
              <b-td style="width: 10%">
                <template v-if="Object.prototype.hasOwnProperty.call(item, 'evidence_profile') && item.evidence_profile !== undefined">
                  <template v-if="Object.prototype.hasOwnProperty.call(item.evidence_profile, 'methodological_limitations')">
                    <p>{{displaySelectedOption(item.evidence_profile.methodological_limitations.option)}}</p>
                    <template v-if="item.evidence_profile.methodological_limitations.explanation!==''">
                      <p><b>{{ $t('common.explanation') }}:</b> {{item.evidence_profile.methodological_limitations.explanation}}</p>
                    </template>
                  </template>
                </template>
              </b-td>
              <b-td style="width: 10%">
                <template v-if="Object.prototype.hasOwnProperty.call(item, 'evidence_profile') && item.evidence_profile !== undefined">
                  <template v-if="Object.prototype.hasOwnProperty.call(item.evidence_profile, 'coherence')">
                    <p>{{displaySelectedOption(item.evidence_profile.coherence.option)}}</p>
                    <template v-if="item.evidence_profile.coherence.explanation!==''">
                      <p><b>{{ $t('common.explanation') }}:</b> {{item.evidence_profile.coherence.explanation}}</p>
                    </template>
                  </template>
                </template>
              </b-td>
              <b-td style="width: 10%">
                <template v-if="Object.prototype.hasOwnProperty.call(item, 'evidence_profile') && item.evidence_profile !== undefined">
                  <template v-if="Object.prototype.hasOwnProperty.call(item.evidence_profile, 'adequacy')">
                    <p>{{displaySelectedOption(item.evidence_profile.adequacy.option)}}</p>
                    <template v-if="item.evidence_profile.adequacy.explanation!==''">
                        <p><b>{{ $t('common.explanation') }}:</b> {{item.evidence_profile.adequacy.explanation}}</p>
                    </template>
                  </template>
                </template>
              </b-td>
              <b-td style="width: 10%">
                <template v-if="Object.prototype.hasOwnProperty.call(item, 'evidence_profile') && item.evidence_profile !== undefined">
                  <template v-if="Object.prototype.hasOwnProperty.call(item.evidence_profile, 'relevance')">
                    <p>{{displaySelectedOption(item.evidence_profile.relevance.option)}}</p>
                    <template v-if="item.evidence_profile.relevance.explanation!==''">
                        <p><b>{{ $t('common.explanation') }}:</b> {{item.evidence_profile.relevance.explanation}}</p>
                    </template>
                  </template>
                </template>
              </b-td>
              <b-td style="width: 10%">
                <template v-if="Object.prototype.hasOwnProperty.call(item, 'evidence_profile') && item.evidence_profile !== undefined">
                  <template v-if="Object.prototype.hasOwnProperty.call(item.evidence_profile, 'cerqual')">
                    <p>{{displaySelectedOption(item.evidence_profile.cerqual.option, 'cerqual')}}</p>
                    <template v-if="item.evidence_profile.cerqual.explanation!==''">
                        <p><b>{{ $t('common.explanation') }}:</b> {{item.evidence_profile.cerqual.explanation}}</p>
                    </template>
                  </template>
                </template>
              </b-td>
              <b-td style="width: 10%">
                <p class="references">{{referencesWithNames(item.references)}}</p>
              </b-td>
            </template>
          </b-tr>
        </b-tbody>
      </b-table-simple>
    </div>
  </div>
</template>

<script>
import backToTop from '../backToTop.vue'
import Commons from '../../utils/commons.js'

export default {
  name: 'PrintViewTable',
  components: {
    backToTop
  },
  props: {
    references: {
      type: Array,
      required: true,
      default: () => []
    },
    dataPrintVersion: {
      type: Array,
      required: true,
      default: () => []
    },
    categories: {
      type: Object,
      required: true,
      default: () => ({
        options: [],
        selected: null
      })
    },
    printableItems: {
      type: Array,
      required: true,
      default: () => []
    },
    hasPermission: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  methods: {
    referencesWithNames: function (data) {
      return Commons.referencesWithNames(data, this.references)
    },
    displaySelectedOption: function (option, type) {
      return Commons.displaySelectedOption(option, type)
    }
  }
}
</script>
