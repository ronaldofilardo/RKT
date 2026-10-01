import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const root = join(process.cwd(), 'src')
const e2eRoot = join(process.cwd(), 'e2e')
const testPattern = /(?:describe|it|test)\s*\.\s*(?:skip|only)\s*\(|\b(?:xdescribe|xit|xtest)\s*\(/g
const files = []

async function walk(directory) {
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '__snapshots__') await walk(path)
    } else if (/\.(test|spec)\.(?:ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(path)
    }
  }
}

await walk(root)
await walk(e2eRoot)
const violations = []
for (const file of files) {
  const content = await readFile(file, 'utf8')
  for (const match of content.matchAll(testPattern)) {
    const line = content.slice(0, match.index).split('\n').length
    violations.push(`${relative(process.cwd(), file)}:${line}: ${match[0]}`)
  }
}

if (violations.length > 0) {
  console.error('Testes ignorados ou focos exclusivos encontrados:')
  console.error(violations.join('\n'))
  process.exitCode = 1
} else {
  console.log(`OK: ${files.length} arquivos de teste sem skip/only explícito.`)
}
