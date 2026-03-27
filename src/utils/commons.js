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
      if (typeof reference.authors === 'string') {
        return reference.authors
      }
      if (Array.isArray(reference.authors) && reference.authors.length) {
        if (reference.authors.length === 1) {
          result = reference.authors[0].split(',').map(s => s.trim()).join(' ') + ' ' + reference.publication_year + semicolon
        } else if (reference.authors.length === 2) {
          result = reference.authors[0].split(',').map(s => s.trim()).join(' ') + i18n.t('common.and') + reference.authors[1].split(',').map(s => s.trim()).join(' ') + ' ' + reference.publication_year + semicolon
        } else {
          result = reference.authors[0].split(',').map(s => s.trim()).join(' ') + i18n.t('common.et_al') + reference.publication_year + semicolon
        }
        if (!onlyAuthors) {
          result = result + reference.title
        }
      } else {
        return i18n.t('common.author_not_found')
      }
    }
    return result
  }

  static getAuthorsFormat (authors = [], pubYear = '') {
    if (typeof authors === 'string') {
      return authors
    }
    if (Array.isArray(authors) && authors.length) {
      const nroAuthors = authors.length
      if (nroAuthors === 1) {
        return authors[0].split(',').map(s => s.trim()).join(' ') + ' ' + pubYear
      } else if (nroAuthors === 2) {
        return authors[0].split(',').map(s => s.trim()).join(' ') + i18n.t('common.and') + authors[1].split(',').map(s => s.trim()).join(' ') + ' ' + pubYear
      } else {
        return authors[0].split(',').map(s => s.trim()).join(' ') + i18n.t('common.et_al') + pubYear
      }
    } else {
      return i18n.t('common.author_not_found')
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

  static deepClone (obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item))
    }

    const cloned = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }
    return cloned
  }

  static shouldTruncate (text) {
    if (!text || typeof text !== 'string') return false
    return text.split(' ').filter(word => word.length > 0).length > 10
  }

  static truncate (text) {
    if (!text || typeof text !== 'string') return ''
    return text.split(' ').filter(word => word.length > 0).slice(0, 10).join(' ')
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

  static sortFindings (findings, categories) {
    const options = Array.isArray(categories) ? categories : (categories.options || [])

    const getCategoryName = (id) => {
      const cat = options.find(c => c.id === id)
      return cat ? (cat.text || cat.name || '') : ''
    }

    return [...findings].sort((a, b) => {
      const catA = (getCategoryName(a.category) || 'zzzzzzzz').toLowerCase()
      const catB = (getCategoryName(b.category) || 'zzzzzzzz').toLowerCase()

      if (catA < catB) return -1
      if (catA > catB) return 1

      if (a.sort < b.sort) return -1
      if (a.sort > b.sort) return 1

      return 0
    }).map((item, index) => {
      return {
        ...item,
        sort: index + 1
      }
    })
  }
}
