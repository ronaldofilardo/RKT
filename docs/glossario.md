# Glossário do Projeto RKT

> Documento canônico (ver `AGENTS.md`). Define os termos de domínio usados no código,
> nas telas e na documentação, para garantir consistência de comunicação.
>
> Fonte de verdade: `prisma/schema.prisma` (entidades), `src/schemas/*.ts` (contratos Zod)
> e `src/core/scoring/types.ts` (domínio de pontuação).
>
> **Codificação: UTF-8.** Se você editar este arquivo, mantenha UTF-8 sem BOM.

---

## 1. Produto e papéis

| Termo | Definição |
|---|---|
| **RKT** | Aplicação web (Next.js App Router) de anotação tática ao vivo de partidas de tênis. |
| **ANNOTATOR** | Papel padrão do usuário (`enum Role`). Anota partidas, registra pontos, comentários e áudio, corrige placares e vê relatórios. |
| **ADMIN** | Papel de gestão (`enum Role`). Além de tudo do ANNOTATOR, faz CRUD de usuários em `/admin`. |
| **Scoring Engine** | Motor puro de pontuação (`src/core/scoring/engine.ts`), agnóstico de UI e backend. Processa cada ponto e calcula o estado de game/set/match segundo os formatos oficiais. |

---

## 2. Entidades de dados (Prisma)

| Termo | Tabela | Definição |
|---|---|---|
| **User** | `users` | Conta de acesso com papel (`role`). |
| **LoginAttempt** | `login_attempts` | Registro auditável de tentativa de login (IP, CPF, data). |
| **Player** | `Player` | Atleta, com dados pessoais, rankings e histórico de partidas. |
| **Match** | `Match` | Partida entre dois atletas, composta de sets, games e pontos. |
| **PointLog** | `PointLog` | Registro auditável de um ponto disputado (quem anotou, quando, anotação de áudio/texto). |
| **MatchScoreEdit** | `match_score_edits` | Correção manual do placar; guarda o estado anterior (`newScoreState`) para reconstrução da timeline. |
| **MatchComment** | `match_comments` | Comentário do anotador sobre um trecho da partida, com anexo de áudio opcional. |
| **MatchAnnotationSession** | `match_annotation_sessions` | Segmento de anotação: quem anotou qual trecho e por quanto tempo. |
| **AnnotationEndorsement** | `annotation_endorsements` | Endosso de um anotador sobre o trabalho de outro em uma sessão. |

### Estados e formatos de partida

| Enum | Valores |
|---|---|
| **MatchState** | `SCHEDULED`, `IN_PROGRESS`, `FINISHED`, `CANCELLED` |
| **MatchFinishReason** | `COMPLETED`, `ABANDONED`, `WALKOVER`, `INJURY`, `OUTRO` |
| **MatchFormat** | `BEST_OF_3`, `BEST_OF_5`, `BEST_OF_3_MATCH_TB`, `BEST_OF_3_NO_AD`, `SHORT_SET_2V2_NO_AD`, `MATCH_TB_10`, `PRO_SET_8` |
| **AnnotationSessionStatus** | `IN_PROGRESS`, `COMPLETED`, `ABANDONED` |

---

## 3. Domínio de pontuação (`src/core/scoring`)

| Termo | Definição |
|---|---|
| **ScoringState** | Estado completo da pontuação: `sets`, `currentGame`, `server`, `isFinished`, `winner`, `setsWon`, `secondServe`. |
| **SetScore** | Placar de um set: `player1`, `player2`, `isTiebreak`, `tiebreakScore`. |
| **GameScore** | Placar do game em curso: `player1`, `player2`, `isDeuce`, `advantage`, `secondServe`. |
| **HistoryEntry** | Par `(stateBefore, point)` que permite rebobinar a partida ponto a ponto. |
| **PointDetails** | Detalhes de um ponto: `winnerId`, `type`, saques (`isFirstServe`/`isSecondServe`/`isLet`), `serverId`, `rallyDetails`, `firstFaultDetail`. |
| **TimelinePoint** | Projeção de um ponto para exibição na timeline, com predicados de situação (`isBreakPoint`, `isGameBall`, `isSetBall`) e placares. |
| **PointFlow** | Payload de entrada de um ponto a ser processado pelo motor. |
| **MatchScoreStateEnvelope** | Envelope `{ state, history }` que envolve o `ScoringState` persistido. |
| **PointType** | `ACE`, `WINNER`, `FORCED_ERROR`, `UNFORCED_ERROR`, `DOUBLE_FAULT`, `FAULT_FIRST`, `FAULT_SECOND`. |

### Situações de ponto

| Termo | Definição |
|---|---|
| **Deuce** | Empate no game (`GameScore.isDeuce`). |
| **Advantage (Adv.)** | Vantagem de um jogador após o deuce (`GameScore.advantage`). |
| **Break Point** | Ponto em que o returnador pode quebrar o saque do adversário (`TimelinePoint.isBreakPoint`). |
| **Game Ball** | Ponto que pode encerrar o game (`TimelinePoint.isGameBall`). |
| **Set Ball** | Ponto que pode encerrar o set (`TimelinePoint.isSetBall`). |
| **Tiebreak** | Game especial de desempate dentro do set (`SetScore.isTiebreak`). |
| **Match Tiebreak** | Set de desempate jogado como tiebreak de 10 pontos (`MATCH_TB_10`, `BEST_OF_3_MATCH_TB`). |

---

## 4. Anotação de rally (`src/schemas/rally.ts`)

Anotação tática detalhada de como o ponto terminou.

| Campo | Valores |
|---|---|
| **vencedor** | `sacador`, `devolvedor` |
| **situacao** | `devolucao`, `fundo`, `passada`, `rede`, `saque` |
| **tipo** | `erro_nao_forcado`, `erro_forcado`, `winner`, `dupla_falta` |
| **golpe** | `fh` (forehand), `bh` (backhand), `vfh`, `vbh`, `smash`, `saque` |
| **efeito** | `topspin`, `slice`, `flat` |
| **direcao** | `cruzada`, `paralela`, `centro`, `inside_out`, `inside_in`, `aberto`, `fechado` |
| **golpe_esp** | `lob`, `drop_shot`, `bate_pronto`, `swing_volley` |
| **subtipo1** | `passing_shot`, `devolucao_saque` |
| **subtipo2** | `out`, `net` |
| **duracao** | `opcao_1`, `opcao_2`, `opcao_3` (faixas de rally) |

### Abreviações exibidas na timeline

| Sigla | Significado |
|---|---|
| **ENF** | Erro Não Forçado (`UNFORCED_ERROR`) |
| **EF** | Erro Forçado (`FORCED_ERROR`) |
| **W** | Winner (ponto vencedor direto) |
| **DF** | Dupla Falta (`DOUBLE_FAULT`) |
| **FH / BH** | Forehand / Backhand |
| **VFH / VBH** | Voleio de Forehand / Backhand |
| **Sm** | Smash |
| **DEV** | Devolução |
| **FQ** | Falta no saque |
| **Sq** | Saque |
| **Pass** | Passada |

---

## 5. Sessão de anotação e auditoria

| Termo | Definição |
|---|---|
| **Sessão de anotação** | Trecho de uma partida anotado por um usuário (`MatchAnnotationSession`). Permite saber quem anotou qual segmento. |
| **Interrupção (segment break)** | Marcador renderizado no `/report` entre dois trechos de timeline quando houve correção manual de placar (`TimelinePoint.segmentBreak`). |
| **Endosso** | Confirmação de um anotador sobre a qualidade do trabalho de outro em uma sessão (`AnnotationEndorsement`). |
| **Fila offline** | Ações de ponto enfileiradas localmente (`QueuedAction`, status `PENDING`/`SYNCING`/`FAILED`) para sincronizar quando a conexão voltar. |

---

## 6. Movimentos e módulos do código

| Termo | Definição |
|---|---|
| **Camada 1 (service)** | Extração de regra de negócio de componentes/serviços para módulos puros e testáveis. |
| **Camada 2 (partition UI)** | Divisão de componentes grandes em subcomponentes puros de apresentação. |
| **Characterization test** | Teste que congela o comportamento atual de código legado antes de refatorá-lo (R-15). |
| **Strangler** | Padrão de migração gradual: nova implementação ao lado da antiga, com troca de chamada quando pronta. |
| **ste-exception** | Comentário `// ste-exception R-XX: <motivo>` que documenta uma exceção consciente a uma regra STE-DEV. |
| **edit-score-domain** (`edit-score-domain.ts`) | Regras de domínio da edição de placar: validação de resultado de set, limites de games por formato, tiebreak impossível, próximo sacador após set e o contrato `SetEditData`. Nome canônico (V-08); antes era `edit-score.logic.ts`. |
| **edit-score-state** (`edit-score-state.ts`) | Estado e cálculo do modal de edição: `createInitialEditScoreState`, `calculateMatchState`, `createSetEditData`, `calculateNextServer`; tipos em `edit-score-state.types.ts`. Nome canônico (V-08); antes era `edit-score-logic.ts`. |
| **edit-score-validation** (`edit-score-validation.ts`) | Validação da UI do formulário de edição: `calculateValidation`, `calculateTiebreakValidation`, `isPotentialMTSet`. |

---

## 7. Siglas de interface recorrentes

| Termo | Definição |
|---|---|
| **P1 / P2** | Jogador 1 / Jogador 2 da partida. |
| **no.** | Número sequencial do ponto na timeline. |
| **SAC** | Sacador do ponto. |
| **Venc** | Ganhdor do ponto. |
| **GAMES** | Placar de games do set. |
| **PONTOS** | Placar de pontos do game (15-0, Deuce, Adv. P1). |
| **1º / 2º Saque** | Primeiro e segundo saque; apenas um é preenchido por ponto. |
| **RALLY** | Faixa de bolas trocadas (3-6, 7-10, 11+). |
