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
          result = reference.authors[0].split(',')[0] + ' & ' + reference.authors[1].split(',')[0] + ' ' + reference.publication_year + semicolon
        } else {
          result = reference.authors[0].split(',')[0] + ' et al. ' + reference.publication_year + semicolon
        }
        if (!onlyAuthors) {
          result = result + reference.title
        }
      } else {
        return 'author(s) not found'
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
        return authors[0].split(',')[0] + ' & ' + authors[1].split(',')[0] + ' ' + pubYear
      } else {
        return authors[0].split(',')[0] + ' et al. ' + ' ' + pubYear
      }
    } else {
      return 'author(s) not found'
    }
  }

  static displaySelectedOption (option, type = '') {
    const selectOptions = [
      { value: 0, text: 'No/Very minor concerns' },
      { value: 1, text: 'Minor concerns' },
      { value: 2, text: 'Moderate concerns' },
      { value: 3, text: 'Serious concerns' },
      { value: null, text: 'Undefined' }
    ]
    const cerqualConfidence = [
      { value: 'hc', text: 'High confidence' },
      { value: 'mc', text: 'Moderate confidence' },
      { value: 'lc', text: 'Low confidence' },
      { value: 'vc', text: 'Very low confidence' },
      { value: null, text: 'Undefined' }
    ]
    if (option === null) {
      return ''
    } else if (option >= 0) {
      if (type === 'cerqual') {
        return cerqualConfidence[option].text
      } else {
        return selectOptions[option].text
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
}
