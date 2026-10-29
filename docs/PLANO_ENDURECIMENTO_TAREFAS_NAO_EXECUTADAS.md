# Tarefas Não Executadas — PLANO_ENDURECIMENTO_2026-10-06.md

**Origem:** `docs/PLANO_ENDURECIMENTO_2026-10-06.md`  
**Status:** Proposto, aguardando decisões da seção "Decisões pendentes"  
**Base:** Auditoria estática do `bkpRKT.zip` (sem alteração de código)  
**Nota:** Testes, typecheck e build **não** foram executados no sandbox. Toda validação acontece na máquina do desenvolvedor.

---

## Regras Inegociáveis (todas as fases)

1. Nenhuma alteração de código antes da baseline verde (Fase 0).
2. Teste primeiro: caracterização antes de alterar comportamento.
3. Proibido mascarar: não apagar teste, enfraquecer asserção, usar `.skip` nem reduzir contagem de testes.
4. Contratos congelados: formatos de resposta das APIs (`/report`, `/point`, `/matches`, login) ganham snapshot "golden". Mudanças só aditivas.
5. Banco só com expand/contract. Migrações aditivas, nunca destrutivas na mesma entrega. Backup ou branch do Neon antes de cada migração.
6. Entregas pequenas: um assunto por zip, só arquivos alterados mais testes, com nota de rollback.
7. Portão de saída em toda entrega: typecheck, lint, `test:strict`, `test:components`, build e e2e de fumaça, tudo verde. Contagem de testes >= baseline, cobertura sem queda.
8. Parar a linha: qualquer vermelho interrompe o trabalho. Reverter, e a fase seguinte não começa.
9. Deploy fora de janela de partida, com critérios de rollback monitorados.

---

## Fase 0 — Baseline Verde (sem mudança em código de produção)

**Comandos:**
```powershell
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm test:setup
pnpm typecheck
pnpm lint
pnpm test:strict
pnpm test:components
pnpm build
pnpm test:e2e
pnpm test:coverage
```

**Tarefas:**
- [ ] Executar `pnpm install --frozen-lockfile` (~12s)
- [ ] Executar `pnpm prisma generate` (<1s)
- [ ] Executar `pnpm test:setup` (~2s)
- [ ] Executar `pnpm typecheck` (0 erros)
- [ ] Executar `pnpm lint` (0 erros, 0 warnings)
- [ ] Executar `pnpm test:strict` (0 falhas, 0 skipped, 0 todo)
- [ ] Executar `pnpm test:components`
- [ ] Executar `pnpm build` (Next.js build ok)
- [ ] Executar `pnpm test:e2e`
- [ ] Executar `pnpm test:coverage`
- [ ] Rodar suíte duas vezes para detectar flakiness; corrigir testes instáveis antes de seguir
- [ ] Salvar `docs/BASELINE-2026-10-xx.md` com número de suítes, testes, cobertura, duração e hash do commit
- [ ] Criar tag git `baseline-pre-hardening`
- [ ] Gravar golden snapshots:
  - [ ] Resposta de `/report` com partida fixture (incluindo uma com áudio)
  - [ ] Resposta de `/matches`
  - [ ] Resposta e cookies do login
  - [ ] Fluxo do `/point`
- [ ] Checklist manual de fumaça em `/scoring`: ace, dupla falta, cancelar 2º saque, undo, editar placar, offline e reconexão, timeline e relatório
- [ ] Backup: branch do Neon e zip sem arquivos `.env`

---

## Fase 1 — Sessão (maior risco operacional)

**Problema:** token expira em 2h, `refreshToken` é string fixa `'hardcoded-refresh'` (não usado), `/scoring` não trata 401. Em partida longa (BEST_OF_5 pode passar de 2h), pontos recebem 401 e vão para fila offline como `FAILED`.

**Tarefas:**
- [ ] 1.1 Caracterização: testes do contrato atual de login e do middleware
- [ ] 1.2 Tratamento central de 401 em `/scoring`:
  - O ponto nunca é descartado; fica na fila, sincronização pausa, aviso para logar de novo
  - Após login, fila é descarregada
  - Teste cobrindo ponto, fila e 401
- [ ] 1.3 Renovação deslizante em `/api/auth/refresh`: token válido é renovado antes de expirar
- [ ] 1.3 Confirmar que nenhum consumidor usa o campo falso `refreshToken` antes de removê-lo
- [ ] Rollback: reverter o zip (contrato antigo continua válido)

---

## Fase 2 — Cookie e Token (expand → contract)

**Problema:** login grava o mesmo JWT em dois cookies. `rkt_access_token` é httpOnly, `access_token` não é, e token fica em `sessionStorage` (~10 leituras). Qualquer XSS rouba o token e anula a proteção do httpOnly.

**Tarefas:**
- [ ] Expandir: cliente passa a usar cookie httpOnly; middleware continua aceitando Bearer e os dois cookies
- [ ] Observar por um ciclo de uso real, sem falhas de sincronização
- [ ] Contrair: parar de gravar cookie `access_token`
- [ ] Contrair: remover leituras de `sessionStorage`
- [ ] Fluxo offline e descarga da fila têm e2e obrigatório

---

## Fase 3 — Segredo e Papéis

**Tarefas:**
- [ ] 3.1 Rotacionar `JWT_SECRET` de produção (atualmente 29 caracteres, abaixo dos 32 recomendados para HS256) para 32 ou mais
- [ ] 3.1 Fazer rotação fora de janela de partida e avisar os anotadores
- [ ] 3.1 Garantir que backups não carreguem `.env`
- [ ] 3.2 Rotacionar `JWT_SECRET` apenas após Fase 1 já em produção
- [ ] 3.2 Caracterizar comportamento dos papéis fantasma (`GESTOR`, `COACH`) em 5 arquivos:
  - `aguardandoanotador/page.tsx`
  - `players/[id]/route.ts`
  - `matches/[id]/report/route.ts`
  - `matches/[id]/point/route.helpers.ts`
  - `matches/[id]/state/route.ts`
- [ ] 3.2 Remover ramos mortos dos papéis fantasma
- [ ] 3.2 Preservar arquivo antigo no git com tag

---

## Fase 4 — Desempenho sem Mudar Contrato

**Tarefas:**
- [ ] 4.1 Índices (migração aditiva):
  - [ ] Índice composto começando por `createdByUserId` em `Match` (filtro principal da listagem)
  - [ ] Índice composto `(matchId, isActive)` em `MatchAnnotationSession`
  - [ ] Criar índices com `CONCURRENTLY`
  - [ ] Validar com `EXPLAIN`
  - [ ] Rollback: dropar o índice
- [ ] 4.2 Áudio:
  - [ ] Avaliar `report/route.ts` e `point-logs-meta/route.ts` selecionam `audioNote` (bytes inteiros) só para calcular `hasAudioNote`
  - [ ] Criar coluna `hasAudio` com backfill, OU consultar `IS NOT NULL`
  - [ ] Critério de aceite: JSON de `/report` idêntico ao golden
- [ ] 4.3 `listMatches`:
  - [ ] Medir tamanho do payload do `scoreState` completo (com `history`) enviado ao dashboard
  - [ ] Adicionar campo resumido de forma aditiva, mantendo `scoreState` até o dashboard migrar
  - [ ] Só então remover `scoreState` completo

---

## Fase 5 — Hardening de Borda

**Tarefas:**
- [ ] Rate limit no login (TD-002):
  - [ ] Armazenamento compartilhado (memória não funciona em serverless)
  - [ ] Opções: Upstash ou tabela no Postgres
  - [ ] Política: atraso progressivo, sem bloqueio permanente de anotador em quadra
  - [ ] Entrar atrás de flag
- [ ] CSP:
  - [ ] Publicar primeiro em modo *Report-Only*
  - [ ] Só então aplicar
  - [ ] Remover `X-XSS-Protection` (obsoleto)
- [ ] Verificação de origem nas mutações:
  - [ ] Avaliar (já que `SameSite=lax` cobre apenas parte do risco)

---

## Fase 6 — Qualidade sem Mudança de Comportamento

**Tarefas:**
- [ ] Migrar os 31 `console.*` restantes para o `logger`
- [ ] Reduzir os 215 `any` pelos focos:
  - [ ] `DashboardViewRouter` (20)
  - [ ] `useDashboardMatches` (14)
  - [ ] `score-normalizer` (11)
  - [ ] `MatchCard` (10)
  - [ ] Casts no caminho do ponto (`match as any`, `scoreState as any`, `format as any`)
- [ ] Criar tipo único e validação Zod para o envelope `{state, history}`, começando só em modo log
- [ ] Arquivar `useMatchEvents.ts` (sem uso em produção)
- [ ] Atualizar `TASKS.md`, `PRD.md` e `AGENTS.md`
  - [ ] `TASKS.md` está datado de 2025-01-01 e cita Supabase/RLS, tabela `Season` e "rebotes/assistências", que não correspondem ao projeto atual
- [ ] Revisar `.gitignore` para `coverage/`, `playwright-report/`, `tsconfig.tsbuildinfo` e `graft/`
- [ ] Pausar o polling de 5s do painel de sessão quando a aba estiver oculta

---

## Fora deste Ciclo (não fazer agora)

- [ ] NÃO tirar `history` de `Match.scoreState` e usar `PointLog` como fonte única (melhoria de maior impacto e maior risco; entra com decisão separada e modo sombra comparando dois resultados sem alterar comportamento)

---

## Critérios de Rollback Pós-Deploy

Reverter se, nas primeiras horas, houver:
- [ ] Aumento de respostas 401
- [ ] Qualquer `SEQUENCE_CONFLICT` novo
- [ ] Falhas de sincronização de pontos
- [ ] Piora do p95 do `/report`
- [ ] Divergência em relação ao golden

---

## Decisões Pendentes (antes da Fase 1)

- [ ] 1. Sessão: renovação deslizante (recomendada) ou apenas TTL mais longo
- [ ] 2. Rate limit: Upstash ou tabela no Postgres
- [ ] 3. Áudio: coluna `hasAudio` agora, ou migrar para storage de objetos depois

---

## Definição de Pronto (DoD) — Fase 0

- [ ] `pnpm typecheck` com 0 erros
- [ ] `pnpm lint` com 0 erros e 0 warnings
- [ ] `pnpm test:strict` com 0 falhas, 0 skipped, 0 todo
- [ ] `pnpm test:components` verde
- [ ] `pnpm build` ok
- [ ] `pnpm test:e2e` verde
- [ ] `pnpm test:coverage` com cobertura >= baseline, sem queda
- [ ] Contagem de testes maior ou igual à baseline
- [ ] `docs/BASELINE-2026-10-xx.md` salvo com hash do commit
- [ ] Tag git `baseline-pre-hardening` criada
- [ ] Golden snapshots gravados
- [ ] Backup do Neon e zip sem `.env` criado
