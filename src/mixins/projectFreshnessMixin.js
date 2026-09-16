import axios from 'axios'
import { store } from '@/store'
import Api from '@/utils/Api'

/**
 * Detects that somebody else changed something in this project, so a view can reload
 * without the user having to refresh the page.
 *
 * The signal is `isoqf_projects.last_update`: the backend stamps it (server clock, epoch
 * ms) on every successful write to the project or any of its children — including the
 * granular per-item and per-section endpoints. One cheap read answers "did anything
 * change here?", which is all a table needs to know.
 *
 * The host component provides the two halves the mixin cannot know:
 *   applyProjectRefresh()  — what to reload (getCharacteristics, getAssessments, …)
 *   hasOpenEditor()        — whether a reload right now would throw away a draft
 *
 * Deliberately independent of ENABLE_CONCURRENCY_CONTROL: seeing other people's changes
 * is useful whether or not locking is on.
 */
export default {
  data () {
    return {
      // Last timestamp we know about. Null until the first read, which only takes the
      // reference — the view was just loaded, so there is nothing to catch up with.
      knownLastUpdate: null,
      pendingRefresh: false
    }
  },
  methods: {
    async checkProjectFreshness () {
      const projectId = this.$route && this.$route.params ? this.$route.params.id : null
      if (!projectId) return
      // Offline the answer would be stale by definition, and the queue is holding our
      // own writes anyway.
      if (!store.state.isOnline) return

      let lastUpdate = null
      try {
        // Straight to the network on purpose: Api.get caches /isoqf_projects/<id> in
        // IndexedDB, and a cached answer can never reveal somebody else's change.
        const response = await axios.get(`/api/isoqf_projects/${projectId}`, {
          headers: Api.getHeaders()
        })
        const project = Array.isArray(response.data) ? response.data[0] : response.data
        lastUpdate = project ? project.last_update : null
      } catch (e) {
        // A failed check is not an error worth surfacing: the next tick tries again.
        return
      }
      if (!lastUpdate) return

      if (this.knownLastUpdate === null) {
        this.knownLastUpdate = lastUpdate
        return
      }
      if (lastUpdate === this.knownLastUpdate) return
      this.knownLastUpdate = lastUpdate

      // Repainting a table under somebody who is typing would discard their draft, so
      // the reload waits for the editor to close (see flushPendingRefresh).
      if (typeof this.hasOpenEditor === 'function' && this.hasOpenEditor()) {
        this.pendingRefresh = true
        return
      }
      this.applyProjectRefresh()
    },
    /** Applies a reload that was held back while an editor was open. */
    flushPendingRefresh () {
      if (!this.pendingRefresh) return
      this.pendingRefresh = false
      this.applyProjectRefresh()
    }
  }
}
