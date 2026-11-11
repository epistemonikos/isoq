import { STEP_ONE_PRESENCE, othersOnStepOne } from '@/utils/stepOnePresence'

// #399: who else is on Step 1. Presence, not a lock: Step 1 takes no lock by decision.
describe('othersOnStepOne', () => {
  const p = (user_id, user_name, finding_id = STEP_ONE_PRESENCE) => ({ finding_id, user_id, user_name })

  it('names the other people on Step 1, never oneself', () => {
    expect(othersOnStepOne([p('me', 'Me'), p('u-ana', 'Ana Soto')], 'me')).toEqual(['Ana Soto'])
  })

  it('ignores presence on findings (the worksheet)', () => {
    expect(othersOnStepOne([p('u-ana', 'Ana Soto', 'finding1')], 'me')).toEqual([])
  })

  it('names each person once, however many tabs they have open', () => {
    expect(othersOnStepOne([p('u-ana', 'Ana Soto'), p('u-ana', 'Ana Soto')], 'me')).toEqual(['Ana Soto'])
  })

  it('copes with no presence at all', () => {
    expect(othersOnStepOne(undefined, 'me')).toEqual([])
  })
})
