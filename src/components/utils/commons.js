export const displayExplanation = (type, option, explanation) => {
  if (type === '') {
    return ''
  }
  // if (option === '0') {
  //   return explanation
  // }
  if (explanation === '') {
    return ''
  }
  let options = {}
  switch (type) {
    case 'methodological-limitations':
      options = {
        '0': 'No/very minor concerns regarding methodological limitations because',
        '1': 'Minor concerns regarding methodological limitations because',
        '2': 'Moderate concerns regarding methodological limitations because',
        '3': 'Serious concerns regarding methodological limitations because'
      }
      return `${options[option]} ${explanation}`
    case 'coherence':
      options = {
        '0': 'No/very minor concerns regarding coherence because',
        '1': 'Minor concerns regarding coherence because',
        '2': 'Moderate concerns regarding coherence because',
        '3': 'Serious concerns regarding coherence because'
      }
      return `${options[option]} ${explanation}`
    case 'adequacy':
      options = {
        '0': 'No/very minor concerns regarding adequacy because',
        '1': 'Minor concerns regarding adequacy because',
        '2': 'Moderate concerns regarding adequacy because',
        '3': 'Serious concerns regarding adequacy because'
      }
      return `${options[option]} ${explanation}`
    case 'relevance':
      options = {
        '0': 'No/very minor concerns regarding relevance because',
        '1': 'Minor concerns regarding relevance because',
        '2': 'Moderate concerns regarding relevance because',
        '3': 'Serious concerns regarding relevance because'
      }
      return `${options[option]} ${explanation}`
    default:
      return ''
  }
}
