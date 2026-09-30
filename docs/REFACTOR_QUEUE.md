# Refactor Queue

**Data de Geração:** 2026-07-20  
**Gerado por:** @qa  
**Última Atualização:** 2026-07-20 (Refatoração completa - Fase 2)  
**Status:** ✅ Completed (Fase 2)

---

## ✅ COMPLETED - Refatoração de Hooks (2026-07-20)

### useScoringHandlers.ts (577 → ~300 linhas)
**Status:** ✅ Refatorado  
**Arquivos criados:**
- `src/hooks/useScoringHandlers.point-sync.ts` - Serviço de sync online/offline
- `src/hooks/useScoringHandlers.modals.service.ts` - Serviço de modal handlers
- `src/hooks/useScoringHandlers.server-helpers.service.ts` - Serviço de server/winner helpers

**Redução:** ~277 linhas extraídas para serviços  
**Testes:** ✅ 69 testes passando

### useSessionManager.ts (469 → ~200 linhas)
**Status:** ✅ Refatorado  
**Arquivos criados:**
- `src/hooks/useSessionManager.match-finish.ts` - Serviço de match finish
- `src/hooks/useSuspendedSession.ts` - Hook dedicado para suspended session

**Redução:** ~269 linhas extraídas para serviços/hooks  
**Testes:** ✅ 8 testes passando

---

## ✅ COMPLETED - Refatoração de Pages (2026-07-20)

### atletas/page.tsx (590 → ~240 linhas)
**Status:** ✅ Refatorado  
**Arquivos criados:**
- `src/app/atletas/EditAthleteModal.tsx` - Componente de modal de edição (260 linhas)
- `src/app/atletas/RankingForm.tsx` - Componente de formulário de ranking (110 linhas)

**Redução:** ~350 linhas extraídas para componentes  
**Benefícios:**
- Separação clara de responsabilidades
- Formulário de edição reutilizável
- RankingForm testável isoladamente

### match/new/page.tsx (574 → ~530 linhas)
**Status:** ✅ Refatorado  
**Arquivos criados:**
- `src/app/match/new/types.ts` - Tipos compartilhados

**Redução:** Pequena redução, foco em organização de tipos  
**Benefícios:**
- Tipos centralizados em arquivo dedicado
- Imports corrigidos em todos os componentes

---

## ✅ COMPLETED - Refatoração de Componentes (2026-07-20)

### EditScoreModal.tsx (531 → ~170 linhas)
**Status:** ✅ Refatorado  
**Arquivos criados:**
- `src/components/scoring/useEditScoreModal.ts` - Hook com lógica de estado e handlers (290 linhas)

**Redução:** ~361 linhas extraídas para hook (-68%)  
**Benefícios:**
- Separação clara entre lógica e UI
- Hook reutilizável e testável
- Componente focado em renderização

---

## Summary Final

| Arquivo Original | Linhas (Antes) | Linhas (Depois) | Redução | Status |
|-----------------|----------------|-----------------|---------|--------|
| useScoringHandlers.ts | 577 | ~300 | -48% | ✅ |
| useSessionManager.ts | 469 | ~200 | -57% | ✅ |
| atletas/page.tsx | 590 | ~240 | -59% | ✅ |
| EditScoreModal.tsx | 531 | ~170 | -68% | ✅ |
| match/new/page.tsx | 574 | ~530 | -8% | ✅ |

**Total de linhas refatoradas:** 2,741 → ~1,440 (-47%)  
**Novos arquivos criados:** 12  
**Testes passando:** 77+  
**Typecheck:** ✅ Passando

---

## ✅ COMPLETED - Logging Service (2026-07-20)

**Arquivo criado:** `src/lib/logger.ts`

**Features:**
- Filtragem por ambiente (development/production)
- Métodos especializados: `log`, `info`, `warn`, `error`, `debug`
- Namespaced loggers: `logger.sync`, `logger.persist`, `logger.match`, `logger.point`, `logger.session`

**Arquivos atualizados:** 6 arquivos de hooks e services

**Benefícios:**
- Logs de debug apenas em development
- Padronização de formato
- Fácil remoção em production

---

## Próximos Passos (Opcional - P3)

### Prioridade P3 (Baixo)
- TODO/FIXME/SUSPECT comments (27 occurrences) - Criar tickets
- Magic numbers - Extrair para constantes nomeadas
- Nomes confusos - Refatorar para nomes descritivos

### 1. `src/hooks/useScoringHandlers.ts` (577 linhas)
**Issues:**
- Funções longas (>50 linhas)
- Múltiplas responsabilidades (online/offline sync, modal handlers, error handling)
- Complexidade ciclomática alta

**Funções Problemáticas:**
- `processPoint` (linhas 147-292): ~145 linhas
- `handleServeErrorConfirm` (linhas 412-469): ~57 linhas
- `handlePointDetailsConfirm` (linhas 507-550): ~43 linhas

**Refatoração Sugerida:**
- [ ] Extrair online/offline sync logic para serviço separado
- [ ] Extrair modal handlers para hook dedicado
- [ ] Extrair error handling para funções utilitárias
- [ ] Adicionar testes de caracterização antes de mudar

**Handoff:** @backend → @qa (após refatoração)

---

### 2. `src/hooks/useSessionManager.ts` (469 linhas)
**Issues:**
- Funções longas
- Múltiplas responsabilidades (state building, validation, persistence, match finishing)

**Funções Problemáticas:**
- `handleEditScore` (linhas 130-288): ~158 linhas
- Suspended session resume useEffect (linhas 320-467): ~147 linhas

**Refatoração Sugerida:**
- [ ] Extrair match finish logic para serviço separado
- [ ] Extrair suspended session logic para hook dedicado
- [ ] Criar módulo separado para edit score state building
- [ ] Adicionar testes de caracterização

**Handoff:** @backend → @qa (após refatoração)

---

### 3. `src/app/atletas/page.tsx` (590 linhas)
**Issues:**
- Componente gigante
- Violação de SRP (UI, data fetching, state management, business logic)
- 15+ variáveis de estado

**Funções Problemáticas:**
- `renderRankingRow` (linhas 225-293): embutida no componente
- Age calculation e category/class logic embutidas

**Refatoração Sugerida:**
- [ ] Extrair ranking form para componente separado
- [ ] Mover data fetching para custom hook
- [ ] Extrair athlete form logic para componente separado
- [ ] Adicionar testes de caracterização

**Handoff:** @frontend → @qa (após refatoração)

---

### 4. `src/app/match/new/page.tsx` (574 linhas)
**Issues:**
- Componente gigante
- 30+ variáveis de estado
- Duplicação de lógica com atletas/page.tsx

**Refatoração Sugerida:**
- [ ] Extrair form sections para componentes separados
- [ ] Criar custom hook para match creation logic
- [ ] Extrair validation logic para serviço
- [ ] Adicionar testes de caracterização

**Handoff:** @frontend → @qa (após refatoração)

---

### 5. `src/components/scoring/EditScoreModal.tsx` (531 linhas)
**Issues:**
- Complexidade ciclomática alta
- Múltiplos useEffect com dependências complexas
- 13 props

**Funções Problemáticas:**
- `handleConfirm` (linhas 264-385): ~121 linhas com 15+ branches condicionais
- useEffect hooks (linhas 80-248): ~168 linhas

**Refatoração Sugerida:**
- [ ] Extrair validation logic para módulo separado
- [ ] Criar validation hook dedicado
- [ ] Split confirm handler em funções menores
- [ ] Group props em objetos
- [ ] Adicionar testes de caracterização

**Handoff:** @frontend → @qa (após refatoração)

---

### 6. `src/app/dashboard/page.tsx` (448 linhas)
**Issues:**
- Complexidade ciclomática
- 15+ custom hooks importados e utilizados
- Match filtering logic embutido

**Refatoração Sugerida:**
- [ ] Mover match categorization para hook dedicado
- [ ] Extrair menu logic para componente separado
- [ ] Adicionar testes de caracterização

**Handoff:** @frontend → @qa (após refatoração)

---

### 7. `src/app/match/[id]/scoring/page.tsx` (550 → 277 linhas, -50%)
**Status:** ✅ Refatorado (2026-09-30)  
**Issues Anteriores:**
- Concentrava múltiplos modais, sincronização offline, layouts condicionais e renderização de cards.
- Complexidade ciclomática elevada (CC 48).

**Arquivos Criados:**
- `src/app/match/[id]/scoring/ScoringModals.tsx` - Extração e gestão isolada de todos os 7 modais (178 linhas).
- `src/app/match/[id]/scoring/ScoringPlayArea.tsx` - Renderização da quadra, cards de atletas, live counters, badges de contexto e banner de finalização (182 linhas).
- `src/app/match/[id]/scoring/ScoringTimelineView.tsx` - Modo de visualização de tela cheia da timeline de pontos (67 linhas).

**Testes & Baseline:**
- ✅ 100% dos testes passando (`pnpm test` com 284/284 suítes e 3.134 testes verdes).
- ✅ Typecheck 100% verde (`tsc --noEmit`).

---

### Particionamento de `src/schemas/contracts.ts` (513 → 19 linhas, -96%)
**Status:** ✅ Refatorado (2026-09-30)  
**Issues Anteriores:**
- Arquivo acumulador monolítico de tipos e esquemas Zod (513 linhas).

**Arquivos Criados:**
- `src/schemas/common.ts` - Validador utilitário `flexibleIdValidator`.
- `src/schemas/rally.ts` - Schemas e tipos de rally, golpes e pontuação.
- `src/schemas/user.ts` - Schemas e tipos de usuário, roles e autenticação.
- `src/schemas/player.ts` - Schemas e tipos de atleta e rankings.
- `src/schemas/match.ts` - Schemas e tipos de partida, placar e mutações.
- `src/schemas/annotation.ts` - Schemas e tipos de sessão de anotação.
- `src/schemas/index.ts` - Barrel central de exportação modular.
- `src/schemas/contracts.ts` - Reexportação limpa retrocompatível sem breaking changes.

**Testes & Baseline:**
- ✅ 100% dos testes passando (`pnpm test` com 284/284 suítes e 3.134 testes verdes).
- ✅ Typecheck 100% verde (`tsc --noEmit`).

---

## ✅ COMPLETED - Arquivos do Gatilho de Atenção (≥ 350 linhas) (2026-09-30)

### 1. `src/components/scoring/timeline-utils.ts` (409 → 65 linhas, -84%, CC 102 → <10)
**Status:** ✅ Refatorado  
**Arquivos criados:**
- `src/components/scoring/timeline-format.ts` - Formatação e labels de pontos, tipos e detalhes do rally (178 linhas).
- `src/components/scoring/timeline-validation.ts` - Validação de detalhes do rally e enums com Zod (64 linhas).
- `src/components/scoring/timeline-game-end.ts` - Detecção de fim de game, quebras e transições (88 linhas).
**Testes:** ✅ 86 testes dedicados passando (`timeline-utils`).

### 2. `src/app/match/[id]/scoring/useScoringPageEffects.ts` (404 → 202 linhas, -50%, CC 44 → <15)
**Status:** ✅ Refatorado  
**Arquivos criados:**
- `src/app/match/[id]/scoring/useScoringLifecycleEffects.ts` - Efeitos de ciclo de vida, polling, visibilidade e sincronização online/offline (89 linhas).
- `src/app/match/[id]/scoring/useScoringCommentHandler.ts` - Criação de comentários contextuais e upload de áudio (134 linhas).
- `src/app/match/[id]/scoring/useScoringEditScoreHandlers.ts` - Handlers de edição de placar, cancelamento e refresh de floor (52 linhas).
**Testes:** ✅ 38 testes de characterization passando.

### 3. `src/app/match/[id]/scoring/useScoringPageState.ts` (354 → 250 linhas, -30%, CC 37 → <15)
**Status:** ✅ Refatorado  
**Arquivos criados:**
- `src/app/match/[id]/scoring/useScoringTimelineSync.ts` - Sincronização de timeline, mescla local/servidor com quebras de segmento, áudio e comentários (129 linhas).
**Testes:** ✅ Testes de scoring e sync passando.

### 4. `src/components/scoring/edit-score-form.tsx` (353 → 245 linhas, -30%, CC 64 → <20)
**Status:** ✅ Refatorado  
**Arquivos criados:**
- `src/components/scoring/edit-score-tiebreak-inputs.tsx` - Inputs especializados de tiebreak (70 linhas).
- `src/components/scoring/edit-score-game-points.tsx` - Dropdowns de seleção de pontos no game atual (78 linhas).
**Testes:** ✅ 2 testes de characterization passando.

---

## ✅ COMPLETED - Core de Pontuação e Relatórios (2026-09-30)

### 1. `validateTransitionState()` (`src/services/matchValidator.ts`)
**Status:** ✅ Refatorado  
**Redução:** CC 35 → <5, 95 → 25 linhas  
**Ações:** Decomposto em validadores granulares (`validateAllowedTransition`, `validateFinishedTransition`, `validateScoreProgression`).  
**Testes:** ✅ 88 testes passando (`matchValidator`).

### 2. `isTiebreakRegressing()` (`src/services/matchValidator.ts`)
**Status:** ✅ Refatorado  
**Redução:** CC 31 → <5, 49 → 24 linhas  
**Ações:** Decomposto com predicados utilitários especializados (`isSameWinnerCorrection`, `isCoordinateRegressing`).  
**Testes:** ✅ 88 testes passando (`matchValidator`).

### 3. `normalizeScoreState()` (`src/core/scoring/score-normalizer.ts`)
**Status:** ✅ Refatorado  
**Redução:** CC 37 → 3, 92 → 20 linhas  
**Ações:** Decomposto em fases sequenciais (`normalizeMatchTiebreakSets`, `normalizeRegularTiebreakSets`, `ensureDefaultCurrentGame`).  
**Testes:** ✅ 40 testes passando (`score-normalizer`).

### 4. `detectTacticalTrends()` (`src/core/scoring/live-tactical-insights.ts`)
**Status:** ✅ Refatorado  
**Redução:** CC 28 → <5, 110 → 32 linhas  
**Ações:** Decomposto em analisadores dedicados (`detectWingWeakness`, `detectNetVulnerability`, `detectDoubleFaultAlert`, `detectSetPerformanceDrop`).  
**Testes:** ✅ 5 testes passando (`live-tactical-insights`).

### 5. `computeShotAnalysis()` (`src/core/report/pressure-shot-stats.ts`)
**Status:** ✅ Refatorado  
**Redução:** CC 28 → 1, 106 → 12 linhas  
**Ações:** Decomposto em subfunções analíticas puras (`aggregatePlayerOutcomes`, `applyLegacyFallback`, `computeNetApproaches`, `computeRallyMetrics`, `countSpecialShots`).  
**Testes:** ✅ 4 testes passando (`pressure-shot-stats`).

### 6. `calculatePlayerStats()` (`src/core/scoring/set-summary-stats.ts`)
**Status:** ✅ Refatorado  
**Redução:** CC 27 → 2, 113 → 18 linhas  
**Ações:** Decomposto em sub-acumuladores (`calculateServiceStats`, `calculateReturnBreakPoints`, `calculatePlayerErrors`) e cálculo percentual unificado.  
**Testes:** ✅ 3 testes passando (`set-summary-stats`).

### 7. `handleGameWon()` (`src/core/scoring/game-processing.ts`)
**Status:** ✅ Refatorado  
**Redução:** CC 24 → 4, 90 → 30 linhas  
**Ações:** Decomposto em sub-rotinas de decisão de ciclo (`resolveActiveSet`, `validateGameWinner`, `shouldTriggerTiebreak`, `transitionToTiebreak`, `transitionToMatchTiebreak`).  
**Testes:** ✅ 27 testes passando (`game-processing`).

---

## ✅ COMPLETED - Hooks & UI Logic (2026-09-30)

### 1. `useScoringPageDerived()` (`src/app/match/[id]/scoring/useScoringPageDerived.ts`)
**Status:** ✅ Refatorado  
**Redução:** CC 38 → 3, 134 → 45 linhas  
**Ações:** Decomposto em funções puras dedicadas (`derivePointBadges`, `deriveTiebreakState`, `deriveEditScoreCurrentSets`, `deriveEditScoreCompletedSets`).  
**Testes:** ✅ 23 testes passando (`scoring.page.characterization`, `useScoringPageDerived`).

### 2. `useModalStack()` (`src/hooks/useModalStack.ts`)
**Status:** ✅ Refatorado  
**Redução:** CC 38 → <6, 208 → 70 linhas por estratégia  
**Ações:** Separado nas estratégias modulares desacopladas `useRouterModalStack()` (modo router Next.js) e `useInternalModalStack()` (modo memória/history stack) com helper `buildModalUrl()`.  
**Testes:** ✅ 15 testes passando (`useModalStack`).

### 3. `handleEditScore()` / `executeScoreEdit()` (`src/hooks/useSessionManager.ts`)
**Status:** ✅ Refatorado  
**Redução:** CC 32 → <3, 170 → 25 linhas  
**Ações:** Extraído para o módulo especializado `src/hooks/useSessionManager.edit-score.ts`, particionando em validação de tiebreak, mescla com sessão suspensa, persistência (match finish vs ongoing) e aplicação no engine local.  
**Testes:** ✅ 88 testes passando (`useSessionManager`).

### 4. `syncPointToServer()` (`src/hooks/useScoringHandlers.point-sync.ts`)
**Status:** ✅ Refatorado  
**Redução:** CC 27 → 4, 108 → 35 linhas  
**Ações:** Decomposto em pipeline granular (`buildPointPayload`, `handleSuccessResponse`, `handleConflictResponse`, `handleErrorResponse`, `handleFetchCatch`).  
**Testes:** ✅ 12 testes passando (`point-sync`).

### 5. `validateStandardSet()` (`src/components/scoring/editScoreHelpers.ts`)
**Status:** ✅ Refatorado  
**Redução:** CC 38 → 4, 113 → 30 linhas  
**Ações:** Decomposto em validadores isolados (`validateGameBounds`, `checkTiebreakThreshold`, `validateTiebreakLoserGames`, `resolveStandardWinner`).  
**Testes:** ✅ 149 testes passando (`editScoreHelpers`).

### 6. `ResumeAnnotationModal()` (`src/components/scoring/ResumeAnnotationModal.tsx`)
**Status:** ✅ Refatorado  
**Redução:** CC 35 → <4, 241 → 50 linhas no componente principal  
**Ações:** Decomposto em subcomponentes puros (`parseSnapshotSets`, `ResumeFooter`, `ResumeStatusExplanation`, `ResumeScoreDetails`).  
**Testes:** ✅ 3 testes passando (`ResumeAnnotationModal`).

### 7. `CommentModal()` (`src/components/scoring/CommentModal.tsx`)
**Status:** ✅ Refatorado  
**Redução:** CC 34 → <5, 239 → 60 linhas no componente principal  
**Ações:** Decomposto em componentes focados (`CommentSubmittingOverlay`, `CommentTextInput`, `CommentVoiceRecorderView`).  
**Testes:** ✅ 4 testes passando (`CommentModal`).

### 8. `getGameEndInfo()` (`src/components/scoring/timeline-game-end.ts` / `timeline-utils.ts`)
**Status:** ✅ Refatorado  
**Redução:** CC 30 → 3, 82 → 25 linhas  
**Ações:** Decomposto em analisadores dedicados de transição de games e encerramento de sets (`handleTransitionGameEnd`, `handleLastPointOfSetGameEnd`, `isTransitionToNewGame`, `isSetDecidingPoint`, `checkIsBreak`).  
**Testes:** ✅ 86 testes passando (`timeline-utils`).

---

## Prioridade P1 (Alto)

### 8. `src/services/annotationSessionService.ts`
**Issues:**
- Violação de SRP ('use client' mas exporta funções client e server)
- Mistura API calls com React hooks
- `markSessionAbandoned` com keepalive fetch e silent error handling

**Refatoração Sugerida:**
- [ ] Split em server service e client hook
- [ ] Adicionar proper error handling
- [ ] Adicionar input validation
- [ ] Adicionar testes de caracterização

**Handoff:** @backend → @qa (após refatoração)

---

### 9. `src/components/scoring/edit-score-logic.ts`
**Issues:**
- Muitos parâmetros em funções

**Funções Problemáticas:**
- `createSetEditData`: 10 parâmetros (linhas 206-243)
- `calculateMatchState`: 5 parâmetros (linhas 133-184)

**Refatoração Sugerida:**
- [ ] Usar parameter objects ao invés de positional parameters
- [ ] Extrair parâmetros relacionados em config objects
- [ ] Adicionar testes de caracterização

**Handoff:** @backend → @qa (após refatoração)

---

### 10. `src/app/atletas/page.tsx` + `src/app/match/new/components/NewAthleteModal.tsx`
**Issues:**
- Duplicação de código (ranking form logic, age calculation, category/class logic)

**Refatoração Sugerida:**
- [ ] Extrair ranking form para componente reutilizável
- [ ] Criar shared hook para ranking management
- [ ] Consolidar age/category logic em módulo utilitário
- [ ] Adicionar testes de caracterização

**Handoff:** @frontend → @qa (após refatoração)

---

### 11. `src/components/scoring/editScoreHelpers.ts` + `src/components/scoring/edit-score-logic.ts`
**Issues:**
- Duplicação de código (parcialmente resolvida, needs audit)

**Refatoração Sugerida:**
- [ ] Auditar por lógica duplicada restante
- [ ] Garantir que todas funções shared use point-utils
- [ ] Adicionar testes de caracterização

**Handoff:** @backend → @qa (após refatoração)

---

### 12. Console.log statements (100+ occurrences)
**Arquivos Afetados:**
- `src/hooks/useSessionManager.ts`: 18+ console statements
- `src/hooks/useScoringHandlers.ts`: 12+ console statements
- `src/components/scoring/EditScoreModal.tsx`: Multiple debug logs
- API routes: Extensive logging

**Refatoração Sugerida:**
- [ ] Substituir por logging service apropriado
- [ ] Usar logging baseado em ambiente
- [ ] Remover debug statements em produção
- [ ] Adicionar testes de caracterização

**Handoff:** @backend → @qa (após refatoração)

---

### 13. TODO/FIXME/SUSPECT comments (27 occurrences)
**Arquivos Afetados:**
- `src/services/__tests__/matchService.characterization.test.ts`: 8 suspect comments
- `src/services/__tests__/annotationSessionService.characterization.test.ts`: 9 suspect comments
- `src/services/__tests__/matchValidator.characterization.test.ts`: 6 suspect comments

**Refatoração Sugerida:**
- [ ] Criar tickets para cada item TD-XXX
- [ ] Prioritizar e abordar sistematicamente
- [ ] Adicionar testes de caracterização

**Handoff:** @qa (para criar tickets)

---

## Prioridade P2 (Médio)

### 14. Nomes Confusos (Multiple files)
**Issues:**
- `ctx` parameter name usado extensivamente
- `state` variable usado para múltiplos propósitos
- `match` variable refere-se a match data e match state

**Refatoração Sugerida:**
- [ ] Usar nomes de variáveis descritivos
- [ ] Adicionar type annotations para clareza
- [ ] Adicionar testes de caracterização

**Handoff:** @backend + @frontend → @qa (após refatoração)

---

### 15. Comentários Explicativos
**Arquivos Afetados:**
- `src/hooks/useScoringHandlers.ts`: FIX comments, explicações complexas
- `src/hooks/useSessionManager.ts`: CORREÇÃO, PROTEÇÃO comments

**Refatoração Sugerida:**
- [ ] Refatorar código para ser self-documenting
- [ ] Extrair lógica complexa para funções nomeadas
- [ ] Adicionar JSDoc comments para lógica complexa
- [ ] Adicionar testes de caracterização

**Handoff:** @backend → @qa (após refatoração)

---

### 16. Tratamento de Erro Insuficiente (Multiple API routes)
**Issues:**
- Catch blocks vazios: `catch {}` ou `catch(() => {})`
- Silent failures em `markSessionAbandoned`
- Generic error messages: "Erro ao..."

**Refatoração Sugerida:**
- [ ] Adicionar proper error logging
- [ ] Implementar error boundaries
- [ ] Adicionar user-friendly error messages
- [ ] Adicionar testes de caracterização

**Handoff:** @backend → @qa (após refatoração)

---

## Prioridade P3 (Baixo)

### 17. Magic Numbers (Multiple files)
**Arquivos Afetados:**
- `EditScoreModal.tsx`: Timeout de 1000ms
- `useScoringHandlers.ts`: Timeout de 15000ms, debounce de 50ms
- `editScoreHelpers.ts`: Max games constants embutidos

**Refatoração Sugerida:**
- [ ] Extrair para constantes nomeadas
- [ ] Documentar rationale para valores
- [ ] Adicionar testes de caracterização

**Handoff:** @backend + @frontend → @qa (após refatoração)

---

### 18. Inconsistent Error Handling (Multiple files)
**Issues:**
- Algumas funções throw errors, outras retornam error objects
- Mix de TypeScript errors e runtime checks

**Refatoração Sugerida:**
- [ ] Standardizar error handling pattern
- [ ] Usar Result type ou custom error classes
- [ ] Adicionar testes de caracterização

**Handoff:** @arquitetura → @backend (para implementação)

---

## Summary

| Prioridade | Count | Áreas Principais |
|------------|-------|------------------|
| P0 | 7 | Componentes grandes, funções complexas, acoplamento alto |
| P1 | 6 | Código morto, muitos parâmetros, duplicação, violações SRP |
| P2 | 3 | Nomes confusos, comentários explicativos, error handling |
| P3 | 2 | Magic numbers, inconsistência |

**Total de Issues:** 18  
**Total de Arquivos Afetados:** ~25+

---

## Regras de Refatoração (Política 2026-07-20)

1. **Adicionar testes de caracterização ANTES de mudar** - via @qa
2. **Delimitar o "raio de mudança" mínimo** - não refatorar além do necessário
3. **Registrar em TECH_DEBT.md** se identificar dívida adjacente (mas NÃO corrigir agora)
4. **Documentar no PR** o que foi mudado e por quê (linkar issue/ADR se aplicável)

---

## Próximos Passos

1. **@arquitetura** → Revisar arquitetura geral para issues de acoplamento
2. **@backend** → Refatorar service layer (SRP violations)
3. **@frontend** → Quebrar componentes gigantes em componentes menores
4. **@qa** → Adicionar testes de caracterização antes de cada refatoração

**Handoff Inicial:** @qa → @arquitetura + @backend + @frontend

---

## Refatoração de Modelo de Dados de Golpes (Shot Data Model)

**Plano de Vinculação de Erros e Winners:**
- **Em fundo e devolução:** o golpe é o de quem errou, então essa parte é segura. 
- **Vencedor do ponto:** 
  - Winner é dele
  - EF (Erro Forçado) e ENF (Erro Não Forçado): erro do adversário e ponto do vencedor
- **Vencedor > rede:** 
  - i. winner: ponto para o vencedor
  - ii. EF ou ENF: ponto para vencedor e erro para o adversário
- **Vencedor > passada:**
  - i. winner > fundo D ou E: ponto para vencedor e erro para o adversário
  - ii. EF ou ENF > voleio ou smash > ponto para vencedor e erro para adversário

---

## Correção de Persistência de Saque e Cálculo Infalível de 1º e 2º Serviço (2026-09-29)

- **Problema:** `buildAnnotationsPayload` retornava `undefined` quando `rallyDetails` não vinha preenchido (ex.: marcação rápida de pontos em cards diretos sem abertura de modal), descartando `isFirstServe`, `isSecondServe` e `firstFaultDetail` do `PointLog.annotations`. Com isso, reconstruções de timeline e cálculos de serviço perdiam a distinção entre 1º e 2º saque nesses pontos.
- **Solução no Backend:**
  1. `buildAnnotationsPayload` (`src/app/api/matches/[id]/point/route.helpers.ts`) atualizado para sempre computar e persistir `isFirstServe`, `isSecondServe` e `firstFaultDetail` no `PointLog.annotations`, mesmo sem `rallyDetails`.
  2. `isSecondServe` e `isFirstServe` são estritamente complementares e infalíveis: qualquer `DOUBLE_FAULT`, presença de `firstFaultDetail`, flag `isSecondServe === true` ou `isFirstServe === false` classifica o ponto como 2º serviço.
  3. `ScoringEngine.applyPoint` / `buildPointDetails` (`src/core/scoring/engine.ts`) atualizados para respeitar o estado do engine (`state.secondServe`) e `flow.firstFaultDetail`.
  4. `timeline-rebuild.ts` e helpers atualizados para garantir que timelines nominais e simuladas atribuam os campos de serviço com precisão absoluta.
  5. `computeServeStats` e `computeReturnStats` (`src/core/report/serve-return-stats.ts`) atualizados com as funções guardiãs `isFirstServePoint` e `isSecondServePoint`, assegurando que `totalPoints === firstServePoints + secondServePoints` e que duplas faltas e pontos com erro de 1º saque nunca sejam computados indevidamente como 1º saque.
- **Testes:**
  - Testes unitários em `src/app/api/matches/[id]/point/__tests__/route.helpers.test.ts`
  - Testes de caracterização em `src/core/report/__tests__/serve-return-stats.characterization.test.ts`
  - Testes de reconstrução em `src/components/scoring/__tests__/timeline-rebuild.characterization.test.ts`

---

## Integridade de Estatísticas On-Time e Fechamento de Set (2026-09-29)

- **Problemas Resolvidos:**
  1. **Contagem de Winners e Erros em Anotação Rápida:** Pontos marcados pelos botões diretos sem abrir o modal de detalhes do ponto vinham sem `rallyDetails`, gerando 0 winners / 0 erros nos relatórios e breakdowns. Adicionado fallback para `point.type` (`WINNER`, `FORCED_ERROR`, `UNFORCED_ERROR`).
  2. **Perda do Último Game do Set (Fronteira de Set):** Quando um set era fechado, `newGames > prevGames` não disparava porque os contadores eram zerados na transição de set (`setNumber > currentSet`), perdendo o game decisivo (ex: 6x4 computava apenas 9 games). `computeCompletedGames` agora avalia `next.setNumber > p.setNumber` para contabilizar o game final do set.
  3. **Inflação de Games por Tiebreak:** Durante tiebreaks, a pontuação de games na timeline armazenava pontos do tiebreak (1-0, 2-0...), fazendo com que cada ponto de tiebreak fosse falsamente interpretado como um game de serviço completo. `computeCompletedGames` e `computeServiceGames` agora isolam pontos de tiebreak (`isTiebreak === true`).
  4. **Placar de Games no SetBreakdown (Lag de StateBefore):** O último ponto do set registrava o placar do game *antes* da conclusão do game decisivo (exibindo 5x4 em vez de 6x4). `computeSetBreakdown` agora calcula o placar final consolidado dos games a partir de `computeCompletedGames`.
- **Arquivos:**
  - `src/core/report/serve-return-stats.ts` (`computeCompletedGames`, `computeServiceGames`, `computeReturnGames`)
  - `src/core/report/momentum-set-stats.ts` (`computeSetBreakdown`, `updateWinnerAndErrorStats`)
  - `src/core/scoring/scoring-logic.ts` (`enrichPointsFromHistory` ajustado para detectar início de novo set quando `setsWon >= sets.length`)
  - `src/app/api/matches/[id]/report/route.ts` (`buildPlayerSummary`)
  - `src/app/api/matches/[id]/report/report.summary.ts` (`aggregatePointLogs`)
  - `src/core/report/__tests__/momentum-set-stats.test.ts`
  - `src/app/api/matches/[id]/__tests__/report.route.set-close-tiebreak.integration.test.ts` (@qa validação de integração ponta a ponta)