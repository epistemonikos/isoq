import en from '@/lang/en.json'
import es from '@/lang/es.json'
import pt from '@/lang/pt.json'

// Wording asked for by product (#400, #401, #402): the message says it goes away
// by itself, which is true for all three (they poll and clear once the lock is free).
describe('lock messages', () => {
  it('uses the agreed English wording', () => {
    expect(en.lock.properties_locked_by).toBe("{user} is editing this project's properties or publication settings. When they have finished editing, this message will automatically disappear.")
    expect(en.lock.categories_locked_by).toBe('{user} is editing the review finding groups. When they have finished editing, this message will automatically disappear.')
    expect(en.lock.editing_references).toBe("{user} is editing this review finding's references. When they finish, this message will automatically disappear and you will be able to edit.")
    expect(en.lock.editing_references_readonly).toBe("{user} is editing this review finding's references. When they finish, this message will automatically disappear.")
  })

  it.each([['es', es], ['pt', pt]])('has every key in %s, naming the user', (_, lang) => {
    for (const key of ['properties_locked_by', 'categories_locked_by', 'editing_references', 'editing_references_readonly']) {
      expect(lang.lock[key]).toEqual(expect.stringContaining('{user}'))
      expect(lang.lock[key]).not.toBe(en.lock[key])
    }
  })
})
