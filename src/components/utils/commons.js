export const displayExplanation = (type, option, explanation) => {
  if (type === '') {
    return ''
  }
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

function displaySelectedOption (option) {
  const selectOptions = [
    { value: 0, text: 'No/Very minor concerns' },
    { value: 1, text: 'Minor concerns' },
    { value: 2, text: 'Moderate concerns' },
    { value: 3, text: 'Serious concerns' },
    { value: null, text: 'Undefined' }
  ]
  if (option === null) {
    return ''
  } else if (option >= 0) {
    return selectOptions[option].text
  } else {
    return ''
  }
}

export const generateCerqualExplanation = (data) => {
  if (data.cerqual.explanation === '') {
    if (data.methodological_limitations.option &&
    data.coherence.option &&
    data.adequacy.option &&
    data.relevance.option) {
      return displaySelectedOption(data.methodological_limitations.option) + ' regarding methodological limitations, ' + displaySelectedOption(data.coherence.option) + ' regarding coherence, ' + displaySelectedOption(data.adequacy.option) + ' regarding adequacy, and ' + displaySelectedOption(data.relevance.option) + ' regarding relevance'
    } else {
      return ''
    }
  } else {
    return data.cerqual.explanation
  }
}
