# Plano: Aba Solicitações no Gestor e Painel com 4 Abas do Responsável

- **Data:** 2026-11-18
- **Status:** Em Execução
- **Origem:** Solicitação do Usuário (EGM - Elephant & Goldfish)
- **Metodologia:** STE-DEV / Elephant-Goldfish Model

---

## 1. Visão Geral e Objetivos

### 1.1. Gestor (`/clube/gestor` mapeado internamente para `/gestor`)
- Exibir aba condicional **"Solicitações"** com badge numérico somente quando houver indicações de menores pendentes de aprovação pelo CT (`PlayerCT.status === 'PENDING'`).
- Permitir ao gestor **Aceitar** (`PlayerCT.status = 'ACTIVE'`, preenchendo `since: new Date()`) ou **Recusar** (`PlayerCT.status = 'REJECTED'`), com auditoria em `AuditLog`.

### 1.2. Responsável Legal (`/responsavel`)
- **Unificação Espectador & Responsável:** Na topbar (`GuardianTopBar`), quando `canOperate === true`, fornecer atalho direto para o painel esportivo (`/dashboard` - Minhas Partidas / Anotar). Na aba Partidas, exibir botão de atalho `+ Anotar partida do menor`.
- **4 Abas Modulares:**
  1. `Autorizações`: Cartão do menor (`DependentCard`), Tríade (`DATA`, `BROADCAST`, `STATS`), Monotutela Estrita e Termos de Tutela (v2.0).
  2. `Partidas`: Lista de partidas do menor (`DependentMatchesList`) com supervisão parental e atalhos para anotação.
  3. `Avisos`: Acompanhamento de status das indicações enviadas (CT, treinador particular, convites via WhatsApp).
  4. `Acessos`: Indicador se a conta do menor foi habilitada (`Player.userId !== null`) e log de logins/logouts no aplicativo sob auditoria parental (ECA Digital).

---

## 2. Roteiro de Fatias Verticais

### Fatia 1: Backend de Auditoria de Acesso e Endpoints de Consulta do Responsável
1. `recordUserLoginAudit` em `src/app/api/auth/login/login-audit.logic.ts` integrado ao `POST /api/auth/login`.
2. Registro de `USER_LOGOUT` em `src/app/api/auth/logout/route.ts` capturando o usuário via cookie/header.
3. `GET /api/guardians/me/dependents/[playerId]/access-logs`:
   - Verifica tutela ativa do responsável sobre o menor.
   - Retorna status de habilitação (`hasAccount: boolean`, `email`, `mustChangePassword`, `activatedAt`) e timeline de acessos (`AuditLog` `USER_LOGIN`, `USER_LOGOUT`, `ACCOUNT_ACTIVATED`).
4. `GET /api/guardians/me/dependents/[playerId]/indications`:
   - Retorna vínculos de CT (`PlayerCT`), treinadores (`CoachAthleteLink`) e convites externos (`CoachInvitationToken`).

### Fatia 2: Backend de Solicitações do Gestor (`PlayerCT` PENDING)
1. `GET /api/gestor/requests`:
   - Lista indicações `PlayerCT` com `status: 'PENDING'` para o `ctId` do gestor autenticado, com contagem e dados do menor, responsável e consentimentos.
2. `PUT /api/gestor/requests/[id]`:
   - Aceite (`decision: 'ACCEPT'`) ou recusa (`decision: 'REJECT'`) com gravação em `AuditLog`.

### Fatia 3: Frontend do Gestor (`/gestor`)
1. `src/app/gestor/types.ts`: Adicionar `'solicitacoes'` a `GestorTab`.
2. `src/app/gestor/tab-nav.tsx`: Renderizar aba "Solicitações" somente se `solicitacoesCount > 0`.
3. `src/app/gestor/solicitacoes-table.tsx`: Interface com lista de pedidos, dados do responsável e botões Aceitar/Recusar.
4. `src/app/gestor/dashboard.tsx` e `data-logic.ts`: Carregar contagem e lista de solicitações.

### Fatia 4: Frontend do Responsável (`/responsavel`)
1. `src/app/responsavel/guardian-topbar.tsx`: Atalho para `/dashboard` se `canOperate === true`.
2. `src/app/responsavel/guardian-tabs-nav.tsx`: Componente de navegação em 4 abas.
3. `src/app/responsavel/guardian-tab-autorizacoes.tsx`: Aba 1.
4. `src/app/responsavel/guardian-tab-partidas.tsx`: Aba 2 (com atalho para anotação se `canOperate === true`).
5. `src/app/responsavel/guardian-tab-avisos.tsx`: Aba 3 (status das indicações de CT e treinador).
6. `src/app/responsavel/guardian-tab-acessos.tsx`: Aba 4 (status de habilitação e timeline de acessos).
7. `src/app/responsavel/page.tsx`: Orquestração em abas mantendo $\le 100$ linhas.

### Fatia 5: Testes e Verificação
- Suíte de testes automatizados unitários e de integração.
- `pnpm check:r03` (0 violações, 0 regressões).
- `pnpm typecheck` (0 erros).
- Atualização em `MEMORY.md` e `TASKS.md`.
