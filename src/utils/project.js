import axios from 'axios'

function validEmail (email) {
  var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)
}
function validUrl (url) {
  var re = /^(http|https):\/\/[^ "]+$/
  return re.test(url)
}
async function canPublish (project) {
  return axios.get('/api/project/can_publish', { params: project })
}

export default class Project {
  static validEmail = validEmail
  static validUrl = validUrl
  static canPublish = canPublish

  static async validations (data) {
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
          published_status: null,
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
      if (data.name === '') {
        responses.state.name = false
        cnt++
      }
      // check if project has authors
      if (data.authors === '') {
        responses.state.authors = false
        cnt++
      }
      // check if project has author
      if (data.author === '') {
        responses.state.author = false
        cnt++
      }
      // check if project has a valid author email address
      if (data.author_email === '' || !Project.validEmail(data.author_email)) {
        responses.state.author_email = false
        cnt++
      }
      // check if project has a review question
      if (data.review_question === '') {
        responses.state.review_question = false
        cnt++
      }
      // check if published status is true
      if (!data.published_status) {
        responses.state.published_status = false
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

      const canPublish = await Project.canPublish(data)
      if (canPublish.data.status === false) {
        responses.state.can_publish = false
        cnt++
      }

      if (cnt > 0) {
        return { data: { status: false, ...responses } }
      } else {
        return { data: { status: true } }
      }
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
      return axios.post('/api/isoqf_projects', params)
    } else {
      return { data: { status: false, message: 'When you create a project you couldnt publish without complete at least one finding', ...validation.data } }
    }
  }

  static async update (formData) {
    const params = JSON.parse(JSON.stringify(formData))
    const validation = await Project.validations(params)

    if (validation.data.status) {
      const data = await axios.patch('/api/publish', { params })
      return {data: {status: true, ...data}}
    } else {
      return validation
    }
  }
}
