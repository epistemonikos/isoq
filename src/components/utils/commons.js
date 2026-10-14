import { i18n } from '@/plugins/i18n'

export const displayExplanation = (type, option, explanation) => {
  if (type === '') {
    return ''
  }
  if (explanation === '') {
    return ''
  }

  switch (type) {
    case 'methodological-limitations':
      return `${i18n.t(`commons.explanation_prefix.methodological_limitations.${option}`)} ${explanation}`
    case 'coherence':
      return `${i18n.t(`commons.explanation_prefix.coherence.${option}`)} ${explanation}`
    case 'adequacy':
      return `${i18n.t(`commons.explanation_prefix.adequacy.${option}`)} ${explanation}`
    case 'relevance':
      return `${i18n.t(`commons.explanation_prefix.relevance.${option}`)} ${explanation}`
    default:
      return ''
  }
}

function displaySelectedOption (option) {
  if (option === null) {
    return ''
  } else if (option >= 0) {
    return i18n.t(`commons.concerns.${option}`)
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
      return displaySelectedOption(data.methodological_limitations.option) + i18n.t('commons.cerqual_fragments.methodological_limitations') +
             displaySelectedOption(data.coherence.option) + i18n.t('commons.cerqual_fragments.coherence') +
             displaySelectedOption(data.adequacy.option) + i18n.t('commons.cerqual_fragments.adequacy') +
             displaySelectedOption(data.relevance.option) + i18n.t('commons.cerqual_fragments.relevance')
    } else {
      return ''
    }
  } else {
    return data.cerqual.explanation
  }
}
