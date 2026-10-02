import { shallowMount } from '@vue/test-utils'
import camelotCircleMixin from '@/mixins/camelotCircleMixin'

// The mixin reads `this.responses`, so it needs a host component to live in.
const Host = {
  mixins: [camelotCircleMixin],
  template: '<div></div>',
  data () {
    return {
      responses: [
        { text: 'No or very minor concerns', value: 'A', color: '#1065AB' },
        { text: 'Minor concerns', value: 'B', color: '#8EC4DE' },
        { text: 'Serious concerns', value: 'D', color: '#B31529' },
        { text: 'Unclear', value: 'E', color: '#B3B3B3' }
      ]
    }
  }
}

const itemWith = (option, text) => ({
  stages: [{ options: [{ option, text }] }]
})

describe('camelotCircleMixin', () => {
  let vm

  beforeEach(() => {
    vm = shallowMount(Host).vm
  })

  describe('getCircleClass', () => {
    it('marks an assessment without an explanation as incomplete', () => {
      expect(vm.getCircleClass(0, 0, itemWith('A', ''))).toBe('circle-incomplete')
    })

    it('does not accept whitespace as an explanation', () => {
      expect(vm.getCircleClass(0, 0, itemWith('A', '   \n'))).toBe('circle-incomplete')
    })

    it('keeps an assessment with an explanation filled', () => {
      expect(vm.getCircleClass(0, 0, itemWith('A', 'Because of X'))).toBe('circle-filled')
    })

    it('keeps an unassessed cell not-completed even without an explanation', () => {
      expect(vm.getCircleClass(0, 0, itemWith(null, ''))).toBe('circle-not-completed')
    })

    it('treats a missing cell as not-completed', () => {
      expect(vm.getCircleClass(0, 3, itemWith('A', ''))).toBe('circle-not-completed')
    })
  })

  describe('getCircleStyle', () => {
    // The colour is the first thing the grid communicates, so an incomplete cell
    // keeps its fill and gains a dashed ring plus a legible exclamation mark.
    it('keeps the fill and adds a dashed ring when the explanation is missing', () => {
      expect(vm.getCircleStyle(0, 0, itemWith('A', ''))).toEqual({
        backgroundColor: '#1065AB',
        borderColor: '#FFFFFF',
        color: '#FFFFFF'
      })
    })

    it('darkens the exclamation mark over a light assessment colour', () => {
      expect(vm.getCircleStyle(0, 0, itemWith('B', ''))).toEqual({
        backgroundColor: '#8EC4DE',
        borderColor: '#212529',
        color: '#212529'
      })
    })

    it('lightens it over a dark assessment colour', () => {
      expect(vm.getCircleStyle(0, 0, itemWith('D', ''))).toEqual({
        backgroundColor: '#B31529',
        borderColor: '#FFFFFF',
        color: '#FFFFFF'
      })
    })

    it('fills an assessment that has an explanation', () => {
      expect(vm.getCircleStyle(0, 0, itemWith('A', 'Because of X'))).toEqual({
        backgroundColor: '#1065AB'
      })
    })

    it('falls back to grey when the option has no matching response', () => {
      expect(vm.getCircleStyle(0, 0, itemWith('Z', ''))).toEqual({
        backgroundColor: '#B3B3B3',
        borderColor: '#212529',
        color: '#212529'
      })
    })
  })

  describe('isMissingExplanation', () => {
    it('is true only for an assessment lacking an explanation', () => {
      expect(vm.isMissingExplanation(0, 0, itemWith('A', ''))).toBe(true)
      expect(vm.isMissingExplanation(0, 0, itemWith('A', 'why'))).toBe(false)
      expect(vm.isMissingExplanation(0, 0, itemWith(null, ''))).toBe(false)
    })
  })
})
