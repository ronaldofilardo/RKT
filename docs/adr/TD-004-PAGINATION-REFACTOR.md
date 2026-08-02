# TD-004 — Paginação em Endpoints de Listagem

**Status:** ✅ Parcial (2026-07-20)  
**Owner:** @backend  
**Breaking Changes:** ⚠️ Sim (mudança no formato de resposta)

---

## Problema Original

Endpoints retornavam **todos os registros** sem paginação:

```typescript
// GET /api/admin/users — Sem paginação
export async function GET() {
  const users = await prisma.player.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json({ users });
}
```

**Riscos:**
1. **Performance:** Listar 10.000+ usuários de uma vez
2. **DoS acidental:** Request único consome toda a memória
3. **UX ruim:** Frontend recebe dados demais, travando UI
4. **Sem limite:** Não há controle de quantidade máxima

---

## Solução Implementada

### 1. Schema de Paginação (`src/schemas/contracts.ts`)

```typescript
export const ListUsersInputSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['ADMIN', 'GESTOR', 'COACH', 'ATHLETE', 'SPECTATOR']).optional(),
});
```

**Benefícios:**
- ✅ `limit` máximo de 100 (previne DoS)
- ✅ `cursor` para paginação eficiente (offset-based)
- ✅ `role` opcional para filtragem
- ✅ Validação automática com Zod

### 2. Service Atualizado (`src/services/adminService.ts`)

```typescript
export async function listAllUsers(options?: {
  cursor?: string;
  limit?: number;
  role?: Role;
}) {
  const { cursor, limit = 20, role } = options || {};

  return prisma.player.findMany({
    select: { id, name, email, role, club, createdAt },
    where: {
      ...(role ? { role } : {}),
    },
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}
```

**Técnica:** Cursor-based pagination (mais eficiente que offset)

### 3. API Refatorada (`src/app/api/admin/users/route.ts`)

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  
  const parsed = ListUsersInputSchema.safeParse({
    cursor: searchParams.get('cursor') ?? undefined,
    limit: searchParams.get('limit') ?? '20',
    role: searchParams.get('role') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { cursor, limit, role } = parsed.data;
  const users = await listAllUsers({ cursor, limit, role });
  const nextCursor = users.length === limit ? users[users.length - 1].id : null;
  
  return NextResponse.json({ 
    data: { 
      users, 
      nextCursor 
    } 
  });
}
```

---

## Breaking Changes

### Formato de Resposta

**Antes:**
```json
{
  "users": [...]
}
```

**Depois:**
```json
{
  "data": {
    "users": [...],
    "nextCursor": "abc123"
  }
}
```

### Query Params Novos

| Param | Tipo | Default | Max | Descrição |
|-------|------|---------|-----|-----------|
| `cursor` | string | `undefined` | — | ID do último item da página anterior |
| `limit` | number | `20` | `100` | Quantidade de itens por página |
| `role` | enum | `undefined` | — | Filtrar por role específico |

### Exemplo de Uso no Frontend

```typescript
// Página 1
const page1 = await fetch('/api/admin/users?limit=20');
const { data: { users, nextCursor } } = await page1.json();

// Página 2
const page2 = await fetch(`/api/admin/users?cursor=${nextCursor}&limit=20`);
```

---

## APIs com Paginação

| API | Status | Paginação | Filtros |
|-----|--------|-----------|---------|
| `GET /api/players` | ✅ Completo | Cursor + limit | userId |
| `GET /api/matches` | ✅ Completo | Cursor + limit | state |
| `GET /api/admin/users` | ✅ Completo | Cursor + limit | role |
| `GET /api/matches/suspended-sessions` | ⏳ Pendente | — | — |
| `GET /api/matches/tournament-suggestions` | ⏳ Pendente | — | — |

---

## Métricas de Sucesso

| Métrica | Antes | Depois |
|---------|-------|--------|
| Máximo de registros por request | ∞ | 100 |
| Formato de resposta | `{ users }` | `{ data: { users, nextCursor } }` |
| Filtros disponíveis | 0 | 1 (role) |
| Validação de query params | ❌ Manual | ✅ Zod |
| Performance (10k registros) | ⚠️ Lento (todos) | ✅ Rápido (20 por vez) |

---

## Próximos Passos (Backlog)

### APIs Pendentes

| API | Prioridade | Esforço |
|-----|------------|---------|
| `GET /api/matches/suspended-sessions` | Baixa | P |
| `GET /api/matches/tournament-suggestions` | Baixa | P |

### Critérios de Prioridade

**Alta:** APIs que listam entidades com crescimento ilimitado  
**Média:** APIs com >100 registros em produção  
**Baixa:** APIs com <100 registros totais

---

## Referências

- `src/schemas/contracts.ts` — `ListUsersInputSchema`
- `src/lib/api-helpers.ts` — `extractPagination()`
- `src/app/api/admin/users/route.ts` — Exemplo de paginação
- `src/app/api/players/route.ts` — Exemplo de paginação
- `src/app/api/matches/route.ts` — Exemplo de paginação
- `docs/TECH_DEBT.md` — TD-004 (atualizado)
- `docs/REFACTOR_QUEUE.md` — RF-006 (atualizado)