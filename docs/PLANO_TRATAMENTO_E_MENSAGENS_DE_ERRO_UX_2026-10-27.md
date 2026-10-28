# Plano: Tratamento e Mensagens de Erro Amigáveis (UX)

> **Data:** 2026-10-27  
> **Status:** Proposto / Planejado  
> **Objetivo:** Eliminar códigos de erro crus, falhas silenciosas e popups arcaicos (`window.alert()`), estabelecendo uma experiência de usuário (UX) acolhedora, clara e com mensagens acionáveis em toda a aplicação.

---

## 1. Diagnóstico dos Problemas de UX Atuais

1. **Respostas da API Sem Mensagem Humana:**
   - Rotas de API que usam Zod frequentemente retornam `{ error: 'VALIDATION_ERROR', details: ... }` sem um campo `message` em português.
   - O frontend tenta acessar `res.message`, que vem `undefined`, e faz fallback para `res.error`, exibindo o código técnico `"VALIDATION_ERROR"` na interface.
2. **Erros de Parse e Payloads Incompletos:**
   - Endpoints que chamam `request.json()` diretamente sem fallback sofrem com `SyntaxError: Unexpected end of JSON input` em requisições de corpo vazio, resultando em erros 500 no log e frustração do usuário.
3. **Uso de Popups Arcaicos (`window.alert`):**
   - Vários botões de ação (como gerar link de senha e ações de listagem) acionam `alert()` do navegador, interrompendo a navegação e quebrando o padrão de design visual.
4. **Modais Sem Identificação do Campo com Problema:**
   - Modais de cadastro e edição exibem uma tarja genérica de erro no cabeçalho sem destacar qual campo causou o erro (ex.: CPF malformatado, data ausente, nome curto), deixando o usuário sem saber o que corrigir.

---

## 2. Arquitetura da Solução

```
                  ┌───────────────────────────────────────────────┐
                  │              REQUISIÇÃO DA UI                 │
                  └──────────────────────┬────────────────────────┘
                                         ▼
                  ┌───────────────────────────────────────────────┐
                  │           API BACKEND / WITHACCESS            │
                  │  1. Zod safeParse com formatZodMessage()      │
                  │  2. request.json().catch(() => null)          │
                  │  3. Resposta padronizada { error, message }   │
                  └──────────────────────┬────────────────────────┘
                                         ▼
                  ┌───────────────────────────────────────────────┐
                  │         FRONTEND - extractErrorMessage()      │
                  │  Traduz qualquer resposta/exceção em texto    │
                  │  claro, acionável e acolhedor em português     │
                  └──────────────────────┬────────────────────────┘
                                         ▼
            ┌────────────────────────────┴──────────────────────────┐
            ▼                                                       ▼
┌───────────────────────────┐                           ┌───────────────────────────┐
│     NOTIFICAÇÃO GLOBAL    │                           │    FORMULÁRIOS & MODAIS   │
│  useToast ({ type, msg }) │                           │  Borda vermelha no campo  │
│  Substitui todo alert()   │                           │  Texto de ajuda explicativo│
└───────────────────────────┘                           └───────────────────────────┘
```

---

## 3. Dicionário de Tradução de Erros (Técnico ➔ Humano)

| Código Técnico / Cenário | Mensagem Técnica Anterior | Mensagem Amigável Proposta (UX) |
|---|---|---|
| `VALIDATION_ERROR` (Zod) | `"VALIDATION_ERROR"` | *Extrai diretamente a regra violada: ex.: "CPF: informe um CPF válido com 11 dígitos" ou "Nome deve ter pelo menos 2 caracteres."* |
| `EMAIL_ALREADY_EXISTS` / `CONFLICT` | `"CONFLICT"` | *"Este e-mail ou CPF já está cadastrado no sistema."* |
| `NOT_FOUND` | `"NOT_FOUND"` | *"O registro solicitado não foi encontrado ou você não possui permissão para acessá-lo."* |
| `FORBIDDEN` / `UNAUTHORIZED` | `"FORBIDDEN"` | *"Ação não permitida para o seu perfil de acesso."* |
| `INVALID_JSON` / `EMPTY_BODY` | `"SyntaxError: Unexpected end..."` | *"Dados da requisição incompletos. Atualize a página e tente novamente."* |
| `CLUBE_SUSPENSO` | `"CLUBE_SUSPENSO"` | *"Este clube encontra-se temporariamente suspenso pelo suporte."* |
| `FAILED_FETCH` / Queda de rede | `"Failed to fetch"` | *"Não foi possível conectar ao servidor. Verifique sua conexão com a internet."* |
| `INTERNAL_ERROR` | `"INTERNAL_ERROR"` | *"Não conseguimos processar esta ação no momento. Nossa equipe foi notificada."* |

---

## 4. Etapas de Execução

### Etapa 1: Backend — Formatação Automática de Erros Zod
- **Módulo:** `src/lib/api-response.logic.ts`
- **Implementação:**
  - Adicionar função pura `formatZodMessage(error: ZodError): string` que extrai a primeira mensagem relevante do Zod para o atributo `message` da resposta.
  - Assegurar que todas as rotas que validam payload via Zod retornem sempre `{ error: 'VALIDATION_ERROR', message: formatZodMessage(parsed.error), details: parsed.error.flatten() }` com status 400.
  - Manter a regra de leitura segura `request.json().catch(() => null)`.

### Etapa 2: Frontend — Extrator Universal de Mensagens de Erro
- **Módulo:** `src/lib/error-parser.ts` (novo módulo puro, < 100 linhas, R-03)
- **Implementação:**
  - Função pura `extractErrorMessage(error: unknown, fallback?: string): string`:
    1. Se for string, retorna diretamente.
    2. Se for objeto com `message` legível (não igual ao código), retorna `message`.
    3. Se houver `details.fieldErrors`, monta a mensagem com o primeiro campo com problema.
    4. Se houver código de erro conhecido no dicionário, retorna a tradução em português.
    5. Se for `TypeError: Failed to fetch`, retorna a mensagem de conexão/rede.
    6. Caso contrário, retorna o fallback amigável padrão.

### Etapa 3: Interface — Eliminação de `alert()` e Feedback de Formulário
- **Notificações:**
  - Substituir todas as chamadas a `window.alert()` em tabelas e páginas por `toast({ type: 'error', message })` do hook `useToast()`.
  - Adicionar toasts de sucesso para ações assíncronas concluídas (*"Link copiado para a área de transferência"*, *"Dados atualizados com sucesso"*, etc.).
- **Modais de Cadastro e Edição:**
  - (`EditarAtletaModal`, `EditarTreinadorModal`, `CadastrarMembroModal`, `EditarClubeModal`, `EditarGestorModal`).
  - Destaque visual nos campos com erro (borda vermelha `border-red-500` e mensagem de apoio).
  - Bloqueio de duplo clique com estado `loading` e texto visualmente explícito no botão de envio.

---

## 5. Critérios de Aceite (DoD)
- [ ] 0 ocorrências de `window.alert()` em código de produção.
- [ ] 0 mensagens técnicas como `"VALIDATION_ERROR"`, `"CONFLICT"` ou `"SyntaxError"` visíveis ao usuário final.
- [ ] Todas as rotas de API respondem com propriedade `message` compreensível em português ao falhar validação.
- [ ] Formulários destacam os campos com erro e orientam o usuário sobre a correção necessária.
- [ ] 100% de conformidade com **R-03** (todos os arquivos `< 100` linhas).
- [ ] `pnpm typecheck` com 0 erros.
- [ ] Suítes de testes atualizadas e verdes.

