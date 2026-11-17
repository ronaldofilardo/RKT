# MEMORY — RKT (RKT App)

> Diário de bordo técnico · Metodologia RE-DOC (Fase 4 — Auditoria de Qualidade e Histórico)
> **Este é um dos 6 arquivos-canônico do sistema** (ver `AGENTS.md`): `PRD` · `ARCHITECTURE` · `RULES` · `DESIGN` · `TASKS` · `MEMORY`.

**Última Atualização:** 2026-11-17
**Analisado por:** engenharia reversa e implementação sobre `main`

---

## 2.43 Filtros de Afiliação, Localidade e Rankings na Aba Afiliados (/gestor) — 2026-11-17
- **Contexto & Demanda:**
  - Adição de controles de filtragem avançados na aba **Afiliados** do Painel do Gestor (`/gestor`), permitindo filtrar por afiliação, localidade e rankings esportivos.
- **Implementação & Conclusão:**
  1. **Lógica Pura de Extração e Filtragem (`affiliates-filter.logic.ts`):**
     - Extração dinâmica de opções a partir dos atletas carregados: clubes (`extractUniqueClubs`), estados/UFs (`extractUniqueStates`) e entidades de ranking (`extractUniqueRankingOrgs`).
     - Filtro de **Afiliação**: `ALL`, `WITH_CLUB`, `WITH_COACH`, `UNAFFILIATED` (avulso) e clubes específicos (`CLUB:Nome`).
     - Filtro de **Localidade**: `ALL`, `NONE` (não informada) e estados federativos (`STATE:UF`).
     - Filtro de **Rankings**: `ALL`, `WITH_RANKING`, `WITHOUT_RANKING` e entidades federativas (`ORG:CBT`, `ORG:ITF`, `ORG:WTA`, etc.).
  2. **Componentes de UI Modularizados (`affiliates-filter-bar.tsx`, `affiliates-filter-select.tsx`, `affiliates-table.tsx`):**
     - Criada a barra de filtros com input de busca integrado e selects estilizados com tokens do design system (`telemetry-elevated`, `telemetry-blue`, `[color-scheme:dark]`).
     - Botão contextual "Limpar filtros" para reset imediato em 1 clique quando qualquer critério estiver ativo.
     - Contador dinâmico: "Exibindo X de Y atletas".
     - Todos os arquivos mantidos abaixo do teto de 100 linhas (Regra R-03).
  3. **Qualidade & Testes:**
     - Testes unitários puros criados em `src/app/gestor/__tests__/affiliates-filter.test.ts` (5/5 passando).
     - Testes de renderização e interação atualizados em `src/app/gestor/__tests__/affiliates-table.test.tsx` (4/4 passando).
     - Suíte completa do gestor verde (91/91 testes aprovados).
     - Typecheck TypeScript (`tsc --noEmit`) 100% limpo.

## 2.42 Ordenação Interativa na Tabela de Atletas do Clube (/gestor) — 2026-11-17
- **Contexto & Demanda:**
  - Regularização de produção confirmada: 60 atletas devidamente listados no CT.
  - Solicitação para adicionar ordenação interativa pelas colunas **Nome** e **CPF** na tabela de Atletas do Clube em `/gestor`.
- **Implementação & Conclusão:**
  1. **Lógica de Ordenação Pura (`athlete-table-sort.logic.ts`):**
     - Criadas funções puras `sortAthleteRows` e `nextSortState` com ciclo de 3 estados (`asc` -> `desc` -> `null`/ordem natural).
     - Ordenação de Nome via `localeCompare(..., 'pt-BR')` sensível a acentuação.
     - Ordenação de CPF normalizada (dígitos numéricos de `cpf` ou `cpfLast2`), preservando atletas sem CPF ao final.
  2. **Componentes e Acessibilidade (`athlete-table.tsx`, `athlete-table-header.tsx`, `athlete-table-sort-icon.tsx`):**
     - Cabeçalho modularizado em `AthleteTableHeader` mantendo todos os arquivos abaixo do teto de 100 linhas (Regra R-03).
     - Botões de ordenação no `th` com atributos de acessibilidade `aria-sort="ascending|descending|none"`, `aria-label` e ícone SVG visual com destaque em `telemetry-volt`.
  3. **Qualidade & Testes:**
     - Testes unitários de ordenação e integração criados em `src/components/athlete/__tests__/athlete-table-sort.test.tsx` (5/5 passando).
     - Suíte de atletas (18/18 testes verdes) e gestor (85/85 testes verdes).
     - Typecheck TypeScript (`tsc --noEmit`) 100% aprovado.

## 2.41 Regularização de Banco de Dados — Governança de Menores e Responsáveis (ECA/LGPD) — 2026-11-17
- **Contexto & Demanda:**
  - Erro em produção `[API_ERROR] Error [PrismaClientKnownRequestError]: The column guardian_links.status does not exist in the current database` disparado na consulta de `/api/auth/me`.
  - Investigação de drift revelou que as 128 linhas adicionadas em `prisma/schema.prisma` no commit `e81eca0` (governança de tutela, consentimentos ECA e ativação de menores) não possuíam migration SQL versionada em `prisma/migrations/`.
- **Implementação & Conclusão:**
  1. **Execução Direta no Neon (Produção):**
     - O DDL completo e idempotente foi executado diretamente no editor de SQL do Neon pelo usuário, sanando a ausência das colunas e tabelas imediatamente.
  2. **Estrutura de Migrations Oficializada:**
     - Criada a migration `prisma/migrations/20261117210000_add_guardian_governance_and_status/migration.sql` com todos os enums (`InviteCreatorKind`, `GuardianInviteStatus`, `GuardianLinkStatus`, `ConsentAction`, `GuardianGateStatus`), inclusão de `'STATS'` em `ConsentPurpose`, campos em `Player` e `guardian_links`, e as tabelas `guardian_invites` e `consent_events` com chaves estrangeiras e índices.
     - DDL construído de forma estritamente idempotente (`IF NOT EXISTS` / `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`), garantindo total compatibilidade com execuções subsequentes de `prisma migrate deploy`.
  3. **Validação & Integridade:**
     - `npx prisma validate` executado e aprovado com sucesso.

## 2.40 Governança Canônica — Suíte Jurídica e de Privacidade Oficializada na Estrutura do Sistema — 2026-11-17
- **Contexto & Demanda:**
  - Oficialização da Suíte Canônica de Governança e Privacidade (Termos de Uso, Política de Privacidade Geral, Política de Privacidade para Menores e Termo de Consentimento do Responsável Legal) como parte integrante da estrutura de documentação do sistema RKT.
  - Correção das minutas legadas para adequação estrita ao CDC, à LGPD (Lei nº 13.709/2018), ao ECA Digital (Lei nº 15.211/2025) e às decisões de arquitetura técnica do produto.
- **Implementação & Conclusão:**
  1. **Termo de Uso da Plataforma (`docs/TERMOS_DE_USO.md`):**
     - Operação formal por BE SMART LTDA (CNPJ 55.405.487/0001-84, Curitiba/PR).
     - Delimitação de papéis e responsabilidade civil e desportiva entre CTs, treinadores autônomos e a Plataforma.
     - Bloqueio por design para treinadores particulares (proibição de cadastro de menores de 18 anos).
     - Proteção rigorosa de menores com pseudonimização compulsória (`Atleta #XXXXXX`), exclusão pontual de áudio e pool de atletas por opt-in estrito (`poolVisible`).
     - Alinhamento da versão canônica `2.0` (`CURRENT_TERMS_VERSION = '2.0'`).
  2. **Política de Privacidade Geral (`docs/POLITICA_DE_PRIVACIDADE.md`):**
     - Operação formal por BE SMART LTDA (CNPJ 55.405.487/0001-84, Curitiba/PR).
     - Canal oficial do DPO/Encarregado: `suporte@omni-sistemas.com`.
     - Delimitação dos papéis: CT como Controlador; RKT como Operador (gestão de CT) e Controlador (contas, segurança e estatísticas agregadas/anonimizadas com $N \ge 10$).
     - Atualização para a versão canônica `2.0`, alinhada à constante `CURRENT_TERMS_VERSION = '2.0'` em `terms-constants.ts`.
  3. **Política de Privacidade para Menores (`docs/POLITICA_DE_PRIVACIDADE_MENORES.md`):**
     - Estrutura bifásica: Parte 1 em linguagem simples para o atleta menor de 18 anos; Parte 2 técnica e detalhada para pais e responsáveis.
     - Bloqueio por design para treinadores autônomos (proibição de cadastro direto de menores por profissionais sem CT).
     - Tríade de consentimentos formalizada: `DATA` (gestão desportiva obrigatória), `BROADCAST` (transmissão externa opcional com anonimização mandatória) e `STATS` (pool analítico com salvaguarda $N \ge 10$).
     - Mascaramento por iniciais substituído compulsoriamente por **pseudonimização dinâmica estável** (`Atleta #XXXXXX`), eliminando risco de reidentificação por cruzamento com federações.
     - Transparência sobre captura de notas de áudio, preservação do histórico esportivo do adversário e direito à exclusão pontual de áudio (`clearAudioNote`).
     - Emancipação automática aos 18 anos (`EMANCIPATED`) com passagem de alçada civil direta ao titular.
  4. **Termo de Consentimento do Responsável Legal (`docs/TERMO_DE_CONSENTIMENTO_RESPONSAVEL.md`):**
     - Formalização do consentimento parental (Art. 14, § 1º LGPD e ECA Digital) operando em controladoria conjunta entre BE SMART LTDA e o CT.
     - Estruturação granular em 3 autorizações independentes: `DATA` (obrigatória para operar no CT), `BROADCAST` (opcional com pseudonimização `Atleta #XXXXXX`) e `STATS` (opcional com corte mínimo $N \ge 10$).
     - Inclusão mandatória de Telefone / WhatsApp do responsável, declaração formal de tutela sob as penas da lei e direito à exclusão pontual de áudios e comentários (`clearAudioNote`).
     - Alinhamento da versão canônica `2.0` (`GUARDIAN_TERMS_VERSION = '2.0'`).
  5. **Registro na Estrutura Canônica:**
     - `AGENTS.md` e `docs/MEMORY.md` atualizados para reconhecer os quatro documentos como a Suíte Oficial de Governança do sistema.
     - Rotas `/termos`, `/privacidade` e `/termos/responsavel` sincronizadas com a versão `2.0` e `signup-post.logic.ts` auditando `termsVersion: CURRENT_TERMS_VERSION`.

## 2.39 Segregação de Perfis de Responsável (Acompanhante vs. Espectador/Anotador) — 2026-11-16
- **Contexto & Demanda:**
  - O login do responsável não pode cair com perfil nem na tela de atleta (`/dashboard`), pois o responsável possui funções de acompanhamento e fiscalização totalmente distintas de um atleta.
  - A Conta Básica de Acompanhamento é desenhada do zero para que o responsável apenas acompanhe quais partidas foram criadas/anotadas do menor e por quem (sem ver placar ou funções esportivas), com botão permanente de upgrade.
  - A Conta de Espectador & Anotador habilita a criação e anotação de partidas próprias e compartilhamento de links.
- **Implementação & Conclusão:**
  1. **Resolução de Perfil no Login (`login-profile-logic.ts`, `login-response.logic.ts`, `login/route.ts`):**
     - Usuários com `guardianOfPlayerIds` e sem perfil próprio de atleta/treinador recebem `effectiveProfile = 'RESPONSAVEL'` e área `'RESPONSAVEL'`.
     - `homeForProfileString('RESPONSAVEL')` e `homeForArea('RESPONSAVEL')` redirecionam exclusivamente para `/responsavel`, eliminando o fallback indevido para `/dashboard`.
  2. **Áreas e Matriz de Acesso (`areas.ts`, `login-available-areas.logic.ts`, `me/route.ts`):**
     - Adicionada a área canônica `'RESPONSAVEL'` em `AreaCode` e mapeada para o prefixo `'/responsavel'`.
     - `listAreas` passa a receber `isGuardian` e disponibilizar a área de Responsável Legal.
  3. **Nova API de Partidas dos Dependentes (`GET /api/guardians/me/matches`):**
     - Criados `matches-read.logic.ts` e `route.ts` que buscam partidas onde os dependentes do responsável participam (`player1` ou `player2`).
     - Retorna apenas metadados de acompanhamento: quem criou (`createdByName`), quem é o anotador (`annotatorName`), formato, data/hora e status, sem expor placares ou anotações detalhadas para o acompanhante básico.
  4. **Componente de Acompanhamento de Partidas (`dependent-matches-list.tsx`, `use-guardian-matches.ts`, `/responsavel`):**
     - Criado componente dedicado para a listagem das partidas do menor, com badges de status e identificação dos treinadores/anotadores responsáveis.
     - Integrado à página `/responsavel` com hook isolado `useGuardianMatches`.
  5. **Qualidade & Regra R-03:**
     - Novos testes criados em `login-guardian-profile.test.ts`, `matches-read.logic.test.ts` e `matches/route.test.ts` (100% aprovados).
     - `pnpm typecheck` com 0 erros. Suíte de testes `jest` aprovada com 387 testes verdes.

## 2.38 Gestor — Pré-preenchimento, Imutabilidade do Responsável e Visualização da Ficha do Atleta — 2026-11-16
- **Contexto & Demanda:**
  - 1. No modal de edição de atleta pelo gestor (`EditarAtletaModal` / `EditAthleteModal`), os dados do responsável legal (`guardianName`, `guardianCpf`, `guardianPhone`, `guardianContact`) devem vir pré-preenchidos.
  - 2. Se o responsável já tiver dado consentimento ativo (`isConsented: true`), os dados do responsável devem ser imutáveis (campos desabilitados e selo de certificação ECA Digital / LGPD exibido).
  - 3. Na aba de atletas do gestor, ao clicar no nome do atleta, deve abrir o modal de visualização de dados (reaproveitando `EditAthleteModal` em modo `readOnly`, exibindo a ficha completa sem permissão de alteração).
- **Implementação & Conclusão:**
  1. **API de Atletas do Gestor (`athletes-get.logic.ts`):** Enriquecida a query para incluir dados de `guardianLinks` (vínculo ativo e confirmado) e `guardianInvites` (dados pré-cadastrados), retornando `isConsented`, `guardianName`, `guardianCpf`, `guardianPhone` e `guardianRelationship`.
  2. **Imutabilidade e Selo de Consentimento (`EditAthleteGuardianFields.tsx`):**
     - Adicionada prop `immutable?: boolean`.
     - Quando `immutable: true`, os campos do responsável tornam-se desabilitados e é renderizado o selo: `🔒 Consentimento Confirmado (Imutável)` acompanhado da mensagem explicativa de certificação sob ECA Digital e LGPD.
     - Repassado `guardianImmutable` através de `EditAthletePersonalTab` e `EditAthleteModal`.
  3. **Adaptação e Tipos no Gestor (`athlete-modal-adapter.ts`, `types.ts`, `editar-atleta-modal.tsx`):**
     - Criado helper `toAtletaFormData` para normalizar dados do `AthleteItem` com os dados do responsável.
     - `EditarAtletaModal` passa a aceitar `readOnly` e `guardianImmutable`, repassando para `EditAthleteModal`.
  4. **Clique no Nome e Modal de Visualização (`athlete-table-row.tsx`, `athletes-table.tsx`, `athletes-table-modals.tsx`):**
     - Em `AthleteTableRowData`/`AthleteTableRowActions`, adicionado callback `onView?: () => void`. Na coluna 'Nome', o nome é renderizado como botão interativo com transição de cor e sublinhado ao passar o cursor.
     - Em `AthletesTable`, adicionado estado `viewing: AthleteItem | null`, setado ao clicar no nome do atleta.
     - Em `AthletesTableModals`, quando `viewing` está ativo, renderiza `EditarAtletaModal` com `readOnly={true}` e `guardianImmutable={true}` ('Ficha do Atleta').
  5. **Qualidade & Regra R-03:**
     - Modularizado `ClubMatchItem` em `types-matches.ts`, mantendo `types.ts` com 58 linhas.
     - 100% de conformidade R-03 (0 regressões em 1.417 arquivos).
     - Testes novos criados em `athlete-view-and-immutable.test.tsx` (3/3 passando). Suíte completa de `src/app/gestor` verde (76/76 testes aprovados).
     - `pnpm typecheck` limpo com 0 erros.

## 2.37 Termo de Consentimento v2.0 e Ajustes de Governança, Transmissão e Anonimização — 2026-11-16
- **Contexto & Demanda:**
  - Resolução dos 8 achados técnicos e alinhamento do código com a minuta v2.0 do Termo de Consentimento do Responsável Legal (ECA Digital e LGPD).
  - Metodologia: STE-DEV (arquivos <= 100 linhas, tipagem estrita, suíte verde).
- **Implementação & Conclusão:**
  1. **Constante Global e Prova de Consentimento:** Criado `src/core/access/terms-constants.ts` com `CURRENT_TERMS_VERSION = '2.0'`, `GUARDIAN_TERMS_VERSION = '2.0'` e função `computeTermsContentHash`.
  2. **Anonimização Fortalecida (6 Dígitos e Sal Dinâmico):** Atualizado `src/core/access/minor-name-randomizer.ts` para ler `process.env.SPECTATOR_SALT || DEFAULT_SPECTATOR_SALT` e produzir código anonimizado de 6 caracteres (`Atleta #XXXXXX`).
  3. **Unificação Total de Projeção Pública:** Atualizado `src/services/spectator-preview.service.ts` para utilizar `randomizeMinorPlayerName`, eliminando máscaras legadas (`A***` / `A. S.`) no card de convite e unificando com o feed ao vivo.
  4. **Regras Estritas de Envolvimento de Treinadores:** Em `src/core/access/match-involvement.ts`, treinador de CT envolvido que anotou a partida é tratado como envolvido direto; treinadores externos sem vínculo de CT ou de acompanhamento visualizam atletas menores sob nome anonimizado.
  5. **Acompanhamento Parental de Partidas:** Em `src/core/access/visibility.ts` (`canWatchMatch`), o responsável legal com vínculo ativo de dependente participante tem autorização garantida para assistir a todas as partidas do menor.
  6. **Trava de Compartilhamento sem BROADCAST:** Criado `src/services/spectator-share-minor-gate.logic.ts` integrado a `createShareLink` e `getInvitePreview`: se a partida envolve atleta menor sem consentimento ativo de `BROADCAST`, a emissão e visualização de links de compartilhamento são bloqueadas (`MINOR_BROADCAST_NOT_CONSENTED`).
  7. **Interface e Rota de Aceite sem Pré-marcação:** `src/app/responsavel/convite/[token]/page.tsx` e `convite-consent-boxes.tsx` agora iniciam com checkboxes desmarcadas (`useState(false)`), exigem declaração legal de tutela civil e enviam `termsVersion: '2.0'` e `contentHash`. As rotas `/api/guardians/invites/[token]/accept` e `/api/guardians/consent` persistem esses dados em `ConsentRecord`, `ConsentEvent` e `AuditLog`.
  8. **Textos Públicos Alinhados:** Páginas `/termos` (§5) e `/privacidade` (§2 e §3) atualizadas para a nomenclatura canônica 'Nome Anonimizado (Atleta #XXXXXX)'.
  9. **Painel do Responsável e Jornada Completa de UI/UX:**
     - Criada API `GET /api/guardians/me/dependents` (`dependents-read.logic.ts`) listando atletas sob tutela com status dos consentimentos `DATA`, `BROADCAST` e `STATS`.
     - Criada página `/responsavel` (`page.tsx`, `dependent-card.tsx`, `use-guardian-dependents.ts`) com switches reativos chamando `POST /api/guardians/consent` para revogação/concessão em tempo real e atalho para `/historico`.
     - Integrado o perfil `RESPONSAVEL` no menu da aplicação (`buildMenu`, `menu-items.ts`, `menu-types.ts`, `menu-context.ts`) e rota canônica `/responsavel` em `homeForProfile` e `homeForProfileString`.
  10. **Qualidade:** 100% dos testes aprovados (40 novos testes em suítes de menu, home e dependentes, 27 testes de `/me` verdes), typecheck limpo e `pnpm check:r03` aprovado com 0 regressões em 1.402 arquivos.

## 2.36 Governança, Tutela e Privacidade de Menores de Idade em Partidas — ECA Digital & LGPD — 2026-11-15
- **Contexto & Demanda:**
  - Plano: [\docs/PLANO_PRIVACIDADE_VISIBILIDADE_MENORES_PARTIDAS_2026-11-15.md\](./PLANO_PRIVACIDADE_VISIBILIDADE_MENORES_PARTIDAS_2026-11-15.md).
  - Metodologia: **Elephant-Goldfish Model (EGM)** e STE-DEV (<= 100 linhas por arquivo).
  - Regra central de negócio:
    1. **Círculo Restrito de Visibilidade:** Nomes de atletas menores de 18 anos só são visíveis a usuários diretamente envolvidos na partida (gestor do CT, treinador vinculado, atletas em quadra e o responsável legal ativo).
    2. **Anonimização Estável e Determinística:** Se a partida for compartilhada com terceiros não envolvidos ou via links públicos (\MatchShareLink\, \/matches/convite/[token]\, espectador), os nomes de atletas menores são randomizados de forma determinística (\HMAC-SHA256(matchId + playerId)\ -> \Atleta #XXXX\).
    3. **Monotutela Estrita:** Apenas um responsável legal ativo por menor de idade.
    4. **Fluxos de Cadastro por Ator:**
       - **Treinador Particular:** Proibido por desenho de cadastrar menores (retorna 403 contextual).
       - **Gestor do Clube (\/gestor\):** Formulário coleta dados prévios do responsável (\preGuardianName\, \preGuardianCpf\, \preGuardianPhone\, \preGuardianContact\) e gera dois links ao clicar no botão:
         - *Link 1:* Ativação da conta do atleta menor (\/trocar-senha?token=...\).
         - *Link 2:* Notificação de ciência do responsável legal (\/responsavel/aviso-ativacao/[token]\) como recibo informativo somente-leitura.
       - **Menor Autocadastro:** Retido em \/aguardando-responsavel\ com aviso explícito de Monotutela Estrita e geração de convite único (\POST /api/minors/me/guardian-invite\, máx 3/dia) para aceite pelo pai/mãe/tutor em \/responsavel/convite/[token]\.
- **Implementação & Conclusão (Fases 0 a 5):**
  - **Fase 0 (Fechamento de Acessos & Permissões):** Removido \guardian:link\ de \TREINADOR\ e \SUPORTE\ em \profile-matrix.ts\. Bloqueada criação de menor por treinador (403). Eliminado auto-vínculo e bypass de suporte em \guardians/link\, \guardians/link/[id]/confirm\, \consents\ e \consents/[id]\.
  - **Fase 1 (Banco de Dados & Middleware):** Adicionados modelos \GuardianInvite\, \ConsentEvent\ e enums no \schema.prisma\. Atualizados \GuardianLink\ e \ConsentRecord\ com \onDelete: Restrict\ contra destruição de provas legais LGPD. Registradas rotas públicas e matcher no \middleware.ts\. Higienizados metadados de auditoria em \patch-handler.logic.ts\ e \udit/route.ts\.
  - **Fase 2 (Anonimização Determinística & Integração com Espectador):** Criados \minor-name-randomizer.ts\, \match-involvement.ts\ (\isDirectlyInvolvedInMatch\), \minor-name-resolver.ts\ (esolvePlayerDisplayName\) e integrados em \spectator-projection.ts\, \spectator-feed.builder.ts\, \spectator-feed.service.ts\ e \/api/spectate/[matchId]/feed/route.ts\.
  - **Fase 3 & 4 (Cadastro pelo Gestor & Modal de Duplo Link):** Criado \cadastrar-menor-responsavel-fields.tsx\ e integrado em \cadastrar-membro-form.tsx\ e \cadastrar-membro-modal.tsx\. Atualizados \AthleteCreateSchema\ (validação de CPF do responsável para menores), \thletes-create-transaction.logic.ts\ e \thletes-logic.ts\. Criado \thletes-minor-links-modal.tsx\ e tela informativa pública \src/app/responsavel/aviso-ativacao/[token]/page.tsx\.
  - **Fase 5 (Autocadastro do Menor & Monotutela):** Criada API \POST /api/minors/me/guardian-invite\ (com rate limit e revogação de pendências anteriores), página \src/app/aguardando-responsavel/page.tsx\, rota de aceite \POST /api/guardians/invites/[token]/accept\ e página \src/app/responsavel/convite/[token]/page.tsx\.
  - **Validação de Qualidade:** \pnpm check:r03\ aprovado com 0 regressões; \pnpm typecheck\ (tsc) com 0 erros; 15/15 suítes de testes de \/gestor\ passaram 100% (73/73 testes).
  - **Ajuste de Fluxo (Gestor Atletas & Duplo Link):**
    - Corrigido botão "Novo Atleta" no Dashboard do Gestor (`dashboard.tsx`) para invocar `CadastrarMembroModal` com tipo `ATLETA`.
    - Ao informar data de nascimento indicando menor de 18 anos (`isMinor`), o formulário abre os campos obrigatórios do responsável legal (`preGuardianName`, `preGuardianCpf`, `preGuardianPhone`, `preGuardianContact`), persistindo no banco (`GuardianInvite`) para validação cruzada.
    - Na tabela de atletas (`athlete-table-row.tsx`), adicionado badge visual explicativo `Menor (Tutela)` na coluna de idade.
    - Ao clicar no botão "Link" na linha do menor, abre-se o modal com duplo link: Link 1 (ativação da conta do menor) e Link 2 (aviso de ciência ao responsável legal em tela pública informativa somente-leitura).

---

## 2.35 Fase D dos Filtros de Partidas — Círculo Completo e Cartazes no Histórico (TD-062) — 2026-11-12
- **Contexto & Demanda:**
  - Plano: [`docs/archive/PLANO_CORRECAO_FILTROS_PARTIDAS_2026-11-11.md`](./archive/PLANO_CORRECAO_FILTROS_PARTIDAS_2026-11-11.md) e [`docs/TASKS.md`](./TASKS.md) (item TD-062).
  - Metodologia: **Elephant-Goldfish Model (EGM)**.
  - Problema analisado: confronto criado pelo Gestor do Clube A com escopo "Compartilhada no círculo" entre Atleta X (do Clube A) e Atleta Y (do Treinador Particular B), com Treinador C designado para anotar. O Gestor A via a partida, mas Atleta X, Atleta Y e Treinador B não viam em "Minhas Partidas" (`/historico`).
  - Decisão consolidada: **O Cartaz pertence ao círculo e é visível a todos os envolvidos** em *Minhas Partidas*. As anotações são 100% isoladas. Ao clicar em *"Anotar minha versão"*, cria-se a anotação derivada exclusiva do usuário, e o cartaz é substituído por sua anotação no Histórico sem duplicidade.
- **Implementação & Conclusão:**
  - **D.1 (Descoberta por Treinador Particular):** em `src/core/access/match-event-visibility.ts`, `isParticipantOrRelated` inclui `actor.followedPlayerIds?.some(...)`, permitindo que treinadores particulares de atletas participantes descubram cartazes em `PRIVATE_CLUB`, `PRIVATE_COACH` e `PRIVATE_PLAYERS`.
  - **D.2 (Cartazes do Círculo em Minhas Partidas):** criado `src/services/match-repository-circle.logic.ts` com `buildCircleTemplateCondition` e integrado em `src/services/match-repository-where.logic.ts`. Traz cartazes (`isTemplate: true`) onde o usuário é atleta participante (`athletePlayerId`), treinador de participante (`followedPlayerIds`) ou responsável legal (`guardianOfPlayerIds`), com salvaguarda `annotations: { none: { createdByUserId: user.id, deletedAt: null, state: { not: 'CANCELLED' } } }`.
  - **D.3 (Escopo de Gestor por Área Ativa):** em `src/app/api/matches/matches-get.logic.ts`, `resolveScope` agora exige `actor.activeArea === 'GESTOR'` para carregar `ctMemberUserIds`, impedindo poluição do histórico pessoal do gestor quando atua como treinador ou em área pessoal.
  - **D.4 (Metadados do Criador da Partida):** em `src/services/match-repository-select.data.ts` (`BASE_MATCH_SELECT`), adicionados `createdByUser { id, name }` e `ct { id, name }`, e exposto `createdByName` da partida em `matches-get.logic.ts`.
  - **D.5 (Qualidade & Regra R-03):** `pnpm check:r03` aprovado com 0 regressões (todos os arquivos novos/editados $\le 100$ linhas); `pnpm typecheck` (tsc) com 0 erros; `pnpm test:design` 100% verde (26/26); suítes de repositório e visibilidade atualizadas e 100% verdes.

---

## 2.34 Revisão de Menus, Rotas e Blindagem de Sessão (A0.19) — 2026-11-12
- **Contexto & Demanda:**
  - Plano: [`docs/archive/PLANO_CORRECAO_MENUS_ROTAS_E_SESSAO_2026-11-12.md`](./archive/PLANO_CORRECAO_MENUS_ROTAS_E_SESSAO_2026-11-12.md).
  - Metodologia: **Elephant-Goldfish Model (EGM)** com separação entre planejamento de contexto longo (The Elephant) e auditoria cega de riscos/regressões (The Goldfish).
- **Implementação & Conclusão (Fases 1 a 5):**
  - **Fase 1 (Blindagem de Sessão):** `redirectToLogin` desacoplado de logout destrutivo e remoção de `exit=1` (`auth-client-storage.ts`). Módulo puro de hidratação `auth-session-hydration.logic.ts` com chamada a `/api/auth/me` para repovoar `sessionStorage` em novas abas/PWA. `accessService.ts` modularizado (`ACTOR_USER_SELECT` em `access-select.logic.ts`) e captura de falhas de conexão em `access-error.logic.ts` + `withAccessHandler` retornando 503 com `Retry-After`, eliminando falso 401. `useDashboardState`, `use-dashboard-matches-fetch`, `useAtletasPage` e `useAdminPage` atualizados.
  - **Fase 2 (Correção de "Aguardando"):** `src/app/aguardandoanotador/page.tsx` renderiza `<DashboardPage />` quando `!matchId`, ativando nativamente a subvisão `pending` sem loops ou redirects. `isDashboardRoute` normalizado com `normalizeDashboardPath` em `dashboard-menu.logic.ts` suportando todas as áreas ativas.
  - **Fase 3 (Menus Completos):** Início, Histórico, Partidas Anotadas e Ao Vivo adicionados para Treinador e Atleta (`menu-items.ts` fatiado com `menu-factory.logic.ts`). Adicionados atalhos para Suporte e Espectador em `menu.ts`.
  - **Fase 4 (Normalização de URLs de Gestor & UI TopBar):** `appPath` trata caminhos `/gestor` e query params sem duplicar rota. `DashboardTopBar.tsx` integrado com `dashboard-topbar.logic.ts`, ocultando a seta voltar para Gestor e Suporte via `effectiveArea`.
  - **Fase 5 (Validação):** `check:r03` aprovado com 0 regressões; `typecheck` (tsc) com 0 erros; `test:design` 100% verde (26/26 testes); suíte de testes unitários de menu, rotas e autenticação 100% verde (94/94 testes).

---

## 2.33 Isolamento de Anotações por Anotador (A0.18) — 2026-11-11
- **Contexto & Demanda:**
  - Plano: `docs/archive/PLANO_ISOLAMENTO_ANOTACOES_POR_ANOTADOR_2026-11-11.md`.
  - Uma mesma partida (`[12421]`) pode receber N anotadores independentes (ex.: treinador designado vai até o fim; pai do atleta 2 sai antes do término), com isolamento absoluto de leitura e escrita entre anotadores e visão consolidada agrupada para o Gestor do clube.
- **Modelagem & Banco:**
  - `enum MatchEventScope` (`PUBLIC`, `PRIVATE_CLUB`, `PRIVATE_COACH`, `PRIVATE_PLAYERS`, `PRIVATE_PERSONAL`) + `Match.isTemplate`, `Match.eventScope`, `Match.isOfficialClubAnnotation`.
  - Migration `20261111000000_add_match_event_scope_and_template` com backfill legado e índice único parcial `Match_unique_active_annotation_per_user_idx`.
- **Domínio & Backend:**
  - `src/core/access/match-event-visibility.ts` (`canDiscoverMatchTemplate`) separa descoberta do cartaz (público ou círculo privado: clube, treinador particular, atletas envolvidos e responsáveis legais de menores) da leitura/escrita da anotação.
  - `src/core/access/visibility.ts`: `canReadMatch`, `canAnnotateMatch`, `canReadMatchComments` e `canWatchMatch` fechados ao dono (`createdByUserId`) e ao Gestor ativo do CT (com gancho `allowParticipantOfficialRead` preparado para atletas no futuro).
  - `src/services/match-resolve-annotation.logic.ts`, `match-template-create.logic.ts`, `match-available.logic.ts`, `POST /api/matches/[id]/annotate` e `GET /api/matches/available`.
  - Fechamento de `listMatches` (`match-repository-where.logic.ts`), `point-route-permission.logic.ts`, `point/[pointId]/point-ownership.logic.ts`, `state-route-guards.logic.ts`, `finish/route.ts`, `sessions/route.ts`, `matches/[id]/route.ts` e `spectate/[matchId]/feed/route.ts`.
  - Anti-duplicidade por usuário (`findDuplicateMatch`) + detecção de cartaz disponível (`TEMPLATE_AVAILABLE`).
- **Painel do Gestor & Frontend:**
  - `GET /api/gestor/matches` (`gestor-matches.logic.ts`) retorna todas as anotações por partida-mãe com `pointCount` e `isDesignatedAnnotator`; designação sempre atua no cartaz (`sourceMatchId ?? matchId`).
  - `ClubMatchesTable` + `ClubMatchGroupHeader` + `ClubMatchRow` exibem grupos expansíveis por partida, badge `Designado (Oficial)`, contador de pontos e filtro `Somente designado`.
  - `/match/new` (`MatchVisibilityField`) com 3 opções (`Privada`, `Compartilhada no círculo`, `Pública`), `/partidas-publicas` com aba `Meu Círculo`, e `/scoring` (`useScoringLifecycleEffects`) com resolvedor automático de cartaz.
- **Pendência operacional:** executar `pnpm db:migrate:deploy` e `pnpm db:test:push` fora do sandbox para aplicar a migration no PostgreSQL local (`localhost:5432`).

---

## 2.32 Notificações In-App, Mural do Treinador e Gestão de Partidas do Clube (A0.16/A0.17) — 2026-11-10
- **Contexto & Demanda:**
  - S3: badges in-app no dashboard avisam treinadores e atletas sobre cartazes de partidas públicas relevantes no pool.
  - S4: Mural do Treinador exibe avisos ativos de designação de anotação feitas pelo gestor do clube.
  - Painel do Gestor: botão "Nova Partida" navega para o fluxo canônico `/match/new`; ação de "Indicar Anotador" (`IndicarAnotadorModal`) para partidas já criadas; partidas sem anotador são listadas normalmente.
  - Fix de Estabilidade de Sessão: eliminação do bug de logout cíclico imediato ao entrar no dashboard como treinador.
- **Modelagem & Banco de Dados:**
  - `Match.assignedCoachId` referenciando `User.id` (`onDelete: SetNull`).
  - Model `Notification` (`id`, `recipientId`, `type`, `payload`, `readAt`, `createdAt`, `expiresAt`) com enum `NotificationType` (`POOL_MATCH_WITH_MY_ATHLETE`, `POOL_MATCH_AVAILABLE`, `ASSIGNED_TO_ANNOTATE`).
  - Migration `20261110000000_add_notification_assigned_coach` executada no banco local (`pnpm db:migrate:deploy`) e teste (`pnpm db:test:push`).
- **Backend:**
  - Notificações de pool disparadas na criação de templates em `src/services/notification-create.logic.ts`.
  - Designação de treinador por gestor em `src/services/match-assign.logic.ts`, rotas `/api/matches/pool/[templateId]/assign` e `/api/gestor/matches/[id]/assign`.
  - Endpoints de leitura: `GET /api/notifications/count`, `GET /api/notifications/assigned`, `PATCH /api/notifications/[id]/read`, `PATCH /api/notifications/read-all`.
  - `/api/gestor/matches`: suporte a `assignedCoach`, listagem correta de partidas criadas com ou sem anotador designado.
- **Frontend & Sessão:**
  - `AssignedNotifSection` e `NotifBadge` integrados no `DashboardHomeSection` para o perfil de treinador.
  - Gestor: `ClubMatchesTable` e `ClubMatchRow` com botão canônico para `/match/new` e modal de indicação (`IndicarAnotadorModal`).
  - Correção de persistência de sessão: `writeToSessionOnly` e `clearAuthState` agora sincronizam e limpam `access_token` no `sessionStorage`, eliminando tokens expirados residuais que disparavam `redirectToLogin` indevidamente.
- **Validação:**
  - `pnpm typecheck`: 0 erros.
  - `pnpm test:design`: 26/26 aprovados.
  - Suítes de guards, gestor, tabela de partidas e notificações 100% verdes.
  - Conformidade R-03: todos os arquivos novos e modificados $\le 100$ linhas cruas.

---

## 2.31 Pool de Partidas Públicas e Nickname de Atleta (A0.13/A0.14) — 2026-11-09
- **Contexto & Demanda:**
  - S1: a mesma partida real é anotada por vários usuários; faltava um cartaz público compartilhável sem compartilhar `PointLog`.
  - S2: atletas não tinham apelido legível nem controle de exposição em buscas (o `athleteCode` é opaco).
  - Plano: `docs/archive/PLANO_POOL_PARTIDAS_PUBLICAS_E_NICKNAME_ATLETA_2026-11-09.md`.
- **Modelagem (sem tabela nova):**
  - `Match.isPublicTemplate` + `Match.sourceMatchId` (auto-relação `MatchAnnotations`, `onDelete: SetNull`), índices `Match_isPublicTemplate_idx` e `Match_sourceMatchId_idx`.
  - `Player.nickname @unique`, `Player.poolVisible` (default `false`), `Player.poolVisibleSince`; `ConsentPurpose.POOL_VISIBILITY`.
  - Migrations: `20261109000000_add_public_match_template` e `20261109010000_add_player_nickname_pool`. Índices criados como índices plenos (não parciais) para evitar drift entre o Prisma schema e o histórico de migrations.
- **Backend S1:**
  - `match-template-create.logic.ts`: `createPublicTemplate` (exige `ConsentRecord DATA` para menor) e `createAnnotationFromTemplate` (privada `PLAYERS_ONLY`, `SCHEDULED`, 409 `ALREADY_ANNOTATING`).
  - `match-template-propagation.logic.ts`: `PROPAGABLE_FIELDS` + `propagateTemplateUpdate` (só `SCHEDULED`/`IN_PROGRESS`). `PATCH /api/matches/[id]` propaga quando o alvo é template.
  - `match-template-close.logic.ts`: `DELETE /api/matches/[id]/template` (soft-delete, só o criador).
  - `GET /api/matches/pool` (cursor, máximo 50, `scheduledAt DESC NULLS LAST`, `annotationCount`) e `POST /api/matches/pool/[templateId]/annotate` (201 `{ matchId }`).
  - `POST /api/matches` despacha `isPublicTemplate` / `sourceMatchId` antes do fluxo padrão.
  - Fase 4: `listMatches` aceita `MatchListScope` (`unrestricted` para Admin/Suporte; `ctMemberUserIds` para Gestor), oculta templates da listagem privada e corrigiu o caso de `OR: []` (que zerava resultados quando não havia condições).
- **Backend S2:**
  - Core puro `src/core/athlete/nickname.ts` (`validateNickname`/`normalizeNickname`).
  - `setPlayerPoolVisibility` + `PATCH /api/players/[id]/pool-visibility`; regra pura `evaluatePoolVisibility` (dono ou Admin/Suporte; menor exige consentimento).
  - `listPoolPlayers`/`toPoolPlayerView` expõem `nickname` somente com opt-in e nunca para menores (mesma máscara do `athleteCode`).
  - `createPlayer`/`updatePlayer` normalizam nickname e mapeiam `P2002 → 409 NICKNAME_TAKEN`; `GET /api/players/[id]` devolve `userId`, `nickname` e `poolVisible`, e o PUT reconhece o dono por `Player.userId`.
- **Frontend:**
  - `/match/new`: `isPublicTemplate` no estado/payload; seletor de visibilidade virou rádio Privada/Pública (`MatchVisibilityField`).
  - `/partidas-publicas`: hook `usePublicMatchPool` (paginação + busca local), `PublicMatchCard` com "Anotar esta partida" e continuidade em 409; link `📡 Partidas Públicas` no menu de Operação/Treinador e matcher no middleware.
  - Gestor → Partidas do Clube: agrupamento por template + filtro por membro anotador (`group-club-matches.logic.ts`); `/api/gestor/matches` inclui `sourceMatchId`/`sourceMatch`.
  - `/dados-pessoais` passou a ser uma página real com "Perfil Público" (nickname + opt-in, aviso para menores); `NewAthleteModal` ganhou campo de apelido e o seletor de atletas mostra `@nickname`.
- **Validação:** `tsc --noEmit` 0 erros · `next lint` sem novos avisos · suítes novas de template, nickname, pool, visibilidade e gestor 100% verdes · suítes de match/new, matchService, matchRepository e `/api/matches` 24/24 verdes (279 testes) · `check:r03` sem violações nos arquivos novos/modificados.
- **Pendências:** executar as duas migrations localmente; E2E `08-public-match-pool.spec.ts`; fluxo de consentimento de menores (A0.8). `check:r03` segue vermelho por 5 arquivos pré-existentes fora do baseline (`timeline-*.tsx`, `timeline-set-results-points.logic.ts`, `point-ball-context.logic.ts`), não tocados por esta entrega.

---

## 2.30 Segregação de Atletas de Treinador por Contexto (Clube vs Particular) — 2026-11-08
- **Contexto & Demanda:**
  - Treinadores vinculados a um clube e que também atendem atletas particulares viam atletas misturados.
  - Ao alternar a opção de contexto (Clube vs Atuação Particular no `ContextSwitcher`), os atletas exibidos em "Meus Atletas" (`/atletas`) e no seletor de partidas (`/match/new`) devem ser estritamente segregados considerando se o contexto ativo é do clube ou particular.
- **Implementação:**
  1. **Segregação no Backend (`access-actor.logic.ts` e `route.ts` de `/api/auth/me`):**
     - `filterFollowedPlayers` exportado e integrado em `GET /api/auth/me`: a resposta agora entrega `followedPlayerIds` filtrado estritamente pelo contexto da sessão (`user.contextId` e `user.activeArea`).
     - No contexto de CT (`TREINADOR_CLUBE`), retorna apenas atletas com vínculo ativo naquele CT.
     - No contexto `PARTICULAR` (`TREINADOR_AVULSO`), retorna apenas atletas associados ao treinador que não pertencem a nenhum dos CTs ativos do treinador.
  2. **Consulta Segregada de Atletas (`player-service-queries.logic.ts` e `GET /api/players`):**
     - `listPlayers` atualizado para aceitar `followedPlayerIds`. Quando fornecido, filtra com `id: { in: followedPlayerIds }`, garantindo que consultas em `/atletas` exibam estritamente os atletas do contexto ativo.
     - Preservada retrocompatibilidade quando `followedPlayerIds` não for enviado.
  3. **UI de Atletas e Contexto (`use-atletas-context.ts`, `AthleteSearchHeader.tsx`, `page.tsx`):**
     - Criado hook `useAtletasContext` (50L, R-03) que carrega o contexto ativo (`activeContextId`, `availableContexts`, `ctName`, `isParticular`).
     - `AthleteSearchHeader` integrado com `ContextSwitcher`: permite ao treinador alternar entre os clubes aos quais é vinculado e sua atuação particular diretamente na tela de atletas.
     - Título dinâmico: exibe "Meus Atletas · [Nome do Clube]" ou "Meus Atletas (Particulares)".
     - `NewAthleteModal` passa `ctId: isParticular ? null : activeContextId`, garantindo que novos atletas cadastrados herdem o vínculo correto do contexto selecionado.
- **Validação:**
  - Teste unitário dedicado: `src/services/__tests__/coach-athlete-context-segregation.test.ts` (PASS).
  - Suítes de `atletas`, `auth/me`, `players`: 15/15 suítes passaram (127/127 testes).
  - TypeScript: `pnpm typecheck` com 0 erros.
  - Limite de linhas (R-03): todos os arquivos modificados rigorosamente <= 90 linhas.

---

## 2.29 Reorganização do Dashboard: Partidas em 'Minhas Partidas', remoção de 'Nova Partida' do Header e 'Relatórios' direto para Timelines — 2026-11-08
- **Contexto & Demanda:**
  1. A lista de partidas (Pausadas, Em Andamento, Recentes) deve ser movida da tela inicial (`/dashboard`) para dentro de 'Minhas Partidas' (`/historico` / view `history`).
  2. Remover do header o botão '+ Nova Partida' (`DashboardTopBar`).
  3. 'Relatórios' no menu e no ícone da tela inicial deixa de ser "Em breve" e passa a ser a listagem de timelines de todas as partidas finalizadas do usuário.
- **Implementação:**
  1. **Header limpo (`DashboardTopBar.tsx`, `DashboardChrome.tsx`):**
     - Removido o botão `+ Nova Partida` do topo superior.
     - `onNewMatch` tornado opcional em `DashboardTopBarProps`.
  2. **Tela Inicial e Atalhos (`dashboard-home-section.tsx`, `dashboard-shortcuts.logic.ts`, `dashboard-shortcut-card.tsx`):**
     - A tela inicial (`Início`) agora renderiza apenas a saudação e os atalhos rápidos em grid (`ShortcutCard`), removendo a renderização direta de listas de partidas.
     - Cartão 'Minhas Partidas' aponta para `view: 'history'`.
     - Cartão 'Relatórios' ativo (sem "Em breve"), apontando para `view: 'reports'`.
     - R-03 respeitado: `dashboard-home-section.tsx` modularizado (56L).
  3. **Minhas Partidas (`DashboardViewRouter.tsx`, `dashboard-match-list-section.tsx`):**
     - View `history` (`/historico`) concentra a visualização completa de todas as partidas (`allMatches`) com ações de retomar, excluir e ver relatório.
  4. **Relatórios (`DashboardViewRouter.tsx`, `/relatorios`, `useDashboardNavigation.ts`, `menu-items.ts`):**
     - View `reports` filtra partidas com estado `FINISHED` (`finishedMatches`).
     - Ações de clique direcionam para `/match/[id]/report?tab=timeline`, exibindo diretamente a timeline da partida finalizada.
     - Nova rota `src/app/relatorios/page.tsx` monta o `DashboardPage` na visão de relatórios.
     - Itens de menu habilitados para perfil de treinador e atleta.
  5. **Resolução de Views em Rotas Prefixadas (`dashboard-view.logic.ts`):**
     - O `resolveDashboardView` avaliava apenas `pathname.startsWith('/historico')` direto, falhando quando o usuário acessava rotas prefixadas por área (como `/clube/treinador/historico` ou `/atleta/relatorios`) e caindo indevidamente no `view: 'dashboard'` (tela inicial com atalhos).
     - Criado helper `normalizeDashboardPath` que remove prefixos de área conhecidos (`AREA_PREFIXES`) antes de resolver a view.
     - Suporte em middleware para rotas de relatórios (`/relatorios/:path*`).
  6. **Acessibilidade e Guardas:**
     - `dashboard-shortcut-card.tsx` ajustado com tags semânticas, `role="button"` e handlers de teclado acessíveis (`Enter` / `Space`).
     - Atualizados testes de integração, rotas prefixadas e snapshots de componentes.
- **Validação:**
  - `pnpm typecheck`: 0 erros.
  - `pnpm test src/app/dashboard`: 18/18 suítes passaram, 86/86 testes passaram.
  - `pnpm test src/core/access/__tests__/menu.test.ts`: 21/21 passaram.
  - `pnpm test src/__tests__/area-links.guard.test.ts`: 4/4 passaram.
  - `check-r03`: todos os arquivos novos/modificados rigorosamente <= 100 linhas.

---

## 2.28 Timeline do /report: fusão de "Fim do Game" + "Início do Tie break" (Set Pro 8) — 2026-11-07
- **Contexto & Demanda:**
  - No formato **Set Profissional até 8 games** (`PRO_SET_8`), a timeline exibia duas linhas consecutivas ao entrar no tiebreak: “Fim do Game” e “Início do Tie break”, ambas repetindo o mesmo placar (9x8) e a mesma informação de placar final.
  - O tiebreak começa em **9x9** (`getTiebreakAtForFormat('PRO_SET_8') = 9`), mas a linha mostrava o placar anterior ao último game (9x8).
- **Causa Raiz:**
  1. `timeline-rows.tsx` renderizava **dois** `GameEndRow` quando `gameEnd.tiebreakStart` era verdadeiro, ambos com `p.gamesScore`.
  2. `TimelinePoint.gamesScore` é o placar **antes** do ponto (`stateBefore`). No ponto que abre o tiebreak ele vale 9x8 e o game decisivo ainda não foi contabilizado — somar +1 aos dois lados (comportamento antigo) gerava 10x9.
- **Implementação:**
  1. `timeline-rows.tsx`: entrada do tiebreak passa a renderizar **uma única** `GameEndRow` com o placar de `gameEnd.gameFinalScore`.
  2. `timeline-game-end.ts`: no `tbEntry`, o placar final do set é `current.gamesScore` **+1 apenas ao vencedor do último game** (9x8 → 9x9; 5x6 → 6x6 em sets regulares).
  3. `timeline-game-end-row.tsx`: rótulo em duas linhas (“Fim do Game” / “Início do Tie break”, este em `telemetry-blue`), badge “Tie break” somado ao badge de quebra de saque e supressão do texto redundante “· Placar final” nessa linha fundida. `aria-label` atualizado (“Fim do game e início do tie break: 9x9”).
- **Testes:**
  - `timeline-rows.game-end.test.tsx`: +2 casos (helper retorna 9x9 na entrada do tiebreak; `SetGroup` renderiza **uma só** linha com 9x9, “Fim do Game”, “Início do Tie break” e “Quebra de saque”). 8/8 PASS.
- **Validação:** `tsc --noEmit` 0 erros · ESLint 0 avisos/erros · `check:r03` OK (0 regressões; `timeline-rows.tsx` 94L) · suítes `src/components/scoring/__tests__` + `src/app/match` 133/135 (2 falhas pré-existentes em `MatchTimelineView.setResults` e `MatchTimelineView.doubles`, confirmadas em `HEAD` antes da mudança).

---

## 2.27 UI da Transmissão Compartilhada e do Gestor (Visual) — 2026-11-07
- **Contexto & Demanda:**
  - Plano: `docs/archive/PLANO_UI_TRANSMISSAO_COMPARTILHADA_E_GESTOR_2026-11-07.md`.
  - Objetivo: melhorar clareza e hierarquia visual da tela de transmissão (link compartilhado e popup Gestor → Partidas → Ver Partida), aproximando da referência visual da landing page (RKT-LP `MatchReplay`), sem alterar dados, payloads, feed, regras ou estados funcionais.
- **Mudança exclusivamente visual (sem alteração de dados/regras):**
  1. **Header (`SpectatorHeader`):** título centralizado (lado 1 × lado 2 com destaque volt), formato do jogo, badges de status harmonizados com tokens Telemetry (ao vivo/sem sinal/pausada/encerrada/aguardando) com indicador pulsante, botão “Voltar” compacto; `hideBack` para superfícies embutidas.
  2. **Placar (`SpectatorScoreboard`):** layout broadcast (nomes acima, scores grandes/tabulares, centro “Final” ou atualização), destaque do vencedor em `telemetry-volt`, placar do game em andamento (Pts/TB) com indicação de sacador; mantém `buildSpectatorScoreboardProps` e dados reais do feed. Sticky preservado.
  3. **Último ponto (`SpectatorLastPointBanner`):** faixa compacta alinhada (rótulo à esquerda, evento à direita) com indicador pulsante ao vivo.
  4. **Timeline (`SpectatorTimeline`):** coluna fixa de score/game, iniciais do vencedor, alinhamento por lado (esquerda/direita), chips de detalhe com tokens Telemetry; preserva marcadores/correções, ordem e legenda. Extrações R-03: `spectator-timeline-badge.logic.ts`, `SpectatorDetailLegend.tsx`, `spectator-timeline-initials.logic.ts`.
  5. **Abas/Status (`SpectatorTabs`, `SpectatorStatusBanner`):** abas com destaque volt; banners NO_SIGNAL/PAUSED/OFFLINE harmonizados com tokens Telemetry e textos/semântica preservados.
  6. **Superfícies:** rota compartilhada (`/matches/acompanhar/[matchId]`) e janela flutuante do Gestor (via `SpectatorLiveContent`/`FloatingSpectatorWindow`, `hideBack`) usam o mesmo conteúdo visual; destinos funcionais (finalizada → relatório no Gestor) preservados.
  7. **CSS:** `@keyframes pillar-pulse` em `src/app/globals.css` (com `prefers-reduced-motion` já coberto globalmente).
- **Restrições respeitadas:** nenhum campo/evento/aviso/marcador/controle removido; placar/timeline continuam do feed real; sem dados/loop/comportamento demonstrativo da landing; fluxo de convite inalterado.
- **Validação:** `pnpm typecheck` 0 erros · `pnpm lint` 0 avisos · `pnpm test:design` 3/3 (26) · `pnpm check:r03` OK (0 regressões) · testes spectator/club-match 20/20 suites, 83/83 testes (atualizado `SpectatorGuestScreen.test.tsx` para refletir o novo layout visual, mantendo asserções funcionais).

---

## 2.26 Padronização de Cores de Nomes em Jogos de Duplas (/scoring, /report e Dashboard) — 2026-11-07
- **Contexto & Demanda:**
  - O ambiente `/scoring` é a fonte da verdade visual: em partidas de duplas, os dois atletas da Dupla 1 compartilham o status/cor de Jogador 1, e os dois atletas da Dupla 2 compartilham o status/cor de Jogador 2.
  - Nas telas de `/report` (Estatísticas Avançadas e Timeline) e no card do Dashboard, partidas de duplas em andamento não destacavam a dupla sacadora, omitiam o indicador de saque (🎾) no Dashboard quando o parceiro sacava, e não identificavam o campeão de duplas caso o `winnerId` fosse do parceiro.
- **Implementação:**
  1. **Resolução de Cores (`src/components/ui/player-color.context.tsx`):**
     - `resolvePlayerColors` expandido para reconhecer `matchType === 'DOUBLES'`, `player1Partner` e `player2Partner`.
     - Em partidas finalizadas (`FINISHED`), identifica vitória da Dupla 1 ou Dupla 2 tanto por titular quanto por parceiro, aplicando `MATCH_WINNER_TEXT` (`text-emerald-800 dark:text-telemetry-volt font-black`) e borda `border-l-telemetry-volt`.
     - Em partidas em andamento (`IN_PROGRESS`), alinha-se ao `/scoring`: a dupla no saque recebe a cor em volt e a recebedora permanece em branco neutro.
  2. **Dashboard Card (`src/components/dashboard/use-match-card-data.ts` e `MatchCard.tsx`):**
     - `currentServer` em duplas agora resolve `player1Partner.id` para `player1` e `player2Partner.id` para `player2`.
     - `isWinnerP1` e `isWinnerP2` reconhecem o `winnerId` do parceiro em duplas.
     - `match-card-score-grid.tsx`: em partidas em andamento, a equipe sacadora (simples ou duplas) recebe o estilo de destaque `text-emerald-800 dark:text-telemetry-volt font-black` junto ao ícone de saque 🎾.
  3. **Timeline e Estatísticas Avançadas:**
     - Na Timeline, as células SAC e VENC e a borda lateral esquerda de cada linha do ponto acompanham dinamicamente a dupla correspondente.
     - Em Estatísticas Avançadas, tanto os blocos gerais quanto o detalhamento individual de atletas de duplas (`DoublesPlayerBreakdownSection`) mantêm a equivalência de cor da respectiva dupla.
- **Validação:**
  - `pnpm typecheck`: 0 erros.
  - `pnpm check:r03`: 0 regressões.
  - Nova suíte de testes: `src/components/ui/__tests__/player-color.context.test.ts` (6/6 PASS).

---

## 2.25 R-03: congelamento do baseline e reparo do CI (pnpm 10) — 2026-11-07
- **Contexto & Problema:**
  - `pnpm check:r03` estava vermelho com **38 violações** (>100 linhas) em arquivos de produção, todas pré-existentes; `scripts/r03-baseline.json` estava `{}` (zerado), ou seja, o ratchet não congelava nada e qualquer crescimento passava despercebido até estourar o limite.
  - O CI (`RKT quality`) falhava **antes** do R-03: `actions/setup-node@v4` abortava com `ERROR packages field missing or empty` — `pnpm-workspace.yaml` contém apenas `allowBuilds` (sem `packages`) e o workflow fixava **pnpm 9**, enquanto o ambiente local usa **pnpm 10.14.0**. Resultado: nenhum gate de qualidade rodava no GitHub Actions há 12+ dias.
- **Mitigação aplicada (Fase 0):**
  1. `node scripts/check-r03-line-limit.mjs --update` → baseline regravado com as **38 violações conhecidas** (2 isentas por `ste-exception R-03`). Check volta a `exit 0` e volta a proteger: falha em arquivo novo >100L, em crescimento de arquivo do baseline e em baseline obsoleto.
  2. `.github/workflows/quality.yml`: `pnpm/action-setup` `version: 9` → `10` (compatível com `lockfileVersion: '9.0'` e com o `pnpm-workspace.yaml`).
  3. **Regra de ouro:** `--update` só com diff revisado; ampliar o baseline exige justificativa.
- **Plano de drenagem (5 fases):** Fase 1 = 13 arquivos 101–110L · Fase 2 = 17 arquivos 111–140L (Characterization-First em rotas/hooks) · Fase 3 = 8 monólitos 142–246L (uma onda por arquivo) · Fase 4 = exceções pontuais `ste-exception R-03` registradas em `docs/ste-dev.md` · Fase 5 = baseline de volta a `{}`. Ao corrigir um arquivo do baseline, rodar `--update` **no mesmo commit** (senão: `BASELINE obsoleto`).
- **Fase 1 concluída (2026-11-07) — 13 arquivos 101–110L → ≤96L, baseline 38 → 25:**
  - `scoring-page-play-area.tsx` 101→94 · `useScoringPageDerived.ts` 103→95 · `Game2ServerSelectionModal.tsx` 106→92 · `MatchNewModals.tsx` 110→92 · `NewAthleteModal.tsx` 103→92 · `match-card-score-table.tsx` 102→86 · `use-match-card-data.ts` 103→92 · `AthleteOriginSection.tsx` 102→90 · `useAtletasPage.ts` 102→90 · `middleware-auth.logic.ts` 106→95 (blocos de rejeição unificados) · `auth/me/route.ts` 106→78 (`ME_USER_SELECT` em `me-select.logic.ts`) · `gestor/athletes-link.logic.ts` 105→57 (transação em `athletes-link-player.logic.ts`) · `gestor/athletes/[id]/route.ts` 107→19 (handler em `patch-handler.logic.ts`).
  - 3 arquivos novos ≤100L; nenhum export/contrato alterado; `--update` no mesmo commit.
- **Fase 2 concluída (2026-11-07) — 17 arquivos 111–140L → ≤96L, baseline 25 → 8:**
  - scoring: `ScoringPlayArea` 133→87 (faixa No-Ad → `scoring-deciding-point-banner.tsx`), `scoring-session-modals` 135→66 (modais ativos → `scoring-session-active-modals.tsx`; derivação Game 2 → `scoring-session-game2.logic.ts`), `edit-score-modal-content` 116→69.
  - match/new: `useNewMatchState` 126→96 (carga de contexto → `match-new-context-load.logic.ts`), `PlayerSelection` 122→77, `doubles-serve-order-section` 118→44 (coluna → `doubles-serve-order-card.tsx`).
  - API: `gestor/athletes-logic` 122→71 (transação → `athletes-create-transaction.logic.ts`), `athletes-provision.logic` 129→87 (criação → `athletes-provision-create.logic.ts`), `regenerate-link/route` 116→69 (emissão → `regenerate-link-issue.logic.ts`), `suporte/externos/route` 114→35 (`externos-query.logic.ts`), `auth/login/route` 115→91 (`login-response.logic.ts`).
  - UI/hook: `clubs-section` 127→60 (`clubs-table.tsx`), `dashboard/page` 117→80, `DashboardChrome` 116→93, `useSpectatorFeed` 120→96 (`spectator-feed-url.logic.ts`), `core/spectate/types` 117→96, `access-actor.logic` 112→89.
- **Estado:** `check:r03` exit 0 (**8** congeladas, 2 isentas, 0 regressões) · 1152 arquivos de produção · 56 arquivos na zona de risco 96–100L (alerta, não falha).
- **Validação Fase 2:** `pnpm typecheck` 0 erros · `pnpm lint` 0 erros · `pnpm test` 489/489 suites (4.422 testes) · `pnpm test:design` 3/3 (26) · `node scripts/check-r03-line-limit.mjs` → `OK R-03 … 0 regressoes`.

---

## 2.24 Habilitação de 'Meus Atletas' no Menu do Treinador e Listagem de Vínculos — 2026-11-06
- **Contexto & Demanda:**
  - No perfil de Treinador (avulso/particular e clube), o item "Meus Atletas" no menu lateral estava desabilitado com o badge "Em breve" (sem rota).
  - A rota `/atletas` (tabela completa de atletas com criação e edição) só buscava atletas criados diretamente pelo usuário (`createdByUserId = userId`), omitindo atletas vinculados via `CoachAthleteLink`.
- **Implementação:**
  1. **Menu Lateral (`src/core/access/menu-items.ts`):** Ativado o item `link('treinador-atletas', 'Meus Atletas', '/atletas', '🎾')` na seção `TREINADOR`.
  2. **Query de Atletas (`src/services/player-service-queries.logic.ts`):** A função `listPlayers` foi atualizada para buscar atletas onde o usuário é o criador OU possui vínculo de treinador ativo:
     ```ts
     where: userId ? {
       OR: [
         { createdByUserId: userId },
         { coachAthleteLinks: { some: { coachUserId: userId, status: 'ACTIVE' } } },
       ],
     } : {}
     ```
  3. **Segurança e UX de Exclusão (`src/app/atletas/components/athlete-list-table-row.tsx`):**
     - O treinador pode criar novos atletas e editar existentes.
     - A exclusão é restrita aos atletas criados por ele mesmo (`createdByUserId === currentUserId` ou admin), ocultando o botão "Excluir" em atletas vinculados criados por terceiros.
  4. **Cabeçalho Contextual (`src/app/atletas/components/AthleteSearchHeader.tsx`):** Exibe "Meus Atletas" quando acessado na área/perfil de treinador.
- **Validação:** Suítes `menu.test.ts` (21/21 PASS), `playerService.test.ts` (23/23 PASS), `src/app/atletas/__tests__` (23/23 PASS) e `pnpm typecheck` (0 erros).

---

## 2.23 Premissa P-01: Isolamento Inquebrantável de Bancos de Dados e Guarda de Pré-Voo — 2026-11-06
- **Contexto & Problema Crítico:**
  - Em ambiente de desenvolvimento local, a ausência de segregação rígida nas variáveis de ambiente fazia com que o Next.js e o Prisma Client herdassem uma DATABASE_URL conectada ao Neon em nuvem, salvando partidas, atletas e dados locais de teste diretamente no banco de produção.
- **Premissa Inquebrantável P-01 (Tolerância Zero):**
  - **Servidor local (development):** opera **SOMENTE** no PostgreSQL local racket_mvp em loopback (localhost, 127.0.0.1, ::1). Bloqueado categoricamente de acessar o Neon.
  - **Testes (test):** rodam **SOMENTE** no PostgreSQL local racket_mvp_test em loopback.
  - **Produção (production):** opera **SOMENTE** no Neon Console (*.neon.tech). Exige marcadores explícitos de infraestrutura de deploy (VERCEL=1 ou APP_ENV=production).
- **Arquitetura da Solução:**
  1. **Segregação de Variáveis:** Renomeadas em .env.example, .env e .env.test para DATABASE_URL_DEV e DATABASE_URL_TEST. Em desenvolvimento local não existe DATABASE_URL genérico.
  2. **Guarda Central (src/lib/db/db-target.ts):** Valida protocolo, host (loopback vs *.neon.tech), e nome exato do banco antes de qualquer conexão. Violações lançam DbTargetError (fail-fast).
  3. **Boot Guard no Next.js (src/instrumentation.ts):** Valida o destino no boot do Node.js runtime antes de atender rotas.
  4. **Injeção Dinâmica no Prisma (src/lib/prisma.ts):** new PrismaClient recebe explicitamente datasourceUrl: dbTarget.url validado.
  5. **Pré-voo de Processos (scripts/db/preflight.ts):** Integrado a todos os scripts do package.json (dev, build, start, test*, db:*), inspecionando e validando o banco antes de disparar o comando filho.
  6. **Isolamento de E2E (playwright.config.ts):** O servidor web de testes roda exclusivamente com preflight.ts --mode=test apontando para racket_mvp_test com reuseExistingServer: false.
- **Testes & Qualidade:**
  - Suíte dedicada src/lib/db/__tests__/db-target.test.ts com 29 testes cobrindo todas as tentativas de invasão entre ambientes (100% PASS).
  - Limpeza e saneamento de credenciais locais no .env.
  - Documentação formalizada em docs/RULES.md (Seção 9).

---

## 2.22 Correção de Corte de Nomes/Clubes no Card e Alinhamento dos Testes de Logout — 2026-11-06
- **Problema 1 — Card do dashboard cortando nome e badge de clube:**
  - Em `src/components/dashboard/match-card-score-grid.tsx`, a coluna "Jogador" estava travada em `w-[110px] sm:w-[120px]` e, como a tabela usa `table-fixed`, o excedente de largura era distribuído igualmente entre as colunas de Sets — Set 1 recebia ~200px para exibir um dígito enquanto nome + badge ("Outros", "Criado por RKT") eram esmagados e cortados no meio da palavra.
  - **Correção:** inversão de prioridade de largura — colunas de Sets compactas e fixas (`w-7 sm:w-10 md:w-11`), Pontos `w-11 sm:w-12`, bola `w-6`, e a coluna do Jogador sem largura fixa (absorve 60-70% do card); nome com `truncate min-w-0 flex-1` + tooltip `title` e badge com `shrink-0` (nunca corta a palavra, corta o nome com reticências). Alteração embarcada no commit `f01ccdd` (2026-11-04).
- **Problema 2 — Testes de logout desatualizados em relação ao fluxo da seção 2.19:**
  - O fluxo real é `await performLogout()` → `POST /api/auth/logout` + `clearAuthState()` → `window.location.replace('/login?exit=1')`, e `redirectToLogin` (`src/lib/auth-client-storage.ts`) faz o mesmo POST antes de navegar. Três suítes ainda esperavam o comportamento antigo (`router.replace('/login')` e `fetch` nunca chamado).
  - **Nenhuma mudança em código de produção** — apenas testes:
    - `src/app/dashboard/__tests__/HamburgerMenu.test.tsx`: o teste força o ramo de produção (mock de `window.location` + `process.env.NODE_ENV !== 'test'`, restaurado no `afterEach`) e usa `waitFor` porque `confirmLogout` é `async`; asserções: `POST /api/auth/logout` → `clearAuthState()` → `window.location.replace('/login?exit=1')`, sem `router.replace('/login')`. Teste de cancelar também afirma que o POST de logout não dispara.
    - `src/app/dashboard/__tests__/dashboard.hooks.test.tsx`: sem `access_token` a única requisição é o `POST /api/auth/logout` (nenhuma busca de partidas) + redirect `/login?exit=1`.
    - `src/app/dashboard/__tests__/dashboard.hooks.guards.test.tsx`: guard de token expirado agora espera `'/login?exit=1'` e o POST de logout (antes afirava `fetch` nunca chamado).
- **Correções de testes pré-existentes encontradas na varredura completa da suíte:**
  - `src/app/admin/__tests__/page.confirm-dialog.test.tsx` e `src/app/match/[id]/report/__tests__/report-page.test.tsx`: mock de `next/navigation` incompleto (`useRouter` sem `usePathname`), quebrado pela migração de `DashboardChrome`/`ReportPage` para `useAreaPath()` → `useActiveArea()` → `usePathname()`. Adicionado `usePathname` nos dois mocks.
  - `src/services/__tests__/playerService.test.ts`: expectativa do `select` de `listPlayers` defasada em relação a `player-service-queries.logic.ts` (campos `city`, `state`, `createdAt` adicionados sem atualizar o teste).
- **Validação:** `pnpm test` (suíte completa) → **488 suítes / 4405 testes / 2 snapshots verdes**; `next lint` sem warnings.

---

## 2.21 Duplas Just-in-Time, Ponto Decisivo No-Ad e Edição Ágil de Sacador — 2026-11-04
- **Contexto & Problema:**
  - Em testes com usuários reais (anotadores e treinadores), o início de duplas exigia antecipadamente a escolha dos sacadores de ambas as duplas, violando a Regra 14 da ITF (onde a dupla recebedora só define quem saca no Game 2).
  - Em formatos No-Ad no 40-40 (ponto decisivo), não havia forma rápida de marcar quem recebia o serviço decisivo.
  - Se o anotador errasse o sacador inicial, não era possível editar o sacador sem reiniciar a partida inteira.
- **Pilar 1: Duplas Just-in-Time (Regra 14 ITF):**
  - `DoublesServerSelectionModal.tsx` e `doubles-serve-order-section.tsx` simplificados para coletar exclusivamente o primeiro sacador da dupla que começa no saque (`servingSide`). A outra dupla recebe aviso visual de que seu sacador será escolhido no Game 2.
  - Micro-modal `Game2ServerSelectionModal.tsx` integrado a `ScoringSessionModals.tsx`, disparado no início do Game 2 com 1 toque para escolher o sacador da dupla B, consolidando a rotação oficial para todo o set.
- **Pilar 2: Ponto Decisivo No-Ad (40-40):**
  - Reconhecimento automático de ponto decisivo em formatos sem vantagem via `isNoAdDecidingPoint`.
  - Banner interativo no `ScoringPlayArea.tsx` exibindo os dois recebedores da dupla que devolve, permitindo alternar com 1 toque o atleta que recebe o ponto decisivo (`activeReceiverId`), integrando diretamente com `PointDetailsModal`.
- **Pilar 3: Edição / Troca Ágil de Sacador em Qualquer Momento (Tolerância a Erro):**
  - Ícone da bolinha (`🎾`) no `PlayerCardRow.tsx` / `PlayerCard.tsx` com `role="button"` e cursor clicável, acionando o `ChangeServerModal.tsx` (inversão em Simples e seletor dos 4 atletas em Duplas).
  - Botão de recuperação rápida pós-undo ou no início do game no `0-0` em `PlayAreaPlayers.tsx` ("Corrigir Sacador").
  - Seção dedicada e visível no modal de edição de placar (`EditScoreServerSection.tsx` integrado a `EditScoreModalContent.tsx`) para retificar o sacador ativo do game.
  - Core: `applyGameServerChange` em `game-server-change.logic.ts` e `engine.setGameServer(serverId)` com sincronização no Game 1 via `createServerChangeService`.
- **Testes & Qualidade:**
  - Suítes dedicadas `ChangeServerModal.test.tsx`, `game-server-change.test.ts`, `DoublesServerSelectionModal.characterization.test.tsx` e `engine-from-serialized.initial-server.regression.test.ts` 100% verdes.
  - TypeScript estrito (`tsc --noEmit`) 0 erros.

---

## 2.20 Estatísticas Avançadas, Timeline MT, Responsividade de Atletas e Vínculo de Treinador Avulso — 2026-11-04
- **Estatísticas Avançadas (EA):**
  - Colunas centrais de métricas em `advanced-stats-primitives.tsx` e `advanced-stats-stroke-matrix-section.tsx` alargadas (`grid-cols-[1fr_minmax(180px,280px)_1fr] sm:grid-cols-[1fr_280px_1fr]` e `gap-3 sm:gap-4`) sem truncamento de texto, prevenindo corte dos critérios.
  - Tópico 10 (Breakdown por set) removido por completo de `AdvancedStats.tsx`.
  - Tópico 7 (Definição de ponto): Aces integrados à contagem de Winners e Duplas Faltas (DFs) integradas à contagem de Erros Não Forçados (ENF). Rótulo simplificado para "Winners".
  - Tópico 9 (Momentum): Removidos o bloco central de "Sequência atual" e o rodapé de "Sequências de 2+ Pontos"; tabela renomeada para "2 pontos ganhos seguidos", "3 pontos ganhos seguidos", "4+ pontos ganhos seguidos".
  - Tópico 6 (Pontos de Pressão): Inclusão da palavra "Won" ("Games Points Won", "% Games Points Won", "Set Points Won", "% Set Points Won", "Tiebreaks Won").
  - Tópico 2 (Devolução): Removidos "Total Break points" e "Break points Won"; ordem reestruturada para: % Devolução 1º saque em quadra, % pontos ganhos na devolução de 1º saque, % dev 2º saque em quadra, % pontos ganhos na dev 2º saque, Games ganhos devolvendo.
  - Tópico 3 (Fundo de Quadra): Restrito estritamente a pontos com `situacao === 'fundo'`, mantendo abrangência total em Rally Geral.
- **Timeline e Relatório (/report) em Match Tiebreak (MT):**
  - Supressão de detecção de fim de game a cada ponto em `timeline-game-end.ts` durante tiebreak.
  - Remoção de linhas divisórias (`GameEndRow`) entre pontos em MT.
  - Coluna 'GAMES' omitida em `MATCH_TB_10` na timeline.
  - Marcador de quebra de serviço no tiebreak renomeado para "Minibreak".
  - Resumo de sets computa vencedor de MT (`1 - 0` no relatório finalizado).
- **Criação de Atleta & Vínculo Treinador Avulso:**
  - `POST /api/players` e `player-create.logic.ts` permitem criação com `myClub: true` para treinador avulso sem CT, estabelecendo vínculo via `CoachAthleteLink` ativo.
  - Herança do slot `isParticular` em `MatchNewModals.tsx` e `use-new-athlete-modal.ts`.
- **Tabela de Atletas & Dashboard:**
  - Layout compacto e responsivo em `AthleteListTable.tsx` com inclusão das colunas Clube e Cidade / UF.
  - Descrição do modo de jogo no Dashboard alinhada à esquerda e com nomenclatura oficial completa sem abreviações.
- **Testes & Qualidade:**
  - Suíte `AdvancedStats.characterization.test.tsx` criada e 100% verde (50 suítes de relatórios passando).
  - `tsc --noEmit` 0 erros.

---

## 2.19 Correção do Logout no Menu Hambúrguer em /suporte — 2026-11-02
- **Sintoma:** em `/suporte`, ao clicar no menu hambúrguer e depois em "Sair", o logout falhava ou a tela de login aparecia mantendo a URL `/suporte`.
- **Causa Raiz:**
  1. O painel do suporte passa `<DashboardChrome title="Painel do Suporte" showLogout={false} />` para não renderizar o botão "Sair" na barra superior (`DashboardTopBar`). No entanto, `DashboardChrome.tsx` condicionava a renderização do diálogo de confirmação (`ConfirmAlertDialog`) a `{showLogout && !onLogout && (...)}`. Como `showLogout` era `false`, o clique em "Sair" no menu hambúrguer abria o estado mas o diálogo não existia na DOM.
  2. Em `DashboardChrome.tsx`, `confirmLogout` executava `performLogout().catch(...)` de forma assíncrona sem `await`, navegando imediatamente via `router.replace('/login')` e `window.location.href = '/login'`. O cookie httpOnly `rkt_access_token` ainda estava ativo na requisição para `/login`. O middleware, ao detectar usuário autenticado acessando `/login`, aplicava o redirecionamento 307 de volta para a home da área ativa (`/suporte`), gerando uma colisão onde a tela de login renderizava com URL `/suporte`.
  3. `login-success.logic.ts` não validava se o destino do query param `next` era compatível com os papéis do usuário autenticado (ex.: redirecionar para `/suporte` conta avulsa).
- **Resolução Implementada:**
  - `src/app/dashboard/components/DashboardChrome.tsx`:
    - `<ConfirmAlertDialog>` é montado sempre que `!onLogout`, permitindo que o menu hambúrguer conclua o fluxo.
    - `confirmLogout` agora é `async`, aguarda `await performLogout()` para que a rota `/api/auth/logout` limpe os cookies httpOnly no servidor antes de navegar.
    - Navegação com `window.location.replace('/login?exit=1')`, ativando a limpeza segura forçada pelo middleware sem redirecionamento para `homeForArea`.
  - `src/lib/auth-client-storage.ts`: `redirectToLogin` padronizado para `/login?exit=1`.
  - `src/app/login/login-success.logic.ts`: valida áreas protegidas (`/suporte`, `/admin`, `/gestor`) contra os acessos reais da conta recém-autenticada, prevenindo desvios para áreas indevidas.
- **Testes:**
  - `src/app/dashboard/components/__tests__/DashboardChrome.menu.test.tsx`: valida que mesmo com `showLogout={false}`, o clique em "Sair" no menu hambúrguer abre com sucesso o diálogo de confirmação de logout.
  - `src/app/login/__tests__/login-success.test.ts`: 7 testes cobrindo redirecionamentos por perfil e bloqueio de `next=/suporte` para contas sem permissão de suporte.

---

## 2.18 Filtro 'Meu atleta' e 'Outros' no Modal Nova Partida (/match/new) — 2026-11-02
- **Sintoma:** ao abrir o modal Nova Partida (`/match/new`) como treinador particular/avulso, selecionar "Meu atleta" listava todos os atletas do sistema; o botão "Outros" também listava todos os atletas com o nome do clube exibido.
- **Causa Raiz:**
  1. Em `src/app/match/new/slot-affiliation.ts`: quando `affiliation === 'OWN'` e `!target` (modo particular sem CT), se `followedPlayerIds` estivesse vazio ou não correspondesse, caía no fallback `return athletes;` (retornando todos os atletas do sistema).
  2. Em `src/app/api/auth/me/route.ts`: `followedPlayerIds` consultava apenas `dbUser.coachAthleteLinks`, omitindo `createdPlayers` (atletas cadastrados diretamente pelo treinador avulso via `/api/players`).
  3. Em `src/app/match/new/useNewMatchState.ts`: `loadAvailableCts` preenchia `ctId` com o primeiro CT retornado (`cts[0].id`), forçando inadvertidamente o modo de CT mesmo em contexto `PARTICULAR`.
  4. Em `src/app/match/new/components/my-club-selector.tsx`: `MyClubSelector` não verificava `isParticular` e renderizava o seletor de CT do clube.
- **Resolução Implementada:**
  - `src/app/match/new/slot-affiliation.ts`: corrigido `filterAthletesForSlot` para retornar estritamente `athletes.filter((a) => followedPlayerIds.includes(a.id))` em `OWN` sem CT (retorna lista vazia caso o treinador não tenha atletas vinculados, jamais todos os atletas). Em `NOT_OWN` sem CT, exclui os atletas vinculados de `followedPlayerIds`.
  - `src/app/api/auth/me/route.ts`: `followedPlayerIds` une `coachAthleteLinks` e `createdPlayers` (`dbUser.createdPlayers.map(p => p.id)`).
  - `src/services/access-actor.logic.ts` + `accessService.ts`: `filterFollowedPlayers` incorpora `createdPlayers` no ator, isolando atletas de CTs quando no modo avulso/particular.
  - `src/app/match/new/components/PlayerSelection.tsx`: calcula `effectiveCtId = isParticular ? null : (ctId || null)`.
  - `src/app/match/new/components/my-club-selector.tsx`: retorna `null` quando `isParticular` é verdadeiro.
  - `src/app/match/new/useNewMatchState.ts`: garante que em modo `PARTICULAR` o `ctId` permanece vazio (`''`), encadeando `loadAvailableCts` após a leitura do contexto em `/api/auth/me`.
  - `src/app/match/new/useNewMatchSelectionActions.ts`: novos atletas criados na hora pelo treinador no modal são adicionados reativamente ao `followedPlayerIds`.
- **Testes:**
  - `src/app/match/new/__tests__/slot-affiliation.characterization.test.ts`: 14 testes cobrindo `OWN`/`NOT_OWN` com e sem `ctId` e com `followedPlayerIds`.
  - `src/app/match/new/__tests__/PlayerSelection.characterization.test.tsx`: 7 testes cobrindo renderização, labels `Meu atleta` e `Outros` e filtragem isolada por slot.
  - 100% de testes verdes em toda a suíte de match e access.

---

## 2.17 Plano da Landing Page Institucional e Captação — 2026-11-01
- **Origem:** Demanda de divulgação institucional e captação de usuários segmentada por perfis.
- **Diretório da LP:** [`c:\apps\RKT-LP`](file:///c:/apps/RKT-LP)
  - Plano mestre salvo em: [`c:\apps\RKT-LP\PLANO_LANDING_PAGE.md`](file:///c:/apps/RKT-LP/PLANO_LANDING_PAGE.md).
  - Ponto de entrada e referências: [`c:\apps\RKT-LP\README.md`](file:///c:/apps/RKT-LP/README.md).
- **Referências Canônicas:**
  - Fonte única de verdade para Design System, tokens `telemetry-*`, regras R-03 ($\le 100$ linhas), tipos de telemetria esportiva e fluxos de autenticação (`/signup` com `?perfil=` e `?origem=`) é o sistema principal em `c:\apps\RKT`.
- **Decisões Arquiteturais:**
  1. A Landing Page é servida na raiz `/` para visitantes anônimos.
  2. Usuários já autenticados que acessarem `/` são direcionados para a home da sua área semântica ativa (`homeForArea(activeArea)`).
  3. Os CTAs segmentam por perfil (`ATLETA`, `TREINADOR`, `GESTOR`, `ESPECTADOR`) com tags de auditoria (`origem=lp_*`).

---

## 2.16 Layout das Subseções de Ranking em 2 Linhas (Sem Scroll Horizontal) — 2026-11-01
- **Sintoma:** no cadastro de novo atleta (seção "2. Ranking", usada também no Editar Atleta), cada subseção (Estadual, COSAT etc.) renderizava **Categoria, Classe, Posição e Posição Ranking Juvenil numa única linha** (`flex flex-nowrap` + `overflow-x-auto`), forçando barra de rolagem horizontal — UX péssima em telas estreitas.
- **Causa Raiz:** `src/app/atletas/ranking-form-card.tsx` envolvia os campos em `<div className="flex flex-nowrap ... overflow-x-auto">` e `RankingFields` devolvia todos os campos como irmãos inline.
- **Resolução Implementada:**
  - `src/app/atletas/ranking-form-card.tsx`: container vira `flex items-start` simples (sem `flex-nowrap`/`overflow-x-auto`).
  - `src/app/atletas/ranking-form-fields.tsx`: campos reorganizados em **duas linhas** com `grid grid-cols-2`:
    - **Linha 1:** Categoria + Posição (para tipos sem categoria, ex. adulto em ESTADUAL, a **Classe sobe** para a linha 1 junto da Posição);
    - **Linha 2:** Classe + Posição Ranking Juvenil (renderizada só quando faz sentido — categoria juvenil).
  - Novos componentes extraídos para respeitar R-03 (≤100 linhas): `ranking-field.tsx` (label + controle), `ranking-select-field.tsx` (select rotulado, sufixo " anos" para categorias) e `ranking-number-field.tsx` (input numérico de Posição). Tokens telemetry preservados.
  - Impacto: vale para **todos** os consumidores de `RankingForm` — cadastro de atleta em `/match/novo` ("2. Ranking") e modal "Editar Atleta" em `/atletas`.
- **Testes:** `src/app/atletas/__tests__/RankingForm.real.test.tsx` — asserts de layout atualizados para as 2 linhas (`.grid.grid-cols-2`), novo caso "adulto sem categoria: Classe + Posição juntas na linha 1 e sem linha 2" e regressão de ausência de `.overflow-x-auto`. Suítes `RankingForm|EditAthleteModal|NewAthleteModal` verdes (47 testes).
- **Qualidade:** `tsc --noEmit` 0 erros · `next lint` 0 avisos · arquivos ≤100 linhas (R-03).

## 2.15 "Link Senha" do Gestor Cria a Conta de Atletas Sem Conta — 2026-11-01
- **Sintoma:** em `/gestor` → aba **Atletas**, clicar em **"Link Senha"** retornava `404 { error: 'NOT_FOUND', message: 'Vínculo de atleta não encontrado' }`; após a primeira correção, o mesmo clique devolvia `409 CONFLICT` quando o CPF do atleta já tinha conta.
- **Causa Raiz:**
  1. O `PlayerCT` existia e estava `ACTIVE`; o 404 era disparado por `!playerCt.player.user || !playerCt.player.userId`. Atletas vinculado ao CT **sem conta de acesso** (`Player.userId` nulo — cadastro rápido em partida `PROVISIONAL` ou vínculo avulso via `/api/cts/[id]/athletes`) apareciam com o botão ativo e não tinham como gerar link.
  2. O CPF é a chave de identidade, mas **só os treinadores** tinham fluxo de vinculação de conta já existente (`linkExistingCoach`, acionado pelo prompt do cadastro). Para atletas, `createAthleteByGestor` devolvia `conflict: true` e o modal ignorava (`canLinkExisting` só era tratado para treinador). Caso real no banco local: atleta *Marcos* (nascimento 2015-01-01) com CPF igual ao da conta `Coah Carter`.
- **Resolução Implementada:**
  - `src/app/api/gestor/athletes-link.logic.ts` (novo): `linkExistingAthleteAccount()` — espelho de `linkExistingCoach`. Recusa se a conta já pertence a outro `Player` (`409`), cria/associa o `Player` da conta, garante `PlayerCT` **ACTIVE** (reativa vínculo encerrado em vez de duplicar), propaga `CoachAthleteLink` para os treinadores do CT, grava `AuditLog` (`ATHLETE_LINKED_TO_CT`) e invalida o cache do ator. Aplica a regra "cadastrado pelo clube pertence ao clube".
  - `src/app/api/gestor/athletes-provision.logic.ts` (novo): `provisionAthleteAccount()` movida para cá (R-03). Valida CPF/nascimento, **vincula a conta de mesmo CPF** ou cria o `User` (`ANNOTATOR`, `canOperate`, senha provisória = data de nascimento `YYYYMMDD`, 7 dias) associando `Player.userId` + `identityStatus: 'CONFIRMED'`. E-mail de outra conta → `409`; corrida `P2002` → `409`.
  - `src/app/api/gestor/athletes/[id]/regenerate-link/route.ts`: o 404 passa a valer apenas para vínculo inexistente; sem conta, provisiona/vincula na hora e segue o fluxo normal (`LinkInvite` + `PasswordResetRequest` + token).
  - `src/app/api/gestor/athletes-logic.ts`: `createAthleteByGestor` aceita `linkExisting` — sem ele devolve `canLinkExisting`/`existingUserName` (prompt de confirmação); com ele chama `linkExistingAthleteAccount` e responde `isExistingUser: true` sem nova senha.
  - `src/lib/validators/athlete-create.schema.ts` + `src/app/api/gestor/athletes/route.ts`: `linkExisting` no schema e no payload de conflito/sucesso (mesmo formato da rota de treinadores).
  - `src/app/gestor/cadastrar-membro-modal.tsx` e `cadastrar-membro-link-prompt.tsx`: envia `linkExisting` também para atleta e prompt com copy própria ("vincular a conta ao seu clube" / "integrar o elenco").
  - `src/app/gestor/athlete-row.tsx`: badge **"Sem conta"** e título do botão "Criar conta de acesso e gerar link de senha".
- **Testes:**
  - `src/app/api/gestor/athletes/[id]/__tests__/regenerate-link.test.ts` (8 casos: conta existente, provisionamento, vínculo por CPF, 404, 400 nascimento, 400 CPF, 409 outro atleta, 409 e-mail de outra conta).
  - `src/app/api/gestor/__tests__/athletes-link.test.ts` (5 casos) e `coaches-athletes.test.ts` (+2 casos de `linkExisting`).
  - `src/app/gestor/__tests__/athlete-row.test.tsx`, `athletes-table-link-senha.test.tsx` e `cadastrar-membro-modal-link.test.tsx`.
- **Qualidade:** `tsc --noEmit` 0 erros · `next lint` 0 avisos · suítes Jest de gestor verdes (73 testes).

---

## 2.12 Área Ativa e Roteamento Semântico por URLs (Fases 0 a 7 Concluídas) — 2026-11-01
- **Origem:** Plano [`docs/archive/PLANO_AREAS_ATIVAS_E_URLS_POR_AREA_2026-11-01.md`](docs/archive/PLANO_AREAS_ATIVAS_E_URLS_POR_AREA_2026-11-01.md).
- **Fase 0 (Spike de Compatibilidade App Router Next.js 15.3):**
  - Documentado em [`docs/SPIKE_NEXTJS_URL_REWRITE.md`](docs/SPIKE_NEXTJS_URL_REWRITE.md).
  - Comprovada a preservação da URL externa visível via `usePathname()`, integridade da navegação SPA com `<Link>` e funcionamento transparente da pilha de modais (`useRouterModalStack`).
- **Fase 1 (Claims de Sessão, Token & Refresh):**
  - `src/lib/jwt-client.ts`: Suporte aos novos claims de área `ax` (área ativa), `ct` (clube ativo) e `ars` (áreas disponíveis).
  - `src/core/access/areas.ts`: Funções puras `listAreas`, `prefixForArea`, `homeForArea` mapeando todas as 8 áreas canônicas.
  - `src/app/api/auth/refresh`: Refatorado com `refresh-token.logic.ts` para preservação integral e sem perdas de `sub`, `role`, `sv`, `mcp`, `pp`, `mk`, `cx`, `ax`, `ct` e `ars`.
  - `src/app/api/auth/area`: Rota e lógica `switchUserArea` permitindo alternância de área ativa com validação de vínculo e gravação no `AuditLog`.
  - `src/lib/feature-flags.ts`: Feature flag `isAreaUrlsEnabled()` controlada por `AREA_URLS`.
- **Fase 2 (Middleware & Camada de Roteamento):**
  - `src/core/access/app-path.logic.ts`: Helper puro `appPath(area, path)` resolvendo caminhos de todas as áreas com preservação de rotas neutras.
  - `src/middleware-area.logic.ts`: Reescrita transparente (`NextResponse.rewrite`) de rotas com prefixo (`/treinador`, `/atleta`, etc.) para rotas internas do App Router (`/dashboard`, `/partidasaovivo`, `/match/new`, etc.), e redirecionamento temporário 307 de rotas legadas não prefixadas.
  - `src/middleware.ts` e `src/middleware-auth.logic.ts`: Atualizados com expansão do matcher incluindo `/login`, `/clube/:path*`, `/treinador/:path*`, `/atleta/:path*`, `/anotador/:path*`, `/espectador/:path*` e `/escolher-area`.
- **Fase 3 (Isolamento por Área no Servidor):**
  - `src/services/access-actor.logic.ts`: `buildActor` com suporte a `activeArea`. No contexto `TREINADOR_AVULSO` ou `contextId: 'PARTICULAR'`, filtra estritamente atletas avulsos e nega vínculos de clube; em `ATLETA`, omite papéis de gestão/treinador.
  - `src/services/accessService.ts`: `getActor` aceita e indexa cache de ator por `activeArea`.
  - `src/lib/auth-credentials.logic.ts` e `src/lib/access-handler.ts`: Extração de `x-active-area` e `x-active-ct` injetando ator contextualizado em todas as rotas protegidas.
  - `src/core/access/visibility.ts`: Filtro estrito de visibilidade em `canReadMatch` e `canAnnotateMatch` por `Match.ctId` e contexto ativo.
- **Fase 4 (Migração de Links e Teste-Guarda):**
  - `src/hooks/use-area-path.ts`: Hook cliente reativo `useAreaPath()` detectando área da rota atual e gerando caminhos semânticos.
  - `DashboardChrome.tsx`, `useDashboardNavigation.ts` e `useNewMatchSubmissionActions.ts`: Atualizados com roteamento por área.
  - `src/__tests__/area-links.guard.test.ts`: Teste-guarda de integridade validando que nenhum link prefixável escapa do padrão.
- **Fase 5 (UI, Escolha de Área e Limpeza Offline):**
  - `src/app/escolher-area/page.tsx` e `use-area-selection.ts`: Interface de seleção de áreas disponíveis com redirect automático se conta possuir apenas 1 área.
  - `src/lib/offline-storage-purge.ts`: Limpeza de caches IndexedDB (`racket_pending_matches` e `racket-offline-db`) ao alternar contexto/área.
  - `src/components/ui/context-switcher.tsx`: Integrado `purgeOfflineCaches()` na alternância de contexto do menu.
- **Fase 6 (Páginas Públicas, Segurança & Parâmetro next):**
  - `src/core/access/safe-redirect.logic.ts`: Sanitização rigorosa contra Open Redirect (CWE-601) em `next` com testes dedicados em `safe-redirect.test.ts`.
  - `src/app/login/login-success.logic.ts`: Redirecionamento seguro após autenticação para `/escolher-area` (múltiplas áreas) ou rota semântica da área ativa (`/treinador`, `/atleta`, etc.).
  - `src/app/match/[id]/report/page.tsx` e `src/app/match/[id]/scoring/page.tsx`: Adoção de `useAreaPath()` nos retornos contextuais de relatório e pontuação.
- **Fase 7 (Homologação Final & Baseline Verde):**
  - 100% dos novos arquivos com $\le 100$ linhas (R-03).
  - `tsc --noEmit`: 0 erros.
  - `next lint`: 0 avisos / 0 erros (`✔ No ESLint warnings or errors`).
  - Baseline de testes Jest: 38 testes específicos da funcionalidade passando + suíte global verde.

---

## 2.14 Correção do Fluxo de Troca de Senha, Logout e Escape Hatch em /trocar-senha — 2026-11-01
- **Causa Raiz Identificada:**
  1. *Logout no Menu Hambúrguer e Header*: O botão "Sair" limpava apenas o estado no `sessionStorage`/`localStorage`, mas não invocava `POST /api/auth/logout`, deixando o cookie `rkt_access_token` (`HttpOnly`) persistido.
  2. *Bloqueio em /trocar-senha*: O usuário logado com senha provisória tem o claim `mcp: true` no cookie. O middleware forçava redirecionamento de volta para `/trocar-senha`. Ao tentar navegar para o login ou caso a senha provisória estivesse expirada/esquecida, o usuário ficava preso em loop na tela sem conseguir acessar nenhuma outra conta.
- **Resolução Implementada:**
  - `src/lib/auth-client-logout.ts`: Criado módulo isolado (23L) com `performLogout()` que faz `POST /api/auth/logout` para expirar cookies `HttpOnly` no servidor e limpa a sessão cliente.
  - `src/app/dashboard/components/DashboardChrome.tsx`: Integração de `performLogout()` e `clearAuthState()` na confirmação do alertdialog de logout.
  - `src/app/api/auth/login/route.ts`: Quando `user.mustChangePassword === true`, o cookie `rkt_access_token` é emitido como cookie de sessão (sem `maxAge`), sendo descartado ao fechar o navegador.
  - `src/middleware-auth.logic.ts`: Se um usuário com `decoded.mcp === true` acessa a raiz `:3000` ou `/login`, o middleware limpa e expira os cookies pendentes e exibe a tela de login livremente, enquanto rotas protegidas (`/dashboard`, `/treinador`, etc.) continuam exigindo a troca de senha.
  - `src/middleware-auth.logic.ts`: Adicionado suporte a `exit=1` em `/login?exit=1`, limpando e expirando cookies no ato e exibindo a tela de login sem loop de redirecionamento.
  - `src/app/trocar-senha/components.tsx` e `src/app/trocar-senha/page.tsx`:
    - Adicionado escape hatch com botões de saída ("Sair desta conta e voltar ao login" no alerta de erro e "Sair e fazer login" no rodapé).
    - O botão "Ir para o Login" na tela de sucesso chama `performLogout()` e navega para `/login?exit=1`.
  - Testes dedicados em `src/lib/__tests__/auth-client-logout.test.ts`, `src/app/trocar-senha/__tests__/trocar-senha.test.tsx` e `src/middleware/__tests__/middleware.test.ts`.
  - R-03 respeitado: todos os arquivos mantidos com $\le 100$ linhas.
  - `src/app/trocar-senha/components.tsx`: Componente `TrocarSenhaSuccess` atualizado para acionar `onLoginClick` de forma explícita no botão "Ir para o Login".
  - `src/app/trocar-senha/__tests__/trocar-senha.test.tsx`: Teste unitário criado para garantir o comportamento de sucesso e disparo da navegação.
- **Qualidade & STE-DEV:**
  - `change-password/route.ts` (92L), `reset-password/route.ts` (50L), `trocar-senha/page.tsx` (98L), `trocar-senha/components.tsx` (98L) — 100% $\le 100$ linhas (R-03).
  - `tsc --noEmit`: 0 erros.
  - `next lint`: 0 erros / 0 avisos.
  - Testes: 100% verdes.

---

## 2.13 Correção do Fluxo de Logout no Header e Menu Hambúrguer — 2026-11-01
- **Causa Raiz Identificada:** O cookie de autenticação `rkt_access_token` é definido com `httpOnly: true`. A rotina de logout anterior executava apenas `clearAuthState()`, limpando o `sessionStorage` e tentando `document.cookie` (ineficaz para cookies `HttpOnly`). Sem a chamada ao endpoint `POST /api/auth/logout`, o cookie permanecia no navegador. Ao tentar redirecionar para `/login`, o middleware detectava a sessão ainda ativa e redirecionava imediatamente de volta para a rota da área ativa (`/suporte`, `/dashboard`, etc.).
- **Resolução Implementada:**
  - `src/lib/auth-client-logout.ts`: Criado módulo puro `performLogout` que dispara `fetch('/api/auth/logout', { method: 'POST' })` para invalidação dos cookies `HttpOnly` no servidor, seguido de `clearAuthState()`.
  - `src/lib/auth-client.ts`: Exportada a função `performLogout`.
  - `src/app/dashboard/components/DashboardChrome.tsx`: `confirmLogout` atualizado para despachar `performLogout()`, `clearAuthState()`, `router.replace('/login')` e navegação de página completa com `window.location.href = '/login'`.
  - `src/lib/auth-client-storage.ts`: `redirectToLogin()` atualizado para também acionar `fetch('/api/auth/logout', { method: 'POST' })`, evitando retenção inadvertida de cookies ao expirar tokens.
  - `src/lib/__tests__/auth-client-logout.test.ts`: Cobertura unitária completa do novo fluxo.
- **Qualidade & STE-DEV:**
  - Limite de linhas estritamente respeitado (R-03): `DashboardChrome.tsx` (99L), `auth-client-storage.ts` (95L), `auth-client-logout.ts` (23L).
  - `tsc --noEmit`: 0 erros.
  - `next lint`: 0 erros / 0 avisos.
  - Testes: 100% verdes (3/3 suítes de logout e menu hambúrguer passando).

---

## 2.11 Auditoria & Homologação: LGPD, Proteção de Menores e Governança — 2026-11-01
- **Origem:** Plano [`docs/PLANO_LGPD_PROTECAO_MENORES_E_GOVERNANCA_2026-10-31.md`](docs/PLANO_LGPD_PROTECAO_MENORES_E_GOVERNANCA_2026-10-31.md).
- **Fase 1 (Proteção de Menores na Transmissão):**
  - `src/core/spectate/spectator-projection.ts`: Parâmetro `broadcastConsentPlayerIds` obriga mascaramento para iniciais (`A. S.`) de menores sem autorização ativa.
  - `src/services/spectator-feed.service.ts` e `builder`: Repasse de consentimentos ativos.
  - `/api/spectate/[matchId]/feed`: Consulta `ConsentRecord` com `purpose: 'BROADCAST'` e `revokedAt: null`.
  - Telas públicas `/matches/convite/[token]` e `/matches/acompanhar/[matchId]`: Botão "Voltar ao início" aponta para `/`.
- **Fase 2 (Direitos dos Titulares - Art. 18 LGPD):**
  - `user-anonymize.logic.ts`: Ofuscação em cascata de `User` e `Player` dentro de `$transaction`.
  - `/api/users/[id]/anonymize`: Consome logic e audita com `meta: { playerId }`.
  - `user-export.logic.ts` e `/api/users/[id]/export`: Exportação completa com histórico e adversários minimizados.
- **Fase 3 (Fluxo Seguro de Tutela):**
  - `/api/guardians/consent`: Endpoint com validação estrita de `GuardianLink` confirmado, checagem de `isMinor`, bloqueio de auto-consentimento pelo menor e auditoria com `ipHash`.
- **Fase 4 (Onboarding & Páginas Legais):**
  - Páginas públicas `/termos` e `/privacidade` no padrão broadcast telemetry.
  - `/signup`: Leitura de `?perfil=` com whitelist, `?origem=`, checkbox obrigatório com links legais e gravação de `TERMS_ACCEPTED` no `AuditLog`.
- **Qualidade & Baseline:**
  - 100% dos 16 arquivos com $\le 100$ linhas (R-03).
  - `tsc --noEmit`: 0 erros.
  - `next lint`: 0 avisos / 0 erros (`✔ No ESLint warnings or errors`).
  - Suítes de testes de signup e spectate: 100% verdes (4/4 signup com 16 testes; 7/7 spectate com 26 testes).

---

## 2.10 Otimização Mobile do Anotador e do Espectador — 2026-10-31
- **Anotador (`/match/[id]/scoring`):**
  - **Eliminação de delay e zoom duplo:** Adicionado `touch-manipulation` em botões de ação e no layout da página de pontuação.
  - **Prevenção de rebotes e overscroll:** `overscroll-none` e `select-none` no container principal impedem recarregamento por pull-to-refresh acidental e seleção indesejada de texto durante anotação veloz.
  - **Feedback háptico (R-13):** Adicionado `triggerHaptic(20)` e `triggerHaptic(40)` com `navigator.vibrate` protegido por feature detection no `use-player-card-touch.ts`.
  - **Modo Sol Forte (High-Contrast Outdoor):** Em `PlayerCard.tsx` e `player-card-row.tsx`, anel de sacador reforçado (`ring-[3px] ring-telemetry-volt shadow-[0_0_12px_rgba(var(--telemetry-volt)/0.35)]`), bordas nítidas `border-telemetry-border/30 dark:border-white/10 shadow-sm` e tipografia `font-black tracking-tight drop-shadow-sm` para legibilidade máxima sob luz solar direta em quadra aberta.
- **Espectador (`/matches/acompanhar/[matchId]`):**
  - **Placar Sticky:** `SpectatorScoreboard.tsx` com `sticky top-0 z-20 bg-telemetry-card/95 backdrop-blur-sm` mantendo os sets e games visíveis mesmo ao rolar a timeline de pontos no celular.
  - **Wake Lock da Tela:** Hook `use-wake-lock.ts` mantendo a tela do smartphone ativa enquanto a partida estiver `LIVE` ou `CATCH_UP` via Screen Wake Lock API (`navigator.wakeLock.request('screen')`). Reativação automática com `visibilitychange` ao retornar à aba.
  - **Toggle Visual de Bateria para o Wake Lock:** Componente `SpectatorWakeLockToggle.tsx` e hook `use-spectator-wake-lock-preference.ts` permitindo ao espectador alternar entre "Tela sempre acesa" e "Economia de bateria (tela apaga)", com preferência persistida localmente.
  - **Microanimação no Último Ponto:** Indicador pulsante em tempo real no `SpectatorLastPointBanner.tsx` com `animate-ping` e chave de animação por ponto.
  - **Responsividade e Viewport:** Otimização do container em `page.tsx` com padding responsivo (`p-2 sm:p-4`) e `touch-manipulation`.
- **Qualidade STE-DEV:**
  - 100% dos arquivos com $\le 100$ linhas (R-03).
  - Baseline de testes Jest: 100% verde (7 suites, 26 testes em spectate; suítes de scoring aprovadas).
  - Tipagem TypeScript: `tsc --noEmit` com 0 erros.

---

## 2.7 Acompanhamento de Partidas ao Vivo (Transmissão Espectador) — 2026-10-29
- **Origem:** Plano `docs/archive/PLANO_ACOMPANHAMENTO_PARTIDAS_AO_VIVO_2026-10-29.md`.
- **Fase 1 (Núcleo Puro):**
  - Módulos em `src/core/spectate/`: `signal-status.ts`, `rhythm-status.ts` (Opção B adaptativa por ritmo do jogo), `correction-diff.ts`, `spectator-projection.ts`.
- **Fase 2 (Banco de Dados e Prisma):**
  - Modelos `MatchShareLink` e `MatchSpectator` criados, migration `20261029090000_add_match_spectating`.
- **Fase 3 (Serviços e APIs):**
  - `/api/matches/[id]/share-links`, `/api/spectate/redeem`, `/api/spectate/[matchId]/feed`.
- **Fase 4 (Heartbeat do Anotador):**
  - `useAnnotatorHeartbeat.ts` com intervalo de 20s e silêncio em background.
- **Fase 5 (UI e Modais Conforme Anexos de Design):**
  - Modal de compartilhamento decomposta em conformidade estrita com a regra R-03:
    - `ShareSpectateModal.tsx` (orquestrador principal com hook `useShareSpectateModal.ts`).
    - `ShareSpectateCreateSection.tsx` (contexto da partida, label "Rótulo do convite", card de 3 regras com ícones e botão "Criar convite").
    - `ShareSpectateCreatedSection.tsx` (URL mono encurtada, botões Copiar link e WhatsApp, aviso de cópia única).
    - `ShareSpectateWatchersList.tsx` (cabeçalho "Acompanhando · X de 5", avatares circulares com iniciais, badge "Online", remoção individual e botão "Revogar convite").
    - `share-spectate.icons.tsx` (ícones SVG acessíveis e compatíveis com design system Telemetry).
  - Submódulos do lado do convidado alinhados rigorosamente ao wireframe do anexo:
    - `/matches/convite/[token]/page.tsx` e `InviteCard.tsx`: Tela de pré-visualização e resgate com botão explícito "Acompanhar partida", ação "Agora não", avatar com ícone de olho, subtítulo "X convidou você" e card com nomes abreviados de menores (`Ana S. × Bia L.`), quadra, set atual e badge "Ao vivo".
    - `GET /api/spectate/invite/[token]` e `spectator-preview.service.ts`: Endpoint de leitura segura de convite sem consumir a concessão antes do clique.
    - `/matches/acompanhar/[matchId]/`:
      - `SpectatorHeader.tsx`: Seta de voltar, título compacto, badge verde "Ao vivo" (ou "Aguardando início", "Pausada", "Encerrada", "Sem sinal") e subtítulo dinâmico "Atualizado há X s".
      - `SpectatorScoreboard.tsx`: Tabela em grid com cabeçalho de colunas `S1 S2 Pts`, pontuação dos sets e game atual.
      - `SpectatorLastPointBanner.tsx`: Faixa azul accent de linha única com último ponto.
      - `SpectatorTabs.tsx`: 3 abas (`Pontos`, `Resumo`, `Estatísticas`).
      - `SpectatorTimeline.tsx`: Linhas compactas `G4 · 40–30  Ana S. · ace`.
      - `SpectatorScoreAnnouncer.tsx`: Acessibilidade auditiva com `aria-live="polite"` que **só anuncia mudanças de game ou set**, preservando leitores de tela durante polling.
  - **Fase 6 (Implementação Integral dos 10 Estados de Erro, Feed, Conexão e Acesso):**
    - Alinhamento rigoroso aos 10 estados do wireframe:
      1. *NO_SIGNAL:* Banner de advertência `Sem atualização há X s. O placar pode estar atrasado.` (limite de 30s de heartbeat).
      2. *PAUSED:* Mapeado quando `MatchAnnotationSession` estiver suspensa/inativa sem que a partida tenha sido finalizada. Banner neutro `Pausada pelo anotador. Volta quando retomar.`.
      3. *NOT_STARTED:* Mapeado quando a partida foi criada mas tem 0 pontos (`totalPoints === 0`). Empty state com ampulheta `A partida ainda não começou. Os pontos aparecem aqui assim que o anotador registrar o primeiro.`.
      4. *FINISHED:* Scoreboard com placar final, aviso `Encerrada. Você acompanha até 7 dias após o término.` e acesso às estatísticas.
      5. *OFFLINE:* Detectado pelo cliente quando sem rede/internet. Banner `Você está sem internet. Mostrando dados de HH:MM.` e placar preservado com opacidade atenuada (`opacity: 0.6`).
      6. *403 ACCESS_REVOKED:* Erro imediato quando a concessão é removida pelo dono. Card com ícone de cadeado `Seu acesso foi encerrado. O dono da partida removeu seu acesso. Peça um novo convite.` e botão `Voltar ao início`.
      7. *404 INVITE_INVALID:* Card com link quebrado `Convite inválido ou expirado. Confira o link ou peça um novo ao dono da partida.` e botão `Voltar ao início`.
      8. *409 SPECTATOR_LIMIT:* Card com ícone de grupo `Esta partida está lotada. Já são 5 pessoas acompanhando. Peça ao dono para liberar uma vaga.` e botão `Tentar de novo`.
      9. *EMPTY (Dono):* Modal com 0 acompanhantes exibe `Acompanhando · 0 de 5`, card com ícone de adicionar pessoa `Ninguém acompanha ainda. Envie o link para quem quiser ver a partida.` e botão `Copiar link`.
      10. *500 / rede (Dono):* Falha ao gerar convite exibe banner de erro `Não foi possível criar o convite. Tente de novo.`, retém o rótulo digitado e botão de retry `Tentar de novo`.
    - Componentes criados e testados:
      - `src/components/spectate/SpectatorEmptyState.tsx` (≤ 100L)
      - `src/components/spectate/SpectatorStatusBanner.tsx` (≤ 100L)
      - `src/components/scoring/ShareSpectateWatcherRow.tsx` (≤ 100L)
      - Suíte de testes: `src/components/spectate/__tests__/spectator-states.test.tsx` (100% verde).
  - Testes: 13 suítes, 51 testes do ecossistema de spectate 100% verdes. R-03: 1039 arquivos de produção, 0 violações, 0 regressões. Typecheck: 0 erros. Design tests: 100% verdes.

---

## 2.6 Execução Unificada — Conclusão Integral (Etapa 0, Onda 1, Onda 2, Onda 3 e Onda 4) — 2026-10-29
- **Origem:** Execução e auditoria do plano mestre unificado `docs/PLANO_EXECUCAO_UNIFICADA.md`.
- **Etapa 0 (Endurecimento e Baseline Verde):**
  - Gerado `docs/BASELINE-2026-10-29.md` com 397 suítes, 3904 testes (100% verde), 0 skipped, 0 typecheck errors, 0 lint warnings, 0 violações R-03.
  - Backup Neon criado: branch `backup-pre-onda1` (`br-patient-queen-ac275d7i`) a partir de `production` (`br-weathered-bird-ac5auqof`).
  - Golden snapshots em `docs/golden/` validados.
- **Onda 1 (Contas, Perfis, Roteamento, Autorização e Chrome Compartilhado):**
  - **1.1 Segurança Crítica de Partidas:** Validadas rotas de autorização (`GET /api/matches/[id]`, `/state`, `/point`, `/finish`) operando sob `canReadMatch`/`canAnnotateMatch` com checagem estrita de `athletePlayerId` e autorização falha fechada (*fail-closed*).
  - **1.2 Roteamento Canônico e Middleware:**
    - `src/middleware.ts` e `src/middleware-auth.logic.ts`: removido código morto; usuários autenticados em `/login` são interceptados e redirecionados para seu `homeForProfile` canônico (`ADMIN -> /admin`, `SUPORTE -> /suporte`, `GESTOR -> /gestor`, `TREINADOR/ATLETA -> /dashboard`, `mcp: true -> /trocar-senha`).
    - Eliminada duplicação de `getAuthToken` em `middleware-auth.logic.ts`.
    - `POST /api/auth/login` atualizado para retornar `mustChangePassword` na raiz do payload JSON além do objeto de usuário.
  - **1.3 Layout Compartilhado e Navegação:**
    - `DashboardChrome` promovido a layout compartilhado unificado com topbar responsiva, hamburger e sidebar integrados em `/dashboard`, `/gestor`, `/suporte` e `/admin`.
    - Itens de rotas em desenvolvimento (`/atleta/*`, `/treinador/*`) mantidos com `badge: 'Em breve'` e `disabled: true`, respeitando estritamente a segregação de Treinador e Atleta.
    - Botões "Voltar" migrados para navegação por perfil via `homeForProfileString` ou histórico seguro `router.back()`.
  - **1.4 Design System Telemetry:**
    - Eliminadas 100% das classes legadas arbitrárias (`bg-gray-*`, `text-gray-*`, `bg-sky-*`, `bg-white`) em `/gestor`, `/suporte` e `/admin` (`stats-card.tsx`, `status-pages.tsx`, `avulsos-section.tsx`, `module-nav.tsx`, `editar-clube-modal.tsx`, `editar-gestor-modal.tsx`).
    - Módulos aderentes ao Level 3 do Design System Stitch (`telemetry-bg`, `telemetry-card`, `telemetry-blue`, `telemetry-text-primary`, `telemetry-border/20`).
- **Onda 2 (Painéis Gestor `/gestor` e Suporte `/suporte`):**
  - Isolamento rigoroso de tenant com `withAccessHandler` nas APIs (`/api/users`, `/api/cts/[id]/athletes`, `/api/invites/accept`, `/api/training-centers`).
  - Modelos e validações completas de PJ/CPF (`cnpj.validator.ts`, `cpf.validator.ts`, `TrainingCenter.status` com `PENDING`/`ACTIVE`/`SUSPENDED`).
  - Onboarding multi-etapas no `/signup` com transação atômica em `POST /api/auth/signup-gestor`.
  - Painéis operacionais do Gestor (cadastro de membros com senhas provisórias de 7 dias, links de primeiro acesso, partidas do clube) e Suporte (aprovação/suspensão de CTs, revogação de sessões ativas).
- **Onda 3 (Funcionalidade Core — Nova Partida, Duplicidade, Dashboard e Estatísticas):**
  - Nova partida com labels "Simples"/"Duplas", campo Data opcional sem aviso redundante e auto-preenchimento ao iniciar anotação.
  - Algoritmo de duplicidade imune a colisões de duplas vs simples.
  - Formatação e abreviação compacta de nomes de duplas (`abbreviateDoublesName`).
  - Scoreboard e MatchCard com renderização de sobrescrito padronizada de tiebreak.
  - Estatísticas Avançadas (D3 Fundo de Quadra, D4 Rally, D6 Golpes, D7 Momentum, D8 Breakdown por Set) 100% implementadas e cobertas por testes.
- **Onda 4 (UX, Qualidade e Limpeza Geral):**
  - Backend padronizado com mensagens legíveis de erro via `formatZodMessage`.
  - Frontend resiliente com `extractErrorMessage` e substituição de 100% dos `window.alert()` por toasts.
  - Saneamento completo de `console.*` de produção para o wrapper de telemetria `logger.*`.
  - Pausa inteligente no polling de 5s do painel de anotação com `document.visibilityState === 'hidden'`.
- **Métricas Finais Consolidadas:**
  - `pnpm test:strict`: **397 suítes passadas, 3910 testes passados (100% verde), 2 snapshots passados** (0 falhas, 0 skips).
  - `pnpm test:design`: **3/3 suítes passadas, 26/26 testes verdes**.
  - `pnpm spec:validate`: **82 rotas, 10 schemas, sem drift, consistência total**.
  - `check:r03`: **993 arquivos de produção, 0 violações, 0 regressões**.
  - `typecheck`: **0 erros de compilação**.
  - `lint`: **0 erros, 0 avisos**.

---

## 2.5 Alinhamento ao Design System Stitch (Court Precision Tech) e Segregação Treinador vs Atleta — 2026-10-28
- **Auditoria Stitch MCP:** Extraída a especificação canônica do Stitch (`Court Precision Tech`, asset `b1945ff952d84e4090726bd43b00300a`, projeto `1329349350691583873`).
- **Segregação de Personas:** Reforçado o desacoplamento de domínio entre Treinador e Atleta (ADR-0007, ADR-0008, ADR-0009). Em vez de redirecionar Treinador para `/atletas` genérico, as rotas sem interface desenvolvida foram marcadas com `disabled: true, badge: 'Em breve'` via helper puro `soon(...)` em `menu-items.ts`, eliminando erros 404 e preservando a integridade arquitetural.
- **Correções Executadas:**
  1. *Admin:* Corrigido bug de `opacity-20` nos containers de `admin-dashboard-chrome.tsx` e `admin-users-table.tsx` para `border-telemetry-border/20`; substituídos badges de cores arbitrárias em `admin-profile-options.ts` por tokens semânticos de telemetria; saneamento da mensagem de erro em `page.tsx` para `telemetry-error`.
  2. *Gestor:* Corrigida violação WCAG de contraste em `athletes-table.tsx` e `coaches-table.tsx` (`bg-telemetry-volt text-white` → `text-black font-bold`); migração de `tab-nav.tsx` e `managers-section.tsx` para tokens de telemetria; adequação completa de todos os modais (`cadastrar-membro-modal.tsx`, `cadastrar-membro-confirm-modal.tsx`, `cadastrar-membro-form.tsx`, `editar-atleta-modal.tsx`, `editar-treinador-modal.tsx`, `editar-clube-modal-gestor.tsx`, `link-copy-modal.tsx`) para Level 3 do Stitch (`bg-telemetry-card`, `border-telemetry-border/20`, `text-telemetry-text-primary`, `backdrop-blur-sm`).
- **Garantias de Engenharia:** 100% STE-DEV R-03 (0 violações em 992 arquivos), `typecheck` 0 erros, `test:design` 3/3 (26/26 testes verdes), 403 arquivos de teste sem skip/only.

---

## 2.4 Correção de Roteamento por Perfil, Autorização de Partidas e Inconsistências — 2026-10-27
- **Diagnóstico e Planejamento:** Salvo o plano [`docs/PLANO_CORRECAO_ROTEAMENTO_AUTORIZACAO_E_PERFIS_2026-10-27.md`](file:///C:/apps/RKT/docs/PLANO_CORRECAO_ROTEAMENTO_AUTORIZACAO_E_PERFIS_2026-10-27.md) e registrado em `docs/TASKS.md` (A0.6).
- **Escopo Mapeado:**
  1. Comparação incorreta de `Player.id` com `User.id` em endpoints de partida (`/matches/[id]`, `point`, `state`, `finish`);
  2. Autorização "falha aberta" caso o modelo de sessão esteja indisponível;
  3. Redirecionamento indevido no middleware e código inalcançável (`SUPORTE -> /suporte`);
  4. Falta de sidebar compartilhada em `/gestor`, `/suporte` e `/admin`;
  5. Links apontando para 404 em `club-matches-table.tsx` (`/match/${id}`);
  6. Migração de classes visuais arbitrárias para o design system (`telemetry-*`).
- **Estado:** Plano documentado e aprovado, pronto para execução em 4 etapas conforme priorização.

---

## 2.3 Pool de Busca, Cadastro de Atletas e Reivindicação de Identidade — 2026-10-27
- **Início dos Trabalhos:** Plano aprovado em `docs/archive/PLANO_POOL_BUSCA_CADASTRO_ATLETAS_E_CLAIM_2026-10-27.md` e registrado em `docs/TASKS.md` (A0.5).
- **Fase 0 (Characterization-First):** Criação de testes de caracterização para travar o comportamento prévio de `/api/auth/signup`, `/api/players` e `/api/athlete-claims`. ✅
- **Fase 1 (Segurança Imediata e Sanitização de Dados):** ✅
  - Correção de vulnerabilidade crítica P1 em `POST /api/athlete-claims` (exigência de autenticação e atribuição mandatória de `userId` a partir da sessão ativa).
  - Correção de bug P6 em `src/app/api/auth/signup/route.ts` (impedir gravação de e-mail na coluna `User.cpf`, validação estrita de dígitos de CPF).
  - `User.cpf` tornado opcional (`String? @unique`) via migration `20261027040000_make_user_cpf_optional`.
- **Fase 2 (Núcleo Puro e Actor):** ✅
  - `src/core/athlete/dedup.ts` — regras puras de desduplicação (`sameCpfHash`, `sameLast2AndDob`, `sameNameAndDob`, `isProbableDuplicate`, `findDuplicates`).
  - `src/core/access/pool.ts` — `resolvePoolScope` (CT vs ANY), `actorCtIds`, `maskNameForMinor`, `toPoolPlayerView`.
  - `src/core/athlete/athlete-code.ts` — `crypto.randomInt` (CSPRNG) substitui `Math.random`; `generateUniqueAthleteCode` com retry.
  - `src/core/access/types.ts` — `Actor.athleteCtIds`.
  - `src/services/access-actor.logic.ts` + `accessService.ts` — `buildActor` mapeia `athleteProfile.playerCts` → `athleteCtIds`.
  - Migration `20261027020000_pool_cpf_athletecode` — `Player.cpfHash`, `Player.cpfLast2`, `Club.ctId` + índice único + FK.
- **Fase 3 (Busca no Pool e Escopo):** ✅
  - `src/core/access/pool.ts` — `maskNameForMinor`, `toPoolPlayerView`, `PoolPlayerRow`/`PoolPlayerView`.
  - `src/services/player-service-pool.logic.ts` — `listPoolPlayers` com busca por nome + filtro por CT + paginação por cursor.
  - `src/app/api/players/pool/route.ts` — `GET /api/players/pool` com auth, escopo, mascaramento de menores, DTO mínimo.
  - Migration `20261027030000_pool_search_index` — índice em `Player.name`.
- **Fase 4 (Cadastro de Atleta):** ✅
  - `src/schemas/player.ts` — `CreatePlayerInputSchema` com `cpf`, `myClub`, `ctId`.
  - `src/services/player-create.logic.ts` — `createPlayer` com hash de CPF, geração de `athleteCode` seguro, `identityStatus` (PROVISIONAL/CONFIRMED), `PlayerCT` (ACTIVE/PENDING).
  - `src/app/api/players/route.ts` — `POST` com `getActor`, `resolvePoolScope`, `actorCtIds`, `actorCreatingProfile`.
- **Fase 5 (Claim Automático e Cadastro de Conta):** ✅
  - `src/app/api/auth/signup/signup-post.logic.ts` + `signup-claim.logic.ts` — claim automático por CPF+birthDate, validação de maioridade, `blocked-minor` para menores.
  - `src/app/api/auth/signup/me/route.ts` — `GET /api/athlete-claims/me` para o atleta consultar seus claims.
- **Fase 6 (Unificação de Clubes e Venues):** ✅
  - `src/app/api/clubs/route.ts` — `POST` aceita `ctId` (validação CUID via Zod).
- **Fase 7 (Frontend Nova Partida e Modais):** ✅
  - `src/app/match/new/useNewMatchState.ts` — estados `slotAffiliation`, `ctId`, `availableCts`; `initialSlotAffiliation()` com defaults `NOT_OWN`; `updateSlotAffiliation`.
  - `src/app/match/new/components/my-club-selector.tsx` — select de CT para definir "meu clube".
  - `src/app/match/new/components/slot-affiliation-toggle.tsx` — toggle por slot "Meu clube" / "Outro clube".
  - `src/app/match/new/slot-affiliation.ts` — `SlotId`, `SlotAffiliation` ('OWN' | 'NOT_OWN'), `SlotAffiliationMap`, `isOwnSlot`, `filterAthletesForSlot`.
  - `src/app/match/new/components/PlayerSelection.tsx` — filtro de atletas **por slot** via `filterAthletesForSlot`; cada slot tem afiliação própria.
  - `src/app/match/new/components/AthleteDropdown.tsx` — prop `affiliation` + `onAffiliationChange` + `canSelectOwn`; renderiza `SlotAffiliationToggle` por slot.
  - `src/app/match/new/components/athlete-dropdown-panel.tsx` — exibe `a.club` abaixo do nome do atleta.
  - `src/app/match/new/MatchNewModals.tsx` — `modalMyClub` derivado de `newAthleteFor` + `isOwnSlot(slotAffiliation[slot], ctId)`.
  - `src/app/match/new/components/NewAthleteModal.tsx` + `use-new-athlete-modal.ts` — envia `myClub`/`ctId` ao criar atleta apenas quando `myClub && ctId`.
  - `src/app/api/players/players-post.logic.ts` — `shouldLink = Boolean(myClub)` (removeu `|| (isClubStaff && cts.length > 0)`); staff não vincula automaticamente.
  - `src/app/api/matches/match-ct-access.logic.ts` — `assertCtMembership` aceita ATLETA vinculado ao CT.
- **Fase 8 (Suporte e Resolução de Conflitos):** ✅
  - `src/services/player-merge.logic.ts` — `mergePlayers` com transferência de partidas, PlayerCTs, `mergedIntoId` e auditLog.
  - `src/app/api/players/merge/route.ts` — `POST /api/players/merge` com permissão `platform:player:merge`.
  - `src/app/api/athlete-claims/me/route.ts` — `GET /api/athlete-claims/me`.
- **Fase 9 (Testes Rigorosos):** ✅ — `typecheck` 0 erros · `check:r03` 0 regressões · `lint` 0 erros (apenas warnings jsx-a11y pré-existentes).
- **Fase 10 (Documentação):** ✅ — ADR-0010/ADR-0011 em `docs/ARCHITECTURE.md`; contratos em `src/app/api/CONTRACTS.md`; PRD, glossario, TASKS e MEMORY atualizados.
- **Opção A — Afiliacao por slot/atleta (nova partida):** ✅ — implementado em `src/app/match/new/`. Cada slot (P1, P2, P1Partner, P2Partner) tem sua propria escolha de clube ("Meu clube" / "Outro clube") via `SlotAffiliationToggle`. Heuristica de padrao: nenhum slot forcado a OWN; o anotador escolhe por slot (P1 pode ser OWN ou NOT_OWN; qualquer um dos 4 em duplas). Backend: `shouldLink = Boolean(myClub)` respeita a intencao da UI (sem vinculo automatico para staff). Dropdown exibe o clube ao lado do nome. Default: todos `NOT_OWN` (sem vinculacao presume adversario/avulso). Ao selecionar "Outro clube" com ctId definido, o filtro exclui atletas do meu clube (lista apenas atletas de outros clubes, com nome e clube visiveis); novo atleta eh criado sem vinculo algum.

## 2.3 Cadastro de Atleta de Outro Clube (UF, Cidade e Clube) — 2026-11-01

Plano `docs/archive/PLANO_CADASTRO_ATLETA_OUTRO_CLUBE_UF_CIDADE_2026-11-01.md` executado:

- **Fase 1 (Módulo Central de UFs e Validações):** ✅
  - `src/core/athlete/brazilian-states.ts` — `BRAZILIAN_UFS` (27 UFs), `BrazilianUF` type, `isBrazilianUF` validator.
  - `src/schemas/player.ts` — `CreatePlayerInputSchema` e `UpdatePlayerInputSchema` com `club`, `city`, `state` (enum UF), `isExternalClub`.
  - `src/core/athlete/__tests__/brazilian-states.test.ts` — 4 testes (contagem, lista completa, valido/invalido).
- **Fase 2 (Componente Reutilizável de Origem):** ✅
  - `src/components/athlete/AthleteOriginSection.tsx` (88 linhas, respeita R-03) — grid 3 colunas: UF (select), Cidade (input), Clube do Atleta (input). Tokens Telemetry (`bg-telemetry-elevated`, `border-white/10`, `text-telemetry-text-primary`). Dual-theme.
  - `src/components/athlete/__tests__/AthleteOriginSection.test.tsx` — 6 testes (renderizacao, emissao de valores, UF invalida, valores iniciais).
- **Fase 3 (Integracao no Modal "Novo Atleta"):** ✅
  - `src/app/atletas/types.ts` — `AthleteForm` e `EMPTY_ATHLETE_FORM` com `uf`, `city`, `club`.
  - `src/app/match/new/components/use-new-athlete-modal.ts` — quando `myClub && ctId`, busca dados do clube via `GET /api/gestor/club` e preenche automaticamente `uf`, `city`, `club` no formulário; envia `myClub: true` + `ctId` no payload. Quando não é "Meu clube", envia `myClub: false`.
  - `src/app/match/new/components/NewAthleteModalForm.tsx` — integra `AthleteOriginSection` na secao "1. Cadastro"; passa `readOnly={myClub}` para travar os campos de origem quando eh atleta do proprio clube.
  - `src/app/components/athlete/AthleteOriginSection.tsx` — agora reage a mudancas nas props `uf`/`city`/`club` (useEffect de sincronizacao) e aceita prop `readOnly` para desabilitar os campos.
  - `src/app/atletas/edit-athlete-modal.submission.ts` + `edit-athlete-modal.types.ts` — `club`, `city`, `state`, `isExternalClub` no payload de salvamento.
- **Fases 4-6 (Treinador Avulso / Clube / Gestor):** ✅ — cobertas pelo componente reutilizavel `AthleteOriginSection` integrado ao modal compartilhado de cadastro de atleta. Backend `players-post.logic.ts` ja trata `myClub: false` sem gerar `PlayerCT`. Quando `myClub=true`, os campos de origem vem preenchidos com os dados do proprio clube (somente leitura).
- **Fase 7 (Exibicao da Origem em Cards):** ✅ — cards do dashboard exibem badge "Meu clube" / "Outro clube" / "Sem clube" ao lado do nome de cada atleta (comparando `club` com `ctId` do usuario logado).
- **Indicacao de clube nos cards de partida (dashboard):** ✅ — os cards de partida no dashboard (`src/components/dashboard/`) exibem se cada atleta eh "Meu clube" ou "Outro clube" ao lado do nome.

---

## 2.2 Enriquecimento de Perfis — 2026-10-27
- **Fase 1 (Gestor de Clube):**
  - Implementada redefinição de senhas com modal de cópia de link (`LinkCopyModal`) integrado na UI (`AthletesTable` e `CoachesTable`). Corrigido endpoint `regenerate-link` para persistir `tokenHash` em `password_reset_requests` e aceitar IDs cruzados (`playerCT.id` / `player.id` / `user.id`).
  - Edição de treinadores e atletas na UI conectada com pré-preenchimento real e chamadas `PATCH /api/gestor/athletes/[id]` e `PATCH /api/gestor/coaches/[id]`.
  - Visualização de partidas do clube via novo endpoint `GET /api/gestor/matches`, componente `ClubMatchesTable` e nova aba no `TabNav` e contadores no dashboard.
  - Tela `/trocar-senha` adaptada para fluxo com token direto.
- **Fase 2 (Suporte RKT):**
  - Gestão de clubes com ciclo de vida completo: Aprovação (`PENDING` -> `ACTIVE`), Bloqueio (`ACTIVE` -> `SUSPENDED`) com revogação imediata de sessões ativas dos gestores (`bumpSessionVersion`), e Desbloqueio/Reativação (`SUSPENDED` -> `ACTIVE`). Edição de dados do clube habilitada em `ClubesSection` e `EditarClubeModal`.
  - Gestão de gestores em `GestoresSection` com emissão direta de link seguro de redefinição de senha (`POST /api/support/password-resets`) e modal de cópia (`LinkCopyModal`), revogação de sessões ativas com confirmação (`POST /api/users/[id]/revoke-sessions`) e edição cadastral via `EditarGestorModal`.
  - Proteção de contas privilegiadas: Suporte não pode emitir reset para ADMIN ou outros usuários SUPORTE (`isProtectedTarget`).
  - Auditoria completa em todas as ações de suporte (`CLUBE_APROVADO`, `CLUBE_SUSPENSO`, `CLUBE_REATIVADO`, `PASSWORD_RESET_TOKEN_ISSUED`).
- **Fase 4 (Aba "Externos" no Suporte):** ✅
  - Nova aba `externos` no `/suporte` listando atletas e clubes sem conta no sistema (cadastrados como adversários em partidas).
  - `src/app/api/suporte/externos/route.ts` — endpoint `GET /api/suporte/externos` que busca `Player` sem `userId` com `club`, `city`, `state`, `gender`, `age`; agrega clubes distintos com localização.
  - `prisma/schema.prisma` — model `Player` ganhou campos `city` e `state`.
  - `src/app/suporte/types.ts` — `SuporteModule` inclui `'externos'`; `SuporteData` inclui `externos: ExternosData | null`; novos tipos `ExternalAthlete`, `ExternalClub`, `ExternosData`.
  - `src/app/suporte/externos-section.tsx` — seção com duas subseções: Atletas Sem Conta (tabela com nome, clube, cidade, estado, gênero, idade) e Clubes Mencionados (tabela com clube, cidade, estado, qtd atletas).
  - `src/app/suporte/suporte-header.tsx` — novo contador "Atletas Externos".
  - `src/app/suporte/suporte-tab-nav.tsx` + `module-nav.tsx` — nova aba "Externos".
  - `src/app/suporte/page.tsx` — busca `GET /api/suporte/externos` no carregamento inicial.
  - `src/app/suporte/suporte-page-content.tsx` — renderiza `ExternosSection` quando `module === 'externos'`.
- **Fase 3 (Menus Dinâmicos por Perfil, Controle de Rotas e Contraste do Admin):**
  - Resolvido contraste e legibilidade no painel `/admin` (`admin-users-table.tsx` e `admin-dashboard-chrome.tsx`), eliminando herança de texto branco sobre fundo branco.
  - Sincronização de perfis aprimorada no backend (`admin-service-role-sync.logic.ts`) para `GESTOR`, `TREINADOR`, `SUPORTE`, `ATLETA_CLUBE` e `ATLETA_AVULSO` com desativação de memberships conflitantes.
  - Helper `getInitialRole` no frontend garantindo que a edição no admin pré-selecione o perfil real do usuário.
  - Menus laterais dinâmicos via `buildMenu(ctx)` e `mapMenuSectionsToSidebar`, mapeando rotas diretamente para abas ativas (`/gestor?tab=coaches`, etc.) e sub-módulos (`/suporte?module=gestores`, etc.).
  - Route guards por perfil no middleware para `/admin`, `/suporte` e `/gestor`.
  - 100% dos testes de menus e dashboard passando (`HamburgerMenu.test.tsx` 14/14, `DashboardAnnotatedView.test.tsx` 6/6, `training-centers` 3/3).
  - 0 violações de R-03 e 0 erros de TypeScript.

---

## 1. Estado Atual do Projeto

| Dimensão | Situação |
|---|---|
| Branch | `main` |
| Working tree | Alterações do backend da Fase 3 validadas; migration aplicada localmente e em produção |
| Foco atual | **Pool de Busca, Cadastro de Atletas e Reivindicação de Identidade (A0.5) concluído:** Fases 0–10 implementadas e validadas (typecheck 0 erros, testes verdes, R-03 respeitado). Próximo foco: A1 (Estatísticas do Jogador) ou A0.7 (Edição de Clubes/Gestores/CTs). |
| Docs de processo | `AGENTS.md` (índice) + estritamente os 6 arquivos-canônicos em `docs/` |

---

## 2.1 Implementação em andamento — 2026-10-26

- Implementados schema/migration aditiva, rotas para torneios, vínculos treinador-atleta e pedidos de acesso do suporte; partidas novas aceitam `ctId` somente para membro ativo do CT.
- Relatórios passam por `report:view` e visibilidade por criador, anotador, equipe do CT, atleta/responsável ou treinador com vínculo ativo. Comentários, metadados de áudio, áudio e eventos privados ficam restritos a criador/anotador/equipe do CT.
- Validados: Prisma, TypeScript, lint focado, `check:r03` e testes focados (223 testes verdes).
- Migration `20261026020000_phase3_relationships_and_tournaments` aplicada localmente e em produção.
- Produção não tinha `_prisma_migrations`; o schema físico foi comparado com o Prisma antes da reconciliação. Foram registradas como aplicadas somente as migrations já refletidas fisicamente, incluindo `20261026013018_papers_25102026`; o SQL destrutivo dessa migration **não foi executado**. Aplicadas por `migrate deploy` as migrations pendentes de RLS, fundação de acesso e Fase 3, sem reset.
- Pós-aplicação: 18/18 migrations aplicadas, diff Prisma sem alterações pendentes e contagens preservadas (9 usuários, 41 atletas, 25 partidas e 600 pontos). As tabelas novas da Fase 3 estão vazias; o backfill criou a associação de plataforma do ADMIN e marcou 8 usuários como operacionais.
- **Alinhamento de RLS & Infraestrutura:** As políticas de RLS estão aplicadas no banco como camada de defesa em profundidade, mas a segurança primária e o isolamento multi-tenant residem no código (`withRLSHandler`, `withPermissionHandler` e filtros de ownership nos services). Para atender ao Free Tier (Vercel + Neon Pooler) sem risco de timeouts ou esgotamento de conexões, a aplicação conecta via role padrão (`neondb_owner`) e o middleware redundante de `set_config` foi removido de `src/lib/prisma.ts` (economizando 50% das queries). TD-003 encerrado.
- **Remediação de Acesso, Segurança e Consistência Funcional (Fases 0 a 5 Concluídas):** Salvo plano canônico em `docs/archive/PLANO_REMEDIACAO_ACESSO_E_SEGURANCA.md`.
  - **Fase 0 (Estancamento Crítico):** Liberação de `PUBLIC_ROUTES` no middleware (`signup`, `forgot`, `reset-password`), blindagem com `withAccessHandler` e auditoria em `password-resets`, `memberships`, `athlete-claims/decide`, sanitização de `users/[id]/export` (sem vazamento de `passwordHash`), e proteção com anonimização real e revogação de sessões em `users/[id]/anonymize`, `revoke-sessions` e `operate`.
  - **Fase 1 (Restauração da API de Atletas):** Restauração integral de `GET` e `POST` em `/api/players` e `GET`, `PUT`, `DELETE` em `/api/players/[id]` conectando os módulos `player-put.logic.ts` e `player-delete.logic.ts`. 100% dos testes de `/api/players` recuperados (55/55 testes verdes).
  - **Fase 2 (Unificação de Papéis e Contexto de Operação):** ADMIN legado conciliado em `accessService.ts` e `access-actor.logic.ts` com papel `PLATAFORMA/ADMIN`. Geração de token com `deriveLegacyRole` sincronizada com memberships. Fallbacks de Actor e resiliência em `accessService.ts` e `match-access-service.ts`. 100% dos testes de `/api/matches` verdes (36/36 suítes, 214 testes).
  - **Fase 3 (Blindagem das 31 Rotas Scaffold com withAccessHandler):** Lote A (`/api/training-centers`, `/api/clubs`, `/api/link-invites`, `/api/invites/accept`), Lote B (`/api/players/merge` com `auditLog`, `/api/players/provisional`), Lote C (`/api/guardians/link`, confirmação de vínculo em `/api/guardians/link/[id]/confirm`, revogação em `/api/guardians/link/[id]`, consentimento em `/api/consents` e `/api/consents/[id]`).
  - **Fase 4 (Integridade de Dados e Menores):** Migration `20261026030000_unique_coach_avulso` criando índice parcial de unicidade para treinadores avulsos (`WHERE ctId IS NULL AND status = 'ACTIVE' AND kind = 'TREINADOR'`). Proteção de dados sensíveis de menores em conformidade com ECA/LGPD.
  - **Fase 5 (UI/UX e Telas):** Tela de login atualizada com links de cadastro e recuperação de senha. Novas telas `/signup` e `/forgot` criadas com feedback interativo e modularizadas (<100 linhas). Hook client-side `useAccess` implementado e coberto com testes unitários em jsdom.
  - **Garantias de Engenharia:** `check:r03` com 0 violações e 0 regressões em 877 arquivos de produção. `tsc --noEmit` com 0 erros. Suíte de testes verdes.

- **Menus por Perfil e Pool de Ecossistema (Fase 0 concluída em 2026-10-26, somente documentação):** plano canônico em `docs/PLANO_MENU_PERFIL_POOL_ECOSISTEMA_2026-10-26.md`; ADR-0008 (pool global, clube como vínculo) e ADR-0009 (menu como soma de seções por vínculo) em `docs/ARCHITECTURE.md`. Decisões fechadas: atleta de clube só sai quando o gestor desvincula; treinador avulso anota partidas e vê relatórios dos atletas que acompanha; gestor vê e anota partidas do clube; Financeiro e Torneios aparecem desabilitados ("Em breve"); menu do Admin inalterado. Próxima etapa: Fase 1 (`/api/auth/me` aditivo + `buildMenu`).
- **Edição de Clubes, Gestores, Dados do CT e Gestão de Treinadores e Atletas (Planejada em 2026-10-27):** plano canônico salvo em `docs/PLANO_EDICAO_SUPORTE_E_GESTOR_2026-10-27.md`. Estruturado em 4 frentes: (1) `/suporte` > Clubes e CTs com botão "Editar" funcional em ativos, modal de edição e projeção de dados cadastrais da PJ; (2) `/suporte` > Gestão de Gestores com botão de edição de usuário, correção do RBAC para permissão `platform:users:manage` pelo perfil `SUPORTE` e renderização condicional/reativa de `EditarGestorModal`; (3) `/gestor` > Dados do Clube com rota dedicada `GET` e `PATCH /api/gestor/club`, exibição dos dados reais da PJ do cadastro e trava estrita de CNPJ imutável; (4) `/gestor` > Treinadores e Atletas com modal unificado de cadastro (Nome, CPF, Data de Nascimento e seletor Treinador/Atleta), botões de edição de linha e suporte à seleção por linha nas tabelas.



---

## 2. Últimos Commits (linha do tempo recente)

| 2026-10-25 | `HEAD` | **Scoring (Chip Compacto de 2º Saque Inline sob o Card do Sacador)** — Migração do badge de 2º saque da barra inferior (ActionBar) para a coluna do sacador (ServeInlineControls), renderizando uma linha divisória com chip centralizado (`2º Saque`) entre o `PlayerCard` e os botões de ação de saque (`Ace`, `Out`, `Net`) exclusivamente durante o 2º serviço (`step === 'second'`). A barra inferior fica limpa contendo apenas os checkboxes de configuração (`Detalhes do ACE` e `Detalhes da DF`). Zero impacto em banco de dados ou schemas (ajuste puramente de apresentação UI). DoD: typecheck ✓ (0 erros) · 224/224 testes de scoring passando ✓ · STE-DEV R-03 (módulos ≤ 100 linhas). |
| 2026-10-25 | `HEAD` | **Scoring (Ace/Out/Net sob o card do sacador + detalhes inline, sem scroll interno)** — (i) `ServeActionButtons`, `ServeInlinePanel` e `ServeInlineControls` renderizam Ace/Out/Net logo abaixo do `PlayerCard` do sacador (coluna acompanha `p1IsServing`/`p2IsServing`); (ii) o `ServerEffectModal` (overlay) foi substituído por painel inline que expande no lugar, com as mesmas opções de efeito/direção: Ace segue "Detalhes do ACE"; Out/Net seguem "Detalhes da DF" no 1º e no 2º saque; sem o checkbox, registra direto; (iii) estado em `use-serve-inline-controls.ts` (checkboxes + painel aberto), com fechamento automático quando o ponto muda, outro modal abre ou o sacador troca; Cancelar só fecha o painel (não chama `cancelServeError`, preserva o 1º saque); (iv) handlers `recordServeErrorWithModal`→`startServeErrorDetails` e novo `dismissServeErrorDetails`; (v) `ActionBar` ficou só com selo de saque + checkboxes; (vi) `ScoringPlayArea` sem `overflow-y-auto`: alturas via `clamp(..dvh)` e, com painel aberto, blocos secundários recolhem em telas baixas (`globals.css`, `data-serve-collapse`); (vii) arquivos do modal arquivados com sufixo `.archive`. Mínimo de altura dos botões: 40px em telas muito baixas. DoD: validar localmente `typecheck`, `test:design` e os testes de scoring (ver comando na entrega). |
| 2026-10-25 | `HEAD` | **Scoring & Live Counters (Registro de Break Point e Game Point em 40/40 no modo No-Ad)** — Correção do reconhecimento e cômputo estatístico no ponto decisivo (40/40) em formatos No-Ad (`BEST_OF_3_NO_AD` e `SHORT_SET_2V2_NO_AD`): (i) `point-ball-context.logic.ts`: extensão de `isPointDecisiveDeuce` para detecção de qualquer formato No-Ad e atualização de `isGameBall` aceitando `format` e retornando `true` em ponto decisivo; (ii) `point-snapshot.logic.ts` e `scoring-logic.ts`: propagação de `format` em `derivePointSnapshot` e `enrichPointsFromHistory`, garantindo que os pontos gravados na timeline carreguem `isBreakPoint: true` (para o devolvedor) e `isGameBall: true` (para ambos); (iii) `live-counters.logic.ts` e `use-scoring-page-chrome.ts`: passagem do formato da partida para `computeLiveCounters` e `computeAdvancedStats`, refletindo instantaneamente as oportunidades e conversões de break point na célula de resumo do grid de 'Estatísticas ao Vivo' e no modal 'Resumo do Set'; (iv) `return-stats.ts`, `serve-stats.ts`, `set-summary-service.logic.ts` e `timeline-rebuild.ts`: suporte resiliente com fallback bilateral (`isBpForPlayer` / `isBpAgainstServer` e `isPointDecisiveDeuce`) para garantir retrocompatibilidade com pontos gravados e reconstrução da timeline. 100% STE-DEV R-03 (módulos ≤ 100 linhas). Testes 100% verdes: 357/357 suites, 3.482 testes passando, zero erros no `typecheck` e zero issues no `lint`. |
| 2026-10-25 | `HEAD` | **Scoring (Otimização de Duração do Rallye nos Detalhes do Ponto)** — Remoção da opção redundante `1-4 bolas` das pills de seleção no modal `PointDetailsModal` (`DURACAO_OPTIONS`), disponibilizando apenas `5-8 bolas` e `+9 bolas`. Qualquer ponto sem indicação de rali longo assume o padrão canônico de rali curto (`1-4 bolas`). Habilitação de toggle na seleção de duração (`Action SET_DURACAO` aceitando `RallyDuration | null`), permitindo desmarcar uma opção tocando nela novamente. Preservação total de retrocompatibilidade de `opcao_1` em schemas e relatórios históricos. 100% STE-DEV R-03 (módulos ≤ 100 linhas). Testes 100% verdes: 356/356 suites, 3.474 testes passando, zero erros no `typecheck` e zero issues no `lint`. |
| 2026-10-25 | `HEAD` | **Scoring (Aproach FH / BH e Efeito Dinâmico nos Detalhes do Ponto)** — Extensão dos detalhes do ponto para registro fidedigno de aproachs: (i) Inclusão de `approach_fh` ("Aproach FH") e `approach_bh` ("Aproach BH") no enum canônico Zod `RallyGolpeSchema` e `GOLPE_LABELS`; (ii) Disponibilização condicionada na cascata do `PointDetailsModal` exclusivamente para: `passada > erro_forcado` e `rede > winner`; (iii) Lógica dinâmica de efeito em `shouldShowEfeito`: enquanto voleios diretos permanecem sem efeito, a seleção de um aproach em `rede > winner` exibe a seção de efeito com as opções `topspin`, `slice` e `flat`; (iv) Classificação estatística em `stroke-matrix-classify.logic.ts` mapeando aproachs para a linha correspondente da tabela matricial de 12 golpes e atribuindo forehand/backhand para estatísticas de pressão e rede em duplas; (v) Labels compactos na timeline (`Ap FH`, `Ap BH`) e validação transparente sem migrations no banco de dados (já armazenado como JSON de anotações). 100% STE-DEV R-03 (módulos ≤ 100 linhas). Testes 100% verdes: 356/356 suites, 3.473 testes passando, 0 skips, zero erros no `typecheck` e zero issues no `lint`. |
| 2026-10-25 | `HEAD` | **Estatísticas Avançadas (Fases 1 a 5 — `docs/archive/Plano – Estatísticas Avançadas.md`)** — Execução integral das 5 fases de reformulação técnica e alinhamento à planilha ITF/ATP de 24/out/26: (i) Fase 1: 15 correções estruturais (ralis 1-4/5-8/+9, Ace/DF fora de winners/ENF de rali, Game Points e Set Points por jogador e dinâmicos por formato, Ponto Decisivo No-Ad duplo e break point para devolvedor, subidas e passadas bilaterais, breakdown por set com tiebreak formatado e p2Games corrigido, momentum sem corte artificial, resumo por games fechados, piso Grama, proteção de game incompleto, alinhamento CSV e unificação de resumo do set); (ii) Fase 2: 9 seções canônicas da planilha implementadas na íntegra com cálculos puros em `src/core/report/` e apresentação em `src/components/report/` (Saque, Devolução sem DF e com % retorno em quadra, Fundo de Quadra por ralis, Rally, Rede e Passada, Pontos de Pressão, Definição do Ponto sem Ace/DF, Tabela Matricial de 12 Golpes, Momentum); (iii) Fase 3: Cálculo canônico de tempo total e tempo efetivo (`MAX_GAP_SECONDS = 90`, descartando pausas >90s e transições entre sets); (iv) Fase 4: Cabeçalho superior completo da aba Avançadas (`AdvancedStatsHeader`) com metadados do evento, piso, clima e tempos; (v) Fase 5: Desdobramento individual de estatísticas por atleta em duplas (`computeDoublesPlayerStats` e `DoublesPlayerBreakdownSection` por `serverId`, `hitterId` e `courtSide`). Cumprimento estrito de STE-DEV R-03 (módulos ≤ 100 linhas). DoD: `typecheck` ✓ (0 erros) · `test:design` 3/3 (26/26) ✓ · `lint` 0. |
| 2026-10-22 | `HEAD` | **Scoring (Correção de Set Fantasma 0-0 no Placar Dinâmico)** — Correção em `src/core/scoring/game-processing.ts` (`onGameWon`): remoção da checagem legada `currentSet.player1 === 0 && currentSet.player2 === 0`, que empilhava indevidamente um novo set via `.push()` quando o set inicial já existia no array `state.sets` (como no caso pós-edição de placar ou inicialização antecipada), fazendo o 1º set ficar congelado em 0-0 e o jogo em andamento ser exibido no Set 2. A condição foi unificada para usar estritamente `isNewSet` provido por `resolveActiveSet`. Adição de teste unitário de regressão e saneamento da partida no banco de dados local (`cmvj3l0bu0002bfe4c7mbud9w`). DoD: `typecheck` ✓ (0 erros) · 46/46 suites core/scoring (614/614) ✓. |
| 2026-10-22 | `HEAD` | **Suporte Completo a Duplas (Fases A a H — `docs/archive/PLANO_DUPLAS_2026-10-21.md`)** — Implementação end-to-end com 100% de retrocompatibilidade com simples: (i) Fase A: gravação defensiva e validação atômica; (ii) Fase B: núcleo puro de regras ITF de duplas em `src/core/scoring/doubles.ts` (ordem de saque A1→B1→A2→B2, tiebreak A1(1)→B1(2)→A2(2)→B2(2), lados fixos de devolução no set, deuce no-ad com escolha do devolvedor pela dupla receptora, ajuste de formação entre sets); (iii) Fase C: persistência Prisma com `matchType`, `player1PartnerId`, `player2PartnerId`, `doublesSetup`, migrations e rotas `/point`, `/arrangement`, `/state`, `/report`; (iv) Fase D: tela de nova partida com seleção de 4 atletas distintos e modal de formação inicial; (v) Fase E: UI de `/scoring` com indicador luminoso de sacador ativo, badge de devolvador ativo, `PointDetailsModal` com seleção de quem bateu e escolha de lado de devolução no deuce no-ad, e `DoublesArrangementModal` entre sets; (vi) Fase F: modal Editar Placar preservando rotação e estado de duplas; (vii) Fase G: timeline e relatório exibindo nomes e estatísticas de duplas, iniciais de sacador e time (`RF/ND`), e cards do dashboard; (viii) Fase H: 100% dos testes estritos passando (0 skips, 0 only, 613/613 core tests, 40/40 doubles tests, 234/234 UI tests, `tsc --noEmit` 0 erros). |
| 2026-10-20 | `HEAD` | **Report (Header fixo com rolagem inferior)** — Fixação do cabeçalho da tela de relatório (`ReportHeader` em `report-view-header.tsx`) com `sticky top-0 z-30 bg-telemetry-card/95 backdrop-blur-md border-b border-white/10 shadow-md`, permitindo que as abas (`TabBar`), estatísticas e a tabela de pontos da `Timeline` rolem suavemente por baixo do cabeçalho de identificação e metadados da partida. DoD: `typecheck` ✓ (0 erros) · `test:design` 3/3 (26/26) ✓ · `ReportPage.view.test.tsx` 3/3 ✓. |
| 2026-10-20 | `HEAD` | **Scoring (Detalhes do Ponto: Duração 1-4/5-8/+9 e despoluição visual)** — (i) Atualização dos intervalos de duração do rali no modal `PointDetailsModal` (`DURACAO_OPTIONS` em `point-details-logic.ts`) de `3 a 6`, `7 a 10`, `Mais de 11` para `1-4 bolas`, `5-8 bolas` e `+9 bolas`, unificando a entrada de dados com os padrões da ATP/ITF e o cálculo estatístico de ralis (`pressure-shot-stats.ts: short <= 4, medium 5-8, long >= 9`); atualização de `duracaoLabel`, `trocasFaixaLabel` em `timeline-format.ts` e legenda em `timeline-legend.tsx`; (ii) remoção do componente `PointDetailsBreadcrumb` e scroll handler em `PointDetailsModal.tsx`, eliminando duplicação visual e barra de rolagem horizontal desnecessária abaixo do `WinnerInfo`. DoD: `typecheck` ✓ (0 erros) · `test:design` 3/3 (26/26) ✓ · `point-details-logic.test.ts` 43/43 ✓ · `timeline-utils.trocas-faixa.test.ts` 4/4 ✓ · `SectionRenderer.test.tsx` 28/28 ✓ · `PointDetailsModal.characterization.test.tsx` 60/60 ✓ · `PointDetailsModal.test.tsx` 4/4 ✓. |
| 2026-10-20 | `0961f7b` | **Scoring (Indicador de Saque em Match Tie Break)** — Correção do indicador de sacador (`p1IsServing` / `p2IsServing` e `effectiveScoreState.server`) no hook `useScoringPageDerived`: remoção da sobrescrita cega quando `totalGames === 0`, restringindo a imposição do `initialServerId` estritamente a estados virgens (`isVirginState`: sem games completados, sem pontos no game atual e sem pontos no tiebreak). Garante que a alternância ponto a ponto calculada pelo `ScoringEngine` em `MATCH_TB_10` seja refletida visualmente em tempo real nos cards de jogador e no placar. DoD: `typecheck` ✓ (0 erros) · teste de regressão `useScoringPageDerived.server-tiebreak.regression.test.ts` 3/3 ✓ · suites derivadas 6/6 ✓ · engine serverId 6/6 ✓. |
| 2026-10-18 | `HEAD` | **Alinhamento Stitch (Court Precision Tech)** — Implementação das melhorias ergonômicas e gaps identificados via StitchMCP: (i) tokens e utilitários de elevação luminosa `shadow-telemetry-volt` e `shadow-telemetry-blue` no Tailwind e CSS variables para Dark/Light; (ii) padronização de touch targets na `ActionBar` para `min-h-[48px]` com espaçamento estrito de 8px; (iii) isolamento físico do botão `↩ Voltar` no flanco esquerdo com controles secundários agrupados à direita; (iv) novo componente de navegação ágil `PointDetailsBreadcrumb` no topo do modal de detalhes com salto direto por seção; (v) saneamento de resíduos de classes genéricas `gray-*`/`blue-*` em `pills-component.tsx` e `SectionRenderer.tsx`. DoD: `typecheck` ✓ (0 erros) · `test:design` 3/3 (26/26) ✓ · `PointDetailsBreadcrumb.test.tsx` 3/3 ✓ · `ActionBar.characterization.test.tsx` 11/11 ✓ · `PointDetailsModal.test.tsx` 64/64 ✓. |
| 2026-10-17 | `767bbad` | **Consistência Editar Placar, ACE/DF, Timestamp e Reidratação (Fases 0 a 5)** — (i) Fase 1: correção de `ScoringEngine.fromSerialized` para não forçar `initialServerId` indevidamente em `MATCH_TB_10` ou placares com pontos/jogos iniciados; modo sombra defensivo em `POST /point` (`logger.warn`) para divergência de sacador; script de auditoria `scripts/audit-server-id.ts` (37 partidas recuperadas/auditadas); (ii) Fase 2: reidratação pós-F5 do engine via replay de `PointLog` desde a última `MatchScoreEdit` (D4), habilitando botão "Voltar" (Undo) até a fronteira da edição; persistência de `pointLogSequenceAtEdit` em `MatchScoreEdit.newScoreState`; manutenção da sessão de anotação ativa após edição de placar em andamento (D6); (iii) Fase 3: contadores estatísticos separados: ACE não conta como winner de rally (D1), DOUBLE_FAULT não conta como UFE de golpe de rally e entra como erro do sacador nos erros totais do set (D2); (iv) Fase 4: validação e persistência do timestamp do cliente com proteção contra clock drift futuro e clamp seguro no início da partida (D3); (v) Fase 5: remoção de `isLet` de schemas, contratos e engine. DoD: typecheck ✓ (0 erros) · 8/8 suites engine (196/196) ✓ · suítes de teste de cada fase passando ✓. |
| 2026-10-16 | `HEAD` | **R-13 (Acessibilidade A11y)** — inclusão de `aria-modal="true"`, `role="dialog"`, `aria-labelledby`, `role="alert"` em mensagens de erro e semântica de tabs (`role="tablist"`, `role="tab"`, `aria-selected`) em todos os modais extraídos e formulários (`PointDetailsCloseDialog`, `PointDetailsModal`, `PointDetailsNotesModal`, `ServerEffectModal`, `comment-modal-body`, `server-effect-modal-close-dialog`, `NewAthleteModal`, `EditAthleteModal`, `schedule-confirm-modal`, `ConfirmDeleteMatchDialog`, `login/page.tsx`, `point-details-notes-fields.tsx`); DoD: typecheck ✓ · test:design 3/3 (26/26) ✓ · test:strict 296/296 (3200/3200) ✓ · lint 0. |
| 2026-10-16 | `623ae2f` | **R-12 (Tokens e Cores Semânticas)** — tokens de telemetria para superfícies de quadra (`clay`, `grass`, `hard`) em `globals.css` e `tailwind.config.ts`, e eliminação de 28 hexadecimais soltos e 14 rgba soltos em componentes de produção (`PointDetailsCloseDialog`, `CommentModal`, `comment-modal-body`, `comment-modal-views`, `PointDetailsModal`, `ServerEffectModal`, `ModalActions`, `WinnerInfo`, `CourtBackground`, `AnnotationSessionPanel`, `game-errors-histogram-slot`, `GameErrorsHistogram`, `match-card-score-table`, `match-card-player-row`, `use-match-card-data`, `matchConstants`); DoD: typecheck ✓ · test:design 3/3 (26/26) ✓ · lint 0 · testes de dashboard e scoring 10/10 (130/130) ✓. |
| 2026-10-16 | `1210a07` | **R-02/R-23 (P3)** — eliminação de resíduos Handler/Helpers em hooks e services de scoring: `useScoringCommentHandler.ts` → `useScoringComment.ts` (função `useScoringComment`), `useScoringEditScoreHandlers.ts` → `useScoringEditScore.ts` (função `useScoringEditScore`), `createServerResolutionService` e `createScoringModalsService` canônicos com aliases mantidos; DoD: typecheck ✓ · test:strict 296/296 ✓ · test:design 3/3 ✓ · lint 0. |
| 2026-10-16 | `d92f763` | **R-23 (P1)** — cluster save/create/submit e duplicações: desambiguação de `getGameProgress` (`getGamePointCount` em `matchValidator` vs `getGameProgressRatio` em `player-card.logic`), padronização de `submitFormPayload` (`submitLoginForm`, `submitMatchInfoForm`, `submitNewAthleteForm`, `submitNewMatchForm`), padronização de `persistFormChanges` (`saveAthleteChanges`, `saveEditedAthlete`, `saveComment`, `savePointNotes`), correção de `confirmMatchDeletion` → `confirmAthleteDeletion`, e contextualização de `confirmCurrentAction` (`confirmServerEffect`, `confirmPointDetails`, `confirmScheduleModal`); DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0. |
| 2026-10-16 | *WIP* | **Scoring / Timeline (Áudio)** — Correção vertical do áudio nas observações da Timeline: (i) desacoplamento de pareamento por índice em `enrichTimelineWithAudio` via busca imutável por `pointId` e contagem de pontos reais ignorando `segmentBreak`; (ii) unificação da ordenação em `point-logs-meta` (`sequenceNumber`, `timestamp`, `id`) alinhada com a rota `report`; (iii) seleção de `audioNoteMime` e inferência resiliente de `hasAudioNote` para gravações com duração curta; (iv) revalidação imediata em tempo real pós-upload (`onAudioUploaded`) invocando `fetchTimelinePoints()` e `setEngineTick()`; (v) validação estrita de `res.ok` em `uploadAudioNote`. DoD: typecheck ✓ · test:strict 298/298 (3205/3205) ✓ · test:design 3/3 (26/26) ✓ · lint 0 ✓. |
| 2026-10-16 | `cc63c4b` | **Login (cosmético)** — unificar redirects de logout/401 com `redirectToLogin()`. |
| 2026-10-16 | `04e069e` | **R-02 (A/B/C)** — nomenclatura proibida: 39 arquivos `*helpers*`/`*utils*` → `*logic*`/`*domain*` (`8c2f809`), 11 funções `process*` → `apply*` (`c4deacf`), 98 funções `handle*` → verbos canônicos (`b8d1b4e`) — 3 commits + remoção de mapa temporário; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; **produção: 0 violações R-02**. |
| 2026-10-16 | `af705d5` | **UI-32..UI-44** (rodada R-03 final): `SectionRenderer.tsx` 156→69, `NewAthleteModal.tsx` 155→83 (hook), `DateTimeSection.tsx` 154→60 (hook+input+modal), `ConfirmAlertDialog.tsx` 134→90 (logic+content), `SportFormatSection.tsx` 128→33 (3 subcampos), `login/page.tsx` 124→39 (hook+fields), `AudioNotePlayer.tsx` 123→39 (hook+logic), `match/new/page.tsx` 121→40 (form sections), `LiveCountersBar.tsx` 121→74 (guardião telemetry), `timeline-filters.tsx` 110→74 (Chip), `ThemeContext.tsx` 103→36 (hook), `match-card-components.tsx` 102→3 (barrel), `TournamentSection.tsx` 101→82 (autocomplete) — 13 commits; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; backlog `.tsx` >100L **13 → 0** (R-03 ✓). |
| 2026-10-16 | `90db474` | **UI-27..UI-31** (rodada R-03): `PointDetailsModal.tsx` 176→86 (hooks), `RankingForm.tsx` 175→32 (card+fields), `ScoringPlayArea.tsx` 169→98 (guardião telemetry), `PlayerCard.tsx` 159→56 (types/logic/touch), `AthleteListTable.tsx` 157→44 (row/empty/helpers) — 5 commits; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; backlog `.tsx` >100L **18 → 13**. |
| 2026-10-16 | `8329e9e` | **UI-21..UI-26** (rodada R-03): `ScoringModals.tsx` 203→91, `PointDetailsNotesModal.tsx` 201→84, `atletas/page.tsx` 197→82 (hook `useAtletasPage`), `ReportPage.view.tsx` 186→39, `GameErrorsHistogram.tsx` 184→68, `MatchDetailsSection.tsx` 178→90 — 8 commits; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; backlog `.tsx` >100L **24 → 18**. |
| 2026-10-15 | `0f7ec5a` | **UI-16..UI-20** (rodada R-03): `NewAthleteModalForm.tsx` 235→60, `ServerEffectModal.tsx` 235→95, `edit-score-summary.tsx` 216→92 (barrel), `EditAthleteModal.tsx` 215→97 (hook + submissão pura), `locate/page.tsx` 206→72 — 8 commits; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; backlog `.tsx` >100L **29 → 24**. |
| 2026-10-15 | `edfd783` | **UI-12..UI-15** (rodada R-03): `ScoreboardCard.tsx` 250→72, `admin/page.tsx` 249→77, `DashboardViewRouter.tsx` 241→98, `SessionContext.tsx` 238→98 — tipos (`*-types.ts`), lógica pura (`*-logic.ts`/`*.reducer.ts`), hooks (`use-*.ts`) e seções (kebab-case) em módulos ≤100L; DoD: typecheck ✓ · `test:strict` 296/296 (3200/3200) · `test:design` 3/3 · `lint` 0; backlog `.tsx` >100L **33 → 29**. |
| 2026-10-15 | `a9ed92f` | **UI-10/UI-11**: `CommentModal.tsx` 293→47 (view/gravador/hook + body) e `EditScoreModal.tsx` 261→65 (tipos, shell, conteúdo com `EditScoreSetInputSection`, hook `use-edit-score-modal-view`) — 8 commits, ambos R-03 ✓. |
| 2026-10-25 | *WIP* | Dashboard & Match State: Correção do início de partidas agendadas (`SCHEDULED` -> `IN_PROGRESS`) após o horário previsto ou a partir do card no Dashboard. `MatchStateInputSchema` agora aceita `doublesSetup: DoublesSetupSchema.nullable().optional()` (eliminando `VALIDATION_ERROR` quando o Prisma retorna `doublesSetup: null` para partidas de simples ou agendadas) e `useDashboardServerStart` passa `doublesSetup` condicionalmente apenas se definido. |
| 2026-10-15 | `7ad8963` | **UI-9** `edit-score-form.tsx` 320 → 60 linhas: casca fina (`SetInputFormProps` + ref de foco) sobre `edit-score-form-body`/`-trail`/`-header`/`-feedback`/`-actions`/`-games-grid`/`-game-column` em 8 arquivos ≤100L. |
| 2026-10-15 | `3f257a2` | **UI-8** `AdvancedStats.tsx` 316 → 23 linhas: primitivas (`StatRow`, `Section`, `PlayerColumnHeader` deduplicando cabeçalho repetido em 4 seções), seções básicas (serve/return/pressure), `ShotSection` (com `ByStrokeGrid` deduplicando blocos idênticos), `MomentumSection` e `SetBreakdownSection` em 6 arquivos ≤100L. |
| 2026-10-15 | `c102365` | **UI-7** `SetSummaryModal.tsx` 327 → 91 linhas: `StatBarBilateral`, seções de estatísticas, cabeçalho/abas, card de placar, rodapé de ações e hook `useSetSummaryReport` (7 arquivos ≤100L). |
| 2026-10-15 | `93a6cda` | **UI-6** `dashboard/page.tsx` 337 → 69 linhas: `useDashboardPageModel` (auth/dados/modais/filtros + `resolveDashboardView`), `useDashboardMatchActions`, `useDashboardSetSummary`, `useDashboardServerStart`, `DashboardChrome` (topo/menu/logout), `DashboardMatchModals` + `ConfirmDeleteMatchDialog` (8 arquivos ≤100L). |
| 2026-10-15 | `a66caf2` | **UI-5** `scoring/page.tsx` 339 → 94 linhas: `scoring-page-screens`, `useScoringPageChrome` (tipos `ScoringPageState/Effects/Derived`), `scoring-page-play-area`, `scoring-page-controls` e `scoring-page-layout` (6 arquivos ≤100L). |
| 2026-10-29 | `main` | **Acompanhamento de Partidas ao Vivo (Transmissão de Partidas)**: implementação completa com núcleo puro em `src/core/spectate/` (`types`, `signal-status`, `rhythm-status`, `correction-diff`, `spectator-projection`), migração Prisma aditiva `20261029090000_add_match_spectating` (`MatchShareLink`, `MatchSpectator`, `PointLog.receivedAt`, `PointLog.updatedAt`, `MatchAnnotationSession.lastHeartbeatAt`, `ConsentPurpose.BROADCAST`), serviços de convite e pré-checagem barata Passo 0 no Postgres (<150 bytes, proteção contra estouro de egress do Neon), APIs REST em `/api/spectate/*`, hook de presença `useAnnotatorHeartbeat` (20s com pausa em background e throttle de 15s), suporte seguro a `next` no login e middleware, tela de acompanhamento `/matches/acompanhar/[matchId]` com Scoreboard adaptado, faixa de último ponto com ritmo de jogo simplificado (Opção B), abas Pontos/Resumo e modal `ShareSpectateModal`. 100% STE-DEV R-03 (0 violações em 1026 arquivos), 32 testes de domínio/serviço novos e 100% da suíte de design e componentes passando. |
| 2026-10-14/15 | `a30b850` `172ac42` `12dfae9` `9f5b9fe` | **UI-1..UI-4 + R-01**: `MatchTimelineView.tsx` 535→96, `MatchCard.tsx` 409→86, `EditMatchInfoModal.tsx` 370→97, `timeline-rows.tsx` 342→81; `docs/glossario.md` recriado em UTF-8 limpo (147 linhas). |
| 2026-10-14 | `d05bc60` | **Fase 4** remoção de scratch files órfãos da raiz. |
| 2026-10-13 | *WIP* | Atletas (`RankingForm`, `NewAthleteModal`, `EditAthleteModal`): refatoração da disposição visual dos campos em 'Novo Atleta' e 'Editar Atleta', com layout fixo (flex-nowrap, shrink-0) onde o checkbox do ranking fica no topo à esquerda com o botão 'Remover' logo abaixo, e as colunas de Categoria, Classe, Posição e 'Posição Ranking Juvenil' têm seus rótulos alinhados horizontalmente com o checkbox na linha 1 e seus selects/inputs alinhados com o botão 'Remover' na linha 2, garantindo que todos os campos fiquem na mesma linha horizontal sem quebras. |
| 2026-10-13 | *WIP* | Dashboard MatchCard UI: remoção do prefixo 'Modo de jogo: ' no componente `FormatLabel`, mantendo o alinhamento estrito à direita (`ml-auto shrink-0 justify-end`) para que todas as ações e informações do cabeçalho caibam em uma única linha. |
| 2026-10-13 | *WIP* | Scoring (/scoring): (i) início do cronômetro interno da partida (`startedAt`) estritamente ao marcar o 1º ponto em nova partida via `ScoringEngine.applyPoint`, rota `POST /point` e `useScoringLifecycleEffects` com `setInterval`; (ii) no placar dinâmico (`ScoreboardCard`), títulos de colunas adaptados a cada formato do sistema (`Set 1`, `Set 2`, `TB` para formatos com super tiebreak; `TB` único para `MATCH_TB_10`; `Set 1..5` para `BEST_OF_5`), com ênfase visual na coluna do set em andamento; (iii) no formato 'sets curtos 2/2' (`SHORT_SET_2V2_NO_AD`), projeção visual de `2 a 2` em ambos os sets desde a criação. |
| 2026-10-13 | *WIP* | Dashboard MatchCard & Modal Editar Info: (i) projeção de 2-2 em ambos os sets no formato 'sets curtos 2/2' (`SHORT_SET_2V2_NO_AD`) desde a criação da partida no card; (ii) novo botão `⚙️ Info` no cabeçalho do `MatchCard` para partidas não finalizadas (`state !== 'FINISHED'`), abrindo o modal `EditMatchInfoModal`; (iii) inclusão e persistência do campo "Clube" (`clubName`) no Prisma, migration DDL, services, repository, modal de edição e relatório; (iv) correção do erro 405 (Method Not Allowed) em `/api/matches/[id]` ao exportar o método `PATCH = PUT`. |
| 2026-10-13 | *WIP* | Formulário 'Nova Partida' & Timeline Report: (i) campo horário opcional com correção definitiva de contraste/opacidade nos seletores de data e hora (modo claro e escuro, sem background branco indesejado e com ícones nativos invertidos/contrastados e showPicker no clique); (ii) criação direta ao dashboard sem modal de sacador; (iii) novo campo livre `details` persistido em `Match.details` (Prisma/DDL); (iv) exibição em 3 linhas estruturadas (linha 1: título, linha 2: rótulo/ex: Torneio, linha 3: valor/ex: Open) acima de 'Comentários' em `/report > timeline`. |
| 2026-10-13 | *WIP* | Correção do cálculo de "Resultado" ao final da timeline em `/report`: cálculo correto dos games no último ponto do set e propagação de `scoreState`. |
| 2026-10-08 | *WIP* | Desacoplamento de `history` de `Match.scoreState` no caminho quente do `POST /point` (eliminação do custo quadrático O(N^2)). Blindagem atômica do Undo (`voidLastPoint`/`isUndo`) sincronizando `PointLog`, backfill de tiebreaks legados, engine de Shadow Mode e reidratação de badges via `recentWinnerIds`. |
| 2026-10-08 | *WIP* | Correção do TD-003 (perda de contexto RLS com getRLSUser) via injeção de dependência no withRLSHandler. Adição de renovação deslizante de sessão e correção do middleware (token nulo). |
| 2026-10-05 | *WIP* | Correção do modal Editar Placar: regra de piso de abandono, alternância ITF de tiebreak, Deuce/Adv, auditoria de notas e blindagem Prisma |
| 2026-10-01 | `c53ae98` | Guardrails do Telemetry, toggle binário light/dark, saneamento de código morto legado |
| 2026-09-30 | `30ec07d` | Dual-theme, ações no header de card do dashboard, opacidade de fonte |
| 2026-09-30 | `77890d0` | Conflito de offline sync e fronteiras de papel (role boundary) |
| 2026-09-30 | `08257ec` | Timeline de scoring, editar placar e insights táticos |
| 2026-09-28 | `62ea451` | `PointDetailsModal`, `SectionRenderer`, `usePointDetailsScroll` |
| 2026-09-28 | `7b73a7c` | Ignorar artefatos de scratch/test-results |
| 2026-09-28 | `b30e906` | Redesign de UI em atletas, dashboard, criação de partida e scoring |
| 2026-09-28 | `e2e16b7` | Redesign de componentes + fluxos de ranking/atletas |
| 2026-09-26 | `fb4fb5f` | Bugs críticos de histórico e timeline |
| 2026-09-26 | `b1e2106` | Timezone de data e lógica de UI de ranking |

**Padrão observado:** ciclos curtos de `feat` → `fix` → `refactor` → `test(characterization)` no mesmo domínio (scoring/dashboard), com saneamento de legado no fim de cada ciclo.

---

## 3. Marcos do Projeto (histórico consolidado)

| Período | Marcos |
|---|---|
| 2026-06 | Migração inicial do domínio (users/players/matches/point logs) |
| 2026-07 | Adoção multi-agente (ADR-0001), Onda 0 Discovery, refatoração de hooks/pages, elevação de segurança (ADR-0005) |
| 2026-08 | Remoção da PWA, strategy de formatos (ADR-0003), repository pattern (ADR-0004), migrações de áudio e edição de placar |
| 2026-09 | Onda pesada de scoring: undo, idempotência, sessões, timeline, comentários/áudio, offline sync, relatório, RBAC resolvido (TD-051..055), limpeza de código morto |
| 2026-09 fim | Redesign de UI + dual theme |
| 2026-10-01 | Guardrails do Telemetry Design System |

---

## 4. Saúde Técnica
 
| Verificação | Estado |
|---|---|
| `pnpm typecheck` | ✅ **Executado em 2026-10-15 — sem erros** |
| `pnpm lint` | ✅ **Executado em 2026-10-15 — 0 erros / 0 warnings** |
| `pnpm test:design` | ✅ **Executado em 2026-10-15 — 3 suites / 26 testes passando** |
| `pnpm test:strict` | ✅ **Executado em 2026-10-15 — 291/294 suites e 3191/3196 testes passando**; 3 falhas = baseline pré-existente (`dashboard.hooks.guards`, `match-authorization.baseline`, `useOfflineSync.real`) |
| `pnpm test` / coverage | ✅ **Executado em 2026-10-05 — 277 suites / 3056 testes passando (100%)** |
| CI (`quality.yml`) | ✅ Configurado: typecheck → no-skipped-tests → test:strict → coverage (Postgres 16) |
| Mutation testing | ⚠️ Configurado (≥80% high) mas **fora do CI** (TD-015) |
| E2E | 6 specs (ciclo completo, sessão, offline ×2, undo, conflito) + a11y |

---

## 5. Dívidas e Riscos Vigentes (top 8)

| ID | Tema | Severidade | Situação |
|---|---|---|---|
| TD-003 | Propagação de RLS (`setRLSUser`) | Resolvida | Corrigido via injeção direta de `user` nos handlers, evitando falha de `AsyncLocalStorage`. |
| TD-008/060 | Segredos/centralização JWT (`src/lib/jwt.ts` nunca entregue) | Crítica | Texto revisado 2026-09-30: sem literal hardcoded |
| TD-001 | Sem testes de integração com banco real | Alta | Mitigação parcial via CI |
| TD-002 | Validação Zod incompleta nas APIs | Alta | ~8 endpoints pendentes |
| TD-009 | Sem rate limiting | Alta | Aberto |
| TD-015 | Mutation testing fora do CI | Média | Config pronto |
| TD-057 | `NEXT_PUBLIC_COMMENT_FEATURE` indefinida (CommentModal dormente) | Média | Decisão pendente |
| TD-011 | Componentes >300 linhas | Média | Parcialmente tratado (remoção de dead code 2026-09-22) |

Leitura completa: `docs/TASKS.md` — **Anexo A** (dívida técnica, 50 entradas / 48 únicos) e **Anexo B** (fila de refatoração, P1 #8–#10 abertos).

---

## 6. Avisos para o Próximo Agente

1. **Única fonte de diretrizes:** `AGENTS.md` indexa estritamente os 6 arquivos-canônicos na raiz de `docs/` (`PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `DESIGN.md`, `TASKS.md`, `MEMORY.md`). Não existem subpastas (`docs/adr/` foi eliminada após consolidação integral) nem documentos vigentes fora destes 6.
2. **Não regressar o design:** tokens `telemetry-*` são obrigatórios; classes `bg-gray-*`, `bg-sky-*`, `bg-emerald-*` são proibidas nas páginas principais; rodar `pnpm test:design` antes de encerrar.
3. **Somente `pnpm`** (nunca `npm`).
4. **Código legado** (pré-2026-07-20) só sob feature/bug crítico/item de `TASKS.md` (Anexo B), com raio mínimo, teste de caracterização antes (`RULES.md` §7) e documentação no PR.
5. **Husky/lint-staged** estão no `package.json` mas `.husky/` não existe — hooks provavelmente inativos (`RULES.md` §4).

---

---

## 7. Histórico Recente de Entregas

- **2026-10-17:**
  - **Editar Placar direto (sem interrupção por Análise do Set):** Em [use-scoring-page-chrome.ts](file:///c:/apps/RKT/src/app/match/[id]/scoring/use-scoring-page-chrome.ts), inibida a abertura automática do modal `SetSummaryModal` durante o carregamento inicial da partida e quando no fluxo de edição de placar (`state.activeModal === 'edit-score'` ou `?modal=edit-score`). Garante transição imediata para o modal de edição de placar. Testes de regressão adicionados em `useScoringPageChrome.edit-score-modal.test.ts`.
  - **Droplist de Rodada e Simplificação em Editar Informações:** Em [edit-match-info-sections.tsx](file:///c:/apps/RKT/src/components/dashboard/edit-match-info-sections.tsx), substituído o campo de texto `<TextInput>` por `<SelectField>` com a lista de opções padronizadas de rodadas (`ROUND_OPTIONS`), mantendo fallback seguro para rodadas customizadas pré-existentes. Removidos os campos desnecessários do formulário: **Categoria**, **Chave** e **Tipo de Quadra** (em [edit-match-info-grid-sections.tsx](file:///c:/apps/RKT/src/components/dashboard/edit-match-info-grid-sections.tsx)), mantendo o layout enxuto e preservando valores pré-existentes no envio. Testes de componentes atualizados em `EditMatchInfoModal.test.tsx`.
  - **Winner jamais cadastrado como ACE via detalhes do ponto:** Em [useScoringHandlers.point-processor.service.ts](file:///c:/apps/RKT/src/hooks/useScoringHandlers.point-processor.service.ts), removida a conversão indevida que transformava pontos com `tipo === 'winner'` do sacador e `rallyLength === 1` em `ACE`. Um ACE é registrado exclusivamente direto em `/scoring` ou via modal de detalhes do saque (`ServerEffectModal`). Todo ponto cadastrado via modal de detalhes do ponto com `tipo === 'winner'` é registrado como `WINNER`. Teste de regressão adicionado em `useScoringHandlers.test.ts`.

---

## 8. Handoffs Sugeridos

- `@arquitetura → @backend`: resolver TD-003 (RLS) e TD-002 (Zod) — bloqueiam segurança e consistência de contrato.
- `@backend → @qa`: endpoints refatorados prontos para characterization/integração.
- `@frontend → @qa`: dual-theme + guardrails Telemetry prontos para `pnpm test:design` e E2E de tema.
- `@qa → @arquitetura`: decidir destino de `NEXT_PUBLIC_COMMENT_FEATURE` (TD-057) e PWA cancelada (item N8 em `docs/TASKS.md`).
- `@arquitetura → @frontend`: biblioteca de componentes em `src/components/ui` — requer decisão de escopo.

---

*Documento atualizado em 2026-10-28.*

---

## 2.5 Executado: PLANO_ALTERACOES_RKT_2026-10-27.md — 2026-10-28
- **Fase 1 – Nova partida (B1, B3):** rótulos "Simples"/"Duplas" (sem "1 vs 1"/"2 vs 2"); DateTimeSection sem bloco "Atenção" e sem asterisco em "Data"; remoção do preenchimento automático com hoje na criação; Data removida dos campos obrigatórios; `scheduledAt` fica indefinido sem data; preenchimento com hoje ao entrar em `IN_PROGRESS` (ponto único em `buildTransitionUpdateData`); verificação de efeito de `scheduledAt` nulo em dashboard (badge, ordenação) e duplicidade.
- **Fase 2 – Duplicidade (B2):** `findDuplicateMatch` recebe `matchType`, `player1PartnerId`, `player2PartnerId`; duplas comparadas como conjuntos de dois lados (qualquer ordem); simples nunca colide com dupla; chave do advisory lock inclui `matchType` e parceiros; `DuplicateMatchModal` exibe tipo (simples/duplas), data e texto "no mesmo dia".
- **Fase 3 – Nomes de dupla (C):** utilitário `abbreviateDoublesName` em `src/components/scoring/doubles-name-abbreviation.logic.ts`; `PlayerCard` exibe nome da dupla abreviado em uma linha (aria-label atualizado); `ScoreboardCard`/`ScoreboardPlayerRow` recebem `player1Partner`/`player2Partner` e usam o utilitário; `ScoringPlayArea` passa os parceiros.
- **Fase 4 – Card do dashboard (A):** regra do sobrescrito de tiebreak unificada e corrigida em `renderSetScore` (scoring) e `formatCompactSetScore` (dashboard): vencedor mostra só games, perdedor mostra games + pontos do TB em sobrescrito; Match Tiebreak mostra só o placar do TB sem sobrescrito; `getColumnTitles` para `BEST_OF_5` retorna Set 1 a 4 e TB; `MatchCard` reescrito usando a estrutura de tabela do `ScoreboardCard` com cores de quadra, suspenso, nomes de dupla abreviados e sem pontos do game; arquivos específicos do MatchCard (`MatchCardScore`, `MatchCardScoreTable`, etc.) deixados em desuso.
- **Fase 5 – Estatísticas avançadas (D3, D4, D8, D9, D10):** `BaselineStats` expõe `shortRallyWon/Total`, `mediumRallyWon/Total`, `longRallyWon/Total` (ganhos e total por faixa); `BaselineSection` mostra "Aproveitamento/Total (x/y)" e rótulos Curtos (1-4), Médios (5-8), Longos (9+); `advanced-stats-rally-section.tsx` e `advanced-stats-shot-section.tsx` com rótulos corrigidos; `stroke-matrix-classify.logic.ts` separa `approach_fh`/`approach_bh` (antes `aproachs`); `stroke-matrix-stats.logic.ts` com ordem Sq, FH, BH, VFH, VBH, SVFH, SVBH, Sm, Drop, Lob, Bate Pronto, Aproach FH, Aproach BH; `MomentumStats` com `streakCountP1/P2` (len2, len3, len4Plus); `advanced-stats-momentum.tsx` tabela de sequências exatas por jogador; `SetBreakdownSection` com linha de tempo total do jogo (`totalDurationMinutes`).
- **Validação:** `pnpm typecheck` 0 erros · `pnpm spec:validate` sem drift · `pnpm test:design` 3/3 (26/26) · `pnpm test` 397/397 suítes e 3904/3904 testes verdes.

---

## 2.37 Executado: Mural de Partidas Agendadas / Criadas e Seção no Gestor — 2026-11-12
- **Mural na Tela Inicial (`/dashboard`):** Atletas e Treinadores contam agora com `<ScheduledNotifSection />` e `<ScheduledNotifCard />` para partidas criadas/agendadas (`POOL_MATCH_WITH_MY_ATHLETE`), análogo ao "Avisos de Designação" dos treinadores. Exibe confronto, data agendada, criador/origem e botões para dispensar ou anotar a própria versão (`/api/matches/pool/[templateId]/annotate`).
- **Disparo de Notificações Círculo/Privadas:** `notifyPoolMatchCreated` estendido para qualquer template de partida (`isTemplate`), notificando os atletas envolvidos, seus treinadores particulares (`CoachAthleteLink`), responsáveis (`GuardianLink`) e os gestores dos clubes afiliados (`PlayerCT` -> `Membership` com `kind: GESTOR`).
- **Painel do Gestor (`/gestor`):** Adicionada a seção **"Partidas agendadas por outros"** (`<ExternalScheduledMatchesSection />`), posicionada rigorosamente **antes** da seção "Partidas do Clube", alimentada por `loadGestorExternalScheduledMatches`. Lista confrontos agendados por terceiros envolvendo atletas do clube com opção para o gestor indicar um anotador do seu clube.
- **Validação:** `pnpm check:r03` (0 regressões, todos $\le 100$ linhas) · `pnpm typecheck` (0 erros) · `pnpm test:design` (26/26) · Testes unitários de rotas, services e componentes 100% verdes.


---

## 2.38 Executado: Melhorias de Gestão, Visibilidade e Dados Pessoais (6 Itens) — 2026-11-12
- **Item 1 (Notificação / Visibilidade para Todos os Envolvidos):**
  - `src/services/notification-recipients.logic.ts` e `src/services/notification-create.logic.ts` estendidos para duplas (`player1PartnerId`, `player2PartnerId`), notificando todos os atletas envolvidos, seus treinadores particulares (`CoachAthleteLink`), responsáveis (`GuardianLink`) e os gestores dos clubes afiliados (`PlayerCT` -> `Membership` com `kind: GESTOR`).
- **Item 2 (Poderes do Gestor na aba 'Partidas'):**
  - **Exclusão:** Botão de exclusão (lixeira) em `src/app/gestor/club-match-row.tsx` exibido exclusivamente quando a partida foi criada pelo próprio gestor logado (`currentUserId === match.createdByUserId`), disparando `requestDeleteMatch` em `gestor-match-actions.logic.ts`.
  - **Anotação:** Botão "Anotar" adicionado em `ClubMatchRow` e `ExternalScheduledMatchesSection`, permitindo ao gestor anotar qualquer partida que envolva atleta de seu clube via `/api/matches/pool/[templateId]/annotate`.
  - **Multi-timeline de Partidas do Clube:** `src/core/access/visibility.ts` atualizado com `allowParticipantClubGestor: true` em `canReadMatch`, permitindo aos gestores inspecionar a timeline e relatórios (`/report`) de quaisquer anotações feitas por diferentes anotadores para partidas de seus atletas.
- **Item 3 (Badge do Criador em 'Minhas Partidas'):**
  - `src/components/dashboard/match-card-creator-badge.logic.ts` resolve o badge ao lado do nome do adversário do atleta (`Criada por [Nome]`).
  - `src/components/dashboard/match-card-club-badge.tsx`, `match-card-row.tsx` e `match-card-score-grid.tsx` renderizam a badge contextualizada no lado adversário.
- **Item 4 (Data de Agendamento Dinâmica):**
  - `src/components/dashboard/match-schedule-format.logic.ts` formata dinamicamente `scheduledAt` registrado na criação da partida, sem dados hardcoded e omitindo o horário caso venha zerado (00:00:00).
- **Item 5 (Ícone 'Informações da Partida' Exclusivo do Criador):**
  - `src/components/dashboard/match-card-header.tsx` recebe `isCreator` e condiciona o botão de edição de informações (`edit-info`) estritamente a `!isFinished && isCreator && onEditInfo`.
- **Item 6 (Edição de Dados Pessoais para Maiores de 18 Anos):**
  - `src/app/api/users/profile/route.ts` implementa `PATCH` com autenticação, validação de maioridade (bloqueia menores de 18 anos com 403) e atualização de nome.
  - `src/app/dados-pessoais/personal-data-section.tsx` renderiza formulário reativo com edição para $\ge 18$ anos, mantendo o CPF rigorosamente travado como não-editável.
- **Validação:**
  - `node scripts/check-r03-line-limit.mjs`: 100% conforme (0 violações, 0 regressões, todos $\le 100$ linhas).
  - TypeScript typecheck: 0 erros.
  - Testes: 16 suítes / 117 testes unitários e de integração verdes; 3 suítes / 26 testes de design verdes.

---

## 2.39 Executado: Papel do Criador, Filiação de Atletas e Feed Dinâmico de Partidas Criadas por Terceiros — 2026-11-13
- **Item 1 (Painel do Gestor - Papel do Criador e Filiação de Atletas):**
  - Implementado `src/app/gestor/gestor-match-display.logic.ts` com funções puras `resolveCreatorRoleLabel` (resolvendo `Gestor (CT)`, `Treinador (CT)`, `Treinador Pessoal`, `Atleta` ou `Espectador`), `formatCreatorWithRole` e `resolvePlayerAffiliation` (indicando `Meu clube`, `Clube: [Nome]`, `Treinador: [Nome]` ou `Avulso`).
  - Atualizado `src/app/api/gestor/matches/gestor-matches-select.ts`, `gestor-matches.logic.ts` e `gestor-external-matches.logic.ts` incluindo dados completos de perfil e vínculos do criador e atletas.
  - Atualizado `ExternalScheduledMatchRow` e `ClubMatchRow` para renderizar os badges de papel do criador e filiação dos atletas tanto em "Partidas agendadas por outros" quanto em "Partidas do Clube".
- **Item 2 (Ativação Pós-Criação de Conta):**
  - Em `src/app/api/notifications/scheduled/scheduled-matches-feed.logic.ts`, a consulta de partidas agendadas/criadas por outros busca dinamicamente partidas envolvendo os atletas do usuário logado (`actor.athletePlayerId`, `actor.followedPlayerIds`, `actor.guardianOfPlayerIds`), garantindo que usuários que ativarem suas contas após a criação da partida tenham suas partidas agendadas exibidas imediatamente na tela inicial sem depender de notificações estáticas preexistentes.
- **Item 3 (Área de Aviso / Feed na Tela Inicial para Não-Gestores):**
  - O endpoint `/api/notifications/scheduled` e os componentes `<ScheduledNotifSection />` e `<ScheduledNotifCard />` na tela inicial (`/dashboard`) agora exibem "Partidas Criadas por Outros Usuários" para atletas, treinadores e responsáveis/espectadores (com exclusão estrita de gestores, que possuem seção própria em `/clube/gestor`). Permite dispensar (salvando a dispensa) ou anotar a própria partida.
- **Validação:**
  - `node scripts/check-r03-line-limit.mjs`: 100% conforme (0 violações, 0 regressões, todos $\le 100$ linhas).
  - TypeScript typecheck: 0 erros (`node ./node_modules/typescript/bin/tsc --noEmit`).
  - Testes: 29 testes Jest dedicados 100% verdes + 26 testes de design 100% verdes.

---

## 2.42 Executado: Usabilidade Outdoor e Cores Perceptuais (com resíduos) — 2026-11-14
- **Plano:** [`docs/archive/PLANO_USABILIDADE_OUTDOOR_E_CORES_PERCEPTUAIS_2026-11-03.md`](./archive/PLANO_USABILIDADE_OUTDOOR_E_CORES_PERCEPTUAIS_2026-11-03.md) (arquivado nesta data).
- **Entregue:**
  - **Pilar 1 — Calibragem OKLCH do tema claro:** `src/app/globals.css` com comentários de calibragem (`OKLCH-calibrated warm court ground (L:94% C:0.010 H:80) -> #F2EFE9`), `--telemetry-base`, `--telemetry-elevated` e os tokens `--telemetry-score-main/secondary/accent` (bloco repetido no tema claro forçado).
  - **Pilar 2 — Contraste dos dígitos (WCAG AAA 7:1):** classes `text-telemetry-score-*` aplicadas em `src/components/scoring/scoreboard-card-cells.tsx`, `ScoreboardCard.tsx`, `src/components/dashboard/match-card-set-cells.tsx`, `match-card-score-grid.tsx` e `match-card-live-points.tsx`; suíte `src/__tests__/contrast-wcag.test.ts` com fórmula WCAG e casos `minRatio: 7`.
  - **Pilar 3 — Superfícies temáticas (Clay/Hard/Grass):** `courtBorderClass` em `MatchCard.tsx`, mapa `COURT_COLORS` em `use-match-card-data.ts`, micro-gradiente em `CourtBackground.tsx` e tokens `telemetry.court.*` no `tailwind.config.ts`.
- **Resíduos abertos:** registrados em `docs/TASKS.md` **TD-066** — (2) modo outdoor/high-contrast inexistente (`ThemePreference` = light|dark|system) e (3) `--court-badge-bg-opacity` sem consumidor. O resíduo (1) — `text-telemetry-score-*` sem CSS por falta da chave `score` no `tailwind.config.ts` — **foi corrigido em 2026-11-14** (chave `score` adicionada + guard `src/__tests__/tailwind-utilities.guard.test.ts` que falha se classe usada não gerar regra CSS); validação: guard 3/3, `test:design` 29/29 (4 suítes, incluindo o guard), `contrast-wcag` 23/23, `typecheck` 0 erros, `check:r03` 0 violações.
- **Registro:** arquivado como executado com resíduos por decisão do mantenedor em 2026-11-14; a evidência de execução é o código acima, não o campo `**Status:**` interno do plano (que permanece defasado como "Planejamento Aprovado").

---

## 2.41 Executado: Revisão de UX Writing (Baby Steps) — 2026-11-14
- **Plano:** [`docs/archive/PLANO_REVISAO_UX_WRITING_2026-11-05.md`](./archive/PLANO_REVISAO_UX_WRITING_2026-11-05.md) (arquivado nesta data).
- **Evidência (5 fases verificadas no código em 2026-11-14):**
  - **Fase 1 (Auth):** `login/page.tsx` ("Entre com e-mail ou CPF", "Novo no RKT?"), `login-context-selector.tsx` ("Com qual perfil você quer entrar?"), `forgot/page.tsx`, `signup/page.tsx` ("Crie sua conta", "Avançar: cadastrar clube"), `signup-role-and-terms.tsx`, `escolher-area/page.tsx`.
  - **Fase 2 (Dashboard/aguardando):** `aguardandoanotador/page.tsx` com a string canônica "Não foi possível verificar o status. Tentando novamente..." + "Esperando há mm:ss".
  - **Fase 3 (match/new e scoring):** `MatchNewErrorBanner.tsx` ("Falta preencher algo"), `DuplicateMatchModal.tsx` ("Detalhes técnicos"), `scoring-deciding-point-banner.tsx` ("Ponto decisivo — No-Ad"), `scoring-finished-banner.tsx` ("Partida encerrada!") — as strings antigas (`Erro ao verificar partida`, `PARTIDA FINALIZADA!`, `Anotações Suspensas`) **não existem mais** em `src/`.
  - **Fase 4 (Gestor):** `tab-nav.tsx` ("Partidas"/"Clube"), `cadastrar-membro-modal.tsx`, `cadastrar-membro-link-prompt.tsx`, `link-copy-modal.tsx` ("Copiado!") e `status-pages.tsx` ("Acesso suspenso"); o componente de status "Pendente de aprovação" foi **removido** (não renomeado).
  - **Fase 5 (Transversal):** mensagens padronizadas "Sem conexão. Verifique sua internet e tente novamente." (forgot, trocar-senha, signup, gestor-onboarding-modal) e "Não foi possível salvar. Tente novamente." (suporte/gestor modais).
- **Ressalva:** o título "Partidas pausadas" saiu do render (cards suspensos agora aparecem em "Minhas Partidas"), em vez de ser renomeado conforme o plano.
- **Validação:** testes de `login`, `signup`, `trocar-senha`, `gestor` e `scoring` cobrindo as novas strings.

---

## 2.40 Executado: Onboarding e UX de Feedback (com resíduo) — 2026-11-14
- **Plano:** [`docs/archive/PLANO_ONBOARDING_UX_FEEDBACK_2026-11-07.md`](./archive/PLANO_ONBOARDING_UX_FEEDBACK_2026-11-07.md) (arquivado nesta data).
- **Frente 1 — Toast:** contrato em `src/components/toast-types.ts` (`ToastType`, `key` p/ desduplicação, `persistent`, `action`, `durationMs`), `Toast.tsx` mobile-first, `toast-item.tsx` com spinner/ação/`aria-label`, `use-toast-queue.ts` (loading não auto-dismiss) e `src/components/__tests__/Toast.test.tsx`.
- **Frente 2 — Validação inline:** `login-errors.logic.ts` + `login-alerts.tsx`, `signup-form-fields.tsx` (`onBlur`, `aria-describedby`, `PasswordStrengthMeter`) e `signup-field-feedback.tsx`, `trocar-senha/components.tsx` ("As senhas não coincidem").
- **Frente 3 — Empty states:** `dashboard-empty-state.tsx` + `dashboard-empty-state.logic.ts` com copy e CTAs por perfil (ATHLETE/COACH/MANAGER/SPECTATOR) e resolução de href por área ativa; testes `dashboard-empty-state.test.tsx` e `.wiring.test.tsx`.
- **Frente 4 — Módulo `/onboarding`:** rota com `OnboardingStepper` (3 etapas, `aria-current="step"`), conteúdo por perfil (`onboarding-content.*`), persistência `src/lib/onboarding.ts` (`rkt_onboarded_*`), gate no primeiro login (`login-onboarding-gate.test.ts`) e E2E `e2e/flows/07-onboarding-first-login.spec.ts`.
- **Frente 5 — Feedback do Gestor:** `link-copy-modal.logic.ts` com validade de 7 dias, `use-athletes-table.ts` e `use-coaches-table.ts` com toasts de resultado; teste `table-action-toasts.test.tsx`.
- **Resíduo aberto:** registrado em `docs/TASKS.md` **TD-067** — §3.4 do plano (`gestor-onboarding-modal.tsx`): barra de progresso e `onBlur` de CNPJ/CEP/telefone.
- **Registro:** arquivado como executado com resíduo por decisão do mantenedor em 2026-11-14.

---

## 2.43 Arquivamento da 2ª leva de planos executados (raiz de `docs/` só com LGPD) — 2026-11-14
- **Ação:** `git mv` de 3 planos para `docs/archive/` (2ª leva, após os 6 da §2.40-§2.42 e leva anterior), com atualização de todos os links em `MEMORY.md`, `TASKS.md`, `ARCHITECTURE.md` e nos próprios planos arquivados. A raiz de `docs/` passou a conter **apenas** `PLANO_LGPD_PROTECAO_MENORES_E_GOVERNANCA_2026-10-31.md` (A0.8, não iniciada).
- **Evidências verificadas no código antes do arquivamento (2026-11-14):**
  - **`PLANO_CORRECAO_FILTROS_PARTIDAS_2026-11-11`:** Fase A concluída (`nextCursor` + "Carregar mais" em `src/app/dashboard/hooks/useDashboardMatches.ts`; resultado discriminado `{ ok, matches, nextCursor } | { ok: false, errorMessage }` em `use-dashboard-matches-fetch.ts`); Fase B concluída (`ownTemplates`/`isTemplate: true` em `src/services/match-repository-where.logic.ts` + cartazes do círculo em `match-repository-circle.logic.ts`); Fase C concluída (`explicitCtId !== undefined` em `match-resolve-payload.logic.ts`, commitada em `9334796` em 2026-11-14); Fase D via TD-062. **Resíduo:** Fase E (diagnóstico em banco/saneamento) — rastreada em `TASKS.md` **TD-065**.
  - **`PLANO_POOL_PARTIDAS_PUBLICAS_E_NICKNAME_ATLETA_2026-11-09`:** entregue conforme §2.31 (9/9 DoD de A0.13 exceto E2E; 6/7 de A0.14). **Resíduos:** E2E `e2e/flows/08-public-match-pool.spec.ts` (inexistente) e consentimento de menores bloqueado por A0.8 — itens 9 e 7 seguem abertos em `TASKS.md`.
  - **`PLANO_CADASTRO_ATLETA_OUTRO_CLUBE_UF_CIDADE_2026-11-01`:** entregue conforme §2.3 (`brazilian-states.ts`, `AthleteOriginSection.tsx`, schemas com `state/city/isExternalClub`, `NewAthleteModalForm.tsx`). **Resíduos:** DoD itens 5 (broadcast da procedência em placares/relatórios) e 6 (baseline 100% verde).
- **Correção de links legados:** 4 referências quebradas pré-existentes a `docs/PLANO_POOL_BUSCA_CADASTRO_ATLETAS_E_CLAIM_2026-10-27.md` (já em `archive/`) corrigidas em `ARCHITECTURE.md`, `MEMORY.md` e `TASKS.md`.
- **Status resultante em `TASKS.md`:** A0.12, A0.13 e A0.14 marcados como "Concluído com resíduos"; TD-065 reduzido à Fase E.

---

## 2.44 Resíduos do TD-066 resolvidos (modo outdoor + court-pill) e sequência de commits — 2026-11-14
- **Commits (blocos lógicos, nesta ordem):**
  1. `9334796` `refactor(matches)`: extração de `canResolveTargetMatch`/`toTemplateAccess` para `src/services/match-resolve-access.logic.ts` (payload 100L → 55L, R-03); Fase C do TD-065 confirmada no HEAD.
  2. `7e3a251` `feat(notifications)`: filtros backend `assigned-filter.logic.ts` e `scheduled-active-filter.logic.ts` (descarta notificações de partidas encerradas; defesa `?? []` nos retornos de `findMany`) + cards consumindo dados já filtrados.
  3. `1cfdb92` `fix(design)`: chave `score` no `tailwind.config.ts` + guard `tailwind-utilities.guard.test.ts` + `test:design` com 4 suítes (TD-066 resíduo 1).
  4. `200846f` `docs`: 12 planos executados para `docs/archive/` (raiz só com LGPD), links corrigidos, MEMORY §2.40-§2.43 e backlog atualizado.
  5. `16605b2` `feat(design)`: TD-066 resíduos 2 e 3 (detalhe abaixo).
- **Resíduo 2 — modo outdoor/high-contrast:** `ThemePreference = 'light' | 'dark' | 'system' | 'outdoor'` em `use-theme-provider-state.ts` (outdoor resolve para claro e grava `data-theme="outdoor"`); opções extraídas para `src/components/theme-toggle-options.tsx` (o `ThemeToggle.tsx` passou de 119L para 52L — R-03); bloco `:root[data-theme='outdoor']:not(.dark)` em `globals.css` com branco puro, texto preto 21:1, score AAA (`#000`/`#0F172A`/`#004D00`) e bordas `#64748B`; restauração sem flash no script inline de `layout.tsx`.
- **Resíduo 3 — court-pill:** nova classe `.court-pill` em `globals.css` consumindo os tokens até então órfãos `--court-badge-bg-opacity`/`--court-badge-text-opacity`, com `--court-pill-{clay,grass,hard}-text` por tema (claro escurecido OKLCH L=0.35: `#701100`/`#004C00`/`#0A3C68`; escuro com brilho sutil: `#D08161`/`#62A76E`/`#7894B0`). `format-label.tsx` usa `court-pill[data-court]` no lugar de `bg-amber/emerald/sky` genéricos.
- **Descoberta durante a correção:** os 6 casos de badge do `contrast-wcag.test.ts` mediam contra **preto silencioso** — `rgba(...)` passava por `parseInt(...,16)` → `NaN`, e `NaN & 255 = 0`. O `hexToRgb` agora rejeita qualquer entrada que não seja hex `#RRGGBB` (falha barulhenta) e os 6 casos foram reescritos com os compostos reais (12% sobre `#FFFFFF` / 20% sobre `#111827`).
- **Testes novos:** `src/__tests__/outdoor-theme.test.ts` (5 — caracterização estática do bloco outdoor, provider, script do layout e botão) e `src/__tests__/court-pill.test.ts` (4 — consumo dos tokens, mapeia os 3 tipos de piso, tokens por tema, uso no `FormatLabel`); `ThemeToggle.test.tsx` atualizado para 3 botões + seleção do outdoor.
- **Validação:** suíte completa **581/581 suites · 4893/4893 testes**, `contrast-wcag` **28/28**, `test:design` **29/29**, `typecheck` **0 erros**, `check:r03` **0 violações**.
- **TD-066** ficou ✅ (3/3 resíduos); em `TASKS.md` restam como resíduos abertos: A0.12 (5-6), A0.13 (E2E 08 + migrations), A0.14 (menores/A0.8), TD-065 (Fase E) e TD-067 (§3.4).

---

## 2.45 Resíduos A0.12 (5-6) e TD-067 resolvidos; linha de base 100% verde — 2026-11-14
- **Commits:**
  1. `ddaf9cb` `feat(signup)`: **TD-067** — barra de progresso acessível no `modal-header.tsx` (`role="progressbar"`, 50% na Etapa 1 e 100% na Etapa 2, conforme §3.4 do plano; a DoD do `TASKS.md` dizia "3 etapas", mas o modal tem 2 — redação corrigida) + teste novo `src/app/signup/__tests__/gestor-onboarding-progress.test.tsx` 6/6 (2 de progresso, 3 de `onBlur` de CNPJ/Telefone/CEP e 1 de ausência de erros pré-blur). **Descoberta:** o `onBlur` já existia via `FormField.validate` + `handleBlur` — a afirmação do `TASKS.md` estava defasada; ficou coberto por teste.
  2. `03b4b02` `feat(provenance)`: **A0.12 item 5** — broadcast da procedência (Fase 7 do plano):
     - Helper puro `src/core/athlete/provenance.ts` (`formatProvenance(club, state)` → `"Clube - UF"`) + suite `core/athlete/__tests__/provenance.test.ts` 5/5.
     - **Dados:** `state: true` nos 4 selects de player de `match-repository-select.data.ts` e `club`/`state` nos 4 de `MATCH_SELECT` (rota `GET /api/matches/[id]`); `MatchPlayerPayload`, `MatchData`, `ScoringHeader` e `Player` (scoreboard) ganham `club`/`state` opcionais (o fetch do scoring já passa o payload cru).
     - **Cards (`/dashboard` e `/relatorios`, que apenas re-renderiza o `DashboardPage`):** `useMatchCardData` expõe `p1Origin`/`p2Origin` e o badge do card exibe "Pinheiros - SP" (`MatchCard.tsx` foi de 117 → 115 linhas para não crescer no R-03; `p1Club`/`p2Club` do score-grid agora recebem a procedência formatada).
     - **Placar (cabeçalho da partida):** `scoreboard-player-row.tsx` mostra a procedência em fonte menor após o nome e no `title` do `td`.
     - **`/atletas`:** coluna **"Origem"** condicional (só aparece quando alguma linha tem procedência) em `AthleteTable`/`AthleteTableRow` + campo `origin` em `AthleteTableRowData` preenchido por `toAthleteListRow`. A tabela do gestor permanece com 9 colunas (sem `origin` → sem coluna).
- **A0.12 item 6:** `pnpm lint` (`next lint`) = **0 warnings/erros** — junto com `typecheck` 0, suíte completa e `check:r03` 0, a linha de base 100% verde está confirmada → **A0.12 ✅ completo**.
- **Testes novos/atualizados:** `provenance` 5, `gestor-onboarding-progress` 6, `athlete-table` +1 (coluna Origem), `ScoreboardCard` +2 (procedência presente/ausente), `MatchCard.characterization` +1 (badge "Pinheiros - SP").
- **Validação final:** suíte completa **583/583 suites · 4908/4908 testes**, `typecheck` 0 erros, `lint` 0, `check:r03` 0 violações.
- **Backlog resultante (`TASKS.md`):** A0.12 ✅ e TD-067 ✅; restam como resíduos abertos: **A0.13** (E2E `08-public-match-pool.spec.ts` + migrations), **A0.14** (menores, depende do A0.8/LGPD) e **TD-065** (Fase E — diagnóstico/saneamento em banco, exige PostgreSQL local).

---

## 2.46 A0.13 concluído (E2E 08 + migrations) e TD-065 Fase E concluída — 2026-11-14
- **Commits:**
  1. `a36fe42` `test(e2e)`: **A0.13 item 9** — novo `e2e/flows/08-public-match-pool.spec.ts` (5 testes, padrão `TestContext` do spec 09):
     - cria cartaz público via `POST /api/matches` (`isPublicTemplate`/`isTemplate`/`eventScope: 'PUBLIC'` + `tournamentName` marcador único) e `GET /api/matches/pool?limit=50` → item presente com `annotationCount: 0`;
     - paginação `limit=1` → `nextCursor` string e a página seguinte não repete o item;
     - `annotate mode: 'resolve'` → **201** na 1ª vez, **200** na 2ª com `matchId` igual e `created: false`, e o pool passa a `annotationCount: 1`;
     - `annotate mode: 'create'` repetido → **409** `{ error: 'CONFLICT', details: { code: 'ALREADY_ANNOTATING', matchId } }` (shape confirmado em `reportApiError` + `ConflictError`);
     - UI autenticada (`ctx.authenticatePage(page, 'athlete2')`): `/partidas-publicas` → card filtrado pelo marcador → botão "Anotar esta partida" → `waitForURL(/\/match\/.+\/scoring/)` com margem de 30s (a 1ª execução falhou em 15s por compilação inicial/Fast Refresh da página de scoring no dev server).
     - Ajuste: o `h1` da topbar e o da página têm o mesmo nome acessível → uso de `.first()`.
  2. `6ba508c` `feat(db)`: **TD-065 Fase E** — diagnóstico + saneamento + testes:
     - **Diagnóstico read-only (`psql` em `racket_mvp`):** 11 partidas vivas (7 `IN_PROGRESS PRIVATE_PERSONAL`, 2 cartazes `PRIVATE_CLUB`, 2 `SCHEDULED`), 0 deletadas, 0 templates públicos fora de `PUBLIC`; 5 anotações herdaram o `ctId` do cartaz (**todas com vínculo ativo** do criador em `memberships`/`player_cts`), 1 com o CT próprio do anotador (contexto ativo do JWT — comportamento projetado por `resolveAnnotationCtId`), 2 `PARTICULAR` sem `ctId`; **RLS habilitada** em `Match`/`Player` sem `FORCE` (owner `postgres` não é afetado). **0 divergências comprovadas.**
     - **Saneamento:** novo `scripts/sanitize-match-ctid.ts` (dry-run por padrão, `--apply`) que só corrige anotação que gravou o `ctId` do cartaz **e** cujo criador nunca teve vínculo algum (membership em qualquer status ou `player_cts`) com aquele CT; entrada `pnpm db:sanitize:ctid` no `package.json`. Execuções: dry-run, apply e re-apply → `divergentes=0 corrigidos=0` (idempotente).
     - **Testes:** `matchRepository.scope.test.ts` **+3** (contexto `PARTICULAR` → só próprias sem CT; contexto de CT sem escopo de gestor → próprias do CT + cartazes do CT; gestor em contexto `PARTICULAR` → próprias + derivadas dos membros, sem ramo de CT) → 24/24. `useDashboardMatches.test.tsx` e `match-resolve-payload.test.ts` já cobriam o restante do pedido da Fase E.
- **Migrations (A0.13):** `pnpm db:migrate:status` e `pnpm db:migrate:deploy` contra `racket_mvp` → **34 migrations, "No pending migrations to apply"**.
- **Validação (gates da Fase E):** `typecheck` 0, `check:r03` 0, `test:design` 29/29, suíte completa **583/583 suites · 4911/4911 testes** (+3 novos) e **suíte E2E completa 31/31** (porta 3000 com servidor `next` leftover encerrado antes — o P-01 proíbe reaproveitar servidor sem `DB_TARGET=test`).
- **Backlog resultante (`TASKS.md`):** A0.12 ✅, A0.13 ✅, TD-065 ✅ (Fase E) e TD-067 ✅; **resta apenas A0.14** (consentimento de menores, bloqueado pelo A0.8/LGPD — decisão do usuário de não iniciar).

---

## 2.47 Refatoração dos 7 maiores arquivos de teste em suítes por contexto — 2026-11-15
- **Contexto:** fila externa de testes grandes (LOC · arquivo · categoria · justificativa) — **1127** `hooks/__tests__/useScoringHandlers.test.ts` (Unitário), **984** `components/dashboard/__tests__/MatchCard.test.tsx` (Componente), **943** `services/__tests__/matchService.test.ts` (Integração), **813** `app/api/players/__tests__/route.test.ts` (Integração), **452** `app/api/matches/__tests__/route.characterization.test.ts` (Integração), **381** `app/match/new/__tests__/NewAthleteModal.characterization.test.tsx` (Componente) e **513** `components/scoring/__tests__/editScoreHelpers.characterization.test.ts` (Unitário). A tabela não vive em doc do repo — este registro é a referência canônica. **Os 7 foram divididos e o original deletado** em cada commit (substituições íntegras, nenhuma cobertura perdida).
- **Commits (ordem):**
  1. `1d858da` `test(scoring)`: `useScoringHandlers.test.ts` → **10 arquivos** por contexto + kit `scoringHandlersTestKit`.
  2. `f291162` `test(dashboard)`: `MatchCard.test.tsx` → **10 arquivos** por contexto.
  3. `7ee2a51` `test(services)`: `matchService.test.ts` → **9 arquivos** + kit `matchServiceTestKit`.
  4. `af2f235` `test(api/players)`: `route.test.ts` → **7 arquivos** + kit `playersRouteTestKit`.
  5. `8d8abff` `test`: `route.characterization.test.ts` → **5 arquivos** + kit `matchesRouteTestKit` e `NewAthleteModal.characterization.test.tsx` → **7 arquivos** + kit `newAthleteModalTestKit`.
  6. `67c5ed3` `test`: `editScoreHelpers.characterization.test.ts` → **12 arquivos** + kit `editScoreHelpersTestKit`.
- **Método comum:** cada arquivo ≤ 80L raw (Unitário ≤ 50L quando aplicável); AAA linear com Arrange delegado a `*TestKit` (fora da coleta do Jest, `testMatch` não pega); asserções 1:1 com o original; **zero** `if/for/while/switch/try` nos `.test.*`; gates idênticos por tarefa — contagem raw, grep de controle de fluxo, ESLint 0 erros, `check:r03` 0 regressões, **paridade de statements/funções** (`coverage-final.json` antes × depois) e suíte completa verde antes de apagar o original; commits pequenos, **sem push**.
- **Validação final (estado `67c5ed3`):** suíte completa **636/636 suites · 4918/4918 testes** (delta por tarefa sempre conferido: −N originais +N splitados), `check:r03` 0 regressões, branch `master` **ahead 6** de `origin/master` (`1d858da` … `67c5ed3`), sem push.

---

## 2.48 Perfil e UI do Responsável Legal (Conta de Acompanhamento em /responsavel) — 2026-11-16
- **Contexto & Demanda:**
  - Garantir que a "Conta Básica de Acompanhamento" em `/responsavel` permita **exclusivamente** acompanhar quais partidas o menor sob sua tutela está envolvido (quem criou, quem está anotando, data/hora, status), com histórico sempre presente na tela inicial.
  - Remover completamente o menu hambúrguer (`☰`) para a conta de acompanhamento do responsável.
  - Corrigir reescrita e redirecionamento do Next.js middleware que estava direcionando `/responsavel` para o painel de atleta (`/dashboard`).
- **Resoluções Implementadas:**
  - `src/middleware-area.logic.ts`:
    - Adicionado suporte a `RESPONSAVEL` em `resolveUserActiveArea` para claims `ax`, `role`, `pp` e `mk`.
    - Ajustado `mapPrefixedToInternalRoute` para que `areaCode === 'RESPONSAVEL'` retorne `pathname` (`/responsavel`), impedindo reescrita para `/dashboard`.
  - `src/app/responsavel/guardian-topbar.tsx`:
    - Novo componente topbar dedicado (≤ 55 linhas, R-03 compliant) contendo BrandLogo, título ("Acompanhamento do Menor"), badge discreto "Acompanhante", seletor de tema (`ThemeToggle`) e botão "Sair" com limpeza de sessão segura. **Sem botão de menu hambúrguer**.
  - `src/app/responsavel/page.tsx`:
    - Integração de `GuardianTopBar`, `DependentCard`, `GuardianUpgradeBanner` e `DependentMatchesList` diretamente na tela inicial.
  - `src/app/api/auth/login/`:
    - Ajustado `login-profile-logic.ts` e `login-response.logic.ts` para propagar `effectiveProfile` e `areaForContext = 'RESPONSAVEL'`.
- **Validação:**
  - Testes do middleware de área (`src/__tests__/middleware-area.test.ts`) 100% passando.
  - 28 testes de `middleware-area`, `api/guardians` e `responsavel` verdes (0 falhas).
  - TypeScript `tsc --noEmit` 0 erros.
  - `node scripts/check-r03-line-limit.mjs` 0 violações (1422 arquivos em conformidade).

---

## 2.49 Correção de Sequestro de Tutela de Menores por Sessão Ativa — 2026-11-16
- **Contexto & Demanda:**
  - Usuário identificou que ao acessar a conta do responsável em `/responsavel`, estavam sendo listados múltiplos menores de famílias diferentes (`john piper` e `Lucas Luke`).
  - No modal "Editar Atleta" de `john piper`, os dados do responsável exibiam indevidamente `Johns father` (CPF `33897624001`) em vez do verdadeiro pai cadastrado pelo clube (`DAD JON`, CPF `56335306085`).
- **Causa Raiz Identificada:**
  - Em `src/app/api/guardians/invites/[token]/accept/accept-validation.logic.ts`:
    A função `resolveGuardianUser` continha `if (sessionUser) return sessionUser;` logo no início.
  - Se um usuário no navegador estivesse com qualquer cookie de sessão ativo (ex: o pai de Lucas Luke ou o gestor do CT) ao abrir o link de consentimento do menor `john piper`:
    O sistema ignorava totalmente o CPF informado no formulário de aceite e o `preGuardianCpf` do convite (`56335306085`), associando o menor à conta do usuário logado na sessão (`sessionUser`).
  - Como resultado, os dois menores foram gravados em `guardianLink` apontando para o mesmo `guardianUserId` (`cmwjjmnhb000i112hdgcsfdm3`), misturando tutelas de menores distintos na mesma conta e corrompendo a exibição no modal do gestor.
- **Resolução Implementada:**
  - `src/app/api/guardians/invites/[token]/accept/accept-validation.logic.ts`:
    - `resolveGuardianUser` agora prioriza estritamente o `cleanedCpf` informado/validado. O usuário do responsável é SEMPRE consultado ou criado com base no CPF do responsável.
    - `sessionUser` só é utilizado como fallback se nenhum CPF foi informado e o convite não possuir pré-cadastro de CPF.
  - `src/app/api/guardians/invites/[token]/accept/route.ts`:
    - Resolução de usuário garantida usando `targetCpf = crossCheck.cleanedCpf || invite.preGuardianCpf`.
  - **Saneamento do Banco de Dados:**
    - Criado e executado o usuário legítimo `DAD JON` (CPF `56335306085`) para `john piper`.
    - `GuardianLink`, `GuardianInvite`, `ConsentRecord` e `ConsentEvent` de `john piper` foram reatribuídos para o usuário `DAD JON`.
    - A conta de `Johns father` (`33897624001`) agora possui exclusivamente o seu filho menor `Lucas Luke`.
- **Validação:**
  - Suíte de testes `resolve-guardian-user.test.ts` criada e 100% verde (4/4 testes).
  - 27 testes de `src/app/api/guardians/` passando (0 falhas).
  - `tsc --noEmit` 0 erros; `check-r03-line-limit` 0 violações.

---

## 2.50 Refatoração de timeline-rows, timeline-utils e playerService em suítes por contexto — 2026-11-16
- **Contexto:** continuação da fila de testes grandes (LOC · categoria): **391** `components/scoring/__tests__/timeline-rows.test.tsx` (Componente), **755** `components/scoring/__tests__/timeline-utils.test.ts` (Unitário) e **545** `services/__tests__/playerService.test.ts` (Integração) — 1691L / 120 `it` / 252 `expect` no total.
- **Commit `547fcae`** `test:` — substituição íntegra em um único commit (lote validado de uma vez):
  - `timeline-rows.test.tsx` → **6 suites** (`initials`, `serve`, `serve-fault`, `cascade`, `colors`, `columns`) + kit `timelineRowsTestKit.tsx` (`makePoint`/`baseProps`/`renderRow`/`renderRowCells`/`renderRowWithColors`).
  - `timeline-utils.test.ts` → **13 suites** (enrich ×3, filter, compact-score, format-ace/double-fault/details/summary, labels, validate-rally/fields-a/fields-b) + kit `timelineUtilsTestKit.ts` (`hist`/`FILTER_POINTS`/`COUNT_POINTS`/fixtures de rally).
  - `playerService.test.ts` → **8 suites** (list, create-birthdate/birthyear/basic, find, update-basic/json, count-delete) + kit `playerServiceTestKit.ts` (`createPrismaMock`/`playerRow`/`callArgs`, factory `jest.mock` via `require` no padrão do repo).
- **Método (idêntico à 2.47):** ≤80L raw por arquivo, AAA linear com Arrange delegado a `*TestKit` (fora da coleta do Jest), asserções 1:1 (120 `it`/252 `expect` preservados), **zero** `if/for/while/switch/try/do` nos `.test.*` (o único `if` do original virou ternário no `validate-rally`), `beforeEach(jest.clearAllMocks)` removido (cubra `clearMocks:true`/`restoreMocks:true`).
- **Gates (todos PASSARAM):** paridade de statements/funções `coverage-final.json` antes × depois = **PARIDADE TOTAL** (1414 arquivos); ESLint **0 erros** (27 testes + 3 kits); `check:r03` 0 regressões; grep de controle de fluxo limpo; over80 = 0; suíte completa **705/705 suites · 4991/4991 testes** (681 + 27 − 3).
- **Estado:** branch `master` **ahead 12** de `origin/master`, **sem push**; originais removidos no próprio commit.

---

## 2.51 Refatoração de engine.characterization, engine.flow.characterization e engine-edge-cases em suítes por contexto — 2026-11-17
- **Contexto:** fila de testes grandes (LOC · categoria): **610** `src/core/scoring/__tests__/engine.characterization.test.ts` (Unitário), **740** `src/core/scoring/__tests__/engine.flow.characterization.test.ts` (Integração) e **489** `src/core/scoring/__tests__/engine-edge-cases.test.ts` (Unitário) — 1839L / 141 `it` / 308 `expect` no total. Os 7 `engine*` pré-existentes fora do escopo não foram tocados.
- **Commits `test:`** (um por arquivo, cada um já verde):
  - `e45fbf9` — characterization → **9 suites** (`constructor`, `validation`, `faults`, `points`, `deuce`, `completion`, `server-undo`, `history`, `state-ops`) + kit `engineCharacterizationTestKit.ts` (`scoringState`/`createConfig`/`makeEngine`/`winPoints`/`winGame`/`winSet60`/`winSet64`/`toDeuce`/`reachTiebreak`).
  - `0db47aa` — flow characterization → **10 suites** (`regular-points`, `match-tiebreak`, `game-won`, `set-completion`, `tiebreak-points`, `should-start-tiebreak`, `should-start-mt`, `is-set-complete`, `format-rules`, `mt-active`) + kit `engineFlowTestKit.ts` (`stateWithSets`/`playRegular`/`toDeuce`/`playMatchTiebreak`/`playTiebreak`/`playTiebreakSequence`).
  - `40b6862` — edge-cases → **10 suites** (`match-tb10`, `pro-set-8`, `short-set`, `best-of-3-match-tb`, `undo`, `serialization`, `server`, `load-clear`, `reconcile`, `tiebreak-advanced`) + kit `engineEdgeTestKit.ts` (`makeConfig`/`createEngine`/`makePoint`/`winPoints`/`winGame`/`winGames`/`winGamesPair`/`serversAfter`).
- **Método (idêntico à 2.47/2.50):** ≤80L raw por arquivo, AAA linear com Arrange delegado a `*TestKit` (fora da coleta do Jest, não limitados a 80L), asserções 1:1 (48/88 + 67/133 + 26/87 preservadas), **zero** `if/for/while/switch/try/do` nos `.test.*`. Código morto dos originais (`winSet` e `createGameScore`, só definição) não reproduzido; o único loop com `expect` do edge (sequência de sacadores) virou helper `serversAfter` + 2 expects estáticos.
- **Gates (todos PASSARAM):** paridade de statements/funções `coverage-final.json` antes × depois = **PARIDADE TOTAL** (1414 arquivos de produção, driver `eng-parity.js` ignorando `__tests__`); ESLint **0 erros** (29 testes + 3 kits); `check:r03` exit 0; grep de controle de fluxo **0 hits**; over80 = 0; suíte completa **731/731 suites · 4991/4991 testes** (705 + 29 − 3).
- **Estado:** branch `master` **ahead 16** de `origin/master`, **sem push**; originais removidos nos próprios commits.

## 2.52 Refatoração de game-processing, score-adjustment-mt-formats e scoring-logic.characterization em suítes por contexto — 2026-11-17
- **Contexto:** fila de testes grandes (LOC · categoria): **387** `src/core/scoring/__tests__/game-processing.test.ts` (Unitário), **450** `src/core/scoring/__tests__/score-adjustment-mt-formats.test.ts` (Unitário) e **721** `src/core/scoring/__tests__/scoring-logic.characterization.test.ts` (Unitário) — 1558L / 141 `it` / 221 `expect` no total. Arquivos pré-existentes fora do escopo (`score-adjustment-integration`, `scoring-logic.test`, `scoring-logic.real`, `game-server-change`, `scoring-formats.baseline.characterization`) não foram tocados.
- **Commits `test:`** (um por arquivo, cada um já verde):
  - `606ca3d` — game-processing → **5 suites** (`regular-points`, `deuce`, `no-ad`, `on-game-won`, `on-game-won-sets`) + kit `gameProcessingTestKit.ts` (`createBaseState`/`createConfig`/`createGame`/`setScore`).
  - `0120c8f` — score-adjustment → **8 suites** por formato/lógica-estado (`best-of-3-match-tb-logic`, `best-of-3-match-tb-state`, `best-of-5-logic`, `best-of-5-state`, `short-set`, `match-tb10`, `best-of-3`, `pro-set-8`) + kit `scoreAdjustmentTestKit.ts` (`makeConfig`/`setResult`/`setScore`/`finishedState`).
  - `84a274e` — scoring-logic.characterization → **10 suites** (`game-score-label`, `break-point`, `game-ball`, `set-ball`, `enrich-basics`, `enrich-flags`, `enrich-rally-length`, `enrich-tiebreak-deuce`, `enrich-fault-rally`, `enrich-set-score`) + kit `scoringLogicTestKit.ts` (`createBaseState`/`createPointLog`/`createHistoryEntry`/`setScore`/`game`).
- **Método (idêntico à 2.47/2.50/2.51):** ≤80L raw por arquivo, AAA linear com Arrange delegado a `*TestKit` (fora da coleta do Jest, não limitados a 80L), asserções 1:1 (66 + 59 + 96 preservadas), **zero** `if/for/while/switch/try/do` nos `.test.*`. `setResult` **omite a chave `tiebreakScore`** quando não informada (chave ausente ≠ undefined, igual aos literais do original). Overrides redundantes iguais ao default removidos. `break-point` reescrito comprimido (88→74L) e `enrich-rally-tiebreak` dividido em 2 (91→`rally-length` + `tiebreak-deuce`) após over80.
- **Gates (todos PASSARAM):** paridade de statements/funções `coverage-final.json` antes × depois = **PARIDADE TOTAL** (1414 arquivos de produção, driver `sc-parity.js` ignorando `__tests__`); ESLint **0 erros** (23 testes + 3 kits); `check:r03` exit 0; grep de controle de fluxo **0 hits**; over80 = 0; suíte completa **751/751 suites · 4991/4991 testes** (731 + 23 − 3).
- **Estado:** branch `master` **ahead 20** de `origin/master`, **sem push**; originais removidos nos próprios commits.

## 2.53 Refatoração de scoring-protections e set-completion em suítes por contexto — 2026-11-17
- **Contexto:** fila de testes grandes (LOC · categoria): **477** `src/core/scoring/__tests__/scoring-protections.test.ts` (Unitário) e **383** `src/core/scoring/__tests__/set-completion.test.ts` (Unitário) — 860L / 57 `it` / 97 `expect` no total. Os 2 arquivos pré-existentes fora do escopo não foram tocados.
- **Commits `test:`** (um por arquivo, cada um já verde):
  - `b7eddbc` — scoring-protections → **7 suites** por proteção (`mt-validation`, `mt-normalize`, `mt-serialize`, `game-regression`, `tiebreak-regression`, `sets-won-floor`, `sequence-flush`) + kit `scoringProtectionsTestKit.ts` (`normalizeMatchTiebreakState`/`getProgress`/`isTiebreakRegressing`/`isMalPersistedRegressing`/`malformedMtState`).
  - `6e1b85b` — set-completion → **7 suites** por contexto (`complete-set`, `complete-set-formats`, `complete-set-with-tiebreak`, `is-set-complete`, `is-set-complete-no-ad`, `is-set-complete-pro-set`, `encerramento-short-sets`) + kit `setCompletionTestKit.ts` (`createBaseState`/`createConfig`/`setScore`).
- **Método (idêntico à 2.47/2.50/2.51/2.52):** ≤80L raw por arquivo, AAA linear com Arrange delegado a `*TestKit` (fora da coleta do Jest, não limitados a 80L), asserções 1:1 (40 + 57 preservadas), **zero** `if/for/while/switch/try/do` nos `.test.*`. Os **23 hits** de controle de fluxo do original (helpers `normalizeMatchTiebreakState` duplicado, `getProgress` ×3, `isTiebreakRegressing` ×3) migraram para o kit. Locais mortos do original (`format` não usado em 4 its, `offlinePoints`/`sentSequence` não usados) não reproduzidos; a variante mal persistida de regressão virou `isMalPersistedRegressing` distinta de `isTiebreakRegressing`.
- **Gates (todos PASSARAM):** paridade de statements/funções `coverage-final.json` antes × depois = **PARIDADE TOTAL** (1414 arquivos de produção, driver `sp-parity.js` ignorando `__tests__`; padrões com âncora `[/\\]` para não casar `engine.flow.set-completion.test.ts`); ESLint **0 erros** (14 testes + 2 kits); `check:r03` exit 0; grep de controle de fluxo **0 hits** nos 14 novos (12 concentrados nos kits); over80 = 0; suíte completa **763/763 suites · 4991/4991 testes** (751 + 14 − 2).
- **Estado:** branch `master` **ahead 23** de `origin/master`, **sem push**; originais removidos nos próprios commits.

## 2.54 Refatoração de useScoringHandlers-undo e useSessionManager.state-builder em suítes por contexto — 2026-11-17
- **Contexto:** fila de testes grandes (LOC · categoria): **578** `src/hooks/__tests__/useScoringHandlers-undo.test.ts` (Unitário) e **387** `src/hooks/__tests__/useSessionManager.state-builder.test.ts` (Unitário) — 965L / 24 `it` / 75 `expect` no total. Os demais arquivos da pasta (ex.: `useScoringHandlers-fetchMatch.test.ts`, `state-builder.mtb-partial/short-set/real`) não foram tocados.
- **Commits `test:`** (um por arquivo, cada um já verde):
  - `1a08075` — undo → **5 suites** por contexto (`callbacks`, `guards`, `history-trim`, `patch-atomic`, `return-screen`) + kit `scoringHandlersUndoTestKit.ts` (`mockUndoEngineModule`/`mockReactModule` — factories dos `jest.mock`, `createUndoContext`, `undoEngine` com opções `sets/game/startedAt/undoResult/undoOnce/historyLength/withoutState/withIsFinished`, `undoTestSetup`/`undoTestTeardown`).
  - `3df7e56` — state-builder → **6 suites** por formato/cenário (`match-tb`, `match-tb-10`, `tiebreak-regular`, `score-regression`, `set-atual-empurra`, `set-atual-nao-empurra`) + kit `useSessionManagerStateBuilderTestKit.ts` (`setResult`/`buildState`).
- **Método (idêntico à 2.47–2.53):** ≤80L raw por arquivo, AAA linear com Arrange delegado a `*TestKit`, asserções 1:1 (31 + 44 preservadas), **zero** `if/for/while/switch/try/do` nos `.test.*` (2 hits concentrados no kit do undo). Padrão de `jest.mock(..., () => mockXxx())` seguiu os irmãos já existentes (`returnToPreviousScreen`/`ghostPoint`/`onPointProcessed`): kit importado **antes** de `@testing-library/react` e do hook (a factory só roda quando o módulo mockado é requisitado — o kit não pode importar o hook em runtime, senão o binding `mock*` ainda não existe). O `try/finally` do teste de debounce (`jest.useFakeTimers`) virou `jest.useRealTimers()` dentro do `undoTestTeardown`. Espies locais mortos (`persistState`, `open` do it de debounce) não reproduzidos e asserções redirecionadas para os mesmos `jest.fn()` do ctx base; `setResult` preserva a **presença/ausência** da chave `tiebreakScore: undefined` (spread de `extra`) idêntica ao original.
- **Gates (todos PASSARAM):** paridade de statements/funções `coverage-final.json` antes × depois = **PARIDADE TOTAL** (1414 arquivos de produção, driver `sp-parity.js` ignorando `__tests__`; padrões **enumerados explicitamente** para os 6 splits novos de state-builder, para não casar os irmandades pré-existentes `state-builder.mtb-partial/short-set/real`); ESLint **0 erros** (11 testes + 2 kits); `check:r03` exit 0; grep de controle de fluxo **0 hits** nos 11 novos; over80 = 0 (máx. 74L); suíte completa **772/772 suites · 4991/4991 testes** (763 − 2 + 11).
- **Armadilha registrada:** o `@jest-environment jsdom` precisa estar num docblock de **uma linha** (`/** @jest-environment jsdom */`); num docblock multi-linha o Jest captura o resto do parágrafo como nome do ambiente ("jsdom Split de ... cannot be found").
- **Estado:** branch `master` **ahead 26** de `origin/master`, **sem push**; originais removidos nos próprios commits.

## 2.55 Refatoração de contracts, matchService.characterization e matchValidator.characterization em suítes por contexto — 2026-11-17
- **Contexto:** fila de testes grandes (LOC · categoria): **635** `src/schemas/__tests__/contracts.test.ts` (Unitário), **629** `src/services/__tests__/matchService.characterization.test.ts` (Integração) e **449** `src/services/__tests__/matchValidator.characterization.test.ts` (Integração) — 1713L / 146 `it` / 237 `expect` (206 testes em tempo de execução). O 4º item da fila, **545** `src/services/__tests__/playerService.test.ts` (Integração), **já não existe**: foi refatorado em `547fcae` (tarefa 2.50) em 8 splits `playerService.*` + kit `playerServiceTestKit.ts` (soma 436L) — nenhum arquivo tocado.
- **Commits `test:`** (um por arquivo, cada um já verde):
  - `e637c60` — contracts → **11 suites** por schema (`enums-rally-1`, `enums-rally-2`, `enums-match`, `rally-details`, `player-user`, `score-schemas`, `match-create-player`, `user-list-inputs`, `match-inputs`, `login-ranking`, `arrangement`) + kit `contractsTestKit.ts` (listas dos `it.each`, fixtures `validRally/fullRally/validUser/tiebreakSet/validScoreState/validMatch/fullCreatePlayer/validCreateUser/validCreateMatch/fullCreateMatch/fullFinishMatch/validArrangement/aliasedArrangement` e `parsedData()`/`parsedError()`).
  - `8f60e2d` — matchService.characterization → **10 suites** por operação (`create`, `create-optional`, `list-get`, `update-basic`, `update-advanced`, `delete`, `finish-reasons`, `finish-errors`, `transition-ok`, `transition-errors`) + kit `matchServiceCharacterizationTestKit.ts` (`mockPrismaModule` — factory do `jest.mock('@/lib/prisma')` com `__txMock` e `$transaction` aceitando callback **ou** array, `PLAYER_1/2`, `baseCreatedMatch`, `matchRow()`, `deleteRow()`, `fullCreateInput()`, `fullCreatedMatch()`, `finishedScoreState()`, `mockFinishedEngine()`).
  - `cc5e8c3` — matchValidator.characterization → **8 suites** por função (`finish-status`, `finish-reasons`, `finish-winner`, `transition-basic`, `transition-regression`, `game-point-count`, `current-game`, `tiebreak`) + kit `matchValidatorCharacterizationTestKit.ts` (`baseMatch/matchWith/finishedScoreState/scoreState/game/setScore/tbSet`).
- **Método (idêntico à 2.47–2.54):** ≤80L raw por arquivo, AAA linear com Arrange delegado a `*TestKit`, asserções 1:1 (102 + 83 + 52 = 237 preservadas; `it()` 75 + 37 + 34 = 146 e `it.each` 12 preservados), **zero** `if/for/while/switch/try/do` nos `.test.*` (1 hit real no kit do matchService, no `$transaction`, permitido). Os **7 `if` de guarda do `contracts.test.ts`** (`if (result.success)` / `if (!result.success)` em 6 testes) viraram acesso direto via `parsedData()`/`parsedError()` do kit — em todos eles o assert anterior de `result.success` já garantia o ramo, então o comportamento é equivalente.
- **Gates (todos PASSARAM):** paridade de statements/funções `coverage-final.json` antes × depois = **PARIDADE TOTAL** (1414 arquivos de produção, driver `sp-parity.js` ignorando `__tests__`; padrões **enumerados explicitamente** dos 29 splits novos, para não casar os irmandades pré-existentes `matchValidator.tiebreak/real/isUndo/envelope`, `matchService.transition-*/create-match/update-delete/delete-finish/list-matches/get-session` nem `PointFlowInputSchema`/`MatchStateInputSchema`); ESLint **0 erros** (29 testes + 3 kits); `check:r03` exit 0; grep de controle de fluxo **0 hits** nos 29 novos; over80 = 0 (máx. 75L); suíte completa **798/798 suites · 4991/4991 testes** (772 − 3 + 29).
- **Decisão:** o `beforeEach(() => { jest.clearAllMocks(); })` original foi mantido em cada split apesar de `clearMocks: true` no `jest.config.js` (redundante, porém idêntico ao original e custa 3L); o `spy.mockRestore()` dos testes de `transitionMatchState` também foi mantido inline.
- **Estado:** branch `master` **ahead 30** de `origin/master`, **sem push**; originais removidos nos próprios commits.

## 2.56 Refatoração de matchRepository/match-event-visibility/route-gestor/visibility/point-permissions characterization em suítes por contexto — 2026-11-17
- **Contexto:** fila de testes grandes (LOC · categoria): **168** `src/services/__tests__/matchRepository.characterization.test.ts` (Integração), **128** `src/core/access/__tests__/match-event-visibility.characterization.test.ts` (Unitário), **93** `src/app/api/gestor/matches/__tests__/route.characterization.test.ts` (Integração), **88** `src/core/access/__tests__/visibility.characterization.test.ts` (Unitário) e **85** `src/app/api/matches/[id]/__tests__/point-permissions.characterization.test.ts` (Integração) — 562L / 33 `it` / 71 `expect` (33 testes em runtime), todos com **0** ocorrências de fluxo no baseline.
- **Commits `test:`** (um por arquivo, cada um já verde):
  - matchRepository.characterization → **4 suites** (`personal-ct`, `followed`, `gestor-assigned`, `template-scope`) + kit `matchRepositoryCharacterizationTestKit` (`mockPrismaModule`/`getPrismaMock`).
  - match-event-visibility.characterization → **5 suites por `eventScope`** (`public`, `private-club`, `private-coach`, `private-players`, `private-personal`) + kit (`actor`/`member`/`tpl`/`CT`/`OTHER_CT`).
  - route.characterization (gestor) → **2 suites** (`denied`, `designated`) + kit `routeGestorMatchesCharacterizationTestKit` (factories dos 3 `jest.mock`: prisma, `../../_logic`, `withAccessHandler`).
  - visibility.characterization → **3 suites por função** (`read`, `annotate`, `comments-watch`) + kit (`actor`/`member`/`match` `MatchAccess`).
  - point-permissions.characterization → **2 suites por guarda** (`annotator-permission`, `modify-state`) + kit (`mockPrismaModule`/`baseMatch`).
- **Armadilha registrada (NOVA e importante):** `import { jest } from '@jest/globals'` **desativa o hoisting do `jest.mock`** (SWC do next/jest): com `jest` como binding importado, os `require()` dos imports são emitidos antes da chamada `jest.mock(...)`, então um **import estático do módulo mockado** (`import { prisma } from '@/lib/prisma'`) captura o cliente **real** — sintoma: `TypeError: ...mockResolvedValue is not a function` (5 suítes/8 testes falharam). Os originais passavam porque **nunca** importavam o módulo mockado estaticamente (mock em `const` local + `require` lazy no corpo do teste). Correção sem remover o import `@jest/globals`: **singleton no kit** (`getPrismaMock()` + factory `mockPrismaModule()` devolvendo a MESMA instância) e nos testes `const mockPrisma = getPrismaMock()`, sem importar `@/lib/prisma`. Diagnóstico feito com 2 arquivos `zz-mock-debug*.test.ts` (removidos em seguida).
- **Detalhes de caminho:** `route.characterization.test.ts` **não é nome único** — **6 homônimos no momento do lote** (auth/login, auth/me, auth/refresh, gestor/matches, matches/suspended-sessions, matches/[id]/point/[pointId]/audio); o de `gestor/matches` era justamente um dos originais apagados, restando **5** após a tarefa → padrão de coverage enumerado com o segmento `gestor[/\\]matches[/\\]__tests__`; irmandades `matchRepository.context/scope`, `visibility.test/visibility-context`, `route.test` não foram tocadas. Paths com `[id]` exigem `Get-Content -LiteralPath`/`Select-String -LiteralPath`/`Test-Path -LiteralPath` (PowerShell trata `[id]` como wildcard — confirmado em 2.57: `-Path` retorna False onde `-LiteralPath` retorna True); no **git**, pathspec **plain** casa `[id]` literalmente (`git ls-files` e `git add -n` com exit 0) — `:(literal)` é precaução válida, **não obrigatória** (verificado em 2.57).
- **Gates (todos PASSARAM):** paridade de statements/funções antes × depois = **PARIDADE TOTAL** (1414 arquivos, driver `sp-parity.js`; padrões enumerados dos 16 splits); ESLint **0 erros** (16 testes + 5 kits); `check:r03` exit 0; grep de fluxo **0 hits** (0 também nos kits); over80 = 0 (máx. 63L); suíte completa **809/809 suites · 4991/4991 testes** (798 − 5 + 16).
- **Estado:** branch `master` **ahead 36** de `origin/master`, **sem push**; originais removidos nos próprios commits.

## 2.57 Auditoria pós-lotes: originais removidos, armadilhas corrigidas e nota de caminhos higienizada — 2026-11-17
- **Frente 1 (todos os originais removidos):** **27 commits de refactor** no histórico (23 `test: refatora` + 4 `test(...): dividir…`: `af2f235`, `7ee2a51`, `f291162`, `1d858da`) cobrem **32 caminhos originais**, todos com status `D` ou `R` no próprio commit e **0 existindo no disco** (28 verificados via `Test-Path -LiteralPath` + 4 dos "dividir"). `src/app/api/players/[id]/__tests__/route.test.ts` (419L) **não** é original refatorado (histórico apenas de feature commits; `player-put-identity.test.ts`/`route.real.test.ts` nasceram em commits feat) — segue como item da fila. Restam **321** arquivos `.test.*` >80L (fila nunca refatorada).
- **Frente 2 (armadilhas corrigidas):** varredura dos **809** arquivos `.test.ts(x)` com fecho transitivo de imports estáticos (`import type` excluído):
  - **Armadilha do `jest.mock` (registrada na 2.56):** **1 quebra real** — `src/app/api/users/profile/__tests__/profile.test.ts` importava `jest` de `@jest/globals` **e** `@/lib/prisma` estaticamente (import sem uso) com `jest.mock('@/lib/prisma')`; **+24 latentes** (import de `jest` + `jest.mock`, mas alvo fora do fecho — verdes hoje, quebrariam ao adicionar um import estático). Correção: removido `jest` do import nos **25** arquivos (padrão dos demais **249** com `jest.mock`; **207** deles já tinham o alvo do mock no fecho estático → prova empírica de que o hoist funciona com o `jest` global) e saiu também o import morto de `@/lib/prisma` do `profile.test.ts`.
  - **Armadilha do `@jest-environment` (registrada na 2.54):** **0 ocorrências** — 263 diretivas, todas em forma de linha única (228 ` * @jest-environment jsdom` + 35 `/** @jest-environment jsdom */`), nenhuma com texto sobrando na linha.
  - **Guard criado:** `scripts/check-test-mock-traps.mjs` (`pnpm check:mock-traps`, integrado ao `test:strict`) falha nas duas armadilhas — auto-testado com probe temporário (exit 1 nas 2 regras) e repo limpo (exit 0); documentado em `docs/RULES.md` (seções 5, 8 e 12). Commits `89d1ddc` (25 testes) e `c28b361` (script + package.json + RULES).
- **Frente 3 (nota de caminhos da 2.56 higienizada — verificação empírica):** (a) homônimos de `route.characterization.test.ts`: **6 no momento do lote**, **5 hoje** (o 6º era o próprio original do gestor, apagado no lote) — nota corrigida; (b) PowerShell: `Test-Path -Path` = False vs `-LiteralPath` = True com `[id]` → **`-LiteralPath` é obrigatório** (claim confirmada); (c) git: pathspec **plain** casa `[id]` literalmente (`git ls-files`, `git add -n`, exit 0) → **`:(literal)` não era obrigatório**, era precaução (claim corrigida na nota da 2.56). Os nomes novos `route.characterization-denied/designated.test.ts` são únicos no repo.
- **Gates:** typecheck ok; ESLint **0 erros**; `pnpm check:mock-traps` exit 0 (809 arquivos); suíte completa **809/809 suites · 4991/4991 testes**.
- **Estado:** branch `master` **ahead 39** de `origin/master`, **sem push**; alterações próprias restritas a testes/docs/scripts — `src/app/api/auth/signup/signup-post.logic.ts` e `src/app/privacidade/page.tsx` (alterações do usuário na working tree) ficaram **intocados e fora dos commits**.



