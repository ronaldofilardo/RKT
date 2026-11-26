# Plano de Implementação — Integração com Gateway Asaas para Cobrança Recorrente

> **Código:** `PLANO_INTEGRACAO_GATEWAY_ASAAS_COBRANCA_2026-11-25`  
> **Data:** 2026-11-25 · **Status:** Pronto para Execução  
> **Metodologia:** Elephant-Goldfish Model (EGM) + STE-DEV (Regra R-03: $\le 100$ linhas por arquivo)  
> **Base de Conhecimento:** Arquitetura Asaas v3 em `C:\apps\mundoas`  
> **Legislação & Governança:** LGPD (Lei nº 13.709/2018) e ECA Digital (Lei nº 15.211/2025)

---

## 1. Visão Geral e Objetivos do Negócio

O sistema RKT opera em modelo híbrido de monetização (B2B/B2C), no qual Centros de Treinamento (CTs) e Treinadores Particulares pagam pelo volume de atletas ativos gerenciados, e Atletas Independentes contratam o plano `Atleta Pro`.

O objetivo deste plano é estabelecer a esteira de pagamentos automatizada utilizando o gateway **Asaas** (API v3 REST), viabilizando:
1. **Cobrança Recorrente (Assinaturas):** Cobrança mensal ou anual via Pix e Cartão de Crédito com renovação automática.
2. **Ativação Instantânea:** Liberação imediata da conta do usuário de `TRIAL`/`EXPIRED` para `ACTIVE` no recebimento do webhook de pagamento (`PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED`).
3. **Respeito ao ECA Digital:** Cobrança de atletas menores de 18 anos faturada compulsoriamente no CPF e titularidade financeira do **Responsável Legal**.
4. **Soft Limit em Inadimplência:** Período de carência de 7 dias antes do bloqueio de novas partidas em caso de atraso (`OVERDUE`), com transição para `Modo Consulta` e preservação integral dos dados.

---

## 2. Base de Conhecimento e Benchmarking (`mundoas` vs `RKT`)

A partir da análise do repositório de referência `C:\apps\mundoas`, absorvemos as soluções testadas e ajustamos os desvios arquiteturais:

| Módulo / Padrão | Solução em `mundoas` | Adaptação para o `RKT` |
| :--- | :--- | :--- |
| **Cliente HTTP** | `fetch` nativo com `access_token` e alternância Sandbox/Produção (`ASAAS_SANDBOX`). | **Mantido:** Cliente leve e sem SDK em `src/lib/asaas/`, 100% tipado com Zod e TypeScript. |
| **Deduplicação de Clientes** | Busca por `externalReference`, fallback por CPF/CNPJ limpo, depois `POST /customers`. | **Mantido e Especializado:** Prefixos `"CT:<ctId>"` e `"USER:<userId>"` na `externalReference` para diferenciar pessoa jurídica de pessoa física. |
| **Segurança do Webhook** | Header `asaas-access-token` validado com `safeCompareTokens` (SHA-256 + `timingSafeEqual`). | **Mantido:** Prevenção estrita contra *timing attacks* no endpoint público de webhook. |
| **Idempotência** | Tabela `asaas_webhook_events` com chave única `asaas_event_id`. | **Mantido:** Reenvios do Asaas retornam `200 { ok: true, repetido: true }` sem reexecutar mutações de banco. |
| **Não-Regressão** | Fatura/Assinatura paga não regride para pendente por eventos desordenados. | **Mantido:** Salvaguarda contra chegada de `PAYMENT_CREATED` após `PAYMENT_RECEIVED`. |
| **Monólito de Código** | `route.ts` de webhook com 385 linhas (violação grave). | **Refatorado por Design (R-03):** Rota e handlers particionados em arquivos $\le 80$ linhas cada. |
| **Menores de 18 Anos** | Não contemplado (contexto unicamente corporativo). | **Adicionado compulsoriamente:** Validação etária; menor faturado sempre pelo `GuardianLink`. |

---

## 3. Princípios de Governança, LGPD e ECA Digital

1. **Titularidade Financeira de Menores (ECA Digital):**
   - É expressamente vedado cadastrar atletas menores de 18 anos como clientes pagadores no Asaas.
   - Ao assinar o plano `Atleta Pro` para um menor, a API de checkout busca o `GuardianLink` ativo e gera o cliente no Asaas com os dados civis do pai/mãe/tutor.
2. **Modo Consulta sem Perda de Dados:**
   - Em caso de cancelamento da assinatura ou inadimplência após 7 dias de carência, a conta transiciona para `Modo Consulta`.
   - Nenhuma partida, placar, áudio ou relatório é excluído ou ocultado. O bloqueio atua unicamente sobre `POST /api/matches` e novos cadastros.
3. **Minimização de Dados (Art. 6º, III da LGPD):**
   - O RKT trafega para o Asaas apenas os campos estritamente necessários para cobrança bancária: Nome completo, CPF/CNPJ, E-mail e Telefone.

---

## 4. Arquitetura da Solução e Modelagem de Dados

### 4.1 Schema Prisma (DDL)

```prisma
enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELED
}

enum BillingCycle {
  MONTHLY
  YEARLY
}

model Subscription {
  id                    String             @id @default(cuid())
  userId                String?            @map("user_id")
  ctId                  String?            @map("ct_id")
  planTier              String             @map("plan_tier")
  cycle                 BillingCycle       @default(MONTHLY)
  status                SubscriptionStatus @default(TRIAL)
  asaasCustomerId       String?            @map("asaas_customer_id")
  asaasSubscriptionId   String?            @unique @map("asaas_subscription_id")
  currentPeriodStart    DateTime           @default(now()) @map("current_period_start")
  currentPeriodEnd      DateTime?          @map("current_period_end")
  pastDueSince          DateTime?          @map("past_due_since")
  createdAt             DateTime           @default(now()) @map("created_at")
  updatedAt             DateTime           @updatedAt @map("updated_at")

  user                  User?              @relation(fields: [userId], references: [id], onDelete: Cascade)
  ct                    TrainingCenter?    @relation(fields: [ctId], references: [id], onDelete: Cascade)
  invoices              Invoice[]

  @@index([userId, status])
  @@index([ctId, status])
  @@map("subscriptions")
}

model Invoice {
  id                    String             @id @default(cuid())
  subscriptionId        String             @map("subscription_id")
  asaasPaymentId        String?            @unique @map("asaas_payment_id")
  value                 Decimal            @db.Decimal(10, 2)
  dueDate               DateTime           @db.Date @map("due_date")
  status                String             @default("PENDING")
  billingType           String?            @map("billing_type")
  invoiceUrl            String?            @map("invoice_url")
  bankSlipUrl           String?            @map("bank_slip_url")
  pixCopiaECola         String?            @map("pix_copia_e_cola")
  pixQrCodeBase64       String?            @map("pix_qrcode_base64")
  paidAt                DateTime?          @map("paid_at")
  createdAt             DateTime           @default(now()) @map("created_at")

  subscription          Subscription       @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@index([subscriptionId, status])
  @@map("invoices")
}

model AsaasWebhookEvent {
  id                    String             @id @default(cuid())
  asaasEventId          String             @unique @map("asaas_event_id")
  eventType             String             @map("event_type")
  payloadJson           Json               @map("payload_json")
  processedAt           DateTime?          @map("processed_at")
  error                 String?
  createdAt             DateTime           @default(now()) @map("created_at")

  @@map("asaas_webhook_events")
}
```

---

## 5. Estrutura Modular de Pastas (R-03: $\le 100$ Linhas)

A arquitetura desacopla a comunicação externa do tratamento de regras de negócio internas:

```
src/
├── lib/
│   └── asaas/
│       ├── asaas-config.ts                 # URLs, headers e resolução de chaves (≤ 40L)
│       ├── asaas-fetch.ts                  # Wrapper HTTP para API v3 com tratamento de erros (≤ 55L)
│       ├── asaas-customer.service.ts       # Busca/Criação de customer com dedup CPF/CNPJ (≤ 75L)
│       ├── asaas-subscription.service.ts   # Criação e gestão de assinaturas recorrentes (≤ 80L)
│       └── asaas-webhook-auth.ts           # safeCompareTokens com timingSafeEqual e SHA-256 (≤ 25L)
│
├── app/api/
│   ├── checkout/
│   │   ├── create-session/
│   │   │   ├── route.ts                    # POST /api/checkout/create-session (≤ 50L)
│   │   │   └── checkout-session.logic.ts   # Resolução de pagador (ECA) e chamada Asaas (≤ 85L)
│   │   └── pix-status/
│   │       ├── route.ts                    # GET /api/checkout/pix-status (polling de confirmação) (≤ 50L)
│   │       └── pix-status.logic.ts         # Consulta status do pagamento (≤ 50L)
│   │
│   └── webhooks/
│       └── asaas/
│           ├── route.ts                    # Autenticação de token e roteador de eventos (≤ 50L)
│           ├── webhook-dedup.logic.ts      # Registro em AsaasWebhookEvent e checagem de repetição (≤ 55L)
│           ├── webhook-payment.logic.ts    # Tratamento de PAYMENT_CONFIRMED/RECEIVED/OVERDUE (≤ 85L)
│           └── webhook-subscription.logic.ts # Tratamento de SUBSCRIPTION_DELETED/UPDATED (≤ 70L)
```

---

## 6. Fases Verticais de Implementação (Roadmap & DoD)

### Fase 1: Camada de Infraestrutura e Cliente Asaas v3
* **Objetivo:** Estabelecer a comunicação segura com a API do Asaas e implementar a persistência no banco.
* **Tarefas:**
  1. Criar migration no Prisma com as tabelas `subscriptions`, `invoices` e `asaas_webhook_events`.
  2. Implementar `src/lib/asaas/asaas-config.ts` e `asaas-fetch.ts`.
  3. Implementar `asaas-customer.service.ts` com busca por `externalReference` e CPF/CNPJ limpo.
  4. Implementar `asaas-subscription.service.ts` para criação de assinaturas no Asaas.
  5. Implementar `asaas-webhook-auth.ts` para validação criptográfica do token.
  6. **Testes Unitários:** Testes de mock da API Asaas em `src/lib/asaas/__tests__/`.
* **DoD:** Testes do cliente Asaas verdes, migrations aplicadas e 0 erros de tipagem.

---

### Fase 2: Endpoint de Checkout e Resolução de Pagador (ECA Digital)
* **Objetivo:** Permitir que o usuário no frontend inicie o pagamento e receba as opções de Pix ou Cartão.
* **Tarefas:**
  1. Criar endpoint `POST /api/checkout/create-session`:
     - Validação Zod do payload (`planTier`, `cycle`, `billingType`).
     - **Trava ECA:** Se usuário for menor de 18 anos, extrair nome/CPF do Responsável Legal via `GuardianLink`.
     - Chamar `buscarOuCriarCustomer` no Asaas com os dados do pagador legítimo.
     - Criar assinatura no Asaas via `criarAssinaturaAsaas`.
     - Gravar registro `Subscription` com status `TRIAL` e `Invoice` com status `PENDING`.
     - Retornar links e dados do Pix (*QR Code Base64 + Pix Copia e Cola*).
  2. Criar endpoint leve de polling `GET /api/checkout/pix-status` para atualização reativa da tela.
  3. **Testes Unitários:** Cobrir cenários de pagador adulto, pagador CT e pagador responsável de menor.
* **DoD:** Endpoint de checkout funcional com testes automatizados aprovados.

---

### Fase 3: Receptor de Webhook Seguro e Idempotente
* **Objetivo:** Processar confirmações de pagamento do Asaas e ativar a conta instantaneamente.
* **Tarefas:**
  1. Criar endpoint `POST /api/webhooks/asaas`:
     - Validar header `asaas-access-token` contra `ASAAS_WEBHOOK_TOKEN`.
     - Verificar duplicidade em `AsaasWebhookEvent` via `webhook-dedup.logic.ts`.
  2. Implementar `webhook-payment.logic.ts`:
     - Tratar `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED`:
       - Localizar `Subscription` e atualizar `status = 'ACTIVE'`, limpando `pastDueSince`.
       - Atualizar `Invoice.status = 'CONFIRMED'` e preencher `paidAt = new Date()`.
       - **Regra de não-regressão:** Ignorar eventos se a fatura já estiver paga.
     - Tratar `PAYMENT_OVERDUE`:
       - Marcar `pastDueSince = new Date()`.
       - Se atraso $> 7$ dias, marcar `Subscription.status = 'PAST_DUE'`.
  3. Implementar `webhook-subscription.logic.ts`:
     - Tratar `SUBSCRIPTION_DELETED`:
       - Marcar `Subscription.status = 'CANCELED'`.
  4. **Testes de Integração:** Simulação de disparos de webhook em `src/app/api/webhooks/asaas/__tests__/`.
* **DoD:** Webhook processando eventos com idempotência comprovada em testes.

---

### Fase 4: Integração Frontend (Checkout e Feedback em Tempo Real)
* **Objetivo:** Conectar os modais `LastFreeAccessModal` e `PaywallModal` ao fluxo de checkout real.
* **Tarefas:**
  1. No clique de "Assinar Plano":
     - Exibir modal de checkout com opções: **Pix Instantâneo** ou **Cartão de Crédito**.
  2. Na opção Pix:
     - Exibir QR Code gerado pelo Asaas, botão "Copiar Código Pix" e contador de expiração.
     - Ativar polling em `GET /api/checkout/pix-status`.
     - Ao detectar confirmação, exibir feedback de sucesso e fechar o modal.
  3. Atualizar o contexto do usuário:
     - `useBillingStatus` atualiza o estado para `ACTIVE`.
     - O banner de degustação no header é removido imediatamente.
* **DoD:** Fluxo de ponta a ponta testado no ambiente Sandbox do Asaas.

---

## 7. Auditoria Goldfish (Matriz de Riscos e Mitigações)

| # | Risco Identificado | Severidade | Salvaguarda / Mitigação Implementada |
| :--- | :--- | :---: | :--- |
| **1** | Webhook duplicado ou reentregue pelo Asaas gerando reativações repetidas. | Média | Tabela `asaas_webhook_events` com chave única `asaas_event_id`; retorno `200` imediato para eventos já processados. |
| **2** | Cobrança no nome de atleta menor violando o ECA Digital. | Alta | O backend inspeciona a idade do atleta; se $< 18$ anos, força o `customer` no Asaas para o Responsável Legal. |
| **3** | Evento `PAYMENT_CREATED` chegando após `PAYMENT_RECEIVED` desmarcando fatura paga. | Alta | Regra estrita de não-regressão: se o status atual for pago, eventos pendentes não alteram o estado. |
| **4** | Ataque de temporização (*timing attack*) para descobrir o token do webhook. | Alta | Utilização de `safeCompareTokens` com `timingSafeEqual` e hashing SHA-256 prévio. |
| **5** | Instabilidade ou timeout na API do Asaas travando a requisição do usuário. | Média | Timeout de 10 segundos no `asaasFetch` com fallback gracioso e mensagens de erro amigáveis ao usuário. |
| **6** | Violação do limite de 100 linhas por arquivo (STE-DEV R-03). | Alta | Todos os arquivos são mantidos abaixo de 90 linhas através de fatiamento modular estrito. |

---

## 8. Critérios de Aceite e Definition of Done Geral

1. **Variáveis de Ambiente Configuradas:** `.env` documentado com `ASAAS_API_KEY`, `ASAAS_SANDBOX` e `ASAAS_WEBHOOK_TOKEN`.
2. **Conformidade STE-DEV R-03:** Todos os arquivos criados ou modificados possuem $\le 100$ linhas.
3. **Cobertura de Testes:** Suíte Jest rodando com mock do Asaas cobrindo criação de customer, checkout, webhook e tratamento de inadimplência.
4. **Tipagem e Lint:** `pnpm typecheck` com 0 erros e ESLint aprovado sem exceções injustificadas.
5. **Registro Canônico:** Tarefa registrada em `docs/TASKS.md` e histórico consolidado em `docs/MEMORY.md`.
