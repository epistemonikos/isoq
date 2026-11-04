import Api from '@/utils/Api'

// Fresh project and lists, read at the moment of an action that may change what is
// published. A cached answer would be exactly the stale picture this exists to avoid. Rejects on failure: callers notify with writeErrorMessageKey and stop.
export async function fetchPublicationState (projectId) {
  const [project, lists] = await Promise.all([
    Api.get('/isoqf_projects/' + projectId, {}, { networkOnly: true }),
    Api.get('/isoqf_lists', { project_id: projectId }, { networkOnly: true })
  ])
  return { project, lists }
}
