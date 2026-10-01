/**
 * validate-spec-drift.mjs
 *
 * Valida que os schemas Zod em src/schemas/ e as rotas da API
 * em src/app/api/ não sofreram drift (divergência não intencional).
 *
 * O que verifica:
 *  - 10 schemas obrigatórios (MatchSchema, PointFlowInputSchema, etc.)
 *    definidos em src/schemas/*.ts (contracts.ts é um barrel desde o
 *    particamento de 2026-09-30, então a checagem varre os módulos de domínio)
 *  - 13 rotas API obrigatórias (/auth/login, /matches/[id]/point, etc.)
 *
 * Uso local:
 *   npm run spec:validate
 *
 * CI:
 *   Executado no job "contract-testing" do workflow spec-drift-check.yml
 *   em todo push para main/develop e PRs para main.
 *
 * Falha com exit code 1 se algum schema ou rota estiver faltando.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ROUTES_DIR = join(process.cwd(), 'src/app/api');
const SCHEMAS_DIR = join(process.cwd(), 'src/schemas');

console.log('Validating Spec Drift...\n');

const schemasContent = readdirSync(SCHEMAS_DIR)
  .filter((name) => name.endsWith('.ts'))
  .map((name) => readFileSync(join(SCHEMAS_DIR, name), 'utf-8'))
  .join('\n');

const expectedExports = [
  'MatchSchema',
  'CreateMatchInputSchema',
  'MatchStateInputSchema',
  'PointFlowInputSchema',
  'LoginPayloadSchema',
  'QueuedActionSchema',
  'RoleSchema',
  'MatchScoreStateSchema',
  'AnnotationSessionSchema',
  'AnnotationEndorsementSchema',
];

let hasError = false;

for (const exportName of expectedExports) {
  if (!schemasContent.includes(`export const ${exportName}`)) {
    console.error(`Schema ausente em src/schemas/: ${exportName}`);
    hasError = true;
  } else {
    console.log(`ok ${exportName}`);
  }
}

function findRouteFiles(dir, baseDir = dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('__tests__') && !entry.name.startsWith('node_modules')) {
      files = files.concat(findRouteFiles(fullPath, baseDir));
    } else if (entry.name === 'route.ts') {
      const relativePath = fullPath.replace(baseDir, '').replace(/\\/g, '/').replace(/\/route\.ts$/, '');
      files.push(relativePath || '/');
    }
  }
  return files;
}

const foundRoutes = findRouteFiles(ROUTES_DIR);
console.log(`\nRotas API encontradas: ${foundRoutes.length}`);

const requiredRoutes = [
  '/auth/login',
  '/auth/logout',
  '/players',
  '/matches',
  '/matches/[id]',
  '/matches/[id]/state',
  '/matches/[id]/point',
  '/matches/[id]/report',
  '/matches/[id]/sessions',
  '/matches/[id]/sessions/[sessionId]',
  '/matches/[id]/sessions/[sessionId]/abandon',
  '/matches/[id]/sessions/[sessionId]/endorse',
  '/matches/suspended-sessions',
];

for (const route of requiredRoutes) {
  if (foundRoutes.includes(route)) {
    console.log(`ok Route: /api${route}`);
  } else {
    console.error(`missing Route: /api${route}`);
    hasError = true;
  }
}

// --- Telemetry Design System Guardrails ---
console.log('\nValidating Telemetry Design System Guardrails...');

const tailwindPath = join(process.cwd(), 'tailwind.config.ts');
const tailwindContent = readFileSync(tailwindPath, 'utf-8');

if (!tailwindContent.includes('telemetry: {') || !/darkMode:\s*\['class',\s*'\[data-theme="dark"\]'\]/.test(tailwindContent)) {
  console.error('ERRO: tailwind.config.ts perdeu a configuração do Telemetry Design System ou darkMode.');
  hasError = true;
} else {
  console.log('ok Telemetry Tokens & Dual Theme config');
}

const playAreaPath = join(process.cwd(), 'src/app/match/[id]/scoring/ScoringPlayArea.tsx');
const playAreaContent = readFileSync(playAreaPath, 'utf-8');

if (!playAreaContent.includes('<ScoreboardCard') || !playAreaContent.includes('<LiveCountersBar')) {
  console.error('ERRO: ScoringPlayArea perdeu ScoreboardCard ou LiveCountersBar.');
  hasError = true;
} else {
  console.log('ok ScoringPlayArea hierarchy');
}

const scoringDir = join(process.cwd(), 'src/components/scoring');
const forbiddenLegacyFiles = [
  'ScoreboardCard.view.tsx',
  'ScoreboardCard.rows.tsx',
  'PlayerCard.view.tsx',
];

for (const legacy of forbiddenLegacyFiles) {
  try {
    readFileSync(join(scoringDir, legacy));
    console.error(`ERRO: Arquivo legado ressuscitado detectado: src/components/scoring/${legacy}`);
    hasError = true;
  } catch {
    // Esperado: arquivo não existe
  }
}

if (hasError) {
  console.error('\nSpec Drift ou Regressão Visual detectada! Corrija antes do merge.\n');
  process.exit(1);
} else {
  console.log('\nNenhum drift detectado. Spec e Design System consistentes!\n');
}

