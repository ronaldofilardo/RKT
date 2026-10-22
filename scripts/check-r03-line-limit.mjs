import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

// Guarda R-03: nenhum arquivo de produção > 100 linhas (linhas cruas).
//
// Padrão ratchet: `scripts/r03-baseline.json` congela as violações atuais.
// O check FALHA quando:
//   - novo arquivo produção >100L que não está no baseline (nova violação);
//   - arquivo do baseline CRESCEU (regressão de tamanho);
//   - arquivo do baseline ficou <=100L (baseline obsoleto — remover entrada).
// Arquivos com `ste-exception R-03` no cabeçalho são isentos.
// Uso: `node scripts/check-r03-line-limit.mjs [--update]` (--update regrava o baseline).

const LIMIT = 100
const NEAR_LIMIT = 96
const root = join(process.cwd(), 'src')
const baselinePath = join(process.cwd(), 'scripts', 'r03-baseline.json')
const exceptionPattern = /ste-exception\s+R-03/
const updateMode = process.argv.includes('--update')

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
      if (entry.name !== 'node_modules' && entry.name !== '__snapshots__' && entry.name !== '__tests__') {
        await walk(path)
      }
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec|d)\.tsx?$/.test(entry.name)) {
      files.push(path)
    }
  }
}

function countLines(content) {
  if (content.length === 0) return 0
  const parts = content.replace(/\r\n/g, '\n').split('\n')
  if (parts[parts.length - 1] === '') parts.pop()
  return parts.length
}

await walk(root)

const current = {}
const exempt = []
const near = []

for (const file of files) {
  const content = await readFile(file, 'utf8')
  const rel = relative(process.cwd(), file).split(sep).join('/')
  const lines = countLines(content)
  if (exceptionPattern.test(content.slice(0, 1500))) {
    exempt.push(rel)
    continue
  }
  if (lines > LIMIT) current[rel] = lines
  else if (lines >= NEAR_LIMIT) near.push(`${rel} (${lines}L)`)
}

if (updateMode) {
  await writeFile(baselinePath, JSON.stringify(current, null, 2) + '\n', 'utf8')
  console.log(
    `Baseline R-03 regravado: ${Object.keys(current).length} violações conhecidas ` +
      `(${exempt.length} isentas por ste-exception).`
  )
  process.exit(0)
}

let baseline = {}
try {
  baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
} catch {
  console.error('Baseline ausente ou inválido (scripts/r03-baseline.json). Rode: --update')
  process.exit(1)
}

const newViolations = Object.keys(current)
  .filter((rel) => !(rel in baseline))
  .sort()
const grown = Object.keys(current)
  .filter((rel) => rel in baseline && current[rel] > baseline[rel])
  .sort()
const stale = Object.keys(baseline)
  .filter((rel) => !(rel in current))
  .sort()

const errors = []
for (const rel of newViolations) {
  errors.push(`NOVA violacao (>100L, fora do baseline): ${rel} (${current[rel]}L)`)
}
for (const rel of grown) {
  errors.push(`REGRESSAO de tamanho: ${rel} ${baseline[rel]}L -> ${current[rel]}L`)
}
for (const rel of stale) {
  errors.push(`BASELINE obsoleto (ja <=100L, remover entrada): ${rel}`)
}

if (errors.length > 0) {
  console.error('R-03 violado:')
  console.error(errors.join('\n'))
  console.error(
    `\nResumo: ${Object.keys(current).length} violacoes no baseline, ` +
      `${exempt.length} isentas, ${Object.keys(current).length - newViolations.length - grown.length} estaveis.`
  )
  process.exitCode = 1
} else {
  console.log(
    `OK R-03: ${files.length} arquivos producao; ${Object.keys(current).length} violacoes congeladas no baseline; ` +
      `${exempt.length} isentas (ste-exception); 0 regressoes.`
  )
  if (near.length > 0) {
    console.log(`Atencao (zona de risco ${NEAR_LIMIT}-${LIMIT}L):\n  ${near.join('\n  ')}`)
  }
}
