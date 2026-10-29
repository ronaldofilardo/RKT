# Plano de Remediação de Acesso, Segurança e Consistência Funcional

> **Status:** Concluída · **Data:** 2026-10-26  
> **Origem:** Auditoria de Modelo de Acesso, Rotas Scaffold e Regressões Funcionais

---

## 1. Diagnóstico Geral

A fundação do modelo de autorização baseada em `can()` e perfis derivados em `src/core/access/` é sólida, pura e testada por matriz. Todas as vulnerabilidades de autorização, regressões funcionais e scaffolds foram completamente remediados.

---

## 2. Fases de Execução

### Fase 0: Estancamento Imediato de Sangria (Segurança Crítica & Desbloqueio P0/P1)
- [x] Liberar rotas públicas no middleware: `/api/auth/signup`, `/api/auth/forgot`, `/api/auth/reset-password`.
- [x] Blindar `POST /api/support/password-resets/[id]/issue` com autorização restrita (`support:account:assist` / Admin) e remover vazamento de token para chamadas não autorizadas.
- [x] Blindar `POST /api/memberships` exigindo `platform:memberships:manage` ou `ct:members:manage`.
- [x] Sanitizar `GET /api/users/[id]/export` (select estrito sem `passwordHash` e autorização por titular/admin).
- [x] Proteger `POST /api/users/[id]/anonymize`, `/revoke-sessions` e `/operate` com permissões de plataforma.

### Fase 1: Restauração da API de Atletas (`/api/players`)
- [x] Restaurar método `POST` em `src/app/api/players/route.ts` com validação Zod e `createPlayer`.
- [x] Restaurar métodos `GET`, `PUT` e `DELETE` em `src/app/api/players/[id]/route.ts` conectando `player-put.logic.ts` e `player-delete.logic.ts`.
- [x] Padronizar envelope de resposta para `{ data: { players: [...] } }` / `{ data: { player: ... } }`.
- [x] Validar execução de testes em `src/app/api/players/__tests__` (meta: 55/55 verdes alcançada).

### Fase 2: Unificação de Papéis, Ator e Contexto de Operação
- [x] Integrar `deriveLegacyRole` e resolução de ator autenticado (`access-actor`).
- [x] Respeitar a flag `canOperate` no bloqueio de rotas de criação/anotação de partidas para contas não operacionais.
- [x] Reconciliar usuários Admin legados (`User.role=ADMIN`) e via membership `PLATAFORMA/ADMIN`.

### Fase 3: Blindagem Sistemática das 31 Rotas Scaffold com `can()`
- [x] **Lote A (Plataforma, CTs e Torneios):** `training-centers`, `clubs`, `link-invites`, `invites/accept`.
- [x] **Lote B (Atletas, Reivindicações e Vínculos):** `support/athlete-claims`, `players/merge`, `players/provisional`.
- [x] **Lote C (Responsáveis e Consentimentos):** `guardians/link`, rota de confirmação `confirm` e consentimentos.

### Fase 4: Integridade de Dados, Menores e Banco de Dados
- [x] Índice parcial PostgreSQL para unicidade de treinador avulso (`WHERE ctId IS NULL AND status = 'ACTIVE' AND kind = 'TREINADOR'`).
- [x] Proteção de dados de atletas menores em `/api/players` e perfil.
- [x] Transacionalidade no merge de atletas reatribuindo histórico e partidas.
- [x] Ampliação da visibilidade de partidas por CT e por participante (`Player.userId`).

### Fase 5: Integração de Telas e Navegação (UI/UX)
- [x] Links visuais de Cadastro e Recuperação de Senha na tela de login.
- [x] Telas dedicadas `/signup` e `/forgot` implementadas com feedback claro e acessibilidade.
- [x] Hook client-side `useAccess` implementado com suporte a `can()`.

---

## 3. Critérios de Aceite (DoD)
- 100% dos módulos em conformidade com STE-DEV R-03 (≤ 100 linhas).
- Zero testes quebrados; restabelecimento dos 55 testes de `/api/players`.
- Nenhuma brecha crítica aberta de bypass de permissão ou vazamento de credenciais.
