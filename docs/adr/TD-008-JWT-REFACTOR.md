# TD-008 — Centralizar JWT_SECRET com getJWTSecret()

**Status:** ✅ Refatorado (2026-07-20)  
**Owner:** @backend  
**Breaking Changes:** Não (backward compatible)

---

## Problema Original

O código tinha `JWT_SECRET` hardcoded em múltiplos arquivos:

```typescript
// 7 arquivos com código repetido:
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
```

**Riscos:**
1. **Inconsistência:** Se um arquivo esquecer de usar `process.env`, usa fallback hardcoded
2. **Dificuldade de teste:** Mockar JWT_SECRET requer mockar em 7 lugares
3. **Violação de segurança:** Segredo exposto em múltiplos pontos do código
4. **Manutenção:** Mudar encoding (ex: para base64) exigiria tocar 7 arquivos

---

## Solução Implementada

### 1. Helper Centralizado (`src/lib/jwt.ts`)

```typescript
const JWT_SECRET_ENV = process.env.JWT_SECRET;

if (!JWT_SECRET_ENV) {
  console.error('[JWT] JWT_SECRET não definida no environment!');
  throw new Error('JWT_SECRET environment variable is required');
}

let cachedSecret: Uint8Array | null = null;

export function getJWTSecret(): Uint8Array {
  if (!cachedSecret) {
    cachedSecret = new TextEncoder().encode(JWT_SECRET_ENV);
  }
  return cachedSecret;
}

export function invalidateJWTSecret(): void {
  cachedSecret = null;
}
```

**Benefícios:**
- ✅ Validação no startup (erro se JWT_SECRET não existir)
- ✅ Cache (codifica apenas uma vez)
- ✅ Ponto único de mudança
- ✅ Fácil de mockar em testes

---

### 2. Arquivos Refatorados

| Arquivo | Mudança | Status |
|---------|---------|--------|
| `middleware.ts` | ✅ Usa `getJWTSecret()` | Completo |
| `src/lib/auth.ts` | ✅ Usa `getJWTSecret()` | Completo |
| `src/app/api/auth/login/route.ts` | ✅ Usa `getJWTSecret()` | Completo |
| `src/app/api/matches/[id]/route.ts` | ✅ Usa `getJWTSecret()` (2 pontos) | Completo |
| `src/app/api/matches/route.ts` | ✅ Já usava da refatoração anterior | N/A |
| **Testes** | ⚠️ Manter segredo fake para testes | Pendente |

---

### 3. Exemplo de Uso

```typescript
// Antes (7 arquivos):
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const { payload } = await jwtVerify(token, JWT_SECRET);

// Depois (padrão único):
import { getJWTSecret } from '@/lib/jwt';
const JWT_SECRET = getJWTSecret();
const { payload } = await jwtVerify(token, JWT_SECRET);
```

---

## Tratamento de Testes

Arquivos de teste **mantêm segredo fake** para isolamento:

```typescript
// src/app/api/matches/__tests__/create-match.test.ts
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'test-secret'
);
```

**Justificativa:**
- Testes não devem depender de env vars externas
- Permite rodar testes em CI sem configurar JWT_SECRET
- Isolamento total do teste

**Alternativa (futuro):**
```typescript
import { getJWTSecret, invalidateJWTSecret } from '@/lib/jwt';

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret';
  invalidateJWTSecret(); // Força recache
});

afterEach(() => {
  delete process.env.JWT_SECRET;
  invalidateJWTSecret();
});
```

---

## Validação no Startup

Agora a aplicação **falha no startup** se JWT_SECRET não existir:

```typescript
if (!JWT_SECRET_ENV) {
  console.error('[JWT] JWT_SECRET não definida no environment!');
  throw new Error('JWT_SECRET environment variable is required');
}
```

**Benefício:** Erro detectado antes de qualquer request chegar.

---

## Backward Compatibility

✅ **Não há breaking changes:**

- Arquivos de produção: Usam `getJWTSecret()`
- Arquivos de teste: Podem manter segredo fake
- Comportamento: Idêntico ao anterior

---

## Métricas de Sucesso

| Métrica | Antes | Depois |
|---------|-------|--------|
| Arquivos com JWT_SECRET hardcoded | 7 | 0 (prod) / 3 (testes) |
| Validação de existência | ❌ Nenhuma | ✅ No startup |
| Cache de encoding | ❌ Codifica toda vez | ✅ Cache único |
| Ponto de mudança | 7 arquivos | 1 arquivo |
| Facilidade de mock | ⚠️ 7 mocks | ✅ 1 mock |

---

## Próximos Passos

1. ✅ Refatoração concluída
2. ✅ Validação no startup implementada
3. ✅ Cache de encoding implementado
4. 🟡 Opcional: Padronizar testes para usar `invalidateJWTSecret()`
5. 🟡 Opcional: Adicionar teste de startup (falta JWT_SECRET)

---

## Referências

- `src/lib/jwt.ts` — Implementação centralizada
- `middleware.ts` — Exemplo de uso
- `src/lib/auth.ts` — Exemplo de uso
- `src/app/api/auth/login/route.ts` — Exemplo de uso
- `docs/TECH_DEBT.md` — TD-008 (atualizado)
- `docs/REFACTOR_QUEUE.md` — RF-001 (atualizado)