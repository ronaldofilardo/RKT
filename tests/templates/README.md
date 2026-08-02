# QA Guardrails — rkt

**Owner:** @qa  
**Status:** Oficial (Onda 1 — Guardrails)  
**Última atualização:** 2026-07-20

---

## Visão Geral

Este documento descreve os padrões e templates para testes no projeto rkt.

---

## Estrutura de Testes

```
tests/
├── setup.ts                    # Setup global do Jest
├── helpers.ts                  # Helpers compartilhados (factories, cleanup)
├── api-route.template.test.ts  # Template de teste de API
└── component.template.test.tsx # Template de teste de componente

e2e/
├── helpers/
│   ├── index.ts                # Export de helpers E2E
│   ├── auth.ts                 # Autenticação (loginAs, USERS)
│   ├── factories.ts            # Factories (createTestPlayer, createTestMatch)
│   └── test-context.ts         # Contexto compartilhado (TestContext)
└── flows/
    ├── 01-full-match-cycle.spec.ts
    ├── 02-session-suspend-resume.spec.ts
    └── ...
```

---

## Tipos de Testes

### 1. Testes Unitários (Jest)

**Onde:** `src/**/__tests__/*.test.ts`, `src/**/__tests__/*.test.tsx`

**Config:** `jest.config.js`

**Exemplo:**
```typescript
import { describe, it, expect } from '@jest/globals';
import { myFunction } from '../myModule';

describe('myFunction', () => {
  it('deve retornar valor esperado', () => {
    expect(myFunction('input')).toBe('output');
  });
});
```

### 2. Testes de Componentes (Jest + Testing Library)

**Onde:** `src/components/**/__tests__/*.test.tsx`

**Config:** `jest.components.config.js`

**Exemplo:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('deve renderizar corretamente', () => {
    render(<MyComponent prop="value" />);
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
```

### 3. Testes de API (Jest + fetch mock)

**Onde:** `src/app/api/**/__tests__/*.test.ts`

**Template:** `tests/api-route.template.test.ts`

**Exemplo:**
```typescript
import { createTestPlayer, createAuthHeader } from '@/test/helpers';

describe('GET /api/resource', () => {
  it('deve retornar 200 com lista', async () => {
    const testUser = await createTestPlayer();
    const response = await fetch('/api/resource', {
      headers: createAuthHeader(testUser),
    });
    expect(response.status).toBe(200);
  });
});
```

### 4. Testes E2E (Playwright)

**Onde:** `e2e/flows/*.spec.ts`

**Config:** `playwright.config.ts`

**Exemplo:**
```typescript
import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test('deve criar partida com sucesso', async ({ page }) => {
  const { token } = await loginAs('athlete1');
  await page.goto('/match/new');
  // ... ações
  await expect(page.locator('text=Partida criada')).toBeVisible();
});
```

---

## Helpers Disponíveis

### Unitários/Componentes

**Arquivo:** `tests/helpers.ts` (criar)

```typescript
export async function createTestPlayer(overrides?: Partial<Player>) {
  // Factory de Player
}

export function createAuthHeader(player: Player) {
  // Gera header com token JWT
}

export async function cleanup() {
  // Limpa dados de teste
}
```

### E2E

**Arquivo:** `e2e/helpers/factories.ts`

```typescript
export async function createTestPlayer(api, overrides) {
  // Cria Player via API
}

export async function createTestMatch(api, player1Id, player2Id, overrides) {
  // Cria Match via API
}

export async function cleanupTestData(api) {
  // Limpa dados de teste
}
```

---

## Definition of Done (DoD)

### Para Testes Unitários

- [ ] Cobertura de linha ≥ 80% no módulo
- [ ] Cobertura de branch ≥ 70%
- [ ] Caminho feliz testado
- [ ] Ao menos 2 caminhos de erro testados
- [ ] Nomeclatura: `should_ExpectedBehavior_When_StateUnderTest`
- [ ] Sem `if/for` nos testes (usar `test.each`)
- [ ] Independente de ordem de execução

### Para Testes de Componentes

- [ ] Renderização básica testada
- [ ] Interações do usuário testadas
- [ ] Estados (loading, error) testados
- [ ] Acessibilidade testada (keyboard, ARIA)
- [ ] Sem `setTimeout` (usar `waitFor`)

### Para Testes de API

- [ ] Autenticação testada (200, 401, 403)
- [ ] Validação testada (400)
- [ ] Recursos não encontrados (404)
- [ ] Conflitos (409)
- [ ] Erro interno (500)

### Para Testes E2E

- [ ] Fluxo completo testado
- [ ] Dados criados e limpos
- [ ] Esperas explícitas (sem `setTimeout`)
- [ ] Screenshots em falha (configurado no Playwright)
- [ ] Vídeo em falha (configurado no Playwright)

---

## Comandos

```bash
pnpm test              # Jest (unitário)
pnpm test:watch        # Jest watch mode
pnpm test:coverage     # Jest com coverage
pnpm test:components   # Jest (componentes)
pnpm test:e2e          # Playwright
pnpm test:mutation     # Stryker (mutation testing)
```

---

## Templates

### Template de Teste de API

**Arquivo:** `tests/api-route.template.test.ts`

Copie e adapte para cada nova API route.

### Template de Teste de Componente

**Arquivo:** `tests/component.template.test.tsx`

Copie e adapte para cada novo componente.

---

## Caracterization Tests (Legado)

Para módulos legados, use o modo `--legacy`:

```markdown
/qa --legacy src/services/matchService.ts

## Tarefa: Characterization Tests

Criar testes que capturam o comportamento OBSERVADO:
- [ ] Fluxo principal
- [ ] Caminhos de erro
- [ ] Edge cases
- [ ] Marcar suspeitas com // SUSPECT: TD-XXX

Meta: ≥70% linha, ≥60% branch
```

**Guia completo:** `docs/CHARACTERIZATION_TESTS.md`

---

## Mutant Testing

**Config:** `stryker.config.json`

**Meta:** Mutation score ≥ 60%

**Comando:** `pnpm test:mutation`

---

## Referências

- `docs/CHARACTERIZATION_TESTS.md` — Guia de characterization tests
- `AGENTS.md` — Multi-agent spec
- `docs/ROADMAP.md` — Cronograma de adoção
- `jest.config.js` — Config Jest
- `playwright.config.ts` — Config Playwright
- `stryker.config.json` — Config Stryker