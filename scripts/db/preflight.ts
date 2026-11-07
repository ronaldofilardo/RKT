/**
 * Pré-voo de banco (premissa P-01, docs/RULES.md).
 *
 * Carrega os mesmos arquivos .env que o processo filho carregaria, valida o destino
 * com a guarda única em `src/lib/db/db-target.ts` e, quando recebe um comando após
 * `--`, exporta DATABASE_URL já validada e o executa.
 *
 * Uso: tsx scripts/db/preflight.ts [--mode=development|test|production] [-- comando…]
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  assertDbTarget,
  describeDbTarget,
  DbTargetError,
  type DbEnv,
} from '../../src/lib/db/db-target';

type Mode = DbEnv;

interface PreflightArgs {
  mode: Mode;
  command: string[];
}

function parseMode(argv: string[], env: NodeJS.ProcessEnv): Mode {
  const arg = argv.find((value) => value.startsWith('--mode='));
  if (arg) {
    const mode = arg.slice('--mode='.length);
    if (mode === 'development' || mode === 'test' || mode === 'production') return mode;
    console.error(`[db] --mode inválido: "${mode}". Use development, test ou production.`);
    process.exit(2);
  }

  if (env.NODE_ENV === 'test') return 'test';
  if (env.NODE_ENV === 'production' && (env.VERCEL === '1' || env.APP_ENV === 'production')) {
    return 'production';
  }
  return 'development';
}

function parseArgs(argv: string[], env: NodeJS.ProcessEnv): PreflightArgs {
  const separator = argv.indexOf('--');
  const ownArgs = separator >= 0 ? argv.slice(0, separator) : argv;
  const command = separator >= 0 ? argv.slice(separator + 1) : [];

  return { mode: parseMode(ownArgs, env), command };
}

function loadEnvFiles(projectDir: string, mode: Mode): string[] {
  process.env.NODE_ENV = mode;

  let nextEnvPath: string;
  try {
    nextEnvPath = require.resolve('@next/env', { paths: [require.resolve('next')] });
  } catch {
    throw new Error('[db] Não foi possível localizar o carregador de env do Next (@next/env). Rode "pnpm install".');
  }

  const { loadEnvConfig } = require(nextEnvPath) as {
    loadEnvConfig: (dir: string, dev?: boolean) => { loadedEnvFiles: { path: string }[] };
  };

  const { loadedEnvFiles } = loadEnvConfig(projectDir, mode !== 'production');
  return loadedEnvFiles.map((file) => file.path);
}

function run(): void {
  const projectDir = process.cwd();
  const { mode, command } = parseArgs(process.argv.slice(2), process.env);
  const loadedFiles = loadEnvFiles(projectDir, mode);

  const target = assertDbTarget(process.env);

  console.log(`[db] preflight ok — alvo=${describeDbTarget(target)}`);
  console.log(`[db] modo=${mode} arquivos=${loadedFiles.length > 0 ? loadedFiles.join(', ') : '(nenhum)'}`);

  if (mode !== 'production' && fs.existsSync(path.join(projectDir, '.env.production'))) {
    console.warn(
      '[db] aviso: .env.production existe nesta máquina. Em desenvolvimento use apenas DATABASE_URL_DEV/DATABASE_URL_TEST.',
    );
  }

  if (command.length === 0) return;

  const [file, ...args] = command;
  // O filho recebe o destino já validado: DATABASE_URL para o Prisma CLI/seed e
  // DB_TARGET para a guarda dentro do app (dev server do Playwright no banco de teste).
  const childEnv: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: mode === 'production' ? 'production' : 'development',
    DATABASE_URL: target.url,
  };
  if (mode === 'production') delete childEnv.DB_TARGET;
  else childEnv.DB_TARGET = mode;

  const result = spawnSync(file, args, {
    stdio: 'inherit',
    env: childEnv,
    shell: process.platform === 'win32',
  });

  if (result.error) {
    console.error(`[db] falha ao executar "${command.join(' ')}": ${result.error.message}`);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

try {
  run();
} catch (error) {
  if (error instanceof DbTargetError) {
    console.error(error.message);
    console.error('[db] Premissa P-01 violada — execução interrompida (docs/RULES.md).');
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exit(1);
}
