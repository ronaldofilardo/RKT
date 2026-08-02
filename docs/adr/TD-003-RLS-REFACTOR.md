# TD-003 — RLS com Cleanup Automático + Helpers

**Status:** ✅ Refatorado (2026-07-20)  
**Owner:** @backend  
**Breaking Changes:** Não (backward compatible)

---

## Problema Original

O `rls-context.ts` original tinha os seguintes problemas:

1. **Sem validação de entrada:** Aceitava qualquer string como `id` ou `role`
2. **Sem cleanup automático:** `setRLSUser(null)` chamava `disable()` mas não garantia cleanup
3. **Sem helpers utilitários:** Desenvolvedor precisava manualmente filtrar queries
4. **Risco de vazamento:** AsyncLocalStorage pode vazar entre requests sem cleanup explícito

---

## Solução Implementada

### 1. Validação de RLSUser

```typescript
const VALID_ROLES = ['ADMIN', 'GESTOR', 'COACH', 'ATHLETE', 'SPECTATOR'] as const;

function isValidRLSUser(user: RLSUser | null): user is RLSUser {
  if (!user) return false;
  if (!user.id || typeof user.id !== 'string' || user.id.trim() === '') {
    return false;
  }
  if (!isValidRole(user.role)) {
    return false;
  }
  return true;
}
```

**Benefício:** Erros de digitação em roles ou ids vazios são detectados imediatamente.

---

### 2. runWithRLS (Cleanup Automático)

```typescript
export async function runWithRLS<T>(user: RLSUser | null, fn: () => Promise<T>): Promise<T> {
  if (!user) {
    return fn();
  }

  if (!isValidRLSUser(user)) {
    throw new Error('Invalid RLS user in runWithRLS');
  }

  try {
    return await rlsStorage.run(user, fn);
  } finally {
    // Cleanup garantido mesmo em caso de erro
    rlsStorage.disable();
  }
}
```

**Uso:**
```typescript
// Antes (propenso a vazamentos):
setRLSUser({ id: 'user-123', role: 'ATHLETE' });
try {
  return await matchService.listMatches();
} finally {
  setRLSUser(null); // ← Esquecer isso causa vazamento!
}

// Depois (cleanup automático):
return runWithRLS({ id: 'user-123', role: 'ATHLETE' }, async () => {
  return matchService.listMatches();
});
// Cleanup automático aqui, mesmo com erro
```

---

### 3. runWithRLSSync (Versão Síncrona)

```typescript
export function runWithRLSSync<T>(user: RLSUser | null, fn: () => T): T {
  if (!user) return fn();
  
  if (!isValidRLSUser(user)) {
    throw new Error('Invalid RLS user in runWithRLSSync');
  }

  try {
    return rlsStorage.run(user, fn);
  } finally {
    rlsStorage.disable();
  }
}
```

---

### 4. withRLSMiddleware (Middleware Wrapper)

```typescript
export function withRLSMiddleware<T>(
  getUser: (context: T) => RLSUser | null,
  handler: (context: T, user: RLSUser | null) => any
) {
  return async (context: T) => {
    const user = getUser(context);
    
    if (user && !isValidRLSUser(user)) {
      throw new Error('Invalid RLS user from middleware');
    }

    if (!user) return handler(context, null);

    try {
      return await rlsStorage.run(user, async () => handler(context, user));
    } finally {
      rlsStorage.disable();
    }
  };
}
```

**Uso no middleware.ts:**
```typescript
// Já implementado em middleware.ts
export async function middleware(request: NextRequest) {
  // ... extrair token ...
  const user = await extractUserFromToken(token);
  
  return runWithRLS(user, async () => {
    // Headers, validações, etc.
    return NextResponse.next({ request: { headers: requestHeaders } });
  });
}
```

---

### 5. withRLSFilter (Filtro Automático de Queries)

```typescript
export function withRLSFilter<T extends { where?: Record<string, any> }>(
  query: T,
  applyFilter: (query: T) => T
): T {
  const user = getRLSUser();
  
  // ADMIN não tem filtro
  if (!user || user.role === 'ADMIN') {
    return query;
  }

  // Aplica filtro baseado no role
  return applyFilter(query);
}
```

**Uso:**
```typescript
// Antes (desenvolvedor pode esquecer de filtrar):
const matches = await prisma.match.findMany({
  where: { state: 'IN_PROGRESS' }
  // ← Esqueceu de filtrar por createdByUserId!
});

// Depois (filtro explícito e automático):
const matches = await withRLSFilter(
  prisma.match.findMany({ where: { state: 'IN_PROGRESS' } }),
  (query) => ({
    ...query,
    where: {
      ...query.where,
      createdByUserId: getRLSUser()?.id,
    },
  })
);
```

---

## Testes Adicionados

**Arquivo:** `src/lib/__tests__/rls-context.refactor.test.ts`

**Cobertura:**
- ✅ Validação de RLSUser (9 testes)
- ✅ runWithRLS (6 testes)
- ✅ runWithRLSSync (4 testes)
- ✅ withRLSMiddleware (4 testes)
- ✅ withRLSFilter (3 testes)

**Total:** 26 testes específicos da refatoração

---

## Backward Compatibility

✅ **Não há breaking changes:**

- `getRLSUser()` — Comportamento inalterado
- `setRLSUser(user)` — Agora valida, mas lança erro apenas para inputs inválidos
- Novas funções são **adicionais**, não substituem as existentes

---

## Migração Sugerida

### Curto Prazo (Próxima Sprint)

1. **Novos códigos:** Usar `runWithRLS` por padrão
2. **Middleware:** Já usa `runWithRLS` (implementado)

### Médio Prazo (1-2 Sprints)

1. **Services críticos:** Migrar para `runWithRLS`
   - `matchService.createMatch`
   - `matchService.listMatches`
   - `playerService` (quando aplicável)

2. **API Routes:** Usar `withRLSFilter` em queries
   - `/api/matches`
   - `/api/players`

### Longo Prazo (Backlog)

1. **Refatorar todos os services** para usar `runWithRLS`
2. **Criar wrapper em `matchRepository`** para aplicar filtros automaticamente

---

## Métricas de Sucesso

| Métrica | Antes | Depois |
|---------|-------|--------|
| Validação de entrada | ❌ Nenhuma | ✅ id não-vazio, role válida |
| Cleanup automático | ❌ Manual | ✅ runWithRLS garante |
| Helpers utilitários | ❌ Nenhum | ✅ 4 novos helpers |
| Testes de validação | ❌ 0 | ✅ 26 testes |
| Risco de vazamento | ⚠️ Alto | ✅ Baixo (cleanup garantido) |

---

## Próximos Passos

1. ✅ Refatoração concluída
2. ✅ Testes adicionados
3. ✅ Middleware atualizado
4. 🟡 Documentar exemplos de uso em `docs/rls-patterns.md`
5. 🟡 Migrar services críticos (RF-004 na REFACTOR_QUEUE.md)

---

## Referências

- `src/lib/rls-context.ts` — Implementação refatorada
- `src/lib/__tests__/rls-context.refactor.test.ts` — Testes da refatoração
- `src/lib/__tests__/rls-context.characterization.test.ts` — Characterization tests
- `middleware.ts` — Exemplo de uso em produção
- `docs/REFACTOR_QUEUE.md` — RF-004 (RLS Centralizado)
- `docs/TECH_DEBT.md` — TD-003 (atualizado)