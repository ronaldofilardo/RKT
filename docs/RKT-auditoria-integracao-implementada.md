# Implementação da auditoria de código obsoleto, morto, duplicado e integração back–frontend

## Escopo executado

A auditoria foi convertida em correções no projeto RKT. A camada de ranking foi centralizada para evitar regras duplicadas entre o formulário e o catálogo compartilhado. ITF Juniors agora fica disponível somente entre 14 e 18 anos, ATP e WTA são filtrados pelo gênero compatível e o backend passou a validar elegibilidade de ranking, categoria e posição inteira positiva antes da persistência.

O cliente de sessões paralelo foi removido. `useAnnotationSession` agora utiliza o serviço canônico, e o helper antigo de scoring permanece somente como adaptador de compatibilidade para não quebrar imports legados.

O relatório/scout passou a transportar e exibir a sequência persistida do ponto, zona e stroke, com cabeçalho, células e `colSpan` alinhados. A API de relatório ordena por `sequenceNumber`, timestamp e id, e retorna `sequenceNumber` e `clientEventId`.

Foi adicionada a coluna persistida `PointLog.sequenceNumber`, com migration de backfill determinístico por partida, índice único parcial e restrição de positividade. A rota de ponto gera a próxima sequência quando o cliente não envia uma, valida conflitos e trata corrida concorrente de `clientEventId` retornando o ponto já persistido.

A autenticação ganhou cookie HttpOnly `rkt_access_token` no login. O middleware aceita esse cookie como fallback ao bearer token, permitindo SSE same-origin sem expor token em query string. O hook SSE ganhou reconexão exponencial limitada, cleanup de timers/conexão e tolerância a ambientes sem `EventSource`.

O timer de abort da sincronização de ponto passou a ser sempre limpo em `finally` e não bloqueia o processo Node quando `unref` está disponível. Isso elimina handles assíncronos residuais na suíte.

## Validações

| Validação | Resultado |
|---|---|
| `pnpm prisma validate` | Aprovado |
| `pnpm prisma generate` | Aprovado |
| `pnpm typecheck` | Aprovado |
| `pnpm lint` | Aprovado, sem warnings ou erros |
| `pnpm test:strict` | 142 suítes e 2.036 testes aprovados |
| `jest --detectOpenHandles` | 142 suítes e 2.036 testes aprovados, sem handles abertos |
| Build Next.js | Aprovado; rotas e páginas geradas com sucesso |

## Arquivos principais alterados

`src/lib/ranking/rankingConstants.ts`, `src/app/atletas/rankingLogic.ts`, `src/app/atletas/RankingForm.tsx` e `src/app/api/players/[id]/route.ts` concentram a consolidação e validação das regras de ranking.

`prisma/schema.prisma`, `prisma/migrations/20260825200000_add_point_sequence/migration.sql`, `src/app/api/matches/[id]/point/route.ts`, `src/app/api/matches/[id]/report/route.ts`, `src/components/scoring/timeline-rebuild.ts`, `src/components/scoring/timeline-rows.tsx`, `src/components/scoring/MatchTimelineView.tsx` e `src/core/scoring/types.ts` implementam o contrato de sequência e scout.

`src/lib/auth.ts`, `src/app/api/auth/login/route.ts`, `src/hooks/useMatchEvents.ts` e `src/hooks/useScoringHandlers.point-sync.ts` implementam as correções de autenticação, reconexão e encerramento assíncrono.

`src/services/annotationSessionService.ts`, `src/services/useAnnotationSession.ts`, `src/hooks/useScoringHandlers.server-helpers.ts` e a remoção de `src/services/annotationSessionApi.ts` tratam a consolidação de camadas duplicadas.

## Observação operacional

A migration deve ser aplicada no ambiente de banco correspondente antes do deploy da versão. O backfill ordena registros legados por timestamp e id; novos pontos passam a receber sequência dentro da transação. O ZIP não contém dependências, builds nem arquivos `.env`.
