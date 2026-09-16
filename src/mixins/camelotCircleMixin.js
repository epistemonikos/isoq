import { leafOf, isLeafComplete } from '@/utils/camelotAssessmentKeys'

const FALLBACK_COLOR = '#B3B3B3'
const ON_DARK = '#FFFFFF'
const ON_LIGHT = '#212529'

// WCAG relative luminance. A fixed white exclamation mark would vanish on the
// two light assessment colours (#8EC4DE, #F6A482), so the mark and the dashed
// ring pick their side from the fill they sit on.
function relativeLuminance (hex) {
  const value = String(hex).replace('#', '')
  if (value.length !== 6) return 1
  const channels = [0, 2, 4].map(i => {
    const c = parseInt(value.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastOn (backgroundHex) {
  return relativeLuminance(backgroundHex) > 0.179 ? ON_LIGHT : ON_DARK
}

export default {
  methods: {
    // The three circle states, in priority order: an unassessed cell stays
    // not-completed even without an explanation — it cannot be missing one yet.
    getCircleClass (stage, optionIndex, item) {
      const cell = this.getCircleCell(stage, optionIndex, item)
      if (!cell || cell.option === null) return 'circle-not-completed'
      return isLeafComplete(item, stage, optionIndex) ? 'circle-filled' : 'circle-incomplete'
    },
    getCircleStyle (stage, optionIndex, item) {
      const cell = this.getCircleCell(stage, optionIndex, item)
      if (!cell || cell.option === null) return {}

      const response = this.responses.find(r => r.value === cell.option)
      const color = response ? response.color : FALLBACK_COLOR

      // Missing explanation: keep the fill — the colour is what the grid reads
      // at a glance — and add a dashed ring plus a legible exclamation mark.
      if (!isLeafComplete(item, stage, optionIndex)) {
        const ink = contrastOn(color)
        return { backgroundColor: color, borderColor: ink, color: ink }
      }
      return { backgroundColor: color }
    },
    isMissingExplanation (stage, optionIndex, item) {
      const cell = this.getCircleCell(stage, optionIndex, item)
      return !!cell && cell.option !== null && !isLeafComplete(item, stage, optionIndex)
    },
    getCircleCell (stage, optionIndex, item) {
      return leafOf(item, stage, optionIndex)
    }
  }
}
