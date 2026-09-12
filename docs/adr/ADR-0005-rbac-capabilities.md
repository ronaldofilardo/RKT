# ADR-0005: Matriz de Capabilities para RBAC e Sincronização com RLS

**Status:** Accepted  
**Data:** 2026-09-11  
**Owner:** @arquitetura  
**Supersedes:** —  
**Depends on:** ADR-0001, TD-051, TD-003  

---

## Contexto

O sistema RKT utilizava originalmente uma hierarquia linear puramente numérica para autorização via `requireRole`:
```typescript
const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 5,
  GESTOR: 4,
  COACH: 3,
  ATHLETE: 2,
  SPECTATOR: 1,
};
```

### Problemas Identificados
1. **Herança Cega (`TD-051`):** A verificação `ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole]` fazia com que `COACH` (nível 3) herdasse automaticamente todas as permissões de `ATHLETE` (nível 2).
2. **Divergência entre Domínios e E2E:** Um técnico/árbitro (`COACH`) não é necessariamente um jogador ativo em quadra. Testes E2E como `05-role-boundaries.spec.ts` esperavam bloqueio de técnicos em rotas estritas de atletas, gerando inconsistência conceitual entre a regra de negócio e a hierarquia numérica linear.
3. **Sincronização com RLS:** No banco de dados, o isolamento de tenant/usuário depende do contexto `user.id` e `user.role` injetados no PostgreSQL via AsyncLocalStorage (`runWithRLS`). A ausência de uma matriz explícita de capacidades dificultava a auditoria das ações permitidas por perfil.

---

## Decisão

Adotar o modelo de **Permissões Granulares por Capabilities (`AppAction`)**, mantendo `requireRole` e `withRLSHandler` para compatibilidade retroativa aditiva.

### Modelo Implementado (`src/lib/auth.ts`)
```typescript
export type AppAction =
  | 'manage:users'
  | 'manage:clubs'
  | 'view:all_matches'
  | 'score:match'
  | 'view:tactical_stats'
  | 'annotate:session'
  | 'play:match'
  | 'view:own_stats'
  | 'view:public_matches';

export const ROLE_PERMISSIONS: Record<Role, readonly AppAction[]> = {
  ADMIN: [ ...todas as ações ],
  GESTOR: [ ...ações de gestão e clube ],
  COACH: ['score:match', 'view:tactical_stats', 'annotate:session', 'view:all_matches', 'view:public_matches'],
  ATHLETE: ['play:match', 'score:match', 'view:own_stats', 'view:public_matches'],
  SPECTATOR: ['view:public_matches'],
};
```

### Funções de Guard
- `hasPermission(role: Role, action: AppAction): boolean` — Lookup O(1) de capacidade.
- `requirePermission(request: NextRequest, action: AppAction)` — Guard HTTP retornando 401 ou 403.
- `withPermissionHandler(request, action, handler)` — Execução encapsulada em contexto RLS com cleanup automático.

---

## Consequências

- **Positivas:**
  - Separação clara entre o perfil do técnico (`COACH`) e o atleta (`ATHLETE`).
  - `hasPermission('COACH', 'play:match') === false` resolve a discrepância com os testes E2E.
  - Zero quebra de rotas existentes: todas as rotas legadas continuam operando normalmente via `withRLSHandler`.
- **Mitigações:**
  - Testes canônicos em `src/lib/__tests__/rbac-boundaries.baseline.characterization.test.ts` blindam ambas as interfaces (hierárquica e granular).
