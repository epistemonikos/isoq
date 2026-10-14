import { isCamelotEnabled } from '@/constants/camelot'

// tests/unit/setup.js sets ENABLE_CAMELOT to 'on' for the whole suite: save and restore it, or the
// first case that turns it off also turns it off for the specs that run later in the same worker.
describe('isCamelotEnabled', () => {
  const originalFlag = process.env.ENABLE_CAMELOT

  afterEach(() => {
    process.env.ENABLE_CAMELOT = originalFlag
  })

  it('is off when the flag is not defined', () => {
    // A build always defines it (default in config/prod.env.js). Missing = the harmless mode:
    // creating CAMELOT projects is not offered, and existing ones keep working.
    delete process.env.ENABLE_CAMELOT
    expect(isCamelotEnabled()).toBe(false)
  })

  it.each(['on', 'true'])('is on with %p', (value) => {
    process.env.ENABLE_CAMELOT = value
    expect(isCamelotEnabled()).toBe(true)
  })

  it.each(['off', 'false', '', 'ON', 'True', '1'])('is off with %p', (value) => {
    process.env.ENABLE_CAMELOT = value
    expect(isCamelotEnabled()).toBe(false)
  })
})
