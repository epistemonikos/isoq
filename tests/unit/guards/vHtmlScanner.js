const fs = require('fs')
const path = require('path')

const SRC = path.resolve(__dirname, '../../../src')
const V_HTML = /v-html=(?:"([^"]*)"|'([^']*)')/g

function walk (dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return entry.name.endsWith('.vue') ? [full] : []
  })
}

// One key per sink: `<file relative to src>::<expression>`. The same expression twice in a
// file gets `#2`, `#3`, so a copy of an allowed sink is still a new sink.
function scanCode (code, file) {
  const seen = {}
  const found = []
  let match
  V_HTML.lastIndex = 0
  while ((match = V_HTML.exec(code)) !== null) {
    const expression = (match[1] !== undefined ? match[1] : match[2]).trim()
    const base = `${file}::${expression}`
    seen[base] = (seen[base] || 0) + 1
    const key = seen[base] === 1 ? base : `${base}#${seen[base]}`
    const line = code.slice(0, match.index).split('\n').length
    found.push({ key, line })
  }
  return found
}

function scan () {
  return walk(SRC).flatMap(full => scanCode(fs.readFileSync(full, 'utf8'), path.relative(SRC, full)))
}

module.exports = { scan, scanCode }
