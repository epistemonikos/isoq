import axios from 'axios'
import Commons from './commons.js'
async function canPublish(project) {
  return axios.get('/api/project/can_publish', { params: project })
}

export default class Project {
  static validEmail = Commons.validEmail
  static validUrl = Commons.validUrl
  static canPublish = canPublish

  static async validations(data) {
    if (data.public_type !== 'private') {
      let cnt = 0
      let responses = {
        state: {
          id: null,
          name: null,
          authors: null,
          author: null,
          author_email: null,
          review_question: null,
          url_doi: null,
          complete_by_author: null,
          lists_authors: null,
          license: null
        }
      }
      // check if project has an id
      if (data.id === '' || data.id === null || data.id === undefined || Object.prototype.hasOwnProperty.call(data, 'id') === false) {
        responses.state.id = false
        cnt++
      }
      // check if project has a name with at least 3 characters
      if (data.name === '' || data.name === null || data.name === undefined || data.name.trim().length < 3) {
        responses.state.name = false
        cnt++
      }
      // check if project has authors
      if (data.authors === '' || data.authors === null || data.authors === undefined || data.authors.trim() === '') {
        responses.state.authors = false
        cnt++
      }
      // check if project has author with at least 3 characters
      if (data.author === '' || data.author === null || data.author === undefined || data.author.trim().length < 3) {
        responses.state.author = false
        cnt++
      }
      // check if project has a valid author email address
      if (data.author_email === '' || data.author_email === null || data.author_email === undefined || !Project.validEmail(data.author_email)) {
        responses.state.author_email = false
        cnt++
      }
      // check if project has a review question with at least 3 characters
      if (data.review_question === '' || data.review_question === null || data.review_question === undefined || data.review_question.trim().length < 3) {
        responses.state.review_question = false
        cnt++
      }
      // check project url or doi
      if (data.published_status && (data.url_doi === '' || data.url_doi === null || !Project.validUrl(data.url_doi))) {
        responses.state.url_doi = false
        cnt++
      }
      // check if project has a list of authors
      if (!data.complete_by_author && (data.lists_authors === '' || data.lists_authors === null)) {
        responses.state.lists_authors = false
        cnt++
      }
      // check if project has a license
      if (data.license_type === '' || data.license_type === null || data.license_type === undefined) {
        responses.state.license = false
        cnt++
      }

      // const canPublish = await Project.canPublish(data)
      // if (canPublish.data.status === false) {
      //   responses.message = canPublish.data.message
      //   responses.state.can_publish = false
      //   cnt++
      // }

      if (cnt > 0) {
        return { data: { status: false, message: 'Your request to publish to the iSoQ database has been denied because information is missing. Please complete the fields in red below, or select “Private” under “Visibility on the iSoQ database” to continue.', ...responses } }
      } else {
        const canPublish = await Project.canPublish(data)
        if (canPublish.data.status === false) {
          responses.message = canPublish.data.message
          responses.state.can_publish = false
          return { data: { status: false, ...responses } }
        }
        return { data: { status: true } }
      }
    }
    return { data: { status: true } }
  }

  static async create(formData) {
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
      return axios.post('/api/isoqf_projects', params)
    } else {
      return { data: { status: false, message: 'When you create a project you couldnt publish without complete at least one finding', ...validation.data } }
    }
  }

  static async update(formData) {
    const params = JSON.parse(JSON.stringify(formData))
    const validation = await Project.validations(params)

    if (validation.data.status) {
      params.private = true
      params.is_public = false
      if (params.public_type !== 'private') {
        params.private = false
        params.is_public = true
      }
      params.last_update = Date.now()
      const data = await axios.patch('/api/publish', { params })
      return { data: { status: true, ...data } }
    } else {
      return validation
    }
  }
}
