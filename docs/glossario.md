# Glossário do Projeto RKT

> Documento canônico (ver `AGENTS.md`). Define os termos de domínio usados no código,
> nas telas e na documentação, para garantir consistência de comunicação.
>
> Fonte de verdade: `prisma/schema.prisma` (entidades e enums), `src/schemas/*.ts` (contratos Zod),
> `src/core/scoring/types.ts` (domínio de pontuação), `src/core/access/` (permissões, perfis e governança)
> e `src/core/spectate/` (transmissão e projeção de partida).
>
> **Codificação: UTF-8.** Se você editar este arquivo, mantenha UTF-8 sem BOM.

---

## 1. Produto e papéis

| Termo | Definição |
|---|---|
| **RKT** | Aplicação web (Next.js App Router) de anotação tática ao vivo de partidas de tênis. |
| **ANNOTATOR** | Papel padrão do usuário no banco (`enum Role`). Capacidade base de anotar partidas, registrar pontos, comentários e áudio, corrigir placares e ver relatórios. |
| **ADMIN** | Papel de gestão da plataforma no banco (`enum Role`). Além de tudo do ANNOTATOR, faz gestão global de usuários e entidades em `/admin`. |
| **Acompanhante da Partida** | Usuário autenticado com concessão temporária (`MatchSpectator`) ou vínculo direto (`canReadMatch`) para assistir ao feed em modo somente-leitura. Distingue-se do perfil cadastral `ESPECTADOR`. |
| **Scoring Engine** | Motor puro de pontuação (`src/core/scoring/engine.ts`), agnóstico de UI e backend. Processa cada ponto e calcula o estado de game/set/match segundo os formatos oficiais. |
| **Cartaz de Partida** | Painel visual de acompanhamento público ou restrito exibido em quadra ou via streaming com o placar ao vivo e telemetria da partida. |

---

## 2. Entidades de dados (Prisma)

| Termo | Tabela | Definição |
|---|---|---|
| **User** | `users` | Conta de acesso com credencial, status ativo, base operacional (`canOperate`) e contador de versão de sessão (`sessionVersion`). |
| **LoginAttempt** | `login_attempts` | Registro auditável de tentativa de login (IP, CPF, data, sucesso/falha). |
| **Player** | `Player` | Atleta cadastrado, contendo dados biográficos, rankings, lateralidade, vínculos a CTs e códigos públicos (`athleteCode`, `nickname`). |
| **Match** | `Match` | Partida disputada entre atletas (simples ou duplas), composta de sets, games, pontos e estado de pontuação serializado (`scoreState`). |
| **PointLog** | `PointLog` | Registro imutável e auditável de cada ponto disputado (quem anotou, momento, anotação tática e metadados de áudio). |
| **MatchScoreEdit** | `match_score_edits` | Registro de correção manual do placar; armazena o snapshot anterior (`newScoreState`) para reconstrução da timeline. |
| **MatchComment** | `match_comments` | Comentário do anotador sobre trecho ou momento da partida, com suporte a nota de áudio anexada. |
| **MatchAnnotationSession** | `match_annotation_sessions` | Segmento cronológico de anotação: quem anotou qual trecho e por quanto tempo. |
| **AnnotationEndorsement** | `annotation_endorsements` | Endosso formal de um anotador sobre a precisão do trabalho de outro em uma sessão. |
| **MatchShareLink** | `match_share_links` | Convite revogável de acompanhamento via token aleatório de 32 bytes armazenado exclusivamente em formato hash SHA-256. |
| **MatchSpectator** | `match_spectators` | Concessão temporária por partida permitindo leitura em tempo real do placar e timeline. |
| **MatchAssignedCoach** | `MatchAssignedCoach` | Atribuição formal de um treinador para acompanhamento ou anotação de uma partida específica. |
| **Tournament** | `tournaments` | Torneio ou campeonato oficial promovido por um Centro de Treinamento (`TrainingCenter`). |
| **Club** | `clubs` | Clube ou agremiação externa. Funciona como referência de local (venue) ou adversário de fora; pode vincular-se a um CT operacional (`ctId`). |
| **TrainingCenter** | `training_centers` | Centro de Treinamento (CT), titular dos dados operacionais e tenant esportivo principal da plataforma. |
| **PlayerCT** | `player_cts` | Vínculo associativo n:m entre um atleta (`Player`) e um Centro de Treinamento (`TrainingCenter`). |
| **Membership** | `memberships` | Vínculo de papel e permissões de um usuário em um escopo institucional (CT ou Plataforma). |
| **GuardianLink** | `guardian_links` | Vínculo de tutela legal entre um responsável (`guardianUserId`) e um atleta menor (`playerId`), sob monotutela estrita. |
| **GuardianInvite** | `guardian_invites` | Convite revogável de tutela (72h) com cruzamento cadastral preventivo (`preGuardianCpfHash`) e invalidação atômica. |
| **ConsentRecord** | `consent_records` | Registro imutável de consentimento legal (LGPD Art. 14 / ECA Digital) vinculado a uma finalidade (`purpose`), versão de termos e `ipHash`. |
| **ConsentEvent** | `consent_events` | Rastro cronológico de auditoria de eventos de consentimento (`GRANT`/`REVOKE`) com trilha de prova jurídica (`contentHash`, `ipHash`, `userAgent`). |
| **AthleteClaim** | `athlete_claims` | Solicitação formal de reivindicação de perfil de atleta por um usuário autenticado (`ClaimStatus`). |
| **CoachAthleteLink** | `coach_athlete_links` | Vínculo de acompanhamento técnico direto entre um treinador particular e um atleta (`CoachAthleteLinkStatus`). |
| **CoachInvitationToken** | `coach_invitation_tokens` | Convite assinado e emitido pelo responsável legal para outorgar acompanhamento a treinador externo (token de 7 dias em hash SHA-256). |
| **SupportAccessRequest** | `support_access_requests` | Solicitação controlada e temporária de acesso ao suporte para atuar em conta de usuário sob autorização formal. |
| **LinkInvite** | `link_invites` | Convite de adesão a um CT entregue manualmente (link + código em hash SHA-256, com teto de usos `maxUses`). |
| **PasswordResetRequest** | `password_reset_requests` | Registro de solicitação e emissão de link de redefinição de senha com token hash e expiração. |
| **Notification** | `Notification` | Notificação interna do sistema destinada a um usuário com payload estruturado e controle de leitura. |
| **AuditLog** | `audit_logs` | Registro imutável de ações operacionais e de segurança, sanitizado sem dados pessoais (PII) sensíveis em texto puro (`meta`). |

### Enums de Partida e Pontuação

| Enum | Valores |
|---|---|
| **MatchState** | `SCHEDULED`, `IN_PROGRESS`, `FINISHED`, `CANCELLED` |
| **MatchFinishReason** | `COMPLETED`, `ABANDONED`, `WALKOVER`, `INJURY`, `OUTRO` |
| **MatchFormat** | `BEST_OF_3`, `BEST_OF_3_MATCH_TB`, `BEST_OF_5`, `BEST_OF_3_NO_AD`, `SHORT_SET_2V2_NO_AD`, `MATCH_TB_10`, `PRO_SET_8` |
| **MatchType** | `SINGLES` (simples), `DOUBLES` (duplas) |
| **PointType** | `ACE`, `WINNER`, `FORCED_ERROR`, `UNFORCED_ERROR`, `DOUBLE_FAULT`, `FAULT_FIRST`, `FAULT_SECOND` |
| **AnnotationSessionStatus** | `IN_PROGRESS`, `COMPLETED`, `ABANDONED` |
| **MatchEventScope** | `PUBLIC` (pool global), `PRIVATE_CLUB` (restrito ao CT), `PRIVATE_COACH` (treinador particular e atletas), `PRIVATE_PLAYERS` (atletas envolvidos), `PRIVATE_PERSONAL` (individual/anotação pessoal) |

### Enums de Gestão, Acesso e Associação

| Enum | Valores |
|---|---|
| **Role** | `ANNOTATOR`, `ADMIN` |
| **PlatformPreset** | `ADMIN`, `SUPORTE` |
| **MembershipKind** | `PLATAFORMA`, `GESTOR`, `TREINADOR` |
| **MembershipStatus** | `ACTIVE`, `SUSPENDED`, `ENDED` |
| **IdentityStatus** | `CONFIRMED` (atleta regular com conta ou validação formal), `PROVISIONAL` (atleta pré-cadastrado sem conta própria) |
| **ClaimStatus** | `PENDING`, `APPROVED`, `REJECTED` |
| **ResetStatus** | `PENDING`, `LINK_ISSUED`, `DONE`, `REJECTED` |
| **InviteKind** | `TREINADOR`, `ATLETA`, `GESTOR` |
| **CoachAthleteLinkStatus** | `PENDING`, `ACTIVE`, `REJECTED`, `ENDED` |
| **SupportAccessStatus** | `PENDING`, `APPROVED`, `REJECTED` |
| **NotificationType** | `POOL_MATCH_WITH_MY_ATHLETE`, `POOL_MATCH_AVAILABLE`, `ASSIGNED_TO_ANNOTATE` |

### Enums de Tutela, Consentimento e Conformidade (LGPD & ECA Digital)

| Enum | Valores |
|---|---|
| **GuardianLinkStatus** | `INVITED`, `ACTIVE`, `REVOKED`, `EMANCIPATED`, `DORMANT` |
| **GuardianGateStatus** | `AGUARDANDO_RESPONSAVEL`, `LIBERADO`, `RESTRITO`, `LIBERADO_MAIOR` |
| **GuardianInviteStatus** | `PENDING`, `USED`, `EXPIRED`, `REVOKED`, `SUPERSEDED` |
| **ConsentPurpose** | `DATA` (operação esportiva), `BROADCAST` (transmissão ao vivo com nome civil real), `POOL_VISIBILITY` (visibilidade do nickname nas buscas do pool), `STATS` (estatísticas agregadas) |
| **ConsentAction** | `GRANT`, `REVOKE` |
| **InviteCreatorKind** | `GESTOR`, `MENOR` |

---

## 3. Domínio de pontuação (`src/core/scoring`)

| Termo | Definição |
|---|---|
| **ScoringState** | Estado completo da pontuação: `sets`, `currentGame`, `server`, `isFinished`, `winner`, `setsWon`, `secondServe`. |
| **SetScore** | Placar de um set: `player1`, `player2`, `isTiebreak`, `tiebreakScore`. |
| **GameScore** | Placar do game em curso: `player1`, `player2`, `isDeuce`, `advantage`, `secondServe`. |
| **HistoryEntry** | Par `(stateBefore, point)` que permite rebobinar a partida ponto a ponto via undo. |
| **PointDetails** | Detalhes táticos de um ponto: `winnerId`, `type`, saques (`isFirstServe`/`isSecondServe`/`isLet`), `serverId`, `rallyDetails`, `firstFaultDetail`. |
| **TimelinePoint** | Projeção de um ponto para exibição na timeline com predicados contextuais (`isBreakPoint`, `isGameBall`, `isSetBall`) e placares recalculados. |
| **PointFlow** | Payload de entrada de um ponto submetido ao motor de pontuação. |
| **MatchScoreStateEnvelope** | Envelope `{ state, history }` que encapsula o estado de pontuação persistido no banco. |

### Situações de Ponto e Formatos

| Termo | Definição |
|---|---|
| **Deuce** | Empate em 40-40 no game (`GameScore.isDeuce`). |
| **Advantage (Adv.)** | Vantagem de um dos competidores após o deuce (`GameScore.advantage`). |
| **Break Point** | Ponto em que o recebedor pode quebrar o serviço do sacador (`TimelinePoint.isBreakPoint`). |
| **Game Ball** | Ponto que pode encerrar o game corrente (`TimelinePoint.isGameBall`). |
| **Set Ball** | Ponto que pode encerrar o set corrente (`TimelinePoint.isSetBall`). |
| **Match Ball** | Ponto que pode encerrar a partida como um todo. |
| **Tiebreak** | Game especial de desempate disputado até 7 pontos (com margem de 2) dentro do set. |
| **Match Tiebreak** | Set de desempate final jogado como tiebreak até 10 pontos (`MATCH_TB_10`, `BEST_OF_3_MATCH_TB`). |
| **No-Ad (Sem Vantagem)** | Regra em que, no deuce (40-40), o próximo ponto define o vencedor do game, sem vantagem. |
| **Pro Set** | Formato de set expandido até 8 games com margem de 2 (`PRO_SET_8`). |

---

## 4. Anotação de rally (`src/schemas/rally.ts`)

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
| **duracao** | `opcao_1` (1-4 bolas), `opcao_2` (5-8 bolas), `opcao_3` (9+ bolas) |

### Abreviações da Timeline

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
| **FQ** | Falta no saque (1º saque na rede ou fora) |
| **Sq** | Saque |
| **Pass** | Passada (*passing shot*) |

---

## 5. Espectador e Transmissão em Tempo Real (`src/core/spectate`)

| Termo | Definição |
|---|---|
| **SpectatorProjection** | Projeção sanitizada de partida preparada para consumo em tempo real por acompanhantes e cartazes públicos. |
| **PointLabels** | Dicionário de rotulagem semântica pura que converte dados brutos do ponto em descrições amigáveis de exibição na transmissão ao vivo. |
| **RhythmStatus** | Indicador de ritmo da partida baseado no intervalo de tempo decorrido entre os últimos pontos anotados. |
| **SignalStatus** | Estado de integridade e sincronização da conexão SSE (*Server-Sent Events*) entre o cliente espectador e o servidor. |
| **CorrectionDiff** | Estrutura de auditoria visual de correção retroativa de placar, alertando os espectadores sobre ajustes de histórico sem descontinuar a sessão. |

---

## 6. Acesso, vínculos e pool de atletas (`src/core/access`)

| Termo | Definição |
|---|---|
| **Conta** | Identidade de acesso única vinculada a um CPF e e-mail. Uma pessoa, uma conta, múltiplos papéis. |
| **Vínculo (`Membership`)** | Associação de escopo entre uma conta e a plataforma ou um CT: `PLATAFORMA` (`ADMIN`, `SUPORTE`), `GESTOR` ou `TREINADOR`. ATLETA não é linha de Membership, mas sim `Player.userId`. |
| **Base operacional (`User.canOperate`)** | Flag booleana que habilita a capacidade de cadastrar/buscar atletas, criar partidas e operar a mesa de anotação. |
| **Perfil (`Profile`)** | Perfil contextual calculado em tempo de execução via `getProfiles(actor)`: `ADMIN`, `SUPORTE`, `GESTOR`, `TREINADOR`, `ATLETA`, `RESPONSAVEL`, `OPERACIONAL`. Não é armazenado no banco. |
| **Escopos de Acesso (`Scope`)** | Níveis de restrição avaliados pelo motor de permissões: `ANY`, `P` (Plataforma), `CT` (Centro de Treinamento), `PROP` (Próprio/Criador), `SELF` (O próprio atleta), `RESP` (Responsável Legal ativo), `FOLLOW` (Treinador com vínculo ativo), `NON_PLATFORM_TARGET`. |
| **Papel Avulso** | Treinador, atleta ou espectador cadastrado sem vínculo obrigatório a um CT. Pode criar e anotar partidas no escopo individual ou particular. |
| **Pool Global de Atletas** | Cadastro consolidado de atletas (`Player`) com busca protegida e identificadores públicos desvinculados de dados sensíveis (`athleteCode`). |
| **`sessionVersion` / claim `sv`** | Contador numérico por conta; sua incrementação invalida e expira imediatamente todas as sessões ativas (troca de senha, suspensão ou revogação). |
| **Claim Legado Derivado** | Mapeamento de retrocompatibilidade (`ADMIN`, `ANNOTATOR` ou `NONE`) injetado no token JWT para rotas legadas (`deriveLegacyRole`). |

---

## 7. Proteção de Menores, Governança e LGPD / ECA Digital

Conceitos e mecanismos implementados para conformidade rigorosa com a LGPD (Lei 13.709/2018, Art. 14) e o ECA Digital (Lei 15.211/2025).

| Termo | Definição |
|---|---|
| **Monotutela Estrita** | Princípio pelo qual cada atleta menor possui exatamente 1 único responsável legal ativo (`GuardianLink.status = ACTIVE`) na plataforma, impedindo conflitos concorrentes de outorga. |
| **Tríade de Consentimentos** | Conjunto obrigatório e granular de autorizações fornecidas pelo responsável legal: `DATA` (operação esportiva e anotação), `BROADCAST` (transmissão ao vivo com nome civil real) e `STATS` (estatísticas agregadas anonimizadas, $N \ge 10$). |
| **Círculo Restrito de Acesso ao Nome Real** | Escopo restrito de visualização do nome civil de menores: Gestor do CT da partida, Treinadores vinculados com autorização ativa (`CoachAthleteLink`), Atletas participantes na quadra e o Responsável Legal ativo. |
| **Randomização Obrigatória de Menor** | Substituição mandatória do nome civil de atleta menor por pseudônimo aleatório e estável por partida (ex.: `Atleta #8B2E` via `minor-name-randomizer.ts`) em cartazes públicos, links compartilhados e feeds ao vivo quando não houver consentimento `BROADCAST`. |
| **Pseudônimo Estável por Partida** | Código alfanumérico derivado de HMAC-SHA256 (`matchId:playerId`), garantindo consistência durante toda a partida sem permitir correlação longitudinal entre jogos distintos. |
| **Emancipação Atômica aos 18 Anos** | Transição de tutela disparada no instante em que o atleta completa 18 anos (`isMinor = false`): o `GuardianLink` passa a `EMANCIPATED`, a tutela parental cessa e o atleta assume a titularidade de sua conta e consentimentos. |
| **Continuidade Atômica da Partida** | Preservação esportiva: se o responsável revogar o consentimento `DATA` durante um jogo em andamento, os pontos continuam sendo processados até o encerramento do match para integridade do adversário, mas a visibilidade pública é randomizada imediatamente e novas partidas ficam bloqueadas. |
| **Trava de Autocadastro de Menor (`/signup`)** | Interceptação preventiva na tela de cadastro: se a data de nascimento informada resultar em idade $< 18$ anos, o cadastro é bloqueado e o fluxo redireciona para a criação da conta pelo Responsável Legal (`MINOR_REQUIRES_GUARDIAN`). |
| **Classificador de Atletas no Gestor (A0.22)** | Algoritmo em 4 camadas que classifica os CPFs informados em `/gestor`: `ADULT_ATHLETE`, `MINOR_WITH_GUARDIAN`, `GUARDIAN_USER` e `DEPENDENT_PLAYER_WITHOUT_USER`, prevenindo vínculos indevidos. |
| **Termo de Ciência ECA do Treinador Particular** | Termo formal e auditado (`AuditLog` com `COACH_ECA_TERMS_ACCEPTED`, v2.0) exigido no 1º acesso à área `/treinador`, bloqueando a anotação avulsa de atletas menores de 18 anos sem tutela formal no CT. |
| **Conta Básica de Acompanhamento Parental** | Perfil do responsável legal (`canOperate = false`) voltado estritamente à supervisão familiar: permite auditar quais partidas foram criadas e quem as anotou, sem acesso a placares ao vivo detalhados. |
| **Conta de Espectador & Anotador** | Perfil pleno do responsável (`canOperate = true`) que autoriza o acompanhamento com transmissão ao vivo ponto a ponto e concede capacidade operacional de criar e anotar partidas próprias. |
| **Anonimização de Titular (LGPD Art. 18)** | Rotina de direito ao esquecimento (`user-anonymize.logic.ts`) que desassocia e ofusca dados pessoais de `User` e `Player` (`Atleta Anonimizado`), preservando os registros técnicos para os adversários. |
| **Sanitização de Logs de Auditoria** | Higienização de `AuditLog.meta`, substituindo dados pessoais e CPFs por identificadores opacos (`resourceId`), garantindo prova jurídica sem violar a minimização de dados. |

---

## 8. Movimentos e módulos do código

| Termo | Definição |
|---|---|
| **Camada 1 (service)** | Extração de regra de negócio de componentes e rotas para serviços puros e testáveis. |
| **Camada 2 (partition UI)** | Decomposição de componentes grandes em subcomponentes puros de apresentação ($\le 100$ linhas). |
| **Characterization test** | Teste que congela o comportamento observado de código legado antes de qualquer refatoração (R-15). |
| **Strangler (Padrão Estrangulador)** | Padrão de migração gradual: implementação de nova lógica em paralelo à antiga, com chaveamento seguro. |
| **ste-exception** | Comentário `/* eslint-disable max-lines -- ste-exception R-03: <motivo> */` que documenta formalmente uma exceção aprovada pelo usuário. |
| **edit-score-*** | Família de módulos puros de edição retroativa de placar (`edit-score-domain.ts`, `edit-score-state.ts`, `edit-score-validation.ts`, `edit-score-calculator.ts`). |
| **withRLSHandler / withAccessHandler** | Wrappers de segurança de API routes que injetam contexto do usuário autenticado, executam sanitização de headers e aplicam as matrizes de permissão. |

---

## 9. Classificação de Dados Pessoais e Prazos de Retenção (LGPD Arts. 15 e 16 / CF-06)

| Entidade / Dado | Classificação | Finalidade Legal | Prazo de Retenção | Rotina de Expurgo / Anonimização |
|---|---|---|---|---|
| **User (Conta de Acesso)** | Dado Pessoal Comum | Execução de contrato (Art. 7º, V) e autenticação segura | Duração do vínculo contratual ativo + 5 anos após encerramento (prescrição civil, CC Art. 206) | Expurgo cadastral a pedido do titular ou anonimização de credencial e dados identificadores (`user-anonymize.logic.ts`) |
| **Player (Atleta Adulto)** | Dado Pessoal Comum | Execução de contrato desportivo e organização de partidas no CT | Enquanto perdurar o cadastro no CT ou na plataforma | Anonimização a pedido do titular via `POST /api/users/[id]/anonymize`; substituição por pseudônimo irreversível (`Atleta Anonimizado`) mantendo telemetria histórica |
| **Player (Atleta Menor de 18 Anos)** | Dado Pessoal de Menor (Art. 14 LGPD / ECA Digital) | Operação desportiva sob consentimento do responsável legal (`DATA`) | Até atingir a maioridade (18 anos) com transição para emancipação (`EMANCIPATED`) + prazo legal de guarda | Bloqueio imediato da operação em caso de revogação de consentimento; randomização pública automática (`Atleta #XXXX`); anonimização integral dos cadastros ao fim do vínculo |
| **GuardianLink / GuardianInvite** | Dado Pessoal de Responsável Legal | Cumprimento de obrigação legal e validação de tutela parental | Vigência da tutela (até 18 anos do menor) + 5 anos para fins probatórios perante ANPD e Judiciário | Invalidação atômica de convites expirados (72h); retenção de metadados de auditoria do aceite |
| **ConsentRecord / ConsentEvent** | Registro de Conformidade Regulatória (Prova Jurídica) | Cumprimento de obrigação legal (Art. 16, I da LGPD) | 5 anos após a cessação do tratamento de dados ou revogação do consentimento | Registros com `onDelete: Restrict` no Prisma; arquivo morto auditável imutável com `ipHash` e `contentHash` |
| **Match / PointLog (Telemetria Desportiva)** | Dados Desportivos Técnicos (Estatísticas de Jogo) | Legítimo interesse desportivo e execução de contrato | Permanente (histórico de torneios e rankings) | Em caso de exclusão de conta de um atleta, o placar e histórico dos pontos são desvinculados do CPF/nome civil e mantidos anonimizados para preservar o histórico do adversário |
| **MatchComment / Notas de Áudio** | Comunicação Tática / Anotações de Áudio | Acompanhamento técnico da partida pelo anotador/CT | Enquanto durar a partida ativa no CT ou até solicitação de exclusão | Exclusão pontual sob demanda de qualquer nota de áudio ou comentário (sem afetar o placar esportivo); exclusão após arquivamento da partida |
| **LoginAttempt / Registros de Conexão** | Logs de Conexão e Segurança | Cumprimento de obrigação legal (Marco Civil da Internet, Art. 15) e prevenção a fraudes (Art. 7º, IX) | Mínimo de 6 meses (Marco Civil) a 1 ano (detecção de intrusão) | Rotina periódica de expurgo automatizado para registros com mais de 12 meses |
| **AuditLog** | Trilha de Auditoria de Segurança | Segurança da informação e prestação de contas (Art. 37 da LGPD) | 5 anos a partir do registro | Higienização nativa (sem PII pura no `meta`); guarda protegida para investigação forense |
