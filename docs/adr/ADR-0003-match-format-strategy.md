# ADR-0003: Strategy Pattern para TennisFormat

**Status:** Proposed
**Data:** 2026-08-06
**Owner:** @arquitetura
**Supersedes:** —
**Depends on:** ADR-0001, F1 (ILogger)

---

## Contexto

O domínio de placar do rkt suporta 7 formatos de partida:

| Formato | Descrição |
|---|---|
| `BEST_OF_3` | Melhor de 3 sets, set final com tiebreak |
| `BEST_OF_3_NO_AD` | Melhor de 3 sets, sem advantage, sem tiebreak no set final |
| `BEST_OF_3_MATCH_TB` | Melhor de 3 sets, set final substituído por match tiebreak (10 pontos) |
| `BEST_OF_5` | Melhor de 5 sets |
| `MATCH_TB_10` | Partida inteira = tiebreak de 10 pontos (super tiebreak) |
| `PRO_SET_8` | Pro set até 8 games, tiebreak em 8x8 |
| `SHORT_SET_2V2_NO_AD` | Set curto (4 games), 2v2, sem advantage |

**Problema:** As regras para cada formato estão dispersas em **5 switches** no domínio (`engine.flow.ts:493` `getSetsToWin`, `:515` `getGamesToTiebreak`, `:506` `usesNoAd`, `:510` `isFinalSet`, `:525` `isMatchTiebreakActive`), **uma tabela paralela** em `lib/matchConfig.ts:35` (`FORMAT_DEFINITIONS`), **3 switches Helper** em `components/scoring/editScoreHelpers.ts:30,43,202` (`setsToWinForFormat`, `totalSetsForFormat`, `getTiebreakAtForFormat`), e **duas implementações duplicadas** em `hooks/useSessionManager.utils.ts:144` (`isMatchTiebreakSet`) e `lib/matchConfig.ts:148` (`isMatchTiebreakFormatType`).

**Consequência:** Adicionar um novo formato (ex.: `BEST_OF_5_NO_AD` proposta em agenda) requer editar **8+ locais** com risco de inconsistência. Inconsistências já existem hoje: `engine.flow.ts:getSetsToWin` retorna `3` para `BEST_OF_3_NO_AD`, mas `editScoreHelpers.ts:setsToWinForFormat` **não** inclui este formato —调味 comportamento divergente entre frontend e engine (P0).

### Forças em jogo

- **OCP (Open-Closed Principle):** adicionar formato deve ser aditivo, não invasivo
- **Single source of truth:** um formato = uma implementação do seu comportamento
- **Type safety:** eliminar `as any` em `engine.flow.ts:526`, `matchService.ts:233,302`, `matchValidator.ts:111,113` (seis sites)
- **Testabilidade:** testes por formato isolados instead of switch matrix
- **Performance:** estratégia é lookup O(1) por chave, não `switch` linearizado
- **Migração incremental:** 38 callers de `new ScoringEngine(...)` não podem quebrar

---

## Decisão

Adotar **Strategy Pattern** com **Registry** para `TennisFormat`. Cada formato é uma implementação concreta da interface `MatchFormatStrategy`, registrada em `MatchFormatRegistry`. A engine do domínio recebe a strategy via composition root (lookup por `format`).

### Interface

```typescript
// src/core/scoring/formats/match-format-strategy.ts

import type { SetScore, GameScore, ScoringState } from '../types';

export interface MatchFormatStrategy {
  readonly format: TennisFormat;
  readonly setsToWin: number;
  readonly gamesToTiebreak: number;   // 0 = sem tiebreak
  readonly usesNoAd: boolean;
  readonly isMatchTiebreak: boolean;    // partida inteira é um tiebreak
  readonly initialGames: number;         // games iniciados em 0 vs 2 (doubles)

  // Set final tem rules diferentes? (ex.: melhor de 3 com tiebreak no final)
  isFinalSet(setIndex: number, totalSetsPlayed: number): boolean;

  // O set atual está habilitado para tiebreak?
  isTiebreakActiveForSet(set: SetScore, isFinalSet: boolean): boolean;

  // Override default do initial games para este formato?
  getInitialGames(): number;
}
```

### Registry

```typescript
// src/core/scoring/formats/match-format-registry.ts

export class MatchFormatRegistry {
  private readonly strategies: Map<TennisFormat, MatchFormatStrategy> = new Map();

  register(strategy: MatchFormatStrategy): void {
    if (this.strategies.has(strategy.format)) {
      throw new Error(`DUPLICATE_FORMAT_STRATEGY: ${strategy.format}`);
    }
    this.strategies.set(strategy.format, strategy);
  }

  resolve(format: TennisFormat): MatchFormatStrategy {
    const s = this.strategies.get(format);
    if (!s) throw new Error(`UNKNOWN_FORMAT: ${format}`);
    return s;
  }
}

export const matchFormatRegistry = new MatchFormatRegistry();
```

### Composição

Cada formato em seu próprio arquivo, registrado por side-effect de `import`:

```
src/core/scoring/formats/
├── match-format-strategy.ts       (interface)
├── match-format-registry.ts       (singleton + lookup)
├── best-of-3.strategy.ts
├── best-of-3-no-ad.strategy.ts
├── best-of-3-match-tb.strategy.ts
├── best-of-5.strategy.ts
├── match-tb-10.strategy.ts
├── pro-set-8.strategy.ts
├── short-set-2v2-no-ad.strategy.ts
└── index.ts                        (importa todos = registra)
```

### Engine

`ScoringEngine` passa a receber `MatchFormatStrategy` no construtor ( HID ACL : `ScoringEngineConfig` expõe apenas `format: TennisFormat`; engine resolve via registry internamente ou recebe a strategy injetada — optamos pela resolução interna para manter API pública dos 38 callers atualmente intactos).

`engine.flow.ts:493-545` (5 switches) é colapsado para:

```typescript
const strategy = matchFormatRegistry.resolve(config.format);
const setsToWin = strategy.setsToWin;
const gamesToTiebreak = strategy.gamesToTiebreak;
const usesNoAd = strategy.usesNoAd;
// etc — sem switch
```

### Migration path

1. **Caracterização prévia** (@qa): snapshot dos 11 testes de `core/scoring/__tests__/` como contratos de saída.
2. Implementar `MatchFormatStrategy` + 7 strategies (F2.1).
3. Substituir métodos de `engine.flow.ts` por lookups registry.
4. Eliminar `lib/matchConfig.ts:FORMAT_DEFINITIONS` reexportando strategy como source-of-truth.
5. Eliminar `editScoreHelpers.ts:30,43,202` — substituir por `matchFormatRegistry.resolve(format)`.
6. Eliminar `useSessionManager.utils.ts:144` e `matchConfig.ts:148` (duplicados).
7. Eliminar `as any` em `format` casts (seis sites) — `MatchFormat` (Prisma enum) e `TennisFormat` (schema) tornam-se o mesmo tipo.
8. Guards: `UNKNOWN_FORMAT` → 400 em vez de `as any` swallowing.

---

## Consequências

### Positivas

- ✅ Adicionar formato → adicionar um arquivo + 1 import em `index.ts`. Sem tocar engine.
- ✅ Elimina 5 switches e 3 tabelas paralelas ( inconsistent today).
- ✅ Elimina 6 casts `as any` em `format` (relaciona com F8 type safety).
- ✅ Testes por formato isolados em `<format>.strategy.test.ts`.
- ✅ Performance: lookup O(1) por `Map.get` em vez de switch linearizado.

### Negativas

- ⚠️ Curto prazo: 38 callers de `new ScoringEngine` não mudam, mas a fábrica fica latente. Recomendar `EngineFactory` (A D R - 0004 ) para callers novos.
- ⚠️ StrategyRegistry global como módulo-singleton tem side-effect de import — testes precisam controlar ordem de importação (menor problema, mas real).
- ⚠️ Surface area do domínio cresce de 1 arquivo ( `engine.flow.ts` com switches ) para 10 arquivos (7 strategies + interface + registry + index). Considerado aceite por legibilidade.

### Neutras

- ➕ `EngineFactory` (ADR-0004 logo abaixo, em conjunto) — Factory que cria `ScoringEngine` a partir de `Match` (persistido), abstraindo normalização `as any`.

---

## Alternativas consideradas

| Alternativa | Prós | Contras | Decisão |
|---|---|---|---|
| **A. Manter switches + tabela paralela** (status quo) | Zero migração | 8+ toques por novo formato, inconsistência já documentada | Descartada |
| **B. Apenas tabela paralela em `matchConfig.ts`** | Single source parcial | Não resolve ISP/localização de comportamento por formato; `isTiebreakActiveForSet` depende de estado, não é dado puro | Descartada |
| **C. Polimorfismo com classes em vez de objetos** | Constructor real | Não há estado mutável por formato — composition é style overhead | Descartada |
| **D. Strategy com Registry (ESCOLHIDA)** | Single source, OCP, eliminable casts, testes por formato | Surface area cresce | ✅ |
| **E. Plugin/dynamic import por formato** | Hyper-extensível | Overkill, perde type safety | Descartada |

---

## Fitness Functions

| NFR | Meta | Como Medir |
|---|---|---|
| OCP | Novo formato < 1 arquivo + 1 import | Revisão pós-implementação |
| Type safety | 0 casts `as any` em `format` em `core/` `services/` | `rg -n "format as any" src/core src/services` |
| Cobertura | Cada formato com ≥ 1 test suite dedicado | Jest --coverage para `formats/` |
| Performance | Registry lookup < 1μs | Benchmark |
| Consistência | `editScoreHelpers.setsToWinForFormat(format) === strategy.setsToWin` | Property-based test |

---

## Handoff para @backend

Após aprovação deste ADR pela governança:

1. **Caracterização** (@qa): gerar snapshot do output atual de `pnpm test -- core/scoring` para os 7 formatos.
2. **Implementação** (@backend):
   - `src/core/scoring/formats/match-format-strategy.ts` — interface
   - `src/core/scoring/formats/match-format-registry.ts` — singleton registry
   - 7 implementações em arquivos dedicados
   - `src/core/scoring/formats/index.ts` — registra todas
   - Refatorar `engine.flow.ts` para usar registry (eliminar 5 switches)
   - Refatorar `lib/matchConfig.ts:FORMAT_DEFINITIONS` para expor registry
   - Refatorar `components/scoring/editScoreHelpers.ts:30,43,202` e `hooks/useSessionManager.utils.ts:144` para chamar registry
   - Eliminar 6 casts `as any` em `format`
3. **Testes** (@qa):
   - `formats/<format>.strategy.test.ts` — assertions, propriedades, edge cases
   - Manter characterization suites verdes

---

## Referências

- `src/core/scoring/engine.flow.ts:493-545` — switches atuais
- `src/lib/matchConfig.ts:35-110` — FORMAT_DEFINITIONS (table paralela)
- `src/components/scoring/editScoreHelpers.ts:30,43,202` — switches paralelos
- `src/hooks/useSessionManager.utils.ts:144` — duplicação de `isMatchTiebreakSet`
- `docs/adr/ADR-0004-repository-pattern.md` ( subsequente ) — Factory companion
- `docs/REFACTOR_QUEUE.md` — F1.3 e F2
