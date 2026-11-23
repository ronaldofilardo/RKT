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
| **Acompanhante da Partida** | Usuário autenticado com concessão temporária (`MatchSpectator`) ou vínculo direto (`canReadMatch`) para assistir ao feed em modo somente-leitura. Distingue-se do perfil cadastral `ESPECTADOR`. |
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
| **MatchShareLink** | `match_share_links` | Convite revogável de acompanhamento com token aleatório de 32 bytes armazenado exclusivamente em formato hash SHA-256. |
| **MatchSpectator** | `match_spectators` | Concessão temporária por partida permitindo leitura em tempo real do placar e timeline. |
| **GuardianLink** | `guardian_links` | Vínculo de tutela legal entre um responsável (`guardianUserId`) e um atleta menor (`playerId`), sob princípio de monotutela estrita. |
| **GuardianInvite** | `guardian_invites` | Convite revogável de tutela (72h) com dados pré-cadastrados para validação cruzada (`preGuardianCpfHash`, telefone) e invalidação atômica (`usedAt`). |
| **ConsentRecord** | `consent_records` | Registro imutável de consentimento legal (LGPD Art. 14 / ECA Digital) vinculado a uma finalidade (`purpose`), versão de termos e `ipHash`, protegido por `onDelete: Restrict`. |
| **ConsentEvent** | `consent_events` | Rastro cronológico de auditoria de eventos de consentimento (`GRANT`/`REVOKE`) com trilha de prova jurídica (`ipHash`, `contentHash`, `userAgent`). |
| **AuditLog** | `audit_logs` | Registro imutável de ações operacionais e de segurança, sanitizado sem dados pessoais (PII) sensíveis em texto puro (`meta`). |
| **TrainingCenter** | `training_centers` | Centro de Treinamento, titular/dono dos dados operacionais e tenant esportivo. |
| **PlayerCT** | `player_cts` | Vínculo associativo entre um atleta (`Player`) e um Centro de Treinamento (`TrainingCenter`). |
| **Membership** | `memberships` | Vínculo de papel e permissões de um usuário em um escopo (CT ou Plataforma). |

### Estados e formatos de partida

| Enum | Valores |
|---|---|
| **MatchState** | `SCHEDULED`, `IN_PROGRESS`, `FINISHED`, `CANCELLED` |
| **MatchFinishReason** | `COMPLETED`, `ABANDONED`, `WALKOVER`, `INJURY`, `OUTRO` |
| **MatchFormat** | `BEST_OF_3`, `BEST_OF_5`, `BEST_OF_3_MATCH_TB`, `BEST_OF_3_NO_AD`, `SHORT_SET_2V2_NO_AD`, `MATCH_TB_10`, `PRO_SET_8` |
| **AnnotationSessionStatus** | `IN_PROGRESS`, `COMPLETED`, `ABANDONED` |

### Estados de tutela, consentimento e conformidade

| Enum | Valores |
|---|---|
| **GuardianLinkStatus** | `INVITED`, `ACTIVE`, `REVOKED`, `EMANCIPATED`, `DORMANT` |
| **GuardianGateStatus** | `AGUARDANDO_RESPONSAVEL`, `LIBERADO`, `RESTRITO`, `LIBERADO_MAIOR` |
| **GuardianInviteStatus** | `PENDING`, `USED`, `EXPIRED`, `REVOKED`, `SUPERSEDED` |
| **ConsentPurpose** | `DATA` (operação esportiva), `BROADCAST` (transmissão/visibilidade do nome civil real), `POOL_VISIBILITY` (visibilidade do nickname no pool), `STATS` (estatísticas agregadas) |
| **ConsentAction** | `GRANT`, `REVOKE` |
| **InviteCreatorKind** | `GESTOR`, `MENOR` |

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
| **edit-score-domain** (`core/scoring/edit-score-domain.ts`) | Regras de domínio da edição de placar: validação de resultado de set, limites de games por formato, tiebreak impossível, próximo sacador após set e o contrato `SetEditData`. Migrado para `core/` no epic S3 #2. |
| **edit-score-state** (`core/scoring/edit-score-state.ts`) | Estado e cálculo do modal de edição: `createInitialEditScoreState`, `calculateMatchState`, `createSetEditData`, `calculateNextServer`; tipos em `edit-score-state.types.ts`. Migrado para `core/` no epic S3 #2. |
| **edit-score-validation** (`core/scoring/edit-score-validation.ts`) | Validação da edição de placar: `calculateValidation`, `calculateTiebreakValidation`, `isPotentialMTSet`. Migrado para `core/` no epic S3 #2. |
| **edit-score-calculator** (`core/scoring/edit-score-calculator.*.ts`) | Domínio puro do calculator de edição (S3 #2): `confirm` (pode confirmar set/partida), `input-gates` (limites de input/zero/vazio) e `set-gates` (próximo set, game points em 0-0). O hook `use-edit-score-calculator.ts` é só casca React de wiring. |
| **match-tiebreak-logic** (`core/scoring/match-tiebreak-logic.ts`) | `isMatchTiebreakSet` (regra pura de MT por índice/formato), extraída de `use-session-manager.logic.ts` no epic S3 #2 para que `core` não dependa de `hooks`. |

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

---

## 8. Acesso, vínculos e pool de atletas (PLANO_FUNDACAO_PERFIS_v2)

| Termo | Definição |
|---|---|
| **Conta** | Login único. Uma pessoa, uma conta, vários vínculos. |
| **Vínculo (`Membership`)** | Tipo + escopo: `PLATAFORMA` (predefinição `ADMIN` ou `SUPORTE`), `GESTOR` (de um CT), `TREINADOR` (de um CT ou avulso). ATLETA é `Player.userId`, não uma linha de `Membership`. |
| **Base operacional (`User.canOperate`)** | Capacidade de cadastrar/buscar atletas, criar e anotar partidas. É o "anotador" de hoje. |
| **Perfil** | Nome exibido (`ADMIN`, `SUPORTE`, `GESTOR`, `TREINADOR`, `ATLETA`, `OPERACIONAL`), calculado pelos vínculos ativos (`src/core/access/profiles.ts`). Não é armazenado. |
| **Papel avulso** | Atleta, treinador ou espectador que se cadastra sem vínculo com CT/clube. O espectador avulso também opera (cria e anota partidas). |
| **CT (`TrainingCenter`)** | Centro de Treinamento, dono dos dados (tenant). |
| **Clube (`Club`)** | Apenas referência (adversário de fora, local da partida). |
| **Pool de atletas** | Cadastro global de `Player`, com `athleteCode` (código curto público que não dá acesso a dados). |
| **Responsável (`GuardianLink`)** | Usuário vinculado a um atleta menor sob monotutela estrita (`status: ACTIVE`). O vínculo passa a `EMANCIPATED` aos 18 anos exatos (ver Seção 9). |
| **`sessionVersion` / claim `sv`** | Contador por conta; incrementar encerra todas as sessões. O guarda confere o `sv` do token com cache de 60 s. |
| **Claim legado derivado** | `ADMIN`, `ANNOTATOR` ou `NONE` calculado dos vínculos para as rotas antigas (`deriveLegacyRole`). |

---

## 9. Proteção de Menores, Governança e LGPD / ECA Digital

Regras canônicas e conceitos jurídicos-técnicos implementados para conformidade estrita com a LGPD (Lei 13.709/2018, Art. 14) e o ECA Digital (Lei 15.211/2025).

| Termo | Definição |
|---|---|
| **Monotutela Estrita** | Princípio pelo qual cada atleta menor possui exatamente 1 único responsável legal ativo (`GuardianLink.status = ACTIVE`) na plataforma. Impede múltiplos responsáveis concorrentes e conflitos de autorização. |
| **Círculo Restrito de Acesso ao Nome Real** | Escopo exclusivo de atores autorizados a visualizar o nome civil de atletas menores: Gestor do CT da partida, Treinadores vinculados com autorização ativa (`CoachAthleteLink`), Atletas participantes na quadra e o Responsável Legal ativo. |
| **Randomização Obrigatória de Menor** | Substituição mandatória do nome civil real de menor por pseudônimo aleatório e estável por partida (ex.: `Atleta #8B2E` via `minor-name-randomizer.ts`) em links públicos (`MatchShareLink`), QR codes e feeds de espectadores ao vivo quando não houver consentimento `BROADCAST`. |
| **Pseudônimo Estável por Partida** | Código alfanumérico derivado de HMAC-SHA256 (`matchId:playerId`), consistente durante todo o jogo para permitir acompanhamento de games/sets, mas independente entre partidas para evitar correlação longitudinal. |
| **Emancipação Atômica aos 18 Anos** | Transição de tutela que ocorre no instante em que o atleta completa 18 anos (`isMinor = false`): o `GuardianLink` passa a `EMANCIPATED`, a tutela parental cessa e, no próximo login, o jovem é redirecionado para assinar seus próprios termos e consentimentos. |
| **Continuidade Atômica da Partida** | Regra de preservação esportiva: se o responsável revogar o consentimento `DATA` durante uma partida em andamento, os pontos continuam sendo computados pelo `ScoringEngine` até o fim para integridade do adversário, mas a projeção pública torna-se imediatamente randomizada e partidas futuras ficam bloqueadas (`MINOR_GATE_BLOCKED`). |
| **Trava de Autocadastro (`guardianGate`)** | Bloqueio sistêmico aplicado quando um menor se cadastra diretamente (`/signup`): seu perfil entra como `AGUARDANDO_RESPONSAVEL` com acesso restrito a `/aguardando-responsavel` até que o convite único de tutela seja aceito pelo responsável. |
| **Link 1: Ativação de Conta do Menor** | Link emitido pelo Gestor (`/ativar-conta/[token]`) permitindo ao atleta menor criar sua credencial com senha segura de alta entropia. Exige previamente `GuardianLink ACTIVE` e consentimento `DATA`. |
| **Link 2: Ativação e Escolha de Perfil do Responsável** | Link emitido ao responsável legal (`/responsavel/aviso-ativacao/[token]`) após confirmação do consentimento prévio. Permite definir a senha de acesso e escolher entre a **Conta Básica de Acompanhamento** ou a **Conta de Espectador & Anotador**. |
| **Conta Básica de Acompanhamento Parental** | Perfil do responsável legal (`canOperate = false`) voltado estritamente à segurança e supervisão parental. Permite acompanhar quais partidas foram criadas/anotadas para o menor e por quem (treinador/anotador), sem exibição de placares detalhados, estatísticas táticas ou permissão de criar/anotar jogos. |
| **Conta de Espectador & Anotador** | Perfil pleno do responsável (`canOperate = true`) que autoriza o acompanhamento com transmissão ao vivo ponto a ponto e placar do menor, além de conceder a capacidade operacional de criar e anotar partidas próprias e compartilhar links de acompanhamento. |
| **Upgrade de Acompanhamento Parental** | Ação disponibilizada na interface do responsável no modo básico (`POST /api/guardians/me/upgrade`), permitindo transicionar a qualquer momento para a Conta de Espectador & Anotador de forma imediata e sem atrito. |
| **Cruzamento Cadastral de Tutela** | Validação de segurança em que os dados informados pelo gestor (`preGuardianCpfHash` via HMAC-SHA256) são confrontados com o CPF digitado pelo responsável no momento do aceite do convite de tutela. |
| **Anonimização de Titular (LGPD Art. 18)** | Rotina de direito ao esquecimento (`user-anonymize.logic.ts`) que desassocia e ofusca dados pessoais de `User` e `Player` (`Atleta Anonimizado`, remoção de CPF e data de nascimento), preservando a integridade estatística das partidas para os adversários. |
| **Sanitização de Logs de Auditoria** | Higienização de `AuditLog.meta`, substituindo dados pessoais e CPFs em texto puro por referências opacas (`resourceId`), garantindo imutabilidade sem violar a minimização de dados. |

---

## 10. Classificação de Dados Pessoais e Prazos de Retenção (LGPD Arts. 15 e 16 / CF-06)

Tabela canônica de classificação de dados, finalidade e política de retenção e expurgo da plataforma RKT:

| Entidade / Dado | Classificação | Finalidade Legal | Prazo de Retenção | Rotina de Expurgo / Anonimização |
|---|---|---|---|---|
| **User (Conta de Acesso)** | Dado Pessoal Comum | Execução de contrato (Art. 7º, V) e autenticação segura | Duração do vínculo contratual ativo + 5 anos após encerramento (prescrição civil, CC Art. 206) | Expurgo cadastral a pedido do titular ou anonimização de credencial e dados identificadores (`user-anonymize.logic.ts`) |
| **Player (Atleta Adulto)** | Dado Pessoal Comum | Execução de contrato desportivo e organização de partidas no CT | Enquanto perdurar o cadastro no CT ou na plataforma | Anonimização a pedido do titular via `POST /api/users/[id]/anonymize`; substituição por pseudônimo irreversível (`Atleta Anonimizado`) mantendo telemetria histórica |
| **Player (Atleta Menor de 18 Anos)** | Dado Pessoal de Menor (Art. 14 LGPD / ECA Digital) | Operação desportiva sob consentimento do responsável legal (`DATA`) | Até atingir a maioridade (18 anos) com transição para emancipação (`EMANCIPATED`) + prazo legal de guarda | Bloqueio imediato da operação em caso de revogação de consentimento; randomização pública automática (`Atleta #XXXX`); anonimização integral dos cadastros ao fim do vínculo |
| **GuardianLink / GuardianInvite** | Dado Pessoal de Responsável Legal | Cumprimento de obrigação legal e validação de tutela parental | Vigência da tutela (até 18 anos do menor) + 5 anos para fins probatórios perante ANPD e Judiciário | Invalidação atômica de convites expirados (72h); retenção de metadados de auditoria do aceite |
| **ConsentRecord / ConsentEvent** | Registro de Conformidade Regulatória (Prova Jurídica) | Cumprimento de obrigação legal (Art. 16, I da LGPD) | 5 anos após a cessação do tratamento de dados ou revogação do consentimento | Registros com `onDelete: Restrict` no Prisma; arquivo morto auditável imutável com `ipHash` e `contentHash` |
| **Match / PointLog (Telemetria Desportiva)** | Dados Desportivos Técnicos (Estatísticas de Jogo) | Legítimo interesse desportivo e execução de contrato | Permanente (histórico de torneios e rankings) | Em caso de exclusão de conta de um atleta, o placar e histórico dos pontos são desvinculados do CPF/nome civil e mantidos anonimizados para preservar o histórico do adversário |
| **MatchComment / Notas de Áudio** | Comunicação Tática / Anotações de Áudio | Acompanhamento técnico da partida pelo anotador/CT | Enquanto durar a partida ativa no CT ou até solicitação de exclusão | Exclusão pontual sob demanda de qualquer nota de áudio ou comentário (sem afetar o placar esportivo); exclusão após arquivamento da partida |
| **LoginAttempt / Registros de Conexão** | Logs de Conexão e Segurança | Cumprimento de obrigação legal (Marco Civil da Internet, Art. 15) e prevenção a fraudes (Art. 7º, IX) | Mínimo de 6 meses (exigência legal do Marco Civil) a 1 ano (detecção de intrusão) | Rotina periódica de expurgo automatizado para registros com mais de 12 meses |
| **AuditLog** | Trilha de Auditoria de Segurança | Segurança da informação e prestação de contas (Art. 37 da LGPD) | 5 anos a partir do registro | Higienização nativa (sem PII pura no `meta`); guarda protegida para investigação forense |
