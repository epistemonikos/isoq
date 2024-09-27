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
}
