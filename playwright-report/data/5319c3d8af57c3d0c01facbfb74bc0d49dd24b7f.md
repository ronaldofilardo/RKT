# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows\06-offline-conflict.spec.ts >> TEST-03.3: Offline Sync Conflict Reconciliation (TD-013 + seq race) >> flush reconcilia apos SEQUENCE_CONFLICT (backend retorna 409 + expectedSequence)
- Location: e2e\flows\06-offline-conflict.spec.ts:45:7

# Error details

```
TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="toast"]').first() to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e4]:
      - button "Fechar" [ref=e5] [cursor=pointer]:
        - img [ref=e6]
      - generic [ref=e9]: 0:00
      - button "📊" [ref=e11] [cursor=pointer]
    - generic [ref=e12]:
      - table [ref=e15]:
        - rowgroup [ref=e16]:
          - row "Jogador Vencedor Set 1" [ref=e17]:
            - columnheader "Jogador" [ref=e18]
            - columnheader "Vencedor" [ref=e19]
            - columnheader "Set 1" [ref=e20]: atual
        - rowgroup [ref=e21]:
          - row "Jogador Atleta -" [ref=e22]:
            - cell "Jogador Atleta" [ref=e23]
            - cell [ref=e24]
            - cell "-" [ref=e25]
          - row "Segundo Jogador -" [ref=e26]:
            - cell "Segundo Jogador" [ref=e27]
            - cell [ref=e28]
            - cell "-" [ref=e29]
      - generic [ref=e30]:
        - button "+ Ponto Jogador Atleta" [ref=e32] [cursor=pointer]:
          - generic [ref=e33]:
            - generic [ref=e34]: Jogador Atleta
            - generic "Sacando" [ref=e35]
          - generic [ref=e36]: "0"
          - generic [ref=e38]: Toque para marcar ponto
        - button "+ Ponto Segundo Jogador" [ref=e40] [cursor=pointer]:
          - generic [ref=e42]: Segundo Jogador
          - generic [ref=e43]: "0"
          - generic [ref=e45]: Toque para marcar ponto
    - generic [ref=e47]:
      - generic [ref=e49]: 1º SAQUE
      - generic [ref=e50]:
        - generic [ref=e51]:
          - checkbox "Detalhes do ACE" [ref=e52]
          - text: Detalhes do ACE
        - generic [ref=e53]:
          - checkbox "Detalhes da DF" [ref=e54]
          - text: Detalhes da DF
      - generic [ref=e55]:
        - button "Ace" [ref=e56] [cursor=pointer]
        - button "Out" [ref=e57] [cursor=pointer]
        - button "Net" [ref=e58] [cursor=pointer]
      - generic [ref=e59]:
        - generic [ref=e60]:
          - button "↩ Voltar" [disabled] [ref=e61]
          - button "↪ Refazer" [disabled] [ref=e62]
        - generic [ref=e63]:
          - button "💬" [ref=e64] [cursor=pointer]
          - button "Corrigir placar" [ref=e65] [cursor=pointer]:
            - text: ✏️
            - generic [ref=e66]: Corrigir
  - button "Open Next.js Dev Tools" [ref=e72] [cursor=pointer]:
    - img [ref=e73]
  - alert [ref=e76]
```

# Test source

```ts
  1  | /**
  2  |  * E2E WAIT HELPERS — rkt
  3  |  *
  4  |  * Owner: @qa
  5  |  * Status: Sprint 3 (TD-013 — anti-flakiness consolidation)
  6  |  *
  7  |  * Utilities para sincronização deterministica em testes E2E.
  8  |  * Substituem `waitForTimeout` e esperas magicas por esperas
  9  |  * explicitas do Playwright com timeout configuravel.
  10 |  *
  11 | * Padrao de uso: see README for examples
  12 |  */
  13 | 
  14 | import type { Page, Response } from '@playwright/test';
  15 | import { expect } from '@playwright/test';
  16 | 
  17 | const DEFAULT_TIMEOUT = 10_000;
  18 | 
  19 | export interface Waitable {
  20 |   page: Page;
  21 |   timeout?: number;
  22 | }
  23 | 
  24 | /**
  25 |  * Espera por uma chamada API que satisfaca o padrao de URL.
  26 |  * Retorna a Response para encadeamento opcional.
  27 |  *
  28 |  * @example
  29 |  *   const res = await waitForApiCall({ page }, /\/api\/matches\/.*\/point/);
  30 |  *   expect(res.status()).toBe(200);
  31 |  */
  32 | export async function waitForApiCall(
  33 |   { page, timeout = DEFAULT_TIMEOUT }: Waitable,
  34 |   urlPattern: string | RegExp
  35 | ): Promise<Response> {
  36 |   const matcher =
  37 |     typeof urlPattern === 'string'
  38 |       ? (r: Response) => r.url().includes(urlPattern)
  39 |       : (r: Response) => urlPattern.test(r.url());
  40 | 
  41 |   return page.waitForResponse(matcher, { timeout });
  42 | }
  43 | 
  44 | /**
  45 |  * Espera por um toast visivel na UI.
  46 |  * Aceita tipos especificos (success/error/info) para fluxos deterministicos.
  47 |  */
  48 | export async function waitForToast(
  49 |   { page, timeout = DEFAULT_TIMEOUT }: Waitable,
  50 |   options: { type?: 'success' | 'error' | 'info'; message?: string | RegExp } = {}
  51 | ): Promise<void> {
  52 |   const locator = page.locator('[data-testid="toast"]').first();
> 53 |   await locator.waitFor({ state: 'visible', timeout });
     |                 ^ TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
  54 |   if (options.type) {
  55 |     await expect(locator).toHaveAttribute('data-toast-type', options.type, { timeout });
  56 |   }
  57 |   if (options.message) {
  58 |     await expect(locator).toContainText(options.message as string, { timeout });
  59 |   }
  60 | }
  61 | 
  62 | /**
  63 |  * Espera por um elemento identificado por data-testid estar visivel.
  64 |  * Substitui `waitForSelector({ state: 'visible' })` com semantica explicita.
  65 |  */
  66 | export async function waitForTestid(
  67 |   { page, timeout = DEFAULT_TIMEOUT }: Waitable,
  68 |   testId: string,
  69 |   options: { state?: 'visible' | 'attached' | 'detached' | 'hidden' } = {}
  70 | ): Promise<void> {
  71 |   await page.locator(`[data-testid="${testId}"]`).first().waitFor({
  72 |     state: options.state ?? 'visible',
  73 |     timeout,
  74 |   });
  75 | }
  76 | 
  77 | /**
  78 |  * Convenience: helper que retorna o locator por testid (sem esperar).
  79 |  * Para quando ja se quer encadear `expect().toHaveText()` etc.
  80 |  */
  81 | export function getByTestid(page: Page, testId: string) {
  82 |   return page.locator(`[data-testid="${testId}"]`);
  83 | }
  84 | 
```