<template>
  <b-table
    :fields="fields"
    :items="items"
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
</template>

<script>
export default {
  name: 'CamelotStepFourTable',
  props: {
    fields: { type: Array, required: true },
    items: { type: Array, required: true },
    responses: { type: Array, required: true }
  },
  methods: {
    getCircleClass(stage, optionIndex, item) {
      if (!item || !item.stages || !item.stages[stage] || !item.stages[stage].options[optionIndex]) {
        return 'circle-not-completed'
      }
      const option = item.stages[stage].options[optionIndex].option
      return option === null ? 'circle-not-completed' : 'circle-filled'
    },
    getCircleStyle(stage, optionIndex, item) {
      if (!item || !item.stages || !item.stages[stage] || !item.stages[stage].options[optionIndex]) {
        return {}
      }
      const option = item.stages[stage].options[optionIndex].option
      if (option === null) return {}
      
      const response = this.responses.find(r => r.value === option)
      return {
        backgroundColor: response ? response.color : '#B3B3B3'
      }
    },
    openModal(stage, data, tab = 0) {
      this.$emit('open-modal', { stage, data, tab })
    }
  }
}
</script>
