export default class Commons {
  // Funciones de validación
  static validEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(email)
  }

  static validUrl(url) {
    const re = /^(http|https):\/\/[^ "]+$/
    return re.test(url)
  }

  static validateEmails(emails) {
    if (!emails.trim()) {
      return { isValid: null, error: '' }
    }

    const emailList = emails.split(',').map(email => email.trim())
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emailList.filter(email => !emailRegex.test(email))

    if (invalidEmails.length > 0) {
      return { isValid: false, error: 'Invalid email format' }
    } else {
      return { isValid: true, error: '' }
    }
  }

  static comparePassword(password, password2) {
    if (password !== password2) {
      return false
    }
    if (password === null || password2 === null) {
      return false
    }
    if (password.length < 8 || password2.length < 8) {
      return false
    }
    return true
  }

  // Funciones de ordenamiento
  static orderKeys(obj) {
    const keys = Object.keys(obj).sort(function keyOrder(k1, k2) {
      if (k1 < k2) return -1
      else if (k1 > k2) return +1
      else return 0
    })

    const after = {}
    for (let i = 0; i < keys.length; i++) {
      after[keys[i]] = obj[keys[i]]
      delete obj[keys[i]]
    }

    for (let i = 0; i < keys.length; i++) {
      obj[keys[i]] = after[keys[i]]
    }
    return obj
  }

  // Funciones de referencias
  static referencesWithNames(data, references) {
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

  static parseReference(reference, onlyAuthors = false, hasSemicolon = true) {
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

  static getAuthorsFormat(authors = [], pubYear = '') {
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

  // Funciones de opciones de selección
  static displaySelectedOption(option, type = '') {
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

  // Funciones de manejo de errores
  static printErrors(error) {
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

  // Funciones de utilidad
  static debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input
    return input.replace(/[<>]/g, '')
  }

  static formatDate(timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  static generateId() {
    return Math.random().toString(36).substr(2, 9)
  }
}
