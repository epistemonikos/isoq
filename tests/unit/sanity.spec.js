// Simple sanity test to verify Jest is working
describe('Jest Configuration', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true)
  })

  it('should have access to Vue test utils', () => {
    const { mount } = require('@vue/test-utils')
    expect(mount).toBeDefined()
  })
})
