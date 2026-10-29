# PLANO v2 (filtrado, sem transmissão ao vivo) — Painel Geral do RKT · Fundação de Acesso, CT e Pool de Atletas

> Versão filtrada de `PLANO_FUNDACAO_PERFIS_v2_2026-10-23.md`: **tudo o que trata de transmissão ao vivo, convite de transmissão e espectador foi removido.** A numeração original (F#, §, P#) foi mantida; as lacunas (F10, F11, §11, P5, Fase 2) são intencionais. Os pontos que ficaram dependentes dessa remoção estão no **Apêndice**.
> Documento para um agente de IA implementar. Data do original: 2026-10-23. **Nenhuma alteração de código foi feita ao gerar este documento.**
> Leia antes: `AGENTS.md` → `docs/RULES.md`, `ARCHITECTURE.md`, `DESIGN.md`, `TASKS.md`, `MEMORY.md`, `docs/archive/PLANO_DUPLAS_2026-10-21.md`.
> `graft/` é só uma skill: não ler como fonte nem editar. Itens **VERIFICAR** não foram confirmados no código. Itens **[DECIDIR]** têm padrão adotado em §16.
> Não é aconselhamento jurídico: LGPD, termos e cobrança exigem revisão profissional.

---

## 0. Como trabalhar

Regras do `PLANO_DUPLAS §0`: Characterization-First; baby steps (`pnpm typecheck` + testes do módulo a cada passo; `pnpm test:strict` a cada fase; UI também `test:design`/`test:components`); testes pulados proibidos; núcleo puro em `src/core/**`; **R-03 (≤100 linhas por arquivo; arquivos do baseline não crescem)**; tokens `telemetry-*`; `jsx-a11y`; imports `@/…`; documentar ao fim.
Regras extras: **estrangulamento** (o sistema atual funciona a cada commit) e **nenhum envio de e-mail** nesta etapa (§8).

---

## 1. Registro de decisões (não reabrir)

| # | Decisão |
|---|---|
| F1 | **4 vínculos armazenados:** `PLATAFORMA` (predefinição `ADMIN` ou `SUPORTE`), `GESTOR` (de um CT), `TREINADOR` (de um CT ou avulso), `ATLETA` (conta ligada a um atleta do pool). Mais: a **base operacional** (equivale ao "anotador": cadastrar/buscar atletas, criar e anotar partidas). Os nomes dos perfis continuam na tela, calculados a partir disso. |
| F2 | **Uma pessoa, uma conta, vários vínculos** (gestor também treinador e atleta; treinador também atleta). |
| F3 | **Admin = só operação da plataforma**, sem conteúdo de partidas. **Suporte** = ajuda de conta, **sem conteúdo de partidas nesta etapa**. |
| F4 | **CT (Centro de Treinamento)** = dono dos dados (tenant). **Clube** = só referência (adversário de fora, local da partida). |
| F5 | **Cobrança de CTs e atletas** com gateway em fase posterior. Nada de dado de pagamento aqui. |
| F6 | **Menores podem usar o sistema** com conta própria (o cadastro e o registro de partidas não têm dados sensíveis). **Responsável** pode ser vinculado; quando a transmissão voltar, é quem assiste os jogos do menor. |
| F7 | **Pool global de atletas:** cada atleta tem um **ID/código**; qualquer conta operacional encontra e usa atletas nas suas partidas (evita duplicação). **Estar no pool não dá acesso aos dados do atleta** (§9). |
| F8 | **Sem envio de e-mails por ora.** O e-mail é só nome de login, **não verificado**. Convites e recuperação funcionam por **link/código entregues manualmente** (WhatsApp etc.). |
| F9 | **Recuperação de senha via suporte** (fila + link de troca gerado pelo suporte; §7.3). |
| F12 | **Quem usa o app hoje não perde nada** (vira base operacional com o acesso atual). |
| F13 | **`Player.ctId` não existe:** vínculo atleta↔CT é tabela própria (um atleta pode estar em vários CTs). |
| F14 | **Visibilidade de partida entre CTs** por regra explícita (§6.3). |
| F15 | **Maioridade e direitos do titular** entram no modelo (§10). |
| F16 | **Revogação com meta ≤ 60 s** (cache por instância) e o guarda legado também confere a versão de sessão. |
| F17 | **A rota de gravação de pontos não é migrada na Fase 1A** (mantém guarda legado + checagem de sessão). |
| F18 | **Auto-cadastro com escolha de papel avulso:** na tela de cadastro a pessoa escolhe **atleta**, **treinador** ou **espectador**. Esses papéis são **avulsos, sem vínculo com CT nem clube**. Entrar num CT (gestor/treinador/atleta de CT) continua exigindo **convite de vínculo** ou **aprovação do suporte/admin**. |
| F19 | **Redirecionamento por perfil** logo após o login (suporte não cai no painel de anotação). |

---

## 2. Glossário (adicionar a `docs/glossario.md`)

**Conta** (login único) · **Vínculo** (tipo + escopo: "gestor do CT Alfa", "treinador avulso", "plataforma/suporte") · **Base operacional** (capacidade de operar o jogo; é o "anotador") · **CT** (tenant) · **Clube** (referência) · **Pool de atletas** (cadastro global de identidades de atleta, com código) · **Código do atleta** (ID curto público do atleta) · **Atleta provisório** (cadastro rápido sem identidade confirmada, §9.4) · **Responsável** (ligado a menor) · **Convite de vínculo** (link+código para entrar num CT) · **Papel na partida** (criador, anotador da partida, jogador).

---

## 3. Estado atual relevante (levantado no código)

1. `enum Role {ADMIN, ANNOTATOR}` + `ROLE_HIERARCHY` (`src/lib/auth.ts`); **67 referências em ~35 arquivos** (`api/admin/*`, `api/players/*`, `api/matches/**`, `middleware.ts`, `lib/auth.ts`, `lib/rls-context.ts`, `lib/errors.ts`, `app/admin/*`, `app/aguardandoanotador`, `app/match/new/useNewMatchState.ts`, `app/login`, `DashboardChrome.tsx`, `test-helpers/auth.ts`).
2. JWT HS256, 2 h, claims `sub`+`role`; `decodeJwtPayload`/`isRole` **rejeitam role ≠ ADMIN|ANNOTATOR**; sem revogação; cliente guarda `user_role` em `sessionStorage`. `/api/auth/*` tem **só** `login`, `logout`, `me`, `refresh` — **não há recuperação de senha nem e-mail transacional** (busca no código sem resultados).
3. Login por e-mail **ou** CPF (`authenticate.ts`); `User.cpf` obrigatório e único; rate-limit de login é **opt-in** (`ENABLE_LOGIN_RATELIMIT`). Só o admin cria usuários (`POST /api/admin/users`).
4. `Player` **já é um catálogo compartilhado** (seed e policy `player_read_all`), mas `playerService.list` filtra por `createdByUserId`; `Player` não tem vínculo com `User`. Rotas de partida comparam `match.player1Id === currentUserId` (id de Player × id de User) — **VERIFICAR** (provável nunca verdadeiro; vira `[TD-XXX]`).
5. "Clube" é texto livre em `User.club`, `Player.club`, `Match.clubName`.
6. **RLS pouco confiável** (`set_config` local fora de transação + pooler do Neon em modo transação) → **autorização no código**; RLS só reforço.
7. Admin já é barrado das partidas (alinhado com F3). `Match.visibility` padrão `PUBLIC`; `/matches/locate` é rota pública.
8. Seed com senha fixa `123456` e CPFs fixos → **VERIFICAR** que nunca roda em produção; adicionar trava de ambiente.
9. Infra: Vercel Hobby + Neon free. **Cobrança é uso comercial → exige Vercel Pro** antes do Financeiro (§15).
10. Existe `LoginAttempt` (reaproveitável para limitar tentativas de código/recuperação).

---

## 4. Modelo de domínio (Prisma — migração aditiva)

```
enum PlatformPreset { ADMIN SUPORTE }
enum MembershipKind { PLATAFORMA GESTOR TREINADOR }
enum MembershipStatus { ACTIVE SUSPENDED ENDED }

TrainingCenter ("training_centers")     id, name, slug @unique, status, createdAt, createdByUserId
Club           ("clubs")                id, name, city?, @@unique([name, city])      // referência

Membership ("memberships")
  id, userId, kind, preset? (só PLATAFORMA), ctId? (obrigatório p/ GESTOR; opcional p/ TREINADOR),
  status, createdByUserId?, createdAt, endedAt?
  @@unique([userId, kind, ctId])

Player (pool)  + athleteCode String @unique (8 caracteres, alfabeto sem ambíguos),
                 userId String? @unique  (conta ligada = vínculo ATLETA),
                 clubId? (referência), identityStatus (CONFIRMED | PROVISIONAL),
                 mergedIntoId? (mescla), searchable derivado (§9)
PlayerCT   ("player_cts")   id, playerId, ctId, status, since, endedAt?   @@unique([playerId, ctId])

GuardianLink ("guardian_links")   id, guardianUserId, playerId, relation?, confirmedAt?, revokedAt?, createdAt
ConsentRecord("consent_records")  id, guardianUserId, playerId, purpose (DATA), termsVersion, grantedAt, revokedAt?, ip?
AthleteClaim ("athlete_claims")   id, userId, playerId, status (PENDING|APPROVED|REJECTED), decidedByUserId?, createdAt
LinkInvite   ("link_invites")     id, ctId, kind (TREINADOR|ATLETA|GESTOR?), tokenHash, codeHash, createdByUserId, expiresAt, usedAt?, maxUses=1
PasswordResetRequest ("password_reset_requests")
  id, userId, status (PENDING|LINK_ISSUED|DONE|REJECTED), contactHint?, requestedAt, requestIpHash?,
  issuedByUserId?, tokenHash?, tokenExpiresAt?, doneAt?
AuditLog     ("audit_logs")       id, actorUserId?, action, resourceType, resourceId?, ctId?, meta Json?, ipHash?, createdAt

User  + cpf String? (UNIQUE; vários NULL), canOperate Boolean @default(false p/ novos; TRUE no backfill),
        sessionVersion Int @default(0), lastLoginAt?
Match + ctId? (CT dono), venueClubId?     // createdByUserId continua
```

Notas:
- **ATLETA não é linha de `Membership`**: é `Player.userId`. O atleta pertence a CTs por `PlayerCT` (vários). Resolve "atleta em dois CTs" e atletas **sem conta** (menores/adversários).
- `User.role` legado fica **derivado** (§6.4) e em sincronia na mesma transação; um script de **consistência** compara `User.role` × vínculos.
- `User.club`, `Player.club`, `Match.clubName` permanecem (leitura dupla) até fase futura.
- RLS nas tabelas novas no padrão `20261022000000_add_rls_policies` (defesa em profundidade).
- Egress/armazenamento (Neon free): `AuditLog` **somente** eventos sensíveis (nada de leituras); campos `ipHash` (hash com sal), não IP puro.

---

## 5. Matriz de permissões (v1) — dados, não código

Escopos: `P` plataforma · `CT` CT do vínculo · `PROP` o que criou · `PART` partidas em que participa · `RESP` menores sob sua responsabilidade.

| Permissão | Admin | Suporte | Gestor | Treinador | Atleta | Base operacional |
|---|---|---|---|---|---|---|
| `platform:users:manage`, `platform:ct:manage`, parâmetros/saúde | P | — | — | — | — | — |
| `platform:memberships:manage` | P | P (exceto Admin/Suporte) | CT | — | — | — |
| `support:account:assist` (desbloquear, forçar logout, fila de senha, aprovar operar/reivindicação) | P | P | — | — | — | — |
| `platform:player:merge` (mesclar duplicados do pool) | P | P | — | — | — | — |
| `audit:read` | P | P | CT | — | — | — |
| `ct:members:manage`, convites de vínculo | — | — | CT | — | — | — |
| `ct:finance/tournament/agenda` *(fases futuras)* | — | — | CT | — | — | — |
| `athlete:create` / `athlete:search` (§9) | — | — | ✓ | ✓ | ✓ | ✓ |
| `athlete:update` | — | — | CT | CT/PROP | PROP (próprio) | PROP |
| `match:create` / `annotate` | — | — | ✓ | ✓ | ✓ | ✓ |
| `report:view` | — | — | §6.3 | §6.3 | §6.3 | §6.3 |
| `guardian:link`, consentimentos | — | assistido | CT | CT | PROP | — |

- **Admin e suporte não têm `match:*`** (F3).
- **Anotador (F12):** tudo o que o `ANNOTATOR` faz hoje; verificado por testes de caracterização.
- **Espectador avulso** = mesmas permissões da **base operacional** (`athlete:create/search/update` próprio, `match:create/annotate`, `report:view` §6.3); `match:watch` entra com a transmissão. Não há coluna própria na matriz.
- Permissão = **união** dos vínculos ativos; o perfil ativo (UI) só escolhe contexto e o "em nome de" (§6.5).

---

## 6. Acesso: módulo central e regras

### 6.1 Núcleo puro `src/core/access/`
`permissions.ts`, `profile-matrix.ts`, `can.ts`, `scope.ts`, `visibility.ts`, `age.ts` (`isMinor(birthDate, now)` — **avaliado na leitura, sem cron**). `can(actor, action, resource?) → {allow, reason}`; negar por padrão; `reason` só em log. Teste de **tabela exaustiva** (todos os tipos de conta × permissões × escopos: dentro/fora do CT, próprio/alheio, menor/adulto, responsável). Cobertura ≥ 95%.

### 6.2 Serviço e adaptador
`src/services/accessService.ts`: `getActor(userId)` (1 consulta: `user`, `memberships`, `playerLink`, `guardianLinks`; memoizado por requisição **e** cache em memória por instância com **TTL 60 s**). `src/lib/access-handler.ts`: `withAccessHandler(request, action, resolveResource, handler)`.
**Meta de revogação: ≤ 60 s** (TTL do cache; troca de vínculo/senha/suspensão também grava `sessionVersion++`).

### 6.3 Quem vê uma partida (regra única — F14)
Pode **ler a partida e seus relatórios**: o criador · a equipe do **CT dono** (gestor e treinadores) · o **anotador da partida** (sessão) · as **contas dos atletas participantes** · os **responsáveis** dos participantes menores · a equipe (gestor/treinadores) dos **CTs dos participantes** (via `PlayerCT`). **Comentários/observações do anotador**: só criador, anotador e equipe do CT dono — **nunca** responsável. Treinador **avulso** só vê partidas que **criou ou anotou** (acompanhamento treinador↔atleta fica para a Fase 3).

### 6.4 Claim legado derivado (mantém as ~35 rotas)
`deriveLegacyRole`: tem `PLATAFORMA/ADMIN` → `ADMIN`; `canOperate` ou qualquer vínculo `GESTOR/TREINADOR/ATLETA` → `ANNOTATOR`; só `SUPORTE` e/ou conta sem vínculo operacional → **sem claim válido** (rotas legadas respondem 401 — desejado). `/me`, `/refresh`, `/logout` e `/login` migram **na Onda 0** para o novo extrator (senão suporte/conta sem operação quebram no `/me`).
**Guarda legado + sessão:** `withRLSHandler`/`requireRole` passam a conferir também `sv` (usa o mesmo cache de 60 s) → a revogação vale também nas rotas ainda não migradas.

### 6.5 Perfil ativo e "em nome de"
Cookie `rkt_active_profile` (validado a cada uso). Ao criar atleta/partida com mais de um escopo possível (CT ou pessoal), o formulário pergunta **"em nome de"**; padrão = perfil ativo; nunca inferir em silêncio.

---

## 7. Contas, cadastro e recuperação (sem e-mail)

### 7.1 Auto-cadastro (F18)
`/cadastro`: nome, **login = e-mail ou CPF** (CPF opcional; e-mail **não verificado**), senha (mín. 8, bloqueia senhas comuns). Tela de cadastro oferece a escolha do **papel avulso** (sem vínculo com CT/clube):
- **Treinador avulso:** `Membership(TREINADOR, ctId = null)` + `canOperate = true` (cadastra atletas, cria e anota partidas; vê só o que criou/anotou — §6.3).
- **Atleta avulso:** `canOperate = true`; liga-se ao pool escolhendo/reivindicando um atleta existente (§9.5) ou criando o próprio registro após a busca anti-duplicidade (§9.4).
- **Espectador avulso:** `canOperate = true`, sem vínculo com CT/clube. **Pode cadastrar/buscar atletas, criar e anotar partidas**, com as mesmas permissões da base operacional e o mesmo escopo do treinador avulso (só vê o que criou/anotou — §6.3). A capacidade de **assistir transmissões** é acrescentada quando a transmissão voltar.
Limite de cadastros por IP (tabela de tentativas). Colisão de e-mail "ocupado" por terceiro: tratada pelo suporte (disputa) — risco aceito e registrado. A escolha de papel não dá acesso a CT.
Entrar num CT / virar gestor: (a) **convite de vínculo** aceito (§7.2); (b) **pedido "quero operar" num CT** aprovado por suporte/admin (fila no painel do suporte); (c) criação direta pelo admin (como hoje).

### 7.2 Convites de vínculo (link + código, manuais)
Gestor gera convite para **TREINADOR** ou **ATLETA** do **seu CT** (uso único, expira em 7 dias, hash do token e do código). Quem aceita, logado, ganha o vínculo e `canOperate`. O convite de **GESTOR** só o admin emite. Rate limit de tentativas de código (por usuário/IP/convite) com bloqueio progressivo e resposta genérica.

### 7.3 "Esqueci minha senha" → fila do suporte (F9)
1. Tela de login: botão **"Esqueci minha senha"** → `POST /api/auth/forgot {identifier, contato?}` (`contato` texto livre ≤ 80, ex.: WhatsApp). Resposta **sempre genérica** ("o suporte vai entrar em contato"). Se a conta existe e não há pedido pendente, cria `PasswordResetRequest(PENDING)`. Limite por IP (ex.: 5/h).
2. Suporte vê a fila (nome, login mascarado, contato, hora, perfis) e **confirma a identidade por fora do app**. Para conta de menor: com o **responsável**. **Suporte não redefine contas ADMIN/SUPORTE nem a própria** (só admin).
3. "Gerar link": token de 32 bytes, **só o hash** é guardado, **expira em 30 min, uso único**; o link é mostrado **uma vez** ao suporte, que o entrega manualmente.
4. `/redefinir-senha/[token]` (página pública): define nova senha → `passwordHash`, **`sessionVersion++`** (encerra todas as sessões), pedido `DONE`, `AuditLog`. No próximo login, aviso: "Sua senha foi redefinida em DD/MM pelo suporte".
5. `AuditLog` em: pedido, emissão, uso/expiração. Alerta visual ao admin se um suporte emite volume anormal (limiar configurável). Canal desenhado para **plugar e-mail depois** sem mudar o fluxo.

### 7.4 Redirecionamento por perfil (F19)
Após login: suporte → painel do suporte; admin → painel admin; demais → painel operacional. Guard de página por permissão (não só ocultar menu).

---

## 8. Sem e-mail: consequências assumidas
Nada depende de entrega de e-mail: convites e recuperação são **in-app** ou **link/código copiado**. Limitações aceitas: sem notificação fora do app; e-mail não prova identidade. **Quando recibos/cobrança (Fase 4) entrarem, e-mail transacional provavelmente será exigido** — registrar em `TASKS.md`.

---

## 9. Pool de atletas (F7, F13)

1. **Um atleta, um registro** (`Player`) com **`athleteCode`** (8 caracteres, alfabeto sem 0/O/1/I/L). O código identifica e liga; **não é segredo** (não dá acesso a dados).
2. **Pool ≠ acesso:** o pool serve para **escolher o atleta numa partida**. Dados, estatísticas e relatórios seguem §6.3.
3. **Busca** (`athlete:search`, mín. 3 caracteres, paginada, com limite de taxa):
   - **Adulto:** qualquer conta operacional encontra por nome; resultado **mínimo**: nome, código, CT(s)/clube. Nunca data de nascimento, e-mail, ranking detalhado.
   - **Menor:** **não aparece em busca por nome** para quem não é do CT do atleta, responsável ou criador do cadastro. Fora desse círculo, só por **código do atleta** (que o CT/responsável fornece). Em resultado visível a terceiros, sobrenome **abreviado** (§12).
4. **Cadastro sem duplicar:** ao criar atleta, o sistema **busca antes** (nome similar + data de nascimento quando houver) e mostra possíveis iguais. **Atleta provisório** (`PROVISIONAL`): cadastro rápido (nome/apelido) para adversário que ninguém encontrou; **não aparece em busca**; só o criador usa. **Mesclagem** (suporte/admin): une duplicados e provisórios, reaponta partidas e registra `AuditLog`; `mergedIntoId` preserva histórico.
5. **Reivindicação:** uma conta liga-se a um atleta do pool por `AthleteClaim` (informa o código) → aprovada por: **responsável** (menor), **gestor do CT** do atleta ou **criador do cadastro** (adulto); sem nenhum deles, **suporte** decide após conferência externa. **Nunca automática** por nome/e-mail.
6. **Atleta ↔ CT:** `PlayerCT` (vários). Gestor adiciona/encerra atletas do seu CT; encerrar não apaga histórico.

---

## 10. Menores, responsável, maioridade e direitos do titular (LGPD)

1. **Menor** = `isMinor(birthDate, now)` (sem data, tratar como menor para fins de proteção — **[DECIDIR]** exigir data de nascimento no cadastro).
2. **Conta de menor** pode ser criada diretamente (auto-cadastro ou convite), sem exigir responsável. O **vínculo com responsável** (`GuardianLink` + `ConsentRecord`) é **opcional** e dá ao responsável acesso aos dados/relatórios do menor. Atleta menor sem conta continua podendo existir como cadastro operacional do CT. **Revisar com jurídico** o enquadramento de dados de crianças/adolescentes na LGPD (art. 14) antes da 1C, mesmo sem dados sensíveis.
3. **Consentimento** `DATA` (tratamento de dados). Registrar finalidade, versão dos termos, data e IP (hash).
4. **Responsável** vê dados, partidas e relatórios do menor.
5. **Maioridade** (avaliada na leitura, sem cron): ao completar 18, o `GuardianLink` fica **dormente** (sem acesso a dados) até o atleta (com conta) **confirmar** o responsável; atleta sem conta continua só como cadastro do CT até reivindicar.
6. **Revogação** pelo responsável: suspende a conta do menor; histórico preservado segundo política de retenção (**[DECIDIR]** com jurídico).
7. **Direitos do titular:** o titular (ou responsável) pode **exportar** seus dados (JSON) e **pedir exclusão/anonimização**; a operação é executada por **admin** (sem ler conteúdo), substituindo nome por "Atleta removido" onde há terceiros envolvidos e preservando placares.
8. Checklist fora do código (`TASKS.md`): política de privacidade, termos, encarregado (DPO), base legal, retenção.

---

## 12. Privacidade de menores na interface
Sobrenome de menor **abreviado** em: resultado de busca para terceiros e listas de partidas de quem não é do círculo (§6.3). Datas de nascimento de menores **nunca** saem do círculo (CT, responsável, criador). Testes de contrato de privacidade por tela/endpoint.

---

## 13. Painel (casca) e perfis na tela (Fase 1B)
- Menu por **permissão** (`requires: <permissão>`), com a rota **também** negando; seletor de perfil ativo; rótulo do contexto (CT ou "pessoal").
- Home por perfil (cartões declarativos): Admin (usuários, CTs, saúde, auditoria), **Suporte** (fila de senha, pedidos "quero operar", reivindicações, mesclagem), Gestor (atletas e treinadores do CT, convites, partidas do CT), Treinador, Atleta, Base operacional (partidas a anotar, atletas). Cartões de módulos inexistentes **não aparecem**.
- Gestão de vínculos (admin; gestor no CT) com `AuditLog`.
- Reaproveitar `DashboardChrome/Sidebar/TopBar/ViewRouter` + Telemetry; conferir R-03 antes de editar.

---

## 14. Fases (reorganizadas)

### Fase 1A — Fundação invisível (sem telas novas)
**F0 Verificações:** seed fora de produção; `Player.id × User.id`; RLS efetiva?; arquivos do baseline R-03 a tocar; suíte atual como linha de base.
**Núcleo puro** `core/access` (tabela exaustiva) → **Banco** (migração §4, `cpf` opcional, `canOperate`, `sessionVersion`; backfill: todo usuário atual `canOperate=true`, admins → `PLATAFORMA/ADMIN`) → **Serviço e adaptadores** (`getActor` + cache 60 s, `withAccessHandler`, compat com `sv`, JWT com `sv`, claim derivado; **Onda 0**: `login/refresh/me/logout`) → **Migração de dados** (script idempotente `--dry-run`: admins que também anotam → listados; clubes/CTs: relatório para revisão manual antes de gravar) → **Ondas de leitura e rotas novas** (admin/users, players leitura, matches leitura/relatórios/lista). **NÃO migrar** `point`, `state`, `finish`, `arrangement`, `sessions`, `comments` (F17). Nenhum arquivo do baseline cresce (`check:r03`).
**Aceite:** nada muda para quem usa hoje (caracterização verde sem edição); revogação ≤ 60 s testada; `test:strict` verde.

### Fase 1B — Contas e painel
Auto-cadastro com escolha de papel avulso (atleta/treinador/espectador) · pedido "quero operar" · convites de vínculo · "esqueci minha senha" + fila do suporte + redefinição (§7.3) · perfil Suporte (sem conteúdo) · casca do painel + seletor de perfil + redirecionamento · gestão de vínculos · `AuditLog` visível.
**Aceite:** `test:design`, `test:components`, a11y; e2e por tipo de conta (§17).

### Fase 1C — Pool de atletas e menores
`athleteCode`, busca minimizada, atleta provisório, mesclagem, reivindicação, `PlayerCT`, responsável, consentimento `DATA`, maioridade, exportar/anonimizar (admin).
**Aceite:** testes de privacidade (menor invisível a terceiros; sobrenome abreviado; data de nascimento nunca vaza).

### Fase 3 — Torneios, agenda, acompanhamento treinador↔atleta, acesso justificado do suporte · Fase 4 — Financeiro (§15)

**Ordem entre planos:** `PLANO_DUPLAS` **Fase A** (endurecer gravação) → **1A** → **1B** → **1C**; as Fases C–H de duplas podem correr em paralelo a 1B/1C desde que **não toquem os mesmos arquivos** (alinhar por onda).

### Recorte aprovado para execução
- **Agenda adiada:** não criar calendário, eventos, horários ou inscrições nesta entrega.
- **Torneios:** pertencem a um CT; gestores do CT podem criar, renomear e arquivar torneios e associar partidas do próprio CT. `Match.tournamentName` permanece compatível com partidas legadas.
- **Acompanhamento treinador↔atleta:** o treinador solicita o vínculo; somente a conta do atleta ou um responsável ativo pode aceitar. Encerrar o vínculo remove o acesso subsequente. O vínculo permite consultar partidas/relatórios do atleta, nunca comentários ou áudio do anotador.
- **Acesso justificado do suporte:** requer justificativa, aprovação de ADMIN, validade máxima de 30 minutos e uso único; limitado a dados básicos da conta, sem partidas, relatórios, comentários ou áudio. Contas ADMIN/SUPORTE não são alvos.
- **Financeiro:** SUPORTE é o operador da cobrança da plataforma. Nesta fase, somente preparação técnica e requisitos; não integrar gateway, não processar pagamentos nem criar cobranças reais. Ativação depende das verificações de infraestrutura, gateway, e-mail, termos e tributação do §15.

---

## 15. Infra e custo
- **Vercel Hobby (não comercial) e Neon free:** a Fase 1 cabe nas cotas se mantida disciplina de consultas enxutas, cache de 60 s do `getActor` e `AuditLog` só de eventos sensíveis.
- **Antes da primeira cobrança real (Fase 4):** revisar plano do **Neon**, escolher **gateway** (webhook idempotente), **e-mail transacional**, trilha de auditoria financeira, termos e tributação com contador/jurídico.
- **Armazenamento:** áudios guardados como `Bytes` no Postgres são o maior risco do 1 GB do Neon (independe deste plano) → `[TD-XXX]`.

## 16. Padrões adotados nos pontos em aberto (ajustáveis)
- **P1 Quem cobra quem:** plataforma → CTs e atletas/treinadores avulsos; CT → seus atletas. **SUPORTE opera a cobrança da plataforma**, com trilha de auditoria; ADMIN não opera cobranças.
- **P2 Data de nascimento obrigatória** no cadastro de atleta novo (para proteger menores).
- **P3 Pedido "quero operar"** aprovado por suporte ou admin.
- **P4 Admin atual que também anota:** recebe `canOperate` (listado no dry-run).
- **P6 Retenção/revogação de consentimento** de menores: política definida com jurídico antes da 1C.
- **P7 Verificação de identidade pelo suporte** (recuperação de senha): roteiro mínimo (confirmar por outro canal; menor → responsável) registrado em `docs/`.

## 17. Testes e2e por tipo de conta (Fase 1B/1C)
Admin, suporte, gestor, treinador (CT e avulso), atleta, espectador avulso e base operacional acessam **exatamente** o que a matriz permite: fora do CT; menor × adulto; responsável; admin/suporte sem conteúdo de partida; auto-cadastro por papel avulso (sem acesso a nenhum CT; espectador sem operar); convite de vínculo (uso único, expira); código com tentativas limitadas; fluxo completo de senha via suporte (incl. link expirado/reusado); revogação ≤ 60 s; maioridade; busca sem vazar menor; sobrenome abreviado.

## 18. Riscos
| Risco | Mitigação |
|---|---|
| Engenharia social no reset de senha via suporte | Verificação externa, link 30 min/uso único, suporte não reseta admin/suporte, auditoria, alerta de volume |
| Auto-cadastro abre porta a spam/poluição do pool | Papéis avulsos sem acesso a CT; entrar em CT exige convite/aprovação; limites por IP; busca anti-duplicidade e atleta provisório (§9.4) |
| E-mail não verificado (identidade fraca) | E-mail é só login; disputas via suporte; verificação quando houver envio |
| Menores expostos em busca | Busca por código, sobrenome abreviado, testes de privacidade |
| Quebrar quem usa hoje | Claim derivado + guarda legado com `sv` + ondas + caracterização |
| Vazamento entre CTs | `can` nega por padrão; regra única §6.3; tabela exaustiva |
| Duplicados no pool | Busca antes de criar, provisórios, mesclagem |
| Conflito de arquivos entre planos | Ordem §14 + `check:r03` por onda |
| Cobrança sem plano comercial | Bloqueio de go-live do Financeiro até Vercel Pro |

## 19. Definição de pronto (Fase 1: 1A+1B+1C)
- Quatro vínculos + base operacional funcionando; CT e Clube separados; pool com código; responsável e consentimento `DATA`; maioridade e exportar/anonimizar.
- Todas as rotas de leitura e as novas passam por `can()`; gravação de pontos intacta e protegida pelo guarda legado com `sv`.
- Usuários atuais mantêm o acesso; admin/suporte sem conteúdo de partidas; revogação ≤ 60 s; `AuditLog` ativo.
- Recuperação de senha pelo suporte operando; nenhum envio de e-mail.
- `pnpm test:strict`, `test:design`, `test:components`, `test:coverage`, `spec:validate`, `lint`, `test:e2e`, `check:r03` verdes; docs atualizados.

---

## Apêndice — O que foi removido e o que ficou dependente

**Removido integralmente:** F10 (só cadastrados assistem; convite link+código por partida); F11 (fim do convite, 2 h sem anotações, avisos 30/5 min); §11 inteira (Transmissão v2); Fase 2; `P5` (renovar convite antes do 1º ponto); `match:broadcast` e `match:watch` da matriz; conceito de "convite de transmissão" e de "espectador" no glossário; consentimento `BROADCAST` (modelo, §10, Fase 1C, DoD); referências a `PLANO_TRANSMISSAO` (leitura prévia, §15); riscos "transmissão encerrando sem aviso" e "menores expostos em transmissão"; "partidas que acompanho"/"entrar com código" nas homes.

**Removido por ser exclusivo do espectador (conta somente-espectador):** a 7ª coluna da matriz, o perfil "somente-espectador" em F1, F2, F18, §6.4, §7.1, §7.4, §13, Fase 1B, §17, §18 e §19.

**Decisões já tomadas (aplicadas acima):**
1. **Auto-cadastro (F18/§7.1):** continua, com escolha de papel avulso (atleta, treinador ou espectador), sem vínculo com CT/clube.
2. **Responsável de menor (F6/§10):** mantido; a motivação "pai assiste ao jogo" volta quando a transmissão for implementada.
3. **Menores:** podem ter conta própria (sem dados sensíveis); responsável opcional. Pendente: revisão jurídica (LGPD art. 14).

**Pendências por causa da transmissão adiada:**
- **Espectador:** já opera (cria e anota partidas) como perfil avulso; só a função de **assistir** (feed, convite por link+código, "Partidas que acompanho") fica para quando a transmissão voltar.
- **Atleta/treinador avulso com `canOperate = true`:** assumi que operam já no cadastro (a matriz §5 permite criar atletas e partidas). Se preferir aprovação prévia, trocar para `false`.
- **Voltam com a transmissão:** F10, F11, §11, P5, Fase 2, consentimento `BROADCAST`, limite de 5 espectadores e a disciplina de custo do feed. A numeração original foi preservada para reentrarem nos mesmos lugares.