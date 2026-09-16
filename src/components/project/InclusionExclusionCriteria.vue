<template>
  <div>
    <h4 v-html="$t('inclusion.step_title')"></h4>
    <b-container fluid>
      <b-row>
        <b-col
          cols="6"
          class="pl-0">
          <criteria
            v-if="ui.project.show_criteria"
            :label="$t('inclusion.inclusion_criteria')"
            :description="$t('inclusion.inclusion_placeholder')"
            :canEdit="canEdit"
            criteria="inclusion"
            :dataTxt="project.inclusion"
            :refLocks="activeRefLocks"
            @lock-denied="fetchAndUpdateRefLocks"
            @criteria-saved="$emit('criteria-saved', $event)">
          </criteria>
        </b-col>
        <b-col
          cols="6"
          class="pr-0">
          <criteria
            v-if="ui.project.show_criteria"
            :label="$t('inclusion.exclusion_criteria')"
            :description="$t('inclusion.exclusion_placeholder')"
            :canEdit="canEdit"
            criteria="exclusion"
            :dataTxt="project.exclusion"
            :refLocks="activeRefLocks"
            @lock-denied="fetchAndUpdateRefLocks"
            @criteria-saved="$emit('criteria-saved', $event)">
          </criteria>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import LockService from '@/services/lockService'

// Mismo tick que usan los Pasos 3 y 4 para su tabla de locks. Es el techo de cuánto
// puede tardar una caja en verse gris del otro lado; el rechazo real llega igual al
// enfocarla, así que este sondeo es para avisar antes, no para autorizar.
const REF_LOCKS_POLL_INTERVAL = 15000

export default {
  name: 'InclusionExclusionCriteria',
  props: {
    canEdit: {
      type: Boolean,
      required: true
    },
    project: {
      type: Object,
      required: true
    },
    ui: {
      type: Object,
      required: true
    }
  },
  components: {
    criteria: () => import('@/components/Criteria.vue')
  },
  data: function () {
    return {
      activeRefLocks: []
    }
  },
  mounted: function () {
    this.startRefLocksPolling()
    window.addEventListener('ref-locks-changed', this.fetchAndUpdateRefLocks)
  },
  beforeDestroy: function () {
    this.stopRefLocksPolling()
    window.removeEventListener('ref-locks-changed', this.fetchAndUpdateRefLocks)
  },
  methods: {
    fetchAndUpdateRefLocks: async function () {
      this.activeRefLocks = await LockService.fetchRefLocks(this.$route.params.id)
    },
    startRefLocksPolling: function () {
      this.fetchAndUpdateRefLocks()
      this.refLocksTimer = setInterval(this.fetchAndUpdateRefLocks, REF_LOCKS_POLL_INTERVAL)
    },
    stopRefLocksPolling: function () {
      if (this.refLocksTimer) clearInterval(this.refLocksTimer)
      this.refLocksTimer = null
    }
  }
}
</script>
