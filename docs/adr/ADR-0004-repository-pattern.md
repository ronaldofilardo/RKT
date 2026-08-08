# ADR-0004: Repository Pattern + Dependency Injection

**Status:** Proposed
**Data:** 2026-08-06
**Owner:** @arquitetura
**Supersedes:** —
**Depends on:** ADR-0001, ADR-0003, F1 (ports)
**Companion of:** ADR-0003 (Strategy Pattern)

---

## Contexto

O rkt usa **PrismaClient como singleton global** (`src/lib/prisma.ts:6`), importado diretamente em **6 services de produção** e em múltiplas API routes:

| Arquivo | Import direto |
|---|---|
| `src/services/matchService.ts:1-2` | `import { prisma } from '@/lib/prisma'` + tipo `PrismaClient` |
| `src/services/matchRepository.ts:1` | `import { prisma } from '@/lib/prisma'` |
| `src/services/matchSuggestionService.ts:1-4` | singleton `prisma` |
| `src/services/playerService.ts:1-3` | singleton + `Prisma` namespace |
| `src/services/adminService.ts:1` | singleton |
| `src/services/sessionService.ts:1-3` | singleton + `logger` (cross-cutting) |
| `src/app/api/matches/[id]/route.ts:3` | singleton ( route re-implementa queries repo ) |
| `src/app/api/matches/[id]/state/route.ts:6` | singleton (findUnique) |
| `src/app/api/matches/route.ts:3` | singleton (abre tx Prisma dentro do controller) |

**Problemas concretos:**

1. **DIP violado:** services dependem de concreta ( PrismaClient ) em vez de abstrações.
2. **Testabilidade baixa:** toda suíte faz `jest.mock('@/lib/prisma')` (cf. `adminService.test.ts:1`, `matchService.characterization.test.ts:569`) — acoplamento frágil a símbolos do singleton.
3. **Inconsistência de transação:** `matchService.createMatch` aceita `tx?: TransactionClient`, mas `updateMatch`/`finishMatch`/`transitionMatchState` não — usam singleton direto. Mesma lógica comporta-se diferente em diferentes métodos do mesmo service.
4. **Route vira service:** controllers HTTP abrem transações Prisma inline ( `app/api/matches/route.ts:53`, `app/api/matches/[id]/point/route.ts` ) — camada de transporte usa Prisma direto.
5. **`prisma.$use(...)` deprecated:** `src/lib/prisma.ts:10` usa middleware extension deprecated desde Prisma 4.16+ para RLS — deve migrar para client extensions.
6. **Mocking complexo:** testes que precisam simular erro Prisma ( P2025, P2002 ) dependem de tipagem interna de Prisma.

### Forças em jogo

- **DIP (Dependency Inversion Principle):** services devem depender de interfaces, não concreções
- **Testabilidade:** substituir Prisma em testes por mocks da interface (não do singleton)
- **Flexibilidade operacional:** swap de implementação ( ex.: prisma → drizzle ) sem rippling por services
- **Coerência transacional:** tx policy uniforme via Unit of Work ou TransactionManager
- **Migração incremental:** 6 services + várias routes não podem quebrar de uma vez
- **Serverless-friendly:** adapters stateless; composition root por request se necessário

---

## Decisão

Adotar **Repository Pattern** com interfaces de porta em `src/lib/ports/` (companion do `src/lib/ports/` já criado em F1.2 com `ILogger`, `IHasher`, `IJwtSigner`). Adapters Prisma em `src/infrastructure/prisma/`. Services recebem dependências via factory function (constructor injection sem framework DI).

### Portas

```typescript
// src/lib/ports/match.repository.port.ts
import type { Match, Prisma } from '@prisma/client';

export interface IMatchRepository {
  findById(id: string): Promise<Match | null>;
  list(options?: { cursor?: string; limit?: number }): Promise<Match[]>;
  create(data: Prisma.MatchCreateInput, tx?: ITransaction): Promise<Match>;
  update(id: string, data: Prisma.MatchUpdateInput, tx?: ITransaction): Promise<Match>;
  softDelete(id: string, tx?: ITransaction): Promise<void>;
  hardDelete(id: string, tx?: ITransaction): Promise<void>;
}
```

Outras portas: `IPlayerRepository`, `ISessionRepository`, `IUserRepository`. Mesma estrutura.

### Transaction abstraction

```typescript
// src/lib/ports/transaction.port.ts
export interface ITransaction {
  // marker interface — allows passing tx client without leaking PrismaClient type
}

// src/lib/ports/unit-of-work.port.ts
export interface IUnitOfWork {
  withTransaction<T>(work: (tx: ITransaction) => Promise<T>): Promise<T>;
}
```

`PrismaUnitOfWork` adapta para `prisma.$transaction(fn)`.

### Adapters

```
src/infrastructure/prisma/
├── PrismaMatchRepository.ts
├── PrismaPlayerRepository.ts
├── PrismaSessionRepository.ts
├── PrismaUserRepository.ts
├── PrismaUnitOfWork.ts
└── index.ts
```

Cada adapter implementa a interface correspondente usando `PrismaClient` internamente. Accepta `tx?: ITransaction` que internamente faz cast controlado para `Prisma.TransactionClient` (único lugar que conhece Prisma).

### Composition root

```typescript
// src/lib/composition.ts
import { prisma } from './prisma';
import { PrismaMatchRepository } from '@/infrastructure/prisma/PrismaMatchRepository';

const matchRepo = new PrismaMatchRepository(prisma);

const matchService = createMatchService({ matchRepo, hasher: defaultHasher, logger: defaultLogger });

// factories também exportadas para testes
export function createMatchService(deps: { matchRepo: IMatchRepository; ... }) {
  return {
    createMatch: (data, user) => matchService_createMatch(deps, data, user),
    updateMatch: (id, patch) => matchService_updateMatch(deps, id, patch),
    // ...
  };
}
```

### Migration path

Inventamos path incremental em **4 sub-fases** (executado por F3):

1. **F3.1 (Wrapping):** Criar portas + adapters Prisma que envolvem as queries atuais de `matchRepository.ts`. Services ainda importam `prisma` diretamente; nada sai do ar.Rodamos testes de caracterização — mesmas queries Prisma emitidas.
2. **F3.2 (Diagonally):** Introduzir composition root `src/lib/composition.ts` com singleton defaults (`defaultMatchRepo`, etc.). Services começam a aceitar deps via factory function opcional — defaults mantêm comportamento atual.
3. **F3.3 (Route migration):** Migrar routes para usar services via composition (acabar com `prisma` direct imports em routes).
4. **F3.4 (Test cleanup):** Substituir `jest.mock('@/lib/prisma')` por `new InMemoryMatchRepository()` ou mock fácil da interface. Eliminar `jest.mock` de Prisma em >10 testes.

### Transaction policy

Padrão único via `IUnitOfWork.withTransaction`:
- `matchService.updateMatch` → wrap em tx (hoje é update solto — race condition)
- `matchService.finishMatch` → wrap em tx (hoje é update solto — dois finish simultâneos sobrescrevem winnerId)
- `matchService.transitionMatchState` → wrap em tx (`findFirst + update` atômicos)
- `sessionService.updateSession` → wrap em tx (sem version field hoje)
- `sessionService.createEndorsement` → wrap em tx + uniqueness check

### Deprecação do `$use` RLS

Substituir `prisma.$use(...)` por **Prisma client extensions**:

```typescript
const prisma = new PrismaClient().$extends({
  query: {
    $allOperations: async ({ model, operation, args, query }) => {
      const user = getRLSUser();
      if (user) {
        // inject RLS filter
      }
      return query(args);
    },
  },
});
```

(Veja `docs/adr/TD-003-RLS-REFACTOR.md` para contexto.)

---

## Consequências

### Positivas

- ✅ Services dependem de abstrações (DIP respeitado).
- ✅ Testes substituem impledb em memória (eliminam `jest.mock` de Prisma).
- ✅ Transaction policy uniforme via UoW — elimina race conditions em update/finish/transition.
- ✅ Swap de ORM (Prisma → Drizzle/Postgres.js) limita-se a `infrastructure/`.
- ✅ Routes ficam thin controllers (pré-requisito para F4 use-cases).
- ✅ Depreciação do `$use` → client extensions (mantém suporte Prisma 5+).

### Negativas

- ⚠️ Superfície de código cresce: 4 portas + 4 adapters + UoW + composition root.
- ⚠️ Migrar 6 services + múltiplas routes tomando 4 sub-fases é esforço não-trivial ( estim. 1-2 sprints ).
- ⚠️ Adapters Prisma precisam machenhar tipos de complexidade Prisma ( `Prisma.InputJsonValue`, etc. ).

### Neutras

- ➕ `src/infrastructure/` nunca existiu; agora há um novo dire-tório de camada de infra.
- ➕ Composition root explícito substitui imports diretos de `prisma` singleton.

---

## Alternativas consideradas

| Alternativa | Prós | Contras | Decisão |
|---|---|---|---|
| **A. Manter singleton + jest.mock** (status quo) | Zero migração | DIP violado, tests frágeis, race conditions P1, $use deprecated | Descartada |
| **B. Service Locator pattern** | Centralização simples | Anti-pattern conhecido (testabilidade baixa) | Descartada |
| **C. InversifyJS / TSyringe** | DI container real | Overkill para Next.js app router serverless; indirection sem ganho | Descartada |
| **D. DI manual via factory function** (ESCOLHIDA) | Simples, sem runtime overhead, explicit | Boilerplate por service | ✅ |
| **E. Apenas UoW (sem Repository)** | Resolve tx inconsistency | Não resolve DIP nem teste frágil | Descartada |

---

## Fitness Functions

| NFR | Meta | Como Medir |
|---|---|---|
| DIP | 0 imports `from '@/lib/prisma'` em `src/services/` | `rg "from '@/lib/prisma'" src/services` |
| DIP | 0 imports `from '@/lib/prisma'` em `src/app/api/**/route.ts` | `rg` similarly |
| Testabilidade | ≥1 test suite com InMemory*Repository | Jest |
| Multi-ORM | Adapter Prisma isolado em `src/infrastructure/` | Estrutura |
| Deprecation | 0 uso de `$use` | `rg '\.\$use\('` |
| Tx coerência | update/finish/transition/endosrse todos warpados em tx | Auditoria |

---

## Handoff para @backend

Após aprovação:

1. **F3.1 Wrapping** (@backend):
   - Criar `src/lib/ports/{match,player,session,user}.repository.port.ts`
   - Criar `src/lib/ports/transaction.port.ts` + `unit-of-work.port.ts`
   - Criar `src/infrastructure/prisma/PrismaMatchRepository.ts` etc.
   - Validar: characterization tests verdes (mesmas queries Prisma emitidas).

2. **F3.2 Composition root** (@backend):
   - Criar `src/lib/composition.ts` com singletons defaults.
   - Refatorar services para aceitar deps via factory function (defaults preservam comportamento).

3. **F3.3 Route migration** (@backend):
   - Eliminar `prisma` direct imports em todas routes.
   - Routes usam `composition.ts` ou recebem services via props/params.

4. **F3.4 Test cleanup** (@qa):
   - Substituir `jest.mock('@/lib/prisma')` por InMemory adapters ou mock simples de portas.
   - Eliminar frágil tie a símbolos Prisma interna.

5. **Deprecate `$use`** (@backend):
   - Migrar para client extensions para RLS (ver `TD-003-RLS-REFACTOR.md`).

---

## Referências

- `src/lib/prisma.ts:6,10` — singleton + `$use` deprecated
- `src/services/matchService.ts:1-2` — exemplo do import direto
- `src/app/api/matches/route.ts:53` — exemplo de tx Prisma em controller
- `src/lib/ports/index.ts` — composition root já criado em F1.2 (ILogger/IHasher/IJwtSigner)
- `docs/adr/ADR-0003-match-format-strategy.md` — companion ADR
- `docs/adr/TD-003-RLS-REFACTOR.md` — RLS refactor (relacionado a `$use`)
- `docs/REFACTOR_QUEUE.md` — F1.3 (este ADR) e F3 (execução)
