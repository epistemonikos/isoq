import LockService, { studyLockState } from '@/services/lockService'

/**
 * Reads the ref-lock listing from the point of view of one study.
 *
 * Shared by StepFour (which owns the modal) and CamelotStepFourTable (which
 * renders the grid and disables the Edit buttons). Both used to compare
 * `lock.ref_id === refId`, which cannot see a study blocked through one of its
 * cells — the granularity endpoint D introduced.
 *
 * Requires the component to expose `activeRefLocks` ([{ ref_id, user_name }]),
 * as data or as a prop.
 */
export default {
  computed: {
    currentUserName () {
      const user = (this.$store && this.$store.state && this.$store.state.user) || {}
      return [user.first_name, user.last_name].filter(Boolean).join(' ') ||
        user.username || null
    },
    // Locks held by someone else. Filtering by our own registry as well as by
    // name covers the same person in a second tab, where the name on the lock
    // no longer identifies it as ours.
    foreignRefLocks () {
      return (this.activeRefLocks || [])
        .filter(lock => !LockService.refLocks.has(lock.ref_id))
    }
  },
  methods: {
    studyLockStateOf (refId) {
      return studyLockState(this.foreignRefLocks, refId, this.currentUserName)
    },
    // A study is off limits when someone else holds it whole (endpoint B) OR
    // holds any one of its cells (endpoint D).
    isRefLocked (refId) {
      return this.studyLockStateOf(refId).saveWholeStudyBlocked
    },
    refLockedByName (refId) {
      const state = this.studyLockStateOf(refId)
      const holder = state.wholeStudyBlockedBy ||
        (state.lockedLeaves.size ? [...state.lockedLeaves.values()][0] : null)
      return holder ? this.$t('lock.ref_locked_by', { user: holder }) : ''
    }
  }
}
