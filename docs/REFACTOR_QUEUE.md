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

### 7. `src/app/match/[id]/scoring/page.tsx` (22.1 KB)
**Issues:**
- Acoplamento excessivo (tamanho indica complexidade)
- Prováveis imports excessivos

**Refatoração Sugerida:**
- [ ] Revisar import dependencies
- [ ] Extrair scoring logic para módulo dedicado
- [ ] Usar context para shared state
- [ ] Adicionar testes de caracterização

**Handoff:** @frontend → @qa (após refatoração)

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