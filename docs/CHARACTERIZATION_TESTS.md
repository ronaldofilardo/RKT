# Onda 1.5 — Characterization Tests (Rede de Segurança)

**Gerado em:** 2026-07-20  
**Por:** @qa  
**Status:** Pré-requisito para qualquer refactor

---

## Propósito

Characterization tests **NÃO testam se o código está certo**.  
Eles testam **o que o código FAZ** (comportamento observado), mesmo que tenha bugs.

**Analogia:** É como tirar uma foto do comportamento atual antes de pintar por cima.

---

## Quando Usar

| Situação | Ação |
|----------|------|
| Vai refatorar módulo legado? | ✅ Characterization tests ANTES |
| Vai adicionar feature em módulo existente? | ✅ Characterization tests ANTES |
| Módulo tem bug crítico em produção? | ✅ Characterization tests do bug primeiro |
| Só quer "limpar" código sem mudar comportamento? | ✅ Characterization tests OBRIGATÓRIO |

**Regra de Ouro:** Nenhum refactor no legado sem characterization tests verdes primeiro.

---

## Como Invocar

```markdown
/qa --legacy <caminho-do-módulo>

## Exemplos:

/qa --legacy src/services/matchService.ts
/qa --legacy src/components/scoring/EditScoreModal.tsx
/qa --legacy src/app/api/matches/route.ts
```

---

## Processo de Characterization Tests

### Passo 1: Mapear Comportamentos Observados

**Técnicas:**
1. **Leitura do código:** o que cada função faz?
2. **Logs de produção:** quais erros/comportamentos são comuns?
3. **Issues/bugs:** quais problemas já foram reportados?
4. **Testes existentes:** o que já está coberto?

**Output:** Lista de comportamentos a capturar.

### Passo 2: Escrever Testes "Dumb"

**Características:**
- ✅ Testa o que o código FAZ, não o que DEVERIA fazer
- ✅ Aceita comportamentos estranhos (marca com `// SUSPECT`)
- ✅ Usa dados reais (ou próximos do real)
- ✅ Verde contra o código atual (sem refactor)

**Exemplo:**

```typescript
// src/services/__tests__/matchService.characterization.test.ts

describe('matchService (characterization)', () => {
  describe('createMatch', () => {
    it('deve criar partida com formato BEST_OF_3 quando format=BEST_OF_3', async () => {
      // Comportamento observado: cria normalmente
      const match = await matchService.createMatch({
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
      });

      expect(match.format).toBe('BEST_OF_3');
      expect(match.state).toBe('SCHEDULED');
    });

    it('deve retornar erro DUPLICATE_MATCH se partida já existe', async () => {
      // Comportamento observado: verifica duplicidade
      await matchService.createMatch({ player1Id: 'p1', player2Id: 'p2', format: 'BEST_OF_3' });
      
      await expect(
        matchService.createMatch({ player1Id: 'p1', player2Id: 'p2', format: 'BEST_OF_3' })
      ).rejects.toThrow('DUPLICATE_MATCH');
    });

    it('SUSPECT: não valida se player1 === player2 (possível bug)', async () => {
      // Comportamento observado: permite criar partida contra si mesmo
      // Isso é um bug? Se for, criar issue e marcar TECH_DEBT
      const match = await matchService.createMatch({
        player1Id: 'p1',
        player2Id: 'p1', // MESMO jogador
        format: 'BEST_OF_3',
      });

      // Teste captura o comportamento atual (bug ou não)
      expect(match).toBeDefined();
      // SUSPECT: Deveria validar player1 !== player2?
    });
  });
});
```

### Passo 3: Marcar Suspeitas

**No código do teste:**
```typescript
// SUSPECT: TD-XXX - Comportamento estranho: permite player1 === player2
// Issue: #123 - Criar validação para impedir partida contra si mesmo
```

**Em TECH_DEBT.md:**
```markdown
### [TD-XXX] Validação missing: player1 === player2
- **Detectado em:** Characterization tests de `matchService.createMatch`
- **Impacto:** Baixo (improvável acontecer)
- **Proposta:** Adicionar validação `player1Id !== player2Id`
- **Gatilho:** Próxima modificação em `createMatch`
```

### Passo 4: Medir Cobertura

**Meta:** ≥70% linha, ≥60% branch no módulo

**Comandos:**
```bash
pnpm test -- --coverage --coveragePathPattern=matchService
```

**Relatório:**
```
matchService.ts
  Lines: 75% (150/200)
  Branches: 65% (45/69)
  
  Protegido:
  ✅ createMatch (fluxo principal)
  ✅ createMatch (validação)
  ✅ createMatch (duplicidade)
  ✅ finishMatch (completo)
  ✅ finishMatch (walkover)
  
  Não protegido:
  ❌ updateMatch (nenhum teste)
  ❌ deleteMatch (nenhum teste)
  ❌ resumeMatch (edge cases)
  
  Motivo:
  - updateMatch: será usado em feature futura (RF-XXX)
  - deleteMatch: legado, será removido em ADR-XXX
```

### Passo 5: Handoff

**Se testes verdes + cobertura OK:**
```markdown
## Handoff

✅ Characterization tests completos para `matchService.ts`
- Cobertura: 75% linha, 65% branch
- Suspeitas: 3 (listadas em TECH_DEBT.md: TD-XXX, TD-YYY, TD-ZZZ)
- Pronto para refactor → @backend

RF-XXX: Refatorar matchService (criação de partida)
RF-YYY: Adicionar validação player1 !== player2
```

---

## Módulos Prioritários para Characterization Tests

Baseado em `CURRENT_STATE.md` e `docs/TECH_DEBT.md`:

### Nível 1 (Crítico — Refatorar em Breve)

| Módulo | Motivo | Dívidas Relacionadas |
|--------|--------|---------------------|
| `src/services/matchService.ts` | RF-004 (RLS), RF-005 (Validação) | TD-003, TD-002 |
| `src/lib/rls-context.ts` | RF-004 (RLS centralizado) | TD-003 |
| `src/app/api/matches/route.ts` | RF-001 (JWT_SECRET), RF-005 (Validação) | TD-008, TD-002 |

### Nível 2 (Alto — Feature Nova Prevista)

| Módulo | Motivo | Dívidas Relacionadas |
|--------|--------|---------------------|
| `src/components/scoring/EditScoreModal.tsx` | RF-002 (Extrair componentes) | TD-011 |
| `src/components/scoring/PointDetailsModal.tsx` | RF-003 (Extrair componentes) | TD-011 |
| `src/core/scoring/**` | RF-007 (Isolar scoring engine) | TD-007 |

### Nível 3 (Médio — Quando Tocar)

| Módulo | Motivo | Dívidas Relacionadas |
|--------|--------|---------------------|
| `src/services/playerService.ts` | Uso frequente | TD-002 |
| `src/app/api/players/route.ts` | RF-006 (Paginação) | TD-004 |
| `src/app/api/admin/users/route.ts` | RF-006 (Paginação) | TD-004 |

---

## Template de Characterization Test

```typescript
// src/[path]/__tests__/[module].characterization.test.ts

/**
 * CHARACTERIZATION TESTS — {module}
 * 
 * Propósito: Capturar comportamento OBSERVADO (não o "deveria ser")
 * Data: YYYY-MM-DD
 * Owner: @qa
 * 
 * Comportamentos suspeitos:
 * - // SUSPECT: TD-XXX — descrição
 * - // SUSPECT: TD-YYY — descrição
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { [module] } from '../[module]';
// Imports de helpers, factories, etc.

describe('[module] (characterization)', () => {
  beforeEach(async () => {
    // Setup: criar dados necessários
    // Usar factories: createTestPlayer(), createTestMatch(), etc.
  });

  describe('[function/method]', () => {
    it('deve [comportamento esperado] quando [condição]', async () => {
      // Arrange
      // ...

      // Act
      const result = await [function](...);

      // Assert
      expect(result).toMatchObject({
        // Comportamento observado
      });
    });

    it('SUSPECT: [descrição do comportamento estranho]', async () => {
      // Testa o bug/estranheza como comportamento válido
      // Comentar explicitamente: // SUSPECT: TD-XXX — descrição

      const result = await [function](...);
      
      expect(result).toBeDefined();
      // SUSPECT: TD-XXX — Deveria lançar erro? Deveria validar X?
    });

    it('deve lançar erro [X] quando [condição de erro]', async () => {
      // Arrange
      // ...

      // Act & Assert
      await expect([function](...)).rejects.toThrow('[ErrorName]');
    });
  });
});
```

---

## Helpers para Characterization Tests

### `tests/helpers.ts`

```typescript
import { Player, Match, MatchAnnotationSession } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sign } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

/**
 * Factory: Player
 */
export async function createTestPlayer(overrides?: Partial<Player>): Promise<Player> {
  const player = await prisma.player.create({
    data: {
      name: 'Test Player',
      email: `test-${Date.now()}@example.com`,
      role: 'ATHLETE',
      passwordHash: 'hashed_password',
      ...overrides,
    },
  });
  return player;
}

/**
 * Factory: Match
 */
export async function createTestMatch(overrides?: {
  player1Id?: string;
  player2Id?: string;
  format?: string;
  state?: string;
}): Promise<Match> {
  const [player1, player2] = await Promise.all([
    createTestPlayer({ email: `p1-${Date.now()}@example.com` }),
    createTestPlayer({ email: `p2-${Date.now()}@example.com` }),
  ]);

  const match = await prisma.match.create({
    data: {
      player1Id: player1.id,
      player2Id: player2.id,
      format: overrides?.format ?? 'BEST_OF_3',
      state: overrides?.state ?? 'SCHEDULED',
      sportType: 'TENNIS',
      visibility: 'PUBLIC',
    },
  });

  return match;
}

/**
 * Factory: Annotation Session
 */
export async function createTestSession(
  matchId: string,
  annotatorId: string
): Promise<MatchAnnotationSession> {
  const session = await prisma.matchAnnotationSession.create({
    data: {
      matchId,
      annotatorUserId: annotatorId,
      status: 'IN_PROGRESS',
      isActive: true,
    },
  });
  return session;
}

/**
 * Helper: Criar token JWT para autenticação
 */
export async function createAuthHeader(player: Player): Promise<Record<string, string>> {
  const token = await sign(
    { sub: player.id, role: player.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    authorization: `Bearer ${token}`,
  };
}

/**
 * Helper: Cleanup pós-teste
 */
export async function cleanup() {
  await prisma.annotationEndorsement.deleteMany();
  await prisma.matchAnnotationSession.deleteMany();
  await prisma.pointLog.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
}
```

---

## Checklist de Characterization Tests

Antes de handoff para @backend:

- [ ] **Testes verdes:** `pnpm test` passa sem erros
- [ ] **Cobertura ≥70% linha:** no módulo alvo
- [ ] **Cobertura ≥60% branch:** no módulo alvo
- [ ] **Suspeitas marcadas:** `// SUSPECT: TD-XXX` nos testes
- [ ] **TECH_DEBT atualizado:** itens criados para suspeitas
- [ ] **Relatório de cobertura:** listado o que está/não está protegido
- [ ] **Handoff claro:** instrução para @backend sobre o que refactorar

---

## Exemplo Real: matchService

**Invocação:**
```markdown
/qa --legacy src/services/matchService.ts
```

**Tarefa:**
```markdown
## Characterization Tests: matchService

Criar testes que capturam comportamentos observados:

### createMatch
- [ ] Cria partida com formato válido
- [ ] Valida input com Zod schema
- [ ] Verifica duplicidade (player1, player2, scheduledAt)
- [ ] Retorna erro DUPLICATE_MATCH se existir
- [ ] SUSPECT: Não valida player1 !== player2

### finishMatch
- [ ] Finaliza partida com winnerId
- [ ] Valida que partida está IN_PROGRESS
- [ ] Valida que scoring está completo (isFinished)
- [ ] Atualiza state para FINISHED
- [ ] SUSPECT: Permite finalizar sem winnerId (walkover?)

### updateMatch
- [ ] Atualiza campos permitidos
- [ ] Valida state transitions
- [ ] SUSPECT: Quais campos são atualizáveis?

### deleteMatch
- [ ] Soft delete (deletedAt)
- [ ] Valida permissão (role)
- [ ] SUSPECT: Permite delete de partida FINISHED?

Output:
- src/services/__tests__/matchService.characterization.test.ts
- Cobertura: X% linha, Y% branch
- Suspeitas: N (listadas em TECH_DEBT)
```

---

## Referências

- `docs/TECH_DEBT.md` — Dívidas técnicas (priorizar characterization dos módulos com TD crítico)
- `docs/REFACTOR_QUEUE.md` — RF-XXX (refatorações pendentes)
- `tests/helpers.ts` — Helpers de teste (factories, cleanup)
- `AGENTS.md` — Regra de fronteira (código legado só é tocado com characterization antes)