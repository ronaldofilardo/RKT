# Plano de execução: correções do "Editar placar" (RKT)

Documento para um agente codificador de IA. Cada fase termina em estado verde (testes, lint e tipos) antes da próxima começar.

## 1. Mapa de PRs (marcação)

| PR | Fase | Tema | Depende de | Paralelo com | Risco | Decisão do usuário? |
|----|------|------|------------|-------------|-------|---------------------|
| PR-0 | 0 | Linha de base e testes de caracterização | — | — | Baixo | Não |
| PR-1 | 1 | Resultado explícito da persistência + retry correto | PR-0 | PR-2, PR-7, PR-8 | Médio | Não |
| PR-2 | 2 | startedAt preservado | PR-0 | PR-1, PR-7, PR-8 | Baixo | Não |
| PR-3 | 3 | Regra de regressão de sets | PR-1 | PR-7, PR-8 | Médio | SIM (portão) |
| PR-4 | 4 | Unificar /state e /finish | PR-1 | PR-7, PR-8 | Alto | Não |
| PR-5 | 5 | Edição offline (bloqueio) | PR-1, PR-4 | PR-7, PR-8 | Médio | Não |
| PR-6 | 6 | Fila offline e sequência após edição | PR-1 | PR-7, PR-8 | Médio | Não |
| PR-7 | 7 | /report posiciona edição por sequência | PR-0 | todos (só backend) | Médio | Não |
| PR-8 | 8 | Duplas: sacador inicial | PR-0 | todos | Baixo | Não |
| PR-9 | 9 | Migration FK + RLS | PR-0 | todos | Alto (deploy) | SIM (portão) |
| PR-10 | 10 | Baixa gravidade | PR-3, PR-4 | — | Baixo | Não |
| PR-11 | 11 | Validação final ponta a ponta | todos | — | Baixo | Não |

Ordem de merge recomendada: PR-0 → (PR-1, PR-2, PR-7, PR-8) → PR-3 → PR-4 → PR-5 → PR-6 → PR-10 → PR-9 → PR-11.

Conflitos prováveis (rebase obrigatório):
- useSessionManager.edit-score.ts: PR-1, PR-5, PR-6.
- edit-score-persist.logic.ts: PR-1, PR-4.
- match-service-operations.logic.ts e serviços de transição: PR-2, PR-4.

Sugestão de agrupamento mínimo (se preferir menos PRs): {PR-1}, {PR-2}, {PR-3+PR-10}, {PR-4+PR-5}, {PR-6}, {PR-7}, {PR-8}, {PR-9}, {PR-11}.

## 2. Regras gerais (valem para todas as fases)

- [ ] Ler AGENTS.md e docs/RULES.md antes de começar. Respeitar o limite de tamanho por arquivo (~100 linhas); se passar, extrair helper *.logic.ts como o projeto já faz.
- [ ] Tocar só no código realmente usado pela página. Código morto conhecido (não corrigir, não apagar): useScoringHandlers.controller.ts, useScoringHandlers.core.ts, useScoringHandlers.processor.ts, useScoringHandlers.point-sync.helpers.ts, route.transaction.ts, MatchTimelineView.content.tsx, match-card-score.helpers.ts.
- [ ] Para cada bug: primeiro um teste de regressão que falha, depois a correção. Registrar no resumo que o teste falhava antes.
- [ ] Uma fase = um conjunto pequeno de arquivos. Não misturar refactor com correção de comportamento.
- [ ] Se @prisma/client não estiver gerado ou não houver rede, não contornar. Rodar só testes isolados com `npx jest <arquivo>` e informar o que não pôde ser rodado.
- [ ] Não renomear contratos públicos (rotas, campos Zod). Mudanças de contrato devem ser retrocompatíveis (campo novo opcional).
- [ ] Entrega por fase: zip só com os arquivos alterados, nas pastas originais, mais o comando `pnpm jest ...` com os testes tocados para rodar no PowerShell. Descrever em 3–5 linhas: causa raiz, o que mudou, o que ficou de fora.
- [ ] Nas fases 3 e 9: parar e pedir a decisão ao usuário antes de codar.

## Fase 0 — Linha de base (PR-0)
Sem alterar código de produção.
- [ ] Rodar a suíte relacionada: src/components/scoring/__tests__, src/hooks/__tests__, src/services/__tests__, src/app/api/matches/**/__tests__. Anotar o que já falha antes de qualquer mudança.
- [ ] Escrever testes de caracterização marcados it.failing (ou equivalente) que reproduzem o estado atual:
  - A. Falha de persistência → modal não deve avançar.
  - B. 422 não deve ser retentado.
  - C. Inverter vencedor de set concluído gera erro claro.
  - D. IN_PROGRESS → IN_PROGRESS não altera startedAt.
  - E. Replay offline de finish-por-edição.
- Aceite: relatório curto com a lista de testes verdes e vermelhos de partida.

## Fase 1 — Resultado explícito da persistência e retry correto (PR-1)
Arquivos: useSessionManager.edit-score.ts, edit-score-persist.logic.ts, useSessionManager.ts (openEditScoreModal), useScoringEditScore.ts, use-edit-score-modal-submission.logic.ts, use-edit-score-modal-submission-apply.logic.ts, useEditScoreModal.types.ts, EditScoreModal.tsx, useScoringHandlers.persistence.ts, persistence.types.ts.
- [ ] Definir type `EditScoreResult = { ok: true } | { ok: false; reason: string }`.
- [ ] `executeScoreEdit` devolve `EditScoreResult` em todos os caminhos, inclusive isProcessingRef ocupado (reason: 'busy') e falha da validação de Match Tiebreak.
- [ ] Propagar o tipo por openEditScoreModal, useScoringEditScore e onConfirm (hoje void | Promise<void>).
- [ ] `executeConfirmFlow` e `applyFullSetSubmission`: só executar setState (adicionar em newSets, limpar inputs) e onMatchFinished quando ok === true. Em falha, manter o modal como estava e exibir reason em confirmError.
- [ ] `persistStateWithRetry`: retentar apenas erro de rede, 5xx e 408/429. Para 400/403/404/422 parar na hora e devolver `{ success:false, status, code }`. 409 mantém o fluxo de resync.
- [ ] Criar `edit-score-error-messages.ts` mapeando SCORE_REGRESSION, INVALID_TRANSITION, VALIDATION_ERROR, CANNOT_FINISH, FORBIDDEN, VERSION_CONFLICT para mensagens em português.
- [ ] Uma única superfície de erro na edição (toast ou confirmError); remover o setError global duplicado só para o label edit-score.
- [ ] Testes: falha de persistência mantém newSets e inputs; 422 chama fetch 1 vez; 500 chama 3 vezes; isProcessing ocupado → ok:false.
- Aceite: testes A e B passam; overlay "Salvando placar…" some em menos de 1s num 422.

## Fase 2 — startedAt preservado (PR-2)
Arquivos: match-service-operations.logic.ts (buildTransitionUpdateData), useSessionManager.state-builder.ts.
- [ ] `buildTransitionUpdateData`: definir startedAt, finishedAt = null e winnerId = null apenas em SCHEDULED → IN_PROGRESS ou quando existingMatch.startedAt for nulo. Em IN_PROGRESS → IN_PROGRESS não tocar. No undo vindo de FINISHED, manter startedAt e limpar só finishedAt/winnerId. Passar o estado atual da partida ao helper.
- [ ] `buildNewScoringState`: preservar o startedAt do estado atual do engine; usar Date.now() só se for nulo.
- [ ] Testes: edição em andamento mantém startedAt; primeira transição define; undo de FINISHED limpa só finishedAt/winnerId; cronômetro do /scoring não zera após editar.
- Aceite: teste D passa; testes de transição existentes continuam verdes.

## Fase 3 — Regra de regressão de sets (PR-3) — PORTÃO DE DECISÃO
Perguntar ao usuário e aguardar:
- Opção A: bloquear na UI. Servidor como está; a edição que reduza setsWon de qualquer jogador é impedida com mensagem clara.
- Opção B: permitir no servidor quando isManualScoreEdit === true, relaxando só isSetsWonRegressing, mantendo auditoria em match_score_edits.

Passos comuns:
- [ ] `mergeSuspendedSessionRules` (edit-score-suspended.logic.ts): remover o Math.max como regra de sobrescrita. O placar digitado é a fonte canônica. isFinished deve vir do array sets (calculateSetsWon), não só do setsWon do banco da sessão suspensa.
- [ ] `validateCompletedSetEdit` (edit-score-modal-set-build.logic.ts): hoje ignora originalSet e floorCurrentSets. Usá-los ou removê-los.

Se A:
- [ ] Comparar vencedor do set original e do editado; recusar inversão com "Não é possível inverter o vencedor de um set concluído".

Se B:
- [ ] Em match-validator-progression.logic.ts, passar isManualScoreEdit até validateScoreProgression, pular só a checagem de setsWon; manter a de tie-break.
- [ ] Atualizar apenas os testes que documentam "setsWon nunca regride" para o caso isManualScoreEdit; manter o caso comum.

Aceite: teste C passa conforme a opção; nenhuma edição legítima falha com mensagem genérica.

## Fase 4 — Unificar /state e /finish (PR-4)
Arquivos: match-service-finish.service.ts, match-service-transition.service.ts, match-service-score-state.logic.ts, finish/route.ts, state-route-guards.logic.ts, edit-score-persist.logic.ts, useSessionManager.match-finish.ts.
- [ ] Criar `buildManualEditScoreState(newScoreState)` em match-service-score-state.logic.ts, devolvendo sempre o envelope `{ state, history: [] }`. Usar nos dois serviços, na gravação de match.scoreState e em recordScoreEditSegment.
- [ ] Garantir que os leitores aceitam os dois formatos (unwrapScoreState, unwrapStateEnvelope, extractHistory). Não migrar dados antigos. Teste de leitura dos dois formatos.
- [ ] /finish: chamar checkCanModifyMatchState (mover para módulo compartilhado) antes de finishMatch; responder 403 como o /state.
- [ ] Cliente: finishMatch devolve `{ success, status, code }`; 409 faz fetchMatch(true) e mensagem, como no /state.
- [ ] Corrigir "A partida foi encerrada localmente…": só aparece se o estado local foi de fato carregado.
- [ ] Limpeza: remover tokenRef morto de finishMatch e o log de result.match.
- [ ] Testes: mesmo formato gravado nos dois caminhos; 403 sem permissão; 409 no finish gera resync.
- Aceite: nenhum ramo grava {...estadoPlano, history: []}; autorização igual nos dois endpoints.

## Fase 5 — Edição offline: bloquear (PR-5)
Arquivos: useSessionManager.edit-score.ts, useSessionManager.match-finish.ts, offline-match-sync-cycle.logic.ts.
- [ ] Em executeScoreEdit (ou no botão ✏️): se navigator.onLine === false, devolver `{ ok:false, reason:'Sem conexão: editar o placar exige internet.' }` sem tocar no estado local.
- [ ] Remover o ramo que grava MATCH_FINISH para edições manuais; manter para o finish comum ao vivo.
- [ ] Detecção de offline robusta: usar `!navigator.onLine` ou `err instanceof TypeError` (cobre Safari "Load failed"), não `message === 'Failed to fetch'`.
- [ ] Ciclo de sync: tratar 422 CANNOT_FINISH como falha definitiva (descartar/marcar e registrar log), sem tentar para sempre.
- [ ] Testes: offline → modal aberto e nada local muda; TypeError do Safari tratado como rede.

## Fase 6 — Fila offline e sequência após edição (PR-6)
Arquivos: use-offline-sync.queue.ts, useSessionManager.edit-score.ts, point-sync-responders.logic.ts.
- [ ] Antes de confirmar a edição, se houver pontos PENDING, tentar flush. Se não der, avisar com a contagem e pedir confirmação antes de descartar.
- [ ] Chamar clearQueueForMatch só após persistência bem-sucedida e confirmação.
- [ ] Depois da edição: fetchMatch(true) para realinhar pointSequenceRef e versão.
- [ ] Testes: nenhum ponto descartado sem confirmação; próximo ponto não gera SEQUENCE_CONFLICT.

## Fase 7 — /report por sequência (PR-7)
Arquivos: report/route-timeline.logic.ts (addScoreEditBreaks), timeline-rebuild-simulate.logic.ts, shadow-replay.ts, report-timeline-build.logic.ts.
- [ ] Ler pointLogSequenceAtEdit de newScoreState (envelope ou plano); posicionar a quebra no primeiro PointLog com sequenceNumber maior. Sem o campo (edições antigas), usar o critério atual por editedAt.
- [ ] Aplicar a mesma regra em simulateScoreFromPointLogs, para quebra e loadState caírem no mesmo ponto.
- [ ] Edição após o último ponto: exibir o marcador no fim da timeline.
- [ ] Testes: relógio do aparelho adiantado/atrasado não muda a posição; edição antiga cai no fallback; edição no fim aparece.

## Fase 8 — Duplas: sacador inicial (PR-8)
- [ ] Criar `resolveInitialServerSide(match)` em módulo único (src/lib/), considerando player1Id/player2Id e player1PartnerId/player2PartnerId.
- [ ] Usar em scoring-edit-score-modal.tsx, scoring-page-display.logic.ts e use-scoring-handlers-server.service.ts. Não mexer em core/scoring sem testes de duplas verdes.
- [ ] Investigar, sem assumir: buildNewScoringState reaproveita doubles com server alterado. Escrever o teste de caracterização primeiro; corrigir só se provar a inconsistência.

## Fase 9 — Banco e RLS (PR-9) — PORTÃO DE DECISÃO
- [ ] FK: nova migration (nunca editar a antiga) adicionando match_score_edits_editedByUserId_fkey com ON DELETE SET NULL. Antes, UPDATE ... SET NULL nos editedByUserId órfãos. Não rodar a migration automaticamente.
- [ ] RLS: perguntar ao usuário qual papel o app usa para conectar ao Postgres (Neon) e se o RLS é aplicado (FORCE ROW LEVEL SECURITY ou papel não-owner). Se aplicado, propor policy para match_score_edits (e PointLog) alinhada a checkCanModifyMatchState (ADMIN, participante, openForAnnotation, sessão ativa). Se não, só documentar. Não alterar policy sem resposta.
- [ ] Entregar SQL e nota de rollback para revisão.

## Fase 10 — Baixa gravidade (PR-10)
- [ ] version obrigatória em MatchStateInputSchema quando isManualScoreEdit === true (.superRefine); opcional nos demais casos.
- [ ] Traduzir 'Games cannot be negative' e demais mensagens em inglês do fluxo de edição (checar antes testes que dependam do texto).
- [ ] Verificar isRegularTiebreak = tiebreakScore !== undefined com teste usando null; corrigir (!= null) só se o teste falhar.
- [ ] Limpar parâmetros mortos (floorCurrentSets, originalSet) se a Fase 3 não os usou.

## Fase 11 — Validação final (PR-11)
- [ ] Teste de integração ponta a ponta (modal → PATCH /state ou POST /finish → banco → /report) cobrindo: edição simples; edição que encerra a partida; inversão de set conforme a Fase 3; duplas; falha de persistência sem avanço do modal; startedAt preservado; quebra no /report por sequência.
- [ ] Rodar suíte completa, tsc --noEmit e lint. Separar o pré-existente (ex.: @prisma/client não gerado) do introduzido.
- [ ] Relatório final: tabela achado → fase → arquivos → teste → status, com o que ficou de fora e por quê.

## Anexo — Achados cobertos

| # | Achado | Fase |
|---|--------|------|
| 1 | Finish por edição offline nunca sincroniza | 5 |
| 2 | Modal avança mesmo com falha de gravação | 1 |
| 3 | UI permite o que a API recusa (SCORE_REGRESSION, Math.max) | 3 |
| 4 | Retry de erros determinísticos | 1 |
| 5 | Divergência /state × /finish (formato, erros, autorização) | 4 |
| 6 | startedAt reiniciado a cada edição/undo | 2 |
| 7 | Fila offline apagada, pointSequenceRef desalinhado | 6 |
| 8 | /report posiciona edição por horário | 7 |
| 9 | RLS × autorização da API | 9 |
| 10 | Duplas: initialServerId inconsistente | 8 |
| Baixa | FK ausente, flags do cliente, version opcional, Safari, strings, resíduos | 9, 10 |

## Melhorias propostas (incorporadas)

- Critério de baseline explícito: PR-0 deve registrar hash/commit e comando exato da suíte verde; cada PR roda `pnpm jest <arquivos>` + `tsc --noEmit` + lint antes do merge.
- PR-3 e PR-9: tornar os portões de decisão bloqueantes com artifact de aprovação (opção A/B registrada) antes de codar; sem isso, cancelar PR.
- Agrupar PR-1+PR-4 parcialmente: `EditScoreResult` e `buildManualEditScoreState` devem ser definidos juntos para evitar dois refactors do mesmo fluxo.
- PR-7: adicionar fallback e teste para `pointLogSequenceAtEdit` ausente em edições antigas; validar que `simulateScoreFromPointLogs` e `loadState` usam o mesmo ponto.
- PR-8: exigir teste de caracterização de duplas verde antes de tocar em `core/scoring`; isolar `resolveInitialServerSide` em `src/lib/` com testes unitários próprios.
- PR-11: incluir medição de performance (overlay "Salvando placar…" <1s em 422) e checagem de regressão de startedAt/cronômetro.
- Entrega: exigir zip com apenas arquivos alterados + comando PowerShell; padronizar relatório 3–5 linhas (causa raiz, mudança, fora de escopo).
