import Api from './Api'
import { R1_FIELDS, effectiveLicense, hasMinLetters, isFindingComplete, isProjectPublic, projectMissingFields, validEmail, validUrlOrDoi } from './publishRules'
import { needsPersonalDataConfirmation, PERSONAL_DATA_CONFIRMED, PERSONAL_DATA_CONFIRMATION_REASON } from './personalDataConfirmation'

const CAN_PUBLISH_FIELDS = [...R1_FIELDS, 'published_status', 'license_type', 'public_type']

// The server reads the form values from the body (they may not be saved yet) and ignores
// anything client-owned. A body, not a query: the authors' contact email must stay out of
// access logs and Sentry breadcrumbs. Never queued: a stale check must not replay later.
async function canPublish (project) {
  const body = { id: project.id }
  for (const key of CAN_PUBLISH_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(project, key)) body[key] = project[key]
  }
  if (project[PERSONAL_DATA_CONFIRMED] !== undefined) body[PERSONAL_DATA_CONFIRMED] = project[PERSONAL_DATA_CONFIRMED]
  return Api.post('/api/project/can_publish', body, { noQueue: true })
}

// The server refuses top-level keys with these characters.
function withoutForbiddenKeys (params) {
  for (const key of Object.keys(params)) {
    if (/[.#$]/.test(key)) delete params[key]
  }
  return params
}

export default class Project {
  static validEmail = validEmail
  static validUrl = validUrlOrDoi
  static canPublish = canPublish

  // How many findings of the project would stay out of the database for being incomplete.
  // A failing request rejects: the caller shows it and does not publish.
  static async incompleteFindingsCount (projectId) {
    const response = await Api.get('/isoqf_lists', { project_id: projectId })
    const lists = Array.isArray(response.data) ? response.data : []
    return lists.filter(list => !isFindingComplete(list)).length
  }

  // Megan's notice (#169): only complete findings are visible once published. Resolves true
  // when there is nothing to warn about or the person accepts; false when they cancel.
  static async confirmIncompleteFindings (vm, projectId) {
    if (await Project.incompleteFindingsCount(projectId) === 0) return true
    return vm.$bvModal.msgBoxConfirm(vm.$t('publish.only_complete_findings_visible'), {
      title: vm.$t('project.warning'),
      okTitle: vm.$t('common.continue'),
      cancelTitle: vm.$t('common.cancel')
    })
  }

  static async validations (data) {
    const state = {
      id: null,
      name: null,
      authors: null,
      author: null,
      author_email: null,
      review_question: null,
      url_doi: null,
      complete_by_author: null,
      lists_authors: null,
      license: null,
      no_personal_data_confirmed: null
    }
    const fail = (message) => ({ data: { status: false, message, state } })
    const markMissing = (fields) => {
      for (const field of fields) state[field === 'license_type' ? 'license' : field] = false
    }

    if (!isProjectPublic(data)) {
      if (!hasMinLetters(data.name, 1)) {
        state.name = false
        return fail('project.notifications.required_fields_error')
      }
      return { data: { status: true } }
    }

    const missing = projectMissingFields(data)
    markMissing(missing)
    let failed = missing.length > 0
    // PATCH /api/publish demands it too (400).
    if (needsPersonalDataConfirmation(data)) {
      state.no_personal_data_confirmed = false
      failed = true
    }
    if (data.id === '' || data.id === null || data.id === undefined) {
      state.id = false
      failed = true
    }
    if (failed) return fail('project.notifications.publish_missing_fields')

    // A failing request rejects: the caller shows it.
    const response = await Project.canPublish(data)
    const answer = response.data
    if (answer.status === false) {
      if (answer.reason === PERSONAL_DATA_CONFIRMATION_REASON) {
        state.no_personal_data_confirmed = false
        return fail('publish.confirm_no_personal_data_required')
      }
      if (Array.isArray(answer.missing_fields) && answer.missing_fields.length > 0) {
        markMissing(answer.missing_fields)
        return fail('project.notifications.publish_missing_fields')
      }
      state.can_publish = false
      return fail('project.validation.publish_requirement')
    }
    return { data: { status: true } }
  }

  static async create (formData) {
    const data = JSON.parse(JSON.stringify(formData))
    let params = {}
    for (let key of Object.keys(data)) {
      params[key] = data[key]
    }
    params.private = true
    params.is_public = false
    if (params.public_type !== 'private') {
      params.private = false
      params.is_public = true
    }
    delete params.id

    const validation = await Project.validations(params)
    if (validation.data.status) {
      const creationDate = Date.now()
      params.created_at = creationDate
      params.last_update = creationDate
      return Api.post('/isoqf_projects', params)
    } else {
      return { data: { status: false, message: 'When you create a project you couldnt publish without complete at least one finding', ...validation.data } }
    }
  }

  static async update (formData) {
    const params = withoutForbiddenKeys(JSON.parse(JSON.stringify(formData)))
    const validation = await Project.validations(params)

    if (validation.data.status) {
      params.private = true
      params.is_public = false
      if (params.public_type !== 'private') {
        params.private = false
        params.is_public = true
        params.license_type = effectiveLicense(params.license_type)
      }
      const data = await Api.patch('/api/publish', { params })
      return {data: {status: true, ...data}}
    } else {
      return validation
    }
  }
}
