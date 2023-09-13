const parseReference = (reference, onlyAuthors = false, hasSemicolon = true) => {
  let result = ''
  const semicolon = hasSemicolon ? '; ' : ''
  const authors = reference.authors.map((author) => {
    let lastName = author.split(',')[0] // 'Hahn'
    let initials = author.split(',')[1].trim() // 'Robert A.'
    let fullName = initials.split(' ') // ['Robert', 'A.']
    const fname = `${fullName[0].charAt(0)}.` || ''
    const sname = fullName.length > 1 ? `${fullName[1].charAt(0)}.` : ''

    return `${lastName}, ${fname} ${sname}` // Hahn, R. A.
  })

  if (Object.prototype.hasOwnProperty.call(reference, 'type')) {
    switch (reference.type) {
      case 'BOOK':
        // Author, A. A. (Year of publication). Title of work: Capital letter also for subtitle. Publisher Name. DOI (if available)
        result = `${authors.join(', ')} (${reference.publication_year}). ${reference.title}. ${reference.publisher}`
        break
      case 'CHAP':
        // Author, A. A. (Year of publication). Title of work: Capital letter also for subtitle. Publisher Name. DOI (if available)
        result = `${authors.join(', ')} (${reference.publication_year}). ${reference.title} (pp. ${reference.start_page}). ${reference.publisher}`
        break
      case 'JOUR':
        if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
          if (reference.authors.length) {
            const authors = reference.authors.map((author) => author.split(',')[0])
            if (authors.length === 1) {
              result = `${authors[0]} ${reference.publication_year} ${semicolon}`
            } else if (authors.length === 2) {
              result = `${authors[0]} & ${authors[1]} ${reference.publication_year} ${semicolon}`
            } else {
              result = `${authors[0]} et al. ${reference.publication_year} ${semicolon}`
            }
            if (!onlyAuthors) {
              result = result + reference.title
            }
          } else {
            return 'author(s) not found'
          }
        }
        break
    }
    return result
  }
}

const printErrors = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data)
    console.log(error.response.status)
    console.log(error.response.headers)
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request)
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('Error', error.message)
  }
  console.log(error.config)
}

export { parseReference, printErrors }
