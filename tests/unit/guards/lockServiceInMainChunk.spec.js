import fs from 'fs'
import path from 'path'

/**
 * A write queued offline must not need the network to be queued (2026-10-22).
 *
 * Api reaches LockService through `import()` (a static import would be a cycle: LockService
 * imports Api). Queuing a granular write awaits that import to store the lock the replay
 * will need. When LockService lived only in an async chunk nobody had loaded yet, the
 * import fetched it over the network: offline, the fetch failed, the write threw before
 * reaching the queue and was lost — while the optimistic cache already showed it saved.
 * That was the dev server (chunk 18); production happened to share it in chunk 0.
 *
 * Importing it statically from main.js puts it in the entry chunk in every build, so the
 * `import()` resolves without fetching anything. jsdom does not run webpack: this pins the
 * import; the chunk itself is checked in the served bundle.
 */
const root = path.resolve(__dirname, '../../..')
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8')

describe('guard: LockService ships in the entry chunk', () => {
  it('main.js imports it statically', () => {
    expect(read('src/main.js')).toMatch(/^import\s+(?:\w+\s+from\s+)?['"]@\/services\/lockService['"]/m)
  })

  it('Api still reaches it lazily, so there is no static cycle', () => {
    expect(read('src/utils/Api.js')).not.toMatch(/^import[^\n]*['"]@\/services\/lockService['"]/m)
  })
})
