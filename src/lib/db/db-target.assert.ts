/**
 * Asserções de validação por ambiente — guarda a premissa P-01.
 */

import {
  DbTargetError,
  DEV_DATABASE_NAME,
  TEST_DATABASE_NAME,
} from './db-target';
import { isLoopbackHost, isNeonHost } from './db-target.parse';

export function assertDevelopmentTarget(host: string, database: string): void {
  if (!isLoopbackHost(host)) {
    throw new DbTargetError(
      'DEV_TARGET_MUST_BE_LOCAL',
      `[db] BLOQUEADO: ambiente development exige banco local, mas o destino é "${host}/${database}". ` +
        `Desenvolvimento NUNCA pode usar o banco de produção. Aponte DATABASE_URL_DEV para localhost:5432/${DEV_DATABASE_NAME}.`,
    );
  }

  if (database !== DEV_DATABASE_NAME) {
    throw new DbTargetError(
      'DEV_TARGET_WRONG_DATABASE',
      `[db] BLOQUEADO: ambiente development exige o banco "${DEV_DATABASE_NAME}", mas o destino é "${host}/${database}".`,
    );
  }
}

export function assertTestTarget(host: string, database: string): void {
  if (!isLoopbackHost(host)) {
    throw new DbTargetError(
      'TEST_TARGET_MUST_BE_LOCAL',
      `[db] BLOQUEADO: ambiente test exige banco local, mas o destino é "${host}/${database}". ` +
        `Testes rodam somente no banco "${TEST_DATABASE_NAME}" em localhost.`,
    );
  }

  if (database !== TEST_DATABASE_NAME) {
    throw new DbTargetError(
      'TEST_TARGET_WRONG_DATABASE',
      `[db] BLOQUEADO: ambiente test exige o banco "${TEST_DATABASE_NAME}", mas o destino é "${host}/${database}". ` +
        `Testes nunca usam o banco de desenvolvimento ou de produção.`,
    );
  }
}

export function assertProductionTarget(host: string, database: string): void {
  if (!isNeonHost(host)) {
    throw new DbTargetError(
      'PROD_TARGET_MUST_BE_NEON',
      `[db] BLOQUEADO: ambiente production exige o banco do Neon (host terminando em ".neon.tech"), ` +
        `mas o destino é "${host}/${database}".`,
    );
  }

  if (database === DEV_DATABASE_NAME || database === TEST_DATABASE_NAME) {
    throw new DbTargetError(
      'PROD_TARGET_WRONG_DATABASE',
      `[db] BLOQUEADO: ambiente production não pode usar o banco "${database}".`,
    );
  }
}