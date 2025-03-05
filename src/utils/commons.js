export default class Commons {
  static referencesWithNames (data, references) {
    let authorsList = []
    for (const i in data) {
      for (const r of references) {
        if (r.id === data[i]) {
          authorsList.push(this.getAuthorsFormat(r.authors, r.publication_year))
        }
      }
    }
    authorsList.sort()
    let authors = ''
    for (let x in authorsList) {
      authors = authors + authorsList[x] + '; '
    }
    return authors
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

  static theLicense (license = '') {
    const globalLicenses = [
      {
        value: 'CC-BY-NC-ND',
        text: 'CC BY-NC-ND: This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, for noncommercial purposes only, and only so long as attribution is given to the creator.',
        image: 'by-nc-nd-88x31.png'
      },
      { value: 'CC-BY-ND', text: 'CC BY-ND: This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, and only so long as attribution is given to the creator. The license allows for commercial use.', image: 'by-nd-88x31.png' },
      { value: 'CC-BY-NC-SA', text: 'CC BY-NC-SA: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.', image: 'by-nc-sa-88x31.png' },
      { value: 'CC-BY-NC', text: 'CC BY-NC: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator.', image: 'by-nc-88x31.png' },
      { value: 'CC-BY-SA', text: 'CC BY-SA: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.', image: 'by-sa-88x31.png' },
      { value: 'CC-BY', text: 'CC BY: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use.', image: 'by-88x31.png' }
    ]

    if (license.length) {
      for (const lic of globalLicenses) {
        if (lic.value === license) {
          this.licenseUrl = require(`../assets/${lic.image}`)
          return lic.text
        }
      }
    } else {
      this.licenseUrl = require(`../assets/${globalLicenses[0].image}`)
      return globalLicenses[0].text
    }
  }
}
