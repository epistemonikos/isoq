<template>
  <b-table :fields="fields" :items="items" bordered responsive class="camelot-table" thead-tr-class="header-second-row">
    <template v-slot:thead-top>
      <tr class="header-top-row">
        <th class="border-bottom-0">
          {{ $t('camelot.step_four.table_headers.authors') }}
        </th>
        <th colspan="5" class="text-center group-header border-left">
          {{ $t('camelot.step_four.tabs.fit_meta_design') }}
        </th>
        <th colspan="5" class="text-center group-header border-left">
          {{ $t('camelot.step_four.tabs.fit_meta_conduct') }}
        </th>
        <th colspan="2" class="text-center group-header border-left">
          {{ $t('camelot.step_four.tabs.fit_design_conduct') }}
        </th>
        <th colspan="2" class="text-center group-header border-left header-overall-group">
          {{ $t('camelot.step_four.tabs.overall') }}
        </th>
      </tr>
    </template>

    <template v-slot:cell(authors)="data">
      <span class="font-weight-bold" style="white-space: nowrap">{{ data.item.authors }}</span>
    </template>

    <!-- FA 1-4 + Edit -->
    <template v-slot:cell(fa1)="data">
      <div class="d-flex justify-content-center">
        <div style="cursor: pointer" :class="['assessment-circle', getCircleClass(0, 0, data.item)]"
          :style="getCircleStyle(0, 0, data.item)" @click="openModal(0, data, 0, 'FA1')"></div>
      </div>
    </template>
    <template v-slot:cell(fa2)="data">
      <div class="d-flex justify-content-center">
        <div style="cursor: pointer" :class="['assessment-circle', getCircleClass(0, 1, data.item)]"
          :style="getCircleStyle(0, 1, data.item)" @click="openModal(0, data, 1, 'FA2')"></div>
      </div>
    </template>
    <template v-slot:cell(fa3)="data">
      <div class="d-flex justify-content-center">
        <div style="cursor: pointer" :class="['assessment-circle', getCircleClass(0, 2, data.item)]"
          :style="getCircleStyle(0, 2, data.item)" @click="openModal(0, data, 2, 'FA3')"></div>
      </div>
    </template>
    <template v-slot:cell(fa4)="data">
      <div class="d-flex justify-content-center">
        <div style="cursor: pointer" :class="['assessment-circle', getCircleClass(0, 3, data.item)]"
          :style="getCircleStyle(0, 3, data.item)" @click="openModal(0, data, 3, 'FA4')"></div>
      </div>
    </template>
    <template v-slot:cell(edit1)="data">
      <div class="d-flex justify-content-center align-items-center">
        <b-button v-if="canEdit" size="sm" variant="outline-primary" @click="openModal(0, data)" class="edit-btn"
          :disabled="isRefLocked(data.item.ref_id)" v-b-tooltip.hover :title="refLockedByName(data.item.ref_id)">
          {{ $t('common.edit') }}
          <font-awesome-icon v-if="isRefLocked(data.item.ref_id)" icon="user" class="ml-1" />
          <font-awesome-icon v-else icon="edit" class="ml-1" />
        </b-button>
        <font-awesome-icon v-if="isGroupComplete(0, 4, data.item)" icon="check" class="ml-2 text-success" />
      </div>
    </template>

    <!-- FA 5-8 + Edit -->
    <template v-slot:cell(fa5)="data">
      <div class="d-flex justify-content-center">
        <div style="cursor: pointer" :class="['assessment-circle', getCircleClass(1, 0, data.item)]"
          :style="getCircleStyle(1, 0, data.item)" @click="openModal(1, data, 0, 'FA5')"></div>
      </div>
    </template>
    <template v-slot:cell(fa6)="data">
      <div class="d-flex justify-content-center">
        <div style="cursor: pointer" :class="['assessment-circle', getCircleClass(1, 1, data.item)]"
          :style="getCircleStyle(1, 1, data.item)" @click="openModal(1, data, 1, 'FA6')"></div>
      </div>
    </template>
    <template v-slot:cell(fa7)="data">
      <div class="d-flex justify-content-center">
        <div style="cursor: pointer" :class="['assessment-circle', getCircleClass(1, 2, data.item)]"
          :style="getCircleStyle(1, 2, data.item)" @click="openModal(1, data, 2, 'FA7')"></div>
      </div>
    </template>
    <template v-slot:cell(fa8)="data">
      <div class="d-flex justify-content-center">
        <div style="cursor: pointer" :class="['assessment-circle', getCircleClass(1, 3, data.item)]"
          :style="getCircleStyle(1, 3, data.item)" @click="openModal(1, data, 3, 'FA8')"></div>
      </div>
    </template>
    <template v-slot:cell(edit2)="data">
      <div class="d-flex justify-content-center align-items-center">
        <b-button v-if="canEdit" size="sm" variant="outline-primary" @click="openModal(1, data)" class="edit-btn"
          :disabled="isRefLocked(data.item.ref_id)" v-b-tooltip.hover :title="refLockedByName(data.item.ref_id)">
          {{ $t('common.edit') }}
          <font-awesome-icon v-if="isRefLocked(data.item.ref_id)" icon="user" class="ml-1" />
          <font-awesome-icon v-else icon="edit" class="ml-1" />
        </b-button>
        <font-awesome-icon v-if="isGroupComplete(1, 4, data.item)" icon="check" class="ml-2 text-success" />
      </div>
    </template>

    <!-- FA 9 + Edit -->
    <template v-slot:cell(fa9)="data">
      <div class="d-flex justify-content-center">
        <div style="cursor: pointer" :class="['assessment-circle', getCircleClass(2, 0, data.item)]"
          :style="getCircleStyle(2, 0, data.item)" @click="openModal(2, data, 0, 'FA9')"></div>
      </div>
    </template>
    <template v-slot:cell(edit3)="data">
      <div class="d-flex justify-content-center align-items-center">
        <b-button v-if="canEdit" size="sm" variant="outline-primary" @click="openModal(2, data)" class="edit-btn"
          :disabled="isRefLocked(data.item.ref_id)" v-b-tooltip.hover :title="refLockedByName(data.item.ref_id)">
          {{ $t('common.edit') }}
          <font-awesome-icon v-if="isRefLocked(data.item.ref_id)" icon="user" class="ml-1" />
          <font-awesome-icon v-else icon="edit" class="ml-1" />
        </b-button>
        <font-awesome-icon v-if="isGroupComplete(2, 1, data.item)" icon="check" class="ml-2 text-success" />
      </div>
    </template>

    <!-- OA + Edit -->
    <template v-slot:cell(oa)="data">
      <div class="d-flex justify-content-center">
        <div style="cursor: pointer" :class="['assessment-circle', getCircleClass(3, 0, data.item)]"
          :style="getCircleStyle(3, 0, data.item)" @click="openModal(3, data, 0)"></div>
      </div>
    </template>
    <template v-slot:cell(edit4)="data">
      <div class="d-flex justify-content-center align-items-center">
        <b-button v-if="canEdit" size="sm" variant="outline-primary" @click="openModal(3, data)" class="edit-btn"
          :disabled="isRefLocked(data.item.ref_id)" v-b-tooltip.hover :title="refLockedByName(data.item.ref_id)">
          {{ $t('common.edit') }}
          <font-awesome-icon v-if="isRefLocked(data.item.ref_id)" icon="user" class="ml-1" />
          <font-awesome-icon v-else icon="edit" class="ml-1" />
        </b-button>
        <font-awesome-icon v-if="isGroupComplete(3, 1, data.item)" icon="check" class="ml-2 text-success" />
      </div>
    </template>
  </b-table>
</template>

<script>
import camelotCircleMixin from '@/mixins/camelotCircleMixin'

export default {
  name: 'CamelotStepFourTable',
  mixins: [camelotCircleMixin],
  props: {
    fields: { type: Array, required: true },
    items: { type: Array, required: true },
    responses: { type: Array, required: true },
    activeRefLocks: { type: Array, default: () => [] },
    canEdit: { type: Boolean, default: false }
  },
  methods: {
    isRefLocked(refId) {
      return this.activeRefLocks.some(l => l.ref_id === refId)
    },
    refLockedByName(refId) {
      const lock = this.activeRefLocks.find(l => l.ref_id === refId)
      return lock ? this.$t('lock.ref_locked_by', { user: lock.user_name }) : ''
    },
    isGroupComplete(stage, optionCount, item) {
      if (!item || !item.stages || !item.stages[stage]) return false
      const options = item.stages[stage].options
      if (!options) return false
      for (let i = 0; i < optionCount; i++) {
        if (!options[i] || options[i].option === null) return false
      }
      return true
    },
    openModal(stage, data, tab = 0, faLabel = null) {
      // Guard every edit path (the 4 edit buttons AND the FA circles funnel through
      // here): don't open a study that lacks a ref_id or is locked by another user.
      if (!Object.prototype.hasOwnProperty.call(data.item, 'ref_id') || this.isRefLocked(data.item.ref_id)) {
        return
      }
      this.$emit('open-modal', { stage, data, tab, faLabel })
    }
  }
}
</script>
