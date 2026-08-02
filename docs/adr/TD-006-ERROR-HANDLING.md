# TD-006 — Error Handling Centralizado

**Status:** ✅ Resolvido (Onda 1 — Guardrails)  
**Owner:** @backend + @frontend  
**Breaking Changes:** Não

---

## Problema Original

Cada endpoint/componente tratava erros de forma inconsistente:

```typescript
// Múltiplos padrões de error handling:
try {
  // ...
} catch (error) {
  console.error('Error', error); // Mensagens variadas
  return NextResponse.json({ error: 'Error' }); // Formatos diferentes
}
```

**Riscos:**
1. **Stack traces expostos** — Vulnerabilidade de segurança
2. **UX inconsistente** — Cada tela mostra erro de um jeito
3. **Dificuldade de debug** — Logs sem padrão
4. **Código repetido** — Mesmo tratamento em N lugares

---

## Solução Implementada (Onda 1)

### 1. Backend: `handleApiError()` (src/lib/api-helpers.ts)

```typescript
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
```

**Benefícios:**
- ✅ Stack traces nunca expostos em produção
- ✅ Formato de resposta padronizado
- ✅ Logs com prefixo `[API_ERROR]`
- ✅ 1 linha vs 10+ linhas de tratamento manual

### 2. Classes de Erro (`src/lib/errors.ts`)

```typescript
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

export class ValidationError extends ApiError { /* ... */ }
export class NotFoundError extends ApiError { /* ... */ }
export class ForbiddenError extends ApiError { /* ... */ }
export class UnauthorizedError extends ApiError { /* ... */ }
export class ConflictError extends ApiError { /* ... */ }
```

**Benefícios:**
- ✅ Tipos de erro explícitos
- ✅ Status HTTP correto automaticamente
- ✅ Fácil de testar e mockar

### 3. Frontend: Error Boundaries (Next.js App Router)

**`src/app/error.tsx` (Error Boundary por rota):**
```tsx
'use client';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[ErrorBoundary]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen ...">
      <h2>Algo deu errado</h2>
      <button onClick={() => reset()}>Tentar novamente</button>
      <Link href="/">Voltar ao início</Link>
      {process.env.NODE_ENV === 'development' && (
        <pre>{error.message}\n{error.stack}</pre>
      )}
    </div>
  );
}
```

**`src/app/global-error.tsx` (Error Boundary global):**
```tsx
'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="pt-BR">
      <body>
        {/* UI de erro crítica */}
      </body>
    </html>
  );
}
```

**Benefícios:**
- ✅ UI de erro consistente em toda aplicação
- ✅ Reset de estado com `reset()`
- ✅ Stack trace apenas em development
- ✅ Acessível (botões, links, contraste)

---

## Padrão de Uso

### Backend (API Routes)

```typescript
import { handleApiError, jsonResponse } from '@/lib/api-helpers';
import { NotFoundError, ValidationError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const resource = await getResource(id);
    
    if (!resource) {
      throw new NotFoundError('Resource', id);
    }
    
    return jsonResponse({ data: resource });
  } catch (error) {
    return handleApiError(error); // ← 1 linha, tratamento completo
  }
}
```

### Frontend (Componentes)

```tsx
'use client';

import { useState } from 'react';

export function MyComponent() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = (err: Error) => {
    setError(err);
    // Error boundary vai capturar e mostrar UI apropriada
    throw err;
  };

  if (error) {
    return (
      <div className="error-state">
        <p>Erro ao carregar</p>
        <button onClick={() => setError(null)}>Tentar novamente</button>
      </div>
    );
  }

  // ... resto do componente
}
```

---

## APIs com Error Handling Padronizado

| API | Status | Error Handler |
|-----|--------|---------------|
| `POST /api/auth/login` | ✅ Completo | `handleApiError()` |
| `GET /api/players` | ✅ Completo | `handleApiError()` |
| `POST /api/players` | ✅ Completo | `handleApiError()` |
| `GET /api/matches` | ✅ Completo | `handleApiError()` |
| `POST /api/matches` | ✅ Completo | `handleApiError()` |
| `GET /api/admin/users` | ✅ Completo | `handleApiError()` |
| `POST /api/admin/users` | ✅ Completo | `handleApiError()` |
| `PUT /api/admin/users/[id]` | ✅ Completo | `handleApiError()` |
| `DELETE /api/admin/users/[id]` | ✅ Completo | `handleApiError()` |
| `POST /api/matches/[id]/point` | ✅ Completo | `handleApiError()` |
| `POST /api/matches/[id]/finish` | ✅ Completo | `handleApiError()` |
| `PATCH /api/matches/[id]/state` | ✅ Completo | `handleApiError()` |
| `GET /api/matches/[id]/report` | ✅ Completo | `handleApiError()` |
| `GET /api/matches/[id]/sessions` | ✅ Completo | `handleApiError()` |
| `POST /api/matches/[id]/sessions` | ✅ Completo | `handleApiError()` |
| `PATCH /api/matches/[id]/sessions/:sessionId` | ✅ Completo | `handleApiError()` |
| `POST /api/matches/[id]/sessions/:sessionId/endorse` | ✅ Completo | `handleApiError()` |
| `POST /api/matches/[id]/sessions/:sessionId/abandon` | ✅ Completo | `handleApiError()` |

**Total:** 18 APIs com error handling padronizado

---

## Error Boundaries por Rota

| Rota | Error Boundary | Status |
|------|----------------|--------|
| `/` (global) | `global-error.tsx` | ✅ |
| `/dashboard` | `error.tsx` | ✅ |
| `/match/[id]/scoring` | `error.tsx` | ✅ |
| `/match/[id]/report` | `error.tsx` | ✅ |
| `/admin` | `error.tsx` | ✅ |
| `/login` | `error.tsx` | ✅ |
| Todas outras rotas | `error.tsx` | ✅ |

---

## Métricas de Sucesso

| Métrica | Antes | Depois |
|---------|-------|--------|
| APIs com error handler padronizado | 0/18 | 18/18 (100%) |
| Error boundaries implementados | 0 | 2 (global + rota) |
| Stack traces expostos em produção | ⚠️ Sim | ✅ Não |
| Código de tratamento de erro (média por API) | 10+ linhas | 1 linha |
| Classes de erro tipadas | 0 | 6 |
| Consistência de UI de erro | ⚠️ Variável | ✅ Padronizada |

---

## Próximos Passos (Opcional)

### Melhorias de Longo Prazo

1. **Logging estruturado:** Integrar com Sentry/Datadog
2. **Error tracking:** Dashboard de erros em produção
3. **Alertas:** Notificar erros críticos em tempo real
4. **Fallback UI:** Estados de erro específicos por componente

### Critérios de Prioridade

**Alta:** Erros críticos em produção afetando usuários  
**Média:** Erros frequentes (>10/dia)  
**Baixa:** Erros cosméticos ou de baixa frequência

---

## Referências

- `src/lib/api-helpers.ts` — `handleApiError()`
- `src/lib/errors.ts` — Classes de erro tipadas
- `src/app/error.tsx` — Error boundary de rota
- `src/app/global-error.tsx` — Error boundary global
- `docs/TECH_DEBT.md` — TD-006 (resolvido)
- `docs/REFACTOR_QUEUE.md` — RF-008 (resolvido)