import { purgeConflictDrafts } from '@/utils/Api'

// #404: every granular lock 409 used to leave the typed text in
// localStorage['conflict_ref_<key>'] and nothing ever read it, so the drafts piled up
// in the browser. They are no longer written; the ones already there are swept once.
describe('purgeConflictDrafts', () => {
  beforeEach(() => localStorage.clear())

  it('removes the leftover conflict drafts and nothing else', () => {
    localStorage.setItem('conflict_ref_ed1::ed::ref1', '{"failedData":{"column_0":"typed"}}')
    localStorage.setItem('conflict_ref_R1::s0::o2', '{}')
    localStorage.setItem('l_s', 'token')
    purgeConflictDrafts()
    expect(Object.keys(localStorage)).toEqual(['l_s'])
  })

  it('does not throw when storage is unavailable', () => {
    const spy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denied') })
    localStorage.setItem('conflict_ref_x', '{}')
    expect(() => purgeConflictDrafts()).not.toThrow()
    spy.mockRestore()
  })
})
