# Plano de endurecimento do RKT

**Data:** 2026-10-06
**Base:** auditoria estática do `bkpRKT.zip` (sem alteração de código)
**Status:** proposto, aguardando decisões da seção "Decisões pendentes"

> A auditoria foi por leitura de código e buscas no projeto. Testes, typecheck e build **não** foram executados no sandbox (sem `node_modules` e sem acesso aos binários do Prisma). Toda validação acontece na Fase 0 e nos portões de saída, na máquina do desenvolvedor.

---

## Regras inegociáveis (valem em todas as fases)

1. **Nenhuma alteração de código antes da baseline verde (Fase 0).**
2. **Teste primeiro.** Antes de mexer num comportamento, escrever um teste de caracterização que passa no código atual. Depois da mudança, ele continua passando, e o teste do comportamento novo falha antes e passa depois.
3. **Proibido mascarar.** Não é permitido apagar teste, enfraquecer asserção, usar `.skip` nem reduzir a contagem de testes. Se um teste estiver errado, ele é corrigido em entrega separada, com a evidência.
4. **Contratos congelados.** Formatos de resposta das APIs (`/report`, `/point`, `/matches`, login) ganham snapshot "golden". Mudanças só podem ser aditivas. Remoções vêm numa fase posterior, depois de os consumidores migrarem.
5. **Banco só com expand/contract.** Migrações aditivas, nunca destrutivas na mesma entrega. Backup ou branch do Neon antes de cada migração.
6. **Entregas pequenas.** Um assunto por zip, só com os arquivos alterados mais os testes, e com nota de rollback.
7. **Portão de saída em toda entrega.** Typecheck, lint, `test:strict`, `test:components`, build e e2e de fumaça, tudo verde. Contagem de testes maior ou igual à baseline, e cobertura sem queda.
8. **Parar a linha.** Qualquer vermelho interrompe o trabalho. Reverte-se, e a fase seguinte não começa.
9. **Deploy fora de janela de partida**, com critérios de rollback monitorados.

---

## Fase 0 — Baseline verde (sem mudança em código de produção)

Executar na máquina local:

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

- **Critério de aprovação:** 0 falhas, 0 skipped e 0 todo. Typecheck com 0 erros, lint sem warnings e build ok.
- **Flakiness:** rodar a suíte duas vezes. Teste instável é corrigido antes de seguir, em entrega só de testes.
- **Registro:** salvar `docs/BASELINE-2026-10-xx.md` com o número de suítes e testes (última contagem conhecida: 77 suítes e 1080 testes), a cobertura, a duração e o hash do commit. Criar a tag git `baseline-pre-hardening`.
- **Golden snapshots** a gravar antes de qualquer mudança:
  - resposta de `/report` com partida fixture, incluindo uma com áudio;
  - resposta de `/matches`;
  - resposta e cookies do login;
  - fluxo do `/point`.
- **Checklist manual de fumaça em `/scoring`:** ace, dupla falta, cancelar 2º saque, undo, editar placar, offline e reconexão, timeline e relatório.
- **Backup:** branch do Neon e zip sem arquivos `.env`.

---

## Fase 1 — Sessão (maior risco operacional)

**Problema:** o token expira em 2h, o `refreshToken` devolvido no login é a string fixa `'hardcoded-refresh'` (nada o usa) e `/scoring` não trata 401. Em partida longa (BEST_OF_5 pode passar de 2h), os pontos recebem 401 e acabam em `FAILED` na fila offline.

Esta fase vem **antes** de rotacionar o segredo, porque a rotação derruba todas as sessões.

- **1.1 Caracterização:** testes do contrato atual de login e do middleware.
- **1.2 Tratamento central de 401 em `/scoring`:** o ponto nunca é descartado. Ele fica na fila, a sincronização pausa e aparece um aviso para logar de novo. Após o login, a fila é descarregada. Teste cobrindo ponto, fila e 401.
- **1.3 Renovação deslizante** (`/api/auth/refresh`): um token ainda válido é renovado antes de expirar. O campo falso `refreshToken` só sai depois de confirmar que nenhum consumidor o usa.
- **Rollback:** reverter o zip. O contrato antigo continua válido.

---

## Fase 2 — Cookie e token (expand → contract)

**Problema:** o login grava o mesmo JWT em dois cookies. O `rkt_access_token` é httpOnly, mas o `access_token` não é, e o token também fica no `sessionStorage` (~10 leituras). Qualquer XSS rouba o token e a proteção do httpOnly é anulada.

- **Expandir:** o cliente passa a usar o cookie httpOnly. O middleware continua aceitando Bearer e os dois cookies.
- **Observar** por um ciclo de uso real, sem falhas de sincronização.
- **Contrair:** parar de gravar o cookie `access_token` e remover as leituras de `sessionStorage`. O fluxo offline e a descarga da fila têm e2e obrigatório.

---

## Fase 3 — Segredo e papéis

- **3.1 Rotacionar o `JWT_SECRET` de produção** (hoje com 29 caracteres, abaixo dos 32 recomendados para HS256) para 32 ou mais, com a Fase 1 já em produção. Fazer fora de janela de partida e avisar os anotadores. Garantir que backups não carreguem `.env`.
- **3.2 Papéis fantasma** (`GESTOR`, `COACH`): o enum `Role` só tem `ADMIN` e `ANNOTATOR`, mas esses valores aparecem em 5 arquivos (`aguardandoanotador/page.tsx`, `players/[id]/route.ts`, `matches/[id]/report/route.ts`, `matches/[id]/point/route.helpers.ts`, `matches/[id]/state/route.ts`). Caracterizar o comportamento e remover os ramos mortos. O arquivo antigo fica preservado no git, com tag.

---

## Fase 4 — Desempenho sem mudar contrato

- **4.1 Índices:** migração aditiva.
  - Índice composto começando por `createdByUserId` em `Match` (filtro principal da listagem).
  - Composto `(matchId, isActive)` em `MatchAnnotationSession`.
  - Criar com `CONCURRENTLY`, validar com `EXPLAIN`. Rollback: dropar o índice.
- **4.2 Áudio:** `report/route.ts` e `point-logs-meta/route.ts` selecionam `audioNote` (bytes inteiros) só para calcular `hasAudioNote`. Como `audioNoteDuration != null` não equivale a "tem áudio", a opção segura é uma coluna `hasAudio` com backfill, ou consulta `IS NOT NULL`. Critério de aceite: JSON de `/report` idêntico ao golden.
- **4.3 `listMatches`:** o dashboard recebe o `scoreState` completo (com `history`) de cada partida. Medir primeiro o tamanho do payload. Depois adicionar um campo resumido de forma aditiva, mantendo `scoreState` até o dashboard migrar. Só então remover.

---

## Fase 5 — Hardening de borda

- **Rate limit no login** (TD-002): precisa de armazenamento compartilhado (memória não funciona em serverless). Opções: Upstash ou tabela no Postgres. Política: atraso progressivo, sem bloqueio permanente de anotador em quadra. Entra atrás de flag.
- **CSP:** publicar primeiro em modo *Report-Only* e só então aplicar. Remover o `X-XSS-Protection` (obsoleto).
- **Verificação de origem** nas mutações: avaliar, já que `SameSite=lax` cobre apenas parte do risco.

---

## Fase 6 — Qualidade sem mudança de comportamento

- Migrar os 31 `console.*` restantes para o `logger`.
- Reduzir os 215 `any` pelos focos: `DashboardViewRouter` (20), `useDashboardMatches` (14), `score-normalizer` (11), `MatchCard` (10) e os casts no caminho do ponto (`match as any`, `scoreState as any`, `format as any`).
- Criar um tipo único e validação zod para o envelope `{state, history}`, começando só em modo log.
- Arquivar `useMatchEvents.ts` (sem uso em produção).
- Atualizar `TASKS.md`, `PRD.md` e `AGENTS.md`. O `TASKS.md` está datado de 2025-01-01 e cita Supabase/RLS, tabela `Season` e "rebotes/assistências", que não correspondem ao projeto atual.
- Revisar `.gitignore` para `coverage/`, `playwright-report/`, `tsconfig.tsbuildinfo` e `graft/`.
- Pausar o polling de 5s do painel de sessão quando a aba estiver oculta.

---

## Fora deste ciclo

Tirar o `history` de `Match.scoreState` e usar o `PointLog` como fonte única. O servidor hoje restaura o engine do JSON inteiro e regrava o snapshot completo a cada ponto, então o custo cresce ao longo da partida. É a melhoria de maior impacto e também a de maior risco. Só entra com decisão separada e um modo sombra que compare os dois resultados sem alterar o comportamento.

---

## Critérios de rollback pós-deploy

Reverter se, nas primeiras horas, houver:

- aumento de respostas 401;
- qualquer `SEQUENCE_CONFLICT` novo;
- falhas de sincronização de pontos;
- piora do p95 do `/report`;
- divergência em relação ao golden.

---

## Já em bom estado (não reabrir)

- Código morto: só `useMatchEvents.ts` parece sem uso.
- Testes: 0 `.skip` e apenas 2 marcadores `SUSPECT`.
- Fila offline: itens `FAILED` são reprocessados em `useOfflineSync`, e o ponto vai para a fila após a 2ª falha.
- Rotas: quase todas autenticadas. Exceções: `logout` e `tournament-suggestions`.

---

## Decisões pendentes (antes da Fase 1)

1. **Sessão:** renovação deslizante (recomendada) ou apenas TTL mais longo.
2. **Rate limit:** Upstash ou tabela no Postgres.
3. **Áudio:** coluna `hasAudio` agora, ou migrar para storage de objetos depois.