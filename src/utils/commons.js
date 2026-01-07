import { i18n } from '@/plugins/i18n'

export default class Commons {
  static referencesWithNames (data, references) {
    if (!data) return ''
    let authorsList = []
    for (const id of data) {
      for (const r of references) {
        if (r.id === id) {
          authorsList.push(this.getAuthorsFormat(r.authors, r.publication_year))
        }
      }
    }
    authorsList.sort()
    let authors = ''
    for (const author of authorsList) {
      authors += author + '; '
    }
    return authors
  }

  static parseReference (reference, onlyAuthors = false, hasSemicolon = true) {
    let result = ''
    const semicolon = hasSemicolon ? '; ' : ''
    if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
      if (reference.authors.length) {
        if (reference.authors.length === 1) {
          result = reference.authors[0].split(',')[0] + ' ' + reference.publication_year + semicolon
        } else if (reference.authors.length === 2) {
          result = reference.authors[0].split(',')[0] + ' ' + i18n.t('commons.and') + ' ' + reference.authors[1].split(',')[0] + ' ' + reference.publication_year + semicolon
        } else {
          result = reference.authors[0].split(',')[0] + ' ' + i18n.t('commons.et_al') + ' ' + reference.publication_year + semicolon
        }
        if (!onlyAuthors) {
          result = result + reference.title
        }
      } else {
        return i18n.t('commons.author_not_found')
      }
    }
    return result
  }

  static getAuthorsFormat (authors = [], pubYear = '') {
    if (authors.length) {
      const nroAuthors = authors.length
      if (nroAuthors === 1) {
        return authors[0].split(',')[0] + ' ' + pubYear
      } else if (nroAuthors === 2) {
        return authors[0].split(',')[0] + ' ' + i18n.t('commons.and') + ' ' + authors[1].split(',')[0] + ' ' + pubYear
      } else {
        return authors[0].split(',')[0] + ' ' + i18n.t('commons.et_al') + ' ' + pubYear
      }
    } else {
      return i18n.t('commons.author_not_found')
    }
  }

  static displaySelectedOption (option, type = '') {
    if (option === null) {
      return ''
    } else if (option >= 0 || option === 'hc' || option === 'mc' || option === 'lc' || option === 'vc') {
      if (type === 'cerqual') {
        return i18n.t(`commons.confidence.${option}`)
      } else {
        return i18n.t(`commons.concerns.${option}`)
      }
    } else {
      return ''
    }
  }

  static printErrors (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // console.log(error.response.data)
      // console.log(error.response.status)
      // console.log(error.response.headers)
      return {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers
      }
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      // console.log(error.request)
      return { request: error.request }
    } else {
      // Something happened in setting up the request that triggered an Error
      // console.log('Error', error.message)
      return { message: error.message }
    }
    // console.log(error.config)
    // return { config: error.config }
  }

  static theLicense (license = '') {
    if (license.length) {
      this.licenseUrl = require(`../assets/${license.toLowerCase().replace('cc-', '') + '-88x31.png'}`)
      return i18n.t(`commons.licenses.${license}`)
    } else {
      this.licenseUrl = require(`../assets/by-nc-nd-88x31.png`)
      return i18n.t(`commons.licenses.CC-BY-NC-ND`)
    }
  }
}
