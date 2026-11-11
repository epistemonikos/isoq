import Api from '@/utils/Api'
import { publicationImpact } from '@/utils/publishRules'
import { writeErrorMessageKey } from '@/utils/writeErrors'

// Fresh project and lists, read at the moment of an action that may change what is
// published. `networkOnly`: a cached answer would be exactly the stale picture this
// exists to avoid. `Api.get` resolves with the whole response, so the bodies are unwrapped
// here. Rejects on failure: callers notify with writeErrorMessageKey and stop.
export async function fetchPublicationState (projectId) {
  const [projectRes, listsRes] = await Promise.all([
    Api.get('/isoqf_projects/' + projectId, {}, { networkOnly: true }),
    Api.get('/isoqf_lists', { project_id: projectId }, { networkOnly: true })
  ])
  return { project: projectRes.data, lists: listsRes.data }
}

// What changing one list does to the published project, judged against a fresh read.
// `changeFn` gets a copy of the fresh list and returns it as it would end up, or null when
// the list is deleted. Resolves 'none' | 'finding_hidden' | 'project_private'.
export async function impactOfListChange (projectId, listId, changeFn) {
  const { project, lists } = await fetchPublicationState(projectId)
  const current = (Array.isArray(lists) ? lists : []).find(l => l && l.id === listId)
  const changed = current ? changeFn(JSON.parse(JSON.stringify(current))) : null
  return publicationImpact(project, lists, listId, changed)
}

// The notice for a failed publication-state read. `writeErrorMessageKey` returns null for an
// offline error (the offline bar speaks for writes), but these reads are `networkOnly` and
// stop the action, so the person must be told why nothing happened.
export function publicationCheckErrorKey (error, fallbackKey = 'notifications.save_error') {
  if (error && error.isOfflineError) return 'publish.check_needs_connection'
  return writeErrorMessageKey(error, fallbackKey)
}
