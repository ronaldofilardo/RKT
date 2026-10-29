# PLANO DE IMPLEMENTAÇÃO — Pool de Busca, Cadastro de Atletas e Reivindicação de Identidade (RKT / bkpRKT)

**Data:** 2026-10-27  
**Escopo:** Busca em pool (atletas e clubes/CTs) no cadastro de atleta e na nova partida, toggle "Meu clube", cadastro rápido de atleta sem conta, CPF como chave de identidade e reivindicação (*claim*) automática quando o atleta se cadastra.  
**Referências:** AGENTS.md, docs/RULES.md, docs/ARCHITECTURE.md (ADR-0008), docs/DESIGN.md, docs/TASKS.md, docs/MEMORY.md, docs/PLANO_MENU_PERFIL_POOL_ECOSISTEMA_2026-10-26.md.

---

## 0. Como trabalhar (regras do projeto)

1. **Characterization-First (RULES §7):** antes de alterar `GET/POST /api/players`, `useNewMatchState`, `NewAthleteModal`, `matches-post.logic.ts` ou `signup/route.ts`, escrever/rodar testes `*.characterization.test.ts` que fixem o comportamento atual. Comportamentos anômalos tornam-se `[TD-XXX]` em `docs/TASKS.md`.
2. **Baby steps:** `pnpm typecheck` + testes do módulo a cada passo; `pnpm test:strict` ao fim de cada fase.
3. **Testes pulados proibidos:** `scripts/check-no-skipped-tests.mjs`.
4. **Núcleo puro (`src/core/**`):** sem I/O, sem React/Next/Prisma. Regras de pool, CPF e duplicidade residem em `src/core/access/pool.ts`, `src/core/athlete/cpf.ts` e `src/core/athlete/dedup.ts`.
5. **Menu e UI orientam, a API protege:** Toda regra de escopo é imposta no servidor.
6. **R-03:** arquivos com menos de 100 linhas; `route.ts` finos; lógica em `*.logic.ts`; Zod em arquivo de schema separado.
7. **UI:** tokens `telemetry-*`; classes puras proibidas em páginas-chave (`test:design`); `jsx-a11y` estrito.
8. **Compatibilidade:** o fluxo do anotador (`/dashboard`, `/match/new`, scoring) não pode regredir.
9. **Imports absolutos:** `@/...`. `strict`, `noUnusedLocals`, `noUnusedParameters` ligados.
10. **Migrations aditivas:** nenhum `onDelete: Cascade` novo em dado esportivo.
11. **Documentação final:** `docs/PRD.md`, `docs/ARCHITECTURE.md` (ADR-0010 e ADR-0011), `docs/glossario.md`, `docs/TASKS.md`, `docs/MEMORY.md`, `src/app/api/CONTRACTS.md`.

---

## 1. Decisões Consolidadas

| Tema | Decisão |
|---|---|
| **Pool** | Atletas, clubes/CTs e partidas pertencem a um pool global (ADR-0008). Clube/CT é vínculo e contexto, nunca dono. |
| **Toggle "Meu clube"** | `true` → busca e cadastro restritos ao(s) CT(s) do ator. `false` → busca no pool. |
| **Avulso** | Sem vínculo com CT, o toggle não aparece e o valor é `false`. |
| **Ator com 2+ CTs** | Com "Meu clube = true", o seletor de qual CT é obrigatório. |
| **Gestor / Treinador criando atleta com "Meu clube"** | `PlayerCT` nasce `ACTIVE`. |
| **Atleta criando atleta com "Meu clube"** | `PlayerCT` nasce `PENDING`; o gestor confirma. Atleta nunca inclui pessoas no clube sozinho. |
| **Atleta criando atleta** | Não cria conta de usuário. Cria `Player` no pool (cadastro rápido, `PROVISIONAL`). |
| **Quem cria login** | Apenas Gestor e Treinador (modo "com login"). |
| **Lista de clubes** | Unificada a partir de `Club`, com `Club.ctId` opcional ligando ao `TrainingCenter`. |
| **Privacidade do pool** | A busca global devolve dados mínimos; menores são mascarados. |
| **CPF do atleta sem conta** | `Player` guarda `cpfHash` (HMAC-SHA256) e `cpfLast2`. O CPF completo reside só em `User.cpf`. |
| **CPF no cadastro rápido** | Opcional ("se souber"). Obrigatório no modo com login. |
| **Claim automático** | Quando CPF e data de nascimento no `/signup` coincidem com um atleta `PROVISIONAL`, a vinculação é imediata para maiores de idade. |
| **Desvínculo** | Restrito ao Gestor do CT ou Suporte da Plataforma (ADR-0008). |

---

## 2. Problemas Identificados no Código Atual

- **P1:** `POST /api/athlete-claims` sem autenticação e com `userId` no corpo (qualquer um reivindica em nome de qualquer conta).
- **P2:** `GET /api/players` sem `userId` devolve todos os atletas sem escopo nem mascaramento.
- **P3:** `createPlayer` não gera `athleteCode` (@unique nullable).
- **P4:** `generateAthleteCode` usa `Math.random()` e não trata colisões na persistência.
- **P5:** `/signup` cria sempre um novo `Player` para ATLETA sem buscar provisório correspondente.
- **P6:** `/signup` grava e-mail na coluna `User.cpf` quando o login é por e-mail e não valida dígitos do CPF.
- **P7:** `CreatePlayerInputSchema` sem `cpf`, `myClub` nem `ctId`; `club` é texto livre.
- **P8:** `listMatches` filtra apenas por `createdByUserId`.
- **P9:** `Club` e `TrainingCenter` são paralelos e desconectados.
- **P10:** Sem índice de busca por nome em `Player`.
- **P11:** `buildActor` não carrega CTs de atleta via `PlayerCT`.

---

## 3. Modelo de Identidade e Níveis do Atleta

- **N0 (Provisório Básico):** Cadastro rápido (nome + 1 metadado esportivo). `identityStatus: PROVISIONAL`, `userId: null`.
- **N1 (Identificado):** Provisório com CPF e nascimento (`+ cpfHash, cpfLast2, birthDate`). `identityStatus: PROVISIONAL`, `userId: null`.
- **N2 (Confirmado):** Claim automático/aprovado ou cadastro com login. `identityStatus: CONFIRMED`, `userId: string`.

---

## 4. Roteiro de Execução por Fases

- **Fase 0:** Testes de Caracterização (Characterization-First) para travar o comportamento atual.
- **Fase 1:** Correção Imediata de Segurança (P1: proteger `/api/athlete-claims`) e Correção de `User.cpf` (P6: `/signup` sem gravar e-mail em CPF + sanitização).
- **Fase 2:** Modelo de Dados, Criptografia e Migrations (`Player.cpfHash`, `Player.cpfLast2`, `Club.ctId`, HMAC com `CPF_HASH_PEPPER`, geração segura de `athleteCode`).
- **Fase 3:** Busca no Pool e Escopo (`GET /api/players/pool`, mascaramento de dados de menores e restrição de escopo).
- **Fase 4:** Cadastro de Atleta (Rápido vs. Com Login, toggle "Meu clube", criação de `PlayerCT` ACTIVE ou PENDING).
- **Fase 5:** Claim Automático e Cadastro de Conta (`/signup` reconciliando atleta provisório N1/N0 com validação de maioridade e auditoria).
- **Fase 6:** Unificação de Clubes e Venues (`TrainingCenter` sincronizado com `Club` via `ctId`).
- **Fase 7:** Frontend Nova Partida e Modais (Toggle "Meu clube", seleção de CTs, sincronização offline). Atleta ou treinador vinculado a um CT/clube também pode anotar partidas de outros jogadores; a partida criada entra no pool do clube e do sistema (visível via `GET /api/players/pool` e escopo do CT).
- **Fase 8:** Suporte e Resolução de Conflitos (Merge de atletas provisórios e resolução de claims pendentes).
- **Fase 9:** Testes Rigorosos (Strict, Design, A11y, Coverage).
- **Fase 10:** Documentação e Encerramento (ADR-0010, ADR-0011, PRD, TASKS).

