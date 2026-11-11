import fs from 'fs'
import path from 'path'

/**
 * Step 4: an assessment without an explanation is marked by the exclamation mark alone
 * (2026-10-21). It used to carry a dashed ring as well, which read like the dashed grey
 * circle of a cell that has not been assessed yet.
 *
 * jsdom does not load the SFC styles: this pins that no `.circle-incomplete` rule draws a
 * dashed border — the grid circle nor the two legend swatches that mirror it.
 */
const root = path.resolve(__dirname, '../../..')
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8')
const incompleteRules = source => source.match(/\.circle-incomplete\s*\{[^}]*\}/g) || []

describe('guard: a missing explanation has no dashed ring', () => {
  it.each([
    'src/components/camelot/AssessmentCircle.vue',
    'src/components/camelot/CamelotStepFourHeader.vue',
    'src/components/camelot/StepFour.vue'
  ])('%s draws no dashed .circle-incomplete', file => {
    incompleteRules(read(file)).forEach(rule => expect(rule).not.toMatch(/dashed/))
  })

  it('the not-assessed circle keeps its dashed grey ring', () => {
    expect(read('src/components/camelot/AssessmentCircle.vue'))
      .toMatch(/\.circle-not-completed\s*\{[^}]*border:\s*2px dashed #B3B3B3/)
  })
})
