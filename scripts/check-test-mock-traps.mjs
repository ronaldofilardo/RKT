import { readdir, readFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

// Guarda das armadilhas de teste registradas na MEMORY (2.55/2.56):
//
// (1) Hoisting do jest.mock: `import { jest } from '@jest/globals'` desativa o
//     hoisting do SWC (next/jest) — os require() dos imports são emitidos antes
//     de jest.mock(...) e o módulo mockado é capturado REAL (sintoma:
//     `TypeError: ...mockResolvedValue is not a function`).
//     Correção: usar o `jest` global — remover `jest` do import de @jest/globals.
// (2) @jest-environment: a diretiva precisa terminar no fim da linha
//     (`/** @jest-environment jsdom */` ou linha própria dentro do docblock:
//     ` * @jest-environment jsdom`). Com texto sobrando na linha, o Jest captura
//     o resto do parágrafo como nome do ambiente ("jsdom ... cannot be found").
//
// Uso: `node scripts/check-test-mock-traps.mjs` (pnpm check:mock-traps)

const root = join(process.cwd(), 'src')
const testPattern = /\.test\.tsx?$/
const jestMockPattern = /jest\.mock\(/
const envTagPattern = /@jest-environment/
// formas válidas: /** @jest-environment jsdom */  |  * @jest-environment jsdom
const validEnvLine = /^\s*(?:\/\*\*|\*)?\s*@jest-environment\s+[A-Za-z0-9._-]+\s*(?:\*\/)?$/

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
      if (entry.name !== 'node_modules' && entry.name !== '__snapshots__') {
        await walk(path)
      }
    } else if (testPattern.test(entry.name)) {
      files.push(path)
    }
  }
}

// Detecta `jest` como binding de VALOR importado de @jest/globals
// (import/export type e `type jest` inline não contam).
function importsJestFromGlobals(content) {
  const stripped = content
    .replace(/^import\s+type\b[^;]*;?$/gm, '')
    .replace(/^export\s+type\b[^;]*;?$/gm, '')
  const blocks = stripped.match(/^import\b[^;]*?from\s*['"]@jest\/globals['"];?/gm) || []
  return blocks.some((block) => {
    const m = block.match(/\{([^}]*)\}/)
    if (!m) return false
    return m[1]
      .split(',')
      .map((s) => s.trim().replace(/^type\s+/, ''))
      .includes('jest')
  })
}

// Remove comentários para não contar menções em prosa como código real.
function stripComments(content) {
  return content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

await walk(root)

const hoistingViolations = []
const envViolations = []

for (const file of files) {
  const content = await readFile(file, 'utf8')
  const rel = relative(process.cwd(), file).split(sep).join('/')

  if (jestMockPattern.test(stripComments(content)) && importsJestFromGlobals(content)) {
    hoistingViolations.push(rel)
  }

  const lines = content.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    if (envTagPattern.test(lines[i]) && !validEnvLine.test(lines[i])) {
      envViolations.push(`${rel}:${i + 1}: ${lines[i].trim()}`)
    }
  }
}

const errors = []
for (const rel of hoistingViolations) {
  errors.push(
    `hoisting/jest.mock: ${rel}\n` +
      `  import de 'jest' vindo de @jest/globals desativa o hoisting do SWC — remover 'jest' do import (usar o jest global).`
  )
}
for (const v of envViolations) {
  errors.push(
    `@jest-environment invalido: ${v}\n` +
      `  use a forma de linha unica: /** @jest-environment jsdom */  ou  * @jest-environment jsdom (linha propria no docblock).`
  )
}

if (errors.length > 0) {
  console.error('Armadilhas de teste detectadas:')
  console.error(errors.join('\n'))
  process.exitCode = 1
} else {
  console.log(
    `OK armadilhas de teste: ${files.length} arquivos .test.ts(x); ` +
      `0 com jest importado de @jest/globals junto de jest.mock; ` +
      `0 com @jest-environment fora da forma de linha unica.`
  )
}
