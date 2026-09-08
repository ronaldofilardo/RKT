# Análise: Timeline, Estatísticas e Armazenamento de Dados

**Data:** 08/09/2026
**Match:** cmtrdv36c0002w8mtvkiwqy9d (Eduardo vs Mateus)

---

## 1. Diagnóstico dos Problemas

### 1.1 CSV Export — Colunas com Datas em Vez de Placar

**Problema:** O CSV exportado mostra datas (01/jan, 02/jan, 03/jan, 01/fev, 02/fev, 03/jan) nas colunas "pontos" e "games" em vez de placares reais.

**Causa raiz:** O CSV é gerado **client-side** (`report-export.ts:11-33`) usando `point.gamesScore` e `point.gameScore`. Esses valores vêm de `enrichPointsFromHistory()` (`scoring-logic.ts:61-126`), que extrai de `stateBefore.sets` e `stateBefore.currentGame`.

O estado `stateBefore` vem da simulação em `simulateScoreFromPointLogs()` (`timeline-rebuild.ts:113-151`). Se o engine rejeita um ponto (catch block, linha 132), o fallback usa `lastStateBefore` — que pode conter dados corrompidos se houve edição manual de placar.

**Evidência:** A timeline visual (imagem) mostra placares corretos. O CSV tem dados corrompidos. Isso sugere que o problema está na **exportação CSV**, não na timeline visual.

**Correção necessária:** Validar que `gameScore` e `gamesScore` são sempre objetos `{player1: number, player2: number}` antes de exportar.

### 1.2 Timeline — Dados Incompletos

**Problema:** Muitos campos estão vazios no CSV e na timeline:

| Campo | Preenchidos | Total | % |
|-------|-------------|-------|---|
| situacao | ~3 | 26 | 11.5% |
| golpe | ~3 | 26 | 11.5% |
| efeito | ~2 | 26 | 7.7% |
| direcao | ~2 | 26 | 7.7% |
| zona | 0 | 26 | 0% |
| stroke | ~2 | 26 | 7.7% |
| rally_length | 26 | 26 | 100% (mas maioria = 1) |

**Causa:** O app coleta apenas dados básicos (tipo, vencedor, sacador). Detalhes de rally (zona, stroke, efeito, direção) são opcionais e raramente preenchidos.

### 1.3 Estatísticas — Limitações

**Problema:** As estatísticas avançadas dependem de dados que não existem:
- ** winners/errors por zona** → zona sempre vazia
- **winners por golpe** → golpe raramente preenchido
- **eficiência de saque** → não distingue 1º/2º saque
- **duração de rallies** → rallyDuration sempre vazio
- **break points convertidos** → depende de score state (disponível)

---

## 2. Sugestões de Melhoria

### 2.1 Armazenamento de Dados (Alta Prioridade)

| # | Melhoria | Descrição | Esforço |
|---|----------|-----------|---------|
| 1 | **Campos dedicados no PointLog** | Adicionar colunas `gameScore`, `gamesScore`, `setNumber`, `server` ao PointLog em vez de reconstruir via engine. Garante que o CSV sempre tenha dados corretos mesmo após edits manuais. | Alto |
| 2 | **Validação de gameScore no export** | No `report-export.ts`, validar que `point.gameScore` é `{player1: number, player2: number}` antes de formatar. Se não for, usar fallback `"?"`. | Baixo |
| 3 | **强制 preenchimento de situacao** | No frontend, tornar "situação" obrigatória (saque, devolução, passada). Isso garante que 100% dos pontos tenham classificação. | Baixo |
| 4 | **Rally length automático** | Calcular `rallyLength` automaticamente: ACE/DF = 1, devolução = 2, Winner/ENF = countdown do server. | Médio |

### 2.2 Timeline (Média Prioridade)

| # | Melhoria | Descrição | Esforço |
|---|----------|-----------|---------|
| 5 | **Coluna "Onde Errou" visível** | A timeline visual não mostra a coluna "Onde Errou" (ONDE_ERROU). Adicionar para complementar "Subtipo". | Baixo |
| 6 | **Destaque visual para Break Points** | Coloreir pontos de break point de vermelho na timeline para facilitar identificação. | Baixo |
| 7 | **Agrupamento por game** | Adicionar separadores visuais entre games (não apenas entre sets e edits). | Médio |
| 8 | **Preview de áudio inline** | Na timeline, mostrar player de áudio ao lado da nota (em vez de apenas "sim/não"). | Médio |

### 2.3 Estatísticas (Média Prioridade)

| # | Melhoria | Descrição | Esforço |
|---|----------|-----------|---------|
| 9 | **Winners por zona** | Disponível quando zona for preenchida. Mostrar mapa de calor (esquerda/direita/centro). | Médio |
| 10 | **Eficiência de saque** | Separar ACE vs DF vs First Serve Fault. Mostrar % de 1º saque dentro. | Baixo |
| 11 | **Break Points Convertidos** | Calcular: pontos de break → games quebrados. | Baixo |
| 12 | **Duração média de rallies** | Usar `rallyDuration` quando disponível. | Baixo |
| 13 | **Winners vs Unforced Errors ratio** | Razão entre Winner e UNFORCED_ERROR por jogador. | Baixo |

### 2.4 Qualidade dos Dados (Baixa Prioridade)

| # | Melhoria | Descrição | Esforço |
|---|----------|-----------|---------|
| 14 | **Backfill de dados legados** | Script para preencher `gameScore`/`gamesScore` em PointLogs antigos usando o engine. | Médio |
| 15 | **Validação de DF** | Já implementada (DF_WINNER_MUST_BE_RECEIVER). Confirmar que impede DFs impossíveis. | ✅ Feito |
| 16 | **Relatório de completude** | Adicionar % de campos preenchidos ao `buildReportIntegrity`. | Baixo |

---

## 3. Priorização Recomendada

### Fase 1 — Correções Imediatas (esta semana)
1. **#2** — Validar gameScore no export (corrigir CSV corrompido)
2. **#3** — Tornar "situação" obrigatória no frontend
3. **#4** — Rally length automático

### Fase 2 — Curto prazo (próximas 2 semanas)
4. **#1** — Campos dedicados no PointLog (migration Prisma)
5. **#10** — Eficiência de saque
6. **#11** — Break Points Convertidos
7. **#13** — Winners vs UE ratio

### Fase 3 — Médio prazo (próximo mês)
8. **#6** — Destaque visual para BP
9. **#7** — Agrupamento por game
10. **#9** — Winners por zona (quando dados disponíveis)

---

## 4. Dados do Match para Referência

### Qualidade dos Dados Inseridos

| Métrica | Valor | Avaliação |
|---------|-------|-----------|
| Total de pontos | 26 | ✅ |
| Pontos com situação | 3/26 (11.5%) | ⚠️ Baixo |
| Pontos com golpe | 3/26 (11.5%) | ⚠️ Baixo |
| Pontos com zona | 0/26 (0%) | ❌ Nenhum |
| Pontos com stroke | 2/26 (7.7%) | ⚠️ Baixo |
| Rally length médio | 1.08 | ⚠️ Suspeito (ACE/DF = 1) |
| Pontos com áudio | 1/26 (3.8%) | ⚠️ Baixo |
| Segment breaks | 5 | ✅ (7 edits, 2 sobrepostos) |
| Dados de DF corretos | 10/10 (100%) | ✅ (após correção) |

### Distribuição por Tipo

| Tipo | Quantidade | % |
|------|------------|---|
| ACE | 11 | 42.3% |
| DOUBLE_FAULT | 10 | 38.5% |
| UNFORCED_ERROR | 2 | 7.7% |
| WINNER | 1 | 3.8% |
| RALLY | 0 | 0% |

**Observação:** 80.8% dos pontos são ACE ou DF — unusually high. Isso sugere que o anotador estava marcando apenas saques, não rallies completos. A melhoria #3 (situação obrigatória) ajudaria a forçar anotação mais detalhada.
