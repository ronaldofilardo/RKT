# TD-002 — Validação de Inputs com Zod em Todas APIs

**Status:** ✅ Parcial (2026-07-20)  
**Owner:** @backend  
**Breaking Changes:** Não (backward compatible)

---

## Problema Original

Múltiplas APIs com validação manual inconsistente:

```typescript
// Validação manual em 18+ arquivos:
if (!name || typeof name !== 'string' || name.trim().length < 2) {
  return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
}

// Dificuldade de manutenção
// Validações espalhadas
// Inconsistência entre endpoints
```

**Riscos:**
1. **Inconsistência:** Cada endpoint valida de um jeito
2. **Dificuldade de teste:** Validações manuais difíceis de mockar
3. **Violação de segurança:** Inputs podem passar sem validação completa
4. **Manutenção:** Mudar validação exige tocar em N arquivos

---

## Solução Implementada

### 1. Schemas Zod Centralizados (`src/schemas/contracts.ts`)

```typescript
// Novos schemas adicionados:
export const CreatePlayerInputSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  age: z.number().min(1).max(120).optional(),
  birthDate: z.coerce.date().optional(),
  dominance: z.enum(['LEFT', 'RIGHT']).optional(),
  backhand: z.enum(['ONE_HANDED', 'TWO_HANDED']).optional(),
  rankings: z.record(
    z.enum(['ESTADUAL', 'CBT', 'COSAT', 'ITF', 'ATP', 'WTA']),
    z.object({
      position: z.number().min(1),
      category: z.string().optional(),
      class: z.string().optional(),
    })
  ).optional(),
  club: z.string().optional(),
  createdByUserId: z.string().optional(),
});

export const CreateUserInputSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  role: z.enum(['ADMIN', 'GESTOR', 'COACH', 'ATHLETE', 'SPECTATOR']),
  club: z.string().optional(),
});

export const ListPlayersInputSchema = z.object({
  userId: z.string().min(1, 'userId é obrigatório'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

### 2. APIs Refatoradas

| API | Validação Anterior | Validação Nova | Status |
|-----|-------------------|----------------|--------|
| `POST /api/players` | ✅ Manual (70+ linhas) | ✅ Zod (`CreatePlayerInputSchema`) | Completo |
| `GET /api/players` | ✅ Manual | ✅ Zod (`ListPlayersInputSchema`) | Completo |
| `POST /api/admin/users` | ✅ Manual | ✅ Zod (`CreateUserInputSchema`) | Completo |
| `GET /api/admin/users` | ❌ Nenhuma | ❌ Sem validação necessária | N/A |
| `POST /api/matches` | ✅ Zod | ✅ Zod (já usava) | N/A |
| `POST /api/auth/login` | ✅ Zod | ✅ Zod (já usava) | N/A |

### 3. Exemplo de Refatoração

**Antes (POST /api/players):**
```typescript
// 70+ linhas de validação manual
const body = await request.json();
const { name, gender, age, birthDate, dominance, backhand, rankings } = body;

if (!name || typeof name !== 'string' || name.trim().length < 2) {
  return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
}

if (gender && !['MALE', 'FEMALE'].includes(gender)) {
  return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
}

// ... 60+ linhas de validação manual ...
```

**Depois:**
```typescript
// 2 linhas com Zod
const body = await validatedRequest(request, CreatePlayerInputSchema);
const player = await createPlayer(body);
return NextResponse.json({ data: player }, { status: 201 });
```

**Benefícios:**
- ✅ 70+ linhas → 2 linhas
- ✅ Validação mais consistente
- ✅ Mensagens de erro padronizadas
- ✅ Fácil de testar

---

## Backward Compatibility

✅ **Não há breaking changes:**

- Respostas de erro mantêm mesmo formato (`{ error, details }`)
- Status codes unchanged (400 para validação)
- Inputs válidos continuam funcionando igual

---

## Próximos Passos (Backlog)

### APIs Pendentes de Refatoração

| API | Prioridade | Esforço |
|-----|------------|---------|
| `POST /api/matches/[id]/point` | Média | P |
| `POST /api/matches/[id]/finish` | Média | P |
| `PATCH /api/matches/[id]/state` | Média | P |
| `POST /api/matches/[id]/sessions` | Baixa | P |
| `POST /api/matches/[id]/sessions/:sessionId/endorse` | Baixa | P |
| `POST /api/matches/[id]/sessions/:sessionId/abandon` | Baixa | P |
| `GET /api/matches/suspended-sessions` | Baixa | P |
| `GET /api/matches/tournament-suggestions` | Baixa | P |

### Critérios de Prioridade

**Alta:** APIs com validação manual complexa (>30 linhas)  
**Média:** APIs com validação manual simples (<30 linhas)  
**Baixa:** APIs sem validação ou com inputs mínimos

---

## Métricas de Sucesso

| Métrica | Antes | Depois |
|---------|-------|--------|
| APIs com validação manual | 18+ | 3 (refatoradas) |
| APIs com validação Zod | 2 | 5 |
| Linhas de validação (POST /api/players) | 70+ | 2 |
| Consistência de mensagens de erro | ⚠️ Variável | ✅ Padronizada |
| Facilidade de teste | ⚠️ Difícil | ✅ Fácil |

---

## Referências

- `src/schemas/contracts.ts` — Schemas Zod centralizados
- `src/lib/api-helpers.ts` — `validatedRequest()` helper
- `src/app/api/players/route.ts` — Exemplo de refatoração
- `src/app/api/admin/users/route.ts` — Exemplo de refatoração
- `docs/TECH_DEBT.md` — TD-002 (atualizado)
- `docs/REFACTOR_QUEUE.md` — RF-005 (atualizado)