/**
 * Encuentra los `catch` SILENCIOSOS de `src/`: los que, quitando comentarios, sólo hacen
 * `console.*`, `printErrors(...)` / `Commons.printErrors(...)`, o nada.
 *
 * `$emit('print-errors', …)` NO cuenta como silencio: su único emisor es `crudTables` y su
 * único oyente, `viewProject.onTableError`, lo muestra (desde la Parte 2 de la auditoría).
 *
 * Es la regla que salió de la auditoría de 2026-09-28: `Commons.printErrors` no muestra nada,
 * y un `.catch` que sólo lo llamaba dejaba a la persona sin saber que su escritura, su carga
 * o su publicación habían fallado. Cualquier otra sentencia —asignar un estado, avisar,
 * devolver, relanzar, delegar en otro método— cuenta como manejar el error: la regla es
 * estrecha a propósito, para que el test no grite por lo que sí se maneja.
 *
 * Cada hallazgo se identifica por `archivo::función` (más un índice si hay varios en la misma
 * función), no por número de línea: los números cambian con cada edición.
 */
const fs = require('fs')
const path = require('path')
const { parse } = require('@babel/parser')
const traverse = require('@babel/traverse').default
const { parseComponent } = require('vue-template-compiler')

const SRC = path.resolve(__dirname, '../../../src')

function listFiles (dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return listFiles(full)
    return /\.(js|vue)$/.test(entry.name) ? [full] : []
  })
}

function scriptOf (file) {
  const text = fs.readFileSync(file, 'utf8')
  if (!file.endsWith('.vue')) return text
  const sfc = parseComponent(text)
  return sfc.script ? sfc.script.content : ''
}

// ¿Esta sentencia es SÓLO registrar el error, sin hacer nada que la persona vea?
function isLogOnly (statement) {
  if (statement.type !== 'ExpressionStatement') return false
  let expr = statement.expression
  // `console.log(Commons.printErrors(error))`
  if (expr.type !== 'CallExpression') return false
  const callee = expr.callee
  const name = callee.type === 'MemberExpression'
    ? `${callee.object.type === 'Identifier' ? callee.object.name : callee.object.type === 'ThisExpression' ? 'this' : '?'}.${callee.property.name}`
    : callee.type === 'Identifier' ? callee.name : ''
  if (/^console\./.test(name)) return true
  if (/(^|\.)printErrors$/.test(name)) return true
  return false
}

function isSilentBody (body) {
  // `.catch(() => null)`, `.catch(e => e)`: devolver un valor es manejarlo (el llamador decide).
  if (body.type !== 'BlockStatement') {
    return body.type === 'CallExpression' && isLogOnly({ type: 'ExpressionStatement', expression: body })
  }
  return body.body.every(isLogOnly)
}

function enclosingName (p) {
  let cur = p.parentPath
  while (cur) {
    const n = cur.node
    if ((n.type === 'ObjectMethod' || n.type === 'ClassMethod' || n.type === 'ObjectProperty') && n.key) {
      if (n.type !== 'ObjectProperty' || /Function/.test(n.value.type)) return n.key.name || n.key.value
    }
    if (n.type === 'FunctionDeclaration' && n.id) return n.id.name
    if (n.type === 'VariableDeclarator' && n.id && n.id.name && /Function/.test((n.init || {}).type)) return n.id.name
    cur = cur.parentPath
  }
  return '(módulo)'
}

function scanCode (code, rel) {
  const found = []
  {
    let ast
    try {
      ast = parse(code, { sourceType: 'module', plugins: ['classProperties', 'optionalChaining', 'objectRestSpread', 'dynamicImport'] })
    } catch (e) {
      throw new Error(`No se pudo parsear ${rel}: ${e.message}`)
    }
    const hits = []
    traverse(ast, {
      CatchClause (p) {
        if (isSilentBody(p.node.body)) hits.push({ fn: enclosingName(p), line: p.node.loc.start.line })
      },
      CallExpression (p) {
        const c = p.node.callee
        if (c.type !== 'MemberExpression' || c.property.name !== 'catch') return
        const handler = p.node.arguments[0]
        if (!handler) return
        if (handler.type === 'ArrowFunctionExpression' || handler.type === 'FunctionExpression') {
          if (isSilentBody(handler.body)) hits.push({ fn: enclosingName(p), line: p.node.loc.start.line })
        }
      }
    })
    const perFn = {}
    for (const h of hits) {
      perFn[h.fn] = (perFn[h.fn] || 0) + 1
      const n = perFn[h.fn]
      found.push({ key: `${rel}::${h.fn}${n > 1 ? `#${n}` : ''}`, line: h.line })
    }
  }
  return found
}

function scan () {
  return listFiles(SRC).flatMap(file => {
    const code = scriptOf(file)
    return code ? scanCode(code, path.relative(SRC, file)) : []
  })
}

module.exports = { scan, scanCode }
