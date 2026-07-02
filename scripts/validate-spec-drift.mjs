/**
 * validate-spec-drift.mjs
 *
 * Valida que os schemas Zod em src/schemas/contracts.ts e as rotas da API
 * em src/app/api/ não sofreram drift (divergência não intencional).
 *
 * O que verifica:
 *  - 10 schemas obrigatórios (MatchSchema, PointFlowInputSchema, etc.)
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
const CONTRACTS_FILE = join(process.cwd(), 'src/schemas/contracts.ts');

console.log('Validating Spec Drift...\n');

const contractsContent = readFileSync(CONTRACTS_FILE, 'utf-8');

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
  if (!contractsContent.includes(`export const ${exportName}`)) {
    console.error(`Schema ausente no contracts.ts: ${exportName}`);
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

if (hasError) {
  console.error('\nSpec Drift detectado! Corrija antes do merge.\n');
  process.exit(1);
} else {
  console.log('\nNenhum drift detectado. Spec consistente!\n');
}
