# Plano – Alterações RKT (base: RKT_alter_261026.docx)

Data: 27/out/2026 · Escopo: dashboard, nova partida, /scoring e Estatísticas Avançadas.
Este documento é só o plano. Nenhum arquivo do projeto foi alterado.

## 1. Decisões fechadas

| Tema | Decisão |
|---|---|
| Card do dashboard | Mesma estrutura de tabela do `ScoreboardCard` (/scoring): linha de títulos, coluna de vencedor/sacador, células de set. Os pontos do game (15/30/40) deixam de aparecer. |
| Cores do card | Mantém as cores da quadra (saibro, grama, dura) e do estado suspenso. |
| Sobrescrito de tiebreak | Só em set jogado em games. Vencedor mostra `7` sem número; perdedor mostra `6` com sobrescrito dos pontos dele no TB. Match Tiebreak: só o placar do TB, sem sobrescrito. |
| Colunas por formato | `BEST_OF_5` = Set 1, Set 2, Set 3, Set 4, TB. Match TB = TB. Demais formatos mantêm a regra atual. |
| Data da partida | Vazia por padrão na criação, opcional. Ao iniciar a anotação é preenchida com hoje. |
| Faixas de rally | Fonte da verdade: modal Detalhes do Ponto. 1–4 (implícita), 5–8 (`opcao_2`), 9+ (`opcao_3`). É o que `resolvePointRallyCategory` já faz. Só os rótulos da tela estão errados (1–3, 4–6, 7+). |
| D3 | "Aproveitamento/total" = winners/total do fundo, exibido "x/y". As três faixas mostram "ganhos/total" de cada faixa. |
| D4/D6 | "SFBH" = SVBH. |
| D7 | Sequências exatas de 2, 3 e 4+ pontos, por jogador. |
| D8 | Mantém Pontos, Aces, Winners e Erros; acrescenta tempo total do jogo e duração por set. |

## 2. Numeração das seções (coerência com a tela atual)

Seções atuais: 1 Saque, 2 Devolução, 3 Fundo de Quadra, 4 Rally, 5 Rede e Passada, 6 Pontos de Pressão, 7 Definição do Ponto, 8 Estatísticas dos Golpes, 9 Momentum, Breakdown por Set (sem número).

O documento só traz as seções que mudam, e os números 6, 7 e 8 dele não coincidem com a tela (6 e 7 já são Pressão e Definição do Ponto). Proposta: **não renumerar nada que já existe**. Golpes continua 8, Momentum continua 9 e o Breakdown ganha o número 10. Nenhuma seção sai da tela.

## 3. Fatos do código que condicionam a execução

- Aproach FH e BH **são gravados** (`approach_fh`, `approach_bh` em `RallyGolpeSchema` e no modal). A separação é possível sem campo novo, ao contrário do que dizia o plano de 24/out.
- `classifyStrokeCategory` agrupa tudo em `aproachs` e não tem linha de saque. Pontos de Rede sem golpe de aproximação gravado hoje caem em `aproachs`; com a separação passam a ficar de fora da tabela de golpes (continuam na seção 5).
- A duplicidade de partida (`findDuplicateMatch`) ignora `matchType` e parceiros e usa o dia inteiro.
- O `ScoreboardCard` não recebe parceiros.
- Regras do projeto: characterization-first (RULES §7), até 500 linhas por arquivo e 30 por função, `pnpm test:strict` e `pnpm test:design`, sem classes Tailwind genéricas nas páginas-chave.

## 4. Fases

### Fase 1 – Nova partida (B1, B3)
1. `match-type-toggle.tsx`: rótulos "Simples" e "Duplas".
2. `DateTimeSection.tsx`: remover o bloco "Atenção"; remover asterisco de "Data".
3. `useNewMatchState.ts`: remover o preenchimento automático com hoje na criação.
4. `new-match-validate-fields.logic.ts`: tirar `Data` dos obrigatórios.
5. `build-match-payload.logic.ts`: sem data, `scheduledAt` fica indefinido.
6. Preencher hoje ao iniciar a anotação: ler `start-match.logic.ts`, `useNewMatchSubmissionActions.ts` e a transição de estado (`match-service-transition.service.ts`) e definir um único ponto de gravação.
7. Verificar o efeito de `scheduledAt` nulo em dashboard (badge, ordenação) e na checagem de duplicidade.
8. Testes: `PlayerSelection.characterization`, `NewMatchPage.test`, `createdMatchId.regression`, `useNewMatchSubmissionActions.scheduled`, `schedule-check.helpers`.

### Fase 2 – Duplicidade (B2)
1. Reproduzir: simples entre A e B, depois dupla com A, B e dois parceiros, depois nova tentativa. Registrar o que ocorre na segunda (não explicado pela leitura do código).
2. `matchSuggestionService.findDuplicateMatch`: receber `matchType` e parceiros; duplas comparadas como conjuntos de dois lados (qualquer ordem); simples nunca colide com dupla.
3. `matches-post.logic.ts`: passar os novos campos; ajustar a chave do advisory lock (hoje só usa os dois jogadores).
4. `DuplicateMatchModal.tsx`: texto "no mesmo dia" e exibir o tipo (simples ou duplas) e a data da partida existente.
5. Testes: `create-match.test`, `route.test` (matches), `doublesMatchCreation.test`, novos casos simples×dupla, dupla×dupla com lados invertidos.

### Fase 3 – Nomes de dupla (C)
1. Utilitário único de abreviação ("A. Baena/A. Ruppel"), com tratamento de nome único, iniciais repetidas e nomes longos.
2. `PlayerCard` (e `aria-label`): nome da dupla abreviado em uma linha, no lugar das duas linhas atuais.
3. `ScoreboardCard` e `ScoreboardPlayerRow`: receber parceiros e usar o utilitário; ajustar largura da coluna de nome (`truncate` com `title`).
4. Testes: `PlayerCard.*`, `ScoreboardCard.*`, `design-pattern.characterization`, `scoring.page.characterization`.

### Fase 4 – Card do dashboard (A)
1. Regra do sobrescrito em um só lugar: corrigir `renderSetScore` (scoring) e `formatCompactSetScore` (dashboard) ou unificá-los, conforme a decisão da seção 1.
2. `getColumnTitles`: `BEST_OF_5` passa a Set 1 a 4 e TB.
3. `MatchCard`: usar a estrutura do `ScoreboardCard` com cores de quadra e suspenso, nomes de dupla da Fase 3 e sem pontos do game.
4. Extrair a parte visual compartilhada em vez de duplicar. Respeitar o limite de 500 linhas.
5. Testes que mudam de propósito: `match-card-utils.tiebreak-fix`, `match-card-utils.tiebreak-display`, `MatchCard.tiebreak-column`, `MatchCard.test`, `MatchCard.doubles`, testes de `getColumnTitles` e de `ScoreboardCard`.

### Fase 5 – Estatísticas avançadas (D)
Ordem sugerida: D3, D4, D6, D7, D8. Cada uma com teste antes.

- **3. Fundo de Quadra** (`baseline-stats.logic.ts`, `advanced-stats-baseline-section.tsx`).
  - Linhas: Winner, Erro Não Forçado, Erro Forçado, Aproveitamento/Total (x/y), % Aproveitamento, Pontos até 4 trocas, de 5 a 8 e acima de 9 (ganhos/total).
  - Retornar ganhos e total por faixa, não só o percentual.
- **4. Rally** (`pressure-shot-stats.ts`, `advanced-stats-rally-section.tsx`).
  - Totais por set e do jogo. Agrupar por `setNumber`.
  - Rótulos Curtos (1-4), Médios (5-8), Longos (9+).
  - Duração média = soma das trocas ÷ pontos com rally, mantendo `resolvePointEffectiveRallyLength`.
  - Corrigir o rótulo errado também em `advanced-stats-shot-section.tsx`, se estiver em uso.
- **8. Estatísticas dos Golpes** (`stroke-matrix-classify.logic.ts`, `stroke-matrix-stats.logic.ts`, seção correspondente).
  - Ordem: Sq, FH, BH, VFH, VBH, SVFH, SVBH, Sm, Drop, Lob, Bate Pronto, Aproach FH, Aproach BH.
  - Separar `aproachs` em `aproach_fh` e `aproach_bh`.
  - Linha Sq: proposta W = aces, ENF = duplas faltas, EF = 0. A confirmar (a correção 1.2 de 24/out tira ace e dupla falta dos lances do fundo).
- **9. Momentum** (`momentum-stats.ts`, `advanced-stats-momentum.tsx`).
  - Tabela por jogador com contagem de sequências exatas de 2, 3 e 4+. Hoje só existem sequências de 3 ou mais.
- **10. Breakdown por Set** (`set-breakdown-stats.ts`, `advanced-stats-set-breakdown.tsx`).
  - Manter colunas atuais e indicador TB.
  - Acrescentar tempo total do jogo (`stats.durations.totalDurationMinutes`) e duração por set (`setDurations`), que já existem.

## 5. Pontos ainda a confirmar

1. Sq: W = aces e ENF = duplas faltas, conforme proposto acima.
2. Pontos de Rede sem golpe de aproximação gravado deixam de aparecer na tabela de golpes (continuam na seção 5). Se preferir uma linha "Rede (outros)", ela entra.
3. Reprodução da Fase 2 (a segunda criação sem aviso).

## 6. Fechamento de cada fase

- `pnpm typecheck`, `pnpm test:strict`, `pnpm test:design`, `pnpm test:components`.
- Atualizar `docs/TASKS.md` e `docs/MEMORY.md`; `docs/api/CONTRACTS.md` se a assinatura de duplicidade mudar; rodar `pnpm spec:validate`.
- Um commit por fase, sem misturar fases.

