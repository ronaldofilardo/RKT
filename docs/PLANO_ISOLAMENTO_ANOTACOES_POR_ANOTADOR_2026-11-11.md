# PLANO — Isolamento de Anotações por Anotador (Partida-Mãe × Anotações Soberanas)

**Data:** 2026-11-11  
**Status:** Planejamento Detalhado (Aguardando Aprovação para Execução)  
**Metodologia / Regras:** `AGENTS.md` · `docs/RULES.md` (Characterization-First, R-03 ≤ 100 linhas/arquivo, `pnpm typecheck`, `pnpm lint`, `pnpm test:strict`, `pnpm test:design`, `pnpm check:r03`)  
**Arquivos canônicos relacionados:** `docs/PRD.md` · `docs/ARCHITECTURE.md` · `docs/TASKS.md` · `docs/PLANO_POOL_PARTIDAS_PUBLICAS_E_NICKNAME_ATLETA_2026-11-09.md`

---

## 1. Problema Atual e Objetivo

### 1.1 Cenário de Negócio
Uma mesma partida real (identificada por um evento/cartaz `[12421]`) pode ser marcada simultaneamente ou em momentos distintos por **inúmeros anotadores**:
- **Anotador A (Treinador designado pelo clube):** marca a partida do início ao fim.
- **Anotador B (Pai/Responsável do jogador 2):** começa a marcar, precisa ir embora antes do fim do jogo e encerra/pausa a própria marcação no meio da partida.
- **Outros anotadores (atletas, outros treinadores, espectadores autenticados):** cada um pode fazer sua própria marcação da mesma partida.

**Regra central:** cada anotador **grava e enxerga somente a sua própria marcação**. A saída antecipada, pausa, edição de placar ou encerramento parcial do Anotador B **não pode interferir** na partida do Anotador A, nem permitir que B veja os pontos marcados por A (ou vice-versa).

### 1.2 Diagnóstico do Código Atual (Gap Analysis)
Embora a entrega `A0.13` (`isPublicTemplate` + `sourceMatchId`) tenha criado a base para separar o cartaz público da anotação derivada, o código atual ainda **vaza leitura e permite escrita cruzada**:

1. **Vazamento na listagem (`listMatches` em `src/services/matchRepository.ts`):**
   - No contexto de um clube (`contextId`), `{ ctId: contextId }` retorna partidas/anotações de **outros treinadores do mesmo CT** sem filtrar por `createdByUserId` (inclusive anotações derivadas do pool, pois `createAnnotationFromTemplate` grava `ctId`).
   - `followedPlayerIds` retorna **todas** as partidas onde atletas seguidos pelo treinador participam, independentemente de quem anotou.
2. **Vazamento na leitura direta (`canReadMatch` em `src/core/access/visibility.ts`):**
   - `GET /api/matches/[id]`, `GET /api/matches/[id]/report` (`checkReportAccess`) e `GET /api/spectate/[matchId]/feed` (`canWatchMatch`) liberam leitura completa de `scoreState`, `PointLog`, timeline e estatísticas para staff do CT, treinadores com `followedPlayerIds`, `guardianOfPlayerIds`, `athletePlayerId` e `participantCtIds`. Com isso, o Pai B ou outro treinador lê a marcação do Treinador A.
3. **Escrita e estado compartilhados na mesma `Match` (quando criada fora do pool público):**
   - `PointLog` (`prisma/schema.prisma`) não tem `annotatorUserId` e `Match` tem um único `state`, `scoreState` e `version`.
   - `canAnnotateMatch`, `validateMatchAnnotatorPermission` (`point/route-load.logic.ts`) e `checkCanModifyMatchState` (`state/state-route-guards.logic.ts`) permitem que vários usuários escrevam na mesma `Match`.
   - `DELETE`/`PATCH` em `/api/matches/[id]/point/[pointId]` validam apenas `role = 'ANNOTATOR'` via `withRLSHandler`, sem validar autoria da partida.
   - `GET /api/matches/[id]/sessions` lista todas as sessões da partida sem checar `canReadMatch`.
   - `findDuplicateMatch` (`src/services/match-duplicate.service.ts`) não filtra por `createdByUserId`, fazendo o `DuplicateMatchModal` oferecer *"Ver partida existente"* apontando para a partida privada de outro usuário.
4. **Visão do Gestor (`GET /api/gestor/matches` e `src/app/gestor/club-matches-table.tsx`):**
   - `groupClubMatches` (`src/app/gestor/group-club-matches.logic.ts`) só agrupa por `sourceMatchId` de templates públicos e mistura partidas privadas avulsas com designações (`assignedCoachId`) gravadas direto na partida ou no template.

---

## 2. Regras de Negócio Consolidadas

### 2.1 Separação Estrita: Evento/Cartaz vs Anotação Soberana
Todo cenário multi-anotador passa a operar sobre dois papéis distintos de registro:
- **Partida-Mãe / Cartaz (Evento `[12421]`):** contém **apenas metadados do confronto** (atletas/duplas, formato, piso, torneio, data/hora, `ctId`, `assignedCoachId`, escopo de visibilidade). **Nunca** recebe `PointLog`, `MatchScoreEdit`, `MatchAnnotationSession` nem `scoreState` de andamento.
- **Anotação Individual (Derivada de `sourceMatchId = 12421`, ou Privada Individual):** registro soberano pertencente a **um único anotador (`createdByUserId`)**, com seu próprio `state` (`SCHEDULED` | `IN_PROGRESS` | `FINISHED` | `CANCELLED`), `finishReason`, `scoreState`, `PointLog[]`, `MatchScoreEdit[]`, `MatchComment[]` e `MatchAnnotationSession[]`.

### 2.2 Regras de Visibilidade de Anotações (Quem vê o placar/pontos/relatório)
| Perfil / Relação | Vê a própria anotação? | Vê anotações de terceiros? | Observações |
|---|---|---|---|
| **Anotador comum** (Treinador, Atleta, Pai/Responsável, Operacional) | **Sim (exclusiva)** | **Não** | Listagem, placar, scoring, timeline, comentários e relatório mostram apenas sua própria anotação. |
| **Gestor do Clube (`GESTOR` ativo no CT)** | **Sim** | **Sim, somente do seu CT** | Vê todas as anotações da mesma partida feitas pelo treinador designado e por demais treinadores/atletas vinculados ao seu CT (ou vinculadas ao evento do CT). |
| **Atletas da partida (Evolução Futura)** | **Sim** | **Não no fluxo padrão atual** *(preparado para opt-in futuro)* | O módulo puro de acesso deve receber uma flag/política explícita (`allowParticipantReadOfficial`) para que, no futuro, atletas da partida possam consultar a anotação oficial designada pelo clube sem misturar marcações em andamento. |
| **Convidado Espectador (`MatchSpectator`)** | N/A | **Sim, apenas a anotação do link de convite** | Convite continua atrelado ao `matchId` da anotação de quem compartilhou (ex.: link gerado pelo Treinador A transmite somente a marcação de A). |
| **Admin / Suporte (`PLATAFORMA`)** | N/A | **Somente governança/auditoria** | Mantém restrições vigentes da matriz de acesso (`PROFILE_MATRIX`). |

### 2.3 Visibilidade do Cartaz / Descoberta (Quem pode iniciar a própria anotação)
Distinção clara entre **ver que a partida existe para anotar a própria versão** (acesso ao Cartaz) e **ver a marcação de alguém** (acesso à Anotação):

| Tipo de Partida (Cartaz) | Quem encontra o cartaz e pode clicar em "Anotar minha versão"? | Onde aparece |
|---|---|---|
| **1. Pública (`PUBLIC`)** | Qualquer usuário autenticado da plataforma (qualquer clube, treinador avulso, atleta, pai/responsável, operacional). | Pool Público (`/partidas-publicas`) |
| **2a. Privada — Treinador Particular (`PRIVATE_COACH`)** | O próprio treinador particular criador **e** os atletas participantes que ele acompanha (ver cenário *d* para menor). | Seção "Disponíveis para Anotar" no Dashboard / Link direto |
| **2b. Privada — Clube (`PRIVATE_CLUB`)** | Gestor do CT, treinadores ativos do CT **e** os atletas envolvidos na partida (vinculados ao CT ou participantes do jogo). | Seção "Partidas do Clube / Disponíveis" |
| **2c. Privada — Atleta Avulso (`PRIVATE_PLAYERS`)** | Os atletas diretamente envolvidos na partida (2 em simples; 4 em duplas). | Seção "Disponíveis para Anotar" |

### 2.4 Cenários Adicionais Mapeados (Completando os casos a, b, c)
Além dos 3 cenários citados (`a`, `b`, `c`), o modelo deve cobrir explicitamente:

| # | Cenário Faltante | Comportamento Esperado |
|---|---|---|
| **d** | **Responsável Legal de Menor (`RESPONSAVEL` via `GuardianLink` ativo)** | Se um atleta participante for menor de idade e o Pai/Responsável tiver `GuardianLink` confirmado e ativo, ele deve encontrar o **cartaz privado** (de `2a`, `2b` ou `2c`) da partida do filho para criar **sua própria anotação isolada** (ex.: Anotador B sai antes do fim). Sem ver a anotação do treinador. |
| **e** | **Partidas de Duplas (4 atletas, CTs/treinadores distintos)** | Em duplas (`player1`, `player1Partner`, `player2`, `player2Partner`), os 4 atletas têm acesso ao cartaz privado de `2c`/`2b`/`2a`. Treinadores particulares ou outro CT **não** ganham acesso automático à anotação de terceiros, nem o elenco de outro clube vê partidas privadas do CT criador. |
| **f** | **Partida Privada Individual ("Só Eu" / `PRIVATE_PERSONAL`)** | Quando o usuário quer fazer uma marcação estritamente pessoal (treino/scout reservado) sem expor nem o cartaz para colegas de clube ou adversário. |
| **g** | **Partida criada pelo Gestor com Treinador Designado (`assignedCoachId`)** | Gestor cria um cartaz (`PUBLIC` ou `PRIVATE_CLUB`) e indica o treinador A (`assignedCoachId`). A recebe notificação; ao abrir, o sistema cria a anotação derivada exclusiva de A (marcada visualmente como *"Designado pelo Clube"*). O Gestor acompanha na tabela todas as anotações daquele cartaz (a de A + as de outros treinadores/atletas). |
| **h** | **Confronto Interclubes (Atleta do CT-A vs Atleta do CT-B)** | Em partida privada criada no CT-A (`PRIVATE_CLUB`), o cartaz fica visível para staff do CT-A e para os atletas participantes (`player1`, `player2` etc.), mas **não** expõe o cartaz para todo o staff do CT-B nem vaza anotações do CT-A para o CT-B. |
| **i** | **Acesso por Link/Código Direto de Partida (`[12421]`)** | Se o Treinador A ou Gestor compartilha o identificador/código da partida-mãe com um usuário autorizado no círculo (ou em partida pública), abrir `/match/[12421]/annotate` (ou `/match/[12421]/scoring`) resolve automaticamente para a **anotação daquele usuário** (`sourceMatchId = 12421, createdByUserId = user.id`), nunca abrindo a anotação de A. |
| **j** | **Anotador Operacional Avulso (`OPERACIONAL`)** | Usuário sem vínculo de treinador/clube/atleta (`canOperate = true`): cria partidas privadas pessoais (`PRIVATE_PERSONAL`), publica no pool (`PUBLIC`) ou anota partidas públicas do pool. |
| **k** | **Saída Antecipada / Encerramento Parcial do Anotador B** | Anotador B pode pausar/suspender ou finalizar sua própria anotação com motivo (ex.: `ABANDONED` / `OUTRO` com nota *"Saí antes do término"*), ficando com o histórico preservado até o ponto em que marcou, sem afetar o status `IN_PROGRESS`/`FINISHED` da partida-mãe nem da anotação de A. |
| **l** | **Criação Offline e Anti-Duplicidade (`/match/new`)** | `findDuplicateMatch` deve verificar duplicidade apenas entre partidas do **mesmo `createdByUserId`**. Se existir um cartaz compatível visível ao usuário (público ou privado do círculo), o modal orienta *"Anotar esta partida (minha marcação)"* em vez de redirecionar para o `matchId` de outro usuário. |

---

## 3. Arquitetura e Modelagem de Dados

### 3.1 Evolução do Schema (`prisma/schema.prisma`)
Mudanças aditivas e retrocompatíveis:

```prisma
enum MatchEventScope {
  PUBLIC           // Pool público global (qualquer usuário autenticado pode anotar)
  PRIVATE_CLUB     // Privada do clube: gestor, treinadores do CT e atletas envolvidos (+ responsáveis)
  PRIVATE_COACH    // Privada do treinador particular: treinador criador e seus atletas envolvidos (+ responsáveis)
  PRIVATE_PLAYERS  // Privada entre atletas: atletas diretamente envolvidos (+ responsáveis)
  PRIVATE_PERSONAL // Estritamente individual ("Só Eu") — sem compartilhamento de cartaz
}
```

No model `Match`:
1. **`isTemplate Boolean @default(false)`** (ou manter `isPublicTemplate` em sincronia: `isPublicTemplate = isTemplate && eventScope === 'PUBLIC'`, evitando quebra de queries/testes existentes durante a transição).
2. **`eventScope MatchEventScope @default(PRIVATE_PERSONAL)`** — define quem descobre o cartaz (e substitui a ambiguidade histórica de `visibility: 'PUBLIC' | 'PLAYERS_ONLY'` e `openForAnnotation`).
3. **`isOfficialClubAnnotation Boolean @default(false)`** (ou derivado dinamicamente: `derived.createdByUserId === template.assignedCoachId`) — identifica no painel do Gestor a anotação do treinador designado.
4. **Regra de integridade no banco (índice único parcial via SQL migration):**
   - Garantir no PostgreSQL que um usuário tenha **no máximo uma anotação ativa (não cancelada e não deletada)** por partida-mãe:
   ```sql
   CREATE UNIQUE INDEX "Match_unique_active_annotation_per_user_idx"
     ON "Match"("sourceMatchId", "createdByUserId")
     WHERE "sourceMatchId" IS NOT NULL
       AND "deletedAt" IS NULL
       AND "state" <> 'CANCELLED';
   ```
   - Isso elimina race conditions em cliques duplos no botão *"Anotar esta partida"*.

### 3.2 Reuso vs Isolamento de `PointLog`, `MatchScoreEdit`, `MatchComment` e `MatchAnnotationSession`
- **Não é necessário duplicar tabelas de pontuação:** como cada anotador opera sempre no seu próprio `Match` (`id` próprio derivado de `sourceMatchId`), `PointLog`, `MatchScoreEdit`, `MatchComment`, `MatchAnnotationSession`, `MatchShareLink` e `MatchSpectator` já ficam **fisicamente isolados por `matchId`**.
- A única condição para que esse isolamento seja absoluto é **fechar todos os pontos de leitura/escrita que hoje permitem que o Usuário B entre no `matchId` do Usuário A**.

---

## 4. Plano de Implementação por Fases

### Fase 0 — Characterization-First (Obrigatória — `RULES.md` §7)
**Objetivo:** Travar o comportamento atual antes de alterar qualquer regra de acesso ou repositório.

1. Criar/atualizar suítes `*.characterization.test.ts`:
   - `src/core/access/__tests__/visibility.characterization.test.ts` (travar `canReadMatch`, `canAnnotateMatch`, `canReadMatchComments`, `canWatchMatch`).
   - `src/services/__tests__/matchRepository.characterization.test.ts` (travar `listMatches` por contexto, `followedPlayerIds` e `ctMemberUserIds`).
   - `src/app/api/matches/[id]/__tests__/point-permissions.characterization.test.ts` (travar permissões atuais de `POST point`, `PATCH/DELETE point/[pointId]`, `PATCH state`, `GET sessions`).
   - `src/app/api/gestor/matches/__tests__/route.characterization.test.ts` (travar retorno atual do painel do gestor).
2. Rodar `pnpm test:strict` e garantir 100% verde antes da Fase 1.

---

### Fase 1 — Schema, Migration e Backfill Seguro
**Objetivo:** Introduzir `isTemplate` e `eventScope` sem quebrar dados legados.

1. Atualizar `prisma/schema.prisma` com `enum MatchEventScope`, campos `isTemplate` e `eventScope` em `Match`, e índice `Match_isTemplate_eventScope_idx`.
2. Criar migration aditiva com:
   - `ALTER TABLE "Match" ADD COLUMN ...`
   - Backfill:
     - Onde `isPublicTemplate = true` → `isTemplate = true`, `eventScope = 'PUBLIC'`.
     - Onde `isPublicTemplate = false` e `ctId IS NOT NULL` → `eventScope = 'PRIVATE_CLUB'`.
     - Demais registros legados → `eventScope = 'PRIVATE_PERSONAL'`.
   - Índice único parcial `Match_unique_active_annotation_per_user_idx`.
3. Atualizar `prisma/seed.ts` (se aplicável) e rodar `pnpm db:migrate:deploy` + `pnpm db:test:push` + `pnpm typecheck`.

---

### Fase 2 — Núcleo Puro de Acesso e Visibilidade (`src/core/access/`)
**Objetivo:** Centralizar em funções puras (≤ 100 linhas/arquivo, R-03) a distinção entre **acesso ao Cartaz** e **acesso à Anotação**.

1. **Criar `src/core/access/match-event-visibility.ts` (puro):**
   - `canDiscoverMatchTemplate(actor, templateAccess): boolean`:
     - `PUBLIC` → `true` para qualquer ator ativo.
     - `PRIVATE_CLUB` → `actor` é `GESTOR` ou `TREINADOR` ativo do `template.ctId`, **ou** `actor.athletePlayerId` é participante, **ou** `actor.guardianOfPlayerIds` contém participante menor.
     - `PRIVATE_COACH` → `actor.userId === template.createdByUserId`, **ou** `actor.athletePlayerId` é participante, **ou** `actor.guardianOfPlayerIds` contém participante menor.
     - `PRIVATE_PLAYERS` → `actor.athletePlayerId` é participante, **ou** `actor.guardianOfPlayerIds` contém participante menor.
     - `PRIVATE_PERSONAL` → apenas `actor.userId === template.createdByUserId`.
2. **Atualizar `src/core/access/visibility.ts`:**
   - **`canReadMatch(actor, m, options?)`:**
     - **Anotador dono (`m.createdByUserId === actor.userId`):** `true`.
     - **Gestor do CT (`isOwnerCtGestor(actor, m)`):** `true` apenas se `m.ctId` pertencer ao CT onde `actor` é `GESTOR` ativo (ou anotação de membro/atleta do CT vinculada ao clube — ver regra da Fase 5).
     - **Todos os demais vínculos (`followedPlayerIds`, `guardianOfPlayerIds`, `participantCtIds`, outro `TREINADOR` do mesmo CT, outro `ATLETA`):** **`false` para leitura de anotações de terceiros!**
     - *(Gancho futuro previsto, desligado por padrão)*: parâmetro opcional `allowParticipantOfficialRead` para futura liberação controlada ao atleta participante ler apenas a anotação designada pelo clube.
   - **`canAnnotateMatch(actor, m)`:**
     - **Estrito ao dono da anotação:** `m.createdByUserId === actor.userId` (e não pode pontuar diretamente em registros onde `m.isTemplate === true`).
     - Remover `isOwnerCtStaff`, `athletePlayerId` de terceiros e bypass irrestrito de `ADMIN`/`SUPORTE` para escrita de pontos em anotação alheia.
   - **`canReadMatchComments(actor, m)`:** apenas dono (`m.createdByUserId === actor.userId`) ou `GESTOR` do CT da anotação.
   - **`canWatchMatch(actor, m, isSpectatorGranted)`:** apenas `isSpectatorGranted === true` (link de convite explícito) ou `canReadMatch(actor, m)`.
3. **Testes unitários:** cobrir toda a matriz (Treinador A vs Pai B, dois treinadores no mesmo CT, duplas, menor com responsável, gestor do CT, futuro opt-in de atleta).

---

### Fase 3 — Backend: Criação, Resolução do Cartaz `[12421]` e Anti-Duplicidade
**Objetivo:** Permitir criar cartazes públicos ou privados de círculo e resolver qualquer entrada em `[12421]` para a anotação isolada do usuário.

1. **Schemas Zod (`src/schemas/match.ts`):**
   - Aceitar `isTemplate` (e manter `isPublicTemplate` como alias compatível) + `eventScope`.
   - Validar consistência: `PRIVATE_PERSONAL` pode criar anotação direta (ou cartaz + anotação automática para o criador); `PUBLIC`, `PRIVATE_CLUB`, `PRIVATE_COACH`, `PRIVATE_PLAYERS` criam cartaz (sem `PointLog`) e, opcionalmente, já geram a primeira anotação derivada do criador se ele for anotar em seguida (`createAndAnnotate`).
2. **Serviço de Template e Derivação (`src/services/match-template-create.logic.ts` e novo `src/services/match-resolve-annotation.logic.ts`):**
   - Generalizar `createPublicTemplate` → `createEventTemplate(data, actor, createdByUserId)` suportando `PUBLIC` e `PRIVATE_*`.
   - Generalizar `createAnnotationFromTemplate(templateId, actor)` → **`resolveOrCreateAnnotation(templateId, actor)`**:
     - Verifica `canDiscoverMatchTemplate(actor, template)`. Se negado → `403 FORBIDDEN`.
     - Busca anotação existente ativa `(sourceMatchId = templateId, createdByUserId = actor.userId, deletedAt = null, state != 'CANCELLED')`.
     - Se existir e `mode = 'resolve'`, retorna `{ matchId: existing.id, created: false }` (ou `409 ALREADY_ANNOTATING` no endpoint estrito de criação explícita).
     - Se não existir, cria a `Match` derivada isolada para `actor.userId`, gravando `ctId` somente se o ator estiver operando dentro daquele CT (mantendo `sourceMatchId = templateId`), e registra `AuditLog` (`MATCH_ANNOTATION_CREATED`).
   - **Nota sobre Gestor criando partida:** quando o Gestor cria partida no `/match/new` indicando ou não um treinador (`assignedCoachId`), cria-se um Cartaz (`PRIVATE_CLUB` ou `PUBLIC`). Se o próprio Gestor clicar em *"Anotar"*, ele também gera uma derivada própria — nunca misturando com a do treinador designado.
3. **Novo/Unificado Endpoint de Anotação por Cartaz:**
   - `POST /api/matches/[id]/annotate` (reutilizando a lógica de `/api/matches/pool/[templateId]/annotate` para templates públicos **e** privados autorizados).
   - Manter `/api/matches/pool/[templateId]/annotate` como alias retrocompatível delegando para a mesma lógica.
4. **Listagem de Cartazes Disponíveis para o Usuário:**
   - `GET /api/matches/available` (ou parâmetro em `/api/matches/pool?scope=private`): lista cartazes **privados** descobertos por `canDiscoverMatchTemplate` (partidas do clube, do treinador particular, dos atletas envolvidos ou dos filhos menores via `GuardianLink`), indicando se o usuário já iniciou sua anotação (`myAnnotationId`, `myAnnotationState`).
   - `GET /api/matches/pool`: continua listando apenas `isTemplate = true AND eventScope = 'PUBLIC'`.
5. **Anti-Duplicidade (`src/services/match-duplicate.service.ts`):**
   - `findDuplicateMatch` passa a filtrar `createdByUserId` (duplicidade pessoal do anotador) e `isTemplate: false`.
   - Se o usuário tentar criar em `/match/new` um confronto que já tem **cartaz acessível** no pool ou no círculo privado, retornar código específico (`TEMPLATE_AVAILABLE` com `templateId`) para que o frontend ofereça *"Anotar este evento (minha marcação)"* em vez de abrir a partida de outra pessoa.

---

### Fase 4 — Backend: Fechamento de Todos os Endpoints de Leitura e Escrita
**Objetivo:** Garantir que nenhum endpoint permita ver ou alterar a marcação de outro usuário.

1. **`listMatches` (`src/services/matchRepository.ts`):**
   - Para usuários comuns (Treinador, Atleta, Pai, Operacional): **filtrar estritamente `createdByUserId = actor.userId` e `isTemplate = false`**.
   - Remover `{ ctId: contextId }` aberto e remover `{ player*Id: { in: followedPlayerIds } }` da listagem de anotações de usuários não-gestores.
   - Para `GESTOR` (somente quando acionado via painel do gestor ou escopo explícito de gestão do CT): escopo limitado ao CT gerido.
2. **Permissões de Escrita em Pontos, Estado, Finalização e Comentários:**
   - `src/app/api/matches/[id]/point/point-route-permission.logic.ts`: exigir `match.isTemplate === false` e `match.createdByUserId === currentUserId` (ou sessão ativa pertencente ao próprio `createdByUserId`).
   - `src/app/api/matches/[id]/state/state-route-guards.logic.ts` e `src/app/api/matches/[id]/finish/route.ts`: exigir `match.isTemplate === false` e `match.createdByUserId === currentUserId`.
   - `src/app/api/matches/[id]/point/[pointId]/route.ts` (`PATCH` e `DELETE`): substituir `withRLSHandler` isolado por verificação explícita de `canAnnotateMatch` / autoria (`createdByUserId === user.id`), fechando o furo atual de qualquer `ANNOTATOR` poder anular ponto alheio.
   - `src/app/api/matches/[id]/sessions/route.ts`:
     - `GET`: exigir `canReadMatch(actor, matchAccess)` antes de retornar sessões (e `postSessionResponse` validar `canAnnotateMatch` + bloquear se `match.isTemplate === true`).
   - `src/app/api/matches/[id]/events/route.ts` e `comments/route.ts`: já usam `withMatchCommentAccess` -> automaticamente passam a obedecer o novo `canReadMatchComments` restrito.
   - `src/app/api/matches/[id]/route.ts` (`GET`): ao passar por `canReadMatch`, bloqueia leitura direta por terceiros; se o `id` solicitado for um **cartaz (`isTemplate: true`)**, retornar metadados do cartaz **apenas se `canDiscoverMatchTemplate(actor, template)`** (e incluir `myAnnotationId` do usuário se existir, sem expor anotações alheias).
3. **Transmissão Espectador (`src/app/api/spectate/[matchId]/feed/route.ts`):**
   - Bloquear spectate em `isTemplate === true` (cartaz não tem feed ao vivo).
   - Manter acesso via `hasActiveSpectatorConcession` / `isGuestSpectatorAuthorized` para a anotação específica que emitiu o convite; usuários sem convite só acessam se satisfizerem o novo `canReadMatch` (dono ou Gestor do CT).

---

### Fase 5 — Painel do Gestor: Listagem Agrupada de Todas as Anotações da Mesma Partida
**Objetivo:** Atender ao requisito *"o Gestor do clube deve continuar vendo as anotações do treinador designado pelo clube e demais atletas e treinadores que anotarem a mesma partida, com mecanismo na aba Partidas que liste todas as anotações da mesma partida"*.

1. **Backend (`GET /api/gestor/matches` em `src/app/api/gestor/matches/route.ts` + query modular `gestor-matches.logic.ts` ≤ 100L):**
   - Buscar **ambos**:
     1. Todos os cartazes vinculados ao clube (`isTemplate = true` onde `ctId = gestorCtId`, ou cartazes de templates públicos que tenham pelo menos 1 anotação derivada feita por membro/atleta do CT).
     2. Todas as anotações (`isTemplate = false`) feitas pelo `assignedCoachId`, por treinadores/membros do CT (`createdByUserId IN clubUserIds`) ou por atletas do CT (`createdByUserId IN athleteUserIds` ou `ctId = gestorCtId`), **trazendo `sourceMatchId`, `createdByUser`, `assignedCoach`, `scoreState`, `state`, `_count.pointLog`**.
   - **Nota importante de visibilidade no Gestor:** caso um pai/terceiro de fora do clube anote um cartaz público do torneio, o Gestor do CT-A vê as anotações ligadas ao seu CT (designado, treinadores do CT e atletas do CT) — ou, se o cartaz for `PRIVATE_CLUB` do próprio CT-A, pode ver todas as anotações derivadas daquele cartaz do clube (incluindo responsáveis dos atletas do CT). Documentar e aplicar esse filtro de forma explícita e auditável.
2. **Designação de Treinador (`POST /api/gestor/matches/[id]/assign` e `POST /api/matches/pool/[templateId]/assign`):**
   - A designação (`assignedCoachId`) grava sempre no **cartaz/partida-mãe** (não em uma anotação avulsa).
   - Se o Gestor tentar indicar em um `id` que é anotação derivada, resolver para o `sourceMatchId` ou impedir inconsistência.
   - No retorno de `GET /api/gestor/matches`, cada anotação derivada sabe se `annotation.createdByUserId === template.assignedCoachId` (flag `isDesignatedAnnotator: true`).
3. **Frontend do Gestor (`src/app/gestor/club-matches-table.tsx`, `group-club-matches.logic.ts`, `club-match-row.tsx`):**
   - Evoluir o agrupamento atual (`groupClubMatches`) para um **Acordeão / Bloco por Partida-Mãe**:
     - **Cabeçalho do Grupo (a Partida `[12421]`):**
       - Confronto (`Jogador 1 × Jogador 2`), Data/Horário, Formato, Escopo (`Pública` / `Clube`),
       - Treinador Designado (ou botão *"Indicar Anotador"* / *"Alterar"* diretamente no cabeçalho do evento),
       - Contador: **`N anotação(ões)`** (ex.: `3 anotações: 1 designado · 2 outros`),
       - Controle para expandir/recolher todas as anotações daquela partida.
     - **Linhas Filhas (cada anotação daquela partida):**
       - **Anotador + Papel na partida:** badge **"Designado (Oficial)"** em destaque quando for o `assignedCoachId`, ou badge **"Treinador"** / **"Atleta"** / **"Responsável"**,
       - **Status da anotação:** `Em andamento`, `Finalizada`, `Interrompida/Pausada` (ou `Não iniciada` quando o designado ainda não abriu),
       - **Placar atual daquela anotação** + quantidade de pontos registrados,
       - **Ações individuais por anotação:** *"Ver Ao Vivo"* (abre `FloatingSpectatorWindow` / `/matches/acompanhar/[annotationId]`) e *"Ver Relatório / Timeline"* (`/match/[annotationId]/report`).
   - Manter e refinar o filtro por **Membro anotador** e adicionar filtro rápido por **Status / Somente Designado**.

---

### Fase 6 — Frontend: Fluxos de Criação, Descoberta Privada/Pública e Saída Antecipada
**Objetivo:** Tornar o fluxo intuitivo para Treinador A, Pai B, Treinador Particular e Atleta Avulso.

1. **Formulário `/match/new` (`MatchVisibilityField.tsx` + `useNewMatchState.ts` + `build-match-payload.logic.ts`):**
   - Opções claras de visibilidade/escopo ao criar uma partida:
     - **Pública (Pool):** aparece no pool público; qualquer usuário pode anotar a própria versão isolada.
     - **Privada do Círculo** *(adaptada ao contexto ativo do criador)*:
       - No contexto de **Clube (`TREINADOR_CLUBE` / `GESTOR`)** → `PRIVATE_CLUB` ("Visível para o Gestor, treinadores do clube e atletas envolvidos").
       - No contexto **Treinador Particular (`TREINADOR_AVULSO`)** → `PRIVATE_COACH` ("Visível para você e os atletas envolvidos que você acompanha").
       - No contexto **Atleta (`ATLETA`)** → `PRIVATE_PLAYERS` ("Visível para você e o(s) outro(s) atleta(s) da partida").
       - *(Nota: em todos os casos acima, responsáveis legais ativos de menores participantes também podem descobrir o cartaz para anotar sua própria versão).*
     - **Privada Só Eu (`PRIVATE_PERSONAL`):** apenas você vê e anota.
   - Quando um usuário cria um cartaz (`PUBLIC` ou `PRIVATE_*`), perguntar ou oferecer ação imediata: *"Criar e começar a minha anotação agora"* vs *"Apenas publicar cartaz"*.
2. **Descoberta de Partidas para Anotar:**
   - `/partidas-publicas`: mantém o pool público global (`eventScope = 'PUBLIC'`).
   - Nova seção (ou aba/bloco no Dashboard *"Partidas Disponíveis para Anotar"* / filtro em `/matches/locate`): consome `GET /api/matches/available`, permitindo ao **Pai B**, ao **Treinador A designado** (também via Mural de Designações) ou ao **Atleta adversário** clicar em **"Anotar esta partida"** e cair direto na **sua** tela `/match/[suaAnotacaoId]/scoring`.
   - Caso acesse `/match/[templateId]/scoring` diretamente (ex.: via link compartilhado ou notificação antiga), um resolvedor na entrada chama `POST /api/matches/[templateId]/annotate` (modo resolve/create) e redireciona transparentemente para `/match/[suaAnotacaoId]/scoring`.
3. **Saída Antecipada do Anotador B (`/match/[id]/scoring`):**
   - Garantir que o fluxo existente de *"Pausar / Sair"* (suspender sessão) e *"Encerrar Minha Anotação Parcialmente"* (`finishMatch` com `reason: 'ABANDONED' | 'OUTRO'`) informe claramente no texto de UI que o encerramento/pausa vale **apenas para a sua marcação**, preservando os pontos que B anotou até ali sem afetar outros anotadores.
4. **Respeito estrito à regra R-03:** todo arquivo novo ou modificado ≤ 100 linhas cruas, usando Design System Telemetry (`pnpm test:design`).

---

### Fase 7 — Validação Final e Qualidade
Gates obrigatórios ao final de cada fase e na entrega:
- `pnpm typecheck` (0 erros)
- `pnpm lint` (0 erros e 0 avisos novos)
- `pnpm check:r03` (0 regressões no limite de 100 linhas)
- `pnpm test:design` (100% Telemetry Design System)
- `pnpm test:strict` (Jest unitário + integração sem skips)
- `pnpm test:coverage` (preservar cobertura ≥ 65% stmts / 80% branches)
- `pnpm spec:validate`
- **Novos testes E2E Playwright (`e2e/flows/09-isolated-multi-annotator.spec.ts`):**
  1. Partida `[12421]` criada como pública (e cenário privado do clube): Treinador A anota até o fim (`FINISHED`); Pai B anota até o 2º set e sai/encerra antes do fim.
  2. Assert: B **não** vê os pontos finais de A no dashboard nem via `GET /api/matches/[matchA]/report` (`403 FORBIDDEN`); A **não** vê a marcação parcial de B (`403 FORBIDDEN`).
  3. Assert: Gestor do clube abre a aba *Partidas do Clube*, expande o evento `[12421]`, vê **ambas** as anotações listadas com placares/status distintos, identifica A como *Designado*, e abre o relatório individual de cada uma.
  4. Assert: Link de espectador compartilhado por A exibe apenas o placar ao vivo de A.

---

## 5. Riscos e Cuidados na Execução

1. **Regressão em `/api/matches` e `MatchCard`:**
   - Hoje vários testes e telas assumem que `listMatches` retorna tudo do `ctId` ou de `followedPlayerIds`. A Fase 0 (Characterization) e a separação explícita entre `GET /api/matches` (minhas anotações), `GET /api/matches/available` (cartazes do meu círculo) e `GET /api/gestor/matches` (visão agregada do Gestor) evitam quebrar o dashboard de usuários comuns.
2. **Links de Notificação Existentes (`ASSIGNED_TO_ANNOTATE` e `POOL_MATCH_*`):**
   - Notificações apontam para `templateId`. O resolvedor em `/match/[templateId]/scoring` (ou chamada a `POST /api/matches/[id]/annotate`) garante que clicar na notificação sempre abra/crie a anotação isolada do treinador designado, nunca tentando pontuar no template.
3. **Offline Sync (`src/lib/offlineDb.ts`):**
   - Como o usuário offline pode criar uma anotação, a fila offline precisa continuar sincronizando com `createdByUserId` do token autenticado e sem colidir com partidas de terceiros em `findDuplicateMatch`.
4. **Privacidade de Menores (LGPD / `A0.8`):**
   - Cartazes em `PUBLIC` continuam respeitando as regras já implementadas (`assertTemplateCreatorAllowed` com `ConsentRecord DATA` para criador menor e máscara de `nickname` quando `poolVisible = false`). Em cartazes `PRIVATE_*`, o acesso é restrito ao círculo legítimo (clube/treinador/participantes/responsável legal confirmado).

---

## 6. Resumo de Entregáveis (para `TASKS.md` quando iniciar execução)

| Fase | Escopo Principal | Critério de Saída |
|---|---|---|
| **0** | Characterization tests de visibilidade, `listMatches`, pontos, sessões e gestor | `pnpm test:strict` verde sem regressões |
| **1** | `MatchEventScope`, `isTemplate`, migration aditiva + backfill + índice único parcial | Migration aplicada (dev/test), `typecheck` 0 erros |
| **2** | Regras puras em `src/core/access/` (Cartaz vs Anotação + Gestor + gancho futuro atleta) | Testes unitários 100% cobrindo todos os perfis e cenários `a`–`l` |
| **3** | Criação, resolução idempotente de `[12421]`, `/api/matches/available`, anti-duplicidade | APIs testadas, `test:strict` verde, R-03 OK |
| **4** | Bloqueio estrito em `listMatches`, `/point`, `/point/[pointId]`, `/state`, `/finish`, `/sessions`, `/report`, `/spectate` | Testes de integração comprovando isolamento (`403` cruzado) |
| **5** | `GET /api/gestor/matches` agrupado + `ClubMatchesTable` com listagem de todas as anotações da partida | Painel do gestor listando designado + demais anotações + ações individuais |
| **6** | UI `/match/new` (Pública / Privada do Círculo / Só Eu), descoberta privada, resolução de URL e avisos de saída parcial | `test:strict`, `test:design`, R-03 ≤ 100L |
| **7** | Validação completa + E2E `09-isolated-multi-annotator.spec.ts` | Todos os gates verdes |

