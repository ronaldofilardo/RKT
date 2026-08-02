/**
 * E2E A11Y HELPERS — rkt
 *
 * Owner: @qa + @frontend
 * Status: Sprint 3 (TD-014 — accessibility gate)
 *
 * Integracao axe-core/playwright para deteccao de violacoes
 * de acessibilidade em fluxos E2E.
 *
 * Estrategia (Sprint 3):
 *   - 0 violacoes critical/serious devem falhar CI.
 *   - moderate/minor sao registradas em TECH_DEBT.md mas nao falham.
 */

import AxeBuilder from '@axe-core/playwright';
import type { Page, Result as AxeResult } from '@axe-core/playwright';
import { expect } from '@playwright/test';

export type AxeSeverity = 'minor' | 'moderate' | 'serious' | 'critical';

export interface AxeViolation {
  id: string;
  impact: AxeSeverity | null;
  description: string;
  helpUrl: string;
  nodes: string[];
}

const SERVERS_FAIL_CI: ReadonlySet<AxeSeverity> = new Set(['serious', 'critical']);

/**
 * Roda axe-core contra a pagina atual e retorna todas as violacoes,
 * agrupando-as por severidade.
 */
export async function collectAxeViolations(page: Page): Promise<AxeViolation[]> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  return results.violations.map((v: AxeResult) => ({
    id: v.id,
    impact: (v.impact ?? null) as AxeSeverity | null,
    description: v.description,
    helpUrl: v.helpUrl,
    nodes: v.nodes.map((n) => n.target.join(' ')),
  }));
}

/**
 * Filtra violacoes por severidade (CI gates).
 */
export function filterBySeverity(
  violations: AxeViolation[],
  severity: AxeSeverity
): AxeViolation[] {
  return violations.filter((v) => v.impact === severity);
}

export interface ExpectNoAxeOptions {
  /**
   * Severidades que devem falhar o teste.
   * Default: ['critical', 'serious'] — alinhado a meta Sprint 3.
   */
  failOn?: AxeSeverity[];
  /**
   * Se `true`, registra violacoes moderate/minor via console (para TECH_DEBT capture).
   */
  logLowerSeverity?: boolean;
}

/**
 * Hook padrao para `test.afterEach`.
 * Falha em critical/serious e apenas loga moderate/minor.
 */
export async function expectNoAxeViolations(
  page: Page,
  options: ExpectNoAxeOptions = {}
): Promise<void> {
  const failOn = new Set<AxeSeverity>(options.failOn ?? ['critical', 'serious']);
  const violations = await collectAxeViolations(page);

  const failing = violations.filter(
    (v) => v.impact !== null && failOn.has(v.impact)
  );
  const lower = violations.filter(
    (v) => v.impact !== null && !SERVERS_FAIL_CI.has(v.impact)
  );

  if (options.logLowerSeverity && lower.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[a11y] moderate/minor (collected for TECH_DEBT.md, not failing CI):`,
      JSON.stringify(lower.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes })), null, 2)
    );
  }

  if (failing.length > 0) {
    const summary = failing
      .map(
        (v) =>
          `  - [${v.impact}] ${v.id}: ${v.description}\n    nodes: ${v.nodes.slice(0, 3).join(', ')}${v.nodes.length > 3 ? '...' : ''}\n    help: ${v.helpUrl}`
      )
      .join('\n');
    throw new Error(
      `A11y violations failing CI (${[...failOn].join(', ')}):\n${summary}`
    );
  }
}
