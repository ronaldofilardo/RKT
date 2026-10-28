# Guardrails de API — rkt

**Documento obrigatório para todas as API routes**  
**Criado em:** 2026-07-20  
**Owner:** @backend

---

## 1. Estrutura Padrão de Route Handler

Todo route handler deve seguir este template:

```typescript
// src/app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { jsonResponse } from '@/lib/api-helpers';
import { validatedRequest } from '@/lib/api-helpers';
import { [Resource]Schema } from '@/schemas/contracts';
import { [resourceService] } from '@/services/[resource]Service';

export async function GET(request: NextRequest) {
  const roleCheck = await requireRole(request, 'SPECTATOR');
  if (roleCheck) return roleCheck;

  try {
    // Extrair query params
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Executar service
    const data = await [resourceService].list({ page, limit });

    return jsonResponse(data, {
      headers: { 'Cache-Control': 'private, max-age=60' }
    });
  } catch (error) {
    console.error('[RESOURCE GET]', error);
    return jsonResponse(
      { error: 'INTERNAL_ERROR', message: 'Erro interno ao listar recursos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const roleCheck = await requireRole(request, 'ATHLETE');
  if (roleCheck) return roleCheck;

  try {
    // Validar input com Zod
    const body = await validatedRequest(request, [Resource]Schema);

    // Executar service
    const resource = await [resourceService].create(body);

    return jsonResponse(resource, { status: 201 });
  } catch (error) {
    console.error('[RESOURCE POST]', error);
    return handleApiError(error);
  }
}
```

---

## 2. Helper: `src/lib/api-helpers.ts`

**Status:** ✅ Implementar na Onda 1

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from './errors';

/**
 * Resposta JSON padronizada
 */
export function jsonResponse<T>(
  data: T,
  options?: { status?: number; headers?: Record<string, string> }
): NextResponse<{ data: T }> {
  const { status = 200, headers = {} } = options ?? {};
  return NextResponse.json({ data }, { status, headers });
}

/**
 * Valida request body com Zod e retorna erro padronizado
 */
export async function validatedRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError('VALIDATION_ERROR', error.flatten(), 400);
    }
    throw new ApiError('INVALID_JSON', 'Corpo da requisição inválido', 400);
  }
}

/**
 * Handler centralizado de erros de API
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('[API_ERROR]', error);

  if (error instanceof ApiError) {
    return jsonResponse(
      { error: error.code, message: error.message, details: error.details },
      { status: error.status }
    );
  }

  // Erro inesperado — não expor detalhes
  return jsonResponse(
    { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
    { status: 500 }
  );
}

/**
 * Paginação padrão com cursor
 */
export function paginate<T>(
  items: T[],
  cursor: string | null,
  limit: number
): { items: T[]; nextCursor: string | null } {
  const nextCursor = items.length === limit ? items[items.length - 1].id : null;
  return { items, nextCursor };
}

/**
 * Extrair paginação de query params
 */
export function extractPagination(searchParams: URLSearchParams) {
  const cursor = searchParams.get('cursor') ?? undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  return { cursor, limit };
}
```

---

## 3. Helper: `src/lib/errors.ts`

**Status:** ✅ Implementar na Onda 1

```typescript
/**
 * Erro de API padronizado
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    public details?: unknown,
    public status: number = 400
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

/**
 * Erro de validação
 */
export class ValidationError extends ApiError {
  constructor(details: unknown) {
    super('VALIDATION_ERROR', details, 400);
    this.name = 'ValidationError';
  }
}

/**
 * Erro de não encontrado
 */
export class NotFoundError extends ApiError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', { resource, id }, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Erro de autorização
 */
export class ForbiddenError extends ApiError {
  constructor(requiredRole: string, currentRole?: string) {
    super('FORBIDDEN', { requiredRole, currentRole }, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Erro de conflito (duplicate)
 */
export class ConflictError extends ApiError {
  constructor(message: string, existing?: unknown) {
    super('CONFLICT', { message, existing }, 409);
    this.name = 'ConflictError';
  }
}
```

---

## 4. Contratos de Validação (Zod)

**Status:** 🟡 Parcial (alguns schemas existem em `src/schemas/contracts.ts`)

### Schema Base para Todos os Inputs

```typescript
// src/schemas/contracts.ts
import { z } from 'zod';

/**
 * Paginação
 */
export const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Resposta de erro padronizada
 */
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

/**
 * Resposta de sucesso padronizada
 */
export function ApiResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: dataSchema,
  });
}

/**
 * Resposta paginada
 */
export function PaginatedResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: z.array(dataSchema),
    nextCursor: z.string().nullable(),
  });
}
```

---

## 5. Checklist de Review de API

Antes de merge, verificar:

- [ ] **Autenticação:** `requireRole()` com role mínima correta
- [ ] **Validação:** Input validado com Zod via `validatedRequest()`
- [ ] **Tratamento de erro:** `try/catch` + `handleApiError()`
- [ ] **Resposta padronizada:** `jsonResponse()` em todos os retornos
- [ ] **Paginação:** Listagens com `limit` máximo (100)
- [ ] **RLS:** Filtro por usuário/tenant quando aplicável
- [ ] **Logs:** `console.error` com contexto (`[API_NAME ACTION]`)
- [ ] **Tipo de resposta:** JSON schema tipado
- [ ] **Status HTTP:** Correto (200, 201, 204, 400, 401, 403, 404, 409, 500)

---

## 6. Template de Teste de API

```typescript
// src/app/api/[resource]/__tests__/route.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createTestPlayer, createAuthHeader } from '@/test/helpers';
import { Player } from '@prisma/client';

describe('GET /api/[resource]', () => {
  let testUser: Player;

  beforeEach(async () => {
    testUser = await createTestPlayer({ role: 'ATHLETE' });
  });

  it('deve retornar 200 com lista vazia', async () => {
    const response = await fetch('http://localhost:3000/api/[resource]', {
      headers: createAuthHeader(testUser),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toEqual([]);
  });

  it('deve retornar 401 sem autenticação', async () => {
    const response = await fetch('http://localhost:3000/api/[resource]');
    expect(response.status).toBe(401);
  });

  it('deve aplicar paginação com limit=10', async () => {
    // Criar 15 recursos
    // ...

    const response = await fetch(
      'http://localhost:3000/api/[resource]?limit=10',
      { headers: createAuthHeader(testUser) }
    );

    const json = await response.json();
    expect(json.data.length).toBe(10);
    expect(json.nextCursor).toBeDefined();
  });
});
```

---

## 7. Endpoints Atuais e Status

| Endpoint | Auth | Validação | Paginação | Error Handler | Status |
|----------|------|-----------|-----------|---------------|--------|
| POST `/api/auth/login` | ❌ | 🟡 | N/A | 🟡 | Refatorar |
| GET `/api/players` | ✅ | N/A | ❌ | 🟡 | Refatorar |
| POST `/api/matches` | ✅ | ✅ | N/A | 🟡 | Refatorar |
| GET `/api/matches` | ✅ | N/A | ❌ | 🟡 | Refatorar |
| GET `/api/matches/:id` | ✅ | N/A | N/A | 🟡 | Refatorar |
| PUT `/api/matches/:id` | ✅ | 🟡 | N/A | 🟡 | Refatorar |
| DELETE `/api/matches/:id` | ✅ | N/A | N/A | 🟡 | Refatorar |
| POST `/api/matches/:id/point` | ✅ | ✅ | N/A | 🟡 | Refatorar |
| POST `/api/matches/:id/finish` | ✅ | ✅ | N/A | 🟡 | Refatorar |
| GET `/api/matches/:id/sessions` | ✅ | N/A | N/A | 🟡 | Refatorar |
| POST `/api/matches/:id/sessions` | ✅ | N/A | N/A | 🟡 | Refatorar |
| POST `/api/matches/:id/sessions/:sessionId/endorse` | ✅ | N/A | N/A | 🟡 | Refatorar |
| POST `/api/matches/:id/sessions/:sessionId/abandon` | ✅ | N/A | N/A | 🟡 | Refatorar |
| GET `/api/matches/suspended-sessions` | ✅ | N/A | ❌ | 🟡 | Refatorar |
| GET `/api/admin/users` | ✅ | N/A | ❌ | 🟡 | Refatorar |

**Legenda:**
- ✅ Implementado
- 🟡 Parcial/Inconsistente
- ❌ Não implementado
- N/A: Não se aplica

### 7.1 Contratos planejados — Menus por Perfil (Fases 1 e 4) — 🔴 não implementados

> Definidos antes da implementação (`docs/PLANO_MENUS_POR_PERFIL_2026-10-26.md`). Todos usam `withAccessHandler`, validação Zod em arquivo de schema separado e `handleApiError`. **VERIFICAR** a permissão exata de cada rota na revisão da fase.

| Endpoint | Permissão | Fase | Contrato |
|----------|-----------|------|----------|
| GET `/api/auth/me` (extensão **aditiva**) — ✅ código entregue, aguardando validação local | sessão | F1 | Mantém `user`, `memberships`, `ctStatus`. Adiciona `canOperate`, `isSuporte`, `isAdmin`, `athlete: { playerId, ctIds[], isMinor } \| null`, `coach: { ctIds[] } \| null` (`ctIds` vazio = treinador avulso) |
| POST `/api/coach/athletes` | `athlete:create` (treinador) | F4 | Body: `name`, `cpf`, `birthDate` (DD/MM/AAAA), `email?`, `gender`, `dominance?`. Cria `User` + `Player` + `CoachAthleteLink ACTIVE` (sem `PlayerCT`), senha provisória `DDMMAAAA`, `mustChangePassword`, `PasswordResetRequest` de 7 dias. 201 com `firstAccess: { link, expiresAt }`. 409 se CPF já existe (orientar convite de vínculo) |
| POST `/api/coach/athletes/:id/access-link` | `athlete:update` (escopo PROP/vínculo) | F4 | Revoga token anterior e emite novo de 7 dias |
| POST `/api/invites/accept` (atleta avulso) | autenticado | F4 | Convite `ATLETA` cria `PlayerCT ACTIVE` para o atleta logado; histórico de partidas preservado |
| POST `/api/gestor/athletes/:id/unlink` | `ct:members:manage` (escopo CT) ou Suporte | F4 | Define `PlayerCT.status = ENDED` e `endedAt`; grava `AuditLog`. **Não existe** endpoint equivalente para o próprio atleta |

**Regras de contrato:**
- Desvincular nunca apaga `Player`, `User` ou `Match` (ADR-0008).
- Treinador só anota/lê partidas de atleta com `CoachAthleteLink ACTIVE`; vínculo `PENDING`/`ENDED` não concede acesso.
- Respostas de negação não revelam o motivo (apenas log).

---

### 7.2 Contratos planejados — Pool de Busca, Cadastro de Atletas e Claim (2026-10-27)

> Definidos em docs/PLANO_POOL_BUSCA_CADASTRO_ATLETAS_E_CLAIM_2026-10-27.md.

| Endpoint | Permissão | Fase | Contrato |
|---|---|---|---|
| GET /api/players | sessão ativa | F4 | Query: scope=club/pool, ctId, q, cursor, limit (máx 50). DTO mínimo com mascaramento de menores. |
| POST /api/players | athlete:create | F5 | mode: QUICK/WITH_LOGIN, myClub, ctId, cpf, birthDate, confirmNew. Duplicidade N1 (409) / N2. |
| GET /api/pool/venues | sessão ativa | F4 | Items: { clubId, ctId, name, city, isMine }. |
| POST /api/matches | match:create | F6 | Aceita venueClubId do pool sem exigir vínculo com CT. |
| PUT /api/gestor/athletes/links/:id | ct:members:manage | F5 | Body: { decision: CONFIRM/REJECT } sobre PlayerCT PENDING. |
| POST /api/athlete-claims | sessão ativa | F1 | Reivindicação segura: userId vem do token, checa player, 1 PENDING por par. |
| POST /api/auth/signup | público | F8 | E-mail nunca em User.cpf, validação mod 11 de CPF, claim automático de provisório N1/N0. |

---

## 8. Próximos Passos (Onda 1)

1. **@backend:** Implementar `src/lib/api-helpers.ts` + `src/lib/errors.ts`
2. **@backend:** Criar template `src/app/api/TEMPLATE/route.ts`
3. **@qa:** Criar testes de contrato para endpoints existentes
4. **@backend:** Refatorar endpoints críticos (login, matches) seguindo guardrails
5. **@arquitetura:** Revisar e aprovar padrão

---

## Referências

- `specs/api-contracts.md` — Contratos de API
- `src/schemas/contracts.ts` — Schemas Zod
- `docs/TECH_DEBT.md` — TD-002 (Validação inconsistente), TD-004 (Paginação), TD-006 (Error handling)
- `docs/REFACTOR_QUEUE.md` — RF-005, RF-006, RF-008