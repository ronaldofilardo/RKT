/**
 * E2E WAIT HELPERS — rkt
 *
 * Owner: @qa
 * Status: Sprint 3 (TD-013 — anti-flakiness consolidation)
 *
 * Utilities para sincronização deterministica em testes E2E.
 * Substituem `waitForTimeout` e esperas magicas por esperas
 * explicitas do Playwright com timeout configuravel.
 *
* Padrao de uso: see README for examples
 */

import type { Page, Response } from '@playwright/test';
import { expect } from '@playwright/test';

const DEFAULT_TIMEOUT = 10_000;

export interface Waitable {
  page: Page;
  timeout?: number;
}

/**
 * Espera por uma chamada API que satisfaca o padrao de URL.
 * Retorna a Response para encadeamento opcional.
 *
 * @example
 *   const res = await waitForApiCall({ page }, /\/api\/matches\/.*\/point/);
 *   expect(res.status()).toBe(200);
 */
export async function waitForApiCall(
  { page, timeout = DEFAULT_TIMEOUT }: Waitable,
  urlPattern: string | RegExp
): Promise<Response> {
  const matcher =
    typeof urlPattern === 'string'
      ? (r: Response) => r.url().includes(urlPattern)
      : (r: Response) => urlPattern.test(r.url());

  return page.waitForResponse(matcher, { timeout });
}

/**
 * Espera por um toast visivel na UI.
 * Aceita tipos especificos (success/error/info) para fluxos deterministicos.
 */
export async function waitForToast(
  { page, timeout = DEFAULT_TIMEOUT }: Waitable,
  options: { type?: 'success' | 'error' | 'info'; message?: string | RegExp } = {}
): Promise<void> {
  const locator = page.locator('[data-testid="toast"]').first();
  await locator.waitFor({ state: 'visible', timeout });
  if (options.type) {
    await expect(locator).toHaveAttribute('data-toast-type', options.type, { timeout });
  }
  if (options.message) {
    await expect(locator).toContainText(options.message as string, { timeout });
  }
}

/**
 * Espera por um elemento identificado por data-testid estar visivel.
 * Substitui `waitForSelector({ state: 'visible' })` com semantica explicita.
 */
export async function waitForTestid(
  { page, timeout = DEFAULT_TIMEOUT }: Waitable,
  testId: string,
  options: { state?: 'visible' | 'attached' | 'detached' | 'hidden' } = {}
): Promise<void> {
  await page.locator(`[data-testid="${testId}"]`).first().waitFor({
    state: options.state ?? 'visible',
    timeout,
  });
}

/**
 * Convenience: helper que retorna o locator por testid (sem esperar).
 * Para quando ja se quer encadear `expect().toHaveText()` etc.
 */
export function getByTestid(page: Page, testId: string) {
  return page.locator(`[data-testid="${testId}"]`);
}
